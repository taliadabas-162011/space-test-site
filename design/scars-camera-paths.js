// Camera data and selection math sampled from the local Scars reference.
// Coordinates in this file are adapted for a Three.js scene; the original
// paths remain available through sampleSource(). See camera-mechanics.md.

const CAMERA_DATA_URL = '/clone-workspace/scars/02-extraction/camera-paths.raw';
const TAU = Math.PI * 2;
const COUNT = 3;
export const SELECTION_FRAME = 200;
export const SELECTION_TIME_SCALE = 1.4;
export const INTRO_DURATION_SECONDS = 4.2;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const normalize = angle => ((angle % TAU) + TAU) % TAU;
const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;

/**
 * Reference GameCamera intro in source scene units. `introProgress` starts at
 * 1 and falls to 0; the input pose is not mutated. This is separate from the
 * selection blend and can be applied to a sampled or already-blended pose.
 */
export function applyScarsIntro(pose, introProgress) {
  const progress = clamp(introProgress, 0, 1);
  const position = [...pose.position];
  const target = [...pose.target];
  const backwards = position.map((value, axis) => value - target[axis]);
  const distance = Math.hypot(...backwards);
  if (!distance) return { position, target };
  const baseZ = backwards.map(value => value / distance);
  const arc = easeInOutQuad(clamp(progress * 1.4 - 0.4, 0, 1));
  const pullback = easeInOutQuad(clamp(progress * 2.5, 0, 1));
  const angle = arc * Math.PI * 0.9;
  const horizontal = Math.hypot(baseZ[0], baseZ[2]);
  const right = horizontal > 0.000001 ? [baseZ[2] / horizontal, 0, -baseZ[0] / horizontal] : [1, 0, 0];
  const radius = distance + 300 * pullback;

  for (let axis = 0; axis < 3; axis++) {
    position[axis] = target[axis] + radius * (right[axis] * Math.sin(angle) + baseZ[axis] * Math.cos(angle));
  }
  target[0] -= (baseZ[0] * 300 + baseZ[2] * 300) * arc;
  target[2] -= (baseZ[2] * 300 - baseZ[0] * 300) * arc;
  target[1] += 50 * arc;
  return { position, target };
}

/** Original triangular character weights, eased and normalized as in CamsAnim.getTransform. */
export function selectionWeights(angle) {
  const fraction = normalize(angle) / TAU;
  const weights = Array.from({ length: COUNT }, (_, index) => {
    let distance = fraction - index / COUNT;
    if (distance > 0.666666) distance -= 1;
    return easeInOutQuad(clamp(1 - Math.abs(distance * 3), 0, 1));
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(weight => weight / sum);
}

/** Prevent opposing camera tracks from collapsing into the foreground model. */
export function maintainBlendedDistance(view, trackPoses) {
  const desired = trackPoses.reduce((sum, pose, index) => sum + view.weights[index] * Math.hypot(
    ...pose.position.map((value, axis) => value - pose.target[axis]),
  ), 0);
  const offset = view.position.map((value, axis) => value - view.target[axis]);
  const actual = Math.hypot(...offset);
  if (!actual || actual >= desired) return view;
  return { ...view, position: view.target.map((value, axis) => value + offset[axis] * desired / actual) };
}

/** Match the reference's shortest 120-degree route at 1 radian per 1.4 real seconds. */
export function advanceSelectionAngle(angle, targetIndex, realDtSeconds) {
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= COUNT) {
    throw new RangeError('Expected a character index from 0 to 2.');
  }
  const current = normalize(angle);
  const destination = targetIndex * TAU / COUNT;
  const delta = ((destination - current + Math.PI + TAU) % TAU) - Math.PI;
  const step = Math.max(0, realDtSeconds) / SELECTION_TIME_SCALE;
  return normalize(current + clamp(delta, -step, step));
}

/** Parse the original little-endian, three-track camera file. */
export function parseScarsCameraPaths(buffer) {
  const data = new DataView(buffer);
  if (buffer.byteLength < 4) throw new Error('The reference camera file is truncated.');
  const frames = data.getUint16(0, true);
  const subsamples = data.getUint16(2, true);
  const samplesPerTrack = frames * subsamples;
  if (!frames || !subsamples || buffer.byteLength !== 4 + COUNT * samplesPerTrack * 6 * 4) {
    throw new Error('The reference camera file has an unexpected layout.');
  }

  function sampleSource(index, frame) {
    if (!Number.isInteger(index) || index < 0 || index >= COUNT || !Number.isFinite(frame)) {
      throw new RangeError('Invalid camera track or frame.');
    }
    const sample = clamp(frame * subsamples, 0, samplesPerTrack - 1);
    const first = Math.floor(sample);
    const second = Math.min(first + 1, samplesPerTrack - 1);
    const blend = sample - first;
    const values = Array.from({ length: 6 }, (_, component) => {
      const a = data.getFloat32(4 + ((index * samplesPerTrack + first) * 6 + component) * 4, true);
      const b = data.getFloat32(4 + ((index * samplesPerTrack + second) * 6 + component) * 4, true);
      return a + (b - a) * blend;
    });
    return { position: values.slice(0, 3), target: values.slice(3, 6) };
  }

  return { frames, subsamples, sampleSource };
}

export async function loadScarsCameraPaths(url = CAMERA_DATA_URL) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load camera paths (${response.status}).`);
  return parseScarsCameraPaths(await response.arrayBuffer());
}

/**
 * Place characters on the reference's triangle and map its camera keyframes
 * to metres. Source look-at targets are used as approximate character anchors;
 * they are camera targets, not independently recovered rig-root positions.
 *
 * spread changes only the distance between the three anchors. zoomOut scales
 * each camera-to-target vector, retaining its view direction and keyframe
 * shape while allowing more of each astronaut to fit in the viewport.
 */
export function createScarsCameraRig(paths, {
  origin = [0, 0, 0], unitsToMeters = 0.01, spread = 1.4,
  lookHeight = 1.22, zoomOut = 1.7,
} = {}) {
  const baselines = Array.from({ length: COUNT }, (_, i) => paths.sampleSource(i, SELECTION_FRAME));
  const centerX = baselines.reduce((sum, pose) => sum + pose.target[0], 0) / COUNT;
  const centerZ = baselines.reduce((sum, pose) => sum + pose.target[2], 0) / COUNT;
  const anchors = baselines.map(({ target }) => [
    origin[0] + (target[0] - centerX) * unitsToMeters * spread,
    origin[1],
    origin[2] + (target[2] - centerZ) * unitsToMeters * spread,
  ]);
  const yaw = baselines.map(({ position, target }) =>
    Math.atan2(position[0] - target[0], position[2] - target[2]));

  function mapPose(index, pose) {
    const baseline = baselines[index].target;
    const target = pose.target.map((value, axis) =>
      anchors[index][axis] + (axis === 1 ? lookHeight : 0) + (value - baseline[axis]) * unitsToMeters);
    const trackZoom = Array.isArray(zoomOut) ? zoomOut[index] : zoomOut;
    const position = pose.position.map((value, axis) =>
      target[axis] + (value - pose.target[axis]) * unitsToMeters * trackZoom);
    return { position, target };
  }

  function sample(index, frame = SELECTION_FRAME) {
    return mapPose(index, paths.sampleSource(index, frame));
  }

  /** Same intro path retargeted to one astronaut; progress runs from 1 to 0. */
  function intro(index, introProgress, frame = SELECTION_FRAME) {
    return mapPose(index, applyScarsIntro(paths.sampleSource(index, frame), introProgress));
  }

  function blend(angle, frames = SELECTION_FRAME) {
    const weights = selectionWeights(angle);
    const position = [0, 0, 0];
    const target = [0, 0, 0];
    for (let i = 0; i < COUNT; i++) {
      const pose = sample(i, Array.isArray(frames) ? frames[i] : frames);
      for (let axis = 0; axis < 3; axis++) {
        position[axis] += pose.position[axis] * weights[i];
        target[axis] += pose.target[axis] * weights[i];
      }
    }
    return { position, target, weights };
  }

  return { anchors, yaw, sample, intro, blend };
}
