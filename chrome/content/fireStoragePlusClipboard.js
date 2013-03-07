define(
    [
         "firebug/lib/object",
        "firebug/lib/xpcom",
    ],  
    function(Obj, Xpcom) {
        var Ci = Components.interfaces;
        var clipboard = Xpcom.CCSV("@mozilla.org/widget/clipboard;1", "nsIClipboard");
        var versionChecker = Xpcom.CCSV("@mozilla.org/xpcom/version-comparator;1", "nsIVersionComparator");
        var appInfo = Xpcom.CCSV("@mozilla.org/xre/app-info;1", "nsIXULAppInfo");
        
        var FireStoragePlusClipboard = Obj.extend(Object,
        {
            storageFlavour: "text/firestorageplus-storage",
            unicodeFlavour: "text/unicode",
        
            copyTo: function(storage)
            {
                try
                {
                    var trans = this.createTransferData(storage);
                    if (trans && clipboard)
                        clipboard.setData(trans, null, Ci.nsIClipboard.kGlobalClipboard);
                }
                catch (err)
                {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout("storages.storageClipboard.copyTo; EXCEPTION " + err, err);
                }
            },
            getFrom: function()
            {
                try
                {
                    var str = this.getTransferData();
                    return JSON.parse(str);
                }
                catch (err)
                {
                }

                return null;
            },
            isStorageAvailable: function()
            {
                try
                {
                    if (!clipboard)
                        return false;
        
                    // nsIClipboard interface has been changed in FF3.
                    if (versionChecker.compare(appInfo.version, "3.0*") >= 0)
                    {
                        // FF3
                        return clipboard.hasDataMatchingFlavors([this.storageFlavour], 1,
                            Ci.nsIClipboard.kGlobalClipboard);
                    }
                    else
                    {
                        // FF2
                        var array = Xpcom.CCIN("@mozilla.org/supports-array;1", "nsISupportsArray");
                        var element = Xpcom.CCIN("@mozilla.org/supports-cstring;1", "nsISupportsCString");
                        element.data = this.storageFlavour;
                        array.AppendElement(element);
                        return clipboard.hasDataMatchingFlavors(array, Ci.nsIClipboard.kGlobalClipboard);
                    }
                }
                catch (err)
                {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout("storages.isstorageAvailable; EXCEPTION " + err, err);
                }
        
                return false;
            },
        
            createTransferData: function(storage)
            {
                var trans = Xpcom.CCIN("@mozilla.org/widget/transferable;1", "nsITransferable");
        
                // See https://bugzilla.mozilla.org/show_bug.cgi?id=722872
                if (typeof(trans.init) == "function")
                    trans.init(null);
        
                var json = storage.toJSON();
                var wrapper1 = Xpcom.CCIN("@mozilla.org/supports-string;1", "nsISupportsString");
                wrapper1.data = json;
                trans.addDataFlavor(this.storageFlavour);
                trans.setTransferData(this.storageFlavour, wrapper1, json.length * 2);
        
                if (FBTrace.DBG_storageS)
                    FBTrace.sysout("storages.Create JSON transfer data : " + json, storage);
        
                var str = storage.toString();
                var wrapper2 = Xpcom.CCIN("@mozilla.org/supports-string;1", "nsISupportsString");
                wrapper2.data = str;
                trans.addDataFlavor(this.unicodeFlavour);
                trans.setTransferData(this.unicodeFlavour, wrapper2, str.length * 2);
        
                if (FBTrace.DBG_storageS)
                    FBTrace.sysout("storages.Create string transfer data : " + str, storage);
        
                return trans;
            },
        
            getTransferData: function()
            {
                var trans = Xpcom.CCIN("@mozilla.org/widget/transferable;1", "nsITransferable");
        
                // See https://bugzilla.mozilla.org/show_bug.cgi?id=722872
                if (typeof(trans.init) == "function")
                    trans.init(null);
        
                trans.addDataFlavor(this.storageFlavour);
        
                
                clipboard.getData(trans, Ci.nsIClipboard.kGlobalClipboard);
        
                var str = new Object();
                var strLength = new Object();
        
                trans.getTransferData(this.storageFlavour, str, strLength);

                if (!str.value) 
                    return null;
        
                str = str.value.QueryInterface(Ci.nsISupportsString);
                return str.data.substring(0, strLength.value / 2);
            }
        });
        
        return FireStoragePlusClipboard;
    }
);

