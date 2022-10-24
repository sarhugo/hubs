import { spawnEmojiInFrontOfUser, emojis } from "./emoji";
import { SOUND_FAIL, SOUND_SUCCESS } from "../systems/sound-effects-system";
import { injectCustomShaderChunks } from "../utils/media-utils";

class Quiz {
  constructor(identifier) {
    this.identifier = identifier;
    this.answers = [];
    this.correct = null;
    this.solved = false;
  }
  addAnswer(element) {
    if (!this.answers.includes(element)) {
      this.answers.push(element);
      // hide answer
      element.object3DMap.mesh.children[0].visible = false;
    }
  }
  setCorrect(element) {
    this.correct = element
  }
  reset() {
    this.solved = false;
    this.answers.forEach((el) => {
      el.object3DMap.mesh.children[0].visible = false;
    });
  }
  solve(element) {
    if (this.solved) {
      return;
    }
    this.solved = true;
    element.object3DMap.mesh.children[0].visible = true;
    if (this.correct === element) {
      spawnEmojiInFrontOfUser(emojis.find(emoji => emoji.id === "clap"));
      element.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SUCCESS);
    } else {
      this.correct.object3DMap.mesh.children[0].visible = true;
      element.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_FAIL);
    }
  }
}

AFRAME.registerComponent("quiz-answer", {
  schema: {
    quiz: { type: "string" },
    correct: { type: "boolean" },
  },
  init() {
    this.mngr = this.el.sceneEl.systems["quiz-answers-manager"].addAnswer(this.el, this.data.quiz, this.data.correct);
    this.updateHoverableVisuals();

    this.onClick = () => {
      this.mngr.solve(this.el);
    }
  },
  play() {
    this.mngr.reset();
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
  })()
});

AFRAME.registerSystem("quiz-answers-manager", {
  init() {
    this.quizes = {}
  },
  addAnswer(element, quiz, is_correct) {
    if (!this.quizes[quiz]) {
      this.quizes[quiz] = new Quiz(quiz);
    }
    this.quizes[quiz].addAnswer(element);
    if (is_correct) {
      this.quizes[quiz].setCorrect(element);
    }
    return this.quizes[quiz];
  }
})