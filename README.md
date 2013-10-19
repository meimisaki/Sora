Sora
====

##Introduction##

###en###

A simple galgame engine (using <b>webgl</b>)

###cn###

一个简易美少女游戏引擎 （使用<b>webgl</b>）

###ja###

たったの簡単なガルゲーエンジン　（<b>webgl</b>を使って）

##Usage##

###example###

	<script type="text/javascript" src="glMatrix.min.js"></script>
	<script type="text/javascript" src="Sora.js"></script>
	<script type="text/javascript">
	self.onload = function () {
		document.body.appendChild(new Sora.System({width: 1024, height: 640}).canvas);
	};
	</script>

	[remove type='layer']
	[layer src='bg.png' id='bg' width=1024 height=640]
	[layer src='sora.png' id='sora' super='bg']
	[action target='sora' duration=500 opacity='0->1' timing='linear']
	[action target='sora' duration=1000 x=512 y=320 timing='easein']

###script###

####brackets []####

A pair of brackets represent a **command**

The first string indicates the name of **method**, others are **arguments**

Each argument forms as **'key = value'**, key & value is separated by a equal sign

Key & value are **ALWAYS** treated as **strings**, and value might be wrapped in quotes, but key doesn't

	[method key1=value1 key2=value2 ...]

####braces {}####

A pair of braces represent a **method definition**

The first string indicates the name of **method**, others are **commands** defined above

	{method
		[command1 arguments1]
		[command2 arguments2]
		...}

####builtin methods####

**layer, label, button & remove**

##Thanks##

https://github.com/toji/gl-matrix
