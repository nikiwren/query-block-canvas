
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const defineSpecificColumnBlocks = () => {
  // For rtable1
  Blockly.Blocks['rcol11_block'] = {
    init: function () {
      this.appendDummyInput().appendField('rtable1.rcol11');
      this.setOutput(true, 'SpecificColumn');
      this.setColour(160);
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
      this.setColour(180);
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
};
