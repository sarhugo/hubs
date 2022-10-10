import { injectCustomShaderChunks } from "../utils/media-utils";

class InformationPanelsGroup {
  constructor(name) {
    this.name = name;
    this.elements = [];
    this.active = null;
    this.default = null;
  }
  addElement(element) {
    if (!this.elements.includes(element)) {
      this.elements.push(element);
      element.setAttribute("visible", false);
    }
  }
  setDefault(element) {
    this.default = element
    if (!this.active) {
      element.setAttribute("visible", true)
    }
  }
  toggle(element) {
    if (this.active === element) {
      this.active = null;
    } else {
      this.active = element;
    }
    this.elements.forEach((el) => {
      el.setAttribute("visible", el === (this.active || this.default));
    })
  }
}

AFRAME.registerComponent("info-panel", {
  schema: {
    group: { type: "string" },
    default: { type: "boolean" },
  },
  init() {
    this.mngr = this.el.sceneEl.systems["information-panel-manager"].addPanel(this.el, this.data.group, this.data.default);
  },
  toggle() {
    this.mngr.toggle(this.el);
  }
});

AFRAME.registerComponent("info-panel-control", {
  schema: {
    type: { type: "string" },
    target: { type: "selector" }
  },
  init() {
    this.updateHoverableVisuals();

    this.onClick = () => {
      const panel = this.data.target.components["info-panel"];
      if (panel) {
        switch (this.data.type) {
          case "show":
            panel.toggle();
            break
        }
      }
    }
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
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
        boundingBox.setFromObject(this.el.object3DMap.mesh || this.el.object3DMap.group);
        boundingBox.getBoundingSphere(boundingSphere);
        hoverableVisuals.geometryRadius = boundingSphere.radius / this.el.object3D.scale.y;
      }
    };
  })(),
});

AFRAME.registerSystem("information-panel-manager", {
  init() {
    this.groups = {}
  },
  addPanel(element, group, is_default) {
    if (!this.groups[group]) {
      this.groups[group] = new InformationPanelsGroup(group);
    }
    this.groups[group].addElement(element);
    if (is_default) {
      this.groups[group].setDefault(element);
    }
    return this.groups[group];
  }
})