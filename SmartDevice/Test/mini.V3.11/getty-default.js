/*
Getty Default functions to support Getty
Reads file and sets up the default viewlists for the user
Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/


window.gettyDefault = function(domain)
{

var DefaultEntertainment={
	"items": [
		{"name":"Celebrities","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Celebrities bestof"},
		{"name":"Red Carpet Events","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"bestof Red Carpet Events"},
		{"name":"Backstage Parties","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Backstage Party"},
		{"name":"Emmy Awards","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"66th Annual Primetime Emmy Awards bestof"},
		{"name":"MTV Music Video Awards","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"MTV Music Video Awards bestof"},
		{"name":"New York Fashion Week","segment":"entertainment", "date":"Any",  "orientation":"Any", "query":"bestof New York Fashion Week Catwalk"},
		{"name":"Paris Fashion Week","segment":"entertainment", "date":"Any",  "orientation":"Any", "query":"bestof Paris Fashion Week Catwalk"},
		{"name":"Chanel Couture","segment":"entertainment", "date":"Any",  "orientation":"Any", "query":"Chanel Couture Catwalk Full Length"},
		{"name":"Victoria's Secret Fashion Show","segment":"entertainment", "date":"Any",  "orientation":"Any", "query":"Victoria Secret Fashion Show"},
		{"name":"British Royals","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"bestof British Royals"},
		{"name":"Angelina Jolie","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"bestof Angelina Jolie"},
		{"name":"Taylor Swift","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"bestof Taylor Swift"},
		{"name":"Kate Upton","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Kate Upton"},
		{"name":"Heidi Klum","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Heidi Klum"},
		{"name":"Kim Kardashian","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Kim Kardashian bestof"},
		{"name":"Beyonce","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Beyonce bestof"},
		{"name":"David Beckham","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"David Beckham bestof"},
		{"name":"Ariana Grande","segment":"entertainment", "date":"Any",  "orientation":"horizontal", "query":"Ariana Grande bestof"}
	]
};

var DefaultNews={
	"items": [
		{"name":"Google","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Google"},
		{"name":"Apple Computers","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Apple Computers"},
		{"name":"USA Business","segment":"news", "date":"any",  "orientation":"horizontal", "query":"USA Business"},
		{"name":"Barack Obama","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Barack Obama"},
		{"name":"USA Politics","segment":"news", "date":"any",  "orientation":"horizontal", "query":"USA Politics"},
		{"name":"Europe Politics","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Europe Politics"},
		{"name":"Ukraine","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Ukraine"},
		{"name":"Israel","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Israel"},
		{"name":"Syria","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Syria"},
		{"name":"Crime","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Crime"},
		{"name":"Earthquakes","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Earthquake"},
		{"name":"Crime","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Crime"},
		{"name":"Asia","segment":"news", "date":"any",  "orientation":"horizontal", "query":"Asia"},
		{"name":"Best of News","segment":"news", "date":"any",  "orientation":"horizontal", "query":"bestof News"}
	]
};

var DefaultSports={
	"items": [
		{"name":"Best of Major League Baseball","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"bestof Major league baseball"},
		{"name":"Yankees","segment":"sports", "date":"1D",  "orientation":"horizontal", "query":"Yankees"},
		{"name":"Best of NCAA College Football","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"bestof NCAA college football"},
		{"name":"Florida State Seminoles","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"Florida State Seminoles NCAA college football"},		
		{"name":"Superbowl Halftime Show","segment":"sports", "date":"12M",  "orientation":"horizontal", "query":" Superbowl Halftime Show"},
		{"name":"Dallas Cowboys","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"Dallas cowboys NFL"},
		{"name":"Best of US PGA Tour","segment":"sports", "date":"30D",  "orientation":"horizontal", "query":"bestof US PGA tour"},
		{"name":"Best of Extreme Sports","segment":"sports", "date":"12M",  "orientation":"horizontal", "query":"bestof extreme sports"},
		{"name":"Best of Soccer","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"bestof soccer"},
		{"name":"All Real Madrid","segment":"sports", "date":"any",  "orientation":"horizontal", "query":"Real Madrid"},
		{"name":"Stock Car Racing","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"stock car racing"},
		{"name":"Best of Tennis","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"bestof tennis"},
		{"name":"Best of NBA","segment":"sports", "date":"12M",  "orientation":"horizontal", "query":"bestof NBA"},
		{"name":"F1 Motor Sports","segment":"sports", "date":"30D",  "orientation":"horizontal", "query":"F1 motor sports"},
		{"name":"Best of NFL","segment":"sports", "date":"7D",  "orientation":"horizontal", "query":"bestof NFL"},
		{"name":"Best of Sports","segment":"sports", "date":"12M",  "orientation":"horizontal", "query":"bestpix"},
		{"name":"2014 World Series","segment":"sports", "date":"30D",  "orientation":"horizontal", "query":"Baseball World Series San Francisco Giants"}
	
	]
};


		if (domain=="Entertainment")
			window.gettyDefaultList=DefaultEntertainment['items'];
		else if (domain=="Sports")
			window.gettyDefaultList=DefaultSports['items'];
		else if (domain=="News")
			window.gettyDefaultList=DefaultNews['items'];
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
					className: 'gettyDefaultClass2a'
				},newgitem);
				//dojo.style(doneid,"display", "none");
				var newtxt = dojo.create("div",
				{
					innerHTML: title,
					className: 'gettyDefaultClass'
				}, newgitem);
			doGettySearch(gettyDefaultList[i],domain,circle,doneid,newtxt);

		}
		
		  


	
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

