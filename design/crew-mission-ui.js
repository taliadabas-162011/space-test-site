import {compareHistory} from './crew-insights.js?v=1';
import {careAssessment,readingStatus,handoffText,measurementLabels} from './crew-care.js?v=2';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const missionState=careAssessment;
const clock=time=>new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit'}).format(new Date(time));
const date=time=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(time));
const format=(field,value)=>field==='pressure'?`${value?.systolic}/${value?.diastolic}`:String(value??'—');
function reading(summary,histories,field,state,scenario,now) {
  const entry=summary[field],status=readingStatus(field,entry,now),[label,unit]=measurementLabels[field],missing=status.key==='missing';
  const comparison=!missing&&compareHistory(field,histories[field]||[],now);
  const delta=comparison?comparison.delta.map(value=>value>0?`+${value}`:String(value)).join('/') : '';
  const repeat=state.key==='review'&&entry?.source==='Manual repeat'&&state.repeats?.includes(field);
  const last=(histories[field]||[]).filter(item=>readingStatus(field,item,now).key!=='missing').at(-1);
  const context=({rest:'At rest','after-activity':'After activity',fasting:'Fasting','after-meal':'After a meal',other:'Other context'})[entry?.context]||'';
  const time=Number.isFinite(Date.parse(entry?.time))?`${date(entry.time)}, ${clock(entry.time)}`:'Time unknown';
  const detail=[time,entry?.source||'Source unknown',context].filter(Boolean).join(' · ');
  const note=missing?last?`Last ${format(field,last.value)} ${unit} · ${date(last.time)}`:'No reading':repeat?`Initial ${format(field,scenario.values?.[field])} ${unit}`:comparison?`${delta} vs earlier ${comparison.baseline.join('/')} ${unit}`:context||time;
  const value=missing?'—':field==='pressure'?`${escape(entry.value.systolic)}<span class="mission-value-divider">/</span>${escape(entry.value.diastolic)}`:escape(entry.value);
  return `<button type="button" class="mission-reading mission-reading--${field}" data-metric="${field}" data-open-metric="${field}" data-focus="${state.focus.includes(field)}" data-quality="${status.key}" aria-label="${label}: ${missing?'unavailable':escape(format(field,entry.value))+' '+unit}. ${escape(note)}. Open history" title="${escape(detail)}"><span class="mission-reading-label">${label}</span><strong>${value}<small>${unit}</small></strong><span class="mission-reading-comparison">${escape(note)}</span><span class="mission-reading-detail">${escape(detail)} <i aria-hidden="true">↗</i></span></button>`;
}
function handoff(summary,scenario,response,histories,now) {
  return `<details class="care-handoff"><summary>Medical handoff</summary><textarea readonly rows="7" aria-label="Medical handoff summary">${escape(handoffText(summary,scenario,response,histories,now))}</textarea><button type="button" data-copy-handoff>Copy summary</button><span class="care-copy-status" role="status"></span></details>`;
}
function explanation(state,scenario) {
  const evidence=state.key==='review'?'<a href="https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics" target="_blank" rel="noopener noreferrer">Oximeter limitations ↗</a>':'<a href="https://www.nasa.gov/reference/standard-measures/" target="_blank" rel="noopener noreferrer">Spaceflight health measurements ↗</a>';
  return `<details class="care-explanation"><summary>About this assessment</summary><p>${escape(state.why)}</p><p>${scenario.key==='routine'?'Populated history with saved check-ins.':'Example observations for the selected scenario.'} Mission clinical limits and procedures are not loaded. Radiation, bone density and immune health need other measurements.</p>${evidence}</details>`;
}
function responsePanel(state,summary,scenario,response,histories,now) {
  const urgent=state.key==='emergency';let title=state.title,reason='',action='',detail='';
  if(urgent){
    title='Alert nearby crew now';reason=state.detail+(summary.symptomProgression?' · '+summary.symptomProgression:'');
    action=`<p class="care-instruction">Use the mission channel and onboard emergency procedure. Don’t wait for another reading.</p><button type="button" class="care-primary" data-assist-open>Help this crew member ↗</button><button type="button" class="mission-ack" data-alert-ack${response.acknowledgedAt?' disabled':''}>${response.acknowledgedAt?'Alarm silenced · assistance still needed':'Acknowledge & silence'}</button>`;
    detail=summary.symptomOnset?`Began ${clock(summary.symptomOnset)}`:'';
  } else if(state.key==='review'){
    const repeated=state.repeats?.length===2;
    title=repeated?'Repeat readings recorded':'Repeat oxygen and blood pressure';
    reason=repeated?'Keep both sets for medical review.': 'Check sensor placement and repeat at rest, using the same device and method.';
    action=`${repeated?`<div class="care-repeat-table">${state.repeats.map(field=>`<span>${measurementLabels[field][0]}</span><span>${escape(format(field,scenario.values?.[field]))} → <strong>${escape(format(field,summary[field].value))} ${measurementLabels[field][1]}</strong></span>`).join('')}</div>`:`<button type="button" class="care-primary" data-care-repeat>Enter repeat readings ↗</button>`}<p class="care-escalation">Changes persist or new symptoms? Contact the medical officer. Severe symptoms need crew assistance now.</p>`;
  } else if(state.key==='recovery'){
    title='Make room for sleep';reason=state.detail;
    action='<p class="care-instruction">Review the next sleep window with your crew. Discuss persistent fatigue with the medical officer.</p><button type="button" class="care-primary" data-mission-action="checkin">Update check-in ↗</button>';
  } else if(state.key==='wellbeing'){
    title='Check in with crew support';reason='Low mood reported'+(summary.sleepQuality?.value==='poor'?' with poor sleep':'');
    action='<p class="care-instruction">Talk through how you feel, your sleep and workload. Seek immediate crew assistance if you feel unsafe.</p><button type="button" class="care-primary" data-care-wellbeing>Update check-in ↗</button>';
  } else if(state.key==='symptoms'){
    title='Speak with the medical officer';reason=state.detail;
    action='<p class="care-instruction">Share what changed and when it began. Severe or worsening symptoms need immediate crew assistance.</p>';
  }
  return `<section class="mission-response mission-state care-focus" aria-label="${urgent?'Urgent response':'Recommended action'}"${urgent?' role="alert"':''}><h2>${escape(title)}</h2><p class="care-reason">${escape(reason)}</p>${detail?`<p class="care-onset">${escape(detail)}</p>`:''}${action}<span class="care-response-status" data-response-status role="status"></span>${handoff(summary,scenario,response,histories,now)}</section>`;
}
export function renderMission({summary,histories,scenario,connected=0,acknowledged=false,response={},draft=false,now=Date.now()}) {
  if(acknowledged&&!response.acknowledgedAt)response={...response,acknowledgedAt:new Date(now).toISOString()};
  const state=careAssessment(summary,scenario,histories,now),urgent=state.key==='emergency',routine=state.key==='routine';
  const primary=urgent?['pulse','oxygen']:state.key==='recovery'||state.key==='wellbeing'?['sleep','water','exercise']:state.key==='review'?['oxygen','pressure','pulse']:['pulse','pressure','oxygen'];
  const mood=({good:'Feeling good',neutral:'Feeling neutral',low:'Feeling low'})[summary.mood?.value]||'Mood not recorded';
  const row=field=>reading(summary,histories,field,state,scenario,now);
  return `<div class="mission-page" data-care-view="${state.key}"><header class="mission-intro">${urgent?'<button class="care-checkin-return" type="button" data-mission-action="checkin">← Back to check-in</button>':''}<h1 tabindex="-1">${escape(summary.person.name)}</h1>${urgent?'':`<p>${escape(mood)}${summary.sleepQuality?.value?' · '+escape(summary.sleepQuality.value)+' sleep':''}</p><button type="button" data-edit-profile>Edit profile ↗</button>`}</header><div class="mission-figure-space" data-figure-space></div>${routine?`<section class="mission-state"><h2>${escape(state.title)}</h2><p class="care-reason">${summary.symptomTime?'Last check-in '+escape(date(summary.symptomTime))+', '+escape(clock(summary.symptomTime)):'Add how you feel to give these readings context'}</p></section>`:responsePanel(state,summary,scenario,response,histories,now)}<div class="mission-constellation" aria-label="${routine?'Latest readings':'Relevant observations'}"><div class="mission-primary-readings">${primary.map(row).join('')}</div>${routine?`<section class="mission-recovery" aria-label="Daily recovery">${['sleep','water','exercise'].map(row).join('')}</section><section class="mission-body-readings" aria-label="Other body readings">${['temperature','glucose','weight'].map(row).join('')}</section>`:''}</div><footer class="mission-ground"><div>${explanation(state,scenario)}</div>${urgent?`${summary.symptomSource==='Scenario preview'?'<button class="care-preview-exit" type="button" data-exit-urgent-preview>Exit urgent preview</button>':''}`:routine?`<button class="mission-checkin" type="button" data-mission-action="checkin">${draft?'Continue check-in':'Daily check-in'} <i aria-hidden="true">↗</i></button>`:''}</footer></div>`;
}
