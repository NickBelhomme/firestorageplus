define(
    [
    ],
    function() {
        var FireStoragePlusStorageItem = function(key, value, type) {
            this.key = key;
            this.value = value;
            this.type = type;
        };
        FireStoragePlusStorageItem.prototype = {
            key : null,
            value : null,
            type : null,
            toString : function() {
                return this.key + '=' + this.value + '; type=' + this.type;
            },
            toJSON : function() {
                return JSON.stringify({'key':this.key, 'value':this.value, 'type':this.type});
            },
            toJSONObject : function() {
                return JSON.parse(this.toJSON());
            }
        };
        return FireStoragePlusStorageItem;
    }
);