//>>built
define("demos/doGeo/src/wink/ux/movementtracker/js/movementtracker",["dojo","dijit","dojox"],function(_1,_2,_3){wink.ux.MovementTracker=function(_4){this.uId=wink.getUId();this._properties=_4;this._target=null;this._captureFlow=true;this._DIRECTION_CHANGE_THRESHOLD=0;this.EVENTS_REGISTERED={MOVEMENT_BEGIN:"/movementtracker/events/mvtbegin",MOVEMENT_CHANGED:"/movementtracker/events/mvtchanged",MOVEMENT_STORED:"/movementtracker/events/mvtstored"};this._pointStatement=null;this._previousPointStatement=null;this._acceptEvents=true;this._multitouch=false;if(this._validateProperties()===false){return;}this._initProperties();this._initListeners();};wink.ux.MovementTracker.prototype={_validateProperties:function(){if(wink.isUndefined(this._properties.target)){wink.log("[MovementTracker] Error: target property must be specified");return false;}if(wink.isUndefined($(this._properties.target))){wink.log("[MovementTracker] Error: target property must refer to a valid DOM Node");return false;}return true;},_initProperties:function(){this._target=$(this._properties.target);if(this._properties.captureFlow===false){this._captureFlow=false;}},_initListeners:function(){wink.ux.touch.addListener(this._target,"start",{context:this,method:"_handleTouchStart"},true,true,this._captureFlow);wink.ux.touch.addListener(this._target,"move",{context:this,method:"_handleTouchMove"});wink.ux.touch.addListener(this._target,"end",{context:this,method:"_handleTouchEnd"});},_handleTouchStart:function(_5){if(this._acceptEvents==false){return;}this._multitouch=false;if(_5.multitouch==true){this._multitouch=true;return;}this._pointStatement=[];this._previousPointStatement=null;this._addTouch(_5);this._acceptEvents=false;var _6=this._getCurrentMovement();wink.publish(this.EVENTS_REGISTERED.MOVEMENT_BEGIN,{publisher:this,movement:_6,uxEvent:_5,target:this._target});this._acceptEvents=true;},_handleTouchMove:function(_7){if(this._acceptEvents==false){return;}if(this._multitouch){return;}this._addTouch(_7);this._acceptEvents=false;var _8=this._getCurrentMovement();wink.publish(this.EVENTS_REGISTERED.MOVEMENT_CHANGED,{publisher:this,movement:_8,uxEvent:_7,target:this._target});this._acceptEvents=true;},_handleTouchEnd:function(_9){if(this._acceptEvents==false){return;}if(this._multitouch){return;}this._addTouch(_9);this._acceptEvents=false;var _a=this._getCurrentMovement();wink.publish(this.EVENTS_REGISTERED.MOVEMENT_STORED,{publisher:this,movement:_a,uxEvent:_9,target:this._target});this._acceptEvents=true;},_addTouch:function(_b){var _c={x:_b.x,y:_b.y,timestamp:_b.timestamp};var _d=0;var _e=0;var _f=0;var _10=0;var _11=0;var _12=0;if(this._previousPointStatement==null){_c.duration=0;_c.globalDuration=0;_d=_c.x;_e=_c.y;}else{_d=this._previousPointStatement.x;_e=this._previousPointStatement.y;_f=this._previousPointStatement.globalDx;_10=this._previousPointStatement.globalDy;_11=this._previousPointStatement.directionX;_12=this._previousPointStatement.directionY;_c.duration=(_c.timestamp-this._previousPointStatement.timestamp);_c.globalDuration=_c.duration+this._previousPointStatement.globalDuration;}_c.dx=Math.abs(_c.x-_d);_c.dy=Math.abs(_c.y-_e);_c.globalDx=_c.dx+_f;_c.globalDy=_c.dy+_10;_c.directionX=_11;_c.directionY=_12;if(_11==0&&this._previousPointStatement!=null){if(_c.x<_d){_c.directionX=-1;}else{if(_c.x>_d){_c.directionX=1;}}this._previousPointStatement.directionX=_c.directionX;}if(_12==0&&this._previousPointStatement!=null){if(_c.y<_e){_c.directionY=-1;}else{if(_c.y>_e){_c.directionY=1;}}this._previousPointStatement.directionY=_c.directionY;}if(_11>0&&(_c.x+this._DIRECTION_CHANGE_THRESHOLD)<_d){_c.directionX=-1;}else{if(_11<0&&(_c.x-this._DIRECTION_CHANGE_THRESHOLD)>_d){_c.directionX=1;}}if(_12>0&&(_c.y+this._DIRECTION_CHANGE_THRESHOLD)<_e){_c.directionY=-1;}else{if(_12<0&&(_c.y-this._DIRECTION_CHANGE_THRESHOLD)>_e){_c.directionY=1;}}this._pointStatement.push(_c);this._previousPointStatement=_c;},_getCurrentMovement:function(){var _13=this._pointStatement[(this._pointStatement.length-1)];var _14={pointStatement:this._pointStatement,duration:_13.globalDuration,dx:_13.globalDx,dy:_13.globalDy};return _14;}};});