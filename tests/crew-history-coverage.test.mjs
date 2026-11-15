import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {historySeries,renderHistoryScene} from '../design/crew-history-scene.js';
const sandbox=vm.createContext({window:{},structuredClone});
vm.runInContext(fs.readFileSync(new URL('../design/crew-demo.js',import.meta.url),'utf8'),sandbox);
const fields=['pulse','pressure','oxygen','glucose','temperature','sleep','water','exercise','mood','sleepQuality','saliva','urine'];
const dataFor=now=>{const rows=sandbox.window.CrewDemo.makeRecords(now).alex;return {histories:rows,reports:{mood:rows.mood,sleepQuality:rows.sleepQuality,immunity:rows.immunityChecks}}};
test('every demo measurement has readings in all four ranges over many calendar dates',()=>{
 for(let d=0;d<60;d++){
  const now=new Date(2026,10,1+d,12);const data=dataFor(now);
  for(const field of fields)for(const days of [30,90,120,365]){
   const series=historySeries({...data,field,days,now:+now});
   assert.ok(series.points.length>0,`${field} ${days} days on ${now.toISOString()}`);
  }
 }
});
test('missing personal data shows a clearly marked example without creating a reading',()=>{
 const now=new Date(2026,10,15,12),example=dataFor(now);
 const markup=renderHistoryScene({field:'saliva',days:30,now:+now,example});
 assert.match(markup,/Example graph/);assert.match(markup,/not your measurements/);assert.match(markup,/data-history-chart/);
 assert.doesNotMatch(markup,/data-repeat-measurement/);
 const blank=renderHistoryScene({field:'saliva',days:30,now:+now});
 assert.match(blank,/No numeric reports/);assert.doesNotMatch(blank,/data-history-chart/);
});

test('demo graph is clearly labeled and never offers a sample reading to repeat',()=>{
 const now=new Date(2026,10,15,12),data=dataFor(now);
 const markup=renderHistoryScene({...data,field:'oxygen',days:30,now:+now,demoOnly:true});
 assert.match(markup,/Demo graph/);assert.match(markup,/not your measurements/);assert.match(markup,/Demo reading/);assert.doesNotMatch(markup,/data-repeat-measurement/);
});
