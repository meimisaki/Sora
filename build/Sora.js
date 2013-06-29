(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0 ; x < vendors.length && !window.requestAnimationFrame ; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (window.requestAnimationFrame === undefined) {
        window.requestAnimationFrame = function (callback) {
            var currTime = Date.now(), timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    window.cancelAnimationFrame = window.cancelAnimationFrame || function (id) { window.clearTimeout(id) };
}());
var canvas, gl, width, height;
function resize(event) {
    var canvasWidth = window.innerWidth, canvasHeight = window.innerHeight, aspect = width / height;
    if (canvasWidth < canvasHeight * aspect) canvasHeight = canvasWidth / aspect;
    else canvasWidth = canvasHeight * aspect;
    canvas.width = canvasWidth, canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    canvas.style.marginLeft = (window.innerWidth - canvasWidth) * 0.5 + 'px';
    canvas.style.marginTop = (window.innerHeight - canvasHeight) * 0.5 + 'px';
    if (gl) gl.viewport(0, 0, canvasWidth, canvasHeight);
}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
}
function animate(currTime) {
    render();
    window.requestAnimationFrame(animate);
}
var vertexShaderSource = [
    'attribute vec3 a_VertexPos;',
    'attribute vec2 a_TexCoord;',
    'varying vec2 v_TexCoord;',
    'uniform mat4 u_ProjectMatrix;',
    'uniform mat4 u_ModelViewMatrix;',
    'void main(void) {',
    '    gl_Position = u_ProjectMatrix * u_ModelViewMatrix * vec4(a_VertexPos, 1);',
    '    v_TexCoord = a_TexCoord;',
    '}',
].join('\n');
var fragmentShaderSource = [
    'precision mediump float;',
    'varying vec2 v_TexCoord;',
    'uniform vec4 u_Color;',
    'uniform sampler2D u_Texture2D;',
    'void main(void) {',
    '    gl_FragColor = u_Color * texture2D(u_Texture2D, v_TexCoord);',
    '}',
].join('\n');
var vertexShader, fragmentShader, shaderProgram;
var aVertexPos, aTexCoord, uProjectMatrix, uModelViewMatrix, uColor, uTexture2D;
var uModelViewMatrices = [mat4.create()];
function perspective(fov, aspect, near, far) {
    var m = mat4.create();
    mat4.perspective(m, fov, aspect, near, far);
    gl.uniformMatrix4fv(uProjectMatrix, false, m);
}
function loadIdentity() {
    var m = uModelViewMatrices[uModelViewMatrices.length - 1];
    mat4.identity(m);
    gl.uniformMatrix4fv(uModelViewMatrix, false, m);
}
function pushMatrix() {
    var m = uModelViewMatrices[uModelViewMatrices.length - 1];
    uModelViewMatrices.push(mat4.clone(m));
}
function popMatrix() {
    if (uModelViewMatrices.length > 1) {
        uModelViewMatrices.pop();
        var m = uModelViewMatrices[uModelViewMatrices.length - 1];
        gl.uniformMatrix4fv(uModelViewMatrix, false, m);
    }
}
function translate(x, y, z) {
    x = x || 0, y = y || 0, z = z || 0;
    var m = uModelViewMatrices[uModelViewMatrices.length - 1];
    mat4.translate(m, m, vec3.fromValues(x, y, z));
    gl.uniformMatrix4fv(uModelViewMatrix, false, m);
}
function rotate(x, y, z) {
    x = x || 0, y = y || 0, z = z || 0;
    var m = uModelViewMatrices[uModelViewMatrices.length - 1];
    mat4.rotateX(m, m, x);
    mat4.rotateY(m, m, y);
    mat4.rotateZ(m, m, z);
    gl.uniformMatrix4fv(uModelViewMatrix, false, m);
}
function scale(x, y, z) {
    x = x || 1, y = y || 1, z = z || 1;
    var m = uModelViewMatrices[uModelViewMatrices.length - 1];
    mat4.scale(m, m, vec3.fromValues(x, y, z));
    gl.uniformMatrix4fv(uModelViewMatrix, false, m);
}
function color(r, g, b, a) {
    r = r || 0, g = g || 0, b = b || 0, a = a || 0;
    gl.uniform4f(uColor, r, g, b, a);
}
function createShader(source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
var sharedTexCoordBuffer;
var Layer = function (url, type, origin, size, color, rotation, anchor) {
    this.origin = origin ? origin : vec2.create();
    this.size = size ? size : vec2.create();
    this.color = color ? color : vec4.create();
    this.rotation = rotation ? rotation : vec3.create();
    this.anchor = anchor ? anchor : vec2.create();
    this.vertexPosBuffer = gl.createBuffer();
    this.texture = null;
    var element, scope = this;
    element = new Image();
    element.onload = function () {
        scope.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, scope.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    element.src = url;
    return this;
};
Layer.prototype = {
    constructor: Layer,
    draw: function () {
        if (this.texture) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
            var vertices = [
                -1, -1, 0,
                1, -1, 0,
                1, 1, 0,
                -1, -1, 0,
                1, 1, 0,
                -1, 1, 0,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
            gl.vertexAttribPointer(aVertexPos, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, sharedTexCoordBuffer);
            gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    },
};
function timmingLinear(t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return t;
}
function timmingEaseIn(t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return Math.sin((t - 1) * Math.PI * 0.5) + 1;
}
function timmingEaseOut(t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return Math.sin(t * Math.PI * 0.5);
}
function timmingEaseInOut(t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return Math.sin((t - 0.5) * Math.PI) * 0.5 + 0.5;
}
var Action = function (target, duration, repeat, reverse, autorev, timming) {
    this.target = target;
    this.duration = duration ? Math.max(33, duration) : 1000;
    this.elapsed = 0;
    this.repeat = repeat ? Math.max(0, repeat) : 1;
    this.reverse = reverse ? true : false;
    this.autorev = autorev ? true : false;
    this.timming = timming ? timming : timmingLinear;
    return this;
};
Action.prototype = {
    constructor: Action,
    
};
window.onload = function () {
    document.body.style.marginLeft = '0px';
    document.body.style.marginTop = '0px';
    canvas = document.createElement('canvas');
    gl = canvas.getContext('experimental-webgl');
    if (!gl) {
        alert('Couldn\'t get webgl context');
        return ;
    }
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(1);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.TEXTURE_2D);
    vertexShader = createShader(vertexShaderSource, gl.VERTEX_SHADER);
    fragmentShader = createShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Couldn\'t initialize shader program');
        return ;
    }
    gl.useProgram(shaderProgram);
    aVertexPos = gl.getAttribLocation(shaderProgram, 'a_VertexPos');
    gl.enableVertexAttribArray(aVertexPos);
    aTexCoord = gl.getAttribLocation(shaderProgram, 'a_TexCoord');
    gl.enableVertexAttribArray(aTexCoord);
    uProjectMatrix = gl.getUniformLocation(shaderProgram, 'u_ProjectMatrix');
    uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'u_ModelViewMatrix');
    uColor = gl.getUniformLocation(shaderProgram, 'u_Color');
    uTexture2D = gl.getUniformLocation(shaderProgram, 'u_Texture2D');
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTexture2D, 0);
    sharedTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sharedTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    width = 1280, height = 720;
    resize();
    document.body.appendChild(canvas);
    perspective(60, width / height, 1, 1024);
    loadIdentity();
    color(1, 1, 1, 1);
    window.addEventListener('resize', resize, false);
    window.requestAnimationFrame(animate);
};