#!/bin/bash
# BlackRoad Arc API Server Launcher

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$HOME/.blackroad/arc-server.log"
PID_FILE="$HOME/.blackroad/arc-server.pid"

mkdir -p "$HOME/.blackroad"

case "$1" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
      echo "Server already running (PID: $(cat $PID_FILE))"
      exit 0
    fi

    echo "Starting BlackRoad Arc API server..."
    nohup node "$SCRIPT_DIR/server.js" >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Server started (PID: $!)"
    echo "Logs: $LOG_FILE"
    ;;

  stop)
    if [ -f "$PID_FILE" ]; then
      kill $(cat "$PID_FILE") 2>/dev/null
      rm "$PID_FILE"
      echo "Server stopped"
    else
      echo "No server running"
    fi
    ;;

  restart)
    $0 stop
    sleep 1
    $0 start
    ;;

  status)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
      echo "Server running (PID: $(cat $PID_FILE))"
      curl -s http://127.0.0.1:3848/status 2>/dev/null || echo "API not responding"
    else
      echo "Server not running"
    fi
    ;;

  logs)
    tail -f "$LOG_FILE"
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
