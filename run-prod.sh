#!/bin/bash
cd "$(dirname "$0")"

# Kill previous instance
pkill -f "node server/server.js" 2>/dev/null

# Install & build
cd client && npm install && npm run build && cd ..
cd server && npm install && cd ..

# Start
PORT="${PORT:-7888}" nohup node server/server.js > scrumpoker.log 2>&1 &
echo "Scrum Poker started on port ${PORT:-7888} (PID: $!)"
