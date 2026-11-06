const MEASURES = {
  pulse: ['Heart rate', 'bpm'],
  pressure: ['Blood pressure', 'mmHg'],
  oxygen: ['Oxygen saturation', '%'],
  glucose: ['Blood glucose', 'mg/dL'],
  weight: ['Body mass', 'kg'],
  temperature: ['Temperature', '°C'],
  sleep: ['Sleep', 'hrs'],
  water: ['Water intake', 'L'],
  exercise: ['Exercise', 'min'],
};
const CONTEXT = { rest: 'At rest', 'after-activity': 'After activity', fasting: 'Fasting', 'after-meal': 'After a meal', other: 'Other context' };
const WITH_CONTEXT = new Set(['pulse', 'pressure', 'oxygen', 'glucose', 'temperature']);
const PROGRESSION = { improving: 'Improving', unchanged: 'Unchanged', worsening: 'Worsening' };
const STATUS = { none: 'No symptoms reported', concerning: 'Symptoms reported', urgent: 'Urgent symptoms reported' };
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function timestamp(value) {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
}
function displayTime(time) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(time));
}
function number(value) {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function measureValue(key, value) {
  if (key !== 'pressure') {
    const parsed = number(value);
    return parsed == null ? null : String(parsed);
  }
  const systolic = number(value?.systolic), diastolic = number(value?.diastolic);
  return systolic == null || diastolic == null ? null : `${systolic}/${diastolic}`;
}

/** Render recorded observations only; display samples nowhere in this panel. */
export function renderHealthTimeline(summary, histories = {}, symptomHistory = [], symptomLabels = {}) {
  const groups = new Map();
  let sequence = 0;
  function add(entry, item) {
    const observed = timestamp(entry?.time);
    if (observed == null || entry.recorded === false) return;
    const saved = timestamp(entry.recordedAt);
    // Legacy entries without recordedAt cannot be proved to belong to a single save.
    const key = saved == null ? `legacy:${sequence++}` : `${observed}:${saved}`;
    if (!groups.has(key)) groups.set(key, { observed, saved, order: sequence++, reports: [], readings: [] });
    groups.get(key)[item.type === 'symptom' ? 'reports' : 'readings'].push(item);
  }
  for (const [key, [label, unit]] of Object.entries(MEASURES)) {
    if (!Array.isArray(histories?.[key])) continue;
    for (const entry of histories[key]) {
      const value = measureValue(key, entry?.value);
      if (value == null) continue;
      const context = Object.hasOwn(CONTEXT, entry.context) ? CONTEXT[entry.context] : (WITH_CONTEXT.has(key) ? 'Context not recorded' : '');
      const source = typeof entry.source === 'string' && entry.source.trim() ? entry.source.trim() : '';
      add(entry, { type: 'reading', key, label, value, unit, context: [context, source].filter(Boolean).join(' · ') });
    }
  }
  for (const report of Array.isArray(symptomHistory) ? symptomHistory : []) {
    if (!Object.hasOwn(STATUS, report?.value)) continue;
    const tags = Array.isArray(report.tags) ? report.tags.filter(tag => typeof tag === 'string' && Object.hasOwn(symptomLabels, tag)).map(tag => symptomLabels[tag]) : [];
    add(report, { type: 'symptom', status: report.value, tags, note: typeof report.note === 'string' ? report.note : '', onset: timestamp(report.onset), progression: Object.hasOwn(PROGRESSION, report.progression) ? PROGRESSION[report.progression] : '' });
  }
  const ordered = [...groups.values()].sort((a, b) => b.observed - a.observed || (b.saved || 0) - (a.saved || 0) || b.order - a.order);
  const items = ordered.map(group => {
    const reports = group.reports.map(report => {
      const context = [report.onset == null ? '' : `Began ${displayTime(report.onset)}`, report.progression].filter(Boolean).join(' · ');
      return `<div class="timeline-report" data-status="${report.status}"><h3>${STATUS[report.status]}</h3>${report.tags.length ? `<p>${report.tags.map(escapeHtml).join(' · ')}</p>` : ''}${context ? `<p class="timeline-context">${escapeHtml(context)}</p>` : ''}${report.note ? `<p class="timeline-note">${escapeHtml(report.note)}</p>` : ''}${report.status === 'urgent' ? '<button type="button" class="timeline-urgent-action" data-emergency>Emergency guidance <span aria-hidden="true">↗</span></button>' : ''}</div>`;
    }).join('');
    const readings = group.readings.length ? `<dl class="timeline-readings">${group.readings.map(reading => `<div><dt><span>${reading.label}</span>${reading.key === 'weight' ? '<button type="button" class="timeline-repeat" data-timeline-weight aria-label="Record body mass">Record ↗</button>' : `<button type="button" class="timeline-repeat" data-timeline-measure="${reading.key}" aria-label="Record a new ${reading.label}">Record <span aria-hidden="true">↗</span></button>`}</dt><dd><strong>${escapeHtml(reading.value)}</strong> <span>${reading.unit}</span></dd>${reading.context ? `<dd class="timeline-context">${escapeHtml(reading.context)}</dd>` : ''}</div>`).join('')}</dl>` : '';
    const saved = group.saved != null && Math.abs(group.saved - group.observed) >= 60000 ? `<span class="timeline-saved">Saved ${escapeHtml(displayTime(group.saved))}</span>` : '';
    return `<li class="timeline-entry"><header><time datetime="${escapeHtml(new Date(group.observed).toISOString())}">${escapeHtml(displayTime(group.observed))}</time>${saved}</header>${reports}${readings}</li>`;
  }).join('');
  const person = escapeHtml(summary?.person?.name || 'Crew member');
  return `<section class="crew-timeline" aria-labelledby="timeline-title"><header class="timeline-heading"><div><p>HEALTH RECORD</p><h2 id="timeline-title" tabindex="-1">Observation history</h2><span>${person} · saved on this device</span></div><button type="button" data-timeline-close aria-label="Close observation history">Close <span aria-hidden="true">×</span></button></header>
    <button type="button" class="timeline-record" data-timeline-record>New check-in <span aria-hidden="true">↗</span></button>
    ${items ? `<ol class="timeline-list" aria-label="Recorded observations, newest first">${items}</ol>` : '<p class="timeline-empty">No observations have been recorded yet.</p>'}</section>`;
}
