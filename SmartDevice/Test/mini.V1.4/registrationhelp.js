/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/

window.reghelp=function (devicetype)
{

if (devicetype == "Samsung")
myalert('Install Artkick by first going to the Samsung Store. Access the store by clicking the SmartHub button on your remote, then scroll through the applications and click the Artkick Icon. Start Artkick and a registration code will appear on your screen');

if (devicetype == "Sony")
myalert('Awaiting Sony App Store Approval Install Artkick by first going to the Opera Store. Access the store by clicking the SEN button on your remote, then scroll through the applications and click the Opera Store Icon.  Then search for Artkick and click to install the Artkick application. Start Artkick and a registration code will appear on your screen');


if (devicetype == "Roku")
myalert('Install the Artkick channel on your Roku by searching for Artkick and click to install the Artkick channel. Start Artkick and a registration code will appear on your screen');

if (devicetype == "Browser")
myalert('Use Artkick with any PC/Mac or tablet browser.  Goto browser.artkick.net, enter the email you registered with Artkick and a registration code will appear on your screen');

if (devicetype == "Chromecast")
{
myalert('Awaiting Google Approval -- Install the Artkick channel on your Chromecast');
dijit.registry.byId("registrationHelp").performTransition("registernewchromecast", 1, "", null);
}
}