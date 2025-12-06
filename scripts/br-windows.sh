#!/usr/bin/env bash
# BR Windows - Local Static Server for BlackRoad Pages
#
# Usage:
#   ./br-windows.sh start [window]    # Start a window or all
#   ./br-windows.sh stop [window]     # Stop a window or all
#   ./br-windows.sh status            # Show all window status
#   ./br-windows.sh list              # List available windows
#
# @owner Alexa Louise Amundson
# @system BlackRoad OS

PAGES_DIR="${HOME}/blackroad-os-operator/pages"
PID_DIR="${HOME}/.br-windows"
mkdir -p "$PID_DIR"

# Window configuration (name:port:folder)
WINDOW_CONFIG="
portals:4100:portals-unified
dashboard:4101:dashboard
console:4102:console
studio:4103:studio
finance:4104:finance
devops:4105:devops
education:4106:education
research:4107:research
creator:4108:creator
ideas:4109:ideas
legal:4110:legal
brands:4111:brands
assets:4112:assets
"

get_port() {
  echo "$WINDOW_CONFIG" | grep "^$1:" | cut -d: -f2
}

get_folder() {
  echo "$WINDOW_CONFIG" | grep "^$1:" | cut -d: -f3
}

get_all_windows() {
  echo "$WINDOW_CONFIG" | grep -v '^$' | cut -d: -f1
}

start_window() {
  local name=$1
  local port=$(get_port "$name")
  local folder=$(get_folder "$name")
  local path="${PAGES_DIR}/${folder}"
  local pid_file="${PID_DIR}/${name}.pid"

  if [ -z "$port" ]; then
    echo "Unknown window: $name"
    echo "Run: $0 list"
    return 1
  fi

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "[$name] Already running on port $port (PID: $(cat "$pid_file"))"
    return 0
  fi

  if [ ! -d "$path" ]; then
    echo "[$name] Folder not found: $path"
    return 1
  fi

  # Start Python HTTP server in background
  cd "$path" || return 1
  python3 -m http.server "$port" --bind 127.0.0.1 > /dev/null 2>&1 &
  local pid=$!
  echo $pid > "$pid_file"

  sleep 0.5
  if kill -0 $pid 2>/dev/null; then
    echo "[$name] Started on http://localhost:$port (PID: $pid)"
  else
    echo "[$name] Failed to start"
    rm -f "$pid_file"
    return 1
  fi
}

stop_window() {
  local name=$1
  local pid_file="${PID_DIR}/${name}.pid"

  if [ ! -f "$pid_file" ]; then
    echo "[$name] Not running"
    return 0
  fi

  local pid=$(cat "$pid_file")
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "[$name] Stopped (PID: $pid)"
  else
    echo "[$name] Process already dead"
  fi
  rm -f "$pid_file"
}

show_status() {
  echo "═══════════════════════════════════════════════════════════"
  echo "  BR Windows Status"
  echo "═══════════════════════════════════════════════════════════"
  printf "%-15s %-8s %-10s %-30s\n" "WINDOW" "PORT" "STATUS" "URL"
  echo "───────────────────────────────────────────────────────────"

  for name in $(get_all_windows); do
    local port=$(get_port "$name")
    local pid_file="${PID_DIR}/${name}.pid"
    local status="stopped"
    local url="-"

    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
      status="running"
      url="http://localhost:$port"
    fi

    printf "%-15s %-8s %-10s %-30s\n" "$name" "$port" "$status" "$url"
  done | sort
  echo "═══════════════════════════════════════════════════════════"
}

list_windows() {
  echo "Available BR Windows:"
  echo ""
  for name in $(get_all_windows); do
    local port=$(get_port "$name")
    local folder=$(get_folder "$name")
    printf "  %-15s port %-5s  → pages/%s\n" "$name" "$port" "$folder"
  done | sort
}

start_all() {
  echo "Starting all BR Windows..."
  for name in $(get_all_windows); do
    start_window "$name"
  done
}

stop_all() {
  echo "Stopping all BR Windows..."
  for name in $(get_all_windows); do
    stop_window "$name"
  done
}

# Main command handler
case "${1:-status}" in
  start)
    if [ -n "$2" ]; then
      start_window "$2"
    else
      start_all
    fi
    ;;
  stop)
    if [ -n "$2" ]; then
      stop_window "$2"
    else
      stop_all
    fi
    ;;
  restart)
    if [ -n "$2" ]; then
      stop_window "$2"
      sleep 1
      start_window "$2"
    else
      stop_all
      sleep 1
      start_all
    fi
    ;;
  status)
    show_status
    ;;
  list)
    list_windows
    ;;
  open)
    name="${2:-portals}"
    port=$(get_port "$name")
    if [ -n "$port" ]; then
      open "http://localhost:$port"
    else
      echo "Unknown window: $name"
    fi
    ;;
  *)
    echo "BR Windows - Local Server Manager"
    echo ""
    echo "Usage:"
    echo "  $0 start [window]    Start window(s)"
    echo "  $0 stop [window]     Stop window(s)"
    echo "  $0 restart [window]  Restart window(s)"
    echo "  $0 status            Show status"
    echo "  $0 list              List available windows"
    echo "  $0 open [window]     Open window in browser"
    echo ""
    list_windows
    ;;
esac
