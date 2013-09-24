
Function CreateZwamyConnection()As Object
	zwamy = {
		port: CreateObject("roMessagePort"),
		http: CreateObject("roUrlTransfer"),
		
		Register: Register
		}

	return zwamy
End Function

Function DisplaySetup(port as object)
	slideshow = CreateObject("roSlideShow")
	slideshow.SetMessagePort(port)
	slideshow.SetUnderscan(0.0)      ' shrink pictures by 5% to show a little bit of border (no overscan)
	slideshow.SetBorderColor("#000000")
	slideshow.SetMaxUpscale(8.0)
	'slideshow.SetDisplayMode("best-fit")
	slideshow.SetPeriod(6)
	slideshow.Show()
	return slideshow
End Function

Sub Register(text as String)
	regStatusCode = doRegistration(text)
	'if(regStatusCode = 0) then	
		'Display()
	'end if
	
End Sub

Sub Display()

	m.DeviceMaker	  = "Roku"
	m.ImagePollUrlBase = "http://sleepy-scrubland-3038.herokuapp.com/client/v1.0"
    m.UrlGetCurrentImage = m.ImagePollUrlBase + "/currentImage.json"
	
	m.sn = GetDeviceESN() 
	print "sn: " + m.sn
	m.RegistrationToken = loadRegistrationToken()
	print "RegistrationToken: " + m.RegistrationToken
	slideshow = DisplaySetup(m.port)
	waitport = CreateObject("roMessagePort")
	currentDislayImageURL = ""
	pollInterval = 2000 ' default poll interval
	looppoint:
	image = getImage()
	
	if image <> invalid
		if image.URL+image.Stretch <> currentDislayImageURL then
			slides = CreateObject("roArray", 10, true)
			currentDislayImageURL = image.URL+image.Stretch
			
			If(image.Stretch = "true")
				slideshow.SetDisplayMode("zoom-to-fill")
			Else
				slideshow.SetDisplayMode("scale-to-fit")
			End If
			
			addImage(slides, image.URL, image.Title, image.Description)
			pollInterval = image.PollInterval
			doSlideShow(slides, 0, 3000, slideshow)
		end if
	end if

	wait(pollInterval, waitport)
	goto looppoint
	
End Sub

Sub addImage(slides as object, imageUrl as string, left as string, right as string)
	print "addImage--imageUrl: " + imageUrl
	print "addImage--left: " + left
	print "addImage--right: " + right
    aa = CreateObject("roAssociativeArray")
    aa.url = imageUrl
    aa.TextOverlayUL = left
    aa.TextOverlayUR = "" 'right
    aa.TextOverlayBody = chr(10) + right 'chr(10) + imageUrl 
    slides.Push(aa)
end sub

Sub doSlideShow(slides as object, delay as integer, texttime as integer, slideshow as object)
    slideshow.setcontentlist(slides)
    slideshow.setTextOverlayHoldTime(texttime) ' milliseconds
    slideshow.Show()

	 'while (true)
		msg = wait(delay, m.port)
		if type(msg) = "roSlideShowEvent" then
			print "roSlideShowEvent:"; msg.getmessage()
			if msg.isScreenClosed() then
				return
			endif
		endif
	'end while
End sub

Function getImage() As Object
    print "getImage()--Current Image: " + m.UrlGetCurrentImage +"-" + m.sn + " " + m.DeviceMaker + " " + m.RegistrationToken
	http = NewHttp(m.UrlGetCurrentImage)
	http.AddParam("deviceId", m.sn)
	http.AddParam("deviceMaker", m.DeviceMaker)
	http.AddParam("regToken", m.RegistrationToken)
	
	response = http_get_to_string_with_retry(http)
	if response=invalid
		return invalid
	end if
   	print "getImage() | response: " + response
    json = ParseJSON(response)
	
	if json=invalid
		return invalid
	end if
	
	if json.Status <> "Success"
		if json.StatusCode = 101
			'device was registered previously but registration has been removed on the server
			deleteRegistrationToken()
			Register("We encountered a problem. Please re-link your Roku player to your account")
		else
			Dbg("Not able to retrieve current image.")
			howConnectionFailed()
			return invalid
		end if
	End If
	
	picture = {
				URL:json.imageURL + "?" + json.stretch
				Title:json.title
                Description:json.caption
				PollInterval:json.nextPull
				Stretch:json.stretch
              }
	return picture
 End Function