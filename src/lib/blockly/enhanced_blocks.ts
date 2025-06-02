
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const defineEnhancedBlocks = () => {
  // Dynamic column block - should be stackable
  Blockly.Blocks['dynamic_column'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput('column'), 'COLUMN_NAME');
      this.setOutput(true, 'Column');
      this.setPreviousStatement(true, 'Column');
      this.setNextStatement(true, 'Column');
      this.setColour(160);
      this.setTooltip('A selected column from the tree view.');
      this.setHelpUrl('');
      this.setMovable(true);
      this.setDeletable(true);
    },
    
    setColumnInfo: function(columnName: string, tableName: string) {
      this.setFieldValue(columnName, 'COLUMN_NAME');
      this.tableName_ = tableName;
      this.columnName_ = columnName;
    }
  };

  javascriptGenerator.forBlock['dynamic_column'] = function (block: any, generator: any) {
    const columnName = block.getFieldValue('COLUMN_NAME');
    const tableName = block.tableName_ || 'unknown_table';
    const data = { column: columnName, table: tableName };
    return [JSON.stringify(data), Order.ATOMIC];
  };

  // Column list for SELECT - should accept stackable columns
  Blockly.Blocks['select_columns'] = {
    init: function() {
      this.appendStatementInput('COLUMNS')
        .setCheck('Column')
        .appendField('SELECT');
      this.setOutput(true, 'SelectStatement');
      this.setColour(290);
      this.setTooltip('Select columns for the SQL query.');
      this.setHelpUrl('');
    }
  };

  javascriptGenerator.forBlock['select_columns'] = function (block: Blockly.Block, generator: any) {
    const columns: string[] = [];
    const tables = new Set<string>();
    
    let currentBlock = block.getInputTargetBlock('COLUMNS');
    while (currentBlock) {
      if (currentBlock.type === 'dynamic_column') {
        const columnName = currentBlock.getFieldValue('COLUMN_NAME');
        const tableName = (currentBlock as any).tableName_ || 'unknown_table';
        columns.push(`${tableName}.${columnName}`);
        tables.add(tableName);
      }
      currentBlock = currentBlock.getNextBlock();
    }

    const result = {
      columns: columns.length > 0 ? columns.join(', ') : '*',
      tables: Array.from(tables)
    };
    
    return [JSON.stringify(result), Order.ATOMIC];
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
    let columnInfo;
    try {
      columnInfo = JSON.parse(column);
    } catch (e) {
      columnInfo = { column: column, table: 'unknown' };
    }
    
    const result = {
      column: `COUNT(${columnInfo.table}.${columnInfo.column})`,
      table: columnInfo.table
    };
    return [JSON.stringify(result), Order.ATOMIC];
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
    let columnInfo;
    try {
      columnInfo = JSON.parse(column);
    } catch (e) {
      columnInfo = { column: column, table: 'unknown' };
    }
    
    const result = {
      column: `SUM(${columnInfo.table}.${columnInfo.column})`,
      table: columnInfo.table
    };
    return [JSON.stringify(result), Order.ATOMIC];
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
    let columnInfo;
    try {
      columnInfo = JSON.parse(column);
      return `GROUP BY ${columnInfo.table}.${columnInfo.column}`;
    } catch (e) {
      return 'GROUP BY ' + column;
    }
  };

  // Enhanced SQL Query block - should accept SELECT statements
  Blockly.Blocks['enhanced_sql_query'] = {
    init: function() {
      this.appendValueInput('SELECT')
        .setCheck('SelectStatement')
        .appendField('SQL Query - SELECT');
      this.appendStatementInput('STATEMENTS')
        .setCheck('Statement')
        .appendField('Additional clauses:');
      this.appendValueInput('WHERE')
        .setCheck(['Boolean', 'String'])
        .appendField('WHERE (optional)');
      this.setOutput(true, 'String');
      this.setColour(290);
      this.setTooltip('Enhanced SQL query builder with auto-joins.');
      this.setHelpUrl('');
    }
  };

  javascriptGenerator.forBlock['enhanced_sql_query'] = function (block: Blockly.Block, generator: any) {
    const allTables = new Set<string>();
    const selectColumns: string[] = [];
    const groupByColumns: string[] = [];

    // Process SELECT input
    const selectCode = generator.valueToCode(block, 'SELECT', Order.NONE);
    let selectFound = false;
    
    if (selectCode) {
      try {
        const selectResult = JSON.parse(selectCode);
        if (selectResult.tables) {
          selectResult.tables.forEach((table: string) => allTables.add(table));
          selectColumns.push(selectResult.columns);
          selectFound = true;
        }
      } catch (e) {
        console.log('Error parsing select result:', e);
      }
    }

    // Process additional statement blocks (GROUP BY, etc.)
    let currentBlock = block.getInputTargetBlock('STATEMENTS');
    while (currentBlock) {
      if (currentBlock.type === 'group_by') {
        const groupByResult = generator.blockToCode(currentBlock);
        if (typeof groupByResult === 'string') {
          groupByColumns.push(groupByResult.replace('GROUP BY ', ''));
        }
      }
      currentBlock = currentBlock.getNextBlock();
    }

    if (!selectFound || allTables.size === 0) {
      return ['-- Please connect a SELECT block with columns from the tree view', Order.ATOMIC];
    }

    // Generate FROM clause with auto-joins
    const tables = Array.from(allTables);
    let fromClause = tables[0];
    let joinClauses: string[] = [];

    // Auto-generate joins based on predefined relationships
    const joinRules = {
      'rtable1-ttable1': 'rtable1.rcol11 = ttable1.tcol12'
    };

    for (let i = 1; i < tables.length; i++) {
      const joinKey = `${tables[0]}-${tables[i]}`;
      const reverseJoinKey = `${tables[i]}-${tables[0]}`;
      
      if (joinRules[joinKey as keyof typeof joinRules]) {
        joinClauses.push(`INNER JOIN ${tables[i]} ON ${joinRules[joinKey as keyof typeof joinRules]}`);
      } else if (joinRules[reverseJoinKey as keyof typeof joinRules]) {
        joinClauses.push(`INNER JOIN ${tables[i]} ON ${joinRules[reverseJoinKey as keyof typeof joinRules]}`);
      } else {
        joinClauses.push(`INNER JOIN ${tables[i]} ON ${tables[0]}.id = ${tables[i]}.id`);
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
      let conditionStr = whereCondition;
      if ((whereCondition.startsWith("'") && whereCondition.endsWith("'")) || 
          (whereCondition.startsWith('"') && whereCondition.endsWith('"'))) {
        conditionStr = whereCondition.substring(1, whereCondition.length - 1);
      }
      query += `\nWHERE ${conditionStr}`;
    }

    // Add GROUP BY if specified
    if (groupByColumns.length > 0) {
      query += `\nGROUP BY ${groupByColumns.join(', ')}`;
    }

    return [query, Order.ATOMIC];
  };
};
