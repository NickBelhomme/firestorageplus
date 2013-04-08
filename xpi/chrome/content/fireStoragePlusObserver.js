define(
    [
     'firestorageplus/fireStoragePlusStorageItem'
    ],
    function(FireStoragePlusStorageItem) {
        var FireStoragePlusObserver = function () {
            this.topic = 'dom-storage2-changed';
        };
        
        FireStoragePlusObserver.prototype = {
            observe: function(subject, topic, data) {
                var item = new FireStoragePlusStorageItem(subject.key, subject.newValue, 'localStorage', subject.url);
                Firebug.Console.log(item.toTruncatedString());
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