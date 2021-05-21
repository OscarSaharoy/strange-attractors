
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

// aizawa

// let a = 0.9, 
//     b = 0.7,
//     c = 0.6,
//     d = 3.5,
// 	e = 0.25,
// 	f = 0.1;

// const fx = (x,y,z) => (z-b) * x - d*y,
//       fy = (x,y,z) => d*x + (z-b) * y,
//       fz = (x,y,z) => c + a*z - z**3/3 - (x**2 + y**2) * (1 + e*z) + f*z*x**3;
