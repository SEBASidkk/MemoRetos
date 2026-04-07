import type { APIRoute } from 'astro';
import { login } from '../../../lib/api';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { username, password } = await request.json();
  const res = await login(username, password);

  if (res.status !== 200) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { token, user } = res.data as { token: string; user: unknown };

  cookies.set('jwt', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
