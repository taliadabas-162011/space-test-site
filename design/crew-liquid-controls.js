// A single selection behavior for navigation, measurements and time ranges.
const controls = new WeakMap();
export function selectionBounds(group, item, scrollLeft = 0, scrollTop = 0, scale = {x:1,y:1}) {
  return { x:(item.left-group.left)/scale.x+scrollLeft, y:(item.top-group.top)/scale.y+scrollTop, width:item.width/scale.x, height:item.height/scale.y };
}
export function syncSelectionLens(group, selector) {
  if (!group) return;
  let state = controls.get(group);
  if (!state) {
    const lens=document.createElement('span');lens.className='liquid-selection';lens.setAttribute('aria-hidden','true');
    let last='';
    const update=()=>{
      const selected=group.querySelector(state.selector);if(!selected){lens.style.opacity='0';return}if(!group.clientWidth)return;lens.style.opacity='1';
      const groupRect=group.getBoundingClientRect();
      const scale={x:groupRect.width/group.offsetWidth||1,y:groupRect.height/group.offsetHeight||1};
      const rect=selectionBounds(groupRect,selected.getBoundingClientRect(),group.scrollLeft,group.scrollTop,scale);
      rect.x-=group.clientLeft;rect.y-=group.clientTop;
      const signature=JSON.stringify(rect);if(signature===last)return;last=signature;
      lens.style.transform=`translate3d(${rect.x}px,${rect.y}px,0)`;
      lens.style.width=`${rect.width}px`;lens.style.height=`${rect.height}px`;
      if(!lens.classList.contains('is-ready')){lens.getBoundingClientRect();lens.classList.add('is-ready')}
    };
    const resize=new ResizeObserver(update);resize.observe(group);
    group.addEventListener('pointermove',event=>{const rect=group.getBoundingClientRect();group.style.setProperty('--glass-light-x',`${event.clientX-rect.left}px`);group.style.setProperty('--glass-light-y',`${event.clientY-rect.top}px`)});
    state={lens,update,selector};controls.set(group,state);
  }
  state.selector=selector;
  if(!group.classList.contains('liquid-control'))group.classList.add('liquid-control');
  if(state.lens.parentElement!==group)group.prepend(state.lens);
  state.update();
}
