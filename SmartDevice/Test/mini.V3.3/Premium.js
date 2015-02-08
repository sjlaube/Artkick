/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
function callstore()
{
    hidemenu();
    console.log("loadStore");
	if (runInWebview)
	{
    calliOSFunction("loadStore", [], "onSuccess", "onError");
    try
    {
        Android.loadStore();
    }
    catch (err)
    {}
	}
}

function editstore()
{
    hidemenu();
    console.log("editStore");
	if (runInWebview)
	{
    calliOSFunction("editStore", [], "onSuccess", "onError");
    try
    {
        Android.editStore();
    }
    catch (err)
    {}
	}
}

function completeTransaction(id,initial,storeEmail,storeToken)
{
	if(id=="Getty_Upgrade")
		standby6.hide();
	else
		standby5.hide();
	
 //   usermessage("you are now subscribed to "+id);

 if (!initial&& storeEmail.indexOf("apple.store")<0)
 {
	usermessage("Successfully renewed "+id);
	refreshView();
	return;
 }
 
 if (!initial && storeEmail.indexOf("apple.store")>-1&&!restoreTrans)
 {
	usermessage("Successfully renewed (as)" +id);
 
 }
 if (window.guest&&storeEmail&&storeToken)
 {
 // user was not logged in when they did the subscription, create cookie
                window.token = storeToken;
                window.userID = storeEmail;
				window.email=storeEmail;
                setCookie("email", storeEmail, 365);
                setCookie("token", storeToken, 365);
				subscriptions[0]=id;
 }
 if (window.restoreTrans)
 {

	usermessage("Artkick subscriptions restored");
	window.restoreTrans=false;
	subscriptions[0]=id;
	refreshView();
	return;
 }
 if (id=="Getty_All2"||id=="Getty_All3"|| id == "Getty_All4")
	id="Getty_All";
	mysub=id.split('_');
	$("#gettydefault").html("");
	newsub=mysub[1];
	if (newsub=="All"&&initial)
	{
		gettyDefault('Entertainment');
		gettyDefault('News');
		gettyDefault('Sports');
		window.waitingid=['Getty','Sports'];

	}

	subscriptions[0]=id;
	subscription_categories();
	//gettyDefault(id);

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
	window.restart=false;
	var divs=dojo.byId("gettydefault").getElementsByTagName('div');
	// make subscribe menu go away since they already subscribed
	dojo.style("inappsubscribe","display","none");
	for (var i=0;i<divs.length; i+=1)
	{
		//console.log("class="+divs[i].className);
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
	window.searchoptionexist += segment;
}

function subscription_categories()
{
// this function hides and unhides category tiles according to what is subscribed 
// and adds the appropriate options to the search button
//$("#gettydefault").html('');

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
	if (window.searchoptionexist.indexOf("Entertainment")<0)
		createoption("Entertainment");
	dojo.style('GettyNews',"display","block");

	if (window.searchoptionexist.indexOf("News")<0)
		createoption("News");
	dojo.style('GettySports',"display","block");
	if (window.searchoptionexist.indexOf("Sports")<0)
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
		if (searchoptionexist!=mysub[1])
			createoption(mysub[1]);
		window.searchoptionexist=mysub[1];
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



if(val)  // if true then initialize then call IOS to do the subscription
{
	console.log("Inapp subscribing to: "+window.newgettysubscription);
	if (window.freeTrialEligible)
		StartFreeTrial(window.newgettysubscription);
	else
		InAppSubscribe(window.newgettysubscription);

}
else // this is an upgrade
{
	InAppSubscribe('Getty_Upgrade');
	console.log("upgrade subscription");
}

}

function InAppSubscribe(which)
{
	console.log ("doing an inapp subscription to "+which);
	if (runInWebview)
	{
	if(which=='Getty_Upgrade')
	{
		standby6.show();
	}
	else
		standby5.show();
		if (window.platform == "IOS")
			usermessage("Waiting for the iTunes Store");
		else if (window.platform == "Android")
			usermessage("Waiting for the Google Play Store");
	calliOSFunction("gettysubscribe", [which], "onSuccess", "onError");
        try
        {
            Android.gettysubscribe(which);
        }
        catch (err)
        {}
	}
	else
	{
	// running in browser so goto website
		open("http://www.artkick.com/subscribe","_blank");
	}
}

window.failTransaction=function()
{
	if (currentView=="InAppSubscribe")
	{
		standby5.hide();
		myalert("Subscription failed");
	}
	else 	if (currentView=="InAppSubscribe2")
	{
		standby6.hide();
		myalert("Subscription upgrade failed");
	}
	else
	{	
		if(window.restoreTrans)
		{
			myalert("Restore purchase failed");
			window.restoreTrans=false;
		}
		else
		{
			myalert("Subscription renewal failed");
		}
		refreshView();

	}
	
}


function DoSubscribe()
{
	console.log ("do subscribe called");
	
		gotoView(window.currentView,'InAppSubscribe');

}

function restoreTransaction()
{
	if (window.platform != "IOS")
		return;
	window.restoreTrans=true;	
		gotoView(window.currentView, 'blankview');
	usermessage("Contacting App Store to restore your subscription");
	calliOSFunction("restoreTransaction", [], "onSuccess", "onError");

}

function StartFreeTrial(what)
{
console.log("starting free trial for: "+what);
var url = base + "client/freeSubs"+ "?email=" + window.email + "&token=" + window.token;
    //alert("feedback:"+url);
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!feedback" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Problem with setting freeSubs. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            //alert("status="+result["message"]);
        }
    });
	standby5.show();
	
	completeTransaction("Getty_All4",true,"test","test");
}

 window.msToTime=function(s)
    {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        s = (s - mins) / 60;
        var hrs = s % 24;
        s = (s - hrs) / 24;
        var days = s;
        //console.log(days+':'+hrs + ':' + mins + ':' + secs + '.' + ms);
        if (days > 0)
            return (days + " day ago");
        else if (hrs > 0)
            return (hrs + " hr ago");
        else if (mins > 0)
            return (mins + " min ago");
        else
            return ("Just now");
    }
	
	
