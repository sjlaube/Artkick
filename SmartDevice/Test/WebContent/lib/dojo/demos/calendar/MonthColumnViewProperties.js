//>>built
require({cache:{"url:demos/calendar/templates/MonthColumnViewProperties.html":"<div>\n    <table class=\"formTable\">\n\t\t<tr>\n\t\t\t<td>Day size(px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"daySizeEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" value=\"30\" data-dojo-props=\"constraints:{min:20, max:200}, intermediateChanges:true, smallDelta:5\" ></div></td>\n\t\t</tr>\n\t\t\t\t\t\t\t\t\n\t\t<tr>\n\t\t\t<td>Overlap (%):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"overlapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" data-dojo-props=\"value:0, constraints:{min:0, max:100}, intermediateChanges:true, smallDelta:10\"></div></td>\n\t\t</tr>\n\t\t\n\t\t<tr>\n\t\t\t<td>Horizontal gap (px):</td>\n\t\t\t<td class=\"right\"><div data-dojo-attach-point=\"hGapEditor\" data-dojo-type=\"dijit.form.NumberSpinner\" data-dojo-props=\"constraints:{min:0, max:30}, value:2, intermediateChanges:true\" ></div></td>\n\t\t</tr>\n\t\t\t\t\t\t\t\n\t</table>\n</div>\n\t\t    \n"}});define("demos/calendar/MonthColumnViewProperties",["dojo/_base/declare","dojo/_base/lang","dojo/_base/array","dijit/_WidgetBase","dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin","dojo/text!./templates/MonthColumnViewProperties.html","dijit/form/NumberSpinner","dijit/form/ComboBox"],function(_1,_2,_3,_4,_5,_6,_7,_8){return _1("demo.MonthColumnViewProperties",[_4,_5,_6],{templateString:_7,postCreate:function(){this.inherited(arguments);var _9=this;this.daySizeEditor.on("change",function(_a){_9.colView.set("daySize",_a);});this.overlapEditor.on("change",function(_b){_9.colView.set("percentOverlap",_b);_9.hGapEditor.set("disabled",_b!=0);});this.hGapEditor.on("change",function(_c){_9.colView.set("horizontalGap",_c);});},view:null,_setViewAttr:function(_d){this._set("view",_d);this.colView=_d;}});});