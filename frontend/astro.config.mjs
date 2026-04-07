// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
  vite: {
    server: {
      proxy: {
        '/auth': 'http://localhost:5000',
        '/dashboard': 'http://localhost:5000',
        '/memoretos': 'http://localhost:5000',
        '/groups': 'http://localhost:5000',
      },
    },
  },
});