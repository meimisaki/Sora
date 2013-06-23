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
    gl.clear(gl.COLOR_BUFFER_BIT);
    
}
function animate(currTime) {
    render();
    window.requestAnimationFrame(animate);
}
var vertexShaderSource = [
    'attribute vec3 vertexPosition;',
    'attribute vec4 vertexColor;',
    'uniform mat4 projectMatrix;',
    'uniform mat4 modelViewMatrix;',
    'void main(void) {',
    '',
    '}',
].join('\n');
var fragmentShaderSource = [
    'precision mediump float;',
    'void main(void) {',
    '',
    '}',
].join('\n');
var vertexShader, fragmentShader, shaderProgram;
var vertexPosition, vertexColor, projectMatrix, modelViewMatrix;
var modelViewMatrices = [mat4.create()];
function perspective(fov, aspect, near, far) {
    var m = mat4.create();
    mat4.perspective(m, fov, aspect, near, far);
    gl.uniformMatrix4fv(projectMatrix, false, m);
}
function loadIdentity() {
    var m = modelViewMatrices[modelViewMatrices.length - 1];
    mat4.identity(m);
    gl.uniformMatrix4fv(modelViewMatrix, false, m);
}
function pushMatrix() {
    var m = modelViewMatrices[modelViewMatrices.length - 1];
    modelViewMatrices.push(mat4.clone(m));
}
function popMatrix() {
    if (modelViewMatrices.length > 1) {
        modelViewMatrices.pop();
        var m = modelViewMatrices[modelViewMatrices.length - 1];
        gl.uniformMatrix4fv(modelViewMatrix, false, m);
    }
}
function translate(x, y, z) {
    x = x || 0, y = y || 0, z = z || 0;
    
}
function rotate(x, y, z) {
    x = x || 0, y = y || 0, z = z || 0;
    
}
function scale(x, y, z) {
    x = x || 1, y = y || 1, z = z || 1;
    
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
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
    vertexPosition = gl.getAttribLocation(shaderProgram, 'vertexPosition');
    vertexColor = gl.getAttribLocation(shaderProgram, 'vertexColor');
    projectMatrix = gl.getUniformLocation(shaderProgram, 'projectMatrix');
    modelViewMatrix = gl.getUniformLocation(shaderProgram, 'modelViewMatrix');
    perspective(60, width / height, 0.1, 1024);
    loadIdentity();
    width = 1280, height = 720;
    resize();
    document.body.appendChild(canvas);
    window.addEventListener('resize', resize, false);
    window.requestAnimationFrame(animate);
};