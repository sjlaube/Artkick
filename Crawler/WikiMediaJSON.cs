using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Photostock
{
    public class WikiMediaJSON : PhotoStockJSON
    {
        public WikiMediaJSON(string source, string url) : base(source, url) {}

        public override bool Extract(string topFolder, string category1, string cat1Viewlist, HTMLDocument document, CrawlType crawlType)
        {
            try
            {
                // Update category1
                this.category1 = category1;
                this.cat1Viewlist = cat1Viewlist;

                // Find title
                List<string> titles = new List<string>();
                HTMLNode node = document.SearchNode("id", "fileinfotpl_art_title");
                if (node != null)
                {
                    HTMLNode node2 = node.NextSibling();
                    if (node != null)
                    {
                        node = node2.SearchNode("lang", "en");
                        if (node == null)
                            node = node2.SearchNode("class", "fn");
                        if (node != null)
                            node.GetAllTagValue(ref this.title, ref titles);
                    }
                }
                else
                {
                    HTMLNode node2 = document.SearchNode("id", "fileinfotpl_desc");
                    if (node2 != null)
                    {
                        while (true)
                        {
                            node2 = node2.NextSibling();
                            if (node2 == null)
                                break;

                            // Search Engligh language first then any language
                            node = node2.SearchNode("lang", "en");
                            //if (node != null)
                            //    node = node2.SearchNode("lang");
                            if (node == null)
                                node = node2;
                            string tagValue = string.Empty;
                            node.GetAllTagValue(ref this.title, ref titles);
                            break;
                        }
                    }
                }
                // Remove anything before and at : in the title
                if (!string.IsNullOrEmpty(this.title))
                {
                    int index = this.title.IndexOf(':');
                    if (index > 0)
                        this.title = this.title.Substring(index + 1);
                }

                // Find year
                node = document.SearchNode("id", "fileinfotpl_date");
                if (node != null)
                {
                    node = node.NextSibling();
                    if (node != null)
                    {
                        string temp = node.tagValue;
                        if (string.IsNullOrEmpty(temp))
                        {
                            node = node.FirstChild();
                            if (node != null)
                                temp = node.tagValue;
                        }
                        if (!string.IsNullOrEmpty(temp))
                        {
                            DateTime date;
                            if (DateTime.TryParse(temp, out date))
                                this.year = date.Year;
                            else
                            {
                                string[] temps = temp.Split(' ', '-');
                                foreach (string t in temps)
                                    if (int.TryParse(t, out this.year))
                                        break;
                            }
                        }
                    }
                }
                // Find artist names and info
                node = document.SearchNode("id", "fileinfotpl_aut");
                if (node != null)
                {
                    HTMLNode node2 = node.NextSibling();
                    if (node2 != null)
                    {
                        HTMLNode node3 = node2.SearchNode("id", "creator");
                        if (node3 != null)
                        {
                            node = node3.SearchNodeWithValueLike("title", "en:");
                            if (node == null)
                            {
                                node = node3.SearchNode("title");
                                if (node == null)
                                    node = node3;
                            }
                        }
                        else
                            node = node2; ;
                        if (node != null)
                        {
                            string temp = string.Empty;
                            node.GetAllTagValue(ref temp);
                            ExtractArtistName(temp, out this.artistFirstName, out this.artistLastName, ref this.birthdate, ref this.died);
                            if (node.keyvalues.ContainsKey("href"))
                                this.artistInfo = node.keyvalues["href"];
                            // Update category2 and cat2Viewlist
                            this.cat2Viewlist = node.tagValue;
                            if (!string.IsNullOrEmpty(this.cat2Viewlist))
                                this.category2 = "Artists";
                        }
                    }
                }
                // Remove any /wiki/User: as Artist info
                if (!string.IsNullOrEmpty(this.artistInfo) && this.artistInfo.IndexOf("/wiki/User:") == 0)
                    this.artistInfo = document.topUrl + this.artistInfo;

                // Extract 
                if (!string.IsNullOrEmpty(this.artistInfo))
                    ExtractArtInfo(this.artistInfo, titles, this.link);

                // Find birth date and died date
                node = document.SearchNode("id", "fileinfotpl_creator_birthdate_value");
                if (node != null)
                {
                    node = node.FirstChild();
                    if (node != null)
                    {
                        DateTime date;
                        int n;
                        if (DateTime.TryParse(node.tagValue, out date))
                            this.birthdate = date.Year;
                        else if (int.TryParse(node.tagValue, out n))
                            this.birthdate = n;
                    }
                }
                node = document.SearchNode("id", "fileinfotpl_creator_deathdate_value");
                if (node != null)
                {
                    node = node.FirstChild();
                    if (node != null)
                    {
                        DateTime date;
                        int n;
                        if (DateTime.TryParse(node.tagValue, out date))
                            this.died = date.Year;
                        else if (int.TryParse(node.tagValue, out n))
                            this.died = n;
                    }
                }
                // Find Type detail
                // this.type = "Photograph";
                node = document.SearchNode("id", "fileinfotpl_art_medium");
                if (node != null)
                {
                    node = node.NextSibling();
                    if (node != null)
                        node.GetAllTagValue(ref this.typeDetail);
                }
                // Find dimensions
                node = document.SearchNode("id", "fileinfotpl_art_dimensions");
                if (node != null)
                {
                    node = node.NextSibling();
                    if (node != null)
                    {
                        if (node.HasChilds)
                            node = node.FirstChild();
                    }
                    string temp = node.tagValue;
                    temp = temp.Trim().ToLower();
                    string[] temps = temp.Split(' ');
                    if (temps.Length >= 4)
                    {
                        bool done = false;
                        if (double.TryParse(temps[0], out this.widthCm))
                            if (double.TryParse(temps[2], out this.heightCm))
                                done = true;
                        if (!done)
                        {
                            bool nextW = false, nextH = false;
                            foreach (string t in temps)
                            {
                                if (t.IndexOf("width") >= 0)
                                    nextW = true;
                                if (t.IndexOf("height") >= 0)
                                    nextH = true;
                                else if (nextW && double.TryParse(t, out this.widthCm))
                                    nextW = false;
                                else if (nextH && double.TryParse(t, out this.heightCm))
                                    nextH = false;
                            }
                        }

                        this.aspectRatio = this.widthCm / this.heightCm;
                    }
                }
                // Find URLs
                List<HTMLNode> nodes = new List<HTMLNode>();
                document.SearchAllNodesWithEndTagsEndLike("pixels", ref nodes);
                foreach (HTMLNode n in nodes)
                {
                    PhotoStockJSONURL url = new PhotoStockJSONURL();
                    string temp = n.tagValue;
                    temp = temp.Trim();
                    string[] temps = temp.Split(' ');
                    if (temps.Length >= 4)
                    {
                        if (int.TryParse(Utility.RemoveChar(temps[0], ','), out url.pixelWidth))
                            if (int.TryParse(Utility.RemoveChar(temps[2], ','), out url.pixelHeight))
                            {
                                if (n.keyvalues.ContainsKey("href"))
                                    url.location = n.keyvalues["href"];
                                this.urls.Add(url);
                            }
                    }
                }


                // Find location
                node = document.SearchNode("id", "fileinfotpl_art_gallery");
                if (node != null)
                {
                    HTMLNode node2 = node.NextSibling();
                    if (node2 != null)
                    {
                        HTMLNode node1 = node2.FirstDesendant();
                        node = null;
                        while (node == null && node1 != null)
                        {
                            if (node1.ItOrItsParentHasLikeValue("class", "language en", ref node))
                                ;
                            else if (node1.ItOrItsParentHasLikeValue("class", "language", ref node))
                                ;
                            else if (node1.ItOrItsParentHasLikeValue("class", "extiw", ref node))
                                ;
                            else if (node1.ItOrItsParentHasLikeValue("class", "fn", ref node))
                                ;
                            else
                            {
                                node1 = node1.parent;
                                if (node1 != null)
                                    node1 = node1.NextSibling();
                            }
                        }
                        if (node1 != null)
                        {
                            if (node == null)
                                node = node2;
                            this.location = string.Empty;
                            node.GetAllTagValue(ref this.location);
                            this.location = Utility.RemoveChar(this.location, '\n');
                            int index = this.location.IndexOf(':');
                            if (index > 0)
                                this.location = this.location.Substring(index + 1);
                            this.location = this.location.Trim();
                            if (!string.IsNullOrEmpty(this.location))
                            {
                                this.category1 = "Museums";
                                this.cat1Viewlist = this.location;
                            }
                        }
                    }
                }
                else
                {
                    // IMPORTANT: For birds only
                    if (crawlType == CrawlType.crawlBirdsOfAmerica)
                    {
                        node = document.SearchNode("id", "fileinfotpl_src");
                        if (node != null)
                        {
                            HTMLNode node2 = node.NextSibling();
                            if (node2 != null)
                            {
                                HTMLNode node1 = node2.FirstDesendant();
                                node = null;
                                while (node == null && node1 != null)
                                {
                                    if (node1.ItOrItsParentHasLikeValue("class", "external text", ref node))
                                        ;
                                    else if (node1.ItOrItsParentHasLikeValue("class", "external free", ref node))
                                        ;
                                    else
                                        node = node1;
                                }
                                if (node1 != null)
                                {
                                    if (node == null)
                                        node = node2;
                                    this.location = string.Empty;
                                    node.GetAllTagValue(ref this.location);
                                    this.location = Utility.RemoveChar(this.location, '\n');
                                    int index = this.location.IndexOf(':');
                                    if (index > 0)
                                        this.location = this.location.Substring(index + 1);
                                    this.location = this.location.Trim();
                                    if (!string.IsNullOrEmpty(this.location))
                                    {
                                        this.category1 = "Museums";
                                        this.cat1Viewlist = this.location;
                                    }
                                }
                            }
                        }
                    }
                }

                // Debug
                if (string.IsNullOrEmpty(this.location))
                {
                    Trace.WriteLine("Failed to extract gallery location");
                    if (this.category1 == "Museums" && this.cat1Viewlist != "Inventory")
                        this.location = this.cat1Viewlist;
                }

                // Find Thumbnail
                node = document.SearchNodeWithValueLike("alt", "Thumbnail for version");
                if (node != null)
                {
                    PhotoStockJSONURL url = new PhotoStockJSONURL();
                    int.TryParse(node.keyvalues["width"], out url.pixelWidth);
                    int.TryParse(node.keyvalues["height"], out url.pixelHeight);
                    url.location = node.keyvalues["src"];

                    // Add thumbnail URL to beginning of the URL list
                    this.urls.Insert(0, url);
                }

                // Find full media image and add to the end of the URL list if it does not exist already
                node = document.SearchNode("class", "fullMedia");
                if (node != null)
                {
                    node = node.FirstChild();
                    if (node != null)
                    {
                        PhotoStockJSONURL url = new PhotoStockJSONURL();
                        url.location = node.keyvalues["href"];
                        node = node.NextSibling();
                        string temp = node.tagValue;
                        temp = Utility.RemoveChar(temp, ',');
                        temp = Utility.RemoveChar(temp, '(');
                        string[] temps = temp.Split(' ');
                        if (temps.Length >= 3)
                            if (int.TryParse(temps[0], out url.pixelWidth))
                                if (int.TryParse(temps[2], out url.pixelHeight))
                                    if (this.FindURL(url.pixelWidth, url.pixelHeight) == null)
                                        this.urls.Add(url);
                    }
                }

                // Notify no URL extracted
                if (this.urls.Count == 0)
                    Trace.WriteLine("Failed to extract url locations");


                // Find copyright
                node = document.SearchNode("class", "licensetpl_short");
                if (node != null)
                    this.copyright = node.tagValue;

                return true;
            }
            catch (Exception e)
            {
                Utility.Exception("Extract has failed", e, true);
                return false;
            }
        }
    }
}
