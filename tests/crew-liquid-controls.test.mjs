import assert from 'node:assert/strict';
import {selectionBounds} from '../design/crew-liquid-controls.js';
assert.deepEqual(selectionBounds({left:100,top:80},{left:112,top:125,width:140,height:30}),{x:12,y:45,width:140,height:30});
assert.deepEqual(selectionBounds({left:20,top:30},{left:-40,top:35,width:100,height:32},80,0),{x:20,y:5,width:100,height:32});
assert.deepEqual(selectionBounds({left:20,top:30},{left:25,top:-40,width:100,height:28},0,100),{x:5,y:30,width:100,height:28});
console.log('Selection lenses keep local coordinates in horizontal and vertical scrollers.');
// Menu opening scales the ancestor; the lens must still use untransformed CSS pixels.
assert.deepEqual(selectionBounds({left:100,top:50},{left:104,top:66,width:132,height:28},0,0,{x:.5,y:.4}),{x:8,y:40,width:264,height:70});
assert.deepEqual(selectionBounds({left:100,top:50},{left:108,top:90,width:264,height:70}),{x:8,y:40,width:264,height:70});
