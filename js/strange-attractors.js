// Oscar Saharoy 2021


function drawLoop( gl ) {

    // Clear the color and depth data
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // run the pan and zoom routine
    panAndZoom();

    // update the shader matrices
    updateMatrices();

    // draw to the canvas
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl, renderProgram ) );
}


function updateGeometry() {

    // set the start point for the attractor path
    points[0] = start;

    // construct the points
    for( let i = 1; i < nPoints; ++i ) points[i] = calcPointRK4( points[i-1] );

    // get the centre of the points
    const centrePoint = getCentrePoint( points );

    // shift all the points by centrePoint to centre the geometry at the origin
    points.forEach( p => vec3.sub(p, p, centrePoint) );

    // build the geometry from the points
    calcGeometryData( points, verts, norms, idxs, vertOffsets, sharpEdges=sharpEdges );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
}


function updateMatrices() {

    // update the modelView matrix
    mat4.mul(modelViewMatrix, viewMatrix, modelMatrix);

    // adjust the normal matrix to match the modelView matrix
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // put all the matrices into the shader program
    gl.uniformMatrix4fv(
        renderProgram.projectionMatrix,
        false,
        projectionMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.modelViewMatrix,
        false,
        modelViewMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.normalMatrix,
        false,
        normalMatrix
    );
}


// get mean and spread of a list of pointer positions
const getMeanPointer   = arr => arr.reduce( (acc, val) => v3add( acc, v3scale(val, 1/arr.length ) ), v3zero );
const getPointerSpread = (positions, mean) => positions.reduce( (acc, val) => acc + ((val[0]-mean[0])**2 + (val[1]-mean[1])**2)**0.5, 0 );
const getPointerTwist  = (positions, mean) => positions.reduce( (acc, val) => acc + v3mod( v3cross( [0,1,0], v3sub(val, mean) ) ), 0 );
const getPositionDiffs = positions => positions.slice(1).map( (val,i) => v3sub( val, positions[i] ) ); 
const getEndToEnd      = positions => getPositionDiffs( positions ).reduce( (acc,val) => v3add(acc, val), v3zero );

// vars to track panning and zooming
let activePointers     = [];
let pointerPositions   = {};
let meanPointer        = v3zero;
let lastMeanPointer    = v3zero;
let pointerSpread      = 0;
let lastPointerSpread  = 0;
let endToEndVector     = v3zero;
let lastEndToEndVector = v3zero;
let skip1Frame         = false;


function setPointerMeanAndSpread() {

    // get all the pointer vectors
    const pointers = Object.values( pointerPositions );

    // use functions to find mean and spread and end to end vector (normalised)
    meanPointer    = getMeanPointer( pointers );
    pointerSpread  = getPointerSpread( pointers, meanPointer );
    endToEndVector = v3norm( getEndToEnd( pointers ) );
}

function pointerdown( event ) {

    event.preventDefault();

    // add the pointer to pointerPositions and activePointers
    pointerPositions[event.pointerId] = [event.offsetX, -event.offsetY, 0];
    activePointers.push( event.pointerId );

    // set the mean pointer position so that we have access to the new meanPointer straight away
    setPointerMeanAndSpread()

    // we added a new pointer so skip a frame to prevent
    // a step change in pan position
    skip1Frame = true;
}

function pointermove( event ) {

    event.preventDefault();

    // if this pointer isn't an active pointer
    // (pointerdown occured over a preventDrag element)
    // then do nothing
    if( !activePointers.includes(event.pointerId) ) return;

    // keep track of the pointer pos
    pointerPositions[event.pointerId] = [ event.offsetX, -event.offsetY, 0 ];
}

function pointerup( event ) {

    // remove the pointer from active pointers and pointerPositions
    // (does nothing if it wasnt in them)
    activePointers = activePointers.filter( id => id != event.pointerId );
    delete pointerPositions[event.pointerId];

    // we lost a pointer so skip a frame to prevent
    // a step change in pan position
    skip1Frame = true;
}

function panAndZoom() {

    // if theres no active pointers do nothing
    if( !activePointers.length ) return;

    // set the mean pointer and spread
    setPointerMeanAndSpread();
    
    // we have to skip a frame when we change number of pointers to avoid a jump
    if( !skip1Frame ) {

        // calculate inverse model matrix (rotation matrix)
        const invModel = mat4.transpose(new Array(16), modelMatrix);

        // calculate the movement of the mean pointer to use for panning
        const meanPointerMove = v3sub( meanPointer, lastMeanPointer );
        const axis = v3cross( [0,0,1], meanPointerMove );

        // rotate the geometry
        vec3.transformMat4( axis, axis, invModel );
        mat4.rotate( modelMatrix, modelMatrix, v3mod(axis) / 150, axis );
        
        // call the wheel function with a constructed event to zoom with pinch
        wheel( { deltaY: (lastPointerSpread - pointerSpread) * 2.4 } );

        // rotate around the z axis to twist
        const spinAmount = v3dot( v3cross( lastEndToEndVector, endToEndVector ), [0,0,1.4] );
        vec3.transformMat4( axis, [0,0,1], invModel );
        mat4.rotate( modelMatrix, modelMatrix, spinAmount, axis );
    }

    // update the vars to prepare for the next frame
    lastMeanPointer    = meanPointer;
    lastPointerSpread  = pointerSpread;
    lastEndToEndVector = endToEndVector;
    skip1Frame         = false;
}

function wheel( event ) {

    // prevent browser from doing anything
    event.preventDefault?.();

    // adjust the zoom level and update the container
    const zoomAmount = event.deltaY / 600;

    viewPointDistance *= 1 + zoomAmount;
    mat4.lookAt(viewMatrix, [0,0,viewPointDistance], [0,0,0], [0,1,0] );
}



// calculation variables
const dt      = 5e-3;
const nPoints = 5002;
const start   = [ 1, 0.1, 0.8 ];
const points  = new Array(nPoints);

// controls whether the mesh is rendered with sharp edges
let sharpEdges = true;

// arrays that will contain the strange attractor geometry data
let nVerts = (nPoints - 3) * 8 - 9 * !sharpEdges;
let verts  = new Float32Array( (nVerts + 8)*3  );
let norms  = new Float32Array( (nVerts + 8)*3 );
let idxs   = new Uint32Array(  (nVerts + 8)*3 );

// vertOffsets defines the cross section of the geometry 
const width = 0.5;
const vertOffsets = [ 
                      { normal:  width, curve:  0     } ,
                      { normal:  0    , curve:  width } ,
                      { normal: -width, curve:  0     } ,
                      { normal:  0    , curve: -width } 
                    ];


// get the webgl drawing context and canvas
const [gl, canvas] = initgl( "glcanvas" );

// add event listeners to canvas
canvas.addEventListener( "pointerdown",  pointerdown );
canvas.addEventListener( "pointerup",    pointerup   );
canvas.addEventListener( "pointermove",  pointermove );
canvas.addEventListener( "wheel",        wheel       ); 


// create the matrices we need
const modelMatrix      = mat4.create();
const viewMatrix       = mat4.create();
const normalMatrix     = mat4.create();
const modelViewMatrix  = mat4.create();
const projectionMatrix = mat4.create();

// setup the viewpoint
let viewPointDistance = 90;
mat4.lookAt(viewMatrix, [0,0,viewPointDistance], [0,0,0], [0,1,0] );

// allow the canvas to handle resizing
handleCanvasResize( gl, canvas, projectionMatrix );

// make the data buffers
const positionBuffer = createBuffer( gl, gl.ARRAY_BUFFER        , verts );
const normalBuffer   = createBuffer( gl, gl.ARRAY_BUFFER        , norms );
const indexBuffer    = createBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, idxs  );


// make the render program
const renderProgram = makeShaderProgram( gl, vsSource, fsSource );

// set some vars in the render program
renderProgram.vertexPosition   = gl.getAttribLocation(  renderProgram, 'aVertexPosition'   );
renderProgram.vertexNormal     = gl.getAttribLocation(  renderProgram, 'aVertexNormal'     );

renderProgram.projectionMatrix = gl.getUniformLocation( renderProgram, 'uProjectionMatrix' );
renderProgram.modelViewMatrix  = gl.getUniformLocation( renderProgram, 'uModelViewMatrix'  );
renderProgram.normalMatrix     = gl.getUniformLocation( renderProgram, 'uNormalMatrix'     );

renderProgram.positionBuffer   = positionBuffer;
renderProgram.normalBuffer     = normalBuffer;
renderProgram.indexBuffer      = indexBuffer;

// enable the vertex attributes
gl.enableVertexAttribArray( renderProgram.vertexPosition );
gl.enableVertexAttribArray( renderProgram.vertexNormal   );

// use the render program
gl.useProgram( renderProgram );
    
// use the correct vertex buffers
useArrayBuffer( gl, renderProgram.vertexPosition, renderProgram.positionBuffer );
useArrayBuffer( gl, renderProgram.vertexNormal  , renderProgram.normalBuffer   );

// make the geometry
updateGeometry();

// start the draw loop
drawLoop( gl );
