import { useState } from 'react';
import { Code2, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDropZone } from './FileDropZone';
import { FunctionPicker } from './FunctionPicker';
import { extractFunctionsAndClasses, getCodeForSelection, type ExtractedItem } from '@/lib/codeExtractor';

const SAMPLE_CODE = `function calculateRouteDistance(pois) {
  if (!pois || pois.length === 0) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < pois.length - 1; i++) {
    const lat1 = pois[i].latitude;
    const lon1 = pois[i].longitude;
    const lat2 = pois[i + 1].latitude;
    const lon2 = pois[i + 1].longitude;
    
    const distance = Math.sqrt(
      Math.pow(lat2 - lat1, 2) + 
      Math.pow(lon2 - lon1, 2)
    );
    
    totalDistance += distance;
  }
  
  return totalDistance;
}

calculateRouteDistance([
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 34.0522, longitude: -118.2437 },
  { latitude: 41.8781, longitude: -87.6298 }
]);`;

interface EmptyStateProps {
  onLoadSample?: () => void;
  onLoadCode?: (code: string) => void;
}

export function EmptyState({ onLoadSample, onLoadCode }: EmptyStateProps) {
  const [fileData, setFileData] = useState<{ code: string; fileName: string; items: ExtractedItem[] } | null>(null);
  
  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_CODE);
  };

  const handleFileLoaded = (code: string, fileName: string) => {
    const result = extractFunctionsAndClasses(code);
    
    if (result.items.length === 0) {
      if (onLoadCode) {
        onLoadCode(code);
      }
      return;
    }
    
    setFileData({
      code,
      fileName,
      items: result.items
    });
  };

  const handleVisualize = (selectedIds: Set<string>, mode: 'single' | 'all') => {
    if (!fileData || !onLoadCode) return;
    
    if (mode === 'all') {
      onLoadCode(fileData.code);
    } else {
      const selectedCode = getCodeForSelection(fileData.items, selectedIds);
      onLoadCode(selectedCode);
    }
    
    setFileData(null);
  };

  const handleCancel = () => {
    setFileData(null);
  };

  if (fileData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-8">
        <FunctionPicker
          fileName={fileData.fileName}
          items={fileData.items}
          onVisualize={handleVisualize}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Code2 className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to LogicArt
            </h1>
            <p className="text-lg text-muted-foreground">
              Visualize your code as interactive flowcharts
            </p>
          </div>
        </div>

        <FileDropZone 
          onFileLoaded={handleFileLoaded}
          className="max-w-md mx-auto"
        />

        <div className="flex items-center gap-4 max-w-md mx-auto">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {onLoadSample && (
            <Button
              onClick={onLoadSample}
              size="lg"
              className="gap-2"
              data-testid="button-load-sample"
            >
              <Sparkles className="w-5 h-5" />
              Load Sample Code
            </Button>
          )}
          <Button
            onClick={handleCopySample}
            variant="outline"
            size="lg"
            className="gap-2"
            data-testid="button-copy-sample"
          >
            <Code2 className="w-5 h-5" />
            Copy Sample to Clipboard
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Pro tip: Drop any .js or .ts file to visualize specific functions
          </span>
        </div>
      </div>
    </div>
  );
}

export { SAMPLE_CODE };
