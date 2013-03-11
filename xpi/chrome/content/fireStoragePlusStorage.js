define(
    [
        'firebug/lib/trace',
        'firestorageplus/fireStoragePlusStorageItem'
    ],
    function(FBTrace, FireStoragePlusStorageItem) {
        var FireStoragePlusStorage = {
            getStorageItems: function (storage) {
                var storageObject = this.getStorageObject(storage);
                var items = [];
                var item;
                for (var name in storageObject) {
                    item = new FireStoragePlusStorageItem(name, storageObject[name], storage);
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
            }
        };
        
        return FireStoragePlusStorage;
    }
);