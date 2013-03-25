define(
    [
    ],
    function() {
        var FireStoragePlusStorageItem = function(key, value, type, scope) {
            this.key = key;
            this.value = value;
            this.type = type;
            this.scope = scope;
        };
        FireStoragePlusStorageItem.prototype = {
            key : null,
            value : null,
            type : null,
            scope : null,
            toString : function() {
                return this.key + '=' + this.value + '; type=' + this.type + '; scope=' + this.scope;
            },
            toJSON : function() {
                return JSON.stringify({'key':this.key, 'value':this.value, 'type':this.type, 'scope':this.scope});
            },
            toJSONObject : function() {
                return JSON.parse(this.toJSON());
            }
        };
        return FireStoragePlusStorageItem;
    }
);