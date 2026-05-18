import type { NextRequest } from 'next/server';

/**
 * Runtime API proxy: forwards /api/* to the API service at REQUEST time, so a
 * prebuilt (GHCR) web image is portable — the target is read from the runtime
 * env, not baked at build (unlike next.config rewrites). Same-origin from the
 * browser → no CORS.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HOP_BY_HOP = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'accept-encoding',
  'content-encoding',
]);

function target(): string {
  return process.env.API_PROXY_TARGET ?? 'http://localhost:3001';
}

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const url = `${target()}/${path.join('/')}${new URL(req.url).search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      ...(hasBody ? { body: await req.arrayBuffer() } : {}),
      redirect: 'manual',
    });
  } catch {
    return new Response(JSON.stringify({ message: 'Upstream API unreachable' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out.set(key, value);
  });
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };
const handler = async (req: NextRequest, ctx: Ctx): Promise<Response> =>
  proxy(req, (await ctx.params).path);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
