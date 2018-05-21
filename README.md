# VR Map
A WebVR demo that presents OpenStreetMap data in a virtual reality environment
right inside the browser.

The VR environment is built with Mozilla's A-Frame library, with some components
added to the default set, and sometimes reaching to Three.js underneath to
achieve some things that A-Frame doesn't support by itself.

Currently, three types of objects are being displayed:

 * **Tiles**: The ground layer is using OpenStreetMap Mapnik tiles via KaiRo's
   tilecache server. Each tiles uses a single <a-plane>, sized appropriately for
   tiles at the given coordinates.
 * **Trees**: `node`s with `natural=tree` tags are rendered as trees, taking
   into account `height`, `circumference` and `diameter_crown` for sizing as
   well as `leaf_type` for using a standard `needleleaved` or `broadleaved` (for
   everything else) tree template.
 * **Buildings**: Any `way` or `relation` with a `building` tag is rendered as a
   building. Its outline (with appropriate holes if required) is extruded to the
   `height` (or `building:levels` multiplied by 3), with a default height of 15m
   (or outline length divided by 5 if that's smaller). `min_height` and
   `building:min_level` as well as `building:colour` are respected, but building
   parts or roofs are not supported (yet).

General limitations:

 * The initial center coordinate set is hardcoded. While the code supports GPS
   coordinates from around the world, the default right now is just outside
   KaiRo's front door in Vienna, Austria.
 * Only a small area is loaded by default and no further data is added as you
   move around.
