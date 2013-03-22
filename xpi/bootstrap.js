var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

function install(data, reason) {}
function uninstall(data, reason) {}
function startup(data, reason) { firebugStartup(data); }
function shutdown(data, reason) { firebugShutdown(); }

function firebugStartup(data)
{
    try
    {
        Cu.import("resource://firebug/loader.js");
        FirebugLoader.registerBootstrapScope(this);
        
        Cu.import("resource://firebug/prefLoader.js");

        // Register default preferences
        PrefLoader.loadDefaultPrefs(data.installPath, "firestorageplus.js");
    }
    catch (e)
    {
        // If an exception happens it's probably because Firebug hasn't been
        // started yet. Just ignore it.
    }
}

function firebugShutdown()
{
    try
    {
        Cu.import("resource://firebug/loader.js");
        FirebugLoader.unregisterBootstrapScope(this);
    }
    catch (e)
    {
        Cu.reportError(e);
    }
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

function topWindowLoad(win)
{
}

function topWindowUnload(win)
{
}

function firebugFrameLoad(Firebug)
{
    Firebug.registerTracePrefix("firestorageplus;", "DBG_FIRESTORAGEPLUS", true,
        "chrome://firestorageplus/skin/firestorageplus.css");

    var config = {id: "firestorageplus@nickbelhomme.com"};
    Firebug.registerExtension("firestorageplus", config);
}

function firebugFrameUnload(Firebug)
{
    if (!Firebug.isInitialized)
        return;

    Firebug.unregisterExtension("firestorageplus");
    Firebug.unregisterTracePrefix("firestorageplus;");
}