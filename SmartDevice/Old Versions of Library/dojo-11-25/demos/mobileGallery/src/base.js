//>>built
define("demos/mobileGallery/src/base",["dojo/_base/array","dojo/_base/window","dojo/has"],function(_1,_2,_3){function _4(_5,_6){_3(_5,function(){return _6;},true,true);};var _7=_2.global.location.search;if(_7&&_7.length>1){var _8=_7.substr(1).split("&");_1.forEach(_8,function(_9){var _a=_9.split("=");if(_a[0]==="theme"&&_a[1]){switch(_a[1].toLowerCase()){case "iphone":_4("iphone",true);_4("android",false);_4("webos",false);break;case "android":_4("iphone",false);_4("android",true);_4("webos",false);break;case "webos":_4("iphone",false);_4("android",false);_4("webos",true);break;}}});}});