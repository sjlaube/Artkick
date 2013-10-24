//>>built
define("demos/shippingRoutes/src/Ecr",["dojo/_base/kernel","dojo/_base/declare","dojo/_base/html","dojo/_base/array","dojo/_base/lang","dojo/dom","dojox/geo/openlayers/Map","dojox/geo/openlayers/GfxLayer","dojo/data/ItemFileReadStore","./PortRenderer","./LegsRenderer"],function(_1,_2,_3,_4,_5,_6,_7,_8,_9,_a,_b){return _2(null,{constructor:function(){var _c=new _7("map");_c.fitTo([-160,70,160,-70]);this._map=_c;layer=new _8("legs");this._legLayer=layer;_c.addLayer(layer);layer=new _8("ports");this._portLayer=layer;_c.addLayer(layer);this.loadData("data/ecr.json");},fitTo:function(_d){this._map.fitTo(_d);},clearLayer:function(_e){var fa=_e.getFeatures();_e.removeFeature(fa);},clearEcr:function(_f){var _10=this._portLayer;this.clearLayer(_10);_10=this._legLayer;this.clearLayer(_10);this.fillPortChooser(null);},setDataSet:function(_11){var o=_6.byId(_11);var ds=o.value;var _12=this._portLayer;this.clearLayer(_12);_12=this._legLayer;this.clearLayer(_12);this.loadData(ds);},log:function(o){},loadError:function(){this.log(arguments[0]);},_portStyle:[{type:"circle",depth:"{radius}",radius:function(ctx){var _13=ctx.store.getValue(this,"offer");var ret=Math.max(1,Math.log(_13));return 3*ret;},stroke:{color:"#4c9a06",width:1}},{type:"circle",depth:"{radius}",radius:function(ctx){var _14=ctx.store.getValue(this,"demand");return 3*Math.max(1,Math.log(_14));},stroke:{color:"#bb0000",width:1}}],gotPorts:function(_15,_16){this.log("got ports "+_15.length);var _17=_16.store;var ctx={store:_17};var _18=new _a(this._portStyle,ctx);var _19=this._portLayer;_4.forEach(_15,function(_1a,_1b,_1c){var f=_18.render(_1a);if(f!=null){_19.addFeature(f);}});this.fillPortChooser(_15);this.portChange("portChooser");_19.redraw();},_legsStyle:{type:"polyline",stroke:{color:[255,165,0]}},gotLegs:function(_1d,_1e){var ctx={store:_1e.store};var _1f=new _b(this._legsStyle,ctx);_1f.setGeodetic(true);var _20=this._legLayer;_4.forEach(_1d,function(_21,_22,_23){var f=_1f.render(_21);if(f!=null){_20.addFeature(f);}});_20.redraw();},loadData:function(_24){var _25=new _9({url:_24,urlPreventCache:true});_25.fetch({query:{type:"legs"},onComplete:_5.hitch(this,this.gotLegs),onError:_5.hitch(this,this.loadError),queryOptions:{deep:true}});_25.fetch({query:{type:"port"},onComplete:_5.hitch(this,this.gotPorts),onError:_5.hitch(this,this.loadError)});},regionChange:function(_26){this.fitTo(_26.currentTarget.value);},portChange:function(_27){var o=_6.byId(_27);this.fitTo(o.value);},fillPortChooser:function(_28){var ps=_6.byId("portChooser");var _29=ps.options;var ws="{\"position\": [0, 0], \"extent\": 70}";if(_28==null){_29.length=1;_29[0]=new Option("World",ws);}else{_29.length=_28.length+1;_29[0]=new Option("World",ws);var s="{\"position\": [%lo, %la], \"extent\": 0.2}";for(var i=0;i<_28.length;i++){var _2a=_28[i];var lon=parseFloat(_2a.longitude);var lat=parseFloat(_2a.latitude);var os=s.replace("%lo",lon).replace("%la",lat);_29[i+1]=new Option(_2a.name,os);}}},toggleLayerVisibility:function(_2b){var cb=_6.byId(_2b);var a=this._map.getLayer("name",_2b);_4.forEach(a,function(_2c,_2d,_2e){_2c.olLayer.setVisibility(cb.checked);});}});});