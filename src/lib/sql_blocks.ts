import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

// Define interfaces for custom block properties and methods
interface ISqlColumnListBlock extends Blockly.Block {
  itemCount_: number;
  updateShape_: () => void;
  // The following are standard mutator methods, but defining them on the interface
  // helps ensure they are correctly implemented by blocks using this pattern.
  // They are implicitly part of the block's definition if this block is a mutator.
  mutationToDom: () => Element;
  domToMutation: (xmlElement: Element) => void;
  decompose: (workspace: Blockly.WorkspaceSvg) => Blockly.Block;
  compose: (containerBlock: Blockly.Block) => void;
  saveConnections: (containerBlock: Blockly.Block) => void;
}

interface IMutatorItemBlock extends Blockly.Block {
  valueConnection_?: Blockly.Connection | null;
}

// Define custom block types
const defineCustomBlocks = () => {
  // Specific column blocks that know their table

  // For rtable1
  Blockly.Blocks['rcol11_block'] = {
    init: function () {
      this.appendDummyInput().appendField('rtable1.rcol11');
      this.setOutput(true, 'SpecificColumn');
      this.setColour(160); // Unique color for rtable1
      this.setTooltip('Column rcol11 from table rtable1.');
      this.setHelpUrl('');
    },
  };
  javascriptGenerator.forBlock['rcol11_block'] = function (_block: Blockly.Block) {
    const data = { column: 'rcol11', table: 'rtable1' };
    return [JSON.stringify(data), Order.ATOMIC];
  };

  Blockly.Blocks['rcol12_block'] = {
    init: function () {
      this.appendDummyInput().appendField('rtable1.rcol12');
      this.setOutput(true, 'SpecificColumn');
      this.setColour(160);
      this.setTooltip('Column rcol12 from table rtable1.');
      this.setHelpUrl('');
    },
  };
  javascriptGenerator.forBlock['rcol12_block'] = function (_block: Blockly.Block) {
    const data = { column: 'rcol12', table: 'rtable1' };
    return [JSON.stringify(data), Order.ATOMIC];
  };

  // For rtable2
  Blockly.Blocks['rcol21_block'] = {
    init: function () {
      this.appendDummyInput().appendField('rtable2.rcol21');
      this.setOutput(true, 'SpecificColumn');
      this.setColour(180); // Unique color for rtable2
      this.setTooltip('Column rcol21 from table rtable2.');
      this.setHelpUrl('');
    },
  };
  javascriptGenerator.forBlock['rcol21_block'] = function (_block: Blockly.Block) {
    const data = { column: 'rcol21', table: 'rtable2' };
    return [JSON.stringify(data), Order.ATOMIC];
  };

  Blockly.Blocks['rcol22_block'] = {
    init: function () {
      this.appendDummyInput().appendField('rtable2.rcol22');
      this.setOutput(true, 'SpecificColumn');
      this.setColour(180);
      this.setTooltip('Column rcol22 from table rtable2.');
      this.setHelpUrl('');
    },
  };
  javascriptGenerator.forBlock['rcol22_block'] = function (_block: Blockly.Block) {
    const data = { column: 'rcol22', table: 'rtable2' };
    return [JSON.stringify(data), Order.ATOMIC];
  };

  // Custom list block for SQL columns
  Blockly.Blocks['sql_column_list'] = {
    init: function(this: ISqlColumnListBlock) {
      this.setHelpUrl(Blockly.Msg['LISTS_CREATE_WITH_HELPURL'] || '');
      this.setColour(260); // Standard list color
      this.itemCount_ = 2; // Default number of item inputs
      this.updateShape_();
      this.setOutput(true, 'Array'); // Outputs an array, compatible with sql_query's SELECT input
      this.setMutator(new Blockly.icons.MutatorIcon(['lists_create_with_item'], this)); // Corrected Mutator usage
      this.setTooltip(Blockly.Msg['LISTS_CREATE_WITH_TOOLTIP'] || 'Create a list of columns.');
    },
    mutationToDom: function(this: ISqlColumnListBlock) {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('items', String(this.itemCount_));
      return container;
    },
    domToMutation: function(this: ISqlColumnListBlock, xmlElement: Element) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items') || '0', 10);
      this.updateShape_();
    },
    decompose: function(this: ISqlColumnListBlock, workspace: Blockly.WorkspaceSvg) {
      const containerBlock = workspace.newBlock('lists_create_with_container');
      containerBlock.initSvg();
      let connection = containerBlock.getInput('STACK')?.connection;
      for (let i = 0; i < this.itemCount_; i++) {
        const itemBlock = workspace.newBlock('lists_create_with_item');
        itemBlock.initSvg();
        if (connection && itemBlock.previousConnection) {
          connection.connect(itemBlock.previousConnection);
          connection = itemBlock.nextConnection;
        }
      }
      return containerBlock;
    },
    compose: function(this: ISqlColumnListBlock, containerBlock: Blockly.Block) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      const connections: (Blockly.Connection | null)[] = [];
      while (itemBlock) {
        connections.push((itemBlock as IMutatorItemBlock).valueConnection_ ?? null); // Cast itemBlock
        itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      }
      // Disconnect any dragging blocks that were dropped elsewhere.
      for (let i = 0; i < this.itemCount_; i++) {
        const connection = this.getInput('ADD' + i)?.connection?.targetConnection;
        if (connection && connections.indexOf(connection) === -1) {
          connection.disconnect();
        }
      }
      this.itemCount_ = connections.length;
      this.updateShape_();
      // Reconnect any child blocks.
      for (let i = 0; i < this.itemCount_; i++) {
        Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
      }
    },
    saveConnections: function(this: ISqlColumnListBlock, containerBlock: Blockly.Block) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      let i = 0;
      while (itemBlock) {
        const input = this.getInput('ADD' + i);
        if (input && itemBlock) {
            (itemBlock as IMutatorItemBlock).valueConnection_ = input.connection?.targetConnection; // Cast itemBlock
        }
        i++;
        itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      }
    },
    updateShape_: function(this: ISqlColumnListBlock) {
      if (this.itemCount_ && this.getInput('EMPTY')) {
        this.removeInput('EMPTY');
      } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
        this.appendDummyInput('EMPTY')
            .appendField(Blockly.Msg['LISTS_CREATE_EMPTY_TITLE'] || 'create empty list');
      }
      // Add new inputs.
      for (let i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          const input = this.appendValueInput('ADD' + i)
                            .setAlign(Blockly.inputs.Align.RIGHT);
          if (i === 0) {
            input.appendField('select columns'); // Specific label for this list
          }
          input.setCheck('SpecificColumn'); // Crucially, only accept 'SpecificColumn'
        }
      }
      // Remove deleted inputs.
      for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
        this.removeInput('ADD' + i);
      }
    }
  };

  // The generator for sql_column_list
  if (javascriptGenerator.forBlock['lists_create_with']) {
    // Prefer the standard list generator if available, as it's well-tested.
    javascriptGenerator.forBlock['sql_column_list'] = javascriptGenerator.forBlock['lists_create_with'];
  } else {
    // Fallback generator (should ideally not be needed if 'blockly/blocks' and 'blockly/javascript' are imported)
    javascriptGenerator.forBlock['sql_column_list'] = (block: Blockly.Block) => {
      const sqlListBlock = block as ISqlColumnListBlock; // Cast block
      const elements = new Array(sqlListBlock.itemCount_);
      for (let i = 0; i < sqlListBlock.itemCount_; i++) {
        elements[i] = javascriptGenerator.valueToCode(sqlListBlock, 'ADD' + i, Order.NONE) || 'null';
      }
      const code = '[' + elements.join(', ') + ']';
      return [code, Order.ATOMIC];
    };
  }
  
  // Main SQL Query Block - FROM clause is now auto-generated
  Blockly.Blocks['sql_query'] = {
    init: function () {
      this.appendValueInput('COLUMNS')
        .setCheck('Array') // Expects a list (Array type) of 'SpecificColumn'
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('SELECT');
      this.appendValueInput('CONDITION')
        .setCheck(['Boolean', 'String']) 
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('WHERE (optional)');
      this.setOutput(true, 'String'); 
      this.setColour(290);
      this.setTooltip('Constructs a SQL query. Add columns to SELECT using "select columns" block; FROM is auto-generated. Add optional WHERE condition.');
      this.setHelpUrl('');
      this.setInputsInline(false); 
    },
  };
  
  javascriptGenerator.forBlock['sql_query'] = function (block: Blockly.Block) {
    const uniqueColumns = new Set<string>();
    const uniqueTables = new Set<string>();

    const processColumnInput = (colValue: string | null) => {
      if (colValue && colValue.trim() !== '' && colValue !== 'null') {
        let processedAsJson = false;
        try {
          // Attempt to parse as JSON (for individual column blocks)
          const parsed = JSON.parse(colValue);
          if (typeof parsed === 'object' && parsed !== null && 'column' in parsed && 'table' in parsed) {
            uniqueColumns.add(String(parsed.column));
            uniqueTables.add(String(parsed.table));
            processedAsJson = true;
          }
        } catch (e) {
          // Not a JSON object, or JSON parsing failed. Treat as plain text or list of JSON strings.
        }

        if (!processedAsJson) {
          // Check if it's an array of JSON strings (from sql_column_list)
          if (colValue.startsWith('[') && colValue.endsWith(']')) {
            try {
              const arr = JSON.parse(colValue);
              if (Array.isArray(arr)) {
                arr.forEach(itemStr => {
                  if (typeof itemStr === 'string') {
                    try {
                      const itemParsed = JSON.parse(itemStr);
                       if (typeof itemParsed === 'object' && itemParsed !== null && 'column' in itemParsed && 'table' in itemParsed) {
                        uniqueColumns.add(String(itemParsed.column));
                        uniqueTables.add(String(itemParsed.table));
                      }
                    } catch (itemParseError) {
                      // item is not a JSON string, could be a plain string column name from other sources
                      if (itemStr.trim() !== '') uniqueColumns.add(itemStr);
                    }
                  }
                });
                processedAsJson = true; // consider it processed if it was an array structure
              }
            } catch (arrayParseError) {
              // Not a valid JSON array string
            }
          }
        }
        
        // Fallback for direct text input if not processed as JSON or JSON array
        if (!processedAsJson) {
          let textContent = colValue;
          // Remove quotes if it's a single string literal
          if ((textContent.startsWith("'") && textContent.endsWith("'")) || (textContent.startsWith('"') && textContent.endsWith('"'))) {
            textContent = textContent.substring(1, textContent.length - 1);
          }
          if (textContent.trim() !== '') {
            uniqueColumns.add(textContent);
            // Cannot derive table from plain text input, user must use column blocks
          }
        }
      }
    };

    // Get the code from the 'COLUMNS' input. This could be a single column block or a 'sql_column_list'
    const columnsInputValue = javascriptGenerator.valueToCode(block, 'COLUMNS', Order.NONE);
    processColumnInput(columnsInputValue);


    let columnsStr = uniqueColumns.size > 0 ? Array.from(uniqueColumns).join(', ') : '*';
    
    if (uniqueTables.size === 0 && columnsStr !== '*' && columnsInputValue && columnsInputValue !== 'null' && columnsInputValue.trim() !== '') {
        return [`-- ERROR: No tables could be derived. Ensure you use column blocks (e.g., rtable1.rcol11) within the "select columns" block.\nSELECT ${columnsStr}\nFROM ... (table unknown)`, Order.ATOMIC];
    }
    if (uniqueTables.size === 0 && columnsStr === '*') {
         return [`-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.`, Order.ATOMIC];
    }
    if (uniqueTables.size === 0 && (!columnsInputValue || columnsInputValue === 'null' || columnsInputValue.trim() === '')) {
         // Handles case where COLUMNS input is empty
         return [`-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.`, Order.ATOMIC];
    }


    let tablesStr = Array.from(uniqueTables).join(', ');

    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || '';
    let conditionStr = condition;
    // Remove quotes if condition is a single string literal
    if ((condition.startsWith("'") && condition.endsWith("'")) || (condition.startsWith('"') && condition.endsWith('"'))) {
        conditionStr = condition.substring(1, condition.length - 1);
    }
    
    let query = `SELECT ${columnsStr}\nFROM ${tablesStr}`;
    if (conditionStr.trim()) {
      query += `\nWHERE ${conditionStr}`;
    }
    
    return [query.trim(), Order.ATOMIC];
  };

  // The old sql_table_reference and sql_column_reference are no longer primary,
  // but their definitions can remain if they are used elsewhere or for other purposes.
  // For this request, they are removed from the toolbox.
  Blockly.Blocks['sql_table_reference'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Table (legacy):')
        .appendField(new Blockly.FieldTextInput('your_table'), 'TABLE_NAME');
      this.setOutput(true, 'TableReference');
      this.setColour(65);
      this.setTooltip('Represents a single table name (legacy).');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator.forBlock['sql_table_reference'] = function (block: Blockly.Block) {
    const tableName = block.getFieldValue('TABLE_NAME');
    return [tableName, Order.ATOMIC];
  };

  Blockly.Blocks['sql_column_reference'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Column (legacy):')
        .appendField(new Blockly.FieldTextInput('your_column'), 'COLUMN_NAME');
      this.setOutput(true, 'ColumnReference');
      this.setColour(65);
      this.setTooltip('Represents a single column name (legacy).');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator.forBlock['sql_column_reference'] = function (block: Blockly.Block) {
    const columnName = block.getFieldValue('COLUMN_NAME');
    return [columnName, Order.ATOMIC];
  };
};

export default defineCustomBlocks;
