require({cache:{
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
'dojox/main':function(){
define(["dojo/_base/kernel"], function(dojo) {
	// module:
	//		dojox/main

	/*=====
	return {
		// summary:
		//		The dojox package main module; dojox package is somewhat unusual in that the main module currently just provides an empty object.
		//		Apps should require modules from the dojox packages directly, rather than loading this module.
	};
	=====*/

	return dojo.dojox;
});
},
'dojo/require':function(){
define(["./_base/loader"], function(loader){
	return {
		dynamic:0,
		normalize:function(id){return id;},
		load:loader.require
	};
});

},
'dojo/io/script':function(){
define([
	"../_base/connect", /*===== "../_base/declare", =====*/ "../_base/kernel", "../_base/lang",
	"../sniff", "../_base/window","../_base/xhr",
	"../dom", "../dom-construct", "../request/script", "../aspect"
], function(connect, /*===== declare, =====*/ kernel, lang, has, win, xhr, dom, domConstruct, _script, aspect){

	// module:
	//		dojo/io/script

	kernel.deprecated("dojo/io/script", "Use dojo/request/script.", "2.0");

	/*=====
	var __ioArgs = declare(kernel.__IoArgs, {
		// summary:
		//		All the properties described in the dojo.__ioArgs type, apply to this
		//		type as well, EXCEPT "handleAs". It is not applicable to
		//		dojo/io/script.get() calls, since it is implied by the usage of
		//		"jsonp" (response will be a JSONP call returning JSON)
		//		or the response is pure JavaScript defined in
		//		the body of the script that was attached.
		// callbackParamName: String
		//		Deprecated as of Dojo 1.4 in favor of "jsonp", but still supported for
		//		legacy code. See notes for jsonp property.
		// jsonp: String
		//		The URL parameter name that indicates the JSONP callback string.
		//		For instance, when using Yahoo JSONP calls it is normally,
		//		jsonp: "callback". For AOL JSONP calls it is normally
		//		jsonp: "c".
		// checkString: String
		//		A string of JavaScript that when evaluated like so:
		//		"typeof(" + checkString + ") != 'undefined'"
		//		being true means that the script fetched has been loaded.
		//		Do not use this if doing a JSONP type of call (use callbackParamName instead).
		// frameDoc: Document
		//		The Document object for a child iframe. If this is passed in, the script
		//		will be attached to that document. This can be helpful in some comet long-polling
		//		scenarios with Firefox and Opera.
	});
	=====*/

	var script = {
		// summary:
		//		TODOC

		get: function(/*__ioArgs*/ args){
			// summary:
			//		sends a get request using a dynamically created script tag.
			var rDfd;
			var dfd = this._makeScriptDeferred(args, function(dfd){
				rDfd && rDfd.cancel();
			});
			var ioArgs = dfd.ioArgs;
			xhr._ioAddQueryToUrl(ioArgs);

			xhr._ioNotifyStart(dfd);

			rDfd = _script.get(ioArgs.url, {
				timeout: args.timeout,
				jsonp: ioArgs.jsonp,
				checkString: args.checkString,
				ioArgs: ioArgs,
				frameDoc: args.frameDoc,
				canAttach: function(rDfd){
					// sync values
					ioArgs.requestId = rDfd.id;
					ioArgs.scriptId = rDfd.scriptId;
					ioArgs.canDelete = rDfd.canDelete;

					return script._canAttach(ioArgs);
				}
			}, true);

			// Run _validCheck at the same time dojo/request/watch runs the
			// rDfd.isValid function
			aspect.around(rDfd, "isValid", function(isValid){
				return function(response){
					script._validCheck(dfd);
					return isValid.call(this, response);
				};
			});

			rDfd.then(function(){
				dfd.resolve(dfd);
			}).otherwise(function(error){
				dfd.ioArgs.error = error;
				dfd.reject(error);
			});

			return dfd;
		},

		attach: _script._attach,
		remove: _script._remove,

		_makeScriptDeferred: function(/*Object*/ args, /*Function?*/ cancel){
			// summary:
			//		sets up a Deferred object for an IO request.
			var dfd = xhr._ioSetArgs(args, cancel || this._deferredCancel, this._deferredOk, this._deferredError);

			var ioArgs = dfd.ioArgs;
			ioArgs.id = kernel._scopeName + "IoScript" + (this._counter++);
			ioArgs.canDelete = false;

			//Special setup for jsonp case
			ioArgs.jsonp = args.callbackParamName || args.jsonp;
			if(ioArgs.jsonp){
				//Add the jsonp parameter.
				ioArgs.query = ioArgs.query || "";
				if(ioArgs.query.length > 0){
					ioArgs.query += "&";
				}
				ioArgs.query += ioArgs.jsonp +
					"=" + (args.frameDoc ? "parent." : "") +
					kernel._scopeName + ".io.script.jsonp_" + ioArgs.id + "._jsonpCallback";

				ioArgs.frameDoc = args.frameDoc;

				//Setup the Deferred to have the jsonp callback.
				ioArgs.canDelete = true;
				dfd._jsonpCallback = this._jsonpCallback;
				this["jsonp_" + ioArgs.id] = dfd;
			}
			// Make sure this runs no matter what happens to clean things up if need be
			dfd.addBoth(function(value){
				if(ioArgs.canDelete){
					if(value instanceof Error){
						// Set up a callback that will clean things up for timeouts and cancels
						script["jsonp_" + ioArgs.id]._jsonpCallback = function(){
							// Delete the cached deferred
							delete script["jsonp_" + ioArgs.id];
							if(ioArgs.requestId){
								// Call the dojo/request/script callback to clean itself up as well
								kernel.global[_script._callbacksProperty][ioArgs.requestId]();
							}
						};
					}else{
						script._addDeadScript(ioArgs);
					}
				}
			});
			return dfd; // dojo/_base/Deferred
		},

		_deferredCancel: function(/*Deferred*/ dfd){
			// summary:
			//		canceller function for xhr._ioSetArgs call.

			//DO NOT use "this" and expect it to be script.
			dfd.canceled = true;
		},

		_deferredOk: function(/*Deferred*/ dfd){
			// summary:
			//		okHandler function for xhr._ioSetArgs call.

			//DO NOT use "this" and expect it to be script.
			var ioArgs = dfd.ioArgs;

			//Favor JSONP responses, script load events then lastly ioArgs.
			//The ioArgs are goofy, but cannot return the dfd since that stops
			//the callback chain in Deferred. The return value is not that important
			//in that case, probably a checkString case.
			return ioArgs.json || ioArgs.scriptLoaded || ioArgs;
		},

		_deferredError: function(/*Error*/ error, /*Deferred*/ dfd){
			// summary:
			//		errHandler function for xhr._ioSetArgs call.

			console.log("dojo.io.script error", error);
			return error;
		},

		_deadScripts: [],
		_counter: 1,

		_addDeadScript: function(/*Object*/ ioArgs){
			// summary:
			//		sets up an entry in the deadScripts array.
			script._deadScripts.push({id: ioArgs.id, frameDoc: ioArgs.frameDoc});
			//Being extra paranoid about leaks:
			ioArgs.frameDoc = null;
		},

		_validCheck: function(/*Deferred*/ dfd){
			// summary:
			//		inflight check function to see if dfd is still valid.

			// TODO: why isn't dfd accessed?

			//Do script cleanup here. We wait for one inflight pass
			//to make sure we don't get any weird things by trying to remove a script
			//tag that is part of the call chain (IE 6 has been known to
			//crash in that case).
			var deadScripts = script._deadScripts;
			if(deadScripts && deadScripts.length > 0){
				for(var i = 0; i < deadScripts.length; i++){
					//Remove the script tag
					script.remove(deadScripts[i].id, deadScripts[i].frameDoc);
					//Clean up the deferreds
					delete script["jsonp_" + deadScripts[i].id];
					deadScripts[i].frameDoc = null;
				}
				script._deadScripts = [];
			}

			return true;
		},

		_ioCheck: function(dfd){
			// summary:
			//		inflight check function to see if IO finished.
			// dfd: Deferred
			var ioArgs = dfd.ioArgs;
			//Check for finished jsonp
			if(ioArgs.json || (ioArgs.scriptLoaded && !ioArgs.args.checkString)){
				return true;
			}

			//Check for finished "checkString" case.
			var checkString = ioArgs.args.checkString;
			return checkString && eval("typeof(" + checkString + ") != 'undefined'");


		},

		_resHandle: function(/*Deferred*/ dfd){
			// summary:
			//		inflight function to handle a completed response.
			if(script._ioCheck(dfd)){
				dfd.callback(dfd);
			}else{
				//This path should never happen since the only way we can get
				//to _resHandle is if _ioCheck is true.
				dfd.errback(new Error("inconceivable dojo.io.script._resHandle error"));
			}
		},

		_canAttach: function(/*===== ioArgs =====*/ ){
			// summary:
			//		A method that can be overridden by other modules
			//		to control when the script attachment occurs.
			// ioArgs: Object
			return true;
		},

		_jsonpCallback: function(/*JSON Object*/ json){
			// summary:
			//		generic handler for jsonp callback. A pointer to this function
			//		is used for all jsonp callbacks.  NOTE: the "this" in this
			//		function will be the Deferred object that represents the script
			//		request.
			this.ioArgs.json = json;
			if(this.ioArgs.requestId){
				kernel.global[_script._callbacksProperty][this.ioArgs.requestId](json);
			}
		}
	};

	lang.setObject("dojo.io.script", script);

	/*=====
	script.attach = function(id, url, frameDocument){
		// summary:
		//		creates a new `<script>` tag pointing to the specified URL and
		//		adds it to the document.
		// description:
		//		Attaches the script element to the DOM. Use this method if you
		//		just want to attach a script to the DOM and do not care when or
		//		if it loads.
	};
	script.remove = function(id, frameDocument){
		// summary:
		//		removes the script element with the given id, from the given frameDocument.
		//		If no frameDocument is passed, the current document is used.
	};
	=====*/

	return script;
});

},
'dojo/request/script':function(){
define([
	'module',
	'./watch',
	'./util',
	'../_base/array',
	'../_base/lang',
	'../on',
	'../dom',
	'../dom-construct',
	'../has',
	'../_base/window'/*=====,
	'../request',
	'../_base/declare' =====*/
], function(module, watch, util, array, lang, on, dom, domConstruct, has, win/*=====, request, declare =====*/){
	has.add('script-readystatechange', function(global, document){
		var script = document.createElement('script');
		return typeof script['onreadystatechange'] !== 'undefined' &&
			(typeof global['opera'] === 'undefined' || global['opera'].toString() !== '[object Opera]');
	});

	var mid = module.id.replace(/[\/\.\-]/g, '_'),
		counter = 0,
		loadEvent = has('script-readystatechange') ? 'readystatechange' : 'load',
		readyRegExp = /complete|loaded/,
		callbacks = this[mid + '_callbacks'] = {},
		deadScripts = [];

	function attach(id, url, frameDoc){
		var doc = (frameDoc || win.doc),
			element = doc.createElement('script');

		element.type = 'text/javascript';
		element.src = url;
		element.id = id;
		element.async = true;
		element.charset = 'utf-8';

		return doc.getElementsByTagName('head')[0].appendChild(element);
	}

	function remove(id, frameDoc, cleanup){
		domConstruct.destroy(dom.byId(id, frameDoc));

		if(callbacks[id]){
			if(cleanup){
				// set callback to a function that deletes itself so requests that
				// are in-flight don't error out when returning and also
				// clean up after themselves
				callbacks[id] = function(){
					delete callbacks[id];
				};
			}else{
				delete callbacks[id];
			}
		}
	}

	function _addDeadScript(dfd){
		// Be sure to check ioArgs because it can dynamically change in the dojox/io plugins.
		// See http://bugs.dojotoolkit.org/ticket/15890.
		var options = dfd.response.options,
			frameDoc = options.ioArgs ? options.ioArgs.frameDoc : options.frameDoc;

		deadScripts.push({ id: dfd.id, frameDoc: frameDoc });

		if(options.ioArgs){
			options.ioArgs.frameDoc = null;
		}
		options.frameDoc = null;
	}

	function canceler(dfd, response){
		if(dfd.canDelete){
			//For timeouts and cancels, remove the script element immediately to
			//avoid a response from it coming back later and causing trouble.
			script._remove(dfd.id, response.options.frameDoc, true);
		}
	}
	function isValid(response){
		//Do script cleanup here. We wait for one inflight pass
		//to make sure we don't get any weird things by trying to remove a script
		//tag that is part of the call chain (IE 6 has been known to
		//crash in that case).
		if(deadScripts && deadScripts.length){
			array.forEach(deadScripts, function(_script){
				script._remove(_script.id, _script.frameDoc);
				_script.frameDoc = null;
			});
			deadScripts = [];
		}

		return response.options.jsonp ? !response.data : true;
	}
	function isReadyScript(response){
		return !!this.scriptLoaded;
	}
	function isReadyCheckString(response){
		var checkString = response.options.checkString;

		return checkString && eval('typeof(' + checkString + ') !== "undefined"');
	}
	function handleResponse(response, error){
		if(this.canDelete){
			_addDeadScript(this);
		}
		if(error){
			this.reject(error);
		}else{
			this.resolve(response);
		}
	}

	function script(url, options, returnDeferred){
		var response = util.parseArgs(url, util.deepCopy({}, options));
		url = response.url;
		options = response.options;

		var dfd = util.deferred(
			response,
			canceler,
			isValid,
			options.jsonp ? null : (options.checkString ? isReadyCheckString : isReadyScript),
			handleResponse
		);

		lang.mixin(dfd, {
			id: mid + (counter++),
			canDelete: false
		});

		if(options.jsonp){
			var queryParameter = new RegExp('[?&]' + options.jsonp + '=');
			if(!queryParameter.test(url)){
				url += (~url.indexOf('?') ? '&' : '?') +
					options.jsonp + '=' +
					(options.frameDoc ? 'parent.' : '') +
					mid + '_callbacks.' + dfd.id;
			}

			dfd.canDelete = true;
			callbacks[dfd.id] = function(json){
				response.data = json;
				dfd.handleResponse(response);
			};
		}

		if(util.notify){
			util.notify.emit('send', response, dfd.promise.cancel);
		}

		if(!options.canAttach || options.canAttach(dfd)){
			var node = script._attach(dfd.id, url, options.frameDoc);

			if(!options.jsonp && !options.checkString){
				var handle = on(node, loadEvent, function(evt){
					if(evt.type === 'load' || readyRegExp.test(node.readyState)){
						handle.remove();
						dfd.scriptLoaded = evt;
					}
				});
			}
		}

		watch(dfd);

		return returnDeferred ? dfd : dfd.promise;
	}
	script.get = script;
	/*=====
	script = function(url, options){
		// summary:
		//		Sends a request using a script element with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/script.__Options?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	script.__BaseOptions = declare(request.__BaseOptions, {
		// jsonp: String?
		//		The URL parameter name that indicates the JSONP callback string.
		//		For instance, when using Yahoo JSONP calls it is normally,
		//		jsonp: "callback". For AOL JSONP calls it is normally
		//		jsonp: "c".
		// checkString: String?
		//		A string of JavaScript that when evaluated like so:
		//		"typeof(" + checkString + ") != 'undefined'"
		//		being true means that the script fetched has been loaded.
		//		Do not use this if doing a JSONP type of call (use `jsonp` instead).
		// frameDoc: Document?
		//		The Document object of a child iframe. If this is passed in, the script
		//		will be attached to that document. This can be helpful in some comet long-polling
		//		scenarios with Firefox and Opera.
	});
	script.__MethodOptions = declare(null, {
		// method: String?
		//		This option is ignored. All requests using this transport are
		//		GET requests.
	});
	script.__Options = declare([script.__BaseOptions, script.__MethodOptions]);

	script.get = function(url, options){
		// summary:
		//		Send an HTTP GET request using a script element with the given URL and options.
		// url: String
		//		URL to request
		// options: dojo/request/script.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	=====*/

	// TODO: Remove in 2.0
	script._attach = attach;
	script._remove = remove;
	script._callbacksProperty = mid + '_callbacks';

	return script;
});

},
'dojox/rpc/Service':function(){
define("dojox/rpc/Service", ["dojo", "dojox", "dojo/AdapterRegistry", "dojo/_base/url"], function(dojo, dojox) {

dojo.declare("dojox.rpc.Service", null, {
	constructor: function(smd, options){
		// summary:
		//		Take a string as a url to retrieve an smd or an object that is an smd or partial smd to use
		//		as a definition for the service
		// description:
		//		dojox.rpc.Service must be loaded prior to any plugin services like dojox.rpc.Rest
		//		dojox.rpc.JsonRpc in order for them to register themselves, otherwise you get
		//		a "No match found" error.
		// smd: object
		//		Takes a number of properties as kwArgs for defining the service.  It also
		//		accepts a string.  When passed a string, it is treated as a url from
		//		which it should synchronously retrieve an smd file.  Otherwise it is a kwArgs
		//		object.  It accepts serviceUrl, to manually define a url for the rpc service
		//		allowing the rpc system to be used without an smd definition. strictArgChecks
		//		forces the system to verify that the # of arguments provided in a call
		//		matches those defined in the smd.  smdString allows a developer to pass
		//		a jsonString directly, which will be converted into an object or alternatively
		//		smdObject is accepts an smdObject directly.

		var url;
		var self = this;
		function processSmd(smd){
			smd._baseUrl = new dojo._Url((dojo.isBrowser ? location.href : dojo.config.baseUrl) ,url || '.') + '';
			self._smd = smd;

			//generate the methods
 			for(var serviceName in self._smd.services){
				var pieces = serviceName.split("."); // handle "namespaced" services by breaking apart by .
				var current = self;
				for(var i=0; i< pieces.length-1; i++){
					// create or reuse each object as we go down the chain
					current = current[pieces[i]] || (current[pieces[i]] = {});
				}
				current[pieces[pieces.length-1]]=	self._generateService(serviceName, self._smd.services[serviceName]);
 			}
		}
		if(smd){
			//ifthe arg is a string, we assume it is a url to retrieve an smd definition from
			if( (dojo.isString(smd)) || (smd instanceof dojo._Url)){
				if(smd instanceof dojo._Url){
					url = smd + "";
				}else{
					url = smd;
				}

				var text = dojo._getText(url);
				if(!text){
					throw new Error("Unable to load SMD from " + smd);
				}else{
					processSmd(dojo.fromJson(text));
				}
			}else{
				processSmd(smd);
			}
		}

		this._options = (options ? options : {});
		this._requestId = 0;
	},

	_generateService: function(serviceName, method){
		if(this[method]){
			throw new Error("WARNING: "+ serviceName+ " already exists for service. Unable to generate function");
		}
		method.name = serviceName;
		var func = dojo.hitch(this, "_executeMethod",method);
		var transport = dojox.rpc.transportRegistry.match(method.transport || this._smd.transport);
		if(transport.getExecutor){
			func = transport.getExecutor(func,method,this);
		}
		var schema = method.returns || (method._schema = {}); // define the schema
		var servicePath = '/' + serviceName +'/';
		// schemas are minimally used to track the id prefixes for the different services
		schema._service = func;
		func.servicePath = servicePath;
		func._schema = schema;
		func.id = dojox.rpc.Service._nextId++;
		return func;
	},
	_getRequest: function(method,args){
		var smd = this._smd;
		var envDef = dojox.rpc.envelopeRegistry.match(method.envelope || smd.envelope || "NONE");
		var parameters = (method.parameters || []).concat(smd.parameters || []);
		if(envDef.namedParams){
			// the serializer is expecting named params
			if((args.length==1) && dojo.isObject(args[0])){
				// looks like we have what we want
				args = args[0];
			}else{
				// they provided ordered, must convert
				var data={};
				for(var i=0;i<method.parameters.length;i++){
					if(typeof args[i] != "undefined" || !method.parameters[i].optional){
						data[method.parameters[i].name]=args[i];
					}
				}
				args = data;
			}
			if(method.strictParameters||smd.strictParameters){
				//remove any properties that were not defined
				for(i in args){
					var found=false;
					for(var j=0; j<parameters.length;j++){
						if(parameters[j].name==i){ found=true; }
					}
					if(!found){
						delete args[i];
					}
				}

			}
			// setting default values
			for(i=0; i< parameters.length; i++){
				var param = parameters[i];
				if(!param.optional && param.name && !args[param.name]){
					if(param["default"]){
						args[param.name] = param["default"];
					}else if(!(param.name in args)){
						throw new Error("Required parameter " + param.name + " was omitted");
					}
				}
			}
		}else if(parameters && parameters[0] && parameters[0].name && (args.length==1) && dojo.isObject(args[0])){
			// looks like named params, we will convert
			if(envDef.namedParams === false){
				// the serializer is expecting ordered params, must be ordered
				args = dojox.rpc.toOrdered(parameters, args);
			}else{
				// named is ok
				args = args[0];
			}
		}

		if(dojo.isObject(this._options)){
			args = dojo.mixin(args, this._options);
		}

		var schema = method._schema || method.returns; // serialize with the right schema for the context;
		var request = envDef.serialize.apply(this, [smd, method, args]);
		request._envDef = envDef;// save this for executeMethod
		var contentType = (method.contentType || smd.contentType || request.contentType);

		// this allows to mandate synchronous behavior from elsewhere when necessary, this may need to be changed to be one-shot in FF3 new sync handling model
		return dojo.mixin(request, {
			sync: dojox.rpc._sync,
			contentType: contentType,
			headers: method.headers || smd.headers || request.headers || {},
			target: request.target || dojox.rpc.getTarget(smd, method),
			transport: method.transport || smd.transport || request.transport,
			envelope: method.envelope || smd.envelope || request.envelope,
			timeout: method.timeout || smd.timeout,
			callbackParamName: method.callbackParamName || smd.callbackParamName,
			rpcObjectParamName: method.rpcObjectParamName || smd.rpcObjectParamName,
			schema: schema,
			handleAs: request.handleAs || "auto",
			preventCache: method.preventCache || smd.preventCache,
			frameDoc: this._options.frameDoc || undefined
		});
	},
	_executeMethod: function(method){
		var args = [];
		var i;
		for(i=1; i< arguments.length; i++){
			args.push(arguments[i]);
		}
		var request = this._getRequest(method,args);
		var deferred = dojox.rpc.transportRegistry.match(request.transport).fire(request);

		deferred.addBoth(function(results){
			return request._envDef.deserialize.call(this,results);
		});
		return deferred;
	}
});

dojox.rpc.getTarget = function(smd, method){
	var dest=smd._baseUrl;
	if(smd.target){
		dest = new dojo._Url(dest,smd.target) + '';
	}
	if(method.target){
		dest = new dojo._Url(dest,method.target) + '';
	}
	return dest;
};

dojox.rpc.toOrdered=function(parameters, args){
	if(dojo.isArray(args)){ return args; }
	var data=[];
	for(var i=0;i<parameters.length;i++){
		data.push(args[parameters[i].name]);
	}
	return data;
};

dojox.rpc.transportRegistry = new dojo.AdapterRegistry(true);
dojox.rpc.envelopeRegistry = new dojo.AdapterRegistry(true);
//Built In Envelopes

dojox.rpc.envelopeRegistry.register(
	"URL",
	function(str){ return str == "URL"; },
	{
		serialize:function(smd, method, data ){
			var d = dojo.objectToQuery(data);
			return {
				data: d,
				transport:"POST"
			};
		},
		deserialize:function(results){
			return results;
		},
		namedParams: true
	}
);

dojox.rpc.envelopeRegistry.register(
	"JSON",
	function(str){ return str == "JSON"; },
	{
		serialize: function(smd, method, data){
			var d = dojo.toJson(data);

			return {
				data: d,
				handleAs: 'json',
				contentType : 'application/json'
			};
		},
		deserialize: function(results){
			return results;
		}
	}
);
dojox.rpc.envelopeRegistry.register(
	"PATH",
	function(str){ return str == "PATH"; },
	{
		serialize:function(smd, method, data){
			var i;
			var target = dojox.rpc.getTarget(smd, method);
			if(dojo.isArray(data)){
				for(i = 0; i < data.length;i++){
					target += '/' + data[i];
				}
			}else{
				for(i in data){
					target += '/' + i + '/' + data[i];
				}
			}

			return {
				data:'',
				target: target
			};
		},
		deserialize:function(results){
			return results;
		}
	}
);



//post is registered first because it is the default;
dojox.rpc.transportRegistry.register(
	"POST",
	function(str){ return str == "POST"; },
	{
		fire:function(r){
			r.url = r.target;
			r.postData = r.data;
			return dojo.rawXhrPost(r);
		}
	}
);

dojox.rpc.transportRegistry.register(
	"GET",
	function(str){ return str == "GET"; },
	{
		fire: function(r){
			r.url=  r.target + (r.data ? '?' + ((r.rpcObjectParamName) ? r.rpcObjectParamName + '=' : '') + r.data : '');
			return dojo.xhrGet(r);
		}
	}
);


//only works ifyou include dojo.io.script
dojox.rpc.transportRegistry.register(
	"JSONP",
	function(str){ return str == "JSONP"; },
	{
		fire: function(r){
			r.url = r.target + ((r.target.indexOf("?") == -1) ? '?' : '&') + ((r.rpcObjectParamName) ? r.rpcObjectParamName + '=' : '') + r.data;
			r.callbackParamName = r.callbackParamName || "callback";
			return dojo.io.script.get(r);
		}
	}
);
dojox.rpc.Service._nextId = 1;

dojo._contentHandlers.auto = function(xhr){
	// automatically choose the right handler based on the returned content type
	var handlers = dojo._contentHandlers;
	var retContentType = xhr.getResponseHeader("Content-Type");
	var results = !retContentType ? handlers.text(xhr) :
		retContentType.match(/\/.*json/) ? handlers.json(xhr) :
		retContentType.match(/\/javascript/) ? handlers.javascript(xhr) :
		retContentType.match(/\/xml/) ? handlers.xml(xhr) : handlers.text(xhr);
	return results;
};

return dojox.rpc.Service;

});

},
'dojo/AdapterRegistry':function(){
define(["./_base/kernel", "./_base/lang"], function(dojo, lang){
// module:
//		dojo/AdapterRegistry

var AdapterRegistry = dojo.AdapterRegistry = function(/*Boolean?*/ returnWrappers){
	// summary:
	//		A registry to make contextual calling/searching easier.
	// description:
	//		Objects of this class keep list of arrays in the form [name, check,
	//		wrap, directReturn] that are used to determine what the contextual
	//		result of a set of checked arguments is. All check/wrap functions
	//		in this registry should be of the same arity.
	// example:
	//	|	// create a new registry
	//	|	var reg = new dojo.AdapterRegistry();
	//	|	reg.register("handleString",
	//	|		dojo.isString,
	//	|		function(str){
	//	|			// do something with the string here
	//	|		}
	//	|	);
	//	|	reg.register("handleArr",
	//	|		dojo.isArray,
	//	|		function(arr){
	//	|			// do something with the array here
	//	|		}
	//	|	);
	//	|
	//	|	// now we can pass reg.match() *either* an array or a string and
	//	|	// the value we pass will get handled by the right function
	//	|	reg.match("someValue"); // will call the first function
	//	|	reg.match(["someValue"]); // will call the second

	this.pairs = [];
	this.returnWrappers = returnWrappers || false; // Boolean
};

lang.extend(AdapterRegistry, {
	register: function(/*String*/ name, /*Function*/ check, /*Function*/ wrap, /*Boolean?*/ directReturn, /*Boolean?*/ override){
		// summary:
		//		register a check function to determine if the wrap function or
		//		object gets selected
		// name:
		//		a way to identify this matcher.
		// check:
		//		a function that arguments are passed to from the adapter's
		//		match() function.  The check function should return true if the
		//		given arguments are appropriate for the wrap function.
		// directReturn:
		//		If directReturn is true, the value passed in for wrap will be
		//		returned instead of being called. Alternately, the
		//		AdapterRegistry can be set globally to "return not call" using
		//		the returnWrappers property. Either way, this behavior allows
		//		the registry to act as a "search" function instead of a
		//		function interception library.
		// override:
		//		If override is given and true, the check function will be given
		//		highest priority. Otherwise, it will be the lowest priority
		//		adapter.
		this.pairs[((override) ? "unshift" : "push")]([name, check, wrap, directReturn]);
	},

	match: function(/* ... */){
		// summary:
		//		Find an adapter for the given arguments. If no suitable adapter
		//		is found, throws an exception. match() accepts any number of
		//		arguments, all of which are passed to all matching functions
		//		from the registered pairs.
		for(var i = 0; i < this.pairs.length; i++){
			var pair = this.pairs[i];
			if(pair[1].apply(this, arguments)){
				if((pair[3])||(this.returnWrappers)){
					return pair[2];
				}else{
					return pair[2].apply(this, arguments);
				}
			}
		}
		throw new Error("No match found");
	},

	unregister: function(name){
		// summary:
		//		Remove a named adapter from the registry
		// name: String
		//		The name of the adapter.
		// returns: Boolean
		//		Returns true if operation is successful.
		//		Returns false if operation fails.
	
		// FIXME: this is kind of a dumb way to handle this. On a large
		// registry this will be slow-ish and we can use the name as a lookup
		// should we choose to trade memory for speed.
		for(var i = 0; i < this.pairs.length; i++){
			var pair = this.pairs[i];
			if(pair[0] == name){
				this.pairs.splice(i, 1);
				return true;
			}
		}
		return false;
	}
});

return AdapterRegistry;
});

},
'dojo/_base/url':function(){
define(["./kernel"], function(dojo){
	// module:
	//		dojo/url

	var
		ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$"),
		ire = new RegExp("^((([^\\[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^\\[:]*))(:([0-9]+))?$"),
		_Url = function(){
			var n = null,
				_a = arguments,
				uri = [_a[0]];
			// resolve uri components relative to each other
			for(var i = 1; i<_a.length; i++){
				if(!_a[i]){ continue; }

				// Safari doesn't support this.constructor so we have to be explicit
				// FIXME: Tracked (and fixed) in Webkit bug 3537.
				//		http://bugs.webkit.org/show_bug.cgi?id=3537
				var relobj = new _Url(_a[i]+""),
					uriobj = new _Url(uri[0]+"");

				if(
					relobj.path == "" &&
					!relobj.scheme &&
					!relobj.authority &&
					!relobj.query
				){
					if(relobj.fragment != n){
						uriobj.fragment = relobj.fragment;
					}
					relobj = uriobj;
				}else if(!relobj.scheme){
					relobj.scheme = uriobj.scheme;

					if(!relobj.authority){
						relobj.authority = uriobj.authority;

						if(relobj.path.charAt(0) != "/"){
							var path = uriobj.path.substring(0,
								uriobj.path.lastIndexOf("/") + 1) + relobj.path;

							var segs = path.split("/");
							for(var j = 0; j < segs.length; j++){
								if(segs[j] == "."){
									// flatten "./" references
									if(j == segs.length - 1){
										segs[j] = "";
									}else{
										segs.splice(j, 1);
										j--;
									}
								}else if(j > 0 && !(j == 1 && segs[0] == "") &&
									segs[j] == ".." && segs[j-1] != ".."){
									// flatten "../" references
									if(j == (segs.length - 1)){
										segs.splice(j, 1);
										segs[j - 1] = "";
									}else{
										segs.splice(j - 1, 2);
										j -= 2;
									}
								}
							}
							relobj.path = segs.join("/");
						}
					}
				}

				uri = [];
				if(relobj.scheme){
					uri.push(relobj.scheme, ":");
				}
				if(relobj.authority){
					uri.push("//", relobj.authority);
				}
				uri.push(relobj.path);
				if(relobj.query){
					uri.push("?", relobj.query);
				}
				if(relobj.fragment){
					uri.push("#", relobj.fragment);
				}
			}

			this.uri = uri.join("");

			// break the uri into its main components
			var r = this.uri.match(ore);

			this.scheme = r[2] || (r[1] ? "" : n);
			this.authority = r[4] || (r[3] ? "" : n);
			this.path = r[5]; // can never be undefined
			this.query = r[7] || (r[6] ? "" : n);
			this.fragment	 = r[9] || (r[8] ? "" : n);

			if(this.authority != n){
				// server based naming authority
				r = this.authority.match(ire);

				this.user = r[3] || n;
				this.password = r[4] || n;
				this.host = r[6] || r[7]; // ipv6 || ipv4
				this.port = r[9] || n;
			}
		};
	_Url.prototype.toString = function(){ return this.uri; };

	return dojo._Url = _Url;
});

},
'dijit/Tree':function(){
define([
	"dojo/_base/array", // array.filter array.forEach array.map
	"dojo/aspect",
	"dojo/cookie", // cookie
	"dojo/_base/declare", // declare
	"dojo/Deferred", // Deferred
	"dojo/promise/all",
	"dojo/dom", // dom.isDescendant
	"dojo/dom-class", // domClass.add domClass.remove domClass.replace domClass.toggle
	"dojo/dom-geometry", // domGeometry.setMarginBox domGeometry.position
	"dojo/dom-style", // domStyle.set
	"dojo/errors/create", // createError
	"dojo/fx", // fxUtils.wipeIn fxUtils.wipeOut
	"dojo/has",
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/keys", // arrows etc.
	"dojo/_base/lang", // lang.getObject lang.mixin lang.hitch
	"dojo/on", // on(), on.selector()
	"dojo/topic",
	"dojo/touch",
	"dojo/when",
	"./a11yclick",
	"./focus",
	"./registry", // registry.byNode(), registry.getEnclosingWidget()
	"./_base/manager", // manager.defaultDuration
	"./_Widget",
	"./_TemplatedMixin",
	"./_Container",
	"./_Contained",
	"./_CssStateMixin",
	"./_KeyNavMixin",
	"dojo/text!./templates/TreeNode.html",
	"dojo/text!./templates/Tree.html",
	"./tree/TreeStoreModel",
	"./tree/ForestStoreModel",
	"./tree/_dndSelector",
	"dojo/query!css2"	// needed when on.selector() used with a string for the selector
], function(array, aspect, cookie, declare, Deferred, all,
			dom, domClass, domGeometry, domStyle, createError, fxUtils, has, kernel, keys, lang, on, topic, touch, when,
			a11yclick, focus, registry, manager, _Widget, _TemplatedMixin, _Container, _Contained, _CssStateMixin, _KeyNavMixin,
			treeNodeTemplate, treeTemplate, TreeStoreModel, ForestStoreModel, _dndSelector){

	// module:
	//		dijit/Tree

	function shimmedPromise(/*Deferred|Promise*/ d){
		// summary:
		//		Return a Promise based on given Deferred or Promise, with back-compat addCallback() and addErrback() shims
		//		added (TODO: remove those back-compat shims, and this method, for 2.0)

		return lang.delegate(d.promise || d, {
			addCallback: function(callback){
				this.then(callback);
			},
			addErrback: function(errback){
				this.otherwise(errback);
			}
		});
	}

	var TreeNode = declare("dijit._TreeNode", [_Widget, _TemplatedMixin, _Container, _Contained, _CssStateMixin], {
		// summary:
		//		Single node within a tree.   This class is used internally
		//		by Tree and should not be accessed directly.
		// tags:
		//		private

		// item: [const] Item
		//		the dojo.data entry this tree represents
		item: null,

		// isTreeNode: [protected] Boolean
		//		Indicates that this is a TreeNode.   Used by `dijit.Tree` only,
		//		should not be accessed directly.
		isTreeNode: true,

		// label: String
		//		Text of this tree node
		label: "",
		_setLabelAttr: function(val){
			this.labelNode[this.labelType == "html" ? "innerHTML" : "innerText" in this.labelNode ?
				"innerText" : "textContent"] = val;
			this._set("label", val);
		},

		// labelType: [const] String
		//		Specifies how to interpret the label.  Can be "html" or "text".
		labelType: "text",

		// isExpandable: [private] Boolean
		//		This node has children, so show the expando node (+ sign)
		isExpandable: null,

		// isExpanded: [readonly] Boolean
		//		This node is currently expanded (ie, opened)
		isExpanded: false,

		// state: [private] String
		//		Dynamic loading-related stuff.
		//		When an empty folder node appears, it is "NotLoaded" first,
		//		then after dojo.data query it becomes "Loading" and, finally "Loaded"
		state: "NotLoaded",

		templateString: treeNodeTemplate,

		baseClass: "dijitTreeNode",

		// For hover effect for tree node, and focus effect for label
		cssStateNodes: {
			rowNode: "dijitTreeRow"
		},

		// Tooltip is defined in _WidgetBase but we need to handle the mapping to DOM here
		_setTooltipAttr: {node: "rowNode", type: "attribute", attribute: "title"},

		buildRendering: function(){
			this.inherited(arguments);

			// set expand icon for leaf
			this._setExpando();

			// set icon and label class based on item
			this._updateItemClasses(this.item);

			if(this.isExpandable){
				this.labelNode.setAttribute("aria-expanded", this.isExpanded);
			}

			//aria-selected should be false on all selectable elements.
			this.setSelected(false);
		},

		_setIndentAttr: function(indent){
			// summary:
			//		Tell this node how many levels it should be indented
			// description:
			//		0 for top level nodes, 1 for their children, 2 for their
			//		grandchildren, etc.

			// Math.max() is to prevent negative padding on hidden root node (when indent == -1)
			var pixels = (Math.max(indent, 0) * this.tree._nodePixelIndent) + "px";

			domStyle.set(this.domNode, "backgroundPosition", pixels + " 0px");	// TODOC: what is this for???
			domStyle.set(this.rowNode, this.isLeftToRight() ? "paddingLeft" : "paddingRight", pixels);

			array.forEach(this.getChildren(), function(child){
				child.set("indent", indent + 1);
			});

			this._set("indent", indent);
		},

		markProcessing: function(){
			// summary:
			//		Visually denote that tree is loading data, etc.
			// tags:
			//		private
			this.state = "Loading";
			this._setExpando(true);
		},

		unmarkProcessing: function(){
			// summary:
			//		Clear markup from markProcessing() call
			// tags:
			//		private
			this._setExpando(false);
		},

		_updateItemClasses: function(item){
			// summary:
			//		Set appropriate CSS classes for icon and label dom node
			//		(used to allow for item updates to change respective CSS)
			// tags:
			//		private
			var tree = this.tree, model = tree.model;
			if(tree._v10Compat && item === model.root){
				// For back-compat with 1.0, need to use null to specify root item (TODO: remove in 2.0)
				item = null;
			}
			this._applyClassAndStyle(item, "icon", "Icon");
			this._applyClassAndStyle(item, "label", "Label");
			this._applyClassAndStyle(item, "row", "Row");

			this.tree._startPaint(true);		// signifies paint started and finished (synchronously)
		},

		_applyClassAndStyle: function(item, lower, upper){
			// summary:
			//		Set the appropriate CSS classes and styles for labels, icons and rows.
			//
			// item:
			//		The data item.
			//
			// lower:
			//		The lower case attribute to use, e.g. 'icon', 'label' or 'row'.
			//
			// upper:
			//		The upper case attribute to use, e.g. 'Icon', 'Label' or 'Row'.
			//
			// tags:
			//		private

			var clsName = "_" + lower + "Class";
			var nodeName = lower + "Node";
			var oldCls = this[clsName];

			this[clsName] = this.tree["get" + upper + "Class"](item, this.isExpanded);
			domClass.replace(this[nodeName], this[clsName] || "", oldCls || "");

			domStyle.set(this[nodeName], this.tree["get" + upper + "Style"](item, this.isExpanded) || {});
		},

		_updateLayout: function(){
			// summary:
			//		Set appropriate CSS classes for this.domNode
			// tags:
			//		private
			var parent = this.getParent();
			if(!parent || !parent.rowNode || parent.rowNode.style.display == "none"){
				/* if we are hiding the root node then make every first level child look like a root node */
				domClass.add(this.domNode, "dijitTreeIsRoot");
			}else{
				domClass.toggle(this.domNode, "dijitTreeIsLast", !this.getNextSibling());
			}
		},

		_setExpando: function(/*Boolean*/ processing){
			// summary:
			//		Set the right image for the expando node
			// tags:
			//		private

			var styles = ["dijitTreeExpandoLoading", "dijitTreeExpandoOpened",
					"dijitTreeExpandoClosed", "dijitTreeExpandoLeaf"],
				_a11yStates = ["*", "-", "+", "*"],
				idx = processing ? 0 : (this.isExpandable ? (this.isExpanded ? 1 : 2) : 3);

			// apply the appropriate class to the expando node
			domClass.replace(this.expandoNode, styles[idx], styles);

			// provide a non-image based indicator for images-off mode
			this.expandoNodeText.innerHTML = _a11yStates[idx];

		},

		expand: function(){
			// summary:
			//		Show my children
			// returns:
			//		Promise that resolves when expansion is complete

			// If there's already an expand in progress or we are already expanded, just return
			if(this._expandDeferred){
				return shimmedPromise(this._expandDeferred);		// dojo/promise/Promise
			}

			// cancel in progress collapse operation
			if(this._collapseDeferred){
				this._collapseDeferred.cancel();
				delete this._collapseDeferred;
			}

			// All the state information for when a node is expanded, maybe this should be
			// set when the animation completes instead
			this.isExpanded = true;
			this.labelNode.setAttribute("aria-expanded", "true");
			if(this.tree.showRoot || this !== this.tree.rootNode){
				this.containerNode.setAttribute("role", "group");
			}
			domClass.add(this.contentNode, 'dijitTreeContentExpanded');
			this._setExpando();
			this._updateItemClasses(this.item);

			if(this == this.tree.rootNode && this.tree.showRoot){
				this.tree.domNode.setAttribute("aria-expanded", "true");
			}

			var wipeIn = fxUtils.wipeIn({
				node: this.containerNode,
				duration: manager.defaultDuration
			});

			// Deferred that fires when expand is complete
			var def = (this._expandDeferred = new Deferred(function(){
				// Canceller
				wipeIn.stop();
			}));

			aspect.after(wipeIn, "onEnd", function(){
				def.resolve(true);
			}, true);

			wipeIn.play();

			return shimmedPromise(def);		// dojo/promise/Promise
		},

		collapse: function(){
			// summary:
			//		Collapse this node (if it's expanded)
			// returns:
			//		Promise that resolves when collapse is complete

			if(this._collapseDeferred){
				// Node is already collapsed, or there's a collapse in progress, just return that Deferred
				return shimmedPromise(this._collapseDeferred);
			}

			// cancel in progress expand operation
			if(this._expandDeferred){
				this._expandDeferred.cancel();
				delete this._expandDeferred;
			}

			this.isExpanded = false;
			this.labelNode.setAttribute("aria-expanded", "false");
			if(this == this.tree.rootNode && this.tree.showRoot){
				this.tree.domNode.setAttribute("aria-expanded", "false");
			}
			domClass.remove(this.contentNode, 'dijitTreeContentExpanded');
			this._setExpando();
			this._updateItemClasses(this.item);

			var wipeOut = fxUtils.wipeOut({
				node: this.containerNode,
				duration: manager.defaultDuration
			});

			// Deferred that fires when expand is complete
			var def = (this._collapseDeferred = new Deferred(function(){
				// Canceller
				wipeOut.stop();
			}));

			aspect.after(wipeOut, "onEnd", function(){
				def.resolve(true);
			}, true);

			wipeOut.play();

			return shimmedPromise(def);		// dojo/promise/Promise
		},

		// indent: Integer
		//		Levels from this node to the root node
		indent: 0,

		setChildItems: function(/* Object[] */ items){
			// summary:
			//		Sets the child items of this node, removing/adding nodes
			//		from current children to match specified items[] array.
			//		Also, if this.persist == true, expands any children that were previously
			//		opened.
			// returns:
			//		Promise that resolves after all previously opened children
			//		have been expanded again (or fires instantly if there are no such children).

			var tree = this.tree,
				model = tree.model,
				defs = [];	// list of deferreds that need to fire before I am complete


			// Orphan all my existing children.
			// If items contains some of the same items as before then we will reattach them.
			// Don't call this.removeChild() because that will collapse the tree etc.
			var oldChildren = this.getChildren();
			array.forEach(oldChildren, function(child){
				_Container.prototype.removeChild.call(this, child);
			}, this);

			// All the old children of this TreeNode are subject for destruction if
			//		1) they aren't listed in the new children array (items)
			//		2) they aren't immediately adopted by another node (DnD)
			this.defer(function(){
				array.forEach(oldChildren, function(node){
					if(!node._destroyed && !node.getParent()){
						// If node is in selection then remove it.
						tree.dndController.removeTreeNode(node);

						// Deregister mapping from item id --> this node and its descendants
						function remove(node){
							var id = model.getIdentity(node.item),
								ary = tree._itemNodesMap[id];
							if(ary.length == 1){
								delete tree._itemNodesMap[id];
							}else{
								var index = array.indexOf(ary, node);
								if(index != -1){
									ary.splice(index, 1);
								}
							}
							array.forEach(node.getChildren(), remove);
						}

						remove(node);

						// Remove any entries involving this node from cookie tracking expanded nodes
						if(tree.persist){
							var destroyedPath = array.map(node.getTreePath(),function(item){
								return tree.model.getIdentity(item);
							}).join("/");
							for(var path in tree._openedNodes){
								if(path.substr(0, destroyedPath.length) == destroyedPath){
									delete tree._openedNodes[path];
								}
							}
							tree._saveExpandedNodes();
						}

						// And finally we can destroy the node
						node.destroyRecursive();
					}
				});
			});

			this.state = "Loaded";

			if(items && items.length > 0){
				this.isExpandable = true;

				// Create _TreeNode widget for each specified tree node, unless one already
				// exists and isn't being used (presumably it's from a DnD move and was recently
				// released
				array.forEach(items, function(item){    // MARKER: REUSE NODE
					var id = model.getIdentity(item),
						existingNodes = tree._itemNodesMap[id],
						node;
					if(existingNodes){
						for(var i = 0; i < existingNodes.length; i++){
							if(existingNodes[i] && !existingNodes[i].getParent()){
								node = existingNodes[i];
								node.set('indent', this.indent + 1);
								break;
							}
						}
					}
					if(!node){
						node = this.tree._createTreeNode({
							item: item,
							tree: tree,
							isExpandable: model.mayHaveChildren(item),
							label: tree.getLabel(item),
							labelType: (tree.model && tree.model.labelType) || "text",
							tooltip: tree.getTooltip(item),
							ownerDocument: tree.ownerDocument,
							dir: tree.dir,
							lang: tree.lang,
							textDir: tree.textDir,
							indent: this.indent + 1
						});
						if(existingNodes){
							existingNodes.push(node);
						}else{
							tree._itemNodesMap[id] = [node];
						}
					}
					this.addChild(node);

					// If node was previously opened then open it again now (this may trigger
					// more data store accesses, recursively)
					if(this.tree.autoExpand || this.tree._state(node)){
						defs.push(tree._expandNode(node));
					}
				}, this);

				// note that updateLayout() needs to be called on each child after
				// _all_ the children exist
				array.forEach(this.getChildren(), function(child){
					child._updateLayout();
				});
			}else{
				this.isExpandable = false;
			}

			if(this._setExpando){
				// change expando to/from dot or + icon, as appropriate
				this._setExpando(false);
			}

			// Set leaf icon or folder icon, as appropriate
			this._updateItemClasses(this.item);

			var def = all(defs);
			this.tree._startPaint(def);		// to reset TreeNode widths after an item is added/removed from the Tree
			return shimmedPromise(def);		// dojo/promise/Promise
		},

		getTreePath: function(){
			var node = this;
			var path = [];
			while(node && node !== this.tree.rootNode){
				path.unshift(node.item);
				node = node.getParent();
			}
			path.unshift(this.tree.rootNode.item);

			return path;
		},

		getIdentity: function(){
			return this.tree.model.getIdentity(this.item);
		},

		removeChild: function(/* treeNode */ node){
			this.inherited(arguments);

			var children = this.getChildren();
			if(children.length == 0){
				this.isExpandable = false;
				this.collapse();
			}

			array.forEach(children, function(child){
				child._updateLayout();
			});
		},

		makeExpandable: function(){
			// summary:
			//		if this node wasn't already showing the expando node,
			//		turn it into one and call _setExpando()

			// TODO: hmm this isn't called from anywhere, maybe should remove it for 2.0

			this.isExpandable = true;
			this._setExpando(false);
		},

		setSelected: function(/*Boolean*/ selected){
			// summary:
			//		A Tree has a (single) currently selected node.
			//		Mark that this node is/isn't that currently selected node.
			// description:
			//		In particular, setting a node as selected involves setting tabIndex
			//		so that when user tabs to the tree, focus will go to that node (only).
			this.labelNode.setAttribute("aria-selected", selected ? "true" : "false");
			domClass.toggle(this.rowNode, "dijitTreeRowSelected", selected);
		},

		focus: function(){
			focus.focus(this.focusNode);
		}
	});

	if(has("dojo-bidi")){
		TreeNode.extend({
			_setTextDirAttr: function(textDir){
				if(textDir && ((this.textDir != textDir) || !this._created)){
					this._set("textDir", textDir);
					this.applyTextDir(this.labelNode);
					array.forEach(this.getChildren(), function(childNode){
						childNode.set("textDir", textDir);
					}, this);
				}
			}
		});
	}

	var Tree = declare("dijit.Tree", [_Widget, _KeyNavMixin, _TemplatedMixin, _CssStateMixin], {
		// summary:
		//		This widget displays hierarchical data from a store.

		baseClass: "dijitTree",

		// store: [deprecated] String|dojo/data/Store
		//		Deprecated.  Use "model" parameter instead.
		//		The store to get data to display in the tree.
		store: null,

		// model: [const] dijit/tree/model
		//		Interface to read tree data, get notifications of changes to tree data,
		//		and for handling drop operations (i.e drag and drop onto the tree)
		model: null,

		// query: [deprecated] anything
		//		Deprecated.  User should specify query to the model directly instead.
		//		Specifies datastore query to return the root item or top items for the tree.
		query: null,

		// label: [deprecated] String
		//		Deprecated.  Use dijit/tree/ForestStoreModel directly instead.
		//		Used in conjunction with query parameter.
		//		If a query is specified (rather than a root node id), and a label is also specified,
		//		then a fake root node is created and displayed, with this label.
		label: "",

		// showRoot: [const] Boolean
		//		Should the root node be displayed, or hidden?
		showRoot: true,

		// childrenAttr: [deprecated] String[]
		//		Deprecated.   This information should be specified in the model.
		//		One ore more attributes that holds children of a tree node
		childrenAttr: ["children"],

		// paths: String[][] or Item[][]
		//		Full paths from rootNode to selected nodes expressed as array of items or array of ids.
		//		Since setting the paths may be asynchronous (because of waiting on dojo.data), set("paths", ...)
		//		returns a Promise to indicate when the set is complete.
		paths: [],

		// path: String[] or Item[]
		//		Backward compatible singular variant of paths.
		path: [],

		// selectedItems: [readonly] Item[]
		//		The currently selected items in this tree.
		//		This property can only be set (via set('selectedItems', ...)) when that item is already
		//		visible in the tree.   (I.e. the tree has already been expanded to show that node.)
		//		Should generally use `paths` attribute to set the selected items instead.
		selectedItems: null,

		// selectedItem: [readonly] Item
		//		Backward compatible singular variant of selectedItems.
		selectedItem: null,

		// openOnClick: Boolean
		//		If true, clicking a folder node's label will open it, rather than calling onClick()
		openOnClick: false,

		// openOnDblClick: Boolean
		//		If true, double-clicking a folder node's label will open it, rather than calling onDblClick()
		openOnDblClick: false,

		templateString: treeTemplate,

		// persist: Boolean
		//		Enables/disables use of cookies for state saving.
		persist: false,

		// autoExpand: Boolean
		//		Fully expand the tree on load.   Overrides `persist`.
		autoExpand: false,

		// dndController: [protected] Function|String
		//		Class to use as as the dnd controller.  Specifying this class enables DnD.
		//		Generally you should specify this as dijit/tree/dndSource.
		//		Setting of dijit/tree/_dndSelector handles selection only (no actual DnD).
		dndController: _dndSelector,

		// parameters to pull off of the tree and pass on to the dndController as its params
		dndParams: ["onDndDrop", "itemCreator", "onDndCancel", "checkAcceptance", "checkItemAcceptance", "dragThreshold", "betweenThreshold"],

		//declare the above items so they can be pulled from the tree's markup

		// onDndDrop: [protected] Function
		//		Parameter to dndController, see `dijit/tree/dndSource.onDndDrop()`.
		//		Generally this doesn't need to be set.
		onDndDrop: null,

		itemCreator: null,
		/*=====
		itemCreator: function(nodes, target, source){
			// summary:
			//		Returns objects passed to `Tree.model.newItem()` based on DnD nodes
			//		dropped onto the tree.   Developer must override this method to enable
			//		dropping from external sources onto this Tree, unless the Tree.model's items
			//		happen to look like {id: 123, name: "Apple" } with no other attributes.
			//
			//		For each node in nodes[], which came from source, create a hash of name/value
			//		pairs to be passed to Tree.model.newItem().  Returns array of those hashes.
			// nodes: DomNode[]
			//		The DOMNodes dragged from the source container
			// target: DomNode
			//		The target TreeNode.rowNode
			// source: dojo/dnd/Source
			//		The source container the nodes were dragged from, perhaps another Tree or a plain dojo/dnd/Source
			// returns: Object[]
			//		Array of name/value hashes for each new item to be added to the Tree, like:
			// |	[
			// |		{ id: 123, label: "apple", foo: "bar" },
			// |		{ id: 456, label: "pear", zaz: "bam" }
			// |	]
			// tags:
			//		extension
			return [{}];
		},
		=====*/

		// onDndCancel: [protected] Function
		//		Parameter to dndController, see `dijit/tree/dndSource.onDndCancel()`.
		//		Generally this doesn't need to be set.
		onDndCancel: null,

		/*=====
		checkAcceptance: function(source, nodes){
			// summary:
			//		Checks if the Tree itself can accept nodes from this source
			// source: dijit/tree/dndSource
			//		The source which provides items
			// nodes: DOMNode[]
			//		Array of DOM nodes corresponding to nodes being dropped, dijitTreeRow nodes if
			//		source is a dijit/Tree.
			// tags:
			//		extension
			return true;	// Boolean
		},
		=====*/
		checkAcceptance: null,

		/*=====
		checkItemAcceptance: function(target, source, position){
			// summary:
			//		Stub function to be overridden if one wants to check for the ability to drop at the node/item level
			// description:
			//		In the base case, this is called to check if target can become a child of source.
			//		When betweenThreshold is set, position="before" or "after" means that we
			//		are asking if the source node can be dropped before/after the target node.
			// target: DOMNode
			//		The dijitTreeRoot DOM node inside of the TreeNode that we are dropping on to
			//		Use registry.getEnclosingWidget(target) to get the TreeNode.
			// source: dijit/tree/dndSource
			//		The (set of) nodes we are dropping
			// position: String
			//		"over", "before", or "after"
			// tags:
			//		extension
			return true;	// Boolean
		},
		=====*/
		checkItemAcceptance: null,

		// dragThreshold: Integer
		//		Number of pixels mouse moves before it's considered the start of a drag operation
		dragThreshold: 5,

		// betweenThreshold: Integer
		//		Set to a positive value to allow drag and drop "between" nodes.
		//
		//		If during DnD mouse is over a (target) node but less than betweenThreshold
		//		pixels from the bottom edge, dropping the the dragged node will make it
		//		the next sibling of the target node, rather than the child.
		//
		//		Similarly, if mouse is over a target node but less that betweenThreshold
		//		pixels from the top edge, dropping the dragged node will make it
		//		the target node's previous sibling rather than the target node's child.
		betweenThreshold: 0,

		// _nodePixelIndent: Integer
		//		Number of pixels to indent tree nodes (relative to parent node).
		//		Default is 19 but can be overridden by setting CSS class dijitTreeIndent
		//		and calling resize() or startup() on tree after it's in the DOM.
		_nodePixelIndent: 19,

		_publish: function(/*String*/ topicName, /*Object*/ message){
			// summary:
			//		Publish a message for this widget/topic
			topic.publish(this.id, lang.mixin({tree: this, event: topicName}, message || {}));	// publish
		},

		postMixInProperties: function(){
			this.tree = this;

			if(this.autoExpand){
				// There's little point in saving opened/closed state of nodes for a Tree
				// that initially opens all it's nodes.
				this.persist = false;
			}

			this._itemNodesMap = {};

			if(!this.cookieName && this.id){
				this.cookieName = this.id + "SaveStateCookie";
			}

			// Deferred that resolves when all the children have loaded.
			this.expandChildrenDeferred = new Deferred();

			// Promise that resolves when all pending operations complete.
			this.pendingCommandsPromise = this.expandChildrenDeferred.promise;

			this.inherited(arguments);
		},

		postCreate: function(){
			this._initState();

			// Catch events on TreeNodes
			var self = this;
			this.own(
				on(this.containerNode, on.selector(".dijitTreeNode", touch.enter), function(evt){
					self._onNodeMouseEnter(registry.byNode(this), evt);
				}),
				on(this.containerNode, on.selector(".dijitTreeNode", touch.leave), function(evt){
					self._onNodeMouseLeave(registry.byNode(this), evt);
				}),
				on(this.containerNode, on.selector(".dijitTreeRow", a11yclick.press), function(evt){
					self._onNodePress(registry.getEnclosingWidget(this), evt);
				}),
				on(this.containerNode, on.selector(".dijitTreeRow", a11yclick), function(evt){
					self._onClick(registry.getEnclosingWidget(this), evt);
				}),
				on(this.containerNode, on.selector(".dijitTreeRow", "dblclick"), function(evt){
					self._onDblClick(registry.getEnclosingWidget(this), evt);
				})
			);

			// Create glue between store and Tree, if not specified directly by user
			if(!this.model){
				this._store2model();
			}

			// monitor changes to items
			this.own(
				aspect.after(this.model, "onChange", lang.hitch(this, "_onItemChange"), true),
				aspect.after(this.model, "onChildrenChange", lang.hitch(this, "_onItemChildrenChange"), true),
				aspect.after(this.model, "onDelete", lang.hitch(this, "_onItemDelete"), true)
			);

			this.inherited(arguments);

			if(this.dndController){
				// TODO: remove string support in 2.0.
				if(lang.isString(this.dndController)){
					this.dndController = lang.getObject(this.dndController);
				}
				var params = {};
				for(var i = 0; i < this.dndParams.length; i++){
					if(this[this.dndParams[i]]){
						params[this.dndParams[i]] = this[this.dndParams[i]];
					}
				}
				this.dndController = new this.dndController(this, params);
			}

			this._load();

			// onLoadDeferred should fire when all commands that are part of initialization have completed.
			// It will include all the set("paths", ...) commands that happen during initialization.
			this.onLoadDeferred = shimmedPromise(this.pendingCommandsPromise);

			this.onLoadDeferred.then(lang.hitch(this, "onLoad"));
		},

		_store2model: function(){
			// summary:
			//		User specified a store&query rather than model, so create model from store/query
			this._v10Compat = true;
			kernel.deprecated("Tree: from version 2.0, should specify a model object rather than a store/query");

			var modelParams = {
				id: this.id + "_ForestStoreModel",
				store: this.store,
				query: this.query,
				childrenAttrs: this.childrenAttr
			};

			// Only override the model's mayHaveChildren() method if the user has specified an override
			if(this.params.mayHaveChildren){
				modelParams.mayHaveChildren = lang.hitch(this, "mayHaveChildren");
			}

			if(this.params.getItemChildren){
				modelParams.getChildren = lang.hitch(this, function(item, onComplete, onError){
					this.getItemChildren((this._v10Compat && item === this.model.root) ? null : item, onComplete, onError);
				});
			}
			this.model = new ForestStoreModel(modelParams);

			// For backwards compatibility, the visibility of the root node is controlled by
			// whether or not the user has specified a label
			this.showRoot = Boolean(this.label);
		},

		onLoad: function(){
			// summary:
			//		Called when tree finishes loading and expanding.
			// description:
			//		If persist == true the loading may encompass many levels of fetches
			//		from the data store, each asynchronous.   Waits for all to finish.
			// tags:
			//		callback
		},

		_load: function(){
			// summary:
			//		Initial load of the tree.
			//		Load root node (possibly hidden) and it's children.
			this.model.getRoot(
				lang.hitch(this, function(item){
					var rn = (this.rootNode = this.tree._createTreeNode({
						item: item,
						tree: this,
						isExpandable: true,
						label: this.label || this.getLabel(item),
						labelType: this.model.labelType || "text",
						textDir: this.textDir,
						indent: this.showRoot ? 0 : -1
					}));

					if(!this.showRoot){
						rn.rowNode.style.display = "none";
						// if root is not visible, move tree role to the invisible
						// root node's containerNode, see #12135
						this.domNode.setAttribute("role", "presentation");
						this.domNode.removeAttribute("aria-expanded");
						this.domNode.removeAttribute("aria-multiselectable");

						// move the aria-label or aria-labelledby to the element with the role
						if(this["aria-label"]){
							rn.containerNode.setAttribute("aria-label", this["aria-label"]);
							this.domNode.removeAttribute("aria-label");
						}else if(this["aria-labelledby"]){
							rn.containerNode.setAttribute("aria-labelledby", this["aria-labelledby"]);
							this.domNode.removeAttribute("aria-labelledby");
						}
						rn.labelNode.setAttribute("role", "presentation");
						rn.containerNode.setAttribute("role", "tree");
						rn.containerNode.setAttribute("aria-expanded", "true");
						rn.containerNode.setAttribute("aria-multiselectable", !this.dndController.singular);
					}else{
						this.domNode.setAttribute("aria-multiselectable", !this.dndController.singular);
						this.rootLoadingIndicator.style.display = "none";
					}

					this.containerNode.appendChild(rn.domNode);
					var identity = this.model.getIdentity(item);
					if(this._itemNodesMap[identity]){
						this._itemNodesMap[identity].push(rn);
					}else{
						this._itemNodesMap[identity] = [rn];
					}

					rn._updateLayout();		// sets "dijitTreeIsRoot" CSS classname

					// Load top level children, and if persist==true, all nodes that were previously opened
					this._expandNode(rn).then(lang.hitch(this, function(){
						// Then, select the nodes specified by params.paths[].

						this.rootLoadingIndicator.style.display = "none";
						this.expandChildrenDeferred.resolve(true);
					}));
				}),
				lang.hitch(this, function(err){
					console.error(this, ": error loading root: ", err);
				})
			);
		},

		getNodesByItem: function(/*Item or id*/ item){
			// summary:
			//		Returns all tree nodes that refer to an item
			// returns:
			//		Array of tree nodes that refer to passed item

			if(!item){
				return [];
			}
			var identity = lang.isString(item) ? item : this.model.getIdentity(item);
			// return a copy so widget don't get messed up by changes to returned array
			return [].concat(this._itemNodesMap[identity]);
		},

		_setSelectedItemAttr: function(/*Item or id*/ item){
			this.set('selectedItems', [item]);
		},

		_setSelectedItemsAttr: function(/*Items or ids*/ items){
			// summary:
			//		Select tree nodes related to passed items.
			//		WARNING: if model use multi-parented items or desired tree node isn't already loaded
			//		behavior is undefined. Use set('paths', ...) instead.
			var tree = this;
			return this.pendingCommandsPromise = this.pendingCommandsPromise.always(lang.hitch(this, function(){
				var identities = array.map(items, function(item){
					return (!item || lang.isString(item)) ? item : tree.model.getIdentity(item);
				});
				var nodes = [];
				array.forEach(identities, function(id){
					nodes = nodes.concat(tree._itemNodesMap[id] || []);
				});
				this.set('selectedNodes', nodes);
			}));
		},

		_setPathAttr: function(/*Item[]|String[]*/ path){
			// summary:
			//		Singular variant of _setPathsAttr
			if(path.length){
				return shimmedPromise(this.set("paths", [path]).then(function(paths){ return paths[0]; }));
			}else{
				// Empty list is interpreted as "select nothing"
				return shimmedPromise(this.set("paths", []).then(function(paths){ return paths[0]; }));
			}
		},

		_setPathsAttr: function(/*Item[][]|String[][]*/ paths){
			// summary:
			//		Select the tree nodes identified by passed paths.
			// paths:
			//		Array of arrays of items or item id's
			// returns:
			//		Promise to indicate when the set is complete

			var tree = this;

			function selectPath(path, nodes){
				// Traverse path, returning Promise for node at the end of the path.
				// The next path component should be among "nodes".
				var nextPath = path.shift();
				var nextNode = array.filter(nodes, function(node){
					return node.getIdentity() == nextPath;
				})[0];
				if(!!nextNode){
					if(path.length){
						return tree._expandNode(nextNode).then(function(){
							return selectPath(path, nextNode.getChildren());
						});
					}else{
						// Successfully reached the end of this path
						return nextNode;
					}
				}else{
					throw new Tree.PathError("Could not expand path at " + nextPath);
				}
			}

			// Let any previous set("path", ...) commands complete before this one starts.
			// TODO for 2.0: make the user do this wait themselves?
			return shimmedPromise(this.pendingCommandsPromise = this.pendingCommandsPromise.always(function(){
				// We may need to wait for some nodes to expand, so setting
				// each path will involve a Deferred. We bring those deferreds
				// together with a dojo/promise/all.
				return all(array.map(paths, function(path){
					// normalize path to use identity
					path = array.map(path, function(item){
						return lang.isString(item) ? item : tree.model.getIdentity(item);
					});

					if(path.length){
						return selectPath(path, [tree.rootNode]);
					}else{
						throw new Tree.PathError("Empty path");
					}
				}));
			}).then(function setNodes(newNodes){
				// After all expansion is finished, set the selection to last element from each path
				tree.set("selectedNodes", newNodes);
				return tree.paths;
			}));
		},

		_setSelectedNodeAttr: function(node){
			this.set('selectedNodes', [node]);
		},
		_setSelectedNodesAttr: function(nodes){
			// summary:
			//		Marks the specified TreeNodes as selected.
			// nodes: TreeNode[]
			//		TreeNodes to mark.
			this.dndController.setSelection(nodes);
		},


		expandAll: function(){
			// summary:
			//		Expand all nodes in the tree
			// returns:
			//		Promise that resolves when all nodes have expanded

			var _this = this;

			function expand(node){
				// Expand the node
				return _this._expandNode(node).then(function(){
					// When node has expanded, call expand() recursively on each non-leaf child
					var childBranches = array.filter(node.getChildren() || [], function(node){
						return node.isExpandable;
					});

					// And when all those recursive calls finish, signal that I'm finished
					return all(array.map(childBranches, expand));
				});
			}

			return shimmedPromise(expand(this.rootNode));
		},

		collapseAll: function(){
			// summary:
			//		Collapse all nodes in the tree
			// returns:
			//		Promise that resolves when all nodes have collapsed

			var _this = this;

			function collapse(node){
				// Collapse children first
				var childBranches = array.filter(node.getChildren() || [], function(node){
						return node.isExpandable;
					}),
					defs = all(array.map(childBranches, collapse));

				// And when all those recursive calls finish, collapse myself, unless I'm the invisible root node,
				// in which case collapseAll() is finished
				if(!node.isExpanded || (node == _this.rootNode && !_this.showRoot)){
					return defs;
				}else{
					// When node has collapsed, signal that call is finished
					return defs.then(function(){
						return _this._collapseNode(node);
					});
				}
			}

			return shimmedPromise(collapse(this.rootNode));
		},

		////////////// Data store related functions //////////////////////
		// These just get passed to the model; they are here for back-compat

		mayHaveChildren: function(/*dojo/data/Item*/ /*===== item =====*/){
			// summary:
			//		Deprecated.   This should be specified on the model itself.
			//
			//		Overridable function to tell if an item has or may have children.
			//		Controls whether or not +/- expando icon is shown.
			//		(For efficiency reasons we may not want to check if an element actually
			//		has children until user clicks the expando node)
			// tags:
			//		deprecated
		},

		getItemChildren: function(/*===== parentItem, onComplete =====*/){
			// summary:
			//		Deprecated.   This should be specified on the model itself.
			//
			//		Overridable function that return array of child items of given parent item,
			//		or if parentItem==null then return top items in tree
			// tags:
			//		deprecated
		},

		///////////////////////////////////////////////////////
		// Functions for converting an item to a TreeNode
		getLabel: function(/*dojo/data/Item*/ item){
			// summary:
			//		Overridable function to get the label for a tree node (given the item)
			// tags:
			//		extension
			return this.model.getLabel(item);	// String
		},

		getIconClass: function(/*dojo/data/Item*/ item, /*Boolean*/ opened){
			// summary:
			//		Overridable function to return CSS class name to display icon
			// tags:
			//		extension
			return (!item || this.model.mayHaveChildren(item)) ? (opened ? "dijitFolderOpened" : "dijitFolderClosed") : "dijitLeaf"
		},

		getLabelClass: function(/*===== item, opened =====*/){
			// summary:
			//		Overridable function to return CSS class name to display label
			// item: dojo/data/Item
			// opened: Boolean
			// returns: String
			//		CSS class name
			// tags:
			//		extension
		},

		getRowClass: function(/*===== item, opened =====*/){
			// summary:
			//		Overridable function to return CSS class name to display row
			// item: dojo/data/Item
			// opened: Boolean
			// returns: String
			//		CSS class name
			// tags:
			//		extension
		},

		getIconStyle: function(/*===== item, opened =====*/){
			// summary:
			//		Overridable function to return CSS styles to display icon
			// item: dojo/data/Item
			// opened: Boolean
			// returns: Object
			//		Object suitable for input to dojo.style() like {backgroundImage: "url(...)"}
			// tags:
			//		extension
		},

		getLabelStyle: function(/*===== item, opened =====*/){
			// summary:
			//		Overridable function to return CSS styles to display label
			// item: dojo/data/Item
			// opened: Boolean
			// returns:
			//		Object suitable for input to dojo.style() like {color: "red", background: "green"}
			// tags:
			//		extension
		},

		getRowStyle: function(/*===== item, opened =====*/){
			// summary:
			//		Overridable function to return CSS styles to display row
			// item: dojo/data/Item
			// opened: Boolean
			// returns:
			//		Object suitable for input to dojo.style() like {background-color: "#bbb"}
			// tags:
			//		extension
		},

		getTooltip: function(/*dojo/data/Item*/ /*===== item =====*/){
			// summary:
			//		Overridable function to get the tooltip for a tree node (given the item)
			// tags:
			//		extension
			return "";	// String
		},

		/////////// Keyboard and Mouse handlers ////////////////////


		_onDownArrow: function(/*Event*/ evt, /*TreeNode*/ node){
			// summary:
			//		down arrow pressed; get next visible node, set focus there

			var nextNode = this._getNext(node);
			if(nextNode && nextNode.isTreeNode){
				this.focusNode(nextNode);
			}
		},

		_onUpArrow: function(/*Event*/ evt, /*TreeNode*/ node){
			// summary:
			//		Up arrow pressed; move to previous visible node

			// if younger siblings
			var previousSibling = node.getPreviousSibling();
			if(previousSibling){
				node = previousSibling;
				// if the previous node is expanded, dive in deep
				while(node.isExpandable && node.isExpanded && node.hasChildren()){
					// move to the last child
					var children = node.getChildren();
					node = children[children.length - 1];
				}
			}else{
				// if this is the first child, return the parent
				// unless the parent is the root of a tree with a hidden root
				var parent = node.getParent();
				if(!(!this.showRoot && parent === this.rootNode)){
					node = parent;
				}
			}

			if(node && node.isTreeNode){
				this.focusNode(node);
			}
		},

		_onRightArrow: function(/*Event*/ evt, /*TreeNode*/ node){
			// summary:
			//		Right arrow pressed; go to child node

			// if not expanded, expand, else move to 1st child
			if(node.isExpandable && !node.isExpanded){
				this._expandNode(node);
			}else if(node.hasChildren()){
				node = node.getChildren()[0];
				if(node && node.isTreeNode){
					this.focusNode(node);
				}
			}
		},

		_onLeftArrow: function(/*Event*/ evt, /*TreeNode*/ node){
			// summary:
			//		Left arrow pressed.
			//		If not collapsed, collapse, else move to parent.

			if(node.isExpandable && node.isExpanded){
				this._collapseNode(node);
			}else{
				var parent = node.getParent();
				if(parent && parent.isTreeNode && !(!this.showRoot && parent === this.rootNode)){
					this.focusNode(parent);
				}
			}
		},

		focusLastChild: function(){
			// summary:
			//		End key pressed; go to last visible node.

			var node = this._getLast();
			if(node && node.isTreeNode){
				this.focusNode(node);
			}
		},

		_getFirst: function(){
			// summary:
			//		Returns the first child.
			// tags:
			//		abstract extension
			return this.showRoot ? this.rootNode : this.rootNode.getChildren()[0];
		},

		_getLast: function(){
			// summary:
			//		Returns the last descendant.
			// tags:
			//		abstract extension
			var node = this.rootNode;
			while(node.isExpanded){
				var c = node.getChildren();
				if(!c.length){
					break;
				}
				node = c[c.length - 1];
			}
			return node;
		},

		// Tree only searches forward so dir parameter is unused
		_getNext: function(node){
			// summary:
			//		Returns the next descendant, compared to "child".
			// node: Widget
			//		The current widget
			// tags:
			//		abstract extension

			if(node.isExpandable && node.isExpanded && node.hasChildren()){
				// if this is an expanded node, get the first child
				return node.getChildren()[0];		// TreeNode
			}else{
				// find a parent node with a sibling
				while(node && node.isTreeNode){
					var returnNode = node.getNextSibling();
					if(returnNode){
						return returnNode;		// TreeNode
					}
					node = node.getParent();
				}
				return null;
			}
		},

		// Implement _KeyNavContainer.childSelector, to identify which nodes are navigable
		childSelector: ".dijitTreeRow",

		isExpandoNode: function(node, widget){
			// summary:
			//		check whether a dom node is the expandoNode for a particular TreeNode widget
			return dom.isDescendant(node, widget.expandoNode) || dom.isDescendant(node, widget.expandoNodeText);
		},

		_onNodePress: function(/*TreeNode*/ nodeWidget, /*Event*/ e){
			// Touching a node should focus it, even if you touch the expando node or the edges rather than the label.
			// Especially important to avoid _KeyNavMixin._onContainerFocus() causing the previously focused TreeNode
			// to get focus
			nodeWidget.focus();
		},

		__click: function(/*TreeNode*/ nodeWidget, /*Event*/ e, /*Boolean*/doOpen, /*String*/func){
			var domElement = e.target,
				isExpandoClick = this.isExpandoNode(domElement, nodeWidget);

			if(nodeWidget.isExpandable && (doOpen || isExpandoClick)){
				// expando node was clicked, or label of a folder node was clicked; open it
				this._onExpandoClick({node: nodeWidget});
			}else{
				this._publish("execute", { item: nodeWidget.item, node: nodeWidget, evt: e });
				this[func](nodeWidget.item, nodeWidget, e);
				this.focusNode(nodeWidget);
			}
			e.stopPropagation();
			e.preventDefault();
		},
		_onClick: function(/*TreeNode*/ nodeWidget, /*Event*/ e){
			// summary:
			//		Translates click events into commands for the controller to process
			this.__click(nodeWidget, e, this.openOnClick, 'onClick');
		},
		_onDblClick: function(/*TreeNode*/ nodeWidget, /*Event*/ e){
			// summary:
			//		Translates double-click events into commands for the controller to process
			this.__click(nodeWidget, e, this.openOnDblClick, 'onDblClick');
		},

		_onExpandoClick: function(/*Object*/ message){
			// summary:
			//		User clicked the +/- icon; expand or collapse my children.
			var node = message.node;

			// If we are collapsing, we might be hiding the currently focused node.
			// Also, clicking the expando node might have erased focus from the current node.
			// For simplicity's sake just focus on the node with the expando.
			this.focusNode(node);

			if(node.isExpanded){
				this._collapseNode(node);
			}else{
				this._expandNode(node);
			}
		},

		onClick: function(/*===== item, node, evt =====*/){
			// summary:
			//		Callback when a tree node is clicked
			// item: Object
			//		Object from the dojo/store corresponding to this TreeNode
			// node: TreeNode
			//		The TreeNode itself
			// evt: Event
			//		The event
			// tags:
			//		callback
		},
		onDblClick: function(/*===== item, node, evt =====*/){
			// summary:
			//		Callback when a tree node is double-clicked
			// item: Object
			//		Object from the dojo/store corresponding to this TreeNode
			// node: TreeNode
			//		The TreeNode itself
			// evt: Event
			//		The event
			// tags:
			//		callback
		},
		onOpen: function(/*===== item, node =====*/){
			// summary:
			//		Callback when a node is opened
			// item: dojo/data/Item
			// node: TreeNode
			// tags:
			//		callback
		},
		onClose: function(/*===== item, node =====*/){
			// summary:
			//		Callback when a node is closed
			// item: Object
			//		Object from the dojo/store corresponding to this TreeNode
			// node: TreeNode
			//		The TreeNode itself
			// tags:
			//		callback
		},

		_getNextNode: function(node){
			// summary:
			//		Get next visible node

			kernel.deprecated(this.declaredClass + "::_getNextNode(node) is deprecated. Use _getNext(node) instead.", "", "2.0");
			return this._getNext(node);
		},

		_getRootOrFirstNode: function(){
			// summary:
			//		Get first visible node
			kernel.deprecated(this.declaredClass + "::_getRootOrFirstNode() is deprecated. Use _getFirst() instead.", "", "2.0");
			return this._getFirst();
		},

		_collapseNode: function(/*TreeNode*/ node){
			// summary:
			//		Called when the user has requested to collapse the node
			// returns:
			//		Promise that resolves when the node has finished closing

			if(node._expandNodeDeferred){
				delete node._expandNodeDeferred;
			}

			if(node.state == "Loading"){
				// ignore clicks while we are in the process of loading data
				return;
			}

			if(node.isExpanded){
				var ret = node.collapse();

				this.onClose(node.item, node);
				this._state(node, false);

				this._startPaint(ret);	// after this finishes, need to reset widths of TreeNodes

				return ret;
			}
		},

		_expandNode: function(/*TreeNode*/ node){
			// summary:
			//		Called when the user has requested to expand the node
			// returns:
			//		Promise that resolves when the node is loaded and opened and (if persist=true) all it's descendants
			//		that were previously opened too

			if(node._expandNodeDeferred){
				// there's already an expand in progress, or completed, so just return
				return node._expandNodeDeferred;	// dojo/Deferred
			}

			var model = this.model,
				item = node.item,
				_this = this;

			// Load data if it's not already loaded
			if(!node._loadDeferred){
				// need to load all the children before expanding
				node.markProcessing();

				// Setup deferred to signal when the load and expand are finished.
				// Save that deferred in this._expandDeferred as a flag that operation is in progress.
				node._loadDeferred = new Deferred();

				// Get the children
				model.getChildren(
					item,
					function(items){
						node.unmarkProcessing();

						// Display the children and also start expanding any children that were previously expanded
						// (if this.persist == true).   The returned Deferred will fire when those expansions finish.
						node.setChildItems(items).then(function(){
							node._loadDeferred.resolve(items);
						});
					},
					function(err){
						console.error(_this, ": error loading " + node.label + " children: ", err);
						node._loadDeferred.reject(err);
					}
				);
			}

			// Expand the node after data has loaded
			var def = node._loadDeferred.then(lang.hitch(this, function(){
				var def2 = node.expand();

				// seems like these should delayed until node.expand() completes, but left here for back-compat about
				// when this.isOpen flag gets set (ie, at the beginning of the animation)
				this.onOpen(node.item, node);
				this._state(node, true);

				return def2;
			}));

			this._startPaint(def);	// after this finishes, need to reset widths of TreeNodes

			return def;	// dojo/promise/Promise
		},

		////////////////// Miscellaneous functions ////////////////

		focusNode: function(/* _tree.Node */ node){
			// summary:
			//		Focus on the specified node (which must be visible)
			// tags:
			//		protected

			this.focusChild(node);
		},

		_onNodeMouseEnter: function(/*dijit/_WidgetBase*/ /*===== node =====*/){
			// summary:
			//		Called when mouse is over a node (onmouseenter event),
			//		this is monitored by the DND code
		},

		_onNodeMouseLeave: function(/*dijit/_WidgetBase*/ /*===== node =====*/){
			// summary:
			//		Called when mouse leaves a node (onmouseleave event),
			//		this is monitored by the DND code
		},

		//////////////// Events from the model //////////////////////////

		_onItemChange: function(/*Item*/ item){
			// summary:
			//		Processes notification of a change to an item's scalar values like label
			var model = this.model,
				identity = model.getIdentity(item),
				nodes = this._itemNodesMap[identity];

			if(nodes){
				var label = this.getLabel(item),
					tooltip = this.getTooltip(item);
				array.forEach(nodes, function(node){
					node.set({
						item: item, // theoretically could be new JS Object representing same item
						label: label,
						tooltip: tooltip
					});
					node._updateItemClasses(item);
				});
			}
		},

		_onItemChildrenChange: function(/*dojo/data/Item*/ parent, /*dojo/data/Item[]*/ newChildrenList){
			// summary:
			//		Processes notification of a change to an item's children
			var model = this.model,
				identity = model.getIdentity(parent),
				parentNodes = this._itemNodesMap[identity];

			if(parentNodes){
				array.forEach(parentNodes, function(parentNode){
					parentNode.setChildItems(newChildrenList);
				});
			}
		},

		_onItemDelete: function(/*Item*/ item){
			// summary:
			//		Processes notification of a deletion of an item.
			//		Not called from new dojo.store interface but there's cleanup code in setChildItems() instead.

			var model = this.model,
				identity = model.getIdentity(item),
				nodes = this._itemNodesMap[identity];

			if(nodes){
				array.forEach(nodes, function(node){
					// Remove node from set of selected nodes (if it's selected)
					this.dndController.removeTreeNode(node);

					var parent = node.getParent();
					if(parent){
						// if node has not already been orphaned from a _onSetItem(parent, "children", ..) call...
						parent.removeChild(node);
					}
					node.destroyRecursive();
				}, this);
				delete this._itemNodesMap[identity];
			}
		},

		/////////////// Miscellaneous funcs

		_initState: function(){
			// summary:
			//		Load in which nodes should be opened automatically
			this._openedNodes = {};
			if(this.persist && this.cookieName){
				var oreo = cookie(this.cookieName);
				if(oreo){
					array.forEach(oreo.split(','), function(item){
						this._openedNodes[item] = true;
					}, this);
				}
			}
		},

		_state: function(node, expanded){
			// summary:
			//		Query or set expanded state for an node
			if(!this.persist){
				return false;
			}
			var path = array.map(node.getTreePath(),function(item){
				return this.model.getIdentity(item);
			}, this).join("/");
			if(arguments.length === 1){
				return this._openedNodes[path];
			}else{
				if(expanded){
					this._openedNodes[path] = true;
				}else{
					delete this._openedNodes[path];
				}
				this._saveExpandedNodes();
			}
		},

		_saveExpandedNodes: function(){
			if(this.persist && this.cookieName){
				var ary = [];
				for(var id in this._openedNodes){
					ary.push(id);
				}
				cookie(this.cookieName, ary.join(","), {expires: 365});
			}
		},

		destroy: function(){
			if(this._curSearch){
				this._curSearch.timer.remove();
				delete this._curSearch;
			}
			if(this.rootNode){
				this.rootNode.destroyRecursive();
			}
			if(this.dndController && !lang.isString(this.dndController)){
				this.dndController.destroy();
			}
			this.rootNode = null;
			this.inherited(arguments);
		},

		destroyRecursive: function(){
			// A tree is treated as a leaf, not as a node with children (like a grid),
			// but defining destroyRecursive for back-compat.
			this.destroy();
		},

		resize: function(changeSize){
			if(changeSize){
				domGeometry.setMarginBox(this.domNode, changeSize);
			}

			// The main JS sizing involved w/tree is the indentation, which is specified
			// in CSS and read in through this dummy indentDetector node (tree must be
			// visible and attached to the DOM to read this).
			// If the Tree is hidden domGeometry.position(this.tree.indentDetector).w will return 0, in which case just
			// keep the default value.
			this._nodePixelIndent = domGeometry.position(this.tree.indentDetector).w || this._nodePixelIndent;

			// resize() may be called before this.rootNode is created, so wait until it's available
			this.expandChildrenDeferred.then(lang.hitch(this, function(){
				// If tree has already loaded, then reset indent for all the nodes
				this.rootNode.set('indent', this.showRoot ? 0 : -1);

				// Also, adjust widths of all rows to match width of Tree
				this._adjustWidths();
			}));
		},

		_outstandingPaintOperations: 0,
		_startPaint: function(/*Promise|Boolean*/ p){
			// summary:
			//		Called at the start of an operation that will change what's displayed.
			// p:
			//		Promise that tells when the operation will complete.  Alternately, if it's just a Boolean, it signifies
			//		that the operation was synchronous, and already completed.

			this._outstandingPaintOperations++;
			if(this._adjustWidthsTimer){
				this._adjustWidthsTimer.remove();
				delete this._adjustWidthsTimer;
			}

			var oc = lang.hitch(this, function(){
				this._outstandingPaintOperations--;

				if(this._outstandingPaintOperations <= 0 && !this._adjustWidthsTimer && this._started){
					// Use defer() to avoid a width adjustment when another operation will immediately follow,
					// such as a sequence of opening a node, then it's children, then it's grandchildren, etc.
					this._adjustWidthsTimer = this.defer("_adjustWidths");
				}
			});
			when(p, oc, oc);
		},

		_adjustWidths: function(){
			// summary:
			//		Size container to match widest TreeNode, so that highlighting with scrolling works (#13141, #16132)

			if(this._adjustWidthsTimer){
				this._adjustWidthsTimer.remove();
				delete this._adjustWidthsTimer;
			}

			this.containerNode.style.width = "auto";
			this.containerNode.style.width = this.domNode.scrollWidth > this.domNode.offsetWidth ? "auto" : "100%";
		},

		_createTreeNode: function(/*Object*/ args){
			// summary:
			//		creates a TreeNode
			// description:
			//		Developers can override this method to define their own TreeNode class;
			//		However it will probably be removed in a future release in favor of a way
			//		of just specifying a widget for the label, rather than one that contains
			//		the children too.
			return new TreeNode(args);
		},

		focus: function(){
			// summary:
			//		Default focus() implementation: focus the previously focused child, or first child.
			//		Some applications may want to change this method to focus the [first] selected child.

			if(this.lastFocusedChild){
				this.focusNode(this.lastFocusedChild);
			}else{
				this.focusFirstChild();
			}
		}
	});

	if(has("dojo-bidi")){
		Tree.extend({
			_setTextDirAttr: function(textDir){
				if(textDir && this.textDir != textDir){
					this._set("textDir", textDir);
					this.rootNode.set("textDir", textDir);
				}
			}
		});
	}

	Tree.PathError = createError("TreePathError");
	Tree._TreeNode = TreeNode;	// for monkey patching or creating subclasses of TreeNode

	return Tree;
});

},
'dojo/cookie':function(){
define(["./_base/kernel", "./regexp"], function(dojo, regexp){

// module:
//		dojo/cookie

/*=====
var __cookieProps = {
	// expires: Date|String|Number?
	//		If a number, the number of days from today at which the cookie
	//		will expire. If a date, the date past which the cookie will expire.
	//		If expires is in the past, the cookie will be deleted.
	//		If expires is omitted or is 0, the cookie will expire when the browser closes.
	// path: String?
	//		The path to use for the cookie.
	// domain: String?
	//		The domain to use for the cookie.
	// secure: Boolean?
	//		Whether to only send the cookie on secure connections
};
=====*/


dojo.cookie = function(/*String*/name, /*String?*/ value, /*__cookieProps?*/ props){
	// summary:
	//		Get or set a cookie.
	// description:
	//		If one argument is passed, returns the value of the cookie
	//		For two or more arguments, acts as a setter.
	// name:
	//		Name of the cookie
	// value:
	//		Value for the cookie
	// props:
	//		Properties for the cookie
	// example:
	//		set a cookie with the JSON-serialized contents of an object which
	//		will expire 5 days from now:
	//	|	require(["dojo/cookie", "dojo/json"], function(cookie, json){
	//	|		cookie("configObj", json.stringify(config, {expires: 5 }));
	//	|	});
	//
	// example:
	//		de-serialize a cookie back into a JavaScript object:
	//	|	require(["dojo/cookie", "dojo/json"], function(cookie, json){
	//	|		config = json.parse(cookie("configObj"));
	//	|	});
	//
	// example:
	//		delete a cookie:
	//	|	require(["dojo/cookie"], function(cookie){
	//	|		cookie("configObj", null, {expires: -1});
	//	|	});
	var c = document.cookie, ret;
	if(arguments.length == 1){
		var matches = c.match(new RegExp("(?:^|; )" + regexp.escapeString(name) + "=([^;]*)"));
		ret = matches ? decodeURIComponent(matches[1]) : undefined; 
	}else{
		props = props || {};
// FIXME: expires=0 seems to disappear right away, not on close? (FF3)  Change docs?
		var exp = props.expires;
		if(typeof exp == "number"){
			var d = new Date();
			d.setTime(d.getTime() + exp*24*60*60*1000);
			exp = props.expires = d;
		}
		if(exp && exp.toUTCString){ props.expires = exp.toUTCString(); }

		value = encodeURIComponent(value);
		var updatedCookie = name + "=" + value, propName;
		for(propName in props){
			updatedCookie += "; " + propName;
			var propValue = props[propName];
			if(propValue !== true){ updatedCookie += "=" + propValue; }
		}
		document.cookie = updatedCookie;
	}
	return ret; // String|undefined
};

dojo.cookie.isSupported = function(){
	// summary:
	//		Use to determine if the current browser supports cookies or not.
	//
	//		Returns true if user allows cookies.
	//		Returns false if user doesn't allow cookies.

	if(!("cookieEnabled" in navigator)){
		this("__djCookieTest__", "CookiesAllowed");
		navigator.cookieEnabled = this("__djCookieTest__") == "CookiesAllowed";
		if(navigator.cookieEnabled){
			this("__djCookieTest__", "", {expires: -1});
		}
	}
	return navigator.cookieEnabled;
};

return dojo.cookie;
});

},
'dojo/regexp':function(){
define(["./_base/kernel", "./_base/lang"], function(dojo, lang){

// module:
//		dojo/regexp

var regexp = {
	// summary:
	//		Regular expressions and Builder resources
};
lang.setObject("dojo.regexp", regexp);

regexp.escapeString = function(/*String*/str, /*String?*/except){
	// summary:
	//		Adds escape sequences for special characters in regular expressions
	// except:
	//		a String with special characters to be left unescaped

	return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(ch){
		if(except && except.indexOf(ch) != -1){
			return ch;
		}
		return "\\" + ch;
	}); // String
};

regexp.buildGroupRE = function(/*Object|Array*/arr, /*Function*/re, /*Boolean?*/nonCapture){
	// summary:
	//		Builds a regular expression that groups subexpressions
	// description:
	//		A utility function used by some of the RE generators. The
	//		subexpressions are constructed by the function, re, in the second
	//		parameter.  re builds one subexpression for each elem in the array
	//		a, in the first parameter. Returns a string for a regular
	//		expression that groups all the subexpressions.
	// arr:
	//		A single value or an array of values.
	// re:
	//		A function. Takes one parameter and converts it to a regular
	//		expression.
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression. Defaults to false

	// case 1: a is a single value.
	if(!(arr instanceof Array)){
		return re(arr); // String
	}

	// case 2: a is an array
	var b = [];
	for(var i = 0; i < arr.length; i++){
		// convert each elem to a RE
		b.push(re(arr[i]));
	}

	 // join the REs as alternatives in a RE group.
	return regexp.group(b.join("|"), nonCapture); // String
};

regexp.group = function(/*String*/expression, /*Boolean?*/nonCapture){
	// summary:
	//		adds group match to expression
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression.
	return "(" + (nonCapture ? "?:":"") + expression + ")"; // String
};

return regexp;
});

},
'dojo/promise/all':function(){
define([
	"../_base/array",
	"../Deferred",
	"../when"
], function(array, Deferred, when){
	"use strict";

	// module:
	//		dojo/promise/all

	var some = array.some;

	return function all(objectOrArray){
		// summary:
		//		Takes multiple promises and returns a new promise that is fulfilled
		//		when all promises have been fulfilled.
		// description:
		//		Takes multiple promises and returns a new promise that is fulfilled
		//		when all promises have been fulfilled. If one of the promises is rejected,
		//		the returned promise is also rejected. Canceling the returned promise will
		//		*not* cancel any passed promises.
		// objectOrArray: Object|Array?
		//		The promise will be fulfilled with a list of results if invoked with an
		//		array, or an object of results when passed an object (using the same
		//		keys). If passed neither an object or array it is resolved with an
		//		undefined value.
		// returns: dojo/promise/Promise

		var object, array;
		if(objectOrArray instanceof Array){
			array = objectOrArray;
		}else if(objectOrArray && typeof objectOrArray === "object"){
			object = objectOrArray;
		}

		var results;
		var keyLookup = [];
		if(object){
			array = [];
			for(var key in object){
				if(Object.hasOwnProperty.call(object, key)){
					keyLookup.push(key);
					array.push(object[key]);
				}
			}
			results = {};
		}else if(array){
			results = [];
		}

		if(!array || !array.length){
			return new Deferred().resolve(results);
		}

		var deferred = new Deferred();
		deferred.promise.always(function(){
			results = keyLookup = null;
		});
		var waiting = array.length;
		some(array, function(valueOrPromise, index){
			if(!object){
				keyLookup.push(index);
			}
			when(valueOrPromise, function(value){
				if(!deferred.isFulfilled()){
					results[keyLookup[index]] = value;
					if(--waiting === 0){
						deferred.resolve(results);
					}
				}
			}, deferred.reject);
			return deferred.isFulfilled();
		});
		return deferred.promise;	// dojo/promise/Promise
	};
});

},
'dojo/fx':function(){
define([
	"./_base/lang",
	"./Evented",
	"./_base/kernel",
	"./_base/array",
	"./aspect",
	"./_base/fx",
	"./dom",
	"./dom-style",
	"./dom-geometry",
	"./ready",
	"require" // for context sensitive loading of Toggler
], function(lang, Evented, dojo, arrayUtil, aspect, baseFx, dom, domStyle, geom, ready, require){

	// module:
	//		dojo/fx
	
	// For back-compat, remove in 2.0.
	if(!dojo.isAsync){
		ready(0, function(){
			var requires = ["./fx/Toggler"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	var coreFx = dojo.fx = {
		// summary:
		//		Effects library on top of Base animations
	};

	var _baseObj = {
			_fire: function(evt, args){
				if(this[evt]){
					this[evt].apply(this, args||[]);
				}
				return this;
			}
		};

	var _chain = function(animations){
		this._index = -1;
		this._animations = animations||[];
		this._current = this._onAnimateCtx = this._onEndCtx = null;

		this.duration = 0;
		arrayUtil.forEach(this._animations, function(a){
			this.duration += a.duration;
			if(a.delay){ this.duration += a.delay; }
		}, this);
	};
	_chain.prototype = new Evented();
	lang.extend(_chain, {
		_onAnimate: function(){
			this._fire("onAnimate", arguments);
		},
		_onEnd: function(){
			this._onAnimateCtx.remove();
			this._onEndCtx.remove();
			this._onAnimateCtx = this._onEndCtx = null;
			if(this._index + 1 == this._animations.length){
				this._fire("onEnd");
			}else{
				// switch animations
				this._current = this._animations[++this._index];
				this._onAnimateCtx = aspect.after(this._current, "onAnimate", lang.hitch(this, "_onAnimate"), true);
				this._onEndCtx = aspect.after(this._current, "onEnd", lang.hitch(this, "_onEnd"), true);
				this._current.play(0, true);
			}
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			if(!this._current){ this._current = this._animations[this._index = 0]; }
			if(!gotoStart && this._current.status() == "playing"){ return this; }
			var beforeBegin = aspect.after(this._current, "beforeBegin", lang.hitch(this, function(){
					this._fire("beforeBegin");
				}), true),
				onBegin = aspect.after(this._current, "onBegin", lang.hitch(this, function(arg){
					this._fire("onBegin", arguments);
				}), true),
				onPlay = aspect.after(this._current, "onPlay", lang.hitch(this, function(arg){
					this._fire("onPlay", arguments);
					beforeBegin.remove();
					onBegin.remove();
					onPlay.remove();
				}));
			if(this._onAnimateCtx){
				this._onAnimateCtx.remove();
			}
			this._onAnimateCtx = aspect.after(this._current, "onAnimate", lang.hitch(this, "_onAnimate"), true);
			if(this._onEndCtx){
				this._onEndCtx.remove();
			}
			this._onEndCtx = aspect.after(this._current, "onEnd", lang.hitch(this, "_onEnd"), true);
			this._current.play.apply(this._current, arguments);
			return this;
		},
		pause: function(){
			if(this._current){
				var e = aspect.after(this._current, "onPause", lang.hitch(this, function(arg){
						this._fire("onPause", arguments);
						e.remove();
					}), true);
				this._current.pause();
			}
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			this.pause();
			var offset = this.duration * percent;
			this._current = null;
			arrayUtil.some(this._animations, function(a){
				if(a.duration <= offset){
					this._current = a;
					return true;
				}
				offset -= a.duration;
				return false;
			});
			if(this._current){
				this._current.gotoPercent(offset / this._current.duration, andPlay);
			}
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			if(this._current){
				if(gotoEnd){
					for(; this._index + 1 < this._animations.length; ++this._index){
						this._animations[this._index].stop(true);
					}
					this._current = this._animations[this._index];
				}
				var e = aspect.after(this._current, "onStop", lang.hitch(this, function(arg){
						this._fire("onStop", arguments);
						e.remove();
					}), true);
				this._current.stop();
			}
			return this;
		},
		status: function(){
			return this._current ? this._current.status() : "stopped";
		},
		destroy: function(){
			if(this._onAnimateCtx){ this._onAnimateCtx.remove(); }
			if(this._onEndCtx){ this._onEndCtx.remove(); }
		}
	});
	lang.extend(_chain, _baseObj);

	coreFx.chain = function(/*dojo/_base/fx.Animation[]*/ animations){
		// summary:
		//		Chain a list of `dojo.Animation`s to run in sequence
		//
		// description:
		//		Return a `dojo.Animation` which will play all passed
		//		`dojo.Animation` instances in sequence, firing its own
		//		synthesized events simulating a single animation. (eg:
		//		onEnd of this animation means the end of the chain,
		//		not the individual animations within)
		//
		// example:
		//	Once `node` is faded out, fade in `otherNode`
		//	|	fx.chain([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		return new _chain(animations); // dojo/_base/fx.Animation
	};

	var _combine = function(animations){
		this._animations = animations||[];
		this._connects = [];
		this._finished = 0;

		this.duration = 0;
		arrayUtil.forEach(animations, function(a){
			var duration = a.duration;
			if(a.delay){ duration += a.delay; }
			if(this.duration < duration){ this.duration = duration; }
			this._connects.push(aspect.after(a, "onEnd", lang.hitch(this, "_onEnd"), true));
		}, this);

		this._pseudoAnimation = new baseFx.Animation({curve: [0, 1], duration: this.duration});
		var self = this;
		arrayUtil.forEach(["beforeBegin", "onBegin", "onPlay", "onAnimate", "onPause", "onStop", "onEnd"],
			function(evt){
				self._connects.push(aspect.after(self._pseudoAnimation, evt,
					function(){ self._fire(evt, arguments); },
				true));
			}
		);
	};
	lang.extend(_combine, {
		_doAction: function(action, args){
			arrayUtil.forEach(this._animations, function(a){
				a[action].apply(a, args);
			});
			return this;
		},
		_onEnd: function(){
			if(++this._finished > this._animations.length){
				this._fire("onEnd");
			}
		},
		_call: function(action, args){
			var t = this._pseudoAnimation;
			t[action].apply(t, args);
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			this._finished = 0;
			this._doAction("play", arguments);
			this._call("play", arguments);
			return this;
		},
		pause: function(){
			this._doAction("pause", arguments);
			this._call("pause", arguments);
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			var ms = this.duration * percent;
			arrayUtil.forEach(this._animations, function(a){
				a.gotoPercent(a.duration < ms ? 1 : (ms / a.duration), andPlay);
			});
			this._call("gotoPercent", arguments);
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			this._doAction("stop", arguments);
			this._call("stop", arguments);
			return this;
		},
		status: function(){
			return this._pseudoAnimation.status();
		},
		destroy: function(){
			arrayUtil.forEach(this._connects, function(handle){
				handle.remove();
			});
		}
	});
	lang.extend(_combine, _baseObj);

	coreFx.combine = function(/*dojo/_base/fx.Animation[]*/ animations){
		// summary:
		//		Combine a list of `dojo.Animation`s to run in parallel
		//
		// description:
		//		Combine an array of `dojo.Animation`s to run in parallel,
		//		providing a new `dojo.Animation` instance encompasing each
		//		animation, firing standard animation events.
		//
		// example:
		//	Fade out `node` while fading in `otherNode` simultaneously
		//	|	fx.combine([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		// example:
		//	When the longest animation ends, execute a function:
		//	|	var anim = fx.combine([
		//	|		dojo.fadeIn({ node: n, duration:700 }),
		//	|		dojo.fadeOut({ node: otherNode, duration: 300 })
		//	|	]);
		//	|	aspect.after(anim, "onEnd", function(){
		//	|		// overall animation is done.
		//	|	}, true);
		//	|	anim.play(); // play the animation
		//
		return new _combine(animations); // dojo/_base/fx.Animation
	};

	coreFx.wipeIn = function(/*Object*/ args){
		// summary:
		//		Expand a node to it's natural height.
		//
		// description:
		//		Returns an animation that will expand the
		//		node defined in 'args' object from it's current height to
		//		it's natural height (with no scrollbar).
		//		Node must have no margin/border/padding.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	fx.wipeIn({
		//	|		node:"someId"
		//	|	}).play()
		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					// wrapped in functions so we wait till the last second to query (in case value has changed)
					start: function(){
						// start at current [computed] height, but use 1px rather than 0
						// because 0 causes IE to display the whole panel
						o = s.overflow;
						s.overflow = "hidden";
						if(s.visibility == "hidden" || s.display == "none"){
							s.height = "1px";
							s.display = "";
							s.visibility = "";
							return 1;
						}else{
							var height = domStyle.get(node, "height");
							return Math.max(height, 1);
						}
					},
					end: function(){
						return node.scrollHeight;
					}
				}
			}
		}, args));

		var fini = function(){
			s.height = "auto";
			s.overflow = o;
		};
		aspect.after(anim, "onStop", fini, true);
		aspect.after(anim, "onEnd", fini, true);

		return anim; // dojo/_base/fx.Animation
	};

	coreFx.wipeOut = function(/*Object*/ args){
		// summary:
		//		Shrink a node to nothing and hide it.
		//
		// description:
		//		Returns an animation that will shrink node defined in "args"
		//		from it's current height to 1px, and then hide it.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	fx.wipeOut({ node:"someId" }).play()

		var node = args.node = dom.byId(args.node), s = node.style, o;

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				height: {
					end: 1 // 0 causes IE to display the whole panel
				}
			}
		}, args));

		aspect.after(anim, "beforeBegin", function(){
			o = s.overflow;
			s.overflow = "hidden";
			s.display = "";
		}, true);
		var fini = function(){
			s.overflow = o;
			s.height = "auto";
			s.display = "none";
		};
		aspect.after(anim, "onStop", fini, true);
		aspect.after(anim, "onEnd", fini, true);

		return anim; // dojo/_base/fx.Animation
	};

	coreFx.slideTo = function(/*Object*/ args){
		// summary:
		//		Slide a node to a new top/left position
		//
		// description:
		//		Returns an animation that will slide "node"
		//		defined in args Object from its current position to
		//		the position defined by (args.left, args.top).
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on). Special args members
		//		are `top` and `left`, which indicate the new position to slide to.
		//
		// example:
		//	|	.slideTo({ node: node, left:"40", top:"50", units:"px" }).play()

		var node = args.node = dom.byId(args.node),
			top = null, left = null;

		var init = (function(n){
			return function(){
				var cs = domStyle.getComputedStyle(n);
				var pos = cs.position;
				top = (pos == 'absolute' ? n.offsetTop : parseInt(cs.top) || 0);
				left = (pos == 'absolute' ? n.offsetLeft : parseInt(cs.left) || 0);
				if(pos != 'absolute' && pos != 'relative'){
					var ret = geom.position(n, true);
					top = ret.y;
					left = ret.x;
					n.style.position="absolute";
					n.style.top=top+"px";
					n.style.left=left+"px";
				}
			};
		})(node);
		init();

		var anim = baseFx.animateProperty(lang.mixin({
			properties: {
				top: args.top || 0,
				left: args.left || 0
			}
		}, args));
		aspect.after(anim, "beforeBegin", init, true);

		return anim; // dojo/_base/fx.Animation
	};

	return coreFx;
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
'dijit/a11yclick':function(){
define([
	"dojo/keys", // keys.ENTER keys.SPACE
	"dojo/mouse",
	"dojo/on",
	"dojo/touch" // touch support for click is now there
], function(keys, mouse, on, touch){

	// module:
	//		dijit/a11yclick

	/*=====
	return {
		// summary:
		//		Custom press, release, and click synthetic events
		//		which trigger on a left mouse click, touch, or space/enter keyup.

		click: function(node, listener){
			// summary:
			//		Logical click operation for mouse, touch, or keyboard (space/enter key)
		},
		press: function(node, listener){
			// summary:
			//		Mousedown (left button), touchstart, or keydown (space or enter) corresponding to logical click operation.
		},
		release: function(node, listener){
			// summary:
			//		Mouseup (left button), touchend, or keyup (space or enter) corresponding to logical click operation.
		},
		move: function(node, listener){
			// summary:
			//		Mouse cursor or a finger is dragged over the given node.
		}
	};
	=====*/

	function clickKey(/*Event*/ e){
		// Test if this keyboard event should be tracked as the start (if keydown) or end (if keyup) of a click event.
		// Only track for nodes marked to be tracked, and not for buttons or inputs,
		// since buttons handle keyboard click natively, and text inputs should not
		// prevent typing spaces or newlines.
		if((e.keyCode === keys.ENTER || e.keyCode === keys.SPACE) && !/input|button|textarea/i.test(e.target.nodeName)){

			// Test if a node or its ancestor has been marked with the dojoClick property to indicate special processing
			for(var node = e.target; node; node = node.parentNode){
				if(node.dojoClick){ return true; }
			}
		}
	}

	var lastKeyDownNode;

	on(document, "keydown", function(e){
		//console.log("a11yclick: onkeydown, e.target = ", e.target, ", lastKeyDownNode was ", lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
		if(clickKey(e)){
			// needed on IE for when focus changes between keydown and keyup - otherwise dropdown menus do not work
			lastKeyDownNode = e.target;

			// Prevent viewport scrolling on space key in IE<9.
			// (Reproducible on test_Button.html on any of the first dijit/form/Button examples)
			e.preventDefault();
		}else{
			lastKeyDownNode = null;
		}
	});

	on(document, "keyup", function(e){
		//console.log("a11yclick: onkeyup, e.target = ", e.target, ", lastKeyDownNode was ", lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
		if(clickKey(e) && e.target == lastKeyDownNode){	// === breaks greasemonkey
			//need reset here or have problems in FF when focus returns to trigger element after closing popup/alert
			lastKeyDownNode = null;

			on.emit(e.target, "click", {
				cancelable: true,
				bubbles: true,
				ctrlKey: e.ctrlKey,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
				_origType: e.type
			});
		}
	});

	// I want to return a hash of the synthetic events, but for backwards compatibility the main return value
	// needs to be the click event.   Change for 2.0.

	var click = function(node, listener){
		// Set flag on node so that keydown/keyup above emits click event
		node.dojoClick = true;

		return on(node, "click", listener);
	};
	click.click = click;	// forward compatibility with 2.0

	click.press =  function(node, listener){
		var touchListener = on(node, touch.press, function(evt){
			if(evt.type == "mousedown" && !mouse.isLeft(evt)){
				// Ignore right click
				return;
			}
			listener(evt);
		}), keyListener = on(node, "keydown", function(evt){
			if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
				listener(evt);
			}
		});
		return {
			remove: function(){
				touchListener.remove();
				keyListener.remove();
			}
		};
	};

	click.release =  function(node, listener){
		var touchListener = on(node, touch.release, function(evt){
			if(evt.type == "mouseup" && !mouse.isLeft(evt)){
				// Ignore right click
				return;
			}
			listener(evt);
		}), keyListener = on(node, "keyup", function(evt){
			if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
				listener(evt);
			}
		});
		return {
			remove: function(){
				touchListener.remove();
				keyListener.remove();
			}
		};
	};

	click.move = touch.move;	// just for convenience

	return click;
});

},
'dijit/focus':function(){
define([
	"dojo/aspect",
	"dojo/_base/declare", // declare
	"dojo/dom", // domAttr.get dom.isDescendant
	"dojo/dom-attr", // domAttr.get dom.isDescendant
	"dojo/dom-class",
	"dojo/dom-construct", // connect to domConstruct.empty, domConstruct.destroy
	"dojo/Evented",
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/domReady",
	"dojo/sniff", // has("ie")
	"dojo/Stateful",
	"dojo/_base/window", // win.body
	"dojo/window", // winUtils.get
	"./a11y",	// a11y.isTabNavigable
	"./registry",	// registry.byId
	"./main"		// to set dijit.focus
], function(aspect, declare, dom, domAttr, domClass, domConstruct, Evented, lang, on, domReady, has, Stateful, win, winUtils,
			a11y, registry, dijit){

	// module:
	//		dijit/focus

	var lastFocusin;

	var FocusManager = declare([Stateful, Evented], {
		// summary:
		//		Tracks the currently focused node, and which widgets are currently "active".
		//		Access via require(["dijit/focus"], function(focus){ ... }).
		//
		//		A widget is considered active if it or a descendant widget has focus,
		//		or if a non-focusable node of this widget or a descendant was recently clicked.
		//
		//		Call focus.watch("curNode", callback) to track the current focused DOMNode,
		//		or focus.watch("activeStack", callback) to track the currently focused stack of widgets.
		//
		//		Call focus.on("widget-blur", func) or focus.on("widget-focus", ...) to monitor when
		//		when widgets become active/inactive
		//
		//		Finally, focus(node) will focus a node, suppressing errors if the node doesn't exist.

		// curNode: DomNode
		//		Currently focused item on screen
		curNode: null,

		// activeStack: dijit/_WidgetBase[]
		//		List of currently active widgets (focused widget and it's ancestors)
		activeStack: [],

		constructor: function(){
			// Don't leave curNode/prevNode pointing to bogus elements
			var check = lang.hitch(this, function(node){
				if(dom.isDescendant(this.curNode, node)){
					this.set("curNode", null);
				}
				if(dom.isDescendant(this.prevNode, node)){
					this.set("prevNode", null);
				}
			});
			aspect.before(domConstruct, "empty", check);
			aspect.before(domConstruct, "destroy", check);
		},

		registerIframe: function(/*DomNode*/ iframe){
			// summary:
			//		Registers listeners on the specified iframe so that any click
			//		or focus event on that iframe (or anything in it) is reported
			//		as a focus/click event on the `<iframe>` itself.
			// description:
			//		Currently only used by editor.
			// returns:
			//		Handle with remove() method to deregister.
			return this.registerWin(iframe.contentWindow, iframe);
		},

		registerWin: function(/*Window?*/targetWindow, /*DomNode?*/ effectiveNode){
			// summary:
			//		Registers listeners on the specified window (either the main
			//		window or an iframe's window) to detect when the user has clicked somewhere
			//		or focused somewhere.
			// description:
			//		Users should call registerIframe() instead of this method.
			// targetWindow:
			//		If specified this is the window associated with the iframe,
			//		i.e. iframe.contentWindow.
			// effectiveNode:
			//		If specified, report any focus events inside targetWindow as
			//		an event on effectiveNode, rather than on evt.target.
			// returns:
			//		Handle with remove() method to deregister.

			// TODO: make this function private in 2.0; Editor/users should call registerIframe(),

			// Listen for blur and focus events on targetWindow's document.
			var _this = this,
				body = targetWindow.document && targetWindow.document.body;

			if(body){
				var mdh = on(targetWindow.document, 'mousedown, touchstart', function(evt){
					_this._justMouseDowned = true;
					setTimeout(function(){ _this._justMouseDowned = false; }, 0);

					// workaround weird IE bug where the click is on an orphaned node
					// (first time clicking a Select/DropDownButton inside a TooltipDialog).
					// actually, strangely this is happening on latest chrome too.
					if(evt && evt.target && evt.target.parentNode == null){
						return;
					}

					_this._onTouchNode(effectiveNode || evt.target, "mouse");
				});

				var fih = on(body, 'focusin', function(evt){

					lastFocusin = (new Date()).getTime();

					// When you refocus the browser window, IE gives an event with an empty srcElement
					if(!evt.target.tagName) { return; }

					// IE reports that nodes like <body> have gotten focus, even though they have tabIndex=-1,
					// ignore those events
					var tag = evt.target.tagName.toLowerCase();
					if(tag == "#document" || tag == "body"){ return; }

					if(a11y.isFocusable(evt.target)){
						_this._onFocusNode(effectiveNode || evt.target);
					}else{
						// Previous code called _onTouchNode() for any activate event on a non-focusable node.   Can
						// probably just ignore such an event as it will be handled by onmousedown handler above, but
						// leaving the code for now.
						_this._onTouchNode(effectiveNode || evt.target);
					}
				});

				var foh = on(body, 'focusout', function(evt){
					// IE9+ has a problem where focusout events come after the corresponding focusin event.  At least
					// when moving focus from the Editor's <iframe> to a normal DOMNode.
					if((new Date()).getTime() < lastFocusin + 100){
						return;
					}

					_this._onBlurNode(effectiveNode || evt.target);
				});

				return {
					remove: function(){
						mdh.remove();
						fih.remove();
						foh.remove();
						mdh = fih = foh = null;
						body = null;	// prevent memory leak (apparent circular reference via closure)
					}
				};
			}
		},

		_onBlurNode: function(/*DomNode*/ node){
			// summary:
			//		Called when focus leaves a node.
			//		Usually ignored, _unless_ it *isn't* followed by touching another node,
			//		which indicates that we tabbed off the last field on the page,
			//		in which case every widget is marked inactive

			// If the blur event isn't followed by a focus event, it means the user clicked on something unfocusable,
			// so clear focus.
			if(this._clearFocusTimer){
				clearTimeout(this._clearFocusTimer);
			}
			this._clearFocusTimer = setTimeout(lang.hitch(this, function(){
				this.set("prevNode", this.curNode);
				this.set("curNode", null);
			}), 0);

			if(this._justMouseDowned){
				// the mouse down caused a new widget to be marked as active; this blur event
				// is coming late, so ignore it.
				return;
			}

			// If the blur event isn't followed by a focus or touch event then mark all widgets as inactive.
			if(this._clearActiveWidgetsTimer){
				clearTimeout(this._clearActiveWidgetsTimer);
			}
			this._clearActiveWidgetsTimer = setTimeout(lang.hitch(this, function(){
				delete this._clearActiveWidgetsTimer;
				this._setStack([]);
			}), 0);
		},

		_onTouchNode: function(/*DomNode*/ node, /*String*/ by){
			// summary:
			//		Callback when node is focused or mouse-downed
			// node:
			//		The node that was touched.
			// by:
			//		"mouse" if the focus/touch was caused by a mouse down event

			// ignore the recent blurNode event
			if(this._clearActiveWidgetsTimer){
				clearTimeout(this._clearActiveWidgetsTimer);
				delete this._clearActiveWidgetsTimer;
			}

			// if the click occurred on the scrollbar of a dropdown, treat it as a click on the dropdown,
			// even though the scrollbar is technically on the popup wrapper (see #10631)
			if(domClass.contains(node, "dijitPopup")){
				node = node.firstChild;
			}

			// compute stack of active widgets (ex: ComboButton --> Menu --> MenuItem)
			var newStack=[];
			try{
				while(node){
					var popupParent = domAttr.get(node, "dijitPopupParent");
					if(popupParent){
						node=registry.byId(popupParent).domNode;
					}else if(node.tagName && node.tagName.toLowerCase() == "body"){
						// is this the root of the document or just the root of an iframe?
						if(node === win.body()){
							// node is the root of the main document
							break;
						}
						// otherwise, find the iframe this node refers to (can't access it via parentNode,
						// need to do this trick instead). window.frameElement is supported in IE/FF/Webkit
						node=winUtils.get(node.ownerDocument).frameElement;
					}else{
						// if this node is the root node of a widget, then add widget id to stack,
						// except ignore clicks on disabled widgets (actually focusing a disabled widget still works,
						// to support MenuItem)
						var id = node.getAttribute && node.getAttribute("widgetId"),
							widget = id && registry.byId(id);
						if(widget && !(by == "mouse" && widget.get("disabled"))){
							newStack.unshift(id);
						}
						node=node.parentNode;
					}
				}
			}catch(e){ /* squelch */ }

			this._setStack(newStack, by);
		},

		_onFocusNode: function(/*DomNode*/ node){
			// summary:
			//		Callback when node is focused

			if(!node){
				return;
			}

			if(node.nodeType == 9){
				// Ignore focus events on the document itself.  This is here so that
				// (for example) clicking the up/down arrows of a spinner
				// (which don't get focus) won't cause that widget to blur. (FF issue)
				return;
			}

			// There was probably a blur event right before this event, but since we have a new focus, don't
			// do anything with the blur
			if(this._clearFocusTimer){
				clearTimeout(this._clearFocusTimer);
				delete this._clearFocusTimer;
			}

			this._onTouchNode(node);

			if(node == this.curNode){ return; }
			this.set("prevNode", this.curNode);
			this.set("curNode", node);
		},

		_setStack: function(/*String[]*/ newStack, /*String*/ by){
			// summary:
			//		The stack of active widgets has changed.  Send out appropriate events and records new stack.
			// newStack:
			//		array of widget id's, starting from the top (outermost) widget
			// by:
			//		"mouse" if the focus/touch was caused by a mouse down event

			var oldStack = this.activeStack, lastOldIdx = oldStack.length - 1, lastNewIdx = newStack.length - 1;

			if(newStack[lastNewIdx] == oldStack[lastOldIdx]){
				// no changes, return now to avoid spurious notifications about changes to activeStack
				return;
			}

			this.set("activeStack", newStack);

			var widget, i;

			// for all elements that have gone out of focus, set focused=false
			for(i = lastOldIdx; i >= 0 && oldStack[i] != newStack[i]; i--){
				widget = registry.byId(oldStack[i]);
				if(widget){
					widget._hasBeenBlurred = true;		// TODO: used by form widgets, should be moved there
					widget.set("focused", false);
					if(widget._focusManager == this){
						widget._onBlur(by);
					}
					this.emit("widget-blur", widget, by);
				}
			}

			// for all element that have come into focus, set focused=true
			for(i++; i <= lastNewIdx; i++){
				widget = registry.byId(newStack[i]);
				if(widget){
					widget.set("focused", true);
					if(widget._focusManager == this){
						widget._onFocus(by);
					}
					this.emit("widget-focus", widget, by);
				}
			}
		},

		focus: function(node){
			// summary:
			//		Focus the specified node, suppressing errors if they occur
			if(node){
				try{ node.focus(); }catch(e){/*quiet*/}
			}
		}
	});

	var singleton = new FocusManager();

	// register top window and all the iframes it contains
	domReady(function(){
		var handle = singleton.registerWin(winUtils.get(document));
		if(has("ie")){
			on(window, "unload", function(){
				if(handle){	// because this gets called twice when doh.robot is running
					handle.remove();
					handle = null;
				}
			});
		}
	});

	// Setup dijit.focus as a pointer to the singleton but also (for backwards compatibility)
	// as a function to set focus.   Remove for 2.0.
	dijit.focus = function(node){
		singleton.focus(node);	// indirection here allows dijit/_base/focus.js to override behavior
	};
	for(var attr in singleton){
		if(!/^_/.test(attr)){
			dijit.focus[attr] = typeof singleton[attr] == "function" ? lang.hitch(singleton, attr) : singleton[attr];
		}
	}
	singleton.watch(function(attr, oldVal, newVal){
		dijit.focus[attr] = newVal;
	});

	return singleton;
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
'dojo/window':function(){
define(["./_base/lang", "./sniff", "./_base/window", "./dom", "./dom-geometry", "./dom-style", "./dom-construct"],
	function(lang, has, baseWindow, dom, geom, style, domConstruct){

	// feature detection
	/* not needed but included here for future reference
	has.add("rtl-innerVerticalScrollBar-on-left", function(win, doc){
		var	body = baseWindow.body(doc),
			scrollable = domConstruct.create('div', {
				style: {overflow:'scroll', overflowX:'hidden', direction:'rtl', visibility:'hidden', position:'absolute', left:'0', width:'64px', height:'64px'}
			}, body, "last"),
			center = domConstruct.create('center', {
				style: {overflow:'hidden', direction:'ltr'}
			}, scrollable, "last"),
			inner = domConstruct.create('div', {
				style: {overflow:'visible', display:'inline' }
			}, center, "last");
		inner.innerHTML="&nbsp;";
		var midPoint = Math.max(inner.offsetLeft, geom.position(inner).x);
		var ret = midPoint >= 32;
		center.removeChild(inner);
		scrollable.removeChild(center);
		body.removeChild(scrollable);
		return ret;
	});
	*/
	has.add("rtl-adjust-position-for-verticalScrollBar", function(win, doc){
		var	body = baseWindow.body(doc),
			scrollable = domConstruct.create('div', {
				style: {overflow:'scroll', overflowX:'visible', direction:'rtl', visibility:'hidden', position:'absolute', left:'0', top:'0', width:'64px', height:'64px'}
			}, body, "last"),
			div = domConstruct.create('div', {
				style: {overflow:'hidden', direction:'ltr'}
			}, scrollable, "last"),
			ret = geom.position(div).x != 0;
		scrollable.removeChild(div);
		body.removeChild(scrollable);
		return ret;
	});

	has.add("position-fixed-support", function(win, doc){
		// IE6, IE7+quirks, and some older mobile browsers don't support position:fixed
		var	body = baseWindow.body(doc),
			outer = domConstruct.create('span', {
				style: {visibility:'hidden', position:'fixed', left:'1px', top:'1px'}
			}, body, "last"),
			inner = domConstruct.create('span', {
				style: {position:'fixed', left:'0', top:'0'}
			}, outer, "last"),
			ret = geom.position(inner).x != geom.position(outer).x;
		outer.removeChild(inner);
		body.removeChild(outer);
		return ret;
	});

	// module:
	//		dojo/window

	var window = {
		// summary:
		//		TODOC

		getBox: function(/*Document?*/ doc){
			// summary:
			//		Returns the dimensions and scroll position of the viewable area of a browser window

			doc = doc || baseWindow.doc;

			var
				scrollRoot = (doc.compatMode == 'BackCompat') ? baseWindow.body(doc) : doc.documentElement,
				// get scroll position
				scroll = geom.docScroll(doc), // scrollRoot.scrollTop/Left should work
				w, h;

			if(has("touch")){ // if(scrollbars not supported)
				var uiWindow = window.get(doc);   // use UI window, not dojo.global window
				// on mobile, scrollRoot.clientHeight <= uiWindow.innerHeight <= scrollRoot.offsetHeight, return uiWindow.innerHeight
				w = uiWindow.innerWidth || scrollRoot.clientWidth; // || scrollRoot.clientXXX probably never evaluated
				h = uiWindow.innerHeight || scrollRoot.clientHeight;
			}else{
				// on desktops, scrollRoot.clientHeight <= scrollRoot.offsetHeight <= uiWindow.innerHeight, return scrollRoot.clientHeight
				// uiWindow.innerWidth/Height includes the scrollbar and cannot be used
				w = scrollRoot.clientWidth;
				h = scrollRoot.clientHeight;
			}
			return {
				l: scroll.x,
				t: scroll.y,
				w: w,
				h: h
			};
		},

		get: function(/*Document*/ doc){
			// summary:
			//		Get window object associated with document doc.
			// doc:
			//		The document to get the associated window for.

			// In some IE versions (at least 6.0), document.parentWindow does not return a
			// reference to the real window object (maybe a copy), so we must fix it as well
			// We use IE specific execScript to attach the real window reference to
			// document._parentWindow for later use
			if(has("ie") < 9 && window !== document.parentWindow){
				/*
				In IE 6, only the variable "window" can be used to connect events (others
				may be only copies).
				*/
				doc.parentWindow.execScript("document._parentWindow = window;", "Javascript");
				//to prevent memory leak, unset it after use
				//another possibility is to add an onUnload handler which seems overkill to me (liucougar)
				var win = doc._parentWindow;
				doc._parentWindow = null;
				return win;	//	Window
			}

			return doc.parentWindow || doc.defaultView;	//	Window
		},

		scrollIntoView: function(/*DomNode*/ node, /*Object?*/ pos){
			// summary:
			//		Scroll the passed node into view using minimal movement, if it is not already.

			// Don't rely on node.scrollIntoView working just because the function is there since
			// it forces the node to the page's bottom or top (and left or right in IE) without consideration for the minimal movement.
			// WebKit's node.scrollIntoViewIfNeeded doesn't work either for inner scrollbars in right-to-left mode
			// and when there's a fixed position scrollable element

			try{ // catch unexpected/unrecreatable errors (#7808) since we can recover using a semi-acceptable native method
				node = dom.byId(node);
				var	doc = node.ownerDocument || baseWindow.doc,	// TODO: why baseWindow.doc?  Isn't node.ownerDocument always defined?
					body = baseWindow.body(doc),
					html = doc.documentElement || body.parentNode,
					isIE = has("ie"),
					isWK = has("webkit");
				// if an untested browser, then use the native method
				if(node == body || node == html){ return; }
				if(!(has("mozilla") || isIE || isWK || has("opera")) && ("scrollIntoView" in node)){
					node.scrollIntoView(false); // short-circuit to native if possible
					return;
				}
				var	backCompat = doc.compatMode == 'BackCompat',
					rootWidth = Math.min(body.clientWidth || html.clientWidth, html.clientWidth || body.clientWidth),
					rootHeight = Math.min(body.clientHeight || html.clientHeight, html.clientHeight || body.clientHeight),
					scrollRoot = (isWK || backCompat) ? body : html,
					nodePos = pos || geom.position(node),
					el = node.parentNode,
					isFixed = function(el){
						return (isIE <= 6 || (isIE == 7 && backCompat))
							? false
							: (has("position-fixed-support") && (style.get(el, 'position').toLowerCase() == "fixed"));
					};
				if(isFixed(node)){ return; } // nothing to do
				while(el){
					if(el == body){ el = scrollRoot; }
					var	elPos = geom.position(el),
						fixedPos = isFixed(el),
						rtl = style.getComputedStyle(el).direction.toLowerCase() == "rtl";

					if(el == scrollRoot){
						elPos.w = rootWidth; elPos.h = rootHeight;
						if(scrollRoot == html && isIE && rtl){ elPos.x += scrollRoot.offsetWidth-elPos.w; } // IE workaround where scrollbar causes negative x
						if(elPos.x < 0 || !isIE || isIE >= 9){ elPos.x = 0; } // older IE can have values > 0
						if(elPos.y < 0 || !isIE || isIE >= 9){ elPos.y = 0; }
					}else{
						var pb = geom.getPadBorderExtents(el);
						elPos.w -= pb.w; elPos.h -= pb.h; elPos.x += pb.l; elPos.y += pb.t;
						var clientSize = el.clientWidth,
							scrollBarSize = elPos.w - clientSize;
						if(clientSize > 0 && scrollBarSize > 0){
							if(rtl && has("rtl-adjust-position-for-verticalScrollBar")){
								elPos.x += scrollBarSize;
							}
							elPos.w = clientSize;
						}
						clientSize = el.clientHeight;
						scrollBarSize = elPos.h - clientSize;
						if(clientSize > 0 && scrollBarSize > 0){
							elPos.h = clientSize;
						}
					}
					if(fixedPos){ // bounded by viewport, not parents
						if(elPos.y < 0){
							elPos.h += elPos.y; elPos.y = 0;
						}
						if(elPos.x < 0){
							elPos.w += elPos.x; elPos.x = 0;
						}
						if(elPos.y + elPos.h > rootHeight){
							elPos.h = rootHeight - elPos.y;
						}
						if(elPos.x + elPos.w > rootWidth){
							elPos.w = rootWidth - elPos.x;
						}
					}
					// calculate overflow in all 4 directions
					var	l = nodePos.x - elPos.x, // beyond left: < 0
//						t = nodePos.y - Math.max(elPos.y, 0), // beyond top: < 0
						t = nodePos.y - elPos.y, // beyond top: < 0
						r = l + nodePos.w - elPos.w, // beyond right: > 0
						bot = t + nodePos.h - elPos.h; // beyond bottom: > 0
					var s, old;
					if(r * l > 0 && (!!el.scrollLeft || el == scrollRoot || el.scrollWidth > el.offsetHeight)){
						s = Math[l < 0? "max" : "min"](l, r);
						if(rtl && ((isIE == 8 && !backCompat) || isIE >= 9)){ s = -s; }
						old = el.scrollLeft;
						el.scrollLeft += s;
						s = el.scrollLeft - old;
						nodePos.x -= s;
					}
					if(bot * t > 0 && (!!el.scrollTop || el == scrollRoot || el.scrollHeight > el.offsetHeight)){
						s = Math.ceil(Math[t < 0? "max" : "min"](t, bot));
						old = el.scrollTop;
						el.scrollTop += s;
						s = el.scrollTop - old;
						nodePos.y -= s;
					}
					el = (el != scrollRoot) && !fixedPos && el.parentNode;
				}
			}catch(error){
				console.error('scrollIntoView: ' + error);
				node.scrollIntoView(false);
			}
		}
	};

	 1  && lang.setObject("dojo.window", window);

	return window;
});

},
'dijit/a11y':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/dom",			// dom.byId
	"dojo/dom-attr", // domAttr.attr domAttr.has
	"dojo/dom-style", // domStyle.style
	"dojo/_base/lang", // lang.mixin()
	"dojo/sniff", // has("ie")  1 
	"./main"	// for exporting methods to dijit namespace
], function(array, dom, domAttr, domStyle, lang, has, dijit){

	// module:
	//		dijit/a11y

	var undefined;

	var a11y = {
		// summary:
		//		Accessibility utility functions (keyboard, tab stops, etc.)

		_isElementShown: function(/*Element*/ elem){
			var s = domStyle.get(elem);
			return (s.visibility != "hidden")
				&& (s.visibility != "collapsed")
				&& (s.display != "none")
				&& (domAttr.get(elem, "type") != "hidden");
		},

		hasDefaultTabStop: function(/*Element*/ elem){
			// summary:
			//		Tests if element is tab-navigable even without an explicit tabIndex setting

			// No explicit tabIndex setting, need to investigate node type
			switch(elem.nodeName.toLowerCase()){
				case "a":
					// An <a> w/out a tabindex is only navigable if it has an href
					return domAttr.has(elem, "href");
				case "area":
				case "button":
				case "input":
				case "object":
				case "select":
				case "textarea":
					// These are navigable by default
					return true;
				case "iframe":
					// If it's an editor <iframe> then it's tab navigable.
					var body;
					try{
						// non-IE
						var contentDocument = elem.contentDocument;
						if("designMode" in contentDocument && contentDocument.designMode == "on"){
							return true;
						}
						body = contentDocument.body;
					}catch(e1){
						// contentWindow.document isn't accessible within IE7/8
						// if the iframe.src points to a foreign url and this
						// page contains an element, that could get focus
						try{
							body = elem.contentWindow.document.body;
						}catch(e2){
							return false;
						}
					}
					return body && (body.contentEditable == 'true' ||
						(body.firstChild && body.firstChild.contentEditable == 'true'));
				default:
					return elem.contentEditable == 'true';
			}
		},

		effectiveTabIndex: function(/*Element*/ elem){
			// summary:
			//		Returns effective tabIndex of an element, either a number, or undefined if element isn't focusable.

			if(domAttr.get(elem, "disabled")){
				return undefined;
			}else if(domAttr.has(elem, "tabIndex")){
				// Explicit tab index setting
				return +domAttr.get(elem, "tabIndex");// + to convert string --> number
			}else{
				// No explicit tabIndex setting, so depends on node type
				return a11y.hasDefaultTabStop(elem) ? 0 : undefined;
			}
		},

		isTabNavigable: function(/*Element*/ elem){
			// summary:
			//		Tests if an element is tab-navigable

			return a11y.effectiveTabIndex(elem) >= 0;
		},

		isFocusable: function(/*Element*/ elem){
			// summary:
			//		Tests if an element is focusable by tabbing to it, or clicking it with the mouse.

			return a11y.effectiveTabIndex(elem) >= -1;
		},

		_getTabNavigable: function(/*DOMNode*/ root){
			// summary:
			//		Finds descendants of the specified root node.
			// description:
			//		Finds the following descendants of the specified root node:
			//
			//		- the first tab-navigable element in document order
			//		  without a tabIndex or with tabIndex="0"
			//		- the last tab-navigable element in document order
			//		  without a tabIndex or with tabIndex="0"
			//		- the first element in document order with the lowest
			//		  positive tabIndex value
			//		- the last element in document order with the highest
			//		  positive tabIndex value
			var first, last, lowest, lowestTabindex, highest, highestTabindex, radioSelected = {};

			function radioName(node){
				// If this element is part of a radio button group, return the name for that group.
				return node && node.tagName.toLowerCase() == "input" &&
					node.type && node.type.toLowerCase() == "radio" &&
					node.name && node.name.toLowerCase();
			}

			var shown = a11y._isElementShown, effectiveTabIndex = a11y.effectiveTabIndex;
			var walkTree = function(/*DOMNode*/ parent){
				for(var child = parent.firstChild; child; child = child.nextSibling){
					// Skip text elements, hidden elements, and also non-HTML elements (those in custom namespaces) in IE,
					// since show() invokes getAttribute("type"), which crash on VML nodes in IE.
					if(child.nodeType != 1 || (has("ie") <= 9 && child.scopeName !== "HTML") || !shown(child)){
						continue;
					}

					var tabindex = effectiveTabIndex(child);
					if(tabindex >= 0){
						if(tabindex == 0){
							if(!first){
								first = child;
							}
							last = child;
						}else if(tabindex > 0){
							if(!lowest || tabindex < lowestTabindex){
								lowestTabindex = tabindex;
								lowest = child;
							}
							if(!highest || tabindex >= highestTabindex){
								highestTabindex = tabindex;
								highest = child;
							}
						}
						var rn = radioName(child);
						if(domAttr.get(child, "checked") && rn){
							radioSelected[rn] = child;
						}
					}
					if(child.nodeName.toUpperCase() != 'SELECT'){
						walkTree(child);
					}
				}
			};
			if(shown(root)){
				walkTree(root);
			}
			function rs(node){
				// substitute checked radio button for unchecked one, if there is a checked one with the same name.
				return radioSelected[radioName(node)] || node;
			}

			return { first: rs(first), last: rs(last), lowest: rs(lowest), highest: rs(highest) };
		},

		getFirstInTabbingOrder: function(/*String|DOMNode*/ root, /*Document?*/ doc){
			// summary:
			//		Finds the descendant of the specified root node
			//		that is first in the tabbing order
			var elems = a11y._getTabNavigable(dom.byId(root, doc));
			return elems.lowest ? elems.lowest : elems.first; // DomNode
		},

		getLastInTabbingOrder: function(/*String|DOMNode*/ root, /*Document?*/ doc){
			// summary:
			//		Finds the descendant of the specified root node
			//		that is last in the tabbing order
			var elems = a11y._getTabNavigable(dom.byId(root, doc));
			return elems.last ? elems.last : elems.highest; // DomNode
		}
	};

	 1  && lang.mixin(dijit, a11y);

	return a11y;
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
'dijit/_base/manager':function(){
define([
	"dojo/_base/array",
	"dojo/_base/config", // defaultDuration
	"dojo/_base/lang",
	"../registry",
	"../main"	// for setting exports to dijit namespace
], function(array, config, lang, registry, dijit){

	// module:
	//		dijit/_base/manager

	var exports = {
		// summary:
		//		Deprecated.  Shim to methods on registry, plus a few other declarations.
		//		New code should access dijit/registry directly when possible.
	};

	array.forEach(["byId", "getUniqueId", "findWidgets", "_destroyAll", "byNode", "getEnclosingWidget"], function(name){
		exports[name] = registry[name];
	});

	 lang.mixin(exports, {
		 // defaultDuration: Integer
		 //		The default fx.animation speed (in ms) to use for all Dijit
		 //		transitional fx.animations, unless otherwise specified
		 //		on a per-instance basis. Defaults to 200, overrided by
		 //		`djConfig.defaultDuration`
		 defaultDuration: config["defaultDuration"] || 200
	 });

	lang.mixin(dijit, exports);

	/*===== return exports; =====*/
	return dijit;	// for back compat :-(
});

},
'dijit/_Widget':function(){
define([
	"dojo/aspect",	// aspect.around
	"dojo/_base/config",	// config.isDebug
	"dojo/_base/connect",	// connect.connect
	"dojo/_base/declare", // declare
	"dojo/has",
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.hitch
	"dojo/query",
	"dojo/ready",
	"./registry",	// registry.byNode
	"./_WidgetBase",
	"./_OnDijitClickMixin",
	"./_FocusMixin",
	"dojo/uacss",		// browser sniffing (included for back-compat; subclasses may be using)
	"./hccss"		// high contrast mode sniffing (included to set CSS classes on <body>, module ret value unused)
], function(aspect, config, connect, declare, has, kernel, lang, query, ready,
			registry, _WidgetBase, _OnDijitClickMixin, _FocusMixin){


// module:
//		dijit/_Widget


function connectToDomNode(){
	// summary:
	//		If user connects to a widget method === this function, then they will
	//		instead actually be connecting the equivalent event on this.domNode
}

// Trap dojo.connect() calls to connectToDomNode methods, and redirect to _Widget.on()
function aroundAdvice(originalConnect){
	return function(obj, event, scope, method){
		if(obj && typeof event == "string" && obj[event] == connectToDomNode){
			return obj.on(event.substring(2).toLowerCase(), lang.hitch(scope, method));
		}
		return originalConnect.apply(connect, arguments);
	};
}
aspect.around(connect, "connect", aroundAdvice);
if(kernel.connect){
	aspect.around(kernel, "connect", aroundAdvice);
}

var _Widget = declare("dijit._Widget", [_WidgetBase, _OnDijitClickMixin, _FocusMixin], {
	// summary:
	//		Old base class for widgets.   New widgets should extend `dijit/_WidgetBase` instead
	// description:
	//		Old Base class for Dijit widgets.
	//
	//		Extends _WidgetBase, adding support for:
	//
	//		- declaratively/programatically specifying widget initialization parameters like
	//			onMouseMove="foo" that call foo when this.domNode gets a mousemove event
	//		- ondijitclick:
	//			Support new data-dojo-attach-event="ondijitclick: ..." that is triggered by a mouse click or a SPACE/ENTER keypress
	//		- focus related functions:
	//			In particular, the onFocus()/onBlur() callbacks.   Driven internally by
	//			dijit/_base/focus.js.
	//		- deprecated methods
	//		- onShow(), onHide(), onClose()
	//
	//		Also, by loading code in dijit/_base, turns on:
	//
	//		- browser sniffing (putting browser class like `dj_ie` on `<html>` node)
	//		- high contrast mode sniffing (add `dijit_a11y` class to `<body>` if machine is in high contrast mode)


	////////////////// DEFERRED CONNECTS ///////////////////

	onClick: connectToDomNode,
	/*=====
	onClick: function(event){
		// summary:
		//		Connect to this function to receive notifications of mouse click events.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onDblClick: connectToDomNode,
	/*=====
	onDblClick: function(event){
		// summary:
		//		Connect to this function to receive notifications of mouse double click events.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onKeyDown: connectToDomNode,
	/*=====
	onKeyDown: function(event){
		// summary:
		//		Connect to this function to receive notifications of keys being pressed down.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onKeyPress: connectToDomNode,
	/*=====
	onKeyPress: function(event){
		// summary:
		//		Connect to this function to receive notifications of printable keys being typed.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onKeyUp: connectToDomNode,
	/*=====
	onKeyUp: function(event){
		// summary:
		//		Connect to this function to receive notifications of keys being released.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onMouseDown: connectToDomNode,
	/*=====
	onMouseDown: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse button is pressed down.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseMove: connectToDomNode,
	/*=====
	onMouseMove: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves over nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseOut: connectToDomNode,
	/*=====
	onMouseOut: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves off of nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseOver: connectToDomNode,
	/*=====
	onMouseOver: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves onto nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseLeave: connectToDomNode,
	/*=====
	onMouseLeave: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves off of this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseEnter: connectToDomNode,
	/*=====
	onMouseEnter: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves onto this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseUp: connectToDomNode,
	/*=====
	onMouseUp: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse button is released.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/

	constructor: function(params /*===== ,srcNodeRef =====*/){
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

		// extract parameters like onMouseMove that should connect directly to this.domNode
		this._toConnect = {};
		for(var name in params){
			if(this[name] === connectToDomNode){
				this._toConnect[name.replace(/^on/, "").toLowerCase()] = params[name];
				delete params[name];
			}
		}
	},

	postCreate: function(){
		this.inherited(arguments);

		// perform connection from this.domNode to user specified handlers (ex: onMouseMove)
		for(var name in this._toConnect){
			this.on(name, this._toConnect[name]);
		}
		delete this._toConnect;
	},

	on: function(/*String|Function*/ type, /*Function*/ func){
		if(this[this._onMap(type)] === connectToDomNode){
			// Use connect.connect() rather than on() to get handling for "onmouseenter" on non-IE,
			// normalization of onkeypress/onkeydown to behave like firefox, etc.
			// Also, need to specify context as "this" rather than the default context of the DOMNode
			// Remove in 2.0.
			return connect.connect(this.domNode, type.toLowerCase(), this, func);
		}
		return this.inherited(arguments);
	},

	_setFocusedAttr: function(val){
		// Remove this method in 2.0 (or sooner), just here to set _focused == focused, for back compat
		// (but since it's a private variable we aren't required to keep supporting it).
		this._focused = val;
		this._set("focused", val);
	},

	////////////////// DEPRECATED METHODS ///////////////////

	setAttribute: function(/*String*/ attr, /*anything*/ value){
		// summary:
		//		Deprecated.  Use set() instead.
		// tags:
		//		deprecated
		kernel.deprecated(this.declaredClass+"::setAttribute(attr, value) is deprecated. Use set() instead.", "", "2.0");
		this.set(attr, value);
	},

	attr: function(/*String|Object*/name, /*Object?*/value){
		// summary:
		//		This method is deprecated, use get() or set() directly.
		// name:
		//		The property to get or set. If an object is passed here and not
		//		a string, its keys are used as names of attributes to be set
		//		and the value of the object as values to set in the widget.
		// value:
		//		Optional. If provided, attr() operates as a setter. If omitted,
		//		the current value of the named property is returned.
		// tags:
		//		deprecated

		var args = arguments.length;
		if(args >= 2 || typeof name === "object"){ // setter
			return this.set.apply(this, arguments);
		}else{ // getter
			return this.get(name);
		}
	},

	getDescendants: function(){
		// summary:
		//		Returns all the widgets contained by this, i.e., all widgets underneath this.containerNode.
		//		This method should generally be avoided as it returns widgets declared in templates, which are
		//		supposed to be internal/hidden, but it's left here for back-compat reasons.

		kernel.deprecated(this.declaredClass+"::getDescendants() is deprecated. Use getChildren() instead.", "", "2.0");
		return this.containerNode ? query('[widgetId]', this.containerNode).map(registry.byNode) : []; // dijit/_WidgetBase[]
	},

	////////////////// MISCELLANEOUS METHODS ///////////////////

	_onShow: function(){
		// summary:
		//		Internal method called when this widget is made visible.
		//		See `onShow` for details.
		this.onShow();
	},

	onShow: function(){
		// summary:
		//		Called when this widget becomes the selected pane in a
		//		`dijit/layout/TabContainer`, `dijit/layout/StackContainer`,
		//		`dijit/layout/AccordionContainer`, etc.
		//
		//		Also called to indicate display of a `dijit.Dialog`, `dijit.TooltipDialog`, or `dijit.TitlePane`.
		// tags:
		//		callback
	},

	onHide: function(){
		// summary:
		//		Called when another widget becomes the selected pane in a
		//		`dijit/layout/TabContainer`, `dijit/layout/StackContainer`,
		//		`dijit/layout/AccordionContainer`, etc.
		//
		//		Also called to indicate hide of a `dijit.Dialog`, `dijit.TooltipDialog`, or `dijit.TitlePane`.
		// tags:
		//		callback
	},

	onClose: function(){
		// summary:
		//		Called when this widget is being displayed as a popup (ex: a Calendar popped
		//		up from a DateTextBox), and it is hidden.
		//		This is called from the dijit.popup code, and should not be called directly.
		//
		//		Also used as a parameter for children of `dijit/layout/StackContainer` or subclasses.
		//		Callback if a user tries to close the child.   Child will be closed if this function returns true.
		// tags:
		//		extension

		return true;		// Boolean
	}
});

// For back-compat, remove in 2.0.
if(has("dijit-legacy-requires")){
	ready(0, function(){
		var requires = ["dijit/_base"];
		require(requires);	// use indirection so modules not rolled into a build
	});
}
return _Widget;
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
'dijit/_OnDijitClickMixin':function(){
define([
	"dojo/on",
	"dojo/_base/array", // array.forEach
	"dojo/keys", // keys.ENTER keys.SPACE
	"dojo/_base/declare", // declare
	"dojo/has", // has("dom-addeventlistener")
	"./a11yclick"
], function(on, array, keys, declare, has, a11yclick){

	// module:
	//		dijit/_OnDijitClickMixin

	var ret = declare("dijit._OnDijitClickMixin", null, {
		// summary:
		//		Deprecated.   New code should access the dijit/a11yclick event directly, ex:
		//		|	this.own(on(node, a11yclick, function(){ ... }));
		//
		//		Mixing in this class will make _WidgetBase.connect(node, "ondijitclick", ...) work.
		//		It also used to be necessary to make templates with ondijitclick work, but now you can just require
		//		dijit/a11yclick.

		connect: function(obj, event, method){
			// override _WidgetBase.connect() to make this.connect(node, "ondijitclick", ...) work
			return this.inherited(arguments, [obj, event == "ondijitclick" ? a11yclick : event, method]);
		}
	});

	ret.a11yclick = a11yclick;	// back compat

	return ret;
});

},
'dijit/_FocusMixin':function(){
define([
	"./focus",
	"./_WidgetBase",
	"dojo/_base/declare", // declare
	"dojo/_base/lang" // lang.extend
], function(focus, _WidgetBase, declare, lang){

	// module:
	//		dijit/_FocusMixin

	// We don't know where _FocusMixin will occur in the inheritance chain, but we need the _onFocus()/_onBlur() below
	// to be last in the inheritance chain, so mixin to _WidgetBase.
	lang.extend(_WidgetBase, {
		// focused: [readonly] Boolean
		//		This widget or a widget it contains has focus, or is "active" because
		//		it was recently clicked.
		focused: false,

		onFocus: function(){
			// summary:
			//		Called when the widget becomes "active" because
			//		it or a widget inside of it either has focus, or has recently
			//		been clicked.
			// tags:
			//		callback
		},

		onBlur: function(){
			// summary:
			//		Called when the widget stops being "active" because
			//		focus moved to something outside of it, or the user
			//		clicked somewhere outside of it, or the widget was
			//		hidden.
			// tags:
			//		callback
		},

		_onFocus: function(){
			// summary:
			//		This is where widgets do processing for when they are active,
			//		such as changing CSS classes.  See onFocus() for more details.
			// tags:
			//		protected
			this.onFocus();
		},

		_onBlur: function(){
			// summary:
			//		This is where widgets do processing for when they stop being active,
			//		such as changing CSS classes.  See onBlur() for more details.
			// tags:
			//		protected
			this.onBlur();
		}
	});

	return declare("dijit._FocusMixin", null, {
		// summary:
		//		Mixin to widget to provide _onFocus() and _onBlur() methods that
		//		fire when a widget or its descendants get/lose focus

		// flag that I want _onFocus()/_onBlur() notifications from focus manager
		_focusManager: focus
	});

});

},
'dojo/uacss':function(){
define(["./dom-geometry", "./_base/lang", "./domReady", "./sniff", "./_base/window"],
	function(geometry, lang, domReady, has, baseWindow){

	// module:
	//		dojo/uacss

	/*=====
	return {
		// summary:
		//		Applies pre-set CSS classes to the top-level HTML node, based on:
		//
		//		- browser (ex: dj_ie)
		//		- browser version (ex: dj_ie6)
		//		- box model (ex: dj_contentBox)
		//		- text direction (ex: dijitRtl)
		//
		//		In addition, browser, browser version, and box model are
		//		combined with an RTL flag when browser text is RTL. ex: dj_ie-rtl.
		//
		//		Returns the has() method.
	};
	=====*/

	var
		html = baseWindow.doc.documentElement,
		ie = has("ie"),
		opera = has("opera"),
		maj = Math.floor,
		ff = has("ff"),
		boxModel = geometry.boxModel.replace(/-/,''),

		classes = {
			"dj_quirks": has("quirks"),

			// NOTE: Opera not supported by dijit
			"dj_opera": opera,

			"dj_khtml": has("khtml"),

			"dj_webkit": has("webkit"),
			"dj_safari": has("safari"),
			"dj_chrome": has("chrome"),

			"dj_gecko": has("mozilla"),

			"dj_ios": has("ios"),
			"dj_android": has("android")
		}; // no dojo unsupported browsers

	if(ie){
		classes["dj_ie"] = true;
		classes["dj_ie" + maj(ie)] = true;
		classes["dj_iequirks"] = has("quirks");
	}
	if(ff){
		classes["dj_ff" + maj(ff)] = true;
	}

	classes["dj_" + boxModel] = true;

	// apply browser, browser version, and box model class names
	var classStr = "";
	for(var clz in classes){
		if(classes[clz]){
			classStr += clz + " ";
		}
	}
	html.className = lang.trim(html.className + " " + classStr);

	// If RTL mode, then add dj_rtl flag plus repeat existing classes with -rtl extension.
	// We can't run the code below until the <body> tag has loaded (so we can check for dir=rtl).
	domReady(function(){
		if(!geometry.isBodyLtr()){
			var rtlClassStr = "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl ");
			html.className = lang.trim(html.className + " " + rtlClassStr + "dj_rtl dijitRtl " + classStr.replace(/ /g, "-rtl "));
		}
	});
	return has;
});

},
'dijit/hccss':function(){
define(["dojo/dom-class", "dojo/hccss", "dojo/domReady", "dojo/_base/window"], function(domClass, has, domReady, win){

	// module:
	//		dijit/hccss

	/*=====
	return function(){
		// summary:
		//		Test if computer is in high contrast mode, and sets `dijit_a11y` flag on `<body>` if it is.
		//		Deprecated, use ``dojo/hccss`` instead.
	};
	=====*/

	domReady(function(){
		if(has("highcontrast")){
			domClass.add(win.body(), "dijit_a11y");
		}
	});

	return has;
});

},
'dojo/hccss':function(){
define([
	"require",			// require, require.toUrl
	"./_base/config", // config.blankGif
	"./dom-class", // domClass.add
	"./dom-style", // domStyle.getComputedStyle
	"./has",
	"./domReady",
	"./_base/window" // win.body
], function(require, config, domClass, domStyle, has, domReady, win){

	// module:
	//		dojo/hccss

	/*=====
	return function(){
		// summary:
		//		Test if computer is in high contrast mode (i.e. if browser is not displaying background images).
		//		Defines `has("highcontrast")` and sets `dj_a11y` CSS class on `<body>` if machine is in high contrast mode.
		//		Returns `has()` method;
	};
	=====*/

	// Has() test for when background images aren't displayed.  Don't call has("highcontrast") before dojo/domReady!.
	has.add("highcontrast", function(){
		// note: if multiple documents, doesn't matter which one we use
		var div = win.doc.createElement("div");
		div.style.cssText = "border: 1px solid; border-color:red green; position: absolute; height: 5px; top: -999px;" +
			"background-image: url(\"" + (config.blankGif || require.toUrl("./resources/blank.gif")) + "\");";
		win.body().appendChild(div);

		var cs = domStyle.getComputedStyle(div),
			bkImg = cs.backgroundImage,
			hc = (cs.borderTopColor == cs.borderRightColor) ||
				(bkImg && (bkImg == "none" || bkImg == "url(invalid-url:)" ));

		if(has("ie") <= 8){
			div.outerHTML = "";		// prevent mixed-content warning, see http://support.microsoft.com/kb/925014
		}else{
			win.body().removeChild(div);
		}

		return hc;
	});

	domReady(function(){
		if(has("highcontrast")){
			domClass.add(win.body(), "dj_a11y");
		}
	});

	return has;
});

},
'dijit/_TemplatedMixin':function(){
define([
	"dojo/cache",	// dojo.cache
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.destroy, domConstruct.toDom
	"dojo/_base/lang", // lang.getObject
	"dojo/on",
	"dojo/sniff", // has("ie")
	"dojo/string", // string.substitute string.trim
	"./_AttachMixin"
], function(cache, declare, domConstruct, lang, on, has, string, _AttachMixin){

	// module:
	//		dijit/_TemplatedMixin

	var _TemplatedMixin = declare("dijit._TemplatedMixin", _AttachMixin, {
		// summary:
		//		Mixin for widgets that are instantiated from a template

		// templateString: [protected] String
		//		A string that represents the widget template.
		//		Use in conjunction with dojo.cache() to load from a file.
		templateString: null,

		// templatePath: [protected deprecated] String
		//		Path to template (HTML file) for this widget relative to dojo.baseUrl.
		//		Deprecated: use templateString with require([... "dojo/text!..."], ...) instead
		templatePath: null,

		// skipNodeCache: [protected] Boolean
		//		If using a cached widget template nodes poses issues for a
		//		particular widget class, it can set this property to ensure
		//		that its template is always re-built from a string
		_skipNodeCache: false,

/*=====
		// _rendered: Boolean
		//		Not normally use, but this flag can be set by the app if the server has already rendered the template,
		//		i.e. already inlining the template for the widget into the main page.   Reduces _TemplatedMixin to
		//		just function like _AttachMixin.
		_rendered: false,
=====*/

		// Set _AttachMixin.searchContainerNode to true for back-compat for widgets that have data-dojo-attach-point's
		// and events inside this.containerNode.   Remove for 2.0.
		searchContainerNode: true,

		_stringRepl: function(tmpl){
			// summary:
			//		Does substitution of ${foo} type properties in template string
			// tags:
			//		private
			var className = this.declaredClass, _this = this;
			// Cache contains a string because we need to do property replacement
			// do the property replacement
			return string.substitute(tmpl, this, function(value, key){
				if(key.charAt(0) == '!'){ value = lang.getObject(key.substr(1), false, _this); }
				if(typeof value == "undefined"){ throw new Error(className+" template:"+key); } // a debugging aide
				if(value == null){ return ""; }

				// Substitution keys beginning with ! will skip the transform step,
				// in case a user wishes to insert unescaped markup, e.g. ${!foo}
				return key.charAt(0) == "!" ? value : this._escapeValue("" + value);
			}, this);
		},

		_escapeValue: function(/*String*/ val){
			// summary:
			//		Escape a value to be inserted into the template, either into an attribute value
			//		(ex: foo="${bar}") or as inner text of an element (ex: <span>${foo}</span>)

			// Safer substitution, see heading "Attribute values" in
			// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
			// and also https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
			return val.replace(/["'<>&]/g, function(val){
				return {
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					"\"": "&quot;",
					"'": "&#x27;"
				}[val];
			});
		},

		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget from a template, setting this.domNode.
			// tags:
			//		protected

			if(!this._rendered){
				if(!this.templateString){
					this.templateString = cache(this.templatePath, {sanitize: true});
				}

				// Lookup cached version of template, and download to cache if it
				// isn't there already.  Returns either a DomNode or a string, depending on
				// whether or not the template contains ${foo} replacement parameters.
				var cached = _TemplatedMixin.getCachedTemplate(this.templateString, this._skipNodeCache, this.ownerDocument);

				var node;
				if(lang.isString(cached)){
					node = domConstruct.toDom(this._stringRepl(cached), this.ownerDocument);
					if(node.nodeType != 1){
						// Flag common problems such as templates with multiple top level nodes (nodeType == 11)
						throw new Error("Invalid template: " + cached);
					}
				}else{
					// if it's a node, all we have to do is clone it
					node = cached.cloneNode(true);
				}

				this.domNode = node;
			}

			// Call down to _WidgetBase.buildRendering() to get base classes assigned
			// TODO: change the baseClass assignment to _setBaseClassAttr
			this.inherited(arguments);

			if(!this._rendered){
				this._fillContent(this.srcNodeRef);
			}

			this._rendered = true;
		},

		_fillContent: function(/*DomNode*/ source){
			// summary:
			//		Relocate source contents to templated container node.
			//		this.containerNode must be able to receive children, or exceptions will be thrown.
			// tags:
			//		protected
			var dest = this.containerNode;
			if(source && dest){
				while(source.hasChildNodes()){
					dest.appendChild(source.firstChild);
				}
			}
		}

	});

	// key is templateString; object is either string or DOM tree
	_TemplatedMixin._templateCache = {};

	_TemplatedMixin.getCachedTemplate = function(templateString, alwaysUseString, doc){
		// summary:
		//		Static method to get a template based on the templatePath or
		//		templateString key
		// templateString: String
		//		The template
		// alwaysUseString: Boolean
		//		Don't cache the DOM tree for this template, even if it doesn't have any variables
		// doc: Document?
		//		The target document.   Defaults to document global if unspecified.
		// returns: Mixed
		//		Either string (if there are ${} variables that need to be replaced) or just
		//		a DOM tree (if the node can be cloned directly)

		// is it already cached?
		var tmplts = _TemplatedMixin._templateCache;
		var key = templateString;
		var cached = tmplts[key];
		if(cached){
			try{
				// if the cached value is an innerHTML string (no ownerDocument) or a DOM tree created within the
				// current document, then use the current cached value
				if(!cached.ownerDocument || cached.ownerDocument == (doc || document)){
					// string or node of the same document
					return cached;
				}
			}catch(e){ /* squelch */ } // IE can throw an exception if cached.ownerDocument was reloaded
			domConstruct.destroy(cached);
		}

		templateString = string.trim(templateString);

		if(alwaysUseString || templateString.match(/\$\{([^\}]+)\}/g)){
			// there are variables in the template so all we can do is cache the string
			return (tmplts[key] = templateString); //String
		}else{
			// there are no variables in the template so we can cache the DOM tree
			var node = domConstruct.toDom(templateString, doc);
			if(node.nodeType != 1){
				throw new Error("Invalid template: " + templateString);
			}
			return (tmplts[key] = node); //Node
		}
	};

	if(has("ie")){
		on(window, "unload", function(){
			var cache = _TemplatedMixin._templateCache;
			for(var key in cache){
				var value = cache[key];
				if(typeof value == "object"){ // value is either a string or a DOM node template
					domConstruct.destroy(value);
				}
				delete cache[key];
			}
		});
	}

	return _TemplatedMixin;
});

},
'dojo/cache':function(){
define(["./_base/kernel", "./text"], function(dojo){
	// module:
	//		dojo/cache

	// dojo.cache is defined in dojo/text
	return dojo.cache;
});

},
'dojo/text':function(){
define(["./_base/kernel", "require", "./has", "./request"], function(dojo, require, has, request){
	// module:
	//		dojo/text

	var getText;
	if( 1 ){
		getText= function(url, sync, load){
			request(url, {sync:!!sync}).then(load);
		};
	}else{
		// Path for node.js and rhino, to load from local file system.
		// TODO: use node.js native methods rather than depending on a require.getText() method to exist.
		if(require.getText){
			getText= require.getText;
		}else{
			console.error("dojo/text plugin failed to load because loader does not support getText");
		}
	}

	var
		theCache = {},

		strip= function(text){
			//Strips <?xml ...?> declarations so that external SVG and XML
			//documents can be added to a document without worry. Also, if the string
			//is an HTML document, only the part inside the body tag is returned.
			if(text){
				text= text.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
				var matches= text.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
				if(matches){
					text= matches[1];
				}
			}else{
				text = "";
			}
			return text;
		},

		notFound = {},

		pending = {};

	dojo.cache = function(/*String||Object*/module, /*String*/url, /*String||Object?*/value){
		// summary:
		//		A getter and setter for storing the string content associated with the
		//		module and url arguments.
		// description:
		//		If module is a string that contains slashes, then it is interpretted as a fully
		//		resolved path (typically a result returned by require.toUrl), and url should not be
		//		provided. This is the preferred signature. If module is a string that does not
		//		contain slashes, then url must also be provided and module and url are used to
		//		call `dojo.moduleUrl()` to generate a module URL. This signature is deprecated.
		//		If value is specified, the cache value for the moduleUrl will be set to
		//		that value. Otherwise, dojo.cache will fetch the moduleUrl and store it
		//		in its internal cache and return that cached value for the URL. To clear
		//		a cache value pass null for value. Since XMLHttpRequest (XHR) is used to fetch the
		//		the URL contents, only modules on the same domain of the page can use this capability.
		//		The build system can inline the cache values though, to allow for xdomain hosting.
		// module: String||Object
		//		If a String with slashes, a fully resolved path; if a String without slashes, the
		//		module name to use for the base part of the URL, similar to module argument
		//		to `dojo.moduleUrl`. If an Object, something that has a .toString() method that
		//		generates a valid path for the cache item. For example, a dojo._Url object.
		// url: String
		//		The rest of the path to append to the path derived from the module argument. If
		//		module is an object, then this second argument should be the "value" argument instead.
		// value: String||Object?
		//		If a String, the value to use in the cache for the module/url combination.
		//		If an Object, it can have two properties: value and sanitize. The value property
		//		should be the value to use in the cache, and sanitize can be set to true or false,
		//		to indicate if XML declarations should be removed from the value and if the HTML
		//		inside a body tag in the value should be extracted as the real value. The value argument
		//		or the value property on the value argument are usually only used by the build system
		//		as it inlines cache content.
		// example:
		//		To ask dojo.cache to fetch content and store it in the cache (the dojo["cache"] style
		//		of call is used to avoid an issue with the build system erroneously trying to intern
		//		this example. To get the build system to intern your dojo.cache calls, use the
		//		"dojo.cache" style of call):
		//		| //If template.html contains "<h1>Hello</h1>" that will be
		//		| //the value for the text variable.
		//		| var text = dojo["cache"]("my.module", "template.html");
		// example:
		//		To ask dojo.cache to fetch content and store it in the cache, and sanitize the input
		//		 (the dojo["cache"] style of call is used to avoid an issue with the build system
		//		erroneously trying to intern this example. To get the build system to intern your
		//		dojo.cache calls, use the "dojo.cache" style of call):
		//		| //If template.html contains "<html><body><h1>Hello</h1></body></html>", the
		//		| //text variable will contain just "<h1>Hello</h1>".
		//		| var text = dojo["cache"]("my.module", "template.html", {sanitize: true});
		// example:
		//		Same example as previous, but demonstrates how an object can be passed in as
		//		the first argument, then the value argument can then be the second argument.
		//		| //If template.html contains "<html><body><h1>Hello</h1></body></html>", the
		//		| //text variable will contain just "<h1>Hello</h1>".
		//		| var text = dojo["cache"](new dojo._Url("my/module/template.html"), {sanitize: true});

		//	 * (string string [value]) => (module, url, value)
		//	 * (object [value])        => (module, value), url defaults to ""
		//
		//	 * if module is an object, then it must be convertable to a string
		//	 * (module, url) module + (url ? ("/" + url) : "") must be a legal argument to require.toUrl
		//	 * value may be a string or an object; if an object then may have the properties "value" and/or "sanitize"
		var key;
		if(typeof module=="string"){
			if(/\//.test(module)){
				// module is a version 1.7+ resolved path
				key = module;
				value = url;
			}else{
				// module is a version 1.6- argument to dojo.moduleUrl
				key = require.toUrl(module.replace(/\./g, "/") + (url ? ("/" + url) : ""));
			}
		}else{
			key = module + "";
			value = url;
		}
		var
			val = (value != undefined && typeof value != "string") ? value.value : value,
			sanitize = value && value.sanitize;

		if(typeof val == "string"){
			//We have a string, set cache value
			theCache[key] = val;
			return sanitize ? strip(val) : val;
		}else if(val === null){
			//Remove cached value
			delete theCache[key];
			return null;
		}else{
			//Allow cache values to be empty strings. If key property does
			//not exist, fetch it.
			if(!(key in theCache)){
				getText(key, true, function(text){
					theCache[key]= text;
				});
			}
			return sanitize ? strip(theCache[key]) : theCache[key];
		}
	};

	return {
		// summary:
		//		This module implements the dojo/text! plugin and the dojo.cache API.
		// description:
		//		We choose to include our own plugin to leverage functionality already contained in dojo
		//		and thereby reduce the size of the plugin compared to various foreign loader implementations.
		//		Also, this allows foreign AMD loaders to be used without their plugins.
		//
		//		CAUTION: this module is designed to optionally function synchronously to support the dojo v1.x synchronous
		//		loader. This feature is outside the scope of the CommonJS plugins specification.

		// the dojo/text caches it's own resources because of dojo.cache
		dynamic: true,

		normalize: function(id, toAbsMid){
			// id is something like (path may be relative):
			//
			//	 "path/to/text.html"
			//	 "path/to/text.html!strip"
			var parts= id.split("!"),
				url= parts[0];
			return (/^\./.test(url) ? toAbsMid(url) : url) + (parts[1] ? "!" + parts[1] : "");
		},

		load: function(id, require, load){
			// id: String
			//		Path to the resource.
			// require: Function
			//		Object that include the function toUrl with given id returns a valid URL from which to load the text.
			// load: Function
			//		Callback function which will be called, when the loading finished.

			// id is something like (path is always absolute):
			//
			//	 "path/to/text.html"
			//	 "path/to/text.html!strip"
			var
				parts= id.split("!"),
				stripFlag= parts.length>1,
				absMid= parts[0],
				url = require.toUrl(parts[0]),
				requireCacheUrl = "url:" + url,
				text = notFound,
				finish = function(text){
					load(stripFlag ? strip(text) : text);
				};
			if(absMid in theCache){
				text = theCache[absMid];
			}else if(require.cache && requireCacheUrl in require.cache){
				text = require.cache[requireCacheUrl];
			}else if(url in theCache){
				text = theCache[url];
			}
			if(text===notFound){
				if(pending[url]){
					pending[url].push(finish);
				}else{
					var pendingList = pending[url] = [finish];
					getText(url, !require.async, function(text){
						theCache[absMid]= theCache[url]= text;
						for(var i = 0; i<pendingList.length;){
							pendingList[i++](text);
						}
						delete pending[url];
					});
				}
			}else{
				finish(text);
			}
		}
	};

});


},
'dojo/request':function(){
define([
	'./request/default!'/*=====,
	'./_base/declare',
	'./promise/Promise' =====*/
], function(request/*=====, declare, Promise =====*/){
	/*=====
	request = function(url, options){
		// summary:
		//		Send a request using the default transport for the current platform.
		// url: String
		//		The URL to request.
		// options: dojo/request.__Options?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.__Promise = declare(Promise, {
		// response: dojo/promise/Promise
		//		A promise resolving to an object representing
		//		the response from the server.
	});
	request.__BaseOptions = declare(null, {
		// query: String|Object?
		//		Query parameters to append to the URL.
		// data: String|Object?
		//		Data to transfer.  This is ignored for GET and DELETE
		//		requests.
		// preventCache: Boolean?
		//		Whether to append a cache-busting parameter to the URL.
		// timeout: Integer?
		//		Milliseconds to wait for the response.  If this time
		//		passes, the then the promise is rejected.
		// handleAs: String?
		//		How to handle the response from the server.  Default is
		//		'text'.  Other values are 'json', 'javascript', and 'xml'.
	});
	request.__MethodOptions = declare(null, {
		// method: String?
		//		The HTTP method to use to make the request.  Must be
		//		uppercase.
	});
	request.__Options = declare([request.__BaseOptions, request.__MethodOptions]);

	request.get = function(url, options){
		// summary:
		//		Send an HTTP GET request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.post = function(url, options){
		// summary:
		//		Send an HTTP POST request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.put = function(url, options){
		// summary:
		//		Send an HTTP POST request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	request.del = function(url, options){
		// summary:
		//		Send an HTTP DELETE request using the default transport for the current platform.
		// url: String
		//		URL to request
		// options: dojo/request.__BaseOptions?
		//		Options for the request.
		// returns: dojo/request.__Promise
	};
	=====*/
	return request;
});

},
'dojo/request/default':function(){
define([
	'exports',
	'require',
	'../has'
], function(exports, require, has){
	var defId = has('config-requestProvider'),
		platformId;

	if( 1 ){
		platformId = './xhr';
	}else if( 0 ){
		platformId = './node';
	/* TODO:
	}else if( 0 ){
		platformId = './rhino';
   */
	}

	if(!defId){
		defId = platformId;
	}

	exports.getPlatformDefaultId = function(){
		return platformId;
	};

	exports.load = function(id, parentRequire, loaded, config){
		require([id == 'platform' ? platformId : defId], function(provider){
			loaded(provider);
		});
	};
});

},
'dojo/string':function(){
define([
	"./_base/kernel",	// kernel.global
	"./_base/lang"
], function(kernel, lang){

// module:
//		dojo/string

var string = {
	// summary:
	//		String utilities for Dojo
};
lang.setObject("dojo.string", string);

string.rep = function(/*String*/str, /*Integer*/num){
	// summary:
	//		Efficiently replicate a string `n` times.
	// str:
	//		the string to replicate
	// num:
	//		number of times to replicate the string

	if(num <= 0 || !str){ return ""; }

	var buf = [];
	for(;;){
		if(num & 1){
			buf.push(str);
		}
		if(!(num >>= 1)){ break; }
		str += str;
	}
	return buf.join("");	// String
};

string.pad = function(/*String*/text, /*Integer*/size, /*String?*/ch, /*Boolean?*/end){
	// summary:
	//		Pad a string to guarantee that it is at least `size` length by
	//		filling with the character `ch` at either the start or end of the
	//		string. Pads at the start, by default.
	// text:
	//		the string to pad
	// size:
	//		length to provide padding
	// ch:
	//		character to pad, defaults to '0'
	// end:
	//		adds padding at the end if true, otherwise pads at start
	// example:
	//	|	// Fill the string to length 10 with "+" characters on the right.  Yields "Dojo++++++".
	//	|	string.pad("Dojo", 10, "+", true);

	if(!ch){
		ch = '0';
	}
	var out = String(text),
		pad = string.rep(ch, Math.ceil((size - out.length) / ch.length));
	return end ? out + pad : pad + out;	// String
};

string.substitute = function(	/*String*/		template,
									/*Object|Array*/map,
									/*Function?*/	transform,
									/*Object?*/		thisObject){
	// summary:
	//		Performs parameterized substitutions on a string. Throws an
	//		exception if any parameter is unmatched.
	// template:
	//		a string with expressions in the form `${key}` to be replaced or
	//		`${key:format}` which specifies a format function. keys are case-sensitive.
	// map:
	//		hash to search for substitutions
	// transform:
	//		a function to process all parameters before substitution takes
	//		place, e.g. mylib.encodeXML
	// thisObject:
	//		where to look for optional format function; default to the global
	//		namespace
	// example:
	//		Substitutes two expressions in a string from an Array or Object
	//	|	// returns "File 'foo.html' is not found in directory '/temp'."
	//	|	// by providing substitution data in an Array
	//	|	string.substitute(
	//	|		"File '${0}' is not found in directory '${1}'.",
	//	|		["foo.html","/temp"]
	//	|	);
	//	|
	//	|	// also returns "File 'foo.html' is not found in directory '/temp'."
	//	|	// but provides substitution data in an Object structure.  Dotted
	//	|	// notation may be used to traverse the structure.
	//	|	string.substitute(
	//	|		"File '${name}' is not found in directory '${info.dir}'.",
	//	|		{ name: "foo.html", info: { dir: "/temp" } }
	//	|	);
	// example:
	//		Use a transform function to modify the values:
	//	|	// returns "file 'foo.html' is not found in directory '/temp'."
	//	|	string.substitute(
	//	|		"${0} is not found in ${1}.",
	//	|		["foo.html","/temp"],
	//	|		function(str){
	//	|			// try to figure out the type
	//	|			var prefix = (str.charAt(0) == "/") ? "directory": "file";
	//	|			return prefix + " '" + str + "'";
	//	|		}
	//	|	);
	// example:
	//		Use a formatter
	//	|	// returns "thinger -- howdy"
	//	|	string.substitute(
	//	|		"${0:postfix}", ["thinger"], null, {
	//	|			postfix: function(value, key){
	//	|				return value + " -- howdy";
	//	|			}
	//	|		}
	//	|	);

	thisObject = thisObject || kernel.global;
	transform = transform ?
		lang.hitch(thisObject, transform) : function(v){ return v; };

	return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
		function(match, key, format){
			var value = lang.getObject(key, false, map);
			if(format){
				value = lang.getObject(format, false, thisObject).call(thisObject, value, key);
			}
			return transform(value, key).toString();
		}); // String
};

string.trim = String.prototype.trim ?
	lang.trim : // aliasing to the native function
	function(str){
		str = str.replace(/^\s+/, '');
		for(var i = str.length - 1; i >= 0; i--){
			if(/\S/.test(str.charAt(i))){
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	};

/*=====
 string.trim = function(str){
	 // summary:
	 //		Trims whitespace from both sides of the string
	 // str: String
	 //		String to be trimmed
	 // returns: String
	 //		Returns the trimmed string
	 // description:
	 //		This version of trim() was taken from [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	 //		The short yet performant version of this function is dojo.trim(),
	 //		which is part of Dojo base.  Uses String.prototype.trim instead, if available.
	 return "";	// String
 };
 =====*/

	return string;
});

},
'dijit/_AttachMixin':function(){
define([
	"require",
	"dojo/_base/array", // array.forEach
	"dojo/_base/connect",	// remove for 2.0
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.getObject
	"dojo/mouse",
	"dojo/on",
	"dojo/touch",
	"./_WidgetBase"
], function(require, array, connect, declare, lang, mouse, on, touch, _WidgetBase){

	// module:
	//		dijit/_AttachMixin

	// Map from string name like "mouseenter" to synthetic event like mouse.enter
	var synthEvents = lang.delegate(touch, {
		"mouseenter": mouse.enter,
		"mouseleave": mouse.leave,
		"keypress": connect._keypress	// remove for 2.0
	});

	// To be lightweight, _AttachMixin doesn't require() dijit/a11yclick.
	// If the subclass has a template using "ondijitclick", it must load dijit/a11yclick itself.
	// In that case, the a11yclick variable below will get set to point to that synthetic event.
	var a11yclick;

	var _AttachMixin = declare("dijit._AttachMixin", null, {
		// summary:
		//		Mixin for widgets to attach to dom nodes and setup events via
		//		convenient data-dojo-attach-point and data-dojo-attach-event DOM attributes.
		//
		//		Superclass of _TemplatedMixin, and can also be used standalone when templates are pre-rendered on the
		//		server.
		//
		//		Does not [yet] handle widgets like ContentPane with this.containerNode set.   It should skip
		//		scanning for data-dojo-attach-point and data-dojo-attach-event inside this.containerNode, but it
		//		doesn't.

/*=====
		// _attachPoints: [private] String[]
		//		List of widget attribute names associated with data-dojo-attach-point=... in the
		//		template, ex: ["containerNode", "labelNode"]
		_attachPoints: [],

		// _attachEvents: [private] Handle[]
		//		List of connections associated with data-dojo-attach-event=... in the
		//		template
		_attachEvents: [],

		// attachScope: [public] Object
		//		Object to which attach points and events will be scoped.  Defaults
		//		to 'this'.
		attachScope: undefined,

		// searchContainerNode: [protected] Boolean
		//		Search descendants of this.containerNode for data-dojo-attach-point and data-dojo-attach-event.
		//		Should generally be left false (the default value) both for performance and to avoid failures when
		//		this.containerNode holds other _AttachMixin instances with their own attach points and events.
 		searchContainerNode: false,
 =====*/

		constructor: function(/*===== params, srcNodeRef =====*/){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified, replace srcNodeRef with my generated DOM tree.

			this._attachPoints = [];
			this._attachEvents = [];
		},


		buildRendering: function(){
			// summary:
			//		Attach to DOM nodes marked with special attributes.
			// tags:
			//		protected

			this.inherited(arguments);

			// recurse through the node, looking for, and attaching to, our
			// attachment points and events, which should be defined on the template node.
			this._attachTemplateNodes(this.domNode);

			this._beforeFillContent();		// hook for _WidgetsInTemplateMixin
		},

		_beforeFillContent: function(){
		},

		_attachTemplateNodes: function(rootNode){
			// summary:
			//		Iterate through the dom nodes and attach functions and nodes accordingly.
			// description:
			//		Map widget properties and functions to the handlers specified in
			//		the dom node and it's descendants. This function iterates over all
			//		nodes and looks for these properties:
			//
			//		- dojoAttachPoint/data-dojo-attach-point
			//		- dojoAttachEvent/data-dojo-attach-event
			// rootNode: DomNode
			//		The node to search for properties. All descendants will be searched.
			// tags:
			//		private

			// DFS to process all nodes except those inside of this.containerNode
			var node = rootNode;
			while(true){
				if(node.nodeType == 1 && (this._processTemplateNode(node, function(n,p){ return n.getAttribute(p); },
						this._attach) || this.searchContainerNode) && node.firstChild){
					node = node.firstChild;
				}else{
					if(node == rootNode){ return; }
					while(!node.nextSibling){
						node = node.parentNode;
						if(node == rootNode){ return; }
					}
					node = node.nextSibling;
				}
			}
		},

		_processTemplateNode: function(/*DOMNode|Widget*/ baseNode, getAttrFunc, attachFunc){
			// summary:
			//		Process data-dojo-attach-point and data-dojo-attach-event for given node or widget.
			//		Returns true if caller should process baseNode's children too.

			var ret = true;

			// Process data-dojo-attach-point
			var _attachScope = this.attachScope || this,
				attachPoint = getAttrFunc(baseNode, "dojoAttachPoint") || getAttrFunc(baseNode, "data-dojo-attach-point");
			if(attachPoint){
				var point, points = attachPoint.split(/\s*,\s*/);
				while((point = points.shift())){
					if(lang.isArray(_attachScope[point])){
						_attachScope[point].push(baseNode);
					}else{
						_attachScope[point] = baseNode;
					}
					ret = (point != "containerNode");
					this._attachPoints.push(point);
				}
			}

			// Process data-dojo-attach-event
			var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent") || getAttrFunc(baseNode, "data-dojo-attach-event");
			if(attachEvent){
				// NOTE: we want to support attributes that have the form
				// "domEvent: nativeEvent; ..."
				var event, events = attachEvent.split(/\s*,\s*/);
				var trim = lang.trim;
				while((event = events.shift())){
					if(event){
						var thisFunc = null;
						if(event.indexOf(":") != -1){
							// oh, if only JS had tuple assignment
							var funcNameArr = event.split(":");
							event = trim(funcNameArr[0]);
							thisFunc = trim(funcNameArr[1]);
						}else{
							event = trim(event);
						}
						if(!thisFunc){
							thisFunc = event;
						}

						this._attachEvents.push(attachFunc(baseNode, event, lang.hitch(_attachScope, thisFunc)));
					}
				}
			}

			return ret;
		},

		_attach: function(node, type, func){
			// summary:
			//		Roughly corresponding to dojo/on, this is the default function for processing a
			//		data-dojo-attach-event.  Meant to attach to DOMNodes, not to widgets.
			// node: DOMNode
			//		The node to setup a listener on.
			// type: String
			//		Event name like "click".
			// getAttrFunc: Function
			//		Function to get the specified property for a given DomNode/Widget.
			// attachFunc: Function?
			//		Attaches an event handler from the specified node/widget to specified function.

			// Map special type names like "mouseenter" to synthetic events.
			// Subclasses are responsible to require() dijit/a11yclick if they want to use it.
			type = type.replace(/^on/, "").toLowerCase();
			if(type == "dijitclick"){
				type = a11yclick || (a11yclick = require("./a11yclick"));
			}else{
				type = synthEvents[type] || type;
			}

			return on(node, type, func);
		},

		_detachTemplateNodes: function() {
			// summary:
			//		Detach and clean up the attachments made in _attachtempalteNodes.

			// Delete all attach points to prevent IE6 memory leaks.
			var _attachScope = this.attachScope || this;
			array.forEach(this._attachPoints, function(point){
				delete _attachScope[point];
			});
			this._attachPoints = [];

			// And same for event handlers
			array.forEach(this._attachEvents, function(handle){ handle.remove(); });
			this._attachEvents = [];
		},

		destroyRendering: function(){
			this._detachTemplateNodes();
			this.inherited(arguments);
		}
	});

	// These arguments can be specified for widgets which are used in templates.
	// Since any widget can be specified as sub widgets in template, mix it
	// into the base widget class.  (This is a hack, but it's effective.).
	// Remove for 2.0.   Also, hide from API doc parser.
	lang.extend(_WidgetBase, /*===== {} || =====*/ {
		dojoAttachEvent: "",
		dojoAttachPoint: ""
	});
	
	return _AttachMixin;
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
'dijit/_CssStateMixin':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.isDescendant()
	"dojo/dom-class", // domClass.toggle
	"dojo/has",
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/domReady",
	"dojo/touch",
	"dojo/_base/window", // win.body
	"./a11yclick",
	"./registry"
], function(array, declare, dom, domClass, has, lang, on, domReady, touch, win, a11yclick, registry){

	// module:
	//		dijit/_CssStateMixin

	var CssStateMixin = declare("dijit._CssStateMixin", [], {
		// summary:
		//		Mixin for widgets to set CSS classes on the widget DOM nodes depending on hover/mouse press/focus
		//		state changes, and also higher-level state changes such becoming disabled or selected.
		//
		// description:
		//		By mixing this class into your widget, and setting the this.baseClass attribute, it will automatically
		//		maintain CSS classes on the widget root node (this.domNode) depending on hover,
		//		active, focus, etc. state.   Ex: with a baseClass of dijitButton, it will apply the classes
		//		dijitButtonHovered and dijitButtonActive, as the user moves the mouse over the widget and clicks it.
		//
		//		It also sets CSS like dijitButtonDisabled based on widget semantic state.
		//
		//		By setting the cssStateNodes attribute, a widget can also track events on subnodes (like buttons
		//		within the widget).

		/*=====
		 // cssStateNodes: [protected] Object
		 //		Subclasses may define a cssStateNodes property that lists sub-nodes within the widget that
		 //		need CSS classes applied on mouse hover/press and focus.
		 //
		 //		Each entry in this optional hash is a an attach-point name (like "upArrowButton") mapped to a CSS class name
		 //		(like "dijitUpArrowButton"). Example:
		 //	|		{
		 //	|			"upArrowButton": "dijitUpArrowButton",
		 //	|			"downArrowButton": "dijitDownArrowButton"
		 //	|		}
		 //		The above will set the CSS class dijitUpArrowButton to the this.upArrowButton DOMNode when it
		 //		is hovered, etc.
		 cssStateNodes: {},
		 =====*/

		// hovering: [readonly] Boolean
		//		True if cursor is over this widget
		hovering: false,

		// active: [readonly] Boolean
		//		True if mouse was pressed while over this widget, and hasn't been released yet
		active: false,

		_applyAttributes: function(){
			// This code would typically be in postCreate(), but putting in _applyAttributes() for
			// performance: so the class changes happen before DOM is inserted into the document.
			// Change back to postCreate() in 2.0.  See #11635.

			this.inherited(arguments);

			// Monitoring changes to disabled, readonly, etc. state, and update CSS class of root node
			array.forEach(["disabled", "readOnly", "checked", "selected", "focused", "state", "hovering", "active", "_opened"], function(attr){
				this.watch(attr, lang.hitch(this, "_setStateClass"));
			}, this);

			// Track hover and active mouse events on widget root node, plus possibly on subnodes
			for(var ap in this.cssStateNodes || {}){
				this._trackMouseState(this[ap], this.cssStateNodes[ap]);
			}
			this._trackMouseState(this.domNode, this.baseClass);

			// Set state initially; there's probably no hover/active/focus state but widget might be
			// disabled/readonly/checked/selected so we want to set CSS classes for those conditions.
			this._setStateClass();
		},

		_cssMouseEvent: function(/*Event*/ event){
			// summary:
			//		Handler for CSS event on this.domNode. Sets hovering and active properties depending on mouse state,
			//		which triggers _setStateClass() to set appropriate CSS classes for this.domNode.

			if(!this.disabled){
				switch(event.type){
					case "mouseover":
					case "MSPointerOver":
						this._set("hovering", true);
						this._set("active", this._mouseDown);
						break;
					case "mouseout":
					case "MSPointerOut":
						this._set("hovering", false);
						this._set("active", false);
						break;
					case "mousedown":
					case "touchstart":
					case "MSPointerDown":
					case "keydown":
						this._set("active", true);
						break;
					case "mouseup":
					case "dojotouchend":
					case "keyup":
						this._set("active", false);
						break;
				}
			}
		},

		_setStateClass: function(){
			// summary:
			//		Update the visual state of the widget by setting the css classes on this.domNode
			//		(or this.stateNode if defined) by combining this.baseClass with
			//		various suffixes that represent the current widget state(s).
			//
			// description:
			//		In the case where a widget has multiple
			//		states, it sets the class based on all possible
			//		combinations.  For example, an invalid form widget that is being hovered
			//		will be "dijitInput dijitInputInvalid dijitInputHover dijitInputInvalidHover".
			//
			//		The widget may have one or more of the following states, determined
			//		by this.state, this.checked, this.valid, and this.selected:
			//
			//		- Error - ValidationTextBox sets this.state to "Error" if the current input value is invalid
			//		- Incomplete - ValidationTextBox sets this.state to "Incomplete" if the current input value is not finished yet
			//		- Checked - ex: a checkmark or a ToggleButton in a checked state, will have this.checked==true
			//		- Selected - ex: currently selected tab will have this.selected==true
			//
			//		In addition, it may have one or more of the following states,
			//		based on this.disabled and flags set in _onMouse (this.active, this.hovering) and from focus manager (this.focused):
			//
			//		- Disabled	- if the widget is disabled
			//		- Active		- if the mouse (or space/enter key?) is being pressed down
			//		- Focused		- if the widget has focus
			//		- Hover		- if the mouse is over the widget

			// Compute new set of classes
			var newStateClasses = this.baseClass.split(" ");

			function multiply(modifier){
				newStateClasses = newStateClasses.concat(array.map(newStateClasses, function(c){
					return c + modifier;
				}), "dijit" + modifier);
			}

			if(!this.isLeftToRight()){
				// For RTL mode we need to set an addition class like dijitTextBoxRtl.
				multiply("Rtl");
			}

			var checkedState = this.checked == "mixed" ? "Mixed" : (this.checked ? "Checked" : "");
			if(this.checked){
				multiply(checkedState);
			}
			if(this.state){
				multiply(this.state);
			}
			if(this.selected){
				multiply("Selected");
			}
			if(this._opened){
				multiply("Opened");
			}

			if(this.disabled){
				multiply("Disabled");
			}else if(this.readOnly){
				multiply("ReadOnly");
			}else{
				if(this.active){
					multiply("Active");
				}else if(this.hovering){
					multiply("Hover");
				}
			}

			if(this.focused){
				multiply("Focused");
			}

			// Remove old state classes and add new ones.
			// For performance concerns we only write into domNode.className once.
			var tn = this.stateNode || this.domNode,
				classHash = {};	// set of all classes (state and otherwise) for node

			array.forEach(tn.className.split(" "), function(c){
				classHash[c] = true;
			});

			if("_stateClasses" in this){
				array.forEach(this._stateClasses, function(c){
					delete classHash[c];
				});
			}

			array.forEach(newStateClasses, function(c){
				classHash[c] = true;
			});

			var newClasses = [];
			for(var c in classHash){
				newClasses.push(c);
			}
			tn.className = newClasses.join(" ");

			this._stateClasses = newStateClasses;
		},

		_subnodeCssMouseEvent: function(node, clazz, evt){
			// summary:
			//		Handler for hover/active mouse event on widget's subnode
			if(this.disabled || this.readOnly){
				return;
			}

			function hover(isHovering){
				domClass.toggle(node, clazz + "Hover", isHovering);
			}

			function active(isActive){
				domClass.toggle(node, clazz + "Active", isActive);
			}

			function focused(isFocused){
				domClass.toggle(node, clazz + "Focused", isFocused);
			}

			switch(evt.type){
				case "mouseover":
				case "MSPointerOver":
					hover(true);
					break;
				case "mouseout":
				case "MSPointerOut":
					hover(false);
					active(false);
					break;
				case "mousedown":
				case "touchstart":
				case "MSPointerDown":
				case "keydown":
					active(true);
					break;
				case "mouseup":
				case "MSPointerUp":
				case "dojotouchend":
				case "keyup":
					active(false);
					break;
				case "focus":
				case "focusin":
					focused(true);
					break;
				case "blur":
				case "focusout":
					focused(false);
					break;
			}
		},

		_trackMouseState: function(/*DomNode*/ node, /*String*/ clazz){
			// summary:
			//		Track mouse/focus events on specified node and set CSS class on that node to indicate
			//		current state.   Usually not called directly, but via cssStateNodes attribute.
			// description:
			//		Given class=foo, will set the following CSS class on the node
			//
			//		- fooActive: if the user is currently pressing down the mouse button while over the node
			//		- fooHover: if the user is hovering the mouse over the node, but not pressing down a button
			//		- fooFocus: if the node is focused
			//
			//		Note that it won't set any classes if the widget is disabled.
			// node: DomNode
			//		Should be a sub-node of the widget, not the top node (this.domNode), since the top node
			//		is handled specially and automatically just by mixing in this class.
			// clazz: String
			//		CSS class name (ex: dijitSliderUpArrow)

			// Flag for listener code below to call this._cssMouseEvent() or this._subnodeCssMouseEvent()
			// when node is hovered/active
			node._cssState = clazz;
		}
	});

	domReady(function(){
		// Document level listener to catch hover etc. events on widget root nodes and subnodes.
		// Note that when the mouse is moved quickly, a single onmouseenter event could signal that multiple widgets
		// have been hovered or unhovered (try test_Accordion.html)

		function pointerHandler(evt, target, relatedTarget){
			// Handler for mouseover, mouseout, a11yclick.press and a11click.release events

			// Poor man's event propagation.  Don't propagate event to ancestors of evt.relatedTarget,
			// to avoid processing mouseout events moving from a widget's domNode to a descendant node;
			// such events shouldn't be interpreted as a mouseleave on the widget.
			if(relatedTarget && dom.isDescendant(relatedTarget, target)){
				return;
			}

			for(var node = target; node && node != relatedTarget; node = node.parentNode){
				// Process any nodes with _cssState property.   They are generally widget root nodes,
				// but could also be sub-nodes within a widget
				if(node._cssState){
					var widget = registry.getEnclosingWidget(node);
					if(widget){
						if(node == widget.domNode){
							// event on the widget's root node
							widget._cssMouseEvent(evt);
						}else{
							// event on widget's sub-node
							widget._subnodeCssMouseEvent(node, node._cssState, evt);
						}
					}
				}
			}
		}

		var body = win.body(), activeNode;

		// Handle pointer related events (i.e. mouse or touch)
		on(body, touch.over, function(evt){
			// Using touch.over rather than mouseover mainly to ignore phantom mouse events on iOS.
			pointerHandler(evt, evt.target, evt.relatedTarget);
		});
		on(body, touch.out, function(evt){
			// Using touch.out rather than mouseout mainly to ignore phantom mouse events on iOS.
			pointerHandler(evt, evt.target, evt.relatedTarget);
		});
		on(body, a11yclick.press, function(evt){
			// Save the a11yclick.press target to reference when the a11yclick.release comes.
			activeNode = evt.target;
			pointerHandler(evt, activeNode)
		});
		on(body, a11yclick.release, function(evt){
			// The release event could come on a separate node than the press event, if for example user slid finger.
			// Reference activeNode to reset the state of the node that got state set in the a11yclick.press handler.
			pointerHandler(evt, activeNode);
			activeNode = null;
		});

		// Track focus events on widget sub-nodes that have been registered via _trackMouseState().
		// However, don't track focus events on the widget root nodes, because focus is tracked via the
		// focus manager (and it's not really tracking focus, but rather tracking that focus is on one of the widget's
		// nodes or a subwidget's node or a popup node, etc.)
		// Remove for 2.0 (if focus CSS needed, just use :focus pseudo-selector).
		on(body, "focusin, focusout", function(evt){
			var node = evt.target;
			if(node._cssState && !node.getAttribute("widgetId")){
				var widget = registry.getEnclosingWidget(node);
				if(widget){
					widget._subnodeCssMouseEvent(node, node._cssState, evt);
				}
			}
		});
	});

	return CssStateMixin;
});

},
'dijit/_KeyNavMixin':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/keys", // keys.END keys.HOME, keys.LEFT_ARROW etc.
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dijit/registry",
	"dijit/_FocusMixin"        // to make _onBlur() work
], function(array, declare, domAttr, keys, lang, on, registry, _FocusMixin){

	// module:
	//		dijit/_KeyNavMixin

	return declare("dijit._KeyNavMixin", _FocusMixin, {
		// summary:
		//		A mixin to allow arrow key and letter key navigation of child or descendant widgets.
		//		It can be used by dijit/_Container based widgets with a flat list of children,
		//		or more complex widgets like dijit/Tree.
		//
		//		To use this mixin, the subclass must:
		//
		//			- Implement  _getNext(), _getFirst(), _getLast(), _onLeftArrow(), _onRightArrow()
		//			  _onDownArrow(), _onUpArrow() methods to handle home/end/left/right/up/down keystrokes.
		//			  Next and previous in this context refer to a linear ordering of the descendants used
		//			  by letter key search.
		//			- Set all descendants' initial tabIndex to "-1"; both initial descendants and any
		//			  descendants added later, by for example addChild()
		//			- Define childSelector to a function or string that identifies focusable descendant widgets
		//
		//		Also, child widgets must implement a focus() method.

		/*=====
		 // focusedChild: [protected readonly] Widget
		 //		The currently focused child widget, or null if there isn't one
		 focusedChild: null,

		 // _keyNavCodes: Object
		 //		Hash mapping key code (arrow keys and home/end key) to functions to handle those keys.
		 //		Usually not used directly, as subclasses can instead override _onLeftArrow() etc.
		 _keyNavCodes: {},
		 =====*/

		// tabIndex: String
		//		Tab index of the container; same as HTML tabIndex attribute.
		//		Note then when user tabs into the container, focus is immediately
		//		moved to the first item in the container.
		tabIndex: "0",

		// childSelector: [protected abstract] Function||String
		//		Selector (passed to on.selector()) used to identify what to treat as a child widget.   Used to monitor
		//		focus events and set this.focusedChild.   Must be set by implementing class.   If this is a string
		//		(ex: "> *") then the implementing class must require dojo/query.
		childSelector: null,

		postCreate: function(){
			this.inherited(arguments);

			// Set tabIndex on this.domNode.  Will be automatic after #7381 is fixed.
			domAttr.set(this.domNode, "tabIndex", this.tabIndex);

			if(!this._keyNavCodes){
				var keyCodes = this._keyNavCodes = {};
				keyCodes[keys.HOME] = lang.hitch(this, "focusFirstChild");
				keyCodes[keys.END] = lang.hitch(this, "focusLastChild");
				keyCodes[this.isLeftToRight() ? keys.LEFT_ARROW : keys.RIGHT_ARROW] = lang.hitch(this, "_onLeftArrow");
				keyCodes[this.isLeftToRight() ? keys.RIGHT_ARROW : keys.LEFT_ARROW] = lang.hitch(this, "_onRightArrow");
				keyCodes[keys.UP_ARROW] = lang.hitch(this, "_onUpArrow");
				keyCodes[keys.DOWN_ARROW] = lang.hitch(this, "_onDownArrow");
			}

			var self = this,
				childSelector = typeof this.childSelector == "string"
					? this.childSelector
					: lang.hitch(this, "childSelector");
			this.own(
				on(this.domNode, "keypress", lang.hitch(this, "_onContainerKeypress")),
				on(this.domNode, "keydown", lang.hitch(this, "_onContainerKeydown")),
				on(this.domNode, "focus", lang.hitch(this, "_onContainerFocus")),
				on(this.containerNode, on.selector(childSelector, "focusin"), function(evt){
					self._onChildFocus(registry.getEnclosingWidget(this), evt);
				})
			);
		},

		_onLeftArrow: function(){
			// summary:
			//		Called on left arrow key, or right arrow key if widget is in RTL mode.
			//		Should go back to the previous child in horizontal container widgets like Toolbar.
			// tags:
			//		extension
		},

		_onRightArrow: function(){
			// summary:
			//		Called on right arrow key, or left arrow key if widget is in RTL mode.
			//		Should go to the next child in horizontal container widgets like Toolbar.
			// tags:
			//		extension
		},

		_onUpArrow: function(){
			// summary:
			//		Called on up arrow key. Should go to the previous child in vertical container widgets like Menu.
			// tags:
			//		extension
		},

		_onDownArrow: function(){
			// summary:
			//		Called on down arrow key. Should go to the next child in vertical container widgets like Menu.
			// tags:
			//		extension
		},

		focus: function(){
			// summary:
			//		Default focus() implementation: focus the first child.
			this.focusFirstChild();
		},

		_getFirstFocusableChild: function(){
			// summary:
			//		Returns first child that can be focused.

			// Leverage _getNextFocusableChild() to skip disabled children
			return this._getNextFocusableChild(null, 1);	// dijit/_WidgetBase
		},

		_getLastFocusableChild: function(){
			// summary:
			//		Returns last child that can be focused.

			// Leverage _getNextFocusableChild() to skip disabled children
			return this._getNextFocusableChild(null, -1);	// dijit/_WidgetBase
		},

		focusFirstChild: function(){
			// summary:
			//		Focus the first focusable child in the container.
			// tags:
			//		protected

			this.focusChild(this._getFirstFocusableChild());
		},

		focusLastChild: function(){
			// summary:
			//		Focus the last focusable child in the container.
			// tags:
			//		protected

			this.focusChild(this._getLastFocusableChild());
		},

		focusChild: function(/*dijit/_WidgetBase*/ widget, /*Boolean*/ last){
			// summary:
			//		Focus specified child widget.
			// widget:
			//		Reference to container's child widget
			// last:
			//		If true and if widget has multiple focusable nodes, focus the
			//		last one instead of the first one
			// tags:
			//		protected

			if(!widget){
				return;
			}

			if(this.focusedChild && widget !== this.focusedChild){
				this._onChildBlur(this.focusedChild);	// used to be used by _MenuBase
			}
			widget.set("tabIndex", this.tabIndex);	// for IE focus outline to appear, must set tabIndex before focus
			widget.focus(last ? "end" : "start");

			// Don't set focusedChild here, because the focus event should trigger a call to _onChildFocus(), which will
			// set it.   More importantly, _onChildFocus(), which may be executed asynchronously (after this function
			// returns) needs to know the old focusedChild to set its tabIndex to -1.
		},

		_onContainerFocus: function(evt){
			// summary:
			//		Handler for when the container itself gets focus.
			// description:
			//		Initially the container itself has a tabIndex, but when it gets
			//		focus, switch focus to first child.
			//
			//		TODO for 2.0 (or earlier): Instead of having the container tabbable, always maintain a single child
			//		widget as tabbable, Requires code in startup(), addChild(), and removeChild().
			//		That would avoid various issues like #17347.
			// tags:
			//		private

			// Note that we can't use _onFocus() because switching focus from the
			// _onFocus() handler confuses the focus.js code
			// (because it causes _onFocusNode() to be called recursively).
			// Also, _onFocus() would fire when focus went directly to a child widget due to mouse click.

			// Ignore spurious focus events:
			//	1. focus on a child widget bubbles on FF
			//	2. on IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
			if(evt.target !== this.domNode || this.focusedChild){
				return;
			}

			this.focus();
		},

		_onFocus: function(){
			// When the container gets focus by being tabbed into, or a descendant gets focus by being clicked,
			// set the container's tabIndex to -1 (don't remove as that breaks Safari 4) so that tab or shift-tab
			// will go to the fields after/before the container, rather than the container itself
			domAttr.set(this.domNode, "tabIndex", "-1");

			this.inherited(arguments);
		},

		_onBlur: function(evt){
			// When focus is moved away the container, and its descendant (popup) widgets,
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)

			// TODO: for 2.0 consider changing this to blur whenever the container blurs, to be truthful that there is
			// no focused child at that time.

			domAttr.set(this.domNode, "tabIndex", this.tabIndex);
			if(this.focusedChild){
				this.focusedChild.set("tabIndex", "-1");
				this.lastFocusedChild = this.focusedChild;
				this._set("focusedChild", null);
			}
			this.inherited(arguments);
		},

		_onChildFocus: function(/*dijit/_WidgetBase*/ child){
			// summary:
			//		Called when a child widget gets focus, either by user clicking
			//		it, or programatically by arrow key handling code.
			// description:
			//		It marks that the current node is the selected one, and the previously
			//		selected node no longer is.

			if(child && child != this.focusedChild){
				if(this.focusedChild && !this.focusedChild._destroyed){
					// mark that the previously focusable node is no longer focusable
					this.focusedChild.set("tabIndex", "-1");
				}

				// mark that the new node is the currently selected one
				child.set("tabIndex", this.tabIndex);
				this.lastFocused = child;		// back-compat for Tree, remove for 2.0
				this._set("focusedChild", child);
			}
		},

		_searchString: "",
		// multiCharSearchDuration: Number
		//		If multiple characters are typed where each keystroke happens within
		//		multiCharSearchDuration of the previous keystroke,
		//		search for nodes matching all the keystrokes.
		//
		//		For example, typing "ab" will search for entries starting with
		//		"ab" unless the delay between "a" and "b" is greater than multiCharSearchDuration.
		multiCharSearchDuration: 1000,

		onKeyboardSearch: function(/*dijit/_WidgetBase*/ item, /*Event*/ evt, /*String*/ searchString, /*Number*/ numMatches){
			// summary:
			//		When a key is pressed that matches a child item,
			//		this method is called so that a widget can take appropriate action is necessary.
			// tags:
			//		protected
			if(item){
				this.focusChild(item);
			}
		},

		_keyboardSearchCompare: function(/*dijit/_WidgetBase*/ item, /*String*/ searchString){
			// summary:
			//		Compares the searchString to the widget's text label, returning:
			//
			//			* -1: a high priority match  and stop searching
			//		 	* 0: not a match
			//		 	* 1: a match but keep looking for a higher priority match
			// tags:
			//		private

			var element = item.domNode,
				text = item.label || (element.focusNode ? element.focusNode.label : '') || element.innerText || element.textContent || "",
				currentString = text.replace(/^\s+/, '').substr(0, searchString.length).toLowerCase();

			return (!!searchString.length && currentString == searchString) ? -1 : 0; // stop searching after first match by default
		},

		_onContainerKeydown: function(evt){
			// summary:
			//		When a key is pressed, if it's an arrow key etc. then it's handled here.
			// tags:
			//		private

			var func = this._keyNavCodes[evt.keyCode];
			if(func){
				func(evt, this.focusedChild);
				evt.stopPropagation();
				evt.preventDefault();
				this._searchString = ''; // so a DOWN_ARROW b doesn't search for ab
			}else if(evt.keyCode == keys.SPACE && this._searchTimer && !(evt.ctrlKey || evt.altKey || evt.metaKey)){
				evt.stopImmediatePropagation(); // stop a11yclick and _HasDropdown from seeing SPACE if we're doing keyboard searching
				evt.preventDefault(); // stop IE from scrolling, and most browsers (except FF) from sending keypress
				this._keyboardSearch(evt, ' ');
			}
		},

		_onContainerKeypress: function(evt){
			// summary:
			//		When a printable key is pressed, it's handled here, searching by letter.
			// tags:
			//		private

			if(evt.charCode < keys.SPACE || evt.ctrlKey || evt.altKey || evt.metaKey ||
					(evt.charCode == keys.SPACE && this._searchTimer)){
				// Avoid duplicate events on firefox (ex: arrow key that will be handled by keydown handler),
				// and also control sequences like CMD-Q
				return;
			}
			evt.preventDefault();
			evt.stopPropagation();

			this._keyboardSearch(evt, String.fromCharCode(evt.charCode).toLowerCase());
		},

		_keyboardSearch: function(/*Event*/ evt, /*String*/ keyChar){
			// summary:
			//		Perform a search of the widget's options based on the user's keyboard activity
			// description:
			//		Called on keypress (and sometimes keydown), searches through this widget's children
			//		looking for items that match the user's typed search string.  Multiple characters
			//		typed within 1 sec of each other are combined for multicharacter searching.
			// tags:
			//		private
			var
				matchedItem = null,
				searchString,
				numMatches = 0,
				search = lang.hitch(this, function(){
					if(this._searchTimer){
						this._searchTimer.remove();
					}
					this._searchString += keyChar;
					var allSameLetter = /^(.)\1*$/.test(this._searchString);
					var searchLen = allSameLetter ? 1 : this._searchString.length;
					searchString = this._searchString.substr(0, searchLen);
					// commented out code block to search again if the multichar search fails after a smaller timeout
					//this._searchTimer = this.defer(function(){ // this is the "failure" timeout
					//	this._typingSlowly = true; // if the search fails, then treat as a full timeout
					//	this._searchTimer = this.defer(function(){ // this is the "success" timeout
					//		this._searchTimer = null;
					//		this._searchString = '';
					//	}, this.multiCharSearchDuration >> 1);
					//}, this.multiCharSearchDuration >> 1);
					this._searchTimer = this.defer(function(){ // this is the "success" timeout
						this._searchTimer = null;
						this._searchString = '';
					}, this.multiCharSearchDuration);
					var currentItem = this.focusedChild || null;
					if(searchLen == 1 || !currentItem){
						currentItem = this._getNextFocusableChild(currentItem, 1); // skip current
						if(!currentItem){
							return;
						} // no items
					}
					var stop = currentItem;
					do{
						var rc = this._keyboardSearchCompare(currentItem, searchString);
						if(!!rc && numMatches++ == 0){
							matchedItem = currentItem;
						}
						if(rc == -1){ // priority match
							numMatches = -1;
							break;
						}
						currentItem = this._getNextFocusableChild(currentItem, 1);
					}while(currentItem != stop);
					// commented out code block to search again if the multichar search fails after a smaller timeout
					//if(!numMatches && (this._typingSlowly || searchLen == 1)){
					//	this._searchString = '';
					//	if(searchLen > 1){
					//		// if no matches and they're typing slowly, then go back to first letter searching
					//		search();
					//	}
					//}
				});

			search();
			// commented out code block to search again if the multichar search fails after a smaller timeout
			//this._typingSlowly = false;
			this.onKeyboardSearch(matchedItem, evt, searchString, numMatches);
		},

		_onChildBlur: function(/*dijit/_WidgetBase*/ /*===== widget =====*/){
			// summary:
			//		Called when focus leaves a child widget to go
			//		to a sibling widget.
			//		Used to be used by MenuBase.js (remove for 2.0)
			// tags:
			//		protected
		},

		_getNextFocusableChild: function(child, dir){
			// summary:
			//		Returns the next or previous focusable descendant, compared to "child".
			//		Implements and extends _KeyNavMixin._getNextFocusableChild() for a _Container.
			// child: Widget
			//		The current widget
			// dir: Integer
			//		- 1 = after
			//		- -1 = before
			// tags:
			//		abstract extension

			var wrappedValue = child;
			do{
				if(!child){
					child = this[dir > 0 ? "_getFirst" : "_getLast"]();
					if(!child){ break; }
				}else{
					child = this._getNext(child, dir);
				}
				if(child != null && child != wrappedValue && child.isFocusable()){
					return child;	// dijit/_WidgetBase
				}
			}while(child != wrappedValue);
			// no focusable child found
			return null;	// dijit/_WidgetBase
		},

		_getFirst: function(){
			// summary:
			//		Returns the first child.
			// tags:
			//		abstract extension

			return null;	// dijit/_WidgetBase
		},

		_getLast: function(){
			// summary:
			//		Returns the last descendant.
			// tags:
			//		abstract extension

			return null;	// dijit/_WidgetBase
		},

		_getNext: function(child, dir){
			// summary:
			//		Returns the next descendant, compared to "child".
			// child: Widget
			//		The current widget
			// dir: Integer
			//		- 1 = after
			//		- -1 = before
			// tags:
			//		abstract extension

			if(child){
				child = child.domNode;
				while(child){
					child = child[dir < 0 ? "previousSibling" : "nextSibling"];
					if(child  && "getAttribute" in child){
						var w = registry.byNode(child);
						if(w){
							return w; // dijit/_WidgetBase
						}
					}
				}
			}
			return null;	// dijit/_WidgetBase
		}
	});
});

},
'dijit/tree/TreeStoreModel':function(){
define([
	"dojo/_base/array", // array.filter array.forEach array.indexOf array.some
	"dojo/aspect", // aspect.after
	"dojo/_base/declare", // declare
	"dojo/_base/lang" // lang.hitch
], function(array, aspect, declare, lang){

	// module:
	//		dijit/tree/TreeStoreModel

	return declare("dijit.tree.TreeStoreModel", null, {
		// summary:
		//		Implements dijit/Tree/model connecting to a dojo.data store with a single
		//		root item.  Any methods passed into the constructor will override
		//		the ones defined here.

		// store: dojo/data/api/Read
		//		Underlying store
		store: null,

		// childrenAttrs: String[]
		//		One or more attribute names (attributes in the dojo.data item) that specify that item's children
		childrenAttrs: ["children"],

		// newItemIdAttr: String
		//		Name of attribute in the Object passed to newItem() that specifies the id.
		//
		//		If newItemIdAttr is set then it's used when newItem() is called to see if an
		//		item with the same id already exists, and if so just links to the old item
		//		(so that the old item ends up with two parents).
		//
		//		Setting this to null or "" will make every drop create a new item.
		newItemIdAttr: "id",

		// labelAttr: String
		//		If specified, get label for tree node from this attribute, rather
		//		than by calling store.getLabel()
		labelAttr: "",

		// root: [readonly] dojo/data/Item
		//		Pointer to the root item (read only, not a parameter)
		root: null,

		// query: anything
		//		Specifies datastore query to return the root item for the tree.
		//		Must only return a single item.   Alternately can just pass in pointer
		//		to root item.
		// example:
		//	|	{id:'ROOT'}
		query: null,

		// deferItemLoadingUntilExpand: Boolean
		//		Setting this to true will cause the TreeStoreModel to defer calling loadItem on nodes
		//		until they are expanded. This allows for lazying loading where only one
		//		loadItem (and generally one network call, consequently) per expansion
		//		(rather than one for each child).
		//		This relies on partial loading of the children items; each children item of a
		//		fully loaded item should contain the label and info about having children.
		deferItemLoadingUntilExpand: false,

		constructor: function(/* Object */ args){
			// summary:
			//		Passed the arguments listed above (store, etc)
			// tags:
			//		private

			lang.mixin(this, args);

			this.connects = [];

			var store = this.store;
			if(!store.getFeatures()['dojo.data.api.Identity']){
				throw new Error("dijit.tree.TreeStoreModel: store must support dojo.data.Identity");
			}

			// if the store supports Notification, subscribe to the notification events
			if(store.getFeatures()['dojo.data.api.Notification']){
				this.connects = this.connects.concat([
					aspect.after(store, "onNew", lang.hitch(this, "onNewItem"), true),
					aspect.after(store, "onDelete", lang.hitch(this, "onDeleteItem"), true),
					aspect.after(store, "onSet", lang.hitch(this, "onSetItem"), true)
				]);
			}
		},

		destroy: function(){
			var h;
			while(h = this.connects.pop()){ h.remove(); }
			// TODO: should cancel any in-progress processing of getRoot(), getChildren()
		},

		// =======================================================================
		// Methods for traversing hierarchy

		getRoot: function(onItem, onError){
			// summary:
			//		Calls onItem with the root item for the tree, possibly a fabricated item.
			//		Calls onError on error.
			if(this.root){
				onItem(this.root);
			}else{
				this.store.fetch({
					query: this.query,
					onComplete: lang.hitch(this, function(items){
						if(items.length != 1){
							throw new Error("dijit.tree.TreeStoreModel: root query returned " + items.length +
								" items, but must return exactly one");
						}
						this.root = items[0];
						onItem(this.root);
					}),
					onError: onError
				});
			}
		},

		mayHaveChildren: function(/*dojo/data/Item*/ item){
			// summary:
			//		Tells if an item has or may have children.  Implementing logic here
			//		avoids showing +/- expando icon for nodes that we know don't have children.
			//		(For efficiency reasons we may not want to check if an element actually
			//		has children until user clicks the expando node)
			return array.some(this.childrenAttrs, function(attr){
				return this.store.hasAttribute(item, attr);
			}, this);
		},

		getChildren: function(/*dojo/data/Item*/ parentItem, /*function(items)*/ onComplete, /*function*/ onError){
			// summary:
			//		Calls onComplete() with array of child items of given parent item, all loaded.

			var store = this.store;
			if(!store.isItemLoaded(parentItem)){
				// The parent is not loaded yet, we must be in deferItemLoadingUntilExpand
				// mode, so we will load it and just return the children (without loading each
				// child item)
				var getChildren = lang.hitch(this, arguments.callee);
				store.loadItem({
					item: parentItem,
					onItem: function(parentItem){
						getChildren(parentItem, onComplete, onError);
					},
					onError: onError
				});
				return;
			}
			// get children of specified item
			var childItems = [];
			for(var i=0; i<this.childrenAttrs.length; i++){
				var vals = store.getValues(parentItem, this.childrenAttrs[i]);
				childItems = childItems.concat(vals);
			}

			// count how many items need to be loaded
			var _waitCount = 0;
			if(!this.deferItemLoadingUntilExpand){
				array.forEach(childItems, function(item){ if(!store.isItemLoaded(item)){ _waitCount++; } });
			}

			if(_waitCount == 0){
				// all items are already loaded (or we aren't loading them).  proceed...
				onComplete(childItems);
			}else{
				// still waiting for some or all of the items to load
				array.forEach(childItems, function(item, idx){
					if(!store.isItemLoaded(item)){
						store.loadItem({
							item: item,
							onItem: function(item){
								childItems[idx] = item;
								if(--_waitCount == 0){
									// all nodes have been loaded, send them to the tree
									onComplete(childItems);
								}
							},
							onError: onError
						});
					}
				});
			}
		},

		// =======================================================================
		// Inspecting items

		isItem: function(/* anything */ something){
			return this.store.isItem(something);	// Boolean
		},

		fetchItemByIdentity: function(/* object */ keywordArgs){
			// summary:
			//		Given the identity of an item, this method returns the item that has
			//		that identity through the onItem callback.  Conforming implementations
			//		should return null if there is no item with the given identity.
			//		Implementations of fetchItemByIdentity() may sometimes return an item
			//		from a local cache and may sometimes fetch an item from a remote server.
			// tags:
			//		extension
			this.store.fetchItemByIdentity(keywordArgs);
		},

		getIdentity: function(/* item */ item){
			return this.store.getIdentity(item);	// Object
		},

		getLabel: function(/*dojo/data/Item*/ item){
			// summary:
			//		Get the label for an item
			if(this.labelAttr){
				return this.store.getValue(item,this.labelAttr);	// String
			}else{
				return this.store.getLabel(item);	// String
			}
		},

		// =======================================================================
		// Write interface

		newItem: function(/* dijit/tree/dndSource.__Item */ args, /*dojo/data/api/Item*/ parent, /*int?*/ insertIndex){
			// summary:
			//		Creates a new item.   See `dojo/data/api/Write` for details on args.
			//		Used in drag & drop when item from external source dropped onto tree.
			// description:
			//		Developers will need to override this method if new items get added
			//		to parents with multiple children attributes, in order to define which
			//		children attribute points to the new item.

			var pInfo = {parent: parent, attribute: this.childrenAttrs[0]}, LnewItem;

			if(this.newItemIdAttr && args[this.newItemIdAttr]){
				// Maybe there's already a corresponding item in the store; if so, reuse it.
				this.fetchItemByIdentity({identity: args[this.newItemIdAttr], scope: this, onItem: function(item){
					if(item){
						// There's already a matching item in store, use it
						this.pasteItem(item, null, parent, true, insertIndex);
					}else{
						// Create new item in the tree, based on the drag source.
						LnewItem=this.store.newItem(args, pInfo);
						if(LnewItem && (insertIndex!=undefined)){
							// Move new item to desired position
							this.pasteItem(LnewItem, parent, parent, false, insertIndex);
						}
					}
				}});
			}else{
				// [as far as we know] there is no id so we must assume this is a new item
				LnewItem=this.store.newItem(args, pInfo);
				if(LnewItem && (insertIndex!=undefined)){
					// Move new item to desired position
					this.pasteItem(LnewItem, parent, parent, false, insertIndex);
				}
			}
		},

		pasteItem: function(/*Item*/ childItem, /*Item*/ oldParentItem, /*Item*/ newParentItem, /*Boolean*/ bCopy, /*int?*/ insertIndex){
			// summary:
			//		Move or copy an item from one parent item to another.
			//		Used in drag & drop
			var store = this.store,
				parentAttr = this.childrenAttrs[0];	// name of "children" attr in parent item

			// remove child from source item, and record the attribute that child occurred in
			if(oldParentItem){
				array.forEach(this.childrenAttrs, function(attr){
					if(store.containsValue(oldParentItem, attr, childItem)){
						if(!bCopy){
							var values = array.filter(store.getValues(oldParentItem, attr), function(x){
								return x != childItem;
							});
							store.setValues(oldParentItem, attr, values);
						}
						parentAttr = attr;
					}
				});
			}

			// modify target item's children attribute to include this item
			if(newParentItem){
				if(typeof insertIndex == "number"){
					// call slice() to avoid modifying the original array, confusing the data store
					var childItems = store.getValues(newParentItem, parentAttr).slice();
					childItems.splice(insertIndex, 0, childItem);
					store.setValues(newParentItem, parentAttr, childItems);
				}else{
					store.setValues(newParentItem, parentAttr,
						store.getValues(newParentItem, parentAttr).concat(childItem));
				}
			}
		},

		// =======================================================================
		// Callbacks

		onChange: function(/*dojo/data/Item*/ /*===== item =====*/){
			// summary:
			//		Callback whenever an item has changed, so that Tree
			//		can update the label, icon, etc.   Note that changes
			//		to an item's children or parent(s) will trigger an
			//		onChildrenChange() so you can ignore those changes here.
			// tags:
			//		callback
		},

		onChildrenChange: function(/*===== parent, newChildrenList =====*/){
			// summary:
			//		Callback to do notifications about new, updated, or deleted items.
			// parent: dojo/data/Item
			// newChildrenList: dojo/data/Item[]
			// tags:
			//		callback
		},

		onDelete: function(/*dojo/data/Item*/ /*===== item =====*/){
			// summary:
			//		Callback when an item has been deleted.
			// description:
			//		Note that there will also be an onChildrenChange() callback for the parent
			//		of this item.
			// tags:
			//		callback
		},

		// =======================================================================
		// Events from data store

		onNewItem: function(/* dojo/data/Item */ item, /* Object */ parentInfo){
			// summary:
			//		Handler for when new items appear in the store, either from a drop operation
			//		or some other way.   Updates the tree view (if necessary).
			// description:
			//		If the new item is a child of an existing item,
			//		calls onChildrenChange() with the new list of children
			//		for that existing item.
			//
			// tags:
			//		extension

			// We only care about the new item if it has a parent that corresponds to a TreeNode
			// we are currently displaying
			if(!parentInfo){
				return;
			}

			// Call onChildrenChange() on parent (ie, existing) item with new list of children
			// In the common case, the new list of children is simply parentInfo.newValue or
			// [ parentInfo.newValue ], although if items in the store has multiple
			// child attributes (see `childrenAttr`), then it's a superset of parentInfo.newValue,
			// so call getChildren() to be sure to get right answer.
			this.getChildren(parentInfo.item, lang.hitch(this, function(children){
				this.onChildrenChange(parentInfo.item, children);
			}));
		},

		onDeleteItem: function(/*Object*/ item){
			// summary:
			//		Handler for delete notifications from underlying store
			this.onDelete(item);
		},

		onSetItem: function(item, attribute /*===== , oldValue, newValue =====*/){
			// summary:
			//		Updates the tree view according to changes in the data store.
			// description:
			//		Handles updates to an item's children by calling onChildrenChange(), and
			//		other updates to an item by calling onChange().
			//
			//		See `onNewItem` for more details on handling updates to an item's children.
			// item: Item
			// attribute: attribute-name-string
			// oldValue: Object|Array
			// newValue: Object|Array
			// tags:
			//		extension

			if(array.indexOf(this.childrenAttrs, attribute) != -1){
				// item's children list changed
				this.getChildren(item, lang.hitch(this, function(children){
					// See comments in onNewItem() about calling getChildren()
					this.onChildrenChange(item, children);
				}));
			}else{
				// item's label/icon/etc. changed.
				this.onChange(item);
			}
		}
	});
});

},
'dijit/tree/ForestStoreModel':function(){
define([
	"dojo/_base/array", // array.indexOf array.some
	"dojo/_base/declare", // declare
	"dojo/_base/kernel", // global
	"dojo/_base/lang", // lang.hitch
	"./TreeStoreModel"
], function(array, declare, kernel, lang, TreeStoreModel){

// module:
//		dijit/tree/ForestStoreModel

return declare("dijit.tree.ForestStoreModel", TreeStoreModel, {
	// summary:
	//		Interface between a dijit.Tree and a dojo.data store that doesn't have a root item,
	//		a.k.a. a store that has multiple "top level" items.
	//
	// description:
	//		Use this class to wrap a dojo.data store, making all the items matching the specified query
	//		appear as children of a fabricated "root item".  If no query is specified then all the
	//		items returned by fetch() on the underlying store become children of the root item.
	//		This class allows dijit.Tree to assume a single root item, even if the store doesn't have one.
	//
	//		When using this class the developer must override a number of methods according to their app and
	//		data, including:
	//
	//		- onNewRootItem
	//		- onAddToRoot
	//		- onLeaveRoot
	//		- onNewItem
	//		- onSetItem

	// Parameters to constructor

	// rootId: String
	//		ID of fabricated root item
	rootId: "$root$",

	// rootLabel: String
	//		Label of fabricated root item
	rootLabel: "ROOT",

	// query: String
	//		Specifies the set of children of the root item.
	// example:
	//	|	{type:'continent'}
	query: null,

	// End of parameters to constructor

	constructor: function(params){
		// summary:
		//		Sets up variables, etc.
		// tags:
		//		private

		// Make dummy root item
		this.root = {
			store: this,
			root: true,
			id: params.rootId,
			label: params.rootLabel,
			children: params.rootChildren	// optional param
		};
	},

	// =======================================================================
	// Methods for traversing hierarchy

	mayHaveChildren: function(/*dojo/data/Item*/ item){
		// summary:
		//		Tells if an item has or may have children.  Implementing logic here
		//		avoids showing +/- expando icon for nodes that we know don't have children.
		//		(For efficiency reasons we may not want to check if an element actually
		//		has children until user clicks the expando node)
		// tags:
		//		extension
		return item === this.root || this.inherited(arguments);
	},

	getChildren: function(/*dojo/data/Item*/ parentItem, /*function(items)*/ callback, /*function*/ onError){
		// summary:
		//		Calls onComplete() with array of child items of given parent item, all loaded.
		if(parentItem === this.root){
			if(this.root.children){
				// already loaded, just return
				callback(this.root.children);
			}else{
				this.store.fetch({
					query: this.query,
					onComplete: lang.hitch(this, function(items){
						this.root.children = items;
						callback(items);
					}),
					onError: onError
				});
			}
		}else{
			this.inherited(arguments);
		}
	},

	// =======================================================================
	// Inspecting items

	isItem: function(/* anything */ something){
		return (something === this.root) ? true : this.inherited(arguments);
	},

	fetchItemByIdentity: function(/* object */ keywordArgs){
		if(keywordArgs.identity == this.root.id){
			var scope = keywordArgs.scope || kernel.global;
			if(keywordArgs.onItem){
				keywordArgs.onItem.call(scope, this.root);
			}
		}else{
			this.inherited(arguments);
		}
	},

	getIdentity: function(/* item */ item){
		return (item === this.root) ? this.root.id : this.inherited(arguments);
	},

	getLabel: function(/* item */ item){
		return	(item === this.root) ? this.root.label : this.inherited(arguments);
	},

	// =======================================================================
	// Write interface

	newItem: function(/* dijit/tree/dndSource.__Item */ args, /*Item*/ parent, /*int?*/ insertIndex){
		// summary:
		//		Creates a new item.   See dojo/data/api/Write for details on args.
		//		Used in drag & drop when item from external source dropped onto tree.
		if(parent === this.root){
			this.onNewRootItem(args);
			return this.store.newItem(args);
		}else{
			return this.inherited(arguments);
		}
	},

	onNewRootItem: function(/* dijit/tree/dndSource.__Item */ /*===== args =====*/){
		// summary:
		//		User can override this method to modify a new element that's being
		//		added to the root of the tree, for example to add a flag like root=true
	},

	pasteItem: function(/*Item*/ childItem, /*Item*/ oldParentItem, /*Item*/ newParentItem, /*Boolean*/ bCopy, /*int?*/ insertIndex){
		// summary:
		//		Move or copy an item from one parent item to another.
		//		Used in drag & drop
		if(oldParentItem === this.root){
			if(!bCopy){
				// It's onLeaveRoot()'s responsibility to modify the item so it no longer matches
				// this.query... thus triggering an onChildrenChange() event to notify the Tree
				// that this element is no longer a child of the root node
				this.onLeaveRoot(childItem);
			}
		}
		this.inherited(arguments, [childItem,
			oldParentItem === this.root ? null : oldParentItem,
			newParentItem === this.root ? null : newParentItem,
			bCopy,
			insertIndex
		]);
		if(newParentItem === this.root){
			// It's onAddToRoot()'s responsibility to modify the item so it matches
			// this.query... thus triggering an onChildrenChange() event to notify the Tree
			// that this element is now a child of the root node
			this.onAddToRoot(childItem);
		}
	},

	// =======================================================================
	// Handling for top level children

	onAddToRoot: function(/* item */ item){
		// summary:
		//		Called when item added to root of tree; user must override this method
		//		to modify the item so that it matches the query for top level items
		// example:
		//	|	store.setValue(item, "root", true);
		// tags:
		//		extension
		console.log(this, ": item ", item, " added to root");
	},

	onLeaveRoot: function(/* item */ item){
		// summary:
		//		Called when item removed from root of tree; user must override this method
		//		to modify the item so it doesn't match the query for top level items
		// example:
		//	|	store.unsetAttribute(item, "root");
		// tags:
		//		extension
		console.log(this, ": item ", item, " removed from root");
	},

	// =======================================================================
	// Events from data store

	_requeryTop: function(){
		// reruns the query for the children of the root node,
		// sending out an onSet notification if those children have changed
		var oldChildren = this.root.children || [];
		this.store.fetch({
			query: this.query,
			onComplete: lang.hitch(this, function(newChildren){
				this.root.children = newChildren;

				// If the list of children or the order of children has changed...
				if(oldChildren.length != newChildren.length ||
					array.some(oldChildren, function(item, idx){ return newChildren[idx] != item;})){
					this.onChildrenChange(this.root, newChildren);
				}
			})
		});
	},

	onNewItem: function(/* dojo/data/api/Item */ item, /* Object */ parentInfo){
		// summary:
		//		Handler for when new items appear in the store.  Developers should override this
		//		method to be more efficient based on their app/data.
		// description:
		//		Note that the default implementation requeries the top level items every time
		//		a new item is created, since any new item could be a top level item (even in
		//		addition to being a child of another item, since items can have multiple parents).
		//
		//		If developers can detect which items are possible top level items (based on the item and the
		//		parentInfo parameters), they should override this method to only call _requeryTop() for top
		//		level items.  Often all top level items have parentInfo==null, but
		//		that will depend on which store you use and what your data is like.
		// tags:
		//		extension
		this._requeryTop();

		this.inherited(arguments);
	},

	onDeleteItem: function(/*Object*/ item){
		// summary:
		//		Handler for delete notifications from underlying store

		// check if this was a child of root, and if so send notification that root's children
		// have changed
		if(array.indexOf(this.root.children, item) != -1){
			this._requeryTop();
		}

		this.inherited(arguments);
	},

	onSetItem: function(/* item */ item,
					/* attribute-name-string */ attribute,
					/* Object|Array */ oldValue,
					/* Object|Array */ newValue){
		// summary:
		//		Updates the tree view according to changes to an item in the data store.
		//		Developers should override this method to be more efficient based on their app/data.
		// description:
		//		Handles updates to an item's children by calling onChildrenChange(), and
		//		other updates to an item by calling onChange().
		//
		//		Also, any change to any item re-executes the query for the tree's top-level items,
		//		since this modified item may have started/stopped matching the query for top level items.
		//
		//		If possible, developers should override this function to only call _requeryTop() when
		//		the change to the item has caused it to stop/start being a top level item in the tree.
		// tags:
		//		extension

		this._requeryTop();
		this.inherited(arguments);
	}

});

});

},
'dijit/tree/_dndSelector':function(){
define([
	"dojo/_base/array", // array.filter array.forEach array.map
	"dojo/_base/declare", // declare
	"dojo/_base/kernel",	// global
	"dojo/_base/lang", // lang.hitch
	"dojo/dnd/common",
	"dojo/dom", // isDescendant
	"dojo/mouse", // mouse.isLeft
	"dojo/on",
	"dojo/touch",
	"../a11yclick",
	"./_dndContainer"
], function(array, declare, kernel, lang, dndCommon, dom, mouse, on, touch, a11yclick, _dndContainer){

	// module:
	//		dijit/tree/_dndSelector

	return declare("dijit.tree._dndSelector", _dndContainer, {
		// summary:
		//		This is a base class for `dijit/tree/dndSource`, and isn't meant to be used directly.
		//		It's based on `dojo/dnd/Selector`.
		// tags:
		//		protected

		/*=====
		// selection: Object
		//		(id to DomNode) map for every TreeNode that's currently selected.
		//		The DOMNode is the TreeNode.rowNode.
		selection: {},
		=====*/

		constructor: function(){
			// summary:
			//		Initialization
			// tags:
			//		private

			this.selection={};
			this.anchor = null;

			this.events.push(
				// listeners setup here but no longer used (left for backwards compatibility
				on(this.tree.domNode, touch.press, lang.hitch(this,"onMouseDown")),
				on(this.tree.domNode, touch.release, lang.hitch(this,"onMouseUp")),

				// listeners used in this module
				on(this.tree.domNode, touch.move, lang.hitch(this,"onMouseMove")),
				on(this.tree.domNode, a11yclick.press, lang.hitch(this,"onClickPress")),
				on(this.tree.domNode, a11yclick.release, lang.hitch(this,"onClickRelease"))
			);
		},

		// singular: Boolean
		//		Allows selection of only one element, if true.
		//		Tree hasn't been tested in singular=true mode, unclear if it works.
		singular: false,

		// methods
		getSelectedTreeNodes: function(){
			// summary:
			//		Returns a list of selected node(s).
			//		Used by dndSource on the start of a drag.
			// tags:
			//		protected
			var nodes=[], sel = this.selection;
			for(var i in sel){
				nodes.push(sel[i]);
			}
			return nodes;
		},

		selectNone: function(){
			// summary:
			//		Unselects all items
			// tags:
			//		private

			this.setSelection([]);
			return this;	// self
		},

		destroy: function(){
			// summary:
			//		Prepares the object to be garbage-collected
			this.inherited(arguments);
			this.selection = this.anchor = null;
		},
		addTreeNode: function(/*dijit/Tree._TreeNode*/ node, /*Boolean?*/isAnchor){
			// summary:
			//		add node to current selection
			// node: Node
			//		node to add
			// isAnchor: Boolean
			//		Whether the node should become anchor.

			this.setSelection(this.getSelectedTreeNodes().concat( [node] ));
			if(isAnchor){ this.anchor = node; }
			return node;
		},
		removeTreeNode: function(/*dijit/Tree._TreeNode*/ node){
			// summary:
			//		remove node and it's descendants from current selection
			// node: Node
			//		node to remove
			var newSelection = array.filter(this.getSelectedTreeNodes(), function(selectedNode){
				return !dom.isDescendant(selectedNode.domNode, node.domNode); // also matches when selectedNode == node
			});
			this.setSelection(newSelection);
			return node;
		},
		isTreeNodeSelected: function(/*dijit/Tree._TreeNode*/ node){
			// summary:
			//		return true if node is currently selected
			// node: Node
			//		the node to check whether it's in the current selection

			return node.id && !!this.selection[node.id];
		},
		setSelection: function(/*dijit/Tree._TreeNode[]*/ newSelection){
			// summary:
			//		set the list of selected nodes to be exactly newSelection. All changes to the
			//		selection should be passed through this function, which ensures that derived
			//		attributes are kept up to date. Anchor will be deleted if it has been removed
			//		from the selection, but no new anchor will be added by this function.
			// newSelection: Node[]
			//		list of tree nodes to make selected
			var oldSelection = this.getSelectedTreeNodes();
			array.forEach(this._setDifference(oldSelection, newSelection), lang.hitch(this, function(node){
				node.setSelected(false);
				if(this.anchor == node){
					delete this.anchor;
				}
				delete this.selection[node.id];
			}));
			array.forEach(this._setDifference(newSelection, oldSelection), lang.hitch(this, function(node){
				node.setSelected(true);
				this.selection[node.id] = node;
			}));
			this._updateSelectionProperties();
		},
		_setDifference: function(xs,ys){
			// summary:
			//		Returns a copy of xs which lacks any objects
			//		occurring in ys. Checks for membership by
			//		modifying and then reading the object, so it will
			//		not properly handle sets of numbers or strings.

			array.forEach(ys, function(y){ y.__exclude__ = true; });
			var ret = array.filter(xs, function(x){ return !x.__exclude__; });

			// clean up after ourselves.
			array.forEach(ys, function(y){ delete y['__exclude__'] });
			return ret;
		},
		_updateSelectionProperties: function(){
			// summary:
			//		Update the following tree properties from the current selection:
			//		path[s], selectedItem[s], selectedNode[s]

			var selected = this.getSelectedTreeNodes();
			var paths = [], nodes = [];
			array.forEach(selected, function(node){
				var ary = node.getTreePath();
				nodes.push(node);
				paths.push(ary);
			}, this);
			var items = array.map(nodes,function(node){ return node.item; });
			this.tree._set("paths", paths);
			this.tree._set("path", paths[0] || []);
			this.tree._set("selectedNodes", nodes);
			this.tree._set("selectedNode", nodes[0] || null);
			this.tree._set("selectedItems", items);
			this.tree._set("selectedItem", items[0] || null);
		},

		// selection related events
		onClickPress: function(e){
			// summary:
			//		Event processor for onmousedown/ontouchstart/onkeydown corresponding to a click event
			// e: Event
			//		onmousedown/ontouchstart/onkeydown event
			// tags:
			//		protected

			// ignore mouse or touch on expando node
			if(this.current && this.current.isExpandable && this.tree.isExpandoNode(e.target, this.current)){ return; }

			if(mouse.isLeft(e)){
				// Prevent text selection while dragging on desktop, see #16328.   But don't call preventDefault()
				// for mobile because it will break things completely, see #15838.
				e.preventDefault();
			}

			var treeNode = e.type == "keydown" ? this.tree.focusedChild : this.current;

			if(!treeNode){
				// Click must be on the Tree but not on a TreeNode, happens especially when Tree is stretched to fill
				// a pane of a BorderContainer, etc.
				return;
			}

			var copy = dndCommon.getCopyKeyState(e), id = treeNode.id;

			// if shift key is not pressed, and the node is already in the selection,
			// delay deselection until onmouseup so in the case of DND, deselection
			// will be canceled by onmousemove.
			if(!this.singular && !e.shiftKey && this.selection[id]){
				this._doDeselect = true;
				return;
			}else{
				this._doDeselect = false;
			}
			this.userSelect(treeNode, copy, e.shiftKey);
		},

		onClickRelease: function(e){
			// summary:
			//		Event processor for onmouseup/ontouchend/onkeyup corresponding to a click event
			// e: Event
			//		onmouseup/ontouchend/onkeyup event
			// tags:
			//		protected

			// _doDeselect is the flag to indicate that the user wants to either ctrl+click on
			// an already selected item (to deselect the item), or click on a not-yet selected item
			// (which should remove all current selection, and add the clicked item). This can not
			// be done in onMouseDown, because the user may start a drag after mousedown. By moving
			// the deselection logic here, the user can drag an already selected item.
			if(!this._doDeselect){ return; }
			this._doDeselect = false;
			this.userSelect(e.type == "keyup" ? this.tree.focusedChild : this.current, dndCommon.getCopyKeyState(e), e.shiftKey);
		},
		onMouseMove: function(/*===== e =====*/){
			// summary:
			//		event processor for onmousemove/ontouchmove
			// e: Event
			//		onmousemove/ontouchmove event
			this._doDeselect = false;
		},

		// mouse/touch events that are no longer used
		onMouseDown: function(){
			// summary:
			//		Event processor for onmousedown/ontouchstart
			// e: Event
			//		onmousedown/ontouchstart event
			// tags:
			//		protected
		},
		onMouseUp: function(){
			// summary:
			//		Event processor for onmouseup/ontouchend
			// e: Event
			//		onmouseup/ontouchend event
			// tags:
			//		protected
		},

		_compareNodes: function(n1, n2){
			if(n1 === n2){
				return 0;
			}

			if('sourceIndex' in document.documentElement){ //IE
				//TODO: does not yet work if n1 and/or n2 is a text node
				return n1.sourceIndex - n2.sourceIndex;
			}else if('compareDocumentPosition' in document.documentElement){ //FF, Opera
				return n1.compareDocumentPosition(n2) & 2 ? 1: -1;
			}else if(document.createRange){ //Webkit
				var r1 = doc.createRange();
				r1.setStartBefore(n1);

				var r2 = doc.createRange();
				r2.setStartBefore(n2);

				return r1.compareBoundaryPoints(r1.END_TO_END, r2);
			}else{
				throw Error("dijit.tree._compareNodes don't know how to compare two different nodes in this browser");
			}
		},

		userSelect: function(node, multi, range){
			// summary:
			//		Add or remove the given node from selection, responding
			//		to a user action such as a click or keypress.
			// multi: Boolean
			//		Indicates whether this is meant to be a multi-select action (e.g. ctrl-click)
			// range: Boolean
			//		Indicates whether this is meant to be a ranged action (e.g. shift-click)
			// tags:
			//		protected

			if(this.singular){
				if(this.anchor == node && multi){
					this.selectNone();
				}else{
					this.setSelection([node]);
					this.anchor = node;
				}
			}else{
				if(range && this.anchor){
					var cr = this._compareNodes(this.anchor.rowNode, node.rowNode),
					begin, end, anchor = this.anchor;

					if(cr < 0){ //current is after anchor
						begin = anchor;
						end = node;
					}else{ //current is before anchor
						begin = node;
						end = anchor;
					}
					var nodes = [];
					//add everything betweeen begin and end inclusively
					while(begin != end){
						nodes.push(begin);
						begin = this.tree._getNext(begin);
					}
					nodes.push(end);

					this.setSelection(nodes);
				}else{
					if( this.selection[ node.id ] && multi ){
						this.removeTreeNode( node );
					}else if(multi){
						this.addTreeNode(node, true);
					}else{
						this.setSelection([node]);
						this.anchor = node;
					}
				}
			}
		},

		getItem: function(/*String*/ key){
			// summary:
			//		Returns the dojo/dnd/Container._Item (representing a dragged node) by it's key (id).
			//		Called by dojo/dnd/Source.checkAcceptance().
			// tags:
			//		protected

			var widget = this.selection[key];
			return {
				data: widget,
				type: ["treeNode"]
			}; // dojo/dnd/Container._Item
		},

		forInSelectedItems: function(/*Function*/ f, /*Object?*/ o){
			// summary:
			//		Iterates over selected items;
			//		see `dojo/dnd/Container.forInItems()` for details
			o = o || kernel.global;
			for(var id in this.selection){
				// console.log("selected item id: " + id);
				f.call(o, this.getItem(id), id, this);
			}
		}
	});
});

},
'dojo/dnd/common':function(){
define(["../sniff", "../_base/kernel", "../_base/lang", "../dom"],
	function(has, kernel, lang, dom){

// module:
//		dojo/dnd/common

var exports = lang.getObject("dojo.dnd", true);
/*=====
// TODO: for 2.0, replace line above with this code.
var exports = {
	// summary:
	//		TODOC
};
=====*/

exports.getCopyKeyState = function(evt){
	return evt[has("mac") ? "metaKey" : "ctrlKey"]
};

exports._uniqueId = 0;
exports.getUniqueId = function(){
	// summary:
	//		returns a unique string for use with any DOM element
	var id;
	do{
		id = kernel._scopeName + "Unique" + (++exports._uniqueId);
	}while(dom.byId(id));
	return id;
};

exports._empty = {};

exports.isFormElement = function(/*Event*/ e){
	// summary:
	//		returns true if user clicked on a form element
	var t = e.target;
	if(t.nodeType == 3 /*TEXT_NODE*/){
		t = t.parentNode;
	}
	return " button textarea input select option ".indexOf(" " + t.tagName.toLowerCase() + " ") >= 0;	// Boolean
};

return exports;
});

},
'dijit/tree/_dndContainer':function(){
define([
	"dojo/aspect", // aspect.after
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove domClass.replace
	"dojo/_base/lang", // lang.mixin lang.hitch
	"dojo/on",
	"dojo/touch"
], function(aspect, declare, domClass, lang, on, touch){

	// module:
	//		dijit/tree/_dndContainer

	/*=====
	 var __Args = {
	 // summary:
	 //		A dict of parameters for Tree source configuration.
	 // isSource: Boolean?
	 //		Can be used as a DnD source. Defaults to true.
	 // accept: String[]
	 //		List of accepted types (text strings) for a target; defaults to
	 //		["text", "treeNode"]
	 // copyOnly: Boolean?
	 //		Copy items, if true, use a state of Ctrl key otherwise,
	 // dragThreshold: Number
	 //		The move delay in pixels before detecting a drag; 0 by default
	 // betweenThreshold: Integer
	 //		Distance from upper/lower edge of node to allow drop to reorder nodes
	 };
	 =====*/

	return declare("dijit.tree._dndContainer", null, {

		// summary:
		//		This is a base class for `dijit/tree/_dndSelector`, and isn't meant to be used directly.
		//		It's modeled after `dojo/dnd/Container`.
		// tags:
		//		protected

		/*=====
		 // current: TreeNode
		 //		The currently hovered TreeNode.  Not set to anything for keyboard operation.  (TODO: change?)
		 current: null,
		 =====*/

		constructor: function(tree, params){
			// summary:
			//		A constructor of the Container
			// tree: Node
			//		Node or node's id to build the container on
			// params: __Args
			//		A dict of parameters, which gets mixed into the object
			// tags:
			//		private
			this.tree = tree;
			this.node = tree.domNode;	// TODO: rename; it's not a TreeNode but the whole Tree
			lang.mixin(this, params);

			// states
			this.containerState = "";
			domClass.add(this.node, "dojoDndContainer");

			// set up events
			this.events = [
				// Mouse (or touch) enter/leave on Tree itself
				on(this.node, touch.enter, lang.hitch(this, "onOverEvent")),
				on(this.node, touch.leave, lang.hitch(this, "onOutEvent")),

				// switching between TreeNodes
				aspect.after(this.tree, "_onNodeMouseEnter", lang.hitch(this, "onMouseOver"), true),
				aspect.after(this.tree, "_onNodeMouseLeave", lang.hitch(this, "onMouseOut"), true),

				// cancel text selection and text dragging
				on(this.node, "dragstart, selectstart", function(evt){
					evt.preventDefault();
				})
			];
		},

		destroy: function(){
			// summary:
			//		Prepares this object to be garbage-collected

			var h;
			while(h = this.events.pop()){
				h.remove();
			}

			// this.clearItems();
			this.node = this.parent = null;
		},

		// mouse events
		onMouseOver: function(widget /*===== , evt =====*/){
			// summary:
			//		Called when mouse is moved over a TreeNode
			// widget: TreeNode
			// evt: Event
			// tags:
			//		protected
			this.current = widget;
		},

		onMouseOut: function(/*===== widget, evt =====*/){
			// summary:
			//		Called when mouse is moved away from a TreeNode
			// widget: TreeNode
			// evt: Event
			// tags:
			//		protected
			this.current = null;
		},

		_changeState: function(type, newState){
			// summary:
			//		Changes a named state to new state value
			// type: String
			//		A name of the state to change
			// newState: String
			//		new state
			var prefix = "dojoDnd" + type;
			var state = type.toLowerCase() + "State";
			//domClass.replace(this.node, prefix + newState, prefix + this[state]);
			domClass.replace(this.node, prefix + newState, prefix + this[state]);
			this[state] = newState;
		},

		_addItemClass: function(node, type){
			// summary:
			//		Adds a class with prefix "dojoDndItem"
			// node: Node
			//		A node
			// type: String
			//		A variable suffix for a class name
			domClass.add(node, "dojoDndItem" + type);
		},

		_removeItemClass: function(node, type){
			// summary:
			//		Removes a class with prefix "dojoDndItem"
			// node: Node
			//		A node
			// type: String
			//		A variable suffix for a class name
			domClass.remove(node, "dojoDndItem" + type);
		},

		onOverEvent: function(){
			// summary:
			//		This function is called once, when mouse is over our container
			// tags:
			//		protected
			this._changeState("Container", "Over");
		},

		onOutEvent: function(){
			// summary:
			//		This function is called once, when mouse is out of our container
			// tags:
			//		protected
			this._changeState("Container", "");
		}
	});
});

},
'dijit/Calendar':function(){
define([
	"dojo/_base/array", // array.map
	"dojo/date",
	"dojo/date/locale",
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.get
	"dojo/dom-class", // domClass.add domClass.contains domClass.remove domClass.toggle
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/keys", // keys
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/sniff", // has("ie")
	"./CalendarLite",
	"./_Widget",
	"./_CssStateMixin",
	"./_TemplatedMixin",
	"./form/DropDownButton"
], function(array, date, local, declare, domAttr, domClass, kernel, keys, lang, on, has, CalendarLite, _Widget, _CssStateMixin, _TemplatedMixin, DropDownButton){

	// module:
	//		dijit/Calendar

	// _Widget for deprecated methods like setAttribute()
	var Calendar = declare("dijit.Calendar", [CalendarLite, _Widget, _CssStateMixin], {
		// summary:
		//		A simple GUI for choosing a date in the context of a monthly calendar.
		//
		// description:
		//		See CalendarLite for general description.   Calendar extends CalendarLite, adding:
		//
		//		- month drop down list
		//		- keyboard navigation
		//		- CSS classes for hover/mousepress on date, month, and year nodes
		//		- support of deprecated methods (will be removed in 2.0)

		// Set node classes for various mouse events, see dijit._CssStateMixin for more details
		cssStateNodes: {
			"decrementMonth": "dijitCalendarArrow",
			"incrementMonth": "dijitCalendarArrow",
			"previousYearLabelNode": "dijitCalendarPreviousYear",
			"nextYearLabelNode": "dijitCalendarNextYear"
		},

		setValue: function(/*Date*/ value){
			// summary:
			//		Deprecated.   Use set('value', ...) instead.
			// tags:
			//		deprecated
			kernel.deprecated("dijit.Calendar:setValue() is deprecated.  Use set('value', ...) instead.", "", "2.0");
			this.set('value', value);
		},

		_createMonthWidget: function(){
			// summary:
			//		Creates the drop down button that displays the current month and lets user pick a new one

			return new Calendar._MonthDropDownButton({
				id: this.id + "_mddb",
				tabIndex: -1,
				onMonthSelect: lang.hitch(this, "_onMonthSelect"),
				lang: this.lang,
				dateLocaleModule: this.dateLocaleModule
			}, this.monthNode);
		},

		postCreate: function(){
			this.inherited(arguments);

			// Events specific to Calendar, not used in CalendarLite
			this.own(
				on(this.domNode, "keydown", lang.hitch(this, "_onKeyDown")),
				on(this.dateRowsNode, "mouseover", lang.hitch(this, "_onDayMouseOver")),
				on(this.dateRowsNode, "mouseout", lang.hitch(this, "_onDayMouseOut")),
				on(this.dateRowsNode, "mousedown", lang.hitch(this, "_onDayMouseDown")),
				on(this.dateRowsNode, "mouseup", lang.hitch(this, "_onDayMouseUp"))
			);
		},

		_onMonthSelect: function(/*Number*/ newMonth){
			// summary:
			//		Handler for when user selects a month from the drop down list
			// tags:
			//		protected

			// move to selected month, bounding by the number of days in the month
			// (ex: jan 31 --> feb 28, not feb 31)
			var date = new this.dateClassObj(this.currentFocus);
			date.setDate(1);
			date.setMonth(newMonth);
			var daysInMonth = this.dateModule.getDaysInMonth(date);
			var currentDate = this.currentFocus.getDate();
			date.setDate(Math.min(currentDate, daysInMonth));
			this._setCurrentFocusAttr(date);
		},

		_onDayMouseOver: function(/*Event*/ evt){
			// summary:
			//		Handler for mouse over events on days, sets hovered style
			// tags:
			//		protected

			// event can occur on <td> or the <span> inside the td,
			// set node to the <td>.
			var node =
				domClass.contains(evt.target, "dijitCalendarDateLabel") ?
					evt.target.parentNode :
					evt.target;

			if(node && (
				(node.dijitDateValue && !domClass.contains(node, "dijitCalendarDisabledDate"))
					|| node == this.previousYearLabelNode || node == this.nextYearLabelNode
				)){
				domClass.add(node, "dijitCalendarHoveredDate");
				this._currentNode = node;
			}
		},

		_onDayMouseOut: function(/*Event*/ evt){
			// summary:
			//		Handler for mouse out events on days, clears hovered style
			// tags:
			//		protected

			if(!this._currentNode){
				return;
			}

			// if mouse out occurs moving from <td> to <span> inside <td>, ignore it
			if(evt.relatedTarget && evt.relatedTarget.parentNode == this._currentNode){
				return;
			}
			var cls = "dijitCalendarHoveredDate";
			if(domClass.contains(this._currentNode, "dijitCalendarActiveDate")){
				cls += " dijitCalendarActiveDate";
			}
			domClass.remove(this._currentNode, cls);
			this._currentNode = null;
		},

		_onDayMouseDown: function(/*Event*/ evt){
			var node = evt.target.parentNode;
			if(node && node.dijitDateValue && !domClass.contains(node, "dijitCalendarDisabledDate")){
				domClass.add(node, "dijitCalendarActiveDate");
				this._currentNode = node;
			}
		},

		_onDayMouseUp: function(/*Event*/ evt){
			var node = evt.target.parentNode;
			if(node && node.dijitDateValue){
				domClass.remove(node, "dijitCalendarActiveDate");
			}
		},

		handleKey: function(/*Event*/ evt){
			// summary:
			//		Provides keyboard navigation of calendar.
			// description:
			//		Called from _onKeyDown() to handle keydown on a stand alone Calendar,
			//		and also from `dijit/form/_DateTimeTextBox` to pass a keydown event
			//		from the `dijit/form/DateTextBox` to be handled in this widget
			// returns:
			//		False if the key was recognized as a navigation key,
			//		to indicate that the event was handled by Calendar and shouldn't be propagated
			// tags:
			//		protected
			var increment = -1,
				interval,
				newValue = this.currentFocus;
			switch(evt.keyCode){
				case keys.RIGHT_ARROW:
					increment = 1;
				//fallthrough...
				case keys.LEFT_ARROW:
					interval = "day";
					if(!this.isLeftToRight()){
						increment *= -1;
					}
					break;
				case keys.DOWN_ARROW:
					increment = 1;
				//fallthrough...
				case keys.UP_ARROW:
					interval = "week";
					break;
				case keys.PAGE_DOWN:
					increment = 1;
				//fallthrough...
				case keys.PAGE_UP:
					interval = evt.ctrlKey || evt.altKey ? "year" : "month";
					break;
				case keys.END:
					// go to the next month
					newValue = this.dateModule.add(newValue, "month", 1);
					// subtract a day from the result when we're done
					interval = "day";
				//fallthrough...
				case keys.HOME:
					newValue = new this.dateClassObj(newValue);
					newValue.setDate(1);
					break;
				default:
					return true;
			}

			if(interval){
				newValue = this.dateModule.add(newValue, interval, increment);
			}

			this._setCurrentFocusAttr(newValue);

			return false;
		},

		_onKeyDown: function(/*Event*/ evt){
			// summary:
			//		For handling keydown events on a stand alone calendar
			if(!this.handleKey(evt)){
				evt.stopPropagation();
				evt.preventDefault();
			}
		},

		onValueSelected: function(/*Date*/ /*===== date =====*/){
			// summary:
			//		Deprecated.   Notification that a date cell was selected.  It may be the same as the previous value.
			// description:
			//		Formerly used by `dijit/form/_DateTimeTextBox` (and thus `dijit/form/DateTextBox`)
			//		to get notification when the user has clicked a date.  Now onExecute() (above) is used.
			// tags:
			//		protected
		},

		onChange: function(value){
			this.onValueSelected(value);	// remove in 2.0
		},

		getClassForDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to return CSS classes to associate with the date entry for the given dateObject,
			//		for example to indicate a holiday in specified locale.
			// dateObject: Date
			// locale: String?
			// tags:
			//		extension

			/*=====
			 return ""; // String
			 =====*/
		}
	});

	Calendar._MonthDropDownButton = declare("dijit.Calendar._MonthDropDownButton", DropDownButton, {
		// summary:
		//		DropDownButton for the current month.    Displays name of current month
		//		and a list of month names in the drop down

		onMonthSelect: function(){
		},

		postCreate: function(){
			this.inherited(arguments);
			this.dropDown = new Calendar._MonthDropDown({
				id: this.id + "_mdd", //do not change this id because it is referenced in the template
				onChange: this.onMonthSelect
			});
		},
		_setMonthAttr: function(month){
			// summary:
			//		Set the current month to display as a label
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month);
			this.dropDown.set("months", monthNames);

			// Set name of current month and also fill in spacer element with all the month names
			// (invisible) so that the maximum width will affect layout.   But not on IE6 because then
			// the center <TH> overlaps the right <TH> (due to a browser bug).
			this.containerNode.innerHTML =
				(has("ie") == 6 ? "" : "<div class='dijitSpacer'>" + this.dropDown.domNode.innerHTML + "</div>") +
					"<div class='dijitCalendarMonthLabel dijitCalendarCurrentMonthLabel'>" + monthNames[month.getMonth()] + "</div>";
		}
	});

	Calendar._MonthDropDown = declare("dijit.Calendar._MonthDropDown", [_Widget, _TemplatedMixin], {
		// summary:
		//		The list-of-months drop down from the MonthDropDownButton

		// months: String[]
		//		List of names of months, possibly w/some undefined entries for Hebrew leap months
		//		(ex: ["January", "February", undefined, "April", ...])
		months: [],

		templateString: "<div class='dijitCalendarMonthMenu dijitMenu' " +
			"data-dojo-attach-event='onclick:_onClick,onmouseover:_onMenuHover,onmouseout:_onMenuHover'></div>",

		_setMonthsAttr: function(/*String[]*/ months){
			this.domNode.innerHTML = array.map(months,function(month, idx){
				return month ? "<div class='dijitCalendarMonthLabel' month='" + idx + "'>" + month + "</div>" : "";
			}).join("");
		},

		_onClick: function(/*Event*/ evt){
			this.onChange(domAttr.get(evt.target, "month"));
		},

		onChange: function(/*Number*/ /*===== month =====*/){
			// summary:
			//		Callback when month is selected from drop down
		},

		_onMenuHover: function(evt){
			domClass.toggle(evt.target, "dijitCalendarMonthLabelHover", evt.type == "mouseover");
		}
	});

	return Calendar;
});

},
'dojo/date':function(){
define(["./has", "./_base/lang"], function(has, lang){
// module:
//		dojo/date

var date = {
	// summary:
	//		Date manipulation utilities
};

date.getDaysInMonth = function(/*Date*/dateObject){
	// summary:
	//		Returns the number of days in the month used by dateObject
	var month = dateObject.getMonth();
	var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if(month == 1 && date.isLeapYear(dateObject)){ return 29; } // Number
	return days[month]; // Number
};

date.isLeapYear = function(/*Date*/dateObject){
	// summary:
	//		Determines if the year of the dateObject is a leap year
	// description:
	//		Leap years are years with an additional day YYYY-02-29, where the
	//		year number is a multiple of four with the following exception: If
	//		a year is a multiple of 100, then it is only a leap year if it is
	//		also a multiple of 400. For example, 1900 was not a leap year, but
	//		2000 is one.

	var year = dateObject.getFullYear();
	return !(year%400) || (!(year%4) && !!(year%100)); // Boolean
};

// FIXME: This is not localized
date.getTimezoneName = function(/*Date*/dateObject){
	// summary:
	//		Get the user's time zone as provided by the browser
	// dateObject:
	//		Needed because the timezone may vary with time (daylight savings)
	// description:
	//		Try to get time zone info from toString or toLocaleString method of
	//		the Date object -- UTC offset is not a time zone.  See
	//		http://www.twinsun.com/tz/tz-link.htm Note: results may be
	//		inconsistent across browsers.

	var str = dateObject.toString(); // Start looking in toString
	var tz = ''; // The result -- return empty string if nothing found
	var match;

	// First look for something in parentheses -- fast lookup, no regex
	var pos = str.indexOf('(');
	if(pos > -1){
		tz = str.substring(++pos, str.indexOf(')'));
	}else{
		// If at first you don't succeed ...
		// If IE knows about the TZ, it appears before the year
		// Capital letters or slash before a 4-digit year
		// at the end of string
		var pat = /([A-Z\/]+) \d{4}$/;
		if((match = str.match(pat))){
			tz = match[1];
		}else{
		// Some browsers (e.g. Safari) glue the TZ on the end
		// of toLocaleString instead of putting it in toString
			str = dateObject.toLocaleString();
			// Capital letters or slash -- end of string,
			// after space
			pat = / ([A-Z\/]+)$/;
			if((match = str.match(pat))){
				tz = match[1];
			}
		}
	}

	// Make sure it doesn't somehow end up return AM or PM
	return (tz == 'AM' || tz == 'PM') ? '' : tz; // String
};

// Utility methods to do arithmetic calculations with Dates

date.compare = function(/*Date*/date1, /*Date?*/date2, /*String?*/portion){
	// summary:
	//		Compare two date objects by date, time, or both.
	// description:
	//		Returns 0 if equal, positive if a > b, else negative.
	// date1:
	//		Date object
	// date2:
	//		Date object.  If not specified, the current Date is used.
	// portion:
	//		A string indicating the "date" or "time" portion of a Date object.
	//		Compares both "date" and "time" by default.  One of the following:
	//		"date", "time", "datetime"

	// Extra step required in copy for IE - see #3112
	date1 = new Date(+date1);
	date2 = new Date(+(date2 || new Date()));

	if(portion == "date"){
		// Ignore times and compare dates.
		date1.setHours(0, 0, 0, 0);
		date2.setHours(0, 0, 0, 0);
	}else if(portion == "time"){
		// Ignore dates and compare times.
		date1.setFullYear(0, 0, 0);
		date2.setFullYear(0, 0, 0);
	}

	if(date1 > date2){ return 1; } // int
	if(date1 < date2){ return -1; } // int
	return 0; // int
};

date.add = function(/*Date*/date, /*String*/interval, /*int*/amount){
	// summary:
	//		Add to a Date in intervals of different size, from milliseconds to years
	// date: Date
	//		Date object to start with
	// interval:
	//		A string representing the interval.  One of the following:
	//		"year", "month", "day", "hour", "minute", "second",
	//		"millisecond", "quarter", "week", "weekday"
	// amount:
	//		How much to add to the date.

	var sum = new Date(+date); // convert to Number before copying to accomodate IE (#3112)
	var fixOvershoot = false;
	var property = "Date";

	switch(interval){
		case "day":
			break;
		case "weekday":
			//i18n FIXME: assumes Saturday/Sunday weekend, but this is not always true.  see dojo/cldr/supplemental

			// Divide the increment time span into weekspans plus leftover days
			// e.g., 8 days is one 5-day weekspan / and two leftover days
			// Can't have zero leftover days, so numbers divisible by 5 get
			// a days value of 5, and the remaining days make up the number of weeks
			var days, weeks;
			var mod = amount % 5;
			if(!mod){
				days = (amount > 0) ? 5 : -5;
				weeks = (amount > 0) ? ((amount-5)/5) : ((amount+5)/5);
			}else{
				days = mod;
				weeks = parseInt(amount/5);
			}
			// Get weekday value for orig date param
			var strt = date.getDay();
			// Orig date is Sat / positive incrementer
			// Jump over Sun
			var adj = 0;
			if(strt == 6 && amount > 0){
				adj = 1;
			}else if(strt == 0 && amount < 0){
			// Orig date is Sun / negative incrementer
			// Jump back over Sat
				adj = -1;
			}
			// Get weekday val for the new date
			var trgt = strt + days;
			// New date is on Sat or Sun
			if(trgt == 0 || trgt == 6){
				adj = (amount > 0) ? 2 : -2;
			}
			// Increment by number of weeks plus leftover days plus
			// weekend adjustments
			amount = (7 * weeks) + days + adj;
			break;
		case "year":
			property = "FullYear";
			// Keep increment/decrement from 2/29 out of March
			fixOvershoot = true;
			break;
		case "week":
			amount *= 7;
			break;
		case "quarter":
			// Naive quarter is just three months
			amount *= 3;
			// fallthrough...
		case "month":
			// Reset to last day of month if you overshoot
			fixOvershoot = true;
			property = "Month";
			break;
//		case "hour":
//		case "minute":
//		case "second":
//		case "millisecond":
		default:
			property = "UTC"+interval.charAt(0).toUpperCase() + interval.substring(1) + "s";
	}

	if(property){
		sum["set"+property](sum["get"+property]()+amount);
	}

	if(fixOvershoot && (sum.getDate() < date.getDate())){
		sum.setDate(0);
	}

	return sum; // Date
};

date.difference = function(/*Date*/date1, /*Date?*/date2, /*String?*/interval){
	// summary:
	//		Get the difference in a specific unit of time (e.g., number of
	//		months, weeks, days, etc.) between two dates, rounded to the
	//		nearest integer.
	// date1:
	//		Date object
	// date2:
	//		Date object.  If not specified, the current Date is used.
	// interval:
	//		A string representing the interval.  One of the following:
	//		"year", "month", "day", "hour", "minute", "second",
	//		"millisecond", "quarter", "week", "weekday"
	//
	//		Defaults to "day".

	date2 = date2 || new Date();
	interval = interval || "day";
	var yearDiff = date2.getFullYear() - date1.getFullYear();
	var delta = 1; // Integer return value

	switch(interval){
		case "quarter":
			var m1 = date1.getMonth();
			var m2 = date2.getMonth();
			// Figure out which quarter the months are in
			var q1 = Math.floor(m1/3) + 1;
			var q2 = Math.floor(m2/3) + 1;
			// Add quarters for any year difference between the dates
			q2 += (yearDiff * 4);
			delta = q2 - q1;
			break;
		case "weekday":
			var days = Math.round(date.difference(date1, date2, "day"));
			var weeks = parseInt(date.difference(date1, date2, "week"));
			var mod = days % 7;

			// Even number of weeks
			if(mod == 0){
				days = weeks*5;
			}else{
				// Weeks plus spare change (< 7 days)
				var adj = 0;
				var aDay = date1.getDay();
				var bDay = date2.getDay();

				weeks = parseInt(days/7);
				mod = days % 7;
				// Mark the date advanced by the number of
				// round weeks (may be zero)
				var dtMark = new Date(date1);
				dtMark.setDate(dtMark.getDate()+(weeks*7));
				var dayMark = dtMark.getDay();

				// Spare change days -- 6 or less
				if(days > 0){
					switch(true){
						// Range starts on Sat
						case aDay == 6:
							adj = -1;
							break;
						// Range starts on Sun
						case aDay == 0:
							adj = 0;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = -1;
							break;
						// Range ends on Sun
						case bDay == 0:
							adj = -2;
							break;
						// Range contains weekend
						case (dayMark + mod) > 5:
							adj = -2;
					}
				}else if(days < 0){
					switch(true){
						// Range starts on Sat
						case aDay == 6:
							adj = 0;
							break;
						// Range starts on Sun
						case aDay == 0:
							adj = 1;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = 2;
							break;
						// Range ends on Sun
						case bDay == 0:
							adj = 1;
							break;
						// Range contains weekend
						case (dayMark + mod) < 0:
							adj = 2;
					}
				}
				days += adj;
				days -= (weeks*2);
			}
			delta = days;
			break;
		case "year":
			delta = yearDiff;
			break;
		case "month":
			delta = (date2.getMonth() - date1.getMonth()) + (yearDiff * 12);
			break;
		case "week":
			// Truncate instead of rounding
			// Don't use Math.floor -- value may be negative
			delta = parseInt(date.difference(date1, date2, "day")/7);
			break;
		case "day":
			delta /= 24;
			// fallthrough
		case "hour":
			delta /= 60;
			// fallthrough
		case "minute":
			delta /= 60;
			// fallthrough
		case "second":
			delta /= 1000;
			// fallthrough
		case "millisecond":
			delta *= date2.getTime() - date1.getTime();
	}

	// Round for fractional values and DST leaps
	return Math.round(delta); // Number (integer)
};

// Don't use setObject() because it may overwrite dojo/date/stamp (if that has already been loaded)
 1  && lang.mixin(lang.getObject("dojo.date", true), date);

return date;
});

},
'dojo/date/locale':function(){
define([
	"../_base/lang",
	"../_base/array",
	"../date",
	/*===== "../_base/declare", =====*/
	"../cldr/supplemental",
	"../i18n",
	"../regexp",
	"../string",
	"../i18n!../cldr/nls/gregorian",
	"module"
], function(lang, array, date, /*===== declare, =====*/ supplemental, i18n, regexp, string, gregorian, module){

// module:
//		dojo/date/locale

var exports = {
	// summary:
	//		This modules defines dojo/date/locale, localization methods for Date.
};
lang.setObject(module.id.replace(/\//g, "."), exports);

// Localization methods for Date.   Honor local customs using locale-dependent dojo.cldr data.

// Load the bundles containing localization information for
// names and formats

//NOTE: Everything in this module assumes Gregorian calendars.
// Other calendars will be implemented in separate modules.

	// Format a pattern without literals
	function formatPattern(dateObject, bundle, options, pattern){
		return pattern.replace(/([a-z])\1*/ig, function(match){
			var s, pad,
				c = match.charAt(0),
				l = match.length,
				widthList = ["abbr", "wide", "narrow"];
			switch(c){
				case 'G':
					s = bundle[(l < 4) ? "eraAbbr" : "eraNames"][dateObject.getFullYear() < 0 ? 0 : 1];
					break;
				case 'y':
					s = dateObject.getFullYear();
					switch(l){
						case 1:
							break;
						case 2:
							if(!options.fullYear){
								s = String(s); s = s.substr(s.length - 2);
								break;
							}
							// fallthrough
						default:
							pad = true;
					}
					break;
				case 'Q':
				case 'q':
					s = Math.ceil((dateObject.getMonth()+1)/3);
//					switch(l){
//						case 1: case 2:
							pad = true;
//							break;
//						case 3: case 4: // unimplemented
//					}
					break;
				case 'M':
				case 'L':
					var m = dateObject.getMonth();
					if(l<3){
						s = m+1; pad = true;
					}else{
						var propM = [
							"months",
							c == 'L' ? "standAlone" : "format",
							widthList[l-3]
						].join("-");
						s = bundle[propM][m];
					}
					break;
				case 'w':
					var firstDay = 0;
					s = exports._getWeekOfYear(dateObject, firstDay); pad = true;
					break;
				case 'd':
					s = dateObject.getDate(); pad = true;
					break;
				case 'D':
					s = exports._getDayOfYear(dateObject); pad = true;
					break;
				case 'e':
				case 'c':
					var d = dateObject.getDay();
					if(l<2){
						s = (d - supplemental.getFirstDayOfWeek(options.locale) + 8) % 7
						break;
					}
					// fallthrough
				case 'E':
					d = dateObject.getDay();
					if(l<3){
						s = d+1; pad = true;
					}else{
						var propD = [
							"days",
							c == 'c' ? "standAlone" : "format",
							widthList[l-3]
						].join("-");
						s = bundle[propD][d];
					}
					break;
				case 'a':
					var timePeriod = dateObject.getHours() < 12 ? 'am' : 'pm';
					s = options[timePeriod] || bundle['dayPeriods-format-wide-' + timePeriod];
					break;
				case 'h':
				case 'H':
				case 'K':
				case 'k':
					var h = dateObject.getHours();
					// strange choices in the date format make it impossible to write this succinctly
					switch (c){
						case 'h': // 1-12
							s = (h % 12) || 12;
							break;
						case 'H': // 0-23
							s = h;
							break;
						case 'K': // 0-11
							s = (h % 12);
							break;
						case 'k': // 1-24
							s = h || 24;
							break;
					}
					pad = true;
					break;
				case 'm':
					s = dateObject.getMinutes(); pad = true;
					break;
				case 's':
					s = dateObject.getSeconds(); pad = true;
					break;
				case 'S':
					s = Math.round(dateObject.getMilliseconds() * Math.pow(10, l-3)); pad = true;
					break;
				case 'v': // FIXME: don't know what this is. seems to be same as z?
				case 'z':
					// We only have one timezone to offer; the one from the browser
					s = exports._getZone(dateObject, true, options);
					if(s){break;}
					l=4;
					// fallthrough... use GMT if tz not available
				case 'Z':
					var offset = exports._getZone(dateObject, false, options);
					var tz = [
						(offset<=0 ? "+" : "-"),
						string.pad(Math.floor(Math.abs(offset)/60), 2),
						string.pad(Math.abs(offset)% 60, 2)
					];
					if(l==4){
						tz.splice(0, 0, "GMT");
						tz.splice(3, 0, ":");
					}
					s = tz.join("");
					break;
//				case 'Y': case 'u': case 'W': case 'F': case 'g': case 'A':
//					console.log(match+" modifier unimplemented");
				default:
					throw new Error("dojo.date.locale.format: invalid pattern char: "+pattern);
			}
			if(pad){ s = string.pad(s, l); }
			return s;
		});
	}

/*=====
var __FormatOptions = exports.__FormatOptions = declare(null, {
	// selector: String
	//		choice of 'time','date' (default: date and time)
	// formatLength: String
	//		choice of long, short, medium or full (plus any custom additions).  Defaults to 'short'
	// datePattern:String
	//		override pattern with this string
	// timePattern:String
	//		override pattern with this string
	// am: String
	//		override strings for am in times
	// pm: String
	//		override strings for pm in times
	// locale: String
	//		override the locale used to determine formatting rules
	// fullYear: Boolean
	//		(format only) use 4 digit years whenever 2 digit years are called for
	// strict: Boolean
	//		(parse only) strict parsing, off by default
});
=====*/

exports._getZone = function(/*Date*/ dateObject, /*boolean*/ getName, /*__FormatOptions?*/ options){
	// summary:
	//		Returns the zone (or offset) for the given date and options.  This
	//		is broken out into a separate function so that it can be overridden
	//		by timezone-aware code.
	//
	// dateObject:
	//		the date and/or time being formatted.
	//
	// getName:
	//		Whether to return the timezone string (if true), or the offset (if false)
	//
	// options:
	//		The options being used for formatting
	if(getName){
		return date.getTimezoneName(dateObject);
	}else{
		return dateObject.getTimezoneOffset();
	}
};


exports.format = function(/*Date*/ dateObject, /*__FormatOptions?*/ options){
	// summary:
	//		Format a Date object as a String, using locale-specific settings.
	//
	// description:
	//		Create a string from a Date object using a known localized pattern.
	//		By default, this method formats both date and time from dateObject.
	//		Formatting patterns are chosen appropriate to the locale.  Different
	//		formatting lengths may be chosen, with "full" used by default.
	//		Custom patterns may be used or registered with translations using
	//		the dojo/date/locale.addCustomFormats() method.
	//		Formatting patterns are implemented using [the syntax described at
	//		unicode.org](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	//
	// dateObject:
	//		the date and/or time to be formatted.  If a time only is formatted,
	//		the values in the year, month, and day fields are irrelevant.  The
	//		opposite is true when formatting only dates.

	options = options || {};

	var locale = i18n.normalizeLocale(options.locale),
		formatLength = options.formatLength || 'short',
		bundle = exports._getGregorianBundle(locale),
		str = [],
		sauce = lang.hitch(this, formatPattern, dateObject, bundle, options);
	if(options.selector == "year"){
		return _processPattern(bundle["dateFormatItem-yyyy"] || "yyyy", sauce);
	}
	var pattern;
	if(options.selector != "date"){
		pattern = options.timePattern || bundle["timeFormat-"+formatLength];
		if(pattern){str.push(_processPattern(pattern, sauce));}
	}
	if(options.selector != "time"){
		pattern = options.datePattern || bundle["dateFormat-"+formatLength];
		if(pattern){str.push(_processPattern(pattern, sauce));}
	}

	return str.length == 1 ? str[0] : bundle["dateTimeFormat-"+formatLength].replace(/\'/g,'').replace(/\{(\d+)\}/g,
		function(match, key){ return str[key]; }); // String
};

exports.regexp = function(/*__FormatOptions?*/ options){
	// summary:
	//		Builds the regular needed to parse a localized date

	return exports._parseInfo(options).regexp; // String
};

exports._parseInfo = function(/*__FormatOptions?*/ options){
	options = options || {};
	var locale = i18n.normalizeLocale(options.locale),
		bundle = exports._getGregorianBundle(locale),
		formatLength = options.formatLength || 'short',
		datePattern = options.datePattern || bundle["dateFormat-" + formatLength],
		timePattern = options.timePattern || bundle["timeFormat-" + formatLength],
		pattern;
	if(options.selector == 'date'){
		pattern = datePattern;
	}else if(options.selector == 'time'){
		pattern = timePattern;
	}else{
		pattern = bundle["dateTimeFormat-"+formatLength].replace(/\{(\d+)\}/g,
			function(match, key){ return [timePattern, datePattern][key]; });
	}

	var tokens = [],
		re = _processPattern(pattern, lang.hitch(this, _buildDateTimeRE, tokens, bundle, options));
	return {regexp: re, tokens: tokens, bundle: bundle};
};

exports.parse = function(/*String*/ value, /*__FormatOptions?*/ options){
	// summary:
	//		Convert a properly formatted string to a primitive Date object,
	//		using locale-specific settings.
	//
	// description:
	//		Create a Date object from a string using a known localized pattern.
	//		By default, this method parses looking for both date and time in the string.
	//		Formatting patterns are chosen appropriate to the locale.  Different
	//		formatting lengths may be chosen, with "full" used by default.
	//		Custom patterns may be used or registered with translations using
	//		the dojo/date/locale.addCustomFormats() method.
	//
	//		Formatting patterns are implemented using [the syntax described at
	//		unicode.org](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	//		When two digit years are used, a century is chosen according to a sliding
	//		window of 80 years before and 20 years after present year, for both `yy` and `yyyy` patterns.
	//		year < 100CE requires strict mode.
	//
	// value:
	//		A string representation of a date

	// remove non-printing bidi control chars from input and pattern
	var controlChars = /[\u200E\u200F\u202A\u202E]/g,
		info = exports._parseInfo(options),
		tokens = info.tokens, bundle = info.bundle,
		re = new RegExp("^" + info.regexp.replace(controlChars, "") + "$",
			info.strict ? "" : "i"),
		match = re.exec(value && value.replace(controlChars, ""));

	if(!match){ return null; } // null

	var widthList = ['abbr', 'wide', 'narrow'],
		result = [1970,0,1,0,0,0,0], // will get converted to a Date at the end
		amPm = "",
		valid = array.every(match, function(v, i){
		if(!i){return true;}
		var token = tokens[i-1],
			l = token.length,
			c = token.charAt(0);
		switch(c){
			case 'y':
				if(l != 2 && options.strict){
					//interpret year literally, so '5' would be 5 A.D.
					result[0] = v;
				}else{
					if(v<100){
						v = Number(v);
						//choose century to apply, according to a sliding window
						//of 80 years before and 20 years after present year
						var year = '' + new Date().getFullYear(),
							century = year.substring(0, 2) * 100,
							cutoff = Math.min(Number(year.substring(2, 4)) + 20, 99);
						result[0] = (v < cutoff) ? century + v : century - 100 + v;
					}else{
						//we expected 2 digits and got more...
						if(options.strict){
							return false;
						}
						//interpret literally, so '150' would be 150 A.D.
						//also tolerate '1950', if 'yyyy' input passed to 'yy' format
						result[0] = v;
					}
				}
				break;
			case 'M':
			case 'L':
				if(l>2){
					var months = bundle['months-' +
							    (c == 'L' ? 'standAlone' : 'format') +
							    '-' + widthList[l-3]].concat();
					if(!options.strict){
						//Tolerate abbreviating period in month part
						//Case-insensitive comparison
						v = v.replace(".","").toLowerCase();
						months = array.map(months, function(s){ return s.replace(".","").toLowerCase(); } );
					}
					v = array.indexOf(months, v);
					if(v == -1){
//						console.log("dojo/date/locale.parse: Could not parse month name: '" + v + "'.");
						return false;
					}
				}else{
					v--;
				}
				result[1] = v;
				break;
			case 'E':
			case 'e':
			case 'c':
				var days = bundle['days-' +
						  (c == 'c' ? 'standAlone' : 'format') +
						  '-' + widthList[l-3]].concat();
				if(!options.strict){
					//Case-insensitive comparison
					v = v.toLowerCase();
					days = array.map(days, function(d){return d.toLowerCase();});
				}
				v = array.indexOf(days, v);
				if(v == -1){
//					console.log("dojo/date/locale.parse: Could not parse weekday name: '" + v + "'.");
					return false;
				}

				//TODO: not sure what to actually do with this input,
				//in terms of setting something on the Date obj...?
				//without more context, can't affect the actual date
				//TODO: just validate?
				break;
			case 'D':
				result[1] = 0;
				// fallthrough...
			case 'd':
				result[2] = v;
				break;
			case 'a': //am/pm
				var am = options.am || bundle['dayPeriods-format-wide-am'],
					pm = options.pm || bundle['dayPeriods-format-wide-pm'];
				if(!options.strict){
					var period = /\./g;
					v = v.replace(period,'').toLowerCase();
					am = am.replace(period,'').toLowerCase();
					pm = pm.replace(period,'').toLowerCase();
				}
				if(options.strict && v != am && v != pm){
//					console.log("dojo/date/locale.parse: Could not parse am/pm part.");
					return false;
				}

				// we might not have seen the hours field yet, so store the state and apply hour change later
				amPm = (v == pm) ? 'p' : (v == am) ? 'a' : '';
				break;
			case 'K': //hour (1-24)
				if(v == 24){ v = 0; }
				// fallthrough...
			case 'h': //hour (1-12)
			case 'H': //hour (0-23)
			case 'k': //hour (0-11)
				//TODO: strict bounds checking, padding
				if(v > 23){
//					console.log("dojo/date/locale.parse: Illegal hours value");
					return false;
				}

				//in the 12-hour case, adjusting for am/pm requires the 'a' part
				//which could come before or after the hour, so we will adjust later
				result[3] = v;
				break;
			case 'm': //minutes
				result[4] = v;
				break;
			case 's': //seconds
				result[5] = v;
				break;
			case 'S': //milliseconds
				result[6] = v;
//				break;
//			case 'w':
//TODO				var firstDay = 0;
//			default:
//TODO: throw?
//				console.log("dojo/date/locale.parse: unsupported pattern char=" + token.charAt(0));
		}
		return true;
	});

	var hours = +result[3];
	if(amPm === 'p' && hours < 12){
		result[3] = hours + 12; //e.g., 3pm -> 15
	}else if(amPm === 'a' && hours == 12){
		result[3] = 0; //12am -> 0
	}

	//TODO: implement a getWeekday() method in order to test
	//validity of input strings containing 'EEE' or 'EEEE'...

	var dateObject = new Date(result[0], result[1], result[2], result[3], result[4], result[5], result[6]); // Date
	if(options.strict){
		dateObject.setFullYear(result[0]);
	}

	// Check for overflow.  The Date() constructor normalizes things like April 32nd...
	//TODO: why isn't this done for times as well?
	var allTokens = tokens.join(""),
		dateToken = allTokens.indexOf('d') != -1,
		monthToken = allTokens.indexOf('M') != -1;

	if(!valid ||
		(monthToken && dateObject.getMonth() > result[1]) ||
		(dateToken && dateObject.getDate() > result[2])){
		return null;
	}

	// Check for underflow, due to DST shifts.  See #9366
	// This assumes a 1 hour dst shift correction at midnight
	// We could compare the timezone offset after the shift and add the difference instead.
	if((monthToken && dateObject.getMonth() < result[1]) ||
		(dateToken && dateObject.getDate() < result[2])){
		dateObject = date.add(dateObject, "hour", 1);
	}

	return dateObject; // Date
};

function _processPattern(pattern, applyPattern, applyLiteral, applyAll){
	//summary: Process a pattern with literals in it

	// Break up on single quotes, treat every other one as a literal, except '' which becomes '
	var identity = function(x){return x;};
	applyPattern = applyPattern || identity;
	applyLiteral = applyLiteral || identity;
	applyAll = applyAll || identity;

	//split on single quotes (which escape literals in date format strings)
	//but preserve escaped single quotes (e.g., o''clock)
	var chunks = pattern.match(/(''|[^'])+/g),
		literal = pattern.charAt(0) == "'";

	array.forEach(chunks, function(chunk, i){
		if(!chunk){
			chunks[i]='';
		}else{
			chunks[i]=(literal ? applyLiteral : applyPattern)(chunk.replace(/''/g, "'"));
			literal = !literal;
		}
	});
	return applyAll(chunks.join(''));
}

function _buildDateTimeRE(tokens, bundle, options, pattern){
	pattern = regexp.escapeString(pattern);
	if(!options.strict){ pattern = pattern.replace(" a", " ?a"); } // kludge to tolerate no space before am/pm
	return pattern.replace(/([a-z])\1*/ig, function(match){
		// Build a simple regexp.  Avoid captures, which would ruin the tokens list
		var s,
			c = match.charAt(0),
			l = match.length,
			p2 = '', p3 = '';
		if(options.strict){
			if(l > 1){ p2 = '0' + '{'+(l-1)+'}'; }
			if(l > 2){ p3 = '0' + '{'+(l-2)+'}'; }
		}else{
			p2 = '0?'; p3 = '0{0,2}';
		}
		switch(c){
			case 'y':
				s = '\\d{2,4}';
				break;
			case 'M':
			case 'L':
				s = (l>2) ? '\\S+?' : '1[0-2]|'+p2+'[1-9]';
				break;
			case 'D':
				s = '[12][0-9][0-9]|3[0-5][0-9]|36[0-6]|'+p2+'[1-9][0-9]|'+p3+'[1-9]';
				break;
			case 'd':
				s = '3[01]|[12]\\d|'+p2+'[1-9]';
				break;
			case 'w':
				s = '[1-4][0-9]|5[0-3]|'+p2+'[1-9]';
				break;
			case 'E':
			case 'e':
			case 'c':
				s = '.+?'; // match anything including spaces until the first pattern delimiter is found such as a comma or space
				break;
			case 'h': //hour (1-12)
				s = '1[0-2]|'+p2+'[1-9]';
				break;
			case 'k': //hour (0-11)
				s = '1[01]|'+p2+'\\d';
				break;
			case 'H': //hour (0-23)
				s = '1\\d|2[0-3]|'+p2+'\\d';
				break;
			case 'K': //hour (1-24)
				s = '1\\d|2[0-4]|'+p2+'[1-9]';
				break;
			case 'm':
			case 's':
				s = '[0-5]\\d';
				break;
			case 'S':
				s = '\\d{'+l+'}';
				break;
			case 'a':
				var am = options.am || bundle['dayPeriods-format-wide-am'],
					pm = options.pm || bundle['dayPeriods-format-wide-pm'];
					s = am + '|' + pm;
				if(!options.strict){
					if(am != am.toLowerCase()){ s += '|' + am.toLowerCase(); }
					if(pm != pm.toLowerCase()){ s += '|' + pm.toLowerCase(); }
					if(s.indexOf('.') != -1){ s += '|' + s.replace(/\./g, ""); }
				}
				s = s.replace(/\./g, "\\.");
				break;
			default:
			// case 'v':
			// case 'z':
			// case 'Z':
				s = ".*";
//				console.log("parse of date format, pattern=" + pattern);
		}

		if(tokens){ tokens.push(match); }

		return "(" + s + ")"; // add capture
	}).replace(/[\xa0 ]/g, "[\\s\\xa0]"); // normalize whitespace.  Need explicit handling of \xa0 for IE.
}

var _customFormats = [];
exports.addCustomFormats = function(/*String*/ packageName, /*String*/ bundleName){
	// summary:
	//		Add a reference to a bundle containing localized custom formats to be
	//		used by date/time formatting and parsing routines.
	//
	// description:
	//		The user may add custom localized formats where the bundle has properties following the
	//		same naming convention used by dojo.cldr: `dateFormat-xxxx` / `timeFormat-xxxx`
	//		The pattern string should match the format used by the CLDR.
	//		See dojo/date/locale.format() for details.
	//		The resources must be loaded by dojo.requireLocalization() prior to use

	_customFormats.push({pkg:packageName,name:bundleName});
};

exports._getGregorianBundle = function(/*String*/ locale){
	var gregorian = {};
	array.forEach(_customFormats, function(desc){
		var bundle = i18n.getLocalization(desc.pkg, desc.name, locale);
		gregorian = lang.mixin(gregorian, bundle);
	}, this);
	return gregorian; /*Object*/
};

exports.addCustomFormats(module.id.replace(/\/date\/locale$/, ".cldr"),"gregorian");

exports.getNames = function(/*String*/ item, /*String*/ type, /*String?*/ context, /*String?*/ locale){
	// summary:
	//		Used to get localized strings from dojo.cldr for day or month names.
	//
	// item:
	//	'months' || 'days'
	// type:
	//	'wide' || 'abbr' || 'narrow' (e.g. "Monday", "Mon", or "M" respectively, in English)
	// context:
	//	'standAlone' || 'format' (default)
	// locale:
	//	override locale used to find the names

	var label,
		lookup = exports._getGregorianBundle(locale),
		props = [item, context, type];
	if(context == 'standAlone'){
		var key = props.join('-');
		label = lookup[key];
		// Fall back to 'format' flavor of name
		if(label[0] == 1){ label = undefined; } // kludge, in the absence of real aliasing support in dojo.cldr
	}
	props[1] = 'format';

	// return by copy so changes won't be made accidentally to the in-memory model
	return (label || lookup[props.join('-')]).concat(); /*Array*/
};

exports.isWeekend = function(/*Date?*/ dateObject, /*String?*/ locale){
	// summary:
	//	Determines if the date falls on a weekend, according to local custom.

	var weekend = supplemental.getWeekend(locale),
		day = (dateObject || new Date()).getDay();
	if(weekend.end < weekend.start){
		weekend.end += 7;
		if(day < weekend.start){ day += 7; }
	}
	return day >= weekend.start && day <= weekend.end; // Boolean
};

// These are used only by format and strftime.  Do they need to be public?  Which module should they go in?

exports._getDayOfYear = function(/*Date*/ dateObject){
	// summary:
	//		gets the day of the year as represented by dateObject
	return date.difference(new Date(dateObject.getFullYear(), 0, 1, dateObject.getHours()), dateObject) + 1; // Number
};

exports._getWeekOfYear = function(/*Date*/ dateObject, /*Number*/ firstDayOfWeek){
	if(arguments.length == 1){ firstDayOfWeek = 0; } // Sunday

	var firstDayOfYear = new Date(dateObject.getFullYear(), 0, 1).getDay(),
		adj = (firstDayOfYear - firstDayOfWeek + 7) % 7,
		week = Math.floor((exports._getDayOfYear(dateObject) + adj - 1) / 7);

	// if year starts on the specified day, start counting weeks at 1
	if(firstDayOfYear == firstDayOfWeek){ week++; }

	return week; // Number
};

return exports;
});

},
'dojo/cldr/supplemental':function(){
define(["../_base/lang", "../i18n"], function(lang, i18n){

// module:
//		dojo/cldr/supplemental


var supplemental = {
	// summary:
	//		TODOC
};
lang.setObject("dojo.cldr.supplemental", supplemental);

supplemental.getFirstDayOfWeek = function(/*String?*/locale){
	// summary:
	//		Returns a zero-based index for first day of the week
	// description:
	//		Returns a zero-based index for first day of the week, as used by the local (Gregorian) calendar.
	//		e.g. Sunday (returns 0), or Monday (returns 1)

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/weekData/firstDay
	var firstDay = {/*default is 1=Monday*/
		bd:5,mv:5,
		ae:6,af:6,bh:6,dj:6,dz:6,eg:6,iq:6,ir:6,jo:6,kw:6,
		ly:6,ma:6,om:6,qa:6,sa:6,sd:6,sy:6,ye:6,
		ag:0,ar:0,as:0,au:0,br:0,bs:0,bt:0,bw:0,by:0,bz:0,ca:0,cn:0,
		co:0,dm:0,'do':0,et:0,gt:0,gu:0,hk:0,hn:0,id:0,ie:0,il:0,'in':0,
		jm:0,jp:0,ke:0,kh:0,kr:0,la:0,mh:0,mm:0,mo:0,mt:0,mx:0,mz:0,
		ni:0,np:0,nz:0,pa:0,pe:0,ph:0,pk:0,pr:0,py:0,sg:0,sv:0,th:0,
		tn:0,tt:0,tw:0,um:0,us:0,ve:0,vi:0,ws:0,za:0,zw:0
	};

	var country = supplemental._region(locale);
	var dow = firstDay[country];
	return (dow === undefined) ? 1 : dow; /*Number*/
};

supplemental._region = function(/*String?*/locale){
	locale = i18n.normalizeLocale(locale);
	var tags = locale.split('-');
	var region = tags[1];
	if(!region){
		// IE often gives language only (#2269)
		// Arbitrary mappings of language-only locales to a country:
		region = {
			aa:"et", ab:"ge", af:"za", ak:"gh", am:"et", ar:"eg", as:"in", av:"ru", ay:"bo", az:"az", ba:"ru",
			be:"by", bg:"bg", bi:"vu", bm:"ml", bn:"bd", bo:"cn", br:"fr", bs:"ba", ca:"es", ce:"ru", ch:"gu",
			co:"fr", cr:"ca", cs:"cz", cv:"ru", cy:"gb", da:"dk", de:"de", dv:"mv", dz:"bt", ee:"gh", el:"gr",
			en:"us", es:"es", et:"ee", eu:"es", fa:"ir", ff:"sn", fi:"fi", fj:"fj", fo:"fo", fr:"fr", fy:"nl",
			ga:"ie", gd:"gb", gl:"es", gn:"py", gu:"in", gv:"gb", ha:"ng", he:"il", hi:"in", ho:"pg", hr:"hr",
			ht:"ht", hu:"hu", hy:"am", ia:"fr", id:"id", ig:"ng", ii:"cn", ik:"us", "in":"id", is:"is", it:"it",
			iu:"ca", iw:"il", ja:"jp", ji:"ua", jv:"id", jw:"id", ka:"ge", kg:"cd", ki:"ke", kj:"na", kk:"kz",
			kl:"gl", km:"kh", kn:"in", ko:"kr", ks:"in", ku:"tr", kv:"ru", kw:"gb", ky:"kg", la:"va", lb:"lu",
			lg:"ug", li:"nl", ln:"cd", lo:"la", lt:"lt", lu:"cd", lv:"lv", mg:"mg", mh:"mh", mi:"nz", mk:"mk",
			ml:"in", mn:"mn", mo:"ro", mr:"in", ms:"my", mt:"mt", my:"mm", na:"nr", nb:"no", nd:"zw", ne:"np",
			ng:"na", nl:"nl", nn:"no", no:"no", nr:"za", nv:"us", ny:"mw", oc:"fr", om:"et", or:"in", os:"ge",
			pa:"in", pl:"pl", ps:"af", pt:"br", qu:"pe", rm:"ch", rn:"bi", ro:"ro", ru:"ru", rw:"rw", sa:"in",
			sd:"in", se:"no", sg:"cf", si:"lk", sk:"sk", sl:"si", sm:"ws", sn:"zw", so:"so", sq:"al", sr:"rs",
			ss:"za", st:"za", su:"id", sv:"se", sw:"tz", ta:"in", te:"in", tg:"tj", th:"th", ti:"et", tk:"tm",
			tl:"ph", tn:"za", to:"to", tr:"tr", ts:"za", tt:"ru", ty:"pf", ug:"cn", uk:"ua", ur:"pk", uz:"uz",
			ve:"za", vi:"vn", wa:"be", wo:"sn", xh:"za", yi:"il", yo:"ng", za:"cn", zh:"cn", zu:"za",
			ace:"id", ady:"ru", agq:"cm", alt:"ru", amo:"ng", asa:"tz", ast:"es", awa:"in", bal:"pk",
			ban:"id", bas:"cm", bax:"cm", bbc:"id", bem:"zm", bez:"tz", bfq:"in", bft:"pk", bfy:"in",
			bhb:"in", bho:"in", bik:"ph", bin:"ng", bjj:"in", bku:"ph", bqv:"ci", bra:"in", brx:"in",
			bss:"cm", btv:"pk", bua:"ru", buc:"yt", bug:"id", bya:"id", byn:"er", cch:"ng", ccp:"in",
			ceb:"ph", cgg:"ug", chk:"fm", chm:"ru", chp:"ca", chr:"us", cja:"kh", cjm:"vn", ckb:"iq",
			crk:"ca", csb:"pl", dar:"ru", dav:"ke", den:"ca", dgr:"ca", dje:"ne", doi:"in", dsb:"de",
			dua:"cm", dyo:"sn", dyu:"bf", ebu:"ke", efi:"ng", ewo:"cm", fan:"gq", fil:"ph", fon:"bj",
			fur:"it", gaa:"gh", gag:"md", gbm:"in", gcr:"gf", gez:"et", gil:"ki", gon:"in", gor:"id",
			grt:"in", gsw:"ch", guz:"ke", gwi:"ca", haw:"us", hil:"ph", hne:"in", hnn:"ph", hoc:"in",
			hoj:"in", ibb:"ng", ilo:"ph", inh:"ru", jgo:"cm", jmc:"tz", kaa:"uz", kab:"dz", kaj:"ng",
			kam:"ke", kbd:"ru", kcg:"ng", kde:"tz", kdt:"th", kea:"cv", ken:"cm", kfo:"ci", kfr:"in",
			kha:"in", khb:"cn", khq:"ml", kht:"in", kkj:"cm", kln:"ke", kmb:"ao", koi:"ru", kok:"in",
			kos:"fm", kpe:"lr", krc:"ru", kri:"sl", krl:"ru", kru:"in", ksb:"tz", ksf:"cm", ksh:"de",
			kum:"ru", lag:"tz", lah:"pk", lbe:"ru", lcp:"cn", lep:"in", lez:"ru", lif:"np", lis:"cn",
			lki:"ir", lmn:"in", lol:"cd", lua:"cd", luo:"ke", luy:"ke", lwl:"th", mad:"id", mag:"in",
			mai:"in", mak:"id", man:"gn", mas:"ke", mdf:"ru", mdh:"ph", mdr:"id", men:"sl", mer:"ke",
			mfe:"mu", mgh:"mz", mgo:"cm", min:"id", mni:"in", mnk:"gm", mnw:"mm", mos:"bf", mua:"cm",
			mwr:"in", myv:"ru", nap:"it", naq:"na", nds:"de", "new":"np", niu:"nu", nmg:"cm", nnh:"cm",
			nod:"th", nso:"za", nus:"sd", nym:"tz", nyn:"ug", pag:"ph", pam:"ph", pap:"bq", pau:"pw",
			pon:"fm", prd:"ir", raj:"in", rcf:"re", rej:"id", rjs:"np", rkt:"in", rof:"tz", rwk:"tz",
			saf:"gh", sah:"ru", saq:"ke", sas:"id", sat:"in", saz:"in", sbp:"tz", scn:"it", sco:"gb",
			sdh:"ir", seh:"mz", ses:"ml", shi:"ma", shn:"mm", sid:"et", sma:"se", smj:"se", smn:"fi",
			sms:"fi", snk:"ml", srn:"sr", srr:"sn", ssy:"er", suk:"tz", sus:"gn", swb:"yt", swc:"cd",
			syl:"bd", syr:"sy", tbw:"ph", tcy:"in", tdd:"cn", tem:"sl", teo:"ug", tet:"tl", tig:"er",
			tiv:"ng", tkl:"tk", tmh:"ne", tpi:"pg", trv:"tw", tsg:"ph", tts:"th", tum:"mw", tvl:"tv",
			twq:"ne", tyv:"ru", tzm:"ma", udm:"ru", uli:"fm", umb:"ao", unr:"in", unx:"in", vai:"lr",
			vun:"tz", wae:"ch", wal:"et", war:"ph", xog:"ug", xsr:"np", yao:"mz", yap:"fm", yav:"cm", zza:"tr"
		}[tags[0]];
	}else if(region.length == 4){
		// The ISO 3166 country code is usually in the second position, unless a
		// 4-letter script is given. See http://www.ietf.org/rfc/rfc4646.txt
		region = tags[2];
	}
	return region;
};

supplemental.getWeekend = function(/*String?*/locale){
	// summary:
	//		Returns a hash containing the start and end days of the weekend
	// description:
	//		Returns a hash containing the start and end days of the weekend according to local custom using locale,
	//		or by default in the user's locale.
	//		e.g. {start:6, end:0}

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/weekData/weekend{Start,End}
	var weekendStart = {/*default is 6=Saturday*/
			'in':0,
			af:4,dz:4,ir:4,om:4,sa:4,ye:4,
			ae:5,bh:5,eg:5,il:5,iq:5,jo:5,kw:5,ly:5,ma:5,qa:5,sd:5,sy:5,tn:5
		},

		weekendEnd = {/*default is 0=Sunday*/
			af:5,dz:5,ir:5,om:5,sa:5,ye:5,
			ae:6,bh:5,eg:6,il:6,iq:6,jo:6,kw:6,ly:6,ma:6,qa:6,sd:6,sy:6,tn:6
		},

		country = supplemental._region(locale),
		start = weekendStart[country],
		end = weekendEnd[country];

	if(start === undefined){start=6;}
	if(end === undefined){end=0;}
	return {start:start, end:end}; /*Object {start,end}*/
};

return supplemental;
});

},
'dojo/i18n':function(){
define(["./_base/kernel", "require", "./has", "./_base/array", "./_base/config", "./_base/lang", "./_base/xhr", "./json", "module"],
	function(dojo, require, has, array, config, lang, xhr, json, module){

	// module:
	//		dojo/i18n

	has.add("dojo-preload-i18n-Api",
		// if true, define the preload localizations machinery
		1
	);

	 1 || has.add("dojo-v1x-i18n-Api",
		// if true, define the v1.x i18n functions
		1
	);

	var
		thisModule = dojo.i18n =
			{
				// summary:
				//		This module implements the dojo/i18n! plugin and the v1.6- i18n API
				// description:
				//		We choose to include our own plugin to leverage functionality already contained in dojo
				//		and thereby reduce the size of the plugin compared to various loader implementations. Also, this
				//		allows foreign AMD loaders to be used without their plugins.
			},

		nlsRe =
			// regexp for reconstructing the master bundle name from parts of the regexp match
			// nlsRe.exec("foo/bar/baz/nls/en-ca/foo") gives:
			// ["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
			// nlsRe.exec("foo/bar/baz/nls/foo") gives:
			// ["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
			// so, if match[5] is blank, it means this is the top bundle definition.
			// courtesy of http://requirejs.org
			/(^.*(^|\/)nls)(\/|$)([^\/]*)\/?([^\/]*)/,

		getAvailableLocales = function(
			root,
			locale,
			bundlePath,
			bundleName
		){
			// summary:
			//		return a vector of module ids containing all available locales with respect to the target locale
			//		For example, assuming:
			//
			//		- the root bundle indicates specific bundles for "fr" and "fr-ca",
			//		-  bundlePath is "myPackage/nls"
			//		- bundleName is "myBundle"
			//
			//		Then a locale argument of "fr-ca" would return
			//
			//			["myPackage/nls/myBundle", "myPackage/nls/fr/myBundle", "myPackage/nls/fr-ca/myBundle"]
			//
			//		Notice that bundles are returned least-specific to most-specific, starting with the root.
			//
			//		If root===false indicates we're working with a pre-AMD i18n bundle that doesn't tell about the available locales;
			//		therefore, assume everything is available and get 404 errors that indicate a particular localization is not available

			for(var result = [bundlePath + bundleName], localeParts = locale.split("-"), current = "", i = 0; i<localeParts.length; i++){
				current += (current ? "-" : "") + localeParts[i];
				if(!root || root[current]){
					result.push(bundlePath + current + "/" + bundleName);
					result.specificity = current;
				}
			}
			return result;
		},

		cache = {},

		getBundleName = function(moduleName, bundleName, locale){
			locale = locale ? locale.toLowerCase() : dojo.locale;
			moduleName = moduleName.replace(/\./g, "/");
			bundleName = bundleName.replace(/\./g, "/");
			return (/root/i.test(locale)) ?
				(moduleName + "/nls/" + bundleName) :
				(moduleName + "/nls/" + locale + "/" + bundleName);
		},

		getL10nName = dojo.getL10nName = function(moduleName, bundleName, locale){
			return moduleName = module.id + "!" + getBundleName(moduleName, bundleName, locale);
		},

		doLoad = function(require, bundlePathAndName, bundlePath, bundleName, locale, load){
			// summary:
			//		get the root bundle which instructs which other bundles are required to construct the localized bundle
			require([bundlePathAndName], function(root){
				var current = lang.clone(root.root),
					availableLocales = getAvailableLocales(!root._v1x && root, locale, bundlePath, bundleName);
				require(availableLocales, function(){
					for (var i = 1; i<availableLocales.length; i++){
						current = lang.mixin(lang.clone(current), arguments[i]);
					}
					// target may not have been resolve (e.g., maybe only "fr" exists when "fr-ca" was requested)
					var target = bundlePathAndName + "/" + locale;
					cache[target] = current;
					current.$locale = availableLocales.specificity;
					load();
				});
			});
		},

		normalize = function(id, toAbsMid){
			// summary:
			//		id may be relative.
			//		preload has form `*preload*<path>/nls/<module>*<flattened locales>` and
			//		therefore never looks like a relative
			return /^\./.test(id) ? toAbsMid(id) : id;
		},

		getLocalesToLoad = function(targetLocale){
			var list = config.extraLocale || [];
			list = lang.isArray(list) ? list : [list];
			list.push(targetLocale);
			return list;
		},

		load = function(id, require, load){
			// summary:
			//		id is in one of the following formats
			//
			//		1. <path>/nls/<bundle>
			//			=> load the bundle, localized to config.locale; load all bundles localized to
			//			config.extraLocale (if any); return the loaded bundle localized to config.locale.
			//
			//		2. <path>/nls/<locale>/<bundle>
			//			=> load then return the bundle localized to <locale>
			//
			//		3. *preload*<path>/nls/<module>*<JSON array of available locales>
			//			=> for config.locale and all config.extraLocale, load all bundles found
			//			in the best-matching bundle rollup. A value of 1 is returned, which
			//			is meaningless other than to say the plugin is executing the requested
			//			preloads
			//
			//		In cases 1 and 2, <path> is always normalized to an absolute module id upon entry; see
			//		normalize. In case 3, it <path> is assumed to be absolute; this is arranged by the builder.
			//
			//		To load a bundle means to insert the bundle into the plugin's cache and publish the bundle
			//		value to the loader. Given <path>, <bundle>, and a particular <locale>, the cache key
			//
			//			<path>/nls/<bundle>/<locale>
			//
			//		will hold the value. Similarly, then plugin will publish this value to the loader by
			//
			//			define("<path>/nls/<bundle>/<locale>", <bundle-value>);
			//
			//		Given this algorithm, other machinery can provide fast load paths be preplacing
			//		values in the plugin's cache, which is public. When a load is demanded the
			//		cache is inspected before starting any loading. Explicitly placing values in the plugin
			//		cache is an advanced/experimental feature that should not be needed; use at your own risk.
			//
			//		For the normal AMD algorithm, the root bundle is loaded first, which instructs the
			//		plugin what additional localized bundles are required for a particular locale. These
			//		additional locales are loaded and a mix of the root and each progressively-specific
			//		locale is returned. For example:
			//
			//		1. The client demands "dojo/i18n!some/path/nls/someBundle
			//
			//		2. The loader demands load(some/path/nls/someBundle)
			//
			//		3. This plugin require's "some/path/nls/someBundle", which is the root bundle.
			//
			//		4. Assuming config.locale is "ab-cd-ef" and the root bundle indicates that localizations
			//		are available for "ab" and "ab-cd-ef" (note the missing "ab-cd", then the plugin
			//		requires "some/path/nls/ab/someBundle" and "some/path/nls/ab-cd-ef/someBundle"
			//
			//		5. Upon receiving all required bundles, the plugin constructs the value of the bundle
			//		ab-cd-ef as...
			//
			//				mixin(mixin(mixin({}, require("some/path/nls/someBundle"),
			//		  			require("some/path/nls/ab/someBundle")),
			//					require("some/path/nls/ab-cd-ef/someBundle"));
			//
			//		This value is inserted into the cache and published to the loader at the
			//		key/module-id some/path/nls/someBundle/ab-cd-ef.
			//
			//		The special preload signature (case 3) instructs the plugin to stop servicing all normal requests
			//		(further preload requests will be serviced) until all ongoing preloading has completed.
			//
			//		The preload signature instructs the plugin that a special rollup module is available that contains
			//		one or more flattened, localized bundles. The JSON array of available locales indicates which locales
			//		are available. Here is an example:
			//
			//			*preload*some/path/nls/someModule*["root", "ab", "ab-cd-ef"]
			//
			//		This indicates the following rollup modules are available:
			//
			//			some/path/nls/someModule_ROOT
			//			some/path/nls/someModule_ab
			//			some/path/nls/someModule_ab-cd-ef
			//
			//		Each of these modules is a normal AMD module that contains one or more flattened bundles in a hash.
			//		For example, assume someModule contained the bundles some/bundle/path/someBundle and
			//		some/bundle/path/someOtherBundle, then some/path/nls/someModule_ab would be expressed as follows:
			//
			//			define({
			//				some/bundle/path/someBundle:<value of someBundle, flattened with respect to locale ab>,
			//				some/bundle/path/someOtherBundle:<value of someOtherBundle, flattened with respect to locale ab>,
			//			});
			//
			//		E.g., given this design, preloading for locale=="ab" can execute the following algorithm:
			//
			//			require(["some/path/nls/someModule_ab"], function(rollup){
			//				for(var p in rollup){
			//					var id = p + "/ab",
			//					cache[id] = rollup[p];
			//					define(id, rollup[p]);
			//				}
			//			});
			//
			//		Similarly, if "ab-cd" is requested, the algorithm can determine that "ab" is the best available and
			//		load accordingly.
			//
			//		The builder will write such rollups for every layer if a non-empty localeList  profile property is
			//		provided. Further, the builder will include the following cache entry in the cache associated with
			//		any layer.
			//
			//			"*now":function(r){r(['dojo/i18n!*preload*<path>/nls/<module>*<JSON array of available locales>']);}
			//
			//		The *now special cache module instructs the loader to apply the provided function to context-require
			//		with respect to the particular layer being defined. This causes the plugin to hold all normal service
			//		requests until all preloading is complete.
			//
			//		Notice that this algorithm is rarely better than the standard AMD load algorithm. Consider the normal case
			//		where the target locale has a single segment and a layer depends on a single bundle:
			//
			//		Without Preloads:
			//
			//		1. Layer loads root bundle.
			//		2. bundle is demanded; plugin loads single localized bundle.
			//
			//		With Preloads:
			//
			//		1. Layer causes preloading of target bundle.
			//		2. bundle is demanded; service is delayed until preloading complete; bundle is returned.
			//
			//		In each case a single transaction is required to load the target bundle. In cases where multiple bundles
			//		are required and/or the locale has multiple segments, preloads still requires a single transaction whereas
			//		the normal path requires an additional transaction for each additional bundle/locale-segment. However all
			//		of these additional transactions can be done concurrently. Owing to this analysis, the entire preloading
			//		algorithm can be discard during a build by setting the has feature dojo-preload-i18n-Api to false.

			if(has("dojo-preload-i18n-Api")){
				var split = id.split("*"),
					preloadDemand = split[1] == "preload";
				if(preloadDemand){
					if(!cache[id]){
						// use cache[id] to prevent multiple preloads of the same preload; this shouldn't happen, but
						// who knows what over-aggressive human optimizers may attempt
						cache[id] = 1;
						preloadL10n(split[2], json.parse(split[3]), 1, require);
					}
					// don't stall the loader!
					load(1);
				}
				if(preloadDemand || waitForPreloads(id, require, load)){
					return;
				}
			}

			var match = nlsRe.exec(id),
				bundlePath = match[1] + "/",
				bundleName = match[5] || match[4],
				bundlePathAndName = bundlePath + bundleName,
				localeSpecified = (match[5] && match[4]),
				targetLocale =	localeSpecified || dojo.locale || "",
				loadTarget = bundlePathAndName + "/" + targetLocale,
				loadList = localeSpecified ? [targetLocale] : getLocalesToLoad(targetLocale),
				remaining = loadList.length,
				finish = function(){
					if(!--remaining){
						load(lang.delegate(cache[loadTarget]));
					}
				};
			array.forEach(loadList, function(locale){
				var target = bundlePathAndName + "/" + locale;
				if(has("dojo-preload-i18n-Api")){
					checkForLegacyModules(target);
				}
				if(!cache[target]){
					doLoad(require, bundlePathAndName, bundlePath, bundleName, locale, finish);
				}else{
					finish();
				}
			});
		};

	if(has("dojo-unit-tests")){
		var unitTests = thisModule.unitTests = [];
	}

	if(has("dojo-preload-i18n-Api") ||  1 ){
		var normalizeLocale = thisModule.normalizeLocale = function(locale){
				var result = locale ? locale.toLowerCase() : dojo.locale;
				return result == "root" ? "ROOT" : result;
			},

			isXd = function(mid, contextRequire){
				return ( 1  &&  1 ) ?
					contextRequire.isXdUrl(require.toUrl(mid + ".js")) :
					true;
			},

			preloading = 0,

			preloadWaitQueue = [],

			preloadL10n = thisModule._preloadLocalizations = function(/*String*/bundlePrefix, /*Array*/localesGenerated, /*boolean?*/ guaranteedAmdFormat, /*function?*/ contextRequire){
				// summary:
				//		Load available flattened resource bundles associated with a particular module for dojo/locale and all dojo/config.extraLocale (if any)
				// description:
				//		Only called by built layer files. The entire locale hierarchy is loaded. For example,
				//		if locale=="ab-cd", then ROOT, "ab", and "ab-cd" are loaded. This is different than v1.6-
				//		in that the v1.6- would only load ab-cd...which was *always* flattened.
				//
				//		If guaranteedAmdFormat is true, then the module can be loaded with require thereby circumventing the detection algorithm
				//		and the extra possible extra transaction.

				// If this function is called from legacy code, then guaranteedAmdFormat and contextRequire will be undefined. Since the function
				// needs a require in order to resolve module ids, fall back to the context-require associated with this dojo/i18n module, which
				// itself may have been mapped.
				contextRequire = contextRequire || require;

				function doRequire(mid, callback){
					if(isXd(mid, contextRequire) || guaranteedAmdFormat){
						contextRequire([mid], callback);
					}else{
						syncRequire([mid], callback, contextRequire);
					}
				}

				function forEachLocale(locale, func){
					// given locale= "ab-cd-ef", calls func on "ab-cd-ef", "ab-cd", "ab", "ROOT"; stops calling the first time func returns truthy
					var parts = locale.split("-");
					while(parts.length){
						if(func(parts.join("-"))){
							return;
						}
						parts.pop();
					}
					func("ROOT");
				}

				function preload(locale){
					locale = normalizeLocale(locale);
					forEachLocale(locale, function(loc){
						if(array.indexOf(localesGenerated, loc)>=0){
							var mid = bundlePrefix.replace(/\./g, "/")+"_"+loc;
							preloading++;
							doRequire(mid, function(rollup){
								for(var p in rollup){
									cache[require.toAbsMid(p) + "/" + loc] = rollup[p];
								}
								--preloading;
								while(!preloading && preloadWaitQueue.length){
									load.apply(null, preloadWaitQueue.shift());
								}
							});
							return true;
						}
						return false;
					});
				}

				preload();
				array.forEach(dojo.config.extraLocale, preload);
			},

			waitForPreloads = function(id, require, load){
				if(preloading){
					preloadWaitQueue.push([id, require, load]);
				}
				return preloading;
			},

			checkForLegacyModules = function()
				{};
	}

	if( 1 ){
		// this code path assumes the dojo loader and won't work with a standard AMD loader
		var amdValue = {},
			evalBundle =
				// use the function ctor to keep the minifiers away (also come close to global scope, but this is secondary)
				new Function(
					"__bundle",				   // the bundle to evalutate
					"__checkForLegacyModules", // a function that checks if __bundle defined __mid in the global space
					"__mid",				   // the mid that __bundle is intended to define
					"__amdValue",

					// returns one of:
					//		1 => the bundle was an AMD bundle
					//		a legacy bundle object that is the value of __mid
					//		instance of Error => could not figure out how to evaluate bundle

					  // used to detect when __bundle calls define
					  "var define = function(mid, factory){define.called = 1; __amdValue.result = factory || mid;},"
					+ "	   require = function(){define.called = 1;};"

					+ "try{"
					+		"define.called = 0;"
					+		"eval(__bundle);"
					+		"if(define.called==1)"
								// bundle called define; therefore signal it's an AMD bundle
					+			"return __amdValue;"

					+		"if((__checkForLegacyModules = __checkForLegacyModules(__mid)))"
								// bundle was probably a v1.6- built NLS flattened NLS bundle that defined __mid in the global space
					+			"return __checkForLegacyModules;"

					+ "}catch(e){}"
					// evaulating the bundle was *neither* an AMD *nor* a legacy flattened bundle
					// either way, re-eval *after* surrounding with parentheses

					+ "try{"
					+		"return eval('('+__bundle+')');"
					+ "}catch(e){"
					+		"return e;"
					+ "}"
				),

			syncRequire = function(deps, callback, require){
				var results = [];
				array.forEach(deps, function(mid){
					var url = require.toUrl(mid + ".js");

					function load(text){
						var result = evalBundle(text, checkForLegacyModules, mid, amdValue);
						if(result===amdValue){
							// the bundle was an AMD module; re-inject it through the normal AMD path
							// we gotta do this since it could be an anonymous module and simply evaluating
							// the text here won't provide the loader with the context to know what
							// module is being defined()'d. With browser caching, this should be free; further
							// this entire code path can be circumvented by using the AMD format to begin with
							results.push(cache[url] = amdValue.result);
						}else{
							if(result instanceof Error){
								console.error("failed to evaluate i18n bundle; url=" + url, result);
								result = {};
							}
							// nls/<locale>/<bundle-name> indicates not the root.
							results.push(cache[url] = (/nls\/[^\/]+\/[^\/]+$/.test(url) ? result : {root:result, _v1x:1}));
						}
					}

					if(cache[url]){
						results.push(cache[url]);
					}else{
						var bundle = require.syncLoadNls(mid);
						// don't need to check for legacy since syncLoadNls returns a module if the module
						// (1) was already loaded, or (2) was in the cache. In case 1, if syncRequire is called
						// from getLocalization --> load, then load will have called checkForLegacyModules() before
						// calling syncRequire; if syncRequire is called from preloadLocalizations, then we
						// don't care about checkForLegacyModules() because that will be done when a particular
						// bundle is actually demanded. In case 2, checkForLegacyModules() is never relevant
						// because cached modules are always v1.7+ built modules.
						if(bundle){
							results.push(bundle);
						}else{
							if(!xhr){
								try{
									require.getText(url, true, load);
								}catch(e){
									results.push(cache[url] = {});
								}
							}else{
								xhr.get({
									url:url,
									sync:true,
									load:load,
									error:function(){
										results.push(cache[url] = {});
									}
								});
							}
						}
					}
				});
				callback && callback.apply(null, results);
			};

		checkForLegacyModules = function(target){
			// legacy code may have already loaded [e.g] the raw bundle x/y/z at x.y.z; when true, push into the cache
			for(var result, names = target.split("/"), object = dojo.global[names[0]], i = 1; object && i<names.length-1; object = object[names[i++]]){}
			if(object){
				result = object[names[i]];
				if(!result){
					// fallback for incorrect bundle build of 1.6
					result = object[names[i].replace(/-/g,"_")];
				}
				if(result){
					cache[target] = result;
				}
			}
			return result;
		};

		thisModule.getLocalization = function(moduleName, bundleName, locale){
			var result,
				l10nName = getBundleName(moduleName, bundleName, locale);
			load(
				l10nName,

				// isXd() and syncRequire() need a context-require in order to resolve the mid with respect to a reference module.
				// Since this legacy function does not have the concept of a reference module, resolve with respect to this
				// dojo/i18n module, which, itself may have been mapped.
				(!isXd(l10nName, require) ? function(deps, callback){ syncRequire(deps, callback, require); } : require),

				function(result_){ result = result_; }
			);
			return result;
		};

		if(has("dojo-unit-tests")){
			unitTests.push(function(doh){
				doh.register("tests.i18n.unit", function(t){
					var check;

					check = evalBundle("{prop:1}", checkForLegacyModules, "nonsense", amdValue);
					t.is({prop:1}, check); t.is(undefined, check[1]);

					check = evalBundle("({prop:1})", checkForLegacyModules, "nonsense", amdValue);
					t.is({prop:1}, check); t.is(undefined, check[1]);

					check = evalBundle("{'prop-x':1}", checkForLegacyModules, "nonsense", amdValue);
					t.is({'prop-x':1}, check); t.is(undefined, check[1]);

					check = evalBundle("({'prop-x':1})", checkForLegacyModules, "nonsense", amdValue);
					t.is({'prop-x':1}, check); t.is(undefined, check[1]);

					check = evalBundle("define({'prop-x':1})", checkForLegacyModules, "nonsense", amdValue);
					t.is(amdValue, check); t.is({'prop-x':1}, amdValue.result);

					check = evalBundle("define('some/module', {'prop-x':1})", checkForLegacyModules, "nonsense", amdValue);
					t.is(amdValue, check); t.is({'prop-x':1}, amdValue.result);

					check = evalBundle("this is total nonsense and should throw an error", checkForLegacyModules, "nonsense", amdValue);
					t.is(check instanceof Error, true);
				});
			});
		}
	}

	return lang.mixin(thisModule, {
		dynamic:true,
		normalize:normalize,
		load:load,
		cache:cache,
		getL10nName: getL10nName
	});
});

},
'dijit/CalendarLite':function(){
define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/declare", // declare
	"dojo/cldr/supplemental", // cldrSupplemental.getFirstDayOfWeek
	"dojo/date", // date
	"dojo/date/locale",
	"dojo/date/stamp", // stamp.fromISOString
	"dojo/dom", // dom.setSelectable
	"dojo/dom-class", // domClass.contains
	"dojo/_base/lang", // lang.getObject, lang.hitch
	"dojo/on",
	"dojo/sniff", // has("ie") has("webkit")
	"dojo/string", // string.substitute
	"./_WidgetBase",
	"./_TemplatedMixin",
	"dojo/text!./templates/Calendar.html",
	"./a11yclick",	// not used directly, but template has ondijitclick in it
	"./hccss"    // not used directly, but sets CSS class on <body>
], function(array, declare, cldrSupplemental, date, locale, stamp, dom, domClass, lang, on, has, string, _WidgetBase, _TemplatedMixin, template){


	// module:
	//		dijit/CalendarLite

	var CalendarLite = declare("dijit.CalendarLite", [_WidgetBase, _TemplatedMixin], {
		// summary:
		//		Lightweight version of Calendar widget aimed towards mobile use
		//
		// description:
		//		A simple GUI for choosing a date in the context of a monthly calendar.
		//		This widget can't be used in a form because it doesn't serialize the date to an
		//		`<input>` field.  For a form element, use dijit/form/DateTextBox instead.
		//
		//		Note that the parser takes all dates attributes passed in the
		//		[RFC 3339 format](http://www.faqs.org/rfcs/rfc3339.html), e.g. `2005-06-30T08:05:00-07:00`
		//		so that they are serializable and locale-independent.
		//
		//		Also note that this widget isn't keyboard accessible; use dijit.Calendar for that
		// example:
		//	|	var calendar = new dijit.CalendarLite({}, dojo.byId("calendarNode"));
		//
		// example:
		//	|	<div data-dojo-type="dijit/CalendarLite"></div>

		// Template for main calendar
		templateString: template,

		// Template for cell for a day of the week (ex: M)
		dowTemplateString: '<th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel">${d}</span></th>',

		// Templates for a single date (ex: 13), and for a row for a week (ex: 20 21 22 23 24 25 26)
		dateTemplateString: '<td class="dijitReset" role="gridcell" data-dojo-attach-point="dateCells"><span class="dijitCalendarDateLabel" data-dojo-attach-point="dateLabels"></span></td>',
		weekTemplateString: '<tr class="dijitReset dijitCalendarWeekTemplate" role="row">${d}${d}${d}${d}${d}${d}${d}</tr>',

		// value: Date
		//		The currently selected Date, initially set to invalid date to indicate no selection.
		value: new Date(""),
		// TODO: for 2.0 make this a string (ISO format) rather than a Date

		// datePackage: String
		//		JavaScript namespace to find calendar routines.	 If unspecified, uses Gregorian calendar routines
		//		at dojo/date and dojo/date/locale.
		datePackage: "",
		//		TODO: for 2.0, replace datePackage with dateModule and dateLocalModule attributes specifying MIDs,
		//		or alternately just get rid of this completely and tell user to use module ID remapping
		//		via require

		// dayWidth: String
		//		How to represent the days of the week in the calendar header. See locale
		dayWidth: "narrow",

		// tabIndex: String
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",

		// currentFocus: Date
		//		Date object containing the currently focused date, or the date which would be focused
		//		if the calendar itself was focused.   Also indicates which year and month to display,
		//		i.e. the current "page" the calendar is on.
		currentFocus: new Date(),

		// Put the summary to the node with role=grid
		_setSummaryAttr: "gridNode",

		baseClass: "dijitCalendar",

		_isValidDate: function(/*Date*/ value){
			// summary:
			//		Runs various tests on the value, checking that it's a valid date, rather
			//		than blank or NaN.
			// tags:
			//		private
			return value && !isNaN(value) && typeof value == "object" &&
				value.toString() != this.constructor.prototype.value.toString();
		},

		_getValueAttr: function(){
			// summary:
			//		Support get('value')

			// this.value is set to 1AM, but return midnight, local time for back-compat
			var storedVal = this._get("value");
			if(storedVal && !isNaN(storedVal)){
				var value = new this.dateClassObj(storedVal);
				value.setHours(0, 0, 0, 0);

				// If daylight savings pushes midnight to the previous date, fix the Date
				// object to point at 1am so it will represent the correct day. See #9366
				if(value.getDate() < storedVal.getDate()){
					value = this.dateModule.add(value, "hour", 1);
				}
				return value;
			}else{
				return null;
			}
		},

		_setValueAttr: function(/*Date|Number*/ value, /*Boolean*/ priorityChange){
			// summary:
			//		Support set("value", ...)
			// description:
			//		Set the current date and update the UI.  If the date is disabled, the value will
			//		not change, but the display will change to the corresponding month.
			// value:
			//		Either a Date or the number of seconds since 1970.
			// tags:
			//		protected
			if(typeof value == "string"){
				value = stamp.fromISOString(value);
			}
			value = this._patchDate(value);

			if(this._isValidDate(value) && !this.isDisabledDate(value, this.lang)){
				this._set("value", value);

				// Set focus cell to the new value.   Arguably this should only happen when there isn't a current
				// focus point.   This will also repopulate the grid to new month/year if necessary.
				this.set("currentFocus", value);

				// Mark the selected date
				this._markSelectedDates([value]);

				if(this._created && (priorityChange || typeof priorityChange == "undefined")){
					this.onChange(this.get('value'));
				}
			}else{
				// clear value, and mark all dates as unselected
				this._set("value", null);
				this._markSelectedDates([]);
			}
		},

		_patchDate: function(/*Date|Number*/ value){
			// summary:
			//		Convert Number into Date, or copy Date object.   Then, round to nearest day,
			//		setting to 1am to avoid issues when DST shift occurs at midnight, see #8521, #9366)
			if(value){
				value = new this.dateClassObj(value);
				value.setHours(1, 0, 0, 0);
			}
			return value;
		},

		_setText: function(node, text){
			// summary:
			//		This just sets the content of node to the specified text.
			//		Can't do "node.innerHTML=text" because of an IE bug w/tables, see #3434.
			// tags:
			//		private
			while(node.firstChild){
				node.removeChild(node.firstChild);
			}
			node.appendChild(node.ownerDocument.createTextNode(text));
		},

		_populateGrid: function(){
			// summary:
			//		Fills in the calendar grid with each day (1-31).
			//		Call this on creation, when moving to a new month.
			// tags:
			//		private

			var month = new this.dateClassObj(this.currentFocus);
			month.setDate(1);
			month = this._patchDate(month);	// needed if currentFocus is start or end of DST, see #17033

			var firstDay = month.getDay(),
				daysInMonth = this.dateModule.getDaysInMonth(month),
				daysInPreviousMonth = this.dateModule.getDaysInMonth(this.dateModule.add(month, "month", -1)),
				today = new this.dateClassObj(),
				dayOffset = cldrSupplemental.getFirstDayOfWeek(this.lang);
			if(dayOffset > firstDay){
				dayOffset -= 7;
			}

			// If they didn't provide a summary, change the default summary to match with the new month
			if(!this.summary){
				var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month)
				this.gridNode.setAttribute("summary", monthNames[month.getMonth()]);
			}

			// Mapping from date (as specified by number returned from Date.valueOf()) to corresponding <td>
			this._date2cell = {};

			// Iterate through dates in the calendar and fill in date numbers and style info
			array.forEach(this.dateCells, function(template, idx){
				var i = idx + dayOffset;
				var date = new this.dateClassObj(month),
					number, clazz = "dijitCalendar", adj = 0;

				if(i < firstDay){
					number = daysInPreviousMonth - firstDay + i + 1;
					adj = -1;
					clazz += "Previous";
				}else if(i >= (firstDay + daysInMonth)){
					number = i - firstDay - daysInMonth + 1;
					adj = 1;
					clazz += "Next";
				}else{
					number = i - firstDay + 1;
					clazz += "Current";
				}

				if(adj){
					date = this.dateModule.add(date, "month", adj);
				}
				date.setDate(number);

				if(!this.dateModule.compare(date, today, "date")){
					clazz = "dijitCalendarCurrentDate " + clazz;
				}

				if(this.isDisabledDate(date, this.lang)){
					clazz = "dijitCalendarDisabledDate " + clazz;
					template.setAttribute("aria-disabled", "true");
				}else{
					clazz = "dijitCalendarEnabledDate " + clazz;
					template.removeAttribute("aria-disabled");
					template.setAttribute("aria-selected", "false");
				}

				var clazz2 = this.getClassForDate(date, this.lang);
				if(clazz2){
					clazz = clazz2 + " " + clazz;
				}

				template.className = clazz + "Month dijitCalendarDateTemplate";

				// Each cell has an associated integer value representing it's date
				var dateVal = date.valueOf();
				if(idx==0)
					console.log("setting date2cell[" + dateVal + "]");
				this._date2cell[dateVal] = template;
				template.dijitDateValue = dateVal;

				// Set Date string (ex: "13").
				this._setText(this.dateLabels[idx], date.getDateLocalized ? date.getDateLocalized(this.lang) : date.getDate());
			}, this);
		},

		_populateControls: function(){
			// summary:
			//		Fill in localized month, and prev/current/next years
			// tags:
			//		protected

			var month = new this.dateClassObj(this.currentFocus);
			month.setDate(1);

			// set name of this month
			this.monthWidget.set("month", month);

			var y = month.getFullYear() - 1;
			var d = new this.dateClassObj();
			array.forEach(["previous", "current", "next"], function(name){
				d.setFullYear(y++);
				this._setText(this[name + "YearLabelNode"],
					this.dateLocaleModule.format(d, {selector: 'year', locale: this.lang}));
			}, this);
		},

		goToToday: function(){
			// summary:
			//		Sets calendar's value to today's date
			this.set('value', new this.dateClassObj());
		},

		constructor: function(params /*===== , srcNodeRef =====*/){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified, replace srcNodeRef with my generated DOM tree

			this.dateModule = params.datePackage ? lang.getObject(params.datePackage, false) : date;
			this.dateClassObj = this.dateModule.Date || Date;
			this.dateLocaleModule = params.datePackage ? lang.getObject(params.datePackage + ".locale", false) : locale;
		},

		_createMonthWidget: function(){
			// summary:
			//		Creates the drop down button that displays the current month and lets user pick a new one

			return CalendarLite._MonthWidget({
				id: this.id + "_mddb",
				lang: this.lang,
				dateLocaleModule: this.dateLocaleModule
			}, this.monthNode);
		},

		buildRendering: function(){
			// Markup for days of the week (referenced from template)
			var d = this.dowTemplateString,
				dayNames = this.dateLocaleModule.getNames('days', this.dayWidth, 'standAlone', this.lang),
				dayOffset = cldrSupplemental.getFirstDayOfWeek(this.lang);
			this.dayCellsHtml = string.substitute([d, d, d, d, d, d, d].join(""), {d: ""}, function(){
				return dayNames[dayOffset++ % 7];
			});

			// Markup for dates of the month (referenced from template), but without numbers filled in
			var r = string.substitute(this.weekTemplateString, {d: this.dateTemplateString});
			this.dateRowsHtml = [r, r, r, r, r, r].join("");

			// Instantiate from template.
			// dateCells and dateLabels arrays filled when _Templated parses my template.
			this.dateCells = [];
			this.dateLabels = [];
			this.inherited(arguments);

			dom.setSelectable(this.domNode, false);

			var dateObj = new this.dateClassObj(this.currentFocus);

			this.monthWidget = this._createMonthWidget();

			this.set('currentFocus', dateObj, false);	// draw the grid to the month specified by currentFocus
		},

		postCreate: function(){
			this.inherited(arguments);
			this._connectControls();
		},

		_connectControls: function(){
			// summary:
			//		Set up connects for increment/decrement of months/years
			// tags:
			//		protected

			var connect = lang.hitch(this, function(nodeProp, part, amount){
				return on(this[nodeProp], "click", lang.hitch(this, function(){
					this._setCurrentFocusAttr(this.dateModule.add(this.currentFocus, part, amount));
				}));
			});

			this.own(
				connect("incrementMonth", "month", 1),
				connect("decrementMonth", "month", -1),
				connect("nextYearLabelNode", "year", 1),
				connect("previousYearLabelNode", "year", -1)
			);
		},

		_setCurrentFocusAttr: function(/*Date*/ date, /*Boolean*/ forceFocus){
			// summary:
			//		If the calendar currently has focus, then focuses specified date,
			//		changing the currently displayed month/year if necessary.
			//		If the calendar doesn't have focus, updates currently
			//		displayed month/year, and sets the cell that will get focus
			//		when Calendar is focused.
			// forceFocus:
			//		If true, will focus() the cell even if calendar itself doesn't have focus

			var oldFocus = this.currentFocus,
				oldCell = this._getNodeByDate(oldFocus);
			date = this._patchDate(date);

			this._set("currentFocus", date);

			// If the focus is on a different month than the current calendar month, switch the displayed month.
			// Also will populate the grid initially, on Calendar creation.
			if(!this._date2cell || this.dateModule.difference(oldFocus, date, "month") != 0){
				this._populateGrid();
				this._populateControls();
				this._markSelectedDates([this.value]);
			}

			// set tabIndex=0 on new cell, and focus it (but only if Calendar itself is focused)
			var newCell = this._getNodeByDate(date);
			newCell.setAttribute("tabIndex", this.tabIndex);
			if(this.focused || forceFocus){
				newCell.focus();
			}

			// set tabIndex=-1 on old focusable cell
			if(oldCell && oldCell != newCell){
				if(has("webkit")){    // see #11064 about webkit bug
					oldCell.setAttribute("tabIndex", "-1");
				}else{
					oldCell.removeAttribute("tabIndex");
				}
			}
		},

		focus: function(){
			// summary:
			//		Focus the calendar by focusing one of the calendar cells
			this._setCurrentFocusAttr(this.currentFocus, true);
		},

		_onDayClick: function(/*Event*/ evt){
			// summary:
			//		Handler for day clicks, selects the date if appropriate
			// tags:
			//		protected
			evt.stopPropagation();
			evt.preventDefault();
			for(var node = evt.target; node && !node.dijitDateValue; node = node.parentNode){
				;
			}
			if(node && !domClass.contains(node, "dijitCalendarDisabledDate")){
				this.set('value', node.dijitDateValue);
			}
		},

		_getNodeByDate: function(/*Date*/ value){
			// summary:
			//		Returns the cell corresponding to the date, or null if the date is not within the currently
			//		displayed month.
			value = this._patchDate(value);
			return value && this._date2cell ? this._date2cell[value.valueOf()] : null;
		},

		_markSelectedDates: function(/*Date[]*/ dates){
			// summary:
			//		Marks the specified cells as selected, and clears cells previously marked as selected.
			//		For CalendarLite at most one cell is selected at any point, but this allows an array
			//		for easy subclassing.

			// Function to mark a cell as selected or unselected
			function mark(/*Boolean*/ selected, /*DomNode*/ cell){
				domClass.toggle(cell, "dijitCalendarSelectedDate", selected);
				cell.setAttribute("aria-selected", selected ? "true" : "false");
			}

			// Clear previously selected cells.
			array.forEach(this._selectedCells || [], lang.partial(mark, false));

			// Mark newly selected cells.  Ignore dates outside the currently displayed month.
			this._selectedCells = array.filter(array.map(dates, this._getNodeByDate, this), function(n){
				return n;
			});
			array.forEach(this._selectedCells, lang.partial(mark, true));
		},

		onChange: function(/*Date*/ /*===== date =====*/){
			// summary:
			//		Called only when the selected date has changed
		},

		isDisabledDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to disable certain dates in the calendar e.g. `isDisabledDate=dojo.date.locale.isWeekend`
			// dateObject: Date
			// locale: String?
			// tags:
			//		extension
			/*=====
			 return false; // Boolean
			 =====*/
		},

		getClassForDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to return CSS classes to associate with the date entry for the given dateObject,
			//		for example to indicate a holiday in specified locale.
			// dateObject: Date
			// locale: String?
			// tags:
			//		extension

			/*=====
			 return ""; // String
			 =====*/
		}
	});

	CalendarLite._MonthWidget = declare("dijit.CalendarLite._MonthWidget", _WidgetBase, {
		// summary:
		//		Displays name of current month padded to the width of the month
		//		w/the longest name, so that changing months doesn't change width.
		//
		//		Create as:
		// |	new Calendar._MonthWidget({
		// |			lang: ...,
		// |			dateLocaleModule: ...
		// |		})

		_setMonthAttr: function(month){
			// summary:
			//		Set the current month to display as a label
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month),
				spacer =
					(has("ie") == 6 ? "" : "<div class='dijitSpacer'>" +
						array.map(monthNames,function(s){
							return "<div>" + s + "</div>";
						}).join("") + "</div>");

			// Set name of current month and also fill in spacer element with all the month names
			// (invisible) so that the maximum width will affect layout.   But not on IE6 because then
			// the center <TH> overlaps the right <TH> (due to a browser bug).
			this.domNode.innerHTML =
				spacer +
					"<div class='dijitCalendarMonthLabel dijitCalendarCurrentMonthLabel'>" +
					monthNames[month.getMonth()] + "</div>";
		}
	});

	return CalendarLite;
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
'dijit/form/DropDownButton':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // hitch
	"dojo/query", // query
	"../registry", // registry.byNode
	"../popup", // dijit.popup2.hide
	"./Button",
	"../_Container",
	"../_HasDropDown",
	"dojo/text!./templates/DropDownButton.html"
], function(declare, lang, query, registry, popup, Button, _Container, _HasDropDown, template){

	// module:
	//		dijit/form/DropDownButton

	return declare("dijit.form.DropDownButton", [Button, _Container, _HasDropDown], {
		// summary:
		//		A button with a drop down
		//
		// example:
		// |	<button data-dojo-type="dijit/form/DropDownButton">
		// |		Hello world
		// |		<div data-dojo-type="dijit/Menu">...</div>
		// |	</button>
		//
		// example:
		// |	var button1 = new DropDownButton({ label: "hi", dropDown: new dijit.Menu(...) });
		// |	win.body().appendChild(button1);
		//

		baseClass: "dijitDropDownButton",

		templateString: template,

		_fillContent: function(){
			// Overrides Button._fillContent().
			//
			// My inner HTML contains both the button contents and a drop down widget, like
			// <DropDownButton>  <span>push me</span>  <Menu> ... </Menu> </DropDownButton>
			// The first node is assumed to be the button content. The widget is the popup.

			if(this.srcNodeRef){ // programatically created buttons might not define srcNodeRef
				//FIXME: figure out how to filter out the widget and use all remaining nodes as button
				//	content, not just nodes[0]
				var nodes = query("*", this.srcNodeRef);
				this.inherited(arguments, [nodes[0]]);

				// save pointer to srcNode so we can grab the drop down widget after it's instantiated
				this.dropDownContainer = this.srcNodeRef;
			}
		},

		startup: function(){
			if(this._started){
				return;
			}

			// the child widget from srcNodeRef is the dropdown widget.  Insert it in the page DOM,
			// make it invisible, and store a reference to pass to the popup code.
			if(!this.dropDown && this.dropDownContainer){
				var dropDownNode = query("[widgetId]", this.dropDownContainer)[0];
				if(dropDownNode){
					this.dropDown = registry.byNode(dropDownNode);
				}
				delete this.dropDownContainer;
			}
			if(this.dropDown){
				popup.hide(this.dropDown);
			}

			this.inherited(arguments);
		},

		isLoaded: function(){
			// Returns whether or not we are loaded - if our dropdown has an href,
			// then we want to check that.
			var dropDown = this.dropDown;
			return (!!dropDown && (!dropDown.href || dropDown.isLoaded));
		},

		loadDropDown: function(/*Function*/ callback){
			// Default implementation assumes that drop down already exists,
			// but hasn't loaded it's data (ex: ContentPane w/href).
			// App must override if the drop down is lazy-created.
			var dropDown = this.dropDown;
			var handler = dropDown.on("load", lang.hitch(this, function(){
				handler.remove();
				callback();
			}));
			dropDown.refresh();		// tell it to load
		},

		isFocusable: function(){
			// Overridden so that focus is handled by the _HasDropDown mixin, not by
			// the _FormWidget mixin.
			return this.inherited(arguments) && !this._mouseDown;
		}
	});
});

},
'dijit/popup':function(){
define([
	"dojo/_base/array", // array.forEach array.some
	"dojo/aspect",
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.isDescendant
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-construct", // domConstruct.create domConstruct.destroy
	"dojo/dom-geometry", // domGeometry.isBodyLtr
	"dojo/dom-style", // domStyle.set
	"dojo/has", // has("config-bgIframe")
	"dojo/keys",
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"./place",
	"./BackgroundIframe",
	"./Viewport",
	"./main"    // dijit (defining dijit.popup to match API doc)
], function(array, aspect, declare, dom, domAttr, domConstruct, domGeometry, domStyle, has, keys, lang, on,
			place, BackgroundIframe, Viewport, dijit){

	// module:
	//		dijit/popup

	/*=====
	 var __OpenArgs = {
		 // popup: Widget
		 //		widget to display
		 // parent: Widget
		 //		the button etc. that is displaying this popup
		 // around: DomNode
		 //		DOM node (typically a button); place popup relative to this node.  (Specify this *or* "x" and "y" parameters.)
		 // x: Integer
		 //		Absolute horizontal position (in pixels) to place node at.  (Specify this *or* "around" parameter.)
		 // y: Integer
		 //		Absolute vertical position (in pixels) to place node at.  (Specify this *or* "around" parameter.)
		 // orient: Object|String
		 //		When the around parameter is specified, orient should be a list of positions to try, ex:
		 //	|	[ "below", "above" ]
		 //		For backwards compatibility it can also be an (ordered) hash of tuples of the form
		 //		(around-node-corner, popup-node-corner), ex:
		 //	|	{ "BL": "TL", "TL": "BL" }
		 //		where BL means "bottom left" and "TL" means "top left", etc.
		 //
		 //		dijit/popup.open() tries to position the popup according to each specified position, in order,
		 //		until the popup appears fully within the viewport.
		 //
		 //		The default value is ["below", "above"]
		 //
		 //		When an (x,y) position is specified rather than an around node, orient is either
		 //		"R" or "L".  R (for right) means that it tries to put the popup to the right of the mouse,
		 //		specifically positioning the popup's top-right corner at the mouse position, and if that doesn't
		 //		fit in the viewport, then it tries, in order, the bottom-right corner, the top left corner,
		 //		and the top-right corner.
		 // onCancel: Function
		 //		callback when user has canceled the popup by:
		 //
		 //		1. hitting ESC or
		 //		2. by using the popup widget's proprietary cancel mechanism (like a cancel button in a dialog);
		 //		   i.e. whenever popupWidget.onCancel() is called, args.onCancel is called
		 // onClose: Function
		 //		callback whenever this popup is closed
		 // onExecute: Function
		 //		callback when user "executed" on the popup/sub-popup by selecting a menu choice, etc. (top menu only)
		 // padding: place.__Position
		 //		adding a buffer around the opening position. This is only useful when around is not set.
		 // maxHeight: Integer
		 //		The max height for the popup.  Any popup taller than this will have scrollbars.
		 //		Set to Infinity for no max height.  Default is to limit height to available space in viewport,
		 //		above or below the aroundNode or specified x/y position.
	 };
	 =====*/

	function destroyWrapper(){
		// summary:
		//		Function to destroy wrapper when popup widget is destroyed.
		//		Left in this scope to avoid memory leak on IE8 on refresh page, see #15206.
		if(this._popupWrapper){
			domConstruct.destroy(this._popupWrapper);
			delete this._popupWrapper;
		}
	}

	var PopupManager = declare(null, {
		// summary:
		//		Used to show drop downs (ex: the select list of a ComboBox)
		//		or popups (ex: right-click context menus).

		// _stack: dijit/_WidgetBase[]
		//		Stack of currently popped up widgets.
		//		(someone opened _stack[0], and then it opened _stack[1], etc.)
		_stack: [],

		// _beginZIndex: Number
		//		Z-index of the first popup.   (If first popup opens other
		//		popups they get a higher z-index.)
		_beginZIndex: 1000,

		_idGen: 1,

		_repositionAll: function(){
			// summary:
			//		If screen has been scrolled, reposition all the popups in the stack.
			//		Then set timer to check again later.

			if(this._firstAroundNode){	// guard for when clearTimeout() on IE doesn't work
				var oldPos = this._firstAroundPosition,
					newPos = domGeometry.position(this._firstAroundNode, true),
					dx = newPos.x - oldPos.x,
					dy = newPos.y - oldPos.y;

				if(dx || dy){
					this._firstAroundPosition = newPos;
					for(var i = 0; i < this._stack.length; i++){
						var style = this._stack[i].wrapper.style;
						style.top = (parseInt(style.top, 10) + dy) + "px";
						if(style.right == "auto"){
							style.left = (parseInt(style.left, 10) + dx) + "px";
						}else{
							style.right = (parseInt(style.right, 10) - dx) + "px";
						}
					}
				}

				this._aroundMoveListener = setTimeout(lang.hitch(this, "_repositionAll"), dx || dy ? 10 : 50);
			}
		},

		_createWrapper: function(/*Widget*/ widget){
			// summary:
			//		Initialization for widgets that will be used as popups.
			//		Puts widget inside a wrapper DIV (if not already in one),
			//		and returns pointer to that wrapper DIV.

			var wrapper = widget._popupWrapper,
				node = widget.domNode;

			if(!wrapper){
				// Create wrapper <div> for when this widget [in the future] will be used as a popup.
				// This is done early because of IE bugs where creating/moving DOM nodes causes focus
				// to go wonky, see tests/robot/Toolbar.html to reproduce
				wrapper = domConstruct.create("div", {
					"class": "dijitPopup",
					style: { display: "none"},
					role: "region",
					"aria-label": widget["aria-label"] || widget.label || widget.name || widget.id
				}, widget.ownerDocumentBody);
				wrapper.appendChild(node);

				var s = node.style;
				s.display = "";
				s.visibility = "";
				s.position = "";
				s.top = "0px";

				widget._popupWrapper = wrapper;
				aspect.after(widget, "destroy", destroyWrapper, true);
			}

			return wrapper;
		},

		moveOffScreen: function(/*Widget*/ widget){
			// summary:
			//		Moves the popup widget off-screen.
			//		Do not use this method to hide popups when not in use, because
			//		that will create an accessibility issue: the offscreen popup is
			//		still in the tabbing order.

			// Create wrapper if not already there
			var wrapper = this._createWrapper(widget);

			// Besides setting visibility:hidden, move it out of the viewport, see #5776, #10111, #13604
			var ltr = domGeometry.isBodyLtr(widget.ownerDocument),
				style = {
					visibility: "hidden",
					top: "-9999px",
					display: ""
				};
			style[ltr ? "left" : "right"] = "-9999px";
			style[ltr ? "right" : "left"] = "auto";
			domStyle.set(wrapper, style);

			return wrapper;
		},

		hide: function(/*Widget*/ widget){
			// summary:
			//		Hide this popup widget (until it is ready to be shown).
			//		Initialization for widgets that will be used as popups
			//
			//		Also puts widget inside a wrapper DIV (if not already in one)
			//
			//		If popup widget needs to layout it should
			//		do so when it is made visible, and popup._onShow() is called.

			// Create wrapper if not already there
			var wrapper = this._createWrapper(widget);

			domStyle.set(wrapper, {
				display: "none",
				height: "auto",		// Open may have limited the height to fit in the viewport
				overflow: "visible",
				border: ""			// Open() may have moved border from popup to wrapper.
			});

			// Open() may have moved border from popup to wrapper.  Move it back.
			var node = widget.domNode;
			if("_originalStyle" in node){
				node.style.cssText = node._originalStyle;
			}
		},

		getTopPopup: function(){
			// summary:
			//		Compute the closest ancestor popup that's *not* a child of another popup.
			//		Ex: For a TooltipDialog with a button that spawns a tree of menus, find the popup of the button.
			var stack = this._stack;
			for(var pi = stack.length - 1; pi > 0 && stack[pi].parent === stack[pi - 1].widget; pi--){
				/* do nothing, just trying to get right value for pi */
			}
			return stack[pi];
		},

		open: function(/*__OpenArgs*/ args){
			// summary:
			//		Popup the widget at the specified position
			//
			// example:
			//		opening at the mouse position
			//		|		popup.open({popup: menuWidget, x: evt.pageX, y: evt.pageY});
			//
			// example:
			//		opening the widget as a dropdown
			//		|		popup.open({parent: this, popup: menuWidget, around: this.domNode, onClose: function(){...}});
			//
			//		Note that whatever widget called dijit/popup.open() should also listen to its own _onBlur callback
			//		(fired from _base/focus.js) to know that focus has moved somewhere else and thus the popup should be closed.

			var stack = this._stack,
				widget = args.popup,
				node = widget.domNode,
				orient = args.orient || ["below", "below-alt", "above", "above-alt"],
				ltr = args.parent ? args.parent.isLeftToRight() : domGeometry.isBodyLtr(widget.ownerDocument),
				around = args.around,
				id = (args.around && args.around.id) ? (args.around.id + "_dropdown") : ("popup_" + this._idGen++);

			// If we are opening a new popup that isn't a child of a currently opened popup, then
			// close currently opened popup(s).   This should happen automatically when the old popups
			// gets the _onBlur() event, except that the _onBlur() event isn't reliable on IE, see [22198].
			while(stack.length && (!args.parent || !dom.isDescendant(args.parent.domNode, stack[stack.length - 1].widget.domNode))){
				this.close(stack[stack.length - 1].widget);
			}

			// Get pointer to popup wrapper, and create wrapper if it doesn't exist.  Remove display:none (but keep
			// off screen) so we can do sizing calculations.
			var wrapper = this.moveOffScreen(widget);

			if(widget.startup && !widget._started){
				widget.startup(); // this has to be done after being added to the DOM
			}

			// Limit height to space available in viewport either above or below aroundNode (whichever side has more
			// room), adding scrollbar if necessary. Can't add scrollbar to widget because it may be a <table> (ex:
			// dijit/Menu), so add to wrapper, and then move popup's border to wrapper so scroll bar inside border.
			var maxHeight, popupSize = domGeometry.position(node);
			if("maxHeight" in args && args.maxHeight != -1){
				maxHeight = args.maxHeight || Infinity;	// map 0 --> infinity for back-compat of _HasDropDown.maxHeight
			}else{
				var viewport = Viewport.getEffectiveBox(this.ownerDocument),
					aroundPos = around ? domGeometry.position(around, false) : {y: args.y - (args.padding||0), h: (args.padding||0) * 2};
				maxHeight = Math.floor(Math.max(aroundPos.y, viewport.h - (aroundPos.y + aroundPos.h)));
			}
			if(popupSize.h > maxHeight){
				// Get style of popup's border.  Unfortunately domStyle.get(node, "border") doesn't work on FF or IE,
				// and domStyle.get(node, "borderColor") etc. doesn't work on FF, so need to use fully qualified names.
				var cs = domStyle.getComputedStyle(node),
					borderStyle = cs.borderLeftWidth + " " + cs.borderLeftStyle + " " + cs.borderLeftColor;
				domStyle.set(wrapper, {
					overflowY: "scroll",
					height: maxHeight + "px",
					border: borderStyle	// so scrollbar is inside border
				});
				node._originalStyle = node.style.cssText;
				node.style.border = "none";
			}

			domAttr.set(wrapper, {
				id: id,
				style: {
					zIndex: this._beginZIndex + stack.length
				},
				"class": "dijitPopup " + (widget.baseClass || widget["class"] || "").split(" ")[0] + "Popup",
				dijitPopupParent: args.parent ? args.parent.id : ""
			});

			if(stack.length == 0 && around){
				// First element on stack. Save position of aroundNode and setup listener for changes to that position.
				this._firstAroundNode = around;
				this._firstAroundPosition = domGeometry.position(around, true);
				this._aroundMoveListener = setTimeout(lang.hitch(this, "_repositionAll"), 50);
			}

			if(has("config-bgIframe") && !widget.bgIframe){
				// setting widget.bgIframe triggers cleanup in _WidgetBase.destroyRendering()
				widget.bgIframe = new BackgroundIframe(wrapper);
			}

			// position the wrapper node and make it visible
			var layoutFunc = widget.orient ? lang.hitch(widget, "orient") : null,
				best = around ?
					place.around(wrapper, around, orient, ltr, layoutFunc) :
					place.at(wrapper, args, orient == 'R' ? ['TR', 'BR', 'TL', 'BL'] : ['TL', 'BL', 'TR', 'BR'], args.padding,
						layoutFunc);

			wrapper.style.visibility = "visible";
			node.style.visibility = "visible";	// counteract effects from _HasDropDown

			var handlers = [];

			// provide default escape and tab key handling
			// (this will work for any widget, not just menu)
			handlers.push(on(wrapper, "keydown", lang.hitch(this, function(evt){
				if(evt.keyCode == keys.ESCAPE && args.onCancel){
					evt.stopPropagation();
					evt.preventDefault();
					args.onCancel();
				}else if(evt.keyCode == keys.TAB){
					evt.stopPropagation();
					evt.preventDefault();
					var topPopup = this.getTopPopup();
					if(topPopup && topPopup.onCancel){
						topPopup.onCancel();
					}
				}
			})));

			// watch for cancel/execute events on the popup and notify the caller
			// (for a menu, "execute" means clicking an item)
			if(widget.onCancel && args.onCancel){
				handlers.push(widget.on("cancel", args.onCancel));
			}

			handlers.push(widget.on(widget.onExecute ? "execute" : "change", lang.hitch(this, function(){
				var topPopup = this.getTopPopup();
				if(topPopup && topPopup.onExecute){
					topPopup.onExecute();
				}
			})));

			stack.push({
				widget: widget,
				wrapper: wrapper,
				parent: args.parent,
				onExecute: args.onExecute,
				onCancel: args.onCancel,
				onClose: args.onClose,
				handlers: handlers
			});

			if(widget.onOpen){
				// TODO: in 2.0 standardize onShow() (used by StackContainer) and onOpen() (used here)
				widget.onOpen(best);
			}

			return best;
		},

		close: function(/*Widget?*/ popup){
			// summary:
			//		Close specified popup and any popups that it parented.
			//		If no popup is specified, closes all popups.

			var stack = this._stack;

			// Basically work backwards from the top of the stack closing popups
			// until we hit the specified popup, but IIRC there was some issue where closing
			// a popup would cause others to close too.  Thus if we are trying to close B in [A,B,C]
			// closing C might close B indirectly and then the while() condition will run where stack==[A]...
			// so the while condition is constructed defensively.
			while((popup && array.some(stack, function(elem){
				return elem.widget == popup;
			})) ||
				(!popup && stack.length)){
				var top = stack.pop(),
					widget = top.widget,
					onClose = top.onClose;

				if(widget.onClose){
					// TODO: in 2.0 standardize onHide() (used by StackContainer) and onClose() (used here).
					// Actually, StackContainer also calls onClose(), but to mean that the pane is being deleted
					// (i.e. that the TabContainer's tab's [x] icon was clicked)
					widget.onClose();
				}

				var h;
				while(h = top.handlers.pop()){
					h.remove();
				}

				// Hide the widget and it's wrapper unless it has already been destroyed in above onClose() etc.
				if(widget && widget.domNode){
					this.hide(widget);
				}

				if(onClose){
					onClose();
				}
			}

			if(stack.length == 0 && this._aroundMoveListener){
				clearTimeout(this._aroundMoveListener);
				this._firstAroundNode = this._firstAroundPosition = this._aroundMoveListener = null;
			}
		}
	});

	return (dijit.popup = new PopupManager());
});

},
'dijit/place':function(){
define([
	"dojo/_base/array", // array.forEach array.map array.some
	"dojo/dom-geometry", // domGeometry.position
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/window", // win.body
	"./Viewport", // getEffectiveBox
	"./main"	// dijit (defining dijit.place to match API doc)
], function(array, domGeometry, domStyle, kernel, win, Viewport, dijit){

	// module:
	//		dijit/place


	function _place(/*DomNode*/ node, choices, layoutNode, aroundNodeCoords){
		// summary:
		//		Given a list of spots to put node, put it at the first spot where it fits,
		//		of if it doesn't fit anywhere then the place with the least overflow
		// choices: Array
		//		Array of elements like: {corner: 'TL', pos: {x: 10, y: 20} }
		//		Above example says to put the top-left corner of the node at (10,20)
		// layoutNode: Function(node, aroundNodeCorner, nodeCorner, size)
		//		for things like tooltip, they are displayed differently (and have different dimensions)
		//		based on their orientation relative to the parent.	 This adjusts the popup based on orientation.
		//		It also passes in the available size for the popup, which is useful for tooltips to
		//		tell them that their width is limited to a certain amount.	 layoutNode() may return a value expressing
		//		how much the popup had to be modified to fit into the available space.	 This is used to determine
		//		what the best placement is.
		// aroundNodeCoords: Object
		//		Size of aroundNode, ex: {w: 200, h: 50}

		// get {x: 10, y: 10, w: 100, h:100} type obj representing position of
		// viewport over document
		var view = Viewport.getEffectiveBox(node.ownerDocument);

		// This won't work if the node is inside a <div style="position: relative">,
		// so reattach it to <body>.	 (Otherwise, the positioning will be wrong
		// and also it might get cutoff.)
		if(!node.parentNode || String(node.parentNode.tagName).toLowerCase() != "body"){
			win.body(node.ownerDocument).appendChild(node);
		}

		var best = null;
		array.some(choices, function(choice){
			var corner = choice.corner;
			var pos = choice.pos;
			var overflow = 0;

			// calculate amount of space available given specified position of node
			var spaceAvailable = {
				w: {
					'L': view.l + view.w - pos.x,
					'R': pos.x - view.l,
					'M': view.w
				}[corner.charAt(1)],
				h: {
					'T': view.t + view.h - pos.y,
					'B': pos.y - view.t,
					'M': view.h
				}[corner.charAt(0)]
			};

			// Clear left/right position settings set earlier so they don't interfere with calculations,
			// specifically when layoutNode() (a.k.a. Tooltip.orient()) measures natural width of Tooltip
			var s = node.style;
			s.left = s.right = "auto";

			// configure node to be displayed in given position relative to button
			// (need to do this in order to get an accurate size for the node, because
			// a tooltip's size changes based on position, due to triangle)
			if(layoutNode){
				var res = layoutNode(node, choice.aroundCorner, corner, spaceAvailable, aroundNodeCoords);
				overflow = typeof res == "undefined" ? 0 : res;
			}

			// get node's size
			var style = node.style;
			var oldDisplay = style.display;
			var oldVis = style.visibility;
			if(style.display == "none"){
				style.visibility = "hidden";
				style.display = "";
			}
			var bb = domGeometry.position(node);
			style.display = oldDisplay;
			style.visibility = oldVis;

			// coordinates and size of node with specified corner placed at pos,
			// and clipped by viewport
			var
				startXpos = {
					'L': pos.x,
					'R': pos.x - bb.w,
					'M': Math.max(view.l, Math.min(view.l + view.w, pos.x + (bb.w >> 1)) - bb.w) // M orientation is more flexible
				}[corner.charAt(1)],
				startYpos = {
					'T': pos.y,
					'B': pos.y - bb.h,
					'M': Math.max(view.t, Math.min(view.t + view.h, pos.y + (bb.h >> 1)) - bb.h)
				}[corner.charAt(0)],
				startX = Math.max(view.l, startXpos),
				startY = Math.max(view.t, startYpos),
				endX = Math.min(view.l + view.w, startXpos + bb.w),
				endY = Math.min(view.t + view.h, startYpos + bb.h),
				width = endX - startX,
				height = endY - startY;

			overflow += (bb.w - width) + (bb.h - height);

			if(best == null || overflow < best.overflow){
				best = {
					corner: corner,
					aroundCorner: choice.aroundCorner,
					x: startX,
					y: startY,
					w: width,
					h: height,
					overflow: overflow,
					spaceAvailable: spaceAvailable
				};
			}

			return !overflow;
		});

		// In case the best position is not the last one we checked, need to call
		// layoutNode() again.
		if(best.overflow && layoutNode){
			layoutNode(node, best.aroundCorner, best.corner, best.spaceAvailable, aroundNodeCoords);
		}

		// And then position the node.  Do this last, after the layoutNode() above
		// has sized the node, due to browser quirks when the viewport is scrolled
		// (specifically that a Tooltip will shrink to fit as though the window was
		// scrolled to the left).
		//
		// In RTL mode, set style.right rather than style.left so in the common case,
		// window resizes move the popup along with the aroundNode.

		var l = domGeometry.isBodyLtr(node.ownerDocument),
			top = best.y,
			side = l ? best.x : view.w - best.x - best.w;

		if(/relative|absolute/.test(domStyle.get(win.body(node.ownerDocument), "position"))){
			// compensate for margin on <body>, see #16148
			top -= domStyle.get(win.body(node.ownerDocument), "marginTop");
			side -= (l ? 1 : -1) * domStyle.get(win.body(node.ownerDocument), l ? "marginLeft" : "marginRight");
		}

		var s = node.style;
		s.top = top + "px";
		s[l ? "left" : "right"] = side + "px";
		s[l ? "right" : "left"] = "auto";	// needed for FF or else tooltip goes to far left

		return best;
	}

	var reverse = {
		// Map from corner to kitty-corner
		"TL": "BR",
		"TR": "BL",
		"BL": "TR",
		"BR": "TL"
	};

	var place = {
		// summary:
		//		Code to place a DOMNode relative to another DOMNode.
		//		Load using require(["dijit/place"], function(place){ ... }).

		at: function(node, pos, corners, padding, layoutNode){
			// summary:
			//		Positions node kitty-corner to the rectangle centered at (pos.x, pos.y) with width and height of
			//		padding.x * 2 and padding.y * 2, or zero if padding not specified.  Picks first corner in corners[]
			//		where node is fully visible, or the corner where it's most visible.
			//
			//		Node is assumed to be absolutely or relatively positioned.
			// node: DOMNode
			//		The node to position
			// pos: dijit/place.__Position
			//		Object like {x: 10, y: 20}
			// corners: String[]
			//		Array of Strings representing order to try corners of the node in, like ["TR", "BL"].
			//		Possible values are:
			//
			//		- "BL" - bottom left
			//		- "BR" - bottom right
			//		- "TL" - top left
			//		- "TR" - top right
			// padding: dijit/place.__Position?
			//		Optional param to set padding, to put some buffer around the element you want to position.
			//		Defaults to zero.
			// layoutNode: Function(node, aroundNodeCorner, nodeCorner)
			//		For things like tooltip, they are displayed differently (and have different dimensions)
			//		based on their orientation relative to the parent.  This adjusts the popup based on orientation.
			// example:
			//		Try to place node's top right corner at (10,20).
			//		If that makes node go (partially) off screen, then try placing
			//		bottom left corner at (10,20).
			//	|	place(node, {x: 10, y: 20}, ["TR", "BL"])
			var choices = array.map(corners, function(corner){
				var c = {
					corner: corner,
					aroundCorner: reverse[corner],	// so TooltipDialog.orient() gets aroundCorner argument set
					pos: {x: pos.x,y: pos.y}
				};
				if(padding){
					c.pos.x += corner.charAt(1) == 'L' ? padding.x : -padding.x;
					c.pos.y += corner.charAt(0) == 'T' ? padding.y : -padding.y;
				}
				return c;
			});

			return _place(node, choices, layoutNode);
		},

		around: function(
			/*DomNode*/		node,
			/*DomNode|dijit/place.__Rectangle*/ anchor,
			/*String[]*/	positions,
			/*Boolean*/		leftToRight,
			/*Function?*/	layoutNode){

			// summary:
			//		Position node adjacent or kitty-corner to anchor
			//		such that it's fully visible in viewport.
			// description:
			//		Place node such that corner of node touches a corner of
			//		aroundNode, and that node is fully visible.
			// anchor:
			//		Either a DOMNode or a rectangle (object with x, y, width, height).
			// positions:
			//		Ordered list of positions to try matching up.
			//
			//		- before: places drop down to the left of the anchor node/widget, or to the right in the case
			//			of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
			//			with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
			//		- after: places drop down to the right of the anchor node/widget, or to the left in the case
			//			of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
			//			with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
			//		- before-centered: centers drop down to the left of the anchor node/widget, or to the right
			//			in the case of RTL scripts like Hebrew and Arabic
			//		- after-centered: centers drop down to the right of the anchor node/widget, or to the left
			//			in the case of RTL scripts like Hebrew and Arabic
			//		- above-centered: drop down is centered above anchor node
			//		- above: drop down goes above anchor node, left sides aligned
			//		- above-alt: drop down goes above anchor node, right sides aligned
			//		- below-centered: drop down is centered above anchor node
			//		- below: drop down goes below anchor node
			//		- below-alt: drop down goes below anchor node, right sides aligned
			// layoutNode: Function(node, aroundNodeCorner, nodeCorner)
			//		For things like tooltip, they are displayed differently (and have different dimensions)
			//		based on their orientation relative to the parent.	 This adjusts the popup based on orientation.
			// leftToRight:
			//		True if widget is LTR, false if widget is RTL.   Affects the behavior of "above" and "below"
			//		positions slightly.
			// example:
			//	|	placeAroundNode(node, aroundNode, {'BL':'TL', 'TR':'BR'});
			//		This will try to position node such that node's top-left corner is at the same position
			//		as the bottom left corner of the aroundNode (ie, put node below
			//		aroundNode, with left edges aligned).	If that fails it will try to put
			//		the bottom-right corner of node where the top right corner of aroundNode is
			//		(ie, put node above aroundNode, with right edges aligned)
			//

			// If around is a DOMNode (or DOMNode id), convert to coordinates.
			var aroundNodePos;
			if(typeof anchor == "string" || "offsetWidth" in anchor){
				aroundNodePos = domGeometry.position(anchor, true);

				// For above and below dropdowns, subtract width of border so that popup and aroundNode borders
				// overlap, preventing a double-border effect.  Unfortunately, difficult to measure the border
				// width of either anchor or popup because in both cases the border may be on an inner node.
				if(/^(above|below)/.test(positions[0])){
					var anchorBorder = domGeometry.getBorderExtents(anchor),
						anchorChildBorder = anchor.firstChild ? domGeometry.getBorderExtents(anchor.firstChild) : {t:0,l:0,b:0,r:0},
						nodeBorder =  domGeometry.getBorderExtents(node),
						nodeChildBorder = node.firstChild ? domGeometry.getBorderExtents(node.firstChild) : {t:0,l:0,b:0,r:0};
					aroundNodePos.y += Math.min(anchorBorder.t + anchorChildBorder.t, nodeBorder.t + nodeChildBorder.t);
					aroundNodePos.h -=  Math.min(anchorBorder.t + anchorChildBorder.t, nodeBorder.t+ nodeChildBorder.t) +
						Math.min(anchorBorder.b + anchorChildBorder.b, nodeBorder.b + nodeChildBorder.b);
				}
			}else{
				aroundNodePos = anchor;
			}

			// Compute position and size of visible part of anchor (it may be partially hidden by ancestor nodes w/scrollbars)
			if(anchor.parentNode){
				// ignore nodes between position:relative and position:absolute
				var sawPosAbsolute = domStyle.getComputedStyle(anchor).position == "absolute";
				var parent = anchor.parentNode;
				while(parent && parent.nodeType == 1 && parent.nodeName != "BODY"){  //ignoring the body will help performance
					var parentPos = domGeometry.position(parent, true),
						pcs = domStyle.getComputedStyle(parent);
					if(/relative|absolute/.test(pcs.position)){
						sawPosAbsolute = false;
					}
					if(!sawPosAbsolute && /hidden|auto|scroll/.test(pcs.overflow)){
						var bottomYCoord = Math.min(aroundNodePos.y + aroundNodePos.h, parentPos.y + parentPos.h);
						var rightXCoord = Math.min(aroundNodePos.x + aroundNodePos.w, parentPos.x + parentPos.w);
						aroundNodePos.x = Math.max(aroundNodePos.x, parentPos.x);
						aroundNodePos.y = Math.max(aroundNodePos.y, parentPos.y);
						aroundNodePos.h = bottomYCoord - aroundNodePos.y;
						aroundNodePos.w = rightXCoord - aroundNodePos.x;
					}
					if(pcs.position == "absolute"){
						sawPosAbsolute = true;
					}
					parent = parent.parentNode;
				}
			}			

			var x = aroundNodePos.x,
				y = aroundNodePos.y,
				width = "w" in aroundNodePos ? aroundNodePos.w : (aroundNodePos.w = aroundNodePos.width),
				height = "h" in aroundNodePos ? aroundNodePos.h : (kernel.deprecated("place.around: dijit/place.__Rectangle: { x:"+x+", y:"+y+", height:"+aroundNodePos.height+", width:"+width+" } has been deprecated.  Please use { x:"+x+", y:"+y+", h:"+aroundNodePos.height+", w:"+width+" }", "", "2.0"), aroundNodePos.h = aroundNodePos.height);

			// Convert positions arguments into choices argument for _place()
			var choices = [];
			function push(aroundCorner, corner){
				choices.push({
					aroundCorner: aroundCorner,
					corner: corner,
					pos: {
						x: {
							'L': x,
							'R': x + width,
							'M': x + (width >> 1)
						}[aroundCorner.charAt(1)],
						y: {
							'T': y,
							'B': y + height,
							'M': y + (height >> 1)
						}[aroundCorner.charAt(0)]
					}
				})
			}
			array.forEach(positions, function(pos){
				var ltr =  leftToRight;
				switch(pos){
					case "above-centered":
						push("TM", "BM");
						break;
					case "below-centered":
						push("BM", "TM");
						break;
					case "after-centered":
						ltr = !ltr;
						// fall through
					case "before-centered":
						push(ltr ? "ML" : "MR", ltr ? "MR" : "ML");
						break;
					case "after":
						ltr = !ltr;
						// fall through
					case "before":
						push(ltr ? "TL" : "TR", ltr ? "TR" : "TL");
						push(ltr ? "BL" : "BR", ltr ? "BR" : "BL");
						break;
					case "below-alt":
						ltr = !ltr;
						// fall through
					case "below":
						// first try to align left borders, next try to align right borders (or reverse for RTL mode)
						push(ltr ? "BL" : "BR", ltr ? "TL" : "TR");
						push(ltr ? "BR" : "BL", ltr ? "TR" : "TL");
						break;
					case "above-alt":
						ltr = !ltr;
						// fall through
					case "above":
						// first try to align left borders, next try to align right borders (or reverse for RTL mode)
						push(ltr ? "TL" : "TR", ltr ? "BL" : "BR");
						push(ltr ? "TR" : "TL", ltr ? "BR" : "BL");
						break;
					default:
						// To assist dijit/_base/place, accept arguments of type {aroundCorner: "BL", corner: "TL"}.
						// Not meant to be used directly.  Remove for 2.0.
						push(pos.aroundCorner, pos.corner);
				}
			});

			var position = _place(node, choices, layoutNode, {w: width, h: height});
			position.aroundNodePos = aroundNodePos;

			return position;
		}
	};

	/*=====
	place.__Position = {
		// x: Integer
		//		horizontal coordinate in pixels, relative to document body
		// y: Integer
		//		vertical coordinate in pixels, relative to document body
	};
	place.__Rectangle = {
		// x: Integer
		//		horizontal offset in pixels, relative to document body
		// y: Integer
		//		vertical offset in pixels, relative to document body
		// w: Integer
		//		width in pixels.   Can also be specified as "width" for backwards-compatibility.
		// h: Integer
		//		height in pixels.   Can also be specified as "height" for backwards-compatibility.
	};
	=====*/

	return dijit.place = place;	// setting dijit.place for back-compat, remove for 2.0
});

},
'dijit/Viewport':function(){
define([
	"dojo/Evented",
	"dojo/on",
	"dojo/domReady",
	"dojo/sniff",	// has("ie"), has("ios")
	"dojo/window" // getBox()
], function(Evented, on, domReady, has, winUtils){

	// module:
	//		dijit/Viewport

	/*=====
	return {
		// summary:
		//		Utility singleton to watch for viewport resizes, avoiding duplicate notifications
		//		which can lead to infinite loops.
		// description:
		//		Usage: Viewport.on("resize", myCallback).
		//
		//		myCallback() is called without arguments in case it's _WidgetBase.resize(),
		//		which would interpret the argument as the size to make the widget.
	};
	=====*/

	var Viewport = new Evented();

	var focusedNode;

	domReady(function(){
		var oldBox = winUtils.getBox();
		Viewport._rlh = on(window, "resize", function(){
			var newBox = winUtils.getBox();
			if(oldBox.h == newBox.h && oldBox.w == newBox.w){ return; }
			oldBox = newBox;
			Viewport.emit("resize");
		});

		// Also catch zoom changes on IE8, since they don't naturally generate resize events
		if(has("ie") == 8){
			var deviceXDPI = screen.deviceXDPI;
			setInterval(function(){
				if(screen.deviceXDPI != deviceXDPI){
					deviceXDPI = screen.deviceXDPI;
					Viewport.emit("resize");
				}
			}, 500);
		}

		// On iOS, keep track of the focused node so we can guess when the keyboard is/isn't being displayed.
		if(has("ios")){
			on(document, "focusin", function(evt){
				focusedNode = evt.target;
			});
			on(document, "focusout", function(evt){
				focusedNode = null;
			});
		}
	});

	Viewport.getEffectiveBox = function(/*Document*/ doc){
		// summary:
		//		Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
		//		virtual keyboard.

		var box = winUtils.getBox(doc);

		// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
		var tag = focusedNode && focusedNode.tagName && focusedNode.tagName.toLowerCase();
		if(has("ios") && focusedNode && !focusedNode.readOnly && (tag == "textarea" || (tag == "input" &&
			/^(color|email|number|password|search|tel|text|url)$/.test(focusedNode.type)))){

			// Box represents the size of the viewport.  Some of the viewport is likely covered by the keyboard.
			// Estimate height of visible viewport assuming viewport goes to bottom of screen, but is covered by keyboard.
			box.h *= (orientation == 0 || orientation == 180 ? 0.66 : 0.40);

			// Above measurement will be inaccurate if viewport was scrolled up so far that it ends before the bottom
			// of the screen.   In this case, keyboard isn't covering as much of the viewport as we thought.
			// We know the visible size is at least the distance from the top of the viewport to the focused node.
			var rect = focusedNode.getBoundingClientRect();
			box.h = Math.max(box.h, rect.top + rect.height);
		}

		return box;
	};

	return Viewport;
});

},
'dijit/BackgroundIframe':function(){
define([
	"require",			// require.toUrl
	"./main",	// to export dijit.BackgroundIframe
	"dojo/_base/config",
	"dojo/dom-construct", // domConstruct.create
	"dojo/dom-style", // domStyle.set
	"dojo/_base/lang", // lang.extend lang.hitch
	"dojo/on",
	"dojo/sniff" // has("ie"), has("mozilla"), has("quirks")
], function(require, dijit, config, domConstruct, domStyle, lang, on, has){

	// module:
	//		dijit/BackgroundIFrame

	// Flag for whether to create background iframe behind popups like Menus and Dialog.
	// A background iframe is useful to prevent problems with popups appearing behind applets/pdf files,
	// and is also useful on older versions of IE (IE6 and IE7) to prevent the "bleed through select" problem.
	// TODO: For 2.0, make this false by default.  Also, possibly move definition to has.js so that this module can be
	// conditionally required via  dojo/has!bgIfame?dijit/BackgroundIframe
	has.add("config-bgIframe", !has("touch"));

	// TODO: remove _frames, it isn't being used much, since popups never release their
	// iframes (see [22236])
	var _frames = new function(){
		// summary:
		//		cache of iframes

		var queue = [];

		this.pop = function(){
			var iframe;
			if(queue.length){
				iframe = queue.pop();
				iframe.style.display="";
			}else{
				// transparency needed for DialogUnderlay and for tooltips on IE (to see screen near connector)
				if(has("ie") < 9){
					var burl = config["dojoBlankHtmlUrl"] || require.toUrl("dojo/resources/blank.html") || "javascript:\"\"";
					var html="<iframe src='" + burl + "' role='presentation'"
						+ " style='position: absolute; left: 0px; top: 0px;"
						+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
					iframe = document.createElement(html);
				}else{
					iframe = domConstruct.create("iframe");
					iframe.src = 'javascript:""';
					iframe.className = "dijitBackgroundIframe";
					iframe.setAttribute("role", "presentation");
					domStyle.set(iframe, "opacity", 0.1);
				}
				iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didn't work.
			}
			return iframe;
		};

		this.push = function(iframe){
			iframe.style.display="none";
			queue.push(iframe);
		}
	}();


	dijit.BackgroundIframe = function(/*DomNode*/ node){
		// summary:
		//		For IE/FF z-index shenanigans. id attribute is required.
		//
		// description:
		//		new dijit.BackgroundIframe(node).
		//
		//		Makes a background iframe as a child of node, that fills
		//		area (and position) of node

		if(!node.id){ throw new Error("no id"); }
		if(has("config-bgIframe")){
			var iframe = (this.iframe = _frames.pop());
			node.appendChild(iframe);
			if(has("ie")<7 || has("quirks")){
				this.resize(node);
				this._conn = on(node, 'resize', lang.hitch(this, "resize", node));
			}else{
				domStyle.set(iframe, {
					width: '100%',
					height: '100%'
				});
			}
		}
	};

	lang.extend(dijit.BackgroundIframe, {
		resize: function(node){
			// summary:
			//		Resize the iframe so it's the same size as node.
			//		Needed on IE6 and IE/quirks because height:100% doesn't work right.
			if(this.iframe){
				domStyle.set(this.iframe, {
					width: node.offsetWidth + 'px',
					height: node.offsetHeight + 'px'
				});
			}
		},
		destroy: function(){
			// summary:
			//		destroy the iframe
			if(this._conn){
				this._conn.remove();
				this._conn = null;
			}
			if(this.iframe){
				_frames.push(this.iframe);
				delete this.iframe;
			}
		}
	});

	return dijit.BackgroundIframe;
});

},
'dijit/form/Button':function(){
define([
	"require",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.toggle
	"dojo/has", // has("dijit-legacy-requires")
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.trim
	"dojo/ready",
	"./_FormWidget",
	"./_ButtonMixin",
	"dojo/text!./templates/Button.html"
], function(require, declare, domClass, has, kernel, lang, ready, _FormWidget, _ButtonMixin, template){

	// module:
	//		dijit/form/Button

	// Back compat w/1.6, remove for 2.0
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/form/DropDownButton", "dijit/form/ComboButton", "dijit/form/ToggleButton"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	var Button = declare("dijit.form.Button" + (has("dojo-bidi") ? "_NoBidi" : ""), [_FormWidget, _ButtonMixin], {
		// summary:
		//		Basically the same thing as a normal HTML button, but with special styling.
		// description:
		//		Buttons can display a label, an icon, or both.
		//		A label should always be specified (through innerHTML) or the label
		//		attribute.  It can be hidden via showLabel=false.
		// example:
		// |	<button data-dojo-type="dijit/form/Button" onClick="...">Hello world</button>
		//
		// example:
		// |	var button1 = new Button({label: "hello world", onClick: foo});
		// |	dojo.body().appendChild(button1.domNode);

		// showLabel: Boolean
		//		Set this to true to hide the label text and display only the icon.
		//		(If showLabel=false then iconClass must be specified.)
		//		Especially useful for toolbars.
		//		If showLabel=true, the label will become the title (a.k.a. tooltip/hint) of the icon.
		//
		//		The exception case is for computers in high-contrast mode, where the label
		//		will still be displayed, since the icon doesn't appear.
		showLabel: true,

		// iconClass: String
		//		Class to apply to DOMNode in button to make it display an icon
		iconClass: "dijitNoIcon",
		_setIconClassAttr: { node: "iconNode", type: "class" },

		baseClass: "dijitButton",

		templateString: template,

		// Map widget attributes to DOMNode attributes.
		_setValueAttr: "valueNode",
		_setNameAttr: function(name){
			// avoid breaking existing subclasses where valueNode undefined.  Perhaps in 2.0 require it to be defined?
			if(this.valueNode){
				this.valueNode.setAttribute("name", name);
			}
		},

		_fillContent: function(/*DomNode*/ source){
			// Overrides _Templated._fillContent().
			// If button label is specified as srcNodeRef.innerHTML rather than
			// this.params.label, handle it here.
			// TODO: remove the method in 2.0, parser will do it all for me
			if(source && (!this.params || !("label" in this.params))){
				var sourceLabel = lang.trim(source.innerHTML);
				if(sourceLabel){
					this.label = sourceLabel; // _applyAttributes will be called after buildRendering completes to update the DOM
				}
			}
		},

		_setShowLabelAttr: function(val){
			if(this.containerNode){
				domClass.toggle(this.containerNode, "dijitDisplayNone", !val);
			}
			this._set("showLabel", val);
		},

		setLabel: function(/*String*/ content){
			// summary:
			//		Deprecated.  Use set('label', ...) instead.
			kernel.deprecated("dijit.form.Button.setLabel() is deprecated.  Use set('label', ...) instead.", "", "2.0");
			this.set("label", content);
		},

		_setLabelAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			//		If the label is hidden (showLabel=false) then and no title has
			//		been specified, then label is also set as title attribute of icon.
			this.inherited(arguments);
			if(!this.showLabel && !("title" in this.params)){
				this.titleNode.title = lang.trim(this.containerNode.innerText || this.containerNode.textContent || '');
			}
		}
	});

	if(has("dojo-bidi")){
		Button = declare("dijit.form.Button", Button, {
			_setLabelAttr: function(/*String*/ content){
				this.inherited(arguments);
				if(this.titleNode.title){
					this.applyTextDir(this.titleNode, this.titleNode.title);
				}
			},

			_setTextDirAttr: function(/*String*/ textDir){
				if(this._created && this.textDir != textDir){
					this._set("textDir", textDir);
					this._setLabelAttr(this.label); // call applyTextDir on both focusNode and titleNode
				}
			}
		});
	}

	return Button;
});

},
'dijit/form/_FormWidget':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/sniff", // has("dijit-legacy-requires"), has("msapp")
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/ready",
	"../_Widget",
	"../_CssStateMixin",
	"../_TemplatedMixin",
	"./_FormWidgetMixin"
], function(declare, has, kernel, ready, _Widget, _CssStateMixin, _TemplatedMixin, _FormWidgetMixin){

	// module:
	//		dijit/form/_FormWidget

	// Back compat w/1.6, remove for 2.0
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/form/_FormValueWidget"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	return declare("dijit.form._FormWidget", [_Widget, _TemplatedMixin, _CssStateMixin, _FormWidgetMixin], {
		// summary:
		//		Base class for widgets corresponding to native HTML elements such as `<checkbox>` or `<button>`,
		//		which can be children of a `<form>` node or a `dijit/form/Form` widget.
		//
		// description:
		//		Represents a single HTML element.
		//		All these widgets should have these attributes just like native HTML input elements.
		//		You can set them during widget construction or afterwards, via `dijit/_WidgetBase.set()`.
		//
		//		They also share some common methods.

		setDisabled: function(/*Boolean*/ disabled){
			// summary:
			//		Deprecated.  Use set('disabled', ...) instead.
			kernel.deprecated("setDisabled(" + disabled + ") is deprecated. Use set('disabled'," + disabled + ") instead.", "", "2.0");
			this.set('disabled', disabled);
		},

		setValue: function(/*String*/ value){
			// summary:
			//		Deprecated.  Use set('value', ...) instead.
			kernel.deprecated("dijit.form._FormWidget:setValue(" + value + ") is deprecated.  Use set('value'," + value + ") instead.", "", "2.0");
			this.set('value', value);
		},

		getValue: function(){
			// summary:
			//		Deprecated.  Use get('value') instead.
			kernel.deprecated(this.declaredClass + "::getValue() is deprecated. Use get('value') instead.", "", "2.0");
			return this.get('value');
		},

		postMixInProperties: function(){
			// Setup name=foo string to be referenced from the template (but only if a name has been specified).
			// Unfortunately we can't use _setNameAttr to set the name in IE due to IE limitations, see #8484, #8660.
			// But when IE6 and IE7 are desupported, then we probably don't need this anymore, so should remove it in 2.0.
			// Also, don't do this for Windows 8 Store Apps because it causes a security exception (see #16452).
			// Regarding escaping, see heading "Attribute values" in
			// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
			this.nameAttrSetting = (this.name && !has("msapp")) ? ('name="' + this.name.replace(/"/g, "&quot;") + '"') : '';
			this.inherited(arguments);
		}
	});
});

},
'dijit/form/_FormWidgetMixin':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-style", // domStyle.get
	"dojo/_base/lang", // lang.hitch lang.isArray
	"dojo/mouse", // mouse.isLeft
	"dojo/on",
	"dojo/sniff", // has("webkit")
	"dojo/window", // winUtils.scrollIntoView
	"../a11y"    // a11y.hasDefaultTabStop
], function(array, declare, domAttr, domStyle, lang, mouse, on, has, winUtils, a11y){

	// module:
	//		dijit/form/_FormWidgetMixin

	return declare("dijit.form._FormWidgetMixin", null, {
		// summary:
		//		Mixin for widgets corresponding to native HTML elements such as `<checkbox>` or `<button>`,
		//		which can be children of a `<form>` node or a `dijit/form/Form` widget.
		//
		// description:
		//		Represents a single HTML element.
		//		All these widgets should have these attributes just like native HTML input elements.
		//		You can set them during widget construction or afterwards, via `dijit/_WidgetBase.set()`.
		//
		//		They also share some common methods.

		// name: [const] String
		//		Name used when submitting form; same as "name" attribute or plain HTML elements
		name: "",

		// alt: String
		//		Corresponds to the native HTML `<input>` element's attribute.
		alt: "",

		// value: String
		//		Corresponds to the native HTML `<input>` element's attribute.
		value: "",

		// type: [const] String
		//		Corresponds to the native HTML `<input>` element's attribute.
		type: "text",

		// type: String
		//		Apply aria-label in markup to the widget's focusNode
		"aria-label": "focusNode",

		// tabIndex: String
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",
		_setTabIndexAttr: "focusNode", // force copy even when tabIndex default value, needed since Button is <span>

		// disabled: Boolean
		//		Should this widget respond to user input?
		//		In markup, this is specified as "disabled='disabled'", or just "disabled".
		disabled: false,

		// intermediateChanges: Boolean
		//		Fires onChange for each value change or only on demand
		intermediateChanges: false,

		// scrollOnFocus: Boolean
		//		On focus, should this widget scroll into view?
		scrollOnFocus: true,

		// Override _WidgetBase mapping id to this.domNode, needs to be on focusNode so <label> etc.
		// works with screen reader
		_setIdAttr: "focusNode",

		_setDisabledAttr: function(/*Boolean*/ value){
			this._set("disabled", value);
			domAttr.set(this.focusNode, 'disabled', value);
			if(this.valueNode){
				domAttr.set(this.valueNode, 'disabled', value);
			}
			this.focusNode.setAttribute("aria-disabled", value ? "true" : "false");

			if(value){
				// reset these, because after the domNode is disabled, we can no longer receive
				// mouse related events, see #4200
				this._set("hovering", false);
				this._set("active", false);

				// clear tab stop(s) on this widget's focusable node(s)  (ComboBox has two focusable nodes)
				var attachPointNames = "tabIndex" in this.attributeMap ? this.attributeMap.tabIndex :
					("_setTabIndexAttr" in this) ? this._setTabIndexAttr : "focusNode";
				array.forEach(lang.isArray(attachPointNames) ? attachPointNames : [attachPointNames], function(attachPointName){
					var node = this[attachPointName];
					// complex code because tabIndex=-1 on a <div> doesn't work on FF
					if(has("webkit") || a11y.hasDefaultTabStop(node)){    // see #11064 about webkit bug
						node.setAttribute('tabIndex', "-1");
					}else{
						node.removeAttribute('tabIndex');
					}
				}, this);
			}else{
				if(this.tabIndex != ""){
					this.set('tabIndex', this.tabIndex);
				}
			}
		},

		_onFocus: function(/*String*/ by){
			// If user clicks on the widget, even if the mouse is released outside of it,
			// this widget's focusNode should get focus (to mimic native browser behavior).
			// Browsers often need help to make sure the focus via mouse actually gets to the focusNode.
			// TODO: consider removing all of this for 2.0 or sooner, see #16622 etc.
			if(by == "mouse" && this.isFocusable()){
				// IE exhibits strange scrolling behavior when refocusing a node so only do it when !focused.
				var focusHandle = this.own(on(this.focusNode, "focus", function(){
					mouseUpHandle.remove();
					focusHandle.remove();
				}))[0];
				// Set a global event to handle mouseup, so it fires properly
				// even if the cursor leaves this.domNode before the mouse up event.
				var mouseUpHandle = this.own(on(this.ownerDocumentBody, "mouseup, touchend", lang.hitch(this, function(evt){
					mouseUpHandle.remove();
					focusHandle.remove();
					// if here, then the mousedown did not focus the focusNode as the default action
					if(this.focused){
						if(evt.type == "touchend"){
							this.defer("focus"); // native focus hasn't occurred yet
						}else{
							this.focus(); // native focus already occurred on mousedown
						}
					}
				})))[0];
			}
			if(this.scrollOnFocus){
				this.defer(function(){
					winUtils.scrollIntoView(this.domNode);
				}); // without defer, the input caret position can change on mouse click
			}
			this.inherited(arguments);
		},

		isFocusable: function(){
			// summary:
			//		Tells if this widget is focusable or not.  Used internally by dijit.
			// tags:
			//		protected
			return !this.disabled && this.focusNode && (domStyle.get(this.domNode, "display") != "none");
		},

		focus: function(){
			// summary:
			//		Put focus on this widget
			if(!this.disabled && this.focusNode.focus){
				try{
					this.focusNode.focus();
				}catch(e){
				}
				/*squelch errors from hidden nodes*/
			}
		},

		compare: function(/*anything*/ val1, /*anything*/ val2){
			// summary:
			//		Compare 2 values (as returned by get('value') for this widget).
			// tags:
			//		protected
			if(typeof val1 == "number" && typeof val2 == "number"){
				return (isNaN(val1) && isNaN(val2)) ? 0 : val1 - val2;
			}else if(val1 > val2){
				return 1;
			}else if(val1 < val2){
				return -1;
			}else{
				return 0;
			}
		},

		onChange: function(/*===== newValue =====*/){
			// summary:
			//		Callback when this widget's value is changed.
			// tags:
			//		callback
		},

		// _onChangeActive: [private] Boolean
		//		Indicates that changes to the value should call onChange() callback.
		//		This is false during widget initialization, to avoid calling onChange()
		//		when the initial value is set.
		_onChangeActive: false,

		_handleOnChange: function(/*anything*/ newValue, /*Boolean?*/ priorityChange){
			// summary:
			//		Called when the value of the widget is set.  Calls onChange() if appropriate
			// newValue:
			//		the new value
			// priorityChange:
			//		For a slider, for example, dragging the slider is priorityChange==false,
			//		but on mouse up, it's priorityChange==true.  If intermediateChanges==false,
			//		onChange is only called form priorityChange=true events.
			// tags:
			//		private
			if(this._lastValueReported == undefined && (priorityChange === null || !this._onChangeActive)){
				// this block executes not for a change, but during initialization,
				// and is used to store away the original value (or for ToggleButton, the original checked state)
				this._resetValue = this._lastValueReported = newValue;
			}
			this._pendingOnChange = this._pendingOnChange
				|| (typeof newValue != typeof this._lastValueReported)
				|| (this.compare(newValue, this._lastValueReported) != 0);
			if((this.intermediateChanges || priorityChange || priorityChange === undefined) && this._pendingOnChange){
				this._lastValueReported = newValue;
				this._pendingOnChange = false;
				if(this._onChangeActive){
					if(this._onChangeHandle){
						this._onChangeHandle.remove();
					}
					// defer allows hidden value processing to run and
					// also the onChange handler can safely adjust focus, etc
					this._onChangeHandle = this.defer(
						function(){
							this._onChangeHandle = null;
							this.onChange(newValue);
						}); // try to collapse multiple onChange's fired faster than can be processed
				}
			}
		},

		create: function(){
			// Overrides _Widget.create()
			this.inherited(arguments);
			this._onChangeActive = true;
		},

		destroy: function(){
			if(this._onChangeHandle){ // destroy called before last onChange has fired
				this._onChangeHandle.remove();
				this.onChange(this._lastValueReported);
			}
			this.inherited(arguments);
		}
	});
});

},
'dijit/form/_ButtonMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.setSelectable
	"dojo/has",
	"../registry"        // registry.byNode
], function(declare, dom, has, registry){

	// module:
	//		dijit/form/_ButtonMixin

	var ButtonMixin = declare("dijit.form._ButtonMixin" + (has("dojo-bidi") ? "_NoBidi" : ""), null, {
		// summary:
		//		A mixin to add a thin standard API wrapper to a normal HTML button
		// description:
		//		A label should always be specified (through innerHTML) or the label attribute.
		//
		//		Attach points:
		//
		//		- focusNode (required): this node receives focus
		//		- valueNode (optional): this node's value gets submitted with FORM elements
		//		- containerNode (optional): this node gets the innerHTML assignment for label
		// example:
		// |	<button data-dojo-type="dijit/form/Button" onClick="...">Hello world</button>
		// example:
		// |	var button1 = new Button({label: "hello world", onClick: foo});
		// |	dojo.body().appendChild(button1.domNode);

		// label: HTML String
		//		Content to display in button.
		label: "",

		// type: [const] String
		//		Type of button (submit, reset, button, checkbox, radio)
		type: "button",

		__onClick: function(/*Event*/ e){
			// summary:
			//		Internal function to divert the real click onto the hidden INPUT that has a native default action associated with it
			// type:
			//		private
			e.stopPropagation();
			e.preventDefault();
			if(!this.disabled){
				// cannot use on.emit since button default actions won't occur
				this.valueNode.click(e);
			}
			return false;
		},

		_onClick: function(/*Event*/ e){
			// summary:
			//		Internal function to handle click actions
			if(this.disabled){
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
			if(this.onClick(e) === false){
				e.preventDefault();
			}
			cancelled = e.defaultPrevented;

			// Signal Form/Dialog to submit/close.  For 2.0, consider removing this code and instead making the Form/Dialog
			// listen for bubbled click events where evt.target.type == "submit" && !evt.defaultPrevented.
			if(!cancelled && this.type == "submit" && !(this.valueNode || this.focusNode).form){
				for(var node = this.domNode; node.parentNode; node = node.parentNode){
					var widget = registry.byNode(node);
					if(widget && typeof widget._onSubmit == "function"){
						widget._onSubmit(e);
						e.preventDefault(); // action has already occurred
						cancelled = true;
						break;
					}
				}
			}

			return !cancelled;
		},

		postCreate: function(){
			this.inherited(arguments);
			dom.setSelectable(this.focusNode, false);
		},

		onClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		Callback for when button is clicked.
			//		If type="submit", return true to perform submit, or false to cancel it.
			// type:
			//		callback
			return true;		// Boolean
		},

		_setLabelAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			this._set("label", content);
			var labelNode = this.containerNode || this.focusNode;
			labelNode.innerHTML = content;
		}
	});

	if(has("dojo-bidi")){
		ButtonMixin = declare("dijit.form._ButtonMixin", ButtonMixin, {
			_setLabelAttr: function(){
				this.inherited(arguments);
				var labelNode = this.containerNode || this.focusNode;
				this.applyTextDir(labelNode);
			}
		});
	}

	return ButtonMixin;
});

},
'dijit/_HasDropDown':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred",
	"dojo/dom", // dom.isDescendant
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-class", // domClass.add domClass.contains domClass.remove
	"dojo/dom-geometry", // domGeometry.marginBox domGeometry.position
	"dojo/dom-style", // domStyle.set
	"dojo/has", // has("touch")
	"dojo/keys", // keys.DOWN_ARROW keys.ENTER keys.ESCAPE
	"dojo/_base/lang", // lang.hitch lang.isFunction
	"dojo/on",
	"dojo/touch",
	"./registry", // registry.byNode()
	"./focus",
	"./popup",
	"./_FocusMixin"
], function(declare, Deferred, dom, domAttr, domClass, domGeometry, domStyle, has, keys, lang, on, touch,
			registry, focus, popup, _FocusMixin){


	// module:
	//		dijit/_HasDropDown

	return declare("dijit._HasDropDown", _FocusMixin, {
		// summary:
		//		Mixin for widgets that need drop down ability.

		// _buttonNode: [protected] DomNode
		//		The button/icon/node to click to display the drop down.
		//		Can be set via a data-dojo-attach-point assignment.
		//		If missing, then either focusNode or domNode (if focusNode is also missing) will be used.
		_buttonNode: null,

		// _arrowWrapperNode: [protected] DomNode
		//		Will set CSS class dijitUpArrow, dijitDownArrow, dijitRightArrow etc. on this node depending
		//		on where the drop down is set to be positioned.
		//		Can be set via a data-dojo-attach-point assignment.
		//		If missing, then _buttonNode will be used.
		_arrowWrapperNode: null,

		// _popupStateNode: [protected] DomNode
		//		The node to set the aria-expanded class on.
		//		Also sets popupActive class but that will be removed in 2.0.
		//		Can be set via a data-dojo-attach-point assignment.
		//		If missing, then focusNode or _buttonNode (if focusNode is missing) will be used.
		_popupStateNode: null,

		// _aroundNode: [protected] DomNode
		//		The node to display the popup around.
		//		Can be set via a data-dojo-attach-point assignment.
		//		If missing, then domNode will be used.
		_aroundNode: null,

		// dropDown: [protected] Widget
		//		The widget to display as a popup.  This widget *must* be
		//		defined before the startup function is called.
		dropDown: null,

		// autoWidth: [protected] Boolean
		//		Set to true to make the drop down at least as wide as this
		//		widget.  Set to false if the drop down should just be its
		//		default width.
		autoWidth: true,

		// forceWidth: [protected] Boolean
		//		Set to true to make the drop down exactly as wide as this
		//		widget.  Overrides autoWidth.
		forceWidth: false,

		// maxHeight: [protected] Integer
		//		The max height for our dropdown.
		//		Any dropdown taller than this will have scrollbars.
		//		Set to 0 for no max height, or -1 to limit height to available space in viewport
		maxHeight: -1,

		// dropDownPosition: [const] String[]
		//		This variable controls the position of the drop down.
		//		It's an array of strings with the following values:
		//
		//		- before: places drop down to the left of the target node/widget, or to the right in
		//		  the case of RTL scripts like Hebrew and Arabic
		//		- after: places drop down to the right of the target node/widget, or to the left in
		//		  the case of RTL scripts like Hebrew and Arabic
		//		- above: drop down goes above target node
		//		- below: drop down goes below target node
		//
		//		The list is positions is tried, in order, until a position is found where the drop down fits
		//		within the viewport.
		//
		dropDownPosition: ["below", "above"],

		// _stopClickEvents: Boolean
		//		When set to false, the click events will not be stopped, in
		//		case you want to use them in your subclass
		_stopClickEvents: true,

		_onDropDownMouseDown: function(/*Event*/ e){
			// summary:
			//		Callback when the user mousedown/touchstart on the arrow icon.

			if(this.disabled || this.readOnly){
				return;
			}

			// Prevent default to stop things like text selection, but don't stop propagation, so that:
			//		1. TimeTextBox etc. can focus the <input> on mousedown
			//		2. dropDownButtonActive class applied by _CssStateMixin (on button depress)
			//		3. user defined onMouseDown handler fires
			//
			// Also, don't call preventDefault() on MSPointerDown event (on IE10) because that prevents the button
			// from getting focus, and then the focus manager doesn't know what's going on (#17262)
			if(e.type != "MSPointerDown"){
				e.preventDefault();
			}

			this._docHandler = this.own(on(this.ownerDocument, touch.release, lang.hitch(this, "_onDropDownMouseUp")))[0];

			this.toggleDropDown();
		},

		_onDropDownMouseUp: function(/*Event?*/ e){
			// summary:
			//		Callback on mouseup/touchend after mousedown/touchstart on the arrow icon.
			//		Note that this function is called regardless of what node the event occurred on (but only after
			//		a mousedown/touchstart on the arrow).
			//
			//		If the drop down is a simple menu and the cursor is over the menu, we execute it, otherwise, we focus our
			//		drop down widget.  If the event is missing, then we are not
			//		a mouseup event.
			//
			//		This is useful for the common mouse movement pattern
			//		with native browser `<select>` nodes:
			//
			//		1. mouse down on the select node (probably on the arrow)
			//		2. move mouse to a menu item while holding down the mouse button
			//		3. mouse up.  this selects the menu item as though the user had clicked it.

			if(e && this._docHandler){
				this._docHandler.remove();
				this._docHandler = null;
			}
			var dropDown = this.dropDown, overMenu = false;

			if(e && this._opened){
				// This code deals with the corner-case when the drop down covers the original widget,
				// because it's so large.  In that case mouse-up shouldn't select a value from the menu.
				// Find out if our target is somewhere in our dropdown widget,
				// but not over our _buttonNode (the clickable node)
				var c = domGeometry.position(this._buttonNode, true);
				if(!(e.pageX >= c.x && e.pageX <= c.x + c.w) || !(e.pageY >= c.y && e.pageY <= c.y + c.h)){
					var t = e.target;
					while(t && !overMenu){
						if(domClass.contains(t, "dijitPopup")){
							overMenu = true;
						}else{
							t = t.parentNode;
						}
					}
					if(overMenu){
						t = e.target;
						if(dropDown.onItemClick){
							var menuItem;
							while(t && !(menuItem = registry.byNode(t))){
								t = t.parentNode;
							}
							if(menuItem && menuItem.onClick && menuItem.getParent){
								menuItem.getParent().onItemClick(menuItem, e);
							}
						}
						return;
					}
				}
			}
			if(this._opened){
				// Focus the dropdown widget unless it's a menu (in which case autoFocus is set to false).
				// Even if it's a menu, we need to focus it if this is a fake mouse event caused by the user typing
				// SPACE/ENTER while using JAWS.  Jaws converts the SPACE/ENTER key into mousedown/mouseup events.
				// If this.hovering is false then it's presumably actually a keyboard event.
				if(dropDown.focus && (dropDown.autoFocus !== false || (e.type == "mouseup" && !this.hovering))){
					// Do it on a delay so that we don't steal back focus from the dropdown.
					this._focusDropDownTimer = this.defer(function(){
						dropDown.focus();
						delete this._focusDropDownTimer;
					});
				}
			}else{
				// The drop down arrow icon probably can't receive focus, but widget itself should get focus.
				// defer() needed to make it work on IE (test DateTextBox)
				if(this.focus){
					this.defer("focus");
				}
			}
		},

		_onDropDownClick: function(/*Event*/ e){
			// The drop down was already opened on mousedown/keydown; just need to stop the event
			if(this._stopClickEvents){
				e.stopPropagation();
				e.preventDefault();
			}
		},

		buildRendering: function(){
			this.inherited(arguments);

			this._buttonNode = this._buttonNode || this.focusNode || this.domNode;
			this._popupStateNode = this._popupStateNode || this.focusNode || this._buttonNode;

			// Add a class to the "dijitDownArrowButton" type class to _buttonNode so theme can set direction of arrow
			// based on where drop down will normally appear
			var defaultPos = {
				"after": this.isLeftToRight() ? "Right" : "Left",
				"before": this.isLeftToRight() ? "Left" : "Right",
				"above": "Up",
				"below": "Down",
				"left": "Left",
				"right": "Right"
			}[this.dropDownPosition[0]] || this.dropDownPosition[0] || "Down";
			domClass.add(this._arrowWrapperNode || this._buttonNode, "dijit" + defaultPos + "ArrowButton");
		},

		postCreate: function(){
			// summary:
			//		set up nodes and connect our mouse and keyboard events

			this.inherited(arguments);

			var keyboardEventNode = this.focusNode || this.domNode;
			this.own(
				on(this._buttonNode, touch.press, lang.hitch(this, "_onDropDownMouseDown")),
				on(this._buttonNode, "click", lang.hitch(this, "_onDropDownClick")),
				on(keyboardEventNode, "keydown", lang.hitch(this, "_onKey")),
				on(keyboardEventNode, "keyup", lang.hitch(this, "_onKeyUp"))
			);
		},

		destroy: function(){
			// If dropdown is open, close it, to avoid leaving dijit/focus in a strange state.
			// Put focus back on me to avoid the focused node getting destroyed, which flummoxes IE.
			if(this._opened){
				this.closeDropDown(true);
			}

			if(this.dropDown){
				// Destroy the drop down, unless it's already been destroyed.  This can happen because
				// the drop down is a direct child of <body> even though it's logically my child.
				if(!this.dropDown._destroyed){
					this.dropDown.destroyRecursive();
				}
				delete this.dropDown;
			}
			this.inherited(arguments);
		},

		_onKey: function(/*Event*/ e){
			// summary:
			//		Callback when the user presses a key while focused on the button node

			if(this.disabled || this.readOnly){
				return;
			}
			var d = this.dropDown, target = e.target;
			if(d && this._opened && d.handleKey){
				if(d.handleKey(e) === false){
					/* false return code means that the drop down handled the key */
					e.stopPropagation();
					e.preventDefault();
					return;
				}
			}
			if(d && this._opened && e.keyCode == keys.ESCAPE){
				this.closeDropDown();
				e.stopPropagation();
				e.preventDefault();
			}else if(!this._opened &&
				(e.keyCode == keys.DOWN_ARROW ||
					// ignore unmodified SPACE if _KeyNavMixin has active searching in progress
					( (e.keyCode == keys.ENTER || (e.keyCode == keys.SPACE && (!this._searchTimer || (e.ctrlKey || e.altKey || e.metaKey)))) &&
						//ignore enter and space if the event is for a text input
						((target.tagName || "").toLowerCase() !== 'input' ||
							(target.type && target.type.toLowerCase() !== 'text'))))){
				// Toggle the drop down, but wait until keyup so that the drop down doesn't
				// get a stray keyup event, or in the case of key-repeat (because user held
				// down key for too long), stray keydown events
				this._toggleOnKeyUp = true;
				e.stopPropagation();
				e.preventDefault();
			}
		},

		_onKeyUp: function(){
			if(this._toggleOnKeyUp){
				delete this._toggleOnKeyUp;
				this.toggleDropDown();
				var d = this.dropDown;	// drop down may not exist until toggleDropDown() call
				if(d && d.focus){
					this.defer(lang.hitch(d, "focus"), 1);
				}
			}
		},

		_onBlur: function(){
			// summary:
			//		Called magically when focus has shifted away from this widget and it's dropdown

			// Close dropdown but don't focus my <input>.  User may have focused somewhere else (ex: clicked another
			// input), and even if they just clicked a blank area of the screen, focusing my <input> will unwantedly
			// popup the keyboard on mobile.
			this.closeDropDown(false);

			this.inherited(arguments);
		},

		isLoaded: function(){
			// summary:
			//		Returns true if the dropdown exists and it's data is loaded.  This can
			//		be overridden in order to force a call to loadDropDown().
			// tags:
			//		protected

			return true;
		},

		loadDropDown: function(/*Function*/ loadCallback){
			// summary:
			//		Creates the drop down if it doesn't exist, loads the data
			//		if there's an href and it hasn't been loaded yet, and then calls
			//		the given callback.
			// tags:
			//		protected

			// TODO: for 2.0, change API to return a Deferred, instead of calling loadCallback?
			loadCallback();
		},

		loadAndOpenDropDown: function(){
			// summary:
			//		Creates the drop down if it doesn't exist, loads the data
			//		if there's an href and it hasn't been loaded yet, and
			//		then opens the drop down.  This is basically a callback when the
			//		user presses the down arrow button to open the drop down.
			// returns: Deferred
			//		Deferred for the drop down widget that
			//		fires when drop down is created and loaded
			// tags:
			//		protected
			var d = new Deferred(),
				afterLoad = lang.hitch(this, function(){
					this.openDropDown();
					d.resolve(this.dropDown);
				});
			if(!this.isLoaded()){
				this.loadDropDown(afterLoad);
			}else{
				afterLoad();
			}
			return d;
		},

		toggleDropDown: function(){
			// summary:
			//		Callback when the user presses the down arrow button or presses
			//		the down arrow key to open/close the drop down.
			//		Toggle the drop-down widget; if it is up, close it, if not, open it
			// tags:
			//		protected

			if(this.disabled || this.readOnly){
				return;
			}
			if(!this._opened){
				this.loadAndOpenDropDown();
			}else{
				this.closeDropDown(true);	// refocus button to avoid hiding node w/focus
			}
		},

		openDropDown: function(){
			// summary:
			//		Opens the dropdown for this widget.   To be called only when this.dropDown
			//		has been created and is ready to display (ie, it's data is loaded).
			// returns:
			//		return value of dijit/popup.open()
			// tags:
			//		protected

			var dropDown = this.dropDown,
				ddNode = dropDown.domNode,
				aroundNode = this._aroundNode || this.domNode,
				self = this;

			var retVal = popup.open({
				parent: this,
				popup: dropDown,
				around: aroundNode,
				orient: this.dropDownPosition,
				maxHeight: this.maxHeight,
				onExecute: function(){
					self.closeDropDown(true);
				},
				onCancel: function(){
					self.closeDropDown(true);
				},
				onClose: function(){
					domAttr.set(self._popupStateNode, "popupActive", false);
					domClass.remove(self._popupStateNode, "dijitHasDropDownOpen");
					self._set("_opened", false);	// use set() because _CssStateMixin is watching
				}
			});

			// Set width of drop down if necessary, so that dropdown width + width of scrollbar (from popup wrapper)
			// matches width of aroundNode
			if(this.forceWidth || (this.autoWidth && aroundNode.offsetWidth > dropDown._popupWrapper.offsetWidth)){
				var resizeArgs = {
					w: aroundNode.offsetWidth - (dropDown._popupWrapper.offsetWidth - dropDown.domNode.offsetWidth)
				};
				if(lang.isFunction(dropDown.resize)){
					dropDown.resize(resizeArgs);
				}else{
					domGeometry.setMarginBox(ddNode, resizeArgs);
				}
			}

			domAttr.set(this._popupStateNode, "popupActive", "true");
			domClass.add(this._popupStateNode, "dijitHasDropDownOpen");
			this._set("_opened", true);	// use set() because _CssStateMixin is watching

			this._popupStateNode.setAttribute("aria-expanded", "true");
			this._popupStateNode.setAttribute("aria-owns", dropDown.id);

			// Set aria-labelledby on dropdown if it's not already set to something more meaningful
			if(ddNode.getAttribute("role") !== "presentation" && !ddNode.getAttribute("aria-labelledby")){
				ddNode.setAttribute("aria-labelledby", this.id);
			}

			return retVal;
		},

		closeDropDown: function(/*Boolean*/ focus){
			// summary:
			//		Closes the drop down on this widget
			// focus:
			//		If true, refocuses the button widget
			// tags:
			//		protected

			if(this._focusDropDownTimer){
				this._focusDropDownTimer.remove();
				delete this._focusDropDownTimer;
			}

			if(this._opened){
				this._popupStateNode.setAttribute("aria-expanded", "false");
				if(focus && this.focus){
					this.focus();
				}
				popup.close(this.dropDown);
				this._opened = false;
			}
		}

	});
});

},
'dijit/layout/BorderContainer':function(){
define([
	"dojo/_base/array", // array.filter array.forEach array.map
	"dojo/cookie", // cookie
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove domClass.toggle
	"dojo/dom-construct", // domConstruct.destroy domConstruct.place
	"dojo/dom-geometry", // domGeometry.marginBox
	"dojo/dom-style", // domStyle.style
	"dojo/keys",
	"dojo/_base/lang", // getObject() hitch() delegate()
	"dojo/on",
	"dojo/touch",
	"../_WidgetBase",
	"../_Widget",
	"../_TemplatedMixin",
	"./LayoutContainer",
	"./utils"        // layoutUtils.layoutChildren
], function(array, cookie, declare, domClass, domConstruct, domGeometry, domStyle, keys, lang, on, touch,
			_WidgetBase, _Widget, _TemplatedMixin, LayoutContainer, layoutUtils){

	// module:
	//		dijit/layout/BorderContainer

	var _Splitter = declare("dijit.layout._Splitter", [_Widget, _TemplatedMixin ], {
		// summary:
		//		A draggable spacer between two items in a `dijit/layout/BorderContainer`.
		// description:
		//		This is instantiated by `dijit/layout/BorderContainer`.  Users should not
		//		create it directly.
		// tags:
		//		private

		/*=====
		 // container: [const] dijit/layout/BorderContainer
		 //		Pointer to the parent BorderContainer
		 container: null,

		 // child: [const] dijit/layout/_LayoutWidget
		 //		Pointer to the pane associated with this splitter
		 child: null,

		 // region: [const] String
		 //		Region of pane associated with this splitter.
		 //		"top", "bottom", "left", "right".
		 region: null,
		 =====*/

		// live: [const] Boolean
		//		If true, the child's size changes and the child widget is redrawn as you drag the splitter;
		//		otherwise, the size doesn't change until you drop the splitter (by mouse-up)
		live: true,

		templateString: '<div class="dijitSplitter" data-dojo-attach-event="onkeydown:_onKeyDown,press:_startDrag,onmouseenter:_onMouse,onmouseleave:_onMouse" tabIndex="0" role="separator"><div class="dijitSplitterThumb"></div></div>',

		constructor: function(){
			this._handlers = [];
		},

		postMixInProperties: function(){
			this.inherited(arguments);

			this.horizontal = /top|bottom/.test(this.region);
			this._factor = /top|left/.test(this.region) ? 1 : -1;
			this._cookieName = this.container.id + "_" + this.region;
		},

		buildRendering: function(){
			this.inherited(arguments);

			domClass.add(this.domNode, "dijitSplitter" + (this.horizontal ? "H" : "V"));

			if(this.container.persist){
				// restore old size
				var persistSize = cookie(this._cookieName);
				if(persistSize){
					this.child.domNode.style[this.horizontal ? "height" : "width"] = persistSize;
				}
			}
		},

		_computeMaxSize: function(){
			// summary:
			//		Return the maximum size that my corresponding pane can be set to

			var dim = this.horizontal ? 'h' : 'w',
				childSize = domGeometry.getMarginBox(this.child.domNode)[dim],
				center = array.filter(this.container.getChildren(), function(child){
					return child.region == "center";
				})[0];

			// Can expand until center is crushed.  But always leave room for center's padding + border,
			//  otherwise on the next call domGeometry methods start to lie about size.
			var spaceAvailable = domGeometry.getContentBox(center.domNode)[dim] - 10;

			return Math.min(this.child.maxSize, childSize + spaceAvailable);
		},

		_startDrag: function(e){
			if(!this.cover){
				this.cover = domConstruct.place("<div class=dijitSplitterCover></div>", this.child.domNode, "after");
			}
			domClass.add(this.cover, "dijitSplitterCoverActive");

			// Safeguard in case the stop event was missed.  Shouldn't be necessary if we always get the mouse up.
			if(this.fake){
				domConstruct.destroy(this.fake);
			}
			if(!(this._resize = this.live)){ //TODO: disable live for IE6?
				// create fake splitter to display at old position while we drag
				(this.fake = this.domNode.cloneNode(true)).removeAttribute("id");
				domClass.add(this.domNode, "dijitSplitterShadow");
				domConstruct.place(this.fake, this.domNode, "after");
			}
			domClass.add(this.domNode, "dijitSplitterActive dijitSplitter" + (this.horizontal ? "H" : "V") + "Active");
			if(this.fake){
				domClass.remove(this.fake, "dijitSplitterHover dijitSplitter" + (this.horizontal ? "H" : "V") + "Hover");
			}

			//Performance: load data info local vars for onmousevent function closure
			var factor = this._factor,
				isHorizontal = this.horizontal,
				axis = isHorizontal ? "pageY" : "pageX",
				pageStart = e[axis],
				splitterStyle = this.domNode.style,
				dim = isHorizontal ? 'h' : 'w',
				childCS = domStyle.getComputedStyle(this.child.domNode),
				childStart = domGeometry.getMarginBox(this.child.domNode, childCS)[dim],
				max = this._computeMaxSize(),
				min = Math.max(this.child.minSize, domGeometry.getPadBorderExtents(this.child.domNode, childCS)[dim] + 10),
				region = this.region,
				splitterAttr = region == "top" || region == "bottom" ? "top" : "left", // style attribute of splitter to adjust
				splitterStart = parseInt(splitterStyle[splitterAttr], 10),
				resize = this._resize,
				layoutFunc = lang.hitch(this.container, "_layoutChildren", this.child.id),
				de = this.ownerDocument;

			this._handlers = this._handlers.concat([
				on(de, touch.move, this._drag = function(e, forceResize){
					var delta = e[axis] - pageStart,
						childSize = factor * delta + childStart,
						boundChildSize = Math.max(Math.min(childSize, max), min);

					if(resize || forceResize){
						layoutFunc(boundChildSize);
					}
					// TODO: setting style directly (usually) sets content box size, need to set margin box size
					splitterStyle[splitterAttr] = delta + splitterStart + factor * (boundChildSize - childSize) + "px";
				}),
				on(de, "dragstart", function(e){
					e.stopPropagation();
					e.preventDefault();
				}),
				on(this.ownerDocumentBody, "selectstart", function(e){
					e.stopPropagation();
					e.preventDefault();
				}),
				on(de, touch.release, lang.hitch(this, "_stopDrag"))
			]);
			e.stopPropagation();
			e.preventDefault();
		},

		_onMouse: function(e){
			// summary:
			//		Handler for onmouseenter / onmouseleave events
			var o = (e.type == "mouseover" || e.type == "mouseenter");
			domClass.toggle(this.domNode, "dijitSplitterHover", o);
			domClass.toggle(this.domNode, "dijitSplitter" + (this.horizontal ? "H" : "V") + "Hover", o);
		},

		_stopDrag: function(e){
			try{
				if(this.cover){
					domClass.remove(this.cover, "dijitSplitterCoverActive");
				}
				if(this.fake){
					domConstruct.destroy(this.fake);
				}
				domClass.remove(this.domNode, "dijitSplitterActive dijitSplitter"
					+ (this.horizontal ? "H" : "V") + "Active dijitSplitterShadow");
				this._drag(e); //TODO: redundant with onmousemove?
				this._drag(e, true);
			}finally{
				this._cleanupHandlers();
				delete this._drag;
			}

			if(this.container.persist){
				cookie(this._cookieName, this.child.domNode.style[this.horizontal ? "height" : "width"], {expires: 365});
			}
		},

		_cleanupHandlers: function(){
			var h;
			while(h = this._handlers.pop()){
				h.remove();
			}
		},

		_onKeyDown: function(/*Event*/ e){
			// should we apply typematic to this?
			this._resize = true;
			var horizontal = this.horizontal;
			var tick = 1;
			switch(e.keyCode){
				case horizontal ? keys.UP_ARROW : keys.LEFT_ARROW:
					tick *= -1;
//				break;
				case horizontal ? keys.DOWN_ARROW : keys.RIGHT_ARROW:
					break;
				default:
//				this.inherited(arguments);
					return;
			}
			var childSize = domGeometry.getMarginSize(this.child.domNode)[ horizontal ? 'h' : 'w' ] + this._factor * tick;
			this.container._layoutChildren(this.child.id, Math.max(Math.min(childSize, this._computeMaxSize()), this.child.minSize));
			e.stopPropagation();
			e.preventDefault();
		},

		destroy: function(){
			this._cleanupHandlers();
			delete this.child;
			delete this.container;
			delete this.cover;
			delete this.fake;
			this.inherited(arguments);
		}
	});

	var _Gutter = declare("dijit.layout._Gutter", [_Widget, _TemplatedMixin], {
		// summary:
		//		Just a spacer div to separate side pane from center pane.
		//		Basically a trick to lookup the gutter/splitter width from the theme.
		// description:
		//		Instantiated by `dijit/layout/BorderContainer`.  Users should not
		//		create directly.
		// tags:
		//		private

		templateString: '<div class="dijitGutter" role="presentation"></div>',

		postMixInProperties: function(){
			this.inherited(arguments);
			this.horizontal = /top|bottom/.test(this.region);
		},

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "dijitGutter" + (this.horizontal ? "H" : "V"));
		}
	});

	var BorderContainer = declare("dijit.layout.BorderContainer", LayoutContainer, {
		// summary:
		//		A BorderContainer is a `dijit/LayoutContainer` that can have draggable splitters between the children,
		//		in order to adjust their sizes.
		//
		//		In addition, it automatically adds some space between the children even
		//		if they don't have a draggable splitter between them, and space between the edge of the BorderContainer
		//		and the children that are adjacent to the edge.  Note that the intended style is that all the children
		//		have borders, but (despite the name) the BorderContainer itself does not.
		//
		//		See `BorderContainer.ChildWidgetProperties` for details on the properties that can be set on
		//		children of a `BorderContainer`.

		// gutters: [const] Boolean
		//		Give each pane a border and margin.
		//		Margin determined by domNode.paddingLeft.
		//		When false, only resizable panes have a gutter (i.e. draggable splitter) for resizing.
		gutters: true,

		// liveSplitters: [const] Boolean
		//		Specifies whether splitters resize as you drag (true) or only upon mouseup (false)
		liveSplitters: true,

		// persist: Boolean
		//		Save splitter positions in a cookie.
		persist: false,

		baseClass: "dijitBorderContainer",

		// _splitterClass: Function||String
		//		Optional hook to override the default Splitter widget used by BorderContainer
		_splitterClass: _Splitter,

		postMixInProperties: function(){
			// change class name to indicate that BorderContainer is being used purely for
			// layout (like LayoutContainer) rather than for pretty formatting.
			if(!this.gutters){
				this.baseClass += "NoGutter";
			}
			this.inherited(arguments);
		},

		_setupChild: function(/*dijit/_WidgetBase*/ child){
			// Override LayoutContainer._setupChild().

			this.inherited(arguments);

			var region = child.region, ltr = child.isLeftToRight();
			if(region == "leading"){
				region = ltr ? "left" : "right";
			}
			if(region == "trailing"){
				region = ltr ? "right" : "left";
			}

			if(region){
				// Create draggable splitter for resizing pane,
				// or alternately if splitter=false but BorderContainer.gutters=true then
				// insert dummy div just for spacing
				if(region != "center" && (child.splitter || this.gutters) && !child._splitterWidget){
					var _Splitter = child.splitter ? this._splitterClass : _Gutter;
					if(lang.isString(_Splitter)){
						_Splitter = lang.getObject(_Splitter);	// for back-compat, remove in 2.0
					}
					var splitter = new _Splitter({
						id: child.id + "_splitter",
						container: this,
						child: child,
						region: region,
						live: this.liveSplitters
					});
					splitter.isSplitter = true;
					child._splitterWidget = splitter;

					// Make the tab order match the visual layout by placing the splitter before or after the pane,
					// depending on where the splitter is visually compared to the pane.
					var before = region == "bottom" || region == (this.isLeftToRight() ? "right" : "left");
					domConstruct.place(splitter.domNode, child.domNode, before ? "before" : "after");

					// Splitters aren't added as Contained children, so we need to call startup explicitly
					splitter.startup();
				}
			}
		},

		layout: function(){
			// Implement _LayoutWidget.layout() virtual method.
			this._layoutChildren();
		},

		removeChild: function(/*dijit/_WidgetBase*/ child){
			// Override _LayoutWidget.removeChild().

			var splitter = child._splitterWidget;
			if(splitter){
				splitter.destroy();
				delete child._splitterWidget;
			}

			this.inherited(arguments);
		},

		getChildren: function(){
			// Override _LayoutWidget.getChildren() to only return real children, not the splitters.
			return array.filter(this.inherited(arguments), function(widget){
				return !widget.isSplitter;
			});
		},

		// TODO: remove in 2.0
		getSplitter: function(/*String*/region){
			// summary:
			//		Returns the widget responsible for rendering the splitter associated with region
			// tags:
			//		deprecated
			return array.filter(this.getChildren(), function(child){
				return child.region == region;
			})[0]._splitterWidget;
		},

		resize: function(newSize, currentSize){
			// Overrides _LayoutWidget.resize().

			// resetting potential padding to 0px to provide support for 100% width/height + padding
			// TODO: this hack doesn't respect the box model and is a temporary fix
			if(!this.cs || !this.pe){
				var node = this.domNode;
				this.cs = domStyle.getComputedStyle(node);
				this.pe = domGeometry.getPadExtents(node, this.cs);
				this.pe.r = domStyle.toPixelValue(node, this.cs.paddingRight);
				this.pe.b = domStyle.toPixelValue(node, this.cs.paddingBottom);

				domStyle.set(node, "padding", "0px");
			}

			this.inherited(arguments);
		},

		_layoutChildren: function(/*String?*/ changedChildId, /*Number?*/ changedChildSize){
			// summary:
			//		This is the main routine for setting size/position of each child.
			// description:
			//		With no arguments, measures the height of top/bottom panes, the width
			//		of left/right panes, and then sizes all panes accordingly.
			//
			//		With changedRegion specified (as "left", "top", "bottom", or "right"),
			//		it changes that region's width/height to changedRegionSize and
			//		then resizes other regions that were affected.
			// changedChildId:
			//		Id of the child which should be resized because splitter was dragged.
			// changedChildSize:
			//		The new width/height (in pixels) to make specified child

			if(!this._borderBox || !this._borderBox.h){
				// We are currently hidden, or we haven't been sized by our parent yet.
				// Abort.   Someone will resize us later.
				return;
			}

			// Combining the externally specified children with splitters and gutters
			var childrenAndSplitters = [];
			array.forEach(this._getOrderedChildren(), function(pane){
				childrenAndSplitters.push(pane);
				if(pane._splitterWidget){
					childrenAndSplitters.push(pane._splitterWidget);
				}
			});

			// Compute the box in which to lay out my children
			var dim = {
				l: this.pe.l,
				t: this.pe.t,
				w: this._borderBox.w - this.pe.w,
				h: this._borderBox.h - this.pe.h
			};

			// Layout the children, possibly changing size due to a splitter drag
			layoutUtils.layoutChildren(this.domNode, dim, childrenAndSplitters,
				changedChildId, changedChildSize);
		},

		destroyRecursive: function(){
			// Destroy splitters first, while getChildren() still works
			array.forEach(this.getChildren(), function(child){
				var splitter = child._splitterWidget;
				if(splitter){
					splitter.destroy();
				}
				delete child._splitterWidget;
			});

			// Then destroy the real children, and myself
			this.inherited(arguments);
		}
	});

	BorderContainer.ChildWidgetProperties = {
		// summary:
		//		These properties can be specified for the children of a BorderContainer.

		// splitter: [const] Boolean
		//		Parameter for children where region != "center".
		//		If true, enables user to resize the widget by putting a draggable splitter between
		//		this widget and the region=center widget.
		splitter: false,

		// minSize: [const] Number
		//		Specifies a minimum size (in pixels) for this widget when resized by a splitter.
		minSize: 0,

		// maxSize: [const] Number
		//		Specifies a maximum size (in pixels) for this widget when resized by a splitter.
		maxSize: Infinity
	};
	lang.mixin(BorderContainer.ChildWidgetProperties, LayoutContainer.ChildWidgetProperties);

	// Since any widget can be specified as a BorderContainer child, mix it
	// into the base widget class.  (This is a hack, but it's effective.)
	// This is for the benefit of the parser.   Remove for 2.0.  Also, hide from doc viewer.
	lang.extend(_WidgetBase, /*===== {} || =====*/ BorderContainer.ChildWidgetProperties);

	// For monkey patching
	BorderContainer._Splitter = _Splitter;
	BorderContainer._Gutter = _Gutter;

	return BorderContainer;
});

},
'dijit/layout/LayoutContainer':function(){
define([
	"dojo/_base/array",
	"dojo/_base/declare", // declare
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/_base/lang",
	"../_WidgetBase",
	"./_LayoutWidget",
	"./utils" // layoutUtils.layoutChildren
], function(array, declare, domClass, domStyle, lang, _WidgetBase, _LayoutWidget, layoutUtils){

	// module:
	//		dijit/layout/LayoutContainer

	var LayoutContainer = declare("dijit.layout.LayoutContainer", _LayoutWidget, {
		// summary:
		//		A LayoutContainer is a box with a specified size, such as style="width: 500px; height: 500px;",
		//		that contains a child widget marked region="center" and optionally children widgets marked
		//		region equal to "top", "bottom", "leading", "trailing", "left" or "right".
		//		Children along the edges will be laid out according to width or height dimensions. The remaining
		//		space is designated for the center region.
		//
		//		The outer size must be specified on the LayoutContainer node.  Width must be specified for the sides
		//		and height for the top and bottom, respectively.  No dimensions should be specified on the center;
		//		it will fill the remaining space.  Regions named "leading" and "trailing" may be used just like
		//		"left" and "right" except that they will be reversed in right-to-left environments.
		//
		//		For complex layouts, multiple children can be specified for a single region.   In this case, the
		//		layoutPriority flag on the children determines which child is closer to the edge (low layoutPriority)
		//		and which child is closer to the center (high layoutPriority).   layoutPriority can also be used
		//		instead of the design attribute to control layout precedence of horizontal vs. vertical panes.
		//
		//		See `LayoutContainer.ChildWidgetProperties` for details on the properties that can be set on
		//		children of a `LayoutContainer`.
		//
		//		If layoutPriority is not set, lays out each child in the natural order the children occur in.
		//		Basically each child is laid out into the "remaining space", where "remaining space" is initially
		//		the content area of this widget, but is reduced to a smaller rectangle each time a child is added.

		// design: String
		//		Which design is used for the layout:
		//
		//		- "headline" (default) where the top and bottom extend the full width of the container
		//		- "sidebar" where the left and right sides extend from top to bottom.
		design: "headline",

		baseClass: "dijitLayoutContainer",

		startup: function(){
			if(this._started){
				return;
			}
			array.forEach(this.getChildren(), this._setupChild, this);
			this.inherited(arguments);
		},

		_setupChild: function(/*dijit/_WidgetBase*/ child){
			// Override _LayoutWidget._setupChild().

			this.inherited(arguments);

			var region = child.region;
			if(region){
				domClass.add(child.domNode, this.baseClass + "Pane");
			}
		},

		_getOrderedChildren: function(){
			// summary:
			//		Return list of my children in the order that I want layoutChildren()
			//		to process them (i.e. from the outside to the inside)

			var wrappers = array.map(this.getChildren(), function(child, idx){
				return {
					pane: child,
					weight: [
						child.region == "center" ? Infinity : 0,
						child.layoutPriority,
						(this.design == "sidebar" ? 1 : -1) * (/top|bottom/.test(child.region) ? 1 : -1),
						idx
					]
				};
			}, this);
			wrappers.sort(function(a, b){
				var aw = a.weight, bw = b.weight;
				for(var i = 0; i < aw.length; i++){
					if(aw[i] != bw[i]){
						return aw[i] - bw[i];
					}
				}
				return 0;
			});

			return array.map(wrappers, function(w){ return w.pane; });
		},

		layout: function(){
			layoutUtils.layoutChildren(this.domNode, this._contentBox, this._getOrderedChildren());
		},

		addChild: function(/*dijit/_WidgetBase*/ child, /*Integer?*/ insertIndex){
			this.inherited(arguments);
			if(this._started){
				this.layout();
			}
		},

		removeChild: function(/*dijit/_WidgetBase*/ child){
			this.inherited(arguments);
			if(this._started){
				this.layout();
			}

			// Clean up whatever style changes we made to the child pane.
			// Unclear how height and width should be handled.
			domClass.remove(child.domNode, this.baseClass + "Pane");
			domStyle.set(child.domNode, {
				top: "auto",
				bottom: "auto",
				left: "auto",
				right: "auto",
				position: "static"
			});
			domStyle.set(child.domNode, /top|bottom/.test(child.region) ? "width" : "height", "auto");
		}
	});

	LayoutContainer.ChildWidgetProperties = {
		// summary:
		//		These properties can be specified for the children of a LayoutContainer.

		// region: [const] String
		//		Values: "top", "bottom", "leading", "trailing", "left", "right", "center".
		//		See the `dijit/layout/LayoutContainer` description for details.
		region: '',

		// layoutAlign: [const deprecated] String
		//		Synonym for region, except using "client" instead of "center".  Deprecated; use region instead.
		layoutAlign: '',

		// layoutPriority: [const] Number
		//		Children with a higher layoutPriority will be placed closer to the LayoutContainer center,
		//		between children with a lower layoutPriority.
		layoutPriority: 0
	};

	// Since any widget can be specified as a LayoutContainer child, mix it
	// into the base widget class.  (This is a hack, but it's effective.)
	// This is for the benefit of the parser.   Remove for 2.0.  Also, hide from doc viewer.
	lang.extend(_WidgetBase, /*===== {} || =====*/ LayoutContainer.ChildWidgetProperties);

	return LayoutContainer;
});

},
'dijit/layout/_LayoutWidget':function(){
define([
	"dojo/_base/lang", // lang.mixin
	"../_Widget",
	"../_Container",
	"../_Contained",
	"../Viewport",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-geometry", // domGeometry.marginBox
	"dojo/dom-style" // domStyle.getComputedStyle
], function(lang, _Widget, _Container, _Contained, Viewport,
	declare, domClass, domGeometry, domStyle){

	// module:
	//		dijit/layout/_LayoutWidget


	return declare("dijit.layout._LayoutWidget", [_Widget, _Container, _Contained], {
		// summary:
		//		Base class for a _Container widget which is responsible for laying out its children.
		//		Widgets which mixin this code must define layout() to manage placement and sizing of the children.

		// baseClass: [protected extension] String
		//		This class name is applied to the widget's domNode
		//		and also may be used to generate names for sub nodes,
		//		for example dijitTabContainer-content.
		baseClass: "dijitLayoutContainer",

		// isLayoutContainer: [protected] Boolean
		//		Indicates that this widget is going to call resize() on its
		//		children widgets, setting their size, when they become visible.
		isLayoutContainer: true,

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "dijitContainer");
		},

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under <body>.
			//
			//		Widgets should override this method to do any initialization
			//		dependent on other widgets existing, and then call
			//		this superclass method to finish things off.
			//
			//		startup() in subclasses shouldn't do anything
			//		size related because the size of the widget hasn't been set yet.

			if(this._started){ return; }

			// Need to call inherited first - so that child widgets get started
			// up correctly
			this.inherited(arguments);

			// If I am a not being controlled by a parent layout widget...
			var parent = this.getParent && this.getParent();
			if(!(parent && parent.isLayoutContainer)){
				// Do recursive sizing and layout of all my descendants
				// (passing in no argument to resize means that it has to glean the size itself)
				this.resize();

				// Since my parent isn't a layout container, and my style *may be* width=height=100%
				// or something similar (either set directly or via a CSS class),
				// monitor when viewport size changes so that I can re-layout.
				this.own(Viewport.on("resize", lang.hitch(this, "resize")));
			}
		},

		resize: function(changeSize, resultSize){
			// summary:
			//		Call this to resize a widget, or after its size has changed.
			// description:
			//		####Change size mode:
			//
			//		When changeSize is specified, changes the marginBox of this widget
			//		and forces it to re-layout its contents accordingly.
			//		changeSize may specify height, width, or both.
			//
			//		If resultSize is specified it indicates the size the widget will
			//		become after changeSize has been applied.
			//
			//		####Notification mode:
			//
			//		When changeSize is null, indicates that the caller has already changed
			//		the size of the widget, or perhaps it changed because the browser
			//		window was resized.  Tells widget to re-layout its contents accordingly.
			//
			//		If resultSize is also specified it indicates the size the widget has
			//		become.
			//
			//		In either mode, this method also:
			//
			//		1. Sets this._borderBox and this._contentBox to the new size of
			//			the widget.  Queries the current domNode size if necessary.
			//		2. Calls layout() to resize contents (and maybe adjust child widgets).
			// changeSize: Object?
			//		Sets the widget to this margin-box size and position.
			//		May include any/all of the following properties:
			//	|	{w: int, h: int, l: int, t: int}
			// resultSize: Object?
			//		The margin-box size of this widget after applying changeSize (if
			//		changeSize is specified).  If caller knows this size and
			//		passes it in, we don't need to query the browser to get the size.
			//	|	{w: int, h: int}

			var node = this.domNode;

			// set margin box size, unless it wasn't specified, in which case use current size
			if(changeSize){
				domGeometry.setMarginBox(node, changeSize);
			}

			// If either height or width wasn't specified by the user, then query node for it.
			// But note that setting the margin box and then immediately querying dimensions may return
			// inaccurate results, so try not to depend on it.
			var mb = resultSize || {};
			lang.mixin(mb, changeSize || {});	// changeSize overrides resultSize
			if( !("h" in mb) || !("w" in mb) ){
				mb = lang.mixin(domGeometry.getMarginBox(node), mb);	// just use domGeometry.marginBox() to fill in missing values
			}

			// Compute and save the size of my border box and content box
			// (w/out calling domGeometry.getContentBox() since that may fail if size was recently set)
			var cs = domStyle.getComputedStyle(node);
			var me = domGeometry.getMarginExtents(node, cs);
			var be = domGeometry.getBorderExtents(node, cs);
			var bb = (this._borderBox = {
				w: mb.w - (me.w + be.w),
				h: mb.h - (me.h + be.h)
			});
			var pe = domGeometry.getPadExtents(node, cs);
			this._contentBox = {
				l: domStyle.toPixelValue(node, cs.paddingLeft),
				t: domStyle.toPixelValue(node, cs.paddingTop),
				w: bb.w - pe.w,
				h: bb.h - pe.h
			};

			// Callback for widget to adjust size of its children
			this.layout();
		},

		layout: function(){
			// summary:
			//		Widgets override this method to size and position their contents/children.
			//		When this is called this._contentBox is guaranteed to be set (see resize()).
			//
			//		This is called after startup(), and also when the widget's size has been
			//		changed.
			// tags:
			//		protected extension
		},

		_setupChild: function(/*dijit/_WidgetBase*/child){
			// summary:
			//		Common setup for initial children and children which are added after startup
			// tags:
			//		protected extension

			var cls = this.baseClass + "-child "
				+ (child.baseClass ? this.baseClass + "-" + child.baseClass : "");
			domClass.add(child.domNode, cls);
		},

		addChild: function(/*dijit/_WidgetBase*/ child, /*Integer?*/ insertIndex){
			// Overrides _Container.addChild() to call _setupChild()
			this.inherited(arguments);
			if(this._started){
				this._setupChild(child);
			}
		},

		removeChild: function(/*dijit/_WidgetBase*/ child){
			// Overrides _Container.removeChild() to remove class added by _setupChild()
			var cls = this.baseClass + "-child"
					+ (child.baseClass ?
						" " + this.baseClass + "-" + child.baseClass : "");
			domClass.remove(child.domNode, cls);

			this.inherited(arguments);
		}
	});
});

},
'dijit/layout/utils':function(){
define([
	"dojo/_base/array", // array.filter array.forEach
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-geometry", // domGeometry.marginBox
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/lang" // lang.mixin, lang.setObject
], function(array, domClass, domGeometry, domStyle, lang){

	// module:
	//		dijit/layout/utils

	function capitalize(word){
		return word.substring(0,1).toUpperCase() + word.substring(1);
	}

	function size(widget, dim){
		// size the child
		var newSize = widget.resize ? widget.resize(dim) : domGeometry.setMarginBox(widget.domNode, dim);

		// record child's size
		if(newSize){
			// if the child returned it's new size then use that
			lang.mixin(widget, newSize);
		}else{
			// otherwise, call getMarginBox(), but favor our own numbers when we have them.
			// the browser lies sometimes
			lang.mixin(widget, domGeometry.getMarginBox(widget.domNode));
			lang.mixin(widget, dim);
		}
	}

	var utils = {
		// summary:
		//		Utility functions for doing layout

		marginBox2contentBox: function(/*DomNode*/ node, /*Object*/ mb){
			// summary:
			//		Given the margin-box size of a node, return its content box size.
			//		Functions like domGeometry.contentBox() but is more reliable since it doesn't have
			//		to wait for the browser to compute sizes.
			var cs = domStyle.getComputedStyle(node);
			var me = domGeometry.getMarginExtents(node, cs);
			var pb = domGeometry.getPadBorderExtents(node, cs);
			return {
				l: domStyle.toPixelValue(node, cs.paddingLeft),
				t: domStyle.toPixelValue(node, cs.paddingTop),
				w: mb.w - (me.w + pb.w),
				h: mb.h - (me.h + pb.h)
			};
		},


		layoutChildren: function(/*DomNode*/ container, /*Object*/ dim, /*Widget[]*/ children,
				/*String?*/ changedRegionId, /*Number?*/ changedRegionSize){
			// summary:
			//		Layout a bunch of child dom nodes within a parent dom node
			// container:
			//		parent node
			// dim:
			//		{l, t, w, h} object specifying dimensions of container into which to place children
			// children:
			//		An array of Widgets or at least objects containing:
			//
			//		- domNode: pointer to DOM node to position
			//		- region or layoutAlign: position to place DOM node
			//		- resize(): (optional) method to set size of node
			//		- id: (optional) Id of widgets, referenced from resize object, below.
			//
			//		The widgets in this array should be ordered according to how they should be laid out
			//		(each element will be processed in order, and take up as much remaining space as needed),
			//		with the center widget last.
			// changedRegionId:
			//		If specified, the slider for the region with the specified id has been dragged, and thus
			//		the region's height or width should be adjusted according to changedRegionSize
			// changedRegionSize:
			//		See changedRegionId.

			// copy dim because we are going to modify it
			dim = lang.mixin({}, dim);

			domClass.add(container, "dijitLayoutContainer");

			// Move "client" elements to the end of the array for layout.  a11y dictates that the author
			// needs to be able to put them in the document in tab-order, but this algorithm requires that
			// client be last.    TODO: remove for 2.0, all dijit client code already sends children as last item.
			children = array.filter(children, function(item){ return item.region != "center" && item.layoutAlign != "client"; })
				.concat(array.filter(children, function(item){ return item.region == "center" || item.layoutAlign == "client"; }));

			// set positions/sizes
			array.forEach(children, function(child){
				var elm = child.domNode,
					pos = (child.region || child.layoutAlign);
				if(!pos){
					throw new Error("No region setting for " + child.id)
				}

				// set elem to upper left corner of unused space; may move it later
				var elmStyle = elm.style;
				elmStyle.left = dim.l+"px";
				elmStyle.top = dim.t+"px";
				elmStyle.position = "absolute";

				domClass.add(elm, "dijitAlign" + capitalize(pos));

				// Size adjustments to make to this child widget
				var sizeSetting = {};

				// Check for optional size adjustment due to splitter drag (height adjustment for top/bottom align
				// panes and width adjustment for left/right align panes.
				if(changedRegionId && changedRegionId == child.id){
					sizeSetting[child.region == "top" || child.region == "bottom" ? "h" : "w"] = changedRegionSize;
				}

				if(pos == "leading"){
					pos = child.isLeftToRight() ? "left" : "right";
				}
				if(pos == "trailing"){
					pos = child.isLeftToRight() ? "right" : "left";
				}

				// set size && adjust record of remaining space.
				// note that setting the width of a <div> may affect its height.
				if(pos == "top" || pos == "bottom"){
					sizeSetting.w = dim.w;
					size(child, sizeSetting);
					dim.h -= child.h;
					if(pos == "top"){
						dim.t += child.h;
					}else{
						elmStyle.top = dim.t + dim.h + "px";
					}
				}else if(pos == "left" || pos == "right"){
					sizeSetting.h = dim.h;
					size(child, sizeSetting);
					dim.w -= child.w;
					if(pos == "left"){
						dim.l += child.w;
					}else{
						elmStyle.left = dim.l + dim.w + "px";
					}
				}else if(pos == "client" || pos == "center"){
					size(child, dim);
				}
			});
		}
	};

	lang.setObject("dijit.layout.utils", utils);	// remove for 2.0

	return utils;
});

},
'dijit/layout/ContentPane':function(){
define([
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.mixin lang.delegate lang.hitch lang.isFunction lang.isObject
	"../_Widget",
	"../_Container",
	"./_ContentPaneResizeMixin",
	"dojo/string", // string.substitute
	"dojo/html", // html._ContentSetter
	"dojo/i18n!../nls/loading",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/Deferred", // Deferred
	"dojo/dom", // dom.byId
	"dojo/dom-attr", // domAttr.attr
	"dojo/dom-construct", // empty()
	"dojo/_base/xhr", // xhr.get
	"dojo/i18n", // i18n.getLocalization
	"dojo/when"
], function(kernel, lang, _Widget, _Container, _ContentPaneResizeMixin, string, html, nlsLoading, array, declare,
			Deferred, dom, domAttr, domConstruct, xhr, i18n, when){

	// module:
	//		dijit/layout/ContentPane

	return declare("dijit.layout.ContentPane", [_Widget, _Container, _ContentPaneResizeMixin], {
		// summary:
		//		A widget containing an HTML fragment, specified inline
		//		or by uri.  Fragment may include widgets.
		//
		// description:
		//		This widget embeds a document fragment in the page, specified
		//		either by uri, javascript generated markup or DOM reference.
		//		Any widgets within this content are instantiated and managed,
		//		but laid out according to the HTML structure.  Unlike IFRAME,
		//		ContentPane embeds a document fragment as would be found
		//		inside the BODY tag of a full HTML document.  It should not
		//		contain the HTML, HEAD, or BODY tags.
		//		For more advanced functionality with scripts and
		//		stylesheets, see dojox/layout/ContentPane.  This widget may be
		//		used stand alone or as a base class for other widgets.
		//		ContentPane is useful as a child of other layout containers
		//		such as BorderContainer or TabContainer, but note that those
		//		widgets can contain any widget as a child.
		//
		// example:
		//		Some quick samples:
		//		To change the innerHTML:
		// |		cp.set('content', '<b>new content</b>')`
		//		Or you can send it a NodeList:
		// |		cp.set('content', dojo.query('div [class=selected]', userSelection))
		//		To do an ajax update:
		// |		cp.set('href', url)

		// href: String
		//		The href of the content that displays now.
		//		Set this at construction if you want to load data externally when the
		//		pane is shown.  (Set preload=true to load it immediately.)
		//		Changing href after creation doesn't have any effect; Use set('href', ...);
		href: "",

		// content: String|DomNode|NodeList|dijit/_Widget
		//		The innerHTML of the ContentPane.
		//		Note that the initialization parameter / argument to set("content", ...)
		//		can be a String, DomNode, Nodelist, or _Widget.
		content: "",

		// extractContent: Boolean
		//		Extract visible content from inside of `<body> .... </body>`.
		//		I.e., strip `<html>` and `<head>` (and it's contents) from the href
		extractContent: false,

		// parseOnLoad: Boolean
		//		Parse content and create the widgets, if any.
		parseOnLoad: true,

		// parserScope: String
		//		Flag passed to parser.  Root for attribute names to search for.   If scopeName is dojo,
		//		will search for data-dojo-type (or dojoType).  For backwards compatibility
		//		reasons defaults to dojo._scopeName (which is "dojo" except when
		//		multi-version support is used, when it will be something like dojo16, dojo20, etc.)
		parserScope: kernel._scopeName,

		// preventCache: Boolean
		//		Prevent caching of data from href's by appending a timestamp to the href.
		preventCache: false,

		// preload: Boolean
		//		Force load of data on initialization even if pane is hidden.
		preload: false,

		// refreshOnShow: Boolean
		//		Refresh (re-download) content when pane goes from hidden to shown
		refreshOnShow: false,

		// loadingMessage: String
		//		Message that shows while downloading
		loadingMessage: "<span class='dijitContentPaneLoading'><span class='dijitInline dijitIconLoading'></span>${loadingState}</span>",

		// errorMessage: String
		//		Message that shows if an error occurs
		errorMessage: "<span class='dijitContentPaneError'><span class='dijitInline dijitIconError'></span>${errorState}</span>",

		// isLoaded: [readonly] Boolean
		//		True if the ContentPane has data in it, either specified
		//		during initialization (via href or inline content), or set
		//		via set('content', ...) / set('href', ...)
		//
		//		False if it doesn't have any content, or if ContentPane is
		//		still in the process of downloading href.
		isLoaded: false,

		baseClass: "dijitContentPane",

		/*======
		 // ioMethod: dojo/_base/xhr.get|dojo._base/xhr.post
		 //		Function that should grab the content specified via href.
		 ioMethod: dojo.xhrGet,
		 ======*/

		// ioArgs: Object
		//		Parameters to pass to xhrGet() request, for example:
		// |	<div data-dojo-type="dijit/layout/ContentPane" data-dojo-props="href: './bar', ioArgs: {timeout: 500}">
		ioArgs: {},

		// onLoadDeferred: [readonly] dojo.Deferred
		//		This is the `dojo.Deferred` returned by set('href', ...) and refresh().
		//		Calling onLoadDeferred.then() registers your
		//		callback to be called only once, when the prior set('href', ...) call or
		//		the initial href parameter to the constructor finishes loading.
		//
		//		This is different than an onLoad() handler which gets called any time any href
		//		or content is loaded.
		onLoadDeferred: null,

		// Cancel _WidgetBase's _setTitleAttr because we don't want the title attribute (used to specify
		// tab labels) to be copied to ContentPane.domNode... otherwise a tooltip shows up over the
		// entire pane.
		_setTitleAttr: null,

		// Flag to parser that I'll parse my contents, so it shouldn't.
		stopParser: true,

		// template: [private] Boolean
		//		Flag from the parser that this ContentPane is inside a template
		//		so the contents are pre-parsed.
		// TODO: this declaration can be commented out in 2.0
		template: false,

		markupFactory: function(params, node, ctor){
			var self = new ctor(params, node);

			// If a parse has started but is waiting for modules to load, then return a Promise for when the parser
			// finishes.  Don't return a promise though for the case when content hasn't started loading because the
			// ContentPane is hidden and it has an href (ex: hidden pane of a TabContainer).   In that case we consider
			// that initialization has already finished.
			return !self.href && self._contentSetter && self._contentSetter.parseDeferred && !self._contentSetter.parseDeferred.isFulfilled() ?
				self._contentSetter.parseDeferred.then(function(){
					return self;
				}) : self;
		},

		create: function(params, srcNodeRef){
			// Convert a srcNodeRef argument into a content parameter, so that the original contents are
			// processed in the same way as contents set via set("content", ...), calling the parser etc.
			// Avoid modifying original params object since that breaks NodeList instantiation, see #11906.
			if((!params || !params.template) && srcNodeRef && !("href" in params) && !("content" in params)){
				srcNodeRef = dom.byId(srcNodeRef);
				var df = srcNodeRef.ownerDocument.createDocumentFragment();
				while(srcNodeRef.firstChild){
					df.appendChild(srcNodeRef.firstChild);
				}
				params = lang.delegate(params, {content: df});
			}
			this.inherited(arguments, [params, srcNodeRef]);
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			var messages = i18n.getLocalization("dijit", "loading", this.lang);
			this.loadingMessage = string.substitute(this.loadingMessage, messages);
			this.errorMessage = string.substitute(this.errorMessage, messages);
		},

		buildRendering: function(){
			this.inherited(arguments);

			// Since we have no template we need to set this.containerNode ourselves, to make getChildren() work.
			// For subclasses of ContentPane that do have a template, does nothing.
			if(!this.containerNode){
				this.containerNode = this.domNode;
			}

			// remove the title attribute so it doesn't show up when hovering
			// over a node  (TODO: remove in 2.0, no longer needed after #11490)
			this.domNode.removeAttribute("title");
		},

		startup: function(){
			// summary:
			//		Call startup() on all children including non _Widget ones like dojo/dnd/Source objects

			// This starts all the widgets
			this.inherited(arguments);

			// And this catches stuff like dojo/dnd/Source
			if(this._contentSetter){
				array.forEach(this._contentSetter.parseResults, function(obj){
					if(!obj._started && !obj._destroyed && lang.isFunction(obj.startup)){
						obj.startup();
						obj._started = true;
					}
				}, this);
			}
		},

		_startChildren: function(){
			// summary:
			//		Called when content is loaded.   Calls startup on each child widget.   Similar to ContentPane.startup()
			//		itself, but avoids marking the ContentPane itself as "restarted" (see #15581).

			// This starts all the widgets
			array.forEach(this.getChildren(), function(obj){
				if(!obj._started && !obj._destroyed && lang.isFunction(obj.startup)){
					obj.startup();
					obj._started = true;
				}
			});

			// And this catches stuff like dojo/dnd/Source
			if(this._contentSetter){
				array.forEach(this._contentSetter.parseResults, function(obj){
					if(!obj._started && !obj._destroyed && lang.isFunction(obj.startup)){
						obj.startup();
						obj._started = true;
					}
				}, this);
			}
		},

		setHref: function(/*String|Uri*/ href){
			// summary:
			//		Deprecated.   Use set('href', ...) instead.
			kernel.deprecated("dijit.layout.ContentPane.setHref() is deprecated. Use set('href', ...) instead.", "", "2.0");
			return this.set("href", href);
		},
		_setHrefAttr: function(/*String|Uri*/ href){
			// summary:
			//		Hook so set("href", ...) works.
			// description:
			//		Reset the (external defined) content of this pane and replace with new url
			//		Note: It delays the download until widget is shown if preload is false.
			// href:
			//		url to the page you want to get, must be within the same domain as your mainpage

			// Cancel any in-flight requests (a set('href', ...) will cancel any in-flight set('href', ...))
			this.cancel();

			this.onLoadDeferred = new Deferred(lang.hitch(this, "cancel"));
			this.onLoadDeferred.then(lang.hitch(this, "onLoad"));

			this._set("href", href);

			// _setHrefAttr() is called during creation and by the user, after creation.
			// Assuming preload == false, only in the second case do we actually load the URL;
			// otherwise it's done in startup(), and only if this widget is shown.
			if(this.preload || (this._created && this._isShown())){
				this._load();
			}else{
				// Set flag to indicate that href needs to be loaded the next time the
				// ContentPane is made visible
				this._hrefChanged = true;
			}

			return this.onLoadDeferred;		// Deferred
		},

		setContent: function(/*String|DomNode|Nodelist*/data){
			// summary:
			//		Deprecated.   Use set('content', ...) instead.
			kernel.deprecated("dijit.layout.ContentPane.setContent() is deprecated.  Use set('content', ...) instead.", "", "2.0");
			this.set("content", data);
		},
		_setContentAttr: function(/*String|DomNode|Nodelist*/data){
			// summary:
			//		Hook to make set("content", ...) work.
			//		Replaces old content with data content, include style classes from old content
			// data:
			//		the new Content may be String, DomNode or NodeList
			//
			//		if data is a NodeList (or an array of nodes) nodes are copied
			//		so you can import nodes from another document implicitly

			// clear href so we can't run refresh and clear content
			// refresh should only work if we downloaded the content
			this._set("href", "");

			// Cancel any in-flight requests (a set('content', ...) will cancel any in-flight set('href', ...))
			this.cancel();

			// Even though user is just setting content directly, still need to define an onLoadDeferred
			// because the _onLoadHandler() handler is still getting called from setContent()
			this.onLoadDeferred = new Deferred(lang.hitch(this, "cancel"));
			if(this._created){
				// For back-compat reasons, call onLoad() for set('content', ...)
				// calls but not for content specified in srcNodeRef (ie: <div data-dojo-type=ContentPane>...</div>)
				// or as initialization parameter (ie: new ContentPane({content: ...})
				this.onLoadDeferred.then(lang.hitch(this, "onLoad"));
			}

			this._setContent(data || "");

			this._isDownloaded = false; // mark that content is from a set('content') not a set('href')

			return this.onLoadDeferred;	// Deferred
		},
		_getContentAttr: function(){
			// summary:
			//		Hook to make get("content") work
			return this.containerNode.innerHTML;
		},

		cancel: function(){
			// summary:
			//		Cancels an in-flight download of content
			if(this._xhrDfd && (this._xhrDfd.fired == -1)){
				this._xhrDfd.cancel();
			}
			delete this._xhrDfd; // garbage collect

			this.onLoadDeferred = null;
		},

		destroy: function(){
			this.cancel();
			this.inherited(arguments);
		},

		destroyRecursive: function(/*Boolean*/ preserveDom){
			// summary:
			//		Destroy the ContentPane and its contents

			// if we have multiple controllers destroying us, bail after the first
			if(this._beingDestroyed){
				return;
			}
			this.inherited(arguments);
		},

		_onShow: function(){
			// summary:
			//		Called when the ContentPane is made visible
			// description:
			//		For a plain ContentPane, this is called on initialization, from startup().
			//		If the ContentPane is a hidden pane of a TabContainer etc., then it's
			//		called whenever the pane is made visible.
			//
			//		Does necessary processing, including href download and layout/resize of
			//		child widget(s)

			this.inherited(arguments);

			if(this.href){
				if(!this._xhrDfd && // if there's an href that isn't already being loaded
					(!this.isLoaded || this._hrefChanged || this.refreshOnShow)
					){
					return this.refresh();	// If child has an href, promise that fires when the load is complete
				}
			}
		},

		refresh: function(){
			// summary:
			//		[Re]download contents of href and display
			// description:
			//		1. cancels any currently in-flight requests
			//		2. posts "loading..." message
			//		3. sends XHR to download new data

			// Cancel possible prior in-flight request
			this.cancel();

			this.onLoadDeferred = new Deferred(lang.hitch(this, "cancel"));
			this.onLoadDeferred.then(lang.hitch(this, "onLoad"));
			this._load();
			return this.onLoadDeferred;		// If child has an href, promise that fires when refresh is complete
		},

		_load: function(){
			// summary:
			//		Load/reload the href specified in this.href

			// display loading message
			this._setContent(this.onDownloadStart(), true);

			var self = this;
			var getArgs = {
				preventCache: (this.preventCache || this.refreshOnShow),
				url: this.href,
				handleAs: "text"
			};
			if(lang.isObject(this.ioArgs)){
				lang.mixin(getArgs, this.ioArgs);
			}

			var hand = (this._xhrDfd = (this.ioMethod || xhr.get)(getArgs)),
				returnedHtml;

			hand.then(
				function(html){
					returnedHtml = html;
					try{
						self._isDownloaded = true;
						return self._setContent(html, false);
					}catch(err){
						self._onError('Content', err); // onContentError
					}
				},
				function(err){
					if(!hand.canceled){
						// show error message in the pane
						self._onError('Download', err); // onDownloadError
					}
					delete self._xhrDfd;
					return err;
				}
			).then(function(){
					self.onDownloadEnd();
					delete self._xhrDfd;
					return returnedHtml;
				});

			// Remove flag saying that a load is needed
			delete this._hrefChanged;
		},

		_onLoadHandler: function(data){
			// summary:
			//		This is called whenever new content is being loaded
			this._set("isLoaded", true);
			try{
				this.onLoadDeferred.resolve(data);
			}catch(e){
				console.error('Error ' + this.widgetId + ' running custom onLoad code: ' + e.message);
			}
		},

		_onUnloadHandler: function(){
			// summary:
			//		This is called whenever the content is being unloaded
			this._set("isLoaded", false);
			try{
				this.onUnload();
			}catch(e){
				console.error('Error ' + this.widgetId + ' running custom onUnload code: ' + e.message);
			}
		},

		destroyDescendants: function(/*Boolean*/ preserveDom){
			// summary:
			//		Destroy all the widgets inside the ContentPane and empty containerNode

			// Make sure we call onUnload (but only when the ContentPane has real content)
			if(this.isLoaded){
				this._onUnloadHandler();
			}

			// Even if this.isLoaded == false there might still be a "Loading..." message
			// to erase, so continue...

			// For historical reasons we need to delete all widgets under this.containerNode,
			// even ones that the user has created manually.
			var setter = this._contentSetter;
			array.forEach(this.getChildren(), function(widget){
				if(widget.destroyRecursive){
					// All widgets will hit this branch
					widget.destroyRecursive(preserveDom);
				}else if(widget.destroy){
					// Things like dojo/dnd/Source have destroy(), not destroyRecursive()
					widget.destroy(preserveDom);
				}
				widget._destroyed = true;
			});
			if(setter){
				// Most of the widgets in setter.parseResults have already been destroyed, but
				// things like Menu that have been moved to <body> haven't yet
				array.forEach(setter.parseResults, function(widget){
					if(!widget._destroyed){
						if(widget.destroyRecursive){
							// All widgets will hit this branch
							widget.destroyRecursive(preserveDom);
						}else if(widget.destroy){
							// Things like dojo/dnd/Source have destroy(), not destroyRecursive()
							widget.destroy(preserveDom);
						}
						widget._destroyed = true;
					}
				});
				delete setter.parseResults;
			}

			// And then clear away all the DOM nodes
			if(!preserveDom){
				domConstruct.empty(this.containerNode);
			}

			// Delete any state information we have about current contents
			delete this._singleChild;
		},

		_setContent: function(/*String|DocumentFragment*/ cont, /*Boolean*/ isFakeContent){
			// summary:
			//		Insert the content into the container node
			// returns:
			//		Returns a Deferred promise that is resolved when the content is parsed.

			// first get rid of child widgets
			this.destroyDescendants();

			// html.set will take care of the rest of the details
			// we provide an override for the error handling to ensure the widget gets the errors
			// configure the setter instance with only the relevant widget instance properties
			// NOTE: unless we hook into attr, or provide property setters for each property,
			// we need to re-configure the ContentSetter with each use
			var setter = this._contentSetter;
			if(!(setter && setter instanceof html._ContentSetter)){
				setter = this._contentSetter = new html._ContentSetter({
					node: this.containerNode,
					_onError: lang.hitch(this, this._onError),
					onContentError: lang.hitch(this, function(e){
						// fires if a domfault occurs when we are appending this.errorMessage
						// like for instance if domNode is a UL and we try append a DIV
						var errMess = this.onContentError(e);
						try{
							this.containerNode.innerHTML = errMess;
						}catch(e){
							console.error('Fatal ' + this.id + ' could not change content due to ' + e.message, e);
						}
					})/*,
					 _onError */
				});
			}

			var setterParams = lang.mixin({
				cleanContent: this.cleanContent,
				extractContent: this.extractContent,
				parseContent: !cont.domNode && this.parseOnLoad,
				parserScope: this.parserScope,
				startup: false,
				dir: this.dir,
				lang: this.lang,
				textDir: this.textDir
			}, this._contentSetterParams || {});

			var p = setter.set((lang.isObject(cont) && cont.domNode) ? cont.domNode : cont, setterParams);

			// dojox/layout/html/_base::_ContentSetter.set() returns a Promise that indicates when everything is completed.
			// dojo/html::_ContentSetter.set() currently returns the DOMNode, but that will be changed for 2.0.
			// So, if set() returns a promise then use it, otherwise fallback to waiting on setter.parseDeferred
			var self = this;
			return when(p && p.then ? p : setter.parseDeferred, function(){
				// setter params must be pulled afresh from the ContentPane each time
				delete self._contentSetterParams;

				if(!isFakeContent){
					if(self._started){
						// Startup each top level child widget (and they will start their children, recursively)
						self._startChildren();

						// Call resize() on each of my child layout widgets,
						// or resize() on my single child layout widget...
						// either now (if I'm currently visible) or when I become visible
						self._scheduleLayout();
					}
					self._onLoadHandler(cont);
				}
			});
		},

		_onError: function(type, err, consoleText){
			this.onLoadDeferred.reject(err);

			// shows user the string that is returned by on[type]Error
			// override on[type]Error and return your own string to customize
			var errText = this['on' + type + 'Error'].call(this, err);
			if(consoleText){
				console.error(consoleText, err);
			}else if(errText){// a empty string won't change current content
				this._setContent(errText, true);
			}
		},

		// EVENT's, should be overide-able
		onLoad: function(/*===== data =====*/){
			// summary:
			//		Event hook, is called after everything is loaded and widgetified
			// tags:
			//		callback
		},

		onUnload: function(){
			// summary:
			//		Event hook, is called before old content is cleared
			// tags:
			//		callback
		},

		onDownloadStart: function(){
			// summary:
			//		Called before download starts.
			// description:
			//		The string returned by this function will be the html
			//		that tells the user we are loading something.
			//		Override with your own function if you want to change text.
			// tags:
			//		extension
			return this.loadingMessage;
		},

		onContentError: function(/*Error*/ /*===== error =====*/){
			// summary:
			//		Called on DOM faults, require faults etc. in content.
			//
			//		In order to display an error message in the pane, return
			//		the error message from this method, as an HTML string.
			//
			//		By default (if this method is not overriden), it returns
			//		nothing, so the error message is just printed to the console.
			// tags:
			//		extension
		},

		onDownloadError: function(/*Error*/ /*===== error =====*/){
			// summary:
			//		Called when download error occurs.
			//
			//		In order to display an error message in the pane, return
			//		the error message from this method, as an HTML string.
			//
			//		Default behavior (if this method is not overriden) is to display
			//		the error message inside the pane.
			// tags:
			//		extension
			return this.errorMessage;
		},

		onDownloadEnd: function(){
			// summary:
			//		Called when download is finished.
			// tags:
			//		callback
		}
	});
});

},
'dijit/layout/_ContentPaneResizeMixin':function(){
define([
	"dojo/_base/array", // array.filter array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.contains domClass.toggle
	"dojo/dom-geometry", // domGeometry.contentBox domGeometry.marginBox
	"dojo/dom-style",
	"dojo/_base/lang", // lang.mixin
	"dojo/query", // query
	"../registry", // registry.byId
	"../Viewport",
	"./utils" // marginBox2contextBox
], function(array, declare, domClass, domGeometry, domStyle, lang, query,
			registry, Viewport, layoutUtils){

	// module:
	//		dijit/layout/_ContentPaneResizeMixin

	return declare("dijit.layout._ContentPaneResizeMixin", null, {
		// summary:
		//		Resize() functionality of ContentPane.   If there's a single layout widget
		//		child then it will call resize() with the same dimensions as the ContentPane.
		//		Otherwise just calls resize on each child.
		//
		//		Also implements basic startup() functionality, where starting the parent
		//		will start the children

		// doLayout: Boolean
		//		- false - don't adjust size of children
		//		- true - if there is a single visible child widget, set it's size to however big the ContentPane is
		doLayout: true,

		// isLayoutContainer: [protected] Boolean
		//		Indicates that this widget will call resize() on it's child widgets
		//		when they become visible.
		isLayoutContainer: true,

		startup: function(){
			// summary:
			//		See `dijit/layout/_LayoutWidget.startup()` for description.
			//		Although ContentPane doesn't extend _LayoutWidget, it does implement
			//		the same API.

			if(this._started){
				return;
			}

			var parent = this.getParent();
			this._childOfLayoutWidget = parent && parent.isLayoutContainer;

			// I need to call resize() on my child/children (when I become visible), unless
			// I'm the child of a layout widget in which case my parent will call resize() on me and I'll do it then.
			this._needLayout = !this._childOfLayoutWidget;

			this.inherited(arguments);

			if(this._isShown()){
				this._onShow();
			}

			if(!this._childOfLayoutWidget){
				// Since my parent isn't a layout container, and my style *may be* width=height=100%
				// or something similar (either set directly or via a CSS class),
				// monitor when viewport size changes so that I can re-layout.
				// This is more for subclasses of ContentPane than ContentPane itself, although it
				// could be useful for a ContentPane if it has a single child widget inheriting ContentPane's size.
				this.own(Viewport.on("resize", lang.hitch(this, "resize")));
			}
		},

		_checkIfSingleChild: function(){
			// summary:
			//		Test if we have exactly one visible widget as a child,
			//		and if so assume that we are a container for that widget,
			//		and should propagate startup() and resize() calls to it.
			//		Skips over things like data stores since they aren't visible.

			if(!this.doLayout){ return; }

			var candidateWidgets = [],
				otherVisibleNodes = false;

			query("> *", this.containerNode).some(function(node){
				var widget = registry.byNode(node);
				if(widget && widget.resize){
					candidateWidgets.push(widget);
				}else if(!/script|link|style/i.test(node.nodeName) && node.offsetHeight){
					otherVisibleNodes = true;
				}
			});

			this._singleChild = candidateWidgets.length == 1 && !otherVisibleNodes ?
				candidateWidgets[0] : null;

			// So we can set overflow: hidden to avoid a safari bug w/scrollbars showing up (#9449)
			domClass.toggle(this.containerNode, this.baseClass + "SingleChild", !!this._singleChild);
		},

		resize: function(changeSize, resultSize){
			// summary:
			//		See `dijit/layout/_LayoutWidget.resize()` for description.
			//		Although ContentPane doesn't extend _LayoutWidget, it does implement
			//		the same API.

			this._resizeCalled = true;

			this._scheduleLayout(changeSize, resultSize);
		},

		_scheduleLayout: function(changeSize, resultSize){
			// summary:
			//		Resize myself, and call resize() on each of my child layout widgets, either now
			//		(if I'm currently visible) or when I become visible
			if(this._isShown()){
				this._layout(changeSize, resultSize);
			}else{
				this._needLayout = true;
				this._changeSize = changeSize;
				this._resultSize = resultSize;
			}
		},

		_layout: function(changeSize, resultSize){
			// summary:
			//		Resize myself according to optional changeSize/resultSize parameters, like a layout widget.
			//		Also, since I am an isLayoutContainer widget, each of my children expects me to
			//		call resize() or layout() on it.
			//
			//		Should be called on initialization and also whenever we get new content
			//		(from an href, or from set('content', ...))... but deferred until
			//		the ContentPane is visible

			delete this._needLayout;

			// For the TabContainer --> BorderContainer --> ContentPane case, _onShow() is
			// never called directly, so resize() is our trigger to do the initial href download (see [20099]).
			// However, don't load href for closed TitlePanes.
			if(!this._wasShown && this.open !== false){
				this._onShow();
			}

			// Set margin box size, unless it wasn't specified, in which case use current size.
			if(changeSize){
				domGeometry.setMarginBox(this.domNode, changeSize);
			}

			// Compute content box size of containerNode in case we [later] need to size our single child.
			var cn = this.containerNode;
			if(cn === this.domNode){
				// If changeSize or resultSize was passed to this method and this.containerNode ==
				// this.domNode then we can compute the content-box size without querying the node,
				// which is more reliable (similar to LayoutWidget.resize) (see for example #9449).
				var mb = resultSize || {};
				lang.mixin(mb, changeSize || {}); // changeSize overrides resultSize
				if(!("h" in mb) || !("w" in mb)){
					mb = lang.mixin(domGeometry.getMarginBox(cn), mb); // just use domGeometry.setMarginBox() to fill in missing values
				}
				this._contentBox = layoutUtils.marginBox2contentBox(cn, mb);
			}else{
				this._contentBox = domGeometry.getContentBox(cn);
			}

			this._layoutChildren();
		},

		_layoutChildren: function(){
			// Call _checkIfSingleChild() again in case app has manually mucked w/the content
			// of the ContentPane (rather than changing it through the set("content", ...) API.
			this._checkIfSingleChild();

			if(this._singleChild && this._singleChild.resize){
				var cb = this._contentBox || domGeometry.getContentBox(this.containerNode);

				// note: if widget has padding this._contentBox will have l and t set,
				// but don't pass them to resize() or it will doubly-offset the child
				this._singleChild.resize({w: cb.w, h: cb.h});
			}else{
				// All my child widgets are independently sized (rather than matching my size),
				// but I still need to call resize() on each child to make it layout.
				var children = this.getChildren(),
					widget,
					i = 0;
				while(widget = children[i++]){
					if(widget.resize){
						widget.resize();
					}
				}
			}
		},

		_isShown: function(){
			// summary:
			//		Returns true if the content is currently shown.
			// description:
			//		If I am a child of a layout widget then it actually returns true if I've ever been visible,
			//		not whether I'm currently visible, since that's much faster than tracing up the DOM/widget
			//		tree every call, and at least solves the performance problem on page load by deferring loading
			//		hidden ContentPanes until they are first shown

			if(this._childOfLayoutWidget){
				// If we are TitlePane, etc - we return that only *IF* we've been resized
				if(this._resizeCalled && "open" in this){
					return this.open;
				}
				return this._resizeCalled;
			}else if("open" in this){
				return this.open;		// for TitlePane, etc.
			}else{
				var node = this.domNode, parent = this.domNode.parentNode;
				return (node.style.display != 'none') && (node.style.visibility != 'hidden') && !domClass.contains(node, "dijitHidden") &&
					parent && parent.style && (parent.style.display != 'none');
			}
		},

		_onShow: function(){
			// summary:
			//		Called when the ContentPane is made visible
			// description:
			//		For a plain ContentPane, this is called on initialization, from startup().
			//		If the ContentPane is a hidden pane of a TabContainer etc., then it's
			//		called whenever the pane is made visible.
			//
			//		Does layout/resize of child widget(s)

			// Need to keep track of whether ContentPane has been shown (which is different than
			// whether or not it's currently visible).
			this._wasShown = true;

			if(this._needLayout){
				// If a layout has been scheduled for when we become visible, do it now
				this._layout(this._changeSize, this._resultSize);
			}

			this.inherited(arguments);
		}
	});
});

},
'dojo/html':function(){
define(["./_base/kernel", "./_base/lang", "./_base/array", "./_base/declare", "./dom", "./dom-construct", "./parser"],
	function(kernel, lang, darray, declare, dom, domConstruct, parser){
	// module:
	//		dojo/html

	var html = {
		// summary:
		//		TODOC
	};
	lang.setObject("dojo.html", html);

	// the parser might be needed..

	// idCounter is incremented with each instantiation to allow assignment of a unique id for tracking, logging purposes
	var idCounter = 0;

	html._secureForInnerHtml = function(/*String*/ cont){
		// summary:
		//		removes !DOCTYPE and title elements from the html string.
		//
		//		khtml is picky about dom faults, you can't attach a style or `<title>` node as child of body
		//		must go into head, so we need to cut out those tags
		// cont:
		//		An html string for insertion into the dom
		//
		return cont.replace(/(?:\s*<!DOCTYPE\s[^>]+>|<title[^>]*>[\s\S]*?<\/title>)/ig, ""); // String
	};

	html._emptyNode = domConstruct.empty;
	/*=====
	 dojo.html._emptyNode = function(node){
		 // summary:
		 //		Removes all child nodes from the given node.   Deprecated, should use dojo/dom-constuct.empty() directly
		 //		instead.
		 // node: DOMNode
		 //		the parent element
	 };
	 =====*/

		html._setNodeContent = function(/*DomNode*/ node, /*String|DomNode|NodeList*/ cont){
		// summary:
		//		inserts the given content into the given node
		// node:
		//		the parent element
		// content:
		//		the content to be set on the parent element.
		//		This can be an html string, a node reference or a NodeList, dojo/NodeList, Array or other enumerable list of nodes

		// always empty
		domConstruct.empty(node);

		if(cont){
			if(typeof cont == "string"){
				cont = domConstruct.toDom(cont, node.ownerDocument);
			}
			if(!cont.nodeType && lang.isArrayLike(cont)){
				// handle as enumerable, but it may shrink as we enumerate it
				for(var startlen=cont.length, i=0; i<cont.length; i=startlen==cont.length ? i+1 : 0){
					domConstruct.place( cont[i], node, "last");
				}
			}else{
				// pass nodes, documentFragments and unknowns through to dojo.place
				domConstruct.place(cont, node, "last");
			}
		}

		// return DomNode
		return node;
	};

	// we wrap up the content-setting operation in a object
	html._ContentSetter = declare("dojo.html._ContentSetter", null,
		{
			// node: DomNode|String
			//		An node which will be the parent element that we set content into
			node: "",

			// content: String|DomNode|DomNode[]
			//		The content to be placed in the node. Can be an HTML string, a node reference, or a enumerable list of nodes
			content: "",

			// id: String?
			//		Usually only used internally, and auto-generated with each instance
			id: "",

			// cleanContent: Boolean
			//		Should the content be treated as a full html document,
			//		and the real content stripped of <html>, <body> wrapper before injection
			cleanContent: false,

			// extractContent: Boolean
			//		Should the content be treated as a full html document,
			//		and the real content stripped of `<html> <body>` wrapper before injection
			extractContent: false,

			// parseContent: Boolean
			//		Should the node by passed to the parser after the new content is set
			parseContent: false,

			// parserScope: String
			//		Flag passed to parser.	Root for attribute names to search for.	  If scopeName is dojo,
			//		will search for data-dojo-type (or dojoType).  For backwards compatibility
			//		reasons defaults to dojo._scopeName (which is "dojo" except when
			//		multi-version support is used, when it will be something like dojo16, dojo20, etc.)
			parserScope: kernel._scopeName,

			// startup: Boolean
			//		Start the child widgets after parsing them.	  Only obeyed if parseContent is true.
			startup: true,

			// lifecycle methods
			constructor: function(/*Object*/ params, /*String|DomNode*/ node){
				// summary:
				//		Provides a configurable, extensible object to wrap the setting on content on a node
				//		call the set() method to actually set the content..

				// the original params are mixed directly into the instance "this"
				lang.mixin(this, params || {});

				// give precedence to params.node vs. the node argument
				// and ensure its a node, not an id string
				node = this.node = dom.byId( this.node || node );

				if(!this.id){
					this.id = [
						"Setter",
						(node) ? node.id || node.tagName : "",
						idCounter++
					].join("_");
				}
			},
			set: function(/* String|DomNode|NodeList? */ cont, /*Object?*/ params){
				// summary:
				//		front-end to the set-content sequence
				// cont:
				//		An html string, node or enumerable list of nodes for insertion into the dom
				//		If not provided, the object's content property will be used
				if(undefined !== cont){
					this.content = cont;
				}
				// in the re-use scenario, set needs to be able to mixin new configuration
				if(params){
					this._mixin(params);
				}

				this.onBegin();
				this.setContent();

				var ret = this.onEnd();

				if(ret && ret.then){
					// Make dojox/html/_ContentSetter.set() return a Promise that resolves when load and parse complete.
					return ret;
				}else{
					// Vanilla dojo/html._ContentSetter.set() returns a DOMNode for back compat.   For 2.0, switch it to
					// return a Deferred like above.
					return this.node;
				}
			},

			setContent: function(){
				// summary:
				//		sets the content on the node

				var node = this.node;
				if(!node){
					// can't proceed
					throw new Error(this.declaredClass + ": setContent given no node");
				}
				try{
					node = html._setNodeContent(node, this.content);
				}catch(e){
					// check if a domfault occurs when we are appending this.errorMessage
					// like for instance if domNode is a UL and we try append a DIV

					// FIXME: need to allow the user to provide a content error message string
					var errMess = this.onContentError(e);
					try{
						node.innerHTML = errMess;
					}catch(e){
						console.error('Fatal ' + this.declaredClass + '.setContent could not change content due to '+e.message, e);
					}
				}
				// always put back the node for the next method
				this.node = node; // DomNode
			},

			empty: function(){
				// summary:
				//		cleanly empty out existing content
				
				// If there is a parse in progress, cancel it.
				if(this.parseDeferred){
					if(!this.parseDeferred.isResolved()){
						this.parseDeferred.cancel();
					}
					delete this.parseDeferred;
				}

				// destroy any widgets from a previous run
				// NOTE: if you don't want this you'll need to empty
				// the parseResults array property yourself to avoid bad things happening
				if(this.parseResults && this.parseResults.length){
					darray.forEach(this.parseResults, function(w){
						if(w.destroy){
							w.destroy();
						}
					});
					delete this.parseResults;
				}
				// this is fast, but if you know its already empty or safe, you could
				// override empty to skip this step
				domConstruct.empty(this.node);
			},

			onBegin: function(){
				// summary:
				//		Called after instantiation, but before set();
				//		It allows modification of any of the object properties -
				//		including the node and content provided - before the set operation actually takes place
				//		This default implementation checks for cleanContent and extractContent flags to
				//		optionally pre-process html string content
				var cont = this.content;

				if(lang.isString(cont)){
					if(this.cleanContent){
						cont = html._secureForInnerHtml(cont);
					}

					if(this.extractContent){
						var match = cont.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
						if(match){ cont = match[1]; }
					}
				}

				// clean out the node and any cruft associated with it - like widgets
				this.empty();

				this.content = cont;
				return this.node; // DomNode
			},

			onEnd: function(){
				// summary:
				//		Called after set(), when the new content has been pushed into the node
				//		It provides an opportunity for post-processing before handing back the node to the caller
				//		This default implementation checks a parseContent flag to optionally run the dojo parser over the new content
				if(this.parseContent){
					// populates this.parseResults and this.parseDeferred if you need those..
					this._parse();
				}
				return this.node; // DomNode
				// TODO: for 2.0 return a Promise indicating that the parse completed.
			},

			tearDown: function(){
				// summary:
				//		manually reset the Setter instance if its being re-used for example for another set()
				// description:
				//		tearDown() is not called automatically.
				//		In normal use, the Setter instance properties are simply allowed to fall out of scope
				//		but the tearDown method can be called to explicitly reset this instance.
				delete this.parseResults;
				delete this.parseDeferred;
				delete this.node;
				delete this.content;
			},

			onContentError: function(err){
				return "Error occurred setting content: " + err;
			},

			onExecError: function(err){
				return "Error occurred executing scripts: " + err;
			},

			_mixin: function(params){
				// mix properties/methods into the instance
				// TODO: the intention with tearDown is to put the Setter's state
				// back to that of the original constructor (vs. deleting/resetting everything regardless of ctor params)
				// so we could do something here to move the original properties aside for later restoration
				var empty = {}, key;
				for(key in params){
					if(key in empty){ continue; }
					// TODO: here's our opportunity to mask the properties we don't consider configurable/overridable
					// .. but history shows we'll almost always guess wrong
					this[key] = params[key];
				}
			},
			_parse: function(){
				// summary:
				//		runs the dojo parser over the node contents, storing any results in this.parseResults
				//		and the parse promise in this.parseDeferred
				//		Any errors resulting from parsing are passed to _onError for handling

				var rootNode = this.node;
				try{
					// store the results (widgets, whatever) for potential retrieval
					var inherited = {};
					darray.forEach(["dir", "lang", "textDir"], function(name){
						if(this[name]){
							inherited[name] = this[name];
						}
					}, this);
					var self = this;
					this.parseDeferred = parser.parse({
						rootNode: rootNode,
						noStart: !this.startup,
						inherited: inherited,
						scope: this.parserScope
					}).then(function(results){
						return self.parseResults = results;
					}, function(e){
						self._onError('Content', e, "Error parsing in _ContentSetter#" + this.id);
					});
				}catch(e){
					this._onError('Content', e, "Error parsing in _ContentSetter#" + this.id);
				}
			},

			_onError: function(type, err, consoleText){
				// summary:
				//		shows user the string that is returned by on[type]Error
				//		override/implement on[type]Error and return your own string to customize
				var errText = this['on' + type + 'Error'].call(this, err);
				if(consoleText){
					console.error(consoleText, err);
				}else if(errText){ // a empty string won't change current content
					html._setNodeContent(this.node, errText, true);
				}
			}
	}); // end declare()

	html.set = function(/*DomNode*/ node, /*String|DomNode|NodeList*/ cont, /*Object?*/ params){
			// summary:
			//		inserts (replaces) the given content into the given node. dojo.place(cont, node, "only")
			//		may be a better choice for simple HTML insertion.
			// description:
			//		Unless you need to use the params capabilities of this method, you should use
			//		dojo.place(cont, node, "only"). dojo.place() has more robust support for injecting
			//		an HTML string into the DOM, but it only handles inserting an HTML string as DOM
			//		elements, or inserting a DOM node. dojo.place does not handle NodeList insertions
			//		or the other capabilities as defined by the params object for this method.
			// node:
			//		the parent element that will receive the content
			// cont:
			//		the content to be set on the parent element.
			//		This can be an html string, a node reference or a NodeList, dojo/NodeList, Array or other enumerable list of nodes
			// params:
			//		Optional flags/properties to configure the content-setting. See dojo/html/_ContentSetter
			// example:
			//		A safe string/node/nodelist content replacement/injection with hooks for extension
			//		Example Usage:
			//	|	html.set(node, "some string");
			//	|	html.set(node, contentNode, {options});
			//	|	html.set(node, myNode.childNodes, {options});
		if(undefined == cont){
			console.warn("dojo.html.set: no cont argument provided, using empty string");
			cont = "";
		}
		if(!params){
			// simple and fast
			return html._setNodeContent(node, cont, true);
		}else{
			// more options but slower
			// note the arguments are reversed in order, to match the convention for instantiation via the parser
			var op = new html._ContentSetter(lang.mixin(
					params,
					{ content: cont, node: node }
			));
			return op.set();
		}
	};

	return html;
});

},
'dojo/parser':function(){
define([
	"require", "./_base/kernel", "./_base/lang", "./_base/array", "./_base/config", "./dom", "./_base/window",
		"./_base/url", "./aspect", "./promise/all", "./date/stamp", "./Deferred", "./has", "./query", "./on", "./ready"
], function(require, dojo, dlang, darray, config, dom, dwindow, _Url, aspect, all, dates, Deferred, has, query, don, ready){

	// module:
	//		dojo/parser

	new Date("X"); // workaround for #11279, new Date("") == NaN

	// data-dojo-props etc. is not restricted to JSON, it can be any javascript
	function myEval(text){
		return eval("(" + text + ")");
	}

	// Widgets like BorderContainer add properties to _Widget via dojo.extend().
	// If BorderContainer is loaded after _Widget's parameter list has been cached,
	// we need to refresh that parameter list (for _Widget and all widgets that extend _Widget).
	var extendCnt = 0;
	aspect.after(dlang, "extend", function(){
		extendCnt++;
	}, true);

	function getNameMap(ctor){
		// summary:
		//		Returns map from lowercase name to attribute name in class, ex: {onclick: "onClick"}
		var map = ctor._nameCaseMap, proto = ctor.prototype;

		// Create the map if it's undefined.
		// Refresh the map if a superclass was possibly extended with new methods since the map was created.
		if(!map || map._extendCnt < extendCnt){
			map = ctor._nameCaseMap = {};
			for(var name in proto){
				if(name.charAt(0) === "_"){
					continue;
				}	// skip internal properties
				map[name.toLowerCase()] = name;
			}
			map._extendCnt = extendCnt;
		}
		return map;
	}

	// Map from widget name or list of widget names(ex: "dijit/form/Button,acme/MyMixin") to a constructor.
	var _ctorMap = {};

	function getCtor(/*String[]*/ types, /*Function?*/ contextRequire){
		// summary:
		//		Retrieves a constructor.  If the types array contains more than one class/MID then the
		//		subsequent classes will be mixed into the first class and a unique constructor will be
		//		returned for that array.

		var ts = types.join();
		if(!_ctorMap[ts]){
			var mixins = [];
			for(var i = 0, l = types.length; i < l; i++){
				var t = types[i];
				// TODO: Consider swapping getObject and require in the future
				mixins[mixins.length] = (_ctorMap[t] = _ctorMap[t] || (dlang.getObject(t) || (~t.indexOf('/') &&
					(contextRequire ? contextRequire(t) : require(t)))));
			}
			var ctor = mixins.shift();
			_ctorMap[ts] = mixins.length ? (ctor.createSubclass ? ctor.createSubclass(mixins) : ctor.extend.apply(ctor, mixins)) : ctor;
		}

		return _ctorMap[ts];
	}

	var parser = {
		// summary:
		//		The Dom/Widget parsing package

		_clearCache: function(){
			// summary:
			//		Clear cached data.   Used mainly for benchmarking.
			extendCnt++;
			_ctorMap = {};
		},

		_functionFromScript: function(script, attrData){
			// summary:
			//		Convert a `<script type="dojo/method" args="a, b, c"> ... </script>`
			//		into a function
			// script: DOMNode
			//		The `<script>` DOMNode
			// attrData: String
			//		For HTML5 compliance, searches for attrData + "args" (typically
			//		"data-dojo-args") instead of "args"
			var preamble = "",
				suffix = "",
				argsStr = (script.getAttribute(attrData + "args") || script.getAttribute("args")),
				withStr = script.getAttribute("with");

			// Convert any arguments supplied in script tag into an array to be passed to the
			var fnArgs = (argsStr || "").split(/\s*,\s*/);

			if(withStr && withStr.length){
				darray.forEach(withStr.split(/\s*,\s*/), function(part){
					preamble += "with(" + part + "){";
					suffix += "}";
				});
			}

			return new Function(fnArgs, preamble + script.innerHTML + suffix);
		},

		instantiate: function(nodes, mixin, options){
			// summary:
			//		Takes array of nodes, and turns them into class instances and
			//		potentially calls a startup method to allow them to connect with
			//		any children.
			// nodes: Array
			//		Array of DOM nodes
			// mixin: Object?
			//		An object that will be mixed in with each node in the array.
			//		Values in the mixin will override values in the node, if they
			//		exist.
			// options: Object?
			//		An object used to hold kwArgs for instantiation.
			//		See parse.options argument for details.
			// returns:
			//		Array of instances.

			mixin = mixin || {};
			options = options || {};

			var dojoType = (options.scope || dojo._scopeName) + "Type", // typically "dojoType"
				attrData = "data-" + (options.scope || dojo._scopeName) + "-", // typically "data-dojo-"
				dataDojoType = attrData + "type", // typically "data-dojo-type"
				dataDojoMixins = attrData + "mixins";					// typically "data-dojo-mixins"

			var list = [];
			darray.forEach(nodes, function(node){
				var type = dojoType in mixin ? mixin[dojoType] : node.getAttribute(dataDojoType) || node.getAttribute(dojoType);
				if(type){
					var mixinsValue = node.getAttribute(dataDojoMixins),
						types = mixinsValue ? [type].concat(mixinsValue.split(/\s*,\s*/)) : [type];

					list.push({
						node: node,
						types: types
					});
				}
			});

			// Instantiate the nodes and return the list of instances.
			return this._instantiate(list, mixin, options);
		},

		_instantiate: function(nodes, mixin, options, returnPromise){
			// summary:
			//		Takes array of objects representing nodes, and turns them into class instances and
			//		potentially calls a startup method to allow them to connect with
			//		any children.
			// nodes: Array
			//		Array of objects like
			//	|		{
			//	|			ctor: Function (may be null)
			//	|			types: ["dijit/form/Button", "acme/MyMixin"] (used if ctor not specified)
			//	|			node: DOMNode,
			//	|			scripts: [ ... ],	// array of <script type="dojo/..."> children of node
			//	|			inherited: { ... }	// settings inherited from ancestors like dir, theme, etc.
			//	|		}
			// mixin: Object
			//		An object that will be mixed in with each node in the array.
			//		Values in the mixin will override values in the node, if they
			//		exist.
			// options: Object
			//		An options object used to hold kwArgs for instantiation.
			//		See parse.options argument for details.
			// returnPromise: Boolean
			//		Return a Promise rather than the instance; supports asynchronous widget creation.
			// returns:
			//		Array of instances, or if returnPromise is true, a promise for array of instances
			//		that resolves when instances have finished initializing.

			// Call widget constructors.   Some may be asynchronous and return promises.
			var thelist = darray.map(nodes, function(obj){
				var ctor = obj.ctor || getCtor(obj.types, options.contextRequire);
				// If we still haven't resolved a ctor, it is fatal now
				if(!ctor){
					throw new Error("Unable to resolve constructor for: '" + obj.types.join() + "'");
				}
				return this.construct(ctor, obj.node, mixin, options, obj.scripts, obj.inherited);
			}, this);

			// After all widget construction finishes, call startup on each top level instance if it makes sense (as for
			// widgets).  Parent widgets will recursively call startup on their (non-top level) children
			function onConstruct(thelist){
				if(!mixin._started && !options.noStart){
					darray.forEach(thelist, function(instance){
						if(typeof instance.startup === "function" && !instance._started){
							instance.startup();
						}
					});
				}

				return thelist;
			}

			if(returnPromise){
				return all(thelist).then(onConstruct);
			}else{
				// Back-compat path, remove for 2.0
				return onConstruct(thelist);
			}
		},

		construct: function(ctor, node, mixin, options, scripts, inherited){
			// summary:
			//		Calls new ctor(params, node), where params is the hash of parameters specified on the node,
			//		excluding data-dojo-type and data-dojo-mixins.   Does not call startup().
			// ctor: Function
			//		Widget constructor.
			// node: DOMNode
			//		This node will be replaced/attached to by the widget.  It also specifies the arguments to pass to ctor.
			// mixin: Object?
			//		Attributes in this object will be passed as parameters to ctor,
			//		overriding attributes specified on the node.
			// options: Object?
			//		An options object used to hold kwArgs for instantiation.   See parse.options argument for details.
			// scripts: DomNode[]?
			//		Array of `<script type="dojo/*">` DOMNodes.  If not specified, will search for `<script>` tags inside node.
			// inherited: Object?
			//		Settings from dir=rtl or lang=... on a node above this node.   Overrides options.inherited.
			// returns:
			//		Instance or Promise for the instance, if markupFactory() itself returned a promise

			var proto = ctor && ctor.prototype;
			options = options || {};

			// Setup hash to hold parameter settings for this widget.	Start with the parameter
			// settings inherited from ancestors ("dir" and "lang").
			// Inherited setting may later be overridden by explicit settings on node itself.
			var params = {};

			if(options.defaults){
				// settings for the document itself (or whatever subtree is being parsed)
				dlang.mixin(params, options.defaults);
			}
			if(inherited){
				// settings from dir=rtl or lang=... on a node above this node
				dlang.mixin(params, inherited);
			}

			// Get list of attributes explicitly listed in the markup
			var attributes;
			if(has("dom-attributes-explicit")){
				// Standard path to get list of user specified attributes
				attributes = node.attributes;
			}else if(has("dom-attributes-specified-flag")){
				// Special processing needed for IE8, to skip a few faux values in attributes[]
				attributes = darray.filter(node.attributes, function(a){
					return a.specified;
				});
			}else{
				// Special path for IE6-7, avoid (sometimes >100) bogus entries in node.attributes
				var clone = /^input$|^img$/i.test(node.nodeName) ? node : node.cloneNode(false),
					attrs = clone.outerHTML.replace(/=[^\s"']+|="[^"]*"|='[^']*'/g, "").replace(/^\s*<[a-zA-Z0-9]*\s*/, "").replace(/\s*>.*$/, "");

				attributes = darray.map(attrs.split(/\s+/), function(name){
					var lcName = name.toLowerCase();
					return {
						name: name,
						// getAttribute() doesn't work for button.value, returns innerHTML of button.
						// but getAttributeNode().value doesn't work for the form.encType or li.value
						value: (node.nodeName == "LI" && name == "value") || lcName == "enctype" ?
							node.getAttribute(lcName) : node.getAttributeNode(lcName).value
					};
				});
			}

			// Hash to convert scoped attribute name (ex: data-dojo17-params) to something friendly (ex: data-dojo-params)
			// TODO: remove scope for 2.0
			var scope = options.scope || dojo._scopeName,
				attrData = "data-" + scope + "-", // typically "data-dojo-"
				hash = {};
			if(scope !== "dojo"){
				hash[attrData + "props"] = "data-dojo-props";
				hash[attrData + "type"] = "data-dojo-type";
				hash[attrData + "mixins"] = "data-dojo-mixins";
				hash[scope + "type"] = "dojoType";
				hash[attrData + "id"] = "data-dojo-id";
			}

			// Read in attributes and process them, including data-dojo-props, data-dojo-type,
			// dojoAttachPoint, etc., as well as normal foo=bar attributes.
			var i = 0, item, funcAttrs = [], jsname, extra;
			while(item = attributes[i++]){
				var name = item.name,
					lcName = name.toLowerCase(),
					value = item.value;

				switch(hash[lcName] || lcName){
				// Already processed, just ignore
				case "data-dojo-type":
				case "dojotype":
				case "data-dojo-mixins":
					break;

				// Data-dojo-props.   Save for later to make sure it overrides direct foo=bar settings
				case "data-dojo-props":
					extra = value;
					break;

				// data-dojo-id or jsId. TODO: drop jsId in 2.0
				case "data-dojo-id":
				case "jsid":
					jsname = value;
					break;

				// For the benefit of _Templated
				case "data-dojo-attach-point":
				case "dojoattachpoint":
					params.dojoAttachPoint = value;
					break;
				case "data-dojo-attach-event":
				case "dojoattachevent":
					params.dojoAttachEvent = value;
					break;

				// Special parameter handling needed for IE
				case "class":
					params["class"] = node.className;
					break;
				case "style":
					params["style"] = node.style && node.style.cssText;
					break;
				default:
					// Normal attribute, ex: value="123"

					// Find attribute in widget corresponding to specified name.
					// May involve case conversion, ex: onclick --> onClick
					if(!(name in proto)){
						var map = getNameMap(ctor);
						name = map[lcName] || name;
					}

					// Set params[name] to value, doing type conversion
					if(name in proto){
						switch(typeof proto[name]){
						case "string":
							params[name] = value;
							break;
						case "number":
							params[name] = value.length ? Number(value) : NaN;
							break;
						case "boolean":
							// for checked/disabled value might be "" or "checked".	 interpret as true.
							params[name] = value.toLowerCase() != "false";
							break;
						case "function":
							if(value === "" || value.search(/[^\w\.]+/i) != -1){
								// The user has specified some text for a function like "return x+5"
								params[name] = new Function(value);
							}else{
								// The user has specified the name of a global function like "myOnClick"
								// or a single word function "return"
								params[name] = dlang.getObject(value, false) || new Function(value);
							}
							funcAttrs.push(name);	// prevent "double connect", see #15026
							break;
						default:
							var pVal = proto[name];
							params[name] =
								(pVal && "length" in pVal) ? (value ? value.split(/\s*,\s*/) : []) :	// array
									(pVal instanceof Date) ?
										(value == "" ? new Date("") :	// the NaN of dates
										value == "now" ? new Date() :	// current date
										dates.fromISOString(value)) :
								(pVal instanceof _Url) ? (dojo.baseUrl + value) :
								myEval(value);
						}
					}else{
						params[name] = value;
					}
				}
			}

			// Remove function attributes from DOMNode to prevent "double connect" problem, see #15026.
			// Do this as a separate loop since attributes[] is often a live collection (depends on the browser though).
			for(var j = 0; j < funcAttrs.length; j++){
				var lcfname = funcAttrs[j].toLowerCase();
				node.removeAttribute(lcfname);
				node[lcfname] = null;
			}

			// Mix things found in data-dojo-props into the params, overriding any direct settings
			if(extra){
				try{
					extra = myEval.call(options.propsThis, "{" + extra + "}");
					dlang.mixin(params, extra);
				}catch(e){
					// give the user a pointer to their invalid parameters. FIXME: can we kill this in production?
					throw new Error(e.toString() + " in data-dojo-props='" + extra + "'");
				}
			}

			// Any parameters specified in "mixin" override everything else.
			dlang.mixin(params, mixin);

			// Get <script> nodes associated with this widget, if they weren't specified explicitly
			if(!scripts){
				scripts = (ctor && (ctor._noScript || proto._noScript) ? [] : query("> script[type^='dojo/']", node));
			}

			// Process <script type="dojo/*"> script tags
			// <script type="dojo/method" data-dojo-event="foo"> tags are added to params, and passed to
			// the widget on instantiation.
			// <script type="dojo/method"> tags (with no event) are executed after instantiation
			// <script type="dojo/connect" data-dojo-event="foo"> tags are dojo.connected after instantiation,
			// and likewise with <script type="dojo/aspect" data-dojo-method="foo">
			// <script type="dojo/watch" data-dojo-prop="foo"> tags are dojo.watch after instantiation
			// <script type="dojo/on" data-dojo-event="foo"> tags are dojo.on after instantiation
			// note: dojo/* script tags cannot exist in self closing widgets, like <input />
			var aspects = [],	// aspects to connect after instantiation
				calls = [],		// functions to call after instantiation
				watches = [],  // functions to watch after instantiation
				ons = []; // functions to on after instantiation

			if(scripts){
				for(i = 0; i < scripts.length; i++){
					var script = scripts[i];
					node.removeChild(script);
					// FIXME: drop event="" support in 2.0. use data-dojo-event="" instead
					var event = (script.getAttribute(attrData + "event") || script.getAttribute("event")),
						prop = script.getAttribute(attrData + "prop"),
						method = script.getAttribute(attrData + "method"),
						advice = script.getAttribute(attrData + "advice"),
						scriptType = script.getAttribute("type"),
						nf = this._functionFromScript(script, attrData);
					if(event){
						if(scriptType == "dojo/connect"){
							aspects.push({ method: event, func: nf });
						}else if(scriptType == "dojo/on"){
							ons.push({ event: event, func: nf });
						}else{
							// <script type="dojo/method" data-dojo-event="foo">
							// TODO for 2.0: use data-dojo-method="foo" instead (also affects dijit/Declaration)
							params[event] = nf;
						}
					}else if(scriptType == "dojo/aspect"){
						aspects.push({ method: method, advice: advice, func: nf });
					}else if(scriptType == "dojo/watch"){
						watches.push({ prop: prop, func: nf });
					}else{
						calls.push(nf);
					}
				}
			}

			// create the instance
			var markupFactory = ctor.markupFactory || proto.markupFactory;
			var instance = markupFactory ? markupFactory(params, node, ctor) : new ctor(params, node);

			function onInstantiate(instance){
				// map it to the JS namespace if that makes sense
				if(jsname){
					dlang.setObject(jsname, instance);
				}

				// process connections and startup functions
				for(i = 0; i < aspects.length; i++){
					aspect[aspects[i].advice || "after"](instance, aspects[i].method, dlang.hitch(instance, aspects[i].func), true);
				}
				for(i = 0; i < calls.length; i++){
					calls[i].call(instance);
				}
				for(i = 0; i < watches.length; i++){
					instance.watch(watches[i].prop, watches[i].func);
				}
				for(i = 0; i < ons.length; i++){
					don(instance, ons[i].event, ons[i].func);
				}

				return instance;
			}

			if(instance.then){
				return instance.then(onInstantiate);
			}else{
				return onInstantiate(instance);
			}
		},

		scan: function(root, options){
			// summary:
			//		Scan a DOM tree and return an array of objects representing the DOMNodes
			//		that need to be turned into widgets.
			// description:
			//		Search specified node (or document root node) recursively for class instances
			//		and return an array of objects that represent potential widgets to be
			//		instantiated. Searches for either data-dojo-type="MID" or dojoType="MID" where
			//		"MID" is a module ID like "dijit/form/Button" or a fully qualified Class name
			//		like "dijit/form/Button".  If the MID is not currently available, scan will
			//		attempt to require() in the module.
			//
			//		See parser.parse() for details of markup.
			// root: DomNode?
			//		A default starting root node from which to start the parsing. Can be
			//		omitted, defaulting to the entire document. If omitted, the `options`
			//		object can be passed in this place. If the `options` object has a
			//		`rootNode` member, that is used.
			// options: Object
			//		a kwArgs options object, see parse() for details
			//
			// returns: Promise
			//		A promise that is resolved with the nodes that have been parsed.

			var list = [], // Output List
				mids = [], // An array of modules that are not yet loaded
				midsHash = {}; // Used to keep the mids array unique

			var dojoType = (options.scope || dojo._scopeName) + "Type", // typically "dojoType"
				attrData = "data-" + (options.scope || dojo._scopeName) + "-", // typically "data-dojo-"
				dataDojoType = attrData + "type", // typically "data-dojo-type"
				dataDojoTextDir = attrData + "textdir", // typically "data-dojo-textdir"
				dataDojoMixins = attrData + "mixins";					// typically "data-dojo-mixins"

			// Info on DOMNode currently being processed
			var node = root.firstChild;

			// Info on parent of DOMNode currently being processed
			//	- inherited: dir, lang, and textDir setting of parent, or inherited by parent
			//	- parent: pointer to identical structure for my parent (or null if no parent)
			//	- scripts: if specified, collects <script type="dojo/..."> type nodes from children
			var inherited = options.inherited;
			if(!inherited){
				function findAncestorAttr(node, attr){
					return (node.getAttribute && node.getAttribute(attr)) ||
						(node.parentNode && findAncestorAttr(node.parentNode, attr));
				}

				inherited = {
					dir: findAncestorAttr(root, "dir"),
					lang: findAncestorAttr(root, "lang"),
					textDir: findAncestorAttr(root, dataDojoTextDir)
				};
				for(var key in inherited){
					if(!inherited[key]){
						delete inherited[key];
					}
				}
			}

			// Metadata about parent node
			var parent = {
				inherited: inherited
			};

			// For collecting <script type="dojo/..."> type nodes (when null, we don't need to collect)
			var scripts;

			// when true, only look for <script type="dojo/..."> tags, and don't recurse to children
			var scriptsOnly;

			function getEffective(parent){
				// summary:
				//		Get effective dir, lang, textDir settings for specified obj
				//		(matching "parent" object structure above), and do caching.
				//		Take care not to return null entries.
				if(!parent.inherited){
					parent.inherited = {};
					var node = parent.node,
						grandparent = getEffective(parent.parent);
					var inherited = {
						dir: node.getAttribute("dir") || grandparent.dir,
						lang: node.getAttribute("lang") || grandparent.lang,
						textDir: node.getAttribute(dataDojoTextDir) || grandparent.textDir
					};
					for(var key in inherited){
						if(inherited[key]){
							parent.inherited[key] = inherited[key];
						}
					}
				}
				return parent.inherited;
			}

			// DFS on DOM tree, collecting nodes with data-dojo-type specified.
			while(true){
				if(!node){
					// Finished this level, continue to parent's next sibling
					if(!parent || !parent.node){
						break;
					}
					node = parent.node.nextSibling;
					scriptsOnly = false;
					parent = parent.parent;
					scripts = parent.scripts;
					continue;
				}

				if(node.nodeType != 1){
					// Text or comment node, skip to next sibling
					node = node.nextSibling;
					continue;
				}

				if(scripts && node.nodeName.toLowerCase() == "script"){
					// Save <script type="dojo/..."> for parent, then continue to next sibling
					type = node.getAttribute("type");
					if(type && /^dojo\/\w/i.test(type)){
						scripts.push(node);
					}
					node = node.nextSibling;
					continue;
				}
				if(scriptsOnly){
					// scriptsOnly flag is set, we have already collected scripts if the parent wants them, so now we shouldn't
					// continue further analysis of the node and will continue to the next sibling
					node = node.nextSibling;
					continue;
				}

				// Check for data-dojo-type attribute, fallback to backward compatible dojoType
				// TODO: Remove dojoType in 2.0
				var type = node.getAttribute(dataDojoType) || node.getAttribute(dojoType);

				// Short circuit for leaf nodes containing nothing [but text]
				var firstChild = node.firstChild;
				if(!type && (!firstChild || (firstChild.nodeType == 3 && !firstChild.nextSibling))){
					node = node.nextSibling;
					continue;
				}

				// Meta data about current node
				var current;

				var ctor = null;
				if(type){
					// If dojoType/data-dojo-type specified, add to output array of nodes to instantiate.
					var mixinsValue = node.getAttribute(dataDojoMixins),
						types = mixinsValue ? [type].concat(mixinsValue.split(/\s*,\s*/)) : [type];

					// Note: won't find classes declared via dojo/Declaration or any modules that haven't been
					// loaded yet so use try/catch to avoid throw from require()
					try{
						ctor = getCtor(types, options.contextRequire);
					}catch(e){}

					// If the constructor was not found, check to see if it has modules that can be loaded
					if(!ctor){
						darray.forEach(types, function(t){
							if(~t.indexOf('/') && !midsHash[t]){
								// If the type looks like a MID and it currently isn't in the array of MIDs to load, add it.
								midsHash[t] = true;
								mids[mids.length] = t;
							}
						});
					}

					var childScripts = ctor && !ctor.prototype._noScript ? [] : null; // <script> nodes that are parent's children

					// Setup meta data about this widget node, and save it to list of nodes to instantiate
					current = {
						types: types,
						ctor: ctor,
						parent: parent,
						node: node,
						scripts: childScripts
					};
					current.inherited = getEffective(current); // dir & lang settings for current node, explicit or inherited
					list.push(current);
				}else{
					// Meta data about this non-widget node
					current = {
						node: node,
						scripts: scripts,
						parent: parent
					};
				}

				// Recurse, collecting <script type="dojo/..."> children, and also looking for
				// descendant nodes with dojoType specified (unless the widget has the stopParser flag).
				// When finished with children, go to my next sibling.
				scripts = childScripts;
				scriptsOnly = node.stopParser || (ctor && ctor.prototype.stopParser && !(options.template));
				parent = current;
				node = firstChild;
			}

			var d = new Deferred();

			// If there are modules to load then require them in
			if(mids.length){
				// Warn that there are modules being auto-required
				if(has("dojo-debug-messages")){
					console.warn("WARNING: Modules being Auto-Required: " + mids.join(", "));
				}
				var r = options.contextRequire || require;
				r(mids, function(){
					// Go through list of widget nodes, filling in missing constructors, and filtering out nodes that shouldn't
					// be instantiated due to a stopParser flag on an ancestor that we belatedly learned about due to
					// auto-require of a module like ContentPane.   Assumes list is in DFS order.
					d.resolve(darray.filter(list, function(widget){
						if(!widget.ctor){
							// Attempt to find the constructor again.   Still won't find classes defined via
							// dijit/Declaration so need to try/catch.
							try{
								widget.ctor = getCtor(widget.types, options.contextRequire);
							}catch(e){}
						}

						// Get the parent widget
						var parent = widget.parent;
						while(parent && !parent.types){
							parent = parent.parent;
						}

						// Return false if this node should be skipped due to stopParser on an ancestor.
						// Since list[] is in DFS order, this loop will always set parent.instantiateChildren before
						// trying to compute widget.instantiate.
						var proto = widget.ctor && widget.ctor.prototype;
						widget.instantiateChildren = !(proto && proto.stopParser && !(options.template));
						widget.instantiate = !parent || (parent.instantiate && parent.instantiateChildren);
						return widget.instantiate;
					}));
				});
			}else{
				// There were no modules to load, so just resolve with the parsed nodes.   This separate code path is for
				// efficiency, to avoid running the require() and the callback code above.
				d.resolve(list);
			}

			// Return the promise
			return d.promise;
		},

		_require: function(/*DOMNode*/ script, /*Object?*/ options){
			// summary:
			//		Helper for _scanAMD().  Takes a `<script type=dojo/require>bar: "acme/bar", ...</script>` node,
			//		calls require() to load the specified modules and (asynchronously) assign them to the specified global
			//		variables, and returns a Promise for when that operation completes.
			//
			//		In the example above, it is effectively doing a require(["acme/bar", ...], function(a){ bar = a; }).

			var hash = myEval("{" + script.innerHTML + "}"), // can't use dojo/json::parse() because maybe no quotes
				vars = [],
				mids = [],
				d = new Deferred();

			var contextRequire = (options && options.contextRequire) || require;

			for(var name in hash){
				vars.push(name);
				mids.push(hash[name]);
			}

			contextRequire(mids, function(){
				for(var i = 0; i < vars.length; i++){
					dlang.setObject(vars[i], arguments[i]);
				}
				d.resolve(arguments);
			});

			return d.promise;
		},

		_scanAmd: function(root, options){
			// summary:
			//		Scans the DOM for any declarative requires and returns their values.
			// description:
			//		Looks for `<script type=dojo/require>bar: "acme/bar", ...</script>` node, calls require() to load the
			//		specified modules and (asynchronously) assign them to the specified global variables,
			//		and returns a Promise for when those operations complete.
			// root: DomNode
			//		The node to base the scan from.
			// options: Object?
			//		a kwArgs options object, see parse() for details

			// Promise that resolves when all the <script type=dojo/require> nodes have finished loading.
			var deferred = new Deferred(),
				promise = deferred.promise;
			deferred.resolve(true);

			var self = this;
			query("script[type='dojo/require']", root).forEach(function(node){
				// Fire off require() call for specified modules.  Chain this require to fire after
				// any previous requires complete, so that layers can be loaded before individual module require()'s fire.
				promise = promise.then(function(){
					return self._require(node, options);
				});

				// Remove from DOM so it isn't seen again
				node.parentNode.removeChild(node);
			});

			return promise;
		},

		parse: function(rootNode, options){
			// summary:
			//		Scan the DOM for class instances, and instantiate them.
			// description:
			//		Search specified node (or root node) recursively for class instances,
			//		and instantiate them. Searches for either data-dojo-type="Class" or
			//		dojoType="Class" where "Class" is a a fully qualified class name,
			//		like `dijit/form/Button`
			//
			//		Using `data-dojo-type`:
			//		Attributes using can be mixed into the parameters used to instantiate the
			//		Class by using a `data-dojo-props` attribute on the node being converted.
			//		`data-dojo-props` should be a string attribute to be converted from JSON.
			//
			//		Using `dojoType`:
			//		Attributes are read from the original domNode and converted to appropriate
			//		types by looking up the Class prototype values. This is the default behavior
			//		from Dojo 1.0 to Dojo 1.5. `dojoType` support is deprecated, and will
			//		go away in Dojo 2.0.
			// rootNode: DomNode?
			//		A default starting root node from which to start the parsing. Can be
			//		omitted, defaulting to the entire document. If omitted, the `options`
			//		object can be passed in this place. If the `options` object has a
			//		`rootNode` member, that is used.
			// options: Object?
			//		A hash of options.
			//
			//		- noStart: Boolean?:
			//			when set will prevent the parser from calling .startup()
			//			when locating the nodes.
			//		- rootNode: DomNode?:
			//			identical to the function's `rootNode` argument, though
			//			allowed to be passed in via this `options object.
			//		- template: Boolean:
			//			If true, ignores ContentPane's stopParser flag and parses contents inside of
			//			a ContentPane inside of a template.   This allows dojoAttachPoint on widgets/nodes
			//			nested inside the ContentPane to work.
			//		- inherited: Object:
			//			Hash possibly containing dir and lang settings to be applied to
			//			parsed widgets, unless there's another setting on a sub-node that overrides
			//		- scope: String:
			//			Root for attribute names to search for.   If scopeName is dojo,
			//			will search for data-dojo-type (or dojoType).   For backwards compatibility
			//			reasons defaults to dojo._scopeName (which is "dojo" except when
			//			multi-version support is used, when it will be something like dojo16, dojo20, etc.)
			//		- propsThis: Object:
			//			If specified, "this" referenced from data-dojo-props will refer to propsThis.
			//			Intended for use from the widgets-in-template feature of `dijit._WidgetsInTemplateMixin`
			//		- contextRequire: Function:
			//			If specified, this require is utilised for looking resolving modules instead of the
			//			`dojo/parser` context `require()`.  Intended for use from the widgets-in-template feature of
			//			`dijit._WidgetsInTemplateMixin`.
			// returns: Mixed
			//		Returns a blended object that is an array of the instantiated objects, but also can include
			//		a promise that is resolved with the instantiated objects.  This is done for backwards
			//		compatibility.  If the parser auto-requires modules, it will always behave in a promise
			//		fashion and `parser.parse().then(function(instances){...})` should be used.
			// example:
			//		Parse all widgets on a page:
			//	|		parser.parse();
			// example:
			//		Parse all classes within the node with id="foo"
			//	|		parser.parse(dojo.byId('foo'));
			// example:
			//		Parse all classes in a page, but do not call .startup() on any
			//		child
			//	|		parser.parse({ noStart: true })
			// example:
			//		Parse all classes in a node, but do not call .startup()
			//	|		parser.parse(someNode, { noStart:true });
			//	|		// or
			//	|		parser.parse({ noStart:true, rootNode: someNode });

			// determine the root node and options based on the passed arguments.
			var root;
			if(!options && rootNode && rootNode.rootNode){
				options = rootNode;
				root = options.rootNode;
			}else if(rootNode && dlang.isObject(rootNode) && !("nodeType" in rootNode)){
				options = rootNode;
			}else{
				root = rootNode;
			}
			root = root ? dom.byId(root) : dwindow.body();

			options = options || {};

			var mixin = options.template ? { template: true } : {},
				instances = [],
				self = this;

			// First scan for any <script type=dojo/require> nodes, and execute.
			// Then scan for all nodes with data-dojo-type, and load any unloaded modules.
			// Then build the object instances.  Add instances to already existing (but empty) instances[] array,
			// which may already have been returned to caller.  Also, use otherwise to collect and throw any errors
			// that occur during the parse().
			var p =
				this._scanAmd(root, options).then(function(){
					return self.scan(root, options);
				}).then(function(parsedNodes){
					return self._instantiate(parsedNodes, mixin, options, true);
				}).then(function(_instances){
					// Copy the instances into the instances[] array we declared above, and are accessing as
					// our return value.
					return instances = instances.concat(_instances);
				}).otherwise(function(e){
					// TODO Modify to follow better pattern for promise error management when available
					console.error("dojo/parser::parse() error", e);
					throw e;
				});

			// Blend the array with the promise
			dlang.mixin(instances, p);
			return instances;
		}
	};

	if( 1 ){
		dojo.parser = parser;
	}

	// Register the parser callback. It should be the first callback
	// after the a11y test.
	if(config.parseOnLoad){
		ready(100, parser, "parse");
	}

	return parser;
});

},
'dijit/form/DateTextBox':function(){
define([
	"dojo/_base/declare", // declare
	"../Calendar",
	"./_DateTimeTextBox"
], function(declare, Calendar, _DateTimeTextBox){

	// module:
	//		dijit/form/DateTextBox

	return declare("dijit.form.DateTextBox", _DateTimeTextBox, {
		// summary:
		//		A validating, serializable, range-bound date text box with a drop down calendar
		// example:
		// |	new DateTextBox({value: new Date(2009, 0, 20)})
		// example:
		// |	<input data-dojo-type='dijit/form/DateTextBox' value='2009-01-20'>

		baseClass: "dijitTextBox dijitComboBox dijitDateTextBox",
		popupClass: Calendar,
		_selector: "date",

		// Prevent scrollbar on Calendar dropdown.  On iPad it often gets a scrollbar unnecessarily because Viewport
		// thinks the keyboard is showing.  Even if the keyboard is showing, it disappears when the calendar gets focus.
		maxHeight: Infinity,

		// value: Date
		//		The value of this widget as a JavaScript Date object, with only year/month/day specified.
		//		If specified in markup, use the format specified in `stamp.fromISOString`.
		//		set("value", ...) accepts either a Date object or a string.
		value: new Date("")	// value.toString()="NaN"
	});
});

},
'dijit/form/_DateTimeTextBox':function(){
define([
	"dojo/date", // date date.compare
	"dojo/date/locale", // locale.regexp
	"dojo/date/stamp", // stamp.fromISOString stamp.toISOString
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.getObject
	"./RangeBoundTextBox",
	"../_HasDropDown",
	"dojo/text!./templates/DropDownBox.html"
], function(date, locale, stamp, declare, lang, RangeBoundTextBox, _HasDropDown, template){

	// module:
	//		dijit/form/_DateTimeTextBox

	new Date("X"); // workaround for #11279, new Date("") == NaN

	var _DateTimeTextBox = declare("dijit.form._DateTimeTextBox", [RangeBoundTextBox, _HasDropDown], {
		// summary:
		//		Base class for validating, serializable, range-bound date or time text box.

		templateString: template,

		// hasDownArrow: [const] Boolean
		//		Set this textbox to display a down arrow button, to open the drop down list.
		hasDownArrow: true,

		// Set classes like dijitDownArrowButtonHover depending on mouse action over button node
		cssStateNodes: {
			"_buttonNode": "dijitDownArrowButton"
		},

		/*=====
		// constraints: _DateTimeTextBox.__Constraints
		//		Despite the name, this parameter specifies both constraints on the input
		//		(including starting/ending dates/times allowed) as well as
		//		formatting options like whether the date is displayed in long (ex: December 25, 2005)
		//		or short (ex: 12/25/2005) format.  See `dijit/form/_DateTimeTextBox.__Constraints` for details.
		constraints: {},
		======*/

		// Override ValidationTextBox.pattern.... we use a reg-ex generating function rather
		// than a straight regexp to deal with locale  (plus formatting options too?)
		pattern: locale.regexp,

		// datePackage: String
		//		JavaScript namespace to find calendar routines.	 If unspecified, uses Gregorian calendar routines
		//		at dojo/date and dojo/date/locale.
		datePackage: "",
		//		TODO: for 2.0, replace datePackage with dateModule and dateLocalModule attributes specifying MIDs,
		//		or alternately just get rid of this completely and tell user to use module ID remapping
		//		via require

		postMixInProperties: function(){
			this.inherited(arguments);
			this._set("type", "text"); // in case type="date"|"time" was specified which messes up parse/format
		},

		// Override _FormWidget.compare() to work for dates/times
		compare: function(/*Date*/ val1, /*Date*/ val2){
			var isInvalid1 = this._isInvalidDate(val1);
			var isInvalid2 = this._isInvalidDate(val2);
			return isInvalid1 ? (isInvalid2 ? 0 : -1) : (isInvalid2 ? 1 : date.compare(val1, val2, this._selector));
		},

		// flag to _HasDropDown to make drop down Calendar width == <input> width
		autoWidth: true,

		format: function(/*Date*/ value, /*locale.__FormatOptions*/ constraints){
			// summary:
			//		Formats the value as a Date, according to specified locale (second argument)
			// tags:
			//		protected
			if(!value){ return ''; }
			return this.dateLocaleModule.format(value, constraints);
		},

		"parse": function(/*String*/ value, /*locale.__FormatOptions*/ constraints){
			// summary:
			//		Parses as string as a Date, according to constraints
			// tags:
			//		protected

			return this.dateLocaleModule.parse(value, constraints) || (this._isEmpty(value) ? null : undefined);	 // Date
		},

		// Overrides ValidationTextBox.serialize() to serialize a date in canonical ISO format.
		serialize: function(/*anything*/ val, /*Object?*/ options){
			if(val.toGregorian){
				val = val.toGregorian();
			}
			return stamp.toISOString(val, options);
		},

		// dropDownDefaultValue: Date
		//		The default value to focus in the popupClass widget when the textbox value is empty.
		dropDownDefaultValue : new Date(),

		// value: Date
		//		The value of this widget as a JavaScript Date object.  Use get("value") / set("value", val) to manipulate.
		//		When passed to the parser in markup, must be specified according to `dojo/date/stamp.fromISOString()`
		value: new Date(""),	// value.toString()="NaN"

		_blankValue: null,	// used by filter() when the textbox is blank

		// popupClass: [protected extension] String
		//		Name of the popup widget class used to select a date/time.
		//		Subclasses should specify this.
		popupClass: "", // default is no popup = text only


		// _selector: [protected extension] String
		//		Specifies constraints.selector passed to dojo.date functions, should be either
		//		"date" or "time".
		//		Subclass must specify this.
		_selector: "",

		constructor: function(params /*===== , srcNodeRef =====*/){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified, replace srcNodeRef with my generated DOM tree

			this.dateModule = params.datePackage ? lang.getObject(params.datePackage, false) : date;
			this.dateClassObj = this.dateModule.Date || Date;
			this.dateLocaleModule = params.datePackage ? lang.getObject(params.datePackage+".locale", false) : locale;
			this._set('pattern', this.dateLocaleModule.regexp);
			this._invalidDate = this.constructor.prototype.value.toString();
		},

		buildRendering: function(){
			this.inherited(arguments);

			if(!this.hasDownArrow){
				this._buttonNode.style.display = "none";
			}

			// If hasDownArrow is false, we basically just want to treat the whole widget as the
			// button.
			if(!this.hasDownArrow){
				this._buttonNode = this.domNode;
				this.baseClass += " dijitComboBoxOpenOnClick";
			}
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			constraints.selector = this._selector;
			constraints.fullYear = true; // see #5465 - always format with 4-digit years
			var fromISO = stamp.fromISOString;
			if(typeof constraints.min == "string"){ constraints.min = fromISO(constraints.min); }
			if(typeof constraints.max == "string"){ constraints.max = fromISO(constraints.max); }
			this.inherited(arguments);
		},

		_isInvalidDate: function(/*Date*/ value){
			// summary:
			//		Runs various tests on the value, checking for invalid conditions
			// tags:
			//		private
			return !value || isNaN(value) || typeof value != "object" || value.toString() == this._invalidDate;
		},

		_setValueAttr: function(/*Date|String*/ value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Sets the date on this textbox. Note: value can be a JavaScript Date literal or a string to be parsed.
			if(value !== undefined){
				if(typeof value == "string"){
					value = stamp.fromISOString(value);
				}
				if(this._isInvalidDate(value)){
					value = null;
				}
				if(value instanceof Date && !(this.dateClassObj instanceof Date)){
					value = new this.dateClassObj(value);
				}
			}
			this.inherited(arguments);
			if(this.value instanceof Date){
				this.filterString = "";
			}
			if(this.dropDown){
				this.dropDown.set('value', value, false);
			}
		},

		_set: function(attr, value){
			// Avoid spurious watch() notifications when value is changed to new Date object w/the same value
			var oldValue = this._get("value");
			if(attr == "value" && oldValue instanceof Date && this.compare(value, oldValue) == 0){
				return;
			}
			this.inherited(arguments);
		},

		_setDropDownDefaultValueAttr: function(/*Date*/ val){
			if(this._isInvalidDate(val)){
				// convert null setting into today's date, since there needs to be *some* default at all times.
				 val = new this.dateClassObj();
			}
			this._set("dropDownDefaultValue", val);
		},

		openDropDown: function(/*Function*/ callback){
			// rebuild drop down every time, so that constraints get copied (#6002)
			if(this.dropDown){
				this.dropDown.destroy();
			}
			var PopupProto = lang.isString(this.popupClass) ? lang.getObject(this.popupClass, false) : this.popupClass,
				textBox = this,
				value = this.get("value");
			this.dropDown = new PopupProto({
				onChange: function(value){
					// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
					textBox.set('value', value, true);
				},
				id: this.id + "_popup",
				dir: textBox.dir,
				lang: textBox.lang,
				value: value,
				textDir: textBox.textDir,
				currentFocus: !this._isInvalidDate(value) ? value : this.dropDownDefaultValue,
				constraints: textBox.constraints,
				filterString: textBox.filterString, // for TimeTextBox, to filter times shown
				datePackage: textBox.params.datePackage,
				isDisabledDate: function(/*Date*/ date){
					// summary:
					//		disables dates outside of the min/max of the _DateTimeTextBox
					return !textBox.rangeCheck(date, textBox.constraints);
				}
			});

			this.inherited(arguments);
		},

		_getDisplayedValueAttr: function(){
			return this.textbox.value;
		},

		_setDisplayedValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange){
			this._setValueAttr(this.parse(value, this.constraints), priorityChange, value);
		}
	});


	/*=====
	 _DateTimeTextBox.__Constraints = declare([RangeBoundTextBox.__Constraints, locale.__FormatOptions], {
		 // summary:
		 //		Specifies both the rules on valid/invalid values (first/last date/time allowed),
		 //		and also formatting options for how the date/time is displayed.
		 // example:
		 //		To restrict to dates within 2004, displayed in a long format like "December 25, 2005":
		 //	|		{min:'2004-01-01',max:'2004-12-31', formatLength:'long'}
	 });
	 =====*/

	return _DateTimeTextBox;
});

},
'dijit/form/RangeBoundTextBox':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/i18n", // i18n.getLocalization
	"./MappedTextBox",
	"dojo/i18n!./nls/validate"
], function(declare, i18n, MappedTextBox){

	// module:
	//		dijit/form/RangeBoundTextBox


	var RangeBoundTextBox = declare("dijit.form.RangeBoundTextBox", MappedTextBox, {
		// summary:
		//		Base class for textbox form widgets which defines a range of valid values.

		// rangeMessage: String
		//		The message to display if value is out-of-range
		rangeMessage: "",

		/*=====
		// constraints: RangeBoundTextBox.__Constraints
		constraints: {},
		======*/

		rangeCheck: function(/*Number*/ primitive, /*dijit/form/RangeBoundTextBox.__Constraints*/ constraints){
			// summary:
			//		Overridable function used to validate the range of the numeric input value.
			// tags:
			//		protected
			return	("min" in constraints? (this.compare(primitive,constraints.min) >= 0) : true) &&
				("max" in constraints? (this.compare(primitive,constraints.max) <= 0) : true); // Boolean
		},

		isInRange: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Tests if the value is in the min/max range specified in constraints
			// tags:
			//		protected
			return this.rangeCheck(this.get('value'), this.constraints);
		},

		_isDefinitelyOutOfRange: function(){
			// summary:
			//		Returns true if the value is out of range and will remain
			//		out of range even if the user types more characters
			var val = this.get('value');
			if(val == null){ return false; } // not yet valid enough to compare to
			var outOfRange = false;
			if("min" in this.constraints){
				var min = this.constraints.min;
				outOfRange = this.compare(val, ((typeof min == "number") && min >= 0 && val != 0) ? 0 : min) < 0;
			}
			if(!outOfRange && ("max" in this.constraints)){
				var max = this.constraints.max;
				outOfRange = this.compare(val, ((typeof max != "number") || max > 0) ? max : 0) > 0;
			}
			return outOfRange;
		},

		_isValidSubset: function(){
			// summary:
			//		Overrides `dijit/form/ValidationTextBox._isValidSubset()`.
			//		Returns true if the input is syntactically valid, and either within
			//		range or could be made in range by more typing.
			return this.inherited(arguments) && !this._isDefinitelyOutOfRange();
		},

		isValid: function(/*Boolean*/ isFocused){
			// Overrides dijit/form/ValidationTextBox.isValid() to check that the value is also in range.
			return this.inherited(arguments) &&
				((this._isEmpty(this.textbox.value) && !this.required) || this.isInRange(isFocused)); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ isFocused){
			// Overrides dijit/form/ValidationTextBox.getErrorMessage() to print "out of range" message if appropriate
			var v = this.get('value');
			if(v != null /* and !undefined */ && v !== '' && (typeof v != "number" || !isNaN(v)) && !this.isInRange(isFocused)){ // don't check isInRange w/o a real value
				return this.rangeMessage; // String
			}
			return this.inherited(arguments);
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			if(!this.rangeMessage){
				this.messages = i18n.getLocalization("dijit.form", "validate", this.lang);
				this.rangeMessage = this.messages.rangeMessage;
			}
		}
	});
	/*=====
	RangeBoundTextBox.__Constraints = declare(null, {
		// min: Number
		//		Minimum signed value.  Default is -Infinity
		// max: Number
		//		Maximum signed value.  Default is +Infinity
	});
	=====*/
	return RangeBoundTextBox;
});

},
'dijit/form/MappedTextBox':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/sniff", // has("msapp")
	"dojo/dom-construct", // domConstruct.place
	"./ValidationTextBox"
], function(declare, has, domConstruct, ValidationTextBox){

	// module:
	//		dijit/form/MappedTextBox

	return declare("dijit.form.MappedTextBox", ValidationTextBox, {
		// summary:
		//		A dijit/form/ValidationTextBox subclass which provides a base class for widgets that have
		//		a visible formatted display value, and a serializable
		//		value in a hidden input field which is actually sent to the server.
		// description:
		//		The visible display may
		//		be locale-dependent and interactive.  The value sent to the server is stored in a hidden
		//		input field which uses the `name` attribute declared by the original widget.  That value sent
		//		to the server is defined by the dijit/form/MappedTextBox.serialize() method and is typically
		//		locale-neutral.
		// tags:
		//		protected

		postMixInProperties: function(){
			this.inherited(arguments);

			// We want the name attribute to go to the hidden <input>, not the displayed <input>,
			// so override _FormWidget.postMixInProperties() setting of nameAttrSetting for IE.
			this.nameAttrSetting = "";
		},

		// Remap name attribute to be mapped to hidden node created in buildRendering(), rather than this.focusNode
		_setNameAttr: "valueNode",

		serialize: function(val /*=====, options =====*/){
			// summary:
			//		Overridable function used to convert the get('value') result to a canonical
			//		(non-localized) string.  For example, will print dates in ISO format, and
			//		numbers the same way as they are represented in javascript.
			// val: anything
			// options: Object?
			// tags:
			//		protected extension
			return val.toString ? val.toString() : ""; // String
		},

		toString: function(){
			// summary:
			//		Returns widget as a printable string using the widget's value
			// tags:
			//		protected
			var val = this.filter(this.get('value')); // call filter in case value is nonstring and filter has been customized
			return val != null ? (typeof val == "string" ? val : this.serialize(val, this.constraints)) : ""; // String
		},

		validate: function(){
			// Overrides `dijit/form/TextBox.validate`
			this.valueNode.value = this.toString();
			return this.inherited(arguments);
		},

		buildRendering: function(){
			// Overrides `dijit/_TemplatedMixin/buildRendering`

			this.inherited(arguments);

			// Create a hidden <input> node with the serialized value used for submit
			// (as opposed to the displayed value).
			// Passing in name as markup rather than relying on _setNameAttr custom setter above
			// to make query(input[name=...]) work on IE. (see #8660).
			// But not doing that for Windows 8 Store apps because it causes a security exception (see #16452).
			this.valueNode = domConstruct.place("<input type='hidden'" +
				((this.name && !has("msapp")) ? ' name="' + this.name.replace(/"/g, "&quot;") + '"' : "") + "/>",
				this.textbox, "after");
		},

		reset: function(){
			// Overrides `dijit/form/ValidationTextBox.reset` to
			// reset the hidden textbox value to ''
			this.valueNode.value = '';
			this.inherited(arguments);
		}
	});
});

},
'dijit/form/ValidationTextBox':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/i18n", // i18n.getLocalization
	"./TextBox",
	"../Tooltip",
	"dojo/text!./templates/ValidationTextBox.html",
	"dojo/i18n!./nls/validate"
], function(declare, kernel, i18n, TextBox, Tooltip, template){

	// module:
	//		dijit/form/ValidationTextBox


	/*=====
	var __Constraints = {
		// locale: String
		//		locale used for validation, picks up value from this widget's lang attribute
		// _flags_: anything
		//		various flags passed to pattern function
	};
	=====*/

	var ValidationTextBox;
	return ValidationTextBox = declare("dijit.form.ValidationTextBox", TextBox, {
		// summary:
		//		Base class for textbox widgets with the ability to validate content of various types and provide user feedback.

		templateString: template,

		// required: Boolean
		//		User is required to enter data into this field.
		required: false,

		// promptMessage: String
		//		If defined, display this hint string immediately on focus to the textbox, if empty.
		//		Also displays if the textbox value is Incomplete (not yet valid but will be with additional input).
		//		Think of this like a tooltip that tells the user what to do, not an error message
		//		that tells the user what they've done wrong.
		//
		//		Message disappears when user starts typing.
		promptMessage: "",

		// invalidMessage: String
		//		The message to display if value is invalid.
		//		The translated string value is read from the message file by default.
		//		Set to "" to use the promptMessage instead.
		invalidMessage: "$_unset_$",

		// missingMessage: String
		//		The message to display if value is empty and the field is required.
		//		The translated string value is read from the message file by default.
		//		Set to "" to use the invalidMessage instead.
		missingMessage: "$_unset_$",

		// message: String
		//		Currently error/prompt message.
		//		When using the default tooltip implementation, this will only be
		//		displayed when the field is focused.
		message: "",

		// constraints: __Constraints
		//		user-defined object needed to pass parameters to the validator functions
		constraints: {},

		// pattern: [extension protected] String|Function(constraints) returning a string.
		//		This defines the regular expression used to validate the input.
		//		Do not add leading ^ or $ characters since the widget adds these.
		//		A function may be used to generate a valid pattern when dependent on constraints or other runtime factors.
		//		set('pattern', String|Function).
		pattern: ".*",

		// regExp: Deprecated [extension protected] String.  Use "pattern" instead.
		regExp: "",

		regExpGen: function(/*__Constraints*/ /*===== constraints =====*/){
			// summary:
			//		Deprecated.  Use set('pattern', Function) instead.
		},

		// state: [readonly] String
		//		Shows current state (ie, validation result) of input (""=Normal, Incomplete, or Error)
		state: "",

		// tooltipPosition: String[]
		//		See description of `dijit/Tooltip.defaultPosition` for details on this parameter.
		tooltipPosition: [],

		_deprecateRegExp: function(attr, value){
			if(value != ValidationTextBox.prototype[attr]){
				kernel.deprecated("ValidationTextBox id="+this.id+", set('" + attr + "', ...) is deprecated.  Use set('pattern', ...) instead.", "", "2.0");
				this.set('pattern', value);
			}
		},
		_setRegExpGenAttr: function(/*Function*/ newFcn){
			this._deprecateRegExp("regExpGen", newFcn);
			this._set("regExpGen", this._computeRegexp); // backward compat with this.regExpGen(this.constraints)
		},
		_setRegExpAttr: function(/*String*/ value){
			this._deprecateRegExp("regExp", value);
		},

		_setValueAttr: function(){
			// summary:
			//		Hook so set('value', ...) works.
			this.inherited(arguments);
			this._refreshState();
		},

		validator: function(/*anything*/ value, /*__Constraints*/ constraints){
			// summary:
			//		Overridable function used to validate the text input against the regular expression.
			// tags:
			//		protected
			return (new RegExp("^(?:" + this._computeRegexp(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
				(!this.required || !this._isEmpty(value)) &&
				(this._isEmpty(value) || this.parse(value, constraints) !== undefined); // Boolean
		},

		_isValidSubset: function(){
			// summary:
			//		Returns true if the value is either already valid or could be made valid by appending characters.
			//		This is used for validation while the user [may be] still typing.
			return this.textbox.value.search(this._partialre) == 0;
		},

		isValid: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Tests if value is valid.
			//		Can override with your own routine in a subclass.
			// tags:
			//		protected
			return this.validator(this.textbox.value, this.get('constraints'));
		},

		_isEmpty: function(value){
			// summary:
			//		Checks for whitespace
			return (this.trim ? /^\s*$/ : /^$/).test(value); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Return an error message to show if appropriate
			// tags:
			//		protected
			var invalid = this.invalidMessage == "$_unset_$" ? this.messages.invalidMessage :
				!this.invalidMessage ? this.promptMessage : this.invalidMessage;
			var missing = this.missingMessage == "$_unset_$" ? this.messages.missingMessage :
				!this.missingMessage ? invalid : this.missingMessage;
			return (this.required && this._isEmpty(this.textbox.value)) ? missing : invalid; // String
		},

		getPromptMessage: function(/*Boolean*/ /*===== isFocused =====*/){
			// summary:
			//		Return a hint message to show when widget is first focused
			// tags:
			//		protected
			return this.promptMessage; // String
		},

		_maskValidSubsetError: true,
		validate: function(/*Boolean*/ isFocused){
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			// tags:
			//		protected
			var message = "";
			var isValid = this.disabled || this.isValid(isFocused);
			if(isValid){ this._maskValidSubsetError = true; }
			var isEmpty = this._isEmpty(this.textbox.value);
			var isValidSubset = !isValid && isFocused && this._isValidSubset();
			this._set("state", isValid ? "" : (((((!this._hasBeenBlurred || isFocused) && isEmpty) || isValidSubset) && (this._maskValidSubsetError || (isValidSubset && !this._hasBeenBlurred && isFocused))) ? "Incomplete" : "Error"));
			this.focusNode.setAttribute("aria-invalid", isValid ? "false" : "true");

			if(this.state == "Error"){
				this._maskValidSubsetError = isFocused && isValidSubset; // we want the error to show up after a blur and refocus
				message = this.getErrorMessage(isFocused);
			}else if(this.state == "Incomplete"){
				message = this.getPromptMessage(isFocused); // show the prompt whenever the value is not yet complete
				this._maskValidSubsetError = !this._hasBeenBlurred || isFocused; // no Incomplete warnings while focused
			}else if(isEmpty){
				message = this.getPromptMessage(isFocused); // show the prompt whenever there's no error and no text
			}
			this.set("message", message);

			return isValid;
		},

		displayMessage: function(/*String*/ message){
			// summary:
			//		Overridable method to display validation errors/hints.
			//		By default uses a tooltip.
			// tags:
			//		extension
			if(message && this.focused){
				Tooltip.show(message, this.domNode, this.tooltipPosition, !this.isLeftToRight());
			}else{
				Tooltip.hide(this.domNode);
			}
		},

		_refreshState: function(){
			// Overrides TextBox._refreshState()
			if(this._created){ // should instead be this._started but that would require all programmatic ValidationTextBox instantiations to call startup()
				this.validate(this.focused);
			}
			this.inherited(arguments);
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(params /*===== , srcNodeRef =====*/){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified, replace srcNodeRef with my generated DOM tree.

			this.constraints = {};
			this.baseClass += ' dijitValidationTextBox';
		},

		startup: function(){
			this.inherited(arguments);
			this._refreshState(); // after all _set* methods have run
		},

		_setConstraintsAttr: function(/*__Constraints*/ constraints){
			if(!constraints.locale && this.lang){
				constraints.locale = this.lang;
			}
			this._set("constraints", constraints);
			this._refreshState();
		},

		_setPatternAttr: function(/*String|Function*/ pattern){
			this._set("pattern", pattern); // don't set on INPUT to avoid native HTML5 validation
		},

		_computeRegexp: function(/*__Constraints*/ constraints){
			// summary:
			//		Hook to get the current regExp and to compute the partial validation RE.

			var p = this.pattern;
			if(typeof p == "function"){
				p = p.call(this, constraints);
			}
			if(p != this._lastRegExp){
				var partialre = "";
				this._lastRegExp = p;
				// parse the regexp and produce a new regexp that matches valid subsets
				// if the regexp is .* then there's no use in matching subsets since everything is valid
				if(p != ".*"){
					p.replace(/\\.|\[\]|\[.*?[^\\]{1}\]|\{.*?\}|\(\?[=:!]|./g,
					function(re){
						switch(re.charAt(0)){
							case '{':
							case '+':
							case '?':
							case '*':
							case '^':
							case '$':
							case '|':
							case '(':
								partialre += re;
								break;
							case ")":
								partialre += "|$)";
								break;
							 default:
								partialre += "(?:"+re+"|$)";
								break;
						}
					});
				}
				try{ // this is needed for now since the above regexp parsing needs more test verification
					"".search(partialre);
				}catch(e){ // should never be here unless the original RE is bad or the parsing is bad
					partialre = this.pattern;
					console.warn('RegExp error in ' + this.declaredClass + ': ' + this.pattern);
				} // should never be here unless the original RE is bad or the parsing is bad
				this._partialre = "^(?:" + partialre + ")$";
			}
			return p;
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			this.messages = i18n.getLocalization("dijit.form", "validate", this.lang);
			this._setConstraintsAttr(this.constraints); // this needs to happen now (and later) due to codependency on _set*Attr calls attachPoints
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			this.inherited(arguments);	// call FormValueWidget._setDisabledAttr()
			this._refreshState();
		},

		_setRequiredAttr: function(/*Boolean*/ value){
			this._set("required", value);
			this.focusNode.setAttribute("aria-required", value);
			this._refreshState();
		},

		_setMessageAttr: function(/*String*/ message){
			this._set("message", message);
			this.displayMessage(message);
		},

		reset:function(){
			// Overrides dijit/form/TextBox.reset() by also
			// hiding errors about partial matches
			this._maskValidSubsetError = true;
			this.inherited(arguments);
		},

		_onBlur: function(){
			// the message still exists but for back-compat, and to erase the tooltip
			// (if the message is being displayed as a tooltip), call displayMessage('')
			this.displayMessage('');

			this.inherited(arguments);
		}
	});
});

},
'dijit/form/TextBox':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.create
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/sniff", // has("ie") has("mozilla")
	"./_FormValueWidget",
	"./_TextBoxMixin",
	"dojo/text!./templates/TextBox.html",
	"../main"	// to export dijit._setSelectionRange, remove in 2.0
], function(declare, domConstruct, domStyle, kernel, lang, on, has,
			_FormValueWidget, _TextBoxMixin, template, dijit){

	// module:
	//		dijit/form/TextBox

	var TextBox = declare("dijit.form.TextBox" + (has("dojo-bidi") ? "_NoBidi" : ""), [_FormValueWidget, _TextBoxMixin], {
		// summary:
		//		A base class for textbox form inputs

		templateString: template,
		_singleNodeTemplate: '<input class="dijit dijitReset dijitLeft dijitInputField" data-dojo-attach-point="textbox,focusNode" autocomplete="off" type="${type}" ${!nameAttrSetting} />',

		_buttonInputDisabled: has("ie") ? "disabled" : "", // allows IE to disallow focus, but Firefox cannot be disabled for mousedown events

		baseClass: "dijitTextBox",

		postMixInProperties: function(){
			var type = this.type.toLowerCase();
			if(this.templateString && this.templateString.toLowerCase() == "input" || ((type == "hidden" || type == "file") && this.templateString == this.constructor.prototype.templateString)){
				this.templateString = this._singleNodeTemplate;
			}
			this.inherited(arguments);
		},

		postCreate: function(){
			this.inherited(arguments);

			if(has("ie") < 9){
				// IE INPUT tag fontFamily has to be set directly using STYLE
				// the defer gives IE a chance to render the TextBox and to deal with font inheritance
				this.defer(function(){
					try{
						var s = domStyle.getComputedStyle(this.domNode); // can throw an exception if widget is immediately destroyed
						if(s){
							var ff = s.fontFamily;
							if(ff){
								var inputs = this.domNode.getElementsByTagName("INPUT");
								if(inputs){
									for(var i=0; i < inputs.length; i++){
										inputs[i].style.fontFamily = ff;
									}
								}
							}
						}
					}catch(e){/*when used in a Dialog, and this is called before the dialog is
					 shown, s.fontFamily would trigger "Invalid Argument" error.*/}
				});
			}
		},

		_setPlaceHolderAttr: function(v){
			this._set("placeHolder", v);
			if(!this._phspan){
				this._attachPoints.push('_phspan');
				this._phspan = domConstruct.create('span', {
					// dijitInputField class gives placeHolder same padding as the input field
					// parent node already has dijitInputField class but it doesn't affect this <span>
					// since it's position: absolute.
					className: 'dijitPlaceHolder dijitInputField'
				}, this.textbox, 'after');
				this.own(
					on(this._phspan, "mousedown", function(evt){ evt.preventDefault(); }),
					on(this._phspan, "touchend, MSPointerUp", lang.hitch(this, function(){
						// If the user clicks placeholder rather than the <input>, need programmatic focus.  Normally this
						// is done in _FormWidgetMixin._onFocus() but after [30663] it's done on a delay, which is ineffective.
						this.focus();
					}))
				);
			}
			this._phspan.innerHTML="";
			this._phspan.appendChild(this._phspan.ownerDocument.createTextNode(v));
			this._updatePlaceHolder();
		},

		_onInput: function(/*Event*/ evt){
			// summary:
			//		Called AFTER the input event has happened
			//		See if the placeHolder text should be removed or added while editing.
			this.inherited(arguments);
			this._updatePlaceHolder();
		},

		_updatePlaceHolder: function(){
			if(this._phspan){
				this._phspan.style.display = (this.placeHolder && !this.textbox.value) ? "" : "none";
			}
		},

		_setValueAttr: function(value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			this.inherited(arguments);
			this._updatePlaceHolder();
		},

		getDisplayedValue: function(){
			// summary:
			//		Deprecated.  Use get('displayedValue') instead.
			// tags:
			//		deprecated
			kernel.deprecated(this.declaredClass+"::getDisplayedValue() is deprecated. Use get('displayedValue') instead.", "", "2.0");
			return this.get('displayedValue');
		},

		setDisplayedValue: function(/*String*/ value){
			// summary:
			//		Deprecated.  Use set('displayedValue', ...) instead.
			// tags:
			//		deprecated
			kernel.deprecated(this.declaredClass+"::setDisplayedValue() is deprecated. Use set('displayedValue', ...) instead.", "", "2.0");
			this.set('displayedValue', value);
		},

		_onBlur: function(e){
			if(this.disabled){ return; }
			this.inherited(arguments);
			this._updatePlaceHolder();

			if(has("mozilla")){
				if(this.selectOnClick){
					// clear selection so that the next mouse click doesn't reselect
					this.textbox.selectionStart = this.textbox.selectionEnd = undefined;
				}
			}
		},

		_onFocus: function(/*String*/ by){
			if(this.disabled || this.readOnly){ return; }
			this.inherited(arguments);
			this._updatePlaceHolder();
		}
	});

	if(has("ie") < 9){
		TextBox.prototype._isTextSelected = function(){
			var range = this.ownerDocument.selection.createRange();
			var parent = range.parentElement();
			return parent == this.textbox && range.text.length > 0;
		};

		// Overrides definition of _setSelectionRange from _TextBoxMixin (TODO: move to _TextBoxMixin.js?)
		dijit._setSelectionRange = _TextBoxMixin._setSelectionRange = function(/*DomNode*/ element, /*Number?*/ start, /*Number?*/ stop){
			if(element.createTextRange){
				var r = element.createTextRange();
				r.collapse(true);
				r.moveStart("character", -99999); // move to 0
				r.moveStart("character", start); // delta from 0 is the correct position
				r.moveEnd("character", stop-start);
				r.select();
			}
		}
	}

	if(has("dojo-bidi")){
		TextBox = declare("dijit.form.TextBox", TextBox, {
			_setPlaceHolderAttr: function(v){
				this.inherited(arguments);
				this.applyTextDir(this._phspan);
			}
		});
	}

	return TextBox;
});

},
'dijit/form/_FormValueWidget':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/sniff", // has("ie")
	"./_FormWidget",
	"./_FormValueMixin"
], function(declare, has, _FormWidget, _FormValueMixin){

	// module:
	//		dijit/form/_FormValueWidget

	return declare("dijit.form._FormValueWidget", [_FormWidget, _FormValueMixin], {
		// summary:
		//		Base class for widgets corresponding to native HTML elements such as `<input>` or `<select>`
		//		that have user changeable values.
		// description:
		//		Each _FormValueWidget represents a single input value, and has a (possibly hidden) `<input>` element,
		//		to which it serializes it's input value, so that form submission (either normal submission or via FormBind?)
		//		works as expected.

		// Don't attempt to mixin the 'type', 'name' attributes here programatically -- they must be declared
		// directly in the template as read by the parser in order to function. IE is known to specifically
		// require the 'name' attribute at element creation time.  See #8484, #8660.

		_layoutHackIE7: function(){
			// summary:
			//		Work around table sizing bugs on IE7 by forcing redraw

			if(has("ie") == 7){ // fix IE7 layout bug when the widget is scrolled out of sight
				var domNode = this.domNode;
				var parent = domNode.parentNode;
				var pingNode = domNode.firstChild || domNode; // target node most unlikely to have a custom filter
				var origFilter = pingNode.style.filter; // save custom filter, most likely nothing
				var _this = this;
				while(parent && parent.clientHeight == 0){ // search for parents that haven't rendered yet
					(function ping(){
						var disconnectHandle = _this.connect(parent, "onscroll",
							function(){
								_this.disconnect(disconnectHandle); // only call once
								pingNode.style.filter = (new Date()).getMilliseconds(); // set to anything that's unique
								_this.defer(function(){
									pingNode.style.filter = origFilter;
								}); // restore custom filter, if any
							}
						);
					})();
					parent = parent.parentNode;
				}
			}
		}
	});
});

},
'dijit/form/_FormValueMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/keys", // keys.ESCAPE
	"dojo/_base/lang",
	"dojo/on",
	"./_FormWidgetMixin"
], function(declare, domAttr, keys, lang, on, _FormWidgetMixin){

	// module:
	//		dijit/form/_FormValueMixin

	return declare("dijit.form._FormValueMixin", _FormWidgetMixin, {
		// summary:
		//		Mixin for widgets corresponding to native HTML elements such as `<input>` or `<select>`
		//		that have user changeable values.
		// description:
		//		Each _FormValueMixin represents a single input value, and has a (possibly hidden) `<input>` element,
		//		to which it serializes it's input value, so that form submission (either normal submission or via FormBind?)
		//		works as expected.

		// readOnly: Boolean
		//		Should this widget respond to user input?
		//		In markup, this is specified as "readOnly".
		//		Similar to disabled except readOnly form values are submitted.
		readOnly: false,

		_setReadOnlyAttr: function(/*Boolean*/ value){
			domAttr.set(this.focusNode, 'readOnly', value);
			this._set("readOnly", value);
		},

		postCreate: function(){
			this.inherited(arguments);

			// Update our reset value if it hasn't yet been set (because this.set()
			// is only called when there *is* a value)
			if(this._resetValue === undefined){
				this._lastValueReported = this._resetValue = this.value;
			}
		},

		_setValueAttr: function(/*anything*/ newValue, /*Boolean?*/ priorityChange){
			// summary:
			//		Hook so set('value', value) works.
			// description:
			//		Sets the value of the widget.
			//		If the value has changed, then fire onChange event, unless priorityChange
			//		is specified as null (or false?)
			this._handleOnChange(newValue, priorityChange);
		},

		_handleOnChange: function(/*anything*/ newValue, /*Boolean?*/ priorityChange){
			// summary:
			//		Called when the value of the widget has changed.  Saves the new value in this.value,
			//		and calls onChange() if appropriate.   See _FormWidget._handleOnChange() for details.
			this._set("value", newValue);
			this.inherited(arguments);
		},

		undo: function(){
			// summary:
			//		Restore the value to the last value passed to onChange
			this._setValueAttr(this._lastValueReported, false);
		},

		reset: function(){
			// summary:
			//		Reset the widget's value to what it was at initialization time
			this._hasBeenBlurred = false;
			this._setValueAttr(this._resetValue, true);
		}
	});
});

},
'dijit/form/_TextBoxMixin':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/has",
	"dojo/keys", // keys.ALT keys.CAPS_LOCK keys.CTRL keys.META keys.SHIFT
	"dojo/_base/lang", // lang.mixin
	"dojo/on", // on
	"../main"    // for exporting dijit._setSelectionRange, dijit.selectInputText
], function(array, declare, dom, has, keys, lang, on, dijit){

	// module:
	//		dijit/form/_TextBoxMixin

	var _TextBoxMixin = declare("dijit.form._TextBoxMixin" + (has("dojo-bidi") ? "_NoBidi" : ""), null, {
		// summary:
		//		A mixin for textbox form input widgets

		// trim: Boolean
		//		Removes leading and trailing whitespace if true.  Default is false.
		trim: false,

		// uppercase: Boolean
		//		Converts all characters to uppercase if true.  Default is false.
		uppercase: false,

		// lowercase: Boolean
		//		Converts all characters to lowercase if true.  Default is false.
		lowercase: false,

		// propercase: Boolean
		//		Converts the first character of each word to uppercase if true.
		propercase: false,

		// maxLength: String
		//		HTML INPUT tag maxLength declaration.
		maxLength: "",

		// selectOnClick: [const] Boolean
		//		If true, all text will be selected when focused with mouse
		selectOnClick: false,

		// placeHolder: String
		//		Defines a hint to help users fill out the input field (as defined in HTML 5).
		//		This should only contain plain text (no html markup).
		placeHolder: "",

		_getValueAttr: function(){
			// summary:
			//		Hook so get('value') works as we like.
			// description:
			//		For `dijit/form/TextBox` this basically returns the value of the `<input>`.
			//
			//		For `dijit/form/MappedTextBox` subclasses, which have both
			//		a "displayed value" and a separate "submit value",
			//		This treats the "displayed value" as the master value, computing the
			//		submit value from it via this.parse().
			return this.parse(this.get('displayedValue'), this.constraints);
		},

		_setValueAttr: function(value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Hook so set('value', ...) works.
			//
			// description:
			//		Sets the value of the widget to "value" which can be of
			//		any type as determined by the widget.
			//
			// value:
			//		The visual element value is also set to a corresponding,
			//		but not necessarily the same, value.
			//
			// formattedValue:
			//		If specified, used to set the visual element value,
			//		otherwise a computed visual value is used.
			//
			// priorityChange:
			//		If true, an onChange event is fired immediately instead of
			//		waiting for the next blur event.

			var filteredValue;
			if(value !== undefined){
				// TODO: this is calling filter() on both the display value and the actual value.
				// I added a comment to the filter() definition about this, but it should be changed.
				filteredValue = this.filter(value);
				if(typeof formattedValue != "string"){
					if(filteredValue !== null && ((typeof filteredValue != "number") || !isNaN(filteredValue))){
						formattedValue = this.filter(this.format(filteredValue, this.constraints));
					}else{
						formattedValue = '';
					}
				}
			}
			if(formattedValue != null /* and !undefined */ && ((typeof formattedValue) != "number" || !isNaN(formattedValue)) && this.textbox.value != formattedValue){
				this.textbox.value = formattedValue;
				this._set("displayedValue", this.get("displayedValue"));
			}

			this.inherited(arguments, [filteredValue, priorityChange]);
		},

		// displayedValue: String
		//		For subclasses like ComboBox where the displayed value
		//		(ex: Kentucky) and the serialized value (ex: KY) are different,
		//		this represents the displayed value.
		//
		//		Setting 'displayedValue' through set('displayedValue', ...)
		//		updates 'value', and vice-versa.  Otherwise 'value' is updated
		//		from 'displayedValue' periodically, like onBlur etc.
		//
		//		TODO: move declaration to MappedTextBox?
		//		Problem is that ComboBox references displayedValue,
		//		for benefit of FilteringSelect.
		displayedValue: "",

		_getDisplayedValueAttr: function(){
			// summary:
			//		Hook so get('displayedValue') works.
			// description:
			//		Returns the displayed value (what the user sees on the screen),
			//		after filtering (ie, trimming spaces etc.).
			//
			//		For some subclasses of TextBox (like ComboBox), the displayed value
			//		is different from the serialized value that's actually
			//		sent to the server (see `dijit/form/ValidationTextBox.serialize()`)

			// TODO: maybe we should update this.displayedValue on every keystroke so that we don't need
			// this method
			// TODO: this isn't really the displayed value when the user is typing
			return this.filter(this.textbox.value);
		},

		_setDisplayedValueAttr: function(/*String*/ value){
			// summary:
			//		Hook so set('displayedValue', ...) works.
			// description:
			//		Sets the value of the visual element to the string "value".
			//		The widget value is also set to a corresponding,
			//		but not necessarily the same, value.

			if(value == null /* or undefined */){
				value = ''
			}
			else if(typeof value != "string"){
				value = String(value)
			}

			this.textbox.value = value;

			// sets the serialized value to something corresponding to specified displayedValue
			// (if possible), and also updates the textbox.value, for example converting "123"
			// to "123.00"
			this._setValueAttr(this.get('value'), undefined);

			this._set("displayedValue", this.get('displayedValue'));
		},

		format: function(value /*=====, constraints =====*/){
			// summary:
			//		Replaceable function to convert a value to a properly formatted string.
			// value: String
			// constraints: Object
			// tags:
			//		protected extension
			return value == null /* or undefined */ ? "" : (value.toString ? value.toString() : value);
		},

		parse: function(value /*=====, constraints =====*/){
			// summary:
			//		Replaceable function to convert a formatted string to a value
			// value: String
			// constraints: Object
			// tags:
			//		protected extension

			return value;	// String
		},

		_refreshState: function(){
			// summary:
			//		After the user types some characters, etc., this method is
			//		called to check the field for validity etc.  The base method
			//		in `dijit/form/TextBox` does nothing, but subclasses override.
			// tags:
			//		protected
		},

		 onInput: function(/*===== event =====*/){
			 // summary:
			 //		Connect to this function to receive notifications of various user data-input events.
			 //		Return false to cancel the event and prevent it from being processed.
			 // event:
			 //		keydown | keypress | cut | paste | input
			 // tags:
			 //		callback
		 },

		__skipInputEvent: false,
		_onInput: function(/*Event*/ evt){
			// summary:
			//		Called AFTER the input event has happened

			this._processInput(evt);

			if(this.intermediateChanges){
				// allow the key to post to the widget input box
				this.defer(function(){
					this._handleOnChange(this.get('value'), false);
				});
			}
		},

		_processInput: function(/*Event*/ evt){
			// summary:
			//		Default action handler for user input events

			this._refreshState();

			// In case someone is watch()'ing for changes to displayedValue
			this._set("displayedValue", this.get("displayedValue"));
		},

		postCreate: function(){
			// setting the value here is needed since value="" in the template causes "undefined"
			// and setting in the DOM (instead of the JS object) helps with form reset actions
			this.textbox.setAttribute("value", this.textbox.value); // DOM and JS values should be the same

			this.inherited(arguments);

			// normalize input events to reduce spurious event processing
			//	onkeydown: do not forward modifier keys
			//		       set charOrCode to numeric keycode
			//	onkeypress: do not forward numeric charOrCode keys (already sent through onkeydown)
			//	onpaste & oncut: set charOrCode to 229 (IME)
			//	oninput: if primary event not already processed, set charOrCode to 229 (IME), else do not forward
			var handleEvent = function(e){
				var charOrCode;
				if(e.type == "keydown"){
					charOrCode = e.keyCode;
					switch(charOrCode){ // ignore state keys
						case keys.SHIFT:
						case keys.ALT:
						case keys.CTRL:
						case keys.META:
						case keys.CAPS_LOCK:
						case keys.NUM_LOCK:
						case keys.SCROLL_LOCK:
							return;
					}
					if(!e.ctrlKey && !e.metaKey && !e.altKey){ // no modifiers
						switch(charOrCode){ // ignore location keys
							case keys.NUMPAD_0:
							case keys.NUMPAD_1:
							case keys.NUMPAD_2:
							case keys.NUMPAD_3:
							case keys.NUMPAD_4:
							case keys.NUMPAD_5:
							case keys.NUMPAD_6:
							case keys.NUMPAD_7:
							case keys.NUMPAD_8:
							case keys.NUMPAD_9:
							case keys.NUMPAD_MULTIPLY:
							case keys.NUMPAD_PLUS:
							case keys.NUMPAD_ENTER:
							case keys.NUMPAD_MINUS:
							case keys.NUMPAD_PERIOD:
							case keys.NUMPAD_DIVIDE:
								return;
						}
						if((charOrCode >= 65 && charOrCode <= 90) || (charOrCode >= 48 && charOrCode <= 57) || charOrCode == keys.SPACE){
							return; // keypress will handle simple non-modified printable keys
						}
						var named = false;
						for(var i in keys){
							if(keys[i] === e.keyCode){
								named = true;
								break;
							}
						}
						if(!named){
							return;
						} // only allow named ones through
					}
				}
				charOrCode = e.charCode >= 32 ? String.fromCharCode(e.charCode) : e.charCode;
				if(!charOrCode){
					charOrCode = (e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode == keys.SPACE ? String.fromCharCode(e.keyCode) : e.keyCode;
				}
				if(!charOrCode){
					charOrCode = 229; // IME
				}
				if(e.type == "keypress"){
					if(typeof charOrCode != "string"){
						return;
					}
					if((charOrCode >= 'a' && charOrCode <= 'z') || (charOrCode >= 'A' && charOrCode <= 'Z') || (charOrCode >= '0' && charOrCode <= '9') || (charOrCode === ' ')){
						if(e.ctrlKey || e.metaKey || e.altKey){
							return;
						} // can only be stopped reliably in keydown
					}
				}
				if(e.type == "input"){
					if(this.__skipInputEvent){ // duplicate event
						this.__skipInputEvent = false;
						return;
					}
				}else{
					this.__skipInputEvent = true;
				}
				// create fake event to set charOrCode and to know if preventDefault() was called
				var faux = { faux: true }, attr;
				for(attr in e){
					if(attr != "layerX" && attr != "layerY"){ // prevent WebKit warnings
						var v = e[attr];
						if(typeof v != "function" && typeof v != "undefined"){
							faux[attr] = v;
						}
					}
				}
				lang.mixin(faux, {
					charOrCode: charOrCode,
					_wasConsumed: false,
					preventDefault: function(){
						faux._wasConsumed = true;
						e.preventDefault();
					},
					stopPropagation: function(){
						e.stopPropagation();
					}
				});
				// give web page author a chance to consume the event
				//console.log(faux.type + ', charOrCode = (' + (typeof charOrCode) + ') ' + charOrCode + ', ctrl ' + !!faux.ctrlKey + ', alt ' + !!faux.altKey + ', meta ' + !!faux.metaKey + ', shift ' + !!faux.shiftKey);
				if(this.onInput(faux) === false){ // return false means stop
					faux.preventDefault();
					faux.stopPropagation();
				}
				if(faux._wasConsumed){
					return;
				} // if preventDefault was called
				this.defer(function(){
					this._onInput(faux);
				}); // widget notification after key has posted
				if(e.type == "keypress"){
					e.stopPropagation(); // don't allow parents to stop printables from being typed
				}
			};
			this.own(on(this.textbox, "keydown, keypress, paste, cut, input, compositionend", lang.hitch(this, handleEvent)));
		},

		_blankValue: '', // if the textbox is blank, what value should be reported
		filter: function(val){
			// summary:
			//		Auto-corrections (such as trimming) that are applied to textbox
			//		value on blur or form submit.
			// description:
			//		For MappedTextBox subclasses, this is called twice
			//
			//		- once with the display value
			//		- once the value as set/returned by set('value', ...)
			//
			//		and get('value'), ex: a Number for NumberTextBox.
			//
			//		In the latter case it does corrections like converting null to NaN.  In
			//		the former case the NumberTextBox.filter() method calls this.inherited()
			//		to execute standard trimming code in TextBox.filter().
			//
			//		TODO: break this into two methods in 2.0
			//
			// tags:
			//		protected extension
			if(val === null){
				return this._blankValue;
			}
			if(typeof val != "string"){
				return val;
			}
			if(this.trim){
				val = lang.trim(val);
			}
			if(this.uppercase){
				val = val.toUpperCase();
			}
			if(this.lowercase){
				val = val.toLowerCase();
			}
			if(this.propercase){
				val = val.replace(/[^\s]+/g, function(word){
					return word.substring(0, 1).toUpperCase() + word.substring(1);
				});
			}
			return val;
		},

		_setBlurValue: function(){
			// Format the displayed value, for example (for NumberTextBox) convert 1.4 to 1.400,
			// or (for CurrencyTextBox) 2.50 to $2.50

			this._setValueAttr(this.get('value'), true);
		},

		_onBlur: function(e){
			if(this.disabled){
				return;
			}
			this._setBlurValue();
			this.inherited(arguments);
		},

		_isTextSelected: function(){
			return this.textbox.selectionStart != this.textbox.selectionEnd;
		},

		_onFocus: function(/*String*/ by){
			if(this.disabled || this.readOnly){
				return;
			}

			// Select all text on focus via click if nothing already selected.
			// Since mouse-up will clear the selection, need to defer selection until after mouse-up.
			// Don't do anything on focus by tabbing into the widget since there's no associated mouse-up event.
			if(this.selectOnClick && by == "mouse"){
				// Use on.once() to only select all text on first click only; otherwise users would have no way to clear
				// the selection.
				this._selectOnClickHandle = on.once(this.domNode, "mouseup, touchend", lang.hitch(this, function(evt){
					// Check if the user selected some text manually (mouse-down, mouse-move, mouse-up)
					// and if not, then select all the text
					if(!this._isTextSelected()){
						_TextBoxMixin.selectInputText(this.textbox);
					}
				}));
				this.own(this._selectOnClickHandle);

				// in case the mouseup never comes
				this.defer(function(){
					if(this._selectOnClickHandle){
						this._selectOnClickHandle.remove();
						this._selectOnClickHandle = null;
					}
				}, 500); // if mouseup not received soon, then treat it as some gesture
			}
			// call this.inherited() before refreshState(), since this.inherited() will possibly scroll the viewport
			// (to scroll the TextBox into view), which will affect how _refreshState() positions the tooltip
			this.inherited(arguments);

			this._refreshState();
		},

		reset: function(){
			// Overrides `dijit/_FormWidget/reset()`.
			// Additionally resets the displayed textbox value to ''
			this.textbox.value = '';
			this.inherited(arguments);
		}
	});

	if(has("dojo-bidi")){
		_TextBoxMixin = declare("dijit.form._TextBoxMixin", _TextBoxMixin, {
			_setValueAttr: function(){
				this.inherited(arguments);
				this.applyTextDir(this.focusNode);
			},
			_setDisplayedValueAttr: function(){
				this.inherited(arguments);
				this.applyTextDir(this.focusNode);
			},
			_onInput: function(){
				this.applyTextDir(this.focusNode);
				this.inherited(arguments);
			}
		});
	}

	_TextBoxMixin._setSelectionRange = dijit._setSelectionRange = function(/*DomNode*/ element, /*Number?*/ start, /*Number?*/ stop){
		if(element.setSelectionRange){
			element.setSelectionRange(start, stop);
		}
	};

	_TextBoxMixin.selectInputText = dijit.selectInputText = function(/*DomNode*/ element, /*Number?*/ start, /*Number?*/ stop){
		// summary:
		//		Select text in the input element argument, from start (default 0), to stop (default end).

		// TODO: use functions in _editor/selection.js?
		element = dom.byId(element);
		if(isNaN(start)){
			start = 0;
		}
		if(isNaN(stop)){
			stop = element.value ? element.value.length : 0;
		}
		try{
			element.focus();
			_TextBoxMixin._setSelectionRange(element, start, stop);
		}catch(e){ /* squelch random errors (esp. on IE) from unexpected focus changes or DOM nodes being hidden */
		}
	};

	return _TextBoxMixin;
});

},
'dijit/Tooltip':function(){
define([
	"dojo/_base/array", // array.forEach array.indexOf array.map
	"dojo/_base/declare", // declare
	"dojo/_base/fx", // fx.fadeIn fx.fadeOut
	"dojo/dom", // dom.byId
	"dojo/dom-class", // domClass.add
	"dojo/dom-geometry", // domGeometry.position
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/_base/lang", // lang.hitch lang.isArrayLike
	"dojo/mouse",
	"dojo/on",
	"dojo/sniff", // has("ie")
	"./_base/manager",	// manager.defaultDuration
	"./place",
	"./_Widget",
	"./_TemplatedMixin",
	"./BackgroundIframe",
	"dojo/text!./templates/Tooltip.html",
	"./main"		// sets dijit.showTooltip etc. for back-compat
], function(array, declare, fx, dom, domClass, domGeometry, domStyle, lang, mouse, on, has,
			manager, place, _Widget, _TemplatedMixin, BackgroundIframe, template, dijit){

	// module:
	//		dijit/Tooltip


	// TODO: Tooltip should really share more positioning code with TooltipDialog, like:
	//		- the orient() method
	//		- the connector positioning code in show()
	//		- the dijitTooltip[Dialog] class
	//
	// The problem is that Tooltip's implementation supplies it's own <iframe> and interacts directly
	// with dijit/place, rather than going through dijit/popup like TooltipDialog and other popups (ex: Menu).

	var MasterTooltip = declare("dijit._MasterTooltip", [_Widget, _TemplatedMixin], {
		// summary:
		//		Internal widget that holds the actual tooltip markup,
		//		which occurs once per page.
		//		Called by Tooltip widgets which are just containers to hold
		//		the markup
		// tags:
		//		protected

		// duration: Integer
		//		Milliseconds to fade in/fade out
		duration: manager.defaultDuration,

		templateString: template,

		postCreate: function(){
			this.ownerDocumentBody.appendChild(this.domNode);

			this.bgIframe = new BackgroundIframe(this.domNode);

			// Setup fade-in and fade-out functions.
			this.fadeIn = fx.fadeIn({ node: this.domNode, duration: this.duration, onEnd: lang.hitch(this, "_onShow") });
			this.fadeOut = fx.fadeOut({ node: this.domNode, duration: this.duration, onEnd: lang.hitch(this, "_onHide") });
		},

		show: function(innerHTML, aroundNode, position, rtl, textDir){
			// summary:
			//		Display tooltip w/specified contents to right of specified node
			//		(To left if there's no space on the right, or if rtl == true)
			// innerHTML: String
			//		Contents of the tooltip
			// aroundNode: DomNode|dijit/place.__Rectangle
			//		Specifies that tooltip should be next to this node / area
			// position: String[]?
			//		List of positions to try to position tooltip (ex: ["right", "above"])
			// rtl: Boolean?
			//		Corresponds to `WidgetBase.dir` attribute, where false means "ltr" and true
			//		means "rtl"; specifies GUI direction, not text direction.
			// textDir: String?
			//		Corresponds to `WidgetBase.textdir` attribute; specifies direction of text.


			if(this.aroundNode && this.aroundNode === aroundNode && this.containerNode.innerHTML == innerHTML){
				return;
			}

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;

			if(textDir){
				this.set("textDir", textDir);
			}

			this.containerNode.align = rtl? "right" : "left"; //fix the text alignment

			var pos = place.around(this.domNode, aroundNode,
				position && position.length ? position : Tooltip.defaultPosition, !rtl, lang.hitch(this, "orient"));

			// Position the tooltip connector for middle alignment.
			// This could not have been done in orient() since the tooltip wasn't positioned at that time.
			var aroundNodeCoords = pos.aroundNodePos;
			if(pos.corner.charAt(0) == 'M' && pos.aroundCorner.charAt(0) == 'M'){
				this.connectorNode.style.top = aroundNodeCoords.y + ((aroundNodeCoords.h - this.connectorNode.offsetHeight) >> 1) - pos.y + "px";
				this.connectorNode.style.left = "";
			}else if(pos.corner.charAt(1) == 'M' && pos.aroundCorner.charAt(1) == 'M'){
				this.connectorNode.style.left = aroundNodeCoords.x + ((aroundNodeCoords.w - this.connectorNode.offsetWidth) >> 1) - pos.x + "px";
			}else{
				// Not *-centered, but just above/below/after/before
				this.connectorNode.style.left = "";
				this.connectorNode.style.top = "";
			}

			// show it
			domStyle.set(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
			this.aroundNode = aroundNode;
		},

		orient: function(/*DomNode*/ node, /*String*/ aroundCorner, /*String*/ tooltipCorner, /*Object*/ spaceAvailable, /*Object*/ aroundNodeCoords){
			// summary:
			//		Private function to set CSS for tooltip node based on which position it's in.
			//		This is called by the dijit popup code.   It will also reduce the tooltip's
			//		width to whatever width is available
			// tags:
			//		protected

			this.connectorNode.style.top = ""; //reset to default

			var heightAvailable = spaceAvailable.h,
				widthAvailable = spaceAvailable.w;

			node.className = "dijitTooltip " +
				{
					"MR-ML": "dijitTooltipRight",
					"ML-MR": "dijitTooltipLeft",
					"TM-BM": "dijitTooltipAbove",
					"BM-TM": "dijitTooltipBelow",
					"BL-TL": "dijitTooltipBelow dijitTooltipABLeft",
					"TL-BL": "dijitTooltipAbove dijitTooltipABLeft",
					"BR-TR": "dijitTooltipBelow dijitTooltipABRight",
					"TR-BR": "dijitTooltipAbove dijitTooltipABRight",
					"BR-BL": "dijitTooltipRight",
					"BL-BR": "dijitTooltipLeft"
				}[aroundCorner + "-" + tooltipCorner];

			// reset width; it may have been set by orient() on a previous tooltip show()
			this.domNode.style.width = "auto";

			// Reduce tooltip's width to the amount of width available, so that it doesn't overflow screen.
			// Note that sometimes widthAvailable is negative, but we guard against setting style.width to a
			// negative number since that causes an exception on IE.
			var size = domGeometry.position(this.domNode);
			if(has("ie") == 9){
				// workaround strange IE9 bug where setting width to offsetWidth causes words to wrap
				size.w += 2;
			}

			var width = Math.min((Math.max(widthAvailable,1)), size.w);

			domGeometry.setMarginBox(this.domNode, {w: width});

			// Reposition the tooltip connector.
			if(tooltipCorner.charAt(0) == 'B' && aroundCorner.charAt(0) == 'B'){
				var bb = domGeometry.position(node);
				var tooltipConnectorHeight = this.connectorNode.offsetHeight;
				if(bb.h > heightAvailable){
					// The tooltip starts at the top of the page and will extend past the aroundNode
					var aroundNodePlacement = heightAvailable - ((aroundNodeCoords.h + tooltipConnectorHeight) >> 1);
					this.connectorNode.style.top = aroundNodePlacement + "px";
					this.connectorNode.style.bottom = "";
				}else{
					// Align center of connector with center of aroundNode, except don't let bottom
					// of connector extend below bottom of tooltip content, or top of connector
					// extend past top of tooltip content
					this.connectorNode.style.bottom = Math.min(
						Math.max(aroundNodeCoords.h/2 - tooltipConnectorHeight/2, 0),
						bb.h - tooltipConnectorHeight) + "px";
					this.connectorNode.style.top = "";
				}
			}else{
				// reset the tooltip back to the defaults
				this.connectorNode.style.top = "";
				this.connectorNode.style.bottom = "";
			}

			return Math.max(0, size.w - widthAvailable);
		},

		_onShow: function(){
			// summary:
			//		Called at end of fade-in operation
			// tags:
			//		protected
			if(has("ie")){
				// the arrow won't show up on a node w/an opacity filter
				this.domNode.style.filter="";
			}
		},

		hide: function(aroundNode){
			// summary:
			//		Hide the tooltip

			if(this._onDeck && this._onDeck[1] == aroundNode){
				// this hide request is for a show() that hasn't even started yet;
				// just cancel the pending show()
				this._onDeck=null;
			}else if(this.aroundNode === aroundNode){
				// this hide request is for the currently displayed tooltip
				this.fadeIn.stop();
				this.isShowingNow = false;
				this.aroundNode = null;
				this.fadeOut.play();
			}else{
				// just ignore the call, it's for a tooltip that has already been erased
			}
		},

		_onHide: function(){
			// summary:
			//		Called at end of fade-out operation
			// tags:
			//		protected

			this.domNode.style.cssText="";	// to position offscreen again
			this.containerNode.innerHTML="";
			if(this._onDeck){
				// a show request has been queued up; do it now
				this.show.apply(this, this._onDeck);
				this._onDeck=null;
			}
		}
	});

	if(has("dojo-bidi")){
		MasterTooltip.extend({
			_setAutoTextDir: function(/*Object*/node){
				// summary:
				//		Resolve "auto" text direction for children nodes
				// tags:
				//		private

				this.applyTextDir(node);
				array.forEach(node.children, function(child){ this._setAutoTextDir(child); }, this);
			},

			_setTextDirAttr: function(/*String*/ textDir){
				// summary:
				//		Setter for textDir.
				// description:
				//		Users shouldn't call this function; they should be calling
				//		set('textDir', value)
				// tags:
				//		private

				this._set("textDir", textDir);

				if (textDir == "auto"){
					this._setAutoTextDir(this.containerNode);
				}else{
					this.containerNode.dir = this.textDir;
				}
			}
		});
	}

	dijit.showTooltip = function(innerHTML, aroundNode, position, rtl, textDir){
		// summary:
		//		Static method to display tooltip w/specified contents in specified position.
		//		See description of dijit/Tooltip.defaultPosition for details on position parameter.
		//		If position is not specified then dijit/Tooltip.defaultPosition is used.
		// innerHTML: String
		//		Contents of the tooltip
		// aroundNode: place.__Rectangle
		//		Specifies that tooltip should be next to this node / area
		// position: String[]?
		//		List of positions to try to position tooltip (ex: ["right", "above"])
		// rtl: Boolean?
		//		Corresponds to `WidgetBase.dir` attribute, where false means "ltr" and true
		//		means "rtl"; specifies GUI direction, not text direction.
		// textDir: String?
		//		Corresponds to `WidgetBase.textdir` attribute; specifies direction of text.

		// After/before don't work, but for back-compat convert them to the working after-centered, before-centered.
		// Possibly remove this in 2.0.   Alternately, get before/after to work.
		if(position){
			position = array.map(position, function(val){
				return {after: "after-centered", before: "before-centered"}[val] || val;
			});
		}

		if(!Tooltip._masterTT){ dijit._masterTT = Tooltip._masterTT = new MasterTooltip(); }
		return Tooltip._masterTT.show(innerHTML, aroundNode, position, rtl, textDir);
	};

	dijit.hideTooltip = function(aroundNode){
		// summary:
		//		Static method to hide the tooltip displayed via showTooltip()
		return Tooltip._masterTT && Tooltip._masterTT.hide(aroundNode);
	};

	var Tooltip = declare("dijit.Tooltip", _Widget, {
		// summary:
		//		Pops up a tooltip (a help message) when you hover over a node.
		//		Also provides static show() and hide() methods that can be used without instantiating a dijit/Tooltip.

		// label: String
		//		HTML to display in the tooltip.
		//		Specified as innerHTML when creating the widget from markup.
		label: "",

		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over/focusing on the object, before
		//		the tooltip is displayed.
		showDelay: 400,

		// connectId: String|String[]|DomNode|DomNode[]
		//		Id of domNode(s) to attach the tooltip to.
		//		When user hovers over specified dom node(s), the tooltip will appear.
		connectId: [],

		// position: String[]
		//		See description of `dijit/Tooltip.defaultPosition` for details on position parameter.
		position: [],

		// selector: String?
		//		CSS expression to apply this Tooltip to descendants of connectIds, rather than to
		//		the nodes specified by connectIds themselves.    Useful for applying a Tooltip to
		//		a range of rows in a table, tree, etc.   Use in conjunction with getContent() parameter.
		//		Ex: connectId: myTable, selector: "tr", getContent: function(node){ return ...; }
		//
		//		The application must require() an appropriate level of dojo/query to handle the selector.
		selector: "",

		// TODO: in 2.0 remove support for multiple connectIds.   selector gives the same effect.
		// So, change connectId to a "", remove addTarget()/removeTarget(), etc.

		_setConnectIdAttr: function(/*String|String[]|DomNode|DomNode[]*/ newId){
			// summary:
			//		Connect to specified node(s)

			// Remove connections to old nodes (if there are any)
			array.forEach(this._connections || [], function(nested){
				array.forEach(nested, function(handle){ handle.remove(); });
			}, this);

			// Make array of id's to connect to, excluding entries for nodes that don't exist yet, see startup()
			this._connectIds = array.filter(lang.isArrayLike(newId) ? newId : (newId ? [newId] : []),
					function(id){ return dom.byId(id, this.ownerDocument); }, this);

			// Make connections
			this._connections = array.map(this._connectIds, function(id){
				var node = dom.byId(id, this.ownerDocument),
					selector = this.selector,
					delegatedEvent = selector ?
						function(eventType){ return on.selector(selector, eventType); } :
						function(eventType){ return eventType; },
					self = this;
				return [
					on(node, delegatedEvent(mouse.enter), function(){
						self._onHover(this);
					}),
					on(node, delegatedEvent("focusin"), function(){
						self._onHover(this);
					}),
					on(node, delegatedEvent(mouse.leave), lang.hitch(self, "_onUnHover")),
					on(node, delegatedEvent("focusout"), lang.hitch(self, "_onUnHover"))
				];
			}, this);

			this._set("connectId", newId);
		},

		addTarget: function(/*OomNode|String*/ node){
			// summary:
			//		Attach tooltip to specified node if it's not already connected

			// TODO: remove in 2.0 and just use set("connectId", ...) interface

			var id = node.id || node;
			if(array.indexOf(this._connectIds, id) == -1){
				this.set("connectId", this._connectIds.concat(id));
			}
		},

		removeTarget: function(/*DomNode|String*/ node){
			// summary:
			//		Detach tooltip from specified node

			// TODO: remove in 2.0 and just use set("connectId", ...) interface

			var id = node.id || node,	// map from DOMNode back to plain id string
				idx = array.indexOf(this._connectIds, id);
			if(idx >= 0){
				// remove id (modifies original this._connectIds but that's OK in this case)
				this._connectIds.splice(idx, 1);
				this.set("connectId", this._connectIds);
			}
		},

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode,"dijitTooltipData");
		},

		startup: function(){
			this.inherited(arguments);

			// If this tooltip was created in a template, or for some other reason the specified connectId[s]
			// didn't exist during the widget's initialization, then connect now.
			var ids = this.connectId;
			array.forEach(lang.isArrayLike(ids) ? ids : [ids], this.addTarget, this);
		},

		getContent: function(/*DomNode*/ node){
			// summary:
			//		User overridable function that return the text to display in the tooltip.
			// tags:
			//		extension
			return this.label || this.domNode.innerHTML;
		},

		_onHover: function(/*DomNode*/ target){
			// summary:
			//		Despite the name of this method, it actually handles both hover and focus
			//		events on the target node, setting a timer to show the tooltip.
			// tags:
			//		private
			if(!this._showTimer){
				this._showTimer = this.defer(function(){ this.open(target); }, this.showDelay);
			}
		},

		_onUnHover: function(){
			// summary:
			//		Despite the name of this method, it actually handles both mouseleave and blur
			//		events on the target node, hiding the tooltip.
			// tags:
			//		private

			if(this._showTimer){
				this._showTimer.remove();
				delete this._showTimer;
			}
			this.close();
		},

		open: function(/*DomNode*/ target){
			// summary:
			//		Display the tooltip; usually not called directly.
			// tags:
			//		private

			if(this._showTimer){
				this._showTimer.remove();
				delete this._showTimer;
			}

			var content = this.getContent(target);
			if(!content){
				return;
			}
			Tooltip.show(content, target, this.position, !this.isLeftToRight(), this.textDir);

			this._connectNode = target;		// _connectNode means "tooltip currently displayed for this node"
			this.onShow(target, this.position);
		},

		close: function(){
			// summary:
			//		Hide the tooltip or cancel timer for show of tooltip
			// tags:
			//		private

			if(this._connectNode){
				// if tooltip is currently shown
				Tooltip.hide(this._connectNode);
				delete this._connectNode;
				this.onHide();
			}
			if(this._showTimer){
				// if tooltip is scheduled to be shown (after a brief delay)
				this._showTimer.remove();
				delete this._showTimer;
			}
		},

		onShow: function(/*===== target, position =====*/){
			// summary:
			//		Called when the tooltip is shown
			// tags:
			//		callback
		},

		onHide: function(){
			// summary:
			//		Called when the tooltip is hidden
			// tags:
			//		callback
		},

		destroy: function(){
			this.close();

			// Remove connections manually since they aren't registered to be removed by _WidgetBase
			array.forEach(this._connections || [], function(nested){
				array.forEach(nested, function(handle){ handle.remove(); });
			}, this);

			this.inherited(arguments);
		}
	});

	Tooltip._MasterTooltip = MasterTooltip;		// for monkey patching
	Tooltip.show = dijit.showTooltip;		// export function through module return value
	Tooltip.hide = dijit.hideTooltip;		// export function through module return value

	Tooltip.defaultPosition = ["after-centered", "before-centered"];

	/*=====
	lang.mixin(Tooltip, {
		 // defaultPosition: String[]
		 //		This variable controls the position of tooltips, if the position is not specified to
		 //		the Tooltip widget or *TextBox widget itself.  It's an array of strings with the values
		 //		possible for `dijit/place.around()`.   The recommended values are:
		 //
		 //		- before-centered: centers tooltip to the left of the anchor node/widget, or to the right
		 //		  in the case of RTL scripts like Hebrew and Arabic
		 //		- after-centered: centers tooltip to the right of the anchor node/widget, or to the left
		 //		  in the case of RTL scripts like Hebrew and Arabic
		 //		- above-centered: tooltip is centered above anchor node
		 //		- below-centered: tooltip is centered above anchor node
		 //
		 //		The list is positions is tried, in order, until a position is found where the tooltip fits
		 //		within the viewport.
		 //
		 //		Be careful setting this parameter.  A value of "above-centered" may work fine until the user scrolls
		 //		the screen so that there's no room above the target node.   Nodes with drop downs, like
		 //		DropDownButton or FilteringSelect, are especially problematic, in that you need to be sure
		 //		that the drop down and tooltip don't overlap, even when the viewport is scrolled so that there
		 //		is only room below (or above) the target node, but not both.
	 });
	=====*/
	return Tooltip;
});

},
'dijit/form/CurrencyTextBox':function(){
define([
	"dojo/currency", // currency._mixInDefaults currency.format currency.parse currency.regexp
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.hitch
	"./NumberTextBox"
], function(currency, declare, lang, NumberTextBox){

	// module:
	//		dijit/form/CurrencyTextBox

	/*=====
	var __Constraints = declare([NumberTextBox.__Constraints, currency.__FormatOptions, currency.__ParseOptions], {
		// summary:
		//		Specifies both the rules on valid/invalid values (minimum, maximum,
		//		number of required decimal places), and also formatting options for
		//		displaying the value when the field is not focused (currency symbol,
		//		etc.)
		// description:
		//		Follows the pattern of `dijit/form/NumberTextBox.__Constraints`.
		//		In general developers won't need to set this parameter
		// example:
		//		To ensure that the user types in the cents (for example, 1.00 instead of just 1):
		//	|		{fractional:true}
	});
	=====*/

	return declare("dijit.form.CurrencyTextBox", NumberTextBox, {
		// summary:
		//		A validating currency textbox
		// description:
		//		CurrencyTextBox is similar to `dijit/form/NumberTextBox` but has a few
		//		extra features related to currency:
		//
		//		1. After specifying the currency type (american dollars, euros, etc.) it automatically
		//			sets parse/format options such as how many decimal places to show.
		//		2. The currency mark (dollar sign, euro mark, etc.) is displayed when the field is blurred
		//			but erased during editing, so that the user can just enter a plain number.

		// currency: [const] String
		//		the [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD"
		currency: "",

		/*=====
		// constraints: __Constraints
		//		Despite the name, this parameter specifies both constraints on the input
		//		(including minimum/maximum allowed values) as well as
		//		formatting options.
		constraints: {},
		======*/

		baseClass: "dijitTextBox dijitCurrencyTextBox",

		// Override NumberTextBox._formatter to deal with currencies, ex: converts "123.45" to "$123.45"
		_formatter: currency.format,

		_parser: currency.parse,

		_regExpGenerator: currency.regexp,

		parse: function(/*String*/ value, /*Object*/ constraints){
			// summary:
			//		Parses string value as a Currency, according to the constraints object
			// tags:
			//		protected extension
			var v = this.inherited(arguments);
			if(isNaN(v) && /\d+/.test(value)){ // currency parse failed, but it could be because they are using NumberTextBox format so try its parse
				v = lang.hitch(lang.delegate(this, { _parser: NumberTextBox.prototype._parser }), "inherited")(arguments);
			}
			return v;
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			if(!constraints.currency && this.currency){
				constraints.currency = this.currency;
			}
			this.inherited(arguments, [ currency._mixInDefaults(lang.mixin(constraints, { exponent: false })) ]); // get places
		}
	});
});

},
'dojo/currency':function(){
define([
	"./_base/array",
	"./_base/lang",
	/*===== "./_base/declare", =====*/
	"./number",
	"./i18n", "./i18n!./cldr/nls/currency",
	"./cldr/monetary"
], function(darray, lang, /*===== declare, =====*/ dnumber, i18n, nlsCurrency, cldrMonetary){

// module:
//		dojo/currency

var currency = {
	// summary:
	//		localized formatting and parsing routines for currencies
	// description:
	//		extends dojo.number to provide culturally-appropriate formatting of values
	//		in various world currencies, including use of a currency symbol.  The currencies are specified
	//		by a three-letter international symbol in all uppercase, and support for the currencies is
	//		provided by the data in `dojo.cldr`.  The scripts generating dojo.cldr specify which
	//		currency support is included.  A fixed number of decimal places is determined based
	//		on the currency type and is not determined by the 'pattern' argument.  The fractional
	//		portion is optional, by default, and variable length decimals are not supported.
};
lang.setObject("dojo.currency", currency);

currency._mixInDefaults = function(options){
	options = options || {};
	options.type = "currency";

	// Get locale-dependent currency data, like the symbol
	var bundle = i18n.getLocalization("dojo.cldr", "currency", options.locale) || {};

	// Mixin locale-independent currency data, like # of places
	var iso = options.currency;
	var data = cldrMonetary.getData(iso);

	darray.forEach(["displayName","symbol","group","decimal"], function(prop){
		data[prop] = bundle[iso+"_"+prop];
	});

	data.fractional = [true, false];

	// Mixin with provided options
	return lang.mixin(data, options);
};

/*=====
currency.__FormatOptions = declare([dnumber.__FormatOptions], {
	// type: String?
	//		Should not be set.  Value is assumed to be "currency".
	// symbol: String?
	//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
	//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
	// currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
	//		For use with dojo.currency only.
	// places: Number?
	//		number of decimal places to show.  Default is defined based on which currency is used.
	type: "",
	symbol: "",
	currency: "",
	places: ""
});
=====*/

currency.format = function(/*Number*/ value, /*__FormatOptions?*/ options){
	// summary:
	//		Format a Number as a currency, using locale-specific settings
	//
	// description:
	//		Create a string from a Number using a known, localized pattern.
	//		[Formatting patterns](http://www.unicode.org/reports/tr35/#Number_Elements)
	//		appropriate to the locale are chosen from the [CLDR](http://unicode.org/cldr)
	//		as well as the appropriate symbols and delimiters and number of decimal places.
	//
	// value:
	//		the number to be formatted.

	return dnumber.format(value, currency._mixInDefaults(options));
};

currency.regexp = function(/*dnumber.__RegexpOptions?*/ options){
	//
	// summary:
	//		Builds the regular needed to parse a currency value
	//
	// description:
	//		Returns regular expression with positive and negative match, group and decimal separators
	//		Note: the options.places default, the number of decimal places to accept, is defined by the currency type.
	return dnumber.regexp(currency._mixInDefaults(options)); // String
};

/*=====
var __ParseOptions = currency.__ParseOptions = declare(dnumber.__ParseOptions, {
	// type: String?
	//		Should not be set.  Value is assumed to be currency.
	// currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
	//		For use with dojo.currency only.
	// symbol: String?
	//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
	//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
	// places: Number?
	//		fixed number of decimal places to accept.  The default is determined based on which currency is used.
	// fractional: Boolean|Array?
	//		Whether to include the fractional portion, where the number of decimal places are implied by the currency
	//		or explicit 'places' parameter.  The value [true,false] makes the fractional portion optional.
	//		By default for currencies, it the fractional portion is optional.
});
=====*/

currency.parse = function(/*String*/ expression, /*__ParseOptions?*/ options){
	//
	// summary:
	//		Convert a properly formatted currency string to a primitive Number,
	//		using locale-specific settings.
	// description:
	//		Create a Number from a string using a known, localized pattern.
	//		[Formatting patterns](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		are chosen appropriate to the locale, as well as the appropriate symbols and delimiters
	//		and number of decimal places.
	// expression:
	//		A string representation of a currency value

	return dnumber.parse(expression, currency._mixInDefaults(options));
};

return currency;
});

},
'dojo/number':function(){
define([/*===== "./_base/declare", =====*/ "./_base/lang", "./i18n", "./i18n!./cldr/nls/number", "./string", "./regexp"],
	function(/*===== declare, =====*/ lang, i18n, nlsNumber, dstring, dregexp){

// module:
//		dojo/number

var number = {
	// summary:
	//		localized formatting and parsing routines for Number
};
lang.setObject("dojo.number", number);

/*=====
number.__FormatOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.  Literal characters in patterns are not supported.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// places: Number?
	//		fixed number of decimal places to show.  This overrides any
	//		information in the provided pattern.
	// round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means do not round.
	// locale: String?
	//		override the locale used to determine formatting rules
	// fractional: Boolean?
	//		If false, show no decimal places, overriding places and pattern settings.
});
=====*/

number.format = function(/*Number*/ value, /*number.__FormatOptions?*/ options){
	// summary:
	//		Format a Number as a String, using locale-specific settings
	// description:
	//		Create a string from a Number using a known localized pattern.
	//		Formatting patterns appropriate to the locale are chosen from the
	//		[Common Locale Data Repository](http://unicode.org/cldr) as well as the appropriate symbols and
	//		delimiters.
	//		If value is Infinity, -Infinity, or is not a valid JavaScript number, return null.
	// value:
	//		the number to be formatted

	options = lang.mixin({}, options || {});
	var locale = i18n.normalizeLocale(options.locale),
		bundle = i18n.getLocalization("dojo.cldr", "number", locale);
	options.customs = bundle;
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
	if(isNaN(value) || Math.abs(value) == Infinity){ return null; } // null
	return number._applyPattern(value, pattern, options); // String
};

//number._numberPatternRE = /(?:[#0]*,?)*[#0](?:\.0*#*)?/; // not precise, but good enough
number._numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/; // not precise, but good enough

number._applyPattern = function(/*Number*/ value, /*String*/ pattern, /*number.__FormatOptions?*/ options){
	// summary:
	//		Apply pattern to format value as a string using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted.
	// pattern:
	//		a pattern string as described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// options: number.__FormatOptions?
	//		_applyPattern is usually called via `dojo/number.format()` which
	//		populates an extra property in the options parameter, "customs".
	//		The customs object specifies group and decimal parameters if set.

	//TODO: support escapes
	options = options || {};
	var group = options.customs.group,
		decimal = options.customs.decimal,
		patternList = pattern.split(';'),
		positivePattern = patternList[0];
	pattern = patternList[(value < 0) ? 1 : 0] || ("-" + positivePattern);

	//TODO: only test against unescaped
	if(pattern.indexOf('%') != -1){
		value *= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		value *= 1000; // per mille
	}else if(pattern.indexOf('\u00a4') != -1){
		group = options.customs.currencyGroup || group;//mixins instead?
		decimal = options.customs.currencyDecimal || decimal;// Should these be mixins instead?
		pattern = pattern.replace(/\u00a4{1,3}/, function(match){
			var prop = ["symbol", "currency", "displayName"][match.length-1];
			return options[prop] || options.currency || "";
		});
	}else if(pattern.indexOf('E') != -1){
		throw new Error("exponential notation not supported");
	}

	//TODO: support @ sig figs?
	var numberPatternRE = number._numberPatternRE;
	var numberPattern = positivePattern.match(numberPatternRE);
	if(!numberPattern){
		throw new Error("unable to find a number expression in pattern: "+pattern);
	}
	if(options.fractional === false){ options.places = 0; }
	return pattern.replace(numberPatternRE,
		number._formatAbsolute(value, numberPattern[0], {decimal: decimal, group: group, places: options.places, round: options.round}));
};

number.round = function(/*Number*/ value, /*Number?*/ places, /*Number?*/ increment){
	// summary:
	//		Rounds to the nearest value with the given number of decimal places, away from zero
	// description:
	//		Rounds to the nearest value with the given number of decimal places, away from zero if equal.
	//		Similar to Number.toFixed(), but compensates for browser quirks. Rounding can be done by
	//		fractional increments also, such as the nearest quarter.
	//		NOTE: Subject to floating point errors.  See dojox/math/round for experimental workaround.
	// value:
	//		The number to round
	// places:
	//		The number of decimal places where rounding takes place.  Defaults to 0 for whole rounding.
	//		Must be non-negative.
	// increment:
	//		Rounds next place to nearest value of increment/10.  10 by default.
	// example:
	// |	>>> number.round(-0.5)
	// |	-1
	// |	>>> number.round(162.295, 2)
	// |	162.29  // note floating point error.  Should be 162.3
	// |	>>> number.round(10.71, 0, 2.5)
	// |	10.75
	var factor = 10 / (increment || 10);
	return (factor * +value).toFixed(places) / factor; // Number
};

if((0.9).toFixed() == 0){
	// (isIE) toFixed() bug workaround: Rounding fails on IE when most significant digit
	// is just after the rounding place and is >=5
	var round = number.round;
	number.round = function(v, p, m){
		var d = Math.pow(10, -p || 0), a = Math.abs(v);
		if(!v || a >= d){
			d = 0;
		}else{
			a /= d;
			if(a < 0.5 || a >= 0.95){
				d = 0;
			}
		}
		return round(v, p, m) + (v > 0 ? d : -d);
	};

	// Use "doc hint" so the doc parser ignores this new definition of round(), and uses the one above.
	/*===== number.round = round; =====*/
}

/*=====
number.__FormatAbsoluteOptions = declare(null, {
	// decimal: String?
	//		the decimal separator
	// group: String?
	//		the group separator
	// places: Number|String?
	//		number of decimal places.  the range "n,m" will format to m places.
	// round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means don't round.
});
=====*/

number._formatAbsolute = function(/*Number*/ value, /*String*/ pattern, /*number.__FormatAbsoluteOptions?*/ options){
	// summary:
	//		Apply numeric pattern to absolute value using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted, ignores sign
	// pattern:
	//		the number portion of a pattern (e.g. `#,##0.00`)
	options = options || {};
	if(options.places === true){options.places=0;}
	if(options.places === Infinity){options.places=6;} // avoid a loop; pick a limit

	var patternParts = pattern.split("."),
		comma = typeof options.places == "string" && options.places.indexOf(","),
		maxPlaces = options.places;
	if(comma){
		maxPlaces = options.places.substring(comma + 1);
	}else if(!(maxPlaces >= 0)){
		maxPlaces = (patternParts[1] || []).length;
	}
	if(!(options.round < 0)){
		value = number.round(value, maxPlaces, options.round);
	}

	var valueParts = String(Math.abs(value)).split("."),
		fractional = valueParts[1] || "";
	if(patternParts[1] || options.places){
		if(comma){
			options.places = options.places.substring(0, comma);
		}
		// Pad fractional with trailing zeros
		var pad = options.places !== undefined ? options.places : (patternParts[1] && patternParts[1].lastIndexOf("0") + 1);
		if(pad > fractional.length){
			valueParts[1] = dstring.pad(fractional, pad, '0', true);
		}

		// Truncate fractional
		if(maxPlaces < fractional.length){
			valueParts[1] = fractional.substr(0, maxPlaces);
		}
	}else{
		if(valueParts[1]){ valueParts.pop(); }
	}

	// Pad whole with leading zeros
	var patternDigits = patternParts[0].replace(',', '');
	pad = patternDigits.indexOf("0");
	if(pad != -1){
		pad = patternDigits.length - pad;
		if(pad > valueParts[0].length){
			valueParts[0] = dstring.pad(valueParts[0], pad);
		}

		// Truncate whole
		if(patternDigits.indexOf("#") == -1){
			valueParts[0] = valueParts[0].substr(valueParts[0].length - pad);
		}
	}

	// Add group separators
	var index = patternParts[0].lastIndexOf(','),
		groupSize, groupSize2;
	if(index != -1){
		groupSize = patternParts[0].length - index - 1;
		var remainder = patternParts[0].substr(0, index);
		index = remainder.lastIndexOf(',');
		if(index != -1){
			groupSize2 = remainder.length - index - 1;
		}
	}
	var pieces = [];
	for(var whole = valueParts[0]; whole;){
		var off = whole.length - groupSize;
		pieces.push((off > 0) ? whole.substr(off) : whole);
		whole = (off > 0) ? whole.slice(0, off) : "";
		if(groupSize2){
			groupSize = groupSize2;
			delete groupSize2;
		}
	}
	valueParts[0] = pieces.reverse().join(options.group || ",");

	return valueParts.join(options.decimal || ".");
};

/*=====
number.__RegexpOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// locale: String?
	//		override the locale used to determine formatting rules
	// strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	// places: Number|String?
	//		number of decimal places to accept: Infinity, a positive number, or
	//		a range "n,m".  Defined by pattern or Infinity if pattern not provided.
});
=====*/
number.regexp = function(/*number.__RegexpOptions?*/ options){
	// summary:
	//		Builds the regular needed to parse a number
	// description:
	//		Returns regular expression with positive and negative match, group
	//		and decimal separators
	return number._parseInfo(options).regexp; // String
};

number._parseInfo = function(/*Object?*/ options){
	options = options || {};
	var locale = i18n.normalizeLocale(options.locale),
		bundle = i18n.getLocalization("dojo.cldr", "number", locale),
		pattern = options.pattern || bundle[(options.type || "decimal") + "Format"],
//TODO: memoize?
		group = bundle.group,
		decimal = bundle.decimal,
		factor = 1;

	if(pattern.indexOf('%') != -1){
		factor /= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		factor /= 1000; // per mille
	}else{
		var isCurrency = pattern.indexOf('\u00a4') != -1;
		if(isCurrency){
			group = bundle.currencyGroup || group;
			decimal = bundle.currencyDecimal || decimal;
		}
	}

	//TODO: handle quoted escapes
	var patternList = pattern.split(';');
	if(patternList.length == 1){
		patternList.push("-" + patternList[0]);
	}

	var re = dregexp.buildGroupRE(patternList, function(pattern){
		pattern = "(?:"+dregexp.escapeString(pattern, '.')+")";
		return pattern.replace(number._numberPatternRE, function(format){
			var flags = {
				signed: false,
				separator: options.strict ? group : [group,""],
				fractional: options.fractional,
				decimal: decimal,
				exponent: false
				},

				parts = format.split('.'),
				places = options.places;

			// special condition for percent (factor != 1)
			// allow decimal places even if not specified in pattern
			if(parts.length == 1 && factor != 1){
			    parts[1] = "###";
			}
			if(parts.length == 1 || places === 0){
				flags.fractional = false;
			}else{
				if(places === undefined){ places = options.pattern ? parts[1].lastIndexOf('0') + 1 : Infinity; }
				if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
				if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
				flags.places = places;
			}
			var groups = parts[0].split(',');
			if(groups.length > 1){
				flags.groupSize = groups.pop().length;
				if(groups.length > 1){
					flags.groupSize2 = groups.pop().length;
				}
			}
			return "("+number._realNumberRegexp(flags)+")";
		});
	}, true);

	if(isCurrency){
		// substitute the currency symbol for the placeholder in the pattern
		re = re.replace(/([\s\xa0]*)(\u00a4{1,3})([\s\xa0]*)/g, function(match, before, target, after){
			var prop = ["symbol", "currency", "displayName"][target.length-1],
				symbol = dregexp.escapeString(options[prop] || options.currency || "");
			before = before ? "[\\s\\xa0]" : "";
			after = after ? "[\\s\\xa0]" : "";
			if(!options.strict){
				if(before){before += "*";}
				if(after){after += "*";}
				return "(?:"+before+symbol+after+")?";
			}
			return before+symbol+after;
		});
	}

//TODO: substitute localized sign/percent/permille/etc.?

	// normalize whitespace and return
	return {regexp: re.replace(/[\xa0 ]/g, "[\\s\\xa0]"), group: group, decimal: decimal, factor: factor}; // Object
};

/*=====
number.__ParseOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.  Literal characters in patterns are not supported.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// locale: String?
	//		override the locale used to determine formatting rules
	// strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	// fractional: Boolean|Array?
	//		Whether to include the fractional portion, where the number of decimal places are implied by pattern
	//		or explicit 'places' parameter.  The value [true,false] makes the fractional portion optional.
});
=====*/
number.parse = function(/*String*/ expression, /*number.__ParseOptions?*/ options){
	// summary:
	//		Convert a properly formatted string to a primitive Number, using
	//		locale-specific settings.
	// description:
	//		Create a Number from a string using a known localized pattern.
	//		Formatting patterns are chosen appropriate to the locale
	//		and follow the syntax described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
    	//		Note that literal characters in patterns are not supported.
	// expression:
	//		A string representation of a Number
	var info = number._parseInfo(options),
		results = (new RegExp("^"+info.regexp+"$")).exec(expression);
	if(!results){
		return NaN; //NaN
	}
	var absoluteMatch = results[1]; // match for the positive expression
	if(!results[1]){
		if(!results[2]){
			return NaN; //NaN
		}
		// matched the negative pattern
		absoluteMatch =results[2];
		info.factor *= -1;
	}

	// Transform it to something Javascript can parse as a number.  Normalize
	// decimal point and strip out group separators or alternate forms of whitespace
	absoluteMatch = absoluteMatch.
		replace(new RegExp("["+info.group + "\\s\\xa0"+"]", "g"), "").
		replace(info.decimal, ".");
	// Adjust for negative sign, percent, etc. as necessary
	return absoluteMatch * info.factor; //Number
};

/*=====
number.__RealNumberRegexpFlags = declare(null, {
	// places: Number?
	//		The integer number of decimal places or a range given as "n,m".  If
	//		not given, the decimal part is optional and the number of places is
	//		unlimited.
	// decimal: String?
	//		A string for the character used as the decimal point.  Default
	//		is ".".
	// fractional: Boolean|Array?
	//		Whether decimal places are used.  Can be true, false, or [true,
	//		false].  Default is [true, false] which means optional.
	// exponent: Boolean|Array?
	//		Express in exponential notation.  Can be true, false, or [true,
	//		false]. Default is [true, false], (i.e. will match if the
	//		exponential part is present are not).
	// eSigned: Boolean|Array?
	//		The leading plus-or-minus sign on the exponent.  Can be true,
	//		false, or [true, false].  Default is [true, false], (i.e. will
	//		match if it is signed or unsigned).  flags in regexp.integer can be
	//		applied.
});
=====*/

number._realNumberRegexp = function(/*__RealNumberRegexpFlags?*/ flags){
	// summary:
	//		Builds a regular expression to match a real number in exponential
	//		notation

	// assign default values to missing parameters
	flags = flags || {};
	//TODO: use mixin instead?
	if(!("places" in flags)){ flags.places = Infinity; }
	if(typeof flags.decimal != "string"){ flags.decimal = "."; }
	if(!("fractional" in flags) || /^0/.test(flags.places)){ flags.fractional = [true, false]; }
	if(!("exponent" in flags)){ flags.exponent = [true, false]; }
	if(!("eSigned" in flags)){ flags.eSigned = [true, false]; }

	var integerRE = number._integerRegexp(flags),
		decimalRE = dregexp.buildGroupRE(flags.fractional,
		function(q){
			var re = "";
			if(q && (flags.places!==0)){
				re = "\\" + flags.decimal;
				if(flags.places == Infinity){
					re = "(?:" + re + "\\d+)?";
				}else{
					re += "\\d{" + flags.places + "}";
				}
			}
			return re;
		},
		true
	);

	var exponentRE = dregexp.buildGroupRE(flags.exponent,
		function(q){
			if(q){ return "([eE]" + number._integerRegexp({ signed: flags.eSigned}) + ")"; }
			return "";
		}
	);

	var realRE = integerRE + decimalRE;
	// allow for decimals without integers, e.g. .25
	if(decimalRE){realRE = "(?:(?:"+ realRE + ")|(?:" + decimalRE + "))";}
	return realRE + exponentRE; // String
};

/*=====
number.__IntegerRegexpFlags = declare(null, {
	// signed: Boolean?
	//		The leading plus-or-minus sign. Can be true, false, or `[true,false]`.
	//		Default is `[true, false]`, (i.e. will match if it is signed
	//		or unsigned).
	// separator: String?
	//		The character used as the thousands separator. Default is no
	//		separator. For more than one symbol use an array, e.g. `[",", ""]`,
	//		makes ',' optional.
	// groupSize: Number?
	//		group size between separators
	// groupSize2: Number?
	//		second grouping, where separators 2..n have a different interval than the first separator (for India)
});
=====*/

number._integerRegexp = function(/*number.__IntegerRegexpFlags?*/ flags){
	// summary:
	//		Builds a regular expression that matches an integer

	// assign default values to missing parameters
	flags = flags || {};
	if(!("signed" in flags)){ flags.signed = [true, false]; }
	if(!("separator" in flags)){
		flags.separator = "";
	}else if(!("groupSize" in flags)){
		flags.groupSize = 3;
	}

	var signRE = dregexp.buildGroupRE(flags.signed,
		function(q){ return q ? "[-+]" : ""; },
		true
	);

	var numberRE = dregexp.buildGroupRE(flags.separator,
		function(sep){
			if(!sep){
				return "(?:\\d+)";
			}

			sep = dregexp.escapeString(sep);
			if(sep == " "){ sep = "\\s"; }
			else if(sep == "\xa0"){ sep = "\\s\\xa0"; }

			var grp = flags.groupSize, grp2 = flags.groupSize2;
			//TODO: should we continue to enforce that numbers with separators begin with 1-9?  See #6933
			if(grp2){
				var grp2RE = "(?:0|[1-9]\\d{0," + (grp2-1) + "}(?:[" + sep + "]\\d{" + grp2 + "})*[" + sep + "]\\d{" + grp + "})";
				return ((grp-grp2) > 0) ? "(?:" + grp2RE + "|(?:0|[1-9]\\d{0," + (grp-1) + "}))" : grp2RE;
			}
			return "(?:0|[1-9]\\d{0," + (grp-1) + "}(?:[" + sep + "]\\d{" + grp + "})*)";
		},
		true
	);

	return signRE + numberRE; // String
};

return number;
});

},
'dojo/cldr/monetary':function(){
define(["../_base/kernel", "../_base/lang"], function(dojo, lang){

// module:
//		dojo/cldr/monetary

var monetary = {
	// summary:
	//		TODOC
};
lang.setObject("dojo.cldr.monetary", monetary);

monetary.getData = function(/*String*/ code){
	// summary:
	//		A mapping of currency code to currency-specific formatting information. Returns a unique object with properties: places, round.
	// code:
	//		an [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/currencyData/fractions

	var placesData = {
		ADP:0,AFN:0,ALL:0,AMD:0,BHD:3,BIF:0,BYR:0,CLF:0,CLP:0,
		COP:0,CRC:0,DJF:0,ESP:0,GNF:0,GYD:0,HUF:0,IDR:0,IQD:0,
		IRR:3,ISK:0,ITL:0,JOD:3,JPY:0,KMF:0,KPW:0,KRW:0,KWD:3,
		LAK:0,LBP:0,LUF:0,LYD:3,MGA:0,MGF:0,MMK:0,MNT:0,MRO:0,
		MUR:0,OMR:3,PKR:0,PYG:0,RSD:0,RWF:0,SLL:0,SOS:0,STD:0,
		SYP:0,TMM:0,TND:3,TRL:0,TZS:0,UGX:0,UZS:0,VND:0,VUV:0,
		XAF:0,XOF:0,XPF:0,YER:0,ZMK:0,ZWD:0
	};

	var roundingData = {};

	var places = placesData[code], round = roundingData[code];
	if(typeof places == "undefined"){ places = 2; }
	if(typeof round == "undefined"){ round = 0; }

	return {places: places, round: round}; // Object
};

return monetary;
});

},
'dijit/form/NumberTextBox':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.hitch lang.mixin
	"dojo/number", // number._realNumberRegexp number.format number.parse number.regexp
	"./RangeBoundTextBox"
], function(declare, lang, number, RangeBoundTextBox){

	// module:
	//		dijit/form/NumberTextBox


	var NumberTextBoxMixin = declare("dijit.form.NumberTextBoxMixin", null, {
		// summary:
		//		A mixin for all number textboxes
		// tags:
		//		protected

		// Override ValidationTextBox.pattern.... we use a reg-ex generating function rather
		// than a straight regexp to deal with locale (plus formatting options too?)
		pattern: function(constraints){
			// if focused, accept either currency data or NumberTextBox format
			return '(' + (this.focused && this.editOptions ? this._regExpGenerator(lang.delegate(constraints, this.editOptions)) + '|' : '')
				+ this._regExpGenerator(constraints) + ')';
		},

		/*=====
		// constraints: NumberTextBox.__Constraints
		//		Despite the name, this parameter specifies both constraints on the input
		//		(including minimum/maximum allowed values) as well as
		//		formatting options like places (the number of digits to display after
		//		the decimal point).
		constraints: {},
		======*/

		// value: Number
		//		The value of this NumberTextBox as a Javascript Number (i.e., not a String).
		//		If the displayed value is blank, the value is NaN, and if the user types in
		//		an gibberish value (like "hello world"), the value is undefined
		//		(i.e. get('value') returns undefined).
		//
		//		Symmetrically, set('value', NaN) will clear the displayed value,
		//		whereas set('value', undefined) will have no effect.
		value: NaN,

		// editOptions: [protected] Object
		//		Properties to mix into constraints when the value is being edited.
		//		This is here because we edit the number in the format "12345", which is
		//		different than the display value (ex: "12,345")
		editOptions: { pattern: '#.######' },

		/*=====
		_formatter: function(value, options){
			// summary:
			//		_formatter() is called by format().  It's the base routine for formatting a number,
			//		as a string, for example converting 12345 into "12,345".
			// value: Number
			//		The number to be converted into a string.
			// options: number.__FormatOptions?
			//		Formatting options
			// tags:
			//		protected extension

			return "12345";		// String
		},
		 =====*/
		_formatter: number.format,

		/*=====
		_regExpGenerator: function(constraints){
			// summary:
			//		Generate a localized regular expression as a string, according to constraints.
			// constraints: number.__ParseOptions
			//		Formatting options
			// tags:
			//		protected

			return "(\d*).(\d*)";	// string
		},
		=====*/
		_regExpGenerator: number.regexp,

		postMixInProperties: function(){
			this.inherited(arguments);
			this._set("type", "text"); // in case type="number" was specified which messes up parse/format
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			var places = typeof constraints.places == "number"? constraints.places : 0;
			if(places){ places++; } // decimal rounding errors take away another digit of precision
			if(typeof constraints.max != "number"){
				constraints.max = 9 * Math.pow(10, 15-places);
			}
			if(typeof constraints.min != "number"){
				constraints.min = -9 * Math.pow(10, 15-places);
			}
			this.inherited(arguments, [ constraints ]);
			if(this.focusNode && this.focusNode.value && !isNaN(this.value)){
				this.set('value', this.value);
			}
		},

		_onFocus: function(){
			if(this.disabled || this.readOnly){ return; }
			var val = this.get('value');
			if(typeof val == "number" && !isNaN(val)){
				var formattedValue = this.format(val, this.constraints);
				if(formattedValue !== undefined){
					this.textbox.value = formattedValue;
				}
			}
			this.inherited(arguments);
		},

		format: function(/*Number*/ value, /*number.__FormatOptions*/ constraints){
			// summary:
			//		Formats the value as a Number, according to constraints.
			// tags:
			//		protected

			var formattedValue = String(value);
			if(typeof value != "number"){ return formattedValue; }
			if(isNaN(value)){ return ""; }
			// check for exponential notation that dojo/number.format() chokes on
			if(!("rangeCheck" in this && this.rangeCheck(value, constraints)) && constraints.exponent !== false && /\de[-+]?\d/i.test(formattedValue)){
				return formattedValue;
			}
			if(this.editOptions && this.focused){
				constraints = lang.mixin({}, constraints, this.editOptions);
			}
			return this._formatter(value, constraints);
		},

		/*=====
		_parser: function(value, constraints){
			// summary:
			//		Parses the string value as a Number, according to constraints.
			// value: String
			//		String representing a number
			// constraints: number.__ParseOptions
			//		Formatting options
			// tags:
			//		protected

			return 123.45;		// Number
		},
		=====*/
		_parser: number.parse,

		parse: function(/*String*/ value, /*number.__FormatOptions*/ constraints){
			// summary:
			//		Replaceable function to convert a formatted string to a number value
			// tags:
			//		protected extension

			var v = this._parser(value, lang.mixin({}, constraints, (this.editOptions && this.focused) ? this.editOptions : {}));
			if(this.editOptions && this.focused && isNaN(v)){
				v = this._parser(value, constraints); // parse w/o editOptions: not technically needed but is nice for the user
			}
			return v;
		},

		_getDisplayedValueAttr: function(){
			var v = this.inherited(arguments);
			return isNaN(v) ? this.textbox.value : v;
		},

		filter: function(/*Number*/ value){
			// summary:
			//		This is called with both the display value (string), and the actual value (a number).
			//		When called with the actual value it does corrections so that '' etc. are represented as NaN.
			//		Otherwise it dispatches to the superclass's filter() method.
			//
			//		See `dijit/form/TextBox.filter()` for more details.
			return (value == null /* or undefined */ || value === '') ? NaN : this.inherited(arguments); // set('value', null||''||undefined) should fire onChange(NaN)
		},

		serialize: function(/*Number*/ value, /*Object?*/ options){
			// summary:
			//		Convert value (a Number) into a canonical string (ie, how the number literal is written in javascript/java/C/etc.)
			// tags:
			//		protected
			return (typeof value != "number" || isNaN(value)) ? '' : this.inherited(arguments);
		},

		_setBlurValue: function(){
			var val = lang.hitch(lang.delegate(this, { focused: true }), "get")('value'); // parse with editOptions
			this._setValueAttr(val, true);
		},

		_setValueAttr: function(/*Number*/ value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Hook so set('value', ...) works.
			if(value !== undefined && formattedValue === undefined){
				formattedValue = String(value);
				if(typeof value == "number"){
					if(isNaN(value)){ formattedValue = '' }
					// check for exponential notation that number.format chokes on
					else if(("rangeCheck" in this && this.rangeCheck(value, this.constraints)) || this.constraints.exponent === false || !/\de[-+]?\d/i.test(formattedValue)){
						formattedValue = undefined; // lets format compute a real string value
					}
				}else if(!value){ // 0 processed in if branch above, ''|null|undefined flows through here
					formattedValue = '';
					value = NaN;
				}else{ // non-numeric values
					value = undefined;
				}
			}
			this.inherited(arguments, [value, priorityChange, formattedValue]);
		},

		_getValueAttr: function(){
			// summary:
			//		Hook so get('value') works.
			//		Returns Number, NaN for '', or undefined for unparseable text
			var v = this.inherited(arguments); // returns Number for all values accepted by parse() or NaN for all other displayed values

			// If the displayed value of the textbox is gibberish (ex: "hello world"), this.inherited() above
			// returns NaN; this if() branch converts the return value to undefined.
			// Returning undefined prevents user text from being overwritten when doing _setValueAttr(_getValueAttr()).
			// A blank displayed value is still returned as NaN.
			if(isNaN(v) && this.textbox.value !== ''){
				if(this.constraints.exponent !== false && /\de[-+]?\d/i.test(this.textbox.value) && (new RegExp("^"+number._realNumberRegexp(lang.delegate(this.constraints))+"$").test(this.textbox.value))){	// check for exponential notation that parse() rejected (erroneously?)
					var n = Number(this.textbox.value);
					return isNaN(n) ? undefined : n; // return exponential Number or undefined for random text (may not be possible to do with the above RegExp check)
				}else{
					return undefined; // gibberish
				}
			}else{
				return v; // Number or NaN for ''
			}
		},

		isValid: function(/*Boolean*/ isFocused){
			// Overrides dijit/form/RangeBoundTextBox.isValid() to check that the editing-mode value is valid since
			// it may not be formatted according to the regExp validation rules
			if(!this.focused || this._isEmpty(this.textbox.value)){
				return this.inherited(arguments);
			}else{
				var v = this.get('value');
				if(!isNaN(v) && this.rangeCheck(v, this.constraints)){
					if(this.constraints.exponent !== false && /\de[-+]?\d/i.test(this.textbox.value)){ // exponential, parse doesn't like it
						return true; // valid exponential number in range
					}else{
						return this.inherited(arguments);
					}
				}else{
					return false;
				}
			}
		}
	});

	var NumberTextBox = declare("dijit.form.NumberTextBox", [RangeBoundTextBox, NumberTextBoxMixin], {
		// summary:
		//		A TextBox for entering numbers, with formatting and range checking
		// description:
		//		NumberTextBox is a textbox for entering and displaying numbers, supporting
		//		the following main features:
		//
		//		1. Enforce minimum/maximum allowed values (as well as enforcing that the user types
		//			a number rather than a random string)
		//		2. NLS support (altering roles of comma and dot as "thousands-separator" and "decimal-point"
		//			depending on locale).
		//		3. Separate modes for editing the value and displaying it, specifically that
		//			the thousands separator character (typically comma) disappears when editing
		//			but reappears after the field is blurred.
		//		4. Formatting and constraints regarding the number of places (digits after the decimal point)
		//			allowed on input, and number of places displayed when blurred (see `constraints` parameter).

		baseClass: "dijitTextBox dijitNumberTextBox"
	});

	NumberTextBox.Mixin = NumberTextBoxMixin;	// for monkey patching

	/*=====
	 NumberTextBox.__Constraints = declare([RangeBoundTextBox.__Constraints, number.__FormatOptions, number.__ParseOptions], {
		 // summary:
		 //		Specifies both the rules on valid/invalid values (minimum, maximum,
		 //		number of required decimal places), and also formatting options for
		 //		displaying the value when the field is not focused.
		 // example:
		 //		Minimum/maximum:
		 //		To specify a field between 0 and 120:
		 //	|		{min:0,max:120}
		 //		To specify a field that must be an integer:
		 //	|		{fractional:false}
		 //		To specify a field where 0 to 3 decimal places are allowed on input:
		 //	|		{places:'0,3'}
	 });
	 =====*/

	return NumberTextBox;
});

},
'dijit/form/NumberSpinner':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/keys", // keys.END keys.HOME
	"./_Spinner",
	"./NumberTextBox"
], function(declare, keys, _Spinner, NumberTextBox){

	// module:
	//		dijit/form/NumberSpinner

	return declare("dijit.form.NumberSpinner", [_Spinner, NumberTextBox.Mixin], {
		// summary:
		//		Extends NumberTextBox to add up/down arrows and pageup/pagedown for incremental change to the value
		//
		// description:
		//		A `dijit/form/NumberTextBox` extension to provide keyboard accessible value selection
		//		as well as icons for spinning direction. When using the keyboard, the typematic rules
		//		apply, meaning holding the key will gradually increase or decrease the value and
		//		accelerate.
		//
		// example:
		//	| new NumberSpinner({ constraints:{ max:300, min:100 }}, "someInput");

		baseClass: "dijitTextBox dijitSpinner dijitNumberTextBox",

		adjust: function(/*Object*/ val, /*Number*/ delta){
			// summary:
			//		Change Number val by the given amount
			// tags:
			//		protected

			var tc = this.constraints,
				v = isNaN(val),
				gotMax = !isNaN(tc.max),
				gotMin = !isNaN(tc.min)
				;
			if(v && delta != 0){ // blank or invalid value and they want to spin, so create defaults
				val = (delta > 0) ?
					gotMin ? tc.min : gotMax ? tc.max : 0 :
					gotMax ? this.constraints.max : gotMin ? tc.min : 0
				;
			}
			var newval = val + delta;
			if(v || isNaN(newval)){
				return val;
			}
			if(gotMax && (newval > tc.max)){
				newval = tc.max;
			}
			if(gotMin && (newval < tc.min)){
				newval = tc.min;
			}
			return newval;
		},

		_onKeyDown: function(e){
			if(this.disabled || this.readOnly){
				return;
			}
			if((e.keyCode == keys.HOME || e.keyCode == keys.END) && !(e.ctrlKey || e.altKey || e.metaKey)
				&& typeof this.get('value') != 'undefined' /* gibberish, so HOME and END are default editing keys*/){
				var value = this.constraints[(e.keyCode == keys.HOME ? "min" : "max")];
				if(typeof value == "number"){
					this._setValueAttr(value, false);
				}
				// eat home or end key whether we change the value or not
				e.stopPropagation();
				e.preventDefault();
			}
		}
	});
});

},
'dijit/form/_Spinner':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/keys", // keys keys.DOWN_ARROW keys.PAGE_DOWN keys.PAGE_UP keys.UP_ARROW
	"dojo/_base/lang", // lang.hitch
	"dojo/sniff", // has("mozilla")
	"dojo/mouse", // mouse.wheel
	"dojo/on",
	"../typematic",
	"./RangeBoundTextBox",
	"dojo/text!./templates/Spinner.html",
	"./_TextBoxMixin"    // selectInputText
], function(declare, keys, lang, has, mouse, on, typematic, RangeBoundTextBox, template, _TextBoxMixin){

	// module:
	//		dijit/form/_Spinner

	return declare("dijit.form._Spinner", RangeBoundTextBox, {
		// summary:
		//		Mixin for validation widgets with a spinner.
		// description:
		//		This class basically (conceptually) extends `dijit/form/ValidationTextBox`.
		//		It modifies the template to have up/down arrows, and provides related handling code.

		// defaultTimeout: Number
		//		Number of milliseconds before a held arrow key or up/down button becomes typematic
		defaultTimeout: 500,

		// minimumTimeout: Number
		//		minimum number of milliseconds that typematic event fires when held key or button is held
		minimumTimeout: 10,

		// timeoutChangeRate: Number
		//		Fraction of time used to change the typematic timer between events.
		//		1.0 means that each typematic event fires at defaultTimeout intervals.
		//		Less than 1.0 means that each typematic event fires at an increasing faster rate.
		timeoutChangeRate: 0.90,

		// smallDelta: Number
		//		Adjust the value by this much when spinning using the arrow keys/buttons
		smallDelta: 1,

		// largeDelta: Number
		//		Adjust the value by this much when spinning using the PgUp/Dn keys
		largeDelta: 10,

		templateString: template,

		baseClass: "dijitTextBox dijitSpinner",

		// Set classes like dijitUpArrowButtonHover or dijitDownArrowButtonActive depending on
		// mouse action over specified node
		cssStateNodes: {
			"upArrowNode": "dijitUpArrowButton",
			"downArrowNode": "dijitDownArrowButton"
		},

		adjust: function(val /*=====, delta =====*/){
			// summary:
			//		Overridable function used to adjust a primitive value(Number/Date/...) by the delta amount specified.
			//		The val is adjusted in a way that makes sense to the object type.
			// val: Object
			// delta: Number
			// tags:
			//		protected extension
			return val;
		},

		_arrowPressed: function(/*Node*/ nodePressed, /*Number*/ direction, /*Number*/ increment){
			// summary:
			//		Handler for arrow button or arrow key being pressed
			if(this.disabled || this.readOnly){
				return;
			}
			this._setValueAttr(this.adjust(this.get('value'), direction * increment), false);
			_TextBoxMixin.selectInputText(this.textbox, this.textbox.value.length);
		},

		_arrowReleased: function(/*Node*/ /*===== node =====*/){
			// summary:
			//		Handler for arrow button or arrow key being released
			this._wheelTimer = null;
		},

		_typematicCallback: function(/*Number*/ count, /*DOMNode*/ node, /*Event*/ evt){
			var inc = this.smallDelta;
			if(node == this.textbox){
				var key = evt.keyCode;
				inc = (key == keys.PAGE_UP || key == keys.PAGE_DOWN) ? this.largeDelta : this.smallDelta;
				node = (key == keys.UP_ARROW || key == keys.PAGE_UP) ? this.upArrowNode : this.downArrowNode;
			}
			if(count == -1){
				this._arrowReleased(node);
			}
			else{
				this._arrowPressed(node, (node == this.upArrowNode) ? 1 : -1, inc);
			}
		},

		_wheelTimer: null,
		_mouseWheeled: function(/*Event*/ evt){
			// summary:
			//		Mouse wheel listener where supported

			evt.stopPropagation();
			evt.preventDefault();
			// FIXME: Safari bubbles

			// be nice to DOH and scroll as much as the event says to
			var wheelDelta = evt.wheelDelta / 120;
			if(Math.floor(wheelDelta) != wheelDelta){
				// If not an int multiple of 120, then its touchpad scrolling.
				// This can change very fast so just assume 1 wheel click to make it more manageable.
				wheelDelta = evt.wheelDelta > 0 ? 1 : -1;
			}
			var scrollAmount = evt.detail ? (evt.detail * -1) : wheelDelta;
			if(scrollAmount !== 0){
				var node = this[(scrollAmount > 0 ? "upArrowNode" : "downArrowNode" )];

				this._arrowPressed(node, scrollAmount, this.smallDelta);

				if(this._wheelTimer){
					this._wheelTimer.remove();
				}
				this._wheelTimer = this.defer(function(){
					this._arrowReleased(node);
				}, 50);
			}
		},

		_setConstraintsAttr: function(/*Object*/ constraints){
			this.inherited(arguments);
			if(this.focusNode){ // not set when called from postMixInProperties
				if(this.constraints.min !== undefined){
					this.focusNode.setAttribute("aria-valuemin", this.constraints.min);
				}else{
					this.focusNode.removeAttribute("aria-valuemin");
				}
				if(this.constraints.max !== undefined){
					this.focusNode.setAttribute("aria-valuemax", this.constraints.max);
				}else{
					this.focusNode.removeAttribute("aria-valuemax");
				}
			}
		},

		_setValueAttr: function(/*Number*/ value, /*Boolean?*/ priorityChange){
			// summary:
			//		Hook so set('value', ...) works.

			this.focusNode.setAttribute("aria-valuenow", value);
			this.inherited(arguments);
		},

		postCreate: function(){
			this.inherited(arguments);

			// extra listeners
			this.own(
				on(this.domNode, mouse.wheel, lang.hitch(this, "_mouseWheeled")),
				typematic.addListener(this.upArrowNode, this.textbox, {keyCode: keys.UP_ARROW, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout),
				typematic.addListener(this.downArrowNode, this.textbox, {keyCode: keys.DOWN_ARROW, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout),
				typematic.addListener(this.upArrowNode, this.textbox, {keyCode: keys.PAGE_UP, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout),
				typematic.addListener(this.downArrowNode, this.textbox, {keyCode: keys.PAGE_DOWN, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout, this.minimumTimeout)
			);
		}
	});
});

},
'dijit/typematic':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/connect", // connect._keyPress
	"dojo/_base/lang", // lang.mixin, lang.hitch
	"dojo/on",
	"dojo/sniff", // has("ie")
	"./main"        // setting dijit.typematic global
], function(array, connect, lang, on, has, dijit){

	// module:
	//		dijit/typematic

	var typematic = (dijit.typematic = {
		// summary:
		//		These functions are used to repetitively call a user specified callback
		//		method when a specific key or mouse click over a specific DOM node is
		//		held down for a specific amount of time.
		//		Only 1 such event is allowed to occur on the browser page at 1 time.

		_fireEventAndReload: function(){
			this._timer = null;
			this._callback(++this._count, this._node, this._evt);

			// Schedule next event, timer is at most minDelay (default 10ms) to avoid
			// browser overload (particularly avoiding starving DOH robot so it never gets to send a mouseup)
			this._currentTimeout = Math.max(
				this._currentTimeout < 0 ? this._initialDelay :
					(this._subsequentDelay > 1 ? this._subsequentDelay : Math.round(this._currentTimeout * this._subsequentDelay)),
				this._minDelay);
			this._timer = setTimeout(lang.hitch(this, "_fireEventAndReload"), this._currentTimeout);
		},

		trigger: function(/*Event*/ evt, /*Object*/ _this, /*DOMNode*/ node, /*Function*/ callback, /*Object*/ obj, /*Number?*/ subsequentDelay, /*Number?*/ initialDelay, /*Number?*/ minDelay){
			// summary:
			//		Start a timed, repeating callback sequence.
			//		If already started, the function call is ignored.
			//		This method is not normally called by the user but can be
			//		when the normal listener code is insufficient.
			// evt:
			//		key or mouse event object to pass to the user callback
			// _this:
			//		pointer to the user's widget space.
			// node:
			//		the DOM node object to pass the the callback function
			// callback:
			//		function to call until the sequence is stopped called with 3 parameters:
			// count:
			//		integer representing number of repeated calls (0..n) with -1 indicating the iteration has stopped
			// node:
			//		the DOM node object passed in
			// evt:
			//		key or mouse event object
			// obj:
			//		user space object used to uniquely identify each typematic sequence
			// subsequentDelay:
			//		if > 1, the number of milliseconds until the 3->n events occur
			//		or else the fractional time multiplier for the next event's delay, default=0.9
			// initialDelay:
			//		the number of milliseconds until the 2nd event occurs, default=500ms
			// minDelay:
			//		the maximum delay in milliseconds for event to fire, default=10ms
			if(obj != this._obj){
				this.stop();
				this._initialDelay = initialDelay || 500;
				this._subsequentDelay = subsequentDelay || 0.90;
				this._minDelay = minDelay || 10;
				this._obj = obj;
				this._node = node;
				this._currentTimeout = -1;
				this._count = -1;
				this._callback = lang.hitch(_this, callback);
				this._evt = { faux: true };
				for(var attr in evt){
					if(attr != "layerX" && attr != "layerY"){ // prevent WebKit warnings
						var v = evt[attr];
						if(typeof v != "function" && typeof v != "undefined"){
							this._evt[attr] = v
						}
					}
				}
				this._fireEventAndReload();
			}
		},

		stop: function(){
			// summary:
			//		Stop an ongoing timed, repeating callback sequence.
			if(this._timer){
				clearTimeout(this._timer);
				this._timer = null;
			}
			if(this._obj){
				this._callback(-1, this._node, this._evt);
				this._obj = null;
			}
		},

		addKeyListener: function(/*DOMNode*/ node, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay, /*Number?*/ minDelay){
			// summary:
			//		Start listening for a specific typematic key.
			//		See also the trigger method for other parameters.
			// keyObject:
			//		an object defining the key to listen for:
			//
			//		- keyCode: the keyCode (number) to listen for, used for non-printable keys
			//		- charCode: the charCode (number) to listen for, used for printable keys
			//		- charOrCode: deprecated, use keyCode or charCode
			//		- ctrlKey: desired ctrl key state to initiate the callback sequence:
			//			- pressed (true)
			//			- released (false)
			//			- either (unspecified)
			//		- altKey: same as ctrlKey but for the alt key
			//		- shiftKey: same as ctrlKey but for the shift key
			// returns:
			//		a connection handle

			// Setup keydown or keypress listener depending on whether keyCode or charCode was specified.
			// If charOrCode is specified use deprecated connect._keypress synthetic event (remove for 2.0)
			var type = "keyCode" in keyObject ? "keydown" : "charCode" in keyObject ? "keypress" : connect._keypress,
				attr = "keyCode" in keyObject ? "keyCode" : "charCode" in keyObject ? "charCode" : "charOrCode";

			var handles = [
				on(node, type, lang.hitch(this, function(evt){
					if(evt[attr] == keyObject[attr] &&
						(keyObject.ctrlKey === undefined || keyObject.ctrlKey == evt.ctrlKey) &&
						(keyObject.altKey === undefined || keyObject.altKey == evt.altKey) &&
						(keyObject.metaKey === undefined || keyObject.metaKey == (evt.metaKey || false)) && // IE doesn't even set metaKey
						(keyObject.shiftKey === undefined || keyObject.shiftKey == evt.shiftKey)){
						evt.stopPropagation();
						evt.preventDefault();
						typematic.trigger(evt, _this, node, callback, keyObject, subsequentDelay, initialDelay, minDelay);
					}else if(typematic._obj == keyObject){
						typematic.stop();
					}
				})),
				on(node, "keyup", lang.hitch(this, function(){
					if(typematic._obj == keyObject){
						typematic.stop();
					}
				}))
			];
			return { remove: function(){
				array.forEach(handles, function(h){
					h.remove();
				});
			} };
		},

		addMouseListener: function(/*DOMNode*/ node, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay, /*Number?*/ minDelay){
			// summary:
			//		Start listening for a typematic mouse click.
			//		See the trigger method for other parameters.
			// returns:
			//		a connection handle
			var handles = [
				on(node, "mousedown", lang.hitch(this, function(evt){
					evt.preventDefault();
					typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay, minDelay);
				})),
				on(node, "mouseup", lang.hitch(this, function(evt){
					if(this._obj){
						evt.preventDefault();
					}
					typematic.stop();
				})),
				on(node, "mouseout", lang.hitch(this, function(evt){
					if(this._obj){
						evt.preventDefault();
					}
					typematic.stop();
				})),
				on(node, "dblclick", lang.hitch(this, function(evt){
					evt.preventDefault();
					if(has("ie") < 9){
						typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay, minDelay);
						setTimeout(lang.hitch(this, typematic.stop), 50);
					}
				}))
			];
			return { remove: function(){
				array.forEach(handles, function(h){
					h.remove();
				});
			} };
		},

		addListener: function(/*Node*/ mouseNode, /*Node*/ keyNode, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay, /*Number?*/ minDelay){
			// summary:
			//		Start listening for a specific typematic key and mouseclick.
			//		This is a thin wrapper to addKeyListener and addMouseListener.
			//		See the addMouseListener and addKeyListener methods for other parameters.
			// mouseNode:
			//		the DOM node object to listen on for mouse events.
			// keyNode:
			//		the DOM node object to listen on for key events.
			// returns:
			//		a connection handle
			var handles = [
				this.addKeyListener(keyNode, keyObject, _this, callback, subsequentDelay, initialDelay, minDelay),
				this.addMouseListener(mouseNode, _this, callback, subsequentDelay, initialDelay, minDelay)
			];
			return { remove: function(){
				array.forEach(handles, function(h){
					h.remove();
				});
			} };
		}
	});

	return typematic;
});

},
'dijit/form/ComboBox':function(){
define([
	"dojo/_base/declare", // declare
	"./ValidationTextBox",
	"./ComboBoxMixin"
], function(declare, ValidationTextBox, ComboBoxMixin){

	// module:
	//		dijit/form/ComboBox

	return declare("dijit.form.ComboBox", [ValidationTextBox, ComboBoxMixin], {
		// summary:
		//		Auto-completing text box
		//
		// description:
		//		The drop down box's values are populated from an class called
		//		a data provider, which returns a list of values based on the characters
		//		that the user has typed into the input box.
		//		If OPTION tags are used as the data provider via markup,
		//		then the OPTION tag's child text node is used as the widget value
		//		when selected.  The OPTION tag's value attribute is ignored.
		//		To set the default value when using OPTION tags, specify the selected
		//		attribute on 1 of the child OPTION tags.
		//
		//		Some of the options to the ComboBox are actually arguments to the data
		//		provider.
	});
});

},
'dijit/form/ComboBoxMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/Deferred",
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.mixin
	"dojo/store/util/QueryResults",
	"./_AutoCompleterMixin",
	"./_ComboBoxMenu",
	"../_HasDropDown",
	"dojo/text!./templates/DropDownBox.html"
], function(declare, Deferred, kernel, lang, QueryResults, _AutoCompleterMixin, _ComboBoxMenu, _HasDropDown, template){


	// module:
	//		dijit/form/ComboBoxMixin

	return declare("dijit.form.ComboBoxMixin", [_HasDropDown, _AutoCompleterMixin], {
		// summary:
		//		Provides main functionality of ComboBox widget

		// dropDownClass: [protected extension] Function String
		//		Dropdown widget class used to select a date/time.
		//		Subclasses should specify this.
		dropDownClass: _ComboBoxMenu,

		// hasDownArrow: Boolean
		//		Set this textbox to have a down arrow button, to display the drop down list.
		//		Defaults to true.
		hasDownArrow: true,

		templateString: template,

		baseClass: "dijitTextBox dijitComboBox",

		/*=====
		// store: [const] dojo/store/api/Store|dojo/data/api/Read
		//		Reference to data provider object used by this ComboBox.
		//
		//		Should be dojo/store/api/Store, but dojo/data/api/Read supported
		//		for backwards compatibility.
		store: null,
		=====*/

		// Set classes like dijitDownArrowButtonHover depending on
		// mouse action over button node
		cssStateNodes: {
			"_buttonNode": "dijitDownArrowButton"
		},

		_setHasDownArrowAttr: function(/*Boolean*/ val){
			this._set("hasDownArrow", val);
			this._buttonNode.style.display = val ? "" : "none";
		},

		_showResultList: function(){
			// hide the tooltip
			this.displayMessage("");
			this.inherited(arguments);
		},

		_setStoreAttr: function(store){
			// For backwards-compatibility, accept dojo.data store in addition to dojo/store/api/Store.  Remove in 2.0.
			if(!store.get){
				lang.mixin(store, {
					_oldAPI: true,
					get: function(id){
						// summary:
						//		Retrieves an object by it's identity. This will trigger a fetchItemByIdentity.
						//		Like dojo/store/DataStore.get() except returns native item.
						var deferred = new Deferred();
						this.fetchItemByIdentity({
							identity: id,
							onItem: function(object){
								deferred.resolve(object);
							},
							onError: function(error){
								deferred.reject(error);
							}
						});
						return deferred.promise;
					},
					query: function(query, options){
						// summary:
						//		Queries the store for objects.   Like dojo/store/DataStore.query()
						//		except returned Deferred contains array of native items.
						var deferred = new Deferred(function(){ fetchHandle.abort && fetchHandle.abort(); });
						deferred.total = new Deferred();
						var fetchHandle = this.fetch(lang.mixin({
							query: query,
							onBegin: function(count){
								deferred.total.resolve(count);
							},
							onComplete: function(results){
								deferred.resolve(results);
							},
							onError: function(error){
								deferred.reject(error);
							}
						}, options));
						return QueryResults(deferred);
					}
				});
			}
			this._set("store", store);
		},

		postMixInProperties: function(){
			// Since _setValueAttr() depends on this.store, _setStoreAttr() needs to execute first.
			// Unfortunately, without special code, it ends up executing second.
			var store = this.params.store || this.store;
			if(store){
				this._setStoreAttr(store);
			}

			this.inherited(arguments);

			// User may try to access this.store.getValue() etc.  in a custom labelFunc() function.
			// It's not available with the new data store for handling inline <option> tags, so add it.
			if(!this.params.store && !this.store._oldAPI){
				var clazz = this.declaredClass;
				lang.mixin(this.store, {
					getValue: function(item, attr){
						kernel.deprecated(clazz + ".store.getValue(item, attr) is deprecated for builtin store.  Use item.attr directly", "", "2.0");
						return item[attr];
					},
					getLabel: function(item){
						kernel.deprecated(clazz + ".store.getLabel(item) is deprecated for builtin store.  Use item.label directly", "", "2.0");
						return item.name;
					},
					fetch: function(args){
						kernel.deprecated(clazz + ".store.fetch() is deprecated for builtin store.", "Use store.query()", "2.0");
						var shim = ["dojo/data/ObjectStore"];	// indirection so it doesn't get rolled into a build
						require(shim, lang.hitch(this, function(ObjectStore){
							new ObjectStore({objectStore: this}).fetch(args);
						}));
					}
				});
			}
		}
	});
});

},
'dojo/store/util/QueryResults':function(){
define(["../../_base/array", "../../_base/lang", "../../when"
], function(array, lang, when){

// module:
//		dojo/store/util/QueryResults

var QueryResults = function(results){
	// summary:
	//		A function that wraps the results of a store query with additional
	//		methods.
	// description:
	//		QueryResults is a basic wrapper that allows for array-like iteration
	//		over any kind of returned data from a query.  While the simplest store
	//		will return a plain array of data, other stores may return deferreds or
	//		promises; this wrapper makes sure that *all* results can be treated
	//		the same.
	//
	//		Additional methods include `forEach`, `filter` and `map`.
	// results: Array|dojo/promise/Promise
	//		The result set as an array, or a promise for an array.
	// returns:
	//		An array-like object that can be used for iterating over.
	// example:
	//		Query a store and iterate over the results.
	//
	//	|	store.query({ prime: true }).forEach(function(item){
	//	|		//	do something
	//	|	});

	if(!results){
		return results;
	}
	// if it is a promise it may be frozen
	if(results.then){
		results = lang.delegate(results);
	}
	function addIterativeMethod(method){
		if(!results[method]){
			results[method] = function(){
				var args = arguments;
				return when(results, function(results){
					Array.prototype.unshift.call(args, results);
					return QueryResults(array[method].apply(array, args));
				});
			};
		}
	}
	addIterativeMethod("forEach");
	addIterativeMethod("filter");
	addIterativeMethod("map");
	if(!results.total){
		results.total = when(results, function(results){
			return results.length;
		});
	}
	return results; // Object
};

lang.setObject("dojo.store.util.QueryResults", QueryResults);

return QueryResults;

});

},
'dijit/form/_AutoCompleterMixin':function(){
define([
	"dojo/aspect",
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.get
	"dojo/keys",
	"dojo/_base/lang", // lang.clone lang.hitch
	"dojo/query", // query
	"dojo/regexp", // regexp.escapeString
	"dojo/sniff", // has("ie")
	"./DataList",
	"./_TextBoxMixin", // defines _TextBoxMixin.selectInputText
	"./_SearchMixin"
], function(aspect, declare, domAttr, keys, lang, query, regexp, has, DataList, _TextBoxMixin, SearchMixin){

	// module:
	//		dijit/form/_AutoCompleterMixin

	var AutoCompleterMixin = declare("dijit.form._AutoCompleterMixin", SearchMixin, {
		// summary:
		//		A mixin that implements the base functionality for `dijit/form/ComboBox`/`dijit/form/FilteringSelect`
		// description:
		//		All widgets that mix in dijit/form/_AutoCompleterMixin must extend `dijit/form/_FormValueWidget`.
		// tags:
		//		protected

		// item: Object
		//		This is the item returned by the dojo/store/api/Store implementation that
		//		provides the data for this ComboBox, it's the currently selected item.
		item: null,

		// autoComplete: Boolean
		//		If user types in a partial string, and then tab out of the `<input>` box,
		//		automatically copy the first entry displayed in the drop down list to
		//		the `<input>` field
		autoComplete: true,

		// highlightMatch: String
		//		One of: "first", "all" or "none".
		//
		//		If the ComboBox/FilteringSelect opens with the search results and the searched
		//		string can be found, it will be highlighted.  If set to "all"
		//		then will probably want to change `queryExpr` parameter to '*${0}*'
		//
		//		Highlighting is only performed when `labelType` is "text", so as to not
		//		interfere with any HTML markup an HTML label might contain.
		highlightMatch: "first",

		// labelAttr: String?
		//		The entries in the drop down list come from this attribute in the
		//		dojo.data items.
		//		If not specified, the searchAttr attribute is used instead.
		labelAttr: "",

		// labelType: String
		//		Specifies how to interpret the labelAttr in the data store items.
		//		Can be "html" or "text".
		labelType: "text",

		// Flags to _HasDropDown to limit height of drop down to make it fit in viewport
		maxHeight: -1,

		// For backwards compatibility let onClick events propagate, even clicks on the down arrow button
		_stopClickEvents: false,

		_getCaretPos: function(/*DomNode*/ element){
			// khtml 3.5.2 has selection* methods as does webkit nightlies from 2005-06-22
			var pos = 0;
			if(typeof(element.selectionStart) == "number"){
				// FIXME: this is totally borked on Moz < 1.3. Any recourse?
				pos = element.selectionStart;
			}else if(has("ie")){
				// in the case of a mouse click in a popup being handled,
				// then the document.selection is not the textarea, but the popup
				// var r = document.selection.createRange();
				// hack to get IE 6 to play nice. What a POS browser.
				var tr = element.ownerDocument.selection.createRange().duplicate();
				var ntr = element.createTextRange();
				tr.move("character", 0);
				ntr.move("character", 0);
				try{
					// If control doesn't have focus, you get an exception.
					// Seems to happen on reverse-tab, but can also happen on tab (seems to be a race condition - only happens sometimes).
					// There appears to be no workaround for this - googled for quite a while.
					ntr.setEndPoint("EndToEnd", tr);
					pos = String(ntr.text).replace(/\r/g, "").length;
				}catch(e){
					// If focus has shifted, 0 is fine for caret pos.
				}
			}
			return pos;
		},

		_setCaretPos: function(/*DomNode*/ element, /*Number*/ location){
			location = parseInt(location);
			_TextBoxMixin.selectInputText(element, location, location);
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			// Additional code to set disabled state of ComboBox node.
			// Overrides _FormValueWidget._setDisabledAttr() or ValidationTextBox._setDisabledAttr().
			this.inherited(arguments);
			this.domNode.setAttribute("aria-disabled", value ? "true" : "false");
		},

		_onKey: function(/*Event*/ evt){
			// summary:
			//		Handles keyboard events

			if(evt.charCode >= 32){
				return;
			} // alphanumeric reserved for searching

			var key = evt.charCode || evt.keyCode;

			// except for cutting/pasting case - ctrl + x/v
			if(key == keys.ALT || key == keys.CTRL || key == keys.META || key == keys.SHIFT){
				return; // throw out spurious events
			}

			var pw = this.dropDown;
			var highlighted = null;
			this._abortQuery();

			// _HasDropDown will do some of the work:
			//
			//	1. when drop down is not yet shown:
			//		- if user presses the down arrow key, call loadDropDown()
			//	2. when drop down is already displayed:
			//		- on ESC key, call closeDropDown()
			//		- otherwise, call dropDown.handleKey() to process the keystroke
			this.inherited(arguments);

			if(evt.altKey || evt.ctrlKey || evt.metaKey){
				return;
			} // don't process keys with modifiers  - but we want shift+TAB

			if(this._opened){
				highlighted = pw.getHighlightedOption();
			}
			switch(key){
				case keys.PAGE_DOWN:
				case keys.DOWN_ARROW:
				case keys.PAGE_UP:
				case keys.UP_ARROW:
					// Keystroke caused ComboBox_menu to move to a different item.
					// Copy new item to <input> box.
					if(this._opened){
						this._announceOption(highlighted);
					}
					evt.stopPropagation();
					evt.preventDefault();
					break;

				case keys.ENTER:
					// prevent submitting form if user presses enter. Also
					// prevent accepting the value if either Next or Previous
					// are selected
					if(highlighted){
						// only stop event on prev/next
						if(highlighted == pw.nextButton){
							this._nextSearch(1);
							// prevent submit
							evt.stopPropagation();
							evt.preventDefault();
							break;
						}else if(highlighted == pw.previousButton){
							this._nextSearch(-1);
							// prevent submit
							evt.stopPropagation();
							evt.preventDefault();
							break;
						}
						// prevent submit if ENTER was to choose an item
						evt.stopPropagation();
						evt.preventDefault();
					}else{
						// Update 'value' (ex: KY) according to currently displayed text
						this._setBlurValue(); // set value if needed
						this._setCaretPos(this.focusNode, this.focusNode.value.length); // move cursor to end and cancel highlighting
					}
				// fall through

				case keys.TAB:
					var newvalue = this.get('displayedValue');
					//	if the user had More Choices selected fall into the
					//	_onBlur handler
					if(pw && (newvalue == pw._messages["previousMessage"] || newvalue == pw._messages["nextMessage"])){
						break;
					}
					if(highlighted){
						this._selectOption(highlighted);
					}
				// fall through

				case keys.ESCAPE:
					if(this._opened){
						this._lastQuery = null; // in case results come back later
						this.closeDropDown();
					}
					break;
			}
		},

		_autoCompleteText: function(/*String*/ text){
			// summary:
			//		Fill in the textbox with the first item from the drop down
			//		list, and highlight the characters that were
			//		auto-completed. For example, if user typed "CA" and the
			//		drop down list appeared, the textbox would be changed to
			//		"California" and "ifornia" would be highlighted.

			var fn = this.focusNode;

			// IE7: clear selection so next highlight works all the time
			_TextBoxMixin.selectInputText(fn, fn.value.length);
			// does text autoComplete the value in the textbox?
			var caseFilter = this.ignoreCase ? 'toLowerCase' : 'substr';
			if(text[caseFilter](0).indexOf(this.focusNode.value[caseFilter](0)) == 0){
				var cpos = this.autoComplete ? this._getCaretPos(fn) : fn.value.length;
				// only try to extend if we added the last character at the end of the input
				if((cpos + 1) > fn.value.length){
					// only add to input node as we would overwrite Capitalisation of chars
					// actually, that is ok
					fn.value = text;//.substr(cpos);
					// visually highlight the autocompleted characters
					_TextBoxMixin.selectInputText(fn, cpos);
				}
			}else{
				// text does not autoComplete; replace the whole value and highlight
				fn.value = text;
				_TextBoxMixin.selectInputText(fn);
			}
		},

		_openResultList: function(/*Object*/ results, /*Object*/ query, /*Object*/ options){
			// summary:
			//		Callback when a search completes.
			// description:
			//		1. generates drop-down list and calls _showResultList() to display it
			//		2. if this result list is from user pressing "more choices"/"previous choices"
			//			then tell screen reader to announce new option
			var wasSelected = this.dropDown.getHighlightedOption();
			this.dropDown.clearResultList();
			if(!results.length && options.start == 0){ // if no results and not just the previous choices button
				this.closeDropDown();
				return;
			}
			this._nextSearch = this.dropDown.onPage = lang.hitch(this, function(direction){
				results.nextPage(direction !== -1);
				this.focus();
			});

			// Fill in the textbox with the first item from the drop down list,
			// and highlight the characters that were auto-completed. For
			// example, if user typed "CA" and the drop down list appeared, the
			// textbox would be changed to "California" and "ifornia" would be
			// highlighted.

			this.dropDown.createOptions(
				results,
				options,
				lang.hitch(this, "_getMenuLabelFromItem")
			);

			// show our list (only if we have content, else nothing)
			this._showResultList();

			// #4091:
			//		tell the screen reader that the paging callback finished by
			//		shouting the next choice
			if("direction" in options){
				if(options.direction){
					this.dropDown.highlightFirstOption();
				}else if(!options.direction){
					this.dropDown.highlightLastOption();
				}
				if(wasSelected){
					this._announceOption(this.dropDown.getHighlightedOption());
				}
			}else if(this.autoComplete && !this._prev_key_backspace
				// when the user clicks the arrow button to show the full list,
				// startSearch looks for "*".
				// it does not make sense to autocomplete
				// if they are just previewing the options available.
				&& !/^[*]+$/.test(query[this.searchAttr].toString())){
				this._announceOption(this.dropDown.containerNode.firstChild.nextSibling); // 1st real item
			}
		},

		_showResultList: function(){
			// summary:
			//		Display the drop down if not already displayed, or if it is displayed, then
			//		reposition it if necessary (reposition may be necessary if drop down's height changed).
			this.closeDropDown(true);
			this.openDropDown();
			this.domNode.setAttribute("aria-expanded", "true");
		},

		loadDropDown: function(/*Function*/ /*===== callback =====*/){
			// Overrides _HasDropDown.loadDropDown().
			// This is called when user has pressed button icon or pressed the down arrow key
			// to open the drop down.
			this._startSearchAll();
		},

		isLoaded: function(){
			// signal to _HasDropDown that it needs to call loadDropDown() to load the
			// drop down asynchronously before displaying it
			return false;
		},

		closeDropDown: function(){
			// Overrides _HasDropDown.closeDropDown().  Closes the drop down (assuming that it's open).
			// This method is the callback when the user types ESC or clicking
			// the button icon while the drop down is open.  It's also called by other code.
			this._abortQuery();
			if(this._opened){
				this.inherited(arguments);
				this.domNode.setAttribute("aria-expanded", "false");
			}
		},

		_setBlurValue: function(){
			// if the user clicks away from the textbox OR tabs away, set the
			// value to the textbox value
			// #4617:
			//		if value is now more choices or previous choices, revert
			//		the value
			var newvalue = this.get('displayedValue');
			var pw = this.dropDown;
			if(pw && (newvalue == pw._messages["previousMessage"] || newvalue == pw._messages["nextMessage"])){
				this._setValueAttr(this._lastValueReported, true);
			}else if(typeof this.item == "undefined"){
				// Update 'value' (ex: KY) according to currently displayed text
				this.item = null;
				this.set('displayedValue', newvalue);
			}else{
				if(this.value != this._lastValueReported){
					this._handleOnChange(this.value, true);
				}
				this._refreshState();
			}
			// Remove aria-activedescendant since it may not be removed if they select with arrows then blur with mouse
			this.focusNode.removeAttribute("aria-activedescendant");
		},

		_setItemAttr: function(/*item*/ item, /*Boolean?*/ priorityChange, /*String?*/ displayedValue){
			// summary:
			//		Set the displayed valued in the input box, and the hidden value
			//		that gets submitted, based on a dojo.data store item.
			// description:
			//		Users shouldn't call this function; they should be calling
			//		set('item', value)
			// tags:
			//		private
			var value = '';
			if(item){
				if(!displayedValue){
					displayedValue = this.store._oldAPI ? // remove getValue() for 2.0 (old dojo.data API)
						this.store.getValue(item, this.searchAttr) : item[this.searchAttr];
				}
				value = this._getValueField() != this.searchAttr ? this.store.getIdentity(item) : displayedValue;
			}
			this.set('value', value, priorityChange, displayedValue, item);
		},

		_announceOption: function(/*Node*/ node){
			// summary:
			//		a11y code that puts the highlighted option in the textbox.
			//		This way screen readers will know what is happening in the
			//		menu.

			if(!node){
				return;
			}
			// pull the text value from the item attached to the DOM node
			var newValue;
			if(node == this.dropDown.nextButton ||
				node == this.dropDown.previousButton){
				newValue = node.innerHTML;
				this.item = undefined;
				this.value = '';
			}else{
				var item = this.dropDown.items[node.getAttribute("item")];
				newValue = (this.store._oldAPI ? // remove getValue() for 2.0 (old dojo.data API)
					this.store.getValue(item, this.searchAttr) : item[this.searchAttr]).toString();
				this.set('item', item, false, newValue);
			}
			// get the text that the user manually entered (cut off autocompleted text)
			this.focusNode.value = this.focusNode.value.substring(0, this._lastInput.length);
			// set up ARIA activedescendant
			this.focusNode.setAttribute("aria-activedescendant", domAttr.get(node, "id"));
			// autocomplete the rest of the option to announce change
			this._autoCompleteText(newValue);
		},

		_selectOption: function(/*DomNode*/ target){
			// summary:
			//		Menu callback function, called when an item in the menu is selected.
			this.closeDropDown();
			if(target){
				this._announceOption(target);
			}
			this._setCaretPos(this.focusNode, this.focusNode.value.length);
			this._handleOnChange(this.value, true);
			// Remove aria-activedescendant since the drop down is no loner visible
			// after closeDropDown() but _announceOption() adds it back in
			this.focusNode.removeAttribute("aria-activedescendant");
		},

		_startSearchAll: function(){
			this._startSearch('');
		},

		_startSearchFromInput: function(){
			this.item = undefined; // undefined means item needs to be set
			this.inherited(arguments);
		},

		_startSearch: function(/*String*/ key){
			// summary:
			//		Starts a search for elements matching key (key=="" means to return all items),
			//		and calls _openResultList() when the search completes, to display the results.
			if(!this.dropDown){
				var popupId = this.id + "_popup",
					dropDownConstructor = lang.isString(this.dropDownClass) ?
						lang.getObject(this.dropDownClass, false) : this.dropDownClass;
				this.dropDown = new dropDownConstructor({
					onChange: lang.hitch(this, this._selectOption),
					id: popupId,
					dir: this.dir,
					textDir: this.textDir
				});
			}
			this._lastInput = key; // Store exactly what was entered by the user.
			this.inherited(arguments);
		},

		_getValueField: function(){
			// summary:
			//		Helper for postMixInProperties() to set this.value based on data inlined into the markup.
			//		Returns the attribute name in the item (in dijit/form/_ComboBoxDataStore) to use as the value.
			return this.searchAttr;
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		postMixInProperties: function(){
			this.inherited(arguments);
			if(!this.store){
				var srcNodeRef = this.srcNodeRef;
				// if user didn't specify store, then assume there are option tags
				this.store = new DataList({}, srcNodeRef);

				// if there is no value set and there is an option list, set
				// the value to the first value to be consistent with native Select
				// Firefox and Safari set value
				// IE6 and Opera set selectedIndex, which is automatically set
				// by the selected attribute of an option tag
				// IE6 does not set value, Opera sets value = selectedIndex
				if(!("value" in this.params)){
					var item = (this.item = this.store.fetchSelectedItem());
					if(item){
						var valueField = this._getValueField();
						// remove getValue() for 2.0 (old dojo.data API)
						this.value = this.store._oldAPI ? this.store.getValue(item, valueField) : item[valueField];
					}
				}
			}
		},

		postCreate: function(){
			// summary:
			//		Subclasses must call this method from their postCreate() methods
			// tags:
			//		protected

			// find any associated label element and add to ComboBox node.
			var label = query('label[for="' + this.id + '"]');
			if(label.length){
				if(!label[0].id){
					label[0].id = this.id + "_label";
				}
				this.domNode.setAttribute("aria-labelledby", label[0].id);

			}
			this.inherited(arguments);
			aspect.after(this, "onSearch", lang.hitch(this, "_openResultList"), true);
		},

		_getMenuLabelFromItem: function(/*Item*/ item){
			var label = this.labelFunc(item, this.store),
				labelType = this.labelType;
			// If labelType is not "text" we don't want to screw any markup ot whatever.
			if(this.highlightMatch != "none" && this.labelType == "text" && this._lastInput){
				label = this.doHighlight(label, this._lastInput);
				labelType = "html";
			}
			return {html: labelType == "html", label: label};
		},

		doHighlight: function(/*String*/ label, /*String*/ find){
			// summary:
			//		Highlights the string entered by the user in the menu.  By default this
			//		highlights the first occurrence found. Override this method
			//		to implement your custom highlighting.
			// tags:
			//		protected

			var
			// Add (g)lobal modifier when this.highlightMatch == "all" and (i)gnorecase when this.ignoreCase == true
				modifiers = (this.ignoreCase ? "i" : "") + (this.highlightMatch == "all" ? "g" : ""),
				i = this.queryExpr.indexOf("${0}");
			find = regexp.escapeString(find); // escape regexp special chars
			//If < appears in label, and user presses t, we don't want to highlight the t in the escaped "&lt;"
			//first find out every occurences of "find", wrap each occurence in a pair of "\uFFFF" characters (which
			//should not appear in any string). then html escape the whole string, and replace '\uFFFF" with the
			//HTML highlight markup. 
			return this._escapeHtml(label.replace(
				new RegExp((i == 0 ? "^" : "") + "(" + find + ")" + (i == (this.queryExpr.length - 4) ? "$" : ""), modifiers),
				'\uFFFF$1\uFFFF')).replace(
				/\uFFFF([^\uFFFF]+)\uFFFF/g, '<span class="dijitComboBoxHighlightMatch">$1</span>'
			); // returns String, (almost) valid HTML (entities encoded)
		},

		_escapeHtml: function(/*String*/ str){
			// TODO Should become dojo.html.entities(), when exists use instead
			// summary:
			//		Adds escape sequences for special characters in XML: `&<>"'`
			str = String(str).replace(/&/gm, "&amp;").replace(/</gm, "&lt;")
				.replace(/>/gm, "&gt;").replace(/"/gm, "&quot;"); //balance"
			return str; // string
		},

		reset: function(){
			// Overrides the _FormWidget.reset().
			// Additionally reset the .item (to clean up).
			this.item = null;
			this.inherited(arguments);
		},

		labelFunc: function(item, store){
			// summary:
			//		Computes the label to display based on the dojo.data store item.
			// item: Object
			//		The item from the store
			// store: dojo/store/api/Store
			//		The store.
			// returns:
			//		The label that the ComboBox should display
			// tags:
			//		private

			// Use toString() because XMLStore returns an XMLItem whereas this
			// method is expected to return a String (#9354).
			// Remove getValue() for 2.0 (old dojo.data API)
			return (store._oldAPI ? store.getValue(item, this.labelAttr || this.searchAttr) :
				item[this.labelAttr || this.searchAttr]).toString(); // String
		},

		_setValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange, /*String?*/ displayedValue, /*item?*/ item){
			// summary:
			//		Hook so set('value', value) works.
			// description:
			//		Sets the value of the select.
			this._set("item", item || null); // value not looked up in store
			if(value == null /* or undefined */){
				value = '';
			} // null translates to blank
			this.inherited(arguments);
		}
	});

	if(has("dojo-bidi")){
		AutoCompleterMixin.extend({
			_setTextDirAttr: function(/*String*/ textDir){
				// summary:
				//		Setter for textDir, needed for the dropDown's textDir update.
				// description:
				//		Users shouldn't call this function; they should be calling
				//		set('textDir', value)
				// tags:
				//		private
				this.inherited(arguments);
				// update the drop down also (_ComboBoxMenuMixin)
				if(this.dropDown){
					this.dropDown._set("textDir", textDir);
				}
			}
		});
	}

	return AutoCompleterMixin;
});

},
'dijit/form/DataList':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId
	"dojo/_base/lang", // lang.trim
	"dojo/query", // query
	"dojo/store/Memory",
	"../registry"	// registry.add registry.remove
], function(declare, dom, lang, query, MemoryStore, registry){

	// module:
	//		dijit/form/DataList

	function toItem(/*DOMNode*/ option){
		// summary:
		//		Convert `<option>` node to hash
		return {
			id: option.value,
			value: option.value,
			name: lang.trim(option.innerText || option.textContent || '')
		};
	}

	return declare("dijit.form.DataList", MemoryStore, {
		// summary:
		//		Inefficient but small data store specialized for inlined data via OPTION tags
		//
		// description:
		//		Provides a store for inlined data like:
		//
		//	|	<datalist>
		//	|		<option value="AL">Alabama</option>
		//	|		...

		constructor: function(params, srcNodeRef){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String
			//		Attach widget to this DOM node.

			// store pointer to original DOM tree
			this.domNode = dom.byId(srcNodeRef);

			lang.mixin(this, params);
			if(this.id){
				registry.add(this); // add to registry so it can be easily found by id
			}
			this.domNode.style.display = "none";

			this.inherited(arguments, [{
				data: query("option", this.domNode).map(toItem)
			}]);
		},

		destroy: function(){
			registry.remove(this.id);
		},

		fetchSelectedItem: function(){
			// summary:
			//		Get the option marked as selected, like `<option selected>`.
			//		Not part of dojo.data API.
			var option = query("> option[selected]", this.domNode)[0] || query("> option", this.domNode)[0];
			return option && toItem(option);
		}
	});
});

},
'dojo/store/Memory':function(){
define(["../_base/declare", "./util/QueryResults", "./util/SimpleQueryEngine" /*=====, "./api/Store" =====*/],
function(declare, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

// module:
//		dojo/store/Memory

// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
var base = null;
/*===== base = Store; =====*/

return declare("dojo.store.Memory", base, {
	// summary:
	//		This is a basic in-memory object store. It implements dojo/store/api/Store.
	constructor: function(options){
		// summary:
		//		Creates a memory object store.
		// options: dojo/store/Memory
		//		This provides any configuration information that will be mixed into the store.
		//		This should generally include the data property to provide the starting set of data.
		for(var i in options){
			this[i] = options[i];
		}
		this.setData(this.data || []);
	},
	// data: Array
	//		The array of all the objects in the memory store
	data:null,

	// idProperty: String
	//		Indicates the property to use as the identity property. The values of this
	//		property should be unique.
	idProperty: "id",

	// index: Object
	//		An index of data indices into the data array by id
	index:null,

	// queryEngine: Function
	//		Defines the query engine to use for querying the data store
	queryEngine: SimpleQueryEngine,
	get: function(id){
		// summary:
		//		Retrieves an object by its identity
		// id: Number
		//		The identity to use to lookup the object
		// returns: Object
		//		The object in the store that matches the given id.
		return this.data[this.index[id]];
	},
	getIdentity: function(object){
		// summary:
		//		Returns an object's identity
		// object: Object
		//		The object to get the identity from
		// returns: Number
		return object[this.idProperty];
	},
	put: function(object, options){
		// summary:
		//		Stores an object
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		var data = this.data,
			index = this.index,
			idProperty = this.idProperty;
		var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
		if(id in index){
			// object exists
			if(options && options.overwrite === false){
				throw new Error("Object already exists");
			}
			// replace the entry in data
			data[index[id]] = object;
		}else{
			// add the new object
			index[id] = data.push(object) - 1;
		}
		return id;
	},
	add: function(object, options){
		// summary:
		//		Creates an object, throws an error if the object already exists
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		(options = options || {}).overwrite = false;
		// call put with overwrite being false
		return this.put(object, options);
	},
	remove: function(id){
		// summary:
		//		Deletes an object by its identity
		// id: Number
		//		The identity to use to delete the object
		// returns: Boolean
		//		Returns true if an object was removed, falsy (undefined) if no object matched the id
		var index = this.index;
		var data = this.data;
		if(id in index){
			data.splice(index[id], 1);
			// now we have to reindex
			this.setData(data);
			return true;
		}
	},
	query: function(query, options){
		// summary:
		//		Queries the store for objects.
		// query: Object
		//		The query to use for retrieving objects from the store.
		// options: dojo/store/api/Store.QueryOptions?
		//		The optional arguments to apply to the resultset.
		// returns: dojo/store/api/Store.QueryResults
		//		The results of the query, extended with iterative methods.
		//
		// example:
		//		Given the following store:
		//
		// 	|	var store = new Memory({
		// 	|		data: [
		// 	|			{id: 1, name: "one", prime: false },
		//	|			{id: 2, name: "two", even: true, prime: true},
		//	|			{id: 3, name: "three", prime: true},
		//	|			{id: 4, name: "four", even: true, prime: false},
		//	|			{id: 5, name: "five", prime: true}
		//	|		]
		//	|	});
		//
		//	...find all items where "prime" is true:
		//
		//	|	var results = store.query({ prime: true });
		//
		//	...or find all items where "even" is true:
		//
		//	|	var results = store.query({ even: true });
		return QueryResults(this.queryEngine(query, options)(this.data));
	},
	setData: function(data){
		// summary:
		//		Sets the given data as the source for this store, and indexes it
		// data: Object[]
		//		An array of objects to use as the source of data.
		if(data.items){
			// just for convenience with the data format IFRS expects
			this.idProperty = data.identifier;
			data = this.data = data.items;
		}else{
			this.data = data;
		}
		this.index = {};
		for(var i = 0, l = data.length; i < l; i++){
			this.index[data[i][this.idProperty]] = i;
		}
	}
});

});

},
'dojo/store/util/SimpleQueryEngine':function(){
define(["../../_base/array" /*=====, "../api/Store" =====*/], function(arrayUtil /*=====, Store =====*/){

// module:
//		dojo/store/util/SimpleQueryEngine

return function(query, options){
	// summary:
	//		Simple query engine that matches using filter functions, named filter
	//		functions or objects by name-value on a query object hash
	//
	// description:
	//		The SimpleQueryEngine provides a way of getting a QueryResults through
	//		the use of a simple object hash as a filter.  The hash will be used to
	//		match properties on data objects with the corresponding value given. In
	//		other words, only exact matches will be returned.
	//
	//		This function can be used as a template for more complex query engines;
	//		for example, an engine can be created that accepts an object hash that
	//		contains filtering functions, or a string that gets evaluated, etc.
	//
	//		When creating a new dojo.store, simply set the store's queryEngine
	//		field as a reference to this function.
	//
	// query: Object
	//		An object hash with fields that may match fields of items in the store.
	//		Values in the hash will be compared by normal == operator, but regular expressions
	//		or any object that provides a test() method are also supported and can be
	//		used to match strings by more complex expressions
	//		(and then the regex's or object's test() method will be used to match values).
	//
	// options: dojo/store/api/Store.QueryOptions?
	//		An object that contains optional information such as sort, start, and count.
	//
	// returns: Function
	//		A function that caches the passed query under the field "matches".  See any
	//		of the "query" methods on dojo.stores.
	//
	// example:
	//		Define a store with a reference to this engine, and set up a query method.
	//
	//	|	var myStore = function(options){
	//	|		//	...more properties here
	//	|		this.queryEngine = SimpleQueryEngine;
	//	|		//	define our query method
	//	|		this.query = function(query, options){
	//	|			return QueryResults(this.queryEngine(query, options)(this.data));
	//	|		};
	//	|	};

	// create our matching query function
	switch(typeof query){
		default:
			throw new Error("Can not query with a " + typeof query);
		case "object": case "undefined":
			var queryObject = query;
			query = function(object){
				for(var key in queryObject){
					var required = queryObject[key];
					if(required && required.test){
						// an object can provide a test method, which makes it work with regex
						if(!required.test(object[key], object)){
							return false;
						}
					}else if(required != object[key]){
						return false;
					}
				}
				return true;
			};
			break;
		case "string":
			// named query
			if(!this[query]){
				throw new Error("No filter function " + query + " was found in store");
			}
			query = this[query];
			// fall through
		case "function":
			// fall through
	}
	function execute(array){
		// execute the whole query, first we filter
		var results = arrayUtil.filter(array, query);
		// next we sort
		var sortSet = options && options.sort;
		if(sortSet){
			results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
				for(var sort, i=0; sort = sortSet[i]; i++){
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					if (aValue != bValue){
						return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
					}
				}
				return 0;
			});
		}
		// now we paginate
		if(options && (options.start || options.count)){
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}
	execute.matches = query;
	return execute;
};

});

},
'dijit/form/_SearchMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/keys", // keys
	"dojo/_base/lang", // lang.clone lang.hitch
	"dojo/query", // query
	"dojo/string", // string.substitute
	"dojo/when",
	"../registry"	// registry.byId
], function(declare, keys, lang, query, string, when, registry){

	// module:
	//		dijit/form/_SearchMixin


	return declare("dijit.form._SearchMixin", null, {
		// summary:
		//		A mixin that implements the base functionality to search a store based upon user-entered text such as
		//		with `dijit/form/ComboBox` or `dijit/form/FilteringSelect`
		// tags:
		//		protected

		// pageSize: Integer
		//		Argument to data provider.
		//		Specifies maximum number of search results to return per query
		pageSize: Infinity,

		// store: [const] dojo/store/api/Store
		//		Reference to data provider object used by this ComboBox.
		//		The store must accept an object hash of properties for its query. See `query` and `queryExpr` for details.
		store: null,

		// fetchProperties: Object
		//		Mixin to the store's fetch.
		//		For example, to set the sort order of the ComboBox menu, pass:
		//	|	{ sort: [{attribute:"name",descending: true}] }
		//		To override the default queryOptions so that deep=false, do:
		//	|	{ queryOptions: {ignoreCase: true, deep: false} }
		fetchProperties:{},

		// query: Object
		//		A query that can be passed to `store` to initially filter the items.
		//		ComboBox overwrites any reference to the `searchAttr` and sets it to the `queryExpr` with the user's input substituted.
		query: {},

		// searchDelay: Integer
		//		Delay in milliseconds between when user types something and we start
		//		searching based on that value
		searchDelay: 200,

		// searchAttr: String
		//		Search for items in the data store where this attribute (in the item)
		//		matches what the user typed
		searchAttr: "name",

		// queryExpr: String
		//		This specifies what query is sent to the data store,
		//		based on what the user has typed.  Changing this expression will modify
		//		whether the results are only exact matches, a "starting with" match,
		//		etc.
		//		`${0}` will be substituted for the user text.
		//		`*` is used for wildcards.
		//		`${0}*` means "starts with", `*${0}*` means "contains", `${0}` means "is"
		queryExpr: "${0}*",

		// ignoreCase: Boolean
		//		Set true if the query should ignore case when matching possible items
		ignoreCase: true,

		_patternToRegExp: function(pattern){
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

			return new RegExp("^" + pattern.replace(/(\\.)|(\*)|(\?)|\W/g, function(str, literal, star, question){
				return star ? ".*" : question ? "." : literal ? literal : "\\" + str;
			}) + "$", this.ignoreCase ? "mi" : "m");
		},

		_abortQuery: function(){
			// stop in-progress query
			if(this.searchTimer){
				this.searchTimer = this.searchTimer.remove();
			}
			if(this._queryDeferHandle){
				this._queryDeferHandle = this._queryDeferHandle.remove();
			}
			if(this._fetchHandle){
				if(this._fetchHandle.abort){
					this._cancelingQuery = true;
					this._fetchHandle.abort();
					this._cancelingQuery = false;
				}
				if(this._fetchHandle.cancel){
					this._cancelingQuery = true;
					this._fetchHandle.cancel();
					this._cancelingQuery = false;
				}
				this._fetchHandle = null;
			}
		},

		_processInput: function(/*Event*/ evt){
			// summary:
			//		Handles input (keyboard/paste) events
			if(this.disabled || this.readOnly){ return; }
			var key = evt.charOrCode;

			// except for cutting/pasting case - ctrl + x/v
			if("type" in evt && evt.type.substring(0,3) == "key" && (evt.altKey || ((evt.ctrlKey || evt.metaKey) && (key != 'x' && key != 'v')) || key == keys.SHIFT)){
				return; // throw out weird key combinations and spurious events
			}

			var doSearch = false;
			this._prev_key_backspace = false;

			switch(key){
				case keys.DELETE:
				case keys.BACKSPACE:
					this._prev_key_backspace = true;
					this._maskValidSubsetError = true;
					doSearch = true;
					break;

				default:
					// Non char keys (F1-F12 etc..) shouldn't start a search..
					// Ascii characters and IME input (Chinese, Japanese etc.) should.
					//IME input produces keycode == 229.
					doSearch = typeof key == 'string' || key == 229;
			}
			if(doSearch){
				// need to wait a tad before start search so that the event
				// bubbles through DOM and we have value visible
				if(!this.store){
					this.onSearch();
				}else{
					this.searchTimer = this.defer("_startSearchFromInput", 1);
				}
			}
		},

		onSearch: function(/*===== results, query, options =====*/){
			// summary:
			//		Callback when a search completes.
			//
			// results: Object
			//		An array of items from the originating _SearchMixin's store.
			//
			// query: Object
			//		A copy of the originating _SearchMixin's query property.
			//
			// options: Object
			//		The additional parameters sent to the originating _SearchMixin's store, including: start, count, queryOptions.
			//
			// tags:
			//		callback
		},

		_startSearchFromInput: function(){
			this._startSearch(this.focusNode.value);
		},

		_startSearch: function(/*String*/ text){
			// summary:
			//		Starts a search for elements matching text (text=="" means to return all items),
			//		and calls onSearch(...) when the search completes, to display the results.

			this._abortQuery();
			var
				_this = this,
				// Setup parameters to be passed to store.query().
				// Create a new query to prevent accidentally querying for a hidden
				// value from FilteringSelect's keyField
				query = lang.clone(this.query), // #5970
				options = {
					start: 0,
					count: this.pageSize,
					queryOptions: {		// remove for 2.0
						ignoreCase: this.ignoreCase,
						deep: true
					}
				},
				qs = string.substitute(this.queryExpr, [text.replace(/([\\\*\?])/g, "\\$1")]),
				q,
				startQuery = function(){
					var resPromise = _this._fetchHandle = _this.store.query(query, options);
					if(_this.disabled || _this.readOnly || (q !== _this._lastQuery)){
						return;
					} // avoid getting unwanted notify
					when(resPromise, function(res){
						_this._fetchHandle = null;
						if(!_this.disabled && !_this.readOnly && (q === _this._lastQuery)){ // avoid getting unwanted notify
							when(resPromise.total, function(total){
								res.total = total;
								var pageSize = _this.pageSize;
								if(isNaN(pageSize) || pageSize > res.total){ pageSize = res.total; }
								// Setup method to fetching the next page of results
								res.nextPage = function(direction){
									//	tell callback the direction of the paging so the screen
									//	reader knows which menu option to shout
									options.direction = direction = direction !== false;
									options.count = pageSize;
									if(direction){
										options.start += res.length;
										if(options.start >= res.total){
											options.count = 0;
										}
									}else{
										options.start -= pageSize;
										if(options.start < 0){
											options.count = Math.max(pageSize + options.start, 0);
											options.start = 0;
										}
									}
									if(options.count <= 0){
										res.length = 0;
										_this.onSearch(res, query, options);
									}else{
										startQuery();
									}
								};
								_this.onSearch(res, query, options);
							});
						}
					}, function(err){
						_this._fetchHandle = null;
						if(!_this._cancelingQuery){	// don't treat canceled query as an error
							console.error(_this.declaredClass + ' ' + err.toString());
						}
					});
				};

			lang.mixin(options, this.fetchProperties);

			// Generate query
			if(this.store._oldAPI){
				// remove this branch for 2.0
				q = qs;
			}else{
				// Query on searchAttr is a regex for benefit of dojo/store/Memory,
				// but with a toString() method to help dojo/store/JsonRest.
				// Search string like "Co*" converted to regex like /^Co.*$/i.
				q = this._patternToRegExp(qs);
				q.toString = function(){ return qs; };
			}

			// set _lastQuery, *then* start the timeout
			// otherwise, if the user types and the last query returns before the timeout,
			// _lastQuery won't be set and their input gets rewritten
			this._lastQuery = query[this.searchAttr] = q;
			this._queryDeferHandle = this.defer(startQuery, this.searchDelay);
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(){
			this.query={};
			this.fetchProperties={};
		},

		postMixInProperties: function(){
			if(!this.store){
				var list = this.list;
				if(list){
					this.store = registry.byId(list);
				}
			}
			this.inherited(arguments);
		}
	});
});

},
'dijit/form/_ComboBoxMenu':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-style", // domStyle.get
	"dojo/keys", // keys.DOWN_ARROW keys.PAGE_DOWN keys.PAGE_UP keys.UP_ARROW
	"../_WidgetBase",
	"../_TemplatedMixin",
	"./_ComboBoxMenuMixin",
	"./_ListMouseMixin"
], function(declare, domClass, domStyle, keys,
			_WidgetBase, _TemplatedMixin, _ComboBoxMenuMixin, _ListMouseMixin){


	// module:
	//		dijit/form/_ComboBoxMenu

	return declare("dijit.form._ComboBoxMenu",[_WidgetBase, _TemplatedMixin, _ListMouseMixin, _ComboBoxMenuMixin], {
		// summary:
		//		Focus-less menu for internal use in `dijit/form/ComboBox`
		//		Abstract methods that must be defined externally:
		//
		//		- onChange: item was explicitly chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
		//		- onPage: next(1) or previous(-1) button pressed
		// tags:
		//		private

		// TODO for 2.0 or earlier: stop putting stuff inside this.containerNode.   Switch to using this.domNode
		// or a different attach point.    See _TemplatedMixin::searchContainerNode.
		templateString: "<div class='dijitReset dijitMenu' data-dojo-attach-point='containerNode' style='overflow: auto; overflow-x: hidden;' role='listbox'>"
				+"<div class='dijitMenuItem dijitMenuPreviousButton' data-dojo-attach-point='previousButton' role='option'></div>"
				+"<div class='dijitMenuItem dijitMenuNextButton' data-dojo-attach-point='nextButton' role='option'></div>"
				+"</div>",

		baseClass: "dijitComboBoxMenu",

		postCreate: function(){
			this.inherited(arguments);
			if(!this.isLeftToRight()){
				domClass.add(this.previousButton, "dijitMenuItemRtl");
				domClass.add(this.nextButton, "dijitMenuItemRtl");
			}
			this.containerNode.setAttribute("role","listbox");
		},

		_createMenuItem: function(){
			// note: not using domConstruct.create() because need to specify document
			var item = this.ownerDocument.createElement("div");
			item.className = "dijitReset dijitMenuItem" +(this.isLeftToRight() ? "" : " dijitMenuItemRtl");
			item.setAttribute("role", "option");
			return item;
		},

		onHover: function(/*DomNode*/ node){
			// summary:
			//		Add hover CSS
			domClass.add(node, "dijitMenuItemHover");
		},

		onUnhover: function(/*DomNode*/ node){
			// summary:
			//		Remove hover CSS
			domClass.remove(node, "dijitMenuItemHover");
		},

		onSelect: function(/*DomNode*/ node){
			// summary:
			//		Add selected CSS
			domClass.add(node, "dijitMenuItemSelected");
		},

		onDeselect: function(/*DomNode*/ node){
			// summary:
			//		Remove selected CSS
			domClass.remove(node, "dijitMenuItemSelected");
		},

		_page: function(/*Boolean*/ up){
			// summary:
			//		Handles page-up and page-down keypresses

			var scrollamount = 0;
			var oldscroll = this.domNode.scrollTop;
			var height = domStyle.get(this.domNode, "height");
			// if no item is highlighted, highlight the first option
			if(!this.getHighlightedOption()){
				this.selectNextNode();
			}
			while(scrollamount<height){
				var highlighted_option = this.getHighlightedOption();
				if(up){
					// stop at option 1
					if(!highlighted_option.previousSibling ||
						highlighted_option.previousSibling.style.display == "none"){
						break;
					}
					this.selectPreviousNode();
				}else{
					// stop at last option
					if(!highlighted_option.nextSibling ||
						highlighted_option.nextSibling.style.display == "none"){
						break;
					}
					this.selectNextNode();
				}
				// going backwards
				var newscroll = this.domNode.scrollTop;
				scrollamount += (newscroll-oldscroll)*(up ? -1:1);
				oldscroll = newscroll;
			}
		},

		handleKey: function(evt){
			// summary:
			//		Handle keystroke event forwarded from ComboBox, returning false if it's
			//		a keystroke I recognize and process, true otherwise.
			switch(evt.keyCode){
				case keys.DOWN_ARROW:
					this.selectNextNode();
					return false;
				case keys.PAGE_DOWN:
					this._page(false);
					return false;
				case keys.UP_ARROW:
					this.selectPreviousNode();
					return false;
				case keys.PAGE_UP:
					this._page(true);
					return false;
				default:
					return true;
			}
		}
	});
});

},
'dijit/form/_ComboBoxMenuMixin':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/has",
	"dojo/i18n", // i18n.getLocalization
	"dojo/i18n!./nls/ComboBox"
], function(array, declare, domAttr, has, i18n){

	// module:
	//		dijit/form/_ComboBoxMenuMixin

	var ComboBoxMenuMixin = declare("dijit.form._ComboBoxMenuMixin" + (has("dojo-bidi") ? "_NoBidi" : ""), null, {
		// summary:
		//		Focus-less menu for internal use in `dijit/form/ComboBox`
		// tags:
		//		private

		// _messages: Object
		//		Holds "next" and "previous" text for paging buttons on drop down
		_messages: null,

		postMixInProperties: function(){
			this.inherited(arguments);
			this._messages = i18n.getLocalization("dijit.form", "ComboBox", this.lang);
		},

		buildRendering: function(){
			this.inherited(arguments);

			// fill in template with i18n messages
			this.previousButton.innerHTML = this._messages["previousMessage"];
			this.nextButton.innerHTML = this._messages["nextMessage"];
		},

		_setValueAttr: function(/*Object*/ value){
			this._set("value", value);
			this.onChange(value);
		},

		onClick: function(/*DomNode*/ node){
			if(node == this.previousButton){
				this._setSelectedAttr(null);
				this.onPage(-1);
			}else if(node == this.nextButton){
				this._setSelectedAttr(null);
				this.onPage(1);
			}else{
				this.onChange(node);
			}
		},

		// stubs
		onChange: function(/*Number*/ /*===== direction =====*/){
			// summary:
			//		Notifies ComboBox/FilteringSelect that user selected an option.
			// tags:
			//		callback
		},

		onPage: function(/*Number*/ /*===== direction =====*/){
			// summary:
			//		Notifies ComboBox/FilteringSelect that user clicked to advance to next/previous page.
			// tags:
			//		callback
		},

		onClose: function(){
			// summary:
			//		Callback from dijit.popup code to this widget, notifying it that it closed
			// tags:
			//		private
			this._setSelectedAttr(null);
		},

		_createOption: function(/*Object*/ item, labelFunc){
			// summary:
			//		Creates an option to appear on the popup menu subclassed by
			//		`dijit/form/FilteringSelect`.

			var menuitem = this._createMenuItem();
			var labelObject = labelFunc(item);
			if(labelObject.html){
				menuitem.innerHTML = labelObject.label;
			}else{
				menuitem.appendChild(
					menuitem.ownerDocument.createTextNode(labelObject.label)
				);
			}
			// #3250: in blank options, assign a normal height
			if(menuitem.innerHTML == ""){
				menuitem.innerHTML = "&#160;";	// &nbsp;
			}

			return menuitem;
		},

		createOptions: function(results, options, labelFunc){
			// summary:
			//		Fills in the items in the drop down list
			// results:
			//		Array of items
			// options:
			//		The options to the query function of the store
			//
			// labelFunc:
			//		Function to produce a label in the drop down list from a dojo.data item

			this.items = results;

			// display "Previous . . ." button
			this.previousButton.style.display = (options.start == 0) ? "none" : "";
			domAttr.set(this.previousButton, "id", this.id + "_prev");
			// create options using _createOption function defined by parent
			// ComboBox (or FilteringSelect) class
			// #2309:
			//		iterate over cache nondestructively
			array.forEach(results, function(item, i){
				var menuitem = this._createOption(item, labelFunc);
				menuitem.setAttribute("item", i);	// index to this.items; use indirection to avoid mem leak
				domAttr.set(menuitem, "id", this.id + i);
				this.nextButton.parentNode.insertBefore(menuitem, this.nextButton);
			}, this);
			// display "Next . . ." button
			var displayMore = false;
			// Try to determine if we should show 'more'...
			if(results.total && !results.total.then && results.total != -1){
				if((options.start + options.count) < results.total){
					displayMore = true;
				}else if((options.start + options.count) > results.total && options.count == results.length){
					// Weird return from a data store, where a start + count > maxOptions
					// implies maxOptions isn't really valid and we have to go into faking it.
					// And more or less assume more if count == results.length
					displayMore = true;
				}
			}else if(options.count == results.length){
				//Don't know the size, so we do the best we can based off count alone.
				//So, if we have an exact match to count, assume more.
				displayMore = true;
			}

			this.nextButton.style.display = displayMore ? "" : "none";
			domAttr.set(this.nextButton, "id", this.id + "_next");
		},

		clearResultList: function(){
			// summary:
			//		Clears the entries in the drop down list, but of course keeps the previous and next buttons.
			var container = this.containerNode;
			while(container.childNodes.length > 2){
				container.removeChild(container.childNodes[container.childNodes.length - 2]);
			}
			this._setSelectedAttr(null);
		},

		highlightFirstOption: function(){
			// summary:
			//		Highlight the first real item in the list (not Previous Choices).
			this.selectFirstNode();
		},

		highlightLastOption: function(){
			// summary:
			//		Highlight the last real item in the list (not More Choices).
			this.selectLastNode();
		},

		selectFirstNode: function(){
			this.inherited(arguments);
			if(this.getHighlightedOption() == this.previousButton){
				this.selectNextNode();
			}
		},

		selectLastNode: function(){
			this.inherited(arguments);
			if(this.getHighlightedOption() == this.nextButton){
				this.selectPreviousNode();
			}
		},

		getHighlightedOption: function(){
			return this.selected;
		}
	});

	if(has("dojo-bidi")){
		ComboBoxMenuMixin = declare("dijit.form._ComboBoxMenuMixin", ComboBoxMenuMixin, {
			_createOption: function(){
				var menuitem = this.inherited(arguments);

				// update menuitem.dir if BidiSupport was required
				this.applyTextDir(menuitem);

				return menuitem;
			}
		});
	}

	return ComboBoxMenuMixin;
});

},
'dijit/form/_ListMouseMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/on",
	"dojo/touch",
	"./_ListBase"
], function(declare, on, touch, _ListBase){

	// module:
	//		dijit/form/_ListMouseMixin

	return declare("dijit.form._ListMouseMixin", _ListBase, {
		// summary:
		//		A mixin to handle mouse or touch events for a focus-less menu
		//		Abstract methods that must be defined externally:
		//
		//		- onClick: item was chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
		// tags:
		//		private

		postCreate: function(){
			this.inherited(arguments);

			// Add flag to use normalized click handling from dojo/touch
			this.domNode.dojoClick = true;

			this.own(on(this.domNode, "mousedown", function(evt){
				evt.preventDefault();
			})); // prevent focus shift on list scrollbar press
			this._listConnect("click", "_onClick");
			this._listConnect("mousedown", "_onMouseDown");
			this._listConnect("mouseup", "_onMouseUp");
			this._listConnect("mouseover", "_onMouseOver");
			this._listConnect("mouseout", "_onMouseOut");
		},

		_onClick: function(/*Event*/ evt, /*DomNode*/ target){
			this._setSelectedAttr(target);
			if(this._deferredClick){
				this._deferredClick.remove();
			}
			this._deferredClick = this.defer(function(){
				this._deferredClick = null;
				this.onClick(target);
			});
		},

		_onMouseDown: function(/*Event*/ evt, /*DomNode*/ target){
			if(this._hoveredNode){
				this.onUnhover(this._hoveredNode);
				this._hoveredNode = null;
			}
			this._isDragging = true;
			this._setSelectedAttr(target);
		},

		_onMouseUp: function(/*Event*/ evt, /*DomNode*/ target){
			this._isDragging = false;
			var selectedNode = this.selected;
			var hoveredNode = this._hoveredNode;
			if(selectedNode && target == selectedNode){
				this.defer(function(){
					this._onClick(evt, selectedNode);
				});
			}else if(hoveredNode){ // drag to select
				this.defer(function(){
					this._onClick(evt, hoveredNode);
				});
			}
		},

		_onMouseOut: function(/*Event*/ evt, /*DomNode*/ target){
			if(this._hoveredNode){
				this.onUnhover(this._hoveredNode);
				this._hoveredNode = null;
			}
			if(this._isDragging){
				this._cancelDrag = (new Date()).getTime() + 1000; // cancel in 1 second if no _onMouseOver fires
			}
		},

		_onMouseOver: function(/*Event*/ evt, /*DomNode*/ target){
			if(this._cancelDrag){
				var time = (new Date()).getTime();
				if(time > this._cancelDrag){
					this._isDragging = false;
				}
				this._cancelDrag = null;
			}
			this._hoveredNode = target;
			this.onHover(target);
			if(this._isDragging){
				this._setSelectedAttr(target);
			}
		}
	});
});

},
'dijit/form/_ListBase':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/on",
	"dojo/window" // winUtils.scrollIntoView
], function(declare, on, winUtils){

	// module:
	//		dijit/form/_ListBase

	return declare("dijit.form._ListBase", null, {
		// summary:
		//		Focus-less menu to handle UI events consistently.
		//		Abstract methods that must be defined externally:
		//
		//		- onSelect: item is active (mousedown but not yet mouseup, or keyboard arrow selected but no Enter)
		//		- onDeselect:  cancels onSelect
		// tags:
		//		private

		// selected: DOMNode
		//		currently selected node
		selected: null,

		_listConnect: function(/*String|Function*/ eventType, /*String*/ callbackFuncName){
			// summary:
			//		Connects 'containerNode' to specified method of this object
			//		and automatically registers for 'disconnect' on widget destroy.
			// description:
			//		Provide widget-specific analog to 'connect'.
			//		The callback function is called with the normal event object,
			//		but also a second parameter is passed that indicates which list item
			//		actually received the event.
			// returns:
			//		A handle that can be passed to `disconnect` in order to disconnect
			//		before the widget is destroyed.
			// tags:
			//		private

			var self = this;
			return self.own(on(self.containerNode,
				on.selector(
					function(eventTarget, selector, target){
						return eventTarget.parentNode == target;
					},
					eventType
				),
				function(evt){
					if(!/^touch/.test(evt.type)){
						evt.preventDefault();
					}
					self[callbackFuncName](evt, this);
				}
			));
		},

		selectFirstNode: function(){
			// summary:
			//		Select the first displayed item in the list.
			var first = this.containerNode.firstChild;
			while(first && first.style.display == "none"){
				first = first.nextSibling;
			}
			this._setSelectedAttr(first);
		},

		selectLastNode: function(){
			// summary:
			//		Select the last displayed item in the list
			var last = this.containerNode.lastChild;
			while(last && last.style.display == "none"){
				last = last.previousSibling;
			}
			this._setSelectedAttr(last);
		},

		selectNextNode: function(){
			// summary:
			//		Select the item just below the current selection.
			//		If nothing selected, select first node.
			var selectedNode = this.selected;
			if(!selectedNode){
				this.selectFirstNode();
			}else{
				var next = selectedNode.nextSibling;
				while(next && next.style.display == "none"){
					next = next.nextSibling;
				}
				if(!next){
					this.selectFirstNode();
				}else{
					this._setSelectedAttr(next);
				}
			}
		},

		selectPreviousNode: function(){
			// summary:
			//		Select the item just above the current selection.
			//		If nothing selected, select last node (if
			//		you select Previous and try to keep scrolling up the list).
			var selectedNode = this.selected;
			if(!selectedNode){
				this.selectLastNode();
			}else{
				var prev = selectedNode.previousSibling;
				while(prev && prev.style.display == "none"){
					prev = prev.previousSibling;
				}
				if(!prev){
					this.selectLastNode();
				}else{
					this._setSelectedAttr(prev);
				}
			}
		},

		_setSelectedAttr: function(/*DomNode*/ node){
			// summary:
			//		Does the actual select.
			if(this.selected != node){
				var selectedNode = this.selected;
				if(selectedNode){
					this.onDeselect(selectedNode);
				}
				if(node){
					winUtils.scrollIntoView(node);
					this.onSelect(node);
				}
				this._set("selected", node);
			}else if(node){
				this.onSelect(node);
			}
		}
	});
});

},
'dijit/ColorPalette':function(){
define([
	"require", // require.toUrl
	"dojo/text!./templates/ColorPalette.html",
	"./_Widget", // used also to load dijit/hccss for setting has("highcontrast")
	"./_TemplatedMixin",
	"./_PaletteMixin",
	"./hccss", // has("highcontrast")
	"dojo/i18n", // i18n.getLocalization
	"dojo/_base/Color", // dojo.Color dojo.Color.named
	"dojo/_base/declare", // declare
	"dojo/dom-construct", // domConstruct.place
	"dojo/string", // string.substitute
	"dojo/i18n!dojo/nls/colors", // translations
	"dojo/colors"    // extend dojo.Color w/names of other colors
], function(require, template, _Widget, _TemplatedMixin, _PaletteMixin, has, i18n, Color,
	declare, domConstruct, string){

	// module:
	//		dijit/ColorPalette

	var ColorPalette = declare("dijit.ColorPalette", [_Widget, _TemplatedMixin, _PaletteMixin], {
		// summary:
		//		A keyboard accessible color-picking widget
		// description:
		//		Grid showing various colors, so the user can pick a certain color.
		//		Can be used standalone, or as a popup.
		//
		// example:
		// |	<div data-dojo-type="dijit/ColorPalette"></div>
		//
		// example:
		// |	var picker = new dijit.ColorPalette({ },srcNode);
		// |	picker.startup();


		// palette: [const] String
		//		Size of grid, either "7x10" or "3x4".
		palette: "7x10",

		// _palettes: [protected] Map
		//		This represents the value of the colors.
		//		The first level is a hashmap of the different palettes available.
		//		The next two dimensions represent the columns and rows of colors.
		_palettes: {
			"7x10": [
				["white", "seashell", "cornsilk", "lemonchiffon", "lightyellow", "palegreen", "paleturquoise", "lightcyan", "lavender", "plum"],
				["lightgray", "pink", "bisque", "moccasin", "khaki", "lightgreen", "lightseagreen", "lightskyblue", "cornflowerblue", "violet"],
				["silver", "lightcoral", "sandybrown", "orange", "palegoldenrod", "chartreuse", "mediumturquoise", "skyblue", "mediumslateblue", "orchid"],
				["gray", "red", "orangered", "darkorange", "yellow", "limegreen", "darkseagreen", "royalblue", "slateblue", "mediumorchid"],
				["dimgray", "crimson", "chocolate", "coral", "gold", "forestgreen", "seagreen", "blue", "blueviolet", "darkorchid"],
				["darkslategray", "firebrick", "saddlebrown", "sienna", "olive", "green", "darkcyan", "mediumblue", "darkslateblue", "darkmagenta" ],
				["black", "darkred", "maroon", "brown", "darkolivegreen", "darkgreen", "midnightblue", "navy", "indigo", "purple"]
			],

			"3x4": [
				["white", "lime", "green", "blue"],
				["silver", "yellow", "fuchsia", "navy"],
				["gray", "red", "purple", "black"]
			]
		},

		// templateString: String
		//		The template of this widget.
		templateString: template,

		baseClass: "dijitColorPalette",

		_dyeFactory: function(value, row, col, title){
			// Overrides _PaletteMixin._dyeFactory().
			return new this._dyeClass(value, row, col, title);
		},

		buildRendering: function(){
			// Instantiate the template, which makes a skeleton into which we'll insert a bunch of
			// <img> nodes
			this.inherited(arguments);

			//	Creates customized constructor for dye class (color of a single cell) for
			//	specified palette and high-contrast vs. normal mode.   Used in _getDye().
			this._dyeClass = declare(ColorPalette._Color, {
				palette: this.palette
			});

			// Creates <img> nodes in each cell of the template.
			this._preparePalette(
				this._palettes[this.palette],
				i18n.getLocalization("dojo", "colors", this.lang));
		}
	});

	ColorPalette._Color = declare("dijit._Color", Color, {
		// summary:
		//		Object associated with each cell in a ColorPalette palette.
		//		Implements dijit/Dye.

		// Template for each cell in normal (non-high-contrast mode).  Each cell contains a wrapper
		// node for showing the border (called dijitPaletteImg for back-compat), and dijitColorPaletteSwatch
		// for showing the color.
		template: "<span class='dijitInline dijitPaletteImg'>" +
			"<img src='${blankGif}' alt='${alt}' title='${title}' class='dijitColorPaletteSwatch' style='background-color: ${color}'/>" +
			"</span>",

		// Template for each cell in high contrast mode.  Each cell contains an image with the whole palette,
		// but scrolled and clipped to show the correct color only
		hcTemplate: "<span class='dijitInline dijitPaletteImg' style='position: relative; overflow: hidden; height: 12px; width: 14px;'>" +
			"<img src='${image}' alt='${alt}' title='${title}' style='position: absolute; left: ${left}px; top: ${top}px; ${size}'/>" +
			"</span>",

		// _imagePaths: [protected] Map
		//		This is stores the path to the palette images used for high-contrast mode display
		_imagePaths: {
			"7x10": require.toUrl("./themes/a11y/colors7x10.png"),
			"3x4": require.toUrl("./themes/a11y/colors3x4.png")
		},

		constructor: function(alias, row, col, title){
			// summary:
			//		Constructor for ColorPalette._Color
			// alias: String
			//		English name of the color.
			// row: Number
			//		Vertical position in grid.
			// column: Number
			//		Horizontal position in grid.
			// title: String
			//		Localized name of the color.
			this._title = title;
			this._row = row;
			this._col = col;
			this.setColor(Color.named[alias]);
		},

		getValue: function(){
			// summary:
			//		Note that although dijit._Color is initialized with a value like "white" getValue() always
			//		returns a hex value
			return this.toHex();
		},

		fillCell: function(/*DOMNode*/ cell, /*String*/ blankGif){
			var html = string.substitute(has("highcontrast") ? this.hcTemplate : this.template, {
				// substitution variables for normal mode
				color: this.toHex(),
				blankGif: blankGif,
				alt: this._title,
				title: this._title,

				// variables used for high contrast mode
				image: this._imagePaths[this.palette].toString(),
				left: this._col * -20 - 5,
				top: this._row * -20 - 5,
				size: this.palette == "7x10" ? "height: 145px; width: 206px" : "height: 64px; width: 86px"
			});

			domConstruct.place(html, cell);
		}
	});

	return ColorPalette;
});

},
'dijit/_PaletteMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-construct", // domConstruct.create domConstruct.place
	"dojo/keys", // keys
	"dojo/_base/lang", // lang.getObject
	"dojo/on",
	"./_CssStateMixin",
	"./a11yclick",
	"./focus",
	"./typematic"
], function(declare, domAttr, domClass, domConstruct, keys, lang, on, _CssStateMixin, a11yclick, focus, typematic){

	// module:
	//		dijit/_PaletteMixin

	var PaletteMixin = declare("dijit._PaletteMixin", _CssStateMixin, {
		// summary:
		//		A keyboard accessible palette, for picking a color/emoticon/etc.
		// description:
		//		A mixin for a grid showing various entities, so the user can pick a certain entity.

		// defaultTimeout: Number
		//		Number of milliseconds before a held key or button becomes typematic
		defaultTimeout: 500,

		// timeoutChangeRate: Number
		//		Fraction of time used to change the typematic timer between events
		//		1.0 means that each typematic event fires at defaultTimeout intervals
		//		Less than 1.0 means that each typematic event fires at an increasing faster rate
		timeoutChangeRate: 0.90,

		// value: String
		//		Currently selected color/emoticon/etc.
		value: "",

		// _selectedCell: [private] Integer
		//		Index of the currently selected cell. Initially, none selected
		_selectedCell: -1,

		/*=====
		 // _currentFocus: [private] DomNode
		 //		The currently focused cell (if the palette itself has focus), or otherwise
		 //		the cell to be focused when the palette itself gets focus.
		 //		Different from value, which represents the selected (i.e. clicked) cell.
		 _currentFocus: null,
		 =====*/

		/*=====
		 // _xDim: [protected] Integer
		 //		This is the number of cells horizontally across.
		 _xDim: null,
		 =====*/

		/*=====
		 // _yDim: [protected] Integer
		 //		This is the number of cells vertically down.
		 _yDim: null,
		 =====*/

		// tabIndex: String
		//		Widget tab index.
		tabIndex: "0",

		// cellClass: [protected] String
		//		CSS class applied to each cell in the palette
		cellClass: "dijitPaletteCell",

		// dyeClass: [protected] Constructor
		//		Constructor for Object created for each cell of the palette.
		//		dyeClass should implement the dijit/_PaletteMixin.__Dye interface.
		dyeClass: null,

		_dyeFactory: function(value /*===== , row, col, title =====*/){
			// summary:
			//		Return instance of dijit.Dye for specified cell of palette
			// tags:
			//		extension

			// Remove string support for 2.0
			var dyeClassObj = typeof this.dyeClass == "string" ? lang.getObject(this.dyeClass) : this.dyeClass;
			return new dyeClassObj(value);
		},

		_preparePalette: function(choices, titles){
			// summary:
			//		Subclass must call _preparePalette() from postCreate(), passing in the tooltip
			//		for each cell
			// choices: String[][]
			//		id's for each cell of the palette, used to create Dye JS object for each cell
			// titles: String[]
			//		Localized tooltip for each cell

			this._cells = [];
			var url = this._blankGif;

			this.own(on(this.gridNode, a11yclick, lang.hitch(this, "_onCellClick")));

			for(var row = 0; row < choices.length; row++){
				var rowNode = domConstruct.create("tr", {tabIndex: "-1", role: "row"}, this.gridNode);
				for(var col = 0; col < choices[row].length; col++){
					var value = choices[row][col];
					if(value){
						var cellObject = this._dyeFactory(value, row, col, titles[value]);

						var cellNode = domConstruct.create("td", {
							"class": this.cellClass,
							tabIndex: "-1",
							title: titles[value],
							role: "gridcell"
						}, rowNode);

						// prepare cell inner structure
						cellObject.fillCell(cellNode, url);

						cellNode.idx = this._cells.length;

						// save cell info into _cells
						this._cells.push({node: cellNode, dye: cellObject});
					}
				}
			}
			this._xDim = choices[0].length;
			this._yDim = choices.length;

			// Now set all events
			// The palette itself is navigated to with the tab key on the keyboard
			// Keyboard navigation within the Palette is with the arrow keys
			// Spacebar selects the cell.
			// For the up key the index is changed by negative the x dimension.

			var keyIncrementMap = {
				UP_ARROW: -this._xDim,
				// The down key the index is increase by the x dimension.
				DOWN_ARROW: this._xDim,
				// Right and left move the index by 1.
				RIGHT_ARROW: this.isLeftToRight() ? 1 : -1,
				LEFT_ARROW: this.isLeftToRight() ? -1 : 1
			};
			for(var key in keyIncrementMap){
				this.own(
					typematic.addKeyListener(
						this.domNode,
						{keyCode: keys[key], ctrlKey: false, altKey: false, shiftKey: false},
						this,
						function(){
							var increment = keyIncrementMap[key];
							return function(count){
								this._navigateByKey(increment, count);
							};
						}(),
						this.timeoutChangeRate,
						this.defaultTimeout
					)
				);
			}
		},

		postCreate: function(){
			this.inherited(arguments);

			// Set initial navigable node.
			this._setCurrent(this._cells[0].node);
		},

		focus: function(){
			// summary:
			//		Focus this widget.  Puts focus on the most recently focused cell.

			// The cell already has tabIndex set, just need to set CSS and focus it
			focus.focus(this._currentFocus);
		},

		_onCellClick: function(/*Event*/ evt){
			// summary:
			//		Handler for click, enter key & space key. Selects the cell.
			// evt:
			//		The event.
			// tags:
			//		private

			var target = evt.target;

			// Find TD associated with click event.   For ColorPalette user likely clicked IMG inside of TD
			while(target.tagName != "TD"){
				if(!target.parentNode || target == this.gridNode){    // probably can never happen, but just in case
					return;
				}
				target = target.parentNode;
			}

			var value = this._getDye(target).getValue();

			// First focus the clicked cell, and then send onChange() notification.
			// onChange() (via _setValueAttr) must be after the focus call, because
			// it may trigger a refocus to somewhere else (like the Editor content area), and that
			// second focus should win.
			this._setCurrent(target);
			focus.focus(target);
			this._setValueAttr(value, true);

			evt.stopPropagation();
			evt.preventDefault();
		},

		_setCurrent: function(/*DomNode*/ node){
			// summary:
			//		Sets which node is the focused cell.
			// description:
			//		At any point in time there's exactly one
			//		cell with tabIndex != -1.   If focus is inside the palette then
			//		focus is on that cell.
			//
			//		After calling this method, arrow key handlers and mouse click handlers
			//		should focus the cell in a setTimeout().
			// tags:
			//		protected
			if("_currentFocus" in this){
				// Remove tabIndex on old cell
				domAttr.set(this._currentFocus, "tabIndex", "-1");
			}

			// Set tabIndex of new cell
			this._currentFocus = node;
			if(node){
				domAttr.set(node, "tabIndex", this.tabIndex);
			}
		},

		_setValueAttr: function(value, priorityChange){
			// summary:
			//		This selects a cell. It triggers the onChange event.
			// value: String
			//		Value of the cell to select
			// tags:
			//		protected
			// priorityChange: Boolean?
			//		Optional parameter used to tell the select whether or not to fire
			//		onChange event.

			// clear old selected cell
			if(this._selectedCell >= 0){
				domClass.remove(this._cells[this._selectedCell].node, this.cellClass + "Selected");
			}
			this._selectedCell = -1;

			// search for cell matching specified value
			if(value){
				for(var i = 0; i < this._cells.length; i++){
					if(value == this._cells[i].dye.getValue()){
						this._selectedCell = i;
						domClass.add(this._cells[i].node, this.cellClass + "Selected");
						break;
					}
				}
			}

			// record new value, or null if no matching cell
			this._set("value", this._selectedCell >= 0 ? value : null);

			if(priorityChange || priorityChange === undefined){
				this.onChange(value);
			}
		},

		onChange: function(/*===== value =====*/){
			// summary:
			//		Callback when a cell is selected.
			// value: String
			//		Value corresponding to cell.
		},

		_navigateByKey: function(increment, typeCount){
			// summary:
			//		This is the callback for typematic.
			//		It changes the focus and the highlighed cell.
			// increment:
			//		How much the key is navigated.
			// typeCount:
			//		How many times typematic has fired.
			// tags:
			//		private

			// typecount == -1 means the key is released.
			if(typeCount == -1){
				return;
			}

			var newFocusIndex = this._currentFocus.idx + increment;
			if(newFocusIndex < this._cells.length && newFocusIndex > -1){
				var focusNode = this._cells[newFocusIndex].node;
				this._setCurrent(focusNode);

				// Actually focus the node, for the benefit of screen readers.
				// Use defer because IE doesn't like changing focus inside of an event handler
				this.defer(lang.hitch(focus, "focus", focusNode));
			}
		},

		_getDye: function(/*DomNode*/ cell){
			// summary:
			//		Get JS object for given cell DOMNode

			return this._cells[cell.idx].dye;
		}
	});

	/*=====
	 PaletteMixin.__Dye = declare("dijit.Dye", null, {
		 // summary:
		 //		Interface for the JS Object associated with a palette cell (i.e. DOMNode)

		 constructor: function(alias, row, col){
			 // summary:
			 //		Initialize according to value or alias like "white"
			 // alias: String
		 },

		 getValue: function(){
			 // summary:
			 //		Return "value" of cell; meaning of "value" varies by subclass.
			 // description:
			 //		For example color hex value, emoticon ascii value etc, entity hex value.
		 },

		 fillCell: function(cell, blankGif){
			 // summary:
			 //		Add cell DOMNode inner structure
			 // cell: DomNode
			 //		The surrounding cell
			 // blankGif: String
			 //		URL for blank cell image
		 }
	 });
	 =====*/

	return PaletteMixin;
});

},
'dojo/colors':function(){
define(["./_base/kernel", "./_base/lang", "./_base/Color", "./_base/array"], function(dojo, lang, Color, ArrayUtil){
	// module:
	//		dojo/colors

	/*=====
	return {
		// summary:
		//		Color utilities, extending Base dojo.Color
	};
	=====*/

	var ColorExt = {};
	lang.setObject("dojo.colors", ColorExt);

//TODO: this module appears to break naming conventions

	// this is a standard conversion prescribed by the CSS3 Color Module
	var hue2rgb = function(m1, m2, h){
		if(h < 0){ ++h; }
		if(h > 1){ --h; }
		var h6 = 6 * h;
		if(h6 < 1){ return m1 + (m2 - m1) * h6; }
		if(2 * h < 1){ return m2; }
		if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
		return m1;
	};
	// Override base Color.fromRgb with the impl in this module
	dojo.colorFromRgb = Color.fromRgb = function(/*String*/ color, /*dojo/_base/Color?*/ obj){
		// summary:
		//		get rgb(a) array from css-style color declarations
		// description:
		//		this function can handle all 4 CSS3 Color Module formats: rgb,
		//		rgba, hsl, hsla, including rgb(a) with percentage values.
		var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
		if(m){
			var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1], a;
			if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
				var r = c[0];
				if(r.charAt(r.length - 1) == "%"){
					// 3 rgb percentage values
					a = ArrayUtil.map(c, function(x){
						return parseFloat(x) * 2.56;
					});
					if(l == 4){ a[3] = c[3]; }
					return Color.fromArray(a, obj); // dojo/_base/Color
				}
				return Color.fromArray(c, obj); // dojo/_base/Color
			}
			if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
				// normalize hsl values
				var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
					S = parseFloat(c[1]) / 100,
					L = parseFloat(c[2]) / 100,
					// calculate rgb according to the algorithm
					// recommended by the CSS3 Color Module
					m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
					m1 = 2 * L - m2;
				a = [
					hue2rgb(m1, m2, H + 1 / 3) * 256,
					hue2rgb(m1, m2, H) * 256,
					hue2rgb(m1, m2, H - 1 / 3) * 256,
					1
				];
				if(l == 4){ a[3] = c[3]; }
				return Color.fromArray(a, obj); // dojo/_base/Color
			}
		}
		return null;	// dojo/_base/Color
	};

	var confine = function(c, low, high){
		// summary:
		//		sanitize a color component by making sure it is a number,
		//		and clamping it to valid values
		c = Number(c);
		return isNaN(c) ? high : c < low ? low : c > high ? high : c;	// Number
	};

	Color.prototype.sanitize = function(){
		// summary:
		//		makes sure that the object has correct attributes
		var t = this;
		t.r = Math.round(confine(t.r, 0, 255));
		t.g = Math.round(confine(t.g, 0, 255));
		t.b = Math.round(confine(t.b, 0, 255));
		t.a = confine(t.a, 0, 1);
		return this;	// dojo/_base/Color
	};

	ColorExt.makeGrey = Color.makeGrey = function(/*Number*/ g, /*Number?*/ a){
		// summary:
		//		creates a greyscale color with an optional alpha
		return Color.fromArray([g, g, g, a]);	// dojo/_base/Color
	};

	// mixin all CSS3 named colors not already in _base, along with SVG 1.0 variant spellings
	lang.mixin(Color.named, {
		"aliceblue":	[240,248,255],
		"antiquewhite": [250,235,215],
		"aquamarine":	[127,255,212],
		"azure":	[240,255,255],
		"beige":	[245,245,220],
		"bisque":	[255,228,196],
		"blanchedalmond":	[255,235,205],
		"blueviolet":	[138,43,226],
		"brown":	[165,42,42],
		"burlywood":	[222,184,135],
		"cadetblue":	[95,158,160],
		"chartreuse":	[127,255,0],
		"chocolate":	[210,105,30],
		"coral":	[255,127,80],
		"cornflowerblue":	[100,149,237],
		"cornsilk": [255,248,220],
		"crimson":	[220,20,60],
		"cyan": [0,255,255],
		"darkblue": [0,0,139],
		"darkcyan": [0,139,139],
		"darkgoldenrod":	[184,134,11],
		"darkgray": [169,169,169],
		"darkgreen":	[0,100,0],
		"darkgrey": [169,169,169],
		"darkkhaki":	[189,183,107],
		"darkmagenta":	[139,0,139],
		"darkolivegreen":	[85,107,47],
		"darkorange":	[255,140,0],
		"darkorchid":	[153,50,204],
		"darkred":	[139,0,0],
		"darksalmon":	[233,150,122],
		"darkseagreen": [143,188,143],
		"darkslateblue":	[72,61,139],
		"darkslategray":	[47,79,79],
		"darkslategrey":	[47,79,79],
		"darkturquoise":	[0,206,209],
		"darkviolet":	[148,0,211],
		"deeppink": [255,20,147],
		"deepskyblue":	[0,191,255],
		"dimgray":	[105,105,105],
		"dimgrey":	[105,105,105],
		"dodgerblue":	[30,144,255],
		"firebrick":	[178,34,34],
		"floralwhite":	[255,250,240],
		"forestgreen":	[34,139,34],
		"gainsboro":	[220,220,220],
		"ghostwhite":	[248,248,255],
		"gold": [255,215,0],
		"goldenrod":	[218,165,32],
		"greenyellow":	[173,255,47],
		"grey": [128,128,128],
		"honeydew": [240,255,240],
		"hotpink":	[255,105,180],
		"indianred":	[205,92,92],
		"indigo":	[75,0,130],
		"ivory":	[255,255,240],
		"khaki":	[240,230,140],
		"lavender": [230,230,250],
		"lavenderblush":	[255,240,245],
		"lawngreen":	[124,252,0],
		"lemonchiffon": [255,250,205],
		"lightblue":	[173,216,230],
		"lightcoral":	[240,128,128],
		"lightcyan":	[224,255,255],
		"lightgoldenrodyellow": [250,250,210],
		"lightgray":	[211,211,211],
		"lightgreen":	[144,238,144],
		"lightgrey":	[211,211,211],
		"lightpink":	[255,182,193],
		"lightsalmon":	[255,160,122],
		"lightseagreen":	[32,178,170],
		"lightskyblue": [135,206,250],
		"lightslategray":	[119,136,153],
		"lightslategrey":	[119,136,153],
		"lightsteelblue":	[176,196,222],
		"lightyellow":	[255,255,224],
		"limegreen":	[50,205,50],
		"linen":	[250,240,230],
		"magenta":	[255,0,255],
		"mediumaquamarine": [102,205,170],
		"mediumblue":	[0,0,205],
		"mediumorchid": [186,85,211],
		"mediumpurple": [147,112,219],
		"mediumseagreen":	[60,179,113],
		"mediumslateblue":	[123,104,238],
		"mediumspringgreen":	[0,250,154],
		"mediumturquoise":	[72,209,204],
		"mediumvioletred":	[199,21,133],
		"midnightblue": [25,25,112],
		"mintcream":	[245,255,250],
		"mistyrose":	[255,228,225],
		"moccasin": [255,228,181],
		"navajowhite":	[255,222,173],
		"oldlace":	[253,245,230],
		"olivedrab":	[107,142,35],
		"orange":	[255,165,0],
		"orangered":	[255,69,0],
		"orchid":	[218,112,214],
		"palegoldenrod":	[238,232,170],
		"palegreen":	[152,251,152],
		"paleturquoise":	[175,238,238],
		"palevioletred":	[219,112,147],
		"papayawhip":	[255,239,213],
		"peachpuff":	[255,218,185],
		"peru": [205,133,63],
		"pink": [255,192,203],
		"plum": [221,160,221],
		"powderblue":	[176,224,230],
		"rosybrown":	[188,143,143],
		"royalblue":	[65,105,225],
		"saddlebrown":	[139,69,19],
		"salmon":	[250,128,114],
		"sandybrown":	[244,164,96],
		"seagreen": [46,139,87],
		"seashell": [255,245,238],
		"sienna":	[160,82,45],
		"skyblue":	[135,206,235],
		"slateblue":	[106,90,205],
		"slategray":	[112,128,144],
		"slategrey":	[112,128,144],
		"snow": [255,250,250],
		"springgreen":	[0,255,127],
		"steelblue":	[70,130,180],
		"tan":	[210,180,140],
		"thistle":	[216,191,216],
		"tomato":	[255,99,71],
		"turquoise":	[64,224,208],
		"violet":	[238,130,238],
		"wheat":	[245,222,179],
		"whitesmoke":	[245,245,245],
		"yellowgreen":	[154,205,50]
	});

	return Color;	// TODO: return ColorExt, not Color
});

},
'dijit/Menu':function(){
define([
	"require",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.byId dom.isDescendant
	"dojo/dom-attr", // domAttr.get domAttr.set domAttr.has domAttr.remove
	"dojo/dom-geometry", // domStyle.getComputedStyle domGeometry.position
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/keys", // keys.F10
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/sniff", // has("ie"), has("quirks")
	"dojo/_base/window", // win.body
	"dojo/window", // winUtils.get
	"./popup",
	"./DropDownMenu",
	"dojo/ready"
], function(require, array, declare, dom, domAttr, domGeometry, domStyle, keys, lang, on, has, win, winUtils, pm, DropDownMenu, ready){

	// module:
	//		dijit/Menu

	// Back compat w/1.6, remove for 2.0
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/MenuItem", "dijit/PopupMenuItem", "dijit/CheckedMenuItem", "dijit/MenuSeparator"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	return declare("dijit.Menu", DropDownMenu, {
		// summary:
		//		A context menu you can assign to multiple elements

		constructor: function(/*===== params, srcNodeRef =====*/){
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
			//		- replace srcNodeRef with my generated DOM tree

			this._bindings = [];
		},

		// targetNodeIds: [const] String[]
		//		Array of dom node ids of nodes to attach to.
		//		Fill this with nodeIds upon widget creation and it becomes context menu for those nodes.
		targetNodeIds: [],

		// selector: String?
		//		CSS expression to apply this Menu to descendants of targetNodeIds, rather than to
		//		the nodes specified by targetNodeIds themselves.    Useful for applying a Menu to
		//		a range of rows in a table, tree, etc.
		//
		//		The application must require() an appropriate level of dojo/query to handle the selector.
		selector: "",

		// TODO: in 2.0 remove support for multiple targetNodeIds.   selector gives the same effect.
		// So, change targetNodeIds to a targetNodeId: "", remove bindDomNode()/unBindDomNode(), etc.

		/*=====
		// currentTarget: [readonly] DOMNode
		//		For context menus, set to the current node that the Menu is being displayed for.
		//		Useful so that the menu actions can be tailored according to the node
		currentTarget: null,
		=====*/

		// contextMenuForWindow: [const] Boolean
		//		If true, right clicking anywhere on the window will cause this context menu to open.
		//		If false, must specify targetNodeIds.
		contextMenuForWindow: false,

		// leftClickToOpen: [const] Boolean
		//		If true, menu will open on left click instead of right click, similar to a file menu.
		leftClickToOpen: false,
		// TODO: remove in 2.0, we have better ways of opening a menu with a left click, by extending _HasDropDown.

		// refocus: Boolean
		//		When this menu closes, re-focus the element which had focus before it was opened.
		refocus: true,

		postCreate: function(){
			if(this.contextMenuForWindow){
				this.bindDomNode(this.ownerDocumentBody);
			}else{
				array.forEach(this.targetNodeIds, this.bindDomNode, this);
			}
			this.inherited(arguments);
		},

		// thanks burstlib!
		_iframeContentWindow: function(/* HTMLIFrameElement */iframe_el){
			// summary:
			//		Returns the window reference of the passed iframe
			// tags:
			//		private
			return winUtils.get(this._iframeContentDocument(iframe_el)) ||
				// Moz. TODO: is this available when defaultView isn't?
				this._iframeContentDocument(iframe_el)['__parent__'] ||
				(iframe_el.name && document.frames[iframe_el.name]) || null;	//	Window
		},

		_iframeContentDocument: function(/* HTMLIFrameElement */iframe_el){
			// summary:
			//		Returns a reference to the document object inside iframe_el
			// tags:
			//		protected
			return iframe_el.contentDocument // W3
				|| (iframe_el.contentWindow && iframe_el.contentWindow.document) // IE
				|| (iframe_el.name && document.frames[iframe_el.name] && document.frames[iframe_el.name].document)
				|| null;	//	HTMLDocument
		},

		bindDomNode: function(/*String|DomNode*/ node){
			// summary:
			//		Attach menu to given node
			node = dom.byId(node, this.ownerDocument);

			var cn;	// Connect node

			// Support context menus on iframes.  Rather than binding to the iframe itself we need
			// to bind to the <body> node inside the iframe.
			if(node.tagName.toLowerCase() == "iframe"){
				var iframe = node,
					window = this._iframeContentWindow(iframe);
				cn = win.body(window.document);
			}else{
				// To capture these events at the top level, attach to <html>, not <body>.
				// Otherwise right-click context menu just doesn't work.
				cn = (node == win.body(this.ownerDocument) ? this.ownerDocument.documentElement : node);
			}


			// "binding" is the object to track our connection to the node (ie, the parameter to bindDomNode())
			var binding = {
				node: node,
				iframe: iframe
			};

			// Save info about binding in _bindings[], and make node itself record index(+1) into
			// _bindings[] array.  Prefix w/_dijitMenu to avoid setting an attribute that may
			// start with a number, which fails on FF/safari.
			domAttr.set(node, "_dijitMenu" + this.id, this._bindings.push(binding));

			// Setup the connections to monitor click etc., unless we are connecting to an iframe which hasn't finished
			// loading yet, in which case we need to wait for the onload event first, and then connect
			// On linux Shift-F10 produces the oncontextmenu event, but on Windows it doesn't, so
			// we need to monitor keyboard events in addition to the oncontextmenu event.
			var doConnects = lang.hitch(this, function(cn){
				var selector = this.selector,
					delegatedEvent = selector ?
						function(eventType){
							return on.selector(selector, eventType);
						} :
						function(eventType){
							return eventType;
						},
					self = this;
				return [
					on(cn, delegatedEvent(this.leftClickToOpen ? "click" : "contextmenu"), function(evt){
						// Schedule context menu to be opened unless it's already been scheduled from onkeydown handler
						evt.stopPropagation();
						evt.preventDefault();

						// Note that this won't work will if the click was generated by the keyboard, while
						// focused on a <button> etc.   In that case evt.pageX and evt.pageY are either (0,0) or
						// wherever the mouse cursor is is.
						self._scheduleOpen(this, iframe, {x: evt.pageX, y: evt.pageY});
					}),
					on(cn, delegatedEvent("keydown"), function(evt){
						if(evt.shiftKey && evt.keyCode == keys.F10){
							evt.stopPropagation();
							evt.preventDefault();
							self._scheduleOpen(this, iframe);	// no coords - open near target node
						}
					})
				];
			});
			binding.connects = cn ? doConnects(cn) : [];

			if(iframe){
				// Setup handler to [re]bind to the iframe when the contents are initially loaded,
				// and every time the contents change.
				// Need to do this b/c we are actually binding to the iframe's <body> node.
				// Note: can't use connect.connect(), see #9609.

				binding.onloadHandler = lang.hitch(this, function(){
					// want to remove old connections, but IE throws exceptions when trying to
					// access the <body> node because it's already gone, or at least in a state of limbo

					var window = this._iframeContentWindow(iframe),
						cn = win.body(window.document);
					binding.connects = doConnects(cn);
				});
				if(iframe.addEventListener){
					iframe.addEventListener("load", binding.onloadHandler, false);
				}else{
					iframe.attachEvent("onload", binding.onloadHandler);
				}
			}
		},

		unBindDomNode: function(/*String|DomNode*/ nodeName){
			// summary:
			//		Detach menu from given node

			var node;
			try{
				node = dom.byId(nodeName, this.ownerDocument);
			}catch(e){
				// On IE the dom.byId() call will get an exception if the attach point was
				// the <body> node of an <iframe> that has since been reloaded (and thus the
				// <body> node is in a limbo state of destruction.
				return;
			}

			// node["_dijitMenu" + this.id] contains index(+1) into my _bindings[] array
			var attrName = "_dijitMenu" + this.id;
			if(node && domAttr.has(node, attrName)){
				var bid = domAttr.get(node, attrName) - 1, b = this._bindings[bid], h;
				while((h = b.connects.pop())){
					h.remove();
				}

				// Remove listener for iframe onload events
				var iframe = b.iframe;
				if(iframe){
					if(iframe.removeEventListener){
						iframe.removeEventListener("load", b.onloadHandler, false);
					}else{
						iframe.detachEvent("onload", b.onloadHandler);
					}
				}

				domAttr.remove(node, attrName);
				delete this._bindings[bid];
			}
		},

		_scheduleOpen: function(/*DomNode?*/ target, /*DomNode?*/ iframe, /*Object?*/ coords){
			// summary:
			//		Set timer to display myself.  Using a timer rather than displaying immediately solves
			//		two problems:
			//
			//		1. IE: without the delay, focus work in "open" causes the system
			//		context menu to appear in spite of stopEvent.
			//
			//		2. Avoid double-shows on linux, where shift-F10 generates an oncontextmenu event
			//		even after a evt.preventDefault().  (Shift-F10 on windows doesn't generate the
			//		oncontextmenu event.)

			if(!this._openTimer){
				this._openTimer = this.defer(function(){
					delete this._openTimer;
					this._openMyself({
						target: target,
						iframe: iframe,
						coords: coords
					});
				}, 1);
			}
		},

		_openMyself: function(args){
			// summary:
			//		Internal function for opening myself when the user does a right-click or something similar.
			// args:
			//		This is an Object containing:
			//
			//		- target: The node that is being clicked
			//		- iframe: If an `<iframe>` is being clicked, iframe points to that iframe
			//		- coords: Put menu at specified x/y position in viewport, or if iframe is
			//		  specified, then relative to iframe.
			//
			//		_openMyself() formerly took the event object, and since various code references
			//		evt.target (after connecting to _openMyself()), using an Object for parameters
			//		(so that old code still works).

			var target = args.target,
				iframe = args.iframe,
				coords = args.coords,
				byKeyboard = !coords;

			// To be used by MenuItem event handlers to tell which node the menu was opened on
			this.currentTarget = target;

			// Get coordinates to open menu, either at specified (mouse) position or (if triggered via keyboard)
			// then near the node the menu is assigned to.
			if(coords){
				if(iframe){
					// Specified coordinates are on <body> node of an <iframe>, convert to match main document
					var ifc = domGeometry.position(iframe, true),
						window = this._iframeContentWindow(iframe),
						scroll = domGeometry.docScroll(window.document);

					var cs = domStyle.getComputedStyle(iframe),
						tp = domStyle.toPixelValue,
						left = (has("ie") && has("quirks") ? 0 : tp(iframe, cs.paddingLeft)) + (has("ie") && has("quirks") ? tp(iframe, cs.borderLeftWidth) : 0),
						top = (has("ie") && has("quirks") ? 0 : tp(iframe, cs.paddingTop)) + (has("ie") && has("quirks") ? tp(iframe, cs.borderTopWidth) : 0);

					coords.x += ifc.x + left - scroll.x;
					coords.y += ifc.y + top - scroll.y;
				}
			}else{
				coords = domGeometry.position(target, true);
				coords.x += 10;
				coords.y += 10;
			}

			var self = this;
			var prevFocusNode = this._focusManager.get("prevNode");
			var curFocusNode = this._focusManager.get("curNode");
			var savedFocusNode = !curFocusNode || (dom.isDescendant(curFocusNode, this.domNode)) ? prevFocusNode : curFocusNode;

			function closeAndRestoreFocus(){
				// user has clicked on a menu or popup
				if(self.refocus && savedFocusNode){
					savedFocusNode.focus();
				}
				pm.close(self);
			}

			pm.open({
				popup: this,
				x: coords.x,
				y: coords.y,
				onExecute: closeAndRestoreFocus,
				onCancel: closeAndRestoreFocus,
				orient: this.isLeftToRight() ? 'L' : 'R'
			});

			// Focus the menu even when opened by mouse, so that a click on blank area of screen will close it
			this.focus();
			if(!byKeyboard){
				// But then (when opened by mouse), mark Menu as passive, so that the first item isn't highlighted.
				// On IE9+ this needs to be on a delay because the focus is asynchronous.
				this.defer(function(){
					this._cleanUp(true);
				});
			}

			this._onBlur = function(){
				this.inherited('_onBlur', arguments);
				// Usually the parent closes the child widget but if this is a context
				// menu then there is no parent
				pm.close(this);
				// don't try to restore focus; user has clicked another part of the screen
				// and set focus there
			};
		},

		destroy: function(){
			array.forEach(this._bindings, function(b){
				if(b){
					this.unBindDomNode(b.node);
				}
			}, this);
			this.inherited(arguments);
		}
	});
});

},
'dijit/DropDownMenu':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/keys", // keys
	"dojo/text!./templates/Menu.html",
	"./_MenuBase"
], function(declare, keys, template, _MenuBase){

	// module:
	//		dijit/DropDownMenu

	return declare("dijit.DropDownMenu", _MenuBase, {
		// summary:
		//		A menu, without features for context menu (Meaning, drop down menu)

		templateString: template,

		baseClass: "dijitMenu",

		// Arrow key navigation
		_onUpArrow: function(){
			this.focusPrev();
		},
		_onDownArrow: function(){
			this.focusNext();
		},
		_onRightArrow: function(/*Event*/ evt){
			this._moveToPopup(evt);
			evt.stopPropagation();
			evt.preventDefault();
		},
		_onLeftArrow: function(){
			if(this.parentMenu){
				if(this.parentMenu._isMenuBar){
					this.parentMenu.focusPrev();
				}else{
					this.onCancel(false);
				}
			}else{
				evt.stopPropagation();
				evt.preventDefault();
			}
		}
	});
});

},
'dijit/_MenuBase':function(){
define([
	"dojo/_base/array", // array.indexOf
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.isDescendant domClass.replace
	"dojo/dom-attr",
	"dojo/dom-class", // domClass.replace
	"dojo/_base/lang", // lang.hitch
	"dojo/mouse", // mouse.enter, mouse.leave
	"dojo/on",
	"dojo/window",
	"./a11yclick",
	"./registry",
	"./_Widget",
	"./_CssStateMixin",
	"./_KeyNavContainer",
	"./_TemplatedMixin"
], function(array, declare, dom, domAttr, domClass, lang, mouse, on, winUtils, a11yclick,
			registry, _Widget, _CssStateMixin, _KeyNavContainer, _TemplatedMixin){

	// module:
	//		dijit/_MenuBase

	return declare("dijit._MenuBase", [_Widget, _TemplatedMixin, _KeyNavContainer, _CssStateMixin], {
		// summary:
		//		Abstract base class for Menu and MenuBar.
		//		Subclass should implement _onUpArrow(), _onDownArrow(), _onLeftArrow(), and _onRightArrow().

		// selected: dijit/MenuItem
		//		Currently selected (a.k.a. highlighted) MenuItem, or null if no MenuItem is selected.
		//		If a submenu is open, will be set to MenuItem that displayed the submenu.   OTOH, if
		//		this Menu is in passive mode (i.e. hasn't been clicked yet), will be null, because
		//		"selected" is not merely "hovered".
		selected: null,
		_setSelectedAttr: function(item){
			if(this.selected != item){
				if(this.selected){
					this.selected._setSelected(false);
					this._onChildDeselect(this.selected);
				}
				if(item){
					item._setSelected(true);
				}
				this._set("selected", item);
			}
		},

		// activated: [readonly] Boolean
		//		This Menu has been clicked (mouse or via space/arrow key) or opened as a submenu,
		//		so mere mouseover will open submenus.  Focusing a menu via TAB does NOT automatically make it active
		//		since TAB is a navigation operation and not a selection one.
		//		For Windows apps, pressing the ALT key focuses the menubar menus (similar to TAB navigation) but the
		//		menu is not active (ie no dropdown) until an item is clicked.
		activated: false,
		_setActivatedAttr: function(val){
			domClass.toggle(this.domNode, "dijitMenuActive", val);
			domClass.toggle(this.domNode, "dijitMenuPassive", !val);
			this._set("activated", val);
		},

		// parentMenu: [readonly] Widget
		//		pointer to menu that displayed me
		parentMenu: null,

		// popupDelay: Integer
		//		After a menu has been activated (by clicking on it etc.), number of milliseconds before hovering
		//		(without clicking) another MenuItem causes that MenuItem's popup to automatically open.
		popupDelay: 500,

		// passivePopupDelay: Integer
		//		For a passive (unclicked) Menu, number of milliseconds before hovering (without clicking) will cause
		//		the popup to open.  Default is Infinity, meaning you need to click the menu to open it.
		passivePopupDelay: Infinity,

		// autoFocus: Boolean
		//		A toggle to control whether or not a Menu gets focused when opened as a drop down from a MenuBar
		//		or DropDownButton/ComboButton.   Note though that it always get focused when opened via the keyboard.
		autoFocus: false,

		childSelector: function(/*DOMNode*/ node){
			// summary:
			//		Selector (passed to on.selector()) used to identify MenuItem child widgets, but exclude inert children
			//		like MenuSeparator.  If subclass overrides to a string (ex: "> *"), the subclass must require dojo/query.
			// tags:
			//		protected

			var widget = registry.byNode(node);
			return node.parentNode == this.containerNode && widget && widget.focus;
		},

		postCreate: function(){
			var self = this,
				matches = typeof this.childSelector == "string" ? this.childSelector : lang.hitch(this, "childSelector");
			this.own(
				on(this.containerNode, on.selector(matches, mouse.enter), function(){
					self.onItemHover(registry.byNode(this));
				}),
				on(this.containerNode, on.selector(matches, mouse.leave), function(){
					self.onItemUnhover(registry.byNode(this));
				}),
				on(this.containerNode, on.selector(matches, a11yclick), function(evt){
					self.onItemClick(registry.byNode(this), evt);
					evt.stopPropagation();
				}),
				on(this.containerNode, on.selector(matches, "focusin"), function(){
					self._onItemFocus(registry.byNode(this));
				})
			);
			this.inherited(arguments);
		},

		onKeyboardSearch: function(/*MenuItem*/ item, /*Event*/ evt, /*String*/ searchString, /*Number*/ numMatches){
			// summary:
			//		Attach point for notification about when a menu item has been searched for
			//		via the keyboard search mechanism.
			// tags:
			//		protected
			this.inherited(arguments);
			if(!!item && (numMatches == -1 || (!!item.popup && numMatches == 1))){
				this.onItemClick(item, evt);
			}
		},

		_keyboardSearchCompare: function(/*dijit/_WidgetBase*/ item, /*String*/ searchString){
			// summary:
			//		Compares the searchString to the widget's text label, returning:
			//		-1: a high priority match and stop searching
			//		 0: no match
			//		 1: a match but keep looking for a higher priority match
			// tags:
			//		private
			if(!!item.shortcutKey){
				// accessKey matches have priority
				return searchString == item.shortcutKey.toLowerCase() ? -1 : 0;
			}
			return this.inherited(arguments) ? 1 : 0; // change return value of -1 to 1 so that searching continues
		},

		onExecute: function(){
			// summary:
			//		Attach point for notification about when a menu item has been executed.
			//		This is an internal mechanism used for Menus to signal to their parent to
			//		close them, because they are about to execute the onClick handler.  In
			//		general developers should not attach to or override this method.
			// tags:
			//		protected
		},

		onCancel: function(/*Boolean*/ /*===== closeAll =====*/){
			// summary:
			//		Attach point for notification about when the user cancels the current menu
			//		This is an internal mechanism used for Menus to signal to their parent to
			//		close them.  In general developers should not attach to or override this method.
			// tags:
			//		protected
		},

		_moveToPopup: function(/*Event*/ evt){
			// summary:
			//		This handles the right arrow key (left arrow key on RTL systems),
			//		which will either open a submenu, or move to the next item in the
			//		ancestor MenuBar
			// tags:
			//		private

			if(this.focusedChild && this.focusedChild.popup && !this.focusedChild.disabled){
				this.onItemClick(this.focusedChild, evt);
			}else{
				var topMenu = this._getTopMenu();
				if(topMenu && topMenu._isMenuBar){
					topMenu.focusNext();
				}
			}
		},

		_onPopupHover: function(/*Event*/ /*===== evt =====*/){
			// summary:
			//		This handler is called when the mouse moves over the popup.
			// tags:
			//		private

			// if the mouse hovers over a menu popup that is in pending-close state,
			// then stop the close operation.
			// This can't be done in onItemHover since some popup targets don't have MenuItems (e.g. ColorPicker)

			// highlight the parent menu item pointing to this popup (in case user temporarily moused over another MenuItem)
			this.set("selected", this.currentPopupItem);

			// cancel the pending close (if there is one) (in case user temporarily moused over another MenuItem)
			this._stopPendingCloseTimer();
		},

		onItemHover: function(/*MenuItem*/ item){
			// summary:
			//		Called when cursor is over a MenuItem.
			// tags:
			//		protected

			// Don't do anything unless user has "activated" the menu by:
			//		1) clicking it
			//		2) opening it from a parent menu (which automatically activates it)

			if(this.activated){
				this.set("selected", item);
				if(item.popup && !item.disabled && !this.hover_timer){
					this.hover_timer = this.defer(function(){
						this._openItemPopup(item);
					}, this.popupDelay);
				}
			}else if(this.passivePopupDelay < Infinity){
				if(this.passive_hover_timer){
					this.passive_hover_timer.remove();
				}
				this.passive_hover_timer = this.defer(function(){
					this.onItemClick(item, {type: "click"});
				}, this.passivePopupDelay);
			}

			this._hoveredChild = item;

			item._set("hovering", true);
		},

		_onChildDeselect: function(item){
			// summary:
			//		Called when a child MenuItem becomes deselected.   Setup timer to close its popup.

			this._stopPopupTimer();

			// Setup timer to close all popups that are open and descendants of this menu.
			// Will be canceled if user quickly moves the mouse over the popup.
			if(this.currentPopupItem == item){
				this._stopPendingCloseTimer();
				this._pendingClose_timer = this.defer(function(){
					this._pendingClose_timer = null;
					this.currentPopupItem = null;
					item._closePopup(); // this calls onClose
				}, this.popupDelay);
			}
		},

		onItemUnhover: function(/*MenuItem*/ item){
			// summary:
			//		Callback fires when mouse exits a MenuItem
			// tags:
			//		protected

			if(this._hoveredChild == item){
				this._hoveredChild = null;
			}

			if(this.passive_hover_timer){
				this.passive_hover_timer.remove();
				this.passive_hover_timer = null;
			}

			item._set("hovering", false);
		},

		_stopPopupTimer: function(){
			// summary:
			//		Cancels the popup timer because the user has stop hovering
			//		on the MenuItem, etc.
			// tags:
			//		private

			if(this.hover_timer){
				this.hover_timer = this.hover_timer.remove();
			}
		},

		_stopPendingCloseTimer: function(){
			// summary:
			//		Cancels the pending-close timer because the close has been preempted
			// tags:
			//		private
			if(this._pendingClose_timer){
				this._pendingClose_timer = this._pendingClose_timer.remove();
			}
		},

		_getTopMenu: function(){
			// summary:
			//		Returns the top menu in this chain of Menus
			// tags:
			//		private
			for(var top = this; top.parentMenu; top = top.parentMenu){}
			return top;
		},

		onItemClick: function(/*dijit/_WidgetBase*/ item, /*Event*/ evt){
			// summary:
			//		Handle clicks on an item.
			// tags:
			//		private

			if(this.passive_hover_timer){
				this.passive_hover_timer.remove();
			}

			this.focusChild(item);

			if(item.disabled){
				return false;
			}

			if(item.popup){
				this.set("selected", item);
				this.set("activated", true);
				var byKeyboard = /^key/.test(evt._origType || evt.type) ||
					(evt.clientX == 0 && evt.clientY == 0);	// detects accessKey like ALT+SHIFT+F, where type is "click"
				this._openItemPopup(item, byKeyboard);
			}else{
				// before calling user defined handler, close hierarchy of menus
				// and restore focus to place it was when menu was opened
				this.onExecute();

				// user defined handler for click
				item._onClick ? item._onClick(evt) : item.onClick(evt);
			}
		},

		_openItemPopup: function(/*dijit/MenuItem*/ from_item, /*Boolean*/ focus){
			// summary:
			//		Open the popup to the side of/underneath the current menu item, and optionally focus first item
			// tags:
			//		protected

			if(from_item == this.currentPopupItem){
				// Specified popup is already being shown, so just return
				return;
			}
			if(this.currentPopupItem){
				// If another popup is currently shown, then close it
				this._stopPendingCloseTimer();
				this.currentPopupItem._closePopup();
			}
			this._stopPopupTimer();

			var popup = from_item.popup;
			popup.parentMenu = this;

			// detect mouseover of the popup to handle lazy mouse movements that temporarily focus other menu items\c
			this.own(this._mouseoverHandle = on.once(popup.domNode, "mouseover", lang.hitch(this, "_onPopupHover")));

			var self = this;
			from_item._openPopup({
				parent: this,
				orient: this._orient || ["after", "before"],
				onCancel: function(){ // called when the child menu is canceled
					if(focus){
						// put focus back on my node before focused node is hidden
						self.focusChild(from_item);
					}

					// close the submenu (be sure this is done _after_ focus is moved)
					self._cleanUp();
				},
				onExecute: lang.hitch(this, "_cleanUp", true),
				onClose: function(){
					// Remove handler created by onItemHover
					if(self._mouseoverHandle){
						self._mouseoverHandle.remove();
						delete self._mouseoverHandle;
					}
				}
			}, focus);

			this.currentPopupItem = from_item;

			// TODO: focusing a popup should clear tabIndex on Menu (and it's child MenuItems), so that neither
			// TAB nor SHIFT-TAB returns to the menu.  Only ESC or ENTER should return to the menu.
		},

		onOpen: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		Callback when this menu is opened.
			//		This is called by the popup manager as notification that the menu
			//		was opened.
			// tags:
			//		private

			this.isShowingNow = true;
			this.set("activated", true);
		},

		onClose: function(){
			// summary:
			//		Callback when this menu is closed.
			//		This is called by the popup manager as notification that the menu
			//		was closed.
			// tags:
			//		private

			this.set("activated", false);
			this.set("selected", null);
			this.isShowingNow = false;
			this.parentMenu = null;
		},

		_closeChild: function(){
			// summary:
			//		Called when submenu is clicked or focus is lost.  Close hierarchy of menus.
			// tags:
			//		private
			this._stopPopupTimer();

			if(this.currentPopupItem){
				// If focus is on a descendant MenuItem then move focus to me,
				// because IE doesn't like it when you display:none a node with focus,
				// and also so keyboard users don't lose control.
				// Likely, immediately after a user defined onClick handler will move focus somewhere
				// else, like a Dialog.
				if(this.focused){
					domAttr.set(this.selected.focusNode, "tabIndex", this.tabIndex);
					this.selected.focusNode.focus();
				}

				// Close all popups that are open and descendants of this menu
				this.currentPopupItem._closePopup();
				this.currentPopupItem = null;
			}
		},

		_onItemFocus: function(/*MenuItem*/ item){
			// summary:
			//		Called when child of this Menu gets focus from:
			//
			//		1. clicking it
			//		2. tabbing into it
			//		3. being opened by a parent menu.
			//
			//		This is not called just from mouse hover.

			if(this._hoveredChild && this._hoveredChild != item){
				this.onItemUnhover(this._hoveredChild);	// any previous mouse movement is trumped by focus selection
			}
			this.set("selected", item);
		},

		_onBlur: function(){
			// summary:
			//		Called when focus is moved away from this Menu and it's submenus.
			// tags:
			//		protected

			this._cleanUp(true);
			this.inherited(arguments);
		},

		_cleanUp: function(/*Boolean*/ clearSelectedItem){
			// summary:
			//		Called when the user is done with this menu.  Closes hierarchy of menus.
			// tags:
			//		private

			this._closeChild(); // don't call this.onClose since that's incorrect for MenuBar's that never close
			if(typeof this.isShowingNow == 'undefined'){ // non-popup menu doesn't call onClose
				this.set("activated", false);
			}

			if(clearSelectedItem){
				this.set("selected", null);
			}
		}
	});
});

},
'dijit/_KeyNavContainer':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/keys", // keys.END keys.HOME
	"dojo/_base/lang", // lang.hitch
	"./registry",
	"./_Container",
	"./_FocusMixin",
	"./_KeyNavMixin"
], function(array, declare, domAttr, kernel, keys, lang, registry, _Container, _FocusMixin, _KeyNavMixin){


	// module:
	//		dijit/_KeyNavContainer

	return declare("dijit._KeyNavContainer", [_FocusMixin, _KeyNavMixin, _Container], {
		// summary:
		//		A _Container with keyboard navigation of its children.
		// description:
		//		Provides normalized keyboard and focusing code for Container widgets.
		//		To use this mixin, call connectKeyNavHandlers() in postCreate().
		//		Also, child widgets must implement a focus() method.

		connectKeyNavHandlers: function(/*keys[]*/ prevKeyCodes, /*keys[]*/ nextKeyCodes){
			// summary:
			//		Deprecated.  You can call this in postCreate() to attach the keyboard handlers to the container,
			//		but the preferred method is to override _onLeftArrow() and _onRightArrow(), or
			//		_onUpArrow() and _onDownArrow(), to call focusPrev() and focusNext().
			// prevKeyCodes: keys[]
			//		Key codes for navigating to the previous child.
			// nextKeyCodes: keys[]
			//		Key codes for navigating to the next child.
			// tags:
			//		protected

			// TODO: remove for 2.0, and make subclasses override _onLeftArrow, _onRightArrow etc. instead.

			var keyCodes = (this._keyNavCodes = {});
			var prev = lang.hitch(this, "focusPrev");
			var next = lang.hitch(this, "focusNext");
			array.forEach(prevKeyCodes, function(code){
				keyCodes[code] = prev;
			});
			array.forEach(nextKeyCodes, function(code){
				keyCodes[code] = next;
			});
			keyCodes[keys.HOME] = lang.hitch(this, "focusFirstChild");
			keyCodes[keys.END] = lang.hitch(this, "focusLastChild");
		},

		startupKeyNavChildren: function(){
			kernel.deprecated("startupKeyNavChildren() call no longer needed", "", "2.0");
		},

		startup: function(){
			this.inherited(arguments);
			array.forEach(this.getChildren(), lang.hitch(this, "_startupChild"));
		},

		addChild: function(/*dijit/_WidgetBase*/ widget, /*int?*/ insertIndex){
			this.inherited(arguments);
			this._startupChild(widget);
		},

		_startupChild: function(/*dijit/_WidgetBase*/ widget){
			// summary:
			//		Setup for each child widget.
			// description:
			//		Sets tabIndex=-1 on each child, so that the tab key will
			//		leave the container rather than visiting each child.
			//
			//		Note: if you add children by a different method than addChild(), then need to call this manually
			//		or at least make sure the child's tabIndex is -1.
			//
			//		Note: see also _LayoutWidget.setupChild(), which is also called for each child widget.
			// tags:
			//		private

			widget.set("tabIndex", "-1");
		},

		_getFirst: function(){
			// summary:
			//		Returns the first child.
			// tags:
			//		abstract extension
			var children = this.getChildren();
			return children.length ? children[0] : null;
		},

		_getLast: function(){
			// summary:
			//		Returns the last descendant.
			// tags:
			//		abstract extension
			var children = this.getChildren();
			return children.length ? children[children.length - 1] : null;
		},

		focusNext: function(){
			// summary:
			//		Focus the next widget
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, 1));
		},

		focusPrev: function(){
			// summary:
			//		Focus the last focusable node in the previous widget
			//		(ex: go to the ComboButton icon section rather than button section)
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, -1), true);
		},

		childSelector: function(/*DOMNode*/ node){
			// Implement _KeyNavMixin.childSelector, to identify focusable child nodes.
			// If we allowed a dojo/query dependency from this module this could more simply be a string "> *"
			// instead of this function.

			var node = registry.byNode(node);
			return node && node.getParent() == this;
		}
	});
});

},
'demos/i18n/model':function(){
// wrapped by build app
define(["dojo","dijit","dojox"], function(dojo,dijit,dojox){
dojo.provide("demos.i18n.model");
dojo.declare(
	"i18nTreeModel",
	null,
{
	// summary:
	//		Implements dijit.Tree.model connecting to I18N data

	// stub to call geoname RPC server
	geoname: null,
	
	// array of info about each country
	countries: null,

	constructor: function(args){
		this.lang = args.lang || "en";

		// This allows calls to geonames server
		this.geonames = new dojox.rpc.Service(dojo.moduleUrl("dojox.rpc.SMDLibrary", "geonames.smd"));
	},

	destroy: function(){
	},

	// =======================================================================
	// Methods for traversing hierarchy

	getRoot: function(onItem, onError){
		onItem({type: "root", root: true, name: "Continents"});
	},

	mayHaveChildren: function(/*dojo.data.Item*/ item){
		// summary:
		//		Tells if an item has or may have children.
		return item.root || item.type == "continent" || item.type == "country";
	},

	getChildren: function(/*dojo.data.Item*/ item, /*function(items)*/ onComplete, /*function*/ onError){
		// summary:
		//		Calls onComplete() with array of child items of given parent item, all loaded.

		switch(item.root ?  "top" : item.type){
			case "top":
				var d = dojo.xhrGet({url: "continents.json", handleAs: "json-comment-optional"});
				d.addCallback(onComplete);
				break;
			case "continent":
				// Unfortunately we can't query countries filtering by continent, so the first time
				// we hit this code we just query all the countries and store them away
				var callback = function(countries){
					var matches = dojo.filter(countries, function(c){
						c.type = "country";
						return c.continent == item.iso;
					});
					onComplete( matches );
				};
				
				if(!this.countries){
					// Load country database over RPC to Geonames server

					var def = this.geonames.getCountryInfo({lang: this.lang});
					def.addCallback(this, function(result){
						this.countries = result.geonames;
						callback(this.countries);
					});
				}else{
					callback(this.countries);
				}
				break;
			case "country":
				// First time we are asked for the children of a country, need to load
				// the mapping from language code --> language name in the current page's locale
				if(!this.d2){
					this.d2 = dojo.xhrGet({url: "languages.json", handleAs: "json-comment-optional"});
					this.d2.addCallback(this, function(data){
						// first item on deferred chain filters languages.json data down to
						// language names in current page's locale
						return dojo.filter(data, function(l){
							return l.iso == this.lang;
						})[0] || {};
					});
				}
				// Once we have mapping from language ISO code to language name, use it
				this.d2.addCallback(function(mapping){
					// summary:
					//		Converts a comma separated list of locales into
					//		an array of locale objects, and passes that array to onComplete

					// split localeList into array, ignoring final blank entry due to trailing comma
					var ary = dojo.filter(item.languages.split(","), function(loc){
						return loc;
					});

					// map array into locale objects
					var locales = dojo.map(ary, function(loc){
						loc = loc.toLowerCase();

						// get language object for the page language
						var langISO = loc.replace(/-.*/, "");

						// get localized name of language
						var name = mapping[langISO] || "";

						return {
							type: "locale",
							iso: loc,
							lang: langISO,
							name: name + " \u202b(" + loc + ")\u202c"
						};
					});
					onComplete(locales);
					return mapping;		// Deferreds need to return their original arg for the next guy in chain (in the future)
				});
				break;
		}
	},

	// =======================================================================
	// Inspecting items

	getIdentity: function(/* item */ item){
		// Prefer item.key over item.countryCode to differentiate between countries and continents
		// w/same iso code (like AN).
		return item.root ? "world" : (item.key || item.iso || item.countryCode);
	},

	getLabel: function(/*dojo.data.Item*/ item){
		// summary:
		//		get the label for an item
		return item.name || item.countryName;
	},

	// =======================================================================
	// Write interface (unimplemented)

	newItem: function(/* Object? */ args, /*Item*/ parent){
	},

	pasteItem: function(/*Item*/ childItem, /*Item*/ oldParentItem, /*Item*/ newParentItem, /*Boolean*/ bCopy){
	},

	// =======================================================================
	// Callbacks (unimplemented)
	
	onChange: function(/*dojo.data.Item*/ item){
	},

	onChildrenChange: function(/*dojo.data.Item*/ parent, /*dojo.data.Item[]*/ newChildrenList){
	},

	onDelete: function(/*dojo.data.Item*/ parent, /*dojo.data.Item[]*/ newChildrenList){
	}
});
});

},
'dojox/analytics/Urchin':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/window",
        "dojo/_base/config", "dojo/dom-construct"
], function(lang, declare, window, config, construct){

	/*=====
	lang.mixin(config,{
		// urchin: String
		//		Used by `dojox.analytics.Urchin` as the default UA-123456-7 account
		//		number used when being created. Alternately, you can pass an acct:""
		//		parameter to the constructor a la: new dojox.analytics.Urchin({ acct:"UA-123456-7" });
		urchin: ""
	});
	=====*/

	return declare("dojox.analytics.Urchin", null, {
		// summary:
		//		A Google-analytics helper, for post-onLoad inclusion of the tracker, and
		//		dynamic tracking during long-lived page cycles.
		// description:
		//		A small class object will allows for lazy-loading the Google Analytics API
		//		at any point during a page lifecycle. Most commonly, Google-Analytics is loaded
		//		via a synchronous script tag in the body, which causes `dojo.addOnLoad` to
		//		stall until the external API has been completely loaded. The Urchin helper
		//		will load the API on the fly, and provide a convenient API to use, wrapping
		//		Analytics for Ajaxy or single page applications.
		//
		//		The class can be instantiated two ways: Programatically, by passing an
		//		`acct:` parameter, or via Markup / dojoType and defining a djConfig
		//		parameter `urchin:`
		//
		//		IMPORTANT:
		//		This module will not work simultaneously with the core dojox.analytics
		//		package. If you need the ability to run Google Analytics AND your own local
		//		analytics system, you MUST include dojox.analytics._base BEFORE dojox.analytics.Urchin
		// example:
		//	|	// create the tracker programatically:
		//	|	var tracker = new dojox.analytics.Urchin({ acct:"UA-123456-7" });
		//
		// example:
		//	|	// define the urchin djConfig option:
		//	|	var djConfig = { urchin: "UA-123456-7" };
		//	|
		//	|	// and in markup:
		//	|	<div dojoType="dojox.analytics.Urchin"></div>
		//	|	// or code:
		//	|	new dojox.analytics.Urchin();
		//
		// example:
		//	|	// create and define all analytics with one tag.
		//	|	<div dojoType="dojox.analytics.Urchin" acct="UA-12345-67"></div>

		// acct: String
		//		your GA urchin tracker account number. Overrides `djConfig.urchin`
		acct: "",

		constructor: function(args){
			// summary:
			//		Initialize this Urchin instance. Immediately starts the load
			//		sequence, so defer construction until (ideally) after onLoad and
			//		potentially widget parsing.
			this.tracker = null;
			lang.mixin(this, args);
			this.acct = this.acct || config.urchin;

			var re = /loaded|complete/,
				gaHost = ("https:" == window.doc.location.protocol) ? "https://ssl." : "http://www.",
				h = window.doc.getElementsByTagName("head")[0],
				n = construct.create('script', {
					src: gaHost + "google-analytics.com/ga.js"
				}, h);

			n.onload = n.onreadystatechange = lang.hitch(this, function(e){
				if(e && e.type == "load" || re.test(n.readyState)){
					n.onload = n.onreadystatechange = null;
					this._gotGA();
					h.removeChild(n);
				}
			});

		},

		_gotGA: function(){
			// summary:
			//		initialize the tracker
			this.tracker = _gat._getTracker(this.acct);
			this.GAonLoad.apply(this, arguments);
		},

		GAonLoad: function(){
			// summary:
			//		Stub function to fire when urchin is complete
			// description:
			//		This function is executed when the tracker variable is
			//		complete and initialized. The initial trackPageView (with
			//		no arguments) is called here as well, so remeber to call
			//		manually if overloading this method.
			//
			// example:
			//		Create an Urchin tracker that will track a specific page on init
			//		after page load (or parsing, if parseOnLoad is true)
			//	|	dojo.addOnLoad(function(){
			//	|		new dojox.ananlytics.Urchin({
			//	|			acct:"UA-12345-67",
			//	|			GAonLoad: function(){
			//	|				this.trackPageView("/custom-page");
			//	|			}
			//	|		});
			//	|	});
			
			this.trackPageView();
		},

		trackPageView: function(/* string */url){
			// summary:
			//		A public API attached to this widget instance, allowing you
			//		Ajax-like notification of updates.
			// url: String
			//		A location to tell the tracker to track, eg: "/my-ajaxy-endpoint"
			// example:
			//		Track clicks from a container of anchors and populate a `ContentPane`
			//	|	// 'tracker' is our `Urchin` instance, pane is the `ContentPane` ref.
			//	|	dojo.connect(container, "onclick", function(e){
			//	|		var ref = dojo.attr(e.target, "href");
			//	|		tracker.trackPageView(ref);
			//	|		pane.attr("href", ref);
			//	|	});
			
			this.tracker._trackPageview.apply(this.tracker, arguments);
		}

	});
});

},
'url:dijit/templates/TreeNode.html':"<div class=\"dijitTreeNode\" role=\"presentation\"\n\t><div data-dojo-attach-point=\"rowNode\" class=\"dijitTreeRow\" role=\"presentation\"\n\t\t><span data-dojo-attach-point=\"expandoNode\" class=\"dijitInline dijitTreeExpando\" role=\"presentation\"></span\n\t\t><span data-dojo-attach-point=\"expandoNodeText\" class=\"dijitExpandoText\" role=\"presentation\"></span\n\t\t><span data-dojo-attach-point=\"contentNode\"\n\t\t\tclass=\"dijitTreeContent\" role=\"presentation\">\n\t\t\t<span role=\"presentation\" class=\"dijitInline dijitIcon dijitTreeIcon\" data-dojo-attach-point=\"iconNode\"></span\n\t\t\t><span data-dojo-attach-point=\"labelNode,focusNode\" class=\"dijitTreeLabel\" role=\"treeitem\" tabindex=\"-1\" aria-selected=\"false\"></span>\n\t\t</span\n\t></div>\n\t<div data-dojo-attach-point=\"containerNode\" class=\"dijitTreeNodeContainer\" role=\"presentation\" style=\"display: none;\"></div>\n</div>\n",
'url:dijit/templates/Tree.html':"<div role=\"tree\">\n\t<div class=\"dijitInline dijitTreeIndent\" style=\"position: absolute; top: -9999px\" data-dojo-attach-point=\"indentDetector\"></div>\n\t<div class=\"dijitTreeExpando dijitTreeExpandoLoading\" data-dojo-attach-point=\"rootLoadingIndicator\"></div>\n\t<div data-dojo-attach-point=\"containerNode\" class=\"dijitTreeContainer\" role=\"presentation\">\n\t</div>\n</div>\n",
'url:dijit/templates/Calendar.html':"<table cellspacing=\"0\" cellpadding=\"0\" class=\"dijitCalendarContainer\" role=\"grid\" aria-labelledby=\"${id}_mddb ${id}_year\" data-dojo-attach-point=\"gridNode\">\n\t<thead>\n\t\t<tr class=\"dijitReset dijitCalendarMonthContainer\" valign=\"top\">\n\t\t\t<th class='dijitReset dijitCalendarArrow' data-dojo-attach-point=\"decrementMonth\" scope=\"col\">\n\t\t\t\t<span class=\"dijitInline dijitCalendarIncrementControl dijitCalendarDecrease\" role=\"presentation\"></span>\n\t\t\t\t<span data-dojo-attach-point=\"decreaseArrowNode\" class=\"dijitA11ySideArrow\">-</span>\n\t\t\t</th>\n\t\t\t<th class='dijitReset' colspan=\"5\" scope=\"col\">\n\t\t\t\t<div data-dojo-attach-point=\"monthNode\">\n\t\t\t\t</div>\n\t\t\t</th>\n\t\t\t<th class='dijitReset dijitCalendarArrow' scope=\"col\" data-dojo-attach-point=\"incrementMonth\">\n\t\t\t\t<span class=\"dijitInline dijitCalendarIncrementControl dijitCalendarIncrease\" role=\"presentation\"></span>\n\t\t\t\t<span data-dojo-attach-point=\"increaseArrowNode\" class=\"dijitA11ySideArrow\">+</span>\n\t\t\t</th>\n\t\t</tr>\n\t\t<tr role=\"row\">\n\t\t\t${!dayCellsHtml}\n\t\t</tr>\n\t</thead>\n\t<tbody data-dojo-attach-point=\"dateRowsNode\" data-dojo-attach-event=\"ondijitclick: _onDayClick\" class=\"dijitReset dijitCalendarBodyContainer\">\n\t\t\t${!dateRowsHtml}\n\t</tbody>\n\t<tfoot class=\"dijitReset dijitCalendarYearContainer\">\n\t\t<tr>\n\t\t\t<td class='dijitReset' valign=\"top\" colspan=\"7\" role=\"presentation\">\n\t\t\t\t<div class=\"dijitCalendarYearLabel\">\n\t\t\t\t\t<span data-dojo-attach-point=\"previousYearLabelNode\" class=\"dijitInline dijitCalendarPreviousYear\" role=\"button\"></span>\n\t\t\t\t\t<span data-dojo-attach-point=\"currentYearLabelNode\" class=\"dijitInline dijitCalendarSelectedYear\" role=\"button\" id=\"${id}_year\"></span>\n\t\t\t\t\t<span data-dojo-attach-point=\"nextYearLabelNode\" class=\"dijitInline dijitCalendarNextYear\" role=\"button\"></span>\n\t\t\t\t</div>\n\t\t\t</td>\n\t\t</tr>\n\t</tfoot>\n</table>\n",
'url:dijit/form/templates/Button.html':"<span class=\"dijit dijitReset dijitInline\" role=\"presentation\"\n\t><span class=\"dijitReset dijitInline dijitButtonNode\"\n\t\tdata-dojo-attach-event=\"ondijitclick:__onClick\" role=\"presentation\"\n\t\t><span class=\"dijitReset dijitStretch dijitButtonContents\"\n\t\t\tdata-dojo-attach-point=\"titleNode,focusNode\"\n\t\t\trole=\"button\" aria-labelledby=\"${id}_label\"\n\t\t\t><span class=\"dijitReset dijitInline dijitIcon\" data-dojo-attach-point=\"iconNode\"></span\n\t\t\t><span class=\"dijitReset dijitToggleButtonIconChar\">&#x25CF;</span\n\t\t\t><span class=\"dijitReset dijitInline dijitButtonText\"\n\t\t\t\tid=\"${id}_label\"\n\t\t\t\tdata-dojo-attach-point=\"containerNode\"\n\t\t\t></span\n\t\t></span\n\t></span\n\t><input ${!nameAttrSetting} type=\"${type}\" value=\"${value}\" class=\"dijitOffScreen\"\n\t\tdata-dojo-attach-event=\"onclick:_onClick\"\n\t\ttabIndex=\"-1\" role=\"presentation\" data-dojo-attach-point=\"valueNode\"\n/></span>\n",
'url:dijit/form/templates/DropDownButton.html':"<span class=\"dijit dijitReset dijitInline\"\n\t><span class='dijitReset dijitInline dijitButtonNode'\n\t\tdata-dojo-attach-event=\"ondijitclick:__onClick\" data-dojo-attach-point=\"_buttonNode\"\n\t\t><span class=\"dijitReset dijitStretch dijitButtonContents\"\n\t\t\tdata-dojo-attach-point=\"focusNode,titleNode,_arrowWrapperNode,_popupStateNode\"\n\t\t\trole=\"button\" aria-haspopup=\"true\" aria-labelledby=\"${id}_label\"\n\t\t\t><span class=\"dijitReset dijitInline dijitIcon\"\n\t\t\t\tdata-dojo-attach-point=\"iconNode\"\n\t\t\t></span\n\t\t\t><span class=\"dijitReset dijitInline dijitButtonText\"\n\t\t\t\tdata-dojo-attach-point=\"containerNode\"\n\t\t\t\tid=\"${id}_label\"\n\t\t\t></span\n\t\t\t><span class=\"dijitReset dijitInline dijitArrowButtonInner\"></span\n\t\t\t><span class=\"dijitReset dijitInline dijitArrowButtonChar\">&#9660;</span\n\t\t></span\n\t></span\n\t><input ${!nameAttrSetting} type=\"${type}\" value=\"${value}\" class=\"dijitOffScreen\" tabIndex=\"-1\"\n\t\tdata-dojo-attach-event=\"onclick:_onClick\"\n\t\tdata-dojo-attach-point=\"valueNode\" role=\"presentation\"\n/></span>\n",
'url:dijit/form/templates/TextBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\" id=\"widget_${id}\" role=\"presentation\"\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\n\t\t><input class=\"dijitReset dijitInputInner\" data-dojo-attach-point='textbox,focusNode' autocomplete=\"off\"\n\t\t\t${!nameAttrSetting} type='${type}'\n\t/></div\n></div>\n",
'url:dijit/templates/Tooltip.html':"<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\"\n\t><div class=\"dijitTooltipConnector\" data-dojo-attach-point=\"connectorNode\"></div\n\t><div class=\"dijitTooltipContainer dijitTooltipContents\" data-dojo-attach-point=\"containerNode\" role='alert'></div\n></div>\n",
'url:dijit/form/templates/ValidationTextBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\n\tid=\"widget_${id}\" role=\"presentation\"\n\t><div class='dijitReset dijitValidationContainer'\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\n\t/></div\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\n\t\t><input class=\"dijitReset dijitInputInner\" data-dojo-attach-point='textbox,focusNode' autocomplete=\"off\"\n\t\t\t${!nameAttrSetting} type='${type}'\n\t/></div\n></div>\n",
'url:dijit/form/templates/DropDownBox.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\n\tid=\"widget_${id}\"\n\trole=\"combobox\"\n\taria-haspopup=\"true\"\n\tdata-dojo-attach-point=\"_popupStateNode\"\n\t><div class='dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton dijitArrowButtonContainer'\n\t\tdata-dojo-attach-point=\"_buttonNode\" role=\"presentation\"\n\t\t><input class=\"dijitReset dijitInputField dijitArrowButtonInner\" value=\"&#9660; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"button presentation\" aria-hidden=\"true\"\n\t\t\t${_buttonInputDisabled}\n\t/></div\n\t><div class='dijitReset dijitValidationContainer'\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\n\t/></div\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\n\t\t><input class='dijitReset dijitInputInner' ${!nameAttrSetting} type=\"text\" autocomplete=\"off\"\n\t\t\tdata-dojo-attach-point=\"textbox,focusNode\" role=\"textbox\"\n\t/></div\n></div>\n",
'url:dijit/form/templates/Spinner.html':"<div class=\"dijit dijitReset dijitInline dijitLeft\"\n\tid=\"widget_${id}\" role=\"presentation\"\n\t><div class=\"dijitReset dijitButtonNode dijitSpinnerButtonContainer\"\n\t\t><input class=\"dijitReset dijitInputField dijitSpinnerButtonInner\" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\n\t\t/><div class=\"dijitReset dijitLeft dijitButtonNode dijitArrowButton dijitUpArrowButton\"\n\t\t\tdata-dojo-attach-point=\"upArrowNode\"\n\t\t\t><div class=\"dijitArrowButtonInner\"\n\t\t\t\t><input class=\"dijitReset dijitInputField\" value=\"&#9650; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\n\t\t\t\t\t${_buttonInputDisabled}\n\t\t\t/></div\n\t\t></div\n\t\t><div class=\"dijitReset dijitLeft dijitButtonNode dijitArrowButton dijitDownArrowButton\"\n\t\t\tdata-dojo-attach-point=\"downArrowNode\"\n\t\t\t><div class=\"dijitArrowButtonInner\"\n\t\t\t\t><input class=\"dijitReset dijitInputField\" value=\"&#9660; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\n\t\t\t\t\t${_buttonInputDisabled}\n\t\t\t/></div\n\t\t></div\n\t></div\n\t><div class='dijitReset dijitValidationContainer'\n\t\t><input class=\"dijitReset dijitInputField dijitValidationIcon dijitValidationInner\" value=\"&#935; \" type=\"text\" tabIndex=\"-1\" readonly=\"readonly\" role=\"presentation\"\n\t/></div\n\t><div class=\"dijitReset dijitInputField dijitInputContainer\"\n\t\t><input class='dijitReset dijitInputInner' data-dojo-attach-point=\"textbox,focusNode\" type=\"${type}\" data-dojo-attach-event=\"onkeydown:_onKeyDown\"\n\t\t\trole=\"spinbutton\" autocomplete=\"off\" ${!nameAttrSetting}\n\t/></div\n></div>\n",
'url:dijit/templates/ColorPalette.html':"<div class=\"dijitInline dijitColorPalette\" role=\"grid\">\n\t<table data-dojo-attach-point=\"paletteTableNode\" class=\"dijitPaletteTable\" cellSpacing=\"0\" cellPadding=\"0\" role=\"presentation\">\n\t\t<tbody data-dojo-attach-point=\"gridNode\"></tbody>\n\t</table>\n</div>\n",
'url:dijit/templates/Menu.html':"<table class=\"dijit dijitMenu dijitMenuPassive dijitReset dijitMenuTable\" role=\"menu\" tabIndex=\"${tabIndex}\"\n\t   cellspacing=\"0\">\n\t<tbody class=\"dijitReset\" data-dojo-attach-point=\"containerNode\"></tbody>\n</table>\n",
'*now':function(r){r(['dojo/i18n!*preload*demos/i18n/nls/src*["ar","ca","cs","da","de","el","en-gb","en-us","es-es","fi-fi","fr-fr","he-il","hu","it-it","ja-jp","ko-kr","nl-nl","nb","pl","pt-br","pt-pt","ru","sk","sl","sv","th","tr","zh-tw","zh-cn","ROOT"]']);}
}});
// wrapped by build app
define("demos/i18n/src", ["dojo","dijit","dojox","dojo/require!dojo/io/script,dojox/rpc/Service,dijit/Tree,dijit/Calendar,dijit/layout/BorderContainer,dijit/layout/ContentPane,dijit/form/DateTextBox,dijit/form/CurrencyTextBox,dijit/form/NumberSpinner,dijit/form/ComboBox,dijit/ColorPalette,dijit/Menu,dojo/parser,demos/i18n/model,dojox/analytics/Urchin"], function(dojo,dijit,dojox){
dojo.provide("demos.i18n.src");

// For accessing Geonames service
dojo.require("dojo.io.script");
dojo.require("dojox.rpc.Service");

dojo.require("dijit.Tree");
dojo.require("dijit.Calendar");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.CurrencyTextBox");
dojo.require("dijit.form.NumberSpinner");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.ColorPalette");
dojo.require("dijit.Menu");
dojo.require("dojo.parser");

dojo.require("demos.i18n.model");

dojo.require("dojox.analytics.Urchin");
dojo.addOnLoad(function(){
	new dojox.analytics.Urchin({
		acct: "UA-3572741-1",
		GAonLoad: function(){
			this.trackPageView("/demos/i18n");
		}
	});
});
});
