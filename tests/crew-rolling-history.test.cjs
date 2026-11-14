const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({window:{},structuredClone});
vm.runInContext(fs.readFileSync(new URL('../design/crew-demo.js','file://'+__filename),'utf8'),context);
const {makeRecords,refreshRecords}=context.window.CrewDemo;
const day=value=>{const d=new Date(value);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`};
test('365 presentation days roll across weeks, months, years and leap days',()=>{
 let records=makeRecords(new Date(2026,10,9,14));
 for(const now of [new Date(2026,10,16,14),new Date(2027,0,2,2),new Date(2028,1,29,23),new Date(2028,2,1,1)]){
  records=refreshRecords(records,now);
  assert.equal(records.alex.pulse.length,365);
  assert.equal(day(records.alex.pulse.at(-1).time),day(now));
  assert(records.alex.pulse.every(row=>Date.parse(row.time)<=+now));
  assert.equal(new Set(records.alex.pulse.map(row=>day(row.time))).size,365);
  assert.equal(JSON.stringify(refreshRecords(records,now)),JSON.stringify(records));
 }
});
test('refresh preserves manual, sensor and repeated observations without moving their dates',()=>{
 const old=makeRecords(new Date(2026,10,9,14));
 const personal=[{value:81,time:'2026-11-09T10:00:00Z',recordedAt:'2026-11-09T10:01:00Z',source:'Manual check-in'},{value:79,time:'2026-11-09T10:04:00Z',source:'Manual repeat'},{value:78,time:'2026-11-09T10:05:00Z',source:'Bluetooth sensor',deviceId:'sensor-1'}];
 old.alex.pulse.push(...personal);const before=JSON.stringify(old);
 const fresh=refreshRecords(old,new Date(2026,10,16,14));
 assert.equal(JSON.stringify(old),before);assert.equal(fresh.alex.pulse.length,368);
 assert.equal(JSON.stringify(fresh.alex.pulse.filter(row=>row.source!=='Scenario history')),JSON.stringify(personal));
});
test('fresh presentation rows cannot clear a saved urgent symptom report',()=>{
 const old=makeRecords(new Date(2026,10,9,14));
 const urgent={value:'urgent',time:'2026-11-09T10:00:00Z',source:'Manual check-in',tags:['chest-pain']};old.alex.symptoms.push(urgent);
 const fresh=refreshRecords(old,new Date(2026,10,16,14));
 assert.equal(JSON.stringify(fresh.alex.symptoms.at(-1)),JSON.stringify(urgent));
 assert(fresh.alex.symptoms.filter(row=>row.source==='Scenario history').every(row=>Date.parse(row.time)<Date.parse(urgent.time)));
});
test('an open app refreshes at a new day and a later visit rebuilds the same rolling window',()=>{
 let clock=+new Date(2026,10,9,14);class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value))};
 const makeApp=()=>{const c=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},document:{documentElement:{hasAttribute(){return true}},addEventListener(){},querySelectorAll(){return[]}},localStorage:storage,Date:ClockDate,structuredClone,console,CustomEvent:class{}});for(const name of ['crew-demo','crew-health'])vm.runInContext(fs.readFileSync(new URL('../design/'+name+'.js','file://'+__filename),'utf8'),c);return c.window.CrewDesign};
 const api=makeApp();api.saveOverview('alex',{pulse:82},'',{source:'Manual check-in',context:'rest'});const original=api.history('alex','pulse').find(row=>row.source==='Manual check-in');
 clock=+new Date(2026,10,16,14);api.refreshPresentation();
 assert.equal(day(api.history('alex','pulse').at(-1).time),day(clock));
 assert.equal(JSON.stringify(api.history('alex','pulse').find(row=>row.source==='Manual check-in')),JSON.stringify(original));
 const reloaded=makeApp();assert.equal(day(reloaded.history('alex','pulse').at(-1).time),day(clock));assert.equal(reloaded.history('alex','pulse').length,366);
});

test('every measurement spans the year at its sampling cadence, including self-reports and both lab tests',()=>{
 const now=new Date(2026,10,14,12),records=makeRecords(now).alex;
 for(const field of ['pulse','oxygen','sleep','water','exercise','mood','sleepQuality','symptoms'])assert.equal(records[field].length,365,field);
 for(const field of ['pressure','temperature','glucose','weight','symptoms','sleepQuality']){
  assert(Date.parse(records[field][0].time)<+now-350*86400000,field+' needs year-long coverage');
  assert(new Set(records[field].map(row=>JSON.stringify(row.value))).size>1,field+' must vary');
 }
 for(const sample of ['saliva','urine']){
  const rows=records.immunityChecks.filter(row=>row.sample===sample);assert(rows.length>=26);assert(Date.parse(rows[0].time)<+now-350*86400000);
  assert(rows.some(row=>row.result==='Not detected'&&row.unit===''));assert(rows.some(row=>Number.isFinite(Number(row.result))&&row.unit==='copies/mL'));
 }
});
test('rolling tomorrow keeps the values, timestamps and sampling of shared calendar dates stable',()=>{
 const today=makeRecords(new Date(2026,10,14,12)).alex,tomorrow=makeRecords(new Date(2026,10,15,12)).alex;
 for(const [field,rows] of Object.entries(today)){
  const byDate=new Map(tomorrow[field].map(row=>[row.time+(row.sample||''),row]));let compared=0;
  for(const row of rows){const same=byDate.get(row.time+(row.sample||''));if(same){assert.equal(JSON.stringify(same),JSON.stringify(row),field);compared++}}
  assert(compared>20,field+' should share historical observations');
 }
});
test('a new authored lab result cannot overtake a saved result; the other sample still rolls',()=>{
 const old=makeRecords(new Date(2026,10,14,12)),manual={sample:'saliva',test:'EBV DNA',result:'88',unit:'copies/mL',time:'2026-11-14T10:00:00Z',recordedAt:'2026-11-14T10:02:00Z',source:'Manual laboratory report'};
 old.alex.immunityChecks.push(manual);const before=JSON.stringify(old);
 const fresh=refreshRecords(old,new Date(2026,11,14,12)).alex.immunityChecks;
 assert.equal(JSON.stringify(old),before);assert.equal(JSON.stringify(fresh.filter(row=>row.source==='Manual laboratory report')),JSON.stringify([manual]));
 assert(fresh.filter(row=>row.sample==='saliva'&&row.source==='Scenario history').every(row=>Date.parse(row.time)<Date.parse(manual.time)));
 assert(fresh.some(row=>row.sample==='urine'&&Date.parse(row.time)>Date.parse(manual.time)));
});

test('authored routine diversity stays plausible and does not manufacture emergency oxygen drops',()=>{
 for(const now of [new Date(2026,10,14,12),new Date(2027,4,20,12),new Date(2028,1,29,12)]){
  const r=makeRecords(now).alex;
  const bounds={pulse:[60,100,12],oxygen:[96,100,4],sleep:[6,9,12],water:[1.5,3,8],exercise:[60,140,25],temperature:[36.1,37.2,6],glucose:[70,99,10],weight:[68,72,10]};
  for(const [field,[low,high,variety]] of Object.entries(bounds)){
   assert(r[field].every(row=>row.value>=low&&row.value<=high),field+' has an implausible routine value');
   assert(new Set(r[field].map(row=>row.value)).size>=variety,field+' is too repetitive');
  }
  assert(r.pressure.every(row=>row.value.systolic>=100&&row.value.systolic<120&&row.value.diastolic>=60&&row.value.diastolic<80));
  assert.equal(new Set(r.mood.map(row=>row.value)).size,3);assert.equal(new Set(r.sleepQuality.map(row=>row.value)).size,3);
  for(let i=1;i<r.oxygen.length;i++)assert(Math.abs(r.oxygen[i].value-r.oxygen[i-1].value)<=1);
 }
});
test('short-sleep episodes have coherent self-reports and activity, rather than unrelated random warnings',()=>{
 const r=makeRecords(new Date(2026,10,14,12)).alex;
 const byTime=field=>new Map(r[field].map(row=>[row.time,row]));const quality=byTime('sleepQuality'),mood=byTime('mood'),symptoms=byTime('symptoms'),exercise=byTime('exercise');let nights=0;
 for(const row of r.sleep)if(row.value<7){
  nights++;assert(['poor','mixed'].includes(quality.get(row.time).value));assert(['neutral','low'].includes(mood.get(row.time).value));assert.equal(symptoms.get(row.time).value,'concerning');assert(exercise.get(row.time).value<100);assert(Date.parse(symptoms.get(row.time).onset)<=Date.parse(row.time));
 }
 assert(nights>=9&&nights<=15);
});
