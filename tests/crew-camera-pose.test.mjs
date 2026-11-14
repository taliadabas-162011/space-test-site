import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolateCameraPose} from '../design/crew-scene-director.js';
const from={position:[1,1.8,1.2],target:[.4,1.5,0],offset:.13,modelYaw:3.05};
const to={position:[-.5,.9,5],target:[0,1,0],offset:0,modelYaw:-3.05};
test('anatomy exit starts at the displayed camera and ends at the requested shot',()=>{
 assert.deepEqual(interpolateCameraPose(from,to,0),from);
 const end=interpolateCameraPose(from,to,1);assert.deepEqual(end.position,to.position);assert.deepEqual(end.target,to.target);assert.equal(end.offset,0);assert.ok(Math.abs(Math.sin(end.modelYaw)-Math.sin(to.modelYaw))<1e-12);
});
test('one eased camera path has no added orbit or positional overshoot and smoothly removes the lens offset',()=>{
 let previous=-1;
 for(let n=0;n<=100;n++){
  const p=interpolateCameraPose(from,to,n/100),weight=(p.position[2]-from.position[2])/(to.position[2]-from.position[2]);assert.ok(weight>=previous);previous=weight;
  for(const key of ['position','target'])for(let i=0;i<3;i++){assert.ok(p[key][i]>=Math.min(from[key][i],to[key][i])-1e-12);assert.ok(p[key][i]<=Math.max(from[key][i],to[key][i])+1e-12);assert.ok(Math.abs(p[key][i]-(from[key][i]+(to[key][i]-from[key][i])*weight))<1e-12)}
  assert.ok(p.offset>=0&&p.offset<=.13);assert.ok(p.modelYaw>=3.05&&p.modelYaw<=2*Math.PI-3.05);
 }
});
test('an interrupted camera move rebases from its currently displayed pose without a jump',()=>{
 const current=interpolateCameraPose(from,to,.43),next={position:[0,1.7,1.5],target:[0,1.6,0],offset:0,modelYaw:0};
 assert.deepEqual(interpolateCameraPose(current,next,0),current);
 const end=interpolateCameraPose(current,next,1);assert.deepEqual(end.position,next.position);assert.deepEqual(end.target,next.target);
});
