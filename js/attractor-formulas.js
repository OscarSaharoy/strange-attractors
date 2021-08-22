// Oscar Saharoy 2021

// lorenz

let rho_lorenz   = 28, 
    theta_lorenz = 10,
    beta_lorenz  = 8/3;

const fr_lorenz = ([x,y,z]) => [ theta_lorenz * ( y - x )   ,
                                 x * ( rho_lorenz - z ) - y ,
                                 x * y - beta_lorenz * z    ];

// chua

let a_chua = 40, 
    b_chua = 3,
    c_chua = 28;

const fx = (x,y,z) => a_chua * ( y - x ),
      fy = (x,y,z) => (c_chua-a_chua) * x - x*z + c_chua*y,
      fz = (x,y,z) => x*y - b_chua*z;

const fr_chua = ([x,y,z]) => [ a_chua * ( y - x )                  ,
                              (c_chua-a_chua) * x - x*z + c_chua*y ,
                               x*y - b_chua*z                      ];

// lu chen

let a_lu_chen = 36, 
    b_lu_chen = 3,
    c_lu_chen = 20,
    u_lu_chen = -15.15;

const fr_lu_chen = ([x,y,z]) => [ a_lu_chen * ( y - x )             ,
                                  x - x*z + c_lu_chen*y + u_lu_chen ,
                                  x*y - b_lu_chen*z                 ];

// rossler

let a_rossler = 0.1,        
    b_rossler = 0.1,
    c_rossler = 17;

const fr_rossler = ([x,y,z]) => [ - y - z                       ,
                                  b_rossler + y * (x-c_rossler) ,
                                  x + a_rossler*z               ];

// aizawa

let d = 0.9, 
    a = 0.7,
    c = 0.6,
    b = 3.5,
	e_aizawa = 0.25,
	f_aizawa = 0.1;

const fr_aizawa = ([x,y,z]) => [ (z-a) * x - b*y ,
                                 b*x + (z-a) * y ,
                                 c + d*z - z**3/3 - (x**2 + y**2) * (1 + e_aizawa*z) + f_aizawa*z*x**3 ];

let fr = fr_lorenz;