// Oscar Saharoy 2021


function drawLoop( gl ) {

    // Clear the color and depth data
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update the shader matrices
    updateMatrices();

    // draw to the canvas
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl, renderProgram ) );
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
    calcGeometryData( points, verts, norms, idxs, vertOffsets, sharpEdges=sharpEdges );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
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



// calculation variables
let viewPointRotation = 0;
const dt      = 5e-3;
const nPoints = 702;
const points  = new Array(nPoints);

// controls whether the mesh is rendered with sharp edges
let sharpEdges = true;

// arrays that will contain the strange attractor geometry data
let nVerts = (nPoints - 3) * 8 - 9 * !sharpEdges;
let verts  = new Float32Array( (nVerts + 8)*3  );
let norms  = new Float32Array( (nVerts + 8)*3 );
let idxs   = new Uint32Array(  (nVerts + 8)*3 );

// vertOffsets defines the cross section of the geometry 
const width = 1;
const vertOffsets = [ 
                      { normal:  width, curve:  0     } ,
                      { normal:  0    , curve:  width } ,
                      { normal: -width, curve:  0     } ,
                      { normal:  0    , curve: -width } 
                    ];


// get the webgl drawing context and canvas
const [gl, canvas] = initgl( "glcanvas" );

// create the matrices we need
const modelMatrix      = mat4.create();
const viewMatrix       = mat4.create();
const normalMatrix     = mat4.create();
const modelViewMatrix  = mat4.create();
const projectionMatrix = mat4.create();

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
