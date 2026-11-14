# Urgent voice guidance

The guide speaks a fixed, reviewed set of instructions. It does not read arbitrary page text, generate medical advice, diagnose the crew member, contact anyone, or replace a mission checklist. Answer buttons remain available throughout. Changing view or leaving assistance cancels playback and recognition.

## Spoken instructions

`crew-assistance-audio.js` defines narration from the current decision and the same topic/measurement content used by the visible guide. Longer instructions play as short actions; the current list item is highlighted. CPR uses one glass reading surface beside an unframed training photo. Earlier scenario vitals stay on the response overview rather than competing with the resuscitation actions. Entering crew assistance starts narration from the user’s entry gesture, unless application audio is muted. Small Pause, Continue and Replay controls are fallbacks, not an extra step before hearing instructions. Selecting a new answer advances narration only if the user has enabled it; pausing does not turn it back on automatically. There is no automatic browser-synthesis fallback.

The 78 bundled MP3 clips total approximately 2.8 MB. They use Kokoro-82M v1.0, voice `af_heart`, speed 0.95. The [official model](https://huggingface.co/hexgrad/Kokoro-82M) is Apache-2.0; the [kokoro-onnx wrapper](https://github.com/thewh1teagle/kokoro-onnx) is MIT. These are generated synthetic recordings, not a human clinician. No model weights or runtime inference are shipped. The service worker includes the recordings for playback after the app has finished caching, without an external speech service.

To rebuild, run `scripts/generate-crew-voice.py` with the model/voice-file paths as documented in that script. `design/voice/manifest.json` records the exact source text for each content-addressed filename. The regression test fails if a clinical text changes without regenerating its clip. Spoken units expand mg/dL to “milligrams per deciliter” and °C to “degrees Celsius”.

## Voice answers

Space starts browser SpeechRecognition in English while an assistance question is open. Space again or Escape stops it; text fields and focused buttons retain their normal keyboard behavior. A touch-accessible microphone control is the fallback. After a confirmed answer, the next question is spoken and listening resumes automatically. It may send microphone audio to the browser vendor's service and require connectivity; the interface explains this before activation. The app does not store audio or raw transcripts.

Recognition accepts a limited vocabulary for the current question, reads back a recognized answer and waits for Confirm or Retry. Either can be spoken or selected on screen. A confirmed answer uses the same validated observation action as a button answer. Gasping maps to No only for the breathing question. Unknown phrases never become observations. Two failed attempts, permission errors, a 12-second listening timeout, cancellation or leaving the guide end recognition. Callback generations and the question key prevent an old recognition from changing a later question.

## Clinical scope and sources

The workflow is written for astronaut crew. Its decision branches and examples use adult first-aid guidance; that clinical scope is documented here rather than repeated in operational instructions. Their original sources remain visible in the guide. This change adds the assessment time limit of no more than ten seconds and improves delivery; it does not turn uncertain observations into a diagnosis or introduce treatment inferred from a number.

- [American Red Cross: unresponsive person](https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person) supports calling for help, checking responsiveness, checking breathing within ten seconds and treating gasping as abnormal breathing.
- [American Heart Association: adult basic life support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support) supports the adult compression rate and depth represented in the example. These terrestrial instructions do not establish an approved microgravity restraint technique.
- [NASA: crew medical training](https://www.nasa.gov/reference/5-0-training/) and [in-flight medical care](https://www.nasa.gov/ochmo/health-and-medical-systems/in-flight-medical-care/) establish the mission training and onboard medical-officer context. Vehicle-specific resuscitation procedures and trained restraints take precedence.

The current guide still needs mission medical review, usability testing under noise/stress and real speech-recognition testing on target hardware. Automated recognition tests use mocks rather than recording a user's microphone.
