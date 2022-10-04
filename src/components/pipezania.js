import PIPES_SPRITE from "../assets/pipezania/pipes.png";
import LEVELS from "../assets/pipezania/levels.json";

import { injectCustomShaderChunks } from "../utils/media-utils";
import { SOUND_MEDIA_LOADING, SOUND_PIPEZANIA_SPIN, SOUND_PIPEZANIA_FAIL, SOUND_PIPEZANIA_SUCCESS } from "../systems/sound-effects-system";

const PIPE_TILES = {
  CORNER: 0,
  DOUBLE_CORNER: 1,
  STRAIGHT: 2,
  CROSS: 3,
  START: 4,
  END: 5
};
const DIRECTIONS = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};
const FLOW_SPEED = 250;
const {
  Mesh,
  BufferGeometry,
  Object3D,
  PlaneBufferGeometry,
  SphereGeometry,
  LineBasicMaterial,
  MeshBasicMaterial,
  TextureLoader,
  Float32BufferAttribute,
  Vector2
} = THREE;

class Pipe extends Object3D {
  constructor(angle) {
    super();
    this.angle = angle;
    this.pipe = this.getPipeMesh();
    this.add(this.pipe);
  }
  getPipeMesh() {
    const geometry = new PlaneBufferGeometry(1, 1, 1, 1);
    const texture = new TextureLoader().load(PIPES_SPRITE);
    texture.repeat.set(1 / 4, 1 / 2);
    const material = new MeshBasicMaterial({ transparent: true, map: texture });
    return new Mesh(geometry, material);
  }
  rotate() {
    return ++this.angle;
  }
  flow() {
    /* it returns an exit orientation (-1 no exit, North, East, South, West) */
    return -1;
  }
  flowPosition() {
    return new Vector2(0, 0);
  }
}
class StartPipe extends Pipe {
  rotate() {
    return false;
  }
  flow() {
    return (this.angle + 1) % 4;
  }
  flowPosition(delta) {
    const v = delta > .5 ? new Vector2(delta / 2, 0) : new Vector2(0, 0);
    return v.rotateAround(new Vector2(0, 0), Math.PI / 2 * (this.angle % 4));
  }
}
class CornerPipe extends Pipe {
  getPipeMesh() {
    const mesh = super.getPipeMesh();
    mesh.material.map.offset.y = 1 / 2;
    return mesh;
  }
  flow(entry) {
    this.entry = entry;
    if ((entry + 1) % 4 == this.angle % 4) {
      return this.angle % 4;
    }
    if (entry == this.angle % 4) {
      return (this.angle + 3) % 4;
    }
    return -1;
  }
  flowPosition(delta) {
    let v;
    const angle = -Math.PI / 2 * delta;
    if ((this.entry + 1) % 4 == this.angle % 4) {
      v = new Vector2(Math.cos(angle) * .5, Math.sin(angle) * .5)
        .rotateAround(new Vector2(0, 0), Math.PI / 2);
    }
    if (this.entry == this.angle % 4) {
      v = new Vector2(Math.cos(angle) * .5, -Math.sin(angle) * .5);
    }
    return v?.sub(new Vector2(.5, .5)).rotateAround(new Vector2(0, 0), Math.PI / 2 * (this.angle % 4));
  }
}
class DoubleCornerPipe extends Pipe {
  getPipeMesh() {
    const mesh = super.getPipeMesh();
    mesh.material.map.offset.x = 1 / 4;
    mesh.material.map.offset.y = 1 / 2;
    return mesh;
  }
  flow(entry) {
    this.entry = entry;
    if ((entry + 1) % 4 == this.angle % 4) {
      return this.angle % 4;
    }
    if ((entry + 2) % 4 == this.angle % 4) {
      return (this.angle + 1) % 4;
    }
    if (entry == (this.angle + 1) % 4) {
      return (this.angle + 2) % 4;
    }
    if (entry == this.angle % 4) {
      return (this.angle + 3) % 4;
    }
    return -1;
  }
  flowPosition(delta) {
    let v;
    const angle = -Math.PI / 2 * delta;
    if ((this.entry + 1) % 4 == this.angle % 4) {
      v = new Vector2(Math.cos(angle) * .5, Math.sin(angle) * .5)
        .rotateAround(new Vector2(0, 0), Math.PI / 2)
        .sub(new Vector2(.5, .5));
    }
    if ((this.entry + 2) % 4 == this.angle % 4) {
      v = new Vector2(Math.cos(angle) * .5, -Math.sin(angle) * .5)
        .rotateAround(new Vector2(0, 0), Math.PI)
        .add(new Vector2(.5, .5));
    }
    if (this.entry == (this.angle + 1) % 4) {
      v = new Vector2(Math.cos(angle) * .5, Math.sin(angle) * .5)
        .rotateAround(new Vector2(0, 0), -Math.PI / 2)
        .add(new Vector2(.5, .5));
    }
    if (this.entry == this.angle % 4) {
      v = new Vector2(Math.cos(angle) * .5, -Math.sin(angle) * .5)
        .sub(new Vector2(.5, .5));
    }
    return v?.rotateAround(new Vector2(0, 0), Math.PI / 2 * (this.angle % 4));
  }
}
class StraightPipe extends Pipe {
  getPipeMesh() {
    const mesh = super.getPipeMesh();
    mesh.material.map.offset.x = 1 / 2;
    mesh.material.map.offset.y = 1 / 2;
    return mesh;
  }
  flow(entry) {
    this.entry = entry;
    if ((entry + 1) % 4 == this.angle % 4) {
      return (this.angle + 1) % 4;
    }
    if (entry == (this.angle + 1) % 4) {
      return (this.angle + 3) % 4;
    }
    return -1;
  }
  flowPosition(delta) {
    const v = new Vector2(delta - .5, 0);
    if (this.entry == (this.angle + 1) % 4) {
      v.x *= -1;
    }
    return v.rotateAround(new Vector2(0, 0), Math.PI / 2 * (this.angle % 4));
  }
}
class CrossPipe extends Pipe {
  getPipeMesh() {
    const mesh = super.getPipeMesh();
    mesh.material.map.offset.x = 3 / 4;
    mesh.material.map.offset.y = 1 / 2;
    return mesh;
  }
  flow(entry) {
    this.entry = entry;
    return (entry + 2) % 4;
  }
  flowPosition(delta) {
    let v;
    if ((this.entry + 1) % 4 == this.angle % 4) {
      v = new Vector2(delta - .5, 0);
    }
    if (this.entry % 4 == this.angle % 4) {
      v = new Vector2(0, delta - .5);
    }
    if (this.entry == (this.angle + 1) % 4) {
      v = new Vector2(.5 - delta, 0);
    }
    if (this.entry == (this.angle + 2) % 4) {
      v = new Vector2(0, .5 - delta);
    }
    return v?.rotateAround(new Vector2(0, 0), Math.PI / 2 * (this.angle % 4));
  }
}
class EndPipe extends Pipe {
  getPipeMesh() {
    const mesh = super.getPipeMesh();
    mesh.material.map.offset.x = 1 / 4;
    return mesh;
  }
  rotate() {
    return false;
  }
  flow(entry) {
    if (entry == (this.angle + 1) % 4) {
      return entry;
    }
    return -1;
  }
  flowPosition(delta) {
    const v = delta < .5 ? new Vector2(.5 - delta, 0) : new Vector2(0, 0);
    return v.rotateAround(new Vector2(0, 0), Math.PI / 2 * (this.angle % 4));
  }
}
Pipe.factory = (kind, angle) => {
  switch (kind) {
    case PIPE_TILES.CORNER:
      return new CornerPipe(angle);
    case PIPE_TILES.DOUBLE_CORNER:
      return new DoubleCornerPipe(angle);
    case PIPE_TILES.STRAIGHT:
      return new StraightPipe(angle);
    case PIPE_TILES.CROSS:
      return new CrossPipe(angle);
    case PIPE_TILES.START:
      return new StartPipe(angle);
    case PIPE_TILES.END:
      return new EndPipe(angle);
  }
};

class Grid extends Mesh {
  constructor(rows, cols) {
    const geometry = new PlaneBufferGeometry(cols, rows, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    super(geometry, material);

    const vertices = [];
    for (let i = 0; i <= rows; i++) {
      vertices.push(-cols / 2, i - rows / 2, 0, cols / 2, i - rows / 2, 0);
      for (let j = 0; j <= cols; j++) {
        vertices.push(j - cols / 2, -rows / 2, 0, j - cols / 2, rows / 2, 0);
      }
    }
    const grid = new BufferGeometry();
    grid.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    const lines = new THREE.LineSegments(grid, new LineBasicMaterial({ color: 0x000000 }));
    this.add(lines);
  }
}

AFRAME.registerComponent("pipezania", {
  schema: {
    level: { type: "int" }
  },
  init() {
    this.level = this.data.level ? LEVELS[this.data.level] : LEVELS[Math.floor(Math.random() * LEVELS.length)];
    this.board = {};
    this.isFlowing = false;
    const rows = this.getRows();
    const cols = this.getCols();
    this.el.setObject3D("mesh", new Grid(rows, cols));
    this.center = new Vector2((cols - 1) / 2, (rows - 1) / 2);
    this.addTiles();
    this.addAtom();
  },
  getSize() {
    const sizes = { 180: "large", 96: "medium", 40: "small" };
    return sizes[this.level.length];
  },
  getRows() {
    switch (this.getSize()) {
      case "large":
        return 10;
      case "medium":
        return 8;
      default:
        return 5;
    }
  },
  getCols() {
    switch (this.getSize()) {
      case "large":
        return 18;
      case "medium":
        return 12;
      default:
        return 8;
    }
  },
  addTiles() {
    const rows = this.getRows();
    const cols = this.getCols();
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const piece = this.level[i * cols + j];
        if (piece) {
          const tile = document.createElement("a-entity");
          const kind = parseInt(piece[0]);
          if (kind === PIPE_TILES.START) {
            this.startX = j;
            this.startY = i;
          }
          this.el.appendChild(tile);
          tile.setAttribute("pipezania-tile", { kind, angle: piece[1], x: j, y: i });
          if (kind !== PIPE_TILES.END) {
            tile.setAttribute("class", "interactable");
            tile.setAttribute("is-remote-hover-target", "");
            tile.setAttribute("hoverable-visuals", "");
            tile.setAttribute("tags", {
              singleActionButton: true
            });
          }
          tile.object3D.position.set(j - this.center.x, this.center.y - i, 0.001);
          this.board[i * cols + j] = tile;
        }
      }
    }
  },
  addAtom() {
    this.atom = document.createElement("a-entity");
    this.el.appendChild(this.atom);
    this.atom.setAttribute("pipezania-atom", "");
    this.resetAtom();
  },
  resetAtom() {
    this.atom.setAttribute("position", `${this.startX - this.center.x} ${this.center.y - this.startY} 0`);
  },
  startFlow(tile) {
    this.isFlowing = true;
    this.finished = false;
    this.currentPiece = tile;
    this.flow_delta = 0;
    this.flow_direction = tile.flow();
    this.flow_sound_effect = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playPositionalSoundFollowing(
      SOUND_MEDIA_LOADING,
      this.atom.object3D,
      true
    );
  },
  tick(t, dt) {
    if (this.isFlowing && !this.finished) {
      this.flow_delta += dt;
      const delta = Math.min(this.flow_delta / FLOW_SPEED, 1);
      const position = this.currentPiece.flowPosition(delta);
      this.atom.setAttribute("position", `${position.x - this.center.x} ${this.center.y - position.y} 0`);
      if (delta === 1) {
        this.flow();
      }
    }
  },
  flow() {
    if (this.currentPiece.data.kind === PIPE_TILES.END) {
      return this.success();
    }
    let x = this.currentPiece.data.x;
    let y = this.currentPiece.data.y;
    switch (this.flow_direction) {
      case DIRECTIONS.NORTH:
        y--;
        break;
      case DIRECTIONS.EAST:
        x++;
        break;
      case DIRECTIONS.SOUTH:
        y++;
        break;
      case DIRECTIONS.WEST:
        x--;
        break;
    }
    const tile = this.board[y * this.getCols() + x];
    if (!tile) {
      return this.flood();
    }
    this.currentPiece = tile.components["pipezania-tile"];
    this.flow_delta = 0;
    this.flow_direction = this.currentPiece.flow((this.flow_direction + 2) % 4);
    if (this.flow_direction === -1) {
      return this.flood();
    }
  },
  stopFlow() {
    if (this.flow_sound_effect) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.stopPositionalAudio(this.flow_sound_effect);
      this.flow_sound_effect = null;
    }
  },
  flood() {
    this.stopFlow();
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_PIPEZANIA_FAIL);
    this.resetAtom();
    this.isFlowing = false;
  },
  success() {
    this.stopFlow();
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_PIPEZANIA_SUCCESS);
    this.finished = true;
  }
});
AFRAME.registerComponent("pipezania-atom", {
  init() {
    const geometry = new SphereGeometry( 0.1, 5, 5 );
    const material = new MeshBasicMaterial( { color: 0xffff00 });
    const sphere = new Mesh( geometry, material );
    this.el.setObject3D("mesh", sphere);
  },
  remove() {
    this.el.removeObject3D("mesh");
  }
});
AFRAME.registerComponent("pipezania-tile", {
  schema: {
    kind: { type: "int" },
    angle: { type: "int" },
    x: { type: "int" },
    y: { type: "int" }
  },
  init() {
    const initialAngle = this.data.angle - 1;
    this.pipe = Pipe.factory(this.data.kind, initialAngle);
    this.el.object3D.rotation.z = (-Math.PI / 2) * initialAngle;
    this.el.setObject3D("mesh", this.pipe);
    this.onClick = () => {
      const { pipezania } = this.el.parentNode.components;
      if (pipezania.isFlowing) {
        return;
      }
      if (this.data.kind === PIPE_TILES.START) {
        return pipezania.startFlow(this);
      }
      let angle;
      if ((angle = this.pipe.rotate())) {
        this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_PIPEZANIA_SPIN);
        this.el.setAttribute("animation", {
          property: "rotation",
          dur: 500,
          to: `0 0 ${angle * -90}`
        });
      }
    };
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
  flow(entry) {
    return this.pipe.flow(entry);
  },
  flowPosition(delta) {
    const pos = this.pipe.flowPosition(delta);
    return new Vector2(this.data.x, this.data.y).add(pos);
  },
  remove() {
    this.el.removeObject3D("mesh");
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.updateHoverableVisuals();
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
