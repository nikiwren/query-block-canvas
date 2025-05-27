
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const defineSqlQueryBlock = () => {
  Blockly.Blocks['sql_query'] = {
    init: function () {
      this.appendValueInput('COLUMNS')
        .setCheck('Array')
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
          if (colValue.startsWith('[') && colValue.endsWith(']')) {
            try {
              const arr = JSON.parse(colValue);
              if (Array.isArray(arr)) {
                arr.forEach(itemStr => {
                  if (typeof itemStr === 'string') {
                    try {
                      const itemParsed = JSON.parse(itemStr);
                       if (typeof itemParsed === 'object' && itemParsed !== null && 'column' in itemParsed && 'table' in itemParsed) {
                        uniqueColumns.add(String(itemParsed.column));
                        uniqueTables.add(String(itemParsed.table));
                      }
                    } catch (itemParseError) {
                      if (itemStr.trim() !== '') uniqueColumns.add(itemStr);
                    }
                  }
                });
                processedAsJson = true;
              }
            } catch (arrayParseError) {
              // Not a valid JSON array
            }
          }
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

    const columnsInputValue = javascriptGenerator.valueToCode(block, 'COLUMNS', Order.NONE);
    processColumnInput(columnsInputValue);

    let columnsStr = uniqueColumns.size > 0 ? Array.from(uniqueColumns).join(', ') : '*';
    
    if (uniqueTables.size === 0 && columnsStr !== '*' && columnsInputValue && columnsInputValue !== 'null' && columnsInputValue.trim() !== '') {
        return [`-- ERROR: No tables could be derived. Ensure you use column blocks (e.g., rtable1.rcol11) within the "select columns" block.\nSELECT ${columnsStr}\nFROM ... (table unknown)`, Order.ATOMIC];
    }
    if (uniqueTables.size === 0 && columnsStr === '*') {
         return [`-- Use "select columns" block for SELECT. Drag column blocks (e.g., rtable1.rcol11) into it.\n-- Tables are added to FROM automatically.`, Order.ATOMIC];
    }
    if (uniqueTables.size === 0 && (!columnsInputValue || columnsInputValue === 'null' || columnsInputValue.trim() === '')) {
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
};
