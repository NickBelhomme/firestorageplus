define(
    [
        'firebug/lib/object',
        'firebug/lib/locale',
        'firebug/lib/trace',
        'firebug/lib/dom',
        'firebug/lib/css',
        'firebug/lib/options',
        "firestorageplus/fireStoragePlusDomplate",
        "firestorageplus/fireStoragePlusClipboard",
        "firestorageplus/fireStoragePlusStorage",
        "firestorageplus/fireStoragePlusEdit",
        "firestorageplus/fireStoragePlusObserver"
    ],
    function(Obj, Locale, FBTrace, Dom, Css, Options, FireStoragePlusDomplate, FireStoragePlusClipboard, FireStoragePlusStorage, FireStoragePlusEdit, FireStoragePlusObserver) {
        var panelName = 'firestorageplus';
        var preferedStorage = 'firestorageplus.preferedStorage';

        Locale.registerStringBundle("chrome://firestorageplus/locale/firestorageplus.properties");
        var FireStoragePlus = function FireStoragePlus() {
           this.observer = null;
        };

        FireStoragePlus.prototype = Obj.extend(
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
                },

                destroy: function(state) {
                    Firebug.Panel.destroy.apply(this, arguments);
                },

                show: function(state) {
                    Firebug.Panel.show.apply(this, arguments);
                    FireStoragePlusDomplate.render(this);
                },
                getPanelToolbarButtons: function()
                {

                    var activeToolbarButton = this.getPreferedStorage();

                    var buttons = [
                        {
                            label: Locale.$STR("firestorageplus.DOM Storage"),
                            id: 'fspDomStorage',
                            type: 'menu',
                            items: [
                                {
                                    label: Locale.$STR("firestorageplus.Both"),
                                    id: 'all-current-scope',
                                    type: 'radio',
                                    className: 'fspToolbar-button-dom',
                                    command: this.onClickDomStorage
                                },
                                {
                                    label: Locale.$STR("firestorageplus.localStorage"),
                                    id: 'localstorage-current-scope',
                                    type: 'radio',
                                    className: 'fspToolbar-button-dom',
                                    command: this.onClickDomStorage
                                },
                                {
                                    label: Locale.$STR("firestorageplus.sessionStorage"),
                                    id: 'sessionstorage-current-scope',
                                    type: 'radio',
                                    className: 'fspToolbar-button-dom',
                                    command: this.onClickDomStorage
                                },
                                {
                                    label: Locale.$STR("firestorageplus.localStorage_all_scopes"),
                                    id: 'localStorage-all',
                                    type: 'radio',
                                    className: 'fspToolbar-button-dom',
                                    command: this.onClickDomStorage
                                }
                            ]
                        },
                        {
                            label: Locale.$STR("firestorageplus.IndexedDB"),
                            id: 'fspIndexedDB',
                            type: 'checkbox',
                            command: this.onClickIndexedDB
                        }
                    ];

                    for (var i = 0, imax = buttons[0].items.length; i < imax; i++) {
                        if (buttons[0].items[i].id === activeToolbarButton) {
                            buttons[0].items[i].checked = true;
                            buttons[0].label = Locale.$STR("firestorageplus.DOM Storage") + ' ('+ buttons[0].items[i].label +')';
                        }
                    }



                    return buttons;
                },
                onClickDomStorage : function (event) {
                    var checkedButton = event.currentTarget;
                    checkedButton.checked = true;
                    Options.set(preferedStorage, event.currentTarget.id);
                    var domButtons = event.currentTarget.ownerDocument.getElementsByClassName('fspToolbar-button-dom');
                    for (var i = 0, imax = domButtons.length; i < imax; i++) {
                        if (domButtons[i].id !== event.currentTarget.id) {
                            domButtons[i].checked = false;
                        }
                    }
                    var domButton = event.currentTarget.ownerDocument.getElementById('fspDomStorage');
                    domButton.label = domButton.label.substr(0, domButton.label.indexOf('('))  + ' ('+ checkedButton.label +')';

                    FireStoragePlusDomplate.renderPreferedStorage();
                },
                onClickIndexedDB : function (event) {
                    var checkedButton = event.currentTarget;
                    FireStoragePlusDomplate.renderIndexedDBStorage();
                },
                getPreferedStorage: function() {
                    return Options.get(preferedStorage);
                },
                setPreferedStorage: function(storage) {
                    Options.set(preferedStorage, storage);
                    return this;
                },
                refresh: function() {
                },
                getContextMenuItems: function(storage, target, context) {
                    var activeSubPanel = this.getPreferedStorage();
                    
                    var items = [];
                    var isStorageRow = Dom.getAncestorByClass(target, "storageRow");
                    var enableContextMenu = isStorageRow || !Dom.getAncestorByClass(target, "storageTable") ;
                    if (activeSubPanel !== 'localStorage-all') {
                        if (isStorageRow) {
                            items.push({
                              label: Locale.$STR("firestorageplus.Copy"),
                              command: Obj.bindFixed(this.onCopy, this, storage)
                            });
                            items.push("-");
                        }
                        
                        if (enableContextMenu) {
                            items.push({
                              disabled: !this.hasClipBoard(),
                              label: Locale.$STR("firestorageplus.Paste"),
                              command: Obj.bindFixed(this.onPaste, this, storage)
                            });
                        }
                        
                        if (isStorageRow) {
                            items.push("-");
                            items.push({
                              label: Locale.$STR("firestorageplus.Remove"),
                              command: Obj.bindFixed(this.onRemove, this, target, storage)
                            });
                            items.push("-");
                            items.push({
                              label: Locale.$STR("firestorageplus.Edit"),
                              command: Obj.bindFixed(this.onEdit, this, target, storage)
                            });
                        }
                        
                        if (enableContextMenu) {
                            items.push("-");
                            items.push({
                                label: Locale.$STR("firestorageplus.Create"),
                                command: Obj.bindFixed(this.onCreate, this)
                            });
                            
                            if (activeSubPanel !== 'sessionstorage-current-scope') {
                                items.push("-");
                                items.push({
                                    label: Locale.$STR("firestorageplus.Clear_localStorage_for_current_scope"),
                                    command: Obj.bindFixed(this.onRemoveStorageForCurrentScope, this, 'localStorage')
                                });
                            }
                            
                            if (activeSubPanel !== 'localstorage-current-scope') {
                                items.push("-");
                                items.push({
                                    label: Locale.$STR("firestorageplus.Clear_sessionStorage_for_current_scope"),
                                    command: Obj.bindFixed(this.onRemoveStorageForCurrentScope, this, 'sessionStorage')
                                });
                            }
                        }
                    } else {
                        if (enableContextMenu) {
                            items.push("-");
                            items.push({
                                label: Locale.$STR("firestorageplus.Clear_localStorage_for_all_scopes"),
                                command: Obj.bindFixed(this.onRemoveAllLocalStorage, this)
                            });
                        }
                    }
                    
                    items.push("-");
                    items.push({
                        label: Locale.$STR("firestorageplus.About"),
                        command: Obj.bindFixed(this.onAbout, this)
                    });
                    return items;
                },
                onCopy: function(clickedStorage) {
                    FireStoragePlusClipboard.copyTo(clickedStorage);
                },
                onPaste: function()  {
                    var context = Firebug.currentContext;
                    var values = FireStoragePlusClipboard.getFrom();
                    if (!values || !context)
                        return;
                    var storage = FireStoragePlusStorage.add(values);
                    FireStoragePlusDomplate.insertStorageRow(storage);
                },
                hasClipBoard: function() {
                    var context = Firebug.currentContext;
                    var values = FireStoragePlusClipboard.getFrom();
                    if (!values || !context) {
                        return false;
                    }
                    return true;
                },
                onRemove: function(element, storage) {
                    FireStoragePlusStorage.remove(storage);
                    FireStoragePlusDomplate.removeStorageRow(element);
                },
                onRemoveAllLocalStorage: function(element) {
                    FireStoragePlusStorage.removeAllLocalStorage();
                    FireStoragePlusDomplate.renderPreferedStorage();
                },
                onRemoveStorageForCurrentScope: function(storage) {
                    FireStoragePlusStorage.removeStorageForCurrentScope(storage);
                    FireStoragePlusDomplate.renderPreferedStorage();
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
                onCreate: function() {
                    var params = {
                            action: "create",
                            window: null,
                            FireStoragePlusEdit: FireStoragePlusEdit,
                            Firebug: Firebug,
                            FBTrace: FBTrace,
                    };
                    var parent = Firebug.currentContext.chrome.window;
                    return parent.openDialog("chrome://firestorageplus/content/fireStoragePlusEdit.xul",
                            "_blank", "chrome,centerscreen,resizable=yes,modal=yes",
                            params);
                },
                onAbout: function() {
                    Components.utils["import"]("resource://gre/modules/AddonManager.jsm");

                    AddonManager.getAddonByID("firestorageplus@nickbelhomme.com", function(addon)
                    {
                        openDialog("chrome://mozapps/content/extensions/about.xul", "",
                        "chrome,centerscreen,modal", addon);
                    });
                }
            }
        );

        Firebug.registerPanel(FireStoragePlus);
        Firebug.registerStylesheet("chrome://firestorageplus/skin/firestorageplus.css");

        return FireStoragePlus;
    }
);