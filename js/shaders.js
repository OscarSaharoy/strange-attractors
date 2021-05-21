// Oscar Saharoy 2021


// ==================================================================================================================
const vsSource = `
// ==================================================================================================================


attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vLighting;

void main() {

    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    highp vec3 directionalLightColor = vec3(0.8, 0.97, 1);
    highp vec3 directionalVector     = normalize(vec3(0.85, 0.8, 0.75));
    highp vec3 diffuseColour         = vec3(255.0/255.0, 247.0/255.0, 242.0/255.0 );
    highp vec4 transformedNormal     = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = dot(transformedNormal.xyz, directionalVector) * 0.2 + 0.75;
    vLighting = vec4( diffuseColour * directional, 1.0 );
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================


varying highp vec4 vLighting;   

void main() {
    gl_FragColor = vLighting;
}


// ==================================================================================================================
`; const vCopyShaderSource = `
// ==================================================================================================================


// precision mediump float;

attribute vec4 aVertexPosition;
varying vec4 vFragCoord;

void main() {
    gl_Position   = aVertexPosition;
    vFragCoord.xy = aVertexPosition.xy;
}


// ==================================================================================================================
`; const fCopyShaderSource = `
// ==================================================================================================================


void main() {
    gl_FragColor = vec4( 0, 0, 0, 1 );
}


// ==================================================================================================================
`;
