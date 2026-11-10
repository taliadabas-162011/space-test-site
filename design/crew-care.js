import {compareHistory} from './crew-insights.js?v=1';

export const symptomLabels = {'chest-pain':'Chest pain','breathing-difficulty':'Breathing difficulty',fainting:'Fainting','new-weakness':'New weakness','speech-vision-change':'Speech or vision change',dizziness:'Dizziness',nausea:'Nausea',headache:'Headache',fatigue:'Fatigue',other:'Other symptom'};
const urgentTags = new Set(['chest-pain','breathing-difficulty','fainting','new-weakness','speech-vision-change']);
export const measurementLabels = {pulse:['Heart rate','bpm'],pressure:['Blood pressure','mmHg'],oxygen:['Oxygen','%'],sleep:['Sleep','h'],water:['Water logged','L'],exercise:['Exercise logged','min'],temperature:['Temperature','°C'],glucose:['Blood glucose','mg/dL'],weight:['Body mass','kg']};
const present = value => value !== null && value !== undefined && value !== '' && typeof value !== 'boolean' && Number.isFinite(Number(value));
export function readingStatus(field,entry,now=Date.now()) {
  const valid = field==='pressure' ? present(entry?.value?.systolic)&&present(entry?.value?.diastolic) : present(entry?.value);
  if(!valid||entry?.quality==='unavailable'||!Number.isFinite(Date.parse(entry?.time))||Date.parse(entry.time)>now+60000)return {key:'missing',label:'Unavailable'};
  // Recency is displayed, not treated as a universal clinical sampling interval.
  return now-Date.parse(entry.time)>86400000 ? {key:'earlier',label:'Earlier observation'} : {key:'recorded',label:'Recorded'};
}
export function sleepPattern(history,now=Date.now()) {
  const days=new Map();
  for(const entry of (history||[]).slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time))) {
    const time=Date.parse(entry?.time);
    if(!present(entry?.value)||!Number.isFinite(time)||time>now||now-time>30*86400000)continue;
    const date=new Date(time);days.set(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,Number(entry.value));
  }
  const values=[...days.values()];
  if(values.length<6)return null;
  const recent=values.slice(-3),prior=values.slice(0,-3).sort((a,b)=>a-b),mid=Math.floor(prior.length/2);
  return {recent:Math.round(recent.reduce((a,b)=>a+b,0)/3*10)/10,usual:prior.length%2?prior[mid]:(prior[mid-1]+prior[mid])/2,nights:3,priorDays:prior.length};
}
export function careAssessment(summary,scenario={key:'routine'},histories={},now=Date.now()) {
  const tags=(summary.symptomTags||[]).filter(tag=>symptomLabels[tag]);
  const symptoms=tags.map(tag=>symptomLabels[tag]);
  // A symptom report outranks the selected preview and any reassuring number.
  if(summary.symptoms==='urgent'||(summary.symptoms!=='none'&&tags.some(tag=>urgentTags.has(tag))))return {key:'emergency',tone:'urgent',label:'Urgent symptoms',title:'Get crew assistance now',detail:symptoms.length?symptoms.join(' · '):'Urgent symptoms reported',focus:['pulse','oxygen'],why:'Symptoms drive this alert. A normal reading would not cancel it.',next:'Alert nearby crew using the mission communication channel. Do not wait to repeat a measurement.'};
  if(summary.symptoms==='concerning')return {key:'symptoms',tone:'attention',label:'Symptom review',title:'Speak with your medical officer',detail:symptoms.join(' · ')||'Symptoms reported',focus:['pulse','pressure','oxygen'],why:'Your symptom report needs review even if the displayed readings look familiar.',next:'Use the mission medical channel. If symptoms become severe, alert nearby crew immediately.'};
  if(summary.mood?.value==='low')return {key:'wellbeing',tone:'attention',label:'Wellbeing check-in',title:'Make time for a crew check-in',detail:'Low mood reported'+(summary.sleepQuality?.value==='poor'?' · Poor sleep reported':''),focus:['sleep'],why:'A self-report is a reason to listen and check in. This is not a mental-health diagnosis or a stress score.',next:'Tell your crew support contact how you feel. Review sleep and workload together. If you feel unsafe, seek immediate crew assistance.'};
  if(scenario.key==='review') {
    const repeats=['oxygen','pressure'].filter(field=>summary[field]?.source==='Manual repeat'&&summary[field].context==='rest'&&Date.parse(summary[field].recordedAt)>Date.parse(scenario.startedAt)&&Date.parse(summary[field].time)>=Date.parse(scenario.startedAt)-60000&&readingStatus(field,summary[field],now).key!=='missing');
    return {key:'review',tone:'attention',label:repeats.length===2?'Repeat recorded':'Repeat & compare',title:repeats.length===2?'Compare the repeat readings':'Verify the changed readings',detail:repeats.length===2?'Both repeat measurements are recorded. A repeat does not automatically clear the concern.':`Oxygen ${summary.oxygen?.value??'—'}% · Blood pressure ${summary.pressure?.value?.systolic??'—'}/${summary.pressure?.value?.diastolic??'—'} mmHg · At rest`,focus:['oxygen','pressure','pulse'],repeats,why:'This example asks for a repeat because the readings changed; it does not establish a diagnosis or a mission limit.',next:'Check the oximeter fit and cuff instructions. Repeat at rest using the same device and method. Escalate persistent changes through the mission medical channel.'};
  }
  if(scenario.key==='recovery') {
    const pattern=sleepPattern(histories.sleep,now);
    return {key:'recovery',tone:'attention',label:'Sleep pattern changed',title:'Review your recovery schedule',detail:pattern?`${pattern.recent} h average over ${pattern.nights} nights · ${pattern.usual} h earlier median`:'Shorter sleep in this example. Review the sleep history.',focus:['sleep','water','exercise'],why:'Sleep is a pattern to discuss. Logged water is not a hydration diagnosis, and exercise minutes do not measure workout intensity or completion.',next:'Review the protected sleep period with your crew schedule. Discuss persistent fatigue with the medical officer. Follow your assigned fluid and exercise plan.'};
  }
  const missing=['pulse','pressure','oxygen'].filter(field=>readingStatus(field,summary[field],now).key==='missing');
  return {key:'routine',tone:'recorded',label:'Today’s observations',title:missing.length?'Complete your observations':summary.symptoms==='none'?'No symptoms reported':'How are you feeling?',detail:missing.length?`${missing.length} vital measurement${missing.length>1?'s':''} unavailable.`:'Review changes alongside how you feel.',focus:[],why:'Recorded does not mean medically normal. Personal mission limits and a clinical protocol have not been loaded.',next:'Add a check-in when your mission schedule calls for it. Report new symptoms even if the numbers look unchanged.'};
}
export function responseKey(summary,scenario) {
  const actual=summary.symptoms==='urgent'||(summary.symptoms!=='none'&&(summary.symptomTags||[]).some(tag=>urgentTags.has(tag)));
  return actual&&summary.symptomSource!=='Scenario preview'?`symptoms:${summary.person.id}:${summary.symptomTime||'unknown'}`:`scenario:${scenario.key}:${scenario.startedAt||''}`;
}
const responseStorage='crew-response-actions-v1';
export function readResponse(key,storage) {
  try{const item=JSON.parse(storage.getItem(responseStorage)||'{}')[key]||{};return Object.fromEntries(['acknowledgedAt'].filter(field=>Number.isFinite(Date.parse(item[field]))).map(field=>[field,item[field]]))}catch{return {}}
}
export function recordResponse(key,action,storage,now=Date.now()) {
  if(!['acknowledgedAt'].includes(action))throw new Error('Unknown response action');
  let data;try{data=JSON.parse(storage.getItem(responseStorage)||'{}')}catch{data={}}
  if(!data||typeof data!=='object'||Array.isArray(data))data={};
  const item={...readResponse(key,storage),[action]:new Date(now).toISOString()};
  const entries=Object.entries(data).filter(([existing])=>existing!==key).slice(-19);
  storage.setItem(responseStorage,JSON.stringify(Object.fromEntries([...entries,[key,item]])));
  return item;
}
export function handoffText(summary,scenario,response={},histories={},now=Date.now()) {
  const state=careAssessment(summary,scenario,histories,now);
  const lines=[`Crew health · ${summary.person.name}`,`Prepared: ${new Date(now).toISOString()}`,`Case: ${scenario.key==='routine'?'Current record':scenario.title||scenario.key} · ${scenario.key==='routine'?'Includes populated presentation history':'Scenario preview'}`,`Reason: ${state.detail}`,`Symptoms: ${summary.symptoms||'Not reported'}${summary.symptomTags?.length?' · '+summary.symptomTags.map(tag=>symptomLabels[tag]||tag).join(', '):''}`,`Onset: ${summary.symptomOnset||'Not recorded'} · Change: ${summary.symptomProgression||'Not recorded'}`];
  for(const [field,[label,unit]] of Object.entries(measurementLabels)) {
    const entry=summary[field],status=readingStatus(field,entry,now);
    const value=field==='pressure'?`${entry?.value?.systolic}/${entry?.value?.diastolic}`:entry?.value;
    const comparison=status.key!=='missing'&&compareHistory(field,histories[field]||[],now);
    lines.push(`${label}: ${status.key==='missing'?'Unavailable':`${value} ${unit}`} | ${entry?.time||'Time unknown'} | ${entry?.source||'Source unknown'} | ${entry?.context||'Context not recorded'}${field==='temperature'?` | Site: ${entry?.site||'Not recorded'}`:''}${comparison?` | Earlier median: ${comparison.baseline.join('/')} ${unit} (${comparison.days} days)`:''}`);
  }
  for(const event of response.assistance?.events||[])lines.push(`Crew observation: ${event.question} = ${event.answer} | ${event.time}`);
  lines.push(`Alert acknowledged: ${response.acknowledgedAt||'Not recorded'}`,'Crew contact: not confirmed by this website','Communication: not sent. Use the mission channel.','Mission clinical limits/procedure: not loaded. Observations and general guidance do not constitute a diagnosis or a verified mission protocol.');
  return lines.join('\n');
}
