/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function loadGroundTiles() {
  baseTileID = tileIDFromLatlon(centerPos);
  baseTileSize = tilesizeFromID(baseTileID);
  var count = 0;
  for (let relX = 0; relX < tilesFromCenter + 1; relX++) {
    for (let relY = 0; relY < tilesFromCenter + 1; relY++) {
      addTile(relX, relY);
      count++;
      if (relX > 0) {
        addTile(-relX, relY);
        count++;
      }
      if (relY > 0) {
        addTile(relX, -relY);
        count++;
      }
      if (relX > 0 && relY > 0) {
        addTile(-relX, -relY);
        count++;
      }
    }
  }
  console.log("Loaded " + count + " tiles.");
}

function addTile(relX, relY) {
  return new Promise((resolve, reject) => {
    var tile = document.createElement("a-plane");
    tile.setAttribute("class", "tile");
    tile.setAttribute("data-reltilex", relX);
    tile.setAttribute("data-reltiley", relY);
    tile.setAttribute("rotation", {x: -90, y: 0, z: 0});
    tile.setAttribute("position", getPositionFromTilepos({x: relX, y: relY}, {x: 0.5, y: 0.5}));
    tile.setAttribute("src", tileServer + tileZoom + "/" + (baseTileID.x + relX) + "/" + (baseTileID.y + relY) + ".png");
    tile.setAttribute("width", baseTileSize);
    tile.setAttribute("height", baseTileSize);
    tiles.appendChild(tile);
    resolve();
    // reject("whatever the error");
  });
}
