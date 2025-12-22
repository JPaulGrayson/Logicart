import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Zap, ArrowRight, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    checkpoint?: (id: string, variables?: Record<string, unknown>, options?: { line?: number }) => void;
    LogiGo?: {
      checkpoint: typeof window.checkpoint;
      sessionId?: string;
      viewUrl?: string;
      openNow?: () => void;
    };
  }
}

export default function ZeroClickDemo() {
  const [step, setStep] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [checkpointsFired, setCheckpointsFired] = useState(0);

  const loadScript = () => {
    if (scriptLoaded) return;
    
    const script = document.createElement('script');
    script.src = `${window.location.origin}/remote.js?project=ZeroClickDemo&autoOpen=true`;
    script.onload = () => {
      setScriptLoaded(true);
      setStep(1);
    };
    document.body.appendChild(script);
  };

  const simulateUserAction = () => {
    if (!window.checkpoint) {
      console.warn('Checkpoint not available');
      return;
    }

    window.checkpoint('button-clicked', { 
      action: 'demo-action',
      timestamp: new Date().toISOString()
    }, { line: 42 });

    setCheckpointsFired(prev => prev + 1);
    
    if (step === 1) {
      setStep(2);
    }

    setTimeout(() => {
      if (window.checkpoint) {
        window.checkpoint('processing-complete', {
          result: 'success',
          itemsProcessed: 5
        }, { line: 48 });
        setCheckpointsFired(prev => prev + 1);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Zero-Click Integration Demo
          </h1>
          <p className="text-gray-400">
            Experience the automatic LogiGo visualization flow
          </p>
        </div>

        <div className="space-y-4">
          <Card className={`bg-gray-800 border-gray-700 transition-all ${step >= 0 ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">1</span>
                Load LogiGo Script
              </CardTitle>
              <CardDescription className="text-gray-400">
                Click to add the remote.js script to this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={loadScript}
                disabled={scriptLoaded}
                className={scriptLoaded ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                data-testid="button-load-script"
              >
                {scriptLoaded ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Script Loaded</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Load Script</>
                )}
              </Button>
              {scriptLoaded && (
                <p className="mt-2 text-sm text-green-400">
                  Session created! Check the badge in the bottom-right corner.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <ArrowRight className={`w-6 h-6 ${step >= 1 ? 'text-blue-400' : 'text-gray-600'}`} />
          </div>

          <Card className={`bg-gray-800 border-gray-700 transition-all ${step >= 1 ? 'ring-2 ring-purple-500' : 'opacity-50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm">2</span>
                Trigger User Action
              </CardTitle>
              <CardDescription className="text-gray-400">
                Click to fire a checkpoint - LogiGo will auto-open!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={simulateUserAction}
                disabled={!scriptLoaded}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-trigger-action"
              >
                <Play className="w-4 h-4 mr-2" /> Trigger Action
              </Button>
              {checkpointsFired > 0 && (
                <p className="mt-2 text-sm text-purple-400">
                  {checkpointsFired} checkpoint(s) fired! LogiGo should have opened.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <ArrowRight className={`w-6 h-6 ${step >= 2 ? 'text-green-400' : 'text-gray-600'}`} />
          </div>

          <Card className={`bg-gray-800 border-gray-700 transition-all ${step >= 2 ? 'ring-2 ring-green-500' : 'opacity-50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm">3</span>
                View in LogiGo
              </CardTitle>
              <CardDescription className="text-gray-400">
                LogiGo opens automatically with your execution trace
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              {step >= 2 ? (
                <div className="space-y-2">
                  <p className="text-green-400">LogiGo should have opened in a new tab!</p>
                  <p className="text-sm">If it was blocked, click the "View in LogiGo" badge or use:</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.LogiGo?.openNow?.()}
                    className="border-green-600 text-green-400 hover:bg-green-900"
                    data-testid="button-open-manual"
                  >
                    Open LogiGo Manually
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Complete steps 1 and 2 first</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 text-sm space-y-2">
            <p>1. The script tag loads <code className="text-blue-400">/remote.js</code> which auto-creates a session</p>
            <p>2. When <code className="text-purple-400">checkpoint()</code> is called, data streams to LogiGo</p>
            <p>3. On the first checkpoint, LogiGo auto-opens in a new tab (if not blocked)</p>
            <p>4. The flowchart updates in real-time as checkpoints arrive</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
