require({cache:{
'dojox/dgauges/CircularGauge':function(){
define(["dojo/_base/declare", "dojo/dom-geometry", "dojox/gfx", "./GaugeBase"], function(declare, domGeom, gfx, GaugeBase){
	return declare("dojox.dgauges.CircularGauge", GaugeBase, {
		// summary:
		//		The base class for circular gauges.
		//		You can create custom circular or semi-circular gauges by extending this class.
		//		See dojox.dgauges.components.default.CircularLinearGauge.js for an example of circular gauge.
		
		_transformProperties: null,
		
		refreshRendering: function(){
			if(this._widgetBox.w <= 0 || this._widgetBox.h <= 0){
				return;
			}
			
			for(var key in this._elementsIndex){
				this._elementsRenderers[key] = this._elementsIndex[key].refreshRendering();
			}
			
			// Maximize the drawing area and center the gauge
			var bb = this._computeBoundingBox(this._gfxGroup);
			
			var naturalRatio = (bb.x + bb.width) / (bb.y + bb.height);
			var widgetWidth = this._widgetBox.w;
			var widgetHeight = this._widgetBox.h;
			var widgetRatio = this._widgetBox.w / this._widgetBox.h;
			
			var xpos = 0;
			var ypos = 0;
			var h = 0;
			var w = 0;
			if(naturalRatio > widgetRatio){
				w = widgetWidth;
				h = w / naturalRatio;
				ypos = (widgetHeight - h) / 2;
			}else{
				h = widgetHeight;
				w = h * naturalRatio;
				xpos = (widgetWidth - w) / 2;
			}
			var scaleFactor = Math.max(w / (bb.x + bb.width), h / (bb.y + bb.height));
			this._transformProperties = {scale:scaleFactor, tx:xpos, ty:ypos};
			this._gfxGroup.setTransform([gfx.matrix.scale(scaleFactor), gfx.matrix.translate(xpos / scaleFactor, ypos / scaleFactor)]);
		},
		
		_gaugeToPage: function(px, py){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(this._transformProperties){
				var np = domGeom.position(this.domNode, true);
				return {x: np.x + px * this._transformProperties.scale + this._transformProperties.tx, y: np.y + py * this._transformProperties.scale + this._transformProperties.ty};
			}else{
				return null;
			}
		}
	});
});

},
'dojox/gfx':function(){
define(["dojo/_base/lang", "./gfx/_base", "./gfx/renderer!"], 
  function(lang, gfxBase, renderer){
	// module:
	//		dojox/gfx
	// summary:
	//		This the root of the Dojo Graphics package
	gfxBase.switchTo(renderer);
	return gfxBase;
});

},
'dojox/gfx/_base':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/Color", "dojo/_base/sniff", "dojo/_base/window",
	    "dojo/_base/array","dojo/dom", "dojo/dom-construct","dojo/dom-geometry"],
function(kernel, lang, Color, has, win, arr, dom, domConstruct, domGeom){
	// module:
	//		dojox/gfx
	// summary:
	//		This module contains common core Graphics API used by different graphics renderers.

	var g = lang.getObject("dojox.gfx", true),
		b = g._base = {};
	
	// candidates for dojox.style (work on VML and SVG nodes)
	g._hasClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		
		// return (new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)	// Boolean
		var cls = node.getAttribute("className");
		return cls && (" " + cls + " ").indexOf(" " + classStr + " ") >= 0;  // Boolean
	};
	g._addClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node.
		var cls = node.getAttribute("className") || "";
		if(!cls || (" " + cls + " ").indexOf(" " + classStr + " ") < 0){
			node.setAttribute("className", cls + (cls ? " " : "") + classStr);
		}
	};
	g._removeClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Removes classes from node.
		var cls = node.getAttribute("className");
		if(cls){
			node.setAttribute(
				"className",
				cls.replace(new RegExp('(^|\\s+)' + classStr + '(\\s+|$)'), "$1$2")
			);
		}
	};

	// candidate for dojox.html.metrics (dynamic font resize handler is not implemented here)

	//		derived from Morris John's emResized measurer
	b._getFontMeasurements = function(){
		// summary:
		//		Returns an object that has pixel equivilents of standard font
		//		size values.
		var heights = {
			'1em': 0, '1ex': 0, '100%': 0, '12pt': 0, '16px': 0, 'xx-small': 0,
			'x-small': 0, 'small': 0, 'medium': 0, 'large': 0, 'x-large': 0,
			'xx-large': 0
		};
		var p;

		if(has("ie")){
			//		we do a font-size fix if and only if one isn't applied already.
			// NOTE: If someone set the fontSize on the HTML Element, this will kill it.
			win.doc.documentElement.style.fontSize="100%";
		}

		//		set up the measuring node.
		var div = domConstruct.create("div", {style: {
				position: "absolute",
				left: "0",
				top: "-100px",
				width: "30px",
				height: "1000em",
				borderWidth: "0",
				margin: "0",
				padding: "0",
				outline: "none",
				lineHeight: "1",
				overflow: "hidden"
			}}, win.body());

		//		do the measurements.
		for(p in heights){
			div.style.fontSize = p;
			heights[p] = Math.round(div.offsetHeight * 12/16) * 16/12 / 1000;
		}

		win.body().removeChild(div);
		return heights; //object
	};

	var fontMeasurements = null;

	b._getCachedFontMeasurements = function(recalculate){
		if(recalculate || !fontMeasurements){
			fontMeasurements = b._getFontMeasurements();
		}
		return fontMeasurements;
	};

	// candidate for dojox.html.metrics

	var measuringNode = null, empty = {};
	b._getTextBox = function(	/*String*/ text,
								/*Object*/ style,
								/*String?*/ className){
		var m, s, al = arguments.length;
		var i;
		if(!measuringNode){
			measuringNode = domConstruct.create("div", {style: {
				position: "absolute",
				top: "-10000px",
				left: "0"
			}}, win.body());
		}
		m = measuringNode;
		// reset styles
		m.className = "";
		s = m.style;
		s.borderWidth = "0";
		s.margin = "0";
		s.padding = "0";
		s.outline = "0";
		// set new style
		if(al > 1 && style){
			for(i in style){
				if(i in empty){ continue; }
				s[i] = style[i];
			}
		}
		// set classes
		if(al > 2 && className){
			m.className = className;
		}
		// take a measure
		m.innerHTML = text;

		if(m["getBoundingClientRect"]){
			var bcr = m.getBoundingClientRect();
			return {l: bcr.left, t: bcr.top, w: bcr.width || (bcr.right - bcr.left), h: bcr.height || (bcr.bottom - bcr.top)};
		}else{
			return domGeom.getMarginBox(m);
		}
	};

	b._computeTextLocation = function(/*g.defaultTextShape*/textShape, /*Number*/width, /*Number*/height, /*Boolean*/fixHeight) {
		var loc = {}, align = textShape.align;
		switch (align) {
			case 'end':
				loc.x = textShape.x - width;
				break;
			case 'middle':
				loc.x = textShape.x - width / 2;
				break;
			default:
				loc.x = textShape.x;
				break;
		}
		var c = fixHeight ? 0.75 : 1;
		loc.y = textShape.y - height*c; // **rough** approximation of the ascent...
		return loc;
	};
	b._computeTextBoundingBox = function(/*shape.Text*/s){
		// summary:
		//		Compute the bbox of the given shape.Text instance. Note that this method returns an
		//		approximation of the bbox, and should be used when the underlying renderer cannot provide precise metrics.
		if(!g._base._isRendered(s)){
			return {x:0, y:0, width:0, height:0};
		}
		var loc, textShape = s.getShape(),
			font = s.getFont() || g.defaultFont,
			w = s.getTextWidth(),
			h = g.normalizedLength(font.size);
		loc = b._computeTextLocation(textShape, w, h, true);
		return {
			x: loc.x,
			y: loc.y,
			width: w,
			height: h
		};
	};
	b._isRendered = function(/*Shape*/s){
		var p = s.parent;
		while(p && p.getParent){
			p = p.parent;
		}
		return p !== null;
	};

	// candidate for dojo.dom

	var uniqueId = 0;
	b._getUniqueId = function(){
		// summary:
		//		returns a unique string for use with any DOM element
		var id;
		do{
			id = kernel._scopeName + "xUnique" + (++uniqueId);
		}while(dom.byId(id));
		return id;
	};

	// IE10

	b._fixMsTouchAction = function(/*dojox/gfx/shape.Surface*/surface){
		var r = surface.rawNode;
		if (typeof r.style.msTouchAction != 'undefined')
			r.style.msTouchAction = "none";
	};

	/*=====
	g.Stroke = {
		// summary:
		//		A stroke defines stylistic properties that are used when drawing a path.

		// color: String
		//		The color of the stroke, default value 'black'.
		color: "black",

		// style: String
		//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
		style: "solid",

		// width: Number
		//		The width of a stroke, default value 1.
		width: 1,

		// cap: String
		//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
		cap: "butt",

		// join: Number
		//		The join style to use when combining path segments. Default value 4.
		join: 4
	};
	
	g.Fill = {
		// summary:
		//		Defines how to fill a shape. Four types of fills can be used: solid, linear gradient, radial gradient and pattern.
		//		See dojox/gfx.LinearGradient, dojox/gfx.RadialGradient and dojox/gfx.Pattern respectively for more information about the properties supported by each type.
		
		// type: String?
		//		The type of fill. One of 'linear', 'radial', 'pattern' or undefined. If not specified, a solid fill is assumed.
		type:"",
		
		// color: String|dojo/Color?
		//		The color of a solid fill type.
		color:null,
		
	};
	
	g.LinearGradient = {
		// summary:
		//		An object defining the default stylistic properties used for Linear Gradient fills.
		//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.

		// type: String
		//		Specifies this object is a Linear Gradient, value 'linear'
		type: "linear",

		// x1: Number
		//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
		x1: 0,

		// y1: Number
		//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
		y1: 0,

		// x2: Number
		//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
		x2: 100,

		// y2: Number
		//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
		y2: 100,

		// colors: Array
		//		An array of colors at given offsets (from the start of the line).  The start of the line is
		//		defined at offest 0 with the end of the line at offset 1.
		//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
		colors: []
	};
	
	g.RadialGradient = {
		// summary:
		//		Specifies the properties for RadialGradients using in fills patterns.

		// type: String
		//		Specifies this is a RadialGradient, value 'radial'
		type: "radial",

		// cx: Number
		//		The X coordinate of the center of the radial gradient, default value 0.
		cx: 0,

		// cy: Number
		//		The Y coordinate of the center of the radial gradient, default value 0.
		cy: 0,

		// r: Number
		//		The radius to the end of the radial gradient, default value 100.
		r: 100,

		// colors: Array
		//		An array of colors at given offsets (from the center of the radial gradient).
		//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
		//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
		colors: []
	};
	
	g.Pattern = {
		// summary:
		//		An object specifying the default properties for a Pattern using in fill operations.

		// type: String
		//		Specifies this object is a Pattern, value 'pattern'.
		type: "pattern",

		// x: Number
		//		The X coordinate of the position of the pattern, default value is 0.
		x: 0,

		// y: Number
		//		The Y coordinate of the position of the pattern, default value is 0.
		y: 0,

		// width: Number
		//		The width of the pattern image, default value is 0.
		width: 0,

		// height: Number
		//		The height of the pattern image, default value is 0.
		height: 0,

		// src: String
		//		A url specifying the image to use for the pattern.
		src: ""
	};

	g.Text = {
		//	summary:
		//		A keyword argument object defining both the text to be rendered in a VectorText shape,
		//		and specifying position, alignment, and fitting.
		//	text: String
		//		The text to be rendered.
		//	x: Number?
		//		The left coordinate for the text's bounding box.
		//	y: Number?
		//		The top coordinate for the text's bounding box.
		//	width: Number?
		//		The width of the text's bounding box.
		//	height: Number?
		//		The height of the text's bounding box.
		//	align: String?
		//		The alignment of the text, as defined in SVG. Can be "start", "end" or "middle".
		//	fitting: Number?
		//		How the text is to be fitted to the bounding box. Can be 0 (no fitting), 1 (fitting based on
		//		passed width of the bounding box and the size of the font), or 2 (fit text to the bounding box,
		//		and ignore any size parameters).
		//	leading: Number?
		//		The leading to be used between lines in the text.
		//	decoration: String?
		//		Any text decoration to be used.
	};

	g.Font = {
		// summary:
		//		An object specifying the properties for a Font used in text operations.
	
		// type: String
		//		Specifies this object is a Font, value 'font'.
		type: "font",
	
		// style: String
		//		The font style, one of 'normal', 'bold', default value 'normal'.
		style: "normal",
	
		// variant: String
		//		The font variant, one of 'normal', ... , default value 'normal'.
		variant: "normal",
	
		// weight: String
		//		The font weight, one of 'normal', ..., default value 'normal'.
		weight: "normal",
	
		// size: String
		//		The font size (including units), default value '10pt'.
		size: "10pt",
	
		// family: String
		//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
		family: "serif"
	};

	=====*/

	lang.mixin(g, {
		// summary:
		//		defines constants, prototypes, and utility functions for the core Graphics API

		// default shapes, which are used to fill in missing parameters
		defaultPath: {
			// summary:
			//		Defines the default Path prototype object.

			// type: String
			//		Specifies this object is a Path, default value 'path'.
			type: "path", 

			// path: String
			//		The path commands. See W32C SVG 1.0 specification.
			//		Defaults to empty string value.
			path: ""
		},
		defaultPolyline: {
			// summary:
			//		Defines the default PolyLine prototype.

			// type: String
			//		Specifies this object is a PolyLine, default value 'polyline'.
			type: "polyline",

			// points: Array
			//		An array of point objects [{x:0,y:0},...] defining the default polyline's line segments. Value is an empty array [].
			points: []
		},
		defaultRect: {
			// summary:
			//		Defines the default Rect prototype.

			// type: String
			//		Specifies this default object is a type of Rect. Value is 'rect'
			type: "rect",

			// x: Number
			//		The X coordinate of the default rectangles position, value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the default rectangle's position, value 0.
			y: 0,

			// width: Number
			//		The width of the default rectangle, value 100.
			width: 100,

			// height: Number
			//		The height of the default rectangle, value 100.
			height: 100,

			// r: Number
			//		The corner radius for the default rectangle, value 0.
			r: 0
		},
		defaultEllipse: {
			// summary:
			//		Defines the default Ellipse prototype.

			// type: String
			//		Specifies that this object is a type of Ellipse, value is 'ellipse'
			type: "ellipse",

			// cx: Number
			//		The X coordinate of the center of the ellipse, default value 0.
			cx: 0,

			// cy: Number
			//		The Y coordinate of the center of the ellipse, default value 0.
			cy: 0,

			// rx: Number
			//		The radius of the ellipse in the X direction, default value 200.
			rx: 200,

			// ry: Number
			//		The radius of the ellipse in the Y direction, default value 200.
			ry: 100
		},
		defaultCircle: {
			// summary:
			//		An object defining the default Circle prototype.

			// type: String
			//		Specifies this object is a circle, value 'circle'
			type: "circle",

			// cx: Number
			//		The X coordinate of the center of the circle, default value 0.
			cx: 0,
			// cy: Number
			//		The Y coordinate of the center of the circle, default value 0.
			cy: 0,

			// r: Number
			//		The radius, default value 100.
			r: 100
		},
		defaultLine: {
			// summary:
			//		An object defining the default Line prototype.

			// type: String
			//		Specifies this is a Line, value 'line'
			type: "line",

			// x1: Number
			//		The X coordinate of the start of the line, default value 0.
			x1: 0,

			// y1: Number
			//		The Y coordinate of the start of the line, default value 0.
			y1: 0,

			// x2: Number
			//		The X coordinate of the end of the line, default value 100.
			x2: 100,

			// y2: Number
			//		The Y coordinate of the end of the line, default value 100.
			y2: 100
		},
		defaultImage: {
			// summary:
			//		Defines the default Image prototype.

			// type: String
			//		Specifies this object is an image, value 'image'.
			type: "image",

			// x: Number
			//		The X coordinate of the image's position, default value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the image's position, default value 0.
			y: 0,

			// width: Number
			//		The width of the image, default value 0.
			width: 0,

			// height: Number
			//		The height of the image, default value 0.
			height: 0,

			// src: String
			//		The src url of the image, defaults to empty string.
			src: ""
		},
		defaultText: {
			// summary:
			//		Defines the default Text prototype.

			// type: String
			//		Specifies this is a Text shape, value 'text'.
			type: "text",

			// x: Number
			//		The X coordinate of the text position, default value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the text position, default value 0.
			y: 0,

			// text: String
			//		The text to be displayed, default value empty string.
			text: "",

			// align:	String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			align: "start",

			// decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			decoration: "none",

			// rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			rotated: false,

			// kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
			kerning: true
		},
		defaultTextPath: {
			// summary:
			//		Defines the default TextPath prototype.

			// type: String
			//		Specifies this is a TextPath, value 'textpath'.
			type: "textpath",

			// text: String
			//		The text to be displayed, default value empty string.
			text: "",

			// align: String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			align: "start",

			// decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			decoration: "none",

			// rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			rotated: false,

			// kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
			kerning: true
		},

		// default stylistic attributes
		defaultStroke: {
			// summary:
			//		A stroke defines stylistic properties that are used when drawing a path.
			//		This object defines the default Stroke prototype.
			// type: String
			//		Specifies this object is a type of Stroke, value 'stroke'.
			type: "stroke",

			// color: String
			//		The color of the stroke, default value 'black'.
			color: "black",

			// style: String
			//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
			style: "solid",

			// width: Number
			//		The width of a stroke, default value 1.
			width: 1,

			// cap: String
			//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
			cap: "butt",

			// join: Number
			//		The join style to use when combining path segments. Default value 4.
			join: 4
		},
		defaultLinearGradient: {
			// summary:
			//		An object defining the default stylistic properties used for Linear Gradient fills.
			//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.

			// type: String
			//		Specifies this object is a Linear Gradient, value 'linear'
			type: "linear",

			// x1: Number
			//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			x1: 0,

			// y1: Number
			//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			y1: 0,

			// x2: Number
			//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			x2: 100,

			// y2: Number
			//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			y2: 100,

			// colors: Array
			//		An array of colors at given offsets (from the start of the line).  The start of the line is
			//		defined at offest 0 with the end of the line at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
		},
		defaultRadialGradient: {
			// summary:
			//		An object specifying the default properties for RadialGradients using in fills patterns.

			// type: String
			//		Specifies this is a RadialGradient, value 'radial'
			type: "radial",

			// cx: Number
			//		The X coordinate of the center of the radial gradient, default value 0.
			cx: 0,

			// cy: Number
			//		The Y coordinate of the center of the radial gradient, default value 0.
			cy: 0,

			// r: Number
			//		The radius to the end of the radial gradient, default value 100.
			r: 100,

			// colors: Array
			//		An array of colors at given offsets (from the center of the radial gradient).
			//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
		},
		defaultPattern: {
			// summary:
			//		An object specifying the default properties for a Pattern using in fill operations.

			// type: String
			//		Specifies this object is a Pattern, value 'pattern'.
			type: "pattern",

			// x: Number
			//		The X coordinate of the position of the pattern, default value is 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the position of the pattern, default value is 0.
			y: 0,

			// width: Number
			//		The width of the pattern image, default value is 0.
			width: 0,

			// height: Number
			//		The height of the pattern image, default value is 0.
			height: 0,

			// src: String
			//		A url specifying the image to use for the pattern.
			src: ""
		},
		defaultFont: {
			// summary:
			//		An object specifying the default properties for a Font used in text operations.

			// type: String
			//		Specifies this object is a Font, value 'font'.
			type: "font",

			// style: String
			//		The font style, one of 'normal', 'bold', default value 'normal'.
			style: "normal",

			// variant: String
			//		The font variant, one of 'normal', ... , default value 'normal'.
			variant: "normal",

			// weight: String
			//		The font weight, one of 'normal', ..., default value 'normal'.
			weight: "normal",

			// size: String
			//		The font size (including units), default value '10pt'.
			size: "10pt",

			// family: String
			//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
			family: "serif"
		},

		getDefault: (function(){
			// summary:
			//		Returns a function used to access default memoized prototype objects (see them defined above).
			var typeCtorCache = {};
			// a memoized delegate()
			return function(/*String*/ type){
				var t = typeCtorCache[type];
				if(t){
					return new t();
				}
				t = typeCtorCache[type] = new Function();
				t.prototype = g[ "default" + type ];
				return new t();
			}
		})(),

		normalizeColor: function(/*dojo/Color|Array|string|Object*/ color){
			// summary:
			//		converts any legal color representation to normalized
			//		dojo/Color object
			// color:
			//		A color representation.
			return (color instanceof Color) ? color : new Color(color); // dojo/Color
		},
		normalizeParameters: function(existed, update){
			// summary:
			//		updates an existing object with properties from an 'update'
			//		object
			// existed: Object
			//		the target object to be updated
			// update: Object
			//		the 'update' object, whose properties will be used to update
			//		the existed object
			var x;
			if(update){
				var empty = {};
				for(x in existed){
					if(x in update && !(x in empty)){
						existed[x] = update[x];
					}
				}
			}
			return existed;	// Object
		},
		makeParameters: function(defaults, update){
			// summary:
			//		copies the original object, and all copied properties from the
			//		'update' object
			// defaults: Object
			//		the object to be cloned before updating
			// update: Object
			//		the object, which properties are to be cloned during updating
			// returns: Object
			//      new object with new and default properties
			var i = null;
			if(!update){
				// return dojo.clone(defaults);
				return lang.delegate(defaults);
			}
			var result = {};
			for(i in defaults){
				if(!(i in result)){
					result[i] = lang.clone((i in update) ? update[i] : defaults[i]);
				}
			}
			return result; // Object
		},
		formatNumber: function(x, addSpace){
			// summary:
			//		converts a number to a string using a fixed notation
			// x: Number
			//		number to be converted
			// addSpace: Boolean
			//		whether to add a space before a positive number
			// returns: String
			//      the formatted value
			var val = x.toString();
			if(val.indexOf("e") >= 0){
				val = x.toFixed(4);
			}else{
				var point = val.indexOf(".");
				if(point >= 0 && val.length - point > 5){
					val = x.toFixed(4);
				}
			}
			if(x < 0){
				return val; // String
			}
			return addSpace ? " " + val : val; // String
		},
		// font operations
		makeFontString: function(font){
			// summary:
			//		converts a font object to a CSS font string
			// font: Object
			//		font object (see dojox/gfx.defaultFont)
			return font.style + " " + font.variant + " " + font.weight + " " + font.size + " " + font.family; // Object
		},
		splitFontString: function(str){
			// summary:
			//		converts a CSS font string to a font object
			// description:
			//		Converts a CSS font string to a gfx font object. The CSS font
			//		string components should follow the W3C specified order
			//		(see http://www.w3.org/TR/CSS2/fonts.html#font-shorthand):
			//		style, variant, weight, size, optional line height (will be
			//		ignored), and family. Note that the Font.size attribute is limited to numeric CSS length.
			// str: String
			//		a CSS font string.
			// returns: Object
			//      object in dojox/gfx.defaultFont format
			var font = g.getDefault("Font");
			var t = str.split(/\s+/);
			do{
				if(t.length < 5){ break; }
				font.style   = t[0];
				font.variant = t[1];
				font.weight  = t[2];
				var i = t[3].indexOf("/");
				font.size = i < 0 ? t[3] : t[3].substring(0, i);
				var j = 4;
				if(i < 0){
					if(t[4] == "/"){
						j = 6;
					}else if(t[4].charAt(0) == "/"){
						j = 5;
					}
				}
				if(j < t.length){
					font.family = t.slice(j).join(" ");
				}
			}while(false);
			return font;	// Object
		},
		// length operations

		// cm_in_pt: Number
		//		points per centimeter (constant)
		cm_in_pt: 72 / 2.54,

		// mm_in_pt: Number
		//		points per millimeter (constant)
		mm_in_pt: 7.2 / 2.54,

		px_in_pt: function(){
			// summary:
			//		returns the current number of pixels per point.
			return g._base._getCachedFontMeasurements()["12pt"] / 12;	// Number
		},

		pt2px: function(len){
			// summary:
			//		converts points to pixels
			// len: Number
			//		a value in points
			return len * g.px_in_pt();	// Number
		},

		px2pt: function(len){
			// summary:
			//		converts pixels to points
			// len: Number
			//		a value in pixels
			return len / g.px_in_pt();	// Number
		},

		normalizedLength: function(len) {
			// summary:
			//		converts any length value to pixels
			// len: String
			//		a length, e.g., '12pc'
			// returns: Number
			//      pixels
			if(len.length === 0){ return 0; }
			if(len.length > 2){
				var px_in_pt = g.px_in_pt();
				var val = parseFloat(len);
				switch(len.slice(-2)){
					case "px": return val;
					case "pt": return val * px_in_pt;
					case "in": return val * 72 * px_in_pt;
					case "pc": return val * 12 * px_in_pt;
					case "mm": return val * g.mm_in_pt * px_in_pt;
					case "cm": return val * g.cm_in_pt * px_in_pt;
				}
			}
			return parseFloat(len);	// Number
		},

		// pathVmlRegExp: RegExp
		//		a constant regular expression used to split a SVG/VML path into primitive components
		// tags:
		//		private
		pathVmlRegExp: /([A-Za-z]+)|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,

		// pathVmlRegExp: RegExp
		//		a constant regular expression used to split a SVG/VML path into primitive components
		// tags:
		//		private
		pathSvgRegExp: /([A-Za-z])|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,

		equalSources: function(a, b){
			// summary:
			//		compares event sources, returns true if they are equal
			// a: Object
			//		first event source
			// b: Object
			//		event source to compare against a
			// returns: Boolean
			//      true, if objects are truthy and the same
			return a && b && a === b;
		},

		switchTo: function(/*String|Object*/ renderer){
			// summary:
			//		switch the graphics implementation to the specified renderer.
			// renderer:
			//		Either the string name of a renderer (eg. 'canvas', 'svg, ...) or the renderer
			//		object to switch to.
			var ns = typeof renderer == "string" ? g[renderer] : renderer;
			if(ns){
				// If more options are added, update the docblock at the end of shape.js!
				arr.forEach(["Group", "Rect", "Ellipse", "Circle", "Line",
						"Polyline", "Image", "Text", "Path", "TextPath",
						"Surface", "createSurface", "fixTarget"], function(name){
					g[name] = ns[name];
				});
				if(typeof renderer == "string"){
					g.renderer = renderer;
				}else{
					arr.some(["svg","vml","canvas","canvasWithEvents","silverlight"], function(r){
						return (g.renderer = g[r] && g[r].Surface === g.Surface ? r : null);
					});
				}
			}
		}
	});
	
	/*=====
		g.createSurface = function(parentNode, width, height){
			// summary:
			//		creates a surface
			// parentNode: Node
			//		a parent node
			// width: String|Number
			//		width of surface, e.g., "100px" or 100
			// height: String|Number
			//		height of surface, e.g., "100px" or 100
			// returns: dojox/gfx.Surface
			//     newly created surface
		};
		g.fixTarget = function(){
			// tags:
			//		private
		};
	=====*/
	
	return g; // defaults object api
});

},
'dojox/gfx/renderer':function(){
define(["./_base","dojo/_base/lang", "dojo/_base/sniff", "dojo/_base/window", "dojo/_base/config"],
  function(g, lang, has, win, config){
  //>> noBuildResolver
	var currentRenderer = null;

	has.add("vml", function(global, document, element){
		element.innerHTML = "<v:shape adj=\"1\"/>";
		var supported = ("adj" in element.firstChild);
		element.innerHTML = "";
		return supported;
	});

	return {
		// summary:
		//		This module is an AMD loader plugin that loads the appropriate graphics renderer
		//		implementation based on detected environment and current configuration settings.
		
		load: function(id, require, load){
			// tags:
			//      private
			if(currentRenderer && id != "force"){
				load(currentRenderer);
				return;
			}
			var renderer = config.forceGfxRenderer,
				renderers = !renderer && (lang.isString(config.gfxRenderer) ?
					config.gfxRenderer : "svg,vml,canvas,silverlight").split(","),
				silverlightObject, silverlightFlag;

			while(!renderer && renderers.length){
				switch(renderers.shift()){
					case "svg":
						// the next test is from https://github.com/phiggins42/has.js
						if("SVGAngle" in win.global){
							renderer = "svg";
						}
						break;
					case "vml":
						if(has("vml")){
							renderer = "vml";
						}
						break;
					case "silverlight":
						try{
							if(has("ie")){
								silverlightObject = new ActiveXObject("AgControl.AgControl");
								if(silverlightObject && silverlightObject.IsVersionSupported("1.0")){
									silverlightFlag = true;
								}
							}else{
								if(navigator.plugins["Silverlight Plug-In"]){
									silverlightFlag = true;
								}
							}
						}catch(e){
							silverlightFlag = false;
						}finally{
							silverlightObject = null;
						}
						if(silverlightFlag){
							renderer = "silverlight";
						}
						break;
					case "canvas":
						if(win.global.CanvasRenderingContext2D){
							renderer = "canvas";
						}
						break;
				}
			}

			if (renderer === 'canvas' && config.canvasEvents !== false) {
				renderer = "canvasWithEvents";
			}

			if(config.isDebug){
				console.log("gfx renderer = " + renderer);
			}

			function loadRenderer(){
				require(["dojox/gfx/" + renderer], function(module){
					g.renderer = renderer;
					// memorize the renderer module
					currentRenderer = module;
					// now load it
					load(module);
				});
			}
			if(renderer == "svg" && typeof window.svgweb != "undefined"){
				window.svgweb.addOnLoad(loadRenderer);
			}else{
				loadRenderer();
			}
		}
	};
});

},
'dojox/dgauges/GaugeBase':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/dom-geometry", "dijit/registry", "dijit/_WidgetBase", "dojo/_base/html", 
		"dojo/_base/event", "dojox/gfx", "dojox/widget/_Invalidating","./ScaleBase", "dojox/gfx/matrix"],
	function(lang, // lang.extend
		declare, domGeom,  WidgetRegistry, _WidgetBase, html, event, gfx, _Invalidating, ScaleBase, matrix){
	return declare("dojox.dgauges.GaugeBase", [_WidgetBase, _Invalidating], {
		// summary: 
		//		This class is the base class for the circular and 
		//		rectangular (horizontal and vertical) gauge components.
		//		A gauge is a composition of elements added to the gauge using the addElement method.
		//		Elements are drawn from back to front in the same order they are added (using addElement).
		//		An elements can be: 
		//
		//		- A GFX drawing functions typically used for defining the style of the gauge.
		//		- A scale: CircularScale or RectangularScale depending on the type of gauge.
		//		- A text, using the TextIndicator
		//		Note: Indicator classes (value indicators, range indicators) are sub-elements of scales
		//		To create a custom gauge, subclass CircularGauge or RectangularGauge and
		//		configure its elements in the constructor.
		//		Ready to use, predefined gauges are available in dojox/dgauges/components/
		//		They are good examples of gauges built on top of the framework.
		
		_elements: null,
		_scales: null,
		_elementsIndex: null,
		_elementsRenderers: null,
		_gfxGroup: null,
		_mouseShield: null,
		_widgetBox: null,
		_node: null,

		// value: Number
		//		This property acts as a top-level wrapper for the value of the first indicator added to 
		//		its scale with the name "indicator", i.e. myScale.addIndicator("indicator", myIndicator).
		//		This property must be manipulated with get("value") and set("value", xxx).
		value: 0,
		_mainIndicator: null,
		
		_getValueAttr: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private			
			if(this._mainIndicator){
				return this._mainIndicator.get("value");
			}else{
				this._setMainIndicator();
				if(this._mainIndicator){
					return this._mainIndicator.get("value");
				}
			}
			return this.value;
		},
		
		_setValueAttr: function(value){
			// summary:
			//		Internal method.
			// tags:
			//		private			
			this._set("value", value);
			if(this._mainIndicator){
				this._mainIndicator.set("value", value);
			}else{
				this._setMainIndicator();
				if(this._mainIndicator){
					this._mainIndicator.set("value", value);
				}
			}
		},
		
		_setMainIndicator: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private	
			var indicator;
			for(var i=0; i<this._scales.length; i++){
				indicator = this._scales[i].getIndicator("indicator");
				if(indicator){
					this._mainIndicator = indicator;
				}
			}
		},
		
		_resetMainIndicator: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._mainIndicator = null;
		},
		
		// font: Object
		//		The font of the gauge used by elements if not overridden.
		font: null,
		
		constructor: function(/* Object */args, /* DOMNode */ node){
			this.font = {
				family: "Helvetica",
				style: "normal",
				variant: "small-caps",
				weight: "bold",
				size: "10pt",
				color: "black"
			};
			this._elements = [];
			this._scales = [];
			this._elementsIndex = {};
			this._elementsRenderers = {};
			this._node = WidgetRegistry.byId(node);
			var box = html.getMarginBox(node);

			this.surface = gfx.createSurface(this._node, box.w || 1, box.h || 1);
			this._widgetBox = box;
			// _baseGroup is a workaround for http://bugs.dojotoolkit.org/ticket/14471
			this._baseGroup = this.surface.createGroup();
			this._mouseShield = this._baseGroup.createGroup();
			this._gfxGroup = this._baseGroup.createGroup();
		},
		
		_setCursor: function(type){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(this._node)
				this._node.style.cursor = type;
		},
		
		_computeBoundingBox: function(/* Object */element){
			// summary:
			//		Internal method.
			// tags:
			//		private
			return element ? element.getBoundingBox() : {x:0, y:0, width:0, height:0};
		},
		
		destroy: function(){
			// summary:
			//		Cleanup when a gauge is to be destroyed.
			this.surface.destroy();
			this.inherited(arguments);
		},

		resize: function(width, height){
			// summary:
			//		Resize the gauge to the dimensions of width and height.
			// description:
			//		Resize the gauge and its surface to the width and height dimensions.
			//		If a single argument of the form {w: value1, h: value2} is provided take that argument as the dimensions to use.
			//		Finally if no argument is provided, resize the surface to the marginBox of the gauge.
			// width: Number|Object?
			//		The new width of the gauge or the box definition.
			// height: Number?
			//		The new height of the gauge.
			// returns: dojox/dgauges/GaugeBase
			//		A reference to the current gauge for functional chaining.
			switch(arguments.length){
				// case 0, do not resize the div, just the surface
				case 1:
					// argument, override node box
					domGeom.setMarginBox(this._node, width);
					break;
				case 2:

					// argument, override node box
					domGeom.setMarginBox(this._node, {w: width, h: height});
					break;
			}
			// in all cases take back the computed box
			var box = domGeom.getMarginBox(this._node);
			this._widgetBox = box;
			var d = this.surface.getDimensions();
			if(d.width != box.w || d.height != box.h){
				// and set it on the surface
				this.surface.setDimensions(box.w, box.h);
				this._mouseShield.clear();
				this._mouseShield.createRect({x:0,y:0,width:box.w,height:box.h}).setFill([0, 0, 0, 0]);
				return this.invalidateRendering();
			}else{
				return this;
			}
		},
		
		addElement: function(/* String */name, /* Object */ element){
			// summary:
			//		Adds a element to the gauge.
			// name: String
			//		The name of the element to be added.
			// element: Object
			//		This parameter can be:
			//
			//		- A function which takes on argument of type GFX Group and return null or a
			//		GFX element retrievable using the getElementRenderer() method.
			//		- A Scale instance, i.e. CircularScale or RectangularScale.
			//		- A TextIndicator instance.
			if(this._elementsIndex[name] && this._elementsIndex[name] != element){
				this.removeElement(name);
			}
			
			if(lang.isFunction(element)){
				var gfxHolder = {};
				lang.mixin(gfxHolder, new _Invalidating());
				gfxHolder._name = name;
				gfxHolder._gfxGroup = this._gfxGroup.createGroup();
				gfxHolder.width = 0;
				gfxHolder.height = 0;
				gfxHolder._isGFX = true;
				gfxHolder.refreshRendering = function(){
					gfxHolder._gfxGroup.clear();
					return element(gfxHolder._gfxGroup, gfxHolder.width, gfxHolder.height);
				};
				this._elements.push(gfxHolder);
				this._elementsIndex[name] = gfxHolder;
			}else{
				element._name = name;
				element._gfxGroup = this._gfxGroup.createGroup();
				element._gauge = this;
				this._elements.push(element);
				this._elementsIndex[name] = element;
				
				if(element instanceof ScaleBase){
					this._scales.push(element);
				}
			}
			return this.invalidateRendering();
		},
		
		removeElement: function(/* String */name){
			// summary:
			//		Remove the element defined by name from the gauge.
			// name: String
			//		The name of the element as defined using addElement.
			// returns: Object
			//		A reference to the removed element.
			
			var element = this._elementsIndex[name];
			
			if(element){
				element._gfxGroup.removeShape();
				var idx = this._elements.indexOf(element);
				this._elements.splice(idx, 1);
				
				if(element instanceof ScaleBase){
					var idxs = this._scales.indexOf(element);
					this._scales.splice(idxs, 1);
					this._resetMainIndicator();
				}
				delete this._elementsIndex[name];
				delete this._elementsRenderers[name];
			}
			this.invalidateRendering();
			return element;
		},
		
		getElement: function(/* String */name){
			// summary:
			//		Get the given element, by name.
			// name: String
			//		The name of the element as defined using addElement.
			// returns: Object
			//		The element.
			return this._elementsIndex[name];
		},
		
		getElementRenderer: function(/* String */name){
			// summary:
			//		Get the given element renderer, by name.
			// name: String
			//		The name of the element as defined using addElement.
			// returns: Object
			//		The element renderer returned by the
			//		drawing function or by the refreshRendering() method
			//		in the case of framework classes.
			return this._elementsRenderers[name];
		},
		
		onStartEditing: function(event){
			// summary:
			//		Called when an interaction begins (keyboard, mouse or gesture).
			// event:
			//		On object with a unique member "indicator". This member is a reference to the modified indicator.
			// tags:
			//		callback
		},
		
		onEndEditing: function(event){
			// summary:
			//		Called when an interaction ends (keyboard, mouse or gesture).
			// event:
			//		On object with a unique member "indicator". This member is a reference to the modified indicator.
			// tags:
			//		callback
		}
	})
});

},
'dijit/registry':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/window", // win.body
	"./main"	// dijit._scopeName
], function(array, win, dijit){

	// module:
	//		dijit/registry

	var _widgetTypeCtr = {}, hash = {};

	var registry =  {
		// summary:
		//		Registry of existing widget on page, plus some utility methods.

		// length: Number
		//		Number of registered widgets
		length: 0,

		add: function(widget){
			// summary:
			//		Add a widget to the registry. If a duplicate ID is detected, a error is thrown.
			// widget: dijit/_WidgetBase
			//		Any dijit/_WidgetBase subclass.
			if(hash[widget.id]){
				throw new Error("Tried to register widget with id==" + widget.id + " but that id is already registered");
			}
			hash[widget.id] = widget;
			this.length++;
		},

		remove: function(/*String*/ id){
			// summary:
			//		Remove a widget from the registry. Does not destroy the widget; simply
			//		removes the reference.
			if(hash[id]){
				delete hash[id];
				this.length--;
			}
		},

		byId: function(/*String|Widget*/ id){
			// summary:
			//		Find a widget by it's id.
			//		If passed a widget then just returns the widget.
			return typeof id == "string" ? hash[id] : id;	// dijit/_WidgetBase
		},

		byNode: function(/*DOMNode*/ node){
			// summary:
			//		Returns the widget corresponding to the given DOMNode
			return hash[node.getAttribute("widgetId")]; // dijit/_WidgetBase
		},

		toArray: function(){
			// summary:
			//		Convert registry into a true Array
			//
			// example:
			//		Work with the widget .domNodes in a real Array
			//		|	array.map(registry.toArray(), function(w){ return w.domNode; });

			var ar = [];
			for(var id in hash){
				ar.push(hash[id]);
			}
			return ar;	// dijit/_WidgetBase[]
		},

		getUniqueId: function(/*String*/widgetType){
			// summary:
			//		Generates a unique id for a given widgetType

			var id;
			do{
				id = widgetType + "_" +
					(widgetType in _widgetTypeCtr ?
						++_widgetTypeCtr[widgetType] : _widgetTypeCtr[widgetType] = 0);
			}while(hash[id]);
			return dijit._scopeName == "dijit" ? id : dijit._scopeName + "_" + id; // String
		},

		findWidgets: function(root, skipNode){
			// summary:
			//		Search subtree under root returning widgets found.
			//		Doesn't search for nested widgets (ie, widgets inside other widgets).
			// root: DOMNode
			//		Node to search under.
			// skipNode: DOMNode
			//		If specified, don't search beneath this node (usually containerNode).

			var outAry = [];

			function getChildrenHelper(root){
				for(var node = root.firstChild; node; node = node.nextSibling){
					if(node.nodeType == 1){
						var widgetId = node.getAttribute("widgetId");
						if(widgetId){
							var widget = hash[widgetId];
							if(widget){	// may be null on page w/multiple dojo's loaded
								outAry.push(widget);
							}
						}else if(node !== skipNode){
							getChildrenHelper(node);
						}
					}
				}
			}

			getChildrenHelper(root);
			return outAry;
		},

		_destroyAll: function(){
			// summary:
			//		Code to destroy all widgets and do other cleanup on page unload

			// Clean up focus manager lingering references to widgets and nodes
			dijit._curFocus = null;
			dijit._prevFocus = null;
			dijit._activeStack = [];

			// Destroy all the widgets, top down
			array.forEach(registry.findWidgets(win.body()), function(widget){
				// Avoid double destroy of widgets like Menu that are attached to <body>
				// even though they are logically children of other widgets.
				if(!widget._destroyed){
					if(widget.destroyRecursive){
						widget.destroyRecursive();
					}else if(widget.destroy){
						widget.destroy();
					}
				}
			});
		},

		getEnclosingWidget: function(/*DOMNode*/ node){
			// summary:
			//		Returns the widget whose DOM tree contains the specified DOMNode, or null if
			//		the node is not contained within the DOM tree of any widget
			while(node){
				var id = node.nodeType == 1 && node.getAttribute("widgetId");
				if(id){
					return hash[id];
				}
				node = node.parentNode;
			}
			return null;
		},

		// In case someone needs to access hash.
		// Actually, this is accessed from WidgetSet back-compatibility code
		_hash: hash
	};

	dijit.registry = registry;

	return registry;
});

},
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
'dijit/_WidgetBase':function(){
define([
	"require", // require.toUrl
	"dojo/_base/array", // array.forEach array.map
	"dojo/aspect",
	"dojo/_base/config", // config.blankGif
	"dojo/_base/connect", // connect.connect
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/dom-attr", // domAttr.set domAttr.remove
	"dojo/dom-class", // domClass.add domClass.replace
	"dojo/dom-construct", // domConstruct.destroy domConstruct.place
	"dojo/dom-geometry", // isBodyLtr
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/has",
	"dojo/_base/kernel",
	"dojo/_base/lang", // mixin(), isArray(), etc.
	"dojo/on",
	"dojo/ready",
	"dojo/Stateful", // Stateful
	"dojo/topic",
	"dojo/_base/window", // win.body()
	"./Destroyable",
	"dojo/has!dojo-bidi?./_BidiMixin",
	"./registry"    // registry.getUniqueId(), registry.findWidgets()
], function(require, array, aspect, config, connect, declare,
			dom, domAttr, domClass, domConstruct, domGeometry, domStyle, has, kernel,
			lang, on, ready, Stateful, topic, win, Destroyable, _BidiMixin, registry){

	// module:
	//		dijit/_WidgetBase

	// Flag to make dijit load modules the app didn't explicitly request, for backwards compatibility
	has.add("dijit-legacy-requires", !kernel.isAsync);

	// Flag to enable support for textdir attribute
	has.add("dojo-bidi", false);


	// For back-compat, remove in 2.0.
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/_base/manager"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	// Nested hash listing attributes for each tag, all strings in lowercase.
	// ex: {"div": {"style": true, "tabindex" true}, "form": { ...
	var tagAttrs = {};

	function getAttrs(obj){
		var ret = {};
		for(var attr in obj){
			ret[attr.toLowerCase()] = true;
		}
		return ret;
	}

	function nonEmptyAttrToDom(attr){
		// summary:
		//		Returns a setter function that copies the attribute to this.domNode,
		//		or removes the attribute from this.domNode, depending on whether the
		//		value is defined or not.
		return function(val){
			domAttr[val ? "set" : "remove"](this.domNode, attr, val);
			this._set(attr, val);
		};
	}

	var _WidgetBase = declare("dijit._WidgetBase", [Stateful, Destroyable], {
		// summary:
		//		Future base class for all Dijit widgets.
		// description:
		//		Future base class for all Dijit widgets.
		//		_Widget extends this class adding support for various features needed by desktop.
		//
		//		Provides stubs for widget lifecycle methods for subclasses to extend, like postMixInProperties(), buildRendering(),
		//		postCreate(), startup(), and destroy(), and also public API methods like set(), get(), and watch().
		//
		//		Widgets can provide custom setters/getters for widget attributes, which are called automatically by set(name, value).
		//		For an attribute XXX, define methods _setXXXAttr() and/or _getXXXAttr().
		//
		//		_setXXXAttr can also be a string/hash/array mapping from a widget attribute XXX to the widget's DOMNodes:
		//
		//		- DOM node attribute
		// |		_setFocusAttr: {node: "focusNode", type: "attribute"}
		// |		_setFocusAttr: "focusNode"	(shorthand)
		// |		_setFocusAttr: ""		(shorthand, maps to this.domNode)
		//		Maps this.focus to this.focusNode.focus, or (last example) this.domNode.focus
		//
		//		- DOM node innerHTML
		//	|		_setTitleAttr: { node: "titleNode", type: "innerHTML" }
		//		Maps this.title to this.titleNode.innerHTML
		//
		//		- DOM node innerText
		//	|		_setTitleAttr: { node: "titleNode", type: "innerText" }
		//		Maps this.title to this.titleNode.innerText
		//
		//		- DOM node CSS class
		// |		_setMyClassAttr: { node: "domNode", type: "class" }
		//		Maps this.myClass to this.domNode.className
		//
		//		If the value of _setXXXAttr is an array, then each element in the array matches one of the
		//		formats of the above list.
		//
		//		If the custom setter is null, no action is performed other than saving the new value
		//		in the widget (in this).
		//
		//		If no custom setter is defined for an attribute, then it will be copied
		//		to this.focusNode (if the widget defines a focusNode), or this.domNode otherwise.
		//		That's only done though for attributes that match DOMNode attributes (title,
		//		alt, aria-labelledby, etc.)

		// id: [const] String
		//		A unique, opaque ID string that can be assigned by users or by the
		//		system. If the developer passes an ID which is known not to be
		//		unique, the specified ID is ignored and the system-generated ID is
		//		used instead.
		id: "",
		_setIdAttr: "domNode", // to copy to this.domNode even for auto-generated id's

		// lang: [const] String
		//		Rarely used.  Overrides the default Dojo locale used to render this widget,
		//		as defined by the [HTML LANG](http://www.w3.org/TR/html401/struct/dirlang.html#adef-lang) attribute.
		//		Value must be among the list of locales specified during by the Dojo bootstrap,
		//		formatted according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt) (like en-us).
		lang: "",
		// set on domNode even when there's a focus node.	but don't set lang="", since that's invalid.
		_setLangAttr: nonEmptyAttrToDom("lang"),

		// dir: [const] String
		//		Bi-directional support, as defined by the [HTML DIR](http://www.w3.org/TR/html401/struct/dirlang.html#adef-dir)
		//		attribute. Either left-to-right "ltr" or right-to-left "rtl".  If undefined, widgets renders in page's
		//		default direction.
		dir: "",
		// set on domNode even when there's a focus node.	but don't set dir="", since that's invalid.
		_setDirAttr: nonEmptyAttrToDom("dir"), // to set on domNode even when there's a focus node

		// class: String
		//		HTML class attribute
		"class": "",
		_setClassAttr: { node: "domNode", type: "class" },

		// Override automatic assigning type --> focusNode, it causes exception on IE6-8.
		// Instead, type must be specified as ${type} in the template, as part of the original DOM.
		_setTypeAttr: null,

		// style: String||Object
		//		HTML style attributes as cssText string or name/value hash
		style: "",

		// title: String
		//		HTML title attribute.
		//
		//		For form widgets this specifies a tooltip to display when hovering over
		//		the widget (just like the native HTML title attribute).
		//
		//		For TitlePane or for when this widget is a child of a TabContainer, AccordionContainer,
		//		etc., it's used to specify the tab label, accordion pane title, etc.  In this case it's
		//		interpreted as HTML.
		title: "",

		// tooltip: String
		//		When this widget's title attribute is used to for a tab label, accordion pane title, etc.,
		//		this specifies the tooltip to appear when the mouse is hovered over that text.
		tooltip: "",

		// baseClass: [protected] String
		//		Root CSS class of the widget (ex: dijitTextBox), used to construct CSS classes to indicate
		//		widget state.
		baseClass: "",

		// srcNodeRef: [readonly] DomNode
		//		pointer to original DOM node
		srcNodeRef: null,

		// domNode: [readonly] DomNode
		//		This is our visible representation of the widget! Other DOM
		//		Nodes may by assigned to other properties, usually through the
		//		template system's data-dojo-attach-point syntax, but the domNode
		//		property is the canonical "top level" node in widget UI.
		domNode: null,

		// containerNode: [readonly] DomNode
		//		Designates where children of the source DOM node will be placed.
		//		"Children" in this case refers to both DOM nodes and widgets.
		//		For example, for myWidget:
		//
		//		|	<div data-dojo-type=myWidget>
		//		|		<b> here's a plain DOM node
		//		|		<span data-dojo-type=subWidget>and a widget</span>
		//		|		<i> and another plain DOM node </i>
		//		|	</div>
		//
		//		containerNode would point to:
		//
		//		|		<b> here's a plain DOM node
		//		|		<span data-dojo-type=subWidget>and a widget</span>
		//		|		<i> and another plain DOM node </i>
		//
		//		In templated widgets, "containerNode" is set via a
		//		data-dojo-attach-point assignment.
		//
		//		containerNode must be defined for any widget that accepts innerHTML
		//		(like ContentPane or BorderContainer or even Button), and conversely
		//		is null for widgets that don't, like TextBox.
		containerNode: null,

		// ownerDocument: [const] Document?
		//		The document this widget belongs to.  If not specified to constructor, will default to
		//		srcNodeRef.ownerDocument, or if no sourceRef specified, then to the document global
		ownerDocument: null,
		_setOwnerDocumentAttr: function(val){
			// this setter is merely to avoid automatically trying to set this.domNode.ownerDocument
			this._set("ownerDocument", val);
		},

		/*=====
		// _started: [readonly] Boolean
		//		startup() has completed.
		_started: false,
		=====*/

		// attributeMap: [protected] Object
		//		Deprecated.	Instead of attributeMap, widget should have a _setXXXAttr attribute
		//		for each XXX attribute to be mapped to the DOM.
		//
		//		attributeMap sets up a "binding" between attributes (aka properties)
		//		of the widget and the widget's DOM.
		//		Changes to widget attributes listed in attributeMap will be
		//		reflected into the DOM.
		//
		//		For example, calling set('title', 'hello')
		//		on a TitlePane will automatically cause the TitlePane's DOM to update
		//		with the new title.
		//
		//		attributeMap is a hash where the key is an attribute of the widget,
		//		and the value reflects a binding to a:
		//
		//		- DOM node attribute
		// |		focus: {node: "focusNode", type: "attribute"}
		//		Maps this.focus to this.focusNode.focus
		//
		//		- DOM node innerHTML
		//	|		title: { node: "titleNode", type: "innerHTML" }
		//		Maps this.title to this.titleNode.innerHTML
		//
		//		- DOM node innerText
		//	|		title: { node: "titleNode", type: "innerText" }
		//		Maps this.title to this.titleNode.innerText
		//
		//		- DOM node CSS class
		// |		myClass: { node: "domNode", type: "class" }
		//		Maps this.myClass to this.domNode.className
		//
		//		If the value is an array, then each element in the array matches one of the
		//		formats of the above list.
		//
		//		There are also some shorthands for backwards compatibility:
		//
		//		- string --> { node: string, type: "attribute" }, for example:
		//
		//	|	"focusNode" ---> { node: "focusNode", type: "attribute" }
		//
		//		- "" --> { node: "domNode", type: "attribute" }
		attributeMap: {},

		// _blankGif: [protected] String
		//		Path to a blank 1x1 image.
		//		Used by `<img>` nodes in templates that really get their image via CSS background-image.
		_blankGif: config.blankGif || require.toUrl("dojo/resources/blank.gif"),

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		/*=====
		constructor: function(params, srcNodeRef){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified:
			//
			//		- use srcNodeRef.innerHTML as my contents
			//		- if this is a behavioral widget then apply behavior to that srcNodeRef
			//		- otherwise, replace srcNodeRef with my generated DOM tree
		},
		=====*/

		_introspect: function(){
			// summary:
			//		Collect metadata about this widget (only once per class, not once per instance):
			//
			//			- list of attributes with custom setters, storing in this.constructor._setterAttrs
			//			- generate this.constructor._onMap, mapping names like "mousedown" to functions like onMouseDown

			var ctor = this.constructor;
			if(!ctor._setterAttrs){
				var proto = ctor.prototype,
					attrs = ctor._setterAttrs = [], // attributes with custom setters
					onMap = (ctor._onMap = {});

				// Items in this.attributeMap are like custom setters.  For back-compat, remove for 2.0.
				for(var name in proto.attributeMap){
					attrs.push(name);
				}

				// Loop over widget properties, collecting properties with custom setters and filling in ctor._onMap.
				for(name in proto){
					if(/^on/.test(name)){
						onMap[name.substring(2).toLowerCase()] = name;
					}

					if(/^_set[A-Z](.*)Attr$/.test(name)){
						name = name.charAt(4).toLowerCase() + name.substr(5, name.length - 9);
						if(!proto.attributeMap || !(name in proto.attributeMap)){
							attrs.push(name);
						}
					}
				}

				// Note: this isn't picking up info on properties like aria-label and role, that don't have custom setters
				// but that set() maps to attributes on this.domNode or this.focusNode
			}
		},

		postscript: function(/*Object?*/params, /*DomNode|String*/srcNodeRef){
			// summary:
			//		Kicks off widget instantiation.  See create() for details.
			// tags:
			//		private

			// Note that we skip calling this.inherited(), i.e. dojo/Stateful::postscript(), because 1.x widgets don't
			// expect their custom setters to get called until after buildRendering().  Consider changing for 2.0.

			this.create(params, srcNodeRef);
		},

		create: function(params, srcNodeRef){
			// summary:
			//		Kick off the life-cycle of a widget
			// description:
			//		Create calls a number of widget methods (postMixInProperties, buildRendering, postCreate,
			//		etc.), some of which of you'll want to override. See http://dojotoolkit.org/reference-guide/dijit/_WidgetBase.html
			//		for a discussion of the widget creation lifecycle.
			//
			//		Of course, adventurous developers could override create entirely, but this should
			//		only be done as a last resort.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified:
			//
			//		- use srcNodeRef.innerHTML as my contents
			//		- if this is a behavioral widget then apply behavior to that srcNodeRef
			//		- otherwise, replace srcNodeRef with my generated DOM tree
			// tags:
			//		private

			// First time widget is instantiated, scan prototype to figure out info about custom setters etc.
			this._introspect();

			// store pointer to original DOM tree
			this.srcNodeRef = dom.byId(srcNodeRef);

			// No longer used, remove for 2.0.
			this._connects = [];
			this._supportingWidgets = [];

			// this is here for back-compat, remove in 2.0 (but check NodeList-instantiate.html test)
			if(this.srcNodeRef && (typeof this.srcNodeRef.id == "string")){
				this.id = this.srcNodeRef.id;
			}

			// mix in our passed parameters
			if(params){
				this.params = params;
				lang.mixin(this, params);
			}
			this.postMixInProperties();

			// Generate an id for the widget if one wasn't specified, or it was specified as id: undefined.
			// Do this before buildRendering() because it might expect the id to be there.
			if(!this.id){
				this.id = registry.getUniqueId(this.declaredClass.replace(/\./g, "_"));
				if(this.params){
					// if params contains {id: undefined}, prevent _applyAttributes() from processing it
					delete this.params.id;
				}
			}

			// The document and <body> node this widget is associated with
			this.ownerDocument = this.ownerDocument || (this.srcNodeRef ? this.srcNodeRef.ownerDocument : document);
			this.ownerDocumentBody = win.body(this.ownerDocument);

			registry.add(this);

			this.buildRendering();

			var deleteSrcNodeRef;

			if(this.domNode){
				// Copy attributes listed in attributeMap into the [newly created] DOM for the widget.
				// Also calls custom setters for all attributes with custom setters.
				this._applyAttributes();

				// If srcNodeRef was specified, then swap out original srcNode for this widget's DOM tree.
				// For 2.0, move this after postCreate().  postCreate() shouldn't depend on the
				// widget being attached to the DOM since it isn't when a widget is created programmatically like
				// new MyWidget({}).	See #11635.
				var source = this.srcNodeRef;
				if(source && source.parentNode && this.domNode !== source){
					source.parentNode.replaceChild(this.domNode, source);
					deleteSrcNodeRef = true;
				}

				// Note: for 2.0 may want to rename widgetId to dojo._scopeName + "_widgetId",
				// assuming that dojo._scopeName even exists in 2.0
				this.domNode.setAttribute("widgetId", this.id);
			}
			this.postCreate();

			// If srcNodeRef has been processed and removed from the DOM (e.g. TemplatedWidget) then delete it to allow GC.
			// I think for back-compatibility it isn't deleting srcNodeRef until after postCreate() has run.
			if(deleteSrcNodeRef){
				delete this.srcNodeRef;
			}

			this._created = true;
		},

		_applyAttributes: function(){
			// summary:
			//		Step during widget creation to copy  widget attributes to the
			//		DOM according to attributeMap and _setXXXAttr objects, and also to call
			//		custom _setXXXAttr() methods.
			//
			//		Skips over blank/false attribute values, unless they were explicitly specified
			//		as parameters to the widget, since those are the default anyway,
			//		and setting tabIndex="" is different than not setting tabIndex at all.
			//
			//		For backwards-compatibility reasons attributeMap overrides _setXXXAttr when
			//		_setXXXAttr is a hash/string/array, but _setXXXAttr as a functions override attributeMap.
			// tags:
			//		private

			// Call this.set() for each property that was either specified as parameter to constructor,
			// or is in the list found above.	For correlated properties like value and displayedValue, the one
			// specified as a parameter should take precedence.
			// Particularly important for new DateTextBox({displayedValue: ...}) since DateTextBox's default value is
			// NaN and thus is not ignored like a default value of "".

			// Step 1: Save the current values of the widget properties that were specified as parameters to the constructor.
			// Generally this.foo == this.params.foo, except if postMixInProperties() changed the value of this.foo.
			var params = {};
			for(var key in this.params || {}){
				params[key] = this._get(key);
			}

			// Step 2: Call set() for each property with a non-falsy value that wasn't passed as a parameter to the constructor
			array.forEach(this.constructor._setterAttrs, function(key){
				if(!(key in params)){
					var val = this._get(key);
					if(val){
						this.set(key, val);
					}
				}
			}, this);

			// Step 3: Call set() for each property that was specified as parameter to constructor.
			// Use params hash created above to ignore side effects from step #2 above.
			for(key in params){
				this.set(key, params[key]);
			}
		},

		postMixInProperties: function(){
			// summary:
			//		Called after the parameters to the widget have been read-in,
			//		but before the widget template is instantiated. Especially
			//		useful to set properties that are referenced in the widget
			//		template.
			// tags:
			//		protected
		},

		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget, setting this.domNode.
			//		Most widgets will mixin `dijit._TemplatedMixin`, which implements this method.
			// tags:
			//		protected

			if(!this.domNode){
				// Create root node if it wasn't created by _TemplatedMixin
				this.domNode = this.srcNodeRef || this.ownerDocument.createElement("div");
			}

			// baseClass is a single class name or occasionally a space-separated list of names.
			// Add those classes to the DOMNode.  If RTL mode then also add with Rtl suffix.
			// TODO: make baseClass custom setter
			if(this.baseClass){
				var classes = this.baseClass.split(" ");
				if(!this.isLeftToRight()){
					classes = classes.concat(array.map(classes, function(name){
						return name + "Rtl";
					}));
				}
				domClass.add(this.domNode, classes);
			}
		},

		postCreate: function(){
			// summary:
			//		Processing after the DOM fragment is created
			// description:
			//		Called after the DOM fragment has been created, but not necessarily
			//		added to the document.  Do not include any operations which rely on
			//		node dimensions or placement.
			// tags:
			//		protected
		},

		startup: function(){
			// summary:
			//		Processing after the DOM fragment is added to the document
			// description:
			//		Called after a widget and its children have been created and added to the page,
			//		and all related widgets have finished their create() cycle, up through postCreate().
			//
			//		Note that startup() may be called while the widget is still hidden, for example if the widget is
			//		inside a hidden dijit/Dialog or an unselected tab of a dijit/layout/TabContainer.
			//		For widgets that need to do layout, it's best to put that layout code inside resize(), and then
			//		extend dijit/layout/_LayoutWidget so that resize() is called when the widget is visible.
			if(this._started){
				return;
			}
			this._started = true;
			array.forEach(this.getChildren(), function(obj){
				if(!obj._started && !obj._destroyed && lang.isFunction(obj.startup)){
					obj.startup();
					obj._started = true;
				}
			});
		},

		//////////// DESTROY FUNCTIONS ////////////////////////////////

		destroyRecursive: function(/*Boolean?*/ preserveDom){
			// summary:
			//		Destroy this widget and its descendants
			// description:
			//		This is the generic "destructor" function that all widget users
			//		should call to cleanly discard with a widget. Once a widget is
			//		destroyed, it is removed from the manager object.
			// preserveDom:
			//		If true, this method will leave the original DOM structure
			//		alone of descendant Widgets. Note: This will NOT work with
			//		dijit._TemplatedMixin widgets.

			this._beingDestroyed = true;
			this.destroyDescendants(preserveDom);
			this.destroy(preserveDom);
		},

		destroy: function(/*Boolean*/ preserveDom){
			// summary:
			//		Destroy this widget, but not its descendants.  Descendants means widgets inside of
			//		this.containerNode.   Will also destroy any resources (including widgets) registered via this.own().
			//
			//		This method will also destroy internal widgets such as those created from a template,
			//		assuming those widgets exist inside of this.domNode but outside of this.containerNode.
			//
			//		For 2.0 it's planned that this method will also destroy descendant widgets, so apps should not
			//		depend on the current ability to destroy a widget without destroying its descendants.   Generally
			//		they should use destroyRecursive() for widgets with children.
			// preserveDom: Boolean
			//		If true, this method will leave the original DOM structure alone.
			//		Note: This will not yet work with _TemplatedMixin widgets

			this._beingDestroyed = true;
			this.uninitialize();

			function destroy(w){
				if(w.destroyRecursive){
					w.destroyRecursive(preserveDom);
				}else if(w.destroy){
					w.destroy(preserveDom);
				}
			}

			// Back-compat, remove for 2.0
			array.forEach(this._connects, lang.hitch(this, "disconnect"));
			array.forEach(this._supportingWidgets, destroy);

			// Destroy supporting widgets, but not child widgets under this.containerNode (for 2.0, destroy child widgets
			// here too).   if() statement is to guard against exception if destroy() called multiple times (see #15815).
			if(this.domNode){
				array.forEach(registry.findWidgets(this.domNode, this.containerNode), destroy);
			}

			this.destroyRendering(preserveDom);
			registry.remove(this.id);
			this._destroyed = true;
		},

		destroyRendering: function(/*Boolean?*/ preserveDom){
			// summary:
			//		Destroys the DOM nodes associated with this widget.
			// preserveDom:
			//		If true, this method will leave the original DOM structure alone
			//		during tear-down. Note: this will not work with _Templated
			//		widgets yet.
			// tags:
			//		protected

			if(this.bgIframe){
				this.bgIframe.destroy(preserveDom);
				delete this.bgIframe;
			}

			if(this.domNode){
				if(preserveDom){
					domAttr.remove(this.domNode, "widgetId");
				}else{
					domConstruct.destroy(this.domNode);
				}
				delete this.domNode;
			}

			if(this.srcNodeRef){
				if(!preserveDom){
					domConstruct.destroy(this.srcNodeRef);
				}
				delete this.srcNodeRef;
			}
		},

		destroyDescendants: function(/*Boolean?*/ preserveDom){
			// summary:
			//		Recursively destroy the children of this widget and their
			//		descendants.
			// preserveDom:
			//		If true, the preserveDom attribute is passed to all descendant
			//		widget's .destroy() method. Not for use with _Templated
			//		widgets.

			// get all direct descendants and destroy them recursively
			array.forEach(this.getChildren(), function(widget){
				if(widget.destroyRecursive){
					widget.destroyRecursive(preserveDom);
				}
			});
		},

		uninitialize: function(){
			// summary:
			//		Deprecated. Override destroy() instead to implement custom widget tear-down
			//		behavior.
			// tags:
			//		protected
			return false;
		},

		////////////////// GET/SET, CUSTOM SETTERS, ETC. ///////////////////

		_setStyleAttr: function(/*String||Object*/ value){
			// summary:
			//		Sets the style attribute of the widget according to value,
			//		which is either a hash like {height: "5px", width: "3px"}
			//		or a plain string
			// description:
			//		Determines which node to set the style on based on style setting
			//		in attributeMap.
			// tags:
			//		protected

			var mapNode = this.domNode;

			// Note: technically we should revert any style setting made in a previous call
			// to his method, but that's difficult to keep track of.

			if(lang.isObject(value)){
				domStyle.set(mapNode, value);
			}else{
				if(mapNode.style.cssText){
					mapNode.style.cssText += "; " + value;
				}else{
					mapNode.style.cssText = value;
				}
			}

			this._set("style", value);
		},

		_attrToDom: function(/*String*/ attr, /*String*/ value, /*Object?*/ commands){
			// summary:
			//		Reflect a widget attribute (title, tabIndex, duration etc.) to
			//		the widget DOM, as specified by commands parameter.
			//		If commands isn't specified then it's looked up from attributeMap.
			//		Note some attributes like "type"
			//		cannot be processed this way as they are not mutable.
			// attr:
			//		Name of member variable (ex: "focusNode" maps to this.focusNode) pointing
			//		to DOMNode inside the widget, or alternately pointing to a subwidget
			// tags:
			//		private

			commands = arguments.length >= 3 ? commands : this.attributeMap[attr];

			array.forEach(lang.isArray(commands) ? commands : [commands], function(command){

				// Get target node and what we are doing to that node
				var mapNode = this[command.node || command || "domNode"];	// DOM node
				var type = command.type || "attribute";	// class, innerHTML, innerText, or attribute

				switch(type){
					case "attribute":
						if(lang.isFunction(value)){ // functions execute in the context of the widget
							value = lang.hitch(this, value);
						}

						// Get the name of the DOM node attribute; usually it's the same
						// as the name of the attribute in the widget (attr), but can be overridden.
						// Also maps handler names to lowercase, like onSubmit --> onsubmit
						var attrName = command.attribute ? command.attribute :
							(/^on[A-Z][a-zA-Z]*$/.test(attr) ? attr.toLowerCase() : attr);

						if(mapNode.tagName){
							// Normal case, mapping to a DOMNode.  Note that modern browsers will have a mapNode.set()
							// method, but for consistency we still call domAttr
							domAttr.set(mapNode, attrName, value);
						}else{
							// mapping to a sub-widget
							mapNode.set(attrName, value);
						}
						break;
					case "innerText":
						mapNode.innerHTML = "";
						mapNode.appendChild(this.ownerDocument.createTextNode(value));
						break;
					case "innerHTML":
						mapNode.innerHTML = value;
						break;
					case "class":
						domClass.replace(mapNode, value, this[attr]);
						break;
				}
			}, this);
		},

		get: function(name){
			// summary:
			//		Get a property from a widget.
			// name:
			//		The property to get.
			// description:
			//		Get a named property from a widget. The property may
			//		potentially be retrieved via a getter method. If no getter is defined, this
			//		just retrieves the object's property.
			//
			//		For example, if the widget has properties `foo` and `bar`
			//		and a method named `_getFooAttr()`, calling:
			//		`myWidget.get("foo")` would be equivalent to calling
			//		`widget._getFooAttr()` and `myWidget.get("bar")`
			//		would be equivalent to the expression
			//		`widget.bar2`
			var names = this._getAttrNames(name);
			return this[names.g] ? this[names.g]() : this._get(name);
		},

		set: function(name, value){
			// summary:
			//		Set a property on a widget
			// name:
			//		The property to set.
			// value:
			//		The value to set in the property.
			// description:
			//		Sets named properties on a widget which may potentially be handled by a
			//		setter in the widget.
			//
			//		For example, if the widget has properties `foo` and `bar`
			//		and a method named `_setFooAttr()`, calling
			//		`myWidget.set("foo", "Howdy!")` would be equivalent to calling
			//		`widget._setFooAttr("Howdy!")` and `myWidget.set("bar", 3)`
			//		would be equivalent to the statement `widget.bar = 3;`
			//
			//		set() may also be called with a hash of name/value pairs, ex:
			//
			//	|	myWidget.set({
			//	|		foo: "Howdy",
			//	|		bar: 3
			//	|	});
			//
			//	This is equivalent to calling `set(foo, "Howdy")` and `set(bar, 3)`

			if(typeof name === "object"){
				for(var x in name){
					this.set(x, name[x]);
				}
				return this;
			}
			var names = this._getAttrNames(name),
				setter = this[names.s];
			if(lang.isFunction(setter)){
				// use the explicit setter
				var result = setter.apply(this, Array.prototype.slice.call(arguments, 1));
			}else{
				// Mapping from widget attribute to DOMNode/subwidget attribute/value/etc.
				// Map according to:
				//		1. attributeMap setting, if one exists (TODO: attributeMap deprecated, remove in 2.0)
				//		2. _setFooAttr: {...} type attribute in the widget (if one exists)
				//		3. apply to focusNode or domNode if standard attribute name, excluding funcs like onClick.
				// Checks if an attribute is a "standard attribute" by whether the DOMNode JS object has a similar
				// attribute name (ex: accept-charset attribute matches jsObject.acceptCharset).
				// Note also that Tree.focusNode() is a function not a DOMNode, so test for that.
				var defaultNode = this.focusNode && !lang.isFunction(this.focusNode) ? "focusNode" : "domNode",
					tag = this[defaultNode] && this[defaultNode].tagName,
					attrsForTag = tag && (tagAttrs[tag] || (tagAttrs[tag] = getAttrs(this[defaultNode]))),
					map = name in this.attributeMap ? this.attributeMap[name] :
						names.s in this ? this[names.s] :
							((attrsForTag && names.l in attrsForTag && typeof value != "function") ||
								/^aria-|^data-|^role$/.test(name)) ? defaultNode : null;
				if(map != null){
					this._attrToDom(name, value, map);
				}
				this._set(name, value);
			}
			return result || this;
		},

		_attrPairNames: {}, // shared between all widgets
		_getAttrNames: function(name){
			// summary:
			//		Helper function for get() and set().
			//		Caches attribute name values so we don't do the string ops every time.
			// tags:
			//		private

			var apn = this._attrPairNames;
			if(apn[name]){
				return apn[name];
			}
			var uc = name.replace(/^[a-z]|-[a-zA-Z]/g, function(c){
				return c.charAt(c.length - 1).toUpperCase();
			});
			return (apn[name] = {
				n: name + "Node",
				s: "_set" + uc + "Attr", // converts dashes to camel case, ex: accept-charset --> _setAcceptCharsetAttr
				g: "_get" + uc + "Attr",
				l: uc.toLowerCase()        // lowercase name w/out dashes, ex: acceptcharset
			});
		},

		_set: function(/*String*/ name, /*anything*/ value){
			// summary:
			//		Helper function to set new value for specified property, and call handlers
			//		registered with watch() if the value has changed.
			var oldValue = this[name];
			this[name] = value;
			if(this._created && value !== oldValue){
				if(this._watchCallbacks){
					this._watchCallbacks(name, oldValue, value);
				}
				this.emit("attrmodified-" + name, {
					detail: {
						prevValue: oldValue,
						newValue: value
					}
				});
			}
		},

		_get: function(/*String*/ name){
			// summary:
			//		Helper function to get value for specified property stored by this._set(),
			//		i.e. for properties with custom setters.  Used mainly by custom getters.
			//
			//		For example, CheckBox._getValueAttr() calls this._get("value").

			// future: return name in this.props ? this.props[name] : this[name];
			return this[name];
		},

		emit: function(/*String*/ type, /*Object?*/ eventObj, /*Array?*/ callbackArgs){
			// summary:
			//		Used by widgets to signal that a synthetic event occurred, ex:
			//	|	myWidget.emit("attrmodified-selectedChildWidget", {}).
			//
			//		Emits an event on this.domNode named type.toLowerCase(), based on eventObj.
			//		Also calls onType() method, if present, and returns value from that method.
			//		By default passes eventObj to callback, but will pass callbackArgs instead, if specified.
			//		Modifies eventObj by adding missing parameters (bubbles, cancelable, widget).
			// tags:
			//		protected

			// Specify fallback values for bubbles, cancelable in case they are not set in eventObj.
			// Also set pointer to widget, although since we can't add a pointer to the widget for native events
			// (see #14729), maybe we shouldn't do it here?
			eventObj = eventObj || {};
			if(eventObj.bubbles === undefined){
				eventObj.bubbles = true;
			}
			if(eventObj.cancelable === undefined){
				eventObj.cancelable = true;
			}
			if(!eventObj.detail){
				eventObj.detail = {};
			}
			eventObj.detail.widget = this;

			var ret, callback = this["on" + type];
			if(callback){
				ret = callback.apply(this, callbackArgs ? callbackArgs : [eventObj]);
			}

			// Emit event, but avoid spurious emit()'s as parent sets properties on child during startup/destroy
			if(this._started && !this._beingDestroyed){
				on.emit(this.domNode, type.toLowerCase(), eventObj);
			}

			return ret;
		},

		on: function(/*String|Function*/ type, /*Function*/ func){
			// summary:
			//		Call specified function when event occurs, ex: myWidget.on("click", function(){ ... }).
			// type:
			//		Name of event (ex: "click") or extension event like touch.press.
			// description:
			//		Call specified function when event `type` occurs, ex: `myWidget.on("click", function(){ ... })`.
			//		Note that the function is not run in any particular scope, so if (for example) you want it to run in the
			//		widget's scope you must do `myWidget.on("click", lang.hitch(myWidget, func))`.

			// For backwards compatibility, if there's an onType() method in the widget then connect to that.
			// Remove in 2.0.
			var widgetMethod = this._onMap(type);
			if(widgetMethod){
				return aspect.after(this, widgetMethod, func, true);
			}

			// Otherwise, just listen for the event on this.domNode.
			return this.own(on(this.domNode, type, func))[0];
		},

		_onMap: function(/*String|Function*/ type){
			// summary:
			//		Maps on() type parameter (ex: "mousemove") to method name (ex: "onMouseMove").
			//		If type is a synthetic event like touch.press then returns undefined.
			var ctor = this.constructor, map = ctor._onMap;
			if(!map){
				map = (ctor._onMap = {});
				for(var attr in ctor.prototype){
					if(/^on/.test(attr)){
						map[attr.replace(/^on/, "").toLowerCase()] = attr;
					}
				}
			}
			return map[typeof type == "string" && type.toLowerCase()];	// String
		},

		toString: function(){
			// summary:
			//		Returns a string that represents the widget.
			// description:
			//		When a widget is cast to a string, this method will be used to generate the
			//		output. Currently, it does not implement any sort of reversible
			//		serialization.
			return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']'; // String
		},

		getChildren: function(){
			// summary:
			//		Returns all direct children of this widget, i.e. all widgets underneath this.containerNode whose parent
			//		is this widget.   Note that it does not return all descendants, but rather just direct children.
			//		Analogous to [Node.childNodes](https://developer.mozilla.org/en-US/docs/DOM/Node.childNodes),
			//		except containing widgets rather than DOMNodes.
			//
			//		The result intentionally excludes internally created widgets (a.k.a. supporting widgets)
			//		outside of this.containerNode.
			//
			//		Note that the array returned is a simple array.  Application code should not assume
			//		existence of methods like forEach().

			return this.containerNode ? registry.findWidgets(this.containerNode) : []; // dijit/_WidgetBase[]
		},

		getParent: function(){
			// summary:
			//		Returns the parent widget of this widget.

			return registry.getEnclosingWidget(this.domNode.parentNode);
		},

		connect: function(/*Object|null*/ obj, /*String|Function*/ event, /*String|Function*/ method){
			// summary:
			//		Deprecated, will be removed in 2.0, use this.own(on(...)) or this.own(aspect.after(...)) instead.
			//
			//		Connects specified obj/event to specified method of this object
			//		and registers for disconnect() on widget destroy.
			//
			//		Provide widget-specific analog to dojo.connect, except with the
			//		implicit use of this widget as the target object.
			//		Events connected with `this.connect` are disconnected upon
			//		destruction.
			// returns:
			//		A handle that can be passed to `disconnect` in order to disconnect before
			//		the widget is destroyed.
			// example:
			//	|	var btn = new Button();
			//	|	// when foo.bar() is called, call the listener we're going to
			//	|	// provide in the scope of btn
			//	|	btn.connect(foo, "bar", function(){
			//	|		console.debug(this.toString());
			//	|	});
			// tags:
			//		protected

			return this.own(connect.connect(obj, event, this, method))[0];	// handle
		},

		disconnect: function(handle){
			// summary:
			//		Deprecated, will be removed in 2.0, use handle.remove() instead.
			//
			//		Disconnects handle created by `connect`.
			// tags:
			//		protected

			handle.remove();
		},

		subscribe: function(t, method){
			// summary:
			//		Deprecated, will be removed in 2.0, use this.own(topic.subscribe()) instead.
			//
			//		Subscribes to the specified topic and calls the specified method
			//		of this object and registers for unsubscribe() on widget destroy.
			//
			//		Provide widget-specific analog to dojo.subscribe, except with the
			//		implicit use of this widget as the target object.
			// t: String
			//		The topic
			// method: Function
			//		The callback
			// example:
			//	|	var btn = new Button();
			//	|	// when /my/topic is published, this button changes its label to
			//	|	// be the parameter of the topic.
			//	|	btn.subscribe("/my/topic", function(v){
			//	|		this.set("label", v);
			//	|	});
			// tags:
			//		protected
			return this.own(topic.subscribe(t, lang.hitch(this, method)))[0];	// handle
		},

		unsubscribe: function(/*Object*/ handle){
			// summary:
			//		Deprecated, will be removed in 2.0, use handle.remove() instead.
			//
			//		Unsubscribes handle created by this.subscribe.
			//		Also removes handle from this widget's list of subscriptions
			// tags:
			//		protected

			handle.remove();
		},

		isLeftToRight: function(){
			// summary:
			//		Return this widget's explicit or implicit orientation (true for LTR, false for RTL)
			// tags:
			//		protected
			return this.dir ? (this.dir == "ltr") : domGeometry.isBodyLtr(this.ownerDocument); //Boolean
		},

		isFocusable: function(){
			// summary:
			//		Return true if this widget can currently be focused
			//		and false if not
			return this.focus && (domStyle.get(this.domNode, "display") != "none");
		},

		placeAt: function(/* String|DomNode|_Widget */ reference, /* String|Int? */ position){
			// summary:
			//		Place this widget somewhere in the DOM based
			//		on standard domConstruct.place() conventions.
			// description:
			//		A convenience function provided in all _Widgets, providing a simple
			//		shorthand mechanism to put an existing (or newly created) Widget
			//		somewhere in the dom, and allow chaining.
			// reference:
			//		Widget, DOMNode, or id of widget or DOMNode
			// position:
			//		If reference is a widget (or id of widget), and that widget has an ".addChild" method,
			//		it will be called passing this widget instance into that method, supplying the optional
			//		position index passed.  In this case position (if specified) should be an integer.
			//
			//		If reference is a DOMNode (or id matching a DOMNode but not a widget),
			//		the position argument can be a numeric index or a string
			//		"first", "last", "before", or "after", same as dojo/dom-construct::place().
			// returns: dijit/_WidgetBase
			//		Provides a useful return of the newly created dijit._Widget instance so you
			//		can "chain" this function by instantiating, placing, then saving the return value
			//		to a variable.
			// example:
			//	|	// create a Button with no srcNodeRef, and place it in the body:
			//	|	var button = new Button({ label:"click" }).placeAt(win.body());
			//	|	// now, 'button' is still the widget reference to the newly created button
			//	|	button.on("click", function(e){ console.log('click'); }));
			// example:
			//	|	// create a button out of a node with id="src" and append it to id="wrapper":
			//	|	var button = new Button({},"src").placeAt("wrapper");
			// example:
			//	|	// place a new button as the first element of some div
			//	|	var button = new Button({ label:"click" }).placeAt("wrapper","first");
			// example:
			//	|	// create a contentpane and add it to a TabContainer
			//	|	var tc = dijit.byId("myTabs");
			//	|	new ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)

			var refWidget = !reference.tagName && registry.byId(reference);
			if(refWidget && refWidget.addChild && (!position || typeof position === "number")){
				// Adding this to refWidget and can use refWidget.addChild() to handle everything.
				refWidget.addChild(this, position);
			}else{
				// "reference" is a plain DOMNode, or we can't use refWidget.addChild().   Use domConstruct.place() and
				// target refWidget.containerNode for nested placement (position==number, "first", "last", "only"), and
				// refWidget.domNode otherwise ("after"/"before"/"replace").  (But not supported officially, see #14946.)
				var ref = refWidget ?
					(refWidget.containerNode && !/after|before|replace/.test(position || "") ?
						refWidget.containerNode : refWidget.domNode) : dom.byId(reference, this.ownerDocument);
				domConstruct.place(this.domNode, ref, position);

				// Start this iff it has a parent widget that's already started.
				// TODO: for 2.0 maybe it should also start the widget when this.getParent() returns null??
				if(!this._started && (this.getParent() || {})._started){
					this.startup();
				}
			}
			return this;
		},

		defer: function(fcn, delay){
			// summary:
			//		Wrapper to setTimeout to avoid deferred functions executing
			//		after the originating widget has been destroyed.
			//		Returns an object handle with a remove method (that returns null) (replaces clearTimeout).
			// fcn: Function
			//		Function reference.
			// delay: Number?
			//		Delay, defaults to 0.
			// tags:
			//		protected

			var timer = setTimeout(lang.hitch(this,
				function(){
					if(!timer){
						return;
					}
					timer = null;
					if(!this._destroyed){
						lang.hitch(this, fcn)();
					}
				}),
				delay || 0
			);
			return {
				remove: function(){
					if(timer){
						clearTimeout(timer);
						timer = null;
					}
					return null; // so this works well: handle = handle.remove();
				}
			};
		}
	});

	if(has("dojo-bidi")){
		_WidgetBase.extend(_BidiMixin);
	}

	return _WidgetBase;
});

},
'dojo/Stateful':function(){
define(["./_base/declare", "./_base/lang", "./_base/array", "./when"], function(declare, lang, array, when){
	// module:
	//		dojo/Stateful

return declare("dojo.Stateful", null, {
	// summary:
	//		Base class for objects that provide named properties with optional getter/setter
	//		control and the ability to watch for property changes
	//
	//		The class also provides the functionality to auto-magically manage getters
	//		and setters for object attributes/properties.
	//		
	//		Getters and Setters should follow the format of _xxxGetter or _xxxSetter where 
	//		the xxx is a name of the attribute to handle.  So an attribute of "foo" 
	//		would have a custom getter of _fooGetter and a custom setter of _fooSetter.
	//
	// example:
	//	|	var obj = new dojo.Stateful();
	//	|	obj.watch("foo", function(){
	//	|		console.log("foo changed to " + this.get("foo"));
	//	|	});
	//	|	obj.set("foo","bar");

	// _attrPairNames: Hash
	//		Used across all instances a hash to cache attribute names and their getter 
	//		and setter names.
	_attrPairNames: {},

	_getAttrNames: function(name){
		// summary:
		//		Helper function for get() and set().
		//		Caches attribute name values so we don't do the string ops every time.
		// tags:
		//		private

		var apn = this._attrPairNames;
		if(apn[name]){ return apn[name]; }
		return (apn[name] = {
			s: "_" + name + "Setter",
			g: "_" + name + "Getter"
		});
	},

	postscript: function(/*Object?*/ params){
		// Automatic setting of params during construction
		if (params){ this.set(params); }
	},

	_get: function(name, names){
		// summary:
		//		Private function that does a get based off a hash of names
		// names:
		//		Hash of names of custom attributes
		return typeof this[names.g] === "function" ? this[names.g]() : this[name];
	},
	get: function(/*String*/name){
		// summary:
		//		Get a property on a Stateful instance.
		// name:
		//		The property to get.
		// returns:
		//		The property value on this Stateful instance.
		// description:
		//		Get a named property on a Stateful object. The property may
		//		potentially be retrieved via a getter method in subclasses. In the base class
		//		this just retrieves the object's property.
		//		For example:
		//	|	stateful = new dojo.Stateful({foo: 3});
		//	|	stateful.get("foo") // returns 3
		//	|	stateful.foo // returns 3

		return this._get(name, this._getAttrNames(name)); //Any
	},
	set: function(/*String*/name, /*Object*/value){
		// summary:
		//		Set a property on a Stateful instance
		// name:
		//		The property to set.
		// value:
		//		The value to set in the property.
		// returns:
		//		The function returns this dojo.Stateful instance.
		// description:
		//		Sets named properties on a stateful object and notifies any watchers of
		//		the property. A programmatic setter may be defined in subclasses.
		//		For example:
		//	|	stateful = new dojo.Stateful();
		//	|	stateful.watch(function(name, oldValue, value){
		//	|		// this will be called on the set below
		//	|	}
		//	|	stateful.set(foo, 5);
		//
		//	set() may also be called with a hash of name/value pairs, ex:
		//	|	myObj.set({
		//	|		foo: "Howdy",
		//	|		bar: 3
		//	|	})
		//	This is equivalent to calling set(foo, "Howdy") and set(bar, 3)

		// If an object is used, iterate through object
		if(typeof name === "object"){
			for(var x in name){
				if(name.hasOwnProperty(x) && x !="_watchCallbacks"){
					this.set(x, name[x]);
				}
			}
			return this;
		}

		var names = this._getAttrNames(name),
			oldValue = this._get(name, names),
			setter = this[names.s],
			result;
		if(typeof setter === "function"){
			// use the explicit setter
			result = setter.apply(this, Array.prototype.slice.call(arguments, 1));
		}else{
			// no setter so set attribute directly
			this[name] = value;
		}
		if(this._watchCallbacks){
			var self = this;
			// If setter returned a promise, wait for it to complete, otherwise call watches immediatly
			when(result, function(){
				self._watchCallbacks(name, oldValue, value);
			});
		}
		return this; // dojo/Stateful
	},
	_changeAttrValue: function(name, value){
		// summary:
		//		Internal helper for directly changing an attribute value.
		//
		// name: String
		//		The property to set.
		// value: Mixed
		//		The value to set in the property.
		//
		// description:
		//		Directly change the value of an attribute on an object, bypassing any 
		//		accessor setter.  Also handles the calling of watch and emitting events. 
		//		It is designed to be used by descendent class when there are two values 
		//		of attributes that are linked, but calling .set() is not appropriate.

		var oldValue = this.get(name);
		this[name] = value;
		if(this._watchCallbacks){
			this._watchCallbacks(name, oldValue, value);
		}
		return this; // dojo/Stateful
	},
	watch: function(/*String?*/name, /*Function*/callback){
		// summary:
		//		Watches a property for changes
		// name:
		//		Indicates the property to watch. This is optional (the callback may be the
		//		only parameter), and if omitted, all the properties will be watched
		// returns:
		//		An object handle for the watch. The unwatch method of this object
		//		can be used to discontinue watching this property:
		//		|	var watchHandle = obj.watch("foo", callback);
		//		|	watchHandle.unwatch(); // callback won't be called now
		// callback:
		//		The function to execute when the property changes. This will be called after
		//		the property has been changed. The callback will be called with the |this|
		//		set to the instance, the first argument as the name of the property, the
		//		second argument as the old value and the third argument as the new value.

		var callbacks = this._watchCallbacks;
		if(!callbacks){
			var self = this;
			callbacks = this._watchCallbacks = function(name, oldValue, value, ignoreCatchall){
				var notify = function(propertyCallbacks){
					if(propertyCallbacks){
						propertyCallbacks = propertyCallbacks.slice();
						for(var i = 0, l = propertyCallbacks.length; i < l; i++){
							propertyCallbacks[i].call(self, name, oldValue, value);
						}
					}
				};
				notify(callbacks['_' + name]);
				if(!ignoreCatchall){
					notify(callbacks["*"]); // the catch-all
				}
			}; // we use a function instead of an object so it will be ignored by JSON conversion
		}
		if(!callback && typeof name === "function"){
			callback = name;
			name = "*";
		}else{
			// prepend with dash to prevent name conflicts with function (like "name" property)
			name = '_' + name;
		}
		var propertyCallbacks = callbacks[name];
		if(typeof propertyCallbacks !== "object"){
			propertyCallbacks = callbacks[name] = [];
		}
		propertyCallbacks.push(callback);

		// TODO: Remove unwatch in 2.0
		var handle = {};
		handle.unwatch = handle.remove = function(){
			var index = array.indexOf(propertyCallbacks, callback);
			if(index > -1){
				propertyCallbacks.splice(index, 1);
			}
		};
		return handle; //Object
	}

});

});

},
'dijit/Destroyable':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/aspect",
	"dojo/_base/declare"
], function(array, aspect, declare){

	// module:
	//		dijit/Destroyable

	return declare("dijit.Destroyable", null, {
		// summary:
		//		Mixin to track handles and release them when instance is destroyed.
		// description:
		//		Call this.own(...) on list of handles (returned from dojo/aspect, dojo/on,
		//		dojo/Stateful::watch, or any class (including widgets) with a destroyRecursive() or destroy() method.
		//		Then call destroy() later to destroy this instance and release the resources.

		destroy: function(/*Boolean*/ preserveDom){
			// summary:
			//		Destroy this class, releasing any resources registered via own().
			this._destroyed = true;
		},

		own: function(){
			// summary:
			//		Track specified handles and remove/destroy them when this instance is destroyed, unless they were
			//		already removed/destroyed manually.
			// tags:
			//		protected
			// returns:
			//		The array of specified handles, so you can do for example:
			//	|		var handle = this.own(on(...))[0];

			array.forEach(arguments, function(handle){
				var destroyMethodName =
					"destroyRecursive" in handle ? "destroyRecursive" : // remove "destroyRecursive" for 2.0
						"destroy" in handle ? "destroy" :
							"remove";

				// When this.destroy() is called, destroy handle.  Since I'm using aspect.before(),
				// the handle will be destroyed before a subclass's destroy() method starts running, before it calls
				// this.inherited() or even if it doesn't call this.inherited() at all.  If that's an issue, make an
				// onDestroy() method and connect to that instead.
				var odh = aspect.before(this, "destroy", function(preserveDom){
					handle[destroyMethodName](preserveDom);
				});

				// If handle is destroyed manually before this.destroy() is called, remove the listener set directly above.
				var hdh = aspect.after(handle, destroyMethodName, function(){
					odh.remove();
					hdh.remove();
				}, true);
			}, this);

			return arguments;		// handle
		}
	});
});

},
'dojox/widget/_Invalidating':function(){
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Stateful"], 
	function(declare, lang, Stateful){
		
	return declare("dojox.widget._Invalidating", Stateful, {
		// summary:
		//		Base class for classes (usually widgets) that watch invalidated properties and delay the rendering
		//		after these properties modifications to the next execution frame.
		
		// invalidatingPoperties: String[]
		//		The list of properties to watch for to trigger invalidation. This list must be initialized in the
		//		constructor. Default value is null.
		invalidatingProperties: null,
		// invalidRenderering: Boolean
		//		Whether the rendering is invalid or not. This is a readonly information, one must call 
		//		invalidateRendering to modify this flag. 
		invalidRendering: false,
		postscript: function(mixin){
			this.inherited(arguments);
			if(this.invalidatingProperties){
				var props = this.invalidatingProperties;
				for(var i = 0; i < props.length; i++){
					this.watch(props[i], lang.hitch(this, this.invalidateRendering));
					if(mixin && props[i] in mixin){
						// if the prop happens to have been passed in the ctor mixin we are invalidated
						this.invalidateRendering();
					}
				}
			}
		},
		addInvalidatingProperties: function(/*String[]*/ properties){
			// summary:
			//		Add properties to the watched properties to trigger invalidation. This method must be called in
			//		the constructor. It is typically used by subclasses of a _Invalidating class to add more properties
			//		to watch for.
			// properties:
			//		The list of properties to watch for.
			this.invalidatingProperties = this.invalidatingProperties?this.invalidatingProperties.concat(properties):properties;
		},
		invalidateRendering: function(){
			// summary:
			//		Invalidating the rendering for the next executation frame.
			if(!this.invalidRendering){
				this.invalidRendering = true;
				setTimeout(lang.hitch(this, this.validateRendering), 0);
			}
		},
		validateRendering: function(){
			// summary:
			//		Immediately validate the rendering if it has been invalidated. You generally do not call that method yourself.
			// tags:
			//		protected
			if(this.invalidRendering){
				this.refreshRendering();
				this.invalidRendering = false;
			}
		},
		refreshRendering: function(){
			// summary:
			//		Actually refresh the rendering. Implementation should implement that method.
		}
	});
});

},
'dojox/dgauges/ScaleBase':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojox/gfx", "dojo/_base/array", "dojox/widget/_Invalidating", "dojo/_base/sniff"],
	function(lang, declare, gfx, array, _Invalidating, has){
	return declare("dojox.dgauges.ScaleBase", _Invalidating, {
		// summary:
		//		The ScaleBase class is the base class for the circular and rectangular scales.
		//		A scaler must be set to use this class. A scaler is responsible for
		//		tick generation and various data-transform operations.	

		// scaler: Object
		//		The scaler used for tick generation and data-transform operations.
		//		This property is mandatory for using the scale.
		scaler: null,
		// font: Object
		//		The font used for the ticks labels.
		//		This is null by default which means this scale use the font defined 
		//		on the gauge.
		font: null,
		// labelPosition: String
		//		See CircularScale and RectangularScale for valid values.
		labelPosition: null,
		// labelGap: Number
		//		The label gap between the ticks and their labels. Default value is 1.
		labelGap: 1,
		// tickStroke: Object
		//		The GFX stroke used by the default tickShapeFunc implementation.
		tickStroke: null,
		_gauge: null,
		_gfxGroup: null,
		_bgGroup: null,
		_fgGroup: null,
		_indicators: null,
		_indicatorsIndex: null,
		_indicatorsRenderers: null,
		
		constructor: function(){
			this._indicators = [];
			this._indicatorsIndex = {};
			this._indicatorsRenderers = {};
			this._gauge = null;
			this._gfxGroup = null;
			// Fix for #1, IE<9 don't render correctly stroke with width<1
			this.tickStroke = {color: "black", width: has("ie") <= 8 ? 1 : 0.5};
			
			this.addInvalidatingProperties(["scaler", "font", "labelGap", "labelPosition", "tickShapeFunc", "tickLabelFunc", "tickStroke"]);
			
			this.watch("scaler", lang.hitch(this, this._watchScaler));
		},

		postscript: function(mixin){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			if(mixin && mixin.scaler){
				this._watchScaler("scaler", null, mixin.scaler);
			}
		},
		
		_watchers: null,

		_watchScaler: function(name, oldValue, newValue){
			// summary:
			//		Internal method.
			// tags:
			//		private
			array.forEach(this._watchers, lang.hitch(this, function(entry){
				entry.unwatch();
			}));

			// Get the properties declared by the watched object
			var props = newValue.watchedProperties;
			this._watchers = [];
			array.forEach(props, lang.hitch(this, function(entry){
				this._watchers.push(newValue.watch(entry, lang.hitch(this, this.invalidateRendering)));
			}));
		},
		
		_getFont: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var font = this.font;
			if(!font){
				font = this._gauge.font;
			}
			if(!font){
				font = gfx.defaultFont;
			}
			return font;
		},
		
		positionForValue: function(value){
			// summary:
			//		See CircularScale and Rectangular for more informations.
			// value: Number
			//		The value to convert.
			// returns: Number
			//		The position corresponding to the value.
			return 0;
		},
		
		valueForPosition: function(position){
			// summary:
			//		See CircularScale and Rectangular for more informations.
			// position: Number
			//		The position to convert.
			// returns: Number
			//		The value corresponding to the position.
		},
		
		tickLabelFunc: function(tickItem){
			// summary:
			//		Customize the text of ticks labels.
			// tickItem: Object
			//		An object containing the tick informations.
			// returns: String
			//		The text to be aligned with the tick. If null, the tick has no label.
			if(tickItem.isMinor){
				return null;
			}else{
				return String(tickItem.value);
			}
		},
		
		tickShapeFunc: function(group, scale, tickItem){
			// summary:
			//		Customize the shape of ticks.
			// group: dojox/gfx/Group
			//		The GFX group used for drawing the tick.
			// scale: dojox/dgauges/ScaleBase
			//		The scale being processed.
			// tickItem: Object
			//		An object containing the tick informations.
			return group.createLine({
				x1: 0,
				y1: 0,
				x2: tickItem.isMinor ? 6 : 10,
				y2: 0
			}).setStroke(this.tickStroke);
		},
		
		getIndicatorRenderer: function(name){
			// summary:
			//		Gets the GFX shape of an indicator.
			// name: String
			//		The name of the indicator as defined using addIndicator.
			// returns: dojox/gfx/canvas/Shape
			//		The GFX shape of the indicator.
			return this._indicatorsRenderers[name];
		},
		
		removeIndicator: function(name){
			// summary:
			//		Removes an indicator.
			// name: String
			//		The name of the indicator as defined using addIndicator.
			// returns: IndicatorBase
			//		The removed indicator.
			var indicator = this._indicatorsIndex[name];
			if(indicator){
				indicator._gfxGroup.removeShape();
				var idx = this._indicators.indexOf(indicator);
				this._indicators.splice(idx, 1);
				
				indicator._disconnectListeners();
				
				delete this._indicatorsIndex[name];
				delete this._indicatorsRenderers[name];
			}
			if(this._gauge){
				this._gauge._resetMainIndicator();
			}
			this.invalidateRendering();
			return indicator;
		},
		
		getIndicator: function(name){
			// summary:
			//		Get an indicator instance.
			// name: String
			//		The name of the indicator as defined using addIndicator.
			// returns: IndicatorBase
			//		The indicator associated with the name parameter.
			return this._indicatorsIndex[name];
		},
		
		addIndicator: function(name, indicator, behindScale){
			// summary:
			//		Add an indicator to the scale. Before calling this function, ensure 
			//		this scale has already been added to a gauge using the addElement method
			//		of the gauge.
			// name: String
			//		The name of the indicator to be added.
			// indicator: dojox/dgauges/IndicatorBase
			//		The indicator to add to this scale.
			// behindScale: Boolean
			//		If true, this indicator is drawn behind the scale. Default value is false.	
			if(this._indicatorsIndex[name] && this._indicatorsIndex[name] != indicator){
				this.removeIndicator(name);
			}
			
			this._indicators.push(indicator);
			this._indicatorsIndex[name] = indicator;
			
			if(!this._ticksGroup){
				this._createSubGroups();
			}
			
			var group = behindScale ? this._bgGroup : this._fgGroup;
			indicator._gfxGroup = group.createGroup();
			
			indicator.scale = this;
			
			return this.invalidateRendering();
		},
		
		_createSubGroups: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(!this._gfxGroup || this._ticksGroup){
				return;
			}
			this._bgGroup = this._gfxGroup.createGroup();
			this._ticksGroup = this._gfxGroup.createGroup();
			this._fgGroup = this._gfxGroup.createGroup();
		},
		
		refreshRendering: function(){
			if(!this._ticksGroup){
				this._createSubGroups();
			}
		}
	});
});


},
'dojox/gfx/matrix':function(){
define(["./_base","dojo/_base/lang"], 
  function(g, lang){
	var m = g.matrix = {};

	// candidates for dojox.math:
	var _degToRadCache = {};
	m._degToRad = function(degree){
		return _degToRadCache[degree] || (_degToRadCache[degree] = (Math.PI * degree / 180));
	};
	m._radToDeg = function(radian){ return radian / Math.PI * 180; };

	m.Matrix2D = function(arg){
		// summary:
		//		a 2D matrix object
		// description:
		//		Normalizes a 2D matrix-like object. If arrays is passed,
		//		all objects of the array are normalized and multiplied sequentially.
		// arg: Object
		//		a 2D matrix-like object, a number, or an array of such objects
		if(arg){
			if(typeof arg == "number"){
				this.xx = this.yy = arg;
			}else if(arg instanceof Array){
				if(arg.length > 0){
					var matrix = m.normalize(arg[0]);
					// combine matrices
					for(var i = 1; i < arg.length; ++i){
						var l = matrix, r = m.normalize(arg[i]);
						matrix = new m.Matrix2D();
						matrix.xx = l.xx * r.xx + l.xy * r.yx;
						matrix.xy = l.xx * r.xy + l.xy * r.yy;
						matrix.yx = l.yx * r.xx + l.yy * r.yx;
						matrix.yy = l.yx * r.xy + l.yy * r.yy;
						matrix.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
						matrix.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
					}
					lang.mixin(this, matrix);
				}
			}else{
				lang.mixin(this, arg);
			}
		}
	};

	// the default (identity) matrix, which is used to fill in missing values
	lang.extend(m.Matrix2D, {xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0});

	lang.mixin(m, {
		// summary:
		//		class constants, and methods of dojox/gfx/matrix

		// matrix constants

		// identity: dojox/gfx/matrix.Matrix2D
		//		an identity matrix constant: identity * (x, y) == (x, y)
		identity: new m.Matrix2D(),

		// flipX: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at x = 0 line: flipX * (x, y) == (-x, y)
		flipX:    new m.Matrix2D({xx: -1}),

		// flipY: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at y = 0 line: flipY * (x, y) == (x, -y)
		flipY:    new m.Matrix2D({yy: -1}),

		// flipXY: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at the origin of coordinates: flipXY * (x, y) == (-x, -y)
		flipXY:   new m.Matrix2D({xx: -1, yy: -1}),

		// matrix creators

		translate: function(a, b){
			// summary:
			//		forms a translation matrix
			// description:
			//		The resulting matrix is used to translate (move) points by specified offsets.
			// a: Number|dojox/gfx.Point
			//		an x coordinate value, or a point-like object, which specifies offsets for both dimensions
			// b: Number?
			//		a y coordinate value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 1){
				return new m.Matrix2D({dx: a, dy: b}); // dojox/gfx/matrix.Matrix2D
			}
			// branch
			return new m.Matrix2D({dx: a.x, dy: a.y}); // dojox/gfx/matrix.Matrix2D
		},
		scale: function(a, b){
			// summary:
			//		forms a scaling matrix
			// description:
			//		The resulting matrix is used to scale (magnify) points by specified offsets.
			// a: Number|dojox/gfx.Point
			//		a scaling factor used for the x coordinate, or
			//		a uniform scaling factor used for the both coordinates, or
			//		a point-like object, which specifies scale factors for both dimensions
			// b: Number?
			//		a scaling factor used for the y coordinate
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 1){
				return new m.Matrix2D({xx: a, yy: b}); // dojox/gfx/matrix.Matrix2D
			}
			if(typeof a == "number"){
				return new m.Matrix2D({xx: a, yy: a}); // dojox/gfx/matrix.Matrix2D
			}
			return new m.Matrix2D({xx: a.x, yy: a.y}); // dojox/gfx/matrix.Matrix2D
		},
		rotate: function(angle){
			// summary:
			//		forms a rotating matrix
			// description:
			//		The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		an angle of rotation in radians (>0 for CW)
			// returns: dojox/gfx/matrix.Matrix2D
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			return new m.Matrix2D({xx: c, xy: -s, yx: s, yy: c}); // dojox/gfx/matrix.Matrix2D
		},
		rotateg: function(degree){
			// summary:
			//		forms a rotating matrix
			// description:
			//		The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.rotate() for comparison.
			// degree: Number
			//		an angle of rotation in degrees (>0 for CW)
			// returns: dojox/gfx/matrix.Matrix2D
			return m.rotate(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		skewX: function(angle) {
			// summary:
			//		forms an x skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		a skewing angle in radians
			// returns: dojox/gfx/matrix.Matrix2D
			return new m.Matrix2D({xy: Math.tan(angle)}); // dojox/gfx/matrix.Matrix2D
		},
		skewXg: function(degree){
			// summary:
			//		forms an x skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.skewX() for comparison.
			// degree: Number
			//		a skewing angle in degrees
			// returns: dojox/gfx/matrix.Matrix2D
			return m.skewX(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		skewY: function(angle){
			// summary:
			//		forms a y skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		a skewing angle in radians
			// returns: dojox/gfx/matrix.Matrix2D
			return new m.Matrix2D({yx: Math.tan(angle)}); // dojox/gfx/matrix.Matrix2D
		},
		skewYg: function(degree){
			// summary:
			//		forms a y skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.skewY() for comparison.
			// degree: Number
			//		a skewing angle in degrees
			// returns: dojox/gfx/matrix.Matrix2D
			return m.skewY(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		reflect: function(a, b){
			// summary:
			//		forms a reflection matrix
			// description:
			//		The resulting matrix is used to reflect points around a vector,
			//		which goes through the origin.
			// a: dojox/gfx.Point|Number
			//		a point-like object, which specifies a vector of reflection, or an X value
			// b: Number?
			//		a Y value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = 2 * a * b / n2;
			return new m.Matrix2D({xx: 2 * a2 / n2 - 1, xy: xy, yx: xy, yy: 2 * b2 / n2 - 1}); // dojox/gfx/matrix.Matrix2D
		},
		project: function(a, b){
			// summary:
			//		forms an orthogonal projection matrix
			// description:
			//		The resulting matrix is used to project points orthogonally on a vector,
			//		which goes through the origin.
			// a: dojox/gfx.Point|Number
			//		a point-like object, which specifies a vector of projection, or
			//		an x coordinate value
			// b: Number?
			//		a y coordinate value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = a * b / n2;
			return new m.Matrix2D({xx: a2 / n2, xy: xy, yx: xy, yy: b2 / n2}); // dojox/gfx/matrix.Matrix2D
		},

		// ensure matrix 2D conformance
		normalize: function(matrix){
			// summary:
			//		converts an object to a matrix, if necessary
			// description:
			//		Converts any 2D matrix-like object or an array of
			//		such objects to a valid dojox/gfx/matrix.Matrix2D object.
			// matrix: Object
			//		an object, which is converted to a matrix, if necessary
			// returns: dojox/gfx/matrix.Matrix2D
			return (matrix instanceof m.Matrix2D) ? matrix : new m.Matrix2D(matrix); // dojox/gfx/matrix.Matrix2D
		},

		// common operations

		isIdentity: function(matrix){
			// summary:
			//		returns whether the specified matrix is the identity.
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be tested
			// returns: Boolean
			return matrix.xx == 1 && matrix.xy == 0 && matrix.yx == 0 && matrix.yy == 1 && matrix.dx == 0 && matrix.dy == 0; // Boolean
		},
		clone: function(matrix){
			// summary:
			//		creates a copy of a 2D matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object to be cloned
			// returns: dojox/gfx/matrix.Matrix2D
			var obj = new m.Matrix2D();
			for(var i in matrix){
				if(typeof(matrix[i]) == "number" && typeof(obj[i]) == "number" && obj[i] != matrix[i]) obj[i] = matrix[i];
			}
			return obj; // dojox/gfx/matrix.Matrix2D
		},
		invert: function(matrix){
			// summary:
			//		inverts a 2D matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object to be inverted
			// returns: dojox/gfx/matrix.Matrix2D
			var M = m.normalize(matrix),
				D = M.xx * M.yy - M.xy * M.yx;
				M = new m.Matrix2D({
					xx: M.yy/D, xy: -M.xy/D,
					yx: -M.yx/D, yy: M.xx/D,
					dx: (M.xy * M.dy - M.yy * M.dx) / D,
					dy: (M.yx * M.dx - M.xx * M.dy) / D
				});
			return M; // dojox/gfx/matrix.Matrix2D
		},
		_multiplyPoint: function(matrix, x, y){
			// summary:
			//		applies a matrix to a point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied
			// x: Number
			//		an x coordinate of a point
			// y: Number
			//		a y coordinate of a point
			// returns: dojox/gfx.Point
			return {x: matrix.xx * x + matrix.xy * y + matrix.dx, y: matrix.yx * x + matrix.yy * y + matrix.dy}; // dojox/gfx.Point
		},
		multiplyPoint: function(matrix, /* Number||Point */ a, /* Number? */ b){
			// summary:
			//		applies a matrix to a point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied
			// a: Number|dojox/gfx.Point
			//		an x coordinate of a point, or a point
			// b: Number?
			//		a y coordinate of a point
			// returns: dojox/gfx.Point
			var M = m.normalize(matrix);
			if(typeof a == "number" && typeof b == "number"){
				return m._multiplyPoint(M, a, b); // dojox/gfx.Point
			}
			return m._multiplyPoint(M, a.x, a.y); // dojox/gfx.Point
		},
		multiplyRectangle: function(matrix, /*Rectangle*/ rect){
			// summary:
			//		Applies a matrix to a rectangle.
			// description:
			//		The method applies the transformation on all corners of the
			//		rectangle and returns the smallest rectangle enclosing the 4 transformed
			//		points.
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied.
			// rect: Rectangle
			//		the rectangle to transform.
			// returns: dojox/gfx.Rectangle
			var M = m.normalize(matrix);
			rect = rect || {x:0, y:0, width:0, height:0}; 
			if(m.isIdentity(M))
				return {x: rect.x, y: rect.y, width: rect.width, height: rect.height}; // dojo/gfx.Rectangle
			var p0 = m.multiplyPoint(M, rect.x, rect.y),
				p1 = m.multiplyPoint(M, rect.x, rect.y + rect.height),
				p2 = m.multiplyPoint(M, rect.x + rect.width, rect.y),
				p3 = m.multiplyPoint(M, rect.x + rect.width, rect.y + rect.height),
				minx = Math.min(p0.x, p1.x, p2.x, p3.x),
				miny = Math.min(p0.y, p1.y, p2.y, p3.y),
				maxx = Math.max(p0.x, p1.x, p2.x, p3.x),
				maxy = Math.max(p0.y, p1.y, p2.y, p3.y);
			return{ // dojo/gfx.Rectangle
				x: minx,
				y: miny,
				width: maxx - minx,
				height: maxy - miny
			};
		},
		multiply: function(matrix){
			// summary:
			//		combines matrices by multiplying them sequentially in the given order
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object,
			//		all subsequent arguments are matrix-like objects too
			var M = m.normalize(matrix);
			// combine matrices
			for(var i = 1; i < arguments.length; ++i){
				var l = M, r = m.normalize(arguments[i]);
				M = new m.Matrix2D();
				M.xx = l.xx * r.xx + l.xy * r.yx;
				M.xy = l.xx * r.xy + l.xy * r.yy;
				M.yx = l.yx * r.xx + l.yy * r.yx;
				M.yy = l.yx * r.xy + l.yy * r.yy;
				M.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
				M.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
			}
			return M; // dojox/gfx/matrix.Matrix2D
		},

		// high level operations

		_sandwich: function(matrix, x, y){
			// summary:
			//		applies a matrix at a central point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object, which is applied at a central point
			// x: Number
			//		an x component of the central point
			// y: Number
			//		a y component of the central point
			return m.multiply(m.translate(x, y), matrix, m.translate(-x, -y)); // dojox/gfx/matrix.Matrix2D
		},
		scaleAt: function(a, b, c, d){
			// summary:
			//		scales a picture using a specified point as a center of scaling
			// description:
			//		Compare with dojox/gfx/matrix.scale().
			// a: Number
			//		a scaling factor used for the x coordinate, or a uniform scaling factor used for both coordinates
			// b: Number?
			//		a scaling factor used for the y coordinate
			// c: Number|Point
			//		an x component of a central point, or a central point
			// d: Number
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			switch(arguments.length){
				case 4:
					// a and b are scale factor components, c and d are components of a point
					return m._sandwich(m.scale(a, b), c, d); // dojox/gfx/matrix.Matrix2D
				case 3:
					if(typeof c == "number"){
						return m._sandwich(m.scale(a), b, c); // dojox/gfx/matrix.Matrix2D
					}
					return m._sandwich(m.scale(a, b), c.x, c.y); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.scale(a), b.x, b.y); // dojox/gfx/matrix.Matrix2D
		},
		rotateAt: function(angle, a, b){
			// summary:
			//		rotates a picture using a specified point as a center of rotation
			// description:
			//		Compare with dojox/gfx/matrix.rotate().
			// angle: Number
			//		an angle of rotation in radians (>0 for CW)
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.rotate(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.rotate(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		rotategAt: function(degree, a, b){
			// summary:
			//		rotates a picture using a specified point as a center of rotation
			// description:
			//		Compare with dojox/gfx/matrix.rotateg().
			// degree: Number
			//		an angle of rotation in degrees (>0 for CW)
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.rotateg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.rotateg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewXAt: function(angle, a, b){
			// summary:
			//		skews a picture along the x axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewX().
			// angle: Number
			//		a skewing angle in radians
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewX(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewX(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewXgAt: function(degree, a, b){
			// summary:
			//		skews a picture along the x axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewXg().
			// degree: Number
			//		a skewing angle in degrees
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewXg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewXg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewYAt: function(angle, a, b){
			// summary:
			//		skews a picture along the y axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewY().
			// angle: Number
			//		a skewing angle in radians
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewY(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewY(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewYgAt: function(/* Number */ degree, /* Number||Point */ a, /* Number? */ b){
			// summary:
			//		skews a picture along the y axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewYg().
			// degree: Number
			//		a skewing angle in degrees
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewYg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewYg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		}

		//TODO: rect-to-rect mapping, scale-to-fit (isotropic and anisotropic versions)

	});
	// propagate Matrix2D up
	g.Matrix2D = m.Matrix2D;

	return m;
});



},
'dojox/dgauges/LinearScaler':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/Stateful"], function(lang, declare, Stateful){
	return declare("dojox.dgauges.LinearScaler", Stateful, {
		// summary:
		//		The linear scaler. This scaler creates major and minor ticks regularly between 
		//		a minimum and a maximum.
		//		Scalers are responsible for tick generation and various data-transform operations.		
		
		// minimum: Number
		//		The minimum value of the scaler. Default is 0.
		minimum: 0,
		// maximum: Number
		//		The maximum value of the scaler. Default is 100.
		maximum: 100,
		// snapInterval:
		//		Specifies the increment value to be used as snap values on this scale 
		//		during user interaction.
		//		Default is 1.
		snapInterval: 1,
		// majorTickInterval: Number
		//		The interval between two major ticks.
		majorTickInterval: NaN,
		// minorTickInterval: Number
		//		The interval between two minor ticks.
		minorTickInterval: NaN,
		// minorTicksEnabled: Boolean
		//		If false, minor ticks are not generated. Default is true.
		minorTicksEnabled: true,
		// majorTicks:
		//		The array of generated major ticks. You should not set this
		//		property when using the scaler.
		majorTicks: null,
		// minorTicks:
		//		The array of generated minor ticks. You should not set this
		//		property when using the scaler.
		minorTicks: null,

		_computedMajorTickInterval: NaN,
		_computedMinorTickInterval: NaN,
		
		constructor: function(){
			this.watchedProperties = ["minimum", "maximum", "majorTickInterval", "minorTickInterval", "snapInterval", "minorTicksEnabled"];
		},

		_buildMinorTickItems: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var mt = this.majorTicks;
			var minorTickCache = [];
			if(this.maximum > this.minimum){
				var majorTickCount = Math.floor((this.maximum - this.minimum) / this.getComputedMajorTickInterval()) + 1;
				var minorTickCount = Math.floor(this.getComputedMajorTickInterval() / this.getComputedMinorTickInterval());
				var data;
				for(var i = 0; i < majorTickCount - 1; i++){
					for(var j = 1; j < minorTickCount; j++){
						data = {scaler: this};
						data.isMinor = true;
						data.value = mt[i].value + j * this.getComputedMinorTickInterval();
						data.position = (Number(data.value) - this.minimum) / (this.maximum - this.minimum);
						minorTickCache.push(data);
					}
				}
			}
			return minorTickCache;
		},
		
		_buildMajorTickItems: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var majorTickCache = [];
			if(this.maximum > this.minimum){
				var majorTickCount = Math.floor((this.maximum - this.minimum) / this.getComputedMajorTickInterval()) + 1;
				var data;
				for(var i = 0; i < majorTickCount; i++){
					data = {scaler: this};
					data.isMinor = false;
					data.value = this.minimum + i * this.getComputedMajorTickInterval();
					data.position = (Number(data.value) - this.minimum) / (this.maximum - this.minimum);
					majorTickCache.push(data);
				}
			}
			return majorTickCache;
		},
		
		getComputedMajorTickInterval: function(){
			// summary:
			//		The computed or user defined major tick interval.
			// returns: Number
			//		The major tick interval used for ticks generation.
			if(!isNaN(this.majorTickInterval)){
				return this.majorTickInterval;
			}
			if(isNaN(this._computedMajorTickInterval)){
				this._computedMajorTickInterval = (this.maximum - this.minimum) / 10;
			}
			return this._computedMajorTickInterval;
		},
		
		getComputedMinorTickInterval: function(){
			// summary:
			//		The computed or user defined minor tick interval.
			// returns: Number
			//		The minor tick interval used for ticks generation.
			if(!isNaN(this.minorTickInterval)){
				return this.minorTickInterval;
			}
			if(isNaN(this._computedMinorTickInterval)){
				this._computedMinorTickInterval = this.getComputedMajorTickInterval() / 5;
			}
			return this._computedMinorTickInterval;
		},
		
		computeTicks: function(){
			// summary:
			//		Creates or re-creates the ticks for this scaler.
			// returns: Array
			//		An array containing all ticks (major then minor ticks).
			this.majorTicks = this._buildMajorTickItems();
			this.minorTicks = this.minorTicksEnabled ? this._buildMinorTickItems() : [];
			return this.majorTicks.concat(this.minorTicks);
		},
		
		positionForValue: function(value){
			// summary:
			//		Transforms a value into a relative position between 0 and 1.
			// value: Number
			//		A value to transform.
			// returns: Number
			//		The position between 0 and 1.
			var position;
			if(value == null || isNaN(value) || value <= this.minimum){
				position = 0;
			}
			if(value >= this.maximum){
				position = 1;
			}
			if(isNaN(position)){
				position = (value - this.minimum) / (this.maximum - this.minimum);
			}
			return position;
		},
		
		valueForPosition: function(position){
			// summary:
			//		Transforms a relative position (between 0 and 1) into a value.
			// position: Number
			//		A relative position to transform.
			// returns: Number
			//		The transformed value between minimum and maximum.
			var range = Math.abs(this.minimum - this.maximum);
			var value = this.minimum + range * position;
			if(!isNaN(this.snapInterval) && this.snapInterval > 0){
				value = Math.round((value - this.minimum) / this.snapInterval) * this.snapInterval + this.minimum;
			}
			return value;
		}
	});
});

},
'dojox/dgauges/CircularScale':function(){
define(["dojo/_base/declare", "dojox/gfx", "./ScaleBase", "./_circularUtils"], function(declare, gfx, ScaleBase, _circularUtils){
	return declare("dojox.dgauges.CircularScale", ScaleBase, {
		// summary:
		//		The circular scale. A scaler must be set to use this class.

		// originX: Number
		//		The origin x-coordinate of the scale in pixels.
		originX: 50,
		// originY: Number
		//		The origin y-coordinate of the scale in pixels.
		originY: 50,
		// radius: Number
		//		The outer radius in pixels of the scale.
		radius: 50,
		// startAngle: Number
		//		The start angle of the scale in degrees.
		startAngle: 0,
		// endAngle: Number
		//		The end angle of the scale in degrees.
		endAngle: 180,
		// orientation: String
		//		The orientation of the scale. Can be "clockwise" or "cclockwise".
		//		The default value is "clockwise".
		orientation: "clockwise",
		
		constructor: function(){

			this.labelPosition = "inside";
			
			this.addInvalidatingProperties(["originX", "originY", "radius", "startAngle", "endAngle", "orientation"]);
		},
		
		_getOrientationNum: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			return this.orientation == "cclockwise" ? -1 : 1;
		},
		
		positionForValue: function(/* Number */value){
			// summary:
			//		Transforms a value into an angle using the associated scaler.
			// returns: Number
			//		An angle in degrees.
			var totalAngle = _circularUtils.computeTotalAngle(this.startAngle, this.endAngle, this.orientation);
			var relativePos = this.scaler.positionForValue(value);
			return _circularUtils.modAngle(this.startAngle + this._getOrientationNum() * totalAngle * relativePos, 360);
		},
		
		_positionForTickItem: function(tickItem){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var totalAngle = _circularUtils.computeTotalAngle(this.startAngle, this.endAngle, this.orientation);
			return _circularUtils.modAngle(this.startAngle + this._getOrientationNum() * totalAngle * tickItem.position, 360);
		},
		
		valueForPosition: function(/* Number */angle){
			// summary:
			//		Transforms an angle in degrees into a value using the associated scaler.
			// returns: Number
			//		The value represented by angle. 
			if(!this.positionInRange(angle)){
				var min1 = _circularUtils.modAngle(this.startAngle - angle, 360);
				var min2 = 360 - min1;
				var max1 = _circularUtils.modAngle(this.endAngle - angle, 360);
				var max2 = 360 - max1;
				var pos;
				if(Math.min(min1, min2) < Math.min(max1, max2)){
					pos = 0;
				}else{
					pos = 1;
				}
			}else{
				var relativeAngle = _circularUtils.modAngle(this._getOrientationNum() * (angle - this.startAngle), 360);
				var totalAngle = _circularUtils.computeTotalAngle(this.startAngle, this.endAngle, this.orientation);
				pos = relativeAngle / totalAngle;
			}
			return this.scaler.valueForPosition(pos);
		},
		
		positionInRange: function(/* Number */value){
			// summary:
			//		Returns true if the value parameter is between the accepted scale positions.
			// returns: Boolean
			//		True if the value parameter is between the accepted scale positions.
			if(this.startAngle == this.endAngle){
				return true;
			}
			value = _circularUtils.modAngle(value, 360);
			if(this._getOrientationNum() == 1){
				if(this.startAngle < this.endAngle){
					return value >= this.startAngle && value <= this.endAngle;
				}else{
					return !(value > this.endAngle && value < this.startAngle);
				}
			}else{
				if(this.startAngle < this.endAngle){
					return !(value > this.startAngle && value < this.endAngle);
				}else{
					return value >= this.endAngle && value <= this.startAngle;
				}
			}
		},
		
		_distance: function(x1, y1, x2, y2){
			// summary:
			//		Internal method.
			// tags:
			//		private
			return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
		},
		
		_layoutLabel: function(label, txt, ox, oy, lrad, angle, labelPlacement){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var font = this._getFont();
			var box = gfx._base._getTextBox(txt, {
				font: gfx.makeFontString(gfx.makeParameters(gfx.defaultFont, font))
			});
			var tw = box.w;
			var fz = font.size;
			var th = gfx.normalizedLength(fz);
			
			var tfx = ox + Math.cos(angle) * lrad - tw / 2;
			var tfy = oy - Math.sin(angle) * lrad - th / 2;
			var side;
			
			var intersections = [];
			
			// Intersection with top segment
			side = tfx;
			var ipx = side;
			var ipy = -Math.tan(angle) * side + oy + Math.tan(angle) * ox;
			// Verify if intersection is on segment
			if(ipy >= tfy && ipy <= tfy + th){
				intersections.push({
					x: ipx,
					y: ipy
				});
			}
			
			// Intersection with bottom segment
			side = tfx + tw;
			ipx = side;
			ipy = -Math.tan(angle) * side + oy + Math.tan(angle) * ox;
			// Verify if intersection is on segment
			if(ipy >= tfy && ipy <= tfy + th){
				intersections.push({
					x: ipx,
					y: ipy
				});
			}
			// Intersection with left segment
			side = tfy;
			ipx = -1 / Math.tan(angle) * side + ox + 1 / Math.tan(angle) * oy;
			ipy = side;
			// Verify if intersection is on segment
			if(ipx >= tfx && ipx <= tfx + tw){
				intersections.push({
					x: ipx,
					y: ipy
				});
			}
			// Intersection with right segment
			side = tfy + th;
			ipx = -1 / Math.tan(angle) * side + ox + 1 / Math.tan(angle) * oy;
			ipy = side;
			// Verify if intersection is on segment
			if(ipx >= tfx && ipx <= tfx + tw){
				intersections.push({
					x: ipx,
					y: ipy
				});
			}
			var dif;
			if(labelPlacement == "inside"){
				for(var it = 0; it < intersections.length; it++){
					var ip = intersections[it];
					dif = this._distance(ip.x, ip.y, ox, oy) - lrad;
					if(dif >= 0){
						// Place reference intersection point on reference circle
						tfx = ox + Math.cos(angle) * (lrad - dif) - tw / 2;
						tfy = oy - Math.sin(angle) * (lrad - dif) - th / 2;
						break;
					}
				}
			}else{// "outside" placement
				for(it = 0; it < intersections.length; it++){
					ip = intersections[it];
					dif = this._distance(ip.x, ip.y, ox, oy) - lrad;
					if(dif <= 0){
						// Place reference intersection point on reference circle
						tfx = ox + Math.cos(angle) * (lrad - dif) - tw / 2;
						tfy = oy - Math.sin(angle) * (lrad - dif) - th / 2;
						
						break;
					}
				}
			}
			if(label){
				label.setTransform([{
					dx: tfx + tw / 2,
					dy: tfy + th
				}]);
			}
		},
		
		refreshRendering: function(){
			this.inherited(arguments);
			if(!this._gfxGroup || !this.scaler){
				return;
			}
			
			// Normalize angles
			this.startAngle = _circularUtils.modAngle(this.startAngle, 360);
			this.endAngle = _circularUtils.modAngle(this.endAngle, 360);
			
			this._ticksGroup.clear();
			
			var renderer;
			var label;
			var labelText;
			
			// Layout ticks
			var allTicks = this.scaler.computeTicks();
			
			var tickBB;
			for(var i = 0; i < allTicks.length; i++){
				var tickItem = allTicks[i];
				renderer = this.tickShapeFunc(this._ticksGroup, this, tickItem);
				
				tickBB = this._gauge._computeBoundingBox(renderer);
				var a;
				if(tickItem.position){
					a = this._positionForTickItem(tickItem);
				}else{
					a = this.positionForValue(tickItem.value);
				}
				if(renderer){
					renderer.setTransform([{
						dx: this.originX,
						dy: this.originY
					}, gfx.matrix.rotateg(a), {
						dx: this.radius - tickBB.width - 2 * tickBB.x,
						dy: 0
					}]);
				}
				labelText = this.tickLabelFunc(tickItem);
				if(labelText){
					label = this._ticksGroup.createText({
						x: 0,
						y: 0,
						text: labelText,
						align: "middle"
					}).setFont(this._getFont()).setFill(this._getFont().color ? this._getFont().color : "black");
					var rad = this.radius;
					if(this.labelPosition == "inside"){
						rad -= (tickBB.width + this.labelGap);
					}else{
						rad += this.labelGap;
					}
					this._layoutLabel(label, labelText, this.originX, this.originY, rad, _circularUtils.toRadians(360 - a), this.labelPosition);
				}
			}
			
			for(var key in this._indicatorsIndex){
				this._indicatorsRenderers[key] = this._indicatorsIndex[key].invalidateRendering();
			}
		}
	});
});

},
'dojox/dgauges/_circularUtils':function(){
define(function(){
	// module:
	//		dojox/dgauges/components/_circularUtils
	// summary:
	//		Internal circular utilities.
	// tags:
	//		private

	return {
		computeTotalAngle: function(start, end, orientation){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(start == end){
				return 360;
			}else{
				return this.computeAngle(start, end, orientation, 360);
			}
		},
		
		modAngle: function(angle, base){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(base == undefined){
				base = 6.28318530718;
			}
			if(angle >= base){
				do {
					angle -= base;
				}
				while (angle >= base);
			}else{
				while (angle < 0){
					angle += base;
				}
			}
			return angle;
		},
		
		computeAngle: function(startAngle, endAngle, orientation, base){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(base == undefined){
				base = 6.28318530718;
			}
			
			var totalAngle;
			
			if(endAngle == startAngle){
				return base;
			}
			
			if(orientation == "clockwise"){
				if(endAngle < startAngle){
					totalAngle = base - (startAngle - endAngle);
				}else{
					totalAngle = endAngle - startAngle;
				}
			}
			else{
				if(endAngle < startAngle){
					totalAngle = startAngle - endAngle;
				}else{
					totalAngle = base - (endAngle - startAngle);
				}
			}
			return this.modAngle(totalAngle, base);
		},
		
		toRadians: function(deg){
			// summary:
			//		Internal method.
			// tags:
			//		private
			return deg * Math.PI / 180;
		},
		
		toDegrees: function(rad){
			// summary:
			//		Internal method.
			// tags:
			//		private
			return rad * 180 / Math.PI;
		}
	}
});

},
'dojox/dgauges/CircularValueIndicator':function(){
define(["dojo/_base/declare", "dojox/gfx", "./ScaleIndicatorBase", "dojo/_base/event"], function(declare, gfx, ScaleIndicatorBase, eventUtil){
	return declare("dojox.dgauges.CircularValueIndicator", ScaleIndicatorBase, {
		// summary:
		//		The circular value indicator, typically used for creating needles.

		indicatorShapeFunc: function(group, indicator){
			// summary:
			//		Draws the indicator. The rotation center is at (0, 0).
			// group: dojox/gfx/Group
			//		A GFX group for drawing. 
			// indicator: dojox/dgauges/IndicatorBase
			//		A reference to this indicator.
			// returns: dojox/gfx/shape.Shape
			//		A GFX shape retrievable using the getIndicatorRenderer method of the associated scale. 
			return group.createLine({
				x1: 0,
				y1: 0,
				x2: 40,
				y2: 0
			}).setStroke({
				color: "black",
				width: 1
			});
		},
		
		refreshRendering: function(){
			this.inherited(arguments);
			var v = isNaN(this._transitionValue) ? this.value : this._transitionValue;
			var angle = this.scale.positionForValue(v);
			
			this._gfxGroup.setTransform([{
				dx: this.scale.originX,
				dy: this.scale.originY
			}, gfx.matrix.rotateg(angle)]);
		},
		
		_onMouseDown: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			var origin = this.scale._gauge._gaugeToPage(this.scale.originX, this.scale.originY);
			var angle = ((Math.atan2(event.pageY - origin.y, event.pageX - origin.x)) * 180) / (Math.PI);
			this.set("value", this.scale.valueForPosition(angle));

			// prevent the browser from selecting text
			eventUtil.stop(event);
		},
		
		_onMouseMove: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			var origin = this.scale._gauge._gaugeToPage(this.scale.originX, this.scale.originY);
			var angle = ((Math.atan2(event.pageY - origin.y, event.pageX - origin.x)) * 180) / (Math.PI);
			this.set("value", this.scale.valueForPosition(angle));
		}
	});
});

},
'dojox/dgauges/ScaleIndicatorBase':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/window", "dojo/on", "dojo/touch", "dojo/_base/fx", "dojox/gfx", "dojox/widget/_Invalidating", "./IndicatorBase"],
	function(lang, declare, win, on, touch, fx, gfx, _Invalidating, IndicatorBase){
	return declare("dojox.dgauges.ScaleIndicatorBase", IndicatorBase, {
		// summary:
		//		The base class for indicators that rely on a scale for their rendering.
		//		Typically, value indicators and range indicators are subclasses of ScaleIndicatorBase.

		// summary:
		//		The scale associated with this indicator.
		scale: null,
		// summary:
		//		The value of the indicator. Default is 0.
		value: 0,
		
		// interactionArea: String
		//		How to interact with the indicator using mouse or touch interactions.
		//		Can be "indicator", "gauge", "area" or "none". The default value is "gauge".
		//		If set to "indicator", the indicator shape reacts to mouse and touch events.
		//		If set to "gauge", the whole gauge reacts to mouse and touch events.
		//		If set to "area", the whole bounding box of the widget reacts to mouse and touch events.
		//		If "none", interactions are disabled.
		interactionArea: "gauge",

		// interactionMode: String
		//		Deprecated. Can be "mouse" or "touch".
		interactionMode: "mouse",

		// animationDuration: Number
		//		The duration of the value change animation in milliseconds. Default is 0.
		//		The animation occurs on both user interactions and programmatic value changes.
		//		Set this property to 0 to disable animation.
		animationDuration: 0,

		// animationEaser: Object
		//		The easer function of the value change animation. Default is fx._defaultEasing.
		animationEaser: null,

		_indicatorShapeFuncFlag: true,
		
		_interactionAreaFlag: true,
		
		_downListeners: null,
		
		_cursorListeners: null,
		
		_moveAndUpListeners: null,
		
		_transitionValue: NaN,
		
		_preventAnimation: false,
		
		_animation: null,
		
		constructor: function(){
		
			// watches changed happening on the "value" property
			this.watch("value", lang.hitch(this, function(){
				this.valueChanged(this);
			}));
			this.watch("value", lang.hitch(this, this._startAnimation));
			
			this.watch("interactionArea", lang.hitch(this, function(){
				this._interactionAreaFlag = true;
			}));
			this.watch("interactionMode", lang.hitch(this, function(){
				this._interactionAreaFlag = true;
			}));
			
			this.watch("indicatorShapeFunc", lang.hitch(this, function(){
				this._indicatorShapeFuncFlag = true;
			}));
			
			this.addInvalidatingProperties(["scale", "value", "indicatorShapeFunc", "interactionArea", "interactionMode"]);
			
			this._downListeners = [];
			this._moveAndUpListeners = [];
			this._cursorListeners = [];
		},
		
		_startAnimation: function(prop, oldValue, newValue){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(this.animationDuration == 0){
				return;
			}
			if(this._animation && (this._preventAnimation || oldValue == newValue)){
				this._animation.stop();
				return;
			}
			this._animation = new fx.Animation({curve: [oldValue, newValue], 
										duration: this.animationDuration, 
										easing: this.animationEaser ? this.animationEaser : fx._defaultEasing,
										onAnimate: lang.hitch(this, this._updateAnimation),
										onEnd: lang.hitch(this, this._endAnimation),
										onStop: lang.hitch(this, this._endAnimation)});
			
			this._animation.play();
		},
		
		_updateAnimation: function(v){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._transitionValue = v;
			this.invalidateRendering();
		},
		
		_endAnimation: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._transitionValue = NaN; 
			this.invalidateRendering();			
		},
		
		refreshRendering: function(){
			if(this._gfxGroup == null || this.scale == null){
				return;
			}else{
				if(this._indicatorShapeFuncFlag && lang.isFunction(this.indicatorShapeFunc)){
					this._gfxGroup.clear();
					this.indicatorShapeFunc(this._gfxGroup, this);
					this._indicatorShapeFuncFlag = false;
				}
				
				if(this._interactionAreaFlag){
					this._interactionAreaFlag = this._connectDownListeners();
				}
			}
		},
		
		valueChanged: function(indicator){
			// summary:
			//		Invoked when the value of the indicator changes.
			//		User can connect an listener on this function: 
			// |	theIndicator.on("valueChanged", lang.hitch(this, function(){
			// |		//do something
			// |	}));
			on.emit(this, "valueChanged", {
				target: this,
				bubbles: true,
				cancelable: true
			});
		},
		
		_disconnectDownListeners: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			for(var i = 0; i < this._downListeners.length; i++){
				this._downListeners[i].remove();
			}
			this._downListeners = [];
		},
		
		_disconnectMoveAndUpListeners: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			for(var i = 0; i < this._moveAndUpListeners.length; i++){
				this._moveAndUpListeners[i].remove();
			}
			this._moveAndUpListeners = [];
		},
		
		_disconnectListeners: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._disconnectDownListeners();
			this._disconnectMoveAndUpListeners();
			this._disconnectCursorListeners();
		},
		
		_connectCursorListeners: function(target){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var listener = target.on(touch.over , lang.hitch(this, function(){
				this.scale._gauge._setCursor("pointer");
			}));
			this._cursorListeners.push(listener);
			listener = target.on(touch.out, lang.hitch(this, function(event){
					this.scale._gauge._setCursor("");
				}
			));
			this._cursorListeners.push(listener);
		},
		
		_disconnectCursorListeners: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			for(var i = 0; i < this._cursorListeners.length; i++){
				this._cursorListeners[i].remove();
			}
			this._cursorListeners = [];
		},

		_connectDownListeners: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._disconnectDownListeners();
			this._disconnectCursorListeners();
			var listener = null;

			if(this.interactionMode == "mouse" || this.interactionMode == "touch"){
				if(this.interactionArea == "indicator"){
					listener = this._gfxGroup.on(touch.press, lang.hitch(this, this._onMouseDown));
					this._downListeners.push(listener);
					this._connectCursorListeners(this._gfxGroup);
				}else if(this.interactionArea == "gauge"){
					if(!this.scale || !this.scale._gauge || !this.scale._gauge._gfxGroup){
						return true;
					}
					listener = this.scale._gauge._gfxGroup.on(touch.press, lang.hitch(this, this._onMouseDown));
					this._downListeners.push(listener);
					listener = this._gfxGroup.on(touch.press, lang.hitch(this, this._onMouseDown));
					this._downListeners.push(listener);
					this._connectCursorListeners(this.scale._gauge._gfxGroup);
				}else if(this.interactionArea == "area"){
					if(!this.scale || !this.scale._gauge || !this.scale._gauge._baseGroup){
						return true;
					}
					listener = this.scale._gauge._baseGroup.on(touch.press, lang.hitch(this, this._onMouseDown));
					this._downListeners.push(listener);
					listener = this._gfxGroup.on(touch.press, lang.hitch(this, this._onMouseDown));
					this._downListeners.push(listener);
						this._connectCursorListeners(this.scale._gauge._baseGroup);
				}
			}
			return false;
		},
		
		_connectMoveAndUpListeners: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var listener = null;

			listener = on(win.doc, touch.move, lang.hitch(this, this._onMouseMove));
			this._moveAndUpListeners.push(listener);
			
			listener = on(win.doc, touch.release, lang.hitch(this, this._onMouseUp));
			this._moveAndUpListeners.push(listener);
		},

		_onMouseDown: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._connectMoveAndUpListeners();
			this._startEditing();
		},

		_onMouseMove: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._preventAnimation = true;
			if(this._animation){
				this._animation.stop();
			}
		},

		_onMouseUp: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._disconnectMoveAndUpListeners();
			this._preventAnimation = false;
			this._endEditing();
		},

		_startEditing: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(!this.scale || !this.scale._gauge){
				return;
			}else{
				this.scale._gauge.onStartEditing({
					indicator: this
				});
			}
		},
		
		_endEditing: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(!this.scale || !this.scale._gauge){
				return;
			}else{
				this.scale._gauge.onEndEditing({
					indicator: this
				});
			}
		}
		
	});
});

},
'dojo/touch':function(){
define(["./_base/kernel", "./aspect", "./dom", "./dom-class", "./_base/lang", "./on", "./has", "./mouse", "./domReady", "./_base/window"],
function(dojo, aspect, dom, domClass, lang, on, has, mouse, domReady, win){

	// module:
	//		dojo/touch

	var hasTouch = has("touch");

	var ios4 = has("ios") < 5;
	
	var msPointer = navigator.msPointerEnabled;

	// Click generation variables
	var clicksInited, clickTracker, clickTarget, clickX, clickY, clickDx, clickDy, clickTime;

	// Time of most recent touchstart, touchmove, or touchend event
	var lastTouch;

	function dualEvent(mouseType, touchType, msPointerType){
		// Returns synthetic event that listens for both the specified mouse event and specified touch event.
		// But ignore fake mouse events that were generated due to the user touching the screen.
		if(msPointer && msPointerType){
			// IE10+: MSPointer* events are designed to handle both mouse and touch in a uniform way,
			// so just use that regardless of hasTouch.
			return function(node, listener){
				return on(node, msPointerType, listener);
			}
		}else if(hasTouch){
			return function(node, listener){
				var handle1 = on(node, touchType, listener),
					handle2 = on(node, mouseType, function(evt){
						if(!lastTouch || (new Date()).getTime() > lastTouch + 1000){
							listener.call(this, evt);
						}
					});
				return {
					remove: function(){
						handle1.remove();
						handle2.remove();
					}
				};
			};
		}else{
			// Avoid creating listeners for touch events on performance sensitive older browsers like IE6
			return function(node, listener){
				return on(node, mouseType, listener);
			}
		}
	}

	function marked(/*DOMNode*/ node){
		// Search for node ancestor has been marked with the dojoClick property to indicate special processing.
		// Returns marked ancestor.
		do{
			if(node.dojoClick){ return node; }
		}while(node = node.parentNode);
	}
	
	function doClicks(e, moveType, endType){
		// summary:
		//		Setup touch listeners to generate synthetic clicks immediately (rather than waiting for the browser
		//		to generate clicks after the double-tap delay) and consistently (regardless of whether event.preventDefault()
		//		was called in an event listener. Synthetic clicks are generated only if a node or one of its ancestors has
		//		its dojoClick property set to truthy.
		
		var markedNode = marked(e.target);
		clickTracker  = !e.target.disabled && markedNode && markedNode.dojoClick; // click threshold = true, number, x/y object, or "useTarget"
		if(clickTracker){
			var useTarget = (clickTracker == "useTarget");
			clickTarget = (useTarget?markedNode:e.target);
			if(useTarget){
				// We expect a click, so prevent any other 
				// defaut action on "touchpress"
				e.preventDefault();
			}
			clickX = e.touches ? e.touches[0].pageX : e.clientX;
			clickY = e.touches ? e.touches[0].pageY : e.clientY;
			clickDx = (typeof clickTracker == "object" ? clickTracker.x : (typeof clickTracker == "number" ? clickTracker : 0)) || 4;
			clickDy = (typeof clickTracker == "object" ? clickTracker.y : (typeof clickTracker == "number" ? clickTracker : 0)) || 4;

			// add move/end handlers only the first time a node with dojoClick is seen,
			// so we don't add too much overhead when dojoClick is never set.
			if(!clicksInited){
				clicksInited = true;

				function updateClickTracker(e){
					if(useTarget){
						clickTracker = dom.isDescendant(win.doc.elementFromPoint((e.changedTouches ? e.changedTouches[0].pageX : e.clientX),(e.changedTouches ? e.changedTouches[0].pageY : e.clientY)),clickTarget);
					}else{
						clickTracker = clickTracker &&
							e.target == clickTarget &&
							Math.abs((e.changedTouches ? e.changedTouches[0].pageX : e.clientX) - clickX) <= clickDx &&
							Math.abs((e.changedTouches ? e.changedTouches[0].pageY : e.clientY) - clickY) <= clickDy;
					}
				}

				win.doc.addEventListener(moveType, function(e){
					updateClickTracker(e);
					if(useTarget){
						// prevent native scroll event and ensure touchend is
						// fire after touch moves between press and release.
						e.preventDefault();
					}
				}, true);

				win.doc.addEventListener(endType, function(e){
					updateClickTracker(e);
					if(clickTracker){
						clickTime = (new Date()).getTime();
						var target = (useTarget?clickTarget:e.target);
						if(target.tagName === "LABEL"){
							// when clicking on a label, forward click to its associated input if any
							target = dom.byId(target.getAttribute("for")) || target;
						}
						setTimeout(function(){
							on.emit(target, "click", {
								bubbles : true,
								cancelable : true,
								_dojo_click : true
							});
						}, 0);
					}
				}, true);

				function stopNativeEvents(type){
					win.doc.addEventListener(type, function(e){
						// Stop native events when we emitted our own click event.  Note that the native click may occur
						// on a different node than the synthetic click event was generated on.  For example,
						// click on a menu item, causing the menu to disappear, and then (~300ms later) the browser
						// sends a click event to the node that was *underneath* the menu.  So stop all native events
						// sent shortly after ours, similar to what is done in dualEvent.
						// The INPUT.dijitOffScreen test is for offscreen inputs used in dijit/form/Button, on which
						// we call click() explicitly, we don't want to stop this event.
						if(!e._dojo_click &&
								(new Date()).getTime() <= clickTime + 1000 &&
								!(e.target.tagName == "INPUT" && domClass.contains(e.target, "dijitOffScreen"))){
							e.stopPropagation();
							e.stopImmediatePropagation && e.stopImmediatePropagation();
							if(type == "click" && (e.target.tagName != "INPUT" || e.target.type == "radio" || e.target.type == "checkbox")
								&& e.target.tagName != "TEXTAREA" && e.target.tagName != "AUDIO" && e.target.tagName != "VIDEO"){
								 // preventDefault() breaks textual <input>s on android, keyboard doesn't popup,
								 // but it is still needed for checkboxes and radio buttons, otherwise in some cases
								 // the checked state becomes inconsistent with the widget's state
								e.preventDefault();
							}
						}
					}, true);
				}

				stopNativeEvents("click");

				// We also stop mousedown/up since these would be sent well after with our "fast" click (300ms),
				// which can confuse some dijit widgets.
				stopNativeEvents("mousedown");
				stopNativeEvents("mouseup");
			}
		}
	}

	var hoveredNode;

	if(hasTouch){
		if(msPointer){
			 // MSPointer (IE10+) already has support for over and out, so we just need to init click support
			domReady(function(){
				win.doc.addEventListener("MSPointerDown", function(evt){
					doClicks(evt, "MSPointerMove", "MSPointerUp");
				}, true);
			});		
		}else{
			domReady(function(){
				// Keep track of currently hovered node
				hoveredNode = win.body();	// currently hovered node

				win.doc.addEventListener("touchstart", function(evt){
					lastTouch = (new Date()).getTime();

					// Precede touchstart event with touch.over event.  DnD depends on this.
					// Use addEventListener(cb, true) to run cb before any touchstart handlers on node run,
					// and to ensure this code runs even if the listener on the node does event.stop().
					var oldNode = hoveredNode;
					hoveredNode = evt.target;
					on.emit(oldNode, "dojotouchout", {
						relatedTarget: hoveredNode,
						bubbles: true
					});
					on.emit(hoveredNode, "dojotouchover", {
						relatedTarget: oldNode,
						bubbles: true
					});
				
					doClicks(evt, "touchmove", "touchend"); // init click generation
				}, true);

				function copyEventProps(evt){
					// Make copy of event object and also set bubbles:true.  Used when calling on.emit().
					var props = lang.delegate(evt, {
						bubbles: true
					});

					if(has("ios") >= 6){
						// On iOS6 "touches" became a non-enumerable property, which 
						// is not hit by for...in.  Ditto for the other properties below.
						props.touches = evt.touches;
						props.altKey = evt.altKey;
						props.changedTouches = evt.changedTouches;
						props.ctrlKey = evt.ctrlKey;
						props.metaKey = evt.metaKey;
						props.shiftKey = evt.shiftKey;
						props.targetTouches = evt.targetTouches;
					}

					return props;
				}
				
				on(win.doc, "touchmove", function(evt){
					lastTouch = (new Date()).getTime();

					var newNode = win.doc.elementFromPoint(
						evt.pageX - (ios4 ? 0 : win.global.pageXOffset), // iOS 4 expects page coords
						evt.pageY - (ios4 ? 0 : win.global.pageYOffset)
					);

					if(newNode){
						// Fire synthetic touchover and touchout events on nodes since the browser won't do it natively.
						if(hoveredNode !== newNode){
							// touch out on the old node
							on.emit(hoveredNode, "dojotouchout", {
								relatedTarget: newNode,
								bubbles: true
							});

							// touchover on the new node
							on.emit(newNode, "dojotouchover", {
								relatedTarget: hoveredNode,
								bubbles: true
							});

							hoveredNode = newNode;
						}

						// Unlike a listener on "touchmove", on(node, "dojotouchmove", listener) fires when the finger
						// drags over the specified node, regardless of which node the touch started on.
						if(!on.emit(newNode, "dojotouchmove", copyEventProps(evt))){
							// emit returns false when synthetic event "dojotouchmove" is cancelled, so we prevent the
							// default behavior of the underlying native event "touchmove".
							evt.preventDefault();
						}
					}
				});

				// Fire a dojotouchend event on the node where the finger was before it was removed from the screen.
				// This is different than the native touchend, which fires on the node where the drag started.
				on(win.doc, "touchend", function(evt){
					lastTouch = (new Date()).getTime();
					var node = win.doc.elementFromPoint(
						evt.pageX - (ios4 ? 0 : win.global.pageXOffset), // iOS 4 expects page coords
						evt.pageY - (ios4 ? 0 : win.global.pageYOffset)
					) || win.body(); // if out of the screen

					on.emit(node, "dojotouchend", copyEventProps(evt));
				});
			});
		}
	}

	//device neutral events - touch.press|move|release|cancel/over/out
	var touch = {
		press: dualEvent("mousedown", "touchstart", "MSPointerDown"),
		move: dualEvent("mousemove", "dojotouchmove", "MSPointerMove"),
		release: dualEvent("mouseup", "dojotouchend", "MSPointerUp"),
		cancel: dualEvent(mouse.leave, "touchcancel", hasTouch?"MSPointerCancel":null),
		over: dualEvent("mouseover", "dojotouchover", "MSPointerOver"),
		out: dualEvent("mouseout", "dojotouchout", "MSPointerOut"),
		enter: mouse._eventHandler(dualEvent("mouseover","dojotouchover", "MSPointerOver")),
		leave: mouse._eventHandler(dualEvent("mouseout", "dojotouchout", "MSPointerOut"))
	};

	/*=====
	touch = {
		// summary:
		//		This module provides unified touch event handlers by exporting
		//		press, move, release and cancel which can also run well on desktop.
		//		Based on http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
		//		Also, if the dojoClick property is set to true on a DOM node, dojo/touch generates
		//		click events immediately for this node and its descendants, to avoid the
		//		delay before native browser click events, and regardless of whether evt.preventDefault()
		//		was called in a touch.press event listener.
		//
		// example:
		//		Used with dojo.on
		//		|	define(["dojo/on", "dojo/touch"], function(on, touch){
		//		|		on(node, touch.press, function(e){});
		//		|		on(node, touch.move, function(e){});
		//		|		on(node, touch.release, function(e){});
		//		|		on(node, touch.cancel, function(e){});
		// example:
		//		Used with touch.* directly
		//		|	touch.press(node, function(e){});
		//		|	touch.move(node, function(e){});
		//		|	touch.release(node, function(e){});
		//		|	touch.cancel(node, function(e){});
		// example:
		//		Have dojo/touch generate clicks without delay, with a default move threshold of 4 pixels
		//		|	node.dojoClick = true;
		// example:
		//		Have dojo/touch generate clicks without delay, with a move threshold of 10 pixels horizontally and vertically
		//		|	node.dojoClick = 10;
		// example:
		//		Have dojo/touch generate clicks without delay, with a move threshold of 50 pixels horizontally and 10 pixels vertically
		//		|	node.dojoClick = {x:50, y:5};
		

		press: function(node, listener){
			// summary:
			//		Register a listener to 'touchstart'|'mousedown' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		move: function(node, listener){
			// summary:
			//		Register a listener that fires when the mouse cursor or a finger is dragged over the given node.
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		release: function(node, listener){
			// summary:
			//		Register a listener to releasing the mouse button while the cursor is over the given node
			//		(i.e. "mouseup") or for removing the finger from the screen while touching the given node.
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		cancel: function(node, listener){
			// summary:
			//		Register a listener to 'touchcancel'|'mouseleave' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		over: function(node, listener){
			// summary:
			//		Register a listener to 'mouseover' or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		out: function(node, listener){
			// summary:
			//		Register a listener to 'mouseout' or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		enter: function(node, listener){
			// summary:
			//		Register a listener to mouse.enter or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		leave: function(node, listener){
			// summary:
			//		Register a listener to mouse.leave or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		}
	};
	=====*/

	 1  && (dojo.touch = touch);

	return touch;
});

},
'dojox/dgauges/IndicatorBase':function(){
define(["dojo/_base/declare", "dojox/widget/_Invalidating"], function(declare, _Invalidating){
	return declare("dojox.dgauges.IndicatorBase", _Invalidating, {
		// summary:
		//		The base class for indicators. Basically, an indicator is used to render a value.

		// value: Number
		//		The value of this indicator.
		value: null
	});
});

},
'dojox/dgauges/CircularRangeIndicator':function(){
define(["dojo/_base/declare", "./ScaleIndicatorBase", "./_circularUtils", "dojo/_base/event"],
	function(declare, ScaleIndicatorBase, _circularUtils, eventUtil){
	return declare("dojox.dgauges.CircularRangeIndicator", ScaleIndicatorBase, {
		// summary:
		//		A CircularRangeIndicator is used to represent a range of values on a scale.
		//		Use the addIndicator method of CircularScale to use it.
		//		It is represented as a donut slice.
		
		// start: Number
		//		The start value of the range indicator.
		start: 0,
		// radius: Number
		//		The outer radius in pixels of the range indicator.
		radius: NaN,
		// startThickness: Number
		//		The start thickness of the donut slice in pixels. 
		startThickness: 6,
		// endThickness: Number
		//		The end thickness of the donut slice in pixels. 
		endThickness: 6,
		// fill: Object
		//		A fill object that will be passed to the setFill method of GFX.
		fill: null,
		// stroke: Object
		//		A stroke object that will be passed to the setStroke method of GFX.
		stroke: null,
		constructor: function(){
			this.indicatorShapeFunc = null;
			this.fill = [255, 120, 0];
			this.stroke = {
				color: "black",
				width: .2
			};
			this.interactionMode = "none";
			
			this.addInvalidatingProperties(["start", "radius", "startThickness", "endThickness", "fill", "stroke"]);
		},
		
		_interpolateColor: function(from, dest, n){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var fr = (from >> 16) & 0xff;
			var fg = (from >> 8) & 0xff;
			var fb = from & 0xff;
			
			var tr = (dest >> 16) & 0xff;
			var tg = (dest >> 8) & 0xff;
			var tb = dest & 0xff;
			
			var r = ((1 - n) * fr + n * tr) & 0xff;
			var g = ((1 - n) * fg + n * tg) & 0xff;
			var b = ((1 - n) * fb + n * tb) & 0xff;
			
			return r << 16 | g << 8 | b;
		},
		
		_colorsInterpolation: function(colors, ratios, len){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var ret = [];
			var ilen = 0;
			
			for(var i = 0; i < colors.length - 1; i++){
				ilen = (ratios[i + 1] - ratios[i]) * len;
				ilen = Math.round(ilen);
				ret = ret.concat(_colorInterpolation(colors[i], colors[i + 1], ilen));
			}
			return ret;
		},
		
		_alphasInterpolation: function(alphas, positions, len){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var ret = [];
			var ilen = 0;
			for(var i = 0; i < alphas.length - 1; i++){
				ilen = (positions[i + 1] - positions[i]) * len;
				ilen = Math.round(ilen);
				ret = ret.concat(_alphaInterpolation(alphas[i], alphas[i + 1], ilen));
			}
			return ret;
		},
		
		_alphaInterpolation: function(c1, c2, len){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var step = (c2 - c1) / (len - 1);
			var ret = [];
			for(var i = 0; i < len; i++){
				ret.push(c1 + i * step);
			}
			return ret;
		},
		
		_colorInterpolation: function(c1, c2, len){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var ret = [];
			for (var i = 0; i < len; i++){
				ret.push(_interpolateColor(c1, c2, i / (len - 1)));
			}
			return ret;
		},
		
		_getEntriesFor: function(entries, attr){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var ret = [];
			var e;
			var val;
			for(var i = 0; i < entries.length; i++){
				e = entries[i];
				if(e[attr] == null || isNaN(e[attr])) {
					val = i / (entries.length - 1);
				}
				else{
					val = e[attr];
				}
				ret.push(val);
			}
			return ret;
		},
		
		_drawColorTrack: function(g, ox, oy, radius, orientation, startAngleRadians, endAngleRadians, sWeight, eWeight, fill, stroke, clippingAngleRadians){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var angleStep = 0.05;
			var totalAngle;
			
			totalAngle = 6.28318530718 - _circularUtils.computeAngle(startAngleRadians, endAngleRadians, orientation);
			if(!isNaN(clippingAngleRadians)){
				var deltaAngle = _circularUtils.computeAngle(startAngleRadians, clippingAngleRadians, orientation);
				eWeight *= deltaAngle / totalAngle;
				totalAngle = deltaAngle;
			}
			var iterCount = Math.max(2, Math.floor(totalAngle / angleStep));
			
			angleStep = totalAngle / iterCount;
			var innerRadius;
			var outerRadius;
			var outerStep = 0;
			var innerStep = 0;
			var px;
			var py;
			innerRadius = -sWeight;
			outerRadius = 0;
			innerStep = (sWeight - eWeight) / iterCount;
			
			var angle;
			var i;
			if(orientation == "clockwise"){
				angleStep = -angleStep;
			}
			
			var gp = [];
			
			px = ox + Math.cos(startAngleRadians) * (radius + innerRadius);
			py = oy - Math.sin(startAngleRadians) * (radius + innerRadius);
			gp.push(px, py);
			for(i = 0; i < iterCount; i++){
				angle = startAngleRadians + i * angleStep;
				px = ox + Math.cos(angle + angleStep) * (radius + innerRadius + i * innerStep);
				py = oy - Math.sin(angle + angleStep) * (radius + innerRadius + i * innerStep);
				gp.push(px, py);
			}
			if(isNaN(angle)){
				angle = startAngleRadians;
			}
			px = ox + Math.cos(angle + angleStep) * (radius + outerRadius + (iterCount - 1) * outerStep);
			py = oy - Math.sin(angle + angleStep) * (radius + outerRadius + (iterCount - 1) * outerStep);
			gp.push(px, py);
			for(i = iterCount - 1; i >= 0; i--){
				angle = startAngleRadians + i * angleStep;
				px = ox + Math.cos(angle + angleStep) * (radius + outerRadius + i * outerStep);
				py = oy - Math.sin(angle + angleStep) * (radius + outerRadius + i * outerStep);
				gp.push(px, py);
			}
			px = ox + Math.cos(startAngleRadians) * (radius + outerRadius);
			py = oy - Math.sin(startAngleRadians) * (radius + outerRadius);
			gp.push(px, py);
			
			px = ox + Math.cos(startAngleRadians) * (radius + innerRadius);
			py = oy - Math.sin(startAngleRadians) * (radius + innerRadius);
			gp.push(px, py);
			g.createPolyline(gp).setFill(fill).setStroke(stroke);
		},
		
		refreshRendering: function(){
			this.inherited(arguments);

			var g = this._gfxGroup;
			g.clear();
			var ox = this.scale.originX;
			var oy = this.scale.originY;
			var radius = isNaN(this.radius) ? this.scale.radius  : this.radius;
			var orientation = this.scale.orientation;
			var startAngleRadians = _circularUtils.toRadians(360 - this.scale.positionForValue(this.start));
			var v = isNaN(this._transitionValue) ? this.value : this._transitionValue;
			var endAngleRadians = _circularUtils.toRadians(360 - this.scale.positionForValue(v));
			var sWeight = this.startThickness;
			var eWeight = this.endThickness;
			var clippingAngleRadians = NaN;
			
			this._drawColorTrack(g, ox, oy, radius, orientation, startAngleRadians, endAngleRadians, sWeight, eWeight, this.fill, this.stroke, clippingAngleRadians);
		},
		
		_onMouseDown: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			var origin = this.scale._gauge._gaugeToPage(this.scale.originX, this.scale.originY);
			var angle = ((Math.atan2(event.pageY - origin.y, event.pageX - origin.x)) * 180) / (Math.PI);
			this.set("value", this.scale.valueForPosition(angle));

			// prevent the browser from selecting text
			eventUtil.stop(event);
		},
		
		_onMouseMove: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			
			var origin = this.scale._gauge._gaugeToPage(this.scale.originX, this.scale.originY);
			var angle = ((Math.atan2(event.pageY - origin.y, event.pageX - origin.x)) * 180) / (Math.PI);
			this.set("value", this.scale.valueForPosition(angle));
		}
	});
});

},
'dojox/dgauges/TextIndicator':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/sniff", "dojo/_base/array", "dojo/on", "dojox/gfx", "./IndicatorBase"],
	function(lang, declare, has, array, on, gfx, IndicatorBase){
	return declare("dojox.dgauges.TextIndicator", IndicatorBase, {
		// summary:
		//		This type of indicator is used to render text.
		//		To render an arbitrary text, set the value property.
		//		To render the value of a value indicator or a range indicator, set the indicator property.
		//		Setting the indicator property takes precedence on setting the value property.
		//		When the indicator property is set, the text is automatically updated on value changes.

		// font: Object
		//		Font used by this element.
		font: null,
		// x: Number
		//		The text anchor x-position. Default is 0.
		x: 0,
		// y: Number
		//		The text anchor y-position. Default is 0.
		y: 0,
		// align: String
		//		An alignment of a text in regards to the anchor position:
		//
		//		- "start": A text's baseline starts at the anchor. 
		//		This is the default value of the align attribute.
		//		- "middle": A text's baseline is centered on the anchor point.
		//		- "end": A text's baseline ends at the anchor point.
		align: "middle",
		// color: Object
		//		The color of the text.
		color: "black",
		// indicator: dojox/dgauges/IndicatorBase
		//		If this property is set, the value of the indicator is automatically
		//		rendered by this text element.
		indicator: null,
		// labelFunc: Object
		//		If set, this method allows to format the value of this text indicator.
		//		A label function takes the text to render as argument and returns a String. 
		labelFunc: null,
		
		constructor: function(){
			this.addInvalidatingProperties(["indicator"]);

			var resetProps = ["x", "y", "font", "align", "color", "labelFunc"];
			array.forEach(resetProps, lang.hitch(this, function(entry){
				this.watch(entry, this._resetText);
			}));
			
			this.watch("indicator", lang.hitch(this, this._indicatorChanged));
		},

		postscript: function(mixin){
			// summary:
			//		Internal method
			// tags:
			//		private
			this.inherited(arguments);
			if(mixin && mixin.indicator){
				this._indicatorChanged("indicator", null, mixin.indicator);
			}
		},
		
		_resetText: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this._textCreated = false;
			this.invalidateRendering();
		},
		
		_valueWatcher: null,
		
		_indicatorChanged: function(name, oldValue, newValue){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(this._valueWatcher){
				this._valueWatcher.unwatch();
			}
			this._valueWatcher = newValue.watch("value", lang.hitch(this, this.refreshRendering));
		},
		
		_getFont: function(){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var font = this.font;
			if(!font && this._gauge){
				font = this._gauge.font;
			}
			if(!font){
				font = gfx.defaultFont;
			}
			return font;
		},
		
		_textCreated: false,
		_textInstance: null,
		
		_createText: function(group, font, color, text, x, y, align){
			// summary:
			//		Internal method.
			// tags:
			//		private
			var gfxText = group.createText({
				x: x,
				y: y,
				text: text,
				align: align
			}).setFont(font).setFill(color);
			return gfxText;
		},
		
		refreshRendering: function(){
			if(this._gfxGroup == null){
				return;
			}
			var text;
			if(this.indicator){
				text = this.indicator.value;
			}else{
				text = this.value;
			}
			if(this.labelFunc){
				text = this.labelFunc(text);
			}
			var iOsVersion = has("iphone");
			// Workaround for a bug on iOS version < 5.0: Recreate the text every times
			if(!this._textCreated || (iOsVersion != undefined && iOsVersion < 5)){
				this._gfxGroup.clear();
				var font = this._getFont();
				this._textInstance = this._createText(this._gfxGroup, font, font.color ? font.color : this.color, "", this.x, this.y, this.align);
				this._textCreated = true;
			}
			this._textInstance.setShape({
				text: text
			});
			
			return this._textInstance;
		}
	})
});

},
'dojox/dgauges/components/utils':function(){
define(["dojo/_base/lang", "dojo/_base/Color"], function(lang, Color){
	// module:
	//		dojox/dgauges/components/utils
	// summary:
	//		Gauge utilities.
	// tags:
	//		public

	var utils = {};

	lang.mixin(utils, {
		brightness: function(col, b){
			// summary:
			//		Adjusts the brightness of a color.
			// col: Number
			//		The base color
			// b: Number
			//		A positive or negative value to adjust the brightness
			// returns: Number
			//		The modified color			
			var res = lang.mixin(null, col);
			res.r = Math.max(Math.min(res.r + b, 255), 0);
			res.g = Math.max(Math.min(res.g + b, 255), 0);
			res.b = Math.max(Math.min(res.b + b, 255), 0);
			return res;
		},
		
		createGradient: function(entries){
			// summary:
			//		Creates a gradient object
			// entries: Array
			//		An array of numbers representing colors
			// returns: Number
			//		The modified color			
			var res = {
				colors: []
			};
			var obj;
			for(var i = 0; i < entries.length; i++){
				if(i % 2 == 0){
					obj = {
						offset: entries[i]
					};
				} else {
					obj.color = entries[i];
					res.colors.push(obj);
				}
			}
			return res;
		},
		
		_setter: function(obj, attributes, values){
			for(var i = 0; i < attributes.length; i++){
				obj[attributes[i]] = values[i];
			}
		},
		
		genericCircularGauge: function(scale, indicator, originX, originY, radius, startAngle, endAngle, orientation, font, labelPosition, tickShapeFunc){
			// summary:
			//		A helper method for configuring a circular gauge.
			// scale: CircularScale
			//		A circular scale
			// indicator: IndicatorBase
			//		A circular indicator
			// originX: Number
			//		The x-coordinate of the center of the scale (in pixels) 
			// originY: Number
			//		The y-coordinate of the center of the scale (in pixels)
			// radius: Number
			//		The radius of the scale (in pixels)
			// startAngle: Number
			//		The start angle of the scale (in degrees)
			// endAngle: Number
			//		The end angle of the scale (in degrees)
			// orientation: String?
			//		The orientation of the scale, can be "clockwise" or "cclockwise"
			// font: Object?
			//		The font used for the gauge
			// labelPosition: String?
			//		The position of the labels regarding   
			// tickShapeFunc: Object?
			//		A drawing function for the ticks
			// returns: Number
			//		The modified color	
			var attributes = ["originX", "originY", "radius", "startAngle", "endAngle", "orientation", "font", "labelPosition", "tickShapeFunc"];
			if(!orientation){
				orientation = "clockwise";
			}
			if(!font){
				font = {
					family: "Helvetica",
					style: "normal",
					size: "10pt",
					color: "#555555"
				};
			}
			if(!labelPosition){
				labelPosition = "inside";
			}
			if(!tickShapeFunc){
				tickShapeFunc = function(group, scale, tick){
					var stroke = scale.tickStroke;
					var majorStroke;
					var minorStroke;
					if(stroke){
						majorStroke = {color:stroke.color ? stroke.color : "#000000", width:stroke.width ? stroke.width : 0.5};
						var col = new Color(stroke.color).toRgb();
						minorStroke = {color:stroke.color ? utils.brightness({r:col[0], g:col[1], b:col[2]},51) : "#000000", width:stroke.width ? stroke.width * 0.6 : 0.3};
					}
					return group.createLine({
						x1: tick.isMinor ? 2 : 0,
						y1: 0,
						x2: tick.isMinor ? 8 : 10,
						y2: 0
					}).setStroke(tick.isMinor ? minorStroke : majorStroke);
				};
			}
			
			this._setter(scale, attributes, [originX, originY, radius, startAngle, endAngle, orientation, font, labelPosition, tickShapeFunc]);
			
			indicator.set("interactionArea", "gauge");
			// Needle shape
			indicator.set("indicatorShapeFunc", function(group, indicator){
				return group.createPolyline([0, -5, indicator.scale.radius - 6, 0, 0, 5, 0, -5]).setStroke({
					color: "#333333",
					width: 0.25
				}).setFill(scale._gauge.indicatorColor);
			});
		}
	});

	return utils;
});

},
'dojox/dgauges/components/black/CircularLinearGauge':function(){
define([
		"dojo/_base/lang", 
		"dojo/_base/declare", 
		"dojo/_base/Color", 
		"../../CircularGauge", 
		"../../LinearScaler", 
		"../../CircularScale", 
		"../../CircularValueIndicator", 
		"../../CircularRangeIndicator",
		"../DefaultPropertiesMixin"
	], 
	function(lang, declare, Color, CircularGauge, LinearScaler, CircularScale, CircularValueIndicator, CircularRangeIndicator, DefaultPropertiesMixin){
		return declare("dojox.dgauges.components.black.CircularLinearGauge", [CircularGauge, DefaultPropertiesMixin], {
			// summary:
			//		A circular gauge widget.

			// borderColor: Object|Array|int
			//		The border color. Default is "#000000".
			borderColor: "#000000",
			// fillColor: Object|Array|int
			//		The background color. Default is "#000000".
			fillColor: "#000000",
			// indicatorColor: Object|Array|int
			//		The indicator fill color. Default is "#A4A4A4".
			indicatorColor: "#A4A4A4",
			constructor: function(){
				// Base colors
				this.borderColor = new Color(this.borderColor);
				this.fillColor = new Color(this.fillColor);
				this.indicatorColor = new Color(this.indicatorColor);
				
				var scaler = new LinearScaler();
				this.addElement("background", lang.hitch(this, this.drawBackground));
				var scale = new CircularScale();
				scale.set("scaler", scaler);
				scale.set("radius", 149.82183);
				scale.set("originX", 186.9446);
				scale.set("originY", 184.74838);
				scale.set("startAngle", 130.16044);
				scale.set("endAngle", 50.25444);
				scale.set("orientation", "clockwise");
				scale.set("labelGap", 8);
				scale.set("font", {
					family: "Helvetica",
					weight: "bold",
					size: "14pt",
					color: "#CECECE"
				});
				scale.set("tickShapeFunc", function(group, scale, tick){
					return group.createCircle({
						r: tick.isMinor ? 2 : 4
					}).setFill("#CECECE");
				});
				this.addElement("scale", scale);
				var indicator = new CircularValueIndicator();
				indicator.set("interactionArea", "gauge");
				indicator.set("value", scaler.minimum);
				indicator.set("indicatorShapeFunc", lang.hitch(this, function(group, indicator){
					
					return group.createPolyline([0, -12, indicator.scale.radius - 2, 0, 0, 12, 0, -12]).setStroke({
						color: [70, 70, 70],
						width: 1
					}).setFill(this.indicatorColor);

				}));
				scale.addIndicator("indicator", indicator);
				this.addElement("foreground", lang.hitch(this, this.drawForeground));
			},
			drawBackground: function(g){
				// summary:
				//		Draws the background shape of the gauge.
				// g: dojox/gfx/Group
				//		The group used to draw the background. 
				// tags:
				//		protected
				g.createPath({
					path: "M372.9962 186.58 C373.0312 289.5712 289.57 373.0888 186.5787 373.1237 C83.5887 373.16 0.07 289.6975 0.035 186.7062 L0.035 186.58 C-0 83.5888 83.4625 0.0712 186.4524 0.0362 C289.4425 -0 372.9611 83.4625 372.9962 186.4525 L372.9962 186.58 Z"
				}).setFill(this.borderColor);
				g.createPath({
					path: "M358.7902 186.5795 C358.8253 281.7258 281.7202 358.8808 186.574 358.9145 C91.4277 358.9471 14.2715 281.842 14.239 186.6957 L14.239 186.5795 C14.2077 91.4332 91.3127 14.2782 186.4565 14.2445 C281.6027 14.2132 358.759 91.317 358.7902 186.4633 L358.7902 186.5795 Z"
				}).setFill({
					type: "linear",
					x1: 14.23897,
					y1: 358.91452,
					x2: 14.23897,
					y2: 221.04652,
					colors: [
						{offset: 0, color: [100,100,100]},
						{offset: 1, color: this.fillColor}
					]
				});
				g.createPath({
					path: "M358.749 182.9033 C356.8202 89.4033 280.4165 14.2132 186.4615 14.2445 C92.5465 14.277 16.2165 89.4533 14.289 182.9008 C66.884 197.0646 127.4052 168.8146 188.7977 168.8146 C250.209 168.8146 306.3027 197.0708 358.749 182.9033"
				}).setFill({
					type: "linear",
					x1: 14.28899,
					y1: 186.87839,
					x2: 14.28899,
					y2: 14.24451,
					colors: [
						{offset: 0, color: this.fillColor},
						{offset: 1, color: [200,200,200]}
					]
				});
				g.createPath({
					path: "M358.7457 182.9033 C356.817 89.4033 280.4132 14.2133 186.4582 14.2445 C92.5432 14.277 16.2132 89.4533 14.2857 182.9008 C66.8807 197.0646 127.402 168.8146 188.7945 168.8146 C250.2057 168.8146 306.2995 197.0708 358.7457 182.9033"
				}).setFill([255,255,255,0.12157]);
			},

			drawForeground: function(g){
				// summary:
				//		Draws the foreground shape of the gauge.
				// g: dojox/gfx/Group
				//		The group used to draw the foreground. 
				// tags:
				//		protected
				var g1 = g.createGroup();
				g1.createPath({
					path: "M214.9859 185.33 C214.9909 201.0537 202.2496 213.8037 186.5259 213.81 C170.7996 213.815 158.0496 201.0725 158.0446 185.35 L158.0446 185.33 C158.0384 169.6062 170.7821 156.8562 186.5071 156.85 C202.2296 156.845 214.9809 169.5875 214.9859 185.3113 L214.9859 185.33 Z"
				}).setFill(this.borderColor);
				g1.createPath({
					path: "M211.4015 185.3295 C211.4052 199.0745 200.2689 210.2183 186.524 210.2232 C172.7802 210.2282 161.6352 199.0908 161.6302 185.347 L161.6302 185.3295 C161.6252 171.5858 172.7628 160.4408 186.5065 160.4358 C200.2515 160.4308 211.3965 171.5695 211.4015 185.3133 L211.4015 185.3295 Z"
				}).setFill({
					type: "linear",
					x1: 161.63024,
					y1: 210.22326,
					x2: 161.63024,
					y2: 185.32952,
					colors: [
						{offset: 0, color: [100,100,100]},
						{offset: 1, color: this.fillColor}
					]
				});
				g1.createPath({
					path: "M211.3952 184.7995 C211.1165 171.2933 200.0802 160.4308 186.5077 160.4358 C172.9415 160.4408 161.9152 171.2995 161.6377 184.7995 C169.234 186.8446 177.9752 182.7645 186.8465 182.7645 C195.7165 182.7645 203.819 186.8458 211.3952 184.7995"
				}).setFill({
					type: "linear",
					x1: 161.63772,
					y1: 185.37364,
					x2: 161.63772,
					y2: 160.43577,
					colors: [
						{offset: 0, color: this.fillColor},
						{offset: 1, color: [150,150,150]}
					]
				});
				g1.createPath({
					path: "M211.3946 184.799 C211.1158 171.2928 200.0796 160.4315 186.5084 160.4365 C172.9409 160.4415 161.9159 171.3003 161.6371 184.799 C169.2334 186.844 177.9759 182.764 186.8458 182.764 C195.7158 182.764 203.8184 186.8465 211.3946 184.799"
				}).setFill([255,255,255,0.12157]);
			}
		});
	}
);


},
'dojox/dgauges/components/DefaultPropertiesMixin':function(){
define(["dojo/_base/declare", "dojo/_base/Color"], function(declare, Color){
	return declare("dojox.dgauges.components.DefaultPropertiesMixin", null, {
		// summary:
		//		This class defines default properties of predefined gauges.

		// minimum: Number
		//		The minimum value of the scaler. Default is 0.
		minimum: 0,
		// maximum: Number
		//		The maximum value of the scaler. Default is 100.
		maximum: 100,
		// snapInterval:
		//		Specifies the increment value to be used as snap values on this scale 
		//		during user interaction.
		//		Default is 1.
		snapInterval: 1,
		// majorTickInterval: Number
		//		The interval between two major ticks.
		majorTickInterval: NaN,
		// minorTickInterval: Number
		//		The interval between two minor ticks.
		minorTickInterval: NaN,
		// minorTicksEnabled: Boolean
		//		If false, minor ticks are not generated. Default is true.
		minorTicksEnabled: true,

		// summary:
		//		The value of the indicator. Default is 0.
		value: 0,
		
		// interactionArea: String
		//		How to interact with the indicator using mouse or touch interactions.
		//		Can be "indicator", "gauge" or "none". The default value is "gauge".
		//		If set to "indicator", the indicator shape reacts to mouse and touch events.
		//		If set to "gauge", the whole gauge reacts to mouse and touch events.
		//		If "none", interactions are disabled.
		interactionArea: "gauge",

		// interactionMode: String
		//		Can be "mouse" or "touch".
		interactionMode: "mouse",

		// animationDuration: Number
		//		The duration of the value change animation in milliseconds. Default is 0.
		//		The animation occurs on both user interactions and programmatic value changes.
		//		Set this property to 0 to disable animation.
		animationDuration: 0,

		_setMinimumAttr: function(v){
			this.getElement("scale").scaler.set("minimum", v);
		},
		_setMaximumAttr: function(v){
			this.getElement("scale").scaler.set("maximum", v);
		},
		_setSnapIntervalAttr: function(v){
			this.getElement("scale").scaler.set("snapInterval", v);
		},
		_setMajorTickIntervalAttr: function(v){
			this.getElement("scale").scaler.set("majorTickInterval", v);
		},
		_setMinorTickIntervalAttr: function(v){
			this.getElement("scale").scaler.set("minorTickInterval", v);
		},
		_setMinorTicksEnabledAttr: function(v){
			this.getElement("scale").scaler.set("minorTicksEnabled", v);
		},
		_setInteractionAreaAttr: function(v){
			this.getElement("scale").getIndicator("indicator").set("interactionArea", v);
		},
		_setInteractionModeAttr: function(v){
			this.getElement("scale").getIndicator("indicator").set("interactionMode", v);
		},
		_setAnimationDurationAttr: function(v){
			this.getElement("scale").getIndicator("indicator").set("animationDuration", v);
		},
		_setBorderColorAttr: function(v){
			this.borderColor = new Color(v);
			this.invalidateRendering();
		},
		_setFillColorAttr: function(v){
			this.fillColor = new Color(v);
			this.invalidateRendering();
		},
		_setIndicatorColorAttr: function(v){
			this.indicatorColor = new Color(v);
			this.invalidateRendering();
		}
	});
});

},
'dojox/dgauges/components/black/SemiCircularLinearGauge':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/Color", 
		"../../CircularGauge", 
		"../../LinearScaler", 
		"../../CircularScale", 
		"../../CircularValueIndicator", 
		"../../CircularRangeIndicator",
		"../DefaultPropertiesMixin"
	],
	function(lang, declare, Color, CircularGauge, LinearScaler, CircularScale, CircularValueIndicator, CircularRangeIndicator, DefaultPropertiesMixin){
	return declare("dojox.dgauges.components.black.SemiCircularLinearGauge", [CircularGauge, DefaultPropertiesMixin], {
		// summary:
		//		A semi circular gauge widget.

		// borderColor: Object|Array|int
		//		The border color. Default is "#000000".
		borderColor: "#000000",
		// fillColor: Object|Array|int
		//		The background color. Default is "#000000".
		fillColor: "#000000",
		// indicatorColor: Object|Array|int
		//		The indicator fill color. Default is "#A4A4A4".
		indicatorColor: "#A4A4A4",
		constructor: function(){
			// Base colors
			this.borderColor = new Color(this.borderColor);
			this.fillColor = new Color(this.fillColor);
			this.indicatorColor = new Color(this.indicatorColor);

			var scaler = new LinearScaler();
			this.addElement("background", lang.hitch(this, this.drawBackground));
			var scale = new CircularScale();
			scale.set("scaler", scaler);
			scale.set("originX", 186.46999);
			scale.set("originY", 184.74814);			
			scale.set("radius", 149.82183);
			scale.set("startAngle", -180);
			scale.set("endAngle", 0);
			scale.set("orientation", "clockwise");
			scale.set("labelGap", 8);
			scale.set("font", {
				family: "Helvetica",
				weight: "bold",
				size: "14pt",
				color: "#CECECE"
			});
			scale.set("tickShapeFunc", function(group, scale, tick){
				return group.createCircle({
					r: tick.isMinor ? 2 : 4
				}).setFill("#CECECE");
			});
			this.addElement("scale", scale);
			var indicator = new CircularValueIndicator();
			indicator.set("interactionArea", "gauge");
			indicator.set("value", scaler.minimum);
			indicator.set("indicatorShapeFunc", lang.hitch(this, function(group, indicator){
				return group.createPolyline([0, -12, indicator.scale.radius - 2, 0, 0, 12, 0, -12]).setStroke({
					color: [70, 70, 70],
					width: 1
				}).setFill(this.indicatorColor);
				
			}));
			scale.addIndicator("indicator", indicator);
			this.addElement("foreground", lang.hitch(this, this.drawForeground));
		},
		
		drawBackground: function(g){
			// summary:
			//		Draws the background shape of the gauge.
			// g: dojox/gfx/Group
			//		The group used to draw the background. 
			// tags:
			//		protected
			g.createPath({
				path: "M372.8838 205.5688 C372.9125 204.4538 372.93 194.135 372.94 185.6062 C372.4475 83.0063 289.1138 -0 186.4063 0.035 C83.7 0.0713 0.4225 83.1325 0 185.7325 C0.01 194.2175 0.0275 204.4638 0.0563 205.5763 C0.235 212.3488 5.7763 217.7462 12.5525 217.7462 L360.3888 217.7462 C367.1663 217.7462 372.71 212.3438 372.8838 205.5688"
			}).setFill(this.borderColor);
			g.createPath({
				path: "M358.6738 203.9965 C358.7188 202.3627 358.7463 188.224 358.745 186.579 L358.745 186.4627 C358.7138 91.3165 281.5575 14.2127 186.4113 14.244 C91.2675 14.2777 14.1625 91.4327 14.1938 186.579 C14.1938 186.6177 14.2213 202.4015 14.2663 203.9965 L358.6738 203.9965 Z"
			}).setFill({
				type: "linear",
				x1: 14.19376,
				y1: 260.92225,
				x2: 14.19376,
				y2: 156.55837,
				colors: [{
					offset: 0,
					color: [100, 100, 100]
				}, {
					offset: 1,
					color: this.fillColor
				}]
			});
			g.createPath({
				path: "M358.7038 182.9027 C356.775 89.4027 280.3713 14.2127 186.4163 14.244 C92.5013 14.2765 16.1713 89.4527 14.2438 182.9002 C66.8388 197.064 127.36 168.814 188.7525 168.814 C250.1638 168.814 306.2575 197.0703 358.7038 182.9027"
			}).setFill({
				type: "linear",
				x1: 14.24378,
				y1: 186.87786,
				x2: 14.24378,
				y2: 14.24398,
				colors: [{
					offset: 0,
					color: this.fillColor
				}, {
					offset: 1,
					color: [200, 200, 200]
				}]
			});
			g.createPath({
				path: "M358.953 183.1553 C357.0243 89.6553 280.6205 14.4653 186.6655 14.4966 C92.7505 14.5291 16.4205 89.7053 14.493 183.1528 C67.088 197.3166 127.6093 169.0666 189.0018 169.0666 C250.413 169.0666 306.5068 197.3228 358.953 183.1553"
			}).setFill([255, 255, 255, 0.12157]);
		},
		
		drawForeground: function(g){
			// summary:
			//		Draws the foreground shape of the gauge.
			// g: dojox/gfx/Group
			//		The group used to draw the foreground. 
			// tags:
			//		protected
			var g1 = g.createGroup();
			g1.createPath({
				path: "M214.9406 185.3295 C214.9456 201.0533 202.2044 213.8033 186.4806 213.8095 C170.7544 213.8145 158.0044 201.072 157.9994 185.3495 L157.9994 185.3295 C157.9931 169.6057 170.7369 156.8557 186.4619 156.8495 C202.1844 156.8445 214.9356 169.587 214.9406 185.3108 L214.9406 185.3295 Z"
			}).setFill(this.borderColor);
			g1.createPath({
				path: "M211.3563 185.329 C211.36 199.074 200.2238 210.2177 186.4787 210.2228 C172.735 210.2277 161.59 199.0902 161.585 185.3465 L161.585 185.329 C161.58 171.5852 172.7175 160.4402 186.4613 160.4352 C200.2063 160.4303 211.3513 171.569 211.3563 185.3128 L211.3563 185.329 Z"
			}).setFill({
				type: "linear",
				x1: 161.58503,
				y1: 210.22273,
				x2: 161.58503,
				y2: 185.32899,
				colors: [{
					offset: 0,
					color: [100, 100, 100]
				}, {
					offset: 1,
					color: this.fillColor
				}]
			});
			g1.createPath({
				path: "M211.35 184.799 C211.0713 171.2928 200.035 160.4303 186.4625 160.4352 C172.8963 160.4402 161.87 171.299 161.5925 184.799 C169.1888 186.844 177.93 182.764 186.8013 182.764 C195.6712 182.764 203.7738 186.8452 211.35 184.799"
			}).setFill({
				type: "linear",
				x1: 161.59251,
				y1: 185.37311,
				x2: 161.59251,
				y2: 160.43524,
				colors: [{
					offset: 0,
					color: this.fillColor
				}, {
					offset: 1,
					color: [150, 150, 150]
				}]
			});
			g1.createPath({
				path: "M211.3494 184.7985 C211.0706 171.2923 200.0344 160.431 186.4632 160.436 C172.8956 160.441 161.8707 171.2997 161.5919 184.7985 C169.1881 186.8435 177.9306 182.7635 186.8006 182.7635 C195.6706 182.7635 203.7731 186.846 211.3494 184.7985"
			}).setFill([255, 255, 255, 0.12157]);
		}
	});
});


},
'dojox/dgauges/components/black/HorizontalLinearGauge':function(){
define([
		"dojo/_base/lang", 
		"dojo/_base/declare",
		"dojo/_base/Color",
		"../../RectangularGauge", 
		"../../LinearScaler", 
		"../../RectangularScale", 
		"../../RectangularValueIndicator",
		"../DefaultPropertiesMixin"
	], 
	function(lang, declare, Color, RectangularGauge, LinearScaler, RectangularScale, RectangularValueIndicator, DefaultPropertiesMixin){
		return declare("dojox.dgauges.components.black.HorizontalLinearGauge", [RectangularGauge, DefaultPropertiesMixin], {
			// summary:
			//		A horizontal gauge widget.

			// borderColor: Object|Array|int
			//		The border color. Default is "#000000".
			borderColor: "#000000",
			// fillColor: Object|Array|int
			//		The background color. Default is "#000000".
			fillColor: "#000000",
			// indicatorColor: Object|Array|int
			//		The indicator fill color. Default is "#A4A4A4".
			indicatorColor: "#A4A4A4",
			constructor: function(){
				// Base colors
				this.borderColor = new Color(this.borderColor);
				this.fillColor = new Color(this.fillColor);
				this.indicatorColor = new Color(this.indicatorColor);

				this.addElement("background", lang.hitch(this, this.drawBackground));

				// Scaler
				var scaler = new LinearScaler();
				
				// Scale
				var scale = new RectangularScale();
				scale.set("scaler", scaler);
				scale.set("labelPosition", "leading");
				scale.set("paddingLeft", 30);
				scale.set("paddingRight", 30);
				scale.set("paddingTop", 34);
				scale.set("labelGap", 8);
				scale.set("font", {
					family: "Helvetica",
					weight: "bold",
					size: "7pt",
					color: "#CECECE"
				});
				scale.set("tickShapeFunc", function(group, scale, tick){
					return group.createCircle({
						r: tick.isMinor ? 0.5 : 3
					}).setFill("#CECECE");
				});
				this.addElement("scale", scale);
				
				var indicator = new RectangularValueIndicator();
				indicator.set("interactionArea", "gauge");
				indicator.set("value", scaler.minimum);
				indicator.set("paddingTop", 30);
				indicator.set("indicatorShapeFunc", lang.hitch(this, function(group, indicator){
					return group.createPolyline([0, 0, -10, -20, 10, -20, 0, 0]).setFill(this.indicatorColor).setStroke({
						color: [70, 70, 70],
						width: 1,
						style: "Solid",
						cap: "butt",
						join: 20.0
					});

				}));
				scale.addIndicator("indicator", indicator);
			},

			drawBackground: function(g, w, h){
				// summary:
				//		Draws the background shape of the gauge.
				// g: dojox/gfx/Group
				//		The group used to draw the background. 
				// w: Number
				//		The width of the gauge.
				// h: Number
				//		The height of the gauge.
				// tags:
				//		protected
				g.createRect({
					x: 0,
					y: 0,
					width: w,
					height: 50,
					r: 15
				}).setFill(this.borderColor);
				g.createRect({
					x: 4,
					y: 4,
					width: w - 8,
					height: 42,
					r: 12
				}).setFill({
					type: "linear",
					x1: 0,
					y1: 50,
					x2: 0,
					y2: 30,
					colors: [
						{offset: 0, color: [100,100,100]},
						{offset: 1, color: this.fillColor}
					]
				});
				g.createPath().moveTo(4, 25).vLineTo(14).smoothCurveTo(4, 4, 18, 4).hLineTo(w - 16).smoothCurveTo(w - 4, 4, w - 4, 16).closePath().setFill({
					type: "linear",
					x1: 0,
					y1: 0,
					x2: 0,
					y2: 20,
					colors: [
						{offset: 0, color: [150,150,150]},
						{offset: 1, color: this.fillColor}
					]
				});
				g.createPath().moveTo(4, 25).vLineTo(14).smoothCurveTo(4, 4, 18, 4).hLineTo(w - 16).smoothCurveTo(w - 4, 4, w - 4, 16).closePath().setFill([255,255,255,0.05]);
			}
		});
	}
);


},
'dojox/dgauges/RectangularGauge':function(){
define(["dojo/_base/declare", "./GaugeBase", "dojox/gfx/matrix"], function(declare, GaugeBase, matrix){
	return declare("dojox.dgauges.RectangularGauge", GaugeBase, {
		// summary:
		//		The base class for rectangular gauges.
		//		You can create custom horizontal or vertical gauges by extending this class.
		//		See dojox/dgauges/components/default/HorinzontalLinearGauge.js for an example of rectangular gauge.

		// orientation: "horizontal"|"vertical"
		//		The orientation of the gauge. Default is "horizontal".	
		orientation: "horizontal",
		
		// leading, middle and trailing graphical parts
		_middleParts: null,
		_leadingParts: null,
		_trailingParts: null,
		_baseParts: null,
		_classParts: null,
		_layoutInfos: {},
		constructor: function(){
		
			this.orientation = "horizontal";
			
			this._middleParts = [];
			this._leadingParts = [];
			this._trailingParts = [];
			this._baseParts = [];
			this._classParts = [];
			
			this._layoutInfos = {
				leading: {
					x: 0,
					y: 0,
					w: 0,
					h: 0
				},
				middle: {
					x: 0,
					y: 0,
					w: 0,
					h: 0
				},
				trailing: {
					x: 0,
					y: 0,
					w: 0,
					h: 0
				}
			};
			this.addInvalidatingProperties(["orientation"]);
			
		},
		
		addElement: function(name, element, location){
			// summary:
			//		Adds a element to the gauge.
			// name: String
			//		The name of the element to be added.
			// element: Object
			//		This parameter can be:
			//		- A function which takes on argument of type GFX Group and return null or a
			//		GFX element retrievable using the getElementRenderer() method.
			//		- A Scale instance, i.e. CircularScale or RectangularScale.
			//		- A TextIndicator instance.
			// location: String
			//		The area to place the element. Valid values are "leading"|"middle"|"trailing". Leading and trailing areas are fixed size. The
			//		middle area use the remaining size. If not specified, the element's refreshRendering 
			//		is called with the whole gauge size as argument.

			this.inherited(arguments);
			
			var obj = this._elements[this._elements.length - 1];
			
			if(location == "middle"){
				this._middleParts.push(obj);
			}else if(location == "leading"){
				this._leadingParts.push(obj);
			}else if(location == "trailing"){
				this._trailingParts.push(obj);
			}else{
				if(obj._isGFX){
					this._baseParts.push(obj);
				}else{
					this._classParts.push(obj);
				}
			}
		},
		
		removeElement: function(name){
			// summary:
			//		Remove the element defined by name from the gauge.
			// name: String
			//		The name of the element as defined using addElement.
			// returns: Object
			//		A reference to the removed element.		
			var obj = this.getElement(name);
			if(obj){
				if(this._middleParts && this._middleParts.indexOf(obj) >= 0){
					this._middleParts.splice(this._middleParts.indexOf(obj), 1);
				}else if(this._leadingParts && this._leadingParts.indexOf(obj) >= 0){
					this._leadingParts.splice(this._leadingParts.indexOf(obj), 1);
				}else if(this._trailingParts && this._trailingParts.indexOf(obj) >= 0){
					this._trailingParts.splice(this._trailingParts.indexOf(obj), 1);
				}else if(this._baseParts && this._baseParts.indexOf(obj) >= 0){
					this._baseParts.splice(this._baseParts.indexOf(obj), 1);
				}else if(this._classParts && this._classParts.indexOf(obj) >= 0){
					this._classParts.splice(this._classParts.indexOf(obj), 1);
				}
			}
			
			this.inherited(arguments);
		},
		
		_computeArrayBoundingBox: function(elements){
			// summary:
			//		Internal method.
			// tags:
			//		private
			if(elements.length == 0){
				return {x: 0, y: 0, w: 0, h: 0};
			}
			var bbox = null;
			var minX, minY, maxX, maxY;
			minX = minY = +Infinity;
			maxX = maxY = -Infinity;
			for(var i = 0; i < elements.length; i++){
				bbox = this._computeBoundingBox(elements[i]._gfxGroup);
				if(minX > bbox.x){
					minX = bbox.x;
				}
				if(minY > bbox.y){
					minY = bbox.y;
				}
				if(maxX < bbox.x + bbox.width){
					maxX = bbox.x + bbox.width;
				}
				if(maxY < bbox.y + bbox.height){
					maxY = bbox.y + bbox.height;
				}
			}
			return {x: minX, y:minY, w: maxX-minX, h: maxY-minY};
		},
		
		refreshRendering: function(){
			if(this._widgetBox.w <= 0 || this._widgetBox.h <= 0){
				return;
			}
			var i;
			if(this._baseParts){
				for(i = 0; i < this._baseParts.length; i++){
					this._baseParts[i].width = this._widgetBox.w;
					this._baseParts[i].height = this._widgetBox.h;
					this._elementsRenderers[this._baseParts[i]._name] = this._baseParts[i].refreshRendering();
				}
			}
			
			if(this._leadingParts){
				for(i = 0; i < this._leadingParts.length; i++){
					this._elementsRenderers[this._leadingParts[i]._name] = this._leadingParts[i].refreshRendering();
				}
			}
			
			if(this._trailingParts){
				for(i = 0; i < this._trailingParts.length; i++){
					this._elementsRenderers[this._trailingParts[i]._name] = this._trailingParts[i].refreshRendering();
				}
			}
			
			var leadingBoundingBox = this._computeArrayBoundingBox(this._leadingParts);
			var trailingBoundingBox = this._computeArrayBoundingBox(this._trailingParts);
			var middleBoundingBox = {};
			
			if(this.orientation == "horizontal"){
				middleBoundingBox.x = leadingBoundingBox.x + leadingBoundingBox.w;
				middleBoundingBox.y = 0;
				middleBoundingBox.w = this._widgetBox.w - leadingBoundingBox.w - trailingBoundingBox.w;
				middleBoundingBox.h = this._widgetBox.h;
			}else{
				middleBoundingBox.x = 0;
				middleBoundingBox.y = leadingBoundingBox.y + leadingBoundingBox.h;
				middleBoundingBox.w = this._widgetBox.w; 
				middleBoundingBox.h = this._widgetBox.h - leadingBoundingBox.h - trailingBoundingBox.h;
			}
			
			this._layoutInfos = {
				leading: leadingBoundingBox,
				middle: middleBoundingBox,
				trailing: trailingBoundingBox
			};
			
			// translates middle part
			for(i = 0; i < this._middleParts.length; i++){
				this._middleParts[i]._gfxGroup.setTransform([matrix.translate(middleBoundingBox.x, middleBoundingBox.y)]);
			}
			
			// translates trailing part
			if(this._trailingParts){
				for(i = 0; i < this._trailingParts.length; i++){
					this._trailingParts[i]._gfxGroup.setTransform(matrix.translate(this._widgetBox.w - trailingBoundingBox.w, 0));
				}
			}
			
			// Render remaining elements (scales, ...)
			for(i = 0; i < this._classParts.length; i++){
				this._elementsRenderers[this._classParts[i]._name] = this._classParts[i].refreshRendering();
			}
		}
	})
});

},
'dojox/dgauges/RectangularScale':function(){
define(["dojo/_base/declare", "dojox/gfx", "./ScaleBase"], function(declare, gfx, ScaleBase){
	return declare("dojox.dgauges.RectangularScale", ScaleBase, {
		// summary:
		//		The rectangular scale. A scaler must be set to use this class.

		// paddingLeft: Number
		//		The left padding.
		paddingLeft: 15,
		// paddingTop: Number
		//		The top padding.
		paddingTop: 12,
		// paddingRight: Number
		//		The right padding.
		paddingRight: 15,
		// paddingBottom: Number
		//		The bottom padding.
		paddingBottom: 0,
		_contentBox: null,		
		constructor: function(){
			this.labelPosition = "leading";
			this.addInvalidatingProperties(["paddingTop", "paddingLeft", "paddingRight", "paddingBottom"]);
		},
		
		positionForValue: function(value){
			// summary:
			//		Transforms a value into a position using the associated scaler.
			// value:
			//		The value to transform.
			// returns: Number
			//		A position in pixels.
			var relativePos = 0;
			var position;
			var spos = 0;
			var length = 0;
			if(this._contentBox){
				if(this._gauge.orientation == "horizontal"){
					spos = this._contentBox.x;
					length = this._contentBox.w;
				}else{
					spos = this._contentBox.y;
					length = this._contentBox.h;
				}
			}
			relativePos = this.scaler.positionForValue(value);
			position = spos + (relativePos * length);
			return position;
		},
		
		valueForPosition: function(pos){
			// summary:
			//		Transforms a position in pixels into a value using the associated scaler.
			// pos:
			//		The position to transform.
			// returns: Number
			//		The value represented by pos. 
			var value = this.scaler.minimum;
			var position = NaN;
			var spos = 0;
			var epos = 0;
			
			if(this._gauge.orientation == "horizontal"){
				position = pos.x;
				spos = this._contentBox.x;
				epos = this._contentBox.x + this._contentBox.w;
			}else{
				position = pos.y;
				spos = this._contentBox.y;
				epos = this._contentBox.y + this._contentBox.h;
			}
			
			if(position <= spos){
				value = this.scaler.minimum;
			}else if(position >= epos){
				value = this.scaler.maximum;
			}else {
				value = this.scaler.valueForPosition((position - spos)/(epos - spos));
			}
			return value;
			
		},
		
		refreshRendering: function(){
			this.inherited(arguments);
			if(!this._gfxGroup || !this.scaler) 
				return;
			
			this._ticksGroup.clear();
			
			// variables for ticks rendering
			var middleBox = this._gauge._layoutInfos.middle;
			
			this._contentBox = {};
			
			this._contentBox.x = middleBox.x + this.paddingLeft;
			this._contentBox.y = middleBox.y + this.paddingTop;
			this._contentBox.w = middleBox.w - (this.paddingLeft + this.paddingRight);
			this._contentBox.h = middleBox.h - (this.paddingBottom + this.paddingTop);
			var renderer;
			
			// variables for tick labels
			var labelText;
			var font = this._getFont();
			
			// Layout ticks
			var allTicks = this.scaler.computeTicks();
			
			for(var i = 0; i < allTicks.length; i++){
				var tickItem = allTicks[i];
				renderer = this.tickShapeFunc(this._ticksGroup, this, tickItem);
				
				if(renderer){
					var a = this.positionForValue(tickItem.value);
					var tickSize = this._gauge._computeBoundingBox(renderer).width;
					
					var x1 = 0, y1 = 0, angle = 0;
					if(this._gauge.orientation == "horizontal"){
						x1 = a;
						y1 = this._contentBox.y;
						angle = 90;
					}else{
						x1 = this._contentBox.x;
						y1 = a;
					}
					
					renderer.setTransform([{
						dx: x1,
						dy: y1
					}, gfx.matrix.rotateg(angle)]);
				}
				
				labelText = this.tickLabelFunc(tickItem);
				
				if(labelText){
					var tbox = gfx._base._getTextBox(labelText, {
						font: gfx.makeFontString(gfx.makeParameters(gfx.defaultFont, font))
					});
					var tw = tbox.w;
					var th = tbox.h;
					var al = "start";
					var xt = x1;
					var yt = y1;
					
					if(this._gauge.orientation == "horizontal"){
						xt = x1;
						if(this.labelPosition == "trailing"){
							yt = y1 + tickSize + this.labelGap + th;
						}else{
							yt = y1 - this.labelGap;
						}
						al = "middle";
					}else{
						if(this.labelPosition == "trailing"){
							xt = x1 + tickSize + this.labelGap;
						}else{
							xt = x1 - this.labelGap - tw;
						}
						yt = y1 + th / 2;
					}
					
					var t = this._ticksGroup.createText({
						x: xt,
						y: yt,
						text: labelText,
						align: al
					});
					t.setFill(font.color ? font.color : "black");
					t.setFont(font);
				}
			}
			
			for(var key in this._indicatorsIndex){
				this._indicatorsRenderers[key] = this._indicatorsIndex[key].invalidateRendering();
			}
		}
	})
});

},
'dojox/dgauges/RectangularValueIndicator':function(){
define(["dojo/_base/declare", "./ScaleIndicatorBase", "dojox/gfx", "dojo/_base/event", "dojo/dom-geometry"],
	function(declare, ScaleIndicatorBase, gfx, eventUtil, domGeom){
	return declare("dojox.dgauges.RectangularValueIndicator", ScaleIndicatorBase, {
		// summary:
		//		The rectangular value indicator, typically used for creating markers or thumbs.

		// paddingLeft: Number
		//		The left padding.
		paddingLeft: 0,
		// paddingTop: Number
		//		The top padding.
		paddingTop: 0,
		// paddingRight: Number
		//		The right padding.
		paddingRight: 0,
		// paddingBottom: Number
		//		The bottom padding.
		paddingBottom: 0,

		
		constructor: function(){
			this.addInvalidatingProperties(["paddingTop", "paddingLeft", "paddingRight", "paddingBottom"]);
		},
		
		indicatorShapeFunc: function(group, indicator){
			// summary:
			//		Draws the indicator.
			// group: dojox/gfx/Group
			//		A GFX group for drawing. The indicator is always centered horizontally and is
			//		automatically rotated if the scale is vertical.
			// indicator: dojox/dgauges/IndicatorBase
			//		A reference to this indicator.
			// returns: dojox/gfx/shape.Shape
			//		A GFX shape retrievable using the getIndicatorRenderer method of the associated scale. 
			return group.createPolyline([0, 0, 10, 0, 0, 10, -10, 0, 0, 0]).setStroke({
					color: "black",
					width: 1
				});
		},
				
		refreshRendering: function(){
			this.inherited(arguments);

			// get position corresponding to the value
			var v = isNaN(this._transitionValue) ? this.value : this._transitionValue;
			var pos = this.scale.positionForValue(v);
			
			// computes offsets to move the indicator
			var dx = 0, dy = 0;
			var angle = 0;
			if(this.scale._gauge.orientation == "horizontal"){
				dx = pos;
				dy = this.paddingTop;
			}else{
				dx = this.paddingLeft;
				dy = pos;
				angle = 90;
			}
			
			// translate the indicator
			
			this._gfxGroup.setTransform([{
				dx: dx,
				dy: dy
			}, gfx.matrix.rotateg(angle)]);
		},
		
		_onMouseDown: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			var np = domGeom.position(this.scale._gauge.domNode, true);
			this.set("value", this.scale.valueForPosition({x: event.pageX - np.x, y: event.pageY - np.y}));

			// prevent the browser from selecting text
			eventUtil.stop(event);
		},
		
		_onMouseMove: function(event){
			// summary:
			//		Internal method.
			// tags:
			//		private
			this.inherited(arguments);
			
			var np = domGeom.position(this.scale._gauge.domNode, true);
			this.set("value", this.scale.valueForPosition({x: event.pageX - np.x, y: event.pageY - np.y}));
		}
	})
});

},
'dojo/parser':function(){
define([
	"require", "./_base/kernel", "./_base/lang", "./_base/array", "./_base/config", "./dom", "./_base/window",
		"./_base/url", "./aspect", "./promise/all", "./date/stamp", "./Deferred", "./has", "./query", "./on", "./ready"
], function(require, dojo, dlang, darray, config, dom, dwindow, _Url, aspect, all, dates, Deferred, has, query, don, ready){

	// module:
	//		dojo/parser

	new Date("X"); // workaround for #11279, new Date("") == NaN

	// data-dojo-props etc. is not restricted to JSON, it can be any javascript
	function myEval(text){
		return eval("(" + text + ")");
	}

	// Widgets like BorderContainer add properties to _Widget via dojo.extend().
	// If BorderContainer is loaded after _Widget's parameter list has been cached,
	// we need to refresh that parameter list (for _Widget and all widgets that extend _Widget).
	var extendCnt = 0;
	aspect.after(dlang, "extend", function(){
		extendCnt++;
	}, true);

	function getNameMap(ctor){
		// summary:
		//		Returns map from lowercase name to attribute name in class, ex: {onclick: "onClick"}
		var map = ctor._nameCaseMap, proto = ctor.prototype;

		// Create the map if it's undefined.
		// Refresh the map if a superclass was possibly extended with new methods since the map was created.
		if(!map || map._extendCnt < extendCnt){
			map = ctor._nameCaseMap = {};
			for(var name in proto){
				if(name.charAt(0) === "_"){
					continue;
				}	// skip internal properties
				map[name.toLowerCase()] = name;
			}
			map._extendCnt = extendCnt;
		}
		return map;
	}

	// Map from widget name or list of widget names(ex: "dijit/form/Button,acme/MyMixin") to a constructor.
	var _ctorMap = {};

	function getCtor(/*String[]*/ types, /*Function?*/ contextRequire){
		// summary:
		//		Retrieves a constructor.  If the types array contains more than one class/MID then the
		//		subsequent classes will be mixed into the first class and a unique constructor will be
		//		returned for that array.

		var ts = types.join();
		if(!_ctorMap[ts]){
			var mixins = [];
			for(var i = 0, l = types.length; i < l; i++){
				var t = types[i];
				// TODO: Consider swapping getObject and require in the future
				mixins[mixins.length] = (_ctorMap[t] = _ctorMap[t] || (dlang.getObject(t) || (~t.indexOf('/') &&
					(contextRequire ? contextRequire(t) : require(t)))));
			}
			var ctor = mixins.shift();
			_ctorMap[ts] = mixins.length ? (ctor.createSubclass ? ctor.createSubclass(mixins) : ctor.extend.apply(ctor, mixins)) : ctor;
		}

		return _ctorMap[ts];
	}

	var parser = {
		// summary:
		//		The Dom/Widget parsing package

		_clearCache: function(){
			// summary:
			//		Clear cached data.   Used mainly for benchmarking.
			extendCnt++;
			_ctorMap = {};
		},

		_functionFromScript: function(script, attrData){
			// summary:
			//		Convert a `<script type="dojo/method" args="a, b, c"> ... </script>`
			//		into a function
			// script: DOMNode
			//		The `<script>` DOMNode
			// attrData: String
			//		For HTML5 compliance, searches for attrData + "args" (typically
			//		"data-dojo-args") instead of "args"
			var preamble = "",
				suffix = "",
				argsStr = (script.getAttribute(attrData + "args") || script.getAttribute("args")),
				withStr = script.getAttribute("with");

			// Convert any arguments supplied in script tag into an array to be passed to the
			var fnArgs = (argsStr || "").split(/\s*,\s*/);

			if(withStr && withStr.length){
				darray.forEach(withStr.split(/\s*,\s*/), function(part){
					preamble += "with(" + part + "){";
					suffix += "}";
				});
			}

			return new Function(fnArgs, preamble + script.innerHTML + suffix);
		},

		instantiate: function(nodes, mixin, options){
			// summary:
			//		Takes array of nodes, and turns them into class instances and
			//		potentially calls a startup method to allow them to connect with
			//		any children.
			// nodes: Array
			//		Array of DOM nodes
			// mixin: Object?
			//		An object that will be mixed in with each node in the array.
			//		Values in the mixin will override values in the node, if they
			//		exist.
			// options: Object?
			//		An object used to hold kwArgs for instantiation.
			//		See parse.options argument for details.
			// returns:
			//		Array of instances.

			mixin = mixin || {};
			options = options || {};

			var dojoType = (options.scope || dojo._scopeName) + "Type", // typically "dojoType"
				attrData = "data-" + (options.scope || dojo._scopeName) + "-", // typically "data-dojo-"
				dataDojoType = attrData + "type", // typically "data-dojo-type"
				dataDojoMixins = attrData + "mixins";					// typically "data-dojo-mixins"

			var list = [];
			darray.forEach(nodes, function(node){
				var type = dojoType in mixin ? mixin[dojoType] : node.getAttribute(dataDojoType) || node.getAttribute(dojoType);
				if(type){
					var mixinsValue = node.getAttribute(dataDojoMixins),
						types = mixinsValue ? [type].concat(mixinsValue.split(/\s*,\s*/)) : [type];

					list.push({
						node: node,
						types: types
					});
				}
			});

			// Instantiate the nodes and return the list of instances.
			return this._instantiate(list, mixin, options);
		},

		_instantiate: function(nodes, mixin, options, returnPromise){
			// summary:
			//		Takes array of objects representing nodes, and turns them into class instances and
			//		potentially calls a startup method to allow them to connect with
			//		any children.
			// nodes: Array
			//		Array of objects like
			//	|		{
			//	|			ctor: Function (may be null)
			//	|			types: ["dijit/form/Button", "acme/MyMixin"] (used if ctor not specified)
			//	|			node: DOMNode,
			//	|			scripts: [ ... ],	// array of <script type="dojo/..."> children of node
			//	|			inherited: { ... }	// settings inherited from ancestors like dir, theme, etc.
			//	|		}
			// mixin: Object
			//		An object that will be mixed in with each node in the array.
			//		Values in the mixin will override values in the node, if they
			//		exist.
			// options: Object
			//		An options object used to hold kwArgs for instantiation.
			//		See parse.options argument for details.
			// returnPromise: Boolean
			//		Return a Promise rather than the instance; supports asynchronous widget creation.
			// returns:
			//		Array of instances, or if returnPromise is true, a promise for array of instances
			//		that resolves when instances have finished initializing.

			// Call widget constructors.   Some may be asynchronous and return promises.
			var thelist = darray.map(nodes, function(obj){
				var ctor = obj.ctor || getCtor(obj.types, options.contextRequire);
				// If we still haven't resolved a ctor, it is fatal now
				if(!ctor){
					throw new Error("Unable to resolve constructor for: '" + obj.types.join() + "'");
				}
				return this.construct(ctor, obj.node, mixin, options, obj.scripts, obj.inherited);
			}, this);

			// After all widget construction finishes, call startup on each top level instance if it makes sense (as for
			// widgets).  Parent widgets will recursively call startup on their (non-top level) children
			function onConstruct(thelist){
				if(!mixin._started && !options.noStart){
					darray.forEach(thelist, function(instance){
						if(typeof instance.startup === "function" && !instance._started){
							instance.startup();
						}
					});
				}

				return thelist;
			}

			if(returnPromise){
				return all(thelist).then(onConstruct);
			}else{
				// Back-compat path, remove for 2.0
				return onConstruct(thelist);
			}
		},

		construct: function(ctor, node, mixin, options, scripts, inherited){
			// summary:
			//		Calls new ctor(params, node), where params is the hash of parameters specified on the node,
			//		excluding data-dojo-type and data-dojo-mixins.   Does not call startup().
			// ctor: Function
			//		Widget constructor.
			// node: DOMNode
			//		This node will be replaced/attached to by the widget.  It also specifies the arguments to pass to ctor.
			// mixin: Object?
			//		Attributes in this object will be passed as parameters to ctor,
			//		overriding attributes specified on the node.
			// options: Object?
			//		An options object used to hold kwArgs for instantiation.   See parse.options argument for details.
			// scripts: DomNode[]?
			//		Array of `<script type="dojo/*">` DOMNodes.  If not specified, will search for `<script>` tags inside node.
			// inherited: Object?
			//		Settings from dir=rtl or lang=... on a node above this node.   Overrides options.inherited.
			// returns:
			//		Instance or Promise for the instance, if markupFactory() itself returned a promise

			var proto = ctor && ctor.prototype;
			options = options || {};

			// Setup hash to hold parameter settings for this widget.	Start with the parameter
			// settings inherited from ancestors ("dir" and "lang").
			// Inherited setting may later be overridden by explicit settings on node itself.
			var params = {};

			if(options.defaults){
				// settings for the document itself (or whatever subtree is being parsed)
				dlang.mixin(params, options.defaults);
			}
			if(inherited){
				// settings from dir=rtl or lang=... on a node above this node
				dlang.mixin(params, inherited);
			}

			// Get list of attributes explicitly listed in the markup
			var attributes;
			if(has("dom-attributes-explicit")){
				// Standard path to get list of user specified attributes
				attributes = node.attributes;
			}else if(has("dom-attributes-specified-flag")){
				// Special processing needed for IE8, to skip a few faux values in attributes[]
				attributes = darray.filter(node.attributes, function(a){
					return a.specified;
				});
			}else{
				// Special path for IE6-7, avoid (sometimes >100) bogus entries in node.attributes
				var clone = /^input$|^img$/i.test(node.nodeName) ? node : node.cloneNode(false),
					attrs = clone.outerHTML.replace(/=[^\s"']+|="[^"]*"|='[^']*'/g, "").replace(/^\s*<[a-zA-Z0-9]*\s*/, "").replace(/\s*>.*$/, "");

				attributes = darray.map(attrs.split(/\s+/), function(name){
					var lcName = name.toLowerCase();
					return {
						name: name,
						// getAttribute() doesn't work for button.value, returns innerHTML of button.
						// but getAttributeNode().value doesn't work for the form.encType or li.value
						value: (node.nodeName == "LI" && name == "value") || lcName == "enctype" ?
							node.getAttribute(lcName) : node.getAttributeNode(lcName).value
					};
				});
			}

			// Hash to convert scoped attribute name (ex: data-dojo17-params) to something friendly (ex: data-dojo-params)
			// TODO: remove scope for 2.0
			var scope = options.scope || dojo._scopeName,
				attrData = "data-" + scope + "-", // typically "data-dojo-"
				hash = {};
			if(scope !== "dojo"){
				hash[attrData + "props"] = "data-dojo-props";
				hash[attrData + "type"] = "data-dojo-type";
				hash[attrData + "mixins"] = "data-dojo-mixins";
				hash[scope + "type"] = "dojoType";
				hash[attrData + "id"] = "data-dojo-id";
			}

			// Read in attributes and process them, including data-dojo-props, data-dojo-type,
			// dojoAttachPoint, etc., as well as normal foo=bar attributes.
			var i = 0, item, funcAttrs = [], jsname, extra;
			while(item = attributes[i++]){
				var name = item.name,
					lcName = name.toLowerCase(),
					value = item.value;

				switch(hash[lcName] || lcName){
				// Already processed, just ignore
				case "data-dojo-type":
				case "dojotype":
				case "data-dojo-mixins":
					break;

				// Data-dojo-props.   Save for later to make sure it overrides direct foo=bar settings
				case "data-dojo-props":
					extra = value;
					break;

				// data-dojo-id or jsId. TODO: drop jsId in 2.0
				case "data-dojo-id":
				case "jsid":
					jsname = value;
					break;

				// For the benefit of _Templated
				case "data-dojo-attach-point":
				case "dojoattachpoint":
					params.dojoAttachPoint = value;
					break;
				case "data-dojo-attach-event":
				case "dojoattachevent":
					params.dojoAttachEvent = value;
					break;

				// Special parameter handling needed for IE
				case "class":
					params["class"] = node.className;
					break;
				case "style":
					params["style"] = node.style && node.style.cssText;
					break;
				default:
					// Normal attribute, ex: value="123"

					// Find attribute in widget corresponding to specified name.
					// May involve case conversion, ex: onclick --> onClick
					if(!(name in proto)){
						var map = getNameMap(ctor);
						name = map[lcName] || name;
					}

					// Set params[name] to value, doing type conversion
					if(name in proto){
						switch(typeof proto[name]){
						case "string":
							params[name] = value;
							break;
						case "number":
							params[name] = value.length ? Number(value) : NaN;
							break;
						case "boolean":
							// for checked/disabled value might be "" or "checked".	 interpret as true.
							params[name] = value.toLowerCase() != "false";
							break;
						case "function":
							if(value === "" || value.search(/[^\w\.]+/i) != -1){
								// The user has specified some text for a function like "return x+5"
								params[name] = new Function(value);
							}else{
								// The user has specified the name of a global function like "myOnClick"
								// or a single word function "return"
								params[name] = dlang.getObject(value, false) || new Function(value);
							}
							funcAttrs.push(name);	// prevent "double connect", see #15026
							break;
						default:
							var pVal = proto[name];
							params[name] =
								(pVal && "length" in pVal) ? (value ? value.split(/\s*,\s*/) : []) :	// array
									(pVal instanceof Date) ?
										(value == "" ? new Date("") :	// the NaN of dates
										value == "now" ? new Date() :	// current date
										dates.fromISOString(value)) :
								(pVal instanceof _Url) ? (dojo.baseUrl + value) :
								myEval(value);
						}
					}else{
						params[name] = value;
					}
				}
			}

			// Remove function attributes from DOMNode to prevent "double connect" problem, see #15026.
			// Do this as a separate loop since attributes[] is often a live collection (depends on the browser though).
			for(var j = 0; j < funcAttrs.length; j++){
				var lcfname = funcAttrs[j].toLowerCase();
				node.removeAttribute(lcfname);
				node[lcfname] = null;
			}

			// Mix things found in data-dojo-props into the params, overriding any direct settings
			if(extra){
				try{
					extra = myEval.call(options.propsThis, "{" + extra + "}");
					dlang.mixin(params, extra);
				}catch(e){
					// give the user a pointer to their invalid parameters. FIXME: can we kill this in production?
					throw new Error(e.toString() + " in data-dojo-props='" + extra + "'");
				}
			}

			// Any parameters specified in "mixin" override everything else.
			dlang.mixin(params, mixin);

			// Get <script> nodes associated with this widget, if they weren't specified explicitly
			if(!scripts){
				scripts = (ctor && (ctor._noScript || proto._noScript) ? [] : query("> script[type^='dojo/']", node));
			}

			// Process <script type="dojo/*"> script tags
			// <script type="dojo/method" data-dojo-event="foo"> tags are added to params, and passed to
			// the widget on instantiation.
			// <script type="dojo/method"> tags (with no event) are executed after instantiation
			// <script type="dojo/connect" data-dojo-event="foo"> tags are dojo.connected after instantiation,
			// and likewise with <script type="dojo/aspect" data-dojo-method="foo">
			// <script type="dojo/watch" data-dojo-prop="foo"> tags are dojo.watch after instantiation
			// <script type="dojo/on" data-dojo-event="foo"> tags are dojo.on after instantiation
			// note: dojo/* script tags cannot exist in self closing widgets, like <input />
			var aspects = [],	// aspects to connect after instantiation
				calls = [],		// functions to call after instantiation
				watches = [],  // functions to watch after instantiation
				ons = []; // functions to on after instantiation

			if(scripts){
				for(i = 0; i < scripts.length; i++){
					var script = scripts[i];
					node.removeChild(script);
					// FIXME: drop event="" support in 2.0. use data-dojo-event="" instead
					var event = (script.getAttribute(attrData + "event") || script.getAttribute("event")),
						prop = script.getAttribute(attrData + "prop"),
						method = script.getAttribute(attrData + "method"),
						advice = script.getAttribute(attrData + "advice"),
						scriptType = script.getAttribute("type"),
						nf = this._functionFromScript(script, attrData);
					if(event){
						if(scriptType == "dojo/connect"){
							aspects.push({ method: event, func: nf });
						}else if(scriptType == "dojo/on"){
							ons.push({ event: event, func: nf });
						}else{
							// <script type="dojo/method" data-dojo-event="foo">
							// TODO for 2.0: use data-dojo-method="foo" instead (also affects dijit/Declaration)
							params[event] = nf;
						}
					}else if(scriptType == "dojo/aspect"){
						aspects.push({ method: method, advice: advice, func: nf });
					}else if(scriptType == "dojo/watch"){
						watches.push({ prop: prop, func: nf });
					}else{
						calls.push(nf);
					}
				}
			}

			// create the instance
			var markupFactory = ctor.markupFactory || proto.markupFactory;
			var instance = markupFactory ? markupFactory(params, node, ctor) : new ctor(params, node);

			function onInstantiate(instance){
				// map it to the JS namespace if that makes sense
				if(jsname){
					dlang.setObject(jsname, instance);
				}

				// process connections and startup functions
				for(i = 0; i < aspects.length; i++){
					aspect[aspects[i].advice || "after"](instance, aspects[i].method, dlang.hitch(instance, aspects[i].func), true);
				}
				for(i = 0; i < calls.length; i++){
					calls[i].call(instance);
				}
				for(i = 0; i < watches.length; i++){
					instance.watch(watches[i].prop, watches[i].func);
				}
				for(i = 0; i < ons.length; i++){
					don(instance, ons[i].event, ons[i].func);
				}

				return instance;
			}

			if(instance.then){
				return instance.then(onInstantiate);
			}else{
				return onInstantiate(instance);
			}
		},

		scan: function(root, options){
			// summary:
			//		Scan a DOM tree and return an array of objects representing the DOMNodes
			//		that need to be turned into widgets.
			// description:
			//		Search specified node (or document root node) recursively for class instances
			//		and return an array of objects that represent potential widgets to be
			//		instantiated. Searches for either data-dojo-type="MID" or dojoType="MID" where
			//		"MID" is a module ID like "dijit/form/Button" or a fully qualified Class name
			//		like "dijit/form/Button".  If the MID is not currently available, scan will
			//		attempt to require() in the module.
			//
			//		See parser.parse() for details of markup.
			// root: DomNode?
			//		A default starting root node from which to start the parsing. Can be
			//		omitted, defaulting to the entire document. If omitted, the `options`
			//		object can be passed in this place. If the `options` object has a
			//		`rootNode` member, that is used.
			// options: Object
			//		a kwArgs options object, see parse() for details
			//
			// returns: Promise
			//		A promise that is resolved with the nodes that have been parsed.

			var list = [], // Output List
				mids = [], // An array of modules that are not yet loaded
				midsHash = {}; // Used to keep the mids array unique

			var dojoType = (options.scope || dojo._scopeName) + "Type", // typically "dojoType"
				attrData = "data-" + (options.scope || dojo._scopeName) + "-", // typically "data-dojo-"
				dataDojoType = attrData + "type", // typically "data-dojo-type"
				dataDojoTextDir = attrData + "textdir", // typically "data-dojo-textdir"
				dataDojoMixins = attrData + "mixins";					// typically "data-dojo-mixins"

			// Info on DOMNode currently being processed
			var node = root.firstChild;

			// Info on parent of DOMNode currently being processed
			//	- inherited: dir, lang, and textDir setting of parent, or inherited by parent
			//	- parent: pointer to identical structure for my parent (or null if no parent)
			//	- scripts: if specified, collects <script type="dojo/..."> type nodes from children
			var inherited = options.inherited;
			if(!inherited){
				function findAncestorAttr(node, attr){
					return (node.getAttribute && node.getAttribute(attr)) ||
						(node.parentNode && findAncestorAttr(node.parentNode, attr));
				}

				inherited = {
					dir: findAncestorAttr(root, "dir"),
					lang: findAncestorAttr(root, "lang"),
					textDir: findAncestorAttr(root, dataDojoTextDir)
				};
				for(var key in inherited){
					if(!inherited[key]){
						delete inherited[key];
					}
				}
			}

			// Metadata about parent node
			var parent = {
				inherited: inherited
			};

			// For collecting <script type="dojo/..."> type nodes (when null, we don't need to collect)
			var scripts;

			// when true, only look for <script type="dojo/..."> tags, and don't recurse to children
			var scriptsOnly;

			function getEffective(parent){
				// summary:
				//		Get effective dir, lang, textDir settings for specified obj
				//		(matching "parent" object structure above), and do caching.
				//		Take care not to return null entries.
				if(!parent.inherited){
					parent.inherited = {};
					var node = parent.node,
						grandparent = getEffective(parent.parent);
					var inherited = {
						dir: node.getAttribute("dir") || grandparent.dir,
						lang: node.getAttribute("lang") || grandparent.lang,
						textDir: node.getAttribute(dataDojoTextDir) || grandparent.textDir
					};
					for(var key in inherited){
						if(inherited[key]){
							parent.inherited[key] = inherited[key];
						}
					}
				}
				return parent.inherited;
			}

			// DFS on DOM tree, collecting nodes with data-dojo-type specified.
			while(true){
				if(!node){
					// Finished this level, continue to parent's next sibling
					if(!parent || !parent.node){
						break;
					}
					node = parent.node.nextSibling;
					scriptsOnly = false;
					parent = parent.parent;
					scripts = parent.scripts;
					continue;
				}

				if(node.nodeType != 1){
					// Text or comment node, skip to next sibling
					node = node.nextSibling;
					continue;
				}

				if(scripts && node.nodeName.toLowerCase() == "script"){
					// Save <script type="dojo/..."> for parent, then continue to next sibling
					type = node.getAttribute("type");
					if(type && /^dojo\/\w/i.test(type)){
						scripts.push(node);
					}
					node = node.nextSibling;
					continue;
				}
				if(scriptsOnly){
					// scriptsOnly flag is set, we have already collected scripts if the parent wants them, so now we shouldn't
					// continue further analysis of the node and will continue to the next sibling
					node = node.nextSibling;
					continue;
				}

				// Check for data-dojo-type attribute, fallback to backward compatible dojoType
				// TODO: Remove dojoType in 2.0
				var type = node.getAttribute(dataDojoType) || node.getAttribute(dojoType);

				// Short circuit for leaf nodes containing nothing [but text]
				var firstChild = node.firstChild;
				if(!type && (!firstChild || (firstChild.nodeType == 3 && !firstChild.nextSibling))){
					node = node.nextSibling;
					continue;
				}

				// Meta data about current node
				var current;

				var ctor = null;
				if(type){
					// If dojoType/data-dojo-type specified, add to output array of nodes to instantiate.
					var mixinsValue = node.getAttribute(dataDojoMixins),
						types = mixinsValue ? [type].concat(mixinsValue.split(/\s*,\s*/)) : [type];

					// Note: won't find classes declared via dojo/Declaration or any modules that haven't been
					// loaded yet so use try/catch to avoid throw from require()
					try{
						ctor = getCtor(types, options.contextRequire);
					}catch(e){}

					// If the constructor was not found, check to see if it has modules that can be loaded
					if(!ctor){
						darray.forEach(types, function(t){
							if(~t.indexOf('/') && !midsHash[t]){
								// If the type looks like a MID and it currently isn't in the array of MIDs to load, add it.
								midsHash[t] = true;
								mids[mids.length] = t;
							}
						});
					}

					var childScripts = ctor && !ctor.prototype._noScript ? [] : null; // <script> nodes that are parent's children

					// Setup meta data about this widget node, and save it to list of nodes to instantiate
					current = {
						types: types,
						ctor: ctor,
						parent: parent,
						node: node,
						scripts: childScripts
					};
					current.inherited = getEffective(current); // dir & lang settings for current node, explicit or inherited
					list.push(current);
				}else{
					// Meta data about this non-widget node
					current = {
						node: node,
						scripts: scripts,
						parent: parent
					};
				}

				// Recurse, collecting <script type="dojo/..."> children, and also looking for
				// descendant nodes with dojoType specified (unless the widget has the stopParser flag).
				// When finished with children, go to my next sibling.
				scripts = childScripts;
				scriptsOnly = node.stopParser || (ctor && ctor.prototype.stopParser && !(options.template));
				parent = current;
				node = firstChild;
			}

			var d = new Deferred();

			// If there are modules to load then require them in
			if(mids.length){
				// Warn that there are modules being auto-required
				if(has("dojo-debug-messages")){
					console.warn("WARNING: Modules being Auto-Required: " + mids.join(", "));
				}
				var r = options.contextRequire || require;
				r(mids, function(){
					// Go through list of widget nodes, filling in missing constructors, and filtering out nodes that shouldn't
					// be instantiated due to a stopParser flag on an ancestor that we belatedly learned about due to
					// auto-require of a module like ContentPane.   Assumes list is in DFS order.
					d.resolve(darray.filter(list, function(widget){
						if(!widget.ctor){
							// Attempt to find the constructor again.   Still won't find classes defined via
							// dijit/Declaration so need to try/catch.
							try{
								widget.ctor = getCtor(widget.types, options.contextRequire);
							}catch(e){}
						}

						// Get the parent widget
						var parent = widget.parent;
						while(parent && !parent.types){
							parent = parent.parent;
						}

						// Return false if this node should be skipped due to stopParser on an ancestor.
						// Since list[] is in DFS order, this loop will always set parent.instantiateChildren before
						// trying to compute widget.instantiate.
						var proto = widget.ctor && widget.ctor.prototype;
						widget.instantiateChildren = !(proto && proto.stopParser && !(options.template));
						widget.instantiate = !parent || (parent.instantiate && parent.instantiateChildren);
						return widget.instantiate;
					}));
				});
			}else{
				// There were no modules to load, so just resolve with the parsed nodes.   This separate code path is for
				// efficiency, to avoid running the require() and the callback code above.
				d.resolve(list);
			}

			// Return the promise
			return d.promise;
		},

		_require: function(/*DOMNode*/ script, /*Object?*/ options){
			// summary:
			//		Helper for _scanAMD().  Takes a `<script type=dojo/require>bar: "acme/bar", ...</script>` node,
			//		calls require() to load the specified modules and (asynchronously) assign them to the specified global
			//		variables, and returns a Promise for when that operation completes.
			//
			//		In the example above, it is effectively doing a require(["acme/bar", ...], function(a){ bar = a; }).

			var hash = myEval("{" + script.innerHTML + "}"), // can't use dojo/json::parse() because maybe no quotes
				vars = [],
				mids = [],
				d = new Deferred();

			var contextRequire = (options && options.contextRequire) || require;

			for(var name in hash){
				vars.push(name);
				mids.push(hash[name]);
			}

			contextRequire(mids, function(){
				for(var i = 0; i < vars.length; i++){
					dlang.setObject(vars[i], arguments[i]);
				}
				d.resolve(arguments);
			});

			return d.promise;
		},

		_scanAmd: function(root, options){
			// summary:
			//		Scans the DOM for any declarative requires and returns their values.
			// description:
			//		Looks for `<script type=dojo/require>bar: "acme/bar", ...</script>` node, calls require() to load the
			//		specified modules and (asynchronously) assign them to the specified global variables,
			//		and returns a Promise for when those operations complete.
			// root: DomNode
			//		The node to base the scan from.
			// options: Object?
			//		a kwArgs options object, see parse() for details

			// Promise that resolves when all the <script type=dojo/require> nodes have finished loading.
			var deferred = new Deferred(),
				promise = deferred.promise;
			deferred.resolve(true);

			var self = this;
			query("script[type='dojo/require']", root).forEach(function(node){
				// Fire off require() call for specified modules.  Chain this require to fire after
				// any previous requires complete, so that layers can be loaded before individual module require()'s fire.
				promise = promise.then(function(){
					return self._require(node, options);
				});

				// Remove from DOM so it isn't seen again
				node.parentNode.removeChild(node);
			});

			return promise;
		},

		parse: function(rootNode, options){
			// summary:
			//		Scan the DOM for class instances, and instantiate them.
			// description:
			//		Search specified node (or root node) recursively for class instances,
			//		and instantiate them. Searches for either data-dojo-type="Class" or
			//		dojoType="Class" where "Class" is a a fully qualified class name,
			//		like `dijit/form/Button`
			//
			//		Using `data-dojo-type`:
			//		Attributes using can be mixed into the parameters used to instantiate the
			//		Class by using a `data-dojo-props` attribute on the node being converted.
			//		`data-dojo-props` should be a string attribute to be converted from JSON.
			//
			//		Using `dojoType`:
			//		Attributes are read from the original domNode and converted to appropriate
			//		types by looking up the Class prototype values. This is the default behavior
			//		from Dojo 1.0 to Dojo 1.5. `dojoType` support is deprecated, and will
			//		go away in Dojo 2.0.
			// rootNode: DomNode?
			//		A default starting root node from which to start the parsing. Can be
			//		omitted, defaulting to the entire document. If omitted, the `options`
			//		object can be passed in this place. If the `options` object has a
			//		`rootNode` member, that is used.
			// options: Object?
			//		A hash of options.
			//
			//		- noStart: Boolean?:
			//			when set will prevent the parser from calling .startup()
			//			when locating the nodes.
			//		- rootNode: DomNode?:
			//			identical to the function's `rootNode` argument, though
			//			allowed to be passed in via this `options object.
			//		- template: Boolean:
			//			If true, ignores ContentPane's stopParser flag and parses contents inside of
			//			a ContentPane inside of a template.   This allows dojoAttachPoint on widgets/nodes
			//			nested inside the ContentPane to work.
			//		- inherited: Object:
			//			Hash possibly containing dir and lang settings to be applied to
			//			parsed widgets, unless there's another setting on a sub-node that overrides
			//		- scope: String:
			//			Root for attribute names to search for.   If scopeName is dojo,
			//			will search for data-dojo-type (or dojoType).   For backwards compatibility
			//			reasons defaults to dojo._scopeName (which is "dojo" except when
			//			multi-version support is used, when it will be something like dojo16, dojo20, etc.)
			//		- propsThis: Object:
			//			If specified, "this" referenced from data-dojo-props will refer to propsThis.
			//			Intended for use from the widgets-in-template feature of `dijit._WidgetsInTemplateMixin`
			//		- contextRequire: Function:
			//			If specified, this require is utilised for looking resolving modules instead of the
			//			`dojo/parser` context `require()`.  Intended for use from the widgets-in-template feature of
			//			`dijit._WidgetsInTemplateMixin`.
			// returns: Mixed
			//		Returns a blended object that is an array of the instantiated objects, but also can include
			//		a promise that is resolved with the instantiated objects.  This is done for backwards
			//		compatibility.  If the parser auto-requires modules, it will always behave in a promise
			//		fashion and `parser.parse().then(function(instances){...})` should be used.
			// example:
			//		Parse all widgets on a page:
			//	|		parser.parse();
			// example:
			//		Parse all classes within the node with id="foo"
			//	|		parser.parse(dojo.byId('foo'));
			// example:
			//		Parse all classes in a page, but do not call .startup() on any
			//		child
			//	|		parser.parse({ noStart: true })
			// example:
			//		Parse all classes in a node, but do not call .startup()
			//	|		parser.parse(someNode, { noStart:true });
			//	|		// or
			//	|		parser.parse({ noStart:true, rootNode: someNode });

			// determine the root node and options based on the passed arguments.
			var root;
			if(!options && rootNode && rootNode.rootNode){
				options = rootNode;
				root = options.rootNode;
			}else if(rootNode && dlang.isObject(rootNode) && !("nodeType" in rootNode)){
				options = rootNode;
			}else{
				root = rootNode;
			}
			root = root ? dom.byId(root) : dwindow.body();

			options = options || {};

			var mixin = options.template ? { template: true } : {},
				instances = [],
				self = this;

			// First scan for any <script type=dojo/require> nodes, and execute.
			// Then scan for all nodes with data-dojo-type, and load any unloaded modules.
			// Then build the object instances.  Add instances to already existing (but empty) instances[] array,
			// which may already have been returned to caller.  Also, use otherwise to collect and throw any errors
			// that occur during the parse().
			var p =
				this._scanAmd(root, options).then(function(){
					return self.scan(root, options);
				}).then(function(parsedNodes){
					return self._instantiate(parsedNodes, mixin, options, true);
				}).then(function(_instances){
					// Copy the instances into the instances[] array we declared above, and are accessing as
					// our return value.
					return instances = instances.concat(_instances);
				}).otherwise(function(e){
					// TODO Modify to follow better pattern for promise error management when available
					console.error("dojo/parser::parse() error", e);
					throw e;
				});

			// Blend the array with the promise
			dlang.mixin(instances, p);
			return instances;
		}
	};

	if( 1 ){
		dojo.parser = parser;
	}

	// Register the parser callback. It should be the first callback
	// after the a11y test.
	if(config.parseOnLoad){
		ready(100, parser, "parse");
	}

	return parser;
});

},
'dojo/_base/url':function(){
define(["./kernel"], function(dojo){
	// module:
	//		dojo/url

	var
		ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$"),
		ire = new RegExp("^((([^\\[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^\\[:]*))(:([0-9]+))?$"),
		_Url = function(){
			var n = null,
				_a = arguments,
				uri = [_a[0]];
			// resolve uri components relative to each other
			for(var i = 1; i<_a.length; i++){
				if(!_a[i]){ continue; }

				// Safari doesn't support this.constructor so we have to be explicit
				// FIXME: Tracked (and fixed) in Webkit bug 3537.
				//		http://bugs.webkit.org/show_bug.cgi?id=3537
				var relobj = new _Url(_a[i]+""),
					uriobj = new _Url(uri[0]+"");

				if(
					relobj.path == "" &&
					!relobj.scheme &&
					!relobj.authority &&
					!relobj.query
				){
					if(relobj.fragment != n){
						uriobj.fragment = relobj.fragment;
					}
					relobj = uriobj;
				}else if(!relobj.scheme){
					relobj.scheme = uriobj.scheme;

					if(!relobj.authority){
						relobj.authority = uriobj.authority;

						if(relobj.path.charAt(0) != "/"){
							var path = uriobj.path.substring(0,
								uriobj.path.lastIndexOf("/") + 1) + relobj.path;

							var segs = path.split("/");
							for(var j = 0; j < segs.length; j++){
								if(segs[j] == "."){
									// flatten "./" references
									if(j == segs.length - 1){
										segs[j] = "";
									}else{
										segs.splice(j, 1);
										j--;
									}
								}else if(j > 0 && !(j == 1 && segs[0] == "") &&
									segs[j] == ".." && segs[j-1] != ".."){
									// flatten "../" references
									if(j == (segs.length - 1)){
										segs.splice(j, 1);
										segs[j - 1] = "";
									}else{
										segs.splice(j - 1, 2);
										j -= 2;
									}
								}
							}
							relobj.path = segs.join("/");
						}
					}
				}

				uri = [];
				if(relobj.scheme){
					uri.push(relobj.scheme, ":");
				}
				if(relobj.authority){
					uri.push("//", relobj.authority);
				}
				uri.push(relobj.path);
				if(relobj.query){
					uri.push("?", relobj.query);
				}
				if(relobj.fragment){
					uri.push("#", relobj.fragment);
				}
			}

			this.uri = uri.join("");

			// break the uri into its main components
			var r = this.uri.match(ore);

			this.scheme = r[2] || (r[1] ? "" : n);
			this.authority = r[4] || (r[3] ? "" : n);
			this.path = r[5]; // can never be undefined
			this.query = r[7] || (r[6] ? "" : n);
			this.fragment	 = r[9] || (r[8] ? "" : n);

			if(this.authority != n){
				// server based naming authority
				r = this.authority.match(ire);

				this.user = r[3] || n;
				this.password = r[4] || n;
				this.host = r[6] || r[7]; // ipv6 || ipv4
				this.port = r[9] || n;
			}
		};
	_Url.prototype.toString = function(){ return this.uri; };

	return dojo._Url = _Url;
});

},
'dojo/promise/all':function(){
define([
	"../_base/array",
	"../Deferred",
	"../when"
], function(array, Deferred, when){
	"use strict";

	// module:
	//		dojo/promise/all

	var some = array.some;

	return function all(objectOrArray){
		// summary:
		//		Takes multiple promises and returns a new promise that is fulfilled
		//		when all promises have been fulfilled.
		// description:
		//		Takes multiple promises and returns a new promise that is fulfilled
		//		when all promises have been fulfilled. If one of the promises is rejected,
		//		the returned promise is also rejected. Canceling the returned promise will
		//		*not* cancel any passed promises.
		// objectOrArray: Object|Array?
		//		The promise will be fulfilled with a list of results if invoked with an
		//		array, or an object of results when passed an object (using the same
		//		keys). If passed neither an object or array it is resolved with an
		//		undefined value.
		// returns: dojo/promise/Promise

		var object, array;
		if(objectOrArray instanceof Array){
			array = objectOrArray;
		}else if(objectOrArray && typeof objectOrArray === "object"){
			object = objectOrArray;
		}

		var results;
		var keyLookup = [];
		if(object){
			array = [];
			for(var key in object){
				if(Object.hasOwnProperty.call(object, key)){
					keyLookup.push(key);
					array.push(object[key]);
				}
			}
			results = {};
		}else if(array){
			results = [];
		}

		if(!array || !array.length){
			return new Deferred().resolve(results);
		}

		var deferred = new Deferred();
		deferred.promise.always(function(){
			results = keyLookup = null;
		});
		var waiting = array.length;
		some(array, function(valueOrPromise, index){
			if(!object){
				keyLookup.push(index);
			}
			when(valueOrPromise, function(value){
				if(!deferred.isFulfilled()){
					results[keyLookup[index]] = value;
					if(--waiting === 0){
						deferred.resolve(results);
					}
				}
			}, deferred.reject);
			return deferred.isFulfilled();
		});
		return deferred.promise;	// dojo/promise/Promise
	};
});

},
'dojo/date/stamp':function(){
define(["../_base/lang", "../_base/array"], function(lang, array){

// module:
//		dojo/date/stamp

var stamp = {
	// summary:
	//		TODOC
};
lang.setObject("dojo.date.stamp", stamp);

// Methods to convert dates to or from a wire (string) format using well-known conventions

stamp.fromISOString = function(/*String*/ formattedString, /*Number?*/ defaultTime){
	// summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
	//
	// description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		[RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
	//		Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
	//		The following combinations are valid:
	//
	//		- dates only
	//			- yyyy
	//			- yyyy-MM
	//			- yyyy-MM-dd
	//		- times only, with an optional time zone appended
	//			- THH:mm
	//			- THH:mm:ss
	//			- THH:mm:ss.SSS
	//		- and "datetimes" which could be any combination of the above
	//
	//		timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return null.  Arguments which are out of bounds will be handled
	//		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//		Only years between 100 and 9999 are supported.
  	// formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	// defaultTime:
	//		Used for defaults for fields omitted in the formattedString.
	//		Uses 1970-01-01T00:00:00.0Z by default.

	if(!stamp._isoRegExp){
		stamp._isoRegExp =
//TODO: could be more restrictive and check for 00-59, etc.
			/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
	}

	var match = stamp._isoRegExp.exec(formattedString),
		result = null;

	if(match){
		match.shift();
		if(match[1]){match[1]--;} // Javascript Date months are 0-based
		if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

		if(defaultTime){
			// mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
			defaultTime = new Date(defaultTime);
			array.forEach(array.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
				return defaultTime["get" + prop]();
			}), function(value, index){
				match[index] = match[index] || value;
			});
		}
		result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0); //TODO: UTC defaults
		if(match[0] < 100){
			result.setFullYear(match[0] || 1970);
		}

		var offset = 0,
			zoneSign = match[7] && match[7].charAt(0);
		if(zoneSign != 'Z'){
			offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
			if(zoneSign != '-'){ offset *= -1; }
		}
		if(zoneSign){
			offset -= result.getTimezoneOffset();
		}
		if(offset){
			result.setTime(result.getTime() + offset * 60000);
		}
	}

	return result; // Date or null
};

/*=====
var __Options = {
	// selector: String
	//		"date" or "time" for partial formatting of the Date object.
	//		Both date and time will be formatted by default.
	// zulu: Boolean
	//		if true, UTC/GMT is used for a timezone
	// milliseconds: Boolean
	//		if true, output milliseconds
};
=====*/

stamp.toISOString = function(/*Date*/ dateObject, /*__Options?*/ options){
	// summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	// description:
	//		When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
	//		The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
	//		Does not check bounds.  Only years between 100 and 9999 are supported.
	//
	// dateObject:
	//		A Date object

	var _ = function(n){ return (n < 10) ? "0" + n : n; };
	options = options || {};
	var formattedDate = [],
		getter = options.zulu ? "getUTC" : "get",
		date = "";
	if(options.selector != "time"){
		var year = dateObject[getter+"FullYear"]();
		date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
		var millis = dateObject[getter+"Milliseconds"]();
		if(options.milliseconds){
			time += "."+ (millis < 100 ? "0" : "") + _(millis);
		}
		if(options.zulu){
			time += "Z";
		}else if(options.selector != "time"){
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") +
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
};

return stamp;
});

}}});
require([
	"dojo/_base/lang",
	"dojo/ready",
	"dojo/dom",
	"dojo/_base/connect",
	"dojo/_base/Color", 
	"dojox/dgauges/CircularGauge",
	"dojox/dgauges/LinearScaler",
	"dojox/dgauges/CircularScale",
	"dojox/dgauges/CircularValueIndicator",
	"dojox/dgauges/CircularRangeIndicator",
	"dojox/dgauges/TextIndicator",	
	"dojox/dgauges/components/utils",
	"dojox/dgauges/components/black/CircularLinearGauge",	
	"dojox/dgauges/components/black/SemiCircularLinearGauge",	
	"dojox/dgauges/components/black/HorizontalLinearGauge",
	"dojo/parser"], 
	function(lang, ready, dom, connect, Color, 
			CircularGauge, LinearScaler, CircularScale, CircularValueIndicator, CircularRangeIndicator, TextIndicator, utils){

		ready(function(){
			
			var gauge = new CircularGauge({
				value: 20,
				font: {
					family: "Arial",
					style: "normal",
					size: "14pt",
					color: "white"
				}
			},dom.byId("g1"));
			// Draw background
			gauge.addElement("background", function(g){
				g.createPath({path: "M372.8838 205.5688 C372.9125 204.4538 372.93 194.135 372.94 185.6062 C372.4475 83.0063 289.1138 -0 186.4063 0.035 C83.7 0.0713 0.4225 83.1325 0 185.7325 C0.01 194.2175 0.0275 204.4638 0.0563 205.5763 C0.235 212.3488 5.7763 217.7462 12.5525 217.7462 L360.3888 217.7462 C367.1663 217.7462 372.71 212.3438 372.8838 205.5688"
				}).setFill("black");
			});
			// Scale
			var scale = new CircularScale({
				originX: 186.46999,
				originY: 184.74814,			
				radius: 140,
				startAngle: -180,
				endAngle:0,
				labelPosition:"outside",
				orientation:"clockwise",
				scaler:new LinearScaler(),
				labelGap: 8,
				tickShapeFunc: function(group, scale, tickItem){
					return group.createLine({
						x1: 0,
						y1: 0,
						x2: tickItem.isMinor ? 0 : 5,
						y2: 0
					}).setStroke({
						color: "white",
						width: 1
					});
				}				
			});
			gauge.addElement("scale", scale);
			// A range indicator that goes from 0 to 100
			indicator = new CircularRangeIndicator({
				value: 100,
				radius: 135,
				startThickness:50,
				endThickness:50,
				fill:"white"
			});
			scale.addIndicator("indicatorBg", indicator);
			// An interactive range indicator that shows the current value
			indicator = new CircularRangeIndicator({
				value: gauge.value,
				radius: 125,
				startThickness:30,
				endThickness:30,
				fill:"gray",
				interactionArea:"gauge",
				interactionMode:"mouse"
			});
			scale.addIndicator("indicator", indicator);
			// Indicator Text
			var indicatorText = new TextIndicator({
				indicator: indicator,
				x: 186,
				y: 184,
				font: {
					family: "Arial",
					style: "normal",
					variant: "small-caps",
					weight: "bold",
					size: "36pt"
				},
				color: "gray"
			});
			gauge.addElement("indicatorText", indicatorText);
			gauge.startup();			
			gauge.resize(250,200);

			// 2nd custom gauge		
			gauge = new CircularGauge({
				value: 0,
				font: {
					family: "Arial",
					style: "normal",
					size: "8pt",
					color: "white"
				}
			},dom.byId("g3"));
			// an ghost shape just to set the global size of the gauge
			gauge.addElement("background", function(g){
				g.createRect({width:200, height:180});
			});
			// Scale
			scale = new CircularScale({
				originX: 100,
				originY: 150,
				radius: 130,
				startAngle: -120,
				endAngle: -60,
				labelPosition: "outside",
				orientation: "clockwise",
				scaler: new LinearScaler({
					minimum: -30, 
					maximum: 30,
					majorTickInterval: 10
				}),
				labelGap: 8,
				tickShapeFunc: function(group, scale, tickItem){
					return group.createLine({
						x1: 0,
						y1: 0,
						x2: tickItem.isMinor ? 0 : 5,
						y2: 0
					}).setStroke({
						color: "white",
						width: 1
					});
				}				
			});
			gauge.addElement("scale", scale);
			// the needle
			indicator = new CircularValueIndicator({
				interactionArea: "gauge",
				value: 0,
				indicatorShapeFunc: function(group, indicator){
					var g = group.createGroup();
					g.createPolyline([0, -12, indicator.scale.radius - 2, 0, 0, 12, 0, -12]).setStroke({
						color: [70, 70, 70],
						width: 1
					}).setFill("white");
					g.createEllipse({rx:15, ry:15}).setFill("rgb(200,200,200)").setStroke("rgb(70, 70, 70)");
					return g;
				}
			});
			scale.addIndicator("indicator", indicator);
			gauge.startup();
			gauge.resize(200,180);
		});
	}
)
