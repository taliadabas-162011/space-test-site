const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const contextLabels = { rest: 'At rest', 'after-activity': 'After activity', fasting: 'Fasting', 'after-meal': 'After a meal', other: 'Other context' };
function shortDate(time) {
  const date = new Date(time);
  return time && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date) : '';
}
function recordedDetail(reading) {
  if (!reading?.recorded) return 'Sample';
  return ['Recorded', shortDate(reading.time), contextLabels[reading.context], reading.source].filter(Boolean).join(' · ');
}

function observationValue(reading) {
  const raw = reading?.value;
  if (raw == null || (typeof raw === 'string' && raw.trim() === '') || !Number.isFinite(Number(raw))) return '—';
  return String(Number(raw));
}

function overviewReading(reading, label, unit) {
  const value = observationValue(reading);
  const provenance = value === '—' ? 'Not available' : reading.recorded ? `Recorded · ${shortDate(reading.time) || 'time unavailable'}` : 'Sample';
  return `<div class="observation-overview-reading"><span>${label}</span><strong>${escapeHtml(value)}<small>${unit}</small></strong><em>${escapeHtml(provenance)}</em></div>`;
}

export function renderObservationOverview(summary, showCoverage = true) {
  return overviewReading(summary?.pulse, 'Heart rate', 'bpm') + overviewReading(summary?.oxygen, 'Oxygen', '%');
}

function renderHeartHistory(history = []) {
  const valid = history.filter(item => item?.recorded !== false && item?.value != null && String(item.value).trim() !== '' && Number.isFinite(Number(item.value)) && Number.isFinite(Date.parse(item.time))).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const context = contextLabels[valid.at(-1)?.context] ? valid.at(-1).context : '';
  const readings = valid.filter(item => (contextLabels[item.context] ? item.context : '') === context).slice(-8);
  if (readings.length < 2) return '';
  const values = readings.map(item => Number(item.value));
  const times = readings.map(item => Date.parse(item.time));
  const min = Math.min(...values), max = Math.max(...values);
  const spread = Math.max(max - min, 4);
  const first = times[0], duration = Math.max(times.at(-1) - first, 1);
  const points = readings.map((item, i) => ({ x: 5 + (times[i] - first) / duration * 190, y: 40 - ((Number(item.value) - (min - (spread - (max - min)) / 2)) / spread) * 32 }));
  const path = points.map(({ x, y }, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const dots = points.map(({ x, y }) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" />`).join('');
  const accessible = readings.map(item => `${item.value} beats per minute on ${new Date(item.time).toLocaleString()}`).join('; ');
  const contextLabel = contextLabels[context] || 'Context not recorded';
  return `<figure class="observation-history" aria-label="Heart rate history, ${escapeHtml(contextLabel)}: ${escapeHtml(accessible)}"><figcaption>Heart rate <span>${escapeHtml(contextLabel)}</span></figcaption>
    <svg viewBox="0 0 200 46" aria-hidden="true"><path class="observation-history-base" d="M 5 42 H 195"/><path class="observation-history-line" d="${path}"/>${dots}</svg>
    <div class="observation-history-range"><span>${min}–${max} bpm</span><span>${readings.length} readings</span></div></figure>`;
}

export function observationAction(assessment, summary) {
  return assessment?.priority === 'urgent' || summary?.symptoms === 'urgent' ? 'emergency' : 'anatomy';
}

export function renderObservationIdentity(summary, pulseHistory = [], assessment = null) {
  const words = escapeHtml(summary?.person?.name || 'Crew member').split(' ').map(word => `<span class="orbit-name-mask"><span>${word}</span></span>`).join(' ');
  const status = observationAction(assessment, summary) === 'emergency' ? 'urgent' : summary?.symptoms;
  const label = status === 'urgent' ? 'Urgent symptoms reported'
    : status === 'concerning' ? 'Symptoms reported'
      : status === 'none' ? 'No symptoms reported' : '';
  const time = label ? shortDate(summary?.symptomTime) || 'time unavailable' : '';
  const tags = Array.isArray(summary?.symptomTags) ? summary.symptomTags.map(tag => symptomOptions.find(([value]) => value === tag)?.[1]).filter(Boolean) : [];
  const symptoms = tags.length ? `<span class="observation-status-reported">${escapeHtml(tags.join(', '))}</span>` : '';
  const onset = shortDate(summary?.symptomOnset);
  const progression = { improving: 'Improving', unchanged: 'Unchanged', worsening: 'Worsening' }[summary?.symptomProgression];
  const course = [onset ? `Began ${onset}` : '', progression].filter(Boolean).join(' · ');
  const detail = status === 'urgent' ? '<button type="button" data-next-action="emergency">Emergency guidance <span aria-hidden="true">↗</span></button>'
    : status === 'concerning' ? '<span class="observation-status-followup">Review with the medical team</span>' : '';
  return `<h2 aria-label="${escapeHtml(summary?.person?.name || 'Crew member')}">${words}</h2>${label ? `<div class="observation-status" data-status="${escapeHtml(status)}"><span>${label}</span>${symptoms}<small>Reported · ${escapeHtml(time)}${course ? `<br>${escapeHtml(course)}` : ''}</small>${detail}</div>` : ''}`;
}

function profileReading(summary, key, title, unit, primary = false) {
  const reading = summary?.[key];
  let value = observationValue(reading);
  if (key === 'pressure') {
    const systolic = observationValue({ value: reading?.value?.systolic });
    const diastolic = observationValue({ value: reading?.value?.diastolic });
    value = systolic === '—' || diastolic === '—' ? '—' : `${systolic}/${diastolic}`;
  }
  const provenance = value === '—' ? 'Not available' : recordedDetail(reading);
  return `<button type="button" class="observation-profile-reading observation-profile-reading--${key}${primary ? ' observation-profile-primary' : ''}" data-explore-measure="${key}"><span>${title} <i aria-hidden="true">↗</i></span><strong>${escapeHtml(value)}<small>${unit}</small></strong><em>${escapeHtml(provenance)}</em></button>`;
}

export function renderObservationProfile(summary, pulseHistory = []) {
  const fields = {
    pulse: ['Heart rate', 'bpm'], oxygen: ['Oxygen', '%'], pressure: ['Blood pressure', 'mmHg'], glucose: ['Blood glucose', 'mg/dL'], weight: ['Body mass', 'kg'],
    sleep: ['Sleep', 'hrs'], temperature: ['Temperature', '°C'], water: ['Water intake', 'L'], exercise: ['Exercise', 'min'],
  };
  const ordered = Object.keys(fields).sort((a, b) => Number(Boolean(summary?.[b]?.recorded)) - Number(Boolean(summary?.[a]?.recorded)));
  const primary = ordered[0];
  const secondary = ordered.slice(1, 3);
  return `${profileReading(summary, primary, ...fields[primary], true)}${primary === 'pulse' ? renderHeartHistory(pulseHistory) : ''}
    <div class="observation-profile-secondary">${secondary.map(field => profileReading(summary, field, ...fields[field])).join('')}</div>`;
}

function symptomText(status) {
  if (status === 'urgent') return 'Urgent symptoms reported';
  if (status === 'concerning') return 'Symptoms reported';
  if (status === 'none') return 'No symptoms reported';
  return 'No symptoms recorded';
}

export function renderObservationMobile(summary, index = 1) {
  const person = escapeHtml(summary?.person?.name || 'Crew member');
  const status = ['urgent', 'concerning', 'none'].includes(summary?.symptoms) ? summary.symptoms : '';
  const when = status && summary?.symptomTime ? ` · ${shortDate(summary.symptomTime)}` : '';
  return `<div class="observation-mobile-identity"><strong>${person}</strong>${status ? `<span data-status="${status}">${symptomText(status)}${escapeHtml(when)}</span>` : ''}</div>
    <div class="observation-mobile-readings">${renderObservationOverview(summary, false)}</div>
    <button type="button" data-record="${Number.isInteger(index) ? index : 1}">Record readings <span aria-hidden="true">↗</span></button>`;
}

function input(name, title, unit, min, max, step, inputmode = 'numeric') {
  return `<label class="observation-field"><span class="observation-field-name"><span class="observation-field-label">${title}</span><em data-checkin-last="${name}" hidden></em></span><span class="observation-entry"><input name="${name}" type="number" min="${min}" max="${max}" step="${step}" inputmode="${inputmode}" placeholder="—"><small>${unit}</small></span></label>`;
}

const symptomOptions = [
  ['chest-pain', 'Chest pain'], ['breathing-difficulty', 'Difficulty breathing'],
  ['fainting', 'Fainting'], ['new-weakness', 'New weakness'],
  ['speech-vision-change', 'Speech or vision change'], ['dizziness', 'Dizziness'],
  ['nausea', 'Nausea'], ['headache', 'Headache'], ['fatigue', 'Fatigue'], ['other', 'Other'],
];

/** Update context, never the values currently being entered. */
export function updateObservationCheckin(form, summary) {
  if (!form || !summary) return;
  form.querySelectorAll('[data-checkin-last]').forEach(element => {
    const key = element.dataset.checkinLast;
    const reading = summary[key];
    if (!reading?.recorded) { element.hidden = true; element.textContent = ''; return; }
    const value = key === 'pressure'
      ? `${observationValue({ value: reading.value?.systolic })}/${observationValue({ value: reading.value?.diastolic })}`
      : observationValue(reading);
    const unit = { pulse: 'bpm', oxygen: '%', pressure: 'mmHg', temperature: '°C', glucose: 'mg/dL', weight: 'kg', sleep: 'hrs', water: 'L', exercise: 'min' }[key] || '';
    const context = contextLabels[reading.context];
    element.textContent = [`Last recorded ${value} ${unit}`, shortDate(reading.time), context].filter(Boolean).join(' · ');
    element.hidden = false;
  });
}

export function renderObservationCheckin() {
  return `<header class="observation-checkin-head"><h3>Health check</h3><p>Start with how you feel, then add the readings you have.</p></header>
    <fieldset class="observation-symptom-section"><legend>How are you feeling?</legend>
      <label class="observation-select observation-symptoms"><span class="observation-sr-only">Symptoms</span><select name="symptoms"><option value="">Not recorded</option><option value="none">No symptoms to report</option><option value="concerning">I feel unwell</option><option value="urgent">Urgent symptoms</option></select></label>
      <p class="observation-urgent" role="status" hidden>Alert the crew and follow the emergency procedure now.</p>
      <button class="observation-emergency-link" type="button" data-emergency>Open emergency guidance <span aria-hidden="true">↗</span></button>
      <fieldset class="observation-symptom-note" hidden><legend>What are you experiencing?</legend>
        <div class="observation-symptom-tags">${symptomOptions.map(([value, label]) => `<label><input type="checkbox" name="symptomTags" value="${value}"><span>${label}</span></label>`).join('')}</div>
        <div class="observation-symptom-meta"><label>When did it begin? <span>Optional</span><input type="datetime-local" name="symptomOnset"></label><label>How is it changing? <span>Optional</span><select name="symptomProgression"><option value="">Not specified</option><option value="improving">Improving</option><option value="unchanged">Unchanged</option><option value="worsening">Worsening</option></select></label></div>
        <label class="observation-note-field">Anything else? <span>Optional</span><textarea name="symptomNote" maxlength="240" rows="2" placeholder="Describe what happened"></textarea></label>
      </fieldset>
    </fieldset>
    <fieldset class="observation-group"><legend>Measurements <span>Optional</span></legend><div class="observation-vital-fields">
      ${input('pulse', 'Heart rate', 'bpm', 0, 300, 1)}
      ${input('oxygen', 'Oxygen saturation', '%', 0, 100, 1)}
      <div class="observation-pressure"><span class="observation-field-name"><span class="observation-field-label">Blood pressure</span><em data-checkin-last="pressure" hidden></em></span><div class="observation-pressure-entry"><label><span class="observation-sr-only">Systolic blood pressure</span><input name="systolic" type="number" min="0" max="400" step="1" inputmode="numeric" placeholder="Sys"></label><span aria-hidden="true">/</span><label><span class="observation-sr-only">Diastolic blood pressure</span><input name="diastolic" type="number" min="0" max="300" step="1" inputmode="numeric" placeholder="Dia"></label><small>mmHg</small></div></div>
      ${input('temperature', 'Temperature', '°C', 20, 50, 0.1, 'decimal')}
      ${input('glucose', 'Blood glucose', 'mg/dL', 0, 9999, 0.1, 'decimal')}
      ${input('weight', 'Body mass', 'kg', 0, 400, 0.1, 'decimal')}
    </div>
    <div class="observation-context-pair"><label class="observation-select observation-vital-context"><span>Vitals taken</span><select name="context"><option value="">Context not specified</option><option value="rest">At rest</option><option value="after-activity">After activity</option><option value="other">Other context</option></select></label>
      <label class="observation-select observation-glucose-context"><span>Glucose taken</span><select name="glucoseContext"><option value="">Context not specified</option><option value="fasting">Fasting</option><option value="after-meal">After a meal</option><option value="other">Other context</option></select></label></div>
    </fieldset>
    <details class="observation-daily-context"><summary>Daily context and recovery <span aria-hidden="true">↗</span></summary><fieldset class="observation-group observation-daily"><legend class="observation-sr-only">Daily context</legend><div class="observation-daily-fields">
      ${input('sleep', 'Last sleep', 'hrs', 0, 24, 0.1, 'decimal')}
      ${input('water', 'Water · 24h', 'L', 0, 15, 0.1, 'decimal')}
      ${input('exercise', 'Exercise · 24h', 'min', 0, 1440, 1)}
    </div></fieldset>
    <div class="observation-reports"><label class="observation-select"><span>Mood</span><select name="mood"><option value="">Not recorded</option><option value="good">Good</option><option value="neutral">Neutral</option><option value="low">Low</option></select></label><label class="observation-select"><span>Sleep quality</span><select name="sleepQuality"><option value="">Not recorded</option><option value="restful">Restful</option><option value="mixed">Mixed</option><option value="poor">Poor</option></select></label></div></details>
    <details class="observation-time" open><summary>Reading date and time</summary><label>Observed at <input type="datetime-local" name="measuredAt"></label><small>Set the date and time before saving the measurements.</small></details>
    <details class="observation-guide"><summary>How to take a measurement <span aria-hidden="true">↗</span></summary><div>
      <p><strong>Heart rate</strong> — Follow the device instructions, or count the wrist pulse for 60 seconds. Note whether the reading was taken at rest or after activity. <a href="https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse" target="_blank" rel="noopener noreferrer">AHA guide ↗</a></p>
      <p><strong>Blood pressure</strong> — Use a correctly sized cuff after five minutes of quiet rest. Support the cuff at heart level; follow the mission procedure in microgravity. <a href="https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home" target="_blank" rel="noopener noreferrer">AHA guide ↗</a></p>
      <p><strong>Oxygen</strong> — Follow the pulse-oximeter instructions and keep still. Cold skin, circulation and skin pigmentation can affect accuracy; do not rely on a number alone. <a href="https://medlineplus.gov/lab-tests/pulse-oximetry/" target="_blank" rel="noopener noreferrer">MedlinePlus ↗</a></p>
      <p><strong>Temperature</strong> — Use the thermometer as directed and record the same measurement site when comparing readings. <a href="https://medlineplus.gov/ency/article/003400.htm" target="_blank" rel="noopener noreferrer">MedlinePlus ↗</a></p>
      <p><strong>Blood glucose</strong> — Follow the meter instructions and record whether the reading was taken fasting or after a meal. <a href="https://medlineplus.gov/lab-tests/blood-glucose-test/" target="_blank" rel="noopener noreferrer">MedlinePlus ↗</a></p>
      <p>If a reading is unexpected, check the device and follow the mission medical protocol. Do not delay urgent care to enter data.</p>
    </div></details>
    <div class="observation-footer"><p class="orbit-error" role="alert"></p><div class="orbit-form-actions observation-actions"><button type="button" data-cancel>Cancel</button><button type="submit">Save this reading <span aria-hidden="true">↗</span></button></div></div>`;
}
