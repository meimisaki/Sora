var Sora = {}, gl;

Sora.extend = function (obj, source) {
    if (Object.keys) {
        var keys = Object.keys(source);
        for (var i = 0, il = keys.length ; i < il ; i++) {
            var prop = keys[i];
            Object.defineProperty(obj, prop, Object.getOwnPropertyDescriptor(source, prop));
        }
    }
    else {
        var safeHasOwnProperty = {}.hasOwnProperty;
        for (var prop in source) {
            if (safeHasOwnProperty.call(source, prop)) {
                obj[prop] = source[prop];
            }
        }
    }
    return obj;
};

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

Sora.Color = function (value) {
    if (value !== undefined) this.set(value);
    return this;
};
Sora.extend(Sora.Color.prototype, {
    r: 1, g: 1, b: 1,
    set: function (value) {
        switch (typeof value) {
            case 'number':
                this.setHex(value);
                break;
            case 'string':
                this.setStyle(value);
                break;
        }
        return this;
    },
    setHex: function (hex) {
        hex = Math.floor(hex);
        this.r = (hex >> 16 & 255) / 255;
        this.g = (hex >> 8 & 255) / 255;
        this.b = (hex & 255) / 255;
        return this;
    },
    setRGB: function (r, g, b) {
        this.r = r, this.g = g, this.b = b;
        return this;
    },
    setStyle: function (style) {
        var rgb_d_d_d = /^\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/;
        if (rgb_d_d_d.test(style)) {
            var c = rgb_d_d_d.exec(style);
            this.r = Math.min(255, parseInt(c[1], 10)) / 255;
            this.g = Math.min(255, parseInt(c[2], 10)) / 255;
            this.b = Math.min(255, parseInt(c[3], 10)) / 255;
            return this;
        }
        var sharp_h6 = /^\s*\#\s*([0-9a-f]{6})\s*$/i;
        if (sharp_h6.test(style)) {
            var c = sharp_h6.exec(style);
            this.setHex(parseInt(c[1], 16));
            return this;
        }
        var sharp_h3 = /^\s*\#\s*([0-9a-f])([0-9a-f])([0-9a-f])\s*$/i;
        if (sharp_h3.test(style)) {
            var c = sharp_h3.exec(style);
            this.setHex(parseInt(c[1] + c[1] + c[2] + c[2] + c[3] + c[3], 16));
            return this;
        }
        var keyword = /^\s*(\w+)\s*$/i;
        if (keyword.test(style)) {
            var c = keyword.exec(style);
            this.setHex(this.keywords[style]);
            return this;
        }
        return this;
    },
    blend: function (c) {
        this.r *= c.r, this.g *= r.g, this.b *= r.b;
    },
    equalTo: function (c) {
        return this.r == c.r && this.g == c.g && this.b == c.b;
    },
    toArray: function () {
        return [this.r, this.g, this.b];
    },
    toString: function () {
        var r = Math.floor(this.r * 255);
        var g = Math.floor(this.g * 255);
        var b = Math.floor(this.b * 255);
        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    },
    keywords: {
        "aliceblue": 0xF0F8FF, "antiquewhite": 0xFAEBD7, "aqua": 0x00FFFF, "aquamarine": 0x7FFFD4, "azure": 0xF0FFFF,
        "beige": 0xF5F5DC, "bisque": 0xFFE4C4, "black": 0x000000, "blanchedalmond": 0xFFEBCD, "blue": 0x0000FF, "blueviolet": 0x8A2BE2,
        "brown": 0xA52A2A, "burlywood": 0xDEB887, "cadetblue": 0x5F9EA0, "chartreuse": 0x7FFF00, "chocolate": 0xD2691E, "coral": 0xFF7F50,
        "cornflowerblue": 0x6495ED, "cornsilk": 0xFFF8DC, "crimson": 0xDC143C, "cyan": 0x00FFFF, "darkblue": 0x00008B, "darkcyan": 0x008B8B,
        "darkgoldenrod": 0xB8860B, "darkgray": 0xA9A9A9, "darkgreen": 0x006400, "darkgrey": 0xA9A9A9, "darkkhaki": 0xBDB76B, "darkmagenta": 0x8B008B,
        "darkolivegreen": 0x556B2F, "darkorange": 0xFF8C00, "darkorchid": 0x9932CC, "darkred": 0x8B0000, "darksalmon": 0xE9967A, "darkseagreen": 0x8FBC8F,
        "darkslateblue": 0x483D8B, "darkslategray": 0x2F4F4F, "darkslategrey": 0x2F4F4F, "darkturquoise": 0x00CED1, "darkviolet": 0x9400D3,
        "deeppink": 0xFF1493, "deepskyblue": 0x00BFFF, "dimgray": 0x696969, "dimgrey": 0x696969, "dodgerblue": 0x1E90FF, "firebrick": 0xB22222,
        "floralwhite": 0xFFFAF0, "forestgreen": 0x228B22, "fuchsia": 0xFF00FF, "gainsboro": 0xDCDCDC, "ghostwhite": 0xF8F8FF, "gold": 0xFFD700,
        "goldenrod": 0xDAA520, "gray": 0x808080, "green": 0x008000, "greenyellow": 0xADFF2F, "grey": 0x808080, "honeydew": 0xF0FFF0, "hotpink": 0xFF69B4,
        "indianred": 0xCD5C5C, "indigo": 0x4B0082, "ivory": 0xFFFFF0, "khaki": 0xF0E68C, "lavender": 0xE6E6FA, "lavenderblush": 0xFFF0F5, "lawngreen": 0x7CFC00,
        "lemonchiffon": 0xFFFACD, "lightblue": 0xADD8E6, "lightcoral": 0xF08080, "lightcyan": 0xE0FFFF, "lightgoldenrodyellow": 0xFAFAD2, "lightgray": 0xD3D3D3,
        "lightgreen": 0x90EE90, "lightgrey": 0xD3D3D3, "lightpink": 0xFFB6C1, "lightsalmon": 0xFFA07A, "lightseagreen": 0x20B2AA, "lightskyblue": 0x87CEFA,
        "lightslategray": 0x778899, "lightslategrey": 0x778899, "lightsteelblue": 0xB0C4DE, "lightyellow": 0xFFFFE0, "lime": 0x00FF00, "limegreen": 0x32CD32,
        "linen": 0xFAF0E6, "magenta": 0xFF00FF, "maroon": 0x800000, "mediumaquamarine": 0x66CDAA, "mediumblue": 0x0000CD, "mediumorchid": 0xBA55D3,
        "mediumpurple": 0x9370DB, "mediumseagreen": 0x3CB371, "mediumslateblue": 0x7B68EE, "mediumspringgreen": 0x00FA9A, "mediumturquoise": 0x48D1CC,
        "mediumvioletred": 0xC71585, "midnightblue": 0x191970, "mintcream": 0xF5FFFA, "mistyrose": 0xFFE4E1, "moccasin": 0xFFE4B5, "navajowhite": 0xFFDEAD,
        "navy": 0x000080, "oldlace": 0xFDF5E6, "olive": 0x808000, "olivedrab": 0x6B8E23, "orange": 0xFFA500, "orangered": 0xFF4500, "orchid": 0xDA70D6,
        "palegoldenrod": 0xEEE8AA, "palegreen": 0x98FB98, "paleturquoise": 0xAFEEEE, "palevioletred": 0xDB7093, "papayawhip": 0xFFEFD5, "peachpuff": 0xFFDAB9,
        "peru": 0xCD853F, "pink": 0xFFC0CB, "plum": 0xDDA0DD, "powderblue": 0xB0E0E6, "purple": 0x800080, "red": 0xFF0000, "rosybrown": 0xBC8F8F,
        "royalblue": 0x4169E1, "saddlebrown": 0x8B4513, "salmon": 0xFA8072, "sandybrown": 0xF4A460, "seagreen": 0x2E8B57, "seashell": 0xFFF5EE,
        "sienna": 0xA0522D, "silver": 0xC0C0C0, "skyblue": 0x87CEEB, "slateblue": 0x6A5ACD, "slategray": 0x708090, "slategrey": 0x708090, "snow": 0xFFFAFA,
        "springgreen": 0x00FF7F, "steelblue": 0x4682B4, "tan": 0xD2B48C, "teal": 0x008080, "thistle": 0xD8BFD8, "tomato": 0xFF6347, "turquoise": 0x40E0D0,
        "violet": 0xEE82EE, "wheat": 0xF5DEB3, "white": 0xFFFFFF, "whitesmoke": 0xF5F5F5, "yellow": 0xFFFF00, "yellowgreen": 0x9ACD32,
    },
});
Array.prototype.toColor = Array.prototype.toColor || function () {
    var l;
    var r = l >= 1 ? this[0] : 0;
    var g = l >= 2 ? this[1] : 0;
    var b = l >= 3 ? this[2] : 0;
    return new Sora.Color().setRGB(r, g, b);
};
String.prototype.toColor = String.prototype.toColor || function () {
    return new Sora.Color().setStyle(this);
};

Sora.Vector2 = function (x, y) {
    this.x = x || 0, this.y = y || 0;
    return this;
};
Sora.extend(Sora.Vector2.prototype, {
    set: function (x, y) {
        this.x = x, this.y = y;
        return this;
    },
    setX: function (x) {
        this.x = x;
        return this;
    },
    setY: function (y) {
        this.y = y;
        return this;
    },
    add: function (v) {
        this.x += v.x, this.y += v.y;
        return this;
    },
    sub: function (v) {
        this.x -= v.x, this.y -= v.y;
        return this;
    },
    mul: function (s) {
        this.x *= s, this.y *= s;
        return this;
    },
    div: function (s) {
        if (s !== 0) {
            this.x /= s, this.y /= s;
        }
        return this;
    },
    dot: function (v) {
        return this.x * v.x + this.y * v.y;
    },
    cross: function (v) {
        return this.x * v.y + this.y * v.x;
    },
    lengthSquared: function () {
        return this.x * this.x + this.y * this.y;
    },
    length: function () {
        return Math.sqrt(this.lengthSquared());
    },
    normalize: function () {
        return this.div(this.length());
    },
    distanceToSquared: function (v) {
        var dx = this.x - v.x, dy = this.y - v.y;
        return dx * dx + dy * dy;
    },
    distanceTo: function (v) {
        return Math.sqrt(this.distanceToSquared(v));
    },
    equalTo: function (v) {
        return this.x == v.x && this.y == v.y;
    },
    toArray: function () {
        return [this.x, this.y];
    },
    toString: function () {
        return '(' + this.x + ', ' + this.y + ')';
    },
});
Array.prototype.toVector2 = Array.prototype.toVector2 || function () {
    var l = this.length;
    var x = l >= 1 ? this[0] : 0;
    var y = l >= 2 ? this[1] : 0;
    return new Sora.Vector2(x, y);
};
String.prototype.toVector2 = String.prototype.toVector2 || function () {
    var f_f = /^\s*\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?\s*$/;
    if (f_f.test(this)) {
        var v = f_f.exec(this);
        return new Sora.Vector2(parseFloat(v[1]), parseFloat(v[2]));
    }
    return new Sora.Vector2();
};

Sora.Matrix4 = function (m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
    this.set(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
    return this;
};
Sora.extend(Sora.Matrix4.prototype, {
    set : function (m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
        this.m11 = m11 || 0, this.m12 = m12 || 0, this.m13 = m13 || 0, this.m14 = m14 || 0;
        this.m21 = m21 || 0, this.m22 = m22 || 0, this.m23 = m23 || 0, this.m24 = m24 || 0;
        this.m31 = m31 || 0, this.m32 = m32 || 0, this.m33 = m33 || 0, this.m34 = m34 || 0;
        this.m41 = m41 || 0, this.m42 = m42 || 0, this.m43 = m43 || 0, this.m44 = m44 || 0;
        return this;
    },
    add: function (m) {
        
        return this;
    },
    sub: function (m) {
        
        return this;
    },
    mul: function (m) {
        
        return this;
    },
    identity: function () {
        this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return this;
    },
    equalTo: function (m) {
        return this.m11 == m.m11 && this.m12 == m.m12 && this.m13 == m.m13 && this.m14 == m.m14 &&
               this.m21 == m.m21 && this.m22 == m.m22 && this.m23 == m.m23 && this.m24 == m.m24 &&
               this.m31 == m.m31 && this.m32 == m.m32 && this.m33 == m.m33 && this.m34 == m.m34 &&
               this.m41 == m.m41 && this.m42 == m.m42 && this.m43 == m.m43 && this.m44 == m.m44;
    },
    toArray: function () {
        return [this.m11, this.m12, this.m13, this.m14,
                this.m21, this.m22, this.m23, this.m24,
                this.m31, this.m32, this.m33, this.m34,
                this.m41, this.m42, this.m43, this.m44];
    },
    toString: function () {
        
    },
});
Array.prototype.toMatrix4 = Array.prototype.toMatrix4 || function () {
    var l = this.length;
    var m11 = l >= 1 ? this[0] : 0;
    var m12 = l >= 2 ? this[1] : 0;
    var m13 = l >= 3 ? this[2] : 0;
    var m14 = l >= 4 ? this[3] : 0;
    var m21 = l >= 5 ? this[4] : 0;
    var m22 = l >= 6 ? this[5] : 0;
    var m23 = l >= 7 ? this[6] : 0;
    var m24 = l >= 8 ? this[7] : 0;
    var m31 = l >= 9 ? this[8] : 0;
    var m32 = l >= 10 ? this[9] : 0;
    var m33 = l >= 11 ? this[10] : 0;
    var m34 = l >= 12 ? this[11] : 0;
    var m41 = l >= 13 ? this[12] : 0;
    var m42 = l >= 14 ? this[13] : 0;
    var m43 = l >= 15 ? this[14] : 0;
    var m44 = l >= 16 ? this[15] : 0;
    return new Sora.Matrix4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
};
String.prototype.toMatrix4 = String.prototype.toMatrix4 || function () {
    
};

Sora.Layer = function (origin, size, anchor, rotation, color, alpha) {
    this.origin = origin || new Vector2();
    this.size = size || new Vector2(Sora.width, Sora.height);
    this.anchor = anchor || new Vector2();
    this.rotation = rotation || 0;
    this.color = color || new Color();
    this.alpha = alpha || 1;
    this.superlayer = null;
    this.sublayers = [];
    return this;
};
Sora.extend(Sora.Layer.prototype, {
    addSublayer: function (layer) {
        if (!layer || layer == this) return ;
        if (layer.superlayer) layer.removeFromSuperlayer();
        
    },
    removeFromSuperlayer: function () {
        
        this.superlayer = null;
    },
    draw: function () {
        
    },
    visit: function () {
        
    },
    mouseDown: function (event) {
        
    },
    mouseUp: function (event) {
        
    },
    mouseDragged: function (event) {
        
    },
    rightMouseDown: function (event) {
        
    },
    rightMouseUp: function (event) {
        
    },
    rightMouseDragged: function (event) {
        
    },
    mouseMove: function (event) {
        
    },
    mouseEntered: function (event) {
        
    },
    mouseExited: function (event) {
        
    },
    keyDown: function (event) {
        
    },
    keyUp: function (event) {
        
    },
});

Sora.IMAGE = 0x0;
Sora.VIDEO = 0x1;
Sora.ImageLayer = function (origin, size, anchor, rotation, color, alpha, url, type) {
    Sora.Layer.call(this, origin, size, anchor, rotation, color, alpha);
    var element;
    if (type === undefined || type == Sora.IMAGE)
        element = new Image();
    else
        element = document.createElement('video');
    var scope = this;
    element.onload = function () {
        scope.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, scope.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.UNSIGNED_BYTE, element);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    element.src = url;
    return this;
};
Sora.ImageLayer.prototype = Object.create(Sora.Layer);
Sora.extend(Sora.ImageLayer.prototype, {
    draw: function () {
        if (this.texture) {
            
        }
    },
});

Sora.Button = function (origin, size, anchor, rotation, color, alpha) {
    Sora.Layer.call(this, origin, size, anchor, rotation, color, alpha);
    return this;
};
Sora.Button.prototype = Object.create(Sora.Layer);
Sora.extend(Sora.Button.prototype, {
    mouseDown: function (event) {
        
    },
    mouseUp: function (event) {
        
    },
    mouseEntered: function (event) {
        
    },
    mouseExited: function (event) {
        
    },
});

Sora.animations = [];
Sora.timmingFunctionLinear = function (t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return t;
};
Sora.timmingFunctionEaseIn = function (t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return Math.sin((t - 1) * Math.PI * 0.5) + 1;
};
Sora.timmingFunctionEaseOut = function (t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return Math.sin(t * Math.PI * 0.5);
};
Sora.timmingFunctionEaseInOut = function (t, r) {
    t = Math.max(0, Math.min(1, t));
    if (r) t = 1 - t;
    return Math.sin((x - 0.5) * Math.PI) * 0.5 + 0.5;
};
Sora.Animation = function (target, duration, repeat, reverse, autorev, timmingFunc) {
    this.target = target;
    this.duration = duration ? Math.max(33, duration) : 1000;
    this.elapsed = 0;
    this.repeat = repeat ? Math.max(0, repeat) : 1;
    this.reverse = reverse ? true : false;
    this.autorev = autorev ? true : false;
    this.timmingFunc = timmingFunc ? timmingFunc : Sora.timmingFunctionLinear;
    return this;
};
Sora.extend(Sora.Animation.prototype, {
    start: function () {
        
    },
    stop: function () {
        
    },
    update: function (t) {
        
    },
    step: function (dt) {
        this.elapsed += dt;
        var t;
        if (this.finished())
            t = this.repeat - parseInt(this.repeat) || 1;
        else
            t = (((this.elapsed - 1) % this.duration) + 1) / this.duration;
        // autorev
        t = Math.max(0, Math.min(1, t));
        this.update(this.timmingFunc(t, this.reverse));
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
});

Sora.mouseDown = function (event) {
    
};
Sora.mouseUp = function (event) {
    
};
Sora.rightMouseDown = function (event) {
    
};
Sora.rightMouseUp = function (event) {
    
};
Sora.mouseMove = function (event) {
    
};
Sora.keyDown = function (event) {
    
};
Sora.keyUp = function (event) {
    
};

Sora.resize = function (event) {
    var width = window.innerWidth, height = window.innerHeight, aspect = Sora.width / Sora.height;
    if (width < height * aspect)
        height = width / aspect;
    else
        width = height * aspect;
    Sora.canvas.width = width;
    Sora.canvas.height = height;
    Sora.canvas.style.width = width + 'px';
    Sora.canvas.style.height = height + 'px';
    Sora.canvas.style.marginLeft = (window.innerWidth - width) * 0.5 + 'px';
    Sora.canvas.style.marginTop = (window.innerHeight - height) * 0.5 + 'px';
    if (gl) {
        gl.viewport(0, 0, width, height);
    }
};

Sora.render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
};

Sora.animate = function (currTime) {
    if (Sora.lastTime === undefined) {
        Sora.lastTime = currTime;
    }
    else {
        var dt = Math.max(0, Math.min(33, currTime - Sora.lastTime));
        Sora.lastTime = currTime;
        Sora.animations.sort(function (a, b) { return a.remain() - b.remain(); });
        for (var i = 0 ; i < Sora.animations.length ;) {
            Sora.animations[i].step(dt);
            if (Sora.animations[i].finished()) Sora.animations.splice(i, 1);
            else ++i;
        }
        Sora.render();
    }
    window.requestAnimationFrame(Sora.animate);
};

Sora.vertexShaderSource = [
    'void main(void) {',
    '}',
].join('\n');
Sora.fragmentShaderSource = [
    'void main(void) {',
    '}',
].join('\n');
Sora.createShader = function (source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
};

Sora.perspective = function (fovy, aspect, zNear, zFar) {
    
};
Sora.lookAt = function (eye, center, up) {
    
};

Sora.matrixMode = function (mode) {
    
};
Sora.pushMatrix = function () {
    
};
Sora.popMatrix = function () {
    
};

window.onload = function () {
    document.body.style.marginLeft = '0px';
    document.body.style.marginTop = '0px';
    Sora.width = 1280;
    Sora.height = 720;
    Sora.canvas = document.createElement('canvas');
    Sora.resize();
    document.body.appendChild(Sora.canvas);
    gl = Sora.canvas.getContext('experimental-webgl');
    if (!gl) {
        alert('Couldn\'t get webgl context');
        return ;
    }
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    Sora.vertexShader = Sora.createShader(Sora.vertexShaderSource, gl.VERTEX_SHADER);
    Sora.fragmentShader = Sora.createShader(Sora.fragmentShaderSource, gl.FRAGMENT_SHADER);
    Sora.shaderProgram = gl.createProgram();
    gl.attachShader(Sora.shaderProgram, Sora.vertexShader);
    gl.attachShader(Sora.shaderProgram, Sora.fragmentShader);
    gl.linkProgram(Sora.shaderProgram);
    if (!gl.getProgramParameter(Sora.shaderProgram, gl.LINK_STATUS)) {
        alert('Couldn\'t initialize shader program');
        return ;
    }
    gl.useProgram(Sora.shaderProgram);
    Sora.canvas.addEventListener('mousedown', Sora.mouseDown, false);
    Sora.canvas.addEventListener('mouseup', Sora.mouseUp, false);
    Sora.canvas.addEventListener('mousemove', Sora.mouseMove, false);
    Sora.canvas.addEventListener('keydown', Sora.keyDown, false);
    Sora.canvas.addEventListener('keyup', Sora.keyUp, false);
    window.addEventListener('resize', Sora.resize, false);
    window.requestAnimationFrame(Sora.animate);
};
