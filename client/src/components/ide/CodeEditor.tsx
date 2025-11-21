import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="h-full w-full bg-sidebar border-r border-border flex flex-col">
      <div className="h-10 border-b border-border flex items-center px-4 bg-sidebar/50 backdrop-blur text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Editor
      </div>
      <div className="flex-1 overflow-auto font-mono text-sm">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
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
