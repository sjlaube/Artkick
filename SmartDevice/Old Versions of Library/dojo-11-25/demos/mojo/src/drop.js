//>>built
define("demos/mojo/src/drop",["dojo","dijit","dojox","dojo/require!dojo/fx,dojo/fx/easing,dojo/window"],function(_1,_2,_3){_1.provide("demos.mojo.src.drop");_1.require("dojo.fx");_1.require("dojo.fx.easing");_1.require("dojo.window");(function(){var _4={},_5,_6=[],cb;_1.mixin(_4,{drop:{_calcPositions:function(e){var c=[];_5.forEach(function(n){c.push(_1.coords(n));});if(e){_6=c;}return c;},dropNodes:function(){_6=_4.drop._calcPositions();var t=_1.window.getBox().h-310;_1.style(_1.body(),"overflow","hidden");var _7=[];_5.forEach(function(n,_8){var l=_6[_8].l;_7.push(_1.fx.slideTo({top:t,left:l,node:n,duration:1000,easing:_1.fx.easing.bounceOut}));});_1.fx.combine(_7).play();},floatNodes:function(){var _9=[];_5.forEach(function(n,_a){var t=_6[_a].t;var l=_6[_a].l;_9.push(_1.fx.slideTo({top:t,left:l,node:n,duration:500}));});var _b=_1.fx.combine(_9);var _c=_1.connect(_b,"onEnd",function(){_1.style(_1.body(),"overflow","visible");});_b.play();}}});var _d=function(e){_4.drop[(cb.checked?"dropNodes":"floatNodes")]();};_1.addOnLoad(function(){_5=_1.query("#container > div");cb=_1.byId("gravity");cb.checked=false;_1.connect(cb,_1.isIE?"onclick":"onchange",_d);_1.connect(window,"onresize",_4.drop,"_calcPositions");new _1.dnd.Moveable("logoImg");_1.style("logoImg","cursor","move");});})();});