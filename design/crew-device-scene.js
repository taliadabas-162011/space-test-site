const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const SENSORS = {
  pulse: { label: 'Heart rate', icon: '<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 2h6v4M9 18v4h6v-4M9 12h2l1-2 2 4 1-2h1"/>' },
  oxygen: { label: 'Oxygen', icon: '<rect x="5" y="3" width="14" height="18" rx="5"/><path d="M5 14h14M9 7h6M9 10h4M10 17h4"/>' },
  pressure: { label: 'Blood pressure', icon: '<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 21h8M12 18v3M7 9h3l1-2 2 6 1-3h3"/>' },
  glucose: { label: 'Blood glucose', icon: '<rect x="7" y="6" width="10" height="15" rx="3"/><path d="M10 2h4v4M10 10h4M10 13h4M12 17h.01"/>' },
};

/** Screen-space controls over the existing astronaut stage. */
export function renderDeviceScene({ devices = [], supported = true } = {}) {
  const byField = new Map(devices.map(device => [device.field, device]));
  const nodes = Object.entries(SENSORS).map(([field, sensor], index) => {
    const device = byField.get(field) || {};
    const name = device.name || sensor.label;
    const connected = device.connected === true;
    const reading = device.reading == null || device.reading === '' ? 'No reading yet' : device.reading;
    return `<div class="device-scene__node device-scene__node--${field}${connected ? ' is-connected' : ''}">
      <div class="device-scene__index">0${index + 1} <span aria-hidden="true">/</span> SENSOR</div>
      <div class="device-scene__identity"><svg class="device-scene__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${sensor.icon}</svg><div><h3>${sensor.label}</h3><span class="device-scene__name">${escapeHtml(name)}</span></div></div>
      <div class="device-scene__status" data-device-status="${field}"><span aria-hidden="true"></span>${connected ? 'Connected' : 'Not connected'}</div>
      <div class="device-scene__reading" data-device-reading="${field}">${escapeHtml(reading)}</div>
      <button type="button" data-device-connect="${field}" aria-label="${connected ? 'Disconnect' : 'Connect'} ${escapeHtml(name)}">${connected ? 'Disconnect' : 'Connect'} <span aria-hidden="true">${connected ? '−' : '+'}</span></button>
    </div>`;
  }).join('');
  const paths = [
    ['pulse', 'M 280 300 C 340 300 365 350 452 350'],
    ['oxygen', 'M 720 300 C 660 300 635 350 548 350'],
    ['pressure', 'M 280 710 C 350 710 378 610 452 610'],
    ['glucose', 'M 720 710 C 650 710 622 610 548 610'],
  ].map(([field, path]) => `<path class="${byField.get(field)?.connected === true ? 'is-connected' : ''}" d="${path}"/>`).join('');
  return `<section class="device-scene" aria-labelledby="device-scene-title">
    <header class="device-scene__heading"><h2 id="device-scene-title">Devices</h2><p>Connect a compatible Bluetooth sensor.</p></header>
    <svg class="device-scene__links" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>
    ${nodes}
    <footer class="device-scene__footer"><span>${supported ? 'Choose a compatible Bluetooth device to pair.' : 'Bluetooth is unavailable in this browser.'}</span><span data-device-message role="status" aria-live="polite"></span></footer>
  </section>`;
}
