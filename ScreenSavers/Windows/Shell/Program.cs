using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WindowsFormsApplication1
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Process proc = new Process();
            string workingDir = Directory.GetCurrentDirectory();
            proc.StartInfo.WorkingDirectory = workingDir;
            proc.StartInfo.UseShellExecute = true;
            proc.StartInfo.FileName = "ArtKick.scr";
            proc.StartInfo.Verb = "install";

            proc.Start();
            Application.Exit();


            //Application.EnableVisualStyles();
            //Application.SetCompatibleTextRenderingDefault(false);
            //Application.Run(new Form1());
        }
    }
}
