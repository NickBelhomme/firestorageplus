/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/trace/traceModule",
    "firebug/trace/traceListener",
    "firestorageplus/myPanel",
    "firestorageplus/myModule",
],
function(FBTrace, TraceModule, TraceListener) {

// ********************************************************************************************* //
// Documentation
//
// Firebug coding style: http://getfirebug.com/wiki/index.php/Coding_Style
// Firebug tracing: http://getfirebug.com/wiki/index.php/FBTrace

// ********************************************************************************************* //
// The application/extension object

var theApp =
{
    initialize: function()
    {
        if (FBTrace.DBG_FIRESTORAGEPLUS)
            FBTrace.sysout("fireStoragePlus; fireStoragePlus extension initialize");

        // TODO: Extension initialization
    },

    shutdown: function()
    {
        if (FBTrace.DBG_FIRESTORAGEPLUS)
            FBTrace.sysout("fireStoragePlus; fireStoragePlus extension shutdown");

        // TODO: Extension shutdown
    }
}

return theApp;

// ********************************************************************************************* //
});
