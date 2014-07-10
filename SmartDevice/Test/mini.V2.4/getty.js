/*
GettySearch functions to support Getty
Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

window.gettySearch=function ()
{
gettyReset();

gotoView('select_category','GettyView');


}

function gettysearchclick()
{
	dojo.style("gettyadvanced","display","block");
		//	dojo.style("editorialselected","display","block");
	
		//	dojo.style("creativeselected","display","none");
	//	dojo.style("prevGettySearches","display","block");
		 $("#prevGettySearches").html('');
	progressBar1.set("value",0);
	progressBar1.set("label","0%");
	dojo.byId("gettynumberdelete").innerHTML="Tap image to remove&nbsp&nbsp";
	dojo.style("gettynumberdelete","display","none");
	window.itemstodelete=0;
	/* show the previous searches */
	for (var i in previousgettysearch){
		var segment="Editorial"; 
		if (previousgettysearch[i]["EditorialSegments"]=="Creative")
			segment="Creative";
		  var pgsearch=previousgettysearch[i]["query"]+
						" <small>("+segment+
                       ","+ previousgettysearch[i]["orientation"]
					   + ","+previousgettysearch[i]["date"]+")</small>";
			console.log("pg:"+pgsearch);			
		  var myButton = dojo.create("div",{
		  id: 'getty'+i,
		  innerHTML: "<a style='font-size:12px'>&nbsp;&nbsp"+pgsearch+"<br></a>", 
		  onclick: function(){
					 loadgettysearch(this.id);
		  }					  
		  },"prevGettySearches");

		  };
		  

}

function loadgettysearch(id)
{
	id = id.substr(5);
	console.log("loaded getty search for:"+id);
	window.gettylastQuery=previousgettysearch[id]["query"];
	window.gettyEditorial=previousgettysearch[id]["EditorialSegments"];
	window.gettyEditorialTime=previousgettysearch[id]["date"];
	window.gettyEditorialOrientation=previousgettysearch[id]["orientation"];
	$("#editorialValue").val(gettyEditorial);
	$("#dateValue").val(gettyEditorialTime);
	$("#orientationValue").val(gettyEditorialOrientation);
	dojo.byId("gettysearchbox").value=window.gettylastQuery;
	setEditorial(window.gettyEditorial);
	
	//gettyusersearch();
}

function gettyusersearch()
{  
	var searchstring;
	console.log("gettyusersearch");
	var currTime = new Date().getTime();
	if(window.searchClickTime!=undefined && currTime - window.searchClickTime < 7000)
        return;
	window.searchClickTime = currTime;
	searchstring = dojo.byId("gettysearchbox").value;
	if (searchstring == "" && window.gettylastQuery=="") return;
	if (searchstring=="")
	{
		searchstring=window.gettylastQuery;
		dojo.byId("gettysearchbox").value=searchstring;
		window.gettylastQuery="";
	}
	
	//dojo.style("gettyadvanced","display","none");
		//dojo.style("prevGettySearches","display","none");
/*	if(window.newgettylist) // create a new getty viewlist for this user
	{
		var templistid=window.lastgettylist++;
		
		lid='0'+templistid.toString();
	}
	else
	{*/
	if (window.currentGettyListId)
		lid=window.currentGettyListId;// for now just replace last getty search, should replace oldest one
	else
		lid='00';
//	}
	dijit.registry.byId('SearchBox').hide(); 
	$("#IVGettySearchBox").css("top","41px");
	var url="http://salty-chamber-1299.herokuapp.com/getty/search?"+"email=" + window.email+"&query="+searchstring
	+"&token="+window.token
	+"&listId=getty_"+lid+"_"+window.email
	+"&EditorialSegments="+window.gettyEditoral
	+"&date="+window.gettyEditorialTime
	+"&orientation="+gettyEditorialOrientation;
	console.log("searching getty for:"+url);
	v=0;
	var timer = setInterval(function()
	{
	
	progressBar1.set("value",v);
	progressBar1.set("label",v+"%");
	if (v>=100){clearTimeout(timer);}
	v+=10;
	},450);
	//alert("gettysearch called:"+url);
	//dojo.empty(Gettygrid);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
		timeout: 30000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!search"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem91. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
            if (result["Status"] == "success") {
			if( window.newgettylist)
			{
				window.lastgettylist=templistid;// successfully created new list increment out count
				gettylists.push(
				{   name:"getty search: "+searchstring,
				    id:"getty_"+lid+"_"+window.email,
				    coverImage:result['viewlist']['coverImage'],
					searchTerm:{
							query:searchstring, 
							EditorialSegments:window.EditorialSegments, 
							orientation:window.gettyEditorialOrientation, 
							date:window.gettyEditorialTime}
					
				});
			}
			else
				gettylists[Number(window.currentGettyListId)]=
				{   name:"getty search: "+searchstring,
				    id:"getty_"+lid+"_"+window.email,
				    coverImage:result['viewlist']['coverImage'],
					searchTerm:{
							query:searchstring, 
							EditorialSegments:window.EditorialSegments, 
							orientation:window.gettyEditorialOrientation, 
							date:window.gettyEditorialTime}
				};
					
				
      //      usermessage(result["imageNum"]+' images found & stored in "Last Getty Search"');
			//console.log("test123");
			dijit.registry.byId('IVGettySearchBox').hide();
			dijit.registry.byId('SearchBox').hide();	
			$("#searchGrid").css("top","0px");			
			window.IVsearchboxshow=false;
			//	swapview(result["listId"]);

			window.gname=result['viewlist']['name'];
			window.gimage=result['viewlist']['coverImage'];
			progressBar1.set("value",100);
			progressBar1.set("label","Complete");
			clearTimeout(timer);
				window.currList=result["id"];
				window.currCat="Getty Images";
				window.currViewList="Last Getty Search";
				window.currGridList=-1;
				window.moregridpages = false;
          //      gotoView(window.currentView, 'blankview');
                                        
			//	window.switchView = true;
             //   updateImages(-1);
				usermessage(result["imageNum"]+' images found for:"'+searchstring+'"');
				if (result["imageNum"]>0)
				{
					loadGrid(0,searchGrid,result["id"]);
				}
			//	gettyload();
			//	previousgettysearch.push( {query:searchstring, EditorialSegments:window.EditorialSegments, orientation:window.gettyEditorialOrientation, date:window.gettyEditorialTime});


            } else {
				progressBar1.set("value",100);
				progressBar1.set("label","Complete");
				clearTimeout(timer);
                myalert(result["Message"]);
            }

        }
    });
}

function setEditorial(etype)
{
	console.log("Editorial search domain: "+etype);
	window.gettyEditoral=etype;
		if (etype=="Any")
	{			
			dojo.style("editorialselected","display","block");
	
			dojo.style("creativeselected","display","none");
			dojo.style("EditorialTime","display","block");
						dojo.style("orientationValue","top","-16px");
	}
	else
	{
			dojo.style("creativeselected","display","block");
			dojo.style("editorialselected","display","none");
			dojo.style("EditorialTime","display","none");
			dojo.style("orientationValue","top","9px");
		
	}
}

function setEditorialTime(etype)
{
	console.log("Editorial search domain: "+etype);

	window.gettyEditorialTime=etype;
}
function setEditorialOrientation(etype)
{
	console.log("Editorial search domain: "+etype);
	window.gettyEditorialOrientation=etype;
}

window.gettyReset=function()
{
			$("#editorialValue").val("Any");
			$("#dateValue").val("Any");
			$("#orientationValue").val("horizontal");
			window.gettyEditoral="Any";
			window.gettyEditorialTime="Any";
			window.gettyEditorialOrientation="horizontal";
			dojo.empty(Gettygrid);
			dojo.byId("gettysearchbox").value="";
			gettyView.scrollTo({y:0});
			progressBar1.set("value",0);
			progressBar1.set("label","0%");
			window.itemstodelete=0;
			dojo.style("gettyadvanced","display","none");
;
			dojo.style("editorialselected","display","block");
	
			dojo.style("creativeselected","display","none");
			dojo.byId("gettynumberdelete").innerHTML="Tap image to remove&nbsp&nbsp";
			dojo.style("gettynumberdelete","display","none");

		//	dojo.style("prevGettySearches","display","none");
			
			
}

function gettyload()
{
//dojo.byId("gettynumberdelete").innerHTML="Tap image to remove&nbsp&nbsp";
//dojo.style("gettynumberdelete","display","block");
//editviewlist();
loadGrid(0,Gettygrid);
}

function gettyuserrefresh(newlist)
{


console.log("getty user refresh hit, newlist:"+newlist);
	hidemenu();
	if(newlist)
	{
		window.newgettylist=true;
		gettyclearsearch();
	}
	else
	{
		// check if this is an existing search and prefill in stuff
		window.newgettylist=false;
		var id1=window.currList.substr(6,2);
		console.log("gettylistname "+id1);
		window.currentGettyListId=id1;
		id=parseInt(id1);
		window.gettylastQuery=gettylists[id]['searchTerm']["query"];
		window.gettyEditorial=gettylists[id]['searchTerm']["EditorialSegments"];
		window.gettyEditorialTime=gettylists[id]['searchTerm']["date"];
		window.gettyEditorialOrientation=gettylists[id]['searchTerm']["orientation"];
		
		$("#editorialValue").val(gettyEditorial);
		$("#dateValue").val(gettyEditorialTime);
		$("#orientationValue").val(gettyEditorialOrientation);
		dojo.byId("gettysearchbox").value=window.gettylastQuery;
	//	setEditorial(window.gettyEditorial);
	}
	progressBar1.set("value",0);
	progressBar1.set("label","0%");
	
	dijit.registry.byId('IVGettySearchBox').show(); 
	window.IVsearchboxshow=true;
}

function gettyclearsearch()
{
	window.gettylastQuery='';;
	window.gettyEditorial='Any';
	window.gettyEditorialTime='Any';
	window.gettyEditorialOrientation='Any';
	$("#editorialValue").val(gettyEditorial);
	$("#dateValue").val(gettyEditorialTime);
	$("#orientationValue").val(gettyEditorialOrientation);
	dojo.byId("gettysearchbox").value='';

}

function gettydonesearch()
{
	dijit.registry.byId('IVGettySearchBox').hide();
	dijit.registry.byId('SearchBox').hide(); 

	if (window.newgettylist)
	{
		window.newgettylist=false;

	}
			backbutton();
}

