import fs from 'fs';
import path from 'path';

// 1. Read openapi.json
const rawSpec = fs.readFileSync('openapi.json', 'utf8');
const spec = JSON.parse(rawSpec);

const endpoints = [];
for (const [routePath, methods] of Object.entries(spec.paths || {})) {
  for (const [method, op] of Object.entries(methods)) {
    if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
      const tag = (op.tags && op.tags[0]) || 'General';
      endpoints.push({
        tag,
        method: method.toUpperCase(),
        path: routePath,
        summary: op.summary || ''
      });
    }
  }
}

// 2. Recursively gather all source files
function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (['node_modules', '.next', 'dist', '.git'].includes(file)) continue;
    // Skip Next.js internal mock api handlers so we measure real client integration
    if (fullPath.includes(path.join('app', 'api', 'v1'))) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getSourceFiles(fullPath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const sourceFiles = [
  ...getSourceFiles('app'),
  ...getSourceFiles('hooks'),
  ...getSourceFiles('lib'),
  ...getSourceFiles('components'),
  ...getSourceFiles('ui')
];

let allSourceText = '';
for (const f of sourceFiles) {
  allSourceText += fs.readFileSync(f, 'utf8') + '\n';
}

// 3. Match endpoints against codebase
const results = endpoints.map(ep => {
  const cleanPath = ep.path.replace(/^\/api\/v1/, '');
  // Escape regex special chars except {param}
  const escapeRegex = str => str.replace(/[-/\\^$*+?.()|[\]]/g, '\\$&');
  const cleanPattern = escapeRegex(cleanPath).replace(/\\\{[^}]+\\\}/g, '[^/`"\'\\s]+');
  const fullPattern = escapeRegex(ep.path).replace(/\\\{[^}]+\\\}/g, '[^/`"\'\\s]+');

  const reClean = new RegExp(cleanPattern, 'i');
  const reFull = new RegExp(fullPattern, 'i');

  const implemented = reClean.test(allSourceText) || reFull.test(allSourceText);
  return { ...ep, implemented };
});

// 4. Summarize by Tag/Module
const grouped = {};
for (const item of results) {
  if (!grouped[item.tag]) grouped[item.tag] = { total: 0, implemented: 0 };
  grouped[item.tag].total++;
  if (item.implemented) grouped[item.tag].implemented++;
}

console.log('\n=================== API IMPLEMENTATION SUMMARY ===================');
console.table(
  Object.entries(grouped).map(([module, stats]) => ({
    Module: module,
    Implemented: `${stats.implemented} / ${stats.total}`,
    Coverage: `${((stats.implemented / stats.total) * 100).toFixed(1)}%`
  }))
);

// 5. Write missing & implemented endpoints to disk
const missing = results.filter(r => !r.implemented);
const implemented = results.filter(r => r.implemented);

fs.writeFileSync('endpoints-missing.json', JSON.stringify(missing, null, 2));
fs.writeFileSync('endpoints-implemented.json', JSON.stringify(implemented, null, 2));

const missingTxt = missing.map(m => `[${m.tag}] ${m.method} ${m.path} - ${m.summary}`).join('\n');
fs.writeFileSync('endpoints-missing.txt', missingTxt);

console.log(`\nTotal Endpoints in OpenAPI: ${endpoints.length}`);
console.log(`Connected / Referenced:    ${implemented.length}`);
console.log(`Remaining / Missing:       ${missing.length}`);
console.log('\nWrote remaining list to: endpoints-missing.txt');
