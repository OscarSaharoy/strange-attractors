// Oscar Saharoy 2021


// map array of points by a mat4
const mapByMat4 = ( inPoints, M ) => boundingPoints.map( p => vec3.transformMat4(vec3.create(), p, M) );


function drawLoop( gl ) {

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl ) );

    // run the pan and zoom routine (canvas-control.js)
    panAndZoom();

    // stop if we don't need to redraw
    if( !shouldRedraw ) return;

    // render graphics
    renderShadowMap();
    renderScene();
    // testShadowMap();

    shouldRedraw = false;
}


function testShadowMap() {

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram );
    updateRenderProgramUniforms();

    // bind and clear the canvas
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viwport size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // use the shadow map program and update its uniforms
    gl.useProgram( shadowMapProgram );
    updateShadowMapProgramUniforms();

    // render the shadow map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function renderShadowMap() {

    // bind and clear the shadow map framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, shadowMapDepthFramebuffer );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viwport size
    gl.viewport( 0, 0, uShadowMapSize, uShadowMapSize );

    // use the shadow map program and update its uniforms
    gl.useProgram(shadowMapProgram);
    updateShadowMapProgramUniforms();

    // render the shadow map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function renderScene() {

    // bind and clear the canvas framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viwport size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // use the render program and update its uniforms
    gl.useProgram(renderProgram);
    updateRenderProgramUniforms();

    // draw to the canvas
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function updateGeometry() {

    // set the start point for the attractor path
    points[0] = start;

    // construct the points
    for( let i = 1; i < nPoints; ++i ) points[i] = calcPointRK4( points[i-1] );

    // get the centre of the points
    centrePoint  = getCentrePoint( points );

    // shift all the points by centrePoint to centre the geometry at the origin
    points.forEach( p => vec3.sub(p, p, centrePoint) );

    // set the bounding points - used to calculate shadow map
    boundingPoints = getBoundingPoints( points );

    // build the geometry from the points
    calcGeometryData( points, verts, norms, idxs, vertOffsets2, sharpEdges=sharpEdges );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
}


function updateRenderProgramUniforms() {

    // update the modelView matrix
    mat4.mul( uModelViewMatrix, uViewMatrix, uModelMatrix );

    // adjust the normal matrix to match the modelView matrix
    mat4.invert( uNormalMatrix, uModelViewMatrix );
    mat4.transpose( uNormalMatrix, uNormalMatrix );

    // put all the uniforms into the render program

    gl.uniform3fv(
        renderProgram.uViewPos,
        uViewPos
    );

    gl.uniform3fv(
        renderProgram.uSunPos,
        uSunPos
    );

    gl.uniformMatrix4fv(
        renderProgram.uProjectionMatrix,
        false, uProjectionMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uModelMatrix,
        false, uModelMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uModelViewMatrix,
        false, uModelViewMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uNormalMatrix,
        false, uNormalMatrix
    );

    gl.uniformMatrix4fv(
        renderProgram.uSunVPMatrix,
        false, uSunVPMatrix
    );

    gl.uniform1f(
        renderProgram.uShadowMapSize,
        false, uShadowMapSize
    );

    // bind the shadow map sampler to texture unit 1
    gl.uniform1i( renderProgram.uShadowMap, 1 );
}


function updateShadowMapProgramUniforms() {

    // update the sun projection matrix to fit the geometry to the shadow map

    // get the centre point in world space to point the sun at
    const pointsCentre = getCentrePoint( mapByMat4( boundingPoints, uModelMatrix ) );

    // project bounding points to sun's view space and get bounding box of them
    const sunViewSpaceBBox = getBBox( mapByMat4( boundingPoints, uModelSunViewMatrix ) );

    // calcuLate the required field of view and aspect
    const viewDist      = v3mod( v3sub(uSunPos, pointsCentre) );
    const verticalFOV   = Math.atan( Math.abs(sunViewSpaceBBox.top - sunViewSpaceBBox.bottom) / 2 / viewDist ) * 2.2
    const horizontalFOV = Math.atan( Math.abs(sunViewSpaceBBox.right - sunViewSpaceBBox.left) / 2 / viewDist ) * 2.2
    const aspect        = horizontalFOV / verticalFOV;

    // set the near and far clipping planes
    const zNear = Math.abs(sunViewSpaceBBox.front) * 0.9;
    const zFar  = Math.abs(sunViewSpaceBBox.back ) * 1.1;

    // console.log(zNear, zFar)


    mat4.perspective( uSunProjectionMatrix, verticalFOV, aspect, zNear, zFar );

    // update the sun mvp matrices
    mat4.lookAt( uSunViewMatrix, uSunPos, pointsCentre, [0,1,0] );
    mat4.mul( uModelSunViewMatrix, uSunViewMatrix, uModelMatrix );
    mat4.mul( uSunVPMatrix, uSunProjectionMatrix, uSunViewMatrix );

    // put all the uniforms into the shadow map program

    gl.uniform3fv(
        shadowMapProgram.uSunPos,
        uSunPos
    );

    gl.uniformMatrix4fv(
        shadowMapProgram.uSunProjectionMatrix,
        false, uSunProjectionMatrix
    );

    gl.uniformMatrix4fv(
        shadowMapProgram.uModelSunViewMatrix,
        false, uModelSunViewMatrix
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
    renderProgram.uModelMatrix      = gl.getUniformLocation( renderProgram, 'uModelMatrix'      );
    renderProgram.uModelViewMatrix  = gl.getUniformLocation( renderProgram, 'uModelViewMatrix'  );
    renderProgram.uSunVPMatrix      = gl.getUniformLocation( renderProgram, 'uSunVPMatrix'      );
    renderProgram.uShadowMap        = gl.getUniformLocation( renderProgram, 'uShadowMap'        );
    renderProgram.uShadowMapSize    = gl.getUniformLocation( renderProgram, 'uShadowMapSize'    );

    renderProgram.aVertexPosition   = gl.getAttribLocation(  renderProgram, 'aVertexPosition'   );
    renderProgram.aVertexNormal     = gl.getAttribLocation(  renderProgram, 'aVertexNormal'     );

    renderProgram.positionBuffer    = positionBuffer;
    renderProgram.normalBuffer      = normalBuffer;
    renderProgram.indexBuffer       = indexBuffer;

    // enable the vertex array buffers
    enableArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    enableArrayBuffer( gl, renderProgram.aVertexNormal  , renderProgram.normalBuffer   );

    return renderProgram;
}


function makeShadowMapProgram() {

    // make the shadow map program
    const shadowMapProgram = makeShaderProgram( gl, vShadowShaderSource, fShadowShaderSource );

    // set vars in the shadow map program
    shadowMapProgram.uSunPos              = gl.getUniformLocation( shadowMapProgram, 'uSunPos'              );
    shadowMapProgram.uSunProjectionMatrix = gl.getUniformLocation( shadowMapProgram, 'uSunProjectionMatrix' );
    shadowMapProgram.uModelSunViewMatrix  = gl.getUniformLocation( shadowMapProgram, 'uModelSunViewMatrix'  );

    shadowMapProgram.aVertexPosition      = gl.getAttribLocation(  shadowMapProgram, 'aVertexPosition' );

    shadowMapProgram.positionBuffer       = positionBuffer;
    shadowMapProgram.indexBuffer          = indexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, shadowMapProgram.aVertexPosition, shadowMapProgram.positionBuffer );

    return shadowMapProgram;
}


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
const uModelMatrix         = mat4.create();

const uViewMatrix          = mat4.create();
const uModelViewMatrix     = mat4.create();
const uProjectionMatrix    = mat4.create();
const uNormalMatrix        = mat4.create();

const uSunViewMatrix       = mat4.create();
const uModelSunViewMatrix  = mat4.create();
const uSunProjectionMatrix = mat4.create();
const uSunVPMatrix         = mat4.create();

const uViewPos = [0, 0, 90];
const uSunPos  = [100, 100, 100];

let boundingPoints = [];

// make the data buffers
const positionBuffer = createBuffer( gl, gl.ARRAY_BUFFER        , verts );
const normalBuffer   = createBuffer( gl, gl.ARRAY_BUFFER        , norms );
const indexBuffer    = createBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, idxs  );

// setup the viewpoint and sun viewpoint
mat4.lookAt( uViewMatrix   , uViewPos, [0,0,0], [0,1,0] );
mat4.lookAt( uSunViewMatrix, uSunPos , [0,0,0], [0,1,0] );

// allow the canvas to handle resizing
handleCanvasResize( gl, canvas, uProjectionMatrix );

// make the shadow map program and framebuffer
const shadowMapProgram = makeShadowMapProgram();
const uShadowMapSize = Math.max(canvas.width*2, canvas.height*2);
const [shadowMapDepthFramebuffer, shadowMapDepthTexture] = createShadowMap( gl, uShadowMapSize, uShadowMapSize );
// const [aoDepthFramebuffer, aoDepthTexture]               = createShadowMap( gl, uShadowMapSize, uShadowMapSize, );

// make and use the render program
const renderProgram = makeRenderProgram();
gl.useProgram( renderProgram );

// make the geometry
updateGeometry();

// start the draw loop
drawLoop( gl );

// initial scene draw
renderShadowMap();
renderShadowMap();
renderScene();
