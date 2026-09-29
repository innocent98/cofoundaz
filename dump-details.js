const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

const schemas = spec.components && spec.components.schemas ? spec.components.schemas : {};

const targetSchemas = [
  'PreferencesUpdate',
  'NotificationPreferences',
  'SignatureRequestCreate',
  'SignAction',
  'EnrollmentCreate',
  'LessonProgressUpdate'
];

console.log('=== TARGET SCHEMAS ===');
targetSchemas.forEach(name => {
  if (schemas[name]) {
    console.log(`\n--- ${name} ---`);
    console.log(JSON.stringify(schemas[name], null, 2));
  }
});
