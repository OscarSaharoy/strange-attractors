// Oscar Saharoy 2021

const dt      = 5e-3;
const nPoints = 30000;
const points  = new Array(nPoints);
points[0]     = [1, 0, 0];

// arrays that will contain the strange attractor geometry data
let nVerts = (nPoints - 3) * 24;
let faces  = new Float32Array( (nPoints - 3) * 48 );
let norms  = new Float32Array( (nPoints - 3) * 48 );
let idxs   = new Uint32Array(  (nPoints - 3) * 24 );

// a bounding box to contain all the attractor points
let maxBBoxCorner = [-Infinity, -Infinity, -Infinity];
let minBBoxCorner = [ Infinity,  Infinity,  Infinity];
let bBoxCentre    = [0, 0, 0];

// vector operations
const mul      = (vec , k   ) => vec.map( v => v*k );
const minus    =  vec         => vec.map( v => -v  );
const add      = (vec1, vec2) => vec1.map( (_,k) => vec1[k] + vec2[k] );
const sub      = (vec1, vec2) => vec1.map( (_,k) => vec1[k] - vec2[k] );
const dot      = (vec1, vec2) => vec1.reduce( (acc, val, k) => acc + vec1[k] * vec2[k], 0 );
const mod      =  vec         => Math.sqrt( vec.reduce( (acc,val) => acc + val**2, 0 ) );
const norm     =  vec         => mul( vec, 1/mod(vec) );
const cross    = (vec1, vec2) => [ vec1[1]*vec2[2] - vec1[2]*vec2[1],
                                   vec1[2]*vec2[0] - vec1[0]*vec2[2],
                                   vec1[0]*vec2[1] - vec1[1]*vec2[0] ]

// lorenz

let rho   = 28, 
    theta = 10,
    beta  = 8/3;

const fx = (x,y,z) => theta * ( y - x ),
      fy = (x,y,z) => x  * ( rho - z ) - y,
      fz = (x,y,z) => x  * y - beta * z;


// chua

// let a = 40, 
//     b = 3,
//     c = 28;

// const fx = (x,y,z) => a * ( y - x ),
//       fy = (x,y,z) => (c-a) * x - x*z + c*y,
//       fz = (x,y,z) => x*y - b*z;


// lu chen

// let a = 36, 
//     b = 3,
//     c = 20,
//     u = -15.15;

// const fx = (x,y,z) => a * ( y - x ),
//       fy = (x,y,z) => x - x*z + c*y + u,
//       fz = (x,y,z) => x*y - b*z;


// rossler

// let a = 0.1, 
//     b = 0.1,
//     c = 17;

// const fx = (x,y,z) => - y - z,
//       fy = (x,y,z) => b + y * (x-c),
//       fz = (x,y,z) => x + a*z;



function calcPoint(points, i ) {

    // get current x y and z from the points array
    const x = points[i-1][0],
          y = points[i-1][1],
          z = points[i-1][2];

    // calculate dx dy and dz using the strange attractor formulae
    const dx = fx( x, y, z );
    const dy = fy( x, y, z );
    const dz = fz( x, y, z );

    // calculate next point by incrementing position by diffentials
    // and put it in the array
    points[i] = [ x + dx * dt ,
                  y + dy * dt ,
                  z + dz * dt ];
}


function calcPointRK4( points, i ) {

    // get current x y and z from the points array
    // and cache the initial values
    let x = x0 = points[i-1][0],
        y = y0 = points[i-1][1],
        z = z0 = points[i-1][2];

    // calculate RK4 intermediate values

    // k1

    const dx1 = fx( x, y, z );
    const dy1 = fy( x, y, z );
    const dz1 = fz( x, y, z );

    // k2

    x = x0 + dx1 * dt*0.5;
    y = y0 + dy1 * dt*0.5;
    z = z0 + dz1 * dt*0.5;

    const dx2 = fx( x, y, z );
    const dy2 = fy( x, y, z );
    const dz2 = fz( x, y, z );

    // k3

    x = x0 + dx2 * dt*0.5;
    y = y0 + dy2 * dt*0.5;
    z = z0 + dz2 * dt*0.5;

    const dx3 = fx( x, y, z );
    const dy3 = fy( x, y, z );
    const dz3 = fz( x, y, z );

    // k4

    x = x0 + dx3 * dt;
    y = y0 + dy3 * dt;
    z = z0 + dz3 * dt;

    const dx4 = fx( x, y, z );
    const dy4 = fy( x, y, z );
    const dz4 = fz( x, y, z );
    
    // calculate the overall RK4 step, increment initial
    // x y and z positions and put new position into the array
    // v += ( k1 + 2*k2 + 2*k3 + k4 ) / 6 * dt
    points[i] = [ x0 + ( dx1 + 2*dx2 + 2*dx3 + dx4 ) * dt/6 ,
                  y0 + ( dy1 + 2*dy2 + 2*dy3 + dy4 ) * dt/6 ,
                  z0 + ( dz1 + 2*dz2 + 2*dz3 + dz4 ) * dt/6 ];
}


function makeGeometry( points ) {

    // first calculate vertices and normal and curve vectors at the second point of points

    // get components of first second and third points

    const pX = points[0][0],
          pY = points[0][1],
          pZ = points[0][2];

    const cX = points[1][0],
          cY = points[1][1],
          cZ = points[1][2];

    const nX = points[2][0],
          nY = points[2][1],
          nZ = points[2][2];

    // calculate tangent vector

    let prevTangentX = nX - pX,
        prevTangentY = nY - pY,
        prevTangentZ = nZ - pZ;

    // normalise tangent vector

    const normTangent = 1 / Math.sqrt( prevTangentX*prevTangentX + prevTangentY*prevTangentY + prevTangentZ*prevTangentZ );
    prevTangentX *= normTangent;
    prevTangentY *= normTangent;
    prevTangentZ *= normTangent;

    // calculate normal vector

    let cpdx = cX - pX,
        cpdy = cY - pY,
        cpdz = cZ - pZ;

    let ncdx = nX - cX,
        ncdy = nY - cY,
        ncdz = nZ - cZ;

    let prevNormalX  = ncdy*cpdz - ncdz*cpdy,
        prevNormalY  = ncdz*cpdx - ncdx*cpdz,
        prevNormalZ  = ncdx*cpdy - ncdy*cpdx;

    const normNormal = 1 / Math.sqrt( prevNormalX*prevNormalX + prevNormalY*prevNormalY + prevNormalZ*prevNormalZ );
    prevNormalX *= normNormal;
    prevNormalY *= normNormal;
    prevNormalZ *= normNormal;

    // calculate vector in direction of curvature (already normalised)

    let prevCurveX   = prevTangentY*prevNormalZ - prevTangentZ*prevNormalY,
        prevCurveY   = prevTangentZ*prevNormalX - prevTangentX*prevNormalZ,
        prevCurveZ   = prevTangentX*prevNormalY - prevTangentY*prevNormalX;

    // calculate vertex positions

    const width = 0.25;

    let prevTopRightX    = cX + prevNormalX * width,
        prevTopRightY    = cY + prevNormalY * width,
        prevTopRightZ    = cZ + prevNormalZ * width;

    let prevBottomRightX = cX + prevCurveX  * width,
        prevBottomRightY = cY + prevCurveY  * width,
        prevBottomRightZ = cZ + prevCurveZ  * width;

    let prevTopLeftX     = cX - prevCurveX  * width,
        prevTopLeftY     = cY - prevCurveY  * width,
        prevTopLeftZ     = cZ - prevCurveZ  * width;

    let prevBottomLeftX  = cX - prevNormalX * width,
        prevBottomLeftY  = cY - prevNormalY * width,
        prevBottomLeftZ  = cZ - prevNormalZ * width;


    // loop over all the points except the first and last
    // and populate the faces, norms and idxs arrays
    // which will be fed into webgl
    for( let idx = 2; idx < points.length-1; ++idx ) {

        // get the previous, current and next points

        const prevPoint    = points[idx-1];
        const currentPoint = points[idx  ];
        const nextPoint    = points[idx+1];

        // get all the components of the 3 points

        const pX = prevPoint[0],
              pY = prevPoint[1],
              pZ = prevPoint[2];

        const cX = currentPoint[0],
              cY = currentPoint[1],
              cZ = currentPoint[2];

        const nX = nextPoint[0],
              nY = nextPoint[1],
              nZ = nextPoint[2];

        // calculate tangent vector

        let tangentX = nX - pX,
            tangentY = nY - pY,
            tangentZ = nZ - pZ;

        // normalise tangent vector

        const normTangent = 1 / Math.sqrt( tangentX*tangentX + tangentY*tangentY + tangentZ*tangentZ );
        tangentX *= normTangent;
        tangentY *= normTangent;
        tangentZ *= normTangent;

        // calculate normal vector

        let cpdx     = cX - pX,
            cpdy     = cY - pY,
            cpdz     = cZ - pZ;

        let ncdx     = nX - cX,
            ncdy     = nY - cY,
            ncdz     = nZ - cZ;

        let normalX  = ncdy*cpdz - ncdz*cpdy,
            normalY  = ncdz*cpdx - ncdx*cpdz,
            normalZ  = ncdx*cpdy - ncdy*cpdx;

        const normNormal = 1 / Math.sqrt( normalX*normalX + normalY*normalY + normalZ*normalZ );
        normalX *= normNormal;
        normalY *= normNormal;
        normalZ *= normNormal;

        // calculate vector in direction of curvature (already normalised)

        let curveX   = tangentY*normalZ - tangentZ*normalY,
            curveY   = tangentZ*normalX - tangentX*normalZ,
            curveZ   = tangentX*normalY - tangentY*normalX;


        //          ^ normal
        //          |
        //          |
        //  tangent x ---> curve


        // calculate vertex positions at current point

        const currentTopRightX    = cX + normalX * width,
              currentTopRightY    = cY + normalY * width,
              currentTopRightZ    = cZ + normalZ * width;

        const currentBottomRightX = cX + curveX  * width,
              currentBottomRightY = cY + curveY  * width,
              currentBottomRightZ = cZ + curveZ  * width;

        const currentTopLeftX     = cX - curveX  * width,
              currentTopLeftY     = cY - curveY  * width,
              currentTopLeftZ     = cZ - curveZ  * width;

        const currentBottomLeftX  = cX - normalX * width,
              currentBottomLeftY  = cY - normalY * width,
              currentBottomLeftZ  = cZ - normalZ * width;


        // each iteration we push 4 faces each with 4 corners, each corner has 3 components
        // 4*4*3 = 48
        // each face takes 6 indices
        // 4*6 = 24

        let baseIdx    = faces.length/3;
        const faceBase = 48 * (idx-2);
        const idxBase  = 24 * (idx-2);
        const preFaces = 16 * (idx-2);


        // left face

        faces[ faceBase      ] = currentTopLeftX ;
        faces[ faceBase + 1  ] = currentTopLeftY ;
        faces[ faceBase + 2  ] = currentTopLeftZ ;
        faces[ faceBase + 3  ] = prevTopLeftX    ;
        faces[ faceBase + 4  ] = prevTopLeftY    ;
        faces[ faceBase + 5  ] = prevTopLeftZ    ;
        faces[ faceBase + 6  ] = prevTopRightX   ;
        faces[ faceBase + 7  ] = prevTopRightY   ;
        faces[ faceBase + 8  ] = prevTopRightZ   ;
        faces[ faceBase + 9  ] = currentTopRightX;
        faces[ faceBase + 10 ] = currentTopRightY;
        faces[ faceBase + 11 ] = currentTopRightZ;
   
        norms[ faceBase      ] = normalX    ;
        norms[ faceBase + 1  ] = normalY    ;
        norms[ faceBase + 2  ] = normalZ    ;
        norms[ faceBase + 3  ] = prevNormalX;
        norms[ faceBase + 4  ] = prevNormalY;
        norms[ faceBase + 5  ] = prevNormalZ;
        norms[ faceBase + 6  ] = prevNormalX;
        norms[ faceBase + 7  ] = prevNormalY;
        norms[ faceBase + 8  ] = prevNormalZ;
        norms[ faceBase + 9  ] = normalX    ;
        norms[ faceBase + 10 ] = normalY    ;
        norms[ faceBase + 11 ] = normalZ    ;

        idxs[  idxBase       ] = 0 + preFaces;
        idxs[  idxBase  + 1  ] = 1 + preFaces;
        idxs[  idxBase  + 2  ] = 2 + preFaces;
        idxs[  idxBase  + 3  ] = 0 + preFaces;
        idxs[  idxBase  + 4  ] = 2 + preFaces;
        idxs[  idxBase  + 5  ] = 3 + preFaces;


        // right face

        faces[ faceBase + 12 ] = currentTopRightX   ;
        faces[ faceBase + 13 ] = currentTopRightY   ;
        faces[ faceBase + 14 ] = currentTopRightZ   ;
        faces[ faceBase + 15 ] = prevTopRightX      ;
        faces[ faceBase + 16 ] = prevTopRightY      ;
        faces[ faceBase + 17 ] = prevTopRightZ      ;
        faces[ faceBase + 18 ] = prevBottomRightX   ;
        faces[ faceBase + 19 ] = prevBottomRightY   ;
        faces[ faceBase + 20 ] = prevBottomRightZ   ;
        faces[ faceBase + 21 ] = currentBottomRightX;
        faces[ faceBase + 22 ] = currentBottomRightY;
        faces[ faceBase + 23 ] = currentBottomRightZ;
   
        norms[ faceBase + 12 ] = curveX    ;
        norms[ faceBase + 13 ] = curveY    ;
        norms[ faceBase + 14 ] = curveZ    ;
        norms[ faceBase + 15 ] = prevCurveX;
        norms[ faceBase + 16 ] = prevCurveY;
        norms[ faceBase + 17 ] = prevCurveZ;
        norms[ faceBase + 18 ] = prevCurveX;
        norms[ faceBase + 19 ] = prevCurveY;
        norms[ faceBase + 20 ] = prevCurveZ;
        norms[ faceBase + 21 ] = curveX    ;
        norms[ faceBase + 22 ] = curveY    ;
        norms[ faceBase + 23 ] = curveZ    ;

        idxs[  idxBase  + 6  ] = 4 + preFaces;
        idxs[  idxBase  + 7  ] = 5 + preFaces;
        idxs[  idxBase  + 8  ] = 6 + preFaces;
        idxs[  idxBase  + 9  ] = 4 + preFaces;
        idxs[  idxBase  + 10 ] = 6 + preFaces;
        idxs[  idxBase  + 11 ] = 7 + preFaces;


        // bottom face

        faces[ faceBase + 24 ] = currentBottomRightX;
        faces[ faceBase + 25 ] = currentBottomRightY;
        faces[ faceBase + 26 ] = currentBottomRightZ; 
        faces[ faceBase + 27 ] = prevBottomRightX   ;
        faces[ faceBase + 28 ] = prevBottomRightY   ;
        faces[ faceBase + 29 ] = prevBottomRightZ   ; 
        faces[ faceBase + 30 ] = prevBottomLeftX    ;
        faces[ faceBase + 31 ] = prevBottomLeftY    ;
        faces[ faceBase + 32 ] = prevBottomLeftZ    ; 
        faces[ faceBase + 33 ] = currentBottomLeftX ;
        faces[ faceBase + 34 ] = currentBottomLeftY ;
        faces[ faceBase + 35 ] = currentBottomLeftZ ;
   
        norms[ faceBase + 24 ] = -normalX    ;
        norms[ faceBase + 25 ] = -normalY    ;
        norms[ faceBase + 26 ] = -normalZ    ; 
        norms[ faceBase + 27 ] = -prevNormalX;
        norms[ faceBase + 28 ] = -prevNormalY;
        norms[ faceBase + 29 ] = -prevNormalZ; 
        norms[ faceBase + 30 ] = -prevNormalX;
        norms[ faceBase + 31 ] = -prevNormalY;
        norms[ faceBase + 32 ] = -prevNormalZ; 
        norms[ faceBase + 33 ] = -normalX    ;
        norms[ faceBase + 34 ] = -normalY    ;
        norms[ faceBase + 35 ] = -normalZ    ;

        idxs[  idxBase  + 12 ] = 8  + preFaces;
        idxs[  idxBase  + 13 ] = 9  + preFaces;
        idxs[  idxBase  + 14 ] = 10 + preFaces;
        idxs[  idxBase  + 15 ] = 8  + preFaces;
        idxs[  idxBase  + 16 ] = 10 + preFaces;
        idxs[  idxBase  + 17 ] = 11 + preFaces;
        

        // left face

        faces[ faceBase + 36 ] = currentBottomLeftX;
        faces[ faceBase + 37 ] = currentBottomLeftY; 
        faces[ faceBase + 38 ] = currentBottomLeftZ;  
        faces[ faceBase + 39 ] = prevBottomLeftX   ; 
        faces[ faceBase + 40 ] = prevBottomLeftY   ; 
        faces[ faceBase + 41 ] = prevBottomLeftZ   ;  
        faces[ faceBase + 42 ] = prevTopLeftX      ; 
        faces[ faceBase + 43 ] = prevTopLeftY      ; 
        faces[ faceBase + 44 ] = prevTopLeftZ      ; 
        faces[ faceBase + 45 ] = currentTopLeftX   ; 
        faces[ faceBase + 46 ] = currentTopLeftY   ; 
        faces[ faceBase + 47 ] = currentTopLeftZ   ; 
   
        norms[ faceBase + 36 ] = -curveX    ;
        norms[ faceBase + 37 ] = -curveY    ;
        norms[ faceBase + 38 ] = -curveZ    ;
        norms[ faceBase + 39 ] = -prevCurveX;
        norms[ faceBase + 40 ] = -prevCurveY;
        norms[ faceBase + 41 ] = -prevCurveZ;
        norms[ faceBase + 42 ] = -prevCurveX;
        norms[ faceBase + 43 ] = -prevCurveY;
        norms[ faceBase + 44 ] = -prevCurveZ;
        norms[ faceBase + 45 ] = -curveX    ;
        norms[ faceBase + 46 ] = -curveY    ;
        norms[ faceBase + 47 ] = -curveZ    ;

        idxs[  idxBase  + 18 ] = 12 + preFaces;
        idxs[  idxBase  + 19 ] = 13 + preFaces;
        idxs[  idxBase  + 20 ] = 14 + preFaces;
        idxs[  idxBase  + 21 ] = 12 + preFaces;
        idxs[  idxBase  + 22 ] = 14 + preFaces;
        idxs[  idxBase  + 23 ] = 15 + preFaces;


        // store the normal and curve vectors and vertices for next iteration

        prevNormalX      = normalX;
        prevNormalY      = normalY;
        prevNormalZ      = normalZ;

        prevCurveX       = curveX;
        prevCurveY       = curveY;
        prevCurveZ       = curveZ;

        prevTopRightX    = currentTopRightX;
        prevTopRightY    = currentTopRightY;
        prevTopRightZ    = currentTopRightZ;

        prevBottomRightX = currentBottomRightX;
        prevBottomRightY = currentBottomRightY;
        prevBottomRightZ = currentBottomRightZ;
        
        prevTopLeftX     = currentTopLeftX;
        prevTopLeftY     = currentTopLeftY;
        prevTopLeftZ     = currentTopLeftZ;
        
        prevBottomLeftX  = currentBottomLeftX;
        prevBottomLeftY  = currentBottomLeftY;
        prevBottomLeftZ  = currentBottomLeftZ;
    }
}


function fitBBox( points ) {

    for( let i = 0; i < nPoints; ++i ) {

        maxBBoxCorner[0] = Math.max( maxBBoxCorner[0], points[i][0] );
        maxBBoxCorner[1] = Math.max( maxBBoxCorner[1], points[i][1] );
        maxBBoxCorner[2] = Math.max( maxBBoxCorner[2], points[i][2] );

        minBBoxCorner[0] = Math.min( minBBoxCorner[0], points[i][0] );
        minBBoxCorner[1] = Math.min( minBBoxCorner[1], points[i][1] );
        minBBoxCorner[2] = Math.min( minBBoxCorner[2], points[i][2] );
    }

    bBoxCentre = mul( add( maxBBoxCorner, minBBoxCorner ), 0.5 );
}

var forward  = vec3.fromValues(1, 0, 0);
var up       = vec3.fromValues(0, 1, 0);
var right    = vec3.fromValues(0, 0, 1);
var zero     = vec3.fromValues(0, 0, 0);

const vsSource = `

attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vLighting;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    highp vec3 directionalLightColor = vec3(0.8, 0.97, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = dot(transformedNormal.xyz, directionalVector) * 0.45 + 0.5;
    vLighting = vec4( directionalLightColor * directional, 1.0);
}

`;

const fsSource = `

varying highp vec4 vLighting;   

void main() {
    gl_FragColor = vLighting;
}

`;


const vCopyShaderSource = `

precision mediump float;

attribute vec4 aVertexPosition;
varying vec4 vFragCoord;

void main() {
    gl_Position = aVertexPosition;
    vFragCoord.xy = aVertexPosition.xy;
}

`;

const fCopyShaderSource = `

void main() {
    gl_FragColor = vec4( 0, 0, 0, 1 );
}

`;


function loadShader(gl, type, source) {
  
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader programa
    gl.compileShader(shader);
    
    if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
        
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function makeShaderProgram(gl, vsSource, fsSource) {
  
    const vertexShader   = loadShader(gl, gl.VERTEX_SHADER,   vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    return shaderProgram;
}

function resize() {

    // set canvas to have 1:1 canvas pixel to screen pixel ratio
    const boundingRect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    width  = canvas.width  = boundingRect.width  * dpr;
    height = canvas.height = boundingRect.height * dpr;

    // set clip space to match up to canvas corners
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // match the projection matrix to the current aspect ratio
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 1;
    const zFar = 1000.0;

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
}

function initBuffers(gl) {
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, faces, gl.STATIC_DRAW );

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, norms, gl.STATIC_DRAW );
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, idxs, gl.STATIC_DRAW );


    const screenQuad = Float32Array.from( [ -1, -1, -1, 1, 1, 1, 1, -1 ] );
    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, screenQuadBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, screenQuad, gl.STATIC_DRAW );

    const screenQuadIndices = [ 0, 1, 2,  1, 2, 3 ];
    const screenQuadIndicesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, screenQuadIndicesBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, screenQuadIndices, gl.STATIC_DRAW );


    // make render texture
    const renderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);

    // configure render texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // // create and bind a framebuffer
    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
     
    // // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D( gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, renderTexture, 0 );


    return [ positionBuffer         ,
             normalBuffer           ,
             indexBuffer            ,
             screenQuadBuffer       ,
             screenQuadIndicesBuffer,
             renderTexture          ,
             frameBuffer            ];
}

function updateBuffers(gl, programInfo) {

    gl.bindBuffer( gl.ARRAY_BUFFER, programInfo.positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, faces, gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, programInfo.normalBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, norms, gl.STATIC_DRAW );
    
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, programInfo.indexBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, idxs, gl.STATIC_DRAW );
}

function updateMatrices(gl, programInfo) {

    // update the modelView matrix
    mat4.mul(modelViewMatrix, viewMatrix, modelMatrix);

    // adjust the normal matrix to match the new modelView matrix
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

let frame    = 0;
let step     = 1;
let stepFunc = x => 1;
let stop     = false;

function drawScene( gl, programInfo ) {

    step   = stepFunc(step);
    frame += step;

    // generate the strange attractor geometry
    // for( let i=1; i<nPoints; ++i ) calcPointRK4( points, i );
    // fitBBox( points );  
    // makeGeometry( points ); 

    // translate the geometry to be centered on the origin
    mat4.fromTranslation(modelMatrix, minus(bBoxCentre));

    // set the viewpoint
    mat4.lookAt(viewMatrix, [Math.sin(frame/70)*90,0,Math.cos(frame/70)*90], [0,0,0], [0,1,0]);
    // mat4.lookAt(viewMatrix, [90,0,0], [0,0,0], [0,1,0]); // static


    // update the shader attributes
    updateMatrices( gl, programInfo );
    // updateBuffers(  gl, programInfo );

    // bind the render texture and buffer
    gl.bindFramebuffer( gl.FRAMEBUFFER, programInfo.frameBuffer   );
    gl.bindTexture(     gl.TEXTURE_2D , programInfo.renderTexture );

    // Clear the texture and depth buffer
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // use the render shader
    gl.useProgram( renderProgram );

    // bind the buffer containing the attractor geometry    
    gl.bindBuffer( gl.ARRAY_BUFFER, programInfo.positionBuffer );
          
    gl.vertexAttribPointer(
        programInfo.vertexPosition,
        3, gl.FLOAT, false, 0, 0
    );

    // bind the buffer containing the attractor geometry indices
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, programInfo.indexBuffer );

    // draw the geometry
    gl.drawElements(gl.TRIANGLES, nVerts, gl.UNSIGNED_INT, 0);


    // bind to the canvas
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    gl.bindTexture(     gl.TEXTURE_2D , null );

    // Clear the texture and depth buffer
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // use the copy shader
    gl.useProgram( copyProgram );

    // bind the buffer containing the fullscreen quad geometry    
    gl.bindBuffer( gl.ARRAY_BUFFER, programInfo.screenQuadBuffer );
          
    gl.vertexAttribPointer(
        programInfo.vertexPosition,
        3, gl.FLOAT, false, 0, 0
    );

    // bind the buffer containing the fullscreen quad geometry indices
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, programInfo.indexBuffer );

    // copy the framebuffer to the screen
    gl.drawElements(gl.TRIANGLES, nVerts, gl.UNSIGNED_INT, 0);
    

    // run again next frame
    requestAnimationFrame( () => drawScene( gl, programInfo ) );
}

document.body.onkeydown = function(e){
    if(e.keyCode == 32){
        stepFunc = (stop ^= 1) ? x => x * 0.92 : x => 1-(1-x) * 0.92;
    }
}

// generate the geometry
for( let i=1; i<nPoints; ++i ) calcPointRK4(points, i);
makeGeometry(points);
fitBBox( points );
    
const modelMatrix      = mat4.create();
const viewMatrix       = mat4.create();
const normalMatrix     = mat4.create();    
const modelViewMatrix  = mat4.create();
const projectionMatrix = mat4.create();

const canvas = document.querySelector("#glcanvas")
const gl     = canvas.getContext("webgl");

// set the background to transparent and set some gl settings
gl.clearColor(0.0, 0.0, 0.0, 0.0);
gl.clearDepth(1.0);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

// enable the uint index extension to allow more verts
var ext = gl.getExtension('OES_element_index_uint');

// link resize to be called when canvas changes width
let width, height;
new ResizeObserver( () => resize() ).observe( canvas );
resize();
    
const renderProgram = makeShaderProgram(gl, vsSource         , fsSource         );
const copyProgram   = makeShaderProgram(gl, vCopyShaderSource, fCopyShaderSource);

const [ positionBuffer, normalBuffer, indexBuffer, screenQuadBuffer,
        screenQuadIndicesBuffer, renderTexture, frameBuffer ] = initBuffers(gl);
    
const programInfo = {

    vertexPosition  : gl.getAttribLocation(  renderProgram, 'aVertexPosition'   ),
    vertexColor     : gl.getAttribLocation(  renderProgram, 'aVertexColor'      ),
    vertexNormal    : gl.getAttribLocation(  renderProgram, 'aVertexNormal'     ),

    projectionMatrix: gl.getUniformLocation( renderProgram, 'uProjectionMatrix' ),
    modelViewMatrix : gl.getUniformLocation( renderProgram, 'uModelViewMatrix'  ),
    normalMatrix    : gl.getUniformLocation( renderProgram, 'uNormalMatrix'     ),

    copyShaderVertexPosition : gl.getAttribLocation( copyProgram, 'aVertexPosition' ),

    renderTexture   : renderTexture ,
    frameBuffer     : frameBuffer   ,

    positionBuffer  : positionBuffer,
    normalBuffer    : normalBuffer  ,
    indexBuffer     : indexBuffer 
};


gl.enableVertexAttribArray( programInfo.vertexPosition           );
gl.enableVertexAttribArray( programInfo.copyShaderVertexPosition );

gl.bindBuffer( gl.ARRAY_BUFFER, programInfo.normalBuffer );

gl.vertexAttribPointer(
    programInfo.vertexNormal,
    3, gl.FLOAT, false, 0, 0
);

gl.enableVertexAttribArray( programInfo.vertexNormal );


drawScene(gl, programInfo);
