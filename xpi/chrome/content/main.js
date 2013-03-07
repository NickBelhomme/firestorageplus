define(
    [
        "firestorageplus/fireStoragePlus",
        "firebug/lib/trace"
    ],
    function(FireStoragePlus, FBTrace) {
    
        var theApp =
        {
            initialize: function()
            {
                if (FBTrace.DBG_FIRESTORAGEPLUS) {
                    FBTrace.sysout("firestorageplus; firestorageplus extension initialize");
                }
            },
            shutdown: function()
            {
                if (FBTrace.DBG_FIRESTORAGEPLUS) {
                    FBTrace.sysout("firestorageplus; firestorageplus shutdown");
                }
                Firebug.unregisterStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
                Firebug.unregisterPanel(FireStoragePlus);
            }
        };
        
        return theApp;
    }
);
