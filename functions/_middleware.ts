/**
 * Cloudflare Pages middleware — Cookie-based auth with HTML login form
 *
 * Protects the entire site with a login page styled to match the
 * editorial theme. Uses form POST + cookie — no HTTP Basic Auth,
 * avoiding browser/CDN caching issues with 401 responses.
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
const LOGIN_PATH = '/__auth/login';
const LOGOUT_PATH = '/__auth/logout';

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

function loginPage(error?: string): Response {
  const errorHtml = error
    ? `<p class="error">${error}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sign In — Aiva Docs</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}

    body{
      font-family:'Crimson Text',Georgia,'Times New Roman',serif;
      background:#FAF9F3;
      color:#141413;
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:100vh;
      -webkit-font-smoothing:antialiased;
    }

    .card{
      background:#F3F1E8;
      border:1px solid rgba(20,20,19,0.10);
      border-radius:6px;
      padding:48px 40px;
      width:100%;
      max-width:400px;
      box-shadow:0 2px 8px rgba(20,20,19,0.06);
    }

    h1{
      font-family:'DM Sans',system-ui,sans-serif;
      font-size:1.6rem;
      font-weight:700;
      color:#141413;
      letter-spacing:-0.02em;
      margin-bottom:4px;
    }

    .subtitle{
      font-family:'DM Sans',system-ui,sans-serif;
      color:#3C3B38;
      font-size:0.92rem;
      margin-bottom:32px;
    }

    .error{
      background:hsl(0,50%,95%);
      border-left:3px solid hsl(0,56%,45%);
      color:#5C1A1A;
      padding:10px 14px;
      font-size:0.9rem;
      margin-bottom:20px;
      border-radius:4px;
    }

    label{
      display:block;
      font-family:'DM Sans',system-ui,sans-serif;
      font-size:0.75rem;
      font-weight:600;
      text-transform:uppercase;
      letter-spacing:0.06em;
      color:#141413;
      margin-bottom:6px;
    }

    input{
      width:100%;
      padding:10px 12px;
      border:1px solid rgba(20,20,19,0.10);
      border-radius:6px;
      background:#FAF9F3;
      color:#141413;
      font-family:'DM Sans',system-ui,sans-serif;
      font-size:0.95rem;
      margin-bottom:20px;
      outline:none;
      transition:border-color 0.15s ease;
    }

    input:focus{
      border-color:#C7593A;
    }

    button{
      width:100%;
      padding:12px;
      border:none;
      border-radius:6px;
      background:#C7593A;
      color:#FAF9F3;
      font-family:'DM Sans',system-ui,sans-serif;
      font-size:0.95rem;
      font-weight:600;
      cursor:pointer;
      transition:background 0.15s ease;
    }

    button:hover{
      background:#B34F34;
    }

    .divider{
      height:1px;
      background:rgba(20,20,19,0.10);
      margin:24px 0;
    }

    .footer-text{
      text-align:center;
      font-family:'DM Sans',system-ui,sans-serif;
      font-size:0.8rem;
      color:#726F6A;
    }

    /* ── Dark mode ── */
    @media(prefers-color-scheme:dark){
      body{background:#262624;color:#FAF9F3}
      .card{background:#1F1E1D;border-color:rgba(221,216,202,0.15);box-shadow:0 2px 8px rgba(0,0,0,0.3)}
      h1{color:#FAF9F3}
      .subtitle{color:#BFB9AE}
      .error{background:hsl(0,47%,28%);border-color:hsl(0,98%,75%);color:#FAF9F3}
      label{color:#FAF9F3}
      input{background:#262624;border-color:rgba(221,216,202,0.15);color:#FAF9F3}
      input:focus{border-color:#D97757}
      button{background:#D97757;color:#FAF9F3}
      button:hover{background:#D46541}
      .divider{background:rgba(221,216,202,0.15)}
      .footer-text{color:#9A9790}
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Aiva Docs</h1>
    <p class="subtitle">Sign in to continue</p>
    ${errorHtml}
    <form method="POST" action="${LOGIN_PATH}">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" required autofocus>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required>
      <button type="submit">Sign In</button>
    </form>
    <div class="divider"></div>
    <p class="footer-text">Protected documentation portal</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env, next } = context;

  // If no password is configured, skip auth (allows open access in dev)
  if (!env.SITE_PASSWORD) {
    return next();
  }

  const url = new URL(request.url);
  const expectedUsername = env.SITE_USERNAME || 'admin';
  const expectedPassword = env.SITE_PASSWORD;
  const expectedToken = await generateToken(expectedPassword);

  // Handle logout
  if (url.pathname === LOGOUT_PATH) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      },
    });
  }

  // Handle login form submission
  if (url.pathname === LOGIN_PATH && request.method === 'POST') {
    const formData = await request.formData();
    const username = formData.get('username')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (username === expectedUsername && password === expectedPassword) {
      const cookie = `${COOKIE_NAME}=${expectedToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
          'Set-Cookie': cookie,
        },
      });
    }

    return loginPage('Invalid username or password');
  }

  // Check for valid session cookie
  const sessionToken = getCookie(request, COOKIE_NAME);
  if (sessionToken === expectedToken) {
    return next();
  }

  // No valid session — show login form
  return loginPage();
};
