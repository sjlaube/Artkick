'  uitkDoPosterMenu
'
'    Display "menu" items in a Poster Screen.   
'
'    if "onselect_callback" is valid, it is an Array.
'	 there are two options on the format of data in callback array
'	 entry 0 is an "array format type" integer
'    if type is 0
'		entry 1 is a this pointer.
'       entry 2...n are text names of functions to callback on the this pointer
'       like this: this[onselect_callback[msg.Index+2]]()
'    if type is 1
'		entry 1 & 2 are userdata
'       entry 3 is the callback function reference.  
'		like this: 	f(userdata1, userdata2, msg.Index)
'
'	 in each type:
'		returns when UP or HOME selected

'    else if onselect_callback is not valid
'		returns when UP or HOME or Menu Item selected
'		returns Integer of Menu Item index, or negative if home or up selected
'
' pass in "posterdata", an array of AAs with these entries:
'   HDPosterUrl As String - URI to HD Icon Image
'   SDPosterUrl As String - URI to SD Icon Image
'   ShortDescriptionLine1 As String - the text name of the menu item
'	ShortDescriptionLine1 As String - more text
'   
'  ******************************************************
function uitkRegisterPreShowPosterMenu(registerButton = invalid) As Object
	registrationPort=CreateObject("roMessagePort")
	registerationScreen = CreateObject("roPosterScreen")
	registerationScreen.SetMessagePort(registrationPort)
	if registerButton <> invalid then
		registerationScreen.SetBreadcrumbText(registerButton)
	end if
	registerationScreen.SetListStyle("flat-category")
	registerationScreen.Show()

	return registerationScreen
end function

function DisplayShow() As Object
	displayScreenPort=CreateObject("roMessagePort")
	displayScreen = CreateObject("roPosterScreen")
	displayScreen.SetMessagePort(displayScreenPort)
	displayScreen.ShowMessage("Connecting to ArtKick server")
	displayScreen.Show()
	while true
		Display()
		msg = Wait(0, displayScreenPort) ' wait for an event

		if type(msg) = "roPosterScreenEvent"
		  ' we got a poster screen event
		  if msg.isScreenClosed()
			' the user closed the screen
			exit while
		  end if
		end if
	end while

	screen.Close()
  ' any time all screens in a channel are closed, the channel will exit 
	'return displayScreen
end function

function OnRegistrationMenuSelect(registrationData, registrationScreen, onselect_callback=invalid) As Integer
	if type(registrationScreen)<>"roPosterScreen" then
		print "illegal type/value for screen passed to OnRegistrationMenuSelect()" 
		return -1
	end if
	
	registrationScreen.SetContentList(registrationData)

    while true
        msg = wait(0, registrationScreen.GetMessagePort())
		if type(msg) = "roPosterScreenEvent" then
			if msg.isListItemSelected() then
				if onselect_callback<>invalid then
					Register("Please link your Roku player to your account")
				end if
			else if msg.isScreenClosed() then
				return -1
			end if
		end If
	end while
end function
