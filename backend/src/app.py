import json
import os
import logging
import requests
from typing import List, Dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def _response(body: Dict, status: int = 200):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }


# Chat proxy: expects {messages: [{role, content}], model?}
def chat_handler(event, _context):
    try:
        body = json.loads(event.get("body") or "{}")
        messages: List[Dict[str, str]] = body.get("messages", [])
        model = body.get("model", "gpt-4o-mini")
        if not messages:
          return _response({"message": "No messages provided"}, 400)

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            return _response({"message": "OPENAI_API_KEY not set"}, 500)

        payload = {
            "model": model,
            "messages": messages,
        }
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        if r.status_code != 200:
            logger.error("OpenAI error %s: %s", r.status_code, r.text)
            return _response({"message": "Chat upstream error"}, 502)
        data = r.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        return _response({"message": {"content": content}})
    except Exception as e:
        logger.exception("Chat handler error")
        return _response({"message": "Unexpected error"}, 500)


# Horoscope stub: expects {sign: string}
def horoscope_handler(event, _context):
    try:
        body = json.loads(event.get("body") or "{}")
        sign = (body.get("sign") or "").title()
        if not sign:
            return _response({"message": "Sign required"}, 400)
        # Placeholder content; replace with real feed
        data = {
            "daily": f"{sign}: Stay open to small shifts today.",
            "weekly": f"{sign}: Clear one lingering task this week.",
            "monthly": f"{sign}: Balance ambition with rest this month.",
            "yearly": f"{sign}: Build steadily; focus on one key theme this year.",
        }
        return _response({"horoscope": data})
    except Exception:
        logger.exception("Horoscope handler error")
        return _response({"message": "Unexpected error"}, 500)


# Numerology: expects {name: string, dob: YYYY-MM-DD}
def numerology_handler(event, _context):
    try:
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        dob = (body.get("dob") or "").strip()
        if not name or not dob:
            return _response({"message": "Name and dob required"}, 400)

        life_path = _life_path(dob)
        expression = _expression(name)
        soul = _soul_urge(name)

        return _response({
            "lifePath": life_path,
            "expression": expression,
            "soulUrge": soul,
        })
    except Exception:
        logger.exception("Numerology handler error")
        return _response({"message": "Unexpected error"}, 500)


# Tarot stub: echoes intent/reading type
def tarot_handler(event, _context):
    try:
        body = json.loads(event.get("body") or "{}")
        intent = body.get("intent", "general")
        spread = body.get("spread", "Daily")
        return _response({
            "intent": intent,
            "spread": spread,
            "notes": "Tarot interpretations can be served from backend if desired.",
        })
    except Exception:
        logger.exception("Tarot handler error")
        return _response({"message": "Unexpected error"}, 500)


# Numerology helpers
letters_value = {
    "A": 1, "J": 1, "S": 1,
    "B": 2, "K": 2, "T": 2,
    "C": 3, "L": 3, "U": 3,
    "D": 4, "M": 4, "V": 4,
    "E": 5, "N": 5, "W": 5,
    "F": 6, "O": 6, "X": 6,
    "G": 7, "P": 7, "Y": 7,
    "H": 8, "Q": 8, "Z": 8,
    "I": 9, "R": 9,
}


def _reduce(num: int) -> int:
    while num > 9 and num not in (11, 22, 33):
        num = sum(int(d) for d in str(num))
    return num


def _life_path(dob: str):
    try:
        y, m, d = dob.split("-")
        total = sum(int(ch) for ch in y + m + d)
        return _reduce(total)
    except Exception:
        return None


def _expression(name: str):
    clean = "".join(ch for ch in name.upper() if ch.isalpha())
    if not clean:
        return None
    total = sum(letters_value.get(ch, 0) for ch in clean)
    return _reduce(total)


def _soul_urge(name: str):
    clean = "".join(ch for ch in name.upper() if ch.isalpha())
    vowels = [ch for ch in clean if ch in "AEIOUY"]
    if not vowels:
        return None
    total = sum(letters_value.get(ch, 0) for ch in vowels)
    return _reduce(total)
