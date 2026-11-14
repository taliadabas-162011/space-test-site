import {assistanceDecision,assistanceTopics,resuscitationSteps} from './crew-assistance.js?v=14';
import {vitalAidGuide} from './crew-vital-aid.js?v=4';

// Content-addressed clips prevent an edited medical instruction playing an older recording.
export function voiceFile(text){let hash=2166136261;for(const c of text)hash=Math.imul(hash^c.charCodeAt(0),16777619);return `voice/${(hash>>>0).toString(16)}.mp3`;}
export const confirmationLabels={yes:'yes',no:'no',unsure:'unsure',pulse:'heart rate',glucose:'blood glucose',temperature:'temperature',pressure:'blood pressure',chest:'chest pain',fracture:'broken bone',other:'other',low:'low',high:'high'};
export const confirmationText=answer=>`I heard ${confirmationLabels[answer]}. Say confirm, or say retry.`;
export const recognitionPrompts={retry:'Please try again, or use the answer buttons.',confirm:'Say confirm, or say retry.'};
export function assistanceNarration(state={},view='steps'){
 let texts=[],question='',key=view;
 const vital=vitalAidGuide(view),topic=assistanceTopics[view];
 if(vital){question=view.includes('-')?'':'direction';texts=question?[`${vital.title} Choose low, high, or unsure. Severe symptoms need urgent crew help.`]:vital.steps;}
 else if(topic)texts=topic.text.match(/[^.]+\./g).map(s=>s.trim());
 else if(view==='steps'){
  const decision=assistanceDecision(state);question=decision.question||(decision.kind==='responsive'?'topic':'');key=decision.kind||question;
  if(question==='responding')texts=['Call nearby crew. Ask a crewmate to contact the medical officer.','Call their name and gently tap their shoulder. Are they responding?'];
  else if(question==='breathing')texts=['Check for normal breathing for no more than 10 seconds. Gasping is not normal breathing. Are they breathing normally?'];
  else if(question==='topic')texts=['They are responding and breathing normally. Choose the symptom or measurement you need help with.'];
  else if(decision.kind==='resuscitation')texts=resuscitationSteps.map((text,index)=>index===0?'If they are unresponsive and not breathing normally, start CPR using your mission training. '+text:text);
  else texts=[decision.title+'. '+decision.instruction];
 }
 return {key:`${key}:${texts.join('|')}`,question,segments:texts.map(text=>({text,file:voiceFile(text)}))};
}
export function allVoiceTexts(){
 const plans=[assistanceNarration(),assistanceNarration({responding:'yes'}),...['yes','no'].flatMap(responding=>['yes','no'].map(breathing=>assistanceNarration({responding,breathing}))),...Object.keys(assistanceTopics).map(view=>assistanceNarration({},view)),...['pulse','glucose','pressure','temperature'].flatMap(key=>['','-low','-high','-unsure'].map(suffix=>assistanceNarration({},key+suffix)))];
 return [...new Set([...plans.flatMap(plan=>plan.segments.map(s=>s.text)),...Object.keys(confirmationLabels).map(confirmationText),...Object.values(recognitionPrompts)])];
}

export function createVoicePlayer({createAudio=src=>new Audio(src),onState=()=>{}}={}){
 let audio=null,segments=[],index=0,key='',purpose='guidance',mode='idle',generation=0,finish=null,playAttempt=0;
 const snapshot=()=>({mode,index,total:segments.length,text:segments[index]?.text||'',key,purpose});
 const emit=()=>onState(snapshot());
 function clear(){generation++;if(audio){audio.pause();audio.onended=audio.onerror=audio.onplaying=null;audio.removeAttribute?.('src');audio.load?.();audio=null}if(finish){const done=finish;finish=null;done(false)}}
 function stop(){clear();mode='idle';key='';segments=[];emit()}
 function fail(){clear();mode='error';emit()}
 function playCurrent(){
  const token=++generation;
  if(audio){audio.pause();audio.onended=audio.onerror=audio.onplaying=null}
  mode='loading';emit();
  try{
   audio=createAudio(new URL(segments[index].file||voiceFile(segments[index].text),import.meta.url).href);
   audio.onplaying=()=>{if(token===generation&&mode!=='paused'){mode='playing';emit()}};
   audio.onerror=()=>{if(token===generation)fail()};
   audio.onended=()=>{if(token!==generation)return;if(index+1<segments.length){index++;playCurrent()}else{mode='complete';emit();const done=finish;finish=null;done?.(true)}};
   const attempt=++playAttempt;Promise.resolve(audio.play()).catch(()=>{if(token===generation&&attempt===playAttempt)fail()});
  }catch{fail()}
 }
 function play(next,{key:nextKey='',purpose:nextPurpose='guidance'}={}){
  clear();segments=next;index=0;key=nextKey;purpose=nextPurpose;
  if(!segments.length){stop();return Promise.resolve(false)}
  return new Promise(resolve=>{finish=resolve;playCurrent()});
 }
 function pause(){if(['playing','loading'].includes(mode)){playAttempt++;audio?.pause();mode='paused';emit()}}
 function resume(){if(mode!=='paused')return;const token=generation,attempt=++playAttempt;mode='loading';emit();try{Promise.resolve(audio.play()).catch(()=>{if(token===generation&&attempt===playAttempt)fail()})}catch{fail()}}
 function replay(){if(!segments.length)return;playCurrent()}
 return {play,pause,resume,replay,stop,get state(){return snapshot()}};
}
