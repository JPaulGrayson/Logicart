import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Zap, ArrowRight, CheckCircle, Bug, GitBranch } from 'lucide-react';

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
  const [demoMode, setDemoMode] = useState<'simple' | 'debug'>('debug');

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

  // Simple demo - just basic checkpoints
  const simulateSimpleAction = () => {
    if (!window.checkpoint) return;

    window.checkpoint('button-clicked', { action: 'demo-action' });
    setCheckpointsFired(prev => prev + 1);
    
    if (step === 1) setStep(2);

    setTimeout(() => {
      window.checkpoint?.('processing-complete', { result: 'success' });
      setCheckpointsFired(prev => prev + 1);
    }, 500);
  };

  // Debug demo - shows decision points and branches like an AI agent would add
  const simulateDebugFlow = () => {
    if (!window.checkpoint) return;

    // Simulate a function with decision points - this is how an AI agent would instrument code
    const processOrder = (orderId: number, quantity: number) => {
      // 1. Function entry - capture inputs
      window.checkpoint?.('process-order-start', { orderId, quantity });
      setCheckpointsFired(prev => prev + 1);

      // 2. Validation check - decision point
      const isValid = quantity > 0 && quantity <= 100;
      if (isValid) {
        window.checkpoint?.('validation-passed', { quantity, maxAllowed: 100 });
        setCheckpointsFired(prev => prev + 1);
      } else {
        window.checkpoint?.('validation-failed', { quantity, reason: 'out of range' });
        setCheckpointsFired(prev => prev + 1);
        return;
      }

      // 3. Check inventory - another decision point
      const inStock = quantity <= 50; // Simulate stock check
      if (inStock) {
        window.checkpoint?.('stock-available', { requested: quantity, available: 50 });
        setCheckpointsFired(prev => prev + 1);
      } else {
        window.checkpoint?.('stock-insufficient', { requested: quantity, available: 50 });
        setCheckpointsFired(prev => prev + 1);
        // Would normally return here, but we continue for demo
      }

      // 4. Calculate total - loop simulation
      let total = 0;
      const pricePerUnit = 29.99;
      window.checkpoint?.('calculating-total', { quantity, pricePerUnit });
      setCheckpointsFired(prev => prev + 1);
      total = quantity * pricePerUnit;

      // 5. Apply discount - conditional
      const discount = quantity >= 10 ? 0.1 : 0;
      if (discount > 0) {
        window.checkpoint?.('discount-applied', { discount: '10%', savings: total * discount });
        setCheckpointsFired(prev => prev + 1);
        total = total * (1 - discount);
      } else {
        window.checkpoint?.('no-discount', { reason: 'quantity < 10' });
        setCheckpointsFired(prev => prev + 1);
      }

      // 6. Return result
      window.checkpoint?.('order-complete', { orderId, total: total.toFixed(2), success: true });
      setCheckpointsFired(prev => prev + 1);
    };

    // Run the simulated function
    processOrder(1234, 25);
    if (step === 1) setStep(2);
  };

  const simulateUserAction = () => {
    if (demoMode === 'debug') {
      simulateDebugFlow();
    } else {
      simulateSimpleAction();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Agent Debugging Demo
          </h1>
          <p className="text-gray-400">
            See how AI agents can add checkpoints to debug your code
          </p>
          
          {/* Demo Mode Toggle */}
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant={demoMode === 'debug' ? 'default' : 'outline'}
              onClick={() => setDemoMode('debug')}
              className={demoMode === 'debug' ? 'bg-purple-600' : 'border-gray-600'}
              data-testid="mode-debug"
            >
              <Bug className="w-4 h-4 mr-1" /> Debug Flow
            </Button>
            <Button
              size="sm"
              variant={demoMode === 'simple' ? 'default' : 'outline'}
              onClick={() => setDemoMode('simple')}
              className={demoMode === 'simple' ? 'bg-blue-600' : 'border-gray-600'}
              data-testid="mode-simple"
            >
              <GitBranch className="w-4 h-4 mr-1" /> Simple
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card className={`bg-gray-800 border-gray-700 transition-all ${step >= 0 ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">1</span>
                Load LogiGo Script
              </CardTitle>
              <CardDescription className="text-gray-400">
                In a real app, your AI agent adds this script tag to index.html
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
                {demoMode === 'debug' ? 'Run Instrumented Function' : 'Trigger User Action'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {demoMode === 'debug' 
                  ? 'Simulates a function with checkpoints at every decision point'
                  : 'Click to fire a checkpoint - LogiGo will auto-open!'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={simulateUserAction}
                disabled={!scriptLoaded}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-trigger-action"
              >
                {demoMode === 'debug' ? (
                  <><Bug className="w-4 h-4 mr-2" /> Run processOrder(1234, 25)</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Trigger Action</>
                )}
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
            <CardTitle className="text-lg text-white">How AI Agents Use LogiGo for Debugging</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 text-sm space-y-3">
            {demoMode === 'debug' ? (
              <>
                <p className="text-purple-400 font-medium">Debug Flow shows checkpoints at every decision point:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><code className="text-blue-400">process-order-start</code> - Function entry with inputs</li>
                  <li><code className="text-green-400">validation-passed</code> - Shows which branch was taken</li>
                  <li><code className="text-yellow-400">stock-available</code> - Another decision point</li>
                  <li><code className="text-cyan-400">discount-applied</code> - Conditional logic result</li>
                  <li><code className="text-purple-400">order-complete</code> - Final result</li>
                </ul>
                <p className="text-gray-500 mt-2">When you ask "why isn't this working?", your AI agent adds these checkpoints to show exactly which path the code took and what values it saw.</p>
              </>
            ) : (
              <>
                <p>1. The script tag loads <code className="text-blue-400">/remote.js</code> which auto-creates a session</p>
                <p>2. When <code className="text-purple-400">checkpoint()</code> is called, data streams to LogiGo</p>
                <p>3. On the first checkpoint, LogiGo auto-opens in a new tab (if not blocked)</p>
                <p>4. The flowchart updates in real-time as checkpoints arrive</p>
              </>
            )}
          </CardContent>
        </Card>

        {demoMode === 'debug' && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-purple-400" />
                Try It: Ask Your AI Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-2">
              <p>Copy this prompt and paste it into your AI agent's chat:</p>
              <div className="p-3 bg-gray-900 rounded-lg font-mono text-xs text-gray-400">
                "Debug my processOrder function - add LogiGo checkpoints at every if/else branch and return point so I can see exactly what path the code takes"
              </div>
              <p className="text-gray-500 text-xs">The agent will add checkpoints like the ones in this demo, and LogiGo will auto-open showing the execution flow.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
