namespace Photostock
{
    partial class PhotoStockForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.button1 = new System.Windows.Forms.Button();
            this.categories = new System.Windows.Forms.TextBox();
            this.button2 = new System.Windows.Forms.Button();
            this.extract = new System.Windows.Forms.TextBox();
            this.button3 = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.htmlExample = new System.Windows.Forms.TextBox();
            this.button4 = new System.Windows.Forms.Button();
            this.button5 = new System.Windows.Forms.Button();
            this.count = new System.Windows.Forms.Label();
            this.button6 = new System.Windows.Forms.Button();
            this.button7 = new System.Windows.Forms.Button();
            this.button8 = new System.Windows.Forms.Button();
            this.button10 = new System.Windows.Forms.Button();
            this.button11 = new System.Windows.Forms.Button();
            this.checkWikimedia = new System.Windows.Forms.RadioButton();
            this.checkFlickr = new System.Windows.Forms.RadioButton();
            this.SuspendLayout();
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(589, 40);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(76, 25);
            this.button1.TabIndex = 0;
            this.button1.Text = "Crawl";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.OnCrawl);
            // 
            // categories
            // 
            this.categories.Location = new System.Drawing.Point(16, 40);
            this.categories.Multiline = true;
            this.categories.Name = "categories";
            this.categories.Size = new System.Drawing.Size(567, 102);
            this.categories.TabIndex = 2;
            this.categories.Text = "\r\n\r\n";
            // 
            // button2
            // 
            this.button2.Location = new System.Drawing.Point(508, 463);
            this.button2.Name = "button2";
            this.button2.Size = new System.Drawing.Size(75, 25);
            this.button2.TabIndex = 3;
            this.button2.Text = "Trim Log";
            this.button2.UseVisualStyleBackColor = true;
            this.button2.Click += new System.EventHandler(this.OnTrimLog);
            // 
            // extract
            // 
            this.extract.Location = new System.Drawing.Point(16, 187);
            this.extract.Multiline = true;
            this.extract.Name = "extract";
            this.extract.Size = new System.Drawing.Size(567, 132);
            this.extract.TabIndex = 5;
            // 
            // button3
            // 
            this.button3.Location = new System.Drawing.Point(589, 188);
            this.button3.Name = "button3";
            this.button3.Size = new System.Drawing.Size(75, 25);
            this.button3.TabIndex = 6;
            this.button3.Text = "Extract";
            this.button3.UseVisualStyleBackColor = true;
            this.button3.Click += new System.EventHandler(this.OnExtract);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(13, 331);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(80, 13);
            this.label3.TabIndex = 7;
            this.label3.Text = "HTML Example";
            // 
            // htmlExample
            // 
            this.htmlExample.Location = new System.Drawing.Point(16, 351);
            this.htmlExample.Multiline = true;
            this.htmlExample.Name = "htmlExample";
            this.htmlExample.Size = new System.Drawing.Size(567, 98);
            this.htmlExample.TabIndex = 8;
            // 
            // button4
            // 
            this.button4.Location = new System.Drawing.Point(592, 351);
            this.button4.Name = "button4";
            this.button4.Size = new System.Drawing.Size(72, 25);
            this.button4.TabIndex = 9;
            this.button4.Text = "Parse";
            this.button4.UseVisualStyleBackColor = true;
            this.button4.Click += new System.EventHandler(this.OnHTMLParse);
            // 
            // button5
            // 
            this.button5.Location = new System.Drawing.Point(592, 424);
            this.button5.Name = "button5";
            this.button5.Size = new System.Drawing.Size(72, 25);
            this.button5.TabIndex = 10;
            this.button5.Text = "Write JSON";
            this.button5.UseVisualStyleBackColor = true;
            this.button5.Click += new System.EventHandler(this.OnWriteJSON);
            // 
            // count
            // 
            this.count.AutoSize = true;
            this.count.Location = new System.Drawing.Point(13, 469);
            this.count.Name = "count";
            this.count.Size = new System.Drawing.Size(111, 13);
            this.count.TabIndex = 11;
            this.count.Text = "0 categories 0 Images";
            // 
            // button6
            // 
            this.button6.Location = new System.Drawing.Point(172, 156);
            this.button6.Name = "button6";
            this.button6.Size = new System.Drawing.Size(147, 25);
            this.button6.TabIndex = 12;
            this.button6.Text = "Crawl Wikimedia Features Pictures";
            this.button6.UseVisualStyleBackColor = true;
            this.button6.Click += new System.EventHandler(this.OnWikiMediaCrawlFeaturedPictures);
            // 
            // button7
            // 
            this.button7.Location = new System.Drawing.Point(589, 294);
            this.button7.Name = "button7";
            this.button7.Size = new System.Drawing.Size(75, 25);
            this.button7.TabIndex = 13;
            this.button7.Text = "Clear";
            this.button7.UseVisualStyleBackColor = true;
            this.button7.Click += new System.EventHandler(this.OnClearExtract);
            // 
            // button8
            // 
            this.button8.Location = new System.Drawing.Point(16, 156);
            this.button8.Name = "button8";
            this.button8.Size = new System.Drawing.Size(151, 25);
            this.button8.TabIndex = 14;
            this.button8.Text = "Crawl Wikimedia Museums";
            this.button8.UseVisualStyleBackColor = true;
            this.button8.Click += new System.EventHandler(this.OnWikiMediaCrawlMuseums);
            // 
            // button10
            // 
            this.button10.Location = new System.Drawing.Point(592, 463);
            this.button10.Name = "button10";
            this.button10.Size = new System.Drawing.Size(72, 25);
            this.button10.TabIndex = 16;
            this.button10.Text = "Read JSON";
            this.button10.UseVisualStyleBackColor = true;
            this.button10.Click += new System.EventHandler(this.OnReadJSON);
            // 
            // button11
            // 
            this.button11.Location = new System.Drawing.Point(326, 156);
            this.button11.Name = "button11";
            this.button11.Size = new System.Drawing.Size(131, 25);
            this.button11.TabIndex = 17;
            this.button11.Text = "ReCrawl WIkimedia All";
            this.button11.UseVisualStyleBackColor = true;
            this.button11.Click += new System.EventHandler(this.OnWikiMediaReCrawlAll);
            // 
            // checkWikimedia
            // 
            this.checkWikimedia.AutoSize = true;
            this.checkWikimedia.Location = new System.Drawing.Point(16, 12);
            this.checkWikimedia.Name = "checkWikimedia";
            this.checkWikimedia.Size = new System.Drawing.Size(124, 17);
            this.checkWikimedia.TabIndex = 18;
            this.checkWikimedia.TabStop = true;
            this.checkWikimedia.Text = "WikiMedia Commons";
            this.checkWikimedia.UseVisualStyleBackColor = true;
            // 
            // checkFlickr
            // 
            this.checkFlickr.AutoSize = true;
            this.checkFlickr.Location = new System.Drawing.Point(146, 12);
            this.checkFlickr.Name = "checkFlickr";
            this.checkFlickr.Size = new System.Drawing.Size(50, 17);
            this.checkFlickr.TabIndex = 19;
            this.checkFlickr.TabStop = true;
            this.checkFlickr.Text = "Flickr";
            this.checkFlickr.UseVisualStyleBackColor = true;
            // 
            // PhotoStockForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(673, 511);
            this.Controls.Add(this.checkFlickr);
            this.Controls.Add(this.checkWikimedia);
            this.Controls.Add(this.button11);
            this.Controls.Add(this.button10);
            this.Controls.Add(this.button8);
            this.Controls.Add(this.button7);
            this.Controls.Add(this.button6);
            this.Controls.Add(this.count);
            this.Controls.Add(this.button5);
            this.Controls.Add(this.button4);
            this.Controls.Add(this.htmlExample);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.button3);
            this.Controls.Add(this.extract);
            this.Controls.Add(this.button2);
            this.Controls.Add(this.categories);
            this.Controls.Add(this.button1);
            this.Name = "PhotoStockForm";
            this.Text = "PhotoStock";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.TextBox categories;
        private System.Windows.Forms.Button button2;
        private System.Windows.Forms.TextBox extract;
        private System.Windows.Forms.Button button3;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox htmlExample;
        private System.Windows.Forms.Button button4;
        private System.Windows.Forms.Button button5;
        private System.Windows.Forms.Label count;
        private System.Windows.Forms.Button button6;
        private System.Windows.Forms.Button button7;
        private System.Windows.Forms.Button button8;
        private System.Windows.Forms.Button button10;
        private System.Windows.Forms.Button button11;
        private System.Windows.Forms.RadioButton checkWikimedia;
        private System.Windows.Forms.RadioButton checkFlickr;
    }
}

