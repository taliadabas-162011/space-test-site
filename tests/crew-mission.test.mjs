import assert from 'node:assert/strict';
import {renderMission,missionState} from '../design/crew-mission-ui.js';
const now=Date.now(),summary={person:{id:'alex',name:'<Crew & one>'},symptoms:'none'},histories={};
for(const [field,value] of Object.entries({pulse:70,oxygen:98,pressure:{systolic:118,diastolic:78},sleep:7.5,water:2.2,exercise:90,temperature:36.7,glucose:88,weight:70})) {
 histories[field]=Array.from({length:10},(_,i)=>({value,time:new Date(now-(10-i)*86400000).toISOString(),source:'Scenario history',context:'rest'}));summary[field]=histories[field].at(-1);
}
const routine=renderMission({summary,histories,scenario:{key:'routine'},now});
assert.equal(missionState(summary,{key:'routine'}).tone,'recorded');assert(routine.includes('&lt;Crew &amp; one&gt;'));for(const field of Object.keys(histories))assert(routine.includes(`data-metric="${field}"`));
assert(routine.includes('vs earlier 70 bpm'));assert(!routine.includes('Normal'));assert(!routine.includes('mission-trend'));
const recovery=renderMission({summary,histories,scenario:{key:'recovery'},now});assert(recovery.includes('Make room for sleep'));assert(recovery.includes('3 nights'));assert(!recovery.includes('data-metric="glucose"'));assert(recovery.includes('Discuss persistent fatigue'));
const review=renderMission({summary,histories,scenario:{key:'review'},now});assert(review.includes('data-care-repeat'));assert(!review.includes('RECHECK PLAN'));
const urgent=renderMission({summary:{...summary,symptoms:'urgent',symptomTags:['breathing-difficulty']},histories,scenario:{key:'recovery'},response:{acknowledgedAt:new Date(now).toISOString()},now});
assert(urgent.includes('Alarm silenced · assistance still needed'));assert(urgent.includes('role="alert"'));assert(urgent.includes('Breathing difficulty'));assert(!urgent.includes('Mark crew alerted'));assert(urgent.includes('procedures are not loaded'));assert(!urgent.includes('data-metric="exercise"'));assert(!urgent.includes('Save check-in'));
const empty=renderMission({summary:{person:summary.person},histories:{},scenario:{key:'routine'},now});assert(empty.includes('unavailable'));assert(empty.includes('—'));assert(!empty.includes('NaN'));
const missing=renderMission({summary:{...summary,oxygen:{value:null,quality:'unavailable'}},histories,scenario:{key:'signal'},now});assert(missing.includes('Oxygen: unavailable'));assert(missing.includes('Last 98'));assert(missing.includes('unavailable'));
console.log('Liquid scenarios show evidence, next actions, unavailable readings, persistent alert state and honest handoff content.');
assert(urgent.includes('← Back to check-in'),'an actual urgent report always allows check-in navigation');
assert(!urgent.includes('data-exit-urgent-preview'),'saved urgent reports are not dismissed by exiting a preview');
const urgentPreview=renderMission({summary:{...summary,symptoms:'urgent',symptomSource:'Scenario preview'},histories,scenario:{key:'emergency'},now});
assert(urgentPreview.includes('data-exit-urgent-preview'),'the urgent preview has an explicit exit');
