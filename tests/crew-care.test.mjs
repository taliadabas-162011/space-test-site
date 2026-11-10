import {test} from 'node:test';
import assert from 'node:assert/strict';
import {careAssessment,readingStatus,sleepPattern,responseKey,readResponse,recordResponse,handoffText} from '../design/crew-care.js';
const now=Date.parse('2026-11-10T12:00:00Z'),time=new Date(now-1000).toISOString();
const entry=(value,extra={})=>({value,time,recordedAt:time,source:'Manual check-in',context:'rest',...extra});
const base={person:{id:'alex',name:'Crew & one'},symptoms:'none',pulse:entry(70),oxygen:entry(98),pressure:entry({systolic:118,diastolic:78})};
test('urgent reports and red-flag symptoms outrank every selected case and reassuring vitals',()=>{
 for(const key of ['routine','recovery','review','signal','wellbeing']) {
  assert.equal(careAssessment({...base,symptoms:'urgent'},{key}).key,'emergency');
  assert.equal(careAssessment({...base,symptoms:'concerning',symptomTags:['breathing-difficulty']},{key}).key,'emergency');
 }
 assert.equal(careAssessment({...base,symptoms:'concerning',symptomTags:['fatigue']},{key:'routine'}).key,'symptoms');
 assert.equal(careAssessment({...base,mood:{value:'low'}},{key:'routine'}).key,'wellbeing');
});
test('unavailable, future, earlier and zero observations remain distinct',()=>{
 assert.equal(readingStatus('pulse',entry(null),now).key,'missing');
 assert.equal(readingStatus('pulse',entry(true),now).key,'missing');
 assert.equal(readingStatus('pulse',entry(70,{quality:'unavailable'}),now).key,'missing');
 assert.equal(readingStatus('pulse',entry(70,{time:new Date(now+120000).toISOString()}),now).key,'missing');
 assert.equal(readingStatus('water',entry(0),now).key,'recorded');
 assert.equal(readingStatus('pulse',entry(70,{time:new Date(now-2*86400000).toISOString()}),now).key,'earlier');
});
test('sleep summaries count days, use prior median and exclude future observations',()=>{
 const history=Array.from({length:10},(_,i)=>entry(i<7?8:5,{time:new Date(now-(10-i)*86400000).toISOString()}));
 history.push({...history.at(-1),value:6},entry(24,{time:new Date(now+86400000).toISOString()}));
 const pattern=sleepPattern(history,now);assert.equal(pattern.nights,3);assert.equal(pattern.recent,5.3);assert.equal(pattern.usual,8);assert.equal(pattern.priorDays,7);
 assert.equal(sleepPattern(history.slice(0,3),now),null);
});
test('a repeated measurement is progress, not automatic clinical clearance',()=>{
 const scenario={key:'review',startedAt:new Date(now-120000).toISOString()};
 const repeats={...base,oxygen:entry(98,{source:'Manual repeat'}),pressure:entry({systolic:118,diastolic:78},{source:'Manual repeat'})};
 const state=careAssessment(repeats,scenario,{},now);assert.equal(state.key,'review');assert.equal(state.tone,'attention');assert.equal(state.repeats.length,2);assert.match(state.detail,/does not automatically clear/);
 assert.equal(careAssessment({...repeats,oxygen:entry(98,{source:'Manual repeat',time:new Date(now-86400000).toISOString()})},scenario,{},now).repeats.length,1);
});
test('acknowledging never claims crew contact; actions survive reload for the same episode',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 recordResponse('a','acknowledgedAt',storage,now);assert.equal(readResponse('a',storage).crewAlertedAt,undefined);
 assert.ok(readResponse('a',storage).acknowledgedAt);assert.deepEqual(readResponse('b',storage),{});assert.throws(()=>recordResponse('a','crewAlertedAt',storage,now+1000));
 assert.throws(()=>recordResponse('a','resolved',storage,now));
 const actual={...base,symptoms:'urgent',symptomTime:time,symptomSource:'Manual check-in'};
 assert.equal(responseKey(actual,{key:'routine'}),responseKey(actual,{key:'recovery'}));
});
test('malformed action storage is recoverable and old episodes are bounded',()=>{
 let value='null';const storage={getItem:()=>value,setItem:(key,v)=>{value=v}};
 assert.deepEqual(readResponse('a',storage),{});recordResponse('a','acknowledgedAt',storage,now);
 for(let i=0;i<30;i++)recordResponse(String(i),'acknowledgedAt',storage,now+i);
 assert.equal(Object.keys(JSON.parse(value)).length,20);
});
test('handoff keeps source, context, unavailable readings and communication state',()=>{
 const text=handoffText({...base,oxygen:entry(null,{quality:'unavailable'})},{key:'signal',title:'Lost measurement'},{acknowledgedAt:time},{},now);
 assert.match(text,/Oxygen: Unavailable/);assert.match(text,/Manual check-in/);assert.match(text,/Crew contact: not confirmed/);assert.match(text,/not sent/);assert.match(text,/not loaded/);
});
