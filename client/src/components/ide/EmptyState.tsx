import { Code2, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

export function EmptyState({ onLoadSample }: EmptyStateProps) {
  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_CODE);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
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
              Visualize your code as interactive flowcharts with step-by-step execution
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Write or paste your code</h3>
              <p className="text-sm text-muted-foreground">
                Enter JavaScript code in the editor on the left to get started
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Watch it transform</h3>
              <p className="text-sm text-muted-foreground">
                See your code automatically convert into a visual flowchart
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Execute and debug</h3>
              <p className="text-sm text-muted-foreground">
                Step through execution, inspect variables, and understand control flow
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
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
            Pro tip: Use premium features like Time Travel debugging and Natural Language Search to supercharge your workflow
          </span>
        </div>
      </div>
    </div>
  );
}

export { SAMPLE_CODE };
