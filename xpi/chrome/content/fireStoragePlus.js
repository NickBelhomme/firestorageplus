define(
    [
        'firebug/lib/object',
        'firebug/lib/trace',
        "firestorageplus/fireStoragePlusDomplate",
        "firestorageplus/fireStoragePlusClipboard",
        "firestorageplus/fireStoragePlusStorage",
        "firestorageplus/fireStoragePlusEdit"
    ],
    function(Obj, FBTrace, FireStoragePlusDomplate, FireStoragePlusClipboard, FireStoragePlusStorage, FireStoragePlusEdit) {
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
                    FireStoragePlusDomplate.render(this);
                },
            
                refresh: function() {
                },
                
                getContextMenuItems: function(storage, target, context) {
                    var items = [];
                    items.push({
                      label: "Copy",
                      command: Obj.bindFixed(this.onCopy, this, storage)
                    });
                    items.push("-");
                    items.push({
                      label: "Paste",
                      //disabled: FireStoragePlusClipboard.isStorageAvailable() ? false : true,
                      command: Obj.bindFixed(this.onPaste, this, storage)
                    });
                    items.push("-");
                    items.push({
                      label: "Delete",
                      command: Obj.bindFixed(this.onRemove, this, target, storage)
                    });
                    items.push("-");
                    items.push({
                      label: "Edit",
                      command: Obj.bindFixed(this.onEdit, this, target, storage)
                    });
                    return items;
                },
                onCopy: function(clickedStorage) {
                    FireStoragePlusClipboard.copyTo(clickedStorage);
                },
                onPaste: function(clickedStorage)  {
                    var context = Firebug.currentContext;
                    var values = FireStoragePlusClipboard.getFrom();
                    if (!values || !context)
                        return;
                    var storage = FireStoragePlusStorage.add(values);
                    FireStoragePlusDomplate.insertStorageRow(storage);
                },
                onRemove: function(element, storage) {
                    FireStoragePlusStorage.remove(storage);
                    FireStoragePlusDomplate.removeStorageRow(element);
                },
                onEdit: function(element, storage) {
                    var params = {
                            storage: storage,
                            action: "edit",
                            window: null,
                            FireStoragePlusEdit: FireStoragePlusEdit,
                            storageRow: element,
                            Firebug: Firebug,
                            FBTrace: FBTrace,
                        };
                    var parent = Firebug.currentContext.chrome.window;
                    return parent.openDialog("chrome://firestorageplus/content/fireStoragePlusEdit.xul",
                        "_blank", "chrome,centerscreen,resizable=yes,modal=yes",
                        params);
                },
            }
        );
        
        Firebug.registerPanel(Firebug.FireStoragePlus);
        Firebug.registerStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
        
        return Firebug.FireStoragePlus;
    }
);