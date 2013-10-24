Sora
====

##Introduction##

###en###

A simple galgame engine (using <b>webgl</b>)

###cn###

一个简易美少女游戏引擎 （使用<b>webgl</b>）

###ja###

たったの簡単なガルゲーエンジンです　（<b>webgl</b>を使って）

##Usage##

###example###

>HTML code below shows how to use Sora.js in web page

	<script type="text/javascript" src="glMatrix.min.js"></script>
	<script type="text/javascript" src="Sora.js"></script>
	<script type="text/javascript">
	self.onload = function () {
		document.body.appendChild(new Sora.System({width: 1024, height: 640}).canvas);
	};
	</script>

>Sora-Script below shows how to add layer with fade effect and move from (0, 0) to (x, y)

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

Key & value are **ALWAYS** treated as **strings**, and value might be wrapped in quotes('' & ""), but key doesn't

	[method key1=value1 key2=value2 ...]

####braces {}####

A pair of braces represent a **method definition**

The first string indicates the name of **method**, others are **commands** defined above

	{method
		[command1 arguments1]
		[command2 arguments2]
		...}

Recursion is possible, but not recommended

####builtin methods####

**eval**

	[eval
	@optional
		varId1	=	'(a + b) * c / d - e'	// '+-*/()' operators are available, variable such as 'a' should be already defined
		varId2	=	'x - (1 + 2)'			// numbers are also acceptable
		...									// order of expressions' evaluation is NOT guaranteed, please use multiple 'eval' to insure the topological order of them
		varIdN	=	'']						// empty expression will delete the variable

**trans**

	[trans
	@optinal
		src			=	imageSrc	// default: fade effect
		duration	=	int			// default: 1000 ms
		offset		=	float]		// default: 0

**action**

	[action
	@required
		target		=	layerId
	@optional
		duration	=	int				// default: 1000 ms
		elapsed		=	int				// default: 0 ms
		repeat		=	float			// default: 1
		reverse		=	bool			// default: false
		autorev		=	bool			// default: false
		needsFinish	=	bool			// default: true
		timing		=	timingFunc		// default: linear
		property1	=	float			// set property1 of target to the float in the duration
		...
		propertyN	=	float->float]	// set propertyN of target from first float to second float in the duration

**layer, label, button & remove**

	[layer
	@optional
		x			=	float		// default: 0
		y			=	float		// default: 0
		width		=	float		// default: texture.width	||	0
		height		=	float		// default: texture.height	||	0
		src			=	imageSrc	// default: null
		anchorX		=	float		// default: 0
		anchorY		=	float		// default: 0
		scaleX		=	float		// default: 1
		scaleY		=	float		// default: 1
		rotation	=	float		// default: 0
		opacity		=	float		// default: 1
		order		=	int			// default: 0
		id			=	layerId		// default: ''
		super		=	layerId]	// default: current fore layer
	[label	// derived from layer
	@optional
		text	=	someText		// default: ''
		font	=	fontNameAndSize	// default: browser's default font
		align	=	textAlignment	// default: left
		start	=	float]			// default: 1
	[button // derived from layer
	@optional
		normalSrc	=	imageSrc	// default: null
		disabledSrc	=	imageSrc	// default: null
		selectedSrc	=	imageSrc	// default: null
		maskedSrc	=	imageSrc	// default: null
		disabled	=	bool 		// default: false
		callback	=	methodName]	// default: null
	[remove
	@optional
		id		=	layerId		// default: null
		type	=	layerType]	// default: null

**audio**

##Thanks##

https://github.com/toji/gl-matrix
