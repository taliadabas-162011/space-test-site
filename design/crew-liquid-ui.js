import {syncSelectionLens} from './crew-liquid-controls.js?v=4';
const PATHS={pulse:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',oxygen:'M12 3c-2.8 4-7 7.5-7 12a7 7 0 0 0 14 0c0-4.5-4.2-8-7-12Z',pressure:'M4 18a9 9 0 1 1 16 0M12 13l4-4M7 8l1 1m8-1-1 1M12 4v2M5 13h2m10 0h2',sleep:'M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z',water:'M6 3h12l-1.5 18h-9L6 3Zm1 6h10',exercise:'M6 4v16M18 4v16M3 7v10M21 7v10M6 12h12',temperature:'M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Zm3-6v9',glucose:'M12 3c-2.8 4-7 7.5-7 12a7 7 0 0 0 14 0c0-4.5-4.2-8-7-12Zm-3 11h6m-3-3v6',weight:'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 5a5 5 0 0 1 8 0m-4 2 2-3',overview:'M3 11 12 3l9 8M5 10v11h5v-6h4v6h5V10',history:'M3 12a9 9 0 1 0 3-6M3 3v5h5m4-1v6l4 2',device:'M12 3v18l6-6L6 3v18l12-12-6-6'};
const icon = (key,cls='') => `<svg class="glass-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${key==='pulse'?'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8ZM3 12h4l2-3 3 6 2-3h7':PATHS[key]||PATHS.pulse}"/></svg>`;
let glassPackage;
function ensureOptics() {return glassPackage ||= import('./vendor/glass.js').catch(()=>{glassPackage=null});}
export function createLiquidInterface(root) {
  root.dataset.uiVariant='glass';
  function layer(element,radius=28) {
    if(!element||element.querySelector(':scope > liquid-glass'))return;
    const glass=document.createElement('liquid-glass');glass.className='glass-optics';glass.setAttribute('aria-hidden','true');
    for(const [key,value] of Object.entries({renderer:'native',radius,frost:.005,blur:.6,scale:45,dispersion:3,'aberration-intensity':.2,saturation:115,'border-color':element.closest('.urgent-page')?'rgba(255,198,165,.8)':'rgba(255,255,255,.65)','reveal':'immediate'}))glass.setAttribute(key,String(value));
    element.prepend(glass);
  }
  function enhance() {
    observer.disconnect();

      for(const reading of root.querySelectorAll('.mission-reading')) {
        if(!reading.querySelector('.glass-icon'))reading.insertAdjacentHTML('afterbegin',reading.dataset.metric==='oxygen'?'<svg class="glass-icon" viewBox="0 0 24 24" aria-hidden="true"><text x="1" y="17" fill="currentColor" font-family="system-ui,sans-serif" font-size="18" font-weight="500">O<tspan font-size="10" dy="4">2</tspan></text></svg>':icon(reading.dataset.metric));
      }
      for(const button of root.querySelectorAll('.mission-tools [data-mission-action]'))if(!button.querySelector('.glass-icon'))button.insertAdjacentHTML('afterbegin',icon(button.dataset.missionAction));
      for(const group of root.querySelectorAll('.mission-tools,.history-scene-nav,.history-scene-ranges'))syncSelectionLens(group,'[aria-current],[aria-pressed=true]');
      for(const reading of root.querySelectorAll('.mission-reading,.urgent-vital'))layer(reading,22);
      for(const control of root.querySelectorAll('.collection-value,.collection-pressure label,.collection-save button[type=submit],[data-guide-next],[data-repeat-next],.mission-checkin,.mission-response .care-primary,.assistance-answers>button,.assistance-recheck,.collection-page .crew-select__trigger,.collection-page .crew-datetime__trigger,.collection-navigation button,.collection-guide>summary,.collection-text-entry,.questionnaire-options,.questionnaire-controls [data-questionnaire-next],.care-checkin-return'))layer(control,22);
      for(const nav of root.querySelectorAll('.collection-navigation')){syncSelectionLens(nav,'button[aria-current]');layer(nav.querySelector(':scope>.liquid-selection'),18)}
      for(const group of root.querySelectorAll('.collection-choices,.questionnaire-options'))syncSelectionLens(group,'label:has(input:checked)');
      for(const menu of root.querySelectorAll('.crew-select__menu')){syncSelectionLens(menu,menu.querySelector('.is-active')?'.crew-select__option.is-active':'.crew-select__option[aria-selected=true]')}
      layer(root.querySelector('.mission-tools'));layer(root.querySelector('.scene-orbit-tools'));layer(root.querySelector('.orbit-scenario-control .crew-select__trigger'),22);
      const nav=root.querySelector('.mission-tools'),button=nav.querySelector('[aria-current]');
      if(button){nav.style.setProperty('--nav-x',`${button.offsetLeft}px`);nav.style.setProperty('--nav-width',`${button.offsetWidth}px`)}
    observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current','aria-pressed','aria-selected','aria-expanded','aria-activedescendant','data-view','data-scenario','data-severity']});
  }
  root.addEventListener('change',()=>queueMicrotask(enhance));
  root.addEventListener('pointermove',event=>{const control=event.target.closest('.mission-reading,.urgent-vital,.collection-value,.collection-pressure label,.collection-page button');if(!control)return;const rect=control.getBoundingClientRect();control.style.setProperty('--glass-light-x',`${event.clientX-rect.left}px`);control.style.setProperty('--glass-light-y',`${event.clientY-rect.top}px`)});
  root.addEventListener('pointerover',event=>{const option=event.target.closest('.crew-select__option');if(option)queueMicrotask(enhance)});
  let queued=false;
  const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;enhance()})}});
  const resize=new ResizeObserver(enhance);resize.observe(root.querySelector('.mission-tools'));
  document.fonts?.ready.then(enhance);
  enhance();
  return {ready:ensureOptics().then(enhance)};
}
