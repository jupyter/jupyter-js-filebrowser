// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var moment = require('moment');
var phosphor_command_1 = require('phosphor-command');
var phosphor_dialog_1 = require('phosphor-dialog');
var phosphor_domutil_1 = require('phosphor-domutil');
var phosphor_dragdrop_1 = require('phosphor-dragdrop');
var phosphor_menus_1 = require('phosphor-menus');
var phosphor_signaling_1 = require('phosphor-signaling');
var phosphor_widget_1 = require('phosphor-widget');
require('./index.css');
/**
 * The class name added to FileBrowser instances.
 */
var FILE_BROWSER_CLASS = 'jp-FileBrowser';
/**
 * The class name added to the button node.
 */
var BUTTON_CLASS = 'jp-FileBrowser-button';
/**
 * The class name added to the button nodes.
 */
var BUTTON_ITEM_CLASS = 'jp-FileBrowser-button-item';
/**
 * The class name added to the button icon nodes.
 */
var BUTTON_ICON_CLASS = 'jp-FileBrowser-button-icon';
/**
 * The class name added to the upload button node.
 */
var UPLOAD_CLASS = 'jp-FileBrowser-upload';
/**
 * The class name added to the header node.
 */
var HEADER_CLASS = 'jp-FileBrowser-header';
/**
 * The class name added to the header file node.
 */
var HEADER_FILE_CLASS = 'jp-FileBrowser-header-file';
/**
 * The class name added to the header modified node.
 */
var HEADER_MOD_CLASS = 'jp-FileBrowser-header-modified';
/**
 * The class name added to the breadcrumb node.
 */
var BREADCRUMB_CLASS = 'jp-FileBrowser-breadcrumbs';
/**
 * The class name added to the breadcrumb node.
 */
var BREADCRUMB_ITEM_CLASS = 'jp-FileBrowser-breadcrumb-item';
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
 * The class name added to drop targets.
 */
var DROP_TARGET_CLASS = 'jp-mod-drop-target';
/**
 * The class name added to a row icon.
 */
var ROW_ICON_CLASS = 'jp-FileBrowser-item-icon';
/**
 * The class name added to a row text.
 */
var ROW_TEXT_CLASS = 'jp-FileBrowser-item-text';
/**
 * The class name added to a row filename editor.
 */
var ROW_EDIT_CLASS = 'jp-FileBrowser-item-edit';
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
 * The minimum duration for a rename select in ms.
 */
var RENAME_DURATION = 500;
/**
 * The threshold in pixels to start a drag event.
 */
var DRAG_THRESHOLD = 5;
/**
 * The mime type for a contents drag object.
 */
var CONTENTS_MIME = 'application/x-jupyter-icontents';
/**
 * Bread crumb paths.
 */
var BREAD_CRUMB_PATHS = ['/', '../../', '../', ''];
/**
 * An implementation of a file browser view model.
 *
 * #### Notes
 * All paths parameters without a leading `'/'` are interpreted as relative to
 * the current directory.  Supports `'../'` syntax.
 */
var FileBrowserViewModel = (function () {
    /**
     * Construct a new file browser view model.
     */
    function FileBrowserViewModel(path, contents) {
        this._max_upload_size_mb = 15;
        this._selectedIndices = [];
        this._contents = null;
        this._model = null;
        this._model = { path: path, name: '', type: 'directory',
            writable: true, created: '', last_modified: '' };
        this._contents = contents;
    }
    Object.defineProperty(FileBrowserViewModel.prototype, "changed", {
        /**
         * Get the item changed signal.
         */
        get: function () {
            return FileBrowserViewModel.changedSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserViewModel.prototype, "path", {
        /**
         * Get the current path.
         *
         * #### Notes
         * This is a ready-only property.
         */
        get: function () {
            return this._model.path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserViewModel.prototype, "items", {
        /**
         * Get the current items.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._model.content.slice();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileBrowserViewModel.prototype, "selected", {
        /**
         * Get the selected indices.
         */
        get: function () {
            return this._selectedIndices.slice();
        },
        /**
         * Set the selected indices.
         */
        set: function (value) {
            this._selectedIndices = value.slice();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Open a file or directory.
     *
     * @param path - The path to the file or directory.
     *
     * @returns A promise with the contents of the file.
     *
     * #### Notes
     * Emits a [[changed]] signal the after loading the contents.
     */
    FileBrowserViewModel.prototype.open = function (path) {
        var _this = this;
        path = normalizePath(this._model.path, path);
        return this._contents.get(path, {}).then(function (contents) {
            if (contents.type === 'directory') {
                _this._model = contents;
            }
            _this.changed.emit({
                name: 'open',
                oldValue: null,
                newValue: contents
            });
            return contents;
        });
    };
    /**
     * Delete a file.
     *
     * @param: path - The path to the file to be deleted.
     *
     * @returns A promise that resolves when the file is deleted.
     */
    FileBrowserViewModel.prototype.delete = function (path) {
        var _this = this;
        path = normalizePath(this._model.path, path);
        return this._contents.delete(path).then(function () {
            _this.open('.');
            return void 0;
        });
    };
    /**
     * Create a new untitled file or directory in the current directory.
     *
     * @param type - The type of file object to create. One of
     *  `['file', 'notebook', 'directory']`.
     *
     * @param ext - Optional extension for `'file'` types (defaults to `'.txt'`).
     *
     * @returns A promise containing the new file contents model.
     */
    FileBrowserViewModel.prototype.newUntitled = function (type, ext) {
        var _this = this;
        if (type === 'file') {
            ext = ext || '.txt';
        }
        else {
            ext = '';
        }
        return this._contents.newUntitled(this._model.path, { type: type, ext: ext }).then(function (contents) {
            _this.open('.');
            return contents;
        });
    };
    /**
     * Rename a file or directory.
     *
     * @param path - The path to the original file.
     *
     * @param newPath - The path to the new file.
     *
     * @returns A promise containing the new file contents model.
     */
    FileBrowserViewModel.prototype.rename = function (path, newPath) {
        var _this = this;
        // Handle relative paths.
        path = normalizePath(this._model.path, path);
        newPath = normalizePath(this._model.path, newPath);
        return this._contents.rename(path, newPath).then(function (contents) {
            var current = _this._model;
            _this.open('.');
            _this.changed.emit({
                name: 'rename',
                oldValue: current,
                newValue: contents
            });
            return contents;
        });
    };
    /**
     * Upload a `File` object.
     *
     * @param file - The `File` object to upload.
     *
     * @returns A promise containing the new file contents model.
     *
     * #### Notes
     * This will fail to upload files that are too big to be sent in one
     * request to the server.
     */
    FileBrowserViewModel.prototype.upload = function (file) {
        var _this = this;
        // Skip large files with a warning.
        if (file.size > this._max_upload_size_mb * 1024 * 1024) {
            var msg = "Cannot upload file (>" + this._max_upload_size_mb + " MB) ";
            msg += "\"" + file.name + "\"";
            console.warn(msg);
            return Promise.reject(new Error(msg));
        }
        // Gather the file model parameters.
        var path = this._model.path;
        path = path ? path + '/' + file.name : file.name;
        var name = file.name;
        var isNotebook = file.name.indexOf('.ipynb') !== -1;
        var type = isNotebook ? 'notebook' : 'file';
        var format = isNotebook ? 'json' : 'base64';
        // Get the file content.
        var reader = new FileReader();
        if (isNotebook) {
            reader.readAsText(file);
        }
        else {
            reader.readAsArrayBuffer(file);
        }
        return new Promise(function (resolve, reject) {
            reader.onload = function (event) {
                var model = {
                    type: type,
                    format: format,
                    name: name,
                    content: getContent(reader)
                };
                return _this._contents.save(path, model).then(function (model) {
                    _this.open('.');
                    return model;
                });
            };
            reader.onerror = function (event) {
                throw Error(("Failed to upload \"" + file.name + "\":") + event);
            };
        });
    };
    /**
     * A signal emitted when an item changes.
     */
    FileBrowserViewModel.changedSignal = new phosphor_signaling_1.Signal();
    return FileBrowserViewModel;
})();
exports.FileBrowserViewModel = FileBrowserViewModel;
/**
 * Parse the content of a `FileReader`.
 *
 * If the result is an `ArrayBuffer`, return a Base64-encoded string.
 * Otherwise, return the JSON parsed result.
 */
function getContent(reader) {
    if (reader.result instanceof ArrayBuffer) {
        // Base64-encode binary file data.
        var bytes = '';
        var buf = new Uint8Array(reader.result);
        var nbytes = buf.byteLength;
        for (var i = 0; i < nbytes; i++) {
            bytes += String.fromCharCode(buf[i]);
        }
        return btoa(bytes);
    }
    else {
        return JSON.parse(reader.result);
    }
}
/**
 * Normalize a path based on a root directory, accounting for relative paths.
 */
function normalizePath(root, path) {
    // Current directory
    if (path === '.') {
        return root;
    }
    // Root path.
    if (path.indexOf('/') === 0) {
        path = path.slice(1, path.length);
        root = '';
    }
    else if (path.indexOf('./') === 0) {
        path = path.slice(2, path.length);
    }
    else if (path.indexOf('../../') === 0) {
        var parts = root.split('/');
        root = parts.splice(0, parts.length - 2).join('/');
        path = path.slice(6, path.length);
    }
    else if (path.indexOf('../') === 0) {
        var parts = root.split('/');
        root = parts.splice(0, parts.length - 1).join('/');
        path = path.slice(3, path.length);
    }
    else {
    }
    if (path[path.length - 1] === '/') {
        path = path.slice(0, path.length - 1);
    }
    // Combine the root and the path if necessary.
    if (root && path) {
        path = root + '/' + path;
    }
    else if (root) {
        path = root;
    }
    return path;
}
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
        this._items = [];
        this._crumbs = [];
        this._crumbSeps = [];
        this._buttons = [];
        this._newMenu = null;
        this._pendingSelect = false;
        this._editNode = null;
        this._drag = null;
        this._dragData = null;
        this.addClass(FILE_BROWSER_CLASS);
        this._model = model;
        this._model.changed.connect(this._onChanged.bind(this));
        // Create the crumb nodes add add to crumb node.
        this._crumbs = createCrumbs();
        this._crumbSeps = createCrumbSeparators();
        var crumbs = this.node.getElementsByClassName(BREADCRUMB_CLASS)[0];
        crumbs.appendChild(this._crumbs[Crumb.Home]);
        // Create the button nodes and add to button node.
        var buttons = this.node.getElementsByClassName(BUTTON_CLASS)[0];
        this._buttons = createButtons(buttons);
        // Set up events on the buttons.
        var input = this._buttons[Button.Upload].getElementsByTagName('input')[0];
        input.onchange = this._handleUploadEvent.bind(this);
        this._buttons[Button.Refresh].onclick = function () { _this._model.open('.'); };
        this._buttons[Button.New].onclick = function () {
            var rect = _this._buttons[Button.New].getBoundingClientRect();
            _this._newMenu.popup(rect.left, rect.bottom, false, true);
        };
        // Create the "new" menu.
        var command = new phosphor_command_1.DelegateCommand(function (args) {
            _this._model.newUntitled(args);
        });
        this._newMenu = createNewItemMenu(command);
        // Create the edit node.
        this._editNode = document.createElement('input');
        this._editNode.className = ROW_EDIT_CLASS;
    }
    /**
     * Create a new node for the file list.
     */
    FileBrowser.createNode = function () {
        var node = document.createElement('div');
        // Create the breadcrumb node.
        var breadcrumbs = document.createElement('div');
        breadcrumbs.classList.add(BREADCRUMB_CLASS);
        // Create the button node.
        var buttonBar = document.createElement('div');
        buttonBar.className = BUTTON_CLASS;
        // Create the header.
        var header = document.createElement('div');
        header.classList.add(HEADER_CLASS);
        var fileName = document.createElement('span');
        fileName.textContent = 'File Name';
        fileName.className = HEADER_FILE_CLASS;
        var modified = document.createElement('span');
        modified.textContent = 'Last Modified';
        modified.className = HEADER_MOD_CLASS;
        header.appendChild(fileName);
        header.appendChild(modified);
        // Create the file list.
        var list = document.createElement('ul');
        list.classList.add(LIST_AREA_CLASS);
        // Add the children.
        node.appendChild(breadcrumbs);
        node.appendChild(buttonBar);
        node.appendChild(header);
        node.appendChild(list);
        return node;
    };
    /**
     * Dispose of the resources held by the file browser.
     */
    FileBrowser.prototype.dispose = function () {
        this._model = null;
        this._items = null;
        this._crumbs = null;
        this._crumbSeps = null;
        this._buttons = null;
        _super.prototype.dispose.call(this);
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
            case 'mousedown':
                this._evtMousedown(event);
                break;
            case 'mouseup':
                this._evtMouseup(event);
                break;
            case 'mousemove':
                this._evtMousemove(event);
                break;
            case 'click':
                this._evtClick(event);
                break;
            case 'dblclick':
                this._evtDblClick(event);
                break;
            case 'p-dragenter':
                this._evtDragEnter(event);
                break;
            case 'p-dragleave':
                this._evtDragLeave(event);
                break;
            case 'p-dragover':
                this._evtDragOver(event);
                break;
            case 'p-drop':
                this._evtDrop(event);
                break;
        }
    };
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    FileBrowser.prototype.onAfterAttach = function (msg) {
        _super.prototype.onAfterAttach.call(this, msg);
        var node = this.node;
        node.addEventListener('mousedown', this);
        node.addEventListener('mouseup', this);
        node.addEventListener('click', this);
        node.addEventListener('dblclick', this);
        node.addEventListener('p-dragenter', this);
        node.addEventListener('p-dragleave', this);
        node.addEventListener('p-dragover', this);
        node.addEventListener('p-drop', this);
        this._model.open('/');
    };
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    FileBrowser.prototype.onBeforeDetach = function (msg) {
        _super.prototype.onBeforeDetach.call(this, msg);
        var node = this.node;
        node.removeEventListener('mousedown', this);
        node.removeEventListener('mouseup', this);
        node.removeEventListener('click', this);
        node.removeEventListener('dblclick', this);
        node.removeEventListener('mousemove', this);
        node.removeEventListener('p-dragenter', this);
        node.removeEventListener('p-dragleave', this);
        node.removeEventListener('p-dragover', this);
        node.removeEventListener('p-drop', this);
    };
    /**
     * A handler invoked on an `'update-request'` message.
     */
    FileBrowser.prototype.onUpdateRequest = function (msg) {
        // Fetch common variables.
        var items = this._model.items;
        var nodes = this._items;
        var content = this.node.lastChild;
        // Remove any excess item nodes.
        while (nodes.length > items.length) {
            var node = nodes.pop();
            content.removeChild(node);
        }
        // Add any missing item nodes.
        while (nodes.length < items.length) {
            var node = createItemNode();
            nodes.push(node);
            content.appendChild(node);
        }
        // Update the node state to match the model contents.
        for (var i = 0, n = items.length; i < n; ++i) {
            updateItemNode(items[i], nodes[i]);
        }
        this._updateSelected();
        // Update the breadcrumb list.
        updateCrumbs(this._crumbs, this._crumbSeps, this._model.path);
    };
    /**
     * Handle the `'mousedown'` event for the file browser.
     */
    FileBrowser.prototype._evtMousedown = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Handle an item selection.
        var index = hitTestNodes(this._items, event.clientX, event.clientY);
        if (index !== -1) {
            this._dragData = { pressX: event.clientX, pressY: event.clientY,
                index: index };
            document.addEventListener('mouseup', this, true);
            document.addEventListener('mousemove', this, true);
        }
    };
    /**
     * Handle the `'mouseup'` event for the file browser.
     */
    FileBrowser.prototype._evtMouseup = function (event) {
        if (event.button !== 0 || !this._drag) {
            document.removeEventListener('mousemove', this, true);
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        for (var _i = 0, _a = this._buttons; _i < _a.length; _i++) {
            var node = _a[_i];
            node.classList.remove(SELECTED_CLASS);
        }
    };
    /**
     * Handle the `'mousemove'` event for the file browser.
     */
    FileBrowser.prototype._evtMousemove = function (event) {
        event.preventDefault();
        event.stopPropagation();
        // Bail if we are the one dragging.
        if (this._drag) {
            return;
        }
        // Check for a drag initialization.
        var data = this._dragData;
        var dx = Math.abs(event.clientX - data.pressX);
        var dy = Math.abs(event.clientY - data.pressY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            return;
        }
        this._startDrag(data.index, event.clientX, event.clientY);
    };
    /**
     * Handle the `'click'` event for the file browser.
     */
    FileBrowser.prototype._evtClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Handle the edit node.
        if (this._editNode.parentNode) {
            if (this._editNode !== event.target) {
                this._editNode.focus();
                this._editNode.blur();
            }
            else {
                return;
            }
        }
        // Find a valid click target.
        var node = event.target;
        while (node && node !== this.node) {
            if (node.classList.contains(BREADCRUMB_ITEM_CLASS)) {
                this._pendingSelect = false;
                var index = this._crumbs.indexOf(node);
                this._model.path = BREAD_CRUMB_PATHS[index];
                // Stop the event propagation.
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (node.classList.contains(ROW_CLASS)) {
                this._handleFileClick(event, node);
                // Stop the event propagation.
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            node = node.parentElement;
        }
        this._pendingSelect = false;
    };
    /**
     * Handle the `'dblclick'` event for the file browser.
     */
    FileBrowser.prototype._evtDblClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        this._pendingSelect = false;
        // Find a valid double click target.
        var node = event.target;
        while (node && node !== this.node) {
            if (node.classList.contains(ROW_CLASS)) {
                // Open the selected item.
                var index = this._items.indexOf(node);
                var path = this._model.items[index].name;
                this._model.open(path);
                return;
            }
            node = node.parentElement;
        }
    };
    /**
     * Handle the `'p-dragenter'` event for the dock panel.
     */
    FileBrowser.prototype._evtDragEnter = function (event) {
        if (event.mimeData.hasData(CONTENTS_MIME)) {
            var target = this._findTarget(event);
            if (target === null)
                return;
            var index = this._crumbs.indexOf(target);
            if (index !== -1) {
                if (index !== Crumb.Current) {
                    target.classList.add(DROP_TARGET_CLASS);
                    event.preventDefault();
                    event.stopPropagation();
                }
                return;
            }
            index = this._items.indexOf(target);
            if (index !== -1) {
                if (target.getElementsByClassName(FOLDER_ICON_CLASS).length &&
                    !target.classList.contains(SELECTED_CLASS)) {
                    target.classList.add(DROP_TARGET_CLASS);
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
        }
    };
    /**
     * Handle the `'p-dragleave'` event for the dock panel.
     */
    FileBrowser.prototype._evtDragLeave = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var dropTargets = this.node.getElementsByClassName(DROP_TARGET_CLASS);
        if (dropTargets.length) {
            dropTargets[0].classList.remove(DROP_TARGET_CLASS);
        }
    };
    /**
     * Handle the `'p-dragover'` event for the dock panel.
     */
    FileBrowser.prototype._evtDragOver = function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
        var dropTargets = this.node.getElementsByClassName(DROP_TARGET_CLASS);
        if (dropTargets.length) {
            dropTargets[0].classList.remove(DROP_TARGET_CLASS);
        }
        var target = this._findTarget(event);
        if (target !== null)
            target.classList.add(DROP_TARGET_CLASS);
    };
    /**
     * Handle the `'p-drop'` event for the dock panel.
     */
    FileBrowser.prototype._evtDrop = function (event) {
        var _this = this;
        event.preventDefault();
        event.stopPropagation();
        if (event.proposedAction === phosphor_dragdrop_1.DropAction.None) {
            event.dropAction = phosphor_dragdrop_1.DropAction.None;
            return;
        }
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        event.dropAction = event.proposedAction;
        var target = event.target;
        while (target && target.parentElement) {
            if (target.classList.contains(DROP_TARGET_CLASS)) {
                target.classList.remove(DROP_TARGET_CLASS);
                break;
            }
            target = target.parentElement;
        }
        // Get the path based on the target node.
        var index = this._crumbs.indexOf(target);
        if (index !== -1) {
            var path = BREAD_CRUMB_PATHS[index];
        }
        else {
            index = this._items.indexOf(target);
            var path = this._model.items[index].name + '/';
        }
        // Move all of the items.
        for (var _i = 0, _a = this._model.selected; _i < _a.length; _i++) {
            var index_1 = _a[_i];
            var original = this._model.items[index_1].name;
            var newPath = path + original;
            this._model.rename(original, newPath).catch(function (error) {
                if (error.message.indexOf('409') !== -1) {
                    var options = {
                        title: 'Overwrite file?',
                        host: _this.node,
                        body: "\"" + newPath + "\" already exists, overwrite?"
                    };
                    phosphor_dialog_1.showDialog(options).then(function (button) {
                        if (button.text === 'OK') {
                            return _this._model.delete(newPath).then(function () {
                                return _this._model.rename(original, newPath);
                            });
                        }
                    });
                }
            }).catch(function (error) {
                _this._showErrorMessage('Move Error', error.message);
            });
        }
    };
    /**
     * Start a drag event.
     */
    FileBrowser.prototype._startDrag = function (index, clientX, clientY) {
        var _this = this;
        // Make sure the source node is selected.
        var source = this._items[index];
        if (!source.classList.contains(SELECTED_CLASS)) {
            source.classList.add(SELECTED_CLASS);
            this._updateSelected();
        }
        // Create the drag image.
        var dragImage = source.cloneNode(true);
        dragImage.removeChild(dragImage.lastChild);
        if (this._model.selected.length > 1) {
            var text = dragImage.getElementsByClassName(ROW_TEXT_CLASS)[0];
            text.textContent = '(' + this._model.selected.length + ')';
        }
        // Set up the drag event.
        this._drag = new phosphor_dragdrop_1.Drag({
            dragImage: dragImage,
            mimeData: new phosphor_dragdrop_1.MimeData(),
            supportedActions: phosphor_dragdrop_1.DropActions.Move,
            proposedAction: phosphor_dragdrop_1.DropAction.Move
        });
        this._drag.mimeData.setData(CONTENTS_MIME, null);
        // Start the drag and remove the mousemove listener.
        this._drag.start(clientX, clientY).then(function (action) {
            console.log('action', action);
            _this._drag = null;
        });
        document.removeEventListener('mousemove', this, true);
    };
    /**
     * Find the appropriate target for a mouse event.
     */
    FileBrowser.prototype._findTarget = function (event) {
        var index = hitTestNodes(this._items, event.clientX, event.clientY);
        if (index !== -1)
            return this._items[index];
        index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
        if (index !== -1)
            return this._crumbs[index];
        return null;
    };
    /**
     * Handle a click on a file node.
     */
    FileBrowser.prototype._handleFileClick = function (event, target) {
        var _this = this;
        // Fetch common variables.
        var items = this._model.items;
        var nodes = this._items;
        // Handle toggling.
        if (event.metaKey || event.ctrlKey) {
            if (target.classList.contains(SELECTED_CLASS)) {
                target.classList.remove(SELECTED_CLASS);
            }
            else {
                target.classList.add(SELECTED_CLASS);
            }
        }
        else if (event.shiftKey) {
            handleMultiSelect(nodes, nodes.indexOf(target));
        }
        else {
            // Handle a rename.
            if (this._model.selected.length === 1 &&
                target.classList.contains(SELECTED_CLASS)) {
                if (this._pendingSelect) {
                    setTimeout(function () {
                        if (_this._pendingSelect) {
                            _this._doRename(target);
                        }
                        else {
                            _this._pendingSelect = true;
                        }
                    }, RENAME_DURATION);
                    return;
                }
            }
            else {
                this._pendingSelect = true;
            }
            // Add the selected class to current row, and remove from all others.
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                node.classList.remove(SELECTED_CLASS);
            }
            target.classList.add(SELECTED_CLASS);
        }
        this._updateSelected();
    };
    /**
     * Update the selected indices of the model.
     */
    FileBrowser.prototype._updateSelected = function () {
        // Set the selected items on the model.
        var selected = [];
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].classList.contains(SELECTED_CLASS)) {
                selected.push(i);
            }
        }
        this._model.selected = selected;
    };
    /**
     * Handle a file upload event.
     */
    FileBrowser.prototype._handleUploadEvent = function (event) {
        var _this = this;
        for (var _i = 0, _a = event.target.files; _i < _a.length; _i++) {
            var file = _a[_i];
            this._model.upload(file).catch(function (error) {
                if (error.message.indexOf('409') !== -1) {
                    var options = {
                        title: 'Overwrite file?',
                        host: _this.node,
                        body: "\"" + file.name + "\" already exists, overwrite?"
                    };
                    phosphor_dialog_1.showDialog(options).then(function (button) {
                        if (button.text === 'OK') {
                            return _this._model.delete(file.name).then(function () {
                                return _this._model.upload(file);
                            });
                        }
                    });
                }
            }).catch(function (error) {
                _this._showErrorMessage('Upload Error', error.message);
            });
        }
    };
    /**
     * Allow the user to rename item on a given row.
     */
    FileBrowser.prototype._doRename = function (row) {
        var _this = this;
        var text = row.getElementsByClassName(ROW_TEXT_CLASS)[0];
        var original = text.textContent;
        doRename(row, text, this._editNode).then(function (changed) {
            if (!changed) {
                return;
            }
            var newPath = text.textContent;
            _this._model.rename(original, newPath).catch(function (error) {
                if (error.message.indexOf('409') !== -1) {
                    var options = {
                        title: 'Overwrite file?',
                        host: _this.node,
                        body: "\"" + newPath + "\" already exists, overwrite?"
                    };
                    phosphor_dialog_1.showDialog(options).then(function (button) {
                        if (button.text === 'OK') {
                            return _this._model.delete(newPath).then(function () {
                                return _this._model.rename(original, newPath);
                            });
                        }
                        else {
                            text.textContent = original;
                        }
                    });
                }
            }).catch(function (error) {
                _this._showErrorMessage('Rename Error', error.message);
            });
        });
    };
    FileBrowser.prototype._showErrorMessage = function (title, message) {
        var options = {
            title: title,
            host: this.node,
            body: message,
            buttons: [phosphor_dialog_1.okButton]
        };
        phosphor_dialog_1.showDialog(options);
    };
    /**
     * Handle a `changed` signal from the model.
     */
    FileBrowser.prototype._onChanged = function (model, change) {
        if (change.name === 'open' && change.newValue.type === 'directory') {
            this.update();
        }
    };
    return FileBrowser;
})(phosphor_widget_1.Widget);
exports.FileBrowser = FileBrowser;
/**
 * Breadcrumb item list enum.
 */
var Crumb;
(function (Crumb) {
    Crumb[Crumb["Home"] = 0] = "Home";
    Crumb[Crumb["Ellipsis"] = 1] = "Ellipsis";
    Crumb[Crumb["Parent"] = 2] = "Parent";
    Crumb[Crumb["Current"] = 3] = "Current";
})(Crumb || (Crumb = {}));
/**
 * Button item list enum.
 */
var Button;
(function (Button) {
    Button[Button["New"] = 0] = "New";
    Button[Button["Upload"] = 1] = "Upload";
    Button[Button["Refresh"] = 2] = "Refresh";
})(Button || (Button = {}));
/**
 * Create an uninitialized DOM node for an IContentsModel.
 */
function createItemNode() {
    var node = document.createElement('li');
    node.className = ROW_CLASS;
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
}
/**
 * Create the icon node class name for an IContentsModel.
 */
function createIconClass(item) {
    if (item.type === 'directory') {
        return ROW_ICON_CLASS + ' ' + FOLDER_ICON_CLASS;
    }
    else {
        return ROW_ICON_CLASS + ' ' + FILE_ICON_CLASS;
    }
}
/**
 * Create the text node content for an IContentsModel.
 */
function createTextContent(item) {
    return item.name;
}
/**
 * Create the last modified node content for an IContentsModel.
 */
function createModifiedContent(item) {
    if (item.last_modified) {
        return moment(item.last_modified).fromNow();
    }
    else {
        return '';
    }
}
/**
 * Update the node state for an IContentsModel.
 */
function updateItemNode(item, node) {
    var icon = node.firstChild;
    var text = node.children[1];
    var modified = node.lastChild;
    icon.className = createIconClass(item);
    if (text.textContent !== item.name) {
        node.classList.remove(SELECTED_CLASS);
    }
    text.textContent = createTextContent(item);
    modified.textContent = createModifiedContent(item);
}
/**
 * Populate the breadcrumb node.
 */
function updateCrumbs(breadcrumbs, separators, path) {
    var node = breadcrumbs[0].parentNode;
    // Remove all but the home node.
    while (node.firstChild.nextSibling) {
        node.removeChild(node.firstChild.nextSibling);
    }
    var parts = path.split('/');
    if (parts.length > 2) {
        parts = [parts[parts.length - 2], parts[parts.length - 1]];
        node.appendChild(separators[0]);
        node.appendChild(breadcrumbs[Crumb.Ellipsis]);
    }
    if (path) {
        if (parts.length === 2) {
            node.appendChild(separators[1]);
            breadcrumbs[Crumb.Parent].textContent = parts[0];
            node.appendChild(breadcrumbs[Crumb.Parent]);
        }
        node.appendChild(separators[2]);
        breadcrumbs[Crumb.Current].textContent = parts[parts.length - 1];
        node.appendChild(breadcrumbs[Crumb.Current]);
    }
}
/**
 * Create the breadcrumb nodes.
 */
function createCrumbs() {
    var home = document.createElement('i');
    home.className = 'fa fa-home ' + BREADCRUMB_ITEM_CLASS;
    var ellipsis = document.createElement('i');
    ellipsis.className = 'fa fa-ellipsis-h ' + BREADCRUMB_ITEM_CLASS;
    var parent = document.createElement('span');
    parent.className = BREADCRUMB_ITEM_CLASS;
    var current = document.createElement('span');
    current.className = BREADCRUMB_ITEM_CLASS;
    return [home, ellipsis, parent, current];
}
/**
 * Create the breadcrumb separator nodes.
 */
function createCrumbSeparators() {
    var items = [];
    for (var i = 0; i < 3; i++) {
        var item = document.createElement('i');
        item.className = 'fa fa-angle-right ' + BREADCRUMB_ITEM_CLASS;
        items.push(item);
    }
    return items;
}
/**
 * Create the button nodes.
 */
function createButtons(buttonBar) {
    var buttons = [];
    var icons = ['fa-plus', 'fa-upload', 'fa-refresh'];
    var titles = ['Create New...', 'Upload File(s)', 'Refresh File List'];
    for (var i = 0; i < 3; i++) {
        var button = document.createElement('button');
        button.className = BUTTON_ITEM_CLASS;
        button.title = titles[i];
        var icon = document.createElement('span');
        icon.className = BUTTON_ICON_CLASS + ' fa ' + icons[i];
        button.appendChild(icon);
        buttonBar.appendChild(button);
        buttons.push(button);
    }
    // Add the dropdown node to the "new file" button.
    var dropIcon = document.createElement('span');
    dropIcon.className = 'fa fa-caret-down';
    dropIcon.style.marginLeft = '-0.5em';
    buttons[Button.New].appendChild(dropIcon);
    // Create the hidden upload input field.
    var file = document.createElement('input');
    file.style.height = "100%";
    file.style.zIndex = "10000";
    file.setAttribute("type", "file");
    file.setAttribute("multiple", "multiple");
    buttons[Button.Upload].classList.add(UPLOAD_CLASS);
    buttons[Button.Upload].appendChild(file);
    return buttons;
}
/**
 * Create the "new" menu.
 */
function createNewItemMenu(command) {
    return new phosphor_menus_1.Menu([
        new phosphor_menus_1.MenuItem({
            text: 'Notebook',
            command: command,
            commandArgs: 'notebook'
        }),
        new phosphor_menus_1.MenuItem({
            text: 'Text File',
            command: command,
            commandArgs: 'file'
        }),
        new phosphor_menus_1.MenuItem({
            text: 'Directory',
            command: command,
            commandArgs: 'directory'
        })
    ]);
}
/**
 * Handle editing text on a node.
 *
 * @returns Boolean indicating whether the name changed.
 */
function doRename(parent, text, edit) {
    var changed = true;
    parent.replaceChild(edit, text);
    edit.value = text.textContent;
    edit.focus();
    var index = edit.value.indexOf('.');
    if (index === -1) {
        edit.setSelectionRange(0, edit.value.length);
    }
    else {
        edit.setSelectionRange(0, index);
    }
    return new Promise(function (resolve, reject) {
        edit.onblur = function () {
            parent.replaceChild(text, edit);
            if (text.textContent === edit.value) {
                changed = false;
            }
            if (changed)
                text.textContent = edit.value;
            resolve(changed);
        };
        edit.onkeydown = function (event) {
            switch (event.keyCode) {
                case 13:
                    event.stopPropagation();
                    event.preventDefault();
                    edit.blur();
                    break;
                case 27:
                    event.stopPropagation();
                    event.preventDefault();
                    changed = false;
                    edit.blur();
                    break;
            }
        };
    });
}
/**
 * Handle a multiple select on a file item node.
 */
function handleMultiSelect(nodes, index) {
    // Find the "nearest selected".
    var nearestIndex = -1;
    for (var i = 0; i < nodes.length; i++) {
        if (i === index) {
            continue;
        }
        if (nodes[i].classList.contains(SELECTED_CLASS)) {
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
    for (var i = 0; i < nodes.length; i++) {
        if (nearestIndex >= i && index <= i ||
            nearestIndex <= i && index >= i) {
            nodes[i].classList.add(SELECTED_CLASS);
        }
    }
}
/**
 * Get the index of the node at a client position, or `-1`.
 */
function hitTestNodes(nodes, x, y) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (phosphor_domutil_1.hitTest(nodes[i], x, y))
            return i;
    }
    return -1;
}
