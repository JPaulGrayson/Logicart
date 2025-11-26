import { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Package, ChevronDown, ChevronRight, Info } from 'lucide-react';

function ContainerNode({ data, selected, id }: NodeProps) {
  const nodeData = data as {
    label?: string;
    children?: string[];
    collapsed?: boolean;
  };
  
  const { setNodes } = useReactFlow();
  const [collapsed, setCollapsed] = useState(nodeData.collapsed ?? false);
  
  // Check if this is the Global Flow fallback container
  const isGlobalFlow = nodeData.label === 'Global Flow';
  
  // Sync local state with persisted data state
  useEffect(() => {
    if (nodeData.collapsed !== undefined && nodeData.collapsed !== collapsed) {
      setCollapsed(nodeData.collapsed);
    }
  }, [nodeData.collapsed]);

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    
    // Update container's collapse state and all child nodes' visibility
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          // Update this container's collapse state
          return { 
            ...node, 
            data: { ...node.data, collapsed: newCollapsed } 
          };
        }
        if (nodeData.children?.includes(node.id)) {
          // Mark child nodes as being part of a collapsed container
          return { 
            ...node, 
            data: { ...node.data, isChildOfCollapsed: newCollapsed },
            hidden: newCollapsed 
          };
        }
        return node;
      })
    );
  };

  return (
    <div
      className={`
        relative
        bg-gradient-to-br from-purple-500/10 to-blue-500/10
        border-2 border-purple-500/30
        rounded-lg
        p-6
        min-w-[400px]
        min-h-[200px]
        shadow-lg
        ${selected ? 'ring-2 ring-purple-500 shadow-purple-500/50' : ''}
        transition-all duration-200
        cursor-pointer
        hover:border-purple-500/50
      `}
      onClick={handleToggleCollapse}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />
      
      <div className="flex items-center gap-2 mb-2">
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-purple-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-500" />
        )}
        <Package className="w-5 h-5 text-purple-500" />
        <div className="font-semibold text-sm text-foreground uppercase tracking-wide">
          {nodeData.label || 'Container'}
        </div>
        {nodeData.children && (
          <div className="ml-auto text-xs text-muted-foreground bg-purple-500/20 px-2 py-1 rounded">
            {nodeData.children.length} nodes
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground/70 font-mono">
        {collapsed ? 'Collapsed' : 'Expanded'} • Click to toggle
      </div>
      
      {/* Guidance for Global Flow container */}
      {isGlobalFlow && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200/90">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
            <div>
              <div className="font-medium mb-1">Single-section view</div>
              <div className="text-blue-200/70">
                To create multiple sections, add comment markers to your code:
                <div className="font-mono text-[10px] mt-1 text-blue-300">
                  // --- SECTION NAME ---
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(ContainerNode);
