const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const events = {};
const calls = [];
const cache = {
  async addAll(urls) { calls.push(['addAll', urls]); },
  async match(request, options) { calls.push(['match', request.url, options]); return { cached: true }; },
  async put(key) { calls.push(['put', key]); },
};
const caches = {
  async open() { return cache; },
  async keys() { return ['crew-health-static-old', 'another-app']; },
  async delete(key) { calls.push(['delete', key]); },
};
const self = { location: { origin: 'https://example.test' }, addEventListener(name, fn) { events[name] = fn; }, async skipWaiting() {}, clients: { async claim() {} } };
let network = async () => { throw new Error('offline'); };
vm.runInNewContext(fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'service-worker.js'), 'utf8'), { self, caches, URL, fetch: (...args) => network(...args) });
(async () => {
  let pending;
  events.install({ waitUntil(value) { pending = value; } });
  await pending;
  const assets = calls.find(([name]) => name === 'addAll')[1];
  assert(assets.includes('/space-test-site/'));
  assert(assets.includes('/space-test-site/design/crew-datetime.js'));
  events.activate({ waitUntil(value) { pending = value; } });
  await pending;
  assert(calls.some(([name, key]) => name === 'delete' && key === 'crew-health-static-old'));
  assert(!calls.some(([name, key]) => name === 'delete' && key === 'another-app'));
  const request = { method: 'GET', url: 'https://example.test/space-test-site/design/crew-orbit.js?v=28' };
  events.fetch({ request, respondWith(value) { pending = value; } });
  assert.deepEqual(await pending, { cached: true });
  assert(calls.some(([name,, options]) => name === 'match' && options.ignoreSearch));
  let intercepted = false;
  events.fetch({ request: { method: 'GET', url: 'https://example.test/space-test-site/private-records' }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false);
  network = async () => ({ ok: true, clone() { return {}; } });
  events.fetch({ request, respondWith(value) { pending = value; } });
  await pending;
  assert(calls.some(([name, key]) => name === 'put' && key === '/space-test-site/design/crew-orbit.js'));
  console.log('Offline cache serves bundled files, updates versions, and ignores non-application data.');
})().catch(error => { console.error(error); process.exitCode = 1; });
