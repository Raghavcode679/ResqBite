import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';
import { buildApp } from './server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ResqBite self-hosted launcher.
 *  - dev: Vite middleware (HMR) + API from server/app.ts
 *  - production (node server.ts): static dist/ + API
 * Vercel deployment uses api/[...path].ts instead — same shared app.
 */

const app: express.Express = buildApp();
const PORT = Number(process.env.PORT) || 3000;

/**
 * Probe the OS for a free TCP port, starting at `start` and walking up to
 * `attempts` times. Used so the dev server NEVER dies with EADDRINUSE when
 * another instance (or a stale process) already holds the port.
 */
function getFreePort(start: number, attempts = 50): Promise<number> {
  return new Promise((resolve) => {
    const tryPort = (port: number, left: number) => {
      const probe = net.createServer();
      probe.once('error', () => {
        if (left > 0) tryPort(port + 1, left - 1);
        else resolve(port); // give up gracefully; listen() will surface any real error
      });
      probe.once('listening', () => {
        probe.close(() => resolve(port));
      });
      probe.listen(port, '0.0.0.0');
    };
    tryPort(start, attempts);
  });
}

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // —— Auto port selection (no more EADDRINUSE crashes) ————————————
  const preferredHttpPort = PORT;
  const httpPort = await getFreePort(preferredHttpPort, 50);

  // Vite's HMR websocket needs its own port; pick a free one automatically.
  const hmrPort = await getFreePort(24678, 50);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(process.env.DISABLE_HMR === 'true' ? { hmr: false as const } : { ws: { port: hmrPort } }),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(httpPort, '0.0.0.0', () => {
    console.log(`ResqBite server running on http://localhost:${httpPort}`);
    if (httpPort !== preferredHttpPort) {
      console.log(`  ↳ port ${preferredHttpPort} was busy — auto-shifted to ${httpPort}`);
    }
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
