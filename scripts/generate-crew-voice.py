"""Rebuild the bundled voice clips from the exported clinical text.

Run with uv run --python 3.12 --with kokoro-onnx==0.6.1 --with soundfile
then this file, followed by paths to kokoro-v1.0.onnx and voices-v1.0.bin.
Requires ffmpeg. Model weights stay outside the app.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import soundfile as sf
from kokoro_onnx import Kokoro

root = Path(__file__).resolve().parents[1]
query = "import {allVoiceTexts,voiceFile} from './design/crew-assistance-audio.js'; console.log(JSON.stringify(allVoiceTexts().map(text=>({text,file:voiceFile(text)}))))"
clips = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', query], cwd=root))
model = Kokoro(sys.argv[1], sys.argv[2])
for i, clip in enumerate(clips):
    output = root / 'design' / clip['file']
    if output.exists():
        continue
    spoken = clip['text'].replace('mg/dL', 'milligrams per deciliter').replace('°C', 'degrees Celsius').replace('15–15', 'fifteen fifteen').replace('AED', 'A E D')
    samples, rate = model.create(spoken, voice='af_heart', speed=0.95, lang='en-us')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
        sf.write(wav.name, samples, rate)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav.name, '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-codec:a', 'libmp3lame', '-b:a', '64k', str(output)], check=True)
    print(f'{i+1}/{len(clips)} {output.name}', flush=True)
(root / 'design/voice/manifest.json').write_text(json.dumps({'model': 'Kokoro-82M v1.0', 'voice': 'af_heart', 'speed': 0.95, 'clips': clips}, indent=2) + '\n')
