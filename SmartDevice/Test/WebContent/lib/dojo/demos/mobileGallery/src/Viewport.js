//>>built
define("demos/mobileGallery/src/Viewport",["dojo/_base/lang","dojo/dom-construct","dojo/dom-prop","dojox/mobile/sniff"],function(_1,_2,_3,_4){_1.getObject("demos.mobileGallery.src.Viewport",true);var _5=null;demos.mobileGallery.src.Viewport={onViewportChange:function(){var _6=document.getElementsByTagName("head")[0];if(!_5){_5=_2.create("meta");_3.set(_5,"name","viewport");_6.appendChild(_5);}var _7=(window.orientation==0);if(_4("ios")){if(_7){var _8=window.screen.height==568;if(_8){_3.set(_5,"content","width=device-width,height=504,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no");}else{_3.set(_5,"content","width=device-width,height=416,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no");}}else{_3.set(_5,"content","width=device-width,height=268,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no");}}}};return demos.mobileGallery.src.Viewport;});