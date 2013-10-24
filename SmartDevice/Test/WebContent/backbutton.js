/*

Copyright 2013, Zwamy, Inc.  All Rights Reserved

*/

window.backbutton=function ()
// handles the hardware backbutton on android devices
{	
	if(window.sharemenushow)
	{
		hidemenu();
		if (window.currentView=="ImageView")return;
	}
	switch (window.currentView)
	{
		case "Intro0":
		case "Intro1":
		case "Intro2":
		case "Intro3":
			break; // do nothing if on intro pages
		case "Login":
			gotoView("Login","Intro0");
			break;
		case "select_category":
			gotoView("select_category","ImageView");
			break;
		case "Options":
			gotoView("Options","OptionsList");
			break;
		case "add_user_player":
			gotoView("add_user_player","OptionsList");
			break;
		case "reset_password":
			gotoView("reset_password","OptionsList");
			break;
		case "PlaylistView":
			gotoView("PlaylistView","select_category");
			break;
		case "ArtistlistView":
			gotoView("ArtistlistView","select_category");
			break;
		case "MuseumlistView":
			gotoView("MuseumlistView","select_category");
			break;
		case "MylistView":
			DonePersonalViewlists();
			break;
		case "select_player":
			gotoView("select_player","OptionsList");
			break;
		case "registeruser":
			gotoView("registeruser","Intro0");
			break;
		case "LogOff":
			gotoView("LogOff","OptionsList");
			break;
		case "registernewroku":
			gotoView("registernewroku","RegisterNew");
			break;
		case "registernewchromecast":
			gotoView("registernewchromecast","RegisterNew");
			break;
		case "removeplayer":
			gotoView("removeplayer","OptionsList");
			break;
		case "ImageView":
			break;
		case "iframeview":  // when in iframeview we must do the destroy,not just a simple transition
			destroyiframe();
			break;
		case "AccountSettings":
			gotoView("AccountSettings","OptionsList");
			break;
		case "OptionsList":
			gotoView("OptionsList","ImageView");
			break;
		case "RegisterNew":
			gotoView("RegisterNew","OptionsList");
			break;
		case "About":
			gotoView("About","OptionsList");
			break;
		case "Options":
			gotoView("Options","OptionsList");
			break;
		case "GridView":
			gotoView("GridView","ImageView");
			break;
		case "TalkToArt":
			gotoView("TalkToArt","OptionsList");
			break;
		case "fullimageview":
			gotoView("fullimageview","ImageView");
			break;
		default:
			break;
		
	}
}