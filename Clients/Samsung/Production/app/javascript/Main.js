var widgetAPI = new Common.API.Widget();
var tvKey = new Common.API.TVKeyValue();
var pluginAPI = new Common.API.Plugin();
var baseUrl = "http://sleepy-scrubland-3038.herokuapp.com/client/v1.0";
var baseImageUrl = baseUrl + "/currentImage.json";
var baseRegistrationUrl = "http://evening-garden-3648.herokuapp.com/registration/v1.0";
var deviceMaker = "Samsung";
var deviceId = null;
var registrationToken = null;
var regCode = null;
var regTimeout = null;
var displayImage = null;
var imagePollTimeInterval = 500; // 5 seconds
var registrationTimeInterval = 500; //5 seconds
var duration = 0;	
var retryInterval;
var retryDuration;
var advancePending = false;

var Main =
{
};

onShowEvent = function() {
	pluginAPI.setOffScreenSaver();
};

Main.onLoad = function()
{
	alert('Main : onLoad()');
	alert($('body').width());
	alert($('body').height());
	//ImageViewer = new CImageViewer('Common ImageViewer');
		
	widgetAPI.sendReadyEvent();
	
	//disable the screen saver
	pluginAPI.setOffScreenSaver();
	//try deferring turn off screensaver to onshow as recommended on Samsung D Forum
	window.onShow = onShowEvent;
	
	// Enable key event processing
	this.enableKeys();
	
	deviceId = getDeviceId();
	registrationToken = getRegistrationToken();
	
	if (checkInternetConnection())
	{
		//just attempt to show image -- if not registered, we will get error
		//if(registrationToken == null || registrationToken == "")
		//	register();
		//else
			showInitialImage();
	}
	else
	{
		alert("No internet connection detected.");
		$('#noInternetConnection').show();
	}
};

function showInitialImage()
{
	$('div#screen').show();
	$('div#registration').hide();
	
	//set up information location/size
	setUpInformation();

	getCurrentImage2();
}

function register()
{
	alert("Attempting registration");
	//show...will show "retrieving code..." or similar
	$('#regCode').css('background-color', '#FFFF80');
	$('#regCode').html("retrieving code...");
	
	$('div#registration').show();
	$('div#screen').hide();
	
 	var regDetails = getRegCode();
	duration = 0;	
	retryInterval = 500;
	retryDuration = 300000; //5 minutes
	regCode = regDetails.regCode;
	
	alert("register | retryInterval: " + retryInterval);
	alert("register | retryDuration: " + retryDuration);
	
	//document.getElementById('regCode').innerHTML =  regCode;
	$('#regCode').html(regCode);
	$('#regCode').css('background-color', '#80FF80');
	$('#autoUpdateText').show();
	$('#timedOutText').hide();
	$('#btnRetry').hide();
	$('#btnNewCode').removeClass('ui-state-active');
	$('#btnBack').addClass('ui-state-active');
	
	setTimeout(function() {checkRegistration();}, retryInterval);
};

function checkRegistration()
{
	if (checkRegistrationStatus() == true)
	{
		showInitialImage();
	}
	else if (duration <  retryDuration)
	{
		duration = duration + retryInterval;
		alert("Attempting registration again. Duration: " + duration);
		setTimeout(function() {checkRegistration();}, retryInterval);
	}
	else
	{
		alert("FAILED to register in time limit!  Duration: " + duration);
		$('#regCode').css('background-color', '#FF8080');
		$('#regCode').html('Time Expired');
		$('#autoUpdateText').hide();
		$('#timedOutText').show();
		$('#btnRetry').show();
		$('#btnBack').removeClass('ui-state-active');
		$('#btnRetry').addClass('ui-state-active');
	}
};

function getRegCode()
{
	alert("getRegCode: " + deviceMaker + deviceId);
	var urlGetRegCode   = baseRegistrationUrl + "/getRegCode";
		
	var xhReq = new XMLHttpRequest();
	xhReq.open("GET", urlGetRegCode + "?deviceId=" + deviceId + "&deviceMaker=" + deviceMaker, false);
	xhReq.send(null);
	if(xhReq.status != 200)
	 {
		 alert("Error retrieving reg code.");
		 return null;
	 }
	 
	 var regCodeJson = JSON.parse(xhReq.responseText);
	 alert("getRegCode | response: " + regCodeJson);
	 alert ("regCode: " + regCodeJson.RegCode);
	 alert("retryInterval: " + regCodeJson.RetryInterval);
	 alert("retryDuration: " + regCodeJson.RetryDuration);
	 return new RegistrationDetails(regCodeJson.RegCode, regCodeJson.RetryInterval * 1000, regCodeJson.RetryDuration * 1000);
};

function checkRegistrationStatus()
{
	var urlGetRegCode   = baseRegistrationUrl + "/getRegStatus";
		
	var xhReq = new XMLHttpRequest();
	xhReq.open("GET", urlGetRegCode + "?deviceId=" + deviceId + "&deviceMaker=" + deviceMaker + "&regCode=" + regCode, false);
	xhReq.send(null);
	if(xhReq.status != 200)
	 {
		 alert("Error receiving current image.");
		 return false;
	 }
	 
	 var regStatusJson = JSON.parse(xhReq.responseText);
	 alert("checkRegistrationStatus | response: " + regStatusJson);
	 alert ("Status: " + regStatusJson.Status);
	 alert("RegToken: " + regStatusJson.RegToken);
	 		
	if (regStatusJson.Status != "success")
		return false;
				          
	registrationToken = regStatusJson.RegToken;
	
	if (registrationToken == "" || registrationToken == 'invalid')	
		return false;
	
	alert("Obtained registration token: " + registrationToken);
	saveRegistrationToken(registrationToken);
	
	return true;
		    
};

function getRegistrationToken()
{
	
	var regToken = sf.core.localData("RegistrationToken");
	alert(regToken);
	return regToken;
};

function saveRegistrationToken(regToken)
{
	sf.core.localData("RegistrationToken", regToken);
	alert("saved registration token");
};

function RegistrationDetails(regCode, retryInterval, retryDuration) {
	  this.regCode = regCode;
	  this.retryInterval = retryInterval;
	  this.retryDuration = retryDuration;
};

function getDeviceId()
{
	var networkPlugin=document.getElementById("networkPlugin");
	var MAC = networkPlugin.GetMAC(1);
	alert("MAC: " + MAC);
	return NNaviPlugin.GetDUID(MAC);
};

function checkInternetConnection() {
	var networkPlugin = document.getElementById("networkPlugin");
    var physicalConnection = 0;
    var httpStatus = 0;

    // Get active connection type - wired or wireless.
    var currentInterface = networkPlugin.GetActiveType();

    // If no active connection.
    if (currentInterface === -1) {
            return false;
    }

    // Check physical connection of current interface.
    physicalConnection = networkPlugin.CheckPhysicalConnection(currentInterface);

    // If not connected or error.
    if (physicalConnection !== 1) {
            return false;
    }

    // Check HTTP transport.
    httpStatus = networkPlugin.CheckHTTP(currentInterface);

    // If HTTP is not available.
    if (httpStatus !== 1) {
            return false;
    }

    // Everything went OK.
    return true;
}

function getCurrentImage2()
{
	var params = 
		'deviceId=' + deviceId +
		"&deviceMaker=" + deviceMaker +
		"&regToken=" + registrationToken +
		'';
	
	// fire off the request
	$.ajax({
        url: baseImageUrl + '?' + params,
        type: 'GET',
        timeout: 30000,
        success: function(result) {
        	$('#lostInternetConnection').hide();
        	if (result["StatusCode"] == 101)
        	{
        		alert("Registration code no longer valid, need to re-register");
    			saveRegistrationToken("");
    			register();
        	}
        	else
        	{
	        	var image = new Image(
	        			result["imageURL"] + "?" + result["stretch"] , result["title"],
	        			result["caption"], result["nextPull"], result["stretch"]);
	        	
	        	if (displayImage == null || displayImage.url != image.url)
	        		if (result["imageURL"]!== undefined)
	        			playImage2(image);
	
	        	//set up next pull
	        	if(image.nextPollInterval != null)
	        		imagePollTimeInterval = image.nextPollInterval;
	            //alert("nextPull: "+ imagePollTimeInterval);
	            setTimeout(checkImageChanges, imagePollTimeInterval);
        	}
        },
        error: function(xhr, status, error) {
        	alert("Error receiving current image: " + status + " " + error);
        	$('#lostInternetConnection').show();
        	setTimeout(checkImageChanges, imagePollTimeInterval);
		}
    });
}

function playImage2(image)
{
	alert('playImage via Background image method');
	alert('playImage url: ' + image.url);
	//clear any information message
	info(null);
	imageInfo(null);
	
	//set and show the div containing the image
	$('div#screen').css('background-image', 'url('+image.url+')');
	if(image.stretch=='true')
		$('div#screen').css('background-size','cover');
    else
    	$('div#screen').css('background-size','contain');
    $('div#screen').show();
  
    //show the info when replacing image
    showImageInfo(image, false, false);
    
    displayImage = image;
    
    advancePending = false;
    $('#advancingImageNotice').hide();
};

function isImageUrlValid(url)
{
	var xhReq = new XMLHttpRequest();
	xhReq.open("GET", url, false);
	xhReq.send(null);
	alert ("Status code: " + xhReq.status);
	if(xhReq.status != 200)
		{
		alert("Image Url is not valid.");
		return false;
		}
	return true;
};

function checkImageChanges()
{
	getCurrentImage2();
};

function Image(url, title, caption, nextPollInterval, stretch) {
	  this.url = url;
	  this.title = title;
	  this.caption = caption;
	  this.nextPollInterval = nextPollInterval;
	  this.stretch = stretch;
	};

function advanceImage(next)
{
	var params = 
		'deviceId=' + deviceId +
		"&deviceMaker=" + deviceMaker +
		"&regToken=" + registrationToken +
		"&next=" + next +
		'';
	
	// fire off the request
	$.ajax({
        url: baseUrl + '/nextImage' + '?' + params,
        type: 'GET',
        timeout: 30000,
        success: function(result) {
        	alert("advance image request successful.");
        },
        error: function(xhr, status, error) {
        	alert("Error advancing image.");
		}
    });
};

function setUpInformation()
{
	var infoWidth = $('div#screen').width() * .6; //will be 50% of screen
	var infoX =  $('div#screen').width() * .20;
	var infoY = $('div#screen').height() * .75;
	$('div#information').css("top", infoY + "px");
	$('div#information').css("left", infoX + "px");
	$('div#information').css("width", infoWidth + "px");
}

function info (message) {
	if(message == null)
		{
		$('#imageTitle').html("");
		alert ("setting to null");
		$('#information').hide();
		}
	else
		{
		$('#imageTitle').html(message);
		$('#information').show();
		}
}

function imageInfo (message) {
	if(message == null)
		{
		$('#imageCaption').html("");
		alert ("setting to null");
		$('#information').hide();
		}
	else
		{
		$('#imageCaption').html(message);
		$('#information').show();
		}
}

function showImageInfo(image, doAnimate, doSlide)
{
	if ($('div#information').is(":visible") == true)
		return;
	
	$('div#information').css("opacity", "0.8");
	
	if (doSlide == true)
		$('div#information').css("top", $('div#screen').height() + "px");
	
	if(image.title.length < 100)
		info(image.title); // check length of title
	else
	    info(image.title.substring(0,97)+"...");

	imageInfo(image.caption);
	
	var finalTop = $('div#screen').height() - $('div#information').height();
	
	if (doSlide == true && doAnimate == true)
	{
		$('div#information').css("top", $('div#screen').height + "px");
		//-=50
		//var infoHeight = $('div#information').height();
		$( "#information" ).animate({
		    top: finalTop + "px"
		  }, 400, function() {
		    // Animation complete.
		});
	}
	else if (doSlide == true)
		$('div#information').css("top", finalTop + "px");

    setTimeout(function(){ clearImageInfo(image, true, false); }, 4000);
};

function clearImageInfo(image, doFade, doSlide)
{
	if (image.url == displayImage.url)
	{
		alert('clearing info');
		if (doSlide == true)
		{
			var finalTop = $('div#screen').height();
			$( "#information" ).animate({
			    top: finalTop + "px"
			  }, 400, function() {
				  //animate complete
				  info(null);
				  imageInfo(null);
			  });
		}
		else if (doFade == true)
		{
			$( "#information" ).animate({
			    opacity: 0.1
			  }, 400, function() {
				  //animate complete
				  info(null);
				  imageInfo(null);
			  });
		}
		//info(null);
		//imageInfo(null);
	}
	else
		alert('not clearing info as image was changed before timeout');
}

function showingMain() {
	return ($('div#screen').is(":visible") == true);
}

function showingLostConnection() {
	return ($('div#lostInternetConnection').is(":visible") == true);
}

function devTestBypassReg()
{
	deviceId= "1GH314049254";
	deviceMaker = "Roku";
	registrationToken = "6bfac01b0d740363708d0d451cb0e2bf";
	showInitialImage();
}

Main.onUnload = function()
{
	//ImageViewer.destroy();
};

Main.enableKeys = function()
{
	document.getElementById("anchor").focus();
};

Main.keyDown = function()
{
	var keyCode = event.keyCode;
	var activeButton = null;
	var nextButton = null;
	alert("Key pressed: " + keyCode);

	switch(keyCode)
	{
		case tvKey.KEY_RETURN:
		case tvKey.KEY_PANEL_RETURN:
			alert("RETURN");
			break;
		case tvKey.KEY_LEFT:
		case 1080:
		case 69:
			alert("LEFT");
			if (showingMain() && !showingLostConnection())
			{
				advancePending = true;
				$('#advancingImageNotice').show();
				advanceImage("0");
			}
			break;
		case tvKey.KEY_RIGHT:
		case 1078:
		case 72:
			alert("RIGHT");
			if (showingMain() && !showingLostConnection())
			{
				advancePending = true;
				$('#advancingImageNotice').show();
				advanceImage("1");
			}
			break;
		case tvKey.KEY_UP:
			alert("UP");
			activeButton = $('button.ui-state-active');
			nextButton = activeButton.parent().parent().prev().find('button:visible');
			alert(nextButton.text());
			if (nextButton.length > 0)
			{
				activeButton.removeClass('ui-state-active');
				nextButton.addClass('ui-state-active');
			}
			//works only for two buttons
			//$('#btnNewCode').addClass('ui-state-active');
			//$('#btnBack').removeClass('ui-state-active');
			break;
		case tvKey.KEY_DOWN:
			alert("DOWN");
			//works only for two buttons
			activeButton = $('button.ui-state-active');
			nextButton = activeButton.parent().parent().next().find('button:visible');
			alert(nextButton.text());
			if (nextButton.length > 0)
			{
				activeButton.removeClass('ui-state-active');
				nextButton.addClass('ui-state-active');
			}
			//$('#btnNewCode').removeClass('ui-state-active');
			//$('#btnBack').addClass('ui-state-active');
			break;
		case tvKey.KEY_INFO:
			alert("INFO");
			if ($('div#screen').is(":visible") == true)
			{
				alert("displayImage.caption: " + displayImage.caption);
				//imageInfo (displayImage.title + " " + displayImage.caption);
				//info(displayImage.title);
				//imageInfo(displayImage.caption);
				//setTimeout(function() {imageInfo (null);}, 10000);
				if ($('div#screen').is(":visible") == true)
					showImageInfo(displayImage, false, false);
			}
			break;
		case tvKey.KEY_ENTER:
		case tvKey.KEY_PANEL_ENTER:
			alert("ENTER");
			$('button.ui-state-active').click();
			break;
		case tvKey.KEY_TOOLS:
			alert("TOOLS");	
			break;
		case tvKey.KEY_RED:
			alert("RED key - clearing registration token.");
			saveRegistrationToken("");
			break;
		case tvKey.KEY_GREEN:
			alert("GREEN key - bypassing registration to use test reg");
			//devTestBypassReg();
			break;
		case tvKey.KEY_YELLOW:
			alert("YELLOW key - bypassing registration to use test reg");
			saveRegistrationToken("");
			register();
			break;
		default:
			alert("Unhandled key");
			break;
	}
};
