"""Живая проверка всех провайдеров на сервере. Пишет отчёт в reports/ (ключи не выводятся)."""
import asyncio, json, os, sys, time, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "server"))
import httpx, edge_tts
import app as A
R = pathlib.Path(__file__).resolve().parent.parent / "reports"; R.mkdir(exist_ok=True)
async def main():
    res = {"time": time.strftime("%Y-%m-%d %H:%M:%S"), "keys": {"groq": bool(A.GROQ), "mistral": bool(A.MISTRAL)}, "llm": {}, "tts": None, "stt": None}
    async with httpx.AsyncClient(timeout=45) as cl:
        for prov, base, model in A.LLMS:
            k = A.key_for(prov); t0 = time.time()
            if not k: res["llm"][model] = "нет ключа"; continue
            try:
                r = await cl.post(f"{base}/chat/completions", headers={"Authorization": f"Bearer {k}"},
                    json={"model": model, "messages": [{"role": "system", "content": 'Answer ONLY JSON {"reply": str}'}, {"role": "user", "content": "Reci 'dobar dan' na srpskom, latinicom."}],
                          "max_tokens": 60, "response_format": {"type": "json_object"}})
                res["llm"][model] = f"{r.status_code} {int((time.time()-t0)*1000)}ms " + (r.json()["choices"][0]["message"]["content"][:80] if r.status_code == 200 else r.text[:160])
            except Exception as e: res["llm"][model] = f"ошибка {e}"
    mp3 = A.MEDIA / "selftest.mp3"; t0 = time.time()
    try:
        await edge_tts.Communicate("Dobar dan! Jedan burek sa sirom, molim.", A.VOICE_TALK).save(str(mp3))
        res["tts"] = f"ok {mp3.stat().st_size} байт {int((time.time()-t0)*1000)}ms"
    except Exception as e: res["tts"] = f"ошибка {e}"
    if mp3.exists() and A.GROQ:
        try: res["stt"] = "ok: " + await A.stt(mp3.read_bytes(), "selftest.mp3")
        except Exception as e: res["stt"] = f"ошибка {e}"
    (R / "selftest.json").write_text(json.dumps(res, ensure_ascii=False, indent=2))
    print(json.dumps(res, ensure_ascii=False, indent=2))
asyncio.run(main())
