import React, { useState } from 'react';
import { LogicArtEmbed } from '../../../packages/logicart-embed/src';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const DEMO_CODE = `
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  
  let prev = 0;
  let current = 1;
  
  for (let i = 2; i <= n; i++) {
    let next = prev + current;
    prev = current;
    current = next;
  }
  
  return current;
}

const result = fibonacci(10);
console.log(result);
`;

const QUICKSORT_CODE = `
function quickSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }
  
  const pivot = arr[0];
  const left = [];
  const right = [];
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}
`;

export default function EmbedDemo() {
  const [code, setCode] = useState(DEMO_CODE);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

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

        <h1 className="text-3xl font-bold mb-2">LogicArt Embed Demo</h1>
        <p className="text-muted-foreground mb-8">
          This page demonstrates the embeddable LogicArt component that can be added to any React app.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Example Code</h2>
            <div className="flex gap-2">
              <Button 
                variant={code === DEMO_CODE ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCode(DEMO_CODE)}
              >
                Fibonacci
              </Button>
              <Button 
                variant={code === QUICKSORT_CODE ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCode(QUICKSORT_CODE)}
              >
                QuickSort
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Position</h2>
            <div className="flex flex-wrap gap-2">
              {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(pos => (
                <Button 
                  key={pos}
                  variant={position === pos ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPosition(pos)}
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">Source Code</h2>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono whitespace-pre-wrap">
            {code}
          </pre>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Usage</h2>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono">
{`import { LogicArtEmbed } from 'logicart-embed';

function App() {
  return (
    <div>
      <YourApp />
      <LogicArtEmbed 
        code={yourCode}
        position="${position}"
      />
    </div>
  );
}`}
          </pre>
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            Look at the <strong>{position}</strong> corner of your screen to see the LogicArt Embed panel!
          </p>
        </div>
      </div>

      <LogicArtEmbed 
        code={code}
        position={position}
        defaultOpen={true}
        defaultSize={{ width: 450, height: 400 }}
        onReady={() => console.log('[Demo] LogicArt ready!')}
        onNodeClick={(nodeId: string) => console.log('[Demo] Node clicked:', nodeId)}
      />
    </div>
  );
}
