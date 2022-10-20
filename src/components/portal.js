import { injectCustomShaderChunks } from "../utils/media-utils";
import { SOUND_MEDIA_LOADED } from "../systems/sound-effects-system";

AFRAME.registerComponent("portal", {
  init() {
    this.initEventHandlers();
    this.updateHoverableVisuals();
  },
  initEventHandlers() {
    this.onClick = () => {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playPositionalSoundFollowing(
        SOUND_MEDIA_LOADED,
        this.el.object3D,
        false
      );
      this.el.setAttribute("animation", {
        property: "position",
        dur: 1000,
        to: `0 0 300`
      });
    }
  },
  updateHoverableVisuals: (function() {
    const boundingBox = new THREE.Box3();
    const boundingSphere = new THREE.Sphere();
    return function() {
      const hoverableVisuals = this.el.components["hoverable-visuals"];

      if (hoverableVisuals) {
        if (!this.injectedCustomShaderChunks) {
          this.injectedCustomShaderChunks = true;
          hoverableVisuals.uniforms = injectCustomShaderChunks(this.el.object3D);
        }

        boundingBox.setFromObject(this.el.object3DMap.mesh);
        boundingBox.getBoundingSphere(boundingSphere);
        hoverableVisuals.geometryRadius = boundingSphere.radius / this.el.object3D.scale.y;
      }
    };
  })(),
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  },
});