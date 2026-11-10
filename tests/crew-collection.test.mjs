import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderCollection,collectionHasEntry,collectionPayload} from '../design/crew-collection.js';
const summary={person:{name:'<Crew>'},pulse:{value:70},oxygen:{value:98},pressure:{value:{systolic:118,diastolic:78}}};
const options={summary,symptomOptions:{fatigue:'Fatigue'},observedAt:'2026-11-10T10:00'};
test('daily collection uses the scene, makes every measurement directly reachable and has unique field IDs',()=>{
 const html=renderCollection(options);assert(html.includes('Daily check-in'));const nav=html.match(/<nav class="collection-navigation"[\s\S]*?<\/nav>/)[0];assert(nav.includes('<h2 class="collection-nav-title">Measurements</h2>'));assert(!nav.includes('>Today<'));assert(!nav.includes('data-collection-view'));assert(html.includes('Daily log'));assert(html.includes('&lt;Crew&gt;'));assert(!html.includes('role="dialog"'));assert(!html.includes('collection-measurements'));assert(!html.includes('Add a spot measurement'));for(const metric of ['oxygen','pressure','pulse','temperature','glucose','weight'])assert(html.includes(`data-collection-measure="${metric}"`));
 for(const name of ['pulse','oxygen','systolic','diastolic','sleep','water','exercise','context'])assert.equal((html.match(new RegExp(`name="${name}"`,'g'))||[]).length,1,name);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(ids.length,new Set(ids).size);
});
test('a repeat contains only the requested vital measurements and matching-condition context',()=>{
 const html=renderCollection({...options,purpose:'repeat'});assert(!html.includes('name="sleep"'));assert(!html.includes('name="glucose"'));assert(!html.includes('collection-extra'));assert(html.includes('name="context" required'));assert(html.includes('Show me how'));
 for(const name of ['pulse','oxygen','systolic','diastolic'])assert.equal((html.match(new RegExp(`name="${name}"`,'g'))||[]).length,1,name);
});
test('collection preserves zero, symptom choices, context, date and partial entries',()=>{
 const fields=Object.entries({water:'0',sleep:'7.5',symptoms:'concerning',mood:'neutral',measuredAt:'2026-11-10T10:00',context:'rest'}).map(([name,value])=>({name,value}));fields.push({name:'symptomTags',value:'fatigue',checked:true});
 const result=collectionPayload(fields);assert.equal(result.values.water,'0');assert.equal(result.values.pulse,'');assert.equal(result.symptoms,'concerning');assert.deepEqual(result.details.symptomTags,['fatigue']);assert.equal(result.details.context,'rest');assert.equal(result.details.measuredAt,'2026-11-10T10:00');
});

test('a well report excludes earlier symptom details without inventing readings',()=>{
 const result=collectionPayload([{name:'symptoms',value:'none'},{name:'symptomTags',value:'chest-pain'},{name:'symptomNote',value:'old note'}]);
 assert.deepEqual(result.details.symptomTags,[]);assert.equal(result.details.symptomNote,'');assert.equal(result.values.oxygen,'');
});

test('opening a selector or changing the date does not claim that health data is pending',()=>{
 assert.equal(collectionHasEntry([{name:'collectionView',value:'measurements'},{name:'measurementField',value:'pressure'},{name:'measuredAt',value:'2026-11-10T10:00'},{name:'symptomRegion',value:'General'}]),false);
 assert.equal(collectionHasEntry([{name:'water',value:'0'}]),true);assert.equal(collectionHasEntry([{name:'symptoms',value:'none',checked:true}]),true);
});

test('a saved urgent symptom report remains explicit when resuming a draft',async()=>{
 const {urgentCollectionFields}=await import('../design/crew-collection.js');
 const fields=[{name:'water',value:'0'},{name:'symptoms',value:'none',checked:true},{name:'measurementField',value:'pressure'},{name:'symptomNote',value:'Keep this draft'}];
 const result=urgentCollectionFields(fields,{symptomTags:['chest-pain']});
 assert.equal(collectionPayload(result).symptoms,'urgent');assert.equal(collectionPayload(result).values.water,'0');assert.equal(collectionPayload(result).details.symptomNote,'Keep this draft');assert.deepEqual(collectionPayload(result).details.symptomTags,['chest-pain']);assert.equal(fields[1].value,'none');
 const html=renderCollection({...options,fields:result,urgent:true});assert(html.includes('data-urgent-response'));assert(html.includes('Urgent report active'));assert(html.includes('value="urgent" checked'));
});
