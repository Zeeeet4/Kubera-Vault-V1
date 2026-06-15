import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/main.ts'],
      thresholds: {
        // TODO: Subir a 40 cuando se añadan tests de db.ts y crypto.ts
        statements: 10,
        branches: 5,
        functions: 8,
        lines: 10,
      },
    },
    setupFiles: [],
  },
});
