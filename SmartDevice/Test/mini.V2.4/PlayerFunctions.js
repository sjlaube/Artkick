/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
 

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
    var currView = dijit.registry.byId("removeplayer");
    var i = 0;
    for (var key in window.removePlayers) {
        if (window.removePlayers[key]) {
            i++;
			window.numberplayers--;
        }
    }
    for (var key in window.removePlayers) {
        if (window.removePlayers[key]) {
            dojo.io.script.get({
                url: base + "player/removePlayer?email=" + window.email + "&playerId=" + key+"&token="+window.token,
                callbackParamName: "callback",
				timeout: 8000,
				trytimes: 5,
				error: function(error){
					console.log("timeout!removePlayer"+url);
					this.trytimes --;
					if(this.trytimes>0){
						dojo.io.script.get(this);
					} else{
						alert("Network problem19. Please check your connection and restart the app.");
					}
					
				},
                load: function (result) {
                	if(result["Status"]=="success")
                        usermessage(result["Message"]);
                    i--;
                    if (i == 0) {
                        currView.performTransition("OptionsList", 1, "slide", null);
                    }
                }
            });
        }

    }
}


function removePlayer() {
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


			key=window.currentplayer["account"];
            dojo.io.script.get({
                url: base + "player/removePlayer?email=" + window.email + "&playerId=" + key+"&token="+window.token,
                callbackParamName: "callback",
				timeout: 8000,
				trytimes: 5,
				error: function(error){
					console.log("timeout!removePlayer"+url);
					this.trytimes --;
					if(this.trytimes>0){
						dojo.io.script.get(this);
					} else{
						alert("Network problem19. Please check your connection and restart the app.");
					}
					
				},
                load: function (result) {
                	if(result["Status"]=="success")
					{
                        usermessage(result["Message"]);
						window.numberplayers--;
						// now delete the listitem out of the player list
						dojo.destroy(dojo.byId('s'+currentplayer['account']));
					}
					gotoView("TVDetail","select_player2");
                   
                }
            });
        

    
}
function addUserToPlayers() {
    var currTime = new Date().getTime();
    if(window.addUserClickTime!=undefined && currTime - window.addUserClickTime < window.boucingTime)
        return;
	window.addUserClickTime = currTime;
	
	
    var email = dojo.byId("addPlayerEmail").value;
	if (email =="")
	{
		myalert("You must first search for an Artkick user to add them to a player");
	}
	else
	{
// add check to see if any player is checked
			key=window.currentplayer["account"];
            dojo.io.script.get({
                url: base + "player/addUserToPlayer?queryEmail=" + email + "&playerId=" + key+"&token="+window.token+"&myEmail="+window.email,
                callbackParamName: "callback",
				load: function (result) {
                    usermessage(result["Message"]);
					dojo.byId("addPlayerEmail").value='';
                }
            });
        }

   

}
function adduserPlayer()
{

        dijit.registry.byId("SearchUser").show();

}
function searchUser() {
	var currTime = new Date().getTime();
    if(window.searchuClickTime!=undefined && currTime - window.searchuClickTime < window.boucingTime)
        return;
	window.searchuClickTime = currTime;
	
	
    var email = dojo.byId("addPlayerEmail").value;
    //alert(email);
   
    dojo.io.script.get({
        url: base + "player/getUser?queryEmail=" + email+"&token="+window.token+"&myEmail="+window.email,
        callbackParamName: "callback",
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!getUser"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem20. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
			if(result["Status"]=="success")
			{
				dijit.registry.byId('SearchUser').hide();
				addUserToPlayers();
			}
			else
			
				alert(result["Message"]);
        }
    });
	//dojo.byId("addPlayerEmail").value = "";
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
		myalert("You must name your Roku");
		return;
	}
	
    var currView = dijit.registry.byId("registernewroku");
    //alert(base + "reg/userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get({
        url: base + "reg/userReg?regCode=" + (dojo.byId("regPlayerCode").value).toLowerCase() + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email+"&token="+window.token,
        callbackParamName: "callback",
		
        load: function (result) {
            if (result["Status"] == "success") {
                myalert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
				console.log("number players:"+window.numberplayers);
                if (window.numberplayers==0) // only switch to default view if this is first player
				{
					console.log("new player");
					window.tarImage = window.defImage;
					window.currList = window.defList;
					window.currCat = window.defCat;
				}window.numberplayers++;
                window.justCreatePlayer = true;
				window.autoIntro = true;
                //currView.performTransition("ImageView", 1, "slide", null);
				dojo.byId("regPlayerCode").value = "";
				dojo.byId("regPlayerName").value = "";
                if(window.shuffle){
                           // if random, then switch to normal!
                    mediashuffle();
                }
				updatePlayers();
                //two possible cases, either from roku or chromecast, so we just make both registraion view gone
				//console.log("trying to hide register view");
				dojo.byId("regPlayerCode").value = "";
				dojo.byId("regPlayerName").value = "";
                dojo.style(dojo.byId("registernewroku"),"display", "none");           
                gotoView("registernewchromecast","blankview");
                window.switchView = true;
           //     updateImages(-1);
               

            } else {
                alert(result["Message"]);
            }

        }
    });
}
function createPlayer2() {
	
	var currTime = new Date().getTime();
    if(window.createPlayerClickTime!=undefined && currTime - window.createPlayerClickTime < window.boucingTime)
        return;
	window.createPlayerClickTime = currTime;
	if (dojo.byId("regPlayerCode2").value =="")
	{
		myalert("Registration Code cannot be blank");
		return;
	}
	if (dojo.byId("regPlayerName2").value =="")
	{
		myalert("You must name your TV");
		return;
	}
	
    var currView = dijit.registry.byId("registernewTV");
    //alert(base + "reg/userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get({
        url: base + "reg/userReg?regCode=" + (dojo.byId("regPlayerCode2").value).toLowerCase() + "&nickname=" + dojo.byId("regPlayerName2").value + "&email=" + window.email+"&token="+window.token,
        callbackParamName: "callback",
		
        load: function (result) {
            if (result["Status"] == "success") {
                myalert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
				 if (window.numberplayers==0) // only switch to default view if this is first player
				{
                window.tarImage = window.defImage;
                window.currList = window.defList;
                window.currCat = window.defCat;
				}
				window.numberplayers++;
                window.justCreatePlayer = true;
				window.autoIntro = true;
				window.justLogin = false; // all user to register player right after registering with Artkick!!
                //currView.performTransition("ImageView", 1, "slide", null);
                if(window.shuffle==true){
                           // if random, then switch to normal!
                    mediashuffle();
                }
			//	console.log("call update players from registernewTV");
				updatePlayers();
                //two possible cases, either from roku or chromecast, so we just make both registraion view gone
				//console.log("trying to hide register view");
				dojo.byId("regPlayerCode2").value = "";
				dojo.byId("regPlayerName2").value = "";
                dojo.style(dojo.byId("registernewTV"),"display", "none");  
				
                gotoView("registernewTV","blankview");
                window.switchView = true;
             //   updateImages(-1);
               

            } else {
                myalert(result["Message"]);
            }

        }
    });
}
function regnewroku() {
    var currView = dijit.registry.byId("registernewplayer");

    // processes register new roku button
    currView.performTransition("registernewroku", 1, "slide", null);

}

function installartkick() {
    //alert ("install artkick");
    //var win = window.open("https://owner.roku.com/add/T2ZAW", '_blank');
    //win.focus();
    calliOSFunction("loadLink", ["https://owner.roku.com/add/T2ZAW"], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("https://owner.roku.com/add/T2ZAW");
    }
    catch(err){
    	
    }

}
function setAuto(interval) {
 //   for (var player in window.playerSet) {
   //     if (window.playerSet[player]) {
            //alert(base+"setAuto?email="+window.email+"&snumber="+player.substring(1)+"&autoInterval="+interval);
            key=window.currentplayer["account"];
			dojo.io.script.get({
                url: base + "client/setAuto?email=" + window.email + "&snumber=" + key + "&autoInterval=" + interval+"&token="+window.token,
                callbackParamName: "callback",
				timeout: 8000,
				trytimes: 5,
				error: function(error){
					console.log("timeout!setAuto"+url);
					this.trytimes --;
					if(this.trytimes>0){
						dojo.io.script.get(this);
					} else{
						alert("Network problem22. Please check your connection and restart the app.");
					}
					
				},
                load: function (result) {
				usermessage("Slideshow set");
				var timing="never";
				switch(interval)
				{
					case "0":
						timing="Off";
						break;
					case "-1":
						timing="Every Morning";
						break;
					case "60000":
						timing="Every Minute";
						break;
					case "600000":
						timing="Every 10 Minutes";
						break;
					case "3600000":
						timing="Every Hour";
						break;
					case "10800000":
						timing="Every 3 Hours";
						break;
					case "21600000":
						timing="Every 6 Hours";
						break;
					case "43200000":
						timing="Every 12 Hours";
						break;
			
			
				}
				dijit.registry.byId('s'+currentplayer['account']).set("label",
				currentplayer["nickname"] +"<br><small>&nbsp;&nbsp;&nbsp;Slideshow: "+timing+"</small>");
				}
            });

    //    }


  //  }

}




function fillswitch() {
    //alert(window.fill);
	//console.log($("#fillswitch"));
	//var fillsw = dijit.registry.byId("fillswitch");
    if (window.fill) {
	  //  fillsw.set('label', "Not Active");
        window.fill = false;
    } else {
        window.fill = true;
	//	fillsw.set('label', "Active");
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

function mediashuffle() {


if (window.shuffle)
{
		
       window.shuffle=false;
	 //  dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');
	 	dijit.registry.byId('shuffletab').set('label', "Shuffle");
		$("#myshuffle").removeClass("mblTabBarButtonLabel2");
	  //     dojo.byId('shuffletile').innerHTML = "Turn on shuffle";
	   usermessage("Shuffle OFF");
}
else
{
		window.shuffle=true;
		dijit.registry.byId('shuffletab').set('label', "Shuffle On");
		$("#myshuffle").addClass("mblTabBarButtonLabel2");
	//	dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
	//	   dijit.registry.byId("shuffletab").set('color', '#4F4AFF');
	//	   dojo.byId('shuffletile').innerHTML = "Turn off shuffle";
		usermessage("Shuffle ON");
}
    gotoView('ImageView','blankview');
    window.switchView = true;
	updateImages(-1);
}

function registerroku()
{
window.currentView = "registernewroku";   

dijit.registry.byId("newuserintro").performTransition("registernewroku", 1, "", null);

}
function buyroku()
{
console.log("buy roku");
   calliOSFunction("loadLink", ["http://www.amazon.com/Roku-Streaming-Player-Black-2710R/dp/B00F5NB7JK/ref=sr_1_2?ie=UTF8&qid=1382460219&sr=8-2&keywords=roku+1"], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("http://www.amazon.com/Roku-Streaming-Player-Black-2710R/dp/B00F5NB7JK/ref=sr_1_2?ie=UTF8&qid=1382460219&sr=8-2&keywords=roku+1");
    }
    catch(err){
    	
    }
}

function noregisterTV()
{
	window.currentView = "blankview";
	window.afterLogin();
    dijit.registry.byId("newuserintro").performTransition("blankview", 1, "slide", null);

}

function playerDetail(id)
{

	console.log("details clicked for player"+window.playerlist[id.substr(2)]["nickname"]);
	window.currentplayer = window.playerlist[id.substr(2)];

	$("#slideshowvalue").val(currentplayer["autoInterval"]);
	$("#fillswitch3").val(currentplayer["stretch"]);
	//document.getElementById("detailshowing").setAttribute("src", player["curr_image"]["icon"]);

	dijit.registry.byId("detailheading").set("label", currentplayer["nickname"]+" Details");
	gotoView(currentView,"TVDetail");
}
window.countplayers = function()
{
thisurl= base + "player/getPlayers?email=" + window.email + "&token=" + window.token;
                    dojo.io.script.get({
                        url: thisurl,
                        callbackParamName: "callback",
						timeout: 8000,
						trytimes: 5,
						error: function(error){
							console.log("timeout!Getplayers  "+thisurl);
							this.trytimes --;
							if(this.trytimes>0){
								dojo.io.script.get(this);
							} else{
								alert("Network problem12. Please check your connection and restart the app.");
							}
							
						},
                        load: function (result) {


								window.numberplayers=result["players"].length;
								console.log("players #:"+window.numberplayers);
								}
					})
}

window.dialsearch=function()
{
// this function calls the dial search to locate devices
jsonStr = "{\"0a21fe82-00aa-1000-8bb9-5cf6dce19f18\":\"[TV]Samsung LED75\",\"015d80c1-9000-105d-80df-b83e591640e1\":\"Roku Streaming Player 1GH31T024031\",\"01a130c9-1801-1020-80f3-b83e59ec760b\":\"Roku Streaming Player 1XC396073971\",\"010d3053-9c01-1061-80c6-cc6da03af95d\":\"Roku Streaming Player 13C1CW090566\",\"14da096a-2742-11e2-84f8-34F62D3F2D9C\":\"AQUOS C6500U\",\"36d33576-02bf-6c39-0000-0000019acabf\":\"Sheldon's Fire TV\",\"015d70c4-7800-10ba-8082-b83e593b7e51\":\"Roku Streaming Player 1GG34N047746\",\"02125bb1-18eb-bb8e-cd43-f46255b0fa0c\":\"Artkick Chromecast1\"}";

window.dialMap = JSON.parse(jsonStr);

}
 