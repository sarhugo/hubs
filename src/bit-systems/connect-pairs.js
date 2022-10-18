import { anyEntityWith, findAncestorEntity } from "../utils/bit-utils";
import { CONSTANTS } from "three-ammo";
const { DISABLE_DEACTIVATION, ACTIVE_TAG } = CONSTANTS.ACTIVATION_STATE;

import { addComponent, defineQuery, enterQuery, entityExists, Not, removeComponent, exitQuery, hasComponent } from "bitecs";
import {
  RemoteRight,
  RemoteLeft,
  HeldRemoteRight,
  HeldRemoteLeft,
  ConnectPairs,
  ConnectPairsInitialized,
  Rigidbody,
  Constraint,
  ConstraintRemoteLeft,
  ConstraintRemoteRight
} from "../bit-components";

const queryContentPairs = defineQuery([ConnectPairs]);
const queryEnterContentPairs = enterQuery(queryContentPairs);

const queryConnectPairsNotInitialized = defineQuery([ConnectPairs, Not(ConnectPairsInitialized)]);

const queryRemoteRight = defineQuery([HeldRemoteRight, ConnectPairs]);
const queryEnterRemoteRight = enterQuery(queryRemoteRight);
const queryExitRemoteRight = exitQuery(queryRemoteRight);

const queryRemoteLeft = defineQuery([HeldRemoteLeft, ConnectPairs]);
const queryEnterRemoteLeft = enterQuery(queryRemoteLeft);
const queryExitRemoteLeft = exitQuery(queryRemoteLeft);

const grabBodyOptions = { type: "dynamic", activationState: DISABLE_DEACTIVATION };
const releaseBodyOptions = { type: "dynamic", activationState: ACTIVE_TAG };

function add(world, physicsSystem, interactor, constraintComponent, entities) {
  if (entities.length) {
    const toInitialize = queryConnectPairsNotInitialized(world).filter(x => !entities.includes(x));
    for (let i = 0; i < toInitialize.length; i++) {
      const eid = findAncestorEntity(world, toInitialize[i], ancestor => hasComponent(world, Rigidbody, ancestor));
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], releaseBodyOptions);
      addComponent(world, ConnectPairsInitialized, eid);
    }
  }
  for (let i = 0; i < entities.length; i++) {
    const eid = findAncestorEntity(world, entities[i], ancestor => hasComponent(world, Rigidbody, ancestor));
    physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], grabBodyOptions);
    physicsSystem.addConstraint(interactor, Rigidbody.bodyId[eid], Rigidbody.bodyId[interactor], {
      type: "pointToPoint",
      pivot: new THREE.Vector3(0,0,0),
      targetPivot: new THREE.Vector3(0,0,0)
    });
    addComponent(world, Constraint, eid);
    addComponent(world, constraintComponent, eid);
  }
}

function initialize(world, entities) {
  for (let i = 0; i < entities.length; i++) {
    const eid = findAncestorEntity(world, entities[i], ancestor => hasComponent(world, Rigidbody, ancestor));
    if (!entityExists(world, eid)) continue;
    const obj = world.eid2obj.get(eid);
    obj.position.copy(obj.userData.originalPosition);
    delete obj.userData.originalPosition;
    obj.matrixNeedsUpdate = true;
  }
}

function remove(world, offersConstraint, constraintComponent, physicsSystem, interactor, entities) {
  for (let i = 0; i < entities.length; i++) {
    const eid = findAncestorEntity(world, entities[i], ancestor => hasComponent(world, Rigidbody, ancestor));
    if (!entityExists(world, eid)) continue;
    if (hasComponent(world, offersConstraint, entities[i]) && hasComponent(world, Rigidbody, eid)) {
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], releaseBodyOptions);
      physicsSystem.removeConstraint(interactor);
      removeComponent(world, constraintComponent, eid);
      if (
        !hasComponent(world, ConstraintRemoteLeft, eid) &&
        !hasComponent(world, ConstraintRemoteRight, eid)
      ) {
        removeComponent(world, Constraint, eid);
      }
    }
  }
}

export function connectPairsSystem(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  initialize(world, queryEnterContentPairs(world));
  add(world, physicsSystem, anyEntityWith(world, RemoteRight), ConstraintRemoteRight, queryEnterRemoteRight(world));
  add(world, physicsSystem, anyEntityWith(world, RemoteLeft), ConstraintRemoteLeft, queryEnterRemoteLeft(world));
  remove(
    world,
    ConnectPairs,
    ConstraintRemoteRight,
    physicsSystem,
    anyEntityWith(world, RemoteRight),
    queryExitRemoteRight(world)
  );
  remove(
    world,
    ConnectPairs,
    ConstraintRemoteLeft,
    physicsSystem,
    anyEntityWith(world, RemoteLeft),
    queryExitRemoteLeft(world)
  );
}
