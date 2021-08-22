// Oscar Saharoy 2021

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


const luchenData = { 

	equationX : "a * (y - x)",
	equationY : "x - x*z + b*y + c",
	equationZ : "x * y - d*z",

	constValues : { 
		"a" : 36,
		"b" : 20,
		"c" : -15.15,
		"d" : 3
	},

	startX :  0.1,
	startY : -0.1,
	startZ :  0.8,

	nPoints      : 3500,
	stepSize     : 5e-3,
	profileWidth : 1.0
};


const rosslerData = { 

	equationX : "- y - z",
	equationY : "a + y * (x - b)",
	equationZ : "x + c*z",

	constValues : { 
		"a" : 0.1,
		"b" : 17,
		"c" : 0.1
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

	startX :  0.1,
	startY : -0.1,
	startZ :  0.8,

	nPoints      : 3500,
	stepSize     : 5e-3,
	profileWidth : 1.0
};


// get all the preset data objects
const presetsData = { "lorenz"  : lorenzData,
			          "chua"    : chuaData, 
			          "lu chen" : luchenData,
			          "rossler" : rosslerData,
			          "aizawa"  : aizawaData  };


function detectConstNames() {

	// get a string of the 3 equations
	const equationString = `${equationXInput.value} ${equationYInput.value} ${equationZInput.value}`;

	// regex that finds all single characters like a, b, t, but not xyz
	const charDetector = /\b[^xyz\W\d]\b/g;

	// get the matches of the regex 
	const matches = equationString.match(charDetector);

	// return the names sorted and without duplicates
	return [...new Set(matches)].sort();
}


function updateConstUI() {

	// remove all the existing const inputs
	const constInputs = Array.from( constInputHolder.querySelectorAll(".const-input") );
	constInputs.forEach( elm => elm.remove() );

	// get the names of constants in use
	const constNames = detectConstNames();

	// loop over the consts we found
	for( const constName of constNames ) {

		// clone the template const input and add it in
		let newConstInput = constInputTemplate.cloneNode([true]);
		constInputHolder.appendChild( newConstInput );

		// add the new input to the interactive UI element list and set the label to the const letter
		interactiveUIElements.push( newConstInput.querySelector( "input" ) );
		newConstInput.querySelector( "p.const-input-label" ).innerHTML = constName;
	}
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
		const label = constInputDiv.querySelector( ".const-input-label" );
		const input = constInputDiv.querySelector( "input" );

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
	return str => str.replaceAll( constNameRegex, constValue );
}


function tryEvaluateEquation( equationInput, replaceConstsFunc ) {

	// clear error border from input
	equationInput.classList.remove( "error" );

	// replace consts in the equation string
	const replacedFuncString = replaceConstsFunc( equationInput.value );


	let evaledFunc;
	try {

		// try to eval the function and test if it works
		evaledFunc = eval( `(x,y,z) => ${replacedFuncString}` );
		evaledFunc(0,0,0);
	}
	catch {

		// if that fails add the red error border
		equationInput.classList.add( "error" );
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
	if( !xFunc || !yFunc || !zFunc ) return;

	// set the new fr function
	fr = ([ x, y, z ]) => [ xFunc( x,y,z ),
							yFunc( x,y,z ),
							zFunc( x,y,z ) ];
}


function recalculate() {

	// set all the simulation vars from the inputs - fr already updated on typing
	start   = [ +startXInput.value, +startYInput.value, +startZInput.value ];
	dt      = +stepSizeInput.value;
	width   = +profileWidthInput.value;
	nPoints = +nPointsInput.value;

	nVerts  = nPoints * 2 * profile.length + 1;
	verts   = new Float32Array( nVerts*3 );
	norms   = new Float32Array( nVerts*3 );
	idxs    = new Uint32Array(  nVerts*3 );

	profile      = [ 
                    { normal: -0.619*width, curve:  0.904*width } ,
                    { normal: -0.588*width, curve:  0.809*width } ,
                    { normal: -0.951*width, curve:  0.309*width } ,
                    { normal: -1.051*width, curve:  0.309*width } ,

                    { normal: -1.051*width, curve: -0.309*width } ,
                    { normal: -0.951*width, curve: -0.309*width } ,
                    { normal: -0.588*width, curve: -0.809*width } ,
                    { normal: -0.619*width, curve: -0.904*width } ,

                    { normal: -0.031*width, curve: -1.095*width } ,
                    { normal:  0.000*width, curve: -1.000*width } ,
                    { normal:  0.588*width, curve: -0.809*width } ,
                    { normal:  0.669*width, curve: -0.868*width } ,
                    { normal:  1.032*width, curve: -0.368*width } , 
                    { normal:  0.951*width, curve: -0.309*width } , 

                    { normal:  0.951*width, curve:  0.309*width } , 
                    { normal:  1.032*width, curve:  0.368*width } , 
                    { normal:  0.669*width, curve:  0.868*width } ,
                    { normal:  0.588*width, curve:  0.809*width } ,
                    { normal:  0.000*width, curve:  1.000*width } ,
                    { normal: -0.031*width, curve:  1.095*width } ,
                   ];

	// update the model
	updateGeometry();

	shouldRedraw = true;
}



applyPreset( lorenzData );
