//>>built
define("dojox/mobile/bidi/_PickerBase",["dojo/_base/declare","dojo/dom-construct"],function(b,c){return b(null,{buildRendering:function(){this.inherited(arguments);if(!this.isLeftToRight())for(var a=this.domNode.children.length;0<a;a--)c.place(this.domNode.children[0],this.domNode.children[a-1],"after")}})});
//@ sourceMappingURL=_PickerBase.js.map