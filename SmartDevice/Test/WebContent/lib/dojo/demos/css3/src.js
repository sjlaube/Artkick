/*
	Copyright (c) 2004-2011, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

/*
	This is an optimized version of Dojo, built for deployment and not for
	development. To get sources and documentation, please visit:

		http://dojotoolkit.org
*/

//>>built
require({cache:{"dijit/main":function(){define(["dojo/_base/kernel"],function(_1){return _1.dijit;});},"dojox/main":function(){define(["dojo/_base/kernel"],function(_2){return _2.dojox;});},"dojo/require":function(){define(["./_base/loader"],function(_3){return {dynamic:0,normalize:function(id){return id;},load:_3.require};});},"dojox/css3/fx":function(){define(["dojo/_base/lang","dojo/_base/connect","dojo/dom-style","dojo/_base/fx","dojo/fx","dojo/_base/html","dojox/html/ext-dojo/style","dojox/fx/ext-dojo/complex"],function(_4,_5,_6,_7,_8,_9,_a,_b){var _c=_4.getObject("dojox.css3.fx",true);var _d={puff:function(_e){return _8.combine([_7.fadeOut(_e),this.expand({node:_e.node,endScale:_e.endScale||2})]);},expand:function(_f){return _7.animateProperty({node:_f.node,properties:{transform:{start:"scale(1)",end:"scale("+[_f.endScale||3]+")"}}});},shrink:function(_10){return this.expand({node:_10.node,endScale:0.01});},rotate:function(_11){return _7.animateProperty({node:_11.node,duration:_11.duration||1000,properties:{transform:{start:"rotate("+(_11.startAngle||"0deg")+")",end:"rotate("+(_11.endAngle||"360deg")+")"}}});},flip:function(_12){var _13=[],_14=_12.whichAnims||[0,1,2,3],_15=_12.direction||1,_16=[{start:"scale(1, 1) skew(0deg,0deg)",end:"scale(0, 1) skew(0,"+(_15*30)+"deg)"},{start:"scale(0, 1) skew(0deg,"+(_15*30)+"deg)",end:"scale(-1, 1) skew(0deg,0deg)"},{start:"scale(-1, 1) skew(0deg,0deg)",end:"scale(0, 1) skew(0deg,"+(-_15*30)+"deg)"},{start:"scale(0, 1) skew(0deg,"+(-_15*30)+"deg)",end:"scale(1, 1) skew(0deg,0deg)"}];for(var i=0;i<_14.length;i++){_13.push(_7.animateProperty(_4.mixin({node:_12.node,duration:_12.duration||600,properties:{transform:_16[_14[i]]}},_12)));}return _8.chain(_13);},bounce:function(_17){var _18=[],n=_17.node,_19=_17.duration||1000,_1a=_17.scaleX||1.2,_1b=_17.scaleY||0.6,ds=_9.style,_1c=ds(n,"position"),_1d="absolute",_1e=ds(n,"top"),_1f=[],_20=0,_21=Math.round,_22=_17.jumpHeight||70;if(_1c!=="absolute"){_1d="relative";}var a1=_7.animateProperty({node:n,duration:_19/6,properties:{transform:{start:"scale(1, 1)",end:"scale("+_1a+", "+_1b+")"}}});_5.connect(a1,"onBegin",function(){ds(n,{transformOrigin:"50% 100%",position:_1d});});_18.push(a1);var a2=_7.animateProperty({node:n,duration:_19/6,properties:{transform:{end:"scale(1, 1)",start:"scale("+_1a+", "+_1b+")"}}});_1f.push(a2);_1f.push(new _7.Animation(_4.mixin({curve:[],duration:_19/3,delay:_19/12,onBegin:function(){_20=(new Date).getTime();},onAnimate:function(){var _23=(new Date).getTime();ds(n,{top:parseInt(ds(n,"top"))-_21(_22*((_23-_20)/this.duration))+"px"});_20=_23;}},_17)));_18.push(_8.combine(_1f));_18.push(_7.animateProperty(_4.mixin({duration:_19/3,onEnd:function(){ds(n,{position:_1c});},properties:{top:_1e}},_17)));_18.push(a1);_18.push(a2);return _8.chain(_18);}};return _4.mixin(_c,_d);});},"dojo/fx":function(){define(["./_base/lang","./Evented","./_base/kernel","./_base/array","./aspect","./_base/fx","./dom","./dom-style","./dom-geometry","./ready","require"],function(_24,_25,_26,_27,_28,_29,dom,_2a,_2b,_2c,_2d){if(!_26.isAsync){_2c(0,function(){var _2e=["./fx/Toggler"];_2d(_2e);});}var _2f=_26.fx={};var _30={_fire:function(evt,_31){if(this[evt]){this[evt].apply(this,_31||[]);}return this;}};var _32=function(_33){this._index=-1;this._animations=_33||[];this._current=this._onAnimateCtx=this._onEndCtx=null;this.duration=0;_27.forEach(this._animations,function(a){this.duration+=a.duration;if(a.delay){this.duration+=a.delay;}},this);};_32.prototype=new _25();_24.extend(_32,{_onAnimate:function(){this._fire("onAnimate",arguments);},_onEnd:function(){this._onAnimateCtx.remove();this._onEndCtx.remove();this._onAnimateCtx=this._onEndCtx=null;if(this._index+1==this._animations.length){this._fire("onEnd");}else{this._current=this._animations[++this._index];this._onAnimateCtx=_28.after(this._current,"onAnimate",_24.hitch(this,"_onAnimate"),true);this._onEndCtx=_28.after(this._current,"onEnd",_24.hitch(this,"_onEnd"),true);this._current.play(0,true);}},play:function(_34,_35){if(!this._current){this._current=this._animations[this._index=0];}if(!_35&&this._current.status()=="playing"){return this;}var _36=_28.after(this._current,"beforeBegin",_24.hitch(this,function(){this._fire("beforeBegin");}),true),_37=_28.after(this._current,"onBegin",_24.hitch(this,function(arg){this._fire("onBegin",arguments);}),true),_38=_28.after(this._current,"onPlay",_24.hitch(this,function(arg){this._fire("onPlay",arguments);_36.remove();_37.remove();_38.remove();}));if(this._onAnimateCtx){this._onAnimateCtx.remove();}this._onAnimateCtx=_28.after(this._current,"onAnimate",_24.hitch(this,"_onAnimate"),true);if(this._onEndCtx){this._onEndCtx.remove();}this._onEndCtx=_28.after(this._current,"onEnd",_24.hitch(this,"_onEnd"),true);this._current.play.apply(this._current,arguments);return this;},pause:function(){if(this._current){var e=_28.after(this._current,"onPause",_24.hitch(this,function(arg){this._fire("onPause",arguments);e.remove();}),true);this._current.pause();}return this;},gotoPercent:function(_39,_3a){this.pause();var _3b=this.duration*_39;this._current=null;_27.some(this._animations,function(a){if(a.duration<=_3b){this._current=a;return true;}_3b-=a.duration;return false;});if(this._current){this._current.gotoPercent(_3b/this._current.duration,_3a);}return this;},stop:function(_3c){if(this._current){if(_3c){for(;this._index+1<this._animations.length;++this._index){this._animations[this._index].stop(true);}this._current=this._animations[this._index];}var e=_28.after(this._current,"onStop",_24.hitch(this,function(arg){this._fire("onStop",arguments);e.remove();}),true);this._current.stop();}return this;},status:function(){return this._current?this._current.status():"stopped";},destroy:function(){if(this._onAnimateCtx){this._onAnimateCtx.remove();}if(this._onEndCtx){this._onEndCtx.remove();}}});_24.extend(_32,_30);_2f.chain=function(_3d){return new _32(_3d);};var _3e=function(_3f){this._animations=_3f||[];this._connects=[];this._finished=0;this.duration=0;_27.forEach(_3f,function(a){var _40=a.duration;if(a.delay){_40+=a.delay;}if(this.duration<_40){this.duration=_40;}this._connects.push(_28.after(a,"onEnd",_24.hitch(this,"_onEnd"),true));},this);this._pseudoAnimation=new _29.Animation({curve:[0,1],duration:this.duration});var _41=this;_27.forEach(["beforeBegin","onBegin","onPlay","onAnimate","onPause","onStop","onEnd"],function(evt){_41._connects.push(_28.after(_41._pseudoAnimation,evt,function(){_41._fire(evt,arguments);},true));});};_24.extend(_3e,{_doAction:function(_42,_43){_27.forEach(this._animations,function(a){a[_42].apply(a,_43);});return this;},_onEnd:function(){if(++this._finished>this._animations.length){this._fire("onEnd");}},_call:function(_44,_45){var t=this._pseudoAnimation;t[_44].apply(t,_45);},play:function(_46,_47){this._finished=0;this._doAction("play",arguments);this._call("play",arguments);return this;},pause:function(){this._doAction("pause",arguments);this._call("pause",arguments);return this;},gotoPercent:function(_48,_49){var ms=this.duration*_48;_27.forEach(this._animations,function(a){a.gotoPercent(a.duration<ms?1:(ms/a.duration),_49);});this._call("gotoPercent",arguments);return this;},stop:function(_4a){this._doAction("stop",arguments);this._call("stop",arguments);return this;},status:function(){return this._pseudoAnimation.status();},destroy:function(){_27.forEach(this._connects,function(_4b){_4b.remove();});}});_24.extend(_3e,_30);_2f.combine=function(_4c){return new _3e(_4c);};_2f.wipeIn=function(_4d){var _4e=_4d.node=dom.byId(_4d.node),s=_4e.style,o;var _4f=_29.animateProperty(_24.mixin({properties:{height:{start:function(){o=s.overflow;s.overflow="hidden";if(s.visibility=="hidden"||s.display=="none"){s.height="1px";s.display="";s.visibility="";return 1;}else{var _50=_2a.get(_4e,"height");return Math.max(_50,1);}},end:function(){return _4e.scrollHeight;}}}},_4d));var _51=function(){s.height="auto";s.overflow=o;};_28.after(_4f,"onStop",_51,true);_28.after(_4f,"onEnd",_51,true);return _4f;};_2f.wipeOut=function(_52){var _53=_52.node=dom.byId(_52.node),s=_53.style,o;var _54=_29.animateProperty(_24.mixin({properties:{height:{end:1}}},_52));_28.after(_54,"beforeBegin",function(){o=s.overflow;s.overflow="hidden";s.display="";},true);var _55=function(){s.overflow=o;s.height="auto";s.display="none";};_28.after(_54,"onStop",_55,true);_28.after(_54,"onEnd",_55,true);return _54;};_2f.slideTo=function(_56){var _57=_56.node=dom.byId(_56.node),top=null,_58=null;var _59=(function(n){return function(){var cs=_2a.getComputedStyle(n);var pos=cs.position;top=(pos=="absolute"?n.offsetTop:parseInt(cs.top)||0);_58=(pos=="absolute"?n.offsetLeft:parseInt(cs.left)||0);if(pos!="absolute"&&pos!="relative"){var ret=_2b.position(n,true);top=ret.y;_58=ret.x;n.style.position="absolute";n.style.top=top+"px";n.style.left=_58+"px";}};})(_57);_59();var _5a=_29.animateProperty(_24.mixin({properties:{top:_56.top||0,left:_56.left||0}},_56));_28.after(_5a,"beforeBegin",_59,true);return _5a;};return _2f;});},"dojox/html/ext-dojo/style":function(){define(["dojo/_base/kernel","dojo/dom-style","dojo/_base/lang","dojo/_base/html","dojo/_base/sniff","dojo/_base/window","dojo/dom","dojo/dom-construct","dojo/dom-style","dojo/dom-attr"],function(_5b,_5c,_5d,_5e,has,win,DOM,_5f,_60,_61){_5b.experimental("dojox.html.ext-dojo.style");var st=_5d.getObject("dojox.html.ext-dojo.style",true);var _62=_5d.getObject("dojox.html");_5d.mixin(_62["ext-dojo"].style,{supportsTransform:true,_toPx:function(_63){var ds=_5e.style,_64=this._conversion;if(typeof _63==="number"){return _63+"px";}else{if(_63.toLowerCase().indexOf("px")!=-1){return _63;}}!_64.parentNode&&_5f.place(_64,win.body());ds(_64,"margin",_63);return ds(_64,"margin");},init:function(){var _65=win.doc.documentElement.style,_66=_62["ext-dojo"].style,_67=_60.get,_68=_60.set;_60.get=function(_69,_6a){var tr=(_6a=="transform"),to=(_6a=="transformOrigin");if(tr){return _66.getTransform(_69);}else{if(to){return _66.getTransformOrigin(_69);}else{return arguments.length==2?_67(_69,_6a):_67(_69);}}};_60.set=function(_6b,_6c,_6d){var tr=(_6c=="transform"),to=(_6c=="transformOrigin"),n=DOM.byId(_6b);if(tr){return _66.setTransform(n,_6d,true);}else{if(to){return _66.setTransformOrigin(n,_6d);}else{return arguments.length==3?_68(n,_6c,_6d):_68(n,_6c);}}};for(var i=0,_6e=["WebkitT","MozT","OT","msT","t"];i<_6e.length;i++){if(typeof _65[_6e[i]+"ransform"]!=="undefined"){this.tPropertyName=_6e[i]+"ransform";}if(typeof _65[_6e[i]+"ransformOrigin"]!=="undefined"){this.toPropertyName=_6e[i]+"ransformOrigin";}}if(this.tPropertyName){this.setTransform=function(_6f,_70){return _68(_6f,this.tPropertyName,_70);};this.getTransform=function(_71){return _67(_71,this.tPropertyName);};}else{if(has("ie")){this.setTransform=this._setTransformFilter;this.getTransform=this._getTransformFilter;}}if(this.toPropertyName){this.setTransformOrigin=function(_72,_73){return _68(_72,this.toPropertyName,_73);};this.getTransformOrigin=function(_74){return _67(_74,this.toPropertyName);};}else{if(has("ie")){this.setTransformOrigin=this._setTransformOriginFilter;this.getTransformOrigin=this._getTransformOriginFilter;}else{this.supportsTransform=false;}}this._conversion=_5f.create("div",{style:{position:"absolute",top:"-100px",left:"-100px",fontSize:0,width:"0",backgroundPosition:"50% 50%"}});},_notSupported:function(){console.warn("Sorry, this browser doesn't support transform and transform-origin");},_setTransformOriginFilter:function(_75,_76){var to=_5d.trim(_76).replace(" top"," 0").replace("left ","0 ").replace(" center","50%").replace("center ","50% ").replace(" bottom"," 100%").replace("right ","100% ").replace(/\s+/," "),_77=to.split(" "),n=DOM.byId(_75),t=this.getTransform(n),_78=true;for(var i=0;i<_77.length;i++){_78=_78&&/^0|(\d+(%|px|pt|in|pc|mm|cm))$/.test(_77[i]);if(_77[i].indexOf("%")==-1){_77[i]=this._toPx(_77[i]);}}if(!_78||!_77.length||_77.length>2){return _76;}_5e.attr(n,"dojo-transform-origin",_77.join(" "));t&&this.setTransform(_75,t);return _76;},_getTransformOriginFilter:function(_79){return _5e.attr(_79,"dojo-transform-origin")||"50% 50%";},_setTransformFilter:function(_7a,_7b){var t=_7b.replace(/\s/g,""),n=DOM.byId(_7a),_7c=t.split(")"),_7d=1,_7e=1,_7f="DXImageTransform.Microsoft.Matrix",_80=_61.has,_81=_5e.attr,PI=Math.PI,cos=Math.cos,sin=Math.sin,tan=Math.tan,max=Math.max,min=Math.min,abs=Math.abs,_82=PI/180,_83=PI/200,ct="",_84="",_85=[],x0=0,y0=0,dx=0,dy=0,xc=0,yc=0,a=0,m11=1,m12=0,m21=0,m22=1,tx=0,ty=0,_86=[m11,m12,m21,m22,tx,ty],_87=false,ds=_5e.style,_88=ds(n,"position")=="absolute"?"absolute":"relative",w=ds(n,"width")+ds(n,"paddingLeft")+ds(n,"paddingRight"),h=ds(n,"height")+ds(n,"paddingTop")+ds(n,"paddingBottom"),_89=this._toPx;!_80(n,"dojo-transform-origin")&&this.setTransformOrigin(n,"50% 50%");for(var i=0,l=_7c.length;i<l;i++){_85=_7c[i].match(/matrix|rotate|scaleX|scaleY|scale|skewX|skewY|skew|translateX|translateY|translate/);_84=_85?_85[0]:"";switch(_84){case "matrix":ct=_7c[i].replace(/matrix\(|\)/g,"");var _8a=ct.split(",");m11=_86[0]*_8a[0]+_86[1]*_8a[2];m12=_86[0]*_8a[1]+_86[1]*_8a[3];m21=_86[2]*_8a[0]+_86[3]*_8a[2];m22=_86[2]*_8a[1]+_86[3]*_8a[3];tx=_86[4]+_8a[4];ty=_86[5]+_8a[5];break;case "rotate":ct=_7c[i].replace(/rotate\(|\)/g,"");_7d=ct.indexOf("deg")!=-1?_82:ct.indexOf("grad")!=-1?_83:1;a=parseFloat(ct)*_7d;var s=sin(a),c=cos(a);m11=_86[0]*c+_86[1]*s;m12=-_86[0]*s+_86[1]*c;m21=_86[2]*c+_86[3]*s;m22=-_86[2]*s+_86[3]*c;break;case "skewX":ct=_7c[i].replace(/skewX\(|\)/g,"");_7d=ct.indexOf("deg")!=-1?_82:ct.indexOf("grad")!=-1?_83:1;var ta=tan(parseFloat(ct)*_7d);m11=_86[0];m12=_86[0]*ta+_86[1];m21=_86[2];m22=_86[2]*ta+_86[3];break;case "skewY":ct=_7c[i].replace(/skewY\(|\)/g,"");_7d=ct.indexOf("deg")!=-1?_82:ct.indexOf("grad")!=-1?_83:1;ta=tan(parseFloat(ct)*_7d);m11=_86[0]+_86[1]*ta;m12=_86[1];m21=_86[2]+_86[3]*ta;m22=_86[3];break;case "skew":ct=_7c[i].replace(/skew\(|\)/g,"");var _8b=ct.split(",");_8b[1]=_8b[1]||"0";_7d=_8b[0].indexOf("deg")!=-1?_82:_8b[0].indexOf("grad")!=-1?_83:1;_7e=_8b[1].indexOf("deg")!=-1?_82:_8b[1].indexOf("grad")!=-1?_83:1;var a0=tan(parseFloat(_8b[0])*_7d),a1=tan(parseFloat(_8b[1])*_7e);m11=_86[0]+_86[1]*a1;m12=_86[0]*a0+_86[1];m21=_86[2]+_86[3]*a1;m22=_86[2]*a0+_86[3];break;case "scaleX":ct=parseFloat(_7c[i].replace(/scaleX\(|\)/g,""))||1;m11=_86[0]*ct;m12=_86[1];m21=_86[2]*ct;m22=_86[3];break;case "scaleY":ct=parseFloat(_7c[i].replace(/scaleY\(|\)/g,""))||1;m11=_86[0];m12=_86[1]*ct;m21=_86[2];m22=_86[3]*ct;break;case "scale":ct=_7c[i].replace(/scale\(|\)/g,"");var _8c=ct.split(",");_8c[1]=_8c[1]||_8c[0];m11=_86[0]*_8c[0];m12=_86[1]*_8c[1];m21=_86[2]*_8c[0];m22=_86[3]*_8c[1];break;case "translateX":ct=parseInt(_7c[i].replace(/translateX\(|\)/g,""))||1;m11=_86[0];m12=_86[1];m21=_86[2];m22=_86[3];tx=_89(ct);tx&&_81(n,"dojo-transform-matrix-tx",tx);break;case "translateY":ct=parseInt(_7c[i].replace(/translateY\(|\)/g,""))||1;m11=_86[0];m12=_86[1];m21=_86[2];m22=_86[3];ty=_89(ct);ty&&_81(n,"dojo-transform-matrix-ty",ty);break;case "translate":ct=_7c[i].replace(/translate\(|\)/g,"");m11=_86[0];m12=_86[1];m21=_86[2];m22=_86[3];var _8d=ct.split(",");_8d[0]=parseInt(_89(_8d[0]))||0;_8d[1]=parseInt(_89(_8d[1]))||0;tx=_8d[0];ty=_8d[1];tx&&_81(n,"dojo-transform-matrix-tx",tx);ty&&_81(n,"dojo-transform-matrix-ty",ty);break;}_86=[m11,m12,m21,m22,tx,ty];}var Bx=min(w*m11+h*m12,min(min(w*m11,h*m12),0)),By=min(w*m21+h*m22,min(min(w*m21,h*m22),0));dx=-Bx;dy=-By;if(has("ie")<8){n.style.zoom="1";if(_88!="absolute"){var _8e=ds(_7a.parentNode,"width"),tw=abs(w*m11),th=abs(h*m12),_8f=max(tw+th,max(max(th,tw),0));dx-=(_8f-w)/2-(_8e>_8f?0:(_8f-_8e)/2);}}else{if(has("ie")==8){ds(n,"zIndex")=="auto"&&(n.style.zIndex="0");}}try{_87=!!n.filters.item(_7f);}catch(e){_87=false;}if(_87){n.filters.item(_7f).M11=m11;n.filters.item(_7f).M12=m12;n.filters.item(_7f).M21=m21;n.filters.item(_7f).M22=m22;n.filters.item(_7f).filterType="bilinear";n.filters.item(_7f).Dx=0;n.filters.item(_7f).Dy=0;n.filters.item(_7f).sizingMethod="auto expand";}else{n.style.filter+=" progid:"+_7f+"(M11="+m11+",M12="+m12+",M21="+m21+",M22="+m22+",FilterType='bilinear',Dx=0,Dy=0,sizingMethod='auto expand')";}tx=parseInt(_81(n,"dojo-transform-matrix-tx")||"0");ty=parseInt(_81(n,"dojo-transform-matrix-ty")||"0");var _90=_81(n,"dojo-transform-origin").split(" ");for(i=0;i<2;i++){_90[i]=_90[i]||"50%";}xc=(_90[0].toString().indexOf("%")!=-1)?w*parseInt(_90[0])*0.01:_90[0];yc=(_90[1].toString().indexOf("%")!=-1)?h*parseInt(_90[1])*0.01:_90[1];if(_80(n,"dojo-startX")){x0=parseInt(_81(n,"dojo-startX"));}else{x0=parseInt(ds(n,"left"));_81(n,"dojo-startX",_88=="absolute"?x0:"0");}if(_80(n,"dojo-startY")){y0=parseInt(_81(n,"dojo-startY"));}else{y0=parseInt(ds(n,"top"));_81(n,"dojo-startY",_88=="absolute"?y0:"0");}ds(n,{position:_88,left:x0-parseInt(dx)+parseInt(xc)-((parseInt(xc)-tx)*m11+(parseInt(yc)-ty)*m12)+"px",top:y0-parseInt(dy)+parseInt(yc)-((parseInt(xc)-tx)*m21+(parseInt(yc)-ty)*m22)+"px"});return _7b;},_getTransformFilter:function(_91){try{var n=DOM.byId(_91),_92=n.filters.item(0);return "matrix("+_92.M11+", "+_92.M12+", "+_92.M21+", "+_92.M22+", "+(_5e.attr(_91,"dojo-transform-tx")||"0")+", "+(_5e.attr(_91,"dojo-transform-ty")||"0")+")";}catch(e){return "matrix(1, 0, 0, 1, 0, 0)";}},setTransform:function(){this._notSupported();},setTransformOrigin:function(){this._notSupported();}});_62["ext-dojo"].style.init();return _5e.style;});},"dojox/fx/ext-dojo/complex":function(){define(["dojo/_base/kernel","dojo/_base/lang","dojo/_base/array","dojo/_base/declare","dojo/_base/connect","dojo/_base/Color","dojo/_base/fx","dojo/fx"],function(_93,_94,_95,_96,_97,_98,_99,_9a){_94.getObject("dojox.fx.ext-dojo.complex",true);var da=_99.animateProperty;_93.animateProperty=_99.animateProperty=function(_9b){var ani=da(_9b);_97.connect(ani,"beforeBegin",function(){ani.curve.getValue=function(r){var ret={};for(var p in this._properties){var _9c=this._properties[p],_9d=_9c.start;if(_9d instanceof _93.Color){ret[p]=_93.blendColors(_9d,_9c.end,r,_9c.tempColor).toCss();}else{if(_9d instanceof dojox.fx._Complex){ret[p]=_9d.getValue(r);}else{if(!_93.isArray(_9d)){ret[p]=((_9c.end-_9d)*r)+_9d+(p!="opacity"?_9c.units||"px":0);}}}}return ret;};var pm={};for(var p in this.properties){var o=this.properties[p];if(typeof (o.start)=="string"&&/\(/.test(o.start)){this.curve._properties[p].start=new dojox.fx._Complex(o);}}});return ani;};return _96("dojox.fx._Complex",null,{PROP:/\([\w|,|+|\-|#|\.|\s]*\)/g,constructor:function(_9e){var beg=_9e.start.match(this.PROP);var end=_9e.end.match(this.PROP);var _9f=_95.map(beg,this.getProps,this);var _a0=_95.map(end,this.getProps,this);this._properties={};this.strProp=_9e.start;_95.forEach(_9f,function(_a1,i){_95.forEach(_a1,function(p,j){this.strProp=this.strProp.replace(p,"PROP_"+i+""+j);this._properties["PROP_"+i+""+j]=this.makePropObject(p,_a0[i][j]);},this);},this);},getValue:function(r){var str=this.strProp,u;for(var nm in this._properties){var v,o=this._properties[nm];if(o.units=="isColor"){v=_98.blendColors(o.beg,o.end,r).toCss(false);u="";}else{v=((o.end-o.beg)*r)+o.beg;u=o.units;}str=str.replace(nm,v+u);}return str;},makePropObject:function(beg,end){var b=this.getNumAndUnits(beg);var e=this.getNumAndUnits(end);return {beg:b.num,end:e.num,units:b.units};},getProps:function(str){str=str.substring(1,str.length-1);var s;if(/,/.test(str)){str=str.replace(/\s/g,"");s=str.split(",");}else{str=str.replace(/\s{2,}/g," ");s=str.split(" ");}return s;},getNumAndUnits:function(_a2){if(!_a2){return {};}if(/#/.test(_a2)){return {num:new _98(_a2),units:"isColor"};}var o={num:parseFloat(/-*[\d\.\d|\d]{1,}/.exec(_a2).join(""))};o.units=/[a-z]{1,}/.exec(_a2);o.units=o.units&&o.units.length?o.units.join(""):"";return o;}});});}}});define("demos/css3/src",["dojo","dijit","dojox","dojo/require!dojox/css3/fx"],function(_a3,_a4,_a5){_a3.provide("demos.css3.src");_a3.require("dojox.css3.fx");_a3.declare("CSS3Demo",null,{menuNode:null,increment:360,angle:0,constructor:function(){var _a6=["puff","bounce","shrink","expand","rotate","flip"];var _a7=_a3.create("div",{innerHTML:"dojox.css3",style:{position:"absolute",left:"-45px",top:"30px",background:"#000",color:"#faa",fontSize:"1em",height:"1.4em",lineHeight:"1.4em",borderTop:"3px solid #777",borderBottom:"3px solid #777",width:"200px",textAlign:"center"}},_a3.body());_a3.style(_a7,{transform:"rotate(-45deg)"});var _a8=_a3.create("button",{innerHTML:"reset",style:{position:"absolute",right:"10px",top:"30px",background:"#ccc",color:"#222",fontSize:"1em",lineHeight:"1.4em",width:"200px",textAlign:"center"}},_a3.body());_a3.connect(_a8,"onclick",function(){_a3.query(".box").forEach(function(_a9){_a3.style(_a9,{transform:"scale(1)",opacity:"1"});});});this.increment=360/_a6.length;this.menuNode=_a3.create("div",{className:"menu"},_a3.body());for(var i=0,l=_a6.length;i<l;i++){var box=_a3.create("div",{innerHTML:"<span>"+_a6[i]+"</span>",className:"box",style:{left:(i%3)*200+"px",top:Math.floor(i/3)*200+"px"}},this.menuNode);_a3.connect(box,"onclick",(function(b,x){return function(){_a5.css3.fx[_a6[x]]({node:b}).play();};})(box,i));}}});_a3.ready(function(){new CSS3Demo;});});