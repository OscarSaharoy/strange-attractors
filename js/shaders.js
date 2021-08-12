// Oscar Saharoy 2021


// ==================================================================================================================
const vsSource = `
// ==================================================================================================================

precision mediump float;

uniform vec3 uViewPos;
uniform vec3 uSunPos;
uniform mat4 uNormalMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uSunVPMatrix;

attribute vec4 aVertexPosition;
attribute vec4 aVertexNormal;

varying vec4 vWorldPos;
varying vec4 vProjectedTexcoord;
varying vec3 vSurfaceToSun;
varying vec3 vSurfaceToView;
varying vec4 vNormal;
varying vec2 vTexPos;


void main() {

    vWorldPos   = uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vProjectedTexcoord = uSunVPMatrix * vWorldPos;

    vSurfaceToSun  = uSunPos  - vWorldPos.xyz;
    vSurfaceToView = uViewPos - vWorldPos.xyz;
    vNormal = uNormalMatrix * aVertexNormal;
    vTexPos = gl_Position.xy/gl_Position.w * 0.5 + 0.5;
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================

precision mediump float;

uniform vec3 uViewPos;
uniform sampler2D uShadowMap;
uniform sampler2D uOcclusionMap;
uniform float uShadowMapSize;
uniform vec2 uSampleOffsets[8];

varying vec4 vWorldPos;
varying vec4 vProjectedTexcoord;
varying vec3 vSurfaceToSun;
varying vec3 vSurfaceToView;
varying vec4 vNormal;
varying vec2 vTexPos;


float rand() {

    return fract( sin(dot(vWorldPos, vec4(19.9898, 75.233, -67.231, 31.2345))) * 43458.5453 );
}


float shadowLight() {

    vec3 projectedTexcoord = vProjectedTexcoord.xyz / vProjectedTexcoord.w;
    float currentDepth     = projectedTexcoord.z;

    vec2 texPos = projectedTexcoord.xy * 0.5 + 0.5;

    float outval = 0.0;

    for( int i = 0; i < 8; ++i ) {

        vec2 offset = uSampleOffsets[i] + (rand()-0.5)*0.4;

        float projectedDepth = texture2D( uShadowMap, texPos + offset * uShadowMapSize * 6e-7 ).r;
        outval += ( (projectedDepth < currentDepth - 1.5e-2) ? 0.0 : 1.0 ) / 8.0;
    }

    return outval;
}


void main() {

    vec3 material = vec3(1.0);//vec3(0.2);// vec3( 0.1, 0.4, 0.5 );

    vec3 surfaceToSunDir  = normalize(vSurfaceToSun );
    vec3 surfaceToViewDir = normalize(vSurfaceToView);

    vec3 halfway = normalize( surfaceToSunDir + surfaceToViewDir );

    float diffuse  = dot( vNormal.xyz, surfaceToSunDir );
    float specular = dot( vNormal.xyz, halfway         );
    float ambient  = texture2D( uOcclusionMap, vTexPos ).r;
    float shadow   = shadowLight();

    specular = clamp( specular, 0.0, 10000.0 );

    float light = ( 0.7*diffuse + 0.7*pow( specular, 60.0 ) + 0.2*ambient) * shadow + 0.01*ambient ;

    gl_FragColor = vec4( material * light, 1.0 );

    // gl_FragColor = mix( clamp(gl_FragColor,0.0,100.0), vec4(1.0,1.0,1.0,1.0), vProjectedTexcoord.z*0.1+0.0 ); // fog

    // gamma correction
    gl_FragColor = pow( gl_FragColor, vec4( 1.0/2.2 ) );

    // gl_FragColor = vec4( vec3(shadow), 1.0 );
}


// ==================================================================================================================
`; const vShadowShaderSource = `
// ==================================================================================================================

precision mediump float;

uniform vec3 uSunPos;
uniform mat4 uModelSunViewMatrix;
uniform mat4 uSunProjectionMatrix;

attribute vec4 aVertexPosition;

varying vec4 vLighting;

void main() {

    vec4 viewSpacePos = uModelSunViewMatrix  * aVertexPosition;
    gl_Position = uSunProjectionMatrix * viewSpacePos;

    float depth = gl_Position.z / gl_Position.w;
    vLighting = vec4( vec3(depth), 1.0 );
}


// ==================================================================================================================
`; const fShadowShaderSource = `
// ==================================================================================================================

precision mediump float;

varying mediump vec4 vLighting;

void main() {

    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vDepthShaderSource = `
// ==================================================================================================================

precision mediump float;

uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

attribute vec4 aVertexPosition;
attribute vec4 aVertexNormal;

varying vec4 vLighting;
varying vec4 vNormal;

void main() {

    vNormal = normalize( uNormalMatrix * aVertexNormal );
    vec4 viewPos = uViewMatrix * uModelMatrix * aVertexPosition;
    gl_Position  = uProjectionMatrix * viewPos;

    float depth  = length( viewPos.xyz );
    vLighting    = vec4( vNormal.xyz, depth );
}


// ==================================================================================================================
`; const fDepthShaderSource = `
// ==================================================================================================================

precision mediump float;

varying mediump vec4 vLighting;

void main() {

    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vAmbientOcclusionShaderSource = `
// ==================================================================================================================

precision mediump float;

uniform mat4 uInverseProjectionMatrix;

attribute vec4 aVertexPosition;

varying vec2 vTexPos;
varying vec3 vViewDir;

void main() {

    gl_Position = aVertexPosition;
    vTexPos = aVertexPosition.xy*0.5 + 0.5;

    vec4 viewPos = uInverseProjectionMatrix * aVertexPosition;
    vViewDir = viewPos.xyz;
    // vViewDir.z = -vViewDir.z;
}


// ==================================================================================================================
`; const fAmbientOcclusionShaderSource = `
// ==================================================================================================================

precision mediump float;

// TODO sort out aoRadius and depth difference check size

uniform mat4 uProjectionMatrix;
uniform sampler2D uDepthMap;
uniform vec3 uSampleOffsets[8];

varying vec2 vTexPos;
varying vec3 vViewDir;


float rand( float offset ) {

    return fract( sin(dot(vTexPos + offset, vec2(12.9898, 78.233))) * 43758.5453 );
}


// float shadowLight() {

//     vec3 projectedTexcoord = vProjectedTexcoord.xyz / vProjectedTexcoord.w;
//     float currentDepth     = projectedTexcoord.z;

//     vec2 texPos = projectedTexcoord.xy * 0.5 + 0.5;

//     float outval = 0.0;

//     for( int i = 0; i < 8; ++i ) {

//         vec2 offset = uSampleOffsets[i].xy + (rand()-0.5)*0.4;

//         float projectedDepth = texture2D( uShadowMap, texPos + offset * uShadowMapSize * 6e-7 ).r;
//         outval += ( (projectedDepth < currentDepth - 1.5e-2) ? 0.0 : 1.0 ) / 8.0;
//     }

//     return outval;
// }


void main() {

    float aoRadius = 0.5;

    vec4 bufferSample = texture2D( uDepthMap, vTexPos );
    vec3 viewPos = normalize(vViewDir) * bufferSample.w;



    if( bufferSample == vec4(0.0) ) return;

    vec3 viewSpaceNormal = normalize( bufferSample.xyz );

    vec3 randomVec = normalize( vec3( rand( -1.0 ), rand( 0.0 ), rand( 1.0 ) ) );
    vec3 tangent   = normalize( randomVec - viewSpaceNormal * dot(randomVec, viewSpaceNormal) );
    vec3 bitangent = cross(viewSpaceNormal, tangent);
    mat3 TBN       = mat3(tangent, bitangent, viewSpaceNormal);

    float occlusion = 0.0;
    vec3 samplePos;

    for( int i = 0; i < 8; ++i ) {

        samplePos = viewPos + TBN * uSampleOffsets[i] * aoRadius * rand(float(i));

        vec4 offset = uProjectionMatrix * vec4( samplePos, 1.0 );
        offset = offset / offset.w * 0.5 + 0.5;

        float sampleDepth = texture2D( uDepthMap, offset.xy ).w;

        float rangeCheck = smoothstep(0.0, 1.0, aoRadius / abs(bufferSample.w - sampleDepth));
        occlusion += (sampleDepth >= bufferSample.w - 0.05 || sampleDepth == 0.0 ? 1.0 : 0.0) / 8.0;
    }  

    // gl_FragColor = vec4( vec3(bufferSample.w / 100.0), 1.0 );
    gl_FragColor = vec4( vec3(occlusion), 1.0);
    // gl_FragColor = vec4( viewSpaceNormal, 1.0 );
    // gl_FragColor = vec4( viewPos, 1.0 );
}


// ==================================================================================================================
`;
