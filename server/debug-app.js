const fs = require('fs');

// Проверка app.module.ts
let c = fs.readFileSync('src/app.module.ts', 'utf8');
console.log('=== app.module.ts ===');
const lines = c.split('\n');
for (let i = 75; i < 92; i++) {
    console.log((i + 1) + ': ' + lines[i]);
}
