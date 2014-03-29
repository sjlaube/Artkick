using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Net;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;

  
namespace ArtKick
{
    public partial class ArtKickForm : Form
    {
        [DllImport("user32.dll")]
        static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

        [DllImport("user32.dll")]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

        [DllImport("user32.dll", SetLastError = true)]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        static extern bool GetClientRect(IntPtr hWnd, out Rectangle lpRect);

        [DllImport("user32.dll")]
        private static extern int GetSystemMenu(int hwnd, int bRevert);

        [DllImport("user32.dll")]
        private static extern bool AppendMenu(int hMenu, int Flagsw, int IDNewItem, string lpNewItem);

        [DllImport("user32.dll")]
        private static extern bool InsertMenu(IntPtr hMenu, int uPosition, int uFlags, int uIDNewItem, string lpNewItem);

        public ArtKickForm()
        {
            InitializeComponent();

            this.webBrowser.IsWebBrowserContextMenuEnabled = false;
            this.webBrowser.WebBrowserShortcutsEnabled = false;
            this.webBrowser.Url = new Uri("http://sleepy-scrubland-3038.herokuapp.com/tv/opera?uid=" + GetMacAddress());

        }

        public void OnPreviewScreen(IntPtr PreviewHandle)
        {
            try
            {
                //set the preview window as the parent of this window
                SetParent(this.Handle, PreviewHandle);
                Trace.WriteLine("Set Parent ...");

                //make this a child window, so when the select screensaver 
                //dialog closes, this will also close
                SetWindowLong(this.Handle, -16,
                      new IntPtr(GetWindowLong(this.Handle, -16) | 0x40000000));
                Trace.WriteLine("Set Child ...");

                //set our window's size to the size of our window's new parent
                Rectangle ParentRect;
                GetClientRect(PreviewHandle, out ParentRect);
                Trace.WriteLine("Preview Parent Rect: {0},{1}", ParentRect.Size.Width, ParentRect.Size.Height);
                this.Size = ParentRect.Size;
                //set our location at (0, 0)
                this.Location = new Point(0, 0);
            }
            catch (Exception e)
            {
                Trace.WriteLine("GetPreviewScreen failed ...");
            }
        }

        static public string GetMacAddress()
        {
            string mac = string.Empty;
            NetworkInterface[] nics = NetworkInterface.GetAllNetworkInterfaces();
            foreach (NetworkInterface nic in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (nic.OperationalStatus == OperationalStatus.Up)
                {
                    mac = nic.GetPhysicalAddress().ToString();
                    Console.WriteLine(mac);
                    break;
                }
            }
            return mac;
        }

        public bool OnReRegister()
        {
            if (MessageBox.Show("Do you want to register (or re-register) this PC with ArtKick?", null, MessageBoxButtons.YesNo) != System.Windows.Forms.DialogResult.Yes)
                return false;
            this.OnUnRegister();
            this.OnRegister();
            return true;
        }

        public void OnRegister()
        {
            string mac = GetMacAddress();
            string url = "http://sleepy-scrubland-3038.herokuapp.com/tv/browser?uid=" + mac;
            this.webBrowser.Url = new Uri(url);
        }

        private void OnUnRegister()
        {
            string mac = GetMacAddress();
            string url = string.Format("http://sleepy-scrubland-3038.herokuapp.com/client2/removePlayer?uid={0}&maker=Browser", mac);
            WebHelper.GetWebText(url);
            //this.webBrowser.Url = new Uri(url);
        }

        private void OnFullScreen()
        {
            this.FormBorderStyle = FormBorderStyle.None;
        }

        private void OnEscapeFromFulLScreen()
        {
            this.FormBorderStyle = FormBorderStyle.Sizable;
        }

        private void OnKeyDown(object sender, PreviewKeyDownEventArgs e)
        {
            if (e.KeyCode == Keys.Right || e.KeyCode == Keys.Left)
                ;
            else if (e.KeyCode == Keys.Escape)
                this.OnEscapeFromFulLScreen();
            else if (e.KeyCode == Keys.F11)
                this.OnFullScreen();
            else
                Application.Exit();
            Message m = new Message();
            this.DefWndProc(ref m);
        }

        //private void OnMouseMove(object sender, MouseEventArgs e)
        //{
        //    if (this.screensaverMode)
        //        Application.Exit();
        //    else
        //    {
        //        Message m = new Message();
        //        this.DefWndProc(ref m);
        //    }
        //}

        //protected override void WndProc(ref Message m)
        //{
        //    const int WM_MOUSEMOVE = 0x007F;

        //    switch (m.Msg)
        //    {
        //        case WM_MOUSEMOVE:
        //            if (this.screensaverMode)
        //                Application.Exit();
        //            break;
        //    }
        //    base.WndProc(ref m);
        //}

    }
}
