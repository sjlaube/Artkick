/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
function changeAd()
{
    adbase = "http://prod.artkick.net/images/GettyAds/GettyTrial_";
    window.adnumber++;
    //console.log("changing ad to "+window.adnumber);
    if (window.adnumber > 3)
    {
        window.adnumber = 0;
        clearInterval(window.AdInterval);
        dojo.style("gettyad", "display", "none");
		//popGettyAd();//for testing only
    }
    dojo.byId("gettyad").setAttribute("src", adbase + window.adnumber + ".jpg")
}

function adclick()
{
    gotoView("select_category", "GettySubscribe");
}

function popGettyAd()
{
	var idx=currCat.indexOf("Sample-Getty");
	if (idx>-1)
	{//we are in a getty sample, figure out which one and pop right ad
		gettycat=currCat.substr(13).toLowerCase();
		url="http://prod.artkick.net/images/GettyAds/browser/"+gettycat;
		dojo.byId("gettyPopUpAd").setAttribute("src", url + ".png");
	
	}
	else if(imageMap[currImage]['Source']=='gettyimages' && imageMap[currImage]['gettyDomain'] !='')
	{
	// now check the source of the image and show that ad
		
		url="http://prod.artkick.net/images/GettyAds/browser/"+imageMap[currImage]['gettyDomain'].toLowerCase();
		dojo.byId("gettyPopUpAd").setAttribute("src", url + ".png");
	}
	else
	{// somewhere else so pop up the bundle ad
		dojo.byId("gettyPopUpAd").setAttribute("src","http://prod.artkick.net/images/GettyAds/browser/all.png");
	}
	// now calculate the location to place the buttons
	if(!window.computer)
	{
		var wid=Math.min(699,window.bodywidth);
		dojo.style("gettyPopUpAd","width",wid+"px");
	}
	dojo.style("gettyoverlayback","display","block");
	checkload();
		


}
function checkload()
{
		loc=dojo.byId("gettyPopUpAd").getBoundingClientRect();
		if (loc.height==0)
			setTimeout(checkload,500);
		else
		{
			placeSubscribe();
		}
}

window.placeSubscribe=function()
{
			window.adlocation=dojo.byId("gettyPopUpAd").getBoundingClientRect();

			if (window.computer)
			{
				dojo.style("gettyPopUpSubscribe","top",adlocation.height-100+"px");	
				dojo.style("gettyPopUpSubscribe","left",adlocation.left+18+"px");	
				
				
				dojo.style("gettyPopUpNothanks","top",adlocation.height-55+"px");	
				dojo.style("gettyPopUpNothanks","left",adlocation.left+18+"px");
			}
			else
			{
				var wid=Math.min(699,window.bodywidth);
			//	alert("height="+adlocation.height+ "width="+wid);
				dojo.style("gettyPopUpSubscribe","font-size","15px");	
				dojo.style("gettyPopUpSubscribe","top",adlocation.height-62+"px");	
				dojo.style("gettyPopUpSubscribe","left",adlocation.left+18+"px");	
				
				dojo.style("gettyPopUpNothanks","font-size","12px");	
				dojo.style("gettyPopUpNothanks","top",adlocation.height-38+"px");	
				dojo.style("gettyPopUpNothanks","left",adlocation.left+18+"px");
			}

}