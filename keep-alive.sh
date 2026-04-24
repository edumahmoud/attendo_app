#!/bin/bash
cd /home/z/my-project

# Start chat service with auto-restart
(
  cd /home/z/my-project/mini-services/chat-service
  while true; do
    bun index.ts >> /tmp/chat-svc.log 2>&1
    echo "[$(date)] Chat service exited, restarting in 3s..." >> /tmp/chat-svc.log
    sleep 3
  done
) &
echo "Chat service started"

sleep 3

# Start Next.js with auto-restart
while true; do
  echo "[$(date)] Starting Next.js..." >> /tmp/keep-alive.log
  node node_modules/.bin/next dev -p 3000 >> /tmp/attendo-dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Next.js exited with code $EXIT_CODE, restarting in 5s..." >> /tmp/keep-alive.log
  sleep 5
  # Clean up .next cache on crash to prevent bad cache issues
  rm -rf .next 2>/dev/null
done
