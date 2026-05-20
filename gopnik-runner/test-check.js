const http = require('http');

const URLS = [
  'http://127.0.0.1:5173/',
  'http://127.0.0.1:5173/lib/phaser.min.js',
  'http://127.0.0.1:5173/src/main.js',
  'http://127.0.0.1:5173/src/scenes/GameScene.js',
  'http://127.0.0.1:5173/src/entities/Player.js',
  'http://127.0.0.1:5173/src/utils/SpriteGenerator.js',
  'http://127.0.0.1:5173/src/config.js',
];

let pass = 0;
let fail = 0;

function check(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const ok = res.statusCode === 200 && data.length > 0;
        if (ok) {
          pass++;
          console.log(`✅ ${url} — ${res.statusCode}, ${data.length} bytes`);
        } else {
          fail++;
          console.log(`❌ ${url} — ${res.statusCode}, empty body`);
        }
        resolve();
      });
    });
    req.on('error', (err) => {
      fail++;
      console.log(`❌ ${url} — ${err.message}`);
      resolve();
    });
    req.setTimeout(5000, () => {
      req.destroy();
      fail++;
      console.log(`❌ ${url} — timeout`);
      resolve();
    });
  });
}

async function run() {
  console.log('🔍 Checking server...\n');
  for (const url of URLS) {
    await check(url);
  }
  console.log(`\n📊 Result: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

// Wait for server to start
setTimeout(run, 2000);
