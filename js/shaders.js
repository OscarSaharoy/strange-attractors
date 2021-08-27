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

#define SHADOW_SAMPLES 8

precision mediump float;

uniform vec3 uViewPos;
uniform sampler2D uShadowMap;
uniform sampler2D uOcclusionMap;
uniform float uShadowMapSize;
uniform vec2 uSampleOffsets[8];
uniform int uFrame;
uniform bool uFloatTexturesAvailable;

varying vec4 vWorldPos;
varying vec4 vProjectedTexcoord;
varying vec3 vSurfaceToSun;
varying vec3 vSurfaceToView;
varying vec4 vNormal;
varying vec2 vTexPos;


float decodeDepthTexture( vec2 depthRG ) {

    return depthRG.x + depthRG.y / 255.0;
}


float rand( float i ) {

    return fract( sin(dot(vWorldPos + i, vec4(19.9898, 75.233, -67.231, 31.2345))) * 43458.5453 );
}


float shadowLight() {

    vec3 projectedTexcoord = vProjectedTexcoord.xyz / vProjectedTexcoord.w;
    float currentDepth     = projectedTexcoord.z * 0.5 + 0.5;

    vec2 texPos = projectedTexcoord.xy * 0.5 + 0.5;

    float outval = 0.0;

    for( int i = 0; i < SHADOW_SAMPLES; ++i ) {

        vec2 offset = uSampleOffsets[i - (i>7?8:0) ] + (rand(float(i))-0.5)*0.4;

        float projectedDepth = decodeDepthTexture( texture2D( uShadowMap, texPos + offset * uShadowMapSize * 4e-7 ).rg );
        outval += (projectedDepth < currentDepth - 0.004) ? 0.0 : 1.0 / float(SHADOW_SAMPLES);
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
    float ambient  = uFloatTexturesAvailable ? texture2D( uOcclusionMap, vTexPos ).r : 1.0;
    float shadow   = shadowLight();

    specular = clamp( specular, 0.0, 10000.0 );

    float light = ( 0.4*diffuse + 0.4*pow( specular, 6.0 ) + 0.4*ambient) * shadow + 0.01*ambient ;

    gl_FragColor = vec4( material * light, 1.0 );

    // gl_FragColor = mix( clamp(gl_FragColor,0.0,100.0), vec4(1.0,1.0,1.0,1.0), vProjectedTexcoord.z*0.1+0.0 ); // fog

    // gamma correction
    gl_FragColor = pow( gl_FragColor, vec4( 1.0/2.2 ) );

    // gl_FragColor = vec4( texture2D( uOcclusionMap, vTexPos ) );
}


// ==================================================================================================================
`; const vShadowShaderSource = `
// ==================================================================================================================

precision mediump float;

uniform vec3 uSunPos;
uniform mat4 uModelSunViewMatrix;
uniform mat4 uSunProjectionMatrix;

attribute vec4 aVertexPosition;

varying float depth;

void main() {

    vec4 viewSpacePos = uModelSunViewMatrix  * aVertexPosition;
    gl_Position = uSunProjectionMatrix * viewSpacePos;

    depth = gl_Position.z / gl_Position.w * 0.5 + 0.5;
}


// ==================================================================================================================
`; const fShadowShaderSource = `
// ==================================================================================================================

precision mediump float;

varying float depth;


vec2 encodeDepthTexture( float depth ) {

    float r = floor( depth * 255.0 ) / 255.0;
    float g = ( depth - r ) * 255.0;

    return vec2( r, g );
}


void main() {

    gl_FragColor = vec4( encodeDepthTexture(depth), vec2(1.0) );
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

    vNormal      = uNormalMatrix * vec4( aVertexNormal.xyz, 0.0 );
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

#define AO_SAMPLES 8

precision mediump float;

uniform float uProfileWidth;
uniform mat4 uProjectionMatrix;
uniform sampler2D uDepthMap;
uniform vec3 uSampleOffsets[8];

varying vec2 vTexPos;
varying vec3 vViewDir;


vec3 rand( vec3 seed ) {

    return fract( sin(cross(seed, vec3(12.9898, 78.233, 55.55))) * 43758.5453 );
}


vec3 randOnSphere( float r ) {

    float z = ( rand(r + vViewDir).x - 0.5 ) * 2.0 * r;

    float rf = sqrt( r*r - z*z );

    float theta = rand(r + vViewDir).y * 2.0 * 3.14159;

    float x = rf * cos( theta );
    float y = rf * sin( theta );

    return vec3( x, y, z );
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

    // first get a sample from the buffer at the frag position
    vec4 bufferSample = texture2D( uDepthMap, vTexPos );
    
    // if its all zero then return as it's outside the geometry
    if( bufferSample.xyz == vec3(0.0) ) return;

    // calculate the view space normal and view space position of the current frag on the geometry
    vec3 viewSpaceNormal = normalize( bufferSample.xyz );
    float viewDepth      = bufferSample.w;
    vec3 viewPos         = normalize(vViewDir) * bufferSample.w;

    // create a TBN matrix aligned with the view space normal but with random axial rotation
    vec3 randomVec = normalize( rand( viewPos ) );
    vec3 tangent   = normalize( randomVec - viewSpaceNormal * dot(randomVec, viewSpaceNormal) );
    vec3 bitangent = cross(viewSpaceNormal, tangent);
    mat3 TBN       = mat3(tangent, bitangent, viewSpaceNormal);

    float aoRadius = 0.6*uProfileWidth;
    float ambientLight = 0.0;

    // loop over 8 nearby samples
    for( int i = 0; i < AO_SAMPLES; ++i ) {

        // get the view space position of the other sample as the position of the
        // current frag plus an offset scaled by aoRadius and transformed by the TBN matrix
        vec3 otherSamplePos = viewPos + TBN * uSampleOffsets[i] * aoRadius;// - viewSpaceNormal * 0.1;

        // get the clip position of the other sample
        vec4 otherSampleClipPos = uProjectionMatrix * vec4( otherSamplePos, 1.0 );
        otherSampleClipPos = otherSampleClipPos / otherSampleClipPos.w * 0.5 + 0.5;

        // get the depth of the other sample and the geometry depth there
        float otherSampleDepth = length( otherSamplePos );
        float otherSampleGeometryDepth = texture2D( uDepthMap, otherSampleClipPos.xy ).w;

        // if the other sample is further from the camera than the geometry is at that location,
        // add nothing to the ambient light
        float depthDelta   = otherSampleGeometryDepth - otherSampleDepth;
        float depthDropoff = 3.2*uProfileWidth;
        float passingLight = 1.0/float(AO_SAMPLES) * ( 1.0 + depthDropoff / ( depthDelta - depthDropoff ) );
        ambientLight      += depthDelta >= 0.0 ? 1.0/float(AO_SAMPLES) : passingLight;
    }

    // for( int i = 0; i < 8; ++i ) {

    //     float r = sqrt( float(i) + 1.0 ) / 3.0;

    //     vec3 onSphere = randOnSphere( r );

    //     if( dot(onSphere, viewSpaceNormal) < 0.0 ) onSphere = -onSphere;

    //     samplePos = viewPos + onSphere;

    //     vec4 offset = uProjectionMatrix * vec4( samplePos, 1.0 );
    //     offset = offset / offset.w * 0.5 + 0.5;

    //     float sampleDepth = texture2D( uDepthMap, offset.xy ).w;

    //     ambientLight += (sampleDepth >= bufferSample.w - 0.05 ? 1.0 : 0.0) / 8.0;
    // } 

    // gl_FragColor = vec4( vec3(bufferSample.w / 100.0), 1.0 );
    gl_FragColor = vec4( vec3(ambientLight), 1.0);
    // gl_FragColor = vec4( viewSpaceNormal, 1.0 );
    // gl_FragColor = vec4( uProfileWidth );
}


// ==================================================================================================================
`;


const fStolenShaderSource = `

// total number of samples at each fragment
#define NUM_SAMPLES           9

#define NUM_SPIRAL_TURNS      7

#define USE_ACTUAL_NORMALS    1

#define VARIATION             0

#define uSampleRadiusWS 1.5
#define uIntensity 1.0
#define uNoiseScale 1.0
#define uBias 0.05

// uniform sampler2D sNoise;
// uniform float uFOV;

uniform sampler2D uDepthMap;
varying vec2 vTexPos;


float rand( vec4 offset ) {

    return fract( sin(dot(vTexPos.xyxy + offset, vec4(19.9898, 75.233, -67.231, 31.2345))) * 43458.5453 );
}

vec3 getPositionVS(vec2 uv) {
  float depth = decodeGBufferDepth(sGBuffer, uv, clipFar);
  
  vec2 uv2  = uv * 2.0 - vec2(1.0);
  vec4 temp = viewProjectionInverseMatrix * vec4(uv2, -1.0, 1.0);
  vec3 cameraFarPlaneWS = (temp / temp.w).xyz;
  
  vec3 cameraToPositionRay = normalize(cameraFarPlaneWS - cameraPositionWorldSpace);
  vec3 originWS = cameraToPositionRay * depth + cameraPositionWorldSpace;
  vec3 originVS = (viewMatrix * vec4(originWS, 1.0)).xyz;
  
  return originVS;
}

// returns a unit vector and a screen-space radius for the tap on a unit disk 
// (the caller should scale by the actual disk radius)
vec2 tapLocation(int sampleNumber, float spinAngle, out float radiusSS) {
  // radius relative to radiusSS
  float alpha = (float(sampleNumber) + 0.5) * (1.0 / float(NUM_SAMPLES));
  float angle = alpha * (float(NUM_SPIRAL_TURNS) * 6.28) + spinAngle;
  
  radiusSS = alpha;
  return vec2(cos(angle), sin(angle));
}

vec3 getOffsetPositionVS(vec2 uv, vec2 unitOffset, float radiusSS) {
  uv = uv + radiusSS * unitOffset * (1.0 / viewportResolution);
  
  return getPositionVS(uv);
}

float sampleAO(vec2 uv, vec3 positionVS, vec3 normalVS, float sampleRadiusSS, 
               int tapIndex, float rotationAngle)
{
  const float epsilon = 0.01;
  float radius2 = uSampleRadiusWS * uSampleRadiusWS;
  
  // offset on the unit disk, spun for this pixel
  float radiusSS;
  vec2 unitOffset = tapLocation(tapIndex, rotationAngle, radiusSS);
  radiusSS *= sampleRadiusSS;
  
  vec3 Q = getOffsetPositionVS(uv, unitOffset, radiusSS);
  vec3 v = Q - positionVS;
  
  float vv = dot(v, v);
  float vn = dot(v, normalVS) - uBias;
  
#if VARIATION == 0
  
  // (from the HPG12 paper)
  // Note large epsilon to avoid overdarkening within cracks
  return float(vv < radius2) * max(vn / (epsilon + vv), 0.0);
  
#elif VARIATION == 1 // default / recommended
  
  // Smoother transition to zero (lowers contrast, smoothing out corners). [Recommended]
  float f = max(radius2 - vv, 0.0) / radius2;
  return f * f * f * max(vn / (epsilon + vv), 0.0);
  
#elif VARIATION == 2
  
  // Medium contrast (which looks better at high radii), no division.  Note that the 
  // contribution still falls off with radius^2, but we've adjusted the rate in a way that is
  // more computationally efficient and happens to be aesthetically pleasing.
  float invRadius2 = 1.0 / radius2;
  return 4.0 * max(1.0 - vv * invRadius2, 0.0) * max(vn, 0.0);
  
#else
  
  // Low contrast, no division operation
  return 2.0 * float(vv < radius2) * max(vn, 0.0);
  
#endif
}

void main() {
  vec3 originVS = getPositionVS(vTexPos);
  
  vec4 bufferSample = texture2D( uDepthMap, vTexPos );
  
  vec3 normalVS = bufferSample.xyz;
  
  float randomPatternRotationAngle = 2.0 * PI * rand( normalVS.xyzz );
  
    // TODO (travis): don't hardcode projScale
  float projScale = 40.0;//1.0 / (2.0 * tan(uFOV * 0.5));
  float radiusWS = uSampleRadiusWS;
  float radiusSS = projScale * radiusWS / originVS.y;

  float occlusion = 0.0;
  
  for (int i = 0; i < NUM_SAMPLES; ++i) {
    occlusion += sampleAO(vTexPos, originVS, normalVS, radiusSS, i, 
                          randomPatternRotationAngle);
  }
  
  occlusion = 1.0 - occlusion / (4.0 * float(NUM_SAMPLES));
  occlusion = clamp(pow(occlusion, 1.0 + uIntensity), 0.0, 1.0);
  gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);
}

`;