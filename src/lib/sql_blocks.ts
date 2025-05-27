
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

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
    return [{ column: 'rcol11', table: 'rtable1' }, Order.NONE];
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
    return [{ column: 'rcol12', table: 'rtable1' }, Order.NONE];
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
    return [{ column: 'rcol21', table: 'rtable2' }, Order.NONE];
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
    return [{ column: 'rcol22', table: 'rtable2' }, Order.NONE];
  };
  
  // Main SQL Query Block - FROM clause is now auto-generated
  Blockly.Blocks['sql_query'] = {
    init: function () {
      this.appendValueInput('COLUMNS')
        .setCheck('Array') // Expects a list of 'SpecificColumn' or compatible
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('SELECT');
      // FROM input is removed
      this.appendValueInput('CONDITION')
        .setCheck(['Boolean', 'String']) // Condition (e.g. from Logic blocks or Text block)
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('WHERE (optional)');
      this.setOutput(true, 'String'); // This block outputs the SQL string
      this.setColour(290);
      this.setTooltip('Constructs a SQL query. Add columns to SELECT; FROM is auto-generated. Add optional WHERE condition.');
      this.setHelpUrl('');
      this.setInputsInline(false); // Stack inputs vertically
    },
  };
  
  javascriptGenerator.forBlock['sql_query'] = function (block: Blockly.Block) {
    const uniqueColumns = new Set<string>();
    const uniqueTables = new Set<string>();

    const columnsListBlock = block.getInputTargetBlock('COLUMNS');
    if (columnsListBlock && columnsListBlock.type === 'lists_create_with') {
      for (let i = 0; i < (columnsListBlock as any).itemCount_; i++) {
        // Order.NONE is crucial to get the raw object from our SpecificColumn blocks
        const colData = javascriptGenerator.valueToCode(columnsListBlock, 'ADD' + i, Order.NONE);
        if (typeof colData === 'object' && colData !== null && 'column' in colData && 'table' in colData) {
          uniqueColumns.add(String(colData.column));
          uniqueTables.add(String(colData.table));
        } else if (colData && typeof colData === 'string' && colData.trim() !== '' && colData.replace(/^["']|["']$/g, '').trim() !== '') {
          // Handle plain text block as a column, but it won't contribute to table discovery
          uniqueColumns.add(colData.replace(/^["']|["']$/g, ''));
        }
      }
    } else {
      // Handle if COLUMNS input is not a list but a single connected block
      const directColumnsInput = javascriptGenerator.valueToCode(block, 'COLUMNS', Order.NONE);
      if (typeof directColumnsInput === 'object' && directColumnsInput !== null && 'column' in directColumnsInput && 'table' in directColumnsInput) {
        uniqueColumns.add(String(directColumnsInput.column));
        uniqueTables.add(String(directColumnsInput.table));
      } else if (directColumnsInput && typeof directColumnsInput === 'string' && directColumnsInput.trim() !== '' && directColumnsInput.replace(/^["']|["']$/g, '').trim() !== '') {
         uniqueColumns.add(directColumnsInput.replace(/^["']|["']$/g, ''));
      }
    }

    let columnsStr = uniqueColumns.size > 0 ? Array.from(uniqueColumns).join(', ') : '*';
    
    if (uniqueTables.size === 0) {
      if (uniqueColumns.size > 0 && columnsStr !== '*') {
        return [`-- ERROR: No tables could be derived. Use column blocks from 'Table: ...' categories for SELECT.\nSELECT ${columnsStr}\nFROM ...`, Order.ATOMIC];
      }
      return [`-- Drag column blocks (e.g., rtable1.rcol11) into a list and connect to SELECT.\n-- Tables will be added to FROM automatically.`, Order.ATOMIC];
    }

    let tablesStr = Array.from(uniqueTables).join(', ');

    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || '';
    const conditionStr = condition.startsWith("'") && condition.endsWith("'") || condition.startsWith('"') && condition.endsWith('"') 
                       ? condition.substring(1, condition.length - 1) 
                       : condition;
    
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
