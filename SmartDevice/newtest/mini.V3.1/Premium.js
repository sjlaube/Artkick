/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
function callstore()
{
    hidemenu();
    console.log("loadStore");
    calliOSFunction("loadStore", [], "onSuccess", "onError");
    try
    {
        Android.loadStore();
    }
    catch (err)
    {}
}

function editstore()
{
    hidemenu();
    console.log("editStore");
    calliOSFunction("editStore", [], "onSuccess", "onError");
    try
    {
        Android.share('Check out this great image and thousands more at Artkick', short_url, imageMap[currImage]["thumbnail"], 'Artkick rocks');
    }
    catch (err)
    {}
}

function completeTransaction(id)
{

 //   usermessage("you are now subscribed to "+id);
	gettyDefault(id);
	window.waitingid=id;
	// now wait for the last viewlist to load
	waitfordone();
}

function waitfordone()
{
	if (typeof window.doneid=== 'undefined'||dojo.style(window.doneid,"display")=="none")
	{
	//	console.log("waiting for ");
		setTimeout(waitfordone,1000);
		return;
	}
	console.log("finished");
	delete window.doneid;
	var divs=dojo.byId("gettydefault").getElementsByTagName('div');
	for (var i=0;i<divs.length; i+=1)
	{
		console.log("class="+divs[i].className);
		if(divs[i].className=="gettyDefaultClass5")
			divs[i].innerHTML="";
		if(divs[i].className=="gettyDefaultClass4")
		{
			divs[i].innerHTML="";
			domname=divs[i].id.substr(5);
	
	//dojo.byId(loadingdefaultid).innerHTML="";
	//	dojo.byId(thankyou).innerHTML="";
			var gotobar=dojo.create("div",
			{
				innerHTML: "Go to Getty "+divs[i].id.substr(6),
				className: 'gettyDefaultClass7',
				id:"gdefault"+divs[i].id.substr(6),
				onclick: function()
				{
					window.currCat="Getty "+this.id.substr(8);
					dojo.style(dojo.byId("GettyLoadDefault"), "display", "none");
					window.restart=false;
					gotoCategory(window.currCat);
				
				}

			}, divs[i]);
			blk=dojo.create("div",
			{	
				className: 'gettyDefaultClass8'
			},gotobar);
			dojo.create("img",
			{
				src:'images/getty_g.png',
				width:'25px'
			},blk);
			bcolor="#47c16a";
			if (divs[i].id.substr(6)=="Entertainment")
				bcolor="#a431b2";
			else if (divs[i].id.substr(6)=="News")
				bcolor="#f2ac3d";
			dojo.style(gotobar,"background-color",bcolor);
			}
	}
}

function setSubs(status)
{
    window.gettysubscribe = status;
    if (status)
        usermessage("you are now subscribed to Getty Images");
    dojo.io.script.get(
    {
        url: "http://infinite-anchorage-8570.herokuapp.com/android/setSubs?email=" + window.email + "&token=" + window.token + "&subs=" + status,
        callbackParamName: "callback",
        load: function(result) {}
    });
}
function createoption(segment)
{
	dojo.create("option",
	{
		value:'Getty '+segment,
		label:'Search Getty '+segment
	},'searchSelectValue3');

}

function subscription_categories()
{
// this function hides and unhides category tiles according to what is subscribed 
// and adds the appropriate options to the search button
$("#gettydefault").html('');

	dojo.style('GettyEntertainment-Sample',"display","block");
	dojo.style('GettyNews-Sample',"display","block");	
	dojo.style('GettySports-Sample',"display","block");
	dojo.style('GettyEntertainment',"display","none");
	dojo.style('GettyNews',"display","none");	
	dojo.style('GettySports',"display","none");
if (window.subscriptions.length==0) // no subscriptions, show the samples only
{

	return;
}
if (window.subscriptions.indexOf("Getty_All")>-1)
{
	dojo.style('GettyEntertainment-Sample',"display","none");
	dojo.style('GettyNews-Sample',"display","none");	
	dojo.style('GettySports-Sample',"display","none");	
	dojo.style('GettyEntertainment',"display","block");
	createoption("Entertainment");
	dojo.style('GettyNews',"display","block");	
	createoption("News");
	dojo.style('GettySports',"display","block");
	createoption("Sports");
	return;
}

for (i in subscriptions)
{
	mysub=subscriptions[i].split('_');
	if (mysub[0]=='Getty')
	{
		dojo.style('Getty'+mysub[1],'display','block');
		dojo.style('Getty'+mysub[1]+'-Sample','display','none');
		createoption(mysub[1]);
	}

}
}


function setmysubs(val)
{
	dojo.style('GettyEntertainment-Sample',"display","block");
	dojo.style('GettyNews-Sample',"display","block");	
	dojo.style('GettySports-Sample',"display","block");
	dojo.style('GettyEntertainment',"display","none");
	dojo.style('GettyNews',"display","none");	
	dojo.style('GettySports',"display","none");
/*window.subscriptions=[];
var radioval=document.querySelector('input[name="setsubs"]:checked').value;
console.log("setmysubs="+radioval);
window.subscriptions=[radioval];*/
subscription_categories();
if(val)  // if true then initialize the default viewlists
{
	mysub=radioval.split('_');
	window.subscriptionsNew=mysub[1];

}
refreshView();
}