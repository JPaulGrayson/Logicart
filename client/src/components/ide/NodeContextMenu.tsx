import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tag, CircleDot, Trash2 } from 'lucide-react';

interface NodeContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
  nodeId: string;
  nodeLabel: string;
  hasLabel: boolean;
  hasBreakpoint: boolean;
  onAddLabel: () => void;
  onRemoveLabel: () => void;
  onToggleBreakpoint: () => void;
}

export function NodeContextMenu({
  open,
  onOpenChange,
  position,
  nodeId,
  nodeLabel,
  hasLabel,
  hasBreakpoint,
  onAddLabel,
  onRemoveLabel,
  onToggleBreakpoint,
}: NodeContextMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuContent
        className="min-w-[180px]"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
        }}
        data-testid="node-context-menu"
      >
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[180px]">
          {nodeLabel}
        </div>
        <DropdownMenuSeparator />
        
        {hasLabel ? (
          <>
            <DropdownMenuItem 
              onClick={onAddLabel}
              className="flex items-center gap-2 cursor-pointer"
              data-testid="menu-edit-label"
            >
              <Tag className="w-4 h-4" />
              Edit Label
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onRemoveLabel}
              className="flex items-center gap-2 cursor-pointer text-destructive"
              data-testid="menu-remove-label"
            >
              <Trash2 className="w-4 h-4" />
              Remove Label
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem 
            onClick={onAddLabel}
            className="flex items-center gap-2 cursor-pointer"
            data-testid="menu-add-label"
          >
            <Tag className="w-4 h-4" />
            Add Label
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onToggleBreakpoint}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="menu-toggle-breakpoint"
        >
          <CircleDot className={`w-4 h-4 ${hasBreakpoint ? 'text-red-500' : ''}`} />
          {hasBreakpoint ? 'Remove Breakpoint' : 'Add Breakpoint'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NodeContextMenu;
