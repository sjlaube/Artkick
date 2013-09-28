 function CreateUserList()
 {

 dijit.registry.byId('AddUserList').show();
 }
 
 

 
 function CreateNewViewlist (stat)
 {
   var newlistname = "";

     if (stat == "Cancel"){
	      dijit.registry.byId('AddUserList').hide(); 
		return;
		}
   newlistname = dojo.byId("NewListName").value;
  // alert ("creating new viewlist:"+newlistname+" user:"+window.email);
   newList = new dojox.mobile.ListItem({
   id: newlistname, // should be actual viewlist number returned by server
   label: newlistname, 
    variableHeight: true,
	clickable: true,
	moveTo: "",
    onClick: function () {
     //    alert(this.id);
	 // need to call routine which adds current image to this viewlist should pass both id and label when we have real id
		AddImageToViewlist(this.label);
      }
   
         });
        dijit.registry.byId("MyList").addChild(newList);
     dijit.registry.byId('AddUserList').hide(); 
	 dojo.byId("NewListName").value="";
 }
 
 function AddImageToViewlist (toviewlist)
 {
 alert("adding image:"+window.currImage+" to viewlist:"+toviewlist);
 
 }
 