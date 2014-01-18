/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/

window.photoimport=function (service)
{

if (service == "flickr")
{



 //   showiframe("http://ancient-caverns-7624.herokuapp.com/flickr?email="+window.email, '_blank');
  //  win.focus();
    calliOSFunction("loadLink", ["http://ancient-caverns-7624.herokuapp.com/flickr?email="+window.email], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("http://ancient-caverns-7624.herokuapp.com/flickr?email="+window.email);
    }
    catch(err){
    	
    }
}

if (service == "smugmug")
{
 calliOSFunction("loadLink", ["http://ancient-caverns-7624.herokuapp.com/smugmug?email="+window.email], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("http://ancient-caverns-7624.herokuapp.com/smugmug?email="+window.email);
    }
    catch(err){
    	
    }

}

}