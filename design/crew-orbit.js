import {createRepeat,renderRepeat,repeatPayload} from './crew-repeat.js?v=1';
import {renderCollection,collectionFields,collectionHasEntry,collectionPayload,syncCollectionSymptoms,syncCollectionMeasurement,navigateCollection,urgentCollectionFields,advanceMeasurementGuide,measurementGuides} from './crew-collection.js?v=10';
import {renderAssistance,advanceAssistance,readAssistance,writeAssistance} from './crew-assistance.js?v=4';
import {createLiquidInterface} from './crew-liquid-ui.js?v=8';
import {responseKey,readResponse,recordResponse,handoffText} from './crew-care.js?v=3';
import { createCrewStage } from '/space-test-site/design/crew-motion-stage.js?v=astronaut-33';
import { renderObservationCheckin, renderObservationIdentity, renderObservationOverview, renderObservationProfile, renderObservationMobile, updateObservationCheckin } from '/space-test-site/design/crew-observation-ui.js?v=astronaut-9';
import { renderAnatomyUI, setAnatomyCategory, setAnatomyMetric } from '/space-test-site/design/crew-anatomy-ui.js?v=astronaut-3';
import { renderEmergencyGuide } from '/space-test-site/design/crew-guidance.js?v=astronaut-3';
import { initializeCustomSelects, syncCustomSelects, focusCustomSelect } from '/space-test-site/design/crew-select.js?v=astronaut-10';
import { renderHealthTimeline } from '/space-test-site/design/crew-timeline-ui.js?v=astronaut-6';
import { assessCrewHealth } from '/space-test-site/design/crew-assessment.js?v=astronaut-4';
import { connectCrewSensor } from '/space-test-site/design/crew-device.js?v=astronaut-1';
import { initializeCustomDateTimes, syncCustomDateTimes } from '/space-test-site/design/crew-datetime.js?v=3';
import { compareHistory } from '/space-test-site/design/crew-insights.js?v=1';

import { renderMission, missionState } from './crew-mission-ui.js?v=9';
import { createCrewAlarm } from './crew-alarm.js?v=2';
import { renderHistoryScene, initializeHistoryChart, updateHistoryScene } from './crew-history-scene.js?v=8';
import { renderDeviceScene } from './crew-device-scene.js?v=2';

const { CrewDesign } = window;
const people = CrewDesign.crew;
const demoMode = CrewDesign.demoMode;
const hub = document.createElement('main');
hub.className = 'crew-orbit';
hub.dataset.uiVariant='glass';
hub.dataset.single = 'true';
hub.setAttribute('aria-label', 'Crew health overview');
hub.innerHTML = `<div class="orbit-background" aria-hidden="true"></div><canvas class="orbit-canvas" aria-hidden="true"></canvas>
  <header class="orbit-header"><button class="mission-home" type="button" data-mission-action="overview" aria-label="Back to health overview"><span class="orbit-brand">CREW <i>/</i> HEALTH</span></button><div class="orbit-header-right"><button type="button" data-open-guidance>Guidance <span aria-hidden="true">↗</span></button><button type="button" data-emergency>Emergency <span aria-hidden="true">↗</span></button></div></header>
  <nav class="mission-tools" aria-label="Health tools"><button type="button" data-mission-action="overview" aria-current="page">Overview</button><button type="button" data-mission-action="history">History</button><button type="button" data-mission-action="device">Devices</button></nav><button class="scene-return" type="button" data-scene-back hidden>← Overview</button><div class="scene-explore" data-scene-explore tabindex="0" role="group" aria-label="Explore astronaut. Drag to orbit; arrow keys to turn; plus and minus to zoom; Home to reset."></div><div class="scene-orbit-tools"><span>Drag to explore</span><button type="button" data-scene-reset aria-label="Reset astronaut view">↺</button></div><section class="orbit-mission" aria-label="Personal health overview" hidden></section><div class="orbit-scenario-control"><label><span class="scenario-caption">Scenario preview</span><select data-scenario aria-label="Scenario preview"><option value="routine">Routine</option><option value="emergency">Urgent response</option></select></label><button type="button" data-alert-sound aria-pressed="true">Audio enabled</button></div><button class="care-alert-return" type="button" data-mission-action="overview">Return to urgent response ↗</button><div class="orbit-intro"><h1 tabindex="-1">Space health</h1><p>One crew member · one personal record</p></div>
  <div class="orbit-actors">${people.map((person, index) => `<section class="orbit-actor" data-actor="${index}"><button class="orbit-hit" type="button" data-select="${index}" aria-label="Open astronaut health profile"></button><div class="orbit-actor-label"><span>ASTRONAUT PROFILE</span><h2></h2><div class="orbit-actor-status"></div><button type="button" data-record="${index}">Readings today <span aria-hidden="true">↗</span></button></div><div class="orbit-actor-readings"></div></section>`).join('')}</div>
  <div class="orbit-mobile-summary"></div>
  <nav class="orbit-mobile-crew" aria-label="Choose a crew member">${people.map((person, index) => `<button type="button" data-select="${index}">${person.name.split(' ')[0]} <span aria-hidden="true">↗</span></button>`).join('')}</nav>
  <div class="orbit-profile" hidden><button class="orbit-back" type="button" data-all>← Overview</button><button class="orbit-profile-edit" type="button" data-edit-profile>Edit profile <span aria-hidden="true">↗</span></button><div class="orbit-profile-identity"><div class="orbit-profile-name"></div></div><p class="orbit-anatomy-error" role="alert" hidden></p><button class="orbit-figure-hit" type="button" data-figure-anatomy aria-label="Explore this astronaut’s anatomy" disabled></button><div class="orbit-scanline" aria-hidden="true"></div><div class="orbit-profile-readings" role="region" aria-label="Health readings" tabindex="0"></div><form class="orbit-form" hidden></form><div class="orbit-anatomy-root" hidden></div><p class="orbit-gesture">Drag to explore the scene</p><nav class="orbit-switch" aria-label="Astronaut"><span class="orbit-position"></span></nav></div>
  <section class="orbit-onboarding profile-workspace" hidden aria-labelledby="profile-setup-title"><form novalidate class="collection-page profile-page" data-profile-form><header class="collection-heading"><div><h1 tabindex="-1" id="profile-setup-title">Your profile</h1><p>Your details stay on this device.</p></div></header><div class="collection-editor profile-editor"><div class="profile-name-field"><label class="collection-label" for="profile-name">Full name <small>Required</small></label><div class="collection-value profile-name-value"><input id="profile-name" name="name" maxlength="48" autocomplete="name" required placeholder="Your name"></div></div><div class="profile-personal-values"><div><label class="collection-label" for="profile-age">Age <small>Optional</small></label><div class="collection-value"><input id="profile-age" name="age" aria-label="Age in years" type="number" min="0" max="120" step="1" inputmode="numeric" placeholder="—"><span>years</span></div></div><div><label class="collection-label" for="profile-mass">Body mass <small>Optional</small></label><div class="collection-value"><input id="profile-mass" name="bodyMass" type="number" min="0.1" max="400" step="0.1" inputmode="decimal" placeholder="—"><span>kg</span></div></div></div><p id="profile-error" class="orbit-profile-error collection-error" role="alert"></p></div><div class="mission-figure-space collection-figure profile-figure" data-figure-space></div><footer class="collection-footer"><div class="collection-save"><button type="button" data-cancel-profile hidden>Cancel</button><button type="submit">Save profile</button></div></footer></form></section>
  <section class="orbit-section-panel" hidden role="region" aria-label="Dashboard section"><button class="orbit-section-close" type="button" data-section-close>Close <span aria-hidden="true">×</span></button><div class="orbit-section-content"></div></section>
  <div class="orbit-emergency" role="region" aria-label="Emergency guidance" hidden></div>
  <div class="orbit-timeline" role="region" aria-label="Observation history" hidden></div>
  <p class="orbit-loading" role="status">Preparing the crew scene…</p><p class="orbit-failure" role="alert" hidden>Unable to load the 3D crew scene. Please reload to try again.</p>`;
document.body.append(hub);
const canvas = hub.querySelector('canvas');
const exploreSurface=hub.querySelector('[data-scene-explore]');
const sceneTools=hub.querySelector('.scene-orbit-tools');
function syncMissionFrame() {
  const surface=!onboarding.hidden?onboarding:mission;
  const figure=surface.querySelector('[data-figure-space]');
  if(hub.dataset.uiVariant!=='glass'||surface.hidden||!figure){stage?.setSceneFrame(null);return}
  const box=figure.getBoundingClientRect(),view=canvas.getBoundingClientRect();
  if(box.width>0&&box.height>0&&view.width>0&&view.height>0)stage?.setSceneFrame({width:box.width/view.width,x:(box.left+box.width/2-view.left)/view.width,y:(box.top+box.height/2-view.top)/view.height,height:box.height/view.height});
  else if(collectionMode)stage?.setSceneFrame({x:1.4,y:.4,width:.2,height:.25});
}
const figureObserver=new ResizeObserver(syncMissionFrame);
hub.addEventListener('scroll',syncMissionFrame,true);
window.addEventListener('resize',syncMissionFrame);

const profile = hub.querySelector('.orbit-profile');
const form = hub.querySelector('.orbit-form');
const emergency = hub.querySelector('.orbit-emergency');
const timeline = hub.querySelector('.orbit-timeline');
const figureButton = hub.querySelector('[data-figure-anatomy]');
const anatomyRoot = hub.querySelector('.orbit-anatomy-root');
const actors = hub.querySelector('.orbit-actors');
const mobileControls = [hub.querySelector('.orbit-mobile-summary'), hub.querySelector('.orbit-mobile-crew')];
const onboarding = hub.querySelector('.orbit-onboarding');
const profileForm = hub.querySelector('[data-profile-form]');
const sectionPanel = hub.querySelector('.orbit-section-panel');
const sectionContent = hub.querySelector('.orbit-section-content');
const appNav = hub.querySelector('.mission-tools');
initializeCustomSelects(hub.querySelector('.orbit-scenario-control'));
const mission = hub.querySelector('.orbit-mission');
let alertSoundEnabled = true;
const alarm = createCrewAlarm(undefined, { onState: updateAlarmControl });
let activeAlertKey = '';
function setActiveDashboard(section) {
  appNav.querySelectorAll('[data-mission-action]').forEach(button => {
    if (button.dataset.missionAction === section) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}
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
let pendingDashboardSection = null;
let contextHistory = [];
let checkinReturn = null;
let checkinDraft = false;
let profileReturn=null;
let collectionMode='';
let repeatState=null,repeatReturn=null;
const repeatStorageKey='crew-health-guided-repeat-v1';
let collectionDraft=null;
let assistanceModeKey='';
let assistanceView='steps';
let assistanceStarted=false;
let assistanceVoiceActive=false;
let urgentReturnView='';
const assistanceCache=new Map();
let offlineCopyReady = false;
let offlineSetupFailed = !('serviceWorker' in navigator);
const draftStorageKey = demoMode ? 'crew-health-demo-checkin-draft-v1' : 'crew-health-checkin-draft-v1';
let historyMetric = 'pulse';
let historyScenePosition = null;
let historyTrendDays = 120;
const viewAnimations = new WeakMap();
const today = new Date();
let selectedReadingDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
let selectedHistoryDate = selectedReadingDate;
let readingCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let historyCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const deviceConnections = new Map();
const deviceSaveTimes = new Map();
const deviceLatestReadings = new Map();
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
  initializeCustomDateTimes(anatomyRoot);
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
  if (!mission.hidden) renderMissionView();
  if (selected === null) return;
  const summary = CrewDesign.summary(people[selected].id);
  const pulseHistory = CrewDesign.history(summary.person.id, 'pulse');
  const histories = anatomyHistory(summary.person.id);
  const assessment = assessCrewHealth(summary, histories);
  form.setAttribute('aria-label', `Health check for ${summary.person.name}`);
  updateObservationCheckin(form, summary);
  form.querySelector('select[name="symptoms"] option[value=""]').textContent = summary.symptoms ? 'Keep previous status' : 'Not recorded';
  for (const field of ['mood', 'sleepQuality']) {
    form.querySelector(`select[name="${field}"] option[value=""]`).textContent = summary[field] ? 'Keep previous' : 'Not recorded';
  }
  figureButton.setAttribute('aria-label', `Explore ${summary.person.name}'s anatomy`);
  const profileInfo = CrewDesign.getProfile() || {};
  const profileDetails = [profileInfo.age !== '' && profileInfo.age != null ? `Age ${escapeHtml(profileInfo.age)}` : '', profileInfo.bodyMass !== '' && profileInfo.bodyMass != null ? `Body mass ${escapeHtml(profileInfo.bodyMass)} kg` : ''].filter(Boolean).join(' · ');
  hub.querySelector('.orbit-profile-name').innerHTML = `${renderObservationIdentity(summary, pulseHistory, assessment)}${profileDetails ? `<p class="orbit-profile-meta">${profileDetails}</p>` : ''}<button type="button" class="orbit-connection-summary" data-open-device><span class="orbit-connection-indicator" data-connected="${String(deviceConnections.size > 0)}" aria-hidden="true"></span>${deviceConnections.size ? `${deviceConnections.size} device${deviceConnections.size === 1 ? '' : 's'} connected` : 'No devices connected'} <span aria-hidden="true">↗</span></button>`;
  const profileReadings = hub.querySelector('.orbit-profile-readings');
  profileReadings.innerHTML = '';
  hub.dataset.severity = missionState(summary, CrewDesign.scenarioInfo()).tone;
  if (anatomyMode) renderAnatomy(summary, histories);
  hub.querySelector('.orbit-position').textContent = '01 / 01';
}
function renderForm() {
  form.innerHTML = renderObservationCheckin();
  initializeCustomSelects(form);
  initializeCustomDateTimes(form);
}
function resetForm() {
  form.reset();
  form.querySelectorAll('details').forEach(disclosure => { disclosure.open = disclosure.classList.contains('observation-time') || disclosure.classList.contains('observation-daily-context'); });
  form.querySelector('.orbit-error').textContent = '';
  form.querySelector('.observation-urgent').hidden = true;
  form.querySelector('.observation-symptom-note').hidden = true;
  syncCustomDateTimes(form);
}
function focusCheckinAction() {
  appNav.querySelector('[data-mission-action="checkin"]')?.focus({ preventScroll: true });
}
function storeCheckinDraft() {
  if (!recording) return;
  checkinDraft = true;
  try {
    const fields = [...form.elements].filter(element => element.name).map(element => ({
      name: element.name, value: element.value,
      ...(element.type === 'checkbox' ? { checked: element.checked } : {}),
    }));
    const details = [...form.querySelectorAll('details')].map(item => item.open);
    sessionStorage.setItem(draftStorageKey, JSON.stringify({ fields, details, purpose: form.dataset.purpose || '' }));
  } catch (_) { /* The in-memory draft still works if storage is unavailable. */ }
}
function clearCheckinDraft() {
  checkinDraft = false;
  try { sessionStorage.removeItem(draftStorageKey); } catch (_) {}
}
function restoreCheckinDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftStorageKey) || 'null');
    if (!draft || !Array.isArray(draft.fields)) return;
    for (const saved of draft.fields) {
      const controls = [...form.elements].filter(element => element.name === saved.name);
      const control = controls.find(element => element.type === 'checkbox' ? element.value === saved.value : true);
      if (!control) continue;
      if (control.type === 'checkbox') control.checked = saved.checked === true;
      else if (typeof saved.value === 'string') control.value = saved.value;
    }
    form.querySelectorAll('details').forEach((item, index) => { item.open = draft.details?.[index] === true; });
    const status = form.elements.symptoms.value;
    form.querySelector('.observation-symptom-note').hidden = !['concerning', 'urgent'].includes(status);
    form.querySelector('.observation-urgent').hidden = status !== 'urgent';
    syncCustomSelects(form);
    syncCustomDateTimes(form);
    if(['repeat','wellbeing'].includes(draft.purpose)){form.dataset.purpose=draft.purpose;form.querySelector('.observation-checkin-head h3').textContent=draft.purpose==='repeat'?'Repeat vital readings':'Wellbeing check-in';}
    checkinDraft = collectionHasEntry(draft.fields);
  } catch (_) { /* Ignore an unavailable or malformed draft. */ }
}
renderForm();
restoreCheckinDraft();
initializeCustomSelects(profileForm);
renderData();
window.addEventListener('crewhealth:update', () => {
  renderData();
  if (hub.dataset.panel === 'today') {
    const expanded = sectionContent.querySelector('[data-reading-detail][aria-expanded="true"]')?.dataset.readingDetail;
    const moreOpen = Boolean(sectionContent.querySelector('.orbit-more-readings')?.open);
    const list = sectionContent.querySelector('.orbit-today-list');
    if (list) { list.innerHTML = readingRows(people[0].id); list.querySelector('.orbit-more-readings').open = moreOpen; }
    sectionContent.querySelector('.orbit-summary-group')?.replaceWith(createCheckinSummaryNode(CrewDesign.summary(people[0].id)));
    if (expanded) {
      const row = list?.querySelector(`[data-reading-detail="${expanded}"]`);
      if (row) toggleReadingDetail(row, true);
    }
  }
  if (hub.dataset.panel === 'guidance' && !sectionContent.querySelector('[data-feedback-form] textarea:focus')) {
    sectionContent.innerHTML = sectionMarkup('guidance');
    initializeCustomSelects(sectionContent);
  }
  if (hub.dataset.panel === 'history') renderHistorySceneView();
  if (hub.dataset.panel === 'weights') sectionContent.innerHTML = sectionMarkup('weights');
});

function showPerson(index, openForm = false) {
  if (!CrewDesign.hasProfile()) { openOnboarding(false); return; }
  if (!stage || index < 0 || index >= people.length) return;
  if (selected !== index) exitAnatomy();
  leaveMission();
  selected = index;
  profile.scrollTop = 0;
  form.scrollTop = 0;
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
  if (openForm && !checkinDraft) resetForm();
  stage.focus(index);
  renderData();
  if (recording) setTimeout(() => focusCustomSelect(form.elements.symptoms, { preventScroll: true }), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400);
  else hub.querySelector('.orbit-back').focus({ preventScroll: true });
}
function showOverview(focus = true) { showMission(focus); }
function syncProfileScroll() {
  const scrolled = profile.scrollTop > 12;
  hub.dataset.profileScrolled = String(scrolled);
  hub.style.setProperty('--profile-scroll', `${profile.scrollTop}px`);
  if (window.innerWidth < 768 && scrolled) stage?.pause();
  else stage?.resume();
}
function animateContext(panel) {
  for (const animation of viewAnimations.get(panel) || []) animation.cancel();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof panel.animate !== 'function') return;
  // A single compositor transition keeps the chart sharp while the camera moves.
  const targets=panel===mission?[...panel.querySelectorAll('.mission-intro,.mission-state,.mission-primary-readings,.mission-recovery,.mission-body-readings,.mission-response,.mission-ground,.collection-heading,.collection-navigation,.collection-editor,.collection-footer')]:[panel];
  viewAnimations.set(panel, targets.map(target=>target.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' })));
}
function currentContext() {
  return { section: hub.dataset.panel || (collectionMode?'collection':recording ? 'checkin' : 'mission'), purpose:collectionMode, expanded: sectionContent.querySelector('[data-reading-detail][aria-expanded="true"]')?.dataset.readingDetail };
}
function rememberContext() { contextHistory.push(currentContext()); }
function syncBackControls() {
  const hasBack = contextHistory.length > 0;
  const close = sectionPanel.querySelector('[data-section-close]');
  close.innerHTML = hasBack ? '← Back' : '← Health overview';
  close.setAttribute('aria-label', hasBack ? 'Back to previous view' : 'Back to health overview');
  const historyClose = timeline.querySelector('[data-timeline-close]');
  if (historyClose) {
    historyClose.innerHTML = hasBack ? '← Back' : '← Health overview';
    historyClose.setAttribute('aria-label', hasBack ? 'Back to previous view' : 'Back to health overview');
  }
}
function restoreContext(context) {
  if(context?.section==='collection'){showMission(false);collectionMode=context.purpose==='guided-repeat'?'daily':context.purpose;renderMissionView();animateContext(mission);return}
  if (!context || ['mission', 'profile', 'today'].includes(context.section)) { showMission(); return; }
  if (context?.section === 'checkin') {
    if (hub.dataset.panel) closeContextPanel(false);
    setActiveDashboard('checkin');
    animateContext(form);
    focusCustomSelect(form.elements.symptoms, { preventScroll: true });
  } else if (!context || context.section === 'profile') {
    if (hub.dataset.panel) closeContextPanel(false);
    showPerson(0);
    setActiveDashboard('profile');
  } else if (context.section === 'history') {
    setActiveDashboard('history');
    showHistory(null);
  } else {
    showSection(context.section, null);
    if (context.section === 'today' && context.expanded) {
      const row = sectionContent.querySelector(`[data-reading-detail="${context.expanded}"]`);
      if (row) { if (row.closest('details')) row.closest('details').open = true; toggleReadingDetail(row, true); }
    }
    if (['today', 'device'].includes(context.section)) setActiveDashboard(context.section);
  }
}
function navigateBack() {
  if (contextHistory.length) restoreContext(contextHistory.pop());
  else showMission();
}
function closeContextPanel(restoreFocus = true) {
  const previousFocus = returnFocus;
  if ((hub.dataset.panel && hub.dataset.panel !== 'emergency') || historyReturn) stage?.setRecordView?.(false);
  if (hub.dataset.panel === 'emergency' && historyReturn && restoreFocus) {
    emergency.hidden = true;
    hub.dataset.panel = 'history';
    timeline.hidden = false;
    stage?.resume();
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
  setActiveDashboard('profile');
  profile.inert = false;
  actors.inert = !stage || selected !== null;
  mobileControls.forEach(item => { item.inert = !stage || selected !== null; });
  if (selected !== null) syncProfileScroll();
  if (selected !== null) stage?.resume();
  if (restoreFocus && !recording) { showMission(); return; }
  if (restoreFocus) (previousFocus?.isConnected ? previousFocus : hub.querySelector('[data-emergency]'))?.focus({ preventScroll: true });
  returnFocus = null;
}
function setContextPanel(panel, source) {
  leaveMission();
  if (hub.dataset.panel) {
    stage?.setRecordView?.(false);
    emergency.hidden = true;
    timeline.hidden = true;
    sectionPanel.hidden = true;
    delete hub.dataset.panel;
  }
  returnFocus = source;
  hub.dataset.panel = panel;
  const scenePage = panel === 'history' || panel === 'device';
  if (scenePage) {
    hub.dataset.workspace = 'scene';
    stage?.overview();
    stage?.setMissionView?.(true);
    stage?.setSceneView?.(panel);
    hub.querySelector('[data-scene-back]').hidden = false;
  }
  profile.inert = true;
  actors.inert = true;
  mobileControls.forEach(item => { item.inert = true; });
  if (panel === 'emergency') stage?.pause();
  else { stage?.resume(); if (!scenePage) stage?.setRecordView?.(true); }
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
function historySceneData() {
  const personId = people[selected ?? 0].id;
  return { summary: CrewDesign.summary(personId), histories: anatomyHistory(personId), reports: { mood: CrewDesign.selfReportHistory(personId, 'mood'), sleepQuality: CrewDesign.selfReportHistory(personId, 'sleepQuality'), symptoms: CrewDesign.symptomHistory(personId).map(entry => ({ ...entry, tags: (entry.tags || []).map(tag => CrewDesign.symptomOptions[tag] || tag) })) }, field: historyMetric || 'pulse', days: historyTrendDays, position: historyScenePosition };
}
let cleanupHistoryChart = () => {};
function renderHistorySceneView() {
  cleanupHistoryChart();
  updateHistoryScene(timeline, renderHistoryScene(historySceneData()));
  cleanupHistoryChart = initializeHistoryChart(timeline);
}
function showHistory(source, refresh = false) {
  if (selected === null) selected = 0;
  setContextPanel('history', source);
  renderHistorySceneView();
  timeline.hidden = false;
  setActiveDashboard('history');
  syncBackControls();
  if (!refresh) { timeline.scrollTop = 0; animateContext(timeline); timeline.querySelector('#history-scene-title')?.setAttribute('tabindex', '-1'); timeline.querySelector('#history-scene-title')?.focus({ preventScroll: true }); }
}
function renderHistoryTrend() { renderHistorySceneView(); }
function historyCalendarMarkup(personId) {
  const year = historyCalendarMonth.getFullYear();
  const month = historyCalendarMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const recordedDays = new Set();
  for (const field of Object.keys(CrewDesign.metrics)) {
    for (const item of CrewDesign.history(personId, field)) {
      const date = new Date(item.time);
      if (Number.isFinite(date.getTime())) recordedDays.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    }
  }
  for (const item of CrewDesign.symptomHistory(personId)) {
    const date = new Date(item.time);
    if (Number.isFinite(date.getTime())) recordedDays.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  }
  for (const field of ['mood', 'sleepQuality']) {
    const reportHistory = typeof CrewDesign.selfReportHistory === 'function' ? CrewDesign.selfReportHistory(personId, field) : [];
    for (const item of reportHistory) {
      const date = new Date(item.time);
      if (Number.isFinite(date.getTime())) recordedDays.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    }
  }
  const cells = Array(firstWeekday).fill('<span aria-hidden="true"></span>');
  for (let day = 1; day <= days; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasRecords = recordedDays.has(key);
    const now = new Date();
    const isToday = year === now.getFullYear() && month === now.getMonth() && day === now.getDate();
    cells.push(`<button type="button" data-calendar-day="${key}" aria-label="${new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date(year, month, day))}${hasRecords ? ', saved observations' : ''}" aria-pressed="${String(key === selectedHistoryDate)}"${isToday ? ' aria-current="date"' : ''}${hasRecords ? ' data-has-records="true"' : ''}>${day}</button>`);
  }
  return `<section class="orbit-history-calendar" aria-label="Observation calendar"><div class="orbit-calendar-topline"><span>MISSION LOG / CALENDAR</span><button type="button" data-calendar-today>Today ↗</button></div><div class="orbit-history-calendar-head"><h2 aria-live="polite">${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(historyCalendarMonth)}</h2><div><button type="button" data-calendar-shift="-1" aria-label="Previous month">←</button><button type="button" data-calendar-shift="1" aria-label="Next month">→</button></div></div><div class="orbit-history-calendar-grid orbit-calendar-weekdays" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="orbit-history-calendar-grid orbit-calendar-days">${cells.join('')}</div><p><span class="orbit-calendar-dot" aria-hidden="true"></span> A dot marks a day with saved observations.</p></section>`;
}
function createHistoryCalendarNode(personId) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = historyCalendarMarkup(personId);
  return wrapper.firstElementChild;
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function filterHistoryByDate(day) {
  const entries = timeline.querySelectorAll('.timeline-entry');
  let visible = 0;
  entries.forEach(entry => {
    const timestamp = entry.querySelector('time')?.dateTime;
    const date = timestamp ? new Date(timestamp) : null;
    const key = date && Number.isFinite(date.getTime()) ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
    const matchingDate = !day || key === day;
    entry.querySelectorAll('[data-history-metric]').forEach(row => { row.hidden = Boolean(historyMetric && row.dataset.historyMetric !== historyMetric); });
    entry.querySelectorAll('.timeline-report').forEach(report => { report.hidden = Boolean(historyMetric); });
    const matches = matchingDate && (!historyMetric || Boolean(entry.querySelector(`[data-history-metric="${historyMetric}"]`)));
    entry.hidden = !matches;
    if (matches) visible++;
  });
  timeline.querySelector('.timeline-date-empty')?.remove();
  if (!visible) timeline.querySelector('.timeline-list')?.insertAdjacentHTML('afterend', '<p class="timeline-date-empty">No matching observations are saved for this date.</p>');
}
function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function readingDateText(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(year, month - 1, date));
}
function readingCalendarMarkup() {
  const year = readingCalendarMonth.getFullYear(), month = readingCalendarMonth.getMonth();
  const currentDate = new Date(), currentDay = localDateKey(currentDate);
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const blanks = Array(new Date(year, month, 1).getDay()).fill('<span aria-hidden="true"></span>');
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
    const date = new Date(year, month, day), key = localDateKey(date);
    blanks.push(`<button type="button" data-reading-calendar-day="${key}" aria-label="${new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date)}" aria-pressed="${String(key === selectedReadingDate)}"${key === currentDay ? ' aria-current="date"' : ''}${key > currentDay ? ' disabled' : ''}>${day}</button>`);
  }
  return `<div class="orbit-reading-calendar-top"><span>SELECT A DATE</span><button type="button" data-reading-calendar-today>Today ↗</button></div><div class="orbit-reading-calendar-head"><strong aria-live="polite">${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(readingCalendarMonth)}</strong><div><button type="button" data-reading-calendar-shift="-1" aria-label="Previous month">←</button><button type="button" data-reading-calendar-shift="1" aria-label="Next month"${readingCalendarMonth >= currentMonth ? ' disabled' : ''}>→</button></div></div><div class="orbit-reading-calendar-grid orbit-reading-weekdays" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="orbit-reading-calendar-grid orbit-reading-days">${blanks.join('')}</div>`;
}
function closeReadingCalendar(restoreFocus = false) {
  const calendar = sectionContent.querySelector('[data-reading-calendar]');
  const toggle = sectionContent.querySelector('[data-reading-calendar-toggle]');
  if (!calendar || calendar.hidden) return false;
  calendar.hidden = true;
  toggle?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) toggle?.focus({ preventScroll: true });
  return true;
}
function selectReadingDate(day) {
  selectedReadingDate = day;
  const toggle = sectionContent.querySelector('[data-reading-calendar-toggle]');
  if (toggle) toggle.querySelector('[data-reading-date-label]').textContent = readingDateText(day);
  const dateText = sectionContent.querySelector('[data-today-date]');
  if (dateText) dateText.textContent = readingDateText(day);
  const list = sectionContent.querySelector('.orbit-today-list');
  if (list) list.innerHTML = readingRows(people[0].id);
  closeReadingCalendar(true);
}
function todayRow(reading, field, label, unit, pressure = false) {
  const value = pressure
    ? reading?.recorded ? `${reading.value?.systolic ?? '—'}/${reading.value?.diastolic ?? '—'}` : '—'
    : reading?.recorded ? reading.value : '—';
  const detail = reading?.recorded
    ? `${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(reading.time))} · ${reading.source || 'Source not recorded'}${reading.context && reading.context !== 'other' ? ` · ${reading.context === 'rest' ? 'At rest' : reading.context === 'after-activity' ? 'After activity' : reading.context}` : ''}`
    : 'No reading for this date';
  const content = `<span>${label}</span><strong>${escapeHtml(value)} <small>${unit}</small></strong><em><i class="orbit-reading-indicator" data-state="${reading?.recorded ? 'recorded' : 'missing'}" aria-hidden="true"></i>${escapeHtml(detail)}</em>`;
  return field ? `<button type="button" class="orbit-today-row" data-reading-detail="${field}" aria-expanded="false" aria-label="${escapeHtml(`${label}: ${value} ${unit}. ${detail}. Show recent readings`)}">${content}</button>` : `<div class="orbit-today-row">${content}</div>`;
}
function readingRows(personId) {
  const row = ([field, label, unit]) => todayRow(readingForDate(personId, field), field, label, unit, field === 'pressure');
  const primary = [['pulse','Heart rate','bpm'], ['pressure','Blood pressure','mmHg'], ['temperature','Temperature','°C'], ['sleep','Sleep','hours']].map(row).join('')
    + todayRow(selfReportForDate(personId, 'mood'), 'mood', 'Mood', '');
  const more = [['oxygen','Oxygen saturation','%'], ['glucose','Blood glucose','mg/dL'], ['weight','Body mass','kg'], ['water','Water intake','L'], ['exercise','Exercise','min']].map(row).join('')
    + todayRow(selfReportForDate(personId, 'sleepQuality'), 'sleepQuality', 'Sleep quality', '');
  return `${primary}<details class="orbit-more-readings"><summary>More readings <span aria-hidden="true">+</span></summary>${more}</details>`;
}
function readingForDate(personId, field) {
  const rows = CrewDesign.history(personId, field).filter(entry => {
    const date = new Date(entry.time);
    return Number.isFinite(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === selectedReadingDate;
  });
  const entry = rows.at(-1);
  return entry ? { recorded: true, value: entry.value, time: entry.time, context: entry.context, source: entry.source } : null;
}
function selfReportForDate(personId, field) {
  const reportHistory = typeof CrewDesign.selfReportHistory === 'function' ? CrewDesign.selfReportHistory(personId, field) : [];
  const entry = reportHistory.filter(item => {
    const date = new Date(item.time);
    return Number.isFinite(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === selectedReadingDate;
  }).at(-1);
  return entry ? { recorded: true, value: entry.value.charAt(0).toUpperCase() + entry.value.slice(1), time: entry.time, source: 'Scenario history' } : null;
}
const sensors = [
  ['pulse', 'Heart-rate sensor', 'Heart rate · can stream while connected'],
  ['pressure', 'Blood-pressure cuff', 'Blood pressure · take a measurement on the cuff'],
  ['oxygen', 'Pulse oximeter', 'Oxygen saturation · spot-check reading'],
  ['glucose', 'Glucose meter', 'Blood glucose · latest stored reading when supported'],
];
function describeDeviceReading(field, latest) {
  const value = field === 'pressure' ? `${latest.value.systolic}/${latest.value.diastolic}` : latest.value;
  const time = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(latest.time));
  return `Last reading ${value} ${CrewDesign.metrics[field].unit} · ${time}`;
}
function deviceRows() {
  const row = ([field, label, note]) => {
    const session = deviceConnections.get(field);
    const latest = deviceLatestReadings.get(field);
    const status = session ? 'Connected' : 'Not connected';
    const displayName = session?.device.name || label;
    const received = session && latest ? describeDeviceReading(field, latest) : session ? 'Connected · waiting for a reading' : note;
    return `<article class="orbit-device-card" data-device-field="${field}"><div><span class="orbit-device-state" data-connected="${String(Boolean(session))}"><i aria-hidden="true"></i><span data-device-status="${field}">${status}</span></span><strong>${escapeHtml(displayName)}</strong><small data-device-reading="${field}">${escapeHtml(received)}</small></div><button class="orbit-panel-action" type="button" data-device-connect="${field}" aria-label="${session ? 'Disconnect' : 'Connect'} ${escapeHtml(displayName)}">${session ? 'Disconnect' : 'Connect ↗'}</button></article>`;
  };
  const connected = sensors.filter(([field]) => deviceConnections.has(field));
  const available = sensors.filter(([field]) => !deviceConnections.has(field));
  return `<div class="orbit-device-group"><h3>Your connections <span>${connected.length}</span></h3>${connected.length ? connected.map(row).join('') : '<p class="orbit-device-empty">No devices connected yet.</p>'}</div>${available.length ? `<div class="orbit-device-group"><h3>Connect a device</h3>${available.map(row).join('')}</div>` : ''}`;
}
function measurementTrend(entries, field, unit) {
  const contextFields = new Set(['pulse', 'pressure', 'oxygen', 'glucose', 'temperature']);
  const latestContext = entries[0]?.context || '';
  const samples = [...entries].reverse().filter(entry => (!contextFields.has(field) || (entry.context || '') === latestContext) && Number.isFinite(Date.parse(entry.time)) && (field === 'pressure'
    ? Number.isFinite(Number(entry.value?.systolic)) && Number.isFinite(Number(entry.value?.diastolic))
    : Number.isFinite(Number(entry.value))));
  if (samples.length < 2) return '';
  const series = field === 'pressure' ? [['Systolic', item => Number(item.value.systolic)], ['Diastolic', item => Number(item.value.diastolic)]] : [['Reading', item => Number(item.value)]];
  const all = series.flatMap(([, read]) => samples.map(read));
  const min = Math.min(...all), max = Math.max(...all), range = Math.max(max - min, 1);
  const start = Date.parse(samples[0].time), end = Date.parse(samples.at(-1).time);
  const paths = series.map(([name, read], seriesIndex) => {
    const points = samples.map((item, i) => {
      const x = end === start ? 42 + (i / (samples.length - 1)) * 248 : 42 + ((Date.parse(item.time) - start) / (end - start)) * 248;
      const y = 112 - (read(item) - min) / range * 88;
      return [x, y];
    });
    return `<path class="orbit-trend-line orbit-trend-line--${seriesIndex}" d="${points.map(([x,y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')}"/>${points.map(([x,y], index) => {
      const label = `${name}: ${read(samples[index])} ${unit} · ${new Date(samples[index].time).toLocaleString()}`;
      return `<circle class="orbit-chart-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" tabindex="${index === 0 ? 0 : -1}" data-chart-value="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><title>${escapeHtml(label)}</title></circle>`;
    }).join('')}`;
  }).join('');
  const description = series.map(([name, read]) => `${name}: ${samples.length} readings, from ${read(samples[0])} ${unit} on ${new Date(samples[0].time).toLocaleString()} to ${read(samples.at(-1))} ${unit} on ${new Date(samples.at(-1).time).toLocaleString()}, range ${Math.min(...samples.map(read))} to ${Math.max(...samples.map(read))} ${unit}.`).join(' ');
  const date = item => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.time));
  return `<figure class="orbit-measure-trend"><figcaption>Recent trend <span>${contextFields.has(field) ? escapeHtml(({ rest: 'At rest', 'after-activity': 'After activity', fasting: 'Fasting', 'after-meal': 'After a meal', other: 'Other context' })[latestContext] || 'Context not recorded') + ' · ' : ''}${samples.length} readings · scale ${escapeHtml(min)}–${escapeHtml(max)} ${escapeHtml(unit)}</span></figcaption><svg viewBox="0 0 310 145" role="img" aria-label="${escapeHtml(description)}">${[0,.5,1].map(fraction => `<line class="orbit-chart-grid" x1="42" x2="290" y1="${112-fraction*88}" y2="${112-fraction*88}"/><text class="orbit-chart-axis" x="35" y="${116-fraction*88}" text-anchor="end">${Math.round((min+fraction*range)*10)/10}</text>`).join('')}<text class="orbit-chart-axis" x="42" y="12">${escapeHtml(unit)}</text><path class="orbit-trend-base" d="M 42 20 V 120 H 290"/><text class="orbit-chart-axis" x="166" y="140" text-anchor="middle">Date / time</text>${paths}</svg><output class="orbit-chart-readout" aria-live="polite">Hover or focus a point for values</output><div class="orbit-trend-range"><span>${escapeHtml(date(samples[0]))}</span><span>${escapeHtml(date(samples.at(-1)))}</span></div>${field === 'pressure' ? '<div class="orbit-trend-legend"><span>Systolic</span><span>Diastolic</span></div>' : ''}</figure>`;
}
function measurementGuidance(field) {
  const guides = {
    pulse: ['Compare readings at rest or after activity separately; check the device and follow the mission procedure if a change is unexpected.', 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse'],
    pressure: ['Use the approved cuff and follow the same measurement procedure when comparing readings.', 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home'],
    oxygen: ['Follow the oximeter instructions; consider the reading alongside symptoms and the mission procedure.', 'https://medlineplus.gov/lab-tests/pulse-oximetry/'],
    glucose: ['Record whether the reading was fasting or after a meal, and follow the individual mission plan.', 'https://medlineplus.gov/lab-tests/blood-glucose-test/'],
    temperature: ['Use the same device and measurement site when comparing temperatures.', 'https://medlineplus.gov/ency/article/003400.htm'],
    weight: ['Use mission-approved mass measurement equipment and a consistent method.', 'https://www.nasa.gov/wp-content/uploads/2024/10/2024-space-nutrition-2nd-edition-2024.pdf'],
    sleep: ['Review sleep alongside sleep quality and the mission sleep schedule.', 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/'],
    water: ['Review recorded intake alongside the mission hydration plan and activity.', 'https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2/'],
    exercise: ['Compare activity with the individual training plan; minutes alone do not capture the exercise type or intensity.', 'https://www.nasa.gov/ochmo-tb-031-exercise-overview-2/'],
  };
  const guide = guides[field];
  return guide ? `<p class="orbit-measurement-guide"><strong>Next step</strong> ${guide[0]} <a href="${guide[1]}" target="_blank" rel="noopener noreferrer">Source ↗</a></p>` : '';
}
function comparisonMarkup(field, entries, unit) {
  const result = compareHistory(field, entries);
  if (!result) return '';
  const label = field === 'pressure' ? 'Systolic / diastolic' : 'Latest';
  const display = values => values.map(value => escapeHtml(value)).join(' / ');
  const signed = values => values.map(value => `${value > 0 ? '+' : ''}${escapeHtml(value)}`).join(' / ');
  const caveat = field === 'water' ? 'Recorded drinks alone do not establish hydration or include water from food.'
    : field === 'exercise' ? 'Minutes alone do not describe exercise intensity, type, or an individual mission plan.'
      : field === 'temperature' ? 'The measurement site and device also affect comparability and are not recorded here.'
        : field === 'weight' ? 'Compare only measurements taken with appropriate and consistent equipment.' : '';
  return `<section class="orbit-comparison-detail"><h4>Compared with earlier days</h4><p>${label}: ${display(result.current)} ${escapeHtml(unit)} · earlier median: ${display(result.baseline)} ${escapeHtml(unit)} · change: ${signed(result.delta)} ${escapeHtml(unit)}</p><p>${result.days} prior days${result.context ? ` · ${escapeHtml(result.context.replaceAll('-', ' '))}` : ''}${result.source ? ` · latest source: ${escapeHtml(result.source)}` : ''}. ${caveat}</p><details><summary>How this is calculated</summary><p>Change = latest value − median of the last observed value on each earlier day. Descriptive comparison.</p><a href="https://www.nasa.gov/reference/standard-measures/" target="_blank" rel="noopener noreferrer">NASA: why measurements over time matter ↗</a></details></section>`;
}
function measurementDetailsMarkup(field) {
  const isReport = field === 'mood' || field === 'sleepQuality';
  const metric = CrewDesign.metrics[field] || (isReport ? { label: field === 'mood' ? 'Mood' : 'Sleep quality', unit: '' } : null);
  if (!metric) return '';
  const entries = (isReport ? CrewDesign.selfReportHistory(people[0].id, field) : CrewDesign.history(people[0].id, field)).slice(-8).reverse();
  const values = entries.map(entry => {
    const value = field === 'pressure' ? `${entry.value.systolic}/${entry.value.diastolic}` : isReport ? entry.value.charAt(0).toUpperCase() + entry.value.slice(1) : entry.value;
    const time = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.time));
    return `<li><div><strong>${escapeHtml(value)} <small>${escapeHtml(metric.unit)}</small></strong><span>${escapeHtml(time)}</span></div><em>${escapeHtml(entry.source || (isReport ? 'Daily check-in' : 'Source not recorded'))}</em></li>`;
  }).join('');
  const trend = isReport ? '' : measurementTrend(entries, field, metric.unit);
  const hasContext = ['pulse', 'pressure', 'oxygen', 'glucose', 'temperature'].includes(field);
  const note = isReport ? 'Your recent self-reports are listed below.' : trend ? (!hasContext ? 'Shown from your recent entries; not a medical assessment.' : !entries[0]?.context ? 'Context was not recorded; comparability is unknown.' : 'Shown for the latest recorded context; not a medical assessment.') : hasContext ? 'A trend needs at least two readings taken in the same context.' : 'A trend needs at least two recorded readings.';
  return `${trend}${isReport ? '' : comparisonMarkup(field, CrewDesign.history(people[0].id, field), metric.unit)}<div class="orbit-detail-list"><h3>${isReport ? 'Recent reports' : 'Recent readings'}</h3>${values ? `<ol>${values}</ol>` : '<p>No readings have been recorded yet.</p>'}</div><button type="button" class="orbit-panel-action" data-detail-history="${field}">View in history ↗</button>`;
}
function toggleReadingDetail(button, open = null) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  const shouldOpen = open ?? !expanded;
  sectionContent.querySelectorAll('.orbit-reading-detail').forEach(detail => detail.remove());
  sectionContent.querySelectorAll('[data-reading-detail]').forEach(row => row.setAttribute('aria-expanded', 'false'));
  if (!shouldOpen) return;
  button.setAttribute('aria-expanded', 'true');
  button.insertAdjacentHTML('afterend', `<div class="orbit-reading-detail">${measurementDetailsMarkup(button.dataset.readingDetail)}</div>`);
}
function measurementDetail(field) {
  if (!CrewDesign.metrics[field] && !['mood', 'sleepQuality'].includes(field)) return;
  showSection('today', null);
  setActiveDashboard('today');
  const button = sectionContent.querySelector(`[data-reading-detail="${field}"]`);
  if (button) { if (button.closest('details')) button.closest('details').open = true; toggleReadingDetail(button, true); button.focus({ preventScroll: true }); button.scrollIntoView({ block: 'nearest' }); }
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
  const selfReports = [['mood', 'Mood'], ['sleepQuality', 'Sleep quality']].filter(([field]) => summary[field]?.time).map(([field, label]) => `<li><strong>${label}:</strong> ${escapeHtml(summary[field].value)} · ${escapeHtml(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(summary[field].time)))}</li>`).join('');
  const status = assessment.priority === 'urgent'
    ? '<div class="orbit-advice-alert" data-priority="urgent"><strong>Urgent symptoms were recorded.</strong><p>Alert a crew member and follow the mission emergency procedure now.</p></div>'
    : assessment.priority === 'attention'
      ? '<div class="orbit-advice-alert" data-priority="attention"><strong>Symptoms were recorded.</strong><p>Review them with the flight medical team and follow mission procedures.</p></div>'
      : assessment.priority === 'recorded'
        ? `<div class="orbit-advice-alert" data-priority="clear"><strong>About this summary</strong><p>These are saved readings and reports, not a medical assessment. Follow your medical team’s guidance.</p></div>`
        : `<div class="orbit-advice-alert" data-priority="attention"><strong>${escapeHtml(assessment.title)}</strong><p>${escapeHtml(assessment.explanation)} ${escapeHtml(assessment.nextAction)}</p></div>`;
  const trendFields = [['pulse', 'Heart rate'], ['pressure', 'Blood pressure'], ['oxygen', 'Oxygen saturation'], ['glucose', 'Blood glucose'], ['weight', 'Body mass']];
  const trends = trendFields.map(([field, label]) => {
    const rows = CrewDesign.history(summary.person.id, field);
    if (!rows.length) return `<li><strong>${label}:</strong> No saved reading yet.</li>`;
    const latest = rows.at(-1), previous = rows.at(-2);
    const display = item => field === 'pressure' ? `${item.value.systolic}/${item.value.diastolic} mmHg` : `${item.value} ${CrewDesign.metrics[field].unit}`;
    const change = !previous ? 'One reading saved; another is needed to show a trend.' : field === 'pressure'
      ? `Change since previous: systolic ${Number(latest.value.systolic) - Number(previous.value.systolic) >= 0 ? '+' : ''}${Number(latest.value.systolic) - Number(previous.value.systolic)}, diastolic ${Number(latest.value.diastolic) - Number(previous.value.diastolic) >= 0 ? '+' : ''}${Number(latest.value.diastolic) - Number(previous.value.diastolic)} mmHg.`
      : `Change since previous: ${Number(latest.value) - Number(previous.value) >= 0 ? '+' : ''}${Math.round((Number(latest.value) - Number(previous.value)) * 10) / 10} ${CrewDesign.metrics[field].unit}.`;
    return `<li><strong>${label}:</strong> ${escapeHtml(display(latest))}<br><span>${escapeHtml(change)}</span></li>`;
  }).join('');
  return `<p class="orbit-panel-kicker">YOUR RECORD / INFORMATION</p><h2 id="section-title">Guidance</h2><p class="orbit-section-lede">General information about spaceflight health. For your saved measurements, visit Readings or History.</p><button type="button" class="orbit-inline-link" data-open-feedback>Share feedback ↗</button>${status}<details class="orbit-research-card orbit-guidance-summary"><summary>Saved readings summary</summary><h3>Latest saved readings and check-ins</h3>${recorded || selfReports ? `<ul class="orbit-advice-readings">${recorded}${selfReports}</ul>` : '<p>No readings have been saved yet. Save readings to see them summarized here.</p>'}<h3>Changes in this astronaut’s readings</h3><ul class="orbit-advice-readings">${trends}</ul><p>These are descriptive changes between saved measurements, not a medical judgment that a value is good or bad.</p></details><section class="orbit-research-card"><h3>NASA research and next steps</h3><p>NASA describes fluid shifts toward the head and cardiovascular adaptation in microgravity. Compare measurements taken under similar conditions with the astronaut’s own baseline, and follow mission medical limits. Sleep, mood, hydration, and exercise records can add context to how the crew member is adapting to isolation, confinement, and mission workload.</p><p>NASA’s public sources do not set one universal in-flight healthy range for heart rate, blood pressure, oxygen saturation, glucose, or body mass. Review changes and symptoms with the flight medical team; follow mission emergency procedures for urgent symptoms.</p><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/cardiovascular-and-vision/" target="_blank" rel="noopener noreferrer">NASA cardiovascular research ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-hypoxia/" target="_blank" rel="noopener noreferrer">NASA hypoxia research ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noopener noreferrer">NASA spaceflight health risks ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/treat/medical-examination-requirements-mer-for-former-astronauts/" target="_blank" rel="noopener noreferrer">NASA astronaut medical surveillance ↗</a></section>`;
}
function deviceMessage(text, error = false) {
  const element = sectionContent.querySelector('[data-device-message]');
  if (!element) return;
  element.textContent = text;
  element.dataset.error = String(error);
}
function deviceSceneMarkup() {
  return renderDeviceScene({ devices: sensors.map(([field, name]) => ({ field, name: deviceConnections.get(field)?.device.name || name, connected: deviceConnections.has(field), reading: deviceLatestReadings.has(field) ? describeDeviceReading(field, deviceLatestReadings.get(field)) : '' })), supported: typeof navigator.bluetooth?.requestDevice === 'function' });
}
function refreshDeviceRows() {
  if (hub.dataset.panel === 'device') {
    const previous = sectionContent.querySelector('[data-device-message]');
    const message = previous?.textContent || '';
    const failed = previous?.dataset.error === 'true';
    sectionContent.innerHTML = deviceSceneMarkup();
    deviceMessage(message, failed);
  }
  const list = sectionContent.querySelector('.orbit-device-list');
  if (list) list.innerHTML = deviceRows();
  if (selected !== null) renderData();
}
async function toggleDevice(field, button) {
  const existing = deviceConnections.get(field);
  if (existing) { existing.disconnect(); deviceConnections.delete(field); deviceLatestReadings.delete(field); refreshDeviceRows(); return; }
  button.disabled = true;
  button.textContent = 'Connecting…';
  deviceLatestReadings.delete(field);
  deviceMessage('Choose your device in the browser window.');
  try {
    const session = await connectCrewSensor(field, {
      onStatus: text => deviceMessage(text),
      onDisconnect: name => {
        deviceConnections.delete(field);
        deviceLatestReadings.delete(field);
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
          deviceLatestReadings.set(field, { value: reading.value, time: reading.time });
          const lastReceived = sectionContent.querySelector(`[data-device-reading="${field}"]`);
          if (lastReceived && deviceConnections.has(field)) lastReceived.textContent = describeDeviceReading(field, deviceLatestReadings.get(field));
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
function offlineStatusText() {
  if (offlineSetupFailed) return 'Offline copy unavailable in this browser.';
  if (!offlineCopyReady) return 'Preparing offline copy.';
  return navigator.onLine === false ? 'Offline · using saved copy.' : 'Offline copy ready.';
}
function updateOfflineStatus() {
  const status = hub.querySelector('[data-offline-status]');
  if (status) status.textContent = offlineStatusText();
}
function checkinSummary(summary) {
  const state = missionState(summary,CrewDesign.scenarioInfo(),anatomyHistory(summary.person.id));
  return `<div class="orbit-summary-group"><section class="orbit-action-card" data-state="${state.tone}"><span>${escapeHtml(state.label)}</span><h3>${escapeHtml(state.title)}</h3><p>${escapeHtml(state.detail)}</p>${state.key === 'emergency' ? '<button type="button" data-mission-action="overview">Return to urgent response ↗</button>' : ''}</section></div>`;
}
function createCheckinSummaryNode(summary) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = checkinSummary(summary);
  return wrapper.firstElementChild;
}
const responseCache = new Map();
let responseSaveError='';
function currentResponse(key) {
  if(responseCache.has(key))return responseCache.get(key);
  try{return readResponse(key,localStorage)}catch{return {}}
}
function saveResponse(action) {
  const summary=CrewDesign.summary(people[0].id),scenario=CrewDesign.scenarioInfo(),key=responseKey(summary,scenario);
  responseSaveError='';
  try{responseCache.set(key,recordResponse(key,action,localStorage))}
  catch{responseCache.set(key,{...currentResponse(key),[action]:new Date().toISOString()});responseSaveError='Action recorded for this session. Device storage is unavailable.'}
  renderMissionView();updateAlarmControl();
  const status=mission.querySelector('[data-response-status]');if(status)status.textContent=responseSaveError;
}
function assistanceFor(key) {
  if(assistanceCache.has(key))return assistanceCache.get(key);
  try{return readAssistance(key,localStorage)}catch{return {events:[]}}
}
function clearCollectionValidation(capture,input){
 if(input.validity?.valid&&input.hasAttribute('aria-invalid')){input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');const trigger=input.closest('.crew-select')?.querySelector('.crew-select__trigger');trigger?.removeAttribute('aria-invalid');trigger?.removeAttribute('aria-describedby');capture.querySelector('.collection-error').textContent=''}
}
function collectionDraftFields() {
  if(collectionDraft)return collectionDraft.fields;
  try{const saved=JSON.parse(sessionStorage.getItem(draftStorageKey)||'null');if(saved&&Array.isArray(saved.fields)){collectionDraft=saved;return saved.fields}}catch{}
  return [];
}
function storeCollectionDraft(capture) {
  collectionDraft={fields:collectionFields(capture),purpose:collectionMode,details:[]};checkinDraft=collectionHasEntry(collectionDraft.fields);
  const status=capture.querySelector('[data-collection-status]');
  try{sessionStorage.setItem(draftStorageKey,JSON.stringify(collectionDraft));status.textContent=checkinDraft?'Draft saved':''}catch{status.textContent=checkinDraft?'Draft kept in this session':''}
}
function syncAssistanceVoiceButton() {
 const button=mission.querySelector('[data-assist-voice]');if(!button)return;
 button.setAttribute('aria-pressed',String(assistanceVoiceActive));
 button.innerHTML=assistanceVoiceActive?'<span aria-hidden="true">■</span> Stop voice guidance':'<span aria-hidden="true">▶</span> Play spoken instructions';
}
function stopAssistanceVoice() {
 assistanceVoiceActive=false;window.speechSynthesis?.cancel();
}
function speakAssistanceStep() {
 if(!assistanceVoiceActive)return;
 const status=mission.querySelector('[data-assistance-voice-status]');
 if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
  if(status)status.textContent='Voice playback is unavailable in this browser. Follow the on-screen instructions.';
  assistanceVoiceActive=false;syncAssistanceVoiceButton();return;
 }
 const title=mission.querySelector('.assistance-view h2')?.textContent?.trim()||'';
 const instruction=mission.querySelector('.assistance-instruction,.assistance-source-view>p')?.textContent?.trim()||'';
 const answers=[...mission.querySelectorAll('.assistance-answers button')].map(button=>button.textContent.trim());
 const prompt=answers.length?`Choose the answer that best matches what you observe: ${answers.join('. ')}.`:'Follow the on-screen guidance and your mission checklist.';
 const speech=new SpeechSynthesisUtterance(`${title}. ${instruction} ${prompt}`);
 speech.lang='en-US';speech.rate=.88;speech.pitch=1;speech.volume=1;
 speech.onstart=()=>{if(status&&assistanceVoiceActive)status.textContent='Speaking this step. Select an answer when ready.'};
 speech.onend=()=>{if(status&&assistanceVoiceActive)status.textContent='Step complete. Choose the answer that best matches what you observe.'};
 window.speechSynthesis.cancel();if(status)status.textContent='Preparing voice guidance…';window.speechSynthesis.speak(speech);
}
function updateAssistance(question,answer) {
  assistanceView='steps';assistanceStarted=true;
  const key=activeAlertKey,state=question?advanceAssistance(assistanceFor(key),question,answer):{events:assistanceFor(key).events||[]};
  assistanceCache.set(key,state);let persisted=true;try{writeAssistance(key,state,localStorage)}catch{persisted=false}
  renderMissionView();
  syncAssistanceVoiceButton();speakAssistanceStep();
  const status=mission.querySelector('[data-assistance-status]');if(status){status.dataset.persisted=String(persisted);status.textContent=persisted?'Observation recorded':'Observation kept for this session'}
  mission.querySelector('.assistance-view h2')?.focus({preventScroll:true});
}
function renderMissionView(force=false) {
  const summary = CrewDesign.summary(people[0].id);
  const scenario = CrewDesign.scenarioInfo();
  const histories=anatomyHistory(summary.person.id);
  const state = missionState(summary, scenario,histories);
  const response={...currentResponse(responseKey(summary,scenario)),assistance:assistanceFor(responseKey(summary,scenario))};
  hub.dataset.severity = state.tone;
  hub.dataset.scenario = state.key;
  if (state.tone === 'urgent') {
    const key = responseKey(summary,scenario);
    hub.dataset.alertAcknowledged=String(Boolean(response.acknowledgedAt));
    if (key !== activeAlertKey) { activeAlertKey = key; assistanceModeKey='';assistanceView='steps';assistanceStarted=false;playAlertSound(); }
  } else { activeAlertKey = ''; alarm.stop(); }
  stage?.setSceneView?.(collectionMode?'collection':state.key);
  hub.dataset.collecting=String(Boolean(collectionMode));
  if(!force&&collectionMode==='guided-repeat'&&mission.querySelector('[data-repeat-form]')){syncMissionFrame();return}
  const existingCapture=mission.querySelector('[data-collect-form]');
  if(collectionMode&&existingCapture?.dataset.purpose===collectionMode){const help=existingCapture.querySelector('.collection-help'),urgent=state.key==='emergency';help.toggleAttribute('data-urgent-response',urgent);help.toggleAttribute('data-collect-urgent',!urgent);help.textContent=urgent?(summary.symptomSource==='Scenario preview'?'Urgent preview active →':'Urgent report active →'):'I need urgent help ↗';syncMissionFrame();return}
  hub.append(exploreSurface,sceneTools);
  figureObserver.disconnect();
  if(collectionMode==='guided-repeat'){
    mission.innerHTML=renderRepeat(repeatState);initializeCustomSelects(mission);initializeCustomDateTimes(mission);
  }else if(collectionMode){
    const now=new Date(),observedAt=`${localDateKey(now)}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    mission.innerHTML=renderCollection({summary,fields:collectionDraftFields(),purpose:collectionMode,symptomOptions:CrewDesign.symptomOptions,observedAt,urgent:state.key==='emergency',urgentPreview:summary.symptomSource==='Scenario preview'});
    initializeCustomSelects(mission);initializeCustomDateTimes(mission);syncCollectionSymptoms(mission.querySelector('[data-collect-form]'));syncCollectionMeasurement(mission.querySelector('[data-collect-form]'));
  }else{
    mission.innerHTML=renderMission({summary,histories,scenario,connected:deviceConnections.size,response,draft:checkinDraft,urgentReturn:urgentReturnView});
    if(state.key==='emergency'&&assistanceModeKey===activeAlertKey){
      mission.querySelector('.urgent-page')?.setAttribute('data-assisting','true');
      const focus=mission.querySelector('.care-focus'),silence=focus.querySelector('[data-alert-ack]');
      focus.innerHTML=renderAssistance(response.assistance,summary.person.name,assistanceView,handoffText(summary,scenario,response,histories),assistanceStarted?'steps':'response');const utilities=focus.querySelector('.assistance-utilities');if(silence&&utilities)utilities.append(silence);
    }
  }
  const figure=mission.querySelector('[data-figure-space]');
  if(hub.dataset.uiVariant==='glass'&&figure){figure.append(exploreSurface,sceneTools);figureObserver.observe(figure)}
  syncMissionFrame();
}
function leaveMission() {
  mission.hidden = true;
  hub.querySelector('[data-scene-back]').hidden = true;
  hub.dataset.workspace = 'task';
  stage?.setMissionView?.(false);
  stage?.setSceneFrame(null);
}
function showMission(focus = true) {
  collectionMode='';
  if (!CrewDesign.hasProfile()) { openOnboarding(); return; }
  exitAnatomy();
  if (hub.dataset.panel) closeContextPanel(false);
  contextHistory = [];
  selected = 0;
  recording = false;
  stage?.setRecording(false);
  hub.dataset.recording = 'false';
  hub.dataset.mode = 'overview';
  hub.dataset.workspace = 'mission';
  hub.querySelector('[data-scene-back]').hidden = true;
  setActiveDashboard('overview');
  mission.scrollTop = 0;
  delete hub.dataset.selected;
  profile.hidden = true;
  profile.inert = false;
  onboarding.hidden = true;
  actors.inert = true;
  mobileControls.forEach(item => { item.inert = true; });
  stage?.resume();
  stage?.overview();
  stage?.setMissionView?.(true);
  mission.hidden = false;
  renderMissionView();
  animateContext(mission);
  if (focus) (mission.querySelector('#urgent-action-title')||mission.querySelector('h1'))?.focus({ preventScroll: true });
}
function updateAlarmControl(state = alarm.state) {
  const button = hub.querySelector('[data-alert-sound]');
  button.dataset.playback = state;
  const urgent = hub.dataset.severity === 'urgent' && hub.dataset.alertAcknowledged !== 'true';
  button.textContent = !alertSoundEnabled ? 'Audio muted' : state === 'playing' ? 'Silence alarm' : state === 'starting' ? 'Starting audio…' : urgent ? 'Enable alarm audio' : 'Audio enabled';
  button.setAttribute('aria-pressed', String(alertSoundEnabled));
  button.setAttribute('aria-label', button.textContent);
  button.title = button.textContent;
}
function playAlertSound() {
  if (alertSoundEnabled && hub.dataset.alertAcknowledged !== 'true') alarm.start();
}
window.addEventListener('pagehide', () => alarm.stop());
document.addEventListener('visibilitychange', () => { if (document.hidden) alarm.stop(); else updateAlarmControl(); });
function endRequestedHelpMode(){
  const result=CrewDesign.endUrgentAssistance(people[0].id);
  if(result.ended&&collectionDraft){
    const previous=CrewDesign.summary(people[0].id),fields=collectionDraft.fields;
    if(fields.some(field=>field.name==='symptoms'&&field.value==='urgent')){
      collectionDraft.fields=fields.filter(field=>field.name!=='symptoms');
      if(previous.symptoms)collectionDraft.fields.push({name:'symptoms',value:previous.symptoms,checked:true});
      checkinDraft=collectionHasEntry(collectionDraft.fields);
      try{sessionStorage.setItem(draftStorageKey,JSON.stringify(collectionDraft))}catch{}
    }
  }
  return result;
}
function startCheckin(fromReading=false,purpose='daily') {
  urgentReturnView='';
  if(!CrewDesign.hasProfile()){pendingDashboardSection='checkin';openOnboarding(false);return}
  collectionDraftFields();endRequestedHelpMode();
  if(CrewDesign.scenarioInfo().key==='emergency'){CrewDesign.setScenario('routine');const select=hub.querySelector('[data-scenario]');select.value='routine';syncCustomSelects(hub.querySelector('.orbit-scenario-control'))}
  checkinReturn=currentContext();
  let fields=collectionDraftFields();
  const summary=CrewDesign.summary(people[0].id);
  if(missionState(summary,CrewDesign.scenarioInfo()).key==='emergency'&&summary.symptomSource!=='Scenario preview'){fields=urgentCollectionFields(fields,summary);collectionDraft={fields,purpose:collectionDraft?.purpose||purpose,details:[]}}
  if(fields.length&&checkinDraft)purpose=collectionDraft?.purpose||'full';
  if(purpose==='repeat')purpose='full';
  showMission(false);collectionMode=purpose;renderMissionView();
  if(fromReading&&!fields.length){const capture=mission.querySelector('[data-collect-form]');if(capture){capture.elements.measuredAt.value=`${selectedReadingDate}T${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;syncCustomDateTimes(capture)}}
  animateContext(mission);mission.querySelector('.collection-heading h1')?.focus({preventScroll:true});
}

function storeRepeatDraft(){
 const capture=mission.querySelector('[data-repeat-form]');
 if(capture?.dataset.phase==='entry'&&repeatState?.phase==='entry')repeatState.fields=collectionFields(capture);
 try{sessionStorage.setItem(repeatStorageKey,JSON.stringify(repeatState))}catch{}
}
function startRepeat(field){
 const summary=CrewDesign.summary(people[0].id);
 if(missionState(summary,CrewDesign.scenarioInfo()).key==='emergency'){showMission();return}
 const baseline=CrewDesign.history(people[0].id,field).at(-1);
 try{
  let saved=repeatState;
  if(!saved)try{saved=JSON.parse(sessionStorage.getItem(repeatStorageKey)||'null')}catch{}
  const valid=saved?.field===field&&saved.phase!=='result'&&['guide','entry'].includes(saved.phase)&&Number.isInteger(saved.step)&&saved.step>=0&&saved.step<measurementGuides[field].steps.length&&Array.isArray(saved.fields);
  repeatState=createRepeat(field,baseline);
  if(valid)try{repeatState={...createRepeat(field,saved.baseline),...saved}}catch{}
 }catch{return}
 const capture=mission.querySelector('[data-collect-form]');if(capture)storeCollectionDraft(capture);
 repeatReturn=currentContext();showMission(false);collectionMode='guided-repeat';renderMissionView();storeRepeatDraft();animateContext(mission);mission.querySelector('h1')?.focus({preventScroll:true});
}
function closeRepeat(){
 storeRepeatDraft();
 if(repeatState?.phase==='result'){repeatState=null;try{sessionStorage.removeItem(repeatStorageKey)}catch{}}
 const destination=repeatReturn||{section:'mission'};repeatReturn=null;collectionMode='';restoreContext(destination);
}
function showRepeatStep(){
 storeRepeatDraft();renderMissionView(true);animateContext(mission);mission.querySelector('.repeat-editor h2,.repeat-editor h3')?.focus({preventScroll:true});
}

function sectionMarkup(section) {
  const summary = CrewDesign.summary(people[0].id);
  const name = escapeHtml(summary.person.name);
  if (section === 'today') return `<p class="orbit-panel-kicker">MISSION HEALTH / DAILY OVERVIEW</p><h2 id="section-title">Today</h2><p class="orbit-section-lede">Today’s readings and next action.</p>${checkinSummary(summary)}<div class="orbit-reading-actions"><button class="orbit-primary-action" type="button" data-today-record>${checkinDraft ? 'Continue health check' : '+ Start health check'}</button><button class="orbit-inline-link" type="button" data-open-device>Manage devices ↗</button></div><details class="orbit-date-disclosure"><summary>Viewing <span data-today-date>${readingDateText(selectedReadingDate)}</span> · Change date</summary><div class="orbit-reading-date"><span id="reading-date-label">Viewing date</span><button type="button" class="orbit-reading-date-trigger" data-reading-calendar-toggle aria-labelledby="reading-date-label reading-date-value" aria-expanded="false" aria-controls="reading-calendar"><span id="reading-date-value" data-reading-date-label>${readingDateText(selectedReadingDate)}</span><span class="orbit-reading-date-icon" aria-hidden="true">▦</span></button><div id="reading-calendar" class="orbit-reading-calendar" data-reading-calendar role="group" aria-label="Choose reading date" hidden></div></div></details><div class="orbit-today-list">${readingRows(summary.person.id)}</div><button class="orbit-inline-link orbit-context-help" type="button" data-open-guidance>Understanding your readings ↗</button><p class="orbit-local-note">Readings stay in this browser. <span data-offline-status>${offlineStatusText()}</span></p>`;
  if (section === 'device') return `<p class="orbit-panel-kicker">MISSION HEALTH / CONNECTIONS</p><h2 id="section-title">Devices</h2><p class="orbit-section-lede">Connect a compatible sensor to receive readings while this page is open.</p><div class="orbit-device-list">${deviceRows()}</div><p class="orbit-device-message" data-device-message role="status">Choose a device type to start pairing.</p><details class="orbit-device-help"><summary>How to connect</summary><ol><li>Turn on Bluetooth and put your sensor into pairing mode.</li><li>Choose Connect beside the matching device type, then select your device in the browser.</li><li>For a cuff or oximeter, take a measurement on the device. A connected device may not send readings continuously.</li></ol><p>Pairing requires a supported browser and a secure connection. This page cannot collect readings in the background.</p></details><details class="orbit-device-help"><summary>Compatibility and privacy</summary><p>Devices must expose a compatible Bluetooth service. Many glucose monitors use a manufacturer’s app and cannot connect directly.</p><p>Readings are saved in this browser, not sent to an online account.</p></details><a class="orbit-source-link" href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API" target="_blank" rel="noopener noreferrer">Browser Bluetooth support ↗</a>`;
  if (section === 'research') return `<p class="orbit-panel-kicker">SPACEFLIGHT HEALTH / NASA RESEARCH</p><h2 id="section-title">What changes in space?</h2><p class="orbit-section-lede">According to NASA research, readings depend on the individual astronaut, mission phase, environment, and flight medical procedure.</p><article class="orbit-research-card"><h3>Five hazards of human spaceflight</h3><p>NASA groups mission risks as space radiation, isolation and confinement, distance from Earth, altered gravity fields, and hostile or closed environments. These hazards can affect bone and muscle, circulation, sleep, immune response, and behavioral health. No single wearable reading measures all of these risks.</p><p>Track heart rate, blood pressure, oxygen, temperature, sleep, mood, hydration, and activity over time. Radiation dose and environmental conditions require dedicated mission instruments and procedures.</p><a class="orbit-source-link" href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noopener noreferrer">NASA: five hazards ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noopener noreferrer">NASA: spaceflight health risks ↗</a></article><article class="orbit-research-card"><h3>Heart and circulation</h3><p>NASA describes body fluids shifting toward the head in microgravity and cardiovascular adaptation. Some astronauts experience dizziness or fainting after return to gravity; NASA uses clinical monitoring and mission-specific procedures.</p><p class="orbit-research-note">NASA’s public research does not give one universal in-flight “healthy astronaut” range for heart rate, blood pressure, or oxygen saturation for this dashboard. Use the astronaut’s baseline and mission-approved limits.</p><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/cardiovascular-and-vision/" target="_blank" rel="noopener noreferrer">NASA cardiovascular monitoring ↗</a></article><article class="orbit-research-card"><h3>Oxygen and wearable measurements</h3><p>NASA studies hypoxia risk in mission and spacesuit scenarios. NASA and partner research has used wearable sensors to monitor heart activity, breathing, sleep, and oxygen-related measurements; each device and mission protocol determines what is measured.</p><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-hypoxia/" target="_blank" rel="noopener noreferrer">NASA hypoxia research ↗</a><a class="orbit-source-link" href="https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/" target="_blank" rel="noopener noreferrer">NASA wearable research ↗</a></article><article class="orbit-research-card"><h3>Glucose</h3><p>NASA’s astronaut medical surveillance includes laboratory fasting blood glucose and HbA1c testing. That public schedule is not an in-flight glucose target; interpret a sensor reading with its units, timing, individual medical plan, and flight medical team.</p><a class="orbit-source-link" href="https://www.nasa.gov/directorates/esdmd/hhp/treat/medical-examination-requirements-mer-for-former-astronauts/" target="_blank" rel="noopener noreferrer">NASA medical surveillance ↗</a></article><article class="orbit-research-card"><h3>Body mass</h3><p>NASA explains that mass is measured in flight using equipment such as SLAMMD, because a conventional scale relies on gravity. Compare body-mass records taken with the approved mission device.</p><a class="orbit-source-link" href="https://www.nasa.gov/wp-content/uploads/2024/10/2024-space-nutrition-2nd-edition-2024.pdf" target="_blank" rel="noopener noreferrer">NASA space nutrition research ↗</a></article><article class="orbit-research-card"><h3>Radiation</h3><p>NASA tracks space radiation with dedicated monitoring and dosimetry. A heart-rate or oxygen sensor cannot tell radiation dose; NASA describes long-term health risks that depend on exposure and mission context.</p><a class="orbit-source-link" href="https://www.nasa.gov/hrp/hazard-space-radiation/" target="_blank" rel="noopener noreferrer">NASA space-radiation research ↗</a></article><article class="orbit-research-card"><h3>Bone and muscle</h3><p>NASA reports average bone-density loss of about 1%–1.5% per month in weight-bearing bones during four-to-six-month missions. Rates vary; NASA uses exercise countermeasures and bone scans to monitor changes.</p><a class="orbit-source-link" href="https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/" target="_blank" rel="noopener noreferrer">NASA bone-health research ↗</a></article><p class="orbit-local-note">This is an educational summary of public NASA research. Follow the flight medical procedure for personal interpretation and care.</p>`;
  if (section === 'guidance') return adviceMarkup(summary, anatomyHistory(summary.person.id));
  if (section === 'feedback') return `<p class="orbit-panel-kicker">CREW / FEEDBACK</p><h2 id="section-title">Feedback</h2><section class="orbit-research-card"><h3>Share feedback</h3><p>Your note helps improve how the readings and NASA research are presented.</p><form class="orbit-feedback-form" data-feedback-form><label for="feedback-rating">How useful is this dashboard?</label><select id="feedback-rating" name="rating"><option value="">Choose a rating</option><option value="5">5 · Very useful</option><option value="4">4 · Useful</option><option value="3">3 · Not sure</option><option value="2">2 · Needs work</option><option value="1">1 · Not useful</option></select><label for="feedback-message">Your feedback</label><textarea id="feedback-message" name="message" rows="4" maxlength="800" required placeholder="Write a few notes"></textarea><p class="orbit-feedback-confirmation" role="status"></p><button class="orbit-panel-action" type="submit">Save feedback</button></form><p class="orbit-local-note">Feedback stays in this browser; it is not sent to NASA or anyone else.</p></section>`;
  return '';
}
function showSection(section, source) {
  if (!CrewDesign.hasProfile()) { openOnboarding(false); return; }
  if (selected === null) showPerson(0);
  setContextPanel(section, source);
  try {
    sectionContent.innerHTML = section === 'device' ? deviceSceneMarkup() : sectionMarkup(section);
    initializeCustomSelects(sectionContent);
    initializeCustomDateTimes(sectionContent);
  } catch (error) {
    console.error(`Could not open dashboard section: ${section}`, error);
    sectionContent.innerHTML = `<h2 id="section-title">This section could not open</h2><p class="orbit-section-lede">Please try again. Your saved profile and readings are still here.</p><button type="button" class="orbit-panel-action" data-section-retry="${escapeHtml(section)}">Try again</button>`;
  }
  sectionPanel.setAttribute('aria-label', section === 'research' ? 'NASA spaceflight health research' : section === 'device' ? 'Link a health device' : section);
  sectionPanel.hidden = false;
  syncBackControls();
  sectionPanel.scrollTop = 0;
  animateContext(sectionPanel);
  const title = sectionContent.querySelector('#section-title, #device-scene-title');
  title?.setAttribute('tabindex', '-1'); title?.focus({ preventScroll: true });
}
function navigateDashboard(section, source) {
  if (!CrewDesign.hasProfile()) { pendingDashboardSection = section; openOnboarding(false); return; }
  onboarding.hidden = true;
  if (section === 'checkin') { startCheckin(); return; }
  if (section === 'profile' || section === 'today') { showMission(); return; }
  if (section === 'history') {
    setActiveDashboard('history');
    if (selected === null) selected = 0;
    showHistory(source);
    return;
  }
  if (section === 'weights') { showMission(); return; }
  if (section === 'advice' || section === 'research') section = 'guidance';
  setActiveDashboard(section);
  showSection(section, source);
}
function openOnboarding(edit = false) {
  profileReturn=currentContext();
  leaveMission();
  profile.hidden = true;
  if (hub.dataset.panel) closeContextPanel(false);
  const existing = CrewDesign.getProfile();
  profileForm.elements.name.value = existing?.name || '';
  profileForm.elements.age.value = existing?.age ?? '';
  profileForm.elements.bodyMass.value = existing?.bodyMass ?? '';
  syncCustomSelects(profileForm);
  profileForm.querySelector('.orbit-profile-error').textContent = '';
  hub.querySelector('#profile-setup-title').textContent = edit ? 'Your profile' : 'Create your profile';
  profileForm.querySelector('button[type="submit"]').textContent = edit ? 'Save changes' : 'Save profile';
  profileForm.querySelector('[data-cancel-profile]').hidden = !existing;
  onboarding.hidden = false;
  stage?.resume();stage?.setMissionView?.(true);stage?.setSceneView?.('collection');hub.dataset.collecting='true';
  figureObserver.disconnect();const figure=onboarding.querySelector('[data-figure-space]');figure.append(exploreSurface);figureObserver.observe(figure);syncMissionFrame();animateContext(onboarding);
  profileForm.elements.name.focus({ preventScroll: true });
}
profileForm.querySelector('[data-cancel-profile]').addEventListener('click', () => {
  onboarding.hidden = true;
  const destination=profileReturn;profileReturn=null;restoreContext(destination);
});
profileForm.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');event.target.removeAttribute('aria-describedby');profileForm.querySelector('.orbit-profile-error').textContent=''});
profileForm.addEventListener('submit', event => {
  event.preventDefault();
  const invalid=[...profileForm.elements].find(input=>input.willValidate&&!input.validity.valid);
  if(invalid){invalid.setAttribute('aria-invalid','true');invalid.setAttribute('aria-describedby','profile-error');profileForm.querySelector('.orbit-profile-error').textContent=invalid.name==='name'?'Enter your full name.':invalid.validationMessage;invalid.focus({preventScroll:true});return}

  try {
    const prior = CrewDesign.getProfile();
    CrewDesign.saveProfile(profileForm.elements.name.value, CrewDesign.getProfile()?.model || 'male', profileForm.elements.age.value, profileForm.elements.bodyMass.value);
    const mass = profileForm.elements.bodyMass.value;
    if (mass && Number(mass) > 0 && String(prior?.bodyMass ?? '') !== String(mass)) CrewDesign.saveOverview(people[0].id, { weight: mass }, '', { source: 'Profile body mass' });
    onboarding.hidden = true;
    appNav.hidden = false;
    renderData();
    if (selected === null) showPerson(0);
    const pending = pendingDashboardSection;
    pendingDashboardSection = null;
    if (pending) navigateDashboard(pending, appNav.querySelector(`[data-mission-action="${pending}"]`));
    else showMission();
  } catch (error) {
    profileForm.querySelector('.orbit-profile-error').textContent = error.message || 'Could not save this profile on the device.';
  }
});
profile.addEventListener('scroll', syncProfileScroll, { passive: true });
window.addEventListener('resize', syncProfileScroll, { passive: true });
hub.addEventListener('pointerdown', event => {
  if (!mission.hidden && (event.target.closest('[data-scene-explore]') || event.target === canvas || event.target === hub) && event.button === 0 && stage?.beginExplore) {
    gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, exploring: true };
    event.preventDefault();
    const surface = hub.querySelector('[data-scene-explore]');
    surface.dataset.pointerFocus = 'true';
    surface.focus({ preventScroll: true });
    hub.setPointerCapture(event.pointerId);
    hub.dataset.exploring = 'true';
    stage.beginExplore();
    return;
  }
  const control = event.target.closest('button,input,select,form');
  if (!mission.hidden || people.length < 2 || hub.dataset.panel || selected === null || recording || anatomyMode || event.button !== 0 || !stage?.beginDrag || (control && control !== figureButton)) return;
  gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
  stage.beginDrag();
});
hub.addEventListener('pointermove', event => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (gesture.exploring) { stage.exploreTo(dx / Math.max(1, hub.clientWidth), dy / Math.max(1, hub.clientHeight)); return; }
  if (!gesture.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
    gesture.dragging = true;
    hub.setPointerCapture(event.pointerId);
  }
  if (gesture.dragging) stage.dragTo(dx / Math.max(1, hub.clientWidth));
});
function endGesture(event) {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  if (gesture.exploring) {
    stage?.endExplore(event.type === 'pointercancel' || event.type === 'lostpointercapture');
    gesture = null;
    delete hub.dataset.exploring;
    if (hub.hasPointerCapture(event.pointerId)) hub.releasePointerCapture(event.pointerId);
    return;
  }
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
hub.addEventListener('lostpointercapture', endGesture);
hub.querySelector('[data-scene-reset]').addEventListener('click', () => stage?.resetScene());
hub.querySelector('[data-scene-explore]').addEventListener('blur', event => { delete event.target.dataset.pointerFocus; });
hub.querySelector('[data-scene-explore]').addEventListener('keydown', event => {
  delete event.target.dataset.pointerFocus;
  const movement = { ArrowLeft: [-.18, 0], ArrowRight: [.18, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05] }[event.key];
  if (movement) stage?.rotateScene(...movement);
  else if (event.key === 'Home') stage?.resetScene();
  else if (['+', '='].includes(event.key)) stage?.zoomScene(-.25);
  else if (event.key === '-') stage?.zoomScene(.25);
  else return;
  event.preventDefault(); event.stopPropagation();
});
hub.addEventListener('wheel', event => {
  if (!mission.hidden && event.target.closest('[data-scene-explore]') && innerWidth >= 768 && stage?.zoomScene) {
    stage.zoomScene(Math.max(-.2, Math.min(.2, event.deltaY * .002)));
    event.preventDefault(); return;
  }
  if (!mission.hidden || hub.dataset.panel || selected === null || recording || anatomyMode || innerWidth < 768 || !stage?.scrubBy || event.target.closest('form, .orbit-profile-readings')) return;
  stage.scrubBy(event.deltaY * (event.deltaMode === 1 ? 16 : 1));
  event.preventDefault();
}, { passive: false });
hub.addEventListener('click', event => {
  if (event.target.closest('[data-alert-sound]')) {
    const urgent = hub.dataset.severity === 'urgent' && hub.dataset.alertAcknowledged !== 'true';
    if (urgent && alarm.state !== 'playing') { alertSoundEnabled = true; playAlertSound(); }
    else { alertSoundEnabled = !alertSoundEnabled; if (!alertSoundEnabled) alarm.stop(); }
    updateAlarmControl(); return;
  }
  if (event.target.closest('[data-alert-ack]')) { alarm.stop(); saveResponse('acknowledgedAt'); mission.querySelector('.mission-response')?.setAttribute('tabindex', '-1'); mission.querySelector('.mission-response')?.focus({ preventScroll: true }); return; }
  if(event.target.closest('[data-assist-voice]')){
    if(assistanceVoiceActive){stopAssistanceVoice();const status=mission.querySelector('[data-assistance-voice-status]');if(status)status.textContent='Voice guidance stopped. The written instructions remain available.'}
    else{alarm.stop();updateAlarmControl();assistanceVoiceActive=true;speakAssistanceStep()}
    syncAssistanceVoiceButton();return
  }
  if(event.target.closest('[data-assist-open]')){stopAssistanceVoice();assistanceModeKey=activeAlertKey;assistanceView='steps';assistanceStarted=true;alarm.stop();updateAlarmControl();renderMissionView();mission.querySelector('.assistance-view h2')?.focus({preventScroll:true});return}
  if(event.target.closest('[data-assist-close]')){stopAssistanceVoice();assistanceModeKey='';assistanceView='steps';assistanceStarted=false;renderMissionView();mission.querySelector('[data-assist-open]')?.focus({preventScroll:true});return}
  const assistView=event.target.closest('[data-assist-view]');if(assistView){stopAssistanceVoice();if(assistView.dataset.assistView==='response'){assistanceModeKey='';assistanceView='steps';assistanceStarted=false}else{assistanceModeKey=activeAlertKey;assistanceView=assistView.dataset.assistView}renderMissionView();mission.querySelector('.assistance-view h2,#urgent-action-title')?.focus({preventScroll:true});return}
  if(event.target.closest('[data-assist-reassess]')){updateAssistance();return}
  const observation=event.target.closest('[data-assist-question]');if(observation){updateAssistance(observation.dataset.assistQuestion,observation.dataset.assistAnswer);return}
  const repeatButton=event.target.closest('[data-repeat-measurement]');if(repeatButton){startRepeat(repeatButton.dataset.repeatMeasurement);return}
  if(event.target.closest('[data-repeat-close]')){closeRepeat();return}
  if(event.target.closest('[data-repeat-urgent]')){urgentReturnView='repeat';storeRepeatDraft();CrewDesign.requestUrgentAssistance(people[0].id);showMission();return}
  if(event.target.closest('[data-repeat-next]')){if(repeatState.step===measurementGuides[repeatState.field].steps.length-1)repeatState.phase='entry';else repeatState.step++;showRepeatStep();return}
  if(event.target.closest('[data-repeat-back]')){repeatState.step=Math.max(0,repeatState.step-1);showRepeatStep();return}
  if(event.target.closest('[data-repeat-guide]')){storeRepeatDraft();repeatState.phase='guide';showRepeatStep();return}
  // A selected radio emits no change event when a saved answer is clicked again.
  const feeling=event.target.closest('[data-collect-form] input[name="symptoms"]');
  if(feeling?.checked){const capture=feeling.form;syncCollectionSymptoms(capture);navigateCollection(capture,{view:['concerning','urgent'].includes(feeling.value)?'symptoms':'today'});storeCollectionDraft(capture);mission.scrollTop=0;syncMissionFrame();return}
  const collectionNav=event.target.closest('[data-collection-measure],[data-collection-view],[data-collect-symptoms]');
  if(collectionNav){const capture=collectionNav.closest('[data-collect-form]');navigateCollection(capture,{measurement:collectionNav.dataset.collectionMeasure,view:collectionNav.hasAttribute('data-collect-symptoms')?'symptoms':collectionNav.dataset.collectionView});storeCollectionDraft(capture);mission.scrollTop=0;syncMissionFrame();return}
  const guideAbout=event.target.closest('[data-guide-about]');
  if(guideAbout){const guide=guideAbout.closest('[data-measure-guide]');const visual=guide.querySelector('.measurement-visual');visual.style.minHeight=`${visual.offsetHeight}px`;guide.dataset.about=String(guide.dataset.about!=='true');guide.querySelector('.measurement-source').hidden=guide.dataset.about!=='true';guide.querySelector(guide.dataset.about==='true'?'.measurement-source h3':'[data-guide-step]:not([hidden]) h3')?.focus({preventScroll:true});return}
  const skipGuide=event.target.closest('[data-guide-skip]');if(skipGuide){const guide=skipGuide.closest('[data-measure-guide]');guide.open=false;guide.dataset.about='false';guide.closest('[data-collection-metric]').querySelector('input')?.focus({preventScroll:true});return}
  const guideButton=event.target.closest('[data-guide-next],[data-guide-back]');if(guideButton){advanceMeasurementGuide(guideButton);return}
  if(event.target.closest('[data-collect-close]')){collectionMode='';const destination=checkinReturn||{section:'mission'};checkinReturn=null;restoreContext(destination);return}
  if(event.target.closest('[data-urgent-response]')){const capture=mission.querySelector('[data-collect-form]');if(capture)storeCollectionDraft(capture);showMission();return}
  if(event.target.closest('[data-urgent-repeat-return]')){endRequestedHelpMode();if(repeatState&&missionState(CrewDesign.summary(people[0].id),CrewDesign.scenarioInfo()).key!=='emergency'){showMission(false);collectionMode='guided-repeat';renderMissionView();animateContext(mission);mission.querySelector('h1')?.focus({preventScroll:true})}else startCheckin();return}
  if(event.target.closest('[data-exit-urgent-preview]')){const select=hub.querySelector('[data-scenario]');select.value='routine';syncCustomSelects(hub.querySelector('.orbit-scenario-control'));CrewDesign.setScenario('routine');showMission();return}
  if(event.target.closest('[data-collect-urgent]')){
    urgentReturnView='checkin';
    const capture=mission.querySelector('[data-collect-form]');storeCollectionDraft(capture);const payload=collectionPayload(collectionFields(capture));
    const result=CrewDesign.requestUrgentAssistance(people[0].id,payload.details);showMission();
    if(!result.persisted){const message=mission.querySelector('[data-response-status]');if(message)message.textContent='Urgent report is not saved. Get crew assistance now.'}
    return;
  }
  if(event.target.closest('[data-care-wellbeing]')){startCheckin();return}
  if(event.target.closest('[data-copy-handoff]')) {
    const container=event.target.closest('.care-handoff'),text=container.querySelector('textarea'),status=container.querySelector('[role=status]');
    const fallback=()=>{text.focus();text.select();status.textContent='Select and copy the summary. Nothing has been sent.'};
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text.value).then(()=>{status.textContent='Copied. Share through the mission channel.'}).catch(fallback);else fallback();return;
  }
  if (event.target.closest('[data-scene-back]')) { navigateBack(); return; }
  const metricLink = event.target.closest('[data-open-metric]');
  if (metricLink) { contextHistory = []; historyMetric = metricLink.dataset.openMetric; historyScenePosition = null; showHistory(metricLink); return; }
  const historyField = event.target.closest('[data-history-scene-field]');
  if (historyField) { if(historyMetric===historyField.dataset.historySceneField)return; historyMetric = historyField.dataset.historySceneField; historyScenePosition = null; renderHistorySceneView(); timeline.querySelector(`[data-history-scene-field="${historyMetric}"]`)?.focus({ preventScroll: true }); return; }
  const historyDays = event.target.closest('[data-history-scene-days]');
  if (historyDays) { if(historyTrendDays===Number(historyDays.dataset.historySceneDays))return; historyTrendDays = Number(historyDays.dataset.historySceneDays); historyScenePosition = null; renderHistorySceneView(); timeline.querySelector(`[data-history-scene-days="${historyTrendDays}"]`)?.focus({ preventScroll: true }); return; }
  const task = event.target.closest('[data-mission-action]');
  if (task) {
    if (task.dataset.missionAction === 'overview') { showMission(); return; }
    contextHistory = [];
    navigateDashboard(task.dataset.missionAction, task);
    return;
  }

  if (event.target.closest('[data-nav]')) return;
  const navigationRetry = event.target.closest('[data-nav-retry]');
  if (navigationRetry) {
    navigateDashboard(navigationRetry.dataset.navRetry, appNav.querySelector(`[data-mission-action="${navigationRetry.dataset.navRetry}"]`));
    return;
  }
  const readingToggle = event.target.closest('[data-reading-calendar-toggle]');
  if (readingToggle) {
    const calendar = sectionContent.querySelector('[data-reading-calendar]');
    if (!calendar.hidden) closeReadingCalendar();
    else {
      const [year, month] = selectedReadingDate.split('-').map(Number);
      readingCalendarMonth = new Date(year, month - 1, 1);
      calendar.innerHTML = readingCalendarMarkup();
      calendar.hidden = false;
      readingToggle.setAttribute('aria-expanded', 'true');
      calendar.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      calendar.querySelector(`[data-reading-calendar-day="${selectedReadingDate}"]`)?.focus({ preventScroll: true });
    }
    return;
  }
  const readingShift = event.target.closest('[data-reading-calendar-shift]');
  if (readingShift) {
    readingCalendarMonth = new Date(readingCalendarMonth.getFullYear(), readingCalendarMonth.getMonth() + Number(readingShift.dataset.readingCalendarShift), 1);
    const calendar = sectionContent.querySelector('[data-reading-calendar]');
    calendar.innerHTML = readingCalendarMarkup();
    const focusTarget = calendar.querySelector(`[data-reading-calendar-shift="${readingShift.dataset.readingCalendarShift}"]`);
    (focusTarget?.disabled ? calendar.querySelector('[data-reading-calendar-shift="-1"]') : focusTarget)?.focus({ preventScroll: true });
    return;
  }
  if (event.target.closest('[data-reading-calendar-today]')) { selectReadingDate(localDateKey(new Date())); return; }
  const readingDay = event.target.closest('[data-reading-calendar-day]');
  if (readingDay && !readingDay.disabled) { selectReadingDate(readingDay.dataset.readingCalendarDay); return; }
  const calendarShift = event.target.closest('[data-calendar-shift]');
  if (calendarShift) {
    historyCalendarMonth = new Date(historyCalendarMonth.getFullYear(), historyCalendarMonth.getMonth() + Number(calendarShift.dataset.calendarShift), 1);
    selectedHistoryDate = `${historyCalendarMonth.getFullYear()}-${String(historyCalendarMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const datePicker = timeline.querySelector('[data-history-date]');
    if (datePicker) datePicker.value = selectedHistoryDate;
    timeline.querySelector('.orbit-history-calendar')?.replaceWith(createHistoryCalendarNode(people[selected ?? 0].id));
    timeline.querySelector(`[data-calendar-shift="${calendarShift.dataset.calendarShift}"]`)?.focus({ preventScroll: true });
    filterHistoryByDate(selectedHistoryDate);
    return;
  }
  const calendarToday = event.target.closest('[data-calendar-today]');
  if (calendarToday) {
    const now = new Date();
    selectedHistoryDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    historyCalendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    timeline.querySelector('[data-history-date]').value = selectedHistoryDate;
    timeline.querySelector('.orbit-history-calendar')?.replaceWith(createHistoryCalendarNode(people[selected ?? 0].id));
    timeline.querySelector('[data-calendar-today]')?.focus({ preventScroll: true });
    filterHistoryByDate(selectedHistoryDate);
    return;
  }
  const calendarDay = event.target.closest('[data-calendar-day]');
  if (calendarDay) {
    selectedHistoryDate = calendarDay.dataset.calendarDay;
    timeline.querySelector('[data-history-date]').value = selectedHistoryDate;
    timeline.querySelector('.orbit-history-calendar')?.replaceWith(createHistoryCalendarNode(people[selected ?? 0].id));
    timeline.querySelector(`[data-calendar-day="${selectedHistoryDate}"]`)?.focus({ preventScroll: true });
    filterHistoryByDate(selectedHistoryDate);
    return;
  }
  if (event.target.closest('[data-section-close]')) { navigateBack(); return; }
  if (event.target.closest('[data-open-device]')) { rememberContext(); navigateDashboard('device', event.target.closest('[data-open-device]')); return; }
  if (event.target.closest('[data-open-guidance]')) { rememberContext(); showSection('guidance', event.target.closest('[data-open-guidance]')); return; }
  if (event.target.closest('[data-open-feedback]')) { rememberContext(); showSection('feedback', event.target.closest('[data-open-feedback]')); return; }
  const detailHistory = event.target.closest('[data-detail-history]');
  if (detailHistory) { historyMetric = detailHistory.dataset.detailHistory; selectedHistoryDate = selectedReadingDate; const [year, month] = selectedHistoryDate.split('-').map(Number); historyCalendarMonth = new Date(year, month - 1, 1); rememberContext(); navigateDashboard('history', detailHistory); return; }
  if (event.target.closest('[data-summary-trend]')) { historyMetric = 'pulse'; rememberContext(); navigateDashboard('history', event.target.closest('[data-summary-trend]')); return; }
  const trendRange = event.target.closest('[data-trend-days]');
  if (trendRange) { historyTrendDays = Number(trendRange.dataset.trendDays); renderHistoryTrend(); timeline.querySelector(`[data-trend-days="${historyTrendDays}"]`)?.focus({ preventScroll: true }); return; }
  const readingDetail = event.target.closest('[data-reading-detail]');
  if (readingDetail) { toggleReadingDetail(readingDetail); return; }
  const retry = event.target.closest('[data-section-retry]');
  if (retry) { showSection(retry.dataset.sectionRetry, retry); return; }
  if (event.target.closest('[data-today-record]')) { startCheckin(true); return; }
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
  if (event.target.closest('[data-emergency-close]')) { closeContextPanel(); return; }
  if (event.target.closest('[data-timeline-close]')) { navigateBack(); return; }
  const historyTrigger = event.target.closest('[data-open-history]');
  if (historyTrigger) { rememberContext(); showHistory(historyTrigger); return; }
  if (event.target.closest('[data-timeline-record]')) { startCheckin(); return; }
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
  if (exploreMeasure && CrewDesign.metrics[exploreMeasure.dataset.exploreMeasure]) {
    rememberContext();
    measurementDetail(exploreMeasure.dataset.exploreMeasure);
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
  if (event.target.closest('[data-cancel]')) {
    clearCheckinDraft();
    resetForm();
    recording = false;
    stage.setRecording(false);
    hub.dataset.recording = 'false';
    form.hidden = true;
    hub.querySelector('.orbit-profile-readings').hidden = false;
    profile.scrollTop = 0;
    syncProfileScroll();
    if (checkinReturn) { const destination = checkinReturn; checkinReturn = null; restoreContext(destination); }
    else showMission();
  }
  if (event.target.closest('button[data-figure-anatomy]') && !suppressFigureClick) enterAnatomy();
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
  syncCustomDateTimes(form);
});
hub.addEventListener('change', event => {
  if (event.target.matches('[data-scenario]')) {
    urgentReturnView='';
    hub.removeAttribute('data-alert-acknowledged');
    collectionDraftFields();endRequestedHelpMode();
    CrewDesign.setScenario(event.target.value);
    showMission(false);
    if (hub.dataset.severity === 'urgent') { const title = mission.querySelector('#urgent-action-title,.mission-state h2'); title?.setAttribute('tabindex', '-1'); title?.focus({ preventScroll: true }); }
    return;
  }

  if (event.target.matches('[data-history-filter]')) { historyMetric = event.target.value; filterHistoryByDate(selectedHistoryDate); renderHistoryTrend(); return; }
  if (event.target.matches('[data-history-date]')) {
    if (!event.target.value) return;
    selectedHistoryDate = event.target.value;
    historyCalendarMonth = new Date(Number(selectedHistoryDate.slice(0, 4)), Number(selectedHistoryDate.slice(5, 7)) - 1, 1);
    timeline.querySelector('.orbit-history-calendar')?.replaceWith(createHistoryCalendarNode(people[selected ?? 0].id));
    filterHistoryByDate(event.target.value);
  }
});
form.addEventListener('input', storeCheckinDraft);
form.addEventListener('change', storeCheckinDraft);
form.addEventListener('toggle', event => { if (event.target.matches('details') && checkinDraft) storeCheckinDraft(); }, true);
mission.addEventListener('toggle',event=>{const capture=event.target.closest('[data-collect-form]');if(!capture)return;if(event.target.matches('.collection-guide')&&event.target.open){event.target.querySelector('[data-guide-step]:not([hidden]) h3')?.focus({preventScroll:true});for(const other of capture.querySelectorAll('.collection-guide[open]'))if(other!==event.target)other.open=false;}syncMissionFrame();},true);
mission.addEventListener('input',event=>{if(event.target.closest('[data-repeat-form]'))storeRepeatDraft();const capture=event.target.closest('[data-collect-form]');if(capture){clearCollectionValidation(capture,event.target);storeCollectionDraft(capture)}});
mission.addEventListener('change',event=>{if(event.target.closest('[data-repeat-form]'))storeRepeatDraft();
  const capture=event.target.closest('[data-collect-form]');if(!capture)return;
  clearCollectionValidation(capture,event.target);syncCollectionSymptoms(capture);syncCollectionMeasurement(capture);
  if(event.target.name==='symptoms'){const view=['concerning','urgent'].includes(event.target.value)?'symptoms':'today';if(capture.elements.collectionView.value!==view)navigateCollection(capture,{view})}
  storeCollectionDraft(capture);
});
hub.addEventListener('submit', event => {
 const repeatForm=event.target.closest('[data-repeat-form]');
 if(repeatForm){
  event.preventDefault();if(repeatState.phase!=='entry')return;
  storeRepeatDraft();
  try{
   const payload=repeatPayload(repeatState,repeatState.fields);
   CrewDesign.saveOverview(people[0].id,payload.values,'',payload.details);
   repeatState.result=payload.entry;repeatState.phase='result';showRepeatStep();
  }catch(error){repeatForm.querySelector('[role=alert]').textContent=error.message||'Could not save. Your repeat is still here.'}
  return;
 }

  const capture=event.target.closest('[data-collect-form]');
  if(capture){
    event.preventDefault();const invalid=[...capture.elements].find(input=>input.willValidate&&!input.validity.valid);if(invalid){const metric=invalid.closest('[data-collection-metric]');if(metric)navigateCollection(capture,{measurement:metric.dataset.collectionMetric});const guide=metric?.querySelector('[data-measure-guide]');if(guide)guide.open=false;invalid.setAttribute('aria-invalid','true');invalid.setAttribute('aria-describedby','collection-error');const trigger=invalid.closest('.crew-select')?.querySelector('.crew-select__trigger');trigger?.setAttribute('aria-invalid','true');trigger?.setAttribute('aria-describedby','collection-error');capture.querySelector('.collection-error').textContent=invalid.name==='context'?'Choose the measurement conditions.':invalid.validationMessage;if(invalid.tagName==='SELECT')focusCustomSelect(invalid,{preventScroll:true});else invalid.focus({preventScroll:true});return}
    const payload=collectionPayload(collectionFields(capture));
    try{
      CrewDesign.saveOverview(people[0].id,payload.values,payload.symptoms,{...payload.details,source:'Manual check-in'});
      collectionMode='';collectionDraft=null;clearCheckinDraft();resetForm();showMission();
    }catch(error){capture.querySelector('.collection-error').textContent=error.message||'Could not save. Your entries are still here.'}
    return;
  }
  const feedback = event.target.closest('[data-feedback-form]');
  if (feedback) {
    event.preventDefault();
    if (!feedback.reportValidity()) return;
    const confirmation = feedback.querySelector('.orbit-feedback-confirmation');
    try {
      const feedbackKey = demoMode ? 'crew-health-demo-feedback-v1' : 'crew-health-feedback-v1';
      const saved = JSON.parse(localStorage.getItem(feedbackKey) || '[]');
      saved.push({ rating: feedback.elements.rating.value, message: feedback.elements.message.value.trim(), time: new Date().toISOString() });
      localStorage.setItem(feedbackKey, JSON.stringify(saved.slice(-20)));
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
      source: form.dataset.purpose === 'repeat' ? 'Manual repeat' : 'Manual check-in',
    });
    const destination = CrewDesign.summary(people[selected].id).symptoms === 'urgent' ? { section: 'mission' } : checkinReturn || { section: 'mission' };
    recording = false;
    clearCheckinDraft();
    checkinReturn = null;
    stage.setRecording(false);
    hub.dataset.recording = 'false';
    form.hidden = true;
    hub.querySelector('.orbit-profile-readings').hidden = false;
    profile.scrollTop = 0;
    syncProfileScroll();
    restoreContext(destination);
  } catch (error) { form.querySelector('.orbit-error').textContent = error.message || 'Could not save on this device.'; }
});
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.orbit-reading-date')) closeReadingCalendar();
});
document.addEventListener('keydown', event => {
  if (hub.dataset.panel) {
    if (event.key === 'Escape') { event.preventDefault(); if (!closeReadingCalendar(true)) { if (hub.dataset.panel === 'emergency') closeContextPanel(); else navigateBack(); } }
    return;
  }
  if (hub.hidden || selected === null || !mission.hidden || !onboarding.hidden) return;
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
  figureButton.disabled = true;
  figureButton.setAttribute('aria-busy', 'true');
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
    initializeCustomDateTimes(anatomyRoot);
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
      figureButton.disabled = false;
      figureButton.removeAttribute('aria-busy');
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
  figureButton.disabled = !available;
  figureButton.removeAttribute('aria-busy');
  if (wasOpen) {
    profile.scrollTop = 0;
    syncProfileScroll();
    figureButton.focus({ preventScroll: true });
  }
}

function updateAnchors(anchors, state) {
  const transitioning = String(Boolean(state?.transitioning));
  if (hub.dataset.transitioning !== transitioning) hub.dataset.transitioning = transitioning;
  if (hub.dataset.workspace === 'mission' || hub.dataset.workspace === 'scene' || recording) return;
  anchors.forEach((anchor, index) => {
    const actor = hub.querySelector(`[data-actor="${index}"]`);
    if (!actor || !anchor) return;
    actor.style.setProperty('--x', `${anchor.x}px`);
    actor.style.setProperty('--top', `${anchor.yTop}px`);
    actor.style.setProperty('--height', `${Math.max(0, anchor.yBottom - anchor.yTop)}px`);
  });
  const anchor = selected === null ? null : anchors[selected];
  if (anchors[0]?.chest) {
    hub.style.setProperty('--mission-chest-x', `${anchors[0].chest.x}px`);
    hub.style.setProperty('--mission-chest-y', `${anchors[0].chest.y * .55 + anchors[0].abdomen.y * .45}px`);
  }
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
const liquid = createLiquidInterface(hub);
async function begin() {
  try {
    await liquid.ready;
    stage = await createCrewStage(canvas, updateAnchors);
    stage.setInterfaceVariant?.('glass');
    hub.dataset.ready = 'true';
    figureButton.disabled = false;
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
    setActiveDashboard('profile');
    actors.inert = true;
    mobileControls.forEach(item => { item.inert = true; });
    showMission(false);
  } else {
    openOnboarding(false);
    actors.inert = true;
    mobileControls.forEach(item => { item.inert = true; });
  }
}
begin();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/space-test-site/service-worker.js')
    .then(registration => {
      const worker = registration.installing || registration.waiting || registration.active;
      if (!worker) throw new Error('No offline worker is available.');
      if (worker.state === 'activated') return;
      return new Promise((resolve, reject) => {
        const check = () => {
          if (worker.state === 'activated') { worker.removeEventListener('statechange', check); resolve(); }
          else if (worker.state === 'redundant') { worker.removeEventListener('statechange', check); reject(new Error('Offline setup failed.')); }
        };
        worker.addEventListener('statechange', check);
        check();
      });
    })
    .then(() => { offlineCopyReady = true; updateOfflineStatus(); })
    .catch(error => { offlineSetupFailed = true; updateOfflineStatus(); console.warn('Offline setup unavailable:', error); });
}
window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

for (const eventName of ['pointerover', 'focusin', 'click']) hub.addEventListener(eventName, event => {
  const point = event.target.closest('[data-chart-value]');
  if (point) point.closest('figure').querySelector('.orbit-chart-readout').textContent = point.dataset.chartValue;
});

hub.addEventListener('keydown', event => {
  const point = event.target.closest('[data-chart-value]');
  if (!point || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const points = [...point.closest('svg').querySelectorAll('[data-chart-value]')];
  const next = points[Math.max(0, Math.min(points.length - 1, points.indexOf(point) + (event.key === 'ArrowRight' ? 1 : -1)))];
  point.setAttribute('tabindex','-1'); next.setAttribute('tabindex','0'); next.focus();
});

let displayedDay=localDateKey(new Date());
setInterval(()=>{const day=localDateKey(new Date());if(day!==displayedDay){displayedDay=day;CrewDesign.refreshPresentation()}},60000);

document.addEventListener('visibilitychange',()=>{if(!document.hidden){const day=localDateKey(new Date());if(day!==displayedDay){displayedDay=day;CrewDesign.refreshPresentation()}}});
