define([
	"dojo/_base/declare",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dijit/_Contained",
	"dijit/_WidgetBase",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/CarouselItem",
	"dojox/form/Rating",
	"dojo/on",
	"dijit/form/Button",
], function(declare, domConstruct, domGeometry, domStyle, Contained, WidgetBase, has, BidiCarouselItem, Rating, on, Button){

	// module:
	//		dojox/mobile/CarouselItem

	var CarouselItem = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiCarouselItem" : "dojox.mobile.CarouselItem", [WidgetBase, Contained], {
		// summary:
		//		An item of dojox/mobile/Carousel.
		// description:
		//		CarouselItem represents an item of dojox/mobile/Carousel. In
		//		typical use cases, users do not use this widget alone. Instead,
		//		it is used in conjunction with the Carousel widget.

		// alt: String
		//		An alt text for the carousel item image.
		alt: "",

		// src: String
		//		A path for an image to be displayed as a carousel item.
		src: "",

		// headerText: String
		//		A text that is displayed above the carousel item image.
		headerText: "",

		// footerText: String
		//		A text that is displayed below the carousel item image.
		footerText: "",

		/* internal properties */	
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblCarouselItem",

		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.tabIndex = "0";
		    //console.log(this.domNode.className);

			this.bigImageNode = domConstruct.create("div", { className: "mblCarouselItemImage big", onClick:"smallimage()"}, this.domNode);
			
			this.headerTextNode = domConstruct.create("div", { className: "mblCarouselItemHeaderText" }, this.domNode);
			
		   
			
			this.wrapperNode = domConstruct.create("div", { className: "CarouselWrapper" }, this.domNode);
			//this.imageNode = domConstruct.create("img", { className: "mblCarouselItemImage", onClick:"bigimage()"}, this.wrapperNode);
			this.imageNode = domConstruct.create("div", { className: "thumbDiv", onClick:"bigimage()"}, this.wrapperNode);
			
			this.metaNode = domConstruct.create("div", { className: "CarouselMeta"}, this.wrapperNode);
			//this.imageNode = domConstruct.create("div", { innerHTML:'Haha' }, this.domNode);
			domStyle.set(this.imageNode, "max-width", 100+"%");
			
			domStyle.set(this.imageNode, "box-shadow","none");
			
			
			
		//	domStyle.set(this.imageNode, "width", 90+"%");
			this.footerTextNode = domConstruct.create("div", { className: "mblCarouselItemFooterText" }, this.domNode);

			
			
				
							
		},

		startup: function(){
			if(this._started){ return; }
			this.inherited(arguments);
			this.resize();
		},

		resize: function(size){
			var box = domGeometry.getMarginBox(this.domNode);
			if(box.h === 0){ return; }
			var h1 = domGeometry.getMarginBox(this.headerTextNode).h;
			var h2 = domGeometry.getMarginBox(this.footerTextNode).h;
			domGeometry.setMarginBox(this.imageNode, {h:box.h - h1 - h2});
		},

		select: function(){
			// summary:
			//		Highlights the item.
			var img = this.imageNode
			domStyle.set(img, "opacity", 0.4);
			this.defer(function(){
				domStyle.set(img, "opacity", 1);
			}, 1000);
		},

		_setAltAttr: function(/*String*/alt){
			// tags:
			//		private
			this._set("alt", alt);
			this.imageNode.alt = alt;
			//his.bigImageNode.src = imageMap[alt]['url'];
		    
			
			
					   
                var artist = "";
                var title = "";
                var imagesize = "";
				var genre ="";
				var ratingvalue= 0;
				var viewlists = "";
				var vlname="";
				var vlnumber="";
				

			//	alert(window.currViewList.length);

 
				
				if 	(imageMap[alt]["Artist First N"])
					artist = imageMap[alt]["Artist First N"] + " " + imageMap[alt]["Artist Last N"];
				else
					artist = imageMap[alt]["Artist Last N"] 
                title = "<b>" + imageMap[alt]["Title"].replace("'", "", "") + "</b>" ;
				if (imageMap[alt]["Year"])
					title = title  + " " + imageMap[alt]["Year"];
                // check if there is a video
			//	alert("video="+imageMap[alt]["Video"]);
				if (imageMap[alt]["Video"])			
			           title = title +"  "+ "<a style=\"color:#568BFF\" onclick='showiframe(\"" + imageMap[alt]["Video"] + "\")' >" + "<img src='images/Play_Icon2.png' align='center' >" + "</a>";

				if(imageMap[alt]["Type  Detail"])
					type=imageMap[alt]["Type  Detail"];
				else
					type=imageMap[alt]["Type"]
                if (imageMap[alt]["Width cm"] > 0)
                    imagesize = type + " " + imageMap[alt]["Width cm"] + "x" + imageMap[alt]["Height cm"] + "cm";
                else
                if (imageMap[alt]["Width Px"] > 0)
                    imagesize = type + " " + imageMap[alt]["Width Px"] + "x" + imageMap[alt]["Height Px"] + "px";

                
                dojo.create("label", {className:"metaText", innerHTML:"<br>"+title+"<br>"}, this.metaNode);
                dojo.create("label", {className:"metaText", innerHTML:artist+"<br>"}, this.metaNode);
                dojo.create("label", {className:"metaText", innerHTML:imagesize+"<br>"}, this.metaNode);
                dojo.create("label", {className:"metaText", innerHTML:imageMap[alt]["Location"]+"<br>"}, this.metaNode);
                
                
				if (imageMap[alt]["Genre"])
				{
					genre = imageMap[alt]["Genre"];
				}
				dojo.create("label", {className:"metaText", innerHTML:genre+"<br>"}, this.metaNode);
				
				
				
			var	userrating = new Rating({
							numStars:5});	
							
			if (imageMap[alt]["User Rating"]!=undefined) {
					ratingvalue=imageMap[alt]["User Rating"];
			}
						            						
			else
			   ratingvalue=0;
			   
			userrating.set("value",ratingvalue);
			this.metaNode.appendChild(userrating.domNode);
			
			
		 on(userrating, "click",
			function(){
			//alert("change ratings"+userrating.value);
			//  LEON here is where you need to store value of user's rating for the image in the database!
		//	   alert(imageMap[window.currImage]["User Rating"]);
			   imageMap[window.currImage]["User Rating"]=userrating.value;
			   //console.log("image "+alt);
			   dojo.io.script.get({
                   url: base + "client/rateImage?imageId=" + window.currImage + "&email=" + window.email + "&rating=" + userrating.value+"&token="+window.token,
                   callbackParamName: "callback",
                   load: function (result) {
                   }
               });
			
			});
			
			
			
			    var vcount=0;
				for (var i in imageMap[alt]["viewlists2"]){
				      if(i == 0){
				      	dojo.create("label", {className:"metaText", innerHTML:'<br>Also in:<br>'}, this.metaNode);
				      }
				   //   alert ("view=" + imageMap[currImage]["viewlists2"][i][0]+imageMap[currImage]["viewlists2"][i][1]);
					  vlnumber=imageMap[alt]["viewlists2"][i][0];
					  vlname=imageMap[alt]["viewlists2"][i][1];
					  if (vlname!=window.currViewList && vlname != "All"){
					  // create button for each viewlist
					  vcount += 1;
				  //   alert("create new button" + vlname + "number" +vlnumber);
					  var myButton = new Button({
					  num: vlnumber,
                      label: vlname, 
					  onClick: function(){
					             swapview(this.num);
					  }					  
					  });
					  myButton.startup();
					  myButton.placeAt(this.metaNode);
				
				
				//	   alert("mybutton" + myButton.onClick + "vlnumber="+vlnumber);
                     
									  
					//     viewlists = viewlists + vlname +"-"+"<img src='images/switch1.png' align='top' onclick=swapview(" + vlnumber + ")><br>";
				   //   alert ("viewlists="+viewlists);
					  }
				}
				
				dojo.create("label", {className:"metaText", innerHTML:"<br><br><br><br><br><br><br><br><br>"}, this.metaNode);
			//	alert("done creating buttons vcount="+ vcount);


				//if (vcount>0)
				//      dojo.byId("viewtableline6a").innerHTML="Also in:"
			    //else
			    //	dojo.byId("viewtableline6a").innerHTML=""			
			
			
			
			
		},

		_setSrcAttr: function(/*String*/src){
			// tags:
			//		private
			this._set("src", src);
			//this.imageNode.src = src;	
			//this.bigImageNode.src = src;
			//alert("url("+src+")");
			//console.log("url(\""+src+"\")");
			domStyle.set(this.imageNode, "background-image", "url(\""+src+"\")" );
            domStyle.set(this.bigImageNode, "background-image", "url(\""+src+"\")");
			//alert(this.bigImageNode.src);

			
		},

		_setHeaderTextAttr: function(/*String*/text){
			this._set("headerText", text);
		    this.headerTextNode.innerHTML = text;
			//this.metaNode.innerHTML = text;
		},

		_setFooterTextAttr: function(/*String*/text){
			// tags:
			//		private
			this._set("footerText", text);
			this.footerTextNode.innerHTML = this._cv ? this._cv(text) : text;
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile.CarouselItem", [CarouselItem, BidiCarouselItem]) : CarouselItem;
});
