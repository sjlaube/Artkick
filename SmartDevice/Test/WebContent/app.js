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
        "dojo/dom-attr"
    ],
    function ( 
        $,
        ready,
        dom,
        domStyle,
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
        domAttr) {



        ready(
		
	
		function () {


            var base = "http://evening-garden-3648.herokuapp.com/client/";
            var selectListView = registry.byId("PlaylistView");
            var listList = registry.byId("listList");
            var playerList = registry.byId("playerList");
            var imagesList = registry.byId("ImageList");

            var catList = registry.byId("catList");
            var ownedPlayerList = registry.byId("ownedPlayerList");
            var removePlayerList = registry.byId("removePlayerList");
            var selectPlayerView = registry.byId("select_player");
            var selectCatView = registry.byId("select_category");
            var imageView = registry.byId("ImageView");
			var optionsView = registry.byId("OptionsList");
			var pictureGrid = registry.byId("Picturegrid");
			var gridView = registry.byId("GridView");
		
            var regPlayerView = registry.byId("registernewchromecast");	

            var addUserView = registry.byId("add_user_player");
            var removePlayerView = registry.byId("removeplayer");
            var fillsw = dijit.registry.byId("fillswitch");
			var LoadImages = document.getElementById("LoadImages");
			
	
			var	userrating = new Rating({
							numStars:5});	
            window.boucingTime = 3000;
            window.foundIndex = true;
            window.selectedPlayers = {};
            window.justLogin = true;
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
			window.iframe = {};
			window.url=null;
			window.shuffle= false;
         
           window.switchView = false;
		
		   window.sliderIndex = 0;
		   window.gridset = false;
		   window.currGridList = -1;
		

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
                  //   alert("checkCookie " + email);
                var I0 = registry.byId("Intro0");
                 //     alert ("Io= " + I0 + I0.selected);
                var Iv = registry.byId("ImageView");
                var splash = dojo.byId("splash");
				var menx = registry.byId("Sharemenu")
				var opt = registry.byId("OptionsList");
				

             //    alert("Imageview= "+ Iv + I0 +splash+menx+optionsView+opt);
             //     I0.startup();
               //   alert ( "intro0 startup"); 
               I0.show();
                Iv.startup();
               //  alert ("try spash= " + splash+"Iv="+Iv);

               //    splash.style.display = "none";
				  // 		splash.style.visibility = "hidden";
             //    alert ("did splash");

                //     alert ("imageview startup");

            //    alert("email1="+email);
                if (email != null && email != "" && email != "null") {
           //        alert ("good to go");


                    //     alert("Welcome again " + email);
                    var base = "http://evening-garden-3648.herokuapp.com/player/";
                    dojo.io.script.get({
                        url: base + "getUser?email=" + email,
                        callbackParamName: "callback",
                        load: function (result) {
				//		alert("status="+result["Status"]);
                            if (result["Status"] == "success") {
							//  splash.style.display = "none";
                  //        alert("we are here");
                                //        var currView = dijit.registry.byId("Intro0");
                                //        var mycurrView = currView.getShowingView();
                                window.email = email;
                                Iv.selected = true;
						//		alert("before iv show");
                               
								splash.style.display = "none";splash.style.visibility = "hidden";
                               Iv.show();
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
            
            
            
            window.getDefaults = function(){
            	var base = "http://evening-garden-3648.herokuapp.com/client/";
            	dojo.io.script.get({
                     url: base + "getDefault",
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
            	var url = base+"update2?imageID="+window.currImage+"&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat;
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
                var url = base + "getViewlist4?id=" + window.currList+"&email="+window.email+"&tarImage="+targImage+"&forward="+forward+"&numOfImg="+numOfImg+"&include=1";
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
                        	alert("'My Top Rated Images' is empty, please star-rate some images and they will be added to it!");
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
                                //alert(window.currAbsIndex+"/"+window.listSize);
                            	
                                imagesList.setStore(null);
                                imagesList.setStore(window.imageCurrStore);
                                // uncover the carousel!!!
                                //alert(imagesList);
                                //         alert("store set");
								LoadImages.style.visibility = "hidden";	
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
							// alert("view2="+currView2+"view="+currView);
		                   currView.performTransition("ImageView", 1, "fade", null);
                           },500);
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
             //  alert("update images");
                if (window.justLogin || window.justRefresh) {
				   //  alert("justlogin");
					 window.justRefresh = false;
                    dojo.io.script.get({
                        url: base + "getUserStatus?email=" + window.email,
                        callbackParamName: "callback",
                        load: function (result) {
                            if (result["Status"] == "success") {
                                window.tarImage = result["curr_image"];
                                //alert("tar"+window.tarImage);
                                window.currList = result["curr_list"];
                                window.currCat = result["curr_cat"];

                                window.fill = (result["fill"] == "true");
                                window.shuffle = (result["shuffle"]=="true");
                                
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
								var curonce=get('once');
						//		alert("start, check currList="+curl+"image"+curi+"cat:"+curc);
								if (curl&&curi&&curc&&!curonce)
								{
							//	alert ('overriding to new image');
				
								window.tarImage = curi;
                                window.currList = curl;
                                window.currCat = curc;
								// since this is already in the native app, we don't relauch
								//var url="artkick://?currList="+curl+"&currImage="+curi+"&currCat="+curc+"&once="+"true";
							//	alert("url:"+url);
								//testlaunch(); 
							//	openCustomURLinIFrame(url);		
								//	alert("ret="+ret);
											//open(url,"");
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
			//	alert('load images target:'+targImage);
                    loadImages(targImage,1,15,1);
                }
				

            }

            function updateRemovePlayers() {
                var base = "http://evening-garden-3648.herokuapp.com/player/";
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
                    url: base + "getPlayers?email=" + window.email,
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
                var base = "http://evening-garden-3648.herokuapp.com/player/";
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
                    url: base + "getOwnedPlayers?email=" + window.email,
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

            /*
         function  updateOwnedPlayers(){
                var base = "http://evening-garden-3648.herokuapp.com/player/";
                window.ownedPlayers={};
                ownedPlayerList.destroyRecursive(true);
            	$("#ownedPlayerList").html('');
            	alert( base + "getOwnedPlayers?email="+window.email);
                dojo.io.script.get({
                      url: base + "getOwnedPlayers?email="+window.email,
                      callbackParamName: "callback",
                      load: function(result){
                           //alert( result["players"].length);
                           alert(result["players"]);
                           var players= result["players"];
                           for(var i in players){
                               //playerStore.newItem({"label":players[i]["nickname"],"paccount":players[i]["account"]});
                               //window.ownedPlayers[players[i]["account"]]=false;
                                alert(players[i]["nickname"]);
                                li = new dojox.mobile.ListItem({id:players[i]["account"], 
                                                              label:players[i]["nickname"],
                                                              onClick:function(){
                                                              	alert(this.id);
                                                              },                                                   
                                                              });
                                ownedPlayerList.addChild(li);   
                           }
                      }
                });
            }
           
*/

           window.goToViewlists = function(){
                	window.foundIndex = true;
                	window.justLogin = false;

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

                var currView = dijit.registry.byId("Intro0");
                var mycurrView = currView.getShowingView();
				//  reset the scrollable view to the top
				var c = dijit.byId("PlaylistView").containerNode;
                dojo.setStyle(c, {
                 webkitTransform: '',
                  top: 0,
                  left: 0
                    });
                mycurrView.performTransition("PlaylistView", 1, "slide", null);

           }

            function updateCats() {
                var base = "http://evening-garden-3648.herokuapp.com/content/";
			//	 	dijit.registry.byId("ImageView").hide();
                catList.destroyRecursive(true);
                $("#catList").html('');
                dojo.io.script.get({
                    url: base + "allCategories",
                    callbackParamName: "callback",
                    load: function (result) {
                        var cats = result["categories"];
                        for (var i in cats) {
                            newCat = new dojox.mobile.ListItem({
                                id: cats[i]["name"],

                                label: cats[i]["name"] + "<br><i><small>" + cats[i]["viewlists"].length + " viewlists</small></i></br>",

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
                var base = "http://evening-garden-3648.herokuapp.com/content/";
                listList.destroyRecursive(true);
                $("#listList").html('');
 

                dojo.io.script.get({
                    url: base + "getViewlistsByCategory?catName=" + catName,
                    callbackParamName: "callback",
                    load: function (result) {
                        var lists = result["viewlists"]; 
						//  put user's tops lists first in the list
						if(catName == "Top Lists"){
                       	    //alert("Top Lists");
                       	    
                            myTopList = new dojox.mobile.ListItem({
                                id: "top_"+window.email,

                                label:  "My Top Rated Images",

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
                                clickable: true,
                                onClick: function () {
                                    //alert(this.id);
                                    window.currList = this.id;
                                     window.switchView = true;
                                    var currView = dijit.registry.byId("ImageView");
	                                var currView2 = currView.getShowingView();
                                    currView2.performTransition("blankview", 1, "slide", null);
                                    setTimeout(function(){updateImages(-1)},10);
                                },
                                moveTo: "",
								transition: "fade"
                            });
                           listList.addChild(myTopList);    
                        
                       }  
                        for (var i in lists) {
                            newList = new dojox.mobile.ListItem({
                                id: lists[i]["id"],

                                label: lists[i]["name"] + "<br><i><small>" + lists[i]["images"].length + " pictures</small></i></br>",

                                rightIcon: "mblDomButtonArrow",
                                variableHeight: true,
								clickable: true,
                                onClick: function () {
                                    //alert(this.id);
									var currView = dijit.registry.byId("ImageView");
	                                var currView2 = currView.getShowingView();
                                    currView2.performTransition("blankview", 1, "slide", null);
                                    window.currList = this.id;

                                    window.switchView = true;
                                    setTimeout(function(){updateImages(-1)},10);

                                },
                                moveTo: "",
								transition: "fade"
                            });
                            listList.addChild(newList);

                        }
                        
                        
                       
                    }
                    

                });
            }


            function rememberSelectPlayers() {
                //alert("remembering");
                var url = base + "selectPlayers?email=" + window.email;
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
                title = "<b>" + imageMap[currImage]["Title"].replace("'", "", "") + "</b>" + " " + imageMap[currImage]["Year"];
                // check if there is a video
			//	alert("video="+imageMap[currImage]["Video"]);
				if (imageMap[currImage]["Video"])			
			           title = title +"  "+ "<a style=\"color:#2518b5\" onclick='showiframe(\"" + imageMap[currImage]["Video"] + "\")' >" + "<img src='images/Play_Icon.png' align='center' >" + "</a>";
           
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
                        metaPlane3.innerHTML = "<a   style=\"color:#2518b5\" onclick='showiframe(\"" + imageMap[currImage]["More Info Link"] + "\")' >"+ title+"</a>";
                    else
                        metaPlane3.innerHTML = "<a   style=\"color:#2518b5\" onclick='showiframe(\"" + "http://" + imageMap[currImage]["More Info Link"] + "\")' >" + title+ "</a>";
                } 
				if (imageMap[currImage]["Artist Info"]) {
                    if (imageMap[currImage]["Artist Info"].substring(0, 4) == "http")
                        metaPlane4.innerHTML = "<a   style=\"color:#2518b5\" onclick='showiframe(\"" + imageMap[currImage]["Artist Info"] + "\")' >"+ artist+"</a>";
                    else
                        metaPlane4.innerHTML = "<a   style=\"color:#2518b5\" onclick='showiframe(\"" + "http://" + imageMap[currImage]["Artist Info"] + "\")' >" + artist+ "</a>";
                }
				if (imageMap[currImage]["Genre Link"]) {
                    if (imageMap[currImage]["Genre Link"].substring(0, 4) == "http")
                        metaPlane7.innerHTML = "<a   style=\"color:#2518b5\" onclick='showiframe(\"" + imageMap[currImage]["Genre Link"] + "\")' >"+ genre+"</a>";
                    else
                        metaPlane7.innerHTML = "<a   style=\"color:#2518b5\" onclick='showiframe(\"" + "http://" + imageMap[currImage]["Genre Link"] + "\")' >" + genre+ "</a>";
                }
            }
		

            function updatePlayers(selectedPlayers) {
                var base = "http://evening-garden-3648.herokuapp.com/player/";
                //alert("players");


                dojo.io.script.get({
                    url: base + "getPlayers?email=" + window.email,
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


                  		//if(result["players"].length == 0)
						      //alert("There are no players registered.");
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
                        
                        

                        if (window.justCreatePlayer) {
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
                            updateImages(-1);
                            var currView = dijit.registry.byId("Intro0");
                            var mycurrView = currView.getShowingView();
                            mycurrView.performTransition("ImageView", 1, "slide", null);
                            
                        }
                    }
                });

            }
			window.BrowserDetect.init();
			if (window.BrowserDetect.OS=="Linux" && window.BrowserDetect.browser!= "Chrome")
			{
			alert("You must run Artkick under Chrome, please restart using the Chrome browser");
		//	throw new Error();
			}
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

		//	alert("browser="+window.BrowserDetect.browser+" OS="+window.BrowserDetect.OS+regPlayerView+selectPlayerView+imageView+selectCatView+selectListView+optionsView+addUserView+removePlayerView+gridView);

			
	on(regPlayerView, "beforeTransitionIn", 
			 function(){
			 	window.updatePlayerLoop = setInterval(updatePlayers,1500);
				calliOSFunction("sayHello", ["On",window.email], "onSuccess", "onError");
			});
			
	on(regPlayerView, "beforeTransitionOut",
		      function(){
		      	clearInterval(updatePlayerLoop);
                rememberSelectPlayers();
				calliOSFunction("sayHello", ["Off",window.email], "onSuccess", "onError");
			});
			
			
        //   document.addEventListner("backbutton", function(){ alert ("back pushed");});
            // select player transition
     on(selectPlayerView, "beforeTransitionIn",

                function () {
                    //alert("Transition in!");
                    updatePlayers(window.selectedPlayers);

                });



     on(selectPlayerView, "beforeTransitionOut",
                function () {
                    rememberSelectPlayers()
                });
       

     on(imageView, "beforeTransitionIn",

                function () {
			//	alert("transition to ImageView");
                window.sliderIndex = 0;
				   var mytabbar = dijit.registry.byId("myTabBar");
				//   var tabcategory = dijit.registry.byId("tabcategory");
				 //  var tabshare = dijit.registry.byId("tabshare");
				   var tabnowshowing = dijit.registry.byId("tabnowshowing");
             //       alert("Transition in!");    

				//	mytabbar.resize();
				//	alert("tab bar resize");
                    hidemenu();
					// try to unset selected on buttonsvar fillsw = dijit.registry.byId("fillswitch");
				//	tabplaylist.set('selected', false);
				//	tabcategory.set('selected', false);
				//    tabshare.set('selected', false);
				   dijit.registry.byId("tabnowshowing").set('selected', true);
				//	alert("select tabnowshowing");
                    if (window.justLogin) {
                        updateImages(window.tarImage);
                        dojo.io.script.get({
                            url: base + "getSelectedPlayers?email=" + window.email,
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
                    } else if (window.justCreatePlayer) {
                        updatePlayers();
                        if(window.shuffle){
                           // if random, then switch to normal!
                           mediashuffle();
                        }
                        updateImages(-1);
                    }
                });


            on(selectCatView, "beforeTransitionIn",

                function () {
                    //alert("Transition in!");
					dijit.registry.byId("tabcategory3").set('selected', true);
                    window.foundIndex = true;
                	window.justLogin = false;
                    hidemenu();
                    updateCats();

                });


            on(selectListView, "beforeTransitionIn",

                function () {
				dijit.registry.byId("tabcategory2").set('selected', true);
				});
             on(optionsView, "beforeTransitionIn",

                function () {
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
                    //alert ("adduser transitionin");
                    updateOwnedPlayers();
                });

            on(removePlayerView, "beforeTransitionIn",
                function () {
                    updateRemovePlayers();
                }
            ); 
            on(gridView, "beforeTransitionIn",
                function () 
				{ 
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
                var url = base + "getViewlist4?id=" + window.currList+"&email="+window.email+"&tarImage="+window.targImageGrid+"&forward="+forward+"&numOfImg=20"+"&include="+include;
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
			//	alert ("dim="+dim);
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


										dijit.registry.byId("GridView").performTransition("blankview", 1, "fade", null);
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
			   var base = "http://evening-garden-3648.herokuapp.com/client/";
		//	   alert(imageMap[window.currImage]["User Rating"]);
			   imageMap[window.currImage]["User Rating"]=userrating.value;
			   dojo.io.script.get({
                   url: base + "rateImage?imageId=" + window.currImage + "&email=" + window.email + "&rating=" + userrating.value,
                   callbackParamName: "callback",
                   load: function (result) {
                   }
               });
			
			});
     	
		//	on(userrating, "mouseover",
			//	function(){
				//alert("mouseover change ratings"+userrating.hoverValue);
				// not needed, since we don't want to change value unless the user clicks 
				//  var base = "http://evening-garden-3648.herokuapp.com/client/";
			   //alert(imageMap[window.currImage]["User Rating"]);
			  // imageMap[window.currImage]["User Rating"]=userrating.value;
			   //alert("hover rating="+userrating.value);
			  // dojo.io.script.get({
                //   url: base + "rateImage?imageId=" + window.currImage + "&email=" + window.email + "&rating=" + userrating.value,
                  // callbackParamName: "callback",
              //     load: function (result) {
                //   }
              // });
		//		});	
				
				
	        window.doPrev = function(imgId) {

				//alert("currView id "+imgId);
				//alert("Prev img "+window.prevImg);

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
  					LoadImages.style.visibility = "visible";	                  
                    window.imageCurrStore = new ItemFileWriteStore({
                       data: imageData
                    });
                    loadImages(window.currStartImg,0,15,0);
					
				}
				
				else if (imgId == window.currEndImg&&imgId!=window.absEndImg){
					//slide forward at tail
					//next chunk!
					
					var imageData = {
                       "items": []
                    };
                    LoadImages.style.visibility = "visible";
                    window.imageCurrStore = new ItemFileWriteStore({
                       data: imageData
                    });
                    //window.sliderIndex = 0;
                    loadImages(window.currEndImg,1,15,0);
					
					
				}
				
				window.prevImg = imgId;
				
				
			}
			
			
				
			window.doNext = function(imgId) {

				
				
		      /*	
               alert("next action detected!");
               window.swipedImages++;
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
              //alert(window.currAbsIndex+"/"+window.listSize);
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
                
                
                
                var url = base+"update2?imageID="+view.getChildren()[0]['alt']+"&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat;
                
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
                        //alert(window.fill);
                        dojo.io.script.get({
                            url: base + "update.json?snumber=" + player.substring(1) + "&imageID=" + view.getChildren()[0]['alt'] + "&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat,
                            callbackParamName: "callback",
                            load: function (result) {
                                //alert(base + "update.json?snumber=" + player.substring(1) + "&imageID=" + view.getChildren()[0]['alt']+"&stretch="+window.fill);

                            }
                        });

                    }
                }
                */

            });




            //sliderReady();




        });
    });




function login() {
    //alert("login!");
	var currTime = new Date().getTime();
    if(window.loginClickTime!=undefined && currTime - window.loginClickTime < window.boucingTime)
        return;
	window.loginClickTime = currTime;
    
    
    var base = "http://evening-garden-3648.herokuapp.com/client/";
    var currView = dijit.registry.byId("Login");
    dojo.io.script.get({
        url: base + "login?email=" + dojo.byId("loginEmail").value+"&password="+dojo.byId("loginPassword").value,
        callbackParamName: "callback",
        load: function (result) {
            //alert(result["message"]);
            if (result["status"] == "success") {
                userObj = result["userObj"];
                alert("Welcome! " + userObj["name"]);
                window.email = dojo.byId("loginEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
                //alert(window.email);
                setCookie("email", window.email, 365);
                currView.performTransition("ImageView", 1, "slide", null);
            } else {
                alert("login failed, please check your email and password or register!");
            }
        }
    });
}

function goToReg() {
    var currView = dijit.registry.byId("Login");
    currView.performTransition("registeruser", 1, "slide", null);
}


function goToresetpassword() {
    var currView = dijit.registry.byId("Login");
    currView.performTransition("reset_password", 1, "slide", null);
}
function mediashuffle() {
if (window.shuffle)
{
       window.shuffle=false;
	   dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');
}
else
{
		window.shuffle=true;
		dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
}
updateImages(-1);
}


function emailShare()

{

imageurl=imageMap[currImage]["thumbnail"];

//alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
var url="http://test.artkick.net/"
url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);
//alert("url="+url);
calliOSFunction("email", ['Artkick rocks',url,encodeURIComponent(imageMap[currImage]["thumbnail"]),'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");
setTimeout(function(){hidemenu()},1000);
}

function twitter()
{
	//alert("facebook!");

imageurl=imageMap[currImage]["thumbnail"];

//alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
var url="http://test.artkick.net/"
url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);
calliOSFunction("twitter", ['Artkick rocks',url,encodeURIComponent(imageMap[currImage]["thumbnail"]),'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");
setTimeout(function(){hidemenu()},1000);
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
var url="http://test.artkick.net/"
url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);
//alert ("url="+url);
calliOSFunction("facebook", ['Artkick rocks',url,encodeURIComponent(imageMap[currImage]["thumbnail"]),'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");

setTimeout(function(){hidemenu()},1000);

var obj={
//method: 'feed',
    name: 'Artkick rocks',
    link: "http://test.artkick.net/",
    picture: imageurl,
	//display:'popup',
    caption: 'Artkick',
//	redirect_uri: 'http://test.artkick.net',
    description: 'Check out this great image and thousands more at Artkick'
}

}

function testlaunch()
{
ret=open("artkick://test.artkick.net/?currList=1047&currImage=9508&currCat=Lifestyle","");
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
    currView.performTransition("iframeview", 1, "slide", null);
	return(ret);
}
function showfullimage() {
    var currView = dijit.registry.byId("ImageView");
	
	hidebutton("GridView",true);
    document.getElementById("fullurl").setAttribute("src",window.imageMap[window.currImage]["url"]);
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
   currView.performTransition("ImageView", -1, "slide", null);
}

function destroyfullimageview(){
   var currView = dijit.registry.byId("fullimageview");

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

function goToLogin1() {
    var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView();
//	alert("goto login"+mycurrView);
    mycurrView.performTransition("Login", 1, "slide", null);
}
function swapview(newview){
    
	//alert ("swapview "+newview);
	 var currView = dijit.registry.byId("ImageView");
	 var currView2 = dijit.registry.byId("blankview");

	window.currList = newview;
	hidemenu();

	currView.performTransition("blankview", 1, "fade", null);
	window.switchView= true;
	//currView.hide();
	updateImages(-1);
	
				
}

function dologout() {

    var currView = dijit.registry.byId("LogOff");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();

}

function regnewroku() {
    var currView = dijit.registry.byId("registernewplayer");

    // processes register new roku button
    currView.performTransition("registernewroku", 1, "slide", null);

}

function installartkick() {
    //alert ("install artkick");
    //var win = window.open("https://owner.roku.com/add/ArtkickV0", '_blank');
    //win.focus();
    calliOSFunction("loadLink", ["https://owner.roku.com/add/ArtkickV0"], "onSuccess", "onError");
    

}

function goToReg1() {
    var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView()
    mycurrView.performTransition("registeruser", 1, "slide", null);
}

function goToShare() {
    var currView = dijit.registry.byId("ImageView");
    var mycurrView = currView.getShowingView();
	hidemenu();
    mycurrView.performTransition("Share", 1, "fade", null);
}


function notimplemented() {
    alert("Feature not yet implemented");
    hidemenu();
}

function createUser() {
    var currView = dijit.registry.byId("registeruser");
    var base = "http://evening-garden-3648.herokuapp.com/client/";
    var pw="";
	var verifypw="";
	pw=dojo.byId("regUserPW").value;
	verifypw=dojo.byId("regUserPW2").value;
	if (pw=="")
	{
		alert("Password cannot be blank");
		return;
	}
	if (pw != verifypw)
	{
		alert("Passwords don't match");
		return;
	}
	if (dojo.byId("regUserEmail").value =="")
	{
		alert("User email cannot be blank");
		return;
	}
	if (dojo.byId("regUserName").value =="")
	{
		alert("User name cannot be blank");
		return;
	}
		
    dojo.io.script.get({
        url: base + "regUser?email=" + dojo.byId("regUserEmail").value + "&name=" + dojo.byId("regUserName").value+"&password=" + pw,
        callbackParamName: "callback",
        load: function (result) {
            if (result["status"] == "success") {
                alert("Welcome " + dojo.byId("regUserName").value + "!");
                currView.performTransition("ImageView", 1, "slide", null);
                window.email = dojo.byId("regUserEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
                //alert(window.email);
            } else {
                alert(result["message"]);
            }

        }
    });

}

function changePwLogout(){
	var currView = dijit.registry.byId("AccountSettings");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();
}

function changePW() {
	var oldpw="";
	var newpw1="";
	var newpw2="";
	oldpw=dojo.byId("changeOldPW").value;
	newpw1=dojo.byId("changeNewPW1").value;
	newpw2=dojo.byId("changeNewPW2").value;

	if (newpw1 != newpw2)
		alert("Passwords don't match!");
	else
	{  var base = "http://evening-garden-3648.herokuapp.com/client/";
	   //alert(base+"resetPassword?email="+window.email+"&oldpassword="+oldpw+"&newpassword="+newpw1);
       dojo.io.script.get({
       	 url:base+"resetPassword?email="+window.email+"&oldpassword="+oldpw+"&newpassword="+newpw1,
       	 callbackParamName: "callback",
       	 load: function (result) {
             alert(result["message"]);
             if(result["status"]=="success"){
             	changePwLogout();
             }
       	 }
       });
	}
}

function emailPwLogout(){
	var currView = dijit.registry.byId("reset_password");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();
}

function emailPW(){
	var base = "http://evening-garden-3648.herokuapp.com/client/";
	dojo.io.script.get({
		url:base+"emailPassword?email="+dojo.byId("recoveryEmail").value,
		callbackParamName: "callback",
		load: function(result){
			 alert(result["message"]);
			 if(result["status"]=="success"){
			 	emailPwLogout();
			 }
		}
	});
}

function refreshView() {
// if user clicks on "now Showing" button it refreshes the view to what is presently being displayed
	//alert("refresh view");
	if(!window.email){
		return;
	}
	
	window.justRefresh = true;
	window.switchView = true;
	var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView();
    //alert(mycurrView);
    mycurrView.performTransition("blankview", 1, "fade", null);
	setTimeout(function(){updateImages(-1)},10);
}

function removePlayersAction() {
	var currTime = new Date().getTime();
	//alert("currTime"+currTime);
	//alert("lastTime"+window.rmplayerClickTime);
    if(window.rmplayerClickTime!=undefined && currTime - window.rmplayerClickTime < 7000)
        return;
	window.rmplayerClickTime = currTime;
	
    var r = confirm("Are you sure you want to delete the selected players?");
    if (r == false) {
        return;
    }
    var base = "http://evening-garden-3648.herokuapp.com/player/";
    var currView = dijit.registry.byId("removeplayer");
    var i = 0;
    for (var key in window.removePlayers) {
        if (window.removePlayers[key]) {
            i++;
        }
    }
    for (var key in window.removePlayers) {
        if (window.removePlayers[key]) {
            dojo.io.script.get({
                url: base + "removePlayer?email=" + window.email + "&playerId=" + key,
                callbackParamName: "callback",
                load: function (result) {
                	if(result["Status"]=="success")
                        alert(result["Message"]);
                    i--;
                    if (i == 0) {
                        currView.performTransition("select_player", 1, "slide", null);
                    }
                }
            });
        }

    }
}



function addUserToPlayers() {
    var currTime = new Date().getTime();
    if(window.addUserClickTime!=undefined && currTime - window.addUserClickTime < window.boucingTime)
        return;
	window.addUserClickTime = currTime;
	
	
    var email = dojo.byId("addPlayerEmail").value;

    var base = "http://evening-garden-3648.herokuapp.com/player/";
    for (var key in window.ownedPlayers) {
        if (window.ownedPlayers[key]) {
            dojo.io.script.get({
                url: base + "addUserToPlayer?email=" + email + "&playerId=" + key,
                callbackParamName: "callback",
                load: function (result) {
                    alert(result["Message"]);
                }
            });
        }

    }
}



function searchUser() {
	var currTime = new Date().getTime();
    if(window.searchuClickTime!=undefined && currTime - window.searchuClickTime < window.boucingTime)
        return;
	window.searchuClickTime = currTime;
	
	
    var email = dojo.byId("addPlayerEmail").value;
    //alert(email);
    var base = "http://evening-garden-3648.herokuapp.com/player/";
    dojo.io.script.get({
        url: base + "getUser?email=" + email,
        callbackParamName: "callback",
        load: function (result) {
            alert(result["Message"]);
        }
    });
}



function setAuto(interval) {
    var base = "http://evening-garden-3648.herokuapp.com/client/";
    for (var player in window.playerSet) {
        if (window.playerSet[player]) {
            //alert(base+"setAuto?email="+window.email+"&snumber="+player.substring(1)+"&autoInterval="+interval);
            dojo.io.script.get({
                url: base + "setAuto?email=" + window.email + "&snumber=" + player.substring(1) + "&autoInterval=" + interval,
                callbackParamName: "callback",
                load: function (result) {}
            });

        }


    }

}



function createPlayer() {
	
	var currTime = new Date().getTime();
    if(window.createPlayerClickTime!=undefined && currTime - window.createPlayerClickTime < window.boucingTime)
        return;
	window.createPlayerClickTime = currTime;
	if (dojo.byId("regPlayerCode").value =="")
	{
		alert("Player Code cannot be blank");
		return;
	}
	if (dojo.byId("regPlayerName").value =="")
	{
		alert("You must name your player");
		return;
	}
	
    var currView = dijit.registry.byId("registernewroku");
    var base = "http://evening-garden-3648.herokuapp.com/reg/";
    alert(base + "userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get({
        url: base + "userReg?regCode=" + (dojo.byId("regPlayerCode").value).toLowerCase() + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
                alert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
                window.tarImage = window.defImage;
                window.currList = window.defList;
                window.currCat = window.defCat;
                window.justCreatePlayer = true;
                currView.performTransition("ImageView", 1, "slide", null);
                updatePlayers();
               

            } else {
                alert(result["Message"]);
            }

        }
    });
}

function fillswitch() {
    //alert(window.fill);
	var fillsw = dijit.registry.byId("fillswitch");
    if (window.fill) {
	    fillsw.set('label', "Not Active");
        window.fill = false;
    } else {
        window.fill = true;
		fillsw.set('label', "Active");
    }
    syncImage();
    //alert(window.fill);
}
function burninsaver() {
    //alert(window.fill);
	var fillsw = dijit.registry.byId("burninsaver");    
	var autoplay = document.getElementById("AutoPlaySelect");
    var autoplayfixed = document.getElementById("AutoPlayFixed");

    if (window.burn) {
	    fillsw.set('label', "Not Active");

		 autoplay.style.visibility = "visible";
		 autoplayfixed.style.visibility = "hidden";
		 window.burn=false;
    } else {

		fillsw.set('label', "Active");
		 autoplay.style.visibility = "hidden";
		 autoplayfixed.style.visibility = "visible";
		 setAuto(3600000);
		 window.burn=true;
    }
    //alert(window.fill);
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
    $("#addPlayerEmail").attr('value', '');
    getDefaults();
}



function sendfeedback() {
    //var currView = dijit.registry.byId("Feedback");
    window.location = "mailto:feedback@artkick.com?Subject=Artkick%20feedback";
    //  win.focus();
    currView.performTransition("ImageView", 1, "slide", null);
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

