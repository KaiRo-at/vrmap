var tileZoom = 19;
var centerPos = {
  latitude: 48.18594,
  longitude: 16.34177,
}
var map, tiles, items;
var baseTileID, baseTileSize, centerOffset;
var tilesFromCenter = 3;
var metersPerLevel = 3;

// Mapnik is the default world-wide OpenStreetMap style.
var tileServer = "https://tilecache.kairo.at/mapnik/";
// Basemap offers hires tiles for Austria.
//var tileServer = "https://tilecache.kairo.at/basemaphires/";
// Standard Overpass API Server
var overpassURL = "https://overpass-api.de/api/interpreter";

window.onload = function() {
  map = document.querySelector("#map");
  tiles = document.querySelector("#tiles");
  items = document.querySelector("#items");
  loadGroundTiles();
  loadTrees();
  loadBuildings();
}

function tileIDFromLatlon(latlon) {
  /* Get tile x/y numbers from degree-based latitude/longitude values */
  var n = Math.pow(2, tileZoom);
  var lat_rad = latlon.latitude / 180 * Math.PI;
  var xtile = Math.floor(n * ((latlon.longitude + 180) / 360));
  var ytile = Math.floor(n * (1 - (Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) / 2);
  return {x: xtile, y: ytile};
}

function tileposFromLatlon(latlon) {
  /* Get position x/z numbers from degree-based latitude/longitude values */
  var n = Math.pow(2, tileZoom);
  var lat_rad = latlon.latitude / 180 * Math.PI;
  var xtilepos = n * ((latlon.longitude + 180) / 360);
  var ytilepos = n * (1 - (Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) / 2;
  return {x: xtilepos - baseTileID.x,
          y: ytilepos - baseTileID.y};
}

function tilesizeFromID(tileid) {
  /* Get a tile size in meters from x/y tile numbers */
  /* tileid is an object with x and y members telling the slippy map tile ID */
  var equatorSize = 40075016.686; // in meters
  var n = Math.pow(2, tileZoom);
  var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileid.y / n)));
  var tileSize = equatorSize * Math.cos(lat_rad) / n;
  return tileSize;
}

function latlonFromTileID(tileid) {
  var latlon = {
    latitude: null,
    longitude: null,
  }
  var n = Math.pow(2, tileZoom);
  latlon.longitude = tileid.x / n * 360 - 180;
  var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileid.y / n)));
  latlon.latitude = lat_rad * 180 / Math.PI;
  return latlon;
}

function latlonFromJSON(jsonCoordinates) {
  return {latitude: jsonCoordinates[1],
          longitude: jsonCoordinates[0]};
}

function getTagsForXMLFeature(xmlFeature) {
  var tags = {};
  for (tag of xmlFeature.children) {
    if (tag.nodeName == "tag") {
      tags[tag.attributes['k'].value] = tag.attributes['v'].value;
    }
  }
  return tags;
}

function getPositionFromTilepos(tilepos, offset) {
  if (!offset) {
    offset = {x: 0, y: 0};
  }
  if (!centerOffset) {
    centerOffset = tileposFromLatlon(centerPos);
  }
  posresult = {
    x: baseTileSize * (tilepos.x + offset.x - centerOffset.x),
    y: baseTileSize * (tilepos.y + offset.y - centerOffset.y),
  }
  return {x: posresult.x,
          y: 0,
          z: posresult.y};
}

function getRelativePositionFromTilepos(tilepos, reference) {
  posresult = {
    x: baseTileSize * (tilepos.x - reference.x),
    y: baseTileSize * (tilepos.y - reference.y),
  }
  return {x: posresult.x,
          y: 0,
          z: posresult.y};
}

function getPositionStringFromTilepos(tilepos, offset) {
  var pos = getPositionFromTilepos(tilepos, offset);
  return "" + pos.x + " " + pos.y + " " + pos.z;
}

function getBoundingBoxString() {
  var startPos = latlonFromTileID({x: baseTileID.x - tilesFromCenter,
                                   y: baseTileID.y + tilesFromCenter + 1});
  var endPos = latlonFromTileID({x: baseTileID.x + tilesFromCenter + 1,
                                 y: baseTileID.y - tilesFromCenter});
  return startPos.latitude + "," + startPos.longitude + "," +
         endPos.latitude + "," + endPos.longitude;
}

function fetchFromOverpass(opQuery) {
  return new Promise((resolve, reject) => {
    fetch(overpassURL + "?data=" + encodeURIComponent(opQuery))
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      else {
        throw "HTTP Error " + response.status;
      }
    })
    .then((response) => {
      var parser = new DOMParser();
      var itemData = parser.parseFromString(response, "application/xml");
      var itemJSON = osmtogeojson(itemData);
      resolve(itemJSON);
    })
    .catch((reason) => { reject(reason); });
  });
}

function loadTrees() {
  var opQuery = "node[natural=tree]" + "(" + getBoundingBoxString() + ");" +
                "out;";
  return fetchFromOverpass(opQuery)
    .then((itemJSON) => {
      for (feature of itemJSON.features) {
        if (feature.geometry.type == "Point") {
          addTree(feature);
        }
        else {
          console.log("Couldn't draw tree with geometry type " +
                      feature.geometry.type);
        }
      }
    })
    .catch((reason) => { console.log(reason); });
}

function loadBuildings() {
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
          console.log("Couldn't draw tree with geometry type " +
                      feature.geometry.type);
        }
      }
    })
    .catch((reason) => { console.log(reason); });
}

function loadGroundTiles() {
  baseTileID = tileIDFromLatlon(centerPos);
  baseTileSize = tilesizeFromID(baseTileID);
  for (let relX = 0; relX < tilesFromCenter + 1; relX++) {
    for (let relY = 0; relY < tilesFromCenter + 1; relY++) {
      addTile(relX, relY);
      if (relX > 0) {
        addTile(-relX, relY);
      }
      if (relY > 0) {
        addTile(relX, -relY);
      }
      if (relX > 0 && relY > 0) {
        addTile(-relX, -relY);
      }
    }
  }
}

function addTree(jsonFeature) {
  return new Promise((resolve, reject) => {
    var itemPos = tileposFromLatlon(latlonFromJSON(jsonFeature.geometry.coordinates));
    var tags = jsonFeature.properties.tags ? jsonFeature.properties.tags : jsonFeature.properties;
    var item = document.createElement("a-entity");
    item.setAttribute("class", "tree");
    var trunk = document.createElement("a-entity");
    trunk.setAttribute("class", "trunk");
    var crown = document.createElement("a-entity");
    crown.setAttribute("class", "crown");
    var height = tags.height ? tags.height : 8;
    var trunkRadius = (tags.circumference ? tags.circumference : 1) / 2 / Math.PI;
    var crownRadius = (tags.diameter_crown ? tags.diameter_crown : 3) / 2;
    // leaf_type is broadleaved, needleleaved, mixed or rarely something else.
    if (tags["leaf_type"] == "needleleaved") { // special shape for needle-leaved trees
      var trunkHeight = height * 0.5;
      var crownHeight = height * 0.8;
      trunk.setAttribute("geometry", "primitive: cylinder; height: " + trunkHeight + "; radius: " + trunkRadius + ";");
      trunk.setAttribute("material", "color: #b27f36;");
      trunk.setAttribute("position", "0 " + (trunkHeight / 2) + " 0");
      crown.setAttribute("geometry", "primitive: cone; height: " + crownHeight + "; radiusBottom: " + crownRadius + "; radiusTop: 0;");
      crown.setAttribute("material", "color: #80ff80;");
      crown.setAttribute("position", "0 " + (height - crownHeight / 2) + " 0");
    }
    else { // use a simple typical broadleaved-type shape
      var trunkHeight = height - crownRadius;
      trunk.setAttribute("geometry", "primitive: cylinder; height: " + trunkHeight + "; radius: " + trunkRadius + ";");
      trunk.setAttribute("material", "color: #b27f36;");
      trunk.setAttribute("position", "0 " + (trunkHeight / 2) + " 0");
      crown.setAttribute("geometry", "primitive: sphere; radius: " + crownRadius + ";");
      crown.setAttribute("material", "color: #80ff80;");
      crown.setAttribute("position", "0 " + trunkHeight + " 0");
    }
    item.setAttribute("shadow", "");
    item.setAttribute("position", getPositionStringFromTilepos(itemPos));
    item.setAttribute("data-gpspos", jsonFeature.geometry.coordinates[1] + "/" + jsonFeature.geometry.coordinates[0]);
    item.addEventListener('click', function (event) {
      console.log("Tree at " + event.target.parentElement.getAttribute('data-gpspos'));
    });
    item.appendChild(trunk);
    item.appendChild(crown);
    items.appendChild(item);
    resolve();
    // reject("whatever the error");
  });
}

function addBuilding(jsonFeature) {
  return new Promise((resolve, reject) => {
    var itemPos = tileposFromLatlon(latlonFromJSON(jsonFeature.geometry.coordinates[0][0]));
    var tags = jsonFeature.properties.tags ? jsonFeature.properties.tags : jsonFeature.properties;
    var item = document.createElement("a-entity");
    item.setAttribute("class", "building");
    var height = tags.height ? tags.height : null;
    if (!height && tags["building:levels"]) {
      height = tags["building:levels"] * metersPerLevel;
    }
    var minHeight = tags.min_height ? tags.min_height : null;
    if (!minHeight && tags["building:min_level"]) {
      minHeight = tags["building:min_level"] * metersPerLevel;
    }
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
                                  (height ? "height: " + height : "") +
                                  (minHeight ? "minHeight: " + minHeight : ""));
    var color = tags["building:colour"] ? tags["building:colour"] : "#d9c0d9;"
    item.setAttribute("material", "color: " + color + ";");
    item.setAttribute("shadow", "");
    item.setAttribute("position", getPositionStringFromTilepos(itemPos));
    item.setAttribute("data-gpspos", jsonFeature.geometry.coordinates[0][0][1] + "/" + jsonFeature.geometry.coordinates[0][0][0]);
    item.addEventListener('click', function (event) {
      console.log("Building at " + event.target.getAttribute('data-gpspos'));
    });
    items.appendChild(item);
    resolve();
    // reject("whatever the error");
  });
}

function addTile(relX, relY) {
  return new Promise((resolve, reject) => {
    var tile = document.createElement("a-plane");
    tile.setAttribute("class", "tile");
    tile.setAttribute("rotation", "-90 0 0");
    tile.setAttribute("shadow", "");
    tile.setAttribute("position", getPositionStringFromTilepos({x: relX, y: relY}, {x: 0.5, y: 0.5}));
    tile.setAttribute("src", tileServer + tileZoom + "/" + (baseTileID.x + relX) + "/" + (baseTileID.y + relY) + ".png");
    tile.setAttribute("width", baseTileSize);
    tile.setAttribute("height", baseTileSize);
    tiles.appendChild(tile);
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
