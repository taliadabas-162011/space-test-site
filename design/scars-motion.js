// Retarget the original Scars selection performance to the Grab3D astronaut.
// The source animation stores WORLD-space joint poses (not local bone rotations).
// This module applies world-space deltas from the source bind pose and converts
// them back to each target bone's current parent space. Callers own timing.
const TRACK_URL = '/space-test/design/scars-motion-tracks.json';
let tracksPromise;

export function loadScarsMotion() {
  if (!tracksPromise) tracksPromise = fetch(TRACK_URL).then(response => {
    if (!response.ok) throw new Error(`Could not load Scars motion (${response.status}).`);
    return response.json();
  }).catch(error => { tracksPromise = undefined; throw error; });
  return tracksPromise;
}

/**
 * @param {Object3D} root The loaded astronaut's glTF scene, after its placement.
 * @param {object} performance One of data.performances.k, .s, or .v.
 * @param {object} strengths Optional 0..1 blend toward the astronaut's bind pose.
 *   Keys may be a bone name or a group: hips, spine, head, arms, hands, legs, feet.
 *   Default is full source motion (1) for each joint.
 * @returns {{applyFrame(frame:number):void, hipOffset(frame:number):number[], setStrengths(object):void, restore():void}}
 */
export function createScarsPerformer(root, performance, strengths = {}) {
  if (!performance?.joints || !Number.isFinite(performance.yawAtEnd)) throw new Error('Invalid Scars performance.');
  root.updateWorldMatrix(true, true);
  // Reuse the runtime's own Quaternion/Matrix4 implementations instead of a second Three.js copy.
  const rootWorld = root.quaternion.clone();
  const boneWorld = root.quaternion.clone();
  const parentWorld = root.quaternion.clone();
  const q1 = root.quaternion.clone();
  const q2 = root.quaternion.clone();
  const desired = root.quaternion.clone();
  const correction = root.quaternion.clone().set(0, Math.sin(-performance.yawAtEnd / 2), 0, Math.cos(-performance.yawAtEnd / 2));
  const bindMatrix = root.matrix.clone();
  let motionStrengths = { ...strengths };
  const groupFor = name => {
    if (name === 'Hips') return 'hips';
    if (name.startsWith('Spine')) return 'spine';
    if (name === 'neck' || name === 'Head') return 'head';
    if (/Hand$/.test(name)) return 'hands';
    if (/Shoulder$|Arm$/.test(name)) return 'arms';
    if (/Foot$|ToeBase$/.test(name)) return 'feet';
    if (/Leg$/.test(name)) return 'legs';
    return 'default';
  };
  const strengthFor = name => {
    const value = motionStrengths[name] ?? motionStrengths[groupFor(name)] ?? motionStrengths.default ?? 1;
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
  };
  root.getWorldQuaternion(rootWorld);
  const invRoot = rootWorld.clone().invert();
  const entries = [];
  root.traverse(bone => {
    const track = performance.joints[bone.name];
    if (!track || !bone.isBone) return;
    bone.getWorldQuaternion(boneWorld);
    const targetBindInRoot = invRoot.clone().multiply(boneWorld);
    const sourceBindInverse = root.quaternion.clone().setFromRotationMatrix(bindMatrix.fromArray(track.bind)).invert();
    entries.push({bone, track, targetBindInRoot, sourceBindInverse, localBind: bone.quaternion.clone()});
  });
  if (entries.length < 14) throw new Error(`Astronaut rig has only ${entries.length} matching joints.`);

  function interpolate(frame, stride, values, output) {
    const value = Math.max(0, Math.min(200, Number.isFinite(frame) ? frame : 0));
    const first = Math.floor(value), second = Math.min(200, first + 1), mix = value - first;
    for (let i = 0; i < stride; i++) output[i] = values[first * stride + i] * (1 - mix) + values[second * stride + i] * mix;
    return output;
  }
  const a = [0, 0, 0, 1], b = [0, 0, 0, 1];
  const pos = [0, 0, 0], end = performance.hipPositions.slice(600, 603);
  return {
    applyFrame(frame) {
      const value = Math.max(0, Math.min(200, Number.isFinite(frame) ? frame : 0));
      const first = Math.floor(value), second = Math.min(200, first + 1), mix = value - first;
      root.updateWorldMatrix(true, true);
      root.getWorldQuaternion(rootWorld);
      // Object traversal visits parents before children, allowing each child to
      // compensate for its already-posed parent rather than double-rotating.
      for (const entry of entries) {
        const values = entry.track.quaternions;
        for (let j = 0; j < 4; j++) { a[j] = values[first * 4 + j]; b[j] = values[second * 4 + j]; }
        q1.set(...a).normalize(); q2.set(...b).normalize(); q1.slerp(q2, mix);
        desired.copy(rootWorld).multiply(correction).multiply(q1).multiply(entry.sourceBindInverse).multiply(entry.targetBindInRoot);
        entry.bone.parent.getWorldQuaternion(parentWorld).invert();
        // Blend in target-local space so zero restores that joint's bind pose
        // while still following a parent that may retain some source motion.
        q2.copy(parentWorld.multiply(desired)).normalize();
        entry.bone.quaternion.copy(entry.localBind).slerp(q2, strengthFor(entry.bone.name)).normalize();
        entry.bone.updateWorldMatrix(false, true);
      }
    },
    // Hip trajectory in source meters, relative to the final selection pose.
    // Rotate this vector by -yawAtEnd if applying in a front-facing stage.
    hipOffset(frame) { interpolate(frame, 3, performance.hipPositions, pos); return pos.map((value, i) => value - end[i]); },
    setStrengths(next) { motionStrengths = { ...next }; },
    restore() { for (const entry of entries) entry.bone.quaternion.copy(entry.localBind); root.updateWorldMatrix(true, true); },
  };
}
