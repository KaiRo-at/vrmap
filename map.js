var tileZoom = 19;
var centerPos = {
  latitude: 48.18594,
  longitude: 16.34177,
}
var map, tiles, items;
var baseTileID, baseTileSize;
var tilesFromCenter = 3;

window.onload = function() {
  map = document.querySelector("#map");
  tiles = document.querySelector("#tiles");
  items = document.querySelector("#items");
  loadGroundTiles();
  loadTrees();
}

function tileIDFromLatlon(latlon) {
  /* Get tile x/y numbers from degree-based latitude/longitude values */
  var n = Math.pow(2, tileZoom);
  var lat_rad = latlon.latitude / 180 * Math.PI;
  var xtile = Math.floor(n * ((latlon.longitude + 180) / 360));
  var ytile = Math.floor(n * (1 - (Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) / 2);
  return {x: xtile, y: ytile};
}

function posFromLatlon(latlon) {
  /* Get position x/z numbers from degree-based latitude/longitude values */
  var n = Math.pow(2, tileZoom);
  var lat_rad = latlon.latitude / 180 * Math.PI;
  var xtilepos = n * ((latlon.longitude + 180) / 360);
  var ytilepos = n * (1 - (Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) / 2;
  return {x: baseTileSize * (xtilepos - baseTileID.x),
          z: baseTileSize * (ytilepos - baseTileID.y)};
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

function getTagsForXMLFeature(xmlFeature) {
  var tags = {};
  for (tag of xmlFeature.children) {
    if (tag.nodeName == "tag") {
      tags[tag.attributes['k'].value] = tag.attributes['v'].value;
    }
  }
  return tags;
}

function loadTrees() {
  var startPos = latlonFromTileID({x: baseTileID.x - tilesFromCenter,
                                   y: baseTileID.y + tilesFromCenter});
  var endPos = latlonFromTileID({x: baseTileID.x + tilesFromCenter,
                                 y: baseTileID.y - tilesFromCenter});
  var url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(
      "node[natural=tree]"
      + "("
      + startPos.latitude + "," + startPos.longitude + ","
      + endPos.latitude + "," + endPos.longitude
      + ");" + "out;"
  );
  return fetch(url)
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
      //var itemJSON = osmtogeojson(itemData); // if we ever want to do geoJSON here
      for (feature of itemData.children[0].children) {
        if (feature.nodeName == "node") {
          addTree(feature);
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

function addTree(xmlFeature) {
  return new Promise((resolve, reject) => {
    var itemPos = posFromLatlon({latitude: Number(xmlFeature.attributes['lat'].value),
                                 longitude: Number(xmlFeature.attributes['lon'].value)});
    var tags = getTagsForXMLFeature(xmlFeature);
    var item = document.createElement("a-entity");
    var height = tags.height ? tags.height : 8;
    var trunkRadius = (tags.circumference ? tags.circumference : 1) / 2 / Math.PI;
    var crownRadius = (tags.diameter_crown ? tags.diameter_crown : 4) / 2;
    item.setAttribute("geometry", "primitive: cylinder; height: " + height + "; radius: " + trunkRadius + ";");
    item.setAttribute("material", "color: #80FF80;");
    item.setAttribute("shadow", "");
    item.setAttribute("position", "" + itemPos.x + " 0 " + itemPos.z);
    item.setAttribute("data-gpspos", xmlFeature.attributes['lat'].value + "/" + xmlFeature.attributes['lon'].value);
    item.addEventListener('click', function (event) {
      console.log("Tree at " + event.target.getAttribute('data-gpspos'));
    });
    items.appendChild(item);
    resolve();
    // reject("whatever the error");
  });
}

function addTile(relX, relY) {
  return new Promise((resolve, reject) => {
    var tile = document.createElement("a-plane");
    tile.setAttribute("rotation", "-90 0 0");
    tile.setAttribute("shadow", "");
    tile.setAttribute("position", "" + (baseTileSize * (relX + 0.5)) + " 0 " + (baseTileSize * (relY + 0.5)));
    tile.setAttribute("src", "https://tilecache.kairo.at/mapnik/" + tileZoom + "/" + (baseTileID.x + relX) + "/" + (baseTileID.y + relY) + ".png");
    tile.setAttribute("width", baseTileSize);
    tile.setAttribute("height", baseTileSize);
    tiles.appendChild(tile);
    resolve();
    // reject("whatever the error");
  });
}
