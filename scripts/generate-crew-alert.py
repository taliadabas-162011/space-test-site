"""Build the original repeating alarm asset using only the Python standard library.

Eight alternating dual-tone calls, then a brief breathing interval. Envelopes avoid
clicks; the file is peak-normalized below clipping. No external alarm is sampled.
"""
from pathlib import Path
import math
import struct
import wave

RATE = 44100
LENGTH = 3.2
PULSES = [(i * .31, .27, *( (900, 1200) if i % 2 == 0 else (650, 850) )) for i in range(8)]
values = []
for i in range(round(RATE * LENGTH)):
    t = i / RATE
    value = 0.0
    for begin, duration, low, high in PULSES:
        local = t - begin
        if 0 <= local < duration:
            fade = min(1.0, local / .018, (duration - local) / .045)
            # Add quiet harmonics for recognition on small laptop speakers.
            a = math.sin(2 * math.pi * low * local) + .12 * math.sin(2 * math.pi * 2 * low * local)
            b = math.sin(2 * math.pi * high * local) + .12 * math.sin(2 * math.pi * 2 * high * local)
            value += fade * (a + b)
    values.append(value)
peak = max(map(abs, values))
path = Path(__file__).resolve().parents[1] / 'design/assets/audio/crew-alert.wav'
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(b''.join(struct.pack('<h', round(value / peak * .62 * 32767)) for value in values))
print(f'{path}: {LENGTH}s, {RATE} Hz, mono PCM, peak 0.62')
