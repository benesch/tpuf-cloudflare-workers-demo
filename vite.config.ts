import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Custom devtoolsJson plugin (placeholder - adjust based on your needs)
const devtoolsJson = () => {
  return {
    name: 'devtools-json',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__devtools.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ version: '1.0.0', features: [] }));
        } else {
          next();
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
  ],
  build: {
    target: 'es2022',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: ['undici', 'node:util', 'node:zlib'],
    },
    ssr: "src/worker.js",
  },
  resolve: {
    conditions: ['worker', 'webworker'],
    mainFields: ['module', 'main'],
  },
});
