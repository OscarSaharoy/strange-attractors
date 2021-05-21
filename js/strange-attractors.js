// Oscar Saharoy 2021


function drawLoop( gl, programInfo ) {

    // bind the framebuffer to render to the renderTexture
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );

    // Clear the color and depth data
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // use the rendering program
    gl.useProgram( renderProgram );

    // draw the geometry to the renderTexture
    gl.drawElements(gl.TRIANGLES, nVerts, gl.UNSIGNED_INT, 0);


    // bind the canvas instead of the framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );

    // Clear the color and depth data
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // use the antialiasing program
    // gl.useProgram( antialiasingProgram );

    // draw to the canvas
    gl.drawElements(gl.TRIANGLES, nVerts, gl.UNSIGNED_INT, 0);


    updateGeometry();
     
    // set all the shader matrices
    updateMatrices();

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl, programInfo ) );
}


function updateGeometry() {

    // set the start point for the attractor path
    points[0] = [-2, -2.5, 20]; //[0.008, 0.1, -0.1];

    // construct the points
    for( let i=1; i<nPoints; ++i ) calcPointRK4(points, i);

    // get the centre of the points
    const centrePoint = getCentrePoint( points );

    // shift all the points by centrePoint to centre the geometry at the origin
    points.forEach( p => vec3.sub(p, p, centrePoint) );

    // build the geometry from the points
    calcGeometryData( points, faces, norms, idxs );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, faces );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
}


function updateMatrices() {

    // update view matrix
    viewPointRotation += 0.02;
    mat4.lookAt(viewMatrix, [90*Math.cos(viewPointRotation), 0, 90*Math.sin(viewPointRotation)], [0,0,0], [0,1,0] );

    // update the modelView matrix
    mat4.mul(modelViewMatrix, viewMatrix, modelMatrix);

    // adjust the normal matrix to match the modelView matrix
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // put all the matrices into the shader program
    gl.uniformMatrix4fv(
        programInfo.projectionMatrix,
        false,
        projectionMatrix
    );

    gl.uniformMatrix4fv(
        programInfo.modelViewMatrix,
        false,
        modelViewMatrix
    );

    gl.uniformMatrix4fv(
        programInfo.normalMatrix,
        false,
        normalMatrix
    );
}



// calcluation variables
let viewPointRotation = 0;
const dt      = 5e-3;
const nPoints = 30000;
const points  = new Array(nPoints);

// arrays that will contain the strange attractor geometry data
let nVerts = (nPoints - 3) * 24;
let faces  = new Float32Array( (nPoints - 3) * 48 );
let norms  = new Float32Array( (nPoints - 3) * 48 );
let idxs   = new Uint32Array(  (nPoints - 3) * 24 );


// get the webgl drawing context
const [gl, canvas] = initgl( "glcanvas" );

// create the matrices we need
const modelMatrix      = mat4.create();
const viewMatrix       = mat4.create();
const normalMatrix     = mat4.create();
const modelViewMatrix  = mat4.create();
const projectionMatrix = mat4.create();

// allow canvas to handle resizing
handleCanvasResize( gl, canvas, projectionMatrix );

// make the shader programs
const renderProgram       = makeShaderProgram(gl, vsSource         , fsSource         );
const antialiasingProgram = makeShaderProgram(gl, vCopyShaderSource, fCopyShaderSource);

// enable the render program
gl.useProgram( renderProgram );

// create the renderTexture and framebuffer
const renderTexture = createTexture( gl, canvas.width, canvas.height );
const framebuffer   = createFramebuffer( gl, renderTexture );

// make the data buffers
const positionBuffer = createBuffer( gl, gl.ARRAY_BUFFER        , faces );
const normalBuffer   = createBuffer( gl, gl.ARRAY_BUFFER        , norms );
const indexBuffer    = createBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, idxs  );


// collect some info about the program
const programInfo = {

    vertexPosition  : gl.getAttribLocation(  renderProgram, 'aVertexPosition'   ),
    vertexNormal    : gl.getAttribLocation(  renderProgram, 'aVertexNormal'     ),

    projectionMatrix: gl.getUniformLocation( renderProgram, 'uProjectionMatrix' ),
    modelViewMatrix : gl.getUniformLocation( renderProgram, 'uModelViewMatrix'  ),
    normalMatrix    : gl.getUniformLocation( renderProgram, 'uNormalMatrix'     ),

    positionBuffer  : positionBuffer,
    normalBuffer    : normalBuffer  ,
    indexBuffer     : indexBuffer 
};

// setup the buffer pointers
setupPointer( gl, programInfo.vertexPosition, programInfo.positionBuffer );
setupPointer( gl, programInfo.vertexNormal  , programInfo.normalBuffer   );

updateGeometry();

// start the draw loop
drawLoop(gl, programInfo);
