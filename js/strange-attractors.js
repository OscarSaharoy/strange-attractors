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
// scrolling the ui only when not covered by geometry, and scrolling it shouldnt cause redraw
// sort out local axis alignment
// make sure you can see equations however long they are
// mobile layout
// use webgl2/dont require float textures
// reduce number of extensions needed
// make ui elements work on safari
// animate geometry generation
// performance tuning
// download stl
// progressive rendering
// sliders (not that important)
// ray tracing??

// bugs:
// shadows are sometimes dodgy - all in shadow or light


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
    renderDepthBuffer();
    // testDepthBuffer();
    renderAmbientOcclusion();
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
    calcGeometryData( points, verts, norms, idxs, profile, sharpEdges=sharpEdges );

    if( debugGeom = false ) {

        verts = Float32Array.from( [ 0, 0, 0,
                                     1, 0, 0,
                                     1, 1, 0,
                                     0, 1, 0,

                                     0, 0, 0,
                                     0, 0, 1,
                                     1, 0, 1,
                                     1, 0, 0 ] );

        norms = Float32Array.from( [ 0, 0, 1,
                                     0, 0, 1,
                                     0, 0, 1,
                                     0, 0, 1,

                                     0, 1, 0,
                                     0, 1, 0,
                                     0, 1, 0,
                                     0, 1, 0, ] );

        idxs  = Uint32Array.from(  [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7 ] );

        nVerts = 4;
    }

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
}


// vertOffsets defines the cross section of the geometry 
let uProfileWidth = 1;
let vertOffsets = [ 
                    { normal:  uProfileWidth, curve:  0             } ,
                    { normal:  0            , curve:  uProfileWidth } ,
                    { normal: -uProfileWidth, curve:  0             } ,
                    { normal:  0            , curve: -uProfileWidth } 
                  ];

let vertOffsets1 = ( n => new Array(n)
                             .fill(null)
                             .map( (val,i) => 6.28*i/n )
                             .map( x => ({normal: uProfileWidth*Math.cos(x), curve: uProfileWidth*Math.sin(x)}) ) 
                  )(10);

let vertOffsets2 = [ 
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


// calculation variables
let fr      = () => v3zero;
let dt      = 5e-3;
let nPoints = 3500;
let points  = new Array(nPoints);
let start   = [ 0.1, -0.1, 8.8 ];


// controls whether the mesh is rendered with sharp edges
let sharpEdges = true;
let profile = vertOffsets2;

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

// create the depth program and framebuffer
const depthFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE2, gl.TEXTURE3 );
const depthProgram     = makeDepthProgram();

// create the ambient occlusion program and framebuffer
const ambientOcclusionFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE4, gl.TEXTURE5 );
const ambientOcclusionProgram     = makeAmbientOcclusionProgram();


// start the draw loop
drawLoop( gl );
