# Pričko

Сербский через разговор и сказки. Приложение (Expo, `app/`), сервер (FastAPI, `server/`), сайт-обложка (`site/`).

- Сервер: `/opt/pricko`, служба `pricko-api`, порт 8077. Обновление: `cd /opt/pricko && git pull && bash tools/install.sh`.
- ИИ на бесплатных лимитах: Groq (Whisper + модели) → Mistral запасным, озвучка edge-tts (sr-RS-SophieNeural).
- Отчёт проверки сервера: `reports/selftest.json` (пишет сам сервер при установке).
- iPhone: источник SideStore — https://github.com/Masonq/Pricko/releases/download/latest/sidestore.json
- Android: https://github.com/Masonq/Pricko/releases/download/latest/pricko.apk
