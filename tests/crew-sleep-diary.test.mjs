import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sleepEfficiency,questionnaireItems} from '../design/crew-questionnaire.js';
import {collectionPayload} from '../design/crew-collection.js';
const now=Date.parse('2026-11-14T15:00:00Z');
class ClockDate extends Date {constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
function app(data=new Map()){
 const context=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},document:{documentElement:{hasAttribute(){return true}},addEventListener(){},querySelectorAll(){return[]}},localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value))},Date:ClockDate,structuredClone,console,CustomEvent:class{}});
 for(const file of ['crew-demo.js','crew-health.js'])vm.runInContext(fs.readFileSync(new URL('../design/'+file,import.meta.url),'utf8'),context);
 return {api:context.window.CrewDesign,data};
}
const saved=data=>JSON.parse(data.get('crew-health-demo-observations-v2'))?.alex;
test('sleep diary keeps perceived restedness separate from efficiency and stores manual provenance',()=>{
 const {api,data}=app();const payload=collectionPayload([{name:'sleepTimeInBed',value:'8'},{name:'sleepTimeAsleep',value:'7'},{name:'sleepLatency',value:'20'},{name:'sleepAwakenings',value:'2'},{name:'sleepQuality',value:'poor'},{name:'sleepDayImpact',value:'some'},{name:'measuredAt',value:'2026-11-14T12:00:00Z'}]);
 api.saveOverview('alex',payload.values,payload.symptoms,payload.details);const record=saved(data);
 assert.equal(record.sleepAssessment.at(-1).efficiency,87.5);assert.equal(record.sleepQuality.at(-1).value,'poor');assert.equal(record.sleepAssessment.at(-1).source,'Manual check-in');assert.equal(record.sleep.at(-1).value,7);
 assert.equal(record.sleepAssessment.at(-1).time,'2026-11-14T12:00:00.000Z');assert.equal(record.sleepAssessment.at(-1).recordedAt,'2026-11-14T15:00:00.000Z');
 assert.equal(Object.hasOwn(record.sleepAssessment.at(-1),'score'),false);assert.equal(app(data).api.selfReportHistory('alex','sleepQuality').at(-1).value,'poor');
});
test('zero hours asleep is an observation while missing sleep time never becomes zero efficiency',()=>{
 const {api,data}=app();api.saveOverview('alex',{sleep:0},'',{sleepTimeInBed:'8',sleepTimeAsleep:'0',sleepLatency:'120',sleepQuality:'poor'});assert.equal(saved(data).sleepAssessment.at(-1).efficiency,0);assert.equal(saved(data).sleep.at(-1).value,0);
 const partial=app();partial.api.saveOverview('alex',{},'',{sleepTimeInBed:'8'});assert.equal(Object.hasOwn(saved(partial.data).sleepAssessment.at(-1),'efficiency'),false);
 for(const pair of [[null,'7'],['8',undefined],['  ','7'],['8','  '],[true,true],[8,false],[{},1]])assert.equal(sleepEfficiency(...pair),null);
});
test('impossible sleep estimates and invalid input cannot partially save another reading',()=>{
 for(const detail of [{sleepTimeInBed:'8',sleepTimeAsleep:'9'},{sleepTimeInBed:'8',sleepTimeAsleep:'7',sleepLatency:'120'},{sleepTimeInBed:'8',sleepLatency:'600'},{sleepTimeInBed:false},{sleepTimeInBed:'8',sleepTimeAsleep:false},{sleepLatency:true},{sleepAwakenings:'1.5'},{sleepDayImpact:'invented'},{sleepTimeInBed:'8',measuredAt:'2026-11-14T16:00:00Z'}]){
  const {api,data}=app(),before=JSON.stringify(api.history('alex','pulse')),storage=new Map(data);
  assert.throws(()=>api.saveOverview('alex',{pulse:80},'',detail),JSON.stringify(detail));assert.equal(JSON.stringify(api.history('alex','pulse')),before);assert.deepEqual(data,storage);
 }
});
test('blank optional numeric answers remain omitted and cannot create a zero-hour sleep assessment',()=>{
 const {api,data}=app();api.saveOverview('alex',{pulse:80},'',{sleepTimeInBed:' ',sleepTimeAsleep:'\t',sleepLatency:'\n',sleepAwakenings:'  '});assert.equal(saved(data).sleepAssessment,undefined);
});
test('the six-question sleep diary has no preselected subjective answer or clinical classification',()=>{
 const items=questionnaireItems('sleepQuality');assert.equal(items.length,6);assert.deepEqual(items.find(item=>item.name==='sleepQuality').options.map(([key])=>key),['restful','mixed','poor']);
 const payload=collectionPayload([{name:'sleepTimeInBed',value:'8'},{name:'sleepTimeAsleep',value:'8'}]);assert.equal(payload.details.sleepQuality,'');assert.equal(Object.hasOwn(payload.details,'sleepScore'),false);
});
