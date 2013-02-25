define(
    [
        "firebug/lib/object",
        "firebug/lib/lib",
        "firebug/lib/trace",
        "firebug/lib/events",
        "firebug/lib/dom",
        "firebug/lib/css"
    ],
    function(Object, FBL, FBTrace, Events, Dom, Css) {
        
        // ********************************************************************************************* //
        // Custom Panel Implementation
        
        var panelName = "firestorageplus";
        
        function MyPanel() {};
        
        MyPanel.prototype = FBL.extend(
            Firebug.Panel,
            {
                name: panelName,
                title: "FireStorage Plus!",
            
                // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
                // Initialization
            
                initialize: function() {
                    Firebug.Panel.initialize.apply(this, arguments);
            
                    if (FBTrace.DBG_FIRESTORAGEPLUS)
                        FBTrace.sysout("fireStoragePlus; MyPanel.initialize");
            
                    // TODO: Panel initialization (there is one panel instance per browser tab)
            
                    this.refresh();
                },
            
                destroy: function(state) {
                    if (FBTrace.DBG_FIRESTORAGEPLUS)
                        FBTrace.sysout("fireStoragePlus; MyPanel.destroy");
            
                    Firebug.Panel.destroy.apply(this, arguments);
                },
            
                show: function(state) {
                    Firebug.Panel.show.apply(this, arguments);
            
                    this.refresh();
                    if (FBTrace.DBG_FIRESTORAGEPLUS)
                        FBTrace.sysout("fireStoragePlus; MyPanel.show");
                },
            
                refresh: function() {
                    this.MyTemplate.render(this);
                }
            }
        );
        
        with (FBL) {
            MyPanel.prototype.MyTemplate = domplate(
                {
                    cleartag: 
                        DIV(''),
                    storageheadingtag:
                        TABLE({'class': "storageTable", cellpadding: 0, cellspacing: 0, hiddenCols: ""},
                            TBODY(
                                TR({'class': "storageHeaderRow"},
                                    TD({id: "storageBreakpointBar", width: "1%", 'class': "storageHeaderCell"},
                                        "&nbsp;"
                                    ),
                                    TD({id: "colName", role: "columnheader",
                                        'class': "storageHeaderCell alphaValue a11yFocus"},
                                        DIV({'class': "storageHeaderCellBox"},
                                        "Name")
                                    ),
                                    TD({id: "colValue", role: "columnheader",
                                        'class': "storageHeaderCell alphaValue a11yFocus"},
                                        DIV({'class': "storageHeaderCellBox"}, 
                                        "Value")
                                    )
                                )
                            )
                        ),
                    storageitemtag:
                        FOR("item", "$array",
                            TR({'class': "storageRow"},
                               TD({'class': "storageCol"},
                                   DIV({'class': "sourceLine storageRowHeader"},
                                        "&nbsp;"
                                   )
                                ),
                                TD({'class': "storageNameCol storageCol"},
                                    DIV({'class': "storageNameLabel storageLabel", onclick: "$onClickRow"}, "$item.key")
                                ),
                                TD({'class': "storageValueCol storageCol"},
                                    DIV({'class': "storageValueLabel storageLabel"}, 
                                        SPAN("$item.value")
                                    )
                                )
                            ),
                            TR({'class': 'storageInfoRow collapsed', 'collapsed': 'true'}, 
                                TD({'class': 'sourceLine storageRowHeader'}),
                                TD({'class': 'storageInfoCol', 'colspan':"3"},
                                    DIV({'class' : 'storageInfoBody'}, 
                                        DIV({'class' : 'storageInfoTabs'}, 
                                            A({'view' : 'Value', 'class': 'storageInfoValueTab storageInfoTab', 'selected': 'true'}, 'Value'),
                                            A({'view' : 'Json', 'class': 'storageInfoJsonTab storageInfoTab collapsed'}, 'JSON')
                                        ),
                                        DIV({'class': 'storageInfoValueText storageInfoText', 'selected': 'true'},
                                            PRE({'role': 'list'},
                                                CODE({'class' : 'wrappedText focusRow', 'role': 'listitem'}, "$item.prettyValue")
                                            )
                                        ),
                                        DIV({'class': 'storageInfoJsonText storageInfoText'})
                                    )
                                )
                            )
                        ),
                    section:
                        H2("$title"),
                
                    render: function(panel) {
                        this.clear(panel);
                        this.renderStorage(panel, 'localStorage');
                        this.renderStorage(panel, 'sessionStorage');
                    },
                    clear: function(panel) {
                        this.cleartag.replace({}, panel.panelNode);
                    },
                    renderStorage: function(panel, storage) {
                        this.section.append({'title' : storage}, panel.panelNode);
                        var table = this.storageheadingtag.append({}, panel.panelNode);
                        var items = panel.MyStorage.getStorageItems(storage);
                        if (items.length > 0) {
                            this.storageitemtag.insertRows(
                                {
                                    array: items
                                }, 
                                table
                            );        
                        }                                
                    },
                    onClickRow: function(event)
                    {
                        if (Events.isLeftClick(event))
                        {
                            var row = Dom.getAncestorByClass(event.target, "storageRow");
                            if (row)
                            {
                                this.toggleRow(row);
                                Events.cancelEvent(event);
                            }
                        }
                    },

                    toggleRow: function(row)
                    {
                        var nextRow = Dom.getNextByClass(row, 'storageInfoRow');
                        if (Dom.isCollapsed(nextRow)) {
                            Dom.collapse(nextRow, false);
                        } else {
                            Dom.collapse(nextRow, true);
                        }
                        Css.toggleClass(nextRow, 'collapsed');
                        Css.toggleClass(row, 'opened');
                    },                   
                }
            );
        };
        
        
        MyPanel.prototype.MyStorage = {
            getStorageItems: function (storage) {
                var storageObject = this.getStorageObject(storage);
                var items = []; 
                for (var name in storageObject) {
                    items.push(
                        {
                            key: name, 
                            value: storageObject[name],
                            prettyValue: this.pretty(storageObject[name]),
                        }
                    );
                }
                return items;
            },
            getStorageObject: function(storage) {
                var object = {};
                try {
                    var context = Firebug.currentContext;
                    var names = ["localStorage", "sessionStorage"];
                    for (var i = 0; i < 2; ++i)
                    {
                        if (names[i] !== storage)
                            continue;
                       
                        Firebug.CommandLine.evaluate(
                            "((" + this.makeObject + ")(" + names[i] + "))",
                            context,
                            null, null,
                            function(result) {
                                object = result;
                                done = true;
                            },
                            function() {
                            },
                            true
                        );
                    }
                }
                catch(e)
                {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout("fireStoragePlus; EXCEPTION " + e, e);
                }
                return object;
            },
            makeObject : function(storage) {
                // Create a raw object, free from getItem etc., from a storage.
                // May be serialized and run in page scope.
                var object = {};
                try
                {
                    for (var name in storage)
                    {
                        object[name] =  storage.getItem(name);
                    }
                }
                catch(e)
                {
                    // We can't log an error in page scope.
                }
                return object;
            },
            pretty: function (value) {
                try {
                    var jsonObject = JSON.parse(value);
                    return JSON.stringify(jsonObject, undefined, 2); // indentation level = 2
                } catch (e) {
                    return value;
                }
            }
        };
        
        Firebug.registerPanel(MyPanel);
        Firebug.registerStylesheet("resource://firestorageplus/skin/classic/firestorageplus.css");
        
        if (FBTrace.DBG_FIRESTORAGEPLUS) {
            FBTrace.sysout("fireStoragePlus; myPanel.js, stylesheet registered");
        }
        
        return MyPanel;
    }
);
