//>>built
define("demos/survey/src/test",["dojo","dijit","dojox","dojo/require!dojox/cometd"],function(_1,_2,_3){_1.require("dojox.cometd");(function(){var _4=function(e){e.preventDefault();_1.xhrPost({url:"submit.php",form:"survey",load:function(_5,_6){_1.byId("postSurvey").disabled=true;_1.fadeOut({node:"container",onEnd:function(){var _7=_5;_1.byId("responseText").innerHTML=_5;_1.style("formNode","display","none");_1.fadeIn({node:"container",onEnd:function(){_3.cometd.publish("/demo/survey/redraw",_7);}}).play(5);}}).play();}});};var _8=function(e){var _9=_1.byId("other").value;var lc=_9.toLowerCase();_1.stopEvent(e);if(!_9||_1.byId(lc)){return;}var cb=_1.doc.createElement("input");cb["type"]="checkbox";cb["name"]=lc;cb.id=lc;var _a=_1.doc.createElement("label");_a.setAttribute("for",lc);_a.innerHTML=" "+_9;var br=_1.doc.createElement("br");var _b=_1.byId("choices");_b.appendChild(cb);_b.appendChild(_a);_b.appendChild(br);};_1.addOnLoad(function(){_3.cometd.init("http://comet.sitepen.com:9000/cometd");_1.connect(_1.byId("survey"),"onsubmit",_4);_1.connect(_1.byId("addChoice"),"onclick",_8);});})();});