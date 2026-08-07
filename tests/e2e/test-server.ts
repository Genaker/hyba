import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const gatewayRoot = fileURLToPath(new URL('../../../gateway', import.meta.url));

export interface TestServer {
  baseUrl: string;
  stop: () => void;
}

async function waitForOk(url: string, deadlineMs: number): Promise<void> {
  const deadline = Date.now() + deadlineMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(200);
  }
  throw new Error(`${url} did not become ready in time: ${lastError}`);
}

/**
 * Boots the real production server.mjs on a dedicated port for e2e tests,
 * plus its own gateway instance on `port + 4000` — the storefront has no
 * bundled data at all (the gateway is the only data source), so a gateway
 * is a hard prerequisite of every page render. Requires `npm run build` first.
 */
export async function startTestServer(port: number, env: Record<string, string> = {}): Promise<TestServer> {
  const gatewayPort = port + 4000;
  const gateway: ChildProcess = spawn('node', ['--experimental-strip-types', 'bin/gateway.ts'], {
    cwd: gatewayRoot,
    env: { ...process.env, GATEWAY_PORT: String(gatewayPort) },
    stdio: 'pipe',
  });

  const app: ChildProcess = spawn('node', ['server.mjs'], {
    cwd: appRoot,
    env: { ...process.env, PORT: String(port), GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`, ...env },
    stdio: 'pipe',
  });

  const stop = () => {
    app.kill('SIGTERM');
    gateway.kill('SIGTERM');
  };

  const baseUrl = `http://localhost:${port}`;
  try {
    await waitForOk(`http://127.0.0.1:${gatewayPort}/api/status`, 15_000);
    await waitForOk(baseUrl, 20_000);
  } catch (error) {
    stop();
    throw new Error(`server on :${port} (gateway :${gatewayPort}) did not become ready: ${error}`);
  }
  return { baseUrl, stop };
}
