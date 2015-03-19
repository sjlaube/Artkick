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
    var url = "http://prod.artkick.net"
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert("url="+url);
	var bodytext='This is from the viewlist "'+dojo.byId('imageListName').innerHTML+'" one of my favorites, click the link below to see it.  Discover and collect, view and share half a million great images of great art and photography.  Check them out!';
   
   console.log("long:" + url+" Image="+imageurl);
	// for not webshare <a href="mailto: helpdesk@example.com?subject=Test%20Message&body=Please%20add%20NAMEOFUSER%20to%20the%20MG%20group.">

	get_short_url(url, login, api_key, function(short_url)
    {
        console.log("short" + short_url);
		if (runInWebview)
		{
			calliOSFunction("email", ['I want you to see this image from Artkick', short_url, encodeURIComponent(imageurl), bodytext], "onSuccess", "onError");
			try
			{
				Android.share('I want you to see this image from Artkick', short_url, imageurl,  bodytext);
			}
			catch (err)
			{}
			setTimeout(function()
			{
				hidemenu()
			}, 1000);
		}
		else // running in browser
		{
			//var mailto_link = 'mailto:'  + '?subject=' + 'I want you to see this image from Artkick' + '&body=' + bodytext+" "+short_url+' '+'<img src="'+imageurl+'">';

			//win = window.open(mailto_link, 'emailWindow');
			//if (win && win.open && !win.closed) win.close();
			// trying sharethis
		stWidget.addEntry({
                 "service":"email",
                 "element":document.getElementById('EMweb'),
                 "url":short_url,
                 "title":"I want you to see this image from Artkick",
                 "type":"large",
                 "text":bodytext ,
                 "image":imageurl,
                 "summary":bodytext
         });
		
		}
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
    var url = "http://prod.artkick.net";
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert("url="+url);
    console.log("long:" + url);
    get_short_url(url, login, api_key, function(short_url)
    {
        console.log("short" + short_url);
        calliOSFunction("gmail", ['I want you to see this image from Artkick', short_url, encodeURIComponent(imageurl),  'This is from the viewlist \"'+dojo.byId('imageListName').innerHTML+'\" one of my favorites, click the link below to see it.  Discover and collect, view and share half a million great images of great art and photography.  Check them out!'], "onSuccess", "onError");
        try
        {
            Android.share('I want you to see this image from Artkick', short_url, imageurl,  'This is from the viewlist \"'+dojo.byId('imageListName').innerHTML+'\" one of my favorites, click the link below to see it.  Discover and collect, view and share half a million great images of great art and photography.  Check them out!');
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
	
	var bodytext='This is from the viewlist "'+dojo.byId('imageListName').innerHTML+'" one of my favorites, click the link below to see it.  Discover and collect, view and share half a million great images of great art and photography.  Check them out!';

    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net";
    //url = encodeURIComponent(url + "?currList="+currList+"&currImage="+currImage+"&currCat="+currCat);
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    get_short_url(url, login, api_key, function(short_url)
    {
        calliOSFunction("twitter", ['I love this image from Artkick', short_url, encodeURIComponent(imageurl), 'I love this image from Artkick. Discover, Collect, View, Share. Free art and photos. @artkicktv #freeart'], "onSuccess", "onError");
        try
        {
            Android.twitter('I love this image from Artkick @artkicktv #freeart', short_url, imageurl, 'Discover, Collect, View, Share. Free art and photos. @artkicktv #freeart');
        }
        catch (err)
        {}
        setTimeout(function()
        {
            hidemenu()
        }, 1000);
    })
}

function facebook()
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
	var bodytext='This is from the viewlist "'+dojo.byId('imageListName').innerHTML+'" one of my favorites, click the image to see it.  ';

    //alert("image="+imageurl+"currList="+currList+"currImage="+currImage);
    var url = "http://prod.artkick.net";
    url = url + "?currList=" + encodeURIComponent(currList) + "&currImage=" + encodeURIComponent(currImage) + "&currCat=" + encodeURIComponent(currCat);
    //alert ("url="+url);
    get_short_url(url, login, api_key, function(short_url)
    {
        if(runInWebview)
		{
			calliOSFunction("facebook", ['Artkick rocks', short_url, encodeURIComponent(imageurl), 'I love this image from Artkick @artkicktv.  Discover, Collect, View&Share. Thousands of free images - art and photographs. Check them out!'], "onSuccess", "onError");
			try
			{
				//alert(imageMap[currImage]["thumbnail"]);
				Android.facebook('I love this image from Artkick @artkicktv.  Discover, Collect, View&Share. Thousands of free images - art and photographs. Check them out!', short_url, imageurl, 'Artkick rocks');
			}
			catch (err)
			{}
			setTimeout(function()
			{
				hidemenu()
			}, 1000);
		}
		else
		{
		
			FB.ui(
			  {
				method: 'feed',
				name: 'I love this image from Artkick @artkicktv',
				link: short_url,
				picture: imageurl,
				caption: bodytext,
				description: 'Discover and collect, view and share half a million great images of great art and photography.  Check them out!'
			  },
			  function(response) {
				if (response && response.post_id) {
				  usermessage('Post was published.');
				} else {
				  myalert('Post was not published.');
				}
			  }
			);
		}
    })
}

