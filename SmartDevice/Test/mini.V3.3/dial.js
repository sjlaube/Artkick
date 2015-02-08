/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

DIAL related functions

*/
window.dialsearch = function(str)
{
	//myalert("dialsearch");
    // this function calls the dial search to locate devices
    if (!str)
        jsonStr ='[{\"uuid\":\"af2249bb-907e-7e33-e9ca-b2789f721cb6\",\"friendlyName":\"Chromecast EO\",\"modelName\":\"Eureka Dongle\",\"state\":\"running\",\"serialNumber\":\"af2249bb907e7e33e9cab2789f721cb6\",\"IpAddress\":\"192.168.2.228\"},{\"uuid\":\"01a130c9-2401-1025-8029-b83e59ec86e3\",\"originalName":\"Roku 1XC399075049\",\"friendlyName":\"Family room roku\",\"modelName\":\"Roku Streaming Player 2710X\",\"state\":\"running\",\"serialNumber\":\"1XC399075049\",\"IpAddress\":\"192.168.2.190\"},{\"uuid\":\"02706104-1801-1019-8022-b0a737125377\",\"originalName":\"Roku 2L6446071970\",\"friendlyName":\"Guest bedroom Roku2\",\"modelName\":\"Roku Stick\",\"state\":\"stopped\",\"serialNumber\":\"2L6446071970\",\"IpAddress\":\"192.168.2.143\"},{\"uuid\":\"01a130c9-1801-1020-80f3-b83e59ec760b\",\"originalName":\"Roku 1XC396073971\",\"friendlyName":\"Nancy\'s Office\",\"modelName\":\"Roku Streaming Player 2710X\",\"state\":\"running\",\"serialNumber\":\"1XC396073971\",\"IpAddress\":\"192.168.2.126\"},{\"uuid\":\"015d80c1-9000-105d-80df-b83e591640e1\",\"friendlyName":\"Roku 1GH31T024031\",\"modelName\":\"Roku 3\",\"state\":\"stopped\",\"serialNumber\":\"1GH31T024031\",\"IpAddress\":\"192.168.2.135\"},{\"uuid\":\"010d3053-9c01-1061-80c6-cc6da03af95d\",\"originalName":\"Roku 13C1CW090566\",\"friendlyName":\"Game room Roku\",\"modelName\":\"Roku Streaming Player 3100X\",\"state\":\"running\",\"serialNumber\":\"13C1CW090566\",\"IpAddress\":\"192.168.2.122\"},{\"uuid\":\"015d70c4-7800-10ba-8082-b83e593b7e51\",\"originalName":\"Roku 1GG34N047746\",\"friendlyName":\"Artkick Office Roku\",\"modelName\":\"Roku 3\",\"state\":\"running\",\"serialNumber\":\"1GG34N047746\",\"IpAddress\":\"192.168.2.218\"},{\"uuid\":\"fa0afb3d-17e7-2b96-0000-0000019acabf\",\"friendlyName":\"Sheldon\'s Fire TV\",\"modelName\":\"FireTV\",\"state\":\"unknown\",\"serialNumber\":\"Sheldon\'s Fire TV\",\"IpAddress\":\"192.168.2.192\"},{\"uuid\":\"c0e8cf53-a757-309c-ba2e-36f59e0ad101\",\"friendlyName":\"Shel\'s Office\",\"modelName\":\"Eureka Dongle\",\"state\":\"running\",\"serialNumber\":\"c0e8cf53a757309cba2e36f59e0ad101\",\"IpAddress\":\"192.168.2.132\"},{"uuid":"582F7F3F-D867-DE98-BE41-E1CCBF15CFF9", "friendlyName":"Artkick Screen 1ZGI","modelName":"Artkick", "state":"running","serialNumber":"b827eb823348","manufacturer":"Artkick"},{"uuid":"7E04EB2C-B69C-EADD-CCB5-41FD59FCA03D", "friendlyName":"Artkick Screen XE0W","modelName":"Artkick", "state":"stopped","serialNumber":"b827ebc458c0","manufacturer":"Artkick"}]';

		else
        jsonStr = str;
    window.dialMap = JSON.parse(jsonStr);
	if (runInWebview)
		clearInterval(showingScanNetwork);
	window.ScanNetworkComplete=true;

   //myalert("dialmap length="+dialMap.length);
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
			if (dialMap[i]["modelName"].toLowerCase().indexOf("roku") > -1)
				dialMap[i]["manufacturer"] = "Roku";
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
	if(playertoView == "select_player2")
		updatePlayers();
	else if(playertoView == "select_player3")
		ConnectTV();
	if (window.indialLaunch)
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
		dojo.byId("screenIDcode").innerHTML=dialMap[nid]["friendlyName"];
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
		case "Artkick":
            console.log("Artkick screen");
          //  usermessage("Installing Artkick on " + dialMap[nid]['friendlyName']);
          //  selectedPlayers['chromecast' + serialnumber] = 1;
           // rememberSelectPlayers(false);
			window.dialLaunchSerial='artkick' + serialnumber;
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
    if ((dialMap[id]["modelName"] == "Apple TV"||dialMap[id]["friendlyName"] == "Apple TV") && window.platform != "IOS")
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
				if(dialMap[id]['originalName'])
					playerlist[i]['originalName']=dialMap[id]['originalName'];
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
	{
		myalert("dialready, calling updateplayers");
        updatePlayers();
	}
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
	dojo.byId("scanid").innerHTML="Installing "+devicename+", Please wait uuid="+uuid;
	window.indialLaunch=true;
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
//myalert("dial delete UUID="+uuid);
	calliOSFunction("deletechrome", [uuid], "onSuccess", "onError");
    try
    {
        Android.deletechrome(uuid);
    }
    catch (err)
    {};

}