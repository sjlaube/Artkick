/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

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
        "dojo/dom-attr",
        "dojo/dom-construct",
        "dojo/dom-prop",
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
        "dojo/data/ItemFileReadStore",
        "dojo/_base/connect",
        "dijit/form/Select",
        "dojox/form/Rating",
        "dojox/form/PasswordValidator",
        "dojo/dom-attr",
        "dojox/mobile/Carousel",
        "dojox/mobile/LongListMixin",
        "dojox/mobile/ScrollableView",
        "dojo/html",
        "dojox/gesture/swipe",
        "dojo/fx",
        "dojox/mobile/Accordion",
        "dojo/_base/lang",
        "dojo/dom-geometry",
        "dojox/widget/Standby",
		"dojo/window"

    ],
    function(
        $,
        ready,
        dom,
        domStyle,
        domClass,
        domAttr,
        domConstruct,
        domProp,
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
        ItemFileReadStore,
        connect,
        select,
        Rating,
        PasswordValidator,
        domAttr,
        Carousel,
        LongListMixin,
        ScrollableView,
        html,
        swipe,
        fx,
        Accordion,
        lang,
        domgeometry,
        Standby
    )
    {
        ready(
            function()
            {
              //  window.base = "http://ancient-caverns-7624.herokuapp.com/api/v1.1/"; //Staging Server
                 window.base = "http://evening-garden-3648.herokuapp.com/api/v1.1/";  // Production Server

                var selectListView = registry.byId("PlaylistView");
                var selectArtistListView = registry.byId("ArtistlistView");
                var selectMuseumListView = registry.byId("MuseumlistView");
                var playerList = registry.byId("playerList");
                var playerList2 = registry.byId("playerList2");
                var imagesList = registry.byId("ImageList");
                var catList = registry.byId("catList");
                var ownedPlayerList = registry.byId("ownedPlayerList");
                var removePlayerList = registry.byId("removePlayerList");
                var selectPlayerView = registry.byId("select_player");
                var selectPlayerView2 = registry.byId("select_player2");
                var selectCatView = registry.byId("select_category");
                var imageView = registry.byId("ImageView");
                var optionsView = registry.byId("OptionsList");
                var aboutView = registry.byId("About");
                var pictureGrid = registry.byId("Picturegrid");
                var pictureGrid2 = registry.byId("Picturegrid2");
                var Gettygrid = registry.byId("Gettygrid");
                window.Searchgrid = registry.byId("searchGrid");
                window.Searchgrid2 = registry.byId("searchGrid2");
                var gridView = registry.byId("GridView");
                window.gettyView = registry.byId("GettyView");
                window.progressBar1 = registry.byId("gettyprogress");
                window.progressBar2 = registry.byId("searchprogress");
                //	window.progressBar3 = registry.byId("scanprogress");
                var loginpassword = registry.byId("loginPassword");
                var loginx = registry.byId("Login");
                var regPlayerView = registry.byId("registernewchromecast");
                var quickhint = registry.byId("quickhint");
                var regRokuView = registry.byId("registernewroku");
                var ImportView = registry.byId("Import");
                var regTVView = registry.byId("registernewTV");
                var accountsettings = registry.byId("AccountSettings");
                var logoff = registry.byId("LogOff");
                var regnewplayer = registry.byId("RegisterNew");
                var addUserView = registry.byId("add_user_player");
                var removePlayerView = registry.byId("removeplayer");
                var tvplayeroptions = registry.byId("Slideshow");
                var fillsw = dijit.registry.byId("fillswitch");
                //	var LoadImages = document.getElementById("LoadImages");
                window.MyViewlist = registry.byId("MyViewLists");
                window.MyViewlistEdit = registry.byId("MyViewListsEdit");
                var MylistView = registry.byId("MylistView");
                var MylistViewEdit = registry.byId("MylistViewEdit");
                window.btn1 = registry.byId("btn1");
                button2 = registry.byId("btn1");
                //    window.listList = registry.byId("listList");
                window.listList2 = registry.byId("listList2");
                window.artistList = registry.byId("ArtistList");
                window.museumList = registry.byId("MuseumList");
                window.commentList = registry.byId("comment_list");
                window.viewlistbutton = registry.byId("viewlistbutton");
                window.sharemenu2 = registry.byId("Sharemenu2");
                window.browsesearch = registry.byId("browse-search");
                window.checkforparameters = true;
                window.currentView = "IntroA";
                window.lastView = "";
                window.highresolution = false;
                window.guest = false;
                window.autoIntro = true;
                window.delItem = "";
                window.restart = false;
                var handler;
                var bigload;
                var updatelistcount = 0;
                var userrating = new Rating(
                {
                    numStars: 5
                });
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
                window.url = null;
                window.shuffle = false;
                window.loadartistview = false;
                window.loadmuseumview = false;
                window.loadcatview = false;
                window.api_key = "6ab1450c247164d8448624c47e894a6874c43a46";
                window.switchView = false;
                window.sliderIndex = 0;
                window.gridset = false;
                window.currGridList = -1;
                window.transitiontype = "slide";
                window.firstimageview = "false"; // pop up hint screen only the first time
                window.bigImg = false;
                window.wipemenu = false;
                window.wipesharemenu = false;
                window.showingmenu = "";
                window.numberplayers = 0;
                window.shownoviewlist = false;
                window.userName = "";
                window.isAdmin = false;
                window.gridsize = 100; /* how many images to load into gridview at a time */
                window.moregridpages = false;
                window.gettyEditorial = "Any";
                window.gettyEditorialTime = "Any";
                window.gettyEditorialOrientation = "horizontal";
                window.gettylastQuery = "";
                window.gettysubscribe = false;
                window.sharedlist = false;
                window.searchboxshow = false;
                window.adnumber = 0;
                window.spotlightlist = false;
                window.dialMap = {};
                window.firstupdateplayers = true;
				window.dialLaunchSerial='none';
				window.replacesearchID="";
				window.searchtermindex='';
			
				window.blankview2up=false;

                function getCookie(c_name)
                {
                    var c_value = document.cookie;
                    var c_start = c_value.indexOf(" " + c_name + "=");
                    if (c_start == -1)
                    {
                        c_start = c_value.indexOf(c_name + "=");
                    }
                    if (c_start == -1)
                    {
                        c_value = null;
                    }
                    else
                    {
                        c_start = c_value.indexOf("=", c_start) + 1;
                        var c_end = c_value.indexOf(";", c_start);
                        if (c_end == -1)
                        {
                            c_end = c_value.length;
                        }
                        c_value = unescape(c_value.substring(c_start, c_end));
                    }
                    if (c_value == null)
                    {
                        try
                        {
                            c_value = Android.getCookie(c_name);
                        }
                        catch (err)
                        {}
                    }
                    return c_value;
                }

                function setCookie(c_name, value, exdays)
                {
                    var exdate = new Date();
                    exdate.setDate(exdate.getDate() + exdays);
                    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
                    document.cookie = c_name + "=" + c_value;
                    try
                    {
                        Android.setCookie(c_name, value);
                    }
                    catch (err)
                    {}
                }
                window.checkCookie = function()
                {
                    var email = getCookie("email");
                    var token = getCookie("token");
                    console.log("checkCookie " + email);
                    var I0 = registry.byId("IntroA");
                    //     alert ("Io= " + I0 + I0.selected);
                    var Iv = registry.byId("ImageView");
                    var splash = dojo.byId("splash");
                    var menx = registry.byId("Sharemenu2")
                    var opt = registry.byId("OptionsList");
                    //  alert("Imageview= "+ Iv + I0 +splash+menx+registry.byId("OptionsList")+registry.byId("AccountSettings")+registry.byId("iframeview")
                    // +registry.byId("Intro3")+registry.byId("Intro2")+registry.byId("Intro1")+registry.byId("blankview")+registry.byId("ImageView")
                    //  );
                    //    I0.startup();
                    //   alert ( "IntroA startup"); 
                    if (!window.blankview2up)
						I0.show();
                    Iv.startup();
                    //  alert ("try spash= " + splash+"Iv="+Iv);
                    //    splash.style.display = "none";
                    // 		splash.style.visibility = "hidden";
                    //    alert ("did splash");
                    //     alert ("imageview startup");
                    console.log("email1=" + email);
                    if (email != null && email != "" && email != "null" && token != null && token != "" && token != "null")
                    {
                        //        alert ("good to go");
                        //     alert("Welcome again " + email);
                        dojo.io.script.get(
                        {
                            url: base + "client/verifyUser?email=" + email + "&token=" + token,
                            callbackParamName: "callback",
                            timeout: 8000,
                            trytimes: 5,
                            error: function(error)
                            {
                                console.log("timeout!verifyUser" + url);
                                this.trytimes--;
                                if (this.trytimes > 0)
                                {
                                    dojo.io.script.get(this);
                                }
                                else
                                {
                                    alert("Network problem 1. Please check your connection and restart the app.");
                                }
                            },
                            load: function(result)
                            {
                                console.log("VerifyUserStatus=" + result["Status"]);
                                if (result["Status"] == "success")
                                {
                                    //  splash.style.display = "none";
                                          //  alert("we are here");
                                    //        var currView = dijit.registry.byId("IntroA");
                                    //        var mycurrView = currView.getShowingView();
                                    window.email = email;
                                    try
                                    {
                                        Android.setEmail(window.email);
                                    }
                                    catch (err)
                                    {}
                                    window.userID = result.userObj.id;
                                    window.isAdmin = result.userObj.isAdmin;
                                    calliOSFunction("setemail", [window.email], "onSuccess", "onError");
                                    window.token = token;
                                    Iv.selected = true;
                                    window.userName = result.userObj.name;
                                    //		alert("before iv show");
                                    window.firstdisplay = false;
                                    splash.style.display = "none";
                                    splash.style.visibility = "hidden";
									window.activeplayer = 'No TV Selected';
									if (window.blankview2up)
									{
										window.blankview2up=false;
										dojo.style("blankview2", "display", "none");
									
									}
									Iv.show();
                                    console.log("Iv show, calling afterLogin()");
                                    window.afterLogin();
                                    	//alert("showing imageview"+Iv);
                                    //  I0.performTransition("ImageView", 1, "slide", null);
                                    //   alert("transition done");
                                    //             var currView = registry.byId("IntroA");
                                    //        window.email = email;
                                    //         currView.performTransition("ImageView", 1, "slide", null);
                                }
                                else
                                {
                                    splash.style.display = "none";
                                }
                            }
                        });
                    }
                    else
                    {
                        //	alert("email="+email);
                        //	splash.style.display = "none";
                        //	alert("none");
                        splash.style.visibility = "hidden";
                        //	alert("hidden");
                        I0.show();
                        console.log("I0 show");
                    }
                }
                window.gotoView = function(fromView, toView)
                {
                    //alert(fromView+' to '+toView);
                    hidemenu();
					if(toView=="SearchView")
						dijit.registry.byId('SearchBox').show();
                    if (fromView == "ImageView" || fromView == "PlaylistView" || fromView == "select_category")
                        window.lastView = fromView;
                    if (toView == "Slideshow")
                    {
                        window.countplayers();
                        if (window.numberplayers == 0)
                        {
                            myalert("You have no connected TVs<br>Slideshow only works on connected TVs");
                            return;
                        }
                    }
                    if (toView == "AccountSettings")
                        dojo.byId("useraccount").innerHTML = "User: " + window.email;
                    if (toView == "select_player2")
                    {
                        if (window.firstupdateplayers)
                        {
                            window.firstupdateplayers = false;
                        }
						ScanNetworkComplete=false;
                        dialUpdate();
							dojo.byId("scanid").innerHTML="Scanning Local Network";
                        dijit.registry.byId("ScanNetwork").show();
						
						// after 10 seconds cancel the network search...
						window.showingScanNetwork=setTimeout(function()
						{
							dijit.registry.byId("ScanNetwork").hide();
							if (!ScanNetworkComplete)
								myalert("Having trouble scanning your local network, please try again");
							
						}, 10000);
                      //  updatePlayers();
                    }
                    window.currentView = toView;
                    dojo.style(dojo.byId(fromView), "display", "none");
                    dojo.style(dojo.byId(toView), "display", "block");
                }
                window.getDefaults = function()
                {
                    dojo.io.script.get(
                    {
                        url: base + "client/getDefault",
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 10,
                        error: function(error)
                        {
                            console.log("timeout!getDefault" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem2. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            if (result["Status"] == "success")
                            {
                                window.defImage = result["defaults"]["image"];
                                window.defList = result["defaults"]["viewlist"];
                                window.defCat = result["defaults"]["category"];
                                window.currImage = window.defImage;
                                window.currCat = window.defCat;
                                window.currList = window.defList;
                            }
                        }
                    });
                }
                window.syncImage = function()
                {
                    var url = base + "client/update2?imageID=" + window.currImage + "&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat + "&token=" + window.token;
                    for (var i in window.selectedPlayers)
                    {
                        if (window.selectedPlayers[i])
                        {
                            url += "&players[]=" + i;
                        }
                    }
                    // alert('syncimage '+url);
                    if (!window.guest)
                    {
                        dojo.io.script.get(
                        {
                            url: url,
                            callbackParamName: "callback",
                            load: function(result) {}
                        });
                    }
                }
                window.getartists = function()
                {
                    window.contemporary_artists = new ItemFileReadStore(
                    {
                        url: "artist.txt"
                    });
                    window.contemporary_artists.fetch();
                }

                window.loadImages=function(targImage, forward, numOfImg, include)
                {
                    var srcimage;
                    if (window.currList == null)
                    {
                        window.currList = window.defList;
                    }
                    //   alert(base + "getViewlist3?id=" + window.currList+"&email="+window.email+"&tarImage="+targImage+"&forward="+forward+"&numOfImg="+numOfImg+"&include=1");
                    //   alert("updating"+currList);
                    //   alert("switchview="+window.switchView);
                    //$("#viewlistbutton").html( "&#60; "+window.currCat);
					var catname=window.currCat;
					if (catname.length>12)
						catname=window.currCat.substr(0,9)+'...';
                    var str = '<img src="images/Arrows-Back-icon-blue.png" alt="" style="margin-top:5px;margin-left:5px"><span style="font-family:\'Open Sans\', sans-serif;font-weight: 400;position:relative;top:-7px;color:#00C7FF;">' + catname + "</span>"
                    console.log("cat str=" + str);
                    $("#viewlistbutton").html(str);
					
                    var url = base + "client/getViewlist5?id=" + window.currList + "&email=" + window.email + "&tarImage=" + targImage + "&forward=" + forward + "&numOfImg=" + numOfImg + "&include=1" + "&token=" + window.token;
                    if (window.currCat != " Top Lists")
                        url += "&catName=" + window.currCat;
                    console.log("getViewlist5:" + url);
					if (window.shuffle)
                    {
                        url += "&shuffle=1";
                    }
                    else
                    {
                        url += "&shuffle=0";
                    }
                    // check if we are looking at a personal getty viewlist and add the refresh/change search buttons
                   if (window.currCat.substr(0, 5) == "Getty") // show getty refresh icon
                    {
                        dojo.style("resetsearch", "display", "block");
						dojo.style("imagesearch", "display", "none");
			
                    }
                    else
                    {
                        dojo.style("resetsearch", "display", "none");
						dojo.style("imagesearch", "display", "block");
                    }

                    dojo.io.script.get(
                    {
                        url: url,
                        timeout: 8000,
                        trytimes: 5,
                        callbackParamName: "callback",
                        error: function(error)
                        {
                            console.log("timeout!" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem4. Please check your connection and restart the app.");
                            }
                        },
                        load: function(viewlist)
                        {
                            console.log("viewlist5 return:" + viewlist["Status"]);
                            //myalert("viewlist5 return:"+viewlist["Status"]);
                            if (viewlist["imageSet"].length == 0)
                            {
                                //window.currList = window.defList;
                                //  window.currCat = window.defCat;
                                //   window.currImage = window.defImage;
                                // updateImages(-1);
                                myalert("This viewlist is empty");
                                dojo.style(dojo.byId("blankview"), "display", "none");
                                gotoCategory('0');
                                return;
                            }
                            window.imageMap = {};
                            // get viewlist name
                            window.currViewList = viewlist["name"];
                            //    alert("currImage "+window.currImage);
                            //   alert("tarImage "+window.tarImage);
                            //    alert("category " +viewlist["name"]);
                            if (window.currImage == window.tarImage)
                            {
                                window.foundIndex = true;
                            }
                            window.isgettyviewlist = false;
                            console.log("looking at viewlist: " + currViewList);
                            if (viewlist["searchTerm"])
                            {
                                if (viewlist["searchTerm"]["getty_db"] == "getty")
                                {
                                    console.log("getty viewlist");
                                    window.isgettyviewlist = true;
                                }
                            }
                            else
                            {
                                console.log("not getty viewlist");
                            }
                            var imagecount = 0;
                            for (var i in viewlist["imageSet"])
                            {
                                imagecount++;
                                if (isgettyviewlist && !gettysubscribe && imagecount > 5)
                                {
                                    console.log("breaking loop with imagecount=" + imagecount);
                                    //break;
                                }
                                imageMap[viewlist["imageSet"][i]["id"]] = viewlist["imageSet"][i];
                                //alert(viewlist["imageSet"][i]["User Rating"]);
                                //      alert(viewlist["imageSet"][i]["Title"].replace(":","\:"));                            
                                srcimage = viewlist["imageSet"][i]["thumbnail"];
                                if (window.highresolution)
                                    srcimage = viewlist["imageSet"][i]["url"];
                                image = {
                                    "alt": viewlist["imageSet"][i]["id"],
                                    "src": srcimage,
                                };
                                window.imageCurrStore.newItem(image);
                                if (i == viewlist["imageSet"].length - 1)
                                {
                                    window.currStartImg = viewlist["imageSet"][0]["id"];
                                    window.absStartImg = viewlist["startImage"];
                                    window.currEndImg = viewlist["imageSet"][i]["id"];
                                    window.absEndImg = viewlist["endImage"];
                                    window.listSize = viewlist["imageNum"];
                                    if (forward == 0)
                                    { // go backward
                                        //alert(include==0);
                                        //alert(viewlist["images"].length>1);
                                        if (include == 0 && viewlist["imageSet"].length > 1)
                                        {
                                            window.currImage = viewlist["imageSet"][i - 1]["id"];
                                            window.sliderIndex = i - 1;
                                            window.currAbsIndex = viewlist["tarIndex"] - 1;
                                            window.prevImg = viewlist["imageSet"][1]["id"];
                                        }
                                        else
                                        {
                                            window.currImage = viewlist["imageSet"][i]["id"];
                                            window.sliderIndex = i;
                                            window.currAbsIndex = viewlist["tarIndex"];
                                            window.prevImg = viewlist["imageSet"][0]["id"];
                                        }
                                    }
                                    else
                                    {
                                        if (include == 0 && viewlist["imageSet"].length > 1)
                                        {
                                            window.currImage = viewlist["imageSet"][1]["id"];
                                            window.sliderIndex = 1;
                                            window.prevImg = viewlist["imageSet"][1]["id"];
                                            window.currAbsIndex = viewlist["tarIndex"] + 1;
                                        }
                                        else
                                        {
                                            if (viewlist["backward"] == "1")
                                            {
                                                window.currImage = viewlist["imageSet"][1]["id"];
                                                window.sliderIndex = 1;
                                                window.prevImg = viewlist["imageSet"][1]["id"];
                                                window.currAbsIndex = viewlist["tarIndex"];
                                            }
                                            else
                                            {
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
                            if ((!window.foundIndex) && (window.currImage != window.tarImage))
                            {
                                imagesList.currentView.goTo(1);
                            }
                            //
                            loadmetadata();
                            //		    dijit.registry.byId("ImageView").show();
                            if (window.bigImg)
                            {
                                bigimage();
                            }
                            else
                            {
                                smallimage();
                            }
                            //$('.mblCarouselSlot.mblCarouselItem').css('margin-right',"0%");
                            adjustSize();
                            if (window.switchView)
                            {
                                window.switchView = false;
                                setTimeout(function()
                                {
                                    var currView = dijit.registry.byId("blankview");
                                    var currView2 = currView.getShowingView();
                                    // alert("loadimages: view2="+currView2+"view="+currView);
                                    //currView2.performTransition("ImageView", 1, "fade", null);
                                    //if we had a shared viewlist go to the view directly
                                    // if this is either login or restart then we go to category view as default
                                    if (window.restart && !window.sharedlist && !window.spotlightlist)
                                    {
                                        window.restart = false;
                                        gotoView('blankview', 'select_category');
                                    }
                                    else
                                    {
                                        window.sharedlist = false;
                                        gotoView('blankview', 'ImageView');
                                    }
                                    //window.sliderIndex = 0;
                                    hidemenu();
                                    dijit.registry.byId("tabnowshowing").set('selected', true);
                                }, 50);
                                /*     if (window.firstdisplay) {
                                         setTimeout(function () {
                                             dijit.registry.byId('Swipehint').show()
                                         }, 200);
                                         setTimeout(function () {
                                             dijit.registry.byId('Swipehint').hide()
                                         }, 4000);
                                         window.firstdisplay = false;
                                     }*/
                            }
                        }
                    });
                }
                window.updateImages = function(targImage)
                {
                    //window.imageMap = {};
                    var imageData = {
                        "items": []
                    };
                    window.imageCurrStore = new ItemFileWriteStore(
                    {
                        data: imageData
                    });
                    if (window.justLogin || window.justRefresh)
                        window.restart = true;
                    //   alert("update images");
                    if (window.guest)
                    {
                        console.log("guest");
                        window.switchView = true;
					/*	dojo.style("gettyad", "display", "block");
						window.AdInterval = setInterval(changeAd, 5000);*/
                        dijit.registry.byId('shuffletab').set('label', "Shuffle");
                        gotoView("IntroA", "blankview");
                        loadImages(targImage, 1, 15, 1);
                        return;
                    }
                    if (window.justLogin || window.justRefresh)
                    {
                        //    alert("justlogin");
                        window.justRefresh = false;
                        dojo.io.script.get(
                        {
                            url: base + "client/getUserStatus?email=" + window.email + "&token=" + window.token,
                            callbackParamName: "callback",
                            timeout: 8000,
                            trytimes: 5,
                            error: function(error)
                            {
                                console.log("timeout!getUserStatus" + url);
                                this.trytimes--;
                                if (this.trytimes > 0)
                                {
                                    dojo.io.script.get(this);
                                }
                                else
                                {
                                    alert("Network problem5. Please check your connection and restart the app.");
                                }
                            },
                            load: function(result)
                            {
                                console.log("getUserStatus:" + result["Status"]);
                                if (result["Status"] == "success")
                                {
                                    window.tarImage = result["curr_image"];
                                    // alert("tar"+window.tarImage);
                                    window.currList = result["curr_list"];
                                    window.currCat = result["curr_cat"];
                                    window.gettysubscribe = result["subscribed"];
									window.adnumber = 0;
                                    /*if(!window.gettysubscribe)// get rid of the getty viewlists
										$("#Gettylists").css("display","none");*/
										
									// for testing we force gettysubscribe to be true right now!	
										window.gettysubscribe=true;
								//	if (!gettysubscribe)
								//	{
										
								//		dojo.style("gettyad", "display", "block");
								//		window.AdInterval = setInterval(changeAd, 5000);
								//	}
								//	else
								//		dojo.style("gettyad", "display", "none");
                                    window.temptarImage = result["curr_image"];
                                    // alert("tar"+window.tarImage);
                                    window.tempcurrList = result["curr_list"];
                                    window.tempcurrCat = result["curr_cat"];
                                    if (result['viewlist']) /* get the previous getty search results */
                                    {
                                        window.gname = result['viewlist']['name'];
                                        window.gimage = result['viewlist']['coverImage'];
                                    }
                                    else
                                    {
                                        window.gname = "No previous getty search";
                                        window.gimag = "images/blank.png";
                                    }
                                    if (result['gettyHistory'])
                                        window.previousgettysearch = result['gettyHistory'];
                                    else
                                        window.previousgettysearch = "";
                                    if (result['gettyLists'])
                                        window.gettylists = result['gettyLists'];
                                    else
                                        window.gettylists = "";
									if (result['searchLists'])
										window.searchlists = result ['searchLists'];
									else
										window.searchlists="";
                                    window.fill = (result["fill"] == "true");
                                    window.highresolution = (result["hires"] == "true");
                                    window.shuffle = (result["shuffle"] == "true");
                                    console.log("currList:" + window.currList + " currCat:" + window.currCat + " tarImage:" + window.tarImage);
                                    if (window.shuffle)
                                    {
                                        dijit.registry.byId('shuffletab').set('label', "Shuffle On");
                                        window.$("#myshuffle").addClass("mblTabBarButtonLabel2");
                                        //    dojo.byId('shuffletile').innerHTML = "Turn off shuffle";
                                        //       dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
                                    }
                                    else
                                    {
                                        //   dojo.byId('shuffletile').innerHTML = "Turn on shuffle";
                                        dijit.registry.byId('shuffletab').set('label', "Shuffle");
                                        $("#myshuffle").removeClass("mblTabBarButtonLabel2");
                                        //     dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');
                                    }
                                    //alert(window.fill);
                                    var switchValue = "off";
                                    if (window.fill)
                                    {
                                        switchValue = "on";
                                    }
                                    //dijit.byId("fillswitch").set("value", switchValue);               			
                                    dijit.byId("fillswitch").set("checked", window.fill);
                                    var fillsw = dijit.registry.byId("fillswitch");
                                    if (window.fill)
                                    {
                                        fillsw.set('label', "Active");
                                    }
                                    else
                                    {
                                        fillsw.set('label', "Not Active");
                                    }
                                    dijit.byId("hires-switch").set("checked", window.highresolution);
                                    var hrsw = dijit.registry.byId("hires-switch");
                                    if (window.highresolution)
                                    {
                                        hrsw.set('label', "Active");
                                    }
                                    else
                                    {
                                        hrsw.set('label', "Not Active");
                                    }
                                    // $("option#" + result["autoInterval"]).attr('selected', 'selected');
                                    $("#slideshowvalue").val(result["autoInterval"]);
                                    // check if we were passed paramaters on invoking and go to that image instead
                                    var curl = get('currList');
                                    var curi = get('currImage');
                                    var curc = get('currCat');
                                    //	alert("start, check currList="+curl+"image"+curi+"cat:"+curc);
                                    if (curl && curi && curc && window.checkforparameters)
                                    {
                                        //	alert ('overriding to new image');
                                        window.tarImage = curi;
                                        window.currList = curl;
                                        window.currCat = curc;
                                        window.checkforparameters = false;
                                        window.sharedlist = true;
                                        // try to save the view list
                                        dojo.io.script.get(
                                        {
                                            url: base + "user/saveAsMyViewlist?email=" + window.email + "&token=" + window.token + "&listId=" + curl,
                                            callbackParamName: "callback",
                                            load: function(result)
                                            {
                                                console.log(result['Message']);
                                                if (result['Message'] == "error, list doesn't exist!")
                                                {
                                                    window.tarImage = window.temptarImage;
                                                    window.currList = window.tempcurrList;
                                                    //alert(window.defList);
                                                    window.currCat = window.tempcurrCat;
                                                    console.log("non existent list");
                                                    myalert("Shared Viewlist no longer exists");
                                                    loadImages(window.tarImage, 1, 15, 1);
                                                }
                                                else
                                                {
                                                    // add a message that you subscribed to the viewlist and it is in myviewlists
                                                    usermessage(result['name'] + ' added to My Viewlists');
                                                    loadImages(window.tarImage, 1, 15, 1);
                                                }
                                            }
                                        });
                                    }
                                    else
                                        loadImages(window.tarImage, 1, 15, 1);
                                }
                                else
                                {
                                    window.tarImage = window.defImage;
                                    window.currList = window.defList;
                                    //alert(window.defList);
                                    window.currCat = window.defCat;
                                    loadImages(window.tarImage, 1, 15, 1);
                                }
                                //alert(window.currCat);
                                // updateLists(window.currCat);
                            }
                        });
                    }
                    else
                    {
						if(currCat.substr(0,5)=="Getty" && targImage==-1)
						{
							usermessage("Getting latest images");
							//reset the search term, call the right search to refresh the viewlist and then call loadImages itself
							updatecurrentsearch(lists[searchtermindex],targImage);
							// now wait for the search to complete
							//  alert('load images target:'+targImage);
						}
						else
							loadImages(targImage, 1, 15, 1);
                    }
                }

                function updateRemovePlayers()
                {
                    window.removePlayers = {};
                    var playerData = {
                        "items": []
                    };
                    var playerStore = new ItemFileWriteStore(
                    {
                        data: playerData
                    });
                    removePlayerList.setStore(null);
                    removePlayerList.setStore(playerStore);
                    //alert(base + "getPlayers?email="+window.email);
                    dojo.io.script.get(
                    {
                        url: base + "player/getPlayers?email=" + window.email + "&token=" + window.token,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!getplayers" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem7. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            var players = result["players"];
                            //alert("players:"+players.length);
                            for (var i in players)
                            {
                                playerStore.newItem(
                                {
                                    "label": players[i]["nickname"],
                                    "paccount": players[i]["account"],
                                    "onClick": function()
                                    {
                                        removePlayerClick(this.paccount)
                                    }
                                });
                                window.removePlayers[players[i]["account"]] = false;
                            }
                            var currView = dijit.registry.byId("select_player");
                            var currView2 = currView.getShowingView();
                            if (players.length == 0)
                            {
                                // myalert("You have no registered TVs");
                                // removePlayerView.hide();
                                //gotoView("removeplayer","OptionsList");
                                // window.currentView = "OptionsList";
                                //   currView2.performTransition("OptionsList", -1, "slide", null);
                                //gotoView("blankview","OptionsList");
                            }
                        }
                    });
                }

                function removePlayerClick(paccount)
                {
                    if (window.removePlayers[paccount])
                    {
                        window.removePlayers[paccount] = false;
                    }
                    else
                    {
                        window.removePlayers[paccount] = true;
                    }
                }

                function ownedPlayerClick(paccount)
                {
                    if (window.ownedPlayers[paccount])
                    {
                        window.ownedPlayers[paccount] = false;
                    }
                    else
                    {
                        window.ownedPlayers[paccount] = true;
                    }
                }

                function updateOwnedPlayers()
                {
                    window.ownedPlayers = {};
                    var playerData = {
                        "items": []
                    };
                    var playerStore = new ItemFileWriteStore(
                    {
                        data: playerData
                    });
                    ownedPlayerList.setStore(null);
                    ownedPlayerList.setStore(playerStore);
                    dojo.io.script.get(
                    {
                        url: base + "player/getOwnedPlayers?email=" + window.email + "&token=" + window.token,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!getOwnedPlayers" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem8. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            //alert( result["players"].length);
                            var players = result["players"];
                            for (var i in players)
                            {
                                playerStore.newItem(
                                {
                                    "label": players[i]["nickname"],
                                    "paccount": players[i]["account"],
                                    "onClick": function()
                                    {
                                        ownedPlayerClick(this.paccount)
                                    }
                                });
                                window.ownedPlayers[players[i]["account"]] = false;
                            }
                            var currView = dijit.registry.byId("select_player");
                            var currView2 = currView.getShowingView();
                            if (players.length == 0)
                            {
                                myalert("You have no registered TVs");
                                removePlayerView.hide();
                                currView2.performTransition("OptionsList", -1, "slide", null);
                                //gotoView("blankview","OptionsList");
                            }
                        }
                    });
                }
                window.goToViewlists = function()
                {
                    window.foundIndex = true;
                    window.justLogin = false;
                    window.currentView = "PlaylistView";
					if (window.currCat=="Getty Entertainment")
						dijit.registry.byId("PlaylistHeader").set("label", "Entertainment");
                    else if (window.currCat.length < 30)
                        dijit.registry.byId("PlaylistHeader").set("label", window.currCat);
                    else
                        dijit.registry.byId("PlaylistHeader").set("label", window.currCat.substring(0, 27) + "...");
                    //    dijit.registry.byId("PlaylistHeader").set("label", "Category:" + currCat);
                    hidemenu();
                    //alert("Transition in!");
                    if (window.currCat == null)
                    {
                        window.currCat = window.defCat;
                    }
                    
                    //  reset the scrollable view to the top
                    var c = dijit.byId("PlaylistView").containerNode;
                    dojo.setStyle(c,
                    {
                        webkitTransform: '',
						transform:'',
                        top: 10,
                        left: 0
                    });
					updateLists(window.currCat);
                }

                function updateCats()
                { // Get the Spotlight viewlists
                    window.currentView = "select_category";
                    if (window.loadcatview)
                    {
                        // catList.startup();
                        //	gotoView("select_category","MuseumlistView");
                        return; // already did this
                    }
                    window.loadcatview = true;
                    window.currentView = "select_category";
                  //  catList.destroyRecursive(true);
                    $("#catList").html('');
                    x = dojo.window.getBox();
                    dojo.io.script.get(
                    {
                        url: url = base + "content/getViewlistsByCategory2?catName=Spotlight" + "&featured=true",
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!getviewlists" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem9a. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            var lists = result["viewlists"];
                            for (var i in lists)
                            {
                                //console.log(lists[i]["coverImage"]);
                                var listcoverimage = "images/ARTKICKlogoFULLCOLOR-APP_50x50.png";
                                if (lists[i]["coverImage"])
                                    listcoverimage = lists[i]["coverImage"];
                                else
                                    listcoverimage = "";
                                var linelabel = '<img class="viewlistid" src="' + listcoverimage + '" alt="" height="60px" > ';
                                //	  alert(linelabel);
                                if (lists[i]["imageNum"])
                                {
                                    linelabel = linelabel + lists[i]["name"] + "<br><i><small>" + lists[i]["imageNum"] + " pictures</small></i></br>";
                                }
                                else
                                {
                                    linelabel = linelabel + lists[i]["name"];
                                }
                                //console.log("label:"+linelabel+"lists:"+lists[i]["id"]);
                                // create new version of viewlist with images
                                var firstName = lists[i]["name"].split(' ').slice(0, -1).join(' ');
                                var lastName = lists[i]["name"].split(' ').slice(-1).join(' ');
                                var title = lists[i]["name"];
                                var linename = lists[i]["name"];
                                var newdiv2 = dojo.create("div",
                                {}, "catList");
                                domAttr.set(newdiv2, "class", "categoryclass2");
                                //	console.log("newdiv2 "+ newdiv2);
                                var newimg2 = dojo.create("img",
                                {
                                    id: lists[i]["id"],
                                    src: listcoverimage,
                                    onclick: function()
                                    {
                                        // alert(this.id);
                                        window.moregridpages = false;
                                        var currView = dijit.registry.byId("ImageView");
                                        var currView2 = currView.getShowingView();
                                        window.currCat = 'Home';
                                        //alert("currView2="+currView2);
                                        //currView2.performTransition("blankview", 1, "", null);
                                        gotoView('select_category', 'blankview');
                                        window.currList = this.id;
                                        window.switchView = true;
                                        window.restart = false;
                                        window.spotlightlist = true;
                                        updateImages(-1);
                                    },
                                    margin: "0px"
									
                                }, newdiv2);
                                var newtxt = dojo.create("div",
                                {
                                    innerHTML: title
                                }, newdiv2);
								imgsize=Math.min((x.w / 3)-5,275);
                                domAttr.set(newtxt, "class", "imagetxt");
								domAttr.set(newimg2,"class", "featuredclass");
                             //   domStyle.set(newimg2, "width", imgsize + 'px');
                                //  domStyle.set(newdiv2, "width", x.w/3 + 'px');
                            //    domStyle.set(newimg2, "height", imgsize + 'px');
								  //  $('.featuredclass').css('width', imgsize + "px");
								  //  $('.featuredclass').css('height', imgsize + "px");

                            }
                        }
                    });
                }
                
                window.updateLists = function(catName)
                {

                    var colnumber, w, x;
                    colnumber = 2; // default number of columns
                    x = dojo.window.getBox();
                    if (x.w > 500)
                        colnumber = 3;
                    if (x.w > 700)
                        colnumber = 4;
                    imagewidth = Math.floor((x.w - 30) / colnumber); //width of the image box leaving a 5 px margin on each side and 2 px inbetween
                    console.log("size=" + imagewidth + " dojo=" + x.w);
                    imageheight = imagewidth;

                    if (catName == "My Viewlists")
                    {
                        //dojo.byId('showeditmyviewlists').show();
						dojo.style("showeditmyviewlists", "display", "block");
                        url = base + "user/getMyViewlists?email=" + window.email + "&token=" + window.token;
                    }
					else if (catName.substr(0,5)=="Getty")
					{
						window.gettydomain=catName.substr(6).toLowerCase();
						dojo.style("showeditmyviewlists", "display", "block");
						url = base + "user/getMyViewlists?email=" + window.email + "&token=" + window.token + "&category=" +gettydomain;
					}
					else if (catName =="My Searches")
					{
						url = base + "user/getMyViewlists?email=" + window.email + "&token=" + window.token + "&category=artkick";
					}
                    else
                    {
                        url = base + "content/getViewlistsByCategory2?catName=" + catName + "&featured=true";
						dojo.style("showeditmyviewlists", "display", "none");
                        //dojo.byId('showeditmyviewlists').hide();
                    }
                    //	alert("catname="+catName);
                    //     listList.destroyRecursive(true);
                    //   $("#listList").html('');
				
                    listList2.destroyRecursive(true);
                    $("#listList2").html('');
                    window.MyViewlist.destroyDescendants();
                    //dojo.empty(listList2);
                    standby.show();
                    dojo.io.script.get(
                    {
                        url: url,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!getviewlists" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem9. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            window.lists = result["viewlists"];
							if (window.lists.length==0)
							{
								// there are no viewlists here
								myalert("There are no viewlists in "+catName+". Tap the search icon <img src='images/search-icon-blue2.png'> to create one.");
								//gotoView(currentView,"select_category");
								
							}
                            //  put user's tops lists first in the list
                            if (catName == "My Viewlists")
                            {
                                //alert("Top Lists");
                                // add My Starred Images to My viewlists manually
                                // create new version of viewlist with images
                                //	var newdiv2 = dojo.create("div",{class:"imagediv"},"listList2");
                                var newdiv2 = dojo.create("div",
                                {}, "listList2");
                                domAttr.set(newdiv2, "class", "imagediv");
                                //	console.log("newdiv2 "+ newdiv2);
                                var newimg2 = dojo.create("img",
                                {
                                    id: "top_" + window.email,
                                    src: "images/Star-shaped_designs_on_crostata.jpg",
                                    onclick: function()
                                    {
                                        // alert(this.id);
                                        window.moregridpages = false;
                                        gotoView('PlaylistView', 'blankview');
                                        window.currList = this.id;
                                        window.switchView = true;
                                        updateImages(-1);
                                    },
                                    margin: "0px"
                                }, newdiv2);
                                var newtxt = dojo.create("div",
                                {
                                    innerHTML: "My Likes"
                                }, newdiv2);
                                domAttr.set(newtxt, "class", "imagetxt");
                                domStyle.set(newimg2, "width", imagewidth + 'px');
                                domStyle.set(newdiv2, "width", imagewidth + 'px');
                                domStyle.set(newimg2, "height", imageheight + 'px');
                                domStyle.set(newdiv2, "height", imageheight + 45 + 'px');
                            }
                            else if (catName == "My Searchesxxx")
                            {
                                console.log("getty images viewlists");
                                /* get the name of last getty search */
                                //	getgettyresults();
                                //console.log("name:"+window.gname+ "img: "+window.gimage);
                                // now for each personal getty list we create the icon for it var lix = dojo.create("div",
                            	if(gettysubscribe)
								{
									dojo.create('div',
									{
										innerHTML: "Recent Getty Searches",
										className: 'wificlass',
										id: "devicescanx"
									}, "listList2");
									window.lastgettylist = window.gettylists.length; // keep track of last getty list
									for (var i in window.gettylists)
									{
										//console.log("getty:" + gettylists[i]['id']);
										var newdiv2 = dojo.create("div",
										{}, "listList2");
										domAttr.set(newdiv2, "class", "imagediv");
										domStyle.set(newdiv2, "width", imagewidth + 'px');
										domStyle.set(newdiv2, "height", imagewidth + 25 + 'px');
										//	console.log("newdiv2 "+ newdiv2);
										var newimg2 = dojo.create("img",
										{
											id: gettylists[i]['id'],
											src: gettylists[i]['coverImage'],
											onclick: function()
											{
												// alert(this.id);
												window.moregridpages = false;
												gotoView('PlaylistView', 'blankview');
												window.currList = this.id;
												window.switchView = true;
												updateImages(-1);
											},
											margin: "0px"
										}, newdiv2);
										domStyle.set(newimg2, "height", imageheight + 'px');
										domStyle.set(newimg2, "width", imagewidth + 'px');
										var newtxt = dojo.create("div",
										{
											innerHTML: gettylists[i]['name']
										}, newdiv2);
										domAttr.set(newtxt, "class", "imagetxt");
										var newimg3 = dojo.create("img",
										{
											src: "images/GettyImages.png"
										}, newdiv2);
										domAttr.set(newimg3, "class", "imagetxt2");
										domStyle.set(newimg3, "class", "imagetxt2");
										domStyle.set(newimg3, "width", imagewidth / 2 + 'px');
										domStyle.set(newdiv2, "height", imageheight + 45 + 'px');
									}
								}
								dojo.create('div',
								{
									innerHTML: "Recent Searches",
									className: 'wificlass2',
									id: "devicescany"
								}, "listList2");

								window.lastsearchlist = window.searchlists.length; // keep track of last search list
                                for (var i in window.searchlists)
                                {
                                  //  console.log("search:" + searchlists[i]['id']);
                                    var newdiv2 = dojo.create("div",
                                    {}, "listList2");
                                    domAttr.set(newdiv2, "class", "imagediv");
                                    domStyle.set(newdiv2, "width", imagewidth + 'px');
                                    domStyle.set(newdiv2, "height", imagewidth + 25 + 'px');
                                    //	console.log("newdiv2 "+ newdiv2);
                                    var newimg2 = dojo.create("img",
                                    {
                                        id: searchlists[i]['id'],
                                        src: searchlists[i]['coverImage'],
                                        onclick: function()
                                        {
                                            // alert(this.id);
                                            window.moregridpages = false;
                                            gotoView('PlaylistView', 'blankview');
                                            window.currList = this.id;
                                            window.switchView = true;
                                            updateImages(-1);
                                        },
                                        margin: "0px"
                                    }, newdiv2);
                                    domStyle.set(newimg2, "height", imageheight + 'px');
                                    domStyle.set(newimg2, "width", imagewidth + 'px');
                                    var newtxt = dojo.create("div",
                                    {
                                        innerHTML: searchlists[i]['name']
                                    }, newdiv2);
                                    domAttr.set(newtxt, "class", "imagetxt");

                                    domStyle.set(newdiv2, "height", imageheight + 45 + 'px');
                                }

                                
                            }

                            else if(catName!="My Searches" && catName.substr(0,5)!="Getty")
                            { /* for all other categories we manually add a Most Popular list */
                                //alert("Top Lists");
                                // add Top Liked to every Category manually
                                // create new version of viewlist with images
                                //	var newdiv2 = dojo.create("div",{class:"imagediv"},"listList2");
                                var newdiv2 = dojo.create("div",
                                {}, "listList2");
                                domAttr.set(newdiv2, "class", "imagediv");
                                //	console.log("newdiv2 "+ newdiv2);
                                var newlabel = "Most Popular";
                                if (catName == " Top Lists")
                                    newlabel = "Most Popular Across Artkick";
                                var newimg2 = dojo.create("img",
                                {
                                    id: "topLiked_" + catName + window.email,
                                    src: "images/Topliked/" + catName.trim() + ".jpg",
                                    onclick: function()
                                    {
                                        // alert(this.id);
                                        window.moregridpages = false;
                                        gotoView('PlaylistView', 'blankview');
                                        window.currList = this.id;
                                        window.switchView = true;
                                        updateImages(-1);
                                    },
                                    margin: "0px"
                                }, newdiv2);
                                var newtxt = dojo.create("div",
                                {
                                    innerHTML: newlabel
                                }, newdiv2);
                                domAttr.set(newtxt, "class", "imagetxt");
                                domStyle.set(newimg2, "width", imagewidth + 'px');
                                domStyle.set(newdiv2, "width", imagewidth + 'px');
                                domStyle.set(newimg2, "height", imageheight + 'px');
                                domStyle.set(newdiv2, "height", imageheight + 45 + 'px');
                            }
                            //  alert("load up the lists count:"+lists.length);
                            for (var i in lists)
                            {
                                //alert(lists[i]["coverImage"]);
							//	window.searchterm=lists[i]["searchTerm"];
                                var listcoverimage = "images/ARTKICKlogoFULLCOLOR-APP_50x50.png";
                                if (lists[i]["coverImage"])
                                    listcoverimage = lists[i]["coverImage"];
                                else
                                    listcoverimage = "";
                                var linelabel = '<img class="viewlistid" src="' + listcoverimage + '" alt="" height="60px" > ';
                                //	  alert(linelabel);
                                if (lists[i]["imageNum"])
                                {
                                    linelabel = linelabel + lists[i]["name"] + "<br><i><small>" + lists[i]["imageNum"] + " pictures</small></i></br>";
                                }
                                else if (catName == "My Viewlists" && lists[i]["private_user"] != window.email)
                                {
                                    linelabel = linelabel + lists[i]["name"] + "<br><i><small>following</small></i></br>";
                                }
                                else
                                {
                                    linelabel = linelabel + lists[i]["name"];
                                }
                                //console.log("label:"+linelabel+"lists:"+lists[i]["id"]);
                                // create new version of viewlist with images
                                var firstName = lists[i]["name"].split(' ').slice(0, -1).join(' ');
                                var lastName = lists[i]["name"].split(' ').slice(-1).join(' ');
                                var title = lists[i]["name"];
                                var linename = lists[i]["name"];
                                if (catName == "Artists")
                                {
                                    //check the special names
                                    /*		if (lastName=="Gogh")
									{
										firstName="Vincent";
										lastName="van Gogh";
									}*/
                                    if (lastName == "Elder")
                                    {
                                        firstName = "Pieter";
                                        lastName = "Brueghel the Elder";
                                    }
                                    if (lastName == "Younger")
                                    {
                                        firstName = "Pieter";
                                        lastName = "Brueghel the Younger";
                                    }
                                    linename = "<i><small>" + firstName + " </small></i><bold>" + lastName + "</bold>";
                                }
                                if (lists[i]["imageNum"])
                                    var title = linename + "<br><i><small>" + lists[i]["imageNum"] + " pictures</small></i>";
                                if (catName == "My Viewlists" && lists[i]["private_user"] != window.email)
                                    var title = lists[i]["name"] + "<br><i><small>by " + lists[i]["private_name"] + "</small></i></br>";
                                var newdiv2 = dojo.create("div",
                                {}, "listList2");
                                domAttr.set(newdiv2, "class", "imagediv");
                                //	console.log("newdiv2 "+ newdiv2);
                                var newimg2 = dojo.create("img",
                                {
                                    id: lists[i]["id"],
									alt: i,
                                    src: listcoverimage,
                                    onclick: function()
                                    {
                                        // alert(this.id);
                                        window.moregridpages = false;
                                        var currView = dijit.registry.byId("ImageView");
                                        var currView2 = currView.getShowingView();
                                        //	alert("currView2="+currView2);
                                        //currView2.performTransition("blankview", 1, "", null);
										window.searchtermindex=this.alt;
                                        gotoView('PlaylistView', 'blankview');
                                        window.currList = this.id;
                                        window.switchView = true;
                                        updateImages(-1);
                                    },
                                    margin: "0px"
                                }, newdiv2);
                                var newtxt = dojo.create("div",
                                {
                                    innerHTML: title
                                }, newdiv2);
                                //var newtxt = dojo.create("div", {class:"imagetxt",innerHTML: title},newdiv2);
                                domAttr.set(newtxt, "class", "imagetxt");
                                domStyle.set(newimg2, "width", imagewidth + 'px');
                                domStyle.set(newdiv2, "width", imagewidth + 'px');
                                domStyle.set(newimg2, "height", imageheight + 'px');
                                domStyle.set(newdiv2, "height", imageheight + 45 + 'px');
                                // check if this is a photos.com or gettyimages viewlista and add the right overlay
                                if (lists[i]["searchTerm"]&&lists[i]["searchTerm"]["EditorialSegments"])
                                {
                                   
                                    overlay = "images/GettyImages.png";
                                    var newimg3 = dojo.create("img",
                                    {
                                        src: overlay
                                    }, newdiv2);
                                    domAttr.set(newimg3, "class", "imagetxt2");
                                    domStyle.set(newimg3, "class", "imagetxt2");
                                    domStyle.set(newimg3, "width", imagewidth / 2 + 'px');
                                    domStyle.set(newdiv2, "height", imageheight + 45 + 'px'); // force containing div to be same height as others because the logo forces it to be too big
                                }
                            }
                            standby.hide();
                        }
                    });
                    gotoView("select_category", "PlaylistView");
                }

                function updateArtistLists()
                {
                    if (window.loadartistview)
                    {
                        artistList.startup();
                        gotoView("select_category", "ArtistlistView");
                        artistList.startup();
                        return; // already did this
                    }
                    window.loadartistview = true;
                    url = base + "content/getViewlistsByCategory2?catName=Artists&featured=true";
                    //	alert("updateArtlistLists");
                    loadlists(url, artistList);
                }

                function updateMuseumLists()
                {
                    if (window.loadmuseumview)
                    {
                        museumList.startup();
                        gotoView("select_category", "MuseumlistView");
                        return; // already did this
                    }
                    window.loadmuseumview = true;
                    url = base + "content/getViewlistsByCategory2?catName=Museums&featured=true";
                    //	alert("updateMuseumLists");
                    loadlists(url, museumList);
                }

                function loadlists(url, listname)
                {
                    bigload = true;
                    gotoView("select_category", "blankview");
                    dojo.io.script.get(
                    {
                        url: url,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!loadlists" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem10. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            var lists = result["viewlists"];
                            //   alert("load up the lists count:"+lists.length+"listname="+listname);
                            for (var i in lists)
                            {
                                //alert(lists[i]["coverImage"]);
                                var listcoverimage = "images/ARTKICKlogoFULLCOLOR-APP_50x50.png";
                                if (lists[i]["coverImage"])
                                    listcoverimage = lists[i]["coverImage"];
                                else
                                    listcoverimage = "";
                                var firstName = lists[i]["name"].split(' ').slice(0, -1).join(' ');
                                var lastName = lists[i]["name"].split(' ').slice(-1).join(' ');
                                var linelabel = '<img class="viewlistid" src="' + listcoverimage + '" alt="" height="60px" > ';
                                var imagecount = "??"
                                if (lists[i]["imageNum"])
                                    imagecount = lists[i]["imageNum"];
                                var nowview = 'ArtistlistView';
                                var linename = lists[i]["name"];
                                /*	if (listname == museumList)
							nowview = 'MuseumlistView';*/
                                if (listname == artistList)
                                {
                                    linename = "<i><small>" + firstName + " </small></i><big>" + lastName + "</big>";
                                }
                                //	alert(nowview);
                                //	  alert(linelabel);
                                linelabel = linelabel + linename + "<br><i><small>" + imagecount + " pictures</small></i></br>";
                                //alert("label:"+linelabel+"lists:"+lists[i]["id"]);
                                var newList = new dojox.mobile.ListItem(
                                {
                                    id2: lists[i]["id"],
                                    label: linelabel,
                                    rightIcon: "mblDomButtonArrow",
                                    variableHeight: true,
                                    clickable: true,
                                    onClick: function()
                                    {
                                        gotoView(nowview, 'blankview');
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
                            console.log("done loading artists last label:" + lists[i]["name"]);
                            if (currCat == "Artists")
                                gotoView("blankview", "ArtistlistView");
                            else if (currCat == "Museums")
                                gotoView("blankview", "MuseumlistView");
                            bigload = false;
                        }
                    });
                }
                window.rememberSelectPlayers = function(update)
                {
                    //alert("remembering");
                    var url = base + "client/selectPlayers?email=" + window.email + "&token=" + window.token;
                    var count = 0;
                    for (var i in window.selectedPlayers)
                    {
                        //alert(playerSet[player]);
                        if (window.selectedPlayers[i])
                        {
                            url += "&players[]=" + i;
                            count++;
                        }
                    }
                    if (count == 0)
                    {
                        url += "&players[]=";
                    }
                    // alert('remembering :'+url);
                    //alert(url);
                    //    console.log(url);
                    dojo.io.script.get(
                    {
                        url: url,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!SelectPlayers" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem11. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                           if (update) updatePlayers();
                        }
                    });
                }


                window.loadmetadata=function()
                {
                    var metaPlane1 = dojo.byId("MediumDateSize");
                    var metaPlane2 = dojo.byId("ArtLocation");
                    var metaPlane3 = dojo.byId("viewtableline1"); // title
                    var metaPlane4 = dojo.byId("viewtableline2"); // artist
                    var metaPlane5 = dojo.byId("viewtableline3"); // imagesize
                    var metaPlane6 = dojo.byId("viewtableline4"); // location
                    var metaPlane7 = dojo.byId("viewtableline5"); // genre
                    var metaPlane8 = dojo.byId("viewtableline6"); // user rating
                    var metaPlane9 = dojo.byId("viewtableline7"); // other viewlists
                    var metaPlane10 = dojo.byId("viewtableline8");
                    var artist = "";
                    var title = "";
                    var imagesize = "";
                    var genre = "";
                    var ratingvalue = 0;
                    var viewlists = "";
                    var vlname = "";
                    var vlnumber = "";
                    var icon = "";
                    disp = "";
                       //  console.log("Loadmetadata activeplayers:"+Object.keys(selectedPlayers).length);
                    title = "No Title";
                    icon = window.imageMap[window.currImage]["thumbnail"];
                    if (imageMap[currImage]["Title"])
                        title = imageMap[currImage]["Title"].replace("'", "", "");
                    if (imageMap[currImage]["Artist First N"])
                        artist = imageMap[currImage]["Artist First N"] + " ";
                    if (imageMap[currImage]["Artist Last N"])
                        artist = artist + imageMap[currImage]["Artist Last N"];
                    if (window.imageMap[window.currImage]["icon"])
                        icon = window.imageMap[window.currImage]["icon"];
                    disp = "<b>" + title + "</b><br>" + artist;
                    // load the image and title for the bottom header for category and viewlist view
                    document.getElementById("showingsrc").setAttribute("src", icon);
                    document.getElementById("showingsrc2").setAttribute("src", icon);
                    var activeplayers = Object.keys(selectedPlayers).length;
                    if (title.length + artist.length < (window.innerWidth) / 7)
                        disp = "<b>" + title + "</b>-" + artist;
                    else
                        disp = "<b>" + title.substring(0, (window.innerWidth / 7) - 5) + "..." + "</b>-" + artist;
                    if (activeplayers > 1)
                    {
                        var morep = activeplayers - 1;
                        disp2 = window.activeplayer + " +" + morep + " others<br>" + disp;
                    }
                    else
                    {
                        disp2 = window.activeplayer + "<br>" + disp;
                    }
                    dojo.byId("showingtitle").innerHTML = disp2;
                    dojo.byId("showingtitle2").innerHTML = disp2;
                    var listname = window.currViewList;
                    if (listname == "Most liked")
                    {
                        listname = "Most Popular";
                        if (window.currCat == " Top Lists")
                            listname = "Most Popular Across Artkick";
                        else
                            listname = "Most Popular in " + window.currCat;
                    }
                    else
                    if (listname == "My Top Rated")
                        listname = "My Likes"
					dojo.byId('imageListName').innerHTML=listname;
                   
                     dijit.registry.byId("ImageViewHeader").set("label",  window.currAbsIndex + "/" + window.listSize);
                   
						
					   if (runInWebview)
						{

							$(".shareSpan").css({display:'none'})
							$(".shareImg").css({display:'none'})
						}
                }
                window.updatePlayers2 = function()
                {
                    console.log("update players2");
                    //	dialsearch(); //this is called from the IOS/android app
                    // first time through throw up window which says scanning network for connected displays
                    thisurl = base + "player/getPlayers?email=" + window.email + "&token=" + window.token;
                    dojo.io.script.get(
                    {
                        url: thisurl,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!Getplayers  " + thisurl);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem12. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            var curr = new Date().getTime();
                            var newPlayerSet = {};
                            window.activeplayer = 'No TV Selected';
                            playerList2.destroyDescendants();
                            playerList2.destroyRecursive(true);
                            $("#playerList2").html('');
                            window.playerlist = result["players"];
                            window.numberplayers = result["players"].length;
                            for (var i in dialMap)
                                checkDial(i);
                            var lix = dojo.create("div",
                            {
                                innerHTML: result["players"].length + " Devices connected to Artkick",
                                className: 'wificlass',
                                id: "devicescan"
                            }, "playerList2");
                            for (var i in result["players"])
                            {
                                var player = result["players"][i];
                       
                                if (player["account"] in selectedPlayers)
                                {
                                    console.log(player["account"] + "in");
                                    xclass = 'images/CheckMark25x25.png';
                                    window.playerSet["s" + player["account"]] = true;
                                    window.activeplayer = player["nickname"];
                                }
                                else
                                {
                                    console.log(player["account"] + "out");
                                    xclass = 'images/CheckBox25x25.png';
                                    window.playerSet["s" + player["account"]] = false;
                                }
                                var image = player["curr_image"]["thumbnail"];
								if (player['curr_image']['icon'])
									image=player["curr_image"]["icon"];
                                if (player['online'] == false)
                                {
									player['state']="stopped";
                                    playerlist[i]['state'] = "stopped";
                                }
                                if ((player['state'] == "stopped"||player['state']=="unknown") && player['uuid']&&player['uuid']!='unknown')
                                {
                                    if (window.platform == "Android")
                                        image = 'images/cast_off.png';
                                    else
                                        image = "images/airplay.png";
                                    // if player is stopped also uncheck it
                                    xclass = 'images/CheckBox25x25.png';
                                    //    window.playerSet["s" + player["account"]] = false;
                                    if (player["account"] in selectedPlayers)
                                    {
                                        delete selectedPlayers[player["account"]];
                                        //window.playerSet["s" + player["account"]] = false;
                                    }
                                }
								if(!player['autoInterval'])
									player['autoInterval']=0;
                                var li = dojo.create("div",
                                {
                                    id: "s" + player["account"],
                                }, "playerList2");
                                domAttr.set(li, "class", "mblListItem2");
                                //	dojo.style(li,"height","55px");
                                var xli = dojo.create("span",
                                {
                                    classname: 'iconsright'
                                }, li);
                                var ico = dojo.create("img",
                                {
                                    id: "img" + player["account"],
                                    className: 'iconclass',
                                    zindex: 950,
                                    src: image,
                                    onclick: function()
                                    {
                                        changeplayerstatus(this.id);
                                    },
                                }, xli);
                                var ico = dojo.create("img",
                                {
                                    id: "sd" + i,
                                    className: 'playerdetailclass',
                                    zindex: 950,
                                    src: "images/settings-icon25x25.png",
                                    onclick: function()
                                    {
                                        playerDetail(this.id);
                                    }
                                }, xli);
                                var ckbox = dojo.create("img",
                                {
                                    src: xclass,
                                    className: 'checkboxclass',
                                    id: "icon" + player["account"],
                                    onclick: function()
                                    {
                                        playerClick(this.id);
                                    }
                                }, li);
                                var nam = dojo.create("span",
                                {
                                    id: "ptitle" + player["account"],
                                    className: 'playertitleclass2',
                                    innerHTML: player["nickname"],
                                }, li);
                           /*     slideshow=dojo.create("div",
                                {
                                    className: 'mybclass2',
									id: 'zd'+i,
                                    innerHTML: 'Slideshow: ' + showAutoplay(player["autoInterval"].toString()),
									
									onclick: function()
									{
										playerDetail(this.id);
									}
                                }, li);
								dojo.style(slideshow,'width','145px');*/
								selectauto=dojo.create("select",
								{
									id:'qd'+i,
									onchange: function()
									{
										setAuto2(this.value,this.id);
									},
									className: 'myselect'
							
								},li);
								dojo.create("option",
								{
									value:'0',
									label:'Off'
								},selectauto);
								dojo.create("option",
								{
									value:'-1',
									label:'Every Morning'
								},selectauto);
								dojo.create("option",
								{
									value:'30000',
									label:'Every 30 Seconds'
								},selectauto);
								dojo.create("option",
								{
									value:'60000',
									label:'Every Minute'
								},selectauto);
								dojo.create("option",
								{
									value:'120000',
									label:'Every 2 Minutes'
								},selectauto);
								dojo.create("option",
								{
									value:'300000',
									label:'Every 5 Minutes'
								},selectauto);
								dojo.create("option",
								{
									value:'600000',
									label:'Every 10 Minutes'
								},selectauto);
								dojo.create("option",
								{
									value:'1800000',
									label:'Every 30 Minutes'
								},selectauto);
								dojo.create("option",
								{
									value:'3600000',
									label:'Every Hour'
								},selectauto);
								dojo.create("option",
								{
									value:'43200000',
									label:'Every 12 Hours'
								},selectauto);
								$(selectauto).val(player["autoInterval"]);
								
                            }
                            // now create entries for the dial discovered devices which are not already in players
                            var lix2 = dojo.create("div",
                            {
                                innerHTML: "No unconnected devices",
                                className: 'wificlass',
                                id: "wifiscan"
                            }, "playerList2");
                            var whichlist;
                            //alert("dialmap length="+dialMap.length);
                            newdevicecnt = 0;
                            for (var i in dialMap)
                            {
                                //alert("checking dialMap with i="+i);
                                //console.log("i= "+i);
                                //console.log("TV: "+dialMap[i]["friendlyName"]);
                                //check if it is already registered
                                var tvexist = checkDial(i);
                                //console.log("checkDial for :"+i+" returned:"+tvexist);
                                if (!tvexist)
                                {
                                    iconsrc = 'images/ConnectButton.png';
                                    // check if this is a 'cast' device
                                    if (dialMap[i]['modelName'])
                                    {
                                        var lix = dojo.create("div",
                                        {}, "playerList2");
                                        domAttr.set(lix, "class", "mblListItem2");
                                        //	dojo.style(lix,"height","55px");
                                        if (dialMap[i]['modelName'] == "Eureka Dongle" || dialMap[i]['modelName'] == "Chromecast" || dialMap[i]['modelName'] == "Apple TV"||(dialMap[i]['modelName']=="FireTV" && dialMap[i]["state"]!="unknown"))
                                        {
                                            if (window.platform == "Android")
                                                iconsrc = 'images/cast_off.png';
                                            else
                                                iconsrc = "images/airplay.png";
                                            var ico = dojo.create("img",
                                            {
                                                id: "dialx" + i,
                                                className: 'iconclass3',
                                                zindex: 950,
                                                src: iconsrc,
                                                onclick: function()
                                                {
                                                    playerInstall(this.id);
                                                }
                                            }, lix);
                                        }
                                        else // not a directly castable device use a connect device button instead
                                        {

                                            var ico = dojo.create("span",
                                            {
                                                id: "dialx" + i,
                                                className: 'mybuttonclass',
                                                zindex: 950,
                                                innerHTML: "Connect",
                                                onclick: function()
                                                {
                                                    playerInstall(this.id);
                                                }
                                            }, lix);
                                        }
                                    }
                                    var nam = dojo.create("span",
                                    {
                                        id: "dial" + i,
                                        className: 'playertitleclass2',
                                        innerHTML: dialMap[i]["friendlyName"],
                                    }, lix);
                                    newdevicecnt++;
                                }
                                //	}
                                //else
                                //console.log("tvexist was false for :"+dialMap[i]["friendlyName"]);
                            }
                            dojo.byId("wifiscan").innerHTML = "Discovered " + newdevicecnt + " unconnected devices";
                            dojo.create("div",
                            {
                                innerHTML: "Other devices",
                                className: 'wificlass'
                            }, "playerList2");
                            var lix = dojo.create("div",
                            {
                                innerHTML: "<big><big><big>&nbsp;&nbsp;+&nbsp;&nbsp;</big></big></big>",
                                className: 'mblListItem2',
                                onclick: function()
                                {
                                    playerInstall('unknown');
                                }
                            }, "playerList2");
                            dojo.create("span",
                            {
                                innerHTML: "Add Device Manually",
                                className: 'adddevice'
                            }, lix);
                            //syncImage();
                            if (window.justLogin)
                            {
                                window.justLogin = false;
                                return;
                            }
                            // check if there are selected players which are not in the playerlist and remove from selectedplayers
                            // this happens when someone else takes over a player which user has selected
                            for (var i in selectedPlayers)
                            {
                                found = false;
                                for (var x in playerlist)
                                {
                                    if (i == playerlist[x]['account'])
                                        found = true;
                                }
                                if (!found)
                                {
                                    console.log("didn't find player: " + i);
                                    delete selectedPlayers[i];
                                }
                            }
                            window.activeplayer = "No active TV";
                            for (var i in result["players"])
                            {
                                var player = result["players"][i];
                                // alert(curr-player["last_visit"]);
                                if (curr - player["last_visit"] < 7000 || player["online"])
                                {
                                    var status = "images/greenbutton.png";
                                }
                                else
                                {
                                    var status = "images/graybutton.png";
                                }
                                // find a still active player
                                if (player["account"] in selectedPlayers)
                                {
                                    window.activeplayer = player["nickname"];
                                    //console.log("player: "+player["account"]+" active");
                                }
                                else
                                {
                                    //console.log("player: "+player["account"]);
                                }
                                newPlayerSet["s" + player["account"]] = 1;
                                //	console.log("newps:"+"s" + player["account"]);
                                var li = dojo.byId("s" + player["account"]);
                                //   console.log("li="+li);
                                // always check if there is only 1 player, force it to be selected
                                // always check if there is only 1 player, force it to be selected
                                if (window.numberplayers == 1)
                                {
                                    selectedPlayers[playerlist[0]['account']] = 1;
									rememberSelectPlayers(false);
                                }
                               
                                if (window.justCreatePlayer)
                                {
                                    if (!window.autoIntro)
                                    {
                                        //alert("auto disabled!");
                                        return;
                                    }
                                    //  alert("justPlayer");
                                    rememberSelectPlayers(false);
                                    if (window.numberplayers == 1)
                                    {
                                        window.currList = window.defList;
                                        window.currImage = window.defImage;
                                        window.currCat = window.defCat;
                                    }
                                    if (window.shuffle)
                                    {
                                        // if random, then switch to normal!
                                        mediashuffle();
                                    }
                                    window.justCreatePlayer = false;
                                    window.switchView = true;
                                    var currView = dijit.registry.byId("IntroA");
                                    var mycurrView = currView.getShowingView();
                                    window.currentView = "blankview";
                                    optionsView.hide();
                                    mycurrView.performTransition("blankview", 1, "", null);
                                    loadmetadata();
                                    updateImages(-1);
                                }
                            }
                        }
                    });
                }
				
				//here starts the mainline code of the app
                window.BrowserDetect.init();
                console.log("OS=" + window.BrowserDetect.OS + " browser=" + window.BrowserDetect.browser + " version=" + window.BrowserDetect.version);
                if (window.BrowserDetect.OS.substr(0, 6) != "iPhone")
                {
                    window.platform = "Android";
                    // we are on android only show facebook and "other" share buttons
                    dojo.style("twittershare", "display", "none");
                    dojo.style("facebookshare", "margin-right", "30px");
                    dojo.style("facebookshare", "margin-left", "20px");
                    //	dojo.byId("emailShare").setAttribute("label","Other
                    //	domProp.set("emailShare","label","");
                    dojo.byId("emailShare").innerHTML =
                        '<a class="mblIconMenuItemAnchor" role="presentation"><table class="mblIconMenuItemTable" role="presentation"><tbody><tr><td><img alt="" src="images/share_android.png" class="mblImageIcon"><div class="mblIconMenuItemLabel">More</div></td></tr></tbody></table></a>';
                }
                else
                    window.platform = "IOS";
                //window.tellbrowser.init();
                var curl = get('currList');
                var curi = get('currImage');
                var curc = get('currCat');
                var curonce = get('once');
                //		alert("start, check currList="+curl+"image"+curi+"cat:"+curc);
                if (curl && curi && curc && !curonce)
                {
                    //	
                    var url = "artkick://?currList=" + curl + "&currImage=" + curi + "&currCat=" + curc + "&once=" + "true";
                    //	alert("url:"+url);
                    openCustomURLinIFrame(url);
                }
                hidemenu();
                window.standby = new Standby(
                {
                    target: "PlaylistView"
                });
                document.body.appendChild(standby.domNode);
                window.standby2 = new Standby(
                {
                    target: "MylistViewEdit"
                });
                document.body.appendChild(standby2.domNode);
                window.standby3 = new Standby(
                {
                    target: "MylistView"
                });
                document.body.appendChild(standby3.domNode);
				window.standby4 = new Standby(
                {
                    target: "GridView"
                });
                document.body.appendChild(standby4.domNode);



					notiosapp="unknown";
					window.runInWebview=false;
				//	alert(navigator.userAgent+"-"+/Version/.test(navigator.userAgent));
					androidapp=/Android.*Version/.test(navigator.userAgent);
					iosv=/(iPhone|iPod|iPad)/.test(navigator.userAgent);
					if(iosv)
						notiosapp=/Version/.test(navigator.userAgent);
					if (androidapp)
						runInWebview=true;
					if (notiosapp==false)
						runInWebview=true;
				//	alert("Webview="+runInWebview+"androidapp="+androidapp+" notIOSapp="+notiosapp);
				runInWebview = !runInWebview;
				if (runInWebview)
                {
                    dojo.style('otherlogins', 'display', 'none');
                    dojo.style('othersignup', 'display', 'none');
					dojo.style('import1', 'display', 'none');
					dojo.style('import2', 'display', 'none');
					dojo.style('import3', 'display', 'none');
					dojo.style('import4', 'display', 'none');

                }
                getDefaults();
                checkCookie();
                //      BrowserDetect.init();
                $(".mblTabBarButtonLabel").each(function(i, obj)
                {
                    if (obj.innerHTML == "Shuffle On")
                    {
                        console.log("found:" + obj.className);
                        obj.id = "myshuffle";
                    }
                    $(".categoryclass").css("margin", "-2px");
             //       $(".categoryclass2").css("margin", "-2px");
                    $('.mblToolBarButton').css('background-color', 'transparent');
                    $('.mblToolBarButton').css('background-image', 'none');
                    $('.mblToolBarButton').css('border-width', '0px');
                    $('.mblToolBarButton').css('border-style', 'none');
                    $('.mblToolBarButton').css('box-shadow', 'none');
                    $('.mblToolBarButton').css('margin-left', '-5px');
                    $('.mblToolBarButton').css('margin-top', '10px');
                    $('.mblToolBarButton').css('font-family', "Roboto");
                    $('.mblToolBarButton').css('font-weight', "700");
                    $('.mblToolBarButton').css('font-size', "15px");
                })
                dojo.byId("baseurlname").innerHTML = "DB:" + window.base.substring(7, 23);
                console.log("database:" + window.base);
                updateCats();

                //	alert("browser="+window.BrowserDetect.browser+" OS="+window.BrowserDetect.OS+regPlayerView+selectPlayerView+imageView+selectCatView+selectListView+optionsView+addUserView+removePlayerView+gridView);
                on(regRokuView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "registernewroku";
                        // window.updatePlayerLoop = setInterval(updatePlayers,1500); 
                    });
                on(ImportView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "Import";
                        // window.updatePlayerLoop = setInterval(updatePlayers,1500); 
                    });
                on(regnewplayer, "beforeTransitionIn",
                    function()
                    {
                        window.autoIntro = true;
                        window.currentView = "RegisterNew";
                    });
                on(tvplayeroptions, "beforeTransitionIn",
                    function()
                    {
                        if (window.numberplayers == 0)
                        {
                            alert("no registered players");
                        }
                        window.currentView = "Slideshow";
                    });
                on(regRokuView, "beforeTransitionOut",
                    function()
                    {
                        // clearInterval(updatePlayerLoop);
                        rememberSelectPlayers(false);
                    });
                on(regTVView, "beforeTransitionOut",
                    function()
                    {
                        // clearInterval(updatePlayerLoop);
                        rememberSelectPlayers(false);
                    });
                on(regTVView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "registernewTV";
                    });
                on(regPlayerView, "beforeTransitionIn",
                    function()
                    {
                        console.log("new chromecast");
                        window.currentView = "registernewchromecast";
                        window.updatePlayerLoop = setInterval(updatePlayers, 1500);
                        calliOSFunction("sayHello", ["On", window.email], "onSuccess", "onError");
                        try
                        {
                            Android.setEmail(window.email);
                            Android.setButtonVisible();
                        }
                        catch (err)
                        {}
                    });
          /*      on(regPlayerView, "beforeTransitionOut",
                    function()
                    {
                        clearInterval(updatePlayerLoop);
                        currentView = "registernewTV";
                        rememberSelectPlayers(true);
                        calliOSFunction("sayHello", ["Off", window.email], "onSuccess", "onError");
                        try
                        {
                            Android.setEmail(window.email);
                            Android.setButtonInvisible();
                        }
                        catch (err)
                        {}
                    });*/
                //   document.addEventListner("backbutton", function(){ alert ("back pushed");});
                // select player transition
                window.updatePlayers = function()
                {
                    //window.currentView = "select_player2";
                    dojo.io.script.get(
                    {
                        url: base + "client/getSelectedPlayers?email=" + window.email + "&token=" + window.token,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!getselectedPlayers" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem13. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            if (result["Status"] == "success")
                            {
                                for (var i in result["selectedPlayers"])
                                {
                                    if (result["selectedPlayers"][i] != "")
									{
                                        selectedPlayers[result["selectedPlayers"][i]] = 1;
									//	alert("selected="+result["selectedPlayers"][i]);
									}
                                    //alert(result["selectedPlayers"][i]);
                                }
								
								syncImage();
                                updatePlayers2();
                            }
                        }
                    });
                };
          /*      on(selectPlayerView2, "beforeTransitionOut",
                    function()
                    {
                        rememberSelectPlayers(false)
                    });*/
                window.showquickhint = function()
                {
                    hintsrc = "images/Artkick_Hints.jpg";
                    x = dojo.window.getBox();
                    if (x.w > 600) //android or tablet
                        hintsrc = "images/Android_Hints.jpg";
                    //alert("width="+x.w+"url:"+hintsrc);
                    document.getElementById("hinturl").setAttribute("src", hintsrc);
                    gotoView(currentView, 'quickhint');
                };
                window.afterLogin = function()
                {
                    dojo.style(dojo.byId("OptionsList"), "display", "none");
                    gotoView(window.currentView, "blankview");
                    imageView.hide();
                    console.log("afterlogin:" + base + "client/getSelectedPlayers?email=" + window.email + "&token=" + window.token);
                    dojo.io.script.get(
                    {
                        url: base + "client/getSelectedPlayers?email=" + window.email + "&token=" + window.token,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!getSelectedPlayers - window after login" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem14. Please check your connection and restart the app.");
                            }
                        },
                        load: function(result)
                        {
                            if (result["Status"] == "success")
                            {
                                window.selectedPlayers = {};
                                for (var i in result["selectedPlayers"])
                                {
                                    if (result["selectedPlayers"][i] != "")
                                        selectedPlayers[result["selectedPlayers"][i]] = 1;
                                    //alert(result["selectedPlayers"][i]);
                                }
                                updatePlayers();
                                window.switchView = true;
                                updateImages(window.tarImage);
                            }
                            else
                            {
                                window.switchView = true;
                                updateImages(window.tarImage);
                            }
                        }
                    });
                }
                on(imageView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "ImageView";
                        dijit.registry.byId("tabnowshowing").set('selected', true);
                        hidemenu();
                    });
                on(selectCatView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "select_category";
                        //alert("Transition in!");
                        //     dijit.registry.byId("tabcategory3").set('selected', true);
                        window.foundIndex = true;
                        window.justLogin = false;
                        hidemenu();
                        updateCats();
                    });
                on(selectListView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "PlaylistView";
                        // dijit.registry.byId("tabcategory2").set('selected', true);
                        /*   setTimeout(function () {
                               dijit.registry.byId("myTabBarPlaylistView").startup();
                           }, 1000);*/
                    });
                on(selectArtistListView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "ArtistlistView";
                        dijit.registry.byId("tabcategory5").set('selected', true);
                    });
                on(selectMuseumListView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "MuseumlistView";
                        dijit.registry.byId("tabcategory6").set('selected', true);
                    });
                on(accountsettings, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "AccountSettings";
                        dojo.byId("useraccount").innerHTML = "User: " + window.email;
                    });
                on(aboutView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "About";
                    });
                on(logoff, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "LogOff";
                    });
                on(optionsView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "OptionsList";
                        //  dijit.registry.byId("taboptions4").set('selected', true);
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
                    function()
                    {
                        window.currentView = "add_user_player";
                        dojo.byId("addPlayerEmail").value = "";
                        //alert ("adduser transitionin");
                        updateOwnedPlayers();
                    });
                on(removePlayerView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "removeplayer";
                        updateRemovePlayers();
                    }
                );
                on(MylistView, "beforeTransitionIn",
                    function()
                    {
                        window.currentView = "MylistView";
                        //	alert("showmyviewlists called");
                        showmyviewlists();
                    }
                );
                on(MylistViewEdit, "beforeTransitionIn",
                    function()
                    {
						window.lastView=window.currentView;
                        window.currentView = "MylistViewEdit";
                        //	alert("showmyviewlists called");
                        editmyviewlists();
                    }
                );
                on(gridView, "beforeTransitionIn",
                    function()
                    {
                        if (window.wipemenu)
                        {
                            showmenu();
                            return;
                        }
                        window.currentView = "GridView";
                        dijit.registry.byId("gridshowing").set('selected', true);
                        window.gridPages = Math.ceil(window.listSize / window.gridsize);
                        //   alert ("picturegrid, currlist="+window.currList+" number images="+window.listSize+" pages="+gridPages);
                        hidebutton("GridView", false);

                            window.currGridList = window.currList;
                        window.targImageGrid = -1;
                        window.moregridpages = false;
						standby4.show();
                        loadGrid(0, Picturegrid, window.currList); //first call load up the first page of grid
                    });
                //	no longer swiping of the grid view just scroll down
                dojo.connect(Picturegrid, swipe.end,
                    function(e)
                    {
                        window.paneHeight = dojo.coords(Picturegrid).h;
                        window.scrollHeight = -dojo.coords(Picturegrid).y;
                        window.buttonHeight = window.morebuttoncoords.t;
                        //	window.bottomPos=Picturegrid['scrollTop']+paneHeight;
                        //Check and which which difference is bigger since
                        //we only support up, down, left, right
                        if (Math.abs(e.dx) < Math.abs(e.dy))
                        {
                            if (e.dy < 0)
                            {
                                //alert("paneheight: "+paneHeight+" scrollHeight:"+scrollHeight+" more at:"+window.buttonHeight);
                                if (scrollHeight < window.buttonHeight)
                                { // see if we are close to bottom and then load grid
                                    var closepx = window.buttonHeight - scrollHeight;
                                    //alert("closepx:"+closepx);
                                    //alert(" close: "+closepx);
                                    if (closepx < 1200)
                                    {	
										window.moregridpages = true;
                                        loadGrid(1, Picturegrid, window.currList);
                                    }
                                    /*if(window.currGridPage<window.gridPages)
							loadGrid(1);*/
                                }
                            }
                        }
                        //alert("swipe dx="+e.dx+" dy="+e.dy);
                    })
                window.hidebutton = function(node, hideMe)
                {
                    domStyle.set(dijit.registry.byId(node).domNode,
                    {
                        visibility: (hideMe ? 'hidden' : 'visible'),
                        display: (hideMe ? 'none' : 'block')
                    });
                }
                window.loadGrid = function(page, whichgrid, currentList)
                {
                    var currTime = new Date().getTime();
                    if (window.GridClickTime != undefined && (currTime - window.GridClickTime < window.boucingTime))
                    {
                        console.log("returning from loadgrid");
                        //return;
                    }
                    window.GridClickTime = currTime;
                    window.coords = whichgrid;
                    console.log("entering loadgrid, coordinates height:" + window.coords['scrollHeight'] + " Top:" + window.coords['scrollTop'] + " listID:" + currentList+" moregridpages="+window.moregridpages);
                    forward = 1;
                    include = 1;
                    console.log("page=" + page + " current grid page=" + window.currGridPage);
                    if (page == 0)
                    {
                        window.targImageGrid = -1;
                        include = 1;
                        forward = 1;
                        window.currGridPage = 1;
                    }
                    else if (page == 1)
                    {
                        // get next set of 24 thumbnails
                        include = 0;
                        forward = 1;
                        window.targImageGrid = window.lastGridImage;
                        window.currGridPage = window.currGridPage + 1;
                    }
                    else if (page == -1)
                    {
                        // get previous set
                        include = 0;
                        forward = 0;
                        window.targImageGrid = window.firstGridImage;
                        window.currGridPage = window.currGridPage - 1;
                    }
                    //       var url = base + "client/getViewlist5?id=" + window.currList + "&email=" + window.email + "&tarImage=" + window.targImageGrid + "&forward=" + forward + "&numOfImg=20" + "&include=" + include + "&token=" + window.token;
                    var url = base + "client/getViewlist6?id=" + currentList + "&email=" + window.email + "&tarImage=" + window.targImageGrid + "&forward=" + forward + "&numOfImg=" + window.gridsize + "&include=" + include + "&token=" + window.token;
                    if (window.currCat != " Top Lists")
                        url += "&catName=" + window.currCat;
                    if (window.shuffle)
                    {
                        url += "&shuffle=1";
                    }
                    else
                    {
                        url += "&shuffle=0";
                    }
                    var imageData = {
                        "items": []
                    };
                    //alert("page="+page);
                    window.imageCurrStore = new ItemFileWriteStore(
                    {
                        data: imageData
                    });
                    var pagesequence = "";
                    /*if (window.gridPages>1)
						pagesequence = "<br>Page " + window.currGridPage + "/" + window.gridPages;*/
					var listname = window.currViewList;
                    if (listname == "Most liked")
                    {
                        listname = "Most Popular";
                        if (window.currCat == " Top Lists")
                            listname = "Most Popular Across Artkick";
                        else
                            listname = "Most Popular in " + window.currCat;
                    }
                    else
                    if (listname == "My Top Rated")
                        listname = "My Likes"
                        dojo.byId("GridViewHeader").innerHTML=listname;
                  
                    //check number of pages if only 1 turn off the forward back buttons, otherwise check for first/last and show as appropriate
                    dijit.registry.byId("gridshowing").set('selected', true);
                    //	alert("avail heigth="+window.innerHeight+"width="+window.innerWidth);
                    if (window.moregridpages != true)
                    { //only empty the grid on first call otherwise just add them
                        dojo.empty(whichgrid);
                        gridView.scrollTo(
                        {
                            y: 0
                        });
                        console.log("emptied:" + whichgrid);
                    }
                    if (window.morebutton) /* there is morebutton in the grid get rid of it */
                        dojo.destroy(window.morebutton);
                    var dim = 77; //iphone standard
                    var ht;
                    var wd;
                    var icon;
                    if (window.innerHeight > window.innerWidth) // Portrait mode do 4x5
                    {
                        wd = (window.innerWidth / 4)-4;
                        ht = (window.innerHeight - 80) / 5;
                    }
                    else //landscape mode do 5x4
                    {
                        wd = (window.innerWidth / 5)-5;
                        ht = (window.innerHeight - 80) / 4;
                    }
                    $('.imageclass').css('height', ht + "px");
                    $('.imageclass').css('width', wd + "px");
                    dim = Math.sqrt((window.innerHeight - 115) * (window.innerWidth - 0) / 20 * .8);
                    // always do 20, if width is greater than height then do 5x4 else 4x5  
                    //	dim=Math.min(Math.floor((window.innerHeight-40)/5)-5,Math.floor(window.innerWidth/4)-4);
                    //   console.log ("dim="+dim);
                    var remainder = window.innerWidth % dim;
                    console.log("ht:" + window.innerHeight + "Wd:" + window.innerWidth + "dim=" + dim + "remainder:" + remainder);
                    var firstnode = "";
                    //	dojo.style("Picturegrid", "left", remainder/2+"px");
                    dojo.io.script.get(
                    {
                        url: url,
                        callbackParamName: "callback",
                        timeout: 8000,
                        trytimes: 5,
                        error: function(error)
                        {
                            console.log("timeout!loadgrid" + url);
                            this.trytimes--;
                            if (this.trytimes > 0)
                            {
                                dojo.io.script.get(this);
                            }
                            else
                            {
                                alert("Network problem15. Please check your connection and restart the app.");
                            }
                        },
                        load: function(viewlist)
                        {
							if (viewlist["imageSet"].length==0)
							{
								standby4.hide();
								return;
							}
                            for (var i in viewlist["imageSet"])
                            {

                                //console.log("id="+viewlist["imageSet"][i]["id"]);
                                icon = viewlist["imageSet"][i]["thumbnail"];
                                if (viewlist["imageSet"][i]["icon"])
                                    icon = viewlist["imageSet"][i]["icon"];
                                var gridimage = dojo.create("div",
                                {
                                    classname: "griddiv"
                                }, whichgrid);
                                console.log("currLIst=" + currentList);
                                window.pic = dojo.create("img",
                                {
                                    className: "imageclass",
                                    id: viewlist["imageSet"][i]["id"]+'~'+currentList,
                                    alt: viewlist["imageSet"][i]["thumbnail"],
                                    src: icon,
                                    onclick: function()
                                    {
                                        if (!window.editlist)
                                        {
                                            window.tarImage = this.id.split('~').slice(0,-1).join('~');
                                            window.currImage = null;
                                            window.gridset = true;
                                            window.switchView = true;
                                           // window.currList = this.alt;
										   window.currList= this.id.split('~').slice(-1).join('~');
                                            updateImages(this.id.split('~').slice(0,-1).join('~'));
                                            if (window.currentView == "GridView")
                                                gotoView('GridView', 'blankview');
                                            else if (window.currentView == "GettyView")
                                            {
                                                gettyReset();
                                                gotoView('GettyView', 'blankview');
                                            }
                                            else if (window.currentView == "SearchView")
                                                gotoView("SearchView", "blankview");
                                        }
                                        else
                                        {
                                            clickdelete(this.parentNode, 'ckc' + this.id.split('~').slice(0,-1).join('~'))
                                        }
                                    },
                                    width: wd + "px",
                                    height: ht + "px",
                                    hspace: "0px",
                                    vspace: "0px",
                                     margin:"2px"
                                }, gridimage);
                                console.log("added id:" + viewlist["imageSet"][i]["id"]);
                                if (window.editlist)
                                {
                                    var ckc = dojo.create("img",
                                    {
                                        classname: "checkclass",
                                        id: 'ckc' + viewlist["imageSet"][i]["id"],
                                        src: 'images/GrayTrash_25x25.png',
                                        onclick: function()
                                        {
                                            clickdelete(this.parentNode, this.id);
                                        },
                                        width: '20px',
                                        height: '20px',
                                        zindex: 950
                                    }, gridimage);
                                }
                                if (firstnode = "")
                                    firstnode = pic;
                            }
                            /* check to see if there are more images to show in the grid, but only show up to 1000 images */
                            if (window.currGridPage < window.gridPages && window.currGridPage < 10)
                            {
                                window.moregridpages = true;
                                var morebutton = dojo.create("img",
                                {
                                    id: 'morebutton' + pic,
                                    classname: 'moregrid',
                                    src: "images/morebutton.png",
                                    onclick: function()
                                    {	
										window.moregridpages = true;
                                        loadGrid(1, Picturegrid, window.currList);
                                    },
                                    width: wd + "px",
                                    height: ht + "px",
                                    hspace: "0px",
                                    vspace: "0px"
                                }, whichgrid);
                                window.morebutton = "morebutton" + pic;
                                window.morebuttoncoords = dojo.coords(morebutton);
                            }
                            else
                                window.morebutton = "";
                            window.firstGridImage = viewlist["imageSet"][0]["id"];
                            window.lastGridImage = viewlist["imageSet"][viewlist["imageSet"].length - 1]["id"];
                            console.log("displaying picturegrid");
                            dojo.style(dojo.byId(whichgrid), "display", "block");
							standby4.hide();
                        }
                    })
                };
                on(userrating, "click",
                    function()
                    {
                        //alert("change ratings"+userrating.value);
                        //  LEON here is where you need to store value of user's rating for the image in the database!
                        //	   alert(imageMap[window.currImage]["User Rating"]);
                        imageMap[window.currImage]["User Rating"] = userrating.value;
                        dojo.io.script.get(
                        {
                            url: base + "client/rateImage?imageId=" + window.currImage + "&email=" + window.email + "&rating=" + userrating.value + "&token=" + window.token,
                            callbackParamName: "callback",
                            timeout: 8000,
                            trytimes: 5,
                            error: function(error)
                            {
                                console.log("timeout!rateImage" + url);
                                this.trytimes--;
                                if (this.trytimes > 0)
                                {
                                    dojo.io.script.get(this);
                                }
                                else
                                {
                                    alert("Network problem16. Please check your connection and restart the app.");
                                }
                            },
                            load: function(result) {}
                        });
                    });
                window.doPrev = function(imgId)
                {
                    //alert("currView id "+imgId);
                    //	alert("Prev img "+window.prevImg);
                    if ((window.prevImg != undefined) && (window.prevImg != imgId))
                    {
                        //normal slide backward
                        window.currAbsIndex--;
                    }
                    else if (imgId == window.currStartImg && imgId != window.absStartImg)
                    {
                        //slide backward at head
                        //prev chunk!
                        var imageData = {
                            "items": []
                        };
                        //	LoadImages.style.visibility = "visible";	                  
                        window.imageCurrStore = new ItemFileWriteStore(
                        {
                            data: imageData
                        });
                        window.switchView = true;
                        gotoView("ImageView", "blankview");
                        loadImages(window.currStartImg, 0, 15, 0);
                    }
                    else if (imgId == window.currEndImg && imgId != window.absEndImg)
                    {
                        //slide forward at tail
                        //next chunk!
                        var imageData = {
                            "items": []
                        };
                        //    LoadImages.style.visibility = "visible";
                        window.imageCurrStore = new ItemFileWriteStore(
                        {
                            data: imageData
                        });
                        //window.sliderIndex = 0;
                        window.switchView = true;
                        gotoView("ImageView", "blankview");
                        loadImages(window.currEndImg, 1, 15, 0);
                    }
                    window.prevImg = imgId;
                }
                window.doNext = function(imgId)
                {
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
                connect.subscribe("/dojox/mobile/deleteListItem", function(item)
                {
                    showDeleteButton(item);
                });
                connect.subscribe("/dojox/mobile/viewChanged", function(view)
                {
                    window.swipedImages++;
                    //alert("changeview "+ view);
                    //
                    // alert(view.getChildren()[0]['alt']);
                    var artist = "";
                    var title = "";
                    var imagesize = ""
                    var genre = "";
                    var ratingvalue = 0;
                    //alert(view);
                    if ((view + "").split(', ')[1][0] == 'I')
                        return;
                    //alert("changing view 0 on you");
                    window.currImage = view.getChildren()[0]['alt'];
                    if ((!window.foundIndex) && (window.currImage != window.tarImage))
                    {
                        // view.goTo(1);
                        return;
                    }
                    // alert("changing view on you");
                    hidemenu();
                    window.foundIndex = true;
                    window.currImage = view.getChildren()[0]['alt'];
                    loadmetadata();
                    // alert("meta= " + metaPlane7.innerHTML);
                    //var url = "http://localhost:3000/api/v1.1/client/update2?imageID="+view.getChildren()[0]['alt']+"&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat+"&token=" + window.token;
                    var url = base + "client/update2?imageID=" + view.getChildren()[0]['alt'] + "&stretch=" + window.fill + "&email=" + window.email + "&list=" + window.currList + "&cat=" + window.currCat + "&token=" + window.token;
                    //console.log(url);
                    for (var i in window.selectedPlayers)
                    {
                        if (window.window.selectedPlayers[i])
                        {
                            url += "&players[]=" + i;
                        }
                    }
                    // alert('view changed :'+url);
                    dojo.io.script.get(
                    {
                        url: url,
                        callbackParamName: "callback",
                        load: function(result) {}
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
            window.response1 = response;
            console.log("resp:" + window.response1);
            func(response.data.url);
        }
    );
}

function emailShare()
{
    imageurl = imageMap[currImage]["thumbnail"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/"
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert("url="+url);
    console.log("long:" + url);
    get_short_url(url, login, api_key, function(short_url)
    {
        console.log("short" + short_url);
        calliOSFunction("email", ['Artkick rocks', short_url, encodeURIComponent(imageMap[currImage]["thumbnail"]), 'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");
        try
        {
            Android.share('Check out this great image and thousands more at Artkick', short_url, imageMap[currImage]["thumbnail"], 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function otherShare()
{
    imageurl = imageMap[currImage]["thumbnail"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/"
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert("url="+url);
    console.log("long:" + url);
    get_short_url(url, login, api_key, function(short_url)
    {
        console.log("short" + short_url);
        calliOSFunction("gmail", ['Artkick rocks', short_url, encodeURIComponent(imageMap[currImage]["thumbnail"]), 'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");
        try
        {
            Android.share('Check out this great image and thousands more at Artkick', short_url, imageMap[currImage]["thumbnail"], 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function twitter()
{
    //alert("facebook!");
    imageurl = imageMap[currImage]["thumbnail"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/";
    //url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    get_short_url(url, login, api_key, function(short_url)
    {
        calliOSFunction("twitter", ['Artkick rocks', short_url, encodeURIComponent(imageMap[currImage]["thumbnail"]), 'Check out this great image and thousands more at Artkick @artkicktv #freeart'], "onSuccess", "onError");
        try
        {
            Android.twitter('Check out this great image and thousands more at Artkick @artkicktv #freeart', short_url, imageMap[currImage]["thumbnail"], 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function mytest()
{
    alert("mytest");
}

function facebook()
{
    //alert("facebook!");
    imageurl = imageMap[currImage]["thumbnail"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/"
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert ("url="+url);
    get_short_url(url, login, api_key, function(short_url)
    {
        calliOSFunction("facebook", ['Artkick rocks', short_url, encodeURIComponent(imageMap[currImage]["thumbnail"]), 'Check out this great image and thousands more at Artkick @artkicktv #freeart'], "onSuccess", "onError");
        try
        {
            //alert(imageMap[currImage]["thumbnail"]);
            Android.facebook('Check out this great image and thousands more at Artkick @artkicktv #freeart', short_url, imageMap[currImage]["thumbnail"], 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function testlaunch()
{
    ret = open("artkick://prod.artkick.net/?currList=1047&currImage=9508&currCat=Lifestyle", "");
    //alert("return="+ret);
}

function showiframe(url)
{
    if (runInWebview)
	{
		var currView = dijit.registry.byId("ImageView");
		//  alert ("displayiframe currView= "+url);
		ret = window.iframe = dojo.create("iframe",
		{
			"src": url,
			"style": "border: 0; width: 100%;height:700px"
		});
		dijit.registry.byId("displayiframe").set("content", window.iframe);
		gotoView(currentView, "iframeview")
		return (ret);
	}
	else
	{
		calliOSFunction("loadLink", [url], "onSuccess", "onError");
		try
		{
			//alert("loading android artkick roku");
			Android.loadLink(url);
		}
		catch (err)
		{}
	}
}

function showfullimage()
{
    var currView = dijit.registry.byId("ImageView");
    hidebutton("GridView", true);
    document.getElementById("fullurl").setAttribute("src", window.imageMap[window.currImage]["url"]);
    window.currentView = "fullimageview";
    currView.performTransition("fullimageview", 1, "flip", null);
}

function bigimage()
{
    //$('.mblCarouselItemImage.big').css('height',$(window).height()+"px");
    gotoView('GridView', 'ImageView');
    adjustSize();
    window.bigImg = true;
    $("#myTabBar").hide();
    $("#ImageViewHeader").hide();
    $(".CarouselMeta").hide();
    $(".thumbDiv").hide();
    $(".mblCarouselItemImage.big").show();
    $("#ImageList").css("margin-top", "-45px");
    $(".arrow").show();
}

function smallimage()
{
    window.bigImg = false;
    $("#myTabBar").show();
    $("#ImageViewHeader").show();
    $(".CarouselMeta").show();
    $(".thumbDiv").show();
    $(".mblCarouselItemImage.big").hide();
    $("#ImageList").css("margin-top", "0px");
    dijit.registry.byId("tabnowshowing").set('selected', true);
    $(".arrow").hide();
}

function destroyiframe()
{
    var currView = dijit.registry.byId("iframeview");
    hidebutton("GridView", true);
    dojo.destroy(window.iframe);
    gotoView("iframeview", window.lastView);
}

function destroyfullimageview()
{
    var currView = dijit.registry.byId("fullimageview");
    window.currentView = "ImageView";
    currView.performTransition("ImageView", -1, "flip", null);
}

function showviewlistmenu()
{
    var menulist = dijit.registry.byId("Viewlistmenu");
    if (window.viewmenushow || window.systemmenushow)
    {
        hidemenu();
    }
    else
    {
        menulist.show();
        window.viewmenushow = true;
    }
}

function showsharemenu()
{
    if (window.wipemenu)
    {
        showmenu();
    }
    if (window.sharemenushow)
        hidemenu();
    else
    { // calculate the right spot for this
        dijit.registry.byId("Sharemenu2").show();
        //dojo.style("Sharemenu2","display", "block");
        window.sharemenushow = true;
    }
}

function showmenu()
{
    var menuname = "wipemenu"
        //console.log("showmenu width:"+$(window).width()+"px");
    if (window.guest)
    {
        guestmessage();
        window.guestmenu = true;
        return;
    }
    if (window.currentView == "select_category")
        menuname = "wipemenu3";

    else if (window.currentView == "PlaylistView")
        menuname = "wipemenu2a";
    else
        menuname = "wipemenu";
    if ((window.currCat == "My Viewlists"||window.currCat.substr(0,5)=="Getty" ||window.currCat=="My Searches"))
    {
        dojo.style("editmyviewlists", "display", "block");
        console.log("show edit my viewlists");
    }
    else
        dojo.style("editmyviewlists", "display", "none");
    //console.log("1");	
    dojo.style(menuname, "left", $(window).width() - 225 + "px");
	if(currentView=="ImageView")
		dojo.style(menuname, "top", "60px");
	else
		dojo.style(menuname, "top", "50px");
    // console.log("2");            
    if (window.wipemenu)
    {
        window.wipemenu = false;
        dojo.style(window.showingmenu, "height", "");
        dojo.style(window.showingmenu, "display", "block");
        var wipeArgs = {
            node: showingmenu,
            duration: 100
        };
        dojo.fx.wipeOut(wipeArgs).play();
    }
    else
    {
        window.showingmenu = menuname;
        hidemenu();
        window.wipemenu = true;
        dojo.style(menuname, "display", "none");
        var wipeArgs = {
            node: menuname,
            duration: 100
        };
        dojo.fx.wipeIn(wipeArgs).play();
    }
}

function showviewlistmenu2()
{
    var menulist = dijit.registry.byId("Viewlistmenu2");
    if (window.viewmenushow2 || window.systemmenushow2)
    {
        hidemenu();
    }
    else
    {
        menulist.show();
        window.viewmenushow2 = true;
    }
}

function hidemenu()
{
    if (!window.sharemenushow)
    {
        dijit.registry.byId("Sharemenu2").hide();
        dojo.style("Sharemenu2", "display", "none");
    }
    //	alert("sharemenu2="+dojo.style("Sharemenu2"));
	dijit.registry.byId('SearchBox').hide();
	window.searchboxshow = false;
    window.sharemenushow = false;
    window.systemmenushow = false;
    window.viewmenushow = false;
    window.systemmenushow2 = false;
    window.viewmenushow2 = false;
    if (window.wipemenu)
    {
        showmenu();
    }
}

function swapview(newview)
{
    //alert ("swapview "+newview);
    var currView = dijit.registry.byId("ImageView");
    var currView2 = dijit.registry.byId("blankview");
    window.currList = newview;
    hidemenu();
    //currView.performTransition("blankview", 1, "fade", null);
    gotoView('ImageView', 'blankview');
    window.switchView = true;
    //currView.hide();
    updateImages(-1);
}

function callmyListView()
{
    if (window.wipemenu)
    {
        showmenu();
    }
    var curview = dijit.registry.byId(window.currentView);
    curview.performTransition('MylistView', 1, 'none', null);
}

function callEditmyListView()
{
    if (window.wipemenu)
    {
        showmenu();
    }
	if (currCat=="My Searches")
		window.editmylistdomain="artkick";
	if (currCat=="My Viewlists")
		window.editmylistdomain="personal";
	if (currCat.substr(0,5)=="Getty")
		window.editmylistdomain=currCat.substr(6).toLowerCase();
    var curview = dijit.registry.byId(window.currentView);
    curview.performTransition('MylistViewEdit', 1, 'none', null);
}

function goToShare()
{
    var currView = dijit.registry.byId("ImageView");
    var mycurrView = currView.getShowingView();
    hidemenu();
    window.currentView = "Share";
    mycurrView.performTransition("Share", 1, "fade", null);
}

function notimplemented()
{
    alert("Feature not yet implemented");
    hidemenu();
}

function refreshView()
{
    // if user clicks on "now Showing" button it refreshes the view to what is presently being displayed
    //alert("refresh view");
    if (!window.email)
    {
        return;
    }
    dijit.registry.byId('GuestMessage').hide();
    (function(i, s, o, g, r, a, m)
    {
        i['localAnalyticsObject'] = r;
        i[r] = i[r] || function()
        {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    ga('create', 'UA-44460273-1', 'artkick.net'); <!-- change this to -1 for production -->
    ga('require', 'displayfeatures');
    ga('send', 'pageview');
    window.justRefresh = true;
    window.switchView = true;
	window.spotlightlist=false;
    if (window.guest)
    {
        cleanUp();
      //  dojo.byId('browse-search').innerHTML = "Browse";
        dojo.style("searchmenu", "display", "none");
        //	$("#searchbutton").hide();
        gotoView(window.currentView, "IntroA");
        return;
    }
    window.firstupdateplayers = false;
    var currView = dijit.registry.byId("IntroA");
	$("select").blur();
	
    var mycurrView = currView.getShowingView();
    //alert(mycurrView);
    //mycurrView.performTransition("blankview", 1, "fade", null);
//	if (!gettysubscribe)
//	{
//		window.adnumber = 0;
//		dojo.style("gettyad", "display", "block");
//		window.AdInterval = setInterval(changeAd, 5000);
//	}
//	else
//		dojo.style("gettyad", "display", "none");
    gotoView(window.currentView, 'blankview');
    updateImages(-1);
}

function setCookie(c_name, value, exdays)
{
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
    try
    {
        Android.setCookie(c_name, value);
    }
    catch (err)
    {}
}

function cleanUp()
{
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
    window.wipemenu = false;
    window.shownoviewlist = false;
    window.restart = false;
    window.highresolution = false;
    window.guest = false;
    window.isAdmin = false;
    window.userID = "";
    window.gettysubscribe = false;
    window.sharedlist = false;
    window.searchboxshow = false;
    $("#addPlayerEmail").attr('value', '');
    getDefaults();
    window.adnumber = 0;
    window.spotlightlist = false;
    window.firstupdateplayers = true;
	window.dialLaunchSerial='none';
}

function sendfeedback()
    {
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
    newFrameElm.setAttribute("src", src);
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

function onSuccess(ret)
{ //alert("success!");
    if (ret)
    {
        var obj = JSON.parse(ret);
        //document.write(obj.result);
        //alert(obj.result);
        hidemenu();
    }
}

function onError(ret)
    { //alert("error!");
        if (ret)
        {
            var obj = JSON.parse(ret);
            //document.write(obj.error);
            //alert(obj.result);
            hidemenu();
        }
    }
    // this function used to parse paramaters off the http line

function get(name)
{
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
//alert("toCall");
function usermessage(message)
{
    var messagebox = dijit.registry.byId('UserMessage');
    dojo.byId('UserMessage').innerHTML = message;
    setTimeout(function()
    {
        messagebox.show()
    }, 100);
    setTimeout(function()
    {
        messagebox.hide()
    }, 2000);
}
window.myalert = function(message)
{
    var mbox = dijit.registry.byId('Myalert');
    dojo.byId('myContent').innerHTML = message;
    dijit.registry.byId(window.currentView).show();
    mbox.show();
}
window.guestmessage = function(message)
{
    var mbox = dijit.registry.byId('GuestMessage');
    //dojo.byId('myContent').innerHTML = message;
    dijit.registry.byId(window.currentView).show();
    mbox.show();
}
window.gotoSignin = function()
{
    dijit.registry.byId('GuestMessage').hide();
    refreshView();
}

function setAutoIntro(flag)
{
    //alert(""+flag);
    window.autoIntro = flag;
}

function gotoCategory(where)
{
    if (window.currCat == "Home" && where == '0')
    {
        gotoView("ImageView", "select_category");
        return;
    }
    if (where != 0)
        window.currCat = where;
    else
    {
        dojo.style(dojo.byId("ImageView"), "display", "none");
    }
    goToViewlists();
}

function doquickhint()
{
    if (window.firstimageview == true)
    {
        window.firstimageview = false;
        gotoView("quickhint", "select_category");
    }
    else
    {
        gotoView("quickhint", "OptionsList");
    }
}

function callHelp()
{
    //showiframe("http://artkick.zendesk.com");
    hidemenu();
    calliOSFunction("loadLink", ["http://artkick.zendesk.com"], "onSuccess", "onError");
    try
    {
        //alert("loading android artkick roku");
        Android.loadLink("http://artkick.zendesk.com");
    }
    catch (err)
    {}
}

function adjustSize()
{
    var ht, wd;
    $('.mblCarouselItemImage.big').css('height', $(window).height() + "px");
    $('.mblCarouselItemImage.big').css('width', $(window).width() + "px");
    $('.mblCarouselSlot.mblCarouselItem').css('width', $(window).width() + 4 + "px");
    $('.mblCarouselSlot.mblCarouselItem').css('margin-left', "0%");
    $('.thumbDiv').css('height', 0.5 * $(window).height() + "px");
    $(".categoryclass").css("margin", "-2px");
    $('.mblToolBarButton').css('background-color', 'transparent');
    $('.mblToolBarButton').css('background-image', 'none');
    $('.mblToolBarButton').css('border-width', '0px');
    $('.mblToolBarButton').css('border-style', 'none');
    $('.mblToolBarButton').css('box-shadow', 'none');
    $('.mblToolBarButton').css('margin-left', '-5px');
    $('.mblToolBarButton').css('margin-top', '10px');
    $('.mblToolBarButton').css('font-family', "Roboto");
    $('.mblToolBarButton').css('font-weight', "700");
    $('.mblToolBarButton').css('font-size', "15px");
    /*   $('.mblTabBarButton').css('background-color','transparent');
	//$('.mblTabBarButton').css('background-image','none');
	$('.mblToolBarButton').css('background-color','transparent');
	$('.mblTabBar').css('background-color','transparent');
	$('.mblTabBar').css('background-image','none');
	$('.mblTabBar').css('border-style','none');
	$('.mblTabBar').css('padding','0px');*/
    $('.mblTabBar').css('height', '34px');
    $('.mblTabBarButton').css('font-family', "Roboto");
    $('.mblTabBarButton').css('font-weight', "700");
    $('.mblTabBarButton').css('font-size', "15px");
    $("#ImageViewHeader").addClass("mblHeadingCenterTitle");
    if ($(window).width() > 700)
    {
        $(".newcategoryclass").css("width", ($(window).width()/4)-7);
      //  $(".categoryclass2").css("width", "33.3%");
    }
    else if ($(window).width() > 500)
    {
        $(".newcategoryclass").css("width", ($(window).width()/3)-7);
     //   $(".categoryclass2").css("width", "33.3%");
    }
    else
    {
        $(".newcategoryclass").css("width", ($(window).width()/2)-7);

    }
    //calculate size for grid view
    if (window.innerHeight > window.innerWidth) // Portrait mode do 4x5
    {
        wd = (window.innerWidth / 4)-4;
        ht = (window.innerHeight - 80) / 5;
		imgsize=ht;
    }
    else //landscape mode do 5x4
    {
        wd = (window.innerWidth / 5)-5;
        ht = (window.innerHeight - 80) / 4;
		imgsize=wd;
    }
    $('.imageclass').css('height', ht + "px");
    $('.imageclass').css('width', wd + "px");
	
	 imgsize=Math.min((window.innerWidth / 3)-10,imgsize);

	 $('.featuredclass').css('width', imgsize + "px");
	 $('.featuredclass').css('height', imgsize + "px");
	 $(".categoryclass2").css("width", imgsize+"px");
}
$(window).resize(function()
{
    //console.log("resized");
    adjustSize();
});

function copyright()
{
    var mbox = dijit.registry.byId('CopyrightMessage');
    var copytxt = "Public Domain";
    if (window.imageMap[window.currImage]["Copyright"])
        copytxt = window.imageMap[window.currImage]["Copyright"];
    if (window.imageMap[window.currImage]["Copyright Detail"])
        copytxt = window.imageMap[window.currImage]["Copyright Detail"];
    dojo.byId('copyrightinformation').innerHTML = copytxt;
    dijit.registry.byId(window.currentView).show();
    mbox.show();
}