const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function app(data=new Map()){
 const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value))};
 const window={location:{search:''},addEventListener(){},dispatchEvent(){}};
 const document={documentElement:{hasAttribute(){return true}},addEventListener(){},querySelectorAll(){return []}};
 const context=vm.createContext({window,document,localStorage:storage,URLSearchParams,console,structuredClone,CustomEvent:class{}});
 for(const file of ['crew-demo.js','crew-health.js'])vm.runInContext(fs.readFileSync(new URL('../design/'+file,'file://'+__filename),'utf8'),context);
 return {api:window.CrewDesign,data,storage};
}
test('ending requested help restores the prior record and leaves every request in history',()=>{
 const {api,data}=app(),before=api.summary('alex'),count=api.symptomHistory('alex').length;
 api.requestUrgentAssistance('alex');api.requestUrgentAssistance('alex');assert.equal(api.summary('alex').symptoms,'urgent');
 assert.equal(api.endUrgentAssistance('alex').ended,true);assert.equal(api.summary('alex').symptoms,before.symptoms);assert.equal(api.summary('alex').pulse.value,before.pulse.value);
 const history=api.symptomHistory('alex');assert.equal(history.length,count+2);assert(history.slice(-2).every(entry=>Number.isFinite(Date.parse(entry.endedAt))&&entry.source.includes('ended')));
 assert.equal(api.endUrgentAssistance('alex').ended,false);assert.equal(app(data).api.summary('alex').symptoms,before.symptoms);
});
test('recovery and routine scenarios work after leaving requested help',()=>{
 const {api}=app();api.requestUrgentAssistance('alex');api.endUrgentAssistance('alex');api.setScenario('recovery');
 assert.equal(api.scenarioInfo().key,'recovery');assert.notEqual(api.summary('alex').symptoms,'urgent');assert.equal(api.summary('alex').sleep.value,5.1);
 api.setScenario('routine');assert.notEqual(api.summary('alex').symptoms,'urgent');
});
test('ending a help walkthrough does not erase a separately saved urgent symptom report',()=>{
 const {api}=app();api.saveOverview('alex',{},'urgent',{source:'Manual check-in',symptomTags:['chest-pain']});api.requestUrgentAssistance('alex');api.endUrgentAssistance('alex');
 assert.equal(api.summary('alex').symptoms,'urgent');assert.equal(api.summary('alex').symptomSource,'Manual check-in');assert.deepEqual(Array.from(api.summary('alex').symptomTags),['chest-pain']);
});
test('requested-help exit remains usable when storage fails',()=>{
 const {api,storage}=app(),before=api.summary('alex').symptoms;storage.setItem=()=>{throw new Error('Unavailable')};
 assert.equal(api.requestUrgentAssistance('alex').persisted,false);const result=api.endUrgentAssistance('alex');assert.equal(result.ended,true);assert.equal(result.persisted,false);assert.equal(api.summary('alex').symptoms,before);
 assert.throws(()=>api.endUrgentAssistance('unknown'),/Unknown crew/);
});
