import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { expect, it } from 'vitest';

it('serves the built local application over MCP', async () => {
  const server = spawn(process.execPath, [new URL('../dist/server.mjs', import.meta.url).pathname], {
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'],
  });
  const client = new Client({ name: 'local-game-test', version: '0.0.0' });
  try {
    const url = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No local endpoint')), 10_000);
      server.stdout.on('data', (chunk: Buffer) => {
        const endpoint = /endpoint: (\S+)/.exec(chunk.toString())?.[1];
        if (endpoint) { clearTimeout(timer); resolve(endpoint); }
      });
      server.once('exit', () => { clearTimeout(timer); reject(new Error('Server exited')); });
      server.once('error', (error) => { clearTimeout(timer); reject(error); });
    });
    await client.connect(new StreamableHTTPClientTransport(new URL(url)));
    expect((await client.listTools()).tools.map((tool) => tool.name).sort()).toEqual(['get_game', 'new_game', 'play_move', 'show_game']);
    const created = await client.callTool({ name: 'new_game', arguments: {} });
    expect(created.isError).not.toBe(true);
    expect(created.structuredContent).toHaveProperty('game');
  } finally {
    await client.close();
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
  }
}, 20_000);
