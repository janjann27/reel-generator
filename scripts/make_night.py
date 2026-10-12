"""night_120.wav: 4.0s seamless dark late-night loop for the morecouplesss text reels (ViralGame).

120 BPM, F# minor, F#m9 | Dmaj7 (one bar each). A bar = 2s = 60 frames, so the
2-bar loop is exactly one question (120 frames) and a reel of any length loops clean.
Pulsing sidechained saw bass + dark pad + filtered pluck arp, soft four-on-the-floor,
claps on 2 and 4, offbeat open hats. No Rhodes, no lo-fi crackle (both rejected).

Own file and own rng, so it never touches the committed beds that make_audio.py
regenerates with drift. Run: python scripts/make_night.py
"""
import numpy as np

from make_audio import SR, highpass, lowpass, midi, place, saw_pad, t_axis, write

rng = np.random.default_rng(120)
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT


def kick():
    t = t_axis(0.4)
    f = 42 + 90 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = highpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.15
    return np.tanh((body + click) * 1.6) / np.tanh(1.6)


def clap():
    t = t_axis(0.35)
    x = np.zeros(len(t))
    for d in (0, 0.009, 0.019, 0.03):
        x += highpass(rng.standard_normal(len(t)), 1000) * np.exp(-np.maximum(t - d, 0) * 40) * (t >= d)
    tail = highpass(rng.standard_normal(len(t)), 1500) * np.exp(-t * 9) * 0.25  # room
    return lowpass(x + tail, 8000) * 0.45


def open_hat():
    t = t_axis(0.22)
    return highpass(rng.standard_normal(len(t)), 8000) * np.exp(-t * 22)


def closed_hat():
    t = t_axis(0.05)
    return highpass(rng.standard_normal(len(t)), 9000) * np.exp(-t * 110)


def saw_bass(freq, dur):
    t = t_axis(dur)
    x = sum(np.sin(2 * np.pi * freq * h * t) / h for h in range(1, 10))
    env = np.minimum(t / 0.004, 1) * np.exp(-t * 6)
    return lowpass(x * env, 380)


def pluck(freq, dur=0.5):
    """Dark bell pluck: square-ish tone, fast filter close."""
    t = t_axis(dur)
    x = sum(np.sin(2 * np.pi * freq * h * t) / h for h in (1, 3, 5, 7))
    x += 0.3 * np.sin(2 * np.pi * freq * 2.01 * t)
    return lowpass(x * np.minimum(t / 0.002, 1) * np.exp(-t * 9), 2600)


def night(bars=2):
    L = int(bars * BAR * SR)
    pad, bass, arp, drums = (np.zeros(2 * L) for _ in range(4))
    chords = [
        (42, [54, 57, 61, 64, 68]),  # F#m9
        (38, [50, 54, 57, 61]),  # Dmaj7
    ]
    arps = [[66, 69, 73, 76, 73, 69, 68, 69], [62, 66, 69, 73, 69, 66, 64, 66]]
    for k, (root, notes) in enumerate(chords):
        s = k * BAR
        for m in notes:
            place(pad, saw_pad(midi(m), BAR + 0.4) * 0.05, s)
        for i in range(16):  # 16th-note pulse bass, octave jump on the offbeat 16th
            place(bass, saw_bass(midi(root - 12 + (12 if i % 4 == 2 else 0)), BEAT / 4) * 0.5, s + i * BEAT / 4)
        for i, m in enumerate(arps[k]):  # 8th-note arp + a quieter dotted-8th echo
            place(arp, pluck(midi(m)) * 0.16, s + i * BEAT / 2)
            place(arp, pluck(midi(m)) * 0.06, s + i * BEAT / 2 + 0.75 * BEAT)
        for b in range(4):
            beat = s + b * BEAT
            place(drums, kick() * 0.9, beat)
            if b in (1, 3):
                place(drums, clap(), beat)
            place(drums, open_hat() * 0.09, beat + BEAT / 2)
            for e in (0.25, 0.75):
                place(drums, closed_hat() * 0.05, beat + e * BEAT)

    # Sidechain: pad, bass and arp duck under every kick and swell back by the offbeat.
    t = np.arange(2 * L) / SR
    phase = (t % BEAT) / BEAT
    duck = 0.25 + 0.75 * np.clip(phase / 0.45, 0, 1) ** 1.5
    mix = lowpass(pad, 1300) * duck + bass * duck * 0.7 + arp * (0.5 + 0.5 * duck) + drums
    mix = mix[:L] + mix[L:]  # fold the tail onto the start: seamless loop
    mix = np.tanh(mix * 1.25) / np.tanh(1.25)
    left = mix + 0.35 * np.roll(lowpass(arp[:L] + arp[L:], 3000), int(0.011 * SR))
    right = np.roll(mix, int(0.005 * SR))
    stereo = np.stack([left, right], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.8


if __name__ == "__main__":
    write("night_120.wav", night())
