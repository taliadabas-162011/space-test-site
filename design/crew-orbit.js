import { createCrewStage } from '/space-test-site/design/crew-motion-stage.js?v=astronaut-6';
import { renderObservationCheckin, renderObservationIdentity, renderObservationOverview, renderObservationProfile, renderObservationMobile, updateObservationCheckin } from '/space-test-site/design/crew-observation-ui.js?v=astronaut-4';
import { renderAnatomyUI, setAnatomyCategory, setAnatomyMetric } from '/space-test-site/design/crew-anatomy-ui.js?v=astronaut-3';
import { renderEmergencyGuide } from '/space-test-site/design/crew-guidance.js?v=astronaut-3';
import { initializeCustomSelects, syncCustomSelects, focusCustomSelect } from '/space-test-site/design/crew-select.js?v=astronaut-3';
import { renderHealthTimeline } from '/space-test-site/design/crew-timeline-ui.js?v=astronaut-4';
import { assessCrewHealth } from '/space-test-site/design/crew-assessment.js?v=astronaut-4';
import { connectCrewSensor } from '/space-test-site/design/crew-device.js?v=astronaut-1';

const { CrewDesign } = window;
const people = CrewDesign.crew;
const hub = document.createElement('main');
hub.className = 'crew-orbit';
hub.dataset.single = 'true';
hub.setAttribute('aria-label', 'Crew health overview');
hub.innerHTML = `<div class="orbit-background" aria-hidden="true"></div><canvas class="orbit-canvas" aria-hidden="true"></canvas>
  <header class="orbit-header"><span class="orbit-brand">CREW <i>/</i> HEALTH</span><div class="orbit-header-right"><span class="orbit-meta">Personal crew profile · entries stay on this device</span><button type="button" data-emergency>Emergency <span aria-hidden="true">↗</span></button></div></header>
  <div class="orbit-intro"><h1 tabindex="-1">Space health</h1><p>One crew member · one personal record</p></div>
  <nav class="orbit-app-nav" aria-label="Health dashboard" hidden><button type="button" data-nav="profile">Profile</button><button type="button" data-nav="device">Link device</button><button type="button" data-nav="today">Readings</button><button type="button" data-nav="history">Calendar &amp; history</button><button type="button" data-nav="guidance">Help &amp; NASA advice</button></nav>
  <div class="orbit-actors">${people.map((person, index) => `<section class="orbit-actor" data-actor="${index}"><button class="orbit-hit" type="button" data-select="${index}" aria-label="Open astronaut health profile"></button><div class="orbit-actor-label"><span>ASTRONAUT PROFILE</span><h2></h2><div class="orbit-actor-status"></div><button type="button" data-record="${index}">Readings today <span aria-hidden="true">↗</span></button></div><div class="orbit-actor-readings"></div></section>`).join('')}</div>
  <div class="orbit-mobile-summary"></div>
  <nav class="orbit-mobile-crew" aria-label="Choose a crew member">${people.map((person, index) => `<button type="button" data-select="${index}">${person.name.split(' ')[0]} <span aria-hidden="true">↗</span></button>`).join('')}</nav>
  <div class="orbit-profile" hidden><button class="orbit-back" type="button" data-all>← Overview</button><div class="orbit-profile-identity"><div class="orbit-profile-name"></div><div class="orbit-profile-actions"><button type="button" data-edit-profile>Edit profile <span aria-hidden="true">↗</span></button><button type="button" data-open-form><span>Record readings today</span><i aria-hidden="true">↗</i></button><button type="button" data-open-history><span>View history</span><i aria-hidden="true">↗</i></button><button type="button" data-anatomy disabled>Preparing anatomy…</button><p class="orbit-anatomy-error" role="alert" hidden></p></div></div><button class="orbit-figure-hit" type="button" data-figure-anatomy aria-label="Explore this astronaut’s anatomy"></button><div class="orbit-scanline" aria-hidden="true"></div><div class="orbit-profile-readings" role="region" aria-label="Health readings" tabindex="0"></div><form class="orbit-form" hidden></form><div class="orbit-anatomy-root" hidden></div><p class="orbit-gesture">Drag to explore the scene</p><nav class="orbit-switch" aria-label="Astronaut"><span class="orbit-position"></span></nav></div>
  <section class="orbit-onboarding" hidden aria-labelledby="profile-setup-title"><div class="orbit-panel-kicker">ASTRONAUT PROFILE</div><h2 id="profile-setup-title">Create your profile</h2><p>Set up the crew member shown in this scene. Your profile and readings stay in this browser.</p><form data-profile-form><label for="profile-name">Name</label><input id="profile-name" name="name" maxlength="48" autocomplete="name" required placeholder="Enter your name"><label for="profile-age">Age <span>Optional</span></label><input id="profile-age" name="age" type="number" min="0" max="120" step="1" inputmode="numeric" placeholder="Age in years"><label for="profile-mass">Body mass <span>kg · optional</span></label><input id="profile-mass" name="bodyMass" type="number" min="0.1" max="400" step="0.1" inputmode="decimal" placeholder="Mass in kilograms"><label for="profile-anatomy">Anatomy model <span>Optional</span></label><select id="profile-anatomy" name="model"><option value="male">Masculine anatomy</option><option value="female">Feminine anatomy</option></select><p class="orbit-profile-error" role="alert"></p><button type="submit">Save profile <span aria-hidden="true">↗</span></button></form><small>This prototype does not create an online account or sync data.</small></div>
  <section class="orbit-section-panel" hidden role="region" aria-label="Dashboard section"><button class="orbit-section-close" type="button" data-section-close>Close <span aria-hidden="true">×</span></button><div class="orbit-section-content"></div></section>
  <div class="orbit-emergency" role="region" aria-label="Emergency guidance" hidden></div>
  <div class="orbit-timeline" role="region" aria-label="Observation history" hidden></div>
  <p class="orbit-loading" role="status">Preparing the crew scene…</p><p class="orbit-failure" role="alert" hidden>Unable to load the 3D crew scene. Please reload to try again.</p>`;
document.body.append(hub);
const canvas = hub.querySelector('canvas');
const profile = hub.querySelector('.orbit-profile');
const form = hub.querySelector('.orbit-form');
const emergency = hub.querySelector('.orbit-emergency');
const timeline = hub.querySelector('.orbit-timeline');
const anatomyButton = hub.querySelector('[data-anatomy]');
const figureButton = hub.querySelector('[data-figure-anatomy]');
const anatomyRoot = hub.querySelector('.orbit-anatomy-root');
const actors = hub.querySelector('.orbit-actors');
const mobileControls = [hub.querySelector('.orbit-mobile-summary'), hub.querySelector('.orbit-mobile-crew')];
const onboarding = hub.querySelector('.orbit-onboarding');
const profileForm = hub.querySelector('[data-profile-form]');
const sectionPanel = hub.querySelector('.orbit-section-panel');
const sectionContent = hub.querySelector('.orbit-section-content');
const appNav = hub.querySelector('.orbit-app-nav');
actors.inert = true;
mobileControls.forEach(item => { item.inert = true; });
let stage;
let selected = null;
let recording = false;
let anatomyMode = false;
let anatomyCategory = 'circulation';
let anatomyMetric = 'pulse';
let anatomyHeartFocused = false;
let anatomyHeartDetail = false;
let pendingAnatomyFocus = '';
let historyReturn = null;
let savingAnatomyField = null;
let anatomyRequest = 0;
let gesture = null;
let suppressFigureClick = false;
let returnFocus = null;
let emergencyStep = 'start';
let selectedReadingDate = new Date().toISOString().slice(0, 10);
const deviceConnections = new Map();
const deviceSaveTimes = new Map();
const metricCategories = { pulse: 'circulation', pressure: 'circulation', oxygen: 'circulation', glucose: 'daily', sleep: 'recovery', exercise: 'recovery', temperature: 'daily', water: 'daily' };

function symptomText(status, brief = false) {
  if (status === 'urgent') return brief ? 'Urgent symptoms reported' : 'Urgent symptoms reported · follow mission emergency procedures';
  if (status === 'concerning') return brief ? 'Symptoms reported' : 'Symptoms reported · review with the medical team';
  if (status === 'none') return 'No symptoms reported';
  return 'No symptoms recorded';
}
function anatomyHistory(personId) {
  return Object.fromEntries(Object.keys(CrewDesign.metrics).map(field => [field, CrewDesign.history(personId, field)]));
}
function renderAnatomy(summary, histories) {
  const drafts = [...anatomyRoot.querySelectorAll('[data-anatomy-form]')].filter(entry => !entry.hidden && entry.dataset.anatomyForm !== savingAnatomyField).map(entry => ({
    field: entry.dataset.anatomyForm,
    values: Object.fromEntries(new FormData(entry)),
    timeOpen: Boolean(entry.querySelector('.crew-anatomy-time')?.open),
    focused: entry.contains(document.activeElement) ? document.activeElement.name : '',
  }));
  anatomyRoot.innerHTML = renderAnatomyUI(summary, anatomyCategory, histories, anatomyMetric);
  anatomyRoot.querySelector('.crew-anatomy').dataset.heartFocused = String(anatomyHeartFocused);
  anatomyRoot.querySelector('.crew-anatomy').dataset.organExpanded = String(anatomyHeartDetail);
  const heartButton = anatomyRoot.querySelector('[data-heart-detail]');
  if (heartButton) {
    heartButton.setAttribute('aria-pressed', String(anatomyHeartDetail));
    heartButton.firstElementChild.textContent = anatomyHeartDetail ? 'Return to body' : 'View heart';
  }
  for (const draft of drafts) {
    const entry = anatomyRoot.querySelector(`[data-anatomy-form="${draft.field}"]`);
    if (!entry) continue;
    for (const [name, value] of Object.entries(draft.values)) if (entry.elements[name]) entry.elements[name].value = value;
    entry.hidden = false;
    entry.querySelector('.crew-anatomy-time').open = draft.timeOpen;
    anatomyRoot.querySelector(`[data-anatomy-edit="${draft.field}"]`)?.setAttribute('aria-expanded', 'true');
    if (draft.focused) entry.elements[draft.focused]?.focus({ preventScroll: true });
  }
  initializeCustomSelects(anatomyRoot);
}
function renderData() {
  people.forEach((person, index) => {
    const summary = CrewDesign.summary(person.id);
    const actor = hub.querySelector(`[data-actor="${index}"]`);
    actor.querySelector('.orbit-actor-label h2').textContent = summary.person.name;
    actor.querySelector('.orbit-hit').setAttribute('aria-label', `Open ${summary.person.name}'s profile`);
    const recordButton = actor.querySelector('[data-record]');
    recordButton.textContent = CrewDesign.hasProfile() ? 'Readings today ↗' : 'Create profile ↗';
    const status = actor.querySelector('.orbit-actor-status');
    status.dataset.status = summary.symptoms;
    status.hidden = !summary.symptoms;
    actor.dataset.hasSymptoms = String(Boolean(summary.symptoms));
    const time = summary.symptomTime && Number.isFinite(Date.parse(summary.symptomTime)) ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(summary.symptomTime)) : '';
    const statusLabel = `${symptomText(summary.symptoms, true)}${time ? ` · ${time}` : ''}`;
    status.textContent = statusLabel;
    if (summary.symptoms === 'urgent') {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.crewEmergency = String(index);
      button.textContent = `${statusLabel} ↗`;
      status.replaceChildren(button);
    }
    actor.querySelector('.orbit-actor-readings').innerHTML = renderObservationOverview(summary);
  });
  const mobile = CrewDesign.summary(people[0].id);
  hub.querySelector('.orbit-mobile-summary').innerHTML = renderObservationMobile(mobile, 0);
  if (selected === null) return;
  const summary = CrewDesign.summary(people[selected].id);
  const pulseHistory = CrewDesign.history(summary.person.id, 'pulse');
  const histories = anatomyHistory(summary.person.id);
  const assessment = assessCrewHealth(summary, histories);
  form.setAttribute('aria-label', `Health check for ${summary.person.name}`);
  updateObservationCheckin(form, summary);
  form.querySelector('select[name="symptoms"] option[value=""]').textContent = summary.symptoms ? 'Keep previous status' : 'Not recorded';
  for (const field of ['mood', 'sleepQuality']) {
    form.querySelector(`select[name="${field}"] option[value=""]`).textContent = summary[field] ? 'Keep previous report' : 'Not recorded';
  }
  figureButton.setAttribute('aria-label', `Explore ${summary.person.name}'s anatomy`);
  const profileInfo = CrewDesign.getProfile() || {};
  const profileDetails = [profileInfo.age !== '' && profileInfo.age != null ? `Age ${escapeHtml(profileInfo.age)}` : '', profileInfo.bodyMass !== '' && profileInfo.bodyMass != null ? `Body mass ${escapeHtml(profileInfo.bodyMass)} kg` : ''].filter(Boolean).join(' · ');
  hub.querySelector('.orbit-profile-name').innerHTML = `${renderObservationIdentity(summary, pulseHistory, assessment)}${profileDetails ? `<p class="orbit-profile-meta">${profileDetails}</p>` : ''}<button type="button" class="orbit-edit-profile" data-edit-profile>Edit profile ↗</button>`;
  hub.querySelector('.orbit-profile-readings').innerHTML = renderObservationProfile(summary, pulseHistory);
  if (anatomyMode) renderAnatomy(summary, histories);
  hub.querySelector('.orbit-position').textContent = '01 / 01';
}
function renderForm() {
  form.innerHTML = renderObservationCheckin();
  initializeCustomSelects(form);
}
function resetForm() {
  form.reset();
  form.querySelectorAll('details').forEach(disclosure => { disclosure.open = false; });
  form.querySelector('.orbit-error').textContent = '';
  form.querySelector('.observation-urgent').hidden = true;
  form.querySelector('.observation-symptom-note').hidden = true;
}
function focusCheckinAction() {
  hub.querySelector('.orbit-profile-actions [data-open-form]')?.focus({ preventScroll: true });
}
renderForm();
renderData();
window.addEventListener('crewhealth:update', () => {
  renderData();
  if (hub.dataset.panel === 'advice') sectionContent.innerHTML = sectionMarkup('advice');
  if (hub.dataset.panel === 'weights') sectionContent.innerHTML = sectionMarkup('weights');
});

function showPerson(index, openForm = false) {
  if (!CrewDesign.hasProfile()) { openOnboarding(false); return; }
  if (!stage || index < 0 || index >= people.length) return;
  if (selected !== index) exitAnatomy();
  selected = index;
  profile.scrollTop = 0;
  hub.dataset.profileScrolled = 'false';
  syncProfileScroll();
  recording = openForm;
  stage.setRecording(recording);
  hub.dataset.recording = String(recording);
  CrewDesign.selectCrew(people[index].id);
  hub.dataset.mode = 'person';
  actors.inert = true;
  hub.dataset.selected = String(index);
  profile.hidden = false;
  form.hidden = !recording;
  hub.querySelector('.orbit-profile-readings').hidden = recording;
  hub.querySelector('[data-open-form]').hidden = recording;
  resetForm();
  stage.focus(index);
  renderData();
  if (recording) setTimeout(() => focusCustomSelect(form.elements.symptoms, { preventScroll: true }), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400);
  else hub.querySelector('.orbit-back').focus({ preventScroll: true });
}
function showOverview(focus = true) {
  if (!stage) return;
  exitAnatomy();
  if (hub.dataset.panel) closeContextPanel(false);
  const previous = selected;
  selected = null;
  recording = false;
  stage.setRecording(false);
  hub.dataset.recording = 'false';
  hub.dataset.mode = 'overview';
  actors.inert = false;
  delete hub.dataset.selected;
  profile.hidden = true;
  profile.scrollTop = 0;
  syncProfileScroll();
  stage.overview();
  if (focus && previous !== null) hub.querySelector(`[data-select="${previous}"]`)?.focus({ preventScroll: true });
}
function syncProfileScroll() {
  const scrolled = profile.scrollTop > 12;
  hub.dataset.profileScrolled = String(scrolled);
  hub.style.setProperty('--profile-scroll', `${profile.scrollTop}px`);
  if (window.innerWidth < 768 && scrolled) stage?.pause();
  else stage?.resume();
}
function closeContextPanel(restoreFocus = true) {
  const previousFocus = returnFocus;
  if (hub.dataset.panel === 'history' || (hub.dataset.panel === 'emergency' && historyReturn)) stage?.setRecordView?.(false);
  if (hub.dataset.panel === 'emergency' && historyReturn && restoreFocus) {
    emergency.hidden = true;
    hub.dataset.panel = 'history';
    timeline.hidden = false;
    stage?.setRecordView?.(true);
    const target = historyReturn;
    historyReturn = null;
    (target?.isConnected ? target : timeline.querySelector('#timeline-title'))?.focus({ preventScroll: true });
    return;
  }
  historyReturn = null;
  emergency.hidden = true;
  timeline.hidden = true;
  sectionPanel.hidden = true;
  delete hub.dataset.panel;
  profile.inert = false;
  actors.inert = !stage || selected !== null;
  mobileControls.forEach(item => { item.inert = !stage || selected !== null; });
  if (selected !== null) stage?.resume();
  if (restoreFocus) (previousFocus?.isConnected ? previousFocus : hub.querySelector('[data-emergency]'))?.focus({ preventScroll: true });
  returnFocus = null;
}
function setContextPanel(panel, source) {
  if (hub.dataset.panel) {
    if (hub.dataset.panel === 'history' || hub.dataset.panel === 'emergency') stage?.setRecordView?.(false);
    emergency.hidden = true;
    timeline.hidden = true;
    sectionPanel.hidden = true;
    delete hub.dataset.panel;
  }
  returnFocus = source;
  hub.dataset.panel = panel;
  profile.inert = true;
  actors.inert = true;
  mobileControls.forEach(item => { item.inert = true; });
  stage?.pause();
}
function showEmergency(source) {
  const previousHistory = hub.dataset.panel === 'history' ? source : null;
  setContextPanel('emergency', source);
  historyReturn = previousHistory;
  emergencyStep = 'start';
  emergency.innerHTML = renderEmergencyGuide({ personName: selected === null ? '' : people[selected].name, step: emergencyStep });
  emergency.hidden = false;
  emergency.querySelector('#emergency-title')?.focus({ preventScroll: true });
}
function showHistory(source) {
  if (selected === null) return;
  setContextPanel('history', source);
  stage?.setRecordView?.(true);
  const personId = people[selected].id;
  timeline.innerHTML = `<label class="orbit-date-picker">Browse a date<input type="date" lang="en" data-history-date value="${new Date().toISOString().slice(0, 10)}" max="${new Date().toISOString().slice(0, 10)}"></label>${renderHealthTimeline(CrewDesign.summary(personId), anatomyHistory(personId), CrewDesign.symptomHistory(personId), CrewDesign.symptomOptions)}`;
  timeline.hidden = false;
  timeline.scrollTop = 0;
  timeline.querySelector('#timeline-title')?.focus({ preventScroll: true });
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function todayRow(reading, label, unit, pressure = false) {
  const recordedToday = reading?.recorded && new Date(reading.time).toDateString() === new Date().toDateString();
  const value = pressure
    ? reading?.recorded ? `${reading.value?.systolic ?? '—'}/${reading.value?.diastolic ?? '—'}` : '—'
    : reading?.recorded ? reading.value : '—';
  const detail = recordedToday
    ? `Recorded ${new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(reading.time))}${reading.context ? ` · ${reading.context === 'rest' ? 'at rest' : reading.context === 'after-activity' ? 'after activity' : reading.context}` : ''}${reading.source ? ` · ${reading.source}` : ''}`
    : reading?.recorded ? 'Last entry was on another day' : 'No reading recorded today';
  return `<div class="orbit-today-row"><span>${label}</span><strong>${escapeHtml(value)} <small>${unit}</small></strong><em>${escapeHtml(detail)}</em></div>`;
}
function readingForDate(personId, field) {
  const rows = CrewDesign.history(personId, field).filter(entry => {
    const date = new Date(entry.time);
    return Number.isFinite(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === selectedReadingDate;
  });
  const entry = rows.at(-1);
  return entry ? { recorded: true, value: entry.value, time: entry.time, context: entry.context, source: entry.source } : null;
}
function deviceRows() {
  const sensors = [
    ['pulse', 'Heart rate', 'A compatible BLE heart-rate sensor can stream readings while connected.'],
    ['pressure', 'Blood pressure', 'Pair a BLE blood-pressure cuff, then take a measurement on the cuff.'],
    ['oxygen', 'Oxygen saturation', 'Pair a BLE pulse oximeter that exposes the Bluetooth SIG spot-check service.'],
    ['glucose', 'Blood glucose', 'A compatible BLE meter can send its latest stored record on connection; many glucose devices do not stream continuously.'],
  ];
  return sensors.map(([field, label, note]) => {
    const session = deviceConnections.get(field);
    const status = session ? `Connected · ${session.device.name || 'sensor'}` : 'Not connected';
    const action = session ? 'Disconnect' : 'Connect device';
    return `<article class="orbit-device-card"><div><strong>${label}</strong><small>${note}</small><em data-device-status="${field}">${escapeHtml(status)}</em></div><button class="orbit-panel-action" type="button" data-device-connect="${field}" aria-pressed="${String(Boolean(session))}">${action}</button></article>`;
  }).join('');
}
function weightMarkup(summary) {
  const history = CrewDesign.history(summary.person.id, 'weight').slice(-12).reverse();
  const rows = history.length ? history.map(entry => `<li><span>${escapeHtml(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.time)))}${entry.source ? ` · ${escapeHtml(entry.source)}` : ''}</span><strong>${escapeHtml(entry.value)} kg</strong></li>`).join('') : '<li class="orbit-empty-history">No body-mass readings recorded yet.</li>';
  return `<p class="orbit-panel-kicker">ASTRONAUT MEASUREMENTS</p><h2 id="section-title">Body mass</h2><p class="orbit-section-lede">Record mass from the mission’s approved in-flight measuring device. In microgravity, an ordinary Earth scale does not measure body mass reliably.</p><form class="orbit-weight-form" data-weight-form><label for="body-mass-value">Measured body mass <small>kg</small></label><input id="body-mass-value" name="weight" type="number" min="0" max="400" step="0.1" inputmode="decimal" required placeholder="Enter measured mass"><label for="body-mass-time">Measurement time <small>Optional</small></label><input id="body-mass-time" name="measuredAt" type="datetime-local"><p class="orbit-profile-error" role="alert"></p><button class="orbit-panel-action" type="submit">Save this reading <span aria-hidden="true">↗</span></button></form><div class="orbit-weight-history"><h3>Mass history</h3><ol>${rows}</ol></div><p class="orbit-local-note">NASA describes using the Space Linear Acceleration Mass Measurement Device (SLAMMD) to measure body mass in flight.</p><a class="orbit-source-link" href="https://www.nasa.gov/wp-content/uploads/2024/10/2024-space-nutrition-2nd-edition-2024.pdf" target="_blank" rel="noopener noreferrer">NASA space nutrition research ↗</a>`;
}
function adviceMarkup(summary, histories) {
  const assessment = assessCrewHealth(summary, histories);
  const recorded = Object.entries(CrewDesign.metrics).filter(([field]) => summary[field]?.recorded).map(([field, metric]) => {
    const reading = summary[field];
    const value = field === 'pressure' ? `${reading.value.systolic}/${reading.value.diastolic}` : reading.value;
    const when = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(reading.time));
    return `<li><strong>${escapeHtml(metric.label)}:</strong> ${escapeHtml(value)} ${escapeHtml(metric.unit)} · ${escapeHtml(when)}${reading.source ? ` · ${escapeHtml(reading.source)}` : ''}</li>`;
  }).join('');
  const status = assessment.priority === 'urgent'
    ? '<div class="orbit-advice-alert" data-priority="urgent"><strong>Urgent symptoms were recorded.</strong><p>Alert a crew member and follow the mission emergency procedure now.</p></div>'
    : assessment.priority === 'attention'
      ? '<div class="orbit-advice-alert" data-priority="attention"><strong>Symptoms were recorded.</strong><p>Review them with the flight medical team and follow mission procedures.</p></div>'
      : `<div class="orbit-advice-alert"><strong>${escapeHtml(assessment.title)}</strong><p>${escapeHtml(assessment.explanation)} ${escapeHtml(assessment.nextAction)}</p></div>`;
  return `<p class="orbit-panel-kicker">NASA-BASED HEALTH GUIDANCE</p><h2 id="section-title">Feedback &amp; advice</h2><p class="orbit-section-lede">A combined review of saved observations and NASA spaceflight research. This educational prototype does not diagnose or apply Earth-based “normal” cutoffs to astronauts.</p>${status}<section class="orbit-research-card"><h3>Latest saved readings</h3>${recorded ? `<ul class="orbit-advice-readings">${recorded}</ul>` : '<p>No readings have been saved yet. Save readings to see them summarized here.</p>'}</section><section class="orbit-research-card"><h3>NASA research and next steps</h3><p>NASA describes fluid shifts toward the head and cardiovascular adaptation in microgravity. Record the astronaut’s own baseline and whether each measurement was taken at rest or after activity; follow mission medical limits.</p><p>Oxygen readings depend on the sensor and mission environment. Use the flight medical procedure to interpret them. NASA’s public sources do not set one universal in-flight healthy range for heart rate, blood pressure, oxygen saturation, glucose, or body mass for every astronaut.</p><p>For this prototype, compare trends over time and share unusual changes or symptoms with the flight medical team. For urgent symptoms, follow mission emergency procedures.</p><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/cardiovascular-and-vision/" target="_blank" rel="noopener noreferrer">NASA cardiovascular research ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-hypoxia/" target="_blank" rel="noopener noreferrer">NASA hypoxia research ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/treat/medical-examination-requirements-mer-for-former-astronauts/" target="_blank" rel="noopener noreferrer">NASA astronaut medical surveillance ↗</a></section><section class="orbit-research-card"><h3>Send feedback on this dashboard</h3><p>Your note helps improve how the readings and NASA research are presented.</p><form class="orbit-feedback-form" data-feedback-form><label for="feedback-rating">How useful is this dashboard?</label><select id="feedback-rating" name="rating"><option value="">Choose a rating</option><option value="5">5 · Very useful</option><option value="4">4 · Useful</option><option value="3">3 · Not sure</option><option value="2">2 · Needs work</option><option value="1">1 · Not useful</option></select><label for="feedback-message">Your feedback</label><textarea id="feedback-message" name="message" rows="4" maxlength="800" required placeholder="Write a few notes"></textarea><p class="orbit-feedback-confirmation" role="status"></p><button class="orbit-panel-action" type="submit">Save feedback</button></form><p class="orbit-local-note">Feedback stays in this browser; it is not sent to NASA or anyone else.</p></section>`;
}
function deviceMessage(text, error = false) {
  const element = sectionContent.querySelector('[data-device-message]');
  if (!element) return;
  element.textContent = text;
  element.dataset.error = String(error);
}
function refreshDeviceRows() {
  sectionContent.querySelectorAll('[data-device-connect]').forEach(button => {
    const session = deviceConnections.get(button.dataset.deviceConnect);
    button.textContent = session ? 'Disconnect' : 'Connect device';
    button.setAttribute('aria-pressed', String(Boolean(session)));
    const status = sectionContent.querySelector(`[data-device-status="${button.dataset.deviceConnect}"]`);
    if (status) status.textContent = session ? `Connected · ${session.device.name || 'sensor'}` : 'Not connected';
  });
}
async function toggleDevice(field, button) {
  const existing = deviceConnections.get(field);
  if (existing) { existing.disconnect(); deviceConnections.delete(field); refreshDeviceRows(); return; }
  button.disabled = true;
  deviceMessage('Waiting for device selection…');
  try {
    const session = await connectCrewSensor(field, {
      onStatus: text => deviceMessage(text),
      onDisconnect: name => {
        deviceConnections.delete(field);
        refreshDeviceRows();
        deviceMessage(`${name} disconnected. Readings already saved remain in this browser.`);
      },
      onReading: reading => {
        const now = Date.now();
        const interval = field === 'pulse' ? 15000 : field === 'oxygen' ? 30000 : 0;
        if (interval && now - (deviceSaveTimes.get(field) || 0) < interval) return;
        try {
          const details = { measuredAt: reading.time, source: `Bluetooth · ${reading.deviceName}` };
          if (field === 'pulse' || field === 'pressure' || field === 'oxygen') details.context = 'other';
          if (field === 'glucose') { details.glucoseContext = 'other'; details.deviceSequence = reading.sequence; }
          CrewDesign.saveOverview(people[0].id, { [field]: reading.value }, '', details);
          deviceSaveTimes.set(field, now);
          deviceMessage(`${CrewDesign.metrics[field].label} saved automatically from ${reading.deviceName}.`);
        } catch (error) {
          deviceMessage(error.message || 'The device reading could not be saved on this device.', true);
        }
      },
    });
    deviceConnections.set(field, session);
    refreshDeviceRows();
  } catch (error) {
    const cancelled = error?.name === 'NotFoundError';
    deviceMessage(cancelled ? 'Device selection was cancelled.' : error.message || 'Could not connect to that sensor. Check that it supports the listed Bluetooth service.', !cancelled);
  } finally {
    button.disabled = false;
    refreshDeviceRows();
  }
}
function sectionMarkup(section) {
  const summary = CrewDesign.summary(people[0].id);
  const name = escapeHtml(summary.person.name);
  if (section === 'today') return `<p class="orbit-panel-kicker">MISSION HEALTH / READINGS</p><h2 id="section-title">Readings</h2><p class="orbit-section-lede">Select the observation date first, then review each measurement. Saved values appear in Calendar &amp; history.</p><label class="orbit-date-picker">Reading date<input type="date" lang="en" data-reading-date value="${selectedReadingDate}" max="${new Date().toISOString().slice(0, 10)}"></label><div class="orbit-today-list">${todayRow(readingForDate(summary.person.id, 'pulse'), 'Heart rate', 'bpm')}${todayRow(readingForDate(summary.person.id, 'oxygen'), 'Oxygen saturation', '%')}${todayRow(readingForDate(summary.person.id, 'pressure'), 'Blood pressure', 'mmHg', true)}${todayRow(readingForDate(summary.person.id, 'glucose'), 'Blood glucose', 'mg/dL')}${todayRow(readingForDate(summary.person.id, 'weight'), 'Body mass', 'kg')}${todayRow(readingForDate(summary.person.id, 'temperature'), 'Temperature', '°C')}</div><button class="orbit-panel-action" type="button" data-today-record>Enter readings for selected date <span aria-hidden="true">↗</span></button><p class="orbit-local-note">Entries from a linked sensor appear here and in Calendar &amp; history automatically.</p>`;
  if (section === 'device') return `<p class="orbit-panel-kicker">SENSOR CONNECTION</p><h2 id="section-title">Link a device</h2><p class="orbit-section-lede">Connect a compatible sensor first. New readings are saved to this astronaut’s history while this page stays open.</p><div class="orbit-device-list">${deviceRows()}</div><p class="orbit-device-message" data-device-message role="status">Choose Connect device to open your browser’s sensor picker.</p><details class="orbit-device-help" open><summary>Device compatibility</summary><p><strong>Heart rate:</strong> Some BLE heart-rate straps support direct streaming.</p><p><strong>Blood pressure and oxygen:</strong> Some cuffs and pulse oximeters work if they expose the standard Bluetooth service. You must take a reading on the device.</p><p><strong>Diabetes sensors:</strong> Most CGMs send readings to the manufacturer’s phone app or cloud, and use private protocols. Direct connection here needs the maker’s approved API and a secure server; this static site cannot connect to most CGMs. A compatible Bluetooth glucose meter may share a stored reading.</p><p>Pairing requires a supported browser, HTTPS, and your permission. Readings are saved on this device only; this page cannot collect in the background.</p></details><a class="orbit-source-link" href="https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/" target="_blank" rel="noopener noreferrer">NASA wearable monitoring research ↗</a>`;
  if (section === 'research') return `<p class="orbit-panel-kicker">SPACEFLIGHT HEALTH / NASA RESEARCH</p><h2 id="section-title">What changes in space?</h2><p class="orbit-section-lede">According to NASA research, readings depend on the individual astronaut, mission phase, environment, and flight medical procedure.</p><article class="orbit-research-card"><h3>Heart and circulation</h3><p>NASA describes body fluids shifting toward the head in microgravity and cardiovascular adaptation. Some astronauts experience dizziness or fainting after return to gravity; NASA uses clinical monitoring and mission-specific procedures.</p><p class="orbit-research-note">NASA’s public research does not give one universal in-flight “healthy astronaut” range for heart rate, blood pressure, or oxygen saturation for this dashboard. Use the astronaut’s baseline and mission-approved limits.</p><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/cardiovascular-and-vision/" target="_blank" rel="noopener noreferrer">NASA cardiovascular monitoring ↗</a></article><article class="orbit-research-card"><h3>Oxygen and wearable measurements</h3><p>NASA studies hypoxia risk in mission and spacesuit scenarios. NASA and partner research has used wearable sensors to monitor heart activity, breathing, sleep, and oxygen-related measurements; each device and mission protocol determines what is measured.</p><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-hypoxia/" target="_blank" rel="noopener noreferrer">NASA hypoxia research ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/" target="_blank" rel="noopener noreferrer">NASA wearable research ↗</a></article><article class="orbit-research-card"><h3>Glucose</h3><p>NASA’s astronaut medical surveillance includes laboratory fasting blood glucose and HbA1c testing. That public schedule is not an in-flight glucose target; interpret a sensor reading with its units, timing, individual medical plan, and flight medical team.</p><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/treat/medical-examination-requirements-mer-for-former-astronauts/" target="_blank" rel="noopener noreferrer">NASA medical surveillance ↗</a></article><article class="orbit-research-card"><h3>Body mass</h3><p>NASA explains that mass is measured in flight using equipment such as SLAMMD, because a conventional scale relies on gravity. Compare body-mass records taken with the approved mission device.</p><a class="orbit-source-link" href="https://www.nasa.gov/wp-content/uploads/2024/10/2024-space-nutrition-2nd-edition-2024.pdf" target="_blank" rel="noopener noreferrer">NASA space nutrition research ↗</a></article><article class="orbit-research-card"><h3>Radiation</h3><p>NASA tracks space radiation with dedicated monitoring and dosimetry. A heart-rate or oxygen sensor cannot tell radiation dose; NASA describes long-term health risks that depend on exposure and mission context.</p><a class="orbit-source-link" href="https://www.nasa.gov/hrp/hazard-space-radiation/" target="_blank" rel="noopener noreferrer">NASA space-radiation research ↗</a></article><article class="orbit-research-card"><h3>Bone and muscle</h3><p>NASA reports average bone-density loss of about 1%–1.5% per month in weight-bearing bones during four-to-six-month missions. Rates vary; NASA uses exercise countermeasures and bone scans to monitor changes.</p><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/" target="_blank" rel="noopener noreferrer">NASA bone-health research ↗</a></article><p class="orbit-local-note">This is an educational summary of public NASA research. Follow the flight medical procedure for personal interpretation and care.</p>`;
  if (section === 'guidance') return adviceMarkup(summary, anatomyHistory(summary.person.id));
  return '';
}
function showSection(section, source) {
  if (!CrewDesign.hasProfile()) { openOnboarding(false); return; }
  setContextPanel(section, source);
  sectionContent.innerHTML = sectionMarkup(section);
  sectionPanel.setAttribute('aria-label', section === 'research' ? 'NASA spaceflight health research' : section === 'device' ? 'Link a health device' : section);
  sectionPanel.hidden = false;
  sectionPanel.scrollTop = 0;
  sectionContent.querySelector('#section-title')?.focus({ preventScroll: true });
}
function openOnboarding(edit = false) {
  const existing = CrewDesign.getProfile();
  profileForm.elements.name.value = existing?.name || '';
  profileForm.elements.age.value = existing?.age ?? '';
  profileForm.elements.bodyMass.value = existing?.bodyMass ?? '';
  profileForm.elements.model.value = existing?.model || 'male';
  profileForm.querySelector('.orbit-profile-error').textContent = '';
  hub.querySelector('#profile-setup-title').textContent = edit ? 'Edit your profile' : 'Create your profile';
  profileForm.querySelector('button[type="submit"]').innerHTML = edit ? 'Save changes <span aria-hidden="true">↗</span>' : 'Save profile <span aria-hidden="true">↗</span>';
  onboarding.hidden = false;
  profileForm.elements.name.focus({ preventScroll: true });
}
profileForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!profileForm.reportValidity()) return;
  try {
    const prior = CrewDesign.getProfile();
    CrewDesign.saveProfile(profileForm.elements.name.value, profileForm.elements.model.value, profileForm.elements.age.value, profileForm.elements.bodyMass.value);
    const mass = profileForm.elements.bodyMass.value;
    if (mass && Number(mass) > 0 && String(prior?.bodyMass ?? '') !== String(mass)) CrewDesign.saveOverview(people[0].id, { weight: mass }, '', { source: 'Profile body mass' });
    onboarding.hidden = true;
    appNav.hidden = false;
    renderData();
    if (selected === null) showPerson(0);
  } catch (error) {
    profileForm.querySelector('.orbit-profile-error').textContent = error.message || 'Could not save this profile on the device.';
  }
});
profile.addEventListener('scroll', syncProfileScroll, { passive: true });
window.addEventListener('resize', syncProfileScroll, { passive: true });
hub.addEventListener('pointerdown', event => {
  const control = event.target.closest('button,input,select,form');
  if (people.length < 2 || hub.dataset.panel || selected === null || recording || anatomyMode || event.button !== 0 || !stage?.beginDrag || (control && control !== figureButton)) return;
  gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
  stage.beginDrag();
});
hub.addEventListener('pointermove', event => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
    gesture.dragging = true;
    hub.setPointerCapture(event.pointerId);
  }
  if (gesture.dragging) stage.dragTo(dx / Math.max(1, hub.clientWidth));
});
function endGesture(event) {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const dragging = gesture.dragging;
  gesture = null;
  const next = stage.endDrag();
  if (dragging) {
    suppressFigureClick = true;
    setTimeout(() => { suppressFigureClick = false; }, 0);
    if (Number.isInteger(next)) showPerson(next);
  }
}
hub.addEventListener('pointerup', endGesture);
hub.addEventListener('pointercancel', endGesture);
hub.addEventListener('wheel', event => {
  if (hub.dataset.panel || selected === null || recording || anatomyMode || innerWidth < 768 || !stage?.scrubBy || event.target.closest('form, .orbit-profile-readings')) return;
  stage.scrubBy(event.deltaY * (event.deltaMode === 1 ? 16 : 1));
  event.preventDefault();
}, { passive: false });
hub.addEventListener('click', event => {
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    const section = nav.dataset.nav;
    if (!CrewDesign.hasProfile()) { openOnboarding(false); return; }
    if (section === 'profile') { if (hub.dataset.panel) closeContextPanel(false); showOverview(); return; }
    if (section === 'history') { if (selected === null) showPerson(0); showHistory(nav); return; }
    if (section === 'weights') section = 'today';
    if (section === 'advice' || section === 'research' || section === 'feedback') section = 'guidance';
    showSection(section, nav);
    return;
  }
  if (event.target.closest('[data-section-close]')) { closeContextPanel(); return; }
  if (event.target.closest('[data-today-record]')) {
    selectedReadingDate = sectionContent.querySelector('[data-reading-date]')?.value || selectedReadingDate;
    closeContextPanel(false);
    showPerson(0, true);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    form.elements.measuredAt.value = `${selectedReadingDate}T${time}`;
    form.querySelector('.observation-time').open = true;
    return;
  }
  const deviceButton = event.target.closest('[data-device-connect]');
  if (deviceButton) { toggleDevice(deviceButton.dataset.deviceConnect, deviceButton); return; }
  if (event.target.closest('[data-device-plan]')) {
    const flow = sectionContent.querySelector('[data-device-flow]');
    if (flow) { flow.hidden = !flow.hidden; event.target.closest('[data-device-plan]').setAttribute('aria-expanded', String(!flow.hidden)); }
    return;
  }
  if (event.target.closest('[data-edit-profile]')) { openOnboarding(true); return; }
  const crewEmergency = event.target.closest('[data-crew-emergency]');
  if (crewEmergency) {
    showPerson(Number(crewEmergency.dataset.crewEmergency));
    showEmergency(hub.querySelector('[data-next-action="emergency"]'));
    return;
  }
  const emergencyTrigger = event.target.closest('[data-emergency]');
  if (emergencyTrigger) { showEmergency(emergencyTrigger); return; }
  if (event.target.closest('[data-emergency-close], [data-timeline-close]')) { closeContextPanel(); return; }
  const historyTrigger = event.target.closest('[data-open-history]');
  if (historyTrigger) { showHistory(historyTrigger); return; }
  if (event.target.closest('[data-timeline-record]')) {
    closeContextPanel(false);
    hub.querySelector('.orbit-profile-actions [data-open-form]')?.click();
    return;
  }
  const repeatMeasure = event.target.closest('[data-timeline-measure]');
  const repeatWeight = event.target.closest('[data-timeline-weight]');
  if (repeatWeight) { closeContextPanel(false); showSection('weights', repeatWeight); return; }
  if (repeatMeasure && metricCategories[repeatMeasure.dataset.timelineMeasure]) {
    const field = repeatMeasure.dataset.timelineMeasure;
    closeContextPanel(false);
    enterAnatomy(metricCategories[field], field, true);
    return;
  }
  const emergencyChoice = event.target.closest('[data-emergency-step]');
  if (emergencyChoice) {
    emergencyStep = emergencyChoice.dataset.emergencyStep;
    emergency.innerHTML = renderEmergencyGuide({ personName: selected === null ? '' : people[selected].name, step: emergencyStep });
    emergency.scrollTop = 0;
    emergency.querySelector('#emergency-title')?.focus({ preventScroll: true });
    return;
  }
  const nextAction = event.target.closest('[data-next-action="emergency"]');
  if (nextAction) { showEmergency(nextAction); return; }
  const select = event.target.closest('[data-select]');
  const record = event.target.closest('[data-record]');
  const exploreMeasure = event.target.closest('[data-explore-measure]');
  if (exploreMeasure && metricCategories[exploreMeasure.dataset.exploreMeasure]) {
    enterAnatomy(metricCategories[exploreMeasure.dataset.exploreMeasure], exploreMeasure.dataset.exploreMeasure);
    return;
  }
  if (select) showPerson(Number(select.dataset.select));
  if (record) {
    if (!CrewDesign.hasProfile()) openOnboarding(false);
    else if (record.closest('.orbit-mobile-summary')) showSection('today', record);
    else showPerson(Number(record.dataset.record), true);
  }
  if (event.target.closest('[data-all]')) showOverview();
  if (event.target.closest('[data-previous]')) showPerson((selected + people.length - 1) % people.length);
  if (event.target.closest('[data-next]')) showPerson((selected + 1) % people.length);
  if (event.target.closest('[data-open-form]')) {
    if (!anatomyMode) exitAnatomy();
    profile.scrollTop = 0;
    syncProfileScroll();
    recording = true;
    stage.setRecording(true);
    hub.dataset.recording = 'true';
    resetForm();
    form.hidden = false;
    hub.querySelector('.orbit-profile-readings').hidden = true;
    hub.querySelector('[data-open-form]').hidden = true;
    focusCustomSelect(form.elements.symptoms, { preventScroll: true });
  }
  if (event.target.closest('[data-cancel]')) {
    recording = false;
    stage.setRecording(false);
    hub.dataset.recording = 'false';
    form.hidden = true;
    hub.querySelector('.orbit-profile-readings').hidden = false;
    hub.querySelector('[data-open-form]').hidden = false;
    profile.scrollTop = 0;
    syncProfileScroll();
    focusCheckinAction();
  }
  if (event.target.closest('button[data-anatomy], button[data-figure-anatomy]') && !suppressFigureClick) enterAnatomy();
  if (event.target.closest('[data-anatomy-exit]')) exitAnatomy();
  const category = event.target.closest('[data-anatomy-category]');
  if (category) {
    anatomyCategory = category.dataset.anatomyCategory;
    const root = anatomyRoot.querySelector('.crew-anatomy');
    setAnatomyCategory(root, anatomyCategory);
    anatomyMetric = root.dataset.metric;
    if (anatomyHeartDetail) stage?.focusHeartDetail?.(false);
    anatomyHeartDetail = false;
    root.dataset.organExpanded = 'false';
    anatomyHeartFocused = anatomyCategory === 'circulation';
    root.dataset.heartFocused = String(anatomyHeartFocused);
    stage?.focusAnatomyRegion?.(anatomyCategory);
  }
  const heartDetail = event.target.closest('button[data-heart-detail]');
  if (heartDetail) {
    if (!anatomyHeartFocused) {
      stage?.focusAnatomyRegion?.('circulation');
      anatomyHeartFocused = true;
    }
    const next = !anatomyHeartDetail;
    if (stage?.focusHeartDetail?.(next)) {
      anatomyHeartDetail = next;
      const root = anatomyRoot.querySelector('.crew-anatomy');
      root.dataset.heartFocused = 'true';
      root.dataset.organExpanded = String(next);
      heartDetail.setAttribute('aria-pressed', String(next));
      heartDetail.firstElementChild.textContent = next ? 'Return to body' : 'View heart';
    }
    return;
  }
  const metric = event.target.closest('[data-anatomy-metric-select]');
  if (metric && setAnatomyMetric(anatomyRoot.querySelector('.crew-anatomy'), metric.dataset.anatomyMetricSelect)) anatomyMetric = metric.dataset.anatomyMetricSelect;
  const edit = event.target.closest('[data-anatomy-edit]');
  if (edit) {
    const entry = anatomyRoot.querySelector(`[data-anatomy-form="${edit.dataset.anatomyEdit}"]`);
    if (entry) {
      entry.hidden = !entry.hidden;
      edit.setAttribute('aria-expanded', String(!entry.hidden));
      if (!entry.hidden) entry.querySelector('input')?.focus({ preventScroll: false });
    }
  }
  const cancelEntry = event.target.closest('[data-anatomy-cancel]');
  if (cancelEntry) {
    const entry = cancelEntry.closest('form');
    entry.reset();
    entry.querySelector('.crew-anatomy-form-error').textContent = '';
    entry.hidden = true;
    const button = anatomyRoot.querySelector(`[data-anatomy-edit="${entry.dataset.anatomyForm}"]`);
    button?.setAttribute('aria-expanded', 'false');
    button?.focus({ preventScroll: true });
  }
});
form.addEventListener('invalid', event => {
  const disclosure = event.target.closest('details');
  if (disclosure) disclosure.open = true;
}, true);
const urgentSymptomTags = new Set(['chest-pain', 'breathing-difficulty', 'fainting', 'new-weakness', 'speech-vision-change']);
form.addEventListener('change', event => {
  if (event.target.name !== 'symptoms' && event.target.name !== 'symptomTags') return;
  const status = form.elements.symptoms;
  const details = form.querySelector('.observation-symptom-note');
  if (event.target.name === 'symptoms' && !['concerning', 'urgent'].includes(status.value)) {
    details.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
    for (const name of ['symptomNote', 'symptomOnset', 'symptomProgression']) form.elements[name].value = '';
  }
  const selectedFlags = [...details.querySelectorAll('input[name="symptomTags"]:checked')].some(input => urgentSymptomTags.has(input.value));
  if (selectedFlags) status.value = 'urgent';
  details.hidden = !['concerning', 'urgent'].includes(status.value);
  form.querySelector('.observation-urgent').hidden = status.value !== 'urgent';
  syncCustomSelects(form);
});
hub.addEventListener('change', event => {
  if (event.target.matches('[data-reading-date]')) {
    selectedReadingDate = event.target.value || selectedReadingDate;
    const personId = people[0].id;
    const list = sectionContent.querySelector('.orbit-today-list');
    if (list) list.innerHTML = `${todayRow(readingForDate(personId, 'pulse'), 'Heart rate', 'bpm')}${todayRow(readingForDate(personId, 'oxygen'), 'Oxygen saturation', '%')}${todayRow(readingForDate(personId, 'pressure'), 'Blood pressure', 'mmHg', true)}${todayRow(readingForDate(personId, 'glucose'), 'Blood glucose', 'mg/dL')}${todayRow(readingForDate(personId, 'weight'), 'Body mass', 'kg')}${todayRow(readingForDate(personId, 'temperature'), 'Temperature', '°C')}`;
  }
  if (event.target.matches('[data-history-date]')) {
    const day = event.target.value;
    const entries = timeline.querySelectorAll('.timeline-entry');
    let visible = 0;
    entries.forEach(entry => {
      const timestamp = entry.querySelector('time')?.dateTime;
      const matches = !day || (timestamp && new Date(timestamp).toISOString().slice(0, 10) === day);
      entry.hidden = !matches;
      if (matches) visible++;
    });
    timeline.querySelector('.timeline-date-empty')?.remove();
    if (!visible) timeline.querySelector('.timeline-list')?.insertAdjacentHTML('afterend', '<p class="timeline-date-empty">No readings are saved for this date.</p>');
  }
});
hub.addEventListener('submit', event => {
  const feedback = event.target.closest('[data-feedback-form]');
  if (feedback) {
    event.preventDefault();
    if (!feedback.reportValidity()) return;
    const confirmation = feedback.querySelector('.orbit-feedback-confirmation');
    try {
      const saved = JSON.parse(localStorage.getItem('crew-health-feedback-v1') || '[]');
      saved.push({ rating: feedback.elements.rating.value, message: feedback.elements.message.value.trim(), time: new Date().toISOString() });
      localStorage.setItem('crew-health-feedback-v1', JSON.stringify(saved.slice(-20)));
      confirmation.textContent = 'Thank you. Your feedback was saved in this browser; it was not sent.';
      feedback.reset();
    } catch (_) { confirmation.textContent = 'Feedback could not be saved on this device.'; }
    return;
  }
  const weightForm = event.target.closest('[data-weight-form]');
  if (weightForm) {
    event.preventDefault();
    if (!weightForm.reportValidity()) return;
    try {
      CrewDesign.saveOverview(people[0].id, { weight: weightForm.elements.weight.value }, '', {
        measuredAt: weightForm.elements.measuredAt.value,
        source: 'Manual entry',
      });
    } catch (error) {
      const message = sectionContent.querySelector('[data-weight-form] .orbit-profile-error');
      if (message) message.textContent = error.message || 'Could not save this mass reading.';
    }
    return;
  }
  const entry = event.target.closest('[data-anatomy-form]');
  if (entry && selected !== null) {
    event.preventDefault();
    const field = entry.dataset.anatomyForm;
    if (!metricCategories[field] || !entry.reportValidity()) return;
    const value = field === 'pressure' ? { systolic: entry.elements.systolic.value, diastolic: entry.elements.diastolic.value } : entry.elements.value.value;
    try {
      savingAnatomyField = field;
      CrewDesign.saveOverview(people[selected].id, { [field]: value }, '', { context: entry.elements.context?.value || '', glucoseContext: entry.elements.glucoseContext?.value || '', measuredAt: entry.elements.measuredAt.value });
      anatomyRoot.querySelector(`[data-anatomy-edit="${field}"]`)?.focus({ preventScroll: true });
    } catch (error) { entry.querySelector('.crew-anatomy-form-error').textContent = error.message || 'Could not save on this device.'; }
    finally { savingAnatomyField = null; }
    return;
  }
  if (event.target !== form || selected === null) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  try {
    const values = Object.fromEntries(['pulse', 'oxygen', 'glucose', 'weight', 'sleep', 'water', 'temperature', 'exercise'].map(field => [field, form.elements[field].value]));
    values.pressure = { systolic: form.elements.systolic.value, diastolic: form.elements.diastolic.value };
    CrewDesign.saveOverview(people[selected].id, values, form.elements.symptoms.value, {
      context: form.elements.context.value,
      glucoseContext: form.elements.glucoseContext.value,
      symptomTags: new FormData(form).getAll('symptomTags'),
      symptomOnset: form.elements.symptomOnset.value,
      symptomProgression: form.elements.symptomProgression.value,
      mood: form.elements.mood.value,
      sleepQuality: form.elements.sleepQuality.value,
      symptomNote: form.elements.symptomNote.value,
      measuredAt: form.elements.measuredAt.value,
    });
    recording = false;
    stage.setRecording(false);
    hub.dataset.recording = 'false';
    form.hidden = true;
    hub.querySelector('.orbit-profile-readings').hidden = false;
    hub.querySelector('[data-open-form]').hidden = false;
    profile.scrollTop = 0;
    syncProfileScroll();
    focusCheckinAction();
  } catch (error) { form.querySelector('.orbit-error').textContent = error.message || 'Could not save on this device.'; }
});
document.addEventListener('keydown', event => {
  if (hub.dataset.panel) {
    if (event.key === 'Escape') { event.preventDefault(); closeContextPanel(); }
    return;
  }
  if (hub.hidden || selected === null) return;
  if (event.key === 'Escape') { if (recording) hub.querySelector('[data-cancel]').click(); else if (anatomyMode) exitAnatomy(); else showOverview(); }
  if (anatomyMode || event.target.closest('.orbit-profile-readings')) return;
  if (!recording && event.key === 'ArrowLeft') showPerson((selected + people.length - 1) % people.length);
  if (!recording && event.key === 'ArrowRight') showPerson((selected + 1) % people.length);
  if (!recording && event.key === 'ArrowDown') { stage?.scrubBy?.(200); event.preventDefault(); }
  if (!recording && event.key === 'ArrowUp') { stage?.scrubBy?.(-200); event.preventDefault(); }
});
async function enterAnatomy(category = 'circulation', metric = '', edit = false) {
  if (!stage?.setAnatomy || selected === null || recording || anatomyMode) return;
  profile.scrollTop = 0;
  syncProfileScroll();
  const current = selected;
  const request = ++anatomyRequest;
  anatomyButton.disabled = true;
  figureButton.disabled = true;
  anatomyButton.textContent = 'Preparing anatomy…';
  hub.querySelector('.orbit-anatomy-error').hidden = true;
  try {
    const opened = await stage.setAnatomy(true, people[current].model);
    if (!opened || request !== anatomyRequest || selected !== current || recording) return;
    anatomyMode = true;
    anatomyCategory = ['circulation', 'recovery', 'daily'].includes(category) ? category : 'circulation';
    anatomyMetric = metricCategories[metric] === anatomyCategory ? metric : { circulation: 'pulse', recovery: 'sleep', daily: 'temperature' }[anatomyCategory];
    hub.dataset.anatomy = 'true';
    anatomyRoot.hidden = false;
    anatomyHeartFocused = Boolean(metric && anatomyCategory === 'circulation');
    anatomyHeartDetail = false;
    anatomyRoot.innerHTML = renderAnatomyUI(CrewDesign.summary(people[current].id), anatomyCategory, anatomyHistory(people[current].id), anatomyMetric);
    anatomyRoot.querySelector('.crew-anatomy').dataset.heartFocused = String(anatomyHeartFocused);
    initializeCustomSelects(anatomyRoot);
    if (metric) stage.focusAnatomyRegion?.(anatomyCategory);
    if (edit) {
      const entry = anatomyRoot.querySelector(`[data-anatomy-form="${anatomyMetric}"]`);
      if (entry) {
        entry.hidden = false;
        anatomyRoot.querySelector(`[data-anatomy-edit="${anatomyMetric}"]`)?.setAttribute('aria-expanded', 'true');
        pendingAnatomyFocus = anatomyMetric;
      }
    } else anatomyRoot.querySelector('[data-anatomy-exit]')?.focus({ preventScroll: true });
  } catch (error) {
    if (request === anatomyRequest && selected === current) {
      const message = hub.querySelector('.orbit-anatomy-error');
      message.textContent = 'Anatomy could not be loaded. Please try again.';
      message.hidden = false;
      console.error('Anatomy failed:', error);
    }
  } finally {
    if (request === anatomyRequest) {
      anatomyButton.disabled = false;
      figureButton.disabled = false;
      anatomyButton.innerHTML = '<span>Explore anatomy</span><i aria-hidden="true">↗</i>';
    }
  }
}
function exitAnatomy() {
  const wasOpen = anatomyMode;
  anatomyRequest++;
  stage?.setAnatomy?.(false);
  anatomyMode = false;
  anatomyHeartFocused = false;
  anatomyHeartDetail = false;
  pendingAnatomyFocus = '';
  hub.dataset.anatomy = 'false';
  anatomyRoot.hidden = true;
  const available = typeof stage?.setAnatomy === 'function';
  anatomyButton.disabled = !available;
  figureButton.disabled = !available;
  anatomyButton.innerHTML = available ? '<span>Explore anatomy</span><i aria-hidden="true">↗</i>' : 'Anatomy unavailable';
  if (wasOpen) {
    profile.scrollTop = 0;
    syncProfileScroll();
    anatomyButton.focus({ preventScroll: true });
  }
}

function updateAnchors(anchors, state) {
  hub.dataset.transitioning = String(Boolean(state?.transitioning));
  anchors.forEach((anchor, index) => {
    const actor = hub.querySelector(`[data-actor="${index}"]`);
    if (!actor || !anchor) return;
    actor.style.setProperty('--x', `${anchor.x}px`);
    actor.style.setProperty('--top', `${anchor.yTop}px`);
    actor.style.setProperty('--height', `${Math.max(0, anchor.yBottom - anchor.yTop)}px`);
  });
  const anchor = selected === null ? null : anchors[selected];
  if (anchor) {
    figureButton.style.setProperty('--figure-x', `${anchor.x}px`);
    figureButton.style.setProperty('--figure-top', `${anchor.yTop}px`);
    figureButton.style.setProperty('--figure-height', `${Math.max(0, anchor.yBottom - anchor.yTop)}px`);
    const scanline = hub.querySelector('.orbit-scanline');
    scanline.style.left = `${anchor.scan.x}px`;
    scanline.style.top = `${anchor.scan.y}px`;
    hub.dataset.scanning = String(Boolean(state?.scanning));
    hub.dataset.anatomyReady = String(Boolean(anatomyMode && (state?.anatomyProgress || 0) >= 0.85));
    if (hub.dataset.anatomyReady === 'true' && pendingAnatomyFocus) {
      anatomyRoot.querySelector(`[data-anatomy-form="${pendingAnatomyFocus}"] input`)?.focus({ preventScroll: false });
      pendingAnatomyFocus = '';
    }
    const marker = anatomyRoot.querySelector('.crew-anatomy');
    if (marker && anatomyMode) {
      for (const name of ['head', 'chest', 'abdomen']) {
        marker.style.setProperty(`--anatomy-${name}-x`, `${anchor[name].x}px`);
        marker.style.setProperty(`--anatomy-${name}-y`, `${anchor[name].y}px`);
      }
    }
  }
}
async function begin() {
  try {
    stage = await createCrewStage(canvas, updateAnchors);
    hub.dataset.ready = 'true';
    anatomyButton.disabled = false;
    anatomyButton.innerHTML = '<span>Explore anatomy</span><i aria-hidden="true">↗</i>';
    hub.querySelector('.orbit-loading').hidden = true;
  } catch (error) {
    stage = { focus() {}, overview() {}, setRecording() {}, pause() {}, resume() {} };
    hub.dataset.failed = 'true';
    hub.querySelector('.orbit-loading').hidden = true;
    hub.querySelector('.orbit-failure').hidden = false;
    console.error('Crew stage failed:', error);
  }
  appNav.hidden = !CrewDesign.hasProfile();
  if (CrewDesign.hasProfile()) {
    actors.inert = true;
    mobileControls.forEach(item => { item.inert = true; });
    showPerson(0);
  } else {
    onboarding.hidden = false;
    actors.inert = true;
    mobileControls.forEach(item => { item.inert = true; });
  }
}
begin();
