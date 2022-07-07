import screenUrl from "../assets/time-capsule/screen.glb";
import timeCapsuleUrl from "../assets/time-capsule/time-capsule.glb";
import { loadModel } from "./gltf-model-plus";

let screenModel = null;
let timeCapsuleModel = null;

AFRAME.registerComponent("time-capsule", {
  init() {
    this.loadCapsule().then(model => {
      this.el.object3D.add(model.scene);
    });
    this.el.addEventListener("video-loaded", () => {
      this.loadScreen().then(model => {
        const videoEl = this.el.components["media-video"];
        videoEl.mesh.geometry = model.scene.children[0].geometry;
        videoEl.mesh.position.y = 0.5;
        videoEl.mesh.position.z = -0.5;
        videoEl.mesh.material.needsUpdate = true;
      });
    });
  },
  loadScreen() {
    if (screenModel) {
      return Promise.resolve(screenModel);
    }
    return loadModel(screenUrl).then(model => {
      screenModel = model;
      return screenModel;
    });
  },
  loadCapsule() {
    if (timeCapsuleModel) {
      return Promise.resolve(timeCapsuleModel);
    }
    return loadModel(timeCapsuleUrl).then(model => {
      timeCapsuleModel = model;
      return timeCapsuleModel;
    });
  }
});
