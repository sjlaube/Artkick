
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

Function DisplaySetupScreen(port as object)
	screen = CreateObject("roScreen")
	'screen.SetMessagePort(port)
	return screen
End Function

Function DisplaySetupCanvas(screenSize as object)
	xPos = int(screenSize.w/2) - 250
	yPos = int(screenSize.h / 2)
	print "Connecting text drawn at: "; xPos; "," ; yPos
	canvasItems = [
        { 
            Text:"Connecting to Artkick..."
            TextAttrs:{Color:"#FFCCCCCC", Font:"Medium",
            HAlign:"HCenter", VAlign:"VCenter",
            Direction:"LeftToRight"}
            TargetRect:{x: xPos, y: yPos, w:500, h:60}
        }
    ] 
 
    canvas = CreateObject("roImageCanvas")
    port = CreateObject("roMessagePort")
    canvas.SetMessagePort(port)
    'Set opaque background
    canvas.SetLayer(0, {Color:"#FF000000", CompositionMode:"Source"}) 
    'canvas.SetRequireAllImagesToDraw(true)
	canvas.SetLayer(1, canvasItems)
	canvas.Show()
	return canvas
End Function

Sub Register(text as String)
	regStatusCode = doRegistration(text)
	'if(regStatusCode = 0) then	
		'Display()
	'end if
	
End Sub

Sub DisplayWithRoSlideshow()

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

Sub DisplayWithScreen()

	m.DeviceMaker	  = "Roku"
	m.ImagePollUrlBase = "http://sleepy-scrubland-3038.herokuapp.com/client/v1.0"
    m.UrlGetCurrentImage = m.ImagePollUrlBase + "/currentImage.json"
	m.UrlAdvanceImage = m.ImagePollUrlBase + "/nextImage"
	m.TransientDialog = invalid
	
	m.sn = GetDeviceESN() 
	print "sn: " + m.sn
	m.RegistrationToken = loadRegistrationToken()
	'print "RegistrationToken: " + m.RegistrationToken
	'slideshow = DisplaySetup(m.port)
	screen = DisplaySetupScreen(m.port)
	
	http = CreateObject("roUrlTransfer")      ' Moved here from while loop to potentially save resources
	tmpImageFile1 = "tmp:/myImage1.jpg"
	tmpImageFile2 = "tmp:/myImage2.jpg"
	tmpImageFile = tmpImageFile1
	
	'determine screen ratio
	deviceInfo = CreateObject("roDeviceInfo")
	screenSize = deviceInfo.GetDisplaySize()
	screenRatio = screenSize.w / screenSize.h
	print "Screen Ratio: " ; screenRatio
	
	fontReg = CreateObject("roFontRegistry")
	font = fontReg.GetDefaultFont(16, true, false)
	'font = "medium"
	fontHeight = font.GetOneLineHeight()
	m.showingInfo = false
	m.advancePending = false
	
	initialText = "retrieving image from Artkick..."
	textLength = font.GetOneLineWidth(initialText, 500)
	screen.DrawText(initialText, (screenSize.w/2) - (textLength/2), screenSize.h / 2, &hFF00FFFF, font)
	screen.Finish()
	
	'waitport = CreateObject("roMessagePort")
	waitport = screen.GetMessagePort()
	msg = invalid
	
	currentDislayImageURL = ""
	pollInterval = 2000 ' default poll interval
	looppoint:
	
	if msg <> invalid then
	    print msg
		if (type(msg) = "roUniversalControlEvent") then
			buttonPressed = msg.GetInt()
			print "button pressed: "; buttonPressed
			if buttonPressed = 10 then
				if m.showingInfo then
					if (bmpImage <> invalid) then
						screen.Clear(&H000000FF)
						screen.DrawScaledObject(x, y, scaledWidth / bmpImage.GetWidth(), scaledHeight / bmpImage.GetHeight(), bmpImage)
						screen.Finish()
					else
						print "Tried to redraw over info but bmpImage is invalid"
					end if
					print "closing info "
					'm.TransientDialog.Close()
					m.showingInfo = false
				else
					textLength = font.GetOneLineWidth(image.Title, 500)
					if font.GetOneLineWidth(image.Title, 500) > textLength then
						textLength = font.GetOneLineWidth(image.Description, 500)
					end if
					textX = 100
					textY = screenSize.h * 3 / 4
					screen.DrawRect(textX, textY, textLength, fontHeight*2, &h00000050)
					screen.DrawText(image.Title, textX, textY, &hFFFFFFFF, font)
					screen.DrawText(image.Description, textX, textY + fontHeight, &hFFFFFFFF, font)
					screen.Finish()
					print "showing info "
					m.showingInfo = true
				end if
			else if buttonPressed = 4 then
				print "prev image"
				if m.advancePending = false then
					messageToShow = "Requesting previous image..."
					textLength = font.GetOneLineWidth(messageToShow, 500)
					textX = screenSize.w/2 - textLength/2
					textY = screenSize.h - 50
					screen.DrawRect(textX, textY, textLength, fontHeight, &h00000050)
				    screen.DrawText(messageToShow, textX, textY, &hFFFFFFFF, font)
				    screen.Finish()
					m.advancePending = true
				    advanceImage("0")
				end if
				goto waitpoint
			else if buttonPressed = 5 then
				if m.advancePending = false then
					messageToShow = "Requesting next image..."
					textLength = font.GetOneLineWidth(messageToShow, 500)
					textX = screenSize.w/2 - textLength/2
					textY = screenSize.h - 50
					screen.DrawRect(textX, textY, textLength, fontHeight, &h00000050)
				    screen.DrawText(messageToShow, textX, textY, &hFFFFFFFF, font)
				    screen.Finish()
					m.advancePending = true
				    advanceImage("1")
				end if
				goto waitpoint
			end if
		end if
	end if
	
	image = getImage()
	
	if image <> invalid
		if image.URL+image.Stretch <> currentDislayImageURL then
			print "Changing Image: " 
			'slides = CreateObject("roArray", 10, true)
			currentDislayImageURL = image.URL+image.Stretch
			
			'If(image.Stretch = "true")
			'	slideshow.SetDisplayMode("zoom-to-fill")
			'Else
			'	slideshow.SetDisplayMode("scale-to-fit")
			'End If
			
			'addImage(slides, image.URL, image.Title, image.Description)
			pollInterval = image.PollInterval
			'doSlideShow(slides, 0, 3000, slideshow)
			
			'get the image to file
			http.SetUrl(image.URL)
            http.GetToFile(tmpImageFile)

			'Initialize bitmap
			bmpImage = CreateObject("roBitmap", tmpImageFile)
			
			if bmpImage <> invalid then
			'figure out image scaling
			imageRatio = bmpImage.GetWidth() / bmpImage.GetHeight()
			print "Image Ratio: " ; imageRatio
			if imageRatio <= screenRatio then
				 'The scaled size is based on the height
				 scaledHeight = screenSize.h
				 scaledWidth = scaledHeight * imageRatio
			else
				 'The scaled size is based on the width
				 scaledWidth = screenSize.w
				 scaledHeight = scaledWidth / imageRatio
			end if
			print "Image Scaled Size: " ; scaledWidth ; "w " ; scaledHeight ; "h"
			print "Image Scaled % w: " ; scaledWidth / bmpImage.GetWidth() ; " h: " ; scaledHeight / bmpImage.GetHeight()
			
			'figure out position on screen
			x = 0
			if scaledWidth < screensize.w then
				x = (screensize.w / 2) - (scaledWidth / 2)
			end if
			y = 0
			if scaledHeight < screensize.h then
				y = (screensize.h / 2) - (scaledHeight / 2)
			end if
			
			'draw image
			screen.Clear(&H000000FF)
			screen.DrawScaledObject(x, y, scaledWidth / bmpImage.GetWidth(), scaledHeight / bmpImage.GetHeight(), bmpImage)
			screen.Finish()
			'dfDrawImage(screen, image.URL, 0, 0)
			else
				print "OOOOPS! Can not create image bitmap"; image.Title; " "; image.URL
			end if
			m.advancePending = false
		end if
	end if

	waitpoint:
	msg = wait(pollInterval, waitport)
	goto looppoint
	
End Sub


Sub displayRegScreen() As Object
    regscreen = CreateObject("roCodeRegistrationScreen")
    regscreen.SetMessagePort(CreateObject("roMessagePort"))

    regscreen.SetTitle("")
    regscreen.AddParagraph("Please link your Roku player to your account")
    regscreen.AddFocalText(" ", "spacing-dense")
    regscreen.AddFocalText("Artkick connects this TV to an IOS or Android phone or tablet.", "spacing-dense")
    regscreen.AddFocalText("Install Artkick from the the App Store or Google Play.", "spacing-dense")
    regscreen.AddFocalText("Goto Settings/Connect New TV/Connect New Roku", "spacing-dense")
    regscreen.AddFocalText("and enter this code to activate:", "spacing-dense")
    regscreen.SetRegistrationCode("retrieving code...")
    regscreen.AddParagraph("This screen will automatically update as soon as your activation completes")
    'regscreen.AddButton(0, "Get a new code")
    'regscreen.AddButton(1, "Back")
    regscreen.Show()
    return regscreen
End Sub


Sub dialRegDevice()
  dialUrl = "http://evening-garden-3648.herokuapp.com/registration/v1.0/deviceReg"
  httpDial = NewHttp(dialUrl)
  httpDial.AddParam("deviceId",m.sn)
  httpDial.AddParam("deviceMaker",m.DeviceMaker)
  httpDial.AddParam("email", m.dialemail)
  httpDial.AddParam("nickname", m.dialnickname)
  dialPort = httpDial.Http.GetPort()
  httpDial.Http.AsyncGetToString()
  startTime = CreateObject("roDateTime").asSeconds()
  timeout = 15
  tryTimes = 5
  regSuccess = false
  looping = true

  while looping
    currTime = CreateObject("roDateTime").asSeconds()
    if currTime - startTime > timeout
       print "time out"
       if tryTimes > 0
         startTime = currTime
         httpDial.Http.AsyncCancel()
         httpDial.Http.AsyncGetToString()
         tryTimes = tryTimes - 1
       else
         looping = false
       end if
    end if
    dialEvent = dialPort.GetMessage()
    if dialEvent <> invalid
       if type(dialEvent) = "roUrlEvent"
          response = dialEvent.GetString()
          print "dialReg | response: " + response  
          result = ParseJSON(response)
          if result = invalid
             print "json invalid!"
          else
             if result.Status = "success"
                regSuccess = true
                looping = false
             end if  
          end if
       end if
    end if
  end while

  if regSuccess
    poll(false)
  end if
End Sub

Sub Poll(isSaver)
  print "start polling"
  m.pollBase =  "http://shrouded-chamber-7349.herokuapp.com/poll"
  m.ImageUrlBase = "http://sleepy-scrubland-3038.herokuapp.com/client/v1.0"
  m.UrlGetCurrentImage = m.ImageUrlBase + "/currentImage"
  m.UrlGetNextImage = m.ImageUrlBase + "/nextImage"
  m.UrlGetRegCode  = "http://evening-garden-3648.herokuapp.com/registration/v1.0/getRegCode"
  m.inReg = false

  capDuration = 6
  regDuration = 900
  autoInterval = 0
  autoStamp = -1
  magicStamp = -1
  magicCount = 0
  tickleStamp = -1
  tickleInterval = 200
 
  'init
  'determine screen ratio
  deviceInfo = CreateObject("roDeviceInfo")
  screenSize = deviceInfo.GetDisplaySize()
  screenRatio = screenSize.w / screenSize.h
  print "Screen Ratio: " ; screenRatio
  
	
  'set up screen
  canvas = DisplaySetupCanvas(screenSize)
	
  httpImage = CreateObject("roUrlTransfer")      'an http client for image download
  httpImage.SetPort(CreateObject("roMessagePort")) 'add a port for the http image client
  httpPoll = NewHttp(m.pollBase)  'an http client for poll 
  httpPoll.AddParam("user",  m.deviceMaker + m.sn) 'add identifier

  httpCurr = NewHttp(m.UrlGetCurrentImage)
  httpCurr.AddParam("deviceId",m.sn)
  httpCurr.AddParam("deviceMaker",m.DeviceMaker)

  httpPrev = NewHttp(m.UrlGetNextImage)
  httpPrev.AddParam("deviceId",m.sn)
  httpPrev.AddParam("deviceMaker",m.DeviceMaker)
  httpPrev.AddParam("next", "0")


  httpNext = NewHttp(m.UrlGetNextImage)
  httpNext.AddParam("deviceId",m.sn)
  httpNext.AddParam("deviceMaker",m.DeviceMaker)
  httpNext.AddParam("next", "1")

  httpReg = NewHttp(m.UrlGetRegCode)
  httpReg.AddParam("deviceId",m.sn)
  httpReg.AddParam("deviceMaker",m.DeviceMaker)


  
  tmpImageFileBase = "tmp:/myImage"
  tmpImageFile = "tmp:/myImage1.jpg"
  fileVersion = 0
	
  'set up fonts
  m.fontReg = CreateObject("roFontRegistry")
  m.defaultFont = m.fontReg.GetDefaultFont(24, false, false)

  'initial state
  m.showingInfo = false
  m.advancePending = false 
	
  
  messagePort = canvas.GetMessagePort()
  pollPort = httpPoll.Http.GetPort()
  imagePort = httpImage.GetPort()
  currPort = httpCurr.Http.GetPort()
  prevPort = httpPrev.Http.GetPort()
  nextPort = httpNext.Http.GetPort()
  regPort = httpReg.Http.GetPort()
  regScreen = invalid

  
  
  currentDislayImageURL = ""
  currImage = invalid
  
   
  'set up a timer
  CapShowStart = -1  'starting time of showing caption, initialized as -1
  regCodeStamp = -1  'the timestamp of a regcode
  
  'get the current image and settings first
  httpCurr.Http.AsyncGetToString()

  'start first poll
  httpPoll.Http.AsyncGetToString()
  lastPoll = CreateObject("roDateTime").asSeconds()
  pollTimeout = 29
  magicTimeout = 3
  currentTime = 0
  currentHour = -1
  
  cancelImageDownload = false
  
  'this main loop is never blocked, we use asynchrous style
  while true
    'get currentTime in milliseconds
    timeObj = CreateObject("roDateTime")
    currentTime = timeObj.asSeconds()
    timeObj.toLocalTime()
    currentHour = timeObj.GetHours()

    'check tickle
    if isSaver = false and currentTime - tickleStamp >= tickleInterval
      print "tickle the player..."
      tickleStamp = currentTime
      tickle()
    end if

    'check auto play
    'print (currentTime - autoStamp).toStr()
    if autoInterval > 0 and currentTime - autoStamp >= autoInterval
      autoStamp = currentTime
      print "do auto play"
      httpNext.Http.AsyncCancel()
      httpNext.Http.AsyncGetToString()
    end if

    if autoInterval = -1 and currentHour = 3 and currentTime - autoStamp > 3600
      autoStamp = currentTime
      print "do auto play"
      httpNext.Http.AsyncCancel()
      httpNext.Http.AsyncGetToString()
    end if

    
    'check if regcode is expired
    if m.inReg and regCodeStamp <> -1 and currentTime - regCodeStamp > regDuration
       print "registration code expired!"
       if regScreen <> invalid
          regscreen.SetRegistrationCode("retrieving code...")             
       end if
       regCodeStamp = -1
       httpReg.Http.AsyncCancel()
       httpReg.Http.AsyncGetToString()
    end if


    'check regCode response
    regEvent = regPort.GetMessage()
    if m.inReg and regEvent <> invalid
       if type(regEvent) = "roUrlEvent"
          response = regEvent.GetString()
          print "regToken | response: " + response
          result = ParseJSON(response)
          if result = invalid
             print "json invalid!"
          else
             if result.Status = "success"
                 regCodeStamp = currentTime
                 regscreen.SetRegistrationCode(result.RegCode)
             end if
          end if
       end if
    end if


    'check if caption needs to be hidden
    if currentTime - CapShowStart > capDuration
       if m.showingInfo
         print "hide caption"
         m.showingInfo = false
         hideCaptionImageCanvas(canvas)
       end if
    end if
  
    currEvent = currPort.GetMessage()
    if currEvent <> invalid
       if type(currEvent) = "roUrlEvent"
          response = currEvent.GetString()
          print "currImage | response: " + response  
          result = ParseJSON(response)
          if result = invalid
             print "json invalid!"
          else
             urlTrans = CreateObject("roUrlTransfer")
             if result.Status = "Success"
                if result.autoInterval <> invalid
                   autoInterval = int(result.autoInterval/1000)
                   print "autoInterval set: "+autoInterval.tostr()
                end if

                autoStamp = -1
                currImage = {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                   URL:urlTrans.unescape(result.imageURL) + "?" + result.stretch+"=0"
	           Title:urlTrans.unescape(result.title)
                   Description:urlTrans.unescape(result.caption)
	           PollInterval:result.nextPull
	           Stretch:result.stretch
                }

                'check autoplay status and others...
              
                'triger async downloader
                if currImage.URL <> currentDislayImageURL
                  httpImage.SetUrl(currImage.URL)
                  print "get url is: "; httpImage.GetUrl()
                  httpImage.AsyncGetToFile(tmpImageFile)                
                
                end if
             else
               print "the device is unlinked!"
               m.inReg = true
               regScreen = displayRegScreen()
               httpReg.Http.AsyncCancel()
               httpReg.Http.AsyncGetToString()
             end if
          end if
       end if
    end if


    prevEvent = prevPort.GetMessage()
    if prevEvent <> invalid and m.inReg = false
       if type(prevEvent) = "roUrlEvent"
          response = prevEvent.GetString()
          print "prevImage | response: " + response  
          result = ParseJSON(response)
          if result = invalid
             print "json invalid!"
          else
             urlTrans = CreateObject("roUrlTransfer")
             if result.Status = "Success"
                currImage = {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                   URL:urlTrans.unescape(result.imageURL) + "?" + result.stretch+"=0"
	           Title:urlTrans.unescape(result.title)
                   Description:urlTrans.unescape(result.caption)
	           PollInterval:result.nextPull
	           Stretch:result.stretch
                }

                'check autoplay status and others...
              
                'triger async downloader
                if currImage.URL <> currentDislayImageURL
	         canvasItems = [
		   { 
		     Text:"Loading previous image…",
		     TextAttrs:{Color:"#FFCCCCCC", Font: "Small",
		     HAlign:"Center", VAlign:"Center",
		     Direction:"LeftToRight"}
	             TargetRect:{x: 50, y: screenSize.h - 60 , w:400, h:30}
		   }
	         ] 
                 canvas.SetLayer(3, canvasItems)
		 canvas.Show()
                  httpImage.SetUrl(currImage.URL)
                  print "get url is: "; httpImage.GetUrl()
                  httpImage.AsyncGetToFile(tmpImageFile)                
                
                end if
   
             end if
          end if
       end if
    end if


    nextEvent = nextPort.GetMessage()
    if nextEvent <> invalid and m.inReg = false
       if type(nextEvent) = "roUrlEvent"
          response = nextEvent.GetString()
          print "nextImage | response: " + response  
          result = ParseJSON(response)
          if result = invalid
             print "json invalid!"
          else
             urlTrans = CreateObject("roUrlTransfer")
             if result.Status = "Success"
                currImage = {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                   URL:urlTrans.unescape(result.imageURL) + "?" + result.stretch+"=0"
	           Title:urlTrans.unescape(result.title)
                   Description:urlTrans.unescape(result.caption)
	           PollInterval:result.nextPull
	           Stretch:result.stretch
                }

                'check autoplay status and others...
              
                'triger async downloader
                if currImage.URL <> currentDislayImageURL
	         canvasItems = [
		   { 
		     Text:"Loading next image…",
		     TextAttrs:{Color:"#FFCCCCCC", Font: "Small",
		     HAlign:"Center", VAlign:"Center",
		     Direction:"LeftToRight"}
	             TargetRect:{x: 50, y: screenSize.h - 60 , w:400, h:30}
		   }
	         ] 
                 canvas.SetLayer(3, canvasItems)
		 canvas.Show()
                  httpImage.SetUrl(currImage.URL)
                  print "get url is: "; httpImage.GetUrl()
                  httpImage.AsyncGetToFile(tmpImageFile)                
                
                end if
   
             end if
          end if
       end if
    end if
   


    pollEvent = pollPort.GetMessage()
    if pollEvent <> invalid
      
      if type(pollEvent) = "roUrlEvent"
         response = pollEvent.GetString()  
         print "poll | response: " + response
         result = ParseJSON(response)
         if result = invalid
            print "json invalid!"
         else
            urlTrans = CreateObject("roUrlTransfer")  'this is a utility for url escape and unescape
            
            if result.type = "image"
              print "image event"
              'cancelImageDownload = true
              print urlTrans.unescape(result.imageURL)
              currImage = {
                 URL:urlTrans.unescape(result.imageURL) + "?" + result.stretch+"=0"
	          Title:urlTrans.unescape(result.title)
                 Description:urlTrans.unescape(result.caption)
	          PollInterval:result.nextPull
	          Stretch:result.stretch
              }
              
              'triger async downloader
              if currImage.URL <> currentDislayImageURL

	         canvasItems = [
		   { 
		     Text:"Loading...",
		     TextAttrs:{Color:"#FFCCCCCC", Font: "Small",
		     HAlign:"Center", VAlign:"Center",
		     Direction:"LeftToRight"}
	             TargetRect:{x: 50, y: screenSize.h - 60 , w:400, h:30}
		   }
	         ] 
                 canvas.SetLayer(3, canvasItems)
		 canvas.Show()
                 httpImage.SetUrl(currImage.URL)
                 print "get url is: "; httpImage.GetUrl()
                 httpImage.AsyncGetToFile(tmpImageFile)                
                
              end if

              
            else if result.type = "regPlayer"
              print "regPlayer event"
              m.inReg = false
              if regScreen <> invalid
                regScreen.close()
                httpCurr.Http.AsyncGetToString()
              end if

            else if result.type = "removePlayer" 
              print "removePlayer event"
              m.inReg = true
              regScreen = displayRegScreen()
              if regScreen <> invalid
                 regscreen.SetRegistrationCode("retrieving code...")             
              end if
              regCodeStamp = -1
              httpReg.Http.AsyncCancel()
              httpReg.Http.AsyncGetToString()
 
            else if result.type = "autoPlay"
              print "autoPlay event"
              if result.autoInterval <> invalid
                 print type(result.autoInterval)
                 autoInterval = int(result.autoInterval.toint()/1000)
              end if
              autoStamp = -1

            else if result.type = "orientation"
              print "orientation event"
            else
              print "nothing to do"
            end if
            
            
            
            
         end if
           
      else
         print "roUrlTransfer::AsyncGetToString(): unknown event"
      endif
      
      
      'make next poll
      if(httpPoll.Http.AsyncGetToString())
         lastPoll = currentTime
      end if      
      
    else
       'check if last poll is timed out
       if currentTime - lastPoll > pollTimeout
          print "poll timed out"
          'cancel the previous call
           httpPoll.Http.AsyncCancel()
          'make next poll
          if(httpPoll.Http.AsyncGetToString())
             lastPoll = currentTime
          end if
       end if
    end if
    
    imageEvent = imagePort.GetMessage() 
    if imageEvent <> invalid and m.inReg = false
       print "imageEvent "+type(imageEvent)
       if type(imageEvent) = "roUrlEvent"
          if cancelImageDownload
             print "image is downloaded, but has expired!"
             'since we got an new image from poll request, the one we just fetched asynchronously is expired, no need to display
             httpImage.AsyncCancel()
             cancelImageDownload = false
          else
             'display the just fetched image
             print "image is downloaded, and let's display it!"
             imageRoMetadata = CreateObject("roImageMetadata")
	         imageRoMetadata.SetUrl(tmpImageFile)
	         imageMetadata = imageRoMetadata.GetMetadata() 
			
	         if imageMetadata = invalid or imageMetadata.height = 0 then
	            print "ooops! Could not get image size..."
	         else
	            currentDislayImageURL = currImage.URL+currImage.Stretch
	            'figure out image scaling
	            print "figuring out scaling..."
	            imageRatio = imageMetadata.width / imageMetadata.height
	            print "Image Ratio: " ; imageRatio

                   if imageRatio <= screenRatio
                       'this is a lean image
                       if currImage.stretch = "true"
                          'scale the width to meet the screen width
                          scaledWidth = int(screenSize.w)
                          scaledHeight = int(scaledWidth / imageRatio)
                          
                          'top left reference point
                          x = 0
                          y = int((screenSize.h - scaledHeight)/2)

                       else
                          scaledHeight = int(screenSize.h)
                          scaledWidth = int(scaledHeight * imageRatio)
                           
                          x = int((screenSize.w - scaledWidth)/2)
                          y = 0
                       end if
                   else
                        
                       if currImage.stretch = "true"
                          scaledHeight = int(screenSize.h)
                          scaledWidth = int(scaledHeight * imageRatio)
                          
                          'top left reference point
                          x = int((screenSize.w - scaledWidth)/2)
                          y = 0

                       else
                          scaledWidth = int(screenSize.w)
                          scaledHeight = int(scaledWidth / imageRatio)
                          x = 0
                          y = int((screenSize.h - scaledHeight)/2)
                       end if                       

             
                   end if
	            
	            
	            print "x: ";x; "y: ";y
	            print "about to draw image..."
	            'draw image
	            canvasItems = [
	               { 
	                  url: currImage.URL,
	                  TargetRect:{x:x ,y:y ,w:scaledWidth, h:scaledHeight}
	               },
	               { 
	                  url: "pkg:/images/logo.png",
	                  TargetRect:{x: screensize.w - 140 , y: screensize.h - 50 ,w:100, h:31}
	               },
	            ] 
	            print "setting layer 2..."
	            canvas.SetLayer(2, canvasItems)
	            print "clearing layer 3..."
	            canvas.ClearLayer(1)
	            canvas.ClearLayer(3)
	            m.showingInfo = false
	            canvas.Show()

                   'show caption
                   m.showingInfo = true
                   CapShowStart = currentTime
                   showCaptionImageCanvas(currImage.Title, currImage.Description, canvas, screenSize)
	           print "showing caption now"
           
	         endif
		
		 end if
	  end if
    end if 	   
	    
    messageEvent = messagePort.GetMessage()
    if messageEvent <> invalid
       print messageEvent
       if type(messageEvent) = "roImageCanvasEvent"
       
          if (messageEvent.isRemoteKeyPressed()) 
              buttonPressed = messageEvent.GetIndex()
              print "key pressed: "; buttonPressed
              
              if buttonPressed = 4 and m.inReg = false
                 magicCount = 0
                 print "previous image"
                 httpPrev.Http.AsyncCancel()
                 httpPrev.Http.AsyncGetToString()
              else if buttonPressed = 5 and m.inReg = false
                 magicCount = 0
                 print "next image"
                 httpNext.Http.AsyncCancel()
                 httpNext.Http.AsyncGetToString()
              else if buttonPressed = 10 and m.inReg = false
                 magicCount = 0
                 print "show caption"
                 if m.showingInfo = false
                   m.showingInfo = true
                   CapShowStart = currentTime
                   showCaptionImageCanvas(currImage.Title, currImage.Description, canvas, screenSize)
	           print "showing caption now"
                 end if
              else if buttonPressed = 2 
                 if magicCount = 0
                   magicCount = magicCount + 1
                   magicStamp = currentTime
                 else if currentTime - magicStamp > magicTimeout
                   magicCount = 1
                   magicStamp = currentTime
                 else 
                   magicCount = magicCount + 1
                   if magicCount > 3
                     print "clear magic button"
                     magicCount = 0
                   end if
                 end if


              else if buttonPressed = 3
                 if currentTime - magicStamp > magicTimeout
                   magicCount = 0
                 else if magicCount = 3
                   print "force reg!"
                   magicCount = 0
                   m.inReg = true
                   regScreen = displayRegScreen()
                   if regScreen <> invalid
                     regscreen.SetRegistrationCode("retrieving code...")             
                   end if
                   regCodeStamp = -1
                   httpReg.Http.AsyncCancel()
                   httpReg.Http.AsyncGetToString()
                   
                 end if   
              else
                 magicCount = 0
              end if
              
          end if
       
       end if
       
    end if
    
    

    
  end while 
   
end Sub   

Sub Display()

	m.DeviceMaker	  = "Roku"
	m.ImagePollUrlBase = "http://sleepy-scrubland-3038.herokuapp.com/client/v1.0"
    m.UrlGetCurrentImage = m.ImagePollUrlBase + "/currentImage.json"
	m.UrlAdvanceImage = m.ImagePollUrlBase + "/nextImage"
	
	m.sn = GetDeviceESN() 
	print "sn: " + m.sn
	m.RegistrationToken = loadRegistrationToken()
	'print "RegistrationToken: " + m.RegistrationToken
	
	m.forceReRegMagicKeyCount = 0
	
	'determine screen ratio
	deviceInfo = CreateObject("roDeviceInfo")
	screenSize = deviceInfo.GetDisplaySize()
	screenRatio = screenSize.w / screenSize.h
	print "Screen Ratio: " ; screenRatio
	
	'set up screen
	canvas = DisplaySetupCanvas(screenSize)
	
	http = CreateObject("roUrlTransfer")      ' Moved here from while loop to potentially save resources
	tmpImageFileBase = "tmp:/myImage"
	tmpImageFile = "tmp:/myImage1.jpg"
	fileVersion = 0
	
	'set up fonts
	m.fontReg = CreateObject("roFontRegistry")
	m.defaultFont = m.fontReg.GetDefaultFont(24, false, false)

	'initial state
	m.showingInfo = false
	m.advancePending = false
	
	'waitport = CreateObject("roMessagePort")
	waitport = canvas.GetMessagePort()
	msg = invalid
	
	currentDislayImageURL = ""
	pollInterval = 500 ' default poll interval
	mytimer=createobject("rotimespan")
'	lastTime = CreateObject("roDateTime").asSeconds()*1000
	looppoint:
'	currentTime = CreateObject("roDateTime").asSeconds()*1000
	
'	if currentTime > lastTime + pollInterval then
	if mytimer.TotalMilliseconds()>= pollInterval then

'	lastTime = currentTime
'	print "Current Time:" ; currentTime
	mytimer.mark()

	' check if it is for another image here
	image = getImage()
	else

	image = invalid
	end if
	if msg <> invalid then
	    print msg
		if type(msg) = "roImageCanvasEvent" then
		   'handle any remote key presses
		   	pollInterval = 500 ' reset poll interval to wake this up
           if (msg.isRemoteKeyPressed()) then 
			buttonPressed = msg.GetIndex()
			
			'handle magic key sequence for re-reg (3 up, 1 down)
			print "key pressed: "; buttonPressed
			if (buttonPressed = 2 and m.forceReRegMagicKeyCount < 3) then
				print "magic key count: "; m.forceReRegMagicKeyCount
				m.forceReRegMagicKeyCount = m.forceReRegMagicKeyCount + 1
			else if buttonPressed = 3 and m.forceReRegMagicKeyCount = 3 then
				print "forcing re-reg screen"
				deleteRegistrationToken()
				Register("Please link your Roku player to your account")
				goto looppoint
			else
				print "clearing magic key count"
				m.forceReRegMagicKeyCount = 0
			end if
			
			' * button for caption
			if buttonPressed = 10 then
				toggleCaption(image.Title, image.Description, canvas, screenSize)
			else if buttonPressed = 4 then
				print "prev image"
				if m.advancePending = false then
				    canvasItems = getAdvanceImageCanvasItems(screenSize) 
					canvas.SetLayer(3, canvasItems)
					canvas.Show()
					m.advancePending = true
					advanceImage("0")
				end if
				goto waitpoint
			else if buttonPressed = 5 then
				print "next image"
				if m.advancePending = false then
					canvasItems = getAdvanceImageCanvasItems(screenSize) 
					canvas.SetLayer(3, canvasItems)
					canvas.Show()
					m.advancePending = true
					advanceImage("1")
				end if
				goto waitpoint
			else if buttonPressed = 3 then
				print "checking magic key sequence"
				if (m.forceReRegMagicKeyCount = 3) then
					print "forcing re-reg screen"
					deleteRegistrationToken()
					Register("Please link your Roku player to your account")
				end if
			end if
		  end if
		end if
	end if
	
	if image <> invalid
		if image.URL+image.Stretch <> currentDislayImageURL then
			print "Changing Image: " ; image.URL
			
			'currentDislayImageURL = image.URL+image.Stretch
			pollInterval = image.PollInterval
			print "Next Poll Interval: "; pollInterval
			
			''workaround to prevent caching as I am using one file
			'fileVersion = fileVersion + 1
			'tmpImageFile = tmpImageFileBase + fileVersion.tostr() + ".jpg"
			'print tmpImageFile
			
			'get the image to file to get size information
			print "getting image info..."
			http.SetUrl(image.URL)
			print "get url is: "; http.GetUrl()
            http.GetToFile(tmpImageFile)
			imageRoMetadata = CreateObject("roImageMetadata")
			imageRoMetadata.SetUrl(tmpImageFile)
			imageMetadata = imageRoMetadata.GetMetadata() 
			
			if imageMetadata = invalid or imageMetadata.height = 0 then
				print "ooops! Could not get image size...try again"
				goto waitpoint
			endif
			
			currentDislayImageURL = image.URL+image.Stretch

			'figure out image scaling
			print "figuring out scaling..."
			imageRatio = imageMetadata.width / imageMetadata.height
			print "Image Ratio: " ; imageRatio
			if imageRatio <= screenRatio then
				 'The scaled size is based on the height
				 scaledHeight = int(screenSize.h)
				 scaledWidth = int(scaledHeight * imageRatio)
			else
				 'The scaled size is based on the width
				 scaledWidth = int(screenSize.w)
				 scaledHeight = int(scaledWidth / imageRatio)
			end if
			print "Image Scaled Size: " ; scaledWidth ; "w " ; scaledHeight ; "h"
			
			'figure out position on screen
			print "figuring out screen position"
			x = 0
			y = 0
			if scaledWidth < screensize.w then
				x = int((screensize.w / 2) - (scaledWidth / 2))
			end if
			if scaledHeight < screensize.h then
				y = int((screensize.h / 2) - (scaledHeight / 2))
			end if	
			print "x: ";x; "y: ";y
			
			print "about to draw image..."
			'draw image
			canvasItems = [
				{ 
					url: image.URL,
					TargetRect:{x:x ,y:y ,w:scaledWidth, h:scaledHeight}
				},
				{ 
					url: "pkg:/images/logo.png",
					TargetRect:{x: screensize.w - 140 , y: screensize.h - 50 ,w:100, h:31}
				},
			] 
			print "setting layer 2..."
		    canvas.SetLayer(2, canvasItems)
			print "clearing layer 3..."
			canvas.ClearLayer(1)
			canvas.ClearLayer(3)
			m.showingInfo = false
			canvas.Show()
			print "showing canvas now..."
			m.advancePending = false
			
			'show caption
			showCaption(image.Title, image.Description, canvas, screenSize)
			print "showing caption now"
			
			'Delete temp file
			'DeleteFile(tmpImageFile)
		else
			if m.showingInfo then
				print "image info hide check: "; m.captionElapsedDuration ; " with pollInterval: "; pollInterval
				m.captionElapsedDuration = m.captionElapsedDuration + pollInterval
			    if m.captionElapsedDuration > 5000 then 
					hideCaption(canvas)
				end if
			end if
		end if
	end if
	
	waitpoint:
	msg = wait(pollInterval, waitport)
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
    'print "getImage()--Current Image: " + m.UrlGetCurrentImage +"-" + m.sn + " " + m.DeviceMaker + " " + m.RegistrationToken
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
			Register("Please link your Roku player to your account")
		else
			Dbg("Not able to retrieve current image.")
			howConnectionFailed()
			return invalid
		end if
	End If
	
	picture = {
				URL:json.imageURL + "?" + json.stretch+"=0"
				Title:json.title
                Description:json.caption
				PollInterval:json.nextPull
				Stretch:json.stretch
              }
	return picture
 End Function
 
 Sub advanceImage(nextStr as String)
    http = NewHttp(m.UrlAdvanceImage)
	http.AddParam("deviceId", m.sn)
	http.AddParam("deviceMaker", m.DeviceMaker)
	http.AddParam("regToken", m.RegistrationToken)
	http.AddParam("next", nextStr)
	
	response = http_get_to_string_with_retry(http)
	if response=invalid
		return
	end if
   	'print "getImage() | response: " + response
    json = ParseJSON(response)
	
	if json=invalid
		return
	end if
	
	if json.Status <> "Success"
			print "Not able to advance current image."
			Dbg("Not able to advance current image.")
			'howConnectionFailed()
			return
	End If
	
	print "success at requesting image advance ";nextStr
End Sub

Function getAdvanceImageCanvasItems(screenSize as Object) As Object
	canvasItems = [
		{ 
			Text:"Requesting Image...",
			TextAttrs:{Color:"#FFCCCCCC", Font: "Small",
			HAlign:"Center", VAlign:"Center",
			Direction:"LeftToRight"}
			TargetRect:{x: 50, y: screenSize.h - 60 , w:400, h:30}
		}
	] 
	return canvasItems
End Function

Function toggleCaption(title as string, description as string, canvas as Object, screenSize as Object)
	if m.showingInfo = true then
		hideCaption(canvas)
	else
		showCaption(title, description, canvas, screenSize)
	end if
End Function

Function showCaption(title as string, description as string, canvas as Object, screenSize as Object)
	if m.showingInfo = false then
		showCaptionImageCanvas(title, description, canvas, screenSize)
		m.showingInfo = true
		m.captionElapsedDuration = 0
	end if
End Function

Function hideCaption(canvas as Object) 
	if m.showingInfo = true then
		hideCaptionImageCanvas(canvas)
		m.showingInfo = false
		m.captionElapsedDuration = 0
	end if
End Function

Function showCaptionImageCanvas(title as string, description as string, canvas as Object, screenSize as Object) 
	canvasItems = getCaptionImageCanvasItems(title, description, screenSize)
	canvas.SetLayer(3, canvasItems)
	canvas.Show()
End Function

Function hideCaptionImageCanvas(canvas)
	canvas.ClearLayer(3)
	canvas.Show()
End Function

Function getCaptionImageCanvasItems(title as string, description as string, screenSize as Object) As Object
	maxCaptionLines = 3
	'For 3 lines, adjust slightly
	borderAdjust = 0
	defaultFont = m.fontReg.GetDefaultFont(24, false, false)
	fontTitle = m.fontReg.Get("Default", 24, 0, true)
	fontDescription = m.fontReg.Get("Default", 24, 0, false)
    fontTitleHeight = defaultFont.GetOneLineHeight()
	fontDescriptionHeight = defaultFont.GetOneLineHeight()
	
	captionX = int(screenSize.w * 0.2)
	captionY = int(screenSize.h * 0.80) - 10
	captionWidth = int(screenSize.w * .60)
	captionHeight = int((fontTitleHeight*2) + 50)
	
	textWidth = captionWidth - 40
	titleWidth = defaultFont.GetOneLineWidth(title, 3000)
	print "Caption Text Available  Width: "; textWidth
	print "Caption Title Width: "; titleWidth
	'if text is too long, we will truncate
	if titleWidth > ((maxCaptionLines * textWidth) - 200) then
		print "Caption Title too long; truncating"
		titleHeight = int(fontTitleHeight * 1.5)
		numLines = int(titleWidth /textWidth) + 1
		truncStringLen = int(maxCaptionLines / numLines * title.Len()) - 10
		print "numLines: "; numLines ; " truncated String Length: "; truncStringLen
		title = title.Left(truncStringLen) + "..."
		print title
		borderAdjust = 20
	else if titleWidth > textWidth then
		titleHeight = int(fontTitleHeight * 1.5)
		borderAdjust = 20
	else
		titleHeight = fontTitleHeight
	endif
	print "Caption Title Height: "; titleHeight
	
	canvasItems = [
		{ 
			url: "pkg:/images/CaptionBitmap.png",
			TargetRect: {
				x: captionX, y: captionY - borderAdjust, w: captionWidth, h: captionHeight + borderAdjust
				},
			CompositionMode: "Source_Over"
		}
		{ 
			Text: title,
			TextAttrs: {Color:"#FFCCCCCC", Font: fontTitle,
				HAlign: "Center", VAlign: "Center",
				Direction: "LeftToRight"}
			TargetRect: {
				x: captionX + 20, y: captionY + 20,
				w: captionWidth - 40, h: fontTitleHeight}
		}
		{ 
			Text: description,
			TextAttrs: {Color:"#FFCCCCCC", Font: fontDescription,
			HAlign: "Center", VAlign: "Center",
			Direction: "LeftToRight"}
			TargetRect: {
				x: captionX + 20, y: captionY + 20 + titleHeight + 10,
				w: captionWidth - 40, h: fontDescriptionHeight}
		}
	]
	return canvasItems
End Function

' The screensaver settings entry point.
Sub RunScreenSaverSettings()
    print "RunScreenSaverSettings called"
	displayScreenSaverSettingsScreen()
End Sub

' The screensaver entry point.
Sub RunScreenSaver()
   'This function gets called by Roku after a certain amount of time (default is 5 minutes)
   'and the idea is that the app will run a screen saver, which will be Artkick  
   
   print "RunScreenSaver called"
   m.DeviceMaker = "Roku"
   m.sn = GetDeviceESN()
   poll(true)
    
End Sub

Sub displayScreenSaverSettingsScreen()

    settingsScreen = CreateObject("roParagraphScreen")
    settingsScreen.SetMessagePort(CreateObject("roMessagePort"))

    settingsScreen.SetTitle("")
    settingsScreen.AddParagraph("There are no settings required for Artkick as a screen saver.  Simply control Artkick via your smart device.")
    settingsScreen.AddButton(0, "OK")
	settingsScreen.Show()
	
	while true
        msg = wait(0, settingsScreen.GetMessagePort())

        if type(msg) = "roParagraphScreenEvent"
            if msg.isScreenClosed()
                print "Screen closed"
                exit while                
            else if msg.isButtonPressed()
                print "Button pressed: "; msg.GetIndex(); " " msg.GetData()
                exit while
            else
                print "Unknown event: "; msg.GetType(); " msg: "; msg.GetMessage()
                exit while
            endif
        endif
    end while

End Sub

Sub Tickle()
   req = createObject("roUrlTransfer")
   req.setUrl("http://localhost:8060/keypress/Lit_+")
   req.postFromString("")
End Sub