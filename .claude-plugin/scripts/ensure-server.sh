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
EXISTING_PID=$(lsof -ti :"$PORT" 2>/dev/null | head -1)

if [ -n "$EXISTING_PID" ]; then
  # Check if it's our Python HTTP server and what directory it's serving
  EXISTING_CWD=$(lsof -p "$EXISTING_PID" -Fn 2>/dev/null | grep '^n/' | grep 'cwd' | head -1 | sed 's/^n//')

  # Also try via /proc or lsof working directory
  if [ -z "$EXISTING_CWD" ]; then
    EXISTING_CWD=$(lsof -p "$EXISTING_PID" -Fd 2>/dev/null | grep -A1 'cwd' | tail -1 | sed 's/^n//')
  fi

  # Try pwdx on Linux or lsof cwd on macOS
  if [ -z "$EXISTING_CWD" ]; then
    EXISTING_CWD=$(lsof -a -p "$EXISTING_PID" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//')
  fi

  # Test if the server is actually serving our files
  TEST_FILE=$(ls "$DIR_ABS"/*.html "$DIR_ABS"/**/*.html 2>/dev/null | head -1)
  if [ -n "$TEST_FILE" ]; then
    REL_PATH="${TEST_FILE#$DIR_ABS/}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/$REL_PATH" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
      # Server is already serving our content
      echo "http://localhost:$PORT"
      exit 0
    fi
  fi

  # Server exists but serves different content — kill it
  kill "$EXISTING_PID" 2>/dev/null
  sleep 1
  # Force kill if still running
  kill -9 "$EXISTING_PID" 2>/dev/null 2>&1
  sleep 0.5
fi

# Start a new server
cd "$DIR_ABS" && python3 -m http.server "$PORT" &>/dev/null &
SERVER_PID=$!

# Wait for it to be ready
for i in 1 2 3 4 5; do
  if curl -s -o /dev/null "http://localhost:$PORT/" 2>/dev/null; then
    echo "http://localhost:$PORT"
    exit 0
  fi
  sleep 0.5
done

echo "Error: server failed to start on port $PORT" >&2
exit 1
