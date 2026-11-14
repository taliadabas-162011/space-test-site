import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resetMeasurementGuide,measurementGuides} from '../design/crew-collection.js';
import {guideVisual} from '../design/crew-measurement-guides.js';
import {navigateImmunity} from '../design/crew-immunity.js';

test('every measurement guide resets steps, images, source view and controls without touching entered values',()=>{
 for(const [field,spec] of Object.entries(measurementGuides)){
  const input={value:'88'},steps=spec.steps.map((_,index)=>({hidden:index!==spec.steps.length-1}));
  const source={hidden:false},visual={style:{minHeight:'600px'}},image=spec.image?{src:'last',style:{},alt:'last'}:null,back={disabled:false},next={textContent:'Enter result'},progress={textContent:'Last'};
  const guide={dataset:{measureGuide:field,step:String(steps.length-1),about:'true'},querySelectorAll:()=>steps,querySelector:selector=>({'.measurement-source':source,'.measurement-visual':visual,'.measurement-filmstrip':image,'[data-guide-back]':back,'[data-guide-next]':next,'[data-guide-progress]':progress,'input':input})[selector]};
  resetMeasurementGuide(guide);
  assert.equal(guide.dataset.step,'0',field);assert.equal(guide.dataset.about,'false');assert(source.hidden);assert.equal(visual.style.minHeight,'');assert(back.disabled);
  assert.equal(steps[0].hidden,false);assert(steps.slice(1).every(step=>step.hidden));assert.equal(progress.textContent,`1 / ${steps.length}`);
  assert.equal(next.textContent,steps.length===1?(field==='symptoms'?'Log symptoms':'Enter result'):'Next');
  if(image){assert.equal(image.src,guideVisual(field,0).url);assert.equal(image.alt,spec.steps[0][0]);}
  assert.equal(input.value,'88');
 }
});
test('reopening either immunity walkthrough starts at the first step and closes its source disclosure',()=>{
 const originalWidth=globalThis.innerWidth,originalMedia=globalThis.matchMedia;
 globalThis.innerWidth=1280;globalThis.matchMedia=()=>({matches:true});
 try{
  for(const sample of ['saliva','urine']){
   const source={open:true},steps=Array.from({length:4},()=>({hidden:false,querySelector:()=>({focus(){}})})),back={},next={},results={hidden:false},value={value:'88'};
   const guide={dataset:{},hidden:true,querySelectorAll:selector=>selector==='details[open]'?[source]:steps,querySelector:selector=>selector==='[data-immunity-back]'?back:next};
   const root={querySelector:selector=>selector==='.immunity-results'?results:selector==='h2'?{focus(){}}:guide,querySelectorAll:()=>[guide]};
   const form={querySelector:()=>root,value};
   navigateImmunity(form,sample,3);navigateImmunity(form,null);navigateImmunity(form,sample);
   assert.equal(guide.dataset.step,'0');assert.equal(source.open,false);assert(back.disabled);assert.equal(next.textContent,'Next →');assert.equal(steps[0].hidden,false);assert(steps.slice(1).every(step=>step.hidden));assert.equal(value.value,'88');
  }
 }finally{globalThis.innerWidth=originalWidth;globalThis.matchMedia=originalMedia}
});
