"""DoodleCrashoutGf ("which crashout is your girlfriend?"): set B, reuses the HungryBf people cast sheet.

usage: python gen_crashout.py [k ...]   # scenes edited from hungry/sheet.png, whitened a>=243 -> 255
Outputs: carousel-vid/public/reels/doodle/crashout/
"""
import base64, os, sys
from concurrent.futures import ThreadPoolExecutor
from oa import client, DOODLE, QUALITY
from gen_hungry import STYLE, CAST, MODEL, cost, whiten

SHEET = DOODLE / "hungry" / "sheet.png"
OUT = DOODLE / "crashout"; (OUT / "raw").mkdir(parents=True, exist_ok=True)
SUFFIX = os.environ.get("SUFFIX", "")

SCENES = {
    "hook": "The girlfriend is crashing out: fists clenched, face red, eyes huge, mouth a wide open yell, "
            "two puffs of steam shooting from her ears and a small black scribble lightning bolt above her head. "
            "The boyfriend peeks out from behind a light-blue couch, only his head and hands visible, sweat drops flying.",
    "1": "The girlfriend sits typing furiously on her phone with both thumbs, angry focused face, a very long "
         "white paper scroll of tiny grey scribble lines spilling out of the phone and piling on the ground. "
         "The boyfriend stands beside her holding his own phone, reading, eyes huge and shocked, sweat drop.",
    "2": "The girlfriend holds up an extremely long white paper receipt that unrolls down to the ground, "
         "pointing at one line on it with a smug narrow-eyed look. The boyfriend next to her is shrinking, "
         "tiny and nervous, scratching his head, sweat drops.",
    "3": "Night scene: a simple bed with a light-blue blanket. The boyfriend is asleep on his side with a "
         "peaceful face and a small 'z' scribble. The girlfriend lies next to him on her back, wide awake, eyes "
         "huge and staring at nothing, furious tight mouth, a small dark scribble cloud over her head.",
    "4": "The girlfriend stands at an open white fridge that is completely empty inside, glaring with a dark "
         "scribble cloud over her head. The boyfriend timidly holds out one single small cracker toward her with "
         "a nervous smile and sweat drops.",
}


def gen_scene(c, key):
    p = (f"{STYLE}\n\nUse the attached character reference sheet: redraw these exact two characters with the same "
         f"hair, skin tone, outfits and proportions. {CAST}\n\nScene: {SCENES[key]}\n"
         "Square composition, characters fill about 70% of the width, white background all around.")
    with open(SHEET, "rb") as f:
        r = c.images.edit(model=MODEL, image=[f], prompt=p, size="1024x1024", quality=QUALITY)
    print(key, QUALITY, cost(getattr(r, "usage", None)), flush=True)
    b = base64.b64decode(r.data[0].b64_json)
    (OUT / "raw" / f"{key}{SUFFIX}.png").write_bytes(b)
    whiten(b).save(OUT / f"{key}{SUFFIX}.png")
    print("wrote", key, flush=True)


if __name__ == "__main__":
    c = client()
    keys = sys.argv[1:] or list(SCENES)
    with ThreadPoolExecutor(5) as ex:
        list(ex.map(lambda k: gen_scene(c, k), keys))
