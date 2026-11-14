import test from 'node:test';
import assert from 'node:assert/strict';
import {renderAnatomyUI} from '../design/crew-anatomy-ui.js';
const summary={person:{name:'<Crew>'},pulse:{value:72,recorded:true,time:'2026-11-14T12:00:00Z',context:'rest'},pressure:{value:{systolic:120,diastolic:80}},oxygen:{value:98}};
test('anatomy exposes body systems and metrics without a second exit navigation',()=>{
 const html=renderAnatomyUI(summary);
 assert.match(html,/aria-label="&lt;Crew&gt; anatomy view"/);assert.doesNotMatch(html,/data-anatomy-exit|Back to suit/);assert.match(html,/aria-label="Body systems"/);assert.match(html,/data-anatomy-body/);
 assert.equal((html.match(/id="crew-anatomy-control-/g)||[]).length,4);
 assert.match(html,/data-anatomy-metric-select="pulse" aria-pressed="true"/);assert.match(html,/data-anatomy-metric-select="oxygen" aria-pressed="false"/);
 assert.match(html,/data-anatomy-metric-panel="pulse">/);assert.match(html,/data-anatomy-metric-panel="oxygen" hidden/);
});
test('liquid anatomy entry preserves numeric field contracts, units and measurement context',()=>{
 const html=renderAnatomyUI(summary,'circulation',{},'pressure');
 assert.match(html,/name="systolic" min="0" max="400" step="1" inputmode="numeric" required/);assert.match(html,/name="diastolic" min="0" max="300" step="1" inputmode="numeric" required/);
 assert.match(html,/class="collection-value"/);assert.match(html,/name="context"/);assert.match(html,/name="glucoseContext"/);assert.match(html,/name="measuredAt"/);assert.match(html,/mmHg/);assert.match(html,/role="alert"/);
 assert.match(html,/data-anatomy-metric-panel="pressure">/);assert.doesNotMatch(html,/<Crew>/);
});
