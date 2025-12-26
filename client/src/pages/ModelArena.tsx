import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, RotateCcw, ArrowLeft, Code2, GitBranch, FileCode } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import MiniFlowchart from "@/components/arena/MiniFlowchart";

interface ModelResult {
  model: string;
  provider: string;
  code: string;
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

const MODEL_COLORS: Record<string, string> = {
  "OpenAI": "bg-green-500/20 text-green-400 border-green-500/50",
  "Gemini": "bg-blue-500/20 text-blue-400 border-blue-500/50",
  "Claude": "bg-orange-500/20 text-orange-400 border-orange-500/50",
  "Grok": "bg-purple-500/20 text-purple-400 border-purple-500/50",
};

export default function ModelArena() {
  const [prompt, setPrompt] = useState(
    "Write a JavaScript function called 'findDuplicates' that takes an array and returns an array of duplicate values."
  );
  const [results, setResults] = useState<ModelResult[]>([]);
  const [flowcharts, setFlowcharts] = useState<Record<string, ParsedFlowchart>>({});
  const [comparison, setComparison] = useState<ArenaResponse["comparison"]>();
  const [viewMode, setViewMode] = useState<"code" | "flowchart">("code");

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/arena/generate", { prompt });
      return response.json() as Promise<ArenaResponse>;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setFlowcharts(data.flowcharts || {});
      setComparison(data.comparison);
    },
  });

  const handleGenerate = () => {
    if (prompt.trim()) {
      generateMutation.mutate(prompt);
    }
  };

  const handleReset = () => {
    setResults([]);
    setFlowcharts({});
    setComparison(undefined);
    setPrompt("");
  };

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
          <Badge variant="outline" className="text-xs">
            Compare 4 AI Models
          </Badge>
        </div>

        <Card className="bg-[#161b22] border-[#30363d] mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Coding Prompt</CardTitle>
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
                disabled={generateMutation.isPending || !prompt.trim()}
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

        {results.length > 0 && (
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

        {generateMutation.isError && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-red-400">
                Error: {generateMutation.error?.message || "Failed to generate code"}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
