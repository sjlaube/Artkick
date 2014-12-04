//Main js for Editor
//TODO: split
//var baseCmdUrlProd = 'http://fierce-basin-2977.herokuapp.com/prod/';
var baseCmdUrlProd = 'https://nameless-sea-3359.herokuapp.com/prod/';
//var baseCmdUrlStag = 'http://fierce-basin-2977.herokuapp.com/stag/';
var baseCmdUrlStag = 'https://nameless-sea-3359.herokuapp.com/stag/';
var baseCmdUrlPersonal = 'https://nameless-sea-3359.herokuapp.com/priv/';

var baseCmdUrl = baseCmdUrlStag;
var authUrl = 'https://nameless-sea-3359.herokuapp.com/login?app_id=artkick_editor&redirect_url=http://editor.artkick.net/Editor.html';
var serverProd = 'Production';
var serverStag = 'Staging';
var serverPersonal = 'Personal';
var server = serverStag;
var viewListType = "viewList";
var viewListFeaturedType = "viewListFeatured";
var categoryType = "category";
var rootType = "root";
var imageType = "image";
var imageFilter = "";

var trashName = "Trash";
var trashId = -99999;

var tempRename = false;  //hack for rename not including image count

var authEmail;
var authToken;
var isAdmin;

$(document).ready(function () {
	jQuery(function($) {
		
	});
	
	$('#productionServerLink').attr('href', baseEditorUrl + '&database=production');
	$('#stagingServerLink').attr('href', baseEditorUrl + '&database=staging');
	$('#stagingServerLink').click(function (e) {
		window.location = $("#stagingServerLink").attr('href');
		e.preventDefault();
	});
	$('#productionServerLink').click(function (e) {
		window.location = $("#productionServerLink").attr('href');
		e.preventDefault();
	});
	
	if (isAdmin) {
		loadArtkickCategories();
	}
	else {
		server = serverPersonal;
		baseCmdUrl = baseCmdUrlPersonal;
		loadPersonalCategories();
	}
	
	$('#btnSave').click(function () {
		//TODO: move to own methods - like selectionCount and getSelection 
		if ($('#divMainImages').find('li.selected').length == 1)
		{
			saveImageAttr();
		}
		else {
			saveImageAttrMulti();
		}
	});
	
	$('#divMainImageDetail').find('input[type="text"], textarea').click(function () {
		//alert('clicked!');
		//$(this).prop('readonly', false);
		if ($(this).hasClass('imageAttrMulti') && $(this).prop('readonly') !== true) {
			$(this).removeClass('imageAttrMulti');
			$(this).addClass('imageAttrMultiEdited');
		}
	});
	
	$( "#pendingTransactionDialog" ).dialog({ 
		autoOpen: false, modal: true, 
		close: function ( event, ui ) {onPendingTransactionClosed(event, ui);} });
	$( "#transactionCompletedDialog" ).dialog({ 
		autoOpen: false, modal: true, 
		close: function ( event, ui ) { } });
	$( "#createDialog" ).dialog({ 
		autoOpen: false, modal: true, 
		buttons: [ { text: "Ok", click: function() { $('#tbCreateConfirmed').val('yes');$( this ).dialog( "close" ); } },
				   { text: "Cancel", click: function() { $('#tbCreateConfirmed').val('');$( this ).dialog( "close" ); } }],
		close: function ( event, ui ) {onCreateClosed(event, ui);} });
	$( "#removeDialog" ).dialog({ 
		autoOpen: false, modal: true, 
		buttons: [ { text: "Ok", click: function() { $('#tbRemoveConfirmed').val('yes');$( this ).dialog( "close" ); } },
				   { text: "Cancel", click: function() { $( this ).dialog( "close" ); } }],
		close: function ( event, ui ) {onRemoveClosed(event, ui);} });
	$( "#unsavedAttrDialog" ).dialog({ 
		autoOpen: false, modal: true, 
		buttons: [ { text: "Yes", click: function() { saveImageAttr();$( this ).dialog( "close" ); } },
				   { text: "No", click: function() { $( this ).dialog( "close" ); } }],
		close: function ( event, ui ) {onUnsavedClosed(event, ui);} });
		
	$(document).keydown(function (e) {	
		if (e.ctrlKey) {
			if (e.keyCode == 65 || e.keyCode == 97) { // 'A' or 'a'
			  e.preventDefault();
			  $('.viewListImage:visible').addClass('selected');

			  //update UI to reflect selection state
			  handleSelectionChanged();
			}
		}
		else if (e.keyCode == 39) //right arrow
		{
			e.preventDefault();
			selectAdjacentImage(true);
		}
		else if (e.keyCode == 37) //left arrow
		{
			e.preventDefault();
			selectAdjacentImage(false);
		}
	});
	
	//$('#divMainImages').bind("keydown", function (e) {	
	//	alert('divMainImages key down');						
	//}, false);
	
	$('.linkLabel').click(function (e) {
		//find the next input field to get the url 
		var url = $(this).parent().next().find('input[type=text]').val();
		//todo: can also check if valid url
		if (url != null && url.length > 0)
			window.open(url);
		else alert('Not a valid url.');
	});
	
	$('#inputFilter').on('input', function (e) {
		updateImageFilter($(e.currentTarget).val());
	});
	
	enableSaveImageAttr(false);
	
	//track any changes to the image attributes
	$('#divMainImageDetail').find('input').keydown(function() {
		//TODO: Better way to handle multi later
		if ($('#divMainImages').find('li.selected').length === 1) {
			imageAttrDirty = true;
		}
	});
	
	body_sizer();
	$(window).resize(body_sizer);
	//$(window).resize(body_sizer);
});

function verifyApiResponseSuccess(response) {
	//some APIs don't seem to return a status -- they probably should
	if (response.status === undefined || response.status === 'success') {
		return true;
	}
	else {
		if (response.ErrorCode === 1) {
			login();
		}
		else {
			alert('Error: ' + response.message);
		}
		return false;
	}
}

function login() {
	//go to login url (will redirect back)
	window.location.href = authUrl;
}

function getVal(string, name) {
	if (string.indexOf(name) == -1) {
		return null;
	}
  
	var startIndex = string.indexOf(name)+name.length+1;
	var endIndex = startIndex;
	while (endIndex < string.length) {
		endIndex++;
		if(string[endIndex]=='&') {
		break;
		}
	}
	
	return string.substring(startIndex, endIndex);
}

function initAuth() {	
	//authToken = $.url().param('token');
	//authEmail = $.url().param('email');
	var requestURL = window.document.URL.toString(); 
    authToken = getVal(requestURL,'token');
	authEmail = getVal(requestURL,'email');
	isAdmin = getVal(requestURL,'isAdmin') === "0" ? false : true;
	
	//Check for cookies if not passed in as param
	//If passed in as param, save as cookie
	if (!authToken) {
		authToken = $.cookie("artkick_editor_auth_token");
	}
	else {
		$.cookie("artkick_editor_auth_token", authToken);
	}
	if (!authEmail) {
		authEmail = $.cookie("artkick_editor_auth_email");
	}
	else {
		$.cookie("artkick_editor_auth_email", authEmail);
	}
	
	//if not passed in and no cookie, login
	if (!authToken || !authEmail) {
		login();
	}
}

function getAuthAPIParams()
{
	return 'token=' + authToken +
		   '&email=' + authEmail;	
}

//TODO: This inline main code is buried -- need to refactor

var myArr = [];
var myCategories = [];
var categoriesLoaded = 0;
var imageAttrDirty = false;

//point to request database (default is staging)
//var databaseParam = $.url().param('database');
//var baseEditorUrl = $.url().attr('protocol') + ':' + $.url().attr('path');
var baseEditorUrl = window.document.URL.toString(); 
var databaseParam = getVal(baseEditorUrl, 'database');

if (databaseParam) {
	baseEditorUrl = baseEditorUrl.replace(/&database=staging/, '');
	baseEditorUrl = baseEditorUrl.replace(/&database=production/, '');
}

if (databaseParam == "production")
{
	alert('WARNING: You are about to edit live production data. Proceed with caution.');
	server = serverProd;
	baseCmdUrl = baseCmdUrlProd;
}

console.log('Editor Host: ' + baseEditorUrl + " Database Param: " + databaseParam);
console.log('Database Server: ' + server + " Base Url: " + baseCmdUrl);

initAuth();
/*
if (isAdmin) {
	loadArtkickCategories();
}
else {
	server = serverPersonal;
	baseCmdUrl = baseCmdUrlPersonal;
	loadPersonalCategories();
}
*/

function addTrashCategory() {
	//manually add trash
	var trashCount = '-'; //TODO: Need API call
	//TODO: Duplicate code from getViewListImages -- need to combine
	var strTrashViewList = '<li class="trashViewList" rel="trashViewList" id="' + trashId + '"' +
							' displayName="' + trashName + '"' +
							' imageCount="' + trashCount + '"' +
							'><a>' + trashName + ' (' + trashCount + ')' + '</a>' +
					   '</li>';
	myArr.push("<li " + 'class="trashCategory" rel="trashCategory" id=' + convertNameToId(trashName) + ' displayName="' + trashName + '"' +
				"><a>" + trashName + "</a><ul>" + strTrashViewList + "</ul></li>" );
}

function loadPersonalCategories() {
	//TODO: Some duplicate code here and in loadArtkickCategories
	myArr.push('<div id="container"> <ul> <li id="treetop" class="root" rel="root" displayName="ArtKick"><a>ArtKick - ' + server + '</a><ul>');

	//for personal lists, there will just be a single category (email for now)
	var catName = authEmail;
	myArr.push("<li " + 'class="category" rel="category" id=' + '-10' + ' displayName="' + catName + '"' + "><a>" + catName + "</a><ul><a>...</a></ul></li>" );	
	myCategories.push('-10');
	
	//manually add a trash category
	addTrashCategory();
	
	//finish up the outer div
	myArr.push('</ul></li></ul></div>');
	$('#divNavTree2').html(myArr.join(''));
	
	//manually add trash click handler
	AddCatViewListClickHandlers(trashName);
	
	//add view lists for each category
	for (var i = 0; i < myCategories.length; i++) {
	   getCatViewLists(myCategories[i]);
	}
}

function loadArtkickCategories() {
	$.ajax({
	  url: baseCmdUrl + 'allCategories' + '?' + getAuthAPIParams(),
	  dataType: 'jsonp',
	  async: false,
	  
	  success: function(data) {
		if (verifyApiResponseSuccess(data)) {
			myArr.push('<div id="container"> <ul> <li id="treetop" class="root" rel="root" displayName="ArtKick"><a>ArtKick - ' + server + '</a><ul>');
			$.each(data, function(key, value) {
				if (key == 'categories') {
					$(this).each(function(key, value) {
						//var catViewList = getCatViewLists(value["name"]);
						myArr.push("<li " + 'class="category" rel="category" id=' + convertNameToId(value["name"]) + ' displayName="' + value["name"] + '"' + "><a>" + value["name"] + "</a><ul><a>...</a></ul></li>" );
						myCategories.push(value["name"]);
					});
				}
			});
			
			//manually add trash
			var trashCount = '-'; //TODO: Need API call
			//TODO: Duplicate code from getViewListImages -- need to combine
			var strTrashViewList = '<li class="trashViewList" rel="trashViewList" id="' + trashId + '"' +
									' displayName="' + trashName + '"' +
									' imageCount="' + trashCount + '"' +
									'><a>' + trashName + ' (' + trashCount + ')' + '</a>' +
							   '</li>';
			myArr.push("<li " + 'class="trashCategory" rel="trashCategory" id=' + convertNameToId(trashName) + ' displayName="' + trashName + '"' +
						"><a>" + trashName + "</a><ul>" + strTrashViewList + "</ul></li>" );
			
			//finish up the outer div
			myArr.push('</ul></li></ul></div>');
			$('#divNavTree2').html(myArr.join(''));
			
			//manually add trash click handler
			AddCatViewListClickHandlers(trashName);
			
			//add view lists for each category
			for (var i = 0; i < myCategories.length; i++) {
			   getCatViewLists(myCategories[i]);
			}
		}
		},
		error: function(data) {
			alert('Error: could not retreive json data for categories');
		}
	});
}
		
function convertNameToId(name) {
	//must not have spaces in Id
	//return name.replace(' ','__');
	/\"/g
	return name.replace(/ /g,'__');
}

function convertIdToName(id) {
	//return id.replace('__',' ');
	return id.replace(/__/g,' ');
}

function getCatViewLists(cat) {
	var viewLists = [];
	var strViewLists = "";
	var cmd = 'getViewlistsByCategory2';	
	var vlURL = encodeURI(baseCmdUrl + cmd + '?catName=' + cat + '&' + getAuthAPIParams());
	
	var request = $.ajax({
		  url: vlURL,
		  dataType: 'jsonp',
		  async: true,
		  timeout: 60000,
	});
	
	request.done(function (data, textStatus, jqXHR) {
		if (verifyApiResponseSuccess(data)) {
			var featuredLists = data['featuredLists'];
			$.each(data, function(key, value) {
				if (key == 'viewlists') {
					$(this).each(function(key, value) {
						if (value["name"] != " All")
						{
							//var imageCount = getViewListImageCount(value["images"]);
							var imageCount = value["imageNum"];
							//var isFeatured = value["featured"] != null && value["featured"] == "true";
							var isFeatured = jQuery.inArray(value["id"], featuredLists) >= 0;
							var relType = isFeatured ? "viewListFeatured" : "viewList";
							viewLists.push('<li class="viewList" rel="' + relType + '" id="' + value["id"] + '"' +
												' displayName="' + value["name"] + '"' +
												' imageCount="' + imageCount + '"' +
												'><a>' + value["name"] + ' (' + imageCount + ')' + '</a>' +
										   '</li>');
						}
					});
				};
				strViewLists = "<ul>" + viewLists.join('') + "</ul>";
			});
			$(document).find('#' + convertNameToId(cat)).children('ul').html(strViewLists);
			AddCatViewListClickHandlers(cat);
			
			//Note: We are getting viewLists asynch, so need to load tree was we have the last view list
			categoriesLoaded = categoriesLoaded + 1;
			console.log(cat + " " + categoriesLoaded);
			if (categoriesLoaded == myCategories.length)
				buildNavTree();
		}
	});
	
	request.fail(function (jqXHR, textStatus, errorThrown){
		alert(
			"Could not load viewlists for category " + cat + '.' +
			"\nThe following error occured: " +
			textStatus + " " + errorThrown
		);
		// log the error to the console
		categoriesLoaded = categoriesLoaded + 1;
		console.log(cat + " failed to load!");
		if (categoriesLoaded == myCategories.length)
			buildNavTree();
		
	});
}

function AddCatViewListClickHandlers(cat)
{
	var viewListClass = (cat == trashName) ? "trashViewList" : "viewList";
	$(document).find('#' + convertNameToId(cat)).find('li.' + viewListClass).each(function () {
		$(this).click(function (e) {
			//alert($(this).attr('id') + 'viewList clicked!');
			if (imageAttrDirty)
			{
				$("#tbNewViewListId").val($(this).attr('id'));
				$("#tbNewImageId").val('');
				$("#unsavedAttrDialog").dialog("open");
				return;
			}
			clearViewListImages();
			getViewListImages($(this).attr('id'));
		});
	});
}

function buildNavTree()
{ 
	console.log("Info: building tree as we have gotten " + categoriesLoaded + " of " + myCategories.length + " view lists");
	//builds the navigation tree once all viewlists are loaded		
	$('#container').jstree({
		
		"plugins" : ["themes","html_data","ui","crrm","contextmenu", "dnd", "types"], 

		"contextmenu": { 
			items: function(node) {
				if (node.attr('rel') == 'root' && isAdmin) {
					var otherServer;
					if (server == serverStag)
						otherServer = serverProd;
					else
						otherServer = serverStag;
					return { 
						ccp: false, 
						create: { 
							label: "Create new category", 
							action: function (obj) 
								{ createViewListOrCategory (obj) }, 
							seperator_after : false, 
							seperator_before : false 
							},
						changeDatabase: { 
							label: "Change to " + otherServer, 
							action: function (obj) 
								{ toggleDatabase() }, 
							seperator_after : false, 
							seperator_before : false 
							}
					} // end items 
				}
				else if (node.attr('rel') == 'category') {
					if (isAdmin) {
						return { 
							ccp: false, 
							rename: { 
								label: "Rename", 
								action: function (obj) 
									{ renameViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								}, 
							create: { 
								label: "Create new view list", 
								action: function (obj) 
									{ createViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								},
							remove: { 
								label: "Remove", 
								action: function (obj) 
									{ removeViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								}
						} // end items
					}
					else {
						return { 
							ccp: false, 
							create: { 
								label: "Create new view list", 
								action: function (obj) 
									{ createViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								}
						} // end items
					}
				}
				else if (node.attr('rel') == 'viewList' || node.attr('rel') == 'viewListFeatured') {
					if (isAdmin) {
						return { 
							ccp: false, 
							rename: { 
								label: "Rename", 
								action: function (obj) 
									{ renameViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								},
							toggleFeatured: { 
								label: "Toggle Featured", 
								action: function (obj) 
									{ toggleFeaturedViewList (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								},
							create: { 
								label: "Create new image", 
								action: function (obj) 
									{ addNewImageToViewList(obj) }, 
								seperator_after : false, 
								seperator_before : false 
								}, 
							remove: { 
								label: "Remove", 
								action: function (obj) 
									{ removeViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								}
						} // end items 
					}
					else {
						return { 
							ccp: false, 
							rename: { 
								label: "Rename", 
								action: function (obj) 
									{ renameViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								},
							remove: { 
								label: "Remove", 
								action: function (obj) 
									{ removeViewListOrCategory (obj) }, 
								seperator_after : false, 
								seperator_before : false 
								}
						} // end items 
					}
				}
				else return { }
			}
		},
		
		"dnd" : { 
			"drag_target" : ".viewListImage", 
			"drop_finish" : function () {  
				console.log("DROP");  
			}, 
			"drag_check" : function (data) { 
				 if(data.r.attr("class").indexOf('viewList') == -1) { 
					 return false; 
				 } 
				 return {  
					 after : false,  
					 before : false,  
					 inside : true 
				 }; 
			 }, 
			 "drag_finish" : function (data) {  
				 handleImagesDropped(data);  
			 } 
		}, 

		"themes" : {
			
			"dots" : false,
			"icons" : true
		},
		
		"types": {
		"valid_children": ["root"],
		"types": {
			"root": {
				"valid_children" : ["category"],
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/root.png"
				}
			},
			"category": {
				"valid_children" : ["viewList", "viewListFeatured", "default"],
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/folder.png"
				}
			},
			"trashCategory": {
				"valid_children" : ["trashViewList", "default"],
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/trash.png"
				}
			},
			"viewList": {
				"valid_children" : ["none"],
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/file.png"
				}
			},
			"viewListFeatured": {
				"valid_children" : ["none"],
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/file2.png"
				}
			},
			"trashViewList": {
				"valid_children" : ["none"],
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/trash.png"
				}
			},
			"default": {
				"valid_children" : "none",
				"icon" : {
					"image" : "jstree-v.pre1.0/_demo/file.png"
				 }
			}
		}
		},
		
		"core": {
			"initially_open": ["treetop"]
		
		}
		
		}).bind("move_node.jstree rename_node.jstree create_node.jstree", function(event, data) {
			var type = event.type;
			//alert(type);
			if (type === 'move_node') {
				//handle move_node.jstree here
			} else if (type === 'rename_node') {
				if (!tempRename)
				{
					var id = data.args[0][0].id;
					var newName = data.args[1];
					var objectClass = $('li#' + id).attr('class');
					if (objectClass.indexOf('viewList') != -1)
					{
						renameViewList(data.args[0][0], id, newName);
					}
					else if (objectClass.indexOf('category') != -1)
					{
						renameCategory(id, newName);
					}
				}
				
			} else if (type === 'create_node') {
				//handle create_node.jstree here
			}

		});
		
	$('#divNavTreeLoading').hide();
	$('#divNavTree2').show();
}

function getViewListImageCount(value) {
	var viewLists = [];
	var imageCount = 0;
	$(value).each(function(key, value) {
		$(this).each(function(key, value) {
			imageCount = imageCount + 1;			
		});
	});
	return imageCount;
}

function getViewListImages(viewListId) {
	var vlImages = [];
	var strImages = "";
	var imageCount = 0;
	var cmd = (viewListId == trashId) ? 'getTrashImages' : 'getViewlist';
	var params = '?id=' + viewListId + '&' + getAuthAPIParams();

	var vlImagesURL = encodeURI(baseCmdUrl + cmd + params);
	var request = $.ajax({	   
		  url: vlImagesURL,
		  dataType: 'jsonp',
		  timeout: 60000,
		  async: true,		  
	});
	
	request.done(function (data, textStatus, jqXHR) {
		if (verifyApiResponseSuccess(data)) {
			$.each(data, function(key, value) {
				if (key == 'viewlist') {
					$(this).each(function(key, value) {
						imageCount++;
						vlImages.push('<li class="viewListImage" id="' + value["id"] + '" ' +
							getImageAttributes(value) + 
							'><img src="' + value["thumbnail"] + '"</img>' + '</li>');
					});
				};
				strImages = '<ul id="thumbs" viewListId="' + viewListId + '">' + vlImages.join('') + '</ul>';
			});
			
			$(document).find('#divMainImages').html(strImages);
			//$('#thumbs').bxSlider({ infiniteLoop: false, hideControlOnEnd: true, minSlides: 2, maxSlides: 2, slideWidth: 380, slideMargin: 10});
			//$("#divMain2ImageNav").jPages({containerID : "thumbs"});
			
			updateImageCount(viewListId, imageCount);
			
			/*
			$('ul li img').lazyload({
				event: "turnpage",
				effect: "fadeIn"
			});
			$("div.holder").jPages({
			  containerID : "thumbs",
			  perPage     : 10000,
			  previous    : "div.arrowPrev",
			  next        : "div.arrowNext",
			  direction   : "auto",
			  animation   : "fadeInleft",
			  callback    : lazyLoadImages
			});
			*/
			
			//TODO v3: No reason to do each...just use selector
			$(document).find('#divMainImages').find('li.viewListImage').each(function () {
				$(this).click(function () {
					if (imageAttrDirty)
					{
						$("#tbNewViewListId").val('');
						$("#tbNewImageId").val($(this).attr('id'));
						$("#unsavedAttrDialog").dialog("open");
						//alert('Please save changes first');
						return;
					}
					
					handleClickSelectImage(event.ctrlKey, event.shiftKey, $(this));
					
				});
				
				$(this).dblclick(function () {
					window.open($(this).attr("url"));
				});
				
				//never seems to get keydown
				//$(this).bind("keydown", function (e) {	
				//		alert('image key down');						
				//}, false);
				
				$.contextMenu({
					selector: 'li.viewListImage', 
					callback: function(key, options) {
						if (key == "Delete")
							removeSelectedImagesConfirm();
						else if (key == "Open")
							openSelectedImages();
					},
					items: {
						"Open": {name: "Open selected image", icon: "open"},
						"Delete": {name: "Remove selected image(s)", icon: "delete"},
					}
				});
			});
			
			//select first item automatically
			selectAdjacentImage(true);
		}
	});
	
	// callback handler that will be called on failure
	request.fail(function (jqXHR, textStatus, errorThrown){
		// log the error to the console
		alert(
			"The following error occurred: " +
			textStatus + " " + errorThrown
		);
	});
	
	//return strViewLists;
}

function getImageAttributes(value) {
	var strAttrs =  
		'title="' + getImageAttr(value, "Title", true) + '" ' +
		'artistFN="' + getImageAttr(value, "Artist First N", false) + '" ' +
		'artistLN="' + getImageAttr(value, "Artist Last N", false) + '" ' +
		'workDate="' + getImageAttr(value, "Year", false) + '" ' +
		'birthDate="' + getImageAttr(value, "Birthdate", false) + '" ' +
		'deathDate="' + getImageAttr(value, "Died", false) + '" ' +
		'artistInfo="' + getImageAttr(value, "Artist Info", false) + '" ' +
		'genre="' + getImageAttr(value, "Genre", false) + '" ' +
		'genreLink="' + getImageAttr(value, "Genre Link", false) + '" ' +
		'source="' + getImageAttr(value, "Source", false) + '" ' +
		'sourcePageLink="' + getImageAttr(value, "Source Page Link", false) + '" ' +
		'buyNow="' + getImageAttr(value, "extra", false) + '" ' +
		'buyNowLink="' + getImageAttr(value, "extra link", false) + '" ' +
		'medium="' + getImageAttr(value, "Type", false) + '" ' +
		'mediumDetail="' + getImageAttr(value, "Type  Detail", false) + '" ' +
		'aspectRatio="' + getImageAttr(value, "Aspect Ratio", false) + '" ' +
		'heightCm="' + getImageAttr(value, "Height cm", false) + '" ' +
		'widthCm="' + getImageAttr(value, "Width cm", false) + '" ' +
		'subject="' + getImageAttr(value, "Subject", false) + '" ' +
		'credit="' + getImageAttr(value, "Credit", false) + '" ' +
		'copyright="' + getImageAttr(value, "Copyright", false) + '" ' +
		'copyrightDetail="' + getImageAttr(value, "Copyright Detail", false) + '" ' +
		'location="' + getImageAttr(value, "Location", false) + '" ' +
		'moreInfoLink="' + getImageAttr(value, "More Info Link", false) + '" ' +
		'video="' + getImageAttr(value, "Video", false) + '" ' +
		'thumbnail="' + getImageAttr(value, "thumbnail", false) + '" ' +
		'url="' + getImageAttr(value, "url", false) + '" ' +
		'url4K="' + getImageAttr(value, "url4K", false) + '" ' +
		'icon="' + getImageAttr(value, "icon", false) + '" ' +
		'viewLists="' + getImageViewListAttribute(value["viewlists2"]) + '" ';
	return strAttrs;
}

function getImageAttr(value, attr, escape)
{
	var attrValue = value[attr];
	//note: returns undefined if attribute is not present at all
	if (attrValue == null)
		return '';
	else if (escape == true)
		return escapedQuoteConversion(attrValue);
	else
		return attrValue;
}

function escapedQuoteConversion(str)
{
	if (str.indexOf('\"') != -1)
		return str.replace(/\"/g, '&quot;');
	else
		return str;
}

function getImageViewListAttribute(value) {
	var viewLists = [];
	var strViewLists = "";
	$(value).each(function(key, value) {
		$(this).each(function(key, value) {
			if (key == "1" && value != "All")
				viewLists.push(value);			
		});
	});
	strViewLists = viewLists.join();
	return strViewLists;
}

function fillImageAttrUI(image)
{
	imageAttrDirty = false;
	$('#imgTitle').val(image.attr('title'));
	$('#imgArtist').val(image.attr('artistFN'));
	$('#imgArtistLastName').val(image.attr('artistLN'));
	$('#imgWorkDate').val(image.attr('workDate'));
	$('#imgBirth').val(image.attr('birthDate'));
	$('#imgDeath').val(image.attr('deathDate'));
	$('#imgArtistInfo').val(image.attr('artistInfo'));
	$('#imgGenre').val(image.attr('genre'));
	$('#imgGenreLink').val(image.attr('genreLink'));
	$('#imgSource').val(image.attr('source'));
	$('#imgSourcePageLink').val(image.attr('sourcePageLink'));
	$('#imgBuyNow').val(image.attr('buyNow'));
	$('#imgBuyNowLink').val(image.attr('buyNowLink'));
	$('#imgMedium').val(image.attr('medium'));
	$('#imgMediumDetail').val(image.attr('mediumDetail'));
	$('#imgHeightCm').val(image.attr('heightCm'));
	$('#imgWidthCm').val(image.attr('widthCm'));
	$('#imgAspectRatio').val(image.attr('aspectRatio'));
	$('#imgSubject').val(image.attr('subject'));
	$('#imgCredit').val(image.attr('credit'));
	$('#imgLocation').val(image.attr('location'));		
	$('#imgCopyright').val(image.attr('copyright'));
	$('#imgCopyrightDetail').val(image.attr('copyrightDetail'));
	$('#imgMoreInfoLink').val(image.attr('moreInfoLink'));
	$('#imgVideo').val(image.attr('video'));
	$('#imgThumbnail').val(image.attr('thumbnail'));
	$('#imgUrl').val(image.attr('url'));
	$('#imgUrl4K').val(image.attr('url4K'));
	$('#imgIcon').val(image.attr('icon'));
	$('#imgViewLists').val(image.attr('viewLists'));
	$('#imgId').val(image.attr('id'));
}

function refreshImageAttrUI(imageId)
{
	imageAttrDirty = false;
	var cmd = "getImage";
	var params = "id=" + imageId + '&' + getAuthAPIParams();
	// fire off the request to /form.php
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		// log a message to the console
		if (verifyApiResponseSuccess(response)) {
			$.each(response, function(key, value) {
				if (key == 'Image')
				{
					var targetImage = $(document).find('#divMainImages').find('li.viewListImage#' + imageId);
					//var selector = "li.viewListImage#" + imageId;
					targetImage.attr('title', value["Title"]);
					targetImage.attr('artistFN', value["Artist First N"]);
					targetImage.attr('artistLN', value["Artist Last N"]);
					targetImage.attr('workDate', value["Year"]);
					targetImage.attr('birthDate', value["Birthdate"]);
					targetImage.attr('deathDate', value["Died"]);
					targetImage.attr('artistInfo', value["Artist Info"]);
					targetImage.attr('genre', value["Genre"]);
					targetImage.attr('genreLink', value["Genre Link"]);
					targetImage.attr('source', value["Source"]);
					targetImage.attr('sourcePageLink', value["Source Page Link"]);
					targetImage.attr('buyNow', value["extra"]);
					targetImage.attr('buyNowLink', value["extra link"]);
					targetImage.attr('medium', value["Type"]);
					targetImage.attr('mediumDetail', value["Type  Detail"]);
					targetImage.attr('aspectRatio', value["Aspect Ratio"]);
					targetImage.attr('heightCm', value["Height cm"]);
					targetImage.attr('widthCm', value["Width cm"]);
					targetImage.attr('subject', value["Subject"]);
					targetImage.attr('credit', value["Credit"]);
					targetImage.attr('copyright', value["Copyright"]);
					targetImage.attr('copyrightDetail', value["Copyright Detail"]);
					targetImage.attr('location', value["Location"]);
					targetImage.attr('moreInfoLink', value["More Info Link"]);
					targetImage.attr('video', value["Video"]);
					targetImage.attr('thumbnail', value["thumbnail"]);
					targetImage.attr('url', value["url"]);
					targetImage.attr('url4K', value["url4K"]);
					targetImage.attr('icon', value["icon"]);
					
					fillImageAttrUI(targetImage);
				}
			});
		}
	});

	// callback handler that will be called on failure
	request.fail(function (jqXHR, textStatus, errorThrown){
		// log the error to the console
		alert(
			"The following error occurred: "+
			textStatus, errorThrown
		);
	});

	// callback handler that will be called regardless
	// if the request failed or succeeded
	request.always(function () {
		// reenable the inputs
		//$inputs.prop("disabled", false);
	});
	
}

function clearImageAttrUI()
{
	fillImageAttrUI($('#loadingImage img'));
}

function clearViewListImages() {
	$(document).find('#divMainImages').html('<ul id="thumbs"><li id="loadingImage"><img src="jPages-master/img/preload.png"></img></li></ul>');
			$("div.holder").jPages({
			  containerID : "thumbs",
			  perPage     : 50,
			  previous    : "div.arrowPrev",
			  next        : "div.arrowNext",
			  direction   : "auto",
			  animation   : "fadeInleft"
			});
	fillImageAttrUI($('#loadingImage img'));
	enableSaveImageAttr(false);
}

function buildSaveImageJson() {
	return { 
		'id':  $('#imgId').val(),
		'Title': $('#imgTitle').val(),
		'token': authToken,
		'email': authEmail,
		'Artist First N': $('#imgArtist').val(),
		'Artist Last N': $('#imgArtistLastName').val(),
		'Year': $('#imgWorkDate').val(),
		'Birthdate': $('#imgBirth').val(),
		'Died': $('#imgDeath').val(),
		'Artist Info': $('#imgArtistInfo').val(),
		'Genre': $('#imgGenre').val(),
		'Genre Link': $('#imgGenreLink').val(),
		'Source': $('#imgSource').val(),
		'Source Page Link': $('#imgSourcePageLink').val(),
		'extra': $('#imgBuyNow').val(),
		'extra link': $('#imgBuyNowLink').val(),
		'Type': $('#imgMedium').val(),
		'Type  Detail': $('#imgMediumDetail').val(),
		'Aspect Ratio': $('#imgAspectRatio').val(),
		'Height cm': $('#imgHeightCm').val(),
		'Width cm': $('#imgWidthCm').val(),
		'Subject': $('#imgSubject').val(),
		'Credit': $('#imgCredit').val(),
		'Copyright': $('#imgCopyright').val(),
		'Copyright Detail': $('#imgCopyrightDetail').val(),
		'Location': $('#imgLocation').val(),
		'More Info Link': $('#imgMoreInfoLink').val(),
		'Video': $('#imgVideo').val(),
		'thumbnail': $('#imgThumbnail').val(),
		'url': $('#imgUrl').val(),
		'url4K': $('#imgUrl4K').val(),
		'icon': $('#imgIcon').val()
	}
}

function saveImageAttr()
{
	//note: imgId is a hidden field in the image attribute section
	var cmd="SaveImgAttr"
	var imageId = $('#imgId').val();
	var imageData = buildSaveImageJson();
	
	// setup some local variables
	var $form = $('#divMainImageDetail');
	var $inputs = $form.find("input, select, button, textarea");
	// let's disable the inputs for the duration of the ajax request
	$inputs.prop("disabled", true);

	//temp to track saves
	//console.log(baseCmdUrl + cmd + "?" + params);
	
	var success = false;
	$("#pendingTransactionDialog").dialog("open");
	
	var request = $.ajax({
		url: baseCmdUrl + cmd,
		type: 'POST',
		data: imageData
		//dataType: 'jsonp' - jsonp does not support post	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//alert("Changes have been saved.");
			//refreshImageAttrUI(imageId);
			success = true;
		}
	});

	// callback handler that will be called on failure
	request.fail(function (jqXHR, textStatus, errorThrown){
		// log the error to the console
		alert(
			"The following error occured: "+
			textStatus, errorThrown
		);
	});

	// callback handler that will be called regardless
	// if the request failed or succeeded
	request.always(function () {
		// reenable the inputs
		$inputs.prop("disabled", false);
		$("#pendingTransactionDialog").dialog("close");
		if (success)
		{
			//alert("Changes have been saved.");
			$("#transactionCompletedDialog").dialog("open");
			setTimeout(function () { $("#transactionCompletedDialog").dialog("close"); }, 1000);
			refreshImageAttrUI(imageId);
		}
	});
	
}

//TODO: Will not need all of theses params if standardize on all of the ids
function addSaveImageAttrParamIfChanged(imageId, attr, attrId, attrUiId)
{
	currentValue = $('#' + imageId).attr(attrId);
	newValue = $('#' + attrUiId).val();
	if (newValue == currentValue)
		return '';
	else
		return '&' + attr + '=' + encodeURI(newValue);
}

function lazyLoadImages (pages, items) 
{
	//lazy load current
	items.showing.find("img").trigger("turnpage");
	//lazy load next page images
	items.oncoming.find("img").trigger("turnpage");
}



function renameViewListOrCategory (obj)
{
	var objectId = obj[0].id;
	var objectClass = $('#' + objectId).attr('class');
	if (objectClass.indexOf('viewList') != -1)
	{
		$('#tbRenameId').val(objectId);
		$('#tbRenameClass').val('viewList');
		//workaround as view list name has (#images) appended
		var actualName = $('#divNavTree2').find('#' + objectId).attr('displayName');
		tempRename = true;
		$('#container').jstree('rename_node', obj[0], actualName);
		tempRename = false;

		$('#container').jstree("rename");
	}
	else if (objectClass.indexOf('category') != -1)
	{
		$('#tbRenameId').val(objectId);
		$('#tbRenameClass').val('category');
		$('#container').jstree("rename");
	}
}

function renameViewList(obj, id, newName)
{
	var cmd = '';
	var params = '';
	
	cmd = 'RenameViewlist';
	params = 
		'id=' + id +
		'&name=' + newName +
		'&' + getAuthAPIParams();
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
		
			//update display name
			var viewList = $('#divNavTree2').find('#' + id);
			viewList.attr('displayName', newName);
			
			//workaround as view list name has (#images) appended
			tempRename = true;
			$('#container').jstree('rename_node', obj, newName + ' (' + viewList.attr('imageCount') + ')');
			tempRename = false;
		}
	});
}

function renameCategory(id, newName)
{
	var cmd = '';
	var params = '';
	
	cmd = 'RenameCategory';
	params = 
		'oldname=' + convertIdToName(id) +
		'&newname=' + newName +
		'&' + getAuthAPIParams();
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//alert("Rename complete.");
			//TODO: Should we verify changes?
		}
	});
}

function onPendingTransactionClosed( event, ui ) 
{
	
}

function createViewListOrCategory (obj)
{
	var objectId = obj[0].id;
	var objectClass = $('#' + objectId).attr('class');
	var objectDisplayName = $('#' + objectId).attr('displayName');
	//if on a category, create a view list
	if (objectClass.indexOf('category') != -1)
	{
		$('#tbCreateUnderCategory').html('<a>Click Ok to create a new View List under ' + objectDisplayName + '</a>');
		$('#tbCreateId').val(objectId);
		$('#tbCreateClass').val('viewList');
		$('#tbCreateConfirmed').val('');
		$("#createDialog").dialog("open");	
	}
	else if (objectClass.indexOf('root') != -1)
	{
		$('#tbCreateUnderCategory').html('<a>Click Ok to create a new category under ArtKick</a>');
		$('#tbCreateId').val(objectId);
		$('#tbCreateClass').val('category');
		$('#tbCreateConfirmed').val('');
		$("#createDialog").dialog("open");	
	}
}

function createViewList(id, newName)
{
	var cmd = '';
	var params = '';
	
	cmd = 'CreateViewlist';
	params = 
		'catName=' + convertIdToName(id) +
		'&listName=' + newName +
		'&' + getAuthAPIParams();
		
	var success = false;
	$("#pendingTransactionDialog").dialog("open");
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			success = true;
		}
	});
	
	request.always(function () {
		$("#pendingTransactionDialog").dialog("close");
		if (success == true)
		{
			alert("New view list has been created. Category/View list tree will be reloaded.");
			location.reload();
		}
	});
}

function createCategory(id, newName)
{
	var cmd = '';
	var params = '';
	
	cmd = 'CreateCategory';
	params = 'name=' + newName + '&' + getAuthAPIParams();
	
	var success = false;
	$("#pendingTransactionDialog").dialog("open");
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			success = true;
		}
	});
	
	request.always(function () {
		$("#pendingTransactionDialog").dialog("close");
		if (success == true)
		{
			alert("New category has been created. Category/View list tree will be reloaded.");
			location.reload();
		}
	});
}

function onCreateClosed( event, ui ) 
{
	//alert($('#tbRenameNewName').val() + $('#tbRenameId').val() + $('#tbRenameClass').val());
	var id = $('#tbCreateId').val();
	var newName = $('#tbCreateNewName').val();
	var objClass = $('#tbCreateClass').val();
	var confirmation = $('#tbCreateConfirmed').val();
	if (confirmation.length > 0 && newName.length > 0)
	{
		if (objClass == viewListType)
		{
			//alert('create viewlist ' + newName + id);
			createViewList(id, newName);
		}
		else if (objClass == categoryType)
		{
			//alert('create category ' + newName + id);
			createCategory(id, newName);
		}
	}
}

function removeViewListOrCategory (obj)
{
	var objectId = obj[0].id;
	var objectClass = $('#' + objectId).attr('class');
	var objectDisplayName = $('#' + objectId).attr('displayName');
	//if on a category, create a view list
	if (objectClass.indexOf(viewListType) != -1)
	{
		$('#tbRemoveId').val(objectId);
		$('#tbRemoveItems').html(objectDisplayName + ' View List');
		$('#tbRemoveCat').val(obj[0].parentNode.parentNode.parentNode.id);
		$('#tbRemoveClass').val('viewList');
		$('#tbRemoveConfirmed').val('');
		$("#removeDialog").dialog("open");	
	}
	else if (objectClass.indexOf(categoryType) != -1)
	{
		$('#tbRemoveId').val(objectId);
		$('#tbRemoveItems').html(objectDisplayName + ' Category');
		$('#tbRemoveClass').val('category');
		$('#tbRemoveConfirmed').val('');
		$("#removeDialog").dialog("open");	
	}
}

function removeViewListFromCat(id, catName)
{
	var cmd = '';
	var params = '';
	
	cmd = 'RemoveViewlistFromCategory';
	params = 
		'listId=' + id +
		'&catName=' + convertIdToName(catName) +
		'&' + getAuthAPIParams();
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			$("#container").jstree("remove"); 
		}
	});
}

function removeCategory(id)
{
	var cmd = 'RemoveCategory';
	var params = 
		'name=' + convertIdToName(id) +
		'&' + getAuthAPIParams();
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			$("#container").jstree("remove");
		}
	});
}

function onRemoveClosed( event, ui ) 
{
	var id = $('#tbRemoveId').val();
	var confirmation = $('#tbRemoveConfirmed').val();
	var objClass = $('#tbRemoveClass').val();
	var objCat = $('#tbRemoveCat').val();
	if (confirmation.length > 0)
	{
		if (objClass == viewListType)
		{
			removeViewListFromCat(id, objCat);
		}
		else if (objClass == categoryType)
		{
			removeCategory(id);
		}
		else if	 (objClass == imageType)
		{
			removeSelectedImagesFromViewlist();
		}
	}
}

function handleImagesDropped(data)
{
	//jPages does not seem to handle multiple drag...
	//so for now we will actually get selected items from the image list 
	//rather than the drag object
	var viewListId = data.r.attr('id');
	
	var cmd = "AddImagesToViewlist";
				 
	var imageListData = {
		listId: viewListId,
		images: buildSelectedImageListPost(),
		token: authToken,
		email: authEmail
	}
	
	var success = false;
	$("#pendingTransactionDialog").dialog("open");
	
	var request = $.ajax({
		url: baseCmdUrl + cmd,
		type: 'POST',
		data: imageListData
		//dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			//TODO: What if current list?
			success = true;
		}
	});
	
	request.always(function () {
		$("#pendingTransactionDialog").dialog("close");
		if (success == true)
			console.log("The selected images have been copied to the view list.");
	});
}

function buildSelectedImageList()
{
	//jPages does not seem to handle multiple drag...
	//so for now we will actually get selected items from the image list 
	//rather than the drag object
	//$(document).find('#divMainImages').html(strImages);
	var imageArray = [];
	$('#divMainImages').find('li.selected').each(function () {
		imageArray.push('images[]=' + $(this).attr('id'));
	});
	return imageArray.join('&');
}

function buildSelectedImageListPost()
{
	//jPages does not seem to handle multiple drag...
	//so for now we will actually get selected items from the image list 
	//rather than the drag object
	//$(document).find('#divMainImages').html(strImages);
	var imageArray = [];
	$('#divMainImages').find('li.selected').each(function () {
		imageArray.push($(this).attr('id'));
	});
	return imageArray;
}

function removeSelectedImagesConfirm()
{
	var imageArray = [];
	$('#divMainImages').find('li.selected').each(function () {
		imageArray.push($(this).attr('title'));
	});
	var images;
	if (imageArray.length > 10)
		images = parseInt(imageArray.length) + " Images";
	else
		images = imageArray.join(', ');
	
	$('#tbRemoveId').val('');
	$('#tbRemoveItems').html(images);
	$('#tbRemoveCat').val('');
	$('#tbRemoveClass').val(imageType);
	$('#tbRemoveConfirmed').val('');
	$("#removeDialog").dialog("open");	
}

function removeSelectedImagesFromViewlist()
{
	var viewListId = $('#thumbs').attr('viewListId');
	var cmd = (viewListId == trashId) ? "clearImages" : "RemoveImagesFromViewlist";
	var selectedImages = buildSelectedImageListPost();

	var imageListData = {
		listId: viewListId,
		images: selectedImages,
		token: authToken,
		email: authEmail
	}
	
	//var imageListDataJSON = JSON.stringify(imageListData);
	
	var request = $.ajax({
		url: baseCmdUrl + cmd,
		type: 'POST',
		data: imageListData
		//dataType: 'jsonp',
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			//remove the images from the list
			for (var i = 0; i < selectedImages.length; i++) {
				$('#divMainImages').find('#' + selectedImages[i]).remove();
			}
			handleSelectionChanged();
		}
	});
}

function openSelectedImages()
{
	$('#divMainImages').find('li.selected').each(function () {
		window.open($(this).attr("url"));
	});
}

//select next image (selects first if none)
function selectAdjacentImage(next)
{
	var currentSelectedItem = next ? $('#divMainImages').find('li.selected:last') : $('#divMainImages').find('li.selected:first');
	if (currentSelectedItem.length == 0)
	{
		$('#divMainImages').find('li:visible:first').trigger("click");
		return;
	}
	
	var nextprevImage = next ? currentSelectedItem.nextAll(':visible:first') : currentSelectedItem.prevAll(':visible:first');
	if (nextprevImage.length != 0)
	{
		//currentSelectedItem.removeClass("selected");
		//currentSelectedItem.siblings().removeClass("selected");
		//nextprevImage.addClass('selected');
		nextprevImage.trigger("click");
	}
}

function handleClickSelectImageId(ctrlKey, shiftKey, imageId)
{
	targetImage = $(document).find('#divMainImages').find('li.viewListImage#' + imageId);
	handleClickSelectImage(ctrlKey, shiftKey, targetImage)
}

function handleClickSelectImage(ctrlKey, shiftKey, targetImage)
{
	if (ctrlKey && targetImage.hasClass('selected'))
		targetImage.removeClass("selected");
	else
		targetImage.addClass("selected");
	
	//deselect as appropriate
	if (!ctrlKey && !shiftKey)
	  targetImage.siblings().removeClass("selected");
	  
	if (shiftKey)
	{
		//$(this).next('.selected') does not seem to work, so need to do the hard way
		var hasPrevSelected = false;
		var prevSelectedNode;
		var hasNextSelected = false;
		var prevSelectedNode;
		currentNode = targetImage.next();
		while (currentNode.length != 0 && !hasNextSelected)
		{
			if (currentNode.hasClass('selected'))
			{
				hasNextSelected = true;
				nextSelectedNode = currentNode;
			}
			else
				currentNode = currentNode.next();
		}
		currentNode = targetImage.prev();
		while (currentNode.length != 0 && !hasPrevSelected)
		{
			if (currentNode.hasClass('selected'))
			{
				hasPrevSelected = true;
				prevSelectedNode = currentNode;
			}
			else
				currentNode = currentNode.prev();
		}
		
		targetImage.siblings().removeClass("selected");
		
		if (hasNextSelected)
		{
			var foundNextSelected = false;
			currentNode = targetImage.next();
			while (currentNode.length != 0 && !foundNextSelected)
			{
				currentNode.addClass('selected');
				if (currentNode[0].id == nextSelectedNode[0].id)
					foundNextSelected = true;
				else
					currentNode = currentNode.next();
			}
			
		}
		else if (hasPrevSelected)
		{
			var foundPrevSelected = false;
			var currentNode = targetImage.prev();
			while (currentNode.length != 0 && !foundPrevSelected)
			{
				currentNode.addClass('selected');
				if (currentNode[0].id == prevSelectedNode[0].id)
					foundPrevSelected = true;
				else
					currentNode = currentNode.prev();
			}
		}
	}
	
	//update UI based on new selection
	handleSelectionChanged();
}

function handleSelectionChanged() {
	if ($('#divMainImages').find('li.selected').length === 1)
	{
		//clear out multi UI
		clearImageAttrMultiUI();
		
		fillImageAttrUI($('#divMainImages').find('li.selected'));
		enableSaveImageAttr(true);
	}
	else if ($('#divMainImages').find('li.selected').length > 1)
	{
		fillMultiImageAttrUI($('#divMainImages').find('li.selected'));
		enableSaveImageAttr(true);
	}
	else {
		clearImageAttrMultiUI();
		clearImageAttrUI();
		enableSaveImageAttr(false);
	}
}

function body_sizer() {
  var bodyheight = $('#outerBody').height();
  var headerheight = $('#header').height();
  var footerheight =  $('#footer').height();
  var imageDetailHeight = $('#divMainImageDetail').height()
  //$("#divNavTree2").height(bodyheight - headerheight - footerheight - 5);
  $("#divMainImages").height(bodyheight - imageDetailHeight - headerheight - footerheight - 40);
  $("#divNavTree2").height(bodyheight - headerheight - footerheight - 40);
}

function enableSaveImageAttr(enable)
{
	var $form = $('#divMainImageDetail');
	var $inputs = $form.find("input, select, button, textarea");
	// let's disable the inputs for the duration of the ajax request
	$inputs.prop("disabled", !enable);
}

function onUnsavedClosed()
{
	var newViewListId = $('#tbNewViewListId').val();
	var newImageId = $('#tbNewImageId').val();
	if (newViewListId != '')
	{
		clearViewListImages();
		getViewListImages($('#tbNewViewListId').val());
	}
	else if (newImageId != '')
	{
		handleClickSelectImageId(event.ctrlKey, event.shiftKey, newImageId);
	}
}

function addNewImageToViewList(obj)
{
	//jPages does not seem to handle multiple drag...
	//so for now we will actually get selected items from the image list 
	//rather than the drag object
	var viewListId = obj[0].id;
	
	var cmd = "createImage";
	var params = 'listId=' + viewListId + '&' + getAuthAPIParams();
				
	
	var success = false;
	$("#pendingTransactionDialog").dialog("open");
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			//TODO: What if current list?
			success = true;
		}
	});
	
	request.always(function () {
		$("#pendingTransactionDialog").dialog("close");
		if (success == true)
		{
			//alert("A new image has been created...image list will be refreshed.");
			getViewListImages(viewListId);
		}
	});
}

function updateImageCount(viewListId, newImageCount)
{
	var viewList = $('#divNavTree2').find('#' + viewListId);
	var currentImageCount = parseInt(viewList.attr('imageCount'));
	if (newImageCount != currentImageCount)
	{
		viewList.attr('imageCount', newImageCount);
		//workaround as view list name has (#images) appended
		tempRename = true;
		$('#container').jstree('rename_node', 'li#' + viewListId, viewList.attr('displayName') + ' (' + newImageCount + ')');
		tempRename = false;
	}
}

function toggleDatabase()
{
	if (server === serverStag)
		$('#productionServerLink').trigger('click');
	else
		$('#stagingServerLink').trigger('click');
}

function toggleFeaturedViewList (obj)
{
	var objectId = obj[0].id;
	var object = $('#divNavTree2').find('li#' + objectId);
	var objectClass = object.attr('class');
	
	//if on a category, create a view list
	if (objectClass.indexOf(viewListType) != -1)
	{
		var isFeatured = object.attr('rel') == viewListFeaturedType;
		var objectType = isFeatured ?  viewListType : viewListFeaturedType;
		
		$('#divNavTree2').find('li#' + objectId).each(function () {
			$(this).attr('rel', objectType);
		});

		setViewListFeatured(objectId, !isFeatured);	
	}
	
}

function setViewListFeatured(viewListId, isFeatured)
{
	//var viewListId = $('#thumbs').attr('viewListId');
	var cmd = "setFeatured";
	var params = 'listId=' + viewListId +
				 '&flag=' + (isFeatured ? "true" : "false") +
				 '&' + getAuthAPIParams();
				 
	//alert(baseCmdUrl + cmd + '?' + params);
	
	var request = $.ajax({
		url: baseCmdUrl + cmd + "?" + params,
		dataType: 'jsonp',	
	});

	// callback handler that will be called on success
	request.done(function (response, textStatus, jqXHR){
		if (verifyApiResponseSuccess(response)) {
			//TODO: Should we verify changes?
			//would do here, but need immediate feedback, and seems jstree won't refresh icon if here
			//var objectType = isFeatured ?  viewListType : viewListFeaturedType;
			//$('#divNavTree2').find('li#' + viewListId).each(function () {
			//	$(this).attr('rel', objectType);
			//});
		}
	});
	
}

function updateImageFilter(val)
{
	$('.viewListImage').removeClass('selected');
	imageFilter = val.trim();
	$('#thumbs').find('li').each(function() {
		var html = $(this)[0].outerHTML;
		if (imageFilter.trim().length === 0 || html.indexOf(imageFilter) >= 0) {
			$(this).show();
		}
		else {
			$(this).hide();
		}
	});
}

//TODO: Move this up and use throughout code as needed
var imageAttributes = [
		{selector: 'imgTitle', attributeName: 'title', apiName: 'Title', multiEnabled: true},
		{selector: 'imgArtistLastName', attributeName: 'artistLN', apiName: 'Artist Last N', multiEnabled: true},
		{selector: 'imgArtist', attributeName: 'artistFN', apiName: 'Artist First N', multiEnabled: true},
		{selector: 'imgWorkDate', attributeName: 'workDate', apiName: 'Year', multiEnabled: true},
		{selector: 'imgBirth', attributeName: 'birthDate', apiName: 'Birthdate', multiEnabled: true},
		{selector: 'imgDeath', attributeName: 'deathDate', apiName: 'Died', multiEnabled: true},
		{selector: 'imgArtistInfo', attributeName: 'artistInfo', apiName: 'Artist Info', multiEnabled: true},
		{selector: 'imgGenre', attributeName: 'genre', apiName: 'Genre', multiEnabled: true},
		{selector: 'imgGenreLink', attributeName: 'genreLink', apiName: 'Genre Link', multiEnabled: true},
		{selector: 'imgSource', attributeName: 'source', apiName: 'Source', multiEnabled: true},
		{selector: 'imgSourcePageLink', attributeName: 'sourcePageLink', apiName: 'Source Page Link', multiEnabled: true},
		{selector: 'imgBuyNow', attributeName: 'buyNow', apiName: 'extra', multiEnabled: true},
		{selector: 'imgBuyNowLink', attributeName: 'buyNowLink', apiName: 'extra link', multiEnabled: true},
		{selector: 'imgMedium', attributeName: 'medium', apiName: 'Type', multiEnabled: true},
		{selector: 'imgMediumDetail', attributeName: 'mediumDetail', apiName: 'Type  Detail', multiEnabled: true},
		{selector: 'imgHeightCm', attributeName: 'heightCm', apiName: 'Height cm', multiEnabled: true},
		{selector: 'imgWidthCm', attributeName: 'widthCm', apiName: 'Width cm', multiEnabled: true},
		{selector: 'imgAspectRatio', attributeName: 'aspectRatio', apiName: 'Aspect Ratio', multiEnabled: true},
		{selector: 'imgSubject', attributeName: 'subject', apiName: 'Subject', multiEnabled: true},
		{selector: 'imgCredit', attributeName: 'credit', apiName: 'Credit', multiEnabled: true},
		{selector: 'imgLocation', attributeName: 'location', apiName: 'Location', multiEnabled: true},
		{selector: 'imgCopyright', attributeName: 'copyright', apiName: 'Copyright', multiEnabled: true},
		{selector: 'imgCopyrightDetail', attributeName: 'copyrightDetail', apiName: 'Copyright Detail', multiEnabled: true},
		{selector: 'imgMoreInfoLink', attributeName: 'moreInfoLink', apiName: 'More Info Link', multiEnabled: true},
		{selector: 'imgVideo', attributeName: 'video', apiName: 'Video', multiEnabled: true},
		{selector: 'imgThumbnail', attributeName: 'thumbnail', apiName: 'thumbnail', multiEnabled: true},
		{selector: 'imgUrl', attributeName: 'url', apiName: 'url', multiEnabled: true},
		{selector: 'imgUrl4K', attributeName: 'url4K', apiName: 'url4K', multiEnabled: true},
		{selector: 'imgIcon', attributeName: 'icon', apiName: 'icon', multiEnabled: true}
		//{selector: 'imgViewLists', attributeName: 'viewLists', apiName: 'Artist Last N', multiEnabled: true},
		//{selector: 'imgId', attributeName: 'id', apiName: 'Artist First N', multiEnabled: true}
	];

function fillMultiImageAttrUI(images)
{
	var imgAttrMatchCount = 0;
	imageAttrDirty = false;
	//console.log(images);
	clearImageAttrUI();
	//We will display any common values for multiple images
	//$('#imgArtistLastName').val(($('#divMainImages').find("li.selected[artistLN='" + $(images[0]).attr('artistLN') + "']").length === $(images).length) ?  $(images[0]).attr('artistLN') : '');
	for (var i = 0; i < imageAttributes.length; i++) {
		//console.log($(this).selector);
		var attrName = imageAttributes[i].attributeName;
		imgAttrMatchCount = $('#divMainImages').find("li.selected[" + attrName + "='" + $(images[0]).attr(attrName) + "']").length;
		$('#' + imageAttributes[i].selector).val((imgAttrMatchCount === $(images).length) ?  $(images[0]).attr(attrName) : '');
	};
	
	//make all readonly to start -- click will activate
	var $form = $('#divMainImageDetail');
	var $inputs = $form.find("input, select, button, textarea");
	//show none of the fields as currently being edited (until click)
	//$inputs.prop("readonly", true);
	$inputs.addClass('imageAttrMulti');
	//show multi-select edit text
	$('#multiSelectInfo').show();
}

//completely resets UI from multi-edit to single
function clearImageAttrMultiUI() {
	var $form = $('#divMainImageDetail');
	var $inputs = $form.find("input, select, button, textarea");
	//$inputs.prop("readonly", false);
	$inputs.removeClass('imageAttrMulti');
	$inputs.removeClass('imageAttrMultiEdited');
	//hide multi-select edit text
	$('#multiSelectInfo').hide();
}

//TODO: Can use for single save as well
function saveImageAttrMulti()
{
	var imageList = buildSelectedImageListPost();
	var imageData = buildSaveImageJsonMulti();
	
	// setup some local variables
	var $form = $('#divMainImageDetail');
	var $inputs = $form.find("input, select, button, textarea");
	// let's disable the inputs for the duration of the ajax request
	$inputs.prop("disabled", true);

	//temp to track saves
	//console.log(baseCmdUrl + cmd + "?" + params);
	
	var success = false;
	$("#pendingTransactionDialog").dialog("open");
	
	var requests = [];
	for (var i = 0; i < imageList.length; i++) {
		imageData.id = imageList[i];
		requests.push(buildSaveImageAjaxMulti(imageData));
	}
	//console.log(requests);
	
	$.when.apply($, requests).done(function () {
		var success = true;
		var error = '';
		var responses = arguments;
		//console.log(responses);
		for (var r = 0; r < responses.length; r++) {
			if (!responses[r][0] || (responses[r][0].status !== 'success')) {
				success = false;
				if (responses[r][0] !== undefined) {
					error = responses[r][0].status + ' - ' + responses[r][0].message;
				}
				break;
			}
		}
		//close the pending transaction dialog
		$inputs.prop("disabled", false);
		$("#pendingTransactionDialog").dialog("close");
		
		if (success)
		{
			//alert("Changes have been saved.");
			imageAttrDirty = false;
			//reset to multi-select (since all will still be selected)
			//$inputs.prop("readonly", true);
			$inputs.addClass('imageAttrMulti');
			$inputs.removeClass('imageAttrMultiEdited');
			
			//temporarily show dialog that shows that everything was saved
			$("#transactionCompletedDialog").dialog("open");
			setTimeout(function () { $("#transactionCompletedDialog").dialog("close"); }, 1000);
			
			//need to update all images to the new values
			//refreshImageAttrUI(imageId);
			for (var i = 0; i < imageList.length; i++) {
				var targetImage = $(document).find('#divMainImages').find('li.viewListImage#' + imageList[i]);
				//var selector = "li.viewListImage#" + imageId;
				$.each(imageData, function (key, val) {
					var imageAttr = _.findWhere(imageAttributes, {apiName: key});
					if (imageAttr) {
						targetImage.attr(imageAttr.attributeName, val);
					}
				});
			}
		}
		else {
			alert("The following error occurred: " + error);
		}
	});
}

//TODO: this can be shared code for single and multi
function buildSaveImageAjaxMulti(imageData) {
	var cmd="SaveImgAttr"
    var request = $.ajax({
		url: baseCmdUrl + cmd,
		type: 'POST',
		data: imageData
		//dataType: 'jsonp' - jsonp does not support post	
	});
		
	return request;
}

//TODO: this can be shared code for single and multi
function buildSaveImageJsonMulti() {
    var saveJson = {
		'token': authToken,
		'email': authEmail
	};
	console.log('Saving the following attributes: ');
	for (var i = 0; i < imageAttributes.length; i++) {
		var apiName = imageAttributes[i].apiName;
		var imageAttr = $('#' + imageAttributes[i].selector);
		if (imageAttr.hasClass('imageAttrMultiEdited') && (imageAttr.val().length > 0)) {
			console.log(imageAttributes[i].selector + ':' + imageAttr.val());
			saveJson[apiName] = imageAttr.val().trim();
		}
	};
		
	return saveJson;
}
