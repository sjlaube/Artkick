// wrapped by build app
define("demos/beer/src/Lady", ["dojo","dijit","dojox","dojo/require!dijit/_Widget,dijit/_Templated,dojox/timing/Sequence"], function(dojo,dijit,dojox){
dojo.provide("demos.beer.src.Lady");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.timing.Sequence");

dojo.declare("beer._LadyBehavior", null, {
	
	constructor: function(){

		console.log(this, arguments);
		this._batEyes = [
			{ func: [dojo.hitch(this,"smile",true), this], pauseAfter:200 },
			{ func: [dojo.hitch(this,"blink",45), this], repeat: 3, pauseAfter: 100 },
			{ func: [dojo.hitch(this,"smile",false), this], pauseBefore:200 }
		];
		
	},
	
	bat: function(){
		this.actions.go(this._batEyes);
	}
		
});

dojo.declare("beer.Lady", [dijit._Widget, dijit._Templated, beer._LadyBehavior], {

	templateString:"<div class=\"beerLady\">\n\t<div class=\"beerLadyInner\" dojoAttachPoint=\"innerNode\">\n\t\t<div class=\"beerLadySmile\"></div>\n\t\t<div class=\"beerLadyBlink\"></div>\n\t\t<div class=\"beerLadyMouth\"></div>\n\t</div>\n</div>",

	constructor: function(args, node){
		dojo.mixin(this, args);
		this.actions = new dojox.timing.Sequence({});
	},

	smile: function(/* Boolean */on){
		// summary:
		//		make her happy
		var n = this.innerNode;
		dojo.removeClass(n,"beerLadyAngry");
		dojo[(on ? "addClass" : "removeClass")](n, "beerLadySmiling");
	},
	
	frown: function(/* Boolean */on){
		var n = this.innerNode;
		dojo.removeClass(n,"beerLadySmiling");
		dojo[(on ? "addClass" : "removeClass")](n,"beerLadyAngry");
	},
	
	blink: function(closeDuration, forced){
		if(this._blinking && !forced){ clearTimeout(this._blinking); }
		dojo.addClass(this.innerNode, "beerLadyBlinking");
		this._blinking = setTimeout(dojo.hitch(this,function(){
			dojo.removeClass(this.innerNode,"beerLadyBlinking");
		}), closeDuration || 275);
	},
	
	say: function(dialog){
		
		
	}
		
});

});
