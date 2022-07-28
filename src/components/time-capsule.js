import screenUrl from "../assets/time-capsule/screen.glb";
import timeCapsuleUrl from "../assets/time-capsule/time-capsule.glb";
import { loadModel } from "./gltf-model-plus";
import { VOLUME_LABELS } from "./media-video";

let screenModel = null;
let timeCapsuleModel = null;
const MAX_GAIN_MULTIPLIER = 2;

AFRAME.registerComponent("time-capsule", {
  init() {
    this.loadChapters();
    this.loadCapsule().then(model => {
      this.el.object3D.add(model.scene);
    });
    this.el.addEventListener("video-loaded", () => {
      this.videoEl = this.el.components["media-video"];
      this.initHoverMenu();
      this.loadScreen().then(model => {
        this.videoEl.mesh.geometry = model.scene.children[0].geometry;
        this.videoEl.mesh.position.y = 0.33;
        this.videoEl.mesh.position.z = -0.48;
        this.videoEl.mesh.scale.y = 1.1565;
        this.videoEl.mesh.material.needsUpdate = true;
      });
    });
  },
  initHoverMenu() {
    if (!this.videoEl) return;
    this.updateHoverMenu = this.updateHoverMenu.bind(this);
    this.togglePlaying = this.togglePlaying.bind(this);
    this.volumeUp = this.volumeUp.bind(this);
    this.volumeDown = this.volumeDown.bind(this);
    this.previousChapter = this.previousChapter.bind(this);
    this.nextChapter = this.nextChapter.bind(this);
    this.videoEl.el.removeAttribute("hover-menu__video");
    this.el.setAttribute("hover-menu__video", { template: "#timecapsule-hover-menu", isFlat: true });
    this.el.components["hover-menu__video"].getHoverMenu().then(menu => {
      // If we got removed while waiting, do nothing.
      if (!this.el.parentNode) return;

      this.hoverMenu = menu;
      this.playbackControls = this.hoverMenu.querySelector(".video-playback");
      this.playPauseButton = this.hoverMenu.querySelector(".video-playpause-button");
      this.volumeUpButton = this.hoverMenu.querySelector(".video-volume-up-button");
      this.volumeDownButton = this.hoverMenu.querySelector(".video-volume-down-button");
      this.seekForwardButton = this.hoverMenu.querySelector(".video-seek-forward-button");
      this.seekBackButton = this.hoverMenu.querySelector(".video-seek-back-button");
      this.timeLabel = this.hoverMenu.querySelector(".video-time-label");
      this.volumeLabel = this.hoverMenu.querySelector(".video-volume-label");

      this.playPauseButton.object3D.addEventListener("interact", this.togglePlaying);
      this.volumeUpButton.object3D.addEventListener("interact", this.volumeUp);
      this.volumeDownButton.object3D.addEventListener("interact", this.volumeDown);
      this.seekForwardButton.object3D.addEventListener("interact", this.nextChapter);
      this.seekBackButton.object3D.addEventListener("interact", this.previousChapter);

      this.updateHoverMenu();
    });
  },
  updateHoverMenu() {
    if (!this.hoverMenu) return;
    this.updateVolumeLabel();
    this.timeLabel.object3D.visible = !!this.chapters;
    if (this.chapters) {
      const currentChapter = this.getCurrentChapter();
      this.seekForwardButton.object3D.visible = currentChapter < this.chapters.length - 1;
      this.seekBackButton.object3D.visible = currentChapter > 0;
      this.updateTimeLabel(currentChapter);
    } else {
      this.seekForwardButton.object3D.visible = false;
      this.seekBackButton.object3D.visible = false;
    }
  },
  togglePlaying() {
    this.videoEl.togglePlaying();
  },
  tick() {
    if (!this.videoEl || !this.hoverMenu) return;
    const paused = !this.videoEl.video || this.videoEl.video.paused;
    this.playPauseButton.setAttribute("icon-button", "active", paused);
    if (this.hoverMenu.object3D.visible) {
      this.updateHoverMenu();
    }
  },
  getCurrentChapter() {
    const currentTime = this.videoEl.video ? this.videoEl.video.currentTime * 1000 : 0;
    let i;
    for (i = 0; i < this.chapters.length; i++) {
      if (this.chapters[i].time > currentTime) break;
    }
    return i - 1;
  },
  changeVolumeBy(v) {
    this.videoEl.changeVolumeBy(v);
    this.updateVolumeLabel();
  },

  volumeUp() {
    this.changeVolumeBy(0.2);
  },

  volumeDown() {
    this.changeVolumeBy(-0.2);
  },

  previousChapter() {
    const current = this.getCurrentChapter();
    if (this.chapters[current - 1]) {
      this.videoEl.video.currentTime = this.chapters[current - 1].time / 1000;
    }
  },

  nextChapter() {
    const current = this.getCurrentChapter();
    if (this.chapters[current + 1]) {
      this.videoEl.video.currentTime = this.chapters[current + 1].time / 1000;
    }
  },

  updateVolumeLabel() {
    const gainMultiplier = APP.gainMultipliers.get(this.videoEl.el);
    this.volumeLabel.setAttribute(
      "text",
      "value",
      gainMultiplier === 0 ? "MUTE" : VOLUME_LABELS[Math.floor(gainMultiplier / (MAX_GAIN_MULTIPLIER / 20))]
    );
  },
  updateTimeLabel(chapter) {
    this.timeLabel.setAttribute("text", "value", this.chapters[chapter].title);
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
  },
  loadChapters() {
    if (!this.data.jsonUrl) return;
    fetch(this.data.jsonUrl)
      .then(response => response.json())
      .then(chapters => {
        this.chapters = chapters;
      });
  }
});
