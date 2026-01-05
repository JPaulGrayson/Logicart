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
        p-3
        min-w-[240px]
        min-h-[80px]
        shadow-md
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
      
      <div className="flex items-center gap-1.5 mb-1">
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-purple-500" />
        ) : (
          <ChevronDown className="w-3 h-3 text-purple-500" />
        )}
        <Package className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
        <div className="font-semibold text-xs text-foreground uppercase tracking-wide truncate max-w-[160px]" title={nodeData.label || 'Container'}>
          {nodeData.label || 'Container'}
        </div>
        {nodeData.children && (
          <div className="ml-auto text-[10px] text-muted-foreground bg-purple-500/20 px-1.5 py-0.5 rounded">
            {nodeData.children.length}
          </div>
        )}
      </div>
      
      <div className="text-[10px] text-muted-foreground/70 font-mono">
        {collapsed ? 'Collapsed' : 'Expanded'}
      </div>
      
      {/* Guidance for Global Flow container */}
      {isGlobalFlow && (
        <div className="mt-2 p-1.5 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-200/90">
          <div className="flex items-center gap-1.5">
            <Info className="w-2.5 h-2.5 flex-shrink-0 text-blue-400" />
            <span className="text-blue-200/70">
              Add <span className="font-mono text-blue-300">// --- NAME ---</span> for sections
            </span>
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
