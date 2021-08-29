
use wasm_bindgen::prelude::*;
extern crate nalgebra_glm as glm;
use nalgebra_glm::Vec3;

#[wasm_bindgen]
pub fn test() -> f32 {
    
    let vec : Vec3 = glm::vec3( 1.7, 1.7, 1.7 );
    vec.x
}


// #[wasm_bindgen]
// fn calcPointRK4( point:, dt:f32 ) -> {

//     // get current x y and z from the points array
//     // and cache the initial values

//     let   r  = point;
//     const r0 = point;

//     // calculate rk4 intermediate values

//     const dr1 = fr(r);
    
//     r = v3add( r0, v3scale( dr1, dt/2 ) );

//     const dr2 = fr(r);

//     r = v3add( r0, v3scale( dr2, dt/2 ) );
    
//     const dr3 = fr(r);

//     r = v3add( r0, v3scale( dr3, dt ) );
    
//     const dr4 = fr(r);

//     // compute the overall rk4 step

//     const rk4step = [ ( dr1[0] + 2*dr2[0] + 2*dr3[0] + dr4[0] ) * dt/6 ,
//                       ( dr1[1] + 2*dr2[1] + 2*dr3[1] + dr4[1] ) * dt/6 ,
//                       ( dr1[2] + 2*dr2[2] + 2*dr3[2] + dr4[2] ) * dt/6 ];

//     // add the overall rk4 step onto the start position

//     // if the step is too large, calculate again with a smaller dt
//     if( v3mod(rk4step) > uProfileWidth ) return calcPointRK4( point, dt/2 );

//     return v3add( r0, rk4step );
// }