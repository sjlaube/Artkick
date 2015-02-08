function get_short_url(long_url, login, api_key, func)
{
    $.getJSON(
        "https://api-ssl.bitly.com/v3/shorten?callback=?",
        {
            "access_token": window.api_key,
            "longUrl": long_url
        },
        function(response)
        {
            window.response1 = response;
            console.log("resp:" + window.response1);
            func(response.data.url);
        }
    );
}

function emailShare()
{
    imageurl = imageMap[currImage]["thumbnail"];
	if (imageMap[currImage]["waterMark"])
		imageurl = imageMap[currImage]["waterMark"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/index-V3.1.html"
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert("url="+url);
    console.log("long:" + url+" Image="+imageurl);
    get_short_url(url, login, api_key, function(short_url)
    {
        console.log("short" + short_url);
        calliOSFunction("email", ['I want you to see this image from Artkick', short_url, encodeURIComponent(imageurl), 'This is from the viewlist \"'+dojo.byId('imageListName').innerHTML+'\" one of my favorites, click the link below to see it.  Discover and collect, view and share half a million great images of great art and photography.  Check them out!'], "onSuccess", "onError");
        try
        {
            Android.share('Check out this great image and thousands more at Artkick', short_url, imageurl, 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function otherShare()
{
    imageurl = imageMap[currImage]["thumbnail"];
	if (imageMap[currImage]["waterMark"])
		imageurl = imageMap[currImage]["waterMark"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/index-V3.1.html";
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert("url="+url);
    console.log("long:" + url);
    get_short_url(url, login, api_key, function(short_url)
    {
        console.log("short" + short_url);
        calliOSFunction("gmail", ['Artkick rocks', short_url, encodeURIComponent(imageurl), 'Check out this great image and thousands more at Artkick'], "onSuccess", "onError");
        try
        {
            Android.share('Check out this great image and thousands more at Artkick', short_url, imageurl, 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function twitter()
{
    //alert("facebook!");
	
    imageurl = imageMap[currImage]["thumbnail"];
	if (imageMap[currImage]["waterMark"])
		imageurl = imageMap[currImage]["waterMark"];
    if (window.currViewList == "Last Search")
    { /* can't share last search */
        myalert("You can't share the Last Search Viewlist");
        return;
    }
    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net/index-V3.1.html";
    //url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    get_short_url(url, login, api_key, function(short_url)
    {
        calliOSFunction("twitter", ['Artkick rocks', short_url, encodeURIComponent(imageurl), 'Check out this great image and thousands more at Artkick @artkicktv #freeart'], "onSuccess", "onError");
        try
        {
            Android.twitter('Check out this great image and thousands more at Artkick @artkicktv #freeart', short_url, imageurl, 'Artkick rocks');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}