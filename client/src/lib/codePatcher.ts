import { SourceLocation } from './parser';

export function patchCode(
  originalCode: string,
  location: SourceLocation,
  newContent: string
): string {
  const lines = originalCode.split('\n');
  const startLine = location.start.line - 1; // Convert to 0-indexed
  const endLine = location.end.line - 1;
  const startCol = location.start.column;
  const endCol = location.end.column;

  if (startLine === endLine) {
    // Single line replacement
    const line = lines[startLine];
    lines[startLine] = line.substring(0, startCol) + newContent + line.substring(endCol);
  } else {
    // Multi-line replacement
    const firstLine = lines[startLine].substring(0, startCol) + newContent;
    const lastLine = lines[endLine].substring(endCol);
    
    // Remove lines in between
    lines.splice(startLine, endLine - startLine + 1, firstLine + lastLine);
  }

  return lines.join('\n');
}

export function extractCode(code: string, location: SourceLocation): string {
  const lines = code.split('\n');
  const startLine = location.start.line - 1;
  const endLine = location.end.line - 1;
  const startCol = location.start.column;
  const endCol = location.end.column;

  if (startLine === endLine) {
    return lines[startLine].substring(startCol, endCol);
  }

  const extracted: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    if (i === startLine) {
      extracted.push(lines[i].substring(startCol));
    } else if (i === endLine) {
      extracted.push(lines[i].substring(0, endCol));
    } else {
      extracted.push(lines[i]);
    }
  }

  return extracted.join('\n');
}
