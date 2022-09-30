AFRAME.registerComponent("video-switcher", {
  schema: {
    target: { type: "selector" },
    src: { type: "string" }
  },
  init() {
    this.onClick = () => {
      if (this.data.target) {
        this.data.target.setAttribute("media-loader", "src", this.data.src);
      }
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
