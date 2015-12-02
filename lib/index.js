// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var phosphor_domutil_1 = require('phosphor-domutil');
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
 * The class name added to a folder icon.
 */
var FOLDER_ICON_CLASS = 'jp-FileBrowser-folder-icon';
/**
 * The class name added to a file icon.
 */
var FILE_ICON_CLASS = 'jp-FileBrowser-file-icon';
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
        this._model = model;
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
     * If there is only one currently selected item, and it is a
     * directory, the widget will refresh with that directory's contents.
     *
     * If more than one directory is selected and no files are selected,
     * the top-most directory will be selected and refreshed.
     *
     * If one or more directories are selected in addition to one or
     * more files, the directories will be ignored and the files will
     * be opened.
     */
    FileBrowser.prototype.open = function () {
        console.log('open');
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
        var rows = findByClass(this.node, ROW_CLASS);
        var node = hitTestNodes(rows, event.clientX, event.clientY);
        if (!node) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        // Handle toggling.
        if (event.metaKey || event.ctrlKey) {
            toggleClass(node, SELECTED_CLASS);
        }
        else if (event.shiftKey) {
            // Find the "nearest selected".
            var nearestIndex = -1;
            var index = -1;
            for (var i = 0; i < rows.length; i++) {
                if (rows[i] === node) {
                    index = i;
                    continue;
                }
                if (hasClass(rows[i], SELECTED_CLASS)) {
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
            for (var i = 0; i < rows.length; i++) {
                if (nearestIndex >= i && index <= i ||
                    nearestIndex <= i && index >= i) {
                    addClass(rows[i], SELECTED_CLASS);
                }
            }
        }
        else {
            for (var _i = 0; _i < rows.length; _i++) {
                var row = rows[_i];
                removeClass(row, SELECTED_CLASS);
            }
            addClass(node, SELECTED_CLASS);
        }
        // Set the selected items on the model.
        var items = [];
        for (var _a = 0; _a < rows.length; _a++) {
            var row = rows[_a];
            if (hasClass(row, SELECTED_CLASS)) {
                items.push(row.children[1].textContent);
            }
        }
        this._model.selectedItems = items;
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
        var rows = findByClass(this.node, ROW_CLASS);
        var node = hitTestNodes(rows, event.clientX, event.clientY);
        if (!node) {
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
        this.node.firstChild.textContent = '';
        // Add a parent link if not at the root.
        if (currentDir.lastIndexOf('/') !== -1) {
            this._addItem('..', true);
        }
        var path = currentDir.slice(0, currentDir.length - 1);
        contents.listContents(path).then(function (msg) {
            for (var i = 0; i < msg.content.length; i++) {
                if (msg.content[i].type === 'directory') {
                    _this._addItem(msg.content[i].name + '/', true);
                }
                else {
                    _this._addItem(msg.content[i].name, false);
                }
            }
        });
    };
    /*
     * Add an item to the file browser display.
     *
     * @param text - The text to display for the item.
     * @param isDirectory - Whether the item is a directory.
     */
    FileBrowser.prototype._addItem = function (text, isDirectory) {
        var row = document.createElement('div');
        addClass(row, ROW_CLASS);
        var inode = document.createElement('i');
        addClass(inode, ROW_ICON_CLASS);
        // Add the appropriate icon based on whether it is a directory.
        if (isDirectory) {
            addClass(inode, FOLDER_ICON_CLASS);
        }
        else {
            addClass(inode, FILE_ICON_CLASS);
        }
        var lnode = document.createElement('div');
        addClass(lnode, ROW_TEXT_CLASS);
        lnode.textContent = text;
        row.appendChild(inode);
        row.appendChild(lnode);
        this.node.firstChild.appendChild(row);
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
/**
 * Test whether a node contains a CSS class.
 */
function hasClass(node, className) {
    return node.classList.contains(className);
}
/**
 * Toggle a CSS class on a node.
 */
function toggleClass(node, className) {
    if (!hasClass(node, className)) {
        addClass(node, className);
    }
    else {
        removeClass(node, className);
    }
}
/**
 * Add a CSS class to a node.
 */
function addClass(node, className) {
    node.classList.add(className);
}
/**
 * Remove a CSS class from a node.
 */
function removeClass(node, className) {
    node.classList.remove(className);
}
/**
 * Find child nodes by CSS class name.
 */
function findByClass(node, className) {
    var elements = [];
    var nodeList = node.getElementsByClassName(className);
    for (var i = 0; i < nodeList.length; i++) {
        elements.push(nodeList[i]);
    }
    return elements;
}
/**
 * Perform a client position hit test an array of nodes.
 *
 * Returns the first matching node, or `undefined`.
 */
function hitTestNodes(nodes, clientX, clientY) {
    for (var _i = 0; _i < nodes.length; _i++) {
        var node = nodes[_i];
        if (phosphor_domutil_1.hitTest(node, clientX, clientY)) {
            return node;
        }
    }
    return void 0;
}
