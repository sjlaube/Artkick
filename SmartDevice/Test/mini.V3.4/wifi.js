window.wifisearch = function(str)
{
	//myalert("dialsearch");
    // this function calls the dial search to locate devices
    if (!str)
        jsonStr ='[{"ssid":"Saddle23","hasKey":true,"connected":true},{"ssid":"Saddle2","hasKey":true},{"ssid":"DIRECT-roku-970-985519","hasKey":false},{"ssid":"DIRECT-roku-746","hasKey":true},{"ssid":"DIRECT-QW-BRAVIA","hasKey":true},{"ssid":"Saddle2","hasKey":true},{"ssid":"DIRECT-PH-VIZIOTV","hasKey":false},{"ssid":"Saddle3","hasKey":true}]';
	else
        jsonStr = str;
	dijit.registry.byId("ScanNetwork").hide();
	window.indialLaunch=false;
    window.wifiMap = JSON.parse(jsonStr);
//	if (runInWebview)
//		clearInterval(showingScanwifi);
	window.ScanwifiComplete=true;
	var wificnt=0;
	     $("#wifinames").html('');
	//myalert("dialmap length="+wifiMap.length);
    for (var i in wifiMap)
    {
        //console.log("i= "+i);
        console.log("network " + wifiMap[i]["ssid"]);
		iconsrc = 'images/lock.png';
					

					var lix = dojo.create("div",
					{
						id: 'wifiz'+i,
						onclick: function()
						{
							wificonnect(this.id);
							
						}
						
					}, "wifinames");

					lix.setAttribute("class","wifilist");

					iconsrc = 'images/lock.png';
					var nam = dojo.create("span",
					{
						id: "dialq" + i,
						className: 'playertitleclass2a',
						innerHTML: wifiMap[i]["ssid"]

					}, lix);
					if (wifiMap[i]["hasKey"])
					var ico = dojo.create("img",
					{
						id: "wifix" + i,
						className: 'iconclass4',
						zindex: 950,
						src: iconsrc

					}, lix);

					


					wificnt++;
	}

	gotoView(currentView,"select_wifi");

			
}

function wificonnect(pnter)
{
	idx=pnter.substr(5);
	window.ssidconnect=wifiMap[idx]['ssid'];
	dojo.byId('wifipswd').value="";
	//console.log("wifi connect for: "+wifiMap[idx]['ssid']);
	if (wifiMap[idx]['hasKey'])// prompt for wifi password
	{
		dojo.byId("ssidname").innerHTML=wifiMap[idx]['ssid'];
		dijit.registry.byId("wifiPassword").show();
	
	}
	else
		NetworkConnect(false);

}

function NetworkConnect(haspassword)
{
	if (haspassword)
	{
		pwd=dojo.byId('wifipswd').value;
		if (pwd.length=='')
		{
			myalert("password cannot be blank");
			return;
		}
		dijit.registry.byId('wifiPassword').hide();
		//myalert("trying to connect to: "+ssidconnect+" with pwd: "+pwd);
		calliOSFunction("connectWifi", [ssidconnect,window.email,pwd], "onSuccess", "onError");
		try
		{
			Android.connectWiFfi(uuid,email,pwd);
		}
		catch (err)
		{};
	}
	else
	{
		pwd='';
		dijit.registry.byId('wifiPassword').hide();
		calliOSFunction("connectWifi", [ssidconnect,window.email], "onSuccess", "onError");
		try
		{
			Android.connectWiFfi(uuid,window.email);
		}
		catch (err)
		{};
	}
	dojo.byId("scanid").innerHTML="Connecting to wifi network, Please wait";

	dijit.registry.byId("ScanNetwork").show();


	console.log("NetworkConnect for SSID: "+window.ssidconnect+" pwd: "+pwd);


}

window.artkick_notify=function(str)
{
	dijit.registry.byId("ScanNetwork").hide();
	// function called with wifi connect for screen status
    if (!str)
        jsonStr ='{"type":"wificonnection","connected":true}';
	else
        jsonStr = str;
    window.notifyMap = JSON.parse(jsonStr);
	if (notifyMap['type']=="wificonnection" && notifyMap['connected'])
	{
		usermessage("Successfully connected");
		setTimeout(function()
		{
			dijit.registry.byId('wifiPassword').hide();
			if (window.indialLaunch)
			{
				//usermessage("syncing");
				
				updatePlayers(); //don't know why we are doing this here??? because if we just installed the player we need to set the image correctly
			}
			gotoView(currentView,"select_category");
		},3000);
	}
	else if (notifyMap['type']=="wificonnection" && !notifyMap['connected'])
	{
		usermessage("wifi connection failed, try again");
		dojo.byId('wifipswd').value="";
		dijit.registry.byId('wifiPassword').show();
	}
		
}
