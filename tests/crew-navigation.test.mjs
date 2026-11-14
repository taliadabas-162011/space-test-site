import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneNavigation} from '../design/crew-navigation.js';
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return {promise,resolve}};
test('ordinary navigation opens immediately without restoring a scene',()=>{
 const calls=[];const go=createSceneNavigation({needsRestore:()=>false,restore:()=>calls.push('restore'),enter:section=>calls.push(section)});
 go('overview');assert.deepEqual(calls,['overview']);
});
test('destination opens while anatomy restoration is still animating',async()=>{
 const done=deferred(),calls=[];const go=createSceneNavigation({needsRestore:()=>true,restore:()=>{calls.push('restore');return done.promise},enter:section=>calls.push(section)});
 go('history');assert.deepEqual(calls,['restore','history']);done.resolve();await done.promise;assert.deepEqual(calls,['restore','history']);
});
test('rapid tab changes stay interactive and restoration cannot reopen a stale destination',async()=>{
 const done=deferred(),calls=[];let anatomy=true,current;
 const go=createSceneNavigation({needsRestore:()=>anatomy,restore:()=>{anatomy=false;calls.push('restore');return done.promise},enter:section=>{current=section;calls.push(section)}});
 go('history');go('device');go('checkin');assert.equal(current,'checkin');assert.deepEqual(calls,['restore','history','device','checkin']);
 done.resolve();await done.promise;assert.equal(current,'checkin');
});
