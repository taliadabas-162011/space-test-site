const CONTEXT_REQUIRED = new Set(['pulse', 'pressure', 'oxygen', 'glucose', 'temperature']);
const WINDOW_MS = 30 * 86400000;
const localDay = time => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const number = value => value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim()) ? NaN : Number(value);
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = value => Math.round(value * 10) / 10;

// Exploratory arithmetic only; there are no clinical thresholds in this comparison.
export function compareHistory(field, history, now = Date.now()) {
  if (!Array.isArray(history) || !Number.isFinite(now)) return null;
  const pair = field === 'pressure';
  const values = entry => pair ? [number(entry?.value?.systolic), number(entry?.value?.diastolic)] : [number(entry?.value)];
  const entries = history.filter(entry => entry?.recorded !== false && Number.isFinite(Date.parse(entry?.time)) && Date.parse(entry.time) <= now && values(entry).every(Number.isFinite))
    .slice().sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const latest = entries.at(-1);
  if (!latest || (CONTEXT_REQUIRED.has(field) && !latest.context)) return null;
  const latestTime = Date.parse(latest.time), latestDay = localDay(latestTime), byDay = new Map();
  for (const entry of entries) {
    const time = Date.parse(entry.time);
    if (time >= latestTime || latestTime - time > WINDOW_MS || localDay(time) === latestDay) continue;
    if (CONTEXT_REQUIRED.has(field) && entry.context !== latest.context) continue;
    if (field==='temperature' && (entry.site||'')!==(latest.site||'')) continue;
    byDay.set(localDay(time), values(entry));
  }
  const prior = [...byDay.values()];
  if (prior.length < 3) return null;
  const current = values(latest);
  const baseline = current.map((_, index) => round(median(prior.map(item => item[index]))));
  const delta = current.map((value, index) => round(value - baseline[index]));
  return { current, baseline, delta, days: prior.length, context: latest.context || '', time: latest.time, source: latest.source || '' };
}
