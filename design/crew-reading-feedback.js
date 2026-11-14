// General adult educational examples; individual mission protocols take precedence.
export function assessReadings(values, details={}) {
 const out=[]; const add=(field,level,text)=>out.push({field,level,text});
 const n=v=>v===''||v==null?null:Number(v);
 const t=n(values.temperature),h=n(values.pulse),o=n(values.oxygen),g=n(values.glucose),s=n(values.pressure?.systolic),d=n(values.pressure?.diastolic);
 if(t!==null&&Number.isFinite(t)&&t>=20&&t<=50) add('Temperature',t<35||t>=40?'red':t<36.1||t>37.2?'yellow':'green',t<35||t>=40?'Get crew help now and follow the mission medical plan.':t<36.1?'Your temperature is below the usual range. Move somewhere warm if safe, recheck, and contact the medical officer.':t>37.2?'Your temperature is above the usual range. Rest in a cooler area, recheck, and contact the medical officer.':'Your temperature is within the usual range. Record the measurement site.');
 if(h!==null&&Number.isFinite(h)&&h>=0&&h<=300) add('Heart rate',h<40||h>=130?'red':h<60||h>100?'yellow':'green',h<40||h>=130?'Get crew help now, especially if unwell.':h<60?'Your heart rate is below the usual range. Stop activity, stay safely secured, and contact the medical officer if unwell.':h>100?'Your heart rate is above the usual range. Rest if safe, recheck, and discuss symptoms or activity with the medical officer.':'Your heart rate is within the usual resting range. Compare it with your baseline.');
 if(o!==null&&Number.isFinite(o)&&o>=0&&o<=100) add('Oxygen saturation',o<90?'red':o<95?'yellow':'green',o<90?'Get crew help now. Sensor readings can be inaccurate.':o<95?'Your oxygen reading is below the usual range. Check the sensor fit, recheck if safe, and contact the medical officer.':'Your oxygen reading is within the usual range. Sensor readings can be inaccurate.');
 if(s!==null&&d!==null&&Number.isFinite(s)&&Number.isFinite(d)&&s>=0&&s<=400&&d>=0&&d<=300&&s>d) add('Blood pressure',s<80||s>=180||d>=120?'red':s<90||d<60||s>=120||d>=80?'yellow':'green',s<80||s>=180||d>=120?'Contact the medical officer immediately. Severe symptoms need urgent help without delay.':s<90||d<60?'Your blood pressure is below the usual range. Stay safely secured, recheck if safe, and contact the medical officer if unwell.':s>=120||d>=80?'Your blood pressure is above the usual range. Rest, repeat using the mission procedure, and discuss repeated readings with the medical officer.':'Your blood pressure is within the usual range. Compare it with your baseline.');
 if(g!==null&&Number.isFinite(g)&&g>=0&&g<=9999){
  if(g<54)add('Blood glucose','red','Get crew help now. If unable to swallow, give nothing by mouth; follow the emergency plan.');
  else if(g<70)add('Blood glucose','yellow','Your blood glucose is low. If awake and able to swallow, take 15 g fast-acting carbohydrate and recheck in 15 minutes. If still below 70 mg/dL, repeat and contact the medical officer.');
  else if(details.glucoseContext!=='fasting')add('Blood glucose','yellow','Fasting status is not confirmed. Follow your personal plan and discuss the reading with the medical officer.');
  else if(g>=100)add('Blood glucose','yellow','Your fasting blood glucose is above the usual range. Contact the medical officer to review the result.');
  else add('Blood glucose','green','Your fasting blood glucose is within the usual range. Follow your individual plan.');
 }
 return out;
}
