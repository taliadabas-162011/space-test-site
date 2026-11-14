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
test('immunity has two illustrated guides, safely renders saved reports and never fabricates results',()=>{
 const summary={person:{name:'Crew'},immunityChecks:[{sample:'saliva',result:'<script>bad</script>',unit:'copies/mL',time:'2026-11-14T10:00:00Z'}]};
 const html=renderCollection({summary,symptomOptions:{},fields:[{name:'collectionView',value:'immunity'}],observedAt:'2026-11-14T11:00'});
 assert.match(html,/data-collection-view="immunity"/);assert.match(html,/data-immunity-guide="saliva"/);assert.match(html,/data-immunity-guide="urine"/);assert.match(html,/EBV DNA/);assert.match(html,/CMV DNA/);assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>bad/);assert.deepEqual(collectionPayload([]).details.immunityTests,{saliva:{result:'',unit:''},urine:{result:'',unit:''}});
});
test('each immunity guide step has its own action visual and identifies illustration provenance',async()=>{
 const {renderImmunity}=await import('../design/crew-immunity.js');const html=renderImmunity([]);
 const sources=[...html.matchAll(/<img src="([^"]+)"/g)].map(m=>m[1]);assert.equal(sources.length,8);assert.equal(new Set(sources).size,8);assert.match(html,/SARSTEDT collection illustration/);assert.match(html,/Collection overview based on NASA hardware/);assert.doesNotMatch(html,/<details class="collection-guide"/);
});
test('immunity has a fixed unit and switching to qualitative does not submit an old numeric draft',async()=>{
 const {immunityPayload,renderImmunity}=await import('../design/crew-immunity.js');
 assert.deepEqual(immunityPayload([{name:'salivaResultType',value:'not-detected'},{name:'salivaResult',value:'999'},{name:'salivaUnit',value:'IU/mL'}]).saliva,{result:'Not detected',unit:''});
 assert.deepEqual(immunityPayload([{name:'urineResultType',value:'numeric'},{name:'urineResult',value:'0'},{name:'urineUnit',value:'arbitrary'}]).urine,{result:'0',unit:'copies/mL'});
 const html=renderImmunity([]);assert.match(html,/select name="salivaResultType"/);assert.match(html,/select name="urineResultType"/);assert.doesNotMatch(html,/name="(?:saliva|urine)Unit"/);assert.match(html,/min="0" step="any"/);
 assert.equal(collectionHasEntry([{name:'salivaResultType',value:'inconclusive'}]),true);
});
