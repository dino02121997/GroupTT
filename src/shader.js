var vertexShaderSource =
	'attribute vec3 aVertexPosition;'+
	'attribute vec3 aVertexNormal;'+
	'attribute vec2 aTextureCoord;'+
	''+
	'uniform mat4 uMVMatrix;'+
	'uniform mat4 uPMatrix;'+
	'uniform mat3 uNMatrix;'+
	'uniform mat4 vMatrix;'+
	''+
	'uniform vec3 uAmbientColor;'+
	''+
	'uniform vec3 uLightingDirection;'+
	'uniform vec3 uDirectionalColor;'+
	''+
	'uniform bool uUseLighting;'+
	''+
	'varying vec2 vTextureCoord;'+
	'varying vec3 vLightWeighting;'+
	''+
	'void main(void)'+
	'{'+
	' gl_Position = uPMatrix * vMatrix * uMVMatrix  * vec4(aVertexPosition, 1.0);'+
	' vTextureCoord = aTextureCoord;'+
	''+
	'if (!uUseLighting) {'+
	' vLightWeighting = vec3(1.0, 1.0, 1.0);'+
	'}' + 
	'else'+ 
	'{'+
	' vec3 transformedNormal = uNMatrix * aVertexNormal;'+
	' float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);'+
	' vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;'+
	'}'+
	'}';

var fragmentShaderSource = 
	'precision mediump float;'+
	''+
	'varying vec2 vTextureCoord;'+
	'varying vec3 vLightWeighting;'+
	''+
	'uniform sampler2D uSampler;'+
	''+
	'void main(void)'+
	'{'+
	' vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));'+
	' gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);'+
	'}';

var vertexShadowSource =
	'attribute vec4 aPosition;\n'+
	''+
	'uniform mat4 uMVMatrix;\n'+
	''+
	'void main()'+
	'{'+
	' gl_Position = uMVMatrix * aPosition;\n'+
	'}';

var fragmentShadowSource =
	'precision mediump float;\n'+
	''+
	'void main()'+
	'{'+
	' gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);\n'+
	'}';
	