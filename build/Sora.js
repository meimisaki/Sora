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
var canvas, gl, width, height, lastTime, foreLayer, backLayer;
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
    pushMatrix();
    translate(-1, -height / width, -1);
    scale(2 / width, 2 / width);
    foreLayer.visit();
    popMatrix();
}
function animate(currTime) {
    if (lastTime === undefined) {
        lastTime = currTime;
    }
    else {
        var dt = Math.max(0, Math.min(33, currTime - lastTime));
        lastTime = currTime;
        actions.sort(function (a, b) { return a.remain() - b.remain() ; });
        for (var i = 0 ; i < actions.length;) {
            actions[i].step(dt);
            if (actions[i].finished()) actions.splice(i, 1);
            else ++i;
        }
    }
    render();
    window.requestAnimationFrame(animate);
}
var vertexShaderSource = [
    'attribute vec3 a_VertexPos;',
    'attribute vec4 a_VertexColor;',
    'attribute vec2 a_TexCoord;',
    'varying vec4 v_VertexColor;',
    'varying vec2 v_TexCoord;',
    'uniform mat4 u_ProjectMatrix;',
    'uniform mat4 u_ModelViewMatrix;',
    'void main(void) {',
    '    gl_Position = u_ProjectMatrix * u_ModelViewMatrix * vec4(a_VertexPos, 1.0);',
    '    v_VertexColor = a_VertexColor;',
    '    v_TexCoord = a_TexCoord;',
    '}',
].join('\n');
var fragmentShaderSource = [
    'precision mediump float;',
    'varying vec4 v_VertexColor;',
    'varying vec2 v_TexCoord;',
    'uniform bool u_Mask2DEnabled;',
    'uniform float u_Mask2DProgress;',
    'uniform sampler2D u_Mask2D;',
    'uniform sampler2D u_Texture2D;',
    'void main(void) {',
    '    vec4 color = v_VertexColor * texture2D(u_Texture2D, v_TexCoord);',
    '    if (u_Mask2DEnabled)',
    '        if (texture2D(u_Mask2D, v_TexCoord).x < u_Mask2DProgress)',
    '            gl_FragColor = vec4(color.xyz, 0.0);',
    '        else',
    '            gl_FragColor = vec4(color.xyz, 1.0);',
    '    else',
    '        gl_FragColor = color;',
    '}',
].join('\n');
var vertexShader, fragmentShader, shaderProgram;
var aVertexPos, aVertexColor, aTexCoord, uProjectMatrix, uModelViewMatrix, uMask2DEnabled, uMask2DProgress, uMask2D, uTexture2D;
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
function enableMask2D() {
    gl.uniform1i(uMask2DEnabled, 1);
}
function disableMask2D() {
    gl.uniform1i(uMask2DEnabled, 0);
}
function setMask2DProgress(f) {
    gl.uniform1f(uMask2DProgress, f);
}
function bindMask2D(texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE1);
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
function createTexture(url, type) {
    if (!url) return null;
    var texture = gl.createTexture(), element = new Image();
    element.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    element.src = url;
    return texture;
}
var sharedTexCoordBuffer;
var Layer = function (url, type, origin, size, color, rotation, scale, anchor, order) {
    this.origin = origin ? origin : vec2.create();
    this.size = size ? size : vec2.create();
    this.color = color ? color : vec4.fromValues(1, 1, 1, 1);
    this.rotation = rotation ? rotation : 0;
    this.scale = scale ? scale : vec2.fromValues(1, 1);
    this.anchor = anchor ? anchor : vec2.create();
    this.order = order ? order : 0;
    this.sublayers = [];
    this.superlayer = null;
    this.vertexPosBuffer = gl.createBuffer();
    this.vertexColorBuffer = gl.createBuffer();
    this.texture = createTexture(url, type);
    return this;
};
Layer.prototype = {
    constructor: Layer,
    addSublayer: function (layer) {
        var i = 0;
        for (; i < this.sublayers.length ; ++i)
            if (layer.order < this.sublayers[i].order)
                break;
        this.sublayers.splice(i, 0, layer);
        layer.superlayer = this;
    },
    removeFromSuperlayer: function () {
        
        this.superlayer = null;
    },
    draw: function () {
        if (this.texture) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
            var w = this.size[0], h = this.size[1];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, w, 0, 0, w, h, 0, 0, h, 0]), gl.STREAM_DRAW);
            gl.vertexAttribPointer(aVertexPos, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
            var r = this.color[0], g = this.color[1], b = this.color[2], a = this.color[3];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a]), gl.STREAM_DRAW);
            gl.vertexAttribPointer(aVertexColor, 4, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, sharedTexCoordBuffer);
            gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    },
    visit: function () {
        pushMatrix();
        var tx = this.size[0] * this.anchor[0], ty = this.size[1] * this.anchor[1];
        translate(tx + this.origin[0], ty + this.origin[1]);
        rotate(0, 0, this.rotation);
        scale(this.scale[0], this.scale[1]);
        translate(-tx, -ty);
        var color = vec4.clone(this.color);
        if (this.superlayer) vec4.mul(this.color, this.color, this.superlayer.color);
        var i = 0;
        for (; i < this.sublayers.length ; ++i) {
            if (this.sublayers[i].order >= 0) break;
            this.sublayers[i].visit();
        }
        this.draw();
        for (; i < this.sublayers.length ; ++i) this.sublayers[i].visit();
        vec4.copy(this.color, color);
        popMatrix();
    },
    dealloc: function () {
        for (var i in this.sublayers) i.dealloc();
        gl.deleteBuffer(this.vertexPosBuffer);
        gl.deleteBuffer(this.vertexColorBuffer);
        if (this.texture) gl.deleteTexture(this.texture);
    },
};
var Label = function (text, font, align, type, origin, size, color, rotation, scale, anchor, order) {
    Layer.call(this, null, type, origin, size, color, rotation, scale, anchor, order);
    this.texture = gl.createTexture();
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.text = text ? text : '';
    this.font = font ? font : this.context.font;
    this.align = align ? align : this.context.textAlign;
    return this;
};
Label.prototype = Object.create(Layer.prototype);
Label.prototype.draw = function () {
    this.updateTexture();
    Layer.prototype.draw.call(this);
};
Label.prototype.appendText = function (text) {
    this.text += text;
};
Label.prototype.clearText = function () {
    this.text = '';
};
Label.prototype.updateTexture = function () {
    this.canvas.width = this.size[0], this.canvas.height = this.size[1];
    this.context.clearRect(0, 0, this.size[0], this.size[1]);
    this.context.font = this.font;
    this.context.textAlign = this.align;
    this.context.textBaseline = 'bottom';
    this.context.fillStyle = '#FFFFFF';
    this.context.fillText(this.text, 0, this.size[1]);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
};
var Button = function (normalUrl, disabledUrl, selectedUrl, maskedUrl, callback, type, origin, size, color, rotation, scale, anchor, order) {
    Layer.call(this, null, type, origin, size, color, rotation, scale, anchor, order);
    this.normalTexture = createTexture(normalUrl, null);
    this.disabledTexture = createTexture(disabledUrl, null);
    this.selectedTexture = createTexture(selectedUrl, null);
    this.maskedTexture = createTexture(maskedUrl, null);
    this.callback = callback;
    this.enabled = true;
    this.isSelected = false;
    this.isMasked = false;
    return this;
};
Button.prototype = Object.create(Layer.prototype);
Button.prototype.draw = function () {
    if (!this.enabled) this.texture = this.disabledTexture;
    else if (this.isSelected) this.texture = this.selectedTexture;
    else if (this.isMasked) this.texture = this.maskedTexture;
    else this.texture = this.normalTexture;
    Layer.prototype.draw.call(this);
};
Button.prototype.dealloc = function () {
    this.texture = null;
    Layer.prototype.dealloc.call(this);
    if (this.normalTexture) gl.deleteTexture(this.normalTexture);
    if (this.disabledTexture) gl.deleteTexture(this.disabledTexture);
    if (this.selectedTexture) gl.deleteTexture(this.selectedTexture);
    if (this.maskedTexture) gl.deleteTexture(this.maskedTexture);
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
var actions = [];
var Action = function (duration, repeat, reverse, autorev, timming) {
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
    start: function () {
        for (var i in actions)
            if (i == this)
                return ;
        actions.push(this);
    },
    stop: function () {
        for (var i = 0 ; i < actions.length ; ++i)
            if (actions[i] == this) {
                actions.splice(i, 1);
                break;
            }
    },
    update: function (t) {
        
    },
    step: function (dt) {
        var t;
        t = parseInt((Math.max(1, Math.min(this.repeat * this.duration, this.elapsed)) - 1) / this.duration);
        this.elapsed = Math.max(0, this.elapsed + dt);
        t ^= parseInt((Math.max(1, Math.min(this.repeat * this.duration, this.elapsed)) - 1) / this.duration);
        if (this.autorev && (t & 1)) this.reverse = !this.reverse;
        if (this.finished())
            t = this.repeat - parseInt(this.repeat) || 1;
        else if (this.elapsed == 0)
            t = 0;
        else
            t = (((this.elapsed - 1) % this.duration) + 1) / this.duration;
        this.update(this.timming(t, this.reverse));
    },
    finished: function () {
        return this.elapsed >= this.repeat * this.duration;
    },
    remain: function () {
        if (this.elapsed <= parseInt(this.repeat) * this.duration)
            return this.duration - ((this.elapsed - 1) % this.duration + 1);
        else
            return this.repeat * this.duration - this.elapsed;
    },
};
ValueAction = function (target, keys, values, duration, repeat, reverse, autorev, timming) {
    Action.call(this, duration, repeat, reverse, autorev, timming);
    this.target = target;
    this.keys = keys;
    this.fromValues = [];
    for (var i = 0 ; i < keys.length ; ++i) {
        var fromValue = target[keys[i]];
        if (typeof fromValue == 'number')
            this.fromValues.push(target[keys[i]]);
        else {
            this.fromValues.push([]);
            for (var j = 0 ; j < fromValue.length ; ++j)
                this.fromValues[i].push(fromValue[j]);
        }
    }
    this.toValues = values;
    return this;
};
ValueAction.prototype = Object.create(Action.prototype);
ValueAction.prototype.update = function (t) {
    for (var i = 0 ; i < this.keys.length ; ++i) {
        var key = this.keys[i];
        var fromValue = this.fromValues[i];
        var toValue = this.toValues[i];
        if (typeof toValue == 'number')
            this.target[key] = (toValue - fromValue) * t + fromValue;
        else
            for (var j = 0 ; j < toValue.length ; ++j)
                this.target[key][j] = (toValue[j] - fromValue[j]) * t + fromValue[j];
    }
};
CallAction = function (callback, duration, repeat, reverse, autorev, timming) {
    Action.call(this, duration, repeat, reverse, autorev, timming);
    this.callback = callback;
    return this;
};
CallAction.prototype = Object.create(Action.prototype);
CallAction.prototype.update = function (t) {
    if (this.callback) this.callback(t);
};
function createScript(url) {
    
}
function execute() {
    
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
    aVertexColor = gl.getAttribLocation(shaderProgram, 'a_VertexColor');
    gl.enableVertexAttribArray(aVertexColor);
    aTexCoord = gl.getAttribLocation(shaderProgram, 'a_TexCoord');
    gl.enableVertexAttribArray(aTexCoord);
    uProjectMatrix = gl.getUniformLocation(shaderProgram, 'u_ProjectMatrix');
    uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'u_ModelViewMatrix');
    uMask2DEnabled = gl.getUniformLocation(shaderProgram, 'u_Mask2DEnabled');
    uMask2DProgress = gl.getUniformLocation(shaderProgram, 'u_Mask2DProgress');
    uMask2D = gl.getUniformLocation(shaderProgram, 'u_Mask2D');
    uTexture2D = gl.getUniformLocation(shaderProgram, 'u_Texture2D');
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uMask2D, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(uTexture2D, 1);
    sharedTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sharedTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    width = 1280, height = 720;
    resize();
    document.body.appendChild(canvas);
    perspective(45, width / height, 1, 2);
    loadIdentity();
    disableMask2D();
    setMask2DProgress(0);
    window.addEventListener('resize', resize, false);
    foreLayer = new Layer('../../kanda_yuko.png', null, null, vec2.fromValues(width, height));
    backLayer = new Layer(null, null, null, vec2.fromValues(width, height));
    window.requestAnimationFrame(animate);
};
window.onunload = function () {
    if (!gl) return ;
    window.cancelAnimationFrame();
    gl.deleteBuffer(sharedTexCoordBuffer);
    foreLayer.dealloc();
    backLayer.dealloc();
};