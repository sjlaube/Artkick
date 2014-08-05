/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
function callstore()
{
    hidemenu();
    console.log("loadStore");
    calliOSFunction("loadStore", [], "onSuccess", "onError");
    try
    {
        Android.loadStore();
    }
    catch (err)
    {}
}

function editstore()
{
    hidemenu();
    console.log("editStore");
    calliOSFunction("editStore", [], "onSuccess", "onError");
    try
    {
        Android.share('Check out this great image and thousands more at Artkick', short_url, imageMap[currImage]["thumbnail"], 'Artkick rocks');
    }
    catch (err)
    {}
}

function completeTransaction(time)
{
    window.gettysubscribe = true;
    usermessage("you are now subscribed to Getty Images");
}

function setSubs(status)
{
    window.gettysubscribe = status;
    if (status)
        usermessage("you are now subscribed to Getty Images");
    dojo.io.script.get(
    {
        url: "http://infinite-anchorage-8570.herokuapp.com/android/setSubs?email=" + window.email + "&token=" + window.token + "&subs=" + status,
        callbackParamName: "callback",
        load: function(result) {}
    });
}