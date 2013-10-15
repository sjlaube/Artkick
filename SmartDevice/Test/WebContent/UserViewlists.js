/*
routines for user viewlists

How it should work 

Users can create their own viewlists, will use api to create viewlist and include email so private
need category "personal viewlists" for everyone
Personal viewlists will include:
	My Top Rated Images
	My last search
	personal viewwindow.MyViewlist
	personal viewlist2
	
Users can create, delete and rename personal viewlists

When user clicks on a link from someone else and it is an image within a personal viewlist, 
	a copy of that viewlist is automatically created as a personal viewlist with the name if "sending user's name:viewlistname"
	when opening viewlist from command line need to check who owner of viewlist is, if it is not the user, and not Artkick, 
	we automatically duplicate it as a new user viewlist
*/
function showmyviewlists()
{
// alert("switch to personal viewlist view Myviewlists="+window.MyViewlist);
// get the personal viewlists
	
				var listcount=0;
				 window.MyViewlist.destroyDescendants();
				 window.listList.destroyRecursive(true);
                $("#listList").html('');
			 //   window.MyViewlist.destroyRecursive(true);
             //     $("#MyViewList").html('');

                dojo.io.script.get({
                    url: base + "user/getMyViewlists?email="+ window.email+"&token=99999",
                    callbackParamName: "callback",
                    load: function (result) {
                        var lists = result["viewlists"]; 
						//  put user's tops lists first in the list
					//	alert("return from getmyviewlists="+result);
                        for (var i in lists) {
					//	alert(lists[i]["id"]+" Myviewlist="+window.MyViewlist+" name:"+lists[i]["name"] );
						 if ( lists[i]["name"] != "Last Search") // user can't manually add to Last Search viewlist
						 {
							listcount += 1;
						   newList2 = new dojox.mobile.ListItem({
                                id: lists[i]["id"],
                                label: lists[i]["name"] ,
								variableHeight: false,
								clickable: true,
                                onClick: function () {
                                	AddImageToViewlist (this.id,this.label);
                                },
								noArrow: true,
								editable: true,
								checked:false
                               
								
                            });
                              //   alert("add child"+lists[i]["name"]);
							     window.MyViewlist.addChild(newList2);
								// alert("added child");
						}

                        }
					//	alert("done loading number:"+listcount);
						if(listcount == 0)
						{
							alert("Use the '+' button to create personal viewlists");
						}
                        
                        
                       
                    }
                    

                });
}


			
			

			
function CreateUserList()
 {

 dijit.registry.byId('AddUserList').show();
 }
 
 

 
 function CreateNewViewlist (stat)
 {
   var newlistname = "";
 EditViewlists(false);
     if (stat == "Cancel"){
	      dijit.registry.byId('AddUserList').hide(); 
		return;
		}
   newlistname = dojo.byId("NewListName").value;
   if (newlistname == "")
   {
	alert("Viewlist name cannot be blank");
	return;
   }


   var url=base + "user/createMyViewlist?"  + "email=" + window.email+"&token=9999&listName="+newlistname;
   var newlistid;
 //  alert ("creating new viewlist:"+newlistname+" user:"+window.email+" url:"+url);
    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
             //   alert("Viewlist " + newlistname + " ID:"+result["listId"]+" created!");
                  newlistid=    result["listId"];     
				  	AddImageToViewlist (newlistid,newlistname);

            } else {
                alert(result["Message"]);
            }

        }
    });
  
     dijit.registry.byId('AddUserList').hide(); 
	 dojo.byId("NewListName").value="";
	// showmyviewlists();

 }
 
 function AddImageToViewlist (toviewlist,toviewlistname)
 {
	hidemenu();// need to check when user clicks add to viewlist, we need to hide menu when we bring up the personal viewlist view

	
    var url=base + "user/addImageToMyViewlist?"  + "email=" + window.email+"&token=9999&listId="+toviewlist+"&imgId="+window.currImage;
 //   alert("adding image:"+window.currImage+" to viewlist:"+toviewlist+" url:"+url);
    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
               // alert("added image:"+imageMap[currImage]["Title"]+" to viewlist:"+toviewlistname);  
				usermessage("Added image:"+imageMap[currImage]["Title"]+" to viewlist:"+toviewlistname);

            } else {
                alert(result["Message"]);
            }

        }
    });
 gotoView("MylistView","ImageView");
 
 }
 
 function DonePersonalViewlists()
 {
 EditViewlists(false);
 hidemenu();
  gotoView("MylistView","ImageView");
 
 }
 

 