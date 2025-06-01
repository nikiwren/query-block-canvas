
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ColumnNode {
  id: string;
  name: string;
  type: 'category' | 'table' | 'column';
  table?: string;
  children?: ColumnNode[];
  checked?: boolean;
}

interface ColumnTreeViewProps {
  onColumnSelect: (columnId: string, columnName: string, tableName: string, checked: boolean) => void;
}

const ColumnTreeView: React.FC<ColumnTreeViewProps> = ({ onColumnSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['risk', 'trade']));
  const [checkedColumns, setCheckedColumns] = useState<Set<string>>(new Set());

  const treeData: ColumnNode[] = [
    {
      id: 'risk',
      name: 'Risk',
      type: 'category',
      children: [
        {
          id: 'rtable1',
          name: 'rtable1',
          type: 'table',
          children: [
            { id: 'rtable1.rcol11', name: 'rcol11', type: 'column', table: 'rtable1' },
            { id: 'rtable1.rcol12', name: 'rcol12', type: 'column', table: 'rtable1' }
          ]
        },
        {
          id: 'rtable2',
          name: 'rtable2',
          type: 'table',
          children: [
            { id: 'rtable2.rcol21', name: 'rcol21', type: 'column', table: 'rtable2' },
            { id: 'rtable2.rcol22', name: 'rcol22', type: 'column', table: 'rtable2' }
          ]
        }
      ]
    },
    {
      id: 'trade',
      name: 'Trade',
      type: 'category',
      children: [
        {
          id: 'ttable1',
          name: 'ttable1',
          type: 'table',
          children: [
            { id: 'ttable1.tcol11', name: 'tcol11', type: 'column', table: 'ttable1' },
            { id: 'ttable1.tcol12', name: 'tcol12', type: 'column', table: 'ttable1' }
          ]
        },
        {
          id: 'ttable2',
          name: 'ttable2',
          type: 'table',
          children: [
            { id: 'ttable2.tcol21', name: 'tcol21', type: 'column', table: 'ttable2' },
            { id: 'ttable2.tcol22', name: 'tcol22', type: 'column', table: 'ttable2' }
          ]
        }
      ]
    }
  ];

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleColumnCheck = (columnId: string, columnName: string, tableName: string, checked: boolean) => {
    const newCheckedColumns = new Set(checkedColumns);
    if (checked) {
      newCheckedColumns.add(columnId);
    } else {
      newCheckedColumns.delete(columnId);
    }
    setCheckedColumns(newCheckedColumns);
    onColumnSelect(columnId, columnName, tableName, checked);
  };

  const filterNodes = (nodes: ColumnNode[], searchTerm: string): ColumnNode[] => {
    if (!searchTerm) return nodes;
    
    return nodes.reduce((filtered: ColumnNode[], node) => {
      if (node.type === 'column' && node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered.push(node);
      } else if (node.children) {
        const filteredChildren = filterNodes(node.children, searchTerm);
        if (filteredChildren.length > 0) {
          filtered.push({ ...node, children: filteredChildren });
        }
      }
      return filtered;
    }, []);
  };

  const renderNode = (node: ColumnNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isChecked = checkedColumns.has(node.id);

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-accent rounded-sm cursor-pointer`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="mr-1 p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          
          {node.type === 'column' && (
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => 
                handleColumnCheck(node.id, node.name, node.table!, checked === true)
              }
              className="mr-2"
            />
          )}
          
          <span 
            className={`text-sm ${node.type === 'category' ? 'font-semibold' : node.type === 'table' ? 'font-medium' : ''}`}
            onClick={() => hasChildren && toggleExpanded(node.id)}
          >
            {node.name}
          </span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredData = filterNodes(treeData, searchTerm);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        {filteredData.map(node => renderNode(node))}
      </ScrollArea>
    </div>
  );
};

export default ColumnTreeView;
