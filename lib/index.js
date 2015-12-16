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
var DRAG_THRESHOLD = 5;
var CONTENTS_MIME = 'application/x-juptyer-icontents';
/**
 * An implementation of a file browser view model.
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
         */
        get: function () {
            return this._model.path;
        },
        /**
         * Set the current path, triggering a refresh.
         */
        set: function (value) {
            this._model.path = value;
            this.refresh();
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
     * Open the current selected items.
     *
     * #### Notes
     * Emits an [[opened]] signal for each item
     * after loading the contents.
     */
    FileBrowserViewModel.prototype.open = function () {
        var _this = this;
        var items = this._model.content;
        for (var _i = 0, _a = this._selectedIndices; _i < _a.length; _i++) {
            var index = _a[_i];
            var item = items[index];
            if (item.type === 'directory') {
                this.path = item.path;
                continue;
            }
            else {
                this._contents.get(item.path, { type: item.type }).then(function (contents) {
                    _this.changed.emit({
                        name: 'open',
                        newValue: contents,
                        oldValue: null,
                    });
                });
            }
        }
    };
    /**
     * Create a new untitled file or directory in the current directory.
     */
    FileBrowserViewModel.prototype.newUntitled = function (type) {
        var _this = this;
        var ext = type === 'file' ? '.ext' : '';
        return this._contents.newUntitled(this._model.path, { type: type, ext: ext }).then(function (contents) {
            _this.refresh();
            return contents;
        });
    };
    /**
     * Rename a file or directory.
     */
    FileBrowserViewModel.prototype.rename = function (path, newPath, overwrite) {
        var _this = this;
        // Check for existing file.
        for (var _i = 0, _a = this._model.content; _i < _a.length; _i++) {
            var model = _a[_i];
            if (model.name === newPath && !overwrite) {
                return Promise.reject(new Error("\"" + newPath + "\" already exists"));
            }
            else if (model.name == path) {
                var current = model;
            }
        }
        // Add the directory if applicable.
        if (this._model.path) {
            path = this._model.path + '/' + path;
            newPath = this._model.path + '/' + newPath;
        }
        // Rename, refresh, and emit a change event.
        return this._contents.rename(path, newPath).then(function (contents) {
            _this.refresh();
            _this.changed.emit({
                name: 'rename',
                oldValue: current,
                newValue: contents
            });
            return contents;
        });
    };
    /**
     * Upload a file object.
     */
    FileBrowserViewModel.prototype.upload = function (file, overwrite) {
        var _this = this;
        // Skip large files with a warning.
        if (file.size > this._max_upload_size_mb * 1024 * 1024) {
            var msg = "Cannot upload file (>" + this._max_upload_size_mb + " MB) ";
            msg += "\"" + file.name + "\"";
            console.warn(msg);
            return Promise.reject(new Error(msg));
        }
        // Check for existing file.
        for (var _i = 0, _a = this._model.content; _i < _a.length; _i++) {
            var model = _a[_i];
            if (model.name === file.name && !overwrite) {
                return Promise.reject(new Error("\"" + file.name + "\" already exists"));
            }
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
                var content = '';
                if (isNotebook) {
                    content = JSON.parse(reader.result);
                }
                else {
                    // Base64-encode binary file data.
                    var bytes = '';
                    var buf = new Uint8Array(reader.result);
                    var nbytes = buf.byteLength;
                    for (var i = 0; i < nbytes; i++) {
                        bytes += String.fromCharCode(buf[i]);
                    }
                    content = btoa(bytes);
                }
                var model = {
                    type: type,
                    format: format,
                    name: name,
                    content: content
                };
                return _this._contents.save(path, model).then(function (model) {
                    _this.refresh();
                    return model;
                });
            };
            reader.onerror = function (evt) {
                throw Error('Failed to upload `${file.name}`');
            };
        });
    };
    /**
     * Refresh the model contents.
     */
    FileBrowserViewModel.prototype.refresh = function () {
        var _this = this;
        this._contents.listContents(this._model.path).then(function (model) {
            var old = _this._model;
            _this._model = model;
            _this.changed.emit({
                name: 'refresh',
                oldValue: old,
                newValue: model.content
            });
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
        var input = this._buttons[Button.Upload].lastChild;
        input.onchange = this._handleUploadEvent.bind(this);
        // Create the "new" menu.
        var command = new phosphor_command_1.DelegateCommand(function (args) {
            _this._handleNewCommand(args);
        });
        this._newMenu = createMenu(command);
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
        var buttonBar = document.createElement('ul');
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
        this._model.refresh();
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
        // Handle a button selection.
        var index = hitTestNodes(this._buttons, event.clientX, event.clientY);
        if (index !== -1) {
            this._buttons[index].classList.add(SELECTED_CLASS);
            if (index === Button.Refresh) {
                this._model.refresh();
            }
            else if (index === Button.New) {
                var rect = this._buttons[index].getBoundingClientRect();
                this._newMenu.popup(rect.left, rect.bottom, false, true);
            }
            return;
        }
        // Handle an item selection.
        index = hitTestNodes(this._items, event.clientX, event.clientY);
        if (index !== -1) {
            this._dragData = { pressX: event.clientX, pressY: event.clientY };
            document.addEventListener('mouseup', this, true);
            document.addEventListener('mousemove', this, true);
        }
    };
    /**
     * Handle the `'mouseup'` event for the file browser.
     */
    FileBrowser.prototype._evtMouseup = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        for (var _i = 0, _a = this._buttons; _i < _a.length; _i++) {
            var node = _a[_i];
            node.classList.remove(SELECTED_CLASS);
        }
        document.removeEventListener('mousemove', this, true);
    };
    /**
     * Handle the `'mousemove'` event for the file browser.
     */
    FileBrowser.prototype._evtMousemove = function (event) {
        var _this = this;
        event.preventDefault();
        event.stopPropagation();
        if (this._drag) {
            return;
        }
        var data = this._dragData;
        var dx = Math.abs(event.clientX - data.pressX);
        var dy = Math.abs(event.clientY - data.pressY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            return;
        }
        var rect = this.node.getBoundingClientRect();
        this._drag = new phosphor_dragdrop_1.Drag({
            mimeData: new phosphor_dragdrop_1.MimeData(),
            supportedActions: phosphor_dragdrop_1.DropActions.Move,
            proposedAction: phosphor_dragdrop_1.DropAction.Move
        });
        this._drag.mimeData.setData(CONTENTS_MIME, null);
        var clientX = event.clientX, clientY = event.clientY;
        document.removeEventListener('mousemove', this, true);
        this._drag.start(clientX, clientY).then(function (action) {
            console.log('action', action);
            _this._drag = null;
        });
    };
    /**
     * Handle the `'click'` event for the file browser.
     */
    FileBrowser.prototype._evtClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        // Handle the edit node.
        if (this._editNode.parentNode) {
            if (!this._editNode.contains(event.target)) {
                this._editNode.focus();
                this._editNode.blur();
            }
            else {
                return;
            }
        }
        // Check for a breadcrumb hit.
        var index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
        if (index !== -1) {
            // If the home node was clicked, set the path to root.
            if (index == Crumb.Home) {
                this._model.path = '';
                return;
            }
            // Grab the portion of the path based on which node was clicked.
            var splice = 3 - index;
            var path = this._model.path.split('/');
            path = path.splice(0, path.length - splice);
            this._model.path = path.join('/');
            return;
        }
        // Check for a file item hit.
        index = hitTestNodes(this._items, event.clientX, event.clientY);
        if (index !== -1) {
            this._handleFileClick(event, index);
            ;
        }
        else {
            // Remove the pending select flag.
            this._pendingSelect = false;
        }
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
        // Find the target file item.
        var index = hitTestNodes(this._items, event.clientX, event.clientY);
        if (index === -1) {
            return;
        }
        // Remove the pending select flag.
        this._pendingSelect = false;
        // Open the selected item.
        this._model.open();
    };
    /**
     * Handle the `'p-dragenter'` event for the dock panel.
     */
    FileBrowser.prototype._evtDragEnter = function (event) {
        if (event.mimeData.hasData(CONTENTS_MIME)) {
            var index = hitTestNodes(this._items, event.clientX, event.clientY);
            if (index === -1) {
                index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
            }
            if (index !== -1) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    };
    /**
     * Handle the `'p-dragleave'` event for the dock panel.
     */
    FileBrowser.prototype._evtDragLeave = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var related = event.relatedTarget;
        if (!related || !this.node.contains(related)) {
            console.log('Drag left');
        }
    };
    /**
     * Handle the `'p-dragover'` event for the dock panel.
     */
    FileBrowser.prototype._evtDragOver = function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
    };
    /**
     * Handle the `'p-drop'` event for the dock panel.
     */
    FileBrowser.prototype._evtDrop = function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.proposedAction === phosphor_dragdrop_1.DropAction.None) {
            event.dropAction = phosphor_dragdrop_1.DropAction.None;
            return;
        }
        var contents = event.mimeData.getData(CONTENTS_MIME);
        console.log('Got contents', contents);
        event.dropAction = event.proposedAction;
    };
    /**
     * Handle a click on a file node.
     */
    FileBrowser.prototype._handleFileClick = function (event, index) {
        var _this = this;
        // Fetch common variables.
        var items = this._model.items;
        var nodes = this._items;
        var current = nodes[index];
        // Handle toggling.
        if (event.metaKey || event.ctrlKey) {
            if (current.classList.contains(SELECTED_CLASS)) {
                current.classList.remove(SELECTED_CLASS);
            }
            else {
                current.classList.add(SELECTED_CLASS);
            }
        }
        else if (event.shiftKey) {
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
        else {
            // Handle a rename.
            if (this._model.selected.length === 1 &&
                current.classList.contains(SELECTED_CLASS)) {
                if (this._pendingSelect) {
                    setTimeout(function () {
                        if (_this._pendingSelect) {
                            _this._doRename(current);
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
            current.classList.add(SELECTED_CLASS);
        }
        // Set the selected items on the model.
        var selected = [];
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].classList.contains(SELECTED_CLASS)) {
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
                if (error.message.indexOf('already exists') !== -1) {
                    var options = {
                        title: 'Overwrite file?',
                        host: _this.node,
                        body: error.message + ', overwrite?'
                    };
                    phosphor_dialog_1.showDialog(options).then(function (button) {
                        if (button.text === 'OK') {
                            _this._model.upload(file, true);
                        }
                    });
                }
                else {
                    _this._showErrorMessage('Upload Error', error.message);
                }
            });
        }
    };
    /**
     * Handle a "new" command execution.
     */
    FileBrowser.prototype._handleNewCommand = function (type) {
        this._model.newUntitled(type);
    };
    /**
     * Allow the user to rename item on a given row.
     */
    FileBrowser.prototype._doRename = function (row) {
        var _this = this;
        var text = row.getElementsByClassName(ROW_TEXT_CLASS)[0];
        var content = text.textContent;
        doRename(row, text, this._editNode).then(function (changed) {
            if (!changed) {
                return;
            }
            _this._model.rename(content, _this._editNode.value).catch(function (error) {
                if (error.message.indexOf('already exists') !== -1) {
                    var options = {
                        title: 'Overwrite file?',
                        host: _this.node,
                        body: error.message + ', overwrite?'
                    };
                    phosphor_dialog_1.showDialog(options).then(function (button) {
                        if (button.text === 'OK') {
                            _this._model.rename(content, _this._editNode.value, true);
                        }
                        else {
                            text.textContent = content;
                        }
                    });
                }
                else {
                    _this._showErrorMessage('Rename Error', error.message);
                }
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
        if (change.name === 'refresh') {
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
    Crumb[Crumb["First"] = 2] = "First";
    Crumb[Crumb["Second"] = 3] = "Second";
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
    node.className = ROW_CLASS;
    icon.className = createIconClass(item);
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
        node.appendChild(separators[1]);
        breadcrumbs[Crumb.First].textContent = parts[0];
        node.appendChild(breadcrumbs[Crumb.First]);
        if (parts.length === 2) {
            node.appendChild(separators[2]);
            breadcrumbs[Crumb.Second].textContent = parts[1];
            node.appendChild(breadcrumbs[Crumb.Second]);
        }
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
    var first = document.createElement('span');
    first.className = BREADCRUMB_ITEM_CLASS;
    var second = document.createElement('span');
    second.className = BREADCRUMB_ITEM_CLASS;
    return [home, ellipsis, first, second];
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
    for (var i = 0; i < 3; i++) {
        var button = document.createElement('li');
        button.className = BUTTON_ITEM_CLASS + ' fa';
        buttonBar.appendChild(button);
        buttons.push(button);
    }
    buttons[Button.New].classList.add('fa-plus');
    buttons[Button.New].title = 'Create New...';
    buttons[Button.Refresh].classList.add('fa-refresh');
    buttons[Button.Refresh].title = 'Refresh File List';
    // Create the upload button with a hidden input.
    var text = document.createElement('span');
    text.classList.add('fa-upload');
    var file = document.createElement('input');
    file.setAttribute("type", "file");
    file.setAttribute("multiple", "multiple");
    buttons[Button.Upload].classList.add(UPLOAD_CLASS);
    buttons[Button.Upload].appendChild(text);
    buttons[Button.Upload].appendChild(file);
    buttons[Button.Upload].title = 'Upload File(s)';
    return buttons;
}
/**
 * Create the "new" menu.
 */
function createMenu(command) {
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
 * Get the index of the node at a client position, or `-1`.
 */
function hitTestNodes(nodes, x, y) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (phosphor_domutil_1.hitTest(nodes[i], x, y))
            return i;
    }
    return -1;
}
