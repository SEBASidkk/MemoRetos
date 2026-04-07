import type { APIRoute } from 'astro';

export const POST: APIRoute = ({ cookies }) => {
  cookies.delete('jwt', { path: '/' });
  return new Response(null, { status: 204 });
};
