/* Data and interactions layered onto the captured Vibrant experience. */
(() => {
  const storageKey = 'crew-health-observations-v1';
  const profileStorageKey = 'crew-health-profile-v1';
  function readProfile() {
    try {
      const value = JSON.parse(localStorage.getItem(profileStorageKey) || 'null');
      if (!value || typeof value.name !== 'string' || !value.name.trim()) return null;
      return { name: value.name.trim().slice(0, 48), model: value.model === 'female' ? 'female' : 'male' };
    } catch (_) { return null; }
  }
  let savedProfile = readProfile();
  const crew = [{ id: 'alex', name: savedProfile?.name || 'Crew member', model: savedProfile?.model || 'male', samples: {} }];
  const metrics = {
    pulse: { label: 'Heart rate', unit: 'bpm', min: 0, max: 300, step: 1 },
    pressure: { label: 'Blood pressure', unit: 'mmHg', pair: true },
    oxygen: { label: 'Oxygen saturation', unit: '%', min: 0, max: 100, step: 1 },
    glucose: { label: 'Blood glucose', unit: 'mg/dL', min: 0, max: 9999, step: 1 },
    sleep: { label: 'Sleep', unit: 'hours', min: 0, max: 24, step: 0.1 },
    water: { label: 'Water intake', unit: 'litres', min: 0, max: 15, step: 0.1 },
    temperature: { label: 'Temperature', unit: '°C', min: 20, max: 50, step: 0.1 },
    exercise: { label: 'Exercise', unit: 'minutes', min: 0, max: 1440, step: 1 },
  };
  const vitalFields = new Set(['pulse', 'pressure', 'oxygen', 'temperature']);
  const readingContexts = ['rest', 'after-activity', 'other'];
  const glucoseContexts = ['fasting', 'after-meal', 'other'];
  const symptomOptions = Object.freeze({
    'chest-pain': 'Chest pain',
    'breathing-difficulty': 'Breathing difficulty',
    fainting: 'Fainting',
    'new-weakness': 'New weakness',
    'speech-vision-change': 'Speech or vision change',
    dizziness: 'Dizziness',
    nausea: 'Nausea',
    headache: 'Headache',
    fatigue: 'Fatigue',
    other: 'Other',
  });
  const symptomProgressions = ['improving', 'unchanged', 'worsening'];
  const selfReports = {
    mood: ['good', 'neutral', 'low'],
    sleepQuality: ['restful', 'mixed', 'poor'],
  };
  const views = {
    Neural_Zoomer: { title: 'Rest & recovery', fields: ['sleep'], video: 'NeuralHealthV03.mp4', context: 'Sleep is one part of understanding how a crew member is adapting over time.' },
    Neurotransmitters: { title: 'Mind & wellbeing', fields: ['sleep'], video: 'Neurotransmiters.mp4', context: 'Review rest alongside personal notes and the crew’s established health procedures.' },
    Cardio_Zoomer: { title: 'Heart & circulation', fields: ['pulse', 'pressure', 'oxygen'], video: 'CardioZoomerNew.mp4', context: 'Compare readings with previous observations and the circumstances in which they were measured.' },
    Toxins_Panel: { title: 'Hydration', fields: ['water'], video: 'ToxinsV03.mp4', context: 'Keep a simple record of water intake alongside the rest of a daily check-in.' },
    Gut_Zoomer: { title: 'Nutrition & hydration', fields: ['water'], video: 'MasterGutZoomerV03.mp4', context: 'Use recorded intake to provide context for a crew member’s daily health.' },
    Food_Sensitivity: { title: 'Daily intake', fields: ['water'], video: 'Gut.mp4', context: 'Keep a record of hydration and review changes with the crew medical team.' },
    Hormone_Zoomer: { title: 'Hormonal health', fields: [], video: 'Hormones3D.mp4', context: 'Hormone measurements have not been added to this prototype.' },
    Genetics_Testing_Suite: { title: 'Genetics', fields: [], context: 'Genetic records have not been added to this prototype.' },
    Oxidative_Stress: { title: 'Activity & recovery', fields: ['exercise'], video: 'OxidativeStressV03.mp4', context: 'A consistent activity record can help give other observations context.' },
    Nutrition: { title: 'Hydration', fields: ['water'], context: 'Review water intake alongside activity and the rest of a daily check-in.' },
    Autoimmunity: { title: 'Immune health', fields: [], context: 'Immune measurements have not been added to this prototype.' },
  };
  const hotspotNames = {
    Neural_Zoomer: 'Rest & recovery', Neurotransmitters: 'Mind & wellbeing',
    Cardio_Zoomer: 'Heart rate', Toxins_Panel: 'Hydration', Gut_Zoomer: 'Nutrition & hydration',
    Food_Sensitivity: 'Daily intake', Hormone_Zoomer: 'Hormonal health',
    Genetics_Testing_Suite: 'Genetics', Oxidative_Stress: 'Activity & recovery',
    Nutrition: 'Hydration', Autoimmunity: 'Immune health',
  };
  const categoryNames = ['Mind & rest', 'Heart & circulation', 'Hydration', 'Nutrition & gut', 'Hormonal health', 'Genetics', 'Long-term health'];
  let selected = crew[0];
  let stories;
  let store;
  let records = readRecords();

  function readRecords() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function entriesFor(personId, field) {
    const list = records[personId]?.[field];
    const validNumber = value => value != null && String(value).trim() !== '' && Number.isFinite(Number(value));
    return Array.isArray(list) ? list.filter(item => {
      const validValue = field === 'pressure'
        ? validNumber(item?.value?.systolic) && validNumber(item?.value?.diastolic)
        : validNumber(item?.value);
      return validValue && Number.isFinite(Date.parse(item?.time));
    }).sort((a, b) => Date.parse(a.time) - Date.parse(b.time)) : [];
  }
  function entries(field) { return entriesFor(selected.id, field); }
  function displayDate(value) {
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }
  function displayValue(field, value) {
    if (value == null || value === '') return '—';
    return field === 'pressure' ? `${Number(value.systolic)}/${Number(value.diastolic)}` : String(Number(value));
  }
  function latestMarkup(field, position, count) {
    const metric = metrics[field];
    const list = entries(field);
    const last = list.at(-1);
    const value = last ? last.value : selected.samples[field];
    const source = last ? `RECORDED ${displayDate(last.time)}` : value == null ? 'NO READING RECORDED' : 'ILLUSTRATIVE SAMPLE';
    const shape = `${position === 0 ? ' rounded-t-2sm' : ''}${position === count - 1 ? ' rounded-b-2sm' : ''}`;
    const input = metric.pair
      ? '<label>Systolic <small>mmHg</small><input name="systolic" type="number" min="0" max="400" step="1" inputmode="numeric" required></label><label>Diastolic <small>mmHg</small><input name="diastolic" type="number" min="0" max="300" step="1" inputmode="numeric" required></label>'
      : `<label>${metric.label} <small>${metric.unit}</small><input name="value" type="number" min="${metric.min}" max="${metric.max}" step="${metric.step}" inputmode="decimal" required></label>`;
    return `<div class="crew-reference-row flex pl-20 pr-10 pt-20 pb-16 bg-white justify-between items-center gap-10${shape}"><div><p class="text-semi-600-16 mb-8">${metric.label}</p><p class="text-mono-regular-400-13 uppercase">${source}</p></div><button type="button" class="biomarker-tag crew-value-tag" data-health-open="${field}" aria-label="Record ${metric.label}">${displayValue(field, value)} <small>${metric.unit}</small> <span aria-hidden="true">↗</span></button></div><form class="crew-entry" data-health-form="${field}" hidden>${input}<div class="crew-entry-actions"><button type="submit">Save reading</button><button type="button" data-health-cancel>Cancel</button></div><p role="alert" class="crew-entry-error"></p></form>`;
  }
  function historyMarkup(field) {
    if (!field) return '<p>No measurements are available for this view yet.</p>';
    const list = entries(field).slice(-8).reverse();
    if (!list.length) return '<p>No readings have been recorded on this device yet.</p><p>The overview currently shows an illustrative sample.</p>';
    return `<div class="crew-history">${list.map(item => `<div><span>${displayDate(item.time)}</span><strong>${displayValue(field, item.value)} <small>${metrics[field].unit}</small></strong></div>`).join('')}</div>`;
  }
  function storyData(Title, Paragraph, Biomarkers, reactive) {
    return Object.fromEntries(Object.entries(views).map(([key, view]) => [key, [
      { type: 'overview', id: `${key}-overview`, name: 'overview', headerText: view.title, selectorName: 'Overview', sections: [
        { component: Title, props: reactive({ title: `<h1>${view.title}</h1>`, text: `<p>${selected.name} · ILLUSTRATIVE CREW</p>` }) },
        { component: Paragraph, props: reactive({ title: '<h2>At a glance</h2>', text: [`<p>${view.context}</p>`] }) },
        { component: Biomarkers, props: reactive({ title: '<h2>Health readings</h2>', biomarkers: view.fields.length ? view.fields.map((field, index) => ({ test: latestMarkup(field, index, view.fields.length) })) : [{ test: '<p>No measurements have been recorded for this view.</p>' }] }) },
        { component: Paragraph, props: reactive({ title: '', text: ['<p>Follow mission medical procedures when interpreting a change.</p>'] }) },
      ] },
      { type: 'story', id: `${key}-history`, name: 'history', headerText: view.title, selectorName: 'History', sections: [
        { component: Title, props: reactive({ title: `<h1>${view.title}</h1>`, text: '<p>RECORDED ON THIS DEVICE</p>' }) },
        { component: Paragraph, props: reactive({ title: '<h2>Reading history</h2>', text: [historyMarkup(view.fields[0])] }) },
      ] },
    ]]));
  }
  function refreshStories() {
    if (!stories) return;
    for (const [key, view] of Object.entries(views)) {
      stories[key][0].sections[0].props.text = `<p>${selected.name} · ILLUSTRATIVE CREW</p>`;
      stories[key][0].sections[2].props.biomarkers = view.fields.length ? view.fields.map((field, index) => ({ test: latestMarkup(field, index, view.fields.length) })) : [{ test: '<p>No measurements have been recorded for this view.</p>' }];
      stories[key][1].sections[1].props.text = [historyMarkup(view.fields[0])];
    }
  }
  function registerStories(value) { stories = value; refreshStories(); }
  function saveProfile(name, model = 'male') {
    const cleanName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').slice(0, 48) : '';
    if (!cleanName) throw new Error('Enter a name for the crew profile.');
    const safeModel = model === 'female' ? 'female' : 'male';
    const nextProfile = { name: cleanName, model: safeModel, createdAt: savedProfile?.createdAt || new Date().toISOString() };
    localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    savedProfile = nextProfile;
    crew[0].name = cleanName;
    crew[0].model = safeModel;
    window.dispatchEvent(new CustomEvent('crewprofile:update', { detail: { profile: { ...nextProfile } } }));
    return { ...nextProfile };
  }
  function hotspotLabel(name) { return hotspotNames[name] || name.replace(/_/g, ' '); }
  function symptomEntries(personId) {
    const list = records[personId]?.symptoms;
    return Array.isArray(list) ? list
      .filter(item => ['none', 'concerning', 'urgent'].includes(item?.value) && Number.isFinite(Date.parse(item?.time)))
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time)) : [];
  }
  function summary(personId) {
    const person = crew.find(item => item.id === personId);
    if (!person) return null;
    const reading = field => {
      const latest = entriesFor(person.id, field).at(-1);
      const contexts = field === 'glucose' ? glucoseContexts : readingContexts;
      return { value: latest ? latest.value : person.samples[field] ?? null, recorded: Boolean(latest), time: latest?.time || null,
        context: contexts.includes(latest?.context) ? latest.context : '' };
    };
    const symptoms = symptomEntries(person.id).at(-1);
    const report = field => {
      const list = records[person.id]?.[field];
      const latest = Array.isArray(list) ? list.filter(item => selfReports[field].includes(item?.value) && Number.isFinite(Date.parse(item?.time))).sort((a, b) => Date.parse(a.time) - Date.parse(b.time)).at(-1) : null;
      return latest ? { value: latest.value, time: latest.time } : null;
    };
    return { person, pulse: reading('pulse'), oxygen: reading('oxygen'), glucose: reading('glucose'), sleep: reading('sleep'), pressure: reading('pressure'),
      water: reading('water'), temperature: reading('temperature'), exercise: reading('exercise'), symptoms: symptoms?.value || '',
      symptomTime: symptoms?.time || null, symptomNote: typeof symptoms?.note === 'string' ? symptoms.note : '',
      symptomTags: Array.isArray(symptoms?.tags) ? symptoms.tags.filter(tag => Object.hasOwn(symptomOptions, tag)) : [],
      symptomOnset: symptoms?.onset && Number.isFinite(Date.parse(symptoms.onset)) ? symptoms.onset : null,
      symptomProgression: symptomProgressions.includes(symptoms?.progression) ? symptoms.progression : '',
      mood: report('mood'), sleepQuality: report('sleepQuality') };
  }
  function history(personId, field) {
    if (!crew.some(person => person.id === personId) || !metrics[field]) return [];
    return entriesFor(personId, field).map(item => structuredClone(item));
  }
  function symptomHistory(personId) {
    if (!crew.some(person => person.id === personId)) return [];
    return symptomEntries(personId).map(item => structuredClone(item));
  }
  function selectCrew(id) {
    selected = crew.find(person => person.id === id) || crew[0];
    document.querySelectorAll('.crew-picker [data-crew]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.crew === selected.id)));
    store?.setBodySelected(selected.model);
    refreshStories();
    window.dispatchEvent(new CustomEvent('crewhealth:update'));
  }
  function saveOverview(personId, values, symptom, details = {}) {
    if (!crew.some(person => person.id === personId)) throw new Error('Unknown crew member');
    if (details.context && !readingContexts.includes(details.context)) throw new Error('Choose a valid reading context.');
    if (details.glucoseContext && !glucoseContexts.includes(details.glucoseContext)) throw new Error('Choose a valid glucose context.');
    if (symptom && !['none', 'concerning', 'urgent'].includes(symptom)) throw new Error('Choose a valid symptom report.');
    if (details.symptomNote && (typeof details.symptomNote !== 'string' || details.symptomNote.length > 240 || !['concerning', 'urgent'].includes(symptom))) throw new Error('Check the symptom note.');
    if (details.symptomTags != null && (!Array.isArray(details.symptomTags) || details.symptomTags.some(tag => typeof tag !== 'string' || !Object.hasOwn(symptomOptions, tag)))) throw new Error('Choose valid symptoms.');
    if (details.symptomProgression && !symptomProgressions.includes(details.symptomProgression)) throw new Error('Choose a valid symptom change.');
    if ((details.symptomTags?.length || details.symptomOnset || details.symptomProgression) && !['concerning', 'urgent'].includes(symptom)) throw new Error('Choose a symptom report before adding details.');
    for (const [field, choices] of Object.entries(selfReports)) {
      if (details[field] && !choices.includes(details[field])) throw new Error('Choose a valid self-report.');
    }
    const next = structuredClone(readRecords());
    next[personId] ||= {};
    const recordedAt = new Date();
    const measuredAt = details.measuredAt ? new Date(details.measuredAt) : recordedAt;
    if (!Number.isFinite(measuredAt.getTime()) || measuredAt.getTime() > recordedAt.getTime()) throw new Error('Choose a valid time that is not in the future.');
    const time = measuredAt.toISOString();
    let onset = '';
    if (details.symptomOnset) {
      const date = new Date(details.symptomOnset);
      if (!Number.isFinite(date.getTime()) || date.getTime() > measuredAt.getTime()) throw new Error('Symptom onset must be a valid time no later than the observation.');
      onset = date.toISOString();
    }
    let count = 0;
    for (const [field, raw] of Object.entries(values)) {
      const metric = metrics[field];
      if (!metric || raw == null || (typeof raw === 'string' && !raw.trim())) continue;
      let value;
      if (metric.pair) {
        if (raw.systolic === '' && raw.diastolic === '') continue;
        if (raw.systolic === '' || raw.diastolic === '') throw new Error('Enter both blood-pressure values.');
        value = { systolic: Number(raw.systolic), diastolic: Number(raw.diastolic) };
        if (!Number.isFinite(value.systolic) || !Number.isFinite(value.diastolic) || value.systolic < 0 || value.systolic > 400 || value.diastolic < 0 || value.diastolic > 300 || value.systolic <= value.diastolic) throw new Error('Check the blood-pressure values.');
      } else {
        value = Number(raw);
        if (!Number.isFinite(value) || value < metric.min || value > metric.max || (field === 'glucose' && !Number.isInteger(value))) throw new Error(`Check the ${metric.label.toLowerCase()} value.`);
      }
      next[personId][field] ||= [];
      const entry = { value, time, recordedAt: recordedAt.toISOString() };
      if (vitalFields.has(field) && details.context) entry.context = details.context;
      if (field === 'glucose' && details.glucoseContext) entry.context = details.glucoseContext;
      next[personId][field].push(entry);
      count++;
    }
    if (symptom && ['none', 'concerning', 'urgent'].includes(symptom)) {
      next[personId].symptoms ||= [];
      const entry = { value: symptom, time, recordedAt: recordedAt.toISOString() };
      if (details.symptomNote?.trim()) entry.note = details.symptomNote.trim();
      if (details.symptomTags?.length) entry.tags = [...new Set(details.symptomTags)];
      if (onset) entry.onset = onset;
      if (details.symptomProgression) entry.progression = details.symptomProgression;
      next[personId].symptoms.push(entry);
      count++;
    }
    for (const field of Object.keys(selfReports)) {
      if (!details[field]) continue;
      next[personId][field] ||= [];
      next[personId][field].push({ value: details[field], time, recordedAt: recordedAt.toISOString() });
      count++;
    }
    if (!count) throw new Error('Enter a reading or select a self-report.');
    localStorage.setItem(storageKey, JSON.stringify(next));
    records = next;
    refreshStories();
    window.dispatchEvent(new CustomEvent('crewhealth:update'));
  }

  function installCrewSelector(scene) {
    store = scene;
    scene.setBodySelected(selected.model);
    scene.organsList.forEach((item, index) => { item.pickName = categoryNames[index]; });
    const picker = document.createElement('nav');
    picker.className = 'crew-picker';
    picker.setAttribute('aria-label', 'Select a crew member');
    picker.innerHTML = `<span class="crew-picker-label">CREW</span>${crew.map((person, index) => `<button type="button" data-crew="${person.id}" aria-pressed="${index === 0}"><span>${person.name.split(' ')[0]}</span><span class="crew-number">0${index + 1}</span></button>`).join('')}`;
    (document.querySelector('#__nuxt') || document.body).append(picker);
    function syncView() { document.body.dataset.crewView = scene.activeState; }
    syncView();
    scene.$subscribe(syncView);
    picker.addEventListener('click', event => {
      const button = event.target.closest('[data-crew]');
      if (!button) return;
      selectCrew(button.dataset.crew);
    });
  }
  function waitForScene() {
    if (window.__crewScene) installCrewSelector(window.__crewScene);
    else requestAnimationFrame(waitForScene);
  }
  if (!document.documentElement.hasAttribute('data-hub-standalone')) {
    document.addEventListener('DOMContentLoaded', waitForScene, { once: true });
  }
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-health-open]');
    if (open) {
      const form = open.closest('.crew-reference-row')?.nextElementSibling;
      if (form?.matches('[data-health-form]')) { form.hidden = false; form.querySelector('input')?.focus(); }
    }
    const cancel = event.target.closest('[data-health-cancel]');
    if (cancel) {
      const form = cancel.closest('form');
      form.hidden = true;
      form.previousElementSibling?.querySelector('[data-health-open]')?.focus();
    }
  });
  document.addEventListener('submit', event => {
    const form = event.target.closest('[data-health-form]');
    if (!form) return;
    event.preventDefault();
    const field = form.dataset.healthForm;
    const metric = metrics[field];
    if (!metric || !form.reportValidity()) return;
    let value;
    if (metric.pair) {
      value = { systolic: Number(form.elements.systolic.value), diastolic: Number(form.elements.diastolic.value) };
      if (value.systolic <= value.diastolic) {
        form.querySelector('.crew-entry-error').textContent = 'Systolic pressure must be higher than diastolic pressure.';
        return;
      }
    } else {
      value = Number(form.elements.value.value);
      if (!Number.isFinite(value) || value < metric.min || value > metric.max) return;
    }
    const next = structuredClone(readRecords());
    next[selected.id] ||= {};
    next[selected.id][field] ||= [];
    next[selected.id][field].push({ value, time: new Date().toISOString() });
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      records = next;
      refreshStories();
      window.dispatchEvent(new CustomEvent('crewhealth:update'));
    } catch (_) {
      form.querySelector('.crew-entry-error').textContent = 'Could not save on this device.';
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    records = readRecords();
    refreshStories();
    window.dispatchEvent(new CustomEvent('crewhealth:update'));
  });
  window.CrewDesign = { storyData, registerStories, hotspotLabel, crew, metrics, symptomOptions, summary, history, symptomHistory, selectCrew, saveOverview,
    hasProfile: () => Boolean(savedProfile), getProfile: () => savedProfile ? { ...savedProfile } : null, saveProfile };
})();
