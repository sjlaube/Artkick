using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Photostock
{
    public class FlickrJSON : PhotoStockJSON
    {
        public FlickrJSON(string source, string url) : base(source, url) {}

        public override bool Extract(string topFolder, string category1, string cat1Viewlist, HTMLDocument document, CrawlType crawlType)
        {
            try
            {
                // Update category1
                this.category1 = category1;
                this.cat1Viewlist = cat1Viewlist;

                // Find title
                List<string> titles = new List<string>();
                HTMLNode node = document.SearchNode("property", "og:title");
                if (node != null)
                    this.title = node.keyvalues["content"];
                // Remove anything before and at : in the title
                if (!string.IsNullOrEmpty(this.title))
                {
                    int index = this.title.IndexOf(':');
                    if (index > 0)
                        this.title = this.title.Substring(index + 1);
                }

                // Find year

                // Find artist names and info
                // Debug: don't bother with artist name and info in Flickr
                //
                //node = document.SearchNode("class", "photo-name-line-1");
                //if (node != null)
                //{
                //    node = node.LastDesendant();
                //    if (node != null)
                //    {
                //        string temp = node.tagValue;
                //        temp = Utility.RemoveChar(temp, '\n', '\r', '\t');
                //        temp = Utility.Trim(temp, ' ');
                //        string[] temps = temp.Split(' ');
                //        this.artistLastName = temps[temps.Length - 1];
                //        if (temps.Length > 1)
                //            this.artistFirstName = temps[0];
                //        if (node.keyvalues.ContainsKey("href"))
                //        {
                //            string url = node.keyvalues["href"];
                //            if (url.IndexOf("http") < 0)
                //                url = topFolder + url;
                //            this.artistInfo = url;
                //            // Update category2 and cat2Viewlist
                //            this.cat2Viewlist = temp;
                //            if (!string.IsNullOrEmpty(this.cat2Viewlist))
                //                this.category2 = "Artist";
                //        }
                //    }
                //}



                // Find birth date and died date

                // Find Type detail
                this.type = "Photograph";

                // Find dimensions

                // Find location
                node = document.SearchNodeWithLikeTagValue("Repository");
                if ( node != null)
                {
                    HTMLNode node2 = node.NextSibling();
                    if (node2 == null)
                        node2 = node.parent;
                    node = node2;
                    if (node != null)
                    {
                        this.location = node.tagValue;
                        if (string.IsNullOrEmpty(this.location))
                            this.location = node.parentTagValue;

                        if (!string.IsNullOrEmpty(this.location))
                        {
                            this.category1 = "Museums";
                            int index = this.location.IndexOf(',');
                            if (index > 0)
                                this.cat1Viewlist = this.location.Substring(0, index);
                            else 
                                this.cat1Viewlist = this.location;
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
                node = document.SearchNode("class", "nextprev_thumb");
                if (node != null)
                {
                    PhotoStockJSONURL url = new PhotoStockJSONURL();
                    int.TryParse(node.keyvalues["width"], out url.pixelWidth);
                    int.TryParse(node.keyvalues["height"], out url.pixelHeight);
                    url.location = node.keyvalues["src"];

                    // Add thumbnail URL to beginning of the URL list
                    this.urls.Insert(0, url);
                }

                // Find other images in + "/sizes/l/"
                this.ExtractOtherImages(topFolder, document.url + "/sizes/l/");

                // Find full media image and add to the end of the URL list if it does not exist already
                node = document.SearchNode("property", "og:image");
                if (node != null)
                {
                    PhotoStockJSONURL url = new PhotoStockJSONURL();
                    url.location = node.keyvalues["content"];
                    node = document.SearchNode("property", "og:image:width");
                    if (node != null)
                    {
                        url.pixelWidth = int.Parse(node.keyvalues["content"]);
                        node = document.SearchNode("property", "og:image:height");
                        if (node != null)
                        {
                            url.pixelHeight = int.Parse(node.keyvalues["content"]);
                            // Add image to the end of the URL list
                            this.urls.Add(url);
                            // Add aspect ratio
                            this.aspectRatio = (double)url.pixelWidth / url.pixelHeight;
                        }
                    }
                }

                // Notify no URL extracted
                if (this.urls.Count == 0)
                    Trace.WriteLine("Failed to extract url locations");


                // Find copyright
                return true;
            }
            catch (Exception e)
            {
                Utility.Exception("Extract has failed", e, true);
                return false;
            }
        }

        void ExtractOtherImages(string topFolder, string url)
        {
            string text = WebHelper.GetWebText(url);
            if (text == null)
            {
                Trace.WriteLine("Failed to download size file {0} ...", url);
                return;
            }
            //string[] texts = text.Split('\n');
            //foreach(string temp in texts)
            //    Trace.WriteLine(temp);
            HTMLDocument document = new HTMLDocument(url);
            document.Parse(text);
            // document.Debug();

            HTMLNode node = document.SearchNode("class", "sizes-list");
            if (node != null)
            {
                List<HTMLNode> nodes = new List<HTMLNode>();
                node.SearchAllNodesWithValueLike("href", ref nodes, "sizes");
                int count = 0;
                foreach (HTMLNode n in nodes)
                {
                    PhotoStockJSONURL url2 = new PhotoStockJSONURL();
                    string location = n.keyvalues["href"];
                    if (location.IndexOf("http") < 0)
                        location = topFolder + url;
                    url2.location = location;
                    HTMLNode n2 = n.NextSibling();
                    if (n2 != null)
                    {
                        string temp = n2.tagValue;
                        temp = temp.Substring(1, temp.Length - 2);
                        string[] temps = temp.Split(' ');
                        if ( int.TryParse(temps[0], out url2.pixelWidth))
                            if (int.TryParse(temps[2], out url2.pixelHeight))
                            {
                                this.urls.Add(url2);
                                count++;
                            }
                    }
                }
                if ( count == 0)
                    Trace.WriteLine("Failed to extract any image from size file {0} ...", url);
            }
        }
    }
}
