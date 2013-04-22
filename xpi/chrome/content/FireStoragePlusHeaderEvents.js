define([ "firebug/lib/dom", "firebug/lib/options", "firebug/lib/css", "firebug/lib/events"

], function(Dom, Options, Css, Events) {

    var columnWidthPref = 'firestorageplus.columnWidth';

    var FireStoragePlusHeaderEvents = {
        resizing : false,
        currColumn : null,
        startX : 0,
        startWidth : 0,
        lastMouseUp : 0,
        domplate : null,
        
        setDomplate: function(domplate) {
          this.domplate = domplate;  
        },

        onMouseClick : function(event) {
            if (!Events.isLeftClick(event)) {
                return;
            }

            // Avoid click event for sorting, if the resizing has been just
            // finished.
            var rightNow = (new Date()).getTime();
            if ((rightNow - this.lastMouseUp) > 300) {
                var table = Dom.getAncestorByClass(event.target, 'storageTable');
                var column = Dom.getAncestorByClass(event.target, 'storageHeaderCell');
                this.domplate.sortColumn(table, column);
            }
        },

        onMouseDown : function(event) {
            if (!Events.isLeftClick(event)) {
                return;
            }

            var target = event.target;
            if (!Css.hasClass(target, "storageHeaderCellBox")) {
                return;
            }

            var header = Dom.getAncestorByClass(target, "storageHeaderRow");
            if (!header) {
                return;
            }

            if (!this.isBetweenColumns(event)) {
                return;
            }

            this.onStartResizing(event);

            Events.cancelEvent(event);
        },

        onMouseMove : function(event) {
            if (this.resizing) {
                if (Css.hasClass(target, "storageHeaderCellBox")) {
                    target.style.cursor = "e-resize";
                }

                this.onResizing(event);
                return;
            }

            var target = event.target;
            if (!Css.hasClass(target, "storageHeaderCellBox")) {
                return;
            }

            if (!this.isBetweenColumns(event)) {
                if (target) {
                    target.style.cursor = "";
                }
                return;
            }

            // Update cursor if the mouse is located between two columns.
            target.style.cursor = "e-resize";
        },

        onMouseUp : function(event) {
            if (!this.resizing) {
                return;
            }

            this.lastMouseUp = (new Date()).getTime();

            this.onEndResizing(event);
            Events.cancelEvent(event);
        },

        onMouseOut : function(event) {
            if (!this.resizing) {
                return;
            }

            var target = event.target;
            if (target == event.explicitOriginalTarget) {
                this.onEndResizing(event);
            }

            Events.cancelEvent(event);
        },

        isBetweenColumns : function(event) {
            var target = event.target;
            var x = event.clientX;
            var column = Dom.getAncestorByClass(target, "storageHeaderCell");
            var offset = Dom.getClientOffset(column);
            var size = Dom.getOffsetSize(column);

            if (column.previousSibling) {
                if (x < offset.x + 10) {
                    return 1; // Mouse is close to the left side of the column
                    // (target).
                }
            }

            if (column.nextSibling) {
                if (x > offset.x + size.width - 12) {
                    return 2; // Mouse is close to the right side.
                }
            }

            return 0;
        },

        onStartResizing : function(event) {
            var location = this.isBetweenColumns(event);
            if (!location) {
                return;
            }

            var target = event.target;

            this.resizing = true;
            this.startX = event.clientX;

            // Currently resizing column.
            var column = Dom.getAncestorByClass(target, "storageHeaderCell");
            this.currColumn = (location == 1) ? column.previousSibling : column;

            // Last column width.
            var size = Dom.getOffsetSize(this.currColumn);
            this.startWidth = size.width;
        },

        onResizing : function(event) {
            if (!this.resizing) {
                return;
            }

            var newWidth = this.startWidth + (event.clientX - this.startX);
            this.currColumn.style.width = newWidth + "px";
        },

        onEndResizing : function(event) {
            if (!this.resizing) {
                return;
            }

            this.resizing = false;

            var newWidth = this.startWidth + (event.clientX - this.startX);
            this.currColumn.style.width = newWidth + "px";
            
            // Store width into the preferences.
            var colId = this.currColumn.getAttribute("id");
            if (colId) {
                // Use directly nsIPrefBranch interface as the pref
                // doesn't have to exist yet.
                Options.setPref(Firebug.prefDomain, columnWidthPref + colId, newWidth);
            }
            
            this.domplate.renderPreferedStorage();
        }
    };
    return FireStoragePlusHeaderEvents;
});
