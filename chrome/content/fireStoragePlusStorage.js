define(
    [
        'firebug/lib/trace',
        'firebug/lib/string'
    ],
    function(FBTrace, String) {
        var fireStoragePlusStorage = {
            getStorageItems: function (storage) {
                var storageObject = this.getStorageObject(storage);
                var items = []; 
                for (var name in storageObject) {
                    items.push(
                        {
                            key: name, 
                            croppedValue: String.cropString(storageObject[name]),
                            prettyValue: this.pretty(storageObject[name]),
                            type: storage
                        }
                    );
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
            makeObject : function(storage) {
                // Create a raw object, free from getItem etc., from a storage.
                // May be serialized and run in page scope.
                var object = {};
                try
                {
                    for (var name in storage)
                    {
                        object[name] =  storage.getItem(name);
                    }
                }
                catch(e)
                {
                    // We can't log an error in page scope.
                }
                return object;
            },
            pretty: function (value) {
                try {
                    var jsonObject = JSON.parse(value);
                    return JSON.stringify(jsonObject, undefined, 2); // indentation level = 2
                } catch (e) {
                    return value;
                }
            }
        };
        
        return fireStoragePlusStorage;
    }
);