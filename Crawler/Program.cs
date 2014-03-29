using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace Photostock
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Folder.Top = "C:/temp/PhotoStock";
            Application.Run(new PhotoStockForm());
        }
    }
}
