import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {historySeries,renderHistoryScene} from '../design/crew-history-scene.js';
const context=vm.createContext({window:{},structuredClone});
vm.runInContext(readFileSync(new URL('../design/crew-demo.js',import.meta.url),'utf8'),context);
const now=+new Date(2026,10,14,12),records=context.window.CrewDemo.makeRecords(new Date(now)).alex;
const reports={mood:records.mood,sleepQuality:records.sleepQuality,symptoms:records.symptoms,immunity:records.immunityChecks};

test('every selectable history period uses actual observations within that window across measurements and reports',()=>{
 for(const field of ['pulse','pressure','oxygen','glucose','temperature','sleep','water','exercise','weight','mood','sleepQuality','symptoms','saliva','urine']){
  let previous=0;
  for(const days of [30,90,120,365]){
   const {points}=historySeries({histories:records,reports,field,days,now});
   if(['saliva','urine'].includes(field))assert(reports.immunity.some(r=>r.sample===field&&Date.parse(r.time)>=now-days*86400000));else assert(points.length>0,`${field}: ${days} days`);assert(points.length>=previous);previous=points.length;
   assert(points.every(row=>row.time>=now-days*86400000&&row.time<=now));
   if(days===365)assert(points[0].time<now-330*86400000,field+' must not stop at 120 days');
  }
 }
});
test('a saved heart rate remains the latest chart observation alongside the authored year',()=>{
 const manual={value:88,time:new Date(now).toISOString(),context:'rest',source:'Manual check-in'};
 const histories={...records,pulse:[...records.pulse,manual]};
 const {points}=historySeries({histories,field:'pulse',days:365,now});assert.equal(points.length,366);assert.equal(points.at(-1).value,88);assert.equal(points.at(-1).source,'Manual check-in');
 const html=renderHistoryScene({histories,field:'pulse',days:365,now});assert.match(html,/Manual check-in/);assert.doesNotMatch(html,/Demo data · not from Bluetooth/);
});

test('long numeric charts use actual daily latest readings, while short charts and report timelines retain individual observations',()=>{
 const entries=[{value:70,time:new Date(now-2*3600000).toISOString(),context:'rest',source:'Manual'},{value:88,time:new Date(now-3600000).toISOString(),context:'rest',source:'Manual'}];
 const options={histories:{pulse:entries},field:'pulse',now};
 assert.equal(historySeries({...options,days:365}).points.length,2);
 const year=renderHistoryScene({...options,days:365}),month=renderHistoryScene({...options,days:30});
 assert.equal((year.match(/data-history-reading /g)||[]).length,1);assert.match(year,/Latest per day/);assert.match(year,/88 bpm/);
 assert.equal((month.match(/data-history-reading /g)||[]).length,2);assert.doesNotMatch(month,/Latest per day/);
 const symptoms=renderHistoryScene({reports:{symptoms:entries.map((r,i)=>({...r,value:i?'urgent':'none'}))},field:'symptoms',days:365,now});assert.equal((symptoms.match(/data-history-reading /g)||[]).length,2);
 const lab=renderHistoryScene({reports:{immunity:entries.map(r=>({...r,sample:'saliva',result:String(r.value),unit:'copies/mL'}))},field:'saliva',days:365,now});assert.equal((lab.match(/data-history-reading /g)||[]).length,2);
});

test('oxygen values and chart padding cannot exceed the physical percentage range',()=>{
 const histories={oxygen:[-1,97,100,101].map((value,i)=>({value,context:'rest',time:new Date(now-(4-i)*86400000).toISOString()}))};
 assert.deepEqual(historySeries({histories,field:'oxygen',now}).points.map(row=>row.value),[97,100]);
 const html=renderHistoryScene({histories,field:'oxygen',now});assert.match(html,/<span>100<\/span>/);assert.doesNotMatch(html,/<span>100\.\d|<span>101/);
});
