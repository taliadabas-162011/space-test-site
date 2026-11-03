// Adapts a captured Scars performance to a calmer, standing astronaut.
// The original poses remain available on the performer; this is an optional
// artistic retarget, not a faithful reproduction of the source choreography.

const END_FRAME = 200;
const REST = { hips: 0.65, spine: 0.6, head: 0.6, arms: 0.35, hands: 0.4, legs: 0.55, feet: 0.55 };
const ACTION = { hips: 0.6, spine: 0.55, head: 0.55, arms: 0.3, hands: 0.35, legs: 0.6, feet: 0.6 };

function group(name) {
  if (name === 'Hips') return 'hips';
  if (name.startsWith('Spine')) return 'spine';
  if (name === 'neck' || name === 'Head') return 'head';
  if (/Hand$/.test(name)) return 'hands';
  if (/Shoulder$|Arm$/.test(name)) return 'arms';
  if (/Foot$|ToeBase$/.test(name)) return 'feet';
  if (/Leg$/.test(name)) return 'legs';
  return 'default';
}

const clamp = (number, low, high) => Math.max(low, Math.min(high, number));
function setting(settings, name, fallback) {
  const value = settings[name] ?? settings[group(name)] ?? settings.default ?? fallback;
  return Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
}

/** Turn a source-world hip offset into stage-world coordinates. */
export function astronautHipOffset(offset, sourceYaw, stageYaw, weight = 0.3) {
  const x = Number.isFinite(offset?.[0]) ? offset[0] : 0;
  const z = Number.isFinite(offset?.[2]) ? offset[2] : 0;
  const angle = (Number.isFinite(stageYaw) ? stageYaw : 0) - (Number.isFinite(sourceYaw) ? sourceYaw : 0);
  const scale = Number.isFinite(weight) ? clamp(weight, 0, 1) : 0.3;
  return { x: (x * Math.cos(angle) + z * Math.sin(angle)) * scale, z: (z * Math.cos(angle) - x * Math.sin(angle)) * scale };
}

/**
 * @param {object} opts
 * @param {Object3D} opts.root Astronaut glTF scene, with bind-pose transforms.
 * @param {Object3D} opts.pivot Its stage parent. Must be attached to the scene.
 * @param {object} opts.performer A freshly created createScarsPerformer().
 * @param {object} opts.performance The corresponding source performance.
 * @param {number} [opts.rootMotion=0.3] Horizontal trajectory blend, 0..1.
 * @param {object} [opts.restBlend] Per-bone/group end-pose blend toward source.
 * @param {object} [opts.actionBlend] Per-bone/group motion blend around that end pose.
 * @param {number} [opts.maxGroundCorrection=0.08] Largest vertical adjustment in metres.
 * @returns {{applyFrame(frame:number,dt:number):{x:number,y:number,z:number},restore():void}}
 *
 * Each render: set the pivot's uncorrected position and yaw first; call
 * applyFrame; then add the returned delta to pivot.position. The delta assumes
 * the pivot's parent is a world-aligned stage. It is recomputed, not cumulative.
 */
export function createAstronautMotionRefinement({ root, pivot, performer, performance, rootMotion = 0.3, restBlend = {}, actionBlend = {}, maxGroundCorrection = 0.08 }) {
  if (!root || !pivot || !performer?.applyFrame || !performer?.hipOffset || !performance?.joints) throw new Error('An astronaut rig, pivot, performer and matching performance are required.');
  const rest = { ...REST, ...restBlend };
  const action = { ...ACTION, ...actionBlend };
  const entries = [];
  root.traverse(bone => {
    if (bone.isBone && performance.joints[bone.name]) entries.push({ bone, bind: bone.quaternion.clone() });
  });
  if (entries.length < 14) throw new Error(`Astronaut rig has only ${entries.length} matching joints.`);
  performer.applyFrame(END_FRAME);
  for (const entry of entries) {
    entry.end = entry.bone.quaternion.clone();
    entry.endInverse = entry.end.clone().invert();
    entry.rest = entry.bind.clone().slerp(entry.end, setting(rest, entry.bone.name, 0.6));
    entry.delta = entry.end.clone();
    entry.scaled = entry.end.clone();
    entry.identity = entry.end.clone().identity();
    entry.amount = setting(action, entry.bone.name, 0.7);
  }
  const contacts = ['LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'].map(name => root.getObjectByName(name)).filter(Boolean);
  if (!contacts.length) throw new Error('Astronaut rig has no foot contact joints.');
  const point = root.position.clone();
  const pivotPoint = root.position.clone();
  let smoothedGround;
  let previousFrame;

  function applyPose(frame) {
    performer.applyFrame(frame);
    for (const entry of entries) {
      // Rebase the movement around its source end pose so an invisible weapon
      // does not dictate the astronaut's held rest pose.
      entry.delta.copy(entry.endInverse).multiply(entry.bone.quaternion).normalize();
      entry.scaled.copy(entry.identity).slerp(entry.delta, entry.amount);
      entry.bone.quaternion.copy(entry.rest).multiply(entry.scaled).normalize();
    }
    root.updateWorldMatrix(true, true);
  }
  function lowestContact() {
    let lowest = Infinity;
    for (const contact of contacts) {
      contact.getWorldPosition(point);
      lowest = Math.min(lowest, point.y);
    }
    pivot.getWorldPosition(pivotPoint);
    return lowest - pivotPoint.y;
  }

  applyPose(END_FRAME);
  const referenceFootHeight = lowestContact();
  performer.restore();

  return {
    restPose() { return entries.map(entry => ({ bone: entry.bone, rotation: entry.rest.clone() })); },
    applyFrame(frame, dt = 0) {
      const current = Number.isFinite(frame) ? clamp(frame, 0, END_FRAME) : 0;
      applyPose(current);
      const correctionLimit = Number.isFinite(maxGroundCorrection) ? Math.max(0, maxGroundCorrection) : 0.08;
      const desiredGround = clamp(referenceFootHeight - lowestContact(), -correctionLimit, correctionLimit);
      // Scrubbing or restarting a selection is a discontinuity, not a frame to
      // interpolate through. In normal playback filter away bone-level jitter.
      if (smoothedGround === undefined || previousFrame === undefined || Math.abs(current - previousFrame) > 25) smoothedGround = desiredGround;
      else smoothedGround += (desiredGround - smoothedGround) * (1 - Math.exp(-12 * clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1)));
      previousFrame = current;
      const horizontal = astronautHipOffset(performer.hipOffset(current), performance.yawAtEnd, pivot.rotation.y, rootMotion);
      return { x: horizontal.x, y: smoothedGround, z: horizontal.z };
    },
    restore() { performer.restore(); smoothedGround = undefined; previousFrame = undefined; },
  };
}
