/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

DIAL related functions

*/
 

window.dialsearch=function(str)
{
// this function calls the dial search to locate devices

if (!str)
jsonStr='[{\"uuid\":\"a43a14a5-2d6c-4f6c-8602-ce9f8aeb3206\",\"friendlyName":\"Vizio DTV\",\"modelName\":\"Vizio_M401i-A3\",\"state\":\"unkown\",\"serialNumber\":\"unknown\",\"IpAddress\":\"192.168.2.154\"},{\"uuid\":\"ce6aa0c9-73a9-4022-8490-b90ba9759cf3\",\"friendlyName":\"Roku 1GH31T024031\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"running\",\"serialNumber\":\"1GH31T024031\",\"IpAddress\":\"192.168.2.159\"},{\"uuid\":\"4d558c9d-9d44-4ac5-b4a2-b709e786bd68\",\"friendlyName":\"Roku 1GG34N047746\",\"modelName\":\"Roku Streaming Player 4200X\",\"state\":\"stopped\",\"serialNumber\":\"1GG34N047746\",\"IpAddress\":\"192.168.2.207\"},{\"uuid\":\"9bd584db-96b1-47db-8b0d-711434e3d385\",\"friendlyName":\"[TV]Samsung LED75\",\"modelName\":\"UN75F6400\",\"state\":\"stopped\",\"serialNumber\":\"20090804RCR\",\"IpAddress\":\"192.168.2.125\"},{\"uuid\":\"bbd2e2a5-a3e5-4753-b04f-f2f533b34c9f\",\"friendlyName":\"Artkick Chromecast1\",\"modelName\":\"Eureka Dongle\",\"state\":\"unkown\",\"serialNumber\":\"02125bb118ebbb8ecd43f46255b0fa0c\",\"IpAddress\":\"192.168.2.242\"},{\"uuid\":\"9724528b-4bb6-4965-8883-abc25339367d\",\"friendlyName":\"Roku 13C1CW090566\",\"modelName\":\"Roku Streaming Player 3100X\",\"state\":\"running\",\"serialNumber\":\"13C1CW090566\",\"IpAddress\":\"192.168.2.142\"},{\"uuid\":\"3a63c902-3f22-4cd9-aa83-b641e3a6ca3e\",\"friendlyName":\"Chromecast EO\",\"modelName\":\"Eureka Dongle\",\"state\":\"unkown\",\"serialNumber\":\"af2249bb907e7e33e9cab2789f721cb6\",\"IpAddress\":\"192.168.2.226\"},{\"uuid\":\"ff7f0629-a40b-4e59-95f1-19b1bc59463d\",\"friendlyName":\"BRAVIA KDL-32W650A\",\"modelName\":\"KDL-32W650A\",\"state\":\"unkown\",\"serialNumber\":\"unkown\",\"IpAddress\":\"192.168.2.200\"},{\"uuid\":\"8c94fc0e-4407-4abc-b9ad-47d84bd17141\",\"friendlyName":\"Roku 1XC396073971\",\"modelName\":\"Roku Streaming Player 2710X\",\"state\":\"running\",\"serialNumber\":\"1XC396073971\",\"IpAddress\":\"192.168.2.244\"},{\"uuid\":\"bc8f7dcb-5989-4cd9-b14b-d35a54ec0c69\",\"friendlyName":\"Apple TV\",\"state\":\"unknown\",\"IpAddress\":\"192.168.2.110\"},{\"uuid\":\"e7c837a0-81fa-4c2f-81be-af9484581908\",\"friendlyName":\"Sheldon\'s Fire TV\",\"modelName\":\"FireTV\",\"state\":\"running\",\"serialNumber\":\"unkown\",\"IpAddress\":\"192.168.2.188\"}]';
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
			if (dialMap[i]["modelName"].toLowerCase().indexOf("fireTV") >-1)
				dialMap[i]["manufacturer"]="Amazon";
			if (dialMap[i]["modelName"].toLowerCase().indexOf("eureka") >-1)
				dialMap[i]["manufacturer"]="Google";
			if (dialMap[i]["modelName"].toLowerCase().indexOf("chromecast") >-1)
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
	dijit.registry.byId("ScanNetwork").hide();
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
	serialnumber=dialMap[nid]['serialNumber'];
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
							
						selectedPlayers['chromecast'+serialnumber] = 1;
						rememberSelectPlayers();
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
						
						selectedPlayers['Roku'+serialnumber] = 1;
						rememberSelectPlayers();
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
	//alert("dial launching uuid="+uuid);
	console.log("dialLaunching uuid="+uuid);
	// set status to running
	for (i in dialMap)
	{
		if (dialMap[i]['uuid']==uuid)
			dialMap[i]['state']="running";
	
	}
	  calliOSFunction("launchApp", [uuid], "onSuccess", "onError");
	try {
		Android.launchApp(uuid);
	}
	catch (err) {};
	//set this as a selected player
	 setTimeout(function () {
		dialUpdate();

	}, 5000);
	setTimeout(function () {

		syncImage();
		updatePlayers();
	}, 5000);
	

}

function dialUpdate()
{
// update the state of dial devices, he will call dialsearch when he is done
console.log("updatestate called");
	 calliOSFunction("updatestate", [], "onSuccess", "onError");
	try {
		Android.updatestate();
	}
	catch (err) {};


}
