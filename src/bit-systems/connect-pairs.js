import { spawnEmojiInFrontOfUser, emojis } from "../components/emoji";
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
  ConnectPairsConnected,
  ConnectPairsInitialized,
  ConnectPairsPuzzle,
  Rigidbody,
  Constraint,
  ConstraintRemoteLeft,
  ConstraintRemoteRight
} from "../bit-components";

const queryContentPairsPuzzle = defineQuery([ConnectPairsPuzzle]);
const queryEnterContentPairsPuzzle = enterQuery(queryContentPairsPuzzle);

const queryContentPairs = defineQuery([ConnectPairs]);
const queryEnterContentPairs = enterQuery(queryContentPairs);

const queryConnectPairsNotInitialized = defineQuery([ConnectPairs, Not(ConnectPairsInitialized)]);
const queryToInitialize = enterQuery(queryConnectPairsNotInitialized);

const queryRemoteRight = defineQuery([HeldRemoteRight, ConnectPairs, Not(ConnectPairsConnected)]);
const queryEnterRemoteRight = enterQuery(queryRemoteRight);
const queryExitRemoteRight = exitQuery(queryRemoteRight);

const queryRemoteLeft = defineQuery([HeldRemoteLeft, ConnectPairs, Not(ConnectPairsConnected)]);
const queryEnterRemoteLeft = enterQuery(queryRemoteLeft);
const queryExitRemoteLeft = exitQuery(queryRemoteLeft);

const queryConnected = defineQuery([ConnectPairs, ConnectPairsConnected]);
const queryEnterConnected = enterQuery(queryConnected);

const grabBodyOptions = { type: "dynamic", activationState: DISABLE_DEACTIVATION };
const releaseBodyOptions = { activationState: ACTIVE_TAG };
const connectedBodyOptions = { type: "static" };

const PIECE_EDGE = new THREE.Vector3(0, .25, 0);
const PIECE_SNAP = .25;

function add(world, physicsSystem, interactor, constraintComponent, entities) {
  if (entities.length) {
    const toInitialize = queryToInitialize(world).filter(x => !entities.includes(x));
    for (let i = 0; i < toInitialize.length; i++) {
      const eid = findAncestorEntity(world, toInitialize[i], ancestor => hasComponent(world, Rigidbody, ancestor));
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], { type: "dynamic" });
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

function initializePuzzle(world, entities) {
  for (let i = 0; i < entities.length; i++) {
    const unlock = world.eid2obj.get(ConnectPairsPuzzle.unlockRef[entities[i]])
    unlock.el.setAttribute("visible", false)
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

function findPairCollision(world, physicsSystem, entities) {
  for (let i = 0; i < entities.length; i++) {
    const eid = findAncestorEntity(world, entities[i], ancestor => hasComponent(world, Rigidbody, ancestor));
    if (!entityExists(world, eid)) continue;
    const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eid])
      .map((uuid) => {
        const bodyData = physicsSystem.bodyUuidToData.get(uuid);
        const object3D = bodyData && bodyData.object3D;
        if (object3D && hasComponent(world, ConnectPairs, object3D.eid)) {
          return object3D.eid;
        }
      }).filter(Boolean);
    for (let j = 0; j < collisions.length; j++) {
      if (ConnectPairs.pair[eid] === ConnectPairs.pair[collisions[j]] &&
        ConnectPairs.side[eid] != ConnectPairs.side[collisions[j]]) {
        const obj = world.eid2obj.get(eid);
        const target = world.eid2obj.get(collisions[j]);
        const objEdge = ConnectPairs.side[eid] ? obj.position.clone().add(PIECE_EDGE) : obj.position.clone().sub(PIECE_EDGE);
        const targetEdge = ConnectPairs.side[eid] ? target.position.clone().sub(PIECE_EDGE) : target.position.clone().add(PIECE_EDGE);        
        if (objEdge.distanceTo(targetEdge) < PIECE_SNAP) {
          target.position.copy(objEdge);
          target.matrixNeedsUpdate = true;
          physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], connectedBodyOptions);
          physicsSystem.updateBodyOptions(Rigidbody.bodyId[collisions[j]], connectedBodyOptions);
          addComponent(world, ConnectPairsConnected, eid);
          addComponent(world, ConnectPairsConnected, collisions[j]);
          spawnEmojiInFrontOfUser(emojis.find(emoji => emoji.id === "clap"));
        }
      }
    }
  }
}

function isItFinished(world, puzzles, pairs, connections, justConnected) {
  if (justConnected.length) return;
  for (let i = 0; i < puzzles.length; i++) {
    const unlock = world.eid2obj.get(ConnectPairsPuzzle.unlockRef[puzzles[i]])
    unlock.el.setAttribute("visible", pairs.length == connections.length)
  }
}

export function connectPairsSystem(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  initialize(world, queryEnterContentPairs(world));
  initializePuzzle(world, queryEnterContentPairsPuzzle(world));
  add(world, physicsSystem, anyEntityWith(world, RemoteRight), ConstraintRemoteRight, queryEnterRemoteRight(world));
  add(world, physicsSystem, anyEntityWith(world, RemoteLeft), ConstraintRemoteLeft, queryEnterRemoteLeft(world));
  findPairCollision(world, physicsSystem, queryRemoteRight(world));
  findPairCollision(world, physicsSystem, queryRemoteLeft(world));
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

  isItFinished(world, queryContentPairsPuzzle(world), queryContentPairs(world), queryConnected(world), queryEnterConnected(world));
}
