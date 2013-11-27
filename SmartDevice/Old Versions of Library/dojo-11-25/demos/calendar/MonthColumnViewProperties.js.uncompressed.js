require({cache:{
'url:demos/calendar/templates/MonthColumnViewProperties.html':"<div>\n    <table class=\"formTable\">\n\t\t<tr>\n\t\t\t<td>Day size(px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"daySizeEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"30\" data-dojo-props=\"constraints:{min:20, max:200}, intermediateChanges:true, smallDelta:5\" ></div></td>\n\t\t</tr>\n\t\t\t\t\t\t\t\t\n\t\t<tr>\n\t\t\t<td>Overlap (%):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"overlapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" data-dojo-props=\"value:0, constraints:{min:0, max:100}, intermediateChanges:true, smallDelta:10\"></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Horizontal gap (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"hGapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" data-dojo-props=\"constraints:{min:0, max:30}, value:2, intermediateChanges:true\" ></div></td>\n\t\t</tr>\n\t\t\t\t\t\t\t\n\t</table>\n</div>\n\t\t    \n"}});
define("demos/calendar/MonthColumnViewProperties", [
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",           
	"dijit/_WidgetBase",	
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/MonthColumnViewProperties.html",	
	"dijit/form/NumberSpinner",
	"dijit/form/ComboBox"    
],

function(
	declare,
	lang,
	arr,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	template,
	Memory){
					
	return declare("demo.MonthColumnViewProperties", [_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
		
		templateString: template,
		
		postCreate: function(){
			
			this.inherited(arguments);
			
			var self = this;
			
			this.daySizeEditor.on("change", function(value){
				self.colView.set('daySize', value);							
			});
			
			this.overlapEditor.on("change", function(value){
				self.colView.set('percentOverlap', value);
				self.hGapEditor.set("disabled", value!=0);				
			});
			
			this.hGapEditor.on("change", function(value){
				self.colView.set('horizontalGap', value);							
			});
								
		},
		
		view: null,
		
		_setViewAttr: function(value){
			this._set("view", value);
			this.colView = value;				
		}
		
	});
});
