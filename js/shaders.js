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
varying mediump vec4 vLighting;
varying mediump vec4 vProjectedTexcoord;

void main() {

    vWorldPos   = uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vProjectedTexcoord = uSunVPMatrix * vWorldPos;

    mediump vec3 material = vec3( 0.2, 0.2, 0.2 );
    mediump vec3 sunColor = vec3( 255.0, 235.0, 210.0 ) / 255.0 * 1.5;

    mediump vec3 sunDir   = normalize( uSunPos - aVertexPosition.xyz  );
    mediump vec3 viewDir  = normalize( aVertexPosition.xyz - uViewPos );

    mediump vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    mediump float diffuse    = dot( transformedNormal.xyz, sunDir );
    mediump vec4 linearColor = vec4( diffuse * sunColor * material, 1.0 );

    vLighting = linearColor;
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================

uniform sampler2D uShadowMap;

varying mediump vec4 vWorldPos;
varying mediump vec4 vLighting;
varying mediump vec4 vProjectedTexcoord;

void main() {

    mediump vec3 projectedTexcoord = vProjectedTexcoord.xyz / vProjectedTexcoord.w;
    mediump float currentDepth     = (vProjectedTexcoord.z + 1.0) * 0.007;

    mediump float projectedDepth   = texture2D( uShadowMap, projectedTexcoord.xy*0.5+0.5 ).r;
    mediump float shadowLight      = (projectedDepth < currentDepth - 1e-2) ? 0.0 : 1.0;

    gl_FragColor = vLighting * vec4( vec3(shadowLight), 1.0 );
    gl_FragColor = vec4(vec3(projectedDepth), 1.0);
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

    mediump float depth = (gl_Position.z + 1.0) * 0.007;
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
`;
