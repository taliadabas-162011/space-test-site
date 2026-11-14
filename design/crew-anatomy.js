import { Scene, Vector3, Box3, TextureLoader, MeshPhysicalMaterial, Vector2, RepeatWrapping, Plane }
  from '/space-test-site/design/vendor/three/three.module.min.js';

// The body and organs are the original Vibrant Wellness assets. Their mesh
// coordinates share one authored space, so they must be normalized together.
const BODY = { female: '/space-test-site/design/assets/anatomy/skinF.glb', male: '/space-test-site/design/assets/anatomy/skinMB2.glb' };
const BODY_HEIGHT = 1.9;

function bodyBounds(scene) {
  scene.updateMatrixWorld(true);
  let bounds;
  scene.traverse(node => {
    if (!node.isMesh || !node.geometry?.attributes?.position) return;
    node.geometry.computeBoundingBox();
    const part = node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld);
    bounds ? bounds.union(part) : bounds = part;
  });
  if (!bounds) throw new Error('The anatomy body has no visible geometry.');
  return bounds;
}

/**
 * Creates a static reference body and its correctly registered brain/heart
 * inside an astronaut's existing scene. The parent origin is at the feet.
 * `model` is `female` or `male`; the caller owns animation and scene lighting.
 */
export async function createCrewAnatomy({ loader, parent, model }) {
  if (!loader?.loadAsync || !parent?.add || !BODY[model]) throw new TypeError('A loader, parent, and female or male model are required.');
  const [body, heart, brain, kidney, pancreas, normalMap] = await Promise.all([
    loader.loadAsync(BODY[model]), loader.loadAsync('/space-test-site/design/assets/anatomy/heart.glb'),
    loader.loadAsync('/space-test-site/design/assets/anatomy/brain.glb'),
    loader.loadAsync(`/space-test-site/design/assets/anatomy/VH_${model === 'female' ? 'F' : 'M'}_Kidney_R.glb`),
    loader.loadAsync(`/space-test-site/design/assets/anatomy/VH_${model === 'female' ? 'F' : 'M'}_Pancreas.glb`), new TextureLoader().loadAsync('/space-test-site/design/assets/anatomy/Plastic015A_1K-JPG_NormalGL.jpg'),
  ]);
  normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
  normalMap.repeat.set(2, 2);

  const bounds = bodyBounds(body.scene);
  const size = bounds.getSize(new Vector3()), center = bounds.getCenter(new Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('The anatomy body has invalid dimensions.');
  const scale = BODY_HEIGHT / size.y;
  const root = new Scene();
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  root.add(body.scene, heart.scene, brain.scene);
  // Reference organs come from a different coordinate system. Fit each as an
  // educational illustration inside the existing body's normalized bounds.
  function placeOrgan(organ, name, fraction, x, y) {
    organ.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(organ.scene), dimensions = box.getSize(new Vector3()), middle = box.getCenter(new Vector3());
    const factor = size.y * fraction / Math.max(dimensions.x, dimensions.y, dimensions.z);
    const group = new Scene(); group.name = name;
    organ.scene.position.sub(middle); group.add(organ.scene); group.scale.setScalar(factor);
    group.position.set(center.x + size.y*x, bounds.min.y + size.y*y, center.z);
    root.add(group); return group;
  }
  const kidneyGroup = placeOrgan(kidney, 'kidney', .15, -.11, .57);
  const pancreasGroup = placeOrgan(pancreas, 'pancreas', .18, .02, .58);

  // The reference uses MeshPhysicalMaterial with transmission, clearcoat,
  // iridescence and a repeating normal texture. A cool emissive Fresnel rim
  // keeps those glass-like contours visible against the dark orbital scene.
  const skin = new MeshPhysicalMaterial({
    color: 0xb8def0, emissive: 0x1a5374, emissiveIntensity: 0.45,
    roughness: 0.186, metalness: 0.033, transmission: 0.55, thickness: 0.55,
    ior: 1.8, clearcoat: 1, clearcoatRoughness: 0.06,
    iridescence: 0.55, iridescenceIOR: 1.453, sheen: 0.326, sheenRoughness: 1,
    normalMap, normalScale: new Vector2(3, 3),
    transparent: true, opacity: 0, depthWrite: false,
  });
  const breathTime = { value: 0 };
  skin.onBeforeCompile = shader => {
    shader.uniforms.uBreathTime = breathTime;
    shader.vertexShader = 'varying vec3 vTwinNormal; varying vec3 vTwinView;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float chest = smoothstep(2.3, 3.0, position.y) * (1.0 - smoothstep(3.9, 4.25, position.y));
      float breathing = sin(uBreathTime * 0.8) * 0.012 * chest;
      transformed.x *= 1.0 + breathing;
      transformed.z *= 1.0 + breathing * 1.4;
      vTwinNormal = normalize(normalMatrix * normal);
      vTwinView = normalize(-(modelViewMatrix * vec4(transformed, 1.0)).xyz);`);
    shader.vertexShader = 'uniform float uBreathTime;\n' + shader.vertexShader;
    shader.fragmentShader = 'varying vec3 vTwinNormal; varying vec3 vTwinView;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float twinRim = pow(1.0 - abs(dot(normalize(vTwinNormal), normalize(vTwinView))), 2.0);
      gl_FragColor.rgb += vec3(0.10, 0.32, 0.48) * twinRim;
      gl_FragColor.a = min(1.0, gl_FragColor.a * (0.85 + twinRim * 0.5));`);
  };
  skin.customProgramCacheKey = () => 'crew-anatomy-reference-glass-v1';

  const heartMaterial = new MeshPhysicalMaterial({
    color: 0xe88986, emissive: 0x842f3a, emissiveIntensity: 0.45,
    roughness: 0.26, metalness: 0.035, clearcoat: 0.65,
    transparent: true, opacity: 0, depthWrite: false,
  });
  const brainMaterial = new MeshPhysicalMaterial({
    color: 0xabc8fa, emissive: 0x4969a7, emissiveIntensity: 0.65,
    roughness: 0.34, metalness: 0.04, clearcoat: 0.35,
    transparent: true, opacity: 0, depthWrite: false,
  });
  const kidneyMaterial = new MeshPhysicalMaterial({ color:0xc96478, emissive:0x70283a, emissiveIntensity:.5, roughness:.36, transparent:true, opacity:0, depthWrite:false });
  const pancreasMaterial = new MeshPhysicalMaterial({ color:0xefc38f, emissive:0x78512a, emissiveIntensity:.45, roughness:.4, transparent:true, opacity:0, depthWrite:false });
  const revealPlane = new Plane(new Vector3(0, 1, 0), -BODY_HEIGHT * 1.1);
  for (const material of [skin, heartMaterial, brainMaterial, kidneyMaterial, pancreasMaterial]) material.clippingPlanes = [revealPlane];
  const geometries = new Set(), discardedMaterials = new Set();
  function replace(scene, material, order) {
    scene.traverse(node => {
      if (!node.isMesh) return;
      geometries.add(node.geometry);
      for (const old of Array.isArray(node.material) ? node.material : [node.material]) if (old) discardedMaterials.add(old);
      node.material = material;
      node.renderOrder = order;
    });
  }
  replace(body.scene, skin, 2);
  replace(heart.scene, heartMaterial, 1);
  replace(brain.scene, brainMaterial, 1);
  replace(kidney.scene, kidneyMaterial, 1);
  replace(pancreas.scene, pancreasMaterial, 1);
  discardedMaterials.forEach(material => material.dispose());
  parent.add(root);
  const heartNode = heart.scene.getObjectByName('heart');
  const heartScale = heartNode?.scale.clone();
  let opacity = 0;
  let focus = 'overview';
  let heartVisibility = 0;
  let skinVisibility = 1;
  let heartDetail = false;
  root.visible = false;
  return {
    root,
    setOpacity(value) {
      opacity = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
      root.visible = opacity > 0.001;
      skin.opacity = 0.66 * opacity * skinVisibility;
      heartMaterial.opacity = 0.94 * opacity * heartVisibility;
      brainMaterial.opacity = 0; kidneyMaterial.opacity = 0; pancreasMaterial.opacity = 0;
    },
    setReveal(progress, ground) {
      const amount = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
      revealPlane.constant = -(ground + BODY_HEIGHT * (1.05 - 1.1 * amount));
    },
    setFocus(category) {
      focus = ['circulation','recovery','kidney','pancreas'].includes(category) ? category : 'overview';
      if (focus !== 'circulation') heartDetail = false;
    },
    setHeartDetail(enabled) { heartDetail = Boolean(enabled) && focus === 'circulation'; },
    update(seconds, reveal = 1, reducedMotion = false, delta = 0) {
      const time = Number.isFinite(seconds) ? seconds : 0;
      // The organ animation is decorative, not derived from a measurement.
      breathTime.value = time;
      const target = focus === 'circulation' ? 1 : 0;
      const blend = reducedMotion ? 1 : 1 - Math.exp(-5 * Math.max(0, delta));
      heartVisibility += (target - heartVisibility) * blend;
      skinVisibility += ((heartDetail ? 0 : 1) - skinVisibility) * blend;
      skin.opacity = 0.66 * opacity * (focus === 'overview' ? 1 : 0);
      heartMaterial.opacity = 0.94 * opacity * heartVisibility;
      brainMaterial.opacity = focus === 'recovery' ? .95 * opacity : 0;
      kidneyMaterial.opacity = focus === 'kidney' ? .95 * opacity : 0;
      pancreasMaterial.opacity = focus === 'pancreas' ? .95 * opacity : 0;
      heart.scene.visible = heartMaterial.opacity > 0.001;
      brain.scene.visible = brainMaterial.opacity > .001;
      kidneyGroup.visible = kidneyMaterial.opacity > .001; pancreasGroup.visible = pancreasMaterial.opacity > .001;
      const pulse = reducedMotion ? 0 : (0.5 + 0.5 * Math.sin(time * 2.6));
      heartMaterial.emissiveIntensity = 0.38 + pulse * 0.16;
      if (heartNode && heartScale) heartNode.scale.copy(heartScale).multiplyScalar(1 + pulse * 0.018);
    },
    dispose() {
      root.removeFromParent();
      geometries.forEach(geometry => geometry.dispose());
      skin.dispose(); heartMaterial.dispose(); brainMaterial.dispose(); kidneyMaterial.dispose(); pancreasMaterial.dispose(); normalMap.dispose();
    },
  };
}
