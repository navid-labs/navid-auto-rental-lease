import { defineConfig } from 'orval'

export default defineConfig({
  navid: {
    input: {
      target: './src/openapi/bundled.yaml',
    },
    output: {
      target: './src/lib/api/generated',
      client: 'fetch',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/api/fetcher.ts',
          name: 'customFetch',
        },
      },
    },
  },
})
