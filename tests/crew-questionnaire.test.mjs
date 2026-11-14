import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moodQuestions,questionnaireItems,questionnaireStep,renderQuestionnaire,sleepEfficiency} from '../design/crew-questionnaire.js';
import {collectionPayload,collectionHasEntry,renderCollection} from '../design/crew-collection.js';
test('mood keeps all ten original prompts, options and stored answer values',()=>{
 assert.equal(moodQuestions.length,10);assert.equal(moodQuestions[0][0],'How would you describe your overall mood today?');assert.deepEqual(moodQuestions[0][1],['Very positive','Positive','Neutral','Low','Very low']);assert.deepEqual(moodQuestions[9][1],['No','Maybe','Yes']);
 const items=questionnaireItems('mood');assert.equal(items[9].name,'moodQ10');assert.equal(items[9].options[2][0],'2');
 const html=renderQuestionnaire('mood',[{name:'moodStep',value:'10'}],'mood');assert.match(html,/data-questionnaire-summary hidden/);assert.doesNotMatch(html,/data-questionnaire-review/);assert.match(html,/data-questionnaire-skip/);assert.equal((html.match(/data-questionnaire-item="\d+">/g)||[]).length,1);assert.match(html,/data-questionnaire-item="1" hidden/);
 const payload=collectionPayload([{name:'moodQ1',value:'4'},{name:'moodQ10',value:'2'},{name:'moodNote',value:'Note'}]);assert.equal(payload.details.mood,'low');assert.deepEqual(payload.details.moodQuestionnaire,{answers:{q1:'4',q10:'2'},note:'Note'});
});
test('old two-question drafts migrate to their first question, with answers retained',()=>{
 assert.equal(questionnaireStep('mood',[{name:'moodPage',value:'3'}]),6);assert.equal(questionnaireStep('mood',[{name:'moodStep',value:'10'}]),0);assert.equal(questionnaireStep('sleepQuality',[{name:'sleepQualityStep',value:'90'}]),0);
 const html=renderQuestionnaire('mood',[{name:'moodQ4',value:'2'},{name:'moodStep',value:'3'}],'mood');assert.match(html,/name="moodQ4" value="2" checked/);assert.match(html,/data-questionnaire-item="3">/);
});
test('sleep efficiency preserves zero sleep and rejects blank, impossible or invalid estimates',()=>{
 assert.equal(sleepEfficiency('8','7'),87.5);assert.equal(sleepEfficiency('8','0'),0);for(const pair of [['','7'],['8',''],['0','0'],['7','8'],['25','8'],['8','NaN'],['8','-1']])assert.equal(sleepEfficiency(...pair),null);
 const payload=collectionPayload([{name:'sleepTimeInBed',value:'8'},{name:'sleepTimeAsleep',value:'7'},{name:'sleepQuality',value:'mixed'}]);assert.equal(payload.values.sleep,'7');assert.equal(payload.details.sleepQuality,'mixed');assert.equal(payload.details.sleepTimeInBed,'8');
 assert.equal(collectionHasEntry([{name:'moodStep',value:'2'},{name:'sleepQualityStep',value:'4'}]),false);
});