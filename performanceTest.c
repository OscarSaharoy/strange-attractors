#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define dt 1e-2

void pushNextPointOpt(  double** points, int i );
void pushNextPointOpt2( double** points, int i );

    double* points[500000] = {0};

int main() {


    if( !points ) {

        printf("malloc failed");
        return 0;
    }

    points[0] = malloc( 3 * sizeof(double) );
    points[0][0] = 1;
    points[0][1] = 0;
    points[0][2] = 0;

    clock_t start = clock();

    for( int i=1; i<500000; ++i )
        pushNextPointOpt(points, i);

    clock_t end = clock();

    printf( "%f\n", (double)(end - start) / CLOCKS_PER_SEC );
    
    for( int i=0; i<500000; ++i )
        printf("%f, %f, %f\n", points[i][0], points[i][1], points[i][2] );

}



void pushNextPointOpt( double** points, int i ) {

    double x = points[i-1][0];
    double y = points[i-1][1];
    double z = points[i-1][2];

    double x0 = x;
    double y0 = y;
    double z0 = z;

    // calculate RK4 intermediate values

    double dx1 = 10 * ( y  - x );
    double dy1 = x  * ( 28 - z ) - y;
    double dz1 = x  *   y  - 8/3 * z;

    x = x0 + dx1 * dt*0.5;
    y = y0 + dy1 * dt*0.5;
    z = z0 + dz1 * dt*0.5;

    double dx2 = 10 * ( y  - x );
    double dy2 = x  * ( 28 - z ) - y;
    double dz2 = x  *   y  - 8/3 * z;

    x = x0 + dx2 * dt*0.5;
    y = y0 + dy2 * dt*0.5;
    z = z0 + dz2 * dt*0.5;

    double dx3 = 10 * ( y  - x );
    double dy3 = x  * ( 28 - z ) - y;
    double dz3 = x  *   y  - 8/3 * z;

    x = x0 + dx3 * dt;
    y = y0 + dy3 * dt;
    z = z0 + dz3 * dt;

    double dx4 = 10 * ( y  - x );
    double dy4 = x  * ( 28 - z ) - y;
    double dz4 = x  *   y  - 8/3 * z;
    
    // calculate the overall RK4 step
    points[i] = malloc( 3 * sizeof(double) );
    points[i][0] = x0 + ( dx1 + 2*dx2 + 2*dx3 + dx4 ) * dt/6;
    points[i][1] = y0 + ( dy1 + 2*dy2 + 2*dy3 + dy4 ) * dt/6;
    points[i][2] = z0 + ( dz1 + 2*dz2 + 2*dz3 + dz4 ) * dt/6;
}


void pushNextPointOpt2( double** points, int i ) {

    double x = points[i-1][0];
    double y = points[i-1][1];
    double z = points[i-1][2];

    // calculate RK4 intermediate values

    double dx1 = 10 * ( y  - x );
    double dy1 = x  * ( 28 - z ) - y;
    double dz1 = x  *   y  - 8/3 * z;

    points[i] = malloc( 3 * sizeof(double) );
    points[i][0] = x + dx1 * dt;
    points[i][1] = y + dy1 * dt;
    points[i][2] = z + dz1 * dt;
}