// One prompt at a time; original mood wording and answer values are preserved.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const moodQuestions = [
 ['How would you describe your overall mood today?', ['Very positive','Positive','Neutral','Low','Very low']],
 ['How stressed have you felt today?', ['Not at all','Slightly','Moderately','Very','Extremely']],
 ['How well have you been coping with the demands of the mission?', ['Very well','Well','Moderately','With difficulty','With great difficulty']],
 ['How energetic and motivated have you felt today?', ['Very energetic','Energetic','Average','Low energy','Very low energy']],
 ['How well did you sleep during your last sleep period?', ['Very well','Well','Average','Poorly','Very poorly']],
 ['How connected have you felt to your crewmates?', ['Very connected','Connected','Neutral','Disconnected','Very disconnected']],
 ['How much have you missed family, friends or life on Earth?', ['Not at all','A little','Moderately','A lot','Extremely']],
 ['How well have you been able to concentrate on your tasks?', ['Very well','Well','Moderately','With difficulty','With great difficulty']],
 ['How manageable has your workload felt today?', ['Very manageable','Manageable','Moderately manageable','Difficult','Very difficult']],
 ['Would you like to speak with someone from the medical or psychological support team?', ['No','Maybe','Yes']]
];const moodTopics=['Mood','Stress','Coping','Energy','Sleep','Crew connection','Missing home','Concentration','Workload','Support'];
const sleepQuestions=[
 {name:'sleepQuality',label:'How you felt',question:'How rested did you feel when you woke up?',options:[['restful','Rested'],['mixed','Somewhat rested'],['poor','Not rested']]},
 {name:'sleepTimeInBed',label:'Time in bed',question:'How long were you in bed for your last sleep period?',unit:'h',max:24,min:.1,step:.1},
 {name:'sleepTimeAsleep',label:'Time asleep',question:'How long do you think you were asleep?',unit:'h',max:24,min:0,step:.1},
 {name:'sleepLatency',label:'Falling asleep',question:'About how long did it take you to fall asleep?',unit:'min',max:1440,min:0,step:1},
 {name:'sleepAwakenings',label:'Awakenings',question:'How many times did you wake during that sleep period?',unit:'times',max:100,min:0,step:1},

 {name:'sleepDayImpact',label:'Today’s tasks',question:'How much is your sleep affecting today’s tasks?',options:[['none','Not at all'],['some','Somewhat'],['much','A lot']]}
];
export const questionnaireItems=kind=>kind==='mood'?moodQuestions.map(([question,options],i)=>({name:`moodQ${i+1}`,label:moodTopics[i],question,options:options.map((label,j)=>[String(j),label])})):sleepQuestions;
const get=(fields,name)=>fields.find(f=>f.name===name&&f.checked!==false)?.value??'';
export function questionnaireStep(kind,fields){
 const items=questionnaireItems(kind),saved=get(fields,kind+'Step');
 const legacy=kind==='mood'&&get(fields,'moodPage')!==''?Number(get(fields,'moodPage'))*2:0;
 const step=Math.max(0,Math.min(items.length,Math.floor(Number(saved===''?legacy:saved)||0)));
 return step===items.length&&!items.some(item=>String(get(fields,item.name)).trim()!=='')?0:step;
}
export function sleepEfficiency(bed,asleep){
 if(!['number','string'].includes(typeof bed)||!['number','string'].includes(typeof asleep)||bed==null||asleep==null||String(bed).trim()===''||String(asleep).trim()==='')return null;
 const b=Number(bed),a=Number(asleep);return Number.isFinite(b)&&Number.isFinite(a)&&b>0&&b<=24&&a>=0&&a<=b?Math.round(a/b*1000)/10:null;
}
export function renderQuestionnaire(kind,fields,view){
 const items=questionnaireItems(kind),step=questionnaireStep(kind,fields);
 return `<section class="checkin-conversation" data-questionnaire="${kind}" data-collection-screen="${kind}"${view===kind?'':' hidden'}><h2 class="questionnaire-accessible" tabindex="-1">${kind==='mood'?'Mood check-in':'Sleep quality'}</h2><input type="hidden" name="${kind}Step" value="${step}"><div class="questionnaire-progress"><span data-questionnaire-position></span><progress max="${items.length}" value="0" aria-label="Answers completed"></progress></div><div class="questionnaire-stage">${items.map((item,i)=>`<fieldset class="checkin-question" data-questionnaire-item="${i}"${step===i?'':' hidden'}><legend tabindex="-1">${esc(item.question)}</legend>${item.options?`<div class="questionnaire-options" style="--answer-count:${item.options.length}">${item.options.map(([value,label])=>`<label><input type="radio" name="${item.name}" value="${value}"${get(fields,item.name)===value?' checked':''}><span>${esc(label)}</span></label>`).join('')}</div><p class="questionnaire-hint">Choose an answer, then Next</p>`:`<label class="collection-value questionnaire-number"><input aria-label="${esc(item.label)}" type="number" name="${item.name}" inputmode="decimal" min="${item.min}" max="${item.max}" step="${item.step}" placeholder="—" value="${esc(get(fields,item.name))}"><span>${item.unit}</span></label><p class="questionnaire-hint">${item.name==='sleepTimeInBed'?'Include time awake during that sleep period. Your best estimate is enough.':'Your best estimate is enough'}</p>`}</fieldset>`).join('')}<section class="questionnaire-review" data-questionnaire-summary${step===items.length?'':' hidden'}><h3 tabindex="-1">Your ${kind==='mood'?'mood':'sleep'} check-in</h3><p data-questionnaire-completion></p>${kind==='sleepQuality'?'<output class="sleep-efficiency" data-sleep-efficiency aria-live="polite"></output>':''}<div class="questionnaire-review-list">${items.map((item,i)=>`<button type="button" data-questionnaire-edit="${i}" aria-label="Edit: ${esc(item.question)}"><span>${esc(item.label)}</span><strong data-questionnaire-answer="${i}">Not answered</strong><span aria-hidden="true">↗</span></button>`).join('')}</div>${kind==='mood'?`<label class="questionnaire-note">Anything affecting your mood? <small>Optional</small><span class="collection-text-entry"><textarea name="moodNote" rows="2" maxlength="500" placeholder="Add a note for yourself">${esc(get(fields,'moodNote'))}</textarea></span></label><p class="questionnaire-privacy">For crew or psychological support, use your mission channel. These answers are not sent to anyone.</p>`:'<p class="questionnaire-privacy">Sleep efficiency = time asleep ÷ time in bed. It is an estimate, separate from how rested you feel. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4751425/" target="_blank" rel="noopener noreferrer">Method ↗</a></p>'}</section></div><div class="questionnaire-controls"><button type="button" data-questionnaire-back${step===0?' disabled':''}>← Back</button><span class="questionnaire-private">Optional · stays on this device</span><button type="button" data-questionnaire-skip${step===items.length?' hidden':''}>Skip</button><button type="button" data-questionnaire-next${step===items.length?' hidden':''}>Next →</button></div></section>`;
}
export function syncQuestionnaire(form){
 for(const flow of form.querySelectorAll('[data-questionnaire]')){
  const kind=flow.dataset.questionnaire,items=questionnaireItems(kind),step=Number(form.elements[kind+'Step'].value),review=step===items.length;
  let completed=0;
  for(const [i,item] of items.entries()){
   const input=form.elements[item.name],raw=input?.value??'',valid=raw!==''&&(item.options?item.options.some(([key])=>key===raw):input.validity.valid);
   if(valid)completed++;
   flow.querySelector(`[data-questionnaire-answer="${i}"]`).textContent=valid?(item.options?item.options.find(([key])=>key===raw)[1]:`${raw} ${item.unit}`):'Not answered';
  }
  flow.querySelector('[data-questionnaire-position]').textContent=review?'Review':`${step+1} of ${items.length}`;
  flow.querySelector('progress').value=completed;
  flow.querySelector('[data-questionnaire-completion]').textContent=`${completed} of ${items.length} answered. You can leave any question blank.`;
  const next=flow.querySelector('[data-questionnaire-next]');next.hidden=review;next.textContent=step===items.length-1?'View answers →':'Next →';next.disabled=!review&&String(form.elements[items[step]?.name]?.value??'').trim()==='';
  flow.querySelector('[data-questionnaire-skip]').hidden=review;
  flow.querySelector('[data-questionnaire-back]').disabled=step===0;

  if(kind==='sleepQuality'){const output=flow.querySelector('[data-sleep-efficiency]'),efficiency=sleepEfficiency(form.elements.sleepTimeInBed.value,form.elements.sleepTimeAsleep.value);output.innerHTML=efficiency===null?'':'<strong>'+efficiency+'<small>%</small></strong><span>Estimated sleep efficiency</span>'}
 }
}
export function setQuestionnairePage(form,kind,requested){
 const items=questionnaireItems(kind),step=Math.max(0,Math.min(items.length,Math.floor(Number(requested)||0))),flow=form.querySelector(`[data-questionnaire="${kind}"]`);
 const old=Number(form.elements[kind+'Step'].value);form.elements[kind+'Step'].value=String(step);
 for(const el of flow.querySelectorAll('[data-questionnaire-item]'))el.hidden=Number(el.dataset.questionnaireItem)!==step;
 flow.querySelector('[data-questionnaire-summary]').hidden=step!==items.length;
 syncQuestionnaire(form);
 const active=step===items.length?flow.querySelector('.questionnaire-review h3'):flow.querySelector(`[data-questionnaire-item="${step}"] legend`);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)active.parentElement.animate([{opacity:0,transform:`translateX(${step<old?-16:16}px)`},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
 active.focus({preventScroll:true});
}
const initialized=new WeakSet();
export function initializeQuestionnaires(form,onUpdate){
 if(initialized.has(form))return;initialized.add(form);
 const go=(kind,to)=>{setQuestionnairePage(form,kind,to);onUpdate()};
 form.addEventListener('click',event=>{
  const flow=event.target.closest('[data-questionnaire]');if(!flow)return;const kind=flow.dataset.questionnaire,step=Number(form.elements[kind+'Step'].value);
  const nav=event.target.closest('[data-questionnaire-back],[data-questionnaire-next],[data-questionnaire-skip],[data-questionnaire-edit]');
  if(nav){if(nav.hasAttribute('data-questionnaire-next')){const item=questionnaireItems(kind)[step],input=form.elements[item.name];if(input?.willValidate&&!input.validity.valid){input.reportValidity();return}}go(kind,nav.hasAttribute('data-questionnaire-edit')?Number(nav.dataset.questionnaireEdit):step+(nav.hasAttribute('data-questionnaire-next')||nav.hasAttribute('data-questionnaire-skip')?1:-1));return}
 });
 form.addEventListener('keydown',event=>{if(!event.target.closest('[data-questionnaire]'))return;if(event.key==='Enter'&&event.target.matches('.checkin-question input')){event.preventDefault();event.target.closest('[data-questionnaire]').querySelector('[data-questionnaire-next]').click()}});
 form.addEventListener('change',()=>syncQuestionnaire(form));form.addEventListener('input',()=>syncQuestionnaire(form));syncQuestionnaire(form);
}
