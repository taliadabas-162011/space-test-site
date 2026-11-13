import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderVitalAid, vitalChoices, isVitalView} from '../design/crew-vital-aid.js';

test('each reading has high, low and unsure guides with a visual and sources',()=>{
 for(const [metric] of vitalChoices){
  assert.match(renderVitalAid(metric),/data-assist-direction="low"/);
  for(const direction of ['high','low','unsure']){
   const view=`${metric}-${direction}`,html=renderVitalAid(view);
   assert.equal(isVitalView(view),true);
   assert.match(html,/assistance-visual-grid/);
   assert.match(html,/<img /);
   assert.match(html,/NASA research/);
   assert.match(html,/data-assist-voice/);
   assert.equal((html.match(/<li>/g)||[]).length,4);
  }
 }
 assert.equal(isVitalView('other-low'),false);
});

test('specific urgent thresholds and swallowing precautions remain visible',()=>{
 assert.match(renderVitalAid('glucose-low'),/unable to swallow\? Give nothing by mouth/);
 assert.match(renderVitalAid('glucose-low'),/below 70 mg\/dL/);
 assert.match(renderVitalAid('pressure-high'),/180 systolic or 120 diastolic/);
 assert.match(renderVitalAid('temperature-low'),/35 °C/);
 assert.match(renderVitalAid('glucose-low'),/general CDC guidance/);
});
