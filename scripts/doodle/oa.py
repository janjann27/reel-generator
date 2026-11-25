"""Shared helpers for the doodle scripts.

- client(): OpenAI client; key read from fondly-sites Firestore settings/openaiClient through
  posting-bot-backend/functions/shared/firebase.py (needs ADC / gcloud credentials).
- Paths are repo-relative, so the scripts work from any checkout.
- BACKEND can be overridden with the POSTING_BOT_FUNCTIONS env var.
- QUALITY (env, default "low"): gpt-image-2 quality. low ~$0.006/img (1024²), medium ~$0.05, high ~$0.21.
  Low is the default for cost; rerun a weak scene with QUALITY=medium if needed.
"""
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # emoji captions on Windows consoles

REPO = Path(__file__).resolve().parents[2]          # carousel-vid/
DOODLE = REPO / "public" / "reels" / "doodle"        # image output root
OUT_MP4 = REPO / "out"                               # remotion render output
BACKEND = Path(os.environ.get("POSTING_BOT_FUNCTIONS", r"D:\Honest\posting-bot-backend\functions"))
QUALITY = os.environ.get("QUALITY", "low")


def use_backend():
    """Make posting-bot-backend's `shared.firebase` importable (it expects cwd = functions/)."""
    if str(BACKEND) not in sys.path:
        sys.path.insert(0, str(BACKEND))
    os.chdir(BACKEND)


def client():
    cwd = os.getcwd()
    use_backend()
    try:
        from shared.firebase import source_db
        from openai import OpenAI
        key = source_db.collection("settings").document("openaiClient").get().to_dict()["apiKey"]
    finally:
        os.chdir(cwd)
    return OpenAI(api_key=key)


if __name__ == "__main__":
    c = client()
    print(sorted(m.id for m in c.models.list().data if "image" in m.id))
