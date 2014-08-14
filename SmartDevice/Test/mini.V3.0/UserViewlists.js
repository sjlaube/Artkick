/*

Copyright 2013, 2014 Zwamy, Inc.  All Rights Reserved

*/
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
    var listcount = 0;
    window.MyViewlist.destroyDescendants();
    //	 window.listList.destroyRecursive(true);
    $("#MyViewLists").html('');
    standby3.show();
    dojo.io.script.get(
    {
        url: base + "user/getMyViewlists?email=" + window.email + "&token=" + window.token,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!getMyViewlists" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem28. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            var lists = result["viewlists"];
            var liz = dojo.create("div",
            {
                className: 'mblListItem2',
                innerHTML: "<big><big><big>&nbsp;&nbsp;+&nbsp;&nbsp;</big></big></big>",
                onclick: function()
                {
                    //AddImageToViewlist (this.id,this.label);
                    CreateUserList();
                }
            }, 'MyViewLists');
            dojo.create("span",
            {
                innerHTML: "Create New Viewlist",
                className: 'adddevice'
            }, liz);
            dojo.style(liz, "height", "35px");
            //  put user's tops lists first in the list
            //	alert("return from getmyviewlists="+result);
            for (var i in lists)
            {
                //	alert(lists[i]["id"]+" Myviewlist="+window.MyViewlist+" name:"+lists[i]["name"] );
                if (lists[i]["name"] != "Last Search") // user can't manually add to Last Search viewlist
                {
                    listcount += 1;
                    window.shownoviewlist = true;
                    var liz = dojo.create("div",
                    {
                        id: lists[i]["id"],
                        title: lists[i]['name'],
                        className: 'mblListItem2',
                        onclick: function()
                        {
                            //AddImageToViewlist (this.id,this.label);
                            AddImageToViewlist(this.id, this.title);
                        }
                    }, 'MyViewLists');
                    dojo.style(liz, "height", "75px");
                    dojo.create("img",
                    {
                        src: lists[i]['coverImage'],
                        className: 'pvlIcon',
                    }, liz);
                    var lizz = dojo.create("span",
                    {
                        innerHTML: lists[i]['name'],
                        className: 'pvlTitle'
                    }, liz);
                    dojo.create("div",
                    {
                        innerHTML: lists[i]['imageNum'] + " images",
                        className: 'pvlTitle2'
                    }, liz);
                   
                }
            }
            //	alert("done loading number:"+listcount);
            if (listcount == 0 && window.shownoviewlist == false)
            {
                window.shownoviewlist = true
                alert("Use the '+' button to create personal viewlists");
            }
            standby3.hide();
        }
    });
}

function CreateUserList()
{
    dijit.registry.byId('AddUserList').show();
}

function CreateNewViewlist(stat)
{
    var newlistname = "";
    //EditViewlists(false);
    if (stat == "Cancel")
    {
        dijit.registry.byId('AddUserList').hide();
        return;
    }
    newlistname = dojo.byId("NewListName").value;
    if (newlistname == "")
    {
        alert("Viewlist name cannot be blank");
        return;
    }
    var url = base + "user/createMyViewlist?" + "email=" + window.email + "&listName=" + newlistname + "&token=" + window.token;
    var newlistid;
    //  alert ("creating new viewlist:"+newlistname+" user:"+window.email+" url:"+url);
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                //   alert("Viewlist " + newlistname + " ID:"+result["listId"]+" created!");
                newlistid = result["listId"];
                AddImageToViewlist(newlistid, newlistname);
            }
            else
            {
                alert(result["Message"]);
            }
        }
    });
    dijit.registry.byId('AddUserList').hide();
    dojo.byId("NewListName").value = "";
    // showmyviewlists();
}

function AddImageToViewlist(toviewlist, toviewlistname)
{
    hidemenu(); // need to check when user clicks add to viewlist, we need to hide menu when we bring up the personal viewlist view
    var url = base + "user/addImageToMyViewlist?" + "email=" + window.email + "&listId=" + toviewlist + "&imgId=" + window.currImage + "&token=" + window.token;
    //   alert("adding image:"+window.currImage+" to viewlist:"+toviewlist+" url:"+url);
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                // alert("added image:"+imageMap[currImage]["Title"]+" to viewlist:"+toviewlistname);  
                usermessage(imageMap[currImage]["Title"] + " added to viewlist:" + toviewlistname);
            }
            else
            {
                alert(result["Message"]);
            }
        }
    });
    gotoView("MylistView", "ImageView");
}

function DonePersonalViewlists()
{
    console.log("donePersonalViewlists");
    //EditViewlists(false);
    hidemenu();
    gotoView("MylistView", "ImageView");
}
window.editmyviewlists = function()
{
    // alert("switch to personal viewlist view Myviewlists="+window.MyViewlist);
    // get the personal viewlists
    var listcount = 0;
    console.log("editmyviewlists");
    window.MyViewlistEdit.destroyDescendants();
    standby2.startup();
    standby2.show();
	                
    //	 window.listList.destroyRecursive(true);
    $("#MyViewListsEdit").html('');
    //   window.MyViewlist.destroyRecursive(true);
    //     $("#MyViewList").html('');
    dojo.io.script.get(
    {
        url: base + "user/getMyViewlists?email=" + window.email + "&token=" + window.token+"&category="+editmylistdomain,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!getMyViewlists" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem28a. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            var lists = result["viewlists"];
            //  put user's tops lists first in the list
            //	alert("return from getmyviewlists="+result);
            for (var i in lists)
            {
                //	alert(lists[i]["id"]+" Myviewlist="+window.MyViewlist+" name:"+lists[i]["name"] );
                if (lists[i]["name"] != "Last Search") // user can't manually add to Last Search viewlist and you can only edit your own lists
                {
                    listcount += 1;
                    window.shownoviewlist = true;
                    vtitle = lists[i]["name"];
                    if (lists[i]["private_user"] != window.email) //subscribed viewlist
                        vtitle = vtitle + "<small><i>(subscribed)</i></small>";
                    newline = dojo.create("div",
                    {
                        id: 'my' + lists[i]["id"],
                        className: 'mblListItem3',
                        //	innerHTML:vtitle
                    }, 'MyViewListsEdit');
                    dojo.create("span",
                    {
                        innerHTML: vtitle
                    }, newline);
                    icons = dojo.create("div",
                    {}, newline);
                    dojo.create("img",
                    {
                        id: 'my2' + lists[i]["id"],
                        className: 'iconclass4',
                        src: "images/Trash_25x25_gray_on_black.png",
                        onclick: function()
                        {
                            ShowdeleteMyViewlist(this.id);
                        }
                    }, icons);
                    if (lists[i]["private_user"] == window.email&& currCat=="My Viewlists") // you can only rename/edit your own viewlists
                    {
                        dojo.create("span",
                        {
                            id: 'my3' + lists[i]["id"],
                            innerHTML: "Rename",
                            className: 'mybuttonclass',
                            onclick: function()
                            {
                                ShowRenameMyViewlist(this.id);
                            }
                        }, icons);
                        dojo.create("span",
                        {
                            id: 'my4' + lists[i]["id"],
                            innerHTML: "Images",
                            className: 'mybuttonclass',
                            onclick: function()
                            {
                                EditMyViewlistImages(this.id);
                            }
                        }, icons);
                    }
                    /*		   newList2 = new dojox.mobile.ListItem({
                                id: 'my'+lists[i]["id"],
                                label: vtitle ,
								variableHeight: true,
								noArrow: true,
								checkClass: "images/blank.png",
								classname:'mblListItem2',
								checked:false
                               
								
                            });

							var sw = new dojox.mobile.Button({
								id: 'my2'+lists[i]["id"],
								
								classname:'deleteclass',
								onClick: function() {
									ShowdeleteMyViewlist(this.id);
								}
							});
							newList2.addChild(sw);
							if (lists[i]["private_user"]==window.email)		// you can only rename/edit your own viewlists
							{
							
							var sw2 = new dojox.mobile.Button({
								id: 'my3'+lists[i]["id"],
								label:"Rename",
								classname:'detailclass',
								onClick: function() {
									ShowRenameMyViewlist(this.id);
								}
							});
							newList2.addChild(sw2);
						// button to edit viewlist contents for next release need to modify gridview to allow selection and deleting
							var sw3 = new dojox.mobile.Button({
								id: 'my4'+lists[i]["id"],
								label:"Images",
								classname:'detailclass',
								onClick: function() {
									EditMyViewlistImages(this.id);
								}
							});
							newList2.addChild(sw3);
							}
						    window.MyViewlistEdit.addChild(newList2);*/
                    // alert("added child");
                }
            }
            //	alert("done loading number:"+listcount);
         
            standby2.hide();
        }
    });
}

function ShowdeleteMyViewlist(id)
{
    console.log("showdeletemyviewlist:" + id);
    newid = 'my' + id.substr(3);
    dojo.byId('deleteVLname').innerHTML = "unknown";
    window.viewlistfordelete = newid;
    vlname = dojo.byId(newid).innerHTML.substr(6);
    lastchar = vlname.indexOf('<');
    label1 = vlname.substr(0, lastchar);
    console.log('innerhtml ' + label1);
    dojo.byId('deleteVLname').innerHTML = "'" + label1 + "'?";
    dijit.registry.byId('DeleteViewlist').show();
}

function deleteMyViewlist()
{
    dijit.registry.byId('DeleteViewlist').hide();
    console.log("deleting personal viewlist: " + 'my' + window.viewlistfordelete.substr(2));
    var id = window.viewlistfordelete;
    dojo.byId(window.viewlistfordelete).remove();
    // now get it out of the database
    var url = base + "user/removeMyViewlist?" + "email=" + window.email + "&listId=" + id.substr(2) + "&token=" + window.token;
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                alert("Viewlist " + item.label + " deleted!");
            }
            else
            {
                alert(result["Message"]);
                return;
            }
        }
    });
}

function ShowRenameMyViewlist(id)
{
    newid = 'my' + id.substr(3);
    window.viewlistforrename = newid;
    vlname = dojo.byId(newid).innerHTML.substr(6);
    lastchar = vlname.indexOf('<');
    label1 = vlname.substr(0, lastchar);
    /* var playersDom = $('#MyViewListsEdit')[0];
    	for (var i=0; i<=playersDom.childElementCount; i++){
    		playerId = playersDom.childNodes[i]['id'];
    		if (playerId==newid) {
    			var label1=playersDom.childNodes[i].childNodes[1].innerHTML;
    			console.log('label '+label1+" i="+i);
    			dojo.byId('RenameVLname').innerHTML = "'"+label1+"'?";
    		}
    		*/
    dojo.byId('RenameVLname').innerHTML = "'" + label1 + "'?";
    dijit.registry.byId('RenameViewlist').show();
}

function RenameMyViewlist(id)
{
    dijit.registry.byId('RenameViewlist').hide();
    newname = dojo.byId("newVLname").value;
    // myalert("rename personal viewlist: "+window.viewlistforrename+" to "+newname);
    var newid = window.viewlistforrename;
    /* var playersDom = $('#MyViewListsEdit')[0];
    	for (var i=0; i<=playersDom.childElementCount; i++){
    		playerId = playersDom.childNodes[i]['id'];
    		console.log("playerId:"+playerId);
    		if (playerId==newid) {
    			console.log("found for rename "+newid);
    			playersDom.childNodes[i].childNodes[1].innerHTML=newname;
    		}
    		*/
    lastchar = dojo.byId(newid).innerHTML.indexOf('<');
    dojo.byId(newid).innerHTML = newname + dojo.byId(newid).innerHTML.substr(lastchar);
    var url = base + "user/renameMyViewlist?" + "email=" + window.email + "&listId=" + newid.substr(2) + "&token=" + window.token + "&newname=" + newname;
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        load: function(result)
        {
            if (result["Status"] == "success")
            {
                alert("Viewlist " + item.label + " renamed!");
            }
            else
            {
                alert(result["Message"]);
                return;
            }
        }
    });
    dojo.byId('newVLname').value = "";
}