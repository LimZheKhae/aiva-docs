/**
 * Cloudflare Pages middleware — HTTP Basic Auth with cookie session
 *
 * Protects the entire site with a username/password prompt.
 * After successful Basic Auth, sets a session cookie so all subsequent
 * requests (JS chunks, JSON data, etc.) are authorized without relying
 * on the browser to forward the Authorization header.
 *
 * Credentials are set via Cloudflare environment variables:
 *   - SITE_USERNAME (default: "admin")
 *   - SITE_PASSWORD (required)
 *
 * If SITE_PASSWORD is not set, the middleware is bypassed (open access).
 */

interface Env {
  SITE_USERNAME?: string;
  SITE_PASSWORD?: string;
}

type PagesContext = {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
};

const COOKIE_NAME = '__aiva_auth';
const COOKIE_MAX_AGE = 86400; // 24 hours

async function generateToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.split('=')[1] : null;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env, next } = context;

  // If no password is configured, skip auth (allows open access in dev)
  if (!env.SITE_PASSWORD) {
    return next();
  }

  const expectedUsername = env.SITE_USERNAME || 'admin';
  const expectedPassword = env.SITE_PASSWORD;
  const expectedToken = await generateToken(expectedPassword);

  // Check for valid session cookie first
  const sessionToken = getCookie(request, COOKIE_NAME);
  if (sessionToken === expectedToken) {
    return next();
  }

  // Check Basic Auth header
  const authorization = request.headers.get('Authorization');

  if (authorization) {
    const [scheme, encoded] = authorization.split(' ');

    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      // Split on first colon only — passwords may contain colons
      const colonIndex = decoded.indexOf(':');
      const username = decoded.substring(0, colonIndex);
      const password = decoded.substring(colonIndex + 1);

      if (username === expectedUsername && password === expectedPassword) {
        // Auth succeeded — serve the page and attach session cookie
        const cookie = `${COOKIE_NAME}=${expectedToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
        const response = await next();
        const newHeaders = new Headers(response.headers);
        newHeaders.append('Set-Cookie', cookie);
        newHeaders.set('Cache-Control', 'no-store');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Aiva Docs", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
};
