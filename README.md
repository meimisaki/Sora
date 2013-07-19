Sora
====

#Introduction#

##cn##

一个简易美少女游戏引擎 （使用<b>webgl</b>）

<del>期末考试后开始更新</del>

开始！。。。

之后会增加<b>视频</b>的支持

##en##

A simple galgame engine (using <b>webgl</b>)

<del>I will start to update after my term final exam</del>

Start!...

Support <b>video</b> later

##ja##

たったの簡単なガルゲーエンジン　（<b>webgl</b>を使って）

<del>期末試験の後で更新します</del>

スタート！。。。

後で<b>ビデオ</b>を支援します

#TODOS#

>**Database**

>**Encrypt**

#Usage#

##script##

###brackets []###

A pair of brackets [] represents a **command**

The first string indicates the name of **method**

Others are **arguments**

Each argument forms as **'key = value'**

Key and value should be splited by a equal sign

They are always treated as strings

Value could be wrapped in quotes, but key doesn't

Value begins with **'$'** indicates a reference of other value of key

    [method key1 = value1 key2 = value2 ...]

###braces {}###

A pair of braces {} represents a **method definition**

The first string indicates the name of **method**

Others are **commands** defined above

    {method
        [command1 arguments1]
        [command2 arguments2]
        ...}
    [method arguments]

###builtin methods###

**js**

`[js body = "some javascript code"]`

<i>be careful when using this method</i>

**set**

`[set someKey = someValue ...]`

**layer, label, button & remove**

`[layer url = anImageSrc origin = aVec2 size = aVec2 id = aString]`

`[remove id = aString layer = back]`

**trans**

`[trans url = anImageSrc duration = anInteger offset = aFloat]`

**move, tint, rotate & scale**

`[move layer = fore id = bg origin = 'aFloat, aFloat' duration = anInteger]`

**bgm, se, stopbgm, stopse**

`[bgm url = anAudioSrc]`

##Specify##

###types & functions###

**vec2, vec3 & vec4**

`create` `clone` `copy` `set`

`add` `sub` `mul` `div` `str`

`fromValues` `fromStr`

**mat4**

`create` `clone` `copy`

`identity` `transpose` `invert` `mul` `str`

`translate` `rotateXYZ` `scale`

`perspective` `ortho` `lookAt`

**Layer, Label & Button**

`addSublayer` `removeFromSuperlayer` `getLayerById`

`draw` `visit` `snapshot` `dealloc`

`mouseDown` `mouseUp`

`mouseEntered` `mouseExited`

`rightMouseDown` `rightMouseUp`

**Action, ValueAction, CallAction**

`start` `stop` `update` `step` `finished` `remain`

#Thanks#

###glMatrix.js###

Sora/glMatrix.js forked from glMatrix.js
