import { defineConfig } from 'vitest/config';

// Deliberately separate from vite.config.ts: the tests cover pure logic only
// (CLAUDE.md §6), so they must not drag the PWA plugin or a browser environment
// into the run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
