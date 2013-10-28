/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/

/*
 * This file is provided for custom JavaScript logic that your HTML files might need.
 * Maqetta includes this JavaScript file by default within HTML pages authored in Maqetta.
 */
/*
 * This file is provided for custom JavaScript logic that your HTML files might need.
 * Maqetta includes this JavaScript file by default within HTML pages authored in
 * Maqetta.
 */
define.amd.jQuery = true;
 
require(["jquery",
        "dojo/ready",
        "dojo/dom",
        "dojo/dom-style",
		"dojo/dom-class",
		"dojo/dom-construct",
		"dojo/domReady",
        "dijit/registry",
		"dijit/form/Button",
        "dojo/on",
		"dojo/mouse",
		"dojo/hash",
		"dojox/mobile",
		"dojox/mobile/bookmarkable",
		"dojox/mobile/IconMenu",
        "dojo/date/stamp",
        "dojo/data/ItemFileWriteStore",
        "dojo/_base/connect",
        "dijit/form/Select",
		"dojox/form/Rating",
		"dojox/form/PasswordValidator",
        "dojo/dom-attr",
		"dojox/mobile/Carousel",
		"dojox/mobile/LongListMixin",
		"dojox/mobile/ScrollableView"			
    ],
    function ( 
        $,
        ready,
        dom,
        domStyle,
		domClass,
		domConstruct,
		domReady,
        registry,
		Button,
        on,
		mouse,
		hash,
		mobile,
		bookmarkable,
		IconMenu,
        stamp,
        ItemFileWriteStore,
        connect,
        select,
		Rating,
		PasswordValidator,
        domAttr,
		Carousel,
		LongListMixin,
		ScrollableView) {



        ready(
		
	
		function () {

            window.base = "http://ancient-caverns-7624.herokuapp.com/api/v1.1/";  //Staging Server
            //window.base = "http://evening-garden-3648.herokuapp.com/api/v1.1/";  // Production Server
			//window.base = "http://hidden-taiga-7701.herokuapp.com/api/v1.1/";
            var selectListView = registry.byId("PlaylistView");
			var selectArtistListView = registry.byId("ArtistlistView");
			var selectMuseumListView = registry.byId("MuseumlistView");

            var playerList = registry.byId("playerList");
            var imagesList = registry.byId("ImageList");

            var catList = registry.byId("catList");
            var ownedPlayerList = registry.byId("ownedPlayerList");
            var removePlayerList = registry.byId("removePlayerList");
            var selectPlayerView = registry.byId("select_player");
            var selectCatView = registry.byId("select_category");
            var imageView = registry.byId("ImageView");
			var optionsView = registry.byId("OptionsList");
			var aboutView = registry.byId("About");
			var pictureGrid = registry.byId("Picturegrid");
			var gridView = registry.byId("GridView");
			var MylistView = registry.byId("MylistView");
		
            var regPlayerView = registry.byId("registernewchromecast");	

            var regRokuView = registry.byId("registernewroku");
			var accountsettings = registry.byId("AccountSettings");
			var logoff = registry.byId("LogOff");
			var regnewplayer = registry.byId("RegisterNew");
            var addUserView = registry.byId("add_user_player");
            var removePlayerView = registry.byId("removeplayer");
			var tvplayeroptions = registry.byId("Options");
            var fillsw = dijit.registry.byId("fillswitch");
		//	var LoadImages = document.getElementById("LoadImages");
		    window.MyViewlist = registry.byId("MyViewLists");
			window.btn1 = registry.byId("btn1");
				button2 = registry.byId("btn1");
		    window.listList = registry.byId("listList");
			window.artistList = registry.byId("ArtistList");
			window.museumList = registry.byId("MuseumList");
			window.checkforparameters = true;
			window.currentView = "Intro0";
			window.currentView = "Intro0";
			
			window.autoIntro = true;
			window.delItem = "";
			var handler;
			var bigload;
			var updatelistcount=0;
			var	userrating = new Rating({
							numStars:5});	
            window.boucingTime = 3000;
            window.firstdisplay = true;
            window.foundIndex = true;

            window.selectedPlayers = {};
            window.justLogin = true;
			window.justRefresh = false;
            window.imageMap = {};
            window.email = null;
			window.username = null;
            window.fill = false;
            window.ownedPlayers = {};
            window.removePlayers = {};
            window.playerSet = {};
            window.currList = null;
            window.currImage = null;
            window.currCat = null;
            window.currViewList = null;
            window.owndedPlayers = {};
            window.removePlayers = {};
            window.menushow = false;
            window.justCreatePlayer = false;
			window.iframe = {};
			window.url=null;
			window.shuffle= false;
			window.loadartistview = false;
			window.loadmuseumview = false;
			window.loadcatview = false;
			window.api_key = "6ab1450c247164d8448624c47e894a6874c43a46";
         
           window.switchView = false;
		
		   window.sliderIndex = 0;
		   window.gridset = false;
		   window.currGridList = -1;
		   window.transitiontype="slide";
		

            function getCookie(c_name) {
                var c_value = document.cookie;
                var c_start = c_value.indexOf(" " + c_name + "=");
                if (c_start == -1) {
                    c_start = c_value.indexOf(c_name + "=");
                }
                if (c_start == -1) {
                    c_value = null;
                } else {
                    c_start = c_value.indexOf("=", c_start) + 1;
                    var c_end = c_value.indexOf(";", c_start);
                    if (c_end == -1) {
                        c_end = c_value.length;
                    }
                    c_value = unescape(c_value.substring(c_start, c_end));
                }
                return c_value;
            }




            function setCookie(c_name, value, exdays) {
                var exdate = new Date();
                exdate.setDate(exdate.getDate() + exdays);
                var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
                document.cookie = c_name + "=" + c_value;
            }


            function checkCookie() {
                var email = getCookie("email");
                var token = getCookie("token");
                  //   alert("checkCookie " + email);
                var I0 = registry.byId("Intro0");
                 //     alert ("Io= " + I0 + I0.selected);
                var Iv = registry.byId("ImageView");
                var splash = dojo.byId("splash");
				var menx = registry.byId("Sharemenu2")
				var opt = registry.byId("OptionsList");
				

             //  alert("Imageview= "+ Iv + I0 +splash+menx+registry.byId("OptionsList")+registry.byId("AccountSettings")+registry.byId("iframeview")
			  // +registry.byId("Intro3")+registry.byId("Intro2")+registry.byId("Intro1")+registry.byId("blankview")+registry.byId("ImageView")
			 //  );
              //    I0.startup();
               //   alert ( "intro0 startup"); 
               I0.show();
                Iv.startup();
               //  alert ("try spash= " + splash+"Iv="+Iv);

               //    splash.style.display = "none";
				  // 		splash.style.visibility = "hidden";
             //    alert ("did splash");

                //     alert ("imageview startup");

            //    alert("email1="+email);
                if (email != null && email != "" && email != "null"&&token!= null && token != "" && token != "null") {
           //        alert ("good to go");


                    //     alert("Welcome again " + email);
                    dojo.io.script.get({
                        url: base + "client/verifyUser?email="+email+"&token="+token,
                        callbackParamName: "callback",
                        load: function (result) {
				//		alert("Status="+result["Status"]);
                            if (result["Status"] == "success") {
							//  splash.style.display = "none";
                  //        alert("we are here");
                                //        var currView = dijit.registry.byId("Intro0");
                                //        var mycurrView = currView.getShowingView();
                                window.email = email;
                                window.token = token;
                                Iv.selected = true;
						//		alert("before iv show");
								window.firstdisplay = false;
                               
								splash.style.display = "none";splash.style.visibility = "hidden";
                               Iv.show();
                               

                               window.afterLogin();
							//	alert("showing imageview"+Iv);
                                     //  I0.performTransition("ImageView", 1, "slide", null);
									//   alert("transition done");

                                //             var currView = registry.byId("Intro0");
                                //        window.email = email;
                                //         currView.performTransition("ImageView", 1, "slide", null);

                            } else {splash.style.display = "none";}
                        }

                    });

                } else 
				{
			//	alert("email="+email);
			//	splash.style.display = "none";
			//	alert("none");
				splash.style.visibility = "hidden";
			//	alert("hidden");
				I0.show();
			//	alert("I0 show");
				}
            }
            
            window.gotoView = function(fromView,toView){
            	//alert(fromView+' to '+toView);
				window.currentView=toView;
            	dojo.style(dojo.byId(fromView),"display", "none");
            	dojo.style(dojo.byId(toView), "display", "block");
            }
            
            window.getDefaults = function(){
            	dojo.io.script.get({
                     url: base + "client/getDefault",
                     callbackParamName: "callback",
                     load: function (result) {
                     	if(result["Status"]=="success"){
                     		window.defImage = result["defaults"]["image"];
                     		window.defList = result["defaults"]["viewlist"];
                     		window.defCat = result["defaults"]["category"];
                     	}

                     }
               });
            	
            }

           

            window.syncImage = function() {
            	var url = base+"client/update2?imageID="+window.currImage+"&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat+"&token="+window.token;
                for (var player in window.playerSet) {
                	if (window.playerSet[player]) {
                		url += "&players[]="+ player.substring(1);
                    }
                }
                //alert(url);
                dojo.io.script.get({
                	url: url,
                	callbackParamName: "callback",
                	load: function (result) {
                		
                	}
                });
            	
            	
            	
            	/*
                for (var player in window.playerSet) {
                    if (window.playerSet[player]) {
                        //alert(base + "update.json?snumber=" + player.substring(1) + "&imageID=" + window.currImage +"&stretch="+window.fill+"&email="+window.email+"&list="
                        //   +window.currList+"&image="+window.currImage);
                        dojo.io.script.get({
                            url: base + "update.json?snumber=" + player.substring(1) + "&imageID=" + window.currImage + "&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat,
                            callbackParamName: "callback",
                            load: function (result) {
                                //alert(base + "update.json?snumber=" + player.substring(1) + "&imageID=" + view.getChildren()[0]['alt']+"&stretch="+window.fill);

                            }
                        });

                    }
                }
 */
            }



            function loadImages(targImage,forward,numOfImg,include) {



                if (window.currList == null) {
                    window.currList = window.defList;
                }
              //  alert(base + "getViewlist3?id=" + window.currList+"&email="+window.email+"&tarImage="+targImage+"&forward="+forward+"&numOfImg="+numOfImg+"&include=1");
             //   alert("updating"+currList);
			//   alert("switchview="+window.switchView);
                var url = base + "client/getViewlist4?id=" + window.currList+"&email="+window.email+"&tarImage="+targImage+"&forward="+forward+"&numOfImg="+numOfImg+"&include=1"+"&token="+window.token;
                if(window.shuffle){
                	url += "&shuffle=1";
                }else{
                	url += "&shuffle=0";
                }
                dojo.io.script.get({
                    url: url,
                    callbackParamName: "callback",
                    load: function (viewlist) {
                        
                        if(viewlist["imageSet"].length==0){
                        	alert("'My Starred Images' is empty, please star-rate some images and they will be added to it!");
                        	window.currList = window.defList;
                        	window.currCat = window.defCat;
                        	window.currImage = window.defImage;
						   	updateImages(-1);
                        	return;
                        }
                        
                        window.imageMap = {};
                        // get viewlist name
                        window.currViewList = viewlist["name"];
                    //    alert("currImage "+window.currImage);
                    //   alert("tarImage "+window.tarImage);
                    //    alert("category " +viewlist["name"]);
                        if (window.currImage == window.tarImage) {
                            window.foundIndex = true;
                        }
                        
                        


                        for (var i in viewlist["imageSet"]) {

                            imageMap[viewlist["imageSet"][i]["id"]] = viewlist["imageSet"][i];
                            //alert(viewlist["imageSet"][i]["User Rating"]);
                            //      alert(viewlist["imageSet"][i]["Title"].replace(":","\:"));
                            image = {
                                "alt": viewlist["imageSet"][i]["id"],
                                "src": viewlist["imageSet"][i]["thumbnail"]
                                //  "footerText": viewlist["imageSet"][i]["Artist"],
                                //  "headerText": viewlist["imageSet"][i]["Title"].replace("'", "", "")
                            };
                            window.imageCurrStore.newItem(image);

                            
                            if (i == viewlist["imageSet"].length - 1) {
                            	window.currStartImg = viewlist["imageSet"][0]["id"];
                                window.absStartImg = viewlist["images"][0];
                            	window.currEndImg = viewlist["imageSet"][i]["id"];
                            	window.absEndImg = viewlist["images"][viewlist["images"].length - 1];
                            	
                            	window.listSize = viewlist["images"].length;
                            	
                            	if (forward==0){ // go backward
                            		
                            		//alert(include==0);
                            		//alert(viewlist["images"].length>1);
                            		if(include==0&&viewlist["imageSet"].length>1){
                            			window.currImage = viewlist["imageSet"][i-1]["id"];
                            			window.sliderIndex = i-1;
                            			window.currAbsIndex = viewlist["tarIndex"]-1;
										window.prevImg = viewlist["imageSet"][1]["id"];
                            		}
                            		else{
                            			window.currImage = viewlist["imageSet"][i]["id"];
                            			window.sliderIndex = i;
                            			window.currAbsIndex = viewlist["tarIndex"];
										window.prevImg = viewlist["imageSet"][0]["id"];
                            			
                            		}
                            		

                                	
                                }
                                
                                
                                else{
                                	if(include==0&&viewlist["imageSet"].length>1){
                            			window.currImage = viewlist["imageSet"][1]["id"];
                            			window.sliderIndex = 1;
                            		    window.prevImg = viewlist["imageSet"][1]["id"];
                            		    window.currAbsIndex = viewlist["tarIndex"]+1;
                            		}

                                    
                            		
                            		else{

                            			 if(viewlist["backward"]=="1"){
                            			 	   window.currImage = viewlist["imageSet"][1]["id"];
                            			       window.sliderIndex = 1;
                            			       window.prevImg = viewlist["imageSet"][1]["id"];
                            			       window.currAbsIndex = viewlist["tarIndex"];
                            			 }else{
                            			 	   window.currImage = viewlist["imageSet"][0]["id"];
                            			       window.sliderIndex = 0;
                            			       window.prevImg = viewlist["imageSet"][0]["id"];
                            			       window.currAbsIndex = viewlist["tarIndex"];
                            			       
                            			 }
                            		}
                                	
                                }
                                //update index
                               // alert(window.currAbsIndex+"/"+window.listSize);
                            	
                                imagesList.setStore(null);
                                imagesList.setStore(window.imageCurrStore);
                                // uncover the carousel!!!
                                //alert(imagesList);
                                //         alert("store set");
							//	LoadImages.style.visibility = "hidden";	
                            }
                        }
                        //alert(window.currImage);
                        //alert(window.tarImage);
                         syncImage();
                        if ((!window.foundIndex) && (window.currImage != window.tarImage)) {
					                            imagesList.currentView.goTo(1);
                        }
					
                        //
                        loadmetadata();
   			//		    dijit.registry.byId("ImageView").show();
                        if(window.switchView){
                        	window.switchView = false;
							setTimeout(function(){
                            var currView = dijit.registry.byId("blankview");
							     var currView2 = currView.getShowingView();
							// alert("loadimages: view2="+currView2+"view="+currView);
		                   //currView2.performTransition("ImageView", 1, "fade", null);
		                    gotoView('blankview','ImageView');
		                    //window.sliderIndex = 0;
		                    hidemenu();
		                    dijit.registry.byId("tabnowshowing").set('selected', true);
                           },50);
						   if(window.firstdisplay)
						   {
						   setTimeout(function(){dijit.registry.byId('Swipehint').show()},200);
				           setTimeout(function(){dijit.registry.byId('Swipehint').hide()},4000);
						   window.firstdisplay=false;
						   }
                        }
                    }
                });

            }



           window.updateImages = function(targImage) {

                //window.imageMap = {};
                var imageData = {
                    "items": []
                };
                window.imageCurrStore = new ItemFileWriteStore({
                    data: imageData
                });
               //alert("update images");
                if (window.justLogin || window.justRefresh) {
				   //  alert("justlogin");
					 window.justRefresh = false;
                    dojo.io.script.get({
                        url: base + "client/getUserStatus?email=" + window.email+"&token="+window.token,
                        callbackParamName: "callback",
                        load: function (result) {
						console.log("status:"+result["Status"]);
                            if (result["Status"] == "success") {
                                window.tarImage = result["curr_image"];
                                //alert("tar"+window.tarImage);
                                window.currList = result["curr_list"];
                                window.currCat = result["curr_cat"];

                                window.fill = (result["fill"] == "true");
                                window.shuffle = (result["shuffle"]=="true");
                                console.log("currList:"+window.currList+" currCat:"+window.currCat+" tarImage:"+window.tarImage);
                                if(window.shuffle){
                                	dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
                                }
                                 else{
                                	dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');
                                }
                                //alert(window.fill);
                                var switchValue = "off";
                                if (window.fill) {
                                    switchValue = "on";
                                }
                                //dijit.byId("fillswitch").set("value", switchValue);               			
                                dijit.byId("fillswitch").set("checked", window.fill);
                                if(window.fill) {
                                	fillsw.set('label', "Active");
                                }
                                else{
                                	fillsw.set('label', "Not Active");
                                }
                                
                                $("option#" + result["autoInterval"]).attr('selected', 'selected');
								// check if we were passed paramaters on invoking and go to that image instead
								var curl=get('currList');
								var curi=get('currImage');
								var curc=get('currCat');
							
						//		alert("start, check currList="+curl+"image"+curi+"cat:"+curc);
								if (curl&&curi&&curc&&window.checkforparameters)
								{
							//	alert ('overriding to new image');
				
								window.tarImage = curi;
                                window.currList = curl;
                                window.currCat = curc;
								window.checkforparameters = false;
								
								// try to save the view list
							    dojo.io.script.get({
                                         url: base + "user/saveAsMyViewlist?email=" + window.email+"&token="+window.token+"&listId="+curl, 
                                         callbackParamName: "callback",
                                         load: function (result) {
		                                     console.log(result['Message']);
								         }
								});
								
								
								
								
		
								}
                            } else {
                                window.tarImage = window.defImage;
                                window.currList = window.defList;
                                //alert(window.defList);
                                window.currCat = window.defCat;
                            }
                            loadImages(window.tarImage,1,15,1);
                            //alert(window.currCat);
                           // updateLists(window.currCat);
                        }
                    });
                } else {
				//alert('load images target:'+targImage);
                    loadImages(targImage,1,15,1);
                }
				

            }

            function updateRemovePlayers() {
                window.removePlayers = {};
                var playerData = {
                    "items": []
                };
                var playerStore = new ItemFileWriteStore({
                    data: playerData
                });

                removePlayerList.setStore(null);
                removePlayerList.setStore(playerStore);
                //alert(base + "getPlayers?email="+window.email);
                dojo.io.script.get({
                    url: base + "player/getPlayers?email=" + window.email+"&token="+window.token,
                    callbackParamName: "callback",
                    load: function (result) {
                        var players = result["players"];
                        for (var i in players) {
                            playerStore.newItem({
                                "label": players[i]["nickname"],
                                "paccount": players[i]["account"],
                                "onClick": function () {
                                    removePlayerClick(this.paccount)
                                }
                            });
                            window.removePlayers[players[i]["account"]] = false;
                        }
                    }

                });

            }

            function removePlayerClick(paccount) {
                if (window.removePlayers[paccount]) {
                    window.removePlayers[paccount] = false;
                } else {
                    window.removePlayers[paccount] = true;
                }

            }

            function ownedPlayerClick(paccount) {
                if (window.ownedPlayers[paccount]) {
                    window.ownedPlayers[paccount] = false;
                } else {
                    window.ownedPlayers[paccount] = true;
                }
            }

            function updateOwnedPlayers() {
                window.ownedPlayers = {};
                var playerData = {
                    "items": []
                };
                var playerStore = new ItemFileWriteStore({
                    data: playerData
                });
                ownedPlayerList.setStore(null);
                ownedPlayerList.setStore(playerStore);
                dojo.io.script.get({
                    url: base + "player/getOwnedPlayers?email=" + window.email+"&token="+window.token,
                    callbackParamName: "callback",
                    load: function (result) {
                        //alert( result["players"].length);
                        var players = result["players"];
                        for (var i in players) {
                            playerStore.newItem({
                                "label": players[i]["nickname"],
                                "paccount": players[i]["account"],
                                "onClick": function () {
                                    ownedPlayerClick(this.paccount)
                                }
                            });
                            window.ownedPlayers[players[i]["account"]] = false;
                        }
                    }
                });
            }

         

           window.goToViewlists = function(){
                	window.foundIndex = true;
                	window.justLogin = false;
					window.currentView ="PlaylistView";
				    if (window.currCat.length < 30)
                         dijit.registry.byId("PlaylistHeader").set("label", "<small>" +   window.currCat + "</small>");
                    else
                         dijit.registry.byId("PlaylistHeader").set("label", "<small>" + window.currCat.substring(0, 27) + "..." + "</small>");
                //    dijit.registry.byId("PlaylistHeader").set("label", "Category:" + currCat);
                    hidemenu();
                    //alert("Transition in!");
                    if (window.currCat == null) {
                        window.currCat = window.defCat;
                        
                    }
                    
                updateLists(window.currCat);

          
				//  reset the scrollable view to the top
				var c = dijit.byId("PlaylistView").containerNode;
			

                dojo.setStyle(c, {
                 webkitTransform: '',
                  top: 10,
                  left: 0
                    });
                //mycurrView.performTransition("PlaylistView", 1, "", null);
				
				
				//alert("going to listview");
		/*		if (currCat=="Artist")
					gotoView("blankview","ArtistlistView");
				else if (currCat == "Museums")
					gotoView("blankview","MuseumlistView");
				else
					gotoView("select_category","PlaylistView");*/

           }

            function updateCats() {
				window.currentView="select_category";
                 if (window.loadcatview)
				 {
					catList.startup();
				//	gotoView("select_category","MuseumlistView");
					return; // already did this
				  }
				window.loadcatview = true;
				window.currentView="select_category";
                catList.destroyRecursive(true);
                $("#catList").html('');
				// create a My Viewlists category manually
				 newCat = new dojox.mobile.ListItem({
                                id: "My Viewlists",

                                label: "My Viewlists",

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
								clickable: true,
                                onClick: function () {
                                    //alert(this.id);
                                    window.currCat = this.id;

                                    
                                    goToViewlists();
                                    //updateLists(window.currCat);
                                },
                                moveTo: "#"
								//transition: "fade"
                                //rightText:
                            });
                            //alert("new");
                            catList.addChild(newCat);
                dojo.io.script.get({
                    url: base + "content/allCategories2?featured=true",
                    callbackParamName: "callback",
                    load: function (result) {
                        var cats = result["categories"];
                        for (var i in cats) {
                            newCat = new dojox.mobile.ListItem({
                                id: cats[i]["name"],

                                label: cats[i]["name"] + "<br><i><small>" + cats[i]["viewlistNum"] + " viewlists</small></i></br>",

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
								clickable: true,
                                onClick: function () {
                                    //alert(this.id);
                                    window.currCat = this.id;

                                    
                                    goToViewlists();
                                    //updateLists(window.currCat);
                                },
                                moveTo: "#"
								//transition: "fade"
                                //rightText:
                            });
                            //alert("new");
                            catList.addChild(newCat);

                            //var li = "<li data-dojo-type=\"dojox/mobile/ListItem\" moveTo=\"ImageView\" rightIcon=\"mblDomButtonArrow\" variableHeight=\"true\"> <label class=\"mblListItemLabel\">World's 10 Most Popular Paintings<br><i><small> 10 images</small></i></br></label></li>"
                            //console.log(li);
                            //$("#catList").append(li);

                        }

                    }

                });
            }


            function updateLists(catName) {
		
		        if (catName == "Artists")
				{
					updateArtistLists();
					return;
				}
				if (catName == "Museums")
				{
					updateMuseumLists();
					return;
				}
                if (catName == "My Viewlists")
				{
				     url=base+"user/getMyViewlists?email="+ window.email+"&token="+window.token;
				}
				else
				{
					url=base + "content/getViewlistsByCategory2?catName=" + catName+"&featured=true";
				}
				
			//	alert("catname="+catName);
				listList.destroyRecursive(true);
                $("#listList").html('');
			    window.MyViewlist.destroyDescendants();
                dojo.io.script.get({
                    url: url,
                    callbackParamName: "callback",
                    load: function (result) {
                        var lists = result["viewlists"]; 
						//  put user's tops lists first in the list
						if(catName == "My Viewlists"){
                       	    //alert("Top Lists");
                       	    
                            myTopList = new dojox.mobile.ListItem({
                                id: "top_"+window.email,

                                label:  "My Starred Images",

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
                                clickable: true,
                                onClick: function () {
                                    //alert(this.id);
                                    window.currList = this.id;
                                     window.switchView = true;
                                    var currView = dijit.registry.byId("ImageView");
	                                var currView2 = currView.getShowingView();
                                    //currView2.performTransition("blankview", 1, "slide", null);
                                    gotoView('PlaylistView','blankview');
                                    updateImages(-1);
                                },
                                moveTo: "",
								transition: "fade"
                            });
                           listList.addChild(myTopList);    
                        
                       }  
					 //  alert("load up the lists count:"+lists.length);
                        for (var i in lists) {
						//alert(lists[i]["coverImage"]);
						  var listcoverimage="images/ARTKICKlogoFULLCOLOR-APP_50x50.png";
						if (lists[i]["coverImage"])
							listcoverimage=lists[i]["coverImage"];
						else
							listcoverimage="";
						    
						  var linelabel= '<img class="viewlistid" src="'+listcoverimage+'" alt="" height="60px" > ';
					//	  alert(linelabel);
					if (lists[i]["imageNum"])
					{
						  linelabel=linelabel+lists[i]["name"] + "<br><i><small>" + lists[i]["imageNum"] + " pictures</small></i></br>";
					}
					else
					{
					       linelabel=linelabel+lists[i]["name"];
					}
				//		alert("label:"+linelabel+"lists:"+lists[i]["id"]);

						   var newList = new dojox.mobile.ListItem({
                                id: lists[i]["id"],

                                label: linelabel ,

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
								clickable: true,
                                onClick: function () {
                                   // alert(this.id);
									var currView = dijit.registry.byId("ImageView");
	                                var currView2 = currView.getShowingView();
								//	alert("currView2="+currView2);
                                    //currView2.performTransition("blankview", 1, "", null);
                                    gotoView('PlaylistView','blankview');
                                    window.currList = this.id;

                                    window.switchView = true;
                                    updateImages(-1);

                                },
                                moveTo: "",
								transition: "fade"
                            });
					//		alert("newList="+newList);
                            listList.addChild(newList);

                        }
                        
                        
                       
                    }
                    

                });
				gotoView("select_category","PlaylistView");
            }

    function updateArtistLists() {

                 if (window.loadartistview)
				 {
				 	artistList.startup();
				 	gotoView("select_category","ArtistlistView");
					artistList.startup();
					return; // already did this
				}	
				window.loadartistview = true;
				url=base + "content/getViewlistsByCategory2?catName=Artists&featured=true";
			//	alert("updateArtlistLists");
				loadlists(url,artistList);

				
            }
	function updateMuseumLists() {
			
                 if (window.loadmuseumview)
				 {
					museumList.startup();
					gotoView("select_category","MuseumlistView");
					return; // already did this
				  }
				window.loadmuseumview = true;
				url=base + "content/getViewlistsByCategory2?catName=Museums&featured=true";
		//	alert("updateMuseumLists");
				loadlists(url,museumList);

				
            }
	function loadlists(url,listname){
					bigload=true;
					gotoView("select_category","blankview");
	                dojo.io.script.get({
                    url: url,
                    callbackParamName: "callback",
                    load: function (result) {
                        var lists = result["viewlists"]; 
								 
					//   alert("load up the lists count:"+lists.length+"listname="+listname);
                        for (var i in lists) {
						//alert(lists[i]["coverImage"]);
						  var listcoverimage="images/ARTKICKlogoFULLCOLOR-APP_50x50.png";
						if (lists[i]["coverImage"])
							listcoverimage=lists[i]["coverImage"];
						else
							listcoverimage="";
						  var firstName = lists[i]["name"].split(' ').slice(0, -1).join(' ');
						  var lastName = lists[i]["name"].split(' ').slice(-1).join(' ');
						  var linelabel= '<img class="viewlistid" src="'+listcoverimage+'" alt="" height="60px" > ';
						  var imagecount = "??"
						  if (lists[i]["imageNum"])
							imagecount = lists[i]["imageNum"];
						var nowview = 'ArtistlistView';
						var linename=lists[i]["name"];
						if (listname == museumList)
							nowview = 'MuseumlistView';
						if (listname == artistList)
						{
						      linename = "<i><small>"+firstName+" </small></i><big>"+lastName+"</big>";
						}
							//	alert(nowview);
					//	  alert(linelabel);
						  linelabel=linelabel+linename + "<br><i><small>" + imagecount + " pictures</small></i></br>";
						//alert("label:"+linelabel+"lists:"+lists[i]["id"]);
							
						   var newList = new dojox.mobile.ListItem({
                                id2: lists[i]["id"],
								
                                label: linelabel ,

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
								clickable: true,
                                onClick: function () {
                                  
									gotoView(nowview,'blankview');
                                    window.currList = this.id2;

                                    window.switchView = true;
                                    updateImages(-1);

                                },
                                moveTo: "",
								transition: "fade"
                            });
						//	alert("label:"+lists[i]["name"] );
                            listname.addChild(newList);

                        }
                        console.log("done loading artists last label:"+lists[i]["name"]);
						if (currCat=="Artists")
							gotoView("blankview","ArtistlistView");
						else if (currCat == "Museums")
							gotoView("blankview","MuseumlistView");
						bigload=false;
                        
                       
                    }
                    

                });
			}
            function rememberSelectPlayers() {
                //alert("remembering");
                var url = base + "client/selectPlayers?email=" + window.email+"&token="+window.token;
                var count = 0;
                for (var player in window.playerSet) {
                    //alert(playerSet[player]);
                    if (window.playerSet[player]) {
                        url += "&players[]=" + player.substring(1);
                        count++;
                       // alert(url);
                    }

                }
                
                if(count==0){
                	url+="&players[]=";
                }
                
                //alert(url);
                dojo.io.script.get({
                    url: url,
                    callbackParamName: "callback",
                    load: function (result) {}
                });
            }


            function playerClick(id) {
                if (window.playerSet[id]) {
                    window.playerSet[id] = false;
                } else {
                    window.playerSet[id] = true;
                }

            }
            function loadmetadata()
            {
               var metaPlane1 = dojo.byId("MediumDateSize");
               var metaPlane2 = dojo.byId("ArtLocation");
               var metaPlane3 = dojo.byId("viewtableline1");// title
               var metaPlane4 = dojo.byId("viewtableline2");// artist
               var metaPlane5 = dojo.byId("viewtableline3");// imagesize
               var metaPlane6 = dojo.byId("viewtableline4");// location
               var metaPlane7 = dojo.byId("viewtableline5");// genre
               var metaPlane8 = dojo.byId("viewtableline6");// user rating
			   var metaPlane9 = dojo.byId("viewtableline7");// other viewlists
			   var metaPlane10 = dojo.byId("viewtableline8");
                var artist = "";
                var title = "";
                var imagesize = "";
				var genre ="";
				var ratingvalue= 0;
				var viewlists = "";
				var vlname="";
				var vlnumber="";
				

			//	alert(window.currViewList.length);

                if (window.currViewList.length < 33)
                    dijit.registry.byId("ImageViewHeader").set("label",  window.currViewList + "<br> "+ window.currAbsIndex +"/" + window.listSize);
                else
                    dijit.registry.byId("ImageViewHeader").set("label",  window.currViewList.substring(0, 30) + "...<br>" + window.currAbsIndex +"/" + window.listSize);
				if 	(imageMap[currImage]["Artist First N"])
					artist = imageMap[currImage]["Artist First N"] + " " + imageMap[currImage]["Artist Last N"];
				else
					artist = imageMap[currImage]["Artist Last N"] 
                title = "<b>" + imageMap[currImage]["Title"].replace("'", "", "") + "</b>" ;
				if (imageMap[currImage]["Year"])
					title = title  + " " + imageMap[currImage]["Year"];
                // check if there is a video
			//	alert("video="+imageMap[currImage]["Video"]);
				if (imageMap[currImage]["Video"])			
			           title = title +"  "+ "<a style=\"color:#568BFF\" onclick='showiframe(\"" + imageMap[currImage]["Video"] + "\")' >" + "<img src='images/Play_Icon2.png' align='center' >" + "</a>";

				if(imageMap[currImage]["Type  Detail"])
					type=imageMap[currImage]["Type  Detail"];
				else
					type=imageMap[currImage]["Type"]
                if (imageMap[currImage]["Width cm"] > 0)
                    imagesize = type + " " + imageMap[currImage]["Width cm"] + "x" + imageMap[currImage]["Height cm"] + "cm";
                else
                if (imageMap[currImage]["Width Px"] > 0)
                    imagesize = type + " " + imageMap[currImage]["Width Px"] + "x" + imageMap[currImage]["Height Px"] + "px";

                metaPlane3.innerHTML = title;
                metaPlane4.innerHTML = artist;
                metaPlane5.innerHTML = imagesize;
                metaPlane6.innerHTML = imageMap[currImage]["Location"];
				if (imageMap[currImage]["Genre"])
				{
					genre = imageMap[currImage]["Genre"];
				}
				metaPlane7.innerHTML = genre;
				metaPlane8.innerHTML = "";
				if (imageMap[currImage]["User Rating"]!=undefined) {
					ratingvalue=imageMap[currImage]["User Rating"];
				}
						            						
				else
							ratingvalue=0;
				userrating.set("value",ratingvalue);
				metaPlane8.appendChild(userrating.domNode);
				//alert("user rating2=" + userrating.value);
				// get the other viewlists
				dojo.empty(metaPlane10);
			
			//	metaPlane10.destroyDescendants();
			//	alert("window currViewlist"+window.currList);
			    var vcount=0;
				for (var i in imageMap[currImage]["viewlists2"]){
				
				   //   alert ("view=" + imageMap[currImage]["viewlists2"][i][0]+imageMap[currImage]["viewlists2"][i][1]);
					  vlnumber=imageMap[currImage]["viewlists2"][i][0];
					  vlname=imageMap[currImage]["viewlists2"][i][1];
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
					  myButton.placeAt(metaPlane10);
				
				
				//	   alert("mybutton" + myButton.onClick + "vlnumber="+vlnumber);
                     
									  
					//     viewlists = viewlists + vlname +"-"+"<img src='images/switch1.png' align='top' onclick=swapview(" + vlnumber + ")><br>";
				   //   alert ("viewlists="+viewlists);
					  }
				}
			//	alert("done creating buttons vcount="+ vcount);


				if (vcount>0)
				      dojo.byId("viewtableline6a").innerHTML="Also in:"
			    else
					dojo.byId("viewtableline6a").innerHTML=""
				
				
				
				
				
				
                if (imageMap[currImage]["More Info Link"]) {
                    if (imageMap[currImage]["More Info Link"].substring(0, 4) == "http")
                        metaPlane3.innerHTML = "<a   style=\"color:#568BFF\" onclick='showiframe(\"" + imageMap[currImage]["More Info Link"] + "\")' >"+ title+"</a>";
                    else
                        metaPlane3.innerHTML = "<a   style=\"color:#568BFF\" onclick='showiframe(\"" + "http://" + imageMap[currImage]["More Info Link"] + "\")' >" + title+ "</a>";
                } 
				if (imageMap[currImage]["Artist Info"]) {
                    if (imageMap[currImage]["Artist Info"].substring(0, 4) == "http")
                        metaPlane4.innerHTML = "<a   style=\"color:#568BFF\" onclick='showiframe(\"" + imageMap[currImage]["Artist Info"] + "\")' >"+ artist+"</a>";
                    else
                        metaPlane4.innerHTML = "<a   style=\"color:#568BFF\" onclick='showiframe(\"" + "http://" + imageMap[currImage]["Artist Info"] + "\")' >" + artist+ "</a>";
                }
				if (imageMap[currImage]["Genre Link"]) {
                    if (imageMap[currImage]["Genre Link"].substring(0, 4) == "http")
                        metaPlane7.innerHTML = "<a   style=\"color:#568BFF\" onclick='showiframe(\"" + imageMap[currImage]["Genre Link"] + "\")' >"+ genre+"</a>";
                    else
                        metaPlane7.innerHTML = "<a   style=\"color:#568BFF\" onclick='showiframe(\"" + "http://" + imageMap[currImage]["Genre Link"] + "\")' >" + genre+ "</a>";
                }
            }
		

            function updatePlayers(selectedPlayers) {
                //alert("players");


                dojo.io.script.get({
                    url: base + "player/getPlayers?email=" + window.email+"&token="+window.token,
                    callbackParamName: "callback",
                    load: function (result) {

                        var curr = new Date().getTime();
                        var newPlayerSet = {};

                        if (window.justLogin) {
                            //alert("justLogin,updatePlayers");
                            //playerList.destroyRecursive(true);
                            //$("#ownedPlayerList").html('');
                            playerList.destroyDescendants();

					
                            for (var i in result["players"]) {
                                var player = result["players"][i];

                                //alert(curr-player["last_visit"]);

                                if (curr - player["last_visit"] < 7000) {
                                    var status = "images/greenbutton.png";
								
                                } else {
                                    var status = "images/graybutton.png";
                                }

                          //     	alert ("player:"+ player["nickname"] + status+ "time=" + curr);

                                var li = registry.byId("s" + player["account"]);


                                if (player["account"] in selectedPlayers) {
                                    //alert(player["account"]+"in");
                                    var checked = true;
                                    window.playerSet["s" + player["account"]] = true;
                                } else {
                                    //alert(player["account"]+"out");
                                    var checked = false;
                                    window.playerSet["s" + player["account"]] = false;
                                }

                                li = new dojox.mobile.ListItem({
                                    id: "s" + player["account"],
                                    icon: status,
                                    label: player["nickname"],
                                    onClick: function () {
                                        playerClick(this.id);
                                    },
                                    checked: checked

                                });
                                playerList.addChild(li);

                            }
                            window.justLogin = false;
                            //syncImage();
                            return;

                        }

            
							  
							  
					    for (var i in result["players"]) {
                            var player = result["players"][i];

                            //alert(curr-player["last_visit"]);

                            if (curr - player["last_visit"] < 5000) {
                                var status = "images/greenbutton.png";
                            } else {
                                var status = "images/graybutton.png";

                            }

                            newPlayerSet["s" + player["account"]] = 1;
                            var li = registry.byId("s" + player["account"]);
                            //alert(player["account"]);
                            if (li == undefined) {
                                //alert("new"+player["account"]);
                                window.justCreatePlayer = true;
                                li = new dojox.mobile.ListItem({
                                    id: "s" + player["account"],
                                    icon: status,
                                    label: player["nickname"],
                                    onClick: function () {
                                        playerClick(this.id);
                                    },
                                    checked: true

                                });
                                playerList.addChild(li);
                                window.playerSet["s" + player["account"]] = true;

                            } else {
                                li.set("icon", status);
                            }

                        }



                        //clear up deleted ones
                        for (var playerId in window.playerSet) {
                            if (!(playerId in newPlayerSet)) {
                                //alert(playerId+"is gone!");

                                registry.remove(playerId);
                                $("#" + playerId).remove();
                                delete window.playerSet[playerId]

                            }
                        }
                        
      						//check if we are in select player view and tell users if there are no players
                
							  var currView = dijit.registry.byId("select_player");
	                          var currView2 = currView.getShowingView();
							  if (currView2 == selectPlayerView)
									{
									 if(result["players"].length == 0)
									 {
										alert("There are no players registered.");
							            currView2.performTransition("OptionsList", -1, "", null);
							            removePlayerView.hide();
							            //gotoView("select_player","OptionsList");
									  }
									
									}                 
                        
                        
                        

                        if (window.justCreatePlayer) {
							if(!window.autoIntro) {
                            	//alert("auto disabled!");
                            	return;
                            }
                            //alert("justPlayer");
                            rememberSelectPlayers();
                            window.currList = window.defList;
                            window.currImage = window.defImage;
                            window.currCat = window.defCat;
                            if(window.shuffle){
                            	// if random, then switch to normal!
                            	mediashuffle();
                            }
                            window.justCreatePlayer = false;

                            window.switchView = true;
                            var currView = dijit.registry.byId("Intro0");
                            var mycurrView = currView.getShowingView();
							window.currentView = "blankview";
                            optionsView.hide();
                            mycurrView.performTransition("blankview", 1, "", null);
                            updateImages(-1);
                            
                        }
                    }
                });

            }
			window.BrowserDetect.init();
		//	alert("OS="+window.BrowserDetect.OS+" browser="+window.BrowserDetect.browser+" version="+window.BrowserDetect.version);
	//		if ((window.BrowserDetect.OS=="Linux" && window.BrowserDetect.browser!= "Chrome") ||
	//		(window.BrowserDetect.OS=="Windows" && window.BrowserDetect.browser!= "Chrome"))
	//		{
	//		alert("You must run Artkick under Chrome, please restart using the Chrome browser");
	//		window.close();
	//		}
			//window.tellbrowser.init();
		    var curl=get('currList');
			var curi=get('currImage');
			var curc=get('currCat');
			var curonce=get('once');
			//		alert("start, check currList="+curl+"image"+curi+"cat:"+curc);
			if (curl&&curi&&curc&&!curonce)
			{
				//	
									
				var url="artkick://?currList="+curl+"&currImage="+curi+"&currCat="+curc+"&once="+"true";
				//	alert("url:"+url);
				openCustomURLinIFrame(url);		
			}
            hidemenu();


            getDefaults();
            checkCookie();
			BrowserDetect.init();
			dojo.byId("baseurlname").innerHTML="DB:"+window.base.substring(7,23);
			console.log("database:"+window.base);
		//	alert("browser="+window.BrowserDetect.browser+" OS="+window.BrowserDetect.OS+regPlayerView+selectPlayerView+imageView+selectCatView+selectListView+optionsView+addUserView+removePlayerView+gridView);

	on(regRokuView, "beforeTransitionIn",
           function(){
		      window.currentView ="registernewroku";
           	  window.updatePlayerLoop = setInterval(updatePlayers,1500); 
           });
    on(regnewplayer, "beforeTransitionIn",
           function(){
		      window.currentView ="RegisterNew";
           	 
           });
 	on(tvplayeroptions, "beforeTransitionIn",
           function(){
		      window.currentView ="Options";
           });          
    on(regRokuView, "beforeTransitionOut",
		   function(){
		       clearInterval(updatePlayerLoop);
               rememberSelectPlayers();
		   });
    
    
    
			
	on(regPlayerView, "beforeTransitionIn", 
			 function(){
				window.currentView ="registernewchromecast";
			 	window.updatePlayerLoop = setInterval(updatePlayers,1500);
				calliOSFunction("sayHello", ["On",window.email], "onSuccess", "onError");
				try{
                	Android.setEmail(window.email);
                	Android.setButtonVisible();
                	
                }
                catch(err){
                	
                }
			});
			
	on(regPlayerView, "beforeTransitionOut",
		      function(){
		      	clearInterval(updatePlayerLoop);
                rememberSelectPlayers();
				calliOSFunction("sayHello", ["Off",window.email], "onSuccess", "onError");
				try{
					Android.setEmail(window.email);
                	Android.setButtonInvisible();
                }
                catch(err){
                	
                }
			});
			
			
        //   document.addEventListner("backbutton", function(){ alert ("back pushed");});
            // select player transition
     on(selectPlayerView, "beforeTransitionIn",

                function () {
				window.currentView ="select_player";
                    //alert("Transition in!");
                    updatePlayers(window.selectedPlayers);

                });



     on(selectPlayerView, "beforeTransitionOut",
                function () {
                    rememberSelectPlayers()
                });
       
      window.afterLogin = function(){
      	        dojo.style(dojo.byId("OptionsList"),"display", "none");
                gotoView("Login","blankview");
                window.switchView = true;
                updateImages(window.tarImage);
      	        imageView.hide();
                dojo.io.script.get({
                            url: base + "client/getSelectedPlayers?email=" + window.email+"&token="+window.token,
                            callbackParamName: "callback",
                            load: function (result) {
                                if (result["Status"] == "success") {
                                    var selectedPlayers = {};
                                    for (var i in result["selectedPlayers"]) {
                                        selectedPlayers[result["selectedPlayers"][i]] = 1;
                                        //alert(result["selectedPlayers"][i]);
                                    }

                                    updatePlayers(selectedPlayers);

                                }
                            }
                });
      }

                 
            on(imageView, "beforeTransitionIn", 
                 function(){
				 window.currentView = "ImageView";
                 	dijit.registry.byId("tabnowshowing").set('selected', true);
					hidemenu();

					
                 	
                 });
            
            on(selectCatView, "beforeTransitionIn",

                function () {
					window.currentView = "select_category";
                    //alert("Transition in!");
					dijit.registry.byId("tabcategory3").set('selected', true);
                    window.foundIndex = true;
                	window.justLogin = false;
                    hidemenu();
                    updateCats();

                }); 


            on(selectListView, "beforeTransitionIn",

                function () {
				window.currentView = "PlaylistView";
				dijit.registry.byId("tabcategory2").set('selected', true);
				});
			 on(selectArtistListView, "beforeTransitionIn",

                function () {
				window.currentView = "ArtistlistView";
				dijit.registry.byId("tabcategory5").set('selected', true);
				});
			on(selectMuseumListView, "beforeTransitionIn",

                function () {
				window.currentView = "MuseumlistView";
				dijit.registry.byId("tabcategory6").set('selected', true);
				});
			on(accountsettings, "beforeTransitionIn",
                function () {
				window.currentView = "AccountSettings";
				});
			on(aboutView, "beforeTransitionIn",
                function () {
				window.currentView = "About";
				});
			on(logoff, "beforeTransitionIn",
                function () {
				window.currentView = "LogOff";
				});
				
             on(optionsView, "beforeTransitionIn",

                function () {
				window.currentView = "OptionsList";
				dijit.registry.byId("taboptions4").set('selected', true);
				});	
  /*              	window.foundIndex = true;
                	window.justLogin = false;
                	
				    if (window.currCat.length < 30)
                         dijit.registry.byId("PlaylistHeader").set("label", "<small>" +   window.currCat + "</small>");
                    else
                         dijit.registry.byId("PlaylistHeader").set("label", "<small>" + window.currCat.substring(0, 27) + "..." + "</small>");
                //    dijit.registry.byId("PlaylistHeader").set("label", "Category:" + currCat);
                    hidemenu();
                    //alert("Transition in!");
                    if (window.currCat == null) {
                        window.currCat = "Top Lists";
                        updateLists(window.currCat);
                    }


                });F
*/

            on(addUserView, "beforeTransitionIn",
                function () {
				window.currentView = "add_user_player";
				dojo.byId("addPlayerEmail").value = "";
                    //alert ("adduser transitionin");
                    updateOwnedPlayers();
                });

            on(removePlayerView, "beforeTransitionIn",
                function () {
				window.currentView = "removeplayer";
				
                    updateRemovePlayers();
                }
            ); 
			
			
            on(MylistView, "beforeTransitionIn",
                function () {
				window.currentView = "MylistView";
			//	alert("showmyviewlists called");
                    showmyviewlists();
                }
            ); 
            on(gridView, "beforeTransitionIn",
                function () 
				{ 
				   window.currentView = "GridView";
				   window.gridPages = Math.ceil(window.listSize/20);
                //   alert ("picturegrid, currlist="+window.currList+" number images="+window.listSize+" pages="+gridPages);
				       hidebutton("GridView",false);
				   if (window.currList == window.currGridList)
				   {// already generated grid, so just return
				   //alert("same list returning...");
					return;
				   }
				   else
				    window.currGridList=window.currList;
					window.targImageGrid=-1;
					loadGrid(0); //first call load up the first page of grid
				})
				
				
			window.hidebutton = function (node,hideMe){
					domStyle.set(dijit.registry.byId(node).domNode, {
							visibility: (hideMe ? 'hidden' : 'visible'),
							display: (hideMe ? 'none' : 'block')
						});
			}
			
			
			
			window.loadGrid = function(page)	{		
			 var gridprevious = dijit.registry.byId("GridPrevious");
			  var gridnext = dijit.registry.byId("GridNext");
				forward=1;
				include=1;
			//	alert("page="+page+" current grid page="+window.currGridPage);
				if (page==0)
				{
					window.targImageGrid=-1;
					include=1;
					forward=1;
					window.currGridPage=1;
				    hidebutton("GridPrevious",true);
				    if(window.gridPages>1)
					{
						hidebutton("GridNext",false);
					}
					else
					{
					    hidebutton("GridNext", true);
					}
				}
				else if (page==1)
				{
				// get next set of 24 thumbnails
					include=0;
					forward=1;
				    window.targImageGrid=window.lastGridImage;
					window.currGridPage = window.currGridPage +1;
					hidebutton("GridPrevious", false);
					if (window.currGridPage == window.gridPages)  // last page
						hidebutton("GridNext", true);
				}
				else if (page == -1)
				{
				// get previous set
					include=0;
					forward=0;
				    window.targImageGrid=window.firstGridImage;
					window.currGridPage = window.currGridPage-1;
					hidebutton("GridNext", false);
				//	alert("now="+window.currGridPage);
					if (window.currGridPage ==1)
					   hidebutton("GridPrevious", true);
				}
                var url = base + "client/getViewlist4?id=" + window.currList+"&email="+window.email+"&tarImage="+window.targImageGrid+"&forward="+forward+"&numOfImg=20"+"&include="+include+"&token="+window.token;
                if(window.shuffle){
                	url += "&shuffle=1";
                }else{
                	url += "&shuffle=0";
                }
				var imageData = {
                    "items": []
                };
				//alert("page="+page);
                window.imageCurrStore = new ItemFileWriteStore({
                    data: imageData
                });
				   if (window.currViewList.length < 33)
                    dijit.registry.byId("GridViewHeader").set("label",  window.currViewList+"<br>Page "+window.currGridPage+"/"+window.gridPages);
                else
                    dijit.registry.byId("GridViewHeader").set("label",  window.currViewList.substring(0, 30)+"<br>Page "+window.currGridPage+"/"+window.gridPages);
				//check number of pages if only 1 turn off the forward back buttons, otherwise check for first/last and show as appropriate
				
				dijit.registry.byId("gridshowing").set('selected', true);
			//	alert("avail heigth="+window.innerHeight+"width="+window.innerWidth);

               	dojo.empty(Picturegrid);
				var dim=77; //iphone standard
				dim=Math.sqrt((window.innerHeight-60)*(window.innerWidth-40)/20*.8)
			//	dim=Math.min(Math.floor((window.innerHeight-40)/5)-5,Math.floor(window.innerWidth/4)-4);
			 //   console.log ("dim="+dim);
                dojo.io.script.get({
                    url: url,
                    callbackParamName: "callback",
                    load: function (viewlist) {
					for (var i in viewlist["imageSet"]) 
					{
                       //  alert("id="+viewlist["imageSet"][i]["id"]);
                            var pic = dojo.create("img", {
                                id: viewlist["imageSet"][i]["id"],
                                src: viewlist["imageSet"][i]["thumbnail"],
								onclick: function(){
								        window.tarImage = this.id;
										window.currImage = null;
										window.gridset=true;
										 window.switchView=true;
										 updateImages(this.id);	 
										// 	setTimeout(function(){updateImages(this.id)},10);


										//dijit.registry.byId("GridView").performTransition("blankview", 1, "fade", null);
										gotoView('GridView','blankview');
									   // loadImages(this.id,1,15,1);
									  
					            
					            },	
								width:dim+"px",
								height: dim+"px",
								hspace:"1px"
                              
                            },"Picturegrid");
                         
                    }
					window.firstGridImage=viewlist["imageSet"][0]["id"];
					window.lastGridImage=viewlist["imageSet"][19]["id"];
					//alert("first="+window.firstGridImage+" last="+window.lastGridImage);
					}

					
				}
				)
				}; 
           
           on(userrating, "click",
			function(){
			//alert("change ratings"+userrating.value);
			//  LEON here is where you need to store value of user's rating for the image in the database!
		//	   alert(imageMap[window.currImage]["User Rating"]);
			   imageMap[window.currImage]["User Rating"]=userrating.value;
			   dojo.io.script.get({
                   url: base + "client/rateImage?imageId=" + window.currImage + "&email=" + window.email + "&rating=" + userrating.value+"&token="+window.token,
                   callbackParamName: "callback",
                   load: function (result) {
                   }
               });
			
			});
     	

				
				
	        window.doPrev = function(imgId) {

				//alert("currView id "+imgId);
			//	alert("Prev img "+window.prevImg);

				if((window.prevImg!=undefined)&&(window.prevImg!=imgId)){
					//normal slide backward
					window.currAbsIndex--;
					
				}
				
				else if(imgId == window.currStartImg&&imgId!=window.absStartImg){
					//slide backward at head
					//prev chunk!
					
			        var imageData = {
                       "items": []
                    };
  				//	LoadImages.style.visibility = "visible";	                  
                    window.imageCurrStore = new ItemFileWriteStore({
                       data: imageData
                    });
                    window.switchView = true;
                    gotoView("ImageView","blankview");
                    loadImages(window.currStartImg,0,15,0);
					
				}
				
				else if (imgId == window.currEndImg&&imgId!=window.absEndImg){
					//slide forward at tail
					//next chunk!
					
					var imageData = {
                       "items": []
                    };
                //    LoadImages.style.visibility = "visible";
                    window.imageCurrStore = new ItemFileWriteStore({
                       data: imageData
                    });
                    //window.sliderIndex = 0;
                    window.switchView = true;
                    gotoView("ImageView","blankview");
                    loadImages(window.currEndImg,1,15,0);
					
					
				}
				
				window.prevImg = imgId;
				
				
			}
			
			
				
			window.doNext = function(imgId) {

				
				
		      	
             //  alert("next action detected!");
         /*      window.swipedImages++;
               if(Object.keys(window.imageMap).length-1==window.swipedImages){
               	 alert("wait!");
               	 window.sliderIndex = window.swipedImages;
               	 loadImages(window.currImage);
               	 //window.imageMap = {};
               }
               */
 			  //updateIndex
 			  window.prevImg = imgId;
			  window.currAbsIndex++;             
         //     alert(window.currAbsIndex+"/"+window.listSize);
            }
            connect.subscribe("/dojox/mobile/deleteListItem", function(item){
				showDeleteButton(item);
			});	
function showDeleteButton(item){
		
				hideDeleteButton();
				window.delItem = item;
				item.rightIconNode.style.display = "none";
				if(!item.rightIcon2Node){
					item.set("rightIcon2", "mblDomButtonMyRedButton_0");
					item.rightIcon2Node.tabIndex = "0";
					item.rightIcon2Node.firstChild.innerHTML = "Delete";
					connect.connect(item.rightIcon2Node, "onkeydown", onDelete);
				}
				item.rightIcon2Node.style.display = "";
				handler = connect.connect(window.MyViewlist.domNode, "onclick", onClick);
			}

function hideDeleteButton(){
				if(window.delItem){
					window.delItem.rightIconNode.style.display = "";
					window.delItem.rightIcon2Node.style.display = "none";
					window.delItem = null;
				}
				connect.disconnect(handler);
			}

function onClick(e){
				var item = registry.getEnclosingWidget(e.target);
			//	alert("deleting item2:"+item+"id:"+item.id+"name:"+item.label);
				var url=base + "user/removeMyViewlist?"  + "email=" + window.email+"&token=9999&listId="+item.id+"&token="+window.token;
				
				    dojo.io.script.get({
					url: url,
					callbackParamName: "callback",
					load: function (result) {
					if (result["Status"] == "success") {
						usermessage("Viewlist " + item.label + " deleted!");
                  

					} else {
						alert(result["Message"]);
						return;
					}

					}
					});
				/* do call here to delete item*/
				if(domClass.contains(e.target, "mblDomButtonMyRedButton_0")){
					setTimeout(function(){
						item.destroy();
					}, 0);
				}
				hideDeleteButton();
			}

function onDelete(e){
				if(e && e.type === "keydown" && e.keyCode !== 13){ return; }
				var item = registry.getEnclosingWidget(e.target);
				//alert("deleting item:"+item);
				setTimeout(function(){
					item.destroy();
				}, 0);
			}
window.EditViewlists =function  (forceflag)
 {
 // alert("edit personal viewlists");
				var flag = window.btn1._flag = !window.btn1._flag; // true: editable
				if(forceflag == false)
				{
					flag= false;
					window.btn1._flag = false;
				}	
			
				if(flag){  
					window.MyViewlist.startEdit();
					window.btn1.set("label", "Done");
				//	keyHandler = connect.connect(window.MyViewlist.domNode, "onkeydown", onKeydown);
				}else{
					hideDeleteButton();
					window.MyViewlist.endEdit();
					window.btn1.set("label", "Edit");
				//	connect.disconnect(keyHandler);
				}
 }

            connect.subscribe("/dojox/mobile/viewChanged", function (view) {
            
               window.swipedImages++;
                        	

                //alert("changeview "+ view);
                //
                // alert(view.getChildren()[0]['alt']);
                var artist = "";
                var title = "";
                var imagesize = ""
				var genre ="";
				var ratingvalue= 0;

                //alert(view);
                if ((view + "").split(', ')[1][0] == 'I')
                    return;
                //alert("changing view 0 on you");
                window.currImage = view.getChildren()[0]['alt'];
                if ((!window.foundIndex) && (window.currImage != window.tarImage)) {
                   // view.goTo(1);
                    return;
                }
                // alert("changing view on you");
				hidemenu();
                window.foundIndex = true;
                window.currImage = view.getChildren()[0]['alt'];

                loadmetadata();
                // alert("meta= " + metaPlane7.innerHTML);
                
                
                
                var url = base+"client/update2?imageID="+view.getChildren()[0]['alt']+"&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat+"&token="+window.token;
                
                for (var player in window.playerSet) {
                	if (window.playerSet[player]) {
                		url += "&players[]="+ player.substring(1);
                    }
                }
                //alert(url);
                dojo.io.script.get({
                	url: url,
                	callbackParamName: "callback",
                	load: function (result) {
                    }
                });
                


            });




            //sliderReady();




        });
    });

function get_short_url(long_url, login, api_key, func)
{
    $.getJSON(
        "https://api-ssl.bitly.com/v3/shorten?callback=?", 
        { 
            "access_token": window.api_key,
            "longUrl": long_url
        },
        function(response)
        {
		window.response1=response;
		console.log("resp:"+window.response1);
            func(response.data.url);
        }
    );
}








function emailShare()

{

imageurl=imageMap[currImage]["thumbnail"];

//alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
var url="http://prod.artkick.net/"
url = url + "?currList="+encodeURIComponent(currList)+"&currImage="+encodeURIComponent(currImage)+"&currCat="+encodeURIComponent(currCat);
//alert("url="+url);


console.log("long:"+url);
get_short_url(url, login, api_key, function(short_url) {
    console.log("short"+short_url);
	calliOSFunction("email", ['Artkick rocks',short_url,encodeURIComponent(imageMap[currImage]["thumbnail"]),'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");
	try{
	Android.email('Check out this great image and thousands more at Artkick',short_url, imageMap[currImage]["thumbnail"],'Artkick rocks');
	}
	catch(err){
	
	}
	setTimeout(function(){hidemenu()},1000);
})

}

function twitter()
{
	//alert("facebook!");

imageurl=imageMap[currImage]["thumbnail"];

//alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
var url="http://prod.artkick.net/";
//url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);

url = url + "?currList="+encodeURIComponent(currList)+"&currImage="+encodeURIComponent(currImage)+"&currCat="+encodeURIComponent(currCat);

get_short_url(url, login, api_key, function(short_url) {
calliOSFunction("twitter", ['Artkick rocks',short_url,encodeURIComponent(imageMap[currImage]["thumbnail"]),'Check out this great image and thousands more at Artkick @artkicktv #freeart'], "onSuccess", "onError");
try{
	Android.twitter('Check out this great image and thousands more at Artkick @artkicktv #freeart',short_url, imageMap[currImage]["thumbnail"],'Artkick rocks');
}
catch(err){
	
}
setTimeout(function(){hidemenu()},1000);
})
}


function mytest()
{
alert("mytest");
}


function facebook()
{
	//alert("facebook!");

imageurl=imageMap[currImage]["thumbnail"];

//alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
var url="http://prod.artkick.net/"
url = url + "?currList="+encodeURIComponent(currList)+"&currImage="+encodeURIComponent(currImage)+"&currCat="+encodeURIComponent(currCat);
//alert ("url="+url);
get_short_url(url, login, api_key, function(short_url) {
calliOSFunction("facebook", ['Artkick rocks',short_url,encodeURIComponent(imageMap[currImage]["thumbnail"]),'Check out this great image and thousands more at Artkick @artkicktv #freeart'], "onSuccess", "onError");
try{
	//alert(imageMap[currImage]["thumbnail"]);
	Android.facebook('Check out this great image and thousands more at Artkick @artkicktv #freeart',short_url, imageMap[currImage]["thumbnail"],'Artkick rocks');
} catch(err){
}
setTimeout(function(){hidemenu()},1000);	
})
}



function testlaunch()
{
ret=open("artkick://prod.artkick.net/?currList=1047&currImage=9508&currCat=Lifestyle","");
//alert("return="+ret);
}

function showiframe(url) {
    var currView = dijit.registry.byId("ImageView");
  //  alert ("displayiframe currView= "+url);
	ret=window.iframe=dojo.create("iframe", {
        "src": url,
        "style": "border: 0; width: 100%;height:700px"
    });
    dijit.registry.byId("displayiframe").set("content",window.iframe );
    //currView.performTransition("iframeview", 1, "slide", null);
    gotoView("ImageView","iframeview")
	return(ret);
}
function showfullimage() {
    var currView = dijit.registry.byId("ImageView");
	
	hidebutton("GridView",true);
    document.getElementById("fullurl").setAttribute("src",window.imageMap[window.currImage]["url"]);
	
	window.currentView = "fullimageview";
    currView.performTransition("fullimageview", 1, "flip", null);
}
function bigimage() {
//check if menu up then close otherwise call showfullimage
 if (window.sharemenushow) 
        hidemenu();
	else
	    showfullimage();
}

function destroyiframe(){
   var currView = dijit.registry.byId("iframeview");
      hidebutton("GridView",true);
   dojo.destroy(window.iframe);
   currView.performTransition("ImageView", -1, "", null);
}

function destroyfullimageview(){
   var currView = dijit.registry.byId("fullimageview");
	window.currentView = "ImageView";
   currView.performTransition("ImageView", -1, "flip", null);
}

function showviewlistmenu() {
    var menulist = dijit.registry.byId("Viewlistmenu");


    if (window.viewmenushow || window.systemmenushow) {
        hidemenu();
    } else {
        menulist.show();
        window.viewmenushow = true;
    }
}
function showsharemenu(){
	if( window.sharemenushow)
		hidemenu();
   else
   {
		dijit.registry.byId("Sharemenu2").show();		
		//dojo.style("Sharemenu2","display", "block");
				
		window.sharemenushow=true;
	}
}

function showviewlistmenu2() {
    var menulist = dijit.registry.byId("Viewlistmenu2");


    if (window.viewmenushow2 || window.systemmenushow2) {
        hidemenu();
    } else {
        menulist.show();

        window.viewmenushow2 = true;
    }
}



function hidemenu() {

 
	dijit.registry.byId("Sharemenu2").hide();
  //   shmenu=dijit.registry.byId("Sharemenu2");
//	                 shmenu.style.display = "none";
	//			   		shmenu.style.visibility = "hidden";
						
	dojo.style("Sharemenu2","display", "none");
//	alert("sharemenu2="+dojo.style("Sharemenu2"));
	window.sharemenushow = false;
    window.systemmenushow = false;
    window.viewmenushow = false;
    window.systemmenushow2 = false;
    window.viewmenushow2 = false;
    

}


function swapview(newview){
    
	//alert ("swapview "+newview);
	 var currView = dijit.registry.byId("ImageView");
	 var currView2 = dijit.registry.byId("blankview");

	window.currList = newview;
	hidemenu();

	//currView.performTransition("blankview", 1, "fade", null);
	
	gotoView('ImageView','blankview');
	window.switchView= true;
	//currView.hide();
	updateImages(-1);

	
				
}

function goToShare() {
    var currView = dijit.registry.byId("ImageView");
    var mycurrView = currView.getShowingView();
	hidemenu();
	window.currentView = "Share";
    mycurrView.performTransition("Share", 1, "fade", null);
}


function notimplemented() {
    alert("Feature not yet implemented");
    hidemenu();
}






function refreshView() {
// if user clicks on "now Showing" button it refreshes the view to what is presently being displayed
	//alert("refresh view");
	if(!window.email){
		return;
	}
	  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-44460273-2', 'artkick.net'); <!-- change this to -1 for production -->
  ga('send', 'pageview');
	window.justRefresh = true;
	window.switchView = true;
	var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView();
    //alert(mycurrView);
    //mycurrView.performTransition("blankview", 1, "fade", null);
    gotoView('ImageView','blankview');
	updateImages(-1);
}

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}



function cleanUp() {
    window.foundIndex = false;
    window.selectedPlayers = {};
    window.justLogin = true;
	window.firstdisplay = true;
	window.justRefresh = false;
    window.imageMap = {};
    window.email = null;
    window.fill = false;
    window.ownedPlayers = {};
    window.removePlayers = {};
    window.playerSet = {};
    window.currList = null;
    window.currImage = null;
    window.currCat = null;
    window.currViewList = null;
    window.owndedPlayers = {};
    window.removePlayers = {};
    window.menushow = false;
    window.justCreatePlayer = false;
	window.loadartistview = false;
	window.loadmuseumview = false;
	window.loadcatview = false;
    $("#addPlayerEmail").attr('value', '');
    getDefaults();
}



function sendfeedback() {
    //var currView = dijit.registry.byId("Feedback");
    window.location = "mailto:feedback@artkick.com?Subject=Artkick%20feedback";
    //  win.focus();
	window.currentView = "ImageView";
    currView.performTransition("ImageView", 1, "", null);
}

// this routine forces external links to be shown in our own window.
// this is important when we use iframe to show artist/work links and the user then clicks on another link on that webpage, it does not open another browser window
//$(document).ready(function(){
 //   if (("standalone" in window.navigator) && window.navigator.standalone) {
      // For iOS Apps
 //     $('a').on('click', function(e){
 //       e.preventDefault();
 //       var new_location = $(this).attr('href');
 //       if (new_location != undefined && new_location.substr(0, 1) != '#' && $(this).attr('data-method') == undefined){
 //         window.location = new_location;
 //       }
 //     });
 //   }
 // });
function openCustomURLinIFrame(src)
{
    
//	alert("custom iframe url:"+src);
	var rootElm = document.documentElement;
    var newFrameElm = document.createElement("IFRAME");
    newFrameElm.setAttribute("src",src);
    rootElm.appendChild(newFrameElm);
    //remove the frame now
    newFrameElm.parentNode.removeChild(newFrameElm);
}

window.calliOSFunction = function(functionName, args, successCallback, errorCallback)
{ 
    var url = "js2ios://";

    var callInfo = {};
    callInfo.functionname = functionName;
    if (successCallback)
    {
        callInfo.success = successCallback;
    }
    if (errorCallback)
    {
        callInfo.error = errorCallback;
    }
    if (args)
    {
        callInfo.args = args;
    }

    url += JSON.stringify(callInfo)

    openCustomURLinIFrame(url);
}



function onSuccess (ret)
{   //alert("success!");
    if (ret)
    {
        var obj = JSON.parse(ret);
        //document.write(obj.result);
        //alert(obj.result);
		hidemenu();
    }
}

function onError (ret)
{   //alert("error!");
    if (ret)
    {
        var obj = JSON.parse(ret);
        //document.write(obj.error);
		        //alert(obj.result);
		hidemenu();
    }
}

// this function used to parse paramaters off the http line
function get(name){
   if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
}
//alert("toCall");

function usermessage(message){
    var messagebox = dijit.registry.byId('UserMessage');

	dojo.byId('UserMessage').innerHTML=message;
	 setTimeout(function(){messagebox.show()},100);
	 setTimeout(function(){messagebox.hide()},2000);
}

function setAutoIntro(flag){
	//alert(""+flag);
	window.autoIntro = flag;



}


