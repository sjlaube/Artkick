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
	
	dojo.style("gettyadvanced","display","none");
		//dojo.style("prevGettySearches","display","none");
	var url="http://salty-chamber-1299.herokuapp.com/getty/search?"+"email=" + window.email+"&query="+searchstring
	+"&token="+window.token
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
	dojo.empty(Gettygrid);

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
		
              //   usermessage(result["images"].length+' images found & stored in "Last Getty Search"');*/

			
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
				gettyload();
						previousgettysearch.push( {query:searchstring, EditorialSegments:window.EditorialSegments, orientation:window.gettyEditorialOrientation, date:window.gettyEditorialTime});


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
			dojo.style("gettyadvanced","display","none");
;
			dojo.style("editorialselected","display","block");
	
			dojo.style("creativeselected","display","none");

		//	dojo.style("prevGettySearches","display","none");
			
			
}

function gettyload()
{
loadGrid(0,Gettygrid);
}

