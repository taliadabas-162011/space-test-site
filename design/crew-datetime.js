import {openPopover,closePopover} from './crew-popover.js';
import {syncSelectionLens} from './crew-liquid-controls.js?v=4';
/* Date and time picker backed by the original form input. */
const widgets = new WeakMap();
const watchedDocuments = new WeakSet();
let openWidget = null;
let nextId = 0;
const pad = value => String(value).padStart(2, '0');
const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function close(widget, restoreFocus = false) {
  if (widget.popup.hidden) return;
  closePopover(widget.popup);
  widget.trigger.setAttribute('aria-expanded', 'false');
  if (openWidget === widget) openWidget = null;
  if (restoreFocus && widget.trigger.isConnected) widget.trigger.focus({ preventScroll: true });
}
function updateTrigger(widget) {
  const value = widget.input.value;
  const date = value ? new Date(value) : null;
  widget.value.textContent = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : 'Select date and time';
  widget.trigger.setAttribute('aria-label', `${widget.label}: ${widget.value.textContent}`);
}
function renderCalendar(widget) {
  const year = widget.month.getFullYear(), month = widget.month.getMonth();
  const now = new Date(), today = dateKey(now), currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const cells = Array(new Date(year, month, 1).getDay()).fill('<span aria-hidden="true"></span>');
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
    const date = new Date(year, month, day), key = dateKey(date);
    cells.push(`<button type="button" data-datetime-day="${key}" aria-label="${new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date)}" aria-pressed="${String(key === widget.day)}" tabindex="${key===widget.day?0:-1}"${key === today ? ' aria-current="date"' : ''}${key > today ? ' disabled' : ''}>${day}</button>`);
  }
  const oldMonth=widget.calendar.querySelector('strong')?.textContent;
  widget.calendar.innerHTML = `<div class="crew-datetime__calendar-head"><strong aria-live="polite">${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(widget.month)}</strong><div><button type="button" data-datetime-shift="-1" aria-label="Previous month">←</button><button type="button" data-datetime-shift="1" aria-label="Next month"${widget.month >= currentMonth ? ' disabled' : ''}>→</button></div></div><div class="crew-datetime__grid crew-datetime__weekdays" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="crew-datetime__grid crew-datetime__days">${cells.join('')}</div>`;
  syncSelectionLens(widget.calendar.querySelector('.crew-datetime__days'),'[aria-pressed=true]');
  if(oldMonth&&oldMonth!==widget.calendar.querySelector('strong').textContent&&!matchMedia('(prefers-reduced-motion:reduce)').matches)widget.calendar.animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:200,easing:'ease-out'});
}
function show(widget) {
  if (openWidget && openWidget !== widget) close(openWidget);
  const now = new Date(), existing = widget.input.value ? new Date(widget.input.value) : now;
  const date = Number.isFinite(existing.getTime()) ? existing : now;
  widget.day = dateKey(date);
  widget.month = new Date(date.getFullYear(), date.getMonth(), 1);
  widget.hour.value = pad(date.getHours());
  widget.minute.value = pad(date.getMinutes());
  widget.error.textContent = '';
  renderCalendar(widget);
  openPopover(widget.popup,widget.trigger,{width:328,maxHeight:520});
  widget.trigger.setAttribute('aria-expanded', 'true');
  openWidget = widget;
  widget.calendar.querySelector(`[data-datetime-day="${widget.day}"]`)?.focus({ preventScroll: true });
}
function attach(input) {
  if (widgets.has(input)) return;
  const label = input.closest('label');
  const text = input.getAttribute('aria-label') || label?.textContent.replace(/\s+/g, ' ').trim() || 'Date and time';
  if (label && label.querySelectorAll('input').length === 1) {
    const wrapper = document.createElement('div');
    for (const attr of label.attributes) if (attr.name !== 'for') wrapper.setAttribute(attr.name, attr.value);
    wrapper.classList.add('crew-datetime-label');
    while (label.firstChild) wrapper.append(label.firstChild);
    label.replaceWith(wrapper);
  }
  const id = `crew-datetime-${++nextId}`;
  const container = document.createElement('div');
  container.className = 'crew-datetime';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'crew-datetime__trigger';
  trigger.setAttribute('aria-label', text);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-controls', `${id}-popup`);
  trigger.innerHTML = '<span class="crew-datetime__value"></span><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>';
  const popup = document.createElement('div');
  popup.id = `${id}-popup`;
  popup.className = 'crew-datetime__popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', `${text}: choose date and time`);
  popup.hidden = true;
  popup.innerHTML = `<div class="crew-datetime__calendar"></div><span class="crew-datetime__time-title">Time <small>24-hour</small></span><div class="crew-datetime__time"><label>Hour <input type="text" maxlength="2" inputmode="numeric" aria-label="Hour (0 to 23)"></label><span aria-hidden="true">:</span><label>Minute <input type="text" maxlength="2" inputmode="numeric" aria-label="Minute (0 to 59)"></label></div><span class="crew-datetime__error" role="alert"></span><span class="crew-datetime__actions"><button type="button" data-datetime-now>Now</button><button type="button" data-datetime-clear>Clear</button><button type="button" data-datetime-apply>Done</button></span>`;
  input.before(container);
  container.append(input, trigger, popup);
  input.classList.add('crew-datetime__native');
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  const widget = { input, container, trigger, popup, label: text, value: trigger.querySelector('.crew-datetime__value'), calendar: popup.querySelector('.crew-datetime__calendar'), hour: popup.querySelector('[aria-label^="Hour"]'), minute: popup.querySelector('[aria-label^="Minute"]'), error: popup.querySelector('.crew-datetime__error') };
  widgets.set(input, widget);
  trigger.addEventListener('click', () => trigger.getAttribute('aria-expanded')==='false' ? show(widget) : close(widget));
  popup.addEventListener('click', event => {
    const shift = event.target.closest('[data-datetime-shift]');
    if (shift) {
      widget.month = new Date(widget.month.getFullYear(), widget.month.getMonth() + Number(shift.dataset.datetimeShift), 1);
      renderCalendar(widget);
      const target = widget.calendar.querySelector(`[data-datetime-shift="${shift.dataset.datetimeShift}"]`);
      (target?.disabled ? widget.calendar.querySelector('[data-datetime-shift="-1"]') : target)?.focus({ preventScroll: true });
      return;
    }
    const day = event.target.closest('[data-datetime-day]');
    if (day && !day.disabled) {
      widget.day = day.dataset.datetimeDay;
      for(const cell of widget.calendar.querySelectorAll('[data-datetime-day]')){cell.setAttribute('aria-pressed',String(cell===day));cell.tabIndex=cell===day?0:-1;}
      syncSelectionLens(widget.calendar.querySelector('.crew-datetime__days'),'[aria-pressed=true]');
      widget.calendar.querySelector(`[data-datetime-day="${widget.day}"]`)?.focus({ preventScroll: true });
      return;
    }
    if(event.target.closest('[data-datetime-now]')){const now=new Date();widget.day=dateKey(now);widget.month=new Date(now.getFullYear(),now.getMonth(),1);widget.hour.value=pad(now.getHours());widget.minute.value=pad(now.getMinutes());renderCalendar(widget);widget.calendar.querySelector(`[data-datetime-day="${widget.day}"]`)?.focus({preventScroll:true});return;}
    if (event.target.closest('[data-datetime-clear]')) {
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      updateTrigger(widget);
      close(widget, true);
      return;
    }
    if (event.target.closest('[data-datetime-apply]')) {
      const hour = Number(widget.hour.value), minute = Number(widget.minute.value);
      if (!/^\d{1,2}$/.test(widget.hour.value) || !/^\d{1,2}$/.test(widget.minute.value) || !Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
        widget.error.textContent = 'Enter a valid hour and minute.';
        return;
      }
      input.value = `${widget.day}T${pad(hour)}:${pad(minute)}`;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      updateTrigger(widget);
      close(widget, true);
    }
  });
  container.addEventListener('keydown', event => {
    const day=event.target.closest('[data-datetime-day]'),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
    if(day&&delta){event.preventDefault();const date=new Date(day.dataset.datetimeDay+'T12:00');date.setDate(date.getDate()+delta);if(dateKey(date)>dateKey(new Date()))return;widget.month=new Date(date.getFullYear(),date.getMonth(),1);renderCalendar(widget);widget.calendar.querySelector(`[data-datetime-day="${dateKey(date)}"]`)?.focus({preventScroll:true});return;}
    if (event.key === 'Enter' && event.target.matches('.crew-datetime__time input')) { event.preventDefault(); popup.querySelector('[data-datetime-apply]').click(); return; }
    if (event.key === 'Escape' && !popup.hidden) { event.preventDefault(); event.stopPropagation(); close(widget, true); }
  });
  container.addEventListener('focusout',event=>{if(openWidget===widget&&event.relatedTarget&&!container.contains(event.relatedTarget))close(widget)});
  input.addEventListener('change', () => updateTrigger(widget));
  input.form?.addEventListener('reset', () => setTimeout(() => { if (input.isConnected) { close(widget); updateTrigger(widget); } }, 0));
  const doc = input.ownerDocument;
  if (!watchedDocuments.has(doc)) {
    watchedDocuments.add(doc);
    doc.addEventListener('pointerdown', event => { if (openWidget && !openWidget.container.contains(event.target)) close(openWidget); });
  }
  updateTrigger(widget);
}
export function initializeCustomDateTimes(root) {
  root?.querySelectorAll('input[type="datetime-local"]').forEach(attach);
}
export function syncCustomDateTimes(root) {
  root?.querySelectorAll('input[type="datetime-local"]').forEach(input => { const widget = widgets.get(input); if (widget) updateTrigger(widget); });
}
