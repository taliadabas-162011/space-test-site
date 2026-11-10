// Original local attention sound; not a reproduction of a certified alarm.
const ALARM_SOURCE = '/space-test-site/design/assets/audio/crew-alert.wav';

export function createCrewAlarm(Audio = globalThis.Audio, { onState = () => {} } = {}) {
  let current = null;
  let generation = 0;
  let state = 'idle';
  let pending = null;
  const update = (next, reason = '') => {
    state = next;
    onState(next, reason);
  };
  const release = audio => {
    if (!audio) return;
    audio.onplaying = audio.onwaiting = audio.onpause = audio.onerror = null;
    audio.pause();
    try { audio.currentTime = 0; } catch (_) { /* A failed media resource may not be seekable. */ }
  };

  function stop() {
    generation++;
    release(current);
    current = null;
    pending = null;
    update('idle');
  }

  function start() {
    if (current && (state === 'starting' || state === 'playing')) return pending || Promise.resolve(true);
    stop();
    if (!Audio) { update('unavailable', 'Audio playback is unavailable.'); return Promise.resolve(false); }
    const request = generation;
    let audio;
    try {
      audio = new Audio(ALARM_SOURCE);
      current = audio;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = .55;
      audio.onplaying = () => { if (request === generation) update('playing'); };
      audio.onwaiting = () => { if (request === generation) update('starting', 'Loading alarm sound.'); };
      audio.onpause = () => {
        if (request !== generation || current !== audio) return;
        release(audio);
        current = null;
        pending = null;
        update('blocked', 'Alarm playback paused. Choose Enable sound to resume.');
      };
      audio.onerror = () => {
        if (request !== generation) return;
        release(audio);
        current = null;
        pending = null;
        update('error', 'The alarm sound could not be loaded.');
      };
      update('starting');
      // Invoke play synchronously within the caller's click, before awaiting anything.
      const playback = audio.play();
      pending = Promise.resolve(playback).then(() => {
        if (request !== generation || current !== audio) { release(audio); return false; }
        update('playing');
        pending = null;
        return true;
      }, error => {
        if (request !== generation || current !== audio) return false;
        release(audio);
        current = null;
        pending = null;
        const blocked = error?.name === 'NotAllowedError';
        update(blocked ? 'blocked' : 'error', blocked ? 'Choose Enable sound to allow alarm playback.' : 'The alarm sound could not be played.');
        return false;
      });
      return pending;
    } catch (_) {
      release(audio);
      current = null;
      update('unavailable', 'Audio playback is unavailable.');
      return Promise.resolve(false);
    }
  }
  return { start, stop, get state() { return state; } };
}
