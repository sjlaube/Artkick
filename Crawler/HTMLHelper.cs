using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;

namespace Photostock
{
    public class HTMLNode
    {
        private static char begt = '<', endt = '>', endt2 = '/', space = ' ', assign = '=', quote = '"', endtag = '/';
        public string tag = string.Empty;
        public HTMLNode parent = null;
        public List<HTMLNode> childs = new List<HTMLNode>();
        public string parentTagValue = string.Empty;
        public Dictionary<string, string> keyvalues = new Dictionary<string, string>();
        public string tagValue = string.Empty;
        public string begTag { get { return "<" + this.tag; } }
        public string endTag { get { return "</" + this.tag + ">"; } }

        public HTMLNode() { }
        public HTMLNode(HTMLNode parent) { this.parent = parent; }

        public HTMLNode SearchNode(string key)
        {
            if (this.keyvalues.ContainsKey(key))
                return this;
            foreach (HTMLNode child in this.childs)
            {
                HTMLNode node = child.SearchNode(key);
                if (node != null)
                    return node;
            }
            return null;
        }

        public HTMLNode SearchNode(string key, string value)
        {
            if (this.keyvalues.ContainsKey(key))
            {
                if (this.keyvalues[key] == value)
                    return this;
            }
            foreach (HTMLNode child in this.childs)
            {
                HTMLNode node = child.SearchNode(key, value);
                if (node != null)
                    return node;
            }
            return null;
        }

        public HTMLNode SearchNodeWithTag(string tag)
        {
            if (this.tag == tag)
                return this;
            foreach (HTMLNode child in this.childs)
            {
                HTMLNode node = child.SearchNodeWithTag(tag);
                if (node != null)
                    return node;
            }
            return null;
        }

        public HTMLNode SearchNodeWithLikeTagValue(string tagValue)
        {
            if (this.tagValue.IndexOf(tagValue) >= 0)
                return this;
            foreach (HTMLNode child in this.childs)
            {
                HTMLNode node = child.SearchNodeWithLikeTagValue(tagValue);
                if (node != null)
                    return node;
            }
            return null;
        }

        public bool ItOrItsParentHasLikeValue(string key, string value, ref HTMLNode node)
        {
            if (this.keyvalues.ContainsKey(key) && this.keyvalues[key].IndexOf(value) >= 0)
            {
                node = this;
                return true;
            }
            if (this.parent.keyvalues.ContainsKey(key) && this.parent.keyvalues[key].IndexOf(value) >= 0)
            {
                node = this.parent;
                return true;
            }
            return false;
        }

        public void GetAllTagValue(ref string allTagValue)
        {
            List<string> tagValues = new List<string>();
            this.GetAllTagValue(ref allTagValue, ref tagValues);
        }

        public void GetAllTagValue(ref string allTagValue, ref List<string> tagValues) { this.GetAllTagValue(ref allTagValue, ref tagValues, true); }

        private void GetAllTagValue(ref string allTagValue, ref List<string> tagValues, bool first)
        {
            foreach (HTMLNode child in this.childs)
            {
                child.GetAllTagValue(ref allTagValue, ref tagValues, false);
            }
            if (!string.IsNullOrEmpty(this.tagValue))
            {
                if (Utility.IsBlank(allTagValue))
                    allTagValue += this.parentTagValue + this.tagValue;
                tagValues.Add(this.tagValue);
            }
            if (first)
                if (this.parent != null && !string.IsNullOrEmpty(this.parent.tagValue))
                {
                    if (Utility.IsBlank(allTagValue))
                        allTagValue += this.parent.tagValue;
                    tagValues.Add(this.parent.tagValue);
                }
        }


        public HTMLNode SearchNodeWithValueLike(string key, string value)
        {
            if (this.keyvalues.ContainsKey(key))
            {
                if (this.keyvalues[key].IndexOf(value) >= 0)
                    return this;
            }
            foreach (HTMLNode child in this.childs)
            {
                HTMLNode node = child.SearchNodeWithValueLike(key, value);
                if (node != null)
                    return node;
            }
            return null;
        }

        public void SearchAllNodesWithLikeTagValueAndKey(List<string> tagValues, string key, ref List<HTMLNode> nodes)
        {
            if (!string.IsNullOrEmpty(this.tagValue))
            {
                if (this.keyvalues.ContainsKey(key))
                {
                    bool found = false;
                    foreach (string tagValue in tagValues)
                        if (this.tagValue.IndexOf(tagValue) >= 0 || tagValue.IndexOf(this.tagValue) >= 0)
                        {
                            found = true;
                            break;
                        }
                    if (found)
                        nodes.Add(this);
                }
            }
            foreach (HTMLNode child in this.childs)
                child.SearchAllNodesWithLikeTagValueAndKey(tagValues, key, ref nodes);
        }

        public void SearchAllNodesWithValueLikeUnlikes(string key, ref List<HTMLNode> nodes, string likeValue, params string[] unlikeValues)
        {
            if (this.keyvalues.ContainsKey(key))
            {
                if (this.keyvalues[key].IndexOf(likeValue) >= 0)
                {
                    bool failed = false;
                    foreach (string unlikeValue in unlikeValues)
                        if (this.keyvalues[key].IndexOf(unlikeValue) >= 0)
                        {
                            failed = true;
                            break;
                        }
                    if (!failed)
                        nodes.Add(this);
                }
            }
            foreach (HTMLNode child in this.childs)
                child.SearchAllNodesWithValueLikeUnlikes(key, ref nodes, likeValue, unlikeValues);
        }

        public void SearchAllNodesWithValueLike(string key, ref List<HTMLNode> nodes, params string[] likeValues)
        {
            if (this.keyvalues.ContainsKey(key))
            {
                bool failed = true;
                foreach(string likeValue in likeValues)
                if (this.keyvalues[key].IndexOf(likeValue) >= 0)
                {
                    failed = false;
                    break;
                }
                if (!failed)
                    nodes.Add(this);
            }
            foreach (HTMLNode child in this.childs)
                child.SearchAllNodesWithValueLike(key, ref nodes, likeValues);
        }

        public void SearchAllNodesWithEndTagsEndLike(string text, ref List<HTMLNode> nodes)
        {
            int index = this.tagValue.IndexOf(text);
            if (index >= 0 && index == this.tagValue.Length - text.Length)
                nodes.Add(this);
            foreach (HTMLNode child in this.childs)
                child.SearchAllNodesWithEndTagsEndLike(text, ref nodes);
        }

        public HTMLNode Parent { get { return this.parent; } }

        public bool HasChilds { get { if (this.childs.Count > 0) return true; else return false; } }
        public HTMLNode FirstChild()
        {
            if (this.childs.Count == 0)
                return null;
            return this.childs[0];
        }

        public HTMLNode LastChild()
        {
            if (this.childs.Count == 0)
                return null;
            return this.childs[this.childs.Count - 1];
        }

        public HTMLNode FirstDesendant()
        {
            if (this.childs.Count == 0)
                return this;
            return this.childs[0].FirstDesendant();
        }

        public HTMLNode LastDesendant()
        {
            if (this.childs.Count == 0)
                return this;
            return this.childs[this.childs.Count - 1].LastDesendant();
        }

        public HTMLNode PrevSibling()
        {
            HTMLNode parent = this.parent;
            int index = parent.childs.IndexOf(this);
            index--;
            if (index < 0)
                return null;
            return parent.childs[index];
        }

        public HTMLNode NextSibling()
        {
            HTMLNode parent = this.parent;
            int index = parent.childs.IndexOf(this);
            index++;
            if (index >= parent.childs.Count)
                return null;
            return parent.childs[index];
        }

        public void Debug()
        {
            Trace.WriteLine("Tag: {0}", this.tag);
            if (this.parentTagValue != string.Empty)
                Trace.WriteLine("Parent Tag Value: {0}", this.parentTagValue);
            if (this.tagValue != string.Empty)
                Trace.WriteLine("Tag Value: {0}", this.tagValue);
            if (this.keyvalues.Count > 0)
            {
                Trace.WriteLine("Key Values:");
                foreach (string key in this.keyvalues.Keys)
                    Trace.WriteLine("{0} = {1}", key, this.keyvalues[key]);
            }
            if (this.childs.Count > 0)
            {
                Trace.WriteLine("Childs");
                foreach (HTMLNode child in this.childs)
                    child.Debug();
            }
        }

        public void DebugTagValues()
        {
            if (this.tagValue != string.Empty)
                Trace.WriteLine("Tag Value: {0}", this.tagValue);
            if (this.childs.Count > 0)
            {
                Trace.WriteLine("Childs");
                foreach (HTMLNode child in this.childs)
                    child.DebugTagValues();
            }
        }

        /// <summary>
        /// there may be multiple begTags before we find the right endTag
        /// </summary>
        /// <param name="input"></param>
        /// <param name="pos"></param>
        /// <returns></returns>
        public int IndexOfEndTag(string input, int pos)
        {
            int count = 1;
            int eindex = -1;
            while (count > 0)
            {
                eindex = input.IndexOf(this.endTag, pos);
                if (eindex < 0)
                    return -1;
                count--;
                while (pos < eindex)
                {
                    int bindex = input.IndexOf(this.begTag, pos);
                    if (bindex < 0 || bindex > eindex)
                        break;
                    count++;
                    pos = bindex + this.begTag.Length;
                }
                pos = eindex + this.endTag.Length;
            }
            return eindex;
        }

        public void ParseEndTag(string input, ref int pos)
        {
            int end = this.IndexOfEndTag(input, pos);
            if (end < 0)
                return;
            int start = Utility.ReverseIndexOf(input, end, endt);
            if (start < 0)
                start = pos;
            this.tagValue = input.Substring(start + 1, end - start - 1);
            while (pos < start)
            {
                HTMLNode child = new HTMLNode(this);
                if (child.Parse(input, ref pos, start))
                    this.childs.Add(child);
                else
                    pos++;
            }
            // update the pos to the end
            pos = end + this.endTag.Length;
        }

        public bool Parse(string input, ref int pos, int endpos)
        {
            HTMLNode that = this;
            bool inTag = true, inKey = false, inValue = false, inQuote = false, first = true;
            string key = string.Empty, value = string.Empty;
            for (; pos <= endpos; pos++)
            {
                char achar = input[pos];
                if (achar != begt && first)
                {
                    that.parentTagValue += achar;
                    continue;
                }

                else if (achar == begt && first)
                    first = false;

                else if (achar == begt && !first)
                {
                    HTMLNode child = new HTMLNode(this);
                    if (child.Parse(input, ref pos, endpos))
                        that.childs.Add(child);
                }
                else if (achar == endt2 && !inQuote)
                {
                    if ((pos + 1) <= endpos && input[pos + 1] == endt)
                    {
                        pos++;
                        this.tagValue = key.Trim();
                        return true;
                    }
                }
                else if (achar == endt && !inQuote)
                {
                    pos++;
                    that.ParseEndTag(input, ref pos);
                    return true;
                }
                else if (achar == space && !inQuote)
                {
                    if (inTag)
                    {
                        inTag = false;
                        inKey = true;
                    }
                }
                else if (achar == assign && !inQuote)
                {
                    if (inKey)
                    {
                        inKey = false;
                        inValue = true;
                    }
                }
                else if (achar == quote && inQuote)
                {
                    if (inValue && key != string.Empty && value != string.Empty)
                    {
                        key = key.Trim();
                        value = value.Trim();
                        if (!that.keyvalues.ContainsKey(key))
                            that.keyvalues.Add(key, value);
                        key = value = string.Empty;
                        inValue = false;
                        inKey = true;
                    }
                    inQuote = false;
                }
                else if (achar == quote && !inQuote)
                    inQuote = true;

                else
                {
                    if (inTag)
                        that.tag += achar;
                    else if (inKey)
                        key += achar;
                    else if (inValue)
                        value += achar;
                }
            }
            return false;
        }
    }

    public class HTMLDocument : HTMLNode
    {
        public string url;
        public string topUrl;

        public HTMLDocument(string url) 
        { 
            this.url = url;
            this.topUrl = string.Empty;
            int index = url.IndexOf("//");
            if (index >= 0)
                index = url.IndexOf('/', index + 2);
            else
                index = url.IndexOf('/');
            if ( index >= 0)
                this.topUrl = url.Substring(0, index);
        }
        
        public void Parse(string input)
        {
            int pos = 0;
            while (pos < input.Length)
            {
                HTMLNode child = new HTMLNode(this);
                if (child.Parse(input, ref pos, input.Length - 1))
                    this.childs.Add(child);
                else
                    pos++;
            }
        }
        public HTMLNode GetBody()
        {
            return this.SearchNodeWithTag("body");
        }

    }
}
