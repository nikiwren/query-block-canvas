
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
    init: function() {
      this.setHelpUrl(Blockly.Msg['LISTS_CREATE_WITH_HELPURL'] || '');
      this.setColour(260); // Standard list color
      this.itemCount_ = 2; // Default number of item inputs
      this.updateShape_();
      this.setOutput(true, 'Array'); // Outputs an array, compatible with sql_query's SELECT input
      this.setMutator(new Blockly.Mutator(['lists_create_with_item'])); // Reuses standard list mutator item
      this.setTooltip(Blockly.Msg['LISTS_CREATE_WITH_TOOLTIP'] || 'Create a list of columns.');
    },
    mutationToDom: function() {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('items', String(this.itemCount_));
      return container;
    },
    domToMutation: function(xmlElement) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items') || '0', 10);
      this.updateShape_();
    },
    decompose: function(workspace: Blockly.WorkspaceSvg) {
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
    compose: function(containerBlock) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      const connections: (Blockly.Connection | null)[] = [];
      while (itemBlock) {
        connections.push(itemBlock.valueConnection_);
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
        Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
      }
    },
    saveConnections: function(containerBlock) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      let i = 0;
      while (itemBlock) {
        const input = this.getInput('ADD' + i);
        if (input && itemBlock) {
            (itemBlock as any).valueConnection_ = input.connection?.targetConnection;
        }
        i++;
        itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      }
    },
    updateShape_: function() {
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
            input.appendField('select columns'); // Specific label for this list
          }
          input.setCheck('SpecificColumn'); // Crucially, only accept 'SpecificColumn'
        }
      }
      for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
        this.removeInput('ADD' + i);
      }
    }
  };

  // The generator for sql_column_list can be the same as for lists_create_with
  if (javascriptGenerator.forBlock['lists_create_with']) {
    javascriptGenerator.forBlock['sql_column_list'] = javascriptGenerator.forBlock['lists_create_with'];
  } else {
    // Fallback generator if lists_create_with generator is not found (should not happen with standard Blockly)
    javascriptGenerator.forBlock['sql_column_list'] = (block: Blockly.Block) => {
      const elements = new Array(block.itemCount_);
      for (let i = 0; i < block.itemCount_; i++) {
        elements[i] = javascriptGenerator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
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
          const parsed = JSON.parse(colValue);
          if (typeof parsed === 'object' && parsed !== null && 'column' in parsed && 'table' in parsed) {
            uniqueColumns.add(String(parsed.column));
            uniqueTables.add(String(parsed.table));
            processedAsJson = true;
          }
        } catch (e) {
          // Not a JSON object
        }

        if (!processedAsJson) {
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
    // Updated to check for 'sql_column_list' or 'lists_create_with' (as a fallback/general list)
    if (columnsListBlock && (columnsListBlock.type === 'sql_column_list' || columnsListBlock.type === 'lists_create_with')) {
      for (let i = 0; i < (columnsListBlock as any).itemCount_; i++) {
        const colValue = javascriptGenerator.valueToCode(columnsListBlock, 'ADD' + i, Order.NONE);
        processColumnInput(colValue);
      }
    } else {
      const directColumnValue = javascriptGenerator.valueToCode(block, 'COLUMNS', Order.NONE);
      processColumnInput(directColumnValue);
    }

    let columnsStr = uniqueColumns.size > 0 ? Array.from(uniqueColumns).join(', ') : '*';
    
    if (uniqueTables.size === 0 && columnsStr !== '*') {
        return [`-- ERROR: No tables could be derived. Use column blocks from 'Table: ...' categories with "select columns" block.\nSELECT ${columnsStr}\nFROM ...`, Order.ATOMIC];
    }
    if (uniqueTables.size === 0 && columnsStr === '*') {
         return [`-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.`, Order.ATOMIC];
    }


    let tablesStr = Array.from(uniqueTables).join(', ');

    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || '';
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

