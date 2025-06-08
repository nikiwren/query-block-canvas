
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const defineEnhancedBlocks = () => {
  // Dynamic column block - should be stackable
  Blockly.Blocks['dynamic_column'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput('column'), 'COLUMN_NAME');
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput('table'), 'TABLE_NAME');
      this.setOutput(true, 'Column');
      this.setPreviousStatement(true, 'Column');
      this.setNextStatement(true, 'Column');
      this.setColour(160);
      this.setTooltip('A selected column from the tree view.');
      this.setHelpUrl('');
      this.setMovable(true);
      this.setDeletable(true);
      
      // Override the default onchange to set table info when fields change
      this.setOnChange(function(changeEvent: any) {
        if (changeEvent.type === Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE || 
            changeEvent.type === Blockly.Events.BLOCK_CHANGE) {
          const tableName = this.getFieldValue('TABLE_NAME');
          const columnName = this.getFieldValue('COLUMN_NAME');
          if (tableName && columnName) {
            this.tableName_ = tableName;
            this.columnName_ = columnName;
          }
        }
      });
    },
    
    setColumnInfo: function(columnName: string, tableName: string) {
      this.setFieldValue(columnName, 'COLUMN_NAME');
      this.setFieldValue(tableName, 'TABLE_NAME');
      this.tableName_ = tableName;
      this.columnName_ = columnName;
    }
  };

  javascriptGenerator.forBlock['dynamic_column'] = function (block: any, generator: any) {
    const columnName = block.getFieldValue('COLUMN_NAME');
    const tableName = block.getFieldValue('TABLE_NAME') || block.tableName_ || 'unknown_table';
    // Return the formatted column reference for SQL
    return [`${tableName}.${columnName}`, Order.ATOMIC];
  };

  // Override the default logic_compare block to handle dynamic columns properly
  javascriptGenerator.forBlock['logic_compare'] = function (block: Blockly.Block, generator: any) {
    const OPERATORS = {
      'EQ': '==',
      'NEQ': '!=',
      'LT': '<',
      'LTE': '<=',
      'GT': '>',
      'GTE': '>='
    };
    
    const operator = OPERATORS[block.getFieldValue('OP') as keyof typeof OPERATORS] || '==';
    const order = operator === '==' || operator === '!=' ? Order.EQUALITY : Order.RELATIONAL;
    
    let argument0 = generator.valueToCode(block, 'A', order) || 'null';
    let argument1 = generator.valueToCode(block, 'B', order) || 'null';
    
    // Clean up the arguments if they are from dynamic_column blocks
    // Remove quotes if they exist and extract table.column format
    [argument0, argument1].forEach((arg, index) => {
      const cleanArg = arg.replace(/['"]/g, '');
      if (index === 0) {
        argument0 = cleanArg;
      } else {
        argument1 = cleanArg;
      }
    });
    
    const code = `${argument0} ${operator} ${argument1}`;
    return [code, order];
  };

  // Aggregation blocks - should also be stackable
  Blockly.Blocks['count_function'] = {
    init: function() {
      this.appendValueInput('COLUMN')
        .setCheck('Column')
        .appendField('COUNT(');
      this.appendDummyInput()
        .appendField(')');
      this.setOutput(true, 'Column');
      this.setPreviousStatement(true, 'Column');
      this.setNextStatement(true, 'Column');
      this.setColour(230);
      this.setTooltip('Count function for aggregation.');
      this.setHelpUrl('');
    }
  };

  javascriptGenerator.forBlock['count_function'] = function (block: Blockly.Block, generator: any) {
    const column = generator.valueToCode(block, 'COLUMN', Order.NONE) || '*';
    return [`COUNT(${column})`, Order.ATOMIC];
  };

  Blockly.Blocks['sum_function'] = {
    init: function() {
      this.appendValueInput('COLUMN')
        .setCheck('Column')
        .appendField('SUM(');
      this.appendDummyInput()
        .appendField(')');
      this.setOutput(true, 'Column');
      this.setPreviousStatement(true, 'Column');
      this.setNextStatement(true, 'Column');
      this.setColour(230);
      this.setTooltip('Sum function for aggregation.');
      this.setHelpUrl('');
    }
  };

  javascriptGenerator.forBlock['sum_function'] = function (block: Blockly.Block, generator: any) {
    const column = generator.valueToCode(block, 'COLUMN', Order.NONE) || '*';
    return [`SUM(${column})`, Order.ATOMIC];
  };

  Blockly.Blocks['group_by'] = {
    init: function() {
      this.appendValueInput('COLUMN')
        .setCheck('Column')
        .appendField('GROUP BY');
      this.setPreviousStatement(true, 'Statement');
      this.setNextStatement(true, 'Statement');
      this.setColour(200);
      this.setTooltip('Group by clause.');
      this.setHelpUrl('');
    }
  };

  javascriptGenerator.forBlock['group_by'] = function (block: Blockly.Block, generator: any) {
    const column = generator.valueToCode(block, 'COLUMN', Order.NONE) || '';
    return `GROUP BY ${column}`;
  };

  // Enhanced SQL Query block - now validates table relationships with expanded join rules
  Blockly.Blocks['enhanced_sql_query'] = {
    init: function() {
      this.appendStatementInput('SELECT_COLUMNS')
        .setCheck('Column')
        .appendField('SQL Query - SELECT');
      this.appendStatementInput('STATEMENTS')
        .setCheck('Statement')
        .appendField('Additional clauses:');
      this.appendValueInput('WHERE')
        .setCheck(['Boolean', 'String'])
        .appendField('WHERE (optional)');
      this.setOutput(true, 'String');
      this.setColour(290);
      this.setTooltip('Enhanced SQL query builder with auto-joins. Connect column blocks to SELECT.');
      this.setHelpUrl('');
    }
  };

  javascriptGenerator.forBlock['enhanced_sql_query'] = function (block: Blockly.Block, generator: any) {
    const allTables = new Set<string>();
    const selectColumns: string[] = [];
    const groupByColumns: string[] = [];

    // Process SELECT columns from statement input
    let currentBlock = block.getInputTargetBlock('SELECT_COLUMNS');
    while (currentBlock) {
      if (currentBlock.type === 'dynamic_column') {
        const columnName = currentBlock.getFieldValue('COLUMN_NAME');
        const tableName = (currentBlock as any).tableName_ || 'unknown_table';
        selectColumns.push(`${tableName}.${columnName}`);
        allTables.add(tableName);
      } else if (currentBlock.type === 'count_function' || currentBlock.type === 'sum_function') {
        // Handle aggregation functions
        const functionResult = generator.blockToCode(currentBlock);
        if (Array.isArray(functionResult) && functionResult.length > 0) {
          selectColumns.push(functionResult[0]);
          // Extract table name from the aggregation function if possible
          const tableMatch = functionResult[0].match(/\w+\./);
          if (tableMatch) {
            allTables.add(tableMatch[0].slice(0, -1));
          }
        } else if (typeof functionResult === 'string') {
          selectColumns.push(functionResult);
        }
      }
      currentBlock = currentBlock.getNextBlock();
    }

    // Process additional statement blocks (GROUP BY, etc.)
    currentBlock = block.getInputTargetBlock('STATEMENTS');
    while (currentBlock) {
      if (currentBlock.type === 'group_by') {
        const groupByResult = generator.blockToCode(currentBlock);
        if (typeof groupByResult === 'string') {
          groupByColumns.push(groupByResult.replace('GROUP BY ', ''));
        }
      }
      currentBlock = currentBlock.getNextBlock();
    }

    if (selectColumns.length === 0 || allTables.size === 0) {
      return ['-- Please connect column blocks to SELECT', Order.ATOMIC];
    }

    // Enhanced join rules with all specified relationships
    const tables = Array.from(allTables);
    const validJoinRules = {
      'rtable1-ttable1': 'rtable1.rcol11 = ttable1.tcol12',
      'rtable1-rtable2': 'rtable1.rcol11 = rtable2.rcol21',
      'rtable1-ttable2': 'rtable1.rcol12 = ttable2.tcol22',
      'rtable2-ttable1': 'rtable2.rcol22 = ttable1.tcol12',
      'rtable2-ttable2': 'rtable2.rcol21 = ttable2.tcol21'
    };

    // Check if we have more than one table and validate all relationships
    if (tables.length > 1) {
      const missingJoins: string[] = [];
      
      // Check if all pairs of tables have valid join rules
      for (let i = 0; i < tables.length; i++) {
        for (let j = i + 1; j < tables.length; j++) {
          const joinKey1 = `${tables[i]}-${tables[j]}`;
          const joinKey2 = `${tables[j]}-${tables[i]}`;
          
          if (!validJoinRules[joinKey1 as keyof typeof validJoinRules] && 
              !validJoinRules[joinKey2 as keyof typeof validJoinRules]) {
            missingJoins.push(`${tables[i]} and ${tables[j]}`);
          }
        }
      }

      // If any joins are missing, trigger an error alert
      if (missingJoins.length > 0) {
        // Trigger a custom event to show the alert dialog
        setTimeout(() => {
          const event = new CustomEvent('showJoinError', {
            detail: { missingJoins: missingJoins }
          });
          window.dispatchEvent(event);
        }, 100);
        
        return [`-- ERROR: Join not defined between tables: ${missingJoins.join(', ')}. Please reach out to dev for support.`, Order.ATOMIC];
      }
    }

    // Generate FROM clause with auto-joins
    let fromClause = tables[0];
    let joinClauses: string[] = [];

    // Auto-generate joins based on predefined relationships
    for (let i = 1; i < tables.length; i++) {
      const joinKey = `${tables[0]}-${tables[i]}`;
      const reverseJoinKey = `${tables[i]}-${tables[0]}`;
      
      if (validJoinRules[joinKey as keyof typeof validJoinRules]) {
        joinClauses.push(`INNER JOIN ${tables[i]} ON ${validJoinRules[joinKey as keyof typeof validJoinRules]}`);
      } else if (validJoinRules[reverseJoinKey as keyof typeof validJoinRules]) {
        joinClauses.push(`INNER JOIN ${tables[i]} ON ${validJoinRules[reverseJoinKey as keyof typeof validJoinRules]}`);
      }
    }

    // Build the complete query
    let query = `SELECT ${selectColumns.join(', ')}\nFROM ${fromClause}`;
    
    if (joinClauses.length > 0) {
      query += '\n' + joinClauses.join('\n');
    }

    // Add WHERE clause if specified
    const whereCondition = generator.valueToCode(block, 'WHERE', Order.NONE);
    if (whereCondition && whereCondition.trim() && whereCondition !== 'null') {
      query += `\nWHERE ${whereCondition}`;
    }

    // Add GROUP BY if specified
    if (groupByColumns.length > 0) {
      query += `\nGROUP BY ${groupByColumns.join(', ')}`;
    }

    return [query, Order.ATOMIC];
  };
};
