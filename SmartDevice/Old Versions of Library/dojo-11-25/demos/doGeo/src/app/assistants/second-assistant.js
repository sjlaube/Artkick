//>>built
define("demos/doGeo/src/app/assistants/second-assistant",["dojo","dijit","dojox","dojo/require!dojox/mobile/app/SceneAssistant"],function(_1,_2,_3){_1.require("dojox.mobile.app.SceneAssistant");_1.declare("SecondAssistant",_3.mobile.app.SceneAssistant,{setup:function(){this.controller.parse();var _4=this;var _5=_2.byId("secondSceneLauncher");this.connect(_2.byId("btn1"),"onClick",function(){_4.controller.stageController.popScene("Button 1");});this.connect(_2.byId("btn2"),"onClick",function(){_4.controller.stageController.pushScene("third","Came from second scene");});},activate:function(_6){var _7=this.controller.query(".inputData")[0];if(_6){_7.innerHTML="Scene got the data: "+_6;}else{_7.innerHTML="Scene did not receive data";}}});});