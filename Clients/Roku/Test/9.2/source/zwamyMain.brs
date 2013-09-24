
Sub Main()

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
	
	m.RegToken = loadRegistrationToken()
	print "Main | m.RegToken: " + m.RegToken
    if isLinked() then
        print "device already linked, skipping registration process and go to Image display screen"
		DisplayShow()
	Else
		registerPoster = uitkRegisterPreShowPosterMenu()
		registrationMenu = [{ShortDescriptionLine1:"Register Roku Device", ShortDescriptionLine2:"Link your Roku device with Artkick", HDPosterUrl:hdposter, SDPosterUrl:sdposter}]	
		onRegisterSelect = [0, zwamy, "Register"]
		OnRegistrationMenuSelect(registrationMenu, registerPoster, onRegisterSelect)
    end if
	
	
	'poster=uitkPreShowPosterMenu()
	'if poster=invalid then
	'	print "unexpected error in uitkPreShowPosterMenu"
	'	return
	'end if

End Sub


Sub SetTheme()
    app = CreateObject("roAppManager")
    theme = CreateObject("roAssociativeArray")

    theme.OverhangOffsetSD_X = "20"
    theme.OverhangOffsetSD_Y = "7"
    theme.OverhangSliceSD = "pkg:/images/Overhang_BackgroundSlice_Blue_SD43.png"
    theme.OverhangLogoSD  = "pkg:/images/ArtKick_214x144.jpg"

    theme.OverhangOffsetHD_X = "150"
    theme.OverhangOffsetHD_Y = "10"
    theme.OverhangSliceHD = "pkg:/images/Overhang_BackgroundSlice_Blue_HD.png"
    theme.OverhangLogoHD  = "pkg:/images/ArtKick_290x218.png"

    app.SetTheme(theme)
End Sub


