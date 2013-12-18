/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/

function usersearch()
{  
	var searchstring;
	searchstring = dojo.byId("searchbox").value;
	if (searchstring == "") return;
	var url=base + "user/search?"  + "email=" + window.email+"&keyword="+searchstring+"&token="+window.token;

//	alert("search called:"+url);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
			    if (result["images"].length>0)
				{
                 usermessage(result["images"].length+' images found & stored in "Last Search"');

				gotoView("select_category","blankview");
				swapview(result["listId"]);
				//gotoView("blankview","ImageView");
				}
				else
				{
				alert('No results for: "'+searchstring+'"');
				}

            } else {
                alert(result["Message"]);
            }

        }
    });
	dojo.byId("searchbox").value="";

}