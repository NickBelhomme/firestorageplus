define(
    [
        'firebug/lib/trace',
        'firestorageplus/fireStoragePlusStorageItem'
    ],
    function(FBTrace, FireStoragePlusStorageItem) {
        var FireStoragePlusStorage = {
            getStorageItems: function (storage) {
                if (storage === 'localStorage') {
                    return this.getAllLocalStorageItems();
                }
                var storageObject = this.getStorageObject(storage);
                var items = [];
                var item;
                for (var key in storageObject) {
                    item = new FireStoragePlusStorageItem(key, storageObject[key], storage, this.getScopeFromLocation());
                    items.push(item);
                }
                return items;
            },
            getStorageObject: function(storage) {
                var object = {};
                try {
                    var context = Firebug.currentContext;
                    var names = ['localStorage', 'sessionStorage'];
                    for (var i = 0; i < 2; ++i)
                    {
                        if (names[i] !== storage)
                            continue;

                        Firebug.CommandLine.evaluate(
                            '((' + this.makeObject + ')(' + names[i] + '))',
                            context,
                            null, null,
                            function(result) {
                                object = result;
                                done = true;
                            },
                            function() {
                            },
                            true
                        );
                    }
                }
                catch(e)
                {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout('fireStoragePlus; EXCEPTION ' + e, e);
                }
                return object;
            },
            getScopeFromLocation : function() {
                var location = Firebug.currentContext.window.location;
                var port = location.port !== '' ? location.port : (location.protocol === 'https:' ? 443 : 80);
                return location.protocol + "://" + location.host + ":" + port +"/";
            },
            makeObject : function(storage) {
                // Create a raw object, free from getItem etc., from a storage.
                // May be serialized and run in page scope.
                var object = {};
                try
                {
                    for (var key in storage)
                    {
                        object[key] =  storage.getItem(key);
                    }
                }
                catch(e)
                {
                    // We can't log an error in page scope.
                }
                return object;
            },
            remove : function(storage) {
                var context = Firebug.currentContext;
                Firebug.CommandLine.evaluate(
                    '(' + storage.type  +'.removeItem("' + storage.key + '"))',
                    context,
                    null, null,
                    function(result) {
                    },
                    function() {
                    },
                    true
                );
            },
            add : function (storage) {
                var context = Firebug.currentContext;
                Firebug.CommandLine.evaluate(
                    '((' + this.addStorage + ')(' + storage.type + ', "' + storage.key + '", "' + escape(storage.value) + '"))',
                    context,
                    null, null,
                    function(key) {
                        storage.key = key;
                    },
                    function() {
                    },
                    true
                );
                return storage;
            },
            addStorage : function (storage, key, value) {
                var counter = 0;
                var newKey = key;
                while(null !== storage.getItem(newKey)) {
                    counter++;
                    newKey  = key + '_' + counter;
                }
                if (counter !== 0) {
                    key = newKey;
                }

                storage.setItem(key, unescape(value));
                return key;
            },
            getAllLocalStorageItems : function () {
                var items = [];
                var item;
                
                
                Components.utils.import("resource://gre/modules/FileUtils.jsm");
                var file = FileUtils.getFile("ProfD", ["webappsstore.sqlite"]);
                if (file.exists()) {
                  var localStorageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
                  var db = localStorageService.openDatabase(file);
                  var statement = db.createStatement("select scope,key,value,rowid from webappsstore2;");
                  
                  while(statement.executeStep())
                  {
                      item = new FireStoragePlusStorageItem(statement.getString(1), statement.getString(2), 'localStorage', this.getScope(statement.getString(0)));
                      items.push(item);
                  }
                  statement.reset();
                  return items;
                }
            },
            getScope : function (string) {
                var values = string.split(":");
                
                if (3 != values.length) {
                    return string;
                }
                
                var port = values.pop();
                var scheme = values.pop();
                var host = values.pop();
                
                var hostValues = host.split(".");
                
                host = "";
                
                for(var i = 0, imax = hostValues.length; i < imax; i++)
                {
                    string = hostValues.pop();
                    
                    if (string != "")
                    {
                        host = host + string.split("").reverse().join("");
                        if (i < imax-1)
                        {
                            host += ".";
                        }               
                    }            
                }
                
                return scheme + "://" + host + ":" + port +"/";
            }
        };

        return FireStoragePlusStorage;
    }
);