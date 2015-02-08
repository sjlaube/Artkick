


window.ConnectTV=function()
{
	// now create entries for the dial discovered devices which are not already in players

			dijit.registry.byId('ConnectATV').hide();
			// have to scan local network if never scanned

		  //  playerList3.destroyDescendants();
         //   playerList3.destroyRecursive(true);
            $("#playerList3").html('');

			var whichlist;
			//myalert("dialmap length="+dialMap.length);
			newdevicecnt = 0;
			for (var i in dialMap)
			{
				//alert("checking dialMap with i="+i);
				//console.log("i= "+i);
				console.log("TV: "+dialMap[i]["friendlyName"]);
				//check if it is already registered
				var tvexist = checkDial(i);
				console.log("checkDial for :"+i+" returned:"+tvexist);
				// only show chromecast, roku and artkick screen as autoconnect
				if ((dialMap[i]['modelName'] == "Eureka Dongle" || 
					dialMap[i]['modelName'] == "Chromecast" || 
					dialMap[i]['manufacturer'] == "Roku" || 
					dialMap[i]['manufacturer']=="Artkick" )&&!tvexist)
				{
					iconsrc = 'images/ConnectButton.png';
					// check if this is a 'cast' device
					if (dialMap[i]['modelName'])
					{
						var lix = dojo.create("div",
						{}, "playerList3");

					lix.setAttribute("class","mblListItem2");
				//	 if (window.platform == "Android")
						iconsrc = 'images/connect_streaming.png';

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
					var nam = dojo.create("span",
					{
						id: "dialq" + i,
						className: 'playertitleclass2b',
						innerHTML: dialMap[i]["friendlyName"],
						onclick: function()
						{
							playerInstall(this.id);
						}
					}, lix);
					if (dialMap[i]["originalName"])
						dojo.create("div",
						{
							id: "diale" + i,
							className: 'playertitleclass3a',
							innerHTML: dialMap[i]["originalName"],
							onclick: function()
							{
								playerInstall(this.id);
							}
						}, lix);
					newdevicecnt++;
				}

				//	}
				//else
				//console.log("tvexist was false for :"+dialMap[i]["friendlyName"]);
			}
			if(newdevicecnt==0)
			{
				dojo.style('NoscreensFound','display','block');
				dojo.style('screensFound','display','none');
			}
			else
			{
				dojo.style('NoscreensFound','display','none');
				dojo.style('screensFound','display','block');			
			}

}


function ConnectScreen(type)
{
	// reshow the code and buttons in case user looked at AppleTV last which made them go away
	dojo.style('regPlayerCode2b','display','block');
	dojo.style('ConnectButton','display','block');
	window.NewPlayerName=type;
	switch (type)
	{
		case "SmartTV":
			dojo.style('screentype','display','none');
			dojo.style('SmartTVtype','display','block');			
			break;
		case "Sony":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  Access the Sony Opera Store by clicking the SEN button on your remore, then scroll through the applications and click the Opera Store icon.<p>		<p class="Instruction">2.  Search for Artkick and click to install the Artkick application on your TV</p>		<p class="Instruction">3.  Start the Artkick application on your TV, find the registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="Sony SmartTV";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "Sharp":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  Open SmartCentral by pressing the SmartCentral button on your remote. <p>		<p class="Instruction">2.  Click the Social & Life Icon.</p>		<p class="Instruction">3.  Start the Artkick application on your TV, find the registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="Sharp SmartTV";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "LG":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  Press the SmartTV button on your remote and select "more" at the bottom of the page. <p>		<p class="Instruction">2.  Use Search to locate & install the Artkick application</p>		<p class="Instruction">3.  Start the Artkick application on your TV, find the registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="LG SmartTV";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "Samsung":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  Open SmartHub by pressing the SmartHub button on your remote and then click the Samsung Apps icon.<p>		<p class="Instruction">2.  Search for "Artkick" and then click "Install"</p>		<p class="Instruction">3.  Start the Artkick application on your TV, find the registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="Samsung SmartTV";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "Other":
		case "OtherDevice":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  Find and install the Artkick app for your device/cable box<p>		<p class="Instruction">2.  Start the Artkick application on your TV, find the registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="Other Device";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "ScreenSaver":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  On your personal computer browse to artkick.com/downloads<p>		<p class="Instruction">2.  Click on the appropriate link to download either the PC or MAC screensaver.</p>	<p class="Instruction">3. Open your "Downloads" directory and click on the Artkick software to install it.  It will automatically install as a screensaver.</p><p class="Instruction">4a.  On a PC right-click on the desktop and then click "Personalize."  Then click the "Screen Saver" icon and select "Artkick" as your screensaver and set the wait time to 1 minute.	</p><p class="Instruction">4b. On a Mac open "System Preferences" then click "Desktop & Screensaver."  Scroll to the bottom of the list and select the Artkick screensaver.  Set the time to 1 minute.</p><p class="Instruction">5.  The screensaver will start and display a registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="Screensaver";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "Fire":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  Browse to amazon.com and search for Artkick.<p>		<p class="Instruction">2.  Click on Artkick for FireTV.</p>	<p class="Instruction">3.  On the right side of the screen select your FireTV from the pull down list and click "Deliver". Within a few minutes the Artkick app will appear on your FireTV. </p>	<p class="Instruction">4.  Start the Artkick application on your FireTV, find the registration code, and type it here:</p>';
			dojo.byId("SmartTVName").innerHTML="Amazon FireTV";
			gotoView(currentView,"ConnectSmartTV");
			break;
		case "AppleTV":
			dojo.byId("SmartTVInstructions").innerHTML='<p class="Instruction">1.  AppleTV does not allow 3rd party apps like Artkick.<p>		<p class="Instruction">2. Use can use your AppleTV with Artkick in Airplay mirroring mode.</p>	<p class="Instruction">3. Open the IOS Control Center by swiping up from the bottom of the screen.  </p>	<p class="Instruction">4. Tap Airplay/AppleTV and then turn on Mirroring.</p><p class="Instruction">5. The Artkick images on your phone or tablet will display on your TV.  Artkick slideshow mode does not work with Airplay</p>';
			dojo.byId("SmartTVName").innerHTML="AppleTV";
			dojo.style('regPlayerCode2b','display','none');
			dojo.style('ConnectButton','display','none');

			gotoView(currentView,"ConnectSmartTV");
			break;
	}


}