import { THREE } from "aframe";
import { ConicPolygonGeometry } from 'three-conic-polygon-geometry';
import GeoJson from "../assets/earth-globe/ne_110m_admin_0_countries.json";
import { waitForDOMContentLoaded } from "../utils/async-utils";

const CAMERA_WORLD_QUATERNION = new THREE.Quaternion();
const TARGET_WORLD_QUATERNION = new THREE.Quaternion();
const v = new THREE.Vector3();
const v2 = new THREE.Vector3();
const q = new THREE.Quaternion();
const q2 = new THREE.Quaternion();

class CountryTile extends THREE.Object3D {
  constructor(geometry, materials, data) {
    super();
    this.userData = data;
    const magnitude = data?.magnitude || 0;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    polygons.forEach(coords => {
      const mesh = new THREE.Mesh(
        new ConicPolygonGeometry(coords, .5, 3 + magnitude * .1, true, true, true, 5),
        materials
      );
      this.add(mesh);
    });
  }
}

AFRAME.registerComponent("earth-globe", {
  schema: {
    src: { type: "string" },
    text: { type: "selector" },
    sideColor: { type: "color" },
    sideColorOpacity: { type: "number", default: 1 },
    bottomCapColor: { type: "color" },
    bottomCapColorOpacity: { type: "number", default: 1 },
    topCapColor: { type: "color" },
    topCapColorOpacity: { type: "number", default: 1 },
    activeSideColor: { type: "color" },
    activeSideColorOpacity: { type: "number", default: 1 },
    activeBottomCapColor: { type: "color" },
    activeBottomCapColorOpacity: { type: "number", default: 1 },
    activeTopCapColor: { type: "color" },
    activeTopCapColorOpacity: { type: "number", default: 1 },
  },
  init() {
    this.initEventHandlers();
    this.initMaterials();
    this.initLocations()
      .then(() => this.generateGlobe());
  },
  initEventHandlers() {
    let leftHand, rightHand;
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
    this.showCountryDetails = e => {
      let number;
      const locations = [];
      const { active, title, office, automat, officeWithAutomat } = e.object3D.userData;
      if (!active) {
        this.el.setAttribute("text", "value", "");
        return;
      }
      if (office || officeWithAutomat) {
        number = (office || 0) + (officeWithAutomat || 0);
        locations.push(`${number} office${number > 1 ? 's' : ''}`);
      }
      if (automat || officeWithAutomat) {
        number = (automat || 0) + (officeWithAutomat || 0);
        locations.push(`${number} ATM${number > 1 ? 's' : ''}`);
      }
      this.data.text.setAttribute("text", "value", `${title}:\n${locations.join(" - ")}`);
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.addEventListener("holdable-button-up", this.onGrabEnd);
    this.el.object3D.addEventListener("country-interact", this.showCountryDetails);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-down", this.onGrabStart);
    this.el.object3D.removeEventListener("holdable-button-up", this.onGrabEnd);
    this.el.object3D.removeEventListener("country-interact", this.showCountryDetails);
  },
  initMaterials() {
    this.materials = [
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: this.data.sideColor, opacity: this.data.sideColorOpacity, transparent: this.data.sideColorOpacity < 1 }), // side material
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: this.data.bottomCapColor, opacity: this.data.bottomCapColorOpacity, transparent: this.data.bottomCapColorOpacity < 1 }), // bottom cap material
      new THREE.MeshBasicMaterial({ color: this.data.topCapColor, opacity: this.data.topCapColorOpacity, transparent: this.data.topCapColorOpacity < 1 }), // top cap material
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: this.data.activeSideColor, opacity: this.data.activeSideColorOpacity, transparent: this.data.activeSideColorOpacity < 1 }), // active side material
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: this.data.activeBottomCapColor, opacity: this.data.activeBottomCapColorOpacity, transparent: this.data.activeBottomCapColorOpacity < 1 }), // active bottom cap material
      new THREE.MeshBasicMaterial({ color: this.data.activeTopCapColor, opacity: this.data.activeTopCapColorOpacity, transparent: this.data.activeTopCapColorOpacity < 1}) // active top cap material
    ];
  },
  initLocations() {
    this.locations = {};
    if (!this.data.src) {
      return;
    }
    return fetch(this.data.src)
      .then(response => response.json())
      .then(countries => {
        const max = Math.max(...countries.map(country => country.locations));
        countries.forEach((country) => {
          this.locations[country.code] = {
            ...country,
            magnitude: country.locations / max
          };
        });
      });
  },
  generateGlobe() {
    GeoJson.features.forEach(({ properties, geometry }) => {
      const countryCode = properties.ISO_A2;
      const materials = this.locations[countryCode] ? this.materials.slice(3) : this.materials.slice(0, 3);
      this.el.object3D.add(new CountryTile(geometry, materials, {
        title: properties.NAME,
        active: this.locations[countryCode],
        ...this.locations[countryCode]
      }));
    });
  }
});

AFRAME.registerSystem("earth-globe-movement", {
  init() {
    this.target = null;
    this.transforming = false;
    this.raycasters = {};

    this.planarInfo = {
      plane: new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100000, 100000, 2, 2),
        new THREE.MeshBasicMaterial({
          visible: false,
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
    const { plane, intersections, previousPointOnPlane } = this.planarInfo;

    this.el.camera.getWorldQuaternion(CAMERA_WORLD_QUATERNION);
    plane.quaternion.copy(CAMERA_WORLD_QUATERNION);
    this.target.getWorldPosition(plane.position);
    plane.matrixNeedsUpdate = true;
    plane.updateMatrixWorld(true);

    if (this.hasIntersection()) {
      this.transforming = true;
      previousPointOnPlane.copy(intersections[0].point);
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
    this.checkClickedCountry();
    this.startPlaneCasting();
  },
  tick() {
    if (!this.target) {
      return;
    }
    if (!this.transforming) {
      this.target.rotation.x -= this.target.rotation.x * 0.0005;
      this.target.rotation.y -= this.target.rotation.y * 0.0005;
      this.target.matrixNeedsUpdate = true;
      return;
    }
    const {
      plane,
      normal,
      intersections,
      previousPointOnPlane,
      currentPointOnPlane,
      deltaOnPlane,
      finalProjectedVec
    } = this.planarInfo;
    this.target.getWorldPosition(plane.position);
    this.el.camera.getWorldPosition(v);
    plane.matrixNeedsUpdate = true;
    const cameraToPlaneDistance = v.sub(plane.position).length();

    if (this.hasIntersection()) {
      normal.set(0, 0, -1).applyQuaternion(plane.quaternion);

      currentPointOnPlane.copy(intersections[0].point);
      deltaOnPlane.copy(currentPointOnPlane).sub(previousPointOnPlane);
      const SENSITIVITY = 5;
      finalProjectedVec
        .copy(deltaOnPlane)
        .projectOnPlane(normal)
        .applyQuaternion(q.copy(plane.quaternion).invert())
        .multiplyScalar(SENSITIVITY / cameraToPlaneDistance);

      v.set(1, 0, 0).applyQuaternion(CAMERA_WORLD_QUATERNION);
      q.setFromAxisAngle(v, -finalProjectedVec.y);

      v.set(0, 1, 0).applyQuaternion(CAMERA_WORLD_QUATERNION);
      q2.setFromAxisAngle(v, finalProjectedVec.x);

      this.target.quaternion.premultiply(q).premultiply(q2);

      this.target.rotation.z = THREE.MathUtils.clamp(this.target.rotation.z, -Math.PI / 2, Math.PI / 2);

      this.target.matrixNeedsUpdate = true;

      previousPointOnPlane.copy(currentPointOnPlane);
    }
  },
  hasIntersection() {
    const { plane, intersections } = this.planarInfo;
    intersections.length = 0;
    const raycaster = this.getRaycaster();
    const far = raycaster.far;
    raycaster.far = 1000;
    plane.raycast(raycaster, intersections);
    raycaster.far = far;
    return !!intersections[0];
  },
  checkClickedCountry() {
    const intersections = this.getRaycaster().intersectObjects(this.target.children);
    if (intersections.length && intersections[0].object.parent instanceof CountryTile) {
      this.target.dispatchEvent({
        type: "country-interact",
        object3D: intersections[0].object.parent
      });
    }
  },
  getRaycaster() {
    this.raycasters.right =
      this.raycasters.right ||
      document.getElementById("right-cursor-controller").components["cursor-controller"].raycaster;
    this.raycasters.left =
      this.raycasters.left ||
      document.getElementById("left-cursor-controller").components["cursor-controller"].raycaster;
    return this.hand.el.id === "player-left-controller" ? this.raycasters.left : this.raycasters.right;
  }
});
