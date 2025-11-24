/**
 * Natural Language Search Component (Premium Feature)
 * 
 * Provides a search interface for querying flowchart nodes using natural language
 */

import { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { searchNodes, getSuggestedQueries, type SearchResult } from '@/lib/naturalLanguageSearch';
import type { FlowNode } from '@/lib/parser';
import { Button } from '@/components/ui/button';

interface NaturalLanguageSearchProps {
  nodes: FlowNode[];
  onSearchResults: (result: SearchResult) => void;
  onClear: () => void;
}

export function NaturalLanguageSearch({ nodes, onSearchResults, onClear }: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    // Update suggestions when nodes change
    const newSuggestions = getSuggestedQueries(nodes);
    setSuggestions(newSuggestions);
  }, [nodes]);

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      handleClear();
      return;
    }

    const result = searchNodes(trimmedQuery, nodes);
    setCurrentResult(result);
    onSearchResults(result);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setCurrentResult(null);
    onClear();
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search flowchart... (e.g., 'show all conditionals')"
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          data-testid="input-nl-search"
        />
        {currentResult && currentResult.matchedNodes.size > 0 && (
          <span className="text-xs text-muted-foreground px-2 py-1 bg-primary/10 rounded">
            {currentResult.matchedNodes.size} match{currentResult.matchedNodes.size !== 1 ? 'es' : ''}
          </span>
        )}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
            data-testid="button-clear-search"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSearch(query)}
          className="h-6 w-6 p-0"
          data-testid="button-execute-search"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !currentResult && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
            Suggested queries
          </div>
          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                data-testid={`suggestion-${index}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
