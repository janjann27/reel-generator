"""DoodleHungryBf ("which boyfriend is yours when you're hungry?"): first PEOPLE cast for the doodle listicle.

usage: python gen.py sheet           # cast sheet (images.generate 1536x1024 high)
       python gen.py scenes [k ...]  # scenes edited from the sheet (1024² high), whitened a>=243 -> 255
Outputs: carousel-vid/public/reels/doodle/hungry/
"""
import base64, io, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
from PIL import Image
from oa import client, DOODLE, QUALITY

import os
MODEL = "gpt-image-2"
#  QUALITY from oa.py (env, default low): high ~$0.21/img, medium ~$0.053, low ~$0.006 (1024²)
SUFFIX = os.environ.get("SUFFIX", "")  # e.g. "_med" to write test files next to the real ones
# gpt-image-2 token prices (USD per 1M): text in 5, image in 8, image out 30
def cost(u):
    if u is None: return "usage n/a"
    d = getattr(u, "input_tokens_details", None)
    ti = getattr(d, "text_tokens", 0) if d else 0; ii = getattr(d, "image_tokens", 0) if d else 0
    return f"in {u.input_tokens} (text {ti}, img {ii}) out {u.output_tokens} = ${(ti*5 + ii*8 + u.output_tokens*30)/1e6:.4f}"
OUT = Path(r"D:\Honest\carousel-vid\public\reels\doodle\hungry"); (OUT / "raw").mkdir(parents=True, exist_ok=True)
SHEET = OUT / "sheet.png"

STYLE = (
    "Looks drawn quickly by a human webcomic artist with a thick black felt-tip marker, like a relatable couple "
    "comic strip posted on instagram. NOT polished, NOT vector-perfect, NOT AI-looking: line weight varies, lines "
    "wobble, a few lines overshoot or leave small gaps, slight asymmetry, flat color fills that are a little "
    "uneven and sometimes miss the outline by a hair. Keep detail LOW: few folds, few strands, no tiny ornaments. "
    "No sparkles, no glitter, no glossy highlights, no glow, no rim light, no gradients. Very simple faces: small black dot eyes, simple curved line mouth, light pink "
    "blush ovals on the cheeks; for strong emotions the eyes become huge white circles with tiny black pupils and "
    "the mouth a big open shape. Hair is drawn as solid flat shapes with only a few strand lines. Normal adult "
    "proportions with a slightly big head (NOT anime, NOT chibi, no shiny eyes, no eyelash detail). Flat muted "
    "colors with no gradients, no texture, minimal shading. Cartoon effects drawn simply: light-blue tear streams, "
    "sweat drops, motion lines. Simple props and furniture allowed (couch, table, food) drawn in the same flat style, "
    "but NO room, NO walls, NO floor line, pure flat white background (#FFFFFF). No text, no letters, no logos, "
    "no speech bubbles, no watermark. Centered with generous white margin, like a sticker."
)
CAST = (
    "ONLY these two original characters, nobody else: "
    "GIRLFRIEND: young woman, long dark-brown hair in a high ponytail with straight bangs, light skin, "
    "wearing a mustard-yellow cardigan over a plain white t-shirt, black leggings and white sneakers. "
    "BOYFRIEND: slightly taller young man, short black hair with a small cowlick, light-tan skin, "
    "wearing a plain navy-blue t-shirt, khaki pants and white sneakers."
)
SCENES = {
    "hook": "The girlfriend stands holding her stomach, eyes half-closed and grumpy, a small dark scribble "
            "storm cloud over her head and a rumble squiggle near her belly. The boyfriend next to her "
            "leans away nervously, sweat drops flying, hands up.",
    "1": "The boyfriend wears a white chef hat and apron, proudly presenting a small table with three simple "
         "dishes: a roast chicken, a pot of soup and a cake, a few steam lines. The girlfriend next to him holds one tiny cookie, "
         "staring at all the food with a sweat drop.",
    "2": "The boyfriend holds his phone and counts on his fingers with a thinking face, little question marks "
         "around him. The girlfriend lies face-down flat across a light-blue couch next to him, drained, a tiny ghost "
         "floating out of her.",
    "3": "The girlfriend holds a red carton of fries protectively, glaring. The boyfriend leans in with a sneaky "
         "grin, one hand already stealing fries, a fry in his mouth.",
    "4": "The boyfriend runs in carrying a stack of takeout bags and a drink, motion lines behind him, "
         "proud smile. The girlfriend opens her arms with a huge happy open-mouth smile, two small hearts.",
}

def whiten(b):
    a = np.array(Image.open(io.BytesIO(b)).convert("RGB")); a[(a >= 243).all(-1)] = 255
    return Image.fromarray(a)

def gen_sheet(c):
    p = (f"{STYLE}\n\nCharacter reference sheet for an original cartoon couple. {CAST}\n"
         "Show each character once in a neutral standing pose, full body, side by side, front view, same scale, "
         "friendly smile. Keep designs simple and iconic so they are easy to redraw.")
    r = c.images.generate(model=MODEL, prompt=p, size="1536x1024", quality=QUALITY); print("sheet", QUALITY, cost(getattr(r, "usage", None)), flush=True)
    whiten(base64.b64decode(r.data[0].b64_json)).save(SHEET); print("wrote sheet", flush=True)

def gen_scene(c, key):
    p = (f"{STYLE}\n\nUse the attached character reference sheet: redraw these exact two characters with the same "
         f"hair, skin tone, outfits and proportions. {CAST}\n\nScene: {SCENES[key]}\n"
         "Square composition, characters fill about 70% of the width, white background all around.")
    with open(SHEET, "rb") as f:
        r = c.images.edit(model=MODEL, image=[f], prompt=p, size="1024x1024", quality=QUALITY)
    print(key, QUALITY, cost(getattr(r, "usage", None)), flush=True)
    b = base64.b64decode(r.data[0].b64_json)
    (OUT / "raw" / f"{key}{SUFFIX}.png").write_bytes(b); whiten(b).save(OUT / f"{key}{SUFFIX}.png"); print("wrote", key, flush=True)

if __name__ == "__main__":
    c = client()
    if sys.argv[1] == "sheet": gen_sheet(c)
    else:
        keys = sys.argv[2:] or list(SCENES)
        with ThreadPoolExecutor(5) as ex: list(ex.map(lambda k: gen_scene(c, k), keys))
