// Oscar Saharoy 2021

const v3zero  = [0, 0, 0];

const v3add   = (vA, vB) => [ vA[0] + vB[0] ,
                              vA[1] + vB[1] , 
                              vA[2] + vB[2] ];

const v3sub   = (vA, vB) => [ vA[0] - vB[0] ,
                              vA[1] - vB[1] , 
                              vA[2] - vB[2] ];

const v3scale = (vA, s ) => [ vA[0] * s ,
                              vA[1] * s , 
                              vA[2] * s ];

const v3dot   = (vA, vB) => vA[0]*vB[0] + vA[1]*vB[1] + vA[2]*vB[2];

const v3cross = (vA, vB) => [ vA[1]*vB[2] - vA[2]*vB[1] ,
                              vA[2]*vB[0] - vA[0]*vB[2] , 
                              vA[0]*vB[1] - vA[1]*vB[0] ];

const v3sum   = (...vi ) => vi.reduce( (val, acc) => v3add( val, acc ), v3zero );

const v3mod   = (vA    ) => ( vA[0]**2 + vA[1]**2 + vA[2]**2 ) ** 0.5;                              

const v3norm  = (vA    ) => v3mod(vA) ? v3scale( vA, 1 / v3mod(vA) ) : v3zero;

const v3max   = (vA, vB) => [ Math.max(vA[0], vB[0]), Math.max(vA[1], vB[1]), Math.max(vA[2], vB[2]), ];
const v3min   = (vA, vB) => [ Math.min(vA[0], vB[0]), Math.min(vA[1], vB[1]), Math.min(vA[2], vB[2]), ];