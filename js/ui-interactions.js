// Oscar Saharoy 2021



const lorenzData = { 

	equationX : "a * (y - x)",
	equationY : "x * (b - z) - y",
	equationZ : "x * y - c*z",

	constValues : { 
		"a" : 10,
		"b" : 28,
		"c" : 2.666667
	},

	startX :  0.1,
	startY : -0.1,
	startZ :  8.8,

	nPoints      : 3500,
	stepSize     : 5e-3,
	profileWidth : 1.0
};

const chuaData = { 

	equationX : "a * (y - x)",
	equationY : "(b - a) * x - x*z + b*y",
	equationZ : "x * y - c*z",

	constValues : { 
		"a" : 40,
		"b" : 28,
		"c" : 3
	},

	startX :  0.1,
	startY : -0.1,
	startZ :  0.8,

	nPoints      : 3500,
	stepSize     : 5e-3,
	profileWidth : 1.0
};

const aizawaData = { 

	equationX : "(z - a) * x - b*y",
	equationY : "b*x + (z - a) * y",
	equationZ : "c + d*z - 1/3 * z**3 - (x**2 + y**2) * (1 + e*z) + f * z*x**3",

	constValues : { 
		"a" : 0.7,
		"b" : 3.5,
		"c" : 0.6,
		"d" : 0.9,
		"e" : 0.25,
		"f" : 0.1
	},

	startX :  0.05,
	startY : -0.15,
	startZ :  2.8,

	nPoints      : 3500,
	stepSize     : 5e-3,
	profileWidth : 0.05
};

const arneodoData = { 

	equationX : "y",
	equationY : "z",
	equationZ : "-a*x - b*y - z + c*x**3",

	constValues : { 
		"a" : -5.5,
		"b" : 3.5,
		"c" : -1
	},

	startX : 2,
	startY : 1,
	startZ : 0.5,

	nPoints      : 3500,
	stepSize     : 0.05,
	profileWidth : 0.28
};

const halvorsenData = { 

	equationX : "-a*x - 4*y - 4*z - y**2",
	equationY : "-a*y - 4*z - 4*x - z**2",
	equationZ : "-a*z - 4*x - 4*y - x**2",

	constValues : { 
		"a" : 1.4
	},

	startX : -6,
	startY : -2,
	startZ : -1,

	nPoints      : 3500,
	stepSize     : 0.05,
	profileWidth : 0.5
};

const lorenz2Data = { 

	equationX : "-a*x + y**2 - z**2 + a*b",
	equationY : "x * (y - c*z) + d",
	equationZ : "-z + x * (c*y + z)",

	constValues : { 
		"a" : 0.9,
		"b" : 9.9,
		"c" : 5,
		"d" : 1
	},

	startX : 6,
	startY : 1.2,
	startZ : 0.5,

	nPoints      : 3500,
	stepSize     : 0.05,
	profileWidth : 0.6
};

const hadleyData = { 

	equationX : "-1*y**2 - z**2 - a*x + a*b",
	equationY : "x*y - c*x*z - y + d",
	equationZ : "c*x*y + x*z - z",

	constValues : { 
		"a" : 0.2,
		"b" : 8,
		"c" : 4,
		"d" : 1
	},

	startX : 2,
	startY : -0.1,
	startZ : 0.5,

	nPoints      : 3500,
	stepSize     : 0.05,
	profileWidth : 0.1
};


// get all the preset data objects
const presetsData = { "lorenz"       : lorenzData,
			          "chua"         : chuaData, 
			          "aizawa"       : aizawaData,
			          "arneodo"      : arneodoData,
			          "halvorsen"    : halvorsenData,
			          "lorenz2"      : lorenz2Data,
			          "hadley"       : hadleyData };


const constInputHolder    = document.querySelector( "#const-input-holder" )
const constInputTemplate  = document.querySelector( ".const-input" );
constInputTemplate.remove();

const equationXInput      = document.querySelector( "#equation-x-input" );
const equationYInput      = document.querySelector( "#equation-y-input" );
const equationZInput      = document.querySelector( "#equation-z-input" );

const startXInput         = document.querySelector( "#start-x-input" );
const startYInput         = document.querySelector( "#start-y-input" );
const startZInput         = document.querySelector( "#start-z-input" );

const nPointsInput        = document.querySelector( "#nPoints-input"       );
const stepSizeInput       = document.querySelector( "#step-size-input"     );
const profileWidthInput   = document.querySelector( "#profile-width-input" );


const recalculateButton   = document.querySelector( "#recalculate" );
recalculateButton.onclick = recalculate;

const downloadSTLButton   = document.querySelector( "#download-stl" );
downloadSTLButton.onclick = () => {};

[ equationXInput, equationYInput, equationZInput ].forEach( elm => elm.addEventListener("input", updateConstUI) );


const getLabel = constInputDiv => constInputDiv.querySelector( "p.const-input-label" );
const getInput = constInputDiv => constInputDiv.querySelector( "input"               );



function detectConstNames() {

	// get a string of the 3 equations
	const equationString = `${equationXInput.value} ${equationYInput.value} ${equationZInput.value}`;

	// regex that finds all single characters like a, B, t, but not xyz
	const charDetector = /\b[a-wA-Z]\b/g;

	// get the matches of the regex 
	const matches = equationString.match(charDetector);

	// return the names sorted and without duplicates
	return [...new Set(matches)].sort();
}


function addConstInput( constName ) {

	// clone the template const input and add it in
	let newConstInput = constInputTemplate.cloneNode([true]);
	constInputHolder.appendChild( newConstInput );

	// add the new input to the interactive UI element list and set the label to the const letter
	interactiveUIElements.push( getInput( newConstInput ) );
	getLabel( newConstInput ).innerHTML = constName;	
	getInput( newConstInput ).value     = 0;	
}


function updateConstUI() {

	// get all the existing const names
	const existingConstInputs = Array.from( constInputHolder.querySelectorAll(".const-input") );
	const existingConstNames  = existingConstInputs.map( constInput => getLabel( constInput ).innerHTML );

	// get the names of constants in the equations
	const constNames = detectConstNames();

	// find which const names to add and which to remove
	const constNamesToAdd     = constNames.filter( name => !existingConstNames.includes(name) );
	const constNamesToRemove  = existingConstNames.filter( name => !constNames.includes(name) );
	const constInputsToRemove = existingConstInputs.filter( constInput => constNamesToRemove.includes( getLabel(constInput).innerHTML ) );

	// add the const inputs we should add and remove the ones we should remove
	constNamesToAdd.forEach( addConstInput );
	constInputsToRemove.forEach( elm => elm.remove() );
}


function applyPreset( data ) {

	// set all the inputs according to the data object

	equationXInput.value    = data.equationX;
	equationYInput.value    = data.equationY;
	equationZInput.value    = data.equationZ;

	startXInput.value       = data.startX;
	startYInput.value       = data.startY;
	startZInput.value       = data.startZ;

	nPointsInput.value      = data.nPoints;
	stepSizeInput.value     = data.stepSize;
	profileWidthInput.value = data.profileWidth;

	// update the const inputs
	updateConstUI();

	// set all the const inputs to the correct value
	for( const constInputDiv of constInputHolder.querySelectorAll( ".const-input" ) ) {

		// get the const input label and input element
		const label = getLabel( constInputDiv );
		const input = getInput( constInputDiv );

		// set the input according to the value in the data object
		input.value = data.constValues[label.innerHTML];
	}

	// update the equations
	updateEquations();
}


function constInputToReplaceFunc( constInput ) {

	// get the const name and value
	const constName  = constInput.querySelector( ".const-input-label" ).innerHTML;
	const constValue = constInput.querySelector( "input" ).value;

	// make a regex to select the const letter
	const constNameRegex = new RegExp( `\\b${constName}\\b`, 'g' );

	// return a function that wil replace the const letter with its value
	return str => str.replaceAll( constNameRegex, ` ${constValue}` );
}


function tryEvaluateEquation( equationInput, replaceConstsFunc ) {

	// clear error border from input
	equationInput.classList.remove( "error" );

	// replace consts in the equation string
	let replacedFuncString = replaceConstsFunc( equationInput.value );

	let evaledFunc;
	try {

		// try to eval the function and test if it works
		evaledFunc = eval( `(x,y,z) => ${replacedFuncString}` );
		evaledFunc(0,0,0);
	}
	catch(err) {

		// if that fails add the red error border
		equationInput.classList.add( "error" );
		throw err;
	}

	return evaledFunc;
}


function updateEquations() {

	// get list of functions to replace const letter with value
	const constReplaceFuncs = Array.from( constInputHolder.querySelectorAll( ".const-input" ) )
							       .map( constInputToReplaceFunc );

	// combine list of functions into 1 function
	const replaceConstsFunc = str => constReplaceFuncs.reduce( (acc,func) => func(acc), str );

	// try to evaluate the equations in the equation inputs
	const xFunc = tryEvaluateEquation( equationXInput, replaceConstsFunc );
	const yFunc = tryEvaluateEquation( equationYInput, replaceConstsFunc );
	const zFunc = tryEvaluateEquation( equationZInput, replaceConstsFunc );

	// if any of the funcs didnt come through just return
	if( !xFunc || !yFunc || !zFunc ) return false;

	// set the new fr function
	fr = ([ x, y, z ]) => [ xFunc( x,y,z ),
							yFunc( x,y,z ),
							zFunc( x,y,z ) ];

	return true;
}


function recalculate() {

	// set all the simulation vars from the inputs
	start         = [ +startXInput.value, +startYInput.value, +startZInput.value ];
	dt            = +stepSizeInput.value;
	uProfileWidth = +profileWidthInput.value;
	nPoints       = +nPointsInput.value;
	
	points        = new Array(nPoints);
	nVerts        = nPoints * 2 * profile.length + 1;
	verts         = new Float32Array( nVerts*3 );
	norms         = new Float32Array( nVerts*3 );
	idxs          = new Uint32Array(  nVerts*3 );

	profile = [
               { normal: -0.619*uProfileWidth, curve:  0.904*uProfileWidth } ,
               { normal: -0.588*uProfileWidth, curve:  0.809*uProfileWidth } ,
               { normal: -0.951*uProfileWidth, curve:  0.309*uProfileWidth } ,
               { normal: -1.051*uProfileWidth, curve:  0.309*uProfileWidth } ,

               { normal: -1.051*uProfileWidth, curve: -0.309*uProfileWidth } ,
               { normal: -0.951*uProfileWidth, curve: -0.309*uProfileWidth } ,
               { normal: -0.588*uProfileWidth, curve: -0.809*uProfileWidth } ,
               { normal: -0.619*uProfileWidth, curve: -0.904*uProfileWidth } ,

               { normal: -0.031*uProfileWidth, curve: -1.095*uProfileWidth } ,
               { normal:  0.000*uProfileWidth, curve: -1.000*uProfileWidth } ,
               { normal:  0.588*uProfileWidth, curve: -0.809*uProfileWidth } ,
               { normal:  0.669*uProfileWidth, curve: -0.868*uProfileWidth } ,
               { normal:  1.032*uProfileWidth, curve: -0.368*uProfileWidth } , 
               { normal:  0.951*uProfileWidth, curve: -0.309*uProfileWidth } , 

               { normal:  0.951*uProfileWidth, curve:  0.309*uProfileWidth } , 
               { normal:  1.032*uProfileWidth, curve:  0.368*uProfileWidth } , 
               { normal:  0.669*uProfileWidth, curve:  0.868*uProfileWidth } ,
               { normal:  0.588*uProfileWidth, curve:  0.809*uProfileWidth } ,
               { normal:  0.000*uProfileWidth, curve:  1.000*uProfileWidth } ,
               { normal: -0.031*uProfileWidth, curve:  1.095*uProfileWidth } ,
              ];

    // update the attractor equations but return if the equations are invalid
    if( !updateEquations() ) return;

	// update the model
	updateGeometry();

	shouldRedraw = true;
}


// apply the lorenz preset and calculate the geometry
applyPreset( lorenzData );
recalculate();
