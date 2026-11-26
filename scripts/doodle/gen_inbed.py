"""DoodleInBedGf ("has your girlfriend ever done this in bed?"): sleep-habit items, reuses the HungryBf people cast sheet.

usage: python gen_inbed.py [k ...]   # scenes edited from hungry/sheet.png, whitened a>=243 -> 255
Outputs: carousel-vid/public/reels/doodle/inbed/
"""
import base64, os, sys
from concurrent.futures import ThreadPoolExecutor
from oa import client, DOODLE, QUALITY
from gen_hungry import STYLE, CAST, MODEL, cost, whiten

SHEET = DOODLE / "hungry" / "sheet.png"
OUT = DOODLE / "inbed"; (OUT / "raw").mkdir(parents=True, exist_ok=True)
SUFFIX = os.environ.get("SUFFIX", "")

PJ = ("In these scenes both wear simple pajamas instead of their usual outfits: the girlfriend in a mustard-yellow "
      "pajama top and white pajama pants, the boyfriend in a navy-blue t-shirt and grey sweatpants. Same hair, faces "
      "and skin tones as the sheet. A simple bed with white pillows and a light-blue blanket, seen at a slight "
      "top-down angle; no headboard details, no room.")

SCENES = {
    "hook": "Both sit up in bed under the blanket. The girlfriend has a sneaky mischievous grin, eyes narrowed, "
            "hands rubbing together. The boyfriend next to her looks at her suspiciously, one eyebrow raised, sweat drop.",
    "1": "The girlfriend sleeps spread out like a starfish diagonally across the whole bed, peaceful smile, arms and "
         "legs wide, taking almost all the space. The boyfriend clings to the very edge of the mattress, half falling "
         "off, eyes wide, sweat drops.",
    "2": "The girlfriend lies in bed with a sly grin, pressing her bare feet against the boyfriend's legs; her feet "
         "are pale icy blue with tiny frost marks and a few cold squiggle lines. The boyfriend jolts upright, eyes "
         "huge, mouth open in a yell, hair standing up.",
    "3": "Dark night mood shown only by a small crescent moon doodle above them. The girlfriend lies on her side "
         "wide awake, huge round eyes, poking the boyfriend's cheek with one finger. The boyfriend is half asleep, "
         "one eye barely open, exhausted face, small 'z' scribbles fading.",
    "4": "In bed, the boyfriend still has his arms out in a cuddle pose with a happy face and small hearts, while the "
         "girlfriend, sweaty and annoyed with a hot red face and wavy heat lines, pushes him away with her foot "
         "against his chest.",
}


def gen_scene(c, key):
    p = (f"{STYLE}\n\nUse the attached character reference sheet: redraw these exact two characters with the same "
         f"hair, skin tone and proportions. {CAST}\n{PJ}\n\nScene: {SCENES[key]}\n"
         "Wholesome and funny, fully clothed, not romantic or suggestive. "
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
