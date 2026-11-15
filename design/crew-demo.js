/* Synthetic presentation history; never rewrites a saved observation. */
(() => {
  const HISTORY_DAYS=365;
  // Stable, date-keyed anchors; interpolation gives irregular drift without rerolling history.
  const key = (day, salt) => {
    let n=Math.imul(day^salt,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);
    return ((n^(n>>>16))>>>0)/4294967295;
  };
  function drift(day, span, salt) {
    const anchor=Math.floor(day/span),t=day/span-anchor,blend=t*t*(3-2*t);
    return 2*((1-blend)*key(anchor,salt)+blend*key(anchor+1,salt))-1;
  }
  const round1=value=>Math.round(value*10)/10;
  const calendarDay=time=>{const d=new Date(time);return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)};
  // Recognize the old, paired 120-day fixture, never individual simulated-device readings.
  function legacyPresentationTimes(records) {
    const source=field=>field==='oxygen'||field==='pulse'?'Simulated sensor':'Simulated check-in';
    const byDay=Object.fromEntries(['oxygen','sleep','water','exercise'].map(field=>[field,new Map((Array.isArray(records[field])?records[field]:[]).filter(r=>r?.source===source(field)&&r.recordedAt===r.time&&r.deviceSequence==null&&!r.deviceId&&Number.isFinite(Date.parse(r.time))).map(r=>[calendarDay(r.time),r]))]));
    for(const end of [...byDay.oxygen.keys()].sort((a,b)=>b-a)){
      const times=[];
      for(let ago=0;ago<120;ago++){
        const d=end-ago,o=byDay.oxygen.get(d),sleep=byDay.sleep.get(d),water=byDay.water.get(d),exercise=byDay.exercise.get(d);
        if(!o||!sleep||!water||!exercise||![sleep,water,exercise].every(r=>r.time===o.time))continue;
        if(o.value===97+(ago%5===0?1:0)&&sleep.value===round1(7.4+Math.sin(ago/6)*.6)&&water.value===round1(2.2+Math.sin(ago/7)*.25)&&exercise.value===85+(ago%7)*5)times.push(o.time);
      }
      if(times.length>=100)return new Set(times);
    }
    return new Set();
  }
  function makeRecords(now = new Date()) {
    const records = {};
    const append = (field, value, time, source, context = '') => {
      records[field] ||= [];
      const entry = { value, time, recordedAt: time, source };
      if (context) entry.context = context;
      records[field].push(entry);
      return entry;
    };
    for (let daysAgo = HISTORY_DAYS-1; daysAgo >= 0; daysAgo--) {
      const when = new Date(now);
      when.setDate(when.getDate() - daysAgo);
      when.setHours(0,0,0,0);
      const time = when.toISOString();
      // Calendar-anchored values and sampling stay unchanged when the window rolls.
      const day=Math.floor(Date.UTC(when.getFullYear(),when.getMonth(),when.getDate())/86400000);
      const block=Math.floor(day/91),phase=day-block*91,start=12+Math.floor(key(block,71)*43),length=2+Math.floor(key(block,72)*3);
      const episodeDay=phase-start,shortSleep=episodeDay>=0&&episodeDay<length,recovery=shortSleep||episodeDay===length;
      const pulse=Math.round(74+6*drift(day,13,11)+3*drift(day,3,12)+(shortSleep?4+3*key(day,13):0));
      const oxygen=Math.max(96,Math.min(100,Math.round(98.2+1.6*drift(day,9,21)+.5*drift(day,3,22))));
      const sleep=shortSleep?round1(6.1+.65*key(day,31)):episodeDay===length?round1(8.2+.4*key(day,32)):round1(7.8+.55*drift(day,6,33)+.2*drift(day,2,34));
      const water=round1(2.4+.35*drift(day,5,41)+.15*drift(day,2,42)-(shortSleep?.35:0));
      const exercise=Math.round((recovery?82:122)+10*drift(day,4,51)+6*drift(day,1,52)-(!recovery&&key(day,53)<.15?15:0));
      append('pulse',pulse,time,'Scenario history','rest');
      append('oxygen',oxygen,time,'Scenario history','rest');
      append('sleep',sleep,time,'Scenario history');
      append('water',water,time,'Scenario history');
      append('exercise',exercise,time,'Scenario history');
      append('mood',shortSleep?(episodeDay===1?'low':'neutral'):drift(day,4,61)<-.45?'neutral':'good',time,'Scenario history');
      append('sleepQuality',shortSleep?(episodeDay===length-1?'mixed':'poor'):sleep<7.5||drift(day,3,62)<-.55?'mixed':'restful',time,'Scenario history');
      const symptom=append('symptoms',shortSleep?'concerning':'none',time,'Scenario history');
      if(shortSleep){const onset=new Date(when);onset.setDate(onset.getDate()-episodeDay);symptom.tags=[episodeDay===1&&key(block,73)>.4?'headache':'fatigue'];symptom.progression=episodeDay===length-1?'improving':'unchanged';symptom.onset=onset.toISOString();}
      if(day%3===0){
        append('pressure',{systolic:Math.min(119,Math.round(112+5*drift(day,14,81)+3*drift(day,3,82)+(shortSleep?2:0))),diastolic:Math.min(79,Math.round(72+4*drift(day,14,81)+2*drift(day,4,83)+(shortSleep?1:0)))},time,'Scenario history','rest');
        append('temperature',round1(36.7+.3*drift(day,8,91)+.15*drift(day,2,92)),time,'Scenario history','rest');
      }
      if(day%7===0){
        append('glucose',Math.round(87+7*drift(day,19,101)+4*drift(day,3,102)+(shortSleep?1:0)),time,'Scenario history','fasting');
        append('weight',round1(70+.9*drift(day,47,111)+.2*drift(day,7,112)),time,'Scenario history');
      }
      if(day%14===0){
        records.immunityChecks||=[];
        for(const sample of ['saliva','urine']){
          const count=Math.round((sample==='saliva'?120:40)+(sample==='saliva'?55:18)*drift(day,23,sample==='saliva'?121:122));
          const qualitative=Math.floor(day/14)%2===0 && key(day,sample==='saliva'?123:124)<.5;
          records.immunityChecks.push({sample,test:sample==='saliva'?'EBV DNA':'CMV DNA',result:qualitative?'Not detected':String(count),unit:qualitative?'':'copies/mL',time,recordedAt:time,source:'Scenario history'});
        }
      }
    }
    return { alex: records };
  }
  function refreshRecords(stored, now = new Date()) {
    const next = structuredClone(stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {});
    const sample = makeRecords(now).alex;
    next.alex ||= {};
    if (typeof next.alex !== 'object' || Array.isArray(next.alex)) next.alex = {};
    const legacyTimes=legacyPresentationTimes(next.alex);
    for (const [field, rows] of Object.entries(sample)) {
      const storedRows=Array.isArray(next.alex[field])?next.alex[field]:[];
      const legacy=storedRows.filter(row=>legacyTimes.has(row?.time)&&['Simulated sensor','Simulated check-in'].includes(row.source)&&row.recordedAt===row.time&&row.deviceSequence==null&&!row.deviceId);
      if(legacy.length){next.alex.presentationArchive||={};next.alex.presentationArchive[field]=[...(next.alex.presentationArchive[field]||[]),...legacy];}
      const personal=storedRows.filter(row=>row?.source!=='Scenario history'&&!legacy.includes(row));
      let authored=rows;
      if(field==='symptoms'){
        const reported=personal.filter(row=>!['Manual help request','Unsaved help request'].includes(row?.source)&&['none','concerning','urgent'].includes(row?.value)&&Number.isFinite(Date.parse(row.time)));
        const first=Math.min(...reported.map(row=>Date.parse(row.time)));
        authored=rows.filter(row=>Date.parse(row.time)<first);
      }else if(field==='immunityChecks'){
        // A fabricated later result must never supersede a saved laboratory report.
        authored=rows.filter(row=>!personal.some(saved=>saved?.sample===row.sample&&Number.isFinite(Date.parse(saved.time))&&Date.parse(saved.time)<=Date.parse(row.time)));
      }
      next.alex[field] = [...authored, ...personal].sort((a,b) => Date.parse(a?.time) - Date.parse(b?.time));
    }
    return next;
  }
  window.CrewDemo = { makeRecords, refreshRecords };
})();
