import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orbitalMotion} from '../design/crew-orbital-motion.js';
test('drift and service-arm movement stay bounded and close views stay quiet',()=>{
 for(let t=0;t<1000;t+=.73){const m=orbitalMotion(t,{armActivity:1});assert(Math.abs(m.astronaut.x)<=.018);assert(Math.abs(m.astronaut.y)<=.045);assert(Math.abs(m.astronaut.roll)<=.014);assert(Math.abs(m.habitat.yaw)<=.018);assert(Math.abs(m.arm.elbow)<=.178);assert(Math.abs(m.arm.wrist)<=.145);const close=orbitalMotion(t,{view:'history'});assert(Math.abs(close.astronaut.y)<=.045*.25);}
});
test('reduced motion retains a static equipment pose and rejects invalid movement inputs',()=>{
 const first=orbitalMotion(1,{reducedMotion:true,armActivity:1}),later=orbitalMotion(80,{reducedMotion:true,armActivity:1});assert.deepEqual(first,later);assert.equal(first.astronaut.y,0);assert.equal(first.habitat.yaw,0);assert.equal(first.arm.shoulder,.1);assert.deepEqual(orbitalMotion(NaN,{armActivity:Infinity}),orbitalMotion(0));
});
