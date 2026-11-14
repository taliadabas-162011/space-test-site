// General adult educational examples; individual mission protocols take precedence.
export function assessReadings(values, details={}) {
 const out=[]; const add=(field,level,text)=>out.push({field,level,text});
 const n=v=>v===''||v==null?null:Number(v);
 const t=n(values.temperature),h=n(values.pulse),o=n(values.oxygen),g=n(values.glucose),s=n(values.pressure?.systolic),d=n(values.pressure?.diastolic);
 if(t!==null&&Number.isFinite(t)&&t>=20&&t<=50) add('Temperature',t<35||t>=40?'red':t<36.1||t>37.2?'yellow':'green',t<35||t>=40?'Get crew help now and follow the mission medical plan.':t<36.1||t>37.2?'Recheck using the same site and contact the medical officer.':'Within the demo range. Record the measurement site.');
 if(h!==null&&Number.isFinite(h)&&h>=0&&h<=300) add('Heart rate',h<40||h>=130?'red':h<60||h>100?'yellow':'green',h<40||h>=130?'Get crew help now, especially if unwell.':h<60||h>100?'Rest if safe, recheck and discuss symptoms and activity with the medical officer.':'Within the demo range; consider activity and your baseline.');
 if(o!==null&&Number.isFinite(o)&&o>=0&&o<=100) add('Oxygen saturation',o<90?'red':o<95?'yellow':'green',o<90?'Get crew help now. Sensor readings can be inaccurate.':o<95?'Check sensor fit, repeat if safe, and contact the medical officer.':'Within the demo range. Sensor readings can be inaccurate.');
 if(s!==null&&d!==null&&Number.isFinite(s)&&Number.isFinite(d)&&s>=0&&s<=400&&d>=0&&d<=300&&s>d) add('Blood pressure',s<80||s>=180||d>=120?'red':s<90||d<60||s>=120||d>=80?'yellow':'green',s<80||s>=180||d>=120?'Contact the medical officer immediately. Severe symptoms need urgent help without delay.':s<90||d<60||s>=120||d>=80?'Repeat using the mission procedure and discuss symptoms or repeated readings.':'Within the demo range. Compare with your baseline.');
 if(g!==null&&Number.isFinite(g)&&g>=0&&g<=9999){
  if(g<54)add('Blood glucose','red','Get crew help now. If unable to swallow, give nothing by mouth; follow the emergency plan.');
  else if(g<70)add('Blood glucose','yellow','If awake and able to swallow, take 15 g fast-acting carbohydrate and recheck in 15 minutes.');
  else if(details.glucoseContext!=='fasting')add('Blood glucose','yellow','Fasting status is not confirmed. Follow your personal plan and discuss the reading with the medical officer.');
  else if(g>=100)add('Blood glucose','yellow','Above the fasting demo range. Contact the medical officer for review; this is not a diagnosis.');
  else add('Blood glucose','green','Within the fasting demo range. Follow your individual plan.');
 }
 return out;
}
