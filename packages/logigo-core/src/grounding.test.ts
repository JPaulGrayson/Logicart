/**
 * Unit tests for Grounding Layer
 */

import { generateGroundingContext, FlowNodeInput, FlowEdgeInput } from './grounding';

function createTestNodes(): { nodes: FlowNodeInput[]; edges: FlowEdgeInput[] } {
  const nodes: FlowNodeInput[] = [
    { id: 'start', type: 'input', data: { label: 'function checkAge(age)' } },
    { id: 'if1', type: 'decision', data: { label: 'if (age >= 18)' } },
    { id: 'ret1', type: 'default', data: { label: 'return "adult"' } },
    { id: 'ret2', type: 'default', data: { label: 'return "minor"' } }
  ];

  const edges: FlowEdgeInput[] = [
    { id: 'e1', source: 'start', target: 'if1' },
    { id: 'e2', source: 'if1', target: 'ret1', label: 'true' },
    { id: 'e3', source: 'if1', target: 'ret2', label: 'false' }
  ];

  return { nodes, edges };
}

function createLoopTestNodes(): { nodes: FlowNodeInput[]; edges: FlowEdgeInput[] } {
  const nodes: FlowNodeInput[] = [
    { id: 'start', type: 'input', data: { label: 'function sum(arr)' } },
    { id: 'decl', type: 'default', data: { label: 'let total = 0' } },
    { id: 'loop', type: 'decision', data: { label: 'for (let i = 0; i < arr.length; i++)' } },
    { id: 'body', type: 'default', data: { label: 'total += arr[i]' } },
    { id: 'ret', type: 'default', data: { label: 'return total' } }
  ];

  const edges: FlowEdgeInput[] = [
    { id: 'e1', source: 'start', target: 'decl' },
    { id: 'e2', source: 'decl', target: 'loop' },
    { id: 'e3', source: 'loop', target: 'body' },
    { id: 'e4', source: 'loop', target: 'ret' }
  ];

  return { nodes, edges };
}

// Test 1: Basic if/else structure
console.log('Test 1: Basic if/else structure');
const { nodes: ifNodes, edges: ifEdges } = createTestNodes();
const ifResult = generateGroundingContext(ifNodes, ifEdges);

console.assert(ifResult.summary.nodeCount === 4, 'Should have 4 nodes');
console.assert(ifResult.summary.complexityScore === 1, 'Should have complexity 1 (one decision)');
console.assert(ifResult.summary.entryPoint === 'start', 'Entry point should be start');
console.assert(ifResult.flow[0].type === 'FUNCTION', 'First node should be FUNCTION');
console.assert(ifResult.flow[1].type === 'DECISION', 'Second node should be DECISION');
console.assert(ifResult.flow[1].children.length === 2, 'Decision should have 2 children');
console.assert(ifResult.flow[1].children[0].condition === 'true', 'First child should have true condition');
console.assert(ifResult.flow[1].children[1].condition === 'false', 'Second child should have false condition');
console.log('✓ Test 1 passed');

// Test 2: Loop detection
console.log('Test 2: Loop detection');
const { nodes: loopNodes, edges: loopEdges } = createLoopTestNodes();
const loopResult = generateGroundingContext(loopNodes, loopEdges);

console.assert(loopResult.summary.nodeCount === 5, 'Should have 5 nodes');
console.assert(loopResult.summary.complexityScore === 1, 'Should have complexity 1 (one loop)');
const loopNode = loopResult.flow.find(n => n.id === 'loop');
console.assert(loopNode?.type === 'LOOP', 'Loop node should be typed as LOOP');
console.log('✓ Test 2 passed');

// Test 3: Parent/child relationships
console.log('Test 3: Parent/child relationships');
const startNode = ifResult.flow.find(n => n.id === 'start');
const decisionNode = ifResult.flow.find(n => n.id === 'if1');
const adultNode = ifResult.flow.find(n => n.id === 'ret1');

console.assert(startNode?.parents.length === 0, 'Start node should have no parents');
console.assert(startNode?.children.length === 1, 'Start node should have 1 child');
console.assert(decisionNode?.parents[0] === 'start', 'Decision parent should be start');
console.assert(adultNode?.parents[0] === 'if1', 'Return adult parent should be if1');
console.log('✓ Test 3 passed');

// Test 4: Snippet truncation
console.log('Test 4: Snippet truncation');
const longLabelNodes: FlowNodeInput[] = [
  { id: 'n1', type: 'default', data: { label: 'This is a very long label that should be truncated to 50 characters maximum for display' } }
];
const longResult = generateGroundingContext(longLabelNodes, []);
console.assert(longResult.flow[0].snippet.length <= 50, 'Snippet should be max 50 chars');
console.log('✓ Test 4 passed');

// Test 5: JSON size check
console.log('Test 5: JSON size check');
const jsonOutput = JSON.stringify(ifResult);
console.log(`JSON size: ${jsonOutput.length} characters`);
console.assert(jsonOutput.length < 700, 'Simple if/else JSON should be under 700 chars');
console.log('✓ Test 5 passed');

console.log('\n✅ All unit tests passed!');
