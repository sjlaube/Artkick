/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

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
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!search"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem31. Please check your connection and restart the app.");
			}
			
		},
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