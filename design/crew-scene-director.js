import { sceneFitDistance } from './crew-scene-orbit.js?v=2';
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const ease=t=>t<.5?2*t*t:1-((-2*t+2)**2)/2;
const angleDelta=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
const family=key=>['history','device'].includes(key)?key:'overview';

/** Existing views keep their readable composition; the camera travels between them. */
export function sceneShot(view,{frame=null,aspect=1.6,screenWidth=1280,variant='glass'}={}) {
  const mobile=screenWidth<768;
  let framing=frame||{x:variant==='focus'?.42:.5,y:.5,width:.3,height:.64};
  let yaw=-.08,pitch=.025,height=.86;
  if(view==='history')return {yaw:-.08,pitch:.015,height:1.64,distance:Math.max(1.15,.45/(2*Math.tan(17*Math.PI/180)*.66*Math.max(.1,aspect))),x:.5,y:.42,nearDistance:Math.max(2.7,3.2/Math.max(.45,aspect))};
  else if(view==='device'&&!mobile)return {yaw:-.42,pitch:-.04,height:1.12,distance:Math.max(1.55,.75/(2*Math.tan(17*Math.PI/180)*.47*Math.max(.1,aspect))),x:.26,y:.58,nearDistance:Math.max(2.7,3.2/Math.max(.45,aspect))};
  else if(view==='device'){framing={x:.5,y:.54,width:.82,height:.84};yaw=-.42;pitch=.025;height=1.04}
  else if(view==='recovery'){yaw=.2;pitch=.045}
  else if(view==='review'||view==='symptoms'){yaw=-.22}
  else if(view==='emergency'||view==='assistance'){yaw=-.12;pitch=0}
  return {yaw,pitch,height,distance:sceneFitDistance(framing,aspect),x:framing.x,y:framing.y,nearDistance:Math.max(2.7,3.2/Math.max(.45,aspect))};
}

/** Continuous shortest-arc travel with a controlled approach and moving look-at. */
export function createSceneDirector(duration=1850) {
  let key=null,from=null,current=null,start=0,active=false,travel=false;
  return {
    update(nextKey,destination,now,reduced=false) {
      if(nextKey!==key) {
        from=current?{...current}:{...destination,yaw:destination.yaw-.2,distance:destination.distance*1.12};
        travel=key!==null&&family(key)!==family(nextKey)&&nextKey!=='emergency';
        key=nextKey;start=now;active=true;
      }
      if(reduced||!active){current={...destination};active=false;return current}
      const t=clamp((now-start)/duration,0,1),weight=ease(t);
      current={...destination};
      for(const field of ['pitch','height','distance','x','y'])current[field]=from[field]+(destination[field]-from[field])*weight;
      current.yaw=from.yaw+angleDelta(from.yaw,destination.yaw)*weight;
      if(travel&&Math.min(from.distance,destination.distance)>destination.nearDistance) {
        const approach=Math.sin(Math.PI*weight)**2;
        const near=Math.min(from.distance,destination.distance,destination.nearDistance);
        current.distance+=(near-current.distance)*approach;
        current.height+=(Math.max(from.height,destination.height,1.38)-current.height)*approach;
      }
      if(t===1){current={...destination};active=false}
      return current;
    },
  };
}

/** Pan the physical camera, rather than sliding the model with a lens offset. */
export function placeSceneCamera(shot,aspect,exploration={yaw:0,pitch:0,zoom:0}) {
  const yaw=shot.yaw+exploration.yaw,pitch=shot.pitch+exploration.pitch;
  const distance=shot.distance*Math.exp(exploration.zoom*.12),sinYaw=Math.sin(yaw),cosYaw=Math.cos(yaw),sinPitch=Math.sin(pitch),cosPitch=Math.cos(pitch);
  const span=2*distance*Math.tan(17*Math.PI/180);
  const x=(.5-shot.x)*span*aspect,y=(shot.y-.5)*span;
  const target=[cosYaw*x-sinPitch*sinYaw*y,shot.height+cosPitch*y,-sinYaw*x-sinPitch*cosYaw*y];
  return {target,position:[target[0]+sinYaw*cosPitch*distance,target[1]+sinPitch*distance,target[2]+cosYaw*cosPitch*distance]};
}
