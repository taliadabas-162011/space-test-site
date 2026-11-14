// Cache only the application shell and bundled assets, never observation data.
const CACHE = 'crew-health-static-v67';
const ROOT = '/space-test-site/';
const FILES = [
  "",
  "index.html",
  "manifest.webmanifest",
  "design/assets/app/icon-192.png",
  "design/assets/app/icon-512.png",
  "design/assets/app/apple-touch-icon.png",
  "rules.js",
  "design/assets/anatomy/Plastic015A_1K-JPG_NormalGL.jpg",
  "design/assets/anatomy/brain.glb",
  "design/assets/anatomy/heart.glb",
  "design/assets/anatomy/VH_F_Kidney_R.glb",
  "design/assets/anatomy/VH_M_Kidney_R.glb",
  "design/assets/anatomy/VH_F_Pancreas.glb",
  "design/assets/anatomy/VH_M_Pancreas.glb",
  "design/assets/anatomy/skinF.glb",
  "design/assets/anatomy/skinMB2.glb",
  "design/assets/camera-paths.raw",
  "design/assets/draco/draco_decoder.wasm",
  "design/assets/draco/draco_wasm_wrapper.js",
  "design/assets/environment/gateway-core.glb",
  "design/assets/guides/nasa-heart-monitor.jpg",
  "design/assets/guides/nasa-blood-pressure.jpg",
  "design/assets/guides/nasa-blood-sampling.jpg",
  "design/assets/guides/nasa-exercise.jpg",
  "design/assets/guides/nasa-drink.jpg",
  "design/assets/guides/nasa-sleep.jpg",
  "design/assets/guides/nasa-cpr-training.jpg",
  "design/assets/guides/nasa-splint-training.jpg",
  "design/assets/environment/GSG_PRO_STUDIOS_METAL_001_sm-gainmap.webp",
  "design/assets/environment/GSG_PRO_STUDIOS_METAL_001_sm.json",
  "design/assets/environment/GSG_PRO_STUDIOS_METAL_001_sm.webp",
  "design/assets/environment/fonts/Magnetik-Regular.woff2",
  "design/assets/environment/fonts/Magnetik-SemiBold.woff2",
  "design/assets/environment/textures/america-north-2k.webp",
  "design/assets/environment/textures/america-south.webp",
  "design/assets/environment/textures/clouds.webp",
  "design/assets/environment/textures/noise.png",
  "design/astronaut-motion-refinement.js",
  "design/astronaut-preview/assets/grab3d.glb",
  "design/astronaut-preview/assets/nasa-iss.glb",
  "design/crew-anatomy-ui.css",
  "design/crew-anatomy-ui.js",
  "design/crew-anatomy.js",
  "design/crew-assessment.js",
  "design/crew-reading-feedback.js",
  "design/crew-datetime.js",
  "design/crew-popover.js",
  "design/crew-demo.js",
  "design/crew-insights.js",
  "design/crew-device.js",
  "design/crew-environment.js",
  "design/crew-guidance.js",
  "design/crew-voice-input.js",
  "design/crew-health.js",
  "design/crew-motion-stage.js",
  "design/crew-scene-orbit.js",
  "design/crew-scene-director.js",
  "design/crew-observation-ui.css",
  "design/crew-observation-ui.js",
  "design/crew-orbit.css",
  "design/crew-orbit.js",
  "design/crew-orbital-motion.js",
  "design/crew-mission-ui.js",
  "design/crew-mission.css",
  "design/crew-liquid-ui.js",
  "design/crew-care.js",
  "design/assets/guides/oxygen-sequence-v2.png",
  "design/assets/guides/pressure-sequence-v2.png",
  "design/assets/guides/temperature-sequence-v3.png",
  "design/assets/guides/glucose-sequence-v2.png",
  "design/assets/guides/glucose-lancing-v4.png",

  "design/crew-collection.js",
  "design/crew-repeat.js",
  "design/crew-measurement-guides.js",
  "design/crew-assistance.js",
  "design/crew-vital-aid.js",
  "design/crew-workflow.css",
  "design/crew-urgent.css",
  "design/crew-care.css",
  "design/crew-liquid-base.css",
  "design/crew-liquid.css",
  "design/crew-liquid-interactions.css",
  "design/crew-liquid-controls.js",
  "design/vendor/glass.js",
  "design/crew-history-scene.js",
  "design/crew-history-scene.css",
  "design/crew-device-scene.js",
  "design/crew-device-scene.css",
  "design/assets/audio/crew-alert.wav",
  "design/crew-alarm.js",
  "design/crew-reference-ui.css",
  "design/crew-scene-workspace.css",
  "design/crew-select.css",
  "design/crew-select.js",
  "design/crew-timeline-ui.css",
  "design/crew-timeline-ui.js",
  "design/crew-workspace.css",
  "design/scars-camera-paths.js",
  "design/scars-motion-tracks.json",
  "design/scars-motion.js",
  "design/vendor/three/examples/jsm/loaders/DRACOLoader.js",
  "design/vendor/three/examples/jsm/loaders/GLTFLoader.js",
  "design/vendor/three/examples/jsm/utils/BufferGeometryUtils.js",
  "design/vendor/three/three.core.min.js",
  "design/vendor/three/three.module.min.js",
  "images/cardioTra.jpg",
  "images/gutTra.jpg",
  "images/hotspot_vfx.png"
];
const paths = new Set(FILES.map(file => new URL(file, self.location.origin + ROOT).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => ROOT + file))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('crew-health-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !paths.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) { try { await cache.put(url.pathname, response.clone()); } catch (_) {} }
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      throw error;
    }
  })());
});
