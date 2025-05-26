
import * as Blockly from 'blockly/core';

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

  // Generator for SQL
  Blockly.JavaScript['sql_select'] = function (block) {
    const columns = Blockly.JavaScript.valueToCode(block, 'COLUMNS', Blockly.JavaScript.ORDER_ATOMIC) || '*';
    return `SELECT ${columns}\n`;
  };

  Blockly.JavaScript['sql_from'] = function (block) {
    const table = Blockly.JavaScript.valueToCode(block, 'TABLE', Blockly.JavaScript.ORDER_ATOMIC) || 'your_table';
    return `FROM ${table}\n`;
  };

  Blockly.JavaScript['sql_where'] = function (block) {
    const condition = Blockly.JavaScript.valueToCode(block, 'CONDITION', Blockly.JavaScript.ORDER_ATOMIC) || 'your_condition';
    return `WHERE ${condition}\n`;
  };
  
  Blockly.JavaScript['sql_query'] = function (block) {
    const selectStatement = Blockly.JavaScript.statementToCode(block, 'SELECT');
    return selectStatement;
  };
};

export default defineCustomBlocks;

