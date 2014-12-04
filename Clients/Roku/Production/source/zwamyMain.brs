
Sub Main(params as Dynamic)

    SetTheme()
	hdposter = "pkg:/images/ARTKICKlogoFULLCOLOR-APP_120.jpg"
	sdposter = "pkg:/images/ARTKICKlogoFULLCOLOR-APP_120.jpg"
	
	'deleteRegistrationToken()
	
	' Create a Zwamy connection object.
	zwamy=CreateZwamyConnection()
	if zwamy=invalid then
		print "unexpected error in CreateZwamyConnection"
		return
	end if
	print "starting up"
	


       m.DeviceMaker = "Roku"
       m.sn = GetDeviceESN()

	print params
	if (params.email <> invalid)
	' we have a dial payload so register regardless
		print params.email
		m.dialemail=params.email
		m.dialnickname=params.nickname
		'dialRegistration()
               dialRegDevice()
	end if
	'we will now bypass use of reg token and directly attempt to display
	'm.RegToken = loadRegistrationToken()
	'print "Main | m.RegToken: " + m.RegToken
    'if isLinked() then
    '    print "device already linked, skipping registration process and go to Image display screen"
	'	 DisplayShow()
	'Else
	'	registerPoster = uitkRegisterPreShowPosterMenu()
	'	registrationMenu = [{ShortDescriptionLine1:"Register Roku Device", ShortDescriptionLine2:"Link your Roku device with Artkick", HDPosterUrl:hdposter, SDPosterUrl:sdposter}]	
	'	onRegisterSelect = [0, zwamy, "Register"]
	'	OnRegistrationMenuSelect(registrationMenu, registerPoster, onRegisterSelect)
    'end if
	print "call display"
	'Display()
	
	'poster=uitkPreShowPosterMenu()
	'if poster=invalid then
	'	print "unexpected error in uitkPreShowPosterMenu"
	'	return
	'end if
        
        Poll(false)

End Sub


Sub SetTheme()
    app = CreateObject("roAppManager")
    theme = CreateObject("roAssociativeArray")
	
	deviceInfo = CreateObject("roDeviceInfo")
	screenSize = deviceInfo.GetDisplaySize()

	xSD = int(screenSize.w/2) - 80
    theme.OverhangOffsetSD_X = xSD.tostr()
    theme.OverhangOffsetSD_Y = "30"
    theme.OverhangSliceSD = "pkg:/images/Overhang_BackgroundSlice_Blue_SD43.png"
    theme.OverhangLogoSD  = "pkg:/images/ARTKICKlogoFULLCOLORdarkbackgrounds_160x40.png"

	xHD = int(screenSize.w/2) - 140
	theme.OverhangOffsetHD_X = xHD.tostr()
    theme.OverhangOffsetHD_Y = "45"
    theme.OverhangSliceHD = "pkg:/images/Overhang_BackgroundSlice_Blue_HD.png"
    theme.OverhangLogoHD  = "pkg:/images/ARTKICKlogoFULLCOLORdarkbackgrounds_280x70.png"

    app.SetTheme(theme)
End Sub


