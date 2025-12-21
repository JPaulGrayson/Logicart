export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16);
  return hex.padStart(8, '0').substring(0, 8);
}

export function generateNodeId(
  nodeType: string,
  filePath: string,
  line: number,
  column: number,
  signature?: string
): string {
  const components = [filePath, nodeType, String(line), String(column)];
  if (signature) {
    components.push(signature);
  }
  const hash = simpleHash(components.join('|'));
  
  const prefixMap: Record<string, string> = {
    'FunctionDeclaration': 'fn',
    'FunctionExpression': 'fn',
    'ArrowFunctionExpression': 'fn',
    'IfStatement': 'if',
    'ForStatement': 'for',
    'ForOfStatement': 'forof',
    'ForInStatement': 'forin',
    'WhileStatement': 'while',
    'DoWhileStatement': 'dowhile',
    'SwitchStatement': 'switch',
    'ReturnStatement': 'return',
    'VariableDeclaration': 'var',
    'ExpressionStatement': 'expr',
    'BlockStatement': 'block'
  };
  
  const prefix = prefixMap[nodeType] || 'stmt';
  return `${prefix}_${hash}`;
}

export function generateFileChecksum(content: string): string {
  return simpleHash(content);
}

export function generateManifestHash(fileChecksums: string[]): string {
  const combined = fileChecksums.sort().join('|');
  return simpleHash(combined);
}
