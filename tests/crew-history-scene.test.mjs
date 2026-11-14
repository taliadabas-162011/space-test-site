import test from 'node:test';
import assert from 'node:assert/strict';
import { historySeries, renderHistoryScene, nearestHistoryIndex } from '../design/crew-history-scene.js';
const now = Date.parse('2026-11-09T12:00:00Z');
const entry = (days, value, context = 'rest') => ({ time: new Date(now - days * 86400000).toISOString(), value, context });

test('time range and latest context filter valid values, retaining zero and negatives', () => {
  const histories = { pulse: [entry(121, 4), entry(20, 8, 'after-activity'), entry(10, 0), entry(2, -2), entry(1, 'bad')] };
  const result = historySeries({ histories, now });
  assert.deepEqual(result.points.map(p => p.value), [0, -2]);
  assert.equal(result.context, 'rest');
  assert.deepEqual(historySeries({ histories, now, days: 30 }).points.map(p => p.value), [0, -2]);
});

test('pressure plots both values, labels selected observation, escapes source', () => {
  const histories = { pressure: [{ ...entry(5, { systolic: 120, diastolic: 80 }, ''), source: '<device>' }, entry(1, { systolic: 110, diastolic: 70 }, '')] };
  const html = renderHistoryScene({ histories, field: 'pressure', now, position: 0 });
  assert.match(html, /Systolic \/ diastolic/);
  assert.match(html, /history-scene-line-secondary/);
  assert.match(html, /120\/80 mmHg/);
  assert.match(html, /Context not recorded/);
  assert.match(html, /&lt;device&gt;/);
  assert.doesNotMatch(html, /<device>/);
  assert.match(html, /tabindex="0"/);
});

test('categorical reports show readable labels and an accessible plot', () => {
  const reports = { mood: [entry(3, 'low'), entry(1, 'good')] };
  const html = renderHistoryScene({ reports, field: 'mood', now, position: 0, days: 30 });
  assert.match(html, /<span>Good<\/span>/);
  assert.match(html, /<span>Low<\/span>/);
  assert.match(html, /data-history-chart/);
  assert.doesNotMatch(html, /type="range"/);
  assert.match(html, /Low/);
  assert.match(html, /data-history-scene-days="30" aria-pressed="true"/);
});

test('empty or invalid values never become fabricated zero readings', () => {
  const html = renderHistoryScene({ histories: { pulse: [entry(1, ''), entry(2, null), entry(3, Infinity)] }, now });
  assert.match(html, /No recorded readings in this period/);
  assert.doesNotMatch(html, /data-history-chart/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('body mass is selectable and preserves recorded kilograms', () => {
  const html = renderHistoryScene({ histories: { weight: [entry(2, 72.5)] }, field: 'weight', now });
  assert.doesNotMatch(html, /data-history-scene-field="weight"/);
  assert.match(html, /72\.5 kg/);
});

test('symptoms preserve report details and use one selected keyboard point', () => {
  const reports = { symptoms: [entry(4, 'none'), { ...entry(1, 'concerning'), note: 'Headache <mild>', tags: ['headache'], onset: new Date(now - 2 * 86400000).toISOString(), progression: 'improving' }] };
  const result = historySeries({ reports, field: 'symptoms', now });
  assert.equal(result.points[1].note, 'Headache <mild>');
  assert.deepEqual(result.points[1].tags, ['headache']);
  assert.equal(result.points[1].progression, 'improving');
  assert.ok(Number.isFinite(result.points[1].onset));
  const html = renderHistoryScene({ reports, field: 'symptoms', now, position: 1 });
  assert.match(html, /Symptoms reported/);
  assert.match(html, /headache/);
  assert.match(html, /Headache &lt;mild&gt;/);
  assert.match(html, /Began/);
  assert.match(html, /Improving/);
  assert.equal((html.match(/tabindex="0"/g) || []).length, 1);
  assert.match(html, /data-history-dot="1"/);
});

test('nearest point handles boundaries, ties, duplicates and empty data', () => {
  assert.equal(nearestHistoryIndex([], 2), -1);
  assert.equal(nearestHistoryIndex([10, 30, 30, 90], -5), 0);
  assert.equal(nearestHistoryIndex([10, 30, 30, 90], 20), 0);
  assert.equal(nearestHistoryIndex([10, 30, 30, 90], 30), 1);
  assert.equal(nearestHistoryIndex([10, 30, 30, 90], 100), 3);
  assert.equal(nearestHistoryIndex([10], NaN), -1);
});

test('temperature histories separate oral and other measurement sites',()=>{
 const histories={temperature:[{...entry(3,36.4),site:'ear'},{...entry(2,36.6),site:'oral'},{...entry(1,36.8),site:'oral'}]};
 const series=historySeries({histories,field:'temperature',now});assert.equal(series.site,'oral');assert.deepEqual(series.points.map(p=>p.value),[36.6,36.8]);
 assert.match(renderHistoryScene({histories,field:'temperature',now}),/Oral temperature/);
});

test('heart-rate chart selects a comparable series when latest context has only one point',()=>{
 const now=Date.now(), histories={pulse:[
  {value:70,time:new Date(now-3000).toISOString(),context:'rest',source:'Scenario history'},
  {value:74,time:new Date(now-2000).toISOString(),context:'rest',source:'Scenario history'},
  {value:119,time:new Date(now-1000).toISOString(),context:'other',source:'Personal'}]};
 const result=historySeries({histories,field:'pulse',now});
 assert.equal(result.context,'rest');assert.deepEqual(result.points.map(p=>p.value),[70,74]);
});
