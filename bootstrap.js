var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

var defaultPrefs = {"DBG_FIRESTORAGEPLUS": true};

function install(data, reason) {}
function uninstall(data, reason) {}
function startup(data, reason) { firebugStartup(); }
function shutdown(data, reason) { firebugShutdown(); }

function firebugStartup()
{
    try
    {
        Cu.import("resource://firebug/loader.js");
        FirebugLoader.registerBootstrapScope(this);
        FirebugLoader.registerDefaultPrefs(defaultPrefs);
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
    Firebug.registerTracePrefix(";", "DBG_FIRESTORAGEPLUS", true,
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