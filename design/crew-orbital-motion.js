const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
// Bounded visual motion; this never controls equipment or changes measured values.
export function orbitalMotion(seconds,{view='routine',reducedMotion=false,armActivity=0}={}){
 const t=!reducedMotion&&Number.isFinite(seconds)?Math.max(0,seconds):0,activity=clamp(armActivity);
 const moving=reducedMotion?0:1,quiet=view==='emergency'?.3:['history','device'].includes(view)?.25:1;
 return {
  astronaut:{x:Math.sin(t*.31)*.018*quiet*moving,y:Math.sin(t*.48)*.045*quiet*moving,roll:Math.sin(t*.27)*.014*quiet*moving,yaw:Math.sin(t*.19)*.012*quiet*moving},
  habitat:{y:Math.sin(t*.08)*.025*moving,yaw:Math.sin(t*.045)*.018*moving,roll:Math.sin(t*.06)*.005*moving},
  arm:{shoulder:.1*activity,elbow:.16*activity+Math.sin(t*.13)*.018*moving*(view==='emergency'?0:1),wrist:-.12*activity+Math.sin(t*.11)*.025*moving*(view==='emergency'?0:1)},
 };
}
