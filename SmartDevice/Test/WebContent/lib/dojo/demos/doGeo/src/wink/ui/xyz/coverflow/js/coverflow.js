//>>built
define("demos/doGeo/src/wink/ui/xyz/coverflow/js/coverflow",["dojo","dijit","dojox"],function(_1,_2,_3){wink.ui.xyz.CoverFlow=function(_4){this.uId=wink.getUId();this._properties=_4;this._covers=null;this._backgroundColor=null;this._reflected=null;this._displayTitle=null;this._fadeEdges=null;this._size=null;this._viewportWidth=null;this._handleGesture=null;this._handleOrientationChange=null;this._coverSpacing=null;this._displayTitleDuration=null;this._borderSize=null;this._domNode=null;this._trayNode=null;this._gestureNode=null;this._faderLeft=null;this._faderRight=null;this._movementtracker=null;this._positions=null;this._transformations=null;this._transformsQueue=null;this._renderer=null;this._middleViewIndex=null;this._lastRenderedIndex=null;this._timerTitle=null;this._dragging=false;this._displayMode=false;this._flipping=false;this._view={x:0,sizeX:0,shiftX:25,shiftFromMiddle:200,coverRotation:55,coverScale:0.28,zMiddleCover:175,zAroundCover:0,numberOfCoverToRender:5,distanceToCenter:0,distanceFromTop:0,zGestureNode:1000,observerRotation:0,currentObserverRotation:0};if(this._validateProperties()===false){return;}this._initProperties();this._initDom();this._initListeners();};wink.ui.xyz.CoverFlow.prototype={_Z_INDEX_BACKGROUND:5,_DURATION_BACKTO_BOUND:200,_DURATION_MIDDLE:600,_DURATION_AROUND:300,_DURATION_FLIP:1000,_TRANSITION_FUNC:"default",_OUTOFBOUND_FRICTIONAL_FORCES:4,_RENDERER_INTERVAL:15,_DELAY_BEFORE_IMAGE_LOADING:50,_PERSPECTIVE:500,_REFLECTION_ATTENUATION:0.6,_DELAY_FOR_TITLE_DISPLAY:400,getDomNode:function(){return this._domNode;},updateSize:function(_5,_6){this._size=_5;this._viewportWidth=_6;var _7=0.07;if(wink.isset(this._coverSpacing)){_7=(this._coverSpacing*0.003);}this._view.shiftX=_7*_5;this._positions=[];for(var i=0;i<this._covers.length;i++){this._positions[i]=(this._view.shiftX*i);}this._view.sizeX=this._positions[this._covers.length-1];this._view.shiftFromMiddle=0.7*_5;var _8=Math.max((_6/_5)-1,0);this._view.distanceToCenter=_8*(_5/2);this._view.distanceFromTop=_5*(this._view.coverScale/1.5);var _9=_5*(1+_8);this._domNode.style.width=_9+"px";this._domNode.style.height=_5+"px";this._trayNode.style.width=_9+"px";this._trayNode.style.height=_5+"px";this._gestureNode.style.width=_9+"px";this._gestureNode.style.height=_5+"px";for(var i=0;i<this._covers.length;i++){this._covers[i].coverNode.style.width=_5+"px";this._covers[i].coverNode.style.height=_5+"px";this._covers[i].coverInnerNode.style.width=_5+"px";this._covers[i].coverInnerNode.style.height=_5+"px";this._covers[i].imageNode.style.width=_5+"px";this._covers[i].imageNode.style.height=_5+"px";this._covers[i].coverReflection.style.width=_5+"px";if(this._reflected){this._covers[i].coverReflectionBack.style.width=_5+"px";this._covers[i].coverReflectionBack.style.height=this._REFLECTION_ATTENUATION*_5+"px";}if(this._displayTitle){this._covers[i].titleNode.style.width=_5+"px";}}if(this._fadeEdges){var _a=_6/15;this._faderLeft.width=_a;this._faderLeft.height=_5;this._faderRight.width=_a;this._faderRight.height=_5;this._faderRight.style.left=0+"px";this._faderRight.style.left=_9-_a+1+"px";this._updateEdgeFaders();}this._createTransformations();this._initTransformations();this._slideTo(this._positions[this._currentPosition],true);},setBackgroundColor:function(_b){this._backgroundColor=_b;var _c={r:(255-this._backgroundColor.r),g:(255-this._backgroundColor.g),b:(255-this._backgroundColor.b)};var _d="rgba("+this._backgroundColor.r+", "+this._backgroundColor.g+", "+this._backgroundColor.b+", 1.0)";this._domNode.style.backgroundColor=_d;var _e=this._borderSize+"px -"+this._borderSize+"px 6px rgba("+_c.r+", "+_c.g+", "+_c.b+", 0.5)";for(var i=0;i<this._covers.length;i++){if(this._reflected){this._covers[i].coverReflectionBack.style.backgroundColor=_d;}if(wink.isset(this._borderSize)&&this._borderSize>0){this._covers[i].imageNode.style["-webkit-box-shadow"]=_e;}}if(this._fadeEdges){this._updateEdgeFaders();}},_validateProperties:function(){if(!wink.isset(this._properties.covers)||this._properties.covers.length==0){wink.log("[CoverFlow] Error: covers property must be specified with at least one cover");return false;}if(!wink.isset(this._properties.size)){wink.log("[CoverFlow] Error: size property must be specified");return false;}if(!wink.isset(this._properties.viewportWidth)){wink.log("[CoverFlow] Error: viewportWidth property must be specified");return false;}if(!wink.isset(this._properties.backgroundColor)){wink.log("[CoverFlow] Error: backgroundColor property must be specified");return false;}if(!wink.isset(this._properties.backgroundColor.r)||!wink.isset(this._properties.backgroundColor.g)||!wink.isset(this._properties.backgroundColor.b)){wink.log("[CoverFlow] Error: backgroundColor property must be specified with \"r, g, b\" values");return false;}if(!wink.isset(this._properties.reflected)){wink.log("[CoverFlow] Error: reflected property must be specified");return false;}if(!wink.isset(this._properties.displayTitle)){wink.log("[CoverFlow] Error: displayTitle property must be specified");return false;}if(!wink.isset(this._properties.handleOrientationChange)){wink.log("[CoverFlow] Error: handleOrientationChange property must be specified");return false;}if(!wink.isset(this._properties.handleGesture)){wink.log("[CoverFlow] Error: handleGesture property must be specified");return false;}for(var i=0;i<this._properties.covers.length;i++){if(!this._isValidCover(this._properties.covers[i])){wink.log("[CoverFlow] Error: bad cover structure");return false;}}return true;},_isValidCover:function(_f){var _10=true;_10=_10&&wink.isset(_f);_10=_10&&wink.isset(_f.image);_10=_10&&wink.isset(_f.title);return _10;},_initProperties:function(){this._covers=new Array().concat(this._properties.covers);this._currentPosition=Math.floor(this._covers.length/2);this._view.x=0;this._middleViewIndex=Math.floor(this._view.numberOfCoverToRender/2);this._lastRenderedIndex=this._currentPosition;this._transformsQueue=[];this._backgroundColor=this._properties.backgroundColor;this._size=this._properties.size;this._viewportWidth=this._properties.viewportWidth;this._coverSpacing=this._properties.coverSpacing;this._borderSize=this._properties.borderSize;this._handleOrientationChange=false;if(this._properties.handleOrientationChange===true){this._handleOrientationChange=true;var wm=new wink.ux.Window();wink.subscribe("/window/events/resize",{context:this,method:"_onOrientationChange"});}this._reflected=false;if(this._properties.reflected===true){this._reflected=true;}this._displayTitle=false;if(this._properties.displayTitle===true){this._displayTitle=true;}this._fadeEdges=false;if(this._properties.fadeEdges===true){this._fadeEdges=true;}this._handleGesture=false;if(this._properties.handleGesture===true){this._handleGesture=true;}this._displayTitleDuration=0;if(wink.isset(this._properties.displayTitleDuration)){this._displayTitleDuration=this._properties.displayTitleDuration;}},_initDom:function(){this._domNode=document.createElement("div");this._domNode.style.webkitUserSelect="none";this._trayNode=document.createElement("div");this._trayNode.style.position="absolute";this._domNode.appendChild(this._trayNode);this._gestureNode=document.createElement("div");this._gestureNode.style.position="absolute";this._domNode.appendChild(this._gestureNode);for(var i=0;i<this._covers.length;i++){var _11=document.createElement("div");var _12=document.createElement("div");var _13=document.createElement("div");var _14=document.createElement("img");var _15=document.createElement("div");_13.appendChild(_14);_13.appendChild(_15);_12.appendChild(_13);_11.appendChild(_12);this._trayNode.appendChild(_11);_11.style.position="absolute";_13.style.position="absolute";this._covers[i].coverNode=_11;this._covers[i].coverOutlineNode=_12;this._covers[i].coverInnerNode=_13;this._covers[i].imageNode=_14;this._covers[i].coverReflection=_15;this._covers[i].transformation=null;this._covers[i].diffTransform=true;this._covers[i].displayed=false;this._covers[i].handleEnd=null;if(this._reflected){var _16=document.createElement("canvas");var _17=document.createElement("div");_15.appendChild(_16);_15.appendChild(_17);_16.style.position="absolute";_17.style.position="absolute";this._covers[i].coverReflectionFront=_16;this._covers[i].coverReflectionBack=_17;}if(this._displayTitle){var _18=document.createElement("div");_15.appendChild(_18);_18.style.position="absolute";var _19=$(this._covers[i].title);_18.appendChild(_19);this._covers[i].titleNode=_18;this._covers[i].titleInnerNode=_19;}this._covers[i].coverNode.style["-webkit-perspective"]=this._PERSPECTIVE;this._covers[i].coverNode.style["-webkit-transform-style"]="preserve-3d";this._covers[i].coverOutlineNode.style["-webkit-transform-style"]="preserve-3d";}if(this._fadeEdges){this._faderLeft=document.createElement("canvas");this._faderRight=document.createElement("canvas");this._domNode.appendChild(this._faderLeft);this._domNode.appendChild(this._faderRight);this._faderLeft.style.position="absolute";this._faderRight.style.position="absolute";}this._hideBackFaces();this._organizeDepth();this.updateSize(this._size,this._viewportWidth);this.setBackgroundColor(this._backgroundColor);wink.setTimeout(this,"_setImages",this._DELAY_BEFORE_IMAGE_LOADING);},_initListeners:function(){this._movementtracker=new wink.ux.MovementTracker({target:this._gestureNode});wink.subscribe("/movementtracker/events/mvtbegin",{context:this,method:"_handleMovementBegin"});wink.subscribe("/movementtracker/events/mvtchanged",{context:this,method:"_handleMovementChanged"});wink.subscribe("/movementtracker/events/mvtstored",{context:this,method:"_handleMovementStored"});if(this._handleGesture){this._gestureNode.listenToGesture("instant_rotation",{context:this,method:"_handleRotation",arguments:null},true);this._gestureNode.listenToGesture("gesture_end",{context:this,method:"_handleGestureEnd",arguments:null},true);}},_handleRotation:function(_1a){if(this._displayMode==false){var _1b=this._view.observerRotation+_1a.rotation;if(_1b>17||_1b<-70){return;}this._view.currentObserverRotation=_1b;for(var i=0;i<this._covers.length;i++){wink.fx.setTransformPart(this._covers[i].coverOutlineNode,3,{type:"rotate",x:1,y:0,z:0,angle:this._view.currentObserverRotation});wink.fx.applyComposedTransform(this._covers[i].coverOutlineNode);}}},_handleGestureEnd:function(_1c){if(this._displayMode==false){this._view.observerRotation=this._view.currentObserverRotation;}},_handleMovementBegin:function(_1d){var _1e=_1d.publisher;if(_1e.uId!=this._movementtracker.uId){return;}this._dragging=false;},_handleMovementChanged:function(_1f){var _20=_1f.publisher;if(_20.uId!=this._movementtracker.uId){return;}if(this._displayMode){return;}var _21=_1f.movement;var _22=_21.pointStatement[_21.pointStatement.length-2];var _23=_21.pointStatement[_21.pointStatement.length-1];var dx=_23.x-_22.x;dx/=2;var _24=this._getBoundsInfos(this._view.x);if(_24.outsideOfBounds){if((_24.direction>0&&_23.directionX>0)||(_24.direction<0&&_23.directionX<0)){dx/=this._OUTOFBOUND_FRICTIONAL_FORCES;}}this._dragging=true;this._slideTo(this._view.x-dx);},_handleMovementStored:function(_25){var _26=_25.publisher;if(_26.uId!=this._movementtracker.uId){return;}if(this._dragging==false){if(this._flipping){return;}var _27=this._currentPosition;var _28=_25.movement.pointStatement[_25.movement.pointStatement.length-1];if(this._displayMode){if(!this._onMiddleCover(_28.x,_28.y)){this._flipping=true;this._unflipCover(_27);}else{var _29=_25.uxEvent;_29.dispatch(_29.target,"click");}}else{if(this._onMiddleCover(_28.x,_28.y)){var _2a=this._covers[_27];if(wink.isset(_2a.action)){if(!wink.isCallback(_2a.action)){wink.log("[CoverFlow] Invalid action for cover : "+_27);return;}wink.call(_2a.action,_2a);}else{if(wink.isset(_2a.backFaceId)){this._flipping=true;this._prepareCoverBackFace(_27);wink.setTimeout(this,"_flipCover",1,_27);}}}}return;}if(this._backToBounds()){return;}},_prepareCoverBackFace:function(_2b){var _2c=$(this._covers[_2b].backFaceId);_2c.style.display="block";_2c.style.position="absolute";_2c.style.width=this._size+"px";_2c.style.height=this._size+"px";wink.fx.set3dTransform(_2c,{type:"rotate",x:0,y:1,z:0,angle:180});_2c.style["-webkit-backface-visibility"]="hidden";this._covers[_2b].coverInnerNode.style["-webkit-backface-visibility"]="hidden";wink.fx.applyTransformTransition(this._covers[_2b].coverOutlineNode,"0ms","0ms",this._TRANSITION_FUNC);wink.fx.setTransformPart(this._covers[_2b].coverOutlineNode,2,{type:"translate",x:0,y:0,z:this._view.zMiddleCover});wink.fx.applyComposedTransform(this._covers[_2b].coverOutlineNode);this._covers[_2b].coverInnerNode.style.webkitTransformOriginZ=this._view.zMiddleCover+"px";this._covers[_2b].coverOutlineNode.appendChild(_2c);},_flipCover:function(_2d){var _2e=this;this._covers[_2d].handleFlipEnd=function(e){_2e._postFlipCover(_2d);};this._covers[_2d].coverOutlineNode.addEventListener("webkitTransitionEnd",this._covers[_2d].handleFlipEnd,false);wink.fx.applyTransformTransition(this._covers[_2d].coverOutlineNode,this._DURATION_FLIP+"ms","0ms",this._TRANSITION_FUNC);wink.fx.setTransformPart(this._covers[_2d].coverOutlineNode,1,{type:"rotate",x:0,y:1,z:0,angle:180});wink.fx.setTransformPart(this._covers[_2d].coverOutlineNode,2,{type:"translate",x:0,y:this._view.distanceFromTop,z:this._view.zMiddleCover*1.5});wink.fx.setTransformPart(this._covers[_2d].coverOutlineNode,3,{type:"rotate",x:1,y:0,z:0,angle:0});wink.fx.applyComposedTransform(this._covers[_2d].coverOutlineNode);this._displayMode=true;},_postFlipCover:function(_2f){this._flipping=false;this._covers[_2f].coverOutlineNode.removeEventListener("webkitTransitionEnd",this._covers[_2f].handleFlipEnd,false);this._gestureNode.style.zIndex=this._Z_INDEX_BACKGROUND;wink.fx.set3dTransform(this._gestureNode,{type:"translate",x:0,y:0,z:this._view.zMiddleCover/2});},_unflipCover:function(_30){wink.fx.setTransformPart(this._covers[_30].coverOutlineNode,1,{type:"rotate",x:0,y:1,z:0,angle:0});wink.fx.setTransformPart(this._covers[_30].coverOutlineNode,2,{type:"translate",x:0,y:0,z:0});wink.fx.setTransformPart(this._covers[_30].coverOutlineNode,3,{type:"rotate",x:1,y:0,z:0,angle:this._view.currentObserverRotation});wink.fx.applyComposedTransform(this._covers[_30].coverOutlineNode);this._covers[_30].coverInnerNode.style.webkitTransformOriginZ=0+"px";var _31=this;this._covers[_30].handleFlipEnd=function(e){_31._postUnflipCover(_30);};this._covers[_30].coverOutlineNode.addEventListener("webkitTransitionEnd",this._covers[_30].handleFlipEnd,false);},_postUnflipCover:function(_32){wink.fx.applyTransformTransition(this._covers[_32].coverOutlineNode,"0ms","0ms",this._TRANSITION_FUNC);var _33=$(this._covers[_32].backFaceId);_33.style.display="none";this._displayMode=false;this._flipping=false;this._covers[_32].coverOutlineNode.removeEventListener("webkitTransitionEnd",this._covers[_32].handleFlipEnd,false);this._gestureNode.style.zIndex=this._Z_INDEX_BACKGROUND+4;wink.fx.set3dTransform(this._gestureNode,{type:"translate",x:0,y:0,z:this._view.zGestureNode});},_onOrientationChange:function(_34){var _35=_34.width;this.updateSize(this._size,_35);},_getPosition:function(x){var _36=null;for(var i=0;i<this._positions.length;i++){_36=i;if(x<(this._positions[i]+(this._view.shiftX/2))){break;}}return _36;},_slideTo:function(x,_37){var _38=wink.math.round(x,2);if(_38!=this._view.x||_37===true){this._view.x=_38;wink.fx.set3dTransform(this._trayNode,{type:"translate",x:-this._view.x+this._view.distanceToCenter,y:-this._view.distanceFromTop,z:0});this._updateView();}},_updateView:function(){var _39=this._getPosition(this._view.x);if(_39!=this._currentPosition){this._currentPosition=_39;this._addToQueue(this._currentPosition);}},_startRenderer:function(){if(this._renderer==null){this._renderer=wink.setTimeout(this,"_rendererProcess",1);}},_stopRenderer:function(){if(this._renderer!=null){clearTimeout(this._renderer);this._renderer=null;}},_rendererProcess:function(){if(this._transformsQueue[0].rendering==false){this._transformsQueue[0].rendering=true;var _3a=this._transformsQueue[0].position;var _3b=this;this._covers[_3a].handleEnd=function(e){_3b._handleCoverRendered(_3a);};this._covers[_3a].coverInnerNode.addEventListener("webkitTransitionEnd",this._covers[_3a].handleEnd,false);this._updateTransformations(_3a);var _3c=wink.math.round(this._DURATION_MIDDLE/(this._transformsQueue.length*2),0);var _3d=wink.math.round(this._DURATION_AROUND/(this._transformsQueue.length*2),0);this._updateTransitions(_3a,_3c,_3d);this._applyTransformations();}else{if(this._transformsQueue[0].rendered==true){this._transformsQueue.shift();if(this._transformsQueue.length==0){this._stopRenderer();return;}}else{if(this._transformsQueue.length>1){this._handleCoverRendered(this._transformsQueue[0].position);}}}this._renderer=wink.setTimeout(this,"_rendererProcess",this._RENDERER_INTERVAL);},_handleCoverRendered:function(_3e){this._lastRenderedIndex=_3e;if(this._covers[_3e].handleEnd!=null){this._covers[_3e].coverInnerNode.removeEventListener("webkitTransitionEnd",this._covers[_3e].handleEnd,false);this._covers[_3e].handleEnd=null;}if(this._transformsQueue.length==0){return;}this._transformsQueue[0].rendered=true;},_addToQueue:function(_3f){this._transformsQueue.push({timestamp:new Date().getTime(),position:_3f,rendered:false,rendering:false});this._startRenderer();},_updateTransformations:function(_40){var _41=Math.abs(this._lastRenderedIndex-_40)-1;var _42=this._middleViewIndex+_41;var _43=_40-_42;var end=_40+(_42+1);if(_40<_42){_43=0;}if(end>this._covers.length){end=this._covers.length;}for(var i=0;i<this._covers.length;i++){this._covers[i].diffTransform=false;}for(var i=_43;i<end;i++){this._covers[i].oldTransformation=this._covers[i].transformation;this._covers[i].transformation=this._getTargetedTransformation(i,_40);this._covers[i].diffTransform=this._transformationsDifferent(this._covers[i].oldTransformation,this._covers[i].transformation);}},_updateTransitions:function(_44,_45,_46){for(var i=0;i<this._covers.length;i++){if(this._covers[i].diffTransform){if(i==_44){wink.fx.applyTransformTransition(this._covers[i].coverInnerNode,_45+"ms","0ms",this._TRANSITION_FUNC);}else{wink.fx.applyTransformTransition(this._covers[i].coverInnerNode,_46+"ms","0ms",this._TRANSITION_FUNC);}}}},_applyTransformations:function(){for(var i=0;i<this._covers.length;i++){if(this._covers[i].diffTransform){wink.fx.setTransformPart(this._covers[i].coverInnerNode,1,this._covers[i].transformation.rotation);wink.fx.setTransformPart(this._covers[i].coverInnerNode,2,this._covers[i].transformation.translation);wink.fx.applyComposedTransform(this._covers[i].coverInnerNode);if(this._displayTitle){if(i==this._currentPosition){if(this._displayTitleDuration>0){if(wink.isset(this._timerTitle)){clearTimeout(this._timerTitle);this._timerTitle=null;}this._timerTitle=wink.setTimeout(this,"_showTitle",this._DELAY_FOR_TITLE_DISPLAY,i);}else{this._showTitle(i);}}else{if(this._displayTitleDuration>0){wink.fx.applyTransition(this._covers[i].titleNode,"opacity","0ms","0ms",this._TRANSITION_FUNC);}this._setTitleOpacity(i,0);}}}}},_transformationsDifferent:function(t1,t2){return (t1.rotation.angle!=t2.rotation.angle);},_initTransformations:function(){for(var i=0;i<this._covers.length;i++){wink.fx.initComposedTransform(this._covers[i].coverNode);wink.fx.setTransformPart(this._covers[i].coverNode,1,{type:"scale",x:this._view.coverScale,y:this._view.coverScale,z:1});wink.fx.setTransformPart(this._covers[i].coverNode,2,{type:"translate",x:this._positions[i],y:0,z:0});wink.fx.storeComposedTransform(this._covers[i].coverNode);wink.fx.removeComposedTransform(this._covers[i].coverNode);wink.fx.initComposedTransform(this._covers[i].coverOutlineNode);wink.fx.initComposedTransform(this._covers[i].coverInnerNode);this._covers[i].transformation=this._getTargetedTransformation(i,this._currentPosition);}this._applyTransformations();wink.fx.set3dTransform(this._gestureNode,{type:"translate",x:0,y:0,z:this._view.zGestureNode});},_createTransformations:function(){this._transformations={left:{rotation:{type:"rotate",x:0,y:1,z:0,angle:this._view.coverRotation},translation:{type:"translate",x:-this._view.shiftFromMiddle,y:0,z:this._view.zAroundCover}},middle:{rotation:{type:"rotate",x:0,y:1,z:0,angle:0},translation:{type:"translate",x:0,y:0,z:this._view.zMiddleCover}},right:{rotation:{type:"rotate",x:0,y:1,z:0,angle:-this._view.coverRotation},translation:{type:"translate",x:this._view.shiftFromMiddle,y:0,z:this._view.zAroundCover}}};},_getTargetedTransformation:function(_47,_48){if(_47<_48){return this._transformations.left;}else{if(_47>_48){return this._transformations.right;}else{return this._transformations.middle;}}},_showTitle:function(_49){if(wink.isset(this._timerTitle)){clearTimeout(this._timerTitle);this._timerTitle=null;}if(_49==this._currentPosition){if(this._displayTitleDuration>0){wink.fx.applyTransition(this._covers[_49].titleNode,"opacity",this._displayTitleDuration+"ms","0ms",this._TRANSITION_FUNC);}this._setTitleOpacity(_49,1);}},_setTitleOpacity:function(_4a,_4b){this._covers[_4a].titleNode.style.opacity=_4b;},_hideBackFaces:function(){for(var i=0;i<this._covers.length;i++){if(wink.isset(this._covers[i].backFaceId)){var _4c=$(this._covers[i].backFaceId);_4c.style.display="none";}}},_setImages:function(){for(var i=0;i<this._covers.length;i++){if(this._reflected){this._applyReflection(i);}this._covers[i].imageNode.src=this._covers[i].image;}},_organizeDepth:function(){this._domNode.style.zIndex=this._Z_INDEX_BACKGROUND;this._trayNode.style.zIndex=this._Z_INDEX_BACKGROUND+1;this._gestureNode.style.zIndex=this._Z_INDEX_BACKGROUND+4;if(this._reflected){for(var i=0;i<this._covers.length;i++){if(this._displayTitle){this._covers[i].titleNode.style.zIndex=this._Z_INDEX_BACKGROUND+4;}this._covers[i].coverReflectionFront.style.zIndex=this._Z_INDEX_BACKGROUND+3;this._covers[i].coverReflectionBack.style.zIndex=this._Z_INDEX_BACKGROUND+2;}}if(this._fadeEdges){this._faderLeft.style.zIndex=this._Z_INDEX_BACKGROUND+4;this._faderRight.style.zIndex=this._Z_INDEX_BACKGROUND+4;}},_applyReflection:function(_4d){var img=this._covers[_4d].imageNode;var _4e=this._covers[_4d].coverReflectionFront;var _4f=this;this._covers[_4d].imageLoadingHandler=function(){_4f._reflect(_4d,img,_4e,img.width,img.height);};img.addEventListener("load",this._covers[_4d].imageLoadingHandler);},_reflect:function(_50,_51,_52,_53,_54){_52.width=_53;_52.height=_54;var ctx=_52.getContext("2d");ctx.save();ctx.translate(0,(_54/1.5));ctx.scale(1,-1);ctx.drawImage(_51,0,0,_53,_54/1.5);ctx.restore();ctx.globalCompositeOperation="destination-out";var _55=ctx.createLinearGradient(0,0,0,_54);_55.addColorStop(0,"rgba(255, 255, 255, "+this._REFLECTION_ATTENUATION+")");_55.addColorStop(0.6,"rgba(255, 255, 255, 1.0)");ctx.fillStyle=_55;ctx.fillRect(0,0,_53,_54);_51.removeEventListener("load",this._covers[_50].imageLoadingHandler);},_updateEdgeFaders:function(){var ctx=this._faderLeft.getContext("2d");var _56=ctx.createLinearGradient(0,0,this._faderLeft.width,0);_56.addColorStop(0,"rgba("+this._backgroundColor.r+", "+this._backgroundColor.g+", "+this._backgroundColor.b+", 1.0)");_56.addColorStop(1,"rgba("+this._backgroundColor.r+", "+this._backgroundColor.g+", "+this._backgroundColor.b+", 0.0)");ctx.fillStyle=_56;ctx.fillRect(0,0,this._faderLeft.width,this._faderLeft.height);ctx=this._faderRight.getContext("2d");_56=ctx.createLinearGradient(0,0,this._faderRight.width,0);_56.addColorStop(0,"rgba("+this._backgroundColor.r+", "+this._backgroundColor.g+", "+this._backgroundColor.b+", 0.0)");_56.addColorStop(1,"rgba("+this._backgroundColor.r+", "+this._backgroundColor.g+", "+this._backgroundColor.b+", 1.0)");ctx.fillStyle=_56;ctx.fillRect(0,0,this._faderRight.width,this._faderRight.height);},_backToBounds:function(){var _57=this._getBoundsInfos(this._view.x);if(_57.outsideOfBounds){this._slideTo(_57.positionOfBound,this._DURATION_BACKTO_BOUND);return true;}return false;},_getBoundsInfos:function(_58){var _59={};_59.outsideOfBounds=false;if(_58<0||_58>this._view.sizeX){_59.outsideOfBounds=true;if(_58<0){_59.distanceToBound=Math.abs(_58);_59.direction=1;_59.positionOfBound=0;}else{_59.distanceToBound=Math.abs(_58-this._view.sizeX);_59.direction=-1;_59.positionOfBound=this._view.sizeX;}}return _59;},_onMiddleCover:function(x,y){var _5a=wink.math.round((this._size*this._view.coverScale)*1.5,0);var _5b=wink.math.round((this._size/2)-(_5a/2)-this._view.distanceFromTop,0);var _5c=wink.math.round((this._size/2)-(_5a/2)+this._view.distanceToCenter,0);var _5d=_5b+_5a;var _5e=_5c+_5a;if(this._displayMode){_5a=wink.math.round((this._size*this._view.coverScale)*2,0);_5b=wink.math.round((this._size/2)-(_5a/2)-(this._view.distanceFromTop/2),0);_5c=wink.math.round((this._size/2)-(_5a/2)+this._view.distanceToCenter,0);_5d=_5b+_5a;_5e=_5c+_5a;}if(x>=_5c&&x<=_5e&&y>=_5b&&y<=_5d){return true;}return false;}};});