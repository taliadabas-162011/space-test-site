import {compareHistory} from './crew-insights.js?v=1';
import {careAssessment,readingStatus,handoffText,measurementLabels,sleepPattern,symptomLabels} from './crew-care.js?v=3';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const missionState=careAssessment;
const clock=time=>new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit'}).format(new Date(time));
const date=time=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(time));
const format=(field,value)=>field==='pressure'?`${value?.systolic}/${value?.diastolic}`:String(value??'—');
function reading(summary,histories,field,state,scenario,now) {
  const entry=summary[field],status=readingStatus(field,entry,now),[label,unit]=measurementLabels[field],missing=status.key==='missing';
  const comparison=!missing&&compareHistory(field,histories[field]||[],now);
  const delta=comparison?comparison.delta.map(value=>value>0?`+${value}`:String(value)).join('/') : '';
  const sleep=field==='sleep'?sleepPattern(histories.sleep,now):null;
  const last=(histories[field]||[]).filter(item=>readingStatus(field,item,now).key!=='missing').at(-1);
  const context=({rest:'At rest','after-activity':'After activity',fasting:'Fasting','after-meal':'After a meal',other:'Other context'})[entry?.context]||'';
  const time=Number.isFinite(Date.parse(entry?.time))?`${date(entry.time)}, ${clock(entry.time)}`:'Time unknown';
  const detail=[time,entry?.source||'Source unknown',context].filter(Boolean).join(' · ');
  const note=missing?last?`Last ${format(field,last.value)} ${unit} · ${date(last.time)}`:'No reading':sleep?`3-night avg ${sleep.recent} h · earlier ${Number(sleep.usual.toFixed(1))} h`:comparison?`${delta} vs earlier ${comparison.baseline.join('/')} ${unit}`:context||time;
  const value=missing?'—':field==='pressure'?`${escape(entry.value.systolic)}<span class="mission-value-divider">/</span>${escape(entry.value.diastolic)}`:escape(entry.value);
  return `<button type="button" class="mission-reading mission-reading--${field}" data-metric="${field}" data-open-metric="${field}" data-focus="${state.focus.includes(field)}" data-quality="${status.key}" aria-label="${label}: ${missing?'unavailable':escape(format(field,entry.value))+' '+unit}. ${escape(note)}. Open history" title="${escape(detail)}"><span class="mission-reading-label">${label}</span><strong>${value}<small>${unit}</small></strong><span class="mission-reading-comparison">${escape(note)}</span><span class="mission-reading-detail">${escape(detail)} <i aria-hidden="true">↗</i></span></button>`;
}
function handoff(summary,scenario,response,histories,now) {
  return `<details class="care-handoff"><summary>Medical handoff</summary><textarea readonly rows="7" aria-label="Medical handoff summary">${escape(handoffText(summary,scenario,response,histories,now))}</textarea><button type="button" data-copy-handoff>Copy summary</button><span class="care-copy-status" role="status"></span></details>`;
}
function explanation(state,scenario) {
  const evidence=state.key==='emergency'?'<a href="https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines" target="_blank" rel="noopener noreferrer">General first aid principles ↗</a>':'<a href="https://www.nasa.gov/reference/standard-measures/" target="_blank" rel="noopener noreferrer">Spaceflight health measurements ↗</a>';

  return `<details class="care-explanation"><summary>About this assessment</summary><p>${escape(state.why)}</p><p>${scenario.key==='routine'?'Populated history with saved check-ins.':'Example observations for the selected scenario.'} Mission clinical limits and procedures are not loaded. Radiation, bone density and immune health need other measurements.</p>${evidence}</details>`;
}
function responsePanel(state,summary,scenario,response,histories,now) {
  let title=state.title,reason='',action='';
  if(state.key==='wellbeing'){
    title='Check in with crew support';reason='Low mood reported'+(summary.sleepQuality?.value==='poor'?' with poor sleep':'');
    action='<p class="care-instruction">Talk through how you feel, your sleep and workload. Seek immediate crew assistance if you feel unsafe.</p><button type="button" class="care-primary" data-care-wellbeing>Update check-in ↗</button>';
  } else if(state.key==='symptoms'){
    title='Speak with the medical officer';reason=state.detail;
    action='<p class="care-instruction">Share what changed and when it began. Severe or worsening symptoms need immediate crew assistance.</p>';
  }
  return `<section class="mission-response mission-state care-focus" aria-label="Recommended action"><h2>${escape(title)}</h2><p class="care-reason">${escape(reason)}</p>${action}<span class="care-response-status" data-response-status role="status"></span>${handoff(summary,scenario,response,histories,now)}</section>`;
}
function urgentReading(summary,histories,field,scenario,now){
  const entry=summary[field],[label,unit]=measurementLabels[field],missing=readingStatus(field,entry,now).key==='missing';
  const comparison=!missing&&compareHistory(field,histories[field]||[],now);
  const earlier=comparison?`Earlier ${comparison.baseline.join('/')}`:'No comparable baseline';
  const time=missing?'Unavailable':`${date(entry.time)}, ${clock(entry.time)}`;
  const signal=scenario.key==='emergency'&&entry?.source==='Scenario preview'&&Object.hasOwn(scenario.values||{},field);
  return `<button type="button" class="urgent-vital" data-metric="${field}" data-open-metric="${field}" data-urgent-signal="${signal}" aria-label="${escape(label+': '+(missing?'unavailable':format(field,entry.value)+' '+unit)+'. '+earlier+'. '+time+'. Open history')}" title="${escape(entry?.source||'Source not recorded')}"><span class="urgent-vital-label">${label}</span><strong>${missing?'—':escape(format(field,entry.value))}<small>${unit}</small></strong><span class="urgent-vital-comparison">${escape(earlier)}</span><span class="urgent-reading-time">${escape(time)}</span></button>`;
}

function renderUrgentMission(summary,histories,scenario,response,state,now,returnView){
  const preview=summary.symptomSource==='Scenario preview';
  const returnLabel=preview?'← Overview':returnView==='checkin'?'← Back to check-in':returnView==='repeat'?'← Back to repeat':'Review check-in';
  const returnAction=preview?'data-exit-urgent-preview':returnView==='repeat'?'data-urgent-repeat-return':'data-mission-action="checkin"';
  const symptoms=[...new Set((summary.symptomTags||[]).filter(tag=>symptomLabels[tag]))].map(tag=>symptomLabels[tag]);
  const course=({worsening:'Getting worse',unchanged:'Unchanged',improving:'Improving'})[summary.symptomProgression];
  const onset=Number.isFinite(Date.parse(summary.symptomOnset))?`Began ${date(summary.symptomOnset)}, ${clock(summary.symptomOnset)}`:'Onset not recorded';
  return `<div class="mission-page urgent-page" data-care-view="emergency"><section class="urgent-problem" role="alert" aria-labelledby="urgent-title"><div class="urgent-topline"><span>${escape(summary.person.name)}</span><button class="care-checkin-return" type="button" ${returnAction}>${returnLabel}</button></div><h1 id="urgent-title" tabindex="-1">Get crew assistance now</h1><ul class="urgent-symptoms" aria-label="Reported symptoms">${(symptoms.length?symptoms:['Urgent help requested']).map(label=>`<li>${escape(label)}</li>`).join('')}</ul><p class="urgent-course">${course?`<strong>${course}</strong><span aria-hidden="true"> · </span>`:''}${escape(onset)}</p></section><section class="mission-response care-focus urgent-action" aria-label="Immediate action"><h2 tabindex="-1" id="urgent-action-title">Get crew assistance now</h2><p class="urgent-instruction">Call nearby crew on the mission channel. Don’t wait to remeasure.</p><button type="button" class="care-primary" data-assist-open>Guide crew assistance <span aria-hidden="true">→</span></button><div class="assistance-utilities urgent-utilities"><button type="button" data-assist-view="sources">Procedure & sources</button><button type="button" data-assist-view="handoff">Medical handoff</button><button type="button" class="mission-ack" data-alert-ack aria-label="${response.acknowledgedAt?'Alarm silenced · assistance still needed':'Silence alarm'}"${response.acknowledgedAt?' disabled':''}>${response.acknowledgedAt?'Alarm silenced':'Silence alarm'}</button></div><span class="urgent-contact-note">Nothing has been sent from this device</span><span class="care-response-status" data-response-status role="status"></span></section><section class="mission-primary-readings urgent-readings" aria-label="Supporting measurements">${['pulse','oxygen','pressure'].map(field=>urgentReading(summary,histories,field,scenario,now)).join('')}</section><div class="mission-figure-space urgent-figure" data-figure-space></div></div>`;
}

export function renderMission({summary,histories,scenario,connected=0,acknowledged=false,response={},draft=false,urgentReturn='',showReadings=false,now=Date.now()}) {
  if(acknowledged&&!response.acknowledgedAt)response={...response,acknowledgedAt:new Date(now).toISOString()};
  const state=careAssessment(summary,scenario,histories,now),urgent=state.key==='emergency',routine=state.key==='routine';
  if(urgent)return renderUrgentMission(summary,histories,scenario,response,state,now,urgentReturn);
  const primary=state.key==='wellbeing'?['sleep','water','exercise']:['pulse','pressure','oxygen'];
  const mood=({good:'Feeling good',neutral:'Feeling neutral',low:'Feeling low'})[summary.mood?.value]||'Mood not recorded';
  const row=field=>reading(summary,histories,field,state,scenario,now);
  return `<div class="mission-page" data-care-view="${state.key}"><header class="mission-intro"><h1 tabindex="-1">${escape(summary.person.name)}</h1>${`<p class="mission-model-label">${summary.person.model === 'female' ? 'Feminine anatomy selected' : 'Masculine anatomy selected'}</p><p>${escape(mood)}${summary.sleepQuality?.value?' · '+escape(summary.sleepQuality.value)+' sleep':''}</p><button type="button" data-edit-profile>Edit profile ↗</button>`}</header><div class="mission-figure-space" data-figure-space></div>${routine?'':responsePanel(state,summary,scenario,response,histories,now)}<div class="mission-constellation" hidden aria-label="${routine?'Latest readings':'Relevant observations'}"><div class="mission-primary-readings">${primary.map(row).join('')}</div>${routine?`<section class="mission-recovery" aria-label="Recovery"><h2 class="recovery-title">Recovery</h2>${['sleep','water','exercise'].map(row).join('')}</section><section class="mission-body-readings" aria-label="Other body readings">${['temperature','glucose','weight'].map(row).join('')}</section>`:''}</div><footer class="mission-ground"><div>${explanation(state,scenario)}</div>${routine?`<div class="mission-main-actions"><button type="button" data-open-readings-graphs>Readings & graphs <span aria-hidden="true">↗</span></button><button type="button" data-reveal-anatomy>Reveal anatomy <span aria-hidden="true">↗</span></button><button type="button" data-mission-action="checkin">${draft?'Continue check-in':'Daily check-in'} <span aria-hidden="true">↗</span></button></div>`:''}</footer></div>`;
}
