var tileZoom = 19;

window.onload = function() {
  var latitude = 48.18601;
  var longitude = 16.34174;
  var tileID = tileIDFromLatlon(latitude, longitude);
  var tilesize = tilesizeFromID(tileID);
  document.querySelector("a-plane").setAttribute("src", "https://tilecache.kairo.at/mapnik/" + tileZoom + "/" + tileID.x + "/" + tileID.y + ".png");
  document.querySelector("a-plane").setAttribute("width", tilesize);
  document.querySelector("a-plane").setAttribute("height", tilesize);
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
