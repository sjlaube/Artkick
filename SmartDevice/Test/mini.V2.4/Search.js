/*

Copyright 2013,2014 Zwamy, Inc.  All Rights Reserved

*/

function usersearch()
{  
	var searchstring;
	var artlist=[
	"strangeone",
	"Banksy",
"Pablo Picasso",
"Picasso",
"Nan Goldin",
"Pierre Soulages",
"Andy Warhol",
"Warhol",
"Victor Vasarely",
"Jackson Pollock",
"Emil Nolde",
"Hans Erni",
"Roy Lichtenstein",
"Lichtenstein",
"Gregory Crewdson",
"Bernard Buffet",
"Nobuyoshi Araki",
"Damien Hirst",
"Yayoi Kusama",
"Salvador Dalí",
"Bert Stern",
"Keith Haring",
"Gerhard Richter",
"Michael Dweck",
"Alexander Calder",
"Henri Matisse",
"Matisse",
"Vik Muniz",
"Wayne Thiebaud",
"Robert Mapplethorpe",
"Edouard Vuillard",
"Jean-Michel Basquiat",
"Georges Rouault",
"Sally Mann",
"Thomas Ruff",
"Frank Stella",
"David Hockney",
"Takashi Murakami",
"Marc Chagall",
"Chagall",
"Andreas Gursky",
"Florence Knoll",
"Alex Katz",
"Lee Krasner",
"Sigmar Polke",
"Cy Twombly",
"Jeff Koons",
"Riusuke Fukahori",
"Shepard Fairey",
"Liu Bolin",
"Ed Ruscha",
"Andy Goldsworthy",
"KAWS",
"Cindy Sherman",
"Robert Motherwell",
"Tom Wesselmann",
"Lucio Fontana",
"Robert Rauschenberg",
"Rauschenberg",
"Robert Indiana",
"Joan Mitchell",
"Carlos Cruz-Diez",
"Elizabeth Peyton",
"Jim Dine",
"Franz Kline",
"Chuck Close",
"Dale Chihuly",
"Chihuly",
"Mike Kelley",
"Massimo Vitali",
"Romero Britto",
"Donald Judd",
"Nick Brandt",
"Yoshitomo Nara",
"Richard Serra",
"Robert Longo",
"Peter Max",
"Diego Rivera",
"Andres Serrano",
"Yves Klein",
"Raymond Pettibon",
"Ai Weiwei",
"Grayson Perry",
"John McLaughlin",
"Man Ray",
"John Baldessari",
"Christopher Wool",
"Richard Estes",
"Anselm Kiefer",
"Helmut Newton",
"Mario Carreño",
"Curtis Jere",
"Jean Dubuffet",
"Josef Albers",
"Hans Prentzel",
"Milton Avery",
"Henry Moore",
"Annie Leibovitz",
"Louise Nevelson",
"Shirin Neshat",
"Sol LeWitt",
"Anne Aarsland",
"Marilyn Minter",
"Francis Bacon",
"Sam Francis",
"George Condo",
"Yue Minjun",
"Max Ernst",
"Marcel Delmotte",
"Anish Kapoor",
"Elizabeth Catlett",
"Jean Paul Riopelle",
"Mel Bochner",
"Edward Hopper",
"Günther Förg",
"George Grosz",
"Yang Yongliang",
"Mel Ramos",
"Neo Rauch",
"Paul Klee",
"Retna",
"Imi Knoebel",
"Jasper Johns",
"James Milton Sessions",
"Roberto Matta",
"Paul Jenkins",
"Arman",
"Hans Hartung",
"Lyonel Feininger",
"Joseph Beuys",
"LeRoy Neiman",
"André Lhote",
"Irving Penn",
"Gustav Klimt",
"Donald Baechler",
"Franz Gertsch",
"Marc Quinn",
"Manolo Valdés",
"Ranulph Bye",
"Zhang Daqian",
"Camille Pissarro",
"Pissarro",
"Wade Guyton",
"Peter Beard",
"Carlo Mense",
"Alex Prager",
"Erwin Wurm",
"Os Gêmeos",
"Janet Fish",
"Heinz Mack",
"Norbert Bisky",
"Richard Avedon",
"José Bedia",
"Richard Hamilton",
"Bill Henson",
"Louis Icart",
"Louise Bourgeois",
"Pat Steir",
"Mark Tobey",
"Francisco Zúñiga",
"Max Liebermann",
"James Rosenquist",
"Georges Braque",
"Jean Prouvé",
"Lucien Clergue",
"Anna Gasteiger",
"Antonio Bueno",
"Barbara Kruger",
"Brice Marden",
"Patrick Caulfield",
"JonOne",
"Kiki Smith",
"Zhang Dali",
"Richter",
"Robert Cottingham",
"Frank Bauer",
"Beatriz Milhazes",
"Joseph Piccillo",
"Pedro Pablo Oliva",
"Albert Oehlen",
"Alberto Giacometti",
"Giacometti",
"Richard Tuttle",
"Julie Mehretu",
"Ellen von Unwerth",
"Max Pechstein",
"Rainer Fetting",
"Henri Lebasque",
"Matisse",
"A. Keller",
"André Masson",
"Aya Takano",
"Robert Combas",
"Hannah Höch",
"James Nares",
"Paul McCarthy",
"Kehinde Wiley",
"Lee Ufan",
"Pierre et Gilles",
"Jamali",
"Jack Pierson",
"Jason Martin",
"Nils Kreuger",
"Carl Andre",
"Wifredo Lam",
"Fritz Scholder",
"Anthony Caro",
"Franz West",
"Barbara Hepworth",
"Barry McGee",
"Armando Reverón",
"David Hammons",
"Elisabeth Schima",
"Eugène Atget",
"Yoko Ono",
"Martin Sharp",
"Barry Flanagan",
"Brassaï",
"Alexander Roslin",
"Pierre Bonnard",
"Ralph Gibson",
"Louis Valtat",
"Vija Celmins",
"Hunt Slonem",
"Jenny Holzer",
"CRASH",
"Albert Lang",
"Adam Neate",
"Ugo Rondinone",
"Willy Daro",
"Rebecca Morris",
"Sam Gilliam",
"Norbert Prangenberg",
"Ushio Shinohara",
"Callum Innes",
"Hernan Bas",
"Gillian Ayres",
"Hyo Myoung Kim",
"Faile",
"Balthus",
"Cleve Gray",
"Elvira Bach",
"Kcho",
"Joseph Henry Sharp",
"Dieter Roth",
"Jing Kewen",
"Howard Hodgkin",
"Walker Evans",
"Wim Delvoye",
"Omar Ronda",
"On Kawara",
"Red Grooms",
"Ori Gersht",
"Jaume Plensa",
"Willi Baumeister",
"Irving Amen",
"Henry Scott",
"Kenneth Noland",
"Mark Francis",
"Theodor Ott",
"Yoichi Ohira",
"Ken Price",
"Jean Pougny",
"Lars Thorsen",
"Catherine Lee",
"Claudia Hart",
"Gabriele Münter",
"Vibeke Tandberg",
"Victor Man",
"Jef Aerosol",
"Gio Ponti",
"Peter Funch",
"Speedy Graphito",
"Wang Yachen",
"Todd James",
"Christian Soclet",
"TAKI 183",
"Sophie Calle",
"Hermann Kaulbach",
"Kiki Kogelnik",
"Gaetano Pesce",
"Comte",
"Le Corbusier",
"Henri Rousseau",
"Peter Weber",
"Miklos Gaál",
"Martha Walter",
"Konrad Klapheck",
"Eyvind Earle",
"Francesco Vecellio",
"Ernst Wilhelm Nay",
"Edward Bawden",
"Xu Bing",
"Max Ackermann",
"Lionel Smit",
"Josef von Brandt",
"Lia Cook",
"Fritz Köthe",
"Joe Goode",
"César",
"Frida Kahlo",
"John Tweddle",
"Robert Barry",
"Ruth Duckworth"
	
	];
	
	var currTime = new Date().getTime();
	if(window.searchClickTime!=undefined && currTime - window.searchClickTime < 7000)
        return;
	window.searchClickTime = currTime;
	searchstring = dojo.byId("searchbox2").value;
	if (searchstring == "") return;
	dijit.registry.byId('IVGettySearchBox').hide();
	var artlist2=artlist.join('~').toLowerCase();
	var artlist3=artlist2.split('~');
	if (artlist3.indexOf(searchstring.toLowerCase())>0)
	{
		var mess="Artworks by "+searchstring+" are under copyright.";
		dojo.byId("copyrightartist").innerHTML=mess;
		dijit.registry.byId('Copyright').show();
		dojo.byId("searchbox2").value="";
		return;
		console.log("artist: "+searchstring+" is under copyright");
	}
	
	var url= "http://gentle-crag-2965.herokuapp.com/joint/search?"  + "email=" + window.email+"&keyword="+searchstring+"&token="+window.token;
	v=0;
	var timer = setInterval(function()
	{
	
	progressBar2.set("value",v);
	progressBar2.set("label",v+"%");
	if (v>=100){clearTimeout(timer);}
	v+=10;
	},450);
//	alert("search called:"+url);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
		timeout: 20000,
		trytimes: 5,
		error: function(error){
			console.log("timeout!search"+url);
			this.trytimes --;
			if(this.trytimes>0){
				dojo.io.script.get(this);
			} else{
				alert("Network problem31. Please check your connection and restart the app.");
			}
			
		},
        load: function (result) {
            if (result["Status"] == "success") {
			    if (result["listIds"].length>0)
				{
					var numimages=result["listIds"][0]["imageNum"]+result["listIds"][1]["imageNum"];
                 usermessage(numimages+' images found and saved in "My Searches"');
				window.currCat="My Viewlists";
				dijit.registry.byId('SearchBox').hide();
				dijit.registry.byId('IVGettySearchBox').hide();
				$("#searchGrid").css("top","0px");	
				progressBar2.set("value",100);
				progressBar2.set("label","Complete");
				clearTimeout(timer);
				window.currList=result["listIds"][0]["id"];
				window.currCat="My Viewlists";
				window.currViewList="Last Search";
				window.currGridList=-1;
				dojo.empty(searchGrid);
				window.moregridpages = true;
			//	gotoView("SearchView","blankview");
			//	swapview(result["listIds"][0]);
				//gotoView("blankview","ImageView");
				//console.log("searchgrid-"+Searchgrid);
				
				var newdiv=dojo.create("div",{},searchGrid);
				
				/*dojo.create("img",{
				src:"images/Photos_logo200x62.png",
				className: "logoclass",
				width: "100px",
				height: "32px"		
				},newdiv);
				var numresults="<p>"+result["listIds"][0]["imageNum"]+' images found</p>';
				dojo.create("div",{
					innerHTML: numresults,
					className:"logoclass"
					},newdiv);*/
				if (result["listIds"][0]["imageNum"]>0)
				{
					loadGrid(0,searchGrid,result["listIds"][0]["id"]);
				}
		/*		else // no images from photos.com 
					$("#searchGrid2").css("height","500px")
				window.currList=result["listIds"][1]["id"];
				window.currGridList=-1;
				window.moregridpages = true;
				
					var newdiv2=dojo.create("div",{},searchGrid2);
					dojo.create("img",{
					src:"images/ARTKICKlogoFULLCOLORdarkbackgrounds_200.png",
					className: "logoclass",
					width: "100px",
					height:"32px"
					
					},newdiv2);
				var numresults="<p>"+result["listIds"][1]["imageNum"]+' images found</p>';
				dojo.create("div",{
					innerHTML: numresults,
					className:"logoclass"
					
					},newdiv2);*/
				if (result["listIds"][1]["imageNum"]>0)
				{
					console.log ("loading:"+result["listIds"][1]["id"]);
					window.currList=result["listIds"][1]["id"];
					loadGrid(0,searchGrid,result["listIds"][1]["id"]);
					dojo.byId("searchbox2").value="";
				}
				
				}

            } else {
				progressBar2.set("value",100);
				progressBar2.set("label","Complete");
				clearTimeout(timer);
                myalert(result["Message"]);
				dojo.byId("searchbox2").value="";
            }

        }
		
    });


}

function showsearch()
{
	if (window.guest)
	{
	guestmessage();
	window.guestmenu=true;
	return;
	}
	hidemenu();
	dojo.empty(searchGrid);
	//dojo.empty(searchGrid2);
					
	dojo.byId("searchbox2").value="";
	dojo.byId("gettysearchbox").value='';
	progressBar1.set("value",0);
	progressBar1.set("label","0%");
	progressBar2.set("value",0);
	progressBar2.set("label","0%");
	gotoView(window.currentView,"SearchView");
	dijit.registry.byId('SearchBox').show(); 
	dijit.registry.byId('IVGettySearchBox').show(); 
	window.searchboxshow=true;
}

function clearsearch()
{
	dojo.byId("searchbox2").value="";
}