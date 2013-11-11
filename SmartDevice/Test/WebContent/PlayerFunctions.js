/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

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
        }
    }
    for (var key in window.removePlayers) {
        if (window.removePlayers[key]) {
            dojo.io.script.get({
                url: base + "player/removePlayer?email=" + window.email + "&playerId=" + key+"&token="+window.token,
                callbackParamName: "callback",
                load: function (result) {
                	if(result["Status"]=="success")
                        usermessage(result["Message"]);
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
	if (email =="")
	{
		alert("You must first search for an Artkick user to add them to a player");
	}
	else
	{
// add check to see if any player is checked
    for (var key in window.ownedPlayers) {
        if (window.ownedPlayers[key]) {
            dojo.io.script.get({
                url: base + "player/addUserToPlayer?queryEmail=" + email + "&playerId=" + key+"&token="+window.token+"&myEmail="+window.email,
                callbackParamName: "callback",
                load: function (result) {
                    usermessage(result["Message"]);
                }
            });
        }

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
   
    dojo.io.script.get({
        url: base + "player/getUser?queryEmail=" + email+"&token="+window.token+"&myEmail="+window.email,
        callbackParamName: "callback",
        load: function (result) {
            usermessage(result["Message"]);
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
		alert("You must name your Roku");
		return;
	}
	
    var currView = dijit.registry.byId("registernewroku");
    //alert(base + "reg/userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get({
        url: base + "reg/userReg?regCode=" + (dojo.byId("regPlayerCode").value).toLowerCase() + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email+"&token="+window.token,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
                alert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
                window.tarImage = window.defImage;
                window.currList = window.defList;
                window.currCat = window.defCat;
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
		alert("Registration Code cannot be blank");
		return;
	}
	if (dojo.byId("regPlayerName2").value =="")
	{
		alert("You must name your TV");
		return;
	}
	
    var currView = dijit.registry.byId("registernewTV");
    //alert(base + "reg/userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get({
        url: base + "reg/userReg?regCode=" + (dojo.byId("regPlayerCode2").value).toLowerCase() + "&nickname=" + dojo.byId("regPlayerName2").value + "&email=" + window.email+"&token="+window.token,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
                alert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
                window.tarImage = window.defImage;
                window.currList = window.defList;
                window.currCat = window.defCat;
                window.justCreatePlayer = true;
				window.autoIntro = true;
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
                alert(result["Message"]);
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
    //var win = window.open("https://owner.roku.com/add/ArtkickV0", '_blank');
    //win.focus();
    calliOSFunction("loadLink", ["https://owner.roku.com/add/ArtkickV0"], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("https://owner.roku.com/add/ArtkickV0");
    }
    catch(err){
    	
    }

}
function setAuto(interval) {
    for (var player in window.playerSet) {
        if (window.playerSet[player]) {
            //alert(base+"setAuto?email="+window.email+"&snumber="+player.substring(1)+"&autoInterval="+interval);
            dojo.io.script.get({
                url: base + "client/setAuto?email=" + window.email + "&snumber=" + player.substring(1) + "&autoInterval=" + interval+"&token="+window.token,
                callbackParamName: "callback",
                load: function (result) {}
            });

        }


    }

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

function mediashuffle() {
if (window.shuffle)
{
       window.shuffle=false;
	   dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');
	   usermessage("Shuffle OFF");
}
else
{
		window.shuffle=true;
		dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
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

