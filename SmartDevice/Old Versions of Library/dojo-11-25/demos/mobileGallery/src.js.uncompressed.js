require({cache:{
'dojo/DeferredList':function(){
define(["./_base/kernel", "./_base/Deferred", "./_base/array"], function(dojo, Deferred, darray){
	// module:
	//		dojo/DeferredList


dojo.DeferredList = function(/*Array*/ list, /*Boolean?*/ fireOnOneCallback, /*Boolean?*/ fireOnOneErrback, /*Boolean?*/ consumeErrors, /*Function?*/ canceller){
	// summary:
	//		Deprecated, use dojo/promise/all instead.
	//		Provides event handling for a group of Deferred objects.
	// description:
	//		DeferredList takes an array of existing deferreds and returns a new deferred of its own
	//		this new deferred will typically have its callback fired when all of the deferreds in
	//		the given list have fired their own deferreds.  The parameters `fireOnOneCallback` and
	//		fireOnOneErrback, will fire before all the deferreds as appropriate
	// list:
	//		The list of deferreds to be synchronizied with this DeferredList
	// fireOnOneCallback:
	//		Will cause the DeferredLists callback to be fired as soon as any
	//		of the deferreds in its list have been fired instead of waiting until
	//		the entire list has finished
	// fireonOneErrback:
	//		Will cause the errback to fire upon any of the deferreds errback
	// canceller:
	//		A deferred canceller function, see dojo.Deferred
	var resultList = [];
	Deferred.call(this);
	var self = this;
	if(list.length === 0 && !fireOnOneCallback){
		this.resolve([0, []]);
	}
	var finished = 0;
	darray.forEach(list, function(item, i){
		item.then(function(result){
			if(fireOnOneCallback){
				self.resolve([i, result]);
			}else{
				addResult(true, result);
			}
		},function(error){
			if(fireOnOneErrback){
				self.reject(error);
			}else{
				addResult(false, error);
			}
			if(consumeErrors){
				return null;
			}
			throw error;
		});
		function addResult(succeeded, result){
			resultList[i] = [succeeded, result];
			finished++;
			if(finished === list.length){
				self.resolve(resultList);
			}

		}
	});
};
dojo.DeferredList.prototype = new Deferred();

dojo.DeferredList.prototype.gatherResults = function(deferredList){
	// summary:
	//		Gathers the results of the deferreds for packaging
	//		as the parameters to the Deferred Lists' callback
	// deferredList: dojo/DeferredList
	//		The deferred list from which this function gathers results.
	// returns: dojo/DeferredList
	//		The newly created deferred list which packs results as
	//		parameters to its callback.

	var d = new dojo.DeferredList(deferredList, false, true, false);
	d.addCallback(function(results){
		var ret = [];
		darray.forEach(results, function(result){
			ret.push(result[1]);
		});
		return ret;
	});
	return d;
};

return dojo.DeferredList;
});

},
'dojo/data/ItemFileReadStore':function(){
define(["../_base/kernel", "../_base/lang", "../_base/declare", "../_base/array", "../_base/xhr",
	"../Evented", "./util/filter", "./util/simpleFetch", "../date/stamp"
], function(kernel, lang, declare, array, xhr, Evented, filterUtil, simpleFetch, dateStamp){

// module:
//		dojo/data/ItemFileReadStore

var ItemFileReadStore = declare("dojo.data.ItemFileReadStore", [Evented],{
	// summary:
	//		The ItemFileReadStore implements the dojo/data/api/Read API and reads
	//		data from JSON files that have contents in this format --
	// |	{ items: [
	// |		{ name:'Kermit', color:'green', age:12, friends:['Gonzo', {_reference:{name:'Fozzie Bear'}}]},
	// |		{ name:'Fozzie Bear', wears:['hat', 'tie']},
	// |		{ name:'Miss Piggy', pets:'Foo-Foo'}
	// |	]}
	//		Note that it can also contain an 'identifier' property that specified which attribute on the items
	//		in the array of items that acts as the unique identifier for that item.

	constructor: function(/* Object */ keywordParameters){
		// summary:
		//		constructor
		// keywordParameters:
		//		{url: String} {data: jsonObject} {typeMap: object}
		//		The structure of the typeMap object is as follows:
		// |	{
		// |		type0: function || object,
		// |		type1: function || object,
		// |		...
		// |		typeN: function || object
		// |	}
		//		Where if it is a function, it is assumed to be an object constructor that takes the
		//		value of _value as the initialization parameters.  If it is an object, then it is assumed
		//		to be an object of general form:
		// |	{
		// |		type: function, //constructor.
		// |		deserialize:	function(value) //The function that parses the value and constructs the object defined by type appropriately.
		// |	}

		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = [];
		this._loadFinished = false;
		this._jsonFileUrl = keywordParameters.url;
		this._ccUrl = keywordParameters.url;
		this.url = keywordParameters.url;
		this._jsonData = keywordParameters.data;
		this.data = null;
		this._datatypeMap = keywordParameters.typeMap || {};
		if(!this._datatypeMap['Date']){
			//If no default mapping for dates, then set this as default.
			//We use the dojo/date/stamp here because the ISO format is the 'dojo way'
			//of generically representing dates.
			this._datatypeMap['Date'] = {
				type: Date,
				deserialize: function(value){
					return dateStamp.fromISOString(value);
				}
			};
		}
		this._features = {'dojo.data.api.Read':true, 'dojo.data.api.Identity':true};
		this._itemsByIdentity = null;
		this._storeRefPropName = "_S"; // Default name for the store reference to attach to every item.
		this._itemNumPropName = "_0"; // Default Item Id for isItem to attach to every item.
		this._rootItemPropName = "_RI"; // Default Item Id for isItem to attach to every item.
		this._reverseRefMap = "_RRM"; // Default attribute for constructing a reverse reference map for use with reference integrity
		this._loadInProgress = false; //Got to track the initial load to prevent duelling loads of the dataset.
		this._queuedFetches = [];
		if(keywordParameters.urlPreventCache !== undefined){
			this.urlPreventCache = keywordParameters.urlPreventCache?true:false;
		}
		if(keywordParameters.hierarchical !== undefined){
			this.hierarchical = keywordParameters.hierarchical?true:false;
		}
		if(keywordParameters.clearOnClose){
			this.clearOnClose = true;
		}
		if("failOk" in keywordParameters){
			this.failOk = keywordParameters.failOk?true:false;
		}
	},

	url: "",	// use "" rather than undefined for the benefit of the parser (#3539)

	//Internal var, crossCheckUrl.  Used so that setting either url or _jsonFileUrl, can still trigger a reload
	//when clearOnClose and close is used.
	_ccUrl: "",

	data: null,	// define this so that the parser can populate it

	typeMap: null, //Define so parser can populate.

	// clearOnClose: Boolean
	//		Parameter to allow users to specify if a close call should force a reload or not.
	//		By default, it retains the old behavior of not clearing if close is called.  But
	//		if set true, the store will be reset to default state.  Note that by doing this,
	//		all item handles will become invalid and a new fetch must be issued.
	clearOnClose: false,

	// urlPreventCache: Boolean
	//		Parameter to allow specifying if preventCache should be passed to the xhrGet call or not when loading data from a url.
	//		Note this does not mean the store calls the server on each fetch, only that the data load has preventCache set as an option.
	//		Added for tracker: #6072
	urlPreventCache: false,

	// failOk: Boolean
	//		Parameter for specifying that it is OK for the xhrGet call to fail silently.
	failOk: false,

	// hierarchical: Boolean
	//		Parameter to indicate to process data from the url as hierarchical
	//		(data items can contain other data items in js form).  Default is true
	//		for backwards compatibility.  False means only root items are processed
	//		as items, all child objects outside of type-mapped objects and those in
	//		specific reference format, are left straight JS data objects.
	hierarchical: true,

	_assertIsItem: function(/* dojo/data/api/Item */ item){
		// summary:
		//		This function tests whether the item passed in is indeed an item in the store.
		// item:
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){
			throw new Error(this.declaredClass + ": Invalid item argument.");
		}
	},

	_assertIsAttribute: function(/* attribute-name-string */ attribute){
		// summary:
		//		This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		// attribute:
		//		The attribute to test for being contained by the store.
		if(typeof attribute !== "string"){
			throw new Error(this.declaredClass + ": Invalid attribute argument.");
		}
	},

	getValue: function(	/* dojo/data/api/Item */ item,
						   /* attribute-name-string */ attribute,
						   /* value? */ defaultValue){
		// summary:
		//		See dojo/data/api/Read.getValue()
		var values = this.getValues(item, attribute);
		return (values.length > 0)?values[0]:defaultValue; // mixed
	},

	getValues: function(/* dojo/data/api/Item */ item,
						/* attribute-name-string */ attribute){
		// summary:
		//		See dojo/data/api/Read.getValues()

		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		// Clone it before returning.  refs: #10474
		return (item[attribute] || []).slice(0); // Array
	},

	getAttributes: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		for(var key in item){
			// Save off only the real item attributes, not the special id marks for O(1) isItem.
			if((key !== this._storeRefPropName) && (key !== this._itemNumPropName) && (key !== this._rootItemPropName) && (key !== this._reverseRefMap)){
				attributes.push(key);
			}
		}
		return attributes; // Array
	},

	hasAttribute: function(	/* dojo/data/api/Item */ item,
							   /* attribute-name-string */ attribute){
		// summary:
		//		See dojo/data/api/Read.hasAttribute()
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		return (attribute in item);
	},

	containsValue: function(/* dojo/data/api/Item */ item,
							/* attribute-name-string */ attribute,
							/* anything */ value){
		// summary:
		//		See dojo/data/api/Read.containsValue()
		var regexp = undefined;
		if(typeof value === "string"){
			regexp = filterUtil.patternToRegExp(value, false);
		}
		return this._containsValue(item, attribute, value, regexp); //boolean.
	},

	_containsValue: function(	/* dojo/data/api/Item */ item,
								 /* attribute-name-string */ attribute,
								 /* anything */ value,
								 /* RegExp?*/ regexp){
		// summary:
		//		Internal function for looking at the values contained by the item.
		// description:
		//		Internal function for looking at the values contained by the item.  This
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		// item:
		//		The data item to examine for attribute values.
		// attribute:
		//		The attribute to inspect.
		// value:
		//		The value to match.
		// regexp:
		//		Optional regular expression generated off value if value was of string type to handle wildcarding.
		//		If present and attribute values are string, then it can be used for comparison instead of 'value'
		return array.some(this.getValues(item, attribute), function(possibleValue){
			if(possibleValue !== null && !lang.isObject(possibleValue) && regexp){
				if(possibleValue.toString().match(regexp)){
					return true; // Boolean
				}
			}else if(value === possibleValue){
				return true; // Boolean
			}
		});
	},

	isItem: function(/* anything */ something){
		// summary:
		//		See dojo/data/api/Read.isItem()
		if(something && something[this._storeRefPropName] === this){
			if(this._arrayOfAllItems[something[this._itemNumPropName]] === something){
				return true;
			}
		}
		return false; // Boolean
	},

	isItemLoaded: function(/* anything */ something){
		// summary:
		//		See dojo/data/api/Read.isItemLoaded()
		return this.isItem(something); //boolean
	},

	loadItem: function(/* object */ keywordArgs){
		// summary:
		//		See dojo/data/api/Read.loadItem()
		this._assertIsItem(keywordArgs.item);
	},

	getFeatures: function(){
		// summary:
		//		See dojo/data/api/Read.getFeatures()
		return this._features; //Object
	},

	getLabel: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Read.getLabel()
		if(this._labelAttr && this.isItem(item)){
			return this.getValue(item,this._labelAttr); //String
		}
		return undefined; //undefined
	},

	getLabelAttributes: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Read.getLabelAttributes()
		if(this._labelAttr){
			return [this._labelAttr]; //array
		}
		return null; //null
	},

	filter: function(/* Object */ requestArgs, /* item[] */ arrayOfItems, /* Function */ findCallback){
		// summary:
		//		This method handles the basic filtering needs for ItemFile* based stores.
		var items = [],
			i, key;

		if(requestArgs.query){
			var value,
				ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false;

			//See if there are any string values that can be regexp parsed first to avoid multiple regexp gens on the
			//same value for each item examined.  Much more efficient.
			var regexpList = {};
			for(key in requestArgs.query){
				value = requestArgs.query[key];
				if(typeof value === "string"){
					regexpList[key] = filterUtil.patternToRegExp(value, ignoreCase);
				}else if(value instanceof RegExp){
					regexpList[key] = value;
				}
			}
			for(i = 0; i < arrayOfItems.length; ++i){
				var match = true;
				var candidateItem = arrayOfItems[i];
				if(candidateItem === null){
					match = false;
				}else{
					for(key in requestArgs.query){
						value = requestArgs.query[key];
						if(!this._containsValue(candidateItem, key, value, regexpList[key])){
							match = false;
						}
					}
				}
				if(match){
					items.push(candidateItem);
				}
			}
			findCallback(items, requestArgs);
		}else{
			// We want a copy to pass back in case the parent wishes to sort the array.
			// We shouldn't allow resort of the internal list, so that multiple callers
			// can get lists and sort without affecting each other.  We also need to
			// filter out any null values that have been left as a result of deleteItem()
			// calls in ItemFileWriteStore.
			for(i = 0; i < arrayOfItems.length; ++i){
				var item = arrayOfItems[i];
				if(item !== null){
					items.push(item);
				}
			}
			findCallback(items, requestArgs);
		}
	},

	_fetchItems: function(	/* Object */ keywordArgs,
							  /* Function */ findCallback,
							  /* Function */ errorCallback){
		// summary:
		//		See dojo/data/util.simpleFetch.fetch()
		var self = this;

		if(this._loadFinished){
			this.filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions), findCallback);
		}else{
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated(this.declaredClass + ": ",
					"To change the url, set the url property of the store," +
						" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){
				//If fetches come in before the loading has finished, but while
				//a load is in progress, we have to defer the fetching to be
				//invoked in the callback.
				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs, filter: lang.hitch(self, "filter"), findCallback: lang.hitch(self, findCallback)});
				}else{
					this._loadInProgress = true;
					var getArgs = {
						url: self._jsonFileUrl,
						handleAs: "json-comment-optional",
						preventCache: this.urlPreventCache,
						failOk: this.failOk
					};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;

							self.filter(keywordArgs, self._getItemsArray(keywordArgs.queryOptions), findCallback);
							self._handleQueuedFetches();
						}catch(e){
							self._loadFinished = true;
							self._loadInProgress = false;
							errorCallback(e, keywordArgs);
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						errorCallback(error, keywordArgs);
					});

					//Wire up the cancel to abort of the request
					//This call cancel on the deferred if it hasn't been called
					//yet and then will chain to the simple abort of the
					//simpleFetch keywordArgs
					var oldAbort = null;
					if(keywordArgs.abort){
						oldAbort = keywordArgs.abort;
					}
					keywordArgs.abort = function(){
						var df = getHandler;
						if(df && df.fired === -1){
							df.cancel();
							df = null;
						}
						if(oldAbort){
							oldAbort.call(keywordArgs);
						}
					};
				}
			}else if(this._jsonData){
				try{
					this._loadFinished = true;
					this._getItemsFromLoadedData(this._jsonData);
					this._jsonData = null;
					self.filter(keywordArgs, this._getItemsArray(keywordArgs.queryOptions), findCallback);
				}catch(e){
					errorCallback(e, keywordArgs);
				}
			}else{
				errorCallback(new Error(this.declaredClass + ": No JSON source data was provided as either URL or a nested Javascript object."), keywordArgs);
			}
		}
	},

	_handleQueuedFetches: function(){
		// summary:
		//		Internal function to execute delayed request in the store.
		
		//Execute any deferred fetches now.
		if(this._queuedFetches.length > 0){
			for(var i = 0; i < this._queuedFetches.length; i++){
				var fData = this._queuedFetches[i],
					delayedQuery = fData.args,
					delayedFilter = fData.filter,
					delayedFindCallback = fData.findCallback;
				if(delayedFilter){
					delayedFilter(delayedQuery, this._getItemsArray(delayedQuery.queryOptions), delayedFindCallback);
				}else{
					this.fetchItemByIdentity(delayedQuery);
				}
			}
			this._queuedFetches = [];
		}
	},

	_getItemsArray: function(/*object?*/queryOptions){
		// summary:
		//		Internal function to determine which list of items to search over.
		// queryOptions: The query options parameter, if any.
		if(queryOptions && queryOptions.deep){
			return this._arrayOfAllItems;
		}
		return this._arrayOfTopLevelItems;
	},

	close: function(/*dojo/data/api/Request|Object?*/ request){
		// summary:
		//		See dojo/data/api/Read.close()
		if(this.clearOnClose &&
			this._loadFinished &&
			!this._loadInProgress){
			//Reset all internalsback to default state.  This will force a reload
			//on next fetch.  This also checks that the data or url param was set
			//so that the store knows it can get data.  Without one of those being set,
			//the next fetch will trigger an error.

			if(((this._jsonFileUrl == "" || this._jsonFileUrl == null) &&
				(this.url == "" || this.url == null)
				) && this.data == null){
				console.debug(this.declaredClass + ": WARNING!  Data reload " +
					" information has not been provided." +
					"  Please set 'url' or 'data' to the appropriate value before" +
					" the next fetch");
			}
			this._arrayOfAllItems = [];
			this._arrayOfTopLevelItems = [];
			this._loadFinished = false;
			this._itemsByIdentity = null;
			this._loadInProgress = false;
			this._queuedFetches = [];
		}
	},

	_getItemsFromLoadedData: function(/* Object */ dataObject){
		// summary:
		//		Function to parse the loaded data into item format and build the internal items array.
		// description:
		//		Function to parse the loaded data into item format and build the internal items array.
		// dataObject:
		//		The JS data object containing the raw data to convery into item format.
		// returns: Array
		//		Array of items in store item format.

		// First, we define a couple little utility functions...
		var addingArrays = false,
			self = this;

		function valueIsAnItem(/* anything */ aValue){
			// summary:
			//		Given any sort of value that could be in the raw json data,
			//		return true if we should interpret the value as being an
			//		item itself, rather than a literal value or a reference.
			// example:
			// 	|	false == valueIsAnItem("Kermit");
			// 	|	false == valueIsAnItem(42);
			// 	|	false == valueIsAnItem(new Date());
			// 	|	false == valueIsAnItem({_type:'Date', _value:'1802-05-14'});
			// 	|	false == valueIsAnItem({_reference:'Kermit'});
			// 	|	true == valueIsAnItem({name:'Kermit', color:'green'});
			// 	|	true == valueIsAnItem({iggy:'pop'});
			// 	|	true == valueIsAnItem({foo:42});
			return (aValue !== null) &&
				(typeof aValue === "object") &&
				(!lang.isArray(aValue) || addingArrays) &&
				(!lang.isFunction(aValue)) &&
				(aValue.constructor == Object || lang.isArray(aValue)) &&
				(typeof aValue._reference === "undefined") &&
				(typeof aValue._type === "undefined") &&
				(typeof aValue._value === "undefined") &&
				self.hierarchical;
		}

		function addItemAndSubItemsToArrayOfAllItems(/* dojo/data/api/Item */ anItem){
			self._arrayOfAllItems.push(anItem);
			for(var attribute in anItem){
				var valueForAttribute = anItem[attribute];
				if(valueForAttribute){
					if(lang.isArray(valueForAttribute)){
						var valueArray = valueForAttribute;
						for(var k = 0; k < valueArray.length; ++k){
							var singleValue = valueArray[k];
							if(valueIsAnItem(singleValue)){
								addItemAndSubItemsToArrayOfAllItems(singleValue);
							}
						}
					}else{
						if(valueIsAnItem(valueForAttribute)){
							addItemAndSubItemsToArrayOfAllItems(valueForAttribute);
						}
					}
				}
			}
		}

		this._labelAttr = dataObject.label;

		// We need to do some transformations to convert the data structure
		// that we read from the file into a format that will be convenient
		// to work with in memory.

		// Step 1: Walk through the object hierarchy and build a list of all items
		var i,
			item;
		this._arrayOfAllItems = [];
		this._arrayOfTopLevelItems = dataObject.items;

		for(i = 0; i < this._arrayOfTopLevelItems.length; ++i){
			item = this._arrayOfTopLevelItems[i];
			if(lang.isArray(item)){
				addingArrays = true;
			}
			addItemAndSubItemsToArrayOfAllItems(item);
			item[this._rootItemPropName]=true;
		}

		// Step 2: Walk through all the attribute values of all the items,
		// and replace single values with arrays.  For example, we change this:
		//		{ name:'Miss Piggy', pets:'Foo-Foo'}
		// into this:
		//		{ name:['Miss Piggy'], pets:['Foo-Foo']}
		//
		// We also store the attribute names so we can validate our store
		// reference and item id special properties for the O(1) isItem
		var allAttributeNames = {},
			key;

		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			for(key in item){
				if(key !== this._rootItemPropName){
					var value = item[key];
					if(value !== null){
						if(!lang.isArray(value)){
							item[key] = [value];
						}
					}else{
						item[key] = [null];
					}
				}
				allAttributeNames[key]=key;
			}
		}

		// Step 3: Build unique property names to use for the _storeRefPropName and _itemNumPropName
		// This should go really fast, it will generally never even run the loop.
		while(allAttributeNames[this._storeRefPropName]){
			this._storeRefPropName += "_";
		}
		while(allAttributeNames[this._itemNumPropName]){
			this._itemNumPropName += "_";
		}
		while(allAttributeNames[this._reverseRefMap]){
			this._reverseRefMap += "_";
		}

		// Step 4: Some data files specify an optional 'identifier', which is
		// the name of an attribute that holds the identity of each item.
		// If this data file specified an identifier attribute, then build a
		// hash table of items keyed by the identity of the items.
		var arrayOfValues;

		var identifier = dataObject.identifier;
		if(identifier){
			this._itemsByIdentity = {};
			this._features['dojo.data.api.Identity'] = identifier;
			for(i = 0; i < this._arrayOfAllItems.length; ++i){
				item = this._arrayOfAllItems[i];
				arrayOfValues = item[identifier];
				var identity = arrayOfValues[0];
				if(!Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
					this._itemsByIdentity[identity] = item;
				}else{
					if(this._jsonFileUrl){
						throw new Error(this.declaredClass + ":  The json data as specified by: [" + this._jsonFileUrl + "] is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}else if(this._jsonData){
						throw new Error(this.declaredClass + ":  The json data provided by the creation arguments is malformed.  Items within the list have identifier: [" + identifier + "].  Value collided: [" + identity + "]");
					}
				}
			}
		}else{
			this._features['dojo.data.api.Identity'] = Number;
		}

		// Step 5: Walk through all the items, and set each item's properties
		// for _storeRefPropName and _itemNumPropName, so that store.isItem() will return true.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i];
			item[this._storeRefPropName] = this;
			item[this._itemNumPropName] = i;
		}

		// Step 6: We walk through all the attribute values of all the items,
		// looking for type/value literals and item-references.
		//
		// We replace item-references with pointers to items.  For example, we change:
		//		{ name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
		// into this:
		//		{ name:['Kermit'], friends:[miss_piggy] }
		// (where miss_piggy is the object representing the 'Miss Piggy' item).
		//
		// We replace type/value pairs with typed-literals.  For example, we change:
		//		{ name:['Nelson Mandela'], born:[{_type:'Date', _value:'1918-07-18'}] }
		// into this:
		//		{ name:['Kermit'], born:(new Date(1918, 6, 18)) }
		//
		// We also generate the associate map for all items for the O(1) isItem function.
		for(i = 0; i < this._arrayOfAllItems.length; ++i){
			item = this._arrayOfAllItems[i]; // example: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
			for(key in item){
				arrayOfValues = item[key]; // example: [{_reference:{name:'Miss Piggy'}}]
				for(var j = 0; j < arrayOfValues.length; ++j){
					value = arrayOfValues[j]; // example: {_reference:{name:'Miss Piggy'}}
					if(value !== null && typeof value == "object"){
						if(("_type" in value) && ("_value" in value)){
							var type = value._type; // examples: 'Date', 'Color', or 'ComplexNumber'
							var mappingObj = this._datatypeMap[type]; // examples: Date, dojo.Color, foo.math.ComplexNumber, {type: dojo.Color, deserialize(value){ return new dojo.Color(value)}}
							if(!mappingObj){
								throw new Error("dojo.data.ItemFileReadStore: in the typeMap constructor arg, no object class was specified for the datatype '" + type + "'");
							}else if(lang.isFunction(mappingObj)){
								arrayOfValues[j] = new mappingObj(value._value);
							}else if(lang.isFunction(mappingObj.deserialize)){
								arrayOfValues[j] = mappingObj.deserialize(value._value);
							}else{
								throw new Error("dojo.data.ItemFileReadStore: Value provided in typeMap was neither a constructor, nor a an object with a deserialize function");
							}
						}
						if(value._reference){
							var referenceDescription = value._reference; // example: {name:'Miss Piggy'}
							if(!lang.isObject(referenceDescription)){
								// example: 'Miss Piggy'
								// from an item like: { name:['Kermit'], friends:[{_reference:'Miss Piggy'}]}
								arrayOfValues[j] = this._getItemByIdentity(referenceDescription);
							}else{
								// example: {name:'Miss Piggy'}
								// from an item like: { name:['Kermit'], friends:[{_reference:{name:'Miss Piggy'}}] }
								for(var k = 0; k < this._arrayOfAllItems.length; ++k){
									var candidateItem = this._arrayOfAllItems[k],
										found = true;
									for(var refKey in referenceDescription){
										if(candidateItem[refKey] != referenceDescription[refKey]){
											found = false;
										}
									}
									if(found){
										arrayOfValues[j] = candidateItem;
									}
								}
							}
							if(this.referenceIntegrity){
								var refItem = arrayOfValues[j];
								if(this.isItem(refItem)){
									this._addReferenceToMap(refItem, item, key);
								}
							}
						}else if(this.isItem(value)){
							//It's a child item (not one referenced through _reference).
							//We need to treat this as a referenced item, so it can be cleaned up
							//in a write store easily.
							if(this.referenceIntegrity){
								this._addReferenceToMap(value, item, key);
							}
						}
					}
				}
			}
		}
	},

	_addReferenceToMap: function(/*item*/ refItem, /*item*/ parentItem, /*string*/ attribute){
		// summary:
		//		Method to add an reference map entry for an item and attribute.
		// description:
		//		Method to add an reference map entry for an item and attribute.
		// refItem:
		//		The item that is referenced.
		// parentItem:
		//		The item that holds the new reference to refItem.
		// attribute:
		//		The attribute on parentItem that contains the new reference.

		//Stub function, does nothing.  Real processing is in ItemFileWriteStore.
	},

	getIdentity: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Identity.getIdentity()
		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			return item[this._itemNumPropName]; // Number
		}else{
			var arrayOfValues = item[identifier];
			if(arrayOfValues){
				return arrayOfValues[0]; // Object|String
			}
		}
		return null; // null
	},

	fetchItemByIdentity: function(/* Object */ keywordArgs){
		// summary:
		//		See dojo/data/api/Identity.fetchItemByIdentity()

		// Hasn't loaded yet, we have to trigger the load.
		var item,
			scope;
		if(!this._loadFinished){
			var self = this;
			//Do a check on the JsonFileUrl and crosscheck it.
			//If it doesn't match the cross-check, it needs to be updated
			//This allows for either url or _jsonFileUrl to he changed to
			//reset the store load location.  Done this way for backwards
			//compatibility.  People use _jsonFileUrl (even though officially
			//private.
			if(this._jsonFileUrl !== this._ccUrl){
				kernel.deprecated(this.declaredClass + ": ",
					"To change the url, set the url property of the store," +
						" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
				this._ccUrl = this._jsonFileUrl;
				this.url = this._jsonFileUrl;
			}else if(this.url !== this._ccUrl){
				this._jsonFileUrl = this.url;
				this._ccUrl = this.url;
			}

			//See if there was any forced reset of data.
			if(this.data != null && this._jsonData == null){
				this._jsonData = this.data;
				this.data = null;
			}

			if(this._jsonFileUrl){

				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs});
				}else{
					this._loadInProgress = true;
					var getArgs = {
						url: self._jsonFileUrl,
						handleAs: "json-comment-optional",
						preventCache: this.urlPreventCache,
						failOk: this.failOk
					};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						var scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
						try{
							self._getItemsFromLoadedData(data);
							self._loadFinished = true;
							self._loadInProgress = false;
							item = self._getItemByIdentity(keywordArgs.identity);
							if(keywordArgs.onItem){
								keywordArgs.onItem.call(scope, item);
							}
							self._handleQueuedFetches();
						}catch(error){
							self._loadInProgress = false;
							if(keywordArgs.onError){
								keywordArgs.onError.call(scope, error);
							}
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						if(keywordArgs.onError){
							var scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
							keywordArgs.onError.call(scope, error);
						}
					});
				}

			}else if(this._jsonData){
				// Passed in data, no need to xhr.
				self._getItemsFromLoadedData(self._jsonData);
				self._jsonData = null;
				self._loadFinished = true;
				item = self._getItemByIdentity(keywordArgs.identity);
				if(keywordArgs.onItem){
					scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
					keywordArgs.onItem.call(scope, item);
				}
			}
		}else{
			// Already loaded.  We can just look it up and call back.
			item = this._getItemByIdentity(keywordArgs.identity);
			if(keywordArgs.onItem){
				scope = keywordArgs.scope?keywordArgs.scope:kernel.global;
				keywordArgs.onItem.call(scope, item);
			}
		}
	},

	_getItemByIdentity: function(/* Object */ identity){
		// summary:
		//		Internal function to look an item up by its identity map.
		var item = null;
		if(this._itemsByIdentity){
			// If this map is defined, we need to just try to get it.  If it fails
			// the item does not exist.
			if(Object.hasOwnProperty.call(this._itemsByIdentity, identity)){
				item = this._itemsByIdentity[identity];
			}
		}else if (Object.hasOwnProperty.call(this._arrayOfAllItems, identity)){
			item = this._arrayOfAllItems[identity];
		}
		if(item === undefined){
			item = null;
		}
		return item; // Object
	},

	getIdentityAttributes: function(/* dojo/data/api/Item */ item){
		// summary:
		//		See dojo/data/api/Identity.getIdentityAttributes()

		var identifier = this._features['dojo.data.api.Identity'];
		if(identifier === Number){
			// If (identifier === Number) it means getIdentity() just returns
			// an integer item-number for each item.  The dojo/data/api/Identity
			// spec says we need to return null if the identity is not composed
			// of attributes
			return null; // null
		}else{
			return [identifier]; // Array
		}
	},

	_forceLoad: function(){
		// summary:
		//		Internal function to force a load of the store if it hasn't occurred yet.  This is required
		//		for specific functions to work properly.
		var self = this;
		//Do a check on the JsonFileUrl and crosscheck it.
		//If it doesn't match the cross-check, it needs to be updated
		//This allows for either url or _jsonFileUrl to he changed to
		//reset the store load location.  Done this way for backwards
		//compatibility.  People use _jsonFileUrl (even though officially
		//private.
		if(this._jsonFileUrl !== this._ccUrl){
			kernel.deprecated(this.declaredClass + ": ",
				"To change the url, set the url property of the store," +
					" not _jsonFileUrl.  _jsonFileUrl support will be removed in 2.0");
			this._ccUrl = this._jsonFileUrl;
			this.url = this._jsonFileUrl;
		}else if(this.url !== this._ccUrl){
			this._jsonFileUrl = this.url;
			this._ccUrl = this.url;
		}

		//See if there was any forced reset of data.
		if(this.data != null){
			this._jsonData = this.data;
			this.data = null;
		}

		if(this._jsonFileUrl){
			var getArgs = {
				url: this._jsonFileUrl,
				handleAs: "json-comment-optional",
				preventCache: this.urlPreventCache,
				failOk: this.failOk,
				sync: true
			};
			var getHandler = xhr.get(getArgs);
			getHandler.addCallback(function(data){
				try{
					//Check to be sure there wasn't another load going on concurrently
					//So we don't clobber data that comes in on it.  If there is a load going on
					//then do not save this data.  It will potentially clobber current data.
					//We mainly wanted to sync/wait here.
					//TODO:  Revisit the loading scheme of this store to improve multi-initial
					//request handling.
					if(self._loadInProgress !== true && !self._loadFinished){
						self._getItemsFromLoadedData(data);
						self._loadFinished = true;
					}else if(self._loadInProgress){
						//Okay, we hit an error state we can't recover from.  A forced load occurred
						//while an async load was occurring.  Since we cannot block at this point, the best
						//that can be managed is to throw an error.
						throw new Error(this.declaredClass + ":  Unable to perform a synchronous load, an async load is in progress.");
					}
				}catch(e){
					console.log(e);
					throw e;
				}
			});
			getHandler.addErrback(function(error){
				throw error;
			});
		}else if(this._jsonData){
			self._getItemsFromLoadedData(self._jsonData);
			self._jsonData = null;
			self._loadFinished = true;
		}
	}
});
//Mix in the simple fetch implementation to this class.
lang.extend(ItemFileReadStore,simpleFetch);

return ItemFileReadStore;

});

},
'dojo/data/util/filter':function(){
define(["../../_base/lang"], function(lang){
	// module:
	//		dojo/data/util/filter
	// summary:
	//		TODOC

var filter = {};
lang.setObject("dojo.data.util.filter", filter);

filter.patternToRegExp = function(/*String*/pattern, /*boolean?*/ ignoreCase){
	// summary:
	//		Helper function to convert a simple pattern to a regular expression for matching.
	// description:
	//		Returns a regular expression object that conforms to the defined conversion rules.
	//		For example:
	//
	//		- ca*   -> /^ca.*$/
	//		- *ca*  -> /^.*ca.*$/
	//		- *c\*a*  -> /^.*c\*a.*$/
	//		- *c\*a?*  -> /^.*c\*a..*$/
	//
	//		and so on.
	// pattern: string
	//		A simple matching pattern to convert that follows basic rules:
	//
	//		- * Means match anything, so ca* means match anything starting with ca
	//		- ? Means match single character.  So, b?b will match to bob and bab, and so on.
	//		- \ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
	//
	//		To use a \ as a character in the string, it must be escaped.  So in the pattern it should be
	//		represented by \\ to be treated as an ordinary \ character instead of an escape.
	// ignoreCase:
	//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
	//		By default, it is assumed case sensitive.

	var rxp = "^";
	var c = null;
	for(var i = 0; i < pattern.length; i++){
		c = pattern.charAt(i);
		switch(c){
			case '\\':
				rxp += c;
				i++;
				rxp += pattern.charAt(i);
				break;
			case '*':
				rxp += ".*"; break;
			case '?':
				rxp += "."; break;
			case '$':
			case '^':
			case '/':
			case '+':
			case '.':
			case '|':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				rxp += "\\"; //fallthrough
			default:
				rxp += c;
		}
	}
	rxp += "$";
	if(ignoreCase){
		return new RegExp(rxp,"mi"); //RegExp
	}else{
		return new RegExp(rxp,"m"); //RegExp
	}

};

return filter;
});

},
'dojo/data/util/simpleFetch':function(){
define(["../../_base/lang", "../../_base/kernel", "./sorter"],
  function(lang, kernel, sorter){
	// module:
	//		dojo/data/util/simpleFetch
	// summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.

var simpleFetch = {};
lang.setObject("dojo.data.util.simpleFetch", simpleFetch);

simpleFetch.errorHandler = function(/*Object*/ errorData, /*Object*/ requestObject){
	// summary:
	//		The error handler when there is an error fetching items.  This function should not be called
	//		directly and is used by simpleFetch.fetch().
	if(requestObject.onError){
		var scope = requestObject.scope || kernel.global;
		requestObject.onError.call(scope, errorData, requestObject);
	}
};

simpleFetch.fetchHandler = function(/*Array*/ items, /*Object*/ requestObject){
	// summary:
	//		The handler when items are sucessfully fetched.  This function should not be called directly
	//		and is used by simpleFetch.fetch().
	var oldAbortFunction = requestObject.abort || null,
		aborted = false,

		startIndex = requestObject.start?requestObject.start: 0,
		endIndex = (requestObject.count && (requestObject.count !== Infinity))?(startIndex + requestObject.count):items.length;

	requestObject.abort = function(){
		aborted = true;
		if(oldAbortFunction){
			oldAbortFunction.call(requestObject);
		}
	};

	var scope = requestObject.scope || kernel.global;
	if(!requestObject.store){
		requestObject.store = this;
	}
	if(requestObject.onBegin){
		requestObject.onBegin.call(scope, items.length, requestObject);
	}
	if(requestObject.sort){
		items.sort(sorter.createSortFunction(requestObject.sort, this));
	}
	if(requestObject.onItem){
		for(var i = startIndex; (i < items.length) && (i < endIndex); ++i){
			var item = items[i];
			if(!aborted){
				requestObject.onItem.call(scope, item, requestObject);
			}
		}
	}
	if(requestObject.onComplete && !aborted){
		var subset = null;
		if(!requestObject.onItem){
			subset = items.slice(startIndex, endIndex);
		}
		requestObject.onComplete.call(scope, subset, requestObject);
	}
};

simpleFetch.fetch = function(/* Object? */ request){
	// summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.
	// description:
	//		The simpleFetch mixin should work well for any datastore that can respond to a _fetchItems()
	//		call by returning an array of all the found items that matched the query.  The simpleFetch mixin
	//		is not designed to work for datastores that respond to a fetch() call by incrementally
	//		loading items, or sequentially loading partial batches of the result
	//		set.  For datastores that mixin simpleFetch, simpleFetch
	//		implements a fetch method that automatically handles eight of the fetch()
	//		arguments -- onBegin, onItem, onComplete, onError, start, count, sort and scope
	//		The class mixing in simpleFetch should not implement fetch(),
	//		but should instead implement a _fetchItems() method.  The _fetchItems()
	//		method takes three arguments, the keywordArgs object that was passed
	//		to fetch(), a callback function to be called when the result array is
	//		available, and an error callback to be called if something goes wrong.
	//		The _fetchItems() method should ignore any keywordArgs parameters for
	//		start, count, onBegin, onItem, onComplete, onError, sort, and scope.
	//		The _fetchItems() method needs to correctly handle any other keywordArgs
	//		parameters, including the query parameter and any optional parameters
	//		(such as includeChildren).  The _fetchItems() method should create an array of
	//		result items and pass it to the fetchHandler along with the original request object --
	//		or, the _fetchItems() method may, if it wants to, create an new request object
	//		with other specifics about the request that are specific to the datastore and pass
	//		that as the request object to the handler.
	//
	//		For more information on this specific function, see dojo/data/api/Read.fetch()
	//
	// request:
	//		The keywordArgs parameter may either be an instance of
	//		conforming to dojo/data/api/Request or may be a simple anonymous object
	//		that may contain any of the following:
	// |	{
	// |		query: query-object or query-string,
	// |		queryOptions: object,
	// |		onBegin: Function,
	// |		onItem: Function,
	// |		onComplete: Function,
	// |		onError: Function,
	// |		scope: object,
	// |		start: int
	// |		count: int
	// |		sort: array
	// |	}
	//		All implementations should accept keywordArgs objects with any of
	//		the 9 standard properties: query, onBegin, onItem, onComplete, onError
	//		scope, sort, start, and count.  Some implementations may accept additional
	//		properties in the keywordArgs object as valid parameters, such as
	//		{includeOutliers:true}.
	//
	//		####The *query* parameter
	//
	//		The query may be optional in some data store implementations.
	//		The dojo/data/api/Read API does not specify the syntax or semantics
	//		of the query itself -- each different data store implementation
	//		may have its own notion of what a query should look like.
	//		However, as of dojo 0.9, 1.0, and 1.1, all the provided datastores in dojo.data
	//		and dojox.data support an object structure query, where the object is a set of
	//		name/value parameters such as { attrFoo: valueBar, attrFoo1: valueBar1}.  Most of the
	//		dijit widgets, such as ComboBox assume this to be the case when working with a datastore
	//		when they dynamically update the query.  Therefore, for maximum compatibility with dijit
	//		widgets the recommended query parameter is a key/value object.  That does not mean that the
	//		the datastore may not take alternative query forms, such as a simple string, a Date, a number,
	//		or a mix of such.  Ultimately, The dojo/data/api/Read API is agnostic about what the query
	//		format.
	//
	//		Further note:  In general for query objects that accept strings as attribute
	//		value matches, the store should also support basic filtering capability, such as *
	//		(match any character) and ? (match single character).  An example query that is a query object
	//		would be like: { attrFoo: "value*"}.  Which generally means match all items where they have
	//		an attribute named attrFoo, with a value that starts with 'value'.
	//
	//		####The *queryOptions* parameter
	//
	//		The queryOptions parameter is an optional parameter used to specify options that may modify
	//		the query in some fashion, such as doing a case insensitive search, or doing a deep search
	//		where all items in a hierarchical representation of data are scanned instead of just the root
	//		items.  It currently defines two options that all datastores should attempt to honor if possible:
	// |	{
	// |		ignoreCase: boolean, // Whether or not the query should match case sensitively or not.  Default behaviour is false.
	// |		deep: boolean	// Whether or not a fetch should do a deep search of items and all child
	// |						// items instead of just root-level items in a datastore.  Default is false.
	// |	}
	//
	//		####The *onBegin* parameter.
	//
	//		function(size, request);
	//		If an onBegin callback function is provided, the callback function
	//		will be called just once, before the first onItem callback is called.
	//		The onBegin callback function will be passed two arguments, the
	//		the total number of items identified and the Request object.  If the total number is
	//		unknown, then size will be -1.  Note that size is not necessarily the size of the
	//		collection of items returned from the query, as the request may have specified to return only a
	//		subset of the total set of items through the use of the start and count parameters.
	//
	//		####The *onItem* parameter.
	//
	//		function(item, request);
	//
	//		If an onItem callback function is provided, the callback function
	//		will be called as each item in the result is received. The callback
	//		function will be passed two arguments: the item itself, and the
	//		Request object.
	//
	//		####The *onComplete* parameter.
	//
	//		function(items, request);
	//
	//		If an onComplete callback function is provided, the callback function
	//		will be called just once, after the last onItem callback is called.
	//		Note that if the onItem callback is not present, then onComplete will be passed
	//		an array containing all items which matched the query and the request object.
	//		If the onItem callback is present, then onComplete is called as:
	//		onComplete(null, request).
	//
	//		####The *onError* parameter.
	//
	//		function(errorData, request);
	//
	//		If an onError callback function is provided, the callback function
	//		will be called if there is any sort of error while attempting to
	//		execute the query.
	//		The onError callback function will be passed two arguments:
	//		an Error object and the Request object.
	//
	//		####The *scope* parameter.
	//
	//		If a scope object is provided, all of the callback functions (onItem,
	//		onComplete, onError, etc) will be invoked in the context of the scope
	//		object.  In the body of the callback function, the value of the "this"
	//		keyword will be the scope object.   If no scope object is provided,
	//		the callback functions will be called in the context of dojo.global().
	//		For example, onItem.call(scope, item, request) vs.
	//		onItem.call(dojo.global(), item, request)
	//
	//		####The *start* parameter.
	//
	//		If a start parameter is specified, this is a indication to the datastore to
	//		only start returning items once the start number of items have been located and
	//		skipped.  When this parameter is paired with 'count', the store should be able
	//		to page across queries with millions of hits by only returning subsets of the
	//		hits for each query
	//
	//		####The *count* parameter.
	//
	//		If a count parameter is specified, this is a indication to the datastore to
	//		only return up to that many items.  This allows a fetch call that may have
	//		millions of item matches to be paired down to something reasonable.
	//
	//		####The *sort* parameter.
	//
	//		If a sort parameter is specified, this is a indication to the datastore to
	//		sort the items in some manner before returning the items.  The array is an array of
	//		javascript objects that must conform to the following format to be applied to the
	//		fetching of items:
	// |	{
	// |		attribute: attribute || attribute-name-string,
	// |		descending: true|false;   // Optional.  Default is false.
	// |	}
	//		Note that when comparing attributes, if an item contains no value for the attribute
	//		(undefined), then it the default ascending sort logic should push it to the bottom
	//		of the list.  In the descending order case, it such items should appear at the top of the list.

	request = request || {};
	if(!request.store){
		request.store = this;
	}

	this._fetchItems(request, lang.hitch(this, "fetchHandler"), lang.hitch(this, "errorHandler"));
	return request;	// Object
};

return simpleFetch;
});

},
'dojo/data/util/sorter':function(){
define(["../../_base/lang"], function(lang){
	// module:
	//		dojo/data/util/sorter
	// summary:
	//		TODOC

var sorter = {};
lang.setObject("dojo.data.util.sorter", sorter);

sorter.basicComparator = function(	/*anything*/ a,
													/*anything*/ b){
	// summary:
	//		Basic comparison function that compares if an item is greater or less than another item
	// description:
	//		returns 1 if a > b, -1 if a < b, 0 if equal.
	//		'null' values (null, undefined) are treated as larger values so that they're pushed to the end of the list.
	//		And compared to each other, null is equivalent to undefined.

	//null is a problematic compare, so if null, we set to undefined.
	//Makes the check logic simple, compact, and consistent
	//And (null == undefined) === true, so the check later against null
	//works for undefined and is less bytes.
	var r = -1;
	if(a === null){
		a = undefined;
	}
	if(b === null){
		b = undefined;
	}
	if(a == b){
		r = 0;
	}else if(a > b || a == null){
		r = 1;
	}
	return r; //int {-1,0,1}
};

sorter.createSortFunction = function(	/* attributes[] */sortSpec, /*dojo/data/api/Read*/ store){
	// summary:
	//		Helper function to generate the sorting function based off the list of sort attributes.
	// description:
	//		The sort function creation will look for a property on the store called 'comparatorMap'.  If it exists
	//		it will look in the mapping for comparisons function for the attributes.  If one is found, it will
	//		use it instead of the basic comparator, which is typically used for strings, ints, booleans, and dates.
	//		Returns the sorting function for this particular list of attributes and sorting directions.
	// sortSpec:
	//		A JS object that array that defines out what attribute names to sort on and whether it should be descenting or asending.
	//		The objects should be formatted as follows:
	// |	{
	// |		attribute: "attributeName-string" || attribute,
	// |		descending: true|false;   // Default is false.
	// |	}
	// store:
	//		The datastore object to look up item values from.

	var sortFunctions=[];

	function createSortFunction(attr, dir, comp, s){
		//Passing in comp and s (comparator and store), makes this
		//function much faster.
		return function(itemA, itemB){
			var a = s.getValue(itemA, attr);
			var b = s.getValue(itemB, attr);
			return dir * comp(a,b); //int
		};
	}
	var sortAttribute;
	var map = store.comparatorMap;
	var bc = sorter.basicComparator;
	for(var i = 0; i < sortSpec.length; i++){
		sortAttribute = sortSpec[i];
		var attr = sortAttribute.attribute;
		if(attr){
			var dir = (sortAttribute.descending) ? -1 : 1;
			var comp = bc;
			if(map){
				if(typeof attr !== "string" && ("toString" in attr)){
					 attr = attr.toString();
				}
				comp = map[attr] || bc;
			}
			sortFunctions.push(createSortFunction(attr,
				dir, comp, store));
		}
	}
	return function(rowA, rowB){
		var i=0;
		while(i < sortFunctions.length){
			var ret = sortFunctions[i++](rowA, rowB);
			if(ret !== 0){
				return ret;//int
			}
		}
		return 0; //int
	}; // Function
};

return sorter;
});

},
'dojo/date/stamp':function(){
define(["../_base/lang", "../_base/array"], function(lang, array){

// module:
//		dojo/date/stamp

var stamp = {
	// summary:
	//		TODOC
};
lang.setObject("dojo.date.stamp", stamp);

// Methods to convert dates to or from a wire (string) format using well-known conventions

stamp.fromISOString = function(/*String*/ formattedString, /*Number?*/ defaultTime){
	// summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
	//
	// description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		[RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
	//		Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
	//		The following combinations are valid:
	//
	//		- dates only
	//			- yyyy
	//			- yyyy-MM
	//			- yyyy-MM-dd
	//		- times only, with an optional time zone appended
	//			- THH:mm
	//			- THH:mm:ss
	//			- THH:mm:ss.SSS
	//		- and "datetimes" which could be any combination of the above
	//
	//		timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return null.  Arguments which are out of bounds will be handled
	//		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//		Only years between 100 and 9999 are supported.
  	// formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	// defaultTime:
	//		Used for defaults for fields omitted in the formattedString.
	//		Uses 1970-01-01T00:00:00.0Z by default.

	if(!stamp._isoRegExp){
		stamp._isoRegExp =
//TODO: could be more restrictive and check for 00-59, etc.
			/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
	}

	var match = stamp._isoRegExp.exec(formattedString),
		result = null;

	if(match){
		match.shift();
		if(match[1]){match[1]--;} // Javascript Date months are 0-based
		if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

		if(defaultTime){
			// mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
			defaultTime = new Date(defaultTime);
			array.forEach(array.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
				return defaultTime["get" + prop]();
			}), function(value, index){
				match[index] = match[index] || value;
			});
		}
		result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0); //TODO: UTC defaults
		if(match[0] < 100){
			result.setFullYear(match[0] || 1970);
		}

		var offset = 0,
			zoneSign = match[7] && match[7].charAt(0);
		if(zoneSign != 'Z'){
			offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
			if(zoneSign != '-'){ offset *= -1; }
		}
		if(zoneSign){
			offset -= result.getTimezoneOffset();
		}
		if(offset){
			result.setTime(result.getTime() + offset * 60000);
		}
	}

	return result; // Date or null
};

/*=====
var __Options = {
	// selector: String
	//		"date" or "time" for partial formatting of the Date object.
	//		Both date and time will be formatted by default.
	// zulu: Boolean
	//		if true, UTC/GMT is used for a timezone
	// milliseconds: Boolean
	//		if true, output milliseconds
};
=====*/

stamp.toISOString = function(/*Date*/ dateObject, /*__Options?*/ options){
	// summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	// description:
	//		When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
	//		The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
	//		Does not check bounds.  Only years between 100 and 9999 are supported.
	//
	// dateObject:
	//		A Date object

	var _ = function(n){ return (n < 10) ? "0" + n : n; };
	options = options || {};
	var formattedDate = [],
		getter = options.zulu ? "getUTC" : "get",
		date = "";
	if(options.selector != "time"){
		var year = dateObject[getter+"FullYear"]();
		date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
		var millis = dateObject[getter+"Milliseconds"]();
		if(options.milliseconds){
			time += "."+ (millis < 100 ? "0" : "") + _(millis);
		}
		if(options.zulu){
			time += "Z";
		}else if(options.selector != "time"){
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") +
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
};

return stamp;
});

},
'dijit/registry':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/window", // win.body
	"./main"	// dijit._scopeName
], function(array, win, dijit){

	// module:
	//		dijit/registry

	var _widgetTypeCtr = {}, hash = {};

	var registry =  {
		// summary:
		//		Registry of existing widget on page, plus some utility methods.

		// length: Number
		//		Number of registered widgets
		length: 0,

		add: function(widget){
			// summary:
			//		Add a widget to the registry. If a duplicate ID is detected, a error is thrown.
			// widget: dijit/_WidgetBase
			//		Any dijit/_WidgetBase subclass.
			if(hash[widget.id]){
				throw new Error("Tried to register widget with id==" + widget.id + " but that id is already registered");
			}
			hash[widget.id] = widget;
			this.length++;
		},

		remove: function(/*String*/ id){
			// summary:
			//		Remove a widget from the registry. Does not destroy the widget; simply
			//		removes the reference.
			if(hash[id]){
				delete hash[id];
				this.length--;
			}
		},

		byId: function(/*String|Widget*/ id){
			// summary:
			//		Find a widget by it's id.
			//		If passed a widget then just returns the widget.
			return typeof id == "string" ? hash[id] : id;	// dijit/_WidgetBase
		},

		byNode: function(/*DOMNode*/ node){
			// summary:
			//		Returns the widget corresponding to the given DOMNode
			return hash[node.getAttribute("widgetId")]; // dijit/_WidgetBase
		},

		toArray: function(){
			// summary:
			//		Convert registry into a true Array
			//
			// example:
			//		Work with the widget .domNodes in a real Array
			//		|	array.map(registry.toArray(), function(w){ return w.domNode; });

			var ar = [];
			for(var id in hash){
				ar.push(hash[id]);
			}
			return ar;	// dijit/_WidgetBase[]
		},

		getUniqueId: function(/*String*/widgetType){
			// summary:
			//		Generates a unique id for a given widgetType

			var id;
			do{
				id = widgetType + "_" +
					(widgetType in _widgetTypeCtr ?
						++_widgetTypeCtr[widgetType] : _widgetTypeCtr[widgetType] = 0);
			}while(hash[id]);
			return dijit._scopeName == "dijit" ? id : dijit._scopeName + "_" + id; // String
		},

		findWidgets: function(root, skipNode){
			// summary:
			//		Search subtree under root returning widgets found.
			//		Doesn't search for nested widgets (ie, widgets inside other widgets).
			// root: DOMNode
			//		Node to search under.
			// skipNode: DOMNode
			//		If specified, don't search beneath this node (usually containerNode).

			var outAry = [];

			function getChildrenHelper(root){
				for(var node = root.firstChild; node; node = node.nextSibling){
					if(node.nodeType == 1){
						var widgetId = node.getAttribute("widgetId");
						if(widgetId){
							var widget = hash[widgetId];
							if(widget){	// may be null on page w/multiple dojo's loaded
								outAry.push(widget);
							}
						}else if(node !== skipNode){
							getChildrenHelper(node);
						}
					}
				}
			}

			getChildrenHelper(root);
			return outAry;
		},

		_destroyAll: function(){
			// summary:
			//		Code to destroy all widgets and do other cleanup on page unload

			// Clean up focus manager lingering references to widgets and nodes
			dijit._curFocus = null;
			dijit._prevFocus = null;
			dijit._activeStack = [];

			// Destroy all the widgets, top down
			array.forEach(registry.findWidgets(win.body()), function(widget){
				// Avoid double destroy of widgets like Menu that are attached to <body>
				// even though they are logically children of other widgets.
				if(!widget._destroyed){
					if(widget.destroyRecursive){
						widget.destroyRecursive();
					}else if(widget.destroy){
						widget.destroy();
					}
				}
			});
		},

		getEnclosingWidget: function(/*DOMNode*/ node){
			// summary:
			//		Returns the widget whose DOM tree contains the specified DOMNode, or null if
			//		the node is not contained within the DOM tree of any widget
			while(node){
				var id = node.nodeType == 1 && node.getAttribute("widgetId");
				if(id){
					return hash[id];
				}
				node = node.parentNode;
			}
			return null;
		},

		// In case someone needs to access hash.
		// Actually, this is accessed from WidgetSet back-compatibility code
		_hash: hash
	};

	dijit.registry = registry;

	return registry;
});

},
'dijit/main':function(){
define([
	"dojo/_base/kernel"
], function(dojo){
	// module:
	//		dijit/main

/*=====
return {
	// summary:
	//		The dijit package main module.
	//		Deprecated.   Users should access individual modules (ex: dijit/registry) directly.
};
=====*/

	return dojo.dijit;
});

},
'dojox/highlight':function(){
define(["./highlight/_base"], function(highlight){
	/*=====
	 return {
	 // summary:
	 //		Deprecated.  Should require dojox/highlight modules directly rather than trying to access them through
	 //		this module.
	 };
	 =====*/
	return highlight;
});

},
'dojox/highlight/_base':function(){
define([
	"dojo/_base/lang", 
	"dojo/_base/array", 
	"dojo/dom", 
	"dojo/dom-class"
], function(lang, array, dom, domClass){


	var dh = lang.getObject("dojox.highlight", true),
		C_NUMBER_RE = '\\b(0x[A-Za-z0-9]+|\\d+(\\.\\d+)?)'
	;
	/*=====
	 dh = {
		 // summary:
		 //		Syntax highlighting with language auto-detection package
		 // description:
		 //		Syntax highlighting with language auto-detection package.
		 //		Released under CLA by the Dojo Toolkit, original BSD release
		 //		available from: http://softwaremaniacs.org/soft/highlight/
	 };
	 =====*/

	dh.languages = dh.languages || {};
	// constants

	dh.constants = {
		IDENT_RE: '[a-zA-Z][a-zA-Z0-9_]*',
		UNDERSCORE_IDENT_RE: '[a-zA-Z_][a-zA-Z0-9_]*',
		NUMBER_RE: '\\b\\d+(\\.\\d+)?',
		C_NUMBER_RE: C_NUMBER_RE,
		// Common modes
		APOS_STRING_MODE: {
			className: 'string',
			begin: '\'', end: '\'',
			illegal: '\\n',
			contains: ['escape'],
			relevance: 0
		},
		QUOTE_STRING_MODE: {
			className: 'string',
			begin: '"',
			end: '"',
			illegal: '\\n',
			contains: ['escape'],
			relevance: 0
		},
		BACKSLASH_ESCAPE: {
			className: 'escape',
			begin: '\\\\.', end: '^',
			relevance: 0
		},
		C_LINE_COMMENT_MODE: {
			className: 'comment',
			begin: '//', end: '$',
			relevance: 0
		},
		C_BLOCK_COMMENT_MODE: {
			className: 'comment',
			begin: '/\\*', end: '\\*/'
		},
		HASH_COMMENT_MODE: {
			className: 'comment',
			begin: '#', end: '$'
		},
		C_NUMBER_MODE: {
			className: 'number',
			begin: C_NUMBER_RE, end: '^',
			relevance: 0
		}
	};

	// utilities
	
	function esc(value){
		return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
	}
	
	function verifyText(block){
		return array.every(block.childNodes, function(node){
			return node.nodeType == 3 || String(node.nodeName).toLowerCase() == 'br';
		});
	}

	function blockText(block){
		var result = [];
		array.forEach(block.childNodes, function(node){
			if(node.nodeType == 3){
				result.push(node.nodeValue);
			}else if(String(node.nodeName).toLowerCase() == 'br'){
				result.push("\n");
			}else{
				throw 'Complex markup';
			}
		});
		return result.join("");
	}

	function buildKeywordGroups(mode){
		if(!mode.keywordGroups){
			for(var key in mode.keywords){
				var kw = mode.keywords[key];
    			if(kw instanceof Object){  // dojo.isObject?
					mode.keywordGroups = mode.keywords;
				}else{
					mode.keywordGroups = {keyword: mode.keywords};
				}
				break;
			}
		}
	}
	
	function buildKeywords(language){
		if(language.defaultMode && language.modes){
			buildKeywordGroups(language.defaultMode);
			array.forEach(language.modes, buildKeywordGroups);
		}
	}
	
	// main object

	var Highlighter = function(langName, textBlock){
		// initialize the state
		this.langName = langName;
		this.lang = dh.languages[langName];
		this.modes = [this.lang.defaultMode];
		this.relevance = 0;
		this.keywordCount = 0;
		this.result = [];
		
		// build resources lazily
		if(!this.lang.defaultMode.illegalRe){
			this.buildRes();
			buildKeywords(this.lang);
		}
		
		// run the algorithm
		try{
			this.highlight(textBlock);
			this.result = this.result.join("");
		}catch(e){
			if(e == 'Illegal'){
				this.relevance = 0;
				this.keywordCount = 0;
				this.partialResult = this.result.join("");
				this.result = esc(textBlock);
			}else{
				throw e;
			}
		}
	};

	lang.extend(Highlighter, {
		buildRes: function(){
			array.forEach(this.lang.modes, function(mode){
				if(mode.begin){
					mode.beginRe = this.langRe('^' + mode.begin);
				}
				if(mode.end){
					mode.endRe = this.langRe('^' + mode.end);
				}
				if(mode.illegal){
					mode.illegalRe = this.langRe('^(?:' + mode.illegal + ')');
				}
			}, this);
			this.lang.defaultMode.illegalRe = this.langRe('^(?:' + this.lang.defaultMode.illegal + ')');
		},
		
		subMode: function(lexeme){
			var classes = this.modes[this.modes.length - 1].contains;
			if(classes){
				var modes = this.lang.modes;
				for(var i = 0; i < classes.length; ++i){
					var className = classes[i];
					for(var j = 0; j < modes.length; ++j){
						var mode = modes[j];
						if(mode.className == className && mode.beginRe.test(lexeme)){ return mode; }
					}
				}
			}
			return null;
		},

		endOfMode: function(lexeme){
			for(var i = this.modes.length - 1; i >= 0; --i){
				var mode = this.modes[i];
				if(mode.end && mode.endRe.test(lexeme)){ return this.modes.length - i; }
				if(!mode.endsWithParent){ break; }
			}
			return 0;
		},

		isIllegal: function(lexeme){
			var illegalRe = this.modes[this.modes.length - 1].illegalRe;
			return illegalRe && illegalRe.test(lexeme);
		},


		langRe: function(value, global){
			var mode =  'm' + (this.lang.case_insensitive ? 'i' : '') + (global ? 'g' : '');
			return new RegExp(value, mode);
		},
	
		buildTerminators: function(){
			var mode = this.modes[this.modes.length - 1],
				terminators = {};
			if(mode.contains){
				array.forEach(this.lang.modes, function(lmode){
					if(array.indexOf(mode.contains, lmode.className) >= 0){
						terminators[lmode.begin] = 1;
					}
				});
			}
			for(var i = this.modes.length - 1; i >= 0; --i){
				var m = this.modes[i];
				if(m.end){ terminators[m.end] = 1; }
				if(!m.endsWithParent){ break; }
			}
			if(mode.illegal){ terminators[mode.illegal] = 1; }
			var t = [];
			for(i in terminators){ t.push(i); }
			mode.terminatorsRe = this.langRe("(" + t.join("|") + ")");
		},

		eatModeChunk: function(value, index){
			var mode = this.modes[this.modes.length - 1];
			
			// create terminators lazily
			if(!mode.terminatorsRe){
				this.buildTerminators();
			}
	
			value = value.substr(index);
			var match = mode.terminatorsRe.exec(value);
			if(!match){
				return {
					buffer: value,
					lexeme: "",
					end:    true
				};
			}
			return {
				buffer: match.index ? value.substr(0, match.index) : "",
				lexeme: match[0],
				end:    false
			};
		},
	
		keywordMatch: function(mode, match){
			var matchStr = match[0];
			if(this.lang.case_insensitive){ matchStr = matchStr.toLowerCase(); }
			for(var className in mode.keywordGroups){
				if(matchStr in mode.keywordGroups[className]){ return className; }
			}
			return "";
		},
		
		buildLexemes: function(mode){
			var lexemes = {};
			array.forEach(mode.lexems, function(lexeme){
				lexemes[lexeme] = 1;
			});
			var t = [];
			for(var i in lexemes){ t.push(i); }
			mode.lexemsRe = this.langRe("(" + t.join("|") + ")", true);
		},
	
		processKeywords: function(buffer){
			var mode = this.modes[this.modes.length - 1];
			if(!mode.keywords || !mode.lexems){
				return esc(buffer);
			}
			
			// create lexemes lazily
			if(!mode.lexemsRe){
				this.buildLexemes(mode);
			}
			
			mode.lexemsRe.lastIndex = 0;
			var result = [], lastIndex = 0,
				match = mode.lexemsRe.exec(buffer);
			while(match){
				result.push(esc(buffer.substr(lastIndex, match.index - lastIndex)));
				var keywordM = this.keywordMatch(mode, match);
				if(keywordM){
					++this.keywordCount;
					result.push('<span class="'+ keywordM +'">' + esc(match[0]) + '</span>');
				}else{
					result.push(esc(match[0]));
				}
				lastIndex = mode.lexemsRe.lastIndex;
				match = mode.lexemsRe.exec(buffer);
			}
			result.push(esc(buffer.substr(lastIndex, buffer.length - lastIndex)));
			return result.join("");
		},
	
		processModeInfo: function(buffer, lexeme, end) {
			var mode = this.modes[this.modes.length - 1];
			if(end){
				this.result.push(this.processKeywords(mode.buffer + buffer));
				return;
			}
			if(this.isIllegal(lexeme)){ throw 'Illegal'; }
			var newMode = this.subMode(lexeme);
			if(newMode){
				mode.buffer += buffer;
				this.result.push(this.processKeywords(mode.buffer));
				if(newMode.excludeBegin){
					this.result.push(lexeme + '<span class="' + newMode.className + '">');
					newMode.buffer = '';
				}else{
					this.result.push('<span class="' + newMode.className + '">');
					newMode.buffer = lexeme;
				}
				this.modes.push(newMode);
				this.relevance += typeof newMode.relevance == "number" ? newMode.relevance : 1;
				return;
			}
			var endLevel = this.endOfMode(lexeme);
			if(endLevel){
				mode.buffer += buffer;
				if(mode.excludeEnd){
					this.result.push(this.processKeywords(mode.buffer) + '</span>' + lexeme);
				}else{
					this.result.push(this.processKeywords(mode.buffer + lexeme) + '</span>');
				}
				while(endLevel > 1){
					this.result.push('</span>');
					--endLevel;
					this.modes.pop();
				}
				this.modes.pop();
				this.modes[this.modes.length - 1].buffer = '';
				return;
			}
		},
	
		highlight: function(value){
			var index = 0;
			this.lang.defaultMode.buffer = '';
			do{
				var modeInfo = this.eatModeChunk(value, index);
				this.processModeInfo(modeInfo.buffer, modeInfo.lexeme, modeInfo.end);
				index += modeInfo.buffer.length + modeInfo.lexeme.length;
			}while(!modeInfo.end);
			if(this.modes.length > 1){
				throw 'Illegal';
			}
		}
	});
	
	// more utilities
	
	function replaceText(node, className, text){
		if(String(node.tagName).toLowerCase() == "code" && String(node.parentNode.tagName).toLowerCase() == "pre"){
			// See these 4 lines? This is IE's notion of "node.innerHTML = text". Love this browser :-/
			var container = document.createElement('div'),
				environment = node.parentNode.parentNode;
			container.innerHTML = '<pre><code class="' + className + '">' + text + '</code></pre>';
			environment.replaceChild(container.firstChild, node.parentNode);
		}else{
			node.className = className;
			node.innerHTML = text;
		}
	}
	function highlightStringLanguage(language, str){
		var highlight = new Highlighter(language, str);
		return {result:highlight.result, langName:language, partialResult:highlight.partialResult};
	}

	function highlightLanguage(block, language){
		var result = highlightStringLanguage(language, blockText(block));
		replaceText(block, block.className, result.result);
	}

	function highlightStringAuto(str){
		var result = "", langName = "", bestRelevance = 2,
			textBlock = str;
		for(var key in dh.languages){
			if(!dh.languages[key].defaultMode){ continue; }	// skip internal members
			var highlight = new Highlighter(key, textBlock),
				relevance = highlight.keywordCount + highlight.relevance, relevanceMax = 0;
			if(!result || relevance > relevanceMax){
				relevanceMax = relevance;
				result = highlight.result;
				langName = highlight.langName;
			}
		}
		return {result:result, langName:langName};
	}
	
	function highlightAuto(block){
		var result = highlightStringAuto(blockText(block));
		if(result.result){
			replaceText(block, result.langName, result.result);
		}
	}
	
	// the public API

	dojox.highlight.processString = function(/* String */ str, /* String? */lang){
		// summary:
		//		highlight a string of text
		// returns: Object
		//		Object containing:
		//
		//		- result - string of html with spans to apply formatting
		//		- partialResult - if the formatting failed: string of html
		//		  up to the point of the failure, otherwise: undefined
		//		- langName - the language used to do the formatting
		return lang ? highlightStringLanguage(lang, str) : highlightStringAuto(str);
	};

	dojox.highlight.init = function(/* String|DomNode */ node){
		// summary:
		//		Highlight a passed node
		// description:
		//		Syntax highlight a passed DomNode or String ID of a DomNode
		// example:
		//	|	dojox.highlight.init("someId");
		//
		node = dom.byId(node);
		if(domClass.contains(node, "no-highlight")){ return; }
		if(!verifyText(node)){ return; }
	
		var classes = node.className.split(/\s+/),
			flag = array.some(classes, function(className){
				if(className.charAt(0) != "_" && dh.languages[className]){
					highlightLanguage(node, className);
					return true;	// stop iterations
				}
				return false;	// continue iterations
			});
		if(!flag){
			highlightAuto(node);
		}
	};

	dh.Code = function(props, node){
		// summary:
		//		A class object to allow for dojoType usage with the highlight engine. This is
		//		NOT a Widget in the conventional sense, and does not have any member functions for
		//		the instance. This is provided as a convenience. You likely should be calling
		//		`dojox.highlight.init` directly.
		// props: Object?
		//		Unused. Pass 'null' or {}. Positional usage to allow `dojo.parser` to instantiate
		//		this class as other Widgets would be.
		// node: String|DomNode
		//		A String ID or DomNode reference to use as the root node of this instance.
		// example:
		//	|	<pre><code dojoType="dojox.highlight.Code">for(var i in obj){ ... }</code></pre>
		//
		// example:
		//	|	var inst = new dojox.highlight.Code({}, "someId");
		//
		dh.init(node);
	};

	return dh;

});

},
'dojox/highlight/languages/javascript':function(){
define(["../_base"], function(dh){

	var dhc = dh.constants;
	dh.languages.javascript = {
		defaultMode: {
			lexems: [dhc.UNDERSCORE_IDENT_RE],
			contains: ['string', 'comment', 'number', 'regexp', 'function'],
			keywords: {
				'keyword': {
					'in': 1, 'if': 1, 'for': 1, 'while': 1, 'finally': 1, 'var': 1,
					'new': 1, 'function': 1, 'do': 1, 'return': 1, 'void': 1,
					'else': 1, 'break': 1, 'catch': 1, 'instanceof': 1, 'with': 1,
					'throw': 1, 'case': 1, 'default': 1, 'try': 1, 'this': 1,
					'switch': 1, 'continue': 1, 'typeof': 1, 'delete': 1
				},
				'literal': {'true': 1, 'false': 1, 'null': 1}
			}
		},
		modes: [
			dhc.C_LINE_COMMENT_MODE,
			dhc.C_BLOCK_COMMENT_MODE,
			dhc.C_NUMBER_MODE,
			dhc.APOS_STRING_MODE,
			dhc.QUOTE_STRING_MODE,
			dhc.BACKSLASH_ESCAPE,
			{
				className: 'regexp',
				begin: '/.*?[^\\\\/]/[gim]*', end: '^'
			},
			{
				className: 'function',
				begin: 'function\\b', end: '{',
				lexems: [dhc.UNDERSCORE_IDENT_RE],
				keywords: {'function': 1},
				contains: ['title', 'params']
			},
			{
				className: 'title',
				begin: dhc.UNDERSCORE_IDENT_RE, end: '^'
			},
			{
				className: 'params',
				begin: '\\(', end: '\\)',
				contains: ['string', 'comment']
			}
		]
	};

	return dh.languages.javascript;
});

},
'dojox/mobile/compat':function(){
define([
	"dojo/_base/lang",
	"dojo/sniff"
], function(lang, has){
	// module:
	//		dojox/mobile/compat

	var dm = lang.getObject("dojox.mobile", true);
	// TODO: Use feature detection instead, but this would require a major rewrite of _compat
	// to detect each feature and plug the corresponding compat code if needed.
	// Currently the compat code is a workaround for too many different things to be able to
	// decide based on feature detection. So for now we just disable _compat on the mobile browsers
	// that are known to support enough CSS3: all webkit-based browsers and IE10 (Windows [Phone] 8).
	if(!(has("webkit") || has("ie") >= 10)){
		var s = "dojox/mobile/_compat"; // assign to a variable so as not to be picked up by the build tool
		require([s]);
	}
	
	/*=====
	return {
		// summary:
		//		CSS3 compatibility module.
		// description:
		//		This module provides to dojox/mobile support for some of the CSS3 features 
		//		in non-CSS3 browsers, such as IE or Firefox.
		//		If you require this module, when running in a non-CSS3 browser it directly 
		//		replaces some of the methods of	dojox/mobile classes, without any subclassing. 
		//		This way, HTML pages remain the same regardless of whether this compatibility 
		//		module is used or not.
		//
		//		Example of usage: 
		//		|	require([
		//		|		"dojox/mobile",
		//		|		"dojox/mobile/compat",
		//		|		...
		//		|	], function(...){
		//		|		...
		//		|	});
		//
		//		This module also loads compatibility CSS files, which have a -compat.css
		//		suffix. You can use either the `<link>` tag or `@import` to load theme
		//		CSS files. Then, this module searches for the loaded CSS files and loads
		//		compatibility CSS files. For example, if you load dojox/mobile/themes/iphone/iphone.css
		//		in a page, this module automatically loads dojox/mobile/themes/iphone/iphone-compat.css.
		//		If you explicitly load iphone-compat.css with `<link>` or `@import`,
		//		this module will not load again the already loaded file.
		//
		//		Note that, by default, compatibility CSS files are only loaded for CSS files located
		//		in a directory containing a "mobile/themes" path. For that, a matching is done using 
		//		the default pattern	"/\/mobile\/themes\/.*\.css$/". If a custom theme is not located 
		//		in a directory containing this path, the data-dojo-config needs to specify a custom 
		//		pattern using the "mblLoadCompatPattern" configuration parameter, for instance:
		// |	data-dojo-config="mblLoadCompatPattern: /\/mycustomtheme\/.*\.css$/"
	};
	=====*/
	return dm;
});

},
'dojox/mobile/parser':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/config",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/ready"
], function(dojo, array, config, lang, win, ready){

	// module:
	//		dojox/mobile/parser

	var dm = lang.getObject("dojox.mobile", true);

	var Parser = function(){
		// summary:
		//		A lightweight parser.
		// description:
		//		dojox/mobile/parser is an extremely small subset of dojo/parser.
		//		It has no additional features over dojo/parser, so there is no
		//		benefit in terms of features by using dojox/mobile/parser instead 
		//		of dojo/parser.	However, if dojox/mobile/parser's capabilities are
		//		enough for your	application, using it could reduce the total code size.

		var _ctorMap = {};
		var getCtor = function(type, mixins){
			if(typeof(mixins) === "string"){
				var t = type + ":" + mixins.replace(/ /g, "");
				return _ctorMap[t] ||
					(_ctorMap[t] = getCtor(type).createSubclass(array.map(mixins.split(/, */), getCtor)));
			}
			return _ctorMap[type] || (_ctorMap[type] = lang.getObject(type) || require(type));
		};
		var _eval = function(js){ return eval(js); };

		this.instantiate = function(/* DomNode[] */nodes, /* Object? */mixin, /* Object? */options){
			// summary:
			//		Function for instantiating a list of widget nodes.
			// nodes:
			//		The list of DomNodes to walk and instantiate widgets on.
			mixin = mixin || {};
			options = options || {};
			var i, ws = [];
			if(nodes){
				for(i = 0; i < nodes.length; i++){
					var n = nodes[i],
						type = n._type,
						ctor = getCtor(type, n.getAttribute("data-dojo-mixins")),
						proto = ctor.prototype,
						params = {}, prop, v, t;
					lang.mixin(params, _eval.call(options.propsThis, '({'+(n.getAttribute("data-dojo-props")||"")+'})'));
					lang.mixin(params, options.defaults);
					lang.mixin(params, mixin);
					for(prop in proto){
						v = n.getAttributeNode(prop);
						v = v && v.nodeValue;
						t = typeof proto[prop];
						if(!v && (t !== "boolean" || v !== "")){ continue; }
						if(lang.isArray(proto[prop])){
							params[prop] = v.split(/\s*,\s*/);
						}else if(t === "string"){
							params[prop] = v;
						}else if(t === "number"){
							params[prop] = v - 0;
						}else if(t === "boolean"){
							params[prop] = (v !== "false");
						}else if(t === "object"){
							params[prop] = eval("(" + v + ")");
						}else if(t === "function"){
							params[prop] = lang.getObject(v, false) || new Function(v);
							n.removeAttribute(prop);
						}
					}
					params["class"] = n.className;
					if(!params.style){ params.style = n.style.cssText; }
					v = n.getAttribute("data-dojo-attach-point");
					if(v){ params.dojoAttachPoint = v; }
					v = n.getAttribute("data-dojo-attach-event");
					if(v){ params.dojoAttachEvent = v; }
					var instance = new ctor(params, n);
					ws.push(instance);
					var jsId = n.getAttribute("jsId") || n.getAttribute("data-dojo-id");
					if(jsId){
						lang.setObject(jsId, instance);
					}
				}
				for(i = 0; i < ws.length; i++){
					var w = ws[i];
					!options.noStart && w.startup && !w._started && w.startup();
				}
			}
			return ws;
		};

		this.parse = function(/* DomNode */ rootNode, /* Object? */ options){
			// summary:
			//		Function to handle parsing for widgets in the current document.
			//		It is not as powerful as the full parser, but it will handle basic
			//		use cases fine.
			// rootNode:
			//		The root node in the document to parse from
			if(!rootNode){
				rootNode = win.body();
			}else if(!options && rootNode.rootNode){
				// Case where 'rootNode' is really a params object.
				options = rootNode;
				rootNode = rootNode.rootNode;
			}

			var nodes = rootNode.getElementsByTagName("*");
			var i, j, list = [];
			for(i = 0; i < nodes.length; i++){
				var n = nodes[i],
					type = (n._type = n.getAttribute("dojoType") || n.getAttribute("data-dojo-type"));
				if(type){
					if(n._skip){
						n._skip = "";
						continue;
					}
					if(getCtor(type).prototype.stopParser && !(options && options.template)){
						var arr = n.getElementsByTagName("*");
						for(j = 0; j < arr.length; j++){
							arr[j]._skip = "1";
						}
					}
					list.push(n);
				}
			}
			var mixin = options && options.template ? {template: true} : null;
			return this.instantiate(list, mixin, options);
		};
	};

	// Singleton.   (TODO: replace parser class and singleton w/a simple hash of functions)
	var parser = new Parser();

	if(config.parseOnLoad){
		ready(100, function(){
			// Now that all the modules are loaded, check if the app loaded dojo/parser too.
			// If it did, let dojo/parser handle the parseOnLoad flag instead of me.
			try{
				if(!require("dojo/parser")){
					// IE6 takes this path when dojo/parser unavailable, rather than catch() block below,
					// due to http://support.microsoft.com/kb/944397
					parser.parse();
				}
			}catch(e){
				// Other browsers (and later versions of IE) take this path when dojo/parser unavailable
				parser.parse();
			}
		});
	}
	dm.parser = parser; // for backward compatibility
	dojo.parser = dojo.parser || parser; // in case user application calls dojo.parser

	return parser;
});

},
'dojox/mobile/common':function(){
define([
	"dojo/_base/array",
	"dojo/_base/config",
	"dojo/_base/connect",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/_base/kernel",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/domReady",
	"dojo/ready",
	"dojo/touch",
	"dijit/registry",
	"./sniff",
	"./uacss" // (no direct references)
], function(array, config, connect, lang, win, kernel, domClass, domConstruct, domReady, ready, touch, registry, has){

	// module:
	//		dojox/mobile/common

	var dm = lang.getObject("dojox.mobile", true);

	// tell dojo/touch to generate synthetic clicks immediately
	// and regardless of preventDefault() calls on touch events
	win.doc.dojoClick = true;
	/// ... but let user disable this by removing dojoClick from the document
	if(has("touch")){
		// Do we need to send synthetic clicks when preventDefault() is called on touch events?
		// This is normally true on anything except Android 4.1+ and IE10, but users reported
		// exceptions like Galaxy Note 2. So let's use a has("clicks-prevented") flag, and let
		// applications override it through data-dojo-config="has:{'clicks-prevented':true}" if needed.
		has.add("clicks-prevented", !(has("android") >= 4.1 || has("ie") >= 10));
		if(has("clicks-prevented")){
			dm._sendClick = function(target, e){
				// dojo/touch will send a click if dojoClick is set, so don't do it again.
				for(var node = target; node; node = node.parentNode){
					if(node.dojoClick){
						return;
					}
				}
				var ev = win.doc.createEvent("MouseEvents"); 
				ev.initMouseEvent("click", true, true, win.global, 1, e.screenX, e.screenY, e.clientX, e.clientY); 
				target.dispatchEvent(ev);
			};
		}
	}

	dm.getScreenSize = function(){
		// summary:
		//		Returns the dimensions of the browser window.
		return {
			h: win.global.innerHeight || win.doc.documentElement.clientHeight,
			w: win.global.innerWidth || win.doc.documentElement.clientWidth
		};
	};

	dm.updateOrient = function(){
		// summary:
		//		Updates the orientation specific CSS classes, 'dj_portrait' and
		//		'dj_landscape'.
		var dim = dm.getScreenSize();
		domClass.replace(win.doc.documentElement,
				  dim.h > dim.w ? "dj_portrait" : "dj_landscape",
				  dim.h > dim.w ? "dj_landscape" : "dj_portrait");
	};
	dm.updateOrient();

	dm.tabletSize = 500;
	dm.detectScreenSize = function(/*Boolean?*/force){
		// summary:
		//		Detects the screen size and determines if the screen is like
		//		phone or like tablet. If the result is changed,
		//		it sets either of the following css class to `<html>`:
		//
		//		- 'dj_phone'
		//		- 'dj_tablet'
		//
		//		and it publishes either of the following events:
		//
		//		- '/dojox/mobile/screenSize/phone'
		//		- '/dojox/mobile/screenSize/tablet'

		var dim = dm.getScreenSize();
		var sz = Math.min(dim.w, dim.h);
		var from, to;
		if(sz >= dm.tabletSize && (force || (!this._sz || this._sz < dm.tabletSize))){
			from = "phone";
			to = "tablet";
		}else if(sz < dm.tabletSize && (force || (!this._sz || this._sz >= dm.tabletSize))){
			from = "tablet";
			to = "phone";
		}
		if(to){
			domClass.replace(win.doc.documentElement, "dj_"+to, "dj_"+from);
			connect.publish("/dojox/mobile/screenSize/"+to, [dim]);
		}
		this._sz = sz;
	};
	dm.detectScreenSize();

	// dojox/mobile.hideAddressBarWait: Number
	//		The time in milliseconds to wait before the fail-safe hiding address
	//		bar runs. The value must be larger than 800.
	dm.hideAddressBarWait = typeof(config.mblHideAddressBarWait) === "number" ?
		config.mblHideAddressBarWait : 1500;

	dm.hide_1 = function(){
		// summary:
		//		Internal function to hide the address bar.
		// tags:
		//		private
		scrollTo(0, 1);
		dm._hidingTimer = (dm._hidingTimer == 0) ? 200 : dm._hidingTimer * 2;
		setTimeout(function(){ // wait for a while for "scrollTo" to finish
			if(dm.isAddressBarHidden() || dm._hidingTimer > dm.hideAddressBarWait){
				// Succeeded to hide address bar, or failed but timed out 
				dm.resizeAll();
				dm._hiding = false;
			}else{
				// Failed to hide address bar, so retry after a while
				setTimeout(dm.hide_1, dm._hidingTimer);
			}
		}, 50); //50ms is an experiential value
	};

	dm.hideAddressBar = function(/*Event?*/evt){
		// summary:
		//		Hides the address bar.
		// description:
		//		Tries to hide the address bar a couple of times. The purpose is to do 
		//		it as quick as possible while ensuring the resize is done after the hiding
		//		finishes.
		if(dm.disableHideAddressBar || dm._hiding){ return; }
		dm._hiding = true;
		dm._hidingTimer = has("ios") ? 200 : 0; // Need to wait longer in case of iPhone
		var minH = screen.availHeight;
		if(has('android')){
			minH = outerHeight / devicePixelRatio;
			// On some Android devices such as Galaxy SII, minH might be 0 at this time.
			// In that case, retry again after a while. (200ms is an experiential value)
			if(minH == 0){
				dm._hiding = false;
				setTimeout(function(){ dm.hideAddressBar(); }, 200);
			}
			// On some Android devices such as HTC EVO, "outerHeight/devicePixelRatio"
			// is too short to hide address bar, so make it high enough
			if(minH <= innerHeight){ minH = outerHeight; }
			// On Android 2.2/2.3, hiding address bar fails when "overflow:hidden" style is
			// applied to html/body element, so force "overflow:visible" style
			if(has('android') < 3){
				win.doc.documentElement.style.overflow = win.body().style.overflow = "visible";
			}
		}
		if(win.body().offsetHeight < minH){ // to ensure enough height for scrollTo to work
			win.body().style.minHeight = minH + "px";
			dm._resetMinHeight = true;
		}
		setTimeout(dm.hide_1, dm._hidingTimer);
	};

	dm.isAddressBarHidden = function(){
		return pageYOffset === 1;
	};

	dm.resizeAll = function(/*Event?*/evt, /*Widget?*/root){
		// summary:
		//		Calls the resize() method of all the top level resizable widgets.
		// description:
		//		Finds all widgets that do not have a parent or the parent does not
		//		have the resize() method, and calls resize() for them.
		//		If a widget has a parent that has resize(), calling widget's
		//		resize() is its parent's responsibility.
		// evt:
		//		Native event object
		// root:
		//		If specified, searches the specified widget recursively for top-level
		//		resizable widgets.
		//		root.resize() is always called regardless of whether root is a
		//		top level widget or not.
		//		If omitted, searches the entire page.
		if(dm.disableResizeAll){ return; }
		connect.publish("/dojox/mobile/resizeAll", [evt, root]); // back compat
		connect.publish("/dojox/mobile/beforeResizeAll", [evt, root]);
		if(dm._resetMinHeight){
			win.body().style.minHeight = dm.getScreenSize().h + "px";
		} 
		dm.updateOrient();
		dm.detectScreenSize();
		var isTopLevel = function(w){
			var parent = w.getParent && w.getParent();
			return !!((!parent || !parent.resize) && w.resize);
		};
		var resizeRecursively = function(w){
			array.forEach(w.getChildren(), function(child){
				if(isTopLevel(child)){ child.resize(); }
				resizeRecursively(child);
			});
		};
		if(root){
			if(root.resize){ root.resize(); }
			resizeRecursively(root);
		}else{
			array.forEach(array.filter(registry.toArray(), isTopLevel),
					function(w){ w.resize(); });
		}
		connect.publish("/dojox/mobile/afterResizeAll", [evt, root]);
	};

	dm.openWindow = function(url, target){
		// summary:
		//		Opens a new browser window with the given URL.
		win.global.open(url, target || "_blank");
	};

	dm._detectWindowsTheme = function(){
		// summary:
		//		Detects if the "windows" theme is used,
		//		if it is used, set has("windows-theme") and
		//		add the .windows_theme class on the document.
		
		// Avoid unwanted (un)zoom on some WP8 devices (at least Nokia Lumia 920) 
		if(navigator.userAgent.match(/IEMobile\/10\.0/)){
			domConstruct.create("style", 
				{innerHTML: "@-ms-viewport {width: auto !important}"}, win.doc.head);
		}

		var setWindowsTheme = function(){
			domClass.add(win.doc.documentElement, "windows_theme");
			kernel.experimental("Dojo Mobile Windows theme", "Behavior and appearance of the Windows theme are experimental.");
		};

		// First see if the "windows-theme" feature has already been set explicitly
		// in that case skip aut-detect
		var windows = has("windows-theme");
		if(windows !== undefined){
			if(windows){
				setWindowsTheme();
			}
			return;
		}

		// check css
		var i, j;

		var check = function(href){
			// TODO: find a better regexp to match?
			if(href && href.indexOf("/windows/") !== -1){
				has.add("windows-theme", true);
				setWindowsTheme();
				return true;
			}
			return false;
		};

		// collect @import
		var s = win.doc.styleSheets;
		for(i = 0; i < s.length; i++){
			if(s[i].href){ continue; }
			var r = s[i].cssRules || s[i].imports;
			if(!r){ continue; }
			for(j = 0; j < r.length; j++){
				if(check(r[j].href)){
					return;
				}
			}
		}

		// collect <link>
		var elems = win.doc.getElementsByTagName("link");
		for(i = 0; i < elems.length; i++){
			if(check(elems[i].href)){
				return;
			}
		}
	};

	if(config.mblApplyPageStyles !== false){
		domClass.add(win.doc.documentElement, "mobile");
	}
	if(has('chrome')){
		// dojox/mobile does not load uacss (only _compat does), but we need dj_chrome.
		domClass.add(win.doc.documentElement, "dj_chrome");
	}

	if(win.global._no_dojo_dm){
		// deviceTheme seems to be loaded from a script tag (= non-dojo usage)
		var _dm = win.global._no_dojo_dm;
		for(var i in _dm){
			dm[i] = _dm[i];
		}
		dm.deviceTheme.setDm(dm);
	}

	// flag for Android transition animation flicker workaround
	has.add('mblAndroidWorkaround', 
			config.mblAndroidWorkaround !== false && has('android') < 3, undefined, true);
	has.add('mblAndroid3Workaround', 
			config.mblAndroid3Workaround !== false && has('android') >= 3, undefined, true);

	dm._detectWindowsTheme();
	
	// Set the background style using dojo/domReady, not dojo/ready, to ensure it is already
	// set at widget initialization time. (#17418) 
	domReady(function(){
		domClass.add(win.body(), "mblBackground");
	});

	ready(function(){
		dm.detectScreenSize(true);
		if(config.mblAndroidWorkaroundButtonStyle !== false && has('android')){
			// workaround for the form button disappearing issue on Android 2.2-4.0
			domConstruct.create("style", {innerHTML:"BUTTON,INPUT[type='button'],INPUT[type='submit'],INPUT[type='reset'],INPUT[type='file']::-webkit-file-upload-button{-webkit-appearance:none;} audio::-webkit-media-controls-play-button,video::-webkit-media-controls-play-button{-webkit-appearance:media-play-button;} video::-webkit-media-controls-fullscreen-button{-webkit-appearance:media-fullscreen-button;}"}, win.doc.head, "first");
		}
		if(has('mblAndroidWorkaround')){
			// add a css class to show view offscreen for android flicker workaround
			domConstruct.create("style", {innerHTML:".mblView.mblAndroidWorkaround{position:absolute;top:-9999px !important;left:-9999px !important;}"}, win.doc.head, "last");
		}

		var f = dm.resizeAll;
		// Address bar hiding
		var isHidingPossible =
			navigator.appVersion.indexOf("Mobile") != -1 && // only mobile browsers
			// #17455: hiding Safari's address bar works in iOS < 7 but this is 
			// no longer possible since iOS 7. Hence, exclude iOS 7 and later: 
			!(has("ios") >= 7);
		// You can disable the hiding of the address bar with the following dojoConfig:
		// var dojoConfig = { mblHideAddressBar: false };
		// If unspecified, the flag defaults to true.
		if((config.mblHideAddressBar !== false && isHidingPossible) ||
			config.mblForceHideAddressBar === true){
			dm.hideAddressBar();
			if(config.mblAlwaysHideAddressBar === true){
				f = dm.hideAddressBar;
			}
		}

		var ios6 = has("ios") >= 6; // Full-screen support for iOS6 or later
		if((has('android') || ios6) && win.global.onorientationchange !== undefined){
			var _f = f;
			var curSize, curClientWidth, curClientHeight;
			if(ios6){
				curClientWidth = win.doc.documentElement.clientWidth;
				curClientHeight = win.doc.documentElement.clientHeight;
			}else{ // Android
				// Call resize for the first resize event after orientationchange
				// because the size information may not yet be up to date when the 
				// event orientationchange occurs.
				f = function(evt){
					var _conn = connect.connect(null, "onresize", null, function(e){
						connect.disconnect(_conn);
						_f(e);
					});
				}
				curSize = dm.getScreenSize();
			};
			// Android: Watch for resize events when the virtual keyboard is shown/hidden.
			// The heuristic to detect this is that the screen width does not change
			// and the height changes by more than 100 pixels.
			//
			// iOS >= 6: Watch for resize events when entering or existing the new iOS6 
			// full-screen mode. The heuristic to detect this is that clientWidth does not
			// change while the clientHeight does change.
			connect.connect(null, "onresize", null, function(e){
				if(ios6){
					var newClientWidth = win.doc.documentElement.clientWidth,
						newClientHeight = win.doc.documentElement.clientHeight;
					if(newClientWidth == curClientWidth && newClientHeight != curClientHeight){
						// full-screen mode has been entered/exited (iOS6)
						_f(e);
					}
					curClientWidth = newClientWidth;
					curClientHeight = newClientHeight;
				}else{ // Android
					var newSize = dm.getScreenSize();
					if(newSize.w == curSize.w && Math.abs(newSize.h - curSize.h) >= 100){
						// keyboard has been shown/hidden (Android)
						_f(e);
					}
					curSize = newSize;
				}
			});
		}
		
		connect.connect(null, win.global.onorientationchange !== undefined
			? "onorientationchange" : "onresize", null, f);
		win.body().style.visibility = "visible";
	});

	// TODO: return functions declared above in this hash, rather than
	// dojox.mobile.

	/*=====
	return {
		// summary:
		//		A common module for dojox/mobile.
		// description:
		//		This module includes common utility functions that are used by
		//		dojox/mobile widgets. Also, it provides functions that are commonly
		//		necessary for mobile web applications, such as the hide address bar
		//		function.
	};
	=====*/
	return dm;
});

},
'dojo/touch':function(){
define(["./_base/kernel", "./aspect", "./dom", "./dom-class", "./_base/lang", "./on", "./has", "./mouse", "./domReady", "./_base/window"],
function(dojo, aspect, dom, domClass, lang, on, has, mouse, domReady, win){

	// module:
	//		dojo/touch

	var hasTouch = has("touch");

	var ios4 = has("ios") < 5;
	
	var msPointer = navigator.msPointerEnabled;

	// Click generation variables
	var clicksInited, clickTracker, clickTarget, clickX, clickY, clickDx, clickDy, clickTime;

	// Time of most recent touchstart, touchmove, or touchend event
	var lastTouch;

	function dualEvent(mouseType, touchType, msPointerType){
		// Returns synthetic event that listens for both the specified mouse event and specified touch event.
		// But ignore fake mouse events that were generated due to the user touching the screen.
		if(msPointer && msPointerType){
			// IE10+: MSPointer* events are designed to handle both mouse and touch in a uniform way,
			// so just use that regardless of hasTouch.
			return function(node, listener){
				return on(node, msPointerType, listener);
			}
		}else if(hasTouch){
			return function(node, listener){
				var handle1 = on(node, touchType, listener),
					handle2 = on(node, mouseType, function(evt){
						if(!lastTouch || (new Date()).getTime() > lastTouch + 1000){
							listener.call(this, evt);
						}
					});
				return {
					remove: function(){
						handle1.remove();
						handle2.remove();
					}
				};
			};
		}else{
			// Avoid creating listeners for touch events on performance sensitive older browsers like IE6
			return function(node, listener){
				return on(node, mouseType, listener);
			}
		}
	}

	function marked(/*DOMNode*/ node){
		// Search for node ancestor has been marked with the dojoClick property to indicate special processing.
		// Returns marked ancestor.
		do{
			if(node.dojoClick){ return node; }
		}while(node = node.parentNode);
	}
	
	function doClicks(e, moveType, endType){
		// summary:
		//		Setup touch listeners to generate synthetic clicks immediately (rather than waiting for the browser
		//		to generate clicks after the double-tap delay) and consistently (regardless of whether event.preventDefault()
		//		was called in an event listener. Synthetic clicks are generated only if a node or one of its ancestors has
		//		its dojoClick property set to truthy.
		
		var markedNode = marked(e.target);
		clickTracker  = !e.target.disabled && markedNode && markedNode.dojoClick; // click threshold = true, number, x/y object, or "useTarget"
		if(clickTracker){
			var useTarget = (clickTracker == "useTarget");
			clickTarget = (useTarget?markedNode:e.target);
			if(useTarget){
				// We expect a click, so prevent any other 
				// defaut action on "touchpress"
				e.preventDefault();
			}
			clickX = e.touches ? e.touches[0].pageX : e.clientX;
			clickY = e.touches ? e.touches[0].pageY : e.clientY;
			clickDx = (typeof clickTracker == "object" ? clickTracker.x : (typeof clickTracker == "number" ? clickTracker : 0)) || 4;
			clickDy = (typeof clickTracker == "object" ? clickTracker.y : (typeof clickTracker == "number" ? clickTracker : 0)) || 4;

			// add move/end handlers only the first time a node with dojoClick is seen,
			// so we don't add too much overhead when dojoClick is never set.
			if(!clicksInited){
				clicksInited = true;

				function updateClickTracker(e){
					if(useTarget){
						clickTracker = dom.isDescendant(win.doc.elementFromPoint((e.changedTouches ? e.changedTouches[0].pageX : e.clientX),(e.changedTouches ? e.changedTouches[0].pageY : e.clientY)),clickTarget);
					}else{
						clickTracker = clickTracker &&
							e.target == clickTarget &&
							Math.abs((e.changedTouches ? e.changedTouches[0].pageX : e.clientX) - clickX) <= clickDx &&
							Math.abs((e.changedTouches ? e.changedTouches[0].pageY : e.clientY) - clickY) <= clickDy;
					}
				}

				win.doc.addEventListener(moveType, function(e){
					updateClickTracker(e);
					if(useTarget){
						// prevent native scroll event and ensure touchend is
						// fire after touch moves between press and release.
						e.preventDefault();
					}
				}, true);

				win.doc.addEventListener(endType, function(e){
					updateClickTracker(e);
					if(clickTracker){
						clickTime = (new Date()).getTime();
						var target = (useTarget?clickTarget:e.target);
						if(target.tagName === "LABEL"){
							// when clicking on a label, forward click to its associated input if any
							target = dom.byId(target.getAttribute("for")) || target;
						}
						setTimeout(function(){
							on.emit(target, "click", {
								bubbles : true,
								cancelable : true,
								_dojo_click : true
							});
						}, 0);
					}
				}, true);

				function stopNativeEvents(type){
					win.doc.addEventListener(type, function(e){
						// Stop native events when we emitted our own click event.  Note that the native click may occur
						// on a different node than the synthetic click event was generated on.  For example,
						// click on a menu item, causing the menu to disappear, and then (~300ms later) the browser
						// sends a click event to the node that was *underneath* the menu.  So stop all native events
						// sent shortly after ours, similar to what is done in dualEvent.
						// The INPUT.dijitOffScreen test is for offscreen inputs used in dijit/form/Button, on which
						// we call click() explicitly, we don't want to stop this event.
						if(!e._dojo_click &&
								(new Date()).getTime() <= clickTime + 1000 &&
								!(e.target.tagName == "INPUT" && domClass.contains(e.target, "dijitOffScreen"))){
							e.stopPropagation();
							e.stopImmediatePropagation && e.stopImmediatePropagation();
							if(type == "click" && (e.target.tagName != "INPUT" || e.target.type == "radio" || e.target.type == "checkbox")
								&& e.target.tagName != "TEXTAREA" && e.target.tagName != "AUDIO" && e.target.tagName != "VIDEO"){
								 // preventDefault() breaks textual <input>s on android, keyboard doesn't popup,
								 // but it is still needed for checkboxes and radio buttons, otherwise in some cases
								 // the checked state becomes inconsistent with the widget's state
								e.preventDefault();
							}
						}
					}, true);
				}

				stopNativeEvents("click");

				// We also stop mousedown/up since these would be sent well after with our "fast" click (300ms),
				// which can confuse some dijit widgets.
				stopNativeEvents("mousedown");
				stopNativeEvents("mouseup");
			}
		}
	}

	var hoveredNode;

	if(hasTouch){
		if(msPointer){
			 // MSPointer (IE10+) already has support for over and out, so we just need to init click support
			domReady(function(){
				win.doc.addEventListener("MSPointerDown", function(evt){
					doClicks(evt, "MSPointerMove", "MSPointerUp");
				}, true);
			});		
		}else{
			domReady(function(){
				// Keep track of currently hovered node
				hoveredNode = win.body();	// currently hovered node

				win.doc.addEventListener("touchstart", function(evt){
					lastTouch = (new Date()).getTime();

					// Precede touchstart event with touch.over event.  DnD depends on this.
					// Use addEventListener(cb, true) to run cb before any touchstart handlers on node run,
					// and to ensure this code runs even if the listener on the node does event.stop().
					var oldNode = hoveredNode;
					hoveredNode = evt.target;
					on.emit(oldNode, "dojotouchout", {
						relatedTarget: hoveredNode,
						bubbles: true
					});
					on.emit(hoveredNode, "dojotouchover", {
						relatedTarget: oldNode,
						bubbles: true
					});
				
					doClicks(evt, "touchmove", "touchend"); // init click generation
				}, true);

				function copyEventProps(evt){
					// Make copy of event object and also set bubbles:true.  Used when calling on.emit().
					var props = lang.delegate(evt, {
						bubbles: true
					});

					if(has("ios") >= 6){
						// On iOS6 "touches" became a non-enumerable property, which 
						// is not hit by for...in.  Ditto for the other properties below.
						props.touches = evt.touches;
						props.altKey = evt.altKey;
						props.changedTouches = evt.changedTouches;
						props.ctrlKey = evt.ctrlKey;
						props.metaKey = evt.metaKey;
						props.shiftKey = evt.shiftKey;
						props.targetTouches = evt.targetTouches;
					}

					return props;
				}
				
				on(win.doc, "touchmove", function(evt){
					lastTouch = (new Date()).getTime();

					var newNode = win.doc.elementFromPoint(
						evt.pageX - (ios4 ? 0 : win.global.pageXOffset), // iOS 4 expects page coords
						evt.pageY - (ios4 ? 0 : win.global.pageYOffset)
					);

					if(newNode){
						// Fire synthetic touchover and touchout events on nodes since the browser won't do it natively.
						if(hoveredNode !== newNode){
							// touch out on the old node
							on.emit(hoveredNode, "dojotouchout", {
								relatedTarget: newNode,
								bubbles: true
							});

							// touchover on the new node
							on.emit(newNode, "dojotouchover", {
								relatedTarget: hoveredNode,
								bubbles: true
							});

							hoveredNode = newNode;
						}

						// Unlike a listener on "touchmove", on(node, "dojotouchmove", listener) fires when the finger
						// drags over the specified node, regardless of which node the touch started on.
						if(!on.emit(newNode, "dojotouchmove", copyEventProps(evt))){
							// emit returns false when synthetic event "dojotouchmove" is cancelled, so we prevent the
							// default behavior of the underlying native event "touchmove".
							evt.preventDefault();
						}
					}
				});

				// Fire a dojotouchend event on the node where the finger was before it was removed from the screen.
				// This is different than the native touchend, which fires on the node where the drag started.
				on(win.doc, "touchend", function(evt){
					lastTouch = (new Date()).getTime();
					var node = win.doc.elementFromPoint(
						evt.pageX - (ios4 ? 0 : win.global.pageXOffset), // iOS 4 expects page coords
						evt.pageY - (ios4 ? 0 : win.global.pageYOffset)
					) || win.body(); // if out of the screen

					on.emit(node, "dojotouchend", copyEventProps(evt));
				});
			});
		}
	}

	//device neutral events - touch.press|move|release|cancel/over/out
	var touch = {
		press: dualEvent("mousedown", "touchstart", "MSPointerDown"),
		move: dualEvent("mousemove", "dojotouchmove", "MSPointerMove"),
		release: dualEvent("mouseup", "dojotouchend", "MSPointerUp"),
		cancel: dualEvent(mouse.leave, "touchcancel", hasTouch?"MSPointerCancel":null),
		over: dualEvent("mouseover", "dojotouchover", "MSPointerOver"),
		out: dualEvent("mouseout", "dojotouchout", "MSPointerOut"),
		enter: mouse._eventHandler(dualEvent("mouseover","dojotouchover", "MSPointerOver")),
		leave: mouse._eventHandler(dualEvent("mouseout", "dojotouchout", "MSPointerOut"))
	};

	/*=====
	touch = {
		// summary:
		//		This module provides unified touch event handlers by exporting
		//		press, move, release and cancel which can also run well on desktop.
		//		Based on http://dvcs.w3.org/hg/webevents/raw-file/tip/touchevents.html
		//		Also, if the dojoClick property is set to true on a DOM node, dojo/touch generates
		//		click events immediately for this node and its descendants, to avoid the
		//		delay before native browser click events, and regardless of whether evt.preventDefault()
		//		was called in a touch.press event listener.
		//
		// example:
		//		Used with dojo.on
		//		|	define(["dojo/on", "dojo/touch"], function(on, touch){
		//		|		on(node, touch.press, function(e){});
		//		|		on(node, touch.move, function(e){});
		//		|		on(node, touch.release, function(e){});
		//		|		on(node, touch.cancel, function(e){});
		// example:
		//		Used with touch.* directly
		//		|	touch.press(node, function(e){});
		//		|	touch.move(node, function(e){});
		//		|	touch.release(node, function(e){});
		//		|	touch.cancel(node, function(e){});
		// example:
		//		Have dojo/touch generate clicks without delay, with a default move threshold of 4 pixels
		//		|	node.dojoClick = true;
		// example:
		//		Have dojo/touch generate clicks without delay, with a move threshold of 10 pixels horizontally and vertically
		//		|	node.dojoClick = 10;
		// example:
		//		Have dojo/touch generate clicks without delay, with a move threshold of 50 pixels horizontally and 10 pixels vertically
		//		|	node.dojoClick = {x:50, y:5};
		

		press: function(node, listener){
			// summary:
			//		Register a listener to 'touchstart'|'mousedown' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		move: function(node, listener){
			// summary:
			//		Register a listener that fires when the mouse cursor or a finger is dragged over the given node.
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		release: function(node, listener){
			// summary:
			//		Register a listener to releasing the mouse button while the cursor is over the given node
			//		(i.e. "mouseup") or for removing the finger from the screen while touching the given node.
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		cancel: function(node, listener){
			// summary:
			//		Register a listener to 'touchcancel'|'mouseleave' for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		over: function(node, listener){
			// summary:
			//		Register a listener to 'mouseover' or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		out: function(node, listener){
			// summary:
			//		Register a listener to 'mouseout' or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		enter: function(node, listener){
			// summary:
			//		Register a listener to mouse.enter or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		},
		leave: function(node, listener){
			// summary:
			//		Register a listener to mouse.leave or touch equivalent for the given node
			// node: Dom
			//		Target node to listen to
			// listener: Function
			//		Callback function
			// returns:
			//		A handle which will be used to remove the listener by handle.remove()
		}
	};
	=====*/

	 1  && (dojo.touch = touch);

	return touch;
});

},
'dojox/mobile/sniff':function(){
define([
	"dojo/_base/kernel",
	"dojo/sniff"
], function(kernel, has){

	kernel.deprecated("dojox/mobile/sniff", "Use dojo/sniff instead", "2.0");
	
	// TODO: remove this in 2.0
	has.add("iphone", has("ios"));

	/*=====
	return {
		// summary:
		//		Deprecated: use dojo/sniff instead.
		//		On iOS, dojox/mobile/sniff sets "iphone" to the same value as "ios"
		//		for compatibility with earlier versions, but this should be considered deprecated.
		//		In future versions, "iphone" will be set only when running on an iPhone (not iPad on iPod).
	};
	=====*/
	return has;
});

},
'dojox/mobile/uacss':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojo/_base/window",
	"./sniff"
], function(dojo, lang, win, has){
	var html = win.doc.documentElement;
	html.className = lang.trim(html.className + " " + [
		has('bb') ? "dj_bb" : "",
		has('android') ? "dj_android" : "",
		has("ios") ? "dj_ios" : "",
		has("ios") >= 6 ? "dj_ios6" : "",
		has("ios") ? "dj_iphone" : "",	// TODO: remove for 2.0
		has('ipod') ? "dj_ipod" : "",
		has('ipad') ? "dj_ipad" : "",
		has('ie') ? "dj_ie": ""
	].join(" ").replace(/ +/g," "));
	
	/*=====
	return {
		// summary:
		//		Requiring this module adds CSS classes to your document's `<html`> tag:
		//
		//		- "dj_android" when running on Android;
		//		- "dj_bb" when running on BlackBerry;
		//		- "dj_ios" when running on iPhone, iPad or iPod;
		//		- "dj_iphone" when running on iPhone, iPad or iPod (Note: will be changed in future versions to be set only on iPhone);
		//		- "dj_ipod" when running on iPod;
		//		- "dj_ipad" when running on iPad.
	};
	=====*/
	return dojo;
});

},
'dojox/mobile/EdgeToEdgeCategory':function(){
define([
	"dojo/_base/declare",
	"./RoundRectCategory"
], function(declare, RoundRectCategory){

	// module:
	//		dojox/mobile/EdgeToEdgeCategory

	return declare("dojox.mobile.EdgeToEdgeCategory", RoundRectCategory, {
		// summary:
		//		A category header for an edge-to-edge list.
		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeCategory";

			if(this.type && this.type == "long"){
				this.domNode.className += " mblEdgeToEdgeCategoryLong";
			}
		}
	});
});

},
'dojox/mobile/RoundRectCategory':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-construct",
	"dijit/_Contained",
	"dijit/_WidgetBase",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/RoundRectCategory"
], function(declare, win, domConstruct, Contained, WidgetBase, has, BidiRoundRectCategory){

	// module:
	//		dojox/mobile/RoundRectCategory

	var RoundRectCategory = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiRoundRectCategory" : "dojox.mobile.RoundRectCategory", [WidgetBase, Contained], {
		// summary:
		//		A category header for a rounded rectangle list.

		// label: String
		//		A label of the category. If the label is not specified,
		//		innerHTML is used as a label.
		label: "",

		// tag: String
		//		A name of html tag to create as domNode.
		tag: "h2",

		/* internal properties */	
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblRoundRectCategory",

		buildRendering: function(){
			var domNode = this.domNode = this.containerNode = this.srcNodeRef || domConstruct.create(this.tag);
			this.inherited(arguments);
			if(!this.label && domNode.childNodes.length === 1 && domNode.firstChild.nodeType === 3){
				// if it has only one text node, regard it as a label
				this.label = domNode.firstChild.nodeValue;
			}
		},

		_setLabelAttr: function(/*String*/label){
			// summary:
			//		Sets the category header text.
			// tags:
			//		private
			this.label = label;
			this.domNode.innerHTML = this._cv ? this._cv(label) : label;
		}
	});

	return has("dojo-bidi") ? declare("dojox.mobile.RoundRectCategory", [RoundRectCategory, BidiRoundRectCategory]) : RoundRectCategory;	
});

},
'dijit/_Contained':function(){
define([
	"dojo/_base/declare", // declare
	"./registry"	// registry.getEnclosingWidget(), registry.byNode()
], function(declare, registry){

	// module:
	//		dijit/_Contained

	return declare("dijit._Contained", null, {
		// summary:
		//		Mixin for widgets that are children of a container widget
		// example:
		//	|	// make a basic custom widget that knows about its parents
		//	|	declare("my.customClass",[dijit._WidgetBase, dijit._Contained],{});

		_getSibling: function(/*String*/ which){
			// summary:
			//		Returns next or previous sibling
			// which:
			//		Either "next" or "previous"
			// tags:
			//		private
			var node = this.domNode;
			do{
				node = node[which+"Sibling"];
			}while(node && node.nodeType != 1);
			return node && registry.byNode(node);	// dijit/_WidgetBase
		},

		getPreviousSibling: function(){
			// summary:
			//		Returns null if this is the first child of the parent,
			//		otherwise returns the next element sibling to the "left".

			return this._getSibling("previous"); // dijit/_WidgetBase
		},

		getNextSibling: function(){
			// summary:
			//		Returns null if this is the last child of the parent,
			//		otherwise returns the next element sibling to the "right".

			return this._getSibling("next"); // dijit/_WidgetBase
		},

		getIndexInParent: function(){
			// summary:
			//		Returns the index of this widget within its container parent.
			//		It returns -1 if the parent does not exist, or if the parent
			//		is not a dijit/_Container

			var p = this.getParent();
			if(!p || !p.getIndexOfChild){
				return -1; // int
			}
			return p.getIndexOfChild(this); // int
		}
	});
});

},
'dijit/_WidgetBase':function(){
define([
	"require", // require.toUrl
	"dojo/_base/array", // array.forEach array.map
	"dojo/aspect",
	"dojo/_base/config", // config.blankGif
	"dojo/_base/connect", // connect.connect
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/dom-attr", // domAttr.set domAttr.remove
	"dojo/dom-class", // domClass.add domClass.replace
	"dojo/dom-construct", // domConstruct.destroy domConstruct.place
	"dojo/dom-geometry", // isBodyLtr
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/has",
	"dojo/_base/kernel",
	"dojo/_base/lang", // mixin(), isArray(), etc.
	"dojo/on",
	"dojo/ready",
	"dojo/Stateful", // Stateful
	"dojo/topic",
	"dojo/_base/window", // win.body()
	"./Destroyable",
	"dojo/has!dojo-bidi?./_BidiMixin",
	"./registry"    // registry.getUniqueId(), registry.findWidgets()
], function(require, array, aspect, config, connect, declare,
			dom, domAttr, domClass, domConstruct, domGeometry, domStyle, has, kernel,
			lang, on, ready, Stateful, topic, win, Destroyable, _BidiMixin, registry){

	// module:
	//		dijit/_WidgetBase

	// Flag to make dijit load modules the app didn't explicitly request, for backwards compatibility
	has.add("dijit-legacy-requires", !kernel.isAsync);

	// Flag to enable support for textdir attribute
	has.add("dojo-bidi", false);


	// For back-compat, remove in 2.0.
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/_base/manager"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	// Nested hash listing attributes for each tag, all strings in lowercase.
	// ex: {"div": {"style": true, "tabindex" true}, "form": { ...
	var tagAttrs = {};

	function getAttrs(obj){
		var ret = {};
		for(var attr in obj){
			ret[attr.toLowerCase()] = true;
		}
		return ret;
	}

	function nonEmptyAttrToDom(attr){
		// summary:
		//		Returns a setter function that copies the attribute to this.domNode,
		//		or removes the attribute from this.domNode, depending on whether the
		//		value is defined or not.
		return function(val){
			domAttr[val ? "set" : "remove"](this.domNode, attr, val);
			this._set(attr, val);
		};
	}

	var _WidgetBase = declare("dijit._WidgetBase", [Stateful, Destroyable], {
		// summary:
		//		Future base class for all Dijit widgets.
		// description:
		//		Future base class for all Dijit widgets.
		//		_Widget extends this class adding support for various features needed by desktop.
		//
		//		Provides stubs for widget lifecycle methods for subclasses to extend, like postMixInProperties(), buildRendering(),
		//		postCreate(), startup(), and destroy(), and also public API methods like set(), get(), and watch().
		//
		//		Widgets can provide custom setters/getters for widget attributes, which are called automatically by set(name, value).
		//		For an attribute XXX, define methods _setXXXAttr() and/or _getXXXAttr().
		//
		//		_setXXXAttr can also be a string/hash/array mapping from a widget attribute XXX to the widget's DOMNodes:
		//
		//		- DOM node attribute
		// |		_setFocusAttr: {node: "focusNode", type: "attribute"}
		// |		_setFocusAttr: "focusNode"	(shorthand)
		// |		_setFocusAttr: ""		(shorthand, maps to this.domNode)
		//		Maps this.focus to this.focusNode.focus, or (last example) this.domNode.focus
		//
		//		- DOM node innerHTML
		//	|		_setTitleAttr: { node: "titleNode", type: "innerHTML" }
		//		Maps this.title to this.titleNode.innerHTML
		//
		//		- DOM node innerText
		//	|		_setTitleAttr: { node: "titleNode", type: "innerText" }
		//		Maps this.title to this.titleNode.innerText
		//
		//		- DOM node CSS class
		// |		_setMyClassAttr: { node: "domNode", type: "class" }
		//		Maps this.myClass to this.domNode.className
		//
		//		If the value of _setXXXAttr is an array, then each element in the array matches one of the
		//		formats of the above list.
		//
		//		If the custom setter is null, no action is performed other than saving the new value
		//		in the widget (in this).
		//
		//		If no custom setter is defined for an attribute, then it will be copied
		//		to this.focusNode (if the widget defines a focusNode), or this.domNode otherwise.
		//		That's only done though for attributes that match DOMNode attributes (title,
		//		alt, aria-labelledby, etc.)

		// id: [const] String
		//		A unique, opaque ID string that can be assigned by users or by the
		//		system. If the developer passes an ID which is known not to be
		//		unique, the specified ID is ignored and the system-generated ID is
		//		used instead.
		id: "",
		_setIdAttr: "domNode", // to copy to this.domNode even for auto-generated id's

		// lang: [const] String
		//		Rarely used.  Overrides the default Dojo locale used to render this widget,
		//		as defined by the [HTML LANG](http://www.w3.org/TR/html401/struct/dirlang.html#adef-lang) attribute.
		//		Value must be among the list of locales specified during by the Dojo bootstrap,
		//		formatted according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt) (like en-us).
		lang: "",
		// set on domNode even when there's a focus node.	but don't set lang="", since that's invalid.
		_setLangAttr: nonEmptyAttrToDom("lang"),

		// dir: [const] String
		//		Bi-directional support, as defined by the [HTML DIR](http://www.w3.org/TR/html401/struct/dirlang.html#adef-dir)
		//		attribute. Either left-to-right "ltr" or right-to-left "rtl".  If undefined, widgets renders in page's
		//		default direction.
		dir: "",
		// set on domNode even when there's a focus node.	but don't set dir="", since that's invalid.
		_setDirAttr: nonEmptyAttrToDom("dir"), // to set on domNode even when there's a focus node

		// class: String
		//		HTML class attribute
		"class": "",
		_setClassAttr: { node: "domNode", type: "class" },

		// Override automatic assigning type --> focusNode, it causes exception on IE6-8.
		// Instead, type must be specified as ${type} in the template, as part of the original DOM.
		_setTypeAttr: null,

		// style: String||Object
		//		HTML style attributes as cssText string or name/value hash
		style: "",

		// title: String
		//		HTML title attribute.
		//
		//		For form widgets this specifies a tooltip to display when hovering over
		//		the widget (just like the native HTML title attribute).
		//
		//		For TitlePane or for when this widget is a child of a TabContainer, AccordionContainer,
		//		etc., it's used to specify the tab label, accordion pane title, etc.  In this case it's
		//		interpreted as HTML.
		title: "",

		// tooltip: String
		//		When this widget's title attribute is used to for a tab label, accordion pane title, etc.,
		//		this specifies the tooltip to appear when the mouse is hovered over that text.
		tooltip: "",

		// baseClass: [protected] String
		//		Root CSS class of the widget (ex: dijitTextBox), used to construct CSS classes to indicate
		//		widget state.
		baseClass: "",

		// srcNodeRef: [readonly] DomNode
		//		pointer to original DOM node
		srcNodeRef: null,

		// domNode: [readonly] DomNode
		//		This is our visible representation of the widget! Other DOM
		//		Nodes may by assigned to other properties, usually through the
		//		template system's data-dojo-attach-point syntax, but the domNode
		//		property is the canonical "top level" node in widget UI.
		domNode: null,

		// containerNode: [readonly] DomNode
		//		Designates where children of the source DOM node will be placed.
		//		"Children" in this case refers to both DOM nodes and widgets.
		//		For example, for myWidget:
		//
		//		|	<div data-dojo-type=myWidget>
		//		|		<b> here's a plain DOM node
		//		|		<span data-dojo-type=subWidget>and a widget</span>
		//		|		<i> and another plain DOM node </i>
		//		|	</div>
		//
		//		containerNode would point to:
		//
		//		|		<b> here's a plain DOM node
		//		|		<span data-dojo-type=subWidget>and a widget</span>
		//		|		<i> and another plain DOM node </i>
		//
		//		In templated widgets, "containerNode" is set via a
		//		data-dojo-attach-point assignment.
		//
		//		containerNode must be defined for any widget that accepts innerHTML
		//		(like ContentPane or BorderContainer or even Button), and conversely
		//		is null for widgets that don't, like TextBox.
		containerNode: null,

		// ownerDocument: [const] Document?
		//		The document this widget belongs to.  If not specified to constructor, will default to
		//		srcNodeRef.ownerDocument, or if no sourceRef specified, then to the document global
		ownerDocument: null,
		_setOwnerDocumentAttr: function(val){
			// this setter is merely to avoid automatically trying to set this.domNode.ownerDocument
			this._set("ownerDocument", val);
		},

		/*=====
		// _started: [readonly] Boolean
		//		startup() has completed.
		_started: false,
		=====*/

		// attributeMap: [protected] Object
		//		Deprecated.	Instead of attributeMap, widget should have a _setXXXAttr attribute
		//		for each XXX attribute to be mapped to the DOM.
		//
		//		attributeMap sets up a "binding" between attributes (aka properties)
		//		of the widget and the widget's DOM.
		//		Changes to widget attributes listed in attributeMap will be
		//		reflected into the DOM.
		//
		//		For example, calling set('title', 'hello')
		//		on a TitlePane will automatically cause the TitlePane's DOM to update
		//		with the new title.
		//
		//		attributeMap is a hash where the key is an attribute of the widget,
		//		and the value reflects a binding to a:
		//
		//		- DOM node attribute
		// |		focus: {node: "focusNode", type: "attribute"}
		//		Maps this.focus to this.focusNode.focus
		//
		//		- DOM node innerHTML
		//	|		title: { node: "titleNode", type: "innerHTML" }
		//		Maps this.title to this.titleNode.innerHTML
		//
		//		- DOM node innerText
		//	|		title: { node: "titleNode", type: "innerText" }
		//		Maps this.title to this.titleNode.innerText
		//
		//		- DOM node CSS class
		// |		myClass: { node: "domNode", type: "class" }
		//		Maps this.myClass to this.domNode.className
		//
		//		If the value is an array, then each element in the array matches one of the
		//		formats of the above list.
		//
		//		There are also some shorthands for backwards compatibility:
		//
		//		- string --> { node: string, type: "attribute" }, for example:
		//
		//	|	"focusNode" ---> { node: "focusNode", type: "attribute" }
		//
		//		- "" --> { node: "domNode", type: "attribute" }
		attributeMap: {},

		// _blankGif: [protected] String
		//		Path to a blank 1x1 image.
		//		Used by `<img>` nodes in templates that really get their image via CSS background-image.
		_blankGif: config.blankGif || require.toUrl("dojo/resources/blank.gif"),

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		/*=====
		constructor: function(params, srcNodeRef){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified:
			//
			//		- use srcNodeRef.innerHTML as my contents
			//		- if this is a behavioral widget then apply behavior to that srcNodeRef
			//		- otherwise, replace srcNodeRef with my generated DOM tree
		},
		=====*/

		_introspect: function(){
			// summary:
			//		Collect metadata about this widget (only once per class, not once per instance):
			//
			//			- list of attributes with custom setters, storing in this.constructor._setterAttrs
			//			- generate this.constructor._onMap, mapping names like "mousedown" to functions like onMouseDown

			var ctor = this.constructor;
			if(!ctor._setterAttrs){
				var proto = ctor.prototype,
					attrs = ctor._setterAttrs = [], // attributes with custom setters
					onMap = (ctor._onMap = {});

				// Items in this.attributeMap are like custom setters.  For back-compat, remove for 2.0.
				for(var name in proto.attributeMap){
					attrs.push(name);
				}

				// Loop over widget properties, collecting properties with custom setters and filling in ctor._onMap.
				for(name in proto){
					if(/^on/.test(name)){
						onMap[name.substring(2).toLowerCase()] = name;
					}

					if(/^_set[A-Z](.*)Attr$/.test(name)){
						name = name.charAt(4).toLowerCase() + name.substr(5, name.length - 9);
						if(!proto.attributeMap || !(name in proto.attributeMap)){
							attrs.push(name);
						}
					}
				}

				// Note: this isn't picking up info on properties like aria-label and role, that don't have custom setters
				// but that set() maps to attributes on this.domNode or this.focusNode
			}
		},

		postscript: function(/*Object?*/params, /*DomNode|String*/srcNodeRef){
			// summary:
			//		Kicks off widget instantiation.  See create() for details.
			// tags:
			//		private

			// Note that we skip calling this.inherited(), i.e. dojo/Stateful::postscript(), because 1.x widgets don't
			// expect their custom setters to get called until after buildRendering().  Consider changing for 2.0.

			this.create(params, srcNodeRef);
		},

		create: function(params, srcNodeRef){
			// summary:
			//		Kick off the life-cycle of a widget
			// description:
			//		Create calls a number of widget methods (postMixInProperties, buildRendering, postCreate,
			//		etc.), some of which of you'll want to override. See http://dojotoolkit.org/reference-guide/dijit/_WidgetBase.html
			//		for a discussion of the widget creation lifecycle.
			//
			//		Of course, adventurous developers could override create entirely, but this should
			//		only be done as a last resort.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified:
			//
			//		- use srcNodeRef.innerHTML as my contents
			//		- if this is a behavioral widget then apply behavior to that srcNodeRef
			//		- otherwise, replace srcNodeRef with my generated DOM tree
			// tags:
			//		private

			// First time widget is instantiated, scan prototype to figure out info about custom setters etc.
			this._introspect();

			// store pointer to original DOM tree
			this.srcNodeRef = dom.byId(srcNodeRef);

			// No longer used, remove for 2.0.
			this._connects = [];
			this._supportingWidgets = [];

			// this is here for back-compat, remove in 2.0 (but check NodeList-instantiate.html test)
			if(this.srcNodeRef && (typeof this.srcNodeRef.id == "string")){
				this.id = this.srcNodeRef.id;
			}

			// mix in our passed parameters
			if(params){
				this.params = params;
				lang.mixin(this, params);
			}
			this.postMixInProperties();

			// Generate an id for the widget if one wasn't specified, or it was specified as id: undefined.
			// Do this before buildRendering() because it might expect the id to be there.
			if(!this.id){
				this.id = registry.getUniqueId(this.declaredClass.replace(/\./g, "_"));
				if(this.params){
					// if params contains {id: undefined}, prevent _applyAttributes() from processing it
					delete this.params.id;
				}
			}

			// The document and <body> node this widget is associated with
			this.ownerDocument = this.ownerDocument || (this.srcNodeRef ? this.srcNodeRef.ownerDocument : document);
			this.ownerDocumentBody = win.body(this.ownerDocument);

			registry.add(this);

			this.buildRendering();

			var deleteSrcNodeRef;

			if(this.domNode){
				// Copy attributes listed in attributeMap into the [newly created] DOM for the widget.
				// Also calls custom setters for all attributes with custom setters.
				this._applyAttributes();

				// If srcNodeRef was specified, then swap out original srcNode for this widget's DOM tree.
				// For 2.0, move this after postCreate().  postCreate() shouldn't depend on the
				// widget being attached to the DOM since it isn't when a widget is created programmatically like
				// new MyWidget({}).	See #11635.
				var source = this.srcNodeRef;
				if(source && source.parentNode && this.domNode !== source){
					source.parentNode.replaceChild(this.domNode, source);
					deleteSrcNodeRef = true;
				}

				// Note: for 2.0 may want to rename widgetId to dojo._scopeName + "_widgetId",
				// assuming that dojo._scopeName even exists in 2.0
				this.domNode.setAttribute("widgetId", this.id);
			}
			this.postCreate();

			// If srcNodeRef has been processed and removed from the DOM (e.g. TemplatedWidget) then delete it to allow GC.
			// I think for back-compatibility it isn't deleting srcNodeRef until after postCreate() has run.
			if(deleteSrcNodeRef){
				delete this.srcNodeRef;
			}

			this._created = true;
		},

		_applyAttributes: function(){
			// summary:
			//		Step during widget creation to copy  widget attributes to the
			//		DOM according to attributeMap and _setXXXAttr objects, and also to call
			//		custom _setXXXAttr() methods.
			//
			//		Skips over blank/false attribute values, unless they were explicitly specified
			//		as parameters to the widget, since those are the default anyway,
			//		and setting tabIndex="" is different than not setting tabIndex at all.
			//
			//		For backwards-compatibility reasons attributeMap overrides _setXXXAttr when
			//		_setXXXAttr is a hash/string/array, but _setXXXAttr as a functions override attributeMap.
			// tags:
			//		private

			// Call this.set() for each property that was either specified as parameter to constructor,
			// or is in the list found above.	For correlated properties like value and displayedValue, the one
			// specified as a parameter should take precedence.
			// Particularly important for new DateTextBox({displayedValue: ...}) since DateTextBox's default value is
			// NaN and thus is not ignored like a default value of "".

			// Step 1: Save the current values of the widget properties that were specified as parameters to the constructor.
			// Generally this.foo == this.params.foo, except if postMixInProperties() changed the value of this.foo.
			var params = {};
			for(var key in this.params || {}){
				params[key] = this._get(key);
			}

			// Step 2: Call set() for each property with a non-falsy value that wasn't passed as a parameter to the constructor
			array.forEach(this.constructor._setterAttrs, function(key){
				if(!(key in params)){
					var val = this._get(key);
					if(val){
						this.set(key, val);
					}
				}
			}, this);

			// Step 3: Call set() for each property that was specified as parameter to constructor.
			// Use params hash created above to ignore side effects from step #2 above.
			for(key in params){
				this.set(key, params[key]);
			}
		},

		postMixInProperties: function(){
			// summary:
			//		Called after the parameters to the widget have been read-in,
			//		but before the widget template is instantiated. Especially
			//		useful to set properties that are referenced in the widget
			//		template.
			// tags:
			//		protected
		},

		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget, setting this.domNode.
			//		Most widgets will mixin `dijit._TemplatedMixin`, which implements this method.
			// tags:
			//		protected

			if(!this.domNode){
				// Create root node if it wasn't created by _TemplatedMixin
				this.domNode = this.srcNodeRef || this.ownerDocument.createElement("div");
			}

			// baseClass is a single class name or occasionally a space-separated list of names.
			// Add those classes to the DOMNode.  If RTL mode then also add with Rtl suffix.
			// TODO: make baseClass custom setter
			if(this.baseClass){
				var classes = this.baseClass.split(" ");
				if(!this.isLeftToRight()){
					classes = classes.concat(array.map(classes, function(name){
						return name + "Rtl";
					}));
				}
				domClass.add(this.domNode, classes);
			}
		},

		postCreate: function(){
			// summary:
			//		Processing after the DOM fragment is created
			// description:
			//		Called after the DOM fragment has been created, but not necessarily
			//		added to the document.  Do not include any operations which rely on
			//		node dimensions or placement.
			// tags:
			//		protected
		},

		startup: function(){
			// summary:
			//		Processing after the DOM fragment is added to the document
			// description:
			//		Called after a widget and its children have been created and added to the page,
			//		and all related widgets have finished their create() cycle, up through postCreate().
			//
			//		Note that startup() may be called while the widget is still hidden, for example if the widget is
			//		inside a hidden dijit/Dialog or an unselected tab of a dijit/layout/TabContainer.
			//		For widgets that need to do layout, it's best to put that layout code inside resize(), and then
			//		extend dijit/layout/_LayoutWidget so that resize() is called when the widget is visible.
			if(this._started){
				return;
			}
			this._started = true;
			array.forEach(this.getChildren(), function(obj){
				if(!obj._started && !obj._destroyed && lang.isFunction(obj.startup)){
					obj.startup();
					obj._started = true;
				}
			});
		},

		//////////// DESTROY FUNCTIONS ////////////////////////////////

		destroyRecursive: function(/*Boolean?*/ preserveDom){
			// summary:
			//		Destroy this widget and its descendants
			// description:
			//		This is the generic "destructor" function that all widget users
			//		should call to cleanly discard with a widget. Once a widget is
			//		destroyed, it is removed from the manager object.
			// preserveDom:
			//		If true, this method will leave the original DOM structure
			//		alone of descendant Widgets. Note: This will NOT work with
			//		dijit._TemplatedMixin widgets.

			this._beingDestroyed = true;
			this.destroyDescendants(preserveDom);
			this.destroy(preserveDom);
		},

		destroy: function(/*Boolean*/ preserveDom){
			// summary:
			//		Destroy this widget, but not its descendants.  Descendants means widgets inside of
			//		this.containerNode.   Will also destroy any resources (including widgets) registered via this.own().
			//
			//		This method will also destroy internal widgets such as those created from a template,
			//		assuming those widgets exist inside of this.domNode but outside of this.containerNode.
			//
			//		For 2.0 it's planned that this method will also destroy descendant widgets, so apps should not
			//		depend on the current ability to destroy a widget without destroying its descendants.   Generally
			//		they should use destroyRecursive() for widgets with children.
			// preserveDom: Boolean
			//		If true, this method will leave the original DOM structure alone.
			//		Note: This will not yet work with _TemplatedMixin widgets

			this._beingDestroyed = true;
			this.uninitialize();

			function destroy(w){
				if(w.destroyRecursive){
					w.destroyRecursive(preserveDom);
				}else if(w.destroy){
					w.destroy(preserveDom);
				}
			}

			// Back-compat, remove for 2.0
			array.forEach(this._connects, lang.hitch(this, "disconnect"));
			array.forEach(this._supportingWidgets, destroy);

			// Destroy supporting widgets, but not child widgets under this.containerNode (for 2.0, destroy child widgets
			// here too).   if() statement is to guard against exception if destroy() called multiple times (see #15815).
			if(this.domNode){
				array.forEach(registry.findWidgets(this.domNode, this.containerNode), destroy);
			}

			this.destroyRendering(preserveDom);
			registry.remove(this.id);
			this._destroyed = true;
		},

		destroyRendering: function(/*Boolean?*/ preserveDom){
			// summary:
			//		Destroys the DOM nodes associated with this widget.
			// preserveDom:
			//		If true, this method will leave the original DOM structure alone
			//		during tear-down. Note: this will not work with _Templated
			//		widgets yet.
			// tags:
			//		protected

			if(this.bgIframe){
				this.bgIframe.destroy(preserveDom);
				delete this.bgIframe;
			}

			if(this.domNode){
				if(preserveDom){
					domAttr.remove(this.domNode, "widgetId");
				}else{
					domConstruct.destroy(this.domNode);
				}
				delete this.domNode;
			}

			if(this.srcNodeRef){
				if(!preserveDom){
					domConstruct.destroy(this.srcNodeRef);
				}
				delete this.srcNodeRef;
			}
		},

		destroyDescendants: function(/*Boolean?*/ preserveDom){
			// summary:
			//		Recursively destroy the children of this widget and their
			//		descendants.
			// preserveDom:
			//		If true, the preserveDom attribute is passed to all descendant
			//		widget's .destroy() method. Not for use with _Templated
			//		widgets.

			// get all direct descendants and destroy them recursively
			array.forEach(this.getChildren(), function(widget){
				if(widget.destroyRecursive){
					widget.destroyRecursive(preserveDom);
				}
			});
		},

		uninitialize: function(){
			// summary:
			//		Deprecated. Override destroy() instead to implement custom widget tear-down
			//		behavior.
			// tags:
			//		protected
			return false;
		},

		////////////////// GET/SET, CUSTOM SETTERS, ETC. ///////////////////

		_setStyleAttr: function(/*String||Object*/ value){
			// summary:
			//		Sets the style attribute of the widget according to value,
			//		which is either a hash like {height: "5px", width: "3px"}
			//		or a plain string
			// description:
			//		Determines which node to set the style on based on style setting
			//		in attributeMap.
			// tags:
			//		protected

			var mapNode = this.domNode;

			// Note: technically we should revert any style setting made in a previous call
			// to his method, but that's difficult to keep track of.

			if(lang.isObject(value)){
				domStyle.set(mapNode, value);
			}else{
				if(mapNode.style.cssText){
					mapNode.style.cssText += "; " + value;
				}else{
					mapNode.style.cssText = value;
				}
			}

			this._set("style", value);
		},

		_attrToDom: function(/*String*/ attr, /*String*/ value, /*Object?*/ commands){
			// summary:
			//		Reflect a widget attribute (title, tabIndex, duration etc.) to
			//		the widget DOM, as specified by commands parameter.
			//		If commands isn't specified then it's looked up from attributeMap.
			//		Note some attributes like "type"
			//		cannot be processed this way as they are not mutable.
			// attr:
			//		Name of member variable (ex: "focusNode" maps to this.focusNode) pointing
			//		to DOMNode inside the widget, or alternately pointing to a subwidget
			// tags:
			//		private

			commands = arguments.length >= 3 ? commands : this.attributeMap[attr];

			array.forEach(lang.isArray(commands) ? commands : [commands], function(command){

				// Get target node and what we are doing to that node
				var mapNode = this[command.node || command || "domNode"];	// DOM node
				var type = command.type || "attribute";	// class, innerHTML, innerText, or attribute

				switch(type){
					case "attribute":
						if(lang.isFunction(value)){ // functions execute in the context of the widget
							value = lang.hitch(this, value);
						}

						// Get the name of the DOM node attribute; usually it's the same
						// as the name of the attribute in the widget (attr), but can be overridden.
						// Also maps handler names to lowercase, like onSubmit --> onsubmit
						var attrName = command.attribute ? command.attribute :
							(/^on[A-Z][a-zA-Z]*$/.test(attr) ? attr.toLowerCase() : attr);

						if(mapNode.tagName){
							// Normal case, mapping to a DOMNode.  Note that modern browsers will have a mapNode.set()
							// method, but for consistency we still call domAttr
							domAttr.set(mapNode, attrName, value);
						}else{
							// mapping to a sub-widget
							mapNode.set(attrName, value);
						}
						break;
					case "innerText":
						mapNode.innerHTML = "";
						mapNode.appendChild(this.ownerDocument.createTextNode(value));
						break;
					case "innerHTML":
						mapNode.innerHTML = value;
						break;
					case "class":
						domClass.replace(mapNode, value, this[attr]);
						break;
				}
			}, this);
		},

		get: function(name){
			// summary:
			//		Get a property from a widget.
			// name:
			//		The property to get.
			// description:
			//		Get a named property from a widget. The property may
			//		potentially be retrieved via a getter method. If no getter is defined, this
			//		just retrieves the object's property.
			//
			//		For example, if the widget has properties `foo` and `bar`
			//		and a method named `_getFooAttr()`, calling:
			//		`myWidget.get("foo")` would be equivalent to calling
			//		`widget._getFooAttr()` and `myWidget.get("bar")`
			//		would be equivalent to the expression
			//		`widget.bar2`
			var names = this._getAttrNames(name);
			return this[names.g] ? this[names.g]() : this._get(name);
		},

		set: function(name, value){
			// summary:
			//		Set a property on a widget
			// name:
			//		The property to set.
			// value:
			//		The value to set in the property.
			// description:
			//		Sets named properties on a widget which may potentially be handled by a
			//		setter in the widget.
			//
			//		For example, if the widget has properties `foo` and `bar`
			//		and a method named `_setFooAttr()`, calling
			//		`myWidget.set("foo", "Howdy!")` would be equivalent to calling
			//		`widget._setFooAttr("Howdy!")` and `myWidget.set("bar", 3)`
			//		would be equivalent to the statement `widget.bar = 3;`
			//
			//		set() may also be called with a hash of name/value pairs, ex:
			//
			//	|	myWidget.set({
			//	|		foo: "Howdy",
			//	|		bar: 3
			//	|	});
			//
			//	This is equivalent to calling `set(foo, "Howdy")` and `set(bar, 3)`

			if(typeof name === "object"){
				for(var x in name){
					this.set(x, name[x]);
				}
				return this;
			}
			var names = this._getAttrNames(name),
				setter = this[names.s];
			if(lang.isFunction(setter)){
				// use the explicit setter
				var result = setter.apply(this, Array.prototype.slice.call(arguments, 1));
			}else{
				// Mapping from widget attribute to DOMNode/subwidget attribute/value/etc.
				// Map according to:
				//		1. attributeMap setting, if one exists (TODO: attributeMap deprecated, remove in 2.0)
				//		2. _setFooAttr: {...} type attribute in the widget (if one exists)
				//		3. apply to focusNode or domNode if standard attribute name, excluding funcs like onClick.
				// Checks if an attribute is a "standard attribute" by whether the DOMNode JS object has a similar
				// attribute name (ex: accept-charset attribute matches jsObject.acceptCharset).
				// Note also that Tree.focusNode() is a function not a DOMNode, so test for that.
				var defaultNode = this.focusNode && !lang.isFunction(this.focusNode) ? "focusNode" : "domNode",
					tag = this[defaultNode] && this[defaultNode].tagName,
					attrsForTag = tag && (tagAttrs[tag] || (tagAttrs[tag] = getAttrs(this[defaultNode]))),
					map = name in this.attributeMap ? this.attributeMap[name] :
						names.s in this ? this[names.s] :
							((attrsForTag && names.l in attrsForTag && typeof value != "function") ||
								/^aria-|^data-|^role$/.test(name)) ? defaultNode : null;
				if(map != null){
					this._attrToDom(name, value, map);
				}
				this._set(name, value);
			}
			return result || this;
		},

		_attrPairNames: {}, // shared between all widgets
		_getAttrNames: function(name){
			// summary:
			//		Helper function for get() and set().
			//		Caches attribute name values so we don't do the string ops every time.
			// tags:
			//		private

			var apn = this._attrPairNames;
			if(apn[name]){
				return apn[name];
			}
			var uc = name.replace(/^[a-z]|-[a-zA-Z]/g, function(c){
				return c.charAt(c.length - 1).toUpperCase();
			});
			return (apn[name] = {
				n: name + "Node",
				s: "_set" + uc + "Attr", // converts dashes to camel case, ex: accept-charset --> _setAcceptCharsetAttr
				g: "_get" + uc + "Attr",
				l: uc.toLowerCase()        // lowercase name w/out dashes, ex: acceptcharset
			});
		},

		_set: function(/*String*/ name, /*anything*/ value){
			// summary:
			//		Helper function to set new value for specified property, and call handlers
			//		registered with watch() if the value has changed.
			var oldValue = this[name];
			this[name] = value;
			if(this._created && value !== oldValue){
				if(this._watchCallbacks){
					this._watchCallbacks(name, oldValue, value);
				}
				this.emit("attrmodified-" + name, {
					detail: {
						prevValue: oldValue,
						newValue: value
					}
				});
			}
		},

		_get: function(/*String*/ name){
			// summary:
			//		Helper function to get value for specified property stored by this._set(),
			//		i.e. for properties with custom setters.  Used mainly by custom getters.
			//
			//		For example, CheckBox._getValueAttr() calls this._get("value").

			// future: return name in this.props ? this.props[name] : this[name];
			return this[name];
		},

		emit: function(/*String*/ type, /*Object?*/ eventObj, /*Array?*/ callbackArgs){
			// summary:
			//		Used by widgets to signal that a synthetic event occurred, ex:
			//	|	myWidget.emit("attrmodified-selectedChildWidget", {}).
			//
			//		Emits an event on this.domNode named type.toLowerCase(), based on eventObj.
			//		Also calls onType() method, if present, and returns value from that method.
			//		By default passes eventObj to callback, but will pass callbackArgs instead, if specified.
			//		Modifies eventObj by adding missing parameters (bubbles, cancelable, widget).
			// tags:
			//		protected

			// Specify fallback values for bubbles, cancelable in case they are not set in eventObj.
			// Also set pointer to widget, although since we can't add a pointer to the widget for native events
			// (see #14729), maybe we shouldn't do it here?
			eventObj = eventObj || {};
			if(eventObj.bubbles === undefined){
				eventObj.bubbles = true;
			}
			if(eventObj.cancelable === undefined){
				eventObj.cancelable = true;
			}
			if(!eventObj.detail){
				eventObj.detail = {};
			}
			eventObj.detail.widget = this;

			var ret, callback = this["on" + type];
			if(callback){
				ret = callback.apply(this, callbackArgs ? callbackArgs : [eventObj]);
			}

			// Emit event, but avoid spurious emit()'s as parent sets properties on child during startup/destroy
			if(this._started && !this._beingDestroyed){
				on.emit(this.domNode, type.toLowerCase(), eventObj);
			}

			return ret;
		},

		on: function(/*String|Function*/ type, /*Function*/ func){
			// summary:
			//		Call specified function when event occurs, ex: myWidget.on("click", function(){ ... }).
			// type:
			//		Name of event (ex: "click") or extension event like touch.press.
			// description:
			//		Call specified function when event `type` occurs, ex: `myWidget.on("click", function(){ ... })`.
			//		Note that the function is not run in any particular scope, so if (for example) you want it to run in the
			//		widget's scope you must do `myWidget.on("click", lang.hitch(myWidget, func))`.

			// For backwards compatibility, if there's an onType() method in the widget then connect to that.
			// Remove in 2.0.
			var widgetMethod = this._onMap(type);
			if(widgetMethod){
				return aspect.after(this, widgetMethod, func, true);
			}

			// Otherwise, just listen for the event on this.domNode.
			return this.own(on(this.domNode, type, func))[0];
		},

		_onMap: function(/*String|Function*/ type){
			// summary:
			//		Maps on() type parameter (ex: "mousemove") to method name (ex: "onMouseMove").
			//		If type is a synthetic event like touch.press then returns undefined.
			var ctor = this.constructor, map = ctor._onMap;
			if(!map){
				map = (ctor._onMap = {});
				for(var attr in ctor.prototype){
					if(/^on/.test(attr)){
						map[attr.replace(/^on/, "").toLowerCase()] = attr;
					}
				}
			}
			return map[typeof type == "string" && type.toLowerCase()];	// String
		},

		toString: function(){
			// summary:
			//		Returns a string that represents the widget.
			// description:
			//		When a widget is cast to a string, this method will be used to generate the
			//		output. Currently, it does not implement any sort of reversible
			//		serialization.
			return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']'; // String
		},

		getChildren: function(){
			// summary:
			//		Returns all direct children of this widget, i.e. all widgets underneath this.containerNode whose parent
			//		is this widget.   Note that it does not return all descendants, but rather just direct children.
			//		Analogous to [Node.childNodes](https://developer.mozilla.org/en-US/docs/DOM/Node.childNodes),
			//		except containing widgets rather than DOMNodes.
			//
			//		The result intentionally excludes internally created widgets (a.k.a. supporting widgets)
			//		outside of this.containerNode.
			//
			//		Note that the array returned is a simple array.  Application code should not assume
			//		existence of methods like forEach().

			return this.containerNode ? registry.findWidgets(this.containerNode) : []; // dijit/_WidgetBase[]
		},

		getParent: function(){
			// summary:
			//		Returns the parent widget of this widget.

			return registry.getEnclosingWidget(this.domNode.parentNode);
		},

		connect: function(/*Object|null*/ obj, /*String|Function*/ event, /*String|Function*/ method){
			// summary:
			//		Deprecated, will be removed in 2.0, use this.own(on(...)) or this.own(aspect.after(...)) instead.
			//
			//		Connects specified obj/event to specified method of this object
			//		and registers for disconnect() on widget destroy.
			//
			//		Provide widget-specific analog to dojo.connect, except with the
			//		implicit use of this widget as the target object.
			//		Events connected with `this.connect` are disconnected upon
			//		destruction.
			// returns:
			//		A handle that can be passed to `disconnect` in order to disconnect before
			//		the widget is destroyed.
			// example:
			//	|	var btn = new Button();
			//	|	// when foo.bar() is called, call the listener we're going to
			//	|	// provide in the scope of btn
			//	|	btn.connect(foo, "bar", function(){
			//	|		console.debug(this.toString());
			//	|	});
			// tags:
			//		protected

			return this.own(connect.connect(obj, event, this, method))[0];	// handle
		},

		disconnect: function(handle){
			// summary:
			//		Deprecated, will be removed in 2.0, use handle.remove() instead.
			//
			//		Disconnects handle created by `connect`.
			// tags:
			//		protected

			handle.remove();
		},

		subscribe: function(t, method){
			// summary:
			//		Deprecated, will be removed in 2.0, use this.own(topic.subscribe()) instead.
			//
			//		Subscribes to the specified topic and calls the specified method
			//		of this object and registers for unsubscribe() on widget destroy.
			//
			//		Provide widget-specific analog to dojo.subscribe, except with the
			//		implicit use of this widget as the target object.
			// t: String
			//		The topic
			// method: Function
			//		The callback
			// example:
			//	|	var btn = new Button();
			//	|	// when /my/topic is published, this button changes its label to
			//	|	// be the parameter of the topic.
			//	|	btn.subscribe("/my/topic", function(v){
			//	|		this.set("label", v);
			//	|	});
			// tags:
			//		protected
			return this.own(topic.subscribe(t, lang.hitch(this, method)))[0];	// handle
		},

		unsubscribe: function(/*Object*/ handle){
			// summary:
			//		Deprecated, will be removed in 2.0, use handle.remove() instead.
			//
			//		Unsubscribes handle created by this.subscribe.
			//		Also removes handle from this widget's list of subscriptions
			// tags:
			//		protected

			handle.remove();
		},

		isLeftToRight: function(){
			// summary:
			//		Return this widget's explicit or implicit orientation (true for LTR, false for RTL)
			// tags:
			//		protected
			return this.dir ? (this.dir == "ltr") : domGeometry.isBodyLtr(this.ownerDocument); //Boolean
		},

		isFocusable: function(){
			// summary:
			//		Return true if this widget can currently be focused
			//		and false if not
			return this.focus && (domStyle.get(this.domNode, "display") != "none");
		},

		placeAt: function(/* String|DomNode|_Widget */ reference, /* String|Int? */ position){
			// summary:
			//		Place this widget somewhere in the DOM based
			//		on standard domConstruct.place() conventions.
			// description:
			//		A convenience function provided in all _Widgets, providing a simple
			//		shorthand mechanism to put an existing (or newly created) Widget
			//		somewhere in the dom, and allow chaining.
			// reference:
			//		Widget, DOMNode, or id of widget or DOMNode
			// position:
			//		If reference is a widget (or id of widget), and that widget has an ".addChild" method,
			//		it will be called passing this widget instance into that method, supplying the optional
			//		position index passed.  In this case position (if specified) should be an integer.
			//
			//		If reference is a DOMNode (or id matching a DOMNode but not a widget),
			//		the position argument can be a numeric index or a string
			//		"first", "last", "before", or "after", same as dojo/dom-construct::place().
			// returns: dijit/_WidgetBase
			//		Provides a useful return of the newly created dijit._Widget instance so you
			//		can "chain" this function by instantiating, placing, then saving the return value
			//		to a variable.
			// example:
			//	|	// create a Button with no srcNodeRef, and place it in the body:
			//	|	var button = new Button({ label:"click" }).placeAt(win.body());
			//	|	// now, 'button' is still the widget reference to the newly created button
			//	|	button.on("click", function(e){ console.log('click'); }));
			// example:
			//	|	// create a button out of a node with id="src" and append it to id="wrapper":
			//	|	var button = new Button({},"src").placeAt("wrapper");
			// example:
			//	|	// place a new button as the first element of some div
			//	|	var button = new Button({ label:"click" }).placeAt("wrapper","first");
			// example:
			//	|	// create a contentpane and add it to a TabContainer
			//	|	var tc = dijit.byId("myTabs");
			//	|	new ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)

			var refWidget = !reference.tagName && registry.byId(reference);
			if(refWidget && refWidget.addChild && (!position || typeof position === "number")){
				// Adding this to refWidget and can use refWidget.addChild() to handle everything.
				refWidget.addChild(this, position);
			}else{
				// "reference" is a plain DOMNode, or we can't use refWidget.addChild().   Use domConstruct.place() and
				// target refWidget.containerNode for nested placement (position==number, "first", "last", "only"), and
				// refWidget.domNode otherwise ("after"/"before"/"replace").  (But not supported officially, see #14946.)
				var ref = refWidget ?
					(refWidget.containerNode && !/after|before|replace/.test(position || "") ?
						refWidget.containerNode : refWidget.domNode) : dom.byId(reference, this.ownerDocument);
				domConstruct.place(this.domNode, ref, position);

				// Start this iff it has a parent widget that's already started.
				// TODO: for 2.0 maybe it should also start the widget when this.getParent() returns null??
				if(!this._started && (this.getParent() || {})._started){
					this.startup();
				}
			}
			return this;
		},

		defer: function(fcn, delay){
			// summary:
			//		Wrapper to setTimeout to avoid deferred functions executing
			//		after the originating widget has been destroyed.
			//		Returns an object handle with a remove method (that returns null) (replaces clearTimeout).
			// fcn: Function
			//		Function reference.
			// delay: Number?
			//		Delay, defaults to 0.
			// tags:
			//		protected

			var timer = setTimeout(lang.hitch(this,
				function(){
					if(!timer){
						return;
					}
					timer = null;
					if(!this._destroyed){
						lang.hitch(this, fcn)();
					}
				}),
				delay || 0
			);
			return {
				remove: function(){
					if(timer){
						clearTimeout(timer);
						timer = null;
					}
					return null; // so this works well: handle = handle.remove();
				}
			};
		}
	});

	if(has("dojo-bidi")){
		_WidgetBase.extend(_BidiMixin);
	}

	return _WidgetBase;
});

},
'dojo/Stateful':function(){
define(["./_base/declare", "./_base/lang", "./_base/array", "./when"], function(declare, lang, array, when){
	// module:
	//		dojo/Stateful

return declare("dojo.Stateful", null, {
	// summary:
	//		Base class for objects that provide named properties with optional getter/setter
	//		control and the ability to watch for property changes
	//
	//		The class also provides the functionality to auto-magically manage getters
	//		and setters for object attributes/properties.
	//		
	//		Getters and Setters should follow the format of _xxxGetter or _xxxSetter where 
	//		the xxx is a name of the attribute to handle.  So an attribute of "foo" 
	//		would have a custom getter of _fooGetter and a custom setter of _fooSetter.
	//
	// example:
	//	|	var obj = new dojo.Stateful();
	//	|	obj.watch("foo", function(){
	//	|		console.log("foo changed to " + this.get("foo"));
	//	|	});
	//	|	obj.set("foo","bar");

	// _attrPairNames: Hash
	//		Used across all instances a hash to cache attribute names and their getter 
	//		and setter names.
	_attrPairNames: {},

	_getAttrNames: function(name){
		// summary:
		//		Helper function for get() and set().
		//		Caches attribute name values so we don't do the string ops every time.
		// tags:
		//		private

		var apn = this._attrPairNames;
		if(apn[name]){ return apn[name]; }
		return (apn[name] = {
			s: "_" + name + "Setter",
			g: "_" + name + "Getter"
		});
	},

	postscript: function(/*Object?*/ params){
		// Automatic setting of params during construction
		if (params){ this.set(params); }
	},

	_get: function(name, names){
		// summary:
		//		Private function that does a get based off a hash of names
		// names:
		//		Hash of names of custom attributes
		return typeof this[names.g] === "function" ? this[names.g]() : this[name];
	},
	get: function(/*String*/name){
		// summary:
		//		Get a property on a Stateful instance.
		// name:
		//		The property to get.
		// returns:
		//		The property value on this Stateful instance.
		// description:
		//		Get a named property on a Stateful object. The property may
		//		potentially be retrieved via a getter method in subclasses. In the base class
		//		this just retrieves the object's property.
		//		For example:
		//	|	stateful = new dojo.Stateful({foo: 3});
		//	|	stateful.get("foo") // returns 3
		//	|	stateful.foo // returns 3

		return this._get(name, this._getAttrNames(name)); //Any
	},
	set: function(/*String*/name, /*Object*/value){
		// summary:
		//		Set a property on a Stateful instance
		// name:
		//		The property to set.
		// value:
		//		The value to set in the property.
		// returns:
		//		The function returns this dojo.Stateful instance.
		// description:
		//		Sets named properties on a stateful object and notifies any watchers of
		//		the property. A programmatic setter may be defined in subclasses.
		//		For example:
		//	|	stateful = new dojo.Stateful();
		//	|	stateful.watch(function(name, oldValue, value){
		//	|		// this will be called on the set below
		//	|	}
		//	|	stateful.set(foo, 5);
		//
		//	set() may also be called with a hash of name/value pairs, ex:
		//	|	myObj.set({
		//	|		foo: "Howdy",
		//	|		bar: 3
		//	|	})
		//	This is equivalent to calling set(foo, "Howdy") and set(bar, 3)

		// If an object is used, iterate through object
		if(typeof name === "object"){
			for(var x in name){
				if(name.hasOwnProperty(x) && x !="_watchCallbacks"){
					this.set(x, name[x]);
				}
			}
			return this;
		}

		var names = this._getAttrNames(name),
			oldValue = this._get(name, names),
			setter = this[names.s],
			result;
		if(typeof setter === "function"){
			// use the explicit setter
			result = setter.apply(this, Array.prototype.slice.call(arguments, 1));
		}else{
			// no setter so set attribute directly
			this[name] = value;
		}
		if(this._watchCallbacks){
			var self = this;
			// If setter returned a promise, wait for it to complete, otherwise call watches immediatly
			when(result, function(){
				self._watchCallbacks(name, oldValue, value);
			});
		}
		return this; // dojo/Stateful
	},
	_changeAttrValue: function(name, value){
		// summary:
		//		Internal helper for directly changing an attribute value.
		//
		// name: String
		//		The property to set.
		// value: Mixed
		//		The value to set in the property.
		//
		// description:
		//		Directly change the value of an attribute on an object, bypassing any 
		//		accessor setter.  Also handles the calling of watch and emitting events. 
		//		It is designed to be used by descendent class when there are two values 
		//		of attributes that are linked, but calling .set() is not appropriate.

		var oldValue = this.get(name);
		this[name] = value;
		if(this._watchCallbacks){
			this._watchCallbacks(name, oldValue, value);
		}
		return this; // dojo/Stateful
	},
	watch: function(/*String?*/name, /*Function*/callback){
		// summary:
		//		Watches a property for changes
		// name:
		//		Indicates the property to watch. This is optional (the callback may be the
		//		only parameter), and if omitted, all the properties will be watched
		// returns:
		//		An object handle for the watch. The unwatch method of this object
		//		can be used to discontinue watching this property:
		//		|	var watchHandle = obj.watch("foo", callback);
		//		|	watchHandle.unwatch(); // callback won't be called now
		// callback:
		//		The function to execute when the property changes. This will be called after
		//		the property has been changed. The callback will be called with the |this|
		//		set to the instance, the first argument as the name of the property, the
		//		second argument as the old value and the third argument as the new value.

		var callbacks = this._watchCallbacks;
		if(!callbacks){
			var self = this;
			callbacks = this._watchCallbacks = function(name, oldValue, value, ignoreCatchall){
				var notify = function(propertyCallbacks){
					if(propertyCallbacks){
						propertyCallbacks = propertyCallbacks.slice();
						for(var i = 0, l = propertyCallbacks.length; i < l; i++){
							propertyCallbacks[i].call(self, name, oldValue, value);
						}
					}
				};
				notify(callbacks['_' + name]);
				if(!ignoreCatchall){
					notify(callbacks["*"]); // the catch-all
				}
			}; // we use a function instead of an object so it will be ignored by JSON conversion
		}
		if(!callback && typeof name === "function"){
			callback = name;
			name = "*";
		}else{
			// prepend with dash to prevent name conflicts with function (like "name" property)
			name = '_' + name;
		}
		var propertyCallbacks = callbacks[name];
		if(typeof propertyCallbacks !== "object"){
			propertyCallbacks = callbacks[name] = [];
		}
		propertyCallbacks.push(callback);

		// TODO: Remove unwatch in 2.0
		var handle = {};
		handle.unwatch = handle.remove = function(){
			var index = array.indexOf(propertyCallbacks, callback);
			if(index > -1){
				propertyCallbacks.splice(index, 1);
			}
		};
		return handle; //Object
	}

});

});

},
'dijit/Destroyable':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/aspect",
	"dojo/_base/declare"
], function(array, aspect, declare){

	// module:
	//		dijit/Destroyable

	return declare("dijit.Destroyable", null, {
		// summary:
		//		Mixin to track handles and release them when instance is destroyed.
		// description:
		//		Call this.own(...) on list of handles (returned from dojo/aspect, dojo/on,
		//		dojo/Stateful::watch, or any class (including widgets) with a destroyRecursive() or destroy() method.
		//		Then call destroy() later to destroy this instance and release the resources.

		destroy: function(/*Boolean*/ preserveDom){
			// summary:
			//		Destroy this class, releasing any resources registered via own().
			this._destroyed = true;
		},

		own: function(){
			// summary:
			//		Track specified handles and remove/destroy them when this instance is destroyed, unless they were
			//		already removed/destroyed manually.
			// tags:
			//		protected
			// returns:
			//		The array of specified handles, so you can do for example:
			//	|		var handle = this.own(on(...))[0];

			array.forEach(arguments, function(handle){
				var destroyMethodName =
					"destroyRecursive" in handle ? "destroyRecursive" : // remove "destroyRecursive" for 2.0
						"destroy" in handle ? "destroy" :
							"remove";

				// When this.destroy() is called, destroy handle.  Since I'm using aspect.before(),
				// the handle will be destroyed before a subclass's destroy() method starts running, before it calls
				// this.inherited() or even if it doesn't call this.inherited() at all.  If that's an issue, make an
				// onDestroy() method and connect to that instead.
				var odh = aspect.before(this, "destroy", function(preserveDom){
					handle[destroyMethodName](preserveDom);
				});

				// If handle is destroyed manually before this.destroy() is called, remove the listener set directly above.
				var hdh = aspect.after(handle, destroyMethodName, function(){
					odh.remove();
					hdh.remove();
				}, true);
			}, this);

			return arguments;		// handle
		}
	});
});

},
'dojox/mobile/EdgeToEdgeDataList':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"./EdgeToEdgeList",
	"./_DataListMixin"
], function(kernel, declare, EdgeToEdgeList, DataListMixin){

	// module:
	//		dojox/mobile/EdgeToEdgeDataList

	kernel.deprecated("dojox/mobile/EdgeToEdgeDataList", 
		"Use dojox/mobile/EdgeToEdgeStoreList instead", "2.0");
	
	return declare("dojox.mobile.EdgeToEdgeDataList", [EdgeToEdgeList, DataListMixin],{
		// summary:
		//		A dojo/data-enabled version of EdgeToEdgeList.
		// description:
		//		EdgeToEdgeDataList is a subclass of EdgeToEdgeList which
		//		can generate ListItems according to the given dojo/data store.
	});
});

},
'dojox/mobile/EdgeToEdgeList':function(){
define([
	"dojo/_base/declare",
	"./RoundRectList"
], function(declare, RoundRectList){

	// module:
	//		dojox/mobile/EdgeToEdgeCategory

	return declare("dojox.mobile.EdgeToEdgeList", RoundRectList, {
		// summary:
		//		An edge-to-edge layout list.
		// description:
		//		EdgeToEdgeList is an edge-to-edge layout list, which displays
		//		all items in equally-sized rows. Each item must be a
		//		dojox/mobile/ListItem.
		
		// filterBoxClass: String
		//		The name of the CSS class added to the DOM node inside which is placed the 
		//		dojox/mobile/SearchBox created when mixing dojox/mobile/FilteredListMixin.
		//		The default value is "mblFilteredEdgeToEdgeListSearchBox". 
		filterBoxClass: "mblFilteredEdgeToEdgeListSearchBox",

		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeList";
		}
	});
});

},
'dojox/mobile/RoundRectList':function(){
define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/event",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase"
], function(array, declare, event, lang, win, domConstruct, domAttr, Contained, Container, WidgetBase){

	// module:
	//		dojox/mobile/RoundRectList

	return declare("dojox.mobile.RoundRectList", [WidgetBase, Container, Contained], {
		// summary:
		//		A rounded rectangle list.
		// description:
		//		RoundRectList is a rounded rectangle list, which can be used to
		//		display a group of items. Each item must be a dojox/mobile/ListItem.

		// transition: String
		//		The default animated transition effect for child items.
		transition: "slide",

		// iconBase: String
		//		The default icon path for child items.
		iconBase: "",

		// iconPos: String
		//		The default icon position for child items.
		iconPos: "",

		// select: String
		//		Selection mode of the list. The check mark is shown for the
		//		selected list item(s). The value can be "single", "multiple", or "".
		//		If "single", there can be only one selected item at a time.
		//		If "multiple", there can be multiple selected items at a time.
		//		If "", the check mark is not shown.
		select: "",

		// stateful: Boolean
		//		If true, the last selected item remains highlighted.
		stateful: false,

		// syncWithViews: [const] Boolean
		//		If true, this widget listens to view transition events to be
		//		synchronized with view's visibility.
		//		Note that changing the value of the property after the widget
		//		creation has no effect.
		syncWithViews: false,

		// editable: [const] Boolean
		//		If true, the list can be reordered.
		//		Note that changing the value of the property after the widget
		//		creation has no effect.
		editable: false,

		// tag: String
		//		A name of html tag to create as domNode.
		tag: "ul",

		/* internal properties */
		// editableMixinClass: String
		//		The name of the mixin class.
		editableMixinClass: "dojox/mobile/_EditableListMixin",
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblRoundRectList",
		
		// filterBoxClass: String
		//		The name of the CSS class added to the DOM node inside which is placed the 
		//		dojox/mobile/SearchBox created when mixing dojox/mobile/FilteredListMixin.
		//		The default value is "mblFilteredRoundRectListSearchBox".  
		filterBoxClass: "mblFilteredRoundRectListSearchBox",

		buildRendering: function(){
			this.domNode = this.srcNodeRef || domConstruct.create(this.tag);
			if(this.select){
				domAttr.set(this.domNode, "role", "listbox");
				if(this.select === "multiple"){
					domAttr.set(this.domNode, "aria-multiselectable", "true");
				}
			}
			this.inherited(arguments);
		},

		postCreate: function(){
			if(this.editable){
				require([this.editableMixinClass], lang.hitch(this, function(module){
					declare.safeMixin(this, new module());
				}));
			}
			this.connect(this.domNode, "onselectstart", event.stop);

			if(this.syncWithViews){ // see also TabBar#postCreate
				var f = function(view, moveTo, dir, transition, context, method){
					var child = array.filter(this.getChildren(), function(w){
						return w.moveTo === "#" + view.id || w.moveTo === view.id; })[0];
					if(child){ child.set("selected", true); }
				};
				this.subscribe("/dojox/mobile/afterTransitionIn", f);
				this.subscribe("/dojox/mobile/startView", f);
			}
		},

		resize: function(){
			// summary:
			//		Calls resize() of each child widget.
			array.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
		},

		onCheckStateChanged: function(/*Widget*//*===== listItem, =====*/ /*String*//*===== newState =====*/){
			// summary:
			//		Stub function to connect to from your application.
			// description:
			//		Called when the check state has been changed.
		},

		_setStatefulAttr: function(stateful){
			// tags:
			//		private
			this._set("stateful", stateful);
			this.selectOne = stateful;
			array.forEach(this.getChildren(), function(child){
				child.setArrow && child.setArrow();
			});
		},

		deselectItem: function(/*dojox/mobile/ListItem*/item){
			// summary:
			//		Deselects the given item.
			item.set("selected", false);
		},

		deselectAll: function(){
			// summary:
			//		Deselects all the items.
			array.forEach(this.getChildren(), function(child){
				child.set("selected", false);
			});
		},

		selectItem: function(/*ListItem*/item){
			// summary:
			//		Selects the given item.
			item.set("selected", true);
		}
	});
});

},
'dijit/_Container':function(){
define([
	"dojo/_base/array", // array.forEach array.indexOf
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.place
	"dojo/_base/kernel" // kernel.deprecated
], function(array, declare, domConstruct, kernel){

	// module:
	//		dijit/_Container

	return declare("dijit._Container", null, {
		// summary:
		//		Mixin for widgets that contain HTML and/or a set of widget children.

		buildRendering: function(){
			this.inherited(arguments);
			if(!this.containerNode){
				// All widgets with descendants must set containerNode.
				// NB: this code doesn't quite work right because for TabContainer it runs before
				// _TemplatedMixin::buildRendering(), and thus
				// sets this.containerNode to this.domNode, later to be overridden by the assignment in the template.
				this.containerNode = this.domNode;
			}
		},

		addChild: function(/*dijit/_WidgetBase*/ widget, /*int?*/ insertIndex){
			// summary:
			//		Makes the given widget a child of this widget.
			// description:
			//		Inserts specified child widget's dom node as a child of this widget's
			//		container node, and possibly does other processing (such as layout).

			// I want to just call domConstruct.place(widget.domNode, this.containerNode, insertIndex), but the counting
			// is thrown off by text nodes and comment nodes that show up when constructed by markup.
			// In the future consider stripping those nodes on construction, either in the parser or this widget code.
			var refNode = this.containerNode;
			if(insertIndex > 0){
				// Old-school way to get nth child; dojo.query would be easier but _Container was weened from dojo.query
				// in #10087 to minimize download size.   Not sure if that's still and issue with new smaller dojo/query.
				refNode = refNode.firstChild;
				while(insertIndex > 0){
					if(refNode.nodeType == 1){ insertIndex--; }
					refNode = refNode.nextSibling;
				}
				if(refNode){
					insertIndex = "before";
				}else{
					// to support addChild(child, n-1) where there are n children (should add child at end)
					refNode = this.containerNode;
					insertIndex = "last";
				}
			}

			domConstruct.place(widget.domNode, refNode, insertIndex);

			// If I've been started but the child widget hasn't been started,
			// start it now.  Make sure to do this after widget has been
			// inserted into the DOM tree, so it can see that it's being controlled by me,
			// so it doesn't try to size itself.
			if(this._started && !widget._started){
				widget.startup();
			}
		},

		removeChild: function(/*Widget|int*/ widget){
			// summary:
			//		Removes the passed widget instance from this widget but does
			//		not destroy it.  You can also pass in an integer indicating
			//		the index within the container to remove (ie, removeChild(5) removes the sixth widget).

			if(typeof widget == "number"){
				widget = this.getChildren()[widget];
			}

			if(widget){
				var node = widget.domNode;
				if(node && node.parentNode){
					node.parentNode.removeChild(node); // detach but don't destroy
				}
			}
		},

		hasChildren: function(){
			// summary:
			//		Returns true if widget has child widgets, i.e. if this.containerNode contains widgets.
			return this.getChildren().length > 0;	// Boolean
		},

		_getSiblingOfChild: function(/*dijit/_WidgetBase*/ child, /*int*/ dir){
			// summary:
			//		Get the next or previous widget sibling of child
			// dir:
			//		if 1, get the next sibling
			//		if -1, get the previous sibling
			// tags:
			//		private
			kernel.deprecated(this.declaredClass+"::_getSiblingOfChild() is deprecated. Use _KeyNavMixin::_getNext() instead.", "", "2.0");
			var children = this.getChildren(),
				idx = array.indexOf(children, child);	// int
			return children[idx + dir];
		},

		getIndexOfChild: function(/*dijit/_WidgetBase*/ child){
			// summary:
			//		Gets the index of the child in this container or -1 if not found
			return array.indexOf(this.getChildren(), child);	// int
		}
	});
});

},
'dojox/mobile/_DataListMixin':function(){
define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dijit/registry",
	"./_DataMixin",
	"./ListItem",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/_StoreListMixin"
], function(array, declare, registry, DataMixin, ListItem, has, BidiDataListMixin){

	// module:
	//		dojox/mobile/_DataListMixin

	var _DataListMixin = declare(has("dojo-bidi") ? "dojox.mobile._NonBidiDataListMixin" : "dojox.mobile._DataListMixin", DataMixin, {
		// summary:
		//		Mixin for widgets to generate the list items corresponding to
		//		the data provider object.
		// description:
		//		By mixing this class into the widgets, the list item nodes are
		//		generated as the child nodes of the widget and automatically
		//		regenerated whenever the corresponding data items are modified.

		// append: Boolean
		//		If true, refresh() does not clear the existing items.
		append: false,

		// itemMap: Object
		//		An optional parameter mapping field names from the store to ItemList name.
		// example:
		//	|	itemMap:{text:'label', profile_image_url:'icon' }
		itemMap: null,

		// itemRenderer: ListItem class or subclass
		//		The class used to create list items. Default is dojox/mobile/ListItem.
		itemRenderer: ListItem,

		buildRendering: function(){
			this.inherited(arguments);
			if(!this.store){ return; }
			var store = this.store;
			this.store = null;
			this.setStore(store, this.query, this.queryOptions);
		},

		createListItem: function(/*Object*/item){
			// summary:
			//		Creates a list item widget.
			var attr = {};
			var arr = this.store.getLabelAttributes(item);
			var labelAttr = arr ? arr[0] : null;
			array.forEach(this.store.getAttributes(item), function(name){
				if(name === labelAttr){
					attr["label"] = this.store.getLabel(item);
				}else{
					attr[(this.itemMap && this.itemMap[name]) || name] = this.store.getValue(item, name);
				}
			}, this);
			// TODO this code should be like for textDir in the bidi mixin createListItem method
			// however for that dynamic set/get of the dir property must be supported first
			// that is why for now as a workaround we keep the code here
			if(has("dojo-bidi") && typeof attr["dir"] == "undefined"){
				attr["dir"] = this.isLeftToRight() ? "ltr" : "rtl";
			}
			var w = new this.itemRenderer(attr);
			item._widgetId = w.id;
			return w;
		},
		generateList: function(/*Array*/items, /*Object*/dataObject){
			// summary:
			//		Given the data, generates a list of items.
			if(!this.append){
				array.forEach(this.getChildren(), function(child){
					child.destroyRecursive();
				});
			}
			array.forEach(items, function(item, index){
				this.addChild(this.createListItem(item));
			}, this);
		},

		onComplete: function(/*Array*/items, /*Object*/request){
			// summary:
			//		An handler that is called after the fetch completes.
			this.generateList(items, request);
		},

		onError: function(/*Object*/errorData, /*Object*/request){
			// summary:
			//		An error handler.
		},

		onSet: function(/*Object*/item, /*String*/attribute, /*Object|Array*/oldValue, /*Object|Array*/newValue){
			// summary:
			//		See dojo/data/api/Notification.onSet().
		},

		onNew: function(/*Object*/newItem, /*Object?*/parentInfo){
			// summary:
			//		See dojo/data/api/Notification.onNew().
			this.addChild(this.createListItem(newItem));
		},

		onDelete: function(/*Object*/deletedItem){
			// summary:
			//		See dojo/data/api/Notification.onDelete().
			registry.byId(deletedItem._widgetId).destroyRecursive();
		},

		onStoreClose: function(/*Object?*/request){
			// summary:
			//		Refresh list on close.
			if(this.store.clearOnClose){
				this.refresh();
			}
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile._DataListMixin", [_DataListMixin, BidiDataListMixin]) : _DataListMixin;	
});

},
'dojox/mobile/_DataMixin':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/Deferred"
], function(kernel, array, declare, lang, Deferred){

	// module:
	//		dojox/mobile/_DataMixin

	kernel.deprecated("dojox/mobile/_DataMixin", "Use dojox/mobile/_StoreMixin instead", "2.0");

	return declare("dojox.mobile._DataMixin", null, {
		// summary:
		//		Mixin for widgets to enable dojo/data data store.
		// description:
		//		By mixing this class into a widget, it can get data through a
		//		dojo/data data store. The widget must implement
		//		onComplete(/*Array*/items) to handle the retrieved data.

		// store: Object
		//		Reference to data provider object used by this widget.
		store: null,

		// query: Object
		//		A query that can be passed to 'store' to initially filter the items.
		query: null,

		// queryOptions: Object
		//		An optional parameter for the query.
		queryOptions: null,

		setStore: function(/*dojo/data/store*/store, /*dojo/data/api/Request|Object*/query, /*Object?*/queryOptions){
			// summary:
			//		Sets the store to use with this widget.
			if(store === this.store){ return null; }
			this.store = store;
			this._setQuery(query, queryOptions);
			if(store && store.getFeatures()["dojo.data.api.Notification"]){
				array.forEach(this._conn || [], this.disconnect, this);
				this._conn = [
					this.connect(store, "onSet", "onSet"),
					this.connect(store, "onNew", "onNew"),
					this.connect(store, "onDelete", "onDelete"),
					this.connect(store, "close", "onStoreClose")
				];
			}
			return this.refresh();
		},

		setQuery: function(/*dojo/data/api/Request|Object*/query, /*Object?*/queryOptions){
			// summary:
			//		Sets a query.
			this._setQuery(query, queryOptions);
			return this.refresh();
		},

		_setQuery: function(query, queryOptions){
			// tags:
			//		private
			this.query = query;
			this.queryOptions = queryOptions || this.queryOptions;
		},

		refresh: function(){
			// summary:
			//		Fetches the data and generates the list items.
			if(!this.store){ return null; }
			var d = new Deferred();
			var onComplete = lang.hitch(this, function(items, request){
				this.onComplete(items, request);
				d.resolve();
			});
			var onError = lang.hitch(this, function(errorData, request){
				this.onError(errorData, request);
				d.resolve();
			});
			var q = this.query;
			this.store.fetch({
				query: q,
				queryOptions: this.queryOptions,
				onComplete: onComplete,
				onError: onError,
				start: q && q.start,
				count: q && q.count
			});
			return d;
		}

/*
		// Subclass MUST implement the following methods.

		onComplete: function(items, request){
			// summary:
			//		An handler that is called after the fetch completes.
		},

		onError: function(errorData, request){
			// summary:
			//		An error handler.
		},

		onSet: function(item, attribute, oldValue, newValue){
			// summary:
			//		See dojo/data/api/Notification.onSet()
		},

		onNew: function(newItem, parentInfo){
			// summary:
			//		See dojo/data/api/Notification.onNew()
		},

		onDelete: function(deletedItem){
			// summary:
			//		See dojo/data/api/Notification.onDelete()
		},

		onStoreClose: function(request){
			// summary:
			//		Refresh list on close.
		}
*/
	});
});

},
'dojox/mobile/ListItem':function(){
define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/dom-attr",
	"dijit/registry",
	"dijit/_WidgetBase",
	"./iconUtils",
	"./_ItemBase",
	"./ProgressIndicator",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/ListItem"
], function(array, declare, lang, domClass, domConstruct, domStyle, domAttr, registry, WidgetBase, iconUtils, ItemBase, ProgressIndicator, has,  BidiListItem){

	// module:
	//		dojox/mobile/ListItem

	var ListItem = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiListItem" : "dojox.mobile.ListItem", ItemBase, {
		// summary:
		//		An item of either RoundRectList or EdgeToEdgeList.
		// description:
		//		ListItem represents an item of either RoundRectList or
		//		EdgeToEdgeList. There are three ways to move to a different view:
		//		moveTo, href, and url. You can choose only one of them.
		//
		//		A child DOM node (or widget) can have the layout attribute,
		//		whose value is "left", "right", or "center". Such nodes will be
		//		aligned as specified.
		// example:
		// |	<li data-dojo-type="dojox.mobile.ListItem">
		// |		<div layout="left">Left Node</div>
		// |		<div layout="right">Right Node</div>
		// |		<div layout="center">Center Node</div>
		// |	</li>
		//
		//		Note that even if you specify variableHeight="true" for the list
		//		and place a tall object inside the layout node as in the example
		//		below, the layout node does not expand as you may expect,
		//		because layout node is aligned using float:left, float:right, or
		//		position:absolute.
		// example:
		// |	<li data-dojo-type="dojox.mobile.ListItem" variableHeight="true">
		// |		<div layout="left"><img src="large-picture.jpg"></div>
		// |	</li>

		// rightText: String
		//		A right-aligned text to display on the item.
		rightText: "",

		// rightIcon: String
		//		An icon to display at the right hand side of the item. The value
		//		can be either a path for an image file or a class name of a DOM
		//		button.
		rightIcon: "",

		// rightIcon2: String
		//		An icon to display at the left of the rightIcon. The value can
		//		be either a path for an image file or a class name of a DOM
		//		button.
		rightIcon2: "",

		// deleteIcon: String
		//		A delete icon to display at the left of the item. The value can
		//		be either a path for an image file or a class name of a DOM
		//		button.
		deleteIcon: "",

		// anchorLabel: Boolean
		//		If true, the label text becomes a clickable anchor text. When
		//		the user clicks on the text, the onAnchorLabelClicked handler is
		//		called. You can override or connect to the handler and implement
		//		any action. The handler has no default action.
		anchorLabel: false,

		// noArrow: Boolean
		//		If true, the right hand side arrow is not displayed.
		noArrow: false,

		// checked: Boolean
		//		If true, a check mark is displayed at the right of the item.
		checked: false,

		// arrowClass: String
		//		An icon to display as an arrow. The value can be either a path
		//		for an image file or a class name of a DOM button.
		arrowClass: "",

		// checkClass: String
		//		An icon to display as a check mark. The value can be either a
		//		path for an image file or a class name of a DOM button.
		checkClass: "",

		// uncheckClass: String
		//		An icon to display as an uncheck mark. The value can be either a
		//		path for an image file or a class name of a DOM button.
		uncheckClass: "",

		// variableHeight: Boolean
		//		If true, the height of the item varies according to its content.
		variableHeight: false,

		// rightIconTitle: String
		//		An alt text for the right icon.
		rightIconTitle: "",

		// rightIcon2Title: String
		//		An alt text for the right icon2.
		rightIcon2Title: "",

		// header: Boolean
		//		If true, this item is rendered as a category header.
		header: false,

		// tag: String
		//		A name of html tag to create as domNode.
		tag: "li",

		// busy: Boolean
		//		If true, a progress indicator spins.
		busy: false,

		// progStyle: String
		//		A css class name to add to the progress indicator.
		progStyle: "",

		/* internal properties */	
		// The following properties are overrides of those in _ItemBase.
		paramsToInherit: "variableHeight,transition,deleteIcon,icon,rightIcon,rightIcon2,uncheckIcon,arrowClass,checkClass,uncheckClass,deleteIconTitle,deleteIconRole",
		baseClass: "mblListItem",

		_selStartMethod: "touch",
		_selEndMethod: "timer",
		_delayedSelection: true,

		_selClass: "mblListItemSelected",

		buildRendering: function(){
			this._templated = !!this.templateString; // true if this widget is templated
			if(!this._templated){
				// Create root node if it wasn't created by _TemplatedMixin
				this.domNode = this.containerNode = this.srcNodeRef || domConstruct.create(this.tag);
			}
			this.inherited(arguments);

			if(this.selected){
				domClass.add(this.domNode, this._selClass);
			}
			if(this.header){
				domClass.replace(this.domNode, "mblEdgeToEdgeCategory", this.baseClass);
			}

			if(!this._templated){
				this.labelNode =
					domConstruct.create("div", {className:"mblListItemLabel"});
				var ref = this.srcNodeRef;
				if(ref && ref.childNodes.length === 1 && ref.firstChild.nodeType === 3){
					// if ref has only one text node, regard it as a label
					this.labelNode.appendChild(ref.firstChild);
				}
				this.domNode.appendChild(this.labelNode);
			}
			this._layoutChildren = [];
		},

		startup: function(){
			if(this._started){ return; }
			var parent = this.getParent();
			var opts = this.getTransOpts();
			// When using a template, labelNode may be created via an attach point.
			// The attach points are not yet set when ListItem.buildRendering() 
			// executes, hence the need to use them in startup().
			if((!this._templated || this.labelNode) && this.anchorLabel){
				this.labelNode.style.display = "inline"; // to narrow the text region
				this.labelNode.style.cursor = "pointer";
				this.connect(this.labelNode, "onclick", "_onClick");
				this.onTouchStart = function(e){
					return (e.target !== this.labelNode);
				};
			}
			if(opts.moveTo || opts.href || opts.url || this.clickable || (parent && parent.select)){
				this.connect(this.domNode, "onkeydown", "_onClick"); // for desktop browsers
			}else{
				this._handleClick = false;
			}

			this.inherited(arguments);
			
			if(domClass.contains(this.domNode, "mblVariableHeight")){
				this.variableHeight = true;
			}
			if(this.variableHeight){
				domClass.add(this.domNode, "mblVariableHeight");
				this.defer("layoutVariableHeight");
			}

			if(!this._isOnLine){
				this._isOnLine = true;
				this.set({ 
					// retry applying the attributes for which the custom setter delays the actual 
					// work until _isOnLine is true
					icon: this._pending_icon !== undefined ? this._pending_icon : this.icon,
					deleteIcon: this._pending_deleteIcon !== undefined ? this._pending_deleteIcon : this.deleteIcon,
					rightIcon: this._pending_rightIcon !== undefined ? this._pending_rightIcon : this.rightIcon,
					rightIcon2: this._pending_rightIcon2 !== undefined ? this._pending_rightIcon2 : this.rightIcon2,
					uncheckIcon: this._pending_uncheckIcon !== undefined ? this._pending_uncheckIcon : this.uncheckIcon 
				});
				// Not needed anymore (this code executes only once per life cycle):
				delete this._pending_icon;
				delete this._pending_deleteIcon;
				delete this._pending_rightIcon;
				delete this._pending_rightIcon2;
				delete this._pending_uncheckIcon;
			}
			if(parent && parent.select){
				// retry applying the attributes for which the custom setter delays the actual 
				// work until _isOnLine is true. 
				this.set("checked", this._pendingChecked !== undefined ? this._pendingChecked : this.checked);
				domAttr.set(this.domNode, "role", "option");
				if(this._pendingChecked || this.checked){
					domAttr.set(this.domNode, "aria-selected", "true");
				}
				// Not needed anymore (this code executes only once per life cycle):
				delete this._pendingChecked; 
			}
			this.setArrow();
			this.layoutChildren();
		},

		_updateHandles: function(){
			// tags:
			//		private
			var parent = this.getParent();
			var opts = this.getTransOpts();
			if(opts.moveTo || opts.href || opts.url || this.clickable || (parent && parent.select)){
				if(!this._keydownHandle){
					this._keydownHandle = this.connect(this.domNode, "onkeydown", "_onClick"); // for desktop browsers
				}
				this._handleClick = true;
			}else{
				if(this._keydownHandle){
					this.disconnect(this._keydownHandle);
					this._keydownHandle = null;
				}
				this._handleClick = false;
			}
			this.inherited(arguments);
		},

		layoutChildren: function(){
			var centerNode;
			array.forEach(this.domNode.childNodes, function(n){
				if(n.nodeType !== 1){ return; }
				var layout = n.getAttribute("layout") || // TODO: Remove the non-HTML5-compliant attribute in 2.0
					n.getAttribute("data-mobile-layout") || 
					(registry.byNode(n) || {}).layout;
				if(layout){ 
					domClass.add(n, "mblListItemLayout" +
						layout.charAt(0).toUpperCase() + layout.substring(1));
					this._layoutChildren.push(n);
					if(layout === "center"){ centerNode = n; }
				}
			}, this);
			if(centerNode){
				this.domNode.insertBefore(centerNode, this.domNode.firstChild);
			}
		},

		resize: function(){
			if(this.variableHeight){
				this.layoutVariableHeight();
			}

			// labelNode may not exist only when using a template (if not created by an attach point)
			if(!this._templated || this.labelNode){
				// If labelNode is empty, shrink it so as not to prevent user clicks.
				this.labelNode.style.display = this.labelNode.firstChild ? "block" : "inline";
			}
		},

		_onTouchStart: function(e){
			// tags:
			//		private
			if(e.target.getAttribute("preventTouch") || // TODO: Remove the non-HTML5-compliant attribute in 2.0
				e.target.getAttribute("data-mobile-prevent-touch") ||
				(registry.getEnclosingWidget(e.target) || {}).preventTouch){
				return;
			}
			this.inherited(arguments);
		},

		_onClick: function(e){
			// summary:
			//		Internal handler for click events.
			// tags:
			//		private
			if(this.getParent().isEditing || e && e.type === "keydown" && e.keyCode !== 13){ return; }
			if(this.onClick(e) === false){ return; } // user's click action
			var n = this.labelNode;
			// labelNode may not exist only when using a template 
			if((this._templated || n) && this.anchorLabel && e.currentTarget === n){
				domClass.add(n, "mblListItemLabelSelected");
				this.defer(function(){
					domClass.remove(n, "mblListItemLabelSelected");
				}, this._duration);
				this.onAnchorLabelClicked(e);
				return;
			}
			var parent = this.getParent();
			if(parent.select){
				if(parent.select === "single"){
					if(!this.checked){
						this.set("checked", true);
					}
				}else if(parent.select === "multiple"){
					this.set("checked", !this.checked);
				}
			}
			this.defaultClickAction(e);
		},

		onClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined function to handle clicks.
			// tags:
			//		callback
		},

		onAnchorLabelClicked: function(e){
			// summary:
			//		Stub function to connect to from your application.
		},

		layoutVariableHeight: function(){
			// summary:
			//		Lays out the current item with variable height.
			var h = this.domNode.offsetHeight;
			if(h === this.domNodeHeight){ return; }
			this.domNodeHeight = h;
			array.forEach(this._layoutChildren.concat([
				this.rightTextNode,
				this.rightIcon2Node,
				this.rightIconNode,
				this.uncheckIconNode,
				this.iconNode,
				this.deleteIconNode,
				this.knobIconNode
			]), function(n){
				if(n){
					var domNode = this.domNode;
					var f = function(){
						var t = Math.round((domNode.offsetHeight - n.offsetHeight) / 2) -
							domStyle.get(domNode, "paddingTop");
						n.style.marginTop = t + "px";
					}
					if(n.offsetHeight === 0 && n.tagName === "IMG"){
						n.onload = f;
					}else{
						f();
					}
				}
			}, this);
		},

		setArrow: function(){
			// summary:
			//		Sets the arrow icon if necessary.
			if(this.checked){ return; }
			var c = "";
			var parent = this.getParent();
			var opts = this.getTransOpts();
			if(opts.moveTo || opts.href || opts.url || this.clickable){
				if(!this.noArrow && !(parent && parent.selectOne)){
					c = this.arrowClass || "mblDomButtonArrow";
					domAttr.set(this.domNode, "role", "button");
				}
			}
			if(c){
				this._setRightIconAttr(c);
			}
		},

		_findRef: function(/*String*/type){
			// summary:
			//		Find an appropriate position to insert a new child node.
			// tags:
			//		private
			var i, node, list = ["deleteIcon", "icon", "rightIcon", "uncheckIcon", "rightIcon2", "rightText"];
			for(i = array.indexOf(list, type) + 1; i < list.length; i++){
				node = this[list[i] + "Node"];
				if(node){ return node; }
			}
			for(i = list.length - 1; i >= 0; i--){
				node = this[list[i] + "Node"];
				if(node){ return node.nextSibling; }
			}
			return this.domNode.firstChild;
		},
		
		_setIcon: function(/*String*/icon, /*String*/type){
			// tags:
			//		private
			if(!this._isOnLine){
				// record the value to be able to reapply it (see the code in the startup method)
				this["_pending_" + type] = icon;
				return; 
			} // icon may be invalid because inheritParams is not called yet
			this._set(type, icon);
			this[type + "Node"] = iconUtils.setIcon(icon, this[type + "Pos"],
				this[type + "Node"], this[type + "Title"] || this.alt, this.domNode, this._findRef(type), "before");
			if(this[type + "Node"]){
				var cap = type.charAt(0).toUpperCase() + type.substring(1);
				domClass.add(this[type + "Node"], "mblListItem" + cap);
			}
			var role = this[type + "Role"];
			if(role){
				this[type + "Node"].setAttribute("role", role);
			}
		},

		_setDeleteIconAttr: function(/*String*/icon){
			// tags:
			//		private
			this._setIcon(icon, "deleteIcon");
		},

		_setIconAttr: function(icon){
			// tags:
			//		private
			this._setIcon(icon, "icon");
		},

		_setRightTextAttr: function(/*String*/text){
			// tags:
			//		private
			if(!this._templated && !this.rightTextNode){
				// When using a template, let the template create the element.
				this.rightTextNode = domConstruct.create("div", {className:"mblListItemRightText"}, this.labelNode, "before");
			}
			this.rightText = text;
			this.rightTextNode.innerHTML = this._cv ? this._cv(text) : text;
		},

		_setRightIconAttr: function(/*String*/icon){
			// tags:
			//		private
			this._setIcon(icon, "rightIcon");
		},

		_setUncheckIconAttr: function(/*String*/icon){
			// tags:
			//		private
			this._setIcon(icon, "uncheckIcon");
		},

		_setRightIcon2Attr: function(/*String*/icon){
			// tags:
			//		private
			this._setIcon(icon, "rightIcon2");
		},

		_setCheckedAttr: function(/*Boolean*/checked){
			// tags:
			//		private
			if(!this._isOnLine){
				// record the value to be able to reapply it (see the code in the startup method)
				this._pendingChecked = checked; 
				return; 
			} // icon may be invalid because inheritParams is not called yet
			var parent = this.getParent();
			if(parent && parent.select === "single" && checked){
				array.forEach(parent.getChildren(), function(child){
					child !== this && child.checked && child.set("checked", false) && domAttr.set(child.domNode, "aria-selected", "false");
				}, this);
			}
			this._setRightIconAttr(this.checkClass || "mblDomButtonCheck");
			this._setUncheckIconAttr(this.uncheckClass);

			domClass.toggle(this.domNode, "mblListItemChecked", checked);
			domClass.toggle(this.domNode, "mblListItemUnchecked", !checked);
			domClass.toggle(this.domNode, "mblListItemHasUncheck", !!this.uncheckIconNode);
			this.rightIconNode.style.position = (this.uncheckIconNode && !checked) ? "absolute" : "";

			if(parent && this.checked !== checked){
				parent.onCheckStateChanged(this, checked);
			}
			this._set("checked", checked);
			domAttr.set(this.domNode, "aria-selected", checked ? "true" : "false");
		},

		_setBusyAttr: function(/*Boolean*/busy){
			// tags:
			//		private
			var prog = this._prog;
			if(busy){
				if(!this._progNode){
					this._progNode = domConstruct.create("div", {className:"mblListItemIcon"});
					prog = this._prog = new ProgressIndicator({size:25, center:false, removeOnStop:false});
					domClass.add(prog.domNode, this.progStyle);
					this._progNode.appendChild(prog.domNode);
				}
				if(this.iconNode){
					this.domNode.replaceChild(this._progNode, this.iconNode);
				}else{
					domConstruct.place(this._progNode, this._findRef("icon"), "before");
				}
				prog.start();
			}else if(this._progNode){
				if(this.iconNode){
					this.domNode.replaceChild(this.iconNode, this._progNode);
				}else{
					this.domNode.removeChild(this._progNode);
				}
				prog.stop();
			}
			this._set("busy", busy);
		},

		_setSelectedAttr: function(/*Boolean*/selected){
			// summary:
			//		Makes this widget in the selected or unselected state.
			// tags:
			//		private
			this.inherited(arguments);
			domClass.toggle(this.domNode, this._selClass, selected);
		},
		
		_setClickableAttr: function(/*Boolean*/clickable){
			// tags:
			//		private
			this._set("clickable", clickable);
			this._updateHandles();
		},
		
		_setMoveToAttr: function(/*String*/moveTo){
			// tags:
			//		private
			this._set("moveTo", moveTo);
			this._updateHandles();
		},
		
		_setHrefAttr: function(/*String*/href){
			// tags:
			//		private
			this._set("href", href);
			this._updateHandles();
		},
		
		_setUrlAttr: function(/*String*/url){
			// tags:
			//		private
			this._set("url", url);
			this._updateHandles();
		}
	});
	
	ListItem.ChildWidgetProperties = {
		// summary:
		//		These properties can be specified for the children of a dojox/mobile/ListItem.

		// layout: String
		//		Specifies the position of the ListItem child ("left", "center" or "right").
		layout: "",

		// preventTouch: Boolean
		//		Disables touch events on the ListItem child.
		preventTouch: false
	};
	
	// Since any widget can be specified as a ListItem child, mix ChildWidgetProperties
	// into the base widget class.  (This is a hack, but it's effective.)
	// This is for the benefit of the parser.   Remove for 2.0.  Also, hide from doc viewer.
	lang.extend(WidgetBase, /*===== {} || =====*/ ListItem.ChildWidgetProperties);

	return has("dojo-bidi") ? declare("dojox.mobile.ListItem", [ListItem, BidiListItem]) : ListItem;	
});

},
'dojox/mobile/iconUtils':function(){
define([
	"dojo/_base/array",
	"dojo/_base/config",
	"dojo/_base/connect",
	"dojo/_base/event",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"./sniff"
], function(array, config, connect, event, lang, win, domClass, domConstruct, domStyle, has){

	var dm = lang.getObject("dojox.mobile", true);

	// module:
	//		dojox/mobile/iconUtils

	var IconUtils = function(){
		// summary:
		//		Utilities to create an icon (image, CSS sprite image, or DOM Button).

		this.setupSpriteIcon = function(/*DomNode*/iconNode, /*String*/iconPos){
			// summary:
			//		Sets up CSS sprite for a foreground image.
			if(iconNode && iconPos){
				var arr = array.map(iconPos.split(/[ ,]/),function(item){return item-0});
				var t = arr[0]; // top
				var r = arr[1] + arr[2]; // right
				var b = arr[0] + arr[3]; // bottom
				var l = arr[1]; // left
				domStyle.set(iconNode, {
					position: "absolute",
					clip: "rect("+t+"px "+r+"px "+b+"px "+l+"px)",
					top: (iconNode.parentNode ? domStyle.get(iconNode, "top") : 0) - t + "px",
					left: -l + "px"
				});
				domClass.add(iconNode, "mblSpriteIcon");
			}
		};

		this.createDomButton = function(/*DomNode*/refNode, /*Object?*/style, /*DomNode?*/toNode){
			// summary:
			//		Creates a DOM button.
			// description:
			//		DOM button is a simple graphical object that consists of one or
			//		more nested DIV elements with some CSS styling. It can be used
			//		in place of an icon image on ListItem, IconItem, and so on.
			//		The kind of DOM button to create is given as a class name of
			//		refNode. The number of DIVs to create is searched from the style
			//		sheets in the page. However, if the class name has a suffix that
			//		starts with an underscore, like mblDomButtonGoldStar_5, then the
			//		suffixed number is used instead. A class name for DOM button
			//		must starts with 'mblDomButton'.
			// refNode:
			//		A node that has a DOM button class name.
			// style:
			//		A hash object to set styles to the node.
			// toNode:
			//		A root node to create a DOM button. If omitted, refNode is used.

			if(!this._domButtons){
				if(has("webkit")){
					var findDomButtons = function(sheet, dic){
						// summary:
						//		Searches the style sheets for DOM buttons.
						// description:
						//		Returns a key-value pair object whose keys are DOM
						//		button class names and values are the number of DOM
						//		elements they need.
						var i, j;
						if(!sheet){
							var _dic = {};
							var ss = win.doc.styleSheets;
							for (i = 0; i < ss.length; i++){
								ss[i] && findDomButtons(ss[i], _dic);
							}
							return _dic;
						}
						var rules = sheet.cssRules || [];
						for (i = 0; i < rules.length; i++){
							var rule = rules[i];
							if(rule.href && rule.styleSheet){
								findDomButtons(rule.styleSheet, dic);
							}else if(rule.selectorText){
								var sels = rule.selectorText.split(/,/);
								for (j = 0; j < sels.length; j++){
									var sel = sels[j];
									var n = sel.split(/>/).length - 1;
									if(sel.match(/(mblDomButton\w+)/)){
										var cls = RegExp.$1;
										if(!dic[cls] || n > dic[cls]){
											dic[cls] = n;
										}
									}
								}
							}
						}
						return dic;
					}
					this._domButtons = findDomButtons();
				}else{
					this._domButtons = {};
				}
			}

			var s = refNode.className;
			var node = toNode || refNode;
			if(s.match(/(mblDomButton\w+)/) && s.indexOf("/") === -1){
				var btnClass = RegExp.$1;
				var nDiv = 4;
				if(s.match(/(mblDomButton\w+_(\d+))/)){
					nDiv = RegExp.$2 - 0;
				}else if(this._domButtons[btnClass] !== undefined){
					nDiv = this._domButtons[btnClass];
				}
				var props = null;
				if(has("bb") && config.mblBBBoxShadowWorkaround !== false){
					// Removes box-shadow because BlackBerry incorrectly renders it.
					props = {style:"-webkit-box-shadow:none"};
				}
				for(var i = 0, p = node; i < nDiv; i++){
					p = p.firstChild || domConstruct.create("div", props, p);
				}
				if(toNode){
					setTimeout(function(){
						domClass.remove(refNode, btnClass);
					}, 0);
					domClass.add(toNode, btnClass);
				}
			}else if(s.indexOf(".") !== -1){ // file name
				domConstruct.create("img", {src:s}, node);
			}else{
				return null;
			}
			domClass.add(node, "mblDomButton");
			!!style && domStyle.set(node, style);
			return node;
		};

		this.createIcon = function(/*String*/icon, /*String?*/iconPos, /*DomNode?*/node, /*String?*/title, /*DomNode?*/parent, /*DomNode?*/refNode, /*String?*/pos){
			// summary:
			//		Creates or updates an icon node
			// description:
			//		If node exists, updates the existing node. Otherwise, creates a new one.
			// icon:
			//		Path for an image, or DOM button class name.
			title = title || "";
			if(icon && icon.indexOf("mblDomButton") === 0){
				// DOM button
				if(!node){
					node = domConstruct.create("div", null, refNode || parent, pos);
				}else{
					if(node.className.match(/(mblDomButton\w+)/)){
						domClass.remove(node, RegExp.$1);
					}
				}
				node.title = title;
				domClass.add(node, icon);
				this.createDomButton(node);
			}else if(icon && icon !== "none"){
				// Image
				if(!node || node.nodeName !== "IMG"){
					node = domConstruct.create("img", {
						alt: title
					}, refNode || parent, pos);
				}
				node.src = (icon || "").replace("${theme}", dm.currentTheme);
				this.setupSpriteIcon(node, iconPos);
				if(iconPos && parent){
					var arr = iconPos.split(/[ ,]/);
					domStyle.set(parent, {
						position: "relative",
						width: arr[2] + "px",
						height: arr[3] + "px"
					});
					domClass.add(parent, "mblSpriteIconParent");
				}
				connect.connect(node, "ondragstart", event, "stop");
			}
			return node;
		};

		this.iconWrapper = false;
		this.setIcon = function(/*String*/icon, /*String*/iconPos, /*DomNode*/iconNode, /*String?*/alt, /*DomNode*/parent, /*DomNode?*/refNode, /*String?*/pos){
			// summary:
			//		A setter function to set an icon.
			// description:
			//		This function is intended to be used by icon setters (e.g. _setIconAttr)
			// icon:
			//		An icon path or a DOM button class name.
			// iconPos:
			//		The position of an aggregated icon. IconPos is comma separated
			//		values like top,left,width,height (ex. "0,0,29,29").
			// iconNode:
			//		An icon node.
			// alt:
			//		An alt text for the icon image.
			// parent:
			//		Parent node of the icon.
			// refNode:
			//		A node reference to place the icon.
			// pos:
			//		The position of the icon relative to refNode.
			if(!parent || !icon && !iconNode){ return null; }
			if(icon && icon !== "none"){ // create or update an icon
				if(!this.iconWrapper && icon.indexOf("mblDomButton") !== 0 && !iconPos){ // image
					if(iconNode && iconNode.tagName === "DIV"){
						domConstruct.destroy(iconNode);
						iconNode = null;
					}
					iconNode = this.createIcon(icon, null, iconNode, alt, parent, refNode, pos);
					domClass.add(iconNode, "mblImageIcon");
				}else{ // sprite or DOM button
					if(iconNode && iconNode.tagName === "IMG"){
						domConstruct.destroy(iconNode);
						iconNode = null;
					}
					iconNode && domConstruct.empty(iconNode);
					if(!iconNode){
						iconNode = domConstruct.create("div", null, refNode || parent, pos);
					}
					this.createIcon(icon, iconPos, null, null, iconNode);
					if(alt){
						iconNode.title = alt;
					}
				}
				domClass.remove(parent, "mblNoIcon");
				return iconNode;
			}else{ // clear the icon
				domConstruct.destroy(iconNode);
				domClass.add(parent, "mblNoIcon");
				return null;
			}
		};
	};

	// Return singleton.  (TODO: can we replace IconUtils class and singleton w/a simple hash of functions?)
	return new IconUtils();
});

},
'dojox/mobile/_ItemBase':function(){
define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/touch",
	"dijit/registry",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase",
	"./TransitionEvent",
	"./iconUtils",
	"./sniff",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/_ItemBase"
], function(array, declare, lang, win, domClass, touch, registry, Contained, Container, WidgetBase, TransitionEvent, iconUtils, has, BidiItemBase){

	// module:
	//		dojox/mobile/_ItemBase

	var _ItemBase = declare(has("dojo-bidi") ? "dojox.mobile._NonBidiItemBase" : "dojox.mobile._ItemBase", [WidgetBase, Container, Contained], {
		// summary:
		//		A base class for item classes (e.g. ListItem, IconItem, etc.).
		// description:
		//		_ItemBase is a base class for widgets that have capability to
		//		make a view transition when clicked.

		// icon: String
		//		An icon image to display. The value can be either a path for an
		//		image file or a class name of a DOM button. If icon is not
		//		specified, the iconBase parameter of the parent widget is used.
		icon: "",

		// iconPos: String
		//		The position of an aggregated icon. IconPos is comma separated
		//		values like top,left,width,height (ex. "0,0,29,29"). If iconPos
		//		is not specified, the iconPos parameter of the parent widget is
		//		used.
		iconPos: "", // top,left,width,height (ex. "0,0,29,29")

		// alt: String
		//		An alternate text for the icon image.
		alt: "",

		// href: String
		//		A URL of another web page to go to.
		href: "",

		// hrefTarget: String
		//		A target that specifies where to open a page specified by
		//		href. The value will be passed to the 2nd argument of
		//		window.open().
		hrefTarget: "",

		// moveTo: String
		//		The id of the transition destination view which resides in the
		//		current page.
		//
		//		If the value has a hash sign ('#') before the id (e.g. #view1)
		//		and the dojo/hash module is loaded by the user application, the
		//		view transition updates the hash in the browser URL so that the
		//		user can bookmark the destination view. In this case, the user
		//		can also use the browser's back/forward button to navigate
		//		through the views in the browser history.
		//
		//		If null, transitions to a blank view.
		//		If '#', returns immediately without transition.
		moveTo: "",

		// scene: String
		//		The name of a scene. Used from dojox/mobile/app.
		scene: "",

		// clickable: Boolean
		//		If true, this item becomes clickable even if a transition
		//		destination (moveTo, etc.) is not specified.
		clickable: false,

		// url: String
		//		A URL of an html fragment page or JSON data that represents a
		//		new view content. The view content is loaded with XHR and
		//		inserted in the current page. Then a view transition occurs to
		//		the newly created view. The view is cached so that subsequent
		//		requests would not load the content again.
		url: "",

		// urlTarget: String
		//		Node id under which a new view will be created according to the
		//		url parameter. If not specified, The new view will be created as
		//		a sibling of the current view.
		urlTarget: "",

		// back: Boolean
		//		If true, history.back() is called when clicked.
		back: false,

		// transition: String
		//		A type of animated transition effect. You can choose from the
		//		standard transition types, "slide", "fade", "flip", or from the
		//		extended transition types, "cover", "coverv", "dissolve",
		//		"reveal", "revealv", "scaleIn", "scaleOut", "slidev",
		//		"swirl", "zoomIn", "zoomOut", "cube", and "swap". If "none" is
		//		specified, transition occurs immediately without animation.
		transition: "",

		// transitionDir: Number
		//		The transition direction. If 1, transition forward. If -1,
		//		transition backward. For example, the slide transition slides
		//		the view from right to left when dir == 1, and from left to
		//		right when dir == -1.
		transitionDir: 1,

		// transitionOptions: Object
		//		A hash object that holds transition options.
		transitionOptions: null,

		// callback: Function|String
		//		A callback function that is called when the transition has been
		//		finished. A function reference, or name of a function in
		//		context.
		callback: null,

		// label: String
		//		A label of the item. If the label is not specified, innerHTML is
		//		used as a label.
		label: "",

		// toggle: Boolean
		//		If true, the item acts like a toggle button.
		toggle: false,

		// selected: Boolean
		//		If true, the item is highlighted to indicate it is selected.
		selected: false,

		// tabIndex: String
		//		Tabindex setting for the item so users can hit the tab key to
		//		focus on it.
		tabIndex: "0",
		
		// _setTabIndexAttr: [private] String
		//		Sets tabIndex to domNode.
		_setTabIndexAttr: "",

		/* internal properties */	

		// paramsToInherit: String
		//		Comma separated parameters to inherit from the parent.
		paramsToInherit: "transition,icon",

		// _selStartMethod: String
		//		Specifies how the item enters the selected state.
		//
		//		- "touch": Use touch events to enter the selected state.
		//		- "none": Do not change the selected state.
		_selStartMethod: "none", // touch or none

		// _selEndMethod: String
		//		Specifies how the item leaves the selected state.
		//
		//		- "touch": Use touch events to leave the selected state.
		//		- "timer": Use setTimeout to leave the selected state.
		//		- "none": Do not change the selected state.
		_selEndMethod: "none", // touch, timer, or none

		// _delayedSelection: Boolean
		//		If true, selection is delayed 100ms and canceled if dragged in
		//		order to avoid selection when flick operation is performed.
		_delayedSelection: false,

		// _duration: Number
		//		Duration of selection, milliseconds.
		_duration: 800,

		// _handleClick: Boolean
		//		If true, this widget listens to touch events.
		_handleClick: true,

		buildRendering: function(){
			this.inherited(arguments);
			this._isOnLine = this.inheritParams();
		},

		startup: function(){
			if(this._started){ return; }
			if(!this._isOnLine){
				this.inheritParams();
			}
			this._updateHandles();
			this.inherited(arguments);
		},

		inheritParams: function(){
			// summary:
			//		Copies from the parent the values of parameters specified 
			//		by the property paramsToInherit.
			var parent = this.getParent();
			if(parent){
				array.forEach(this.paramsToInherit.split(/,/), function(p){
					if(p.match(/icon/i)){
						var base = p + "Base", pos = p + "Pos";
						if(this[p] && parent[base] &&
							parent[base].charAt(parent[base].length - 1) === '/'){
							this[p] = parent[base] + this[p];
						}
						if(!this[p]){ this[p] = parent[base]; }
						if(!this[pos]){ this[pos] = parent[pos]; }
					}
					if(!this[p]){ this[p] = parent[p]; }
				}, this);
			}
			return !!parent;
		},

		_updateHandles: function(){
			// tags:
			//		private
			if(this._handleClick && this._selStartMethod === "touch"){
				if(!this._onTouchStartHandle){
					this._onTouchStartHandle = this.connect(this.domNode, touch.press, "_onTouchStart");
				}
			}else{
				if(this._onTouchStartHandle){
					this.disconnect(this._onTouchStartHandle);
					this._onTouchStartHandle = null;
				}
			}
		},
		
		getTransOpts: function(){
			// summary:
			//		Copies from the parent and returns the values of parameters  
			//		specified by the property paramsToInherit.
			var opts = this.transitionOptions || {};
			array.forEach(["moveTo", "href", "hrefTarget", "url", "target",
				"urlTarget", "scene", "transition", "transitionDir"], function(p){
				opts[p] = opts[p] || this[p];
			}, this);
			return opts; // Object
		},

		userClickAction: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined click action.
		},

		defaultClickAction: function(/*Event*/e){
			// summary:
			//		The default action of this item.
			this.handleSelection(e);
			if(this.userClickAction(e) === false){ return; } // user's click action
			this.makeTransition(e);
		},

		handleSelection: function(/*Event*/e){
			// summary:
			//		Handles this items selection state.

			// Before transitioning, we want the visual effect of selecting the item.
			// To ensure this effect happens even if _delayedSelection is true:
			if(this._delayedSelection){
				this.set("selected", true);
			} // the item will be deselected after transition.

			if(this._onTouchEndHandle){
				this.disconnect(this._onTouchEndHandle);
				this._onTouchEndHandle = null;
			}

			var p = this.getParent();
			if(this.toggle){
				this.set("selected", !this._currentSel);
			}else if(p && p.selectOne){
				this.set("selected", true);
			}else{
				if(this._selEndMethod === "touch"){
					this.set("selected", false);
				}else if(this._selEndMethod === "timer"){
					this.defer(function(){
						this.set("selected", false);
					}, this._duration);
				}
			}
		},

		makeTransition: function(/*Event*/e){
			// summary:
			//		Makes a transition.
			if(this.back && history){
				history.back();	
				return;
			}	
			if (this.href && this.hrefTarget && this.hrefTarget != "_self") {
				win.global.open(this.href, this.hrefTarget || "_blank");
				this._onNewWindowOpened(e);
				return;
			}
			var opts = this.getTransOpts();
			var doTransition = 
				!!(opts.moveTo || opts.href || opts.url || opts.target || opts.scene);
			if(this._prepareForTransition(e, doTransition ? opts : null) === false){ return; }
			if(doTransition){
				this.setTransitionPos(e);
				new TransitionEvent(this.domNode, opts, e).dispatch();
			}
		},

		_onNewWindowOpened: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		Subclasses may want to implement it.
		},

		_prepareForTransition: function(/*Event*/e, /*Object*/transOpts){
			// summary:
			//		Subclasses may want to implement it.
		},

		_onTouchStart: function(e){
			// tags:
			//		private
			if(this.getParent().isEditing || this.onTouchStart(e) === false){ return; } // user's touchStart action
			if(!this._onTouchEndHandle && this._selStartMethod === "touch"){
				// Connect to the entire window. Otherwise, fail to receive
				// events if operation is performed outside this widget.
				// Expose both connect handlers in case the user has interest.
				this._onTouchMoveHandle = this.connect(win.body(), touch.move, "_onTouchMove");
				this._onTouchEndHandle = this.connect(win.body(), touch.release, "_onTouchEnd");
			}
			this.touchStartX = e.touches ? e.touches[0].pageX : e.clientX;
			this.touchStartY = e.touches ? e.touches[0].pageY : e.clientY;
			this._currentSel = this.selected;

			if(this._delayedSelection){
				// so as not to make selection when the user flicks on ScrollableView
				this._selTimer = this.defer(function(){
					this.set("selected", true);
				}, 100);
			}else{
				this.set("selected", true);
			}
		},

		onTouchStart: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined function to handle touchStart events.
			// tags:
			//		callback
		},

		_onTouchMove: function(e){
			// tags:
			//		private
			var x = e.touches ? e.touches[0].pageX : e.clientX;
			var y = e.touches ? e.touches[0].pageY : e.clientY;
			if(Math.abs(x - this.touchStartX) >= 4 ||
			   Math.abs(y - this.touchStartY) >= 4){ // dojox/mobile/scrollable.threshold
				this.cancel();
				var p = this.getParent();
				if(p && p.selectOne){
					this._prevSel && this._prevSel.set("selected", true);
				}else{
					this.set("selected", false);
				}
			}
		},

		_disconnect: function(){
			// tags:
			//		private
			this.disconnect(this._onTouchMoveHandle);
			this.disconnect(this._onTouchEndHandle);
			this._onTouchMoveHandle = this._onTouchEndHandle = null;
		},

		cancel: function(){
			// summary:
			//		Cancels an ongoing selection (if any).
			if(this._selTimer){
				this._selTimer.remove(); 
				this._selTimer = null;
			}
			this._disconnect();
		},

		_onTouchEnd: function(e){
			// tags:
			//		private
			if(!this._selTimer && this._delayedSelection){ return; }
			this.cancel();
			this._onClick(e);
		},

		setTransitionPos: function(e){
			// summary:
			//		Stores the clicked position for later use.
			// description:
			//		Some of the transition animations (e.g. ScaleIn) need the
			//		clicked position.
			var w = this;
			while(true){
				w = w.getParent();
				if(!w || domClass.contains(w.domNode, "mblView")){ break; }
			}
			if(w){
				w.clickedPosX = e.clientX;
				w.clickedPosY = e.clientY;
			}
		},

		transitionTo: function(/*String|Object*/moveTo, /*String*/href, /*String*/url, /*String*/scene){
			// summary:
			//		Performs a view transition.
			// description:
			//		Given a transition destination, this method performs a view
			//		transition. This method is typically called when this item
			//		is clicked.
			var opts = (moveTo && typeof(moveTo) === "object") ? moveTo :
				{moveTo: moveTo, href: href, url: url, scene: scene,
				 transition: this.transition, transitionDir: this.transitionDir};
			new TransitionEvent(this.domNode, opts).dispatch();
		},

		_setIconAttr: function(icon){
			// tags:
			//		private
			if(!this._isOnLine){
				// record the value to be able to reapply it (see the code in the startup method)
				this._pendingIcon = icon;  
				return; 
			} // icon may be invalid because inheritParams is not called yet
			this._set("icon", icon);
			this.iconNode = iconUtils.setIcon(icon, this.iconPos, this.iconNode, this.alt, this.iconParentNode, this.refNode, this.position);
		},

		_setLabelAttr: function(/*String*/text){
			// tags:
			//		private
			this._set("label", text);
			this.labelNode.innerHTML = this._cv ? this._cv(text) : text;
		},

		_setSelectedAttr: function(/*Boolean*/selected){
			// summary:
			//		Makes this widget in the selected or unselected state.
			// description:
			//		Subclass should override.
			// tags:
			//		private
			if(selected){
				var p = this.getParent();
				if(p && p.selectOne){
					// deselect the currently selected item
					var arr = array.filter(p.getChildren(), function(w){
						return w.selected;
					});
					array.forEach(arr, function(c){
						this._prevSel = c;
						c.set("selected", false);
					}, this);
				}
			}
			this._set("selected", selected);
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile._ItemBase", [_ItemBase, BidiItemBase]) : _ItemBase;
});

},
'dojox/mobile/TransitionEvent':function(){
define(["dojo/_base/declare", "dojo/on"], function(declare, on){

	return declare("dojox.mobile.TransitionEvent", null, {
		// summary:
		//		A class used to trigger view transitions.
		
		constructor: function(/*DomNode*/target, /*Object*/transitionOptions, /*Event?*/triggerEvent){
			// summary:
			//		Creates a transition event.
			// target:
			//		The DOM node that initiates the transition (for example a ListItem).
			// transitionOptions:
			//		Contains the transition options.
			// triggerEvent:
			//		The event that triggered the transition (for example a touch event on a ListItem).
			this.transitionOptions = transitionOptions;
			this.target = target;
			this.triggerEvent = triggerEvent||null;
		},

		dispatch: function(){
			// summary:
			//		Dispatches this transition event. Emits a "startTransition" event on the target.
			var opts = {bubbles:true, cancelable:true, detail: this.transitionOptions, triggerEvent: this.triggerEvent};	
			var evt = on.emit(this.target,"startTransition", opts);
		}
	});
});

},
'dojox/mobile/ProgressIndicator':function(){
define([
	"dojo/_base/config",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dojo/has",
	"dijit/_Contained",
	"dijit/_WidgetBase",
	"./_css3"
], function(config, declare, lang, domClass, domConstruct, domGeometry, domStyle, has, Contained, WidgetBase, css3){

	// module:
	//		dojox/mobile/ProgressIndicator

	var cls = declare("dojox.mobile.ProgressIndicator", [WidgetBase, Contained], {
		// summary:
		//		A progress indication widget.
		// description:
		//		ProgressIndicator is a round spinning graphical representation
		//		that indicates the current task is ongoing.

		// interval: Number
		//		The time interval in milliseconds for updating the spinning
		//		indicator.
		interval: 100,

		// size: [const] Number
		//		The size of the indicator in pixels.
		//		Note that changing the value of the property after the widget
		//		creation has no effect.
		size: 40,

		// removeOnStop: Boolean
		//		If true, this widget is removed from the parent node
		//		when stop() is called.
		removeOnStop: true,

		// startSpinning: Boolean
		//		If true, calls start() to run the indicator at startup.
		startSpinning: false,

		// center: Boolean
		//		If true, the indicator is displayed as center aligned.
		center: true,

		// colors: String[]
		//		An array of indicator colors. 12 colors have to be given.
		//		If colors are not specified, CSS styles
		//		(mblProg0Color - mblProg11Color) are used.
		colors: null,

		/* internal properties */
		
		// baseClass: String
		//		The name of the CSS class of this widget.	
		baseClass: "mblProgressIndicator",

		constructor: function(){
			// summary:
			//		Creates a new instance of the class.
			this.colors = [];
			this._bars = [];
		},

		buildRendering: function(){
			this.inherited(arguments);
			if(this.center){
				domClass.add(this.domNode, "mblProgressIndicatorCenter");
			}
			this.containerNode = domConstruct.create("div", {className:"mblProgContainer"}, this.domNode);
			this.spinnerNode = domConstruct.create("div", null, this.containerNode);
			for(var i = 0; i < 12; i++){
				var div = domConstruct.create("div", {className:"mblProg mblProg"+i}, this.spinnerNode);
				this._bars.push(div);
			}
			this.scale(this.size);
			if(this.startSpinning){
				this.start();
			}
		},

		scale: function(/*Number*/size){
			// summary:
			//		Changes the size of the indicator.
			// size:
			//		The size of the indicator in pixels.
			var scale = size / 40;
			domStyle.set(this.containerNode, css3.add({}, {
				transform: "scale(" + scale + ")",
				transformOrigin: "0 0"
			}));
			domGeometry.setMarginBox(this.domNode, {w:size, h:size});
			domGeometry.setMarginBox(this.containerNode, {w:size / scale, h:size / scale});
		},

		start: function(){
			// summary:
			//		Starts the spinning of the ProgressIndicator.
			if(this.imageNode){
				var img = this.imageNode;
				var l = Math.round((this.containerNode.offsetWidth - img.offsetWidth) / 2);
				var t = Math.round((this.containerNode.offsetHeight - img.offsetHeight) / 2);
				img.style.margin = t+"px "+l+"px";
				return;
			}
			var cntr = 0;
			var _this = this;
			var n = 12;
			this.timer = setInterval(function(){
				cntr--;
				cntr = cntr < 0 ? n - 1 : cntr;
				var c = _this.colors;
				for(var i = 0; i < n; i++){
					var idx = (cntr + i) % n;
					if(c[idx]){
						_this._bars[i].style.backgroundColor = c[idx];
					}else{
						domClass.replace(_this._bars[i],
										 "mblProg" + idx + "Color",
										 "mblProg" + (idx === n - 1 ? 0 : idx + 1) + "Color");
					}
				}
			}, this.interval);
		},

		stop: function(){
			// summary:
			//		Stops the spinning of the ProgressIndicator.
			if(this.timer){
				clearInterval(this.timer);
			}
			this.timer = null;
			if(this.removeOnStop && this.domNode && this.domNode.parentNode){
				this.domNode.parentNode.removeChild(this.domNode);
			}
		},

		setImage: function(/*String*/file){
			// summary:
			//		Sets an indicator icon image file (typically animated GIF).
			//		If null is specified, restores the default spinner.
			if(file){
				this.imageNode = domConstruct.create("img", {src:file}, this.containerNode);
				this.spinnerNode.style.display = "none";
			}else{
				if(this.imageNode){
					this.containerNode.removeChild(this.imageNode);
					this.imageNode = null;
				}
				this.spinnerNode.style.display = "";
			}
		},

		destroy: function(){
			this.inherited(arguments);
			if(this === cls._instance){
				cls._instance = null;
			}
		}
	});

	cls._instance = null;
	cls.getInstance = function(props){
		if(!cls._instance){
			cls._instance = new cls(props);
		}
		return cls._instance;
	};

	return cls;
});

},
'dojox/mobile/_css3':function(){
define([
	"dojo/_base/window",
	"dojo/_base/array",
	"dojo/has"
], function(win, arr, has){

	// caches for capitalized names and hypen names
	var cnames = [], hnames = [];

	// element style used for feature testing
	var style = win.doc.createElement("div").style;

	// We just test webkit prefix for now since our themes only have standard and webkit
	// (see dojox/mobile/themes/common/css3.less)
	// More prefixes can be added if/when we add them to css3.less.
	var prefixes = ["webkit"];

	// Does the browser support CSS3 animations?
	has.add("css3-animations", function(global, document, element){
		var style = element.style;
		return (style["animation"] !== undefined && style["transition"] !== undefined) ||
			arr.some(prefixes, function(p){
				return style[p+"Animation"] !== undefined && style[p+"Transition"] !== undefined;
			});
	});

	// Indicates whether style 'transition' returns empty string instead of
	// undefined, although TransitionEvent is not supported.
	// Reported on Android 4.1.x on some devices: https://bugs.dojotoolkit.org/ticket/17164
	has.add("t17164", function(global, document, element){
		return (element.style["transition"] !== undefined) && !('TransitionEvent' in window);
	});

	var css3 = {
		// summary:
		//		This module provide some cross-browser support for CSS3 properties.

		name: function(/*String*/p, /*Boolean?*/hyphen){
			// summary:
			//		Returns the name of a CSS3 property with the correct prefix depending on the browser.
			// p:
			//		The (non-prefixed) property name. The property name is assumed to be consistent with
			//		the hyphen argument, for example "transition-property" if hyphen is true, or "transitionProperty"
			//		if hyphen is false. If the browser supports the non-prefixed property, the property name will be
			//		returned unchanged.
			// hyphen:
			//		Optional, true if hyphen notation should be used (for example "transition-property" or "-webkit-transition-property"),
			//		false for camel-case notation (for example "transitionProperty" or "webkitTransitionProperty").

			var n = (hyphen?hnames:cnames)[p];
			if(!n){

				if(/End|Start/.test(p)){
					// event names: no good way to feature-detect, so we
					// assume they have the same prefix as the corresponding style property
					var idx = p.length - (p.match(/End/) ? 3 : 5);
					var s = p.substr(0, idx);
					var pp = this.name(s);
					if(pp == s){
						// no prefix, standard event names are all lowercase
						n = p.toLowerCase();
					}else{
						// prefix, e.g. webkitTransitionEnd (camel case)
						n = pp + p.substr(idx);
					}
				}else if(p == "keyframes"){
					// special case for keyframes, we also rely on consistency between 'animation' and 'keyframes'
					var pk = this.name("animation", hyphen);
					if(pk == "animation"){
						n = p;
					}else if(hyphen){
						n = pk.replace(/animation/, "keyframes");
					}else{
						n = pk.replace(/Animation/, "Keyframes");
					}
				}else{
					// convert name to camel-case for feature test
					var cn = hyphen ? p.replace(/-(.)/g, function(match, p1){
    					return p1.toUpperCase();
					}) : p;
					if(style[cn] !== undefined && !has('t17164')){
						// standard non-prefixed property is supported
						n = p;
					}else{
						// try prefixed versions
						cn = cn.charAt(0).toUpperCase() + cn.slice(1);
						arr.some(prefixes, function(prefix){
							if(style[prefix+cn] !== undefined){
								if(hyphen){
									n = "-" + prefix + "-" + p;
								}else{
									n = prefix + cn;
								}
							}
						});
					}
				}

				if(!n){
					// The property is not supported, just return it unchanged, it will be ignored.
					n = p;
				}

				(hyphen?hnames:cnames)[p] = n;
			}
			return n;
		},

		add: function(/*Object*/styles, /*Object*/css3Styles){
			// summary:
			//		Prefixes all property names in "css3Styles" and adds the prefixed properties in "styles".
			//		Used as a convenience when an object is passed to domStyle.set to set multiple styles.
			// example:
			//		domStyle.set(bar, css3.add({
			//			opacity: 0.6,
			//			position: "absolute",
			//			backgroundColor: "#606060"
			//		}, {
			//			borderRadius: "2px",
			//			transformOrigin: "0 0"
			//		}));
			// returns:
			//		The "styles" argument where the CSS3 styles have been added.

			for(var p in css3Styles){
				if(css3Styles.hasOwnProperty(p)){
					styles[css3.name(p)] = css3Styles[p];
				}
			}
			return styles;
		}
	};

	return css3;
});

},
'dojox/mobile/PageIndicator':function(){
define([
	"dojo/_base/connect",
	"dojo/_base/declare",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dijit/registry",
	"dijit/_Contained",
	"dijit/_WidgetBase"
], function(connect, declare, dom, domClass, domConstruct, registry, Contained, WidgetBase){

	// module:
	//		dojox/mobile/PageIndicator

	return declare("dojox.mobile.PageIndicator", [WidgetBase, Contained],{
		// summary:
		//		A current page indicator.
		// description:
		//		PageIndicator displays a series of gray and white dots to
		//		indicate which page is currently being viewed. It can typically
		//		be used with dojox/mobile/SwapView. It is also internally used
		//		in dojox/mobile/Carousel.

		// refId: String
		//		An ID of a DOM node to be searched. Siblings of the reference
		//		node will be searched for views. If not specified, this.domNode
		//		will be the reference node.
		refId: "",

		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblPageIndicator",

		buildRendering: function(){
			this.inherited(arguments);
			this._tblNode = domConstruct.create("table", {className:"mblPageIndicatorContainer"}, this.domNode);
			this._tblNode.insertRow(-1);
			this.connect(this.domNode, "onclick", "_onClick");
			this.subscribe("/dojox/mobile/viewChanged", function(view){
				this.reset();
			});
		},

		startup: function(){
			var _this = this;
			_this.defer(function(){ // to wait until views' visibility is determined
				_this.reset();
			});
		},

		reset: function(){
			// summary:
			//		Updates the indicator.
			var r = this._tblNode.rows[0];
			var i, c, a = [], dot;
			var refNode = (this.refId && dom.byId(this.refId)) || this.domNode;
			var children = refNode.parentNode.childNodes;
			for(i = 0; i < children.length; i++){
				c = children[i];
				if(this.isView(c)){
					a.push(c);
				}
			}
			if(r.cells.length !== a.length){
				domConstruct.empty(r);
				for(i = 0; i < a.length; i++){
					c = a[i];
					dot = domConstruct.create("div", {className:"mblPageIndicatorDot"});
					r.insertCell(-1).appendChild(dot);
				}
			}
			if(a.length === 0){ return; }
			var currentView = registry.byNode(a[0]).getShowingView();
			for(i = 0; i < r.cells.length; i++){
				dot = r.cells[i].firstChild;
				if(a[i] === currentView.domNode){
					domClass.add(dot, "mblPageIndicatorDotSelected");
				}else{
					domClass.remove(dot, "mblPageIndicatorDotSelected");
				}
			}
		},

		isView: function(node){
			// summary:
			//		Returns true if the given node is a view.
			return (node && node.nodeType === 1 && domClass.contains(node, "mblView")); // Boolean
		},

		_onClick: function(e){
			// summary:
			//		Internal handler for click events.
			// tags:
			//		private
			if(this.onClick(e) === false){ return; } // user's click action
			if(e.target !== this.domNode){ return; }
			if(e.layerX < this._tblNode.offsetLeft){
				connect.publish("/dojox/mobile/prevPage", [this]);
			}else if(e.layerX > this._tblNode.offsetLeft + this._tblNode.offsetWidth){
				connect.publish("/dojox/mobile/nextPage", [this]);
			}
		},

		onClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined function to handle clicks.
			// tags:
			//		callback
		}
	});
});

},
'demos/mobileGallery/src/base':function(){
define(["dojo/_base/array",
	"dojo/_base/window",
	"dojo/has"], 
function(array, win, has){
	
	function set(name, value) {
		has(name, function(){
			return value;
		}, true, true);
	}
	
	/*
	 * parse url parameter to get the device parameter if any. Temporarily use hard
	 * coded values. We can change to use dojo.hash in the future.
	 */
	var search = win.global.location.search;
	if (search && search.length > 1) {
		var queryPairs = search.substr(1).split("&");
		array.forEach(queryPairs, function(pairStr) {
			var query = pairStr.split("=");
			if (query[0] === "theme" && query[1]) {
				// overwrite the agent detection result
				switch (query[1].toLowerCase()) {
				case "iphone":
					set("iphone", true);
					set("android", false);
					set("webos", false);
					break;
				case "android":
					set("iphone", false);
					set("android", true);
					set("webos", false);
					break;
				case "webos":
					set("iphone", false);
					set("android", false);
					set("webos", true);
					break;
				};
			};
		});
	}
});

},
'demos/mobileGallery/src/Viewport':function(){
define(["dojo/_base/lang", 
        "dojo/dom-construct","dojo/dom-prop", 
        "dojox/mobile/sniff"], function(lang, domConstruct, domProp, has){
	lang.getObject("demos.mobileGallery.src.Viewport", true);
	
	var meta = null;// <meta> tag for viewport
	
	// Viewport module. Provide utility to manipulate viewport.
	demos.mobileGallery.src.Viewport = {
		onViewportChange : function() {
			var head = document.getElementsByTagName("head")[0];
			if (!meta) {
				meta = domConstruct.create('meta');
				domProp.set(meta, "name", "viewport");
				head.appendChild(meta);
			}
			var isPortrait = (window.orientation == 0);
			// TODO: decide best dimension for full/non-full screen, 
			// also for different kinds of platforms.

			if (has("ios")) {
				if (isPortrait) {
					var iphone5 = window.screen.height == 568;
					if(iphone5){
						domProp.set(meta,"content",
							"width=device-width,height=504,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no");
					}else{
						domProp.set(meta,"content",
							"width=device-width,height=416,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no");
					}
				} else {
					domProp.set(meta,"content",
					"width=device-width,height=268,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no");
				};
			}
		}
	};
	return demos.mobileGallery.src.Viewport;
});

},
'demos/mobileGallery/src/structure':function(){
define(["dojo/_base/lang"],
		function(lang){
	lang.getObject("demos.mobileGallery.src.structure", true);
	
	var THRESHOLD_WIDTH = 600;

	demos.mobileGallery.src.structure = {
		layout: {
			threshold: THRESHOLD_WIDTH, // threshold for layout change
			leftPane: {
				hidden: (window.innerWidth < THRESHOLD_WIDTH) ? true : false,
						currentView: null
			},
			rightPane: {
				hidden: false,
				currentView: null
			},
			getViewHolder: function(id) {
				if (id === "navigation")
					return (window.innerWidth < THRESHOLD_WIDTH) ? "rightPane" : "leftPane";
				else
					return "rightPane";
			},
			setCurrentView: function(id) {
				var holder = this.getViewHolder(id);
				this[holder].currentView = id;
			},
			// last selected demo view
			currentDemo: {
				id: "welcome",
				title: "Welcome"
			}
		},
		demos: [{
			id: "controls",
			label: "Controls",
			iconBase: "images/navigation_list_all_29.png",
			views: [{
				id: "buttons",
				iconPos: "0,0,29,29",
				title: "Buttons",
				demourl: "views/buttons.html"
			}, {
				id: "forms",
				iconPos: "29,0,29,29",
				title: "Forms",
				demourl: "views/forms.html",
				jsmodule: "demos/mobileGallery/src/forms",
				jsSrc: "doc/src/forms.js.txt"
			}, {
				id: "mobileSwitches",
				iconPos: "29,0,29,29",
				title: "Switches",
				demourl: "views/mobileSwitches.html"
			}, {
				id: "swapView",
				iconPos: "58,0,29,29",
				title: "Swap View",
				demourl: "views/swapView.html"
			}, {
				id: "icons",
				iconPos: "87,0,29,29",
				title: "Icons",
				demourl: "views/icons.html",
				jsmodule: "demos/mobileGallery/src/icons",
				jsSrc: "doc/src/icons.js.txt"
			}, {
				id: "tabBar",
				iconPos: "116,0,29,29",
				title: "Tab Bar",
				demourl: "views/tabBar.html"
			}, {
				id: "headings",
				iconPos: "145,0,29,29",
				title: "Headings",
				demourl: "views/headings.html",
				jsmodule: "demos/mobileGallery/src/headings",
				jsSrc: "doc/src/headings.js.txt"
			}, {
				id: "list",
				iconPos: "203,0,29,29",
				title: "Lists",
				demourl: "views/list.html",
				jsmodule: "demos/mobileGallery/src/list",
				jsSrc: "doc/src/list.js.txt"
			}, {
				id: "mobileLists",
				iconPos: "203,0,29,29",
				title: "List Data",
				demourl: "views/mobileListData.html",
				jsmodule: "demos/mobileGallery/src/mobileListData",
				jsSrc: "doc/src/mobileListData.js.txt"
			}, {
				id: "filteredLists",
				iconPos: "203,0,29,29",
				title: "Filtered Lists",
				demourl: "views/filteredLists.html",
				jsmodule: "demos/mobileGallery/src/filteredLists",
				jsSrc: "doc/src/filteredLists.js.txt"
			}, {
				id: "longLists",
				iconPos: "203,0,29,29",
				title: "Long Lists",
				demourl: "views/longLists.html",
				jsmodule: "demos/mobileGallery/src/longLists",
				jsSrc: "doc/src/longLists.js.txt"
			}, {
				id: "accordion",
				iconPos: "464,0,29,29",
				title: "Accordion",
				demourl: "views/accordion.html",
				jsmodule: "demos/mobileGallery/src/accordion",
				jsSrc: "doc/src/accordion.js.txt"
			}, {		
				id: "gridLayout",
				iconPos: "580,0,29,29",
				title: "GridLayout",
				demourl: "views/gridLayout.html",
				jsmodule: "demos/mobileGallery/src/gridLayout",
				jsSrc: "doc/src/gridLayout.js.txt"
			}, {
				id: "scrollablePane",
				iconPos: "551,0,29,29",
				title: "Scroll Pane",
				demourl: "views/scrollablePane.html",
				jsmodule: "demos/mobileGallery/src/scrollablePane",
				jsSrc: "doc/src/scrollablePane.js.txt"
			}, {				
				id: "progress",
				iconPos: "493,0,29,29",
				title: "Progress",
				demourl: "views/progress.html",
				jsmodule: "demos/mobileGallery/src/progress",
				jsSrc: "doc/src/progress.js.txt"
			}, {					
				id: "media",
				iconPos: "435,0,29,29",
				title: "Media",
				demourl: "views/mobileMedia.html",
				jsmodule: "demos/mobileGallery/src/media"
			}, {
				id: "badges",
				iconPos: "522,0,29,29",
				title: "Badges",
				demourl: "views/badges.html",
				jsmodule: "demos/mobileGallery/src/badges",
				jsSrc: "doc/src/badges.js.txt"				
			}, {
				id: "rating",
				iconPos: "609,0,29,29",
				title: "Rating",
				demourl: "views/rating.html",
				jsmodule: "demos/mobileGallery/src/rating",
				jsSrc: "doc/src/rating.js.txt"
			}, {
				id: "dialogs",
				iconPos: "638,0,29,29",
				title: "Dialogs",
				demourl: "views/dialogs.html",
				jsmodule: "demos/mobileGallery/src/dialogs",
				jsSrc: "doc/src/dialogs.js.txt"
			}, {
				id: "valuePicker",
				iconPos: "667,0,29,29",
				title: "Pickers",
				demourl: "views/valuePicker.html",
				jsmodule: "demos/mobileGallery/src/valuePicker",
				jsSrc: "doc/src/valuePicker.js.txt"
			}, {				
				id: "map",
				iconPos: "174,0,29,29",
				title: "Map (Google)",
				demourl: "views/map.html",
				jsmodule: "demos/mobileGallery/src/map",
				jsSrc: "doc/src/map.js.txt"
			}, {			
				href: "../mobileGauges/demo.html",
				hrefTarget: "_blank",
				title: "Gauge",
				iconPos: "232,0,29,29"
			}, {
				href: "../mobileCharting/demo.html",
				hrefTarget: "_blank",
				title: "Chart",
				iconPos: "377,0,29,29"
			}, {
				href: "../mobileGeoCharting/demo.html",
				hrefTarget: "_blank",
				title: "Geo Chart",
				iconPos: "377,0,29,29"
			}, {
				href: "../mobileOpenLayers/demo.html",
				hrefTarget: "_blank",
				title: "OpenLayers Map",
				iconPos: "174,0,29,29"
			}, {
				href: "../touch/demo.html",
				hrefTarget: "_blank",
				title: "Touch",
				iconPos: "261,0,29,29"
			}]
		}, {
			id: "effects",
			label: "Effects",
			iconBase: "images/navigation_list_all_29.png",
			views: [{
				id: "mobileTransitions",
				iconPos: "290,0,29,29",
				title: "Transitions",
				demourl: "views/mobileTransitions.html"
			},{
				id: "css3",
				iconPos: "406,0,29,29",
				title: "CSS 3",
				demourl: "views/css3.html",
				jsmodule: "demos/mobileGallery/src/css3",
				jsSrc: "doc/src/css3.js.txt"
			}]
		}, {
			id: "dataList",
			label: "Data",
			iconBase: "images/navigation_list_all_29.png",
			views: [{
				id: "jsonp",
				iconPos: "319,0,29,29",
				title: "JSON P",
				demourl: "views/jsonp.html",
				jsmodule: "demos/mobileGallery/src/jsonp",
				jsSrc: "doc/src/jsonp.js.txt"
			}, {
				id: "ajax",
				iconPos: "348,0,29,29",
				title: "AJAX",
				demourl: "views/ajax.html",
				jsmodule: "demos/mobileGallery/src/ajax",
				jsSrc: "doc/src/ajax.js.txt"
			}, {
				id: "html5",
				iconPos: "348,0,29,29",
				title: "HTML5",
				demourl: "views/html5.html",
				jsmodule: "demos/mobileGallery/src/html5",
				jsSrc: "doc/src/html5.js.txt"
			}]
		}],
		/* Below are internal views. */
		_views: [{
			id: 'source',
			title: 'Source',
			type: 'source'
		}, {
			id: 'welcome',
			title: 'Welcome'
		}, {
			id: 'navigation',
			title: 'Showcase',
			type: 'navigation',
			back: ''
		}],
		/* data model for tracking view loading */
		load: {
			loaded: 0,
			target: 0 //target number of views that should be loaded
		},
		// navigation list
		navRecords: []
	};
	return demos.mobileGallery.src.structure;
});

}}});
define("demos/mobileGallery/src", ["dojo/_base/lang","dojo/_base/html","dojo/_base/connect","dojo/_base/array","dojo/_base/window","dojo/_base/xhr", // dojo Base
		"dojo/dom", "dojo/dom-class","dojo/dom-prop","dojo/dom-construct",
		"dojo/_base/Deferred",
		"dojo/DeferredList",
		"dojo/data/ItemFileReadStore",
		"dijit/registry", 
		"dojox/highlight",
		"dojox/highlight/languages/javascript",
		"dojox/mobile/compat",
		"dojox/mobile/parser",
		"dojox/mobile/common",
		"dojox/mobile/EdgeToEdgeCategory",
		"dojox/mobile/EdgeToEdgeDataList",
		"dojox/mobile/ListItem",
		"dojox/mobile/PageIndicator",
		"dojox/mobile/ProgressIndicator",
		"dojox/mobile/TransitionEvent",
		"demos/mobileGallery/src/base",
		"demos/mobileGallery/src/Viewport",
		"demos/mobileGallery/src/structure"],
  function(lang, html, connect, array, win, xhr, dom, domClass,domProp, domConstruct,
			Deferred, DeferredList, ItemFileReadStore, registry, highlight, jshighlight, compat, parser, dm,
			EdgeToEdgeCategory, EdgeToEdgeDataList, ListItem, PageIndicator, ProgressIndicator, TransitionEvent, 
			base, Viewport, structure){ 

	/*
	 * show or hide global progress indicator
	 */
	function showProgressIndicator(show){
		var prog = ProgressIndicator.getInstance();
		prog.id = "mobGalleryProgressIndicator";
		// TODO: remove this workaround
		prog.stop();
		if (show) {
			dom.byId("rightPane").appendChild(prog.domNode);
			prog.start();
		}
	}
	
	// flag indicating whether there's transition
	var inTransitionOrLoading = false;

	// flag indicating whether the transition starts
	// TODO: ideally this should not be a global flag
	// We should get rid of it if transition event
	// can provide more context
	var transitFrom;
	
	function transitViews(src, target, move, anim) {
		if (src === target)
			return;
		transitFrom = src;
		var moveDir = (move ? move : -1);
		var animation = (anim ? anim : "slide");
		registry.byId(src).performTransition(target, moveDir, animation);
	}


	function navBtnClickHandler() {
		var navRecord = structure.navRecords.pop();
		if (!navRecord){ // #16565: happens when double-clicking/touching the back button.
			return;
		}
		// only hide navigation button DIRECTLY if in two column mode
		// otherwise, "onAfterTransitionIn" of "navigation" view will hide it
		// TODO: simplify the logic here
		if (structure.navRecords.length == 0 && !structure.layout.leftPane.hidden)
			showHideNavButton();
		transitViews(navRecord.to, navRecord.from);
		if (navRecord.fromTitle)
			dom.byId("headerLabel").innerHTML = navRecord.fromTitle;
	}

	function srcBtnClickHandler() {
		var srcBtn = registry.byId("sourceButton");
		dom.byId("sourceButton").innerHTML = (srcBtn.selected ? "Demo" : "Source");
		if (srcBtn.selected) {
			structure.navRecords.push({
				from: srcBtn.backTo,
				to: "source",
				navTitle: "Back"
			});
			transitViews(srcBtn.backTo, "source", 1, navigator.userAgent.match(/GT-I9100/) ? "none" : null);
		} else {
			navBtnClickHandler();
		}

	}

	// update label of navigation button
	function updateNavButtonLabel() {
		var navRecords = structure.navRecords;
		
		if (navRecords.length > 0) {
			var record = navRecords[navRecords.length - 1];
			registry.byId("navButton").set("label", record.navTitle);
			registry.byId("header").moveTo = record.from;
		}
	}

	// show or hide navigation button
	// TODO: simplify the logic here or at the caller
	function showHideNavButton() {
		var navButton = dom.byId("navButton");
		var navRecords = structure.navRecords;
		// hide if no record or we have only 1 record in "two column" mode
		// and it is "source"
		if (navRecords.length == 0 ||
		  	(navRecords.length == 1 && !structure.layout.leftPane.hidden &&
			 navRecords[navRecords.length-1].to == "source")) {
			if (!domClass.contains(navButton, "hidden")) {
				domClass.add(navButton, "hidden");
			}
		} else {
			if (domClass.contains(navButton, "hidden")) {
				domClass.remove(navButton, "hidden");
			}
		}
	}

	function updateNavButton() {
		updateNavButtonLabel();
		showHideNavButton();
	}

	function clearNavRecords() {
		var navRecords = structure.navRecords;
		if (navRecords.length == 0)
			return;
		navRecords.splice(0, navRecords.length);
	}
	
	
	/* 
	 * Work-around for the current change to transition.
	 * TODO: Change to use a utility method or some thing similar.
	 */
	function triggerTransition(comp, moveTo){
		transitFrom = "navigation";
		var transOpts = {"moveTo": moveTo, transition: comp.transition, transitionDir: comp.transitionDir};
		return new TransitionEvent(comp.domNode,transOpts).dispatch();
	}
	
	/**
	 * Add syntax highlight to passed-in HTML code.
	 *  
	 * @param raw HTML code to apply syntax highlight.
	 * @returns a string which is an HTML code snippet containing
	 * syntax highlight.
	 */
	function syntaxHighLight(raw) {
		var data = raw;
		//highlight element name, attribute name and value in HTML
		var regex = /<([\/a-zA-Z0-9]+)(\s*)([^>]*)>/g;
		regex.compile(regex);
		var match;
		while (match = regex.exec(data)) {
			var idx = match.index;
			var length = match[0].length;
			var replacement;
			replacement = "<span style=\"color:#0A0096\">&lt;" + match[1] + "</span>" + match[2];
			var regex2 = /(\w+)(\s*)=(\s*)('|")(.*?)\4(\s*)/g;
			var attrs = match[3];
			if (attrs && attrs !== '') {
				var match2;
				while (match2 = regex2.exec(attrs)) {
					replacement += "<span style=\"color:#F6834A\">" + match2[1] + "</span>" + match2[2] + "=" + match2[3];
					replacement += "<span style=\"color:#9B3000\">" + match2[4] + match2[5] + match2[4] + "</span>" + match2[6];
				}
			}
			replacement += "<span style=\"color:#0A0096\">&gt;</span>";
			data = data.slice(0, idx) + replacement + data.slice(idx + length);
			regex.lastIndex = idx + replacement.length;
		}
		return data;
	}
	
	// a map containing html and javascript source
	// codes, indexed by demo view ID. Each entry is
	// an object with "html" and "js" properties.
	var DEMO_SOURCES = {};
	function fillInDemoSource(id, type, src) {
		if (!DEMO_SOURCES[id])
			DEMO_SOURCES[id] = {};
		if (!DEMO_SOURCES[id][type])
			DEMO_SOURCES[id][type] = src;
	}
	function getDemoHtml(id) {
		return (DEMO_SOURCES[id] && DEMO_SOURCES[id].html ? DEMO_SOURCES[id].html : "");
	}
	function getDemoJs(id) {
		return (DEMO_SOURCES[id] && DEMO_SOURCES[id].js ? DEMO_SOURCES[id].js : "There is no user-defined Javascript needed.");
	}
	/**
	 * initialize each view page
	 *
	 * @param args
	 *            three parameters: id: id of the view; header:
	 *            label of the view header; src: URL of the view source
	 */
	function initView(args){
		var view = registry.byId(args.id);
		var viewType = (args.type) ? args.type : 'demo';
		
		connect.connect(view, "onAfterTransitionIn", view, function(){
			inTransitionOrLoading = false;
			var headerLabel = dom.byId('headerLabel');
			var header = dom.byId("header");
			var sourceButton = dom.byId("sourceButton");
			if (viewType === 'demo') {
				// after transition in, set the header, source button and load
				// the source code of current view.						
				// but exclude when you transit back from "source"
				// otherwise local nav history will be broken
				if (!transitFrom || (transitFrom != "source")) {
					headerLabel.innerHTML = args.title;
					// this is more a timing change, update nav button after transit in
					// so that it can be shown/hidden along with "Source" button
					if (structure.layout.leftPane.hidden) {
						structure.navRecords.push({
							from:"navigation",
							to: args.id,
							toTitle: args.title,
							navTitle:"Back"
						});
					} else {
						clearNavRecords();
					}
					connect.publish("onAfterDemoViewTransitionIn", [args.id]);
				}
				var srcBtn = registry.byId("sourceButton");
				srcBtn.backTo = args.id;
				srcBtn.set("selected", false);
				sourceButton.innerHTML = (srcBtn.selected ? "Demo" : "Source");
				
				// set the header's moveTo attribute to "navigation"
				registry.byNode(header).moveTo = "navigation";
				// restore sourceButton if applicable
				if (domClass.contains(sourceButton, "hidden")) {
					domClass.remove(sourceButton, "hidden");
				}
				
				dom.byId("htmlContent").innerHTML = getDemoHtml(args.id);
				dom.byId("jsContent").innerHTML = getDemoJs(args.id);
				registry.byId("htmlSrcView").scrollTo({x:0,y:0});
				registry.byId("jsSrcView").scrollTo({x:0,y:0});
				structure.layout.currentDemo = {
					id: args.id,
					title: args.title
				};
			}
			else if (viewType === 'navigation') {
				//hide the sourceButton when navigation views 
				//and demo views are in the same holder.
				if (structure.layout.leftPane.hidden) {
					// set header label and the moveTo attribute of header to args.back
					headerLabel.innerHTML = args.title;
					registry.byNode(header).moveTo = args.back;
					// hide or show navigation button, hide sourceButton
					if (!domClass.contains(sourceButton, "hidden")) {
						domClass.add(sourceButton, "hidden");
					}
					// co-operate with "srcBtnClickHandler()" above
					showHideNavButton();
				}
				else {
					// if leftPane is not hidden then we need to set the back attribute of the leftPane header
					var leftHeader = dom.byId("leftHeader");
					var leftHeaderLabel = dom.byId("leftHeaderLabel");
					registry.byNode(leftHeader).moveTo = args.back;
					// set the header label
					leftHeaderLabel.innerHTML = args.title;
				}
				
			}
			structure.layout.setCurrentView(this.id);
		});
	}
	
	/**
	 * Callback handler of loading view.
	 * @param data
	 */
	function createViewHTMLLoadedHandler(args, li){
		return function(htmlText){
			fillInDemoSource(args.id, "html", syntaxHighLight(htmlText));
			var rightPane = dom.byId("rightPane");
			var tmpContainer = domConstruct.create("DIV");
			tmpContainer.innerHTML = htmlText;
			rightPane.appendChild(tmpContainer);
			var ws = parser.parse(tmpContainer);
			array.forEach(ws, function(w){
				if(w && !w._started && w.startup){
					w.startup();
				}
			});
			// reparent
			rightPane.removeChild(tmpContainer);
			for (var i = 0; i < tmpContainer.childNodes.length; i ++) {
				rightPane.appendChild(tmpContainer.childNodes[i]);
			}
		};
	}
	
	/**
	 * Load contents of a view to SplitterPane and switch to it.
	 * @param args
	 * 			args should have args.demourl and args.holder
	 * 			demourl: the url where loader can get the source of view
	 * 			holder: the id of pane that will hold the view
	 */
	
	function loadAndSwitchView(args, li) {
		showProgressIndicator(true);
		
		function handleError(err){
			alert("Failed to load demo.");
			showProgressIndicator(false);
			inTransitionOrLoading = false;
		}

		function initViewAndTransit() {
			showProgressIndicator(false);
			// TODO: FIX-ME temp work around for the async startup 
			setTimeout(function(){
				initView(args);
//					li.transitionTo(args.id);
				triggerTransition(li, args.id);
			},0);
		}

		function stopProgress(){
		}
		
		var xhrArgs = {
				url: args.demourl,
				timeout: 30000,
				handleAs: "text" //only text can work now, xml will result in null responseXML
		};
		if (args.jsmodule) {
			require([args.jsmodule], function(module){
				var deferArray = [];
				// 1. load template HTML
				var htmlDefer = new Deferred();
				xhr.get({
					url: args.demourl,
				    timeout: 30000,
				    handleAs: "text",
				    load: function(data) {
					createViewHTMLLoadedHandler(args, li)(data);
					if (module.init)
						module.init();
					htmlDefer.resolve(true);
				    },
				    error: function(err) {
					htmlDefer.reject(true);
				    }
				});
				deferArray.push(htmlDefer);
				
				// 2. load JS codes
				if (args.jsSrc) {
					var jsDefer = new Deferred();
					xhr.get({
						url: args.jsSrc,
						timeout: 30000,
						handleAs: "text",
						load: function(data) {
							var src = highlight.processString(data).result;
							//src = src.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
							jsDefer.resolve(src);
						},
						error: function(err) {
							jsDefer.reject(true);
						}
					});
					deferArray.push(jsDefer);
				}

				// put them all in deferred list
				var deferList = new DeferredList(deferArray);
				deferList.then(function(res){
					if (!res[0][0]){
						handleError();
						return;
					}
					// load JS codes
					if (res.length > 1 && res[1][0] && res[1][1]) {
						fillInDemoSource(args.id, "js", res[1][1]);
					}
					initViewAndTransit();
				});
			});
		} else {
			var deferred = xhr.get(xhrArgs);
			deferred.addCallback(createViewHTMLLoadedHandler(args, li)).addCallback(initViewAndTransit);
			deferred.addErrback(handleError);
		}
	}
	
	/**
	 * Show the view of each show case. Load it first, if it's not loaded.
	 * @param args
	 * @param li
	 */
	function showView(args, li){
		if (inTransitionOrLoading)
			return;
		showProgressIndicator(false);
		if (registry.byId(args.id)) {
//				li.transitionTo(args.id);
			if (structure.layout.rightPane.currentView !== args.id) {
				inTransitionOrLoading = true;
				triggerTransition(li, args.id);
			}
		} else {
			inTransitionOrLoading = true;
			loadAndSwitchView(args, li);
		}
	}
	
	/**
	 * Initialize the navigation list items.
	 *
	 * @param {Object} demos
	 */
	function initNavList(demos){
		var navView = registry.byId("navigation");
		array.forEach(demos, function(demo){
			// first, set the category label
			var cat = new EdgeToEdgeCategory({
				"label": demo.label
			});
			cat.placeAt(navView.containerNode);
			cat.startup();
			// then, add the list
			var items = [];
			array.forEach(demo.views, function(item){
				// mapping "id" to "moveTo" for EdgeToEdgeList
				var def = {
						iconPos: item.iconPos,
						label: item.title,
						href: item.href,
						hrefTarget: item.hrefTarget
				};
				if (item.demourl){
					def.moveTo = "#";
					def.onClick = function(){
						ListItem.prototype.onClick.apply(this, arguments);
						showView(item, this);
					};
				}
				items.push(def);
			});
			var list = new EdgeToEdgeDataList({
				id: demo.id,
				iconBase: demo.iconBase, // TODO: precise clone?
				store: new ItemFileReadStore({
					data: {
						"items": items
					}
				})
			});
			list.placeAt(navView.containerNode);
			list.startup();
			
		});
		// move navigation list view under correct parent (right or left pane)
		var holder = dom.byId(structure.layout.leftPane.hidden ? "rightPane" : "leftPane");
		holder.appendChild(dom.byId("navigation"));
	}
	
	/**
	 * Change the layout according to the new width of screen after resize
	 * or change orientation.
	 *
	 * @param event
	 * 			event is the onresize or onorientationchange event data
	 */
	function changeLayout(event){
		var hideLeftPane = (window.innerWidth < structure.layout.threshold) ? true : false;
		if (hideLeftPane !== structure.layout.leftPane.hidden) {
			//change the layout
			
			//apply new value to demos.mobileGallery.src.structure.layout.leftPane.hidden
			structure.layout.leftPane.hidden = hideLeftPane;
			if (hideLeftPane === false) {
				// move navigation list view from rightPane to leftPane
				dom.byId("leftPane").appendChild(dom.byId("navigation"));
				
				//show leftPane
				var leftPane = dom.byId("leftPane");
				domClass.add(leftPane, "navPane");
				domClass.remove(leftPane, "hidden");
				
				var navigationView = registry.byId("navigation");
				if ("navigation" === structure.layout.rightPane.currentView) {
					//if rightPane currentView is navigation view 
					//then show default view and remove display:none style
					var defaultView = registry.byId("welcome");
					html.style(defaultView.domNode, "display", "");
					defaultView.onAfterTransitionIn();
					navigationView.onAfterTransitionIn();
				}
				else {
					//if rightPane currentView is not navigation view 
					//then show navigation view and remove display:none style in leftPane
					html.style(navigationView.domNode, "display", "");
					navigationView.onAfterTransitionIn();
				}
				
				//hide navButton if applicable
				var navButton = dom.byId("navButton");
				if (!domClass.contains(navButton, "hidden")) {
					domClass.add(navButton, "hidden");
				}
				structure.navRecords.shift();
			}
			else {
				//hide leftPane
				var leftPane = dom.byId("leftPane");
				domClass.add(leftPane, "hidden");
				domClass.remove(leftPane, "navPane");
				//show navButton if applicable
				var navButton = dom.byId("navButton");
				if (domClass.contains(navButton, "hidden")) {
					domClass.remove(navButton, "hidden");
				}
				//move navigation views in demos.mobileGallery.src.structure.navigation from leftPane to rightPane
				html.style(registry.byId(structure.layout.leftPane.currentView).domNode, "display", "none");
				dom.byId("rightPane").appendChild(dom.byId("navigation"));
				structure.navRecords.unshift({
					from: "navigation",
					to: structure.layout.currentDemo.id,
					navTitle:"Back"
				});
			}
			//refresh the whole page after the layout change
			registry.byId('splitter').startup();
		}//else (the current layout match the screen width, then do nothing)
	}
	
	return {
		init: function(){
		// set view port size
		Viewport.onViewportChange();
		
		if (structure.layout.leftPane.hidden) {
			//hide the leftPane is when the screen is small
			//define layout, hide leftPane and keep navButton visibile
			domClass.add(dom.byId('leftPane'), "hidden");
		}
		else {
			//initialize view with two splitter pane
			//define layout, show leftPane and hide navButton
			domClass.add(dom.byId('leftPane'), "navPane");
			domClass.add(dom.byId('navButton'), "hidden");
		}
		
		var hideLeftPane = structure.layout.leftPane.hidden;
		domProp.set("navigation", "selected", "true");
		//when the screen is small, only show "navigation"
		//recently the strategy of view is changed, if there's is no visible view
		//then the 1st view is selected. So we have to move navigation to the first view.
		if (hideLeftPane) {
			html.place("navigation", "rightPane", "first");
		}
		
		parser.parse(win.body());
		array.forEach(structure._views, function(view){
			initView(view);
		});
		initNavList(structure.demos);
		connect.connect(dom.byId("sourceButton"), "onclick",
				registry.byId("header"), srcBtnClickHandler);
		connect.connect(dom.byId("navButton"), "onclick", registry.byId("header"),
				navBtnClickHandler);
		var navRecords = structure.navRecords;
		// view's internal navigation rely on "pop" to update label
		// we don't hide nav button instantly, it should be handled
		// along with source button.
		connect.connect(navRecords, "pop", updateNavButtonLabel);
		connect.connect(navRecords, "push", updateNavButton);
		connect.connect(navRecords, "shift", updateNavButton);
		connect.connect(navRecords, "unshift", updateNavButton);
		connect.connect(navRecords, "splice", updateNavButton);

		
		registry.byId("navigation").onAfterTransitionIn();
		if (!hideLeftPane) //initialize view with two splitter pane
			registry.byId("welcome").onAfterTransitionIn();
		
		connect.connect(win.global, "onorientationchange", function(event){
			Viewport.onViewportChange();
			changeLayout(event);
		});
		connect.connect(win.global, "onresize", function(event){
			changeLayout(event);
		});
		
		// set color of progress indicator bars
		var prog = ProgressIndicator.getInstance();
		prog.colors = [
			"#fafafa", "#f1f1f1", "#e3e3e3", "#d3d3d3",
			"#c2c2c2", "#afafaf", "#9b9b9b", "#898989",
			"#767676", "#676767", "#5a5a5a", "#505050"
		];
		
		// workaround for flash during loading due to auto hide address bar
		setTimeout(function(){
//			dojox.mobile.resizeAll();
			html.style("loadDiv", "visibility", "hidden");
		}, dm.hideAddressBarWait + 100);
	}
	}
});
