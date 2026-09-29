const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

const learningPaths = Object.keys(spec.paths).filter(p => p.includes('/learning') || p.includes('/sign'));
console.log('--- LEARNING & SIGN ENDPOINTS ---');
learningPaths.forEach(p => {
  console.log(p);
  const methods = spec.paths[p];
  for (const m in methods) {
    const op = methods[m];
    const res200 = op.responses && (op.responses['200'] || op.responses['201']);
    const resSchema = res200 && res200.content && res200.content['application/json'] && res200.content['application/json'].schema;
    console.log(`  [${m.toUpperCase()}] ->`, resSchema ? JSON.stringify(resSchema) : 'no schema');
  }
});
