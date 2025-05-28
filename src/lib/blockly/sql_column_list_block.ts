
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';
import { ISqlColumnListBlock, IMutatorItemBlock } from './types';

export const defineSqlColumnListBlock = () => {
  Blockly.Blocks['sql_column_list'] = {
    init: function(this: ISqlColumnListBlock) {
      this.setHelpUrl(Blockly.Msg['LISTS_CREATE_WITH_HELPURL'] || '');
      this.setColour(260);
      this.itemCount_ = 2;
      this.updateShape_();
      this.setOutput(true, 'Array');
      this.setMutator(new Blockly.icons.MutatorIcon(['lists_create_with_item'], this));
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
    decompose: function(this: ISqlColumnListBlock, workspace: Blockly.WorkspaceSvg): Blockly.BlockSvg {
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
      return containerBlock as Blockly.BlockSvg;
    },
    compose: function(this: ISqlColumnListBlock, containerBlock: Blockly.Block) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      const connections: (Blockly.Connection | null)[] = [];
      while (itemBlock) {
        connections.push((itemBlock as IMutatorItemBlock).valueConnection_ ?? null);
        itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      }
      for (let i = 0; i < this.itemCount_; i++) {
        const connection = this.getInput('ADD' + i)?.connection?.targetConnection;
        if (connection && connections.indexOf(connection) === -1) {
          connection.disconnect();
        }
      }
      this.itemCount_ = connections.length;
      this.updateShape_();
      for (let i = 0; i < this.itemCount_; i++) {
        const connection = connections[i];
        if (connection) {
          const input = this.getInput('ADD' + i);
          if (input && input.connection) {
            input.connection.connect(connection);
          }
        }
      }
    },
    saveConnections: function(this: ISqlColumnListBlock, containerBlock: Blockly.Block) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      let i = 0;
      while (itemBlock) {
        const input = this.getInput('ADD' + i);
        if (input && itemBlock) {
            (itemBlock as IMutatorItemBlock).valueConnection_ = input.connection?.targetConnection;
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
      for (let i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          const input = this.appendValueInput('ADD' + i)
                            .setAlign(Blockly.inputs.Align.RIGHT);
          if (i === 0) {
            input.appendField('select columns');
          }
          input.setCheck('SpecificColumn');
        }
      }
      for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
        this.removeInput('ADD' + i);
      }
    }
  };

  if (javascriptGenerator.forBlock['lists_create_with']) {
    javascriptGenerator.forBlock['sql_column_list'] = javascriptGenerator.forBlock['lists_create_with'];
  } else {
    javascriptGenerator.forBlock['sql_column_list'] = (block: Blockly.Block) => {
      const sqlListBlock = block as ISqlColumnListBlock;
      const elements = new Array(sqlListBlock.itemCount_);
      for (let i = 0; i < sqlListBlock.itemCount_; i++) {
        elements[i] = javascriptGenerator.valueToCode(sqlListBlock, 'ADD' + i, Order.NONE) || 'null';
      }
      const code = '[' + elements.join(', ') + ']';
      return [code, Order.ATOMIC];
    };
  }
};
