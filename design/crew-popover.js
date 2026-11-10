// Top-layer menus stay anchored without scrolling the form or changing its height.
export function popoverBounds(anchor,size,viewport,{gap=8,margin=16}={}){
 const width=Math.min(size.width,viewport.width-margin*2),height=Math.min(size.height,viewport.height-margin*2);
 const below=viewport.height-anchor.bottom-gap-margin,above=anchor.top-gap-margin;
 const up=below<height&&above>below;
 return {left:Math.max(margin,Math.min(anchor.left,viewport.width-width-margin)),top:Math.max(margin,Math.min(up?anchor.top-gap-height:anchor.bottom+gap,viewport.height-height-margin)),width,maxHeight:viewport.height-margin*2,up};
}
const active=new WeakMap();
export function openPopover(panel,anchor,{width,maxHeight=480}={}){
 const state=active.get(panel);state?.animation?.cancel();
 panel.hidden=false;panel.inert=false;panel.removeAttribute('aria-hidden');
 panel.setAttribute('popover','manual');panel.classList.add('crew-floating');
 panel.style.width=`${Math.min(width||Math.max(anchor.offsetWidth,220),innerWidth-32)}px`;
 panel.style.maxHeight=`${Math.min(maxHeight,innerHeight-32)}px`;
 if(panel.showPopover&&!panel.matches(':popover-open'))panel.showPopover();
 const position=()=>{
  const box=popoverBounds(anchor.getBoundingClientRect(),{width:panel.offsetWidth,height:panel.offsetHeight},{width:innerWidth,height:innerHeight});
  panel.style.left=`${box.left}px`;panel.style.top=`${box.top}px`;
  panel.style.transformOrigin=box.up?'bottom left':'top left';
 };
 position();
 const observer=new ResizeObserver(position);observer.observe(panel);observer.observe(anchor);
 window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
 active.set(panel,{observer,position,animation:null});
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches)panel.animate([{opacity:0,transform:'translateY(4px) scale(.96)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});
}
export function closePopover(panel){
 const state=active.get(panel);state?.observer.disconnect();
 if(state){window.removeEventListener('resize',state.position);window.removeEventListener('scroll',state.position,true)}
 const finish=()=>{if(panel.matches(':popover-open'))panel.hidePopover();panel.hidden=true;active.delete(panel)};
 if(!state){finish();return}
 panel.inert=true;panel.setAttribute('aria-hidden','true');
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){finish();return}
 state.animation=panel.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(3px) scale(.97)'}],{duration:130,easing:'ease-in'});
 state.animation.onfinish=finish;
}
