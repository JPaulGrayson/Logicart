import { useState, useEffect, useCallback, useRef } from 'react';

interface FlowchartData {
  nodes?: any[];
  edges?: any[];
  code?: string;
}

interface UseWatchFileOptions {
  enabled?: boolean;
  pollInterval?: number;
  onExternalChange?: (data: FlowchartData) => void;
}

export function useWatchFile(options: UseWatchFileOptions = {}) {
  const { 
    enabled = true, 
    pollInterval = 2000,
    onExternalChange 
  } = options;
  
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const lastSaveTimeRef = useRef(0);

  const markAsSaved = useCallback(() => {
    lastSaveTimeRef.current = Date.now();
  }, []);

  const saveToFile = useCallback(async (data: FlowchartData) => {
    try {
      const response = await fetch('/api/file/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        markAsSaved();
        setLastKnownTime(result.lastModified);
        setLastSyncTime(new Date());
      }
      return result.success;
    } catch (error) {
      console.error('[Watch Mode] Save error:', error);
      return false;
    }
  }, [markAsSaved]);

  const loadFromFile = useCallback(async (): Promise<FlowchartData | null> => {
    try {
      const response = await fetch('/api/file/load');
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('[Watch Mode] Load error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !onExternalChange) {
      setIsWatching(false);
      return;
    }

    setIsWatching(true);

    const checkForChanges = async () => {
      try {
        const response = await fetch('/api/file/status');
        const { lastModified, exists } = await response.json();

        if (!exists) {
          return;
        }

        // Skip if we recently saved - prevents detecting our own saves as "external"
        // Increased from 3s to 5s to give async save operations time to complete
        const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
        if (timeSinceLastSave < 5000) {
          return;
        }

        if (lastModified > lastKnownTime && lastKnownTime !== 0) {
          console.log('[Watch Mode] External change detected, reloading...');
          const data = await loadFromFile();
          if (data) {
            setLastKnownTime(lastModified);
            setLastSyncTime(new Date());
            onExternalChange(data);
          }
        } else if (lastKnownTime === 0) {
          setLastKnownTime(lastModified);
        }
      } catch (error) {
        console.error('[Watch Mode] Poll error:', error);
      }
    };

    checkForChanges();
    const interval = setInterval(checkForChanges, pollInterval);

    return () => {
      clearInterval(interval);
      setIsWatching(false);
    };
  }, [enabled, pollInterval, lastKnownTime, onExternalChange, loadFromFile]);

  return {
    isWatching,
    lastSyncTime,
    saveToFile,
    loadFromFile,
    markAsSaved
  };
}
