
/////
var LTransformStack = function () {
	this.stack_ = [new LMatrix()];
	this.reset();
};
LTransformStack.prototype.reset = function () {
	while(this.stack_.length > 1) {
		this.stack_.pop();
	}
	this.stack_[0].loadIdentity();
};
LTransformStack.prototype.push = function () {
	var m = this.stack_.last().duplicate();
	this.stack_.push(m);
};
LTransformStack.prototype.pop = function () {
	this.stack_.pop();
};
LTransformStack.prototype.current = function () {
	return this.stack_[this.stack_.length - 1];
};

/////
var LSystem = {
	'context': {
		'initState': null,
		'curState': null,
		'execSteps': 0,
		'stepCount': 0
	},
	'turtle': null,
	'rules': {},
	'visualize': {},
	'visualizeFuncs_': null,
	//
	'rand': Math.random
	//'rand': function () { var r = Math.random(); console.log(r); return r; }
};

LSystem.rulesDefaultFuncs_ = {
	'beginBranch': function () {
		return "+beginBranch()";
	},
	'endBranch': function () {
		return "+endBranch()";
	},
	'Translate': function (tx, ty, tz) {
		return "+Translate(" + tx + ", " + ty + ", " + tz + ")";
	},
	'RotBy': function (axis, angle) {
		return "+RotBy('" + axis + "', " + angle + ")";
	},
	'RotFor': function (type, angle) {
		return "+RotFor('" + type + "', " + angle + ")";
	},
	'Scale': function (sx, sy, sz) {
		return "+Scale(" + sx + ", " + sy + ", " + sz + ")";
	},
};

LSystem.dummyVisualizeFunctions_ = {
	'beginBranch': function () {
		console.log("beginBranch");
		return 0;
	},
	'endBranch': function () {
		console.log("endBranch");
		return 0;
	},
	'Translate': function (tx, ty, tz) {
		console.log("Translate:local(" + tx + "," + ty + "," + tz + ")");
		return 0;
	},
	'RotBy': function (axis, angle) {
		// angle is degree.
		//console.log("RotBy");
		switch(axis) {
			case 'X':
				console.log("RotBy:x(" + angle + "),local");
				break;
			case 'Y':
				console.log("RotBy:y(" + angle + "),local");
				break;
			case 'Z':
				console.log("RotBy:y(" + angle + "),local");
				break;
		}
		return 0;
	},
	'RotFor': function (type, angle) {
		// angle is degree.
		//console.log("RotFor");
		if(tmpv0.normalize()) {
			switch(type) {
				case 'SKY':
					console.log("RotFor:sky(" + angle + ")");
					break;
				case 'EARTH':
					console.log("RotFor:earth(" + angle + ")");
					break;
			}
		}
		return 0;
	},
	'Scale': function (sx, sy, sz) {
		console.log("Scale:local(" + sx + "," + sy + "," + sz + ")");
		return 0;
	},
	/////
	'drawAsTube': function (r, l, col) {
		console.log("drawAsTube");
		return 0;
	},
	'drawAsCapsule': function (r, l, col) {
		console.log("drawAsCapsule");
		return 0;
	},
	'drawAsSphere': function (r, col) {
		console.log("drawAsSphere");
		return 0;
	},
	'drawAsEllipsoid': function (w, h, d, col) {
		console.log("drawAsEllipsoid");
		return 0;
	},
	/*
	'drawAsCone': function (topr, btmr, h, col) {
		console.log("drawAsCone");
		return 0;
	},
	*/
	'drawAsCube': function (w, h, d, col) {
		console.log("drawAsCube");
		return 0;
	},
	'drawAsPlane': function (w, h, col) {
		console.log("drawAsPlane");
		return 0;
	},
	'drawAsCircle': function (r, col) {
		console.log("drawAsCircle");
		return 0;
	},
	'drawAsOval': function (w, h, col) {
		console.log("drawAsOval");
		return 0;
	},
	'drawAsPolygon': function (vnum, w, h, col) {
		console.log("drawAsPolygon");
		return 0;
	},
	'drawAsLine': function (l, w, col) {
		console.log("drawAsLine");
		return 0;
	},
	'drawAsPoint': function (l, col) {
		console.log("drawAsPoint");
		return 0;
	}
};

////
LSystem.setVisualizers = function (vfuncs, turtleobj) {
	LSystem.visualizeFuncs_ = vfuncs? vfuncs : LSystem.dummyVisualizeFunctions_;
	LSystem.turtle = turtleobj;
};

/////
LSystem.clear = function () {
	LSystem.context.initState = null;
	LSystem.context.curState = null;
	LSystem.context.execSteps = 0;
	LSystem.context.stepCount = 0;
	
	LSystem.rules = {};
	LSystem.visualizers = {};
};

LSystem.reset = function () {
	LSystem.context.curState = "" + LSystem.context.initState;
	LSystem.context.stepCount = 0;
}

LSystem.init = function(inittxt, steps) {
	LSystem.context.initState = inittxt;
	LSystem.context.execSteps = steps;
	
	for(var key in LSystem.rulesDefaultFuncs_) {
		LSystem.rules[key] = LSystem.rulesDefaultFuncs_[key];
	}
	for(var key in LSystem.visualizeFuncs_) {
		LSystem.visualizers[key] = LSystem.visualizeFuncs_[key];
	}
	
	LSystem.reset();
};

LSystem.growOneStep = function () {
	if(LSystem.context.initState == null) {
		return;
	}
	if(LSystem.context.curState == null) {
		LSystem.context.curState = LSystem.context.initState;
	}
	try {
		var state = eval('with(LSystem.rules){""' + LSystem.context.curState + ';}');
		LSystem.context.curState = state;
		LSystem.context.stepCount++;
	} catch (e) {
		console.log("grow eval error:" + e);
	}
};

LSystem.grow = function () {
	if(LSystem.context.execSteps <= 0) {
		LSystem.growOneStep();
	}
	else {
		for(var i = 0; i < LSystem.context.execSteps; i++) {
			LSystem.growOneStep();
		}
	}
};

LSystem.visualize = function () {
	if(LSystem.context.curState == null) {
		return;
	}
	try {
		var state = eval('with(LSystem.visualizers){0' + LSystem.context.curState + ';}');
	} catch (e) {
		console.log("visualize eval error:" + e);
	}
};

// console.log("lsystem.js loaded");