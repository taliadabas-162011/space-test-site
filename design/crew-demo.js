/* Synthetic presentation history; never rewrites a saved observation. */
(() => {
  const HISTORY_DAYS=365;
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
      // Four authored recovery periods per year, followed by a catch-up night.
      const phase=day%91,recovery=phase>=19&&phase<=22,shortSleep=phase>=19&&phase<=21;
      const pulse=Math.round(74+5*Math.sin(day/11)+3*Math.sin(day/4.3)+(shortSleep?[6,9,5][phase-19]:0));
      const oxygen=Math.max(96,Math.min(100,Math.round(98+1.2*Math.sin(day/8)+.65*Math.sin(day/3.2))));
      const sleep=recovery?[6.1,6.4,6.8,8.5][phase-19]:Math.round((7.8+.45*Math.sin(day/9)+.25*Math.sin(day/2.7))*10)/10;
      const water=Math.round((2.4+.3*Math.sin(day/8)+.15*Math.sin(day/3)-(shortSleep?.45:0))*10)/10;
      const exercise=Math.round((recovery?80:day%7===6?100:122)+10*Math.sin(day/7.3)+5*Math.sin(day/2.4));
      append('pulse',pulse,time,'Scenario history','rest');
      append('oxygen',oxygen,time,'Scenario history','rest');
      append('sleep',sleep,time,'Scenario history');
      append('water',water,time,'Scenario history');
      append('exercise',exercise,time,'Scenario history');
      append('mood',phase===20?'low':shortSleep||day%9===0?'neutral':'good',time,'Scenario history');
      append('sleepQuality',recovery?(phase<=20?'poor':phase===21?'mixed':'restful'):day%11===3?'mixed':'restful',time,'Scenario history');
      const symptom=append('symptoms',shortSleep?'concerning':'none',time,'Scenario history');
      if(shortSleep){const onset=new Date(when);onset.setDate(onset.getDate()-(phase-19));symptom.tags=[phase===20?'headache':'fatigue'];symptom.progression=phase===21?'improving':'unchanged';symptom.onset=onset.toISOString();}
      if(day%3===0){
        append('pressure',{systolic:Math.min(119,Math.round(112+4*Math.sin(day/19)+3*Math.sin(day/5.2)+(shortSleep?2:0))),diastolic:Math.min(79,Math.round(72+4*Math.sin(day/17)+2*Math.sin(day/4.7)+(shortSleep?1:0)))},time,'Scenario history','rest');
        append('temperature',Math.round((36.7+.25*Math.sin(day/13)+.15*Math.sin(day/3.7))*10)/10,time,'Scenario history','rest');
      }
      if(day%7===0){
        append('glucose',Math.round(87+6*Math.sin(day/13)+3*Math.sin(day/4)+(shortSleep?1:0)),time,'Scenario history','fasting');
        append('weight',Math.round((70+.65*Math.sin(day/46)+.35*Math.sin(day/101))*10)/10,time,'Scenario history');
      }
      if(day%14===0){
        records.immunityChecks||=[];
        for(const sample of ['saliva','urine']){
          const count=Math.round((sample==='saliva'?120:40)+(sample==='saliva'?55:18)*Math.sin(day/37));
          const qualitative=Math.floor(day/14)%4===0;
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
    for (const [field, rows] of Object.entries(sample)) {
      const personal = (Array.isArray(next.alex[field]) ? next.alex[field] : []).filter(row => row?.source !== 'Scenario history');
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
