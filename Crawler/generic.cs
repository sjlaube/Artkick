using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Security;
using System.Text;
using System.Windows.Forms;

public class Utility
{
    public static bool IsBlank(string input)
    {
        if ( string.IsNullOrEmpty(input))
            return true;
        const string blanks = " \r\r\t";
        foreach(char achar in input)
            if ( blanks.IndexOf(achar)>= 0)
                return false;
        return true;
    }

    public static bool IsNumber(string input)
    {
        if (string.IsNullOrEmpty(input))
            return false;
        const string numbers = "0123456789";
        foreach (char achar in input)
            if (numbers.IndexOf(achar) >= 0)
                return true;
        return false;
    }

    public static int ReverseIndexOf(string input, int startpos, char target)
    {
        for (int i = startpos; i >= 0; i--)
            if (input[i] == target)
                return i;
        return -1;
    }

    public static int IndexOf(char[] chars, char target)
    {
        for (int i = 0; i < chars.Length; i++)
            if (chars[i] == target)
                return i;
        return -1;
    }

    public static string RemoveChar(string input, params char[] removes)
    {
        StringBuilder buf = new StringBuilder();
        for (int i = 0; i < input.Length; i++)
            if (IndexOf(removes, input[i]) < 0)
                buf.Append(input[i]);
        return buf.ToString();
    }

    public static string Trim(string input, char trim)
    {
        if (string.IsNullOrEmpty(input))
            return input;
        if (input.IndexOf(trim) < 0)
            return input;
        int begin = 0, end = 0;
        for (int i = 0; i < input.Length; i++)
            if (input[i] != trim)
            {
                begin = i;
                break;
            }
        for (int i = input.Length -1; i >= 0; i--)
            if (input[i] != trim)
            {
                end = i;
                break;
            }
        input = input.Substring(begin, end - begin + 1);
        return input;
    }

    public static void Exception(string header, Exception e, bool stackTrace)
    {
        string output = string.Empty;
        if (header.Length > 0)
            output = string.Format("{0}: {1}, Source: {2}", header, e.Message, e.Source);
        else
            output = string.Format("{0}{1}, Source: {2}", header, e.Message, e.Source);
        if (stackTrace)
            output += string.Format("\n\n{0}", e.StackTrace);
        Trace.WriteLine(output);
    }

}

public class WebHelper
{
    public static string GetWebText(string url)
    {
        try
        {
            if (url.IndexOf("//") == 0)
                url = "http:" + url;
            HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(url);
            request.UserAgent = "System.Support.WebHelper";

            WebResponse response = request.GetResponse();

            Stream stream = response.GetResponseStream();

            StreamReader reader = new StreamReader(stream);
            string htmlText = reader.ReadToEnd();
            return htmlText;
        }
        catch (Exception e)
        {
            return null;
        }
    }
}

public class Folder
{
    private static string top = string.Empty;
    public static string Top { get { return top; } set { InitTopFolder(value); } }
    public static string Temp { get { return Top + "/temp"; } }
    private static void InitTopFolder(string iTopFolder)
    {
        if (iTopFolder == null || iTopFolder == string.Empty)
            return;
        top = iTopFolder;
        // Make sure all the folders exist
        if (!Directory.Exists(top))
            Directory.CreateDirectory(top);
        if (!Directory.Exists(Temp))
            Directory.CreateDirectory(Temp);
    }
}

public class Trace
{
    private const string traceFileName = "/Trace.txt";
    public static void WriteLine(string format, params object[] args)
    {
        try
        {
            string text = string.Format(format, args);
            string output = string.Format("{0} {1}", DateTime.Now, text);
            System.Diagnostics.Debug.WriteLine(output);
            string filename = Folder.Temp + traceFileName;
            StreamWriter stream = new StreamWriter(filename, true);
            stream.WriteLine(output);
            stream.Close();
        }
        catch (Exception e)
        {
            string error = string.Format("WriteLine Error: {0}, Source: {1}", e.Message, e.Source);
        }
    }

    public static void TrimLog()
    {
        string filename = Folder.Temp + traceFileName;
        File.Delete(filename);
        WriteLine("Started new trace log");
    }
}

