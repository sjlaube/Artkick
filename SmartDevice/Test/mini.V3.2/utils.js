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