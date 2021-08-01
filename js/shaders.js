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
// varying mediump vec4 vLighting;
varying mediump vec4 vNormal;


void main() {


    vWorldPos   = uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vProjectedTexcoord = uSunVPMatrix * vWorldPos;

    vSurfaceToSun  = uSunPos  - vWorldPos.xyz;
    vSurfaceToView = uViewPos - vWorldPos.xyz;
    vNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
}


// ==================================================================================================================
`; const fsSource = ` 
// ==================================================================================================================

uniform sampler2D uShadowMap;

varying mediump vec4 vWorldPos;
varying mediump vec4 vProjectedTexcoord;
varying mediump vec3 vSurfaceToSun;
varying mediump vec3 vSurfaceToView;
// varying mediump vec4 vLighting;
varying mediump vec4 vNormal;


mediump float shadowLight() {

    mediump vec3 projectedTexcoord = vProjectedTexcoord.xyz / vProjectedTexcoord.w;
    mediump float currentDepth     = projectedTexcoord.z;

    mediump float projectedDepth   = texture2D( uShadowMap, projectedTexcoord.xy*0.5+0.5 ).r;
    mediump float outval           = (projectedDepth < currentDepth - 1.5e-2) ? 0.2 : 1.0;

    mediump float projectedDepth1  = texture2D( uShadowMap, projectedTexcoord.xy*0.5+0.5 ).r;


    return outval;
}


void main() {

    mediump vec3 material = vec3( 0.5, 0.5, 0.5 );

    mediump vec3 surfaceToSunDir  = normalize(vSurfaceToSun );
    mediump vec3 surfaceToViewDir = normalize(vSurfaceToView);

    mediump vec3 halfway = normalize( surfaceToSunDir + surfaceToViewDir );

    mediump float diffuse  = dot( vNormal.xyz, surfaceToSunDir );
    mediump float specular = dot( vNormal.xyz, halfway         );

    if( specular < 0.0 ) specular = 0.0;

    mediump vec4 light = vec4( diffuse * material, 1.0 ) + 0.7*pow( specular, 10.0 );

    gl_FragColor = light * vec4( vec3(shadowLight()), 1.0 );

    mediump float viewDist = length( vSurfaceToView );
    // gl_FragColor = mix( clamp(gl_FragColor,0.0,100.0), vec4(1.0,1.0,1.0,1.0), viewDist*0.001 ); // fog

    // gamma correction
    gl_FragColor = pow( gl_FragColor, vec4( 1.0/2.2 ) );
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
`;
