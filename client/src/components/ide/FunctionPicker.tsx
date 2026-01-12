import React, { useState } from 'react';
import { FileCode, ChevronRight, ChevronDown, Check, Box, Braces, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ExtractedItem } from '@/lib/codeExtractor';

interface FunctionPickerProps {
  fileName: string;
  items: ExtractedItem[];
  onVisualize: (selectedIds: Set<string>, mode: 'single' | 'all') => void;
  onCancel: () => void;
}

export function FunctionPicker({ fileName, items, onVisualize, onCancel }: FunctionPickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleClassExpansion = (id: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedClasses(newExpanded);
  };

  const selectAll = () => {
    const allIds = new Set<string>();
    items.forEach(item => {
      allIds.add(item.id);
      if (item.children) {
        item.children.forEach(child => allIds.add(child.id));
      }
    });
    setSelectedIds(allIds);
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleVisualize = () => {
    const allIds = new Set<string>();
    items.forEach(item => {
      allIds.add(item.id);
      item.children?.forEach(child => allIds.add(child.id));
    });
    
    const isAllSelected = [...allIds].every(id => selectedIds.has(id));
    onVisualize(selectedIds, isAllSelected ? 'all' : 'single');
  };

  const handleVisualizeAll = () => {
    const allIds = new Set<string>();
    items.forEach(item => {
      allIds.add(item.id);
      item.children?.forEach(child => allIds.add(child.id));
    });
    onVisualize(allIds, 'all');
  };

  const getIcon = (type: ExtractedItem['type']) => {
    switch (type) {
      case 'class': return <Box className="w-4 h-4 text-violet-500" />;
      case 'function': return <Braces className="w-4 h-4 text-green-500" />;
      case 'method': return <Braces className="w-4 h-4 text-blue-500" />;
    }
  };

  const totalFunctions = items.filter(i => i.type === 'function').length;
  const totalClasses = items.filter(i => i.type === 'class').length;
  const totalMethods = items.reduce((acc, item) => acc + (item.children?.length || 0), 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden max-w-md w-full shadow-xl">
      <div className="bg-muted/50 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground truncate">{fileName}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Found {totalClasses > 0 && `${totalClasses} class${totalClasses > 1 ? 'es' : ''}`}
          {totalClasses > 0 && totalFunctions > 0 && ', '}
          {totalFunctions > 0 && `${totalFunctions} function${totalFunctions > 1 ? 's' : ''}`}
          {totalMethods > 0 && `, ${totalMethods} method${totalMethods > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="p-2 border-b border-border flex gap-2">
        <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={selectNone} className="text-xs">
          Select None
        </Button>
      </div>

      <ScrollArea className="h-64">
        <div className="p-2 space-y-1">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No functions or classes found</p>
              <p className="text-xs mt-1">Make sure the file contains valid JavaScript/TypeScript</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id}>
                <div
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                    hover:bg-muted/50 transition-colors
                    ${selectedIds.has(item.id) ? 'bg-primary/10' : ''}
                  `}
                  onClick={() => toggleSelection(item.id)}
                  data-testid={`picker-item-${item.id}`}
                >
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                    className="pointer-events-none"
                  />
                  {item.type === 'class' && item.children && item.children.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClassExpansion(item.id);
                      }}
                      className="p-0.5 hover:bg-muted rounded"
                    >
                      {expandedClasses.has(item.id) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  {getIcon(item.type)}
                  <span className="text-sm font-medium">
                    {item.type === 'function' ? `${item.name}()` : item.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    L{item.startLine}-{item.endLine}
                  </span>
                </div>

                {item.type === 'class' && item.children && expandedClasses.has(item.id) && (
                  <div className="ml-6 pl-2 border-l border-border/50 space-y-0.5 mt-0.5">
                    {item.children.map(method => (
                      <div
                        key={method.id}
                        className={`
                          flex items-center gap-2 px-2 py-1 rounded cursor-pointer
                          hover:bg-muted/50 transition-colors text-sm
                          ${selectedIds.has(method.id) ? 'bg-primary/10' : ''}
                        `}
                        onClick={() => toggleSelection(method.id)}
                        data-testid={`picker-item-${method.id}`}
                      >
                        <Checkbox
                          checked={selectedIds.has(method.id)}
                          onCheckedChange={() => toggleSelection(method.id)}
                          className="pointer-events-none"
                        />
                        {getIcon(method.type)}
                        <span>{method.name}()</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          L{method.startLine}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3 flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleVisualizeAll}
          variant="secondary"
          className="flex-1"
          data-testid="button-visualize-all"
        >
          <Play className="w-4 h-4 mr-1" />
          All
        </Button>
        <Button
          onClick={handleVisualize}
          disabled={selectedIds.size === 0}
          className="flex-1"
          data-testid="button-visualize-selected"
        >
          <Check className="w-4 h-4 mr-1" />
          Selected ({selectedIds.size})
        </Button>
      </div>
    </div>
  );
}
