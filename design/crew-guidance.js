const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const flow = {
  start: {
    heading: person => `Is ${person} responding?`,
    text: 'Make sure the scene is safe. Shout their name, tap their shoulder and check their breathing. Do not delay the emergency response.',
    choices: [['responsive', 'Responds'], ['unresponsive', 'No response / unsure']],
  },
  responsive: {
    heading: () => 'Stay with them.',
    text: 'Alert the crew and follow the emergency procedure. Chest pain, breathing difficulty or sudden weakness, speech or vision changes need urgent attention even if the person can respond. Watch for a change in responsiveness or breathing.',
    choices: [['unresponsive', 'They stop responding']],
    back: 'start',
  },
  unresponsive: {
    heading: () => 'Are they breathing normally?',
    text: 'Check quickly, for no more than 10 seconds. Gasping is not normal breathing. Alert the crew and ask for the AED if available.',
    choices: [['breathing', 'Breathing normally'], ['no-breathing', 'No normal breathing / unsure']],
    back: 'start',
  },
  breathing: {
    heading: () => 'Stay and monitor.',
    text: 'If they are unresponsive but breathing normally, keep the crew alerted, stay with them and monitor their breathing. Follow the mission emergency procedure. If breathing stops or becomes abnormal, begin CPR and use the AED as soon as available.',
    choices: [['no-breathing', 'Breathing stops / becomes abnormal']],
    back: 'unresponsive',
  },
  'no-breathing': {
    heading: () => 'Start CPR now.',
    text: 'If they are unresponsive and not breathing normally, start CPR immediately using your mission training. Have a crewmate bring the AED; turn it on and follow its prompts as soon as it arrives. Continue until they breathe normally or trained help takes over.',
    choices: [],
    back: 'unresponsive',
  },
};

export function renderEmergencyGuide({ personName, step = 'start' } = {}) {
  if (!Object.hasOwn(flow, step)) step = 'start';
  const person = typeof personName === 'string' && personName.trim() ? escapeHtml(personName.trim()) : 'the crew member';
  const view = flow[step];
  const back = view.back ? `<button type="button" class="emergency-back" data-emergency-step="${view.back}">← Back</button>` : '';
  const choices = view.choices.map(([target, label]) => `<button type="button" data-emergency-step="${target}"><span>${label}</span><i aria-hidden="true">↗</i></button>`).join('');
  return `<section class="emergency-guide" data-emergency-view="${step}" aria-labelledby="emergency-title">
    <div class="emergency-topline"><span>CREW / EMERGENCY GUIDANCE</span><button type="button" data-emergency-close aria-label="Close emergency guidance">Close <span aria-hidden="true">×</span></button></div>
    <div class="emergency-immediate"><span>ACT NOW</span><p>Alert the crew. If the person is unresponsive and not breathing normally, start CPR immediately and use an AED as soon as available, following its prompts and your mission training.</p></div>
    <div class="emergency-flow" aria-live="polite"><h2 id="emergency-title" tabindex="-1">${view.heading(person)}</h2><p>${view.text}</p><div class="emergency-choices">${choices}</div>${back}</div>
    <footer class="emergency-source"><span>Earth-based first-aid example · not a validated spaceflight protocol</span><a href="https://www.heart.org/en/health-topics/cardiac-arrest/emergency-treatment-of-cardiac-arrest" target="_blank" rel="noopener noreferrer">American Heart Association ↗</a><a href="https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person" target="_blank" rel="noopener noreferrer">American Red Cross ↗</a></footer>
  </section>`;
}
