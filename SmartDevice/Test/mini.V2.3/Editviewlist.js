/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

function editviewlist()
{
	window.itemlist=[];
	window.itemstodelete=0;
	window.editlist=true;
}
function clickdelete(item,id)
{
	if (dojo.style(item, "opacity")<1)
	{
		window.itemstodelete--;
		dojo.style(item, "opacity", '1');
		var index = window.itemlist.indexOf(id.substr(3));
		window.itemlist.splice(index,1);
	}
	else
	{
		window.itemstodelete++;
		dojo.style(item, "opacity", '.5');
		window.itemlist.push(id.substr(3));
	}
	dojo.byId('DeleteItemNumber').innerHTML = window.itemstodelete+" items to delete";
//	dojo.byId('EditListViewHeader').innerHTML = window.itemstodelete+" items to delete";
	if(currentView=="GettyView")
		dojo.byId("gettynumberdelete").innerHTML=window.itemstodelete+" items to remove&nbsp&nbsp";
	else
		dijit.registry.byId('EditListViewHeader').set('label', window.itemstodelete+" items to delete");
	console.log("deleting: "+id.substr(3)+" :"+window.itemstodelete+" items");
}

function doneeditviewlist(status)
{
	if (status)
	{// if status true then actually delete, else abort the edit
		console.log("Now deleting: "+window.itemstodelete+" items");
	}
	else
	{
		dijit.registry.byId('DeleteItems').hide();
		gotoView("EditListView","MylistViewEdit");
		return;
	}
	
	
	
	// now lets try to actually delete the items
	var url=base + "user/removeImagesFromList?"  + "email=" + window.email+"&listId="+window.currList+"&token="+window.token;
	for (var i in window.itemlist)
	{
		url+="&imgIds[]="+window.itemlist[i];
	}
	console.log("delete items url="+url);
   dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
		
        load: function (result) {
            if (result["Status"] == "success") {
               
				usermessage(window.itemstodelete+" were deleted");
				window.itemstodelete=0;
				dojo.byId('DeleteItemNumber').innerHTML = "No items to delete";
				dijit.registry.byId('EditListViewHeader').set('label', "Tap to Delete Image");
				dijit.registry.byId('DeleteItems').hide();
				
				window.editlist=false;
				window.itemlist=[];
				gotoView("EditListView","MylistViewEdit");

            } else {
                myalert(result["Message"]);
				gotoView("EditListView","MylistViewEdit");
            }

        }
    });
	
	
	


}

function EditMyViewlistImages(id)
{
	window.itemlist=[];
	window.itemstodelete=0;
	window.editlist=true;

	window.currList=id.substr(3);
	loadGrid(0,Picturegrid2);
	gotoView("MylistViewEdit","EditListView");
}


function EditListViewDone()
{
	if(window.itemstodelete>0)
		dijit.registry.byId('DeleteItems').show();
	else //nothing to delete
		doneeditviewlist(false);
		
		

}
