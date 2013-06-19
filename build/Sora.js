var Sora = {};

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
    var r = this.length >= 1 ? this[0] : 0;
    var g = this.length >= 2 ? this[1] : 0;
    var b = this.length >= 3 ? this[2] : 0;
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
        return this.x === v.x && this.y === v.y;
    },
    toArray: function () {
        return [this.x, this.y];
    },
    toString: function () {
        return '(' + this.x + ', ' + this.y + ')';
    },
});
Array.prototype.toVector2 = Array.prototype.toVector2 || function () {
    var x = this.length >= 1 ? this[0] : 0;
    var y = this.length >= 2 ? this[1] : 0;
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

Sora.Layer = function (origin, size, rotation, color, alpha) {
    this.origin = origin || new Vector2();
    this.size = size || new Vector2(Sora.width, Sora.height);
    this.rotation = rotation || 0;
    this.color = color || new Color();
    this.alpha = alpha || 1;
    this.superlayer = null;
    this.sublayers = [];
    return this;
};
Sora.extend(Sora.Layer.prototype, {
    addSublayer: function (layer) {
        
    },
    removeFromSuperlayer: function () {
        
    },
    draw: function () {
        
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

Sora.Button = function (origin, size, rotation, color, alpha) {
    Sora.Layer.call(this, origin, size, rotation, color, alpha);
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
        t = Math.max(0, Math.min(1, t));
        this.update(this.timmingFunc(t, this.reverse));
    },
    finished: function () {
        return this.elapsed >= this.repeat * this.duration;
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
};

Sora.animate = function (currTime) {
    var dt = Math.max(0, Math.min(33, currTime - Sora.lastTime));
    Sora.lastTime = currTime;
    
    Sora.gl.clear(Sora.gl.COLOR_BUFFER_BIT);
    
    window.requestAnimationFrame(Sora.animate);
};

window.onload = function () {
    document.body.style.marginLeft = '0px';
    document.body.style.marginTop = '0px';
    Sora.width = 1280;
    Sora.height = 720;
    Sora.canvas = document.createElement('canvas');
    Sora.resize();
    document.body.appendChild(Sora.canvas);
    Sora.gl = Sora.canvas.getContext('experimental-webgl');
    if (!Sora.gl) return ;
    Sora.gl.clearColor(0, 0, 0, 1);
    Sora.gl.enable(Sora.gl.BLEND);
    Sora.gl.blendEquation(Sora.gl.FUNC_ADD);
    Sora.gl.blendFunc(Sora.gl.SRC_ALPHA, Sora.gl.ONE_MINUS_SRC_ALPHA);
    Sora.canvas.addEventListener('mousedown', Sora.mouseDown, false);
    Sora.canvas.addEventListener('mouseup', Sora.mouseUp, false);
    Sora.canvas.addEventListener('mousemove', Sora.mouseMove, false);
    Sora.canvas.addEventListener('keydown', Sora.keyDown, false);
    Sora.canvas.addEventListener('keyup', Sora.keyUp, false);
    window.addEventListener('resize', Sora.resize, false);
    Sora.lastTime = Date.now();
    window.requestAnimationFrame(Sora.animate);
};
