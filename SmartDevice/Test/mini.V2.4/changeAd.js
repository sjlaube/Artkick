/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

function changeAd()
{  

adbase="images/GettyAds/GettyTrial_";
window.adnumber++;
//console.log("changing ad to "+window.adnumber);
if(window.adnumber>4)
{
	window.adnumber=0;
	clearInterval(window.AdInterval);
	dojo.style("gettyad","display","none");
	}
	dojo.byId("gettyad").setAttribute("src",adbase+window.adnumber+".jpg")
}

function adclick()
{
	gotoView("select_category","GettySubscribe");
}