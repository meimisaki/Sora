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
var animationFrame, canvas, gl, width, height, lastTime, foreLayer, backLayer, transition;
var focusedLayer, draggedType = -1, draggedLayer, mouseLocation = {x: 0, y: 0};
function resize(event) {
    var canvasWidth = window.innerWidth, canvasHeight = window.innerHeight, aspect = width / height;
    if (canvasWidth < canvasHeight * aspect) canvasHeight = canvasWidth / aspect;
    else canvasWidth = canvasHeight * aspect;
    canvas.width = canvasWidth, canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    canvas.style.marginLeft = (window.innerWidth - canvasWidth) * 0.5 + 'px';
    canvas.style.marginTop = (window.innerHeight - canvasHeight) * 0.5 + 'px';
}
function render(viewportWidth, viewportHeight, width, height, layer) {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pushMatrix();
    translate(-1, -1, -1);
    scale(2 / width, 2 / height);
    layer.visit();
    popMatrix();
}
function animate(currTime) {
    if (lastTime === undefined) {
        lastTime = currTime;
    }
    else {
        var dt = Math.max(1, Math.min(33, currTime - lastTime));
        lastTime = currTime;
        actions.sort(function (a, b) { return a.remain() - b.remain() ; });
        for (var i = 0 ; i < actions.length;) {
            actions[i].step(dt);
            if (actions[i].finished()) {
                if (actions[i].finalize) actions[i].finalize();
                actions.splice(i, 1);
            }
            else ++i;
        }
    }
    if (!transition && draggedType == -1) {
        var event = {mouseLocation: mouseLocation};
        var layer = foreLayer.dispatchEvent(event);
        if (layer != focusedLayer) {
            if (focusedLayer) focusedLayer.mouseExited(event);
            focusedLayer = layer;
            if (focusedLayer) focusedLayer.mouseEntered(event);
        }
    }
    render(canvas.width, canvas.height, width, height, transition || foreLayer);
    animationFrame = window.requestAnimationFrame(animate);
}
var vertexShaderSource = [
    'attribute vec3 a_VertexPos;',
    'attribute vec2 a_TexCoord;',
    'varying vec2 v_TexCoord;',
    'uniform mat4 u_ModelViewMatrix;',
    'void main(void) {',
    '    gl_Position = u_ModelViewMatrix * vec4(a_VertexPos, 1.0);',
    '    v_TexCoord = a_TexCoord;',
    '}',
].join('\n');
var fragmentShaderSource = [
    'precision mediump float;',
    'varying vec2 v_TexCoord;',
    'uniform vec4 u_Color;',
    'uniform bool u_Mask2DEnabled;',
    'uniform float u_Mask2DProgress;',
    'uniform float u_Mask2DOffset;',
    'uniform sampler2D u_Mask2D;',
    'uniform sampler2D u_Texture2D;',
    'void main(void) {',
    '    vec4 color = u_Color * texture2D(u_Texture2D, v_TexCoord);',
    '    if (u_Mask2DEnabled) {',
    '        float threshold = texture2D(u_Mask2D, v_TexCoord).x;',
    '        if (u_Mask2DOffset == 0.0)',
    '            if (threshold <= u_Mask2DProgress)',
    '                gl_FragColor = vec4(color.xyz, 0.0);',
    '            else',
    '                gl_FragColor = vec4(color.xyz, color.w);',
    '        else',
    '            gl_FragColor = vec4(color.xyz, color.w * clamp((threshold - u_Mask2DProgress) / u_Mask2DOffset, 0.0, 1.0));',
    '    }',
    '    else',
    '        gl_FragColor = color;',
    '}',
].join('\n');
var vertexShader, fragmentShader, shaderProgram;
var aVertexPos, aTexCoord, uModelViewMatrix, uColor, uMask2DEnabled, uMask2DProgress, uMask2DOffset, uMask2D, uTexture2D;
var uModelViewMatrices = [mat4.create()];
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
function enableMask2D() {
    gl.uniform1i(uMask2DEnabled, 1);
}
function disableMask2D() {
    gl.uniform1i(uMask2DEnabled, 0);
}
function setMask2DProgress(f) {
    gl.uniform1f(uMask2DProgress, f);
}
function setMask2DOffset(f) {
    gl.uniform1f(uMask2DOffset, f);
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
function createTexture(url, type, callback) {
    if (!url) return null;
    var texture = gl.createTexture(), element = new Image();
    texture.dealloc = function () {
        element.src = null;
    };
    element.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
        defaultTexParameteri();
        gl.bindTexture(gl.TEXTURE_2D, null);
        element.src = null;
        if (callback) callback();
    };
    element.src = url;
    return texture;
}
function deleteTexture(texture) {
    if (!texture) return ;
    if (texture.dealloc) texture.dealloc();
    gl.deleteTexture(texture);
}
function defaultTexParameteri() {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
var backgroundMusic, soundEffects = {};
function createAudio(url, loop) {
    if (!url) return null;
    var audio = document.createElement('audio');
    audio.dealloc = function () {
        audio.pause();
        audio.src = null;
    };
    audio.onload = function () {
        audio.play();
    };
    audio.src = url;
    audio.loop = loop;
    return audio;
}
function deleteAudio(audio) {
    if (!audio) return ;
    if (audio.dealloc) audio.dealloc();
}
var sharedTexCoordBuffer;
var Layer = function (url, type, origin, size, color, rotation, scale, anchor, order, id) {
    this.origin = origin ? vec2.clone(origin) : vec2.create();
    this.size = size ? vec2.clone(size) : vec2.fromValues(width, height);
    this.color = color ? vec4.clone(color) : vec4.fromValues(1, 1, 1, 1);
    this.rotation = rotation ? rotation : 0;
    this.scale = scale ? vec2.clone(scale) : vec2.fromValues(1, 1);
    this.anchor = anchor ? vec2.clone(anchor) : vec2.create();
    this.order = order ? order : 0;
    this.id = id ? id : '';
    this.sublayers = [];
    this.superlayer = null;
    this.vertexPosBuffer = gl.createBuffer();
    this.texture = createTexture(url, type);
    return this;
};
Layer.prototype = {
    constructor: Layer,
    addSublayer: function (layer) {
        if (layer.superlayer) layer.removeFromSuperlayer();
        var i = 0;
        for (; i < this.sublayers.length ; ++i)
            if (layer.order < this.sublayers[i].order)
                break;
        this.sublayers.splice(i, 0, layer);
        layer.superlayer = this;
    },
    removeFromSuperlayer: function () {
        if (!this.superlayer) return ;
        for (var i = 0 ; i < this.superlayer.sublayers.length ; ++i)
            if (this.superlayer.sublayers[i] == this) {
                this.superlayer.sublayers.splice(i, 1);
                break;
            }
        this.superlayer = null;
    },
    draw: function () {
        if (this.texture) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer);
            var w = this.size[0], h = this.size[1];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, w, 0, 0, w, h, 0, 0, h, 0]), gl.STREAM_DRAW);
            gl.vertexAttribPointer(aVertexPos, 3, gl.FLOAT, false, 0, 0);
            color(this.color[0], this.color[1], this.color[2], this.color[3]);
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
    getLayerById: function (id) {
        if (id && this.id && id == this.id) return this;
        for (var i = 0 ; i < this.sublayers.length ; ++i) {
            var layer = this.sublayers[i].getLayerById(id);
            if (layer) return layer;
        }
        return null;
    },
    dealloc: function () {
        for (var i = 0 ; i < this.sublayers.length ; ++i) this.sublayers[i].dealloc();
        gl.deleteBuffer(this.vertexPosBuffer);
        deleteTexture(this.texture);
    },
    snapshot: function () {
        var width = parseInt(this.size[0]), height = parseInt(this.size[1]);
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        defaultTexParameteri();
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        var origin = vec2.clone(this.origin);
        vec2.set(this.origin, 0, 0);
        render(width, height, width, height, this);
        vec2.copy(this.origin, origin);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(framebuffer);
        gl.deleteRenderbuffer(renderbuffer);
        return texture;
    },
    mouseDown: function (event) {
        
    },
    mouseUp: function (event) {
        
    },
    mouseEntered: function (event) {
        
    },
    mouseExited: function (event) {
        
    },
    rightMouseDown: function (event) {
        
    },
    rightMouseUp: function (event) {
        
    },
    dispatchEvent: function (event) {
        var i;
        for (i = this.sublayers.length - 1 ; i >= 0 ; --i) {
            var layer = this.sublayers[i];
            if (layer.order < 0) break;
            layer = layer.dispatchEvent(event);
            if (layer) return layer;
        }
        
        for (; i >= 0 ; --i) {
            var layer = this.sublayers[i].dispatchEvent(event);
            if (layer) return layer;
        }
        return null;
    },
};
function sharedTransitionFinalize() {
    if (transition) {
        transition.dealloc();
        transition = null;
    }
};
var Transition = function (url, duration, offset) {
    Layer.call(this);
    this.texture = foreLayer.snapshot();
    foreLayer.dealloc();
    foreLayer = backLayer;
    backLayer = new Layer();
    if (url == 'fade') {
        new ValueAction(this, ['color'], [vec4.fromValues(1, 1, 1, 0)], duration, 1, false, false, timmingLinear, sharedTransitionFinalize).start();
    }
    else {
        this.mask2D = createTexture(url, null, function () {
            new CallAction(setMask2DProgress, duration, 1, false, false, sharedTransitionFinalize).start();
        });
        setMask2DOffset(offset ? offset : 0);
    }
    return this;
};
Transition.prototype = Object.create(Layer.prototype);
Transition.prototype.visit = function () {
    foreLayer.visit();
    if (this.mask2D) {
        enableMask2D();
        bindMask2D(this.mask2D);
        Layer.prototype.visit.call(this);
        disableMask2D();
    }
    else {
        Layer.prototype.visit.call(this);
    }
};
Transition.prototype.dealloc = function () {
    Layer.prototype.dealloc.call(this);
    deleteTexture(this.mask2D);
};
var Label = function (text, font, align, type, origin, size, color, rotation, scale, anchor, order, id) {
    Layer.call(this, null, type, origin, size, color, rotation, scale, anchor, order, id);
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
    defaultTexParameteri();
    gl.bindTexture(gl.TEXTURE_2D, null);
};
var Button = function (normalUrl, disabledUrl, selectedUrl, maskedUrl, callback, type, origin, size, color, rotation, scale, anchor, order, id) {
    Layer.call(this, null, type, origin, size, color, rotation, scale, anchor, order, id);
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
    this.texture = null;
    if (!this.enabled) this.texture = this.disabledTexture;
    else if (this.isSelected) this.texture = this.selectedTexture;
    else if (this.isMasked) this.texture = this.maskedTexture;
    this.texture = this.texture || this.normalTexture;
    Layer.prototype.draw.call(this);
};
Button.prototype.dealloc = function () {
    this.texture = null;
    Layer.prototype.dealloc.call(this);
    deleteTexture(this.normalTexture);
    deleteTexture(this.disabledTexture);
    deleteTexture(this.selectedTexture);
    deleteTexture(this.maskedTexture);
};
Button.prototype.mouseDown = function (event) {
    this.isSelected = true;
};
Button.prototype.mouseUp = function (event) {
    this.isSelected = false;
    
};
Button.prototype.mouseEntered = function (event) {
    this.isMasked = true;
};
Button.prototype.mouseExited = function (event) {
    this.isMasked = false;
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
var Action = function (duration, repeat, reverse, autorev, timming, finalize) {
    this.duration = duration ? Math.max(1, duration) : 1000;
    this.elapsed = 0;
    this.repeat = repeat ? Math.max(0, repeat) : 1;
    this.reverse = reverse ? true : false;
    this.autorev = autorev ? true : false;
    this.timming = timming ? timming : timmingLinear;
    this.finalize = finalize ? finalize : null;
    return this;
};
Action.prototype = {
    constructor: Action,
    start: function () {
        for (var i = 0 ; i < actions.length ; ++i)
            if (actions[i] == this)
                return ;
        actions.push(this);
    },
    stop: function () {
        for (var i = 0 ; i < actions.length ; ++i)
            if (actions[i] == this) {
                if (!this.finished()) this.step(parseInt(this.repeat * this.duration) + 1 - this.elapsed);
                if (this.finalize) this.finalize();
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
ValueAction = function (target, keys, values, duration, repeat, reverse, autorev, timming, finalize) {
    Action.call(this, duration, repeat, reverse, autorev, timming, finalize);
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
CallAction = function (callback, duration, repeat, reverse, autorev, timming, finalize) {
    Action.call(this, duration, repeat, reverse, autorev, timming, finalize);
    this.callback = callback;
    return this;
};
CallAction.prototype = Object.create(Action.prototype);
CallAction.prototype.update = function (t) {
    if (this.callback) this.callback(t);
};
var script, scriptLocation, variables = {}, methodsSources = {};
var methods = {
    js: function (parameters) {
        return new Function(parameters.body)();
    },
    set: function (parameters) {
        return parseReference(mergeParameters(variables, parameters, true), variables);
    },
    layer: function (parameters) {
        var superlayer = parameters.layer == 'back' ? backLayer : foreLayer;
        superlayer = superlayer.getLayerById(parameters.super) || superlayer;
        var url = parameters.url || parameters.src;
        var type = parameters.type;
        var origin = vec2.fromStr(parameters.origin);
        var size = vec2.fromStr(parameters.size);
        var color = vec4.fromStr(parameters.color);
        var rotation = parseFloat(parameters.rotation);
        var scale = vec3.fromStr(parameters.scale);
        var anchor = vec2.fromStr(parameters.anchor);
        var order = parseInt(parameters.order);
        var id = parameters.id || parameters.name;
        var layer = new Layer(url, type, origin, size, color, rotation, scale, anchor, order, id);
        superlayer.addSublayer(layer);
        return layer;
    },
    label: function (parameters) {
        var superlayer = parameters.layer == 'back' ? backLayer : foreLayer;
        superlayer = superlayer.getLayerById(parameters.super) || superlayer;
        var text = parameters.text || parameters.string;
        var font = parameters.font;
        var align = parameters.align;
        var type = parameters.type;
        var origin = vec2.fromStr(parameters.origin);
        var size = vec2.fromStr(parameters.size);
        var color = vec4.fromStr(parameters.color);
        var rotation = parseFloat(parameters.rotation);
        var scale = vec3.fromStr(parameters.scale);
        var anchor = vec2.fromStr(parameters.anchor);
        var order = parseInt(parameters.order);
        var id = parameters.id || parameters.name;
        var label = new Label(text, font, align, type, origin, size, color, rotation, scale, anchor, order, id);
        superlayer.addSublayer(label);
        return label;
    },
    button: function (parameters) {
        var superlayer = parameters.layer == 'back' ? backLayer : foreLayer;
        superlayer = superlayer.getLayerById(parameters.super) || superlayer;
        var normalUrl = parameters.normalUrl || parameters.normalSrc;
        var disabledUrl = parameters.disabledUrl || parameters.disabledSrc;
        var selectedUrl = parameters.selectedUrl || parameters.selectedSrc;
        var maskedUrl = parameters.maskedUrl || parameters.maskedSrc;
        var callback = new Function(parameters.callback);
        var type = parameters.type;
        var origin = vec2.fromStr(parameters.origin);
        var size = vec2.fromStr(parameters.size);
        var color = vec4.fromStr(parameters.color);
        var rotation = parseFloat(parameters.rotation);
        var scale = vec3.fromStr(parameters.scale);
        var anchor = vec2.fromStr(parameters.anchor);
        var order = parseInt(parameters.order);
        var id = parameters.id || parameters.name;
        var button = new Button(normalUrl, disabledUrl, selectedUrl, maskedUrl, callback, type, origin, size, color, rotation, scale, anchor, order, id);
        superlayer.addSublayer(button);
        return button;
    },
    remove: function (parameters) {
        var layer = (parameters.layer == 'back' ? backLayer : foreLayer).getLayerById(parameters.id || parameters.name);
        if (layer) {
            layer.removeFromSuperlayer();
            layer.dealloc();
        }
        return layer;
    },
    trans: function (parameters) {
        var url = parameters.url || parameters.src;
        var duration = parseInt(parameters.duration || parameters.time);
        var offset = parseFloat(parameters.offset);
        return transition = new Transition(url, duration, offset);
    },
    _animate: function (parameters) {
        var target = (parameters.layer == 'back' ? backLayer : foreLayer).getLayerById(parameters.id || parameters.name || parameters.target);
        if (!target) return null;
        var duration = parseInt(parameters.duration || parameters.time);
        var repeat = parseFloat(parameters.repeat);
        var reverse = parseInt(parameters.reverse);
        var autorev = parseInt(parameters.autorev);
        var timming;
        if (/\s*easein\s*$/i.test(parameters.timming)) timming = timmingEaseIn;
        else if (/\s*easeout\s*$/i.test(parameters.timming)) timming = timmingEaseOut;
        else if (/\s*easeinout\s*$/i.test(parameters.timming)) timming = timmingEaseInOut;
        var action = new ValueAction(target, parameters.keys, parameters.values, duration, repeat, reverse, autorev, timming, finalize);
        action.start();
        return action;
    },
    move: function (parameters) {
        parameters.keys = ['origin'];
        parameters.values = [vec2.fromStr(parameters.origin || parameters.to)];
        return methods._animate(parameters);
    },
    tint: function (parameters) {
        parameters.keys = ['color'];
        parameters.values = [vec4.fromStr(parameters.color || parameters.to)];
        return methods._animate(parameters);
    },
    rotate: function (parameters) {
        parameters.keys = ['rotation'];
        var radians;
        if (parameters.degrees) radians = parseFloat(parameters.degrees) * Math.PI / 180;
        else radians = parseFloat(parameters.radians || parameters.rotation || parameters.to);
        parameters.values = [radians];
        return methods._animate(parameters);
    },
    scale: function (parameters) {
        parameters.keys = ['scale'];
        parameters.values = [vec2.fromStr(parameters.scale || parameters.to)];
        return methods._animate(parameters);
    },
    wait: function (parameters) {
        
    },
    bgm: function (parameters) {
        deleteAudio(backgroundMusic);
        return backgroundMusic = createAudio(parameters.url || parameters.src, true);
    },
    stopbgm: function (parameters) {
        deleteAudio(backgroundMusic);
    },
    se: function (parameters) {
        var url = parameters.url || parameters.src;
        var loop = parseInt(parameters.loop) ? true : false;
        var id = parameters.id || parameters.name;
        return se[id] = createAudio(url, loop);
    },
    stopse: function (parameters) {
        var id = parameters.id || parameters.name;
        deleteAudio(se[id]);
        return se[id] = undefined;
    },
};
function createScript(url) {
    
    scriptLocation = -1;
}
function isWhitespace(c) {
    return c == ' ' || c == '	' || c == '\n' || c == '\r';
}
function nextLocation(str, location, callback) {
    for (var i = location + 1 ; i < str.length ; ++i)
        if (callback(str[i]))
            return i;
    return str.length;
}
function parseParameters(str) {
    var parameters = {}, location = -1;
    while (location < str.length) {
        var keyBegin = nextLocation(str, location, function (c) { return !isWhitespace(c); });
        if (keyBegin >= str.length) break;
        var keyEnd = nextLocation(str, keyBegin, function (c) { return c == '=' || isWhitespace(c); });
        if (keyEnd >= str.length) break;
        var equalLocation = str[keyEnd] == '=' ? keyEnd : nextLocation(str, keyEnd, function (c) { return c == '='; });
        if (equalLocation >= str.length) break;
        var valueBegin = nextLocation(str, equalLocation, function (c) { return !isWhitespace(c); });
        if (valueBegin >= str.length) break;
        var valueEnd, quote = str[valueBegin];
        if (quote == "'" || quote == '"') {
            valueEnd = nextLocation(str, valueBegin, function (c) { return c == quote; });
            ++valueBegin;
        }
        else valueEnd = nextLocation(str, valueBegin, function (c) { return isWhitespace(c); });
        parameters[str.slice(keyBegin, keyEnd)] = str.slice(valueBegin, valueEnd);
        location = valueEnd;
    }
    return parameters;
}
function mergeParameters(src, dst, force) {
    for (key in dst)
        if (force || src[key] === undefined)
            src[key] = dst[key];
    return src;
}
function parseReference(src, dst) {
    for (key in src)
        if (src[key][0] == '$')
            if (dst[src[key].slice(1)] !== undefined)
                src[key] = dst[src[key].slice(1)];
    return src;
}
function execute(str, parameters) {
    var location;
    if (str === undefined) {
        str = script;
        location = scriptLocation;
    }
    else location = -1;
    if (!str) return ;
    parameters = parameters || variables;
    while (location < str.length) {
        var bracketBegin = nextLocation(str, location, function (c) { return c == '[' || c == '{'; });
        if (bracketBegin >= str.length) break;
        var bracket = str[bracketBegin] == '[' ? ']' : '}', quote = '';
        var bracketEnd = nextLocation(str, bracketBegin, function (c) {
            if (c == bracket && !quote) return true;
            if (c == "'" || c == '"')
                if (quote) {
                    if (c == quote) quote = '';
                }
                else {
                    quote = c;
                }
            return false;
        });
        location = bracketEnd;
        var methodBegin = nextLocation(str, bracketBegin, function (c) { return !isWhitespace(c); });
        var methodEnd = nextLocation(str, methodBegin, function (c) { return c == bracket || isWhitespace(c); });
        var selector = str.slice(methodBegin, methodEnd);
        var body = str.slice(methodEnd, bracketEnd);
        if (bracket == ']') {
            if (methods[selector])
                methods[selector](parseReference(mergeParameters(parseParameters(body), parameters), parameters));
            else if (methodsSources[selector])
                execute(methodsSources[selector], parseReference(mergeParameters(parseParameters(body), parameters), parameters));
        }
        else {
            methodsSources[selector] = body;
        }
    }
}
function mouseDown(event) {
    mouseMove(event);
    if (transition || draggedType != -1) return ;
    draggedType = event.button;
    event = {mouseLocation: mouseLocation};
    draggedLayer = foreLayer.dispatchEvent(event);
    if (draggedLayer) {
        if (draggedType == 0) draggedLayer.mouseDown(event);
        else if (draggedType == 2) draggedLayer.rightMouseDown(event);
    }
}
function mouseUp(event) {
    mouseMove(event);
    if (transition) return ;
    event = {mouseLocation: mouseLocation};
    if (draggedLayer) {
        if (draggedType == 0) draggedLayer.mouseUp(event);
        else if (draggedType == 2) draggedLayer.rightMouseUp(event);
    }
    draggedLayer = null;
    draggedType = -1;
}
function mouseMove(event) {
    mouseLocation = {x:event.offsetX, y:canvas.height - event.offsetY};
}
function keyDown(event) {
    if (transition) return ;
    
}
function keyUp(event) {
    if (transition) return ;
    
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
    aTexCoord = gl.getAttribLocation(shaderProgram, 'a_TexCoord');
    gl.enableVertexAttribArray(aTexCoord);
    uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'u_ModelViewMatrix');
    uColor = gl.getUniformLocation(shaderProgram, 'u_Color');
    uMask2DEnabled = gl.getUniformLocation(shaderProgram, 'u_Mask2DEnabled');
    uMask2DProgress = gl.getUniformLocation(shaderProgram, 'u_Mask2DProgress');
    uMask2DOffset = gl.getUniformLocation(shaderProgram, 'u_Mask2DOffset');
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
    loadIdentity();
    disableMask2D();
    setMask2DProgress(0);
    setMask2DOffset(0);
    window.addEventListener('resize', resize, false);
    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('keydown', keyDown, false);
    canvas.addEventListener('keyup', keyUp, false);
    foreLayer = new Layer();
    backLayer = new Layer();
    animationFrame = window.requestAnimationFrame(animate);
};
window.onunload = function () {
    if (!gl) return ;
    window.cancelAnimationFrame(animationFrame);
    gl.deleteBuffer(sharedTexCoordBuffer);
    foreLayer.dealloc();
    backLayer.dealloc();
};