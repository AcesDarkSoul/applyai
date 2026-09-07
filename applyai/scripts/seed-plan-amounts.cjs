const fs = require('fs');
const path = require('path');
const https = require('https');

const cfg = JSON.parse(
  fs.readFileSync(
    path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json'),
    'utf8',
  ),
);

function pickAccess() {
  const now = Date.now();
  const candidates = [];
  if (cfg.tokens?.access_token) {
    candidates.push({
      email: cfg.user?.email,
      token: cfg.tokens.access_token,
      exp: cfg.tokens.expires_at,
    });
  }
  for (const a of cfg.additionalAccounts || []) {
    if (a.tokens?.access_token) {
      candidates.push({
        email: a.user?.email,
        token: a.tokens.access_token,
        exp: a.tokens.expires_at,
      });
    }
  }
  for (const c of candidates) {
    console.log('candidate', c.email, 'valid', !c.exp || c.exp > now);
  }
  return candidates.find((c) => !c.exp || c.exp > now) || candidates[0];
}

function request(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(data
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
              }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, body: raw }));
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const picked = pickAccess();
  if (!picked) {
    console.error('No access token');
    process.exit(1);
  }
  console.log('Using', picked.email);

  const amounts = { starter: 599, pro: 1499, elite: 2999 };
  const now = new Date().toISOString();

  for (const [plan, amount] of Object.entries(amounts)) {
    const url =
      'https://firestore.googleapis.com/v1/projects/petcare-9f4e6/databases/(default)/documents/appSettings/amount/plan/' +
      plan +
      '?updateMask.fieldPaths=amount&updateMask.fieldPaths=currency&updateMask.fieldPaths=updatedAt';
    const body = {
      fields: {
        amount: { integerValue: String(amount) },
        currency: { stringValue: 'INR' },
        updatedAt: { stringValue: now },
      },
    };
    const res = await request('PATCH', url, picked.token, body);
    const failed = res.body.includes('"error"');
    console.log(plan, res.status, failed ? res.body.slice(0, 300) : 'ok');
    if (failed) process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
