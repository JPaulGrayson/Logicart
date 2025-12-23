/**
 * Unit tests for Ghost Diff AST comparison
 */

import { GhostDiff, DiffResult } from './ghostDiff';
import { FlowNode } from './parser';

function createMockNode(id: string, type: string, label: string, line?: number): FlowNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      label,
      sourceData: line ? { start: { line, column: 0 }, end: { line, column: 10 } } : undefined
    }
  };
}

// Test 1: Detect unchanged nodes
console.log('Test 1: Detect unchanged nodes');
const differ1 = new GhostDiff({ debug: false });
const oldTree1: FlowNode[] = [
  createMockNode('n1', 'input', 'function test()', 1),
  createMockNode('n2', 'default', 'return 42', 2)
];
const newTree1 = [...oldTree1]; // Same tree
const result1 = differ1.diffTrees(oldTree1, newTree1);

console.assert(result1.stats.unchanged === 2, 'Should have 2 unchanged nodes');
console.assert(result1.stats.added === 0, 'Should have 0 added nodes');
console.assert(result1.stats.removed === 0, 'Should have 0 removed nodes');
console.assert(result1.stats.modified === 0, 'Should have 0 modified nodes');
console.log('✓ Test 1 passed');

// Test 2: Detect added node
console.log('Test 2: Detect added node');
const differ2 = new GhostDiff({ debug: false });
const oldTree2: FlowNode[] = [
  createMockNode('n1', 'input', 'function test()', 1)
];
const newTree2: FlowNode[] = [
  createMockNode('n1', 'input', 'function test()', 1),
  createMockNode('n2', 'default', 'console.log("new")', 2)
];
const result2 = differ2.diffTrees(oldTree2, newTree2);

console.assert(result2.stats.added === 1, 'Should have 1 added node');
console.assert(result2.stats.unchanged === 1, 'Should have 1 unchanged node');
console.log('✓ Test 2 passed');

// Test 3: Detect removed node
console.log('Test 3: Detect removed node');
const differ3 = new GhostDiff({ debug: false });
const oldTree3: FlowNode[] = [
  createMockNode('n1', 'input', 'function test()', 1),
  createMockNode('n2', 'default', 'console.log("old")', 2)
];
const newTree3: FlowNode[] = [
  createMockNode('n1', 'input', 'function test()', 1)
];
const result3 = differ3.diffTrees(oldTree3, newTree3);

console.assert(result3.stats.removed === 1, 'Should have 1 removed node');
console.assert(result3.stats.unchanged === 1, 'Should have 1 unchanged node');
console.log('✓ Test 3 passed');

// Test 4: Detect modified node (label change)
console.log('Test 4: Detect modified node (label change)');
const differ4 = new GhostDiff({ debug: false });
const oldTree4: FlowNode[] = [
  createMockNode('n1', 'decision', 'if (x > 10)', 1)
];
const newTree4: FlowNode[] = [
  createMockNode('n1', 'decision', 'if (x > 20)', 1) // Changed value
];
const result4 = differ4.diffTrees(oldTree4, newTree4);

console.assert(result4.stats.modified === 1, 'Should have 1 modified node');
console.assert(result4.nodes[0].diffStatus === 'modified', 'Node should have modified status');
console.assert(result4.nodes[0].oldValue?.data.label === 'if (x > 10)', 'Should preserve old value');
console.log('✓ Test 4 passed');

// Test 5: Signature-based matching (same structure, different ID)
console.log('Test 5: Signature-based matching');
const differ5 = new GhostDiff({ matchBy: 'signature', debug: false });
const oldTree5: FlowNode[] = [
  createMockNode('old-id-1', 'input', 'function process()', 1),
  createMockNode('old-id-2', 'decision', 'if (valid)', 2)
];
const newTree5: FlowNode[] = [
  createMockNode('new-id-1', 'input', 'function process()', 1), // Same structure, different ID
  createMockNode('new-id-2', 'decision', 'if (valid)', 2)
];
const result5 = differ5.diffTrees(oldTree5, newTree5);

console.assert(result5.stats.unchanged === 2, 'Should match by signature, not ID');
console.assert(result5.stats.added === 0, 'Should not detect as added');
console.log('✓ Test 5 passed');

// Test 6: Apply diff styling
console.log('Test 6: Apply diff styling');
const differ6 = new GhostDiff({ debug: false });
const diffResult: DiffResult = {
  nodes: [
    { ...createMockNode('n1', 'default', 'added'), diffStatus: 'added' },
    { ...createMockNode('n2', 'default', 'removed'), diffStatus: 'removed' },
    { ...createMockNode('n3', 'default', 'modified'), diffStatus: 'modified' }
  ],
  stats: { added: 1, removed: 1, modified: 1, unchanged: 0 }
};
const styledNodes = differ6.applyDiffStyling(diffResult.nodes);

console.assert(styledNodes[0].className?.includes('diff-added'), 'Should have diff-added class');
console.assert(styledNodes[1].className?.includes('diff-removed'), 'Should have diff-removed class');
console.assert(styledNodes[2].className?.includes('diff-modified'), 'Should have diff-modified class');
console.log('✓ Test 6 passed');

// Test 7: Complex scenario with mixed changes
console.log('Test 7: Complex mixed changes');
const differ7 = new GhostDiff({ matchBy: 'signature', debug: false });
const oldTree7: FlowNode[] = [
  createMockNode('n1', 'input', 'function calculate(x)', 1),
  createMockNode('n2', 'decision', 'if (x > 0)', 2),
  createMockNode('n3', 'default', 'return x * 2', 3),
  createMockNode('n4', 'default', 'return 0', 4)
];
const newTree7: FlowNode[] = [
  createMockNode('n1', 'input', 'function calculate(x)', 1), // unchanged
  createMockNode('n2', 'decision', 'if (x > 5)', 2),        // modified (threshold changed)
  createMockNode('n3', 'default', 'return x * 2', 3),       // unchanged
  createMockNode('n5', 'default', 'console.log(x)', 5)      // added (new line)
  // n4 removed
];
const result7 = differ7.diffTrees(oldTree7, newTree7);

console.assert(result7.stats.unchanged === 2, `Should have 2 unchanged (got ${result7.stats.unchanged})`);
console.assert(result7.stats.modified === 1, `Should have 1 modified (got ${result7.stats.modified})`);
console.assert(result7.stats.added === 1, `Should have 1 added (got ${result7.stats.added})`);
console.assert(result7.stats.removed === 1, `Should have 1 removed (got ${result7.stats.removed})`);
console.log('✓ Test 7 passed');

console.log('\n✅ All Ghost Diff unit tests passed!');
