import { parseCodeToFlow } from './vscode-extension/src/parser.ts';

const codeWithSections = `
// --- AUTH LOGIC ---
function validateUser(user) {
  if (!user.email) return false;
  return true;
}
// --- MAIN LOGIC ---
function processData(data) {
  for (let i = 0; i < data.length; i++) {
    // process
  }
}
`;

console.log('Testing Parser with Sections...');
const flowData = parseCodeToFlow(codeWithSections);

const containers = flowData.nodes.filter(n => n.type === 'container');
console.log('Found containers:', containers.length);
containers.forEach(c => console.log(' - Container label:', c.data.label));

if (containers.length === 0) {
    console.error('FAIL: No containers found! The extension parser does not support section markers.');
    process.exit(1);
} else {
    console.log('PASS: Containers found.');
}
