
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript'; // Import the generator

// Define custom block types
const defineCustomBlocks = () => {
  Blockly.Blocks['sql_select'] = {
    init: function () {
      this.appendValueInput('COLUMNS')
        .setCheck('String')
        .appendField('SELECT');
      this.setPreviousStatement(true, 'SELECT_STATEMENT');
      this.setNextStatement(true, 'FROM_STATEMENT');
      this.setColour(230);
      this.setTooltip('Defines the SELECT part of a SQL query.');
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['sql_from'] = {
    init: function () {
      this.appendValueInput('TABLE')
        .setCheck('String')
        .appendField('FROM');
      this.setPreviousStatement(true, 'FROM_STATEMENT');
      this.setNextStatement(true, 'WHERE_STATEMENT');
      this.setColour(160);
      this.setTooltip('Defines the FROM part of a SQL query.');
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['sql_where'] = {
    init: function () {
      this.appendValueInput('CONDITION')
        .setCheck('String')
        .appendField('WHERE');
      this.setPreviousStatement(true, 'WHERE_STATEMENT');
      this.setNextStatement(true, null); // Can be extended for GROUP BY, ORDER BY etc.
      this.setColour(20);
      this.setTooltip('Defines the WHERE part of a SQL query.');
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['sql_query'] = {
    init: function () {
      this.appendStatementInput('SELECT')
        .setCheck('SELECT_STATEMENT')
        .appendField('SQL Query');
      this.setColour(290);
      this.setTooltip('Main block for constructing a SQL query.');
      this.setHelpUrl('');
    },
  };

  // Generator for SQL using the imported javascriptGenerator
  javascriptGenerator['sql_select'] = function (block: Blockly.Block) {
    const columns = javascriptGenerator.valueToCode(block, 'COLUMNS', (javascriptGenerator as any).ORDER_ATOMIC) || '*';
    return `SELECT ${columns}\n`;
  };

  javascriptGenerator['sql_from'] = function (block: Blockly.Block) {
    const table = javascriptGenerator.valueToCode(block, 'TABLE', (javascriptGenerator as any).ORDER_ATOMIC) || 'your_table';
    return `FROM ${table}\n`;
  };

  javascriptGenerator['sql_where'] = function (block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', (javascriptGenerator as any).ORDER_ATOMIC) || 'your_condition';
    return `WHERE ${condition}\n`;
  };
  
  javascriptGenerator['sql_query'] = function (block: Blockly.Block) {
    const selectStatement = javascriptGenerator.statementToCode(block, 'SELECT');
    return selectStatement;
  };
};

export default defineCustomBlocks;

