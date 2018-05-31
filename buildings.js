/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var metersPerLevel = 3;
var roofOnlyTypes = ["roof", "carport", "grandstand"];
var ignoredTypes = ["entrance", "collapsed", "destroyed", "proposed", "no"];
var singleLevelTypes = ["grandstand", "houseboat", "bungalow", "static_caravan",
  "kiosk", "cabin", "chapel", "shrine", "bakehouse", "bridge", "bunker",
  "carport", "cowshed", "garage", "garages", "gabage_shed", "hut", "roof",
  "shed", "stable", "sty", "service", "shelter"];
var specialDefaults = {
  construction: {"building:colour": "#808080"},
  house: {"building:levels": 2},
  farm: {"building:levels": 2},
  detached: {"building:levels": 2},
  terrace: {"building:levels": 2},
  transformer_tower: {"height": 10},
  water_tower: {"height": 20},
};

function loadBuildings() {
  // we could think about including shelter=yes and maybe some amenity= types.
  var opQuery = "(way[building]" + "(" + getBoundingBoxString() + ");" +
                "rel[building]" + "(" + getBoundingBoxString() + "););" +
                "out body;>;out skel qt;";
  return fetchFromOverpass(opQuery)
    .then((itemJSON) => {
      for (feature of itemJSON.features) {
        if (feature.geometry.type == "Polygon") {
          addBuilding(feature);
        }
        else {
          console.log("Couldn't draw building with geometry type " +
                      feature.geometry.type);
        }
      }
    })
    .catch((reason) => { console.log(reason); });
}

function addBuilding(jsonFeature) {
  return new Promise((resolve, reject) => {
    var itemPos = tileposFromLatlon(latlonFromJSON(jsonFeature.geometry.coordinates[0][0]));
    var tags = jsonFeature.properties.tags ? jsonFeature.properties.tags : jsonFeature.properties;
    var btype = tags.building;
    if (tags.shelter == "yes") { btype = "shelter"; }
    if (ignoredTypes.includes(btype)) { resolve(); return; }

    var height = tags.height ? tags.height : null;
    if (!height && tags["building:levels"]) {
      height = tags["building:levels"] * metersPerLevel;
    }
    else if (!height && btype in specialDefaults && specialDefaults[btype].height) {
      height = specialDefaults[btype].height;
    }
    else if (!height && btype in specialDefaults && specialDefaults[btype]["building:levels"]) {
      height = specialDefaults[btype]["building:levels"] * metersPerLevel;
    }
    else if (!height && singleLevelTypes.includes(btype)) {
      height = metersPerLevel; // assume one level only
    }

    var minHeight = tags.min_height ? tags.min_height : null;
    if (!minHeight && tags["building:min_level"]) {
      minHeight = tags["building:min_level"] * metersPerLevel;
    }
    else if (!minHeight && btype in specialDefaults && specialDefaults[btype]["building:min_level"]) {
      minHeight = specialDefaults[btype]["building:min_level"] * metersPerLevel;
    }
    else if (!minHeight && roofOnlyTypes.includes(btype)) {
      if (!height) { height = metersPerLevel; /* assume one level only */ }
      minHeight = height - 0.3;
    }

    var color = "#d9c0d9";
    if (tags["building:colour"]) {
      color = tags["building:colour"];
    }
    else if (btype in specialDefaults && specialDefaults[btype]["building:colour"]) {
      color = specialDefaults[btype]["building:colour"];
    }

    var item = document.createElement("a-entity");
    item.setAttribute("class", "building");
    var outerPoints = [];
    var innerWays = [];
    for (let way of jsonFeature.geometry.coordinates) {
      let wayPoints = [];
      for (let point of way) {
        let tpos = tileposFromLatlon(latlonFromJSON(point));
        let ppos = getRelativePositionFromTilepos(tpos, itemPos);
        wayPoints.push("" + ppos.x + " " + ppos.z);
      }
      if (!outerPoints.length) {
        outerPoints = wayPoints;
      }
      else {
        innerWays.push(wayPoints);
      }
    }
    // Note that for now only one inner way (hole) is supported.
    item.setAttribute("geometry", "primitive: building; outerPoints: " + outerPoints.join(", ") + "; " +
                                  (innerWays.length ? "innerPaths: " + innerWays.map(x => x.join(", ")).join(" / ") + "; " : "") +
                                  (height ? "height: " + height + "; " : "") +
                                  (minHeight ? "minHeight: " + minHeight + "; " : ""));
    item.setAttribute("material", "color: " + color + ";");
    item.setAttribute("position", getPositionStringFromTilepos(itemPos));
    item.setAttribute("data-gpspos", jsonFeature.geometry.coordinates[0][0][1] + "/" + jsonFeature.geometry.coordinates[0][0][0]);
    items.appendChild(item);
    resolve();
    // reject("whatever the error");
  });
}

AFRAME.registerGeometry('building', {
  schema: {
    outerPoints: { type: 'array', default: ['0 0', '1 0', '1 1', '0 1'], },
    innerPaths: {
      parse: function (value) {
        return value.length ? value.split('/').map(part => part.split(",").map(val => val.trim())) : [];
      },
      default: [],
    },
    height: { type: 'number', default: 0 },
    minHeight: { type: 'number', default: 0 },
  },

  init: function (data) {
    var opoints = data.outerPoints.map(function (point) {
        var coords = point.split(' ').map(x => parseFloat(x));
        return new THREE.Vector2(coords[0], coords[1]);
    });
    var ipaths = data.innerPaths.map(way => way.map(function (point) {
        var coords = point.split(' ').map(x => parseFloat(x));
        return new THREE.Vector2(coords[0], coords[1]);
    }));
    var shape = new THREE.Shape(opoints);
    var outerLength = shape.getLength();
    if (ipaths.length) {
      for (ipoints of ipaths) {
        var holePath = new THREE.Path(ipoints);
        shape.holes.push(holePath);
      }
    }
    // Extrude from a 2D shape into a 3D object with a height.
    var height = data.height - data.minHeight;
    if (!height) {
      height = Math.min(10, outerLength / 5);
    }
    var geometry = new THREE.ExtrudeGeometry(shape, {amount: height, bevelEnabled: false});
    // As Y is the coordinate going up, let's rotate by 90° to point Z up.
    geometry.rotateX(-Math.PI / 2);
    // Rotate around Y and Z as well to make it show up correctly.
    geometry.rotateY(Math.PI);
    geometry.rotateZ(Math.PI);
    // Now we would point under ground, move up the height, and any above-ground space as well.
    geometry.translate (0, height + data.minHeight, 0);
    geometry.center;
    this.geometry = geometry;
  }
});
