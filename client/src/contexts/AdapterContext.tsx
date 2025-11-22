import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IDEAdapter } from '@/lib/adapters/types';
import { StandaloneAdapter } from '@/lib/adapters/StandaloneAdapter';

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

export function AdapterProvider({ 
  children, 
  adapter: providedAdapter,
  initialCode = `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  let sub = factorial(n - 1);
  return n * sub;
}`
}: AdapterProviderProps) {
  const [adapter] = useState<IDEAdapter>(() => 
    providedAdapter || new StandaloneAdapter(initialCode)
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
