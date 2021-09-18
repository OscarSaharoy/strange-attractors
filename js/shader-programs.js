// Oscar Saharoy 2021

// map array of points by a mat4
const mapByMat4 = ( inPoints, M ) => boundingPoints.map( p => vec3.transformMat4(vec3.create(), p, M) );


// too many args
// better but still wack
function setupDrawCall( program, renderToCanvas=false, viewportSizeX=null, viewportSizeY=null ) {

    // use the right position and index buffers
    gl.bindBuffer( gl.ARRAY_BUFFER, program.positionBuffer );
    gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, program.indexBuffer );

    // set the clearColor to use
    gl.clearColor( ...( program.clearColor ?? [0,0,0,0] ) );

    // bind and clear the framebuffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, renderToCanvas ? null : program.framebuffer );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // update viewport size
    gl.viewport( 0, 0, viewportSizeX ?? canvas.width  ,
                       viewportSizeY ?? canvas.height );

    // switch to the program and update the uniforms
    gl.useProgram( program.program );
    program.uniformUpdateFunc();
}


function renderShadowMap() {

    // setup the shadow map draw call
    setupDrawCall( shadowMapProgram, renderToCanvas=false,
                   viewportSizeX=uShadowMapSize, viewportSizeY=uShadowMapSize );

    // render the shadow map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function testShadowMap() {

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram.program );
    updateRenderProgramUniforms();

    // setup the shadows draw call
    setupDrawCall( shadowMapProgram, renderToCanvas=true );

    // render the shadow map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function renderDepthBuffer() {

    // setup the depth draw call
    setupDrawCall( depthProgram, renderToCanvas=false,
                   viewportSizeX=uShadowMapSize, viewportSizeY=uShadowMapSize );

    // render the depth map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function testDepthBuffer() {

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram, renderToCanvas=true );
    updateRenderProgramUniforms();

    // setup the depth draw call
    setupDrawCall( depthProgram, renderToCanvas=true );

    // render the depth map
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function renderAmbientOcclusion() {

    // setup the draw call
    setupDrawCall( ambientOcclusionProgram, renderToCanvas=false,
                   viewportSizeX=uShadowMapSize, viewportSizeY=uShadowMapSize );

    // render the occlusion map
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
}


function testAmbientOcclusion() {

    // swtich to render program to update the uniforms
    gl.useProgram( renderProgram );
    updateRenderProgramUniforms();

    // setup the draw call
    setupDrawCall( ambientOcclusionProgram, renderToCanvas=true );

    // render the occlusion map
    gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0 );
}


function renderScene() {

    // setup the render draw call
    setupDrawCall( renderProgram );

    // draw to the canvas
    gl.drawElements( gl.TRIANGLES, nVerts*3, gl.UNSIGNED_INT, 0 );
}


function updateMVPMatrices() {

    // increment the frame uniform
    uFrame = ( uFrame + 1 ) % 100;

    // update the modelView matrix
    mat4.mul( uModelViewMatrix, uViewMatrix, uModelMatrix );

    // adjust the normal matrix to match the modelView matrix
    mat4.invert( uNormalMatrix, uModelViewMatrix );
    mat4.transpose( uNormalMatrix, uNormalMatrix );

    // project bounding points to view space and get bounding box of them
    const viewSpaceBBox = getBBox( mapByMat4( boundingPoints, uModelViewMatrix ) );

    // set the near and far clipping planes
    let zMid  = ( viewSpaceBBox.front + viewSpaceBBox.back ) / 2;
    let zNear =  - zMid + ( zMid - viewSpaceBBox.front ) * 1.1;
    let zFar  =  - zMid + ( zMid - viewSpaceBBox.back  ) * 1.1;

    // generate the projection matrix
    mat4.perspective( uProjectionMatrix, 45 * Math.PI / 180, canvas.width/canvas.height, Math.max(zNear, 0.1), zFar );

    // get the inverse projection matrix
    mat4.invert( uInverseProjectionMatrix, uProjectionMatrix );

    // get bounding points for the geometry in clip space
    clipSpaceBpoints = mapByMat4( boundingPoints, mat4.mul([], uProjectionMatrix, uModelViewMatrix) );

    // get the furthest left point of the clip space bounding box
    clipSpaceBBox = getBBox( clipSpaceBpoints );
    furthestLeft  = clipSpaceBBox.left;

    // place bounding box corners
    // const csbp = clipSpaceBpoints;
    // if( csbp.length )
    //     Array.from( document.querySelectorAll( ".marker" ) )
    //         .forEach( (elm,i) => elm.style.transform = `translateX(${ csbp[i][0]*50+50 }vw) translateY(${ -csbp[i][1]*50+50 }vh)` );

    // update the sun projection matrix to fit the geometry to the shadow map

    // get the centre point in world space to point the sun at
    const pointsCentre = getCentrePoint( mapByMat4( boundingPoints, uModelMatrix ) );

    // project bounding points to sun's view space and get bounding box of them
    const sunViewSpaceBBox = getBBox( mapByMat4( boundingPoints, uModelSunViewMatrix ) );

    // calcuLate the required field of view and aspect
    const viewDist      = v3mod( v3sub(uSunPos, pointsCentre) );
    const verticalFOV   = Math.atan( Math.abs(sunViewSpaceBBox.top - sunViewSpaceBBox.bottom) / 2 / viewDist ) * 2.2;// + (Math.random()-0.5)/300;
    const horizontalFOV = Math.atan( Math.abs(sunViewSpaceBBox.right - sunViewSpaceBBox.left) / 2 / viewDist ) * 2.2;// + (Math.random()-0.5)/300;
    const aspect        = horizontalFOV / verticalFOV;

    // set the near and far clipping planes
    zMid  = ( sunViewSpaceBBox.front + sunViewSpaceBBox.back ) / 2;
    zNear =  - zMid + ( zMid - sunViewSpaceBBox.front ) * 1.1;
    zFar  =  - zMid + ( zMid - sunViewSpaceBBox.back  ) * 1.1;

    // generate the projection matrix
    mat4.perspective( uSunProjectionMatrix, verticalFOV, aspect, zNear, zFar );

    // update the sun mvp matrices
    mat4.lookAt( uSunViewMatrix, uSunPos, pointsCentre, [0,1,0] );
    mat4.mul( uModelSunViewMatrix, uSunViewMatrix, uModelMatrix );
    mat4.mul( uSunVPMatrix, uSunProjectionMatrix, uSunViewMatrix );
}


function updateRenderProgramUniforms() {

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

    gl.uniform1i( renderProgram.uFrame, uFrame );
    
    gl.uniform1i( renderProgram.uFloatTexturesAvailable, uFloatTexturesAvailable );

    gl.uniform1i( renderProgram.uOcclusionMap, 5 );
}


function updateShadowMapProgramUniforms() {

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
        depthProgram.uModelMatrix,
        false, uModelMatrix
    );

    gl.uniformMatrix4fv(
        depthProgram.uViewMatrix,
        false, uViewMatrix
    );

    gl.uniformMatrix4fv(
        depthProgram.uProjectionMatrix,
        false, uProjectionMatrix
    );

    gl.uniformMatrix4fv(
        depthProgram.uNormalMatrix,
        false, uNormalMatrix
    );
}

function updateAmbientOcclusionProgramUniforms() {

    gl.uniform1f( ambientOcclusionProgram.uProfileWidth, uProfileWidth );

    // put the MVP matrices into the program
    gl.uniformMatrix4fv(
        ambientOcclusionProgram.uInverseProjectionMatrix,
        false, uInverseProjectionMatrix
    );

    gl.uniformMatrix4fv(
        ambientOcclusionProgram.uProjectionMatrix,
        false, uProjectionMatrix
    );

    // bind the depth map sampler to texture unit 3
    gl.uniform1i( ambientOcclusionProgram.uDepthMap, 3 );

    gl.uniform3fv(
        ambientOcclusionProgram.uSampleOffsets,
        new Float32Array( [ 0.28,  0.02, 0.70,
                           -0.09, -0.04, 0.05,
                            0.92,  0.41, 0.30,
                           -0.16,  0.55, 0.70,
                           -0.56, -0.21, 0.50,
                            0.33, -0.78, 0.10,
                            0.01, -0.31, 0.90,
                           -0.64,  0.58, 0.40 ] )
    );
}


function makeRenderProgram() {

    const renderProgram = {};

    // make the render program
    renderProgram.program = makeShaderProgram( gl, vsSource, fsSource );

    // set vars in the render program
    renderProgram.uViewPos                = gl.getUniformLocation( renderProgram.program, 'uViewPos'                );
    renderProgram.uSunPos                 = gl.getUniformLocation( renderProgram.program, 'uSunPos'                 );
    renderProgram.uNormalMatrix           = gl.getUniformLocation( renderProgram.program, 'uNormalMatrix'           );
    renderProgram.uProjectionMatrix       = gl.getUniformLocation( renderProgram.program, 'uProjectionMatrix'       );
    renderProgram.uModelMatrix            = gl.getUniformLocation( renderProgram.program, 'uModelMatrix'            );
    renderProgram.uModelViewMatrix        = gl.getUniformLocation( renderProgram.program, 'uModelViewMatrix'        );
    renderProgram.uSunVPMatrix            = gl.getUniformLocation( renderProgram.program, 'uSunVPMatrix'            );
    renderProgram.uShadowMap              = gl.getUniformLocation( renderProgram.program, 'uShadowMap'              );
    renderProgram.uOcclusionMap           = gl.getUniformLocation( renderProgram.program, 'uOcclusionMap'           );
    renderProgram.uShadowMapSize          = gl.getUniformLocation( renderProgram.program, 'uShadowMapSize'          );
    renderProgram.uSampleOffsets          = gl.getUniformLocation( renderProgram.program, 'uSampleOffsets'          );
    renderProgram.uFrame                  = gl.getUniformLocation( renderProgram.program, 'uFrame'                  );
    renderProgram.uFloatTexturesAvailable = gl.getUniformLocation( renderProgram.program, 'uFloatTexturesAvailable' );

    renderProgram.aVertexPosition = gl.getAttribLocation(  renderProgram.program, 'aVertexPosition'   );
    renderProgram.aVertexNormal   = gl.getAttribLocation(  renderProgram.program, 'aVertexNormal'     );

    renderProgram.positionBuffer  = positionBuffer;
    renderProgram.normalBuffer    = normalBuffer;
    renderProgram.indexBuffer     = indexBuffer;

    // enable the vertex array buffers
    enableArrayBuffer( gl, renderProgram.aVertexPosition, renderProgram.positionBuffer );
    enableArrayBuffer( gl, renderProgram.aVertexNormal  , renderProgram.normalBuffer   );

    // set additional program data
    renderProgram.uniformUpdateFunc = updateRenderProgramUniforms;
    renderProgram.framebuffer = null;

    return renderProgram;
}


function makeShadowMapProgram() {

    const shadowMapProgram = {};

    // make the shadow map program
    shadowMapProgram.program = makeShaderProgram( gl, vShadowShaderSource, fShadowShaderSource );

    // set vars in the shadow map program
    shadowMapProgram.uSunPos              = gl.getUniformLocation( shadowMapProgram.program, 'uSunPos'              );
    shadowMapProgram.uSunProjectionMatrix = gl.getUniformLocation( shadowMapProgram.program, 'uSunProjectionMatrix' );
    shadowMapProgram.uModelSunViewMatrix  = gl.getUniformLocation( shadowMapProgram.program, 'uModelSunViewMatrix'  );

    shadowMapProgram.aVertexPosition      = gl.getAttribLocation(  shadowMapProgram.program, 'aVertexPosition'      );

    shadowMapProgram.positionBuffer       = positionBuffer;
    shadowMapProgram.indexBuffer          = indexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, shadowMapProgram.aVertexPosition, shadowMapProgram.positionBuffer );

    // set additional program data
    shadowMapProgram.uniformUpdateFunc = updateShadowMapProgramUniforms;
    shadowMapProgram.framebuffer       = shadowMapFramebuffer;
    shadowMapProgram.clearColor        = [ 1.0, 1.0, 1.0, 1.0 ];

    return shadowMapProgram;
}



function makeDepthProgram() {

    const depthProgram = {};

    // make the depth program
    depthProgram.program = makeShaderProgram( gl, vDepthShaderSource, fDepthShaderSource );

    // set vars in the depth program
    depthProgram.uViewMatrix       = gl.getUniformLocation( depthProgram.program, 'uViewMatrix'       );
    depthProgram.uModelMatrix      = gl.getUniformLocation( depthProgram.program, 'uModelMatrix'      );
    depthProgram.uProjectionMatrix = gl.getUniformLocation( depthProgram.program, 'uProjectionMatrix' );
    depthProgram.uNormalMatrix     = gl.getUniformLocation( depthProgram.program, 'uNormalMatrix'     );

    depthProgram.aVertexPosition   = gl.getAttribLocation(  depthProgram.program, 'aVertexPosition'   );

    depthProgram.positionBuffer    = positionBuffer;
    depthProgram.normalBuffer      = normalBuffer;
    depthProgram.indexBuffer       = indexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, depthProgram.aVertexPosition, depthProgram.positionBuffer );
    enableArrayBuffer( gl, depthProgram.aVertexNormal  , depthProgram.normalBuffer   );

    // set additional program data
    depthProgram.uniformUpdateFunc = updateDepthProgramUniforms;
    depthProgram.framebuffer       = depthFramebuffer;
    depthProgram.clearColor        = [ 0.0, 0.0, 0.0, 1e+8 ];

    return depthProgram;
}



function makeAmbientOcclusionProgram() {

    const ambientOcclusionProgram = {};

    // make the ambient occlusion program
    ambientOcclusionProgram.program = makeShaderProgram( gl, vAmbientOcclusionShaderSource, fAmbientOcclusionShaderSource );

    // set vars in the ambient occlusion program
    ambientOcclusionProgram.uProfileWidth            = gl.getUniformLocation( ambientOcclusionProgram.program, 'uProfileWidth'            );
    ambientOcclusionProgram.uInverseProjectionMatrix = gl.getUniformLocation( ambientOcclusionProgram.program, 'uInverseProjectionMatrix' );
    ambientOcclusionProgram.uProjectionMatrix        = gl.getUniformLocation( ambientOcclusionProgram.program, 'uProjectionMatrix'        );
    ambientOcclusionProgram.uSampleOffsets           = gl.getUniformLocation( ambientOcclusionProgram.program, 'uSampleOffsets'           );
    ambientOcclusionProgram.uDepthMap                = gl.getUniformLocation( ambientOcclusionProgram.program, 'uDepthMap'                );
    
    ambientOcclusionProgram.aVertexPosition          = gl.getAttribLocation(  ambientOcclusionProgram.program, 'aVertexPosition'          );

    ambientOcclusionProgram.positionBuffer           = imageEffectPositionBuffer;
    ambientOcclusionProgram.indexBuffer              = imageEffectIndexBuffer;

    // enable the vertex attributes
    enableArrayBuffer( gl, ambientOcclusionProgram.aVertexPosition, ambientOcclusionProgram.positionBuffer );

    // setup some program data
    ambientOcclusionProgram.uniformUpdateFunc = updateAmbientOcclusionProgramUniforms;
    ambientOcclusionProgram.framebuffer       = ambientOcclusionFramebuffer;

    return ambientOcclusionProgram;
}
