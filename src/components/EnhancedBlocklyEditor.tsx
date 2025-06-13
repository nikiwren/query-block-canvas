
import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import { defineEnhancedBlocks } from '@/lib/blockly/enhanced_blocks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';

defineEnhancedBlocks();

interface EnhancedBlocklyEditorProps {
  selectedColumns: Array<{ id: string; name: string; table: string }>;
}

const EnhancedBlocklyEditor: React.FC<EnhancedBlocklyEditorProps> = ({ selectedColumns }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [previousColumns, setPreviousColumns] = useState<Array<{ id: string; name: string; table: string }>>([]);
  const [joinError, setJoinError] = useState<{ show: boolean; missingJoins: string[] }>({ show: false, missingJoins: [] });

  const generateToolboxXml = (columns: Array<{ id: string; name: string; table: string }>) => {
    return `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <category name="Query Builder" colour="290">
          <block type="enhanced_sql_query"></block>
        </category>
        <category name="Selected Columns" colour="160">
          ${columns.map(col => 
            `<block type="dynamic_column">
              <field name="COLUMN_NAME">${col.name}</field>
              <field name="TABLE_NAME">${col.table}</field>
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

  const addPersistentQueryBlock = () => {
    if (!workspaceRef.current) return;

    // Check if a query block already exists
    const existingBlocks = workspaceRef.current.getBlocksByType('enhanced_sql_query', false);
    if (existingBlocks.length > 0) return;

    // Create and position the SQL query block
    const queryBlock = workspaceRef.current.newBlock('enhanced_sql_query');
    queryBlock.initSvg();
    queryBlock.moveBy(50, 50); // Position it at a fixed location
    queryBlock.render();
    
    // Make the block less likely to be accidentally deleted by making it prominent
    queryBlock.setMovable(true);
    queryBlock.setDeletable(true);
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

      // Add the persistent query block immediately after workspace initialization
      addPersistentQueryBlock();

      const onWorkspaceChange = () => {
        if (workspaceRef.current) {
          const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
          setGeneratedSql(code || '-- Build your query using the blocks');
        }
      };

      workspaceRef.current.addChangeListener(onWorkspaceChange);

      // Listen for join error events
      const handleJoinError = (event: CustomEvent) => {
        setJoinError({
          show: true,
          missingJoins: event.detail.missingJoins
        });
      };

      window.addEventListener('showJoinError', handleJoinError as EventListener);

      return () => {
        window.removeEventListener('showJoinError', handleJoinError as EventListener);
      };
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

    // Remove blocks for unchecked columns (but preserve the query builder block)
    if (removedColumnIds.length > 0) {
      const allBlocks = workspaceRef.current.getAllBlocks(false);
      
      allBlocks.forEach((block: any) => {
        if (block.type === 'dynamic_column') {
          const blockColumnName = block.getFieldValue('COLUMN_NAME');
          const blockTableName = block.getFieldValue('TABLE_NAME') || block.tableName_;
          const blockId = `${blockTableName}.${blockColumnName}`;
          
          if (removedColumnIds.includes(blockId)) {
            block.dispose();
          }
        }
      });

      // Refresh the workspace to update scrollbars after block removal
      workspaceRef.current.cleanUp();
      workspaceRef.current.resizeContents();
      workspaceRef.current.render();
    }

    // Add blocks for newly checked columns and attach them to the query builder
    if (addedColumns.length > 0) {
      // Find the SQL query builder block
      const queryBlocks = workspaceRef.current.getBlocksByType('enhanced_sql_query', false);
      
      if (queryBlocks.length > 0) {
        const queryBlock = queryBlocks[0];
        const selectInput = queryBlock.getInput('SELECT_COLUMNS');
        
        addedColumns.forEach((col) => {
          const block = workspaceRef.current!.newBlock('dynamic_column');
          (block as any).setColumnInfo(col.name, col.table);
          block.initSvg();
          block.render();
          
          // Connect the new block to the SELECT input of the query builder
          if (selectInput) {
            // If there's already a connection, find the end of the chain
            let targetConnection = selectInput.connection;
            if (targetConnection && targetConnection.targetConnection) {
              // Find the last block in the chain
              let currentBlock = targetConnection.targetConnection.sourceBlock_;
              while (currentBlock && currentBlock.getNextBlock()) {
                currentBlock = currentBlock.getNextBlock();
              }
              // Connect to the next statement of the last block
              if (currentBlock && currentBlock.nextConnection && !currentBlock.nextConnection.targetConnection) {
                targetConnection = currentBlock.nextConnection;
              }
            }
            
            // Connect the new block
            if (targetConnection && block.previousConnection) {
              targetConnection.connect(block.previousConnection);
            }
          }
        });
      } else {
        // Fallback: if no query block exists, create blocks normally
        addedColumns.forEach((col, index) => {
          const block = workspaceRef.current!.newBlock('dynamic_column');
          (block as any).setColumnInfo(col.name, col.table);
          block.initSvg();
          block.moveBy(50 + (index * 20), 150 + (selectedColumns.length * 20));
          block.render();
        });
      }
    }

    // Ensure the query builder block is always present
    addPersistentQueryBlock();

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

  const closeJoinError = () => {
    setJoinError({ show: false, missingJoins: [] });
  };

  return (
    <div className="h-full flex flex-col">
      {joinError.show && (
        <Alert variant="destructive" className="mb-4 relative">
          <AlertTitle>Join Not Defined</AlertTitle>
          <AlertDescription>
            Join not defined between tables: {joinError.missingJoins.join(', ')}. Please reach out to dev for support.
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={closeJoinError}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>SQL Query Builder</CardTitle>
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
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBlocklyEditor;
