"""Generate cast sheet + scene images for the doodle listicle reel with gpt-image-2.

usage: python gen.py sheet            # cast reference sheet
       python gen.py scenes [k ...]   # scenes (all, or given keys), edited from the sheet
Outputs land in carousel-vid/public/reels/doodle/<cast>/.
"""
import base64
import sys
from pathlib import Path

from oa import client, DOODLE, QUALITY

MODEL = "gpt-image-2"
CAST = "cats"
OUT = Path(r"D:\Honest\carousel-vid\public\reels\doodle") / CAST
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
    "GIRLFRIEND: a small cream-white cat with a peach-pink inner ear, a pink bow on one ear, "
    "wearing a lilac oversized t-shirt with a small red heart. "
    "BOYFRIEND: a slightly bigger chubby grey tabby cat with darker grey stripes, wearing a "
    "mint-green hoodie. "
    "THIRD CHARACTER (the flirty stranger): a raccoon with a smug face wearing a "
    "mustard-yellow shirt with an open collar. "
    "All three walk upright on two legs like cartoon people."
)

SCENES = {
    "hook": "The cream cat girlfriend sits at a small round cafe table holding a cup; the raccoon "
            "leans over her with a smug wink and a little rose, one red heart floating. Next to her "
            "the grey tabby boyfriend stares at the raccoon with huge shocked eyes, fur puffed up, "
            "sweat drops flying.",
    "1": "The grey tabby boyfriend has puffed himself up to twice his size, chest out, standing "
         "extremely close behind the cream cat girlfriend and glaring down at the tiny raccoon, who "
         "looks nervous and is sweating. The girlfriend looks up, amused.",
    "2": "The grey tabby boyfriend smiles calmly and gives a friendly wave to the raccoon, totally "
         "relaxed and oblivious. The cream cat girlfriend stares at the boyfriend in disbelief with "
         "flat unimpressed eyes.",
    "3": "The grey tabby boyfriend wraps both arms tightly around the cream cat girlfriend in a "
         "dramatic hug, cheek pressed to her cheek, eyes closed, little hearts and the motion lines "
         "around them, while the raccoon in the background awkwardly backs away.",
    "4": "The grey tabby boyfriend sits on the floor with his back turned, arms crossed, sulking with "
         "a pouty face and a small dark scribble cloud over his head. The cream cat girlfriend kneels "
         "next to him, poking his cheek gently, sweat drop on her head.",
    "5": "The grey tabby boyfriend stands perfectly still holding a cup, staring straight at the raccoon "
         "with tiny pupils and a dead-serious face, not blinking. The raccoon is frozen with a nervous "
         "smile and sweat drops. The cream cat girlfriend sips her drink between them, trying not to laugh.",
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


def gen_scene(c, key):
    prompt = (
        f"{STYLE}\n\nUse the attached character reference sheet: redraw these exact characters with the "
        f"same colors, outfits and proportions. {CAST_DESC}\n\nScene: {SCENES[key]}\n"
        "Square composition, characters fill about 70% of the width, white background all around."
    )
    with open(SHEET, "rb") as f:
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
