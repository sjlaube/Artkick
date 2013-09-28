'******************************************************
'Perform the registration flow
'
'Returns:
'    0 - We're registered. Proceed
'    1 - We're not registered. The user canceled the process.
'    2 - We're not registered. There was an error
'******************************************************

Function doRegistration(doRegistrationText As String) As Integer

	m.DeviceMaker	  = "Roku"
	m.UrlBase         = "http://evening-garden-3648.herokuapp.com/registration/v1.0"
    m.UrlGetRegCode   = m.UrlBase + "/getRegCode"
    m.UrlGetRegResult = m.UrlBase + "/getRegStatus"
    		
    m.RegToken = loadRegistrationToken()
    if isLinked() then
        print "device already linked, skipping registration process" 
        'return 0
    endif

    regscreen = displayRegistrationScreen(doRegistrationText)

    'main loop get a new registration code, display it and check to see if its been linked
    while true
        
        duration = 0

        sn = GetDeviceESN() 
		print "Device Serial Numnber: " + sn
        regCode = getRegistrationCode(sn)

        'if we've failed to get the registration code, bail out, otherwise we'll
        'get rid of the retreiving... text and replace it with the real code       
        if regCode = "" then return 2
        regscreen.SetRegistrationCode(regCode)
      
        'make an http request to see if the device has been registered on the backend
        
		'make an http request to see if the device has been registered on the backend
        while true
			sleep(5000) ' to simulate going to computer and typing in regcode
                
            status = checkRegistrationStatus(sn, regCode)
            if status < 3 return status
            
            getNewCode = false
            retryInterval = m.retryInterval
            retryDuration = m.retryDuration
            print "retry duration "; itostr(duration); " at ";  itostr(retryInterval);
            print " sec intervals for "; itostr(retryDuration); " secs max"
          
            'wait for the retry interval to expire or the user to press a button
            'indicating they either want to quit or fetch a new registration code
            while true
                print "Wait for " + itostr(retryInterval)
                msg = wait(retryInterval * 1000, regscreen.GetMessagePort())
                duration = duration + retryInterval
                if msg = invalid exit while
                
                if type(msg) = "roCodeRegistrationScreenEvent"
                    if msg.isScreenClosed()
                        print "Screen closed"
                        return 1
                    elseif msg.isButtonPressed()
                        print "Button pressed: "; msg.GetIndex(); " " msg.GetData()
                        if msg.GetIndex() = 0
                            regscreen.SetRegistrationCode("retrieving code...")
                            getNewCode = true
                            exit while
                        endif
                        if msg.GetIndex() = 1 return 1
                    endif
                endif
            end while
            
            if duration >= retryDuration then
                ans=ShowDialog2Buttons("Request timed out", "Unable to link to Zwamy within time limit.", "Try Again", "Back")
                if ans=0 then 
                    regscreen.SetRegistrationCode("retrieving code...")
                    getNewCode = true
                else
                    return 1
                end if
            end if
            
            if getNewCode exit while
            
            print "poll prelink again..."
        end while
    end while
	
End Function


'********************************************************************
'** display the registration screen in its initial state with the
'** text "retreiving..." shown.  We'll get the code and replace it
'** in the next step after we have something onscreen for teh user 
'********************************************************************
Function displayRegistrationScreen(paragraphText As String) As Object

    regscreen = CreateObject("roCodeRegistrationScreen")
    regscreen.SetMessagePort(CreateObject("roMessagePort"))

    regscreen.SetTitle("")
    regscreen.AddParagraph(paragraphText)
    regscreen.AddFocalText(" ", "spacing-dense")
    regscreen.AddFocalText("Artkick links this TV to an IOS or Android phone or tablet.", "spacing-dense")
	regscreen.AddFocalText("Install Artkick from the the App Store or Google Play.", "spacing-dense")
	regscreen.AddFocalText("Goto Options/Register New TV Player/Register New Roku", "spacing-dense")
    regscreen.AddFocalText("and enter this code to activate:", "spacing-dense")
    regscreen.SetRegistrationCode("retrieving code...")
    regscreen.AddParagraph("This screen will automatically update as soon as your activation completes")
    regscreen.AddButton(0, "Get a new code")
    regscreen.AddButton(1, "Back")
    regscreen.Show()

    return regscreen

End Function


'********************************************************************
'** Fetch the prelink code from the registration service. return
'** valid registration code on success or an empty string on failure
'********************************************************************
Function getRegistrationCode(sn As String) As String

    if sn = "" then return ""

	'default values for retry logic
    retryInterval = 30  'seconds
    retryDuration = 300 'seconds (aka 5 minutes)
    regCode       = ""
	
    http = NewHttp(m.UrlGetRegCode)
    http.AddParam("deviceId", sn)
	http.AddParam("deviceMaker", m.DeviceMaker)
	

    response = http.Http.GetToString()
  
    print "GOT: " + response
    print "Reason: " + http.Http.GetFailureReason()
		
     json = ParseJSON(response)
	
	if json.Status <> "success"
		Dbg("Bad register response")
        ShowConnectionFailed()
        return ""
	End If
	
   	regCode = json.RegCode
	retryInterval = json.RetryInterval
    retryDuration = json.RetryDuration
                         
    if regCode = "" then
        Dbg("Parse yields empty registration code")
        ShowConnectionFailed()
    endif

    m.retryDuration = 150 'retryDuration
    m.retryInterval = 10 'retryInterval
    m.regCode = regCode

    return regCode

End Function


'******************************************************************
'** Check the status of the registration to see if we've linked
'** Returns:
'**     0 - We're registered. Proceed.
'**     1 - Reserved. Used by calling function.
'**     2 - We're not registered. There was an error, abort.
'**     3 - We're not registered. Keep trying.
'******************************************************************
Function checkRegistrationStatus(sn As String, regCode As String) As Integer

    http = NewHttp(m.UrlGetRegResult)
	http.AddParam("deviceId", sn)
    http.AddParam("deviceMaker", m.DeviceMaker)
    http.AddParam("regCode", regCode)

    print "checking registration status"

	statusResponse = http.Http.GetToString()
	print "GOT Status: " + statusResponse
	print "Reason: " + http.Http.GetFailureReason()
		
	statusResponseJson = ParseJSON(statusResponse)
	
	if statusResponseJson.Status <> "success"
		return 3
	End If
	          
	token = statusResponseJson.RegToken

	if token <> "" and token <> invalid then
		print "obtained registration token: " + validstr(token)
		saveRegistrationToken(token) 'commit it
		m.RegistrationToken = token
		ShowLoadingBackground()
		return 0
	else
		return 3
	end if

	customerId = statusResponseJson.CustomerId
      
    print "result: " + validstr(regToken) +  " for " + validstr(customerId) + " at "

    return 3

End Function


'***************************************************************
' The retryInterval is used to control how often we retry and
' check for registration success. its generally sent by the
' service and if this hasn't been done, we just return defaults 
'***************************************************************
Function getRetryInterval() As Integer
    if m.retryInterval < 1 then m.retryInterval = 30
    return m.retryInterval
End Function

'**************************************************************
' The retryDuration is used to control how long we attempt to 
' retry. this value is generally obtained from the service
' if this hasn't yet been done, we just return the defaults 
'**************************************************************
Function getRetryDuration() As Integer
    if m.retryDuration < 1 then m.retryDuration = 900
    return m.retryDuration
End Function


'******************************************************
'Load/Save RegistrationToken to registry
'******************************************************

Function loadRegistrationToken() As dynamic
    m.RegToken =  RegRead("RegToken", "Authentication")
    if m.RegToken = invalid then m.RegToken = ""
    return m.RegToken 
End Function

Sub saveRegistrationToken(token As String)
    RegWrite("RegToken", token, "Authentication")
End Sub

Sub deleteRegistrationToken()
    RegDelete("RegToken", "Authentication")
    m.RegToken = ""
End Sub

Function isLinked() As Dynamic
    if Len(m.RegToken) > 0  then return true
    return false
End Function

Sub ShowLoadingBackground()

	loadingScreenPort=CreateObject("roMessagePort")
	loadingScreen = CreateObject("roPosterScreen")
	loadingScreen.SetMessagePort(loadingScreenPort)
	loadingScreen.ShowMessage("Loading image")
	loadingScreen.Show()
	while true
		Display()
		msg = Wait(0, loadingScreenPort) ' wait for an event

		if type(msg) = "roPosterScreenEvent"
		  ' we got a poster screen event
		  if msg.isScreenClosed()
			' the user closed the screen
			exit while
		  end if
		end if
	end while
	screen.Close()
End Sub

'******************************************************
'Show congratulations screen
'******************************************************
Sub showCongratulationsScreen()
    port = CreateObject("roMessagePort")
    screen = CreateObject("roParagraphScreen")
    screen.SetMessagePort(port)

    screen.AddHeaderText("Congratulations!")
    screen.AddParagraph("You have successfully linked your Roku player to your account")
    screen.AddParagraph("Select 'start' to begin.")
    screen.AddButton(1, "start")
    screen.Show()

    while true
        msg = wait(0, screen.GetMessagePort())

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

