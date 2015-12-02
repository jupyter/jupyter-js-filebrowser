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
        var node = this._findTarget(event);
        if (!node) {
            return;
        }
        // Handle toggling.
        if (event.metaKey || event.ctrlKey) {
            if (node.classList.contains(SELECTED_CLASS)) {
                node.classList.remove(SELECTED_CLASS);
            }
            else {
                node.classList.add(SELECTED_CLASS);
            }
        }
        else if (event.shiftKey) {
            // Find the "nearest selected".
            var nearestIndex = -1;
            var index = -1;
            var rows = this.node.querySelectorAll("." + ROW_CLASS);
            for (var i = 0; i < rows.length; i++) {
                if (rows[i] === node) {
                    index = i;
                    continue;
                }
                if (rows[i].classList.contains(SELECTED_CLASS)) {
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
            if (nearestIndex === -1) {
                nearestIndex = 0;
            }
            for (var i = 0; i < rows.length; i++) {
                if (nearestIndex >= i && index <= i ||
                    nearestIndex <= i && index >= i) {
                    rows[i].classList.add(SELECTED_CLASS);
                }
            }
        }
        else {
            var rows = this.node.querySelectorAll("." + ROW_CLASS);
            for (var i_1 = 0; i_1 < rows.length; i_1++) {
                rows[i_1].classList.remove(SELECTED_CLASS);
            }
            node.classList.add(SELECTED_CLASS);
        }
    };
    /**
     * Handle the `'dblclick'` event for the file browser.
     */
    FileBrowser.prototype._evtDblClick = function (event) {
        var node = this._findTarget(event);
        if (!node) {
            return;
        }
        this.open();
    };
    FileBrowser.prototype._findTarget = function (event) {
        var rows = this.node.querySelectorAll("." + ROW_CLASS);
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (phosphor_domutil_1.hitTest(row, event.clientX, event.clientY)) {
                return row;
            }
        }
        return void 0;
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
        var top = document.createElement('div');
        top.classList.add(ROW_CLASS);
        var node = document.createElement('div');
        node.classList.add('col-md-12');
        var inode = document.createElement('i');
        inode.className = 'jp-item-icon';
        inode.style.display = 'inline-block';
        inode.classList.add('jp-icon-fixed-width');
        var lnode = document.createElement('div');
        lnode.className = 'jp-item-link';
        lnode.textContent = text;
        // Add the appropriate icon based on whether it is a directory.
        if (isDirectory) {
            inode.classList.add('jp-folder-icon');
        }
        else {
            inode.classList.add('jp-file-icon');
        }
        node.appendChild(inode);
        node.appendChild(lnode);
        top.appendChild(node);
        this.node.firstChild.appendChild(top);
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
