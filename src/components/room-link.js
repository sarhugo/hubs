import { injectCustomShaderChunks } from "../utils/media-utils";

AFRAME.registerComponent("room-link", {
  schema: {
    src: { type: "string" },
    text: { type: "string" }
  },
  init() {
    this.el.setAttribute("hover-menu__hubs-item", {
      template: "#hubs-room-destination-hover-menu",
      isFlat: true
    });
    this.updateHoverableVisuals();
    this.onClick = () => {
      this.el.querySelector("[open-room-button").object3D.dispatchEvent({ type: "interact" });
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
        const mesh = this.el.object3DMap.group ? this.el.object3DMap.group.children[0] : this.el.object3DMap.mesh;

        boundingBox.setFromObject(mesh);
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
})