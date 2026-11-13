import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assistanceDecision,advanceAssistance,readAssistance,writeAssistance,renderAssistance} from '../design/crew-assistance.js';
test('assessment starts with observations, never a diagnosis inferred from vital numbers',()=>{
 assert.equal(assistanceDecision({pulse:0,oxygen:90}).question,'responding');
 const responding=advanceAssistance({events:[]},'responding','yes',1000);assert.equal(assistanceDecision(responding).question,'breathing');
 assert.equal(assistanceDecision({...responding,breathing:'no'}).kind,'breathing');
 assert.equal(assistanceDecision({responding:'no',breathing:'yes'}).kind,'unresponsive');
 assert.equal(assistanceDecision({responding:'yes',breathing:'yes'}).kind,'responsive');
 for(const responding of ['no','unsure'])for(const breathing of ['no','unsure'])assert.equal(assistanceDecision({responding,breathing}).kind,'resuscitation');
});
test('changing a responsiveness observation requires breathing to be checked again',()=>{
 let state=advanceAssistance({events:[]},'responding','no',1000);state=advanceAssistance(state,'breathing','no',2000);state=advanceAssistance(state,'responding','yes',3000);
 assert.equal(state.breathing,null);assert.equal(state.events.length,3);assert.equal(assistanceDecision(state).question,'breathing');
 assert.throws(()=>advanceAssistance({},'breathing','yes'));assert.throws(()=>advanceAssistance({},'responding','maybe'));
});
test('observations persist per episode, validate stored input and retain an audit trail',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const state=advanceAssistance({events:[]},'responding','no',1000);writeAssistance('episode',state,storage);assert.deepEqual(readAssistance('episode',storage),{...state,breathing:null});assert.deepEqual(readAssistance('other',storage),{events:[]});
 writeAssistance('episode',{events:state.events},storage);assert.equal(readAssistance('episode',storage).events.length,1);
 assert(renderAssistance({},'Crew','handoff','<crew>').includes('&lt;crew&gt;'));assert(renderAssistance({responding:'no',breathing:'no'},'Crew').includes('vehicle-specific resuscitation checklist'));
});

test('each outcome explains the observed answers and keeps reassessment secondary',()=>{
 for(const [responding,breathing,kind] of [['no','no','resuscitation'],['yes','no','breathing'],['no','yes','unresponsive'],['yes','yes','responsive']]){
  const html=renderAssistance({responding,breathing},'Crew');assert(html.includes(`data-outcome="${kind}"`));assert(html.includes('assistance-observed'));assert(html.includes('class="assistance-recheck"'));assert(!html.includes('<details'));
 }
 const source=renderAssistance({},'Crew','sources','','response');assert(source.includes('data-assist-view="response"'));assert(!source.includes('data-assist-question'));assert(source.includes('mission-specific procedures'));
 const handoff=renderAssistance({},'Crew','handoff','<report>');assert(handoff.includes('&lt;report&gt;'));assert(handoff.includes('readonly'));assert(handoff.includes('data-copy-handoff'));
});
