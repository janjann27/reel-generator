"""Synthesize the reels' audio from scratch: no samples, no licensing questions.

Writes to public/reels/audio/:
  lofi_75.wav  16s lo-fi loop, 75 BPM (a beat = 0.8s = 24 frames at 30fps, so
               PauseDare's 12-frame slot step lands on every eighth note)
  tick.wav     short woody click for each slot step
  bouncy_120.wav  8s comedic loop, 120 BPM (a bar = 2s = 60 frames, so the
               meme punchline at frame 60 lands on a downbeat)
  boom.wav     low "vine boom" hit for reaction cuts
  scratch.wav  record scratch for deadpan punchlines
  ching.wav    cash-register ding for money jokes
  slowjam_75.wav  9.6s seamless R&B/trap loop, 75 BPM, A minor (OweYou)
  tea_100.wav  9.6s seamless sneaky pizzicato loop, 100 BPM, D minor ("spill the tea" bed for
               ExQuiz: drama/gossip, not romance; plucks + walking bass + snaps)
  funk_108.wav  8.9s seamless flirty funk loop, 108 BPM, E minor (flamingoappreels PickOne:
               clav stabs + slap-ish bass + claps; brighter and bouncier than tea_100)
  swish.wav    highlighter swipe (PickOne options)
  pop.wav      soft message "pop" for chat bubbles (ExQuiz)
  dream_75.wav  12.8s seamless ambient loop, 75 BPM, D major (flamingoconvos voiceover quizzes;
               sits under a voice, so no drums in the vocal range and no melody)

Run: python scripts/make_audio.py
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 75
BEAT = 60 / BPM
LENGTH = 16.0
OUT = Path(__file__).resolve().parent.parent / "public" / "reels" / "audio"
rng = np.random.default_rng(7)  # fixed seed: same file every run


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def highpass(x, hz, order=4):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def place(buf, clip, at):
    i = int(at * SR)
    n = min(len(clip), len(buf) - i)
    if n > 0:
        buf[i:i + n] += clip[:n]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def epiano(freq, dur):
    """Soft electric-piano-ish note: a few harmonics, slow-ish decay, slight detune."""
    t = t_axis(dur)
    env = np.minimum(t / 0.012, 1) * np.exp(-t * 1.6)
    tone = sum(a * np.sin(2 * np.pi * freq * h * t * (1 + d))
               for h, a, d in ((1, 1.0, 0), (2, 0.35, 0.0007), (3, 0.12, -0.0005), (4, 0.05, 0)))
    trem = 1 + 0.06 * np.sin(2 * np.pi * 4.2 * t)
    return tone * env * trem


def kick():
    t = t_axis(0.35)
    f = 45 + 75 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def snare():
    t = t_axis(0.22)
    noise = highpass(rng.standard_normal(len(t)), 1200) * np.exp(-t * 22)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    return lowpass(0.55 * noise + 0.4 * body, 6000)


def hat():
    t = t_axis(0.05)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * 90)


def music():
    n = int(LENGTH * SR)
    keys, bass, drums = np.zeros(n), np.zeros(n), np.zeros(n)
    bar = 4 * BEAT
    # Fmaj7 · Em7 · Dm7 · Cmaj7, voiced mid-register, one bar each.
    chords = [(65, [53, 57, 60, 64]), (64, [52, 55, 59, 62]), (62, [50, 53, 57, 60]), (60, [48, 52, 55, 59])]
    k = 0
    while k * bar < LENGTH:
        root, notes = chords[k % 4]
        start = k * bar
        for j, m in enumerate(notes):  # slight strum
            place(keys, epiano(midi(m + 12), bar + 0.4) * 0.16, start + j * 0.018)
        place(keys, epiano(midi(notes[-1] + 24), 1.2) * 0.06, start + 2.5 * BEAT)  # small top-note answer
        bt = t_axis(bar)
        place(bass, np.sin(2 * np.pi * midi(root - 24) * bt) * np.minimum(bt / 0.02, 1) * np.exp(-bt * 0.9) * 0.32, start)
        for b in range(4):
            beat = start + b * BEAT
            if b in (0, 2):
                place(drums, kick() * 0.5, beat)
            if b in (1, 3):
                place(drums, snare() * 0.22, beat + 0.012)  # lazy, behind the beat
            for e in (0, 0.5):
                place(drums, hat() * (0.07 if e else 0.05), beat + e * BEAT + (0.02 if e else 0))
        k += 1
    mix = lowpass(keys, 3800) + bass + drums
    crackle = np.zeros(n)
    for i in rng.choice(n, size=int(LENGTH * 9), replace=False):
        crackle[i] = rng.uniform(-1, 1)
    mix += lowpass(crackle, 5000) * 0.25 + lowpass(rng.standard_normal(n), 900) * 0.004
    mix = np.tanh(mix * 1.4) / np.tanh(1.4)  # tape-ish saturation
    fade = np.ones(n)
    fi, fo = int(0.3 * SR), int(0.6 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    mix *= fade
    left = mix
    right = np.concatenate([np.zeros(int(0.004 * SR)), mix[: n - int(0.004 * SR)]])  # tiny Haas width
    stereo = np.stack([left, right], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.8


def tick():
    t = t_axis(0.06)
    click = np.sin(2 * np.pi * 1750 * t) * np.exp(-t * 140)
    knock = np.sin(2 * np.pi * 620 * t) * np.exp(-t * 70) * 0.6
    noise = highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 400) * 0.3
    x = click + knock + noise
    return x / np.max(np.abs(x)) * 0.7


def marimba(freq, dur=0.5):
    """Mallet pluck: fundamental plus marimba's ~3.9x and ~10x partials, fast decay."""
    t = t_axis(dur)
    env = np.minimum(t / 0.003, 1)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 9)
         + 0.35 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t * 28)
         + 0.08 * np.sin(2 * np.pi * freq * 9.9 * t) * np.exp(-t * 60))
    return x * env


def pluck_bass(freq, dur=0.3):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return lowpass(x * np.minimum(t / 0.004, 1) * np.exp(-t * 11), 900)


def clap():
    t = t_axis(0.18)
    x = np.zeros(len(t))
    for d in (0, 0.008, 0.017):  # three quick bursts = hand clap
        burst = highpass(rng.standard_normal(len(t)), 900) * np.exp(-np.maximum(t - d, 0) * 45) * (t >= d)
        x += burst
    return lowpass(x, 7000) * 0.5


def bouncy(bpm=120, length=8.0):
    """Playful comedy-bed loop: C-major marimba hook, bouncing bass, claps on 2 and 4."""
    beat = 60 / bpm
    n = int(length * SR)
    mel, bass, drums = np.zeros(n), np.zeros(n), np.zeros(n)
    # Two-bar hook in eighths (None = rest), repeated. C major pentatonic, cheeky leaps.
    hook = [72, None, 76, 79, None, 76, 74, None, 72, 74, 76, None, 79, 81, 79, None]
    hook += [77, None, 76, 74, None, 72, 74, None, 76, None, 72, None, 67, None, 72, None]
    roots = [48, 53, 55, 48]  # C F G C, one bar each
    i = 0
    while i * beat / 2 < length:
        at = i * beat / 2
        note = hook[i % len(hook)]
        if note:
            place(mel, marimba(midi(note)) * 0.28, at)
        bar = int(at // (4 * beat))
        pos = i % 8
        root = roots[bar % 4]
        if pos in (0, 3, 4, 6):  # bouncy bass: root, octave hop
            place(bass, pluck_bass(midi(root - 12 + (12 if pos == 6 else 0))) * 0.45, at)
        if pos in (0, 4):
            place(drums, kick() * 0.45, at)
        if pos in (2, 6):
            place(drums, clap() * 0.5, at)
        place(drums, hat() * (0.05 if pos % 2 else 0.035), at)
        i += 1
    mix = mel + bass + drums
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    fo = int(0.3 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)
    stereo = np.stack([mix, np.concatenate([np.zeros(int(0.003 * SR)), mix[: n - int(0.003 * SR)]])], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.8


def boom():
    """Deep hit that drops in pitch and rings, the meme 'boom' shape (original synthesis)."""
    t = t_axis(1.6)
    f = 42 + 60 * np.exp(-t * 14)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    thump = lowpass(rng.standard_normal(len(t)), 300) * np.exp(-t * 40) * 0.6
    x = np.tanh((body + thump) * 3.0)  # heavy saturation gives the boom its grit
    x = lowpass(x, 1800) * np.minimum(t / 0.002, 1)
    return x / np.max(np.abs(x)) * 0.95


def scratch():
    """Record scratch: band-passed noise swept up, back down, and up again."""
    dur = 0.42
    t = t_axis(dur)
    noise = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    seg = len(t) // 3
    for k, (lo, hi) in enumerate(((600, 3200), (3200, 900), (900, 4200))):
        a, b = k * seg, (k + 1) * seg if k < 2 else len(t)
        centers = np.linspace(lo, hi, 8)
        chunk = np.zeros(b - a)
        step = (b - a) // len(centers)
        for j, c in enumerate(centers):  # piecewise band-pass approximates the sweep
            s0, s1 = a + j * step, a + (j + 1) * step if j < len(centers) - 1 else b
            band = sosfilt(butter(2, [c * 0.7, c * 1.3], "band", fs=SR, output="sos"), noise[s0:s1])
            chunk[s0 - a:s1 - a] = band
        env = np.sin(np.linspace(0, np.pi, b - a)) ** 0.5
        out[a:b] = chunk * env
    return out / np.max(np.abs(out)) * 0.8


def ching():
    """Cash-register ding: two bright bell tones plus a small drawer rattle."""
    t = t_axis(1.0)
    bell = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d)
               for f, a, d in ((2093, 1.0, 5), (2637, 0.6, 6), (5274, 0.25, 12), (4186, 0.3, 9)))
    rattle = highpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 35) * 0.3
    x = np.zeros(len(t))
    place(x, rattle, 0)
    place(x, bell * 0.8, 0.06)
    return x / np.max(np.abs(x)) * 0.8


def saw_pad(freq, dur):
    """Warm pad: two detuned band-limited saws, slow swell, gentle release."""
    t = t_axis(dur)
    x = np.zeros(len(t))
    for det in (-0.004, 0.004):
        for h in range(1, 13):
            x += np.sin(2 * np.pi * freq * (1 + det) * h * t) / h
    env = np.minimum(t / 0.35, 1) * np.minimum((dur - t) / 0.3, 1).clip(0, 1)
    return x * env


def sub808(freq, dur, glide_to=None):
    """808 sub: sine with a short pitch punch, long tail, soft-clipped for grit.
    `glide_to` slides the pitch in the last third (the classic 808 slide)."""
    t = t_axis(dur)
    f = freq * (1 + 0.9 * np.exp(-t * 60))
    if glide_to:
        k = np.clip((t - dur * 0.66) / (dur * 0.2), 0, 1)
        f = f * (glide_to / freq) ** k
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.003, 1) * np.exp(-t * 1.4)
    x *= np.minimum((dur - t) / 0.03, 1).clip(0, 1)
    return np.tanh(x * 2.2) / np.tanh(2.2)


def snap():
    t = t_axis(0.15)
    noise = highpass(rng.standard_normal(len(t)), 1800) * np.exp(-t * 38)
    click = np.sin(2 * np.pi * 1450 * t) * np.exp(-t * 90) * 0.5
    return lowpass(noise + click, 9000) * 0.6


def slow_jam(bars=3):
    """Late-night R&B / trap slow jam in A minor, 75 BPM, no fades.

    Am9 | Fmaj9 | E7#9, which resolves straight back into Am9, so the file loops
    seamlessly: everything is rendered into a double-length buffer and the tail
    is folded back onto the start (reverb-ish decays wrap instead of cutting).
    3 bars = 9.6s = 288 frames = OweYou's length.
    """
    bar = 4 * BEAT
    L = int(bars * bar * SR)
    pad, keys, bass, drums = (np.zeros(2 * L) for _ in range(4))
    chords = [
        (45, [57, 60, 64, 67, 71]),  # Am9
        (41, [53, 57, 60, 64, 67]),  # Fmaj9
        (40, [52, 56, 62, 67]),  # E7#9 (G natural = the #9)
    ]
    for k, (root, notes) in enumerate(chords):
        s = k * bar
        for m in notes:
            place(pad, saw_pad(midi(m), bar + 0.3) * 0.05, s)
        # Rhodes stabs: beat 1 and the "and" of 2, slightly strummed.
        for at, vel in ((0, 0.13), (1.5 * BEAT, 0.09)):
            for j, m in enumerate(notes):
                place(keys, epiano(midi(m + 12), 1.1) * vel, s + at + j * 0.012)
        # 808 pattern: 1, and-of-2, a pickup on the "a" of 4; last bar slides up to A.
        nxt = midi(chords[(k + 1) % 3][0] - 12)
        place(bass, sub808(midi(root - 12), 1.5 * BEAT) * 0.55, s)
        place(bass, sub808(midi(root - 12), 2.25 * BEAT) * 0.45, s + 1.5 * BEAT)
        place(bass, sub808(midi(root - 12), 0.25 * BEAT, glide_to=nxt if k == 2 else None) * 0.4, s + 3.75 * BEAT)
        for b in range(4):
            beat = s + b * BEAT
            if b in (1, 3):
                place(drums, snap() * 0.5, beat)
            # 16th hats, then a 32nd-note roll into the next bar on beat 4.
            steps = [i / 4 for i in range(4)] if b < 3 or k == 1 else [0, 0.25] + [0.5 + i / 8 for i in range(4)]
            for i, e in enumerate(steps):
                place(drums, hat() * (0.08 if e in (0, 0.5) else 0.05 + 0.01 * (i % 2)), beat + e * BEAT)
    mix = lowpass(pad, 1600) + lowpass(keys, 4200) * 1.4 + lowpass(bass, 220) * 0.45 + drums * 2.2
    mix = mix[:L] + mix[L:]  # fold the tail onto the start: seamless loop
    mix = np.tanh(mix * 1.3) / np.tanh(1.3)
    right = np.roll(mix, int(0.004 * SR))  # tiny Haas width; roll keeps it seamless
    stereo = np.stack([mix, right], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.8


def dream(bars=4):
    """Airy late-night bed for voiceover quizzes: Dmaj9 | Bm11 | Gmaj9 | A6sus.

    Wide detuned pads, a slow Rhodes arpeggio in the upper register (above the
    voice), a soft sub and only a quiet shaker, so the words sit on top. Same
    fold-the-tail trick as slow_jam, so it loops seamlessly.
    """
    bar = 4 * BEAT
    L = int(bars * bar * SR)
    pad, keys, bass, shaker = (np.zeros(2 * L) for _ in range(4))
    chords = [
        (38, [62, 66, 69, 73, 76]),  # Dmaj9
        (35, [62, 66, 69, 71, 76]),  # Bm11
        (31, [62, 66, 67, 71, 74]),  # Gmaj9
        (33, [61, 64, 66, 69, 71]),  # A6sus-ish, leans back into D
    ]
    for k, (root, notes) in enumerate(chords):
        s = k * bar
        for m in notes[:4]:
            place(pad, saw_pad(midi(m), bar + 0.6) * 0.045, s)
            place(pad, saw_pad(midi(m) * 1.004, bar + 0.6) * 0.03, s)
        # Eighth-note arpeggio an octave up, very soft, like a music box through felt.
        arp = [notes[i] + 12 for i in (0, 2, 4, 3, 1, 3, 4, 2)]
        for i, m in enumerate(arp):
            place(keys, epiano(midi(m), 1.4) * (0.07 if i % 2 == 0 else 0.05), s + i * BEAT / 2)
        place(bass, sub808(midi(root), 2 * BEAT) * 0.35, s)
        place(bass, sub808(midi(root), 1.8 * BEAT) * 0.25, s + 2.5 * BEAT)
        for b in range(8):
            place(shaker, hat() * (0.035 if b % 2 else 0.02), s + b * BEAT / 2 + BEAT / 4)
    mix = lowpass(pad, 2200) + lowpass(keys, 5200) * 1.2 + lowpass(bass, 160) * 0.5 + shaker * 1.5
    mix = mix[:L] + mix[L:]
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    right = np.roll(mix, int(0.007 * SR))
    stereo = np.stack([mix, right], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.75


def pop():
    """Soft bubble pop: a quick downward sine chirp with a tiny click, like a message landing."""
    t = t_axis(0.12)
    f = 900 * np.exp(-t * 18) + 380
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 38) + 0.15 * np.sin(2 * ph) * np.exp(-t * 60)
    return lowpass(x, 5000) * 0.7


def pizz(freq, dur=0.22):
    """Pizzicato-ish pluck: bright attack, fast decay, a little body resonance."""
    t = t_axis(dur)
    env = np.minimum(t / 0.003, 1) * np.exp(-t * 22)
    x = sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in ((1, 1.0), (2, 0.5), (3, 0.25), (4, 0.12)))
    return lowpass(x * env, 4200)


def tea(bpm=100, bars=4):
    """Sneaky "spill the tea" loop: Dm | Dm | Bb | A7, staccato everything, finger snaps on 2 and 4.

    The motif tiptoes up the D minor triad and leans on the G# (the sneaky chromatic
    step), the bass walks in quarter notes, and bar 4's A7 turns back to Dm, so with
    the usual tail fold it loops seamlessly.
    """
    beat = 60 / bpm
    bar = 4 * beat
    L = int(bars * bar * SR)
    lead, bass, perc = (np.zeros(2 * L) for _ in range(3))
    # Eighth-note motif per bar (MIDI; None = rest).
    motif = [
        [62, None, 65, None, 69, 68, 69, None],
        [62, None, 65, None, 69, None, 72, 69],
        [70, None, 65, None, 62, None, 65, 70],
        [69, None, 68, None, 67, None, 66, 64],
    ]
    walk = [[38, 45, 38, 45], [38, 45, 41, 40], [34, 41, 34, 41], [33, 40, 37, 40]]
    for k in range(bars):
        s = k * bar
        for i, m in enumerate(motif[k]):
            if m is not None:
                place(lead, pizz(midi(m)) * (0.5 if i % 2 == 0 else 0.38), s + i * beat / 2)
        for i, m in enumerate(walk[k]):
            place(bass, pluck_bass(midi(m), 0.22) * 0.6, s + i * beat)
        for b in range(4):
            if b in (1, 3):
                place(perc, snap() * 0.7, s + b * beat)
            if b in (0, 2):
                place(perc, kick() * 0.35, s + b * beat)
            place(perc, hat() * 0.03, s + b * beat + beat / 2)
    mix = lead * 1.0 + lowpass(bass, 900) * 0.9 + perc
    mix = mix[:L] + mix[L:]
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    right = np.roll(mix, int(0.005 * SR))
    stereo = np.stack([mix, right], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.75


def clav(freq, dur=0.14):
    """Clavinet-ish stab: a bright pulse wave, very short, with a quick filter-like decay."""
    t = t_axis(dur)
    x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.6 + np.sin(2 * np.pi * freq * 2 * t) * 0.3
    return lowpass(x * np.minimum(t / 0.002, 1) * np.exp(-t * 30), 3200)


def funk(bpm=108, bars=4):
    """Flirty funk vamp: Em9 | Em9 | A13 | A13 (the one-chord-plus-a-lift funk move).

    Sixteenth clav stabs on the offbeats, a syncopated octave bass, claps on 2 and 4,
    busy hats. Same tail fold as the other loops, so it repeats seamlessly.
    """
    beat = 60 / bpm
    bar = 4 * beat
    L = int(bars * bar * SR)
    keys, bass, perc = (np.zeros(2 * L) for _ in range(3))
    chords = [(40, [64, 67, 71, 74, 78]), (40, [64, 67, 71, 74, 78]), (45, [61, 64, 67, 71, 78]), (45, [61, 64, 67, 71, 78])]
    stabs = [0.5, 1.5, 1.75, 2.5, 3.5]  # beats within the bar
    bass_line = [(0, 0), (0.75, 12), (1.5, 0), (2.0, 7), (2.75, 12), (3.5, 10)]  # (beat, semitones over root)
    for k, (root, notes) in enumerate(chords):
        s = k * bar
        for b in stabs:
            for j, m in enumerate(notes[1:4]):
                place(keys, clav(midi(m)) * 0.11, s + b * beat + j * 0.004)
        for b, iv in bass_line:
            place(bass, pluck_bass(midi(root + iv - 12), 0.2) * 0.7, s + b * beat)
        for b in range(4):
            place(perc, kick() * 0.45, s + b * beat) if b in (0, 2) else place(perc, clap() * 0.35, s + b * beat)
            for e in range(4):
                place(perc, hat() * (0.05 if e % 2 else 0.035), s + (b + e / 4) * beat)
    mix = keys + lowpass(bass, 700) * 0.9 + perc
    mix = mix[:L] + mix[L:]
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    right = np.roll(mix, int(0.006 * SR))
    stereo = np.stack([mix, right], axis=1)
    return stereo / np.max(np.abs(stereo)) * 0.75


def swish():
    """Highlighter swipe: a short band of filtered noise that rises and falls."""
    t = t_axis(0.26)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * np.clip(t / 0.26, 0, 1)) ** 2
    return lowpass(highpass(n, 1800), 6000) * env * 0.35


def write(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    wavfile.write(OUT / name, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    rms = float(np.sqrt(np.mean(np.square(x))))
    print(f"{name}: {len(x) / SR:.2f}s peak={np.max(np.abs(x)):.2f} rms={rms:.3f}")


if __name__ == "__main__":
    write("lofi_75.wav", music())
    write("tick.wav", tick())
    write("bouncy_120.wav", bouncy())
    write("boom.wav", boom())
    write("scratch.wav", scratch())
    write("ching.wav", ching())
    write("slowjam_75.wav", slow_jam())  # the shared rng: new files go after this line
    write("dream_75.wav", dream())
    write("pop.wav", pop())
    write("tea_100.wav", tea())
    write("funk_108.wav", funk())
    write("swish.wav", swish())
