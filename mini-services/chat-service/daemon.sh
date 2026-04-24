#!/bin/bash
cd /home/z/my-project/mini-services/chat-service
while true; do
  echo "[$(date)] Starting chat service..." >> /tmp/chat-svc-daemon.log
  bun index.ts >> /tmp/chat-svc.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Chat service exited with code $EXIT_CODE, restarting in 3s..." >> /tmp/chat-svc-daemon.log
  sleep 3
done
