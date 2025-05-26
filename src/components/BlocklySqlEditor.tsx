
import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks'; // Import standard blocks
import 'blockly/javascript'; // Import JavaScript generator
import defineCustomBlocks from '@/lib/sql_blocks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Call defineCustomBlocks to register them with Blockly
defineCustomBlocks();

const BlocklySqlEditor: React.FC = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const toolboxXml = `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <category name="SQL Query" colour="290">
        <block type="sql_query"></block>
      </category>
      <category name="Clauses" colour="230">
        <block type="sql_select"></block>
        <block type="sql_from"></block>
        <block type="sql_where"></block>
      </category>
      <category name="Values" colour="100">
        <block type="text"></block>
        <block type="math_number">
          <field name="NUM">0</field>
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
  let workspace: Blockly.WorkspaceSvg | null = null;

  useEffect(() => {
    if (blocklyDiv.current && !workspace) {
      // Ensure custom blocks are defined before workspace initialization
      // defineCustomBlocks() is called globally now, which is fine for this setup.

      workspace = Blockly.inject(blocklyDiv.current, {
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
        if (workspace) {
          // @ts-ignore Blockly.JavaScript might not be fully typed
          const code = Blockly.JavaScript.workspaceToCode(workspace);
          setGeneratedSql(code);
        }
      };
      workspace.addChangeListener(onWorkspaceChange);
    }

    return () => {
      // workspace?.dispose(); // This can cause issues with HMR if not handled carefully
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const handleGenerateSql = () => {
    if (workspace) {
      // @ts-ignore
      const code = Blockly.JavaScript.workspaceToCode(workspace);
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
                {generatedSql || '// Drag blocks to generate SQL'}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlocklySqlEditor;

