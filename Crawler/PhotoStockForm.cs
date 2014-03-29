using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace Photostock
{
    public partial class PhotoStockForm : Form
    {
        static int saveJsonCount = 1000;
        static int maxCrawlLevel = 5;
        static private string topWikimediaFeaturedPictures = "http://commons.wikimedia.org/wiki/Commons:Featured_pictures";
        static private string topWikimediaWiki = "http://commons.wikimedia.org/wiki";
        static private string topWikiMediaFolder = "http://commons.wikimedia.org";
        static private string topFlickrFolder = "http://www.flickr.com";

        public Dictionary<string, string> crawls = new Dictionary<string, string>();
        public Dictionary<string,PhotoStockJSON> jsons = new Dictionary<string,PhotoStockJSON>();
        public Dictionary<string,List<string>> cats = new Dictionary<string,List<string>>();

        public PhotoStockForm()
        {
            InitializeComponent();
            // this.categories.Text = "Animals/Mammals Astronomy Food_and_drink Historical Natural_phenomena People Places/Natural Sports Animated";
            this.categories.Text = "Category:Paintings_in_the_National_Portrait_Gallery_(United_States) Metropolitan_Museum_of_Art Rijksmuseum_Amsterdam/Collection/Paintings Rembrandt/Paintings Henri_Rousseau Édouard_Manet";
            this.extract.Text = "http://commons.wikimedia.org/wiki/File:Edouard_Manet_010.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Claude_Monet_-_White_Frost,_Sunrise.JPG" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Fabritius_-_van_der_Helm.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Henri_Rousseau_004.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Rembrandt_Harmensz._van_Rijn_140.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Antonio_Pollaiuolo_005.jpg" + "\n" + 
                                "http://commons.wikimedia.org/wiki/File:Emanuel_Murant_-_vervallen_boerderij.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Duccio_madonna_stroganoff_metropolitan.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Blind_man_carrying_a_paralysed_man.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Monkey_eating.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Mercury,_Venus_and_the_Moon_Align.jpg" + "\n" +
                                "http://commons.wikimedia.org/wiki/File:Erdm%C3%A4nnchen,_Suricata_suricatta_1.JPG";
            this.htmlExample.Text = "<meta name=\"generator\" content=\"MediaWiki 1.22wmf12\" />";

            this.checkWikimedia.Checked = true;
        }

        private void CrawlFromWikiMedia(string url, bool extractCategory, int crawlMoreLevel, CrawlType crawlType, params string[] hrefLikes)
        {
            if (crawlMoreLevel > maxCrawlLevel)
                return;

            string text = WebHelper.GetWebText(url);
            if (text == null)
                return;
            HTMLDocument document = new HTMLDocument(url);
            document.Parse(text);

            List<HTMLNode> nodes = new List<HTMLNode>();
            document.SearchAllNodesWithValueLike("href", ref nodes, hrefLikes);
            foreach (HTMLNode node in nodes)
            {
                string url2 = node.keyvalues["href"];
                if (url2.IndexOf("chronological") >= 0)
                    continue;
                if (url2.IndexOf("http") < 0)
                    url2 = topWikiMediaFolder + url2;
                if (!this.ExtractFromWikiMediaCrawl(url2, extractCategory, crawlMoreLevel, crawlType))
                    continue;
                // Recursively
                if (crawlMoreLevel > 0)
                    this.CrawlFromWikiMedia(url2, extractCategory, (crawlMoreLevel+1), crawlType, hrefLikes);
            }
        }

        private void CrawlFromFlickr(string url, params string[] hrefLikes)
        {
            Trace.WriteLine("Crawling {0} ...", url);

            string text = WebHelper.GetWebText(url);
            if (text == null)
                return;
            HTMLDocument document = new HTMLDocument(url);
            document.Parse(text);

            List<HTMLNode> nodes = new List<HTMLNode>();
            document.SearchAllNodesWithValueLike("data-track", ref nodes, "photo-click");
            foreach (HTMLNode node in nodes)
            {
                string url2 = node.keyvalues["href"];
                if (url2 == "{{photo_url}}")
                    continue;
                url2 = topFlickrFolder + url2;
                this.ExtractFromURL(ExtractType.extractFlickr, "", "", url2, CrawlType.crawlNotApplicable);
            }
        }

        private void ExtractFromURL(ExtractType type, string category1, string cat1Viewlist, string url, CrawlType crawlType)
        {
            if (this.jsons.Count % saveJsonCount == 0)
                this.OnWriteJSON(null, null);

            if (this.jsons.ContainsKey(url))
                return;
            Trace.WriteLine("Extracting {0} ...", url);
            string text = WebHelper.GetWebText(url);
            if (text == null)
            {
                Trace.WriteLine("Cannot download {0} ...", url);
                return;
            }
            //string[] texts = text.Split('\n');
            //foreach(string temp in texts)
            //    Trace.WriteLine(temp);
            HTMLDocument document = new HTMLDocument(url);
            document.Parse(text);
            // document.Debug();

            PhotoStockJSON json = null;
            if (type == ExtractType.extractWikimedia)
            {
                json = new WikiMediaJSON("Wikimedia Commons", url);
                json.Extract(topWikiMediaFolder, category1, cat1Viewlist, document, crawlType);
                if (crawlType == CrawlType.crawlBirdsOfAmerica)
                {
                    json.typeDetail = "Engraving";
                    json.moreInfoLink = "http://en.wikipedia.org/wiki/John_James_Audubon#Birds_of_America";
                    json.artistInfo = "http://en.wikipedia.org/wiki/John_James_Audubon";
                    if (string.IsNullOrEmpty(json.cat2Viewlist))
                    {
                        json.category2 = "Artist";
                        json.cat2Viewlist = "John James Audubon";
                    }
                    if (string.IsNullOrEmpty(json.cat3Viewlist))
                    {
                        json.category3 = "Illustrations";
                        json.cat3Viewlist = "Audubon's Birds of America";
                    }
                    if (string.IsNullOrEmpty(json.cat4Viewlist))
                    {
                        json.category4 = "Collections";
                        json.cat4Viewlist = "Birds of America";
                    }
                }
                else if (crawlType == CrawlType.crawlTutankamun)
                {
                    if (string.IsNullOrEmpty(json.cat2Viewlist))
                    {
                        json.category2 = "Collections";
                        json.cat2Viewlist = "Treasure of Tutankhamun";
                    }
                }
                else if (crawlType == CrawlType.crawlUSPresidents)
                {
                    json.category1 = "Historical";
                    json.cat1Viewlist = "Presidents of the United States";
                    json.category2 = "Collections";
                    json.cat2Viewlist = "Portraits of US Presidents";
                }
                else if (crawlType == CrawlType.crawlShanghaiMuseum)
                {
                    json.category1 = "Museums";
                    json.cat1Viewlist = "Shanghai Museum";
                    json.category2 = "Collections";
                    json.cat2Viewlist = "Asian";
                }
                else if (crawlType == CrawlType.crawlStainedGlass)
                {
                    json.type = "Glass";
                    json.typeDetail = "Stained Glass";
                    json.category1 = "Sculptures";
                    json.cat1Viewlist = "Stained Glass";
                    json.category3 = "Architecture";
                    json.cat3Viewlist = "Stained Glass";
                }
                else if (crawlType == CrawlType.crawlTiffanyStainedGlass)
                {
                    json.artistFirstName = "Louis Comfort";
                    json.artistLastName = "Tiffany";
                    json.birthdate = 1848;
                    json.died = 1933;
                    json.artistInfo = "http://en.wikipedia.org/wiki/Louis_Comfort_Tiffany";
                    json.type = "Glass";
                    json.typeDetail = "Stained Glass";
                    json.category1 = "Sculptures";
                    json.cat1Viewlist = "Stained Glass";
                    json.category2 = "Artists";
                    json.cat2Viewlist = "Louis Comfort Tiffany";
                    json.category3 = "Architecture";
                    json.cat3Viewlist = "Stained Glass";
                }
                else if (crawlType == CrawlType.crawlPlateGlassNegative)
                {
                    json.category1 = "Photography";
                    json.cat1Viewlist = "Plate Glass Negatives";
                    json.category3 = "Historical";
                    json.cat3Viewlist = "Old America";
                    json.type = "Photograph";
                    json.typeDetail = "Plate Glass Negative";
                }
            }
            else
            {
                json = new FlickrJSON("Flickr.com", url);
                json.Extract(topFlickrFolder, category1, cat1Viewlist, document, crawlType);
            }
            this.jsons.Add(url, json);
            // Finally we can category1 and cat1Viewlist to the crawling list
            if (!this.cats.ContainsKey(json.category1))
                this.cats.Add(json.category1, new List<string>());
            this.cats[json.category1].Add(json.cat1Viewlist);

            // Update the screen
            this.UpdateExtractCount();
        }

        private void UpdateExtractCount()
        {
            StringBuilder buf = new StringBuilder();
            buf.AppendFormat(" {0} images {1} categories:", this.jsons.Keys.Count, this.cats.Keys.Count);
            foreach (string cat in this.cats.Keys)
                buf.AppendFormat(" {0}({1})", cat, this.cats[cat].Count);
            this.count.Text = buf.ToString();
            this.count.Update();
        }

        private void OnWikiMediaCrawlFeaturedPictures(object sender, EventArgs e)
        {
            this.CrawlFromWikiMedia(topWikimediaFeaturedPictures, true, 1, CrawlType.crawlNotApplicable, "/wiki/Commons:Featured_pictures/");
        }

        private void OnWikiMediaCrawlMuseums(object sender, EventArgs e)
        {
            this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Collections_by_museum_by_country", false, 1, CrawlType.crawlNotApplicable, "/wiki/File:", "/wiki/Category:");

            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Digitised_plate_glass_negatives", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Journey_to_Sweden_on_Glass_Plate_Negatives", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=An+old+Navajo+brave+huddled+in+a+blanket%2C+ca.1901+%28CHS-3214%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Capitol+building+at+Nogales%2C+Mexico%2C+ca.1900+%28CHS-1522%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Close-up+of+the+spines+of+a+cactus+opuntia+echunocuipa+prolifera%2C+ca.1920+%28CHS-4210%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Drawing+of+Felipe+on+his+horse+at+Camulos+ranch%2C+ca.1900+%28CHS-1242%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Exterior+view+of+the+San+Bernardino+County+Jail+building+%28built+in+1904%29%2C+ca.1910+%28CHS-5242%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=General+view+of+Mission+San+Carlos+del+Carmelo%2C+from+the+northeast%2C+ca.1903+%28CHS-2237%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Hopi+Indian+boy+and+his+burro+hauling+wood%2C+Arizona%2C+ca.1898+%28CHS-4570%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Interior+of+the+Cathedral%2C+Mexico+City%2C+Mexico%2C+ca.1905-1910+%28CHS-654%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Low+oblique+view+from+above+the+Hopi+village+of+Oraibi%2C+showing+terraced+houses%2C+Arizona%2C+1898+%28CHS-4591%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Naked+Hopi+Indian+boy+with+bow+and+arrow%2C+1903+%28CHS-3350%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Palm+trees+and+large+homes+on+Chester+Place+in+Los+Angeles%2C+1905+%28CHS-1398%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Pierced+bell+tower+in+the+brick+fachada+of+Mission+San+Antonio+de+Padua%2C+California%2C+ca.1906+%28CHS-4371%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Redlands%2C+views+from+Smiley+Heights%2C+ca.1908+%28CHS-1375%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Six+unidentified+Indian+woven+items+on+display%2C+ca.1900+%28CHS-3952%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=The+Colorado+River+in+the+Grand+Canyon+from+Bright+Angel+Plateau+looking+east+%28CHS-1096%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Two+unidentified+Indian+baskets+on+display%2C+ca.1900+%28CHS-3958%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=View+of+the+exterior+of+the+California+Hospital+looking+south+on+Hope+Street+and+Fifteenth+Street%2C+ca.1910+%28CHS-2446%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Digitised_plate_glass_negatives&filefrom=Yuma+Indian+dwellings+near+the+Colorado+River+on+the+Yuma+Indian+reservation%2C+ca.1900+%28CHS-3540%29.jpg#mw-category-media", false, 0, CrawlType.crawlPlateGlassNegative, "/wiki/File:");

            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Bronze_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Calligraphy_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Ceramics_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Coins_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Furniture_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Jades_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Minority_nationalities_art_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Paintings_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Sculptures_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Seals_in_the_Shanghai_Museum", false, false, CrawlType.crawlShanghaiMuseum, "/wiki/File:");

            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Tiffany_stained_glass_windows", false, false, CrawlType.crawlTiffanyStainedGlass, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Stained_glass_in_the_Cincinnati_Art_Museum", false, false, CrawlType.crawlStainedGlass, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:First_Presbyterian_Church_(Brooklyn)", false, false, CrawlType.crawlStainedGlass, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Stained_glass_windows", false, false, CrawlType.crawlStainedGlass, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Stained_glass", false, false, CrawlType.crawlStainedGlass, "/wiki/File:");

            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/President_of_the_United_States", false, false, CrawlType.crawlUSPresidents, "/wiki/File:");

            //this.CrawlFromWikiMedia("http://commons.m.wikimedia.org/wiki/Category:Treasure_of_Tutankhamun", false, false, CrawlType.crawlTutankamun, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.m.wikimedia.org/wiki/Category:Treasure_of_Tutankhamun_-_replicas", false, false, CrawlType.crawlTutankamun, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.m.wikimedia.org/wiki/Category:Funerary_mask_of_Tutankhamun", false, false, CrawlType.crawlTutankamun, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.m.wikimedia.org/wiki/Category:Funerary_mask_of_Tutankhamun_-_replicas", false, false, CrawlType.crawlTutankamun, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.m.wikimedia.org/wiki/Category:Sarcophagi_of_Tutankhamun", false, false, CrawlType.crawlTutankamun, "/wiki/File:");

            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Birds_of_America", false, false, true, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:The_Birds_of_America&filefrom=179+Wood+Wren.jpg#mw-category-media", false, false, true, "/wiki/File:");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:The_Birds_of_America&filefrom=370+American+Water+Ouzel.jpg#mw-category-media",  false, false, true, "/wiki/File:");
        
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Paintings_by_painter_by_museum", "/wiki/Category:", "Paintings");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Paintings_by_painter_by_museum&subcatfrom=Monaco%2CLorenzo%0APaintings+by+Lorenzo+Monaco+in+the+Rijksmuseum+Amsterdam#mw-subcategories", "/wiki/Category:", "Paintings");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/w/index.php?title=Category:Paintings_by_painter_by_museum&subcatfrom=Wijnants%2C+Jan%0APaintings+by+Jan+Wijnants+in+the+Rijksmuseum+Amsterdam#mw-subcategories", "/wiki/Category:", "Paintings");
            //this.CrawlFromWikiMedia("http://commons.wikimedia.org/wiki/Category:Paintings_in_the_United_States_by_museum", "/wiki/Category:", "Paintings");
        }

        private void OnWikiPediaCrawl(object sender, EventArgs e)
        {
            // Debug
            // this.CrawlFromWikiPedia("http://en.wikipedia.org/wiki/Main_Page", "http://en.wikipedia.org", "/en.wikipedia.json", "/wiki/", "File:", "Wikipedia:", "ikipedia_talk:", "Talk:", "Wikipedia_(disambiguation)");
        }

        private void OnWikiMediaCrawl(object sender, EventArgs e)
        {
            string temp = this.categories.Text;
            string[] categories = temp.Split(' ');
            foreach (string category in categories)
            {
                //string url = topWikimedia + '/' + category;
                string url = topWikimediaFeaturedPictures + '/' + category;
                if (!this.ExtractFromWikiMediaCrawl(url, false, 0, CrawlType.crawlNotApplicable))
                {
                    url = topWikimediaWiki + '/' + category;
                    this.ExtractFromWikiMediaCrawl(url, false, 0, CrawlType.crawlNotApplicable);
                }
            }
        }

        private void OnFlickrCrawl(object sender, EventArgs e)
        {
            for(int i=1;i<=28;i++)
                this.CrawlFromFlickr(string.Format("http://www.flickr.com/photos/smithsonian/Page{0}", i));
        }

        private void OnCrawl(object sender, EventArgs e)
        {
            ExtractType type = this.checkWikimedia.Checked ? ExtractType.extractWikimedia : ExtractType.extractFlickr;

            if (this.checkWikimedia.Checked)
                this.OnWikiMediaCrawl(sender, e);
            else if (this.checkFlickr.Checked)
                this.OnFlickrCrawl(sender, e);
        }


        private bool ExtractFromWikiMediaCrawl(string url, bool extractCategory, int crawlMoreLevel, CrawlType crawlType)
        {
            if (crawls.ContainsKey(url))
                return false;

            if (crawlMoreLevel > 0)
            {
                Trace.WriteLine("Crawling {0} ...", url);
                string text = WebHelper.GetWebText(url);
                if (text == null)
                    return false;

                // Check if category and cat1Viewlist already exist, if yes, don't crawl!
                string category1 = string.Empty, cat1ViewList = string.Empty;
                if (extractCategory)
                    PhotoStockJSON.ExtractCategory(url, out category1, out cat1ViewList);
                crawls.Add(url, url);

                while (text != null)
                {
                    int index = text.IndexOf("/wiki/File:");
                    if (index < 0)
                        break;
                    text = text.Substring(index);
                    int end = text.IndexOf('"');
                    if (end < 0)
                        break;
                    url = topWikiMediaFolder + text.Substring(0, end);
                    this.ExtractFromURL(ExtractType.extractWikimedia, category1, cat1ViewList, url, crawlType);
                    text = text.Substring(end);
                }
            }
            else
                this.ExtractFromURL(ExtractType.extractWikimedia, "", "", url, crawlType);
            return true;
        }

        private void OnExtract(object sender, EventArgs e)
        {
            ExtractType type = this.checkWikimedia.Checked ? ExtractType.extractWikimedia : ExtractType.extractFlickr;

            string[] urls = this.extract.Text.Split('\n');
            foreach(string url in urls)
                this.ExtractFromURL(type, "", "", url, CrawlType.crawlNotApplicable);
        }

        private void OnHTMLParse(object sender, EventArgs e)
        {
            int pos = 0;
            HTMLNode node = new HTMLNode();
            string text = this.htmlExample.Text;
            node.Parse(text, ref pos, text.Length - 1);
            node.Debug();
        }

        private void OnWriteJSON(object sender, EventArgs e)
        {
            try
            {
                // Separate jsons by category1
                Dictionary<string, List<PhotoStockJSON>> map = new Dictionary<string, List<PhotoStockJSON>>();
                foreach (PhotoStockJSON json in this.jsons.Values)
                {
                    string category1 = json.category1;
                    if (!map.ContainsKey(category1))
                        map.Add(category1, new List<PhotoStockJSON>());
                    map[category1].Add(json);
                }
                // Now write one category at a time
                foreach (string category1 in map.Keys)
                {
                    List<PhotoStockJSON> jsons = map[category1];
                    string category = Utility.RemoveChar(category1, ':', '"', '\\', '/');
                    string filename = PhotoStockJSON.GetFilename(category);
                    PhotoStockJSON.WriteFile(filename, jsons);
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Failed to write to JSON files");
            }
        }

        private void OnWikiMediaReCrawlAll(object sender, EventArgs e)
        {
            Dictionary<string, PhotoStockJSON> localJsons = this.jsons;
            this.jsons = new Dictionary<string, PhotoStockJSON>();
            //this.crawls = new Dictionary<string, string>();
            //this.cats = new Dictionary<string, List<string>>();
            foreach (string url in localJsons.Keys)
            {
                PhotoStockJSON json = localJsons[url];
                if (json.cat1Viewlist == "Inventory" || json.urls.Count == 0)
                    this.ExtractFromURL(ExtractType.extractWikimedia, json.category1, json.cat1Viewlist, url, CrawlType.crawlNotApplicable);
                else
                    this.jsons.Add(url, json);
            }
        }

        private void OnReadJSON(object sender, EventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog();
            dialog.Filter = "JSON file only|*.json";
            if (dialog.ShowDialog() != DialogResult.OK)
                return;
            string filename = dialog.FileName;
            List<PhotoStockJSON> jsons;
            if ( PhotoStockJSON.ReadFile(filename, out jsons) )
            {
                foreach(PhotoStockJSON json in jsons)
                {
                    string link = json.link;
                    string cat = json.category1;
                    if (!this.jsons.ContainsKey(link))
                    {
                        this.jsons.Add(link, json);
                        if (!this.cats.ContainsKey(cat))
                            this.cats.Add(cat, new List<string>());
                        this.cats[cat].Add(json.cat1Viewlist);
                    }
                    else
                    {
                        PhotoStockJSON json2 = this.jsons[link];
                        Trace.WriteLine("{0} : {1} vs {2}", link, json.cat1Viewlist, json2.cat1Viewlist);
                    }
                }
                this.UpdateExtractCount();
            }
        }
        private void OnTrimLog(object sender, EventArgs e)
        {
            Trace.TrimLog();
        }

        private void OnClearExtract(object sender, EventArgs e)
        {
            this.extract.Text = string.Empty;
        }
    }
}
