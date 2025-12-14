/**
 * Debug script to see actual node structure
 */

import { parseCodeToFlow } from '../bridge/dist/parser.js';

const testCode = `
// --- CALCULATOR ---
function calculate(a, b, operator) {
  if (operator === '+') return a + b;
  if (operator === '-') return a - b;
  return 'Unknown';
}
`;

const flowData = parseCodeToFlow(testCode);

console.log('\n=== NODES ===\n');
for (const node of flowData.nodes) {
    console.log(`ID: ${node.id}`);
    console.log(`  Type: ${node.type}`);
    console.log(`  Label: ${node.data.label}`);
    if (node.parentNode) console.log(`  Parent: ${node.parentNode}`);
    if (node.data.children) console.log(`  Children: ${node.data.children.length}`);
    console.log();
}

console.log('\n=== EDGES ===\n');
for (const edge of flowData.edges) {
    console.log(`${edge.source} -> ${edge.target}${edge.label ? ` [${edge.label}]` : ''}`);
}

console.log('\n=== SUMMARY ===');
console.log(`Total nodes: ${flowData.nodes.length}`);
console.log(`Total edges: ${flowData.edges.length}`);
console.log(`Containers: ${flowData.nodes.filter(n => n.type === 'container').length}`);
console.log(`Decisions: ${flowData.nodes.filter(n => n.type === 'decision').length}`);
