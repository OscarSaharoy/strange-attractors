// Oscar Saharoy 2021


// master plan for amazing graphics
// draw as normal with fast renderer
// but if uniforms havent changed since last frame then
// start rendering scene to a texture
// draw again each frame with gl_Position of transformed vertices from vertex shader offset at subpixel level and AO and shadows jittered and blurred
// then blend this into the already drawn texture to antialias the scene
// accumulate graphics over a few frames then start displaying the accumulated image once its better than the single pass rendered one
// rendering many times over a few frames allows us to multiply the power of the gpu by the number of frames rendered, allowing eg global illumination using textures/buffers to store data between passes.

// todo: fix end caps
// fix number of points calculation


// map array of points by a mat4
const mapByMat4 = ( inPoints, M ) => boundingPoints.map( p => vec3.transformMat4(vec3.create(), p, M) );


function drawLoop( gl ) {

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl ) );

    // run the pan and zoom routine (canvas-control.js)
    panAndZoom();

    // stop if we don't need to redraw
    if( !shouldRedraw ) return;

    enableArrayBuffer( gl, imageEffectVerts );
    enableArrayBuffer( gl, imageEffectIdxs  );

    // render graphics
    // testShadowMap();
    // renderShadowMap();
    // renderShadows();
    renderDepthBuffer();
    // testDepthBuffer();
    // renderAmbientOcclusion();
    testAmbientOcclusion();
    // renderScene();

    shouldRedraw = false;
}


function renderShadowMap() {

    // use normal geometry buffer and element array buffer
    useArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );

    // bind and clear the shadow map framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, shadowMapFramebuffer );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport( 0, 0, uShadowMapSize, uShadowMapSize );

    // use the shadow map program and update its uniforms
    gl.useProgram(shadowMapProgram);
    updateShadowMapProgramUniforms();

    // render the shadow map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function testShadowMap() {

    // use normal geometry buffer and element array buffer
    useArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram );
    updateRenderProgramUniforms();

    // bind and clear the canvas
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // use the shadow map program and update its uniforms
    gl.useProgram( shadowMapProgram );
    updateShadowMapProgramUniforms();

    // render the shadow map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function renderDepthBuffer() {

    // use normal geometry buffer and element array buffer
    useArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );

    // bind and clear the depth framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, depthFramebuffer );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport( 0, 0, canvas.width, canvas.height );

    // use the depth program and update its uniforms
    gl.useProgram( depthProgram );
    updateDepthProgramUniforms();

    // render the depth map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function testDepthBuffer() {

    // use normal geometry buffer and element array buffer
    useArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram );
    updateRenderProgramUniforms();

    // bind and clear the canvas
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport( 0, 0, canvas.width, canvas.height );

    // use the depth program and update its uniforms
    gl.useProgram( depthProgram );
    updateDepthProgramUniforms();

    // render the depth map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function renderAmbientOcclusion() {

    // bind and clear the ambient occlusion framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, ambientOcclusionFramebuffer );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport( 0, 0, canvas.width, canvas.height );

    // use the ambient occlusion program and update its uniforms
    gl.useProgram( ambientOcclusionProgram );
    updateAmbientOcclusionProgramUniforms();

    // render the occlusion map
    gl.drawElements( gl.TRIANGLES, 24, gl.UNSIGNED_INT, 0 );
}


function testAmbientOcclusion() {

    // set us to use the image effect vertex positions buffer
    useArrayBuffer( gl, ambientOcclusionProgram.aVertexPosition, ambientOcclusionProgram.positionBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, imageEffectIndexBuffer );

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram );
    updateRenderProgramUniforms();

    // bind and clear the canvas
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport( 0, 0, canvas.width, canvas.height );

    // use the ambient occlusion program and update its uniforms
    gl.useProgram( ambientOcclusionProgram );
    updateAmbientOcclusionProgramUniforms();

    // render the occlusion map
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
}


function renderScene() {

    // use normal geometry buffer and element array buffer
    useArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );

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
    for( let i = 1; i < nPoints; ++i ) points[i] = calcPointRK4( points[i-1], dt );

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

     // get the centre point in world space to point the sun at
    const pointsCentre = getCentrePoint( mapByMat4( boundingPoints, uModelMatrix ) );

    // project bounding points to view space and get bounding box of them
    const viewSpaceBBox = getBBox( mapByMat4( boundingPoints, uModelViewMatrix ) );

    // set the near and far clipping planes
    const zMid  = ( viewSpaceBBox.front + viewSpaceBBox.back ) / 2;
    const zNear =  - zMid + ( zMid - viewSpaceBBox.front ) * 1.1;
    const zFar  =  - zMid + ( zMid - viewSpaceBBox.back  ) * 1.1;

    // generate the projection matrix
    mat4.perspective( uProjectionMatrix, 45 * Math.PI / 180, canvas.width/canvas.height, Math.max(zNear, 1), zFar );

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
        uShadowMapSize
    );

    gl.uniform2fv(
        renderProgram.uSampleOffsets,
        new Float32Array( [ 0.282571,  0.023957, 
                           -0.792657, -0.945738, 
                            0.922361,  0.411756, 
                           -0.165838,  0.552995, 
                           -0.566027, -0.216651, 
                            0.335398, -0.783654, 
                            0.019074, -0.318522, 
                           -0.647572,  0.581896 ] )
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
    const zMid  = ( sunViewSpaceBBox.front + sunViewSpaceBBox.back ) / 2;
    const zNear =  - zMid + ( zMid - sunViewSpaceBBox.front ) * 1.1;
    const zFar  =  - zMid + ( zMid - sunViewSpaceBBox.back  ) * 1.1;

    // generate the projection matrix
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


function updateDepthProgramUniforms() {

    // put the MVP matrices into the depth shader program
    gl.uniformMatrix4fv(
        depthProgram.uProjectionMatrix,
        false, uProjectionMatrix
    );

    gl.uniformMatrix4fv(
        depthProgram.uNormalMatrix,
        false, uNormalMatrix
    );

    gl.uniformMatrix4fv(
        depthProgram.uModelViewMatrix,
        false, uModelViewMatrix
    );
}

function updateAmbientOcclusionProgramUniforms() {

    // put the MVP matrices into the program
    gl.uniformMatrix4fv(
        ambientOcclusionProgram.uProjectionMatrix,
        false, uProjectionMatrix
    );

    gl.uniformMatrix4fv(
        ambientOcclusionProgram.uModelViewMatrix,
        false, uModelViewMatrix
    );

    // bind the depth map sampler to texture unit 3
    gl.uniform1i( ambientOcclusionProgram.uDepthMap, 3 );
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
    renderProgram.uSampleOffsets    = gl.getUniformLocation( renderProgram, 'uSampleOffsets'    );

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

    shadowMapProgram.aVertexPosition      = gl.getAttribLocation(  shadowMapProgram, 'aVertexPosition'      );

    shadowMapProgram.positionBuffer       = positionBuffer;
    shadowMapProgram.indexBuffer          = indexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, shadowMapProgram.aVertexPosition, shadowMapProgram.positionBuffer );

    return shadowMapProgram;
}



function makeDepthProgram() {

    // make the depth program
    const depthProgram = makeShaderProgram( gl, vDepthShaderSource, fDepthShaderSource );

    // set vars in the depth program
    depthProgram.uProjectionMatrix = gl.getUniformLocation( depthProgram, 'uProjectionMatrix' );
    depthProgram.uNormalMatrix     = gl.getUniformLocation( depthProgram, 'uNormalMatrix'     );
    depthProgram.uModelViewMatrix  = gl.getUniformLocation( depthProgram, 'uModelViewMatrix'  );

    depthProgram.aVertexPosition   = gl.getAttribLocation(  depthProgram, 'aVertexPosition'   );

    depthProgram.positionBuffer    = positionBuffer;
    depthProgram.normalBuffer      = normalBuffer;
    depthProgram.indexBuffer       = indexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, depthProgram.aVertexPosition, depthProgram.positionBuffer );
    enableArrayBuffer( gl, depthProgram.aVertexNormal  , depthProgram.normalBuffer   );

    return depthProgram;
}



function makeAmbientOcclusionProgram() {

    // make the ambient occlusion program
    const ambientOcclusionProgram = makeShaderProgram( gl, vAmbientOcclusionShaderSource, fAmbientOcclusionShaderSource );

    // set vars in the ambient occlusion program
    ambientOcclusionProgram.uDepthMap       = gl.getUniformLocation( ambientOcclusionProgram, 'uDepthMap'       );
    ambientOcclusionProgram.aVertexPosition = gl.getAttribLocation(  ambientOcclusionProgram, 'aVertexPosition' );

    ambientOcclusionProgram.positionBuffer  = imageEffectPositionBuffer;
    ambientOcclusionProgram.indexBuffer     = imageEffectIndexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, ambientOcclusionProgram.aVertexPosition, ambientOcclusionProgram.positionBuffer );

    return ambientOcclusionProgram;
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


// define arrays for image effect shaders - 1 quad covering screen
let imageEffectVerts = Float32Array.from(
    [ -1, -1, 0,
       1, -1, 0,
       1,  1, 0,
      -1,  1, 0 ]
);

let imageEffectIdxs  = Uint32Array.from(
    [ 0, 1, 2, 0, 2, 3 ]
);


// get the webgl drawing context and canvas
const [gl, canvas] = initgl( "glcanvas" );

// allow the canvas to handle resizing
handleCanvasResize( gl, canvas );

// set canvas to redraw on resize
new ResizeObserver( () => shouldRedraw = true ).observe( canvas );

// create the matrices we need
const uModelMatrix           = mat4.create();
  
const uViewMatrix            = mat4.create();
const uModelViewMatrix       = mat4.create();
const uProjectionMatrix      = mat4.create();
const uNormalMatrix          = mat4.create();
  
const uSunViewMatrix         = mat4.create();
const uModelSunViewMatrix    = mat4.create();
const uSunProjectionMatrix   = mat4.create();
const uSunVPMatrix           = mat4.create();

const uDepthProjectionMatrix = mat4.create();

const uViewPos = [0, 0, 90];
const uSunPos  = [100, 100, 100];

let boundingPoints = [];

// make the data buffers
const positionBuffer = createBuffer( gl, gl.ARRAY_BUFFER        , verts );
const normalBuffer   = createBuffer( gl, gl.ARRAY_BUFFER        , norms );
const indexBuffer    = createBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, idxs  );

// make the image effect data buffers
const imageEffectPositionBuffer = createBuffer( gl, gl.ARRAY_BUFFER        , imageEffectVerts );
const imageEffectIndexBuffer    = createBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, imageEffectIdxs  );

// setup the viewpoint and sun viewpoint
mat4.lookAt( uViewMatrix   , uViewPos, [0,0,0], [0,1,0] );
mat4.lookAt( uSunViewMatrix, uSunPos , [0,0,0], [0,1,0] );

// make the shadow map program and framebuffer
const shadowMapProgram     = makeShadowMapProgram();
const uShadowMapSize       = Math.max(canvas.width, canvas.height);
const shadowMapFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE0, gl.TEXTURE1 );

// create the depth program and framebuffer
const depthProgram     = makeDepthProgram();
const depthFramebuffer = createFramebuffer( gl, canvas.width, canvas.height, gl.TEXTURE2, gl.TEXTURE3 );

// create the ambient occlusion program and framebuffer
const ambientOcclusionProgram     = makeAmbientOcclusionProgram();
const ambientOcclusionFramebuffer = createFramebuffer( gl, canvas.width, canvas.height, gl.TEXTURE4, gl.TEXTURE5 );

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
