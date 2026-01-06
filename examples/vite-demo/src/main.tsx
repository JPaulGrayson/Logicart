import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LogicArtEmbed } from 'logicart-embed';
import '@xyflow/react/dist/style.css';

function bubbleSort(arr: number[]): number[] {
  const result = [...arr];
  const n = result.length;
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        const temp = result[j];
        result[j] = result[j + 1];
        result[j + 1] = temp;
      }
    }
  }
  
  return result;
}

function App() {
  const [numbers, setNumbers] = useState<number[]>([64, 34, 25, 12, 22, 11, 90]);
  const [sorted, setSorted] = useState<number[] | null>(null);

  const handleSort = () => {
    const result = bubbleSort(numbers);
    setSorted(result);
  };

  const handleReset = () => {
    setNumbers([64, 34, 25, 12, 22, 11, 90]);
    setSorted(null);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>LogicArt Vite Demo</h1>
      <p>This demo shows the LogicArt Embed component with live instrumentation.</p>
      
      <div style={{ marginBottom: 20 }}>
        <h3>Bubble Sort Algorithm</h3>
        <p><strong>Input:</strong> [{numbers.join(', ')}]</p>
        {sorted && <p><strong>Sorted:</strong> [{sorted.join(', ')}]</p>}
        
        <button onClick={handleSort} style={{ marginRight: 10, padding: '8px 16px' }}>
          Run Sort
        </button>
        <button onClick={handleReset} style={{ padding: '8px 16px' }}>
          Reset
        </button>
      </div>

      <LogicArtEmbed 
        manifestUrl="/logicart-manifest.json"
        position="bottom-right"
        defaultOpen={true}
        showVariables={true}
        showHistory={true}
        theme="dark"
      />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
