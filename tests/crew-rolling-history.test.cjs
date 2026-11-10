const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({window:{},structuredClone});
vm.runInContext(fs.readFileSync(new URL('../design/crew-demo.js','file://'+__filename),'utf8'),context);
const {makeRecords,refreshRecords}=context.window.CrewDemo;
const day=value=>{const d=new Date(value);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`};
test('120 presentation days roll across weeks, months, years and leap days',()=>{
 let records=makeRecords(new Date(2026,10,9,14));
 for(const now of [new Date(2026,10,16,14),new Date(2027,0,2,2),new Date(2028,1,29,23),new Date(2028,2,1,1)]){
  records=refreshRecords(records,now);
  assert.equal(records.alex.pulse.length,120);
  assert.equal(day(records.alex.pulse.at(-1).time),day(now));
  assert(records.alex.pulse.every(row=>Date.parse(row.time)<=+now));
  assert.equal(new Set(records.alex.pulse.map(row=>day(row.time))).size,120);
  assert.equal(JSON.stringify(refreshRecords(records,now)),JSON.stringify(records));
 }
});
test('refresh preserves manual, sensor and repeated observations without moving their dates',()=>{
 const old=makeRecords(new Date(2026,10,9,14));
 const personal=[{value:81,time:'2026-11-09T10:00:00Z',recordedAt:'2026-11-09T10:01:00Z',source:'Manual check-in'},{value:79,time:'2026-11-09T10:04:00Z',source:'Manual repeat'},{value:78,time:'2026-11-09T10:05:00Z',source:'Bluetooth sensor',deviceId:'sensor-1'}];
 old.alex.pulse.push(...personal);const before=JSON.stringify(old);
 const fresh=refreshRecords(old,new Date(2026,10,16,14));
 assert.equal(JSON.stringify(old),before);assert.equal(fresh.alex.pulse.length,123);
 assert.equal(JSON.stringify(fresh.alex.pulse.filter(row=>row.source!=='Scenario history')),JSON.stringify(personal));
});
test('fresh presentation rows cannot clear a saved urgent symptom report',()=>{
 const old=makeRecords(new Date(2026,10,9,14));
 const urgent={value:'urgent',time:'2026-11-09T10:00:00Z',source:'Manual check-in',tags:['chest-pain']};old.alex.symptoms.push(urgent);
 const fresh=refreshRecords(old,new Date(2026,10,16,14));
 assert.equal(JSON.stringify(fresh.alex.symptoms),JSON.stringify([urgent]));
});
test('an open app refreshes at a new day and a later visit rebuilds the same rolling window',()=>{
 let clock=+new Date(2026,10,9,14);class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value))};
 const makeApp=()=>{const c=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},document:{documentElement:{hasAttribute(){return true}},addEventListener(){},querySelectorAll(){return[]}},localStorage:storage,Date:ClockDate,structuredClone,console,CustomEvent:class{}});for(const name of ['crew-demo','crew-health'])vm.runInContext(fs.readFileSync(new URL('../design/'+name+'.js','file://'+__filename),'utf8'),c);return c.window.CrewDesign};
 const api=makeApp();api.saveOverview('alex',{pulse:82},'',{source:'Manual check-in',context:'rest'});const original=api.history('alex','pulse').find(row=>row.source==='Manual check-in');
 clock=+new Date(2026,10,16,14);api.refreshPresentation();
 assert.equal(day(api.history('alex','pulse').at(-1).time),day(clock));
 assert.equal(JSON.stringify(api.history('alex','pulse').find(row=>row.source==='Manual check-in')),JSON.stringify(original));
 const reloaded=makeApp();assert.equal(day(reloaded.history('alex','pulse').at(-1).time),day(clock));assert.equal(reloaded.history('alex','pulse').length,121);
});
