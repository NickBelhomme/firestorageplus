define(
    [
        'firebug/lib/events',
        'firebug/lib/dom',
        'firebug/lib/css',
        'firebug/lib/string',
        'firebug/lib/options',
        "firebug/lib/domplate",
        "firestorageplus/fireStoragePlusStorage"
    ],
    function(Events, Dom, Css, String, Options, Domplate, FireStoragePlusStorage) {
        var lastSortedColumn = 'storage.lastSortedColumn';
        with (Domplate) {
            var FireStoragePlusDomplate = Domplate.domplate(
                {
                    storageheadingtag: TABLE(
                        {'class': 'storageTable', 'cellpadding': 0, 'cellspacing': 0, 'hiddenCols': ''},
                        TBODY(
                            TR({'class': 'storageHeaderRow', 'onclick': '$onClickHeader'},
                                TD({id: 'storageBreakpointBar', 'width': '1%', 'class': 'storageHeaderCell'},
                                    '&nbsp;'
                                ),
                                TD({id: 'colName', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue a11yFocus'},
                                    DIV({'class': 'storageHeaderCellBox'},
                                    'Name')
                                ),
                                TD({id: 'colValue', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue a11yFocus'},
                                    DIV({'class': 'storageHeaderCellBox'}, 
                                    'Value')
                                ),
                                TD({id: 'colType', role: 'columnheader',
                                    'class': 'storageHeaderCell alphaValue a11yFocus'},
                                    DIV({'class': 'storageHeaderCellBox'}, 
                                    'Type')
                                )
                            )
                        )
                    ),
                    storageitemtag: FOR(
                        'item', '$array',
                        TR({'class': 'storageRow', _repObject: "$item", onclick: '$onClickRow'},
                           TD({'class': 'storageCol'},
                               DIV({'class': 'sourceLine storageRowHeader'},
                                    '&nbsp;'
                               )
                            ),
                            TD({'class': 'storageNameCol storageCol'},
                                DIV({'class': 'storageNameLabel storageLabel', 'onclick': '$onClickRow'}, '$item.key')
                            ),
                            TD({'class': 'storageValueCol storageCol'},
                                DIV({'class': 'storageValueLabel storageLabel'}, 
                                    SPAN('$item|crop')
                                )
                            ),
                            TD({'class': 'storageTypeCol storageCol'},
                                DIV({'class': 'storageTypeLabel storageLabel'}, 
                                    SPAN('$item.type')
                                )
                            )
                        ) 
                    ),
                    bodyRow: TR(
                        {'class': 'storageInfoRow'},
                        TD({'class': 'sourceLine storageRowHeader'}),
                        TD({'class': 'storageInfoCol', colspan: 4})
                    ),
                    bodyTag: DIV(
                        {'class': 'storageInfoBody', _repObject: "$storage"},
                        DIV({'class': 'storageInfoTabs'},
                            A({'class': 'storageInfoValueTab storageInfoTab', 'onclick': '$onClickTab', 'view': 'Value'}, 'Value'),
                            A({'class': 'storageInfoJsonTab storageInfoTab', 'onclick': '$onClickTab', 'view': 'Json', $collapsed: "$storage|hideJsonTab"}, 'JSON')
                        ),
                        DIV({'class': 'storageInfoValueText storageInfoText'}),
                        DIV({'class': 'storageInfoJsonText storageInfoText'})
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
                        storageInfoBody.selectedText = Dom.getChildByClass(storageInfoBody, textBodyName);
    
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
                            var valueBox = Dom.getChildByClass(storageInfoBody, 'storageInfoValueText');
                            if (!storageInfoBody.valuePresented)
                            {
                                storageInfoBody.valuePresented = true;
                                var text = this.prettify(storage.value);
                                if (text != undefined)
                                    String.insertWrappedText(text, valueBox);
                            }
                        } else if (Css.hasClass(tab, 'storageInfoJsonTab')) {
                            var valueBox = Dom.getChildByClass(storageInfoBody, 'storageInfoJsonText');
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
                    hideRow: function(element) {
                        if (Css.hasClass(element, 'storageRow')) {
                            row = element;
                        } else {
                            row = Dom.getAncestorByClass(element, 'storageRow');
                        }
                        Css.setClass(row, 'collapsed');
                    },
                    onClickRow: function(event) {
                            if (!Events.isLeftClick(event))
                                return;
    
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
                            var bodyRow = this.bodyRow.insertRows({}, row)[0];
                            var bodyCol = Dom.getElementByClass(bodyRow, 'storageInfoCol');
                            var storageInfo = this.bodyTag.replace({storage: row.repObject}, bodyCol);
    
                            // If JSON tab is available select it by default.
                             if (this.selectTabByName(storageInfo, 'Json'))
                                return;
    
                            this.selectTabByName(storageInfo, 'Value');
                        }
                        else
                        {
                            row.parentNode.removeChild(row.nextSibling);
                        }
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
                    onClickHeader: function(event) {
                        if (!Events.isLeftClick(event))
                            return;
    
                        var table = Dom.getAncestorByClass(event.target, 'storageTable');
                        var column = Dom.getAncestorByClass(event.target, 'storageHeaderCell');
                        this.sortColumn(table, column);
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
                        var headerSorted = Dom.getChildByClass(headerRow, 'storageHeaderSorted');
                        Css.removeClass(headerSorted, 'storageHeaderSorted');
    
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
                        this.clear(panel);
                        var table = this.storageheadingtag.append({}, panel.panelNode);
                        this.renderStorage(panel, 'localStorage', table.lastChild);
                        this.renderStorage(panel, 'sessionStorage', table.lastChild);
                    },
                    clear: function(panel) {
                        Dom.clearNode(panel.panelNode);
                    },
                    renderStorage: function(panel, storage, table) {
                        var items = FireStoragePlusStorage.getStorageItems(storage);
                        if (items.length > 0) {
                            this.storageitemtag.insertRows(
                                {
                                    array: items
                                }, 
                                table
                            );        
                        }                                
                    }
                }
            );
        }
        
        return FireStoragePlusDomplate;
    }
);