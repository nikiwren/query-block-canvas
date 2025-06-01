
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

  const toolboxXml = `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <category name="Query Builder" colour="290">
        <block type="enhanced_sql_query"></block>
        <block type="select_columns"></block>
      </category>
      <category name="Selected Columns" colour="160">
        ${selectedColumns.map(col => 
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

  useEffect(() => {
    if (blocklyDiv.current && !workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxXml,
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

    // Update toolbox when selected columns change
    if (workspaceRef.current) {
      workspaceRef.current.updateToolbox(toolboxXml);
    }
  }, [selectedColumns, toolboxXml]);

  // Add selected columns as blocks to the workspace
  useEffect(() => {
    if (workspaceRef.current && selectedColumns.length > 0) {
      selectedColumns.forEach((col, index) => {
        // Check if block already exists
        const existingBlocks = workspaceRef.current!.getAllBlocks(false);
        const blockExists = existingBlocks.some((block: any) => 
          block.type === 'dynamic_column' && 
          block.getFieldValue('COLUMN_NAME') === col.name &&
          block.tableName_ === col.table
        );

        if (!blockExists) {
          const block = workspaceRef.current!.newBlock('dynamic_column');
          (block as any).setColumnInfo(col.name, col.table);
          block.initSvg();
          block.moveBy(50 + (index * 20), 100 + (index * 80));
          block.render();
        }
      });
    }
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
