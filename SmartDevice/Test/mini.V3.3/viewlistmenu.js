 window.msToTime=function(s)
    {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        if (days > 0)
            return (days + " day ago");
        else if (hrs > 0)
            return (hrs + " hr ago");
        else if (mins > 0)
            return (mins + " min ago");
        else
            return ("Just now");
    }
	
	
window.showURL=function(pageID)
{
    dojo.io.script.get(
    {
        url: "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&page="+pageID,
        callbackParamName: "callback",
        load: function(result) {window.webcontents=result.parse.text['*'];
		dojo.byId("wikicontents").innerHTML=window.webcontents;
		gotoView(currentView,"wikic");
		
		}
		

    });


}

function submenuclick(id)
{
    if (window.guest)
    {
        guestmessage();
        window.guestmenu = true;
        return;
    }
	window.thislist=lists[id.substr(3)];
	console.log("submenuclick for "+thislist['name']);
	window.currList=thislist['id'];
	if (thislist['curatornote'])
		dojo.style("vlCurator","display","block");
	else
		dojo.style("vlCurator","display","none");
	dojo.byId("vlmname").innerHTML=thislist['name'];
	dojo.style("vlRename","display","none");
	dojo.style("vlDelete","display","none");
	dojo.style("vlEdit","display","none");
	dojo.style("vlAdd","display","block");
	if (currCat=="My Viewlists")
	{
		dojo.style("vlRename","display","block");
		dojo.style("vlDelete","display","block");
		dojo.style("vlEdit","display","block");
		dojo.style("vlAdd","display","none");
	}
	if (currCat.substr(0,5)=="Getty" ||window.currCat=="My Searches")
	{
		dojo.style("vlRename","display","none");
		dojo.style("vlDelete","display","block");
		dojo.style("vlEdit","display","none");
		dojo.style("vlAdd","display","none");
	}
	dijit.registry.byId('viewlistMenu').show();

}

function showCuratorNotes()
{
	dijit.registry.byId('viewlistMenu').hide();
	dojo.byId("cn-vlmname").innerHTML=thislist['name'];
		dojo.byId("showCuratorNotes").innerHTML=thislist['curatornote'];
		dijit.registry.byId('CuratorNotes').show();

}

function addViewlist()
{
	console.log("adding "+thislist['name']);
    dijit.registry.byId('viewlistMenu').hide();

    var id = thislist['id'];


    // now get it into of the database
    var url = base + "user/addMyViewlist?" + "email=" + window.email + "&listId=" + id + "&token=" + window.token;

    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                usermessage("Viewlist " + window.thislist['name'] + " added to My Viewlists!");
				gotoCategory(currCat);
            }
            else
            {
                myalert(result["Message"]);
                return;
            }
        }
    });
}

