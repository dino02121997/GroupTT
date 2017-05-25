var gl, text;
function initGL(canvas, char)
{
	gl = canvas.getContext("experimental-webgl");
    text = char.getContext("2d");
	/*canvas.width = window.innerWidth;		//Full size
    canvas.height = window.innerHeight;*/
    text.viewportWidth = canvas.width;
    text.viewportHeight = canvas.height;
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
}

var normalProgram;
var shadowProgram;

function initShader()
{
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);

	gl.shaderSource(fragShader, fragmentShaderSource);
	gl.shaderSource(vertexShader, vertexShaderSource);

	gl.compileShader(fragShader);
	gl.compileShader(vertexShader);

	normalProgram = gl.createProgram();
	gl.attachShader(normalProgram, vertexShader);
	gl.attachShader(normalProgram, fragShader);
	gl.linkProgram(normalProgram);

	if (!gl.getProgramParameter(normalProgram, gl.LINK_STATUS))
	{
		alert("Could not initialise shaders");
	}

	gl.useProgram(normalProgram);

	normalProgram.vertexPositionAttribute = gl.getAttribLocation(normalProgram, "aVertexPosition");
	gl.enableVertexAttribArray(normalProgram.vertexPositionAttribute);

	normalProgram.textureCoordAttribute = gl.getAttribLocation(normalProgram, "aTextureCoord");
	gl.enableVertexAttribArray(normalProgram.textureCoordAttribute);

	normalProgram.vertexNormalAttribute = gl.getAttribLocation(normalProgram, "aVertexNormal");
	gl.enableVertexAttribArray(normalProgram.vertexNormalAttribute);

	normalProgram.pMatrixUniform = gl.getUniformLocation(normalProgram, "uPMatrix");
	normalProgram.mvMatrixUniform = gl.getUniformLocation(normalProgram, "uMVMatrix");
	normalProgram.nMatrixUniform = gl.getUniformLocation(normalProgram, "uNMatrix");
	normalProgram.samplerUniform = gl.getUniformLocation(normalProgram, "uSampler");
	normalProgram.uVMatrixUniform = gl.getUniformLocation(normalProgram, "vMatrix");
	normalProgram.useLightingUniform = gl.getUniformLocation(normalProgram, "uUseLighting");
	normalProgram.ambientColorUniform = gl.getUniformLocation(normalProgram, "uAmbientColor");
	normalProgram.lightingDirectionUniform = gl.getUniformLocation(normalProgram, "uLightingDirection");
	normalProgram.directionalColorUniform = gl.getUniformLocation(normalProgram, "uDirectionalColor");

/*	//create shadow program
	gl.shaderSource(fragShader, fragmentShadowSource);
	gl.shaderSource(vertexShader, vertexShadowSource);

	gl.compileShader(fragShader);
	gl.compileShader(vertexShader);

	shadowProgram = gl.createProgram();
	gl.attachShader(shadowProgram, vertexShader);
	gl.attachShader(shadowProgram, fragShader);
	gl.linkProgram(shadowProgram);
	if (!gl.getProgramParameter(shadowProgram, gl.LINK_STATUS))
	{
		alert("Could not initialise shaders");
	}
	gl.useProgram(shadowProgram);

	shadowProgram.vertexPositionAttribute = gl.getAttribLocation(shadowProgram, "aPosition");

	shadowProgram.mvMatrixUniform = gl.getUniformLocation(shadowProgram, "uMVMatrix");
*/
}

function handleLoadedTexture(texture) //Load texture
{
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);

	gl.bindTexture(gl.TEXTURE_2D, null);
}

var sphereTexture;
var cubeTexture;
var sceneTexture;

function initTexture()	//Load image
{
	sphereTexture = gl.createTexture();
	sphereTexture.image = new Image();
	sphereTexture.image.onload = function()
	{
		handleLoadedTexture(sphereTexture);
	}
	sphereTexture.image.src = "src/tenis.jpg";

	cubeTexture = gl.createTexture();
	cubeTexture.image = new Image();
	cubeTexture.image.onload = function()
	{
		handleLoadedTexture(cubeTexture);
	}
	cubeTexture.image.src = "src/smiley.png";

    sceneTexture = gl.createTexture();
    sceneTexture.image = new Image();
    sceneTexture.image.onload = function()
    {
        handleLoadedTexture(sceneTexture);
    }
    sceneTexture.image.src = "src/scene2.jpg";
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var vMatrix = mat4.create();

function mvPushMatrix()
{
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix()
{
	if (mvMatrixStack.length == 0)
	{
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

var normalMatrix = mat3.create();
mat4.toInverseMat3(mvMatrix, normalMatrix);
mat3.transpose(normalMatrix);

function setMatrixUniforms(program)
{
	gl.uniformMatrix4fv(program.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(program.mvMatrixUniform, false, mvMatrix);
	gl.uniformMatrix4fv(program.uVMatrixUniform, false, vMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(program.nMatrixUniform, false, normalMatrix);
	//gl.uniformMatrix4fv(program.uVMatrixUniform, false, uVMatrix);
}

function degToRad(degress)
{
	return degress * Math.PI / 180;
}

var xRot = 0, zRot = 0;     //rotate sphere
var x = 0, y = 3, z =0;     //location sphere
var xE = 0, yE = 15, zE = 15; //location camera
var currentlyPressedKeys = {}; //Phím hiện hành đang ấn
var ax= 0, az = 0;  //acceleration of sphere with ox, oz
var flagx = 1, flagz = 1; //check direction of sphere

function handleKeyDown(event)
{
	status_start = true;
    status_pause = false;
	currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event)
{
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys()
{
	var size = 0.2;
	//Change rotate of camera
   	if (currentlyPressedKeys[33]) //Page Up
        yE +=size;
   	if (currentlyPressedKeys[34]) //Page down
        yE -=size;
   	if(currentlyPressedKeys[87]) //w
   		xE +=size;
   	if(currentlyPressedKeys[83])//s
   		xE -=size;
   	if(currentlyPressedKeys[65])//a
   		zE +=size;
   	if(currentlyPressedKeys[68])//d
   		zE -=size;
    if(currentlyPressedKeys[32])//space, reset game and you will to menu
        newGame();
    if(currentlyPressedKeys[27])//esc
        status_pause = true;

   	//control sphere
   	if (currentlyPressedKeys[37]) //left
   	{
        if (ax >= 0 && flagx == 1)
        {
        	ax -= 0.03;
        }
        else
        {
	        ax+=0.02;
	       	flagx = -1;	
        }
   	}
   	if (currentlyPressedKeys[38])//Up
   	{
        if (az >= 0 && flagz == 1)
        {
        	az -= 0.03;
        } else
        {
			az+=0.02;
	        flagz = -1;
        }      
   	}
   	if (currentlyPressedKeys[39]) //right
   	{
        if (ax >= 0 && flagx == -1)
        {
        	ax -= 0.03;
        } else
        {
        	ax+=0.02;
            flagx = 1;
        }
   	}
   	if (currentlyPressedKeys[40]) //down
   	{
        if (az >= 0 && flagz == -1)
        {
        	az -= 0.03;
        } else
        {
        	az+=0.02;
       		flagz = 1;
        }
   	}
}

var a = 0.5; //acceleration of sphere
var v = 3; //speed of sphere
var maxX = 50, maxZ = 50, minX = -50, minZ = -50;
function acceleration()
{
	if (ax >= 0)
	{
		if(flagx == 1)
		{
			x+=a*ax*ax;
			xE+=a*ax*ax;
			xRot -= ax* v;
			if (x >= maxX) flagx = -1;
		} else 
		{
			x-=a*ax*ax;
			xE-=a*ax*ax;
			xRot += ax* v;
			if (x <= minX) flagx = 1;
		}
		ax-=0.01;
	}
	if (az >= 0)
	{
		if (flagz == 1)
		{
			z += a*az*az;
			zE+=a*az*az;
			zRot += az* v;
			if (z >= maxZ) flagz = -1;
		} else 
		{
			z -= a*az*az;
			zE-=a*az*az;
			zRot -=az * v;
			if (z <= minZ) flagz = 1;
		}
		az-=0.01;
	}
}

var sceneVertexPositionBuffer;
var sceneVertexTextureCoorBuffer;
var sceneVertexIndexBuffer;
var sceneVertexNormalBuffer;

function initBufferScene()
{
	sceneVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
    vertices = [
        -50, -50,  1.0,
        50, -50,  1.0,
        50,  50,  1.0,
        -50,  50,  1.0,
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    sceneVertexPositionBuffer.itemSize = 3;
    sceneVertexPositionBuffer.numItems = 4;

    sceneVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexNormalBuffer);
    var vertexNormals = [
        0.0,  0.0,  0.0,
        0.0,  0.0,  0.0,
        0.0,  0.0,  0.0,
        0.0,  0.0,  0.0,
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    sceneVertexNormalBuffer.itemSize = 3;
    sceneVertexNormalBuffer.numItems = 4;

    sceneVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexTextureCoordBuffer);
    var textureCoords = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    sceneVertexTextureCoordBuffer.itemSize = 2;
    sceneVertexTextureCoordBuffer.numItems = 4;

    sceneVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneVertexIndexBuffer);
    var sceneVertexIndices = [
        0, 1, 2,      0, 2, 3,
        ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sceneVertexIndices), gl.STATIC_DRAW);
    sceneVertexIndexBuffer.itemSize = 1;
    sceneVertexIndexBuffer.numItems = 6;

}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var cubeVertexNormalBuffer;

function initBufferCube()
{
	cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    var vertexNormals = [
        // Front face
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top face
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom face
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right face
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = 24;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
        ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;
}

var sphereVertexPositionBuffer;
var sphereVertexNormalBuffer;
var sphereVertexTextureCoordBuffer;
var sphereVertexIndexBuffer;

function initBufferSphere()
{
	var latitudeBands = 30;
	var longitudeBands = 30;
	var radius = 2;

	var vertexPositionData = [];
	var normalData = [];
	var textureCoordData = [];
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++)
	{
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++)
		{
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitudeBands);
			var v = 1 - (latNumber / latitudeBands);

			normalData.push(x);
			normalData.push(y);
			normalData.push(z);
			textureCoordData.push(u);
			textureCoordData.push(v);
			vertexPositionData.push(radius * x);
			vertexPositionData.push(radius * y);
			vertexPositionData.push(radius * z);
		}
	}

	var indexData = [];
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++)
	{
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++)
		{
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;
			indexData.push(first);
			indexData.push(second);
			indexData.push(first + 1);

			indexData.push(second);
			indexData.push(second + 1);
			indexData.push(first + 1);
		}
	}

	sphereVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
	sphereVertexNormalBuffer.itemSize = 3;
	sphereVertexNormalBuffer.numItems = normalData.length / 3;

	sphereVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
	sphereVertexTextureCoordBuffer.itemSize = 2;
	sphereVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

	sphereVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
	sphereVertexPositionBuffer.itemSize = 3;
	sphereVertexPositionBuffer.numItems = vertexPositionData.length / 3;

	sphereVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
	sphereVertexIndexBuffer.itemSize = 1;
	sphereVertexIndexBuffer.numItems = indexData.length;
}

//check cube's location and sphere's location
function distance(x1, y1, z1, x2, y2, z2, d)
{
	var distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));
	return (distance < d);
}

//create object cube
function cube(locationX, locationY, locationZ)
{
	this.x = locationX;
	this.y = locationY;
	this.z = locationZ;
	this.delete = false;
}

cube.prototype.reset = function()
{
    this.delete = false; //Reset cube when new game 
}

cube.prototype.draw = function(program)
{
	if(this.delete == true)
        return;
	mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [this.x, this.y, this.z]);

    mat4.rotate(mvMatrix, degToRad(cubeRot), [0,1,1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.vertexAttribPointer(program.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(program.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);

    var lightingDirection = [lightX, lightY, lightZ];
    var adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, 1);
    gl.uniform3fv(program.lightingDirectionUniform, adjustedLD);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms(normalProgram);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

var lastTimeCube = 0;
var speed = 100; //Speed of cube
var score = 0;
var cubeRot = 0; //rotation of cube

cube.prototype.animate = function()
{
    var timeNow = new Date().getTime();
    if (lastTimeCube != 0)
    {
        var elapsed = timeNow - lastTimeCube;
        cubeRot += (speed * elapsed)/400.0;
    }
    lastTimeCube = timeNow;
}

cube.prototype.check = function()
{
    //if distance between cube and sphere = 2, score will plus 10
	if(distance(this.x, this.y, this.z, x, y, z, 2))
	{
        if(this.delete == false)
        {
          	this.delete = true; //cube will remove in game
            score += 10; 
        }
    }
}

function getRandom(min, max)
{
    return Math.random() * (max - min) + min;
}

var cubea = [];
var num = 20;

function drawCube()
{
	var k = 360/num;
	var value = 0;
    for (var i = 0; i < num; i++)
    {
    	var x = 45*Math.cos(degToRad(value));
      	var z = 45*Math.sin(degToRad(value));
        cubea.push(new cube(x, 2.5, z));
        cubea[i].check();
        cubea[i].draw(normalProgram);
        cubea[i].animate();
		value +=k;
    }
}

function drawsphere(program)
{
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [x, y, z]);

	mat4.rotate(mvMatrix, degToRad(xRot), [0, 0, 1]);
    mat4.rotate(mvMatrix, degToRad(zRot), [1, 0, 0]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
	gl.uniform1i(program.samplerUniform, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
	gl.vertexAttribPointer(program.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
	gl.vertexAttribPointer(program.textureCoordAttribute, sphereVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniform1i(program.useLightingUniform,1);

    gl.uniform3f(program.ambientColorUniform, 0.8, 0.8, 0.8);

    var lightingDirection = [lightX, lightY, lightZ];
    
    var adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, 1);
    gl.uniform3fv(program.lightingDirectionUniform, adjustedLD);

    gl.uniform3f(program.directionalColorUniform, 0.8, 0.8, 0.8);

	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
	gl.vertexAttribPointer(program.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);

	setMatrixUniforms(normalProgram);
	gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawScene(program)
{
    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0, 0, 0]); //x, y, z

    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexNormalBuffer);
    gl.vertexAttribPointer(program.vertexNormalAttribute, sceneVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexTextureCoordBuffer);
    gl.vertexAttribPointer(program.textureCoordAttribute, sceneVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneVertexIndexBuffer);
    setMatrixUniforms(normalProgram);
    gl.drawElements(gl.TRIANGLE_STRIP, sceneVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

var lightX = 5, lightY = 3, lightZ = 2; //location light

function drawGame()
{
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 1, 100, pMatrix);
	mat4.lookAt([xE, yE, zE], [x, y, z], [0, 1, 0], vMatrix); //setup camera, [xE, yE, zE] location of camera, [x, y, z] location of sphere
}

function loadObject()
{
    drawCube();
    drawsphere(normalProgram);
    drawScene(normalProgram);
}

var time = -1; //time system
var minute = 0;
var second = 0;
var timeSecond = 0;
var timeLost = 10800; //time to gameover
function timenow()
{
    if (time == 60*timeSecond)
    {
        timeSecond++;
        second++;
    }
    if (timeSecond == 60*(minute+1))
    {
        minute ++;
        second = 0;
    }
}

function drawText(){
    text.clearRect(0, 0, text.viewportWidth, text.viewportHeight);
    text.font = '25px "Times New Roman"';    
    text.fillStyle = 'rgba(255, 0, 0, 1)';
    text.fillText("Score: " + score.toString(), text.viewportWidth - 140, text.viewportHeight/ 2 - 250);
    timenow();
    text.fillText("Time : " + minute.toString() + ":" + second.toString() ,  text.viewportWidth - 140 , text.viewportHeight/2 - 275 );
            
    if (score == num*10)
    {	trangthai = false;
        text.fillStyle = 'rgba(255, 255, 0 , 1)';
        text.font = '70px "Times New Roman"';    
        text.fillText('You win!!!',  text.viewportWidth/2-130, text.viewportHeight/2+20 );
    }
    else
    {
    	if(status_start == true)
    	{
	    	time++;
	    	status_start = true;
    	}
    }
    if (time == timeLost)
    {
    	status_stop = false;
        text.fillStyle = 'rgba(255, 0, 0 , 1)';
        text.font = '70px "Times New Roman"';    
        text.fillText('You lost!!!',  text.viewportWidth/2-130, text.viewportHeight/2+20 );
    }
}

function textGamePause()
{
        text.clearRect(0, 0, text.viewportWidth, text.viewportHeight);
        text.font = '90px "Times New Roman"';    
        text.fillStyle = 'rgba(0,255,0,1)';
        text.fillText('PAUSE', text.viewportWidth/2-120,text.viewportHeight/2);
        text.font = '40px "Times New Roman"';
        text.fillText('Press Space to menu.', text.viewportWidth/2-145,text.viewportHeight/2+50);
        text.fillText('Press any key to continue play game.', text.viewportWidth/2-280,text.viewportHeight/2+90);
        status_start = true;
}

function newGame()
{
    xRot = 0, zRot = 0;
    x = 0, y = 3, z =0;
    xE = 0, yE = 15, zE = 15;
    ax= 0, ay = 0, az = 0;
    flagx = 1, flagz = 1;
    score = 0;
    for (var i = 0; i < num; i++)
        cubea[i].reset();
    time = -1;
    minute = 0;
    second = 0;
    timeSecond = 0;
    status_start = false;
    status_stop = true;
    status_new = false;
    status_pause = false;
}

var status_start = false;
var status_stop = true;
var status_new = false;
var status_pause = false;
function tick()
{
    requestAnimFrame(tick);
    handleKeys();
    drawGame();
	if (status_stop && !status_pause)
	{
	    drawText();
		acceleration();
        loadObject();
	}
    if(status_pause)    //when you press ESC, game pause
        textGamePause();
}

function main()
{
	var canvas = document.getElementById("game");
    var char = document.getElementById("text");
	initGL(canvas, char);
	initShader();
	initBufferCube();
	initBufferSphere();
	initBufferScene();
	initTexture();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
 
 	document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

	tick();
}