"""Scenes for DoodleCryBf ("which boyfriend is yours when you cry?"), same cat couple as DoodleJealousBf.

Reference = the cats sheet CROPPED to the couple (no raccoon; a full sheet draws the whole cast into
every scene). gpt-image-2 images.edit, 1024², high. Whitening a>=243 -> 255 in PIL.
usage: python gen.py [key ...]
"""
import base64, io, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
from PIL import Image
from oa import client, DOODLE, QUALITY

MODEL = "gpt-image-2"
SRC = Path(r"D:\Honest\carousel-vid\public\reels\doodle\cats\sheet.png")
OUT = Path(r"D:\Honest\carousel-vid\public\reels\doodle\cry"); (OUT / "raw").mkdir(parents=True, exist_ok=True)
REF = OUT / "raw" / "pair_ref.png"

STYLE = (
    "Cute hand-drawn webcomic doodle style. Thick, slightly wobbly black ink outlines, "
    "flat pastel fills with no gradients and no texture, simple shading only, big round "
    "white eyes with small black pupils, exaggerated cartoon expressions, tears, sweat drops and "
    "motion lines drawn as simple strokes. Pure flat white background (#FFFFFF), no floor, "
    "no scenery, no frame, no text, no letters, no speech bubbles, no watermark. "
    "Characters centered with generous white margin around them, like a sticker."
)
CAST = (
    "ONLY these two characters, nobody else: "
    "GIRLFRIEND: a small cream-white cat with a peach-pink inner ear, a pink bow on one ear, "
    "wearing a lilac oversized t-shirt with a small red heart. "
    "BOYFRIEND: a slightly bigger chubby grey tabby cat with darker grey stripes, wearing a mint-green hoodie. "
    "Both walk upright on two legs like cartoon people."
)
SCENES = {
    "hook": "The cream cat girlfriend sits on the floor hugging her knees, crying big cartoon tears that "
            "stream down like two little waterfalls. The grey tabby boyfriend stands next to her frozen, "
            "eyes huge, fur puffed up, sweat drops flying, not knowing what to do.",
    "1": "The grey tabby boyfriend panics: running in a circle around the crying cream cat girlfriend, "
         "arms flailing, holding a tissue box in one paw and a phone in the other, motion lines and sweat "
         "drops everywhere. The girlfriend still crying, a little confused.",
    "2": "The grey tabby boyfriend silently kneels in front of the crying cream cat girlfriend and offers "
         "her a big pile of snacks in his arms: chips bag, chocolate bar, a boba tea, a cookie. Calm serious "
         "face. The girlfriend sniffles, tears slowing, eyes sparkling at the snacks.",
    "3": "The grey tabby boyfriend stands next to a small easel whiteboard covered in scribbled arrows and "
         "boxes (no readable letters), pointing at it with a stick like a teacher, very confident. The cream "
         "cat girlfriend next to him cries even harder, tears spraying.",
    "4": "The cream cat girlfriend and the grey tabby boyfriend sit side by side, and the boyfriend is crying "
         "even louder than her, mouth wide open wailing, giant tears. The girlfriend has stopped crying and "
         "pats his head with a flat unimpressed face, one sweat drop.",
}

def pair_ref():
    if not REF.exists():
        Image.open(SRC).crop((60, 120, 1035, 900)).save(REF)
    return REF

def whiten(b):
    a = np.array(Image.open(io.BytesIO(b)).convert("RGB")); a[(a >= 243).all(-1)] = 255
    return Image.fromarray(a)

def gen(c, key):
    prompt = (f"{STYLE}\n\nUse the attached character reference: redraw these exact two characters with the same "
              f"colors, outfits and proportions. {CAST}\n\nScene: {SCENES[key]}\n"
              "Square composition, characters fill about 70% of the width, white background all around.")
    with open(pair_ref(), "rb") as f:
        r = c.images.edit(model=MODEL, image=[f], prompt=prompt, size="1024x1024", quality=QUALITY)
    b = base64.b64decode(r.data[0].b64_json)
    (OUT / "raw" / f"{key}.png").write_bytes(b)
    whiten(b).save(OUT / f"{key}.png"); print("wrote", key, flush=True)

if __name__ == "__main__":
    c = client(); keys = sys.argv[1:] or list(SCENES)
    with ThreadPoolExecutor(5) as ex: list(ex.map(lambda k: gen(c, k), keys))
