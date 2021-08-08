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
// ray tracing??


function drawLoop( gl ) {

    // run again next frame
    requestAnimationFrame( () => drawLoop( gl ) );

    // run the pan and zoom routine (canvas-control.js)
    panAndZoom();

    // stop if we don't need to redraw
    if( !shouldRedraw ) return;

    updateMVPMatrices();

    // render graphics
    // renderShadowMap();
    // testShadowMap();
    // renderShadows();
    renderDepthBuffer();
    // testDepthBuffer();
    // renderAmbientOcclusion();
    testAmbientOcclusion();
    // renderScene();

    shouldRedraw = false;
}


function updateGeometry() {

    // set the start point for the attractor path
    points[0] = start;

    // construct the points
    for( let i = 1; i < nPoints; ++i ) points[i] = calcPointRK4( points[i-1], dt );

    // get the centre of the points
    centrePoint = getCentrePoint( points );

    // shift all the points by centrePoint to centre the geometry at the origin
    points.forEach( p => vec3.sub(p, p, centrePoint) );

    // set the bounding points - used to calculate shadow map
    boundingPoints = getBoundingPoints( points );

    // build the geometry from the points
    calcGeometryData( points, verts, norms, idxs, vertOffsets, sharpEdges=sharpEdges );

    // fill the buffers with the geometry data
    fillBuffer( gl, gl.ARRAY_BUFFER        , positionBuffer, verts );
    fillBuffer( gl, gl.ARRAY_BUFFER        , normalBuffer  , norms );
    fillBuffer( gl, gl.ELEMENT_ARRAY_BUFFER, indexBuffer   , idxs  );
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
const uShadowMapSize       = Math.max(canvas.width, canvas.height);
const shadowMapFramebuffer = createFramebuffer( gl, uShadowMapSize, uShadowMapSize, gl.TEXTURE0, gl.TEXTURE1 );
const shadowMapProgram     = makeShadowMapProgram();

// create the depth program and framebuffer
const depthFramebuffer = createFramebuffer( gl, canvas.width, canvas.height, gl.TEXTURE2, gl.TEXTURE3 );
const depthProgram     = makeDepthProgram();

// create the ambient occlusion program and framebuffer
const ambientOcclusionFramebuffer = createFramebuffer( gl, canvas.width, canvas.height, gl.TEXTURE4, gl.TEXTURE5 );
const ambientOcclusionProgram     = makeAmbientOcclusionProgram();

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
