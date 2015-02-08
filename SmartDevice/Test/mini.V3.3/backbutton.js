/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/
window.backbutton = function()
    // handles the hardware backbutton on android devices
    {
	//alert("backbutton currentView="+currentView);
	adjustSize();
		var currTime = new Date().getTime();
		if (window.BackClickTime != undefined && (currTime - window.BackClickTime < window.boucingTime))
		{
						return;
		}
		window.BackClickTime = currTime;
        if (window.sharemenushow)
        {
            hidemenu();
            if (window.currentView == "ImageView")
                return;
        }
        if (window.wipemenu)
        {
            showmenu();
            return;
        }
        if (window.guestmenu)
        {
            dijit.registry.byId('GuestMessage').hide();
            window.guestmenu = false;
            return;
        }
        if (window.bigImg)
        {
            smallimage();
            return;
        }
        if (window.showAddComment)
        {
            dijit.registry.byId('AddComment').hide();
            window.showAddComment = false;
            return;
        }
		if (window.searchboxshow)
		{
			dijit.registry.byId('SearchBox').hide();
			window.searchboxshow=false;
			return;
		}
        switch (window.currentView)
        {
            case "Intro1":
                gotoView("Intro1", "Intro0");
                break;
            case "Intro2":
                gotoView("Intro2", "Intro0");
                break;
            case "Intro3":
                gotoView("Intro3", "Intro0");
                break;
            case "Login":
                gotoView("Login", "newLogin");
                break;
            case "newLogin":
                gotoView("newLogin", "IntroA");
                break;
            case "select_category": // if android exit otherwise nothing
            case "Intro0":
                if (window.searchboxshow)
                {
                    dijit.registry.byId('SearchBox').hide();
                    window.searchboxshow = false;
                }
                else
                {
                    try
                    {
                        Android.exitArtkick();
                    }
                    catch (err)
                    {}
                }
                break;
            case "Options":
                gotoView("Options", "OptionsList");
                break;
            case "add_user_player":
                gotoView("add_user_player", "OptionsList");
                break;
            case "reset_password":
                gotoView("reset_password", "Login");
                break;
            case "PlaylistView":
				if (dijit.registry.byId("viewlistMenu").domNode.style.display=="none"&&dijit.registry.byId("CuratorNotes").domNode.style.display=="none")
					gotoView("PlaylistView", "select_category");
				else
				{
					dijit.registry.byId("viewlistMenu").hide();
					dijit.registry.byId("CuratorNotes").hide();
				}
                break;
            case "ArtistlistView":
                gotoView("ArtistlistView", "select_category");
                break;
            case "MuseumlistView":
                gotoView("MuseumlistView", "select_category");
                break;
            case "MylistView":
				dijit.registry.byId('AddUserList').hide();
                DonePersonalViewlists();
                break;
            case "select_player":
                gotoView("select_player", "OptionsList");
                break;
            case "registeruser":
                gotoView("registeruser", "IntroA");
                break;
            case "LogOff":
                gotoView("LogOff", "OptionsList");
                break;
            case "Import":
                gotoView("Import", lastView);
                break;
            case "registernewroku":
                gotoView("registernewroku", "RegisterNew");
                break;
            case "registernewchromecast":
                try
                {
                    Android.setEmail(window.email);
                    Android.setButtonInvisible();
                }
                catch (err)
                {};
                //	gotoView("registernewchromecast","RegisterNew");
                dijit.registry.byId("registernewchromecast").performTransition("registernewTV", 1, "", null);
                break;
            case "removeplayer":
                gotoView("removeplayer", "OptionsList");
                break;
            case "ImageView":
                if (lastView == "PlaylistView")
                    gotoCategory('0');
                else
                    gotoView("ImageView", "select_category");
                break;
            case "iframeview": // when in iframeview we must do the destroy,not just a simple transition
                destroyiframe();
                break;
            case "AccountSettings":
                gotoView("AccountSettings", window.lastView);
                break;
            case "TestingSettings":
                gotoView("TestingSettings", window.lastView);
                break;
            case "OptionsList":
                gotoView("OptionsList", window.lastView);
                break;
            case "RegisterNew":
                gotoView("RegisterNew", "OptionsList");
                break;
            case "About":
                gotoView("About", "select_category");
                break;
            case "Options":
                gotoView("Options", "OptionsList");
                break;
            case "GridView":
				dijit.registry.byId("tabnowshowing").set('selected', true);
                gotoView("GridView", "ImageView");
                break;
            case "TalkToArt":
                gotoView("TalkToArt", lastView);
                break;
            case "fullimageview":
                gotoView("fullimageview", "ImageView");
                break;
            case "quickhint":
                if (window.firstimageview == true)
                {
                    window.firstimageview = false;
                    gotoView("quickhint", "select_category");
                }
                else
                {
                    gotoView("quickhint", "OptionsList");
                };
                break;
            case "registernewTV":
                gotoView("registernewTV", lastView);
                break;
            case "select_player2":
                rememberSelectPlayers(false);
				updatePlayers();
				if(lastView == "select_player2")
					gotoView("select_player2","select_category");
				else
					gotoView("select_player2", lastView);
                break;
            case "registernewroku2":
                gotoView("registernewroku2", "registernewroku");
                break;

            case "registrationHelp":
                gotoView("registrationHelp", "registernewTV");
                break;
            case "Slideshow":
                gotoView("Slideshow", lastView);
                break;
            case "show_comments":
                gotoView("show_comments", lastView);
                break;
            case "MylistViewEdit":
                updateLists(currCat);
                dijit.registry.byId('DeleteViewlist').hide();
                dijit.registry.byId('RenameViewlist').hide();

                gotoView("MylistViewEdit", "PlaylistView");
                break;
            case "GettyView":
                //gettyReset();
                dojo.style(dojo.byId("GettyView"), "display", "none");
                gotoCategory('Getty Images');
                dojo.byId("gettysearchbox").value = "";
                // when user clicks done in getty search, if there are images to delete from viewlist delete them here before returning to list...
                break;
            case "EditListView":
                doneeditviewlist(false);
                break;
            case "TVDetail":
                gotoView("TVDetail", "select_player2");
                break;
            case "RegCodeInstall":
                gotoView("RegCodeInstall", "select_player2");
                break;
            case "GettySubscribe":
                gotoView("GettySubscribe", "select_category");
                break;
            case "GettyLoadDefault":
                gotoView("GettyLoadDefault", "select_category");
                break;
            case "InAppSubscribe":
                gotoView(currentView, "select_category");
                break;
            case "InAppSubscribe2":
                gotoView(currentView, "select_category");
                break;
            case "select_player3":
				dojo.style('screentype','display','block');
				dojo.style('SmartTVtype','display','none');
                gotoView(currentView, "select_category");
                break;
            case "SearchView":
                dojo.style(dojo.byId("SearchView"), "display", "none");
                dojo.byId("searchbox2").value = "";
                dojo.byId("gettysearchbox").value = '';
                dijit.registry.byId('SearchBox').hide();
				window.searchboxshow = false;
                dijit.registry.byId('IVGettySearchBox').hide();
				if (lastView=='select_category')
				{
					gotoView("SearchView", window.lastView);
					break;
				}
				updateLists(currCat);
             //   gotoView("SearchView", window.lastView);
                break;
			case "ConnectSmartTV":
				gotoView(currentView,"select_player3");
				break;
			case "select_wifi":
				gotoView(currentView,"select_player3");
				break;
            default:
                break;
        }
    }