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
 * The class name added to the button nodes.
 */
var BUTTON_SELECTED_CLASS = 'jp-FileBrowser-button-';
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
    function FileBrowserViewModel(path, contents) {
        this._selectedIndices = [];
        this._contents = null;
        this._items = [];
        this._path = '';
        this._path = path;
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
    Object.defineProperty(FileBrowserViewModel.prototype, "path", {
        /**
         * Get the current path.
         */
        get: function () {
            return this._path;
        },
        /**
         * Set the current path, triggering a refresh.
         */
        set: function (value) {
            this._path = value;
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
            return this._items.slice();
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
        var items = this._items;
        for (var _i = 0, _a = this._selectedIndices; _i < _a.length; _i++) {
            var index = _a[_i];
            var item = items[index];
            if (item.type === 'directory') {
                this.path = item.path;
                continue;
            }
            else {
                this._contents.get(item.path, { type: item.type }).then(function (contents) {
                    _this.opened.emit(contents);
                });
            }
        }
    };
    /**
     * Refresh the model contents.
     */
    FileBrowserViewModel.prototype.refresh = function () {
        var _this = this;
        this._contents.listContents(this._path).then(function (model) {
            _this._items = model.content;
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
        _super.call(this);
        this._model = null;
        this._items = [];
        this._crumbs = [];
        this._crumbSeps = [];
        this._buttons = [];
        this.addClass(FILE_BROWSER_CLASS);
        this._model = model;
        this._model.opened.connect(this._onOpened.bind(this));
        // Create the crumb nodes add add to crumb node.
        this._crumbs = createCrumbs();
        this._crumbSeps = createCrumbSeparators();
        var crumbs = this.node.getElementsByClassName(BREADCRUMB_CLASS)[0];
        crumbs.appendChild(this._crumbs[Crumb.Home]);
        // Create the button nodes and add to button node.
        var buttons = this.node.getElementsByClassName(BUTTON_CLASS)[0];
        this._buttons = createButtons(buttons);
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
        node.addEventListener('mousedown', this);
        node.addEventListener('mouseup', this);
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
        node.removeEventListener('mousedown', this);
        node.removeEventListener('mouseup', this);
        node.removeEventListener('click', this);
        node.removeEventListener('dblclick', this);
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
        var index = hitTestNodes(this._buttons, event.clientX, event.clientY);
        if (index !== -1) {
            this._buttons[index].classList.add(SELECTED_CLASS);
            if (index === Button.Refresh) {
                this._model.refresh();
            }
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
    };
    /**
     * Handle the `'click'` event for the file browser.
     */
    FileBrowser.prototype._evtClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Check for a breadcrumb hit.
        var index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
        if (index !== -1) {
            // Stop the event propagation.
            event.preventDefault();
            event.stopPropagation();
            // If the home node was clicked, set the path to root.
            if (index == Crumb.Home) {
                this._model.path = '';
                return;
            }
            // Grab the portion of the path based on which node was clicked.
            var splice = 4 - index;
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
    };
    /**
     * Handle the `'dblclick'` event for the file browser.
     */
    FileBrowser.prototype._evtDblClick = function (event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Find the target file item.
        var index = hitTestNodes(this._items, event.clientX, event.clientY);
        if (index === -1) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        // Open the selected item.
        this._model.open();
    };
    /**
     * Handle a click on a file node.
     */
    FileBrowser.prototype._handleFileClick = function (event, index) {
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
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
            for (var i_1 = 0; i_1 < nodes.length; i_1++) {
                if (nearestIndex >= i_1 && index <= i_1 ||
                    nearestIndex <= i_1 && index >= i_1) {
                    nodes[i_1].classList.add(SELECTED_CLASS);
                }
            }
        }
        else {
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                node.classList.remove(SELECTED_CLASS);
            }
            current.classList.add(SELECTED_CLASS);
        }
        // Set the selected items on the model.
        var selected = [];
        for (var i_2 = 0; i_2 < nodes.length; i_2++) {
            if (nodes[i_2].classList.contains(SELECTED_CLASS)) {
                selected.push(i_2);
            }
        }
        this._model.selected = selected;
    };
    /**
     * Handle an `opened` signal from the model.
     */
    FileBrowser.prototype._onOpened = function (model, contents) {
        if (contents.type === 'directory') {
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
    Button[Button["Add"] = 0] = "Add";
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
    buttons[Button.Add].classList.add('fa-plus');
    buttons[Button.Upload].classList.add('fa-upload');
    buttons[Button.Refresh].classList.add('fa-refresh');
    return buttons;
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
