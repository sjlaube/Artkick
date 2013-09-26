require({cache:{
'dijit/main':function(){
define([
	"dojo/_base/kernel"
], function(dojo){
	// module:
	//		dijit/main

/*=====
return {
	// summary:
	//		The dijit package main module.
	//		Deprecated.   Users should access individual modules (ex: dijit/registry) directly.
};
=====*/

	return dojo.dijit;
});

},
'dojox/main':function(){
define(["dojo/_base/kernel"], function(dojo) {
	// module:
	//		dojox/main

	/*=====
	return {
		// summary:
		//		The dojox package main module; dojox package is somewhat unusual in that the main module currently just provides an empty object.
		//		Apps should require modules from the dojox packages directly, rather than loading this module.
	};
	=====*/

	return dojo.dojox;
});
},
'dojo/require':function(){
define(["./_base/loader"], function(loader){
	return {
		dynamic:0,
		normalize:function(id){return id;},
		load:loader.require
	};
});

},
'dojox/fx/flip':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/html",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/_base/connect",
	"dojo/_base/Color",
	"dojo/_base/sniff",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/_base/fx",
	"dojo/fx",
	"./_base"
], function(kernel, htmlUtil, dom, domConstruct, domGeom, connectUtil, Color, has, lang, winUtil, baseFx, coreFx, fxExt) {
//kernel,lang->(sniff,array,has),sniff,unload,window

	kernel.experimental("dojox.fx.flip");
	// because ShrinkSafe will eat this up:
	var borderConst = "border",
		widthConst = "Width",
		heightConst = "Height",
		topConst = "Top",
		rightConst = "Right",
		leftConst = "Left",
		bottomConst = "Bottom"
	;

	fxExt.flip = function(/*Object*/ args){
		// summary:
		//		Animate a node flipping following a specific direction
		// description:
		//		Returns an animation that will flip the
		//		node around a central axis:
		//
		//		if args.dir is "left" or "right" --> y axis
		//
		//		if args.dir is "top" or "bottom" --> x axis
		//
		//		This effect is obtained using a border distortion applied to a helper node.
		//
		//		The user can specify three background colors for the helper node:
		//
		//		- darkColor: the darkest color reached during the animation
		//		- lightColor: the brightest color
		//		- endColor: the final backgroundColor for the node
		//
		//		Other arguments:
		//
		//		- depth: Float
		//			 - 0 <= depth <= 1 overrides the computed "depth"
		//			- (0: min distortion, 1: max distortion)
		//
		//		- whichAnim: String
		//			- "first"			 : the first half animation
		//			- "last"			 : the second one
		//			- "both" (default) : both
		//
		//		- axis: String
		//			- "center" (default)	  : the node is flipped around his center
		//			- "shortside"			  : the node is flipped around his "short" (in perspective) side
		//			- "longside"			  : the node is flipped around his "long" (in perspective) side
		//			- "cube"				  : the node flips around the central axis of the cube
		//
		//		- shift: Integer:
		//			node translation, perpendicular to the rotation axis
		//
		// example:
		//	|	var anim = dojox.fx.flip({
		//	|		node: dojo.byId("nodeId"),
		//	|		dir: "top",
		//	|		darkColor: "#555555",
		//	|		lightColor: "#dddddd",
		//	|		endColor: "#666666",
		//	|		depth: .5,
		//	|		shift: 50,
		//	|		duration:300
		//	|	  });

		var helperNode = domConstruct.create("div"),
			node = args.node = dom.byId(args.node),
			s = node.style,
			dims = null,
			hs = null,
			pn = null,
			lightColor = args.lightColor || "#dddddd",
			darkColor = args.darkColor || "#555555",
			bgColor = htmlUtil.style(node, "backgroundColor"),
			endColor = args.endColor || bgColor,
			staticProps = {},
			anims = [],
			duration = args.duration ? args.duration / 2 : 250,
			dir = args.dir || "left",
			pConst = .9,
			transparentColor = "transparent",
			whichAnim = args.whichAnim,
			axis = args.axis || "center",
			depth = args.depth
		;
		// IE6 workaround: IE6 doesn't support transparent borders
		var convertColor = function(color){
			return ((new Color(color)).toHex() === "#000000") ? "#000001" : color;
		};

		if(has("ie") < 7){
			endColor = convertColor(endColor);
			lightColor = convertColor(lightColor);
			darkColor = convertColor(darkColor);
			bgColor = convertColor(bgColor);
			transparentColor = "black";
			helperNode.style.filter = "chroma(color='#000000')";
		}

		var init = (function(n){
			return function(){
				var ret = htmlUtil.coords(n, true);
				dims = {
					top: ret.y,
					left: ret.x,
					width: ret.w,
					height: ret.h
				};
			}
		})(node);
		init();
		// helperNode initialization
		hs = {
			position: "absolute",
			top: dims["top"] + "px",
			left: dims["left"] + "px",
			height: "0",
			width: "0",
			zIndex: args.zIndex || (s.zIndex || 0),
			border: "0 solid " + transparentColor,
			fontSize: "0",
			visibility: "hidden"
		};
		var props = [ {},
			{
				top: dims["top"],
				left: dims["left"]
			}
		];
		var dynProperties = {
			left: [leftConst, rightConst, topConst, bottomConst, widthConst, heightConst, "end" + heightConst + "Min", leftConst, "end" + heightConst + "Max"],
			right: [rightConst, leftConst, topConst, bottomConst, widthConst, heightConst, "end" + heightConst + "Min", leftConst, "end" + heightConst + "Max"],
			top: [topConst, bottomConst, leftConst, rightConst, heightConst, widthConst, "end" + widthConst + "Min", topConst, "end" + widthConst + "Max"],
			bottom: [bottomConst, topConst, leftConst, rightConst, heightConst, widthConst, "end" + widthConst + "Min", topConst, "end" + widthConst + "Max"]
		};
		// property names
		pn = dynProperties[dir];

		// .4 <= pConst <= .9
		if(typeof depth != "undefined"){
			depth = Math.max(0, Math.min(1, depth)) / 2;
			pConst = .4 + (.5 - depth);
		}else{
			pConst = Math.min(.9, Math.max(.4, dims[pn[5].toLowerCase()] / dims[pn[4].toLowerCase()]));
		}
		var p0 = props[0];
		for(var i = 4; i < 6; i++){
			if(axis == "center" || axis == "cube"){ // find a better name for "cube"
				dims["end" + pn[i] + "Min"] = dims[pn[i].toLowerCase()] * pConst;
				dims["end" + pn[i] + "Max"] = dims[pn[i].toLowerCase()] / pConst;
			}else if(axis == "shortside"){
				dims["end" + pn[i] + "Min"] = dims[pn[i].toLowerCase()];
				dims["end" + pn[i] + "Max"] = dims[pn[i].toLowerCase()] / pConst;
			}else if(axis == "longside"){
				dims["end" + pn[i] + "Min"] = dims[pn[i].toLowerCase()] * pConst;
				dims["end" + pn[i] + "Max"] = dims[pn[i].toLowerCase()];
			}
		}
		if(axis == "center"){
			p0[pn[2].toLowerCase()] = dims[pn[2].toLowerCase()] - (dims[pn[8]] - dims[pn[6]]) / 4;
		}else if(axis == "shortside"){
			p0[pn[2].toLowerCase()] = dims[pn[2].toLowerCase()] - (dims[pn[8]] - dims[pn[6]]) / 2;
		}

		staticProps[pn[5].toLowerCase()] = dims[pn[5].toLowerCase()] + "px";
		staticProps[pn[4].toLowerCase()] = "0";
		staticProps[borderConst + pn[1] + widthConst] = dims[pn[4].toLowerCase()] + "px";
		staticProps[borderConst + pn[1] + "Color"] = bgColor;

		p0[borderConst + pn[1] + widthConst] = 0;
		p0[borderConst + pn[1] + "Color"] = darkColor;
		p0[borderConst + pn[2] + widthConst] = p0[borderConst + pn[3] + widthConst] = axis != "cube"
			? (dims["end" + pn[5] +	 "Max"] - dims["end" + pn[5] + "Min"]) / 2
			: dims[pn[6]] / 2
		;
		p0[pn[7].toLowerCase()] = dims[pn[7].toLowerCase()] + dims[pn[4].toLowerCase()] / 2 + (args.shift || 0);
		p0[pn[5].toLowerCase()] = dims[pn[6]];

		var p1 = props[1];
		p1[borderConst + pn[0] + "Color"] = { start: lightColor, end: endColor };
		p1[borderConst + pn[0] + widthConst] = dims[pn[4].toLowerCase()];
		p1[borderConst + pn[2] + widthConst] = 0;
		p1[borderConst + pn[3] + widthConst] = 0;
		p1[pn[5].toLowerCase()] = { start: dims[pn[6]], end: dims[pn[5].toLowerCase()] };

		lang.mixin(hs, staticProps);
		htmlUtil.style(helperNode, hs);
		winUtil.body().appendChild(helperNode);

		var finalize = function(){
//			helperNode.parentNode.removeChild(helperNode);
			domConstruct.destroy(helperNode);
			// fixes a flicker when the animation ends
			s.backgroundColor = endColor;
			s.visibility = "visible";
		};
		if(whichAnim == "last"){
			for(i in p0){
				p0[i] = { start: p0[i] };
			}
			p0[borderConst + pn[1] + "Color"] = { start: darkColor, end: endColor };
			p1 = p0;
		}
		if(!whichAnim || whichAnim == "first"){
			anims.push(baseFx.animateProperty({
				node: helperNode,
				duration: duration,
				properties: p0
			}));
		}
		if(!whichAnim || whichAnim == "last"){
			anims.push(baseFx.animateProperty({
				node: helperNode,
				duration: duration,
				properties: p1,
				onEnd: finalize
			}));
		}

		// hide the original node
		connectUtil.connect(anims[0], "play", function(){
			helperNode.style.visibility = "visible";
			s.visibility = "hidden";
		});

		return coreFx.chain(anims); // dojo.Animation

	}

	fxExt.flipCube = function(/*Object*/ args){
		// summary:
		//		An extension to `dojox.fx.flip` providing a more 3d-like rotation
		// description:
		//		An extension to `dojox.fx.flip` providing a more 3d-like rotation.
		//		Behaves the same as `dojox.fx.flip`, using the same attributes and
		//		other standard `dojo.Animation` properties.
		// example:
		//		See `dojox.fx.flip`
		var anims = [],
			mb = domGeom.getMarginBox(args.node),
			shiftX = mb.w / 2,
			shiftY = mb.h / 2,
			dims = {
				top: {
					pName: "height",
					args:[
						{
							whichAnim: "first",
							dir: "top",
							shift: -shiftY
						},
						{
							whichAnim: "last",
							dir: "bottom",
							shift: shiftY
						}
					]
				},
				right: {
					pName: "width",
					args:[
						{
							whichAnim: "first",
							dir: "right",
							shift: shiftX
						},
						{
							whichAnim: "last",
							dir: "left",
							shift: -shiftX
						}
					]
				},
				bottom: {
					pName: "height",
					args:[
						{
							whichAnim: "first",
							dir: "bottom",
							shift: shiftY
						},
						{
							whichAnim: "last",
							dir: "top",
							shift: -shiftY
						}
					]
				},
				left: {
					pName: "width",
					args:[
						{
							whichAnim: "first",
							dir: "left",
							shift: -shiftX
						},
						{
							whichAnim: "last",
							dir: "right",
							shift: shiftX
						}
					]
				}
			}
		;
		var d = dims[args.dir || "left"],
			p = d.args
		;
		args.duration = args.duration ? args.duration * 2 : 500;
		args.depth = .8;
		args.axis = "cube";
		for(var i = p.length - 1; i >= 0; i--){
			lang.mixin(args, p[i]);
			anims.push(fxExt.flip(args));
		}
		return coreFx.combine(anims);
	};
	
	fxExt.flipPage = function(/*Object*/ args){
		// summary:
		//		An extension to `dojox.fx.flip` providing a page flip like animation.
		// description:
		//		An extension to `dojox.fx.flip` providing a page flip effect.
		//		Behaves the same as `dojox.fx.flip`, using the same attributes and
		//		other standard `dojo.Animation` properties.
		// example:
		//		See `dojox.fx.flip`
		var n = args.node,
			coords = htmlUtil.coords(n, true),
			x = coords.x,
			y = coords.y,
			w = coords.w,
			h = coords.h,
			bgColor = htmlUtil.style(n, "backgroundColor"),
			lightColor = args.lightColor || "#dddddd",
			darkColor = args.darkColor,
			helperNode = domConstruct.create("div"),
			anims = [],
			hn = [],
			dir = args.dir || "right",
			pn = {
				left: ["left", "right", "x", "w"],
				top: ["top", "bottom", "y", "h"],
				right: ["left", "left", "x", "w"],
				bottom: ["top", "top", "y", "h"]
			},
			shiftMultiplier = {
				right: [1, -1],
				left: [-1, 1],
				top: [-1, 1],
				bottom: [1, -1]
			}
		;
		htmlUtil.style(helperNode, {
			position: "absolute",
			width  : w + "px",
			height : h + "px",
			top	   : y + "px",
			left   : x + "px",
			visibility: "hidden"
		});
		var hs = [];
		for(var i = 0; i < 2; i++){
			var r = i % 2,
				d = r ? pn[dir][1] : dir,
				wa = r ? "last" : "first",
				endColor = r ? bgColor : lightColor,
				startColor = r ? endColor : args.startColor || n.style.backgroundColor
			;
			hn[i] = lang.clone(helperNode);
			var finalize = function(x){
					return function(){
						domConstruct.destroy(hn[x]);
					}
				}(i)
			;
			winUtil.body().appendChild(hn[i]);
			hs[i] = {
				backgroundColor: r ? startColor : bgColor
			};
			
			hs[i][pn[dir][0]] = coords[pn[dir][2]] + shiftMultiplier[dir][0] * i * coords[pn[dir][3]] + "px";
			htmlUtil.style(hn[i], hs[i]);
			anims.push(dojox.fx.flip({
				node: hn[i],
				dir: d,
				axis: "shortside",
				depth: args.depth,
				duration: args.duration / 2,
				shift: shiftMultiplier[dir][i] * coords[pn[dir][3]] / 2,
				darkColor: darkColor,
				lightColor: lightColor,
				whichAnim: wa,
				endColor: endColor
			}));
			connectUtil.connect(anims[i], "onEnd", finalize);
		}
		return coreFx.chain(anims);
	};
	
	
	fxExt.flipGrid = function(/*Object*/ args){
		// summary:
		//		An extension to `dojox.fx.flip` providing a decomposition in rows * cols flipping elements
		// description:
		//		An extension to `dojox.fx.flip` providing a page flip effect.
		//		Behaves the same as `dojox.fx.flip`, using the same attributes and
		//		other standard `dojo.Animation` properties and
		//
		//		- cols: Integer columns
		//		- rows: Integer rows
		//		- duration: the single flip duration
		// example:
		//		See `dojox.fx.flip`
		var rows = args.rows || 4,
			cols = args.cols || 4,
			anims = [],
			helperNode = domConstruct.create("div"),
			n = args.node,
			coords = htmlUtil.coords(n, true),
			x = coords.x,
			y = coords.y,
			nw = coords.w,
			nh = coords.h,
			w = coords.w / cols,
			h = coords.h / rows,
			cAnims = []
		;
		htmlUtil.style(helperNode, {
			position: "absolute",
			width: w + "px",
			height: h + "px",
			backgroundColor: htmlUtil.style(n, "backgroundColor")
		});
		for(var i = 0; i < rows; i++){
			var r = i % 2,
				d = r ? "right" : "left",
				signum = r ? 1 : -1
			;
			// cloning
			var cn = lang.clone(n);
			htmlUtil.style(cn, {
				position: "absolute",
				width: nw + "px",
				height: nh + "px",
				top: y + "px",
				left: x + "px",
				clip: "rect(" + i * h + "px," + nw + "px," + nh + "px,0)"
			});
			winUtil.body().appendChild(cn);
			anims[i] = [];
			for(var j = 0; j < cols; j++){
				var hn = lang.clone(helperNode),
					l = r ? j : cols - (j + 1)
				;
				var adjustClip = function(xn, yCounter, xCounter){
					return function(){
						if(!(yCounter % 2)){
							htmlUtil.style(xn, {
								clip: "rect(" + yCounter * h + "px," + (nw - (xCounter + 1) * w ) + "px," + ((yCounter + 1) * h) + "px,0px)"
							});
						}else{
							htmlUtil.style(xn, {
								clip: "rect(" + yCounter * h + "px," + nw + "px," + ((yCounter + 1) * h) + "px," + ((xCounter + 1) * w) + "px)"
							});
						}
					}
				}(cn, i, j);
				winUtil.body().appendChild(hn);
				htmlUtil.style(hn, {
					left: x + l * w + "px",
					top: y + i * h + "px",
					visibility: "hidden"
				});
				var a = dojox.fx.flipPage({
				   node: hn,
				   dir: d,
				   duration: args.duration || 900,
				   shift: signum * w/2,
				   depth: .2,
				   darkColor: args.darkColor,
				   lightColor: args.lightColor,
				   startColor: args.startColor || args.node.style.backgroundColor
				}),
				removeHelper = function(xn){
					return function(){
						domConstruct.destroy(xn);
					}
				}(hn)
				;
				connectUtil.connect(a, "play", this, adjustClip);
				connectUtil.connect(a, "play", this, removeHelper);
				anims[i].push(a);
			}
			cAnims.push(coreFx.chain(anims[i]));
			
		}
		connectUtil.connect(cAnims[0], "play", function(){
			htmlUtil.style(n, {visibility: "hidden"});
		});
		return coreFx.combine(cAnims);
	};
	return fxExt;
});

},
'dojo/fx':function(){
define([
	"./_base/lang",
	"./Evented",
	"./_base/kernel",
	"./_base/array",
	"./aspect",
	"./_base/fx",
	"./dom",
	"./dom-style",
	"./dom-geometry",
	"./ready",
	"require" // for context sensitive loading of Toggler
], function(lang, Evented, dojo, arrayUtil, aspect, baseFx, dom, domStyle, geom, ready, require){

	// module:
	//		dojo/fx
	
	// For back-compat, remove in 2.0.
	if(!dojo.isAsync){
		ready(0, function(){
			var requires = ["./fx/Toggler"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	var coreFx = dojo.fx = {
		// summary:
		//		Effects library on top of Base animations
	};

	var _baseObj = {
			_fire: function(evt, args){
				if(this[evt]){
					this[evt].apply(this, args||[]);
				}
				return this;
			}
		};

	var _chain = function(animations){
		this._index = -1;
		this._animations = animations||[];
		this._current = this._onAnimateCtx = this._onEndCtx = null;

		this.duration = 0;
		arrayUtil.forEach(this._animations, function(a){
			this.duration += a.duration;
			if(a.delay){ this.duration += a.delay; }
		}, this);
	};
	_chain.prototype = new Evented();
	lang.extend(_chain, {
		_onAnimate: function(){
			this._fire("onAnimate", arguments);
		},
		_onEnd: function(){
			this._onAnimateCtx.remove();
			this._onEndCtx.remove();
			this._onAnimateCtx = this._onEndCtx = null;
			if(this._index + 1 == this._animations.length){
				this._fire("onEnd");
			}else{
				// switch animations
				this._current = this._animations[++this._index];
				this._onAnimateCtx = aspect.after(this._current, "onAnimate", lang.hitch(this, "_onAnimate"), true);
				this._onEndCtx = aspect.after(this._current, "onEnd", lang.hitch(this, "_onEnd"), true);
				this._current.play(0, true);
			}
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			if(!this._current){ this._current = this._animations[this._index = 0]; }
			if(!gotoStart && this._current.status() == "playing"){ return this; }
			var beforeBegin = aspect.after(this._current, "beforeBegin", lang.hitch(this, function(){
					this._fire("beforeBegin");
				}), true),
				onBegin = aspect.after(this._current, "onBegin", lang.hitch(this, function(arg){
					this._fire("onBegin", arguments);
				}), true),
				onPlay = aspect.after(this._current, "onPlay", lang.hitch(this, function(arg){
					this._fire("onPlay", arguments);
					beforeBegin.remove();
					onBegin.remove();
					onPlay.remove();
				}));
			if(this._onAnimateCtx){
				this._onAnimateCtx.remove();
			}
			this._onAnimateCtx = aspect.after(this._current, "onAnimate", lang.hitch(this, "_onAnimate"), true);
			if(this._onEndCtx){
				this._onEndCtx.remove();
			}
			this._onEndCtx = aspect.after(this._current, "onEnd", lang.hitch(this, "_onEnd"), true);
			this._current.play.apply(this._current, arguments);
			return this;
		},
		pause: function(){
			if(this._current){
				var e = aspect.after(this._current, "onPause", lang.hitch(this, function(arg){
						this._fire("onPause", arguments);
						e.remove();
					}), true);
				this._current.pause();
			}
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			this.pause();
			var offset = this.duration * percent;
			this._current = null;
			arrayUtil.some(this._animations, function(a){
				if(a.duration <= offset){
					this._current = a;
					return true;
				}
				offset -= a.duration;
				return false;
			});
			if(this._current){
				this._current.gotoPercent(offset / this._current.duration, andPlay);
			}
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			if(this._current){
				if(gotoEnd){
					for(; this._index + 1 < this._animations.length; ++this._index){
						this._animations[this._index].stop(true);
					}
					this._current = this._animations[this._index];
				}
				var e = aspect.after(this._current, "onStop", lang.hitch(this, function(arg){
						this._fire("onStop", arguments);
						e.remove();
					}), true);
				this._current.stop();
			}
			return this;
		},
		status: function(){
			return this._current ? this._current.status() : "stopped";
		},
		destroy: function(){
			if(this._onAnimateCtx){ this._onAnimateCtx.remove(); }
			if(this._onEndCtx){ this._onEndCtx.remove(); }
		}
	});
	lang.extend(_chain, _baseObj);

	coreFx.chain = function(/*dojo/_base/fx.Animation[]*/ animations){
		// summary:
		//		Chain a list of `dojo.Animation`s to run in sequence
		//
		// description:
		//		Return a `dojo.Animation` which will play all passed
		//		`dojo.Animation` instances in sequence, firing its own
		//		synthesized events simulating a single animation. (eg:
		//		onEnd of this animation means the end of the chain,
		//		not the individual animations within)
		//
		// example:
		//	Once `node` is faded out, fade in `otherNode`
		//	|	fx.chain([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		return new _chain(animations); // dojo/_base/fx.Animation
	};

	var _combine = function(animations){
		this._animations = animations||[];
		this._connects = [];
		this._finished = 0;

		this.duration = 0;
		arrayUtil.forEach(animations, function(a){
			var duration = a.duration;
			if(a.delay){ duration += a.delay; }
			if(this.duration < duration){ this.duration = duration; }
			this._connects.push(aspect.after(a, "onEnd", lang.hitch(this, "_onEnd"), true));
		}, this);

		this._pseudoAnimation = new baseFx.Animation({curve: [0, 1], duration: this.duration});
		var self = this;
		arrayUtil.forEach(["beforeBegin", "onBegin", "onPlay", "onAnimate", "onPause", "onStop", "onEnd"],
			function(evt){
				self._connects.push(aspect.after(self._pseudoAnimation, evt,
					function(){ self._fire(evt, arguments); },
				true));
			}
		);
	};
	lang.extend(_combine, {
		_doAction: function(action, args){
			arrayUtil.forEach(this._animations, function(a){
				a[action].apply(a, args);
			});
			return this;
		},
		_onEnd: function(){
			if(++this._finished > this._animations.length){
				this._fire("onEnd");
			}
		},
		_call: function(action, args){
			var t = this._pseudoAnimation;
			t[action].apply(t, args);
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			this._finished = 0;
			this._doAction("play", arguments);
			this._call("play", arguments);
			return this;
		},
		pause: function(){
			this._doAction("pause", arguments);
			this._call("pause", arguments);
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			var ms = this.duration * percent;
			arrayUtil.forEach(this._animations, function(a){
				a.gotoPercent(a.duration < ms ? 1 : (ms / a.duration), andPlay);
			});
			this._call("gotoPercent", arguments);
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			this._doAction("stop", arguments);
			this._call("stop", arguments);
			return this;
		},
		status: function(){
			return this._pseudoAnimation.status();
		},
		destroy: function(){
			arrayUtil.forEach(this._connects, function(handle){
				handle.remove();
			});
		}
	});
	lang.extend(_combine, _baseObj);

	coreFx.combine = function(/*dojo/_base/fx.Animation[]*/ animations){
		// summary:
		//		Combine a list of `dojo.Animation`s to run in parallel
		//
		// description:
		//		Combine an array of `dojo.Animation`s to run in parallel,
		//		providing a new `dojo.Animation` instance encompasing each
		//		animation, firing standard animation events.
		//
		// example:
		//	Fade out `node` while fading in `otherNode` simultaneously
		//	|	fx.combine([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		// example:
		//	When the longest animation ends, execute a function:
		//	|	var anim = fx.combine([
		//	|		dojo.fadeIn({ node: n, duration:700 }),
		//	|		dojo.fadeOut({ node: otherNode, duration: 300 })
		//	|	]);
		//	|	aspect.after(anim, "onEnd", function(){
		//	|		// overall animation is done.
		//	|	}, true);
		//	|	anim.play(); // play the animation
		//
		return new _combine(animations); // dojo/_base/fx.Animation
	};

	coreFx.wipeIn = function(/*Object*/ args){
		// summary:
		//		Expand a node to it's natural height.
		//
		// description:
		//		Returns an animation that will expand the
		//		node defined in 'args' object from it's current height to
		//		it's natural height (with no scrollbar).
		//		Node must have no margin/border/padding.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	fx.wipeIn({
		//	|		node:"someId"
		//	|	}).play()
		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					// wrapped in functions so we wait till the last second to query (in case value has changed)
					start: function(){
						// start at current [computed] height, but use 1px rather than 0
						// because 0 causes IE to display the whole panel
						o = s.overflow;
						s.overflow = "hidden";
						if(s.visibility == "hidden" || s.display == "none"){
							s.height = "1px";
							s.display = "";
							s.visibility = "";
							return 1;
						}else{
							var height = domStyle.get(node, "height");
							return Math.max(height, 1);
						}
					},
					end: function(){
						return node.scrollHeight;
					}
				}
			}
		}, args));

		var fini = function(){
			s.height = "auto";
			s.overflow = o;
		};
		aspect.after(anim, "onStop", fini, true);
		aspect.after(anim, "onEnd", fini, true);

		return anim; // dojo/_base/fx.Animation
	};

	coreFx.wipeOut = function(/*Object*/ args){
		// summary:
		//		Shrink a node to nothing and hide it.
		//
		// description:
		//		Returns an animation that will shrink node defined in "args"
		//		from it's current height to 1px, and then hide it.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	fx.wipeOut({ node:"someId" }).play()

		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					end: 1 // 0 causes IE to display the whole panel
				}
			}
		}, args));

		aspect.after(anim, "beforeBegin", function(){
			o = s.overflow;
			s.overflow = "hidden";
			s.display = "";
		}, true);
		var fini = function(){
			s.overflow = o;
			s.height = "auto";
			s.display = "none";
		};
		aspect.after(anim, "onStop", fini, true);
		aspect.after(anim, "onEnd", fini, true);

		return anim; // dojo/_base/fx.Animation
	};

	coreFx.slideTo = function(/*Object*/ args){
		// summary:
		//		Slide a node to a new top/left position
		//
		// description:
		//		Returns an animation that will slide "node"
		//		defined in args Object from its current position to
		//		the position defined by (args.left, args.top).
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on). Special args members
		//		are `top` and `left`, which indicate the new position to slide to.
		//
		// example:
		//	|	.slideTo({ node: node, left:"40", top:"50", units:"px" }).play()

		var node = args.node = dom.byId(args.node),
			top = null, left = null;

		var init = (function(n){
			return function(){
				var cs = domStyle.getComputedStyle(n);
				var pos = cs.position;
				top = (pos == 'absolute' ? n.offsetTop : parseInt(cs.top) || 0);
				left = (pos == 'absolute' ? n.offsetLeft : parseInt(cs.left) || 0);
				if(pos != 'absolute' && pos != 'relative'){
					var ret = geom.position(n, true);
					top = ret.y;
					left = ret.x;
					n.style.position="absolute";
					n.style.top=top+"px";
					n.style.left=left+"px";
				}
			};
		})(node);
		init();

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				top: args.top || 0,
				left: args.left || 0
			}
		}, args));
		aspect.after(anim, "beforeBegin", init, true);

		return anim; // dojo/_base/fx.Animation
	};

	return coreFx;
});

},
'dojox/fx/_base':function(){
define(["dojo/_base/array","dojo/_base/lang", "dojo/_base/fx", "dojo/fx", "dojo/dom", "dojo/dom-style",
	    "dojo/dom-geometry", "dojo/_base/connect", "dojo/_base/html"],
	function(arrayUtil, lang, baseFx, coreFx, dom, domStyle, domGeom, connectUtil, htmlUtil){

/*=====
return {
	// summary:
	//		Experimental and extended Animations beyond Dojo Core / Base functionality.
	//		Provides advanced Lines, Animations, and convenience aliases.
};
=====*/

var dojoxFx = lang.getObject("dojox.fx", true);

lang.mixin(dojoxFx, {

	// anim: Function
	//		Alias of `dojo.anim` - the shorthand `dojo.animateProperty` with auto-play
	anim: baseFx.anim,

	// animateProperty: Function
	//		Alias of `dojo.animateProperty` - animate any CSS property
	animateProperty: baseFx.animateProperty,

	// fadeTo: Function
	//		Fade an element from an opacity to an opacity.
	//		Omit `start:` property to detect. `end:` property is required.
	//		Ultimately an alias to `dojo._fade`
	fadeTo: baseFx._fade,

	// fadeIn: Function
	//		Alias of `dojo.fadeIn` - Fade a node in.
	fadeIn: baseFx.fadeIn,
	
	// fadeOut: Function
	//		Alias of `dojo.fadeOut` - Fades a node out.
	fadeOut: baseFx.fadeOut,

	// combine: Function
	//		Alias of `dojo.fx.combine` - Run an array of animations in parallel
	combine: coreFx.combine,

	// chain: Function
	//		Alias of `dojo.fx.chain` - Run an array of animations in sequence
	chain: coreFx.chain,

	// slideTo: Function
	//		Alias of `dojo.fx.slideTo` - Slide a node to a defined top/left coordinate
	slideTo: coreFx.slideTo,

	// wipeIn: Function
	//		Alias of `dojo.fx.wipeIn` - Wipe a node to visible
	wipeIn: coreFx.wipeIn,

	// wipeOut: Function
	//		Alias of `dojo.fx.wipeOut` - Wipe a node to non-visible
	wipeOut: coreFx.wipeOut
});


dojoxFx.sizeTo = function(/* Object */args){
	// summary:
	//		Creates an animation that will size a node
	//
	// description:
	//		Returns an animation that will size the target node
	//		defined in args Object about it's center to
	//		a width and height defined by (args.width, args.height),
	//		supporting an optional method: chain||combine mixin
	//		(defaults to chain).
	//
	//	- works best on absolutely or relatively positioned elements
	//
	// example:
	//	|	// size #myNode to 400px x 200px over 1 second
	//	|	dojo.fx.sizeTo({
	//	|		node:'myNode',
	//	|		duration: 1000,
	//	|		width: 400,
	//	|		height: 200,
	//	|		method: "combine"
	//	|	}).play();
	//

	var node = args.node = dom.byId(args.node),
		abs = "absolute";

	var method = args.method || "chain";
	if(!args.duration){ args.duration = 500; } // default duration needed
	if(method == "chain"){ args.duration = Math.floor(args.duration / 2); }
	
	var top, newTop, left, newLeft, width, height = null;

	var init = (function(n){
		return function(){
			var cs = domStyle.getComputedStyle(n),
				pos = cs.position,
				w = cs.width,
				h = cs.height
			;
			
			top = (pos == abs ? n.offsetTop : parseInt(cs.top) || 0);
			left = (pos == abs ? n.offsetLeft : parseInt(cs.left) || 0);
			width = (w == "auto" ? 0 : parseInt(w));
			height = (h == "auto" ? 0 : parseInt(h));
			
			newLeft = left - Math.floor((args.width - width) / 2);
			newTop = top - Math.floor((args.height - height) / 2);

			if(pos != abs && pos != 'relative'){
				var ret = domStyle.coords(n, true);
				top = ret.y;
				left = ret.x;
				n.style.position = abs;
				n.style.top = top + "px";
				n.style.left = left + "px";
			}
		}
	})(node);

	var anim1 = baseFx.animateProperty(lang.mixin({
		properties: {
			height: function(){
				init();
				return { end: args.height || 0, start: height };
			},
			top: function(){
				return { start: top, end: newTop };
			}
		}
	}, args));
	var anim2 = baseFx.animateProperty(lang.mixin({
		properties: {
			width: function(){
				return { start: width, end: args.width || 0 }
			},
			left: function(){
				return { start: left, end: newLeft }
			}
		}
	}, args));

	var anim = coreFx[(args.method == "combine" ? "combine" : "chain")]([anim1, anim2]);
	return anim; // dojo.Animation

};

dojoxFx.slideBy = function(/* Object */args){
	// summary:
	//		Returns an animation to slide a node by a defined offset.
	//
	// description:
	//		Returns an animation that will slide a node (args.node) from it's
	//		current position to it's current posision plus the numbers defined
	//		in args.top and args.left. standard dojo.fx mixin's apply.
	//
	// example:
	//	|	// slide domNode 50px down, and 22px left
	//	|	dojox.fx.slideBy({
	//	|		node: domNode, duration:400,
	//	|		top: 50, left: -22
	//	|	}).play();

	var node = args.node = dom.byId(args.node),
		top, left;

	var init = (function(n){
		return function(){
			var cs = domStyle.getComputedStyle(n);
			var pos = cs.position;
			top = (pos == 'absolute' ? n.offsetTop : parseInt(cs.top) || 0);
			left = (pos == 'absolute' ? n.offsetLeft : parseInt(cs.left) || 0);
			if(pos != 'absolute' && pos != 'relative'){
				var ret = domGeom.coords(n, true);
				top = ret.y;
				left = ret.x;
				n.style.position = "absolute";
				n.style.top = top + "px";
				n.style.left = left + "px";
			}
		}
	})(node);
	init();
	
	var _anim = baseFx.animateProperty(lang.mixin({
		properties: {
			// FIXME: is there a way to update the _Line after creation?
			// null start values allow chaining to work, animateProperty will
			// determine them for us (except in ie6? -- ugh)
			top: top + (args.top || 0),
			left: left + (args.left || 0)
		}
	}, args));
	connectUtil.connect(_anim, "beforeBegin", _anim, init);
	return _anim; // dojo.Animation
};

dojoxFx.crossFade = function(/* Object */args){
	// summary:
	//		Returns an animation cross fading two element simultaneously
	// args:
	//		- args.nodes: Array - two element array of domNodes, or id's
	//
	//		all other standard animation args mixins apply. args.node ignored.

	// simple check for which node is visible, maybe too simple?
	var node1 = args.nodes[0] = dom.byId(args.nodes[0]),
		op1 = htmlUtil.style(node1,"opacity"),
		node2 = args.nodes[1] = dom.byId(args.nodes[1]),
		op2 = htmlUtil.style(node2, "opacity")
	;
	
	var _anim = coreFx.combine([
		baseFx[(op1 == 0 ? "fadeIn" : "fadeOut")](lang.mixin({
			node: node1
		},args)),
		baseFx[(op1 == 0 ? "fadeOut" : "fadeIn")](lang.mixin({
			node: node2
		},args))
	]);
	return _anim; // dojo.Animation
};

dojoxFx.highlight = function(/*Object*/ args){
	// summary:
	//		Highlight a node
	//
	// description:
	//		Returns an animation that sets the node background to args.color
	//		then gradually fades back the original node background color
	//
	// example:
	//	|	dojox.fx.highlight({ node:"foo" }).play();

	var node = args.node = dom.byId(args.node);

	args.duration = args.duration || 400;
	
	// Assign default color light yellow
	var startColor = args.color || '#ffff99',
		endColor = htmlUtil.style(node, "backgroundColor")
	;

	// safari "fix"
	// safari reports rgba(0, 0, 0, 0) (black) as transparent color, while
	// other browsers return "transparent", rendered as white by default by
	// dojo.Color; now dojo.Color maps "transparent" to
	// djConfig.transparentColor ([r, g, b]), if present; so we can use
	// the color behind the effect node
	if(endColor == "rgba(0, 0, 0, 0)"){
		endColor = "transparent";
	}

	var anim = baseFx.animateProperty(lang.mixin({
		properties: {
			backgroundColor: { start: startColor, end: endColor }
		}
	}, args));

	if(endColor == "transparent"){
		connectUtil.connect(anim, "onEnd", anim, function(){
			node.style.backgroundColor = endColor;
		});
	}

	return anim; // dojo.Animation
};

 
dojoxFx.wipeTo = function(/*Object*/ args){
	// summary:
	//		Animate a node wiping to a specific width or height
	//
	// description:
	//		Returns an animation that will expand the
	//		node defined in 'args' object from it's current to
	//		the height or width value given by the args object.
	//
	//		default to height:, so leave height null and specify width:
	//		to wipeTo a width. note: this may be deprecated by a
	//
	//		Note that the final value should not include
	//		units and should be an integer.  Thus a valid args object
	//		would look something like this:
	//
	//		|	dojox.fx.wipeTo({ node: "nodeId", height: 200 }).play();
	//
	//		Node must have no margin/border/padding, so put another
	//		node inside your target node for additional styling.

	args.node = dom.byId(args.node);
	var node = args.node, s = node.style;

	var dir = (args.width ? "width" : "height"),
		endVal = args[dir],
		props = {}
	;

	props[dir] = {
		// wrapped in functions so we wait till the last second to query (in case value has changed)
		start: function(){
			// start at current [computed] height, but use 1px rather than 0
			// because 0 causes IE to display the whole panel
			s.overflow = "hidden";
			if(s.visibility == "hidden" || s.display == "none"){
				s[dir] = "1px";
				s.display = "";
				s.visibility = "";
				return 1;
			}else{
				var now = htmlUtil.style(node,dir);
				return Math.max(now, 1);
			}
		},
		end: endVal
	};

	var anim = baseFx.animateProperty(lang.mixin({ properties: props }, args));
	return anim; // dojo.Animation
};

return dojoxFx;
});

},
'demos/faces/src/block':function(){
// wrapped by build app
define(["dojo","dijit","dojox"], function(dojo,dijit,dojox){
dojo.provide("demos.faces.src.block");

(function(){
	
	// a simple shallow alias
	var d = dojo;
	
	d.declare("dojo._Blocker", null, {
		// summary:
		//		The blocker instance used by dojo.block to overlay a node

		// duration: Integer
		//		The duration of the fadeIn/fadeOut for the overlay
		duration: 400,
		
		// opacity: Float
		//		The final opacity of the overlay. A number from 0 to 1
		opacity: 0.6,
		
		// backgroundColor: String
		//		The color to set the overlay
		backgroundColor: "#fff",
		
		// zIndex: Integer
		//		The z-index to apply to the overlay, should you need to adjust for higher elements
		zIndex: 999,
		
		constructor: function(node, args){
			// the constructor function is always called by dojo.declare.
			// first, mixin any passed args into this instance to override defaults, or hook in custom stuff
			d.mixin(this, args);
			// in-case someone passed node:"something", force this.node to be the first param
			this.node = d.byId(node);
			// create a node for our overlay.
			this.overlay = d.doc.createElement('div');

			// do some chained magic nonsense
			d.query(this.overlay)
				// make it the last-child of <body>
				.place(d.body(),"last")
				// give it a common class
				.addClass("dojoBlockOverlay")
				// mixin our styles. I'd prefer to do this purly in CSS, but that would
				// require external css somehow, and is an extra file. ;)
				.style({
					backgroundColor: this.backgroundColor,
					position: "absolute",
					zIndex: this.zIndex,
					display: "none",
					opacity: this.opacity
				});
		},
		
		_position: function(){
			var pos = d.position(this.node, true);
			// adjust for margins/padding: (edge case, may only be this demo's styles)
			pos = dojo.mixin(dojo.marginBox(this.node), {
				l: pos.x, t: pos.y
			});
	
			dojo.style(this.overlay,{
				position:"absolute",
				left: pos.l + "px",
				width: pos.w + "px",
				height: pos.h + "px",
				top: pos.t + "px"
			});
		},
		
		show: function(){
			// summary:
			//		Show this overlay
			
			if(this._showing){ return; }
			var	ov = this.overlay;

			this._position();
			if(this.keepPosition){
				this.positionConnect = dojo.connect(window, "onresize", this, "_position");
			}

			d.style(ov, { opacity:0, display:"block" });
			d._fade({ node:ov, end: this.opacity, duration: this.duration }).play();
			this._showing = true;
		},
		
		hide: function(){
			// summary:
			//		Hide this overlay
			
			d.fadeOut({
				node: this.overlay,
				duration: this.duration,
				// when the fadeout is done, set the overlay to display:none
				onEnd: d.hitch(this, function(){
					d.style(this.overlay, "display", "none");
					if(this.keepPosition){
						dojo.disconnect(this.positionConnect);
					}
					this._showing = false;
				})
			}).play();
		}
		
	});

	// Generates a unique id for a node
	var id_count = 0;
	var _uniqueId = function(){
		var id_base = "dojo_blocked",
			id;
		do{
			id = id_base + "_" + (++id_count);
		}while(d.byId(id));
		return id;
	}

	var blockers = {}; // hash of all blockers
	d.mixin(d, {
		block: function(/* String|DomNode */node, /* dojo.block._blockArgs */args){
			// summary:
			//		Overlay the passed node to prevent further input, creates an
			//		instance of dojo._Blocker attached to this node byId, or generates a
			//		unique id if the node doesn't have one already.
			// node:
			//		The node to overlay
			// args:
			//		An object hash of configuration options. See dojo._Blocker for
			//		a list of parameters mixed in.
			// returns:
			//		The dojo._Blocker instance created for the passed node for convenience.
			//		You can call var thing = dojo.block("someNode"); thing.hide(); or simply call
			//		dojo.unblock("someNode"), whichever you prefer.

			var n = d.byId(node);
			var id = d.attr(n, "id");
			if(!id){
				id = _uniqueId();
				d.attr(n, "id", id);
			}
			if(!blockers[id]){
				blockers[id] = new d._Blocker(node, args);
			}
			blockers[id].show();
			return blockers[id]; // dojo._Blocker
		},
		
		unblock: function(node, args){
			// summary:
			//		Unblock the passed node
			var id = d.attr(node, "id");
			if(id && blockers[id]){
				blockers[id].hide();
			}
		}
		
	});
	
	d.extend(d.NodeList, {
		block: d.NodeList._adaptAsForEach("block"),
		unblock: d.NodeList._adaptAsForEach("unblock")
	});
	
})();

});

},
'dijit/_base/sniff':function(){
define([ "dojo/uacss" ], function(){

	// module:
	//		dijit/_base/sniff

	/*=====
	return {
		// summary:
		//		Deprecated, back compatibility module, new code should require dojo/uacss directly instead of this module.
	};
	=====*/
});

},
'dojo/uacss':function(){
define(["./dom-geometry", "./_base/lang", "./domReady", "./sniff", "./_base/window"],
	function(geometry, lang, domReady, has, baseWindow){

	// module:
	//		dojo/uacss

	/*=====
	return {
		// summary:
		//		Applies pre-set CSS classes to the top-level HTML node, based on:
		//
		//		- browser (ex: dj_ie)
		//		- browser version (ex: dj_ie6)
		//		- box model (ex: dj_contentBox)
		//		- text direction (ex: dijitRtl)
		//
		//		In addition, browser, browser version, and box model are
		//		combined with an RTL flag when browser text is RTL. ex: dj_ie-rtl.
		//
		//		Returns the has() method.
	};
	=====*/

	var
		html = baseWindow.doc.documentElement,
		ie = has("ie"),
		opera = has("opera"),
		maj = Math.floor,
		ff = has("ff"),
		boxModel = geometry.boxModel.replace(/-/,''),

		classes = {
			"dj_quirks": has("quirks"),

			// NOTE: Opera not supported by dijit
			"dj_opera": opera,

			"dj_khtml": has("khtml"),

			"dj_webkit": has("webkit"),
			"dj_safari": has("safari"),
			"dj_chrome": has("chrome"),

			"dj_gecko": has("mozilla"),

			"dj_ios": has("ios"),
			"dj_android": has("android")
		}; // no dojo unsupported browsers

	if(ie){
		classes["dj_ie"] = true;
		classes["dj_ie" + maj(ie)] = true;
		classes["dj_iequirks"] = has("quirks");
	}
	if(ff){
		classes["dj_ff" + maj(ff)] = true;
	}

	classes["dj_" + boxModel] = true;

	// apply browser, browser version, and box model class names
	var classStr = "";
	for(var clz in classes){
		if(classes[clz]){
			classStr += clz + " ";
		}
	}
	html.className = lang.trim(html.className + " " + classStr);

	// If RTL mode, then add dj_rtl flag plus repeat existing classes with -rtl extension.
	// We can't run the code below until the <body> tag has loaded (so we can check for dir=rtl).
	domReady(function(){
		if(!geometry.isBodyLtr()){
			var rtlClassStr = "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl ");
			html.className = lang.trim(html.className + " " + rtlClassStr + "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl "));
		}
	});
	return has;
});

},
'dojox/image/_base':function(){
define(["dojo", "dojox"], function(dojo, dojox){
	
	dojo.getObject("image", true, dojox);
	var d = dojo;
	
	var cacheNode;
	dojox.image.preload = function(/* Array */urls){
		// summary:
		//		Preload a list of images in the dom.
		// urls: Array
		//		The list of urls to load. Can be any valid .src attribute.
		// example:
		//		Load two images into cache:
		//	|	dojox.image.preload(["foo.png", "bar.gif"]);
		// example:
		//		Using djConfig:
		//	|	var djConfig = {
		//	|		preloadImages:["bar.png", "baz.png", "http://example.com/icon.gif"]
		//	|	};
		// returns: Array
		//		An Array of DomNodes that have been cached.
		
		if(!cacheNode){
			cacheNode = d.create("div", {
				style:{ position:"absolute", top:"-9999px", height:"1px", overflow:"hidden" }
			}, d.body());
		}

		// place them in the hidden cachenode
		return d.map(urls, function(url){
			return d.create("img", { src: url }, cacheNode);
		});
	
	};
	
	/*=====
	dojo.mixin(djConfig, {
		// preloadImages: Array?
		//		An optional array of urls to preload immediately upon
		//		page load. Uses `dojox.image`, and is unused if not present.
		preloadImages: []
	});
	=====*/
	
	if(d.config.preloadImages){
		d.addOnLoad(function(){
			dojox.image.preload(d.config.preloadImages);
		});
	}
		
//	dojo.declare("dojox.image.Image", dijit._Widget, {
//		// summary:
//		//		an Image widget
//		// example:
//		//	| new dojox.Image({ src:"foo.png", id:"bar" });
//
//		alt: "",
//		src: dojo._blankGif,
//		title: "",
//
//		onLoad: function(e){
//			// summary:
//			//		Stub fired when this image is really ready.
//		},
//
//		_onLoad: function(e){
//			// summary:
//			//		private function to normalize `onLoad` for this
//			//		instance.
//			this.onLoad(e);
//		},
//
//		_setSrcAttr: function(newSrc){
//			// summary:
//			//		Function so widget.attr('src', someUrl) works
//
//			var ts = this.domNode, os = td.src;
//			if(os !== newSrc){
//				td.src = newSrc;
//			}
//		},
//
//		/* Sugar Functions: */
//
//		crossFade: function(newSrc){
//			// summary:
//			//		Set this Image to a new src with crossfading
//			// example:
//			// |	dijit.byId("bar").crossFade("/images/newImage.png");
//			//
//
//			d.fadeOut({
//				node: this.domNode,
//				onEnd: d.hitch(this, function(){
//					this.attr('src', newSrc);
//					d.fadeIn({
//						node: this.domNode,
//						delay: 75
//					}).play();
//				})
//			}).play();
//		},
//
//		/* Overrides */
//
//		buildRendering: function(){
//			// override buildrendering to create a real "img" instead of a div
//			// when no srcNodeRef is passed. also wire up single onload.
//			this.domNode = this.srcNodeRef || d.create('img');
//			this.connect(this.domNode, "onload", "_onload");
//		}
//
//	});
		
});
},
'dojox/image/LightboxNano':function(){
define(["dojo", "dojo/fx"], function(dojo, fx) {

	var abs = "absolute",
		vis = "visibility",
		getViewport = function(){
			// summary:
			//		Returns the dimensions and scroll position of the viewable area of a browser window
			var scrollRoot = (dojo.doc.compatMode == "BackCompat") ? dojo.body() : dojo.doc.documentElement,
				scroll = dojo._docScroll();
				return { w: scrollRoot.clientWidth, h: scrollRoot.clientHeight, l: scroll.x, t: scroll.y };
			}
	;

	return dojo.declare("dojox.image.LightboxNano", null, {
		// summary:
		//		A simple "nano" version of the lightbox.
		// description:
		//		Very lightweight lightbox which only displays a larger image.  There is
		//		no support for a caption or description.  The lightbox can be closed by
		//		clicking any where or pressing any key.  This widget is intended to be
		//		used on `<a>` and `<img>` tags.  Upon creation, if the domNode is `<img>` tag,
		//		then it is wrapped in an `<a>` tag, then a `<div class="enlarge">` is placed
		//		inside the `<a>` and can be styled to display an icon that the original
		//		can be enlarged.
		// example:
		//	|	<a dojoType="dojox.image.LightboxNano" href="/path/to/largeimage.jpg"><img src="/path/to/thumbnail.jpg"></a>
		// example:
		//	|	<img dojoType="dojox.image.LightboxNano" src="/path/to/thumbnail.jpg" href="/path/to/largeimage.jpg">

		// href: string
		//		URL to the large image to show in the lightbox.
		href: "",

		// duration: int
		//		The delay in milliseconds of the LightboxNano open and close animation.
		duration: 500,

		// preloadDelay: int
		//		The delay in milliseconds after the LightboxNano is created before preloading the larger image.
		preloadDelay: 5000,

		constructor: function(/*Object?*/p, /*DomNode?*/n){
			// summary:
			//		Initializes the DOM node and connect onload event
			var _this = this;

			dojo.mixin(_this, p);
			n = _this._node = dojo.byId(n);

			// if we have a origin node, then prepare it to show the LightboxNano
			if(n){
				if(!/a/i.test(n.tagName)){
					var a = dojo.create("a", { href: _this.href, "class": n.className }, n, "after");
					n.className = "";
					a.appendChild(n);
					n = a;
				}

				dojo.style(n, "position", "relative");
				_this._createDiv("dojoxEnlarge", n);
				dojo.setSelectable(n, false);
				_this._onClickEvt = dojo.connect(n, "onclick", _this, "_load");
			}

			if(_this.href){
				setTimeout(function(){
					(new Image()).src = _this.href;
					_this._hideLoading();
				}, _this.preloadDelay);
			}
		},

		destroy: function(){
			// summary:
			//		Destroys the LightboxNano and it's DOM node
			var a = this._connects || [];
			a.push(this._onClickEvt);
			dojo.forEach(a, dojo.disconnect);
			dojo.destroy(this._node);
		},

		_createDiv: function(/*String*/cssClass, /*DomNode*/refNode, /*boolean*/display){
			// summary:
			//		Creates a div for the enlarge icon and loading indicator layers
			return dojo.create("div", { // DomNode
				"class": cssClass,
				style: {
					position: abs,
					display: display ? "" : "none"
				}
			}, refNode);
		},

		_load: function(/*Event*/e){
			// summary:
			//		Creates the large image and begins to show it
			var _this = this;

			e && dojo.stopEvent(e);

			if(!_this._loading){
				_this._loading = true;
				_this._reset();

				var i = _this._img = dojo.create("img", {
						style: {
							visibility: "hidden",
							cursor: "pointer",
							position: abs,
							top: 0,
							left: 0,
							zIndex: 9999999
						}
					}, dojo.body()),
					ln = _this._loadingNode,
					n = dojo.query("img", _this._node)[0] || _this._node,
					a = dojo.position(n, true),
					c = dojo.contentBox(n),
					b = dojo._getBorderExtents(n)
				;

				if(ln == null){
					_this._loadingNode = ln = _this._createDiv("dojoxLoading", _this._node, true);
					var l = dojo.marginBox(ln);
					dojo.style(ln, {
						left: parseInt((c.w - l.w) / 2) + "px",
						top: parseInt((c.h - l.h) / 2) + "px"
					});
				}

				c.x = a.x - 10 + b.l;
				c.y = a.y - 10 + b.t;
				_this._start = c;

				_this._connects = [dojo.connect(i, "onload", _this, "_show")];

				i.src = _this.href;
			}
		},

		_hideLoading: function(){
			// summary:
			//		Hides the animated loading indicator
			if(this._loadingNode){
				dojo.style(this._loadingNode, "display", "none");
			}
			this._loadingNode = false;
		},

		_show: function(){
			// summary:
			//		The image is now loaded, calculate size and display
			var _this = this,
				vp = getViewport(),
				w = _this._img.width,
				h = _this._img.height,
				vpw = parseInt((vp.w - 20) * 0.9),
				vph = parseInt((vp.h - 20) * 0.9),
				dd = dojo.doc,
				bg = _this._bg = dojo.create("div", {
					style: {
						backgroundColor: "#000",
						opacity: 0.0,
						position: abs,
						zIndex: 9999998
					}
				}, dojo.body()),
				ln = _this._loadingNode
			;

			if(_this._loadingNode){
				_this._hideLoading();
			}
			dojo.style(_this._img, {
				border: "10px solid #fff",
				visibility: "visible"
			});
			dojo.style(_this._node, vis, "hidden");

			_this._loading = false;

			_this._connects = _this._connects.concat([
				dojo.connect(dd, "onmousedown", _this, "_hide"),
				dojo.connect(dd, "onkeypress", _this, "_key"),
				dojo.connect(window, "onresize", _this, "_sizeBg")
			]);

			if(w > vpw){
				h = h * vpw / w;
				w = vpw;
			}
			if(h > vph){
				w = w * vph / h;
				h = vph;
			}

			_this._end = {
				x: (vp.w - 20 - w) / 2 + vp.l,
				y: (vp.h - 20 - h) / 2 + vp.t,
				w: w,
				h: h
			};

			_this._sizeBg();

			dojo.fx.combine([
				_this._anim(_this._img, _this._coords(_this._start, _this._end)),
				_this._anim(bg, { opacity: 0.5 })
			]).play();
		},

		_sizeBg: function(){
			// summary:
			//		Resize the background to fill the page
			var dd = dojo.doc.documentElement;
			dojo.style(this._bg, {
				top: 0,
				left: 0,
				width: dd.scrollWidth + "px",
				height: dd.scrollHeight + "px"
			});
		},

		_key: function(/*Event*/e){
			// summary:
			//		A key was pressed, so hide the lightbox
			dojo.stopEvent(e);
			this._hide();
		},

		_coords: function(/*Object*/s, /*Object*/e){
			// summary:
			//		Returns animation parameters with the start and end coords
			return { // Object
				left:	{ start: s.x, end: e.x },
				top:	{ start: s.y, end: e.y },
				width:	{ start: s.w, end: e.w },
				height:	{ start: s.h, end: e.h }
			};
		},

		_hide: function(){
			// summary:
			//		Closes the lightbox
			var _this = this;
			dojo.forEach(_this._connects, dojo.disconnect);
			_this._connects = [];
			dojo.fx.combine([
				_this._anim(_this._img, _this._coords(_this._end, _this._start), "_reset"),
				_this._anim(_this._bg, {opacity:0})
			]).play();
		},

		_reset: function(){
			// summary:
			//		Destroys the lightbox
			dojo.style(this._node, vis, "visible");
			dojo.destroy(this._img);
			dojo.destroy(this._bg);
			this._img = this._bg = null;
			this._node.focus();
		},

		_anim: function(/*DomNode*/node, /*Object*/args, /*Function*/onEnd){
			// summary:
			//		Creates the lightbox open/close and background fadein/out animations
			return dojo.animateProperty({ // dojo.Animation
				node: node,
				duration: this.duration,
				properties: args,
				onEnd: onEnd ? dojo.hitch(this, onEnd) : null
			});
		},
		
		show: function(/*Object?*/args){
			// summary:
			//		Shows this LightboxNano programatically. Allows passing a new href and
			//		a programmatic origin.
			// args: Object?
			//		An object with optional members of `href` and `origin`.
			//		`origin` can be be a String|Id of a DomNode to use when
			//		animating the opening of the image (the 'box' effect starts
			//		from this origin point. eg: { origin: e.target })
			//		If there's no origin, it will use the center of the viewport.
			//		The `href` member is a string URL for the image to be
			//		displayed. Omitting either of these members will revert to
			//		the default href (which could be absent in some cases) and
			//		the original srcNodeRef for the widget.
			args = args || {};
			this.href = args.href || this.href;

			var n = dojo.byId(args.origin),
				vp = getViewport();

			// if we don't have a valid origin node, then create one as a reference
			// that is centered in the viewport
			this._node = n || dojo.create("div", {
					style: {
						position: abs,
						width: 0,
						hieght: 0,
						left: (vp.l + (vp.w / 2)) + "px",
						top: (vp.t + (vp.h / 2)) + "px"
					}
				}, dojo.body())
			;

			this._load();

			// if we don't have a valid origin node, then destroy the centered reference
			// node since load() has already been called and it's not needed anymore.
			if(!n){
				dojo.destroy(this._node);
			}
		}
	});

});

},
'dojox/analytics/Urchin':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/window",
        "dojo/_base/config", "dojo/dom-construct"
], function(lang, declare, window, config, construct){

	/*=====
	lang.mixin(config,{
		// urchin: String
		//		Used by `dojox.analytics.Urchin` as the default UA-123456-7 account
		//		number used when being created. Alternately, you can pass an acct:""
		//		parameter to the constructor a la: new dojox.analytics.Urchin({ acct:"UA-123456-7" });
		urchin: ""
	});
	=====*/

	return declare("dojox.analytics.Urchin", null, {
		// summary:
		//		A Google-analytics helper, for post-onLoad inclusion of the tracker, and
		//		dynamic tracking during long-lived page cycles.
		// description:
		//		A small class object will allows for lazy-loading the Google Analytics API
		//		at any point during a page lifecycle. Most commonly, Google-Analytics is loaded
		//		via a synchronous script tag in the body, which causes `dojo.addOnLoad` to
		//		stall until the external API has been completely loaded. The Urchin helper
		//		will load the API on the fly, and provide a convenient API to use, wrapping
		//		Analytics for Ajaxy or single page applications.
		//
		//		The class can be instantiated two ways: Programatically, by passing an
		//		`acct:` parameter, or via Markup / dojoType and defining a djConfig
		//		parameter `urchin:`
		//
		//		IMPORTANT:
		//		This module will not work simultaneously with the core dojox.analytics
		//		package. If you need the ability to run Google Analytics AND your own local
		//		analytics system, you MUST include dojox.analytics._base BEFORE dojox.analytics.Urchin
		// example:
		//	|	// create the tracker programatically:
		//	|	var tracker = new dojox.analytics.Urchin({ acct:"UA-123456-7" });
		//
		// example:
		//	|	// define the urchin djConfig option:
		//	|	var djConfig = { urchin: "UA-123456-7" };
		//	|
		//	|	// and in markup:
		//	|	<div dojoType="dojox.analytics.Urchin"></div>
		//	|	// or code:
		//	|	new dojox.analytics.Urchin();
		//
		// example:
		//	|	// create and define all analytics with one tag.
		//	|	<div dojoType="dojox.analytics.Urchin" acct="UA-12345-67"></div>

		// acct: String
		//		your GA urchin tracker account number. Overrides `djConfig.urchin`
		acct: "",

		constructor: function(args){
			// summary:
			//		Initialize this Urchin instance. Immediately starts the load
			//		sequence, so defer construction until (ideally) after onLoad and
			//		potentially widget parsing.
			this.tracker = null;
			lang.mixin(this, args);
			this.acct = this.acct || config.urchin;

			var re = /loaded|complete/,
				gaHost = ("https:" == window.doc.location.protocol) ? "https://ssl." : "http://www.",
				h = window.doc.getElementsByTagName("head")[0],
				n = construct.create('script', {
					src: gaHost + "google-analytics.com/ga.js"
				}, h);

			n.onload = n.onreadystatechange = lang.hitch(this, function(e){
				if(e && e.type == "load" || re.test(n.readyState)){
					n.onload = n.onreadystatechange = null;
					this._gotGA();
					h.removeChild(n);
				}
			});

		},

		_gotGA: function(){
			// summary:
			//		initialize the tracker
			this.tracker = _gat._getTracker(this.acct);
			this.GAonLoad.apply(this, arguments);
		},

		GAonLoad: function(){
			// summary:
			//		Stub function to fire when urchin is complete
			// description:
			//		This function is executed when the tracker variable is
			//		complete and initialized. The initial trackPageView (with
			//		no arguments) is called here as well, so remeber to call
			//		manually if overloading this method.
			//
			// example:
			//		Create an Urchin tracker that will track a specific page on init
			//		after page load (or parsing, if parseOnLoad is true)
			//	|	dojo.addOnLoad(function(){
			//	|		new dojox.ananlytics.Urchin({
			//	|			acct:"UA-12345-67",
			//	|			GAonLoad: function(){
			//	|				this.trackPageView("/custom-page");
			//	|			}
			//	|		});
			//	|	});
			
			this.trackPageView();
		},

		trackPageView: function(/* string */url){
			// summary:
			//		A public API attached to this widget instance, allowing you
			//		Ajax-like notification of updates.
			// url: String
			//		A location to tell the tracker to track, eg: "/my-ajaxy-endpoint"
			// example:
			//		Track clicks from a container of anchors and populate a `ContentPane`
			//	|	// 'tracker' is our `Urchin` instance, pane is the `ContentPane` ref.
			//	|	dojo.connect(container, "onclick", function(e){
			//	|		var ref = dojo.attr(e.target, "href");
			//	|		tracker.trackPageView(ref);
			//	|		pane.attr("href", ref);
			//	|	});
			
			this.tracker._trackPageview.apply(this.tracker, arguments);
		}

	});
});

}}});
// wrapped by build app
define("demos/faces/src", ["dojo","dijit","dojox","dojo/require!dojox/fx/flip,demos/faces/src/block,dijit/_base/sniff,dojox/image/_base,dojox/image/LightboxNano,dojox/analytics/Urchin"], function(dojo,dijit,dojox){
dojo.provide("demos.faces.src");

dojo.require("dojox.fx.flip");
dojo.require("demos.faces.src.block");
dojo.require("dijit._base.sniff");
dojo.require("dojox.image._base");
dojo.require("dojox.image.LightboxNano");
dojo.require("dojox.analytics.Urchin");

(function(d){
	
	// to reuse
	d.NodeList.prototype.makeNano = function(){
		return this.forEach(function(n){
			new dojox.image.LightboxNano({ href: d.attr(n, "href") }, n);
		});
	}
	
	var v = "flip", x = 0;
	var base64Img = "";
	
	var sortDivsByLengthOfFirstChildUl = function(id){
		// don't ever let me see you doing this outside of a demo situation. there has
		// got to be a better way.
		id = d.byId(id);
		d.query("> div", id).sort(function(a,b){
			var q = "ul > li", al = d.query(q, a).length, bl = d.query(q, b).length;
			return al > bl ? 0 : al < bl ? 1 : -1;
		}).forEach(function(n){
			id.appendChild(n);
		});
	}
	
	var nameset = function(){
		// quick, generate a list of names from top to bottom
		var byid = d.byId;
		return	"" +
				byid("hair").parentNode.className + ", " +
				byid("eyes").parentNode.className + ", and " +
				byid("mouth").parentNode.className + " make: "
				;
	};
	
	var demo = function(){
		
		// each region has an id, and this order is convenient. keep it:
		var pieceId = ["hair", "eyes", "mouth"],
		
		// cache a ref to this node, and always make it 'off' by default
			checknode = d.byId("random");
			
		checknode.checked = false;
		
		var nextImage = function(n){
			// FIXME: there is no unity to this. should keep an index
			// of each region individually. This is more "random" though.
			if(++x > people.length - 1 ){ x = 0; }
			if(people[x] == "webcam"){
				// if we loaded webcam.js, this applies
				n.parentNode.className = "";
				var image = new Image();
				image.src = base64Img;
				d.style(n, "backgroundImage", "url(" + image.src + ")");
			}else{
				// otherwise, just set the image
				d.style(n, "backgroundImage", "");
				n.parentNode.className = people[x];
			}
		};

		var flip = function(e){
			// flip one of the pieceId nodes:
			var n = e.target,
				// create the flip animation:
				fl = dojox.fx[v]({ node: n }),
				// and determine which image to show after flip is over:
				c = d.connect(fl, "onEnd", function(){
					nextImage(n);
					d.disconnect(c);
				})
			;
			fl.play();
		}

		// random logic, could move out into module:
		var randomInterval;
		var stopRandom = function(){
			checknode.checked = false;
			clearTimeout(randomInterval);
			randomInterval = null;
		}
		var randomFunc = function(){
			// pseudo-emulate (duck) the event object randomly:
			flip({ target: d.byId(pieceId[(Math.floor(Math.random() * 3))]) });
		}
		var startRandom = function(){
			randomInterval = setInterval(randomFunc, 4500);
			randomFunc();
		}
		
		d.query("#flipper").onclick(function(e){
			if(randomInterval){ stopRandom(); }
			flip(e);
		});
		d.connect(checknode, "onchange", function(e){
			// check if we should be looping or stop it:
			if(!e.target.checked){
				stopRandom();
			}else{
				startRandom();
			}
		});
		// end random logic

		// click handling for "hall of shame" link:
		var blocker;
		d.query("#saveAs").onclick(function(e){

			var target = d.query("#faceContainer .container")[0];
			blocker = d.block(target, { opacity:0.6, keepPosition:true, backgroundColor:"#000" });

			// onclick, create a data object from the selected faces and send to backend
			var data = {};
			d.forEach(pieceId, function(piece){
				data[piece] = d.byId(piece).parentNode.className || "";
			});
			setTimeout(d.partial(saveFace, data), 50);
			stopRandom();

		});

		var saveFace = function(pay){
			// a function to send the list of currently selected users to the backend
			var url;
			d.xhrPost({
				url: "resources/imageMaker.php",
				handleAs: "json",
				handle: function(response){
				//	try{
						url = response["file"];
						if(response["name"]){
							d.byId("savedName").innerHTML =
								"<p class='who'>" + nameset() + "</p>" +
								"<h2 id='currentName'>" + response["name"] + "</h2>"
								;

							var c = response['clan'];
							
							if(!response['duplicate'] && c){
								// figure out clan

								var clan = dojo.query("ul." + c);
								if(!clan.length){
									var t =
										dojo.create("div",{
											"class":"clan",
											id: c,
											innerHTML:"<h2><a href='#" + c + "'>" + c + "</a></h2>"
												+ "<ul class='" + c + "'></ul>"
										}, "thumbnails");
									clan = dojo.query("ul", t);
								}
							
								var td = dojo.create("li", {
									"class":"thumbnail",
									style:{ opacity:0 },
									innerHTML:"<a href ='" + response["file"] + "'><img src='" + response["thumb"] + "'></a>"
								}, clan[0]);
							
								dojo.query("a", td).makeNano();
							
								dojo.fadeIn({ node: td }).play();
							
							}
						
							sortDivsByLengthOfFirstChildUl("thumbnails");
						
							setTimeout(function(){
								window.location.hash = c;
							}, 400);
	
						}
				//	}catch(e){ console.warn(e); }
					blocker.hide();
				},
				content: pay
			});
		}

		// preload all the available images in people array:
		dojox.image.preload(d.map(people, function(person){
			return "images/" + person + ".jpg";
		}));

		// connect to the "hidden" setupSwf button to load the webcam code:
		d.query("#setupSwf").onclick(function(e){
			this.disabled = true;
			d.addClass(this, "invisible");
			// use keepRequires=[..] or this bracketed notation to prevent build from inlining:
			// TODOC: maybe 'd.require()' isn't picked up either?!?
			// d.require("dojoc.demos.faces.src.webcam");
			d["require"]("dojoc.demos.faces.src.webcam");
		}).forEach(function(n){
			// in the "progressive case", FF and others retain all states :/ force it back.
			n.disabled = false;
		});
		
		d.query(".imageThumb").makeNano();
		
		// now set the three images to something random:
		// FIXME: should we look for a #hash first, too?
		sortDivsByLengthOfFirstChildUl("thumbnails");

		setTimeout(function(){
			d.forEach(pieceId, function(p, i){
				setTimeout(function(){
					flip({ target: d.byId(p) });
				}, i * 150);
			});
		}, 300); // after a bit of time

		// stall this just a little
		setTimeout(function(){
			new dojox.analytics.Urchin({
				acct: "UA-3572741-1",
				GAonLoad: function(){
					this.trackPageView("/demos/faces");
				}
			});
		}, 1500);

	};

	d.addOnLoad(demo);

})(dojo);
});
