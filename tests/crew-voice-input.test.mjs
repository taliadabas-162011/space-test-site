import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceInput} from '../design/crew-voice-input.js';

test('a spoken answer is not applied until explicitly confirmed',()=>{
 const recognizers=[],utterances=[],answers=[];
 class Recognition { constructor(){recognizers.push(this)} start(){this.onstart?.()} abort(){} result(text){this.onresult({results:[[{transcript:text}]]});this.onend()} }
 class Utterance {constructor(text){this.text=text}}
 globalThis.SpeechSynthesisUtterance=Utterance;
 globalThis.window={SpeechRecognition:Recognition,SpeechSynthesisUtterance:Utterance,speechSynthesis:{cancel(){},speak(u){utterances.push(u)}}};
 const input=createVoiceInput({getPrompt:()=>({question:'responding',text:'Are they responding?'}),onAnswer:a=>answers.push(a),onStatus:()=>{}});
 assert.equal(input.start(),true);utterances.at(-1).onend();
 recognizers.at(-1).result('no');assert.deepEqual(answers,[]);assert.match(utterances.at(-1).text,/I heard no/);
 utterances.at(-1).onend();recognizers.at(-1).result('confirm');assert.deepEqual(answers,['no']);
 input.stop();assert.equal(input.active,false);
});

test('unsupported browsers leave microphone input inactive',()=>{
 globalThis.window={speechSynthesis:{cancel(){}}};let status='';
 const input=createVoiceInput({getPrompt:()=>({}),onAnswer:()=>assert.fail(),onStatus:s=>status=s});
 assert.equal(input.start(),false);assert.equal(input.active,false);assert.match(status,/not supported/);
});
