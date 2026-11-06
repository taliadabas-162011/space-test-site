// Data freshness is a demonstration check-in interval, not a medical threshold.
const DEMO_INTERVAL = 24 * 60 * 60 * 1000;
const COMPARISON_WINDOW = 30 * DEMO_INTERVAL;
const METRICS = {
  pulse: { min: 0, max: 300 },
  oxygen: { min: 0, max: 100 },
  glucose: { min: 0, max: 9999 },
  weight: { min: 0, max: 400 },
  pressure: { pair: true },
  temperature: { min: 20, max: 50 },
  sleep: { min: 0, max: 24 },
  water: { min: 0, max: 15 },
  exercise: { min: 0, max: 1440 },
};
const CONTEXTS = new Set(['rest', 'after-activity', 'other']);
const GLUCOSE_CONTEXTS = new Set(['fasting', 'after-meal', 'other']);

function numeric(value) {
  return value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim()) ? NaN : Number(value);
}

function validValue(field, value) {
  const metric = METRICS[field];
  if (metric.pair) {
    const systolic = numeric(value?.systolic), diastolic = numeric(value?.diastolic);
    return Number.isFinite(systolic) && Number.isFinite(diastolic) && systolic >= 0 && systolic <= 400 && diastolic >= 0 && diastolic <= 300 && systolic > diastolic;
  }
  const result = numeric(value);
  return Number.isFinite(result) && result >= metric.min && result <= metric.max && (!metric.integer || Number.isInteger(result));
}

function measurement(field, reading, now) {
  if (!reading || reading.value == null) return { state: 'missing', time: null, context: '' };
  if (!validValue(field, reading.value)) return { state: 'invalid', time: null, context: '' };
  if (reading.recorded === false) return { state: 'sample', time: null, context: '' };
  if (reading.recorded !== true) return { state: 'invalid', time: null, context: '' };
  const timestamp = Date.parse(reading.time);
  if (!Number.isFinite(timestamp) || timestamp > now) return { state: 'invalid', time: null, context: '' };
  return {
    state: now - timestamp > DEMO_INTERVAL ? 'stale' : 'recorded',
    value: reading.value,
    time: reading.time,
    context: (field === 'glucose' ? GLUCOSE_CONTEXTS : CONTEXTS).has(reading.context) ? reading.context : '',
  };
}

function restingPulseComparison(summary, history, quality, now) {
  if (!['recorded', 'stale'].includes(quality.pulse.state) || quality.pulse.context !== 'rest' || !Array.isArray(history)) return null;
  const latestTime = Date.parse(quality.pulse.time);
  const latestDay = new Date(latestTime).toISOString().slice(0, 10);
  const byDay = new Map();
  const prior = history.filter(item => {
    const time = Date.parse(item?.time);
    return item?.recorded !== false && item?.context === 'rest' && validValue('pulse', item.value) && Number.isFinite(time) && time < latestTime && time <= now && latestTime - time <= COMPARISON_WINDOW && new Date(time).toISOString().slice(0, 10) !== latestDay;
  }).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  for (const item of prior) byDay.set(new Date(item.time).toISOString().slice(0, 10), numeric(item.value));
  const values = [...byDay.values()].sort((a, b) => a - b);
  if (values.length < 3) return null;
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  const latest = numeric(summary.pulse.value);
  return {
    field: 'pulse', context: 'rest', latest, latestTime: quality.pulse.time,
    previousDays: values.length, median, delta: Math.round((latest - median) * 10) / 10,
    description: 'Comparison with previous recorded resting UTC days; not a clinical baseline or diagnosis.',
  };
}

/** Assess source, timing and reported symptoms; numerical readings are not diagnosed. */
export function assessCrewHealth(summary, histories = {}, now = Date.now()) {
  if (!Number.isFinite(now)) throw new TypeError('The assessment time must be a finite timestamp.');
  const metrics = Object.fromEntries(Object.keys(METRICS).map(field => [field, measurement(field, summary?.[field], now)]));
  const states = Object.values(metrics);
  const coverage = {
    total: states.length,
    recorded: states.filter(item => ['recorded', 'stale'].includes(item.state)).length,
    recent: states.filter(item => item.state === 'recorded').length,
    stale: states.filter(item => item.state === 'stale').length,
    samples: states.filter(item => item.state === 'sample').length,
    missing: states.filter(item => item.state === 'missing').length,
    invalid: states.filter(item => item.state === 'invalid').length,
    demoIntervalHours: 24,
  };
  const lastObservation = states.filter(item => item.time).sort((a, b) => Date.parse(b.time) - Date.parse(a.time))[0]?.time || null;
  const comparison = restingPulseComparison(summary, histories?.pulse, metrics, now);
  const symptomTime = Date.parse(summary?.symptomTime);
  const evidenceTime = Number.isFinite(symptomTime) && symptomTime <= now ? summary.symptomTime : null;
  let result;
  if (summary?.symptoms === 'urgent') {
    result = {
      priority: 'urgent', title: 'Urgent symptoms reported',
      explanation: evidenceTime ? 'The latest symptom report was marked urgent. Review its recorded time and confirm the current situation.' : 'The latest symptom report was marked urgent; its recorded time is unavailable.',
      nextAction: 'Alert the crew and follow the mission emergency procedure immediately.', evidenceTime,
      source: { label: 'American Heart Association', url: 'https://www.heart.org/en/about-us/heart-attack-and-stroke-symptoms' },
    };
  } else if (summary?.symptoms === 'concerning') {
    result = {
      priority: 'attention', title: 'Symptoms reported',
      explanation: evidenceTime ? 'The latest symptom report needs review. Check when it was recorded and confirm the current situation.' : 'A symptom report needs review; its recorded time is unavailable.',
      nextAction: 'Review the report with the medical team and follow mission procedures.', evidenceTime,
      source: { label: 'American Heart Association', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse' },
    };
  } else if (!coverage.recorded) {
    result = {
      priority: 'collect', title: 'No readings yet',
      explanation: coverage.invalid ? 'Some saved readings have invalid values or timestamps and cannot be assessed.' : coverage.samples ? 'Illustrative sample values are not used for assessment.' : 'No valid health readings have been recorded on this device.',
      nextAction: 'Record the measurements and symptoms available for this crew member.', evidenceTime: null,
    };
  } else if (!coverage.recent) {
    result = {
      priority: 'stale', title: 'Review the last readings',
      explanation: 'All saved readings are older than the 24-hour demonstration interval. This is a data-age indicator, not a medical deadline.',
      nextAction: 'Check when the next measurements are due under the mission procedure.', evidenceTime: lastObservation,
    };
  } else if (comparison) {
    result = {
      priority: 'review', title: 'Compare resting heart rate',
      explanation: `The latest resting reading can be compared with ${comparison.previousDays} previous recorded resting UTC days. This is descriptive, not a diagnosis.`,
      nextAction: summary?.symptoms ? 'Review an unexpected change with the medical team and follow mission procedures.' : 'Add a symptom report and review unexpected changes with the medical team.', evidenceTime: comparison.latestTime,
      source: { label: 'American Heart Association', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse' },
    };
  } else {
    result = {
      priority: 'recorded', title: 'Latest observations',
      explanation: 'Compare readings taken under similar conditions. A value alone does not establish health status.',
      nextAction: summary?.symptoms ? 'Review the latest report and follow mission procedures.' : 'Add a symptom report for this crew member.', evidenceTime: lastObservation,
    };
  }
  return { ...result, coverage, metrics, comparison };
}
