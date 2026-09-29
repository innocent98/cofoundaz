const fs = require('fs');
const path = require('path');

if (!fs.existsSync('openapi.json')) {
  console.error('Error: openapi.json not found in current directory!');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

function getFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (/node_modules|\.next|dist|\.git|app[\\\/]api[\\\/]v1/.test(full)) continue;
    if (fs.statSync(full).isDirectory()) getFiles(full, list);
    else if (/\.(ts|tsx)$/.test(f)) list.push(full);
  }
  return list;
}

const dirs = ['app', 'hooks', 'lib', 'components', 'ui'];
const files = dirs.flatMap(d => getFiles(d)).map(p => ({
  path: p.replace(/\\/g, '/'),
  code: fs.readFileSync(p, 'utf8')
}));

console.log(`Scanned ${files.length} project source files.`);

const matched = [];
for (const [rPath, methods] of Object.entries(spec.paths || {})) {
  for (const [method, op] of Object.entries(methods)) {
    if (!['get','post','put','delete','patch'].includes(method.toLowerCase())) continue;
    const clean = rPath.replace(/^\/api\/v1/, '');
    const escapeRegex = s => s.replace(/[-/\\^$*+?.()|[\]]/g, '\\$&');
    const p1 = escapeRegex(clean).replace(/\\\{[^}]+\\\}/g, '[^/`"\'\\s]+');
    const p2 = escapeRegex(rPath).replace(/\\\{[^}]+\\\}/g, '[^/`"\'\\s]+');
    const re = new RegExp(p1 + '|' + p2, 'i');
    
    const hits = files.filter(f => re.test(f.code)).map(f => f.path);
    if (hits.length > 0) {
      matched.push({
        tag: (op.tags && op.tags[0]) || 'General',
        method: method.toUpperCase(),
        swaggerPath: rPath,
        file: hits[0] + (hits.length > 1 ? ` (+${hits.length - 1} more)` : '')
      });
    }
  }
}

console.log(`\nVerified ${matched.length} endpoints matching Swagger docs:`);
console.table(matched.slice(0, 30));
fs.writeFileSync('verified-swagger.json', JSON.stringify(matched, null, 2));
console.log(`Saved complete list to verified-swagger.json`);
