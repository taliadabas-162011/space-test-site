import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRepeat,repeatPayload,repeatComparison,renderRepeat,repeatFields} from '../design/crew-repeat.js';
const now=Date.parse('2026-11-10T12:15:00Z'),baseline={value:94,time:'2026-11-10T12:00:00Z',context:'rest',source:'Manual check-in'};
const fields=values=>Object.entries(values).map(([name,value])=>({name,value}));
test('repeat is one named measurement with an immutable original and a visible guide',()=>{
 const state=createRepeat('oxygen',baseline,now);state.baseline.value=90;assert.equal(baseline.value,94);
 for(const field of repeatFields){const sample={...baseline,value:field==='pressure'?{systolic:120,diastolic:80}:field==='temperature'?36.8:94};const html=renderRepeat(createRepeat(field,sample,now));assert(html.includes('data-repeat-next'));assert(!html.includes('role="dialog"'));assert(!html.includes('data-collection-measure'));}
 assert.throws(()=>createRepeat('mood',baseline,now));assert.throws(()=>createRepeat('oxygen',{...baseline,value:null},now));
});
test('repeat payload writes only its result and leaves symptoms and daily fields alone',()=>{
 const state=createRepeat('oxygen',baseline,now),input=fields({oxygen:'98',sleep:'2',symptoms:'none',context:'rest',measuredAt:'2026-11-10T12:10:00Z'}),snapshot=structuredClone(input);
 const payload=repeatPayload(state,input,now);assert.deepEqual(payload.values,{oxygen:98});assert.equal(payload.details.source,'Manual repeat');assert.equal(payload.details.mood,undefined);assert.equal(payload.details.symptomTags,undefined);assert.equal(payload.entry.context,'rest');assert.deepEqual(input,snapshot);assert.equal(state.baseline.value,94);
 assert.deepEqual(repeatComparison({...state,result:payload.entry}),{comparable:true,delta:'+4'});
 assert.equal(repeatComparison({...state,result:{...payload.entry,context:'after-activity'}}).comparable,false);
 assert.equal(repeatComparison({...state,baseline:{...baseline,context:''},result:payload.entry}).comparable,false);
});
test('blank, invalid, partial pressure and mistimed repeats cannot be saved',()=>{
 const state=createRepeat('oxygen',baseline,now),good={oxygen:'98',context:'rest',measuredAt:'2026-11-10T12:10:00Z'};
 for(const patch of [{oxygen:''},{oxygen:'NaN'},{oxygen:'101'},{oxygen:'98.5'},{context:''},{measuredAt:'2026-11-10T11:59:00Z'},{measuredAt:'2026-11-10T12:16:00Z'}])assert.throws(()=>repeatPayload(state,fields({...good,...patch}),now));
 const pressure=createRepeat('pressure',{...baseline,value:{systolic:118,diastolic:78}},now);
 assert.throws(()=>repeatPayload(pressure,fields({...good,systolic:'120',diastolic:''}),now));
 const saved=repeatPayload(pressure,fields({...good,systolic:'122',diastolic:'80'}),now);assert.deepEqual(saved.values,{pressure:{systolic:122,diastolic:80}});assert.equal(repeatComparison({...pressure,result:saved.entry}).delta,'+4/+2');
});
test('temperature site and glucose meal timing stay part of the comparison',()=>{
 const state=createRepeat('temperature',{...baseline,value:36.7,site:'oral'},now),values={temperature:'36.8',temperatureSite:'oral',context:'rest',measuredAt:'2026-11-10T12:10:00Z'};
 assert.throws(()=>repeatPayload(state,fields({...values,temperatureSite:''}),now));
 const payload=repeatPayload(state,fields(values),now);assert.equal(payload.entry.site,'oral');assert.equal(repeatComparison({...state,result:payload.entry}).comparable,true);assert.equal(repeatComparison({...state,result:{...payload.entry,site:'ear'}}).comparable,false);
 const glucose=createRepeat('glucose',{...baseline,value:90,context:'fasting'},now);assert(renderRepeat({...glucose,phase:'entry'}).includes('value="fasting" selected'));
 const repeat=repeatPayload(glucose,fields({...values,glucose:'100',glucoseContext:'after-meal'}),now);assert.equal(repeat.entry.context,'after-meal');assert.equal(repeatComparison({...glucose,result:repeat.entry}).comparable,false);
});

test('minute precision keeps a repeat ordered after an original with seconds',()=>{
 const state=createRepeat('oxygen',{...baseline,time:'2026-11-10T12:10:35Z'},now);
 const payload=repeatPayload(state,fields({oxygen:'99',context:'rest',measuredAt:'2026-11-10T12:10:00Z'}),now);
 assert.equal(payload.entry.time,'2026-11-10T12:10:35.000Z');
});
