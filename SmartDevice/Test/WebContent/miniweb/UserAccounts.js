/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/

function emailPwLogout(){
	var currView = dijit.registry.byId("AccountSettings");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    setCookie("token", null, 1);
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();
}

function emailPW(){
	window.currentView = "registeruser";
	if (is_email(dojo.byId("recoveryEmail").value))
	{
	dojo.io.script.get({
		url:base+"client/emailPassword?email="+dojo.byId("recoveryEmail").value,
		callbackParamName: "callback",
		load: function(result){
			 alert(result["Message"]);
			 if(result["Status"]=="success"){
			 	emailPwLogout();
			 }
		}
	});
	}
	else
	{
		alert("Please enter a valid email address");
	}
}

function changePwLogout(){
		window.currentView = "AccountSettings";
	var currView = dijit.registry.byId("AccountSettings");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    setCookie("token", null, 1);
    currView.performTransition("Login", 1, "", null);
    cleanUp();
}

function changePW() {
		window.currentView = "AccountSettings";
	var oldpw="";
	var newpw1="";
	var newpw2="";
	oldpw=dojo.byId("changeOldPW").value;
	newpw1=dojo.byId("changeNewPW1").value;
	newpw2=dojo.byId("changeNewPW2").value;

	if (newpw1 != newpw2)
		alert("Passwords don't match!");
	else
	{  
	   //alert(base+"resetPassword?email="+window.email+"&oldpassword="+oldpw+"&newpassword="+newpw1);
       dojo.io.script.get({
       	 url:base+"client/resetPassword?email="+window.email+"&oldpassword="+oldpw+"&newpassword="+newpw1,
       	 callbackParamName: "callback",
       	 load: function (result) {
             alert(result["Message"]);
             if(result["Status"]=="success"){
			 	dojo.byId("changeOldPW").value='';
				dojo.byId("changeNewPW1").value='';
				dojo.byId("changeNewPW2").value='';
             	changePwLogout();
             }
       	 }
       });
	}
}
function is_email(a){return /^([\w!.%+\-])+@([\w\-])+(?:\.[\w\-]+)+$/.test(a);}
function createUser() {
	window.currentView = "registeruser";
    var currView = dijit.registry.byId("registeruser");
    var pw="";
	var verifypw="";
	pw=dojo.byId("regUserPW").value;
	verifypw=dojo.byId("regUserPW2").value;
	if (pw=="")
	{
		alert("Password cannot be blank");
		return;
	}
	if (pw != verifypw)
	{
		alert("Passwords don't match");
		return;
	}
	var emailaddress=dojo.byId("regUserEmail").value;
	if (emailaddress =="")
	{
		alert("User email cannot be blank");
		return;
	}
	if (!is_email(emailaddress))
	{
		alert("User email must be a valid email address");
		return;
	}
	if (dojo.byId("regUserName").value =="")
	{
		alert("User name cannot be blank");
		return;
	}
		
    dojo.io.script.get({
        url: base + "client/regUser?email=" + dojo.byId("regUserEmail").value + "&name=" + dojo.byId("regUserName").value+"&password=" + pw,
        callbackParamName: "callback",
        load: function (result) {
            if (result["Status"] == "success") {
                usermessage("Welcome " + dojo.byId("regUserName").value + "!");
            //    currView.performTransition("ImageView", 1, "slide", null);

                window.email = dojo.byId("regUserEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
				window.token = result['token'];
				setCookie("email", window.email, 365);
				setCookie("token",result['token'], 365);
                //currView.performTransition("ImageView", 1, "slide", null);
                
                //for security, we need to make sure other possible showing view gone!!

                //alert(window.email);
				dojo.byId("regUserPW").value="";
				dojo.byId("regUserPW2").value="";
				dojo.byId("regUserName").value="";
				dojo.byId("regUserEmail").value="";
				window.currentView = "quickhint";
				window.firstimageview = true;
			    dijit.registry.byId("registeruser").performTransition("quickhint", 1, "", null);
            } else {
                alert(result["Message"]);
            }

        }
    });

}

function dologout() {
	window.currentView = "LogOff";
    var currView = dijit.registry.byId("LogOff");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    setCookie("token", null, 1);
    //currView.performTransition("Login", 1, "slide", null);
    gotoView("LogOff","blankview");
    cleanUp();
    setTimeout(function(){
    	gotoView("blankview","Login");
    },1000);

}

function goToReg1() {
	window.currentView = "registeruser";
    var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView()
    mycurrView.performTransition("registeruser", 1, "", null);
}

function goToLogin1() {
		window.currentView = "Login";
    var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView();
//	alert("goto login"+mycurrView);
    mycurrView.performTransition("Login", 1, "", null);
}

function login() {
    //alert("login!");
	var currTime = new Date().getTime();
    if(window.loginClickTime!=undefined && currTime - window.loginClickTime < window.boucingTime)
        return;
	window.loginClickTime = currTime;
    
    if (is_email(dojo.byId("loginEmail").value))
	{

    var currView = dijit.registry.byId("Login");
    dojo.io.script.get({
        url: base + "client/login?email=" + dojo.byId("loginEmail").value+"&password="+dojo.byId("loginPassword").value,
        callbackParamName: "callback",
        load: function (result) {
            //alert(result["message"]);
            if (result["Status"] == "success") {
                userObj = result["userObj"];
                usermessage("Welcome! " + userObj["name"]);
				window.shuffle=false;
				//dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');

                window.email = dojo.byId("loginEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
                window.token = result['token'];
                //alert(window.email);
                setCookie("email", window.email, 365);
                setCookie("token",result['token'], 365);
                //currView.performTransition("ImageView", 1, "slide", null);
                		dojo.byId("loginEmail").value="";
				dojo.byId("loginPassword").value="";
                //for security, we need to make sure other possible showing view gone!!
                window.afterLogin();
                
                
                
            } else {
				//dojo.byId("loginEmail").value="";
				//dojo.byId("loginPassword").value="";
                alert("login failed, please check your email and password or register!");
				
            }
        }
    });
	}
	else
	{
		alert("Please enter a valid email address");
	}
}

function goToReg() {
	window.currentView = "registeruser";
    var currView = dijit.registry.byId("Login");
    currView.performTransition("registeruser", 1, "", null);
}


function goToresetpassword() {
	window.currentView = "reset_password";
    var currView = dijit.registry.byId("Login");
    currView.performTransition("reset_password", 1, "", null);
}

function deleteAccount()
{
		var currView = dijit.registry.byId("registeruser");
		window.currentView = "AccountSettings";
		url=base + "client/removeUser?email=" + dojo.byId("deleteAcctEmail").value+"&password="+dojo.byId("deleteAcctPW").value+"&token="+window.token;
		//alert("delete:"+url);
		dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (result) {
            //alert(result["message"]);
            if (result["Status"] == "success") {
                var currView = dijit.registry.byId("LogOff");
				alert(window.email+" your account was successfully deleted");
				window.email = null;
				// code to delete cookie and log out user goes here
				setCookie("email", null, 1);
				setCookie("token", null, 1);
				dojo.byId("deleteAcctEmail").value="";
				dojo.byId("deleteAcctPW").value="";
				//currView.performTransition("Login", 1, "slide", null);
				gotoView("AccountSettings","blankview");

				cleanUp();
				setTimeout(function(){
				gotoView("blankview","Login");
				},1000);
                
                
                
            } else {
                alert("Delete Account failed, please check your email and password");
            }
        }
    });

}