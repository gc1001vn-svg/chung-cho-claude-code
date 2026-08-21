/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Build timestamp injected by vite.config.ts. Shown in the corner of the screen
 * so it is possible to tell at a glance whether a phone picked up a new deploy.
 */
declare const __BUILD_ID__: string;
