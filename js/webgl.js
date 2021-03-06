// Oscar Saharoy 2021

let webgl2 = true;
let uFloatTexturesAvailable = true;

function initgl( canvasID ) {

    // get canvas and webgl context
    const canvas = document.getElementById( canvasID );

    // try to get webgl2 context but if not fallback to webgl1
    let gl = false;//canvas.getContext("webgl2", {antialias: true});
    
    if( !gl ) {

        gl = canvas.getContext("webgl", {antialias: true, preserveDrawingBuffer: true});
        webgl2 = false;

        // try to enable the uint index extension to allow more verts
        if( !gl.getExtension('OES_element_index_uint') )
            
            // if its not supported give an error message
            console.log( "WebGL extension OES_element_index_uint not supported :(" );


        if( !gl.getExtension('WEBGL_depth_texture') )

            console.log( "WebGL extension WEBGL_depth_texture not supported :(" );


        if( !gl.getExtension('OES_texture_float') ) {

            uFloatTexturesAvailable = false;
            console.log( "WebGL extension OES_texture_float not supported :(" );
        }

        if( uFloatTexturesAvailable && !gl.getExtension('OES_texture_float_linear') )

            console.log( "WebGL extension OES_texture_float_linear not supported :(" );
    }
    else {

        if( !gl.getExtension('EXT_color_buffer_float') )

           console.log( "WebGL2 extension EXT_color_buffer_float not supported :(" );
    }


    // set the background to transparent
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);

    // enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // enable backface culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // enable alignment to be more flexible - 1 byte
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    // this is meant to help in some situations
    gl.enableVertexAttribArray( 0 );

    return [gl, canvas];
}


function handleCanvasResize( gl, canvas ) {

    // link resize function to be called when canvas changes size
    new ResizeObserver( () => onCanvasResize( gl, canvas ) ).observe( canvas );
    onCanvasResize( gl, canvas );
}


function onCanvasResize( gl, canvas ) {

    // set canvas to have 1:1 canvas pixel to screen pixel ratio
    const boundingRect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;

    canvas.width  = boundingRect.width  * dpr;
    canvas.height = boundingRect.height * dpr;

    // set clip space to match up to canvas corners
    gl.viewport(0, 0, canvas.width, canvas.height);
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


function fillBuffer( gl, target, buffer, dataArray ) {

    // bind the buffer and fill the data into it
    gl.bindBuffer( target, buffer );
    gl.bufferData( target, dataArray, gl.STATIC_DRAW );
}


function enableArrayBuffer( gl, attribute, buffer ) {

    // enable the vertex attribute array
    gl.enableVertexAttribArray( attribute );

    // bind the buffer    
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );

    // setup the pointer in that array
    gl.vertexAttribPointer( attribute, 3, gl.FLOAT, false, 0, 0 );
}


function createFramebuffer( gl, width, height, depthTexUnit=gl.TEXTURE0, colorTexUnit=gl.TEXTURE1, floatTexture=false ) {

    // set depth texture unit active
    gl.activeTexture( depthTexUnit );

    // create the depth texture
    const depthTexture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, depthTexture );


    // need different internal format depending on webgl version
    const depthInternalFormat = webgl2 ? gl.DEPTH_COMPONENT16 : gl.DEPTH_COMPONENT;
 
    // setup the texture
    gl.texImage2D(
        gl.TEXTURE_2D,       // target
        0,                   // mip level
        depthInternalFormat, // internal format
        width,               // width
        height,              // height
        0,                   // border
        gl.DEPTH_COMPONENT,  // format
        gl.UNSIGNED_INT,     // type
        null                 // data
    );

    // set the filtering so we don't need mips
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST         );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST         );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S    , gl.MIRRORED_REPEAT );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T    , gl.MIRRORED_REPEAT );

    // create a framebuffer
    const newFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, newFramebuffer );

    // setup the framebuffer
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // target
        gl.DEPTH_ATTACHMENT,  // attachment point
        gl.TEXTURE_2D,        // texture target
        depthTexture,         // texture
        0                     // mip level
    );

    // set color texture unit active
    gl.activeTexture( colorTexUnit );

    // create an unused color texture of the same size as the depth texture
    const colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    // need different internal format depending on webgl version
    let colorInternalFormat = webgl2 ? gl.RGBA32F : gl.RGBA;
    colorInternalFormat     = floatTexture ? colorInternalFormat : gl.RGBA;

    // set format depending on whether we're using a float texture or not
    const colorFormat = floatTexture ? gl.FLOAT : gl.UNSIGNED_BYTE;

    // setup that texture
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        colorInternalFormat,
        width,
        height,
        0,
        gl.RGBA,
        colorFormat,
        null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     
    // attach it to the framebuffer
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,        // target
        gl.COLOR_ATTACHMENT0,  // attachment point
        gl.TEXTURE_2D,         // texture target
        colorTexture,          // texture
        0                      // mip level
    );

    return newFramebuffer;
}

function getAlphaAtLocation( pos ) {

    // create the array to read pixel into
    const array = new Uint8Array(4);

    // read pixel into the array
    gl.readPixels( pos[0], pos[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, array );

    // return the alpha value
    return array[3];
}
