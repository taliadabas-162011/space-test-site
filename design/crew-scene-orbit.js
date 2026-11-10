// Bounded camera exploration, independent of the legacy crew-selection tracks.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function createSceneOrbit() {
  const target = { yaw: 0, pitch: 0, zoom: 0 };
  const current = { ...target };
  let start = null, previous = null, velocity = 0;
  function rotate(yaw, pitch = 0) {
    target.yaw = clamp(target.yaw + yaw, -1.15, 1.15);
    target.pitch = clamp(target.pitch + pitch, -.22, .22);
  }
  return {
    begin(now) { start = { ...target }; previous = { x: 0, now }; velocity = 0; },
    move(x, y, now) {
      if (!start) return;
      const elapsed = Math.max(8, now - previous.now);
      velocity = (x - previous.x) / elapsed;
      target.yaw = clamp(start.yaw - x * 3.8, -1.15, 1.15);
      target.pitch = clamp(start.pitch + y * .65, -.22, .22);
      previous = { x, now };
    },
    end(now, cancelled = false, reduced = false) {
      if (start && !cancelled && !reduced && now - previous.now < 90) rotate(-clamp(velocity * 140, -.18, .18));
      start = previous = null; velocity = 0;
    },
    rotate,
    zoom(delta) { target.zoom = clamp(target.zoom + delta, -1.3, 1.2); },
    reset() { start = previous = null; Object.assign(target, { yaw: 0, pitch: 0, zoom: 0 }); },
    update(dt, reduced = false) {
      const follow = reduced ? 1 : 1 - Math.exp(-9 * Math.max(0, dt));
      for (const key of Object.keys(current)) current[key] += (target[key] - current[key]) * follow;
      return current;
    },
  };
}


/** Fit the suit to both dimensions of the layout's reserved scene slot. */
export function sceneFitDistance(frame, aspect) {
  if(!frame||![frame.width,frame.height,aspect].every(value=>Number.isFinite(value)&&value>0))return 6.1;
  const fov=2*Math.tan(17*Math.PI/180);
  return Math.max(1.9/(fov*Math.max(.1,frame.height*.94)),.95/(fov*Math.max(.1,frame.width*aspect*.9)));
}
