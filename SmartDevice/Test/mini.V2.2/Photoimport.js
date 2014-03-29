/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

window.photoimport=function (service)
{

if (service == "flickr")
{



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
if (service == "facebook")
{
 calliOSFunction("loadLink", ["http://ancient-caverns-7624.herokuapp.com/facebook?email="+window.email], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("http://ancient-caverns-7624.herokuapp.com/facebook?email="+window.email);
    }
    catch(err){
    	
    }

}
if (service == "instagram")
{
 calliOSFunction("loadLink", ["http://ancient-caverns-7624.herokuapp.com/instagram?email="+window.email], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("http://ancient-caverns-7624.herokuapp.com/instagram?email="+window.email);
    }
    catch(err){
    	
    }

}
if (service == "picasa")
{
 calliOSFunction("loadLink", ["http://ancient-caverns-7624.herokuapp.com/picasa?email="+window.email], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink("http://ancient-caverns-7624.herokuapp.com/picasa?email="+window.email);
    }
    catch(err){
    	
    }

}


}