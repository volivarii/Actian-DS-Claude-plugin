#!/bin/bash
# Ensure an HTTP server is running on the specified port, serving the specified directory.
# Usage: ensure-server.sh <directory> [port]
#
# Behavior:
#   1. If nothing is on the port → starts a server
#   2. If a server is already serving the right directory → reuses it
#   3. If a server is serving a different directory → kills it and starts fresh
#   4. Returns the base URL on stdout

DIR="${1:-.}"
PORT="${2:-8765}"
DIR_ABS="$(cd "$DIR" 2>/dev/null && pwd)"

if [ -z "$DIR_ABS" ]; then
  echo "Error: directory '$DIR' does not exist" >&2
  exit 1
fi

# Check if something is already on this port
EXISTING_PIDS=$(lsof -ti :"$PORT" 2>/dev/null)

if [ -n "$EXISTING_PIDS" ]; then
  # Verify the existing server is serving from the correct directory
  # by checking its cwd matches our target directory
  REUSE=false
  FIRST_PID=$(echo "$EXISTING_PIDS" | head -1)
  SERVER_CWD=$(lsof -p "$FIRST_PID" 2>/dev/null | awk '$4 == "cwd" {print $NF}')

  if [ "$SERVER_CWD" = "$DIR_ABS" ]; then
    PID_COUNT=$(echo "$EXISTING_PIDS" | wc -l | tr -d ' ')
    if [ "$PID_COUNT" -le 1 ]; then
      # Same directory, single process — reuse
      echo "http://localhost:$PORT"
      exit 0
    fi
  fi

  # Wrong directory or duplicate processes — kill and restart
  echo "$EXISTING_PIDS" | xargs kill 2>/dev/null
  sleep 1
  REMAINING=$(lsof -ti :"$PORT" 2>/dev/null)
  if [ -n "$REMAINING" ]; then
    echo "$REMAINING" | xargs kill -9 2>/dev/null
    sleep 0.5
  fi
fi

# Start a new server (custom handler with annotation POST endpoint)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_LOG="/tmp/preview-server-$PORT.log"
# Resolve node binary — Desktop sandbox may not have it in PATH
source "$SCRIPT_DIR/../lib/resolve-node.sh"
# Fallback: if resolve-node.sh was unavailable/didn't set NODE_BIN, try PATH directly.
if [ -z "$NODE_BIN" ]; then NODE_BIN="$(command -v node 2>/dev/null || echo "")"; fi
if [ -z "$NODE_BIN" ]; then
  echo "Error: node not found (resolve-node.sh unavailable and node not in PATH). Install Node.js or set NODE_BIN." >&2
  exit 1
fi
# Use nohup + disown to ensure the server survives after this script exits.
# On Desktop (Cowork), background processes get killed when the parent bash exits.
nohup "$NODE_BIN" "$SCRIPT_DIR/preview-server.js" "$PORT" "$DIR_ABS" > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null

# Wait for it to be ready
for i in 1 2 3 4 5; do
  # Check if the process died
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Error: preview-server.js crashed on startup. Log: $SERVER_LOG" >&2
    cat "$SERVER_LOG" >&2
    exit 1
  fi
  if curl -s -o /dev/null "http://localhost:$PORT/" 2>/dev/null; then
    echo "http://localhost:$PORT"
    exit 0
  fi
  sleep 0.5
done

echo "Error: server failed to start on port $PORT (PID $SERVER_PID). Log: $SERVER_LOG" >&2
cat "$SERVER_LOG" >&2
exit 1
