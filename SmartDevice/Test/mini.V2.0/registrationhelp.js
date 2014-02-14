/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

window.reghelp=function (devicetype)
{

if (devicetype == "Samsung")
myalert('Available in the US on recent Samsung TVs (others soon)<br>Install Artkick from the Samsung Store<br> Access the store by clicking the SmartHub button on your remote, then scroll through the applications and click the Artkick Icon. Start Artkick and a registration code will appear on your screen');

if (devicetype == "Sony")
myalert('Awaiting App Store Approval<br> Install Artkick by first going to the Opera Store. Access the store by clicking the SEN button on your remote, then scroll through the applications and click the Opera Store Icon.  Then search for Artkick and click to install the Artkick application. Start Artkick and a registration code will appear on your screen');
if (devicetype == "Sharp")
myalert('Awaiting Sharp Approval.<br>Install Artkick going to SmartCentral and clicking the Artkick icon. A registration code will appear');
if (devicetype == "AppleTV")
myalert('Open IOS Control Center<br>Tap Airplay<br>Choose which AppleTV & Turn on Airplay Mirroring');

if (devicetype == "Roku")
myalert('Install the Artkick channel on your Roku by searching for Artkick and click to install the Artkick channel. Start Artkick and a registration code will appear on your screen');

if (devicetype == "Browser")
myalert('Use Artkick with any PC/Mac or tablet browser.  Goto browser.artkick.net, enter the email you registered with Artkick and a registration code will appear on your screen');

if (devicetype == "Chromecast")
{
	if (window.BrowserDetect.OS=="Linux")
		myalert('Awaiting Google Approval');
	else
		dijit.registry.byId("registernewTV").performTransition("registernewchromecast", 1, "", null);
}
}