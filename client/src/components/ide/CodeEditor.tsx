import React, { useRef, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  highlightedLine?: number | null;
}

const LINE_HEIGHT = 21; // Approximate line height in pixels (14px font * 1.5 line-height)
const PADDING = 24; // Editor padding

export function CodeEditor({ code, onChange, highlightedLine }: CodeEditorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedLine && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const linePosition = PADDING + (highlightedLine - 1) * LINE_HEIGHT;
      const containerHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      
      // Check if line is outside visible area
      if (linePosition < scrollTop || linePosition > scrollTop + containerHeight - LINE_HEIGHT * 2) {
        // Scroll to center the highlighted line
        container.scrollTo({
          top: Math.max(0, linePosition - containerHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedLine]);

  return (
    <div className="h-full w-full bg-sidebar border-r border-border flex flex-col">
      <div className="h-8 border-b border-border flex items-center px-3 bg-sidebar/50 backdrop-blur">
        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Editor</span>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-auto font-mono text-sm relative">
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
