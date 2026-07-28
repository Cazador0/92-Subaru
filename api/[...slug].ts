/**
 * Vercel serverless entry point — catches every /api/* route and delegates
 * to the shared handler in server/api.ts (same code the local Deno server
 * runs, spec FR-016). Runtime: vercel-deno (see vercel.json).
 */

import { handleApi } from "../server/api.ts";

export default (req: Request): Promise<Response> | Response => handleApi(req);
