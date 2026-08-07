#!/usr/bin/env node
/**
 * Zero-JS production server.
 *
 * Every feature of this storefront works without client-side JavaScript:
 * server-action forms degrade to plain MPA POSTs, facets/sort/pagination are
 * links, menus and the slider are CSS-only. So we strip Next's hydration
 * scripts from HTML responses entirely — TBT becomes ~0 and pages are pure
 * HTML+CSS.
 *
 * Behavior is driven by config.yaml (javascript.mode / hydratePaths) — the
 * same file src/lib/config.ts reads, so rendered island tags always agree
 * with what this server strips. Env overrides: JS_MODE=zero|hybrid|full,
 * HYDRATE_PATHS=/a,/b (KEEP_JS=1 is a legacy alias for JS_MODE=full).
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { parse as parseYaml } from 'yaml';
import next from 'next';

const port = Number(process.env.PORT ?? 3000);

let yamlConfig = {};
try {
  yamlConfig = parseYaml(readFileSync(new URL('./config.yaml', import.meta.url), 'utf8')) ?? {};
} catch {
  // missing config file → defaults
}

const envMode = process.env.KEEP_JS === '1' ? 'full' : process.env.JS_MODE;
const jsMode = ['zero', 'hybrid', 'full'].includes(envMode ?? '') ? envMode : yamlConfig.javascript?.mode ?? 'hybrid';
const keepJs = jsMode === 'full';
const hydratePathPrefixes = jsMode === 'zero'
  ? []
  : (process.env.HYDRATE_PATHS?.split(',').map((prefix) => prefix.trim()).filter(Boolean))
    ?? yamlConfig.javascript?.hydratePaths ?? [];

function needsHydration(url) {
  return hydratePathPrefixes.some((prefix) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`));
}
const app = next({ dev: false });
const handleRequest = app.getRequestHandler();

const scriptTag = /<script\b[^>]*>[\s\S]*?<\/script>/g;
const scriptPreload = /<link[^>]+(?:rel="preload"[^>]+as="script"|as="script"[^>]+rel="preload")[^>]*>/g;

/**
 * Removes external framework/page bundle scripts (`<script src="...">`) —
 * these are the actual megabyte-sized hydration cost. Inline scripts (no
 * `src`) are always kept: React's streaming SSR emits tiny inline glue for
 * out-of-order Suspense flushes (`$RC(...)` reveal calls that un-hide content
 * streamed later in the document) and RSC flight-data pushes
 * (`self.__next_f.push(...)`) — neither needs the client bundle to run, but
 * without the reveal call any Suspense-wrapped region (Header, Footer,
 * product rails, listings) stays permanently hidden. `data-island` scripts
 * (vanilla-JS islands) are also always kept regardless of `src`.
 */
function stripScripts(html) {
  return html
    .replace(scriptTag, (tag) => {
      const openTag = tag.slice(0, tag.indexOf('>') + 1);
      const isExternal = /\bsrc=/.test(openTag);
      const isIsland = /\bdata-island\b/.test(openTag);
      return !isExternal || isIsland ? tag : '';
    })
    .replace(scriptPreload, '');
}

const compressibleTypes = /^(text\/|application\/(json|xml|javascript))/;

/** Buffers a response so HTML can be rewritten, then gzips text output. */
function interceptResponse(request, response) {
  const chunks = [];
  const originalWrite = response.write.bind(response);
  const originalEnd = response.end.bind(response);
  const originalWriteHead = response.writeHead.bind(response);
  let intercept = null;                     // decided on first write (headers are set by then)

  const decide = () => {
    if (intercept === null) {
      intercept = compressibleTypes.test(String(response.getHeader('content-type') ?? ''));
      if (intercept) response.removeHeader('content-length');
    }
    return intercept;
  };

  response.writeHead = (status, ...rest) => {
    response.statusCode = status;
    if (decide()) return response;          // defer header flush until end()
    return originalWriteHead(status, ...rest);
  };

  response.write = (chunk, ...rest) => {
    if (decide()) {
      if (chunk) chunks.push(Buffer.from(chunk));
      return true;
    }
    return originalWrite(chunk, ...rest);
  };

  response.end = (chunk, ...rest) => {
    if (typeof chunk === 'function') return originalEnd(chunk);
    if (!decide()) return originalEnd(chunk, ...rest);
    if (chunk) chunks.push(Buffer.from(chunk));

    let body = Buffer.concat(chunks);
    const contentType = String(response.getHeader('content-type') ?? '');
    if (!keepJs && contentType.includes('text/html') && !needsHydration(request.url ?? '')) {
      body = Buffer.from(stripScripts(body.toString('utf8')));
    }
    if ((request.headers['accept-encoding'] ?? '').includes('gzip')) {
      body = gzipSync(body);
      response.setHeader('content-encoding', 'gzip');
    }
    response.setHeader('content-length', body.length);
    originalWriteHead(response.statusCode);
    return originalEnd(body);
  };
}

await app.prepare();
createServer((request, response) => {
  interceptResponse(request, response);
  handleRequest(request, response);
}).listen(port, () => {
  const modeLabel = jsMode === 'hybrid' ? `hybrid, hydrated: ${hydratePathPrefixes.join(', ') || '(none)'}` : jsMode;
  console.log(`storefront ready on :${port} (js: ${modeLabel})`);
});
