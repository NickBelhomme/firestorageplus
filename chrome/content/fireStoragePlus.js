define(
    [
        'firebug/lib/object',
        'firebug/lib/trace',
        'firebug/lib/string',
        "firestorageplus/fireStoragePlusDomplate"
    ],
    function(Obj, FBTrace, String, FireStoragePlusDomplate) {
        var panelName = 'firestorageplus';
        
        Firebug.FireStoragePlus = function FireStoragePlus() {};
        
        Firebug.FireStoragePlus.prototype = Obj.extend(
            Firebug.Panel,
            {
                name: panelName,
                title: 'FireStorage Plus!',
            
                // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
                // Initialization
            
                initialize: function() {
                    if (FBTrace.DBG_FIRESTORAGEPLUS) {
                        FBTrace.sysout("firestorageplus; panel init");
                    }
                    Firebug.Panel.initialize.apply(this, arguments);
                    this.refresh();
                },
            
                destroy: function(state) {
                    Firebug.Panel.destroy.apply(this, arguments);
                },
            
                show: function(state) {
                    Firebug.Panel.show.apply(this, arguments);
            
                    this.refresh();
                },
            
                refresh: function() {
                    FireStoragePlusDomplate.render(this);
                }
            }
        );
        
        Firebug.registerPanel(Firebug.FireStoragePlus);
        Firebug.registerStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
        
        return Firebug.FireStoragePlus;
    }
);