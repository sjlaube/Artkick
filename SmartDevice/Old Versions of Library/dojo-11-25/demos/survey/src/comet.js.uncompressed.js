// wrapped by build app
define("demos/survey/src/comet", ["dojo","dijit","dojox","dojo/require!dojox/cometd"], function(dojo,dijit,dojox){
dojo.provide("demos.survey.src.comet");
dojo.require("dojox.cometd");

var startService = function(){
	dojox.cometd.init("http://cometd.sitepen.com/cometd");

	dojox.cometd.subscribe("/demo/survey/redraw",function(d){
	    getResults();
	});
	
};
dojo.addOnLoad(startService);

});
