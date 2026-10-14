/* couplesyx "cheating or not": one situation + the verdict ask, same still card as QuestionFor.
 *
 * Why this topic: _ops/couplesyx_content_2026-10-13 (3,369 posts, month x lane x format cells).
 * drama_trust was the most consistent winner on couplesyx (7W/2L), and choose-an-option
 * verdicts beat question lists fleet-wide. Best curator hit in that bucket:
 * "Is this cheating or not? (send these to your bf)", 1,303 reach.
 * Copy: one real-sounding situation, lowercase, no emoji, verdict on its own line.
 * Audience is women (the account's curator lane), so "he" is fine; the send ask lives in `caption`.
 */
import type { QuestionForProps } from "./QuestionFor";

export const VERDICTS: (QuestionForProps & { id: string })[] = [
  {
    id: "VerdictExBirthday",
    question: "he still texts his ex\nhappy birthday\nevery year\n\ncheating or not",
    bg: "reels/bg/city-embrace.mp4", // mixkit.co/free-stock-video/silhouetted-couple-in-city-nightscape-embrace-100948
    caption: "be honest. then send this to him",
  },
];
