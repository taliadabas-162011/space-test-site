// Microphone access begins only after the crew selects the microphone control.
export function createVoiceInput({getPrompt,onAnswer,onStatus}) {
 let active=false, recognition=null, pending=null, phase='answer', question='', generation=0;
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const options=()=>question==='topic'?'Say heart rate, blood glucose, temperature, blood pressure, chest pain, broken bone, or other.':question==='direction'?'Say low, high, or unsure.':'Say yes, no, or unsure.';
 function stop(){active=false;generation++;try{recognition?.abort()}catch{}recognition=null;window.speechSynthesis?.cancel();onStatus('Microphone off.');}
 function say(text, next){
  const token=generation;
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){active=false;generation++;onStatus('Voice playback unavailable. Use the answer buttons.');return;}
  window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=1;u.onend=()=>{if(active&&token===generation)next()};u.onerror=()=>{if(active&&token===generation){active=false;generation++;onStatus('Voice playback failed. Use the answer buttons.')}};window.speechSynthesis.speak(u);
 }
 function listen(){
  if(!active)return;const token=generation;let got=false,after=null;
  try{recognition=new Recognition();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
   recognition.onstart=()=>{if(active&&token===generation)onStatus(phase==='confirm'?'Listening: say confirm or retry.':`Listening. ${options()}`)};
   recognition.onresult=event=>{if(!active||token!==generation)return;got=true;const words=event.results[0][0].transcript.toLowerCase().trim().replace(/[^a-z\s]/g,'');
    if(phase==='confirm'){
     if(/^(confirm|correct|yes)$/.test(words)){const answer=pending;pending=null;phase='answer';after=()=>onAnswer(answer);return;}
     if(/^(retry|repeat|no|wrong)$/.test(words)){pending=null;phase='answer';after=()=>say(options(),listen);return;}
     after=()=>say('Please say confirm or retry.',listen);return;
    }
    const unsure=/^(unsure|not sure|i am not sure|i dont know)$/.test(words);
    const answer=question==='topic'?(/^(heart rate|heart beat|heartbeat|pulse)$/.test(words)?'pulse':/^(blood glucose|glucose|blood sugar|sugar)$/.test(words)?'glucose':/^(temperature|body temperature|fever)$/.test(words)?'temperature':/^(blood pressure|pressure)$/.test(words)?'pressure':/^(chest|chest pain|heart pain)$/.test(words)?'chest':/^(fracture|broken bone|broken leg|leg injury)$/.test(words)?'fracture':/^other$/.test(words)?'other':null):question==='direction'?(/^(low|too low|lower)$/.test(words)?'low':/^(high|too high|higher)$/.test(words)?'high':unsure?'unsure':null):(/^(yes|yeah|yep)$/.test(words)?'yes':/^(no|nope|gasping)$/.test(words)?'no':unsure?'unsure':null);
    if(!answer){after=()=>say(`I did not understand. ${options()}`,listen);return;}
    pending=answer;phase='confirm';const label=({chest:'chest pain',fracture:'broken bone',pulse:'heart rate',glucose:'blood glucose',pressure:'blood pressure'})[answer]||answer;after=()=>say(`I heard ${label}. Say confirm or retry.`,listen);
   };
   recognition.onerror=event=>{if(!active||token!==generation)return;if(event.error==='no-speech'){got=true;after=()=>say(phase==='confirm'?'Please say confirm or retry.':`I did not hear an answer. ${options()}`,listen);return;}active=false;generation++;onStatus('Microphone unavailable or recognition failed. Use the answer buttons.');};
   recognition.onend=()=>{if(!active||token!==generation)return;if(after)after();else if(!got){active=false;onStatus('Microphone stopped. Select Start microphone to try again.');}};
   recognition.start();
  }catch{active=false;generation++;onStatus('Microphone unavailable. Use the answer buttons.');}
 }
 function next(){if(!active)return;phase='answer';pending=null;const prompt=getPrompt();question=prompt?.question||'';onStatus('Speaking the current step.');if(!question){say(prompt?.text||'Follow your mission medical procedure.',()=>{active=false;onStatus('Microphone off. Follow the on-screen guidance.');});return;}say(`${prompt.text} ${options()}`,listen);}
 function start(){if(!Recognition){onStatus('Speech recognition is not supported here. Use the answer buttons.');return false;}active=true;generation++;onStatus('Speaking the current step. The microphone will listen when it finishes.');next();return true;}
 return {start,stop,next,get active(){return active}};
}
