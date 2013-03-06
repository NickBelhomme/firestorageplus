define(
    [
        'firebug/lib/object',
        'firebug/lib/trace',
        "firestorageplus/fireStoragePlusDomplate",
        "firestorageplus/fireStoragePlusClipboard",
        "firestorageplus/fireStoragePlusStorage"
    ],
    function(Obj, FBTrace, FireStoragePlusDomplate, FireStoragePlusClipboard, FireStoragePlusStorage) {
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
                      command: Obj.bindFixed(this.onEdit, this, storage)
                    });
                    return items;
                },
                onCopy: function(clickedStorage) {
                    FireStoragePlusClipboard.copyTo(clickedStorage);
                },
                onPaste: function(clickedStorage)  {
                    var context = Firebug.currentContext;
                    var values = CookieClipboard.getFrom();
                    if (!values || !context)
                        return;

                    if (FBTrace.DBG_COOKIES)
                        FBTrace.sysout("cookies.Get cookie values from clipboard", values);

                    // Change name so it's unique and use the current host.
                    values.name = Firebug.CookieModule.getDefaultCookieName(context, values.name);
                    values.host = context.browser.currentURI.host;

                    values.rawValue = values.value;
                    values.value = unescape(values.value);

                    // If the expire time isn't set use the default value.
                    if (values.expires == undefined)
                        values.expires = Firebug.CookieModule.getDefaultCookieExpireTime();

                    // Create/modify cookie.
                    var cookie = new Cookie(values);
                    Firebug.CookieModule.createCookie(cookie);

                    if (FBTrace.DBG_COOKIES)
                        checkList(context.getPanel(panelName, true));
                },
                onRemove: function(element, storage) {
                    FireStoragePlusStorage.remove(storage);
                    FireStoragePlusDomplate.hideRow(element);
                },
                onEdit: function(cookie) {
                    var params = {
                        cookie: cookie.cookie,
                        action: "edit",
                        window: null,
                        EditCookie: EditCookie,
                        Firebug: Firebug,
                        FBTrace: FBTrace,
                    };

                    var parent = Firebug.currentContext.chrome.window;
                    return parent.openDialog("chrome://firebug/content/cookies/editCookie.xul",
                        "_blank", "chrome,centerscreen,resizable=yes,modal=yes",
                        params);
                }
            }
        );
        
        Firebug.registerPanel(Firebug.FireStoragePlus);
        Firebug.registerStylesheet("chrome://firestorageplus/skin/firestorageplus.css");
        
        return Firebug.FireStoragePlus;
    }
);