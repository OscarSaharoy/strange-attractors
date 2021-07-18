// Oscar Saharoy 2021


// ==================================================================================================================
const vsSource = `
// ==================================================================================================================


attribute mediump vec4 aVertexPosition;
attribute mediump vec3 aVertexNormal;

uniform mediump vec3 viewPos;
uniform mediump vec3 sunPos;

uniform mediump mat4 uNormalMatrix;
uniform mediump mat4 uModelViewMatrix;
uniform mediump mat4 uProjectionMatrix;

varying mediump vec4 worldPos;
varying mediump vec4 vLighting;

void main() {

    worldPos    = uModelViewMatrix  * aVertexPosition;
    gl_Position = uProjectionMatrix * worldPos;

    mediump vec3 material = vec3( 0.2, 0.2, 0.2 );

    mediump vec3 sunColor = vec3( 255.0, 235.0, 210.0 ) / 255.0 * 1.5;

    mediump vec3 sunDir   = normalize( aVertexPosition.xyz - sunPos  );
    mediump vec3 viewDir  = normalize( aVertexPosition.xyz - viewPos );

    mediump vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    mediump float diffuse     = dot( transformedNormal.xyz, sunDir ) + 2.0;
    mediump vec4 linearColor  = vec4( diffuse * sunColor * material, 1.0 );

    vLighting = pow( linearColor, vec4(1.0/2.2) );
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================

varying mediump vec4 worldPos;
varying mediump vec4 vLighting;

void main() {
    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vaaShaderSource = `
// ==================================================================================================================

attribute vec4 aVertexPosition;
varying highp vec2 vTexCoord;

void main() {

    gl_Position = aVertexPosition;
    vTexCoord   = ( aVertexPosition.xy + 1.0 ) * 0.5;
}


// ==================================================================================================================
`; const faaShaderSource = `
// ==================================================================================================================


varying highp vec2 vTexCoord;
uniform sampler2D uSampler;

void main() {

    gl_FragColor = texture2D( uSampler, vTexCoord );
}


// ==================================================================================================================
`;
