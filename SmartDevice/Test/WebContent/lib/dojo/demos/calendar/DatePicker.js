//>>built
define("demos/calendar/DatePicker",["dojo/_base/declare","dojo/_base/lang","dijit/Calendar"],function(_1,_2,_3){return _1("demo.DatePicker",_3,{minDate:null,maxDate:null,getClassForDate:function(_4,_5){if(this.minDate&&this.maxDate){var _6=this.dateModule;if(_6.compare(_4,this.minDate)>=0&&_6.compare(_4,this.maxDate)<=0){return "Highlighted";}}return null;}});});