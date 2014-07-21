/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

DIAL related functions

*/
 

window.dialsearch=function(str)
{
// this function calls the dial search to locate devices

if (!str)
//	jsonStr = '[{\"uuid\":\"f5437504-52b9-4044-abed-f2643ab34b2d\",\"friendlyName":\"Sheldon\'s Fire TV\",\"modelName\":\"FireTV\",\"state\":\"stopped\",\"IpAddress\":\"192.168.2.188\"},{\"uuid\":\"9622a2f9-0916-4bdb-96bb-5b2482b03fca\",\"friendlyName":\"Roku Streaming Player\",\"modelName\":\"Roku Streaming Player 3100X\",\"state\":\"stopped\",\"serialNumber\":\"13C1CW090566\",\"IpAddress\":\"192.168.2.142\"},{\"uuid\":\"e63e3d42-f299-478a-9018-68c5f8cc9a4e\",\"friendlyName":\"Roku Streaming Player 1XC396073971\",\"modelName\":\"Roku Streaming Player 2710X\",\"state\":\"running\",\"serialNumber\":\"1XC396073971\",\"IpAddress\":\"192.168.2.244\"},{\"uuid\":\"d508101b-ddbf-43e1-a8c2-075df7c47c39\",\"friendlyName":\"Roku Streaming Player\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"running\",\"serialNumber\":\"1GH31T024031\",\"IpAddress\":\"192.168.2.159\"},{\"uuid\":\"a713bfa0-e7ab-450a-843b-7c0cb997b1c3\",\"friendlyName":\"[TV]Samsung LED75\",\"modelName\":\"UN75F6400\",\"state\":\"stopped\",\"serialNumber\":\"20090804RCR\",\"IpAddress\":\"192.168.2.125\"},{\"uuid\":\"a1a64d52-5ba5-464b-93a0-8f99b2a3174e\",\"friendlyName":\"AQUOS C6500U\",\"modelName\":\"C6500U\",\"state\":\"unknown\",\"IpAddress\":\"192.168.2.170\"},{\"uuid\":\"544e4eec-1bcf-4c8a-ac11-684aeaf4e415\",\"friendlyName":\"Vizio DTV\",\"modelName\":\"Vizio_M401i-A3\",\"state\":\"unknown\",\"IpAddress\":\"192.168.2.152\"},{\"uuid\":\"6f039e74-f570-4be3-ac88-f6bdc187e1c4\",\"friendlyName":\"Roku Streaming Player\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"stopped\",\"serialNumber\":\"1GG34N047746\",\"IpAddress\":\"192.168.2.207\"},{\"uuid\":\"a0dab4ad-1c72-49e1-ab2a-f98b70cea5e8\",\"friendlyName":\"Artkick Chromecast1\",\"modelName\":\"Chromecast\",\"state\":\"stopped\",\"IpAddress\":\"192.168.2.242\"},{\"uuid\":\"bc282ccc-ae48-4e29-8a6e-7541c4a9d8ef\",\"friendlyName":\"Apple TV\",\"state\":\"unknown\",\"IpAddress\":\"192.168.2.110\"}]';
	jsonStr='[{\"uuid\":\"3dac8a03-9ae4-4d62-8703-4e50d3627d23\",\"friendlyName":\"Sheldon\'s Fire TV\",\"modelName\":\"FireTV\",\"state\":\"stopped\",\"IpAddress\":\"192.168.2.188\"},{\"uuid\":\"68196aeb-b8bc-45e1-bc78-5d4df1d29f07\",\"friendlyName":\"Roku Streaming Player 13C1CW090566\",\"modelName\":\"Roku Streaming Player 3100X\",\"state\":\"stopped\",\"serialNumber\":\"13C1CW090566\",\"IpAddress\":\"192.168.2.142\"},{\"uuid\":\"04eb1955-13d8-4540-bc6b-c354effb7006\",\"friendlyName":\"Roku Streaming Player 1XC396073971\",\"modelName\":\"Roku Streaming Player 2710X\",\"state\":\"running\",\"serialNumber\":\"1XC396073971\",\"IpAddress\":\"192.168.2.244\"},{\"uuid\":\"ad7666fe-b20a-4c83-a095-510dce0857e7\",\"friendlyName":\"Roku Streaming Player\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"running\",\"serialNumber\":\"1GH31T024031\",\"IpAddress\":\"192.168.2.159\"},{\"uuid\":\"fff43b92-3460-4978-b916-fbaf01ecaeb5\",\"friendlyName":\"[TV]Samsung LED75\",\"modelName\":\"UN75F6400\",\"state\":\"stopped\",\"serialNumber\":\"20090804RCR\",\"IpAddress\":\"192.168.2.125\"},{\"uuid\":\"7fe4c8e8-677b-4431-9b23-4bbb4106f5c9\",\"friendlyName":\"Roku Streaming Player\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"stopped\",\"serialNumber\":\"1GG34N047746\",\"IpAddress\":\"192.168.2.207\"},{\"uuid\":\"90c0403c-11d5-4ffe-82a8-08fe6259975b\",\"friendlyName":\"Artkick Chromecast1\",\"modelName\":\"Eureka Dongle\",\"state\":\"unknown\",\"serialNumber\":\"02125bb118ebbb8ecd43f46255b0fa0c\",\"IpAddress\":\"192.168.2.242\"},{\"uuid\":\"999677ab-b309-4a4e-b9ce-884928e9b47c\",\"friendlyName":\"Apple TV\",\"IpAddress\":\"192.168.2.110\"}]';
else

		jsonStr = str;
	window.dialMap = JSON.parse(jsonStr);
//	alert("dialmap length="+dialMap.length);
	for (var i in dialMap) {
		//console.log("i= "+i);
		console.log("TV: "+dialMap[i]["friendlyName"]);
		// lets see if we can determine manufacturer
		if (dialMap[i]["friendlyName"].indexOf("Roku") >-1)
			dialMap[i]["manufacturer"]="Roku";

		if (dialMap[i]["friendlyName"].indexOf("Samsung") >-1)
			dialMap[i]["manufacturer"]="Samsung";
		if (dialMap[i]["friendlyName"].indexOf("AQUOS") >-1)
			dialMap[i]["manufacturer"]="Sharp";
		if (dialMap[i]["friendlyName"].indexOf("Vizio") >-1)
			dialMap[i]["manufacturer"]="Vizio";
		if (dialMap[i]["friendlyName"].indexOf("Roku") >-1)
			dialMap[i]["manufacturer"]="Roku";
		if (dialMap[i]["friendlyName"].indexOf("Apple") >-1)
		{
			dialMap[i]["manufacturer"]="Apple";
			dialMap[i]['modelName']="Apple TV";
		}
		if (dialMap[i]["modelName"]){	
			if (dialMap[i]["modelName"].indexOf("FireTV") >-1)
				dialMap[i]["manufacturer"]="Amazon";
			if (dialMap[i]["modelName"].indexOf("Eureka") >-1)
				dialMap[i]["manufacturer"]="Google";
			
		}
		// now lets figure out if there is a unique serial number for this
		if (!dialMap[i]['ArtkickID'])
		{
			if (dialMap[i]['serialNumber'])
				dialMap[i]['ArtkickID']=dialMap[i]['serialNumber'];
			else
				if (dialMap[i]['modelName']) // see if this is unique
				{
				
					if(modelnamecount(dialMap[i]['modelName'])==1)
						dialMap[i]['ArtkickID']=dialMap[i]['modelName'];
					else
						dialMap[i]['ArtkickID']=dialMap[i]['modelName']+dialMap[i]['IpAddress'];
				
				}
				else
					dialMap[i]['ArtkickID']=dialMap[i]['IpAddress'];
		}
		
	}
}
function modelnamecount(id)
{
	var modelcount=0;
	for (var i in dialMap)
	{
		if (id==dialMap[i]['modelName'])
			modelcount++
	
	}
	return(modelcount);

}
function playerInstall(id)
{
window.playeruuid="unknown";
if (id!="unknown")
{
	nid=id.substr(5);
	swid=dialMap[nid]["manufacturer"];
	console.log("installing "+nid+" "+dialMap[nid]["friendlyName"]);
	dojo.byId('regPlayerName2').value=dialMap[nid]["friendlyName"];
	dijit.byId("tvinstallheading").set("label","Connect "+swid);
	window.playeruuid=dialMap[nid]["ArtkickID"];
	
}
else
{
	swid=id;
	dijit.byId("tvinstallheading").set("label","Connect Display");
	dojo.byId('regPlayerName2').value="";
}



switch(swid)
				{
					case "Amazon":
						console.log("Amazon");
						dojo.byId("helpcontents").innerHTML=
						"Goto amazon.com and search for 'Artkick for FireTV'.<br>Click the 'Install/deliver' button which will install Artkick on your FireTV.<br>Click on Artkick using your FireTV remote control and a registration code will appear on your TV.";
						gotoView(currentView,'RegCodeInstall');
						break;
					case "Vizio":
						console.log("Vizio");
						break;
					case "Google":
						console.log("Chromecast");
						usermessage("Installing Artkick on "+dialMap[nid]['friendlyName']);
						dialLaunch(dialMap[nid]['uuid']);	
						break;
					case  "Samsung":
						dojo.byId("helpcontents").innerHTML=
"Install Artkick from the Samsung Store.<br> Access the store by clicking the SmartHub button remote, scroll through the applications and click the Artkick Icon. <br> Start Artkick and a registration code will appear on screen";
						gotoView(currentView,'RegCodeInstall');
						console.log("Samsung");
						break;
					case "Roku":
						console.log("Roku");
						usermessage("Installing Artkick on "+dialMap[nid]['friendlyName']);
						dialLaunch(dialMap[nid]['uuid']);
						//dojo.byId("helpcontents").innerHTML="Install Artkick from the Roku channel store<br>Start Artkick and registration code will display on TV screen";
					//	gotoView(currentView,'RegCodeInstall');
						break;
					case "Sharp":
						console.log("Sharp");
						dojo.byId("helpcontents").innerHTML=
						'Open SmartCentral, click Social and Life icon and click the Artkick icon. A registration code will appear';
						gotoView(currentView,'RegCodeInstall');
						break;
					case "Apple":
						console.log("Apple");
						dojo.byId("helpcontents").innerHTML=
						'Wipe up from bottom of screen; Tap Airplay';
						gotoView(currentView,'RegCodeInstall');
						break;
					case "unknown":
					default:
						console.log("default");
						dojo.byId("helpcontents").innerHTML=
						'Install and start Artkick on your display device. A registration code will appear.';
						gotoView(currentView,'RegCodeInstall');
						break;
			
				}
				
}

window.checkDial=function(id)
{
// check if this player is already registered

	uuid=dialMap[id]["ArtkickID"];
state=dialMap[id]["state"];
//console.log("checkdial for id="+id+" uuid:"+uuid+" state="+state);

// check for appleTV if an Android phone make it go away
if (dialMap[id]["modelName"]=="Apple TV" && window.BrowserDetect.OS.substr(0,6)!="iPhone")
	return true;
	

for (var i in playerlist)
{ 
	//Since there is no uuid for rokus in playerlist then lets put it in
	if (playerlist[i]['account'].substr(0,4)=='Roku')
	{
		playerlist[i]['uuid']=playerlist[i]['account'].substr(4);
	}
	if (playerlist[i]['uuid'])
	{
	//	console.log("i="+i+ "player="+playerlist[i]['uuid']);
		if (uuid==playerlist[i]['uuid'])
		{
			// this player is registered with artkick so update the status and store the transient uuid so we can do a restart on it
			// get player id
			pid='img'+playerlist[i]['account'];
			
			
			playerlist[i]['dialuuid']=dialMap[id]['uuid'];
			if (dialMap[id]['state'])
				playerlist[i]['state']=dialMap[id]['state'];
			//playerlist[i]['state']=state;
		//	console.log("returning true for player:"+playerlist[i]['uuid']);
			return true;
		}	
	} 
	
	
}
return false;
}
window.dialReady=function()
{
//alert("dial ready");
	dijit.registry.byId("ScanNetwork").hide();
	window.firstupdateplayers=false;
	if(window.email)
		updatePlayers();
}

function dialLaunch(uuid)
{
	console.log("dial launching uuid="+uuid);
	try {
		Android.launchApp(uuid);
	}
	catch (err) {};
	 setTimeout(function () {
		updatePlayers()
	}, 5000);

}
