#!/bin/bash
cd /home/z/my-project

# Kill any existing instances
pkill -f "next dev -p 3000" 2>/dev/null
pkill -f "chat-service/index" 2>/dev/null
pkill -f "bun.*index.ts" 2>/dev/null
sleep 2

# Start the Socket.IO chat service with auto-restart
(
  cd /home/z/my-project/mini-services/chat-service
  while true; do
    bun index.ts >> /tmp/chat-svc.log 2>&1
    echo "[$(date)] Chat service exited, restarting in 3s..." >> /tmp/chat-svc.log
    sleep 3
  done
) &

# Give chat service time to start
sleep 2

# Start the Next.js server (main process - keeps container alive)
exec node node_modules/.bin/next dev -p 3000
