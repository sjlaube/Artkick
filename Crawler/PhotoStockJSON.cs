using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace Photostock
{
    public enum ExtractType { extractWikimedia, extractFlickr };
    public enum CrawlType { crawlNotApplicable, crawlBirdsOfAmerica, crawlTutankamun, crawlUSPresidents, crawlShanghaiMuseum, crawlStainedGlass, crawlTiffanyStainedGlass, crawlPlateGlassNegative };


    public class PhotoStockJSONURL
    {
        public int pixelWidth;
        public int pixelHeight;
        public string location;
    }

    public class PhotoStockCategory
    {
        static private PhotoStockCategory[] predefinedCategories = PhotoStockCategory.Predefined("Museums", "Metropolitan Museum of Art", "Metropolitan_Museum_of_Art",
                                                                                                 "Museums", "Rijksmuseum Amsterdam", "Rijksmuseum_Amsterdam",
                                                                                                 "Museums", "National Portrait Gallery, United States", "Category:Paintings_in_the_National_Portrait_Gallery_(United_States)");
        public string category1;
        public string cat1Viewlist;
        public string alias;
        static private PhotoStockCategory[] Predefined(params string[] parms) 
        { 
            List<PhotoStockCategory> categories = new List<PhotoStockCategory>();
            for (int i = 0; i < parms.Length; i += 3)
            {
                PhotoStockCategory category = new PhotoStockCategory();
                category.category1 = parms[i];
                category.cat1Viewlist = parms[i + 1];
                category.alias = parms[i + 2];
                categories.Add(category);
            }
            return categories.ToArray();
        }
        static public bool FindPredefined(string alias1, string alias2, ref string category1, ref string cat1Viewlist)
        {
            foreach(PhotoStockCategory category in predefinedCategories)
                if (category.alias == alias1 || category.alias == alias2 )
                {
                    category1 = category.category1;
                    cat1Viewlist = category.cat1Viewlist;
                    return true;
                }
            return false;
        }
    }

    public class PhotoStockJSON
    {
        static public string artKickFilename = "/Artkick {0} Images.json";

        public string title = string.Empty;
        public string source;
        public string link;
        public int year;
        public string credit;
        public string artistLastName;
        public string artistFirstName;
        public string artistInfo;
        public string moreInfoLink;
        public string genre;
        public string genreLink;
        public int birthdate;
        public int died;
        public string type;
        public string typeDetail;
        public double aspectRatio;
        public double widthCm;
        public double heightCm;
        public List<PhotoStockJSONURL> urls = new List<PhotoStockJSONURL>();
        public string location;
        public string category1 = string.Empty;
        public string cat1Viewlist = string.Empty;
        public string category2;
        public string cat2Viewlist;
        public string category3;
        public string cat3Viewlist;
        public string category4;
        public string cat4Viewlist;
        public string category5;
        public string cat5Viewlist;
        public string copyright;
        public string copyrightDetail;

        public PhotoStockJSON() { }
        public PhotoStockJSON(string source, string url)
        {
            this.source = source;
            this.link = url;
        }

        public virtual bool Extract(string topFolder, string category1, string cat1Viewlist, HTMLDocument document, CrawlType crawlType) { throw new ApplicationException(); return false; }

        public PhotoStockJSONURL FindURL(int pixelWidth, int pixelHeight)
        {
            foreach(PhotoStockJSONURL url in this.urls)
                if ( url.pixelWidth == pixelWidth && url.pixelHeight == pixelHeight)
                    return url;
            return null;
        }

        public static string GetFilename(string category1)
        {
            return Folder.Temp + string.Format(artKickFilename, category1);
        }

        public static bool ReadFile(string filename, out List<PhotoStockJSON> jsons)
        {
            jsons = new List<PhotoStockJSON>();

            JSONHelper helper = new JSONHelper();
            helper.ReadFile(filename);

            JSONHelper.NextReadType type;
            string key, value;
            helper.ReadNext(out type, out key, out value);
            if (type != JSONHelper.NextReadType.beginGroup)
                return false;
            while (true)
            {
                PhotoStockJSON json = new PhotoStockJSON();
                while (true)
                {
                    helper.ReadNext(out type, out key, out value);
                    if (type == JSONHelper.NextReadType.endLevel)
                        break;
                    if (type == JSONHelper.NextReadType.groupTitle && key == "URLs")
                    {
                        json.urls = new List<PhotoStockJSONURL>();
                        while (true)
                        {
                            PhotoStockJSONURL url = new PhotoStockJSONURL();
                            helper.ReadNext(out type, out key, out value);
                            if (type == JSONHelper.NextReadType.endGroup)
                                break;
                            while (true)
                            {
                                helper.ReadNext(out type, out key, out value);
                                if (type == JSONHelper.NextReadType.endLevel)
                                    break;
                                if (type == JSONHelper.NextReadType.beginLevel)
                                    continue;
                                if (type == JSONHelper.NextReadType.endGroup)
                                    break;
                                if (type == JSONHelper.NextReadType.keyValue)
                                {
                                    if (key == "Pixel Width")
                                        int.TryParse(value, out url.pixelWidth);
                                    else if (key == "Pixel Height")
                                        int.TryParse(value, out url.pixelHeight);
                                    else if (key == "Location")
                                        url.location = value;
                                    else
                                        throw new Exception();
                                }
                            }
                            if (type == JSONHelper.NextReadType.endGroup)
                                break;
                            json.urls.Add(url);
                        }
                    }
                    if (type == JSONHelper.NextReadType.beginLevel)
                        continue;
                    if (type == JSONHelper.NextReadType.keyValue)
                    {
                        if (key == "Title")
                            json.title = value;
                        else if (key == "Source")
                            json.source = value;
                        else if (key == "Source Page Link")
                            json.link = value;
                        else if (key == "Year")
                            int.TryParse(value, out json.year);
                        else if (key == "Credit")
                            json.credit = value;
                        else if (key == "Artist Last N")
                            json.artistLastName = value;
                        else if (key == "Artist First N")
                            json.artistFirstName = value;
                        else if (key == "Artist Info")
                            json.artistInfo = value;
                        else if (key == "More Info Link")
                            json.moreInfoLink = value;
                        else if (key == "Genre")
                            json.genre = value;
                        else if (key == "Genre Link")
                            json.genreLink = value;
                        else if (key == "Birthdate")
                            int.TryParse(value, out json.birthdate);
                        else if (key == "Died")
                            int.TryParse(value, out json.died);
                        else if (key == "Type")
                            json.type = value;
                        else if (key == "Type Detail")
                            json.typeDetail = value;
                        else if (key == "Aspect Ratio")
                            double.TryParse(value, out json.aspectRatio);
                        else if (key == "Width cm")
                            double.TryParse(value, out json.widthCm);
                        else if (key == "Height cm")
                            double.TryParse(value, out json.heightCm);
                        else if (key == "Location")
                            json.location = value;
                        else if (key == "Category1")
                            json.category1 = value;
                        else if (key == "Cat1Viewlist")
                            json.cat1Viewlist = value;
                        else if (key == "Category2")
                            json.category2 = value;
                        else if (key == "Cat2Viewlist")
                            json.cat2Viewlist = value;
                        else if (key == "Category3")
                            json.category3 = value;
                        else if (key == "Cat3Viewlist")
                            json.cat3Viewlist = value;
                        else if (key == "Category4")
                            json.category4 = value;
                        else if (key == "Cat4Viewlist")
                            json.cat4Viewlist = value;
                        else if (key == "Category5")
                            json.category5 = value;
                        else if (key == "Cat5Viewlist")
                            json.cat5Viewlist = value;
                        else if (key == "Copyright")
                            json.copyright = value;
                        else if (key == "Copyright Detail")
                            json.copyrightDetail = value;
                        else
                            throw new Exception();
                    }
                }
                jsons.Add(json);
                helper.ReadNext(out type, out key, out value);
                if (type == JSONHelper.NextReadType.endGroup)
                    break;
            }
            return true;
        }

        public static void WriteFile(string filename, List<PhotoStockJSON> jsons)
        {
            JSONHelper helper = new JSONHelper();
            helper.BeginGroup();
            for (int i = 0; i < jsons.Count; i++)
            {
                PhotoStockJSON json = jsons[i];
                json.Write(helper, i == jsons.Count - 1 ? false : true);
            }
            helper.EndGroup(false);
            if (File.Exists(filename))
                File.Delete(filename);
            helper.WriteFile(filename);
        }

        public void Write(JSONHelper helper, bool more)
        {
            helper.BeginLevel();
            helper.WriteLine("Title", this.title);
            helper.WriteLine("Source", this.source);
            helper.WriteLine("Source Page Link", this.link);
            helper.WriteLine("Year", this.year);
            helper.WriteLine("Credit", this.credit);
            helper.WriteLine("Artist Last N", this.artistLastName);
            helper.WriteLine("Artist First N", this.artistFirstName);
            helper.WriteLine("Artist Info", this.artistInfo);
            // DEBUG: IMPORTANT, blank out more info link because it does not work :)
            helper.WriteLine("More Info Link", string.Empty);
            //helper.WriteLine("More Info Link", this.moreInfoLink);
            helper.WriteLine("Genre", this.genre);
            helper.WriteLine("Genre Link", this.genreLink);
            helper.WriteLine("Birthdate", this.birthdate);
            helper.WriteLine("Died", this.died);
            helper.WriteLine("Type", this.type);
            helper.WriteLine("Type Detail", this.typeDetail);
            helper.WriteLine("Aspect Ratio", this.aspectRatio, "f2");
            helper.WriteLine("Width cm", this.widthCm, "f0");
            helper.WriteLine("Height cm", this.heightCm, "f0");
            helper.BeginGroup("URLs");
            for (int i = 0; i < this.urls.Count; i++)
            {
                PhotoStockJSONURL url = this.urls[i];
                helper.BeginLevel();
                helper.WriteLine("Pixel Width", url.pixelWidth);
                helper.WriteLine("Pixel Height", url.pixelHeight);
                helper.WriteLine("Location", url.location, false);
                helper.EndLevel(i == this.urls.Count - 1 ? false : true);
            }
            helper.EndGroup(true);
            helper.WriteLine("Location", this.location);
            helper.WriteLine("Category1", this.category1);
            helper.WriteLine("Cat1Viewlist", this.cat1Viewlist);
            if (!string.IsNullOrEmpty(this.category2))
            {
                helper.WriteLine("Category2", this.category2);
                helper.WriteLine("Cat2Viewlist", this.cat2Viewlist);
            }
            if (!string.IsNullOrEmpty(this.category3))
            {
                helper.WriteLine("Category3", this.category3);
                helper.WriteLine("Cat3Viewlist", this.cat3Viewlist);
            }
            if (!string.IsNullOrEmpty(this.category4))
            {
                helper.WriteLine("Category4", this.category4);
                helper.WriteLine("Cat4Viewlist", this.cat4Viewlist);
            }
            if (!string.IsNullOrEmpty(this.category5))
            {
                helper.WriteLine("Category5", this.category5);
                helper.WriteLine("Cat5Viewlist", this.cat5Viewlist);
            }
            helper.WriteLine("Copyright", this.copyright);
            helper.WriteLine("Copyright Detail", this.copyrightDetail, false);
            helper.EndLevel(more);
        }

        public static void ExtractCategory(string url, out string category1, out string cat1Viewlist)
        {
            category1 = cat1Viewlist = string.Empty;
            string[] temps = url.Split('/');
            for (int i = temps.Length - 1; i >= 0; i--)
            {
                string temp = temps[i];
                if (temp.IndexOf("Commons:Featured_pictures") >= 0)
                    break;
                if (temp.IndexOf("Category:") >= 0)
                    break;
                if (temp == "wiki")
                    break;
                cat1Viewlist = category1;
                category1 = temp;
            }
            if (cat1Viewlist == string.Empty)
                cat1Viewlist = category1;
            PhotoStockCategory.FindPredefined(category1, cat1Viewlist, ref category1, ref cat1Viewlist);
        }

        public static void ExtractArtistName(string temp, out string artistFirstName, out string artistLastName, ref int birthYear, ref int deathYear)
        {
            artistFirstName = string.Empty;
            artistLastName = string.Empty;
            string middleName = string.Empty;
            string[] temps = temp.Split(' ');
            int lastNameIndex = 0;
            for (int i = temps.Length - 1; i >= 0; i--)
            {
                if ((i - 1) < 0)
                    break;
                string t = temps[i];
                if (!Utility.IsNumber(t))
                {
                    artistLastName = t;
                    lastNameIndex = i;
                    break;
                }
                else
                {
                    if (t[0] == '(')
                        t = t.Substring(1);
                    if (t[t.Length - 1] == ')')
                        t = t.Substring(0, t.Length - 1);
                    string[] ts = t.Split('-');
                    int n;
                    if (int.TryParse(ts[0], out n))
                        birthYear = n;
                    if (int.TryParse(ts[ts.Length - 1], out n))
                        deathYear = n;
                }
            }
            if (temps.Length > 1)
                artistFirstName = temps[0];
            for (int i=1;i<lastNameIndex;i++)
            {
                if (!string.IsNullOrEmpty(middleName))
                    middleName += " ";
                middleName += temps[i];
            }
            if (!string.IsNullOrEmpty(artistFirstName) && artistFirstName[artistFirstName.Length - 1] == ',')
            {
                string t = Utility.Trim(artistFirstName, ',');
                artistFirstName = middleName + ' ' + artistLastName;
                artistLastName = t;
            }
            else
                artistFirstName = artistFirstName + ' ' + middleName;
            artistFirstName = Utility.Trim(artistFirstName, ',');
            artistFirstName = Utility.Trim(artistFirstName, ')');

        }

        public bool ExtractArtInfo(string url, List<string> titles, string page)
        {
            string text = WebHelper.GetWebText(url);
            if (text == null)
            {
                Trace.WriteLine("Failed to download airtist info: {0} ...", url);
                return false;
            }
            HTMLDocument document = new HTMLDocument(url);
            document.Parse(text);
            //document.Debug();

            // Find genres and genre links
            HTMLNode node = document.SearchNodeWithLikeTagValue("Movement");
            if (node == null)
                return false;
            node = node.NextSibling();
            if (node == null)
                return false;
            int i = 0;
            foreach (HTMLNode child in node.childs)
            {
                if (child.keyvalues.ContainsKey("href"))
                {
                    string genre = child.tagValue;
                    string link = child.keyvalues["href"];
                    if (link.IndexOf("/wiki") == 0)
                        link = document.topUrl + link;
                    if (i == 0)
                    {
                        this.genre = genre;
                        this.genreLink = link;
                        this.category3 = "Genre";
                        this.cat3Viewlist = genre;
                    }
                    else if (i == 1)
                    {
                        this.category4 = "Genre";
                        this.cat4Viewlist = genre;
                    }
                    else if (i == 2)
                    {
                        this.category5 = "Genre";
                        this.cat5Viewlist = genre;
                    }
                    i++;
                }
            }
            // Find more info link
            //document.DebugTagValues();
            List<HTMLNode> nodes = new List<HTMLNode>();
            // Remove all the quotes in titles.
            List<string> newtitles = new List<string>();
            foreach (string t in titles)
                newtitles.Add(Utility.Trim(t, '"'));
            document.SearchAllNodesWithLikeTagValueAndKey(newtitles, "href", ref nodes);
            foreach (HTMLNode n in nodes)
            {
                string moreinfo = n.keyvalues["href"];
                if (moreinfo.IndexOf("/wiki") == 0)
                    moreinfo = document.topUrl + moreinfo;
                if (moreinfo != page)
                {
                    this.moreInfoLink = moreinfo;
                    break;
                }
            }

            return true;
        }

    }
}
