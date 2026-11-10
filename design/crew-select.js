import {openPopover,closePopover} from './crew-popover.js';
/** Accessible in-scene comboboxes backed by the original native form controls. */
const widgets = new WeakMap();
const watchedDocuments = new WeakSet();
let openWidget = null;
let nextId = 0;

function optionsFor(select) {
  return [...select.options].map((option, index) => ({
    index,
    text: option.textContent.trim(),
    disabled: option.disabled || Boolean(option.parentElement?.disabled),
  }));
}

function close(widget, focus = false) {
  if (!widget.open) return;
  widget.open = false;
  if(widget.floating)closePopover(widget.menu);
  else if(widget.select.matches('[data-scenario]')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&typeof widget.menu.animate==='function') {
    const menu=widget.menu, ratio=Math.min(1,widget.trigger.offsetWidth/Math.max(1,menu.offsetWidth));
    menu.setAttribute('aria-hidden','true');menu.inert=true;
    const prefix=innerWidth<768?'':'translateX(-50%) ';
    widget.closeAnimation?.cancel();
    widget.closeAnimation=menu.animate([{opacity:1,transform:getComputedStyle(menu).transform},{opacity:0,transform:`${prefix}scale(${ratio},.18)`}],{duration:180,easing:'cubic-bezier(.4,0,.8,.4)'});
    widget.closeAnimation.onfinish=()=>{if(!widget.open)menu.hidden=true;widget.closeAnimation=null};
  } else widget.menu.hidden = true;

  widget.trigger.setAttribute('aria-expanded', 'false');
  widget.trigger.removeAttribute('aria-activedescendant');
  widget.container.classList.remove('is-open');
  if (openWidget === widget) openWidget = null;
  if (focus && widget.trigger.isConnected) widget.trigger.focus({preventScroll:true});
}

function render(widget) {
  const { select, trigger, menu } = widget;
  const selected = select.options[select.selectedIndex];
  widget.value.textContent = selected?.textContent.trim() || 'Select an option';
  trigger.disabled = select.disabled;
  if (select.required) trigger.setAttribute('aria-required', 'true');
  else trigger.removeAttribute('aria-required');
  if (select.disabled) close(widget);
  menu.replaceChildren();
  optionsFor(select).forEach(item => {
    const option = document.createElement('div');
    option.className = 'crew-select__option';
    option.id = `${widget.id}-option-${item.index}`;
    option.dataset.index = String(item.index);
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(item.index === select.selectedIndex));
    if (item.disabled) option.setAttribute('aria-disabled', 'true');
    option.textContent = item.text;
    if(select.matches('[data-scenario]')) {
      const description=document.createElement('span');description.className='crew-select__description';description.setAttribute('aria-hidden','true');
      description.textContent={routine:'A regular day in orbit',emergency:'Immediate crew assistance'}[select.options[item.index].value]||'';
      option.append(description);
    }
    menu.append(option);
  });
  if (widget.open) setActive(widget, Math.min(widget.active, Math.max(select.options.length - 1, 0)));
}

function setActive(widget, index) {
  const items = optionsFor(widget.select);
  if (!items.length || !items.some(item => !item.disabled)) return;
  if (!items[index] || items[index].disabled) index = items.findIndex(item => !item.disabled);
  widget.active = index;
  widget.menu.querySelectorAll('[role="option"]').forEach(option => {
    option.classList.toggle('is-active', Number(option.dataset.index) === index);
  });
  const active = widget.menu.querySelector(`[data-index="${index}"]`);
  if (active) {
    widget.trigger.setAttribute('aria-activedescendant', active.id);
    if (active.offsetTop < widget.menu.scrollTop) widget.menu.scrollTop = active.offsetTop;
    else if (active.offsetTop + active.offsetHeight > widget.menu.scrollTop + widget.menu.clientHeight) widget.menu.scrollTop = active.offsetTop + active.offsetHeight - widget.menu.clientHeight;
  }
}

/** Find the next enabled option for keyboard navigation, wrapping at either end. */
export function nextSelectableIndex(items, current, direction, edge = false) {
  if (!items.length || ![1, -1].includes(direction)) return -1;
  let index = edge ? (direction > 0 ? -1 : items.length) : current;
  if (!Number.isInteger(index) || index < -1 || index > items.length) index = direction > 0 ? -1 : items.length;
  for (let count = 0; count < items.length; count++) {
    index = (index + direction + items.length) % items.length;
    if (!items[index].disabled) return index;
  }
  return -1;
}

function move(widget, direction, edge = false) {
  const index = nextSelectableIndex(optionsFor(widget.select), widget.active, direction, edge);
  if (index >= 0) setActive(widget, index);
}

function selectLimit(widget){return widget.select.matches('[data-scenario]')?410:Math.min(250,window.innerHeight*.4)}

function show(widget) {
  if (widget.select.disabled || widget.open) return;
  if (openWidget && openWidget !== widget) close(openWidget);
  widget.closeAnimation?.cancel();widget.closeAnimation=null;
  widget.menu.removeAttribute('aria-hidden');widget.menu.inert=false;
  render(widget);
  widget.open = true;
  widget.menu.hidden = false;
  widget.floating=Boolean(widget.select.closest('.collection-page'));
  if(widget.floating)openPopover(widget.menu,widget.trigger,{width:Math.max(widget.trigger.offsetWidth,240),maxHeight:340});
  else {
  const bounds = widget.trigger.getBoundingClientRect();
  const scroller = widget.trigger.closest('.orbit-form, .crew-anatomy-content, .orbit-onboarding, .orbit-section-panel');
  const clipping = scroller?.getBoundingClientRect();
  const availableBelow = Math.min(window.innerHeight, clipping?.bottom ?? window.innerHeight) - bounds.bottom;
  const availableAbove = bounds.top - Math.max(0, clipping?.top ?? 0);
  widget.menu.style.maxHeight = '';
  const openUp = availableBelow < widget.menu.offsetHeight && availableAbove > availableBelow;
  widget.container.classList.toggle('opens-up', openUp);
  const available = Math.max(44, (openUp ? availableAbove : availableBelow) - 8);
  widget.menu.style.maxHeight = `${Math.min(selectLimit(widget), available)}px`;
  }
  widget.trigger.setAttribute('aria-expanded', 'true');
  widget.container.classList.add('is-open');
  openWidget = widget;
  widget.menu.scrollTop = 0;
  setActive(widget, widget.select.selectedIndex);
}

function choose(widget, index) {
  const item = optionsFor(widget.select)[index];
  if (!item || item.disabled) return;
  const changed = widget.select.selectedIndex !== index;
  widget.select.selectedIndex = index;
  if (widget.select.validity.valid) {
    widget.error.hidden = true;
    widget.trigger.removeAttribute('aria-invalid');
  }
  close(widget, true);
  render(widget);
  if (changed || widget.select.matches('[data-scenario]')) widget.select.dispatchEvent(new Event('change', { bubbles: true }));
}

function labelFor(select) {
  const explicit = select.getAttribute('aria-label');
  if (explicit) return explicit;
  const label = select.closest('label');
  if (label) {
    const copy = label.cloneNode(true);
    copy.querySelectorAll('select').forEach(node => node.remove());
    const text = copy.textContent.replace(/\s+/g, ' ').trim();
    if (text) return text;
  }
  const associated = [...select.labels].map(item => item.textContent.trim()).filter(Boolean).join(' ');
  return associated || select.name || 'Choose an option';
}

function unwrapLabel(select) {
  const label = select.closest('label');
  if (!label || label.querySelectorAll('select').length !== 1) return;
  // A button cannot be nested inside a label. Keep the original layout classes.
  const wrapper = document.createElement('div');
  for (const attr of label.attributes) if (attr.name !== 'for') wrapper.setAttribute(attr.name, attr.value);
  wrapper.classList.add('crew-select-label');
  while (label.firstChild) wrapper.append(label.firstChild);
  label.replaceWith(wrapper);
}

function attach(select) {
  if (widgets.has(select)) return widgets.get(select);
  const label = labelFor(select);
  unwrapLabel(select);
  const id = `crew-select-${++nextId}`;
  const container = document.createElement('span');
  container.className = 'crew-select';
  const trigger = document.createElement('button');
  trigger.className = 'crew-select__trigger';
  trigger.type = 'button';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-label', label);
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `${id}-list`);
  const value = document.createElement('span');
  value.className = 'crew-select__value';
  const arrow = document.createElement('span');
  arrow.className = 'crew-select__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '⌄';
  trigger.append(value, arrow);
  const menu = document.createElement('span');
  menu.id = `${id}-list`;
  menu.className = 'crew-select__menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', `${label} options`);
  menu.hidden = true;
  const error = document.createElement('span');
  error.id = `${id}-error`;
  error.className = 'crew-select__error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  trigger.setAttribute('aria-describedby', error.id);
  select.before(container);
  container.append(select, trigger, menu, error);
  select.classList.add('crew-select__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  const widget = { id, select, container, trigger, value, menu, error, active: 0, open: false, search: '', searchTimer: null };
  widgets.set(select, widget);
  trigger.addEventListener('click', () => widget.open ? close(widget) : show(widget));
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Tab') { close(widget); return; }
    if (event.key === 'Escape') { if (widget.open) { event.preventDefault(); event.stopPropagation(); close(widget); } return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!widget.open) show(widget);
      else move(widget, event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (!widget.open) return;
      event.preventDefault();
      move(widget, event.key === 'Home' ? 1 : -1, true);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (widget.open) choose(widget, widget.active); else show(widget);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!widget.open) show(widget);
      widget.search += event.key.toLocaleLowerCase();
      clearTimeout(widget.searchTimer);
      widget.searchTimer = setTimeout(() => { widget.search = ''; }, 700);
      const match = optionsFor(select).find(option => !option.disabled && option.text.toLocaleLowerCase().startsWith(widget.search));
      if (match) setActive(widget, match.index);
    }
  });
  menu.addEventListener('pointermove', event => {
    const option=event.target.closest('[role=option]');
    if(!option||!menu.contains(option)||option.getAttribute('aria-disabled')==='true')return;
    const index=Number(option.dataset.index);if(Number.isInteger(index)&&index!==widget.active)setActive(widget,index);
  });
  menu.addEventListener('click', event => {
    const option = event.target.closest('[role="option"]');
    if (option && menu.contains(option)) choose(widget, Number(option.dataset.index));
  });
  select.addEventListener('change', () => {
    render(widget);
    // Ancestor handlers may update the selected value in response to this event.
    queueMicrotask(() => { if (select.isConnected) render(widget); });
  });
  select.addEventListener('invalid', event => {
    event.preventDefault();
    widget.trigger.setAttribute('aria-invalid', 'true');
    widget.error.textContent = select.validationMessage || 'Choose an option.';
    widget.error.hidden = false;
    queueMicrotask(() => { if (trigger.isConnected) trigger.focus(); });
  });
  select.form?.addEventListener('reset', () => setTimeout(() => { if (select.isConnected) { close(widget); widget.error.hidden = true; trigger.removeAttribute('aria-invalid'); render(widget); } }, 0));
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => { if (select.isConnected) render(widget); }).observe(select, { subtree: true, childList: true, characterData: true, attributes: true });
  }
  const doc = select.ownerDocument;
  if (!watchedDocuments.has(doc)) {
    watchedDocuments.add(doc);
    doc.addEventListener('pointerdown', event => {
      if (openWidget && !openWidget.container.contains(event.target)) close(openWidget);
    });
  }
  render(widget);
  return widget;
}

/** Enhance all native selects below root, without changing submitted field names. */
export function initializeCustomSelects(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('select').forEach(attach);
}

/** Refresh labels after a form value or option is changed programmatically. */
export function syncCustomSelects(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('select').forEach(select => { const widget = widgets.get(select); if (widget) render(widget); });
}

/** Focus the visible control corresponding to a native select. */
export function focusCustomSelect(select, options) {
  if (!select) return;
  (widgets.get(select)?.trigger || select).focus(options);
}
