import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../design/crew-timeline-ui.js', import.meta.url), 'utf8');
const { renderHealthTimeline } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const time = '2026-11-09T10:00:00.000Z';
const entry = { time, recordedAt: time };
const html = renderHealthTimeline(
  { person: { name: 'Test astronaut' } },
  { pulse: [{ ...entry, value: 72 }] }, [], {},
  { mood: [{ ...entry, value: 'low' }], sleepQuality: [{ ...entry, value: 'poor' }] },
);
assert.match(html, /data-history-metric="mood"[\s\S]*?Low/);
assert.match(html, /data-history-metric="sleepQuality"[\s\S]*?Poor/);
assert.equal((html.match(/class="timeline-entry"/g) || []).length, 1);
assert.doesNotMatch(renderHealthTimeline({}, {}, [], {}, { mood: [{ ...entry, value: '<script>' }] }), /<script>/);
console.log('History groups and safely renders self-reports with measurements.');
