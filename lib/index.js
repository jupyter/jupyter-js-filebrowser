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
 */
var FileBrowser = (function (_super) {
    __extends(FileBrowser, _super);
    /**
     * Construct a new file browser widget.
     */
    function FileBrowser(baseUrl, currentDir, contents) {
        _super.call(this);
        this._currentDir = '';
        this._onClick = null;
        this._contents = null;
        this.addClass('FileBrowser');
        this._contents = contents || new jupyter_js_services_1.Contents(baseUrl);
        document.addEventListener('mousedown', this, true);
        this._currentDir = currentDir;
    }
    /**
     * Create a new node for the file list.
     */
    FileBrowser.createNode = function () {
        var node = document.createElement('div');
        node.innerHTML = ('<div class="files_inner">' +
            '<div class="files_header">Files</div>' +
            '<div class="list_container"></div>' +
            '</div>');
        return node;
    };
    Object.defineProperty(FileBrowser.prototype, "onClick", {
        /**
         * Get the onClick handler for the file browser.
         */
        get: function () {
            return this._onClick;
        },
        /**
         * Set the onClick handler for the file browser.
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
        var _this = this;
        if (!this.node.contains(event.target)) {
            return;
        }
        if (event.type === 'mousedown') {
            var el = event.target;
            var text = el.textContent;
            if (text[text.length - 1] === "/") {
                this._currentDir += text;
                this.listDir();
            }
            else if (text === '..') {
                var parts = this._currentDir.split('/');
                var parts = parts.slice(0, parts.length - 2);
                if (parts.length === 0) {
                    this._currentDir = '';
                }
                else {
                    this._currentDir = parts.join('/') + '/';
                }
                this.listDir();
            }
            else {
                var path = this._currentDir + event.target.textContent;
                this._contents.get(path, "file", {}).then(function (msg) {
                    var onClick = _this._onClick;
                    if (onClick) {
                        onClick(msg.path, msg.content);
                    }
                });
            }
        }
    };
    /**
     * Set the file browser contents to the items in the
     * current directory.
     */
    FileBrowser.prototype.listDir = function () {
        var _this = this;
        this.node.firstChild.lastChild.textContent = '';
        if (this._currentDir.lastIndexOf('/') !== -1) {
            this._addItem('..', true);
        }
        var path = this._currentDir.slice(0, this._currentDir.length - 1);
        this._contents.listContents(path).then(function (msg) {
            for (var i = 0; i < msg.content.length; i++) {
                if (msg.content[i].length) {
                    _this._addItem(msg.content[i].name + '/', true);
                }
                else {
                    _this._addItem(msg.content[i].name, false);
                }
            }
        });
    };
    FileBrowser.prototype._addItem = function (text, isDirectory) {
        var top = document.createElement('div');
        top.className = 'list_item';
        top.classList.add('row');
        var node = document.createElement('div');
        node.classList.add('col-md-12');
        var inode = document.createElement('i');
        inode.className = 'item_icon';
        inode.style.display = 'inline-block';
        inode.classList.add('icon-fixed-width');
        var lnode = document.createElement('div');
        lnode.className = 'item_link';
        lnode.classList.add('fileItem');
        lnode.textContent = text;
        if (isDirectory) {
            inode.classList.add('folder_icon');
        }
        else {
            inode.classList.add('file_icon');
        }
        node.appendChild(inode);
        node.appendChild(lnode);
        top.appendChild(node);
        this.node.firstChild.lastChild.appendChild(top);
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
