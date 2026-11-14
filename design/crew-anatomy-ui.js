const CATEGORIES = {
  circulation: { title: 'Heart & circulation', nav: 'Heart', metrics: ['pulse', 'pressure', 'oxygen'] },
  recovery: { title: 'Brain & sleep', nav: 'Brain', metrics: ['sleep', 'temperature'] },
  kidney: { title: 'Kidney & water balance', nav: 'Kidney', metrics: ['water'] },
  pancreas: { title: 'Pancreas & blood glucose', nav: 'Pancreas', metrics: ['glucose'] },
};

const METRICS = {
  pulse: {
    label: 'Heart rate', unit: 'bpm', min: 0, max: 300, step: 1,
    why: 'Heart rate shows how quickly the heart is working and changes with activity.',
    how: 'Follow the device instructions, or count the wrist pulse for 60 seconds. Note whether the reading was taken at rest or after activity.',
    source: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse', sourceName: 'American Heart Association',
  },
  pressure: {
    label: 'Blood pressure', unit: 'mmHg', pair: true,
    why: 'Blood pressure describes the force of blood against the blood vessels.',
    how: 'Use a correctly sized cuff after five minutes of quiet rest. Support the cuff at heart level; follow the mission procedure in microgravity.',
    source: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home', sourceName: 'American Heart Association',
  },
  oxygen: {
    label: 'Oxygen saturation', unit: '%', min: 0, max: 100, step: 1,
    why: 'A pulse oximeter estimates oxygen saturation in the blood.',
    how: 'Follow the device instructions and keep still. Cold skin, circulation and skin pigmentation can affect accuracy.',
    source: 'https://medlineplus.gov/lab-tests/pulse-oximetry/', sourceName: 'MedlinePlus',
  },
  glucose: {
    label: 'Blood glucose', unit: 'mg/dL', min: 0, max: 9999, step: 1,
    why: 'The pancreas makes hormones that help regulate blood glucose. A reading alone does not diagnose a pancreas condition.',
    how: 'Follow the meter instructions and record whether the measurement was taken fasting or after a meal.',
    source: 'https://medlineplus.gov/lab-tests/blood-glucose-test/', sourceName: 'MedlinePlus',
  },
  sleep: {
    label: 'Sleep', unit: 'hrs', min: 0, max: 24, step: 0.1,
    why: 'The brain helps regulate sleep. Sleep is one measure in NASA spaceflight research.',
    how: 'Record the hours slept during the most recent sleep period.',
    source: 'https://www.nasa.gov/reference/standard-measures/', sourceName: 'NASA Standard Measures',
  },
  exercise: {
    label: 'Exercise', unit: 'min', min: 0, max: 1440, step: 1,
    why: 'Activity provides context for recovery and other measurements.',
    how: 'Record the total minutes of exercise over the last 24 hours.',
    source: 'https://www.nasa.gov/reference/standard-measures/', sourceName: 'NASA Standard Measures',
  },
  temperature: {
    label: 'Temperature', unit: '°C', min: 20, max: 50, step: 0.1,
    why: 'The brain helps regulate body temperature. A reading alone cannot diagnose an illness.',
    how: 'Use the thermometer as directed and use the same measurement site when comparing readings.',
    source: 'https://medlineplus.gov/ency/article/003400.htm', sourceName: 'MedlinePlus',
  },
  water: {
    label: 'Water intake', unit: 'L', min: 0, max: 15, step: 0.1,
    why: 'The kidneys help regulate water balance. Water intake alone does not measure kidney function.',
    how: 'Record the total amount consumed over the last 24 hours.',
    source: 'https://www.nasa.gov/humans-in-space/the-human-body-in-space/', sourceName: 'NASA Human Research',
  },
};

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const toNumber = value => value == null || (typeof value === 'string' && value.trim() === '') ? NaN : Number(value);
const contextLabels = { rest: 'At rest', 'after-activity': 'After activity', fasting: 'Fasting', 'after-meal': 'After a meal', other: 'Other context' };
const reportLabels = { good: 'Good', neutral: 'Neutral', low: 'Low', restful: 'Restful', mixed: 'Mixed', poor: 'Poor' };
const vitalFields = new Set(['pulse', 'pressure', 'oxygen', 'temperature']);
const contextualFields = new Set([...vitalFields, 'glucose']);

function valueFor(key, reading) {
  if (!reading || reading.value == null) return '—';
  if (key === 'pressure') {
    const { systolic, diastolic } = reading.value || {};
    if (!Number.isFinite(toNumber(systolic)) || !Number.isFinite(toNumber(diastolic))) return '—';
    return `${toNumber(systolic)}/${toNumber(diastolic)}`;
  }
  return Number.isFinite(toNumber(reading.value)) ? String(toNumber(reading.value)) : '—';
}

function dateFor(value, options) {
  const date = new Date(value);
  if (value == null || !Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

const recordedDate = value => dateFor(value, { dateStyle: 'medium', timeStyle: 'short' });
const shortDate = value => dateFor(value, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function historyMarkup(key, history) {
  if (!Array.isArray(history)) return '';
  let points = history.map(item => {
    const time = item?.time;
    const date = time == null ? NaN : new Date(time).getTime();
    const value = valueFor(key, { value: item?.value });
    if (!Number.isFinite(date) || value === '—') return null;
    const values = key === 'pressure' ? [Number(item.value.systolic), Number(item.value.diastolic)] : [Number(item.value)];
    return { time, date, value, values, context: contextLabels[item.context] ? item.context : '' };
  }).filter(Boolean).sort((a, b) => a.date - b.date);
  const context = contextualFields.has(key) ? points.at(-1)?.context : null;
  if (context != null) points = points.filter(point => point.context === context);
  points = points.slice(-8);
  if (points.length < 2) return '';

  const allValues = points.flatMap(point => point.values);
  const minimum = Math.min(...allValues);
  const maximum = Math.max(...allValues);
  const coordinates = series => points.map(point => {
    const elapsed = points.at(-1).date - points[0].date;
    const x = elapsed === 0 ? 80 : 2 + (point.date - points[0].date) * 156 / elapsed;
    const y = minimum === maximum ? 16 : 28 - (point.values[series] - minimum) * 24 / (maximum - minimum);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const metric = METRICS[key];
  const description = `${metric.label} recorded history, oldest to latest: ${points.map(point => `${point.value} ${metric.unit} on ${recordedDate(point.time)}`).join('; ')}`;
  const firstDate = shortDate(points[0].time);
  const lastDate = shortDate(points.at(-1).time);
  const series = `<polyline class="crew-anatomy-history-line" points="${coordinates(0)}"></polyline>${key === 'pressure' ? `<polyline class="crew-anatomy-history-line crew-anatomy-history-line-second" points="${coordinates(1)}"></polyline>` : ''}`;
  return `<figure class="crew-anatomy-history" data-anatomy-history="${key}">
    <figcaption><span>${context == null ? 'Recorded history' : contextLabels[context] || 'Context not recorded'}</span><span>Last ${points.length}</span></figcaption>
    <svg viewBox="0 0 160 32" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(description)}">${series}</svg>
    ${key === 'pressure' ? '<div class="crew-anatomy-history-legend"><span>Systolic</span><span>Diastolic</span></div>' : ''}
    <div class="crew-anatomy-history-scale">Scale ${escapeHtml(minimum)}–${escapeHtml(maximum)} ${metric.unit}</div>
    <div class="crew-anatomy-history-range"><span>${escapeHtml(firstDate)}</span><span>${escapeHtml(lastDate)}</span></div>
  </figure>`;
}

function recordForm(key) {
  const metric = METRICS[key];
  const inputs = metric.pair
    ? `<div class="crew-anatomy-entry-pair"><label>Systolic <input type="number" name="systolic" min="0" max="400" step="1" inputmode="numeric" required></label><span aria-hidden="true">/</span><label>Diastolic <input type="number" name="diastolic" min="0" max="300" step="1" inputmode="numeric" required></label></div>`
    : `<label>${metric.label} <span>${metric.unit}</span><input type="number" name="value" min="${metric.min}" max="${metric.max}" step="${metric.step}" inputmode="${metric.step === 1 ? 'numeric' : 'decimal'}" required></label>`;
  const context = key === 'glucose'
    ? `<label class="crew-anatomy-entry-context">Meal context<select name="glucoseContext"><option value="">Not specified</option><option value="fasting">Fasting</option><option value="after-meal">After a meal</option><option value="other">Other context</option></select></label>`
    : vitalFields.has(key) ? `<label class="crew-anatomy-entry-context">Measurement context<select name="context"><option value="">Not specified</option><option value="rest">At rest</option><option value="after-activity">After activity</option><option value="other">Other context</option></select></label>` : '';
  return `<form class="crew-anatomy-entry" id="crew-anatomy-entry-${key}" data-anatomy-form="${key}" hidden>${inputs}${context}<details class="crew-anatomy-time"><summary>Record an earlier observation ↗</summary><label>Observed at <input type="datetime-local" name="measuredAt"></label><small>Leave blank to use the current time.</small></details><p class="crew-anatomy-form-error" role="alert"></p><div class="crew-anatomy-entry-actions"><button type="submit">Save reading <span aria-hidden="true">↗</span></button><button type="button" data-anatomy-cancel>Cancel</button></div></form>`;
}

function measurement(summary, key, selected, histories) {
  const metric = METRICS[key];
  const reading = summary[key];
  const value = valueFor(key, reading);
  const timestamp = reading?.recorded ? recordedDate(reading.time) : '';
  const provenance = value === '—' ? 'Not recorded' : reading.recorded ? `Recorded · ${timestamp || 'time unavailable'}${contextLabels[reading.context] ? ` · ${contextLabels[reading.context]}` : ''}` : 'Sample';
  const history = historyMarkup(key, histories?.[key]);
  return `<div class="crew-anatomy-measure crew-anatomy-measure-primary" id="crew-anatomy-detail-${key}" data-anatomy-metric="${key}" data-anatomy-metric-panel="${key}"${selected ? '' : ' hidden'}>
    <div class="crew-anatomy-reading"><strong>${escapeHtml(value)}<small>${metric.unit}</small></strong>
      <span class="crew-anatomy-provenance">${escapeHtml(provenance)}</span>
      ${history}
    </div>
    <p class="crew-anatomy-insight">${metric.why}</p>
    <button type="button" class="crew-anatomy-record" data-anatomy-edit="${key}" aria-controls="crew-anatomy-entry-${key}" aria-expanded="false">Record reading <span aria-hidden="true">↗</span></button>
    ${recordForm(key)}
    <details class="crew-anatomy-guidance"><summary>How to record <span aria-hidden="true">↗</span></summary><p>${metric.how}</p><a href="${metric.source}" target="_blank" rel="noopener noreferrer">${metric.sourceName} ↗</a></details>
  </div>`;
}

function symptoms(status) {
  if (status === 'urgent') return 'Urgent symptoms reported · follow mission emergency procedures';
  if (status === 'concerning') return 'Symptoms reported · review with the medical team';
  if (status === 'none') return 'No symptoms reported';
  return 'No symptoms recorded';
}

/** Render inside the selected person's existing scene. Data remains owned by CrewDesign. */
export function renderAnatomyUI(summary, active = 'circulation', histories = {}, activeMetric = '') {
  if (!Object.hasOwn(CATEGORIES, active)) active = 'circulation';
  if (!CATEGORIES[active].metrics.includes(activeMetric)) activeMetric = CATEGORIES[active].metrics[0];
  const person = escapeHtml(summary?.person?.name || 'Crew member');
  const status = ['none', 'concerning', 'urgent'].includes(summary?.symptoms) ? summary.symptoms : '';
  const navigation = Object.entries(CATEGORIES).map(([key, category]) =>
    `<button type="button" id="crew-anatomy-control-${key}" aria-controls="crew-anatomy-panel-${key}" aria-pressed="${key === active}" data-anatomy-category="${key}">${category.nav}</button>`
  ).join('');
  const heartHotspot = `<button type="button" class="crew-anatomy-hotspot crew-anatomy-hotspot--chest" aria-label="Explore the heart" aria-controls="crew-anatomy-panel-circulation" aria-pressed="${active === 'circulation'}" data-anatomy-category="circulation"><span class="crew-anatomy-hotspot-ring" aria-hidden="true"><img src="/space-test-site/images/hotspot_vfx.png" alt=""></span><span class="crew-anatomy-hotspot-label"><span>Explore heart</span><i aria-hidden="true">↗</i></span></button>`;
  const panels = Object.entries(CATEGORIES).map(([key, category]) => {
    const selectedMetric = key === active ? activeMetric : category.metrics[0];
    const selectors = category.metrics.map(field => {
      const metric = METRICS[field];
      const value = valueFor(field, summary?.[field]);
      const source = value === '—' ? 'Not recorded' : summary?.[field]?.recorded ? 'Recorded' : 'Sample';
      return `<button type="button" data-anatomy-metric-select="${field}" aria-pressed="${field === selectedMetric}" aria-controls="crew-anatomy-detail-${field}"><span>${field === 'oxygen' ? 'Oxygen' : metric.label}</span><strong>${escapeHtml(value)}<small>${metric.unit}</small></strong><em>${source}</em></button>`;
    }).join('');
    const reports = [['mood', 'Mood'], ['sleepQuality', 'Sleep quality']].filter(([field]) => reportLabels[summary?.[field]?.value]);
    const selfReport = key === 'recovery' && reports.length ? `<details class="crew-anatomy-symptoms"><summary>Self-reported context ↗</summary>${reports.map(([field, label]) => `<p>${label}: ${reportLabels[summary[field].value]} · ${escapeHtml(recordedDate(summary[field].time))}</p>`).join('')}</details>` : '';
    return `<section class="crew-anatomy-view" id="crew-anatomy-panel-${key}" aria-labelledby="crew-anatomy-control-${key}" data-anatomy-panel="${key}"${key === active ? '' : ' hidden'}>
      <div class="crew-anatomy-view-header"><h3>${category.title}</h3></div>
      <div class="crew-anatomy-metric-switch" role="group" aria-label="${category.title} measurements">${selectors}</div>
      ${category.metrics.map(field => measurement(summary || {}, field, field === selectedMetric, histories)).join('')}
      ${selfReport}
      ${key === 'kidney' || key === 'pancreas' ? `<p class="crew-anatomy-credit">3D organ model: Human Reference Atlas, <a href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noopener noreferrer">view source</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Illustrative anatomy; not a diagnosis.</p>` : ''}
      ${key === 'daily' && status ? `<details class="crew-anatomy-symptoms" data-anatomy-symptoms data-status="${status}"><summary>Symptom report ↗</summary><p>${symptoms(status)}${summary?.symptomTime ? ` · ${escapeHtml(recordedDate(summary.symptomTime))}` : ''}</p>${summary?.symptomNote ? `<p>${escapeHtml(summary.symptomNote)}</p>` : ''}</details>` : ''}
    </section>`;
  }).join('');
  return `<div class="crew-anatomy" role="region" data-category="${active}" data-metric="${activeMetric}" aria-label="${person} anatomy view">
    <button class="crew-anatomy-exit" type="button" data-anatomy-exit>← Back to suit</button>
    <div class="crew-anatomy-connector" aria-hidden="true"></div>
    <div class="crew-anatomy-content"><nav class="crew-anatomy-sections" aria-label="Health sections"><button type="button" data-anatomy-body>Body</button>${navigation}</nav>${panels}</div>
    <div class="crew-anatomy-hotspots">${heartHotspot}<button type="button" class="crew-anatomy-hotspot crew-anatomy-hotspot--head" aria-label="Explore the brain" aria-pressed="${active === 'recovery'}" data-anatomy-category="recovery"><span class="crew-anatomy-hotspot-ring" aria-hidden="true"></span><span class="crew-anatomy-hotspot-label"><span>Explore brain</span></span></button><button type="button" class="crew-anatomy-hotspot crew-anatomy-hotspot--kidney" aria-label="Explore the kidney" aria-pressed="${active === 'kidney'}" data-anatomy-category="kidney"><span class="crew-anatomy-hotspot-ring" aria-hidden="true"></span><span class="crew-anatomy-hotspot-label"><span>Kidney</span></span></button><button type="button" class="crew-anatomy-hotspot crew-anatomy-hotspot--pancreas" aria-label="Explore the pancreas" aria-pressed="${active === 'pancreas'}" data-anatomy-category="pancreas"><span class="crew-anatomy-hotspot-ring" aria-hidden="true"></span><span class="crew-anatomy-hotspot-label"><span>Pancreas</span></span></button></div>
  </div>`;
}

/** Switch existing controls in place, retaining keyboard focus. */
export function setAnatomyCategory(root, category) {
  if (!root || !Object.hasOwn(CATEGORIES, category)) return false;
  root.dataset.category = category;
  root.querySelectorAll('[data-anatomy-category]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.anatomyCategory === category));
  });
  root.querySelectorAll('[data-anatomy-panel]').forEach(panel => {
    panel.hidden = panel.dataset.anatomyPanel !== category;
  });
  const current = root.querySelector?.(`[data-anatomy-panel="${category}"] [data-anatomy-metric-select][aria-pressed="true"]`);
  if (current) root.dataset.metric = current.dataset.anatomyMetricSelect;
  return true;
}

/** Change the active measurement without replacing controls or losing form drafts. */
export function setAnatomyMetric(root, field) {
  const category = CATEGORIES[root?.dataset?.category];
  if (!category || !category.metrics.includes(field)) return false;
  root.dataset.metric = field;
  root.querySelectorAll('[data-anatomy-metric-select]').forEach(button => {
    if (category.metrics.includes(button.dataset.anatomyMetricSelect)) button.setAttribute('aria-pressed', String(button.dataset.anatomyMetricSelect === field));
  });
  root.querySelectorAll('[data-anatomy-metric-panel]').forEach(panel => {
    if (category.metrics.includes(panel.dataset.anatomyMetricPanel)) panel.hidden = panel.dataset.anatomyMetricPanel !== field;
  });
  return true;
}
