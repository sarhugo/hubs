import { injectCustomShaderChunks } from "../utils/media-utils";
import { handleExitTo2DInterstitial } from "../utils/vr-interstitial";

AFRAME.registerComponent("simple-link", {
  schema: {
    href: { type: "string" }
  },
  init() {
    this.updateHoverableVisuals();

    this.onClick = async () => {
      const exitImmersive = async () => await handleExitTo2DInterstitial(false, () => {}, true);
      await exitImmersive();
      window.open(this.data.href);
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  },

  updateHoverableVisuals: (function () {
    const boundingBox = new THREE.Box3();
    const boundingSphere = new THREE.Sphere();
    return function () {
      const hoverableVisuals = this.el.components["hoverable-visuals"];

      if (hoverableVisuals) {
        if (!this.injectedCustomShaderChunks) {
          this.injectedCustomShaderChunks = true;
          hoverableVisuals.uniforms = injectCustomShaderChunks(this.el.object3D);
        }
        boundingBox.setFromObject(this.el.object3DMap.mesh || this.el.object3DMap.group);
        boundingBox.getBoundingSphere(boundingSphere);
        hoverableVisuals.geometryRadius = boundingSphere.radius / this.el.object3D.scale.y;
      }
    };
  })()
});
