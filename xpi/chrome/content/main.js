define(
    [
        "firestorageplus/fireStoragePlus",
        "firebug/lib/trace"
    ],
    function(Locale, FireStoragePlus, FBTrace) {
        
        var theApp =
        {
            initialize: function()
            {
                if (FBTrace.DBG_FIRESTORAGEPLUS) {
                    FBTrace.sysout("firestorageplus; firestorageplus extension initialize");
                    Firebug.registerStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
                }
            },
            shutdown: function()
            {
                if (FBTrace.DBG_FIRESTORAGEPLUS) {
                    FBTrace.sysout("firestorageplus; firestorageplus shutdown");
                }
                Firebug.unregisterStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
                Firebug.unregisterStringBundle("chrome://firestorageplus/locale/firestorageplus.properties");
                Firebug.unregisterPanel(FireStoragePlus);
            }
        };
        
        return theApp;
    }
);
