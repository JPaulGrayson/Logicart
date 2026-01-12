import * as acorn from 'acorn';

export interface ExtractedItem {
  id: string;
  name: string;
  type: 'function' | 'class' | 'method';
  startLine: number;
  endLine: number;
  code: string;
  parentClass?: string;
  classSignature?: string;
  children?: ExtractedItem[];
}

export interface ExtractionResult {
  items: ExtractedItem[];
  totalLines: number;
  hasClasses: boolean;
  hasFunctions: boolean;
}

export function extractFunctionsAndClasses(code: string): ExtractionResult {
  const items: ExtractedItem[] = [];
  const lines = code.split('\n');
  
  try {
    let ast;
    try {
      ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'module' });
    } catch {
      ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'script' });
    }

    let itemId = 0;
    
    for (const node of (ast as any).body) {
      if (node.type === 'FunctionDeclaration' && node.id) {
        const startLine = node.loc.start.line;
        const endLine = node.loc.end.line;
        const functionCode = lines.slice(startLine - 1, endLine).join('\n');
        
        items.push({
          id: `func-${itemId++}`,
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
        const classCode = lines.slice(startLine - 1, endLine).join('\n');
        
        let classSignature = '';
        const bodyStartLine = node.body.loc.start.line;
        const bodyStartCol = node.body.loc.start.column;
        
        for (let i = startLine - 1; i < bodyStartLine; i++) {
          const line = lines[i];
          if (i === bodyStartLine - 1) {
            const upToBrace = line.substring(0, bodyStartCol).trim();
            if (classSignature && upToBrace) classSignature += ' ';
            classSignature += upToBrace;
          } else {
            const trimmed = line.trim();
            if (classSignature && trimmed) classSignature += ' ';
            classSignature += trimmed;
          }
        }
        classSignature = classSignature.trim() || `class ${className}`;
        
        const methods: ExtractedItem[] = [];
        
        if (node.body && node.body.body) {
          for (const member of node.body.body) {
            if (member.type === 'MethodDefinition') {
              const methodName = member.key?.name || member.key?.value || 'method';
              const methodStartLine = member.loc.start.line;
              const methodEndLine = member.loc.end.line;
              const methodCode = lines.slice(methodStartLine - 1, methodEndLine).join('\n');
              
              let displayName = methodName;
              if (member.kind === 'constructor') displayName = 'constructor';
              if (member.static) displayName = `static ${displayName}`;
              if (member.kind === 'get') displayName = `get ${displayName}`;
              if (member.kind === 'set') displayName = `set ${displayName}`;
              
              methods.push({
                id: `method-${itemId++}`,
                name: displayName,
                type: 'method',
                startLine: methodStartLine,
                endLine: methodEndLine,
                code: methodCode,
                parentClass: className
              });
            }
          }
        }
        
        items.push({
          id: `class-${itemId++}`,
          name: className,
          type: 'class',
          startLine,
          endLine,
          code: classCode,
          classSignature,
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
  } catch (error) {
    console.error('Failed to extract functions/classes:', error);
    return {
      items: [],
      totalLines: lines.length,
      hasClasses: false,
      hasFunctions: false
    };
  }
}

export function getCodeForItem(item: ExtractedItem): string {
  return item.code;
}

export function getCodeForItems(items: ExtractedItem[]): string {
  return items.map(item => item.code).join('\n\n');
}

export function getCodeForSelection(
  allItems: ExtractedItem[],
  selectedIds: Set<string>
): string {
  const codeParts: string[] = [];
  
  for (const item of allItems) {
    if (item.type === 'function') {
      if (selectedIds.has(item.id)) {
        codeParts.push(item.code);
      }
    } else if (item.type === 'class') {
      const classSelected = selectedIds.has(item.id);
      const selectedMethods = item.children?.filter(m => selectedIds.has(m.id)) || [];
      
      if (classSelected) {
        codeParts.push(item.code);
      } else if (selectedMethods.length > 0) {
        const methodsCode = selectedMethods.map(m => '  ' + m.code.split('\n').join('\n  ')).join('\n\n');
        const signature = item.classSignature || `class ${item.name}`;
        codeParts.push(`${signature} {\n${methodsCode}\n}`);
      }
    }
  }
  
  return codeParts.join('\n\n');
}
