"""
Generate a short, pleasant Islamic-style notification tone for Adhan alerts.
This creates a 3-second WAV file with ascending/descending notes resembling
a gentle call-to-prayer bell chime.
"""
import struct, math, wave, os

sample_rate = 44100

# Ascending then descending notes — evokes a call to prayer chime
# Frequencies: A4(440), E5(659), A5(880), E5(659), A4(440)
note_freqs = [440, 554, 659, 880, 659, 554, 440]
note_dur = 0.35   # seconds per note
gap_dur = 0.04    # silence between notes

final_samples: list[int] = []

for freq in note_freqs:
    n = int(sample_rate * note_dur)
    for i in range(n):
        t = i / sample_rate
        # Smooth fade-in (50ms) and fade-out (80ms) envelope
        fade_in = min(t / 0.05, 1.0)
        fade_out = min((note_dur - t) / 0.08, 1.0)
        envelope = fade_in * fade_out
        # Blend fundamental + 2nd harmonic for a bell-like timbre
        val = int(32767 * 0.65 * envelope * (
            0.7 * math.sin(2 * math.pi * freq * t) +
            0.3 * math.sin(2 * math.pi * freq * 2 * t)
        ))
        final_samples.append(max(-32767, min(32767, val)))
    # Short silence gap
    final_samples.extend([0] * int(sample_rate * gap_dur))

os.makedirs("/home/ubuntu/noor-muslim-app/assets/sounds", exist_ok=True)
out_path = "/home/ubuntu/noor-muslim-app/assets/sounds/adhan_notification.wav"

with wave.open(out_path, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    data = struct.pack(f"<{len(final_samples)}h", *final_samples)
    wf.writeframes(data)

size = os.path.getsize(out_path)
print(f"Generated: {out_path} ({size} bytes, {size/1024:.1f} KB)")

# Also generate a shorter reminder chime (2 notes)
reminder_samples: list[int] = []
for freq in [659, 880]:
    n = int(sample_rate * 0.3)
    for i in range(n):
        t = i / sample_rate
        fade_in = min(t / 0.04, 1.0)
        fade_out = min((0.3 - t) / 0.06, 1.0)
        envelope = fade_in * fade_out
        val = int(32767 * 0.55 * envelope * math.sin(2 * math.pi * freq * t))
        reminder_samples.append(max(-32767, min(32767, val)))
    reminder_samples.extend([0] * int(sample_rate * 0.05))

reminder_path = "/home/ubuntu/noor-muslim-app/assets/sounds/prayer_reminder.wav"
with wave.open(reminder_path, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    data = struct.pack(f"<{len(reminder_samples)}h", *reminder_samples)
    wf.writeframes(data)

size2 = os.path.getsize(reminder_path)
print(f"Generated: {reminder_path} ({size2} bytes, {size2/1024:.1f} KB)")
