//>>built
define("demos/doGeo/src/wink/ux/gesture/js/gesture",["dojo","dijit","dojox"],function(_1,_2,_3){wink.ux.gesture={_gestureElements:[],_knownGestures:["two_digits_click","two_digits_press","enlargement","narrowing","rotation","instant_scale","instant_rotation","gesture_end"],TWO_DIGITS_CLICK_MAX_DURATION:350,TWO_DIGITS_PRESS_MIN_DURATION:400,SCALE_MIN_VALUE:0.2,ROTATION_MIN_VALUE:5,listenTo:function(_4,_5,_6,_7){if(!this._isGestureKnown(_5)){wink.log("[gesture] Cannot listen to this unknown gesture: "+_5);return false;}if(!wink.isCallback(_6)){wink.log("[gesture] Invalid callback: "+_6);return false;}var _8=null;var _9=this._getGestureElementIndex(_4);if(_9==null){_8=this._createGestureElement(_4,_7);this._gestureElements.push(_8);wink.ux.touch.addListener(_8.domNode,"start",{context:this,method:"_handleStart",arguments:[_8]},_8.preventDefault,false);wink.ux.touch.addListener(_8.domNode,"gesturestart",{context:this,method:"_handleGestureStart",arguments:[_8]},_8.preventDefault);}else{_8=this._gestureElements[_9];}_8.addCallback(_5,_6);},unlistenTo:function(_a,_b,_c){if(!this._isGestureKnown(_b)){wink.log("[gesture] Cannot listen to this unknown gesture: "+_b);return false;}if(!wink.isCallback(_c)){wink.log("[gesture] Invalid callback: "+_c);return false;}var _d=null;var _e=this._getGestureElementIndex(_a);if(_e==null){return;}_d=this._gestureElements[_e];_d.removeCallback(_b,_c);},_createGestureElement:function(_f,_10){var _11={uId:wink.getUId(),domNode:_f,preventDefault:_10,digits:[],multitouch:false,multitouchStartTime:null,multitouchEndTime:null,scale:1,rotation:0,gestureHandlers:[],getGestureHandler:function(_12){for(var i=0;i<this.gestureHandlers.length;i++){if(this.gestureHandlers[i].gesture==_12){return this.gestureHandlers[i];}}return null;},isListening:function(_13){var _14=this.getGestureHandler(_13);return (_14!=null);},addCallback:function(_15,_16){if(this.isListening(_15)){this.getGestureHandler(_15).callbacks.push(_16);}else{this.gestureHandlers.push({gesture:_15,callbacks:[_16]});}},removeCallback:function(_17,_18){if(this.isListening(_17)){for(var i=0;i<this.getGestureHandler(_17).callbacks.length;i++){var _19=this.getGestureHandler(_17).callbacks[i];if(_19.context==_18.context&&_19.method==_18.method){if(this.getGestureHandler(_17).callbacks.length==1){for(var j=0;j<this.gestureHandlers.length;j++){if(this.gestureHandlers[j].gesture==_17){this.gestureHandlers.splice(j,1);break;}}}else{this.getGestureHandler(_17).callbacks.splice(i,1);}break;}}}},reset:function(){this.digits=[];this.multitouch=false;this.multitouchStartTime=null;this.multitouchEndTime=null;this.scale=1;this.rotation=0;}};return _11;},_isGestureKnown:function(_1a){return (this._knownGestures.indexOf(_1a)!=-1);},_getGestureElementIndex:function(_1b){for(var i=0;i<this._gestureElements.length;i++){var _1c=this._gestureElements[i];if(_1c.domNode==_1b){return i;}}return null;},_notifyGesture:function(_1d,_1e,_1f){if(!_1e.isListening(_1d)){return;}var _20=_1e.getGestureHandler(_1d).callbacks;for(var j=0;j<_20.length;j++){var _21=_20[j];var _22=_21.arguments;var _23=[_1f];if(wink.isset(_22)&&_22.length>0){_23=_23.concat(_22);}wink.call(_21,_23);}},_handleStart:function(_24,_25){_25.reset();if(_25.checkTimer){clearTimeout(_25.checkTimer);}var _26=0;if(wink.isset(_24.srcEvent.targetTouches)){_26=_24.srcEvent.targetTouches.length;}if(_26==2){_25.multitouch=true;_25.multitouchStartTime=this._getTimeStamp();_25.digits.push(this._getDigit(_24.srcEvent.targetTouches[0],_24));_25.digits.push(this._getDigit(_24.srcEvent.targetTouches[1],_24));wink.ux.touch.addListener(_25.domNode,"move",{context:this,method:"_handleMove",arguments:[_25]},_25.preventDefault);wink.ux.touch.addListener(_25.domNode,"end",{context:this,method:"_handleEnd",arguments:[_25]});_25.checkTimer=wink.setTimeout(this,"_checkTwoDigitsPressed",this.TWO_DIGITS_PRESS_MIN_DURATION,_25);}else{_25.multitouch=false;wink.ux.touch.removeListener(_25.domNode,"move",{context:this,method:"_handleMove",arguments:[_25]},_25.preventDefault);wink.ux.touch.removeListener(_25.domNode,"end",{context:this,method:"_handleEnd",arguments:[_25]});}},_handleMove:function(_27,_28){var _29=0;if(wink.isset(_27.srcEvent.targetTouches)){_29=_27.srcEvent.targetTouches.length;}if(_29==2){_28.digits=[];_28.digits.push(this._getDigit(_27.srcEvent.targetTouches[0],_27));_28.digits.push(this._getDigit(_27.srcEvent.targetTouches[1],_27));}},_handleEnd:function(_2a,_2b){if(_2b.multitouch==true){var _2c=0;if(wink.isset(_2a.srcEvent.targetTouches)){_2c=_2a.srcEvent.targetTouches.length;}if(_2c!=2){_2b.multitouch=false;}if(_2c==0){wink.ux.touch.removeListener(_2b.domNode,"move",{context:this,method:"_handleMove"});wink.ux.touch.removeListener(_2b.domNode,"end",{context:this,method:"_handleEnd"});_2b.multitouchEndTime=this._getTimeStamp();var _2d=_2b.multitouchEndTime-_2b.multitouchStartTime;if(_2d<this.TWO_DIGITS_CLICK_MAX_DURATION){var _2e={digit1:_2b.digits[0],digit2:_2b.digits[1]};this._notifyGesture("two_digits_click",_2b,_2e);}}}},_checkTwoDigitsPressed:function(_2f){if(_2f.multitouch==true){var _30={digit1:_2f.digits[0],digit2:_2f.digits[1]};this._notifyGesture("two_digits_press",_2f,_30);}},_handleGestureStart:function(_31,_32){wink.ux.touch.addListener(_32.domNode,"gesturechange",{context:this,method:"_handleGestureChange",arguments:[_32]},_32.preventDefault);wink.ux.touch.addListener(_32.domNode,"gestureend",{context:this,method:"_handleGestureEnd",arguments:[_32]});_32.gestureStartTime=this._getTimeStamp();},_handleGestureChange:function(_33,_34){if(_34.multitouch==true){var _35=_33.srcEvent.scale-_34.scale;var _36=_33.srcEvent.rotation-_34.rotation;var _37={digit1:_34.digits[0],digit2:_34.digits[1],scale:wink.math.round(_33.srcEvent.scale,2)};var _38={digit1:_34.digits[0],digit2:_34.digits[1],rotation:wink.math.round(_33.srcEvent.rotation,2)};if(Math.abs(_35)>this.SCALE_MIN_VALUE){_34.scale=_33.srcEvent.scale;var _39=null;if(_35>0){_39="enlargement";}else{_39="narrowing";}this._notifyGesture(_39,_34,_37);}if(Math.abs(_36)>this.ROTATION_MIN_VALUE){_34.rotation=_33.srcEvent.rotation;this._notifyGesture("rotation",_34,_38);}this._notifyGesture("instant_scale",_34,_37);this._notifyGesture("instant_rotation",_34,_38);}},_handleGestureEnd:function(_3a,_3b){wink.ux.touch.removeListener(_3b.domNode,"gesturechange",{context:this,method:"_handleGestureChange"});wink.ux.touch.removeListener(_3b.domNode,"gestureend",{context:this,method:"_handleGestureEnd"});_3b.gestureEndTime=this._getTimeStamp();var _3c=_3b.gestureEndTime-_3b.gestureStartTime;this._notifyGesture("gesture_end",_3b,{gestureDuration:_3c});},_getDigit:function(_3d,_3e){var _3f=wink.ux.touch.getTouchProperties(_3d);var _40={x:_3f.x,y:_3f.y,timestamp:_3e.timestamp,target:_3f.target};return _40;},_getTimeStamp:function(){return new Date().getTime();}};});