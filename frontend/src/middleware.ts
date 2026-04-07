import { defineMiddleware } from 'astro:middleware';
import { getMe } from './lib/api';

const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/auth/logout', '/api/auth/me'];
const API_PROXY_PREFIX = '/api/proxy';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow public assets and public pages
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_astro');
  if (isPublic) {
    // If already logged in and trying to visit login page, redirect to dashboard
    if (pathname === '/') {
      const jwt = context.cookies.get('jwt')?.value;
      if (jwt) return context.redirect('/dashboard');
    }
    return next();
  }

  // API proxy routes: inject Authorization header from cookie
  if (pathname.startsWith(API_PROXY_PREFIX)) {
    const jwt = context.cookies.get('jwt')?.value;
    if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    context.locals.token = jwt;
    return next();
  }

  // Protected pages: validate token
  const jwt = context.cookies.get('jwt')?.value;
  if (!jwt) return context.redirect('/');

  const res = await getMe(jwt);
  if (res.status !== 200) {
    context.cookies.delete('jwt', { path: '/' });
    return context.redirect('/');
  }

  context.locals.user = res.data as App.Locals['user'];
  context.locals.token = jwt;
  return next();
});
