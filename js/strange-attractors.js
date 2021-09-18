// Oscar Saharoy 2021


// master plan for amazing graphics
// draw as normal with fast renderer
// but if uniforms havent changed since last frame then
// start rendering scene to a texture
// draw again each frame with gl_Position of transformed vertices from vertex shader offset at subpixel level and AO and shadows jittered and blurred
// then blend this into the already drawn texture to antialias the scene
// accumulate graphics over a few frames then start displaying the accumulated image once its better than the single pass rendered one
// rendering many times over a few frames allows us to multiply the power of the gpu by the number of frames rendered, allowing eg global illumination using textures/buffers to store data between passes.

// todo:

// first release
// mobile layout & ability to scroll - need to detect if mouse/pointer is inside projected bounding box
// download stl
// animate geometry generation

// stretch
// use webgl2 when possible
// reduce number of extensions needed
// performance tuning
// progressive rendering
// sliders (not that important)
// ray tracing?? (probably not)

// bugs:
// shadows are sometimes dodgy - all in shadow or light
// fix colour inputs
// sneaky texture packing in shadow shader glitches on mobile

// wont fix
// make sure you can see equations however long they are

function drawLoop( gl ) {

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl ) );

    // run the pan and zoom routine (canvas-control.js)
    panAndZoom();

    // update all the normal and projection matrices etc
    updateMVPMatrices();

    // stop if we don't need to redraw
    if( !shouldRedraw ) return;

    // render graphics

    renderShadowMap();
    // testShadowMap();
    if( uFloatTexturesAvailable ) renderDepthBuffer();
    // testDepthBuffer();
    if( uFloatTexturesAvailable ) renderAmbientOcclusion();
    // testAmbientOcclusion();
    renderScene();

    shouldRedraw = false;
}


function updateGeometry() {

    // set the start point for the attractor path
    points[0] = [...start];

    // construct the points
    for( let i = 1; i < nPoints; ++i ) points[i] = calcPointRK4( points[i-1], dt );

    // get the centre of the points
    centrePoint = getCentrePoint( points );

    // shift all the points by centrePoint to centre the geometry at the origin
    points.forEach( p => vec3.sub(p, p, centrePoint) );

    // set the bounding points - used to calculate shadow map
    boundingPoints = getBoundingPoints( points );

    // build the geometry from the points
    calcGeometryData( points, verts, norms, idxs, profile );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
}


// vertOffsets defines the cross section of the geometry 
let uProfileWidth = 1;

const squareProfile = width => 
                  [ [  width,  0    , 0 ] ,
                    [  0    ,  width, 0 ] ,
                    [ -width,  0    , 0 ] ,
                    [  0    , -width, 0 ] ];

const circleProfile = (n, width) => 
                    new Array(n)
                       .fill(null)
                       .map( (val,i) => 6.28*i/n )
                       .map( x => [ 0, width*Math.cos(x), width*Math.sin(x) ] );

const pentalobeProfile = width =>
                  [ [ 0, -0.619*width,  0.904*width ] ,
                    [ 0, -0.588*width,  0.809*width ] ,
                    [ 0, -0.951*width,  0.309*width ] ,
                    [ 0, -1.051*width,  0.309*width ] ,

                    [ 0, -1.051*width, -0.309*width ] ,
                    [ 0, -0.951*width, -0.309*width ] ,
                    [ 0, -0.588*width, -0.809*width ] ,
                    [ 0, -0.619*width, -0.904*width ] ,

                    [ 0, -0.031*width, -1.095*width ] ,
                    [ 0,  0.000*width, -1.000*width ] ,
                    [ 0,  0.588*width, -0.809*width ] ,
                    [ 0,  0.669*width, -0.868*width ] ,
                    [ 0,  1.032*width, -0.368*width ] , 
                    [ 0,  0.951*width, -0.309*width ] , 

                    [ 0,  0.951*width,  0.309*width ] , 
                    [ 0,  1.032*width,  0.368*width ] , 
                    [ 0,  0.669*width,  0.868*width ] ,
                    [ 0,  0.588*width,  0.809*width ] ,
                    [ 0,  0.000*width,  1.000*width ] ,
                    [ 0, -0.031*width,  1.095*width ] ];

const hexProfile = width =>
                    [ [ 0,  0.161*width,  0.906*width ],
                      [ 0,  0.866*width, -0.313*width ],
                      [ 0,  0.866*width,  0.313*width ],
                      [ 0,  0.161*width, -0.906*width ],
                      [ 0,  0.704*width, -0.593*width ],
                      [ 0, -0.704*width, -0.593*width ],
                      [ 0, -0.161*width, -0.906*width ],
                      [ 0, -0.866*width,  0.313*width ],
                      [ 0, -0.866*width, -0.313*width ],
                      [ 0, -0.161*width,  0.906*width ],
                      [ 0,  0.704*width,  0.593*width ],
                      [ 0, -0.704*width,  0.593*width ] ];



// calculation variables
let fr      = () => v3zero;
let dt      = 5e-3;
let nPoints = 3500;
let points  = new Array(nPoints);
let start   = [ 0.1, -0.1, 8.8 ];
let profile = pentalobeProfile( uProfileWidth );

// arrays that will contain the strange attractor geometry data
let nVerts = nPoints * 2 * profile.length + 1;
let verts  = new Float32Array( nVerts*3 );
let norms  = new Float32Array( nVerts*3 );
let idxs   = new Uint32Array(  nVerts*3 );


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
const uModelMatrix             = mat4.create();
const uViewMatrix              = mat4.create();
const uModelViewMatrix         = mat4.create();
const uProjectionMatrix        = mat4.create();
const uNormalMatrix            = mat4.create();
  
const uSunViewMatrix           = mat4.create();
const uModelSunViewMatrix      = mat4.create();
const uSunProjectionMatrix     = mat4.create();
const uSunVPMatrix             = mat4.create();

const uInverseProjectionMatrix = mat4.create();

let uFrame   = 0;
let uViewPos = [0, 0, 90];
let uSunPos  = [100, 100, 100];

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


// make and use the render program
const renderProgram = makeRenderProgram();

// make the shadow map program and framebuffer
const uShadowMapSize       = Math.max(canvas.width, canvas.height);
const shadowMapFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE0, gl.TEXTURE1 );
const shadowMapProgram     = makeShadowMapProgram();

let depthFramebuffer, depthProgram, ambientOcclusionFramebuffer, ambientOcclusionProgram;

// only create ambient occlusion textures if we have float textures
if( uFloatTexturesAvailable ) {

    // create the depth program and framebuffer
    depthFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE2, gl.TEXTURE3, floatTexture=true );
    depthProgram     = makeDepthProgram( depthFramebuffer );

    // create the ambient occlusion program and framebuffer
    ambientOcclusionFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE4, gl.TEXTURE5 );
    ambientOcclusionProgram     = makeAmbientOcclusionProgram( ambientOcclusionFramebuffer );
}

// start the draw loop
drawLoop( gl );
