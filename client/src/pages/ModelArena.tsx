import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, RotateCcw, ArrowLeft, Code2, GitBranch, FileCode, Bug, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import MiniFlowchart from "@/components/arena/MiniFlowchart";
import SettingsModal, { getStoredAPIKeys } from "@/components/arena/SettingsModal";

interface ModelResult {
  model: string;
  provider: string;
  code: string;
  error?: string;
  latencyMs: number;
}

interface DebugResult {
  model: string;
  provider: string;
  analysis: string;
  error?: string;
  latencyMs: number;
}

interface FlowNode {
  id: string;
  type: string;
  label: string;
  children: Array<{ targetId: string; condition?: string }>;
}

interface ParsedFlowchart {
  summary: { nodeCount: number; complexityScore: number; entryPoint: string };
  flow: FlowNode[];
}

interface ArenaResponse {
  success: boolean;
  results: ModelResult[];
  flowcharts?: Record<string, ParsedFlowchart>;
  comparison?: {
    similarityMatrix: Array<{ model1: string; model2: string; similarity: number }>;
    complexityScores: Array<{ model: string; complexity: number; nodeCount: number }>;
  };
}

interface DebugResponse {
  success: boolean;
  results: DebugResult[];
}

const MODEL_COLORS: Record<string, string> = {
  "OpenAI": "bg-green-500/20 text-green-400 border-green-500/50",
  "Gemini": "bg-blue-500/20 text-blue-400 border-blue-500/50",
  "Claude": "bg-orange-500/20 text-orange-400 border-orange-500/50",
  "Grok": "bg-purple-500/20 text-purple-400 border-purple-500/50",
};

function getAPIKeyHeaders(): Record<string, string> {
  const keys = getStoredAPIKeys();
  const headers: Record<string, string> = {};
  if (keys.openai) headers["x-openai-key"] = keys.openai;
  if (keys.gemini) headers["x-gemini-key"] = keys.gemini;
  if (keys.anthropic) headers["x-anthropic-key"] = keys.anthropic;
  if (keys.xai) headers["x-xai-key"] = keys.xai;
  return headers;
}

export default function ModelArena() {
  const [arenaMode, setArenaMode] = useState<"code" | "debug">("code");
  const [prompt, setPrompt] = useState(
    "Write a JavaScript function called 'findDuplicates' that takes an array and returns an array of duplicate values."
  );
  const [problem, setProblem] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [results, setResults] = useState<ModelResult[]>([]);
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [flowcharts, setFlowcharts] = useState<Record<string, ParsedFlowchart>>({});
  const [comparison, setComparison] = useState<ArenaResponse["comparison"]>();
  const [viewMode, setViewMode] = useState<"code" | "flowchart">("code");
  const [, forceUpdate] = useState({});

  const handleKeysChange = useCallback(() => {
    forceUpdate({});
  }, []);

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const headers = getAPIKeyHeaders();
      const response = await apiRequest("POST", "/api/arena/generate", { prompt }, headers);
      return response.json() as Promise<ArenaResponse>;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setFlowcharts(data.flowcharts || {});
      setComparison(data.comparison);
    },
  });

  const debugMutation = useMutation({
    mutationFn: async (data: { problem: string; errorLogs: string; codeSnippet: string }) => {
      const headers = getAPIKeyHeaders();
      const response = await apiRequest("POST", "/api/arena/debug", data, headers);
      return response.json() as Promise<DebugResponse>;
    },
    onSuccess: (data) => {
      setDebugResults(data.results);
    },
  });

  const handleGenerate = () => {
    if (prompt.trim()) {
      generateMutation.mutate(prompt);
    }
  };

  const handleDebug = () => {
    if (problem.trim()) {
      debugMutation.mutate({ problem, errorLogs, codeSnippet });
    }
  };

  const handleReset = () => {
    setResults([]);
    setDebugResults([]);
    setFlowcharts({});
    setComparison(undefined);
    setPrompt("");
    setProblem("");
    setErrorLogs("");
    setCodeSnippet("");
  };

  const handleModeChange = (mode: string) => {
    setArenaMode(mode as "code" | "debug");
    handleReset();
  };

  const isPending = generateMutation.isPending || debugMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workbench
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
              <Code2 className="w-6 h-6 text-blue-400" />
              Model Arena
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SettingsModal onKeysChange={handleKeysChange} />
            <Badge variant="outline" className="text-xs">
              Compare 4 AI Models
            </Badge>
          </div>
        </div>

        <Tabs value={arenaMode} onValueChange={handleModeChange} className="mb-6">
          <TabsList className="bg-[#161b22] border border-[#30363d]">
            <TabsTrigger 
              value="code" 
              className="data-[state=active]:bg-blue-600 gap-2"
              data-testid="tab-mode-code"
            >
              <Sparkles className="w-4 h-4" />
              Code Generation
            </TabsTrigger>
            <TabsTrigger 
              value="debug" 
              className="data-[state=active]:bg-orange-600 gap-2"
              data-testid="tab-mode-debug"
            >
              <Bug className="w-4 h-4" />
              Debug Advisor
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {arenaMode === "code" ? (
          <Card className="bg-[#161b22] border-[#30363d] mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Coding Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the code you want each AI model to generate..."
                className="min-h-[120px] bg-[#0d1117] border-[#30363d] text-white resize-none"
                data-testid="input-prompt"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isPending || !prompt.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating from 4 models...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate & Compare
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#30363d]"
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#161b22] border-[#30363d] mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-orange-400" />
                Describe Your Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Problem Description *</label>
                <Textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe the issue you're facing. What are you trying to do? What's happening instead?"
                  className="min-h-[100px] bg-[#0d1117] border-[#30363d] text-white resize-none"
                  data-testid="input-problem"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Error Logs (optional)</label>
                <Textarea
                  value={errorLogs}
                  onChange={(e) => setErrorLogs(e.target.value)}
                  placeholder="Paste any error messages or stack traces here..."
                  className="min-h-[80px] bg-[#0d1117] border-[#30363d] text-white font-mono text-sm resize-none"
                  data-testid="input-error-logs"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Relevant Code (optional)</label>
                <Textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste the relevant code snippet..."
                  className="min-h-[80px] bg-[#0d1117] border-[#30363d] text-white font-mono text-sm resize-none"
                  data-testid="input-code-snippet"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDebug}
                  disabled={isPending || !problem.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-debug"
                >
                  {debugMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting advice from 4 models...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 mr-2" />
                      Get Debug Advice
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#30363d]"
                  data-testid="button-reset-debug"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {arenaMode === "code" && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "code" | "flowchart")}>
                <TabsList className="bg-[#161b22]">
                  <TabsTrigger value="code" className="data-[state=active]:bg-blue-600" data-testid="tab-code">
                    <FileCode className="w-4 h-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="flowchart" className="data-[state=active]:bg-blue-600" data-testid="tab-flowchart">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Flowcharts
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {results.map((result) => (
                <Card
                  key={result.provider}
                  className="bg-[#161b22] border-[#30363d]"
                  data-testid={`card-result-${result.provider.toLowerCase()}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Badge className={MODEL_COLORS[result.provider]}>
                          {result.provider}
                        </Badge>
                        <span className="text-sm text-gray-400">{result.model}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {result.latencyMs}ms
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.error ? (
                      <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/30">
                        {result.error}
                      </div>
                    ) : viewMode === "code" ? (
                      <pre className="text-sm text-gray-300 bg-[#0d1117] p-3 rounded overflow-x-auto max-h-[300px] overflow-y-auto font-mono">
                        {result.code}
                      </pre>
                    ) : (
                      <div className="h-[300px] bg-[#0d1117] rounded">
                        <MiniFlowchart 
                          flowchart={flowcharts[result.provider] || null} 
                          provider={result.provider}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {comparison && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Comparison Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Complexity Scores</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {comparison.complexityScores.map((item) => (
                        <div
                          key={item.model}
                          className="bg-[#0d1117] p-3 rounded border border-[#30363d]"
                          data-testid={`complexity-${item.model.toLowerCase()}`}
                        >
                          <div className="text-sm text-gray-400">{item.model}</div>
                          <div className="text-xl font-bold text-white">{item.complexity}</div>
                          <div className="text-xs text-gray-500">{item.nodeCount} nodes</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Similarity Matrix</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {comparison.similarityMatrix.map((pair, i) => (
                        <div
                          key={i}
                          className="bg-[#0d1117] p-2 rounded border border-[#30363d] text-sm"
                        >
                          <span className="text-gray-400">{pair.model1}</span>
                          <span className="text-gray-600 mx-1">vs</span>
                          <span className="text-gray-400">{pair.model2}</span>
                          <span className="float-right text-blue-400 font-mono">
                            {Math.round(pair.similarity * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {arenaMode === "debug" && debugResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {debugResults.map((result) => (
              <Card
                key={result.provider}
                className="bg-[#161b22] border-[#30363d]"
                data-testid={`card-debug-${result.provider.toLowerCase()}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Badge className={MODEL_COLORS[result.provider]}>
                        {result.provider}
                      </Badge>
                      <span className="text-sm text-gray-400">{result.model}</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {result.latencyMs}ms
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.error ? (
                    <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/30">
                      {result.error}
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto">
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {result.analysis}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(generateMutation.isError || debugMutation.isError) && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-red-400">
                Error: {generateMutation.error?.message || debugMutation.error?.message || "Failed to process request"}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
