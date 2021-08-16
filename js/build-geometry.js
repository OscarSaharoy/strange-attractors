// Oscar Saharoy 2021


function calcPointRK4( point, dt ) {

    // get current x y and z from the points array
    // and cache the initial values

    let   r  = point;
    const r0 = point;

    // calculate rk4 intermediate values

    const dr1 = fr(r);
    
    r = v3add( r0, v3scale( dr1, dt/2 ) );

    const dr2 = fr(r);

    r = v3add( r0, v3scale( dr2, dt/2 ) );
    
    const dr3 = fr(r);

    r = v3add( r0, v3scale( dr3, dt ) );
    
    const dr4 = fr(r);

    // compute the overall rk4 step

    const rk4step = [ ( dr1[0] + 2*dr2[0] + 2*dr3[0] + dr4[0] ) * dt/6 ,
                      ( dr1[1] + 2*dr2[1] + 2*dr3[1] + dr4[1] ) * dt/6 ,
                      ( dr1[2] + 2*dr2[2] + 2*dr3[2] + dr4[2] ) * dt/6 ];

    // add the overall rk4 step onto the start position

    // if the step is too large, calculate again with a smaller dt
    if( v3mod(rk4step) > maxRK4Step ) return calcPointRK4( point, dt/2 );

    return v3add( r0, rk4step );
}


function calcLocalCoordinateSystem( prevPoint, currentPoint, nextPoint ) {

    // calculate the vector tangent to the curve
    
    const nonNormalisedTangent = v3sub( nextPoint, prevPoint );
    const tangent = v3norm( nonNormalisedTangent );

    // calculate the vector normal to the curve

    const prevToCurrent = v3sub( currentPoint, prevPoint );
    const currentToNext = v3sub( nextPoint, currentPoint );

    // const nonNormalisedNormal = v3cross( currentToNext, prevToCurrent );
    const nonNormalisedNormal = v3cross( [1,0,0], tangent );
    const normal = v3norm( nonNormalisedNormal );

    // calculate the vector in the direction of curvature (toward centre of curvature)

    const curve = v3cross( tangent, normal );

    // return 3 unit vectors defining local coordinate system

    return [tangent, normal, curve];
}


function calcVerts( currentPoint, vertOffsets, normal, curve ) {

    // funtion to calculate the vertex position from the vertOffset data
    const offsetVert = vertOffset => v3sum( currentPoint,
                                            v3scale( normal, vertOffset.normal ),
                                            v3scale( curve , vertOffset.curve  )
                                          );

    // calculate the vertex positions and return them
    return vertOffsets.map( offsetVert );
}


function formEdges( currentVerts, profileEdges, sharpEdges=sharpEdges ) {

    const edges  = [];

    for( let i = 0; i < profileEdges; ++i ) {

        const ip = (i+1) % profileEdges;
        const newEdge = [ currentVerts[i], sharpEdges ? currentVerts[ip] : [] ];

        edges.push( ...newEdge.flat() );
    }

    return edges;
}


function formNormals( currentVerts, profileEdges, vertOffsets, tangent, sharpEdges=sharpEdges ) {

    const normals = [];

    for( let i = 0; i < profileEdges; ++i ) {
        
        const ip = (i+1) % profileEdges;

        const toNextVert = v3sub( currentVerts[ip], currentVerts[i] );
        const normal     = v3norm( v3cross( toNextVert, tangent ) );

        const newNormals = [ normal, sharpEdges ? normal : [] ];

        normals.push( ...newNormals.flat() );
    }

    return normals;
}


function formIndices( preVerts, profileEdges, sharpEdges=sharpEdges ) {

    const idxs = [];
    const vertIndexStep = 1 + sharpEdges;

    for( let j = 0; j < profileEdges; ++j ) {

        const newIdxs = [ 0, 1, 2*profileEdges, 1, 2*profileEdges+1, 2*profileEdges ].map( x => x + preVerts + j*vertIndexStep );

        idxs.push( ...newIdxs );
    }

    return idxs;
}


function insertIntoArray( source, target, start ) {

    for( let i = start; i < start + source.length; ++i )

        target[i] = source[i - start];
}


function calcGeometryData( points, verts, norms, idxs, vertOffsets, sharpEdges=true ) {

    // todo: add end caps & prevent vertex loops intersecting when curvature of path is large

    // the number of edges the profile of the geometry has
    const profileEdges = vertOffsets.length;

    // first calculate vertices and normal and curve vectors at the second point of points

    const [ prevPoint, currentPoint, nextPoint ] = points.slice(0, 3);

    const [ tangent, normal, curve ] = calcLocalCoordinateSystem( prevPoint, currentPoint, nextPoint );

    // calculate first set of vertex positions and insert them

    const newVerts   = calcVerts( currentPoint, vertOffsets, normal, curve );

    const newEdges   = formEdges( newVerts, profileEdges, sharpEdges=sharpEdges );
    insertIntoArray( newEdges  , verts, 0 );

    const newNormals = formNormals( newVerts, profileEdges, vertOffsets, tangent, sharpEdges=sharpEdges );
    insertIntoArray( newNormals, norms, 0 );


    // loop over all the subsequent points except the last
    // and populate the arrays which will be fed into webgl
    for( let idx = 2; idx < points.length-1; ++idx ) {

        // get the previous, current and next points
    
        const [ prevPoint, currentPoint, nextPoint ] = points.slice(idx-1, idx+2);

        // calculate local coordinate basis from curve

        const [ tangent, normal, curve ] = calcLocalCoordinateSystem( prevPoint, currentPoint, nextPoint );

        // calculate vertex positions at current point

        let newVerts = calcVerts( currentPoint, vertOffsets, normal, curve );

        // each iteration we push 2 corners of each profile edge, each corner has 3 components
        // profileEdges*2*3 = 6*profileEdges
        // each face takes 6 indices
        // profileEdges*6

        const vertBase = 6 * profileEdges * (idx-1) / (2 - sharpEdges);
        const preVerts = 2 * profileEdges * (idx-2) / (2 - sharpEdges);
        const idxBase  = 6 * profileEdges * (idx-2);

        const newEdges   = formEdges( newVerts, profileEdges, sharpEdges=sharpEdges );
        insertIntoArray( newEdges, verts, vertBase );

        const newNormals = formNormals( newVerts, profileEdges, vertOffsets, tangent, sharpEdges=sharpEdges );
        insertIntoArray( newNormals, norms, vertBase );

        const newIdxs    = formIndices( preVerts, profileEdges, sharpEdges=sharpEdges );
        insertIntoArray( newIdxs, idxs, idxBase );
    }
}


function calcGeometryDataOp( points, faces, norms, idxs ) {

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


function getCentrePoint( points ) {

    // calculate the sum of all the points
    let pointsSum = points.reduce( (acc,val) => v3add(acc,val), v3zero );

    // return the average point to approximate the centre of mass
    return v3scale( pointsSum, 1 / points.length );
}


function getBBox( inPoints ) {

    // loop over inPoints, getting the top and bottom corners
    let topCorner    = inPoints.reduce( (acc,val) => v3max( acc, val ), [-Infinity, -Infinity, -Infinity] );
    let bottomCorner = inPoints.reduce( (acc,val) => v3min( acc, val ), [ Infinity,  Infinity,  Infinity] );

    // return the bounding box
    return { right:     topCorner[0],
             left:   bottomCorner[0],
             top:       topCorner[1],
             bottom: bottomCorner[1],
             front:     topCorner[2],
             back:   bottomCorner[2],
             topCorner: topCorner,
             bottomCorner: bottomCorner,
             centre: v3scale( v3add(topCorner, bottomCorner), 0.5 ) };
}


function getBoundingPoints( inPoints ) {

    // loop over inPoints, getting the top and bottom corners
    let topCorner    = inPoints.reduce( (acc,val) => v3max( acc, val ), [-Infinity, -Infinity, -Infinity] );
    let bottomCorner = inPoints.reduce( (acc,val) => v3min( acc, val ), [ Infinity,  Infinity,  Infinity] );

    // return the bounding points
    return [ [    topCorner[0],    topCorner[1],    topCorner[2] ],
             [    topCorner[0],    topCorner[1], bottomCorner[2] ],
             [    topCorner[0], bottomCorner[1], bottomCorner[2] ],
             [ bottomCorner[0], bottomCorner[1], bottomCorner[2] ],
             [ bottomCorner[0], bottomCorner[1],    topCorner[2] ],
             [ bottomCorner[0],    topCorner[1],    topCorner[2] ],
             [ bottomCorner[0],    topCorner[1], bottomCorner[2] ],
             [    topCorner[0], bottomCorner[1],    topCorner[2] ]
           ]
}
