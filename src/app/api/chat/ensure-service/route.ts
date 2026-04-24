// API route that ensures the Socket.IO chat service is running
// Called by the client on app load. Spawns the chat service as a child process
// of the Next.js server if it's not already running.

import { NextResponse } from 'next/server';

// Track the chat service process across hot-reloads
let chatServiceProcess: ReturnType<typeof import('child_process').spawn> | null = null;
let isStarting = false;

export async function GET() {
  try {
    // Check if port 3003 is already in use
    const { createConnection } = await import('net');
    const isPortOpen = await new Promise<boolean>((resolve) => {
      const client = createConnection({ port: 3003, host: '127.0.0.1' }, () => {
        client.destroy();
        resolve(true); // Port is in use = service is running
      });
      client.on('error', () => resolve(false)); // Port not in use = service not running
      client.setTimeout(1000, () => { client.destroy(); resolve(false); });
    });

    if (isPortOpen) {
      return NextResponse.json({ status: 'running', port: 3003 });
    }

    // Start the chat service if not already starting
    if (isStarting) {
      return NextResponse.json({ status: 'starting', port: 3003 });
    }

    isStarting = true;
    const { spawn } = await import('child_process');
    const path = await import('path');

    const chatServicePath = path.join(process.cwd(), 'mini-services', 'chat-service');

    console.log('[Chat Service] Starting Socket.IO chat service on port 3003...');

    const child = spawn('bun', ['index.ts'], {
      cwd: chatServicePath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    child.stdout.on('data', (data: Buffer) => {
      console.log(`[Chat Service] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data: Buffer) => {
      console.error(`[Chat Service Error] ${data.toString().trim()}`);
    });

    child.on('exit', (code: number | null) => {
      console.log(`[Chat Service] Exited with code ${code}`);
      chatServiceProcess = null;
      isStarting = false;
    });

    chatServiceProcess = child;
    isStarting = false;

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({ status: 'started', port: 3003, pid: child.pid });
  } catch (err) {
    console.error('[Chat Service] Failed to start:', err);
    return NextResponse.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
