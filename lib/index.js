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
var phosphor_signaling_1 = require('phosphor-signaling');
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
 * An implementation of a file browser view model.
 */
var FileBrowserViewModel = (function () {
    /**
     * Construct a new file browser view model.
     */
    function FileBrowserViewModel(contents) {
        this._baseUrl = '';
        this._selectedItems = [];
        this._currentDirectory = '';
        this._contents = null;
        this._contents = contents;
    }
    Object.defineProperty(FileBrowserViewModel.prototype, "opened", {
        /**
         * Get the item opened signal.
         */
        get: function () {
            return FileBrowserViewModel.openedSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserViewModel.prototype, "currentDirectory", {
        /**
         * Get the current directory.
         */
        get: function () {
            return this._currentDirectory;
        },
        /**
         * Set the current directory.
         */
        set: function (path) {
            this._currentDirectory = path;
            this.refresh();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserViewModel.prototype, "selectedItems", {
        /**
         * Get the current selected items.
         */
        get: function () {
            return this._selectedItems;
        },
        /**
         * Set the current selected items.
         */
        set: function (items) {
            this._selectedItems = items;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserViewModel.prototype, "contents", {
        /**
         * Get the contents provider.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._contents;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Open the current selected items.
     *
     * #### Notes
     * Emits an [[opened]] signal for each item
     * after loading the contents.
     */
    FileBrowserViewModel.prototype.open = function () {
        var _this = this;
        for (var _i = 0, _a = this.selectedItems; _i < _a.length; _i++) {
            var item = _a[_i];
            this._contents.get(item.path, { type: item.type }).then(function (contents) {
                _this.opened.emit(contents);
            });
        }
    };
    /**
     * Refresh the directory contents.
     */
    FileBrowserViewModel.prototype.refresh = function () {
        var _this = this;
        this._contents.listContents(this._currentDirectory).then(function (model) {
            _this.opened.emit(model);
        });
    };
    /**
     * A signal emitted when an item is opened.
     */
    FileBrowserViewModel.openedSignal = new phosphor_signaling_1.Signal();
    return FileBrowserViewModel;
})();
exports.FileBrowserViewModel = FileBrowserViewModel;
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
        var _this = this;
        _super.call(this);
        this._model = null;
        this._items = null;
        this._model = model;
        this._items = [];
        this.addClass(FILE_BROWSER_CLASS);
        this._model.opened.connect(function (model, contents) {
            if (contents.type === 'directory') {
                _this._load(contents);
            }
        });
    }
    /**
     * Create a new node for the file list.
     */
    FileBrowser.createNode = function () {
        var node = document.createElement('div');
        var child = document.createElement('ul');
        child.classList.add(LIST_AREA_CLASS);
        node.appendChild(child);
        return node;
    };
    /**
     * Dispose of the resources held by the file browser.
     */
    FileBrowser.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._items = null;
        this._model = null;
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
        this._model.refresh();
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
        items = this._items.filter(function (item) {
            return item.selected;
        });
        this._model.selectedItems = items.map(function (item) {
            return item.model;
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
        this._model.open();
    };
    /**
     * Load a directory
     */
    FileBrowser.prototype._load = function (payload) {
        var nItems = payload.content.length;
        var start = 0;
        if (payload.path) {
            nItems += 1;
            start = 1;
        }
        // Remove any excess items.
        while (payload.content.length > nItems) {
            var item = this._items.pop();
            item.dispose();
        }
        // Add any missing items.
        while (payload.content.length < nItems) {
            var item = new FileBrowserItem();
            this._items.push(item);
            this.node.firstChild.appendChild(item.node);
        }
        // Add a parent link if not at the root.
        if (payload.path) {
            var path = '';
            var last = payload.path.lastIndexOf('/');
            if (last !== -1) {
                path = payload.path.slice(0, last);
            }
            this._items[0].model = {
                name: '..',
                path: path,
                type: 'directory',
                writable: null,
                created: null,
                last_modified: null,
            };
        }
        var content = payload.content;
        for (var i = start; i < content.length; i++) {
            this._items[i].model = content[i];
        }
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
/**
 * An implementation of a file browser item.
 */
var FileBrowserItem = (function (_super) {
    __extends(FileBrowserItem, _super);
    /**
     * Construct a new file browser item.
     *
     * @param options - Initialization options for the item.
     */
    function FileBrowserItem(model) {
        _super.call(this);
        this._model = null;
        this.addClass(ROW_CLASS);
        if (model) {
            this.model = model;
        }
    }
    /**
     * Create a node for a file browser item.
     */
    FileBrowserItem.createNode = function () {
        var node = document.createElement('li');
        var inode = document.createElement('span');
        inode.className = ROW_ICON_CLASS;
        var tnode = document.createElement('span');
        tnode.className = ROW_TEXT_CLASS;
        var mnode = document.createElement('span');
        mnode.className = ROW_TIME_CLASS;
        node.appendChild(inode);
        node.appendChild(tnode);
        node.appendChild(mnode);
        return node;
    };
    Object.defineProperty(FileBrowserItem.prototype, "model", {
        /**
         * Get the model assoicated with the item.
         */
        get: function () {
            return this._model;
        },
        /**
         * Set the model associated with the item.
         */
        set: function (item) {
            this._model = item;
            // Add the appropriate icon based on whether it is a directory.
            var inode = this.node.children[0];
            inode.className = ROW_ICON_CLASS;
            if (item.type === 'directory') {
                inode.classList.add(FOLDER_ICON_CLASS);
            }
            else {
                inode.classList.add(FILE_ICON_CLASS);
            }
            this.node.children[1].textContent = item.name;
            // Add the last modified identifier if applicable.
            if (item.last_modified) {
                var modText = moment(item.last_modified).fromNow();
                this.node.children[2].textContent = modText;
            }
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
