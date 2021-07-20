// Oscar Saharoy 2021


// ==================================================================================================================
const vsSource = `
// ==================================================================================================================

uniform mediump vec3 uViewPos;
uniform mediump vec3 uSunPos;

uniform mediump mat4 uNormalMatrix;
uniform mediump mat4 uModelViewMatrix;
uniform mediump mat4 uProjectionMatrix;

attribute mediump vec4 aVertexPosition;
attribute mediump vec3 aVertexNormal;

varying mediump vec4 vWorldPos;
varying mediump vec4 vLighting;

void main() {

    vWorldPos   = uModelViewMatrix  * aVertexPosition;
    gl_Position = uProjectionMatrix * vWorldPos;

    mediump vec3 material = vec3( 0.2, 0.2, 0.2 );

    mediump vec3 sunColor = vec3( 255.0, 235.0, 210.0 ) / 255.0 * 1.5;

    mediump vec3 sunDir   = normalize( aVertexPosition.xyz - uSunPos  );
    mediump vec3 viewDir  = normalize( aVertexPosition.xyz - uViewPos );

    mediump vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    mediump float diffuse     = dot( transformedNormal.xyz, sunDir ) + 2.0;
    mediump vec4 linearColor  = vec4( diffuse * sunColor * material, 1.0 );

    vLighting = pow( linearColor, vec4(1.0/2.2) );
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================

varying mediump vec4 vWorldPos;
varying mediump vec4 vLighting;

void main() {
    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vShadowShaderSource = `
// ==================================================================================================================

uniform mediump vec3 uSunPos;
uniform mediump mat4 uModelSunViewMatrix;
uniform mediump mat4 uShadowProjectionMatrix;

attribute mediump vec4 aVertexPosition;

varying mediump vec4 vLighting;

void main() {

    gl_Position = uShadowProjectionMatrix * uModelSunViewMatrix  * aVertexPosition;
    vLighting   = vec4( 0.0 );
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
