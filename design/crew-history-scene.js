const FIELDS = {
  pulse: ['Heart rate', 'bpm'], pressure: ['Blood pressure', 'mmHg'], oxygen: ['Oxygen saturation', '%'],
  glucose: ['Blood glucose', 'mg/dL'], temperature: ['Temperature', '°C'], sleep: ['Sleep', 'hrs'],
  water: ['Water intake', 'L'], exercise: ['Exercise', 'min'], weight: ['Body mass', 'kg'],
  mood: ['Mood', '', ['low', 'neutral', 'good']], sleepQuality: ['Sleep quality', '', ['poor', 'mixed', 'restful']],
  symptoms: ['Symptoms', '', ['none', 'concerning', 'urgent']],
};
const CONTEXT = { rest: 'At rest', 'after-activity': 'After activity', fasting: 'Fasting', 'after-meal': 'After a meal', other: 'Other context' };
const CONTEXTUAL = new Set(['pulse', 'pressure', 'oxygen', 'glucose', 'temperature']);
const DAY = 86400000;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = value => value == null || (typeof value === 'string' && !value.trim()) || typeof value === 'boolean' ? NaN : Number(value);
const stamp = value => value == null ? NaN : new Date(value).getTime();
const title = value => value.charAt(0).toUpperCase() + value.slice(1);
const date = (time, full = false) => new Intl.DateTimeFormat(undefined, full ? { dateStyle: 'medium', timeStyle: 'short' } : { month: 'short', day: 'numeric' }).format(time);
const display = (field, value) => field === 'symptoms' ? ({ none: 'No symptoms', concerning: 'Symptoms reported', urgent: 'Urgent symptoms' })[value] : field === 'pressure' ? `${value.systolic}/${value.diastolic}` : FIELDS[field][2] ? title(value) : String(value);

/** Return only valid, recorded observations from one comparable context. */
export function historySeries({ histories = {}, reports = {}, field = 'pulse', days = 120, now = Date.now() } = {}) {
  if (!Object.hasOwn(FIELDS, field)) field = 'pulse';
  if (![30, 90, 120].includes(Number(days))) days = 120;
  now = Number.isFinite(stamp(now)) ? stamp(now) : Date.now();
  const categories = FIELDS[field][2];
  const entries = categories ? (reports?.[field] ?? histories?.[field]) : histories?.[field];
  let points = (Array.isArray(entries) ? entries : []).flatMap(entry => {
    const time = stamp(entry?.time);
    if (!Number.isFinite(time) || time < now - Number(days) * DAY || time > now || entry.recorded === false) return [];
    let value, values;
    if (categories) {
      if (!categories.includes(entry.value)) return [];
      value = entry.value; values = [categories.indexOf(value)];
    } else if (field === 'pressure') {
      const systolic = num(entry.value?.systolic), diastolic = num(entry.value?.diastolic);
      if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return [];
      value = { systolic, diastolic }; values = [systolic, diastolic];
    } else {
      value = num(entry.value); if (!Number.isFinite(value)) return [];
      values = [value];
    }
    return [{ time, value, values, context: Object.hasOwn(CONTEXT, entry.context) ? entry.context : '', site: ['oral','ear','forehead','armpit','other'].includes(entry.site)?entry.site:'', note: typeof entry.note === 'string' ? entry.note : '', tags: Array.isArray(entry.tags) ? entry.tags.filter(tag => typeof tag === 'string') : [], onset: Number.isFinite(stamp(entry.onset)) ? stamp(entry.onset) : null, progression: typeof entry.progression === 'string' ? entry.progression : '', source: typeof entry.source === 'string' && entry.source.trim() ? entry.source.trim() : 'Recorded' }];
  }).sort((a, b) => a.time - b.time);
  const context = CONTEXTUAL.has(field) && points.length ? points.at(-1).context : null;
  if (context !== null) points = points.filter(point => point.context === context);
  const site=field==='temperature'&&points.length?points.at(-1).site:null;if(site!==null)points=points.filter(point=>point.site===site);
  return { points, context, site, field, days: Number(days), now };
}

export function renderHistoryScene({ summary = {}, histories = {}, reports = {}, field = 'pulse', days = 120, position = null, now = Date.now() } = {}) {
  const series = historySeries({ histories, reports, field, days, now });
  ({ field, days, now } = series);
  const { points, context, site } = series, [label, unit, categories] = FIELDS[field];
  const selectedIndex = position == null || !Number.isFinite(Number(position)) ? points.length - 1 : Math.max(0, Math.min(points.length - 1, Math.round(Number(position))));
  const selected = points[selectedIndex], latest = points.at(-1);
  const contextText = [context === null ? '' : CONTEXT[context] || 'Context not recorded',field==='temperature'?(site?`${site.charAt(0).toUpperCase()+site.slice(1)} temperature`:'Site not recorded'):''].filter(Boolean).join(' · ');
  const nav = Object.entries(FIELDS).map(([key, [name]]) => `<button type="button" data-history-scene-field="${key}" aria-pressed="${key === field}">${name}</button>`).join('');
  const range = [30, 90, 120].map(n => `<button type="button" data-history-scene-days="${n}" aria-pressed="${n === days}">${n} days</button>`).join('');
  const valueText = p => `${display(field, p.value)}${unit ? ` ${unit}` : ''}`;
  const details = p => field === 'symptoms' ? [p.tags.join(', '), p.onset == null ? '' : `Began ${date(p.onset, true)}`, p.progression ? title(p.progression) : '', p.note].filter(Boolean).join(' · ') : '';
  let chart = '<p class="history-scene-empty">No recorded readings in this period.</p>';
  if (points.length) {
    const values = points.flatMap(p => p.values), min = categories ? 0 : Math.min(...values), max = categories ? categories.length - 1 : Math.max(...values);
    const pad = min === max ? Math.max(Math.abs(min) * 0.1, 1) : (max - min) * 0.12;
    const low = categories ? min : min - pad, high = categories ? max : max + pad;
    const x = p => 7 + (p.time - (now - days * DAY)) / (days * DAY) * 91;
    const y = value => 88 - (value - low) / (high - low) * 78;
    const lines = Array.from({ length: field === 'pressure' ? 2 : 1 }, (_, i) => `<polyline class="history-scene-line${i ? ' history-scene-line-secondary' : ''}" points="${points.map(p => `${x(p).toFixed(2)},${y(p.values[i]).toFixed(2)}`).join(' ')}" />`).join('');
    const dots = points.map((p, i) => p.values.map((value, valueIndex) => `<span class="history-scene-point${valueIndex ? ' history-scene-point-secondary' : ''}${i === selectedIndex ? ' is-selected' : ''}" style="left:${x(p).toFixed(2)}%;top:${y(value).toFixed(2)}%" data-history-dot="${i}" aria-hidden="true"></span>`).join('')).join('');
    const readings = points.map(p => `${date(p.time, true)} · ${p.source}${contextText ? ` · ${contextText}` : ''} · ${valueText(p)}${details(p) ? ` · ${details(p)}` : ''}`);
    const grid = [0, 1, 2].map(i => `<line x1="7" x2="98" y1="${10 + i * 39}" y2="${10 + i * 39}" />`).join('');
    const ticks = categories ? [...categories].reverse().map(title) : [high, (high + low) / 2, low].map(n => Number(n.toFixed(1)).toString());
    const axis = ticks.map(tick => `<span>${esc(tick)}</span>`).join('');
    const dates = [now - days * DAY, now - days * DAY / 2, now].map(t => `<span>${esc(date(t))}</span>`).join('');
    chart = `<div class="history-scene-plot"><div class="history-scene-y"><span class="history-scene-unit">${esc(unit)}</span>${axis}</div><div class="history-scene-chart" tabindex="0" role="group" aria-label="${esc(`${label} over ${days} days`)}" aria-describedby="history-scene-help history-scene-readout" data-history-chart data-selected="${selectedIndex}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="history-scene-grid">${grid}</g>${lines}</svg><div class="history-scene-crosshair" aria-hidden="true"></div><div class="history-scene-tooltip" aria-hidden="true"><strong></strong><span></span></div>${dots}${points.map((p, i) => `<span hidden data-history-reading data-x="${x(p)}" data-value="${esc(valueText(p))}" data-date="${esc(date(p.time, true))}" data-reading="${esc(readings[i])}"></span>`).join('')}</div></div><div class="history-scene-dates">${dates}</div>${field === 'pressure' ? '<p class="history-scene-legend"><span>Systolic</span><span>Diastolic</span></p>' : ''}`;
  }
  const inspect = selected ? `${date(selected.time, true)} · ${selected.source}${contextText ? ` · ${contextText}` : ''} · ${valueText(selected)}${details(selected) ? ` · ${details(selected)}` : ''}` : 'No reading selected';
  return `<section class="history-scene" aria-labelledby="history-scene-title"><header class="history-scene-header"><div><h2 id="history-scene-title">History</h2></div><div class="history-scene-current"><span>Latest</span><strong>${latest ? esc(display(field, latest.value)) : '—'} <small>${esc(unit)}</small></strong><span>${latest ? esc(date(latest.time, true)) : 'No recorded reading'}</span></div></header><div class="history-scene-layout"><nav class="history-scene-nav" aria-label="Health measurements">${nav}</nav><figure class="history-scene-figure"><figcaption><div><h3>${label}</h3></div><p>${esc(contextText || 'Recorded observations')}${field === 'pressure' ? ' · Systolic / diastolic' : ''}</p></figcaption><div data-history-visual>${chart}</div><div class="history-scene-controls"><div class="history-scene-ranges" role="group" aria-label="History period">${range}</div><div class="history-scene-inspect"><p id="history-scene-help">Hover or drag to inspect · click to pin<span class="history-scene-sr-only">. Use arrow keys, Home or End to navigate; Escape unpins and hides the marker.</span></p><output id="history-scene-readout" class="orbit-chart-readout" aria-live="polite">${esc(inspect)}</output></div></div></figure></div></section>`;
}

/** Return the closest point to a plot x-coordinate, with ties favoring the earlier point. */
export function nearestHistoryIndex(xs, x) {
  if (!xs.length || !Number.isFinite(x)) return -1;
  let lo = 0, hi = xs.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xs[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo > 0 && x - xs[lo - 1] <= xs[lo] - x ? lo - 1 : lo;
}

/** Attach chart interactions after rendering; call the returned cleanup before replacing it. */
export function initializeHistoryChart(root) {
  const chart = root.querySelector('[data-history-chart]');
  if (!chart) return () => {};
  const readings = [...chart.querySelectorAll('[data-history-reading]')];
  const xs = readings.map(node => Number(node.dataset.x));
  const dots = [...chart.querySelectorAll('[data-history-dot]')];
  const crosshair = chart.querySelector('.history-scene-crosshair');
  const output = root.querySelector('#history-scene-readout');
  const tooltip = chart.querySelector('.history-scene-tooltip');
  const tooltipValue = tooltip.querySelector('strong'), tooltipDate = tooltip.querySelector('span');
  let index = -1, pinned = false, frame = 0, pendingX;
  const positionTooltip = () => {
    const width = chart.clientWidth;
    const left = Math.max(4, Math.min(width - tooltip.offsetWidth - 4, width * xs[index] / 100 + 10));
    tooltip.style.left = `${left}px`;
  };
  const show = () => { chart.dataset.inspecting = 'true'; positionTooltip(); };
  const hide = () => { chart.dataset.inspecting = 'false'; };
  const setPinned = value => {
    pinned = value;
    chart.dataset.pinned = String(value);
    chart.setAttribute('aria-label', `${chart.dataset.label}${value ? ', reading pinned' : ''}`);
  };
  chart.dataset.label = chart.getAttribute('aria-label');
  const select = next => {
    if (next < 0 || next >= readings.length || next === index) return;
    index = next;
    crosshair.style.left = `${xs[index]}%`;
    dots.forEach(dot => dot.classList.toggle('is-selected', Number(dot.dataset.historyDot) === index));
    output.textContent = readings[index].dataset.reading;
    tooltipValue.textContent = readings[index].dataset.value;
    tooltipDate.textContent = readings[index].dataset.date;
    chart.dataset.selected = String(index);
    positionTooltip();
  };
  const fromPointer = clientX => {
    const rect = chart.getBoundingClientRect();
    if (rect.width) { select(nearestHistoryIndex(xs, (clientX - rect.left) / rect.width * 100)); show(); }
  };
  const move = event => {
    if (pinned && !chart.hasPointerCapture(event.pointerId)) return;
    pendingX = event.clientX;
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; fromPointer(pendingX); });
  };
  const down = event => {
    if (event.button !== 0) return;
    chart.setPointerCapture(event.pointerId);
    chart.dataset.dragStart = String(event.clientX);
    if (!pinned) fromPointer(event.clientX);
  };
  const up = event => {
    if (!chart.hasPointerCapture(event.pointerId)) return;
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    const dragged = Math.abs(event.clientX - Number(chart.dataset.dragStart)) > 4;
    if (dragged) { fromPointer(event.clientX); setPinned(true); }
    else if (pinned) setPinned(false);
    else { fromPointer(event.clientX); setPinned(true); }
    chart.releasePointerCapture(event.pointerId);
  };
  const key = event => {
    let next = index;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next--;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next++;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = readings.length - 1;
    else if (event.key === 'Escape') { event.stopPropagation(); setPinned(false); hide(); event.preventDefault(); return; }
    else return;
    event.preventDefault();
    setPinned(true);
    select(Math.max(0, Math.min(readings.length - 1, next)));
    show();
  };
  const leave = () => {
    if (!pinned) {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      hide();
    }
  };
  const cancel = event => {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (chart.hasPointerCapture(event.pointerId)) chart.releasePointerCapture(event.pointerId);
    if (!pinned) hide();
  };
  chart.addEventListener('pointermove', move);
  chart.addEventListener('pointerdown', down);
  chart.addEventListener('pointerup', up);
  chart.addEventListener('pointercancel', cancel);
  chart.addEventListener('pointerleave', leave);
  chart.addEventListener('keydown', key);
  select(Number(chart.dataset.selected));
  return () => {
    if (frame) cancelAnimationFrame(frame);
    chart.removeEventListener('pointermove', move);
    chart.removeEventListener('pointerdown', down);
    chart.removeEventListener('pointerup', up);
    chart.removeEventListener('pointercancel', cancel);
    chart.removeEventListener('pointerleave', leave);
    chart.removeEventListener('keydown', key);
  };
}


/** Keep the measurement and period controls mounted while replacing chart content. */
export function updateHistoryScene(root, markup) {
  const current=root.querySelector('.history-scene');
  if(!current){root.innerHTML=markup;return}
  const template=document.createElement('template');template.innerHTML=markup;
  const next=template.content.querySelector('.history-scene');
  for(const selector of ['[data-history-scene-field]','[data-history-scene-days]']) {
    const incoming=[...next.querySelectorAll(selector)];
    current.querySelectorAll(selector).forEach((button,index)=>button.setAttribute('aria-pressed',incoming[index].getAttribute('aria-pressed')));
  }
  for(const selector of ['.history-scene-current','figcaption','[data-history-visual]','.history-scene-inspect']) {
    current.querySelector(selector).replaceWith(next.querySelector(selector));
  }
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const visual=current.querySelector('[data-history-visual]');
    visual.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:'cubic-bezier(.16,1,.3,1)'});

  }
}
