'use strict';

const crypto = require('crypto');
const { convert } = require('./converter');

let sparticuzChromium = null;
try {
  sparticuzChromium = require('@sparticuz/chromium');
} catch {
  // Local environment or container with system chromium
}

/**
 * AWS Lambda Handler for Serverless Markdown-to-PDF Conversion.
 * Designed for Lambda Function URLs and API Gateway HTTP API v2 / REST.
 */
exports.handler = async (event, context) => {
  // 1. Health check & keep-warm probe
  if (event.warmup || event.path === '/api/health' || event.rawPath === '/api/health') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ status: 'ok', service: 'md-to-pdf-lite', timestamp: Date.now() })
    };
  }

  // 2. CORS preflight (OPTIONS)
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'POST';
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-pow-timestamp, x-pow-nonce',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // 3. Reject non-POST requests to convert endpoints
  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST to convert Markdown.' })
    };
  }

  // 4. Dual-Channel Authentication & Anti-Bot Protection:
  //    Channel A: Private API Key (For local curl, backend scripts, CI/CD - immediate bypass)
  //    Channel B: Proof of Work (PoW) verification (For Web Studio - zero external dependencies, 0.02ms verify)
  const PRIVATE_API_KEY = (process.env.PRIVATE_API_KEY || process.env.API_KEY || '').trim();
  const POW_DIFFICULTY = parseInt(process.env.POW_DIFFICULTY || '4', 10);
  const WEB_CLIENT_SALT = process.env.WEB_CLIENT_SALT || 'md2pdf_lite_salt_v1';

  const headers = event.headers || {};
  const query = event.queryStringParameters || {};

  const clientKey =
    headers['x-api-key'] ||
    headers['X-Api-Key'] ||
    (headers['authorization'] || headers['Authorization'] || '').replace(/^Bearer\s+/i, '').trim() ||
    query.api_key ||
    query.key;

  let authorized = false;

  // Channel A: Check Private API Key
  if (PRIVATE_API_KEY && clientKey === PRIVATE_API_KEY) {
    authorized = true;
  }

  // Channel B: Check Proof of Work (if not authorized via Private Key)
  if (!authorized) {
    const powTimestampStr = headers['x-pow-timestamp'] || headers['X-Pow-Timestamp'];
    const powNonceStr = headers['x-pow-nonce'] || headers['X-Pow-Nonce'];

    if (powTimestampStr && powNonceStr !== undefined) {
      const powTimestamp = parseInt(powTimestampStr, 10);
      const now = Date.now();
      // Allow +/- 120s window to handle clock drift and client compute time
      if (!isNaN(powTimestamp) && Math.abs(now - powTimestamp) <= 120000) {
        const challenge = `/api/convert:${powTimestamp}:${WEB_CLIENT_SALT}`;
        const hash = crypto.createHash('sha256').update(`${challenge}:${powNonceStr}`).digest('hex');
        const expectedPrefix = '0'.repeat(POW_DIFFICULTY);
        if (hash.startsWith(expectedPrefix)) {
          authorized = true;
        }
      }
    }
  }

  // If neither Private Key nor valid PoW is present, reject request
  if (!authorized) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-pow-timestamp, x-pow-nonce'
      },
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Access denied. Valid "x-api-key" or Proof-of-Work (x-pow-timestamp, x-pow-nonce) required.'
      })
    };
  }

  try {
    let rawBody = event.body || '';
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
    }

    if (!rawBody || rawBody.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Empty request body. Please provide Markdown text or JSON payload.' })
      };
    }

    let markdown = '';
    let theme = 'clean';
    let format = 'A4';
    let landscape = false;
    let tagged = false;
    let css = undefined;
    let filename = 'document.pdf';

    const contentType = (event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || '';
    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(rawBody);
        markdown = parsed.markdown || '';
        if (parsed.theme) theme = parsed.theme;
        if (parsed.format) format = parsed.format;
        if (parsed.landscape !== undefined) landscape = Boolean(parsed.landscape);
        if (parsed.tagged !== undefined) tagged = Boolean(parsed.tagged);
        if (parsed.css) css = parsed.css;
        if (parsed.filename) filename = parsed.filename;
      } catch (e) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Invalid JSON payload: ' + e.message })
        };
      }
    } else {
      // Treat entire raw body as Markdown
      markdown = rawBody;
    }

    if (!markdown.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing markdown content in request payload.' })
      };
    }

    // Resolve Chromium executable & arguments
    let executablePath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
    let puppeteerArgs = undefined;

    if (!executablePath && sparticuzChromium) {
      executablePath = await sparticuzChromium.executablePath();
      puppeteerArgs = sparticuzChromium.args;
    }

    const { buffer } = await convert({
      markdown,
      theme,
      format,
      landscape,
      tagged,
      css,
      executablePath,
      puppeteerArgs,
      headless: sparticuzChromium ? sparticuzChromium.headless : true
    });

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-pow-timestamp, x-pow-nonce'
      },
      body: Buffer.from(buffer).toString('base64')
    };
  } catch (err) {
    console.error('Conversion failed:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to convert document',
        message: err.message
      })
    };
  }
};
