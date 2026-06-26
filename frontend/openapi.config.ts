import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  plugins: [
    {
      name: '@hey-api/client-fetch',
    },
  ],

  input: {
    path: 'http://localhost:5000/api/docs-json',
  },

  output: {
    path: 'src/shared/api/generated',
  },
});