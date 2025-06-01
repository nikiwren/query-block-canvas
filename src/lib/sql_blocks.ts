
import { defineSpecificColumnBlocks } from './blockly/column_blocks';
import { defineSqlColumnListBlock } from './blockly/sql_column_list_block';
import { defineSqlQueryBlock } from './blockly/sql_query_block';
import { defineLegacyBlocks } from './blockly/legacy_blocks';
import { defineEnhancedBlocks } from './blockly/enhanced_blocks';

// Main function to define all custom blocks
const defineCustomBlocks = () => {
  defineSpecificColumnBlocks();
  defineSqlColumnListBlock();
  defineSqlQueryBlock();
  defineLegacyBlocks();
  defineEnhancedBlocks();
};

export default defineCustomBlocks;
