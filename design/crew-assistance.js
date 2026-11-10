const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const answers=new Set(['yes','no','unsure']);
export function assistanceDecision(state={}) {
 if(!state.responding)return {question:'responding',title:'Are they responding?',instruction:'Call their name and gently tap a shoulder. Summon nearby crew while you check.'};
 if(!state.breathing)return {question:'breathing',title:'Are they breathing normally?',instruction:'Check for no more than 10 seconds. Gasping or irregular, laboured breaths are not normal breathing.'};
 if(state.responding!=='yes'&&state.breathing!=='yes')return {kind:'resuscitation',title:'Start trained resuscitation',instruction:'Have another crew member bring the AED and medical restraint equipment. Use your mission-trained microgravity CPR procedure and follow the AED prompts.'};
 if(state.breathing!=='yes')return {kind:'breathing',title:'Get breathing assistance',instruction:'Get crew medical assistance immediately. Follow the onboard airway and breathing procedure. Keep observing responsiveness and breathing.'};
 if(state.responding!=='yes')return {kind:'unresponsive',title:'Stay with them and monitor breathing',instruction:'Bring crew medical assistance. Use the mission airway procedure and reassess immediately if breathing changes.'};
 return {kind:'responsive',title:'Stay with crew and get medical help',instruction:'Get the medical officer and use the symptom-specific onboard procedure. Take measurements only when this will not delay care.'};
}
export function advanceAssistance(state,question,answer,now=Date.now()) {
 if(!['responding','breathing'].includes(question)||!answers.has(answer))throw new Error('Choose a valid observation.');
 if(question==='breathing'&&!state.responding)throw new Error('Record responsiveness first.');
 const next={...state,[question]:answer,events:[...(state.events||[]),{question,answer,time:new Date(now).toISOString()}].slice(-20)};
 if(question==='responding')next.breathing=null;
 return next;
}
const storageKey='crew-assistance-observations-v1';
export function readAssistance(key,storage) {
 try{const data=JSON.parse(storage.getItem(storageKey)||'{}')[key];if(!data)return {events:[]};return {responding:answers.has(data.responding)?data.responding:null,breathing:answers.has(data.breathing)?data.breathing:null,events:(Array.isArray(data.events)?data.events:[]).filter(item=>['responding','breathing'].includes(item?.question)&&answers.has(item.answer)&&Number.isFinite(Date.parse(item.time))).slice(-20)}}catch{return {events:[]}}
}
export function writeAssistance(key,state,storage) {
 let data;try{data=JSON.parse(storage.getItem(storageKey)||'{}')}catch{data={}}if(!data||typeof data!=='object'||Array.isArray(data))data={};
 storage.setItem(storageKey,JSON.stringify(Object.fromEntries([...Object.entries(data).filter(([old])=>old!==key).slice(-19),[key,state]])));
}
export function renderAssistance(state,personName,view='steps',handoff='',returnTo='steps') {
 const decision=assistanceDecision(state);
 if(view==='sources')return `<section class="assistance-view assistance-source-view"><h2 tabindex="-1">Procedure & sources</h2><p>These recognition prompts are not a complete or flight-approved resuscitation protocol. Use your onboard procedure and training; do not wait for a reply from Earth.</p><div class="assistance-source-links"><a href="https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines" target="_blank" rel="noopener noreferrer">Basic life support guidance ↗</a><a href="https://www.sciencedirect.com/science/article/abs/pii/S0300957225002655" target="_blank" rel="noopener noreferrer">Microgravity considerations ↗</a></div><div class="assistance-utilities"><button type="button" data-assist-view="${returnTo}">← ${returnTo==='response'?'Response':'Assistance'}</button></div></section>`;
 if(view==='handoff')return `<section class="assistance-view assistance-handoff-view"><h2 tabindex="-1">Medical handoff</h2><div class="care-handoff"><textarea readonly aria-label="Medical handoff summary">${esc(handoff)}</textarea><button type="button" data-copy-handoff>Copy summary</button><span role="status"></span></div><div class="assistance-utilities"><button type="button" data-assist-view="${returnTo}">← ${returnTo==='response'?'Response':'Assistance'}</button></div></section>`;
 const observed=decision.question?'':`<div class="assistance-observed"><span>Response <strong>${{yes:'Responding',no:'Not responding',unsure:'Uncertain'}[state.responding]}</strong></span><span>Breathing <strong>${{yes:'Reported normal',no:'Not normal / gasping',unsure:'Uncertain'}[state.breathing]}</strong></span></div>`;
 const choices=decision.question?`<div class="assistance-answers" role="group" aria-label="${esc(decision.title)}">${[['yes','Yes'],['no',decision.question==='breathing'?'No / gasping':'No'],['unsure','Unsure']].map(([key,label])=>`<button type="button" data-assist-question="${decision.question}" data-assist-answer="${key}">${label}</button>`).join('')}</div>`:`<button type="button" class="assistance-recheck" data-assist-reassess><span aria-hidden="true">↻</span> Recheck response and breathing</button>`;
 return `<section class="assistance-view" data-outcome="${decision.kind||decision.question}"><h2 tabindex="-1">${esc(decision.title)}</h2>${observed}<p class="assistance-instruction">${esc(decision.instruction)}</p>${choices}<p class="assistance-persistence" data-assistance-status role="status"></p><div class="assistance-utilities"><button type="button" data-assist-close>← Response</button><button type="button" data-assist-view="sources">Procedure & sources</button><button type="button" data-assist-view="handoff">Medical handoff</button></div></section>`;
}
