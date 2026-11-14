import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {assistanceNarration,allVoiceTexts,voiceFile,createVoicePlayer} from '../design/crew-assistance-audio.js';
import {renderAssistance} from '../design/crew-assistance.js';
function playerHarness(){const audio=[],states=[];const player=createVoicePlayer({createAudio:src=>{const clip={src,pause(){this.paused=true},play(){this.paused=false;this.onplaying?.();return Promise.resolve()},removeAttribute(){},load(){}};audio.push(clip);return clip},onState:s=>states.push(s)});return {player,audio,states}}
test('every narration and confirmation has a bundled clip matching its text',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../design/voice/manifest.json',import.meta.url)));
 const texts=allVoiceTexts();assert.deepEqual(manifest.clips.map(c=>c.text),texts);assert.equal(new Set(texts.map(voiceFile)).size,texts.length);
 for(const clip of manifest.clips){assert.equal(clip.file,voiceFile(clip.text));assert(existsSync(new URL('../design/'+clip.file,import.meta.url)));}
 assert.equal(assistanceNarration({},'sources').segments.length,0);
 assert.match(assistanceNarration({responding:'yes'}).segments[0].text,/no more than 10 seconds/);
 for(const metric of ['pulse','glucose','temperature','pressure'])for(const suffix of ['','-low','-high','-unsure'])assert(assistanceNarration({},metric+suffix).segments.length);
 for(const view of ['steps','chest','fracture','pulse','glucose-low'])assert.equal((renderAssistance({},'Crew',view).match(/data-assist-voice /g)||[]).length,1);
});
test('pause, continue and replay preserve the current action; completion resolves once',async()=>{
 const h=playerHarness(),finished=h.player.play([{text:'first'},{text:'second'}],{key:'guide'});
 h.player.pause();assert.equal(h.player.state.mode,'paused');h.player.resume();assert.equal(h.player.state.mode,'playing');
 h.audio.at(-1).onended();assert.equal(h.player.state.index,1);h.player.replay();assert.equal(h.player.state.index,1);h.audio.at(-1).onended();assert.equal(await finished,true);assert.equal(h.player.state.mode,'complete');
});
test('changing context cancels queued audio and ignores stale completion',async()=>{
 const h=playerHarness(),old=h.player.play([{text:'old'},{text:'obsolete'}],{key:'old'}),stale=h.audio.at(-1).onended;
 const next=h.player.play([{text:'new'}],{key:'new'});assert.equal(await old,false);stale();assert.equal(h.player.state.key,'new');assert.equal(h.audio.length,2);
 h.player.stop();assert.equal(await next,false);assert.equal(h.player.state.mode,'idle');
});
test('playback errors stop the sequence instead of inventing a browser voice fallback',async()=>{
 const h=playerHarness(),result=h.player.play([{text:'first'},{text:'second'}]);h.audio.at(-1).onerror();assert.equal(await result,false);assert.equal(h.player.state.mode,'error');assert.equal(h.audio.length,1);
});
