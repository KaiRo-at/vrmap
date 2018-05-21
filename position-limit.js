/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

AFRAME.registerComponent('position-limit', {
  schema: {
    xmin: { type: 'number', default: undefined },
    xmax: { type: 'number', default: undefined },
    ymin: { type: 'number', default: undefined },
    ymax: { type: 'number', default: undefined },
    zmin: { type: 'number', default: undefined },
    zmax: { type: 'number', default: undefined },
  },

  tick: function (time, timeDelta) {
    if (this.data.xmin !== undefined &&
        this.el.object3D.position.x < this.data.xmin) {
      this.el.object3D.position.x = this.data.xmin;
    }
    if (this.data.xmax !== undefined &&
        this.el.object3D.position.x > this.data.xmax) {
      this.el.object3D.position.x = this.data.xmax;
    }
    if (this.data.ymin !== undefined &&
        this.el.object3D.position.y < this.data.ymin) {
      this.el.object3D.position.y = this.data.ymin;
    }
    if (this.data.ymax !== undefined &&
        this.el.object3D.position.y > this.data.ymax) {
      this.el.object3D.position.y = this.data.ymax;
    }
    if (this.data.zmin !== undefined &&
        this.el.object3D.position.z < this.data.zmin) {
      this.el.object3D.position.z = this.data.zmin;
    }
    if (this.data.zmax !== undefined &&
        this.el.object3D.position.z > this.data.zmax) {
      this.el.object3D.position.z = this.data.zmax;
    }
  },
});
