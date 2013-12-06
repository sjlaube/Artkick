/*
	Copyright (c) 2004-2011, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

//>>built
define("dojo/touch",["./_base/kernel","./aspect","./dom","./dom-class","./_base/lang","./on","./has","./mouse","./domReady","./_base/window"],function(_1,_2,_3,_4,_5,on,_6,_7,_8,_9){var _a=_6("touch");var _b=_6("ios")<5;var _c=navigator.msPointerEnabled;var _d,_e,_f,_10,_11,_12,_13,_14;var _15;function _16(_17,_18,_19){if(_c&&_19){return function(_1a,_1b){return on(_1a,_19,_1b);};}else{if(_a){return function(_1c,_1d){var _1e=on(_1c,_18,_1d),_1f=on(_1c,_17,function(evt){if(!_15||(new Date()).getTime()>_15+1000){_1d.call(this,evt);}});return {remove:function(){_1e.remove();_1f.remove();}};};}else{return function(_20,_21){return on(_20,_17,_21);};}}};function _22(_23){do{if(_23.dojoClick){return _23;}}while(_23=_23.parentNode);};function _24(e,_25,_26){var _27=_22(e.target);_e=!e.target.disabled&&_27&&_27.dojoClick;if(_e){var _28=(_e=="useTarget");_f=(_28?_27:e.target);if(_28){e.preventDefault();}_10=e.touches?e.touches[0].pageX:e.clientX;_11=e.touches?e.touches[0].pageY:e.clientY;_12=(typeof _e=="object"?_e.x:(typeof _e=="number"?_e:0))||4;_13=(typeof _e=="object"?_e.y:(typeof _e=="number"?_e:0))||4;if(!_d){_d=true;function _29(e){if(_28){_e=_3.isDescendant(_9.doc.elementFromPoint((e.changedTouches?e.changedTouches[0].pageX:e.clientX),(e.changedTouches?e.changedTouches[0].pageY:e.clientY)),_f);}else{_e=_e&&e.target==_f&&Math.abs((e.changedTouches?e.changedTouches[0].pageX:e.clientX)-_10)<=_12&&Math.abs((e.changedTouches?e.changedTouches[0].pageY:e.clientY)-_11)<=_13;}};_9.doc.addEventListener(_25,function(e){_29(e);if(_28){e.preventDefault();}},true);_9.doc.addEventListener(_26,function(e){_29(e);if(_e){_14=(new Date()).getTime();var _2a=(_28?_f:e.target);if(_2a.tagName==="LABEL"){_2a=_3.byId(_2a.getAttribute("for"))||_2a;}setTimeout(function(){on.emit(_2a,"click",{bubbles:true,cancelable:true,_dojo_click:true});},0);}},true);function _2b(_2c){_9.doc.addEventListener(_2c,function(e){if(!e._dojo_click&&(new Date()).getTime()<=_14+1000&&!(e.target.tagName=="INPUT"&&_4.contains(e.target,"dijitOffScreen"))){e.stopPropagation();e.stopImmediatePropagation&&e.stopImmediatePropagation();if(_2c=="click"&&(e.target.tagName!="INPUT"||e.target.type=="radio"||e.target.type=="checkbox")&&e.target.tagName!="TEXTAREA"&&e.target.tagName!="AUDIO"&&e.target.tagName!="VIDEO"){e.preventDefault();}}},true);};_2b("click");_2b("mousedown");_2b("mouseup");}}};var _2d;if(_a){if(_c){_8(function(){_9.doc.addEventListener("MSPointerDown",function(evt){_24(evt,"MSPointerMove","MSPointerUp");},true);});}else{_8(function(){_2d=_9.body();_9.doc.addEventListener("touchstart",function(evt){_15=(new Date()).getTime();var _2e=_2d;_2d=evt.target;on.emit(_2e,"dojotouchout",{relatedTarget:_2d,bubbles:true});on.emit(_2d,"dojotouchover",{relatedTarget:_2e,bubbles:true});_24(evt,"touchmove","touchend");},true);function _2f(evt){var _30=_5.delegate(evt,{bubbles:true});if(_6("ios")>=6){_30.touches=evt.touches;_30.altKey=evt.altKey;_30.changedTouches=evt.changedTouches;_30.ctrlKey=evt.ctrlKey;_30.metaKey=evt.metaKey;_30.shiftKey=evt.shiftKey;_30.targetTouches=evt.targetTouches;}return _30;};on(_9.doc,"touchmove",function(evt){_15=(new Date()).getTime();var _31=_9.doc.elementFromPoint(evt.pageX-(_b?0:_9.global.pageXOffset),evt.pageY-(_b?0:_9.global.pageYOffset));if(_31){if(_2d!==_31){on.emit(_2d,"dojotouchout",{relatedTarget:_31,bubbles:true});on.emit(_31,"dojotouchover",{relatedTarget:_2d,bubbles:true});_2d=_31;}if(!on.emit(_31,"dojotouchmove",_2f(evt))){evt.preventDefault();}}});on(_9.doc,"touchend",function(evt){_15=(new Date()).getTime();var _32=_9.doc.elementFromPoint(evt.pageX-(_b?0:_9.global.pageXOffset),evt.pageY-(_b?0:_9.global.pageYOffset))||_9.body();on.emit(_32,"dojotouchend",_2f(evt));});});}}var _33={press:_16("mousedown","touchstart","MSPointerDown"),move:_16("mousemove","dojotouchmove","MSPointerMove"),release:_16("mouseup","dojotouchend","MSPointerUp"),cancel:_16(_7.leave,"touchcancel",_a?"MSPointerCancel":null),over:_16("mouseover","dojotouchover","MSPointerOver"),out:_16("mouseout","dojotouchout","MSPointerOut"),enter:_7._eventHandler(_16("mouseover","dojotouchover","MSPointerOver")),leave:_7._eventHandler(_16("mouseout","dojotouchout","MSPointerOut"))};1&&(_1.touch=_33);return _33;});