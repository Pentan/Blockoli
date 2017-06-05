/******
rules and visualize commands are converted as below.

LSystem.rules.SYMBOL=function(age){return"(rule codes)";}; // <- your codes is put inside ""
LSystem.visualizers.SYMBOL=function(age){return 0 + (visualize codes);}; // <- your codes is bare

******/

//console.log("language.js loaded");

if(!Blockly.Language) {
	Blockly.Language = {};
}
if(!Blockly.JavaScript) {
	Blockly.JavaScript = Blockly.Generator.get('JavaScript');
}

///// 
var LTypes = {
	'rule': "l_rule",
	'define': "l_define",
	'visual': "l_visual"
};

var LColors = {
	'lsystem': 60,
	'transform': 70,
	'visualize': 80
};

var LCodeEditor = {
	'symbolNameList': [], // symbol string list for drop down
	'symbolDefs': [], // def block list
	
	'updateSymbolNameList': function () {
		LCodeEditor.symbolNameList = [];
		for(var i = 0; i < LCodeEditor.symbolDefs.length; i++) {
			var smbl = LCodeEditor.symbolDefs[i].currentSymbol;
			if(smbl) {
				LCodeEditor.symbolNameList.push([smbl, smbl]);
			}
		}
		// sort?
	},
	'findDefBySymbol': function (s, ignoreblock) {
		for(var i = 0; i < LCodeEditor.symbolDefs.length; i++) {
			var tmpdef = LCodeEditor.symbolDefs[i];
			if(tmpdef.currentSymbol == s && (tmpdef != ignoreblock)) {
				return tmpdef;
			}
		}
		return null;
	},
	'rebuildSymbolDataBase': function (workspace) {
		var tmprefs = [];
		LCodeEditor.symbolDefs = [];
		var topblocks = workspace.getTopBlocks();
		for(var i = 0; i < topblocks.length; i++) {
			LCodeEditor.findSymbolBlocks_(topblocks[i], tmprefs);
		}
		// setup def<->ref relations
		for(var refblock, i = 0; refblock = tmprefs[i]; i++) {
			var tmpdef = LCodeEditor.findDefBySymbol(refblock.getSymbolText(), null);
			tmpdef.referers.push(refblock);
			refblock.currentDef = tmpdef;
		}
		LCodeEditor.updateSymbolNameList();
	},
	'findSymbolBlocks_': function (block, reflist) {
		// store defs and refs
		//console.log(block.type);
		switch(block.type) {
			case 'lsystem_symbol_def':
				block.referers = [];
				LCodeEditor.symbolDefs.push(block);
				break;
			case 'lsystem_symbol_ref':
			case 'lsystem_symbol_ref_with_age':
				reflist.currentDef = null;
				reflist.push(block);
				break;
		}
		var childs = block.getChildren();
		for(var i = 0; i < childs.length; i++) {
			LCodeEditor.findSymbolBlocks_(childs[i], reflist);
		}
	},
	// utils
	'removeFromArray': function (ary, x) {
		if(!ary) return;
		var rmcount = 0;
		for(var i = 0; i < ary.length; i++) {
			if(ary[i] == x) {
				rmcount++;
			}
			else if(rmcount > 0) {
				ary[i - rmcount] = ary[i];
			}
		}
		if(rmcount > 0) {
			ary.splice(ary.length - rmcount, rmcount);
		}
	}
};

// LSystem
Blockly.Language.lsystem_init = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('LSystem');
		var input;
		// steps
		input = this.appendInput(Blockly.DUMMY_INPUT, "");
		input.appendTitle("steps");
		input.appendTitle(new Blockly.FieldTextInput('1', function (intxt) {
			// chech integer number
			var n = window.parseInt(intxt || '0');
			return window.isNaN(n)? '0' : String(n);
		}), 'STEPS');
		// rules
		input = this.appendInput(Blockly.NEXT_STATEMENT, 'INIT_STATE', LTypes.rule);
		input.appendTitle("init");
		// block settings
		this.setPreviousStatement(true, LTypes.define);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_init = function() {
	var initjs = Blockly.JavaScript.statementToCode(this, 'INIT_STATE');
	var stepjs = this.getTitleValue('STEPS') || '0';
	var ret;
	ret  = "var age=-1; LSystem.init(\"" + initjs + "\", " + stepjs + ");\n";
	return ret;
};

Blockly.Language.lsystem_symbol_def = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('Symbol');
		var thisblock = this;
		var input;
		// symbol name input
		input = this.appendInput(Blockly.DUMMY_INPUT, "");
		input.appendTitle(new Blockly.FieldTextInput('A', function (intxt) {
			//  on Tool box panel
			if(thisblock.workspace.editable == false){
				return intxt;
			}
			// letter check
			var lettertest = intxt.match(/^[A-Za-z]\w*/);
			if(!lettertest || lettertest[0] != intxt) {
				return thisblock.currentSymbol;
			}
			
			// check symbol doubles
			// 'A' is a default letter
			if(intxt == 'A') {
				var Acode = 'A'.charCodeAt(0);
				var Zcode = 'Z'.charCodeAt(0);
				for(var i = Acode; i <= Zcode; i++) {
					var tmpname = String.fromCharCode(i);
					if(!LCodeEditor.findDefBySymbol(tmpname, thisblock)) {
						intxt = tmpname;
						break;
					}
				}
			}
			var isdup = (LCodeEditor.findDefBySymbol(intxt, thisblock) != null);
			if(isdup) {
				for(var i = 0; i < 1000; i++) {
					var tmpname = intxt + '_' + i;
					if(!LCodeEditor.findDefBySymbol(tmpname, thisblock)) {
						intxt = tmpname;
						break;
					}
				}
				intxt = tmpname;
			}
			// rename
			if(thisblock.currentSymbol) {
				if(thisblock.currentSymbol != intxt) {
					for(var i = 0; i < thisblock.referers.length; i++) {
						thisblock.referers[i].setSymbolText(intxt);
					}
				}
			}
			thisblock.currentSymbol = intxt;
			LCodeEditor.updateSymbolNameList();
			
			return intxt;
		}), 'NAME');
		input = this.appendInput(Blockly.NEXT_STATEMENT, 'RULES', LTypes.rule);
		input.appendTitle("Rule");
		input = this.appendInput(Blockly.NEXT_STATEMENT, 'VISUALS', LTypes.visual);
		input.appendTitle("Visual");
		this.setPreviousStatement(true, LTypes.define);
		this.setNextStatement(true, LTypes.define);
		this.setTooltip('Description');
		
		if(this.workspace.editable) {
			LCodeEditor.symbolDefs.push(this);
			this.referers = [];
			LCodeEditor.updateSymbolNameList();
			
			this.destroy = function (gentle, animate) {
				LCodeEditor.removeFromArray(LCodeEditor.symbolDefs, thisblock);
				LCodeEditor.updateSymbolNameList();
				Blockly.Block.prototype.destroy.call(this, gentle, animate);
			};
		}
		//console.log("workspace.editable=" + this.workspace.editable);
	}
};
Blockly.JavaScript.lsystem_symbol_def = function() {
	var symboljs = this.getTitleValue('NAME');
	var rulejs = Blockly.JavaScript.statementToCode(this, 'RULES');
	var visjs = Blockly.JavaScript.statementToCode(this, 'VISUALS') || '+0';
	var ret = "";
	ret += "LSystem.rules." + symboljs + "=function(age){return\"" + rulejs + "\";};\n";
	ret += "LSystem.visualizers." + symboljs + "=function(age){return 0" + visjs + ";};\n";
	return ret;
};

Blockly.Language.lsystem_symbol_ref = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		var thisblock = this;
		this.setColour(LColors.lsystem);
		this.appendTitle('Symbol');
		var dropdown = new Blockly.FieldDropdown(
			function () {
				var symbllist = LCodeEditor.symbolNameList;
				if(symbllist.length > 0) {
					if(thisblock.workspace.editable && !thisblock.currentDef) {
						var tmpdef = LCodeEditor.findDefBySymbol(symbllist[0][0], null);
						tmpdef.referers.push(thisblock);
						thisblock.currentDef = tmpdef;
					}
					return symbllist;
				}
				else {
					return [['Symbol', 'DEFAULT']];
				}
			},
			function (intxt) {
				var tmpdef = LCodeEditor.findDefBySymbol(intxt, null);
				if(tmpdef) {
					if(thisblock.currentDef) {
						LCodeEditor.removeFromArray(thisblock.currentDef.referers, thisblock);
					}
					tmpdef.referers.push(thisblock);
					thisblock.currentDef = tmpdef;
					thisblock.setSymbolText(intxt);
				}
			}
		);
		//this.symbolDropDown = dropdown;
		this.appendTitle(dropdown, 'SYMBOL');
		this.setPreviousStatement(true, LTypes.rule);
		this.setNextStatement(true, LTypes.rule);
		this.setTooltip('Description');
		
		// for symbole manipulate
		this.setSymbolText = function (txt) {
			thisblock.setTitleValue(txt, 'SYMBOL');
		};
		this.getSymbolText = function () {
			return thisblock.getTitleValue('SYMBOL');
		};
		
		this.destroy = function (gentle, animate) {
			if(thisblock.currentDef) {
				LCodeEditor.removeFromArray(thisblock.currentDef.referers, thisblock);
			}
			Blockly.Block.prototype.destroy.call(this, gentle, animate);
		};
	}
};
Blockly.JavaScript.lsystem_symbol_ref = function() {
	var symbol = this.getTitleValue('SYMBOL');
	return "+" + symbol + "(\"+(age+1)+\")";
};

Blockly.Language.lsystem_symbol_ref_with_age = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		Blockly.Language.lsystem_symbol_ref.init.call(this);
		var input = this.appendInput(Blockly.INPUT_VALUE, 'AGE', Number);
		input.appendTitle("Age");
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_symbol_ref_with_age = function() {
	var symbol = this.getTitleValue('SYMBOL');
	var agejs = Blockly.JavaScript.valueToCode(this, 'AGE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
	return "+" + symbol + "(\"+" + agejs + "+\")";
};

Blockly.Language.lsystem_static_var_age = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('age');
		this.setOutput(true, Number);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_static_var_age = function() {
	return ["age", Blockly.JavaScript.ORDER_NONE];
};

Blockly.Language.lsystem_random_choice = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('Random choise');
		
		this.ruleCount_ = 0;
		this.appendRuleInputs();
		
		this.setMutator(new Blockly.Mutator(['lsystem_random_choice_item']));
		this.setPreviousStatement(true, [LTypes.rule, LTypes.visual]);
		this.setNextStatement(true, [LTypes.rule, LTypes.visual]);
		this.setTooltip('Description');
	},
	mutationToDom: function(workspace) {
		var container = document.createElement('mutation');
		container.setAttribute('rules', this.ruleCount_);
		return container;
	},
	domToMutation: function(container) {
		var rulenum = window.parseInt(container.getAttribute('rules'), 10);
		// this.ruleCount_ = 0;
		while(this.ruleCount_ < rulenum) { // 1 input has already appended in init
			this.appendRuleInputs();
		}
	},
	decompose: function(workspace) {
		var containerBlock = new Blockly.Block(workspace, 'lsystem_random_choice_container');
		//containerBlock.editable = false;
		containerBlock.initSvg();
		//var connection = containerBlock.inputList[0];
		var connection = containerBlock.getInput('STACK').connection;
		for(var i = 0; i < this.ruleCount_; i++) {
			var ruleBlock = new Blockly.Block(workspace, 'lsystem_random_choice_item');
			ruleBlock.initSvg();
			//ruleBlock.valueInput_ = this.inputList[i].targetConnection;
			connection.connect(ruleBlock.previousConnection);
			connection = ruleBlock.nextConnection;
		}
		return containerBlock;
	},
	compose: function(containerBlock) {
		// Disconnect all input blocks and Destroy all inputs
		for(var i = this.ruleCount_ - 1; i >= 0; i--) {
			this.removeRuleInputs(i);
		}
		this.ruleCount_ = 0;
		
		// Rebuild the block's inputs
		var ruleBlock = containerBlock.getInputTargetBlock('STACK');
		while(ruleBlock) {
			var newinputs = this.appendRuleInputs();
			// Reconnect any child blocks
			if(ruleBlock.valueConnection_) {
				newinputs.rate.connection.connect(ruleBlock.valueConnection_);
			}
			if(ruleBlock.statementConnection_) {
				newinputs.rule.connection.connect(ruleBlock.statementConnection_);
			}
			ruleBlock = ruleBlock.nextConnection && ruleBlock.nextConnection.targetBlock();
		}
	},
	saveConnections: function (containerBlock) {
		var ruleBlock = containerBlock.getInputTargetBlock('STACK');
		var i = 0;
		while(ruleBlock) {
			var input;
			input = this.getInput('RATE' + i);
			ruleBlock.valueConnection_ = input && input.connection.targetConnection;
			input = this.getInput('RULE' + i);
			ruleBlock.statementConnection_ = input && input.connection.targetConnection;
			i++;
			ruleBlock = ruleBlock.nextConnection && ruleBlock.nextConnection.targetBlock();
		}
	},
	// local utility
	appendRuleInputs: function() {
		var id = this.ruleCount_;
		var ret = {};
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'RATE' + id, Number);
		input.appendTitle("rate");
		ret.rate = input;
		input = this.appendInput(Blockly.NEXT_STATEMENT, 'RULE' + id, LTypes.rule);
		input.appendTitle("Rule");
		ret.rule = input;
		ret.id = this.ruleCount_;
		this.ruleCount_++;
		return ret;
	},
	removeRuleInputs: function(id) {
		this.removeInput('RATE' + id);
		this.removeInput('RULE' + id);
		this.ruleCount_--;
	}
};
Blockly.JavaScript.lsystem_random_choice = function() {
	var ret = "var stats=[";
	var ratetotal = 0;
	for(var i = 0; i < this.ruleCount_; i++) {
		var tmprate = Blockly.JavaScript.valueToCode(this, 'RATE' + i, Blockly.JavaScript.ORDER_NONE) || '1.0';
		var tmprule = Blockly.JavaScript.statementToCode(this, 'RULE' + i);
		ratetotal += parseFloat(tmprate);
		if(i > 0) ret += ","
		ret += "{'rate':" + tmprate + ", 'rule':\""+ tmprule + "\"}";
	}
	ret += "];";// + endl;
	ret += "var rnd=LSystem.rand()*" + ratetotal + ";";
	ret += "for(var i=0; i<stats.length; i++){";
	ret += "if(rnd < stats[i].rate) return stats[i].rule;";
	ret += "rnd -= stats[i].rate;";
	ret += "} return '';";
	return '"+(function(){' + ret + '})()+"';
};
Blockly.Language.lsystem_random_choice_container = {
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('add');
		var input = this.appendInput(Blockly.NEXT_STATEMENT, 'STACK');
		this.setTooltip('Description');
		this.contextMenu = false;
	}
};
Blockly.Language.lsystem_random_choice_item = {
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('a Rule');
		this.setPreviousStatement(true);
		this.setNextStatement(true);
		this.setTooltip('Description');
		this.contextMenu = false;
	}
};

Blockly.Language.lsystem_branch = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.lsystem);
		this.appendTitle('Branch');
		var input = this.appendInput(Blockly.NEXT_STATEMENT, 'RULE', LTypes.rule);
		input.appendTitle("Rule");
		this.setPreviousStatement(true, LTypes.rule);
		this.setNextStatement(true, LTypes.rule);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_branch = function() {
	var rulejs = Blockly.JavaScript.statementToCode(this, 'RULE');
	return "+beginBranch()" + rulejs + "+endBranch()";
};

// Transform
Blockly.Language.lsystem_translate = {
	category: 'Transform',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.transform);
		this.appendTitle('Translate');
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'X', Number);
		input.appendTitle("x");
		input = this.appendInput(Blockly.INPUT_VALUE, 'Y', Number);
		input.appendTitle("y");
		input = this.appendInput(Blockly.INPUT_VALUE, 'Z', Number);
		input.appendTitle("z");
		this.setPreviousStatement(true, [LTypes.rule, LTypes.visual]);
		this.setNextStatement(true, [LTypes.rule, LTypes.visual]);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_translate = function() {
	var xjs = Blockly.JavaScript.valueToCode(this, 'X', Blockly.JavaScript.ORDER_ATOMIC) || "0";
	var yjs = Blockly.JavaScript.valueToCode(this, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || "0";
	var zjs = Blockly.JavaScript.valueToCode(this, 'Z', Blockly.JavaScript.ORDER_ATOMIC) || "0";
	return "+Translate(" + xjs + "," + yjs + "," + zjs + ")";
};

Blockly.Language.lsystem_rotate_axis = {
	category: 'Transform',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.transform);
		this.appendTitle('Rotate by');
		this.appendTitle(new Blockly.FieldDropdown(function(){
			return [["x", 'X'], ["y", 'Y'], ["z", 'Z']];
		}), 'AXIS');
		var input = this.appendInput(Blockly.INPUT_VALUE, 'ANGLE', Number);
		input.appendTitle("angle");
		this.setPreviousStatement(true, [LTypes.rule, LTypes.visual]);
		this.setNextStatement(true, [LTypes.rule, LTypes.visual]);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_rotate_axis = function() {
	var rotaxis = this.getTitleValue('AXIS');
	var anglejs = Blockly.JavaScript.valueToCode(this, 'ANGLE', Blockly.JavaScript.ORDER_ATOMIC) || "0";
	return "+RotBy('" + rotaxis + "'," + anglejs + ")";
};

Blockly.Language.lsystem_rotate_for = {
	category: 'Transform',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.transform);
		this.appendTitle('Rotate for');
		this.appendTitle(new Blockly.FieldDropdown(function(){
			return [["sky", 'SKY'], ["earth", 'EARTH']];
		}), 'SPACE');
		var input = this.appendInput(Blockly.INPUT_VALUE, 'ANGLE', Number);
		input.appendTitle("angle");
		this.setPreviousStatement(true, [LTypes.rule, LTypes.visual]);
		this.setNextStatement(true, [LTypes.rule, LTypes.visual]);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_rotate_for = function() {
	var rottype = this.getTitleValue('SPACE');
	var anglejs = Blockly.JavaScript.valueToCode(this, 'ANGLE', Blockly.JavaScript.ORDER_ATOMIC) || "0";
	return "+RotFor('" + rottype + "'," + anglejs + ")";
};

Blockly.Language.lsystem_scale = {
	category: 'Transform',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.transform);
		this.appendTitle('Scale');
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'X', Number);
		input.appendTitle("x");
		input = this.appendInput(Blockly.INPUT_VALUE, 'Y', Number);
		input.appendTitle("y");
		input = this.appendInput(Blockly.INPUT_VALUE, 'Z', Number);
		input.appendTitle("z");
		this.setPreviousStatement(true, [LTypes.rule, LTypes.visual]);
		this.setNextStatement(true, [LTypes.rule, LTypes.visual]);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_scale = function() {
	var xjs = Blockly.JavaScript.valueToCode(this, 'X', Blockly.JavaScript.ORDER_ATOMIC) || "1";
	var yjs = Blockly.JavaScript.valueToCode(this, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || "1";
	var zjs = Blockly.JavaScript.valueToCode(this, 'Z', Blockly.JavaScript.ORDER_ATOMIC) || "1";
	return "+Scale(" + xjs + "," + yjs + "," + zjs + ")";
};

Blockly.Language.lsystem_scale_uniform = {
	category: 'Transform',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.transform);
		this.appendTitle('Scale uniform');
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'SCALE', Number);
		input.appendTitle("scale");
		this.setPreviousStatement(true, [LTypes.rule, LTypes.visual]);
		this.setNextStatement(true, [LTypes.rule, LTypes.visual]);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_scale_uniform = function() {
	var sjs = Blockly.JavaScript.valueToCode(this, 'SCALE', Blockly.JavaScript.ORDER_ATOMIC) || "1";
	return "+Scale(" + sjs + "," + sjs + "," + sjs + ")";
};

// Visualize
Blockly.LUtils = {};
Blockly.LUtils.validateHexRGB = function (instr, errval) {
	if(instr.charAt(0) == '#') {
		instr = instr.substr(1);
	}
	if(instr.length > 6) {
		instr = instr.substr(0, 6);
	}
	var n = window.parseInt(instr, 16);
	var ret = window.isNaN(n)? errval : n.toString(16);
	while(ret.length < 6) {
		ret = '0' + ret;
	}
	return (ret.charAt(0) == '#')? ret : ('#' + ret);
};
Blockly.LUtils.addColorInput = function (blck) {
	var input = blck.appendInput(Blockly.DUMMY_INPUT, "");
	input.appendTitle('color');
	input.appendTitle(new Blockly.FieldTextInput('#ffcc99', function(text){
		return Blockly.LUtils.validateHexRGB(text, '#badc01');
	}), 'COLOR');
};

Blockly.Language.visualize_tube = {
	category: 'Visualize 3D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Tube');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'TOP_R', Number);
		input.appendTitle("top radius");
		input = this.appendInput(Blockly.INPUT_VALUE, 'BOTTOM_R', Number);
		input.appendTitle("bottom radius");
		input = this.appendInput(Blockly.INPUT_VALUE, 'LENGTH', Number);
		input.appendTitle("length");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_tube = function() {
	var args = new Array(4);
	args[0] = Blockly.JavaScript.valueToCode(this, 'TOP_R', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'BOTTOM_R', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = Blockly.JavaScript.valueToCode(this, 'LENGTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[3] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsTube(" + args.join(',') + ")";
};

Blockly.Language.visualize_capsule = {
	category: 'Visualize 3D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Capsule');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'TOP_R', Number);
		input.appendTitle("top radius");
		input = this.appendInput(Blockly.INPUT_VALUE, 'BOTTOM_R', Number);
		input.appendTitle("bottom radius");
		input = this.appendInput(Blockly.INPUT_VALUE, 'LENGTH', Number);
		input.appendTitle("length");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_capsule = function() {
	var args = new Array(4);
	args[0] = Blockly.JavaScript.valueToCode(this, 'TOP_R', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'BOTTOM_R', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = Blockly.JavaScript.valueToCode(this, 'LENGTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[3] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsCapsule(" + args.join(',') + ")";
};

Blockly.Language.visualize_sphere = {
	category: 'Visualize 3D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Sphere');
		Blockly.LUtils.addColorInput(this);
		var input = this.appendInput(Blockly.INPUT_VALUE, 'RADIUS', Number);
		input.appendTitle("radius");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_sphere = function() {
	var args = new Array(2);
	args[0] = Blockly.JavaScript.valueToCode(this, 'RADIUS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsSphere(" + args.join(',') + ")";
};

Blockly.Language.visualize_ellipsoid = {
	category: 'Visualize 3D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Ellipsoid');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'WIDTH', Number);
		input.appendTitle("width");
		input = this.appendInput(Blockly.INPUT_VALUE, 'HEIGHT', Number);
		input.appendTitle("height");
		input = this.appendInput(Blockly.INPUT_VALUE, 'DEPTH', Number);
		input.appendTitle("depth");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_ellipsoid = function() {
	var args = new Array(4);
	args[0] = Blockly.JavaScript.valueToCode(this, 'WIDTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'HEIGHT', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = Blockly.JavaScript.valueToCode(this, 'DEPTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[3] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsEllipsoid(" + args.join(',') + ")";
};

Blockly.Language.visualize_cube = {
	category: 'Visualize 3D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Cube');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'WIDTH', Number);
		input.appendTitle("width");
		input = this.appendInput(Blockly.INPUT_VALUE, 'HEIGHT', Number);
		input.appendTitle("height");
		input = this.appendInput(Blockly.INPUT_VALUE, 'DEPTH', Number);
		input.appendTitle("depth");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_cube = function() {
	var args = new Array(4);
	args[0] = Blockly.JavaScript.valueToCode(this, 'WIDTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'HEIGHT', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = Blockly.JavaScript.valueToCode(this, 'DEPTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[3] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsCube(" + args.join(',') + ")";
};

Blockly.Language.visualize_plane = {
	category: 'Visualize 2D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Plane');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'WIDTH', Number);
		input.appendTitle("width");
		input = this.appendInput(Blockly.INPUT_VALUE, 'HEIGHT', Number);
		input.appendTitle("height");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_plane = function() {
	var args = new Array(3);
	args[0] = Blockly.JavaScript.valueToCode(this, 'WIDTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'HEIGHT', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsPlane(" + args.join(',') + ")";
};

Blockly.Language.visualize_circle = {
	category: 'Visualize 2D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Circle');
		Blockly.LUtils.addColorInput(this);
		var input = this.appendInput(Blockly.INPUT_VALUE, 'RADIUS', Number);
		input.appendTitle("radius");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_circle = function() {
	var args = new Array(2);
	args[0] = Blockly.JavaScript.valueToCode(this, 'RADIUS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsCircle(" + args.join(',') + ")";
};

Blockly.Language.visualize_oval = {
	category: 'Visualize 2D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Oval');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'WIDTH', Number);
		input.appendTitle("width");
		input = this.appendInput(Blockly.INPUT_VALUE, 'HEIGHT', Number);
		input.appendTitle("height");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_oval = function() {
	var args = new Array(3);
	args[0] = Blockly.JavaScript.valueToCode(this, 'WIDTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'HEIGHT', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsOval(" + args.join(',') + ")";
};

Blockly.Language.visualize_polygon = {
	category: 'Visualize 2D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Polygon');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'VERTS', Number);
		input.appendTitle("vertices");
		input = this.appendInput(Blockly.INPUT_VALUE, 'WIDTH', Number);
		input.appendTitle("width");
		input = this.appendInput(Blockly.INPUT_VALUE, 'HEIGHT', Number);
		input.appendTitle("height");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_polygon = function() {
	var args = new Array(4);
	args[0] = Blockly.JavaScript.valueToCode(this, 'VERTS', Blockly.JavaScript.ORDER_ATOMIC) || '5';
	args[1] = Blockly.JavaScript.valueToCode(this, 'WIDTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = Blockly.JavaScript.valueToCode(this, 'HEIGHT', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[3] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsPolygon(" + args.join(',') + ")";
};

Blockly.Language.visualize_line = {
	category: 'Visualize 2D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Line');
		Blockly.LUtils.addColorInput(this);
		var input;
		input = this.appendInput(Blockly.INPUT_VALUE, 'LENGTH', Number);
		input.appendTitle("length");
		input = this.appendInput(Blockly.INPUT_VALUE, 'WIDTH', Number);
		input.appendTitle("width");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_line = function() {
	var args = new Array(3);
	args[0] = Blockly.JavaScript.valueToCode(this, 'LENGTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = Blockly.JavaScript.valueToCode(this, 'WIDTH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[2] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsLine(" + args.join(',') + ")";
};

Blockly.Language.visualize_point = {
	category: 'Visualize 2D',
	helpUrl: '',
	init: function() {
		this.setColour(LColors.visualize);
		this.appendTitle('Point');
		Blockly.LUtils.addColorInput(this);
		var input = this.appendInput(Blockly.INPUT_VALUE, 'SIZE', Number);
		input.appendTitle("size");
		this.setPreviousStatement(true, LTypes.visual);
		this.setNextStatement(true, LTypes.visual);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.visualize_point = function() {
	var args = new Array(2);
	args[0] = Blockly.JavaScript.valueToCode(this, 'SIZE', Blockly.JavaScript.ORDER_ATOMIC) || '1';
	args[1] = "'" + this.getTitleValue('COLOR') + "'";
	return "+LSystem.visualizers.drawAsPoint(" + args.join(',') + ")";
};

///// 
/*
Blockly.Language.lsystem_ = {
	category: 'LSystem',
	helpUrl: '',
	init: function() {
		this.setColour(60);
		this.adppendTitle('title');
		this.setOutput(true, Number);
		//this.setPreviousStatement(true, LTypes.rule);
		//this.setNextStatement(true, LTypes.rule);
		this.setTooltip('Description');
	}
};
Blockly.JavaScript.lsystem_ = function() {
};
*/
