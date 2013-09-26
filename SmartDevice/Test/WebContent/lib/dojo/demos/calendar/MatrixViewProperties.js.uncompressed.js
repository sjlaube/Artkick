require({cache:{
'url:demos/calendar/templates/MatrixViewProperties.html':"<div>\n    <table class=\"formTable\" >\n\t\t<tr>\n\t\t\t<td class=\"smallText\">\n\t\t\t\t<label for=\"roundToDayCB\">Round to day:</label>\n\t\t\t</td>\n\t\t\t<td class=\"smallText\">\n\t\t\t\t<input type=\"checkbox\" data-dojo-attach-point=\"roundToDayCB\" data-dojo-type=\"dijit.form.CheckBox\" checked=\"true\"/>\n\t\t\t</td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Overlap (%):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"overlapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"0\" constraints=\"{min:0, max:100}\" intermediateChanges=\"true\" smallDelta=\"10\"  ></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Vertical gap (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"vGapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\"  constraints=\"{min:0, max:30}\" value=\"4\" intermediateChanges=\"true\" ></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Horiz. height (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"hRendererHeightEditor\" data-dojo-type=\"dijit.form.NumberSpinner\"  constraints=\"{min:0, max:50}\" value=\"17\" intermediateChanges=\"true\" ></div></td>\n\t\t</tr>\n\n\t\t<tr>\n\t\t\t<td>Labels height (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"lRendererHeightEditor\" data-dojo-type=\"dijit.form.NumberSpinner\"  constraints=\"{min:0, max:50}\" value=\"14\" intermediateChanges=\"true\" ></div></td>\n\t\t</tr>\n\n\t\t<tr>\n\t\t\t<td>Expand irs height (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"eRendererHeightEditor\" data-dojo-type=\"dijit.form.NumberSpinner\"  constraints=\"{min:0, max:50}\" value=\"15\" intermediateChanges=\"true\" ></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Renderer kind:</td>\n\t\t\t<td class=\"right\">\n\t\t\t\t<select data-dojo-attach-point=\"rendererKindEditor\" data-dojo-type=\"dijit.form.ComboBox\" style=\"width:80px;\" searchAttr=\"label\">\n\t\t\t\t</select>\n\t\t\t</td>\n\t\t</tr>\n\t</table>\n\t<table class=\"formTable\" style=\"margin-top:10px\">\n\t\t<tr>\n\t\t\t<td>Row format:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"rowHeaderFormatEditor\" data-dojo-type=\"dijit.form.TextBox\"  placeHolder=\"ex: w\"></div></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Cell short format:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"cellShortFormatEditor\" data-dojo-type=\"dijit.form.TextBox\"  placeHolder=\"ex: dd\"></div></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Cell long format:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"cellLongFormatEditor\" data-dojo-type=\"dijit.form.TextBox\"  placeHolder=\"ex: MMMM, dd\"></div></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td colspan=\"2\" style=\"text-align:right;padding-top:5px;padding-right:5px\"><button data-dojo-attach-point=\"dateFormatButton\" data-dojo-type=\"dijit.form.Button\">Apply format</button></td>\n\t\t</tr>\n\t</table>\n\n</div>\n\t\t    \n"}});
define("demos/calendar/MatrixViewProperties", [
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",           
	"dijit/_WidgetBase",	
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/MatrixViewProperties.html",
	"dojo/store/Memory",
	"dijit/form/CheckBox", 
	"dijit/form/TextBox",
	"dijit/form/Button", 
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
					
	return declare("demo.MatrixViewProperties", [_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
		
		templateString: template,
		
		postCreate: function(){
			
			this.inherited(arguments);
			
			var self = this;
			
			this.dateFormatButton.on("click", function(){
				self.matrixView.set("rowHeaderDatePattern", self.rowHeaderFormatEditor.value);				
				self.matrixView.set("cellHeaderLongPattern", self.cellLongFormatEditor.value);
				self.matrixView.set("cellHeaderShortPattern", self.cellShortFormatEditor.value);
			});
			
			this.roundToDayCB.on("change", function(value){
				self.matrixView.set("roundToDay", value);
			});

			this.overlapEditor.on("change", function(value){
				self.matrixView.set("percentOverlap", this.value);
				self.vGapEditor.set("disabled", value!=0);
			});
			
			// the item to renderer kind functions.
			var itemToRendererKindFuncs = [
				null, 
				function(item){ return "horizontal"; },
				function(item){ return item.allDay ? "horizontal" : "label";},
				function(item){ return "label";}
			]; 
			
			this.rendererKindEditor.set("store", new Memory({data:[
				{id:0, label: "default"},
				{id:1, label: "All horizontals"},
				{id:2, label: "Only all day horizontals"},
				{id:3, label: "All labels"}
			]}));
			
			this.rendererKindEditor.watch("item", function(prop, oldValue, newValue){
				self.matrixView.set("itemToRendererKindFunc", itemToRendererKindFuncs[newValue.id]);
			});
			
			this.overlapEditor.on("change", function(value){
				self.matrixView.set('percentOverlap', value);
				self.vGapEditor.set("disabled", value!=0);
			});
			
			this.vGapEditor.on("change", function(value){
				self.matrixView.set('verticalGap', value);				
			});
			
			this.hRendererHeightEditor.on("change", function(value){
				self.matrixView.set('horizontalRendererHeight', value);				
			});
			
			this.hRendererHeightEditor.on("change", function(value){
				self.matrixView.set('horizontalRendererHeight', value);				
			});
			
			this.lRendererHeightEditor.on("change", function(value){
				self.matrixView.set('labelRendererHeight', value);				
			});
			
			this.hRendererHeightEditor.on("change", function(value){
				self.matrixView.set('horizontalRendererHeight', value);				
			});
			
			this.eRendererHeightEditor.on("change", function(value){
				self.matrixView.set('expandRendererHeight', value);				
			});
			
			this.eRendererHeightEditor.on("change", function(value){
				self.matrixView.set('expandRendererHeight', value);				
			});
			
			this.eRendererHeightEditor.on("change", function(value){
				self.matrixView.set('expandRendererHeight', value);				
			});

		},
		
		view: null,
		
		_setViewAttr: function(value){
			this._set("view", value);
			this.matrixView = value;				
		}
		
	});
});
