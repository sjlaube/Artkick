using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System.Windows.Forms;

namespace ArtKick
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main(string[] args)
        {
            Folder.Top = "C:/Temp/ArtKick";

            StringBuilder buf = new StringBuilder();
            for(int i=0;i<args.Length;i++)
                buf.AppendFormat("{0} ", args[i]);
            Trace.WriteLine("{0}", buf.ToString());

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            ArtKickForm artkick = new ArtKickForm();
            if (args.Length > 0)
            {
                string action = args[0].ToLower().Trim().Substring(0, 2);
                if (action == "/p")  // preview
                {
                    if (args.Length > 1)
                    {
                        IntPtr prevHandle = new IntPtr(long.Parse(args[1]));
                        Trace.WriteLine("Prev handle: {0}", prevHandle);
                        artkick.OnPreviewScreen(prevHandle);
                    }
                }
                else if (action == "/s") // show
                {
                }
                else if (action == "/c") // configuing
                {
                    if (!artkick.OnReRegister())
                        return;
                }
                else
                {
                }
            }
            Application.Run(artkick);
        }
    }
}
