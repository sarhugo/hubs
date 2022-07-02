import { THREE } from "aframe";
import { waitForDOMContentLoaded } from "../utils/async-utils";

const CAMERA_WORLD_QUATERNION = new THREE.Quaternion();
const TARGET_WORLD_QUATERNION = new THREE.Quaternion();
const v = new THREE.Vector3();
const v2 = new THREE.Vector3();
const q = new THREE.Quaternion();
const GLOBE_RADIUS = 1;
const pxPerDeg = (2 * Math.PI * GLOBE_RADIUS) / 360;

const colorFn = x => {
  return new THREE.Color().setHSL(0.6 - x * 0.5, 1.0, 0.5);
};
const fragmentShader = `
uniform vec3 color;
uniform float coefficient;
uniform float power;
varying vec3 vVertexNormal;
varying vec3 vVertexWorldPosition;
void main() {
  vec3 worldCameraToVertex = vVertexWorldPosition - cameraPosition;
  vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;
  viewCameraToVertex = normalize(viewCameraToVertex);
  float intensity	= pow(
    coefficient + dot(vVertexNormal, viewCameraToVertex),
    power
  );
  gl_FragColor = vec4(color, intensity);
}`;

const vertexShader = `
varying vec3 vVertexWorldPosition;
varying vec3 vVertexNormal;
void main() {
  vVertexNormal	= normalize(normalMatrix * normal);
  vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const createAtmosphereMesh = (geometry, options) => {
  const atmosphereGeometry = geometry.clone();

  // Resize vertex positions according to normals
  const position = new Float32Array(geometry.attributes.position.count * 3);
  for (let idx = 0, len = position.length; idx < len; idx++) {
    const normal = geometry.attributes.normal.array[idx];
    const curPos = geometry.attributes.position.array[idx];
    position[idx] = curPos + normal * options.size;
  }
  atmosphereGeometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  const atmosphereMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    fragmentShader,
    transparent: true,
    uniforms: {
      coefficient: {
        value: options.coefficient
      },
      color: {
        value: new THREE.Color(options.color)
      },
      power: {
        value: options.power
      }
    },
    vertexShader
  });
  if (options.backside) {
    atmosphereMaterial.side = THREE.BackSide;
  }
  return new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
};
const getRandomAltitude = () => {
  return Math.floor(Math.random() * 33) / 100;
};
AFRAME.registerComponent("earth-globe", {
  schema: {
    bumpMap: { type: "string", default: "" },
    jsonUrl: { type: "string", default: "" }
  },
  init() {
    const { mesh } = this.el.object3DMap;
    mesh.rotation.y = Math.PI;
    if (this.data.bumpMap) {
      const loader = new THREE.TextureLoader();
      loader.loadAsync(this.data.bumpMap).then(texture => {
        mesh.material.bumpMap = texture;
        mesh.material.bumpScale = 0.05;
        mesh.material.needsUpdate = true;
      });
    }
    const atmosphere = createAtmosphereMesh(mesh.geometry, {
      backside: true,
      color: "lightskyblue",
      size: GLOBE_RADIUS * 0.25,
      power: 3.5,
      coefficient: 0.1
    });
    this.el.object3D.add(atmosphere);
    let leftHand, rightHand;
    this.loadLocations();
    waitForDOMContentLoaded().then(() => {
      leftHand = document.getElementById("player-left-controller");
      rightHand = document.getElementById("player-right-controller");
    });

    const transformSystem = this.el.sceneEl.systems["earth-globe-movement"];
    this.onGrabStart = e => {
      if (!leftHand || !rightHand) return;
      transformSystem.startTransform(
        this.el.object3D,
        e.object3D.el.id === "right-cursor"
          ? rightHand.object3D
          : e.object3D.el.id === "left-cursor"
            ? leftHand.object3D
            : e.object3D
      );
    };
    this.onGrabEnd = () => {
      transformSystem.stopTransform();
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-up", this.onGrabEnd);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-up", this.onGrabEnd);
  },
  loadLocations() {
    this._baseGeometry = new THREE.BufferGeometry();
    this._pointGeometry = new THREE.CylinderBufferGeometry(1, 1, 1, 12);
    this._pointGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    this._pointGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -0.5));
    this._pointMaterials = {
      automat: new THREE.MeshBasicMaterial({ color: colorFn(0.9) }),
      office: new THREE.MeshBasicMaterial({ color: colorFn(0.3) }),
      officeWithAutomat: new THREE.MeshBasicMaterial({ color: colorFn(0.6) })
    };
    fetch(this.data.jsonUrl)
      .then(response => response.json())
      .then(locations => {
        locations.forEach(location => {
          this.addLocation(location);
        });
      });
  },
  addLocation(location) {
    const point = new THREE.Mesh(this._pointGeometry);
    const phi = ((90 - location.latitude) * Math.PI) / 180;
    const theta = ((180 - location.longitude) * Math.PI) / 180;
    point.position.x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
    point.position.y = GLOBE_RADIUS * Math.cos(phi);
    point.position.z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
    point.lookAt(new THREE.Vector3(0, 0, 0));
    point.scale.x = point.scale.y = 0.25 * pxPerDeg;
    point.scale.z = Math.max(getRandomAltitude() * GLOBE_RADIUS, 0.1);
    point.updateMatrix();
    point.material = this._pointMaterials[location.type];
    this.el.object3D.add(point);
  }
});

AFRAME.registerSystem("earth-globe-movement", {
  init() {
    this.target = null;
    this.transforming = false;
    this.startQ = new THREE.Quaternion();

    this.raycasters = {};

    this.planarInfo = {
      plane: new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
        new THREE.MeshBasicMaterial({
          visible: true,
          wireframe: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        })
      ),
      normal: new THREE.Vector3(),
      intersections: [],
      previousPointOnPlane: new THREE.Vector3(),
      currentPointOnPlane: new THREE.Vector3(),
      deltaOnPlane: new THREE.Vector3(),
      finalProjectedVec: new THREE.Vector3()
    };
    this.el.object3D.add(this.planarInfo.plane);
  },

  stopTransform() {
    this.transforming = false;
  },

  startPlaneCasting() {
    let intersection;
    const { plane, previousPointOnPlane } = this.planarInfo;

    this.el.camera.getWorldQuaternion(CAMERA_WORLD_QUATERNION);
    plane.quaternion.copy(CAMERA_WORLD_QUATERNION);
    this.target.getWorldPosition(plane.position);
    plane.matrixNeedsUpdate = true;
    plane.updateMatrixWorld(true);

    if ((intersection = this.getIntersection())) {
      this.transforming = true;
      previousPointOnPlane.copy(intersection.point);
      this.target.getWorldQuaternion(TARGET_WORLD_QUATERNION);
      v.set(0, 0, -1).applyQuaternion(CAMERA_WORLD_QUATERNION);
      v2.set(0, 0, -1).applyQuaternion(TARGET_WORLD_QUATERNION);
      this.sign = v.dot(v2) > 0 ? 1 : -1;

      v.set(0, 1, 0);
      v2.set(0, 1, 0).applyQuaternion(TARGET_WORLD_QUATERNION);
      this.sign2 = v.dot(v2) > 0 ? 1 : -1;
    } else {
      this.transforming = false;
    }
  },

  startTransform(target, hand) {
    this.target = target;
    this.hand = hand;
    this.transforming = true;
    this.target.getWorldQuaternion(this.startQ);
    this.startPlaneCasting();
  },
  tick() {
    if (!this.target) {
      return;
    }
    if (!this.transforming) {
      this.target.rotation.x -= this.target.rotation.x * 0.05;
      this.target.rotation.y -= this.target.rotation.y * 0.05;
      this.target.matrixNeedsUpdate = true;
      return;
    }
    let intersection;
    const {
      plane,
      normal,
      previousPointOnPlane,
      currentPointOnPlane,
      deltaOnPlane,
      finalProjectedVec
    } = this.planarInfo;
    this.target.getWorldPosition(plane.position);
    this.el.camera.getWorldPosition(v);
    plane.matrixNeedsUpdate = true;
    const cameraToPlaneDistance = v.sub(plane.position).length();

    if ((intersection = this.getIntersection())) {
      normal.set(0, 0, -1).applyQuaternion(plane.quaternion);

      currentPointOnPlane.copy(intersection.point);
      deltaOnPlane.copy(currentPointOnPlane).sub(previousPointOnPlane);
      const SENSITIVITY = 5;
      finalProjectedVec
        .copy(deltaOnPlane)
        .projectOnPlane(normal)
        .applyQuaternion(q.copy(plane.quaternion).invert())
        .multiplyScalar(SENSITIVITY / cameraToPlaneDistance);

      this.target.rotation.x = THREE.MathUtils.clamp(
        this.target.rotation.x - this.sign2 * this.sign * finalProjectedVec.y,
        -Math.PI / 2,
        Math.PI / 2
      );
      this.target.rotation.y += finalProjectedVec.x;

      this.target.matrixNeedsUpdate = true;

      previousPointOnPlane.copy(currentPointOnPlane);
    }
  },
  getIntersection() {
    const intersections = [];
    this.raycasters.right =
      this.raycasters.right ||
      document.getElementById("right-cursor-controller").components["cursor-controller"].raycaster;
    this.raycasters.left =
      this.raycasters.left ||
      document.getElementById("left-cursor-controller").components["cursor-controller"].raycaster;
    const raycaster = this.hand.el.id === "player-left-controller" ? this.raycasters.left : this.raycasters.right;
    const far = raycaster.far;
    raycaster.far = 1000;
    this.planarInfo.plane.raycast(raycaster, intersections);
    raycaster.far = far;
    return intersections.length ? intersections[0] : false;
  }
});
