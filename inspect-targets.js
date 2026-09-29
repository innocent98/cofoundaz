const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

const targetPaths = [
  '/api/v1/notifications/{notification_id}/read',
  '/api/v1/notifications/preferences',
  '/api/v1/documents/files/{file_id}/signature-requests',
  '/api/v1/documents/signature-requests/{request_id}',
  '/api/v1/documents/signature-requests/{request_id}/remind',
  '/api/v1/documents/signature-requests/{request_id}/cancel',
  '/api/v1/sign/{token}',
  '/api/v1/learning/recommendations',
  '/api/v1/learning/courses',
  '/api/v1/learning/courses/{course_id}',
  '/api/v1/learning/paths',
  '/api/v1/learning/articles',
  '/api/v1/learning/enrollments',
  '/api/v1/learning/lessons/{lesson_id}/progress',
  '/api/v1/learning/certificates'
];

console.log('--- TARGET ENDPOINTS FROM OPENAPI ---');
targetPaths.forEach(p => {
  const item = spec.paths[p];
  if (!item) {
    console.log(`MISSING IN SPEC: ${p}`);
    return;
  }
  Object.keys(item).forEach(m => {
    const op = item[m];
    console.log(`[${m.toUpperCase()}] ${p}`);
    if (op.requestBody) {
      const content = op.requestBody.content;
      const schema = content && content['application/json'] && content['application/json'].schema;
      console.log('  RequestBody schema:', JSON.stringify(schema));
    }
  });
});
