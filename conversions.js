/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

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
  // This is for generating the string used in a position attribute - but should not be needed in practice as setAttribute() can take an object.
  var pos = getPositionFromTilepos(tilepos, offset);
  return "" + pos.x + " " + pos.y + " " + pos.z;
}
