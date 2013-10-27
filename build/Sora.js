// how to represent fore & back
/*
 @fileoverview Sora - A simple galgame engine (using webgl)
 @author meimisaki
*/
var Sora = {};
(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0 ; x < vendors.length && !self.requestAnimationFrame ; ++x) {
		self.requestAnimationFrame = self[vendors[x] + 'RequestAnimationFrame'];
		self.cancelAnimationFrame = self[vendors[x] + 'CancelAnimationFrame'] || self[vendors[x] + 'CancelRequestAnimationFrame'];
	}
	if (self.requestAnimationFrame === undefined) {
		self.requestAnimationFrame = function (callback) {
			var currTime = Date.now(), timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = self.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
	self.cancelAnimationFrame = self.cancelAnimationFrame || function (id) { self.clearTimeout(id) };
}());
Sora.GL_ARRAY = Float32Array || Array;
Sora.map = function (input, callback) {
	if (callback) {
		if (input.map) {
			return input.map(callback);
		}
		else {
			var output = [];
			for (var i = 0, l = input.length ; i < l ; ++i)
				output.push(callback(input[i]));
			return output;
		}
	}
	return input;
};
Sora.filter = function (input, callback) {
	if (callback) {
		if (input.filter) {
			return input.filter(callback);
		}
		else {
			var output = [];
			for (var i = 0, l = input.length ; i < l ; ++i)
				if (callback(input[i]))
					output.push(input[i]);
		}
	}
	return input;
};
Sora.foreach = function (obj, callback, alternate) {
	if (callback) {
		alternate = alternate || callback;
		if (Object.keys) {
			var keys = Object.keys(obj);
			for (var i = 0, l = keys.length ; i < l ; ++i) {
				var prop = keys[i];
				callback(prop);
			}
		}
		else {
			var safeHasOwnProperty = {}.hasOwnProperty;
			for (var prop in obj)
				if (safeHasOwnProperty.call(obj, prop))
					alternate(prop);
		}
	}
	return obj;
};
Sora.extend = function (obj, src) {
	Sora.foreach(src, function (prop) {
		Object.defineProperty(obj, prop, Object.getOwnPropertyDescriptor(src, prop));
	}, function (prop) {
		obj[prop] = src[prop];
	});
	return obj;
};
Sora.stringify = function (value, key) {
	function quote(string) {
		var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, meta = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		};
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
			var c = meta[a];
			return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' : '"' + string + '"';
	}
	if (key === undefined) key = '';
	else key = ' ' + key + ':';
	switch (typeof value) {
	case 'boolean':
		return key + (value ? 't' : 'f');
	case 'number':
		return key + value;
	case 'string':
		return key + quote(value);
	default:
		return '';
	}
};
Sora.trim = function (str) {
	return str.replace(/^\s+|\s+$/g, '');
};
Sora.parseBool = function (str) {
	switch (typeof str) {
	case 'boolean':
		return str;
	case 'number':
		return str === 0;
	case 'string':
		return /t/i.test(str) || /y/i.test(str) || (parseInt(str) ? true : false);
	case 'object':
		return str !== null;
	case 'function':
		return true;
	default:
		return false;
	}
};
Sora.EventDispatcher = function () {};
Sora.EventDispatcher.prototype = {
	constructor: Sora.EventDispatcher,
	addEventListener: function (type, listener) {
		if (this.listeners === undefined)
			this.listeners = {};
		if (this.listeners[type] === undefined)
			this.listeners[type] = [];
		if (this.listeners[type].indexOf(listener) === -1)
			this.listeners[type].push(listener);
	},
	hasEventListener: function (type, listener) {
		if (this.listeners === undefined)
			return false;
		if (this.listeners[type] === undefined)
			return false;
		if (this.listeners[type].indexOf(listener) === -1)
			return false;
		return true;
	},
	removeEventListener: function (type, listener) {
		if (this.listeners === undefined)
			return ;
		if (this.listeners[type] === undefined)
			return ;
		var index = this.listeners[type].indexOf(listener);
		if (index !== -1)
			this.listeners[type].splice(index, 1);
	},
	dispatchEvent: function (event) {
		if (this.listeners === undefined)
			return ;
		var listenerArray = this.listeners[event.type];
		if (listenerArray !== undefined) {
			event.target = this;
			for (var i = 0, l = listenerArray.length ; i < l ; ++i)
				listenerArray[i].call(this, event);
		}
	},
	dealloc: function () {
		this.dispatchEvent({type: 'dealloc'});
	},
	name: '',
	params: function () {
		return '';
	},
	str: function () {
		return '';
	}
};
Sora.Texture = function (image, callback) {
	Sora.EventDispatcher.call(this);
	this.needsUpdate = false;
	this.texture = null;
	this.flipY = true;
	switch (typeof image) {
	case 'string':
		this.image = new Image();
		var scope = this;
		this.image.onload = function () {
			scope.needsUpdate = true;
			if (callback) callback();
		};
		this.image.src = image;
		break;
	default:
		this.image = image;
		if (callback) callback();
		break;
	}
};
Sora.Texture.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Texture.prototype, {
	str: function () {
		if (this.image instanceof Image)
			return this.image.src;
		else
			return null;
	}
});
Sora.Audio = function (params) {
	this.audio = document.createElement('audio');
	this.audio.loop = params.loop ? Sora.parseBool(params.loop) : false;
	this.audio.volume = params.volume ? parseFloat(params.volume) : 1;
	this.audio.autoplay = true;
	if (params.currentTime) {
		var scope = this;
		this.audio.oncanplay = function () {
			scope.audio.currentTime = parseFloat(params.currentTime);
		};
	}
	this.id = params.id;
	this.single = params.single ? Sora.parseBool(params.single) : false;
	this.audio.src = params.src;
};
Sora.Audio.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Audio.prototype, {
	play: function () {
		this.audio.play();
	},
	pause: function () {
		this.audio.pause();
	},
	stop: function () {
		this.audio.pause();
		this.audio.currentTime = 0;
	},
	name: 'audio',
	params: function () {
		return Sora.stringify(this.audio.loop, 'loop') +
		Sora.stringify(this.audio.volume, 'volume') +
		Sora.stringify(this.audio.currentTime, 'currentTime') +
		Sora.stringify(this.id, 'id') +
		Sora.stringify(this.single, 'single') +
		Sora.stringify(this.audio.src, 'src');
	},
	str: function () {
		return '[' + this.name + this.params + ']';
	}
});
Sora.timingFuncLinear = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return t;
};
Sora.timingFuncEaseIn = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return Math.sin((t - 1) * Math.PI * 0.5) + 1;
};
Sora.timingFuncEaseOut = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return Math.sin(t * Math.PI * 0.5);
};
Sora.timingFuncEaseInOut = function (t, r) {
	t = Math.max(0, Math.min(1, t));
	if (r) t = 1 - t;
	return Math.sin((t - 0.5) * Math.PI) * 0.5 + 0.5;
};
Sora.Action = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	this.target = params.target;
	this.duration = params.duration ? Math.max(1, parseInt(params.duration)) : 1000;
	this.elapsed = params.elapsed ? Math.max(0, parseInt(params.elapsed)) : 0;
	this.repeat = params.repeat ? Math.max(0, parseFloat(params.repeat)) : 1;
	this.reverse = params.reverse ? Sora.parseBool(params.reverse) : false;
	this.autorev = params.autorev ? Sora.parseBool(params.autorev) : false;
	this.needsFinish = params.needsFinish ? Sora.parseBool(params.needsFinish) : true;
	this.timing = params.timing ? params.timing.toLowerCase() : '';
	this.callback = params.callback;
	this.keys = [];
	this.fromValues = [];
	this.toValues = [];
	var scope = this;
	Sora.foreach(params, function (prop) {
		if (scope[prop] === undefined && typeof scope.target[prop] === 'number') {
			var str = params[prop], fromValue, toValue;
			if (/([\s\S]+)->([\s\S]+)/.test(str)) {
				fromValue = parseFloat(RegExp.$1);
				toValue = parseFloat(RegExp.$2);
			}
			else {
				fromValue = scope.target[prop];
				toValue = parseFloat(str);
			}
			scope.keys.push(prop);
			scope.fromValues.push(fromValue);
			scope.toValues.push(toValue);
		}
	});
};
Sora.Action.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Action.prototype, {
	update: function (t) {
		var timingFunc;
		if (this.timing.match('easeinout')) timingFunc = Sora.timingFuncEaseInOut;
		else if (this.timing.match('easeout')) timingFunc = Sora.timingFuncEaseOut;
		else if (this.timing.match('easein')) timingFunc = Sora.timingFuncEaseIn;
		else timingFunc = Sora.timingFuncLinear;
		t = timingFunc(t, this.reverse);
		for (var i = 0, l = this.keys.length ; i < l ; ++i)
			this.target[this.keys[i]] = this.toValues[i] * t + (1 - t) * this.fromValues[i];
	},
	step: function (dt) {
		var t = Math.floor((Math.max(1, Math.min(this.repeat * this.duration, this.elapsed)) - 1) / this.duration);
		this.elapsed = Math.max(0, this.elapsed + dt);
		t ^= Math.floor((Math.max(1, Math.min(this.repeat * this.duration, this.elapsed)) - 1) / this.duration);
		if (this.autorev && (t & 1)) this.reverse = !this.reverse;
		if (this.done())
			t = this.repeat - Math.floor(this.repeat) || 1;
		else
			t = this.elapsed ? (((this.elapsed - 1) % this.duration) + 1) / this.duration : 0;
		this.update(t);
		if (this.done() && this.callback) this.callback();
	},
	remain: function () {
		if (this.elapsed <= Math.floor(this.repeat) * this.duration)
			return this.duration - ((this.elapsed - 1) % this.duration + 1);
		else
			return this.repeat * this.duration - this.elapsed;
	},
	done: function () {
		return this.elapsed >= this.repeat * this.duration;
	},
	name: 'action',
	params: function () {
		var str = Sora.stringify(this.target.id, 'target') +
		Sora.stringify(this.duration, 'duration') +
		Sora.stringify(this.elapsed, 'elapsed') +
		Sora.stringify(this.repeat, 'repeat') +
		Sora.stringify(this.reverse, 'reverse') +
		Sora.stringify(this.autorev, 'autorev') +
		Sora.stringify(this.needsFinish, 'needsFinish') +
		Sora.stringify(this.timing, 'timing');
		for (var i = 0, l = this.keys.length ; i < l ; ++i)
			str += Sora.stringify(Sora.stringify(this.fromValues[i]) + '->' + Sora.stringify(this.toValues[i]), this.keys[i]);
		return str;
	},
	str: function () {
		return '[' + this.name + this.params() + ']';
	}
});
Sora.Layer = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	this.x = params.x ? parseFloat(params.x) : 0;
	this.y = params.y ? parseFloat(params.y) : 0;
	this.width = params.width ? parseFloat(params.width) : 0;
	this.height = params.height ? parseFloat(params.height) : 0;
	this.anchorX = params.anchorX ? parseFloat(params.anchorX) : 0;
	this.anchorY = params.anchorY ? parseFloat(params.anchorY) : 0;
	this.scaleX = params.scaleX ? parseFloat(params.scaleX) : 1;
	this.scaleY = params.scaleY ? parseFloat(params.scaleY) : 1;
	this.rotation = params.rotation ? parseFloat(params.rotation) : 0;
	this.opacity = params.opacity ? parseFloat(params.opacity) : 1;
	this.order = params.order ? parseInt(params.order) : 0;
	this.id = params.id;
	this.sublayers = [];
	this.superlayer = null;
	var scope = this;
	this.texture = params.src ? new Sora.Texture(params.src, function () {
		if (!params.width) scope.width = scope.texture.image.width;
		if (!params.height) scope.height = scope.texture.image.height;
	}) : null;
};
Sora.Layer.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.extend(Sora.Layer.prototype, {
	addSublayer: function (layer) {
		if (layer.superlayer) layer.removeFromSuperlayer();
		var i = 0;
		for (var l = this.sublayers.length ; i < l ; ++i)
			if (layer.order < this.sublayers[i].order)
				break;
		this.sublayers.splice(i, 0, layer);
		layer.superlayer = this;
	},
	removeFromSuperlayer: function () {
		if (!this.superlayer) return ;
		var layers = this.superlayer.sublayers;
		for (var i = 0, l = layers.length ; i < l ; ++i)
			if (layers[i] === this) {
				layers.splice(i, 1);
				break;
			}
		this.superlayer = null;
	},
	update: function () {
		
	},
	getLayersByParams: function (params) {
		var layers = [];
		if ((params.id === undefined || params.id === this.id) &&
			(params.type === undefined || params.type === this.name))
			layers.push(this);
		for (var i = 0, l = this.sublayers.length ; i < l ; ++i)
			layers = layers.concat(this.sublayers[i].getLayersByParams(params));
		return layers;
	},
	dealloc: function () {
		if (this.texture) this.texture.dealloc();
		for (var i = 0, l = this.sublayers.length ; i < l ; ++i)
			this.sublayers[i].dealloc();
		Sora.EventDispatcher.prototype.dealloc.call(this);
	},
	mouseEntered: function (event) {
		
	},
	mouseExited: function (event) {
		
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
	rightMouseDraged: function (event) {
		
	},
	keyDown: function (event) {
		
	},
	keyUp: function (event) {
		
	},
	responseToMouseEvent: function (event) {
		
		return null;
	},
	responseToKeyEvent: function (event) {
		
		return null;
	},
	name: 'layer',
	params: function () {
		return Sora.stringify(this.x, 'x') +
		Sora.stringify(this.y, 'y') +
		Sora.stringify(this.width, 'width') +
		Sora.stringify(this.height, 'height') +
		Sora.stringify(this.anchorX, 'anchorX') +
		Sora.stringify(this.anchorY, 'anchorY') +
		Sora.stringify(this.scaleX, 'scaleX') +
		Sora.stringify(this.scaleY, 'scaleY') +
		Sora.stringify(this.rotation, 'rotation') +
		Sora.stringify(this.opacity, 'opacity') +
		Sora.stringify(this.order, 'order') +
		Sora.stringify(this.id, 'id') +
		Sora.stringify(this.superlayer ? this.superlayer.id : null, 'super') +
		Sora.stringify(this.texture ? this.texture.str() : null, 'src');
	},
	str: function () {
		return '[' + this.name + this.params() + ']' + Sora.map(this.sublayers, function (layer) {
			return layer.str();
		}).join('');
	}
});
Sora.Label = function (params) {
	params = params || {};
	params.src = null;
	Sora.Layer.call(this, params);
	this.canvas = document.createElement('canvas');
	this.context = this.canvas.getContext('2d');
	this.text = params.text || '';
	this.font = params.font || this.context.font;
	this.align = params.align || this.context.textAlign;
	this.texture = new Sora.Texture(this.canvas);
	this.start = params.start ? parseFloat(params.start) : 1;
};
Sora.Label.prototype = Object.create(Sora.Layer.prototype);
Sora.extend(Sora.Label.prototype, {
	appendText: function (text) {
		this.text += text;
	},
	clearText: function () {
		this.text = '';
	},
	update: function () {
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.context.clearRect(this.width, this.height);
		this.context.font = this.font;
		this.context.textAlign = this.align;
		this.context.textBaseline = 'bottom';
		this.context.fillStyle = '#FFFFFF';
		function getTextMetrics(context, text) {
			var tm = context.measureText(text);
			if (tm.height === undefined) {
				if (tm.fontBoundingBoxAscent === undefined) {
					// DOM trick to get text's height
					var div = document.createElement('div');
					div.style.font = context.font;
					div.innerHTML = text;
					document.body.appendChild(div);
					tm.height = parseInt(getComputedStyle(div).height);
					document.body.removeChild(div);
				}
				else tm.height = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
			}
			return tm;
		}
		var i = 0, y = this.height;
		while (i < this.text.length && y > 0) {
			var str, c, l = 0;
			while (i + l < this.text.length) {
				str = text.substr(i, ++l);
				c = str.slice(-1);
				if (c === '\r' || c === '\n' || getTextMetrics(this.context, str).width > this.width) {
					str = text.substr(i, --l);
					if (c === '\r' || c === '\n') ++l;
					break;
				}
			}
			y -= getTextMetrics(this.context, str).height;
			this.context.fillText(str, 0, y, this.width);
			i += l;
		}
		this.texture.needsUpdate = true;
		Sora.Layer.prototype.update.call(this);
	},
	name: 'label',
	params: function () {
		return Sora.Layer.prototype.params.call(this) +
		Sora.stringify(this.text, 'text') +
		Sora.stringify(this.font, 'font') +
		Sora.stringify(this.align, 'align') +
		Sora.stringify(this.start, 'start');
	}
});
Sora.Button = function (params) {
	params = params || {};
	params.src = params.src || params.normalSrc;
	Sora.Layer.call(this, params);
	this.normalTexture = this.texture;
	this.disabledTexture = params.disabledSrc ? new Sora.Texture(params.disabledSrc) : null;
	this.selectedTexture = params.selectedSrc ? new Sora.Texture(params.selectedSrc) : null;
	this.maskedTexture = params.maskedSrc ? new Sora.Texture(params.maskedSrc) : null;
	this.disabled = params.disabled ? Sora.parseBool(params.disabled) : false;
	this.selected = params.selected ? Sora.parseBool(params.selected) : false;
	this.masked = params.masked ? Sora.parseBool(params.masked) : false;
	this.callback = params.callback;
};
Sora.Button.prototype = Object.create(Sora.Layer.prototype);
Sora.extend(Sora.Button.prototype, {
	update: function () {
		this.texture = this.normalTexture;
		if (this.disabled) this.texture = this.disabledTexture;
		else if (this.selected) this.texture = this.selectedTexture;
		else if (this.masked) this.texture = this.maskedTexture;
		Sora.Layer.prototype.update.call(this);
	},
	dealloc: function () {
		this.texture = null;
		if (this.normalTexture) this.normalTexture.dealloc();
		if (this.disabledTexture) this.disabledTexture.dealloc();
		if (this.selectedTexture) this.selectedTexture.dealloc();
		if (this.maskedTexture) this.maskedTexture.dealloc();
		Sora.Layer.prototype.dealloc.call(this);
	},
	name: 'button',
	params: function () {
		this.texture = null;
		return Sora.Layer.prototype.params.call(this) +
		Sora.stringify(this.normalTexture ? this.normalTexture.str() : null, 'normalSrc') +
		Sora.stringify(this.disabledTexture ? this.disabledTexture.str() : null, 'disabledSrc') +
		Sora.stringify(this.selectedTexture ? this.selectedTexture.str() : null, 'selectedSrc') +
		Sora.stringify(this.maskedTexture ? this.maskedTexture.str() : null, 'maskedSrc') +
		Sora.stringify(this.disabled, 'disabled') +
		Sora.stringify(this.selected, 'selected') +
		Sora.stringify(this.masked, 'masked') +
		Sora.stringify(this.callback, 'callback');
	}
});
Sora.Renderer = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var canvas = params.canvas;
	if (!canvas) return ;
	var gl = canvas.getContext('experimental-webgl');
	if (!gl) {
		alert('Couldn\'t get webgl context');
		return ;
	}
	gl.clearColor(0, 0, 0, 1);
	//gl.enable(gl.DEPTH_TEST);
	//gl.clearDepth(1);
	//gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	function createShader(src, type) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}
	var vs = createShader([
	'attribute vec2 vertex;',
	'attribute vec2 texA;',
	'varying vec2 texV;',
	'uniform mat4 mvMat;',
	'void main(void) {',
	'gl_Position = mvMat * vec4(vertex, 0.0, 1.0);',
	'texV = texA;',
	'}'
	].join('\n'), gl.VERTEX_SHADER);
	var fs = createShader([
	'precision mediump float;',
	'varying vec2 texV;',
	'uniform float alpha;',
	'uniform bool enabled;',
	'uniform float progress;',
	'uniform float offset;',
	'uniform sampler2D mask;',
	'uniform sampler2D tex;',
	'void main(void) {',
	'vec4 color = vec4(1.0, 1.0, 1.0, alpha) * texture2D(tex, texV);',
	'if (enabled) {',
	'float threshold = texture2D(mask, texV).x;',
	'if (offset == 0.0)',
	'if (threshold <= progress) gl_FragColor = vec4(color.xyz, 0.0);',
	'else gl_FragColor = color;',
	'else gl_FragColor = vec4(color.xyz, color.w * clamp((threshold - progress) / offset, 0.0, 1.0));',
	'}',
	'else gl_FragColor = color;',
	'}'
	].join('\n'), gl.FRAGMENT_SHADER);
	var prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		alert('Couldn\'t initialize shader program');
		return ;
	}
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	gl.useProgram(prog);
	Sora.map(['vertex', 'texA'], function (key) {
		gl.enableVertexAttribArray(prog[key] = gl.getAttribLocation(prog, key));
	});
	Sora.map(['mvMat', 'alpha', 'enabled', 'progress', 'offset', 'mask', 'tex'], function (key){
		prog[key] = gl.getUniformLocation(prog, key);
	});
	gl.activeTexture(gl.TEXTURE0);
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(prog.mask, 0);
	gl.uniform1i(prog.tex, 1);
	var verBuf = gl.createBuffer(), texBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Sora.GL_ARRAY([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
	function setAlpha(f) {
		gl.uniform1f(prog.alpha, Math.max(0, Math.min(1, f)));
	}
	function setEnabled(b) {
		gl.uniform1i(prog.enabled, b ? 1 : 0);
	}
	function setProgress(f) {
		gl.uniform1f(prog.progress, Math.max(0, Math.min(1, f)));
	}
	function setOffset(f) {
		gl.uniform1f(prog.offset, Math.max(0, Math.min(1, f)));
	}
	setAlpha(1);
	setEnabled(false);
	setProgress(0);
	setOffset(0);
	function onTextureDealloc(event) {
		var texture = event.target;
		texture.removeEventListener('dealloc', onTextureDealloc);
		gl.deleteTexture(texture.texture);
		texture.texture = null;
	}
	function updateTexture(texture, slot) {
		if (!texture instanceof Sora.Texture || slot === undefined) return ;
		if (texture.needsUpdate && !texture.texture) {
			texture.texture = gl.createTexture();
			texture.addEventListener('dealloc', onTextureDealloc);
		}
		gl.activeTexture(gl.TEXTURE0 + slot);
		gl.bindTexture(gl.TEXTURE_2D, texture.texture);
		if (texture.needsUpdate) {
			texture.needsUpdate = false;
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
			if (texture.image)
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
			else
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
	}
	function bindMask(texture) {
		updateTexture(texture, 0);
	}
	function bindTexture(texture) {
		updateTexture(texture, 1);
	}
	var matrices = [mat4.create()];
	function pushMatrix() {
		matrices.push(mat4.clone(matrices[matrices.length - 1]));
	}
	function popMatrix() {
		if (matrices.length > 1) {
			matrices.pop();
			gl.uniformMatrix4fv(prog.mvMat, false, matrices[matrices.length - 1]);
		}
	}
	function loadIdentity() {
		var m = matrices[matrices.length - 1];
		mat4.identity(m);
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	function translate(x, y, z) {
		var m = matrices[matrices.length - 1];
		mat4.translate(m, m, vec3.fromValues(x || 0, y || 0, z || 0));
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	function rotate(x, y, z) {
		var m = matrices[matrices.length - 1];
		if (x) mat4.rotateX(m, m, x);
		if (y) mat4.rotateY(m, m, y);
		if (z) mat4.rotateZ(m, m, z);
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	function scale(x, y, z) {
		var m = matrices[matrices.length - 1];
		mat4.scale(m, m, vec3.fromValues(x || 1, y || 1, z || 1));
		gl.uniformMatrix4fv(prog.mvMat, false, m);
	}
	loadIdentity();
	function draw(layer) {
		pushMatrix();
		var tx = layer.width * layer.anchorX, ty = layer.height * layer.anchorY;
		translate(tx + layer.x, ty + layer.y);
		rotate(0, 0, layer.rotation);
		scale(layer.scaleX, layer.scaleY);
		translate(-tx, -ty);
		var opacity = layer.opacity;
		if (layer.superlayer) layer.opacity = layer.opacity * layer.superlayer.opacity;
		var i = 0, l = layer.sublayers.length;
		for (; i < l ; ++i) {
			if (layer.sublayers[i].order >= 0) break;
			draw(layer.sublayers[i]);
		}
		if (layer.texture) {
			setAlpha(layer.opacity);
			/*
			// for transition
			if (layer.mask) {
				setEnabled(true);
				setProgress(layer.progress);
				setOffset(layer.offset);
				bindMask(layer.mask);
			}
			*/
			bindTexture(layer.texture);
			gl.bindBuffer(gl.ARRAY_BUFFER, verBuf);
			var w = layer.width, h = layer.height;
			gl.bufferData(gl.ARRAY_BUFFER, new Sora.GL_ARRAY([0, 0, w, 0, w, h, 0, h]), gl.STREAM_DRAW);
			gl.vertexAttribPointer(prog.vertex, 2, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
			gl.vertexAttribPointer(prog.texA, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
		}
		for (; i < l ; ++i) draw(layer.sublayers[i]);
		layer.opacity = opacity;
		popMatrix();
	}
	this.render = function (layer) {
		if (!layer) return ;
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT/* | gl.DEPTH_BUFFER_BIT*/);
		pushMatrix();
		translate(-1, -1);
		scale(2 / layer.width, 2 / layer.height);
		draw(layer);
		popMatrix();
	};
	var scope = this;
	this.snapshot = function (layer) {
		if (!layer) return null;
		var w = Math.ceil(layer.width), h = Math.ceil(layer.height);
		var fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		//var rb = gl.createRenderbuffer();
		//gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
		//gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
		//gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		var texture = new Sora.Texture();
		texture.width = w, texture.height = h;
		texture.needsUpdate = true;
		texture.flipY = false;
		bindTexture(texture);
		//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
		scope.render(layer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(fb);
		//gl.deleteRenderbuffer(rb);
		return texture;
	};
};
Sora.Renderer.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.Controls = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var disabled = false;
	function onMouseDown(event) {
		event.preventDefault();
		if (disabled) return ;
		
	}
	function onMouseUp(event) {
		event.preventDefault();
		if (disabled) return ;
		
	}
	function onMouseMove(event) {
		event.preventDefault();
		if (disabled) return ;
		
	}
	function onKeyDown(event) {
		event.preventDefault();
		if (disabled) return ;
		
	}
	function onKeyUp(event) {
		event.preventDefault();
		if (disabled) return ;
		
	}
	this.enable = function () {
		disabled = false;
	};
	this.disable = function () {
		disabled = true;
	};
	var canvas = params.canvas;
	canvas.addEventListener('mousedown', onMouseDown, false);
	canvas.addEventListener('mouseup', onMouseUp, false);
	canvas.addEventListener('mousemove', onMouseMove, false);
	// issue : use keypress in Opera
	canvas.addEventListener('keydown', onKeyDown, false);
	canvas.addEventListener('keyup', onKeyUp, false);
	var actions = [];
	this.start = function (action) {
		if (action === undefined) return ;
		actions.push(action);
	};
	this.stop = function (params) {
		actions = Sora.filter(actions, function (action) {
			if ((params.action === undefined || action === params.action) &&
				(params.target === undefined || action.target === params.target)) {
				if (action.needsFinish)
					action.step(Math.floor(action.repeat * action.duration) - action.elapsed + 1);
				return false;
			}
			return true;
		});
	};
	this.update = function (dt) {
		actions.sort(function (a, b) { return a.remain() - b.remain(); });
		actions = Sora.filter(actions, function (action) {
			action.step(dt);
			return action.done();
		});
	};
	this.dealloc = function () {
		canvas.removeEventListener('mousedown', onMouseDown, false);
		canvas.removeEventListener('mouseup', onMouseUp, false);
		canvas.removeEventListener('mousemove', onMouseMove, false);
		canvas.removeEventListener('keydown', onKeyDown, false);
		canvas.removeEventListener('keyup', onKeyUp, false);
	};
	this.str = function () {
		return Sora.map(actions, function (action) {
			return action.str();
		}).join('');
	};
};
Sora.Controls.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.Player = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var audios = [], scope = this;
	this.play = function (audio) {
		if (audio === undefined) return ;
		if (audio.single) scope.stop(audio);
		audios.push(audio);
		audio.play();
	};
	this.stop = function (params) {
		audios = Sora.filter(audios, function (audio) {
			if (params.id === undefined || params.id === audio.id) {
				audio.stop();
				return false;
			}
			return true;
		});
	};
	this.str = function () {
		return Sora.map(audios, function (audio) {
			return audio.str();
		}).join('');
	};
};
Sora.Player.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.Scripter = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	var renderer = params.renderer;
	var controls = params.controls;
	var player = params.player;
	var width = params.width;
	var height = params.height;
	var foreLayer = new Sora.Layer({width: width, height: height});
	var backLayer = new Sora.Layer({width: width, height: height});
	var transLayer, scope = this;
	function currLayer() {
		return transLayer || foreLayer;
	}
	function onButtonMouseUp(event) {
		var button = event.target;
		if (button.callback)
			scope.execute({str: button.callback});
	}
	function onButtonDealloc(event) {
		var button = event.target;
		button.removeEventListener('mouseup', onButtonMouseUp);
		button.removeEventListener('dealloc', onButtonDealloc);
	}
	var script = {}, tags, vars = {}, cmds = {
		'eval': function (params) {
			Sora.foreach(params, function (prop) {
				vars[prop] = new Function('{return ' + Sora.map(params[prop].match(/[\+\-\*\/\(\)\s]*[\.0-9a-z_]+/ig), function (exp) {
					var arr = /([\+\-\*\/\(\)\s]*)([\.0-9a-z_]+)/i.exec(exp);
					return Sora.trim(arr[1]) + (/[\.0-9]/.test(arr[2][0]) ? arr[2] : 'this.' + arr[2]);
				}).join('') + ';}').call(vars);
			});
			return false;
		},
		'goto': function (params) {
			if (params.src) {
				scope.load(params);
				return true;
			}
			else if (params.id && tags[params.id] !== undefined) {
				script.loc = tags[params.id];
				scope.execute(script);
				return true;
			}
			else if (params.loc) {
				script.loc = parseInt(params.loc);
				scope.execute(script);
				return true;
			}
			return false;
		},
		'if': function (params) {
			cmds.eval({'': params.cond});
			if (vars['']) {
				if (params.then)
					return scope.execute({str: params.then});
			}
			else {
				if (params.else)
					return scope.execute({str: params.else});
			}
			return false;
		},
		'trans': function (params) {
			
			return true;
		},
		'action': function (params) {
			controls.start(new Sora.Action(params));
			return false;
		},
		'layer': function (params) {
			var layer = new Sora.Layer(params);
			
			return false;
		},
		'label': function (params) {
			var label = new Sora.Label(params);
			
			return false;
		},
		'button': function (params) {
			var button = new Sora.Button(params);
			button.addEventListener('dealloc', onButtonDealloc);
			button.addEventListener('mouseup', onButtonMouseUp);
			
			return false;
		},
		'remove': function (params) {
			
			return false;
		},
		'audio': function (params) {
			
			return false;
		},
		'video': function (params) {
			console.log('Video not support');
			return false;
		}
	};
	function isWhitespace(c) {
		return c === ' ' || c === '	' || c === '\n' || c === '\r';
	}
	function parseParams(str) {
		var params = {}, loc = -1;
		
		return params;
	}
	function mergeParams(dst, src, force) {
		Sora.foreach(src, function (prop) {
			if (force || dst[prop] === undefined)
				dst[prop] = src[prop];
		});
		return dst;
	}
	function parseRef(dst, src) {
		Sora.foreach(dst, function (prop) {
			if (dst[prop][0] === '$' && src[dst[prop].slice(1)] !== undefined)
				dst[prop] = src[dst[prop].slice(1)];
		});
		return dst;
	}
	function nextLoc(script, cmp) {
		var test;
		switch (typeof cmp) {
		case 'string':
			test = function (c) { return cmp === c; };
			break;
		case 'function':
			test = cmp;
			break;
		default:
			if (cmp instanceof RegExp)
				test = function (c) { return cmp.test(c); };
			break;
		}
		if (test) {
			for (var i = script.loc, l = script.str.length ; i < l ; ++i) {
				var c = script.str.charAt(i);
				if (c === '\\')
					++i;
				else if (test(c))
					return i;
			}
		}
		return -1;
	}
	this.execute = function (script, params) {
		if (script.loc === undefined) script.loc = -1;
		params = params || vars;
		
		return false;
	};
	this.update = function (dt) {
		controls.update(dt);
		renderer.render(foreLayer);
	};
	this.save = function (params) {
		var str;
		
		str += '[goto ' +
		Sora.stringify(script.src, 'src') +
		Sora.stringify(script.loc, 'loc') +
		']';
		
	};
	this.load = function (params) {
		if (params.src === undefined) return ;
		controls.disable();
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				controls.enable();
				script.src = params.src;
				script.str = xmlhttp.responseText;
				// parse tags
				cmds.goto({id: params.id, loc: params.loc});
			}
		};
		xmlhttp.open('GET', params.src, true);
		xmlhttp.send();
	};
};
Sora.Scripter.prototype = Object.create(Sora.EventDispatcher.prototype);
Sora.System = function (params) {
	params = params || {};
	Sora.EventDispatcher.call(this);
	this.canvas = params.canvas || document.createElement('canvas');
	var width = params.width || this.canvas.width;
	var height = params.height || this.canvas.height;
	this.canvas.width = width;
	this.canvas.height = height;
	var renderer = new Sora.Renderer({canvas: this.canvas});
	var controls = new Sora.Controls({canvas: this.canvas});
	var player = new Sora.Player();
	var scripter = new Sora.Scripter({renderer: renderer, controls: controls, player: player, width: width, height: height});
	scripter.load({src: params.src, id: params.id});
	var lastTime = 0, animFrame;
	function animate(currTime) {
		animFrame = self.requestAnimationFrame(animate);
		var dt = Math.max(1, Math.min(33, currTime - lastTime));
		lastTime = currTime;
		scripter.update(dt);
	}
	animFrame = self.requestAnimationFrame(animate);
	this.dealloc = function () {
		if (animFrame) {
			self.cancelAnimationFrame(animFrame);
			animFrame = null;
		}
		scripter.dealloc();
		player.dealloc();
		controls.dealloc();
		renderer.dealloc();
	};
};
Sora.System.prototype = Object.create(Sora.EventDispatcher.prototype);
