/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function loadTrees() {
  var opQuery = "node[natural=tree]" + "(" + getBoundingBoxString() + ");" +
                "out;";
  return fetchFromOverpass(opQuery)
    .then((itemJSON) => {
      var count = 0;
      for (feature of itemJSON.features) {
        if (feature.geometry.type == "Point") {
          addTree(feature);
          count++;
        }
        else {
          console.log("Couldn't draw tree with geometry type " +
                      feature.geometry.type + " (" + feature.id + ")");
        }
      }
      console.log("Loaded " + count + " trees.");
    })
    .catch((reason) => { console.log(reason); });
}

function addTree(jsonFeature) {
  return new Promise((resolve, reject) => {
    var itemPos = tileposFromLatlon(latlonFromJSON(jsonFeature.geometry.coordinates));
    var tags = jsonFeature.properties.tags ? jsonFeature.properties.tags : jsonFeature.properties;
    var item = document.createElement("a-entity");
    item.setAttribute("class", "tree");
    item.setAttribute("data-reltilex", Math.floor(itemPos.x));
    item.setAttribute("data-reltiley", Math.floor(itemPos.y));
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
      trunk.setAttribute("geometry", {primitive: "cylinder", height: trunkHeight, radius: trunkRadius});
      trunk.setAttribute("material", {color: "#b27f36"});
      trunk.setAttribute("position", {x: 0, y: (trunkHeight / 2), z: 0});
      crown.setAttribute("geometry", {primitive: "cone", height: crownHeight, radiusBottom: crownRadius, radiusTop: 0});
      crown.setAttribute("material", {color: "#80ff80"});
      crown.setAttribute("position", {x: 0, y: (height - crownHeight / 2), z: 0});
    }
    else { // use a simple typical broadleaved-type shape
      var trunkHeight = height - crownRadius;
      trunk.setAttribute("geometry", {primitive: "cylinder", height: trunkHeight, radius: trunkRadius});
      trunk.setAttribute("material", {color: "#b27f36"});
      trunk.setAttribute("position", {x: 0, y: (trunkHeight / 2), z: 0});
      crown.setAttribute("geometry", {primitive: "sphere", radius: crownRadius});
      crown.setAttribute("material", {color: "#80ff80"});
      crown.setAttribute("position", {x: 0, y: trunkHeight, z: 0});
    }
    item.setAttribute("position", getPositionFromTilepos(itemPos));
    item.setAttribute("data-gpspos", jsonFeature.geometry.coordinates[1] + "/" + jsonFeature.geometry.coordinates[0]);
    item.appendChild(trunk);
    item.appendChild(crown);
    items.appendChild(item);
    resolve();
    // reject("whatever the error");
  });
}
