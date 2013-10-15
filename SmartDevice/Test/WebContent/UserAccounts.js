function emailPwLogout(){
	var currView = dijit.registry.byId("reset_password");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();
}

function emailPW(){
	dojo.io.script.get({
		url:base+"client/emailPassword?email="+dojo.byId("recoveryEmail").value,
		callbackParamName: "callback",
		load: function(result){
			 alert(result["message"]);
			 if(result["status"]=="success"){
			 	emailPwLogout();
			 }
		}
	});
}

function changePwLogout(){
	var currView = dijit.registry.byId("AccountSettings");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    currView.performTransition("Login", 1, "slide", null);
    cleanUp();
}

function changePW() {
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
             alert(result["message"]);
             if(result["status"]=="success"){
             	changePwLogout();
             }
       	 }
       });
	}
}

function createUser() {
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
	if (dojo.byId("regUserEmail").value =="")
	{
		alert("User email cannot be blank");
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
            if (result["status"] == "success") {
                usermessage("Welcome " + dojo.byId("regUserName").value + "!");
                currView.performTransition("ImageView", 1, "slide", null);
                window.email = dojo.byId("regUserEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
				setCookie("email", window.email, 365);
                //currView.performTransition("ImageView", 1, "slide", null);
                
                //for security, we need to make sure other possible showing view gone!!
                window.afterLogin();
                //alert(window.email);
            } else {
                alert(result["message"]);
            }

        }
    });

}

function dologout() {

    var currView = dijit.registry.byId("LogOff");
    window.email = null;
    // code to delete cookie and log out user goes here
    setCookie("email", null, 1);
    //currView.performTransition("Login", 1, "slide", null);
    gotoView("LogOff","blankview");
    cleanUp();
    setTimeout(function(){
    	gotoView("blankview","Login");
    },1000);

}

function goToReg1() {
    var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView()
    mycurrView.performTransition("registeruser", 1, "slide", null);
}

function goToLogin1() {
    var currView = dijit.registry.byId("Intro0");
    var mycurrView = currView.getShowingView();
//	alert("goto login"+mycurrView);
    mycurrView.performTransition("Login", 1, "slide", null);
}

function login() {
    //alert("login!");
	var currTime = new Date().getTime();
    if(window.loginClickTime!=undefined && currTime - window.loginClickTime < window.boucingTime)
        return;
	window.loginClickTime = currTime;
    
    

    var currView = dijit.registry.byId("Login");
    dojo.io.script.get({
        url: base + "client/login?email=" + dojo.byId("loginEmail").value+"&password="+dojo.byId("loginPassword").value,
        callbackParamName: "callback",
        load: function (result) {
            //alert(result["message"]);
            if (result["status"] == "success") {
                userObj = result["userObj"];
                usermessage("Welcome! " + userObj["name"]);

                window.email = dojo.byId("loginEmail").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();
                //alert(window.email);
                setCookie("email", window.email, 365);
                //currView.performTransition("ImageView", 1, "slide", null);
                
                //for security, we need to make sure other possible showing view gone!!
                window.afterLogin();
                
                
                
            } else {
                alert("login failed, please check your email and password or register!");
            }
        }
    });
}

function goToReg() {
    var currView = dijit.registry.byId("Login");
    currView.performTransition("registeruser", 1, "slide", null);
}


function goToresetpassword() {
    var currView = dijit.registry.byId("Login");
    currView.performTransition("reset_password", 1, "slide", null);
}