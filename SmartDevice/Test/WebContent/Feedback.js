function SendToArt()
{

window.ticket={

	requester: {
		name: window.username,
		email: window.email
	},
	subject: "Input from app",
	body: dojo.byId("ArtText").value
}
//alert("ticket="+ticket+ticket.requester.name);
var feedbacktext = dojo.byId("ArtText").value

var url = base+"client/feedback?text="+encodeURIComponent(feedbacktext)+"&email=" + window.email+"&token="+window.token;
//alert("feedback:"+url);
dojo.io.script.get({
url:url,
callbackParamName:"callback",
load: function (result) {
	//alert("status="+result["message"]);
	}
});
dojo.byId("ArtText").value="";
hidemenu();
gotoView('TalkToArt','ImageView');
}

function CancelToArt()
{
hidemenu();
    dojo.byId("ArtText").value="";
	gotoView('TalkToArt','ImageView');
}