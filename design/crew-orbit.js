import { createCrewStage } from '/space-test/design/crew-motion-stage.js?v=astronaut-6';
import { renderObservationCheckin, renderObservationIdentity, renderObservationOverview, renderObservationProfile, renderObservationMobile, updateObservationCheckin } from '/space-test/design/crew-observation-ui.js?v=astronaut-3';
import { renderAnatomyUI, setAnatomyCategory, setAnatomyMetric } from '/space-test/design/crew-anatomy-ui.js?v=astronaut-3';
import { renderEmergencyGuide } from '/space-test/design/crew-guidance.js?v=astronaut-3';
import { initializeCustomSelects, syncCustomSelects, focusCustomSelect } from '/space-test/design/crew-select.js?v=astronaut-3';
import { renderHealthTimeline } from '/space-test/design/crew-timeline-ui.js?v=astronaut-3';
import { assessCrewHealth } from '/space-test/design/crew-assessment.js?v=astronaut-3';

const { CrewDesign } = window;
const people = CrewDesign.crew;
const hub = document.createElement('main');
hub.className = 'crew-orbit';
hub.dataset.single = 'true';
hub.setAttribute('aria-label', 'Crew health overview');
hub.innerHTML = `<div class="orbit-background" aria-hidden="true"></div><canvas class="orbit-canvas" aria-hidden="true"></canvas>
  <header class="orbit-header"><span class="orbit-brand">CREW <i>/</i> HEALTH</span><div class="orbit-header-right"><span class="orbit-meta">Personal crew profile · entries stay on this device</span><button type="button" data-emergency>Emergency <span aria-hidden="true">↗</span></button></div></header>
  <div class="orbit-intro"><h1 tabindex="-1">Space health</h1><p>One crew member · one personal record</p></div>
  <nav class="orbit-app-nav" aria-label="Health dashboard" hidden><button type="button" data-nav="profile">Profile</button><button type="button" data-nav="today">Readings today</button><button type="button" data-nav="history">History</button><button type="button" data-nav="device">Link device</button><button type="button" data-nav="research">Space effects</button><button type="button" data-nav="feedback">Feedback</button></nav>
  <div class="orbit-actors">${people.map((person, index) => `<section class="orbit-actor" data-actor="${index}"><button class="orbit-hit" type="button" data-select="${index}" aria-label="Open astronaut health profile"></button><div class="orbit-actor-label"><span>ASTRONAUT PROFILE</span><h2></h2><div class="orbit-actor-status"></div><button type="button" data-record="${index}">Readings today <span aria-hidden="true">↗</span></button></div><div class="orbit-actor-readings"></div></section>`).join('')}</div>
  <div class="orbit-mobile-summary"></div>
  <nav class="orbit-mobile-crew" aria-label="Choose a crew member">${people.map((person, index) => `<button type="button" data-select="${index}">${person.name.split(' ')[0]} <span aria-hidden="true">↗</span></button>`).join('')}</nav>
  <div class="orbit-profile" hidden><button class="orbit-back" type="button" data-all>← Overview</button><div class="orbit-profile-identity"><div class="orbit-profile-name"></div><div class="orbit-profile-actions"><button type="button" data-edit-profile>Edit profile <span aria-hidden="true">↗</span></button><button type="button" data-open-form><span>Record readings today</span><i aria-hidden="true">↗</i></button><button type="button" data-open-history><span>View history</span><i aria-hidden="true">↗</i></button><button type="button" data-anatomy disabled>Preparing anatomy…</button><p class="orbit-anatomy-error" role="alert" hidden></p></div></div><button class="orbit-figure-hit" type="button" data-figure-anatomy aria-label="Explore this astronaut’s anatomy"></button><div class="orbit-scanline" aria-hidden="true"></div><div class="orbit-profile-readings" role="region" aria-label="Health readings" tabindex="0"></div><form class="orbit-form" hidden></form><div class="orbit-anatomy-root" hidden></div><p class="orbit-gesture">Drag to explore the scene</p><nav class="orbit-switch" aria-label="Astronaut"><span class="orbit-position"></span></nav></div>
  <section class="orbit-onboarding" hidden aria-labelledby="profile-setup-title"><div class="orbit-panel-kicker">ASTRONAUT PROFILE</div><h2 id="profile-setup-title">Create your profile</h2><p>Set up the crew member shown in this scene. Your profile and readings stay in this browser.</p><form data-profile-form><label for="profile-name">Name</label><input id="profile-name" name="name" maxlength="48" autocomplete="name" required placeholder="Enter your name"><label for="profile-anatomy">Anatomy model <span>Optional</span></label><select id="profile-anatomy" name="model"><option value="male">Masculine anatomy</option><option value="female">Feminine anatomy</option></select><p class="orbit-profile-error" role="alert"></p><button type="submit">Save profile <span aria-hidden="true">↗</span></button></form><small>This prototype does not create an online account or sync data.</small></div>
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
    const time = summary.symptomTime && Number.isFinite(Date.parse(summary.symptomTime)) ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(summary.symptomTime)) : '';
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
  hub.querySelector('.orbit-profile-name').innerHTML = `${renderObservationIdentity(summary, pulseHistory, assessment)}<button type="button" class="orbit-edit-profile" data-edit-profile>Edit profile ↗</button>`;
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
window.addEventListener('crewhealth:update', renderData);

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
  if (restoreFocus) (previousFocus?.isConnected ? previousFocus : hub.querySelector('[data-emergency]'))?.focus({ preventScroll: true });
  returnFocus = null;
}
function setContextPanel(panel, source) {
  if (hub.dataset.panel) closeContextPanel(false);
  returnFocus = source;
  hub.dataset.panel = panel;
  profile.inert = true;
  actors.inert = true;
  mobileControls.forEach(item => { item.inert = true; });
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
  timeline.innerHTML = renderHealthTimeline(CrewDesign.summary(personId), anatomyHistory(personId), CrewDesign.symptomHistory(personId), CrewDesign.symptomOptions);
  timeline.hidden = false;
  timeline.scrollTop = 0;
  timeline.querySelector('#timeline-title')?.focus({ preventScroll: true });
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function todayRow(reading, label, unit, pressure = false) {
  const recordedToday = reading?.recorded && new Date(reading.time).toDateString() === new Date().toDateString();
  const value = pressure
    ? `${reading?.value?.systolic ?? '—'}/${reading?.value?.diastolic ?? '—'}`
    : reading?.recorded ? reading.value : '—';
  const detail = recordedToday
    ? `Recorded ${new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(reading.time))}${reading.context ? ` · ${reading.context === 'rest' ? 'at rest' : reading.context === 'after-activity' ? 'after activity' : reading.context}` : ''}`
    : reading?.recorded ? 'Last entry was on another day' : 'No reading recorded today';
  return `<div class="orbit-today-row"><span>${label}</span><strong>${escapeHtml(value)} <small>${unit}</small></strong><em>${escapeHtml(detail)}</em></div>`;
}
function sectionMarkup(section) {
  const summary = CrewDesign.summary(people[0].id);
  const name = escapeHtml(summary.person.name);
  if (section === 'today') return `<p class="orbit-panel-kicker">MISSION HEALTH / TODAY</p><h2 id="section-title">Readings today</h2><p class="orbit-section-lede">A daily snapshot for ${name}. Values are shown as recorded; this demo does not classify them as normal or abnormal.</p><div class="orbit-today-list">${todayRow(summary.pulse, 'Heart rate', 'bpm')}${todayRow(summary.oxygen, 'Oxygen saturation', '%')}${todayRow(summary.pressure, 'Blood pressure', 'mmHg', true)}${todayRow(summary.temperature, 'Temperature', '°C')}</div><button class="orbit-panel-action" type="button" data-today-record>Record today’s readings <span aria-hidden="true">↗</span></button><p class="orbit-local-note">Entries are stored in this browser only.</p>`;
  if (section === 'device') return `<p class="orbit-panel-kicker">DEVICE LINK / CONCEPT</p><h2 id="section-title">Connect a wearable</h2><p class="orbit-section-lede">A future device link could send heart rate, oxygen saturation, activity, and other supported measurements into this profile.</p><div class="orbit-device-status"><span class="orbit-device-dot"></span><div><strong>No device connected</strong><small>Manual entry is available today</small></div></div><p>This prototype does not pair with Bluetooth devices or receive live sensor data. A real connection would need a supported device, permission, and a review step before a reading is saved.</p><button class="orbit-panel-action" type="button" data-device-plan>View connection concept <span aria-hidden="true">↗</span></button><div class="orbit-device-flow" data-device-flow hidden><ol><li>Choose a compatible wearable.</li><li>Approve a secure connection.</li><li>Review the sensor reading and its time.</li><li>Confirm before adding it to the record.</li></ol></div><a class="orbit-source-link" href="https://ntrs.nasa.gov/api/citations/20240000117/downloads/AI_and_Human_Spaceflight.pdf" target="_blank" rel="noopener noreferrer">NASA biosensors overview ↗</a>`;
  if (section === 'research') return `<p class="orbit-panel-kicker">SPACEFLIGHT HEALTH / NASA RESEARCH</p><h2 id="section-title">What changes in space?</h2><p class="orbit-section-lede">Spaceflight can change physiology. Readings need personal baselines, activity context, mission phase, and medical-team interpretation.</p><article class="orbit-research-card"><h3>Heart and circulation</h3><p>In microgravity, body fluids shift toward the head and the cardiovascular system adapts. NASA studies changes in heart and blood-vessel function and the risk of dizziness or fainting after return to gravity.</p><p class="orbit-research-note">NASA’s public material does not give one universal astronaut “normal” heart-rate or SpO₂ range for this dashboard. This prototype records values and context without setting medical thresholds.</p><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/" target="_blank" rel="noopener noreferrer">NASA cardiovascular risk research ↗</a></article><article class="orbit-research-card"><h3>Oxygen and wearable measurements</h3><p>NASA identifies hypoxia as a spaceflight risk in some mission and spacesuit scenarios. Wearable biosensor research has measured blood oxygen and ECG, but a sensor number alone is not a diagnosis.</p><a class="orbit-source-link" href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noopener noreferrer">NASA human-spaceflight risks ↗</a><a class="orbit-source-link" href="https://ntrs.nasa.gov/api/citations/20240000117/downloads/AI_and_Human_Spaceflight.pdf" target="_blank" rel="noopener noreferrer">NASA biosensors overview ↗</a></article><article class="orbit-research-card"><h3>Radiation</h3><p>Space radiation is not visible or felt. NASA monitors the radiation environment and uses dedicated instruments and dosimeters; exposure is not inferred from heart rate or oxygen saturation. Risks depend on mission and dose and can include long-term cancer and other tissue effects.</p><a class="orbit-source-link" href="https://www.nasa.gov/hrp/hazard-space-radiation/" target="_blank" rel="noopener noreferrer">NASA space-radiation research ↗</a></article><article class="orbit-research-card"><h3>Bone and muscle</h3><p>NASA reports an average 1%–1.5% loss of bone density per month in weight-bearing bones during four-to-six-month missions. Rates vary; exercise and bone scans are part of countermeasure and monitoring work.</p><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/" target="_blank" rel="noopener noreferrer">NASA bone-health research ↗</a></article><p class="orbit-local-note">Educational summary only. It does not provide an astronaut’s live telemetry or replace flight medical procedures.</p>`;
  if (section === 'feedback') return `<p class="orbit-panel-kicker">PRODUCT FEEDBACK</p><h2 id="section-title">Share feedback</h2><p class="orbit-section-lede">Tell us what is clear, confusing, or missing from this prototype.</p><form class="orbit-feedback-form" data-feedback-form><label for="feedback-rating">How useful is this dashboard?</label><select id="feedback-rating" name="rating"><option value="">Choose a rating</option><option value="5">5 · Very useful</option><option value="4">4 · Useful</option><option value="3">3 · Not sure</option><option value="2">2 · Needs work</option><option value="1">1 · Not useful</option></select><label for="feedback-message">Your feedback</label><textarea id="feedback-message" name="message" rows="5" maxlength="800" required placeholder="Write a few notes"></textarea><p class="orbit-feedback-confirmation" role="status"></p><button class="orbit-panel-action" type="submit">Save feedback <span aria-hidden="true">↗</span></button></form><p class="orbit-local-note">Feedback is saved in this browser and is not sent to anyone.</p>`;
  return '';
}
function showSection(section, source) {
  if (!CrewDesign.hasProfile()) { openOnboarding(false); return; }
  setContextPanel(section, source);
  sectionContent.innerHTML = sectionMarkup(section);
  sectionPanel.setAttribute('aria-label', section === 'research' ? 'NASA spaceflight health research' : section);
  sectionPanel.hidden = false;
  sectionPanel.scrollTop = 0;
  sectionContent.querySelector('#section-title')?.focus({ preventScroll: true });
}
function openOnboarding(edit = false) {
  const existing = CrewDesign.getProfile();
  profileForm.elements.name.value = existing?.name || '';
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
    CrewDesign.saveProfile(profileForm.elements.name.value, profileForm.elements.model.value);
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
    if (section === 'profile') { if (hub.dataset.panel) closeContextPanel(false); showPerson(0); return; }
    if (section === 'history') { if (hub.dataset.panel) closeContextPanel(false); if (selected === null) showPerson(0); showHistory(nav); return; }
    showSection(section, nav);
    return;
  }
  if (event.target.closest('[data-section-close]')) { closeContextPanel(); return; }
  if (event.target.closest('[data-today-record]')) { closeContextPanel(false); showPerson(0, true); return; }
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
    const values = Object.fromEntries(['pulse', 'oxygen', 'glucose', 'sleep', 'water', 'temperature', 'exercise'].map(field => [field, form.elements[field].value]));
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
