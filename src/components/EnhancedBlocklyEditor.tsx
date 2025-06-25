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
import QueryResultsView from './QueryResultsView';

defineEnhancedBlocks();

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  columns: Array<{ id: string; name: string; table: string }>;
  blockData?: string;
}

interface EnhancedBlocklyEditorProps {
  selectedColumns: Array<{ id: string; name: string; table: string }>;
  onQuerySaved?: () => void;
  loadedQuery?: SavedQuery | null;
  onQueryLoad?: (query: SavedQuery) => void;
}

type ViewMode = 'editor' | 'results' | 'load';

const EnhancedBlocklyEditor: React.FC<EnhancedBlocklyEditorProps> = ({ 
  selectedColumns, 
  onQuerySaved, 
  loadedQuery,
  onQueryLoad 
}) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [previousColumns, setPreviousColumns] = useState<Array<{ id: string; name: string; table: string }>>([]);
  const [joinError, setJoinError] = useState<{ show: boolean; missingJoins: string[] }>({ show: false, missingJoins: [] });
  const [validationError, setValidationError] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);

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

  const validateSqlQuery = (sql: string): { isValid: boolean; message: string } => {
    // Remove comments and trim whitespace
    const cleanSql = sql.replace(/--.*$/gm, '').trim();
    
    // Check if SQL is empty or just the default comment
    if (!cleanSql || cleanSql === '-- Build your query using the blocks') {
      return { isValid: false, message: 'Please build a query using the blocks before previewing data.' };
    }

    // Check if SQL contains basic SELECT structure
    if (!cleanSql.toLowerCase().includes('select')) {
      return { isValid: false, message: 'Invalid SQL query. Please ensure your query contains a SELECT statement.' };
    }

    // Check for incomplete query (ends with FROM but no table)
    if (cleanSql.toLowerCase().includes('from') && cleanSql.trim().toLowerCase().endsWith('from')) {
      return { isValid: false, message: 'Incomplete query. Please specify tables and complete your query.' };
    }

    return { isValid: true, message: '' };
  };

  const loadQueryIntoWorkspace = (query: SavedQuery) => {
    if (!workspaceRef.current) return;

    try {
      // Clear existing workspace
      workspaceRef.current.clear();

      if (query.blockData) {
        // Load from serialized block data if available
        const xml = Blockly.utils.xml.textToDom(query.blockData);
        Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
      } else {
        // Recreate blocks from SQL structure (fallback method)
        recreateBlocksFromQuery(query);
      }

      // Update generated SQL and render workspace
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      setGeneratedSql(code || query.sql);
      
      // Force render the workspace to ensure blocks are visible
      workspaceRef.current.render();
    } catch (error) {
      console.error('Error loading query into workspace:', error);
      // Fallback to recreating from scratch
      recreateBlocksFromQuery(query);
    }
  };

  const recreateBlocksFromQuery = (query: SavedQuery) => {
    if (!workspaceRef.current) return;

    // Clear workspace first
    workspaceRef.current.clear();

    // Add the persistent query block
    const queryBlock = workspaceRef.current.newBlock('enhanced_sql_query');
    queryBlock.initSvg();
    queryBlock.moveBy(50, 50);
    queryBlock.render();

    // Add column blocks for each column in the saved query
    query.columns.forEach((col, index) => {
      const columnBlock = workspaceRef.current!.newBlock('dynamic_column');
      (columnBlock as any).setColumnInfo(col.name, col.table);
      columnBlock.initSvg();
      columnBlock.moveBy(50, 150 + (index * 40)); // Position blocks vertically
      columnBlock.render();
      
      // Connect the column block to the SELECT input of the query block
      const selectInput = queryBlock.getInput('SELECT_COLUMNS');
      if (selectInput && selectInput.connection) {
        let targetConnection = selectInput.connection;
        
        // If there's already a connection, find the end of the chain
        if (index > 0) {
          // Find the last connected block
          let currentBlock = targetConnection.targetConnection?.getSourceBlock();
          while (currentBlock && currentBlock.getNextBlock()) {
            currentBlock = currentBlock.getNextBlock();
          }
          if (currentBlock && currentBlock.nextConnection) {
            targetConnection = currentBlock.nextConnection;
          }
        }
        
        // Connect the new block
        if (targetConnection && columnBlock.previousConnection && !targetConnection.targetConnection) {
          targetConnection.connect(columnBlock.previousConnection);
        }
      }
    });

    // Generate SQL and render workspace
    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    setGeneratedSql(code || query.sql);
    workspaceRef.current.render();
  };

  const getMockSavedQueries = (): SavedQuery[] => {
    return [
      {
        id: '1',
        name: 'User Activity Report',
        sql: 'SELECT rtable1.rcol11, rtable1.rcol12\nFROM rtable1',
        columns: [
          { id: 'rtable1.rcol11', name: 'rcol11', table: 'rtable1' },
          { id: 'rtable1.rcol12', name: 'rcol12', table: 'rtable1' }
        ]
      },
      {
        id: '2',
        name: 'Cross Table Analysis',
        sql: 'SELECT rtable1.rcol11, ttable1.tcol11\nFROM rtable1\nINNER JOIN ttable1 ON rtable1.rcol11 = ttable1.tcol12',
        columns: [
          { id: 'rtable1.rcol11', name: 'rcol11', table: 'rtable1' },
          { id: 'ttable1.tcol11', name: 'tcol11', table: 'ttable1' }
        ]
      }
    ];
  };

  useEffect(() => {
    if (loadedQuery && workspaceRef.current) {
      loadQueryIntoWorkspace(loadedQuery);
    }
  }, [loadedQuery]);

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
          if (selectInput && selectInput.connection) {
            // If there's already a connection, find the end of the chain
            let targetConnection = selectInput.connection;
            if (targetConnection.targetConnection) {
              // Find the last block in the chain using public API
              let currentBlock = targetConnection.targetConnection.getSourceBlock();
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

  const handlePreviewData = () => {
    if (workspaceRef.current) {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      const sqlToValidate = code || '-- Build your query using the blocks';
      
      // Validate the SQL query
      const validation = validateSqlQuery(sqlToValidate);
      
      if (!validation.isValid) {
        setValidationError({ show: true, message: validation.message });
        return;
      }
      
      setGeneratedSql(sqlToValidate);
      setViewMode('results');
    }
  };

  const handleSaveQuery = async () => {
    try {
      // Serialize the current workspace
      let blockData = '';
      if (workspaceRef.current) {
        const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
        blockData = Blockly.utils.xml.domToText(xml);
      }

      const queryToSave: SavedQuery = {
        id: Date.now().toString(),
        name: `Query ${Date.now()}`,
        sql: generatedSql,
        columns: selectedColumns,
        blockData
      };

      // Mock save operation - replace with actual database call
      console.log('Saving query:', queryToSave);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset to initial state with just the query builder block
      if (workspaceRef.current) {
        workspaceRef.current.clear();
        addPersistentQueryBlock();
        // Regenerate SQL after clearing
        const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
        setGeneratedSql(code || '-- Build your query using the blocks');
      }
      
      setViewMode('editor');
      
      // Notify parent component if callback provided
      if (onQuerySaved) {
        onQuerySaved();
      }
      
      console.log('Query saved successfully');
    } catch (error) {
      console.error('Failed to save query:', error);
    }
  };

  const handleLoadQuery = () => {
    setSavedQueries(getMockSavedQueries());
    setViewMode('load');
  };

  const handleSelectQuery = (query: SavedQuery) => {
    if (onQueryLoad) {
      onQueryLoad(query);
    }
    setViewMode('editor');
  };

  const handleExit = () => {
    // Reset to initial state with just the query builder block
    if (workspaceRef.current) {
      workspaceRef.current.clear();
      addPersistentQueryBlock();
      // Regenerate SQL after clearing to ensure canvas displays properly
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      setGeneratedSql(code || '-- Build your query using the blocks');
    }
    
    setViewMode('editor');
  };

  const closeJoinError = () => {
    setJoinError({ show: false, missingJoins: [] });
  };

  const closeValidationError = () => {
    setValidationError({ show: false, message: '' });
  };

  if (viewMode === 'load') {
    return (
      <div className="h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Load Saved Query</h2>
          <Button onClick={() => setViewMode('editor')} variant="outline">
            Cancel
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Saved Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedQueries.map((query) => (
                <div key={query.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{query.name}</h3>
                      <pre className="text-sm text-gray-600 mt-2 whitespace-pre-wrap font-mono">
                        {query.sql}
                      </pre>
                      <p className="text-xs text-gray-500 mt-2">
                        Columns: {query.columns.map(col => `${col.table}.${col.name}`).join(', ')}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleSelectQuery(query)}
                      size="sm"
                    >
                      Load Query
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'results') {
    return (
      <QueryResultsView 
        sqlQuery={generatedSql}
        onSaveQuery={handleSaveQuery}
        onExit={handleExit}
      />
    );
  }

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

      {validationError.show && (
        <Alert variant="destructive" className="mb-4 relative">
          <AlertTitle>Invalid Query</AlertTitle>
          <AlertDescription>
            {validationError.message}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={closeValidationError}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>SQL Query Builder</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={handleLoadQuery} variant="secondary">
              Load Query
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button onClick={generateSqlPreview} variant="outline">
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
            
            <Button onClick={handlePreviewData} className="bg-blue-600 hover:bg-blue-700">
              Preview Data
            </Button>
            
            <Button onClick={handleSaveQuery} variant="default">
              Save Query
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBlocklyEditor;
