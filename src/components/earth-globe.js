import { THREE } from "aframe";
import { Vector3 } from "three";
import { waitForDOMContentLoaded } from "../utils/async-utils";

AFRAME.registerComponent("earth-globe", {
  schema: {
    bumpMap: { type: "string", default: "" },
    jsonDataUrl: { type: "string", default: "" }
  },
  init() {
    const { mesh } = this.el.object3DMap;
    if (this.data.bumpMap) {
      const loader = new THREE.TextureLoader();
      loader.loadAsync(this.data.bumpMap).then(texture => {
        mesh.material.bumpMap = texture;
        mesh.material.bumpScale = 0.05;
        mesh.material.needsUpdate = true;
      });
    }
    let leftHand, rightHand;

    waitForDOMContentLoaded().then(() => {
      leftHand = document.getElementById("player-left-controller");
      rightHand = document.getElementById("player-right-controller");
    });
    this.onGrabStart = e => {
      if (!leftHand || !rightHand) return;
      const transformSystem = this.el.sceneEl.systems["transform-selected-object"];
      transformSystem.startTransform(
        this.el.object3D,
        e.object3D.el.id === "right-cursor"
          ? rightHand.object3D
          : e.object3D.el.id === "left-cursor"
            ? leftHand.object3D
            : e.object3D,
        { mode: "axis", axis: new Vector3(0, 1, 0) }
      );
    };
    this.onGrabEnd = () => {
      const transformSystem = this.el.sceneEl.systems["transform-selected-object"];
      transformSystem.stopTransform();
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-up", this.onGrabEnd);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-up", this.onGrabEnd);
  }
});
