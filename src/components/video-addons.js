import { injectCustomShaderChunks } from "../utils/media-utils";

AFRAME.registerComponent("video-screen", {
  schema: {
    target: { type: "selector" },
  },
  init() {
    this.data.target.addEventListener("video-loaded", () => {
      const video = this.data.target.components["media-video"]
      video.el.object3D.visible = false;
      this.el.object3DMap.mesh.material = video.mesh.material;
      this.el.object3DMap.mesh.material.needsUpdate = true;
    }, { once: true })
  },
});
AFRAME.registerComponent("video-chapters", {
  schema: {
    src: { type: "string" }
  },
  init() {
    this.el.addEventListener("video-loaded", () => {
      this.videoEl = this.el.components["media-video"];
    });
    this.loadChapters().then(() => {
      this.el.emit("video-chapters-loaded");
    });
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

AFRAME.registerComponent("video-control", {
  schema: {
    type: { type: "string" },
    target: { type: "selector" },
    chapter: { type: "int" },
    src: { type: "string" }
  },
  init() {
    this.data.target.addEventListener("video-loaded", () => {
      this.video = this.data.target.components["media-video"]
    }, { once: true })
    this.data.target.addEventListener("video-chapters-loaded", () => {
      this.chapters = this.data.target.components["video-chapters"]
    }, { once: true })
    this.updateHoverableVisuals();

    this.onClick = () => {
      switch (this.data.type) {
        case "play":
        case "pause":
          this.video?.togglePlaying();
          break
        case "next":
          this.chapters?.nextChapter()
          break
        case "previous":
          this.chapters?.previousChapter()
          break
        case "chapter":
          this.chapters?.seekChapter(this.data.chapter)
          break
        case "src":
          this.data.target.setAttribute("media-loader", "src", this.data.src);
          break
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
        this.el.object3D.visible = this.video && this.video.video.paused;
        break;
      case "pause":
        this.el.object3D.visible = this.video && !this.video.video.paused;
        break
      case "next":
        this.el.object3D.visible = this.chapters && this.chapters.hasNext()
        break
      case "previous":
        this.el.object3D.visible = this.chapters && this.chapters.hasPrevious()
        break
      case "chapter":
        this.toggleChapterIndicator(this.chapters?.getCurrentChapter() === this.data.chapter);
        break
    }
  },
  toggleChapterIndicator(status) {
    if (this.chapterStatus === status) {
      return;
    }
    if (this.el.object3DMap.mesh.children.length) {
      this.el.object3DMap.mesh.children.forEach((child) => {
        child.visible = status;
      })
    }
    this.chapterStatus = status;
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