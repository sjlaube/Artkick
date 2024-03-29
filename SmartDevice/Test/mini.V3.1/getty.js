/*
GettySearch functions to support Getty
Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
window.gettySearch = function()
{
    gettyReset();
    gotoView('select_category', 'GettyView');
}

function gettysearchclick()
{
    dojo.style("gettyadvanced", "display", "block");
    //	dojo.style("editorialselected","display","block");
    //	dojo.style("creativeselected","display","none");
    //	dojo.style("prevGettySearches","display","block");
    $("#prevGettySearches").html('');
    progressBar2.set("value", 0);
    progressBar2.set("label", "0%");
    dojo.byId("gettynumberdelete").innerHTML = "Tap image to remove&nbsp&nbsp";
    dojo.style("gettynumberdelete", "display", "none");
    window.itemstodelete = 0;
    /* show the previous searches */
    for (var i in previousgettysearch)
    {
        var segment = "Editorial";
        if (previousgettysearch[i]["EditorialSegments"] == "Creative")
            segment = "Creative";
        var pgsearch = previousgettysearch[i]["query"] +
            " <small>(" + segment +
            "," + previousgettysearch[i]["orientation"] + "," + previousgettysearch[i]["date"] + ")</small>";
        console.log("pg:" + pgsearch);
        var myButton = dojo.create("div",
        {
            id: 'getty' + i,
            innerHTML: "<a style='font-size:12px'>&nbsp;&nbsp" + pgsearch + "<br></a>",
            onclick: function()
            {
                loadgettysearch(this.id);
            }
        }, "prevGettySearches");
    };
}

function loadgettysearch(id)
{
    id = id.substr(5);
    console.log("loaded getty search for:" + id);
    window.gettylastQuery = previousgettysearch[id]["query"];
    window.gettyEditorial = previousgettysearch[id]["EditorialSegments"];
    window.gettyEditorialTime = previousgettysearch[id]["date"];
    window.gettyEditorialOrientation = previousgettysearch[id]["orientation"];
    $("#editorialValue").val(gettyEditorial);
    $("#dateValue").val(gettyEditorialTime);
    $("#orientationValue").val(gettyEditorialOrientation);
    dojo.byId("gettysearchbox").value = window.gettylastQuery;
    setEditorial(window.gettyEditorial);
    //gettyusersearch();
}

 window.gettyusersearch=function()
{
    var searchstring;
    console.log("gettyusersearch");
    var currTime = new Date().getTime();
    if (window.searchClickTime != undefined && currTime - window.searchClickTime < 7000)
        return;
    window.searchClickTime = currTime;
    searchstring = dojo.byId("searchbox2").value;
    if (searchstring == "" && window.gettylastQuery == "") return;
    if (searchstring == "")
    {
        searchstring = window.gettylastQuery;
        dojo.byId("gettysearchbox").value = searchstring;
        window.gettylastQuery = "";
    }
    //dojo.style("gettyadvanced","display","none");
    //dojo.style("prevGettySearches","display","none");
    /*	if(window.newgettylist) // create a new getty viewlist for this user
    	{
    		var templistid=window.lastgettylist++;
    		
    		lid='0'+templistid.toString();
    	}
    	else
    	{*/
	gettyEditorial=gettydomain;
    //dijit.registry.byId('SearchBox').hide();
  //  $("#IVGettySearchBox").css("top", "41px");
	if (window.gettyBestOf =="Bestof")
	{	
		if (searchstring.indexOf("bestof")<0) //only add bestof if it is not there
			searchstring +=" bestof";
	}
    var url = "http://salty-chamber-1299.herokuapp.com/getty/search2?" + "email=" + window.email 
		+ "&query=" + searchstring 
		+ "&token=" + window.token 
//		+ "&listId=getty_" + lid 
//		+ "_" + window.email 
		+ "&category=" + window.gettydomain
		+ "&EditorialSegments=" + window.gettyEditorial
		+ "&date=" + window.gettyEditorialTime 
		+ "&orientation=" + gettyEditorialOrientation;
		
		
	if (replacesearchID&&window.replacesearchID!="") // replace this search
		url += "&listId="+window.replacesearchID;
    console.log("searching getty for:" + url);
    v = 0;
	dojo.style('searchprogressdiv',"display","block");
    var timer = setInterval(function()
    {
        progressBar2.set("value", v);
        progressBar2.set("label", v + "%");
        if (v >= 100)
        {
            clearTimeout(timer);
        }
        v += 10;
    }, 750);
    //alert("gettysearch called:"+url);
    //dojo.empty(Gettygrid);
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
                alert("Network problem91. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                dojo.style('searchprogressdiv',"display","none");
						dojo.byId('searchresults').innerHTML=result["imageNum"]+" images found";
						dojo.style('searchresults',"display","block");
              //  usermessage(result["imageNum"]+' images found"');
                //console.log("test123");
				window.replacesearchID='';
               // dijit.registry.byId('IVGettySearchBox').hide();
               // dijit.registry.byId('SearchBox').hide();
				gotoView(window.currentView, "SearchView");
               $("#searchGrid").css("top", "210px");
                window.IVsearchboxshow = false;
                //	swapview(result["listId"]);
         //       window.gname = result['viewlist']['name'];
           //     window.gimage = result['viewlist']['coverImage'];
                progressBar2.set("value", 100);
                progressBar2.set("label", "Complete");
                clearTimeout(timer);
                window.currList = result["id"];
              //  window.currCat = "My Searches";
				window.currCat="Getty News";
				if (gettydomain=="sports")
					window.currCat="Getty Sports";
				if (gettydomain=="entertainment")
					window.currCat="Getty Entertainment";
                window.currViewList = "Last Getty Search";
                window.currGridList = -1;
                window.moregridpages = false;
                //      gotoView(window.currentView, 'blankview');
                //	window.switchView = true;
                //   updateImages(-1);
                //usermessage(result["imageNum"] + ' images found for:"' + searchstring + '"');
                if (result["imageNum"] > 0)
                {
                    loadGrid(0, searchGrid, result["listId"]);

                }
                //	gettyload();
                //	previousgettysearch.push( {query:searchstring, EditorialSegments:window.EditorialSegments, orientation:window.gettyEditorialOrientation, date:window.gettyEditorialTime});
            }
            else if (result["Message"]=="no image found!")
			{					
				dojo.style('searchprogressdiv',"display","none");		
				dojo.byId('searchresults').innerHTML="No matching images found";
				dojo.style('searchresults',"display","block");
                progressBar2.set("value", 100);
                progressBar2.set("label", "Complete");
                clearTimeout(timer);			
			
			}
			else
            {
                progressBar2.set("value", 100);
                progressBar2.set("label", "Complete");
                clearTimeout(timer);
                myalert(result["Message"]);
            }
					if (currentView=="ImageView")
						dojo.style("SearchBox","top","60px");
					else
						dojo.style("SearchBox","top","50px");
        }
    });
}

function setEditorial(etype)
{
    console.log("Editorial search domain: " + etype);
    window.gettyEditorial = etype;
    if (etype == "Any")
    {
        dojo.style("editorialselected", "display", "block");
        dojo.style("creativeselected", "display", "none");
        dojo.style("EditorialTime", "display", "block");
        dojo.style("orientationValue", "top", "-16px");
    }
    else
    {
        dojo.style("creativeselected", "display", "block");
        dojo.style("editorialselected", "display", "none");
        dojo.style("EditorialTime", "display", "none");
        dojo.style("orientationValue", "top", "9px");
    }
}

function setEditorialTime(etype)
{
    console.log("Editorial search domain: " + etype);
    window.gettyEditorialTime = etype;
}

function setEditorialOrientation(etype)
{
    console.log("Editorial search domain: " + etype);
    window.gettyEditorialOrientation = etype;
}
function setBestOf(etype)
{
	if (etype=="Bestof")
		console.log ("Bestof set");
	else
		console.log("Recent set");
	window.gettyBestOf = etype;

}
window.gettyReset = function()
{
    $("#editorialValue").val("Any");
    $("#dateValue").val("Any");
    $("#orientationValue").val("horizontal");
	$("#BestOfVAlue").val("Bestof");
	window.bestofflag=false;
	bestofswitch();
    window.gettyEditorial = "Any";
    window.gettyEditorialTime = "Any";
    window.gettyEditorialOrientation = "horizontal";
	window.gettyBestOf = "Bestof";
    dojo.empty(Gettygrid);
    dojo.byId("gettysearchbox").value = "";
    gettyView.scrollTo(
    {
        y: 0
    });
    progressBar2.set("value", 0);
    progressBar2.set("label", "0%");
    window.itemstodelete = 0;
    dojo.style("gettyadvanced", "display", "none");;
    dojo.style("editorialselected", "display", "block");
    dojo.style("creativeselected", "display", "none");
    dojo.byId("gettynumberdelete").innerHTML = "Tap image to remove&nbsp&nbsp";
    dojo.style("gettynumberdelete", "display", "none");
    //	dojo.style("prevGettySearches","display","none");
}

function gettyload()
{
    //dojo.byId("gettynumberdelete").innerHTML="Tap image to remove&nbsp&nbsp";
    //dojo.style("gettynumberdelete","display","block");
    //editviewlist();
    loadGrid(0, Gettygrid,window.currList);
}

function gettyuserrefresh(newlist)
{
    console.log("getty user refresh hit, newlist:" + newlist);
	if(window.guest)
	{
	    guestmessage();
        window.guestmenu = true;
        return;
	}
	if(window.searchboxshow)
	{
		hidemenu();
		return;
	}
	if (window.wipemenu)
		showmenu();
	

	// check if this is an existing search and prefill in stuff
	window.newgettylist = false;


	if(searchtermindex!="")
	{
		searchterm=lists[searchtermindex]["searchTerm"];
		if (searchterm)
		{
			if (currCat.substr(0,5)=="Getty")
			{
				//$("#editorialValue").val(searchterm["EditorialSegments"]);
				$("#dateValue").val(searchterm["date"]);
				$("#orientationValue").val(searchterm['orientation']);
				mybest=searchterm["query"].indexOf("bestof")>-1;
				var hrsw = dijit.registry.byId("bestof-switch");
				if (mybest)
				{
					window.bestofflag = true;
					hrsw.set('label', "On");
					window.gettyBestOf = "Bestof";
				}
				else
				{
				    hrsw.set('label', "Off");
					window.bestofflag = false;
					window.gettyBestOf = "";
				}
				dojo.byId("searchbox2").value = searchterm["query"].replace("bestof","");
				
				$("#searchSelectValue3").val(currCat);
			}
			else
			{
				dojo.byId("searchbox2").value = searchterm["query"];
				$("#searchSelectValue3").val("Artkick");				
			}
		}
	}

    if (currCat.substr(0,5)=="Getty")
	{
		window.gettydomain=currCat.substr(6).toLowerCase();
		$("#gettybuttons").show();
		switch(gettydomain)
		{
			case "news":
				dojo.byId('gettysubdomain').innerHTML="News";
				break;
			case "entertainment":
		
				dojo.byId('gettysubdomain').innerHTML="Entertainment";
				break;
			case "sports":
			
				dojo.byId('gettysubdomain').innerHTML="Sports";
				break;
		}
	
		progressBar2.set("value", 0);
		progressBar2.set("label", "0%");
		dojo.style("SearchBox","height","240px");
		dijit.registry.byId('SearchBox').show();
		window.searchboxshow = true;
	}
	else
	{
		progressBar2.set("value", 0);
		progressBar2.set("label", "0%");
		$("#gettybuttons").hide();
		dijit.registry.byId('SearchBox').show();
		window.searchboxshow = true;	
	
	}
	dojo.empty(searchGrid);
	if (currentView=="ImageView")
				dojo.style("SearchBox","top","60px");
			else
				dojo.style("SearchBox","top","50px");
	window.replacesearchID=window.currList; // setting this means replace this id on the search
	//gotoView(window.currentView, "SearchView");
					dojo.style('searchresults',"display","none");

}

function gettyclearsearch()
{
    window.gettylastQuery = '';;
    window.gettyEditorial = 'Any';
    window.gettyEditorialTime = 'Any';
    window.gettyEditorialOrientation = 'Any';
	window.bestofflag=false;
	bestofswitch();
	window.gettyBestOf = 'Bestof';
	$("#BestOfValue").val(gettyBestOf);
    $("#editorialValue").val(gettyEditorial);
    $("#dateValue").val(gettyEditorialTime);
    $("#orientationValue").val(gettyEditorialOrientation);
    dojo.byId("gettysearchbox").value = '';
}

function gettydonesearch()
{
    dijit.registry.byId('IVGettySearchBox').hide();
    dijit.registry.byId('SearchBox').hide();
	window.searchboxshow = false;
    if (window.newgettylist)
    {
        window.newgettylist = false;
    }
    //backbutton();
}

function Gsearch(domain)
{
currCat=domain;
window.lastView="PlaylistView";
    dijit.registry.byId('IVGettySearchBox').hide();
	window.searchboxshow = false;
    dijit.registry.byId('SearchBox').hide();
	dojo.style("gNews", "display", " block");
	dojo.style("gEntertainment", "display", "block");
	dojo.style("gSports", "display", "block");
showsearch();
}

function updatecurrentsearch(viewlist,startimage)
{
	var thissearch=viewlist['searchTerm'];
	if (	window.gettyBestOf =="Bestof" && thissearch['query'].indexOf('bestof')<0)
		thissearch['query'] +=" bestof";
	var url = "http://salty-chamber-1299.herokuapp.com/getty/search2?" + "email=" + window.email 
		+ "&query=" + thissearch['query']
		+ "&token=" + window.token 
		+ "&listId=" + viewlist['id']
//		+ "_" + window.email 
		+ "&category=" + window.gettydomain
		+ "&EditorialSegments=" + thissearch['EditorialSegments']
		+ "&date=" + thissearch['date']
		+ "&orientation=" + thissearch['orientation'];
		console.log("update search with:"+url);
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
                alert("Network problem92. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            if (result["Status"] == "success")
            {
				loadImages(startimage,1,15,1);
			}
			else
			{
				myalert(result["Message"]);
			}
		}
		})
}

window.bestofswitch=function()
{
    var hrsw = dijit.registry.byId("bestof-switch");
    if (window.bestofflag)
    {
        hrsw.set('label', "Off");
        window.bestofflag = false;
		window.gettyBestOf = "";
    }
    else
    {
        window.bestofflag = true;
        hrsw.set('label', "On");
		window.gettyBestOf = "Bestof";
    }
}

function gettysubs(which,idx)
{
	console.log("subscribing to: "+which);
	for (i=1;i<5;i++)
	{
		var id='g'+i+'b';
		var itemidb=dojo.byId(id);
		id='g'+i+'c';
		var itemidc=dojo.byId(id);
		id='g'+i+'a';
		var itemida=dojo.byId(id);
		if (i==idx)
		{ // this one is selected
		//	console.log(which+ " is selected");
			dojo.style(itemidb,"color",'#00C7FF');
			dojo.style(itemidc,"color",'#00C7FF');
			document.getElementById(id).setAttribute("src", "images/button_on.png");
			window.newgettysubscription=which;
		}
		else
		{  // this one not selected
			dojo.style(itemidb,"color",'white');
			dojo.style(itemidc,"color",'white');
			document.getElementById(id).setAttribute("src", "images/button_off.png");
			
		}
	}

}

function gettySubscribeBoxClick()
{  // user click subscribe button when they saw too many sample images check if on computer or webview
dijit.registry.byId('GettySubscribeBox').hide();

if (runInWebview)
{
	if (window.guest)
	{
		myalert("Please log into Artkick and then click menu/subscribe");
		return;
	}


	DoSubscribe();

}
else
{ //running in browser, redirect them to artkick.com/subscribe
	open("http://www.artkick.com","_blank");

}


}