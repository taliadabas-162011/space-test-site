import assert from 'node:assert/strict';
import {renderMission,missionState} from '../design/crew-mission-ui.js';
const now=Date.now(),summary={person:{id:'alex',name:'<Crew & one>'},symptoms:'none'},histories={};
for(const [field,value] of Object.entries({pulse:70,oxygen:98,pressure:{systolic:118,diastolic:78},sleep:7.5,water:2.2,exercise:90,temperature:36.7,glucose:88,weight:70})) {
 histories[field]=Array.from({length:10},(_,i)=>({value,time:new Date(now-(10-i)*86400000).toISOString(),source:'Scenario history',context:'rest'}));summary[field]=histories[field].at(-1);
}
const routine=renderMission({summary,histories,scenario:{key:'routine'},now});
assert.equal(missionState(summary,{key:'routine'}).tone,'recorded');assert(routine.includes('&lt;Crew &amp; one&gt;'));for(const field of Object.keys(histories))assert(routine.includes(`data-metric="${field}"`));
assert(routine.includes('vs earlier 70 bpm'));assert(!routine.includes('Normal'));assert(!routine.includes('mission-trend'));
assert(routine.includes('Recovery'));assert(routine.includes('3-night avg'));assert(!routine.includes('data-care-repeat'));
const urgent=renderMission({summary:{...summary,symptoms:'urgent',symptomTags:['breathing-difficulty']},histories,scenario:{key:'routine'},response:{acknowledgedAt:new Date(now).toISOString()},now});
assert(urgent.includes('Alarm silenced · assistance still needed'));assert(urgent.includes('role="alert"'));assert(urgent.includes('Breathing difficulty'));assert(!urgent.includes('Mark crew alerted'));assert(urgent.includes('data-assist-view="sources"'));assert(!urgent.includes('data-metric="exercise"'));assert(!urgent.includes('Save check-in'));
const empty=renderMission({summary:{person:summary.person},histories:{},scenario:{key:'routine'},now});assert(empty.includes('unavailable'));assert(empty.includes('—'));assert(!empty.includes('NaN'));
const missing=renderMission({summary:{...summary,oxygen:{value:null,quality:'unavailable'}},histories,scenario:{key:'signal'},now});assert(missing.includes('Oxygen: unavailable'));assert(missing.includes('Last 98'));assert(missing.includes('unavailable'));
console.log('Liquid scenarios show evidence, next actions, unavailable readings, persistent alert state and honest handoff content.');
assert(urgent.includes('Review check-in'),'saved urgent reports always allow check-in review');
assert(!urgent.includes('data-exit-urgent-preview'),'saved urgent reports are not dismissed by exiting a preview');
const urgentPreview=renderMission({summary:{...summary,symptoms:'urgent',symptomSource:'Scenario preview'},histories,scenario:{key:'emergency'},now});
assert(urgentPreview.includes('data-exit-urgent-preview'),'the urgent preview has an explicit exit');assert(!urgentPreview.includes('Back to check-in'));

assert(urgent.includes('urgent-problem'));assert(urgent.includes('Get crew assistance now'));assert(urgent.includes('Guide crew assistance'));assert(urgent.includes('Nothing has been sent from this device'));assert(urgent.includes('data-metric="pressure"'));assert(urgent.includes('urgent-reading-time'));
const noTags=renderMission({summary:{...summary,symptoms:'urgent',symptomTags:[]},histories,scenario:{key:'routine'},now});assert(noTags.includes('Urgent help requested'));assert(!noTags.includes('Chest pain'));
const changing=renderMission({summary:{...summary,symptoms:'urgent',symptomTags:['chest-pain','breathing-difficulty'],symptomProgression:'worsening',symptomOnset:new Date(now-60000).toISOString()},histories,scenario:{key:'routine'},now});assert(changing.includes('Getting worse'));assert(changing.includes('Began '));assert(changing.indexOf('Reported symptoms')<changing.indexOf('Guide crew assistance'));

const fromCheckin=renderMission({summary:{...summary,symptoms:'urgent'},histories,scenario:{key:'routine'},urgentReturn:'checkin',now});assert(fromCheckin.includes('← Back to check-in'));
const fromRepeat=renderMission({summary:{...summary,symptoms:'urgent'},histories,scenario:{key:'routine'},urgentReturn:'repeat',now});assert(fromRepeat.includes('data-urgent-repeat-return'));assert(fromRepeat.includes('← Back to repeat'));
assert(!urgent.includes('data-urgent-signal="true"'),'a symptom alert must not invent an abnormal vital reading');

const signals=renderMission({summary:{...summary,symptoms:'urgent',symptomSource:'Scenario preview',pulse:{...summary.pulse,value:124,source:'Scenario preview'},oxygen:{...summary.oxygen,value:90,source:'Scenario preview'}},histories,scenario:{key:'emergency',values:{pulse:124,oxygen:90}},now});assert.equal((signals.match(/data-urgent-signal="true"/g)||[]).length,2);assert(signals.includes('data-metric="pressure" data-open-metric="pressure" data-urgent-signal="false"'));
