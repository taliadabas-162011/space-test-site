// Recognition is opt-in. Never interpret speech as an observation until confirmed.
import {confirmationText,confirmationLabels,recognitionPrompts} from './crew-assistance-audio.js?v=5';
export function parseVoiceAnswer(transcript,question){
 const words=String(transcript).toLowerCase().trim().replace(/[^a-z\s]/g,'').replace(/\s+/g,' ');
 const unsure=/^(unsure|not sure|i am not sure|i dont know)$/.test(words);
 if(question==='topic')return Object.entries({pulse:/^(heart rate|heart beat|heartbeat|pulse)$/,glucose:/^(blood glucose|glucose|blood sugar|sugar)$/,temperature:/^(temperature|body temperature|fever)$/,pressure:/^(blood pressure|pressure)$/,chest:/^(chest|chest pain|heart pain)$/,fracture:/^(fracture|broken bone|broken leg|leg injury)$/,other:/^other$/}).find(([,pattern])=>pattern.test(words))?.[0]||null;
 if(question==='direction')return /^(low|too low|lower)$/.test(words)?'low':/^(high|too high|higher)$/.test(words)?'high':unsure?'unsure':null;
 return /^(yes|yeah|yep)$/.test(words)?'yes':/^(no|nope)$/.test(words)||(question==='breathing'&&words==='gasping')?'no':unsure?'unsure':null;
}
export function createVoiceInput({getPrompt,onAnswer,onStatus,speak,stopSpeaking=()=>{},Recognition=globalThis.window?.SpeechRecognition||globalThis.window?.webkitSpeechRecognition}){
 let active=false,recognition=null,pending=null,phase='answer',context=null,generation=0,retries=0,listenTimer=null;
 const hint=()=>context?.question==='topic'?'Say the symptom or measurement.':context?.question==='direction'?'Say low, high, or unsure.':'Say yes, no, or unsure.';
 const valid=()=>active&&context?.key===getPrompt()?.key;
 const report=(message)=>onStatus(message,{active,phase,pending,label:confirmationLabels[pending]||pending});
 function abort(){clearTimeout(listenTimer);generation++;const previous=recognition;recognition=null;try{previous?.abort()}catch{}}
 function stop(message='Microphone off.',{keepAudio=false}={}){active=false;pending=null;phase='answer';abort();if(!keepAudio)stopSpeaking();report(message)}
 async function say(text,next){const token=generation;const played=await speak(text);if(!active||token!==generation)return;if(!played){stop('Audio unavailable. Use the answer buttons.');return}next()}
 function retry(){if(!valid()){stop();return}abort();pending=null;phase='answer';retries++;if(retries>=2){stop('No clear answer. Use the answer buttons, or try the microphone again.');return}report('Try again.');say(recognitionPrompts.retry,listen)}
 function confirm(){
  if(!valid()||!pending){stop();return}const answer=pending;abort();pending=null;phase='answer';retries=0;onAnswer(answer);
 }
 function listen(){
  if(!valid()){stop();return}const token=generation;let after=null,got=false;
  try{
   recognition=new Recognition();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
   recognition.onstart=()=>{if(active&&token===generation){clearTimeout(listenTimer);listenTimer=setTimeout(()=>{if(active&&token===generation)stop('Listening timed out. Use the answer buttons, or try again.')},12000);report(phase==='confirm'?`Heard “${confirmationLabels[pending]}”. Confirm or retry.`:`Listening… ${hint()}`)}};
   recognition.onresult=event=>{if(!active||token!==generation)return;if(!valid()){stop();return}if(got)return;got=true;clearTimeout(listenTimer);const words=String(event.results?.[0]?.[0]?.transcript||'').toLowerCase().trim().replace(/[^a-z\s]/g,'');
    if(/^(stop|cancel|stop listening)$/.test(words)){after=()=>stop();return}
    if(phase==='confirm'){
     if(/^(confirm|correct|yes)$/.test(words))after=confirm;
     else if(/^(retry|repeat|no|wrong)$/.test(words))after=retry;
     else after=()=>{retries++;if(retries>=2)stop('Answer not confirmed. Use the answer buttons.');else say(recognitionPrompts.confirm,listen)};
     return;
    }
    const answer=parseVoiceAnswer(words,context.question);
    if(!answer){after=retry;return}pending=answer;phase='confirm';report(`Heard “${confirmationLabels[answer]}”. Confirm or retry.`);after=()=>say(confirmationText(answer),listen);
   };
   recognition.onerror=event=>{if(!active||token!==generation)return;got=true;if(event.error==='no-speech'){after=retry;return}stop(event.error==='not-allowed'?'Microphone permission declined. Use the answer buttons.':'Voice service unavailable here. Try Google Chrome or use the answer buttons.')};
   recognition.onend=()=>{if(!active||token!==generation)return;clearTimeout(listenTimer);recognition=null;if(after)after();else if(!got)retry()};
   recognition.start();
  }catch{stop('Microphone unavailable. Use the answer buttons.')}
 }
 function next(){if(!active)return;abort();phase='answer';pending=null;context=getPrompt();retries=0;if(!context?.question){active=false;report('Microphone off. Listen to the next instructions.');return}listen()}
 function start(){if(!Recognition){report('This browser does not provide voice answers. Use Google Chrome or the answer buttons.');return false}active=true;next();return active}
 return {start,stop,next,confirm,retry,get active(){return active},get supported(){return Boolean(Recognition)}};
}

export function handleVoiceShortcut(event,{available,active,start,stop}){
 if(!available||event.defaultPrevented||event.repeat)return false;
 if(event.key==='Escape'&&active){event.preventDefault();stop();return true}
 if((event.code!=='Space'&&event.key!==' ')||event.target?.closest?.('input,textarea,select,button,a,[contenteditable=true],[role=combobox]'))return false;
 event.preventDefault();if(active)stop();else start();return true;
}
