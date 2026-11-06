// Source material: EnduroSat Space Service, captured locally in
// /clone-workspace/reference-clones/endurosat. The globe's two-hemisphere
// sampling and the star sphere are adapted from that source scene's shaders;
// The planet textures remain third-party reference material; the station model
// is NASA Ames' publicly downloadable International Space Station (A).
//
// World coordinates: the crew stand around (0, 0, 0), facing +Z. The Earth is
// below the stage; the sky encloses the whole stage. This is ordinary
// scene geometry, so any camera path sees genuine perspective/parallax.
// Use the same renderer and Three.js build as the crew. Call update() before
// rendering, and dispose() when the stage is destroyed. A far plane of >= 160
// is needed. The separate satellite load can be disabled for slow devices.
import { Mesh, Group, BufferGeometry, BufferAttribute, ShaderMaterial, TextureLoader, Texture, PointLight }
  from '/space-test-site/design/vendor/three/three.module.min.js';

const ASSET_ROOT = '/space-test-site/design/assets/environment';
const REPEAT = 1000;
const MIRRORED_REPEAT = 1002;
const NEAREST = 1003;
const BACK_SIDE = 1;
const ADDITIVE_BLENDING = 2;

// The captured Three.js build tree-shakes SphereGeometry, so construct the
// same UV sphere as the reference using the build's own BufferGeometry.
function sphereGeometry(radius, widthSegments = 64, heightSegments = 40) {
  const positions = [], normals = [], uvs = [], indices = [], rows = [];
  for (let y = 0; y <= heightSegments; y++) {
    const row = [];
    const v = y / heightSegments;
    const uvOffset = y === 0 ? 0.5 / widthSegments : y === heightSegments ? -0.5 / widthSegments : 0;
    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const phi = u * Math.PI * 2;
      const theta = v * Math.PI;
      const nx = -Math.cos(phi) * Math.sin(theta);
      const ny = Math.cos(theta);
      const nz = Math.sin(phi) * Math.sin(theta);
      positions.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);
      uvs.push(u + uvOffset, 1 - v);
      row.push(positions.length / 3 - 1);
    }
    rows.push(row);
  }
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = rows[y][x + 1], b = rows[y][x];
      const c = rows[y + 1][x], d = rows[y + 1][x + 1];
      if (y !== 0) indices.push(a, b, d);
      if (y !== heightSegments - 1) indices.push(b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  return geometry;
}

// The source generates a 256-square nearest-filtered noise canvas at runtime.
// Seed it here so the sky is stable across reloads and screenshot comparisons.
function makeStarNoise() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the EnduroSat sky noise texture.');
  const pixels = context.createImageData(256, 256);
  let seed = 0x2a53d917;
  for (let i = 0; i < pixels.data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i + channel] = seed >>> 24;
    }
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new Texture(canvas);
  texture.wrapS = texture.wrapT = REPEAT;
  texture.magFilter = texture.minFilter = NEAREST;
  texture.needsUpdate = true;
  return texture;
}

const skyVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Adapted from the captured EnduroSat sky shader: two independently scaled
// noise-based star fields on the inside of a sphere, rather than a flat image.
const skyFragment = `
  precision highp float;
  uniform sampler2D uStarNoise, uSolidNoise;
  uniform float uTime;
  varying vec2 vUv;
  float stars(vec2 uv) {
    vec3 noise = texture2D(uStarNoise, uv / 256.0).rgb - .5;
    float d = length(fract(uv) - .5 + .5 * noise.rg);
    return ((1.0 - smoothstep(0.0, .07, d)) +
      (1.0 - smoothstep(0.0, .3, d)) * .1) * smoothstep(.35, .7, noise.b);
  }
  void main() {
    vec2 uv = vUv * vec2(3.14 * .5, 1.0);
    uv.x += .0006 * uTime;
    float haze = texture2D(uSolidNoise, vUv * 30.0 + uTime * .13).r;
    vec3 color = vec3(.005, .008, .018);
    color += vec3(.72, .81, 1.0) * (stars(uv * 280.0) + stars(uv * 500.0));
    color *= mix(.4, 1.0, smoothstep(.3, .7, haze));
    color += vec3(.003, .007, .018) * (1.0 + haze);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const earthVertex = `
  varying vec2 vUv;
  varying vec3 vViewNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vViewNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
// The reference has separate northern and southern texture sheets. This is the
// same UV mapping and cloud sampling used by its uEarthAlbedo shader branch.
const earthFragment = `
  precision highp float;
  uniform sampler2D uNorth, uSouth, uClouds, uSolidNoise;
  uniform float uTime, uAnatomy;
  varying vec2 vUv;
  varying vec3 vViewNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 normal = normalize(vViewNormal);
    vec3 albedo = mix(texture2D(uSouth, vUv * 2.0).rgb,
      texture2D(uNorth, vUv * 2.0 - vec2(0.0, 1.0)).rgb, step(.5, vUv.y));
    float sea = 1.0 - smoothstep(.2, .8, length(albedo - vec3(0.0, 0.0, .7)));
    albedo *= mix(.8, .2, sea);
    float day = smoothstep(-.3, .5, dot(normal, normalize(vec3(-1.0, 1.0, .5))));
    albedo *= day * 1.3 + .3;
    albedo += max(0.0, smoothstep(.2, .8,
      dot(normal, normalize(vec3(-1.0, 1.0, -.8))))) * vec3(.6, .55, .4);
    vec2 cUv = vUv + vec2(.11 + uTime * .00008, -.058);
    vec3 cNoise = texture2D(uSolidNoise, cUv * 100.0 - uTime * .015).rgb;
    cUv += (cNoise.gb - .5) * .0003;
    float cloudArea = 1.0 - smoothstep(.8, 1.0, vUv.y);
    float cloud = min(1.0, texture2D(uClouds, cUv * 2.0).r * 2.5) * cloudArea;
    float luma = dot(albedo, vec3(.2125, .7154, .0721));
    albedo = mix(vec3(luma), albedo, .5) * vec3(.9, .95, 1.2) + .025;
    albedo = mix(albedo, vec3(.75, .83, .95), cloud * (day + .01) * .78);
    // Keep detail behind foreground information and softly light the limb.
    float limb = pow(1.0 - max(0.0, dot(normalize(vWorldNormal),
      normalize(cameraPosition - vWorldPosition))), 3.0);
    vec3 color = albedo * .52 + vec3(.04, .10, .17) * limb;
    gl_FragColor = vec4(color * mix(1.0, .32, uAnatomy), 1.0);
  }
`;
const atmosphereFragment = `
  precision highp float;
  uniform float uAnatomy;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 eye = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(0.0, dot(normalize(vWorldNormal), eye)), 3.0);
    gl_FragColor = vec4(vec3(.11, .38, .7), rim * .5 * mix(1.0, .4, uAnatomy));
  }
`;

function disposeMeshTree(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

async function loadSatellite(loader) {
  if (!loader) return null;
  const reference = await loader.loadAsync('/space-test-site/design/astronaut-preview/assets/nasa-iss.glb');
  const satellite = reference.scene;
  satellite.position.set(0, 1.5, .4);
  satellite.scale.setScalar(.19);
  satellite.rotation.set(.2, -.25, -.15);
  const shell = new Group();
  shell.position.set(-10, 7.5, -34);
  shell.add(satellite);
  const light = new PointLight(0xbcdcff, 180, 30);
  light.position.set(1, 3, 8);
  shell.add(light);
  return shell;
}

/**
 * Attach a live EnduroSat-derived space environment to an existing scene.
 * @param {Scene} scene Shared astronaut scene.
 * @param {{camera?: PerspectiveCamera, loader?: GLTFLoader, satellite?: boolean,
 *          reducedMotion?: boolean}} options Existing camera/loader, if present.
 * @returns {Promise<{update: (seconds: number) => void, dispose: () => void,
 *                   satelliteLoaded: boolean, warnings: string[]}>}
 */
export async function createCrewEnvironment(scene, options = {}) {
  const { camera, loader, satellite = true, reducedMotion = false } = options;
  if (camera && camera.far < 160) {
    camera.far = 160;
    camera.updateProjectionMatrix();
  }
  const textureLoader = new TextureLoader();
  const load = (name, wrap) => textureLoader.loadAsync(`${ASSET_ROOT}/textures/${name}`).then(texture => {
    texture.wrapS = texture.wrapT = wrap;
    return texture;
  });
  const warnings = [];
  const satPromise = satellite && loader
    ? loadSatellite(loader).catch(error => { warnings.push(`Spacecraft unavailable: ${error.message}`); return null; })
    : Promise.resolve(null);
  const [north, south, clouds, solidNoise, sat] = await Promise.all([
    load('america-north-2k.webp', MIRRORED_REPEAT),
    load('america-south.webp', MIRRORED_REPEAT),
    load('clouds.webp', REPEAT),
    load('noise.png', REPEAT),
    satPromise,
  ]);
  const starNoise = makeStarNoise();
  const skyUniforms = { uStarNoise: { value: starNoise }, uSolidNoise: { value: solidNoise }, uTime: { value: 0 } };
  const earthUniforms = { uNorth: { value: north }, uSouth: { value: south },
    uClouds: { value: clouds }, uSolidNoise: { value: solidNoise }, uTime: { value: 0 }, uAnatomy: { value: 0 } };

  const sky = new Mesh(sphereGeometry(84, 48, 30), new ShaderMaterial({
    uniforms: skyUniforms, vertexShader: skyVertex, fragmentShader: skyFragment,
    side: BACK_SIDE, depthWrite: false,
  }));
  sky.name = 'EnduroSat star field';
  sky.renderOrder = -1000;

  const planet = new Group();
  planet.name = 'EnduroSat Earth horizon';
  planet.position.set(0, -33, -59);
  planet.rotation.set(.1, -.42, -.11);
  const earth = new Mesh(sphereGeometry(33, 72, 48), new ShaderMaterial({
    uniforms: earthUniforms, vertexShader: earthVertex, fragmentShader: earthFragment,
  }));
  planet.add(earth);
  const atmosphere = new Mesh(sphereGeometry(33.45, 72, 48), new ShaderMaterial({
    uniforms: { uAnatomy: earthUniforms.uAnatomy }, vertexShader: earthVertex, fragmentShader: atmosphereFragment,
    transparent: true, depthWrite: false, blending: ADDITIVE_BLENDING,
  }));
  planet.add(atmosphere);
  const root = new Group();
  root.name = 'Crew environment';
  root.add(sky, planet);
  if (sat) root.add(sat);
  scene.add(root);
  let disposed = false;
  return {
    satelliteLoaded: Boolean(sat),
    warnings,
    update(seconds, composition) {
      if (disposed || !Number.isFinite(seconds)) return;
      const time = (composition?.reducedMotion ?? reducedMotion) ? 0 : Math.max(0, seconds);
      skyUniforms.uTime.value = time * .35;
      earthUniforms.uTime.value = time;
      earthUniforms.uAnatomy.value = Math.max(0, Math.min(1, composition?.anatomy || 0));
      if (composition?.direction && composition?.focus) {
        planet.position.x = composition.focus[0] + composition.direction[0] * 59;
        planet.position.z = composition.focus[1] + composition.direction[1] * 59;
      }
      planet.rotation.y = -.42 + time * .00045;
      if (sat) {
        sat.visible = composition?.satelliteVisible !== false;
        sat.position.y = 7.5 + Math.sin(time * .08) * .14;
        sat.rotation.y = Math.sin(time * .04) * .025;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(root);
      disposeMeshTree(root);
      for (const texture of [north, south, clouds, solidNoise, starNoise]) texture.dispose();
    },
  };
}
