import {collectionMetrics,renderCollectionMetric,collectionPayload} from './crew-collection.js?v=checkin-2';
import {measurementGuides,guideVisual} from './crew-measurement-guides.js?v=2';
import {readingStatus} from './crew-care.js?v=3';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const repeatFields=['oxygen','pressure','pulse','temperature','glucose','weight'];
const localTime=time=>{const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const when=time=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(time));
const display=(field,value)=>field==='pressure'?`${value.systolic}/${value.diastolic}`:String(value);
const conditions=entry=>[({rest:'At rest','after-activity':'After activity',fasting:'Fasting','after-meal':'After a meal',other:'Other'})[entry.context]||'Conditions not recorded',entry.site?`${entry.site} site`:''].filter(Boolean).join(' · ');
export function createRepeat(field,baseline,now=Date.now()){
 if(!repeatFields.includes(field)||readingStatus(field,baseline,now).key==='missing')throw new Error('Choose a recorded measurement to repeat.');
 return {field,baseline:structuredClone(baseline),phase:'guide',step:0,fields:[{name:'context',value:field==='glucose'?'':baseline.context||''},{name:'glucoseContext',value:field==='glucose'?baseline.context||'':''},{name:'temperatureSite',value:baseline.site||''}]};
}
export function repeatPayload(state,fields,now=Date.now()){
 const payload=collectionPayload(fields),{field,baseline}=state,raw=payload.values[field];
 const components=field==='pressure'?[raw.systolic,raw.diastolic]:[raw];
 if(components.some(value=>String(value??'').trim()===''||!Number.isFinite(Number(value))))throw new Error('Enter the repeat result.');
 const numbers=components.map(Number),spec=collectionMetrics[field];
 if(field==='pressure'?numbers[0]<=numbers[1]||numbers[0]>400||numbers[1]>300||numbers.some(n=>n<0||!Number.isInteger(n)):numbers[0]<spec.min||numbers[0]>spec.max||Math.abs(numbers[0]/spec.step-Math.round(numbers[0]/spec.step))>1e-7)throw new Error('Check the measurement value.');
 let time=Date.parse(payload.details.measuredAt);
 // The picker displays minutes; preserve ordering when the original includes seconds.
 if(time<Date.parse(baseline.time)&&Math.floor(time/60000)===Math.floor(Date.parse(baseline.time)/60000))time=Date.parse(baseline.time);
 if(!Number.isFinite(time)||time>now||time<Date.parse(baseline.time))throw new Error('Choose a time after the original reading and no later than now.');
 if(field!=='weight'&&!(field==='glucose'?payload.details.glucoseContext:payload.details.context))throw new Error('Choose the measurement conditions.');
 if(field==='temperature'&&!payload.details.temperatureSite)throw new Error('Choose the measurement site.');
 payload.details.measuredAt=new Date(time).toISOString();
 const value=field==='pressure'?{systolic:numbers[0],diastolic:numbers[1]}:numbers[0];
 return {values:{[field]:value},details:{measuredAt:payload.details.measuredAt,context:payload.details.context,glucoseContext:payload.details.glucoseContext,temperatureSite:payload.details.temperatureSite,source:'Manual repeat'},entry:{value,time:new Date(time).toISOString(),context:field==='glucose'?payload.details.glucoseContext:field==='weight'?'':payload.details.context,...(field==='temperature'?{site:payload.details.temperatureSite}:{})}};
}
export function repeatComparison({field,baseline,result}){
 if(!result)return null;
 const comparable=field==='weight'||Boolean(baseline.context&&result.context===baseline.context&&(field!=='temperature'||baseline.site&&baseline.site===result.site));
 const delta=field==='pressure'?[result.value.systolic-baseline.value.systolic,result.value.diastolic-baseline.value.diastolic]:[result.value-baseline.value];
 return {comparable,delta:delta.map(n=>{const rounded=Number(n.toFixed(1));return rounded>0?`+${rounded}`:String(rounded)}).join('/')};
}
export function renderRepeat(state){
 const {field,baseline,phase,step,fields,result}=state,spec=collectionMetrics[field],guide=measurementGuides[field],visual=guideVisual(field,step),[title,text]=guide.steps[step];
 const selected=name=>fields.find(item=>item.name===name)?.value||'';
 const select=(name,label,options)=>`<label>${label}<select name="${name}"><option value="">Choose ${label.toLowerCase()}</option>${options.map(([key,text])=>`<option value="${key}"${selected(name)===key?' selected':''}>${text}</option>`).join('')}</select></label>`;
 // Keep one observed reading per repeat, without touching the daily check-in draft.
 let content='';
 if(phase==='guide')content=`<p class="repeat-intent">Use the same device and method. Keep both results.</p><div class="collection-guide repeat-guide"><div class="measurement-visual">${visual.image?`<figure class="measurement-frame"><img class="measurement-filmstrip" src="/space-test-site/design/assets/guides/${visual.image}" alt="${esc(title)}" style="width:${visual.frames*100}%;transform:translateX(-${visual.frame*100/visual.frames}%)"></figure>`:''}<div class="measurement-steps"><section><h3 tabindex="-1">${esc(title)}</h3><p>${esc(text)}</p></section></div></div></div>${guide.source?`<a class="repeat-source" href="${guide.source}" target="_blank" rel="noopener noreferrer">Device instructions ↗</a>`:''}`;
 if(phase==='entry')content=`<h2 tabindex="-1">Enter the repeat result</h2>${renderCollectionMetric(field,{[field]:baseline},fields,{guide:false})}<div class="collection-context repeat-context"><label>Observed at<input type="datetime-local" name="measuredAt" value="${esc(selected('measuredAt')||localTime(Date.now()))}"></label>${field==='weight'?'':select(field==='glucose'?'glucoseContext':'context',field==='glucose'?'Meal timing':'Conditions',field==='glucose'?[['fasting','Fasting'],['after-meal','After a meal'],['other','Other']]:[['rest','At rest'],['after-activity','After activity'],['other','Other']])}${field==='temperature'?select('temperatureSite','Measurement site',[['oral','Oral'],['ear','Ear'],['forehead','Forehead'],['armpit','Armpit'],['other','Other']]):''}</div><button type="button" class="repeat-guide-return" data-repeat-guide>Review instructions</button>`;
 if(phase==='result'){
  const comparison=repeatComparison(state);
  content=`<h2 tabindex="-1">Repeat saved</h2><div class="repeat-results">${[[baseline,'Previous'],[result,'Repeat']].map(([entry,label])=>`<div><span>${label}</span><strong>${esc(display(field,entry.value))}<small>${spec.unit}</small></strong><span>${esc(when(entry.time))}</span><span>${esc(conditions(entry))}</span></div>`).join('')}</div><p class="repeat-change">${comparison.comparable?`Change ${comparison.delta} ${spec.unit}`:'Different or unrecorded conditions — review separately'}</p><p class="repeat-advice">Still unexpected or feeling unwell? Share both readings with the medical officer.</p>`;
 }
 return `<form novalidate class="collection-page repeat-page" data-repeat-form data-phase="${phase}"><header class="collection-heading"><div><h1 tabindex="-1">Repeat ${esc(spec.label.toLowerCase())}</h1><p>${phase==='result'?'Both readings are kept':`Previous ${esc(display(field,baseline.value))} ${spec.unit} · ${esc(when(baseline.time))}`}</p></div><button class="collection-help" type="button" data-repeat-urgent>I need urgent help ↗</button></header><section class="collection-editor repeat-editor">${content}<p class="collection-error" role="alert" id="repeat-error"></p></section><div class="mission-figure-space collection-figure" data-figure-space></div><footer class="collection-footer"><span class="repeat-progress">${phase==='guide'?`${step+1} / ${guide.steps.length} · Preparation`:''}</span><div class="collection-save"><button type="button" data-repeat-close>${phase==='result'?'Done':'Cancel'}</button>${phase==='guide'?`${step?'<button type="button" data-repeat-back>Back</button>':''}<button type="button" data-repeat-next>${step===guide.steps.length-1?'Enter result':'Next'}</button>`:phase==='entry'?'<button type="submit">Save & compare</button>':''}</div></footer></form>`;
}
