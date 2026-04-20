import type { APIRoute } from 'astro';

export const prerender = false;

const BACKEND = 'http://localhost:5000';

export const ALL: APIRoute = async ({ request, locals, params }) => {
  const token = (locals as { token?: string }).token;
  const path = params.path ?? '';

  const url = `${BACKEND}/${path}`;
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.delete('host');

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();

  const res = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const data = await res.arrayBuffer();
  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
};
