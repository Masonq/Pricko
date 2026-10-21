"""Pričko — сервер: разговор (речь → ИИ → голос) и сказки. Бесплатные лимиты: Groq + Mistral, озвучка edge-tts."""
import asyncio, json, os, re, sqlite3, time, uuid, logging
from pathlib import Path
from typing import Optional
import httpx, edge_tts
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).resolve().parent
DATA = Path(os.getenv("PRICKO_DATA", BASE.parent / "data")); DATA.mkdir(parents=True, exist_ok=True)
MEDIA = DATA / "media"; MEDIA.mkdir(exist_ok=True)
SITE = BASE.parent / "site"
GROQ = os.getenv("GROQ_API_KEY", "").strip()
MISTRAL = os.getenv("MISTRAL_API_KEY", "").strip()
TALK_PER_DAY = int(os.getenv("TALK_PER_DAY", "150"))
STORY_PER_DAY = int(os.getenv("STORY_PER_DAY", "8"))
VOICE_TALK = "sr-RS-SophieNeural"
VOICE_STORY = "sr-RS-SophieNeural"
log = logging.getLogger("pricko"); logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ---------- база ----------
def db():
    c = sqlite3.connect(DATA / "pricko.db", timeout=10); c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL"); return c
with db() as c:
    c.executescript("""
    CREATE TABLE IF NOT EXISTS usage(device TEXT, day TEXT, kind TEXT, n INTEGER, PRIMARY KEY(device,day,kind));
    CREATE TABLE IF NOT EXISTS stories(id TEXT PRIMARY KEY, device TEXT, created INTEGER, data TEXT);
    CREATE TABLE IF NOT EXISTS events(ts INTEGER, kind TEXT, provider TEXT, ok INTEGER, ms INTEGER, note TEXT);
    """)

def take(device: str, kind: str, limit: int):
    day = time.strftime("%Y-%m-%d")
    with db() as c:
        row = c.execute("SELECT n FROM usage WHERE device=? AND day=? AND kind=?", (device, day, kind)).fetchone()
        n = row["n"] if row else 0
        if n >= limit: raise HTTPException(429, "limit")
        c.execute("INSERT INTO usage VALUES(?,?,?,1) ON CONFLICT(device,day,kind) DO UPDATE SET n=n+1", (device, day, kind))

def event(kind, provider, ok, ms, note=""):
    try:
        with db() as c: c.execute("INSERT INTO events VALUES(?,?,?,?,?,?)", (int(time.time()), kind, provider, int(ok), ms, note[:300]))
    except Exception: pass

# ---------- сербский: кириллица → латиница (однозначно) ----------
CYR = dict(zip("абвгдђежзијклљмнњопрстћуфхцчџшАБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ",
  ["a","b","v","g","d","đ","e","ž","z","i","j","k","l","lj","m","n","nj","o","p","r","s","t","ć","u","f","h","c","č","dž","š",
   "A","B","V","G","D","Đ","E","Ž","Z","I","J","K","L","Lj","M","N","Nj","O","P","R","S","T","Ć","U","F","H","C","Č","Dž","Š"]))
CYR.update({"й": "j", "Й": "J", "ы": "i", "э": "e", "Э": "E", "ю": "ju", "Ю": "Ju", "я": "ja", "Я": "Ja", "ё": "jo", "щ": "šč", "ъ": "", "ь": ""})
def lat(s: str) -> str: return "".join(CYR.get(ch, ch) for ch in s or "")

# ---------- ИИ: каскад провайдеров (список моделей берётся у провайдеров, мёртвые пропускаются) ----------
GROQ_PREF = ["openai/gpt-oss-120b", "moonshotai/kimi-k2-instruct-0905", "moonshotai/kimi-k2-instruct", "qwen/qwen3-32b",
             "meta-llama/llama-4-maverick-17b-128e-instruct", "openai/gpt-oss-20b", "meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.3-70b-versatile"]
MISTRAL_PREF = ["mistral-medium-latest", "mistral-small-latest", "open-mistral-nemo", "ministral-8b-latest"]
BASES = {"groq": "https://api.groq.com/openai/v1", "mistral": "https://api.mistral.ai/v1"}
LLMS: list = [("groq", BASES["groq"], m) for m in GROQ_PREF[:3]] + [("mistral", BASES["mistral"], m) for m in MISTRAL_PREF[1:3]]
def key_for(p): return GROQ if p == "groq" else MISTRAL

async def discover():
    """Спросить у провайдеров, какие модели реально доступны, и собрать каскад."""
    global LLMS
    found = []
    async with httpx.AsyncClient(timeout=20) as cl:
        for prov, pref in (("groq", GROQ_PREF), ("mistral", MISTRAL_PREF)):
            k = key_for(prov)
            if not k: continue
            try:
                r = await cl.get(f"{BASES[prov]}/models", headers={"Authorization": f"Bearer {k}"})
                have = {m["id"] for m in r.json().get("data", [])}
                ok = [m for m in pref if m in have][: 3 if prov == "groq" else 2]
                found += [(prov, BASES[prov], m) for m in ok]
            except Exception as e:
                log.warning("discover %s: %s", prov, e)
    if found: LLMS = found
    log.info("LLM cascade: %s", [m for _, _, m in LLMS])

def parse_json(txt: str) -> dict:
    txt = re.sub(r"<think>.*?</think>", "", txt or "", flags=re.S).strip()
    txt = re.sub(r"^```(?:json)?|```$", "", txt.strip(), flags=re.M).strip()
    try: return json.loads(txt)
    except Exception: pass
    m = re.search(r"\{.*\}", txt, re.S)
    if not m: raise ValueError("no json")
    return json.loads(m.group(0))

async def llm(system: str, messages: list, max_tokens=700, temperature=0.7) -> dict:
    async with httpx.AsyncClient(timeout=45) as cl:
        for prov, base, model in list(LLMS):
            k = key_for(prov)
            if not k: continue
            for attempt in range(2):
                t0 = time.time()
                try:
                    body = {"model": model, "messages": [{"role": "system", "content": system + "\nReturn only the JSON object, no other text."}] + messages,
                            "temperature": temperature, "max_tokens": max_tokens}
                    if prov == "mistral": body["response_format"] = {"type": "json_object"}
                    if model.startswith("openai/gpt-oss"): body["reasoning_effort"] = "low"; body["max_tokens"] = max_tokens + 600
                    r = await cl.post(f"{base}/chat/completions", headers={"Authorization": f"Bearer {k}"}, json=body)
                    if r.status_code == 429 and attempt == 0: await asyncio.sleep(1.5); continue
                    if r.status_code != 200: raise RuntimeError(f"{r.status_code} {r.text[:200]}")
                    out = parse_json(r.json()["choices"][0]["message"].get("content") or "")
                    event("llm", f"{prov}:{model}", True, int((time.time()-t0)*1000)); return out
                except Exception as e:
                    event("llm", f"{prov}:{model}", False, int((time.time()-t0)*1000), str(e)); log.warning("llm %s %s: %s", prov, model, e)
                    break
    raise HTTPException(503, "ai_busy")

def stt_lang() -> str:
    f = DATA / "stt_lang.txt"
    return f.read_text().strip() if f.exists() else "hr"

async def stt(audio: bytes, filename: str, lang: Optional[str] = None, prompt: str = "") -> str:
    lang = lang if lang is not None else stt_lang()
    async with httpx.AsyncClient(timeout=45) as cl:
        for model in ("whisper-large-v3", "whisper-large-v3-turbo"):
            t0 = time.time()
            try:
                data = {"model": model, "response_format": "json", "temperature": "0"}
                if lang and lang != "auto": data["language"] = lang
                if prompt: data["prompt"] = prompt[:200]
                r = await cl.post("https://api.groq.com/openai/v1/audio/transcriptions", headers={"Authorization": f"Bearer {GROQ}"},
                                  files={"file": (filename, audio)}, data=data)
                if r.status_code != 200: raise RuntimeError(f"{r.status_code} {r.text[:200]}")
                event("stt", model, True, int((time.time()-t0)*1000)); return lat(r.json().get("text", "").strip())
            except Exception as e:
                event("stt", model, False, int((time.time()-t0)*1000), str(e)); log.warning("stt %s: %s", model, e)
    raise HTTPException(503, "stt_busy")

async def tts(text: str, voice: str, rate: str = "+0%", prefix: str = "t_") -> Optional[str]:
    """Озвучка: голос Microsoft (edge-tts), запасной — Google (gTTS)."""
    name = f"{prefix}{uuid.uuid4().hex}.mp3"; path = MEDIA / name; t0 = time.time()
    try:
        await edge_tts.Communicate(text, voice, rate=rate).save(str(path))
        if path.stat().st_size < 500: raise RuntimeError("empty audio")
        event("tts", voice, True, int((time.time()-t0)*1000)); return f"/media/{name}"
    except Exception as e:
        event("tts", voice, False, int((time.time()-t0)*1000), str(e)); log.warning("tts edge: %s", e)
    t0 = time.time()
    try:
        from gtts import gTTS
        await asyncio.to_thread(lambda: gTTS(text, lang="sr", slow=rate.startswith("-1")).save(str(path)))
        event("tts", "gtts", True, int((time.time()-t0)*1000)); return f"/media/{name}"
    except Exception as e:
        event("tts", "gtts", False, int((time.time()-t0)*1000), str(e)); log.warning("tts gtts: %s", e); return None

# ---------- сценарии ----------
SCENARIOS = {
  "pekara": {"title": {"sr": "Pekara", "ru": "Пекарня", "en": "Bakery"}, "who": "prodavačica u pekari na uglu u Beogradu (ljubazna, brzo priča)",
             "open": "Dobar dan! Izvolite?", "goal": {"sr": "Kupi burek i jogurt", "ru": "Купите бурек и йогурт", "en": "Buy a burek and a yogurt"}},
  "taksi": {"title": {"sr": "Taksi", "ru": "Такси", "en": "Taxi"}, "who": "taksista u Beogradu (pričljiv, voli da priča o saobraćaju)",
            "open": "Dobar dan! Gde idemo?", "goal": {"sr": "Odvezi se do Slavije i plati", "ru": "Доедьте до Славии и расплатитесь", "en": "Ride to Slavija and pay"}},
  "pijaca": {"title": {"sr": "Pijaca", "ru": "Рынок", "en": "Market"}, "who": "prodavačica povrća na Kalenić pijaci (srdačna, nudi da probaš)",
             "open": "Izvolite, sve je domaće! Šta vam treba?", "goal": {"sr": "Kupi paprike i pitaj za cenu", "ru": "Купите перец и спросите цену", "en": "Buy peppers and ask the price"}},
  "kafana": {"title": {"sr": "Kafana", "ru": "Кафана", "en": "Kafana"}, "who": "konobar u kafani u Skadarliji (duhovit, preporučuje jela)",
             "open": "Dobro veče! Šta ćete da popijete?", "goal": {"sr": "Naruči jelo i traži račun", "ru": "Закажите еду и попросите счёт", "en": "Order food and ask for the bill"}},
  "lekar": {"title": {"sr": "Kod lekara", "ru": "У врача", "en": "At the doctor"}, "who": "lekarka opšte prakse u domu zdravlja (smirena, postavlja pitanja)",
            "open": "Dobar dan, izvolite, sedite. Šta vas muči?", "goal": {"sr": "Objasni šta te boli", "ru": "Объясните, что болит", "en": "Explain what hurts"}},
  "komsija": {"title": {"sr": "Komšija", "ru": "Сосед", "en": "Neighbour"}, "who": "stariji komšija iz zgrade (radoznao, priča o kraju)",
              "open": "E, dobar dan, komšija! Vi ste novi u zgradi?", "goal": {"sr": "Upoznaj komšiju", "ru": "Познакомьтесь с соседом", "en": "Get to know the neighbour"}},
}
LANGNAME = {"ru": "Russian", "en": "English", "sr": "Serbian"}

def talk_system(sc: dict, ui: str) -> str:
    return f"""You are role-playing in Belgrade as: {sc['who']}. You talk with a learner of Serbian (level A1–A2).
Rules:
- Stay in character. Reply in natural, simple spoken Serbian, LATIN script only, 1–2 short sentences (max 22 words).
- Keep the conversation moving toward this goal: {sc['goal']['en']}. Ask one simple question back.
- If the learner's last message has a real grammar or word mistake, give ONE correction: the wrong fragment and the corrected fragment, plus a very short explanation in {LANGNAME[ui]}. Never invent mistakes. If it is fine, correction is null.
- "translation": REQUIRED — your reply fully translated into {LANGNAME[ui]}{" (use an empty string, the learner speaks Serbian)" if ui == "sr" else ", never empty"}.
- "hint": one short example of what the learner could say next, in Serbian Latin.
- "done": true only when the goal is clearly reached.
Answer ONLY as JSON: {{"reply": str, "translation": str, "correction": {{"wrong": str, "right": str, "why": str}} | null, "hint": str, "done": bool}}"""

app = FastAPI(title="Pričko")
app.mount("/media", StaticFiles(directory=MEDIA), name="media")

@app.middleware("http")
async def nocache(request: Request, call_next):
    resp = await call_next(request)
    if request.url.path in ("/", "/index.html"): resp.headers["Cache-Control"] = "no-cache"
    return resp

@app.get("/api/health")
async def health(): return {"ok": True, "groq": bool(GROQ), "mistral": bool(MISTRAL), "models": [m for _, _, m in LLMS]}

@app.get("/api/scenarios")
async def scenarios():
    return [{"id": k, "title": v["title"], "goal": v["goal"], "open": v["open"]} for k, v in SCENARIOS.items()]

@app.post("/api/talk")
async def talk(scenario: str = Form(...), history: str = Form("[]"), ui: str = Form("ru"), text: str = Form(""),
               audio: Optional[UploadFile] = File(None), x_device: str = Header("anon")):
    sc = SCENARIOS.get(scenario)
    if not sc: raise HTTPException(404, "scenario")
    ui = ui if ui in LANGNAME else "ru"
    take(x_device[:64], "talk", TALK_PER_DAY)
    heard = text.strip()
    if audio is not None:
        data = await audio.read()
        if len(data) > 8_000_000: raise HTTPException(413, "audio_too_big")
        heard = await stt(data, audio.filename or "rec.m4a", prompt=f"Razgovor na srpskom latinicom. {sc['open']} {sc['goal']['sr']}.")
    heard = lat(heard)
    if not heard: return {"heard": "", "empty": True}
    try: hist = json.loads(history)[-12:]
    except Exception: hist = []
    msgs = [{"role": "assistant", "content": sc["open"]}]
    for h in hist:
        if h.get("role") in ("user", "assistant") and h.get("text"): msgs.append({"role": h["role"], "content": str(h["text"])[:400]})
    msgs.append({"role": "user", "content": heard})
    out = await llm(talk_system(sc, ui), msgs, max_tokens=500)
    reply = lat(str(out.get("reply", "")).strip()) or "Izvinite, možete li da ponovite?"
    corr = out.get("correction") if isinstance(out.get("correction"), dict) else None
    if corr and not (corr.get("wrong") and corr.get("right")): corr = None
    if corr: corr = {"wrong": lat(corr["wrong"]), "right": lat(corr["right"]), "why": str(corr.get("why", ""))}
    url = await tts(reply, VOICE_TALK, "-8%")
    return {"heard": heard, "reply": reply, "translation": "" if ui == "sr" else str(out.get("translation", "")),
            "correction": corr, "hint": lat(str(out.get("hint", ""))), "done": bool(out.get("done")), "audio": url}

@app.post("/api/say")
async def say(payload: dict):
    t = lat(str(payload.get("text", ""))[:400]).strip()
    if not t: raise HTTPException(400, "text")
    return {"audio": await tts(t, VOICE_TALK, "-15%")}

WORLDS = {"dragons": "a friendly dragon and a castle", "space": "a rocket trip to the Moon above Belgrade",
          "sea": "an underwater adventure in the Danube with fish", "forest": "talking animals in a magical forest",
          "football": "a football match with magical friends", "princess": "a brave princess and a secret garden"}

@app.post("/api/story")
async def story(payload: dict, x_device: str = Header("anon")):
    name = str(payload.get("name", "")).strip()[:30]
    if not name: raise HTTPException(400, "name")
    age = max(2, min(12, int(payload.get("age", 5) or 5)))
    gender = "girl" if payload.get("gender") == "f" else "boy"
    likes = ", ".join([str(x)[:30] for x in payload.get("likes", [])][:5])
    world = WORLDS.get(payload.get("world"), WORLDS["dragons"])
    ui = payload.get("ui") if payload.get("ui") in LANGNAME else "ru"
    take(x_device[:64], "story", STORY_PER_DAY)
    words = "simple short sentences, very common words" if age <= 5 else "simple sentences, everyday words"
    system = f"""You write warm bedtime stories in Serbian (LATIN script only) for a {age}-year-old {gender} named {name}.
The child is the hero. Theme: {world}. The child loves: {likes or 'playing'}.
Style: {words}; gentle, funny, safe, no scary or violent parts; ends calmly so the child can fall asleep. 7 short paragraphs, 2–3 sentences each.
Also pick 5 useful Serbian words from the story with translations to {LANGNAME[ui] if ui!='sr' else 'Russian'}.
Answer ONLY as JSON: {{"title": str, "paragraphs": [str], "words": [{{"sr": str, "tr": str}}]}}"""
    out = await llm(system, [{"role": "user", "content": f"Napiši priču za {name}."}], max_tokens=1600, temperature=0.9)
    paras = [lat(str(p).strip()) for p in out.get("paragraphs", []) if str(p).strip()][:9]
    if len(paras) < 3: raise HTTPException(503, "ai_busy")
    title = lat(str(out.get("title", f"Priča za {name}")))
    url = await tts(title + ". " + " ".join(paras), VOICE_STORY, "-12%", "s_")
    sid = uuid.uuid4().hex[:12]
    data = {"id": sid, "title": title, "paragraphs": paras, "words": out.get("words", [])[:6], "audio": url,
            "name": name, "world": payload.get("world", "dragons"), "created": int(time.time())}
    with db() as c: c.execute("INSERT INTO stories VALUES(?,?,?,?)", (sid, x_device[:64], data["created"], json.dumps(data, ensure_ascii=False)))
    return data

@app.get("/api/stats")
async def stats():
    with db() as c:
        rows = c.execute("SELECT kind,provider,SUM(ok) ok,COUNT(*) n,AVG(ms) ms FROM events WHERE ts>? GROUP BY kind,provider", (int(time.time())-86400,)).fetchall()
    return [dict(r) for r in rows]

@app.get("/")
async def index():
    f = SITE / "index.html"
    return FileResponse(f) if f.exists() else JSONResponse({"pricko": "ok"})

async def cleanup():
    while True:
        now = time.time()
        for f in MEDIA.glob("*.mp3"):
            try:
                keep = 60 if f.name.startswith("s_") else 3
                if f.stat().st_mtime < now - keep * 86400: f.unlink()
            except Exception: pass
        await asyncio.sleep(6 * 3600)

async def rediscover():
    while True:
        await discover(); await asyncio.sleep(6 * 3600)

@app.on_event("startup")
async def _start():
    asyncio.create_task(cleanup()); asyncio.create_task(rediscover())
