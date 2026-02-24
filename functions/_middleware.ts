/**
 * Cloudflare Pages middleware — HTTP Basic Auth
 *
 * Protects the entire site with a username/password prompt.
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

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env, next } = context;

  // If no password is configured, skip auth (allows open access in dev)
  if (!env.SITE_PASSWORD) {
    return next();
  }

  const expectedUsername = env.SITE_USERNAME || 'admin';
  const expectedPassword = env.SITE_PASSWORD;

  const authorization = request.headers.get('Authorization');

  if (authorization) {
    const [scheme, encoded] = authorization.split(' ');

    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const [username, password] = decoded.split(':');

      if (username === expectedUsername && password === expectedPassword) {
        return next();
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Aiva Docs", charset="UTF-8"',
    },
  });
};
