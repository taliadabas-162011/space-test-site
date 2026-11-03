// Earth-based prototype rules; mission-specific thresholds require clinical validation.
function assess(e) {
  const out = [];
  const add = (level, title, text) => out.push({ level, title, text });
  const present = key => e[key] !== '' && e[key] != null;
  if (e.symptoms === 'urgent') add('urgent', 'Urgent symptoms reported', 'Contact the crew medical officer immediately and follow the mission emergency protocol. Do not wait for another reading.');
  else if (e.symptoms === 'concerning') add('watch', 'Symptoms reported', 'Contact the crew medical officer and record when the symptoms began. Follow the mission protocol.');
  if (present('systolic') && present('diastolic')) {
    const s = Number(e.systolic), d = Number(e.diastolic);
    if (s > 180 || d > 120) add('urgent', 'Very high blood pressure', 'Repeat the measurement after at least one minute using your mission protocol. If it remains high, contact the crew medical officer immediately. With urgent symptoms, do not wait to repeat.');
    else if (s >= 130 || d >= 80) add('watch', 'Blood pressure above reference range', 'This single reading is above an Earth-based reference range. Recheck using your mission protocol and discuss repeated readings with your medical team.');
    else if (s >= 120) add('info', 'Blood pressure slightly elevated', 'This reading is above the Earth-based normal range. Log repeat readings and review the pattern with your medical team.');
    else if (s >= 90 && d >= 60) add('info', 'Blood pressure recorded', 'This reading is within the Earth-based reference range. A single reading does not establish your health status; compare it with your baseline.');
    if (s < 90 || d < 60) add('watch', 'Low blood pressure reading', 'A low reading can be normal for some people. If you feel dizzy, faint or unwell, contact the crew medical officer. Record and review the reading against your baseline.');
  }
  if (present('oxygen')) {
    const o = Number(e.oxygen);
    if (o <= 88) add('urgent', 'Low oxygen saturation', 'Seek immediate medical support and follow the mission emergency protocol. Sensor readings can be inaccurate; do not ignore symptoms.');
    else if (o <= 92) add('watch', 'Oxygen saturation needs review', 'Contact the crew medical officer. Check the sensor and repeat according to mission protocol; pulse oximeters have measurement limitations.');
  }
  if (present('pulse')) add('info', 'Heart rate recorded', `Interpret ${e.pulse} bpm in the context of activity, symptoms and your personal baseline. A low resting rate can be normal for trained people.`);
  if (present('temperature') || present('respiration') || present('sleep') || present('exercise')) add('info', 'Daily context recorded', 'Compare these values over time and discuss unusual changes or symptoms with your medical team.');
  if (!out.length) add('info', 'Check-in saved', 'Your notes are part of the picture. Add measurements over time to see more context.');
  return out;
}
if (typeof module !== 'undefined') module.exports = { assess };
