// Oscar Saharoy 2021


function initgl( canvasID ) {

    // get canvas and webgl context
    const canvas = document.getElementById( canvasID );
    const gl     = canvas.getContext("webgl");

    // try to enable the uint index extension to allow more verts
    if( !gl.getExtension('OES_element_index_uint') )
        
        // if its not supported give an error message
        return console.log( "WebGL extension OES_element_index_uint not supported :(" );

    // set the background to transparent
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);

    // enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // enable backface culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    return [gl, canvas];
}


function handleCanvasResize( gl, canvas, projectionMatrix ) {

    // link resize function to be called when canvas changes size
    new ResizeObserver( () => onCanvasResize( gl, canvas, projectionMatrix ) ).observe( canvas );
    onCanvasResize( gl, canvas, projectionMatrix );
}


function onCanvasResize( gl, canvas, projectionMatrix ) {

    // set canvas to have 1:1 canvas pixel to screen pixel ratio
    const boundingRect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width  = boundingRect.width  * dpr;
    canvas.height = boundingRect.height * dpr;

    // set clip space to match up to canvas corners
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // match the projection matrix to the current aspect ratio
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear  = 1;
    const zFar   = 1000.0;

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
}


function loadShader(gl, type, source) {
  
    // create the shader object
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);
    
    if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
        
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


function makeShaderProgram( gl, vsSource, fsSource ) {
  
    // load both vertex and fragment shaders
    const vertexShader   = loadShader(gl, gl.VERTEX_SHADER,   vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();

    // link the program
    gl.attachShader( shaderProgram, vertexShader   );
    gl.attachShader( shaderProgram, fragmentShader );
    gl.linkProgram(  shaderProgram                 );

    return shaderProgram;
}


// target: the binding point
//      gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER
// dataArray: the data that will go in the buffer
//      a Float32Array for gl.ARRAY_BUFFER or Uint32Array for gl.ELEMENT_ARRAY_BUFFER    

function createBuffer( gl, target, dataArray ) {

    // create the buffer object
    const buffer = gl.createBuffer();

    // fill the buffer
    fillBuffer( gl, target, buffer, dataArray );

    return buffer;
}


function createTexture( gl, width, height ) {

    // create the texture
    const texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );

    // texture settings for level 0
    const level          = 0;
    const internalFormat = gl.RGBA;
    const border         = 0;
    const format         = gl.RGBA;
    const type           = gl.UNSIGNED_BYTE;
    const data           = null;
 
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border,
                  format, type, data);

    // set the filtering so we don't need mips
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR        );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S    , gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T    , gl.CLAMP_TO_EDGE );

    return texture;
}


function createFramebuffer( gl, texture ) {

    // create the framebuffer
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level           = 0;
    gl.framebufferTexture2D( gl.FRAMEBUFFER, attachmentPoint,
                             gl.TEXTURE_2D , texture, level );

    return framebuffer;
}


function fillBuffer( gl, target, buffer, dataArray ) {

    // bind the buffer and fill the data into it
    gl.bindBuffer( target, buffer );
    gl.bufferData( target, dataArray, gl.STATIC_DRAW );
}


function setupPointer( gl, attribute, buffer ) {

    // enable the vertex position array attribute
    gl.enableVertexAttribArray( attribute );

    // bind the buffer containing the attractor geometry    
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );

    // setup the pointer in that array
    gl.vertexAttribPointer( attribute, 3, gl.FLOAT, false, 0, 0 );
}
