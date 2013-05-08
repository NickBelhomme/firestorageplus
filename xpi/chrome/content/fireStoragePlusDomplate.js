define(
    [
        'firebug/lib/events',
        'firebug/lib/locale',
        'firebug/lib/dom',
        'firebug/lib/css',
        'firebug/lib/string',
        'firebug/lib/options',
        "firebug/lib/domplate",
        "firestorageplus/fireStoragePlusStorage",
        "firestorageplus/fireStoragePlusHeaderEvents"
    ],
    function(Events, Locale, Dom, Css, String, Options, Domplate, FireStoragePlusStorage, FireStoragePlusHeaderEvents) {

        Locale.registerStringBundle("chrome://firestorageplus/locale/firestorageplus.properties");
        var lastSortedColumn = 'firestorageplus.lastSortedColumn';
        var columnWidthPref = 'firestorageplus.columnWidth';
        var preferedStorage = 'firestorageplus.preferedStorage';
        var storageTable = null;
        var openedRows = [];
        
        with (Domplate) {
            var FireStoragePlusDomplate = Domplate.domplate(
                {
                    storageheadingtag: TABLE(
                        {'class': 'storageTable', 'cellpadding': 0, 'cellspacing': 0, 'hiddenCols': ''},
                        TBODY(
                            TR({'class': 'storageHeaderRow'},
                                TD({id: 'storageBreakpointBar', 'width': '1%', 'class': 'storageHeaderCell'},
                                    '&nbsp;'
                                ),
                                TD({id: 'colKey', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue'},
                                    DIV({'class': 'storageHeaderCellBox'},
                                    Locale.$STR("firestorageplus.Key"))
                                ),
                                TD({id: 'colValue', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue'},
                                    DIV({'class': 'storageHeaderCellBox'},
                                    Locale.$STR("firestorageplus.Value"))
                                ),
                                TD({id: 'colType', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue'},
                                    DIV({'class': 'storageHeaderCellBox'},
                                    Locale.$STR("firestorageplus.Storage"))
                                ),
                                TD({id: 'colScope', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue'},
                                    DIV({'class': 'storageHeaderCellBox'},
                                            Locale.$STR("firestorageplus.Scope"))
                                )
                            )
                        )
                    ),
                    toolbar: DIV(
                        {'id': 'fspToolbar'},
                        BUTTON({id: 'all-current-scope', class: 'toolbar-button'}, Locale.$STR("firestorageplus.Both")),
                        BUTTON({id: 'localstorage-current-scope', class: 'toolbar-button'}, Locale.$STR("firestorageplus.localStorage")),
                        BUTTON({id: 'sessionstorage-current-scope', class: 'toolbar-button'}, Locale.$STR("firestorageplus.sessionStorage")),
                        BUTTON({id: 'localStorage-all', class: 'toolbar-button'}, Locale.$STR("firestorageplus.localStorage_all_scopes"))
                    ),
                    storageitemtag: FOR(
                        'item', '$array',
                        TR({'class': 'storageRow', _repObject: "$item"},
                           TD({'class': 'storageCol'},
                               DIV({'class': 'sourceLine storageRowHeader'},
                                    '&nbsp;'
                               )
                            ),
                            TD({'class': 'storageKeyCol storageCol'},
                                DIV({'class': 'storageKeyLabel storageLabel'}, 
                                    SPAN('$item.key')
                                )
                            ),
                            TD({'class': 'storageValueCol storageCol'},
                                DIV({'class': 'storageValueLabel storageLabel'},
                                    SPAN('$item|crop')
                                )
                            ),
                            TD({'class': 'storageTypeCol storageCol'},
                                DIV({'class': 'storageTypeLabel storageLabel $item.type'},
                                    SPAN('$item.type')
                                )
                            ),
                            TD({'class': 'storageScopeCol storageCol'},
                                DIV({'class': 'storageScopeLabel storageLabel'},
                                    SPAN('$item.scope')
                                )
                            )
                        )
                    ),
                    bodyRow: TR(
                        {'class': 'storageInfoRow'},
                        TD({'class': 'sourceLine storageRowHeader'}),
                        TD({'class': 'storageInfoCol', colspan: 5})
                    ),
                    bodyTag: DIV(
                        {'class': 'storageInfoBody', _repObject: "$storage"},
                        DIV({'class': 'storageInfoTabs'},
                            A({'class': 'storageInfoValueTab storageInfoTab', 'view': 'Value'}, Locale.$STR("firestorageplus.Value")),
                            A({'class': 'storageInfoJsonTab storageInfoTab', 'view': 'Json', $collapsed: "$storage|hideJsonTab"}, Locale.$STR("firestorageplus.JSON"))
                        ),
                        DIV({'class': 'storageInfoValueText storageInfoText'}),
                        DIV({'class': 'storageInfoJsonText storageInfoText'})
                    ),
                    eventTag:  DIV({'class': 'storageEvent', _repObject: '$storage'},
                        TABLE({cellpadding: 0, cellspacing: 0},
                            TBODY(
                                TR(
                                    TD({width: '100%'},
                                        SPAN(Locale.$STR('firestorageplus.Storage'), ' '),
                                        SPAN({'class': 'storageNameLabel'}, 
                                            '$storage.key', 
                                            ' '),
                                        SPAN({'class': 'storageValueLabel'}, 
                                            '$storage|crop')
                                    ),
                                    TD(
                                        SPAN({'class': 'storageScopeLabel',
                                            title: '$storage.scope'}, '$storage.scope'),
                                        SPAN('&nbsp;') 
                                    )
                                )
                            )
                        )
                    ),
                    prettify : function (value) {
                        try {
                            var jsonObject = JSON.parse(value);
                            return JSON.stringify(jsonObject, undefined, 2); // indentation level = 2
                        } catch (e) {
                            return value;
                        }
                    },
                    crop : function (storage) {
                        return String.cropString(storage.value);
                    },
                    hideJsonTab: function(storage)
                    {
                        try {
                            var jsonObject = JSON.parse(storage.value);
                            return Object.keys(jsonObject).length === 0;
                        } catch (e) {
                            return true;
                        }
                    },
                    onClickTab: function(event) {
                        this.selectTab(event.currentTarget);
                    },
                    selectTab: function(tab) {
                        var storageInfoBody = tab.parentNode.parentNode;

                        var view = tab.getAttribute('view');
                        if (storageInfoBody.selectedTab)
                        {
                            storageInfoBody.selectedTab.removeAttribute('selected');
                            storageInfoBody.selectedText.removeAttribute('selected');
                        }

                        var textBodyName = 'storageInfo' + view + 'Text';

                        storageInfoBody.selectedTab = tab;
                        storageInfoBody.selectedText = storageInfoBody.getElementsByClassName(textBodyName).item(0);

                        storageInfoBody.selectedTab.setAttribute('selected', 'true');
                        storageInfoBody.selectedText.setAttribute('selected', 'true');

                        var storage = Firebug.getRepObject(storageInfoBody);
                        var context = Firebug.getElementPanel(storageInfoBody).context;
                        this.updateInfo(storageInfoBody, storage, context);

                        return true;
                    },
                    updateInfo: function(storageInfoBody, storage, context) {
                        var tab = storageInfoBody.selectedTab;
                        if (Css.hasClass(tab, 'storageInfoValueTab')) {
                            var valueBox = storageInfoBody.getElementsByClassName('storageInfoValueText').item(0);
                            if (!storageInfoBody.valuePresented)
                            {
                                storageInfoBody.valuePresented = true;
                                var text = this.prettify(storage.value);
                                if (text != undefined)
                                    String.insertWrappedText(text, valueBox);
                            }
                        } else if (Css.hasClass(tab, 'storageInfoJsonTab')) {
                            var valueBox = storageInfoBody.getElementsByClassName('storageInfoJsonText').item(0);
                            if (!storageInfoBody.jsonPresented)
                            {
                                storageInfoBody.jsonPresented = true;
                                try {
                                    var jsonObject = JSON.parse(storage.value);
                                    if (Object.keys(jsonObject).length > 0) {
                                        Firebug.DOMPanel.DirTable.tag.replace(
                                                {object: jsonObject, toggles: this.toggles}, valueBox);
                                    }
                                    return JSON.stringify(jsonObject, undefined, 2); // indentation level = 2
                                } catch (e) {
                                }
                            }
                        }
                    },
                    removeStorageRow: function(element) {
                        var row = this.getStorageRowFromNode(element);
                        if (Css.hasClass(row.nextSibling, 'storageInfoRow')) {
                            this.remove(row.nextSibling);
                        }
                        this.remove(row);
                    },
                    getStorageRowFromNode : function (node) {
                        if (Css.hasClass(node, 'storageRow')) {
                            return node;
                        } else {
                            return Dom.getAncestorByClass(node, 'storageRow');
                        }
                    },
                    replaceStorageRow : function (storage, element) {
                        var storageRow = this.getStorageRowFromNode(element);
                        if (Css.hasClass(storageRow.nextSibling, 'storageInfoRow')) {
                            this.remove(storageRow.nextSibling);
                        }
                        storageRow.parentNode.replaceChild(this.insertStorageRow(storage), storageRow);
                    },
                    insertStorageRow : function (storage) {
                        var row = this.storageitemtag.insertRows(
                            {
                                array: [storage]
                            },
                            storageTable.lastChild
                        )[0];
                        row.addEventListener('click', this.onClickRow.bind(this));
                        return row;
                    },
                    onClickRow: function(event) {
                        var row = Dom.getAncestorByClass(event.target, 'storageRow');
                        if (row)
                        {
                            this.toggleRow(row);
                            Events.cancelEvent(event);
                        }
                    },
                    toggleRow: function(row, forceOpen) {
                        var opened = Css.hasClass(row, 'opened');
                        if (opened && forceOpen)
                            return;
                        

                        Css.toggleClass(row, 'opened');
                        
                        if (Css.hasClass(row, 'opened'))
                        {
                            this.addToOpenedRowStack(row.repObject);
                            var bodyRow = this.bodyRow.insertRows({}, row)[0];
                            var bodyCol = bodyRow.getElementsByClassName('storageInfoCol').item(0);
                            var storageInfo = this.insertBodyTag(row.repObject, bodyCol);

                            // If JSON tab is available select it by default.
                             if (this.selectTabByName(storageInfo, 'Json'))
                                return;

                            this.selectTabByName(storageInfo, 'Value');
                        }
                        else
                        {
                            this.removeFromOpenedRowStack(row.repObject);
                            row.parentNode.removeChild(row.nextSibling);
                        }
                    },
                    removeFromOpenedRowStack: function(storage) {
                        for (var i=0; i<openedRows.length; i++) {
                            if (openedRows[i].type === storage.type && openedRows[i].key === storage.key) {
                                openedRows.splice(i, 1);
                                return;
                            }
                        }
                    },
                    addToOpenedRowStack: function(storage) {
                        if (this.isOpenedRowStack(storage)) {
                            return;
                        }
                        openedRows.push(storage);
                    },
                    isOpenedRowStack: function(storage) {
                        for (var i=0; i<openedRows.length; i++) {
                            if (openedRows[i].type === storage.type && openedRows[i].key === storage.key) {
                                return true;
                            }
                        }
                        return false;
                    },
                    insertBodyTag : function (storage, bodyCol) {
                        var storageInfo = this.bodyTag.replace({storage: storage}, bodyCol);
                        var elements = storageInfo.getElementsByClassName("storageInfoTab");
                        for (var i = 0, imax = elements.length; i < imax; i++) {
                            elements.item(i).addEventListener('click', this.onClickTab.bind(this));
                        }
                        return storageInfo;
                    },
                    selectTabByName: function(storageInfoBody, tabName)
                    {
                        var tab = Dom.getChildByClass(storageInfoBody, "storageInfoTabs",
                            "storageInfo" + tabName + "Tab");

                        // Don't select collapsed tabs.
                        if (tab && !Css.hasClass(tab, "collapsed"))
                            return this.selectTab(tab);

                        return false;
                    },
                    sortColumn: function(table, col, direction) {
                        if (!col)
                            return;

                        if (typeof(col) == 'string')
                        {
                            var doc = table.ownerDocument;
                            col = doc.getElementById(col);
                        }

                        if (!col)
                            return;

                        var numerical = !Css.hasClass(col, 'alphaValue');

                        var colIndex = 0;
                        for (col = col.previousSibling; col; col = col.previousSibling) {
                            ++colIndex;
                        }
                        this.sort(table, colIndex, numerical, direction);
                    },
                    sort: function(table, colIndex, numerical, direction) {
                        var tbody = table.lastChild;

                        var headerRow = tbody.firstChild;
                        // Remove class from the currently sorted column
                        var headerSorted = headerRow.getElementsByClassName('storageHeaderSorted');
                        if (headerSorted) {
                            Css.removeClass(headerSorted.item(0), 'storageHeaderSorted');
                        }

                        // Mark new column as sorted.
                        var header = headerRow.childNodes[colIndex];
                        Css.setClass(header, 'storageHeaderSorted');

                        // If the column is already using required sort direction, bubble out.
                        if ((direction == 'desc' && header.sorted == 1) ||
                            (direction == 'asc' && header.sorted == -1))
                            return;

                        var values = [];
                        for (var row = tbody.childNodes[1]; row; row = row.nextSibling)
                        {
                            var cell = row.childNodes[colIndex];
                            var value = numerical ? parseFloat(cell.textContent) : cell.textContent;

                            if (Css.hasClass(row, 'opened'))
                            {
                                var storageInfoRow = row.nextSibling;
                                values.push({row: row, value: value, info: storageInfoRow});
                                row = storageInfoRow;
                            }
                            else
                            {
                                values.push({row: row, value: value});
                            }
                        }

                        values.sort(function(a, b) { return a.value < b.value ? -1 : 1; });

                        if ((header.sorted && header.sorted == 1) || (!header.sorted && direction == 'asc'))
                        {
                            Css.removeClass(header, 'sortedDescending');
                            Css.setClass(header, 'sortedAscending');

                            header.sorted = -1;

                            for (var i = 0; i < values.length; ++i)
                            {
                                tbody.appendChild(values[i].row);
                                if (values[i].info)
                                    tbody.appendChild(values[i].info);
                            }
                        }
                        else
                        {
                            Css.removeClass(header, 'sortedAscending');
                            Css.setClass(header, 'sortedDescending');

                            header.sorted = 1;

                            for (var i = values.length-1; i >= 0; --i)
                            {
                                tbody.appendChild(values[i].row);
                                if (values[i].info)
                                    tbody.appendChild(values[i].info);
                            }
                        }

                        // Remember last sorted column & direction in preferences.
                        var prefValue = header.getAttribute('id') + ' ' + (header.sorted > 0 ? 'desc' : 'asc');
                        Options.set(lastSortedColumn, prefValue);
                    },
                    render: function(panel) {
                        this.clear(panel.panelNode);
                        this.renderToolbar(panel.panelNode);
                        storageTable = this.renderStorageHeading(panel.panelNode);
                        this.renderPreferedStorage();
                    },
                    renderToolbar : function (node) {
                        var toolbar = this.toolbar.append({}, node);
                        var children = toolbar.children;
                        var activeToolbarButton = Options.get(preferedStorage);
                        
                        for (var i = 0, imax = children.length; i < imax; i++) {
                            children.item(i).addEventListener('click', this.onClickToolbar.bind(this));
                            if (children.item(i).getAttribute('id') === activeToolbarButton) {
                                Css.setClass(children.item(i), 'active');
                            }
                        }
                        return toolbar;
                    },
                    onClickToolbar : function (event) {
                        Options.set(preferedStorage, event.currentTarget.id);
                        var children = event.currentTarget.parentElement.children;
                        for (var i = 0, imax = children.length; i < imax; i++) {
                            Css.removeClass(children.item(i), 'active');
                        }
                        Css.setClass(event.currentTarget, 'active');
                        this.renderPreferedStorage();
                    },
                    renderPreferedStorage : function() {
                        if (storageTable === null) {
                            return;
                        }
                        while (row = storageTable.lastChild.firstChild.nextSibling) {
                            storageTable.lastChild.removeChild(row);
                        }
                        
                        switch (Options.get(preferedStorage)) {
                            case 'all-current-scope':
                                this.renderStorage('localStorage');
                                this.renderStorage('sessionStorage');
                                break;
                            case 'localstorage-current-scope':
                                this.renderStorage('localStorage');
                                break;
                            case 'sessionstorage-current-scope':
                                this.renderStorage('sessionStorage');
                                break;
                            case 'localStorage-all':
                                this.renderStorage('allLocalStorage');
                                break;
                        }
                        this.sortStorages();
                        var rows = storageTable.getElementsByClassName("storageRow");
                        for (var i = 0, imax = rows.length; i < imax; i++) {
                            if (this.isOpenedRowStack(rows.item(i).repObject)) {
                                this.toggleRow(rows.item(i));
                            }
                        }
                    },
                    renderStorageHeading : function (node) {
                        var storageTable = this.storageheadingtag.append({}, node);

                        // Update columns width according to the preferences.
                        var header = Dom.getElementByClass(storageTable, "storageHeaderRow");
                        var columns = header.getElementsByTagName("td");
                        for (var i=0; i<columns.length; i++)
                        {
                            var col = columns[i];
                            var colId = col.getAttribute("id");
                            if (!colId || !col.style)
                                continue;

                            var width = Options.get(columnWidthPref + colId);
                            if (width)
                                col.style.width = width + "px";
                        }
                        FireStoragePlusHeaderEvents.setDomplate(this);
                        header.addEventListener("mousedown", FireStoragePlusHeaderEvents.onMouseDown.bind(FireStoragePlusHeaderEvents));
                        header.addEventListener("mousemove", FireStoragePlusHeaderEvents.onMouseMove.bind(FireStoragePlusHeaderEvents));
                        header.addEventListener("mouseup", FireStoragePlusHeaderEvents.onMouseUp.bind(FireStoragePlusHeaderEvents));
                        header.addEventListener("mouseout", FireStoragePlusHeaderEvents.onMouseOut.bind(FireStoragePlusHeaderEvents));
                        header.addEventListener("click", FireStoragePlusHeaderEvents.onMouseClick.bind(FireStoragePlusHeaderEvents));
                        return storageTable;
                    },
                    sortStorages : function() {
                        var prefValue = Options.get(lastSortedColumn);
                        if (prefValue) {
                            var values = prefValue.split(" ");
                            this.sortColumn(storageTable, values[0], values[1]);
                        }
                    },
                    clear: function(element) {
                        Dom.clearNode(element);
                    },
                    remove: function(element) {
                        if (element.parentNode) {
                            element.parentNode.removeChild(element);
                        }
                    },
                    renderStorage: function(storage) { 
                        var i, imax, items;
                        if (storage === 'allLocalStorage') {
                            items = FireStoragePlusStorage.getAllLocalStorageItems();
                        } else {
                            items = FireStoragePlusStorage.getStorageItems(storage);
                        }
                        imax = items.length;

                        if (imax > 0) {
                            for (i = 0, imax = items.length; i < imax; i++) {
                                this.insertStorageRow(
                                    items[i]
                                );
                            }
                        }
                    }
                }
            );
        }

        return FireStoragePlusDomplate;
    }
);