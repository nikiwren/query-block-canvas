
import * as Blockly from 'blockly/core';

// Define interfaces for custom block properties and methods
export interface ISqlColumnListBlock extends Blockly.BlockSvg {
  itemCount_: number;
  updateShape_: () => void;
  mutationToDom: () => Element;
  domToMutation: (xmlElement: Element) => void;
  // Changed return type from Blockly.Block to Blockly.BlockSvg
  decompose: (workspace: Blockly.WorkspaceSvg) => Blockly.BlockSvg; 
  compose: (containerBlock: Blockly.Block) => void;
  saveConnections: (containerBlock: Blockly.Block) => void;
}

export interface IMutatorItemBlock extends Blockly.Block {
  valueConnection_?: Blockly.Connection | null;
}

