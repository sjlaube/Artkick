// wrapped by build app
define("demos/form/src", ["dojo","dijit","dojox","dojo/require!dojo/parser,dojo/data/ItemFileReadStore,dijit/form/Form,dijit/form/ValidationTextBox,dijit/form/ComboBox,dijit/form/FilteringSelect,dijit/form/CheckBox,dijit/form/RadioButton,dijit/form/DateTextBox,dijit/form/CurrencyTextBox,dijit/form/NumberSpinner,dijit/form/HorizontalSlider,dijit/form/HorizontalRule,dijit/form/HorizontalRuleLabels,dijit/form/Textarea,dijit/Editor,dijit/_editor/plugins/FontChoice,dijit/form/Button"], function(dojo,dijit,dojox){
dojo.require("dojo.parser");
dojo.require("dojo.data.ItemFileReadStore");

dojo.require("dijit.form.Form");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.RadioButton");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.CurrencyTextBox");
dojo.require("dijit.form.NumberSpinner");

dojo.require("dijit.form.HorizontalSlider");
dojo.require("dijit.form.HorizontalRule");
dojo.require("dijit.form.HorizontalRuleLabels");

dojo.require("dijit.form.Textarea");
dojo.require("dijit.Editor");
dojo.require("dijit._editor.plugins.FontChoice");
dojo.require("dijit.form.Button");

// make dojo.toJson() print dates correctly (this feels a bit dirty)
Date.prototype.json = function(){ return dojo.date.stamp.toISOString(this, {selector: 'date'});};
});
