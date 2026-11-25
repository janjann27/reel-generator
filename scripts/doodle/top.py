"""Rank an account's posts to pick a doodle topic. Read-only (fondly-sites accounts/{u}/posts).

  python top.py [account] [N]      # default flamingo.app.reels, top 20 by shares
Writes posts.json next to this script (gitignored).
"""
import json, sys
from oa import use_backend

HERE = __import__("pathlib").Path(__file__).resolve().parent
acct = sys.argv[1] if len(sys.argv) > 1 else "flamingo.app.reels"
n = int(sys.argv[2]) if len(sys.argv) > 2 else 20
use_backend()
from shared.firebase import source_db

rows = []
for s in source_db.collection("accounts").document(acct).collection("posts").stream():
    d = s.to_dict() or {}
    m = (d.get("metrics") or {}).get("current") or {}
    rows.append({"id": s.id, "taken_at": str(d.get("taken_at_timestamp") or d.get("taken_at")),
                 "reach": m.get("reach"), "shares": m.get("shares"), "saves": m.get("saved"),
                 "views": m.get("views") or m.get("plays") or d.get("play_count"),
                 "likes": d.get("likes") or d.get("like_count"), "comments": d.get("comments_count"),
                 "url": d.get("post_url"), "caption": (d.get("caption") or "")[:120],
                 "trans": [d.get(f"transcription_{i}") for i in range(1, 8) if d.get(f"transcription_{i}")]})
rows.sort(key=lambda r: r["shares"] or 0, reverse=True)
(HERE / "posts.json").write_text(json.dumps(rows, default=str, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(rows), "posts in", acct)
for r in rows[:n]:
    print(f"{r['shares'] or 0:>7} shares {r['reach'] or 0:>8} reach  {r['taken_at'][:10]}  {r['url']}  {r['caption'][:60]!r}")
