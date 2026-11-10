import {test} from 'node:test';
import assert from 'node:assert/strict';
import {popoverBounds} from '../design/crew-popover.js';
test('floating controls flip above low triggers and stay within phone and desktop viewports',()=>{
 for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:320,height:568}]){
  for(const anchor of [{left:24,top:100,bottom:145},{left:viewport.width-70,top:viewport.height-65,bottom:viewport.height-20}]){
   const rect=popoverBounds(anchor,{width:328,height:430},viewport);
   assert(rect.left>=16);assert(rect.left+rect.width<=viewport.width-16);
   assert(rect.top>=16);assert(rect.top+Math.min(430,rect.maxHeight)<=viewport.height-16);
   if(anchor.top>viewport.height-100)assert(rect.up);
  }
 }
});
