define(
    [
        'firebug/lib/trace',
        'firestorageplus/fireStoragePlusStorageItem'
    ],
    function(FBTrace, FireStoragePlusStorageItem) {
        var databaseConnection = null;
    
        var FireStoragePlusStorage = {
            getStorageItems: function (storage) {
                var storageObject = this.getStorageObject(storage);
                var items = [];
                var item;
                for (var key in storageObject) {
                    item = new FireStoragePlusStorageItem(key, storageObject[key], storage, this.getCurrentScope());
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
            getCurrentScope : function() {
                var location = Firebug.currentContext.window.location;
                var port = location.port;
                if (port === '') {
                    switch (location.protocol) {
                        case 'http:': 
                            port = 80;
                            break;
                        case 'https:': 
                            port = 443;
                            break;
                    }
                }
                if (port !== '') {
                    return location.protocol + '//' + location.host + ':' + port;
                } else {
                    return location.href;
                }
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
                storage.scope = this.getCurrentScope();
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
                var db = this.getDatabaseConnection();
                if (db) {
                      var statement = db.createStatement("select scope,key,value,rowid from webappsstore2;");
                      
                      while(statement.executeStep())
                      {
                          item = new FireStoragePlusStorageItem(statement.getString(1), statement.getString(2), 'localStorage', this.normalizeScope(statement.getString(0)));
                          items.push(item);
                      }
                      statement.finalize();
                }
                return items;
            },
            getDatabaseConnection : function() {
                if (databaseConnection !== null) {
                    return databaseConnection;
                } 
                Components.utils.import("resource://gre/modules/FileUtils.jsm");
                var file = FileUtils.getFile("ProfD", ["webappsstore.sqlite"]);
                if (file.exists()) {
                    var storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
                    databaseConnection = storageService.openDatabase(file);
                    return databaseConnection;
                }
                
                return false;
            },
            removeAllLocalStorage : function (scope) {
                var db = this.getDatabaseConnection();
                if (db) {
                    db.executeSimpleSQL("delete from webappsstore2");
                }
            },
            removeStorageForCurrentScope : function (storage) {
                var context = Firebug.currentContext;
                Firebug.CommandLine.evaluate(
                    storage + '.clear()',
                    context,
                    null, null,
                    function(result) {
                    },
                    function() {
                    },
                    true
                );                
            },
            normalizeScope : function (string) {
                //input format "moc.koobecaf.www.:https:443"    
                //emoh.:about             
                //returned format "http://www.facebook.com:443"                
                var values = string.split(":");
                
                if (3 != values.length) {
                    return this.normalizeAbout(string);
                }
                
                var port = values.pop();
                var scheme = values.pop();
                var host = values.pop();
                
                var hostValues = host.split(".");
                
                host = "";
                var hostDenormalized;
                
                for(var i = 0, imax = hostValues.length; i < imax; i++)
                {
                    hostDenormalized = hostValues.pop();
                    
                    if (hostDenormalized != "")
                    {
                        host = host + hostDenormalized.split("").reverse().join("");
                        if (i < imax-1)
                        {
                            host += ".";
                        }               
                    }            
                }
                return scheme + "://" + host + ":" + port;
            },
            normalizeAbout : function (string) {
                //emoh.:about             
                //returned  about:home                
                var values = string.split(":");
                
                if (2 != values.length) {
                    return string;
                }
                
                var about = values.pop();
                var page = values.pop();
                page = page.split("").reverse().join("");
                return about + ":" + page.substr(1);
            }
        };

        return FireStoragePlusStorage;
    }
);