require({cache:{
'url:demos/calendar/templates/ColumnViewProperties.html':"<div>\n    <table class=\"formTable\">\n\t\t\t\t\t\t\t\t\n\t\t<tr>\n\t\t\t<td>Min hours:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"minHoursEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"8\" data-dojo-props=\"constraints:{min:0, max:23}, intermediateChanges:true\"></div></td>\n\t\t</tr>\n\t\t\t\t\n\t\t<tr>\n\t\t\t<td>Max Hours:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"maxHoursEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"18\" data-dojo-props=\"constraints:{min:1, max:24}, intermediateChanges:true\"></div></td>\n\t\t</tr>\n\t\t\t\t\n\t\t<tr>\n\t\t\t<td>Hour size(px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"hourSizeEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"100\" data-dojo-props=\"constraints:{min:0, max:500}, intermediateChanges:true, smallDelta:25\" ></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Timeslot (minutes):</td>\n\t\t\t<td class=\"right\">\n\t\t\t\t<select data-dojo-attach-point=\"timeSlotEditor\" data-dojo-type=\"dijit.form.ComboBox\" style=\"width:80px;\" >\n\t\t\t\t\t<option value=\"15\" selected>15</option>\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t<option value=\"30\">30</option>\n\t\t\t\t\t<option value=\"60\">60</option>\n\t\t\t\t</select>\n\t\t\t</td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Row Header Grid Timeslot:</td>\n\t\t\t<td class=\"right\">\n\t\t\t\t<select data-dojo-attach-point=\"rhgtimeSlotEditor\" data-dojo-type=\"dijit.form.ComboBox\" style=\"width:80px;\" >\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t<option value=\"15\">15</option>\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t<option value=\"30\">30</option>\n\t\t\t\t\t<option value=\"60\" selected>60</option>\n\t\t\t\t</select>\n\t\t\t</td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Row Header Label Timeslot:</td>\n\t\t\t<td class=\"right\">\n\t\t\t\t<select data-dojo-attach-point=\"rhltimeSlotEditor\" data-dojo-type=\"dijit.form.ComboBox\" style=\"width:80px;\" >\n\t\t\t\t\t<option value=\"15\">15</option>\n\t\t\t\t\t<option value=\"30\">30</option>\n\t\t\t\t\t<option value=\"60\" selected>60</option>\n\t\t\t\t</select>\n\t\t\t</td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Row Header Label offset:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"rhoEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"2\" data-dojo-props=\"constraints:{min:-20, max:20}, intermediateChanges:true\" ></div></td>\n\t\t</tr>\n\t\t\n\t\t\n\t\t<tr>\n\t\t\t<td>Overlap (%):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"overlapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" data-dojo-props=\"value:70, constraints:{min:0, max:100}, intermediateChanges:true, smallDelta:10\" style=\"width:80px\"></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Horizontal gap (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"hGapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" data-dojo-props=\"constraints:{min:0, max:30}, value:2, intermediateChanges:true, disabled:true\"></div></td>\n\t\t</tr>\n\t\t\n\t</table>\n\t<table class=\"formTable\" style=\"margin-top:10px\">\n\n\t\t<tr>\n\t\t\t<td>Row header format:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"rowHeaderFormatEditor\" data-dojo-type=\"dijit.form.TextBox\" data-dojo-props=\"placeHolder:'ex: h a'\"></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Column header format:</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"columnHeaderFormatEditor\" data-dojo-type=\"dijit.form.TextBox\" data-dojo-props=\"placeHolder:'ex: EEE MMM, dd'\"></div></td>\t\t\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td colspan=\"2\" style=\"text-align:right;padding-top:5px;padding-right:5px\"><button data-dojo-attach-point=\"dateFormatButton\" data-dojo-type=\"dijit.form.Button\">Apply formats</button></td>\n\t\t</tr>\n\t\n\t</table>\n\n</div>\n\t\t    \n"}});
define("demos/calendar/ColumnViewProperties", [
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",           
	"dijit/_WidgetBase",	
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/ColumnViewProperties.html",
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
	template){
					
	return declare("demo.ColumnViewProperties", [_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
		
		templateString: template,
		
		postCreate: function(){
			
			this.inherited(arguments);
			
			var self = this;
			
			this.dateFormatButton.on("click", function(value){
				self.colView.set("rowHeaderTimePattern", self.rowHeaderFormatEditor.value);
				self.colView.set("columnHeaderDatePattern", self.columnHeaderFormatEditor.value);
			});
			
			this.overlapEditor.on("change", function(value){
				self.colView.set('percentOverlap', value);
				self.hGapEditor.set("disabled", value!=0);
			});
			
			this.minHoursEditor.on("change", function(value){
				self.colView.set('minHours', value);
			});
			
			this.maxHoursEditor.on("change", function(value){
				self.colView.set('maxHours', value);
			});
			
			this.hourSizeEditor.on("change", function(value){
				self.colView.set('hourSize', value);
			});
			
			this.timeSlotEditor.on("change", function(value){
				self.colView.set('timeSlotDuration', value);
			});
			
			this.rhgtimeSlotEditor.on("change", function(value){
				self.colView.set('rowHeaderGridSlotDuration', value);
			});
			
			this.rhltimeSlotEditor.on("change", function(value){
				self.colView.set('rowHeaderLabelSlotDuration', value);
			});
			
			this.rhoEditor.on("change", function(value){
				self.colView.set('rowHeaderLabelOffset', value);
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
