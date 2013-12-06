//>>built
require({cache:{"url:demos/calendar/templates/MainProperties.html":"<div>\n    <div data-dojo-attach-point=\"datePicker\" data-dojo-type=\"demo.DatePicker\" style=\"width:250px\"></div>\n\t<div data-dojo-type=\"dijit.TitlePane\" data-dojo-props=\"title:'Calendars', style:'margin-top:10px;width:250px'\" >\n\t\t<div>\n\t\t\t<input type=\"checkbox\" data-dojo-attach-point=\"calendar1CB\" data-dojo-type=\"dijit.form.CheckBox\" checked=\"true\"/>\n\t\t\t<label for=\"calendar1CB\">Calendar 1</label>\n\t\t</div>\n\t\t\t\t\n\t\t<div style=\"margin-top:5px\">\n\t\t\t<input type=\"checkbox\" data-dojo-attach-point=\"calendar2CB\" data-dojo-type=\"dijit.form.CheckBox\" checked=\"true\"/>\n\t\t\t<label for=\"calendar2CB\">Calendar 2</label>\n\t\t</div>\n\t</div>\n\t<div data-dojo-type=\"dijit.TitlePane\" data-dojo-props=\"title:'Event properties', style:'margin-top:10px;width:250px'\" >\n\t\t<div><span class=\"propertyTitle\">Summary:</span></div>\n\t\t<div data-dojo-attach-point=\"itemSummaryEditor\" data-dojo-type=\"dijit.form.TextBox\" style=\"width:225px;\" data-dojo-props=\"disabled:true\"></div>\n\t\t<div style=\"margin-top:10px\"><span class=\"propertyTitle\">Start:</span></div>\n\t\t<div>\n\t\t\t<div data-dojo-attach-point=\"itemStartDateEditor\" data-dojo-type=\"dijit.form.DateTextBox\" style=\"width:120px;\"  data-dojo-props=\"disabled:true\"></div>\n\t\t\t<div data-dojo-attach-point=\"itemStartTimeEditor\" data-dojo-type=\"dijit.form.TimeTextBox\" style=\"width:100px;\" data-dojo-props=\"disabled:true\" ></div>\n\t\t</div>\n\t\t<div style=\"margin-top:10px\"><span class=\"propertyTitle\">End:</span></div>\n\t\t<div>\n\t\t\t<div data-dojo-attach-point=\"itemEndDateEditor\" data-dojo-type=\"dijit.form.DateTextBox\" style=\"width:120px;\" data-dojo-props=\"disabled:true\" ></div>\n\t\t\t<div data-dojo-attach-point=\"itemEndTimeEditor\" data-dojo-type=\"dijit.form.TimeTextBox\" style=\"width:100px;\" data-dojo-props=\"disabled:true\" ></div>\n\t\t</div>\n\t\t<div style=\"margin-top:10px\"><span class=\"propertyTitle\">Calendar:</span></div>\n\t\t<select data-dojo-attach-point=\"calendarEditor\" data-dojo-type=\"dijit.form.ComboBox\"  style=\"width:225px;\" data-dojo-props=\"disabled:true\" >\n\t\t\t<option>Calendar 1</option>\n\t\t\t<option>Calendar 2</option>\t\t\t\t\t\t\t\t\t\n\t\t</select>\n\t\t<div style=\"margin-top:10px\">\n\t\t\t<input type=\"checkbox\" data-dojo-attach-point=\"allDayCB\" data-dojo-type=\"dijit.form.CheckBox\" checked=\"false\" data-dojo-props=\"disabled:true\" />\n\t\t\t<label for=\"allDayCB\">All day</label>\n\t\t</div>\t\n\t\t<div style=\"margin-top:10px; text-align:right\">\n\t\t\t<span style=\"text-align:left\">\n\t\t\t\t<button data-dojo-attach-point=\"deleteItemButton\" class=\"deleteButton\" data-dojo-type=\"dijit.form.Button\"  data-dojo-props=\"disabled:true\">Delete</button>\n\t\t\t</span>\n\t\t\t<span style=\"text-align:right\">\n\t\t\t\t<button data-dojo-attach-point=\"updateItemButton\" data-dojo-type=\"dijit.form.Button\" data-dojo-props=\"disabled:true\" >Update</button>\n\t\t\t</span>\n\t\t</div>\n\t</div>\n</div>\n\t\t    \n"}});define("demos/calendar/MainProperties",["dojo/_base/declare","dojo/_base/lang","dojo/_base/array","dijit/_WidgetBase","dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin","dojo/text!./templates/MainProperties.html","demos/calendar/DatePicker","dijit/TitlePane","dijit/form/CheckBox","dijit/form/TextBox","dijit/form/DateTextBox","dijit/form/TimeTextBox","dijit/form/Button","dijit/form/ComboBox"],function(_1,_2,_3,_4,_5,_6,_7){return _1("demo.MainProperties",[_4,_5,_6],{templateString:_7,postCreate:function(){this.inherited(arguments);var _8=this;var _9=function(_a){var _b=_a?_8.itemStartDateEditor:_8.itemEndDateEditor;var _c=_a?_8.itemStartTimeEditor:_8.itemEndTimeEditor;var _d=_b.get("value");var _e=_c.get("value");_d.setHours(_e.getHours());_d.setMinutes(_e.getMinutes());return _d;};this.updateItemButton.on("click",function(_f){if(_8.editedItem!=null){_8.editedItem.summary=_8.itemSummaryEditor.get("value");if(_8.allDayCB.get("value")){if(!_8.calendar.isStartOfDay(_8.editedItem.startTime)){_8.editedItem.startTime=_8.calendar.floorToDay(_8.itemStartDateEditor.get("value"),true);}if(!_8.calendar.isStartOfDay(_8.editedItem.endTime)){_8.editedItem.endTime=_8.calendar.floorToDay(_8.itemEndDateEditor.get("value"),true);}_8.editedItem.allDay=true;}else{_8.editedItem.startTime=_9(true);_8.editedItem.endTime=_9(false);delete _8.editedItem.allDay;}var _10=_8.calendarEditor.get("value");_8.editedItem.calendar=_10=="Calendar 1"?"cal1":"cal2";_8.calendar.store.put(_8.editedItem);}});this.deleteItemButton.on("click",function(_11){if(_8.editedItem!=null){_8.calendar.store.remove(_8.editedItem.id);}});this.datePicker.on("change",function(e){var d=_8.datePicker.get("value");_8.calendar.set("date",d);});this.calendar1CB.on("change",function(v){_8.calendarVisibility[0]=v;_8.calendar.currentView.invalidateLayout();});this.calendar2CB.on("change",function(v){_8.calendarVisibility[1]=v;_8.calendar.currentView.invalidateLayout();});this.allDayCB.on("change",function(_12){_8.itemStartTimeEditor.set("disabled",_12);_8.itemEndTimeEditor.set("disabled",_12);var d;if(_12){d=_8.itemStartTimeEditor.get("value");calendar.floorToDay(d,true);_8.itemStartTimeEditor.set("value",d);d=_8.itemEndTimeEditor.get("value");calendar.floorToDay(d,true);_8.itemEndTimeEditor.set("value",d);if(!calendar.isStartOfDay(_8.editedItem.endTime)){d=_8.itemEndDateEditor.get("value");calendar.floorToDay(d,true);d=calendar.dateModule.add(d,"day",1);_8.itemEndDateEditor.set("value",d);}}else{_8.editedItem.startTime.setHours(8);_8.editedItem.endTime.setHours(9);_8.itemStartTimeEditor.set("value",_8.editedItem.startTime);_8.itemEndTimeEditor.set("value",_8.editedItem.endTime);d=_8.itemEndDateEditor.get("value");calendar.floorToDay(d,true);d=_8.calendar.dateModule.add(d,"day",-1);_8.itemEndDateEditor.set("value",d);}});},calendar:null,_setCalendarAttr:function(_13){this._set("calendar",_13);this.configureCalendar(_13);},selectionChanged:function(_14){var _15=_14==null;var _16=[this.itemSummaryEditor,this.itemStartDateEditor,this.itemStartTimeEditor,this.itemEndDateEditor,this.itemEndTimeEditor,this.calendarEditor,this.allDayCB,this.deleteItemButton,this.updateItemButton];_3.forEach(_16,function(w){w.set("disabled",_15);w.set("value",null,false);});this.editedItem=_15?null:_2.mixin({},_14);if(!_15){var _17=_14.allDay===true;this.itemStartTimeEditor.set("disabled",_17);this.itemEndTimeEditor.set("disabled",_17);this.itemSummaryEditor.set("value",_14.summary);this.itemStartDateEditor.set("value",_14.startTime);this.itemStartTimeEditor.set("value",_14.startTime);this.itemEndDateEditor.set("value",_14.endTime);this.itemEndTimeEditor.set("value",_14.endTime);this.calendarEditor.set("value",_14.calendar=="cal1"?"Calendar 1":"Calendar 2");this.allDayCB.set("checked",_17,false);}},configureCalendar:function(_18){var _19=this;this.datePicker.set("value",_18.get("date"));_18.on("change",function(e){_19.selectionChanged(e.newValue);});_18.on("itemEditEnd",function(e){_19.selectionChanged(e.item);});var _1a=function(_1b,_1c){_19.datePicker.set("currentFocus",_1b,false);_19.datePicker.set("minDate",_1b);_19.datePicker.set("maxDate",_1c);_19.datePicker._populateGrid();};_18.on("timeIntervalChange",function(e){_1a(e.startTime,e.endTime);});this.calendarVisibility=[true,true];var _1d=function(_1e){if(_1e.cssClass=="Calendar1"&&_19.calendarVisibility[0]||_1e.cssClass=="Calendar2"&&_19.calendarVisibility[1]){return this._defaultItemToRendererKindFunc(_1e);}return null;};_18.columnView.set("itemToRendererKindFunc",_1d);_18.columnView.secondarySheet.set("itemToRendererKindFunc",_1d);_18.matrixView.set("itemToRendererKindFunc",_1d);}});});