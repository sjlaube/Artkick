/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/


function LoginAlogin()
{
	if (runInWebview)
	{
		dojo.byId("introbuttons-text").innerHTML="Log in using";
		dojo.style("Introbuttons","display","block");
		window.logintype="login";
		window.introclicktime=new Date().getTime();
	}
	else
		gotoView(currentView,"newLogin");
}

function LoginAsignup()
{
	if (runInWebview)
	{
		dojo.byId("introbuttons-text").innerHTML="Sign up using";
		dojo.style("Introbuttons","display","block");
		window.logintype="signup";
		window.introclicktime=new Date().getTime();
	}
	else
		gotoView(currentView,"registeruser");
}

function closeLogin()
{
	   var currTime = new Date().getTime();
	if (window.introclicktime != undefined && (currTime - window.introclicktime < window.boucingTime))
	{
		
		return;
	}
	if (window.logintype=="login" || window.logintype=="signup")
	{
		dojo.style("Introbuttons","display","none");
		window.logintype="none";
	}

}

function Nlogin(which)
{

if (which=="email")
{
	if(logintype=="login")
	{
		gotoView(currentView,"newLogin");
		dojo.byId("loginEmail").value = "";
		dojo.byId("loginPassword").value = "";
	}
	else if (logintype=="signup")
		gotoView(currentView,"registeruser");
}
else if (which=="facebook")
	FBlogin();
else if (which=="google")
	Googlelogin();

closeLogin();

}