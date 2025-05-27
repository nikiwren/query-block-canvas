import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks'; // Import standard blocks
import { javascriptGenerator } from 'blockly/javascript'; // Explicit import
import defineCustomBlocks from '@/lib/sql_blocks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Call defineCustomBlocks to register them with Blockly
defineCustomBlocks();

const BlocklySqlEditor: React.FC = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const toolboxXml = `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <category name="Query Builder" colour="290">
        <block type="sql_query"></block>
        <block type="sql_column_list"></block> {/* Our new column list block */}
      </category>
      <sep></sep>
      <category name="Table: rtable1" colour="160">
        <block type="rcol11_block"></block>
        <block type="rcol12_block"></block>
      </category>
      <category name="Table: rtable2" colour="180">
        <block type="rcol21_block"></block>
        <block type="rcol22_block"></block>
      </category>
      <sep></sep>
      <category name="Text & Numbers" colour="65">
        <block type="text"></block>
        <block type="math_number">
          <field name="NUM">0</field>
        </block>
      </category>
      <sep></sep>
      {/* Generic Lists category is removed to avoid confusion with sql_column_list */}
      {/* If other list blocks are needed for other purposes, they can be added back selectively */}
       <category name="Logic" colour="210"> {/* Standard Blockly Logic HUE */}
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_negate"></block>
        <block type="logic_boolean"></block>
        <block type="logic_null"></block>
        <block type="logic_ternary"></block>
      </category>
    </xml>
  `;
  const [generatedSql, setGeneratedSql] = useState<string>('-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.');
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

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
          if (workspaceRef.current.getAllBlocks(false).length === 0) {
            setGeneratedSql('-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.');
          } else {
            const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
            setGeneratedSql(code || '-- Build your query by dragging blocks.');
          }
        }
      };
      workspaceRef.current.addChangeListener(onWorkspaceChange);
      
      onWorkspaceChange();
    }
    // ... keep existing code (useEffect cleanup logic)
  }, []);

  const handleGenerateSql = () => {
    if (workspaceRef.current) {
      if (workspaceRef.current.getAllBlocks(false).length === 0) {
            setGeneratedSql('-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.');
      } else {
        const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
        setGeneratedSql(code || '-- Build your query by dragging blocks.');
        console.log('Generated SQL:', code);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] gap-4 p-4 bg-background">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>SQL Block Editor</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <Button onClick={handleGenerateSql} className="w-full">
          Generate SQL
        </Button>
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Generated SQL</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <pre className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap break-all">
                {generatedSql}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlocklySqlEditor;
