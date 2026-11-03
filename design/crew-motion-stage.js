import { Scene, WebGLRenderer, PerspectiveCamera, Vector3, PointLight, Plane } from '/space-test-site/design/vendor/three/three.module.min.js';
import { GLTFLoader } from '/space-test-site/design/vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '/space-test-site/design/vendor/three/examples/jsm/loaders/DRACOLoader.js';
import {
  loadScarsCameraPaths, createScarsCameraRig, advanceSelectionAngle,
  maintainBlendedDistance, SELECTION_FRAME, INTRO_DURATION_SECONDS,
} from '/space-test-site/design/scars-camera-paths.js';
import { loadScarsMotion, createScarsPerformer } from '/space-test-site/design/scars-motion.js';
import { createAstronautMotionRefinement } from '/space-test-site/design/astronaut-motion-refinement.js';
import { createCrewEnvironment } from '/space-test-site/design/crew-environment.js?v=astronaut-3';

const MODEL_URL = '/space-test-site/design/astronaut-preview/assets/grab3d.glb';
const MODEL_HEIGHT = 1.9;
const LINE_POSITIONS = [-1.65, 0, 1.65];
const LINE_YAW = [-0.13, 0.02, 0.13];
const MODEL_TINTS = [0xcbdff2, 0xffffff, 0xc1cedc];
// The first inward section of each reference track; later frames follow weapons.
const DETAIL_FRAMES = [60, 70, 80];
const TAU = Math.PI * 2;
const SECTOR = TAU / 3;
const TRANSITION_MS = 2932;
const INTRO_FPS = 25 / 1.4;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const ease = t => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
// Vibrant's organ-focus move uses power2.inOut (cubic) over one second.
const anatomyEase = t => t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
const ANATOMY_FOCUS = {
  circulation: { height: 1.46, desktop: 0.23, mobile: 0.43 },
};
const HEART_DETAIL_FOCUS = { height: 1.46, desktop: 0.075, mobile: 0.12 };
const angleDifference = (a, b) => ((b - a + Math.PI * 3) % TAU) - Math.PI;

/** Shared astronaut stage using Scars' captured camera tracks and switch weights. */
export async function createCrewStage(canvas, onFrame = () => {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.localClippingEnabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.05, 100);
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/space-test-site/design/assets/draco/');
  loader.setDRACOLoader(draco);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  const models = [];
  const projected = new Vector3();
  const position = new Vector3();
  const target = new Vector3();
  const offset = new Vector3();
  const horizontalAxis = new Vector3();
  const anatomyPoint = new Vector3();
  const up = new Vector3(0, 1, 0);
  let cameraRig;
  let environment;
  let frameId = 0;
  let width = 0;
  let height = 0;
  let projectionOffset = NaN;
  let recording = false;
  let recordViewMix = 0;
  let recordViewMove = null;
  let framing = 0;
  let selected = null;
  let targetIndex = 0;
  let angle = 0;
  let layout = 0;
  let layoutMove = null;
  let introIndex = null;
  let frameTime = 0;
  let inspectTarget = 0;
  let inspectPosition = 0;
  let dragging = false;
  let dragStart = 0;
  let anatomyIndex = null;
  let anatomyMix = 0;
  let anatomyMove = null;
  let anatomyRevision = 0;
  const anatomyFocus = { height: 1.05, scale: 1, center: 0 };
  let anatomyFocusMove = null;
  let anatomyFocusRegion = null;
  let heartDetail = false;
  let anatomyFocusMobile = window.innerWidth < 768;
  let paused = true;
  let disposed = false;

  function addLight(color, intensity, x, y, z) {
    const light = new PointLight(color, intensity, 0);
    light.position.set(x, y, z);
    scene.add(light);
  }
  addLight(0xe4f3ff, 105, -5, 4.5, 1);
  addLight(0xc8e5ff, 105, 5, 4.5, 1);
  addLight(0x2696ff, 55, 0, 3, -3.5);
  addLight(0xc8e5ff, 70, 0, 4, -6);

  function measure(root) {
    root.updateMatrixWorld(true);
    let bounds;
    root.traverse(node => {
      if (!node.isMesh || !node.geometry.attributes.position) return;
      if (node.isSkinnedMesh) {
        node.computeBoundingBox();
        node.frustumCulled = false;
      } else node.geometry.computeBoundingBox();
      const part = (node.isSkinnedMesh ? node.boundingBox : node.geometry.boundingBox)
        .clone().applyMatrix4(node.matrixWorld);
      bounds ? bounds.union(part) : bounds = part;
    });
    if (!bounds) throw new Error('Astronaut model has no visible geometry.');
    return bounds;
  }

  try {
    const [response, paths, motion] = await Promise.all([fetch(MODEL_URL), loadScarsCameraPaths(), loadScarsMotion()]);
    if (!response.ok) throw new Error(`Astronaut model request failed (${response.status}).`);
    cameraRig = createScarsCameraRig(paths, { lookHeight: 1.05, zoomOut: [2.1, 1.5, 2.1] });
    // Keep the overview and the reference camera tracks in one world: the
    // crew do not slide to new locations when the camera begins its orbit.
    cameraRig.anchors.forEach((anchor, i) => anchor.splice(0, 3, LINE_POSITIONS[i], 0, 0));
    const bytes = await response.arrayBuffer();
    for (let i = 0; i < LINE_POSITIONS.length; i++) {
      const gltf = await loader.parseAsync(bytes.slice(0), '/space-test-site/design/astronaut-preview/assets/');
      const root = gltf.scene;
      const bounds = measure(root);
      const size = bounds.getSize(new Vector3());
      const center = bounds.getCenter(new Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Astronaut model has invalid dimensions.');
      const scale = MODEL_HEIGHT / size.y;
      root.scale.multiplyScalar(scale);
      root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      const pivot = new Scene();
      pivot.position.x = LINE_POSITIONS[i];
      pivot.add(root);
      scene.add(pivot);
      const materialStates = new Map();
      const bones = [];
      const suitPlane = new Plane(new Vector3(0, -1, 0), MODEL_HEIGHT * 1.1);
      root.traverse(node => {
        if (node.isBone) bones.push(node);
        if (!node.isMesh) return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (material?.color) material.color.setHex(MODEL_TINTS[i]);
          if (material && !materialStates.has(material)) materialStates.set(material, {
            opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite,
          });
          if (material) material.clippingPlanes = [suitPlane];
        }
      });
      const performanceTrack = motion.performances[['k', 's', 'v'][i]];
      const performer = createScarsPerformer(root, performanceTrack, {
        hips: 0.55, spine: 0.8, head: 0.8, arms: 0.7, hands: 0.3, legs: 0.35, feet: 0.25,
      });
      const refinement = createAstronautMotionRefinement({ root, pivot, performer, performance: performanceTrack });
      models.push({ pivot, root, refinement, materialStates, bones, suitPlane, frame: reducedMotion.matches ? SELECTION_FRAME : i * 40 });
    }
    environment = await createCrewEnvironment(scene, { camera, loader, reducedMotion: reducedMotion.matches });
    for (const warning of environment.warnings) console.warn(warning);
  } catch (error) {
    dispose();
    throw error;
  }

  function dimensions() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const mobile = window.innerWidth < 768;
    if (mobile !== anatomyFocusMobile) {
      anatomyFocusMobile = mobile;
      if (anatomyFocusRegion) moveAnatomyFocus(anatomyFocusRegion);
    }
    const nextOffset = mobile && selected !== null ? -0.12 : framing;
    const resized = w !== width || h !== height;
    if (!resized && Math.abs(nextOffset - projectionOffset) < 0.0001) return;
    width = w;
    height = h;
    projectionOffset = nextOffset;
    if (resized) renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (Math.abs(nextOffset) >= 0.0001) camera.setViewOffset(width, height, width * nextOffset, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function overviewDistance() {
    const aspect = width / height || 1;
    return window.innerWidth < 768 ? 5.2 : Math.max(5.9, 2.4 / (aspect * Math.tan(17 * Math.PI / 180)));
  }

  function capturePoseTransition(model) {
    return { start: null, fromMovement: { ...(model.lastMovement || { x: 0, y: 0, z: 0 }) },
      bones: model.bones.map(bone => ({ bone, from: bone.quaternion.clone(), to: bone.quaternion.clone() })) };
  }

  function changeLayout(to, duration = TRANSITION_MS) {
    layoutMove = { from: layout, to, start: performance.now(), duration: reducedMotion.matches ? 0 : duration };
  }

  function focus(index) {
    if (disposed) return;
    if (!Number.isInteger(index) || index < 0 || index >= models.length) throw new RangeError('Crew index must be 0, 1, or 2.');
    const fromOverview = selected === null;
    const changed = selected !== index;
    selected = index;
    targetIndex = index;
    dragging = false;
    if (fromOverview) {
      angle = index * SECTOR;
      introIndex = index;
      changeLayout(1, INTRO_DURATION_SECONDS * 1000);
    } else if (changed) {
      introIndex = null;
    }
    if (changed) {
      if (!reducedMotion.matches) models[index].poseTransition = capturePoseTransition(models[index]);
      models[index].frame = reducedMotion.matches ? SELECTION_FRAME : 0;
      inspectPosition = 0;
      inspectTarget = 0;
    }
    if (paused) render(performance.now());
  }

  function overview() {
    if (disposed) return;
    setRecordView(false);
    selected = null;
    introIndex = null;
    dragging = false;
    inspectTarget = 0;
    changeLayout(0);
    if (paused) render(performance.now());
  }

  function setRecording(value) {
    recording = Boolean(value);
    if (paused) render(performance.now());
  }

  function updateRecordView(now, isReduced) {
    if (!recordViewMove) return;
    const t = isReduced || !recordViewMove.duration ? 1 : clamp((now - recordViewMove.start) / recordViewMove.duration, 0, 1);
    recordViewMix = recordViewMove.from + (recordViewMove.to - recordViewMove.from) * anatomyEase(t);
    if (t === 1) recordViewMove = null;
  }

  function setRecordView(enabled) {
    if (disposed || (enabled && selected === null)) return false;
    const now = performance.now();
    updateRecordView(now, reducedMotion.matches);
    recordViewMove = { from: recordViewMix, to: enabled ? 1 : 0, start: now, duration: reducedMotion.matches ? 0 : 1200 };
    if (paused) { updateRecordView(now, true); render(now); }
    return true;
  }

  function updateAnatomyFocus(now, isReduced) {
    if (!anatomyFocusMove) return;
    const t = isReduced || !anatomyFocusMove.duration
      ? 1 : clamp((now - anatomyFocusMove.start) / anatomyFocusMove.duration, 0, 1);
    const blend = anatomyEase(t);
    anatomyFocus.height = anatomyFocusMove.from.height + (anatomyFocusMove.to.height - anatomyFocusMove.from.height) * blend;
    anatomyFocus.scale = anatomyFocusMove.from.scale + (anatomyFocusMove.to.scale - anatomyFocusMove.from.scale) * blend;
    anatomyFocus.center = anatomyFocusMove.from.center + (anatomyFocusMove.to.center - anatomyFocusMove.from.center) * blend;
    if (t === 1) anatomyFocusMove = null;
  }

  function moveAnatomyFocus(region) {
    const now = performance.now();
    updateAnatomyFocus(now, reducedMotion.matches);
    const settings = region === 'circulation' && heartDetail ? HEART_DETAIL_FOCUS : region ? ANATOMY_FOCUS[region] : null;
    anatomyFocusMove = {
      from: { ...anatomyFocus },
      to: settings ? { height: settings.height, scale: anatomyFocusMobile ? settings.mobile : settings.desktop, center: 1 } : { height: 1.05, scale: 1, center: 0 },
      start: region && anatomyMove?.to === 1 && !reducedMotion.matches
        ? Math.max(now, anatomyMove.start + anatomyMove.duration * 0.55) : now,
      duration: reducedMotion.matches ? 0 : 1000,
    };
  }

  async function setAnatomy(enabled, bodyModel) {
    const revision = ++anatomyRevision;
    if (!enabled) {
      anatomyFocusRegion = null;
      heartDetail = false;
      if (anatomyIndex !== null) models[anatomyIndex].anatomy?.setHeartDetail(false);
      moveAnatomyFocus(null);
      anatomyMove = { from: anatomyMix, to: 0, start: performance.now(), duration: reducedMotion.matches ? 0 : 1100 };
      if (paused) render(performance.now());
      return true;
    }
    if (disposed || selected === null) return false;
    const index = selected;
    const model = models[index];
    if (!model.anatomy) {
      const { createCrewAnatomy } = await import('/space-test-site/design/crew-anatomy.js?v=source-focus-4');
      const anatomy = await createCrewAnatomy({ loader, parent: model.pivot, model: bodyModel });
      if (disposed || revision !== anatomyRevision || selected !== index) { anatomy.dispose(); return false; }
      model.anatomy = anatomy;
      anatomy.setOpacity(0);
    }
    anatomyIndex = index;
    anatomyFocusRegion = null;
    heartDetail = false;
    model.anatomy.setFocus('overview');
    model.anatomy.setHeartDetail(false);
    moveAnatomyFocus(null);
    anatomyMix = 0;
    const start = performance.now();
    model.neutralPose = { start, bones: model.refinement.restPose().map(({ bone, rotation }) => ({ bone, from: bone.quaternion.clone(), to: rotation })) };
    anatomyMove = { from: 0, to: 1, start: start + (reducedMotion.matches ? 0 : 650), duration: reducedMotion.matches ? 0 : 1900 };
    return true;
  }

  function focusAnatomyRegion(region) {
    if (!['circulation', 'recovery', 'daily'].includes(region) || anatomyIndex === null) return;
    // Only circulation has a corresponding anatomical visual. Sleep,
    // exercise, and hydration remain neutral whole-body contexts.
    anatomyFocusRegion = ANATOMY_FOCUS[region] ? region : null;
    heartDetail = false;
    moveAnatomyFocus(anatomyFocusRegion);
    models[anatomyIndex].anatomy?.setFocus(anatomyFocusRegion || 'overview');
    models[anatomyIndex].anatomy?.setHeartDetail(false);
    if (paused) render(performance.now());
  }

  function focusHeartDetail(enabled) {
    if (anatomyIndex === null || selected !== anatomyIndex || anatomyFocusRegion !== 'circulation') return false;
    heartDetail = Boolean(enabled);
    models[anatomyIndex].anatomy?.setHeartDetail(heartDetail);
    moveAnatomyFocus('circulation');
    if (paused) {
      const now = performance.now();
      updateAnatomyFocus(now, true);
      models[anatomyIndex].anatomy?.update(now / 1000, anatomyMix, true, 0);
      render(now);
    }
    return true;
  }

  function beginDrag() {
    if (selected === null || disposed) return;
    dragging = true;
    dragStart = angle;
  }
  function dragTo(fraction) {
    if (!dragging) return;
    // Scars maps horizontal pointer displacement to 1.4 radians in its normalized coordinates.
    angle = dragStart - fraction * 2.8;
  }
  function endDrag() {
    dragging = false;
    return ((Math.round(angle / SECTOR) % 3) + 3) % 3;
  }
  function scrubBy(pixels) {
    if (selected === null || disposed) return;
    inspectTarget = clamp(inspectTarget + pixels / 2500, 0, 1);
  }

  function screenPoint(x, y, z, rect) {
    projected.set(x, y, z).project(camera);
    return { x: rect.left + (projected.x + 1) * rect.width / 2, y: rect.top + (1 - projected.y) * rect.height / 2 };
  }

  function render(now) {
    if (disposed) return;
    const dt = frameTime ? clamp((now - frameTime) / 1000, 0, 0.05) : 0;
    frameTime = now;
    const isReduced = reducedMotion.matches;
    const portraitRoom = window.innerWidth >= 768 ? clamp((1.1 - window.innerWidth / window.innerHeight) / 0.35, 0, 1) : 0;
    updateRecordView(now, isReduced);
    const recordWeight = recordViewMix * layout * (1 - anatomyMix);
    const recordingFraming = recording && selected !== null && window.innerWidth >= 768 ? 0.16 - 0.04 * portraitRoom : 0;
    const anatomyFraming = window.innerWidth >= 768 && anatomyIndex !== null && selected === anatomyIndex
      ? 0.13 * anatomyFocus.center * anatomyMix : 0;
    const recordFraming = window.innerWidth >= 768 ? 0.13 * recordWeight : 0;
    const framingTarget = Math.max(recordingFraming, recordFraming) + anatomyFraming;
    framing += (framingTarget - framing) * (isReduced || paused ? 1 : 1 - Math.exp(-5 * dt));
    dimensions();
    if (anatomyMove) {
      const t = !isReduced && anatomyMove.duration ? clamp((now - anatomyMove.start) / anatomyMove.duration, 0, 1) : 1;
      anatomyMix = anatomyMove.from + (anatomyMove.to - anatomyMove.from) * ease(t);
      if (t === 1) {
        if (anatomyMove.to === 0) {
          if (anatomyIndex !== null) {
            const model = models[anatomyIndex];
            if (!isReduced) model.poseTransition = capturePoseTransition(model);
            model.neutralPose = null;
          }
          anatomyIndex = null;
        }
        anatomyMove = null;
      }
    }
    let introProgress = 0;
    if (layoutMove) {
      const t = !isReduced && layoutMove.duration ? clamp((now - layoutMove.start) / layoutMove.duration, 0, 1) : 1;
      layout = layoutMove.from + (layoutMove.to - layoutMove.from) * ease(t);
      if (introIndex !== null && layoutMove.to === 1) introProgress = 1 - t;
      if (t === 1) { layoutMove = null; introIndex = null; }
    }
    if (selected !== null && !dragging) {
      angle = isReduced ? targetIndex * SECTOR : advanceSelectionAngle(angle, targetIndex, dt);
      if (anatomyIndex !== selected) models[selected].frame = isReduced ? SELECTION_FRAME : Math.min(SELECTION_FRAME, models[selected].frame + INTRO_FPS * dt);
    } else if (selected === null && !isReduced) {
      models.forEach(model => { model.frame = Math.min(SELECTION_FRAME, model.frame + INTRO_FPS * dt); });
    }
    inspectPosition += (inspectTarget - inspectPosition) * (isReduced ? 1 : 1 - Math.exp(-4 * dt));

    const frames = [SELECTION_FRAME, SELECTION_FRAME, SELECTION_FRAME];
    if (selected !== null) frames[selected] += inspectPosition * DETAIL_FRAMES[selected];
    let view = cameraRig.blend(angle, frames);
    if (Math.max(...view.weights) < 0.999) {
      view = maintainBlendedDistance(view, frames.map((frame, i) => cameraRig.sample(i, frame)));
    }
    if (selected !== null && inspectPosition > 0 && view.weights[selected] > 0.999) {
      const anchor = cameraRig.anchors[selected];
      const dx = view.target[0] - anchor[0], dz = view.target[2] - anchor[2];
      const displacement = Math.hypot(dx, dz);
      const limit = window.innerWidth < 900 ? 0.15 : 0.4;
      if (displacement > limit) {
        const correction = 1 - limit / displacement;
        view.target[0] -= dx * correction; view.position[0] -= dx * correction;
        view.target[2] -= dz * correction; view.position[2] -= dz * correction;
      }
    }
    if (introIndex !== null && introProgress > 0) {
      const intro = cameraRig.intro(introIndex, introProgress * 0.45, frames[introIndex]);
      view.position = intro.position;
      view.target = intro.target;
    }
    const overviewHeight = window.innerWidth < 768
      ? 1.04 - clamp((844 - height) * 0.0007, 0, 0.14)
      : 0.9 - clamp((720 - height) * 0.001, 0, 0.3);
    position.set(0, overviewHeight, overviewDistance()).lerp(new Vector3(...view.position), layout);
    target.set(0, overviewHeight, 0).lerp(new Vector3(...view.target), layout);
    if (recordWeight > 0) {
      offset.copy(position).sub(target);
      target.y += (1.30 - target.y) * recordWeight;
      offset.applyAxisAngle(up, 0.18 * recordWeight);
      position.copy(target).add(offset.multiplyScalar(1 - 0.22 * recordWeight));
    }
    updateAnatomyFocus(now, isReduced);
    if (anatomyIndex !== null && selected === anatomyIndex && anatomyMix > 0) {
      offset.copy(position).sub(target);
      const model = models[anatomyIndex];
      const organ = anatomyFocusRegion === 'recovery' ? 'brain' : anatomyFocusRegion === 'circulation' ? 'heart' : null;
      const focusNode = organ && model.anatomy?.root.getObjectByName(organ);
      if (focusNode) focusNode.getWorldPosition(anatomyPoint);
      else anatomyPoint.copy(model.pivot.position);
      const centering = anatomyFocus.center * anatomyMix;
      target.x += (anatomyPoint.x - target.x) * centering;
      target.z += (anatomyPoint.z - target.z) * centering;
      const focusHeight = model.pivot.position.y + anatomyFocus.height;
      target.y += (focusHeight - target.y) * anatomyMix;
      position.copy(target).add(offset.multiplyScalar(1 + (anatomyFocus.scale - 1) * anatomyMix));
    }
    if (portraitRoom && selected !== null) {
      offset.copy(position).sub(target);
      position.copy(target).add(offset.multiplyScalar(1 + 0.55 * portraitRoom * layout));
    }
    pointer.smoothX += (pointer.x - pointer.smoothX) * (1 - Math.exp(-dt));
    pointer.smoothY += (pointer.y - pointer.smoothY) * (1 - Math.exp(-dt));
    if (!isReduced) {
      offset.copy(position).sub(target);
      offset.applyAxisAngle(up, pointer.smoothX * 0.1);
      horizontalAxis.crossVectors(up, offset).normalize();
      offset.applyAxisAngle(horizontalAxis, -pointer.smoothY * 0.1);
      position.copy(target).add(offset);
    }
    camera.position.copy(position);
    camera.lookAt(target);
    camera.updateMatrixWorld();

    models.forEach((model, i) => {
      const anchor = cameraRig.anchors[i];
      model.pivot.position.set(LINE_POSITIONS[i] + (anchor[0] - LINE_POSITIONS[i]) * layout, anchor[1] * layout, anchor[2] * layout);
      model.pivot.rotation.y = LINE_YAW[i] + angleDifference(LINE_YAW[i], cameraRig.yaw[i]) * layout;
      // Ease the reference's visibility threshold to avoid figures popping
      // while the wider astronaut composition is still on screen.
      const overviewFade = 1 - ease(clamp((layout - 0.04) / 0.24, 0, 1));
      const trackFade = i === targetIndex
        ? ease(clamp((view.weights[i] - 0.1) / 0.45, 0, 1))
        : ease(clamp((view.weights[i] - 0.45) / 0.5, 0, 1));
      let fade = Math.max(overviewFade, trackFade);
      if (recording && selected !== null && i !== targetIndex) fade *= 1 - ease(clamp(layout / 0.08, 0, 1));
      if (selected === null && window.innerWidth < 768 && window.innerWidth > window.innerHeight * 1.2 && i !== 1) fade = 0;
      model.pivot.visible = fade > 0.001;
      const reveal = i === anatomyIndex ? anatomyMix : 0;
      const bodyOpacity = reveal > 0.001 ? fade : 0;
      const suitOpacity = fade;
      for (const [material, original] of model.materialStates) {
        const transparent = original.transparent || suitOpacity < 0.999;
        if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
        material.opacity = original.opacity * suitOpacity;
        material.depthWrite = original.depthWrite && suitOpacity > 0.99;
      }
      if (!model.pivot.visible) return;
      const movement = model.refinement.applyFrame(isReduced ? SELECTION_FRAME : model.frame, dt);
      if (model.poseTransition) {
        if (model.poseTransition.start === null) model.poseTransition.start = now;
        const t = isReduced ? 1 : clamp((now - model.poseTransition.start) / 650, 0, 1);
        const blend = ease(t);
        for (const entry of model.poseTransition.bones) {
          entry.to.copy(entry.bone.quaternion);
          entry.bone.quaternion.copy(entry.from).slerp(entry.to, blend);
        }
        for (const axis of ['x', 'y', 'z']) movement[axis] = model.poseTransition.fromMovement[axis] + (movement[axis] - model.poseTransition.fromMovement[axis]) * blend;
        if (t === 1) model.poseTransition = null;
      }
      if (model.neutralPose) {
        const t = isReduced ? 1 : clamp((now - model.neutralPose.start) / 650, 0, 1);
        for (const entry of model.neutralPose.bones) entry.bone.quaternion.copy(entry.from).slerp(entry.to, ease(t));
      }
      model.lastMovement = { ...movement };
      model.pivot.position.x += movement.x;
      model.pivot.position.y += movement.y;
      model.pivot.position.z += movement.z;
      model.suitPlane.constant = model.pivot.position.y + MODEL_HEIGHT * (1.05 - 1.1 * reveal);
      if (model.anatomy) {
        model.anatomy.setOpacity(bodyOpacity);
        model.anatomy.setReveal(reveal, model.pivot.position.y);
        model.anatomy.update(isReduced ? 0 : now / 1000, reveal, isReduced, dt);
      }
    });
    let earthX = 0, earthZ = 0;
    for (let i = 0; i < view.weights.length; i++) {
      earthX -= Math.sin(cameraRig.yaw[i]) * view.weights[i];
      earthZ -= Math.cos(cameraRig.yaw[i]) * view.weights[i];
    }
    earthX *= layout;
    earthZ = -1 + (earthZ + 1) * layout;
    const earthLength = Math.hypot(earthX, earthZ) || 1;
    environment.update(now / 1000, { direction: [earthX / earthLength, earthZ / earthLength],
      focus: [view.target[0] * layout, view.target[2] * layout], satelliteVisible: !(window.innerWidth < 768 && selected !== null), reducedMotion: isReduced, anatomy: anatomyMix });
    renderer.render(scene, camera);
    const rect = canvas.getBoundingClientRect();
    const anchors = models.map(model => {
      const p = model.pivot.position;
      const top = screenPoint(p.x, p.y + MODEL_HEIGHT, p.z, rect);
      const bottom = screenPoint(p.x, p.y, p.z, rect);
      const head = screenPoint(p.x, p.y + 1.818, p.z, rect);
      const chest = screenPoint(p.x, p.y + 1.465, p.z, rect);
      const abdomen = screenPoint(p.x, p.y + 1.1, p.z, rect);
      const scan = screenPoint(p.x, p.y + MODEL_HEIGHT * (1.05 - 1.1 * anatomyMix), p.z, rect);
      return { x: (top.x + bottom.x) / 2, yTop: top.y, yBottom: bottom.y, head, chest, abdomen, scan };
    });
    const turning = selected !== null && Math.abs(angleDifference(angle, targetIndex * SECTOR)) > 0.001;
    onFrame(anchors, { focused: selected, transitioning: Boolean(layoutMove || turning || dragging), mobile: width / height < 0.9,
      anatomyProgress: anatomyIndex === selected ? anatomyMix : 0, scanning: Boolean(anatomyMove && now >= anatomyMove.start && anatomyIndex === selected) });
    if (!paused) frameId = requestAnimationFrame(render);
  }

  function onPointer(event) {
    if (event.pointerType === 'touch' || dragging) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
    pointer.y = clamp((0.5 - (event.clientY - rect.top) / rect.height) * 2, -1, 1);
  }
  function resetPointer() { pointer.x = 0; pointer.y = 0; }
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('blur', resetPointer);
  function resume() {
    if (disposed || !paused) return;
    paused = false;
    frameTime = 0;
    frameId = requestAnimationFrame(render);
  }
  function pause() { paused = true; cancelAnimationFrame(frameId); }
  function dispose() {
    if (disposed) return;
    pause();
    disposed = true;
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('blur', resetPointer);
    models.forEach(model => model.anatomy?.dispose());
    environment?.dispose();
    const geometries = new Set(), materials = new Set(), textures = new Set();
    scene.traverse(node => {
      if (!node.isMesh) return;
      if (node.geometry) geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach(item => item.dispose());
    textures.forEach(item => item.dispose());
    materials.forEach(item => item.dispose());
    draco.dispose();
    renderer.dispose();
  }
  dimensions();
  resume();
  return { focus, overview, setRecording, setRecordView, beginDrag, dragTo, endDrag, scrubBy, setAnatomy, focusAnatomyRegion, focusHeartDetail, pause, resume, dispose };
}
