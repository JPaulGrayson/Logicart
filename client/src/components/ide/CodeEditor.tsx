import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  highlightedLine?: number | null;
}

export function CodeEditor({ code, onChange, highlightedLine }: CodeEditorProps) {
  return (
    <div className="h-full w-full bg-sidebar border-r border-border flex flex-col">
      <div className="h-10 border-b border-border flex items-center px-4 bg-sidebar/50 backdrop-blur text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Editor
      </div>
      <div className="flex-1 overflow-auto font-mono text-sm relative">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={code => {
            const highlighted = Prism.highlight(code, Prism.languages.javascript, 'javascript');
            if (!highlightedLine) return highlighted;

            // Simple line highlighting logic
            const lines = highlighted.split('\n');
            const lineIndex = highlightedLine - 1; // 1-based to 0-based
            
            if (lines[lineIndex] !== undefined) {
              lines[lineIndex] = `<span style="background-color: rgba(255, 255, 0, 0.1); display: inline-block; width: 100%;">${lines[lineIndex]}</span>`;
            }
            return lines.join('\n');
          }}
          padding={24}
          className="min-h-full font-mono"
          textareaClassName="focus:outline-none"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            backgroundColor: 'transparent',
          }}
        />
      </div>
    </div>
  );
}
