import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measurementGuides,guideVisual,renderMeasurementGuide} from '../design/crew-measurement-guides.js';
test('glucose teaches preparation, lancing, sample application and reading with matching imagery',()=>{
 const guide=measurementGuides.glucose;assert.equal(guide.steps.length,4);
 assert.match(guide.steps[1][0],/lancing pen/);assert.match(guide.steps[1][1],/soft fingertip pad/);assert.match(guide.steps[2][0],/blood drop/);
 assert.deepEqual(guideVisual('glucose',0),{image:'glucose-sequence-v2.png',frames:3,frame:0});
 assert.deepEqual(guideVisual('glucose',1),{image:'glucose-lancing-v4.png',frames:1,frame:0});
 assert.equal(guideVisual('glucose',2).frame,1);assert.equal(guideVisual('glucose',3).frame,2);
 const html=renderMeasurementGuide('glucose',{label:'Blood glucose'});assert.match(html,/1 \/ 4/);assert.match(html,/data-guide-skip/);assert(!html.includes('value="96"'));
});
test('all six measurement guides resolve bundled images and preserve device-specific limits',()=>{
 const sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
 for(const field of ['pulse','oxygen','pressure','temperature','glucose','weight']){
  const guide=measurementGuides[field];assert(guide.steps.length>=3,field);
  for(let step=0;step<guide.steps.length;step++){
   const visual=guideVisual(field,step);if(!visual.image)continue;
   assert(fs.existsSync(new URL('../design/assets/guides/'+visual.image,import.meta.url)),visual.image);assert(sw.includes('design/assets/guides/'+visual.image),visual.image);
   assert(visual.frame>=0&&visual.frame<visual.frames);
  }
 }
 assert.match(measurementGuides.weight.why,/full operating walkthrough requires/i);
 assert.match(measurementGuides.temperature.why,/oral digital thermometer/i);
});
