// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var jupyter_js_services_1 = require('jupyter-js-services');
var phosphor_widget_1 = require('phosphor-widget');
require('./index.css');
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
     * @param baseUrl - The base url for the Contents API.
     *
     * @param currentDir - The name of the current directory.
     *
     * @param contents - An existing Contents API object.
     */
    function FileBrowser(baseUrl, currentDir, contents) {
        _super.call(this);
        this._currentDir = '';
        this._onClick = null;
        this._contents = null;
        this.addClass('jp-FileBrowser');
        this._contents = contents || new jupyter_js_services_1.Contents(baseUrl);
        document.addEventListener('mousedown', this);
        this._currentDir = currentDir;
    }
    /**
     * Create a new node for the file list.
     */
    FileBrowser.createNode = function () {
        var node = document.createElement('div');
        node.innerHTML = ('<div class="jp-FileBrowser-files-inner">' +
            '<div class="jp-FileBrowser-files-header">Files</div>' +
            '<div class="jp-FileBrowser-list-container"></div>' +
            '</div>');
        return node;
    };
    Object.defineProperty(FileBrowser.prototype, "directory", {
        /**
         * Get the current directory of the file browser.
         */
        get: function () {
            return this._currentDir;
        },
        /**
         * Set the current directory of the file browser.
         *
         * @param path - The path of the new directory.
         *
         * #### Note
         * This does not call [[listDirectory]].
         */
        set: function (path) {
            this._currentDir = path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowser.prototype, "onClick", {
        /**
         * Get the onClick handler for the file browser.
         *
         * This is called in response to a user clicking on a file target.
         * The contents of the file are retrieved, and the name and contents
         * of the file are passed to the handler.
         */
        get: function () {
            return this._onClick;
        },
        /**
         * Set the onClick handler for the file browser.
         *
         * @param cb - The callback for an onclick event.
         *
         * This is called in response to a user clicking on a file target.
         * The contents of the file are retrieved, and the name and contents
         * of the file are passed to the handler.
         */
        set: function (cb) {
            this._onClick = cb;
        },
        enumerable: true,
        configurable: true
    });
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
        if (event.type === 'mousedown') {
            this._evtMouseDown(event);
        }
    };
    /**
     * Set the file browser contents based on the current directory.
     */
    FileBrowser.prototype.listDirectory = function () {
        var _this = this;
        this.node.firstChild.lastChild.textContent = '';
        // Add a parent link if not at the root.
        if (this._currentDir.lastIndexOf('/') !== -1) {
            this._addItem('..', true);
        }
        var path = this._currentDir.slice(0, this._currentDir.length - 1);
        this._contents.listContents(path).then(function (msg) {
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
    /**
     * Handle the `'mousedown'` event for the file browser.
     */
    FileBrowser.prototype._evtMouseDown = function (event) {
        var _this = this;
        var el = event.target;
        if (el.className.indexOf('jp-item-link') === -1) {
            return;
        }
        var text = el.textContent;
        // Handle a directory target.
        if (text[text.length - 1] === '/') {
            this._currentDir += text;
            this.listDirectory();
        }
        else if (text === '..') {
            var parts = this._currentDir.split('/');
            parts = parts.slice(0, parts.length - 2);
            if (parts.length === 0) {
                this._currentDir = '';
            }
            else {
                this._currentDir = parts.join('/') + '/';
            }
            this.listDirectory();
        }
        else {
            var path = this._currentDir + text;
            this._contents.get(path, 'file', {}).then(function (msg) {
                var onClick = _this._onClick;
                if (onClick) {
                    onClick(msg.path, msg.content);
                }
            });
        }
    };
    /*
     * Add an item to the file browser display.
     *
     * @param text - The text to display for the item.
     * @param isDirectory - Whether the item is a directory.
     */
    FileBrowser.prototype._addItem = function (text, isDirectory) {
        var top = document.createElement('div');
        top.className = 'jp-FileBrowser-list-item';
        top.classList.add('jp-FileBrowser-row');
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
        this.node.firstChild.lastChild.appendChild(top);
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
