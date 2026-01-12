import React, { useState } from 'react';
import { LogicArtEmbed } from '../../../packages/logicart-embed/src';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Code2, Eye } from 'lucide-react';
import { Link } from 'wouter';

const LOGICART_CODE_EXTRACTOR = `
function extractFunctionsAndClasses(code) {
  const items = [];
  const lines = code.split('\\n');
  
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'module' });
  } catch (e) {
    ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'script' });
  }

  let itemId = 0;
  
  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration' && node.id) {
      const startLine = node.loc.start.line;
      const endLine = node.loc.end.line;
      const functionCode = lines.slice(startLine - 1, endLine).join('\\n');
      
      items.push({
        id: 'func-' + itemId++,
        name: node.id.name,
        type: 'function',
        startLine,
        endLine,
        code: functionCode
      });
    } else if (node.type === 'ClassDeclaration') {
      const className = node.id?.name || 'AnonymousClass';
      const startLine = node.loc.start.line;
      const endLine = node.loc.end.line;
      const classCode = lines.slice(startLine - 1, endLine).join('\\n');
      
      const methods = [];
      
      if (node.body && node.body.body) {
        for (const member of node.body.body) {
          if (member.type === 'MethodDefinition') {
            const methodName = member.key?.name || 'method';
            methods.push({
              id: 'method-' + itemId++,
              name: methodName,
              type: 'method',
              parentClass: className
            });
          }
        }
      }
      
      items.push({
        id: 'class-' + itemId++,
        name: className,
        type: 'class',
        startLine,
        endLine,
        code: classCode,
        children: methods
      });
    }
  }

  return {
    items,
    totalLines: lines.length,
    hasClasses: items.some(i => i.type === 'class'),
    hasFunctions: items.some(i => i.type === 'function')
  };
}
`;

const LOGICART_PARSER = `
function parseToFlowchart(code) {
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  
  const ast = acorn.parse(code, { 
    ecmaVersion: 2020, 
    locations: true 
  });
  
  function processNode(node, parentId) {
    const currentId = 'node-' + nodeId++;
    
    if (node.type === 'IfStatement') {
      nodes.push({
        id: currentId,
        type: 'decision',
        label: 'if (' + node.test.name + ')'
      });
      
      if (parentId) {
        edges.push({ source: parentId, target: currentId });
      }
      
      const consequentId = processNode(node.consequent, currentId);
      edges.push({ 
        source: currentId, 
        target: consequentId, 
        label: 'true' 
      });
      
      if (node.alternate) {
        const alternateId = processNode(node.alternate, currentId);
        edges.push({ 
          source: currentId, 
          target: alternateId, 
          label: 'false' 
        });
      }
      
      return currentId;
    }
    
    if (node.type === 'ForStatement') {
      nodes.push({
        id: currentId,
        type: 'loop',
        label: 'for loop'
      });
      
      if (parentId) {
        edges.push({ source: parentId, target: currentId });
      }
      
      return currentId;
    }
    
    if (node.type === 'ReturnStatement') {
      nodes.push({
        id: currentId,
        type: 'return',
        label: 'return'
      });
      
      if (parentId) {
        edges.push({ source: parentId, target: currentId });
      }
      
      return currentId;
    }
    
    nodes.push({
      id: currentId,
      type: 'statement',
      label: node.type
    });
    
    if (parentId) {
      edges.push({ source: parentId, target: currentId });
    }
    
    return currentId;
  }
  
  for (const statement of ast.body) {
    processNode(statement, null);
  }
  
  return { nodes, edges };
}
`;

const LOGICART_INTERPRETER = `
function executeStep(state) {
  const { code, currentLine, variables, callStack } = state;
  
  if (currentLine >= code.length) {
    return { ...state, finished: true };
  }
  
  const line = code[currentLine];
  const newVariables = { ...variables };
  
  if (line.type === 'VariableDeclaration') {
    for (const decl of line.declarations) {
      const name = decl.id.name;
      const value = evaluateExpression(decl.init, variables);
      newVariables[name] = value;
    }
  }
  
  if (line.type === 'ExpressionStatement') {
    if (line.expression.type === 'AssignmentExpression') {
      const name = line.expression.left.name;
      const value = evaluateExpression(line.expression.right, variables);
      newVariables[name] = value;
    }
  }
  
  if (line.type === 'IfStatement') {
    const condition = evaluateExpression(line.test, variables);
    if (condition) {
      return {
        ...state,
        currentLine: currentLine + 1,
        variables: newVariables,
        branch: 'consequent'
      };
    } else {
      return {
        ...state,
        currentLine: findElseLine(code, currentLine),
        variables: newVariables,
        branch: 'alternate'
      };
    }
  }
  
  if (line.type === 'ForStatement') {
    const condition = evaluateExpression(line.test, variables);
    if (condition) {
      return {
        ...state,
        currentLine: currentLine + 1,
        variables: newVariables,
        inLoop: true
      };
    } else {
      return {
        ...state,
        currentLine: findLoopEnd(code, currentLine),
        variables: newVariables,
        inLoop: false
      };
    }
  }
  
  if (line.type === 'ReturnStatement') {
    const returnValue = evaluateExpression(line.argument, variables);
    return {
      ...state,
      finished: true,
      returnValue,
      variables: newVariables
    };
  }
  
  return {
    ...state,
    currentLine: currentLine + 1,
    variables: newVariables
  };
}

function evaluateExpression(expr, variables) {
  if (expr.type === 'Literal') {
    return expr.value;
  }
  if (expr.type === 'Identifier') {
    return variables[expr.name];
  }
  if (expr.type === 'BinaryExpression') {
    const left = evaluateExpression(expr.left, variables);
    const right = evaluateExpression(expr.right, variables);
    switch (expr.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '===': return left === right;
      default: return undefined;
    }
  }
  return undefined;
}
`;

const CODE_SAMPLES = [
  { name: 'Code Extractor', code: LOGICART_CODE_EXTRACTOR, description: 'Parses JavaScript files to find functions and classes' },
  { name: 'Parser', code: LOGICART_PARSER, description: 'Converts AST to flowchart nodes and edges' },
  { name: 'Interpreter', code: LOGICART_INTERPRETER, description: 'Step-by-step JavaScript execution engine' },
];

export default function SelfVisualize() {
  const [selectedSample, setSelectedSample] = useState(0);
  const code = CODE_SAMPLES[selectedSample].code;

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Studio
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">LogicArt Visualizing Itself</h1>
            <p className="text-muted-foreground">A meta experiment: using LogicArt to understand its own code</p>
          </div>
        </div>

        <div className="mt-8 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Select LogicArt Component
          </h2>
          <div className="flex flex-wrap gap-2">
            {CODE_SAMPLES.map((sample, index) => (
              <Button 
                key={sample.name}
                variant={selectedSample === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSample(index)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {sample.name}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {CODE_SAMPLES[selectedSample].description}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">LogicArt Source Code</h2>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono whitespace-pre max-h-80">
            {code.trim()}
          </pre>
        </div>

        <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
          <p className="text-sm text-violet-400">
            <strong>The flowchart in the corner shows LogicArt's own code!</strong> 
            {' '}This is the actual logic that powers the tool you're using.
          </p>
        </div>
      </div>

      <LogicArtEmbed 
        code={code}
        position="bottom-right"
        defaultOpen={true}
        defaultSize={{ width: 500, height: 450 }}
        onReady={() => console.log('[SelfVisualize] LogicArt ready!')}
      />
    </div>
  );
}
