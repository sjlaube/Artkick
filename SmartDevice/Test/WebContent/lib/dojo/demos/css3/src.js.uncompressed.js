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
'dojox/css3/fx':function(){
define([
	"dojo/_base/lang",
	"dojo/_base/connect",	// dojo.connect
	"dojo/dom-style",	// dojo.style
	"dojo/_base/fx",
	"dojo/fx",
	"dojo/_base/html",
	"dojox/html/ext-dojo/style",
	"dojox/fx/ext-dojo/complex"],
function(lang,connectUtil,domStyle,baseFx,coreFx,htmlUtil,htmlStyleExt,complexFx){
	var css3fx = lang.getObject("dojox.css3.fx", true);

	var css3fxFunctions = {
		// summary:
		//		Utilities for animation effects.
		
		puff: function(/*Object*/args){
			// summary:
			//		Returns an animation that will do a "puff" effect on the given node.
			//
			// description:
			//		Fades out an element and scales it to args.endScale.
			//
			return coreFx.combine([baseFx.fadeOut(args),
				this.expand({
					node: args.node,
					endScale: args.endScale || 2
				})
			]);
		},

		expand: function(/*Object*/args){
			// summary:
			//		Returns an animation that expands args.node.
			//
			// description:
			//		Scales an element to args.endScale.
			//
			return baseFx.animateProperty({
				node: args.node,
				properties: {
					transform: { start: "scale(1)", end: "scale(" + [args.endScale || 3] + ")" }
				}
			});
		},

		shrink: function(/*Object*/args){
			// summary:
			//		Returns an animation that shrinks args.node.
			//
			// description:
			//		Shrinks an element, same as expand({ node: node, endScale: .01 });
			//
			return this.expand({
				node: args.node,
				endScale: .01
			});
		},

		rotate: function(/*Object*/args){
			// summary:
			//		Returns an animation that rotates an element.
			//
			// description:
			//		Rotates an element from args.startAngle to args.endAngle.
			//
			return baseFx.animateProperty({
				node: args.node,
				duration: args.duration || 1000,
				properties: {
					transform: { start: "rotate(" + (args.startAngle || "0deg") + ")", end: "rotate(" + (args.endAngle || "360deg") + ")" }
				}
			});
		},

		flip: function(/*Object*/args){
			// summary:
			//		Returns an animation that flips an element around his y axis.
			//
			// description:
			//		Flips an element around his y axis. The default is a 360deg flip
			//		but it is possible to run a partial flip using args.whichAnims.
			//
			// example:
			//	|	// half flip
			//	|	dojox.css3.fx.flip({
			//	|		node: domNode,
			//	|		whichAnim: [0, 1]
			//	|	}).play();
			//
			var anims = [],
				whichAnims = args.whichAnims || [0, 1, 2, 3],
					direction = args.direction || 1,
				transforms = [
					{ start: "scale(1, 1) skew(0deg,0deg)", end: "scale(0, 1) skew(0," + (direction * 30) + "deg)" },
					{ start: "scale(0, 1) skew(0deg," + (direction * 30) + "deg)", end: "scale(-1, 1) skew(0deg,0deg)" },
					{ start: "scale(-1, 1) skew(0deg,0deg)", end: "scale(0, 1) skew(0deg," + (-direction * 30) + "deg)" },
					{ start: "scale(0, 1) skew(0deg," + (-direction * 30) + "deg)", end: "scale(1, 1) skew(0deg,0deg)" }
			];
			for(var i = 0; i < whichAnims.length; i++){
				anims.push(baseFx.animateProperty(
					lang.mixin({
					node: args.node,
					duration: args.duration || 600,
					properties: {
						transform: transforms[whichAnims[i]]
					}}, args)
				));
			}
			return coreFx.chain(anims);
		},

		bounce: function(/*Object*/args){
			// summary:
			//		Returns an animation that does a "bounce" effect on args.node.
			//
			// description:
			//		Vertical bounce animation. The scaleX, scaleY deformation and the
			//		jump height (args.jumpHeight) can be specified.
			//
			var anims = [],
				n = args.node,
				duration = args.duration || 1000,
				scaleX = args.scaleX || 1.2,
				scaleY = args.scaleY || .6,
				ds = htmlUtil.style,
				oldPos = ds(n, "position"),
				newPos = "absolute",
				oldTop = ds(n, "top"),
				combinedAnims = [],
				bTime = 0,
				round = Math.round,
				jumpHeight = args.jumpHeight || 70
			;
			if(oldPos !== "absolute"){
				newPos = "relative";
			}
			var a1 = baseFx.animateProperty({
				node: n,
				duration: duration / 6,
				properties: {
					transform: { start: "scale(1, 1)", end: "scale(" + scaleX + ", " + scaleY + ")" }
				}
			});
			connectUtil.connect(a1, "onBegin", function(){
				ds(n, {
					transformOrigin: "50% 100%",
					position: newPos
				});
			});
			anims.push(a1);
			var a2 = baseFx.animateProperty({
				node: n,
				duration: duration / 6,
				properties: {
					transform: { end: "scale(1, 1)", start: "scale(" + scaleX + ", " + scaleY + ")" }
				}
			});
			combinedAnims.push(a2);
			combinedAnims.push(new baseFx.Animation(lang.mixin({
				curve: [],
				duration: duration / 3,
				delay: duration / 12,
				onBegin: function(){
					bTime = (new Date).getTime();
				},
				onAnimate: function(){
					var cTime = (new Date).getTime();
					ds(n, {
						top: parseInt(ds(n, "top")) - round(jumpHeight*((cTime-bTime)/this.duration)) + "px"
					});
					bTime = cTime;
				}
			}, args)));
			anims.push(coreFx.combine(combinedAnims));
			anims.push(baseFx.animateProperty(lang.mixin({
				duration: duration / 3,
				onEnd: function(){
					ds(n, {
						position: oldPos
					});
				},
				properties:{
					top: oldTop
				}
			}, args)));
			anims.push(a1);
			anims.push(a2);

			return coreFx.chain(anims);
		}
	};
	
	/*=====
	return css3fxFunctions;
	 =====*/
	return lang.mixin(css3fx, css3fxFunctions);
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
'dojox/html/ext-dojo/style':function(){
define(["dojo/_base/kernel", "dojo/dom-style", "dojo/_base/lang", "dojo/_base/html", "dojo/_base/sniff",
		"dojo/_base/window", "dojo/dom", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-attr"], 
	function(kernel, domStyle, lang, Html, has, win, DOM, DOMConstruct, DOMStyle, DOMAttr){
	kernel.experimental("dojox.html.ext-dojo.style");
	var st = lang.getObject("dojox.html.ext-dojo.style", true);
	var HtmlX = lang.getObject("dojox.html");
	// summary:
	//		Extensions to dojo.style adding the css3 "transform" and "transform-origin" properties on IE5.5+
	// description:
	//		A Package to extend the dojo.style function
	//		Supported transformation functions:
	//	 	matrix, translate, translateX, translateY, scale, scaleX, scaleY, rotate, skewX, skewY, skew
	lang.mixin(HtmlX["ext-dojo"].style, {
		supportsTransform: true,
		_toPx: function(measure){
			var ds = Html.style, _conversion = this._conversion;
			if(typeof measure === "number"){
				return measure + "px";
			}else if(measure.toLowerCase().indexOf("px") != -1){
				return measure;
			}
			// "native" conversion in px
			!_conversion.parentNode && DOMConstruct.place(_conversion, win.body());
			ds(_conversion, "margin", measure);
			return ds(_conversion, "margin");
		},
		init: function(){
			var docStyle = win.doc.documentElement.style, extStyle = HtmlX["ext-dojo"].style,
				sget = DOMStyle.get, sset = DOMStyle.set;
			DOMStyle.get = function(/*DOMNode|String*/ node, /*String|Object*/ name){
				var tr = (name == "transform"),
					to = (name == "transformOrigin");
				if(tr){
					return extStyle.getTransform(node);
				}else if(to){
					return extStyle.getTransformOrigin(node);
				}else{
					return arguments.length == 2 ? sget(node, name) : sget(node);
				}
			};
			DOMStyle.set = function(/*DOMNode|String*/ node, /*String|Object*/ name, /*String?*/ value){
				var tr = (name == "transform"),
					to = (name == "transformOrigin"),
					n = DOM.byId(node)
				;
				if(tr){
					return extStyle.setTransform(n, value, true);
				}else if(to){
					return extStyle.setTransformOrigin(n, value);
				}else{
					return arguments.length == 3 ? sset(n, name, value) : sset(n, name);
				}
			};
			// prefixes and property names
			for(var i = 0, tPrefix = ["WebkitT", "MozT", "OT", "msT", "t"]; i < tPrefix.length; i++){
				if(typeof docStyle[tPrefix[i] + "ransform"] !== "undefined"){
					this.tPropertyName = tPrefix[i] + "ransform";
				}
				if(typeof docStyle[tPrefix[i] + "ransformOrigin"] !== "undefined"){
					this.toPropertyName = tPrefix[i] + "ransformOrigin";
				}
			}
			if(this.tPropertyName){
				this.setTransform = function(/*DomNode*/node, /*String*/ transform){
					return sset(node, this.tPropertyName, transform);
				};
				this.getTransform = function(/*DomNode*/node){
					return sget(node, this.tPropertyName);
				};
			}else if(has("ie")){
				this.setTransform = this._setTransformFilter;
				this.getTransform = this._getTransformFilter;
			}
			if(this.toPropertyName){
				this.setTransformOrigin = function(/*DomNode*/node, /*String*/ transformOrigin){
					return sset(node, this.toPropertyName, transformOrigin);
				};
				this.getTransformOrigin = function(/*DomNode*/node){
					return sget(node, this.toPropertyName);
				};
			}else if(has("ie")){
				this.setTransformOrigin = this._setTransformOriginFilter;
				this.getTransformOrigin = this._getTransformOriginFilter;
			}else{
				this.supportsTransform = false;
			}
			this._conversion = DOMConstruct.create("div", {
				style: {
					position: "absolute",
					top: "-100px",
					left: "-100px",
					fontSize: 0,
					width: "0",
					backgroundPosition: "50% 50%"
				}
			});
		},
		_notSupported: function(){
			console.warn("Sorry, this browser doesn't support transform and transform-origin");
		},
		_setTransformOriginFilter: function(/*DomNode*/ node, /*String*/ transformOrigin){
			var to = lang.trim(transformOrigin)
				.replace(" top", " 0")
				.replace("left ", "0 ")
				.replace(" center", "50%")
				.replace("center ", "50% ")
				.replace(" bottom", " 100%")
				.replace("right ", "100% ")
				.replace(/\s+/, " "),
				toAry = to.split(" "),
				n = DOM.byId(node),
				t = this.getTransform(n),
				validOrigin = true
			;
			for(var i = 0; i < toAry.length; i++){
				validOrigin = validOrigin && /^0|(\d+(%|px|pt|in|pc|mm|cm))$/.test(toAry[i]);
				if(toAry[i].indexOf("%") == -1){
					toAry[i] = this._toPx(toAry[i]);
				}
			}
			if(!validOrigin || !toAry.length || toAry.length > 2 ){
				return transformOrigin;
			}
			Html.attr(n, "dojo-transform-origin", toAry.join(" "));
			t && this.setTransform(node, t);
			return transformOrigin;
		},
		_getTransformOriginFilter: function(/*DomNode*/ node){
			return Html.attr(node, "dojo-transform-origin") || "50% 50%";
		},
		_setTransformFilter: function(/*DomNode*/ node, /*String*/ transform){
			// Using the Matrix Filter to implement the transform property on IE
			var t = transform.replace(/\s/g, ""),
				n = DOM.byId(node),
				transforms = t.split(")"),
				toRad = 1, toRad1 = 1,
				mstr = "DXImageTransform.Microsoft.Matrix",
				hasAttr = DOMAttr.has,
				attr = Html.attr,
				// Math functions
				PI = Math.PI, cos = Math.cos, sin = Math.sin, tan = Math.tan, max = Math.max, min = Math.min, abs = Math.abs,
				degToRad = PI/180, gradToRad = PI/200,

				// current transform
				ct = "", currentTransform = "",
				matchingTransforms = [],
				x0 = 0, y0 = 0, dx = 0, dy = 0, xc = 0, yc = 0, a = 0,

				// default transform, identity matrix
				m11 = 1, m12 = 0, m21 = 0, m22 = 1,

				// no translation
				tx = 0, ty = 0,
				props = [m11, m12, m21, m22, tx, ty],
				hasMatrix = false,
				ds = Html.style,
				newPosition = ds(n, "position") == "absolute" ? "absolute" : "relative",
				w = ds(n, "width") + ds(n, "paddingLeft") + ds(n, "paddingRight"),
				h = ds(n, "height") + ds(n, "paddingTop") + ds(n, "paddingBottom"),
				toPx = this._toPx
			;

			!hasAttr(n, "dojo-transform-origin") && this.setTransformOrigin(n, "50% 50%");

			for(var i = 0, l = transforms.length; i < l; i++){
				matchingTransforms = transforms[i].match(/matrix|rotate|scaleX|scaleY|scale|skewX|skewY|skew|translateX|translateY|translate/);
				currentTransform = matchingTransforms ? matchingTransforms[0] : "";
				switch(currentTransform){
					case "matrix":
						// generic transformation
						//
						// matrix:
						// m11        m12
						//
						// m21        m22
						//
						ct = transforms[i].replace(/matrix\(|\)/g, "");
						var matrix = ct.split(",");
						m11 = props[0]*matrix[0] + props[1]*matrix[2];
						m12 = props[0]*matrix[1] + props[1]*matrix[3];
						m21 = props[2]*matrix[0] + props[3]*matrix[2];
						m22 = props[2]*matrix[1] + props[3]*matrix[3];
						tx = props[4] + matrix[4];
						ty = props[5] + matrix[5];
					break;
					case "rotate":
						// rotate
						//
						// rotation angle:
						// a (rad, deg or grad)
						//
						// matrix:
						// cos(a)     -sin(a)
						//
						// sin(a)     cos(a)
						//
						ct = transforms[i].replace(/rotate\(|\)/g, "");
						toRad = ct.indexOf("deg") != -1 ? degToRad : ct.indexOf("grad") != -1 ? gradToRad : 1;
						a = parseFloat(ct)*toRad;
						var s = sin(a),
							c = cos(a)
						;
						m11 = props[0]*c + props[1]*s;
						m12 = -props[0]*s + props[1]*c;
						m21 = props[2]*c + props[3]*s;
						m22 = -props[2]*s + props[3]*c;
					break;
					case "skewX":
						// skewX
						//
						// skew angle:
						// a (rad, deg or grad)
						//
						// matrix:
						// 1          tan(a)
						//
						// 0          1
						//
						ct = transforms[i].replace(/skewX\(|\)/g, "");
						toRad = ct.indexOf("deg") != -1 ? degToRad : ct.indexOf("grad") != -1 ? gradToRad : 1;
						var ta = tan(parseFloat(ct)*toRad);
						m11 = props[0];
						m12 = props[0]*ta + props[1];
						m21 = props[2];
						m22 = props[2]*ta + props[3];
					break;
					case "skewY":
						// skewY
						//
						// skew angle:
						// a (rad, deg or grad)
						//
						// matrix:
						// 1          0
						//
						// tan(a)     1
						//
						ct = transforms[i].replace(/skewY\(|\)/g, "");
						toRad = ct.indexOf("deg") != -1 ? degToRad : ct.indexOf("grad") != -1 ? gradToRad : 1;
						ta = tan(parseFloat(ct)*toRad);
						m11 = props[0] + props[1]*ta;
						m12 = props[1];
						m21 = props[2] + props[3]*ta;
						m22 = props[3];
					break;
					case "skew":
						// skew
						//
						// skew angles:
						// a0 (rad, deg or grad)
						// a1 (rad, deg or grad)
						//
						// matrix:
						// 1          tan(a0)
						//
						// tan(a1)    1
						//
						ct = transforms[i].replace(/skew\(|\)/g, "");
						var skewAry = ct.split(",");
						skewAry[1] = skewAry[1] || "0";
						toRad = skewAry[0].indexOf("deg") != -1 ? degToRad : skewAry[0].indexOf("grad") != -1 ? gradToRad : 1;
						toRad1 = skewAry[1].indexOf("deg") != -1 ? degToRad : skewAry[1].indexOf("grad") != -1 ? gradToRad : 1;
						var a0 = tan(parseFloat(skewAry[0])*toRad),
							a1 = tan(parseFloat(skewAry[1])*toRad1)
						;
						m11 = props[0] + props[1]*a1;
						m12 = props[0]*a0 + props[1];
						m21 = props[2]+ props[3]*a1;
						m22 = props[2]*a0 + props[3];
					break;
					case "scaleX":
						// scaleX
						//
						// scale factor:
						// sx
						//
						// matrix:
						// sx         0
						//
						// 0          1
						//
						ct = parseFloat(transforms[i].replace(/scaleX\(|\)/g, "")) || 1;
						m11 = props[0]*ct;
						m12 = props[1];
						m21 = props[2]*ct;
						m22 = props[3];
					break;
					case "scaleY":
						// scaleY
						//
						// scale factor:
						// sy
						//
						// matrix:
						// 1          0
						//
						// 0          sy
						//
						ct = parseFloat(transforms[i].replace(/scaleY\(|\)/g, "")) || 1;
						m11 = props[0];
						m12 = props[1]*ct;
						m21 = props[2];
						m22 = props[3]*ct;
					break;
					case "scale":
						// scale
						//
						// scale factor:
						// sx, sy
						//
						// matrix:
						// sx         0
						//
						// 0          sy
						//
						ct = transforms[i].replace(/scale\(|\)/g, "");
						var scaleAry = ct.split(",");
						scaleAry[1] = scaleAry[1] || scaleAry[0];
						m11 = props[0]*scaleAry[0];
						m12 = props[1]*scaleAry[1];
						m21 = props[2]*scaleAry[0];
						m22 = props[3]*scaleAry[1];
					break;
					case "translateX":
						ct = parseInt(transforms[i].replace(/translateX\(|\)/g, "")) || 1;
						m11 = props[0];
						m12 = props[1];
						m21 = props[2];
						m22 = props[3];
						tx = toPx(ct);
						tx && attr(n, "dojo-transform-matrix-tx", tx);
					break;
					case "translateY":
						ct = parseInt(transforms[i].replace(/translateY\(|\)/g, "")) || 1;
						m11 = props[0];
						m12 = props[1];
						m21 = props[2];
						m22 = props[3];
						ty = toPx(ct);
						ty && attr(n, "dojo-transform-matrix-ty", ty);
					break;
					case "translate":
						ct = transforms[i].replace(/translate\(|\)/g, "");
						m11 = props[0];
						m12 = props[1];
						m21 = props[2];
						m22 = props[3];
						var translateAry = ct.split(",");
						translateAry[0] = parseInt(toPx(translateAry[0])) || 0;
						translateAry[1] = parseInt(toPx(translateAry[1])) || 0;
						tx = translateAry[0];
						ty = translateAry[1];
						tx && attr(n, "dojo-transform-matrix-tx", tx);
						ty && attr(n, "dojo-transform-matrix-ty", ty);
					break;
				}
				props = [m11, m12, m21, m22, tx, ty];
			}
			// test
			var Bx = min(w*m11 + h*m12, min(min(w*m11, h*m12), 0)),
				By = min(w*m21 + h*m22, min(min(w*m21, h*m22), 0))
			;
			dx = -Bx;
			dy = -By;
			if(has("ie") < 8){
				// on IE < 8 the node must have hasLayout = true
				n.style.zoom = "1";
				if(newPosition != "absolute"){
					var parentWidth = ds(node.parentNode, "width"),
						tw = abs(w*m11),
						th = abs(h*m12),
						wMax = max(tw + th, max(max(th, tw), 0))
					;
					dx -= (wMax - w) / 2 - (parentWidth > wMax ? 0 : (wMax - parentWidth) / 2);
				}
			}else if(has("ie") == 8){
				// IE8 bug, a filter is applied to positioned descendants
				// only if the parent has z-index
				ds(n, "zIndex") == "auto" && (n.style.zIndex = "0");
			}

			try{
				hasMatrix = !!n.filters.item(mstr);
			}catch(e){
				hasMatrix = false;
			}
			if(hasMatrix){
				n.filters.item(mstr).M11 = m11;
				n.filters.item(mstr).M12 = m12;
				n.filters.item(mstr).M21 = m21;
				n.filters.item(mstr).M22 = m22;
				// use 'nearest' for a faster transform
				n.filters.item(mstr).filterType = 'bilinear';
				n.filters.item(mstr).Dx = 0;
				n.filters.item(mstr).Dy = 0;
				n.filters.item(mstr).sizingMethod = 'auto expand';
			}else{
				n.style.filter +=
					" progid:" + mstr + "(M11=" + m11 +
					",M12=" + m12 +
					",M21=" + m21 +
					",M22=" + m22 +
					",FilterType='bilinear',Dx=0,Dy=0,sizingMethod='auto expand')"
				;
			}
			tx = parseInt(attr(n, "dojo-transform-matrix-tx") || "0");
			ty = parseInt(attr(n, "dojo-transform-matrix-ty") || "0");

			// transform origin
			var toAry = attr(n, "dojo-transform-origin").split(" ");

			for(i = 0; i < 2; i++){
				toAry[i] = toAry[i] || "50%";
			}
			xc = (toAry[0].toString().indexOf("%") != -1) ? w * parseInt(toAry[0]) * .01 : toAry[0];
			yc = (toAry[1].toString().indexOf("%") != -1) ? h * parseInt(toAry[1]) * .01 : toAry[1];
			if(hasAttr(n, "dojo-startX")){
				x0 = parseInt(attr(n, "dojo-startX"));
			}else{
				x0 = parseInt(ds(n, "left"));
				attr(n, "dojo-startX", newPosition == "absolute" ? x0 : "0");
			}
			if(hasAttr(n, "dojo-startY")){
				y0 = parseInt(attr(n, "dojo-startY"));
			}else{
				y0 = parseInt(ds(n, "top"));
				attr(n, "dojo-startY", newPosition == "absolute" ? y0 : "0");
			}
			ds(n, {
				position: newPosition,
				left: x0 - parseInt(dx) + parseInt(xc) - ((parseInt(xc) - tx)*m11 + (parseInt(yc) - ty)*m12) + "px",
				top:  y0 - parseInt(dy) + parseInt(yc) - ((parseInt(xc) - tx)*m21 + (parseInt(yc) - ty)*m22) + "px"
			});
			return transform;
		},
		_getTransformFilter: function(/*DomNode*/ node){
			try{
				var n = DOM.byId(node),
					item = n.filters.item(0)
				;
				return "matrix(" + item.M11 + ", " + item.M12 + ", " + item.M21 + ", " +
					item.M22 + ", " + (Html.attr(node, "dojo-transform-tx") || "0") + ", " + (Html.attr(node, "dojo-transform-ty") || "0") + ")";
			}catch(e){
				return "matrix(1, 0, 0, 1, 0, 0)";
			}
		},
		setTransform: function(){
			this._notSupported();
		},
		setTransformOrigin: function(){
			this._notSupported();
		}
	});

	HtmlX["ext-dojo"].style.init();
	return Html.style;
});

},
'dojox/fx/ext-dojo/complex':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array","dojo/_base/declare", "dojo/_base/connect", 
	"dojo/_base/Color", "dojo/_base/fx", "dojo/fx"], 
	function(dojo, lang, arrayUtil, declare, connectUtil, Color, baseFx, coreFx){
	lang.getObject("dojox.fx.ext-dojo.complex", true);

	/*=====
	return {
		// summary:
		//		Extends dojo/_base/fx.animateProperty to animate a "complex property". The primary example is the
		//		clip style: rect(10px 30px 10px 50px).
		//		Note this can also be used with (and is actually intended for)
		//		CSS3 properties, such as transform:
		//		transform: rotate(10deg) translateX(0px)
		// description:
		//		The standard animation doesn't know what to do with something like
		//		rect(...). This class identifies complex properties by they being a
		//		string and having parenthesis. If so, that property is made into a
		//		dojox.fx._Complex object and the getValue() is obtained from
		//		there.
		// example:
		//		|	var ani = dojo.animateProperty({
		//		|		node:dojo.byId("myDiv"),
		//		|		duration:600,
		//		|		properties:{
		//		|			clip:{start:'rect(0px 50px 50px 0px)', end:'rect(10px 30px 30px 10px)'}
		//		|		}
		//		|	}).play();
	};
	=====*/

	var da = baseFx.animateProperty;
	dojo.animateProperty = baseFx.animateProperty = function(options){
		// summary:
		//		An extension of dojo.animateProperty which adds functionality
		//		that animates a "complex property". The primary example is the
		//		clip style: rect(10px 30px 10px 50px).
		//		Note this can also be used with (and is actually intended for)
		//		CSS3 properties, such as transform:
		//		transform: rotate(10deg) translateX(0px)
		// description:
		//		The standard animation doesn't know what to do with something like
		//		rect(...). This class identifies complex properties by they being a
		//		string and having parenthesis. If so, that property is made into a
		//		dojox.fx._Complex object and the getValue() is obtained from
		//		there.
		// example:
		//		|	var ani = dojo.animateProperty({
		//		|		node:dojo.byId("myDiv"),
		//		|		duration:600,
		//		|		properties:{
		//		|			clip:{start:'rect(0px 50px 50px 0px)', end:'rect(10px 30px 30px 10px)'}
		//		|		}
		//		|	}).play();

		var ani = da(options);

		connectUtil.connect(ani, "beforeBegin", function(){
			// dojo.Animate original still invokes and still
			// works. We're appending this functionality to
			// modify targeted properties.
			ani.curve.getValue = function(r){
				// Overwriting dojo.Animate's curve.getValue
				// This is mostly duplicate code, except it looks
				// for an instance of dojox.fx._Complex.
				var ret = {};
				for(var p in this._properties){
					var prop = this._properties[p],
						start = prop.start;
					if(start instanceof dojo.Color){
						ret[p] = dojo.blendColors(start, prop.end, r, prop.tempColor).toCss();
					}else if(start instanceof dojox.fx._Complex){
						ret[p] = start.getValue(r);
					}else if(!dojo.isArray(start)){
						ret[p] = ((prop.end - start) * r) + start + (p != "opacity" ? prop.units || "px" : 0);
					}
				}
				return ret;
			};

			// this.properties has already been set, as has this.curve._properties.
			// We're fixing the props in curve which will have NaN attributes from
			// our string property.
			var pm = {};
			for(var p in this.properties){
				var o = this.properties[p];
				if(typeof(o.start) == "string" && /\(/.test(o.start)){
					this.curve._properties[p].start = new dojox.fx._Complex(o);
				}
			}

		});
		return ani; // dojo.Animation
	};
	/*=====
	// Hide this override from the doc parser because it obscures the original definition of animateProperty()
	// TODO: rewrite override as around advice, so we don't need faux-return value above.
	dojo.animateProperty = baseFx.animateProperty = da;
	=====*/

	return declare("dojox.fx._Complex", null, {
		// summary:
		//		A class that takes a complex property such as
		//		clip style: rect(10px 30px 10px 50px), and breaks it
		//		into separate animatable units. The object has a getValue()
		//		that will return a string with the modified units.

		PROP: /\([\w|,|+|\-|#|\.|\s]*\)/g,
		constructor: function(options){
			var beg = options.start.match(this.PROP);
			var end = options.end.match(this.PROP);

			var begProps = arrayUtil.map(beg, this.getProps, this);
			var endProps = arrayUtil.map(end, this.getProps, this);

			this._properties = {};
			this.strProp = options.start;
			arrayUtil.forEach(begProps, function(prop, i){
				arrayUtil.forEach(prop, function(p, j){
					this.strProp = this.strProp.replace(p, "PROP_"+i+""+j);
					this._properties["PROP_"+i+""+j] = this.makePropObject(p, endProps[i][j])
				},this);
			},this);
		},

		getValue: function(/*Float*/r){
			// summary:
			//		Returns a string with teh same integrity as the
			//		original star and end, but with the modified units.
			var str = this.strProp, u;
			for(var nm in this._properties){
				var v, o = this._properties[nm];
				if(o.units == "isColor"){
					v = Color.blendColors(o.beg, o.end, r).toCss(false);
					u = "";
				}else{
					v = ((o.end - o.beg) * r) + o.beg;
					u = o.units;
				}
				str = str.replace(nm, v + u);
			}

			return str; // String
		},

		makePropObject: function(/* String */beg, /* String */end){
			// summary:
			//		Returns an object that stores the numeric value and
			//		units of the beggining and ending properties.

			var b = this.getNumAndUnits(beg);
			var e = this.getNumAndUnits(end);
			return {
				beg:b.num,
				end:e.num,
				units:b.units
			}; // Object
		},

		getProps: function(/* String */str){
			// summary:
			//		Helper function that splits a stringified set of properties
			//		into individual units.

			str = str.substring(1, str.length-1);
			var s;
			if(/,/.test(str)){
				str = str.replace(/\s/g, "");
				s = str.split(",");
			}else{
				str = str.replace(/\s{2,}/g, " ");
				s = str.split(" ");
			}
			return s; // String
		},
		getNumAndUnits: function(prop){
			// summary:
			//		Helper function that returns the numeric verion of the string
			//		property (or dojo.Color object) and the unit in which it was
			//		defined.

			if(!prop){ return {}; }
			if(/#/.test(prop)){
				return {
					num: new Color(prop),
					units:"isColor"
				}; // Object
			}
			var o = {
				num:parseFloat(/-*[\d\.\d|\d]{1,}/.exec(prop).join(""))
			};
			o.units = /[a-z]{1,}/.exec(prop);//.join("");
			o.units = o.units && o.units.length ? o.units.join("") : "";
			return o; // Object
		}
	});
});

}}});
// wrapped by build app
define("demos/css3/src", ["dojo","dijit","dojox","dojo/require!dojox/css3/fx"], function(dojo,dijit,dojox){
dojo.provide("demos.css3.src");

dojo.require("dojox.css3.fx");

dojo.declare("CSS3Demo", null, {
	menuNode: null,
	increment: 360,
	angle: 0,
	constructor: function(){
		var effects = ["puff", "bounce", "shrink", "expand", "rotate", "flip"];
		var ribbon = dojo.create("div", {
			innerHTML: "dojox.css3",
			style: {
				position: "absolute",
				left: "-45px",
				top: "30px",
				background: "#000",
				color: "#faa",
				fontSize: "1em",
				height: "1.4em",
				lineHeight: "1.4em",
				borderTop: "3px solid #777",
				borderBottom: "3px solid #777",
				width: "200px",
				textAlign: "center"
			}
		}, dojo.body());
		dojo.style(ribbon,{
				transform: "rotate(-45deg)"
		});
		var resetBtn = dojo.create("button", {
			innerHTML: "reset",
			style: {
				position: "absolute",
				right: "10px",
				top: "30px",
				background: "#ccc",
				color: "#222",
				fontSize: "1em",
				lineHeight: "1.4em",
				width: "200px",
				textAlign: "center"
			}
		}, dojo.body());
		dojo.connect(resetBtn, "onclick", function(){
			dojo.query(".box").forEach(function(node){
				dojo.style(node, {
					transform: "scale(1)",
					opacity: "1"
				});
			});
		});
		this.increment = 360 / effects.length;
		this.menuNode = dojo.create("div", {
			className: "menu"
		}, dojo.body());
		for(var i = 0, l = effects.length; i < l; i++){
			var box = dojo.create("div", {
				innerHTML: "<span>" + effects[i] + "</span>",
				className: "box",
				style: {
					left: (i % 3) * 200 + "px",
					top: Math.floor(i / 3)*200 + "px"
				}
			}, this.menuNode);
			dojo.connect(box, "onclick", (function(b, x){
				return function(){
					dojox.css3.fx[effects[x]]({
						node: b
					}).play();
				}
			})(box, i));
		}
	}
});

dojo.ready(function(){
	new CSS3Demo;
});

});
