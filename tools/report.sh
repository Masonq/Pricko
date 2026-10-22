#!/usr/bin/env bash
# Диагностика: последние события ИИ и ошибки службы → reports/diag.txt → git (ключи не попадают)
cd /opt/pricko
{
  echo "== $(date '+%F %T')"; systemctl is-active pricko-api
  echo "== последние события (ИИ, распознавание, озвучка)"
  .venv/bin/python - <<'PY'
import sqlite3,time
c=sqlite3.connect('/opt/pricko/data/pricko.db')
for r in c.execute("SELECT ts,kind,provider,ok,ms,note FROM events ORDER BY ts DESC LIMIT 40"):
    print(time.strftime('%H:%M:%S',time.localtime(r[0])),r[1],r[2],'OK' if r[3] else 'ОШИБКА',f'{r[4]}ms',(r[5] or '')[:160])
print('== запросы к /api/talk по устройствам сегодня')
for r in c.execute("SELECT device,kind,n FROM usage WHERE day=date('now','localtime')"): print(r)
PY
  echo "== журнал службы (последние 60 строк)"
  journalctl -u pricko-api -n 60 --no-pager -o cat | sed -E 's/(gsk_|Bearer )[A-Za-z0-9_-]+/\1***/g'
} > reports/diag.txt 2>&1
git add reports >/dev/null 2>&1; git -c user.name=pricko-server -c user.email=server@pricko.local commit -qm "Диагностика сервера" >/dev/null 2>&1; git push -q origin HEAD:main >/dev/null 2>&1
echo "Отчёт отправлен в git."
