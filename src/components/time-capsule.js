import { injectCustomShaderChunks } from "../utils/media-utils";

AFRAME.registerComponent("time-capsule", {
  schema: {
    src: { type: "string" }
  },
  init() {
    const screen = this.el.object3DMap.mesh;
    this.loadChapters().then(() => {
      this.el.emit("time-capsule-loaded");
    });
    this.el.addEventListener("video-loaded", () => {
      this.videoEl = this.el.components["media-video"];
      this.videoEl.el.classList.remove("interactable")
      this.videoEl.el.removeAttribute("hover-menu__video");
      this.videoEl.el.removeAttribute("is-remote-hover-target");
      this.videoEl.el.removeAttribute("hoverable-visuals");
      this.el.setObject3D("mesh", screen);
      screen.material = this.videoEl.mesh.material;
      screen.material.needsUpdate = true;
    }, { once: true });
  },

  togglePlaying() {
    this.videoEl?.togglePlaying();
  },

  isPaused() {
    return !this.videoEl || this.videoEl.video.paused;
  },

  hasNext() {
    return this.videoEl && this.chapters && this.getCurrentChapter() < this.chapters.length - 1;
  },

  hasPrevious() {
    return this.videoEl && this.chapters && this.getCurrentChapter() > 0;
  },

  getCurrentChapter() {
    const currentTime = this.videoEl?.video ? this.videoEl.video.currentTime * 1000 : 0;
    let i;
    for (i = 0; i < this.chapters.length; i++) {
      if (this.chapters[i].time > currentTime) break;
    }
    return i - 1;
  },

  previousChapter() {
    if (!this.videoEl) return;
    const current = this.getCurrentChapter();
    if (this.chapters[current - 1]) {
      this.videoEl.video.currentTime = this.chapters[current - 1].time / 1000;
    }
  },

  nextChapter() {
    if (!this.videoEl) return;
    const current = this.getCurrentChapter();
    if (this.chapters[current + 1]) {
      this.videoEl.video.currentTime = this.chapters[current + 1].time / 1000;
    }
  },

  seekChapter(c) {
    if (!this.videoEl) return;
    if (this.chapters[c]) {
      this.videoEl.video.currentTime = this.chapters[c].time / 1000;
    }
  },

  loadChapters() {
    if (!this.data.src) return;
    return fetch(this.data.src)
      .then(response => response.json())
      .then(chapters => {
        this.chapters = chapters;
      });
  }
});

AFRAME.registerComponent("time-capsule-button", {
  schema: {
    type: { type: "string" },
    target: { type: "selector" },
    chapter: { type: "int" },
  },
  init() {
    this.data.target.addEventListener("time-capsule-loaded", () => {
      this.timeCapsule = this.data.target.components["time-capsule"]
      this.updateHoverableVisuals();
    }, { once: true })
    this.onClick = () => {
      if (this.timeCapsule) {
        switch (this.data.type) {
          case "play":
          case "pause":
            this.timeCapsule.togglePlaying()
            break
          case "next":
            this.timeCapsule.nextChapter()
            break
          case "previous":
            this.timeCapsule.previousChapter()
            break
          case "chapter":
            this.timeCapsule.seekChapter(this.data.chapter)
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

  tick() {
    switch (this.data.type) {
      case "play":
        this.el.object3D.visible = this.timeCapsule && this.timeCapsule.isPaused();
        break;
      case "pause":
        this.el.object3D.visible = this.timeCapsule && !this.timeCapsule.isPaused();
        break
      case "next":
        this.el.object3D.visible = this.timeCapsule && this.timeCapsule.hasNext()
        break
      case "previous":
        this.el.object3D.visible = this.timeCapsule && this.timeCapsule.hasPrevious()
        break
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
});