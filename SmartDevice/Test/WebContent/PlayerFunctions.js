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
                //currView.performTransition("ImageView", 1, "slide", null);
                updatePlayers();
                if(window.shuffle){
                           // if random, then switch to normal!
                    mediashuffle();
                }
                //two possible cases, either from roku or chromecast, so we just make both registraion view gone
                dojo.style(dojo.byId("registernewroku"),"display", "none");           
                gotoView("registernewchromecast","blankview");
                window.switchView = true;
                updateImages(-1);
               

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
}
else
{
		window.shuffle=true;
		dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
}
    gotoView('ImageView','blankview');
    window.switchView = true;
	updateImages(-1);
}

