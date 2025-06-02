
import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import { defineEnhancedBlocks } from '@/lib/blockly/enhanced_blocks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

defineEnhancedBlocks();

interface EnhancedBlocklyEditorProps {
  selectedColumns: Array<{ id: string; name: string; table: string }>;
}

const EnhancedBlocklyEditor: React.FC<EnhancedBlocklyEditorProps> = ({ selectedColumns }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [previousColumns, setPreviousColumns] = useState<Array<{ id: string; name: string; table: string }>>([]);

  const generateToolboxXml = (columns: Array<{ id: string; name: string; table: string }>) => {
    return `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <category name="Query Builder" colour="290">
          <block type="enhanced_sql_query"></block>
          <block type="select_columns"></block>
        </category>
        <category name="Selected Columns" colour="160">
          ${columns.map(col => 
            `<block type="dynamic_column">
              <field name="COLUMN_NAME">${col.name}</field>
            </block>`
          ).join('')}
        </category>
        <category name="Aggregation" colour="230">
          <block type="count_function"></block>
          <block type="sum_function"></block>
          <block type="group_by"></block>
        </category>
        <category name="Logic & Text" colour="210">
          <block type="controls_if"></block>
          <block type="logic_compare"></block>
          <block type="logic_operation"></block>
          <block type="text"></block>
          <block type="math_number">
            <field name="NUM">0</field>
          </block>
        </category>
      </xml>
    `;
  };

  useEffect(() => {
    if (blocklyDiv.current && !workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: generateToolboxXml(selectedColumns),
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true,
        },
        trashcan: true,
        move: {
          scrollbars: true,
          drag: true,
          wheel: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
        },
      });

      const onWorkspaceChange = () => {
        if (workspaceRef.current) {
          const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
          setGeneratedSql(code || '-- Build your query using the blocks');
        }
      };

      workspaceRef.current.addChangeListener(onWorkspaceChange);
    }
  }, []);

  // Handle column changes - add new blocks and remove unchecked ones
  useEffect(() => {
    if (!workspaceRef.current) return;

    const currentColumnIds = new Set(selectedColumns.map(col => col.id));
    const previousColumnIds = new Set(previousColumns.map(col => col.id));

    // Find newly added columns
    const addedColumns = selectedColumns.filter(col => !previousColumnIds.has(col.id));
    
    // Find removed columns
    const removedColumnIds = previousColumns.filter(col => !currentColumnIds.has(col.id)).map(col => col.id);

    // Remove blocks for unchecked columns
    if (removedColumnIds.length > 0) {
      const allBlocks = workspaceRef.current.getAllBlocks(false);
      
      allBlocks.forEach((block: any) => {
        if (block.type === 'dynamic_column') {
          const blockColumnName = block.getFieldValue('COLUMN_NAME');
          const blockTableName = block.tableName_;
          const blockId = `${blockTableName}.${blockColumnName}`;
          
          if (removedColumnIds.includes(blockId)) {
            block.dispose();
          }
        }
      });
    }

    // Add blocks for newly checked columns
    addedColumns.forEach((col, index) => {
      const block = workspaceRef.current!.newBlock('dynamic_column');
      (block as any).setColumnInfo(col.name, col.table);
      block.initSvg();
      block.moveBy(50 + (index * 20), 100 + (selectedColumns.length * 20));
      block.render();
    });

    // Update toolbox with current columns
    workspaceRef.current.updateToolbox(generateToolboxXml(selectedColumns));

    // Update previous columns for next comparison
    setPreviousColumns([...selectedColumns]);

    // Regenerate SQL after changes
    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    setGeneratedSql(code || '-- Build your query using the blocks');

  }, [selectedColumns]);

  const generateSqlPreview = () => {
    if (workspaceRef.current) {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      setGeneratedSql(code || '-- Build your query using the blocks');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>SQL Query Builder</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />
          
          <div className="absolute bottom-4 right-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button onClick={generateSqlPreview} className="bg-blue-600 hover:bg-blue-700">
                  Preview SQL
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Generated SQL Query</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
                      {generatedSql}
                    </pre>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>Close</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBlocklyEditor;
