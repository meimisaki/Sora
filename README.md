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

>Sora-Script below shows how to add a layer and use a defined-method 'fadein' to animate it

	{fadein
		[action duration=500 opacity='0->1' timing='linear']
		[action duration=1000 y='-32->0' timing='easeout']}
	[layer src='bg.png' id='bg' width=1024 height=640]
	[layer src='sora.png' id='sora' super='bg']
	[fadein target='sora']

###script###

####parentheses ()####

A pair of parentheses represent a **tag**

The only string inside parentheses indicates the tag's **id**

	(id)

####brackets []####

A pair of brackets represent a **command**

The first string indicates the name of **method**, others are **arguments**

Each argument forms as **'key = value'**, key & value is separated by a equal sign

Key & value are **ALWAYS** treated as **strings**, so they could be wrapped in quotes('' & "")

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

**goto**

	[goto
	@optional
		id	=	tagId		// after 'goto', it won't return to current script
		loc	=	int			// default: -1, ignore if id exist
		src	=	scriptSrc]	// default: current script, if exist, load script using ajax

**if**

	[if
	@required
		cond	=	expression	// similar to 'eval'
	@optional
		then	=	script		// default: null
		else	=	script]		// default: null

**wait & next**

	[wait]	// break current execution
	[next]	// continue to execute current script

**trans**

	[trans
	@optinal
		src			=	imageSrc	// default: fade effect
		duration	=	int			// default: 1000 ms		range: [1, +inf)
		offset		=	float]		// default: 0			range: [0, 1]

**action**

	[action
	@required
		target		=	layerId
	@optional
		duration	=	int				// default: 1000 ms		range: [1, +inf)
		elapsed		=	int				// default: 0 ms		range: [0, duration * repeat]
		repeat		=	float			// default: 1			range: (0, +inf)
		reverse		=	bool			// default: false
		autorev		=	bool			// default: false
		needsFinish	=	bool			// default: true
		timing		=	timingFunc		// default: linear		options: ['linear', 'easein', 'easeout', 'easeinout']
		property1	=	float			// set property1 of target to the float in the duration
		...
		propertyN	=	float->float]	// set propertyN of target from first float to second float in the duration

**layer, label, button & remove**

	[layer
	@optional
		x			=	float		// default: 0
		y			=	float		// default: 0
		width		=	float		// default: image.width		||	0
		height		=	float		// default: image.height	||	0
		src			=	imageSrc	// default: null
		anchorX		=	float		// default: 0	range: [0, 1]
		anchorY		=	float		// default: 0	range: [0, 1]
		scaleX		=	float		// default: 1	range: (-inf, 0) U (0, +inf)
		scaleY		=	float		// default: 1	range: (-inf, 0) U (0, +inf)
		rotation	=	float		// default: 0	range: (-inf, +inf)
		opacity		=	float		// default: 1	range: [0, 1]
		order		=	int			// default: 0	range: (-inf, +inf)
		id			=	layerId		// default: ''
		super		=	layerId]	// default: current fore layer
	[label	// derived from layer
	@optional
		text	=	someText		// default: ''
		font	=	fontNameAndSize	// default: browser's default font
		align	=	textAlignment	// default: left	options: ['left', 'right', 'center']
		start	=	float]			// default: 1		range: [0, 1]
	[button // derived from layer
	@optional
		normalSrc	=	imageSrc	// default: null
		disabledSrc	=	imageSrc	// default: null
		selectedSrc	=	imageSrc	// default: null
		maskedSrc	=	imageSrc	// default: null
		disabled	=	bool 		// default: false
		callback	=	script]		// default: null
	[remove
	@optional
		id		=	layerId		// default: null
		type	=	layerType]	// default: null

**audio**

	[audio
	@required
		src			=	audioSrc
	@optional
		loop		=	bool		// default: false
		volume		=	float		// default: 1		range: [0, 1]
		currentTime	=	float		// default: 0 s		range: [0, audio.duration]
		id			=	audioId		// default: ''
		single		=	bool]		// default: false

##Thanks##

https://github.com/toji/gl-matrix
