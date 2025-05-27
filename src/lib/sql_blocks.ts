
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';

// Define custom block types
const defineCustomBlocks = () => {
  // New: Block for a single table reference
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

  javascriptGenerator['sql_table_reference'] = function (block: Blockly.Block) {
    const tableName = block.getFieldValue('TABLE_NAME');
    // Return the table name, possibly quoted if your SQL dialect requires it for all identifiers
    // For simplicity, returning as is. Add quoting if needed: `\`${tableName}\`` or `"${tableName}"`
    return tableName;
  };

  // New: Block for a single column reference
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

  javascriptGenerator['sql_column_reference'] = function (block: Blockly.Block) {
    const columnName = block.getFieldValue('COLUMN_NAME');
    // Return the column name, possibly quoted.
    return columnName;
  };

  // Modified: sql_select clause
  Blockly.Blocks['sql_select'] = {
    init: function () {
      this.appendValueInput('COLUMNS')
        .setCheck('Array') // Expects a list of column references
        .appendField('SELECT');
      this.setPreviousStatement(true, 'SQL_SELECT_CLAUSE');
      this.setNextStatement(false); // A query has one SELECT clause part
      this.setColour(230);
      this.setTooltip('Defines the SELECT part of a SQL query. Connect a list of columns.');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator['sql_select'] = function (block: Blockly.Block) {
    const columnsListBlock = block.getInputTargetBlock('COLUMNS');
    let columnsStr = '*';
    if (columnsListBlock && columnsListBlock.type === 'lists_create_with') {
      const tempColumns = [];
      for (let i = 0; i < (columnsListBlock as any).itemCount_; i++) {
        const colCode = javascriptGenerator.valueToCode(columnsListBlock, 'ADD' + i, (javascriptGenerator as any).ORDER_ATOMIC);
        if (colCode) {
          tempColumns.push(colCode);
        }
      }
      if (tempColumns.length > 0) {
        columnsStr = tempColumns.join(', ');
      }
    } else {
      // Fallback if a single item (like a text block with comma-separated names) is connected
      const directInput = javascriptGenerator.valueToCode(block, 'COLUMNS', (javascriptGenerator as any).ORDER_ATOMIC);
      if (directInput) {
        columnsStr = directInput.replace(/^"|"$/g, ''); // Remove quotes if it's a string literal
      }
    }
    return `SELECT ${columnsStr}\n`;
  };

  // Modified: sql_from clause
  Blockly.Blocks['sql_from'] = {
    init: function () {
      this.appendValueInput('TABLES')
        .setCheck('Array') // Expects a list of table references
        .appendField('FROM');
      this.setPreviousStatement(true, 'SQL_FROM_CLAUSE');
      this.setNextStatement(false); // A query has one FROM clause part
      this.setColour(160);
      this.setTooltip('Defines the FROM part of a SQL query. Connect a list of tables.');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator['sql_from'] = function (block: Blockly.Block) {
    const tablesListBlock = block.getInputTargetBlock('TABLES');
    let tablesStr = 'your_table'; // Default
    if (tablesListBlock && tablesListBlock.type === 'lists_create_with') {
      const tempTables = [];
      for (let i = 0; i < (tablesListBlock as any).itemCount_; i++) {
        const tableCode = javascriptGenerator.valueToCode(tablesListBlock, 'ADD' + i, (javascriptGenerator as any).ORDER_ATOMIC);
        if (tableCode) {
          tempTables.push(tableCode);
        }
      }
      if (tempTables.length > 0) {
        tablesStr = tempTables.join(', ');
      }
    } else {
       // Fallback if a single item (like a text block with comma-separated names) is connected
      const directInput = javascriptGenerator.valueToCode(block, 'TABLES', (javascriptGenerator as any).ORDER_ATOMIC);
      if (directInput) {
        tablesStr = directInput.replace(/^"|"$/g, ''); // Remove quotes if it's a string literal
      }
    }
    return `FROM ${tablesStr}\n`;
  };

  // Modified: sql_where clause
  Blockly.Blocks['sql_where'] = {
    init: function () {
      this.appendValueInput('CONDITION')
        .setCheck('String') // Condition is still a string for now
        .appendField('WHERE');
      this.setPreviousStatement(true, 'SQL_WHERE_CLAUSE');
      this.setNextStatement(false); // A query has one WHERE clause part
      this.setColour(20);
      this.setTooltip('Defines the WHERE part of a SQL query.');
      this.setHelpUrl('');
    },
  };

  javascriptGenerator['sql_where'] = function (block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', (javascriptGenerator as any).ORDER_ATOMIC) || '1=1'; // Default to a valid condition
    return `WHERE ${condition}\n`;
  };
  
  // Modified: sql_query - main container block
  Blockly.Blocks['sql_query'] = {
    init: function () {
      this.appendStatementInput('SELECT_CLAUSE_INPUT')
        .setCheck('SQL_SELECT_CLAUSE') // Connects to sql_select
        .appendField('Build SQL Query:');
      this.appendStatementInput('FROM_CLAUSE_INPUT')
        .setCheck('SQL_FROM_CLAUSE') // Connects to sql_from
        .appendField('FROM');
      this.appendStatementInput('WHERE_CLAUSE_INPUT')
        .setCheck('SQL_WHERE_CLAUSE') // Connects to sql_where
        .appendField('WHERE (optional)');
      this.setColour(290);
      this.setTooltip('Main block for constructing a SQL query. Connect SELECT, FROM, and optionally WHERE clauses.');
      this.setHelpUrl('');
      // This block itself doesn't output a value, it's a container for statements that generate code.
      // If you wanted this block to be connectable (e.g. to a "run query" block), it would need an output.
      // For now, it's a top-level block.
    },
  };
  
  javascriptGenerator['sql_query'] = function (block: Blockly.Block) {
    const selectStatement = javascriptGenerator.statementToCode(block, 'SELECT_CLAUSE_INPUT');
    const fromStatement = javascriptGenerator.statementToCode(block, 'FROM_CLAUSE_INPUT');
    const whereStatement = javascriptGenerator.statementToCode(block, 'WHERE_CLAUSE_INPUT');
    
    let query = '';
    if (selectStatement) query += selectStatement;
    if (fromStatement) query += fromStatement;
    if (whereStatement) query += whereStatement;
    
    return query.trim();
  };
};

export default defineCustomBlocks;
