const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = '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';
const PORT = process.env.PORT || 3747;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && req.url === '/api') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const apiBody = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: parsed.max_tokens || 1000,
          system: parsed.system || '',
          messages: parsed.messages
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(apiBody)
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', chunk => { data += chunk; });
          apiRes.on('end', () => {
            res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });

        apiReq.on('error', (e) => {
          res.writeHead(500);
          res.end(JSON.stringify({ error: { message: e.message } }));
        });

        apiReq.write(apiBody);
        apiReq.end();
      } catch(e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: { message: 'Bad request: ' + e.message } }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Cornerstone running on port ' + PORT);
});
