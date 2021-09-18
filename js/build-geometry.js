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
    if( v3mod(rk4step) > uProfileWidth ) return calcPointRK4( point, dt/2 );

    return v3add( r0, rk4step );
}


function calcLocalCoordinateSystem( prevPoint, currentPoint, nextPoint, lastCurve ) {

    // calculate the vector tangent to the curve
    
    const nonNormalisedTangent = v3sub( nextPoint, prevPoint );
    const tangent = v3norm( nonNormalisedTangent );

    // calculate the vector normal to the curve

    const prevToCurrent = v3sub( currentPoint, prevPoint );
    const currentToNext = v3sub( nextPoint, currentPoint );

    const nonNormalisedNormal = v3cross( lastCurve, tangent );
    const normal = v3norm( nonNormalisedNormal );

    // calculate the vector in the direction of curvature (toward centre of curvature)

    const curve = v3cross( tangent, normal );

    // return 3 unit vectors defining local coordinate system

    return [tangent, normal, curve];
}


function calcVerts( currentPoint, vertOffsets, normal, curve ) {

    // funtion to calculate the vertex position from the vertOffset data
    const offsetVert = vertOffset => v3sum( currentPoint,
                                            v3scale( normal, vertOffset[1] ),
                                            v3scale( curve , vertOffset[2]  )
                                          );

    // calculate the vertex positions and return them
    return vertOffsets.map( offsetVert );
}


function formEdges( currentVerts, profileEdges ) {

    // array to hold vertex positions as "edges" so storing
    // components of vertexes ABCD in the order A-B B-C C-D D-A
    const edges = [];

    // loop the over the number of edges the profile has
    for( let i = 0; i < profileEdges; ++i ) {

        // i is the index of the current vertx and i_next is the index
        // of the next one, the one its connected to by an edge
        const i_next = (i+1) % profileEdges;    

        // make a nested array containing the current and next vertex
        const newEdge = [ currentVerts[i], currentVerts[i_next] ];

        // flatten the nested array and add that into edges
        edges.push( ...newEdge.flat() );
    }

    return edges;
}


function formNormals( currentVerts, profileEdges, vertOffsets, tangent ) {

    // initialise an empty normals array
    const normals = [];

    // loop over all the profile's edges
    for( let i = 0; i < profileEdges; ++i ) {

        // get index of next vertex in currentVerts
        const i_next = (i+1) % profileEdges;

        // get a vector from this vert to the next and cross it with the tangent to get a normal
        const toNextVert = v3sub( currentVerts[i_next], currentVerts[i] );
        const normal     = v3norm( v3cross( toNextVert, tangent ) );

        // we need two normals, one for each vert in the edge; push those to normals
        normals.push( ...[ normal, normal ].flat() );
    }

    return normals;
}


function formIndices( preVerts, profileEdges ) {

    // make a blank indexes array and get the vertex step which is 1 for smooth shading
    // and 2 for flat shading
    const idxs = [];

    // loop over the number of edges, so 1 iteration per quad face
    for( let j = 0; j < profileEdges; ++j ) {

        // get the indexes of the quad using a little map - this is 2 triangles so 6 indexes
        const newIdxs = [ 0, 1, 2*profileEdges, 1, 2*profileEdges+1, 2*profileEdges ]
                            .map( x => x + preVerts + 2*j );

        // push the indexes into idxs
        idxs.push( ...newIdxs );
    }

    return idxs;
}


function insertIntoArray( source, target, start ) {

    // just loop over all the elements in the source array, putting them into the target array
    for( let i = 0; i < source.length; ++i )

        target[ start + i ] = source[i];
}


function formEndCapVerts( currentPoint, vertOffsets, normal, curve ) {

    // get the verts that make up the end cap, so one central one and then ones around the edge as normal
    return [ currentPoint, ...calcVerts(currentPoint, vertOffsets, normal, curve) ].flat();
}


function formEndCapNormals( tangent, profileEdges, reverseNormal=false ) {

    // the normals are all aligned along the tangent vector, so just repeat that
    // for as many vertices as we have and reverse it if neccessary
    return Array(profileEdges + 1)
          .fill( reverseNormal ? tangent : v3neg(tangent) )
          .flat();
}


function formEndCapIndices( preVerts, profileEdges, reverseNormal=false ) {

    // form indices for the end cap, basically tell the gpu to draw them in a triangle fan
    return [...Array(profileEdges).keys()]
              .map( v => reverseNormal ? [ 0, v+1, (v+1) % profileEdges + 1 ] : [ v+1, 0, (v+1) % profileEdges + 1 ] )
              .flat()
              .map( v => v + preVerts );
}


function calcOp( currentPoint, vertOffsets, tangent, normal, curve, profileEdges ) {

    let firstVert, prevVert;

    firstVert = v3sum( currentPoint,
                       v3scale( normal, vertOffsets[0][1] ),
                       v3scale( curve , vertOffsets[0][2] ) );

    prevVert = firstVert;

    const edges = [];
    const normals = [];

    for( let i = 1; i < profileEdges; ++i ) {

        const currentVert = v3sum( currentPoint,
                                   v3scale( normal, vertOffsets[i][1] ),
                                   v3scale( curve , vertOffsets[i][2] ) );

        const newEdge = [ prevVert, currentVert ];

        prevVert = currentVert;

        edges.push( ...newEdge.flat() );


        const toNextVert = v3sub( currentVert, prevVert );
        const newNormal  = v3norm( v3cross( toNextVert, tangent ) );

        const newNormals = [ newNormal, newNormal ];

        normals.push( ...newNormals.flat() );
    }

    const currentVert = v3sum( currentPoint,
                               v3scale( normal, vertOffsets[profileEdges-1][1] ),
                               v3scale( curve , vertOffsets[profileEdges-1][2] ) );

    const newEdge = [ currentVert, firstVert ];

    edges.push( ...newEdge.flat() );

    const toNextVert = v3sub( currentVert, prevVert );
    const newNormal  = v3norm( v3cross( toNextVert, tangent ) );

    const newNormals = [ newNormal, newNormal ];

    normals.push( ...newNormals.flat() );

    return [edges, normals];
}


function calcGeometryData( points, verts, norms, idxs, vertOffsets ) {

    // todo: add end caps & prevent vertex loops intersecting when curvature of path is large

    // the number of edges the profile of the geometry has
    const profileEdges = vertOffsets.length;

    // we use this last curve vector to store the previous point's curve vector
    // so that the sweep can have a consistent orientation without sudden twists
    let lastCurve = [0, 0, 1];

    // first calculate vertices and normal and curve vectors at the second point of points

    let [ prevPoint, currentPoint, nextPoint ] = points.slice(0, 3);

    let [ tangent, normal, curve ] = calcLocalCoordinateSystem( prevPoint, currentPoint, nextPoint, lastCurve );

    // cache the curve vector
    lastCurve = curve;

    // calculate and insert the start cap

    const startCapVerts   = formEndCapVerts( currentPoint, vertOffsets, normal, curve );
    insertIntoArray( startCapVerts  , verts, 0 );

    const startCapNormals = formEndCapNormals( tangent, profileEdges );
    insertIntoArray( startCapNormals, norms, 0 );

    const startCapIdxs    = formEndCapIndices( 0, profileEdges );
    insertIntoArray( startCapIdxs   , idxs , 0 );


    // calculate array offsets to place next verts & indices in the right place

    const startCapVertCount = profileEdges + 1;

    const startCapVertBase  = startCapVertCount*3;
    const startCapPreVerts  = startCapVertCount;
    const startCapIdxBase   = startCapVertCount*3;


    // calculate first set of vertex positions and insert them

    const newVerts   = calcVerts( currentPoint, vertOffsets, normal, curve );

    const newEdges   = formEdges( newVerts, profileEdges );
    insertIntoArray( newEdges  , verts, startCapVertBase );

    const newNormals = formNormals( newVerts, profileEdges, vertOffsets, tangent );
    insertIntoArray( newNormals, norms, startCapVertBase );


    // loop over all the subsequent points except the last
    // and populate the arrays which will be fed into webgl
    for( let idx = 2; idx < points.length-1; ++idx ) {

        // get the previous, current and next points
    
        [ prevPoint, currentPoint, nextPoint ] = points.slice(idx-1, idx+2);

        // calculate local coordinate basis from curve

        [ tangent, normal, curve ] = calcLocalCoordinateSystem( prevPoint, currentPoint, nextPoint, lastCurve );

        // cache the curve vector
        lastCurve = curve;

        // calculate vertex positions at current point

        const newVerts = calcVerts( currentPoint, vertOffsets, normal, curve );

        // each iteration we push 2 corners of each profile edge, each corner has 3 components
        // profileEdges*2*3 = 6*profileEdges
        // each face takes 6 indices
        // profileEdges*6

        const vertBase   = startCapVertBase + 6 * profileEdges * (idx-1);
        const preVerts   = startCapPreVerts + 2 * profileEdges * (idx-2);
        const idxBase    = startCapIdxBase  + 6 * profileEdges * (idx-2);

        const newEdges   = formEdges( newVerts, profileEdges );
        insertIntoArray( newEdges, verts, vertBase );

        const newNormals = formNormals( newVerts, profileEdges, vertOffsets, tangent );
        insertIntoArray( newNormals, norms, vertBase );

        // const [ newEdges, newNormals ] = calcOp( currentPoint, vertOffsets, tangent, normal, curve, profileEdges );
        // insertIntoArray( newEdges, verts, vertBase );
        // insertIntoArray( newNormals, norms, vertBase );

        const newIdxs    = formIndices( preVerts, profileEdges );
        insertIntoArray( newIdxs, idxs, idxBase );
    }


    // calcluate vertBase and idxBase for end cap

    const endCapVertBase = startCapVertBase + 6 * profileEdges * (points.length-2);
    const endCapPreVerts = startCapPreVerts + 2 * profileEdges * (points.length-2);
    const endCapIdxBase  = startCapIdxBase  + 6 * profileEdges * (points.length-3);

    // calculate and add in the end cap

    const endCapVerts    = formEndCapVerts( currentPoint, vertOffsets, normal, curve );
    insertIntoArray( endCapVerts  , verts, endCapVertBase );

    const endCapNormals  = formEndCapNormals( tangent, profileEdges, reverseNormal=true );
    insertIntoArray( endCapNormals, norms, endCapVertBase );

    const endCapIdxs     = formEndCapIndices( endCapPreVerts, profileEdges, reverseNormal=true );
    insertIntoArray( endCapIdxs   , idxs , endCapIdxBase );
}


function getCentrePoint( points ) {

    // calculate the sum of all the points
    let pointsSum = points.reduce( v3add, v3zero );

    // return the average point to approximate the centre of mass
    return v3scale( pointsSum, 1 / points.length );
}


function getBBox( inPoints ) {

    // loop over inPoints, getting the top and bottom corners
    let topCorner    = inPoints.reduce( v3max, v3neg(v3inf) );
    let bottomCorner = inPoints.reduce( v3min,       v3inf  );

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
    let topCorner    = inPoints.reduce( v3max, v3neg(v3inf) );
    let bottomCorner = inPoints.reduce( v3min,       v3inf  );

    // add an extra profile width onto the corners to make sure we dont miss any
    const extraBit   = [ uProfileWidth, uProfileWidth, uProfileWidth ];
    topCorner        = v3add( topCorner   , extraBit ); 
    bottomCorner     = v3sub( bottomCorner, extraBit );

    // make a corners array and all possible combinations for the 8 corners
    const corners    = [ topCorner, bottomCorner ];
    const combos     = [...Array(8).keys()].map( x => [1 & x, 1 & x>>1, 1 & x>>2] );

    // map the possible combos into corner coords and return
    return combos.map( ([c0,c1,c2]) => [ corners[c0][0], corners[c1][1], corners[c2][2] ] );
}
