require({cache:{
'demos/shippingRoutes/src/Ecr':function(){
define(["dojo/_base/kernel",
		"dojo/_base/declare",
		"dojo/_base/html",
		"dojo/_base/array",
		"dojo/_base/lang",
		"dojo/dom",
		"dojox/geo/openlayers/Map",
		"dojox/geo/openlayers/GfxLayer",
		"dojo/data/ItemFileReadStore",
		"./PortRenderer",
		"./LegsRenderer"], 
		function(dojo, declare, html, arr, lang, dom, Map, GfxLayer,
					ItemFileReadStore, PortRenderer, LegsRenderer){

	return declare(null, {
		constructor: function(){

			var map = new Map("map");

			map.fitTo([-160, 70, 160, -70]);

			this._map = map;

			layer = new GfxLayer("legs");
			this._legLayer = layer;
			map.addLayer(layer);

			layer = new GfxLayer("ports");
			this._portLayer = layer;
			map.addLayer(layer);

			this.loadData("data/ecr.json");
		},

		fitTo: function(where){
			this._map.fitTo(where);
		},

		clearLayer: function(layer){
			var fa = layer.getFeatures();
			layer.removeFeature(fa);
		},

		clearEcr: function(event){
			var layer = this._portLayer;
			this.clearLayer(layer);
			layer = this._legLayer;
			this.clearLayer(layer);
			this.fillPortChooser(null);
		},

		setDataSet: function(name){
			var o = dom.byId(name);
			var ds = o.value;

			var layer = this._portLayer;
			this.clearLayer(layer);

			layer = this._legLayer;
			this.clearLayer(layer);

			this.loadData(ds);

		},

		log: function(o){
			console.log(o);
		},

		loadError: function(){
			this.log(arguments[0]);
		},

		_portStyle: [{
			type: "circle",
			depth: "{radius}",
			radius: function(ctx){
				var realValue = ctx.store.getValue(this, "offer");
				var ret = Math.max(1, Math.log(realValue));
				return 3 * ret;
			},
			stroke: {
				color: "#4c9a06",
				width: 1
			}
		}, {
			type: "circle",
			depth: "{radius}",
			radius: function(ctx){
				var realValue = ctx.store.getValue(this, "demand");
				return 3 * Math.max(1, Math.log(realValue));
			},
			stroke: {
				color: "#bb0000",
				width: 1
			}
		}],

		gotPorts: function(items, request){
			this.log("got ports " + items.length);
			var store = request.store;
			var ctx = {
				store: store
			};
			var renderer = new PortRenderer(this._portStyle, ctx);
			var layer = this._portLayer;

			arr.forEach(items, function(item, index, array){
				var f = renderer.render(item);
				if (f != null)
					layer.addFeature(f);
			});

			this.fillPortChooser(items);

			this.portChange('portChooser');

			layer.redraw();
		},

		_legsStyle: {
			type: "polyline",
			stroke: {
				color: [255, 165, 0]
			}
		},

		gotLegs: function(items, request){
			//		this.log("got legs " + items.length);
			var ctx = {
				store: request.store
			};
			var renderer = new LegsRenderer(this._legsStyle, ctx);
			renderer.setGeodetic(true);
			var layer = this._legLayer;
			arr.forEach(items, function(item, index, array){
				var f = renderer.render(item);
				if (f != null)
					layer.addFeature(f);
			});
			layer.redraw();
		},

		loadData: function(dataSet){
			//		this.log("load " + dataSet);
			var store = new ItemFileReadStore({
				url: dataSet,
				urlPreventCache: true
			});

			store.fetch({
				query: {
					type: "legs"
				},
				onComplete: lang.hitch(this, this.gotLegs),
				onError: lang.hitch(this, this.loadError),
				queryOptions: {
					deep: true
				}
			});

			store.fetch({
				query: {
					type: "port"
				},
				onComplete: lang.hitch(this, this.gotPorts),
				onError: lang.hitch(this, this.loadError)
			});

		},

		regionChange: function(event){
			this.fitTo(event.currentTarget.value);
		},

		portChange: function(name){
			var o = dom.byId(name);
			this.fitTo(o.value);
		},

		fillPortChooser: function(items){
			var ps = dom.byId("portChooser");
			var opts = ps.options;
			var ws = '{"position": [0, 0], "extent": 70}';
			if (items == null) {
				opts.length = 1;
				opts[0] = new Option("World", ws);
			} else {
				opts.length = items.length + 1;
				opts[0] = new Option("World", ws);
				var s = '{"position": [%lo, %la], "extent": 0.2}';
				for ( var i = 0; i < items.length; i++) {
					var item = items[i];
					var lon = parseFloat(item.longitude);
					var lat = parseFloat(item.latitude);
					var os = s.replace("%lo", lon).replace("%la", lat);
					opts[i + 1] = new Option(item.name, os);
				}
			}
		},

		toggleLayerVisibility: function(name){
			var cb = dom.byId(name);
			var a = this._map.getLayer('name', name);
			arr.forEach(a, function(item, index, array){
				item.olLayer.setVisibility(cb.checked);
			});
		}
	});
});

},
'dojox/geo/openlayers/Map':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/json",
	"dojo/dom",
	"dojo/dom-style",
	"./_base",
	"./TouchInteractionSupport",
	"./Layer",
	"./Patch"
], function(kernel, declare, lang, array, json, dom, style, openlayers, TouchInteractionSupport, Layer, Patch){

	kernel.experimental("dojox.geo.openlayers.Map");


	Patch.patchGFX();

	/*=====
	dojox.geo.openlayers.__MapArgs = {
		// summary:
		//		The keyword arguments that can be passed in a Map constructor.
		// baseLayerType: String
		//		 type of the base layer. Can be any of
		//
		//		- `dojox.geo.openlayers.BaseLayerType.OSM`: Open Street Map base layer
		//		- `dojox.geo.openlayers.BaseLayerType.WMS`: Web Map Service layer
		//		- `dojox.geo.openlayers.BaseLayerType.GOOGLE`: Google layer
		//		- `dojox.geo.openlayers.BaseLayerType.VIRTUAL_EARTH`: Virtual Earth layer
		//		- `dojox.geo.openlayers.BaseLayerType.BING`: Bing layer
		//		- `dojox.geo.openlayers.BaseLayerType.YAHOO`: Yahoo layer
		//		- `dojox.geo.openlayers.BaseLayerType.ARCGIS`: ESRI ArgGIS layer
		// baseLayerName: String
		//		The name of the base layer.
		// baseLayerUrl: String
		//		Some layer may need an url such as Web Map Server.
		// baseLayerOptions: String
		//		Additional specific options passed to OpensLayers layer, such as The list of layer to display, for Web Map Server layer.
	};
	=====*/

	return declare("dojox.geo.openlayers.Map", null, {
		// summary:
		//		A map viewer based on the OpenLayers library.
		//
		// description:
		//		The `dojox.geo.openlayers.Map` object allows to view maps from various map providers. 
		//		It encapsulates  an `OpenLayers.Map` object on which most operations are delegated.
		//		GFX layers can be added to display GFX georeferenced shapes as well as Dojo widgets.
		//		Parameters can be passed as argument at construction time to define the base layer
		//		type and the base layer parameters such as url or options depending on the type
		//		specified. These parameters can be any of:
		//
		//		_baseLayerType_: type of the base layer. Can be any of:
		//		
		//		- `dojox.geo.openlayers.BaseLayerType.OSM`: Open Street Map base layer
		//		- `dojox.geo.openlayers.BaseLayerType.WMS`: Web Map Service layer
		//		- `dojox.geo.openlayers.BaseLayerType.GOOGLE`: Google layer
		//		- `dojox.geo.openlayers.BaseLayerType.VIRTUAL_EARTH`: Virtual Earth layer
		//		- `dojox.geo.openlayers.BaseLayerType.BING`: Bing layer
		//		- `dojox.geo.openlayers.BaseLayerType.YAHOO`: Yahoo layer
		//		- `dojox.geo.openlayers.BaseLayerType.ARCGIS`: ESRI ArgGIS layer
		//		
		//		Note that access to commercial server such as Google, Virtual Earth or Yahoo may need specific licencing.
		//		
		//		The parameters value also include:
		//		
		//		- `baseLayerName`: The name of the base layer.
		//		- `baseLayerUrl`: Some layer may need an url such as Web Map Server
		//		- `baseLayerOptions`: Additional specific options passed to OpensLayers layer,
		//		  such as The list of layer to display, for Web Map Server layer.
		//
		// example:
		//	|	var map = new dojox.geo.openlayers.widget.Map(div, {
		//	|		baseLayerType: dojox.geo.openlayers.BaseLayerType.OSM,
		//	|		baseLayerName: 'Open Street Map Layer'
		//	|	});

		// olMap: OpenLayers.Map
		//		The underlying OpenLayers.Map object.
		//		Should be accessed on read mode only.
		olMap: null,

		_tp: null,

		constructor: function(div, options){
			// summary:
			//		Constructs a new Map object
			if(!options){
				options = {};
			}

			div = dom.byId(div);

			this._tp = {
				x: 0,
				y: 0
			};

			var opts = options.openLayersMapOptions;

			if(!opts){
				opts = {
					controls: [new OpenLayers.Control.ScaleLine({
						maxWidth: 200
					}), new OpenLayers.Control.Navigation()]
				};
			}
			if(options.accessible){
				var kbd = new OpenLayers.Control.KeyboardDefaults();
				if(!opts.controls){
					opts.controls = [];
				}
				opts.controls.push(kbd);
			}
			var baseLayerType = options.baseLayerType;
			if(!baseLayerType){
				baseLayerType = openlayers.BaseLayerType.OSM;
			}
			var map = new OpenLayers.Map(div, opts);
			this.olMap = map;

			this._layerDictionary = {
				olLayers: [],
				layers: []
			};

			if(options.touchHandler){
				this._touchControl = new TouchInteractionSupport(map);
			}

			var base = this._createBaseLayer(options);
			this.addLayer(base);

			this.initialFit(options);
		},

		initialFit: function(params){
			// summary:
			//		Performs an initial fit to contents.
			// tags:
			//		protected
			var o = params.initialLocation;
			if(!o){
				o = [-160, 70, 160, -70];
			}
			this.fitTo(o);
		},

		setBaseLayerType: function(type){
			// summary:
			//		Set the base layer type, replacing the existing base layer
			// type: dojox/geo/openlayers.BaseLayerType
			//		base layer type
			// returns:
			//		The newly created layer.
			if(type == this.baseLayerType){
				return null; // Layer
			}

			var o = null;
			if(typeof type == "string"){
				o = {
					baseLayerName: type,
					baseLayerType: type
				};
				this.baseLayerType = type;
			}else if(typeof type == "object"){
				o = type;
				this.baseLayerType = o.baseLayerType;
			}
			var bl = null;
			if(o != null){
				bl = this._createBaseLayer(o);
				if(bl != null){
					var olm = this.olMap;
					var ob = olm.getZoom();
					var oc = olm.getCenter();
					var recenter = !!oc && !!olm.baseLayer && !!olm.baseLayer.map;

					if(recenter){
						var proj = olm.getProjectionObject();
						if(proj != null){
							oc = oc.transform(proj, openlayers.EPSG4326);
						}
					}
					var old = olm.baseLayer;
					if(old != null){
						var l = this._getLayer(old);
						this.removeLayer(l);
					}
					if(bl != null){
						this.addLayer(bl);
					}
					if(recenter){
						proj = olm.getProjectionObject();
						if(proj != null){
							oc = oc.transform(openlayers.EPSG4326, proj);
						}
						olm.setCenter(oc, ob);
					}
				}
			}
			return bl;
		},

		getBaseLayerType: function(){
			// summary:
			//		Returns the base layer type.
			// returns:
			//		The current base layer type.
			return this.baseLayerType; // openlayers.BaseLayerType
		},

		getScale: function(geodesic){
			// summary:
			//		Returns the current scale
			// geodesic: Boolean
			//		Tell if geodesic calculation should be performed. If set to
			//		true, the scale will be calculated based on the horizontal size of the
			//		pixel in the center of the map viewport.
			var scale = null;
			var om = this.olMap;
			if(geodesic){
				var units = om.getUnits();
				if(!units){
					return null;	// Number
				}
				var inches = OpenLayers.INCHES_PER_UNIT;
				scale = (om.getGeodesicPixelSize().w || 0.000001) * inches["km"] * OpenLayers.DOTS_PER_INCH;
			}else{
				scale = om.getScale();
			}
			return scale;	// Number
		},

		getOLMap: function(){
			// summary:
			//		gets the underlying OpenLayers map object.
			// returns:
			//		The underlying OpenLayers map object.
			return this.olMap;	// OpenLayers.Map
		},

		_createBaseLayer: function(params){
			// summary:
			//		Creates the base layer.
			// tags:
			//		private
			var base = null;
			var type = params.baseLayerType;
			var url = params.baseLayerUrl;
			var name = params.baseLayerName;
			var options = params.baseLayerOptions;

			if(!name){
				name = type;
			}
			if(!options){
				options = {};
			}
			switch(type){
				case openlayers.BaseLayerType.OSM:
					options.transitionEffect = "resize";
					//				base = new OpenLayers.Layer.OSM(name, url, options);
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.OSM(name, url, options)
					});
				break;
				case openlayers.BaseLayerType.WMS:
					if(!url){
						url = "http://labs.metacarta.com/wms/vmap0";
						if(!options.layers){
							options.layers = "basic";
						}
					}
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.WMS(name, url, options, {
							transitionEffect: "resize"
						})
					});
				break;
				case openlayers.BaseLayerType.GOOGLE:
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.Google(name, options)
					});
				break;
				case openlayers.BaseLayerType.VIRTUAL_EARTH:
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.VirtualEarth(name, options)
					});
				break;
				case openlayers.BaseLayerType.YAHOO:
					//				base = new OpenLayers.Layer.Yahoo(name);
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.Yahoo(name, options)
					});
				break;
				case openlayers.BaseLayerType.ARCGIS:
					if(!url){
						url = "http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer/export";
					}
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.ArcGIS93Rest(name, url, options, {})
					});

				break;
			}

			if(base == null){
				if(type instanceof OpenLayers.Layer){
					base = type;
				}else{
					options.transitionEffect = "resize";
					base = new Layer(name, {
						olLayer: new OpenLayers.Layer.OSM(name, url, options)
					});
					this.baseLayerType = openlayers.BaseLayerType.OSM;
				}
			}

			return base;
		},

		removeLayer: function(layer){
			// summary:
			//		Remove the specified layer from the map.
			// layer: Layer
			//		The layer to remove from the map.
			var om = this.olMap;
			var i = array.indexOf(this._layerDictionary.layers, layer);
			if(i > 0){
				this._layerDictionary.layers.splice(i, 1);
			}
			var oll = layer.olLayer;
			var j = array.indexOf(this._layerDictionary.olLayers, oll);
			if(j > 0){
				this._layerDictionary.olLayers.splice(i, j);
			}
			om.removeLayer(oll, false);
		},

		layerIndex: function(layer, index){
			// summary:
			//		Set or retrieve the layer index.
			// description:
			//		Set or get the layer index, that is the z-order of the layer.
			//		if the index parameter is provided, the layer index is set to
			//		this value. If the index parameter is not provided, the index of 
			//		the layer is returned.
			// layer: Layer
			//		the layer to retrieve the index.
			// index: int?
			//		index of the layer
			// returns:
			//		the index of the layer.
			var olm = this.olMap;
			if(!index){
				return olm.getLayerIndex(layer.olLayer);
			}
			//olm.raiseLayer(layer.olLayer, index);
			olm.setLayerIndex(layer.olLayer, index);

			this._layerDictionary.layers.sort(function(l1, l2){
				return olm.getLayerIndex(l1.olLayer) - olm.getLayerIndex(l2.olLayer);
			});
			this._layerDictionary.olLayers.sort(function(l1, l2){
				return olm.getLayerIndex(l1) - olm.getLayerIndex(l2);
			});

			return index; // Number
		},

		addLayer: function(layer){
			// summary:
			//		Add the specified layer to the map.
			// layer: Layer
			//		The layer to add to the map.
			layer.dojoMap = this;
			var om = this.olMap;
			var ol = layer.olLayer;
			this._layerDictionary.olLayers.push(ol);
			this._layerDictionary.layers.push(layer);
			om.addLayer(ol);
			layer.added();
		},

		_getLayer: function(/*OpenLayer.Layer */ol){
			// summary:
			//		Retrieve the dojox.geo.openlayer.Layer from the OpenLayer.Layer
			// tags:
			//		private
			var i = array.indexOf(this._layerDictionary.olLayers, ol);
			if(i != -1){
				return this._layerDictionary.layers[i];
			}
			return null;
		},

		getLayer: function(property, value){
			// summary:
			//		Returns the layer whose property matches the value.
			// property: String
			//		The property to check
			// value: Object
			//		The value to match
			// returns:
			//		The layer(s) matching the property's value. Since multiple layers
			//		match the property's value the return value is an array. 
			// example:
			//		var layers = map.getLayer("name", "Layer Name");
			var om = this.olMap;
			var ols = om.getBy("layers", property, value);
			var ret = new Array(); //[];
			array.forEach(ols, function(ol){
				ret.push(this._getLayer(ol));
			}, this);
			return ret; // Layer[]
		},

		getLayerCount: function(){
			// summary:
			//		Returns the count of layers of this map.
			// returns:
			//		The number of layers of this map. 
			var om = this.olMap;
			if(om.layers == null){
				return 0;
			}
			return om.layers.length; // Number
		},

		fitTo: function(o){
			// summary:
			//		Fits the map on a point,or an area
			// description:
			//		Fits the map on the point or extent specified as parameter. 
			// o: Object
			//		Object with key values fit parameters or a JSON string.
			// example:
			//		Examples of arguments passed to the fitTo function:
			//	|	null
			//		The map is fit on full extent
			//
			//	|	{
			//	|		bounds: [ulx, uly, lrx, lry]
			//	|	}
			//		The map is fit on the specified bounds expressed as decimal degrees latitude and longitude.
			//		The bounds are defined with their upper left and lower right corners coordinates.
			// 
			//	|	{
			//	|		position: [longitude, latitude],
			//	|		extent: degrees
			//	|	}
			//		The map is fit on the specified position showing the extent `<extent>` around
			//		the specified center position.

			var map = this.olMap;
			var from = openlayers.EPSG4326;

			if(o == null){
				var c = this.transformXY(0, 0, from);
				map.setCenter(new OpenLayers.LonLat(c.x, c.y));
				return;
			}
			var b = null;
			if(typeof o == "string"){
				var j = json.fromJson(o);
			}else{
				j = o;
			}
			var ul;
			var lr;
			if(j.hasOwnProperty("bounds")){
				var a = j.bounds;
				b = new OpenLayers.Bounds();
				ul = this.transformXY(a[0], a[1], from);
				b.left = ul.x;
				b.top = ul.y;
				lr = this.transformXY(a[2], a[3], from);
				b.right = lr.x;
				b.bottom = lr.y;
			}
			if(b == null){
				if(j.hasOwnProperty("position")){
					var p = j.position;
					var e = j.hasOwnProperty("extent") ? j.extent : 1;
					if(typeof e == "string"){
						e = parseFloat(e);
					}
					b = new OpenLayers.Bounds();
					ul = this.transformXY(p[0] - e, p[1] + e, from);
					b.left = ul.x;
					b.top = ul.y;
					lr = this.transformXY(p[0] + e, p[1] - e, from);
					b.right = lr.x;
					b.bottom = lr.y;
				}
			}
			if(b == null){
				if(o.length == 4){
					b = new OpenLayers.Bounds();
					// TODO Choose the correct method
					if(false){
						b.left = o[0];
						b.top = o[1];

						b.right = o[2];
						b.bottom = o[3];
					}else{
						ul = this.transformXY(o[0], o[1], from);
						b.left = ul.x;
						b.top = ul.y;
						lr = this.transformXY(o[2], o[3], from);
						b.right = lr.x;
						b.bottom = lr.y;
					}
				}
			}
			if(b != null){
				map.zoomToExtent(b, true);
			}
		},

		transform: function(p, from, to){
			// summary:
			//		Transforms the point passed as argument, expressed in the <em>from</em> 
			//		coordinate system to the map coordinate system.
			// description:
			//		Transforms the point passed as argument without modifying it. The point is supposed to be expressed
			//		in the <em>from</em> coordinate system and is transformed to the map coordinate system.
			// p: Object {x, y}
			//		The point to transform
			// from: OpenLayers.Projection
			//		The projection in which the point is expressed.
			return this.transformXY(p.x, p.y, from, to);
		},

		transformXY: function(x, y, from, to){
			// summary:
			//		Transforms the coordinates passed as argument, expressed in the <em>from</em> 
			//		coordinate system to the map coordinate system.
			// description:
			//		Transforms the coordinates passed as argument. The coordinate are supposed to be expressed
			//		in the <em>from</em> coordinate system and are transformed to the map coordinate system.
			// x: Number
			//		The longitude coordinate to transform.
			// y: Number
			//		The latitude coordinate to transform.
			// from: OpenLayers.Projection?
			//		The projection in which the point is expressed, or EPSG4326 is not specified.
			// to: OpenLayers.Projection?
			//		The projection in which the point is converted to. In not specifed, the map projection is used.
			// returns:
			//		The transformed coordinate as an {x,y} Object.

			var tp = this._tp;
			tp.x = x;
			tp.y = y;
			if(!from){
				from = openlayers.EPSG4326;
			}
			if(!to){
				to = this.olMap.getProjectionObject();
			}
			tp = OpenLayers.Projection.transform(tp, from, to);
			return tp; // Object
		}

	});

});

},
'dojox/geo/openlayers/_base':function(){
define(["dojo/_base/lang"], function(lang){
	
	var openlayers = lang.getObject("dojox.geo.openlayers", true);
	/*===== openlayers = dojox.geo.openlayers; =====*/
	
	openlayers.BaseLayerType = {
		// summary:
		//		Defines the base layer types to be used at Map construction time or
		//		with the setBaseLayerType function.
		// description:
		//		This object defines the base layer types to be used at Map construction
		//		time or with the setBaseLayerType function.

		// OSM: String
		//		The Open Street Map base layer type selector.
		OSM: "OSM",

		// WMS: String
		//		The Web Map Server base layer type selector.
		WMS: "WMS",

		// GOOGLE: String
		//		The Google base layer type selector.
		GOOGLE: "Google",

		// VIRTUAL_EARTH: String
		//		The Virtual Earth base layer type selector.
		VIRTUAL_EARTH: "VirtualEarth",

		// BING: String
		//		Same as Virtual Earth
		BING: "VirtualEarth",

		// YAHOO: String
		//		The Yahoo base layer type selector.
		YAHOO: "Yahoo",

		// ARCGIS: String
		//		The ESRI ARCGis base layer selector.
		ARCGIS: "ArcGIS"
	};

	openlayers.EPSG4326 = new OpenLayers.Projection("EPSG:4326");

	var re = /^\s*(\d{1,3})[D°]\s*(\d{1,2})[M']\s*(\d{1,2}\.?\d*)\s*(S|"|'')\s*([NSEWnsew]{0,1})\s*$/i;
	openlayers.parseDMS = function(v, toDecimal){
		// summary:
		//		Parses the specified string and returns degree minute second or decimal degree.
		// description:
		//		Parses the specified string and returns degree minute second or decimal degree.
		// v: String
		//		The string to parse
		// toDecimal: Boolean
		//		Specifies if the result should be returned in decimal degrees or in an array
		//		containing the degrees, minutes, seconds values.
		// returns: Float|Array
		//		the parsed value in decimal degrees or an array containing the degrees, minutes, seconds values.

		var res = re.exec(v);
		if(res == null || res.length < 5){
			return parseFloat(v);
		}
		var d = parseFloat(res[1]);
		var m = parseFloat(res[2]);
		var s = parseFloat(res[3]);
		var nsew = res[5];
		if(toDecimal){
			var lc = nsew.toLowerCase();
			var dd = d + (m + s / 60.0) / 60.0;
			if(lc == "w" || lc == "s"){
				dd = -dd;
			}
			return dd;
		}
		return [d, m, s, nsew];
	};
	
	return openlayers;
});

},
'dojox/geo/openlayers/TouchInteractionSupport':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/_base/html",
	"dojo/_base/lang",
	"dojo/_base/event",
	"dojo/_base/window"
], function(declare, connect, html, lang, event, win){

	return declare("dojox.geo.openlayers.TouchInteractionSupport", null, {
		// summary:
		//		class to handle touch interactions on a OpenLayers.Map widget
		// tags:
		//		private

		_map: null,
		_centerTouchLocation: null,
		_touchMoveListener: null,
		_touchEndListener: null,
		_initialFingerSpacing: null,
		_initialScale: null,
		_tapCount: null,
		_tapThreshold: null,
		_lastTap: null,

		constructor: function(map){
			// summary:
			//		Constructs a new TouchInteractionSupport instance
			// map: OpenLayers.Map
			//		the Map widget this class provides touch navigation for.
			this._map = map;
			this._centerTouchLocation = new OpenLayers.LonLat(0, 0);

			var div = this._map.div;

			// install touch listeners
			connect.connect(div, "touchstart", this, this._touchStartHandler);
			connect.connect(div, "touchmove", this, this._touchMoveHandler);
			connect.connect(div, "touchend", this, this._touchEndHandler);

			this._tapCount = 0;
			this._lastTap = {
				x: 0,
				y: 0
			};
			this._tapThreshold = 100; // square distance in pixels

		},

		_getTouchBarycenter: function(touchEvent){
			// summary:
			//		returns the midpoint of the two first fingers (or the first finger location if only one)
			// touchEvent: TouchEvent
			//		a touch event
			// returns:
			//		the midpoint as an {x,y} object.
			// tags:
			//		private
			var touches = touchEvent.touches;
			var firstTouch = touches[0];
			var secondTouch = null;
			if(touches.length > 1){
				secondTouch = touches[1];
			}else{
				secondTouch = touches[0];
			}

			var marginBox = html.marginBox(this._map.div);

			var middleX = (firstTouch.pageX + secondTouch.pageX) / 2.0 - marginBox.l;
			var middleY = (firstTouch.pageY + secondTouch.pageY) / 2.0 - marginBox.t;

			return {
				x: middleX,
				y: middleY
			}; // Object

		},

		_getFingerSpacing: function(touchEvent){
			// summary:
			//		computes the distance between the first two fingers
			// touchEvent: Event
			//		a touch event
			// returns: float
			//		a distance. -1 if less that 2 fingers
			// tags:
			//		private
			var touches = touchEvent.touches;
			var spacing = -1;
			if(touches.length >= 2){
				var dx = (touches[1].pageX - touches[0].pageX);
				var dy = (touches[1].pageY - touches[0].pageY);
				spacing = Math.sqrt(dx * dx + dy * dy);
			}
			return spacing;
		},

		_isDoubleTap: function(touchEvent){
			// summary:
			//		checks whether the specified touchStart event is a double tap 
			//		(i.e. follows closely a previous touchStart at approximately the same location)
			// touchEvent: TouchEvent
			//		a touch event
			// returns: boolean
			//		true if this event is considered a double tap
			// tags:
			//		private
			var isDoubleTap = false;
			var touches = touchEvent.touches;
			if((this._tapCount > 0) && touches.length == 1){
				// test distance from last tap
				var dx = (touches[0].pageX - this._lastTap.x);
				var dy = (touches[0].pageY - this._lastTap.y);
				var distance = dx * dx + dy * dy;
				if(distance < this._tapThreshold){
					isDoubleTap = true;
				}else{
					this._tapCount = 0;
				}
			}
			this._tapCount++;
			this._lastTap.x = touches[0].pageX;
			this._lastTap.y = touches[0].pageY;
			setTimeout(lang.hitch(this, function(){
				this._tapCount = 0;
			}), 300);

			return isDoubleTap;
		},

		_doubleTapHandler: function(touchEvent){
			// summary:
			//		action performed on the map when a double tap was triggered 
			// touchEvent: TouchEvent
			//		a touch event
			// tags:
			//		private

			// perform a basic 2x zoom on touch
			var touches = touchEvent.touches;
			var marginBox = html.marginBox(this._map.div);
			var offX = touches[0].pageX - marginBox.l;
			var offY = touches[0].pageY - marginBox.t;
			// clicked map point before zooming
			var mapPoint = this._map.getLonLatFromPixel(new OpenLayers.Pixel(offX, offY));
			// zoom increment power
			this._map.setCenter(new OpenLayers.LonLat(mapPoint.lon, mapPoint.lat), this._map.getZoom() + 1);
		},

		_touchStartHandler: function(touchEvent){
			// summary:
			//		action performed on the map when a touch start was triggered 
			// touchEvent: Event
			//		a touch event
			// tags:
			//		private
			event.stop(touchEvent);

			// test double tap
			if(this._isDoubleTap(touchEvent)){
				this._doubleTapHandler(touchEvent);
				return;
			}

			// compute map midpoint between fingers		
			var middlePoint = this._getTouchBarycenter(touchEvent);

			this._centerTouchLocation = this._map.getLonLatFromPixel(new OpenLayers.Pixel(middlePoint.x, middlePoint.y));

			// store initial finger spacing to compute zoom later
			this._initialFingerSpacing = this._getFingerSpacing(touchEvent);

			// store initial map scale
			this._initialScale = this._map.getScale();

			// install touch move and up listeners (if not done by other fingers before)
			if(!this._touchMoveListener){
				this._touchMoveListener = connect.connect(win.global, "touchmove", this, this._touchMoveHandler);
			}
			if(!this._touchEndListener){
				this._touchEndListener = connect.connect(win.global, "touchend", this, this._touchEndHandler);
			}
		},

		_touchEndHandler: function(touchEvent){
			// summary:
			//		action performed on the map when a touch end was triggered 
			// touchEvent: Event
			//		a touch event
			// tags:
			//		private
			event.stop(touchEvent);

			var touches = touchEvent.touches;

			if(touches.length == 0){
				// disconnect listeners only when all fingers are up
				if(this._touchMoveListener){
					connect.disconnect(this._touchMoveListener);
					this._touchMoveListener = null;
				}
				if(this._touchEndListener){
					connect.disconnect(this._touchEndListener);
					this._touchEndListener = null;
				}
			}else{
				// recompute touch center
				var middlePoint = this._getTouchBarycenter(touchEvent);

				this._centerTouchLocation = this._map.getLonLatFromPixel(new OpenLayers.Pixel(middlePoint.x, middlePoint.y));
			}
		},

		_touchMoveHandler: function(touchEvent){
			// summary:
			//		action performed on the map when a touch move was triggered 
			// touchEvent: Event
			//		a touch event
			// tags:
			//		private

			// prevent browser interaction
			event.stop(touchEvent);

			var middlePoint = this._getTouchBarycenter(touchEvent);

			// compute map offset
			var mapPoint = this._map.getLonLatFromPixel(new OpenLayers.Pixel(middlePoint.x, middlePoint.y));
			var mapOffsetLon = mapPoint.lon - this._centerTouchLocation.lon;
			var mapOffsetLat = mapPoint.lat - this._centerTouchLocation.lat;

			// compute scale factor
			var scaleFactor = 1;
			var touches = touchEvent.touches;
			if(touches.length >= 2){
				var fingerSpacing = this._getFingerSpacing(touchEvent);
				scaleFactor = fingerSpacing / this._initialFingerSpacing;
				// weird openlayer bug: setting several times the same scale value lead to visual zoom...
				this._map.zoomToScale(this._initialScale / scaleFactor);
			}

			// adjust map center on barycenter
			var currentMapCenter = this._map.getCenter();
			this._map.setCenter(new OpenLayers.LonLat(currentMapCenter.lon - mapOffsetLon, currentMapCenter.lat
																																											- mapOffsetLat));

		}
	});
});

},
'dojox/geo/openlayers/Layer':function(){
define([
	"dojo/_base/declare", 
	"dojo/_base/lang", 
	"dojo/_base/array", 
	"dojo/_base/sniff",
	"./Feature"
], function(declare, lang, array, sniff, Feature){

		return declare("dojox.geo.openlayers.Layer", null, {
			// summary:
			//		Base layer class for dojox.geo.openlayers.Map specific layers extending OpenLayers.Layer class.
			//		This layer class accepts Features which encapsulates graphic objects to be added to the map.
			//		This layer class encapsulates an OpenLayers.Layer.
			//		This class provides Feature management such as add, remove and feature access.
			constructor: function(name, options){
				// summary:
				//		Constructs a new Layer.
				// name: String
				//		The name of the layer.
				// options: Object
				//		Options passed to the underlying OpenLayers.Layer object.

				var ol = options ? options.olLayer : null;

				if(!ol){
					ol = lang.delegate(new OpenLayers.Layer(name, options));
				}

				this.olLayer = ol;
				this._features = null;
				this.olLayer.events.register("moveend", this, lang.hitch(this, this.moveTo));
			},

			renderFeature: function(/* Feature */f){
				// summary:
				//		Called when rendering a feature is necessary.
				// f: Feature
				//		The feature to draw.
				f.render();
			},

			getDojoMap: function(){
				return this.dojoMap;
			},

			addFeature: function(f){
				// summary:
				//		Add a feature or an array of features to the layer.
				// f: Feature|Feature[]
				//		The Feature or array of features to add.
				if(lang.isArray(f)){
					array.forEach(f, function(item){
						this.addFeature(item);
					}, this);
					return;
				}
				if(this._features == null){
					this._features = [];
				}
				this._features.push(f);
				f._setLayer(this);
			},

			removeFeature: function(f){
				// summary:
				//		Removes a feature or an array of features from the layer.
				// f: Feature|Feature[]
				//		The Feature or array of features to remove.
				var ft = this._features;
				if(ft == null){
					return;
				}
				if(f instanceof Array){
					f = f.slice(0);
					array.forEach(f, function(item){
						this.removeFeature(item);
					}, this);
					return;
				}
				var i = array.indexOf(ft, f);
				if(i != -1){
					ft.splice(i, 1);
				}
				f._setLayer(null);
				f.remove();
			},

			removeFeatureAt: function(index){
				// summary:
				//		Remove the feature at the specified index.
				// index: int
				//		The index of the feature to remove.
				var ft = this._features;
				var f = ft[index];
				if(!f){
					return;
				}
				ft.splice(index, 1);
				f._setLayer(null);
				f.remove();
			},

			getFeatures: function(){
				// summary:
				//		Returns the feature hold by this layer.
				// returns:
				//		The untouched array of features hold by this layer.
				return this._features; // Feature[]
			},

			getFeatureAt: function(i){
				// summary:
				//		Returns the i-th feature of this layer.
				// i: Number
				//		The index of the feature to return.
				// returns:
				//		The i-th feature of this layer.
				if(this._features == null){
					return undefined;
				}
				return this._features[i]; // Feature
			},

			getFeatureCount: function(){
				// summary:
				//		Returns the number of the features contained by this layer.
				// returns:
				//		The number of the features contained by this layer.
				if(this._features == null){
					return 0;
				}
				return this._features.length; // Number
			},

			clear: function(){
				// summary:
				//		Removes all the features from this layer.
				var fa = this.getFeatures();
				this.removeFeature(fa);
			},

			moveTo: function(event){
				// summary:
				//		Called when the layer is panned or zoomed.
				// event: MouseEvent
				//		The event
				if(event.zoomChanged){
					if(this._features == null){
						return;
					}
					array.forEach(this._features, function(f){
						this.renderFeature(f);
					}, this);
				}
			},

			redraw: function(){
				// summary:
				//		Redraws this layer
				if(sniff.isIE){
					setTimeout(lang.hitch(this, function(){
						this.olLayer.redraw();
					}, 0));
				}else{
					this.olLayer.redraw();
				}
			},

			added: function(){
				// summary:
				//		Called when the layer is added to the map
			}

		});
	});

},
'dojox/geo/openlayers/Feature':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"./_base"
], function(dojo, declare, openlayers){

	return declare("dojox.geo.openlayers.Feature", null, {
		// summary:
		//		A Feature encapsulates an item so that it can be added to a Layer.
		//		This class is not attended to be used as it, but serve as a base class
		//		for specific features such as GeometryFeature which can display georeferenced 
		//		geometries and WidgetFeature which can display georeferenced widgets. 
		constructor: function(){
			// summary:
			//		Construct a new Feature
			this._layer = null;
			this._coordSys = openlayers.EPSG4326;
		},

		getCoordinateSystem: function(){
			// summary:
			//		Returns the coordinate system in which coordinates of this feature are expressed.
			// returns:
			//		The coordinate system in which coordinates of this feature are expressed.
			return this._coordSys; // OpenLayers.Projection
		},

		setCoordinateSystem: function(/* OpenLayers.Projection */cs){
			// summary:
			//		Set the coordinate system in which coordinates of this feature are expressed.
			// cs: OpenLayers.Projection
			//		The coordinate system in which coordinates of this feature are expressed.
			this._coordSys = cs;
		},

		getLayer: function(){
			// summary:
			//		Returns the Layer to which this feature belongs.
			// returns:
			//		The layer to which this feature belongs.
			return this._layer; // dojox/geo/openlayers/Layer
		},

		_setLayer: function(/* dojox/geo/openlayers/Layer */l){
			// summary:
			//		Sets the layer to which this Feature belongs
			// description:
			//		Called when the feature is added to the Layer.
			// tags:
			//		private
			this._layer = l;
		},

		render: function(){
		// summary:
		//		subclasses implements drawing specific behavior.
		},

		remove: function(){
		// summary:
		//		Subclasses implements specific behavior.
		//		Called when removed from the layer.
		},

		_getLocalXY: function(p){
			// summary:
			//		From projected coordinates to screen coordinates
			// p: Object
			//		Object with x and y fields
			// tags:
			//		private
			var x = p.x;
			var y = p.y;
			var layer = this.getLayer();
			var resolution = layer.olLayer.map.getResolution();
			var extent = layer.olLayer.getExtent();
			var rx = (x / resolution + (-extent.left / resolution));
			var ry = ((extent.top / resolution) - y / resolution);
			return [rx, ry];
		}
	});
});

},
'dojox/geo/openlayers/Patch':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/lang",	// dojo.extend getObject
	"dojo/_base/sniff",	// dojo.isIE
	"dojox/gfx",
	"dojox/gfx/shape"
], function(dojo, lang, sniff, gfx, shape){

	var dgo = lang.getObject("geo.openlayers", true, dojox);

	dgo.Patch = {

		patchMethod: function(/*Object*/type, /*String*/method, /*Function*/execBefore, /*Function*/
		execAfter){
			// summary:
			//		Patches the specified method of the given type so that the 'execBefore' (resp. 'execAfter') function is 
			//		called before (resp. after) invoking the legacy implementation.
			// description:
			//		The execBefore function is invoked with the following parameter:
			//		execBefore(method, arguments) where 'method' is the patched method name and 'arguments' the arguments received
			//		by the legacy implementation.
			//		The execAfter function is invoked with the following parameter:
			//		execBefore(method, returnValue, arguments) where 'method' is the patched method name, 'returnValue' the value
			//		returned by the legacy implementation and 'arguments' the arguments received by the legacy implementation.
			// type: Object
			//		the type to patch.
			// method: String
			//		the method name.
			// execBefore: Function
			//		the function to execute before the legacy implementation.
			// execAfter: Function
			//		the function to execute after the legacy implementation.
			// tags:
			//		private
			var old = type.prototype[method];
			type.prototype[method] = function(){
				var callee = method;
				if(execBefore){
					execBefore.call(this, callee, arguments);
				}
				var ret = old.apply(this, arguments);
				if(execAfter){
					ret = execAfter.call(this, callee, ret, arguments) || ret;
				}
				return ret;
			};
		},

		patchGFX: function(){

			var vmlFixRawNodePath = function(){
				if(!this.rawNode.path){
					this.rawNode.path = {};
				}
			};

			var vmlFixFillColors = function(){
				if(this.rawNode.fill && !this.rawNode.fill.colors){
					this.rawNode.fill.colors = {};
				}
			};
			
			if(sniff.isIE <= 8 && gfx.renderer === "vml"){
				this.patchMethod(gfx.Line, "setShape", vmlFixRawNodePath, null);
				this.patchMethod(gfx.Polyline, "setShape", vmlFixRawNodePath, null);
				this.patchMethod(gfx.Path, "setShape", vmlFixRawNodePath, null);
				
				this.patchMethod(shape.Shape, "setFill", vmlFixFillColors, null);
			}
		}
	};
	return dgo.Patch;
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
'dojox/gfx/shape':function(){
define(["./_base", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/kernel", "dojo/_base/sniff",
	"dojo/on", "dojo/_base/array", "dojo/dom-construct", "dojo/_base/Color", "./matrix" ],
	function(g, lang, declare, kernel, has, on, arr, domConstruct, Color, matrixLib){

	var shape = g.shape = {
		// summary:
		//		This module contains the core graphics Shape API.
		//		Different graphics renderer implementation modules (svg, canvas, vml, silverlight, etc.) extend this
		//		basic api to provide renderer-specific implementations for each shape.
	};

	shape.Shape = declare("dojox.gfx.shape.Shape", null, {
		// summary:
		//		a Shape object, which knows how to apply
		//		graphical attributes and transformations
	
		constructor: function(){
			// rawNode: Node
			//		underlying graphics-renderer-specific implementation object (if applicable)
			this.rawNode = null;

			// shape: Object
			//		an abstract shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			this.shape = null;
	
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a transformation matrix
			this.matrix = null;
	
			// fillStyle: dojox/gfx.Fill
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/Color)
			this.fillStyle = null;
	
			// strokeStyle: dojox/gfx.Stroke
			//		a stroke object
			//		(see dojox/gfx.defaultStroke)
			this.strokeStyle = null;
	
			// bbox: dojox/gfx.Rectangle
			//		a bounding box of this shape
			//		(see dojox/gfx.defaultRect)
			this.bbox = null;
	
			// virtual group structure
	
			// parent: Object
			//		a parent or null
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			this.parent = null;
	
			// parentMatrix: dojox/gfx/matrix.Matrix2D
			//		a transformation matrix inherited from the parent
			this.parentMatrix = null;

			if(has("gfxRegistry")){
				var uid = shape.register(this);
				this.getUID = function(){
					return uid;
				}
			}
		},
		
		destroy: function(){
			// summary:
			//		Releases all internal resources owned by this shape. Once this method has been called,
			//		the instance is considered destroyed and should not be used anymore.
			if(has("gfxRegistry")){
				shape.dispose(this);
			}
			if(this.rawNode && "__gfxObject__" in this.rawNode){
				this.rawNode.__gfxObject__ = null;
			}
			this.rawNode = null;
		},
	
		// trivial getters
	
		getNode: function(){
			// summary:
			//		Different graphics rendering subsystems implement shapes in different ways.  This
			//		method provides access to the underlying graphics subsystem object.  Clients calling this
			//		method and using the return value must be careful not to try sharing or using the underlying node
			//		in a general way across renderer implementation.
			//		Returns the underlying graphics Node, or null if no underlying graphics node is used by this shape.
			return this.rawNode; // Node
		},
		getShape: function(){
			// summary:
			//		returns the current Shape object or null
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			return this.shape; // Object
		},
		getTransform: function(){
			// summary:
			//		Returns the current transformation matrix applied to this Shape or null
			return this.matrix;	// dojox/gfx/matrix.Matrix2D
		},
		getFill: function(){
			// summary:
			//		Returns the current fill object or null
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/Color)
			return this.fillStyle;	// Object
		},
		getStroke: function(){
			// summary:
			//		Returns the current stroke object or null
			//		(see dojox/gfx.defaultStroke)
			return this.strokeStyle;	// Object
		},
		getParent: function(){
			// summary:
			//		Returns the parent Shape, Group or null if this Shape is unparented.
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			return this.parent;	// Object
		},
		getBoundingBox: function(){
			// summary:
			//		Returns the bounding box Rectangle for this shape or null if a BoundingBox cannot be
			//		calculated for the shape on the current renderer or for shapes with no geometric area (points).
			//		A bounding box is a rectangular geometric region
			//		defining the X and Y extent of the shape.
			//		(see dojox/gfx.defaultRect)
			//		Note that this method returns a direct reference to the attribute of this instance. Therefore you should
			//		not modify its value directly but clone it instead.
			return this.bbox;	// dojox/gfx.Rectangle
		},
		getTransformedBoundingBox: function(){
			// summary:
			//		returns an array of four points or null
			//		four points represent four corners of the untransformed bounding box
			var b = this.getBoundingBox();
			if(!b){
				return null;	// null
			}
			var m = this._getRealMatrix(),
				gm = matrixLib;
			return [	// Array
					gm.multiplyPoint(m, b.x, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y + b.height),
					gm.multiplyPoint(m, b.x, b.y + b.height)
				];
		},
		getEventSource: function(){
			// summary:
			//		returns a Node, which is used as
			//		a source of events for this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this.rawNode;	// Node
		},
	
		// empty settings
		
		setClip: function(clip){
			// summary:
			//		sets the clipping area of this shape.
			// description:
			//		The clipping area defines the shape area that will be effectively visible. Everything that
			//		would be drawn outside of the clipping area will not be rendered.
			//		The possible clipping area types are rectangle, ellipse, polyline and path, but all are not
			//		supported by all the renderers. vml only supports rectangle clipping, while the gfx silverlight renderer does not
			//		support path clipping.
			//		The clip parameter defines the clipping area geometry, and should be an object with the following properties:
			//
			//		- {x:Number, y:Number, width:Number, height:Number} for rectangular clip
			//		- {cx:Number, cy:Number, rx:Number, ry:Number} for ellipse clip
			//		- {points:Array} for polyline clip
			//		- {d:String} for a path clip.
			//
			//		The clip geometry coordinates are expressed in the coordinate system used to draw the shape. In other
			//		words, the clipping area is defined in the shape parent coordinate system and the shape transform is automatically applied.
			// example:
			//		The following example shows how to clip a gfx image with all the possible clip geometry: a rectangle,
			//		an ellipse, a circle (using the ellipse geometry), a polyline and a path:
			//
			//	|	surface.createImage({src:img, width:200,height:200}).setClip({x:10,y:10,width:50,height:50});
			//	|	surface.createImage({src:img, x:100,y:50,width:200,height:200}).setClip({cx:200,cy:100,rx:20,ry:30});
			//	|	surface.createImage({src:img, x:0,y:350,width:200,height:200}).setClip({cx:100,cy:425,rx:60,ry:60});
			//	|	surface.createImage({src:img, x:300,y:0,width:200,height:200}).setClip({points:[350,0,450,50,380,130,300,110]});
			//	|	surface.createImage({src:img, x:300,y:350,width:200,height:200}).setClip({d:"M 350,350 C314,414 317,557 373,450.0000 z"});

			// clip: Object
			//		an object that defines the clipping geometry, or null to remove clip.
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.clip = clip;
		},
		
		getClip: function(){
			return this.clip;
		},
	
		setShape: function(shape){
			// summary:
			//		sets a shape object
			//		(the default implementation simply ignores it)
			// shape: Object
			//		a shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.shape = g.makeParameters(this.shape, shape);
			this.bbox = null;
			return this;	// self
		},
		setFill: function(fill){
			// summary:
			//		sets a fill object
			//		(the default implementation simply ignores it)
			// fill: Object
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/_base/Color)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!fill){
				// don't fill
				this.fillStyle = null;
				return this;	// self
			}
			var f = null;
			if(typeof(fill) == "object" && "type" in fill){
				// gradient or pattern
				switch(fill.type){
					case "linear":
						f = g.makeParameters(g.defaultLinearGradient, fill);
						break;
					case "radial":
						f = g.makeParameters(g.defaultRadialGradient, fill);
						break;
					case "pattern":
						f = g.makeParameters(g.defaultPattern, fill);
						break;
				}
			}else{
				// color object
				f = g.normalizeColor(fill);
			}
			this.fillStyle = f;
			return this;	// self
		},
		setStroke: function(stroke){
			// summary:
			//		sets a stroke object
			//		(the default implementation simply ignores it)
			// stroke: Object
			//		a stroke object
			//		(see dojox/gfx.defaultStroke)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!stroke){
				// don't stroke
				this.strokeStyle = null;
				return this;	// self
			}
			// normalize the stroke
			if(typeof stroke == "string" || lang.isArray(stroke) || stroke instanceof Color){
				stroke = {color: stroke};
			}
			var s = this.strokeStyle = g.makeParameters(g.defaultStroke, stroke);
			s.color = g.normalizeColor(s.color);
			return this;	// self
		},
		setTransform: function(matrix){
			// summary:
			//		sets a transformation matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.matrix = matrixLib.clone(matrix ? matrixLib.normalize(matrix) : matrixLib.identity);
			return this._applyTransform();	// self
		},
	
		_applyTransform: function(){
			// summary:
			//		physically sets a matrix
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this;	// self
		},
	
		// z-index
	
		moveToFront: function(){
			// summary:
			//		moves a shape to front of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToFront(this);
				this._moveToFront();	// execute renderer-specific action
			}
			return this;	// self
		},
		moveToBack: function(){
			// summary:
			//		moves a shape to back of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToBack(this);
				this._moveToBack();	// execute renderer-specific action
			}
			return this;
		},
		_moveToFront: function(){
			// summary:
			//		renderer-specific hook, see dojox/gfx/shape.Shape.moveToFront()
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
		_moveToBack: function(){
			// summary:
			//		renderer-specific hook, see dojox/gfx/shape.Shape.moveToFront()
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
	
		// apply left & right transformation
	
		applyRightTransform: function(matrix){
			// summary:
			//		multiplies the existing matrix with an argument on right side
			//		(this.matrix * matrix)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
		applyLeftTransform: function(matrix){
			// summary:
			//		multiplies the existing matrix with an argument on left side
			//		(matrix * this.matrix)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([matrix, this.matrix]) : this;	// self
		},
		applyTransform: function(matrix){
			// summary:
			//		a shortcut for dojox/gfx/shape.Shape.applyRightTransform
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
	
		// virtual group methods
	
		removeShape: function(silently){
			// summary:
			//		removes the shape from its parent's list of shapes
			// silently: Boolean
			//		if true, do not redraw a picture yet
			if(this.parent){
				this.parent.remove(this, silently);
			}
			return this;	// self
		},
		_setParent: function(parent, matrix){
			// summary:
			//		sets a parent
			// parent: Object
			//		a parent or null
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix or a matrix-like object
			this.parent = parent;
			return this._updateParentMatrix(matrix);	// self
		},
		_updateParentMatrix: function(matrix){
			// summary:
			//		updates the parent matrix with new matrix
			// matrix: dojox/gfx/Matrix2D
			//		a 2D matrix or a matrix-like object
			this.parentMatrix = matrix ? matrixLib.clone(matrix) : null;
			return this._applyTransform();	// self
		},
		_getRealMatrix: function(){
			// summary:
			//		returns the cumulative ('real') transformation matrix
			//		by combining the shape's matrix with its parent's matrix
			var m = this.matrix;
			var p = this.parent;
			while(p){
				if(p.matrix){
					m = matrixLib.multiply(p.matrix, m);
				}
				p = p.parent;
			}
			return m;	// dojox/gfx/matrix.Matrix2D
		}
	});
	
	shape._eventsProcessing = {
		on: function(type, listener){
			//	summary:
			//		Connects an event to this shape.

			return on(this.getEventSource(), type, shape.fixCallback(this, g.fixTarget, listener));
		},

		connect: function(name, object, method){
			// summary:
			//		connects a handler to an event on this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			// redirect to fixCallback to normalize events and add the gfxTarget to the event. The latter
			// is done by dojox/gfx.fixTarget which is defined by each renderer
			if(name.substring(0, 2) == "on"){
				name = name.substring(2);
			}
			return this.on(name, method ? lang.hitch(object, method) : object);
		},

		disconnect: function(token){
			// summary:
			//		connects a handler by token from an event on this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
	
			return token.remove();
		}
	};
	
	shape.fixCallback = function(gfxElement, fixFunction, scope, method){
		// summary:
		//		Wraps the callback to allow for tests and event normalization
		//		before it gets invoked. This is where 'fixTarget' is invoked.
		// tags:
		//      private
		// gfxElement: Object
		//		The GFX object that triggers the action (ex.:
		//		dojox/gfx.Surface and dojox/gfx/shape.Shape). A new event property
		//		'gfxTarget' is added to the event to reference this object.
		//		for easy manipulation of GFX objects by the event handlers.
		// fixFunction: Function
		//		The function that implements the logic to set the 'gfxTarget'
		//		property to the event. It should be 'dojox/gfx.fixTarget' for
		//		most of the cases
		// scope: Object
		//		Optional. The scope to be used when invoking 'method'. If
		//		omitted, a global scope is used.
		// method: Function|String
		//		The original callback to be invoked.
		if(!method){
			method = scope;
			scope = null;
		}
		if(lang.isString(method)){
			scope = scope || kernel.global;
			if(!scope[method]){ throw(['dojox.gfx.shape.fixCallback: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
			return function(e){  
				return fixFunction(e,gfxElement) ? scope[method].apply(scope, arguments || []) : undefined; }; // Function
		}
		return !scope 
			? function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments) : undefined; } 
			: function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments || []) : undefined; }; // Function
	};
	lang.extend(shape.Shape, shape._eventsProcessing);
	
	shape.Container = {
		// summary:
		//		a container of shapes, which can be used
		//		as a foundation for renderer-specific groups, or as a way
		//		to logically group shapes (e.g, to propagate matricies)
	
		_init: function() {
			// children: Array
			//		a list of children
			this.children = [];
			this._batch = 0;
		},
	
		// group management
	
		openBatch: function() {
			// summary:
			//		starts a new batch, subsequent new child shapes will be held in
			//		the batch instead of appending to the container directly.
			// description:
			//		Because the canvas renderer has no DOM hierarchy, the canvas implementation differs
			//		such that it suspends the repaint requests for this container until the current batch is closed by a call to closeBatch().
			return this;
		},
		closeBatch: function() {
			// summary:
			//		submits the current batch, append all pending child shapes to DOM
			// description:
			//		On canvas, this method flushes the pending redraws queue.
			return this;
		},
		add: function(shape){
			// summary:
			//		adds a shape to the list
			// shape: dojox/gfx/shape.Shape
			//		the shape to add to the list
			var oldParent = shape.getParent();
			if(oldParent){
				oldParent.remove(shape, true);
			}
			this.children.push(shape);
			return shape._setParent(this, this._getRealMatrix());	// self
		},
		remove: function(shape, silently){
			// summary:
			//		removes a shape from the list
			// shape: dojox/gfx/shape.Shape
			//		the shape to remove
			// silently: Boolean
			//		if true, do not redraw a picture yet
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					if(silently){
						// skip for now
					}else{
						shape.parent = null;
						shape.parentMatrix = null;
					}
					this.children.splice(i, 1);
					break;
				}
			}
			return this;	// self
		},
		clear: function(/*Boolean?*/ destroy){
			// summary:
			//		removes all shapes from a group/surface.
			// destroy: Boolean
			//		Indicates whether the children should be destroyed. Optional.
			var shape;
			for(var i = 0; i < this.children.length;++i){
				shape = this.children[i];
				shape.parent = null;
				shape.parentMatrix = null;
				if(destroy){
					shape.destroy();
				}
			}
			this.children = [];
			return this;	// self
		},
		getBoundingBox: function(){
			// summary:
			//		Returns the bounding box Rectangle for this shape.
			if(this.children){
				// if this is a composite shape, then sum up all the children
				var result = null;
				arr.forEach(this.children, function(shape){
					var bb = shape.getBoundingBox();
					if(bb){
						var ct = shape.getTransform();
						if(ct){
							bb = matrixLib.multiplyRectangle(ct, bb);
						}
						if(result){
							// merge two bbox 
							result.x = Math.min(result.x, bb.x);
							result.y = Math.min(result.y, bb.y);
							result.endX = Math.max(result.endX, bb.x + bb.width);
							result.endY = Math.max(result.endY, bb.y + bb.height);
						}else{
							// first bbox 
							result = {
								x: bb.x,
								y: bb.y,
								endX: bb.x + bb.width,
								endY: bb.y + bb.height
							};
						}
					}
				});
				if(result){
					result.width = result.endX - result.x;
					result.height = result.endY - result.y;
				}
				return result; // dojox/gfx.Rectangle
			}
			// unknown/empty bounding box, subclass shall override this impl 
			return null;
		},
		// moving child nodes
		_moveChildToFront: function(shape){
			// summary:
			//		moves a shape to front of the list of shapes
			// shape: dojox/gfx/shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.push(shape);
					break;
				}
			}
			return this;	// self
		},
		_moveChildToBack: function(shape){
			// summary:
			//		moves a shape to back of the list of shapes
			// shape: dojox/gfx/shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.unshift(shape);
					break;
				}
			}
			return this;	// self
		}
	};

	shape.Surface = declare("dojox.gfx.shape.Surface", null, {
		// summary:
		//		a surface object to be used for drawings
		constructor: function(){
			// underlying node
			this.rawNode = null;
			// the parent node
			this._parent = null;
			// the list of DOM nodes to be deleted in the case of destruction
			this._nodes = [];
			// the list of events to be detached in the case of destruction
			this._events = [];
		},
		destroy: function(){
			// summary:
			//		destroy all relevant external resources and release all
			//		external references to make this object garbage-collectible
			arr.forEach(this._nodes, domConstruct.destroy);
			this._nodes = [];
			arr.forEach(this._events, function(h){ if(h){ h.remove(); } });
			this._events = [];
			this.rawNode = null;	// recycle it in _nodes, if it needs to be recycled
			if(has("ie")){
				while(this._parent.lastChild){
					domConstruct.destroy(this._parent.lastChild);
				}
			}else{
				this._parent.innerHTML = "";
			}
			this._parent = null;
		},
		getEventSource: function(){
			// summary:
			//		returns a node, which can be used to attach event listeners
			return this.rawNode; // Node
		},
		_getRealMatrix: function(){
			// summary:
			//		always returns the identity matrix
			return null;	// dojox/gfx/Matrix2D
		},
		/*=====
		 setDimensions: function(width, height){
			 // summary:
			 //		sets the width and height of the rawNode
			 // width: String
			 //		width of surface, e.g., "100px"
			 // height: String
			 //		height of surface, e.g., "100px"
			 return this;	// self
		 },
		 getDimensions: function(){
			 // summary:
			 //     gets current width and height in pixels
			 // returns: Object
			 //     object with properties "width" and "height"
		 },
		 =====*/
		isLoaded: true,
		onLoad: function(/*dojox/gfx/shape.Surface*/ surface){
			// summary:
			//		local event, fired once when the surface is created
			//		asynchronously, used only when isLoaded is false, required
			//		only for Silverlight.
		},
		whenLoaded: function(/*Object|Null*/ context, /*Function|String*/ method){
			var f = lang.hitch(context, method);
			if(this.isLoaded){
				f(this);
			}else{
				on.once(this, "load", function(surface){
					f(surface);
				});
			}
		}
	});
	lang.extend(shape.Surface, shape._eventsProcessing);

	/*=====
	g.Point = declare("dojox/gfx.Point", null, {
		// summary:
		//		2D point for drawings - {x, y}
		// description:
		//		Do not use this object directly!
		//		Use the naked object instead: {x: 1, y: 2}.
	});

	g.Rectangle = declare("dojox.gfx.Rectangle", null, {
		// summary:
		//		rectangle - {x, y, width, height}
		// description:
		//		Do not use this object directly!
		//		Use the naked object instead: {x: 1, y: 2, width: 100, height: 200}.
	});
	 =====*/


	shape.Rect = declare("dojox.gfx.shape.Rect", shape.Shape, {
		// summary:
		//		a generic rectangle
		constructor: function(rawNode){
			// rawNode: Node
			//		The underlying graphics system object (typically a DOM Node)
			this.shape = g.getDefault("Rect");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box (its shape in this case)
			return this.shape;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Ellipse = declare("dojox.gfx.shape.Ellipse", shape.Shape, {
		// summary:
		//		a generic ellipse
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Ellipse");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.rx, y: shape.cy - shape.ry,
					width: 2 * shape.rx, height: 2 * shape.ry};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Circle = declare("dojox.gfx.shape.Circle", shape.Shape, {
		// summary:
		//		a generic circle
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Circle");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.r, y: shape.cy - shape.r,
					width: 2 * shape.r, height: 2 * shape.r};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Line = declare("dojox.gfx.shape.Line", shape.Shape, {
		// summary:
		//		a generic line (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Line");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {
					x:		Math.min(shape.x1, shape.x2),
					y:		Math.min(shape.y1, shape.y2),
					width:	Math.abs(shape.x2 - shape.x1),
					height:	Math.abs(shape.y2 - shape.y1)
				};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Polyline = declare("dojox.gfx.shape.Polyline", shape.Shape, {
		// summary:
		//		a generic polyline/polygon (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Polyline");
			this.rawNode = rawNode;
		},
		setShape: function(points, closed){
			// summary:
			//		sets a polyline/polygon shape object
			// points: Object|Array
			//		a polyline/polygon shape object, or an array of points
			// closed: Boolean
			//		close the polyline to make a polygon
			if(points && points instanceof Array){
				this.inherited(arguments, [{points: points}]);
				if(closed && this.shape.points.length){
					this.shape.points.push(this.shape.points[0]);
				}
			}else{
				this.inherited(arguments, [points]);
			}
			return this;	// self
		},
		_normalizePoints: function(){
			// summary:
			//		normalize points to array of {x:number, y:number}
			var p = this.shape.points, l = p && p.length;
			if(l && typeof p[0] == "number"){
				var points = [];
				for(var i = 0; i < l; i += 2){
					points.push({x: p[i], y: p[i + 1]});
				}
				this.shape.points = points;
			}
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox && this.shape.points.length){
				var p = this.shape.points;
				var l = p.length;
				var t = p[0];
				var bbox = {l: t.x, t: t.y, r: t.x, b: t.y};
				for(var i = 1; i < l; ++i){
					t = p[i];
					if(bbox.l > t.x) bbox.l = t.x;
					if(bbox.r < t.x) bbox.r = t.x;
					if(bbox.t > t.y) bbox.t = t.y;
					if(bbox.b < t.y) bbox.b = t.y;
				}
				this.bbox = {
					x:		bbox.l,
					y:		bbox.t,
					width:	bbox.r - bbox.l,
					height:	bbox.b - bbox.t
				};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Image = declare("dojox.gfx.shape.Image", shape.Shape, {
		// summary:
		//		a generic image (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Image");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box (its shape in this case)
			return this.shape;	// dojox/gfx.Rectangle
		},
		setStroke: function(){
			// summary:
			//		ignore setting a stroke style
			return this;	// self
		},
		setFill: function(){
			// summary:
			//		ignore setting a fill style
			return this;	// self
		}
	});
	
	shape.Text = declare(shape.Shape, {
		// summary:
		//		a generic text (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.fontStyle = null;
			this.shape = g.getDefault("Text");
			this.rawNode = rawNode;
		},
		getFont: function(){
			// summary:
			//		returns the current font object or null
			return this.fontStyle;	// Object
		},
		setFont: function(newFont){
			// summary:
			//		sets a font for text
			// newFont: Object
			//		a font object (see dojox/gfx.defaultFont) or a font string
			this.fontStyle = typeof newFont == "string" ? g.splitFontString(newFont) :
				g.makeParameters(g.defaultFont, newFont);
			this._setFont();
			return this;	// self
		},
		getBoundingBox: function(){
			var bbox = null, s = this.getShape();
			if(s.text){
				bbox = g._base._computeTextBoundingBox(this);
			}
			return bbox;
		}
	});
	
	shape.Creator = {
		// summary:
		//		shape creators
		createShape: function(shape){
			// summary:
			//		creates a shape object based on its type; it is meant to be used
			//		by group-like objects
			// shape: Object
			//		a shape descriptor object
			// returns: dojox/gfx/shape.Shape | Null
			//      a fully instantiated surface-specific Shape object
			switch(shape.type){
				case g.defaultPath.type:		return this.createPath(shape);
				case g.defaultRect.type:		return this.createRect(shape);
				case g.defaultCircle.type:	    return this.createCircle(shape);
				case g.defaultEllipse.type:	    return this.createEllipse(shape);
				case g.defaultLine.type:		return this.createLine(shape);
				case g.defaultPolyline.type:	return this.createPolyline(shape);
				case g.defaultImage.type:		return this.createImage(shape);
				case g.defaultText.type:		return this.createText(shape);
				case g.defaultTextPath.type:	return this.createTextPath(shape);
			}
			return null;
		},
		createGroup: function(){
			// summary:
			//		creates a group shape
			return this.createObject(g.Group);	// dojox/gfx/Group
		},
		createRect: function(rect){
			// summary:
			//		creates a rectangle shape
			// rect: Object
			//		a path object (see dojox/gfx.defaultRect)
			return this.createObject(g.Rect, rect);	// dojox/gfx/shape.Rect
		},
		createEllipse: function(ellipse){
			// summary:
			//		creates an ellipse shape
			// ellipse: Object
			//		an ellipse object (see dojox/gfx.defaultEllipse)
			return this.createObject(g.Ellipse, ellipse);	// dojox/gfx/shape.Ellipse
		},
		createCircle: function(circle){
			// summary:
			//		creates a circle shape
			// circle: Object
			//		a circle object (see dojox/gfx.defaultCircle)
			return this.createObject(g.Circle, circle);	// dojox/gfx/shape.Circle
		},
		createLine: function(line){
			// summary:
			//		creates a line shape
			// line: Object
			//		a line object (see dojox/gfx.defaultLine)
			return this.createObject(g.Line, line);	// dojox/gfx/shape.Line
		},
		createPolyline: function(points){
			// summary:
			//		creates a polyline/polygon shape
			// points: Object
			//		a points object (see dojox/gfx.defaultPolyline)
			//		or an Array of points
			return this.createObject(g.Polyline, points);	// dojox/gfx/shape.Polyline
		},
		createImage: function(image){
			// summary:
			//		creates a image shape
			// image: Object
			//		an image object (see dojox/gfx.defaultImage)
			return this.createObject(g.Image, image);	// dojox/gfx/shape.Image
		},
		createText: function(text){
			// summary:
			//		creates a text shape
			// text: Object
			//		a text object (see dojox/gfx.defaultText)
			return this.createObject(g.Text, text);	// dojox/gfx/shape.Text
		},
		createPath: function(path){
			// summary:
			//		creates a path shape
			// path: Object
			//		a path object (see dojox/gfx.defaultPath)
			return this.createObject(g.Path, path);	// dojox/gfx/shape.Path
		},
		createTextPath: function(text){
			// summary:
			//		creates a text shape
			// text: Object
			//		a textpath object (see dojox/gfx.defaultTextPath)
			return this.createObject(g.TextPath, {}).setText(text);	// dojox/gfx/shape.TextPath
		},
		createObject: function(shapeType, rawShape){
			// summary:
			//		creates an instance of the passed shapeType class
			// shapeType: Function
			//		a class constructor to create an instance of
			// rawShape: Object 
			//		properties to be passed in to the classes 'setShape' method
	
			// SHOULD BE RE-IMPLEMENTED BY THE RENDERER!
			return null;	// dojox/gfx/shape.Shape
		}
	};
	
	/*=====
	 lang.extend(shape.Surface, shape.Container);
	 lang.extend(shape.Surface, shape.Creator);

	 g.Group = declare(shape.Shape, {
		// summary:
		//		a group shape, which can be used
		//		to logically group shapes (e.g, to propagate matricies)
	});
	lang.extend(g.Group, shape.Container);
	lang.extend(g.Group, shape.Creator);

	g.Rect     = shape.Rect;
	g.Circle   = shape.Circle;
	g.Ellipse  = shape.Ellipse;
	g.Line     = shape.Line;
	g.Polyline = shape.Polyline;
	g.Text     = shape.Text;
	g.Surface  = shape.Surface;
	=====*/

	return shape;
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
'dojox/geo/openlayers/GfxLayer':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/dom-style",
	"dojox/gfx",
	"dojox/gfx/matrix",
	"./Feature",
	"./Layer"
], function(declare, connect, style, gfx, matrix, Feature, Layer){

	return declare("dojox.geo.openlayers.GfxLayer", Layer, {
		// summary:
		//		A layer dedicated to render dojox.geo.openlayers.GeometryFeature
		// description:
		//		A layer class for rendering geometries as dojox.gfx.Shape objects.
		//		This layer class accepts Features which encapsulates graphic objects to be added to the map.
		//		All objects should be added to this group.
		// tags:
		//		private
		_viewport: null,

		constructor: function(name, options){
			// summary:
			//		Constructs a new GFX layer.
			var s = gfx.createSurface(this.olLayer.div, 100, 100);
			this._surface = s;
			var vp;
			if(options && options.viewport){
				vp = options.viewport;
			}else{
				vp = s.createGroup();
			}
			this.setViewport(vp);
			connect.connect(this.olLayer, "onMapResize", this, "onMapResize");
			this.olLayer.getDataExtent = this.getDataExtent;
		},

		getViewport: function(){
			// summary:
			//		Gets the viewport
			// tags:
			//		internal
			return this._viewport;
		},

		setViewport: function(g){
			// summary:
			//		Sets the viewport
			// g: dojox.gfx.Group
			// tags:
			//		internal
			if(this._viewport){
				this._viewport.removeShape();
			}
			this._viewport = g;
			this._surface.add(g);
		},

		onMapResize: function(){
			// summary:
			//		Called when map is resized.
			// tags:
			//		protected
			this._surfaceSize();
		},

		setMap: function(map){
			// summary:
			//		Sets the map for this layer.
			// tags:
			//		protected
			this.inherited(arguments);
			this._surfaceSize();
		},

		getDataExtent: function(){
			// summary:
			//		Get data extent
			// tags:
			//		private
			var ret = this._surface.getDimensions();
			return ret;
		},

		getSurface: function(){
			// summary:
			//		Get the underlying dojox.gfx.Surface
			// returns:
			//		The dojox.gfx.Surface this layer uses to draw its GFX rendering.
			return this._surface; // dojox.gfx.Surface
		},

		_surfaceSize: function(){
			// summary:
			//		Recomputes the surface size when being resized.
			// tags:
			//		private
			var s = this.olLayer.map.getSize();
			this._surface.setDimensions(s.w, s.h);
		},

		moveTo: function(event){
			// summary:
			//		Called when this layer is moved or zoomed.
			// event:
			//		The event
			var s = style.get(this.olLayer.map.layerContainerDiv);
			var left = parseInt(s.left);
			var top = parseInt(s.top);

			if(event.zoomChanged || left || top){
				var d = this.olLayer.div;

				style.set(d, {
					left: -left + "px",
					top: -top + "px"
				});

				if(this._features == null){
					return;
				}
				var vp = this.getViewport();

				vp.setTransform(matrix.translate(left, top));

				this.inherited(arguments);

			}
		},

		added: function(){
			// summary:
			//		Called when added to a map.
			this.inherited(arguments);
			this._surfaceSize();
		}

	});
});

},
'dojo/data/ItemFileReadStore':function(){
define(["../_base/kernel", "../_base/lang", "../_base/declare", "../_base/array", "../_base/xhr",
	"../Evented", "./util/filter", "./util/simpleFetch", "../date/stamp"
], function(kernel, lang, declare, array, xhr, Evented, filterUtil, simpleFetch, dateStamp){

// module:
//		dojo/data/ItemFileReadStore

var ItemFileReadStore = declare("dojo.data.ItemFileReadStore", [Evented],{
	// summary:
	//		The ItemFileReadStore implements the dojo/data/api/Read API and reads
	//		data from JSON files that have contents in this format --
	// |	{ items: [
	// |		{ name:'Kermit', color:'green', age:12, friends:['Gonzo', {_reference:{name:'Fozzie Bear'}}]},
	// |		{ name:'Fozzie Bear', wears:['hat', 'tie']},
	// |		{ name:'Miss Piggy', pets:'Foo-Foo'}
	// |	]}
	//		Note that it can also contain an 'identifier' property that specified which attribute on the items
	//		in the array of items that acts as the unique identifier for that item.

	constructor: function(/* Object */ keywordParameters){
		// summary:
		//		constructor
		// keywordParameters:
		//		{url: String} {data: jsonObject} {typeMap: object}
		//		The structure of the typeMap object is as follows:
		// |	{
		// |		type0: function || object,
		// |		type1: function || object,
		// |		...
		// |		typeN: function || object
		// |	}
		//		Where if it is a function, it is assumed to be an object constructor that takes the
		//		value of _value as the initialization parameters.  If it is an object, then it is assumed
		//		to be an object of general form:
		// |	{
		// |		type: function, //constructor.
		// |		deserialize:	function(value) //The function that parses the value and constructs the object defined by type appropriately.
		// |	}

		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = [];
		this._loadFinished = false;
		this._jsonFileUrl = keywordParameters.url;
		this._ccUrl = keywordParameters.url;
		this.url = keywordParameters.url;
		this._jsonData = keywordParameters.data;
		this.data = null;
		this._datatypeMap = keywordParameters.typeMap || {};
		if(!this._datatypeMap['Date']){
			//If no default mapping for dates, then set this as default.
			//We use the dojo/date/stamp here because the ISO format is the 'dojo way'
			//of generically representing dates.
			this._datatypeMap['Date'] = {
				type: Date,
				deserialize: function(value){
					return dateStamp.fromISOString(value);
				}
			};
		}
		this._features = {'dojo.data.api.Read':true, 'dojo.data.api.Identity':true};
		this._itemsByIdentity = null;
		this._storeRefPropName = "_S"; // Default name for the store reference to attach to every item.
		this._itemNumPropName = "_0"; // Default Item Id for isItem to attach to every item.
		this._rootItemPropName = "_RI"; // Default Item Id for isItem to attach to every item.
		this._reverseRefMap = "_RRM"; // Default attribute for constructing a reverse reference map for use with reference integrity
		this._loadInProgress = false; //Got to track the initial load to prevent duelling loads of the dataset.
		this._queuedFetches = [];
		if(keywordParameters.urlPreventCache !== undefined){
			this.urlPreventCache = keywordParameters.urlPreventCache?true:false;
		}
		if(keywordParameters.hierarchical !== undefined){
			this.hierarchical = keywordParameters.hierarchical?true:false;
		}
		if(keywordParameters.clearOnClose){
			this.clearOnClose = true;
		}
		if("failOk" in keywordParameters){
			this.failOk = keywordParameters.failOk?true:false;
		}
	},

	url: "",	// use "" rather than undefined for the benefit of the parser (#3539)

	//Internal var, crossCheckUrl.  Used so that setting either url or _jsonFileUrl, can still trigger a reload
	//when clearOnClose and close is used.
	_ccUrl: "",

	data: null,	// define this so that the parser can populate it

	typeMap: null, //Define so parser can populate.

	// clearOnClose: Boolean
	//		Parameter to allow users to specify if a close call should force a reload or not.
	//		By default, it retains the old behavior of not clearing if close is called.  But
	//		if set true, the store will be reset to default state.  Note that by doing this,
	//		all item handles will become invalid and a new fetch must be issued.
	clearOnClose: false,

	// urlPreventCache: Boolean
	//		Parameter to allow specifying if preventCache should be passed to the xhrGet call or not when loading data from a url.
	//		Note this does not mean the store calls the server on each fetch, only that the data load has preventCache set as an option.
	//		Added for tracker: #6072
	urlPreventCache: false,

	// failOk: Boolean
	//		Parameter for specifying that it is OK for the xhrGet call to fail silently.
	failOk: false,

	// hierarchical: Boolean
	//		Parameter to indicate to process data from the url as hierarchical
	//		(data items can contain other data items in js form).  Default is true
	//		for backwards compatibility.  False means only root items are processed
	//		as items, all child objects outside of type-mapped objects and those in
	//		specific reference format, are left straight JS data objects.
	hierarchical: true,

	_assertIsItem: function(/* dojo/data/api/Item */ item){
		// summary:
		//		This function tests whether the item passed in is indeed an item in the store.
		// item:
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){
			throw new Error(this.declaredClass + ": Invalid item argument.");
		}
	},

	_assertIsAttribute: function(/* attribute-name-string */ attribute){
		// summary:
		//		This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		// attribute:
		//		The attribute to test for being contained by the store.
		if(typeof attribute !== "string"){
			throw new Error(this.declaredClass + ": Invalid attribute argument.");
		}
	},

	getValue: function(	/* dojo/data/api/Item */ item,
						   /* attribute-name-string */ attribute,
						   /* value? */ defaultValue){
		// summary:
		//		See dojo/data/api/Read.getValue()
		var values = this.getValues(item, attribute);
		return (values.length > 0)?values[0]:defaultValue; // mixed
	},

	getValues: function(/* dojo/data/api/Item */ item,
						/* attribute-name-string */ attribute){
		// summary:
		//		See dojo/data/api/Read.getValues()

		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		// Clone it before returning.  refs: #10474
		return (item[attribute] || []).slice(0); // Array
	},

	getAttributes: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		for(var key in item){
			// Save off only the real item attributes, not the special id marks for O(1) isItem.
			if((key !== this._storeRefPropName) && (key !== this._itemNumPropName) && (key !== this._rootItemPropName) && (key !== this._reverseRefMap)){
				attributes.push(key);
			}
		}
		return attributes; // Array
	},

	hasAttribute: function(	/* dojo/data/api/Item */ item,
							   /* attribute-name-string */ attribute){
		// summary:
		//		See dojo/data/api/Read.hasAttribute()
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		return (attribute in item);
	},

	containsValue: function(/* dojo/data/api/Item */ item,
							/* attribute-name-string */ attribute,
							/* anything */ value){
		// summary:
		//		See dojo/data/api/Read.containsValue()
		var regexp = undefined;
		if(typeof value === "string"){
			regexp = filterUtil.patternToRegExp(value, false);
		}
		return this._containsValue(item, attribute, value, regexp); //boolean.
	},

	_containsValue: function(	/* dojo/data/api/Item */ item,
								 /* attribute-name-string */ attribute,
								 /* anything */ value,
								 /* RegExp?*/ regexp){
		// summary:
		//		Internal function for looking at the values contained by the item.
		// description:
		//		Internal function for looking at the values contained by the item.  This
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		// item:
		//		The data item to examine for attribute values.
		// attribute:
		//		The attribute to inspect.
		// value:
		//		The value to match.
		// regexp:
		//		Optional regular expression generated off value if value was of string type to handle wildcarding.
		//		If present and attribute values are string, then it can be used for comparison instead of 'value'
		return array.some(this.getValues(item, attribute), function(possibleValue){
			if(possibleValue !== null && !lang.isObject(possibleValue) && regexp){
				if(possibleValue.toString().match(regexp)){
					return true; // Boolean
				}
			}else if(value === possibleValue){
				return true; // Boolean
			}
		});
	},

	isItem: function(/* anything */ something){
		// summary:
		//		See dojo/data/api/Read.isItem()
		if(something && something[this._storeRefPropName] === this){
			if(this._arrayOfAllItems[something[this._itemNumPropName]] === something){
				return true;
			}
		}
		return false; // Boolean
	},

	isItemLoaded: function(/* anything */ something){
		// summary:
		//		See dojo/data/api/Read.isItemLoaded()
		return this.isItem(something); //boolean
	},

	loadItem: function(/* object */ keywordArgs){
		// summary:
		//		See dojo/data/api/Read.loadItem()
		this._assertIsItem(keywordArgs.item);
	},

	getFeatures: function(){
		// summary:
		//		See dojo/data/api/Read.getFeatures()
		return this._features; //Object
	},

	getLabel: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Read.getLabel()
		if(this._labelAttr && this.isItem(item)){
			return this.getValue(item,this._labelAttr); //String
		}
		return undefined; //undefined
	},

	getLabelAttributes: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Read.getLabelAttributes()
		if(this._labelAttr){
			return [this._labelAttr]; //array
		}
		return null; //null
	},

	filter: function(/* Object */ requestArgs, /* item[] */ arrayOfItems, /* Function */ findCallback){
		// summary:
		//		This method handles the basic filtering needs for ItemFile* based stores.
		var items = [],
			i, key;

		if(requestArgs.query){
			var value,
				ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false;

			//See if there are any string values that can be regexp parsed first to avoid multiple regexp gens on the
			//same value for each item examined.  Much more efficient.
			var regexpList = {};
			for(key in requestArgs.query){
				value = requestArgs.query[key];
				if(typeof value === "string"){
					regexpList[key] = filterUtil.patternToRegExp(value, ignoreCase);
				}else if(value instanceof RegExp){
					regexpList[key] = value;
				}
			}
			for(i = 0; i < arrayOfItems.length; ++i){
				var match = true;
				var candidateItem = arrayOfItems[i];
				if(candidateItem === null){
					match = false;
				}else{
					for(key in requestArgs.query){
						value = requestArgs.query[key];
						if(!this._containsValue(candidateItem, key, value, regexpList[key])){
							match = false;
						}
					}
				}
				if(match){
					items.push(candidateItem);
				}
			}
			findCallback(items, requestArgs);
		}else{
			// We want a copy to pass back in case the parent wishes to sort the array.
			// We shouldn't allow resort of the internal list, so that multiple callers
			// can get lists and sort without affecting each other.  We also need to
			// filter out any null values that have been left as a result of deleteItem()
			// calls in ItemFileWriteStore.
			for(i = 0; i < arrayOfItems.length; ++i){
				var item = arrayOfItems[i];
				if(item !== null){
					items.push(item);
				}
			}
			findCallback(items, requestArgs);
		}
	},

	_fetchItems: function(	/* Object */ keywordArgs,
							  /* Function */ findCallback,
							  /* Function */ errorCallback){
		// summary:
		//		See dojo/data/util.simpleFetch.fetch()
		var self = this;

		if(this._loadFinished){
			this.filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions), findCallback);
		}else{
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated(this.declaredClass + ": ",
					"To change the url, set the url property of the store," +
						" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){
				//If fetches come in before the loading has finished, but while
				//a load is in progress, we have to defer the fetching to be
				//invoked in the callback.
				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs, filter: lang.hitch(self, "filter"), findCallback: lang.hitch(self, findCallback)});
				}else{
					this._loadInProgress = true;
					var getArgs = {
						url: self._jsonFileUrl,
						handleAs: "json-comment-optional",
						preventCache: this.urlPreventCache,
						failOk: this.failOk
					};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;

							self.filter(keywordArgs, self._getItemsArray(keywordArgs.queryOptions), findCallback);
							self._handleQueuedFetches();
						}catch(e){
							self._loadFinished = true;
							self._loadInProgress = false;
							errorCallback(e, keywordArgs);
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						errorCallback(error, keywordArgs);
					});

					//Wire up the cancel to abort of the request
					//This call cancel on the deferred if it hasn't been called
					//yet and then will chain to the simple abort of the
					//simpleFetch keywordArgs
					var oldAbort = null;
					if(keywordArgs.abort){
						oldAbort = keywordArgs.abort;
					}
					keywordArgs.abort = function(){
						var df = getHandler;
						if(df && df.fired === -1){
							df.cancel();
							df = null;
						}
						if(oldAbort){
							oldAbort.call(keywordArgs);
						}
					};
				}
			}else if(this._jsonData){
				try{
					this._loadFinished = true;
					this._getItemsFromLoadedData(this._jsonData);
					this._jsonData = null;
					self.filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions), findCallback);
				}catch(e){
					errorCallback(e, keywordArgs);
				}
			}else{
				errorCallback(new Error(this.declaredClass + ": No JSON source data was provided as either URL or a nested Javascript object."), keywordArgs);
			}
		}
	},

	_handleQueuedFetches: function(){
		// summary:
		//		Internal function to execute delayed request in the store.
		
		//Execute any deferred fetches now.
		if(this._queuedFetches.length > 0){
			for(var i = 0; i < this._queuedFetches.length; i++){
				var fData = this._queuedFetches[i],
					delayedQuery = fData.args,
					delayedFilter = fData.filter,
					delayedFindCallback = fData.findCallback;
				if(delayedFilter){
					delayedFilter(delayedQuery, this._getItemsArray(delayedQuery.queryOptions), delayedFindCallback);
				}else{
					this.fetchItemByIdentity(delayedQuery);
				}
			}
			this._queuedFetches = [];
		}
	},

	_getItemsArray: function(/*object?*/queryOptions){
		// summary:
		//		Internal function to determine which list of items to search over.
		// queryOptions: The query options parameter, if any.
		if(queryOptions && queryOptions.deep){
			return this._arrayOfAllItems;
		}
		return this._arrayOfTopLevelItems;
	},

	close: function(/*dojo/data/api/Request|Object?*/ request){
		// summary:
		//		See dojo/data/api/Read.close()
		if(this.clearOnClose &&
			this._loadFinished &&
			!this._loadInProgress){
			//Reset all internalsback to default state.  This will force a reload
			//on next fetch.  This also checks that the data or url param was set
			//so that the store knows it can get data.  Without one of those being set,
			//the next fetch will trigger an error.

			if(((this._jsonFileUrl == "" || this._jsonFileUrl == null) &&
				(this.url == "" || this.url == null)
				) && this.data == null){
				console.debug(this.declaredClass + ": WARNING!  Data reload " +
					" information has not been provided." +
					"  Please set 'url' or 'data' to the appropriate value before" +
					" the next fetch");
			}
			this._arrayOfAllItems = [];
			this._arrayOfTopLevelItems = [];
			this._loadFinished = false;
			this._itemsByIdentity = null;
			this._loadInProgress = false;
			this._queuedFetches = [];
		}
	},

	_getItemsFromLoadedData: function(/* Object */ dataObject){
		// summary:
		//		Function to parse the loaded data into item format and build the internal items array.
		// description:
		//		Function to parse the loaded data into item format and build the internal items array.
		// dataObject:
		//		The JS data object containing the raw data to convery into item format.
		// returns: Array
		//		Array of items in store item format.

		// First, we define a couple little utility functions...
		var addingArrays = false,
			self = this;

		function valueIsAnItem(/* anything */ aValue){
			// summary:
			//		Given any sort of value that could be in the raw json data,
			//		return true if we should interpret the value as being an
			//		item itself, rather than a literal value or a reference.
			// example:
			// 	|	false == valueIsAnItem("Kermit");
			// 	|	false == valueIsAnItem(42);
			// 	|	false == valueIsAnItem(new Date());
			// 	|	false == valueIsAnItem({_type:'Date', _value:'1802-05-14'});
			// 	|	false == valueIsAnItem({_reference:'Kermit'});
			// 	|	true == valueIsAnItem({name:'Kermit', color:'green'});
			// 	|	true == valueIsAnItem({iggy:'pop'});
			// 	|	true == valueIsAnItem({foo:42});
			return (aValue !== null) &&
				(typeof aValue === "object") &&
				(!lang.isArray(aValue) || addingArrays) &&
				(!lang.isFunction(aValue)) &&
				(aValue.constructor == Object || lang.isArray(aValue)) &&
				(typeof aValue._reference === "undefined") &&
				(typeof aValue._type === "undefined") &&
				(typeof aValue._value === "undefined") &&
				self.hierarchical;
		}

		function addItemAndSubItemsToArrayOfAllItems(/* dojo/data/api/Item */ anItem){
			self._arrayOfAllItems.push(anItem);
			for(var attribute in anItem){
				var valueForAttribute = anItem[attribute];
				if(valueForAttribute){
					if(lang.isArray(valueForAttribute)){
						var valueArray = valueForAttribute;
						for(var k = 0; k < valueArray.length; ++k){
							var singleValue = valueArray[k];
							if(valueIsAnItem(singleValue)){
								addItemAndSubItemsToArrayOfAllItems(singleValue);
							}
						}
					}else{
						if(valueIsAnItem(valueForAttribute)){
							addItemAndSubItemsToArrayOfAllItems(valueForAttribute);
						}
					}
				}
			}
		}

		this._labelAttr = dataObject.label;

		// We need to do some transformations to convert the data structure
		// that we read from the file into a format that will be convenient
		// to work with in memory.

		// Step 1: Walk through the object hierarchy and build a list of all items
		var i,
			item;
		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = dataObject.items;

		for(i = 0; i < this._arrayOfTopLevelItems.length; ++i){
			item = this._arrayOfTopLevelItems[i];
			if(lang.isArray(item)){
				addingArrays = true;
			}
			addItemAndSubItemsToArrayOfAllItems(item);
			item[this._rootItemPropName]=true;
		}

		// Step 2: Walk through all the attribute values of all the items,
		// and replace single values with arrays.  For example, we change this:
		//		{ name:'Miss Piggy', pets:'Foo-Foo'}
		// into this:
		//		{ name:['Miss Piggy'], pets:['Foo-Foo']}
		//
		// We also store the attribute names so we can validate our store
		// reference and item id special properties for the O(1) isItem
		var allAttributeNames = {},
			key;

		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			for(key in item){
				if(key !== this._rootItemPropName){
					var value = item[key];
					if(value !== null){
						if(!lang.isArray(value)){
							item[key] = [value];
						}
					}else{
						item[key] = [null];
					}
				}
				allAttributeNames[key]=key;
			}
		}

		// Step 3: Build unique property names to use for the _storeRefPropName and _itemNumPropName
		// This should go really fast, it will generally never even run the loop.
		while(allAttributeNames[this._storeRefPropName]){
			this._storeRefPropName += "_";
		}
		while(allAttributeNames[this._itemNumPropName]){
			this._itemNumPropName += "_";
		}
		while(allAttributeNames[this._reverseRefMap]){
			this._reverseRefMap += "_";
		}

		// Step 4: Some data files specify an optional 'identifier', which is
		// the name of an attribute that holds the identity of each item.
		// If this data file specified an identifier attribute, then build a
		// hash table of items keyed by the identity of the items.
		var arrayOfValues;

		var identifier = dataObject.identifier;
		if(identifier){
			this._itemsByIdentity = {};
			this._features['dojo.data.api.Identity'] = identifier;
			for(i = 0; i < this._arrayOfAllItems.length; ++i){
				item = this._arrayOfAllItems[i];
				arrayOfValues = item[identifier];
				var identity = arrayOfValues[0];
				if(!Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
					this._itemsByIdentity[identity] = item;
				}else{
					if(this._jsonFileUrl){
						throw new Error(this.declaredClass + ":  The json data as specified by: [" + this._jsonFileUrl + "] is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}else if(this._jsonData){
						throw new Error(this.declaredClass + ":  The json data provided by the creation arguments is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}
				}
			}
		}else{
			this._features['dojo.data.api.Identity'] = Number;
		}

		// Step 5: Walk through all the items, and set each item's properties
		// for _storeRefPropName and _itemNumPropName, so that store.isItem() will return true.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			item[this._storeRefPropName] = this;
			item[this._itemNumPropName] = i;
		}

		// Step 6: We walk through all the attribute values of all the items,
		// looking for type/value literals and item-references.
		//
		// We replace item-references with pointers to items.  For example, we change:
		//		{ name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
		// into this:
		//		{ name:['Kermit'], friends:[miss_piggy] }
		// (where miss_piggy is the object representing the 'Miss Piggy' item).
		//
		// We replace type/value pairs with typed-literals.  For example, we change:
		//		{ name:['Nelson Mandela'], born:[{_type:'Date', _value:'1918-07-18'}] }
		// into this:
		//		{ name:['Kermit'], born:(new Date(1918, 6, 18)) }
		//
		// We also generate the associate map for all items for the O(1) isItem function.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i]; // example: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
			for(key in item){
				arrayOfValues = item[key]; // example: [{_reference:{name:'Miss Piggy'}}]
				for(var j = 0; j < arrayOfValues.length; ++j){
					value = arrayOfValues[j]; // example: {_reference:{name:'Miss Piggy'}}
					if(value !== null && typeof value == "object"){
						if(("_type" in value) && ("_value" in value)){
							var type = value._type; // examples: 'Date', 'Color', or 'ComplexNumber'
							var mappingObj = this._datatypeMap[type]; // examples: Date, dojo.Color, foo.math.ComplexNumber, {type: dojo.Color, deserialize(value){ return new dojo.Color(value)}}
							if(!mappingObj){
								throw new Error("dojo.data.ItemFileReadStore: in the typeMap constructor arg, no object class was specified for the datatype '" + type + "'");
							}else if(lang.isFunction(mappingObj)){
								arrayOfValues[j] = new mappingObj(value._value);
							}else if(lang.isFunction(mappingObj.deserialize)){
								arrayOfValues[j] = mappingObj.deserialize(value._value);
							}else{
								throw new Error("dojo.data.ItemFileReadStore: Value provided in typeMap was neither a constructor, nor a an object with a deserialize function");
							}
						}
						if(value._reference){
							var referenceDescription = value._reference; // example: {name:'Miss Piggy'}
							if(!lang.isObject(referenceDescription)){
								// example: 'Miss Piggy'
								// from an item like: { name:['Kermit'], friends:[{_reference:'Miss Piggy'}]}
								arrayOfValues[j] = this._getItemByIdentity(referenceDescription);
							}else{
								// example: {name:'Miss Piggy'}
								// from an item like: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
								for(var k = 0; k < this._arrayOfAllItems.length; ++k){
									var candidateItem = this._arrayOfAllItems[k],
										found = true;
									for(var refKey in referenceDescription){
										if(candidateItem[refKey] != referenceDescription[refKey]){
											found = false;
										}
									}
									if(found){
										arrayOfValues[j] = candidateItem;
									}
								}
							}
							if(this.referenceIntegrity){
								var refItem = arrayOfValues[j];
								if(this.isItem(refItem)){
									this._addReferenceToMap(refItem, item, key);
								}
							}
						}else if(this.isItem(value)){
							//It's a child item (not one referenced through _reference).
							//We need to treat this as a referenced item, so it can be cleaned up
							//in a write store easily.
							if(this.referenceIntegrity){
								this._addReferenceToMap(value, item, key);
							}
						}
					}
				}
			}
		}
	},

	_addReferenceToMap: function(/*item*/ refItem, /*item*/ parentItem, /*string*/ attribute){
		// summary:
		//		Method to add an reference map entry for an item and attribute.
		// description:
		//		Method to add an reference map entry for an item and attribute.
		// refItem:
		//		The item that is referenced.
		// parentItem:
		//		The item that holds the new reference to refItem.
		// attribute:
		//		The attribute on parentItem that contains the new reference.

		//Stub function, does nothing.  Real processing is in ItemFileWriteStore.
	},

	getIdentity: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Identity.getIdentity()
		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			return item[this._itemNumPropName]; // Number
		}else{
			var arrayOfValues = item[identifier];
			if(arrayOfValues){
				return arrayOfValues[0]; // Object|String
			}
		}
		return null; // null
	},

	fetchItemByIdentity: function(/* Object */ keywordArgs){
		// summary:
		//		See dojo/data/api/Identity.fetchItemByIdentity()

		// Hasn't loaded yet, we have to trigger the load.
		var item,
			scope;
		if(!this._loadFinished){
			var self = this;
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated(this.declaredClass + ": ",
					"To change the url, set the url property of the store," +
						" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null && this._jsonData == null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){

				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs});
				}else{
					this._loadInProgress = true;
					var getArgs = {
						url: self._jsonFileUrl,
						handleAs: "json-comment-optional",
						preventCache: this.urlPreventCache,
						failOk: this.failOk
					};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						var scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;
							item = self._getItemByIdentity(keywordArgs.identity);
							if(keywordArgs.onItem){
								keywordArgs.onItem.call(scope, item);
							}
							self._handleQueuedFetches();
						}catch(error){
							self._loadInProgress = false;
							if(keywordArgs.onError){
								keywordArgs.onError.call(scope, error);
							}
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						if(keywordArgs.onError){
							var scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
							keywordArgs.onError.call(scope, error);
						}
					});
				}

			}else if(this._jsonData){
				// Passed in data, no need to xhr.
				self._getItemsFromLoadedData(self._jsonData);
				self._jsonData = null;
				self._loadFinished = true;
				item = self._getItemByIdentity(keywordArgs.identity);
				if(keywordArgs.onItem){
					scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
					keywordArgs.onItem.call(scope, item);
				}
			}
		}else{
			// Already loaded.  We can just look it up and call back.
			item = this._getItemByIdentity(keywordArgs.identity);
			if(keywordArgs.onItem){
				scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
				keywordArgs.onItem.call(scope, item);
			}
		}
	},

	_getItemByIdentity: function(/* Object */ identity){
		// summary:
		//		Internal function to look an item up by its identity map.
		var item = null;
		if(this._itemsByIdentity){
			// If this map is defined, we need to just try to get it.  If it fails
			// the item does not exist.
			if(Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
				item = this._itemsByIdentity[identity];
			}
		}else if (Object.hasOwnProperty.call(this._arrayOfAllItems, identity)){
			item = this._arrayOfAllItems[identity];
		}
		if(item === undefined){
			item = null;
		}
		return item; // Object
	},

	getIdentityAttributes: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Identity.getIdentityAttributes()

		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			// If (identifier === Number) it means getIdentity() just returns
			// an integer item-number for each item.  The dojo/data/api/Identity
			// spec says we need to return null if the identity is not composed
			// of attributes
			return null; // null
		}else{
			return [identifier]; // Array
		}
	},

	_forceLoad: function(){
		// summary:
		//		Internal function to force a load of the store if it hasn't occurred yet.  This is required
		//		for specific functions to work properly.
		var self = this;
		//Do a check on the JsonFileUrl and crosscheck it.
		//If it doesn't match the cross-check, it needs to be updated
		//This allows for either url or _jsonFileUrl to he changed to
		//reset the store load location.  Done this way for backwards
		//compatibility.  People use _jsonFileUrl (even though officially
		//private.
		if(this._jsonFileUrl !== this._ccUrl){
			kernel.deprecated(this.declaredClass + ": ",
				"To change the url, set the url property of the store," +
					" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
			this._ccUrl = this._jsonFileUrl;
			this.url = this._jsonFileUrl;
		}else if(this.url !== this._ccUrl){
			this._jsonFileUrl = this.url;
			this._ccUrl = this.url;
		}

		//See if there was any forced reset of data.
		if(this.data != null){
			this._jsonData = this.data;
			this.data = null;
		}

		if(this._jsonFileUrl){
			var getArgs = {
				url: this._jsonFileUrl,
				handleAs: "json-comment-optional",
				preventCache: this.urlPreventCache,
				failOk: this.failOk,
				sync: true
			};
			var getHandler = xhr.get(getArgs);
			getHandler.addCallback(function(data){
				try{
					//Check to be sure there wasn't another load going on concurrently
					//So we don't clobber data that comes in on it.  If there is a load going on
					//then do not save this data.  It will potentially clobber current data.
					//We mainly wanted to sync/wait here.
					//TODO:  Revisit the loading scheme of this store to improve multi-initial
					//request handling.
					if(self._loadInProgress !== true && !self._loadFinished){
						self._getItemsFromLoadedData(data);
						self._loadFinished = true;
					}else if(self._loadInProgress){
						//Okay, we hit an error state we can't recover from.  A forced load occurred
						//while an async load was occurring.  Since we cannot block at this point, the best
						//that can be managed is to throw an error.
						throw new Error(this.declaredClass + ":  Unable to perform a synchronous load, an async load is in progress.");
					}
				}catch(e){
					console.log(e);
					throw e;
				}
			});
			getHandler.addErrback(function(error){
				throw error;
			});
		}else if(this._jsonData){
			self._getItemsFromLoadedData(self._jsonData);
			self._jsonData = null;
			self._loadFinished = true;
		}
	}
});
//Mix in the simple fetch implementation to this class.
lang.extend(ItemFileReadStore,simpleFetch);

return ItemFileReadStore;

});

},
'dojo/data/util/filter':function(){
define(["../../_base/lang"], function(lang){
	// module:
	//		dojo/data/util/filter
	// summary:
	//		TODOC

var filter = {};
lang.setObject("dojo.data.util.filter", filter);

filter.patternToRegExp = function(/*String*/pattern, /*boolean?*/ ignoreCase){
	// summary:
	//		Helper function to convert a simple pattern to a regular expression for matching.
	// description:
	//		Returns a regular expression object that conforms to the defined conversion rules.
	//		For example:
	//
	//		- ca*   -> /^ca.*$/
	//		- *ca*  -> /^.*ca.*$/
	//		- *c\*a*  -> /^.*c\*a.*$/
	//		- *c\*a?*  -> /^.*c\*a..*$/
	//
	//		and so on.
	// pattern: string
	//		A simple matching pattern to convert that follows basic rules:
	//
	//		- * Means match anything, so ca* means match anything starting with ca
	//		- ? Means match single character.  So, b?b will match to bob and bab, and so on.
	//		- \ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
	//
	//		To use a \ as a character in the string, it must be escaped.  So in the pattern it should be
	//		represented by \\ to be treated as an ordinary \ character instead of an escape.
	// ignoreCase:
	//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
	//		By default, it is assumed case sensitive.

	var rxp = "^";
	var c = null;
	for(var i = 0; i < pattern.length; i++){
		c = pattern.charAt(i);
		switch(c){
			case '\\':
				rxp += c;
				i++;
				rxp += pattern.charAt(i);
				break;
			case '*':
				rxp += ".*"; break;
			case '?':
				rxp += "."; break;
			case '$':
			case '^':
			case '/':
			case '+':
			case '.':
			case '|':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				rxp += "\\"; //fallthrough
			default:
				rxp += c;
		}
	}
	rxp += "$";
	if(ignoreCase){
		return new RegExp(rxp,"mi"); //RegExp
	}else{
		return new RegExp(rxp,"m"); //RegExp
	}

};

return filter;
});

},
'dojo/data/util/simpleFetch':function(){
define(["../../_base/lang", "../../_base/kernel", "./sorter"],
  function(lang, kernel, sorter){
	// module:
	//		dojo/data/util/simpleFetch
	// summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.

var simpleFetch = {};
lang.setObject("dojo.data.util.simpleFetch", simpleFetch);

simpleFetch.errorHandler = function(/*Object*/ errorData, /*Object*/ requestObject){
	// summary:
	//		The error handler when there is an error fetching items.  This function should not be called
	//		directly and is used by simpleFetch.fetch().
	if(requestObject.onError){
		var scope = requestObject.scope || kernel.global;
		requestObject.onError.call(scope, errorData, requestObject);
	}
};

simpleFetch.fetchHandler = function(/*Array*/ items, /*Object*/ requestObject){
	// summary:
	//		The handler when items are sucessfully fetched.  This function should not be called directly
	//		and is used by simpleFetch.fetch().
	var oldAbortFunction = requestObject.abort || null,
		aborted = false,

		startIndex = requestObject.start?requestObject.start: 0,
		endIndex = (requestObject.count && (requestObject.count !== Infinity))?(startIndex + requestObject.count):items.length;

	requestObject.abort = function(){
		aborted = true;
		if(oldAbortFunction){
			oldAbortFunction.call(requestObject);
		}
	};

	var scope = requestObject.scope || kernel.global;
	if(!requestObject.store){
		requestObject.store = this;
	}
	if(requestObject.onBegin){
		requestObject.onBegin.call(scope, items.length, requestObject);
	}
	if(requestObject.sort){
		items.sort(sorter.createSortFunction(requestObject.sort, this));
	}
	if(requestObject.onItem){
		for(var i = startIndex; (i < items.length) && (i < endIndex); ++i){
			var item = items[i];
			if(!aborted){
				requestObject.onItem.call(scope, item, requestObject);
			}
		}
	}
	if(requestObject.onComplete && !aborted){
		var subset = null;
		if(!requestObject.onItem){
			subset = items.slice(startIndex, endIndex);
		}
		requestObject.onComplete.call(scope, subset, requestObject);
	}
};

simpleFetch.fetch = function(/* Object? */ request){
	// summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.
	// description:
	//		The simpleFetch mixin should work well for any datastore that can respond to a _fetchItems()
	//		call by returning an array of all the found items that matched the query.  The simpleFetch mixin
	//		is not designed to work for datastores that respond to a fetch() call by incrementally
	//		loading items, or sequentially loading partial batches of the result
	//		set.  For datastores that mixin simpleFetch, simpleFetch
	//		implements a fetch method that automatically handles eight of the fetch()
	//		arguments -- onBegin, onItem, onComplete, onError, start, count, sort and scope
	//		The class mixing in simpleFetch should not implement fetch(),
	//		but should instead implement a _fetchItems() method.  The _fetchItems()
	//		method takes three arguments, the keywordArgs object that was passed
	//		to fetch(), a callback function to be called when the result array is
	//		available, and an error callback to be called if something goes wrong.
	//		The _fetchItems() method should ignore any keywordArgs parameters for
	//		start, count, onBegin, onItem, onComplete, onError, sort, and scope.
	//		The _fetchItems() method needs to correctly handle any other keywordArgs
	//		parameters, including the query parameter and any optional parameters
	//		(such as includeChildren).  The _fetchItems() method should create an array of
	//		result items and pass it to the fetchHandler along with the original request object --
	//		or, the _fetchItems() method may, if it wants to, create an new request object
	//		with other specifics about the request that are specific to the datastore and pass
	//		that as the request object to the handler.
	//
	//		For more information on this specific function, see dojo/data/api/Read.fetch()
	//
	// request:
	//		The keywordArgs parameter may either be an instance of
	//		conforming to dojo/data/api/Request or may be a simple anonymous object
	//		that may contain any of the following:
	// |	{
	// |		query: query-object or query-string,
	// |		queryOptions: object,
	// |		onBegin: Function,
	// |		onItem: Function,
	// |		onComplete: Function,
	// |		onError: Function,
	// |		scope: object,
	// |		start: int
	// |		count: int
	// |		sort: array
	// |	}
	//		All implementations should accept keywordArgs objects with any of
	//		the 9 standard properties: query, onBegin, onItem, onComplete, onError
	//		scope, sort, start, and count.  Some implementations may accept additional
	//		properties in the keywordArgs object as valid parameters, such as
	//		{includeOutliers:true}.
	//
	//		####The *query* parameter
	//
	//		The query may be optional in some data store implementations.
	//		The dojo/data/api/Read API does not specify the syntax or semantics
	//		of the query itself -- each different data store implementation
	//		may have its own notion of what a query should look like.
	//		However, as of dojo 0.9, 1.0, and 1.1, all the provided datastores in dojo.data
	//		and dojox.data support an object structure query, where the object is a set of
	//		name/value parameters such as { attrFoo: valueBar, attrFoo1: valueBar1}.  Most of the
	//		dijit widgets, such as ComboBox assume this to be the case when working with a datastore
	//		when they dynamically update the query.  Therefore, for maximum compatibility with dijit
	//		widgets the recommended query parameter is a key/value object.  That does not mean that the
	//		the datastore may not take alternative query forms, such as a simple string, a Date, a number,
	//		or a mix of such.  Ultimately, The dojo/data/api/Read API is agnostic about what the query
	//		format.
	//
	//		Further note:  In general for query objects that accept strings as attribute
	//		value matches, the store should also support basic filtering capability, such as *
	//		(match any character) and ? (match single character).  An example query that is a query object
	//		would be like: { attrFoo: "value*"}.  Which generally means match all items where they have
	//		an attribute named attrFoo, with a value that starts with 'value'.
	//
	//		####The *queryOptions* parameter
	//
	//		The queryOptions parameter is an optional parameter used to specify options that may modify
	//		the query in some fashion, such as doing a case insensitive search, or doing a deep search
	//		where all items in a hierarchical representation of data are scanned instead of just the root
	//		items.  It currently defines two options that all datastores should attempt to honor if possible:
	// |	{
	// |		ignoreCase: boolean, // Whether or not the query should match case sensitively or not.  Default behaviour is false.
	// |		deep: boolean	// Whether or not a fetch should do a deep search of items and all child
	// |						// items instead of just root-level items in a datastore.  Default is false.
	// |	}
	//
	//		####The *onBegin* parameter.
	//
	//		function(size, request);
	//		If an onBegin callback function is provided, the callback function
	//		will be called just once, before the first onItem callback is called.
	//		The onBegin callback function will be passed two arguments, the
	//		the total number of items identified and the Request object.  If the total number is
	//		unknown, then size will be -1.  Note that size is not necessarily the size of the
	//		collection of items returned from the query, as the request may have specified to return only a
	//		subset of the total set of items through the use of the start and count parameters.
	//
	//		####The *onItem* parameter.
	//
	//		function(item, request);
	//
	//		If an onItem callback function is provided, the callback function
	//		will be called as each item in the result is received. The callback
	//		function will be passed two arguments: the item itself, and the
	//		Request object.
	//
	//		####The *onComplete* parameter.
	//
	//		function(items, request);
	//
	//		If an onComplete callback function is provided, the callback function
	//		will be called just once, after the last onItem callback is called.
	//		Note that if the onItem callback is not present, then onComplete will be passed
	//		an array containing all items which matched the query and the request object.
	//		If the onItem callback is present, then onComplete is called as:
	//		onComplete(null, request).
	//
	//		####The *onError* parameter.
	//
	//		function(errorData, request);
	//
	//		If an onError callback function is provided, the callback function
	//		will be called if there is any sort of error while attempting to
	//		execute the query.
	//		The onError callback function will be passed two arguments:
	//		an Error object and the Request object.
	//
	//		####The *scope* parameter.
	//
	//		If a scope object is provided, all of the callback functions (onItem,
	//		onComplete, onError, etc) will be invoked in the context of the scope
	//		object.  In the body of the callback function, the value of the "this"
	//		keyword will be the scope object.   If no scope object is provided,
	//		the callback functions will be called in the context of dojo.global().
	//		For example, onItem.call(scope, item, request) vs.
	//		onItem.call(dojo.global(), item, request)
	//
	//		####The *start* parameter.
	//
	//		If a start parameter is specified, this is a indication to the datastore to
	//		only start returning items once the start number of items have been located and
	//		skipped.  When this parameter is paired with 'count', the store should be able
	//		to page across queries with millions of hits by only returning subsets of the
	//		hits for each query
	//
	//		####The *count* parameter.
	//
	//		If a count parameter is specified, this is a indication to the datastore to
	//		only return up to that many items.  This allows a fetch call that may have
	//		millions of item matches to be paired down to something reasonable.
	//
	//		####The *sort* parameter.
	//
	//		If a sort parameter is specified, this is a indication to the datastore to
	//		sort the items in some manner before returning the items.  The array is an array of
	//		javascript objects that must conform to the following format to be applied to the
	//		fetching of items:
	// |	{
	// |		attribute: attribute || attribute-name-string,
	// |		descending: true|false;   // Optional.  Default is false.
	// |	}
	//		Note that when comparing attributes, if an item contains no value for the attribute
	//		(undefined), then it the default ascending sort logic should push it to the bottom
	//		of the list.  In the descending order case, it such items should appear at the top of the list.

	request = request || {};
	if(!request.store){
		request.store = this;
	}

	this._fetchItems(request, lang.hitch(this, "fetchHandler"), lang.hitch(this, "errorHandler"));
	return request;	// Object
};

return simpleFetch;
});

},
'dojo/data/util/sorter':function(){
define(["../../_base/lang"], function(lang){
	// module:
	//		dojo/data/util/sorter
	// summary:
	//		TODOC

var sorter = {};
lang.setObject("dojo.data.util.sorter", sorter);

sorter.basicComparator = function(	/*anything*/ a,
													/*anything*/ b){
	// summary:
	//		Basic comparison function that compares if an item is greater or less than another item
	// description:
	//		returns 1 if a > b, -1 if a < b, 0 if equal.
	//		'null' values (null, undefined) are treated as larger values so that they're pushed to the end of the list.
	//		And compared to each other, null is equivalent to undefined.

	//null is a problematic compare, so if null, we set to undefined.
	//Makes the check logic simple, compact, and consistent
	//And (null == undefined) === true, so the check later against null
	//works for undefined and is less bytes.
	var r = -1;
	if(a === null){
		a = undefined;
	}
	if(b === null){
		b = undefined;
	}
	if(a == b){
		r = 0;
	}else if(a > b || a == null){
		r = 1;
	}
	return r; //int {-1,0,1}
};

sorter.createSortFunction = function(	/* attributes[] */sortSpec, /*dojo/data/api/Read*/ store){
	// summary:
	//		Helper function to generate the sorting function based off the list of sort attributes.
	// description:
	//		The sort function creation will look for a property on the store called 'comparatorMap'.  If it exists
	//		it will look in the mapping for comparisons function for the attributes.  If one is found, it will
	//		use it instead of the basic comparator, which is typically used for strings, ints, booleans, and dates.
	//		Returns the sorting function for this particular list of attributes and sorting directions.
	// sortSpec:
	//		A JS object that array that defines out what attribute names to sort on and whether it should be descenting or asending.
	//		The objects should be formatted as follows:
	// |	{
	// |		attribute: "attributeName-string" || attribute,
	// |		descending: true|false;   // Default is false.
	// |	}
	// store:
	//		The datastore object to look up item values from.

	var sortFunctions=[];

	function createSortFunction(attr, dir, comp, s){
		//Passing in comp and s (comparator and store), makes this
		//function much faster.
		return function(itemA, itemB){
			var a = s.getValue(itemA, attr);
			var b = s.getValue(itemB, attr);
			return dir * comp(a,b); //int
		};
	}
	var sortAttribute;
	var map = store.comparatorMap;
	var bc = sorter.basicComparator;
	for(var i = 0; i < sortSpec.length; i++){
		sortAttribute = sortSpec[i];
		var attr = sortAttribute.attribute;
		if(attr){
			var dir = (sortAttribute.descending) ? -1 : 1;
			var comp = bc;
			if(map){
				if(typeof attr !== "string" && ("toString" in attr)){
					 attr = attr.toString();
				}
				comp = map[attr] || bc;
			}
			sortFunctions.push(createSortFunction(attr,
				dir, comp, store));
		}
	}
	return function(rowA, rowB){
		var i=0;
		while(i < sortFunctions.length){
			var ret = sortFunctions[i++](rowA, rowB);
			if(ret !== 0){
				return ret;//int
			}
		}
		return 0; //int
	}; // Function
};

return sorter;
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

},
'demos/shippingRoutes/src/PortRenderer':function(){
define(["dojo/_base/kernel",
				"dojo/_base/declare",
				"./EcrRenderer",
				"dojox/geo/openlayers/GeometryFeature",
				"dojox/geo/openlayers/Point"], function(dojo, declare, EcrRenderer, GeometryFeature, Point){

	return declare(EcrRenderer, {

		constructor: function(opts, context){},

		_renderItem: function(o, item){
			var gf = null;
			if (o.type == "circle") {
				var coords = this.getCoordinates(item);
				var g = new Point({
					x: coords[0],
					y: coords[1]
				});
				gf = new GeometryFeature(g);
				gf.setShapeProperties({
					r: o.radius
				});
			}
			return gf;
		}
	});
});

},
'demos/shippingRoutes/src/EcrRenderer':function(){
define(["dojo/_base/kernel",
		"dojo/_base/declare",
		"dojo/_base/array",
		"dojo/_base/lang"], function(dojo, declare, arr, lang){

	return declare(null, {

		constructor: function(opts, context){
			this._options = opts;
			this._context = context;
		},

		render: function(item){
			var o = this._options;
			return this._render(o, item);
		},

		_render: function(o, item){
			if (o instanceof Array) {
				var features = [];
				o.sort(function(i1, i2){
			var d1 = i1.depth;
			var d2 = i2.depth;
			if (d1 != undefined && d2 != undefined) {
				var id1 = parseInt(d1);
				var id2 = parseInt(d2);
				if (id1 == id2)
					return 0;
				if (id1 < id2)
					return -1;
				return 1;
			}
			return 0;
				});
				arr.forEach(o, function(oi, index, array){

			var co = lang.clone(oi);
			this._callFunctions(co, item);
			this._solveReferences(co, item);

			var f = this._render(co, item);

			if (f != null) {
				f.setStroke(co.stroke);
				f.setFill(co.fill);
				features.push(f);
			}
				}, this);
				return features;
			}

			var co = lang.clone(o);
			this._callFunctions(co, item);
			this._solveReferences(co, item);
			var gf = this._renderItem(co, item);
			if (gf != null) {
				gf.setStroke(co.stroke);
				gf.setFill(co.fill);
			}
			return gf;
		},

		_renderItem: function(o, item){
			// subclasses should render
			return null;
		},

		_callFunctions: function(o, item){
			for ( var prop in o) {
				if (o.hasOwnProperty(prop)) {
			var v = o[prop];
			if (typeof v == 'function') {
				o[prop] = v.call(item, this._context);
			} else if (typeof v == 'object') {
				this._callFunctions(v, item);
			}
				}
			}
		},

		getContext: function(){
			return this._context;
		},

		getContextValue: function(name){
			if (this._context)
				return this._context[name];
			return undefined;
		},

		getValue: function(item, property){
			var s = this.getContextValue('store');
			if ((s != undefined) && s.isItem(item)) {
				return s.getValue(item, property);
			}
			if (item.hasOwnProperty(property)) {
				return item[property];
			}
			return undefined;
		},

		_coords: [0, 0],

		getCoordinates: function(item){
			var lon = this.getValue(item, "longitude");
			var lat = this.getValue(item, "latitude");
			var flon = parseFloat(lon);
			var flat = parseFloat(lat);
			var a = this._coords;
			a[0] = flon;
			a[1] = flat;
			return a;
		},

		_findAttributeValue: function(o, a, item){
			var v = undefined;
			if (item != null)
				v = this.getValue(item, a);
			if (v != undefined)
				return v;
			v = o[a];
			if (v != undefined)
				return v;

			for ( var i in o) {
				var ov = o[i];
				if (typeof (ov) == 'object') {
			var vv = this._findAttributeValue(ov, a, null);
			if (vv != undefined)
				return vv;
				}
			}
			return undefined;
		},

		_solveReferences: function(o, item){
			this.__solveReferences(o, o, item);
		},

		__solveReferences: function(oo, o, item){
			for ( var a in o) {
				var v = o[a];
				if (typeof (v) == 'object') {
			this.__solveReferences(oo, v, item);
				}
				if (typeof (v) == 'string') {
			var re = /{(.*)}/;
			if (v.match(re)) {
				v = v.replace(re, "$1");
				var r = this._findAttributeValue(oo, v, item);
				if (r != undefined) {
					var ps = parseFloat(r);
					if (isNaN(ps))
				o[a] = r;
					else
				o[a] = ps;
				}
			}
				}
			}
		}
	});
});

},
'dojox/geo/openlayers/GeometryFeature':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojox/gfx/matrix",
	"./Point",
	"./LineString",
	"./Collection",
	"./Feature"
], function(declare, array, lang, matrix, Point, LineString, Collection, Feature){

	return declare("dojox.geo.openlayers.GeometryFeature", Feature, {
		// summary:
		//		A Feature encapsulating a geometry.
		// description:
		//		This Feature renders a geometry such as a Point or LineString geometry. This Feature
		//		is responsible for reprojecting the geometry before creating a gfx shape to display it.
		//		By default the shape created is a circle for a Point geometry and a polyline for a 
		//		LineString geometry. User can change these behavior by overriding the createShape 
		//		method to create the desired shape.
		// example:
		//	|  var geom = new dojox.geo.openlayers.Point({x:0, y:0});
		//	|  var gf = new dojox.geo.openlayers.GeometryFeature(geom);

		constructor: function(geometry){
			// summary:
			//		Constructs a GeometryFeature for the specified geometry.
			// geometry: dojox/geo/openlayers/Geometry
			//		The geometry to render.
			this._geometry = geometry;
			this._shapeProperties = {};
			this._fill = null;
			this._stroke = null;
		},

		_createCollection: function(/* dojox/geo/openlayers/Geometry */g){
			// summary:
			//		Create collection shape and add it to the viewport.
			// tags:
			//		private
			var layer = this.getLayer();
			var s = layer.getSurface();
			var c = this.createShape(s, g);
			var vp = layer.getViewport();
			vp.add(c);
			return c;
		},

		_getCollectionShape: function(/* dojox/geo/openlayers/Geometry */g){
			// summary:
			//		Get the collection shape, create it if necessary
			// tags:
			//		private
			var s = g.shape;
			if(s == null){
				s = this._createCollection(g);
				g.shape = s;
			}
			return s;
		},

		renderCollection: function(g){
			// summary:
			//		Renders a geometry collection.
			// g: dojox.geo.openlayers.Geometry?
			//		The geometry to render.
			if(g == undefined){
				g = this._geometry;
			}

			s = this._getCollectionShape(g);
			var prop = this.getShapeProperties();
			s.setShape(prop);

			array.forEach(g.coordinates, function(item){
				if(item instanceof Point){
					this.renderPoint(item);
				}else if(item instanceof LineString){
					this.renderLineString(item);
				}else if(item instanceof Collection){
					this.renderCollection(item);
				}else{
					throw new Error();
				}
			}, this);
			this._applyStyle(g);
		},

		render: function(g){
			// summary:
			//		Render a geometry. 
			//		Called by the Layer on which the feature is added. 
			// g: dojox/geo/openlayer/Geometry?
			//		The geometry to draw
			if(g == undefined){
				g = this._geometry;
			}

			if(g instanceof Point){
				this.renderPoint(g);
			}else if(g instanceof LineString){
				this.renderLineString(g);
			}else if(g instanceof Collection){
				this.renderCollection(g);
			}else{
				throw new Error();
			}
		},

		getShapeProperties: function(){
			// summary:
			//		Returns the shape properties. 
			// returns: Object
			//		The shape properties.
			return this._shapeProperties;
		},

		setShapeProperties: function(s){
			// summary:
			//		Sets the shape properties. 
			// s: Object
			//		The shape properties to set.
			this._shapeProperties = s;
			return this;
		},

		createShape: function(s, g){
			// summary:
			//		Called when the shape rendering the geometry has to be created.
			//		This default implementation creates a circle for a point geometry, a polyline for
			//		a LineString geometry and is recursively called when creating a collection.
			//		User may replace this method to produce a custom shape.
			// s: dojox/gfx/Surface
			//		The surface on which the method create the shapes.
			// g: dojox/geo/openlayers/Geometry?
			//		The reference geometry 
			// returns:
			//		The resulting shape.
			if(!g){
				g = this._geometry;
			}

			var shape = null;
			if(g instanceof Point){
				shape = s.createCircle();
			}else if(g instanceof LineString){
				shape = s.createPolyline();
			}else if(g instanceof Collection){
				var grp = s.createGroup();
				array.forEach(g.coordinates, function(item){
					var shp = this.createShape(s, item);
					grp.add(shp);
				}, this);
				shape = grp;
			}else{
				throw new Error();
			}
			return shape;
		},

		getShape: function(){
			// summary:
			//		Returns the shape rendering the geometry
			// returns:
			//		The shape used to render the geometry.
			var g = this._geometry;
			if(!g){
				return null;
			}
			if(g.shape){
				return g.shape;
			}
			this.render();
			return g.shape; // dojox.gfx.shape.Shape
		},

		_createPoint: function(/* dojox/geo/openlayer/Geometry */g){
			// summary:
			//		Create a point shape
			// tags:
			//		private
			var layer = this.getLayer();
			var s = layer.getSurface();
			var c = this.createShape(s, g);
			var vp = layer.getViewport();
			vp.add(c);
			return c;
		},

		_getPointShape: function(/* dojox/geo/openlayers/Geometry */g){
			// summary:
			//		get the point geometry shape, create it if necessary
			// tags:
			//		private
			var s = g.shape;
			if(s == null){
				s = this._createPoint(g);
				g.shape = s;
			}
			return s;
		},

		renderPoint: function(g){
			// summary:
			//		Renders a point geometry.
			// g: dojox/geo/openlayers/Point?
			//		The geometry to render, or the current instance geometry if not specified.
			if(g == undefined){
				g = this._geometry;
			}
			var layer = this.getLayer();
			var map = layer.getDojoMap();

			s = this._getPointShape(g);
			var prop = lang.mixin({}, this._defaults.pointShape);
			prop = lang.mixin(prop, this.getShapeProperties());
			s.setShape(prop);

			var from = this.getCoordinateSystem();
			var p = map.transform(g.coordinates, from);

			var a = this._getLocalXY(p);
			var cx = a[0];
			var cy = a[1];
			var tr = layer.getViewport().getTransform();
			if(tr){
				s.setTransform(matrix.translate(cx - tr.dx, cy - tr.dy));
			}
			this._applyStyle(g);
		},

		_createLineString: function(/* dojox/geo/openlayers/Geometry */g){
			// summary:
			//		Create polyline shape and add it to the viewport.
			// tags:
			//		private
			var layer = this.getLayer();
			var s = layer._surface;
			var shape = this.createShape(s, g);
			var vp = layer.getViewport();
			vp.add(shape);
			g.shape = shape;
			return shape;
		},

		_getLineStringShape: function(/* dojox/geo/openlayers/Geometry */g){
			// summary:
			//		Get the line string geometry shape, create it if necessary
			// tags:
			//		private
			var s = g.shape;
			if(s == null){
				s = this._createLineString(g);
				g.shape = s;
			}
			return s;
		},

		renderLineString: function(g){
			// summary:
			//		Renders a line string geometry.
			// g: dojox/geo/openlayers/Geometry?
			//		The geometry to render.
			if(g == undefined){
				g = this._geometry;
			}
			var layer = this.getLayer();
			var map = layer.getDojoMap();
			var lss = this._getLineStringShape(g);
			var from = this.getCoordinateSystem();
			var points = new Array(g.coordinates.length); // ss.getShape().points;		
			var tr = layer.getViewport().getTransform();
			array.forEach(g.coordinates, function(c, i, array){
				var p = map.transform(c, from);
				var a = this._getLocalXY(p);
				if(tr){
					a[0] -= tr.dx;
					a[1] -= tr.dy;
				}
				points[i] = {
					x: a[0],
					y: a[1]
				};
			}, this);
			var prop = lang.mixin({}, this._defaults.lineStringShape);
			prop = lang.mixin(prop, this.getShapeProperties());
			prop = lang.mixin(prop, {
				points: points
			});
			lss.setShape(prop);
			this._applyStyle(g);
		},

		_applyStyle: function(g){
			// summary:
			//		Apply the style on the geometry's shape.
			// g: Geometry
			//		The geometry.
			// tags:
			//		private
			if(!g || !g.shape){
				return;
			}

			var f = this.getFill();

			var fill;
			if(!f || lang.isString(f) || lang.isArray(f)){
				fill = f;
			}else{
				fill = lang.mixin({}, this._defaults.fill);
				fill = lang.mixin(fill, f);
			}

			var s = this.getStroke();
			var stroke;
			if(!s || lang.isString(s) || lang.isArray(s)){
				stroke = s;
			}else{
				stroke = lang.mixin({}, this._defaults.stroke);
				stroke = lang.mixin(stroke, s);
			}

			this._applyRecusiveStyle(g, stroke, fill);
		},

		_applyRecusiveStyle: function(g, stroke, fill){
			// summary:
			//		Apply the style on the geometry's shape recursively.
			// g: dojox.geo.openlayers.Geometry
			//		The geometry.
			// stroke: Object
			//		The stroke
			// fill:Object
			//		The fill
			// tags:
			//		private
			var shp = g.shape;

			if(shp.setFill){
				shp.setFill(fill);
			}

			if(shp.setStroke){
				shp.setStroke(stroke);
			}

			if(g instanceof Collection){
				array.forEach(g.coordinates, function(i){
					this._applyRecusiveStyle(i, stroke, fill);
				}, this);
			}
		},

		setStroke: function(s){
			// summary:
			//		Set the stroke style to be applied on the rendered shape.
			// s: Object
			//		The stroke style
			this._stroke = s;
			return this;
		},

		getStroke: function(){
			// summary:
			//		Returns the stroke style
			// returns:
			//		The stroke style
			return this._stroke;
		},

		setFill: function(f){
			// summary:
			//		Set the fill style to be applied on the rendered shape.
			// f: Object
			//		The fill style
			this._fill = f;
			return this;
		},

		getFill: function(){
			// summary:
			//		Returns the fill style
			// returns:
			//		The fill style
			return this._fill;
		},

		remove: function(){
			// summary:
			//		Removes the shape from the Surface. 
			//		Called when the feature is removed from the layer.
			var g = this._geometry;
			var shp = g.shape;
			g.shape = null;
			if(shp){
				shp.removeShape();
			}
			if(g instanceof Collection){
				array.forEach(g.coordinates, function(i){
					this.remove(i);
				}, this);
			}
		},

		_defaults: {
			fill: null,
			stroke: null,
			pointShape: {
				r: 30
			},
			lineStringShape: null
		}

	});
});

},
'dojox/geo/openlayers/Point':function(){
define([
	"dojo/_base/declare",
	"./Geometry"
], function(declare, Geometry){

	return declare("dojox.geo.openlayers.Point", Geometry, {
		// summary:
		//		A Point geometry handles description of points to be rendered in a GfxLayer

		setPoint: function(p){
			// summary:
			//		Sets the point for this geometry.
			// p: Object
			//		The point geometry expressed as a {x, y} object.
			this.coordinates = p;
		},

		getPoint: function(){
			// summary:
			//		Gets the point defining this geometry.
			// returns:
			//		The point defining this geometry.
			return this.coordinates; // Object
		}
	});
});

},
'dojox/geo/openlayers/Geometry':function(){
define([
	"dojo/_base/declare"
], function(declare){

	return declare("dojox.geo.openlayers.Geometry", null, {
		// summary:
		//		A Geometry handles description of shapes to be rendered in a GfxLayer
		//		using a GeometryFeature feature.
		//		A Geometry can be:
		//
		//		- A point geometry of type dojox.geo.openlayers.Point. Coordinates are a an 
		//		Object {x, y}
		//		- A line string geometry of type dojox.geo.openlayers.LineString. Coordinates are
		//		an array of {x, y} objects
		//		- A collection geometry of type dojox.geo.openlayers.Collection. Coordinates are an array of geometries.

		// coordinates: Object|Array
		//		The coordinates of the geometry, Object like {x, y} or Array.
		coordinates : null,

		// shape: [private] dojox/gfx/shape.Shape
		//		The associated shape when rendered
		shape: null,

		constructor: function(coords){
			// summary:
			//		Constructs a new geometry
			// coords: Object
			//		Coordinates of the geometry. {x:``x``, y:``y``} object for a point geometry, array of {x:``x``, y:``y``}
			//		objects for line string geometry, array of geometries for collection geometry.
			this.coordinates = coords;
		}
	});
});

},
'dojox/geo/openlayers/LineString':function(){
define([
	"dojo/_base/declare",
	"./Geometry"
], function(declare, Geometry){

	return declare("dojox.geo.openlayers.LineString", Geometry, {
		// summary:
		//		The `dojox.geo.openlayers.LineString` geometry. This geometry holds an array
		//		of coordinates.

		setPoints: function(p){
			// summary:
			//		Sets the points for this geometry.
			// p: Object[]
			//		An array of {x, y} objects
			this.coordinates = p;
		},

		getPoints: function(){
			// summary:
			//		Gets the points of this geometry.
			// returns:
			//		The points of this geometry.
			return this.coordinates; // Object[]
		}

	});
});

},
'dojox/geo/openlayers/Collection':function(){
define([
	"dojo/_base/declare",
	"./Geometry"
], function(declare, Geometry){

	return declare("dojox.geo.openlayers.Collection", Geometry, {
		// summary:
		//		A collection of geometries. 

		// coordinates: Array
		//		An array of geometries.
		coordinates:null,

		setGeometries: function(g){
			// summary:
			//		Sets the geometries
			// g: Array
			//		The array of geometries.
			this.coordinates = g;
		},

		getGeometries: function(){
			// summary:
			//		Returns the geometries.
			// returns:
			//		The array of geometries defining this collection.
			return this.coordinates; // Array
		}
	});
});

},
'demos/shippingRoutes/src/LegsRenderer':function(){
define(["dojo/_base/declare",
		"dojo/_base/array",
		"./EcrRenderer",
		"dojox/geo/openlayers/GeometryFeature",
		"dojox/geo/openlayers/LineString",
		"dojox/geo/openlayers/Point",
		"dojox/geo/openlayers/GreatCircle"], 
		function(declare, arr, EcrRenderer, GeometryFeature, LineString,
				Point, GreatCircle){

	return declare(EcrRenderer, {

		constructor: function(opts, context){
			this._geodetic = false;
			this._greatCircle = null;
		},

		setGeodetic: function(value){
			this._geodetic = value;
		},

		getGeodetic: function(){
			return this._geodetic;
		},

		_renderItem: function(o, item){
			var gf = null;
			if (o.type == "polyline") {
				var store = this.getContextValue('store');
				var stops = store.getValues(item, 'stops');
				var pts = [];
				var lastCoords = null;
				arr.forEach(stops, function(it, index, array){
					if (store.isItem(it)) {
						var port = this.getValue(it, "port");
						var coords = this.getCoordinates(port);
						if (this.getGeodetic()) {
							if (lastCoords != null) {
								var current = {
									x: coords[0],
									y: coords[1]
								};
								var geodetic = GreatCircle.toPointArray(lastCoords, current, 5);
								pts = pts.concat(geodetic);
							}
						} else {
							var p = new Point({
								x: coords[0],
								y: coords[1]
							});
							pts.push(p);
						}
						lastCoords = {
							x: coords[0],
							y: coords[1]
						};
					}
				}, this);

				var g = new LineString(pts);
				gf = new GeometryFeature(g);
			}
			return gf;
		}
	});
});

},
'dojox/geo/openlayers/GreatCircle':function(){
define([
	"dojo/_base/lang",
	"./_base",
	"./GeometryFeature"
], function(lang, openlayers, GeometryFeature){

	var gc = openlayers.GreatCircle = {

		toPointArray: function(p1, p2, increment){
			// summary:
			//		Create a geodetic line as an array of OpenLayers.Point.
			// description:
			//		Create a geodetic line as an array of OpenLayers.Point between the point p1
			//		and the point p2. Result is a polyline approximation for which a new point is 
			//		calculated every <em>increment</em> degrees.
			// p1: Point
			//		The first point of the geodetic line. x and y fields are longitude and
			//		latitude in decimal degrees.
			// p2: Point
			//		The second point of the geodetic line. x and y fields are longitude and
			//		latitude in decimal degrees.
			// increment: Float
			//		The value at which a new point is computed. 
			var startLon = p1.x;
			var endLon = p2.x;
			var sl = Math.min(startLon, endLon);
			var el = Math.max(startLon, endLon);

			var d2r = this.DEG2RAD;
			var lat1 = p1.y * d2r;
			var lon1 = p1.x * d2r;
			var lat2 = p2.y * d2r;
			var lon2 = p2.x * d2r;

			if(Math.abs(lon1 - lon2) <= this.TOLERANCE){
				var l = Math.min(lon1, lon2);
				lon2 = l + Math.PI;
			}

			if(Math.abs(lon2 - lon1) == Math.PI){
				if(lat1 + lat2 == 0.0){
					lat2 += Math.PI / 180000000;
				}
			}

			var lon = sl * d2r;
			var elon = el * d2r;
			var incr = increment * d2r;
			var wp = [];
			var k = 0;
			var r2d = this.RAD2DEG;

			while(lon <= elon){
				lat = Math.atan((Math.sin(lat1) * Math.cos(lat2) * Math.sin(lon - lon2) - Math.sin(lat2) * Math.cos(lat1)
																																									* Math.sin(lon - lon1))
												/ (Math.cos(lat1) * Math.cos(lat2) * Math.sin(lon1 - lon2)));
				var p = {
					x: lon * r2d,
					y: lat * r2d
				};
				wp[k++] = p;
				if(lon < elon && (lon + incr) >= elon){
					lon = elon;
				}else{
					lon = lon + incr;
				}
			}
			return wp;
		},

		toLineString: function(p1, p2, increment){
			// summary:
			//		Create a geodetic line as an array of OpenLayers.Geometry.LineString.
			// description:
			//		Create a geodetic line as a OpenLayers.Geometry.LineString between the point p1
			//		and the point p2. Result is a polyline approximation for which a new point is 
			//		calculated every <em>increment</em> degrees.
			// p1: Point
			//		The first point of the geodetic line. x and y fields are longitude and
			//		latitude in decimal degrees.
			// p2: Point
			//		The second point of the geodetic line. x and y fields are longitude and
			//		latitude in decimal degrees.
			// increment: Float
			//		The value at which a new point is computed. 
			var wp = this.toPointArray(p1, p2, increment);
			var ls = new OpenLayers.Geometry.LineString(wp);
			return ls;
		},

		toGeometryFeature: function(p1, p2, increment){
			// summary:
			//		Create a geodetic line as an array of dojox.geo.openlayers.GeometryFeature.
			// description:
			//		Create a geodetic line as a dojox.geo.openlayers.GeometryFeature between the point p1
			//		ant the point p2. Result is a polyline approximation for which a new point is 
			//		calculated every <em>increment</em> degrees.
			// p1: Point
			//		The first point of the geodetic line. x and y fields are longitude and
			//		latitude in decimal degrees.
			// p2: Point
			//		The second point of the geodetic line. x and y fields are longitude and
			//		latitude in decimal degrees.
			// increment: Float
			//		The value at which a new point is computed. 
			// returns:
			//		The geodetic line as a GeometryFeature

			var ls = this.toLineString(p1, p2, increment);
			return new GeometryFeature(ls); // GeometryFeature
		},

		DEG2RAD: Math.PI / 180,

		RAD2DEG: 180 / Math.PI,

		TOLERANCE: 0.00001
	};
	
	return gc;
});

}}});
var _ecr;

require(["dojo/ready", "demos/shippingRoutes/src/Ecr"], 
		function(ready, Ecr){
	ready(function(){
		_ecr = new Ecr();
	});
});

