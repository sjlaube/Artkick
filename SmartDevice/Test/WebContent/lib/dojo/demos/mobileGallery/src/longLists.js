//>>built
define("demos/mobileGallery/src/longLists",["dojo/ready","dijit/registry","dojo/dom","dojo/_base/connect","dojox/mobile/ListItem","dojox/mobile/parser","dojox/mobile","dojox/mobile/ScrollableView","dojox/mobile/TabBar","dojox/mobile/TabBarButton","dojox/mobile/RoundRectList","dojox/mobile/LongListMixin"],function(_1,_2,_3,_4,_5){fillList=function(_6){for(var i=0;i<2000;i++){_6.addChild(new _5({variableHeight:true,style:"font-size:10px",innerHTML:i+". <a href=\"#\" class=\"lnk\">Book Title "+i+"</a><br>"+"Author "+i+"<br>"+"Eligible for FREE Super Saver Shipping<br>"+"<span style=\"color:red\">$14.50 (50%)</span> In Stock<br>"+"# ("+i+")"}));}};return {init:function(){fillList(longList);_4.connect(longList,"_addAfter",function(){_3.byId("itemCount").innerHTML="Displayed items: "+longList.domNode.childNodes[1].childElementCount+" out of 2000";});}};});