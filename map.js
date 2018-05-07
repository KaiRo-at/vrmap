var tileZoom = 19;
var centerPos = {
  latitude: 48.18601,
  longitude: 16.34174,
}
var tiles = {};
var map;
var baseTileID, baseTileSize;

window.onload = function() {
  map = document.querySelector("#map");
  baseTileID = tileIDFromLatlon(centerPos.latitude, centerPos.longitude);
  baseTileSize = tilesizeFromID(baseTileID);
  var tilesFromCenter = 3;
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

function tileIDFromLatlon(latitude_degree, longitude_degree) {
  /* Get tile x/y numbers from degree-based latitude/longitude values */
  var n = Math.pow(2, tileZoom);
  var lat_rad = latitude_degree / 180 * Math.PI;
  var xtile = Math.floor(n * ((longitude_degree + 180) / 360));
  var ytile = Math.floor(n * (1 - (Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) / 2);
  return {x: xtile, y: ytile};
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

function addTile(relX, relY) {
  var tile = document.createElement("a-plane");
  tile.setAttribute("rotation", "-90 0 0");
  tile.setAttribute("shadow");
  tile.setAttribute("position", "" + (baseTileSize * relX) + " 0 " + (baseTileSize * relY));
  tile.setAttribute("src", "https://tilecache.kairo.at/mapnik/" + tileZoom + "/" + (baseTileID.x + relX) + "/" + (baseTileID.y + relY) + ".png");
  tile.setAttribute("width", baseTileSize);
  tile.setAttribute("height", baseTileSize);
  map.appendChild(tile);
}
