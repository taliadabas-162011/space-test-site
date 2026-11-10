import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const base = process.argv[2] || path.resolve(import.meta.dirname, '../design');
const { createCrewAlarm } = await import(pathToFileURL(path.join(base, 'crew-alarm.js')));
const voices = [];
class Media {
  constructor(src) { this.src = src; this.currentTime = 0; this.pauseCount = 0; this.playCount = 0; voices.push(this); }
  play() { this.playCount++; return Promise.resolve(); }
  pause() { this.pauseCount++; this.onpause?.(); }
}
const states = [];
const alarm = createCrewAlarm(Media, { onState: state => states.push(state) });
const first = alarm.start();
assert.equal(voices[0].playCount, 1, 'play must run synchronously within the input gesture');
assert.equal(await first, true);
assert.equal(alarm.state, 'playing');
assert.equal(voices[0].loop, true);
assert.equal(voices[0].volume, .55);
assert.equal(voices[0].src, '/space-test-site/design/assets/audio/crew-alert.wav');
assert.equal(await alarm.start(), true);
assert.equal(voices.length, 1, 'repeated start must not overlap or restart an active alarm');
voices[0].currentTime = 1.2;
alarm.stop(); alarm.stop();
assert.equal(alarm.state, 'idle');
assert.equal(voices[0].currentTime, 0);
assert.deepEqual(states.slice(0,3), ['idle', 'starting', 'playing']);

class DeferredMedia extends Media { play() { this.playCount++; return new Promise((resolve,reject)=> { this.resolve = resolve; this.reject = reject; }); } }
const changes = [];
const deferred = createCrewAlarm(DeferredMedia, { onState: state => changes.push(state) });
const abandoned = deferred.start();
const oldVoice = voices.at(-1);
assert.equal(deferred.start(), abandoned, 'duplicate pending starts should reuse the same request');
deferred.stop();
const replacement = deferred.start();
const newVoice = voices.at(-1);
oldVoice.resolve();
assert.equal(await abandoned, false);
assert.equal(newVoice.pauseCount, 0, 'an old request must not stop the new voice');
newVoice.resolve();
assert.equal(await replacement, true);
assert.equal(deferred.state, 'playing');
deferred.stop();
assert.equal(deferred.state, 'idle');

class DeniedMedia extends Media { play() { return Promise.reject(Object.assign(new Error('denied'), { name:'NotAllowedError' })); } }
const denied = createCrewAlarm(DeniedMedia);
assert.equal(await denied.start(), false);
assert.equal(denied.state, 'blocked');
assert.equal(await denied.start(), false, 'a blocked playback can be retried from another gesture');
denied.stop();
assert.equal(denied.state, 'idle');

const interrupted = createCrewAlarm(Media);
await interrupted.start();
voices.at(-1).onpause();
assert.equal(interrupted.state, 'blocked');
assert.equal(await interrupted.start(), true);
voices.at(-1).onerror();
assert.equal(interrupted.state, 'error');
interrupted.stop();
const unavailable = createCrewAlarm(null);
assert.equal(await unavailable.start(), false);
assert.equal(unavailable.state, 'unavailable');
class BrokenMedia { constructor() { throw new Error('unavailable'); } }
assert.equal(await createCrewAlarm(BrokenMedia).start(), false);

const wav = await readFile(path.join(base, 'assets/audio/crew-alert.wav'));
assert.equal(wav.toString('ascii',0,4),'RIFF');
assert.equal(wav.toString('ascii',8,12),'WAVE');
assert.equal(wav.readUInt16LE(22),1);
assert.equal(wav.readUInt32LE(24),44100);
assert.equal(wav.readUInt32LE(40)/2/44100,3.2);
let peak = 0;
for (let offset=44; offset<wav.length; offset+=2) peak=Math.max(peak,Math.abs(wav.readInt16LE(offset)));
assert(peak > 19000 && peak < 22000, 'original audio should have a controlled, unclipped peak');
console.log('Local alarm media, immediate gesture play, loop/mute, cancellation, retries, media failures, and WAV integrity pass.');
