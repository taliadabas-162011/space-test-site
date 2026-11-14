import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceInput,parseVoiceAnswer} from '../design/crew-voice-input.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(question='responding'){
 const recognizers=[],answers=[],spoken=[],status=[];let prompt={key:question,question};
 class Recognition{constructor(){recognizers.push(this)}start(){this.onstart?.()}abort(){this.aborted=true}result(text){this.onresult({results:[[{transcript:text}]]});this.onend()}error(error){this.onerror({error});this.onend()}}
 const input=createVoiceInput({Recognition,getPrompt:()=>prompt,onAnswer:answer=>answers.push(answer),onStatus:(text,state)=>status.push({text,...state}),speak:async text=>{spoken.push(text);return true}});
 return {input,recognizers,answers,spoken,status,setPrompt:value=>prompt=value};
}
test('voice starts listening directly and never commits before confirmation',async()=>{
 const h=harness();assert(h.input.start());assert.equal(h.spoken.length,0);
 h.recognizers.at(-1).result('no');assert.deepEqual(h.answers,[]);assert.match(h.spoken.at(-1),/I heard no/);
 await tick();h.recognizers.at(-1).result('confirm');assert.deepEqual(h.answers,['no']);h.input.stop();
});
test('situation and reading direction are separately confirmed',async()=>{
 for(const [question,words,answer] of [['topic','broken leg','fracture'],['topic','blood glucose','glucose'],['direction','low','low']]){
  const h=harness(question);h.input.start();h.recognizers.at(-1).result(words);assert.deepEqual(h.answers,[]);await tick();h.recognizers.at(-1).result('confirm');assert.deepEqual(h.answers,[answer]);h.input.stop();
 }
});
test('retry clears the pending observation and limits repeated failures',async()=>{
 const h=harness();h.input.start();h.recognizers.at(-1).result('yes');await tick();h.input.retry();await tick();
 assert.equal(h.status.at(-1).pending,null);h.recognizers.at(-1).result('something else');await tick();assert.equal(h.input.active,false);assert.deepEqual(h.answers,[]);
});
test('a result from another question or a stopped recognition cannot apply',async()=>{
 const h=harness();h.input.start();const stale=h.recognizers.at(-1);stale.result('yes');await tick();h.setPrompt({question:'breathing',key:'breathing'});h.input.confirm();assert.deepEqual(h.answers,[]);
 h.input.start();const current=h.recognizers.at(-1);stale.result('confirm');assert.equal(h.input.active,true);current.result('no');await tick();h.input.stop();current.result('confirm');assert.deepEqual(h.answers,[]);
});
test('permission rejection, unavailable audio, unsupported recognition and cancel keep manual answers available',async()=>{
 const h=harness();h.input.start();h.recognizers.at(-1).error('not-allowed');assert.equal(h.input.active,false);assert.match(h.status.at(-1).text,/permission declined/);
 h.input.start();h.recognizers.at(-1).result('cancel');assert.equal(h.input.active,false);
 const unsupported=createVoiceInput({Recognition:null,getPrompt:()=>({}),onAnswer:()=>assert.fail(),onStatus:()=>{},speak:async()=>true});assert.equal(unsupported.start(),false);assert.equal(unsupported.supported,false);
 const r=[];class Recognition{constructor(){r.push(this)}start(){}abort(){}}
 const failed=createVoiceInput({Recognition,getPrompt:()=>({key:'a',question:'responding'}),onAnswer:()=>assert.fail(),onStatus:()=>{},speak:async()=>false});failed.start();r[0].onresult({results:[[{transcript:'yes'}]]});r[0].onend();await tick();assert.equal(failed.active,false);
});
test('gasping belongs to breathing, not responsiveness; ambiguous sentences are rejected',()=>{
 assert.equal(parseVoiceAnswer('gasping','breathing'),'no');assert.equal(parseVoiceAnswer('gasping','responding'),null);assert.equal(parseVoiceAnswer('yes no','responding'),null);assert.equal(parseVoiceAnswer('not sure','breathing'),'unsure');
});
test('button confirmation and a concurrent recognition callback cannot double-save',async()=>{
 const h=harness();h.input.start();h.recognizers.at(-1).result('no');await tick();const pending=h.recognizers.at(-1);h.input.confirm();pending.result('confirm');h.input.confirm();assert.deepEqual(h.answers,['no']);h.input.stop();
});

test('Space starts or stops answers, Escape stops, and text/button input keeps its native keys',async()=>{
 const {handleVoiceShortcut}=await import('../design/crew-voice-input.js');let started=0,stopped=0,prevented=0;
 const base={available:true,active:false,start:()=>started++,stop:()=>stopped++};
 const event=(key,interactive=false)=>({key,code:key===' '?'Space':key,target:{closest:()=>interactive},preventDefault(){prevented++}});
 assert(handleVoiceShortcut(event(' '),base));assert.equal(started,1);
 assert(handleVoiceShortcut(event(' '),{...base,active:true}));assert(handleVoiceShortcut(event('Escape'),{...base,active:true}));assert.equal(stopped,2);
 assert.equal(handleVoiceShortcut(event(' ',true),base),false);assert.equal(handleVoiceShortcut({...event(' '),repeat:true},base),false);assert.equal(handleVoiceShortcut(event(' '),{...base,available:false}),false);assert.equal(prevented,3);
});

test('pausing speech can stop recognition without discarding the current recording',()=>{
 let stoppedAudio=0;const h=harness();h.input.start();h.input.stop('Paused.',{keepAudio:true});assert.equal(h.input.active,false);
 const input=createVoiceInput({Recognition:class{start(){}abort(){}},getPrompt:()=>({key:'a',question:'responding'}),onAnswer:()=>{},onStatus:()=>{},speak:async()=>true,stopSpeaking:()=>stoppedAudio++});
 input.start();input.stop('Paused.',{keepAudio:true});assert.equal(stoppedAudio,0);input.stop();assert.equal(stoppedAudio,1);
});
