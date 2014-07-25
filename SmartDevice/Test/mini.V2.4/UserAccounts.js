/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

function emailPwLogout(){
	var currView = dijit.registry.byId(window.currentView);
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    setCookie("token", null, 1);
	window.currentView = "Login";
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();
}

function emailPW(){
	window.currentView = "reset_password";
	if (is_email(dojo.byId("recoveryEmail").value))
	{
	dojo.io.script.get({
		url:base+"client/emailPassword?email="+dojo.byId("recoveryEmail").value,
		callbackParamName: "callback",
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!emailPassword"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem23. Please check your connection and restart the app.");
			}
			
		},
		load: function(result){
			 myalert(result["Message"]);
			 if(result["Status"]=="success"){
			 	emailPwLogout();
			 }
		}
	});
	}
	else
	{
		myalert("Please enter a valid email address");
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
		myalert("Passwords don't match!");
	else
	{  
	   //alert(base+"resetPassword?email="+window.email+"&oldpassword="+oldpw+"&newpassword="+newpw1);
       dojo.io.script.get({
       	 url:base+"client/resetPassword?email="+window.email+"&oldpassword="+oldpw+"&newpassword="+newpw1,
       	 callbackParamName: "callback",
		 timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!resetPassword"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem24. Please check your connection and restart the app.");
			}
			
		},
       	 load: function (result) {
             myalert(result["Message"]);
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
	pw=dojo.byId("regUserPW").value.trim();
	verifypw=dojo.byId("regUserPW2").value.trim();
	if (pw=="")
	{
		myalert("Password cannot be blank");
		return;
	}
	if (pw != verifypw)
	{
		myalert("Passwords don't match");
		return;
	}
	var emailaddress=dojo.byId("regUserEmail").value.trim();
	console.log("user email="+emailaddress);
	if (emailaddress =="")
	{
		myalert("User email cannot be blank");
		return;
	}
	if (!is_email(emailaddress))
	{
		myalert("User email must be a valid email address");
		return;
	}
	if (dojo.byId("regUserName").value =="")
	{
		myalert("User name cannot be blank");
		return;
	}
		
    dojo.io.script.get({
        url: base + "client/regUser?email=" + dojo.byId("regUserEmail").value + "&name=" + dojo.byId("regUserName").value+"&password=" + pw,
        callbackParamName: "callback",
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!regUser"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem24. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
            if (result["Status"] == "success") {
                usermessage("Welcome " + dojo.byId("regUserName").value + "!");
            //    currView.performTransition("ImageView", 1, "slide", null);
				window.userName = dojo.byId("regUserName").value;
                window.email = dojo.byId("regUserEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
				try {Android.setEmail(window.email);
									}catch (err) {}
				window.token = result['token'];
				window.userID = result['id'];
				setCookie("email", window.email, 365);
				setCookie("token",result['token'], 365);
				calliOSFunction("setemail", [ window.email], "onSuccess", "onError");
                //currView.performTransition("ImageView", 1, "slide", null);
                
                //for security, we need to make sure other possible showing view gone!!

                //alert(window.email);
				dojo.byId("regUserPW").value="";
				dojo.byId("regUserPW2").value="";
				dojo.byId("regUserName").value="";
				dojo.byId("regUserEmail").value="";
				$("#MyViewlists").show();
				$("#searchbox").show();
//				$("#searchbutton").show();
				window.currentView = "quickhint";
				window.firstimageview = true;
			    dijit.registry.byId("registeruser").performTransition("quickhint", 1, "", null);
            } else {
                myalert(result["Message"]);
			//	gotoView('registeruser','Login');
            }

        }
    });

}

function dologout() {
	window.currentView = "LogOff";
    var currView = dijit.registry.byId("LogOff");
    window.email = null;
	try {Android.clearCookie();
		}catch (err) {};
	calliOSFunction("clearCookie", [], "onSuccess", "onError");
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    setCookie("token", null, 1);
    //currView.performTransition("Login", 1, "slide", null);
	    cleanUp();
    gotoView("AccountSettings","newLogin");

 /*   setTimeout(function(){
    	gotoView("blankview","Login");
    },1000);*/

}

function goToReg1() {
	window.currentView = "registeruser";
    var currView = dijit.registry.byId("IntroA");
    var mycurrView = currView.getShowingView()
    mycurrView.performTransition("registeruser", 1, "", null);
}

function goToLogin1() {
		window.currentView = "newLogin";
    var currView = dijit.registry.byId("IntroA");
    var mycurrView = currView.getShowingView();
//	myalert("goto login"+mycurrView);
    mycurrView.performTransition("newLogin", 1, "", null);
}

function login() {
    //myalert("login!");
	var currTime = new Date().getTime();
    if(window.loginClickTime!=undefined && currTime - window.loginClickTime < window.boucingTime)
        return;
	window.loginClickTime = currTime;
	dojo.byId("browse-search").innerHTML= "Browse/Search";
    dojo.style("searchmenu","display","block");
    if (is_email(dojo.byId("loginEmail").value))
	{

    var currView = dijit.registry.byId("Login");
    dojo.io.script.get({
        url: base + "client/login?email=" + dojo.byId("loginEmail").value+"&password="+dojo.byId("loginPassword").value,
        callbackParamName: "callback",
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!email"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem25. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
            //alert(result["message"]);
            if (result["Status"] == "success") {
                userObj = result["userObj"];
                usermessage("Welcome! " + userObj["name"]);
				window.shuffle=false;
				//dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');

                window.email = dojo.byId("loginEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
				
               try {Android.setEmail(window.email);
									}catch (err) {}
				calliOSFunction("setemail", [window.email], "onSuccess", "onError");
				window.token = result['token'];
				window.userName = userObj["name"];
				window.userID = result.userObj.id;
				window.isAdmin = result.userObj.isAdmin;
                //alert(window.email);
                setCookie("email", window.email, 365);
                setCookie("token",result['token'], 365);
                //currView.performTransition("ImageView", 1, "slide", null);
                		dojo.byId("loginEmail").value="";
				dojo.byId("loginPassword").value="";
				dojo.byId('browse-search').innerHTML="Browse/Search";
                //for security, we need to make sure other possible showing view gone!!
				$("#MyViewlists").show();
				$("#searchbox").show();
//				$("#searchbutton").show();
                window.afterLogin();
                
                
                
            } else {
				//dojo.byId("loginEmail").value="";
				//dojo.byId("loginPassword").value="";
                myalert("login failed, please check your email and password or register!");
				
            }
        }
    });
	}
	else
	{
		myalert("Please enter a valid email address");
	}
}

function goToReg() {
	window.currentView = "registeruser";
    var currView = dijit.registry.byId("Login");
    currView.performTransition("registeruser", 1, "", null);
}


function goToresetpassword() {
	window.currentView = "reset_password";

    var currView = dijit.registry.byId("newLogin");
    currView.performTransition("reset_password", 1, "", null);
}

function deleteAccount()
{
		var currView = dijit.registry.byId("registeruser");
		window.currentView = "AccountSettings";
		url=base + "client/removeUser?email=" + dojo.byId("deleteAcctEmail").value+"&password="+dojo.byId("deleteAcctPW").value+"&token="+window.token;
		//myalert("delete:"+url);
		dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!removeUser"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem26. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
            //alert(result["message"]);
            if (result["Status"] == "success") {
                var currView = dijit.registry.byId("LogOff");
				myalert(window.email+" your account was successfully deleted");
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
				gotoView("blankview","newLogin");
				},500);
                
                
                
            } else {
                myalert("Delete Account failed, please check your email and password");
            }
        }
    });

}

function hiresswitch() {
    //alert(window.fill);
	console.log($("#hiresswitch"));
	var hrsw = dijit.registry.byId("hires-switch");
    if (window.highresolution) {
	    hrsw.set('label', "Not Active");
        window.highresolution = false;
    } else {
        window.highresolution = true;
		hrsw.set('label', "Active");
    }
	dojo.io.script.get({
        url: base + "client/setresolution?email=" + window.email + "&token=" + window.token + "&highres=" + window.highresolution,
        callbackParamName: "callback",
		
        load: function (result) {
			console.log(result['Message']);
        }
    });

}
function Guest1()
{
	window.currentView = "Intro1";
	GuestLogin();
}
function Guest2()
{
	window.currentView = "Intro2";
	GuestLogin();
}
function Guest3()
{
	window.currentView = "Intro3";
	GuestLogin();
}
function GuestLogin() {
window.guest=true;
window.email="guest@guest.guest";
window.token="guest";
window.activeplayer='No TV Selected';
dojo.byId("browse-search").innerHTML= "Browse";
dojo.style("searchmenu","display","block");
$("#MyViewlists").hide();
$("#searchbox").hide();
//$("#searchbutton").hide();
var currView = dijit.registry.byId("Login");
    dojo.io.script.get({
        url: base + "client/login?email=" + "guest@guest.guest"+"&password="+"guest",
        callbackParamName: "callback",
		timeout: 8000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!email"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem25. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
            //alert(result["message"]);
            if (result["Status"] == "success") {
                userObj = result["userObj"];
              //  usermessage("Welcome! " + userObj["name"]);
				window.shuffle=false;
				//dijit.registry.byId("shufflebutton").set('icon', 'images/media-shuffle2.png');

             //   window.email = dojo.byId("loginEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
            //    window.token = result['token'];
                //alert(window.email);
               // setCookie("email", window.email, 365);
               // setCookie("token",result['token'], 365);
                //currView.performTransition("ImageView", 1, "slide", null);
                		dojo.byId("loginEmail").value="";
				dojo.byId("loginPassword").value="";
				window.tarImage = -1;
                //for security, we need to make sure other possible showing view gone!!
                window.afterLogin();
                
                
                
            } else {
				//dojo.byId("loginEmail").value="";
				//dojo.byId("loginPassword").value="";
                myalert("login failed, please check your email and password or register!");
				
            }
        }
    });
}

function FBlogin() {
//myalert("Facebook login not implemented yet");
calliOSFunction("callFbLogin", [], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	//Android.loadLink("http://mighty-mountain-4653.herokuapp.com/flogin");
    	Android.callFbLogin();
    }
    catch(err){
    	
    }
}

function Googlelogin() {
//myalert("Google login not implemented yet");
    calliOSFunction("callGoogleLogin", [], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	//Android.loadLink("http://mighty-mountain-4653.herokuapp.com/glogin");
    	Android.callGoogleLogin();
    }
    catch(err){
    	
    }
}

function continueLogin(email,token){
	setCookie("email", email, 365);
    setCookie("token", token, 365);
    window.tarImage = -1;
    window.justLogin = true;
    checkCookie();
}


function nativelink(url) {
//myalert("Google login not implemented yet");
    calliOSFunction("loadLink", [url], "onSuccess", "onError");
    try{
	//alert("loading android artkick roku");
    	Android.loadLink(url);
    }
    catch(err){
    	
    }
}
function showterms()
{
	window.lastView="registeruser";
	showiframe("terms of service.htm");
}

function showprivacy()
{
	window.lastView="registeruser";
	showiframe("privacy.htm");
}