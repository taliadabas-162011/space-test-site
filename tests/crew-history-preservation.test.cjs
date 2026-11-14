const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const now=+new Date(2026,10,10,14);
class ClockDate extends Date { constructor(...args){super(...(args.length?args:[now]))}static now(){return now} }
function app(data=new Map()){
 const context=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},document:{documentElement:{hasAttribute(){return true}},addEventListener(){},querySelectorAll(){return[]}},localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value))},Date:ClockDate,structuredClone,console,CustomEvent:class{}});
 for(const file of ['crew-demo.js','crew-health.js'])vm.runInContext(fs.readFileSync(new URL('../design/'+file,'file://'+__filename),'utf8'),context);
 return {api:context.window.CrewDesign,seed:context.window.CrewDemo,data};
}
const readings={pulse:81,pressure:{systolic:122,diastolic:78},oxygen:99,glucose:88,temperature:36.9,weight:71,sleep:8,water:2.4,exercise:95};
const snapshot=api=>Object.fromEntries(Object.keys(readings).map(field=>[field,JSON.stringify(api.history('alex',field))]));
test('all numeric presentation histories vary at their actual sampling cadence',()=>{
 const {api}=app();
 for(const field of Object.keys(readings))assert(new Set(api.history('alex',field).map(row=>JSON.stringify(row.value))).size>1,`${field} must not flatten to one sample value`);
});
for(const [field,value] of Object.entries(readings))test(`${field}: manual, repeat and sensor saves append without changing any existing measurement`,async()=>{
 const {api,data}=app(),{historySeries}=await import('../design/crew-history-scene.js');
 for(const source of ['Manual check-in','Manual repeat','Bluetooth · Test sensor']){
  const before=snapshot(api),original=api.history('alex',field);
  const details={source,context:'rest',glucoseContext:'fasting'};
  api.saveOverview('alex',{[field]:value},'',details);
  const after=api.history('alex',field);
  assert.equal(after.length,original.length+1);
  assert.equal(JSON.stringify(after.slice(0,-1)),before[field]);
  assert.equal(JSON.stringify(after.at(-1).value),JSON.stringify(value));assert.equal(after.at(-1).source,source);
  for(const other of Object.keys(readings))if(other!==field)assert.equal(JSON.stringify(api.history('alex',other)),before[other],`${field} changed ${other}`);
  const plotted=historySeries({histories:{[field]:after},field,now}).points;
  assert.equal(plotted.length,after.length);assert.equal(JSON.stringify(plotted.map(p=>p.value)),JSON.stringify(after.map(row=>row.value)));
  const reloaded=app(data).api;for(const other of Object.keys(readings))assert.equal(JSON.stringify(reloaded.history('alex',other)),JSON.stringify(api.history('alex',other)),`${other} changed on reload`);
  api.refreshPresentation();assert.equal(JSON.stringify(api.history('alex',field)),JSON.stringify(after));
 }
});
test('existing flat glucose samples are refreshed while an entered 88 remains unchanged',()=>{
 const initial=app(),stored=initial.seed.makeRecords(new ClockDate());for(const row of stored.alex.glucose)row.value=88;
 const personal={value:88,time:new ClockDate().toISOString(),recordedAt:new ClockDate().toISOString(),source:'Manual check-in',context:'fasting'};stored.alex.glucose.push(personal);
 const {api}=app(new Map([['crew-health-demo-observations-v2',JSON.stringify(stored)]]));
 const history=api.history('alex','glucose');assert(new Set(history.filter(row=>row.source==='Scenario history').map(row=>row.value)).size>1);
 assert.equal(JSON.stringify(history.filter(row=>row.source==='Manual check-in')),JSON.stringify([personal]));
});
test('manual sleep diary stores subjective quality, duration and calculated efficiency without a sensor',()=>{
 const {api,data}=app();api.saveOverview('alex',{sleep:7},'',{sleepTimeInBed:'8',sleepTimeAsleep:'7',sleepLatency:'20',sleepAwakenings:'2',sleepDayImpact:'some',sleepQuality:'mixed'});
 const saved=JSON.parse(data.get('crew-health-demo-observations-v2')).alex;assert.equal(saved.sleepAssessment.at(-1).efficiency,87.5);assert.equal(saved.sleepAssessment.at(-1).sleepAwakenings,2);assert.equal(saved.sleepQuality.at(-1).value,'mixed');assert.equal(saved.sleep.at(-1).value,7);
 const before=new Map(data);assert.throws(()=>api.saveOverview('alex',{sleep:9},'',{sleepTimeInBed:'8',sleepTimeAsleep:'9'}));for(const [key,value] of before)assert.equal(data.get(key),value);
});