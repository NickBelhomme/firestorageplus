define(
    [
        "firestorageplus/fireStoragePlus",
        "firestorageplus/fireStoragePlusObserver",
        "firebug/lib/array",
        "firebug/lib/options",
        "firebug/lib/trace"
    ],
    function(FireStoragePlus, FireStoragePlusObserver, Array, Options, FBTrace) {
        var storageObserver = null;
        var observerPref = 'firestorageplus.logEvents';
        
        var theApp =
        {
            initialize: function()
            {
                if (FBTrace.DBG_FIRESTORAGEPLUS) {
                    FBTrace.sysout("firestorageplus; firestorageplus extension initialize");
                    Firebug.registerStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
                }
                if (storageObserver === null) {
                    storageObserver = new FireStoragePlusObserver();
                    if (Options.getPref(Firebug.prefDomain, observerPref)) {
                        storageObserver.register();
                    }
                }          
                Firebug.registerUIListener(this);
            },
            shutdown: function()
            {
                if (FBTrace.DBG_FIRESTORAGEPLUS) {
                    FBTrace.sysout("firestorageplus; firestorageplus shutdown");
                }
                Firebug.unregisterStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
                Firebug.unregisterStringBundle("chrome://firestorageplus/locale/firestorageplus.properties");
                Firebug.unregisterUIListener(this);
                if (storageObserver !== null) {
                    storageObserver.unregister();
                }                
                Firebug.unregisterPanel(FireStoragePlus);
            },
            onOptionsMenu: function(context, panel, items)
            {
                if (panel.name != "console") {
                    return;
                }
                
                var isLogEventsEnabled = Options.getPref(Firebug.prefDomain, observerPref);
                var menuItem = {
                    label: "firestorageplus.show storage events",
                    tooltiptext: "firestorageplus.tip.show storage events",
                    type: "checkbox",
                    checked: isLogEventsEnabled,
                    command: function()
                    {
                        var checked = this.hasAttribute("checked");
                        Options.setPref(Firebug.prefDomain, observerPref, checked);
                        if (checked) {
                            storageObserver.register();
                        } else {
                            storageObserver.unregister();
                        }
                    }
                };
                
                
                var menu = [menuItem];

                // Append new option at the right position after stack trace.
                for (var i=0; i<items.length; i++)
                {
                    var item = items[i];
                    if (item.option == "showStackTrace")
                    {
                        Array.arrayInsert(items, i+1, menu);
                        return;
                    }
                }

                // If "cookie events" is not there append at the end.
                Array.arrayInsert(items, items.length, menu);
            }            
        };
        
        return theApp;
    }
);
