import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Lightweight local dev middleware for /api/convert
 * Enables instant PDF generation in local dev environment using host Chrome!
 */
function localPdfDevPlugin() {
  return {
    name: 'local-pdf-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/convert', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));

          // Clean CommonJS require without esbuild bundle interception
          const { convert } = require('../src/index.js');
          const result = await convert({
            markdown: body.markdown,
            theme: body.theme || 'clean',
            format: body.format || 'A4',
            landscape: !!body.landscape
          });

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(body.filename || 'document.pdf')}"`
          );
          res.end(result.buffer);
        } catch (err) {
          console.error('[Local Dev PDF] Conversion error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  root: '.',
  envDir: '../',
  resolve: {
    alias: {
      '@examples': path.resolve(__dirname, '../examples')
    }
  },
  plugins: [localPdfDevPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3555,
    fs: {
      allow: ['..']
    }
  }
});
