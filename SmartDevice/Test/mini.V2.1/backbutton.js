/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

window.backbutton=function ()
// handles the hardware backbutton on android devices
{	
	if(window.sharemenushow)
	{
		hidemenu();
		if (window.currentView=="ImageView")return;
	}
	if(window.wipemenu)
	{
		showmenu();
		return;
	}
	if (window.guestmenu)
	{	
		dijit.registry.byId('GuestMessage').hide();
		window.guestmenu=false;
		return;
	}
	if(window.bigImg)
	{
		smallimage();
		return;
	}
	switch (window.currentView)
	{

		case "Intro1":
			gotoView("Intro1","Intro0");
			break;
		case "Intro2":
			gotoView("Intro2","Intro0");
			break;
		case "Intro3":
			gotoView("Intro3","Intro0");
			break;
		case "Login":
			gotoView("Login","newLogin");
			break;
		case "newLogin":
			gotoView("newLogin","Intro0");
			break;
		case "select_category": // if android exit otherwise nothing
		case "Intro0":
			 try {
                    Android.exitArtkick();

                    } catch (err) {

                    }
			break;
		case "Options":
			gotoView("Options","OptionsList");
			break;
		case "add_user_player":
			gotoView("add_user_player","OptionsList");
			break;
		case "reset_password":
			gotoView("reset_password","Login");
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
			gotoView("registeruser","Login");
			break;
		case "LogOff":
			gotoView("LogOff","OptionsList");
			break;
		case "Import":
			gotoView("Import",lastView);
			break;
		case "registernewroku":
			gotoView("registernewroku","RegisterNew");
			break;
		case "registernewchromecast":
			try {
                            Android.setEmail(window.email);
                            Android.setButtonInvisible();
                        } catch (err) {

                        };
		//	gotoView("registernewchromecast","RegisterNew");
			dijit.registry.byId("registernewchromecast").performTransition("registernewTV", 1, "", null);
			break;
		case "removeplayer":
			gotoView("removeplayer","OptionsList");
			break;
		case "ImageView":
			if (lastView=="PlaylistView")
				gotoCategory('0');
			else
				gotoView("ImageView","select_category");
			break;
		case "iframeview":  // when in iframeview we must do the destroy,not just a simple transition
			destroyiframe();
			break;
		case "AccountSettings":
			gotoView("AccountSettings","OptionsList");
			break;
		case "OptionsList":
			gotoView("OptionsList",window.lastView);
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
			gotoView("TalkToArt",lastView);
			break;
		case "fullimageview":
			gotoView("fullimageview","ImageView");
			break;
		case "quickhint":
			if (window.firstimageview==true)
			{
				window.firstimageview = false;
				gotoView("quickhint","newuserintro");
			}
			else
			{

				gotoView("quickhint","OptionsList");
			};
			break;
		case "registernewTV":
			gotoView("registernewTV",lastView);
			break;
		case "registernewroku2":
			gotoView("registernewroku2","registernewroku");
			break;
		case "newuserintro":
			gotoView("newuserintro","quickhint");
			break;
		case "registrationHelp":
			gotoView("registrationHelp","registernewTV");
			break;
		case "Slideshow":
			gotoView("Slideshow",lastView);
			break;	
		default:
			break;
		
	}
}