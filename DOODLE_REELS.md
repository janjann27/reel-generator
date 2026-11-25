# Doodle listicle reels

"Which boyfriend is yours when ___?" reels: a hook card, then 4–5 numbered boyfriend types, then a "which one is he?" end card, then a Flamingo App Store CTA card. All four live reels are made this way:

| Composition | Cast | Account | Length |
|---|---|---|---|
| `DoodleJealousBf` | cat couple + raccoon | flamingoappreels | 29s (v1 timing) |
| `DoodleWeirdBf` | flamingo gf + 5 animal bfs | flamingo.app.reels | 29s (v1 timing) |
| `DoodleCryBf` | cat couple | flamingo.app.reels | 19.5s (v2 timing) |
| `DoodleHungryBf` | people couple (webcomic style) | flamingo.app.reels | 19.5s (v2 timing) |

The pipeline has four steps:

```
1. images   scripts/doodle/gen_<set>.py   gpt-image-2: cast sheet → one scene per item
                                      → carousel-vid/public/reels/doodle/<set>/
2. compose  src/reels/doodle/DoodleListicle.tsx   props object (text + image paths)
            src/Composition.tsx                   register the composition id
3. render   npx remotion render <Id> out/<Id>.mp4
4. queue    scripts/doodle/queue_reels.py         upload to Storage, then a pending meta_post_queue doc
            → operator clicks Deploy in posting-bot-dashboard
```

---

## 1. Image generation

The scripts are in `scripts/doodle/` in this repo:

| File | Purpose |
|---|---|
| `oa.py` | Shared helpers: OpenAI client, repo-relative paths (`DOODLE`, `OUT_MP4`), `QUALITY`, `use_backend()` |
| `gen_jealous.py` | JealousBf. Cats sheet (cat couple + raccoon) + scenes → `doodle/cats/` |
| `gen_weird.py` | WeirdBf. 6-character sheet, uses `pair_ref()` / `cast_for()` (see the gotcha below) → `doodle/weirdbf/raw/` |
| `gen_cry.py` | CryBf. Reuses the cats sheet, cropped to the couple → `doodle/cry/` |
| `gen_hungry.py` | HungryBf. People cast. **Best template for new reels** (prints the cost of each call) → `doodle/hungry/` |
| `top.py` | Ranks an account's posts by shares to pick a topic (read-only) |
| `queue_reels.py` | Uploads a render and queues it (step 4) |

The originals are in `D:\Honest\_ops\doodle_*`. The repo versions use repo-relative paths and share one `QUALITY` setting.

> **Cost:** every call is paid gpt-image-2. Only run generation when someone asked for it.
> - `QUALITY` defaults to **`low`**: ~$0.006/image at 1024², about $0.04 for a whole reel.
> - Rerun a weak scene with `QUALITY=medium` (~$0.05/image).
> - `high` (~$0.21/image) is too expensive.
> - The existing four reels were made at `high`, so a `low` reel will look rougher. Check the stills.
> - A full reel is 1 sheet + 5–6 scenes.

### Setup

- `oa.py` builds an OpenAI client. It reads the key from Firestore `settings/openaiClient` through `posting-bot-backend/functions/shared/firebase.py`, so ADC (gcloud credentials) must be set up.
- The backend path defaults to `D:\Honest\posting-bot-backend\functions`. Override it with the `POSTING_BOT_FUNCTIONS` env var.
- Run the scripts from `scripts/doodle/` with the backend venv python:
  ```
  cd D:\Honest\carousel-vid\scripts\doodle
  set PY=D:\Honest\posting-bot-backend\functions\venv\Scripts\python.exe
  %PY% gen_hungry.py sheet
  %PY% gen_hungry.py scenes                            # all scenes, QUALITY=low
  set QUALITY=medium && %PY% gen_hungry.py scenes 3    # redo one scene at medium
  ```
- `gen_cry.py` has no sheet step: pass the scene keys directly (`gen_cry.py 3`).

### How a script works (`gen_hungry.py`)

1. **Prompt blocks** are three constants:
   - `STYLE`: the art direction.
   - `CAST`: an exact description of each character's hair, skin, outfit and colours.
   - `SCENES`: a dict that maps `hook`, `1`, `2`… to a scene description.
2. **Cast sheet:** `images.generate(model="gpt-image-2", size="1536x1024")` draws each character once, standing side by side. The output is `sheet.png`.
3. **Scenes:** each scene is an `images.edit(image=[sheet.png], size="1024x1024")` call. The prompt is "redraw these exact characters…" + `CAST` + the scene text. Feeding the sheet as the reference keeps the characters consistent across scenes. The script runs 5 scenes in parallel (ThreadPoolExecutor).
4. **Whitening:** the raw output goes to `raw/<key>.png`. A whitened copy, where pixels with all channels ≥243 become 255 (done in PIL), goes to `<key>.png`. That is the file the reel uses, and it gives a pure white background that blends with the white card.
   - Don't use ffmpeg `curves` for this: it shifts the mid-tones.
   - ffmpeg isn't on the bash PATH anyway.

### Style rules

- **People casts:** western couple-webcomic look, as if drawn with a felt-tip marker:
  - dot eyes and blush ovals; huge round eyes only for strong emotions
  - normal proportions, flat muted fills, LOW detail, slightly uneven lines
  - no sparkles, gloss, glow or gradients
  - no anime/chibi (that version was rejected; it is kept in `hungry/v1_anime/`)
- **Animal casts:** thick wobbly ink lines, flat pastel fills, big round eyes.
- **Background:** always pure white (#FFFFFF), with no room, no floor, no text and no speech bubbles. Characters are centred like a sticker.
- **Originality:** characters and captions must be our own. Never feed a third-party reel frame in as a style reference, and never draw franchise characters.

### Gotcha: a multi-character sheet leaks into every scene

If the sheet has more than 2 characters, `images.edit` draws the whole cast into every scene, even when the prompt says "only". There are two fixes:

- Crop the sheet to just the characters that scene needs:
  - `pair_ref()` in `doodle_far_viral` does this per scene.
  - `doodle_cry` instead crops the cats sheet once, to `(60,120,1035,900)`.
- Describe only those characters in the prompt: `cast_for()`.

### Output layout

```
public/reels/doodle/<set>/
  sheet.png          cast reference sheet
  hook.png 1.png …   whitened scenes (used by the reel)
  raw/               unwhitened originals + reference crops
```

Check every still by eye before composing. Redo bad ones one at a time (`gen.py scenes 3`).

---

## 2. Putting it together (Remotion)

There is one prop-driven component, `src/reels/doodle/DoodleListicle.tsx`, and each reel is a props object exported from the same file.

```ts
export const MY_BF: DoodleListicleProps = {
  ...CRY_BF,                       // inherit v2 timing, CTA, music, stillImages
  hookMid: "boyfriend is yours",
  hookBig: "WHEN YOU'RE\nHUNGRY?",
  hookImg: "reels/doodle/hungry/hook.png",
  items: [
    { label: "number one", title: "THE\nCHEF", caption: "line one\nline two",
      img: "reels/doodle/hungry/1.png", cta: "comment 1 if this is him" },
    // … 4 items (v2) or 5 (v1)
  ],
};
```

Then add it to the `DOODLES` array in `src/Composition.tsx`:

```ts
{ id: "DoodleMyBf", props: MY_BF },
```

### Props

| Prop | Meaning |
|---|---|
| `hookTop` / `hookMid` / `hookBig` / `hookImg` | Hook card: "WHICH" / "boyfriend is yours" / big question (`\n` breaks the line) / scene |
| `items[]` | Each item has `label` ("number one"), `title` (big, `\n`), a 2-line `caption`, `img`, and an optional red `cta` line (default "follow for more") |
| `endTitle` / `endLines` | End card text. The end card also shows numbered thumbnails of the items (one row when there are 4 items) |
| `cta` | `FLAMINGO_CTA`: "WANT MORE QUESTIONS? / search flamingo on the app store". The App Store mock (`public/reels/cta/flamingo-search.png`) slides up and a red ring is drawn around Get |
| `music` | `reels/audio/mixkit_87.mp3` (Mixkit ukulele). It loops at volume 0.55 and fades in and out. `pop.wav` plays on every cut |
| `stillImages` | `true` means scene images never move. **Default for new reels.** Text still boils |
| `hookF` / `itemF` / `endF` | Timing in frames at 30fps. v1 defaults are 90/105/150; v2 (CryBf) uses 60/75/105. The CTA card is always 105 |

### Motion

The "boil" matches the reference reel: the drawing is redrawn every 6 frames and holds still in between.

- **Text:** each letter gets its own random tilt (±3.5°) and nudge per step, with Remotion `random()`, so renders are deterministic. Font is Schoolbell with a text stroke.
- Never pulse the stroke width: it makes the text look like it is flashing.
- **Images:** if `stillImages` is off, the whole image gets a ±0.8° tilt and a ±3px nudge per step. Leave it on for new reels.

Format lessons from the readouts:
- The v1 ask ("drop the number") comes at ~21s, after most viewers have left, so it got ~0 comments.
- v2 is shorter (19.5s) and puts the comment ask on every item ("comment N if this is him").

### Preview

```
cd D:\Honest\carousel-vid
npm run dev            # Remotion Studio, scrub the composition
```

---

## 3. Render

```
cd D:\Honest\carousel-vid
npx remotion render DoodleMyBf out/DoodleMyBf.mp4
```

The output is 1080x1920 at 30fps, H.264 with audio, in `out/` (gitignored). Watch the whole MP4 once before you queue it: check the cuts, the music fade and the CTA ring.

---

## 4. Queue to post_queue

The queue script is `scripts/doodle/queue_reels.py`. Its `REELS` map gives each reel an account, the first line of its caption and an operator note. Add a new reel there, then run:

```
cd D:\Honest\carousel-vid\scripts\doodle
%PY% queue_reels.py DoodleMyBf           # dry run: prints captions + sizes
%PY% queue_reels.py DoodleMyBf --apply   # upload + queue
```

`--apply` does three things for each reel:

1. **Uploads** `out/<Reel>.mp4` to Storage in the `fondly-sites.firebasestorage.app` bucket:
   - the path is `reels_rendered/flamingo_<Reel>_<10hex>.mp4`
   - it gets a `firebaseStorageDownloadTokens` token, which gives the public download URL
2. **Creates a doc** in the fondly-sites Firestore `meta_post_queue` collection:
   - `username`: the IG account (watch out: `flamingo.app.reels`, with dots, is a different account from `flamingoappreels`)
   - `status: "pending"`
   - `type` / `mediaType` / `format`: `"reel"`
   - `poster: "meta"`
   - `source: "flamingo_reels"`
   - `rendered_url` and `zipUrl`: both set to the Storage URL
   - `caption`: the hook question + "comment the number 👇 and send this to him", then "more couple questions → link in bio 🦩", then the hashtags
   - `middleware_music: "manual"`: the music is already in the MP4
   - `operatorNote`: what the reel is and how it was made
   - `createdAt`: server timestamp
3. **Appends** a record to `scripts/doodle/queued.json` with the account, reel, doc id, storage path and URL. That file is gitignored because the URLs contain download tokens.

### Publish

The script **does not publish**. The doc sits as `pending` until an operator deploys it from **posting-bot-dashboard** (Meta deploy: right-click → Deploy). Meta carousel autopublish crons are paused, but manual deploy and reels work.

After the reel goes live, pull its insights after about 24h (reach, views, shares, saves, average watch time). Use media insights by `ig_media_id`; `_ops/cx_reel_2026-10-14/recent_any.py` shows the pattern. Baselines are below.

| Reel | Reach | Shares | Avg watch |
|---|---|---|---|
| JealousBf (flamingoappreels) | 39.5k | 447 | 9.0s / 25.5s |
| WeirdBf (flamingo.app.reels) | 3.2k | 116 | 6.8s |

---

## Checklist for a new reel

1. Pick a topic (`scripts/doodle/top.py flamingo.app.reels` ranks an account's posts by shares). Write 4 boyfriend types with our own captions.
2. Copy `gen_hungry.py` to `gen_<set>.py`. Edit `OUT`, `CAST` and `SCENES`, keep `STYLE`, and run `sheet` then `scenes` (`QUALITY` defaults to `low`). **Get approval for the image cost first.**
3. Check the stills and redo bad ones.
4. Add `MY_BF = { ...CRY_BF, … }` in `DoodleListicle.tsx` and an entry in `DOODLES` in `Composition.tsx`.
5. Run `npm run dev` to preview, then `npx remotion render <Id> out/<Id>.mp4`.
6. Add the reel to `REELS` in `queue_reels.py`, do a dry run, then `--apply`.
7. Operator deploys from the dashboard. Read out the results at ~24h.
