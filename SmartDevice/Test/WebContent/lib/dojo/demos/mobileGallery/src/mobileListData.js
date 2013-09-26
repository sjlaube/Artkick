//>>built
define("demos/mobileGallery/src/mobileListData",["dojo/_base/lang","dojo/_base/connect","dojo/dom","dojo/dom-class","dijit/registry","dojo/data/ItemFileWriteStore","dojox/mobile/iconUtils","dojox/mobile/RoundRectDataList"],function(_1,_2,_3,_4,_5,_6,_7,_8){_1.getObject("demos.mobile.src.mobileLists",true);demos.mobile.src.mobileLists=function(){var _9={items:[{label:"Apple"},{label:"Banana"},{label:"Cherry"},{label:"Grape"},{label:"Kiwi"}]};var _a=new _6({url:"data/dataList.json",clearOnClose:true});var _b=new _6({data:_1.clone(_9)});return {store1:_a,store2:_b,newItems:[[],[]],listsStore:_a,updateItemCount:function(){this.listsStore.fetch({query:{},onBegin:function(_c){_3.byId("listLengthLabel").innerHTML=_c;},start:0,count:0});},switchTo:function(_d){this.listsStore=(_d===1?_a:_b);_5.byId("mobileListsDataList").setStore(this.listsStore);var _e=_3.byId("mobileListSet1Btn");var _f=_3.byId("mobileListSet2Btn");if(_d===1){_4.add(_e,"mobileListSelected");_4.add(_f,"mobileListUnselected");_4.remove(_e,"mobileListUnselected");_4.remove(_f,"mobileListSelected");}else{_4.add(_e,"mobileListUnselected");_4.add(_f,"mobileListSelected");_4.remove(_e,"mobileListSelected");_4.remove(_f,"mobileListUnselected");}this.updateItemCount();},add1:function(){var _10=this.listsStore.newItem({label:"New Item"});this.newItems[(this.listsStore==this.store1)?1:0].push(_10);this.updateItemCount();},delete1:function(){var _11=this.newItems[(this.listsStore==this.store1)?1:0].pop();if(_11){this.listsStore.deleteItem(_11);}this.updateItemCount();}};}();return {init:function(){var _12=_5.byId("mobileLists");var _13=false;_2.connect(_12,"onAfterTransitionIn",_12,function(){if(!_13){this.resize();_13=true;}});_7.createDomButton(_3.byId("mobileListAddBtn"));_7.createDomButton(_3.byId("mobileListDelBtn"));}};});