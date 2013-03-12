define(
    [
        'firebug/lib/object',
        'firebug/lib/trace',
        "firestorageplus/fireStoragePlusDomplate",
        "firestorageplus/fireStoragePlusClipboard",
        "firestorageplus/fireStoragePlusStorage",
        "firestorageplus/fireStoragePlusStorageItem"
    ],
    function(Obj, FBTrace, FireStoragePlusDomplate, FireStoragePlusClipboard, FireStoragePlusStorage, FireStoragePlusStorageItem) {

        function FireStoragePlusEdit(win) {
            this.window = win;
        }

    FireStoragePlusEdit.prototype =
    {
        storage: null,
        storageRow: null,
        action: null,
        
        onLoad: function()
        {
            var params = this.window.arguments[0];
            this.params = params;
            this.storage = params.storage;
            this.storageRow = params.storageRow;
            this.action = params.action;
    
            this.keyNode = this.getNode("fspKey");
            this.valueNode = this.getNode("fspValue");
            this.storageTypeNode = this.getNode("fspstorageType");
            this.localStorageNode = this.getNode("fspLocal");
            this.sessionStorageNode = this.getNode("fspSession");
    
            if (this.action === 'edit') {
                this.keyNode.value = unescape(this.storage.key);
                this.valueNode.value = unescape(this.storage.value);
        
                if (this.storage.type === 'sessionStorage') {
                    this.storageTypeNode.selectedIndex = 1;
                }
            }
        },
    
        onOk: function()
        {
            if (!this.checkValues())
                return false;
    
            var key = this.keyNode.value;
            var value = this.valueNode.value;
            var storageType = 'localStorage';
            if (this.sessionStorageNode.selected) {
                storageType = 'sessionStorage';
            }
            var storage = new FireStoragePlusStorageItem(key, value, storageType);
            

            if (this.storageRow) {
                FireStoragePlusStorage.remove(storage);
                storage = FireStoragePlusStorage.add(storage);
                FireStoragePlusDomplate.replaceStorageRow(storage, this.storageRow);
            } else {
                storage = FireStoragePlusStorage.add(storage);
                FireStoragePlusDomplate.insertStorageRow(storage);
            }

            this.window.close();
            return true;
        },
    
        /**
         * Verify values before the OK button is pressed.
         */
        checkValues: function()
        {
            var key = this.keyNode.value;
            if (!key)
            {
                prompts.alert(this.window, "FireStorage Plus! alert",
                    "invalid storage key");
                return false;
            }
            return true;
        },
    
        onCancel: function()
        {
            window.close();
        },
        
        getNode: function (id)
        {
            return this.window.document.getElementById(id);
        }
    };
    
    return FireStoragePlusEdit;
});
