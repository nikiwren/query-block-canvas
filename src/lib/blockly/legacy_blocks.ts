
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const defineLegacyBlocks = () => {
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
