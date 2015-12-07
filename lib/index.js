// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var moment = require('moment');
var phosphor_domutil_1 = require('phosphor-domutil');
var phosphor_nodewrapper_1 = require('phosphor-nodewrapper');
var phosphor_widget_1 = require('phosphor-widget');
require('./index.css');
/**
 * The class name added to FileBrowser instances.
 */
var FILE_BROWSER_CLASS = 'jp-FileBrowser';
/**
 * The class name added to FileBrowser rows.
 */
var LIST_AREA_CLASS = 'jp-FileBrowser-list-area';
/**
 * The class name added to FileBrowser rows.
 */
var ROW_CLASS = 'jp-FileBrowser-row';
/**
 * The class name added to selected rows.
 */
var SELECTED_CLASS = 'jp-mod-selected';
/**
 * The class name added to a row icon.
 */
var ROW_ICON_CLASS = 'jp-FileBrowser-item-icon';
/**
 * The class name added to a row text.
 */
var ROW_TEXT_CLASS = 'jp-FileBrowser-item-text';
/**
 * The class name added to a row last modified text.
 */
var ROW_TIME_CLASS = 'jp-FileBrowser-item-modified';
/**
 * The class name added to a folder icon.
 */
var FOLDER_ICON_CLASS = 'jp-FileBrowser-folder-icon';
/**
 * The class name added to a file icon.
 */
var FILE_ICON_CLASS = 'jp-FileBrowser-file-icon';
/**
 * The contents item type.
 */
(function (ContentsItemType) {
    ContentsItemType[ContentsItemType["Directory"] = 0] = "Directory";
    ContentsItemType[ContentsItemType["File"] = 1] = "File";
    ContentsItemType[ContentsItemType["Notebook"] = 2] = "Notebook";
    ContentsItemType[ContentsItemType["Unknown"] = 3] = "Unknown";
})(exports.ContentsItemType || (exports.ContentsItemType = {}));
var ContentsItemType = exports.ContentsItemType;
/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retreive contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
var FileBrowser = (function (_super) {
    __extends(FileBrowser, _super);
    /**
     * Construct a new file browser widget.
     *
     * @param model - File browser view model instance.
     */
    function FileBrowser(model) {
        _super.call(this);
        this._model = null;
        this._items = null;
        this._model = model;
        this._items = [];
        this.addClass(FILE_BROWSER_CLASS);
    }
    /**
     * Create a new node for the file list.
     */
    FileBrowser.createNode = function () {
        var node = document.createElement('div');
        var child = document.createElement('div');
        child.classList.add(LIST_AREA_CLASS);
        node.appendChild(child);
        return node;
    };
    Object.defineProperty(FileBrowser.prototype, "directory", {
        /**
         * Get the current directory of the file browser.
         */
        get: function () {
            return this._model.currentDirectory;
        },
        /**
         * Set the current directory of the file browser.
         *
         * @param path - The path of the new directory.
         */
        set: function (path) {
            this._model.currentDirectory = path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowser.prototype, "selectedItems", {
        /**
         * Get the selected items for the file browser.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._model.selectedItems;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Open the currently selected item(s).
     *
     * #### Notes
     * Files are opened by emitting the [[openFile]] signal.
     *
     * If the selection includes one or more directories, the contents
     * will update to list that directory.
     *
     * All selected files will trigger an [[itemOpened]] signal.
     */
    FileBrowser.prototype.open = function () {
        console.log('open');
        var items = this._items.filter(function (item) {
            return item.selected;
        });
        if (!items.length) {
            return;
        }
        var dirs = items.filter(function (item) {
            return item.type === ContentsItemType.Directory;
        });
        if (dirs.length) {
            this._model.currentDirectory = dirs[0].path;
            this._listContents();
        }
    };
    /**
     * Handle the DOM events for the file browser.
     *
     * @param event - The DOM event sent to the panel.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the panel's DOM node. It should
     * not be called directly by user code.
     */
    FileBrowser.prototype.handleEvent = function (event) {
        switch (event.type) {
            case 'click':
                this._evtClick(event);
                break;
            case 'dblclick':
                this._evtDblClick(event);
                break;
        }
    };
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    FileBrowser.prototype.onAfterAttach = function (msg) {
        _super.prototype.onAfterAttach.call(this, msg);
        var node = this.node;
        node.addEventListener('click', this);
        node.addEventListener('dblclick', this);
        this._listContents();
    };
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    FileBrowser.prototype.onBeforeDetach = function (msg) {
        _super.prototype.onBeforeDetach.call(this, msg);
        var node = this.node;
        node.removeEventListener('click', this);
        node.removeEventListener('dblclick', this);
    };
    /**
     * Handle the `'click'` event for the file browser.
     */
    FileBrowser.prototype._evtClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Find the target row.
        var items = this._items.filter(function (item) {
            return item.hitTest(event.clientX, event.clientY);
        });
        if (!items.length) {
            return;
        }
        var current = items[0];
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        // Handle toggling.
        if (event.metaKey || event.ctrlKey) {
            if (current.selected) {
                current.selected = false;
            }
            else {
                current.selected = true;
            }
        }
        else if (event.shiftKey) {
            // Find the "nearest selected".
            var nearestIndex = -1;
            var index = -1;
            for (var i = 0; i < this._items.length; i++) {
                if (this._items[i] === current) {
                    index = i;
                    continue;
                }
                if (this._items[i].selected) {
                    if (nearestIndex === -1) {
                        nearestIndex = i;
                    }
                    else {
                        if (Math.abs(index - i) < Math.abs(nearestIndex - i)) {
                            nearestIndex = i;
                        }
                    }
                }
            }
            // Default to the first element (and fill down).
            if (nearestIndex === -1) {
                nearestIndex = 0;
            }
            // Select the rows between the current and the nearest selected.
            for (var i = 0; i < this._items.length; i++) {
                if (nearestIndex >= i && index <= i ||
                    nearestIndex <= i && index >= i) {
                    this._items[i].selected = true;
                }
            }
        }
        else {
            for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
                var item = _a[_i];
                item.selected = false;
            }
            current.selected = true;
        }
        // Set the selected items on the model.
        this._model.selectedItems = this._items.filter(function (item) {
            return item.selected;
        });
    };
    /**
     * Handle the `'dblclick'` event for the file browser.
     */
    FileBrowser.prototype._evtDblClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Find the target row.
        var items = this._items.filter(function (item) {
            return item.hitTest(event.clientX, event.clientY);
        });
        if (!items.length) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        // Open the selected item.
        this.open();
    };
    /**
     * List the contents of the current directory.
     */
    FileBrowser.prototype._listContents = function () {
        var _this = this;
        var currentDir = this._model.currentDirectory;
        var contents = this._model.contents;
        for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
            var item = _a[_i];
            item.dispose();
        }
        this._items = [];
        // Add a parent link if not at the root.
        if (currentDir) {
            var item = new FileBrowserItem({
                name: '..',
                path: '',
                type: 'directory'
            });
            this._items.push(item);
            this.node.firstChild.appendChild(item.node);
        }
        contents.listContents(currentDir).then(function (msg) {
            for (var i = 0; i < msg.content.length; i++) {
                var item = new FileBrowserItem(msg.content[i]);
                _this._items.push(item);
                _this.node.firstChild.appendChild(item.node);
            }
        });
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
var FileBrowserItem = (function (_super) {
    __extends(FileBrowserItem, _super);
    /**
     * Construct a new file browser item.
     *
     * @param options - Initialization options for the item.
     */
    function FileBrowserItem(options) {
        _super.call(this);
        this.addClass(ROW_CLASS);
        switch (options.type) {
            case 'directory':
                this._type = ContentsItemType.Directory;
                break;
            case 'file':
                this._type = ContentsItemType.File;
                break;
            case 'notebook':
                this._type = ContentsItemType.Notebook;
                break;
            default:
                this._type = ContentsItemType.Unknown;
        }
        // Add the appropriate icon based on whether it is a directory.
        var inode = this.node.children[0];
        if (this._type === ContentsItemType.Directory) {
            inode.classList.add(FOLDER_ICON_CLASS);
        }
        else {
            inode.classList.add(FILE_ICON_CLASS);
        }
        this.node.children[1].textContent = options.name;
        this._name = options.name;
        this._path = options.path;
        this._created = options.created || '';
        this._lastModified = options.last_modified || '';
        if (this._lastModified) {
            var modText = moment(this._lastModified).fromNow();
            this.node.children[2].textContent = modText;
        }
    }
    /**
     * Create a node for a file browser item.
     */
    FileBrowserItem.createNode = function () {
        var node = document.createElement('div');
        var inode = document.createElement('i');
        inode.className = ROW_ICON_CLASS;
        var tnode = document.createElement('div');
        tnode.className = ROW_TEXT_CLASS;
        var mnode = document.createElement('div');
        mnode.className = ROW_TIME_CLASS;
        node.appendChild(inode);
        node.appendChild(tnode);
        node.appendChild(mnode);
        return node;
    };
    Object.defineProperty(FileBrowserItem.prototype, "name", {
        /**
         * Get the name of the item.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserItem.prototype, "path", {
        /**
         * Get the full path to the item.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserItem.prototype, "type", {
        /**
         * Get the type of the item.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserItem.prototype, "created", {
        /**
         * Get the creation time of the item.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._created;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserItem.prototype, "lastModified", {
        /**
         * Get the last modified time of the item.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._lastModified;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserItem.prototype, "selected", {
        /**
         * Get whether the item is selected.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this.node.classList.contains(SELECTED_CLASS);
        },
        /**
         * Set whether the item is selected.
         */
        set: function (value) {
            if (value) {
                this.node.classList.add(SELECTED_CLASS);
            }
            else {
                this.node.classList.remove(SELECTED_CLASS);
            }
        },
        enumerable: true,
        configurable: true
    });
    FileBrowserItem.prototype.hitTest = function (clientX, clientY) {
        return phosphor_domutil_1.hitTest(this.node, clientX, clientY);
    };
    FileBrowserItem.prototype.dispose = function () {
        this.node.parentNode.removeChild(this.node);
    };
    return FileBrowserItem;
})(phosphor_nodewrapper_1.NodeWrapper);
