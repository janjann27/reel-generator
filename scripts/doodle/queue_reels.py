"""Queue rendered doodle reels to Meta publishing (fondly-sites meta_post_queue, status pending).

Uploads out/<Reel>.mp4 to fondly-sites Storage (reels_rendered/) with a download token, then creates
one pending meta_post_queue doc per reel. It does NOT publish: an operator clicks Deploy in
posting-bot-dashboard. Records are appended to queued.json (gitignored: contains download tokens).

  python queue_reels.py DoodleCryBf DoodleHungryBf          # dry run
  python queue_reels.py DoodleCryBf --apply                 # upload + queue

Add a new reel to REELS: (account, caption first line, operator note).
NOTE: "flamingo.app.reels" (dotted) and "flamingoappreels" are DIFFERENT IG accounts.
"""
import json, sys, uuid
from oa import OUT_MP4, use_backend

HERE = __import__("pathlib").Path(__file__).resolve().parent
BUCKET = "fondly-sites.firebasestorage.app"
TAGS = "#couples #couplegoals #relationships #boyfriend #couplememes"
CREATED_BY = "swe@thehonestapp.com"

REELS = {
    "DoodleJealousBf": ("flamingoappreels",
                        "which one is he? drop the number 👇 and send this to him",
                        "cat couple 'which bf is yours when a guy flirts with you'"),
    "DoodleWeirdBf": ("flamingo.app.reels",
                      "which one is he? drop the number 👇 and send this to him",
                      "flamingo + monke/penguin/crab/capybara/bear 'which weird boyfriend is yours', remake of FAR viral DdxQvKqDy1S"),
    "DoodleCryBf": ("flamingo.app.reels",
                    "which one is he when you cry? comment the number 👇 and send this to him",
                    "cat couple 'which bf is yours when you cry' (v2: 4 items, 19.5s)"),
    "DoodleHungryBf": ("flamingo.app.reels",
                       "which one is he when you're hungry? comment the number 👇 and send this to him",
                       "people couple webcomic 'which bf is yours when you're hungry' (v2: 4 items, 19.5s)"),
}


def make_doc(reel, account, cap, note):
    return {
        "username": account, "status": "pending",
        "type": "reel", "mediaType": "reel", "format": "reel",
        "createdByEmail": CREATED_BY,
        "caption": f"{cap}\n\nmore couple questions → link in bio 🦩\n{TAGS}", "location": "Los Angeles",
        "song": "", "songStartTime": 0, "middleware_music": "manual", "musicTier": "manual",
        "coverUrl": None, "transcriptions": 1, "hashes": [], "hashPrefixes": [],
        "source": "flamingo_reels", "sourceAccount": "", "sourcePostId": "",
        "poster": "meta", "submission_id": None,
        "operatorNote": f"doodle: Remotion {reel} (carousel-vid/src/reels/doodle/DoodleListicle.tsx), gpt-image-2 {note}, Mixkit 87 music",
    }


def main():
    apply = "--apply" in sys.argv
    names = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not names or any(n not in REELS for n in names):
        sys.exit(f"usage: queue_reels.py <Reel> [...] [--apply]; known: {', '.join(REELS)}")
    use_backend()
    import firebase_admin
    from firebase_admin import storage, firestore
    from shared.firebase import source_db  # fondly-sites

    log = HERE / "queued.json"
    recs = json.loads(log.read_text(encoding="utf-8")) if log.exists() else []
    for reel in names:
        account, cap, note = REELS[reel]
        mp4 = OUT_MP4 / f"{reel}.mp4"
        doc = make_doc(reel, account, cap, note)
        print(reel, mp4.stat().st_size, "bytes ->", account); print(doc["caption"]); print()
        if not apply:
            continue
        bucket = storage.bucket(BUCKET, app=firebase_admin.get_app("source"))
        dest = f"reels_rendered/flamingo_{reel}_{uuid.uuid4().hex[:10]}.mp4"
        token = str(uuid.uuid4())
        blob = bucket.blob(dest); blob.metadata = {"firebaseStorageDownloadTokens": token}
        blob.upload_from_filename(str(mp4), content_type="video/mp4", timeout=600)
        url = f"https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o/{dest.replace('/', '%2F')}?alt=media&token={token}"
        doc.update({"rendered_url": url, "zipUrl": url, "createdAt": firestore.SERVER_TIMESTAMP})
        ref = source_db.collection("meta_post_queue").document(); ref.set(doc)
        recs.append({"account": account, "reel": reel, "meta_post_queue_id": ref.id, "storage_path": dest, "rendered_url": url})
        log.write_text(json.dumps(recs, indent=1, ensure_ascii=False), encoding="utf-8")
        print("QUEUED", account, reel, ref.id, flush=True)
    if not apply:
        print("dry run")


if __name__ == "__main__":
    main()
