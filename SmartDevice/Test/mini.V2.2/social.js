/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

function like(id){
	console.log(id);
	if (window.guest)
	{
	guestmessage();
	window.guestmenu=true;
	return;
	}
	if(imageMap[id]["like"]){
		imageMap[id]["like"] = false;
		console.log("dislike");
		imageMap[id]["likeNum"]--;	
        document.getElementById("img"+id).src = "images/like.png";
        document.getElementById("likeNum"+id).innerHTML = imageMap[id]["likeNum"]+" likes";
        document.getElementById("likeWord"+id).innerHTML = "Like";
        document.getElementById("likeWord"+id).className = "likeSpan";
         dojo.io.script.get({
                url: base + "client/likeImage?email=" + window.email + "&imageId=" + id+"&token="+window.token+"&like=0",
                callbackParamName: "callback",
				timeout: 8000,
				trytimes: 5,
				error: function(error){
					
				},
                load: function (result) {

                }
          });		
		
		
		
		
	}else{
		console.log("like");
		usermessage("Added to 'My Viewlists'");
		imageMap[id]["like"] = true;
		imageMap[id]["likeNum"]++;
		document.getElementById("img"+id).src = "images/like white.png";
		document.getElementById("likeNum"+id).innerHTML = imageMap[id]["likeNum"]+" likes";
		document.getElementById("likeWord"+id).innerHTML = "Like";
		document.getElementById("likeWord"+id).className += " selfLike";
		
		dojo.io.script.get({
                url: base + "client/likeImage?email=" + window.email + "&imageId=" + id+"&token="+window.token+"&like=1",
                callbackParamName: "callback",
				timeout: 8000,
				trytimes: 5,
				error: function(error){
					
				},
                load: function (result) {

                }
         });	
	}
}

function share()
{

	if (window.guest)
	{
		guestmessage();
		window.guestmenu=true;
		return;
	}
//myalert("share");
	
	showsharemenu();
}

function comment()
{
	if (window.guest)
	{
	guestmessage();
	window.guestmenu=true;
	return;
	}
	
function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  s = (s - mins) /60;
  var hrs = s%24;
  s = (s - hrs) / 24;
  var days = s;


  //console.log(days+':'+hrs + ':' + mins + ':' + secs + '.' + ms);
  if (days >0)
	return(days+" day ago");
  else if (hrs > 0)
    return(hrs+" hr ago");
  else if (mins > 0)
    return(mins+ " min ago");
  else
    return("Just now");
}
	
	
gotoView("ImageView","show_comments");

    commentList.destroyDescendants();

		
	
	for (var i in imageMap[currImage]["comments"]) {
		var comm = imageMap[currImage]["comments"][i]["text"];
		var username = "<b>"+imageMap[currImage]["comments"][i]["user_name"]+"</b>";
		var timesince= new Date().getTime()-imageMap[currImage]["comments"][i]["time_stamp"];
		
		var howlongsince=msToTime(timesince);
		//console.log("time: "+howlongsince);
		//alert(curr-player["last_visit"]);
		if (!imageMap[currImage]["comments"][i]["delete"])
		{
		// only show delete button for my own comments.....

		if (imageMap[currImage]["comments"][i]["user_id"]==window.userID||window.isAdmin)
		{
			console.log("mycomment:"+comm);
			li = new dojox.mobile.ListItem({
				id: 'comment'+i,
				label: username+"<br>"+comm+"<br><span class='timestamp'>"+howlongsince+"</span>",
				onClick: function () {
					ShowDeleteComment(this.id);
				},
				variableHeight:true,
				checked:false,
				checkClass: "images/blank.png",
				rightIcon2:"images/Trash_25x25.png",
				itemid: this
			});
		}
		else
		{
			console.log("comment:"+comm);
			li = new dojox.mobile.ListItem({
				id: 'comment'+i,
				label: username+"<br>"+comm,
								variableHeight:true,
				checked:false,
			});
		}
		commentList.addChild(li);
		
        }
		}


}
function deletecomment()
{
	var url=base + "client/deleteComment?"  + "email=" + window.email+"&token="+window.token+"&imageId="+window.currImage+"&index="+window.commentfordeleteid;
	console.log ("deleting comment:"+url);
	dijit.registry.byId('DeleteComment').hide(); 
    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
		
        load: function (result) {
            if (result["Status"] == "success") {
              
            } else {
                alert(result["Message"]);
            }

        }
    });
	/* this is incorrect index sometimes check it */

	var playersDom = $('#comment_list')[0];
                            for (var i=0; i<playersDom.childElementCount; i++){
                            	playerId = playersDom.childNodes[i]['id'];
                            	console.log('id='+playerId);
                            	if (playerId=='comment'+window.commentfordeleteid) {
                                    
                                    dijit.registry.remove(playerId);
                                    playersDom.removeChild(playersDom.childNodes[i]);
									console.log(" delete i= " +i);
									
										imageMap[window.currImage]["comments"][i]["delete"] = true;
                                  

                                }
                            	
                            }
		 imageMap[window.currImage]["commentNum"]--;
		 
		 		document.getElementById("commentNum"+window.currImage).innerHTML = imageMap[window.currImage]["commentNum"]+" comments";
	console.log("delete comment:"+window.commentfordeleteid);
}

function CreateComment (stat)
 {
   var newlistname = "";

     if (stat == "Cancel"){
	      dijit.registry.byId('AddComment').hide(); 
		  window.showAddComment = false;
		return;
		}
   newlistname = dojo.byId("CommentText").value;
   if (newlistname == "")
   {
	alert("Comment cannot be blank");
	return;
   }


   var url=base + "client/commentImage?"  + "email=" + window.email+"&token="+window.token+"&imageId="+window.currImage+"&text="+newlistname;
   var newlistid;
 //  alert ("creating new viewlist:"+newlistname+" user:"+window.email+" url:"+url);
    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
		
        load: function (result) {
            if (result["Status"] == "success") {
             //   alert("Viewlist " + newlistname + " ID:"+result["listId"]+" created!");
              
            } else {
                alert(result["Message"]);
            }

        }
    });
  
     dijit.registry.byId('AddComment').hide(); 
	 window.showAddComment = false;


	 var cm=imageMap[window.currImage]["commentNum"];
	 	 imageMap[window.currImage]["commentNum"]++;
		document.getElementById("commentNum"+window.currImage).innerHTML = imageMap[window.currImage]["commentNum"]+" comments";
	li = new dojox.mobile.ListItem({
			id: cm,
			label: "<b>"+window.userName+"</b><br>"+newlistname+"<br><span class='timestamp'>Just now</span>",
			onClick: function () {
				ShowDeleteComment(this.id);
			},
			variableHeight:true,
			checked:false,
			checkClass: "images/blank.png",
			rightIcon2:"images/Trash_25x25.png"
			

		});
		commentList.addChild(li);
		imageMap[window.currImage]["comments"].push( {text:newlistname, user_name:window.userName, user_id:window.userID, time_stamp:new Date().getTime(),delete:false});


			 dojo.byId("CommentText").value="";
			  // set view to bottom so you can see you comment
			  var c = dijit.byId("show_comments").containerNode;


                    dojo.setStyle(c, {
                        webkitTransform: '',
                        top: 200,
                        left: 0
                    });

 }
 
 function ShowNewComment()
 {

 dijit.registry.byId('AddComment').show();
 window.showAddComment = true;
 }
 
  function ShowDeleteComment(id)
 {
	window.commentfordeleteid=id.substr(7);
 dijit.registry.byId('DeleteComment').show();
 }
