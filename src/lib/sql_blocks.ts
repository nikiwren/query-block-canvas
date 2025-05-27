
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

// Define custom block types
const defineCustomBlocks = () => {
  // Block for a single table reference
  Blockly.Blocks['sql_table_reference'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Table:')
        .appendField(new Blockly.FieldTextInput('your_table'), 'TABLE_NAME');
      this.setOutput(true, 'TableReference'); // Can be used in lists
      this.setColour(65);
      this.setTooltip('Represents a single table name.');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator.forBlock['sql_table_reference'] = function (block: Blockly.Block) {
    const tableName = block.getFieldValue('TABLE_NAME');
    return [tableName, Order.ATOMIC];
  };

  // Block for a single column reference
  Blockly.Blocks['sql_column_reference'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Column:')
        .appendField(new Blockly.FieldTextInput('your_column'), 'COLUMN_NAME');
      this.setOutput(true, 'ColumnReference'); // Can be used in lists
      this.setColour(65);
      this.setTooltip('Represents a single column name.');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator.forBlock['sql_column_reference'] = function (block: Blockly.Block) {
    const columnName = block.getFieldValue('COLUMN_NAME');
    return [columnName, Order.ATOMIC];
  };
  
  // Redefined: sql_query - main container block with direct inputs
  Blockly.Blocks['sql_query'] = {
    init: function () {
      this.appendValueInput('COLUMNS')
        .setCheck('Array') // Expects a list of column references
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('SELECT');
      this.appendValueInput('TABLES')
        .setCheck('Array') // Expects a list of table references
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('FROM');
      this.appendValueInput('CONDITION')
        .setCheck(['Boolean', 'String']) // Condition (e.g. from Logic blocks or Text block)
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('WHERE (optional)');
      this.setOutput(true, 'String'); // This block outputs the SQL string
      this.setColour(290);
      this.setTooltip('Constructs a SQL query. Connect lists of columns and tables, and an optional condition.');
      this.setHelpUrl('');
      this.setInputsInline(false); // Stack inputs vertically
    },
  };
  
  javascriptGenerator.forBlock['sql_query'] = function (block: Blockly.Block) {
    // SELECT part
    let columnsStr = '*';
    const columnsListBlock = block.getInputTargetBlock('COLUMNS');
    if (columnsListBlock && columnsListBlock.type === 'lists_create_with') {
      const tempColumns = [];
      for (let i = 0; i < (columnsListBlock as any).itemCount_; i++) {
        const colCode = javascriptGenerator.valueToCode(columnsListBlock, 'ADD' + i, Order.ATOMIC);
        if (colCode) {
          tempColumns.push(colCode.replace(/^["']|["']$/g, '')); // Remove quotes
        }
      }
      if (tempColumns.length > 0) {
        columnsStr = tempColumns.join(', ');
      }
    } else {
      // Fallback for directly connected single value (though check is 'Array') or if nothing connected
      const directColumnsInput = javascriptGenerator.valueToCode(block, 'COLUMNS', Order.ATOMIC);
      if (directColumnsInput && directColumnsInput !== "''" && directColumnsInput !== '""') {
        columnsStr = directColumnsInput.replace(/^["']|["']$/g, '');
      }
    }

    // FROM part
    let tablesStr = '';
    const tablesListBlock = block.getInputTargetBlock('TABLES');
    if (tablesListBlock && tablesListBlock.type === 'lists_create_with') {
      const tempTables = [];
      for (let i = 0; i < (tablesListBlock as any).itemCount_; i++) {
        const tableCode = javascriptGenerator.valueToCode(tablesListBlock, 'ADD' + i, Order.ATOMIC);
        if (tableCode) {
          tempTables.push(tableCode.replace(/^["']|["']$/g, '')); // Remove quotes
        }
      }
      if (tempTables.length > 0) {
        tablesStr = tempTables.join(', ');
      }
    } else {
      // Fallback for directly connected single value or if nothing connected
      const directTablesInput = javascriptGenerator.valueToCode(block, 'TABLES', Order.ATOMIC);
      if (directTablesInput && directTablesInput !== "''" && directTablesInput !== '""') {
        tablesStr = directTablesInput.replace(/^["']|["']$/g, '');
      }
    }

    if (!tablesStr) {
      return [`-- ERROR: No tables specified in FROM clause\nSELECT ${columnsStr}\nFROM ...`, Order.ATOMIC];
    }

    // WHERE part
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || '';
    // Remove quotes if it's a simple string literal, but be careful not to mess up complex conditions
    const conditionStr = condition.startsWith("'") && condition.endsWith("'") || condition.startsWith('"') && condition.endsWith('"') 
                       ? condition.substring(1, condition.length - 1) 
                       : condition;
    
    let query = `SELECT ${columnsStr}\nFROM ${tablesStr}`;
    if (conditionStr.trim()) {
      query += `\nWHERE ${conditionStr}`;
    }
    
    return [query.trim(), Order.ATOMIC];
  };

  // The old sql_select, sql_from, and sql_where block definitions and their generators are removed
  // as their functionality is now integrated into the sql_query block.
};

export default defineCustomBlocks;

