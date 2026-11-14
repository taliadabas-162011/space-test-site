/* Synthetic data for the optional, isolated demonstration profile. */
(() => {
  function makeRecords(now = new Date()) {
    const records = {};
    const append = (field, value, time, source, context = '') => {
      records[field] ||= [];
      const entry = { value, time, recordedAt: time, source };
      if (context) entry.context = context;
      records[field].push(entry);
    };
    for (let daysAgo = 119; daysAgo >= 0; daysAgo--) {
      const when = new Date(now);
      when.setDate(when.getDate() - daysAgo);
      if (daysAgo) when.setHours(9, 0, 0, 0);
      else when.setHours(0, 0, 0, 0);
      const time = when.toISOString();
      const pulse = 76 + Math.round(4 * Math.sin(daysAgo / 5) + 2 * Math.sin(daysAgo / 2.3));
      append('pulse', pulse, time, 'Scenario history', 'rest');
      append('oxygen', 97 + (daysAgo % 5 === 0 ? 1 : 0), time, 'Scenario history', 'rest');
      append('sleep', Math.round((7.4 + Math.sin(daysAgo / 6) * .6) * 10) / 10, time, 'Scenario history');
      append('water', Math.round((2.2 + Math.sin(daysAgo / 7) * .25) * 10) / 10, time, 'Scenario history');
      append('exercise', 85 + (daysAgo % 7) * 5, time, 'Scenario history');
      append('mood', daysAgo % 10 === 0 ? 'neutral' : 'good', time, 'Scenario history');
      append('sleepQuality', daysAgo % 9 === 0 ? 'mixed' : 'restful', time, 'Scenario history');
      if (daysAgo % 3 === 0) {
        append('pressure', { systolic: 116 + (daysAgo % 5), diastolic: 74 + (daysAgo % 4) }, time, 'Scenario history', 'rest');
        append('temperature', Math.round((36.7 + Math.sin(daysAgo / 8) * .2) * 10) / 10, time, 'Scenario history', 'rest');
      }
      if (daysAgo % 7 === 0) {
        // Use periods independent of the weekly sampling cadence.
        append('glucose', 88 + Math.round(6 * Math.sin(daysAgo / 13) + 3 * Math.sin(daysAgo / 4)), time, 'Scenario history', 'fasting');
        append('weight', Math.round((70 + Math.sin(daysAgo / 30) * .5) * 10) / 10, time, 'Scenario history');
      }
      if (daysAgo === 0) append('symptoms', 'none', time, 'Scenario history');
    }
    return { alex: records };
  }
  // Rebuild only authored presentation rows; personal timestamps and values are immutable.
  function refreshRecords(stored, now = new Date()) {
    const next = structuredClone(stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {});
    const sample = makeRecords(now).alex;
    next.alex ||= {};
    if (typeof next.alex !== 'object' || Array.isArray(next.alex)) next.alex = {};
    for (const [field, rows] of Object.entries(sample)) {
      const personal = (Array.isArray(next.alex[field]) ? next.alex[field] : []).filter(row => row?.source !== 'Scenario history');
      // A refreshed 'none' report must never supersede an actual symptom report.
      const hasReport = field === 'symptoms' && personal.some(row => !['Manual help request','Unsaved help request'].includes(row?.source) && ['none','concerning','urgent'].includes(row?.value));
      next.alex[field] = [...(hasReport ? [] : rows), ...personal].sort((a,b) => Date.parse(a?.time) - Date.parse(b?.time));
    }
    return next;
  }
  window.CrewDemo = { makeRecords, refreshRecords };
})();

