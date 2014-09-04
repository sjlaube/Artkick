/*
Getty Default functions to support Getty
Reads file and sets up the default viewlists for the user
Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/


window.gettyDefault = function(domain)
{
	url="data/gettyDefault-"+domain+".js";
    $.getJSON(url,function(xx){
		window.gettyDefaultList=xx['items'];
		gotoView(currentView,"GettyLoadDefault");
		window.thankyou=dojo.create("div",
		{
			innerHTML: "Thank you for subscribing to<br>Getty "+domain,
			className: 'gettyDefaultClass4',
			id: 'Class4'+domain

		}, "gettydefault");
		window.loadingdefaultid = dojo.create("div",
		{
			innerHTML: "Loading default Viewlists, please wait...",
			className: 'gettyDefaultClass5'


		}, "gettydefault");
		for (var i in gettyDefaultList)
		{
				
				newgitem=dojo.create("div",{
					className: "gettyDefaultClass6"
				},"gettydefault");
				var title=gettyDefaultList[i]['name'];
/*				if (title.length>30)
					title=title.substr(0,27)+"...";*/

				circle=dojo.create("img",
				{
					src: "images/waitcircle2.gif",
					className: 'gettyDefaultClass2'
				},newgitem);
				
				window.doneid=dojo.create("img",
				{
					src: "images/check.png",
					className: 'gettyDefaultClass2'
				},newgitem);
				dojo.style(doneid,"display", "none");
				var newtxt = dojo.create("div",
				{
					innerHTML: title,
					className: 'gettyDefaultClass'
				}, newgitem);
			doGettySearch(gettyDefaultList[i],domain,circle,doneid,newtxt);

		}
		
		  
	});

	
}

function doGettySearch(term,domain,circle,done,newtxt)
{

console.log('doing search for='+term['name']);

    var url = "http://salty-chamber-1299.herokuapp.com/getty/search2?" + "email=" + window.email 
		+ "&query=" + term['query']
		+ "&token=" + window.token 
		+ "&category=" + domain.toLowerCase()
		+ "&EditorialSegments=" + term['segment']
		+ "&date=" + term['date']
		+ "&orientation=" + term['orientation']
		+ "&name=" + term['name'];
console.log("url="+url);
dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        timeout: 30000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!search" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem91a. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            if (result["Status"] == "success")
			{
				console.log('Added viewlist '+term['name']+" id="+result["listId"]);
				dojo.style(circle,"display", "none");
				dojo.style(done,"display", "block");
			}
		}
	})
}

