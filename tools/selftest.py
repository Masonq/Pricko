"""Живая проверка провайдеров на сервере. Пишет отчёт в reports/ (ключи не выводятся)."""
import asyncio, json, sys, time, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "server"))
import app as A
R = pathlib.Path(__file__).resolve().parent.parent / "reports"; R.mkdir(exist_ok=True)
async def main():
    res = {"time": time.strftime("%Y-%m-%d %H:%M:%S"), "keys": {"groq": bool(A.GROQ), "mistral": bool(A.MISTRAL)}}
    await A.discover(); res["cascade"] = [f"{p}:{m}" for p, _, m in A.LLMS]
    full = list(A.LLMS); res["llm"] = {}
    for item in full:
        A.LLMS = [item]; t0 = time.time()
        try:
            out = await A.llm(A.talk_system(A.SCENARIOS["pekara"], "ru"), [{"role": "assistant", "content": "Dobar dan! Izvolite?"}, {"role": "user", "content": "Jedan burek sa sir, molim."}], max_tokens=300)
            res["llm"][item[2]] = f"ok {int((time.time()-t0)*1000)}ms " + json.dumps(out, ensure_ascii=False)[:220]
        except Exception as e:
            with A.db() as c: note = c.execute("SELECT note FROM events WHERE kind='llm' AND provider=? ORDER BY ts DESC LIMIT 1", (f"{item[0]}:{item[2]}",)).fetchone()
            res["llm"][item[2]] = f"ошибка {getattr(e, 'detail', e)}: {note['note'][:160] if note else ''}"
        await asyncio.sleep(1.2)
    A.LLMS = full
    url = await A.tts("Dobar dan! Jedan burek sa sirom, molim.", A.VOICE_TALK)
    rows = []
    with A.db() as c: rows = [dict(r) for r in c.execute("SELECT provider, ok, note FROM events WHERE kind='tts' ORDER BY ts DESC LIMIT 2")]
    res["tts"] = {"url": url, "attempts": rows}
    if url:
        import difflib
        f = A.MEDIA / url.split("/")[-1]; want = "dobar dan jedan burek sa sirom molim"; res["stt"] = {}; best = (0, "hr")
        for lang in ("sr", "hr", "bs", "auto"):
            try:
                got = await A.stt(f.read_bytes(), f.name, lang=lang, prompt="Razgovor na srpskom latinicom. Dobar dan! Izvolite?")
                score = difflib.SequenceMatcher(None, want, "".join(ch for ch in got.lower() if ch.isalpha() or ch == " ")).ratio()
                res["stt"][lang] = f"{score:.2f} {got}"; best = max(best, (score, lang))
            except Exception as e: res["stt"][lang] = f"ошибка {getattr(e, 'detail', e)}"
            await asyncio.sleep(3.2)
        (A.DATA / "stt_lang.txt").write_text(best[1]); res["stt_choice"] = best[1]
    (R / "selftest.json").write_text(json.dumps(res, ensure_ascii=False, indent=2))
asyncio.run(main())
