"""Generate cast sheet + scene images for the doodle listicle reel with gpt-image-2.

usage: python gen.py sheet            # cast reference sheet
       python gen.py scenes [k ...]   # scenes (all, or given keys), edited from the sheet
Outputs land in carousel-vid/public/reels/doodle/weirdbf/raw/. Source: FAR viral DdxQvKqDy1S.
"""
import base64
import sys
from pathlib import Path

from oa import client, DOODLE, QUALITY

MODEL = "gpt-image-2"
CAST = "weirdbf"
OUT = DOODLE / CAST / "raw"
OUT.mkdir(parents=True, exist_ok=True)
SHEET = OUT / "sheet.png"

STYLE = (
    "Cute hand-drawn webcomic doodle style. Thick, slightly wobbly black ink outlines, "
    "flat pastel fills with no gradients and no texture, simple shading only, big round "
    "white eyes with small black pupils, exaggerated cartoon expressions, sweat drops and "
    "motion lines drawn as simple strokes. Pure flat white background (#FFFFFF), no floor, "
    "no scenery, no frame, no text, no letters, no speech bubbles, no watermark. "
    "Characters centered with generous white margin around them, like a sticker."
)

CAST_DESC = (
    "GIRLFRIEND: a small pink flamingo girl with long thin legs, a little red bow on her head and a "
    "white crop t-shirt with a tiny red heart. "
    "MONKEY BOYFRIEND: a scrappy brown monkey with a beige face and a long curly tail, wearing a "
    "backwards red cap. "
    "PENGUIN BOYFRIEND: a short round black-and-white penguin with an orange beak and feet, wearing a "
    "small blue knitted scarf. "
    "CRAB BOYFRIEND: a small red crab with big claws, eyes on stalks and a permanently grumpy frown. "
    "CAPYBARA BOYFRIEND: a chubby tan capybara with tiny ears and sleepy half-closed eyes, with a small "
    "orange tangerine balanced on his head. "
    "BEAR BOYFRIEND: a huge dark-brown bear with small round ears and a gentle face, wearing a cozy "
    "green sweater. "
    "All of them are cartoon characters with simple expressive faces; the boyfriends are about the "
    "girlfriend's height except the bear (twice as big) and the crab (knee high)."
)

SCENES = {
    "hook": "The pink flamingo girlfriend stands in the middle with a confused face and a question mark "
            "drawn above her head, while all five boyfriends crowd around her looking at her hopefully: the "
            "monkey hanging upside down, the penguin hugging her leg, the crab glaring, the capybara chilling "
            "and the big bear peeking from behind.",
    "1": "The monkey boyfriend hangs upside down by his tail from nowhere, munching a bag of chips he clearly "
         "stole, crumbs flying, mischievous grin. The pink flamingo girlfriend below holds her empty hands "
         "out, shocked, sweat drop.",
    "2": "The penguin boyfriend waddles right behind the walking pink flamingo girlfriend, holding the hem "
         "of her shirt with one flipper, little hearts above him, motion lines at his feet. The flamingo "
         "looks back at him with a soft smile.",
    "3": "The crab boyfriend stands with his claws crossed and a grumpy pout, steam puffs above his head, "
         "turned away, but his eye stalks peek sideways at the pink flamingo girlfriend who is crouching to "
         "pat his head; a tiny blush on his cheeks.",
    "4": "The capybara boyfriend floats calmly in a small round hot tub with a tangerine on his head, eyes "
         "half closed, totally zen, while chaos happens around him: the pink flamingo girlfriend panics with "
         "sweat drops and flailing wings next to the tub.",
    "5": "The huge bear boyfriend gives the small pink flamingo girlfriend a giant squishy bear hug, her "
         "legs dangling off the ground, little hearts floating, the bear's eyes closed blissfully, the "
         "flamingo's face squished but happy.",
}


def save(resp, path):
    path.write_bytes(base64.b64decode(resp.data[0].b64_json))
    print("wrote", path)


def gen_sheet(c):
    prompt = (
        f"{STYLE}\n\nCharacter reference sheet for an original cartoon cast. {CAST_DESC}\n"
        "Show each character once in a neutral standing pose, full body, side by side, evenly spaced, "
        "front view, same scale. Keep designs simple and iconic so they are easy to redraw."
    )
    r = c.images.generate(model=MODEL, prompt=prompt, size="1536x1024", quality=QUALITY)
    save(r, SHEET)


# x-ranges of each character on sheet.png (1536x1024); scenes 1-5 get a ref of ONLY flamingo + that bf,
# because with the full sheet gpt-image-2 draws the whole cast into every scene.
XR = {"flamingo": (30, 235), "monkey": (222, 482), "penguin": (472, 700), "crab": (695, 950),
      "capybara": (945, 1175), "bear": (1155, 1536)}
SCENE_BF = {"1": "monkey", "2": "penguin", "3": "crab", "4": "capybara", "5": "bear"}


def cast_for(key):
    if key == "hook":
        return CAST_DESC
    labels = ["GIRLFRIEND:", "MONKEY BOYFRIEND:", "PENGUIN BOYFRIEND:", "CRAB BOYFRIEND:",
              "CAPYBARA BOYFRIEND:", "BEAR BOYFRIEND:", "All of them"]
    idx = [CAST_DESC.index(l) for l in labels] + [len(CAST_DESC)]
    seg = {labels[i]: CAST_DESC[idx[i]:idx[i + 1]].strip() for i in range(len(labels))}
    bf = f"{SCENE_BF[key].upper()} BOYFRIEND:"
    return f"{seg['GIRLFRIEND:']} {seg[bf]} These are the only two characters in the picture."


def pair_ref(key):
    from PIL import Image
    sheet = Image.open(SHEET).convert("RGB")
    tiles = [sheet.crop((*XR[n][:1], 190, XR[n][1], 770)) for n in ("flamingo", SCENE_BF[key])]
    w = sum(t.width for t in tiles) + 120
    out = Image.new("RGB", (w, 580 + 120), "white")
    x = 40
    for t in tiles:
        out.paste(t, (x, 60)); x += t.width + 40
    path = OUT / f"ref_{key}.png"
    out.save(path)
    return path


def gen_scene(c, key):
    prompt = (
        f"{STYLE}\n\nUse the attached character reference: redraw the characters shown with the "
        f"same colors, outfits and proportions. {cast_for(key)}\n\nScene: {SCENES[key]}\n"
        "Square composition, characters fill about 70% of the width, white background all around."
    )
    ref = SHEET if key == "hook" else pair_ref(key)
    with open(ref, "rb") as f:
        r = c.images.edit(model=MODEL, image=[f], prompt=prompt, size="1024x1024", quality=QUALITY)
    save(r, OUT / f"{key}.png")


if __name__ == "__main__":
    cmd = sys.argv[1]
    c = client()
    if cmd == "sheet":
        gen_sheet(c)
    elif cmd == "scenes":
        from concurrent.futures import ThreadPoolExecutor
        keys = sys.argv[2:] or list(SCENES)
        with ThreadPoolExecutor(6) as ex:
            list(ex.map(lambda k: gen_scene(c, k), keys))
