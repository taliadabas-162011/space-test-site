const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(manifest.start_url, '/space-test-site/');
assert.equal(manifest.scope, '/space-test-site/');
assert.equal(manifest.display, 'standalone');
for (const size of [192,512]) {
 const icon = manifest.icons.find(item => item.sizes === `${size}x${size}`);
 assert(icon);
 const bytes = fs.readFileSync(path.join(root, icon.src.replace('/space-test-site/', '')));
 assert.equal(bytes.readUInt32BE(16), size);
 assert.equal(bytes.readUInt32BE(20), size);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/rel="manifest"/);
assert.match(html,/apple-touch-icon/);
const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const asset of ['manifest.webmanifest','design/assets/app/icon-192.png','design/assets/app/icon-512.png','design/assets/app/apple-touch-icon.png']) assert(worker.includes(asset));
console.log('Install manifest, app icons, and offline asset list are valid.');
