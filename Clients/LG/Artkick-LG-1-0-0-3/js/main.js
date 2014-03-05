/**
 * 
 */
var baseUrl = "http://sleepy-scrubland-3038.herokuapp.com/client/v1.1";
var baseImageUrl = baseUrl + "/currentImage.json";
var baseRegistrationUrl = "http://evening-garden-3648.herokuapp.com/registration/v1.0";
var deviceMaker = "LG";
var deviceId = null;
var regCode = null;
var regTimeout = null;
var displayImage = null;
var imagePollTimeInterval = 500; // 5 seconds
var registrationTimeInterval = 500; //5 seconds
var duration = 0;	
var retryInterval;
var retryDuration;
var advancePending = false;
var successfulReg = true;

/* Device specific methods */
function getDeviceId()
{
	var device = document.getElementById("device"); 
	macAddress = device.net_macAddress;
    var strippedMac = macAddress.split(":").join("");
    console.log("Device Id: " + strippedMac);
    return strippedMac;
};

function checkInternetConnection() {
	var device = document.getElementById("device"); 
	return device.net_isConnected;
}

function disableScreenSaver() {
	//Note: LG doc says not available on LED/LCD devices
	window.NetCastSetScreenSaver('disabled');
}

/* End of Device specific methods */

var Main =
{
};

onShowEvent = function() {
	disableScreenSaver();
};

Main.onLoad = function()
{
	console.log('Main : onLoad()');
	
	window.onShow = onShowEvent;
	
	//enable key event processing
	this.enableKeys();
	
	//get unique devide id
	deviceId = getDeviceId();
	
	if (checkInternetConnection())
	{
		console.log("Internet connection OK");
		//just attempt to show image -- if not registered, we will get error
		showInitialImage();
	}
	else
	{
		console.log("No internet connection detected.");
		$('#noInternetConnection').show();
	}
};

Main.onUnload = function()
{
	//unload anything as necessary
};

function register()
{
	console.log("Attempting registration");
	successfulReg = false;
	
	//show...will show "retrieving code..." or similar
	$('#regCode').css('background-color', '#FFFF80');
	$('#regCode').html("retrieving code...");
	
	$('div#registration').show();
	$('div#screen').hide();
	
 	//get registration code from server
	getRegCode();
	
	//set inital intervals
	duration = 0;	
	retryInterval = 500;
	retryDuration = 300000; //5 minutes
	
	console.log("register | retryInterval: " + retryInterval);
	console.log("register | retryDuration: " + retryDuration);
	
	$('#autoUpdateText').show();
	$('#timedOutText').hide();
	$('#btnRetry').hide();
	$('#btnNewCode').removeClass('ui-state-active');
	$('#btnBack').addClass('ui-state-active');
	
	setTimeout(function() {checkRegistration();}, retryInterval);
};

function checkRegistration()
{
	checkRegistrationStatus();
	
	if (successfulReg === true)
	{
		showInitialImage();
	}
	else if (duration <  retryDuration)
	{
		duration = duration + retryInterval;
		console.log("Attempting registration again. Duration: " + duration);
		setTimeout(function() {checkRegistration();}, retryInterval);
	}
	else
	{
		console.log("FAILED to register in time limit!  Duration: " + duration);
		//$('#regCode').css('background-color', '#FF8080');
		//$('#regCode').html('Time Expired');
		$('#autoUpdateText').hide();
		$('#timedOutText').show();
		$('#btnRetry').show();
		$('#btnBack').removeClass('ui-state-active');
		$('#btnRetry').addClass('ui-state-active');
	}
};

function updateRegCode(regCode) {
	$('#regCode').html(regCode);
	$('#regCode').css('background-color', '#80FF80');
}

function getRegCode()
{
	console.log("getRegCode: " + deviceMaker + deviceId);
	var urlGetRegCode   = baseRegistrationUrl + "/getRegCode";
	
	console.log('Get Reg Code: ' + urlGetRegCode + "?deviceId=" + deviceId + "&deviceMaker=" + deviceMaker);
	 
	// fire off the request
	$.ajax({
        url: urlGetRegCode + "?deviceId=" + deviceId + "&deviceMaker=" + deviceMaker,
        type: 'GET',
        dataType: 'jsonp',
        timeout: 30000,
        success: function(result) {
        	console.log(result);
        	regCode = result["RegCode"];
        	updateRegCode(regCode);
        },
        error: function(xhr, status, error) {
        	alert('Could not get reg code.');
		}
    });
};

function checkRegistrationStatus()
{
	var urlCheckRegStatus   = baseRegistrationUrl + "/getRegStatus";
	var success = false;
	
	console.log('Check Registration Status: ' + urlCheckRegStatus + "?deviceId=" + deviceId + "&deviceMaker=" + deviceMaker  + "&regCode=" + regCode);
	
	// fire off the request
	$.ajax({
        url: urlCheckRegStatus + "?deviceId=" + deviceId + "&deviceMaker=" + deviceMaker + "&regCode=" + regCode,
        type: 'GET',
        dataType: 'jsonp',
        timeout: 30000,
        success: function(result) {
        	console.log(result.Status);
        	successfulReg = (result.Status === "success") ? true : false;
        },
        error: function(xhr, status, error) {
        	alert("Could not get registration status");
		}
    });    
};

function showInitialImage()
{
	$('div#screen').show();
	$('div#registration').hide();
	
	//set up information location/size
	setUpInformation();

	getCurrentImage();
}

function getCurrentImage()
{
	console.log("Getting Current Image");
	var params = 
		'deviceId=' + deviceId +
		"&deviceMaker=" + deviceMaker +
		'';
	
	// fire off the request
	$.ajax({
        url: baseImageUrl + '?' + params,
        type: 'GET',
        dataType: 'jsonp',
        timeout: 30000,
        success: function(result) {
        	$('#lostInternetConnection').hide();
        	if (result["StatusCode"] == 101)
        	{
        		console.log("Registration code no longer valid, need to re-register");
    			register();
        	}
        	else
        	{
        		console.log("Attempting to show image");
	        	var image = new Image(
	        			result["imageURL"] + "?" + result["stretch"] , result["title"],
	        			result["caption"], result["nextPull"], result["stretch"]);
	        	
	        	if (displayImage == null || displayImage.url != image.url)
	        		if (result["imageURL"]!== undefined)
	        			playImage(image);
	
	        	//set up next pull
	        	if(image.nextPollInterval != null)
	        		imagePollTimeInterval = image.nextPollInterval;
	            //console.log("nextPull: "+ imagePollTimeInterval);
	            setTimeout(checkImageChanges, 10000 /*imagePollTimeInterval*/);
        	}
        },
        error: function(xhr, status, error) {
        	console.log("Error receiving current image: " + status + " " + error);
        	$('#lostInternetConnection').show();
        	setTimeout(checkImageChanges, imagePollTimeInterval);
		}
    });
}

function playImage(image)
{
	console.log('playImage via Background image method');
	console.log('playImage url: ' + image.url);
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
	console.log ("Status code: " + xhReq.status);
	if(xhReq.status != 200)
		{
		console.log("Image Url is not valid.");
		return false;
		}
	return true;
};

function checkImageChanges()
{
	getCurrentImage();
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
		"&next=" + next +
		'';
	
	// fire off the request
	$.ajax({
        url: baseUrl + '/nextImage' + '?' + params,
        type: 'GET',
        dataType: 'jsonp',
        timeout: 30000,
        success: function(result) {
        	console.log("advance image request successful.");
        },
        error: function(xhr, status, error) {
        	console.log("Error advancing image.");
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
		console.log ("setting to null");
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
		console.log ("setting to null");
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
		console.log('clearing info');
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
		console.log('not clearing info as image was changed before timeout');
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
	//registrationToken = "6bfac01b0d740363708d0d451cb0e2bf";
	showInitialImage();
}

Main.enableKeys = function()
{
	document.getElementById("anchor").focus();
};

Main.keyDown = function()
{
	var keyCode = event.keyCode || event.which;
	var activeButton = null;
	var nextButton = null;
	console.log("Key pressed: " + keyCode);

	switch(keyCode)
	{
		//case tvKey.KEY_RETURN:
		//case tvKey.KEY_PANEL_RETURN:
		case VK_BACK:
			console.log("BACK");
			if (window.NetCastBack) {
				window.NetCastBack();
			}
			break;
		case VK_REWIND:
		//case VK_LEFT:
			console.log("LEFT");
			if (showingMain() && !showingLostConnection())
			{
				advancePending = true;
				$('#advancingImageNotice').show();
				advanceImage("0");
			}
			break;
		case VK_FAST_FWD:
		//case VK_RIGHT:
			console.log("RIGHT");
			if (showingMain() && !showingLostConnection())
			{
				advancePending = true;
				$('#advancingImageNotice').show();
				advanceImage("1");
			}
			break;
		//case VK_PAGE_UP:
		case VK_UP:
			console.log("UP");
			activeButton = $('button.ui-state-active');
			nextButton = activeButton.parent().parent().prev().find('button:visible');
			console.log(nextButton.text());
			if (nextButton.length > 0)
			{
				activeButton.removeClass('ui-state-active');
				nextButton.addClass('ui-state-active');
			}
			//works only for two buttons
			//$('#btnNewCode').addClass('ui-state-active');
			//$('#btnBack').removeClass('ui-state-active');
			break;
		//case VK_PAGE_DOWN:
		case VK_DOWN:
			console.log("DOWN");
			//works only for two buttons
			activeButton = $('button.ui-state-active');
			nextButton = activeButton.parent().parent().next().find('button:visible');
			console.log(nextButton.text());
			if (nextButton.length > 0)
			{
				activeButton.removeClass('ui-state-active');
				nextButton.addClass('ui-state-active');
			}
			//$('#btnNewCode').removeClass('ui-state-active');
			//$('#btnBack').addClass('ui-state-active');
			break;
		//case tvKey.KEY_INFO:
		case VK_INFO:
			console.log("INFO");
			if ($('div#screen').is(":visible") == true)
			{
				console.log("displayImage.caption: " + displayImage.caption);
				//imageInfo (displayImage.title + " " + displayImage.caption);
				//info(displayImage.title);
				//imageInfo(displayImage.caption);
				//setTimeout(function() {imageInfo (null);}, 10000);
				if ($('div#screen').is(":visible") == true)
					showImageInfo(displayImage, false, false);
			}
			break;
		
		case VK_ENTER:
			console.log("ENTER");
			$('button.ui-state-active').click();
			break;
		case VK_RED:
			console.log("RED key - clearing registration token.");
			//saveRegistrationToken("");
			break;
		case VK_GREEN:
			console.log("GREEN key - bypassing registration to use test reg");
			devTestBypassReg();
			break;
		case VK_YELLOW:
			console.log("YELLOW key - bypassing registration to use test reg");
			//saveRegistrationToken("");
			register();
			break;
		default:
			console.log("Unhandled key");
			break;
	}
};

