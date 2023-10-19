import { addComponent, removeComponent } from "bitecs";
import { ConnectPairs, ConnectPairsPuzzle } from "../bit-components";

AFRAME.registerComponent("connect-pairs", {
  schema: {
    pair: { type: "number", default: 1 },
    side: { type: "string", default: "left", oneof: ["left", "right"] }
  },

  init() {
    addComponent(APP.world, ConnectPairs, this.el.object3D.eid);
  },

  update() {
    ConnectPairs.pair[this.el.eid] = this.data.pair;
    ConnectPairs.side[this.el.eid] = this.data.side;
  },

  remove() {
    removeComponent(APP.world, ConnectPairs, this.el.object3D.eid);
  }
});

AFRAME.registerComponent("connect-pairs-puzzle", {
  schema: {
    unlock: { type: "selector" }
  },

  init() {
    addComponent(APP.world, ConnectPairsPuzzle, this.el.object3D.eid);
  },

  update() {
    ConnectPairsPuzzle.unlockRef[this.el.eid] = this.data.unlock.eid;
  },

  remove() {
    removeComponent(APP.world, ConnectPairsPuzzle, this.el.object3D.eid);
  }
});