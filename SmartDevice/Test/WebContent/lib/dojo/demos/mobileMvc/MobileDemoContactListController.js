//>>built
define("demos/mobileMvc/MobileDemoContactListController",["dojo/_base/declare","dijit/registry","dojox/mvc/getStateful","dojox/mvc/ListController","dojox/mvc/StoreRefController"],function(_1,_2,_3,_4,_5){return _1([_4,_5],{summaryScrollableViewId:"",detailScrollableViewId:"",initialFocusElementId:"",setDetailsContext:function(_6){this.set("cursorId",_6);_2.byId(this.initialFocusElementId).focus();},addEmpty:function(){var _7=_3({uniqueId:""+Math.random(),First:"",Last:"",Location:"CA",Office:"",Email:"",Tel:"",Fax:""});this[this._refInModelProp].push(_7);this.set("cursor",_7);_2.byId(this.summaryScrollableViewId).performTransition(this.detailScrollableViewId,1,"none");_2.byId(this.initialFocusElementId).focus();},remove:function(_8){for(var _9=this[this._refInModelProp],i=0;i<_9.length;i++){if(_9[i][this.idProperty]==_8){_9.splice(i,1);if(i<this[this._refInModelProp].get("length")){this.set("cursorIndex",i);}return;}}}});});