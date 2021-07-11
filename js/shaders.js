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

    highp vec3 directionalVector = normalize(vec3(1, 1, 1));
    highp vec3 diffuseColour     = vec3(245.0/255.0, 244.0/255.0, 240.0/255.0 );
    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

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
