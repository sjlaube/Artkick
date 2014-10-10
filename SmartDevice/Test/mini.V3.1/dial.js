/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

DIAL related functions

*/
window.dialsearch = function(str)
{
	//alert("dialsearch");
    // this function calls the dial search to locate devices
    if (!str)
        jsonStr = '[{\"uuid\":\"506d8c5c-bf74-4f54-b423-643c45a00e6b\",\"friendlyName":\"Sheldon\'s Fire TV\",\"modelName\":\"FireTV\",\"state\":\"unknown\",\"serialNumber\":\"Sheldon\'s Fire TV\",\"IpAddress\":\"192.168.2.188\"},{\"uuid\":\"adb4f3a0-fd3f-4544-b88f-b03e9c32c774\",\"friendlyName":\"Vizio DTV\",\"modelName\":\"Vizio_M401i-A3\",\"state\":\"unknown\",\"IpAddress\":\"192.168.2.155\"},{\"uuid\":\"2ac717bc-dc01-438d-991f-90eaee88bb57\",\"friendlyName":\"Roku 13C1CW090566\",\"modelName\":\"Roku Streaming Player 3100X\",\"state\":\"running\",\"serialNumber\":\"13C1CW090566\",\"IpAddress\":\"192.168.2.142\"},{\"uuid\":\"1121a9e8-332e-4044-8db3-6a9f10a0d4b1\",\"friendlyName":\"BRAVIA KDL-32W650A\",\"modelName\":\"KDL-32W650A\",\"state\":\"unknown\",\"IpAddress\":\"192.168.2.201\"},{\"uuid\":\"7dd7e038-0334-4e4d-b3c9-92e51da70147\",\"friendlyName":\"Roku 1XC396073971\",\"modelName\":\"Roku Streaming Player 2710X\",\"state\":\"running\",\"serialNumber\":\"1XC396073971\",\"IpAddress\":\"192.168.2.244\"},{\"uuid\":\"8aab6078-fdb0-41f0-b904-3a979e08f667\",\"friendlyName":\"Roku 1GH31T024031\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"stopped\",\"serialNumber\":\"1GH31T024031\",\"IpAddress\":\"192.168.2.159\"},{\"uuid\":\"208c3bd9-af94-48b3-b07a-1e03e56f982d\",\"friendlyName":\"Chromecast EO\",\"modelName\":\"Eureka Dongle\",\"state\":\"running\",\"serialNumber\":\"af2249bb907e7e33e9cab2789f721cb6\",\"IpAddress\":\"192.168.2.226\"},{\"uuid\":\"e662cc06-6f26-4e63-881e-6c731d70b9c3\",\"friendlyName":\"Roku 1GG34N047746\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"stopped\",\"serialNumber\":\"1GG34N047746\",\"IpAddress\":\"192.168.2.207\"},{\"uuid\":\"b129315a-150f-455e-a3c3-bdbcbf85d5d5\",\"friendlyName":\"Artkick Chromecast1\",\"modelName\":\"Chromecast\",\"state\":\"running\",\"serialNumber\":\"02125bb118ebbb8ecd43f46255b0fa0c\",\"IpAddress\":\"192.168.2.242\"},{\"uuid\":\"d8c540da-0d11-4c84-830e-2b4006bfbfdf\",\"friendlyName":\"Apple TV\",\"IpAddress\":\"192.168.2.110\"}]';
		else
        jsonStr = str;
    window.dialMap = JSON.parse(jsonStr);
	clearInterval(showingScanNetwork);
	window.ScanNetworkComplete=true;

    //	alert("dialmap length="+dialMap.length);
    for (var i in dialMap)
    {
        //console.log("i= "+i);
        console.log("TV: " + dialMap[i]["friendlyName"]);
        // lets see if we can determine manufacturer
        if (dialMap[i]["friendlyName"].toLowerCase().indexOf("roku") > -1)
            dialMap[i]["manufacturer"] = "Roku";
        if (dialMap[i]["friendlyName"].toLowerCase().indexOf("samsung") > -1)
            dialMap[i]["manufacturer"] = "Samsung";
        if (dialMap[i]["friendlyName"].toLowerCase().indexOf("aquos") > -1)
            dialMap[i]["manufacturer"] = "Sharp";
        if (dialMap[i]["friendlyName"].toLowerCase().indexOf("vizio") > -1)
            dialMap[i]["manufacturer"] = "Vizio";
		if (dialMap[i]["friendlyName"].toLowerCase().indexOf("bravia") > -1)
            dialMap[i]["manufacturer"] = "Sony";
        if (dialMap[i]["friendlyName"].toLowerCase().indexOf("apple") > -1)
        {
            dialMap[i]["manufacturer"] = "Apple";
            dialMap[i]['modelName'] = "Apple TV";
        }
        if (dialMap[i]["modelName"])
        {
            if (dialMap[i]["modelName"].toLowerCase().indexOf("firetv") > -1)
                dialMap[i]["manufacturer"] = "Amazon";
            if (dialMap[i]["modelName"].toLowerCase().indexOf("eureka") > -1)
                dialMap[i]["manufacturer"] = "Google";
            if (dialMap[i]["modelName"].toLowerCase().indexOf("chromecast") > -1)
                dialMap[i]["manufacturer"] = "Google";
        }
		//if (dialMap[i]['manufacturer']=='Google')
		//	alert("chromecast "+dialMap[i]['friendlyName']+" state:+"+dialMap[i]['state']);
        // now lets figure out if there is a unique serial number for this
        if (!dialMap[i]['ArtkickID'])
        {
            if (dialMap[i]['serialNumber'])
                dialMap[i]['ArtkickID'] = dialMap[i]['serialNumber'];
            else
            if (dialMap[i]['modelName']) // see if this is unique
            {
                if (modelnamecount(dialMap[i]['modelName']) == 1)
                    dialMap[i]['ArtkickID'] = dialMap[i]['modelName'];
                else
                    dialMap[i]['ArtkickID'] = dialMap[i]['modelName'] + dialMap[i]['IpAddress'];
            }
            else
                dialMap[i]['ArtkickID'] = dialMap[i]['IpAddress'];
        }
    }
	

    dijit.registry.byId("ScanNetwork").hide();
	//usermessage("callingupdate from dial search");
	updatePlayers();
}

function modelnamecount(id)
{
    var modelcount = 0;
    for (var i in dialMap)
    {
        if (id == dialMap[i]['modelName'])
            modelcount++
    }
    return (modelcount);
}

function playerInstall(id)
{
    window.playeruuid = "unknown";
    if (id != "unknown")
    {
        nid = id.substr(5);
        swid = dialMap[nid]["manufacturer"];
        console.log("installing " + nid + " " + dialMap[nid]["friendlyName"]);
        dojo.byId('regPlayerName2').value = dialMap[nid]["friendlyName"];
        dojo.byId("tvinstallheading").innerHTML="Connect " + swid;
        window.playeruuid = dialMap[nid]["ArtkickID"];
        serialnumber = dialMap[nid]['serialNumber'];
    }
    else
    {
        swid = id;
        dojo.byId("tvinstallheading").innerHTML="Connect Display";
        dojo.byId('regPlayerName2').value = "";
    }
    switch (swid)
    {
        case "Amazon":
            console.log("Amazon");
			if (dialMap[nid]['modelName']=="FireTV" && dialMap[nid]["state"]=="unknown")
			{
			
				myalert(
                'Goto Amazon.com with a browser on a PC or Mac and search for "Artkick for FireTV" and click the "Deliver" button, then restart Artkick on your phone or tablet');
            
			}
			else
			{
            window.dialLaunchSerial='Fire' + serialnumber;
            dialLaunch(dialMap[nid]['uuid'],dialMap[nid]['friendlyName']);
			}
               
            break;
        case "Vizio":
            console.log("Vizio");
            dojo.byId("helpcontents").innerHTML =
                'Install and start Artkick on your display device. A registration code will appear.';
            gotoView(currentView, 'RegCodeInstall');
            break;
        case "Google":
            console.log("Chromecast");
          //  usermessage("Installing Artkick on " + dialMap[nid]['friendlyName']);
          //  selectedPlayers['chromecast' + serialnumber] = 1;
           // rememberSelectPlayers(false);
			window.dialLaunchSerial='chromecast' + serialnumber;
            dialLaunch(dialMap[nid]['uuid'],dialMap[nid]['friendlyName']);
            break;
        case "Samsung":
            dojo.byId("helpcontents").innerHTML =
                "Install Artkick from the Samsung Store.<br> Access the store by clicking the SmartHub remote button, scroll through the applications and click the Artkick Icon. <br> Start Artkick and a registration code will appear on screen";
            gotoView(currentView, 'RegCodeInstall');
            console.log("Samsung");
            break;
		case "Sony":
            dojo.byId("helpcontents").innerHTML =
                "Install Artkick from the Opera Store.<br> Access the store by clicking the SEN remote button, scroll through the applications and click the Opera Store Icon. Search the Opera Store for Artkick and install the app.<br> Start Artkick and a registration code will appear on screen";
            gotoView(currentView, 'RegCodeInstall');
            console.log("Samsung");
            break;
        case "Roku":
            console.log("Roku");
          //  usermessage("Installing Artkick on " + dialMap[nid]['friendlyName']);
           // selectedPlayers['Roku' + serialnumber] = 1;
           //rememberSelectPlayers(false);
			window.dialLaunchSerial='Roku' + serialnumber;
            dialLaunch(dialMap[nid]['uuid'],dialMap[nid]['friendlyName']);
            //dojo.byId("helpcontents").innerHTML="Install Artkick from the Roku channel store<br>Start Artkick and registration code will display on TV screen";
            //	gotoView(currentView,'RegCodeInstall');
            break;
        case "Sharp":
            console.log("Sharp");
            dojo.byId("helpcontents").innerHTML =
                'Open SmartCentral, click Social and Life icon and click the Artkick icon. A registration code will appear';
            gotoView(currentView, 'RegCodeInstall');
            break;
        case "Apple":
            console.log("Apple");
            dojo.byId("helpcontents").innerHTML =
                'Wipe up from bottom of screen; Tap Airplay';
            gotoView(currentView, 'RegCodeInstall');
            break;
        case "unknown":
        default:
            console.log("default");
            dojo.byId("helpcontents").innerHTML =
                'Install and start Artkick on your display device. A registration code will appear.';
            gotoView(currentView, 'RegCodeInstall');
            break;
    }
}
window.checkDial = function(id)
{
    // check if this player is already registered
    uuid = dialMap[id]["ArtkickID"];
    state = dialMap[id]["state"];
    //console.log("checkdial for id="+id+" uuid:"+uuid+" state="+state);
    // check for appleTV if an Android phone make it go away
    if (dialMap[id]["modelName"] == "Apple TV" && window.platform != "IOS")
        return true;
	if (uuid=='unknown')
		return false;
    for (var i in playerlist)
    {
		if (playerlist[i]['account'].substr(0,6)=="Amazon")
			playerlist[i]['uuid']=playerlist[i]['nickname'];
        //Since there is no uuid for rokus in playerlist then lets put it in
        if (playerlist[i]['uuid'])
        {
            //	console.log("i="+i+ "player="+playerlist[i]['uuid']);
            if (uuid == playerlist[i]['uuid'])
            {
                // this player is registered with artkick so update the status and store the transient uuid so we can do a restart on it
                // get player id
                pid = 'img' + playerlist[i]['account'];
                playerlist[i]['dialuuid'] = dialMap[id]['uuid'];
                if (dialMap[id]['state'])
				{
                    playerlist[i]['state'] = dialMap[id]['state'];
					if (dialMap[id]['state']=='running')
						playerlist[i]['online']=true;
				}
				if (playerlist[i]['state']=="unkown")
					playerlist[i]['state']="unknown";
                //playerlist[i]['state']=state;
                //	console.log("returning true for player:"+playerlist[i]['uuid']);
                return true;
            }
        }
    }
    return false;
}
window.dialReady = function()
{
   // alert("dial ready");
    dijit.registry.byId("ScanNetwork").hide();
    window.firstupdateplayers = false;
    if (window.email)
        updatePlayers();
}

function dialLaunch(uuid,devicename)
{
   // alert("dial launching uuid="+uuid);
    console.log("dialLaunching uuid=" + uuid);
//	usermessage("dialLaunching uuid=" + uuid);
    // set status to running
    for (i in dialMap)
    {
        if (dialMap[i]['uuid'] == uuid)
            dialMap[i]['state'] = "running";
    }
	
	if(runInWebview)
	{

		calliOSFunction("launchApp", [uuid], "onSuccess", "onError");
		try
		{
		
			Android.launchApp(uuid);
		}
		catch (err)
		{};
	}
	dojo.byId("scanid").innerHTML="Installing "+devicename+", Please wait";
	dijit.registry.byId("ScanNetwork").show();

}

function dialUpdate()
{
    // update the state of dial devices, he will call dialsearch when he is done
    console.log("updatestate called");
//	alert("calling dialupdate");
    calliOSFunction("updatestate", [], "onSuccess", "onError");
    try
    {
        Android.updatestate();
    }
    catch (err)
    {};
}

function dialDeletePlayer(uuid)
{
//	alert("dial delete UUID="+uuid);
	calliOSFunction("deletechrome", [uuid], "onSuccess", "onError");
    try
    {
        Android.deletechrome(uuid);
    }
    catch (err)
    {};

}