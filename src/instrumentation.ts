// Next.js Instrumentation Hook
// Auto-starts the Socket.IO chat service when the Next.js server boots.
// Skips if port 3003 is already in use (e.g. started by daemon.sh).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Check if chat service is already running on port 3003
      const { createConnection } = await import('net');
      const isRunning = await new Promise<boolean>((resolve) => {
        const client = createConnection({ port: 3003, host: '127.0.0.1' }, () => {
          client.destroy();
          resolve(true);
        });
        client.on('error', () => resolve(false));
        client.setTimeout(1000, () => { client.destroy(); resolve(false); });
      });

      if (isRunning) {
        console.log('[Instrumentation] Chat service already running on port 3003, skipping.');
        return;
      }

      // Start the chat service
      const { spawn } = await import('child_process');
      const path = await import('path');
      const chatServicePath = path.join(process.cwd(), 'mini-services', 'chat-service');

      function startChatService() {
        console.log('[Instrumentation] Starting Socket.IO chat service on port 3003...');
        const child = spawn('bun', ['index.ts'], {
          cwd: chatServicePath,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env },
        });
        child.stdout.on('data', (data: Buffer) => console.log(`[Chat Service] ${data.toString().trim()}`));
        child.stderr.on('data', (data: Buffer) => console.error(`[Chat Service Error] ${data.toString().trim()}`));
        child.on('exit', () => setTimeout(startChatService, 5000));
        child.on('error', () => setTimeout(startChatService, 5000));
        console.log(`[Instrumentation] Chat service started (PID: ${child.pid})`);
      }

      startChatService();
    } catch (err) {
      console.error('[Instrumentation] Failed:', err);
    }
  }
}
