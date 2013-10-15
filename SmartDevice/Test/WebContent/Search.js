function usersearch()
{  
	var searchstring;
	searchstring = dojo.byId("searchbox").value;
	if (searchstring == "") return;
	var url=base + "user/search?"  + "email=" + window.email+"&token=9999&keyword="+searchstring;

//	alert("search called:"+url);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
			    if (result["images"].length>0)
				{
               // alert("Search done, viewlist created:"+result["listId"]);

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