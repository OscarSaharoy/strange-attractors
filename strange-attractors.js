// Oscar Saharoy 2021

const dt      = 10e-3;
const nPoints = 3200;
const points  = new Array(nPoints);
points[0]     = [1, 0, 0];

// arrays that will contain the strange attractor geometry data
let nVerts = (nPoints - 3) * 24;
let faces  = new Array( nVerts );
let norms  = new Array( nVerts );
let idxs   = new Array( nVerts );

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


function calcPointRK4(points, i) {

    // get current x y and z from the points array
    // and cache the initial values
    let x = x0 = points[i-1][0],
        y = y0 = points[i-1][1],
        z = z0 = points[i-1][2];

    // calculate RK4 intermediate values

    // k1

    const dx1 = 10 * ( y  - x );
    const dy1 = x  * ( 28 - z ) - y;
    const dz1 = x  *   y  - 8/3 * z;

    // k2

    x = x0 + dx1 * dt*0.5;
    y = y0 + dy1 * dt*0.5;
    z = z0 + dz1 * dt*0.5;

    const dx2 = 10 * ( y  - x );
    const dy2 = x  * ( 28 - z ) - y;
    const dz2 = x  *   y  - 8/3 * z;

    // k3

    x = x0 + dx2 * dt*0.5;
    y = y0 + dy2 * dt*0.5;
    z = z0 + dz2 * dt*0.5;

    const dx3 = 10 * ( y  - x );
    const dy3 = x  * ( 28 - z ) - y;
    const dz3 = x  *   y  - 8/3 * z;

    // k4

    x = x0 + dx3 * dt;
    y = y0 + dy3 * dt;
    z = z0 + dz3 * dt;

    const dx4 = 10 * ( y  - x );
    const dy4 = x  * ( 28 - z ) - y;
    const dz4 = x  *   y  - 8/3 * z;
    
    // calculate the overall RK4 step, increment initial
    // x y and z positions and put new position into the array
    // v += ( k1 + 2*k2 + 2*k3 + k4 ) / 6 * dt
    points[i] = [ x0 + ( dx1 + 2*dx2 + 2*dx3 + dx4 ) * dt/6 ,
                  y0 + ( dy1 + 2*dy2 + 2*dy3 + dy4 ) * dt/6 ,
                  z0 + ( dz1 + 2*dz2 + 2*dz3 + dz4 ) * dt/6 ];
}

function calcPoint(points, i) {

    // get current x y and z from the points array
    const x = points[i-1][0],
          y = points[i-1][1],
          z = points[i-1][2];

    // calculate dx dy and dz using the strange attractor formulae
    const dx = 10 * ( y  - x );
    const dy = x  * ( 28 - z ) - y;
    const dz = x  *   y  - 8/3 * z;

    // calculate next point by increamenting position by diffentials
    // and put it in the array
    points[i] = [ x + dx * dt ,
                  y + dy * dt ,
                  z + dz * dt ];
}

function makeGeometryOpt( points ) {

    // first calculate vertices at the second point of points

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

    let cpdx     = cX - pX,
        cpdy     = cY - pY,
        cpdz     = cZ - pZ;

    let ncdx     = nX - cX,
        ncdy     = nY - cY,
        ncdz     = nZ - cZ;

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

    let prevTopRightX    = cX + prevCurveX * 0.15 + prevNormalX * 0.15,
        prevTopRightY    = cY + prevCurveY * 0.15 + prevNormalY * 0.15,
        prevTopRightZ    = cZ + prevCurveZ * 0.15 + prevNormalZ * 0.15;

    let prevBottomRightX = cX + prevCurveX * 0.15 - prevNormalX * 0.15,
        prevBottomRightY = cY + prevCurveY * 0.15 - prevNormalY * 0.15,
        prevBottomRightZ = cZ + prevCurveZ * 0.15 - prevNormalZ * 0.15;

    let prevTopLeftX     = cX - prevCurveX * 0.15 + prevNormalX * 0.15,
        prevTopLeftY     = cY - prevCurveY * 0.15 + prevNormalY * 0.15,
        prevTopLeftZ     = cZ - prevCurveZ * 0.15 + prevNormalZ * 0.15;

    let prevBottomLeftX  = cX - prevCurveX * 0.15 - prevNormalX * 0.15,
        prevBottomLeftY  = cY - prevCurveY * 0.15 - prevNormalY * 0.15,
        prevBottomLeftZ  = cZ - prevCurveZ * 0.15 - prevNormalZ * 0.15;


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

        const currentTopRightX    = cX + curveX * 0.15 + normalX * 0.15,
              currentTopRightY    = cY + curveY * 0.15 + normalY * 0.15,
              currentTopRightZ    = cZ + curveZ * 0.15 + normalZ * 0.15;

        const currentBottomRightX = cX + curveX * 0.15 - normalX * 0.15,
              currentBottomRightY = cY + curveY * 0.15 - normalY * 0.15,
              currentBottomRightZ = cZ + curveZ * 0.15 - normalZ * 0.15;

        const currentTopLeftX     = cX - curveX * 0.15 + normalX * 0.15,
              currentTopLeftY     = cY - curveY * 0.15 + normalY * 0.15,
              currentTopLeftZ     = cZ - curveZ * 0.15 + normalZ * 0.15;

        const currentBottomLeftX  = cX - curveX * 0.15 - normalX * 0.15,
              currentBottomLeftY  = cY - curveY * 0.15 - normalY * 0.15,
              currentBottomLeftZ  = cZ - curveZ * 0.15 - normalZ * 0.15;

        let baseIdx      = faces.length/3;
        const idxOffsets = [ 0, 1, 2,  0, 2, 3 ];

        const topFace    = [ currentTopLeftX , currentTopLeftY , currentTopLeftZ  ,
                             prevTopLeftX    , prevTopLeftY    , prevTopLeftZ     ,
                             prevTopRightX   , prevTopRightY   , prevTopRightZ    ,
                             currentTopRightX, currentTopRightY, currentTopRightZ ];
        faces.push(...topFace);

        const topNorms = [ ...currentRing.normal  ,
                           ...prevRing.normal   ,
                           ...prevRing.normal   ,
                           ...currentRing.normal ];
        norms.push(...topNorms);

        const topIdxs    = idxOffsets.map( idx => idx + baseIdx );
        idxs.push(...topIdxs);


        // baseIdx = faces.length/3;

        // const rightFace = [ ...currentRing.topRight    ,
        //                     ...prevRing.topRight       ,
        //                     ...prevRing.bottomRight    , 
        //                     ...currentRing.bottomRight ];
        // faces.push( ...rightFace );

        // const rightNorms = [ ...currentRing.curve,
        //                      ...prevRing.curve   ,
        //                      ...prevRing.curve   ,
        //                      ...currentRing.curve ];
        // norms.push( ...rightNorms );

        // const rightIdxs = idxOffsets.map( idx => idx + baseIdx );
        // idxs.push( ...rightIdxs );


        // baseIdx = faces.length/3;

        // const bottomFace = [ ...currentRing.bottomRight ,
        //                      ...prevRing.bottomRight    ,
        //                      ...prevRing.bottomLeft     , 
        //                      ...currentRing.bottomLeft  ];
        // faces.push( ...bottomFace );

        // const bottomNorms = [ ...minus(currentRing.normal),
        //                       ...minus(prevRing.normal   ),
        //                       ...minus(prevRing.normal   ),
        //                       ...minus(currentRing.normal) ];
        // norms.push( ...bottomNorms );

        // const bottomIdxs = idxOffsets.map( idx => idx + baseIdx );
        // idxs.push( ...bottomIdxs );


        // baseIdx = faces.length/3;

        // const leftFace = [ ...currentRing.bottomLeft ,
        //                      ...prevRing.bottomLeft  ,
        //                      ...prevRing.topLeft     , 
        //                      ...currentRing.topLeft  ];
        // faces.push( ...leftFace );

        // const leftNorms = [ ...minus(currentRing.curve),
        //                       ...minus(prevRing.curve   ),
        //                       ...minus(prevRing.curve   ),
        //                       ...minus(currentRing.curve) ];
        // norms.push( ...leftNorms );

        // const leftIdxs = idxOffsets.map( idx => idx + baseIdx );
        // idxs.push( ...leftIdxs );


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

function makeGeometry( points ) {

    const rings = [];

    for( let idx = 1; idx < points.length-1; ++idx ) {

        const prevPoint    = points[idx-1];
        const currentPoint = points[idx  ];
        const nextPoint    = points[idx+1];

        const tangent = norm( sub( nextPoint, prevPoint ) );
        const normal  = norm( cross( sub( nextPoint, currentPoint ),
                                     sub( currentPoint, prevPoint ) ) );
        const curve   = cross( tangent, normal );

        //          ^ normal
        //          |
        //          |
        //  tangent x ---> curve


        const toTopRight    = mul( add( curve, normal ),  0.15 );
        const toBottomRight = mul( sub( curve, normal ),  0.15 );
        const toTopLeft     = mul( sub( normal, curve ),  0.15 );
        const toBottomLeft  = mul( add( normal, curve ), -0.15 );

        rings.push( { topRight   : add( currentPoint, toTopRight    ),
                      bottomRight: add( currentPoint, toBottomRight ),
                      topLeft    : add( currentPoint, toTopLeft     ),
                      bottomLeft : add( currentPoint, toBottomLeft  ),
                      normal     : normal,
                      curve      : curve  } );

        if( idx >= 2 ) {

            const prevRing    = rings[idx-2];
            const currentRing = rings[idx-1];
            let baseIdx       = faces.length/3;

            const topFace    = [ ...currentRing.topLeft  ,
                                 ...prevRing.topLeft     ,
                                 ...prevRing.topRight    , 
                                 ...currentRing.topRight ];
            faces.push(...topFace);

            const topNorms = [ ...currentRing.normal,
                                 ...prevRing.normal   ,
                                 ...prevRing.normal   ,
                                 ...currentRing.normal ];
            norms.push(...topNorms);

            const topIdxs    = [ 0, 1, 2,  0, 2, 3 ].map( idx => idx + baseIdx );
            idxs.push(...topIdxs);


            baseIdx = faces.length/3;

            const rightFace = [ ...currentRing.topRight    ,
                                ...prevRing.topRight       ,
                                ...prevRing.bottomRight    , 
                                ...currentRing.bottomRight ];
            faces.push( ...rightFace );

            const rightNorms = [ ...currentRing.curve,
                                 ...prevRing.curve   ,
                                 ...prevRing.curve   ,
                                 ...currentRing.curve ];
            norms.push( ...rightNorms );

            const rightIdxs = [ 0, 1, 2,  0, 2, 3 ].map( idx => idx + baseIdx );
            idxs.push( ...rightIdxs );


            baseIdx = faces.length/3;

            const bottomFace = [ ...currentRing.bottomRight ,
                                 ...prevRing.bottomRight    ,
                                 ...prevRing.bottomLeft     , 
                                 ...currentRing.bottomLeft  ];
            faces.push( ...bottomFace );

            const bottomNorms = [ ...minus(currentRing.normal),
                                  ...minus(prevRing.normal   ),
                                  ...minus(prevRing.normal   ),
                                  ...minus(currentRing.normal) ];
            norms.push( ...bottomNorms );

            const bottomIdxs = [ 0, 1, 2,  0, 2, 3 ].map( idx => idx + baseIdx );
            idxs.push( ...bottomIdxs );


            baseIdx = faces.length/3;

            const leftFace = [ ...currentRing.bottomLeft ,
                                 ...prevRing.bottomLeft  ,
                                 ...prevRing.topLeft     , 
                                 ...currentRing.topLeft  ];
            faces.push( ...leftFace );

            const leftNorms = [ ...minus(currentRing.curve),
                                  ...minus(prevRing.curve   ),
                                  ...minus(prevRing.curve   ),
                                  ...minus(currentRing.curve) ];
            norms.push( ...leftNorms );

            const leftIdxs = [ 0, 1, 2,  0, 2, 3 ].map( idx => idx + baseIdx );
            idxs.push( ...leftIdxs );

            nVerts = idxs.length;
        }
    }
}

console.time("push");
for( let i=1; i<nPoints; ++i ) calcPointRK4(points, i);
console.timeEnd("push");

console.time("geometry");
makeGeometry(points);
console.timeEnd("geometry");

const cube = [

    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];

const vertexNormals = [

    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
];

const indices = [
    0,  1,  2,    0,  2,  3,    // front
    4,  5,  6,    4,  6,  7,    // back
    8,  9,  10,   8,  10, 11,   // top
    12, 13, 14,   12, 14, 15,   // bottom
    16, 17, 18,   16, 18, 19,   // right
    20, 21, 22,   20, 22, 23,   // left
];

const profile = [

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];

const profileNormals = [

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
];

const profileIndices = [
    0,  1,  2,    0,  2,  3,    // top
    4,  5,  6,    4,  6,  7,    // bottom
    8,  9,  10,   8,  10, 11,   // right
    12, 13, 14,   12, 14, 15,   // left
];

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

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = dot(transformedNormal.xyz, directionalVector);
    vLighting = vec4( directionalLightColor * directional, 1.0);
}

`;

const fsSource = `

varying highp vec4 vLighting;   

void main() {
    gl_FragColor = vLighting;
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

function initgl() {

    // set the background to transparent and set some gl settings
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // link resize to be called when canvas changes width
    new ResizeObserver( () => resize() ).observe( canvas );
    resize();
}

function resize() {

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
    const zNear = 0.1;
    const zFar = 100.0;

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
}

function initBuffers(gl) {
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(faces), gl.STATIC_DRAW );

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW );
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idxs), gl.STATIC_DRAW );

    return {position: positionBuffer,
            indices:  indexBuffer,
            normals:  normalBuffer   };
}

function drawScene(gl, programInfo, buffers) {

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
       
    // modify the view matrix to rotate the cube
    mat4.mul(viewMatrix, rot, viewMatrix);
    mat4.mul(modelViewMatrix, modelMatrix, viewMatrix);

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
        
    // draw the cube
    gl.drawElements(gl.TRIANGLES, nVerts, gl.UNSIGNED_SHORT, 0);
    
    // run again next frame
    requestAnimationFrame( () => drawScene(gl, programInfo, buffers) );
}

let stopped = false;
document.body.onkeydown = function(e){
    if(e.keyCode == 32){
        (stopped ^= 1) ? mat4.identity(rot) : mat4.fromRotation(rot, 0.02, [-0.3,0.5,0.2]);
    }
}

const modelMatrix = mat4.create();
mat4.translate(modelMatrix, modelMatrix, [10.0, 0.0, -27.0]);
    
const viewMatrix = mat4.create();
    
const rot = mat4.create();
mat4.fromRotation(rot, 0.02, [-0.3,0.5,0.2]);

const normalMatrix     = mat4.create();    
const modelViewMatrix  = mat4.create();
const projectionMatrix = mat4.create();


const canvas = document.querySelector("#glcanvas")
const gl     = canvas.getContext("webgl");
    
initgl();
const shaderProgram = makeShaderProgram(gl, vsSource, fsSource);
const buffers = initBuffers(gl);
    
const programInfo = {

    vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    vertexColor:    gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    vertexNormal:   gl.getAttribLocation(shaderProgram, 'aVertexNormal'),

    projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    modelViewMatrix:  gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    normalMatrix:     gl.getUniformLocation(shaderProgram, 'uNormalMatrix')
};


gl.useProgram( shaderProgram );


gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  
gl.vertexAttribPointer(
    programInfo.vertexPosition,
    3, gl.FLOAT, false, 0, 0
);
  
gl.enableVertexAttribArray( programInfo.vertexPosition );


gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);


gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);

gl.vertexAttribPointer(
    programInfo.vertexNormal,
    3, gl.FLOAT, false, 0, 0
);

gl.enableVertexAttribArray(programInfo.vertexNormal);

drawScene(gl, programInfo, buffers);