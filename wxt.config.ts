import { defineConfig } from 'wxt';

// wxt.config.ts
export default defineConfig({
  manifest: {
    name: 'NRK TV Dual Subtitles',
    permissions: ['storage'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    }
  }
});
