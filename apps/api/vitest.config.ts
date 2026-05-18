import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // Integration tests (Testcontainers) need Docker; gated by RUN_DB_TESTS.
    testTimeout: 60_000,
  },
});
