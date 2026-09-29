#!/bin/bash
# MedHOT 本地启停脚本（医学版热点站）
# 用法：./medhot.sh start | stop | restart | status | logs
#
# 依赖（本机已装好）：
#   PostgreSQL 16.2  →  /Users/Jin/pgsql/16/bin  数据目录 .pgdata  端口 5433
#   Node 24+         →  /Users/Jin/.hermes/node/bin/node
# 三个进程：api(3001) · worker(抓取/调模型) · web(3000，网站)

set -uo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PGBIN="/Users/Jin/pgsql/16/bin"
PGDATA="$ROOT/.pgdata"
LOG="$ROOT/.logs"
PID="$ROOT/.logs/pids"
NODE="$(command -v node || echo /Users/Jin/.hermes/node/bin/node)"
mkdir -p "$LOG" "$PID"

running() { [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; }

start_pg() {
  if "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    echo "postgres 已在运行 (127.0.0.1:5433)"
  else
    "$PGBIN/pg_ctl" -D "$PGDATA" -o "-h 127.0.0.1 -p 5433" -l "$PGDATA/server.log" -w start >/dev/null && \
      echo "postgres 已启动 (127.0.0.1:5433)"
  fi
}

start_one() { # name  port  workdir  command
  local name="$1" port="$2" dir="$3" cmd="$4"
  if running "$PID/$name.pid"; then echo "$name 已在运行 (pid $(cat "$PID/$name.pid"))"; return; fi
  ( cd "$ROOT/$dir" && exec $cmd ) >"$LOG/$name.log" 2>&1 &
  echo $! > "$PID/$name.pid"
  echo "$name 已启动 (pid $!, 端口 $port, 日志 .logs/$name.log)"
}

start() {
  start_pg
  start_one api    3001 ""        "$NODE --env-file=$ROOT/.env apps/api/src/main.ts"
  start_one worker "-"  ""        "$NODE --env-file=$ROOT/.env apps/worker/src/main.ts"
  start_one web    3000 "apps/web" "npx react-router dev --port 3000 --host 127.0.0.1"
  echo
  echo "等 15 秒左右打开 http://localhost:3000 （后台 /admin，密码见 .env 的 ADMIN_PASSWORD）"
}

stop() {
  for name in web worker api; do
    if running "$PID/$name.pid"; then
      kill "$(cat "$PID/$name.pid")" 2>/dev/null && echo "$name 已停止"
      rm -f "$PID/$name.pid"
    fi
  done
  # 兜底：清掉可能残留的进程（例如用别的终端启动的）
  pkill -f "apps/api/src/main.ts" 2>/dev/null
  pkill -f "apps/worker/src/main.ts" 2>/dev/null
  pkill -f "react-router dev --port 3000" 2>/dev/null
  echo "(postgres 保持运行；要停它执行：$PGBIN/pg_ctl -D $PGDATA stop)"
}

status() {
  "$PGBIN/pg_ctl" -D "$PGDATA" status 2>&1 | head -2
  for n in api:3001 web:3000; do
    name="${n%%:*}"
    if running "$PID/$name.pid"; then echo "$name 运行中 (pid $(cat "$PID/$name.pid"))"; else echo "$name 未运行"; fi
  done
  if running "$PID/worker.pid"; then echo "worker 运行中 (pid $(cat "$PID/worker.pid"))"; else echo "worker 未运行"; fi
  echo "-- 已入库 --"
  "$PGBIN/psql" -h 127.0.0.1 -p 5433 -U postgres -d medhot -tAc \
    "select '稿件 '||count(*)||' 条 / 已处理 '||count(*) filter (where eligible or selected)||' 条' from publications;" 2>/dev/null
  "$PGBIN/psql" -h 127.0.0.1 -p 5433 -U postgres -d medhot -tAc \
    "select '精选 '||count(*)||' 条' from publications where selected;" 2>/dev/null
}

logs() { tail -n "${2:-40}" "$LOG/${1:-worker}.log"; }

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; sleep 2; start ;;
  status)  status ;;
  logs)    logs "${2:-worker}" "${3:-40}" ;;
  *) echo "用法：$0 start|stop|restart|status|logs [api|worker|web] [行数]"; exit 1 ;;
esac
