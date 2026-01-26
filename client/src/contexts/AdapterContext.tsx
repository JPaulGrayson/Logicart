import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IDEAdapter } from '@/lib/adapters/types';
import { StandaloneAdapter } from '@/lib/adapters/StandaloneAdapter';
import { historyManager } from '@/lib/historyManager';

interface AdapterContextType {
  adapter: IDEAdapter;
  code: string;
  filePath: string;
  isReady: boolean;
}

const AdapterContext = createContext<AdapterContextType | null>(null);

interface AdapterProviderProps {
  children: ReactNode;
  adapter?: IDEAdapter;
  initialCode?: string;
}

const DEFAULT_SAMPLE_CODE = `function calculateAverage(numbers) {
  let sum = 0;
  for (let i = 0; i <= numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length;
}

calculateAverage([10, 20, 30, 40, 50]);`;

function getInitialCode(providedCode?: string): string {
  if (providedCode) return providedCode;
  
  const savedEntry = historyManager.getCurrentEntry();
  if (savedEntry?.code) {
    console.log('[AdapterContext] Restoring saved code from history');
    return savedEntry.code;
  }
  
  return DEFAULT_SAMPLE_CODE;
}

export function AdapterProvider({ 
  children, 
  adapter: providedAdapter,
  initialCode
}: AdapterProviderProps) {
  const [adapter] = useState<IDEAdapter>(() => 
    providedAdapter || new StandaloneAdapter(getInitialCode(initialCode))
  );
  const [code, setCode] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      try {
        await adapter.initialize();
        
        if (!mounted) return;
        
        // Get initial content
        const content = await adapter.getCurrentFileContent();
        const path = adapter.getCurrentFilePath();
        
        if (!mounted) return;
        
        setCode(content);
        setFilePath(path);
        setIsReady(true);
        
        // Watch for changes
        unsubscribe = adapter.watchFileChanges((newContent, newPath) => {
          setCode(newContent);
          setFilePath(newPath);
        });
      } catch (error) {
        console.error('Failed to initialize adapter:', error);
        // For better UX, show user-friendly error
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        // Still mark as ready so the app doesn't hang
        setIsReady(true);
      }
    }

    init();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      adapter.cleanup();
    };
  }, [adapter]);

  return (
    <AdapterContext.Provider value={{ adapter, code, filePath, isReady }}>
      {children}
    </AdapterContext.Provider>
  );
}

export function useAdapter() {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useAdapter must be used within an AdapterProvider');
  }
  return context;
}
