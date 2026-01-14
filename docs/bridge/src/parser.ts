import * as acorn from 'acorn';
import dagre from 'dagre';
import { transform } from 'sucrase';

import { SourceLocation, FlowNode, FlowEdge, FlowData } from './types';

/**
 * Strips TypeScript syntax from code using sucrase transpiler.
 * Converts TypeScript/TSX to plain JavaScript safely.
 */
function stripTypeScript(code: string): string {
  // Check if code contains TypeScript syntax
  const hasTypeScript = /\b(interface|type)\s+\w+/.test(code) ||
    /:\s*[\w<>\[\]|&]+\s*[=,)\n{]/.test(code) ||
    /import\s+type\s+/.test(code);
  
  if (!hasTypeScript) {
    return code;
  }
  
  try {
    // Use sucrase to transpile TypeScript/TSX to JavaScript
    const result = transform(code, {
      transforms: ['typescript', 'jsx'],
      disableESTransforms: true,
    });
    return result.code;
  } catch {
    // If sucrase fails, return original code and let Acorn try
    return code;
  }
}

/**
 * Extracts a balanced brace block starting from a position.
 * Handles strings, single-line comments (//), and multi-line comments.
 */
function extractBalancedBraces(code: string, startPos: number): { content: string; endPos: number } | null {
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let start = -1;
  
  for (let i = startPos; i < code.length; i++) {
    const char = code[i];
    const nextChar = i < code.length - 1 ? code[i + 1] : '';
    const prevChar = i > 0 ? code[i - 1] : '';
    
    // Handle single-line comment end (newline)
    if (inSingleLineComment) {
      if (char === '\n') {
        inSingleLineComment = false;
      }
      continue;
    }
    
    // Handle multi-line comment end
    if (inMultiLineComment) {
      if (char === '*' && nextChar === '/') {
        inMultiLineComment = false;
        i++; // Skip the '/'
      }
      continue;
    }
    
    // Handle string literals
    if (!inString) {
      // Check for comment starts
      if (char === '/' && nextChar === '/') {
        inSingleLineComment = true;
        i++; // Skip the second '/'
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        i++; // Skip the '*'
        continue;
      }
      // Check for string starts
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
      }
    } else {
      // In string - check for end
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
      continue;
    }
    
    // Count braces (only outside strings and comments)
    if (char === '{') {
      if (braceCount === 0) start = i + 1;
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && start !== -1) {
        return { content: code.slice(start, i), endPos: i };
      }
    }
  }
  return null;
}

/**
 * Preprocesses React component code to extract algorithm logic.
 * Detects useCallback/useMemo hooks and extracts their bodies as named functions.
 * This allows visualization of algorithm logic embedded in React components.
 */
function preprocessReactCode(code: string): string {
  // Check if this looks like a React component
  const hasReactImport = /import\s+.*from\s+['"]react['"]/.test(code);
  const hasUseCallback = /useCallback\s*\(/.test(code);
  const hasUseMemo = /useMemo\s*\(/.test(code);
  const hasUseState = /useState\s*[<(]/.test(code);
  const hasJSX = /<[A-Z][a-zA-Z]*[\s/>]/.test(code) || /return\s*\(?\s*</.test(code);
  
  // If it doesn't look like React, return as-is
  if (!hasReactImport && !hasUseCallback && !hasUseMemo && !hasUseState && !hasJSX) {
    return code;
  }
  
  const extractedFunctions: string[] = [];
  let functionCounter = 0;
  
  // Find useCallback declarations
  const callbackDeclPattern = /const\s+(\w+)\s*=\s*useCallback\s*\(\s*\([^)]*\)\s*=>/g;
  let match;
  
  while ((match = callbackDeclPattern.exec(code)) !== null) {
    const funcName = match[1];
    // Find the opening brace after the arrow
    const arrowEnd = match.index + match[0].length;
    const braceStart = code.indexOf('{', arrowEnd);
    
    if (braceStart !== -1 && braceStart - arrowEnd < 10) {
      const extracted = extractBalancedBraces(code, braceStart);
      if (extracted && extracted.content.trim().length > 10) {
        const sectionName = funcName.toUpperCase();
        extractedFunctions.push(`// --- ${sectionName} ---\nfunction ${sectionName}() {\n${extracted.content.trim()}\n}`);
      }
    }
  }
  
  // Find useMemo declarations
  const memoDeclPattern = /const\s+(\w+)\s*=\s*useMemo\s*\(\s*\(\s*\)\s*=>/g;
  
  while ((match = memoDeclPattern.exec(code)) !== null) {
    const funcName = match[1];
    const arrowEnd = match.index + match[0].length;
    const braceStart = code.indexOf('{', arrowEnd);
    
    if (braceStart !== -1 && braceStart - arrowEnd < 10) {
      const extracted = extractBalancedBraces(code, braceStart);
      if (extracted && extracted.content.trim().length > 10 && extracted.content.includes('return')) {
        const sectionName = funcName.toUpperCase();
        if (!extractedFunctions.some(f => f.includes(`function ${sectionName}(`))) {
          extractedFunctions.push(`// --- ${sectionName} ---\nfunction ${sectionName}() {\n${extracted.content.trim()}\n}`);
        }
      }
    }
  }
  
  // Find useEffect with algorithm logic
  const effectDeclPattern = /useEffect\s*\(\s*\(\s*\)\s*=>/g;
  
  while ((match = effectDeclPattern.exec(code)) !== null) {
    const arrowEnd = match.index + match[0].length;
    const braceStart = code.indexOf('{', arrowEnd);
    
    if (braceStart !== -1 && braceStart - arrowEnd < 10) {
      const extracted = extractBalancedBraces(code, braceStart);
      if (extracted) {
        const funcBody = extracted.content.trim();
        const hasControlFlow = /\b(if|for|while|switch)\s*\(/.test(funcBody);
        const hasMultipleStatements = (funcBody.match(/;/g) || []).length > 2;
        
        if (funcBody.length > 20 && (hasControlFlow || hasMultipleStatements)) {
          functionCounter++;
          extractedFunctions.push(`// --- EFFECT_${functionCounter} ---\nfunction effect_${functionCounter}() {\n${funcBody}\n}`);
        }
      }
    }
  }
  
  // If we extracted functions, return them instead of the original React code
  if (extractedFunctions.length > 0) {
    return extractedFunctions.join('\n\n');
  }
  
  // No hooks found - try to extract the main component body
  // Look for algorithm logic in the component's main body (before return statement)
  const componentMatch = code.match(/(?:export\s+(?:default\s+)?)?function\s+\w+\s*\([^)]*\)\s*\{/);
  if (componentMatch) {
    const extracted = extractBalancedBraces(code, componentMatch.index! + componentMatch[0].length - 1);
    if (extracted) {
      const returnMatch = extracted.content.match(/return\s*\(?\s*</);
      if (returnMatch) {
        const bodyBeforeReturn = extracted.content.slice(0, returnMatch.index).trim();
        const hasControlFlow = /\b(if|for|while|switch)\s*\(/.test(bodyBeforeReturn);
        
        if (bodyBeforeReturn.length > 50 && hasControlFlow) {
          return `// --- COMPONENT_LOGIC ---\nfunction componentLogic() {\n${bodyBeforeReturn}\n}`;
        }
      }
    }
  }
  
  // Return original code if no React patterns could be extracted
  return code;
}

// Helper to detect section comments (e.g., // --- AUTH LOGIC ---)
interface CodeSection {
  name: string;
  startLine: number;
  endLine: number;
}

// Helper to detect @logigo: label comments
// Maps line numbers to user-defined labels
function detectUserLabels(code: string): Map<number, string> {
  const labels = new Map<number, string>();
  const lines = code.split('\n');
  const labelPattern = /\/\/\s*@logigo:\s*(.+)$/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(labelPattern);
    
    if (match) {
      const label = match[1].trim();
      // The label applies to the next non-empty, non-comment line
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        // Skip empty lines and other comments
        if (nextLine && !nextLine.startsWith('//')) {
          // Line numbers are 1-indexed in AST
          labels.set(j + 1, label);
          break;
        }
      }
    }
  }
  
  return labels;
}

function detectSections(code: string, ast?: any): CodeSection[] {
  const lines = code.split('\n');
  const sections: CodeSection[] = [];
  const sectionPattern = /^\/\/\s*---\s*(.+?)\s*---/;
  
  let currentSection: CodeSection | null = null;
  
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = line.match(sectionPattern);
    
    if (match) {
      if (currentSection) {
        currentSection.endLine = index;
        sections.push(currentSection);
      }
      
      currentSection = {
        name: match[1].trim(),
        startLine: index + 2,
        endLine: lines.length
      };
    }
  }
  
  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }
  
  // If no explicit markers found, auto-detect function declarations
  if (sections.length === 0 && ast && ast.body) {
    const functionDeclarations: CodeSection[] = [];
    
    ast.body.forEach((node: any) => {
      // Handle direct function declarations
      if (node.type === 'FunctionDeclaration' && node.id && node.loc) {
        functionDeclarations.push({
          name: node.id.name,
          startLine: node.loc.start.line,
          endLine: node.loc.end.line
        });
      }
      // Handle exported functions: export function QAModal() { ... }
      else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.id && decl.loc) {
          functionDeclarations.push({
            name: decl.id.name,
            startLine: decl.loc.start.line,
            endLine: decl.loc.end.line
          });
        }
      }
      // Handle default exports: export default function QAModal() { ... }
      else if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.loc) {
          functionDeclarations.push({
            name: decl.id?.name || 'default',
            startLine: decl.loc.start.line,
            endLine: decl.loc.end.line
          });
        }
      }
    });
    
    if (functionDeclarations.length > 0) {
      return functionDeclarations;
    }
  }
  
  return sections;
}

function applyDagreLayout(nodes: FlowNode[], edges: FlowEdge[]): void {
  // Separate containers from flow nodes
  const containers = nodes.filter(n => n.type === 'container');
  const flowNodes = nodes.filter(n => n.type !== 'container');
  
  // If we have multiple containers, use a two-phase layout:
  // Phase 1: Position containers horizontally at the top
  // Phase 2: Layout each container's children below it
  if (containers.length > 1) {
    applyHorizontalContainerLayout(containers, flowNodes, edges);
  } else {
    // Single container or no containers - use standard dagre layout
    applyStandardDagreLayout(nodes, edges);
  }
}

// Standard dagre layout for simple cases
function applyStandardDagreLayout(nodes: FlowNode[], edges: FlowEdge[]): void {
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40
  });

  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const isDecision = node.type === 'decision';
    const isContainer = node.type === 'container';
    g.setNode(node.id, {
      width: isContainer ? 240 : (isDecision ? 100 : 150),
      height: isContainer ? 80 : (isDecision ? 100 : 50)
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach((node) => {
    const nodeWithPosition = g.node(node.id);
    if (nodeWithPosition) {
      const isDecision = node.type === 'decision';
      const isContainer = node.type === 'container';
      const width = isContainer ? 240 : (isDecision ? 100 : 150);
      const height = isContainer ? 80 : (isDecision ? 100 : 50);

      node.position = {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      };

      node.style = {
        width,
        height
      };
    }
  });
}

// Two-phase layout: containers horizontal at top, flows below
function applyHorizontalContainerLayout(containers: FlowNode[], flowNodes: FlowNode[], edges: FlowEdge[]): void {
  const CONTAINER_WIDTH = 240;
  const CONTAINER_HEIGHT = 80;
  const CONTAINER_GAP = 80;
  const START_NODE_Y = 20;
  const CONTAINER_Y = 100;
  const FLOW_START_Y = CONTAINER_Y + CONTAINER_HEIGHT + 30;
  
  // Remove parentNode from all flow nodes to use absolute positioning
  // (React Flow interprets parentNode positions as relative, causing layout issues)
  flowNodes.forEach(node => {
    delete node.parentNode;
  });
  
  // Phase 0: Find and position Start node(s) centered at top
  const startNodes = flowNodes.filter(n => n.type === 'input' || n.data?.label === 'Start');
  const regularFlowNodes = flowNodes.filter(n => n.type !== 'input' && n.data?.label !== 'Start');
  
  // Position Start node centered
  startNodes.forEach((node, index) => {
    const width = 150;
    const height = 50;
    node.position = { x: -width / 2 + index * 200, y: START_NODE_Y };
    node.style = { width, height };
  });
  
  // Phase 1: Position containers horizontally, centered
  const totalContainersWidth = containers.length * CONTAINER_WIDTH + (containers.length - 1) * CONTAINER_GAP;
  let containerX = -totalContainersWidth / 2;
  
  containers.forEach((container) => {
    container.position = { x: containerX, y: CONTAINER_Y };
    container.style = { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT };
    containerX += CONTAINER_WIDTH + CONTAINER_GAP;
  });
  
  // Phase 2: Group flow nodes by container using the children array in container data
  const nodesByContainer = new Map<string, FlowNode[]>();
  const nodeIdToNode = new Map<string, FlowNode>();
  regularFlowNodes.forEach(node => nodeIdToNode.set(node.id, node));
  
  // Build groups based on container children arrays
  containers.forEach(container => {
    const childIds = container.data?.children || [];
    const childNodes: FlowNode[] = [];
    childIds.forEach((id: string) => {
      const node = nodeIdToNode.get(id);
      if (node) {
        childNodes.push(node);
        nodeIdToNode.delete(id); // Remove from orphan pool
      }
    });
    nodesByContainer.set(container.id, childNodes);
  });
  
  // Remaining nodes are orphans
  const orphanNodes = Array.from(nodeIdToNode.values());
  
  // Layout each container's children
  containers.forEach((container) => {
    const childNodes = nodesByContainer.get(container.id) || [];
    if (childNodes.length === 0) return;
    
    // Get edges that connect these child nodes
    const childNodeIds = new Set(childNodes.map(n => n.id));
    const childEdges = edges.filter(e => childNodeIds.has(e.source) || childNodeIds.has(e.target));
    
    // Create a sub-graph for this container's nodes
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'TB',
      nodesep: 40,
      ranksep: 50,
      marginx: 15,
      marginy: 15
    });
    g.setDefaultEdgeLabel(() => ({}));
    
    childNodes.forEach(node => {
      const isDecision = node.type === 'decision';
      g.setNode(node.id, {
        width: isDecision ? 100 : 150,
        height: isDecision ? 100 : 50
      });
    });
    
    childEdges.forEach(edge => {
      if (childNodeIds.has(edge.source) && childNodeIds.has(edge.target)) {
        g.setEdge(edge.source, edge.target);
      }
    });
    
    dagre.layout(g);
    
    // Calculate the offset to center this group below its container
    let minX = Infinity, maxX = -Infinity;
    childNodes.forEach(node => {
      const pos = g.node(node.id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
      }
    });
    
    const groupCenterX = (minX + maxX) / 2;
    const containerCenterX = container.position.x + CONTAINER_WIDTH / 2;
    const offsetX = containerCenterX - groupCenterX;
    
    // Apply positions with offset (absolute coordinates)
    childNodes.forEach(node => {
      const pos = g.node(node.id);
      if (pos) {
        const isDecision = node.type === 'decision';
        const width = isDecision ? 100 : 150;
        const height = isDecision ? 100 : 50;
        
        node.position = {
          x: pos.x - width / 2 + offsetX,
          y: pos.y - height / 2 + FLOW_START_Y
        };
        node.style = { width, height };
      }
    });
  });
  
  // Handle orphan nodes - position below last container
  if (orphanNodes.length > 0) {
    const lastContainer = containers[containers.length - 1];
    const orphanX = lastContainer.position.x + CONTAINER_WIDTH / 2 - 75;
    
    orphanNodes.forEach((node, index) => {
      const isDecision = node.type === 'decision';
      const width = isDecision ? 100 : 150;
      const height = isDecision ? 100 : 50;
      
      node.position = {
        x: orphanX,
        y: FLOW_START_Y + index * 80
      };
      node.style = { width, height };
    });
  }
}

export function parseCodeToFlow(code: string): FlowData {
  try {
    // Strip TypeScript syntax first, then preprocess React code
    const tsStripped = stripTypeScript(code);
    const processedCode = preprocessReactCode(tsStripped);
    
    let ast;
    try {
      ast = acorn.parse(processedCode, { ecmaVersion: 2020, locations: true, sourceType: 'module' });
    } catch {
      ast = acorn.parse(processedCode, { ecmaVersion: 2020, locations: true, sourceType: 'script' });
    }
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const nodeMap = new Map<string, string>();
    let nodeIdCounter = 0;

    // Detect user-defined labels from // @logigo: comments (use processed code)
    const userLabels = detectUserLabels(processedCode);
    
    // Detect sections from comment markers (or auto-detect functions) - use processed code
    const sections = detectSections(processedCode, ast);
    const containerNodes: Map<string, FlowNode> = new Map();
    
    // Create container nodes for each section
    if (sections.length > 0) {
      sections.forEach(section => {
        const containerId = `container-${nodeIdCounter++}`;
        const containerNode: FlowNode = {
          id: containerId,
          type: 'container',
          data: { 
            label: section.name,
            children: [],
            collapsed: false
          },
          position: { x: 0, y: 0 },
          style: { width: 400, height: 200 }
        };
        nodes.push(containerNode);
        containerNodes.set(`${section.startLine}-${section.endLine}`, containerNode);
      });
    } else {
      // Fallback: Create a default "Global Flow" container when no sections are detected
      const globalContainerId = `container-${nodeIdCounter++}`;
      const globalContainer: FlowNode = {
        id: globalContainerId,
        type: 'container',
        data: { 
          label: 'Global Flow',
          children: [],
          collapsed: false
        },
        position: { x: 0, y: 0 },
        style: { width: 400, height: 200 }
      };
      nodes.push(globalContainer);
      containerNodes.set('global', globalContainer);
    }

    // Helper to extract source code snippet from location (use processed code)
    const codeLines = processedCode.split('\n');
    const extractSourceSnippet = (loc: SourceLocation | undefined): string | undefined => {
      if (!loc) return undefined;
      try {
        // For single-line statements, extract just that line (trimmed)
        if (loc.start.line === loc.end.line) {
          const line = codeLines[loc.start.line - 1];
          if (line) {
            return line.trim();
          }
        }
        // For multi-line, extract the first line (usually contains the key info)
        const firstLine = codeLines[loc.start.line - 1];
        if (firstLine) {
          return firstLine.trim();
        }
      } catch {
        return undefined;
      }
      return undefined;
    };

    // Container override stack - when set, nodes are parented to this container instead of using sections
    let containerOverride: { containerId: string; containerNode: FlowNode } | null = null;
    
    const createNode = (stmt: any, label: string, type: FlowNode['type'] = 'default', className?: string, loc?: SourceLocation): FlowNode => {
      const id = `node-${nodeIdCounter++}`;
      const isDecision = type === 'decision';

      if (stmt?.loc) {
        const locKey = `${stmt.loc.start.line}:${stmt.loc.start.column}`;
        nodeMap.set(locKey, id);
      }
      
      // Look up user-defined label from // @logigo: comment
      let userLabel: string | undefined;
      if (stmt?.loc) {
        userLabel = userLabels.get(stmt.loc.start.line);
      }
      
      // Extract source code snippet for tooltip display
      const sourceSnippet = extractSourceSnippet(loc);
      
      // Determine if this node belongs to a section/container
      let parentNode: string | undefined;
      
      // Check for container override first (used for method bodies)
      if (containerOverride) {
        parentNode = containerOverride.containerId;
        if (!containerOverride.containerNode.data.children) {
          containerOverride.containerNode.data.children = [];
        }
        containerOverride.containerNode.data.children.push(id);
      } else if (sections.length > 0 && stmt?.loc) {
        const nodeLine = stmt.loc.start.line;
        for (const section of sections) {
          if (nodeLine >= section.startLine && nodeLine <= section.endLine) {
            const containerKey = `${section.startLine}-${section.endLine}`;
            const container = containerNodes.get(containerKey);
            if (container) {
              parentNode = container.id;
              if (!container.data.children) {
                container.data.children = [];
              }
              container.data.children.push(id);
            }
            break;
          }
        }
      } else if (sections.length === 0 && !containerOverride) {
        const globalContainer = containerNodes.get('global');
        if (globalContainer) {
          parentNode = globalContainer.id;
          if (!globalContainer.data.children) {
            globalContainer.data.children = [];
          }
          globalContainer.data.children.push(id);
        }
      }

      return {
        id,
        type,
        data: { label, userLabel, sourceSnippet, sourceData: loc },
        position: { x: 0, y: 0 },
        className,
        parentNode,
        style: {
          width: isDecision ? 120 : 180,
          height: isDecision ? 120 : 60
        }
      };
    };

    const createEdge = (source: string, target: string, label?: string, style?: any): FlowEdge => {
      return {
        id: `edge-${source}-${target}`,
        source,
        target,
        label,
        type: 'smoothstep',
        animated: true,
        style: style || { stroke: 'var(--color-muted-foreground)' }
      };
    };

    const startNode = createNode(null, 'Start', 'input', 'bg-primary text-primary-foreground border-none');
    nodes.push(startNode);

    // Track loop contexts for break/continue
    const loopStack: {
      conditionId: string;
      exitId: string;
      breakNodes: string[];
      continueNodes: string[];
      type: 'loop'
    }[] = [];

    const processBlock = (statements: any[], parentId: string): string | null => {
      let currentParent: string | null = parentId;

      for (const stmt of statements) {
        if (currentParent === null) break;

        const loc: SourceLocation = stmt.loc;

        if (stmt.type === 'VariableDeclaration') {
          const decl = stmt.declarations[0];
          const label = `${stmt.kind} ${decl.id.name} = ...`;
          const node = createNode(stmt, label, 'default', undefined, loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ExpressionStatement') {
          let label = 'Expression';
          let checkpointId: string | undefined;
          
          if (stmt.expression.type === 'AssignmentExpression') {
            label = `${stmt.expression.left.name} = ...`;
          } else if (stmt.expression.type === 'CallExpression') {
            const calleeName = stmt.expression.callee?.name || 
                               (stmt.expression.callee?.property?.name) || 
                               'fn';
            label = `${calleeName}(...)`;
            
            // Extract checkpoint ID from checkpoint() or LogiGo.checkpoint() calls
            const isCheckpoint = calleeName === 'checkpoint' || 
                                 (stmt.expression.callee?.object?.name === 'LogiGo' && 
                                  stmt.expression.callee?.property?.name === 'checkpoint');
            
            if (isCheckpoint && stmt.expression.arguments?.length > 0) {
              const firstArg = stmt.expression.arguments[0];
              if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                checkpointId = firstArg.value;
                label = `checkpoint('${checkpointId}', ...)`;
              }
            }
          }
          
          const node = createNode(stmt, label, 'default', undefined, loc);
          // Set checkpointId as userLabel for remote session matching
          if (checkpointId && node.data) {
            node.data.userLabel = checkpointId;
          }
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = node.id;
        } else if (stmt.type === 'ReturnStatement') {
          const label = stmt.argument ? `return ...` : 'return';
          const node = createNode(stmt, label, 'output', 'bg-destructive/20 border-destructive/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));
          currentParent = null;
        } else if (stmt.type === 'BreakStatement') {
          const node = createNode(stmt, 'break', 'default', 'bg-yellow-500/20 border-yellow-500/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));

          if (loopStack.length > 0) {
            const currentLoop = loopStack[loopStack.length - 1];
            currentLoop.breakNodes.push(node.id);
          }

          currentParent = null;
        } else if (stmt.type === 'ContinueStatement') {
          const node = createNode(stmt, 'continue', 'default', 'bg-blue-500/20 border-blue-500/50', loc);
          nodes.push(node);
          edges.push(createEdge(currentParent, node.id));

          if (loopStack.length > 0) {
            const currentLoop = loopStack[loopStack.length - 1];
            currentLoop.continueNodes.push(node.id);
          }

          currentParent = node.id;
          break;
        } else if (stmt.type === 'IfStatement') {
          // Extract actual condition text for better diff detection
          let testLabel = 'condition';
          if (stmt.test.type === 'Identifier') {
            testLabel = stmt.test.name;
          } else if (stmt.test.type === 'BinaryExpression') {
            // Build readable condition from binary expression
            const left = stmt.test.left.name || stmt.test.left.value || 
                        (stmt.test.left.object?.name ? `${stmt.test.left.object.name}.${stmt.test.left.property?.name}` : 'expr');
            const op = stmt.test.operator;
            const right = stmt.test.right.name || stmt.test.right.value || 'expr';
            testLabel = `${left} ${op} ${right}`;
          } else if (stmt.test.type === 'CallExpression') {
            testLabel = stmt.test.callee?.name ? `${stmt.test.callee.name}()` : 'fn()';
          } else if (stmt.test.type === 'MemberExpression') {
            testLabel = `${stmt.test.object?.name || 'obj'}.${stmt.test.property?.name || 'prop'}`;
          }
          const decisionNode = createNode(stmt, `if (${testLabel}) ?`, 'decision', undefined, loc);

          nodes.push(decisionNode);
          edges.push(createEdge(currentParent, decisionNode.id));

          const trueBranchNodes: any[] = stmt.consequent.type === 'BlockStatement' ? stmt.consequent.body : [stmt.consequent];
          const trueEndId = processBlock(trueBranchNodes, decisionNode.id);

          const lastEdge = edges[edges.length - 1];
          if (lastEdge && lastEdge.source === decisionNode.id) {
            lastEdge.label = 'True';
            lastEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }

          if (stmt.alternate) {
            const falseBranchNodes: any[] = stmt.alternate.type === 'BlockStatement' ? stmt.alternate.body : [stmt.alternate];
            const falseEndId = processBlock(falseBranchNodes, decisionNode.id);

            const lastEdgeFalse = edges[edges.length - 1];
            if (lastEdgeFalse && lastEdgeFalse.source === decisionNode.id) {
              lastEdgeFalse.label = 'False';
              lastEdgeFalse.style = { stroke: 'hsl(0, 84%, 60%)' };
            }
          }

          currentParent = decisionNode.id;
        } else if (stmt.type === 'WhileStatement') {
          const loopCondition = createNode(stmt, 'while (...) ?', 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));

          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');

          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);

          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);

          loopStack.pop();

          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }

          if (bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';

            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });

          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }

          currentParent = loopExit.id;
        } else if (stmt.type === 'ForStatement') {
          if (stmt.init) {
            let initLabel = 'for init';
            if (stmt.init.type === 'VariableDeclaration') {
              const decl = stmt.init.declarations[0];
              initLabel = `${stmt.init.kind} ${decl.id.name} = ...`;
            }
            const initNode = createNode(stmt.init, initLabel, 'default', undefined, stmt.init.loc);
            nodes.push(initNode);
            edges.push(createEdge(currentParent, initNode.id));
            currentParent = initNode.id;
          }

          // Extract actual for loop condition for better diff detection
          let forTestLabel = '...';
          if (stmt.test?.type === 'BinaryExpression') {
            const left = stmt.test.left.name || stmt.test.left.value || 'expr';
            const op = stmt.test.operator;
            const right = stmt.test.right.name || stmt.test.right.value || 'expr';
            forTestLabel = `${left} ${op} ${right}`;
          } else if (stmt.test?.type === 'Identifier') {
            forTestLabel = stmt.test.name;
          }
          const loopCondition = createNode(stmt.test, `for (${forTestLabel}) ?`, 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));

          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');

          let updateNode: FlowNode | null = null;
          if (stmt.update) {
            updateNode = createNode(stmt.update, 'update', 'default', undefined, stmt.update.loc);
            nodes.push(updateNode);
          }

          const loopContext = {
            conditionId: updateNode ? updateNode.id : loopCondition.id,
            exitId: loopExit.id,
            breakNodes: [] as string[],
            continueNodes: [] as string[],
            type: 'loop' as const
          };
          loopStack.push(loopContext);

          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);

          loopStack.pop();

          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'True';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }

          if (updateNode) {
            edges.push({
              ...createEdge(updateNode.id, loopCondition.id, 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });

            if (bodyEndId !== null) {
              const hasEdgeToUpdate = edges.some(e => e.source === bodyEndId && e.target === updateNode!.id);
              if (!hasEdgeToUpdate) {
                const bodyEndNode = nodes.find(n => n.id === bodyEndId);
                const isContinue = bodyEndNode?.data.label === 'continue';
                edges.push({
                  ...createEdge(bodyEndId, updateNode.id, isContinue ? 'Continue' : undefined),
                  ...(isContinue ? { style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' } } : {})
                });
              }
            }
          } else if (bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';

            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          const continueTarget = updateNode ? updateNode.id : loopCondition.id;
          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, continueTarget, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });

          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }

          currentParent = loopExit.id;
        } else if (stmt.type === 'DoWhileStatement') {
          const loopCondition = createNode(stmt, 'while (...) ?', 'decision', undefined, loc);
          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');
          const bodyStartParent = currentParent;

          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);

          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, currentParent);

          loopStack.pop();

          nodes.push(loopCondition);
          if (bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';
            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : undefined),
              ...(isContinue ? { style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' } } : {})
            });
          }

          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          const bodyStartNode = nodes.find(n => edges.some(e => e.source === bodyStartParent && e.target === n.id));
          if (bodyStartNode) {
            edges.push({
              ...createEdge(loopCondition.id, bodyStartNode.id, 'True'),
              animated: true,
              style: { stroke: 'hsl(142, 71%, 45%)', strokeDasharray: '5,5' }
            });
          }

          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'False'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });

          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }

          currentParent = loopExit.id;
        } else if (stmt.type === 'ForInStatement' || stmt.type === 'ForOfStatement') {
          const loopType = stmt.type === 'ForInStatement' ? 'for...in' : 'for...of';
          const loopCondition = createNode(stmt, `${loopType} ?`, 'decision', undefined, loc);
          nodes.push(loopCondition);
          edges.push(createEdge(currentParent, loopCondition.id));

          const loopExit = createNode(null, 'loop exit', 'default', 'opacity-0');

          const loopContext = { conditionId: loopCondition.id, exitId: loopExit.id, breakNodes: [] as string[], continueNodes: [] as string[], type: 'loop' as const };
          loopStack.push(loopContext);

          const bodyNodes: any[] = stmt.body.type === 'BlockStatement' ? stmt.body.body : [stmt.body];
          const bodyEndId = processBlock(bodyNodes, loopCondition.id);

          loopStack.pop();

          const lastTrueEdge = edges[edges.length - 1];
          if (lastTrueEdge && lastTrueEdge.source === loopCondition.id && bodyNodes.length > 0) {
            lastTrueEdge.label = 'Next';
            lastTrueEdge.style = { stroke: 'hsl(142, 71%, 45%)' };
          }

          if (bodyEndId !== null) {
            const bodyEndNode = nodes.find(n => n.id === bodyEndId);
            const isContinue = bodyEndNode?.data.label === 'continue';

            edges.push({
              ...createEdge(bodyEndId, loopCondition.id, isContinue ? 'Continue' : 'Loop'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          for (const continueNodeId of loopContext.continueNodes) {
            edges.push({
              ...createEdge(continueNodeId, loopCondition.id, 'Continue'),
              animated: true,
              style: { stroke: 'hsl(217, 91%, 60%)', strokeDasharray: '5,5' }
            });
          }

          nodes.push(loopExit);
          edges.push({
            ...createEdge(loopCondition.id, loopExit.id, 'Done'),
            style: { stroke: 'hsl(0, 84%, 60%)' }
          });

          for (const breakNodeId of loopContext.breakNodes) {
            edges.push({
              ...createEdge(breakNodeId, loopExit.id, 'Break'),
              style: { stroke: 'hsl(48, 96%, 53%)', strokeDasharray: '5,5' }
            });
          }

          currentParent = loopExit.id;
        }
      }
      return currentParent;
    };

    // Helper to process class declarations
    const processClass = (classNode: any, parentId: string): string => {
      const className = classNode.id?.name || 'AnonymousClass';
      const extendsClause = classNode.superClass?.name ? ` extends ${classNode.superClass.name}` : '';
      
      // Create a container for the class
      const classContainerId = `container-${nodeIdCounter++}`;
      const classContainer: FlowNode = {
        id: classContainerId,
        type: 'container',
        data: {
          label: `class ${className}${extendsClause}`,
          children: [],
          collapsed: false
        },
        position: { x: 0, y: 0 },
        style: { width: 400, height: 200 }
      };
      nodes.push(classContainer);
      
      // Create a start node for the class
      const classStartId = `node-${nodeIdCounter++}`;
      const classStartNode: FlowNode = {
        id: classStartId,
        type: 'input',
        data: { label: `class ${className}` },
        position: { x: 0, y: 0 },
        parentNode: classContainerId,
        className: 'bg-violet-600 text-white border-none',
        style: { width: 180, height: 60 }
      };
      nodes.push(classStartNode);
      classContainer.data.children!.push(classStartId);
      edges.push(createEdge(parentId, classStartId));
      
      let lastNodeId = classStartId;
      
      // Process class body members
      const classBody = classNode.body?.body || [];
      for (const member of classBody) {
        if (member.type === 'MethodDefinition') {
          // Get method name and modifiers
          const methodName = member.key?.name || member.key?.value || 'method';
          const isConstructor = member.kind === 'constructor';
          const isStatic = member.static;
          const isGetter = member.kind === 'get';
          const isSetter = member.kind === 'set';
          
          let methodLabel = methodName;
          if (isConstructor) methodLabel = 'constructor';
          if (isStatic) methodLabel = `static ${methodLabel}`;
          if (isGetter) methodLabel = `get ${methodLabel}`;
          if (isSetter) methodLabel = `set ${methodLabel}`;
          methodLabel += '()';
          
          // Create a container for this method
          const methodContainerId = `container-${nodeIdCounter++}`;
          const methodContainer: FlowNode = {
            id: methodContainerId,
            type: 'container',
            data: {
              label: methodLabel,
              children: [],
              collapsed: true  // Start collapsed for cleaner view
            },
            position: { x: 0, y: 0 },
            style: { width: 350, height: 150 }
          };
          nodes.push(methodContainer);
          classContainer.data.children!.push(methodContainerId);
          
          // Create method entry node
          const methodEntryId = `node-${nodeIdCounter++}`;
          const methodEntryNode: FlowNode = {
            id: methodEntryId,
            type: 'input',
            data: { label: methodLabel },
            position: { x: 0, y: 0 },
            parentNode: methodContainerId,
            className: isConstructor ? 'bg-amber-600 text-white border-none' : 'bg-blue-600 text-white border-none',
            style: { width: 160, height: 50 }
          };
          nodes.push(methodEntryNode);
          methodContainer.data.children!.push(methodEntryId);
          edges.push(createEdge(lastNodeId, methodEntryId));
          
          // Process method body if it has one
          const methodBody = member.value?.body?.body;
          if (methodBody && methodBody.length > 0) {
            // Set container override so method body nodes are parented to method container
            const previousOverride = containerOverride;
            containerOverride = { containerId: methodContainerId, containerNode: methodContainer };
            const methodEndId = processBlock(methodBody, methodEntryId);
            containerOverride = previousOverride; // Restore previous override
            
            // Add method exit node
            const methodExitId = `node-${nodeIdCounter++}`;
            const methodExitNode: FlowNode = {
              id: methodExitId,
              type: 'output',
              data: { label: `end ${methodName}` },
              position: { x: 0, y: 0 },
              parentNode: methodContainerId,
              className: 'bg-slate-600 text-white border-none',
              style: { width: 120, height: 40 }
            };
            nodes.push(methodExitNode);
            methodContainer.data.children!.push(methodExitId);
            if (methodEndId) {
              edges.push(createEdge(methodEndId, methodExitId));
            }
            lastNodeId = methodExitId;
          } else {
            // Empty method body
            const emptyNodeId = `node-${nodeIdCounter++}`;
            const emptyNode: FlowNode = {
              id: emptyNodeId,
              type: 'default',
              data: { label: '(empty)' },
              position: { x: 0, y: 0 },
              parentNode: methodContainerId,
              className: 'bg-slate-500 text-white border-none opacity-60',
              style: { width: 80, height: 30 }
            };
            nodes.push(emptyNode);
            methodContainer.data.children!.push(emptyNodeId);
            edges.push(createEdge(methodEntryId, emptyNodeId));
            lastNodeId = emptyNodeId;
          }
        } else if (member.type === 'PropertyDefinition') {
          // Class fields/properties
          const propName = member.key?.name || 'property';
          const isStatic = member.static;
          const propLabel = isStatic ? `static ${propName}` : propName;
          
          const propNodeId = `node-${nodeIdCounter++}`;
          const propNode: FlowNode = {
            id: propNodeId,
            type: 'default',
            data: { label: propLabel },
            position: { x: 0, y: 0 },
            parentNode: classContainerId,
            className: 'bg-slate-700 text-white border-none',
            style: { width: 140, height: 40 }
          };
          nodes.push(propNode);
          classContainer.data.children!.push(propNodeId);
          edges.push(createEdge(lastNodeId, propNodeId));
          lastNodeId = propNodeId;
        }
      }
      
      return lastNodeId;
    };

    // @ts-ignore
    const body = ast.body;
    
    // Helper to unwrap export declarations
    const unwrapExport = (stmt: any) => {
      if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration) {
        return stmt.declaration;
      }
      if (stmt.type === 'ExportDefaultDeclaration' && stmt.declaration) {
        return stmt.declaration;
      }
      return stmt;
    };
    
    // Separate function declarations and class declarations from other statements
    // Handle both direct declarations and exported declarations
    // @ts-ignore
    const functionDeclarations = body
      .map(unwrapExport)
      .filter((stmt: any) => stmt.type === 'FunctionDeclaration');
    // @ts-ignore
    const classDeclarations = body
      .map(unwrapExport)
      .filter((stmt: any) => stmt.type === 'ClassDeclaration');
    // @ts-ignore
    const topLevelExecutable = body.filter((stmt: any) => {
      const unwrapped = unwrapExport(stmt);
      return unwrapped.type !== 'FunctionDeclaration' && unwrapped.type !== 'ClassDeclaration';
    });
    
    // Check if top-level statements are "trivial" (just variable declarations and simple function calls)
    // If so, prefer showing function/class bodies which have the actual algorithm logic
    const hasTrivialTopLevel = topLevelExecutable.length > 0 && topLevelExecutable.every((stmt: any) => 
      stmt.type === 'VariableDeclaration' || 
      stmt.type === 'ExpressionStatement'
    );
    
    let lastProcessedId = startNode.id;
    
    // Process class declarations if present
    if (classDeclarations.length > 0) {
      for (const classDecl of classDeclarations) {
        lastProcessedId = processClass(classDecl, lastProcessedId);
      }
    }
    
    // Process function declarations - expand their bodies for detailed view
    if (functionDeclarations.length > 0) {
      for (const funcDecl of functionDeclarations) {
        // @ts-ignore
        const funcBody = funcDecl.body?.body;
        if (funcBody && funcBody.length > 0) {
          // @ts-ignore
          const funcName = funcDecl.id?.name || 'function';
          
          // Create a container for the function
          const funcContainerId = `container-${nodeIdCounter++}`;
          const funcContainer: FlowNode = {
            id: funcContainerId,
            type: 'container',
            data: {
              label: `function ${funcName}()`,
              children: [],
              collapsed: classDeclarations.length > 0 // Collapse if classes are also present
            },
            position: { x: 0, y: 0 },
            style: { width: 350, height: 150 }
          };
          nodes.push(funcContainer);
          
          // Create function entry node
          const funcEntryId = `node-${nodeIdCounter++}`;
          const funcEntryNode: FlowNode = {
            id: funcEntryId,
            type: 'input',
            data: { label: `${funcName}()` },
            position: { x: 0, y: 0 },
            parentNode: funcContainerId,
            className: 'bg-green-600 text-white border-none',
            style: { width: 160, height: 50 }
          };
          nodes.push(funcEntryNode);
          funcContainer.data.children!.push(funcEntryId);
          edges.push(createEdge(lastProcessedId, funcEntryId));
          
          // Set container override and process function body
          const previousOverride: typeof containerOverride = containerOverride;
          containerOverride = { containerId: funcContainerId, containerNode: funcContainer };
          const funcEndId = processBlock(funcBody, funcEntryId);
          containerOverride = previousOverride;
          
          lastProcessedId = funcEndId || funcEntryId;
        }
      }
    }
    
    // Process remaining top-level executable statements if not trivial
    if (topLevelExecutable.length > 0 && !hasTrivialTopLevel) {
      processBlock(topLevelExecutable, lastProcessedId);
    } else if (classDeclarations.length === 0 && functionDeclarations.length === 0) {
      // No classes or functions - just process everything
      processBlock(body, startNode.id);
    }

    // Remove invisible loop exit nodes and redirect their edges
    const exitNodes = nodes.filter(n => n.data.label === 'loop exit');
    for (const exitNode of exitNodes) {
      const incomingEdges = edges.filter(e => e.target === exitNode.id);
      const outgoingEdges = edges.filter(e => e.source === exitNode.id);

      if (outgoingEdges.length > 0) {
        const nextTarget = outgoingEdges[0].target;
        for (const inEdge of incomingEdges) {
          inEdge.target = nextTarget;
        }
      }

      const nodeIndex = nodes.indexOf(exitNode);
      if (nodeIndex > -1) nodes.splice(nodeIndex, 1);

      for (const outEdge of outgoingEdges) {
        const edgeIndex = edges.indexOf(outEdge);
        if (edgeIndex > -1) edges.splice(edgeIndex, 1);
      }
    }

    // Apply dagre layout for automatic positioning
    applyDagreLayout(nodes, edges);

    return {
      nodes,
      edges,
      nodeMap
    };

  } catch (e) {
    // Silently handle expected parse errors during typing (incomplete code)
    // Only log unexpected errors for debugging
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const isExpectedTypingError = 
      errorMessage.includes('Unterminated') ||
      errorMessage.includes('Unexpected token') ||
      errorMessage.includes('Unexpected end of input') ||
      errorMessage.includes('missing )') ||
      errorMessage.includes('missing }');
    
    if (!isExpectedTypingError) {
      console.error('Parse error:', e);
    }
    
    return {
      nodes: [{
        id: 'error',
        type: 'default',
        data: { label: `Parse Error: ${errorMessage}` },
        position: { x: 250, y: 100 },
        className: 'bg-destructive/20 border-destructive',
        style: { width: 200, height: 60 }
      }],
      edges: [],
      nodeMap: new Map()
    };
  }
}
