// Direct test of the parser logic - run with: node test-parser.js
const { parseCodeToFlow } = require('./vscode-extension/dist/extension.js');

// Test code 1: Simple function
const code1 = `
function test() {
  if (true) {
    return 1;
  }
  return 0;
}
`;

// Test code 2: Calculator example
const code2 = `
function calculate(a, b, operator) {
  if (operator === '+') {
    return a + b;
  }
  if (operator === '-') {
    return a - b;
  }
  return 'Unknown operator';
}
`;

console.log('=== Testing Parser ===\n');

console.log('Code 1 (simple test):');
try {
    const result1 = parseCodeToFlow(code1);
    console.log('  Nodes:', result1?.nodes?.length);
    console.log('  Edges:', result1?.edges?.length);
    console.log('  Node labels:', result1?.nodes?.map(n => n.data.label).join(', '));
} catch (e) {
    console.log('  ERROR:', e.message);
}

console.log('\nCode 2 (calculator):');
try {
    const result2 = parseCodeToFlow(code2);
    console.log('  Nodes:', result2?.nodes?.length);
    console.log('  Edges:', result2?.edges?.length);
    console.log('  Node labels:', result2?.nodes?.map(n => n.data.label).join(', '));
} catch (e) {
    console.log('  ERROR:', e.message);
}

console.log('\n=== Parser test complete ===');
