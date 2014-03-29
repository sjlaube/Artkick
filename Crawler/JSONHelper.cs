using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace Photostock
{
    public class JSONHelper
    {
        public enum NextReadType { none, keyValue, groupTitle, beginGroup, endGroup, beginLevel, endLevel };
        public StringBuilder buf = new StringBuilder();
        private int level = 0;
        private string textRead = string.Empty;
        private int nextRead = 0;

        public void ReadFile(string filename)
        {
            StreamReader reader = new StreamReader(filename);
            StringBuilder buf = new StringBuilder();
            string temp;
            while ((temp = reader.ReadLine()) != null)
            {
                buf.Append(temp);
                buf.AppendLine();
            }
            reader.Close();
            this.textRead = buf.ToString();
            this.nextRead = 0;
        }

        public bool ReadNext(out NextReadType type, out string key, out string value)
        {
            type = NextReadType.none;
            key = string.Empty;
            value = string.Empty;
            string delimitors = "[]{},";
            string spaces = " \n\r\t,";
            bool continuing = false, inKey = false, inValue = false, hasKey = false;
            while (this.nextRead < this.textRead.Length)
            {
                char achar = this.textRead[this.nextRead++];
                if (type == NextReadType.none)
                {
                    if (achar == '[')
                    {
                        type = NextReadType.beginGroup;
                        return true;
                    }
                    else if (achar == ']')
                    {
                        type = NextReadType.endGroup;
                        return true;
                    }
                    else if (achar == '{')
                    {
                        type = NextReadType.beginLevel;
                        return true;
                    }
                    else if (achar == '}')
                    {
                        type = NextReadType.endLevel;
                        return true;
                    }
                }
                if (type == NextReadType.keyValue)
                    if (delimitors.IndexOf(achar) >= 0)
                        return true;
                if (achar == '"' && continuing == false)
                {
                    if (inKey)
                        inKey = false;
                    else if (inValue)
                    {
                        inValue = false;
                        type = NextReadType.keyValue;
                        return true;
                    }
                    else if (hasKey)
                        inValue = true;
                    else
                        inKey = true;
                    continue;
                }
                if ( achar == '\\')
                {
                    continuing = true;
                    continue;
                }
                if (continuing)
                    continuing = false;
                if (achar == ':' && !inKey && !inValue)
                {
                    hasKey = true;
                    type = NextReadType.groupTitle;
                    continue;
                }

                // Special treatment for groupTitle
                if (type == NextReadType.groupTitle && !inValue)
                {
                    char nextchar = this.textRead[this.nextRead];
                    if (nextchar == '[')
                        return true;
                }

                // Finally just handle the regular text
                if (inKey)
                    key += achar;
                else if (inValue)
                    value += achar;
                else if ( spaces.IndexOf(achar) >= 0)
                    ;
                else
                    throw new Exception();
            }
            return false;
        }


        public void BeginLevel()
        {
            level++;
            for (int i = 1; i < level; i++)
                buf.Append('\t');
            buf.Append('{');
            buf.AppendLine();
        }

        public void EndLevel(bool more)
        {
            for (int i = 1; i < level; i++)
                buf.Append('\t');
            buf.Append('}');
            if (more)
                buf.Append(',');
            buf.AppendLine();
            level--;
        }

        public void BeginGroup(string name)
        {
            for (int i = 0; i < level; i++)
                buf.Append('\t');
            buf.AppendFormat("\"{0}\": [", name);
            buf.AppendLine();
        }

        public void BeginGroup()
        {
            for (int i = 0; i < level; i++)
                buf.Append('\t');
            buf.Append("[");
            buf.AppendLine();
        }

        public void EndGroup(bool more)
        {
            for (int i = 0; i < level; i++)
                buf.Append('\t');
            buf.Append(']');
            if (more)
                buf.Append(',');
            buf.AppendLine();
        }

        public void WriteLine(string name, string value) { this.WriteLine(name, value, true); }
        public void WriteLine(string name, string value, bool more)
        {
            if (!string.IsNullOrEmpty(value))
            {
                if (value.IndexOf("\r") >= 0)
                    value = Utility.RemoveChar(value, '\r');
                if (value.IndexOf("\n") >= 0)
                    value = Utility.RemoveChar(value, '\n');
                if (value.IndexOf('"') >= 0)
                    value = value.Replace("\"", "\\\"");
                if (value.IndexOf("//") == 0)
                    value = "http:" + value;
            }
            for (int i = 0; i < level; i++)
                buf.Append('\t');
            buf.AppendFormat("\"{0}\": \"{1}\"", name, string.IsNullOrEmpty(value) ? "" : value);
            if (more)
                buf.Append(',');
            buf.AppendLine();
        }

        public void WriteLine(string name, int value) { this.WriteLine(name, value, true); }
        public void WriteLine(string name, int value, bool more)
        {
            for (int i = 0; i < level; i++)
                buf.Append('\t');
            buf.AppendFormat("\"{0}\": \"{1}\"", name, value == 0 ? "" : value.ToString());
            if (more)
                buf.Append(',');
            buf.AppendLine();
        }

        public void WriteLine(string name, double value, string format) { this.WriteLine(name, value, format, true); }
        public void WriteLine(string name, double value, string format, bool more)
        {
            for (int i = 0; i < level; i++)
                buf.Append('\t');
            buf.AppendFormat("\"{0}\": \"{1}\"", name, value == 0 || double.IsNaN(value) ? "" : value.ToString(format));
            if (more)
                buf.Append(',');
            buf.AppendLine();
        }

        public void WriteFile(string filename)
        {
            StreamWriter stream = new StreamWriter(filename, true);
            stream.WriteLine(buf.ToString());
            stream.Close();
        }
    }
}
