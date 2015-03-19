/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
function removePlayerconfirm()
{
    // pop up dialog to confirm that the user really wants to delete the device.....
	$('#CancelremoveTVbutton').click(function(){return false;}) // stop click from propogating
		$('#removeTVbutton').click(function(event){event.stopImmediatePropagation();
}) // stop click from propogating
    dijit.registry.byId("ConfirmTVDelete").show();
	//alert("current uuid="+window.currentplayer['dialuuid']);
}



function removePlayer()
{
    var currTime = new Date().getTime();
    //alert("currTime"+currTime);
    //alert("lastTime"+window.rmplayerClickTime);
    if (window.rmplayerClickTime != undefined && currTime - window.rmplayerClickTime < 7000)
        return;
    window.rmplayerClickTime = currTime;
    dijit.registry.byId("ConfirmTVDelete").hide();
    key = window.currentplayer["account"];
    dojo.io.script.get(
    {
        url: base + "player/removePlayer?email=" + window.email + "&playerId=" + key + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!removePlayer" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem19. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                usermessage(result["Message"]);
				if (window.currentplayer["account"].substr(0,10)=="chromecast"||window.currentplayer["account"].substr(0,7)=="Artkick")
					dialDeletePlayer(window.currentplayer['dialuuid']);
                window.numberPlayers--;
                // force unselection of this player
                delete selectedPlayers[currentplayer['account']];
                rememberSelectPlayers(true);
             //   updatePlayers();
                // now delete the listitem out of the player list
                dojo.destroy(dojo.byId('s' + currentplayer['account']));
            }
            gotoView("TVDetail", "select_player2");
        }
    });
}

function addUserToPlayers()
{
    var currTime = new Date().getTime();
    if (window.addUserClickTime != undefined && currTime - window.addUserClickTime < window.boucingTime)
        return;
    window.addUserClickTime = currTime;
    var email = dojo.byId("addPlayerEmail").value;
    if (email == "")
    {
        myalert("You must first search for an Artkick user to add them to a player");
    }
    else
    {
        // add check to see if any player is checked
        key = window.currentplayer["account"];
        dojo.io.script.get(
        {
            url: base + "player/addUserToPlayer?queryEmail=" + email + "&playerId=" + key + "&token=" + window.token + "&myEmail=" + window.email,
            callbackParamName: "callback",
            load: function(result)
            {
                usermessage(result["Message"]);
                dojo.byId("addPlayerEmail").value = '';
            }
        });
    }
}

function adduserPlayer()
{
    dijit.registry.byId("SearchUser").show();
}

function searchUser()
{
    var currTime = new Date().getTime();
    if (window.searchuClickTime != undefined && currTime - window.searchuClickTime < window.boucingTime)
        return;
    window.searchuClickTime = currTime;
    var email = dojo.byId("addPlayerEmail").value;
    //alert(email);
    dojo.io.script.get(
    {
        url: base + "player/getUser?queryEmail=" + email + "&token=" + window.token + "&myEmail=" + window.email,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!getUser" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem20. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            if (result["Status"] == "success")
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

function createPlayer()
{
    var currTime = new Date().getTime();
    if (window.createPlayerClickTime != undefined && currTime - window.createPlayerClickTime < window.boucingTime)
        return;
    window.createPlayerClickTime = currTime;
    if (dojo.byId("regPlayerCode").value == "")
    {
        alert("Player Code cannot be blank");
        return;
    }
    if (dojo.byId("regPlayerName").value == "")
    {
        myalert("You must name your Roku");
        return;
    }
    var currView = dijit.registry.byId("registernewroku");
    //alert(base + "reg/userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get(
    {
        url: base + "reg/userReg?regCode=" + (dojo.byId("regPlayerCode").value).toLowerCase() + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email + "&token=" + window.token,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                myalert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
                console.log("number players:" + window.numberplayers);
                if (window.numberplayers == 0) // only switch to default view if this is first player
                {
                    console.log("new player");
                    window.tarImage = window.defImage;
                    window.currList = window.defList;
                    window.currCat = window.defCat;
                }
                window.numberplayers++;
                window.justCreatePlayer = true;
                window.autoIntro = true;
                //currView.performTransition("ImageView", 1, "slide", null);
                dojo.byId("regPlayerCode").value = "";
                dojo.byId("regPlayerName").value = "";
                if (window.shuffle)
                {
                    // if random, then switch to normal!
                    mediashuffle();
                }
                updatePlayers();
                //two possible cases, either from roku or chromecast, so we just make both registraion view gone
                //console.log("trying to hide register view");
                dojo.byId("regPlayerCode").value = "";
                dojo.byId("regPlayerName").value = "";
                dojo.style(dojo.byId("registernewroku"), "display", "none");
                gotoView("registernewchromecast", "blankview");
                window.switchView = true;
                //     updateImages(-1);
            }
            else
            {
                alert(result["Message"]);
            }
        }
    });
}

function createPlayer2()
{
    var currTime = new Date().getTime();
    if (window.createPlayerClickTime != undefined && currTime - window.createPlayerClickTime < window.boucingTime)
        return;
    window.createPlayerClickTime = currTime;
    if (dojo.byId("regPlayerCode2b").value == "")
    {
        myalert("Registration Code cannot be blank");
        return;
    }

    var currView = dijit.registry.byId("registernewTV");
    //alert(base + "reg/userReg?regCode=" + dojo.byId("regPlayerCode").value + "&nickname=" + dojo.byId("regPlayerName").value + "&email=" + window.email);
    dojo.io.script.get(
    {
        url: base + "reg/userReg?regCode=" + (dojo.byId("regPlayerCode2b").value).toLowerCase() + "&nickname=" + NewPlayerName + "&email=" + window.email + "&token=" + window.token + "&uuid=" + window.playeruuid,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                myalert("Player " + dojo.byId("regPlayerName").value + " is now registered!");
                if (window.numberplayers == 0) // only switch to default view if this is first player
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
                if (window.shuffle == true)
                {
                    // if random, then switch to normal!
                    mediashuffle();
                }
                //	console.log("call update players from registernewTV");
                //two possible cases, either from roku or chromecast, so we just make both registraion view gone
                //console.log("trying to hide register view");
                dojo.byId("regPlayerCode2").value = "";
                dojo.byId("regPlayerName2").value = "";
                dojo.style(dojo.byId("registernewTV"), "display", "none");
                var playeracct = result["account"];
                console.log("playeracct=" + playeracct);
                //playerClick("s" + result["account"]);
                //	window.playerSet['s'+playeracct] = true;
                selectedPlayers[playeracct] = 1;
                rememberSelectPlayers(true);
                gotoView("RegCodeInstall", "blankview");
                window.switchView = true;
                syncImage();
              //  updatePlayers();
                //   updateImages(-1);
            }
            else
            {
                myalert(result["Message"]);
            }
        }
    });
}

function regnewroku()
{
    var currView = dijit.registry.byId("registernewplayer");
    // processes register new roku button
    currView.performTransition("registernewroku", 1, "slide", null);
}

function installartkick()
{
    //alert ("install artkick");
    //var win = window.open("https://owner.roku.com/add/T2ZAW", '_blank');
    //win.focus();
    calliOSFunction("loadLink", ["https://owner.roku.com/add/T2ZAW"], "onSuccess", "onError");
    try
    {
        //alert("loading android artkick roku");
        Android.loadLink("https://owner.roku.com/add/T2ZAW");
    }
    catch (err)
    {}
}

function setAuto2(interval,id)
{
	//window.currentplayer= the current player
	window.currentplayer = window.playerlist[id.substr(2)];
	setAuto(interval);
}
function setOrientation(position)
{
console.log ("set orientation to:"+position);
key = window.currentplayer["account"];
    dojo.io.script.get(
    {
        url: base + "client/setOrientation?email=" + window.email + "&snumber=" + key + "&orientation=" + position + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!setAuto" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem22a. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            usermessage("Orientation set");
                     
        }
    });


}
function setAuto(interval)
{
    key = window.currentplayer["account"];
    dojo.io.script.get(
    {
        url: base + "client/setAuto?email=" + window.email + "&snumber=" + key + "&autoInterval=" + interval + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!setAuto" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem22. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            usermessage("Slideshow set");
            var timing = "never";
			currentplayer["autoInterval"]=interval;
            switch (interval)
            {
                case "0":
                    timing = "Off";
                    break;
                case "-1":
                    timing = "Every Morning";
                    break;
                case "30000":
                    timing = "30 Seconds";
                    break;
                case "60000":
                    timing = "Minute";
                    break;
                case "120000":
                    timing = "2 Minutes";
                    break;
                case "300000":
                    timing = "5 Minutes";
                    break;
                case "600000":
                    timing = "10 Minutes";
                    break;
                case "1800000":
                    timing = "30 Minutes";
                    break;
                case "3600000":
                    timing = "Hour";
                    break;
                case "43200000":
                    timing = "12 Hours";
                    break;
            }
           
        }
    });

}

function setOverlay(state)
{
    key = window.currentplayer["account"];
    dojo.io.script.get(
    {
        url: base + "client/setOverlay?email=" + window.email + "&snumber=" + key + "&overlay=" + state + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!setOverlay" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem22b. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            usermessage("Display Logo set to "+state);
            
			currentplayer["logoOn"]=state;

           
           
        }
    });

}
function setStretch(state)
{
    key = window.currentplayer["account"];
    dojo.io.script.get(
    {
        url: base + "client/setStretch?email=" + window.email + "&snumber=" + key + "&Stretch=" + state + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!setStretch" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem22a. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            usermessage("Aspect set");
            
			currentplayer["stretch"]=state;

           
           
        }
    });

}
function fillswitch()
{
    //alert(window.fill);
    //console.log($("#fillswitch"));
    //var fillsw = dijit.registry.byId("fillswitch");
    if (window.fill)
    {
      dojo.byId("fillswitch4").setAttribute("src","images/checkbox_on.png");
	  setStretch(false);
	  window.playerlist[window.currentplayerID]["stretch"]=false;
        window.fill = false;
    }
    else
    {
        window.fill = true;
		dojo.byId("fillswitch4").setAttribute("src","images/checkbox_off.png");
		window.playerlist[window.currentplayerID]["stretch"]=true;
		setStretch(true);
        //	fillsw.set('label', "Active");
    }
    syncImage();
    //alert(window.fill);
}


function showlogo()
{
    //alert(window.fill);
    //console.log($("#fillswitch"));
    //var fillsw = dijit.registry.byId("fillswitch");
    if (window.logo)
    {
      dojo.byId("fillswitch5").setAttribute("src","images/checkbox_off.png");
	  setOverlay(false);
	  window.playerlist[window.currentplayerID]["logoOn"]=false;
        window.logo = false;
    }
    else
    {
        window.logo = true;
		dojo.byId("fillswitch5").setAttribute("src","images/checkbox_on.png");
		window.playerlist[window.currentplayerID]["logoOn"]=true;
		setOverlay(true);
        //	fillsw.set('label', "Active");
    }
    syncImage();
    //alert(window.fill);
}

function setCaption(state)
{
    key = window.currentplayer["account"];
    dojo.io.script.get(
    {
        url: base + "client/hideCaption?email=" + window.email + "&snumber=" + key + "&hide=" + state + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!setStretch" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem22c. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            usermessage("Display Captions set to "+!state);
            
			currentplayer["hide_caption"]=state;

           
           
        }
    });

}
function showcaptions()
{
    //alert(window.fill);
    //console.log($("#fillswitch"));
    //var fillsw = dijit.registry.byId("fillswitch");
    if (window.hidecaption)
    {
      dojo.byId("fillswitch6").setAttribute("src","images/checkbox_on.png");
	  setCaption(false);
	  window.playerlist[window.currentplayerID]["hide_caption"]=true;
        window.hidecaption = false;
    }
    else
    {
        window.hidecaption = true;
		dojo.byId("fillswitch6").setAttribute("src","images/checkbox_off.png");
		window.playerlist[window.currentplayerID]["hide_caption"]=false;
		setCaption(true);
        //	fillsw.set('label', "Active");
    }
    syncImage();
    //alert(window.fill);
}
function burninsaver()
{
    //alert(window.fill);
    var fillsw = dijit.registry.byId("burninsaver");
    var autoplay = document.getElementById("AutoPlaySelect");
    var autoplayfixed = document.getElementById("AutoPlayFixed");
    if (window.burn)
    {
        fillsw.set('label', "Not Active");
        autoplay.style.visibility = "visible";
        autoplayfixed.style.visibility = "hidden";
        window.burn = false;
    }
    else
    {
        fillsw.set('label', "Active");
        autoplay.style.visibility = "hidden";
        autoplayfixed.style.visibility = "visible";
        setAuto(3600000);
        window.burn = true;
    }
    //alert(window.fill);
}

function mediashuffle()
{
    if (window.shuffle)
    {
        window.shuffle = false;
        //  dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');
        dijit.registry.byId('shuffletab').set('label', "Shuffle");
        $("#myshuffle").removeClass("mblTabBarButtonLabel2");
        //     dojo.byId('shuffletile').innerHTML = "Turn on shuffle";
        usermessage("Shuffle OFF");
    }
    else
    {
        window.shuffle = true;
        dijit.registry.byId('shuffletab').set('label', "Shuffle On");
        $("#myshuffle").addClass("mblTabBarButtonLabel2");
        //	dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle3.png');
        //	   dijit.registry.byId("shuffletab").set('color', '#4F4AFF');
        //	   dojo.byId('shuffletile').innerHTML = "Turn off shuffle";
        usermessage("Shuffle ON");
    }
    gotoView('ImageView', 'blankview');
    window.switchView = true;
    updateImages(-1);
}





function playerDetail(id)
{
    console.log("details clicked for player" + window.playerlist[id.substr(2)]["nickname"]);
    window.currentplayer = window.playerlist[id.substr(2)];
	window.currentplayerID=id.substr(2);
    if (!currentplayer['autoInterval'])
        currentplayer["autoInterval"] = 0;
    if (!currentplayer['stretch'])
        currentplayer["stretch"] = false;
    if (!currentplayer['logoOn'])
        currentplayer["logoOn"] = false;
    if (!currentplayer['hide_caption'])
        currentplayer["hide_caption"] = false;
	if (!currentplayer['orientation'])
        currentplayer["orientation"] = 'horizontal';
    $("#slideshowvalue").val(currentplayer["autoInterval"]);
	dojo.byId("devicepencil").setAttribute("src","images/pencil2-gray.png");
	window.fill=currentplayer["stretch"];
	if (window.fill)
		dojo.byId("fillswitch4").setAttribute("src","images/checkbox_off.png");
	else
		dojo.byId("fillswitch4").setAttribute("src","images/checkbox_on.png");

	window.logo=currentplayer["logoOn"];
	if (window.logo)
		dojo.byId("fillswitch5").setAttribute("src","images/checkbox_on.png");
	else
		dojo.byId("fillswitch5").setAttribute("src","images/checkbox_off.png");
		
	window.hidecaption=currentplayer["hide_caption"];
	if (window.hidecaption)
		dojo.byId("fillswitch6").setAttribute("src","images/checkbox_off.png");
	else
		dojo.byId("fillswitch6").setAttribute("src","images/checkbox_on.png");
	 $("#orientationValue2").val(currentplayer["orientation"]);
    //document.getElementById("detailshowing").setAttribute("src", player["curr_image"]["icon"]);
    //dijit.registry.byId("detailheading").set("label", currentplayer["nickname"]+" Details");
    dojo.byId("playerDetailsName").value = currentplayer["nickname"];
	if (currentplayer["account"].substr(0,10)=="chromecast"||currentplayer["account"].substr(0,7)=="Artkick")
		dojo.style("Orientation", "display", "block");
	else
		dojo.style("Orientation", "display", "none");
	if (dojo.byId("originalName"))
	{
		if (currentplayer["originalName"])
		{
			dojo.style("originalName", "display", "block");
			dojo.byId("originalName").innerHTML=currentplayer["originalName"];
		}
		else
			dojo.style("originalName", "display", "none");
	}
    gotoView(currentView, "TVDetail");
}
window.countplayers = function()
{
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
            window.numberplayers = result["players"].length;
            console.log("players #:" + window.numberplayers);
        }
    })
}
window.changeplayerstatus = function(id)
{
    console.log("change player status for id=" + id.substr(3));
    //alert("change player status for:"+id.substr(3));
    //now lets find the uuid to give back to leon to restart it with Dial
    for (var i in playerlist)
    {
        if (playerlist[i]['account'] == id.substr(3))
        {
		
			var playstate=((playerlist[i]['state'] == "stopped"||playerlist[i]['state']=="unknown") && playerlist[i]['uuid']&&playerlist[i]['uuid']!='unknown');
			console.log("playstate="+playstate);
       //     if (!playerlist[i]['state'])
       //         return; // if there is no state just return and do nothing
            //	alert("state="+playerlist[i]['state']);
            if (playerlist[i]['state'] == "stopped" || playerlist[i]['state'] == "unknown")
            {
                // alert("calling up to restart "+playerlist[i]['nickname']);
              //  alert("Reconnecting to " + playerlist[i]['nickname']+" calling playerclick");
                if (!selectedPlayers[id.substr(3)]) // if player not selected then select it if reconnecting
                {
                    playerClick('icon' + id.substr(3), true);
                }
                // dialLaunch(playerlist[i]['dialuuid']);
            }
			else /* they hit the image so lets loadimage for it */
			{
				window.currList=playerlist[i]['curr_listId'];
				window.currCat="Home";
		
				    gotoView(currentView, 'blankview');
			window.switchView = true;
			updateImages(playerlist[i]['curr_image']['id']);
			}
        }
    }
}


window.showAutoplay = function(interval)
{

var timing = "never";
            switch (interval)
            {
                case "0":
                    timing = "Off";
                    break;
                case "-1":
                    timing = "Every Morning";
                    break;
                case "30000":
                    timing = "30 Seconds";
                    break;
                case "60000":
                    timing = "Minute";
                    break;
                case "120000":
                    timing = "2 Minutes";
                    break;
                case "300000":
                    timing = "5 Minutes";
                    break;
                case "600000":
                    timing = "10 Minutes";
                    break;
                case "1800000":
                    timing = "30 Minutes";
                    break;
                case "3600000":
                    timing = "Hour";
                    break;
                case "43200000":
                    timing = "12 Hours";
                    break;
            }
			return(timing);


}

window.playerClick = function(id, quiet)
{
	console.log("playerclick: " + id);
	var newid = 's' + id.substr(4);
	var xid = id.substr(4).trim();
	mid = 'icon' + xid;
	// we need to check if device is stopped and restart it if the user selects it
	console.log("playerclick id " + newid + " xid " + xid);
	var titleid = dojo.byId('ptitle' + xid).innerHTML;
	if (selectedPlayers[xid])
	{
		document.getElementById(mid).setAttribute("src", "images/CheckBox25x25.png");
		//	dojo.byId(mid).src="images/Checkbox25x25.png";
		//domAttr.set(aid, "src", "images/Checkmark25x25.png");
		window.playerSet[newid] = false;
		usermessage("Stopped controlling " + titleid);
		delete selectedPlayers[xid];
	}
	else
	{
		for (var i in playerlist)
		{
			if (playerlist[i]['account'] == xid && playerlist[i]['dialuuid'])
			{
				//alert("Reconnecting to " + playerlist[i]['nickname']+playerlist[i]['dialuuid']+" state "+playerlist[i]['state']);
				console.log("trying to restart " + playerlist[i]['nickname']);
				//playerlist[i]['state']='running';
				selectedPlayers[xid] = 1;
				
				if (!quiet) usermessage("Now controlling " + titleid);
				if(playerlist[i]['state']!='running')
				{
					rememberSelectPlayers(false);
					window.dialLaunchSerial=playerlist[i]['account'];
					//usermessage("Restarting " + titleid);
					dialLaunch(playerlist[i]['dialuuid'],titleid);
				}
				else
				{
					rememberSelectPlayers(true);
					if (!quiet) usermessage("Now controlling " + titleid);
				}
				return;
			}
		}
		document.getElementById(mid).setAttribute("src", "images/CheckMark25x25.png");
		selectedPlayers[xid] = 1;
		//rememberSelectPlayers();
		//dojo.byId(mid).src="images/Checkmark25x25.png";
		//document.getElementById(id).className='checkboxclass2';
		//	domAttr.set(id, "src", "images/Checkbox25x25.png");
		if (!quiet) usermessage("Now controlling " + titleid);
	}
	rememberSelectPlayers(true);
	//updatePlayers();
	loadmetadata();
}

function devicenamechange()
{

	dojo.byId("devicepencil").setAttribute("src","images/pencil2.png");
}

function renameDevice()
{
	//myalert("renaming "+window.currentplayer['account']+" to "+dojo.byId("playerDetailsName").value);
	

    var key = window.currentplayer["account"];
	var newname = dojo.byId("playerDetailsName").value;
    dojo.io.script.get(
    {
        url: base + "client/renamePlayer?email=" + window.email + "&snumber=" + key + "&name=" + newname + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!setStretch" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem22d. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            usermessage("Renamed '"+window.currentplayer['nickname']+"' to '"+ newname+"'");
            playerlist[window.currentplayerID]["originalname"]=window.currentplayer['nickname'];
			playerlist[window.currentplayerID]["nickname"]=newname;
			dojo.byId("ptitle"+playerlist[window.currentplayerID]["account"]).innerHTML=newname;

           
           
        }
    });

}

function findactivePlayer()
{
	for (var i in playerlist)
	{
		var player = playerlist[i];

		if (player["account"] in selectedPlayers)
		{
	   
			window.activeplayer = player["nickname"];
		}
	}

}