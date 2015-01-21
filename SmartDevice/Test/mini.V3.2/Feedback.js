/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/
function SendToArt()
{
    window.ticket = {
            requester:
            {
                name: window.username,
                email: window.email
            },
            subject: "Input from app",
            body: dojo.byId("ArtText").value
        }
        //alert("ticket="+ticket+ticket.requester.name);
    var feedbacktext = dojo.byId("ArtText").value
    var url = base + "client/feedback?text=" + encodeURIComponent(feedbacktext) + "&email=" + window.email + "&token=" + window.token;
    //alert("feedback:"+url);
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!feedback" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem32. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            //alert("status="+result["message"]);
        }
    });
    dojo.byId("ArtText").value = "";
    hidemenu();
    dijit.registry.byId('newFeedback').hide();
}

function CancelToArt()
{
    hidemenu();
    dojo.byId("ArtText").value = "";
    gotoView('TalkToArt', 'ImageView');
}


function SendToReview()
{
	dijit.registry.byId('AskReview').hide();
	MarkAsReviewed();
	if (window.platform=="IOS")	
		showiframe("http://itunes.apple.com/app/id711576101");
	else if (window.platform=="Android")
	{
		//window.location.href("market://details?id=com.artkick.artkick&reviewId=0");
		//showiframe("market://?id=com.artkick.artkick&reviewId=0");
		  try
			{
				Android.editStore();
			}
			catch (err)
			{}
	}

}

function ReviewNoThanks()
{
	dijit.registry.byId('AskReview').hide();
	MarkAsReviewed();

}

function MarkAsReviewed()
{
var url = base + "client/setReviewed?didReview=true"+ "&email=" + window.email + "&token=" + window.token;
    //alert("feedback:"+url);
    dojo.io.script.get(
    {
        url: url,
        callbackParamName: "callback",
        timeout: 8000,
        trytimes: 5,
        error: function(error)
        {
            console.log("timeout!feedback" + url);
            this.trytimes--;
            if (this.trytimes > 0)
            {
                dojo.io.script.get(this);
            }
            else
            {
                alert("Network problem32a. Please check your connection and restart the app.");
            }
        },
        load: function(result)
        {
            //alert("status="+result["message"]);
        }
    });

}