/**
 * Vercel serverless handler source — esbuild bundles this (server/app.ts and
 * every import, including @google/genai) into api/dist.cjs during the build
 * (see scripts/build-api.mjs). At runtime Node loads api/dist.cjs directly
 * (CommonJS, zero imports) via the generated api/index.js shim.
 */
import type { Request, Response } from 'express';
import { buildApp } from '../server/app';

const app = buildApp();

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
