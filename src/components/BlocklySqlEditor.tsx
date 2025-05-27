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
      </category>
      <sep></sep>
      <category name="Building Blocks" colour="65">
        <block type="sql_table_reference"></block>
        <block type="sql_column_reference"></block>
        <block type="text"></block>
        <block type="math_number">
          <field name="NUM">0</field>
        </block>
      </category>
      <sep></sep>
      <category name="Lists" colour="%{BKY_LISTS_HUE}">
        <block type="lists_create_with">
          <mutation items="2"></mutation>
        </block>
        <block type="lists_create_empty"></block>
        <block type="lists_repeat">
          <value name="NUM">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
        <block type="lists_length"></block>
        <block type="lists_isEmpty"></block>
        <block type="lists_indexOf">
          <field name="END">FIRST</field>
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">{listVariable}</field>
            </block>
          </value>
        </block>
        <block type="lists_getIndex">
          <mutation statement="false" at="true"></mutation>
          <field name="MODE">GET</field>
          <field name="WHERE">FROM_START</field>
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">{listVariable}</field>
            </block>
          </value>
        </block>
      </category>
      <sep></sep>
       <category name="Logic" colour="%{BKY_LOGIC_HUE}">
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
  const [generatedSql, setGeneratedSql] = useState<string>('');
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
          const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
          setGeneratedSql(code);
        }
      };
      workspaceRef.current.addChangeListener(onWorkspaceChange);
      
      // Initial code generation
      onWorkspaceChange();
    }

    // Basic cleanup on unmount (optional, can be more complex if needed)
    // return () => {
    //   workspaceRef.current?.dispose();
    //   workspaceRef.current = null;
    // };
  }, []); // Empty dependency array ensures this runs once on mount

  const handleGenerateSql = () => {
    if (workspaceRef.current) {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      setGeneratedSql(code);
      console.log('Generated SQL:', code);
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
                {generatedSql || '// Drag blocks from the left to build your SQL query.'}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlocklySqlEditor;
