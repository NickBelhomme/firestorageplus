define(
    [
        'firebug/lib/trace'
    ],
    function(FBTrace) {
        var databaseConnection = null;
    
        var FireStoragePlusIndexedDB = {
            getLocal : function () {
                var dbs = this.getDatabases();
                Firebug.Console.log(dbs);
            },
            getDatabases : function() {
                Firebug.Console.log('get DBs');
                return ['customers', 'products'];
            }
        };


        return FireStoragePlusIndexedDB;
    }
);