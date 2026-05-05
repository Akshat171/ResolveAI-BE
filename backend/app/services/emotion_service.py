from __future__ import annotations

"""
Fast heuristic emotion detector — no LLM call, zero extra latency.

Emotion levels:
  calm       — no meaningful frustration signals
  frustrated — some signals (score 0.30–0.59)
  angry      — strong signals (score >= 0.60)
"""

ANGRY_KEYWORDS: list[str] = [
    "this is ridiculous",
    "absolutely terrible",
    "worst ever",
    "worst service",
    "horrible",
    "disgusting",
    "useless",
    "pathetic",
    "incompetent",
    "garbage",
    "this is trash",
    "stupid",
    "what the hell",
    "wtf",
    "this is a joke",
    "never using",
    "never again",
    "i hate this",
    "i hate you",
    "scam",
    "fraud",
    "liar",
    "terrible company",
]

FRUSTRATED_KEYWORDS: list[str] = [
    "still not working",
    "not working",
    "doesn't work",
    "does not work",
    "not fixed",
    "keeps failing",
    "keeps breaking",
    "frustrated",
    "frustrating",
    "so annoying",
    "annoyed",
    "disappointed",
    "very disappointed",
    "terrible experience",
    "bad experience",
    "not helpful",
    "unhelpful",
    "waste of time",
    "why is it so hard",
    "how many times",
    "already told",
    "i already said",
    "told you already",
    "unacceptable",
    "this is unacceptable",
    "can't believe",
    "cannot believe",
    "still haven't",
    "still waiting",
    "no response",
    "nobody is helping",
]


def detect_emotion(text: str) -> dict:
    """
    Detect emotional tone of a visitor message.

    Returns:
        {
            "emotion": "calm" | "frustrated" | "angry",
            "score": float,          # 0.0 – 1.0
            "signals": list[str],    # detected triggers for debugging
        }
    """
    lower = text.lower()
    signals: list[str] = []
    score: float = 0.0

    # --- ALL CAPS words (shouting) ---
    words = text.split()
    caps_words = [w for w in words if len(w) > 2 and w.isupper() and w.isalpha()]
    if len(caps_words) >= 2:
        signals.append("all_caps")
        score += 0.40
    elif len(caps_words) == 1:
        signals.append("caps_word")
        score += 0.15

    # --- Excessive exclamation marks ---
    excl = text.count("!")
    if excl >= 3:
        signals.append("excessive_exclamation")
        score += 0.30
    elif excl >= 2:
        signals.append("exclamation")
        score += 0.15
    elif excl == 1:
        score += 0.05

    # --- Repeated question marks ---
    if text.count("?") >= 3:
        signals.append("repeated_questions")
        score += 0.15
    elif text.count("?") == 2:
        score += 0.05

    # --- Angry keyword match ---
    for kw in ANGRY_KEYWORDS:
        if kw in lower:
            signals.append(f"angry:{kw}")
            score += 0.55
            break  # one match is enough

    # --- Frustrated keyword match (only if no angry match yet) ---
    if not any(s.startswith("angry:") for s in signals):
        for kw in FRUSTRATED_KEYWORDS:
            if kw in lower:
                signals.append(f"frustrated:{kw}")
                score += 0.35
                break

    # --- Very short, terse messages with strong negative sentiment ---
    if len(words) <= 5 and any(
        w in lower for w in ["no", "wrong", "bad", "terrible", "awful", "broken"]
    ):
        score += 0.10

    score = round(min(score, 1.0), 2)

    if score >= 0.60:
        emotion = "angry"
    elif score >= 0.30:
        emotion = "frustrated"
    else:
        emotion = "calm"

    return {"emotion": emotion, "score": score, "signals": signals}


def is_negative(emotion: str) -> bool:
    return emotion in ("frustrated", "angry")
