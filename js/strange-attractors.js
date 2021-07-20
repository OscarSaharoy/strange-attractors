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
    requestAnimationFrame( () => drawLoop( gl ) );
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
    calcGeometryData( points, verts, norms, idxs, vertOffsets2, sharpEdges=sharpEdges );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
}


function updateMatrices() {

    // update the modelView matrix
    mat4.mul( uModelViewMatrix, uViewMatrix, uModelMatrix );

    // adjust the normal matrix to match the modelView matrix
    mat4.invert( uNormalMatrix, uModelViewMatrix );
    mat4.transpose( uNormalMatrix, uNormalMatrix );

    // put all the uniforms into the shader program

    gl.uniform3f(
        renderProgram.uViewPos,
        0,0,viewPointDistance
    );

    gl.uniform3f(
        renderProgram.uSunPos,
        100, 100, 100
    );

    gl.uniformMatrix4fv(
        renderProgram.uProjectionMatrix,
        false, uProjectionMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uModelViewMatrix,
        false, uModelViewMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uNormalMatrix,
        false, uNormalMatrix
    );



    // update the modelSunViewMatrix matrix
    mat4.mul( uModelSunViewMatrix, uSunViewMatrix, uModelMatrix );

    gl.uniform3f(
        shadowMapProgram.uSunPos,
        100, 100, 100
    );

    gl.uniformMatrix4fv(
        renderProgram.uModelSunViewMatrix,
        false, uModelSunViewMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uSunProjectionMatrix,
        false, uSunProjectionMatrix
    );
}


function makeRenderProgram() {

    // make the render program
    const renderProgram = makeShaderProgram( gl, vsSource, fsSource );

    // set vars in the render program
    renderProgram.uViewPos          = gl.getUniformLocation( renderProgram, 'uViewPos'          );
    renderProgram.uSunPos           = gl.getUniformLocation( renderProgram, 'uSunPos'           );
    renderProgram.uNormalMatrix     = gl.getUniformLocation( renderProgram, 'uNormalMatrix'     );
    renderProgram.uProjectionMatrix = gl.getUniformLocation( renderProgram, 'uProjectionMatrix' );
    renderProgram.uModelViewMatrix  = gl.getUniformLocation( renderProgram, 'uModelViewMatrix'  );

    renderProgram.aVertexPosition   = gl.getAttribLocation(  renderProgram, 'aVertexPosition'   );
    renderProgram.aVertexNormal     = gl.getAttribLocation(  renderProgram, 'aVertexNormal'     );

    renderProgram.positionBuffer    = positionBuffer;
    renderProgram.normalBuffer      = normalBuffer;
    renderProgram.indexBuffer       = indexBuffer;

    // enable the vertex attributes
    gl.enableVertexAttribArray( renderProgram.vertexPosition );
    gl.enableVertexAttribArray( renderProgram.vertexNormal   );

    return renderProgram;
}


function makeShadowMapProgram() {

    // make the shadow map program
    const shadowMapProgram = makeShaderProgram( gl, vShadowShaderSource, fShadowShaderSource );

    // set vars in the shadow map program
    shadowMapProgram.uSunPos              = gl.getUniformLocation( shadowMapProgram, 'uSunPos'              );
    shadowMapProgram.uModelSunViewMatrix  = gl.getUniformLocation( shadowMapProgram, 'uModelSunViewMatrix'  );
    shadowMapProgram.uSunProjectionMatrix = gl.getUniformLocation( shadowMapProgram, 'uSunProjectionMatrix' );

    shadowMapProgram.positionBuffer = positionBuffer;
    shadowMapProgram.indexBuffer    = indexBuffer;

    // enable the vertex attributes
    gl.enableVertexAttribArray( shadowMapProgram.vertexPosition );
    gl.enableVertexAttribArray( shadowMapProgram.vertexNormal   );

    return shadowMapProgram;
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
let t = 0;

// vertOffsets defines the cross section of the geometry 
const width = 1;
const vertOffsets = [ 
                      { normal:  width, curve:  0     } ,
                      { normal:  0    , curve:  width } ,
                      { normal: -width, curve:  0     } ,
                      { normal:  0    , curve: -width } 
                    ];

const vertOffsets1 = ( n => new Array(n).fill(null).map( (val,i) => 6.28*i/n ).map( x => ({normal: width*Math.cos(x), curve: width*Math.sin(x)}) ) )(10);

const vertOffsets2 = [ 
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


// calculation variables
const dt      = 5e-3;
const nPoints = 3500;
const start   = [ 0.1, -0.1, 8.8 ];
const points  = new Array(nPoints);

// controls whether the mesh is rendered with sharp edges
let sharpEdges = true;

// arrays that will contain the strange attractor geometry data
let nVerts = (nPoints - 3) * 8 * 23/4 - 9 * !sharpEdges; // todo need to correct this
let verts  = new Float32Array( (nVerts + 8)*3 );
let norms  = new Float32Array( (nVerts + 8)*3 );
let idxs   = new Uint32Array(  (nVerts + 8)*3 );

// get the webgl drawing context and canvas
const [gl, canvas] = initgl( "glcanvas" );

// create the matrices we need
const uModelMatrix         = mat4.create(); // both programs

const uViewMatrix          = mat4.create(); // render program
const uModelViewMatrix     = mat4.create();
const uProjectionMatrix    = mat4.create();
const uNormalMatrix        = mat4.create();

const uSunViewMatrix       = mat4.create(); // shadow map program
const uModelSunViewMatrix  = mat4.create();
const uSunProjectionMatrix = mat4.create();

// make the data buffers
const positionBuffer = createBuffer( gl, gl.ARRAY_BUFFER        , verts );
const normalBuffer   = createBuffer( gl, gl.ARRAY_BUFFER        , norms );
const indexBuffer    = createBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, idxs  );

// setup the viewpoint
let viewPointDistance  = 90;
mat4.lookAt( uViewMatrix, [0,0,viewPointDistance], [0,0,0], [0,1,0] );

// setup the sun's viewpoint
mat4.lookAt( uSunViewMatrix, [100,100,100], [0,0,0], [0,1,0] );

// allow the canvas to handle resizing
handleCanvasResize( gl, canvas, uProjectionMatrix );

// make the shadow map program
const shadowMapProgram = makeShadowMapProgram();

// make and use the render program
const renderProgram = makeRenderProgram();
gl.useProgram( renderProgram );

// use the correct vertex buffers
useArrayBuffer( gl, renderProgram.vertexPosition, renderProgram.positionBuffer );
useArrayBuffer( gl, renderProgram.vertexNormal  , renderProgram.normalBuffer   );

// make the geometry
updateGeometry();

// start the draw loop
drawLoop( gl );
