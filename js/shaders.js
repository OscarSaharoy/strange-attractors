// Oscar Saharoy 2021


// ==================================================================================================================
const vsSource = `
// ==================================================================================================================

uniform mediump vec3 uViewPos;
uniform mediump vec3 uSunPos;
uniform mediump mat4 uNormalMatrix;
uniform mediump mat4 uModelMatrix;
uniform mediump mat4 uModelViewMatrix;
uniform mediump mat4 uProjectionMatrix;
uniform mediump mat4 uSunVPMatrix;

attribute mediump vec4 aVertexPosition;
attribute mediump vec3 aVertexNormal;

varying mediump vec4 vWorldPos;
varying mediump vec4 vProjectedTexcoord;
varying mediump vec3 vSurfaceToSun;
varying mediump vec3 vSurfaceToView;
varying mediump vec4 vNormal;
varying mediump vec2 vTexPos;


void main() {

    vWorldPos   = uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vProjectedTexcoord = uSunVPMatrix * vWorldPos;

    vSurfaceToSun  = uSunPos  - vWorldPos.xyz;
    vSurfaceToView = uViewPos - vWorldPos.xyz;
    vNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
    vTexPos = gl_Position.xy/gl_Position.w * 0.5 + 0.5;
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================

uniform mediump vec3 uViewPos;
uniform sampler2D uShadowMap;
uniform sampler2D uOcclusionMap;
uniform mediump float uShadowMapSize;
uniform mediump vec2 uSampleOffsets[8];

varying mediump vec4 vWorldPos;
varying mediump vec4 vProjectedTexcoord;
varying mediump vec3 vSurfaceToSun;
varying mediump vec3 vSurfaceToView;
varying mediump vec4 vNormal;
varying mediump vec2 vTexPos;


mediump float rand() {

    return fract( sin(dot(vWorldPos, vec4(19.9898, 75.233, -67.231, 31.2345))) * 43458.5453 );
}


mediump float shadowLight() {

    mediump vec3 projectedTexcoord = vProjectedTexcoord.xyz / vProjectedTexcoord.w;
    mediump float currentDepth     = projectedTexcoord.z;

    mediump vec2 texPos = projectedTexcoord.xy * 0.5 + 0.5;

    mediump float outval = 0.0;

    for( int i = 0; i < 8; ++i ) {

        mediump vec2 offset = uSampleOffsets[i] + (rand()-0.5)*0.4;

        mediump float projectedDepth = texture2D( uShadowMap, texPos + offset * uShadowMapSize * 6e-7 ).r;
        outval += ( (projectedDepth < currentDepth - 1.5e-2) ? 0.0 : 1.0 ) / 8.0;
    }

    return outval;
}


void main() {

    mediump vec3 material = vec3(1.0);//vec3(0.2);// vec3( 0.1, 0.4, 0.5 );

    mediump vec3 surfaceToSunDir  = normalize(vSurfaceToSun );
    mediump vec3 surfaceToViewDir = normalize(vSurfaceToView);

    mediump vec3 halfway = normalize( surfaceToSunDir + surfaceToViewDir );

    mediump float diffuse  = dot( vNormal.xyz, surfaceToSunDir );
    mediump float specular = dot( vNormal.xyz, halfway         );
    mediump float ambient  = texture2D( uOcclusionMap, vTexPos ).r;
    mediump float shadow   = shadowLight();

    specular = clamp( specular, 0.0, 10000.0 );

    mediump float light = ( 0.5*diffuse + 0.7*pow( specular, 60.0 ) + 0.25*ambient) * shadow + 0.01*ambient ;

    gl_FragColor = vec4( material * light, 1.0 );

    // gl_FragColor = mix( clamp(gl_FragColor,0.0,100.0), vec4(1.0,1.0,1.0,1.0), vProjectedTexcoord.z*0.1+0.0 ); // fog

    // gamma correction
    gl_FragColor = pow( gl_FragColor, vec4( 1.0/2.2 ) );

    // gl_FragColor = vec4( vec3(ambient), 1.0 );
}


// ==================================================================================================================
`; const vShadowShaderSource = `
// ==================================================================================================================

uniform mediump vec3 uSunPos;
uniform mediump mat4 uModelSunViewMatrix;
uniform mediump mat4 uSunProjectionMatrix;

attribute mediump vec4 aVertexPosition;

varying mediump vec4 vLighting;

void main() {

    mediump vec4 viewSpacePos = uModelSunViewMatrix  * aVertexPosition;
    gl_Position = uSunProjectionMatrix * viewSpacePos;

    mediump float depth = gl_Position.z / gl_Position.w;
    vLighting = vec4( vec3(depth), 1.0 );
}


// ==================================================================================================================
`; const fShadowShaderSource = `
// ==================================================================================================================

varying mediump vec4 vLighting;

void main() {

    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vDepthShaderSource = `
// ==================================================================================================================

uniform mediump mat4 uViewMatrix;
uniform mediump mat4 uModelMatrix;
uniform mediump mat4 uProjectionMatrix;
uniform mediump mat4 uNormalMatrix;

attribute mediump vec4 aVertexPosition;
attribute mediump vec3 aVertexNormal;

varying mediump vec4 vLighting;
varying mediump vec4 vNormal;

void main() {

    mediump vec4 viewPos = uViewMatrix * uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * viewPos;

    vNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
    mediump float depth = length( viewPos.xyz );
    vLighting = vec4( vNormal.xyz, depth );
}


// ==================================================================================================================
`; const fDepthShaderSource = `
// ==================================================================================================================

varying mediump vec4 vLighting;

void main() {

    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vAmbientOcclusionShaderSource = `
// ==================================================================================================================

uniform mediump mat4 uInverseProjectionMatrix;

attribute mediump vec4 aVertexPosition;

varying mediump vec2 vTexPos;
varying mediump vec3 vViewDir;

void main() {

    gl_Position = aVertexPosition;
    vTexPos = aVertexPosition.xy*0.5 + 0.5;

    mediump vec4 viewPos = uInverseProjectionMatrix * aVertexPosition;
    vViewDir = viewPos.xyz;
}


// ==================================================================================================================
`; const fAmbientOcclusionShaderSource = `
// ==================================================================================================================

// TODO sort out aoRadius and depth difference check size

uniform mediump mat4 uProjectionMatrix;
uniform sampler2D uDepthMap;
uniform mediump vec3 uSampleOffsets[8];

varying mediump vec2 vTexPos;
varying mediump vec3 vViewDir;

mediump float rand( mediump float offset ) {

    return fract( sin(dot(vTexPos + offset, vec2(12.9898, 78.233))) * 43758.5453 );
}

void main() {

    mediump float aoRadius = 0.4;

    mediump vec4 bufferSample = texture2D( uDepthMap, vTexPos );
    mediump vec3 viewPos = normalize(vViewDir) * bufferSample.w;

    if( bufferSample == vec4(0.0) ) return;

    mediump vec3 viewSpaceNormal = normalize( bufferSample.xyz );

    mediump vec3 randomVec = normalize( vec3( rand( -1.0 ), rand( 0.0 ), rand( 1.0 ) ) );
    mediump vec3 tangent   = normalize( randomVec - viewSpaceNormal * dot(randomVec, viewSpaceNormal) );
    mediump vec3 bitangent = cross(viewSpaceNormal, tangent);
    mediump mat3 TBN       = mat3(tangent, bitangent, viewSpaceNormal);

    mediump float occlusion = 0.0;

    for( int i = 0; i < 8; ++i ) { 

        mediump vec3 samplePos = viewPos + TBN * uSampleOffsets[i] * aoRadius;

        mediump vec4 offset = uProjectionMatrix * vec4( samplePos, 1.0 );
        offset = offset / offset.w * 0.5 + 0.5;

        mediump float sampleDepth = texture2D( uDepthMap, offset.xy ).w;

        if( bufferSample.w - sampleDepth > 30.0 ) occlusion += 1.0/8.0;

        occlusion += (sampleDepth >= bufferSample.w ? 1.0 : 0.0) / 8.0;
    }  

    // gl_FragColor = vec4( vec3(bufferSample.w / 100.0), 1.0 );
    gl_FragColor = vec4( vec3(occlusion), 1.0);
    // gl_FragColor = bufferSample;
}


// ==================================================================================================================
`;
