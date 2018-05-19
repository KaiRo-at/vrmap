/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

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

function addTile(relX, relY) {
  return new Promise((resolve, reject) => {
    var tile = document.createElement("a-plane");
    tile.setAttribute("class", "tile");
    tile.setAttribute("rotation", "-90 0 0");
    //tile.setAttribute("shadow", "");
    tile.setAttribute("position", getPositionStringFromTilepos({x: relX, y: relY}, {x: 0.5, y: 0.5}));
    tile.setAttribute("src", tileServer + tileZoom + "/" + (baseTileID.x + relX) + "/" + (baseTileID.y + relY) + ".png");
    tile.setAttribute("width", baseTileSize);
    tile.setAttribute("height", baseTileSize);
    tiles.appendChild(tile);
    resolve();
    // reject("whatever the error");
  });
}
