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
    const data = { column: 'rcol11', table: 'rtable1' };
    return [JSON.stringify(data), Order.NONE];
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
    return [JSON.stringify(data), Order.NONE];
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
    return [JSON.stringify(data), Order.NONE];
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
    return [JSON.stringify(data), Order.NONE];
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

    const processColumnInput = (colValue: string | null) => {
      if (colValue && colValue.trim() !== '') {
        let processedAsJson = false;
        try {
          // Check if it's a SpecificColumn block output
          const parsed = JSON.parse(colValue);
          if (typeof parsed === 'object' && parsed !== null && 'column' in parsed && 'table' in parsed) {
            uniqueColumns.add(String(parsed.column));
            uniqueTables.add(String(parsed.table));
            processedAsJson = true;
          }
        } catch (e) {
          // Not a JSON object from our SpecificColumn blocks, or malformed JSON.
          // Could be a literal string (e.g., from a text block).
        }

        if (!processedAsJson) {
          // Handle plain text block (e.g., from 'text' block) or other string output.
          // JavaScript generator for 'text' block often returns a quoted string.
          let textContent = colValue;
          if ((textContent.startsWith("'") && textContent.endsWith("'")) || (textContent.startsWith('"') && textContent.endsWith('"'))) {
            textContent = textContent.substring(1, textContent.length - 1);
          }
          if (textContent.trim() !== '') {
            uniqueColumns.add(textContent);
          }
        }
      }
    };

    const columnsListBlock = block.getInputTargetBlock('COLUMNS');
    if (columnsListBlock && columnsListBlock.type === 'lists_create_with') {
      for (let i = 0; i < (columnsListBlock as any).itemCount_; i++) {
        const colValue = javascriptGenerator.valueToCode(columnsListBlock, 'ADD' + i, Order.NONE);
        processColumnInput(colValue);
      }
    } else {
      // Handle if COLUMNS input is not a list but a single connected block
      const directColumnValue = javascriptGenerator.valueToCode(block, 'COLUMNS', Order.NONE);
      processColumnInput(directColumnValue);
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
    // Unquote if it's a string literal from a text block
    let conditionStr = condition;
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
