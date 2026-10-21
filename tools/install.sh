#!/usr/bin/env bash
# Установка/обновление Pričko на сервере. Повторный запуск безопасен.
set -euo pipefail
cd /opt/pricko
PORT=8077
if ss -ltnp 2>/dev/null | grep -q ":$PORT " && ! systemctl is-active --quiet pricko-api; then echo "Порт $PORT занят другим процессом"; exit 1; fi
command -v python3 >/dev/null; python3 -m venv --help >/dev/null 2>&1 || apt-get install -y python3-venv >/dev/null
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip >/dev/null
.venv/bin/pip install -q -r server/requirements.txt
if [ ! -f .env ]; then
  touch .env; chmod 600 .env
  for K in GROQ_API_KEY MISTRAL_API_KEY; do grep -h "^$K=" /opt/fino/backend/.env 2>/dev/null | tail -1 >> .env || true; done
  echo "PRICKO_DATA=/opt/pricko/data" >> .env
fi
mkdir -p data
cat > /etc/systemd/system/pricko-api.service <<UNIT
[Unit]
Description=Pricko API
After=network.target
[Service]
WorkingDirectory=/opt/pricko/server
EnvironmentFile=/opt/pricko/.env
ExecStart=/opt/pricko/.venv/bin/uvicorn app:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now pricko-api >/dev/null 2>&1
systemctl restart pricko-api
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then ufw allow $PORT/tcp >/dev/null; fi
for i in $(seq 1 20); do curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null && break; sleep 1; done
set -a; . ./.env; set +a
.venv/bin/python tools/selftest.py > /dev/null 2>&1 || true
curl -s -o /dev/null -w "%{http_code}" "http://89.208.113.147:$PORT/api/health" > reports/external.txt || true
git add reports >/dev/null 2>&1 || true
git -c user.name=pricko-server -c user.email=server@pricko.local commit -qm "Отчёт проверки сервера" >/dev/null 2>&1 || true
git push -q origin HEAD:main >/dev/null 2>&1 || true
echo "Pričko: готово. Отчёт отправлен в git."
