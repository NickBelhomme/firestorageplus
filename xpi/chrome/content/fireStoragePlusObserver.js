define(
    [
     'firebug/lib/options',
     'firestorageplus/fireStoragePlusStorageItem',
     'firestorageplus/fireStoragePlusDomplate'
    ],
    function(Options, FireStoragePlusStorageItem, FireStoragePlusDomplate) {
        var FireStoragePlusObserver = function () {
            this.topic = 'dom-storage2-changed';
            this.pref = 'firestorageplus.logEvents';
        };
        
        FireStoragePlusObserver.prototype = {
            observe: function(subject, topic, data) {
                if (Options.getPref(Firebug.prefDomain, this.pref)) {
                    var item = new FireStoragePlusStorageItem(subject.key, subject.newValue, 'localStorage', subject.url);
                    Firebug.Console.log(item.toJSONObject());
                }
                FireStoragePlusDomplate.renderPreferedStorage();
            },
            register: function() {
                this.getObserverService().addObserver(this, this.topic, false);
            },
            unregister: function() {
                this.getObserverService().removeObserver(this, this.topic);
            },
            getObserverService : function() {
                return Components.classes["@mozilla.org/observer-service;1"]
                .getService(Components.interfaces.nsIObserverService);
            }
        };
        return FireStoragePlusObserver;
    }
);