(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var css = "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n.jp-FileBrowser-row {\n  margin-left: 0px;\n  margin-right: 0px;\n}\n.jp-item-icon {\n  font-size: 14px;\n  color: #5e5e5e;\n  margin-right: 7px;\n  margin-left: 7px;\n  line-height: 22px;\n  vertical-align: baseline;\n}\n.jp-item-link {\n  margin-left: -1px;\n  vertical-align: baseline;\n  line-height: 22px;\n}\n.jp-folder-icon:before {\n  display: inline-block;\n  font: normal normal normal 14px/1 FontAwesome;\n  font-size: inherit;\n  text-rendering: auto;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  content: \"\\f114\";\n}\n.jp-folder-icon:before.pull-left {\n  margin-right: .3em;\n}\n.jp-folder-icon:before.pull-right {\n  margin-left: .3em;\n}\n.col-md-12 {\n  position: relative;\n  min-height: 1px;\n  padding-left: 0px;\n  padding-right: 0px;\n  width: 100%;\n  float: left;\n}\n.jp-FileBrowser-row:before,\n.jp-FileBroswer-row:after {\n  content: \" \";\n  display: table;\n}\n.jp-FileBrowser-row:after {\n  clear: both;\n}\n"; (require("browserify-css").createStyle(css, { "href": "example/index.css"})); module.exports = css;
},{"browserify-css":4}],2:[function(require,module,exports){
var css = "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n.jp-FileBrowser-item {\n  color: #2F2F2F;\n  display: inline-block;\n  font: 14px Helvetica, Arial, sans-serif;\n}\n.jp-FileBrowser-list-item > div {\n  white-space: nowrap;\n}\n.jp-FileBrowser {\n  min-width: 200px;\n}\n.jp-FileBrowser-files-inner {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 2px;\n  bottom: 2px;\n  padding: 5px;\n  display: flex;\n  flex-direction: column;\n  background-color: white;\n  border: 1px solid #C0C0C0;\n  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);\n}\n.jp-FileBrowser-files-header {\n  flex-grow: 0;\n  margin-bottom: 5px;\n}\n.jp-FileBrowser-list-container {\n  flex-grow: 1;\n  overflow: auto;\n  margin: 0;\n  border-radius: 0;\n}\n"; (require("browserify-css").createStyle(css, { "href": "lib/index.css"})); module.exports = css;
},{"browserify-css":4}],3:[function(require,module,exports){
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
        document.addEventListener('mousedown', this, true);
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
                if (msg.content[i].length) {
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
        if (!this.node.contains(el)) {
            return;
        }
        if (this.node.firstChild.firstChild.contains(el)) {
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

},{"./index.css":2,"jupyter-js-services":8,"phosphor-widget":23}],4:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }
        
        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            head.appendChild(style);
        } else if (style.styleSheet) { // for IE8 and below
            head.appendChild(style);
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            head.appendChild(style);
        }
    }
};

},{}],5:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var utils = require('./utils');
/**
 * The url for the config service.
 */
var SERVICE_CONFIG_URL = 'api/config';
/**
 * Create a config section.
 *
 * @returns A Promise that is fulfilled with the config section is loaded.
 */
function getConfigSection(sectionName, baseUrl, ajaxOptions) {
    var section = new ConfigSection(sectionName, baseUrl);
    return section.load(ajaxOptions);
}
exports.getConfigSection = getConfigSection;
/**
 * Implementation of the Configurable data section.
 */
var ConfigSection = (function () {
    /**
     * Create a config section.
     */
    function ConfigSection(sectionName, baseUrl) {
        this._url = "unknown";
        this._data = {};
        this._url = utils.urlPathJoin(baseUrl, SERVICE_CONFIG_URL, utils.urlJoinEncode(sectionName));
    }
    Object.defineProperty(ConfigSection.prototype, "data", {
        /**
         * Get the data for this section.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._data;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Load the initial data for this section.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/config).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    ConfigSection.prototype.load = function (ajaxOptions) {
        var _this = this;
        return utils.ajaxRequest(this._url, {
            method: "GET",
            dataType: "json",
        }, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 200) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            _this._data = success.data;
            return _this;
        });
    };
    /**
     * Modify the stored config values.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/config).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     *
     * Updates the local data immediately, sends the change to the server,
     * and updates the local data with the response, and fullfils the promise
     * with that data.
     */
    ConfigSection.prototype.update = function (newdata, ajaxOptions) {
        var _this = this;
        this._data = utils.extend(this._data, newdata);
        return utils.ajaxRequest(this._url, {
            method: "PATCH",
            data: JSON.stringify(newdata),
            dataType: "json",
            contentType: 'application/json',
        }, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 200) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            _this._data = success.data;
            return _this._data;
        });
    };
    return ConfigSection;
})();
/**
 * Configurable object with defaults.
 */
var ConfigWithDefaults = (function () {
    /**
     * Create a new config with defaults.
     */
    function ConfigWithDefaults(section, defaults, classname) {
        this._section = null;
        this._defaults = null;
        this._className = "unknown";
        this._section = section;
        this._defaults = defaults;
        this._className = classname;
    }
    /**
     * Get data from the config section or fall back to defaults.
     */
    ConfigWithDefaults.prototype.get = function (key) {
        return this._classData()[key] || this._defaults[key];
    };
    /**
     * Set a config value.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/config).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     *
     * Sends the update to the server, and changes our local copy of the data
     * immediately.
     */
    ConfigWithDefaults.prototype.set = function (key, value) {
        var d = {};
        d[key] = value;
        if (this._className) {
            var d2 = {};
            d2[this._className] = d;
            return this._section.update(d2);
        }
        else {
            return this._section.update(d);
        }
    };
    /**
     * Get data from the Section with our classname, if available.
     *
     * #### Notes
     * If we have no classname, get all of the data in the Section
     */
    ConfigWithDefaults.prototype._classData = function () {
        if (this._className) {
            return this._section.data[this._className] || {};
        }
        else {
            return this._section.data;
        }
    };
    return ConfigWithDefaults;
})();
exports.ConfigWithDefaults = ConfigWithDefaults;

},{"./utils":13}],6:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var utils = require('./utils');
var validate = require('./validate');
/**
 * The url for the contents service.
 */
var SERVICE_CONTENTS_URL = 'api/contents';
/**
 * A contents handle passing file operations to the back-end.
 *
 * This includes checkpointing with the normal file operations.
 */
var Contents = (function () {
    /**
     * Create a new contents object.
     */
    function Contents(baseUrl) {
        this._apiUrl = "unknown";
        this._apiUrl = utils.urlPathJoin(baseUrl, SERVICE_CONTENTS_URL);
    }
    /**
     * Get a file or directory.
     *
     * @param path: Path to the file or directory.
     * @param options: Use `options.content = true` to return file contents.
  
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.get = function (path, options, ajaxOptions) {
        var settings = {
            method: "GET",
            dataType: "json",
        };
        var url = this._getUrl(path);
        var params = {};
        if (options.type) {
            params.type = options.type;
        }
        if (options.format) {
            params.format = options.format;
        }
        if (options.content === false) {
            params.content = '0';
        }
        url = url + utils.jsonToQueryString(params);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 200) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            validate.validateContentsModel(success.data);
            return success.data;
        });
    };
    /**
     * Create a new untitled file or directory in the specified directory path.
     *
     * @param path: The directory in which to create the new file/directory.
     * @param options: Use `ext` and `type` options to choose the type of file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.newUntitled = function (path, options, ajaxOptions) {
        var settings = {
            method: "POST",
            dataType: "json",
        };
        if (options) {
            var data = JSON.stringify({
                ext: options.ext,
                type: options.type
            });
            settings.data = data;
            settings.contentType = 'application/json';
        }
        var url = this._getUrl(path);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 201) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            validate.validateContentsModel(success.data);
            return success.data;
        });
    };
    /**
     * Delete a file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.delete = function (path, ajaxOptions) {
        var settings = {
            method: "DELETE",
            dataType: "json",
        };
        var url = this._getUrl(path);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 204) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
        }, // Translate certain errors to more specific ones.
        function (error) {
            // TODO: update IPEP27 to specify errors more precisely, so
            // that error types can be detected here with certainty.
            if (error.xhr.status === 400) {
                throw new Error('Directory not found');
            }
            throw new Error(error.xhr.statusText);
        });
    };
    /**
     * Rename a file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.rename = function (path, newPath, ajaxOptions) {
        var data = { path: newPath };
        var settings = {
            method: "PATCH",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: 'application/json',
        };
        var url = this._getUrl(path);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 200) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            validate.validateContentsModel(success.data);
            return success.data;
        });
    };
    /**
     * Save a file.
     *
     * #### Notes
     * Ensure that `model.content` is populated for the file.
     *
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.save = function (path, model, ajaxOptions) {
        var settings = {
            method: "PUT",
            dataType: "json",
            data: JSON.stringify(model),
            contentType: 'application/json',
        };
        var url = this._getUrl(path);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            // will return 200 for an existing file and 201 for a new file
            if (success.xhr.status !== 200 && success.xhr.status !== 201) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            validate.validateContentsModel(success.data);
            return success.data;
        });
    };
    /**
     * Copy a file into a given directory.
     *
     * #### Notes
     * The server will select the name of the copied file.
     *
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.copy = function (fromFile, toDir, ajaxOptions) {
        var settings = {
            method: "POST",
            data: JSON.stringify({ copy_from: fromFile }),
            contentType: 'application/json',
            dataType: "json",
        };
        var url = this._getUrl(toDir);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 201) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            validate.validateContentsModel(success.data);
            return success.data;
        });
    };
    /**
     * List notebooks and directories at a given path.
     *
     * @param: path: The path to list notebooks in.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.listContents = function (path, ajaxOptions) {
        return this.get(path, { type: 'directory' }, ajaxOptions);
    };
    /**
     * Create a checkpoint for a file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.createCheckpoint = function (path, ajaxOptions) {
        var settings = {
            method: "POST",
            dataType: "json",
        };
        var url = this._getUrl(path, 'checkpoints');
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 201) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            validate.validateCheckpointModel(success.data);
            return success.data;
        });
    };
    /**
     * List available checkpoints for a file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.listCheckpoints = function (path, ajaxOptions) {
        var settings = {
            method: "GET",
            dataType: "json",
        };
        var url = this._getUrl(path, 'checkpoints');
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 200) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            if (!Array.isArray(success.data)) {
                throw Error('Invalid Checkpoint list');
            }
            for (var i = 0; i < success.data.length; i++) {
                validate.validateCheckpointModel(success.data[i]);
            }
            return success.data;
        });
    };
    /**
     * Restore a file to a known checkpoint state.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.restoreCheckpoint = function (path, checkpointID, ajaxOptions) {
        var settings = {
            method: "POST",
            dataType: "json",
        };
        var url = this._getUrl(path, 'checkpoints', checkpointID);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 204) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
        });
    };
    /**
     * Delete a checkpoint for a file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    Contents.prototype.deleteCheckpoint = function (path, checkpointID, ajaxOptions) {
        var settings = {
            method: "DELETE",
            dataType: "json",
        };
        var url = this._getUrl(path, 'checkpoints', checkpointID);
        return utils.ajaxRequest(url, settings, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 204) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
        });
    };
    /**
     * Get an REST url for this file given a path.
     */
    Contents.prototype._getUrl = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var url_parts = [].concat(Array.prototype.slice.apply(args));
        return utils.urlPathJoin(this._apiUrl, utils.urlJoinEncode.apply(null, url_parts));
    };
    return Contents;
})();
exports.Contents = Contents;

},{"./utils":13,"./validate":14}],7:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
/**
 * Enumeration of valid Kernel status states.
 */
(function (KernelStatus) {
    KernelStatus[KernelStatus["Unknown"] = 0] = "Unknown";
    KernelStatus[KernelStatus["Starting"] = 1] = "Starting";
    KernelStatus[KernelStatus["Reconnecting"] = 2] = "Reconnecting";
    KernelStatus[KernelStatus["Idle"] = 3] = "Idle";
    KernelStatus[KernelStatus["Busy"] = 4] = "Busy";
    KernelStatus[KernelStatus["Restarting"] = 5] = "Restarting";
    KernelStatus[KernelStatus["Dead"] = 6] = "Dead";
})(exports.KernelStatus || (exports.KernelStatus = {}));
var KernelStatus = exports.KernelStatus;

},{}],8:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
__export(require('./config'));
__export(require('./contents'));
__export(require('./ikernel'));
__export(require('./isession'));
__export(require('./kernel'));
__export(require('./session'));

},{"./config":5,"./contents":6,"./ikernel":7,"./isession":9,"./kernel":10,"./session":12}],9:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

},{}],10:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var phosphor_disposable_1 = require('phosphor-disposable');
var phosphor_signaling_1 = require('phosphor-signaling');
var ikernel_1 = require('./ikernel');
var serialize = require('./serialize');
var utils = require('./utils');
var validate = require('./validate');
/**
 * The url for the kernel service.
 */
var KERNEL_SERVICE_URL = 'api/kernels';
/**
 * The url for the kernelspec service.
 */
var KERNELSPEC_SERVICE_URL = 'api/kernelspecs';
/**
 * The error message to send when the kernel is not ready.
 */
var KERNEL_NOT_READY_MSG = 'Kernel is not ready to send a message';
/**
 * handle default logic for baseUrl
 */
function defaultBaseUrl(baseUrl) {
    if (baseUrl !== undefined) {
        return baseUrl;
    }
    if (typeof location === undefined) {
        return 'http://localhost:8888/';
    }
    else {
        return location.origin + '/';
    }
}
/**
 * Fetch the kernel specs.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernelspecs).
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
function getKernelSpecs(baseUrl, ajaxOptions) {
    baseUrl = defaultBaseUrl(baseUrl);
    var url = utils.urlPathJoin(baseUrl, KERNELSPEC_SERVICE_URL);
    return utils.ajaxRequest(url, {
        method: "GET",
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        var err = new Error('Invalid KernelSpecs Model');
        if (success.xhr.status !== 200) {
            throw new Error('Invalid Response: ' + success.xhr.status);
        }
        var data = success.data;
        if (!data.hasOwnProperty('default') ||
            typeof data.default !== 'string') {
            throw err;
        }
        if (!data.hasOwnProperty('kernelspecs')) {
            throw err;
        }
        if (!data.kernelspecs.hasOwnProperty(data.default)) {
            throw err;
        }
        var keys = Object.keys(data.kernelspecs);
        for (var i = 0; i < keys.length; i++) {
            var ks = data.kernelspecs[keys[i]];
            validate.validateKernelSpec(ks);
        }
        return data;
    });
}
exports.getKernelSpecs = getKernelSpecs;
/**
 * Fetch the running kernels.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
function listRunningKernels(baseUrl, ajaxOptions) {
    baseUrl = defaultBaseUrl(baseUrl);
    var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL);
    return utils.ajaxRequest(url, {
        method: "GET",
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 200) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
        if (!Array.isArray(success.data)) {
            throw Error('Invalid kernel list');
        }
        for (var i = 0; i < success.data.length; i++) {
            validate.validateKernelId(success.data[i]);
        }
        return success.data;
    }, onKernelError);
}
exports.listRunningKernels = listRunningKernels;
/**
 * Start a new kernel.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
 *
 * Wraps the result in an Kernel object. The promise is fulfilled
 * when the kernel is fully ready to send the first message. If
 * the kernel fails to become ready, the promise is rejected.
 */
function startNewKernel(options, ajaxOptions) {
    var url = utils.urlPathJoin(defaultBaseUrl(options.baseUrl), KERNEL_SERVICE_URL);
    return utils.ajaxRequest(url, {
        method: "POST",
        data: JSON.stringify({ name: options.name }),
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 201) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
        validate.validateKernelId(success.data);
        return createKernel(options, success.data.id);
    }, onKernelError);
}
exports.startNewKernel = startNewKernel;
/**
 * Connect to a running kernel.
 *
 * #### Notes
 * If the kernel was already started via `startNewKernel`, the existing
 * Kernel object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * kernel found by calling `listRunningKernels`.
 * The promise is fulfilled when the kernel is fully ready to send
 * the first message. If the kernel fails to become ready, the promise is
 * rejected.
 *
 * If the kernel was not already started and no `options` are given,
 * the promise is rejected.
 */
function connectToKernel(id, options, ajaxOptions) {
    var kernel = runningKernels.get(id);
    if (kernel) {
        return Promise.resolve(kernel);
    }
    if (options === void 0) {
        return Promise.reject(new Error('Please specify kernel options'));
    }
    return listRunningKernels(options.baseUrl, ajaxOptions).then(function (kernelIds) {
        if (!kernelIds.some(function (k) { return k.id === id; })) {
            throw new Error('No running kernel with id: ' + id);
        }
        return createKernel(options, id);
    });
}
exports.connectToKernel = connectToKernel;
/**
 * Create a well-formed Kernel Message.
 */
function createKernelMessage(options, content, metadata, buffers) {
    if (content === void 0) { content = {}; }
    if (metadata === void 0) { metadata = {}; }
    if (buffers === void 0) { buffers = []; }
    return {
        header: {
            username: options.username || '',
            version: '5.0',
            session: options.session,
            msg_id: options.msgId || utils.uuid(),
            msg_type: options.msgType
        },
        parent_header: {},
        channel: options.channel,
        content: content,
        metadata: metadata,
        buffers: buffers
    };
}
exports.createKernelMessage = createKernelMessage;
/**
 * Create a Promise for a Kernel object.
 *
 * #### Notes
 * Fulfilled when the Kernel is Starting, or rejected if Dead.
 */
function createKernel(options, id) {
    return new Promise(function (resolve, reject) {
        var kernel = new Kernel(options, id);
        var callback = function (sender, status) {
            if (status === ikernel_1.KernelStatus.Starting || status === ikernel_1.KernelStatus.Idle) {
                kernel.statusChanged.disconnect(callback);
                runningKernels.set(kernel.id, kernel);
                resolve(kernel);
            }
            else if (status === ikernel_1.KernelStatus.Dead) {
                kernel.statusChanged.disconnect(callback);
                reject(new Error('Kernel failed to start'));
            }
        };
        kernel.statusChanged.connect(callback);
    });
}
/**
 * Implementation of the Kernel object
 */
var Kernel = (function () {
    /**
     * Construct a kernel object.
     */
    function Kernel(options, id) {
        this._id = '';
        this._name = '';
        this._baseUrl = '';
        this._wsUrl = '';
        this._status = ikernel_1.KernelStatus.Unknown;
        this._clientId = '';
        this._ws = null;
        this._username = '';
        this._reconnectLimit = 7;
        this._reconnectAttempt = 0;
        this._isReady = false;
        this._futures = null;
        this._commPromises = null;
        this._comms = null;
        this._name = options.name;
        this._id = id;
        this._baseUrl = defaultBaseUrl(options.baseUrl);
        if (options.wsUrl) {
            this._wsUrl = options.wsUrl;
        }
        else {
            this._wsUrl = 'ws' + this._baseUrl.slice(4);
        }
        this._clientId = options.clientId || utils.uuid();
        this._username = options.username || '';
        this._futures = new Map();
        this._commPromises = new Map();
        this._comms = new Map();
        this._createSocket();
    }
    Object.defineProperty(Kernel.prototype, "statusChanged", {
        /**
         * A signal emitted when the kernel status changes.
         */
        get: function () {
            return Kernel.statusChangedSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "unhandledMessage", {
        /**
         * A signal emitted for unhandled kernel message.
         */
        get: function () {
            return Kernel.unhandledMessageSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "commOpened", {
        /**
         * A signal emitted for unhandled comm open message.
         */
        get: function () {
            return Kernel.commOpenedSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "id", {
        /**
         * The id of the server-side kernel.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "name", {
        /**
         * The name of the server-side kernel.
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
    Object.defineProperty(Kernel.prototype, "username", {
        /**
         * The client username.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._username;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "clientId", {
        /**
         * The client unique id.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._clientId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "status", {
        /**
         * The current status of the kernel.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._status;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kernel.prototype, "isDisposed", {
        /**
         * Test whether the kernel has been disposed.
         *
         * #### Notes
         * This is a read-only property which is always safe to access.
         */
        get: function () {
            return (this._futures !== null);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose of the resources held by the kernel.
     */
    Kernel.prototype.dispose = function () {
        this._futures.forEach(function (future, key) {
            future.dispose();
        });
        this._comms.forEach(function (comm, key) {
            comm.dispose();
        });
        this._futures = null;
        this._commPromises = null;
        this._comms = null;
        this._ws = null;
    };
    /**
     * Send a shell message to the kernel.
     *
     * #### Notes
     * Send a message to the kernel's shell channel, yielding a future object
     * for accepting replies.
     *
     * If `expectReply` is given and `true`, the future is disposed when both a
     * shell reply and an idle status message are received.   If `expectReply`
     * is not given or is `false`, the future is resolved when an idle status
     * message is received.
     * If `disposeOnDone` is not given or is `true`, the Future is disposed at this point.
     * If `disposeOnDone` is given and `false`, it is up to the caller to dispose of the Future.
     *
     * All replies are validated as valid kernel messages.
     *
     * If the kernel status is `Dead`, this will throw an error.
     */
    Kernel.prototype.sendShellMessage = function (msg, expectReply, disposeOnDone) {
        var _this = this;
        if (expectReply === void 0) { expectReply = false; }
        if (disposeOnDone === void 0) { disposeOnDone = true; }
        if (this._status === ikernel_1.KernelStatus.Dead) {
            throw Error(KERNEL_NOT_READY_MSG);
        }
        this._ws.send(serialize.serialize(msg));
        var future = new KernelFutureHandler(function () {
            _this._futures.delete(msg.header.msg_id);
        }, msg.header.msg_id, expectReply, disposeOnDone);
        this._futures.set(msg.header.msg_id, future);
        return future;
    };
    /**
     * Interrupt a kernel.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     *
     * It is assumed that the API call does not mutate the kernel id or name.
     *
     * The promise will be rejected if the kernel status is `Dead` or if the
     * request fails or the response is invalid.
     */
    Kernel.prototype.interrupt = function (ajaxOptions) {
        return interruptKernel(this, this._baseUrl, ajaxOptions);
    };
    /**
     * Restart a kernel.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels) and validates the response model.
     *
     * Any existing Future or Comm objects are cleared.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     *
     * It is assumed that the API call does not mutate the kernel id or name.
     *
     * The promise will be rejected if the request fails or the response is
     * invalid.
     */
    Kernel.prototype.restart = function (ajaxOptions) {
        // clear internal state
        this._futures.forEach(function (future, key) {
            future.dispose();
        });
        this._comms.forEach(function (comm, key) {
            comm.dispose();
        });
        this._updateStatus('restarting');
        this._futures = new Map();
        this._commPromises = new Map();
        this._comms = new Map();
        return restartKernel(this, this._baseUrl, ajaxOptions);
    };
    /**
     * Shutdown a kernel.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/kernels).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     *
     * On a valid response, closes the websocket and disposes of the kernel
     * object, and fulfills the promise.
     *
     * The promise will be rejected if the kernel status is `Dead` or if the
     * request fails or the response is invalid.
     */
    Kernel.prototype.shutdown = function (ajaxOptions) {
        var _this = this;
        return shutdownKernel(this, this._baseUrl, ajaxOptions).then(function () {
            _this._status = ikernel_1.KernelStatus.Dead;
            _this._ws.close();
        });
    };
    /**
     * Send a `kernel_info_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#kernel-info).
     *
     * Fulfills with the `kernel_info_response` content when the shell reply is
     * received and validated.
     */
    Kernel.prototype.kernelInfo = function () {
        if (this._status === ikernel_1.KernelStatus.Dead) {
            return Promise.reject(Error(KERNEL_NOT_READY_MSG));
        }
        var options = {
            msgType: 'kernel_info_request',
            channel: 'shell',
            username: this._username,
            session: this._clientId
        };
        var msg = createKernelMessage(options);
        return sendKernelMessage(this, msg);
    };
    /**
     * Send a `complete_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#completion).
     *
     * Fulfills with the `complete_reply` content when the shell reply is
     * received and validated.
     */
    Kernel.prototype.complete = function (contents) {
        if (!this._isReady) {
            return Promise.reject(Error(KERNEL_NOT_READY_MSG));
        }
        var options = {
            msgType: 'complete_request',
            channel: 'shell',
            username: this._username,
            session: this._clientId
        };
        var msg = createKernelMessage(options, contents);
        return sendKernelMessage(this, msg);
    };
    /**
     * Send an `inspect_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#introspection).
     *
     * Fulfills with the `inspect_reply` content when the shell reply is
     * received and validated.
     */
    Kernel.prototype.inspect = function (contents) {
        if (!this._isReady) {
            return Promise.reject(Error(KERNEL_NOT_READY_MSG));
        }
        var options = {
            msgType: 'inspect_request',
            channel: 'shell',
            username: this._username,
            session: this._clientId
        };
        var msg = createKernelMessage(options, contents);
        return sendKernelMessage(this, msg);
    };
    /**
     * Send an `execute_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#execute).
     *
     * Future `onReply` is called with the `execute_reply` content when the
     * shell reply is received and validated.  The future will resolve when
     * this message is received and the `idle` iopub status is received.
     * The future will also be disposed at this point unless `disposeOnDone`
     * is specified and `false`, in which case it is up to the caller to dispose of the future.
     *
     * **See also:** [[IExecuteReply]]
     */
    Kernel.prototype.execute = function (contents, disposeOnDone) {
        if (disposeOnDone === void 0) { disposeOnDone = true; }
        if (!this._isReady) {
            throw Error(KERNEL_NOT_READY_MSG);
        }
        var options = {
            msgType: 'execute_request',
            channel: 'shell',
            username: this._username,
            session: this._clientId
        };
        var defaults = {
            silent: true,
            store_history: false,
            user_expressions: {},
            allow_stdin: false
        };
        contents = utils.extend(defaults, contents);
        var msg = createKernelMessage(options, contents);
        return this.sendShellMessage(msg, true, disposeOnDone);
    };
    /**
     * Send an `is_complete_request` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#code-completeness).
     *
     * Fulfills with the `is_complete_response` content when the shell reply is
     * received and validated.
     */
    Kernel.prototype.isComplete = function (contents) {
        if (!this._isReady) {
            return Promise.reject(Error(KERNEL_NOT_READY_MSG));
        }
        var options = {
            msgType: 'is_complete_request',
            channel: 'shell',
            username: this._username,
            session: this._clientId
        };
        var msg = createKernelMessage(options, contents);
        return sendKernelMessage(this, msg);
    };
    /**
     * Send a `comm_info_request` message.
     *
     * #### Notes
     * Fulfills with the `comm_info_reply` content when the shell reply is
     * received and validated.
     */
    Kernel.prototype.commInfo = function (contents) {
        if (!this._isReady) {
            return Promise.reject(Error(KERNEL_NOT_READY_MSG));
        }
        var options = {
            msgType: 'comm_info_request',
            channel: 'shell',
            username: this._username,
            session: this._clientId
        };
        var msg = createKernelMessage(options, contents);
        return sendKernelMessage(this, msg);
    };
    /**
     * Send an `input_reply` message.
     *
     * #### Notes
     * See [Messaging in Jupyter](http://jupyter-client.readthedocs.org/en/latest/messaging.html#messages-on-the-stdin-router-dealer-sockets).
     */
    Kernel.prototype.sendInputReply = function (contents) {
        if (!this._isReady) {
            throw Error(KERNEL_NOT_READY_MSG);
        }
        var options = {
            msgType: 'input_reply',
            channel: 'stdin',
            username: this._username,
            session: this._clientId
        };
        var msg = createKernelMessage(options, contents);
        this._ws.send(serialize.serialize(msg));
    };
    /**
     * Connect to a comm, or create a new one.
     *
     * #### Notes
     * If a client-side comm already exists, it is returned.
     */
    Kernel.prototype.connectToComm = function (targetName, commId) {
        var _this = this;
        if (commId === void 0) {
            commId = utils.uuid();
        }
        var comm = this._comms.get(commId);
        if (!comm) {
            comm = new Comm(targetName, commId, this._sendCommMessage.bind(this), function () {
                _this._unregisterComm(comm.commId);
            });
            this._comms.set(commId, comm);
        }
        return comm;
    };
    /**
     * Create the kernel websocket connection and add socket status handlers.
     */
    Kernel.prototype._createSocket = function () {
        var _this = this;
        var partialUrl = utils.urlPathJoin(this._wsUrl, KERNEL_SERVICE_URL, utils.urlJoinEncode(this._id));
        console.log('Starting WebSocket:', partialUrl);
        var url = (utils.urlPathJoin(partialUrl, 'channels') +
            '?session_id=' + this._clientId);
        this._ws = new WebSocket(url);
        // Ensure incoming binary messages are not Blobs
        this._ws.binaryType = 'arraybuffer';
        this._ws.onmessage = function (evt) { _this._onWSMessage(evt); };
        this._ws.onopen = function (evt) { _this._onWSOpen(evt); };
        this._ws.onclose = function (evt) { _this._onWSClose(evt); };
        this._ws.onerror = function (evt) { _this._onWSClose(evt); };
    };
    /**
     * Handle a websocket open event.
     */
    Kernel.prototype._onWSOpen = function (evt) {
        this._reconnectAttempt = 0;
        // trigger a status response
        this.kernelInfo();
    };
    /**
     * Handle a websocket message, validating and routing appropriately.
     */
    Kernel.prototype._onWSMessage = function (evt) {
        var msg = serialize.deserialize(evt.data);
        var handled = false;
        try {
            validate.validateKernelMessage(msg);
        }
        catch (error) {
            console.error(error.message);
            return;
        }
        if (msg.parent_header) {
            var parentHeader = msg.parent_header;
            var future = this._futures.get(parentHeader.msg_id);
            if (future) {
                future.handleMsg(msg);
                handled = true;
            }
        }
        if (msg.channel === 'iopub') {
            switch (msg.header.msg_type) {
                case 'status':
                    this._updateStatus(msg.content.execution_state);
                    break;
                case 'comm_open':
                    this._handleCommOpen(msg);
                    handled = true;
                    break;
                case 'comm_msg':
                    this._handleCommMsg(msg);
                    handled = true;
                    break;
                case 'comm_close':
                    this._handleCommClose(msg);
                    handled = true;
                    break;
            }
        }
        if (!handled) {
            this.unhandledMessage.emit(msg);
        }
    };
    /**
     * Handle a websocket close event.
     */
    Kernel.prototype._onWSClose = function (evt) {
        if ((this.status !== ikernel_1.KernelStatus.Dead) &&
            (this._reconnectAttempt < this._reconnectLimit)) {
            this._updateStatus('reconnecting');
            var timeout = Math.pow(2, this._reconnectAttempt);
            console.error("Connection lost, reconnecting in " + timeout + " seconds.");
            setTimeout(this._createSocket.bind(this), 1e3 * timeout);
            this._reconnectAttempt += 1;
        }
        else {
            this._updateStatus('dead');
        }
    };
    /**
     * Handle status iopub messages from the kernel.
     */
    Kernel.prototype._updateStatus = function (state) {
        var status;
        this._isReady = false;
        switch (state) {
            case 'starting':
                status = ikernel_1.KernelStatus.Starting;
                this._isReady = true;
                break;
            case 'idle':
                status = ikernel_1.KernelStatus.Idle;
                this._isReady = true;
                break;
            case 'busy':
                status = ikernel_1.KernelStatus.Busy;
                this._isReady = true;
                break;
            case 'restarting':
                status = ikernel_1.KernelStatus.Restarting;
                break;
            case 'reconnecting':
                status = ikernel_1.KernelStatus.Reconnecting;
                break;
            case 'dead':
                status = ikernel_1.KernelStatus.Dead;
                break;
            default:
                console.error('invalid kernel status:', state);
                return;
        }
        if (status !== this._status) {
            this._status = status;
            if (status === ikernel_1.KernelStatus.Dead) {
                runningKernels.delete(this._id);
                this._ws.close();
            }
            logKernelStatus(this);
            this.statusChanged.emit(status);
        }
    };
    /**
     * Handle `comm_open` kernel message.
     */
    Kernel.prototype._handleCommOpen = function (msg) {
        var _this = this;
        if (!validate.validateCommMessage(msg)) {
            console.error('Invalid comm message');
            return;
        }
        var content = msg.content;
        if (!content.target_module) {
            this.commOpened.emit(msg.content);
            return;
        }
        var targetName = content.target_name;
        var moduleName = content.target_module;
        var promise = new Promise(function (resolve, reject) {
            // Try loading the module using require.js
            requirejs([moduleName], function (mod) {
                if (mod[targetName] === undefined) {
                    reject(new Error('Target ' + targetName + ' not found in module ' + moduleName));
                }
                var target = mod[targetName];
                var comm = new Comm(content.target_name, content.comm_id, _this._sendCommMessage, function () { _this._unregisterComm(content.comm_id); });
                try {
                    var response = target(comm, content.data);
                }
                catch (e) {
                    comm.close();
                    _this._unregisterComm(comm.commId);
                    console.error("Exception opening new comm");
                    reject(e);
                }
                _this._commPromises.delete(comm.commId);
                _this._comms.set(comm.commId, comm);
                resolve(comm);
            });
        });
        this._commPromises.set(content.comm_id, promise);
    };
    /**
     * Handle 'comm_close' kernel message.
     */
    Kernel.prototype._handleCommClose = function (msg) {
        var _this = this;
        if (!validate.validateCommMessage(msg)) {
            console.error('Invalid comm message');
            return;
        }
        var content = msg.content;
        var promise = this._commPromises.get(content.comm_id);
        if (!promise) {
            var comm = this._comms.get(content.comm_id);
            if (!comm) {
                console.error('Comm not found for comm id ' + content.comm_id);
                return;
            }
            promise = Promise.resolve(comm);
        }
        promise.then(function (comm) {
            _this._unregisterComm(comm.commId);
            try {
                var onClose = comm.onClose;
                if (onClose)
                    onClose(msg.content.data);
                comm.dispose();
            }
            catch (e) {
                console.error("Exception closing comm: ", e, e.stack, msg);
            }
        });
    };
    /**
     * Handle 'comm_msg' kernel message.
     */
    Kernel.prototype._handleCommMsg = function (msg) {
        if (!validate.validateCommMessage(msg)) {
            console.error('Invalid comm message');
            return;
        }
        var content = msg.content;
        var promise = this._commPromises.get(content.comm_id);
        if (!promise) {
            var comm = this._comms.get(content.comm_id);
            if (!comm) {
                console.error('Comm not found for comm id ' + content.comm_id);
                return;
            }
            else {
                var onMsg = comm.onMsg;
                if (onMsg)
                    onMsg(msg.content.data);
            }
        }
        else {
            promise.then(function (comm) {
                try {
                    var onMsg = comm.onMsg;
                    if (onMsg)
                        onMsg(msg.content.data);
                }
                catch (e) {
                    console.error("Exception handling comm msg: ", e, e.stack, msg);
                }
                return comm;
            });
        }
    };
    /**
     * Send a comm message to the kernel.
     */
    Kernel.prototype._sendCommMessage = function (payload, disposeOnDone) {
        if (disposeOnDone === void 0) { disposeOnDone = true; }
        var options = {
            msgType: payload.msgType,
            channel: 'shell',
            username: this.username,
            session: this.clientId
        };
        var msg = createKernelMessage(options, payload.content, payload.metadata, payload.buffers);
        return this.sendShellMessage(msg, false, disposeOnDone);
    };
    /**
     * Unregister a comm instance.
     */
    Kernel.prototype._unregisterComm = function (commId) {
        this._comms.delete(commId);
        this._commPromises.delete(commId);
    };
    /**
     * A signal emitted when the kernel status changes.
     *
     * **See also:** [[statusChanged]]
     */
    Kernel.statusChangedSignal = new phosphor_signaling_1.Signal();
    /**
     * A signal emitted for unhandled kernel message.
     *
     * **See also:** [[unhandledMessage]]
     */
    Kernel.unhandledMessageSignal = new phosphor_signaling_1.Signal();
    /**
     * A signal emitted for unhandled comm open message.
     *
     * **See also:** [[commOpened]]
     */
    Kernel.commOpenedSignal = new phosphor_signaling_1.Signal();
    return Kernel;
})();
/**
 * A module private store for running kernels.
 */
var runningKernels = new Map();
/**
 * Restart a kernel.
 */
function restartKernel(kernel, baseUrl, ajaxOptions) {
    var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, utils.urlJoinEncode(kernel.id, 'restart'));
    return utils.ajaxRequest(url, {
        method: "POST",
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 200) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
        validate.validateKernelId(success.data);
    }, onKernelError);
}
/**
 * Interrupt a kernel.
 */
function interruptKernel(kernel, baseUrl, ajaxOptions) {
    if (kernel.status === ikernel_1.KernelStatus.Dead) {
        return Promise.reject(new Error('Kernel is dead'));
    }
    var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, utils.urlJoinEncode(kernel.id, 'interrupt'));
    return utils.ajaxRequest(url, {
        method: "POST",
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 204) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
    }, onKernelError);
}
/**
 * Delete a kernel.
 */
function shutdownKernel(kernel, baseUrl, ajaxOptions) {
    if (kernel.status === ikernel_1.KernelStatus.Dead) {
        return Promise.reject(new Error('Kernel is dead'));
    }
    var url = utils.urlPathJoin(baseUrl, KERNEL_SERVICE_URL, utils.urlJoinEncode(kernel.id));
    return utils.ajaxRequest(url, {
        method: "DELETE",
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 204) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
    }, onKernelError);
}
/**
 * Log the current kernel status.
 */
function logKernelStatus(kernel) {
    if (kernel.status == ikernel_1.KernelStatus.Idle ||
        kernel.status === ikernel_1.KernelStatus.Busy ||
        kernel.status === ikernel_1.KernelStatus.Unknown) {
        return;
    }
    var status = '';
    switch (kernel.status) {
        case ikernel_1.KernelStatus.Starting:
            status = 'starting';
            break;
        case ikernel_1.KernelStatus.Restarting:
            status = 'restarting';
            break;
        case ikernel_1.KernelStatus.Dead:
            status = 'dead';
            break;
    }
    console.log('Kernel: ' + status + ' (' + kernel.id + ')');
}
/**
 * Handle an error on a kernel Ajax call.
 */
function onKernelError(error) {
    console.error("API request failed (" + error.statusText + "): ");
    throw Error(error.statusText);
}
/**
 * Send a kernel message to the kernel and return the contents of the response.
 */
function sendKernelMessage(kernel, msg) {
    var future = kernel.sendShellMessage(msg, true);
    return new Promise(function (resolve, reject) {
        future.onReply = function (msg) {
            resolve(msg.content);
        };
    });
}
/**
 * Bit flags for the kernel future state.
 */
var KernelFutureFlag;
(function (KernelFutureFlag) {
    KernelFutureFlag[KernelFutureFlag["GotReply"] = 1] = "GotReply";
    KernelFutureFlag[KernelFutureFlag["GotIdle"] = 2] = "GotIdle";
    KernelFutureFlag[KernelFutureFlag["IsDone"] = 4] = "IsDone";
    KernelFutureFlag[KernelFutureFlag["DisposeOnDone"] = 8] = "DisposeOnDone";
})(KernelFutureFlag || (KernelFutureFlag = {}));
/**
 * Implementation of a kernel future.
 */
var KernelFutureHandler = (function (_super) {
    __extends(KernelFutureHandler, _super);
    /**
     * Construct a new KernelFutureHandler.
     */
    function KernelFutureHandler(cb, msgId, expectShell, disposeOnDone) {
        _super.call(this, cb);
        this._msgId = '';
        this._status = 0;
        this._stdin = null;
        this._iopub = null;
        this._reply = null;
        this._done = null;
        this._disposeOnDone = true;
        this._msgId = msgId;
        if (!expectShell) {
            this._setFlag(KernelFutureFlag.GotReply);
        }
        this._disposeOnDone = disposeOnDone;
    }
    Object.defineProperty(KernelFutureHandler.prototype, "msgId", {
        /**
         * Get the id of the message.
         */
        get: function () {
            return this._msgId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KernelFutureHandler.prototype, "isDone", {
        /**
         * Check for message done state.
         */
        get: function () {
            return this._testFlag(KernelFutureFlag.IsDone);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KernelFutureHandler.prototype, "onReply", {
        /**
         * Get the reply handler.
         */
        get: function () {
            return this._reply;
        },
        /**
         * Set the reply handler.
         */
        set: function (cb) {
            this._reply = cb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KernelFutureHandler.prototype, "onIOPub", {
        /**
         * Get the iopub handler.
         */
        get: function () {
            return this._iopub;
        },
        /**
         * Set the iopub handler.
         */
        set: function (cb) {
            this._iopub = cb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KernelFutureHandler.prototype, "onDone", {
        /**
         * Get the done handler.
         */
        get: function () {
            return this._done;
        },
        /**
         * Set the done handler.
         */
        set: function (cb) {
            this._done = cb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KernelFutureHandler.prototype, "onStdin", {
        /**
         * Get the stdin handler.
         */
        get: function () {
            return this._stdin;
        },
        /**
         * Set the stdin handler.
         */
        set: function (cb) {
            this._stdin = cb;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose and unregister the future.
     */
    KernelFutureHandler.prototype.dispose = function () {
        this._stdin = null;
        this._iopub = null;
        this._reply = null;
        this._done = null;
        _super.prototype.dispose.call(this);
    };
    /**
     * Handle an incoming kernel message.
     */
    KernelFutureHandler.prototype.handleMsg = function (msg) {
        switch (msg.channel) {
            case 'shell':
                this._handleReply(msg);
                break;
            case 'stdin':
                this._handleStdin(msg);
                break;
            case 'iopub':
                this._handleIOPub(msg);
                break;
        }
    };
    KernelFutureHandler.prototype._handleReply = function (msg) {
        var reply = this._reply;
        if (reply)
            reply(msg);
        this._setFlag(KernelFutureFlag.GotReply);
        if (this._testFlag(KernelFutureFlag.GotIdle)) {
            this._handleDone(msg);
        }
    };
    KernelFutureHandler.prototype._handleStdin = function (msg) {
        var stdin = this._stdin;
        if (stdin)
            stdin(msg);
    };
    KernelFutureHandler.prototype._handleIOPub = function (msg) {
        var iopub = this._iopub;
        if (iopub)
            iopub(msg);
        if (msg.header.msg_type === 'status' &&
            msg.content.execution_state === 'idle') {
            this._setFlag(KernelFutureFlag.GotIdle);
            if (this._testFlag(KernelFutureFlag.GotReply)) {
                this._handleDone(msg);
            }
        }
    };
    KernelFutureHandler.prototype._handleDone = function (msg) {
        if (this.isDone) {
            return;
        }
        this._setFlag(KernelFutureFlag.IsDone);
        var done = this._done;
        if (done)
            done(msg);
        this._done = null;
        if (this._disposeOnDone) {
            this.dispose();
        }
    };
    /**
     * Test whether the given future flag is set.
     */
    KernelFutureHandler.prototype._testFlag = function (flag) {
        return (this._status & flag) !== 0;
    };
    /**
     * Set the given future flag.
     */
    KernelFutureHandler.prototype._setFlag = function (flag) {
        this._status |= flag;
    };
    /**
     * Clear the given future flag.
     */
    KernelFutureHandler.prototype._clearFlag = function (flag) {
        this._status &= ~flag;
    };
    return KernelFutureHandler;
})(phosphor_disposable_1.DisposableDelegate);
/**
 * Comm channel handler.
 */
var Comm = (function (_super) {
    __extends(Comm, _super);
    /**
     * Construct a new comm channel.
     */
    function Comm(target, id, msgFunc, disposeCb) {
        _super.call(this, disposeCb);
        this._target = '';
        this._id = '';
        this._onClose = null;
        this._onMsg = null;
        this._msgFunc = null;
        this._target = target;
        this._id = id;
        this._msgFunc = msgFunc;
    }
    Object.defineProperty(Comm.prototype, "commId", {
        /**
         * The unique id for the comm channel.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Comm.prototype, "targetName", {
        /**
         * The target name for the comm channel.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._target;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Comm.prototype, "onClose", {
        /**
         * Get the callback for a comm close event.
         *
         * #### Notes
         * This is called when the comm is closed from either the server or
         * client.
         *
         * **See also:** [[ICommClose]], [[close]]
         */
        get: function () {
            return this._onClose;
        },
        /**
         * Set the callback for a comm close event.
         *
         * #### Notes
         * This is called when the comm is closed from either the server or
         * client.
         *
         * **See also:** [[ICommClose]], [[close]]
         */
        set: function (cb) {
            this._onClose = cb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Comm.prototype, "onMsg", {
        /**
         * Get the callback for a comm message received event.
         *
         * **See also:** [[ICommMsg]]
         */
        get: function () {
            return this._onMsg;
        },
        /**
         * Set the callback for a comm message received event.
         *
         * **See also:** [[ICommMsg]]
         */
        set: function (cb) {
            this._onMsg = cb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Comm.prototype, "isDisposed", {
        /**
         * Test whether the comm has been disposed.
         *
         * #### Notes
         * This is a read-only property which is always safe to access.
         */
        get: function () {
            return (this._msgFunc === null);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Open a comm with optional data and metadata.
     *
     * #### Notes
     * This sends a `comm_open` message to the server.
     *
     * **See also:** [[ICommOpen]]
     */
    Comm.prototype.open = function (data, metadata) {
        var content = {
            comm_id: this._id,
            target_name: this._target,
            data: data || {}
        };
        var payload = {
            msgType: 'comm_open', content: content, metadata: metadata
        };
        if (this._msgFunc === void 0) {
            return;
        }
        return this._msgFunc(payload);
    };
    /**
     * Send a `comm_msg` message to the kernel.
     *
     * #### Notes
     * This is a no-op if the comm has been closed.
     *
     * **See also:** [[ICommMsg]]
     */
    Comm.prototype.send = function (data, metadata, buffers, disposeOnDone) {
        if (metadata === void 0) { metadata = {}; }
        if (buffers === void 0) { buffers = []; }
        if (disposeOnDone === void 0) { disposeOnDone = true; }
        if (this.isDisposed) {
            throw Error('Comm is closed');
        }
        var content = { comm_id: this._id, data: data };
        var payload = {
            msgType: 'comm_msg',
            content: content,
            metadata: metadata,
            buffers: buffers,
        };
        if (this._msgFunc === void 0) {
            return;
        }
        return this._msgFunc(payload, disposeOnDone);
    };
    /**
     * Close the comm.
     *
     * #### Notes
     * This will send a `comm_close` message to the kernel, and call the
     * `onClose` callback if set.
     *
     * This is a no-op if the comm is already closed.
     *
     * **See also:** [[ICommClose]], [[onClose]]
     */
    Comm.prototype.close = function (data, metadata) {
        if (this.isDisposed) {
            return;
        }
        var onClose = this._onClose;
        if (onClose)
            onClose(data);
        if (this._msgFunc === void 0) {
            return;
        }
        var content = { comm_id: this._id, data: data || {} };
        var payload = {
            msgType: 'comm_close', content: content, metadata: metadata
        };
        var future = this._msgFunc(payload);
        this.dispose();
        return future;
    };
    /**
     * Dispose of the resources held by the comm.
     */
    Comm.prototype.dispose = function () {
        this._onClose = null;
        this._onMsg = null;
        this._msgFunc = null;
        this._id = null;
        _super.prototype.dispose.call(this);
    };
    return Comm;
})(phosphor_disposable_1.DisposableDelegate);

},{"./ikernel":7,"./serialize":11,"./utils":13,"./validate":14,"phosphor-disposable":16,"phosphor-signaling":21}],11:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
/**
 * Deserialize and return the unpacked message.
 *
 * #### Notes
 * Handles JSON blob strings and binary messages.
 */
function deserialize(data) {
    var value;
    if (typeof data === "string") {
        value = JSON.parse(data);
    }
    else {
        value = deserializeBinary(data);
    }
    return value;
}
exports.deserialize = deserialize;
/**
 * Serialize a kernel message for transport.
 *
 * #### Notes
 * If there is binary content, an `ArrayBuffer` is returned,
 * otherwise the message is converted to a JSON string.
 */
function serialize(msg) {
    var value;
    if (msg.buffers && msg.buffers.length) {
        value = serializeBinary(msg);
    }
    else {
        value = JSON.stringify(msg);
    }
    return value;
}
exports.serialize = serialize;
/**
 * Deserialize a binary message to a Kernel Message.
 */
function deserializeBinary(buf) {
    var data = new DataView(buf);
    // read the header: 1 + nbufs 32b integers
    var nbufs = data.getUint32(0);
    var offsets = [];
    if (nbufs < 2) {
        throw new Error("Invalid incoming Kernel Message");
    }
    for (var i = 1; i <= nbufs; i++) {
        offsets.push(data.getUint32(i * 4));
    }
    var json_bytes = new Uint8Array(buf.slice(offsets[0], offsets[1]));
    var msg = JSON.parse((new TextDecoder('utf8')).decode(json_bytes));
    // the remaining chunks are stored as DataViews in msg.buffers
    msg.buffers = [];
    for (var i = 1; i < nbufs; i++) {
        var start = offsets[i];
        var stop = offsets[i + 1] || buf.byteLength;
        msg.buffers.push(new DataView(buf.slice(start, stop)));
    }
    return msg;
}
/**
 * Implement the binary serialization protocol.
 *
 * Serialize Kernel message to ArrayBuffer.
 */
function serializeBinary(msg) {
    var offsets = [];
    var buffers = [];
    var encoder = new TextEncoder('utf8');
    var json_utf8 = encoder.encode(JSON.stringify(msg, replace_buffers));
    buffers.push(json_utf8.buffer);
    for (var i = 0; i < msg.buffers.length; i++) {
        // msg.buffers elements could be either views or ArrayBuffers
        // buffers elements are ArrayBuffers
        var b = msg.buffers[i];
        buffers.push(b instanceof ArrayBuffer ? b : b.buffer);
    }
    var nbufs = buffers.length;
    offsets.push(4 * (nbufs + 1));
    for (i = 0; i + 1 < buffers.length; i++) {
        offsets.push(offsets[offsets.length - 1] + buffers[i].byteLength);
    }
    var msg_buf = new Uint8Array(offsets[offsets.length - 1] + buffers[buffers.length - 1].byteLength);
    // use DataView.setUint32 for network byte-order
    var view = new DataView(msg_buf.buffer);
    // write nbufs to first 4 bytes
    view.setUint32(0, nbufs);
    // write offsets to next 4 * nbufs bytes
    for (i = 0; i < offsets.length; i++) {
        view.setUint32(4 * (i + 1), offsets[i]);
    }
    // write all the buffers at their respective offsets
    for (i = 0; i < buffers.length; i++) {
        msg_buf.set(new Uint8Array(buffers[i]), offsets[i]);
    }
    return msg_buf.buffer;
}
/**
 * Filter `"buffers"` key for `JSON.stringify`.
 */
function replace_buffers(key, value) {
    if (key === "buffers") {
        return undefined;
    }
    return value;
}

},{}],12:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
var phosphor_signaling_1 = require('phosphor-signaling');
var ikernel_1 = require('./ikernel');
var kernel_1 = require('./kernel');
var utils = require('./utils');
var validate = require('./validate');
/**
 * The url for the session service.
 */
var SESSION_SERVICE_URL = 'api/sessions';
/**
 * Fetch the running sessions.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.
 */
function listRunningSessions(baseUrl, ajaxOptions) {
    var url = utils.urlPathJoin(baseUrl, SESSION_SERVICE_URL);
    return utils.ajaxRequest(url, {
        method: "GET",
        dataType: "json"
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 200) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
        if (!Array.isArray(success.data)) {
            throw Error('Invalid Session list');
        }
        for (var i = 0; i < success.data.length; i++) {
            validate.validateSessionId(success.data[i]);
        }
        return success.data;
    }, onSessionError);
}
exports.listRunningSessions = listRunningSessions;
/**
 * Start a new session.
 *
 * #### Notes
 * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
 *
 * The promise is fulfilled on a valid response and rejected otherwise.

 * Wrap the result in an NotebookSession object. The promise is fulfilled
 * when the session is fully ready to send the first message. If
 * the session fails to become ready, the promise is rejected.
 */
function startNewSession(options, ajaxOptions) {
    var url = utils.urlPathJoin(options.baseUrl, SESSION_SERVICE_URL);
    var model = {
        kernel: { name: options.kernelName },
        notebook: { path: options.notebookPath }
    };
    return utils.ajaxRequest(url, {
        method: "POST",
        dataType: "json",
        data: JSON.stringify(model),
        contentType: 'application/json'
    }, ajaxOptions).then(function (success) {
        if (success.xhr.status !== 201) {
            throw Error('Invalid Status: ' + success.xhr.status);
        }
        var sessionId = success.data;
        validate.validateSessionId(success.data);
        return createSession(sessionId, options);
    }, onSessionError);
}
exports.startNewSession = startNewSession;
/**
 * Connect to a running notebook session.
 *
 * #### Notes
 * If the session was already started via `startNewSession`, the existing
 * NotebookSession object is used as the fulfillment value.
 *
 * Otherwise, if `options` are given, we attempt to connect to the existing
 * session found by calling `listRunningSessions`.
 * The promise is fulfilled when the session is fully ready to send
 * the first message. If the session fails to become ready, the promise is
 * rejected.
 *
 * If the session was not already started and no `options` are given,
 * the promise is rejected.
 */
function connectToSession(id, options, ajaxOptions) {
    var session = runningSessions.get(id);
    if (session) {
        return Promise.resolve(session);
    }
    if (options === void 0) {
        return Promise.reject(new Error('Please specify session options'));
    }
    return new Promise(function (resolve, reject) {
        listRunningSessions(options.baseUrl, ajaxOptions).then(function (sessionIds) {
            var sessionIds = sessionIds.filter(function (k) { return k.id === id; });
            if (!sessionIds.length) {
                reject(new Error('No running session with id: ' + id));
            }
            createSession(sessionIds[0], options).then(function (session) {
                resolve(session);
            });
        });
    });
}
exports.connectToSession = connectToSession;
/**
 * Create a Promise for a NotebookSession object.
 *
 * Fulfilled when the NotebookSession is Starting, or rejected if Dead.
 */
function createSession(sessionId, options, ajaxOptions) {
    return new Promise(function (resolve, reject) {
        options.notebookPath = sessionId.notebook.path;
        var kernelOptions = {
            name: sessionId.kernel.name,
            baseUrl: options.baseUrl,
            wsUrl: options.wsUrl,
            username: options.username,
            clientId: options.clientId
        };
        var kernelPromise = kernel_1.connectToKernel(sessionId.kernel.id, kernelOptions, ajaxOptions);
        kernelPromise.then(function (kernel) {
            var session = new NotebookSession(options, sessionId.id, kernel);
            runningSessions.set(session.id, session);
            resolve(session);
        }).catch(function () {
            reject(new Error('Session failed to start'));
        });
    });
}
/**
 * A module private store for running sessions.
 */
var runningSessions = new Map();
/**
 * Session object for accessing the session REST api. The session
 * should be used to start kernels and then shut them down -- for
 * all other operations, the kernel object should be used.
 **/
var NotebookSession = (function () {
    /**
     * Construct a new session.
     */
    function NotebookSession(options, id, kernel) {
        this._id = "";
        this._notebookPath = "";
        this._kernel = null;
        this._url = '';
        this._isDead = false;
        this._id = id;
        this._notebookPath = options.notebookPath;
        this._kernel = kernel;
        this._url = utils.urlPathJoin(options.baseUrl, SESSION_SERVICE_URL, this._id);
        this._kernel.statusChanged.connect(this._kernelStatusChanged, this);
    }
    Object.defineProperty(NotebookSession.prototype, "sessionDied", {
        /**
         * A signal emitted when the session dies.
         */
        get: function () {
            return NotebookSession.sessionDiedSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NotebookSession.prototype, "id", {
        /**
         * Get the session id.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NotebookSession.prototype, "kernel", {
        /**
         * Get the session kernel object.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._kernel;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NotebookSession.prototype, "notebookPath", {
        /**
         * Get the notebook path.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._notebookPath;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Rename or move a notebook.
     *
     * @param path - The new notebook path.
     *
     * #### Notes
     * This uses the Notebook REST API, and the response is validated.
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    NotebookSession.prototype.renameNotebook = function (path, ajaxOptions) {
        var _this = this;
        if (this._isDead) {
            return Promise.reject(new Error('Session is dead'));
        }
        var model = {
            kernel: { name: this._kernel.name, id: this._kernel.id },
            notebook: { path: path }
        };
        return utils.ajaxRequest(this._url, {
            method: "PATCH",
            dataType: "json",
            data: JSON.stringify(model),
            contentType: 'application/json'
        }, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 200) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            var data = success.data;
            validate.validateSessionId(data);
            _this._notebookPath = data.notebook.path;
        }, onSessionError);
    };
    /**
     * Kill the kernel and shutdown the session.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/sessions), and validates the response.
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     */
    NotebookSession.prototype.shutdown = function (ajaxOptions) {
        var _this = this;
        if (this._isDead) {
            return Promise.reject(new Error('Session is dead'));
        }
        this._isDead = true;
        return utils.ajaxRequest(this._url, {
            method: "DELETE",
            dataType: "json"
        }, ajaxOptions).then(function (success) {
            if (success.xhr.status !== 204) {
                throw Error('Invalid Status: ' + success.xhr.status);
            }
            _this.sessionDied.emit(void 0);
            _this.kernel.shutdown();
        }, function (rejected) {
            _this._isDead = false;
            if (rejected.xhr.status === 410) {
                throw Error('The kernel was deleted but the session was not');
            }
            onSessionError(rejected);
        });
    };
    /**
     * React to changes in the Kernel status.
     */
    NotebookSession.prototype._kernelStatusChanged = function (sender, state) {
        if (state == ikernel_1.KernelStatus.Dead) {
            this.shutdown();
        }
    };
    /**
     * A signal emitted when the session dies.
     *
     * **See also:** [[sessionDied]]
     */
    NotebookSession.sessionDiedSignal = new phosphor_signaling_1.Signal();
    return NotebookSession;
})();
/**
 * Handle an error on a session Ajax call.
 */
function onSessionError(error) {
    console.error("API request failed (" + error.statusText + "): ");
    throw Error(error.statusText);
}

},{"./ikernel":7,"./kernel":10,"./utils":13,"./validate":14,"phosphor-signaling":21}],13:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
/**
 * Copy the contents of one object to another, recursively.
 *
 * From [stackoverflow](http://stackoverflow.com/a/12317051).
 */
function extend(target, source) {
    target = target || {};
    for (var prop in source) {
        if (typeof source[prop] === 'object') {
            target[prop] = extend(target[prop], source[prop]);
        }
        else {
            target[prop] = source[prop];
        }
    }
    return target;
}
exports.extend = extend;
/**
 * Get a random 128b hex string (not a formal UUID)
 */
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    var nChars = hexDigits.length;
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.charAt(Math.floor(Math.random() * nChars));
    }
    return s.join("");
}
exports.uuid = uuid;
/**
 * Join a sequence of url components with `'/'`.
 */
function urlPathJoin() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i - 0] = arguments[_i];
    }
    var url = '';
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        if (path === '') {
            continue;
        }
        if (i > 0) {
            path = path.replace(/\/\/+/, '/');
        }
        if (url.length > 0 && url.charAt(url.length - 1) != '/') {
            url = url + '/' + paths[i];
        }
        else {
            url = url + paths[i];
        }
    }
    return url;
}
exports.urlPathJoin = urlPathJoin;
/**
 * Encode just the components of a multi-segment uri.
 *
 * Preserves the `'/'` separators.
 */
function encodeURIComponents(uri) {
    return uri.split('/').map(encodeURIComponent).join('/');
}
exports.encodeURIComponents = encodeURIComponents;
/**
 * Encode and join a sequence of url components with `'/'`.
 */
function urlJoinEncode() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return encodeURIComponents(urlPathJoin.apply(null, args));
}
exports.urlJoinEncode = urlJoinEncode;
/**
 * Return a serialized object string suitable for a query.
 *
 * From [stackoverflow](http://stackoverflow.com/a/30707423).
 */
function jsonToQueryString(json) {
    return '?' + Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
}
exports.jsonToQueryString = jsonToQueryString;
/**
 * Asynchronous XMLHTTPRequest handler.
 *
 * Based on this [example](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest).
 */
function ajaxRequest(url, settings, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(settings.method, url, true, options.user, options.password);
        if (settings.contentType) {
            req.setRequestHeader('Content-Type', settings.contentType);
        }
        if (options.timeout !== void 0)
            req.timeout = options.timeout;
        if (options.withCredentials !== void 0) {
            req.withCredentials = options.withCredentials;
        }
        if (options.requestHeaders !== void 0) {
            for (var prop in options.requestHeaders) {
                req.setRequestHeader(prop, options.requestHeaders[prop]);
            }
        }
        req.onload = function () {
            var response = req.responseText;
            if (settings.dataType === 'json' && response) {
                response = JSON.parse(response);
            }
            resolve({ data: response, statusText: req.statusText, xhr: req });
        };
        req.onerror = function (err) {
            reject({ xhr: req, statusText: req.statusText, error: err });
        };
        req.ontimeout = function () {
            reject({ xhr: req, statusText: req.statusText,
                error: new Error('Operation Timed Out') });
        };
        if (settings.data) {
            req.send(settings.data);
        }
        else {
            req.send();
        }
    });
}
exports.ajaxRequest = ajaxRequest;
/**
 * A Promise that can be resolved or rejected by another object.
 */
var PromiseDelegate = (function () {
    /**
     * Construct a new Promise delegate.
     */
    function PromiseDelegate() {
        var _this = this;
        this._promise = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
    }
    Object.defineProperty(PromiseDelegate.prototype, "promise", {
        /**
         * Get the underlying Promise.
         */
        get: function () {
            return this._promise;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Resolve the underlying Promise with an optional value or another Promise.
     */
    PromiseDelegate.prototype.resolve = function (value) {
        // Note: according to the Promise spec, and the `this` context for resolve
        // and reject are ignored
        this._resolve(value);
    };
    /**
     * Reject the underlying Promise with an optional reason.
     */
    PromiseDelegate.prototype.reject = function (reason) {
        // Note: according to the Promise spec, and the `this` context for resolve
        // and reject are ignored
        this._reject(reason);
    };
    return PromiseDelegate;
})();
exports.PromiseDelegate = PromiseDelegate;

},{}],14:[function(require,module,exports){
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';
/**
 * Required fields for comm messages.
 */
var COMM_FIELDS = ['comm_id', 'data'];
/**
 * Required fields for `IKernelHeader`.
 */
var HEADER_FIELDS = ['username', 'version', 'session', 'msg_id', 'msg_type'];
/**
 * Required fields for `IKernelMessage`.
 */
var MESSAGE_FIELDS = ['header', 'parent_header', 'metadata', 'content',
    'channel', 'buffers'];
/**
 * Validate an Kernel Message as being a valid Comm Message.
 */
function validateCommMessage(msg) {
    for (var i = 0; i < COMM_FIELDS.length; i++) {
        if (!msg.content.hasOwnProperty(COMM_FIELDS[i])) {
            return false;
        }
    }
    if (msg.header.msg_type === 'comm_open') {
        if (!msg.content.hasOwnProperty('target_name') ||
            typeof msg.content.target_name !== 'string') {
            return false;
        }
        if (msg.content.hasOwnProperty('target_module') &&
            msg.content.target_module !== null &&
            typeof msg.content.target_module !== 'string') {
            return false;
        }
    }
    if (typeof msg.content.comm_id !== 'string') {
        return false;
    }
    return true;
}
exports.validateCommMessage = validateCommMessage;
/**
 * Validate the header of an `IKernelMessage`.
 */
function validateKernelHeader(header) {
    for (var i = 0; i < HEADER_FIELDS.length; i++) {
        if (!header.hasOwnProperty(HEADER_FIELDS[i])) {
            throw Error('Invalid Kernel message');
        }
        if (typeof header[HEADER_FIELDS[i]] !== 'string') {
            throw Error('Invalid Kernel message');
        }
    }
}
/**
 * Validate an `IKernelMessage` object.
 */
function validateKernelMessage(msg) {
    for (var i = 0; i < MESSAGE_FIELDS.length; i++) {
        if (!msg.hasOwnProperty(MESSAGE_FIELDS[i])) {
            throw Error('Invalid Kernel message');
        }
    }
    validateKernelHeader(msg.header);
    if (Object.keys(msg.parent_header).length > 0) {
        validateKernelHeader(msg.parent_header);
    }
    if (typeof msg.channel !== 'string') {
        throw Error('Invalid Kernel message');
    }
    if (!Array.isArray(msg.buffers)) {
        throw Error('Invalid Kernel message');
    }
}
exports.validateKernelMessage = validateKernelMessage;
/**
 * Validate an `KernelId` object.
 */
function validateKernelId(info) {
    if (!info.hasOwnProperty('name') || !info.hasOwnProperty('id')) {
        throw Error('Invalid kernel id');
    }
    if ((typeof info.id !== 'string') || (typeof info.name !== 'string')) {
        throw Error('Invalid kernel id');
    }
}
exports.validateKernelId = validateKernelId;
/**
 * Validate an `ISessionId` object.
 */
function validateSessionId(info) {
    if (!info.hasOwnProperty('id') ||
        !info.hasOwnProperty('notebook') ||
        !info.hasOwnProperty('kernel')) {
        throw Error('Invalid Session Model');
    }
    validateKernelId(info.kernel);
    if (typeof info.id !== 'string') {
        throw Error('Invalid Session Model');
    }
    validateNotebookId(info.notebook);
}
exports.validateSessionId = validateSessionId;
/**
 * Validate an `INotebookId` object.
 */
function validateNotebookId(model) {
    if ((!model.hasOwnProperty('path')) || (typeof model.path !== 'string')) {
        throw Error('Invalid Notebook Model');
    }
}
exports.validateNotebookId = validateNotebookId;
/**
 * Validate an `IKernelSpecID` object.
 */
function validateKernelSpec(info) {
    var err = new Error("Invalid KernelSpec Model");
    if (!info.hasOwnProperty('name') || typeof info.name !== 'string') {
        throw err;
    }
    if (!info.hasOwnProperty('spec') || !info.hasOwnProperty('resources')) {
        throw err;
    }
    var spec = info.spec;
    if (!spec.hasOwnProperty('language') || typeof spec.language !== 'string') {
        throw err;
    }
    if (!spec.hasOwnProperty('display_name') ||
        typeof spec.display_name !== 'string') {
        throw err;
    }
    if (!spec.hasOwnProperty('argv') || !Array.isArray(spec.argv)) {
        throw err;
    }
}
exports.validateKernelSpec = validateKernelSpec;
/**
 * Validate an `IContentsModel` object.
 */
function validateContentsModel(model) {
    var err = new Error('Invalid Contents Model');
    if (!model.hasOwnProperty('name') || typeof model.name !== 'string') {
        throw err;
    }
    if (!model.hasOwnProperty('path') || typeof model.path !== 'string') {
        throw err;
    }
    if (!model.hasOwnProperty('type') || typeof model.type !== 'string') {
        throw err;
    }
    if (!model.hasOwnProperty('created') || typeof model.created !== 'string') {
        throw err;
    }
    if (!model.hasOwnProperty('last_modified') ||
        typeof model.last_modified !== 'string') {
        throw err;
    }
    if (!model.hasOwnProperty('mimetype')) {
        throw err;
    }
    if (!model.hasOwnProperty('content')) {
        throw err;
    }
    if (!model.hasOwnProperty('format')) {
        throw err;
    }
}
exports.validateContentsModel = validateContentsModel;
/**
 * Validate an `ICheckpointModel` object.
 */
function validateCheckpointModel(model) {
    var err = new Error('Invalid Checkpoint Model');
    if (!model.hasOwnProperty('id') || typeof model.id !== 'string') {
        throw err;
    }
    if (!model.hasOwnProperty('last_modified') ||
        typeof model.last_modified !== 'string') {
        throw err;
    }
}
exports.validateCheckpointModel = validateCheckpointModel;

},{}],15:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
/**
 * Execute a callback for each element in an array.
 *
 * @param array - The array of values to iterate.
 *
 * @param callback - The callback to invoke for the array elements.
 *
 * @param fromIndex - The starting index for iteration.
 *
 * @param wrap - Whether iteration wraps around at the end of the array.
 *
 * @returns The first value returned by `callback` which is not
 *   equal to `undefined`, or `undefined` if the callback does
 *   not return a value or if the start index is out of range.
 *
 * #### Notes
 * It is not safe to modify the size of the array while iterating.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function logger(value: number): void {
 *   console.log(value);
 * }
 *
 * let data = [1, 2, 3, 4];
 * arrays.forEach(data, logger);           // logs 1, 2, 3, 4
 * arrays.forEach(data, logger, 2);        // logs 3, 4
 * arrays.forEach(data, logger, 2, true);  // logs 3, 4, 1, 2
 * arrays.forEach(data, (v, i) => {        // 2
 *   if (v === 3) return i;
 * });
 * ```
 *
 * **See also** [[rforEach]]
 */
function forEach(array, callback, fromIndex, wrap) {
    if (fromIndex === void 0) { fromIndex = 0; }
    if (wrap === void 0) { wrap = false; }
    var start = fromIndex | 0;
    if (start < 0 || start >= array.length) {
        return void 0;
    }
    if (wrap) {
        for (var i = 0, n = array.length; i < n; ++i) {
            var j = (start + i) % n;
            var result = callback(array[j], j);
            if (result !== void 0)
                return result;
        }
    }
    else {
        for (var i = start, n = array.length; i < n; ++i) {
            var result = callback(array[i], i);
            if (result !== void 0)
                return result;
        }
    }
    return void 0;
}
exports.forEach = forEach;
/**
 * Execute a callback for each element in an array, in reverse.
 *
 * @param array - The array of values to iterate.
 *
 * @param callback - The callback to invoke for the array elements.
 *
 * @param fromIndex - The starting index for iteration.
 *
 * @param wrap - Whether iteration wraps around at the end of the array.
 *
 * @returns The first value returned by `callback` which is not
 *   equal to `undefined`, or `undefined` if the callback does
 *   not return a value or if the start index is out of range.
 *
 * #### Notes
 * It is not safe to modify the size of the array while iterating.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function logger(value: number): void {
 *   console.log(value);
 * }
 *
 * let data = [1, 2, 3, 4];
 * arrays.rforEach(data, logger);           // logs 4, 3, 2, 1
 * arrays.rforEach(data, logger, 2);        // logs 3, 2, 1
 * arrays.rforEach(data, logger, 2, true);  // logs 3, 2, 1, 4
 * arrays.rforEach(data, (v, i) => {        // 2
 *   if (v === 3) return i;
 * });
 * ```
 * **See also** [[forEach]]
 */
function rforEach(array, callback, fromIndex, wrap) {
    if (fromIndex === void 0) { fromIndex = array.length - 1; }
    if (wrap === void 0) { wrap = false; }
    var start = fromIndex | 0;
    if (start < 0 || start >= array.length) {
        return void 0;
    }
    if (wrap) {
        for (var i = 0, n = array.length; i < n; ++i) {
            var j = (start - i + n) % n;
            var result = callback(array[j], j);
            if (result !== void 0)
                return result;
        }
    }
    else {
        for (var i = start; i >= 0; --i) {
            var result = callback(array[i], i);
            if (result !== void 0)
                return result;
        }
    }
    return void 0;
}
exports.rforEach = rforEach;
/**
 * Find the index of the first value which matches a predicate.
 *
 * @param array - The array of values to be searched.
 *
 * @param pred - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search.
 *
 * @param wrap - Whether the search wraps around at the end of the array.
 *
 * @returns The index of the first matching value, or `-1` if no value
 *   matches the predicate or if the start index is out of range.
 *
 * #### Notes
 * It is not safe to modify the size of the array while iterating.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * arrays.findIndex(data, isEven);           // 1
 * arrays.findIndex(data, isEven, 4);        // 5
 * arrays.findIndex(data, isEven, 6);        // -1
 * arrays.findIndex(data, isEven, 6, true);  // 1
 * ```
 *
 * **See also** [[rfindIndex]].
 */
function findIndex(array, pred, fromIndex, wrap) {
    if (fromIndex === void 0) { fromIndex = 0; }
    if (wrap === void 0) { wrap = false; }
    var start = fromIndex | 0;
    if (start < 0 || start >= array.length) {
        return -1;
    }
    if (wrap) {
        for (var i = 0, n = array.length; i < n; ++i) {
            var j = (start + i) % n;
            if (pred(array[j], j))
                return j;
        }
    }
    else {
        for (var i = start, n = array.length; i < n; ++i) {
            if (pred(array[i], i))
                return i;
        }
    }
    return -1;
}
exports.findIndex = findIndex;
/**
 * Find the index of the last value which matches a predicate.
 *
 * @param array - The array of values to be searched.
 *
 * @param pred - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search.
 *
 * @param wrap - Whether the search wraps around at the front of the array.
 *
 * @returns The index of the last matching value, or `-1` if no value
 *   matches the predicate or if the start index is out of range.
 *
 * #### Notes
 * It is not safe to modify the size of the array while iterating.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * arrays.rfindIndex(data, isEven);           // 5
 * arrays.rfindIndex(data, isEven, 4);        // 3
 * arrays.rfindIndex(data, isEven, 0);        // -1
 * arrays.rfindIndex(data, isEven, 0, true);  // 5
 * ```
 *
 * **See also** [[findIndex]].
 */
function rfindIndex(array, pred, fromIndex, wrap) {
    if (fromIndex === void 0) { fromIndex = array.length - 1; }
    if (wrap === void 0) { wrap = false; }
    var start = fromIndex | 0;
    if (start < 0 || start >= array.length) {
        return -1;
    }
    if (wrap) {
        for (var i = 0, n = array.length; i < n; ++i) {
            var j = (start - i + n) % n;
            if (pred(array[j], j))
                return j;
        }
    }
    else {
        for (var i = start; i >= 0; --i) {
            if (pred(array[i], i))
                return i;
        }
    }
    return -1;
}
exports.rfindIndex = rfindIndex;
/**
 * Find the first value which matches a predicate.
 *
 * @param array - The array of values to be searched.
 *
 * @param pred - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search.
 *
 * @param wrap - Whether the search wraps around at the end of the array.
 *
 * @returns The first matching value, or `undefined` if no value matches
 *   the predicate or if the start index is out of range.
 *
 * #### Notes
 * It is not safe to modify the size of the array while iterating.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * arrays.find(data, isEven);           // 2
 * arrays.find(data, isEven, 4);        // 2
 * arrays.find(data, isEven, 6);        // undefined
 * arrays.find(data, isEven, 6, true);  // 2
 * ```
 *
 * **See also** [[rfind]].
 */
function find(array, pred, fromIndex, wrap) {
    var i = findIndex(array, pred, fromIndex, wrap);
    return i !== -1 ? array[i] : void 0;
}
exports.find = find;
/**
 * Find the last value which matches a predicate.
 *
 * @param array - The array of values to be searched.
 *
 * @param pred - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search.
 *
 * @param wrap - Whether the search wraps around at the front of the array.
 *
 * @returns The last matching value, or `undefined` if no value matches
 *   the predicate or if the start index is out of range.
 *
 * #### Notes
 * The range of visited indices is set before the first invocation of
 * `pred`. It is not safe for `pred` to change the length of `array`.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * arrays.rfind(data, isEven);           // 2
 * arrays.rfind(data, isEven, 4);        // 4
 * arrays.rfind(data, isEven, 0);        // undefined
 * arrays.rfind(data, isEven, 0, true);  // 2
 * ```
 *
 * **See also** [[find]].
 */
function rfind(array, pred, fromIndex, wrap) {
    var i = rfindIndex(array, pred, fromIndex, wrap);
    return i !== -1 ? array[i] : void 0;
}
exports.rfind = rfind;
/**
 * Insert an element into an array at a specified index.
 *
 * @param array - The array of values to modify.
 *
 * @param index - The index at which to insert the value. This value
 *   is clamped to the bounds of the array.
 *
 * @param value - The value to insert into the array.
 *
 * @returns The index at which the value was inserted.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * let data = [0, 1, 2, 3, 4];
 * arrays.insert(data, 0, 12);  // 0
 * arrays.insert(data, 3, 42);  // 3
 * arrays.insert(data, -9, 9);  // 0
 * arrays.insert(data, 12, 8);  // 8
 * console.log(data);           // [9, 12, 0, 1, 42, 2, 3, 4, 8]
 * ```
 *
 * **See also** [[removeAt]] and [[remove]]
 */
function insert(array, index, value) {
    var j = Math.max(0, Math.min(index | 0, array.length));
    for (var i = array.length; i > j; --i) {
        array[i] = array[i - 1];
    }
    array[j] = value;
    return j;
}
exports.insert = insert;
/**
 * Move an element in an array from one index to another.
 *
 * @param array - The array of values to modify.
 *
 * @param fromIndex - The index of the element to move.
 *
 * @param toIndex - The target index of the element.
 *
 * @returns `true` if the element was moved, or `false` if either
 *   index is out of range.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * let data = [0, 1, 2, 3, 4];
 * arrays.move(data, 1, 2);   // true
 * arrays.move(data, -1, 0);  // false
 * arrays.move(data, 4, 2);   // true
 * arrays.move(data, 10, 0);  // false
 * console.log(data);         // [0, 2, 4, 1, 3]
 * ```
 */
function move(array, fromIndex, toIndex) {
    var j = fromIndex | 0;
    if (j < 0 || j >= array.length) {
        return false;
    }
    var k = toIndex | 0;
    if (k < 0 || k >= array.length) {
        return false;
    }
    var value = array[j];
    if (j > k) {
        for (var i = j; i > k; --i) {
            array[i] = array[i - 1];
        }
    }
    else if (j < k) {
        for (var i = j; i < k; ++i) {
            array[i] = array[i + 1];
        }
    }
    array[k] = value;
    return true;
}
exports.move = move;
/**
 * Remove an element from an array at a specified index.
 *
 * @param array - The array of values to modify.
 *
 * @param index - The index of the element to remove.
 *
 * @returns The removed value, or `undefined` if the index is out
 *   of range.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * let data = [0, 1, 2, 3, 4];
 * arrays.removeAt(data, 1);   // 1
 * arrays.removeAt(data, 3);   // 4
 * arrays.removeAt(data, 10);  // undefined
 * console.log(data);          // [0, 2, 3]
 * ```
 *
 * **See also** [[remove]] and [[insert]]
 */
function removeAt(array, index) {
    var j = index | 0;
    if (j < 0 || j >= array.length) {
        return void 0;
    }
    var value = array[j];
    for (var i = j + 1, n = array.length; i < n; ++i) {
        array[i - 1] = array[i];
    }
    array.length -= 1;
    return value;
}
exports.removeAt = removeAt;
/**
 * Remove the first occurrence of a value from an array.
 *
 * @param array - The array of values to modify.
 *
 * @param value - The value to remove from the array.
 *
 * @returns The index where the value was located, or `-1` if the
 *   value is not the array.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * let data = [0, 1, 2, 3, 4];
 * arrays.remove(data, 1);  // 1
 * arrays.remove(data, 3);  // 2
 * arrays.remove(data, 7);  // -1
 * console.log(data);       // [0, 2, 4]
 * ```
 *
 * **See also** [[removeAt]] and [[insert]]
 */
function remove(array, value) {
    var j = -1;
    for (var i = 0, n = array.length; i < n; ++i) {
        if (array[i] === value) {
            j = i;
            break;
        }
    }
    if (j === -1) {
        return -1;
    }
    for (var i = j + 1, n = array.length; i < n; ++i) {
        array[i - 1] = array[i];
    }
    array.length -= 1;
    return j;
}
exports.remove = remove;
/**
 * Reverse an array in-place subject to an optional range.
 *
 * @param array - The array to reverse.
 *
 * @param fromIndex - The index of the first element of the range.
 *   This value will be clamped to the array bounds.
 *
 * @param toIndex - The index of the last element of the range.
 *   This value will be clamped to the array bounds.
 *
 * @returns A reference to the original array.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * let data = [0, 1, 2, 3, 4];
 * arrays.reverse(data, 1, 3);    // [0, 3, 2, 1, 4]
 * arrays.reverse(data, 3);       // [0, 3, 2, 4, 1]
 * arrays.reverse(data);          // [1, 4, 2, 3, 0]
 * ```
 *
 * **See also** [[rotate]]
 */
function reverse(array, fromIndex, toIndex) {
    if (fromIndex === void 0) { fromIndex = 0; }
    if (toIndex === void 0) { toIndex = array.length; }
    var i = Math.max(0, Math.min(fromIndex | 0, array.length - 1));
    var j = Math.max(0, Math.min(toIndex | 0, array.length - 1));
    if (j < i)
        i = j + (j = i, 0);
    while (i < j) {
        var tmpval = array[i];
        array[i++] = array[j];
        array[j--] = tmpval;
    }
    return array;
}
exports.reverse = reverse;
/**
 * Rotate the elements of an array by a positive or negative delta.
 *
 * @param array - The array to rotate.
 *
 * @param delta - The amount of rotation to apply to the elements. A
 *   positive delta will shift the elements to the left. A negative
 *   delta will shift the elements to the right.
 *
 * @returns A reference to the original array.
 *
 * #### Notes
 * This executes in `O(n)` time and `O(1)` space.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * let data = [0, 1, 2, 3, 4];
 * arrays.rotate(data, 2);    // [2, 3, 4, 0, 1]
 * arrays.rotate(data, -2);   // [0, 1, 2, 3, 4]
 * arrays.rotate(data, 10);   // [0, 1, 2, 3, 4]
 * arrays.rotate(data, 9);    // [4, 0, 1, 2, 3]
 * ```
 *
 * **See also** [[reverse]]
 */
function rotate(array, delta) {
    var n = array.length;
    if (n <= 1) {
        return array;
    }
    var d = delta | 0;
    if (d > 0) {
        d = d % n;
    }
    else if (d < 0) {
        d = ((d % n) + n) % n;
    }
    if (d === 0) {
        return array;
    }
    reverse(array, 0, d - 1);
    reverse(array, d, n - 1);
    reverse(array, 0, n - 1);
    return array;
}
exports.rotate = rotate;
/**
 * Using a binary search, find the index of the first element in an
 * array which compares `>=` to a value.
 *
 * @param array - The array of values to be searched. It must be sorted
 *   in ascending order.
 *
 * @param value - The value to locate in the array.
 *
 * @param cmp - The comparison function which returns `true` if an
 *   array element is less than the given value.
 *
 * @returns The index of the first element in `array` which compares
 *   `>=` to `value`, or `array.length` if there is no such element.
 *
 * #### Notes
 * It is not safe for the comparison function to modify the array.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function numberCmp(a: number, b: number): boolean {
 *   return a < b;
 * }
 *
 * let data = [0, 3, 4, 7, 7, 9];
 * arrays.lowerBound(data, 0, numberCmp);   // 0
 * arrays.lowerBound(data, 6, numberCmp);   // 3
 * arrays.lowerBound(data, 7, numberCmp);   // 3
 * arrays.lowerBound(data, -1, numberCmp);  // 0
 * arrays.lowerBound(data, 10, numberCmp);  // 6
 * ```
 *
 * **See also** [[upperBound]]
 */
function lowerBound(array, value, cmp) {
    var begin = 0;
    var half;
    var middle;
    var n = array.length;
    while (n > 0) {
        half = n >> 1;
        middle = begin + half;
        if (cmp(array[middle], value)) {
            begin = middle + 1;
            n -= half + 1;
        }
        else {
            n = half;
        }
    }
    return begin;
}
exports.lowerBound = lowerBound;
/**
 * Using a binary search, find the index of the first element in an
 * array which compares `>` than a value.
 *
 * @param array - The array of values to be searched. It must be sorted
 *   in ascending order.
 *
 * @param value - The value to locate in the array.
 *
 * @param cmp - The comparison function which returns `true` if the
 *   the given value is less than an array element.
 *
 * @returns The index of the first element in `array` which compares
 *   `>` than `value`, or `array.length` if there is no such element.
 *
 * #### Notes
 * It is not safe for the comparison function to modify the array.
 *
 * #### Example
 * ```typescript
 * import * as arrays from 'phosphor-arrays';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a < b;
 * }
 *
 * let data = [0, 3, 4, 7, 7, 9];
 * arrays.upperBound(data, 0, numberCmp);   // 1
 * arrays.upperBound(data, 6, numberCmp);   // 3
 * arrays.upperBound(data, 7, numberCmp);   // 5
 * arrays.upperBound(data, -1, numberCmp);  // 0
 * arrays.upperBound(data, 10, numberCmp);  // 6
 * ```
 *
 * **See also** [[lowerBound]]
 */
function upperBound(array, value, cmp) {
    var begin = 0;
    var half;
    var middle;
    var n = array.length;
    while (n > 0) {
        half = n >> 1;
        middle = begin + half;
        if (cmp(value, array[middle])) {
            n = half;
        }
        else {
            begin = middle + 1;
            n -= half + 1;
        }
    }
    return begin;
}
exports.upperBound = upperBound;

},{}],16:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
/**
 * A disposable object which delegates to a callback.
 */
var DisposableDelegate = (function () {
    /**
     * Construct a new disposable delegate.
     *
     * @param callback - The function to invoke when the delegate is
     *   disposed.
     */
    function DisposableDelegate(callback) {
        this._callback = callback || null;
    }
    Object.defineProperty(DisposableDelegate.prototype, "isDisposed", {
        /**
         * Test whether the delegate has been disposed.
         *
         * #### Notes
         * This is a read-only property which is always safe to access.
         */
        get: function () {
            return this._callback === null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose of the delegate and invoke its callback.
     *
     * #### Notes
     * If this method is called more than once, all calls made after the
     * first will be a no-op.
     */
    DisposableDelegate.prototype.dispose = function () {
        if (this._callback === null) {
            return;
        }
        var callback = this._callback;
        this._callback = null;
        callback();
    };
    return DisposableDelegate;
})();
exports.DisposableDelegate = DisposableDelegate;
/**
 * An object which manages a collection of disposable items.
 */
var DisposableSet = (function () {
    /**
     * Construct a new disposable set.
     *
     * @param items - The initial disposable items for the set.
     */
    function DisposableSet(items) {
        var _this = this;
        this._set = new Set();
        if (items)
            items.forEach(function (item) { _this._set.add(item); });
    }
    Object.defineProperty(DisposableSet.prototype, "isDisposed", {
        /**
         * Test whether the set has been disposed.
         *
         * #### Notes
         * This is a read-only property which is always safe to access.
         */
        get: function () {
            return this._set === null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose of the set and dispose the items it contains.
     *
     * #### Notes
     * Items are disposed in the order they are added to the set.
     *
     * It is unsafe to use the set after it has been disposed.
     *
     * If this method is called more than once, all calls made after the
     * first will be a no-op.
     */
    DisposableSet.prototype.dispose = function () {
        if (this._set === null) {
            return;
        }
        var set = this._set;
        this._set = null;
        set.forEach(function (item) { item.dispose(); });
    };
    /**
     * Add a disposable item to the set.
     *
     * @param item - The disposable item to add to the set. If the item
     *   is already contained in the set, this is a no-op.
     *
     * @throws Will throw an error if the set has been disposed.
     */
    DisposableSet.prototype.add = function (item) {
        if (this._set === null) {
            throw new Error('object is disposed');
        }
        this._set.add(item);
    };
    /**
     * Remove a disposable item from the set.
     *
     * @param item - The disposable item to remove from the set. If the
     *   item does not exist in the set, this is a no-op.
     *
     * @throws Will throw an error if the set has been disposed.
     */
    DisposableSet.prototype.remove = function (item) {
        if (this._set === null) {
            throw new Error('object is disposed');
        }
        this._set.delete(item);
    };
    /**
     * Clear all disposable items from the set.
     *
     * @throws Will throw an error if the set has been disposed.
     */
    DisposableSet.prototype.clear = function () {
        if (this._set === null) {
            throw new Error('object is disposed');
        }
        this._set.clear();
    };
    return DisposableSet;
})();
exports.DisposableSet = DisposableSet;

},{}],17:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
var phosphor_queue_1 = require('phosphor-queue');
/**
 * A mesage which can be sent or posted to a message handler.
 *
 * #### Notes
 * This class may be subclassed to create complex message types.
 *
 * **See Also** [[postMessage]] and [[sendMessage]].
 */
var Message = (function () {
    /**
     * Construct a new message.
     *
     * @param type - The type of the message. Consumers of a message will
     *   use this value to cast the message to the appropriately derived
     *   message type.
     */
    function Message(type) {
        this._type = type;
    }
    Object.defineProperty(Message.prototype, "type", {
        /**
         * Get the type of the message.
         */
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    return Message;
})();
exports.Message = Message;
/**
 * Send a message to the message handler to process immediately.
 *
 * @param handler - The handler which should process the message.
 *
 * @param msg - The message to send to the handler.
 *
 * #### Notes
 * Unlike [[postMessage]], [[sendMessage]] delivers the message to
 * the handler immediately. The handler will not have the opportunity
 * to compress the message, however the message will still be sent
 * through any installed message filters.
 *
 * **See Also** [[postMessage]].
 */
function sendMessage(handler, msg) {
    getDispatcher(handler).sendMessage(handler, msg);
}
exports.sendMessage = sendMessage;
/**
 * Post a message to the message handler to process in the future.
 *
 * @param handler - The handler which should process the message.
 *
 * @param msg - The message to post to the handler.
 *
 * #### Notes
 * Unlike [[sendMessage]], [[postMessage]] will schedule the deliver of
 * the message for the next cycle of the event loop. The handler will
 * have the opportunity to compress the message in order to optimize
 * its handling of similar messages. The message will be sent through
 * any installed message filters before being delivered to the handler.
 *
 * **See Also** [[sendMessage]].
 */
function postMessage(handler, msg) {
    getDispatcher(handler).postMessage(handler, msg);
}
exports.postMessage = postMessage;
/**
 * Test whether a message handler has posted messages pending delivery.
 *
 * @param handler - The message handler of interest.
 *
 * @returns `true` if the handler has pending posted messages, `false`
 *   otherwise.
 *
 * **See Also** [[sendPendingMessage]].
 */
function hasPendingMessages(handler) {
    return getDispatcher(handler).hasPendingMessages();
}
exports.hasPendingMessages = hasPendingMessages;
/**
 * Send the first pending posted message to the message handler.
 *
 * @param handler - The message handler of interest.
 *
 * #### Notes
 * If the handler has no pending messages, this is a no-op.
 *
 * **See Also** [[hasPendingMessages]].
 */
function sendPendingMessage(handler) {
    getDispatcher(handler).sendPendingMessage(handler);
}
exports.sendPendingMessage = sendPendingMessage;
/**
 * Install a message filter for a message handler.
 *
 * A message filter is invoked before the message handler processes a
 * message. If the filter returns `true` from its [[filterMessage]] method,
 * no other filters will be invoked, and the message will not be delivered.
 *
 * The most recently installed message filter is executed first.
 *
 * @param handler - The handler whose messages should be filtered.
 *
 * @param filter - The filter to install for the handler.
 *
 * #### Notes
 * It is possible to install the same filter multiple times. If the
 * filter should be unique, call [[removeMessageFilter]] first.
 *
 * **See Also** [[removeMessageFilter]].
 */
function installMessageFilter(handler, filter) {
    getDispatcher(handler).installMessageFilter(filter);
}
exports.installMessageFilter = installMessageFilter;
/**
 * Remove a previously installed message filter for a message handler.
 *
 * @param handler - The handler for which the filter is installed.
 *
 * @param filter - The filter to remove.
 *
 * #### Notes
 * This will remove **all** occurrences of the filter. If the filter is
 * not installed, this is a no-op.
 *
 * It is safe to call this function while the filter is executing.
 *
 * **See Also** [[installMessageFilter]].
 */
function removeMessageFilter(handler, filter) {
    getDispatcher(handler).removeMessageFilter(filter);
}
exports.removeMessageFilter = removeMessageFilter;
/**
 * Clear all message data associated with the message handler.
 *
 * @param handler - The message handler for which to clear the data.
 *
 * #### Notes
 * This will remove all pending messages and filters for the handler.
 */
function clearMessageData(handler) {
    var dispatcher = dispatcherMap.get(handler);
    if (dispatcher)
        dispatcher.clear();
    dispatchQueue.removeAll(handler);
}
exports.clearMessageData = clearMessageData;
/**
 * The internal mapping of message handler to message dispatcher
 */
var dispatcherMap = new WeakMap();
/**
 * The internal queue of pending message handlers.
 */
var dispatchQueue = new phosphor_queue_1.Queue();
/**
 * The internal animation frame id for the message loop wake up call.
 */
var frameId = void 0;
/**
 * A local reference to an event loop hook.
 */
var raf;
if (typeof requestAnimationFrame === 'function') {
    raf = requestAnimationFrame;
}
else {
    raf = setImmediate;
}
/**
 * Get or create the message dispatcher for a message handler.
 */
function getDispatcher(handler) {
    var dispatcher = dispatcherMap.get(handler);
    if (dispatcher)
        return dispatcher;
    dispatcher = new MessageDispatcher();
    dispatcherMap.set(handler, dispatcher);
    return dispatcher;
}
/**
 * Wake up the message loop to process any pending dispatchers.
 *
 * This is a no-op if a wake up is not needed or is already pending.
 */
function wakeUpMessageLoop() {
    if (frameId === void 0 && !dispatchQueue.empty) {
        frameId = raf(runMessageLoop);
    }
}
/**
 * Run an iteration of the message loop.
 *
 * This will process all pending dispatchers in the queue. Dispatchers
 * which are added to the queue while the message loop is running will
 * be processed on the next message loop cycle.
 */
function runMessageLoop() {
    // Clear the frame id so the next wake up call can be scheduled.
    frameId = void 0;
    // If the queue is empty, there is nothing else to do.
    if (dispatchQueue.empty) {
        return;
    }
    // Add a null sentinel value to the end of the queue. The queue
    // will only be processed up to the first null value. This means
    // that messages posted during this cycle will execute on the next
    // cycle of the loop. If the last value in the array is null, it
    // means that an exception was thrown by a message handler and the
    // loop had to be restarted.
    if (dispatchQueue.back !== null) {
        dispatchQueue.push(null);
    }
    // The message dispatch loop. If the dispatcher is the null sentinel,
    // the processing of the current block of messages is complete and
    // another loop is scheduled. Otherwise, the pending message is
    // dispatched to the message handler.
    while (!dispatchQueue.empty) {
        var handler = dispatchQueue.pop();
        if (handler === null) {
            wakeUpMessageLoop();
            return;
        }
        dispatchMessage(dispatcherMap.get(handler), handler);
    }
}
/**
 * Safely process the pending handler message.
 *
 * If the message handler throws an exception, the message loop will
 * be restarted and the exception will be rethrown.
 */
function dispatchMessage(dispatcher, handler) {
    try {
        dispatcher.sendPendingMessage(handler);
    }
    catch (ex) {
        wakeUpMessageLoop();
        throw ex;
    }
}
/**
 * An internal class which manages message dispatching for a handler.
 */
var MessageDispatcher = (function () {
    function MessageDispatcher() {
        this._filters = null;
        this._messages = null;
    }
    /**
     * Send a message to the handler immediately.
     *
     * The message will first be sent through installed filters.
     */
    MessageDispatcher.prototype.sendMessage = function (handler, msg) {
        if (!this._filterMessage(handler, msg)) {
            handler.processMessage(msg);
        }
    };
    /**
     * Post a message for delivery in the future.
     *
     * The message will first be compressed if possible.
     */
    MessageDispatcher.prototype.postMessage = function (handler, msg) {
        if (!this._compressMessage(handler, msg)) {
            this._enqueueMessage(handler, msg);
        }
    };
    /**
     * Test whether the dispatcher has messages pending delivery.
     */
    MessageDispatcher.prototype.hasPendingMessages = function () {
        return !!(this._messages && !this._messages.empty);
    };
    /**
     * Send the first pending message to the message handler.
     */
    MessageDispatcher.prototype.sendPendingMessage = function (handler) {
        if (this._messages && !this._messages.empty) {
            this.sendMessage(handler, this._messages.pop());
        }
    };
    /**
     * Install a message filter for the dispatcher.
     */
    MessageDispatcher.prototype.installMessageFilter = function (filter) {
        this._filters = { next: this._filters, filter: filter };
    };
    /**
     * Remove all occurrences of a message filter from the dispatcher.
     */
    MessageDispatcher.prototype.removeMessageFilter = function (filter) {
        var link = this._filters;
        var prev = null;
        while (link !== null) {
            if (link.filter === filter) {
                link.filter = null;
            }
            else if (prev === null) {
                this._filters = link;
                prev = link;
            }
            else {
                prev.next = link;
                prev = link;
            }
            link = link.next;
        }
        if (!prev) {
            this._filters = null;
        }
        else {
            prev.next = null;
        }
    };
    /**
     * Clear all messages and filters from the dispatcher.
     */
    MessageDispatcher.prototype.clear = function () {
        if (this._messages) {
            this._messages.clear();
        }
        for (var link = this._filters; link !== null; link = link.next) {
            link.filter = null;
        }
        this._filters = null;
    };
    /**
     * Run the installed message filters for the handler.
     *
     * Returns `true` if the message was filtered, `false` otherwise.
     */
    MessageDispatcher.prototype._filterMessage = function (handler, msg) {
        for (var link = this._filters; link !== null; link = link.next) {
            if (link.filter && link.filter.filterMessage(handler, msg)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Compress the mssage for the given handler.
     *
     * Returns `true` if the message was compressed, `false` otherwise.
     */
    MessageDispatcher.prototype._compressMessage = function (handler, msg) {
        if (!handler.compressMessage) {
            return false;
        }
        if (!this._messages || this._messages.empty) {
            return false;
        }
        return handler.compressMessage(msg, this._messages);
    };
    /**
     * Enqueue the message for future delivery to the handler.
     */
    MessageDispatcher.prototype._enqueueMessage = function (handler, msg) {
        (this._messages || (this._messages = new phosphor_queue_1.Queue())).push(msg);
        dispatchQueue.push(handler);
        wakeUpMessageLoop();
    };
    return MessageDispatcher;
})();

},{"phosphor-queue":20}],18:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
/**
 * A base class for creating objects which wrap a DOM node.
 */
var NodeWrapper = (function () {
    function NodeWrapper() {
        this._node = this.constructor.createNode();
    }
    /**
     * Create the DOM node for a new node wrapper instance.
     *
     * @returns The DOM node to use with the node wrapper instance.
     *
     * #### Notes
     * The default implementation creates an empty `<div>`.
     *
     * This may be reimplemented by a subclass to create a custom node.
     */
    NodeWrapper.createNode = function () {
        return document.createElement('div');
    };
    Object.defineProperty(NodeWrapper.prototype, "node", {
        /**
         * Get the DOM node managed by the wrapper.
         *
         * #### Notes
         * This property is read-only.
         */
        get: function () {
            return this._node;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NodeWrapper.prototype, "id", {
        /**
         * Get the id of the wrapper's DOM node.
         */
        get: function () {
            return this._node.id;
        },
        /**
         * Set the id of the wrapper's DOM node.
         */
        set: function (value) {
            this._node.id = value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Test whether the wrapper's DOM node has the given class name.
     *
     * @param name - The class name of interest.
     *
     * @returns `true` if the node has the class, `false` otherwise.
     */
    NodeWrapper.prototype.hasClass = function (name) {
        return this._node.classList.contains(name);
    };
    /**
     * Add a class name to the wrapper's DOM node.
     *
     * @param name - The class name to add to the node.
     *
     * #### Notes
     * If the class name is already added to the node, this is a no-op.
     */
    NodeWrapper.prototype.addClass = function (name) {
        this._node.classList.add(name);
    };
    /**
     * Remove a class name from the wrapper's DOM node.
     *
     * @param name - The class name to remove from the node.
     *
     * #### Notes
     * If the class name is not yet added to the node, this is a no-op.
     */
    NodeWrapper.prototype.removeClass = function (name) {
        this._node.classList.remove(name);
    };
    /**
     * Toggle a class name on the wrapper's DOM node.
     *
     * @param name - The class name to toggle on the node.
     *
     * @param force - Whether to force add the class (`true`) or force
     *   remove the class (`false`). If not provided, the presence of
     *   the class will be toggled from its current state.
     *
     * @returns `true` if the class is now present, `false` otherwise.
     */
    NodeWrapper.prototype.toggleClass = function (name, force) {
        var present;
        if (force === true) {
            this.addClass(name);
            present = true;
        }
        else if (force === false) {
            this.removeClass(name);
            present = false;
        }
        else if (this.hasClass(name)) {
            this.removeClass(name);
            present = false;
        }
        else {
            this.addClass(name);
            present = true;
        }
        return present;
    };
    return NodeWrapper;
})();
exports.NodeWrapper = NodeWrapper;

},{}],19:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
var phosphor_signaling_1 = require('phosphor-signaling');
/**
 * A property descriptor for a property on an object.
 *
 * Properties descriptors can be used to expose a rich interface for an
 * object which encapsulates value creation, coercion, and notification.
 * They can also be used to extend the state of an object with semantic
 * data from another class.
 *
 * #### Example
 * ```typescript
 * import { Property } from 'phosphor-properties';
 *
 * class MyClass {
 *
 *   static myValueProperty = new Property<MyClass, number>({
 *      value: 0,
 *      coerce: (owner, value) => Math.max(0, value),
 *      changed: (owner, oldValue, newValue) => { console.log(newValue); },
 *   });
 *
 *   get myValue(): number {
 *     return MyClass.myValueProperty.get(this);
 *   }
 *
 *   set myValue(value: number) {
 *     MyClass.myValueProperty.set(this, value);
 *   }
 * }
 * ```
 */
var Property = (function () {
    /**
     * Construct a new property descriptor.
     *
     * @param options - The options for initializing the property.
     */
    function Property(options) {
        if (options === void 0) { options = {}; }
        this._pid = nextPID();
        this._changedSignal = new phosphor_signaling_1.Signal();
        this._value = options.value;
        this._create = options.create;
        this._coerce = options.coerce;
        this._compare = options.compare;
        this._changed = options.changed;
        this._silent = !!options.silent;
        this._metadata = options.metadata || {};
    }
    /**
     * Get the bound changed signal for a given property owner.
     *
     * @param owner - The object to bind to the changed signal.
     *
     * @returns The bound changed signal for the owner.
     *
     * #### Notes
     * This signal will be emitted whenever **any** property value for
     * the specified owner is changed.
     *
     * This signal is emitted **after** the instance changed signal.
     *
     * This signal will not be emmited for properties marked as silent.
     */
    Property.getChanged = function (owner) {
        return Property.changedSignal.bind(owner);
    };
    Object.defineProperty(Property.prototype, "metadata", {
        /**
         * Get the metadata for the property.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._metadata;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "changedSignal", {
        /**
         * A signal emitted when the property value changes.
         *
         * #### Notes
         * This is an attached signal which will be emitted using the owner
         * of the property value as the sender.
         *
         * **See Also:** [[getChanged]]
         */
        get: function () {
            return this._changedSignal;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get the bound changed signal for a given property owner.
     *
     * @param owner - The object to bind to the changed signal.
     *
     * @returns The bound changed signal for the owner.
     *
     * #### Notes
     * This signal will be emitted whenever **this** property value
     * for the specified owner is changed.
     *
     * This signal is emitted **before** the static changed signal.
     *
     * This signal will not be emmited for properties marked as silent.
     */
    Property.prototype.getChanged = function (owner) {
        return this._changedSignal.bind(owner);
    };
    /**
     * Get the current value of the property for a given owner.
     *
     * @param owner - The property owner of interest.
     *
     * @returns The current value of the property.
     *
     * #### Notes
     * If the value has not yet been set, the default value will be
     * computed and assigned as the current value of the property.
     */
    Property.prototype.get = function (owner) {
        var value;
        var hash = lookupHash(owner);
        if (this._pid in hash) {
            value = hash[this._pid];
        }
        else {
            value = hash[this._pid] = this._createValue(owner);
        }
        return value;
    };
    /**
     * Set the current value of the property for a given owner.
     *
     * @param owner - The property owner of interest.
     *
     * @param value - The value for the property.
     *
     * #### Notes
     * If this operation causes the property value to change, the
     * changed signals will be emitted with the owner as sender.
     *
     * If the value has not yet been set, the default value will be
     * computed and used as the previous value for the comparison.
     */
    Property.prototype.set = function (owner, value) {
        var oldValue;
        var hash = lookupHash(owner);
        if (this._pid in hash) {
            oldValue = hash[this._pid];
        }
        else {
            oldValue = hash[this._pid] = this._createValue(owner);
        }
        var newValue = this._coerceValue(owner, value);
        this._maybeNotify(owner, oldValue, hash[this._pid] = newValue);
    };
    /**
     * Explicitly coerce the current property value for a given owner.
     *
     * @param owner - The property owner of interest.
     *
     * #### Notes
     * If this operation causes the property value to change, the
     * changed signals will be emitted with the owner as sender.
     *
     * If the value has not yet been set, the default value will be
     * computed and used as the previous value for the comparison.
     */
    Property.prototype.coerce = function (owner) {
        var oldValue;
        var hash = lookupHash(owner);
        if (this._pid in hash) {
            oldValue = hash[this._pid];
        }
        else {
            oldValue = hash[this._pid] = this._createValue(owner);
        }
        var newValue = this._coerceValue(owner, oldValue);
        this._maybeNotify(owner, oldValue, hash[this._pid] = newValue);
    };
    /**
     * Get or create the default value for the given owner.
     */
    Property.prototype._createValue = function (owner) {
        var create = this._create;
        return create ? create(owner) : this._value;
    };
    /**
     * Coerce the value for the given owner.
     */
    Property.prototype._coerceValue = function (owner, value) {
        var coerce = this._coerce;
        return coerce ? coerce(owner, value) : value;
    };
    /**
     * Compare the old value and new value for equality.
     */
    Property.prototype._compareValue = function (oldValue, newValue) {
        var compare = this._compare;
        return compare ? compare(oldValue, newValue) : oldValue === newValue;
    };
    /**
     * Run the change notification if the given values are different.
     */
    Property.prototype._maybeNotify = function (owner, oldValue, newValue) {
        if (this._compareValue(oldValue, newValue)) {
            return;
        }
        var changed = this._changed;
        if (changed) {
            changed(owner, oldValue, newValue);
        }
        if (this._silent) {
            return;
        }
        var args = { property: this, oldValue: oldValue, newValue: newValue };
        this.getChanged(owner).emit(args);
        Property.getChanged(owner).emit(args);
    };
    /**
     * A signal emitted when a property value changes.
     *
     * #### Notes
     * This is an attached signal which will be emitted using the owner
     * of the property value as the sender.
     *
     * **See Also:** [[getChanged]]
     */
    Property.changedSignal = new phosphor_signaling_1.Signal();
    return Property;
})();
exports.Property = Property;
/**
 * Clear the stored property data for the given property owner.
 *
 * @param owner - The property owner of interest.
 *
 * #### Notes
 * This will clear all property values for the owner, but it will
 * **not** emit any change notifications.
 */
function clearPropertyData(owner) {
    ownerData.delete(owner);
}
exports.clearPropertyData = clearPropertyData;
/**
 * A weak mapping of property owner to property hash.
 */
var ownerData = new WeakMap();
/**
 * A function which computes successive unique property ids.
 */
var nextPID = (function () { var id = 0; return function () { return 'pid-' + id++; }; })();
/**
 * Lookup the data hash for the property owner.
 *
 * This will create the hash if one does not already exist.
 */
function lookupHash(owner) {
    var hash = ownerData.get(owner);
    if (hash !== void 0)
        return hash;
    hash = Object.create(null);
    ownerData.set(owner, hash);
    return hash;
}

},{"phosphor-signaling":21}],20:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
/**
 * A generic FIFO queue data structure.
 *
 * #### Notes
 * This queue is implemented internally using a singly linked list and
 * can grow to arbitrary size.
 *
 * #### Example
 * ```typescript
 * var q = new Queue<number>([0, 1, 2]);
 * q.size;      // 3
 * q.empty;     // false
 * q.pop();     // 0
 * q.pop();     // 1
 * q.push(42);  // undefined
 * q.size;      // 2
 * q.pop();     // 2
 * q.pop();     // 42
 * q.pop();     // undefined
 * q.size;      // 0
 * q.empty;     // true
 * ```
 */
var Queue = (function () {
    /**
     * Construct a new queue.
     *
     * @param items - The initial items for the queue.
     */
    function Queue(items) {
        var _this = this;
        this._size = 0;
        this._front = null;
        this._back = null;
        if (items)
            items.forEach(function (item) { return _this.push(item); });
    }
    Object.defineProperty(Queue.prototype, "size", {
        /**
         * Get the number of elements in the queue.
         *
         * #### Notes
         * This has `O(1)` complexity.
         */
        get: function () {
            return this._size;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "empty", {
        /**
         * Test whether the queue is empty.
         *
         * #### Notes
         * This has `O(1)` complexity.
         */
        get: function () {
            return this._size === 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "front", {
        /**
         * Get the value at the front of the queue.
         *
         * #### Notes
         * This has `O(1)` complexity.
         *
         * If the queue is empty, this value will be `undefined`.
         */
        get: function () {
            return this._front !== null ? this._front.value : void 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "back", {
        /**
         * Get the value at the back of the queue.
         *
         * #### Notes
         * This has `O(1)` complexity.
         *
         * If the queue is empty, this value will be `undefined`.
         */
        get: function () {
            return this._back !== null ? this._back.value : void 0;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Push a value onto the back of the queue.
     *
     * @param value - The value to add to the queue.
     *
     * #### Notes
     * This has `O(1)` complexity.
     */
    Queue.prototype.push = function (value) {
        var link = { next: null, value: value };
        if (this._back === null) {
            this._front = link;
            this._back = link;
        }
        else {
            this._back.next = link;
            this._back = link;
        }
        this._size++;
    };
    /**
     * Pop and return the value at the front of the queue.
     *
     * @returns The value at the front of the queue.
     *
     * #### Notes
     * This has `O(1)` complexity.
     *
     * If the queue is empty, the return value will be `undefined`.
     */
    Queue.prototype.pop = function () {
        var link = this._front;
        if (link === null) {
            return void 0;
        }
        if (link.next === null) {
            this._front = null;
            this._back = null;
        }
        else {
            this._front = link.next;
        }
        this._size--;
        return link.value;
    };
    /**
     * Remove the first occurrence of a value from the queue.
     *
     * @param value - The value to remove from the queue.
     *
     * @returns `true` on success, `false` otherwise.
     *
     * #### Notes
     * This has `O(N)` complexity.
     */
    Queue.prototype.remove = function (value) {
        var link = this._front;
        var prev = null;
        while (link !== null) {
            if (link.value === value) {
                if (prev === null) {
                    this._front = link.next;
                }
                else {
                    prev.next = link.next;
                }
                if (link.next === null) {
                    this._back = prev;
                }
                this._size--;
                return true;
            }
            prev = link;
            link = link.next;
        }
        return false;
    };
    /**
     * Remove all occurrences of a value from the queue.
     *
     * @param value - The value to remove from the queue.
     *
     * @returns The number of occurrences removed.
     *
     * #### Notes
     * This has `O(N)` complexity.
     */
    Queue.prototype.removeAll = function (value) {
        var count = 0;
        var link = this._front;
        var prev = null;
        while (link !== null) {
            if (link.value === value) {
                count++;
                this._size--;
            }
            else if (prev === null) {
                this._front = link;
                prev = link;
            }
            else {
                prev.next = link;
                prev = link;
            }
            link = link.next;
        }
        if (!prev) {
            this._front = null;
            this._back = null;
        }
        else {
            prev.next = null;
            this._back = prev;
        }
        return count;
    };
    /**
     * Remove all values from the queue.
     *
     * #### Notes
     * This has `O(1)` complexity.
     */
    Queue.prototype.clear = function () {
        this._size = 0;
        this._front = null;
        this._back = null;
    };
    /**
     * Create an array from the values in the queue.
     *
     * @returns An array of all values in the queue.
     *
     * #### Notes
     * This has `O(N)` complexity.
     */
    Queue.prototype.toArray = function () {
        var result = new Array(this._size);
        for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
            result[i] = link.value;
        }
        return result;
    };
    /**
     * Test whether any value in the queue passes a predicate function.
     *
     * @param pred - The predicate to apply to the values.
     *
     * @returns `true` if any value in the queue passes the predicate,
     *   or `false` otherwise.
     *
     * #### Notes
     * This has `O(N)` complexity.
     *
     * It is **not** safe for the predicate to modify the queue while
     * iterating.
     */
    Queue.prototype.some = function (pred) {
        for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
            if (pred(link.value, i))
                return true;
        }
        return false;
    };
    /**
     * Test whether all values in the queue pass a predicate function.
     *
     * @param pred - The predicate to apply to the values.
     *
     * @returns `true` if all values in the queue pass the predicate,
     *   or `false` otherwise.
     *
     * #### Notes
     * This has `O(N)` complexity.
     *
     * It is **not** safe for the predicate to modify the queue while
     * iterating.
     */
    Queue.prototype.every = function (pred) {
        for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
            if (!pred(link.value, i))
                return false;
        }
        return true;
    };
    /**
     * Create an array of the values which pass a predicate function.
     *
     * @param pred - The predicate to apply to the values.
     *
     * @returns The array of values which pass the predicate.
     *
     * #### Notes
     * This has `O(N)` complexity.
     *
     * It is **not** safe for the predicate to modify the queue while
     * iterating.
     */
    Queue.prototype.filter = function (pred) {
        var result = [];
        for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
            if (pred(link.value, i))
                result.push(link.value);
        }
        return result;
    };
    /**
     * Create an array of mapped values for the values in the queue.
     *
     * @param callback - The map function to apply to the values.
     *
     * @returns The array of values returned by the map function.
     *
     * #### Notes
     * This has `O(N)` complexity.
     *
     * It is **not** safe for the callback to modify the queue while
     * iterating.
     */
    Queue.prototype.map = function (callback) {
        var result = new Array(this._size);
        for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
            result[i] = callback(link.value, i);
        }
        return result;
    };
    /**
     * Execute a callback for each value in the queue.
     *
     * @param callback - The function to apply to the values.
     *
     * @returns The first value returned by the callback which is not
     *   `undefined`.
     *
     * #### Notes
     * This has `O(N)` complexity.
     *
     * Iteration will terminate immediately if the callback returns any
     * value other than `undefined`.
     *
     * It is **not** safe for the callback to modify the queue while
     * iterating.
     */
    Queue.prototype.forEach = function (callback) {
        for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
            var result = callback(link.value, i);
            if (result !== void 0)
                return result;
        }
        return void 0;
    };
    return Queue;
})();
exports.Queue = Queue;

},{}],21:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
/**
 * An object used for type-safe inter-object communication.
 *
 * Signals provide a type-safe implementation of the publish-subscribe
 * pattern. An object (publisher) declares which signals it will emit,
 * and consumers connect callbacks (subscribers) to those signals. The
 * subscribers are invoked whenever the publisher emits the signal.
 *
 * A `Signal` object must be bound to a sender in order to be useful.
 * A common pattern is to declare a `Signal` object as a static class
 * member, along with a convenience getter which binds the signal to
 * the `this` instance on-demand.
 *
 * #### Example
 * ```typescript
 * import { ISignal, Signal } from 'phosphor-signaling';
 *
 * class MyClass {
 *
 *   static valueChangedSignal = new Signal<MyClass, number>();
 *
 *   constructor(name: string) {
 *     this._name = name;
 *   }
 *
 *   get valueChanged(): ISignal<MyClass, number> {
 *     return MyClass.valueChangedSignal.bind(this);
 *   }
 *
 *   get name(): string {
 *     return this._name;
 *   }
 *
 *   get value(): number {
 *     return this._value;
 *   }
 *
 *   set value(value: number) {
 *     if (value !== this._value) {
 *       this._value = value;
 *       this.valueChanged.emit(value);
 *     }
 *   }
 *
 *   private _name: string;
 *   private _value = 0;
 * }
 *
 * function logger(sender: MyClass, value: number): void {
 *   console.log(sender.name, value);
 * }
 *
 * var m1 = new MyClass('foo');
 * var m2 = new MyClass('bar');
 *
 * m1.valueChanged.connect(logger);
 * m2.valueChanged.connect(logger);
 *
 * m1.value = 42;  // logs: foo 42
 * m2.value = 17;  // logs: bar 17
 * ```
 */
var Signal = (function () {
    function Signal() {
    }
    /**
     * Bind the signal to a specific sender.
     *
     * @param sender - The sender object to bind to the signal.
     *
     * @returns The bound signal object which can be used for connecting,
     *   disconnecting, and emitting the signal.
     */
    Signal.prototype.bind = function (sender) {
        return new BoundSignal(this, sender);
    };
    return Signal;
})();
exports.Signal = Signal;
/**
 * Remove all connections where the given object is the sender.
 *
 * @param sender - The sender object of interest.
 *
 * #### Example
 * ```typescript
 * disconnectSender(someObject);
 * ```
 */
function disconnectSender(sender) {
    var list = senderMap.get(sender);
    if (!list) {
        return;
    }
    var conn = list.first;
    while (conn !== null) {
        removeFromSendersList(conn);
        conn.callback = null;
        conn.thisArg = null;
        conn = conn.nextReceiver;
    }
    senderMap.delete(sender);
}
exports.disconnectSender = disconnectSender;
/**
 * Remove all connections where the given object is the receiver.
 *
 * @param receiver - The receiver object of interest.
 *
 * #### Notes
 * If a `thisArg` is provided when connecting a signal, that object
 * is considered the receiver. Otherwise, the `callback` is used as
 * the receiver.
 *
 * #### Example
 * ```typescript
 * // disconnect a regular object receiver
 * disconnectReceiver(myObject);
 *
 * // disconnect a plain callback receiver
 * disconnectReceiver(myCallback);
 * ```
 */
function disconnectReceiver(receiver) {
    var conn = receiverMap.get(receiver);
    if (!conn) {
        return;
    }
    while (conn !== null) {
        var next = conn.nextSender;
        conn.callback = null;
        conn.thisArg = null;
        conn.prevSender = null;
        conn.nextSender = null;
        conn = next;
    }
    receiverMap.delete(receiver);
}
exports.disconnectReceiver = disconnectReceiver;
/**
 * Clear all signal data associated with the given object.
 *
 * @param obj - The object for which the signal data should be cleared.
 *
 * #### Notes
 * This removes all signal connections where the object is used as
 * either the sender or the receiver.
 *
 * #### Example
 * ```typescript
 * clearSignalData(someObject);
 * ```
 */
function clearSignalData(obj) {
    disconnectSender(obj);
    disconnectReceiver(obj);
}
exports.clearSignalData = clearSignalData;
/**
 * A concrete implementation of ISignal.
 */
var BoundSignal = (function () {
    /**
     * Construct a new bound signal.
     */
    function BoundSignal(signal, sender) {
        this._signal = signal;
        this._sender = sender;
    }
    /**
     * Connect a callback to the signal.
     */
    BoundSignal.prototype.connect = function (callback, thisArg) {
        return connect(this._sender, this._signal, callback, thisArg);
    };
    /**
     * Disconnect a callback from the signal.
     */
    BoundSignal.prototype.disconnect = function (callback, thisArg) {
        return disconnect(this._sender, this._signal, callback, thisArg);
    };
    /**
     * Emit the signal and invoke the connected callbacks.
     */
    BoundSignal.prototype.emit = function (args) {
        emit(this._sender, this._signal, args);
    };
    return BoundSignal;
})();
/**
 * A struct which holds connection data.
 */
var Connection = (function () {
    function Connection() {
        /**
         * The signal for the connection.
         */
        this.signal = null;
        /**
         * The callback connected to the signal.
         */
        this.callback = null;
        /**
         * The `this` context for the callback.
         */
        this.thisArg = null;
        /**
         * The next connection in the singly linked receivers list.
         */
        this.nextReceiver = null;
        /**
         * The next connection in the doubly linked senders list.
         */
        this.nextSender = null;
        /**
         * The previous connection in the doubly linked senders list.
         */
        this.prevSender = null;
    }
    return Connection;
})();
/**
 * The list of receiver connections for a specific sender.
 */
var ConnectionList = (function () {
    function ConnectionList() {
        /**
         * The ref count for the list.
         */
        this.refs = 0;
        /**
         * The first connection in the list.
         */
        this.first = null;
        /**
         * The last connection in the list.
         */
        this.last = null;
    }
    return ConnectionList;
})();
/**
 * A mapping of sender object to its receiver connection list.
 */
var senderMap = new WeakMap();
/**
 * A mapping of receiver object to its sender connection list.
 */
var receiverMap = new WeakMap();
/**
 * Create a connection between a sender, signal, and callback.
 */
function connect(sender, signal, callback, thisArg) {
    // Coerce a `null` thisArg to `undefined`.
    thisArg = thisArg || void 0;
    // Search for an equivalent connection and bail if one exists.
    var list = senderMap.get(sender);
    if (list && findConnection(list, signal, callback, thisArg)) {
        return false;
    }
    // Create a new connection.
    var conn = new Connection();
    conn.signal = signal;
    conn.callback = callback;
    conn.thisArg = thisArg;
    // Add the connection to the receivers list.
    if (!list) {
        list = new ConnectionList();
        list.first = conn;
        list.last = conn;
        senderMap.set(sender, list);
    }
    else if (list.last === null) {
        list.first = conn;
        list.last = conn;
    }
    else {
        list.last.nextReceiver = conn;
        list.last = conn;
    }
    // Add the connection to the senders list.
    var receiver = thisArg || callback;
    var head = receiverMap.get(receiver);
    if (head) {
        head.prevSender = conn;
        conn.nextSender = head;
    }
    receiverMap.set(receiver, conn);
    return true;
}
/**
 * Break the connection between a sender, signal, and callback.
 */
function disconnect(sender, signal, callback, thisArg) {
    // Coerce a `null` thisArg to `undefined`.
    thisArg = thisArg || void 0;
    // Search for an equivalent connection and bail if none exists.
    var list = senderMap.get(sender);
    if (!list) {
        return false;
    }
    var conn = findConnection(list, signal, callback, thisArg);
    if (!conn) {
        return false;
    }
    // Remove the connection from the senders list. It will be removed
    // from the receivers list the next time the signal is emitted.
    removeFromSendersList(conn);
    // Clear the connection data so it becomes a dead connection.
    conn.callback = null;
    conn.thisArg = null;
    return true;
}
/**
 * Emit a signal and invoke the connected callbacks.
 */
function emit(sender, signal, args) {
    var list = senderMap.get(sender);
    if (!list) {
        return;
    }
    list.refs++;
    try {
        var dirty = invokeList(list, sender, signal, args);
    }
    finally {
        list.refs--;
    }
    if (dirty && list.refs === 0) {
        cleanList(list);
    }
}
/**
 * Find a matching connection in the given connection list.
 *
 * Returns `null` if no matching connection is found.
 */
function findConnection(list, signal, callback, thisArg) {
    var conn = list.first;
    while (conn !== null) {
        if (conn.signal === signal &&
            conn.callback === callback &&
            conn.thisArg === thisArg) {
            return conn;
        }
        conn = conn.nextReceiver;
    }
    return null;
}
/**
 * Invoke the callbacks for the matching signals in the list.
 *
 * Connections added during dispatch will not be invoked. This returns
 * `true` if there are dead connections in the list, `false` otherwise.
 */
function invokeList(list, sender, signal, args) {
    var dirty = false;
    var last = list.last;
    var conn = list.first;
    while (conn !== null) {
        if (!conn.callback) {
            dirty = true;
        }
        else if (conn.signal === signal) {
            conn.callback.call(conn.thisArg, sender, args);
        }
        if (conn === last) {
            break;
        }
        conn = conn.nextReceiver;
    }
    return dirty;
}
/**
 * Remove the dead connections from the given connection list.
 */
function cleanList(list) {
    var prev;
    var conn = list.first;
    while (conn !== null) {
        var next = conn.nextReceiver;
        if (!conn.callback) {
            conn.nextReceiver = null;
        }
        else if (!prev) {
            list.first = conn;
            prev = conn;
        }
        else {
            prev.nextReceiver = conn;
            prev = conn;
        }
        conn = next;
    }
    if (!prev) {
        list.first = null;
        list.last = null;
    }
    else {
        prev.nextReceiver = null;
        list.last = prev;
    }
}
/**
 * Remove a connection from the doubly linked list of senders.
 */
function removeFromSendersList(conn) {
    var receiver = conn.thisArg || conn.callback;
    var prev = conn.prevSender;
    var next = conn.nextSender;
    if (prev === null && next === null) {
        receiverMap.delete(receiver);
    }
    else if (prev === null) {
        receiverMap.set(receiver, next);
        next.prevSender = null;
    }
    else if (next === null) {
        prev.nextSender = null;
    }
    else {
        prev.nextSender = next;
        next.prevSender = prev;
    }
    conn.prevSender = null;
    conn.nextSender = null;
}

},{}],22:[function(require,module,exports){
var css = "/*-----------------------------------------------------------------------------\r\n| Copyright (c) 2014-2015, PhosphorJS Contributors\r\n|\r\n| Distributed under the terms of the BSD 3-Clause License.\r\n|\r\n| The full license is in the file LICENSE, distributed with this software.\r\n|----------------------------------------------------------------------------*/\n.p-Widget {\n  box-sizing: border-box;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  overflow: hidden;\n  cursor: default;\n}\n.p-Widget.p-mod-hidden {\n  display: none;\n}\n"; (require("browserify-css").createStyle(css, { "href": "node_modules/phosphor-widget/lib/index.css"})); module.exports = css;
},{"browserify-css":4}],23:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
__export(require('./title'));
__export(require('./widget'));
require('./index.css');

},{"./index.css":22,"./title":24,"./widget":25}],24:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
var phosphor_properties_1 = require('phosphor-properties');
/**
 * An object which holds data related to a widget title.
 */
var Title = (function () {
    function Title() {
    }
    Object.defineProperty(Title.prototype, "text", {
        /**
         * Get the text for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[textProperty]].
         */
        get: function () {
            return Title.textProperty.get(this);
        },
        /**
         * Set the text for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[textProperty]].
         */
        set: function (value) {
            Title.textProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Title.prototype, "icon", {
        /**
         * Get the icon class for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[iconProperty]].
         */
        get: function () {
            return Title.iconProperty.get(this);
        },
        /**
         * Set the icon class for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[iconProperty]].
         */
        set: function (value) {
            Title.iconProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Title.prototype, "editable", {
        /**
         * Get the editable state for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[editableProperty]].
         */
        get: function () {
            return Title.editableProperty.get(this);
        },
        /**
         * Set the editable state for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[editableProperty]].
         */
        set: function (value) {
            Title.editableProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Title.prototype, "editHandler", {
        /**
         * Get the edit handler for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[editHandlerProperty]].
         */
        get: function () {
            return Title.editHandlerProperty.get(this);
        },
        /**
         * Set the edit handler for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[editHandlerProperty]].
         */
        set: function (value) {
            Title.editHandlerProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Title.prototype, "closable", {
        /**
         * Get the closable state for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[closableProperty]].
         */
        get: function () {
            return Title.closableProperty.get(this);
        },
        /**
         * Set the closable state for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[closableProperty]].
         */
        set: function (value) {
            Title.closableProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Title.prototype, "className", {
        /**
         * Get the extra class name for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[classNameProperty]].
         */
        get: function () {
            return Title.classNameProperty.get(this);
        },
        /**
         * Set the extra class name for the title.
         *
         * #### Notes
         * This is a pure delegate to the [[classNameProperty]].
         */
        set: function (value) {
            Title.classNameProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * The property descriptor for the title text.
     *
     * This will be used as the display text in title contexts.
     *
     * The default value is an empty string.
     *
     * **See also:** [[text]]
     */
    Title.textProperty = new phosphor_properties_1.Property({
        value: '',
    });
    /**
     * The property descriptor for the title icon class.
     *
     * This will be added to the class name of the title icon node.
     *
     * Multiple class names can be separated with whitespace.
     *
     * The default value is an empty string.
     *
     * **See also:** [[icon]]
     */
    Title.iconProperty = new phosphor_properties_1.Property({
        value: '',
    });
    /**
     * The property descriptor for the title editable state.
     *
     * This controls whether the title is editable by the user.
     *
     * The default value is `false`.
     *
     * **See also:** [[editable]]
     */
    Title.editableProperty = new phosphor_properties_1.Property({
        value: false,
    });
    /**
     * The property descriptor for the title edit handler.
     *
     * If the title is user editable, this handler will be invoked when
     * the text is edited by the user. The handler should update its own
     * internal state and then update the title text as appropriate. If
     * this is not provided, the title text will be updated directly.
     *
     * The default value is `null`.
     *
     * **See also:** [[editHandler]]
     */
    Title.editHandlerProperty = new phosphor_properties_1.Property({
        value: null,
    });
    /**
     * The property descriptor for the title closable state.
     *
     * This controls whether the title area shows a close icon.
     *
     * The default value is `false`.
     *
     * **See also:** [[closable]]
     */
    Title.closableProperty = new phosphor_properties_1.Property({
        value: false,
    });
    /**
     * The property descriptor for the title extra class name.
     *
     * This will be added to the class name of the title area node.
     *
     * Multiple class names can be separated with whitespace.
     *
     * The default value is an empty string.
     *
     * **See also:** [[className]]
     */
    Title.classNameProperty = new phosphor_properties_1.Property({
        value: '',
    });
    return Title;
})();
exports.Title = Title;

},{"phosphor-properties":19}],25:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var arrays = require('phosphor-arrays');
var phosphor_messaging_1 = require('phosphor-messaging');
var phosphor_nodewrapper_1 = require('phosphor-nodewrapper');
var phosphor_properties_1 = require('phosphor-properties');
var phosphor_signaling_1 = require('phosphor-signaling');
var title_1 = require('./title');
/**
 * The class name added to Widget instances.
 */
var WIDGET_CLASS = 'p-Widget';
/**
 * The class name added to hidden widgets.
 */
var HIDDEN_CLASS = 'p-mod-hidden';
/**
 * The base class of the Phosphor widget hierarchy.
 *
 * #### Notes
 * This class will typically be subclassed in order to create a useful
 * widget. However, it can be used by itself to host foreign content
 * such as a React or Bootstrap component. Simply instantiate an empty
 * widget and add the content directly to its `.node`. The widget and
 * its content can then be embedded within a Phosphor widget hierarchy.
 */
var Widget = (function (_super) {
    __extends(Widget, _super);
    /**
     * Construct a new widget.
     */
    function Widget() {
        _super.call(this);
        this._flags = 0;
        this._parent = null;
        this._children = [];
        this.addClass(WIDGET_CLASS);
    }
    /**
     * Attach a widget to a host DOM node.
     *
     * @param widget - The widget to attach to the DOM.
     *
     * @param host - The node to use as the widget's host.
     *
     * @throws Will throw an error if the widget is not a root widget,
     *   if the widget is already attached to the DOM, or if the host
     *   is not attached to the DOM.
     *
     * #### Notes
     * The function should be used in lieu of manual DOM attachment. It
     * ensures that an `'after-attach'` message is properly dispatched
     * to the widget hierarchy.
     */
    Widget.attach = function (widget, host) {
        if (widget.parent) {
            throw new Error('only a root widget can be attached to the DOM');
        }
        if (widget.isAttached || document.body.contains(widget.node)) {
            throw new Error('widget is already attached to the DOM');
        }
        if (!document.body.contains(host)) {
            throw new Error('host is not attached to the DOM');
        }
        host.appendChild(widget.node);
        phosphor_messaging_1.sendMessage(widget, Widget.MsgAfterAttach);
    };
    /**
     * Detach a widget from its host DOM node.
     *
     * @param widget - The widget to detach from the DOM.
     *
     * @throws Will throw an error if the widget is not a root widget,
     *   or if the widget is not attached to the DOM.
     *
     * #### Notes
     * The function should be used in lieu of manual DOM detachment. It
     * ensures that a `'before-detach'` message is properly dispatched
     * to the widget hierarchy.
     */
    Widget.detach = function (widget) {
        if (widget.parent) {
            throw new Error('only a root widget can be detached from the DOM');
        }
        if (!widget.isAttached || !document.body.contains(widget.node)) {
            throw new Error('widget is not attached to the DOM');
        }
        phosphor_messaging_1.sendMessage(widget, Widget.MsgBeforeDetach);
        widget.node.parentNode.removeChild(widget.node);
    };
    /**
     * Dispose of the widget and its descendant widgets.
     *
     * #### Notes
     * It is generally unsafe to use the widget after it has been
     * disposed.
     *
     * If this method is called more than once, all calls made after
     * the first will be a no-op.
     */
    Widget.prototype.dispose = function () {
        if (this.isDisposed) {
            return;
        }
        this._flags |= WidgetFlag.IsDisposed;
        this.disposed.emit(void 0);
        if (this._parent) {
            this._parent.removeChild(this);
        }
        else if (this.isAttached) {
            Widget.detach(this);
        }
        while (this._children.length > 0) {
            var child = this._children.pop();
            child._parent = null;
            child.dispose();
        }
        phosphor_signaling_1.clearSignalData(this);
        phosphor_messaging_1.clearMessageData(this);
        phosphor_properties_1.clearPropertyData(this);
    };
    Object.defineProperty(Widget.prototype, "disposed", {
        /**
         * A signal emitted when the widget is disposed.
         *
         * #### Notes
         * This is a pure delegate to the [[disposedSignal]].
         */
        get: function () {
            return Widget.disposedSignal.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "isAttached", {
        /**
         * Test whether the widget's node is attached to the DOM.
         *
         * #### Notes
         * This is a read-only property which is always safe to access.
         *
         * **See also:** [[attach]], [[detach]]
         */
        get: function () {
            return (this._flags & WidgetFlag.IsAttached) !== 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "isDisposed", {
        /**
         * Test whether the widget has been disposed.
         *
         * #### Notes
         * This is a read-only property which is always safe to access.
         *
         * **See also:** [[disposed]]
         */
        get: function () {
            return (this._flags & WidgetFlag.IsDisposed) !== 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "isVisible", {
        /**
         * Test whether the widget is visible.
         *
         * #### Notes
         * A widget is visible when it is attached to the DOM, is not
         * explicitly hidden, and has no explicitly hidden ancestors.
         *
         * This is a read-only property which is always safe to access.
         *
         * **See also:** [[hidden]]
         */
        get: function () {
            return (this._flags & WidgetFlag.IsVisible) !== 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "hidden", {
        /**
         * Get whether the widget is explicitly hidden.
         *
         * #### Notes
         * This is a pure delegate to the [[hiddenProperty]].
         *
         * **See also:** [[isVisible]]
         */
        get: function () {
            return Widget.hiddenProperty.get(this);
        },
        /**
         * Set whether the widget is explicitly hidden.
         *
         * #### Notes
         * This is a pure delegate to the [[hiddenProperty]].
         *
         * **See also:** [[isVisible]]
         */
        set: function (value) {
            Widget.hiddenProperty.set(this, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "title", {
        /**
         * Get the title data object for the widget.
         *
         * #### Notes
         * The title data is used by some container widgets when displaying
         * the widget along with a title, such as a tab panel or dock panel.
         *
         * Not all widgets will make use of the title data, so it is created
         * on-demand the first time it is accessed.
         */
        get: function () {
            return getTitle(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "parent", {
        /**
         * Get the parent of the widget.
         *
         * #### Notes
         * This will be `null` if the widget does not have a parent.
         */
        get: function () {
            return this._parent;
        },
        /**
         * Set the parent of the widget.
         *
         * @throws Will throw an error if the widget is the parent.
         *
         * #### Notes
         * If the specified parent is the current parent, this is a no-op.
         *
         * If the specified parent is `null`, this is equivalent to the
         * expression `widget.parent.removeChild(widget)`, otherwise it
         * is equivalent to the expression `parent.addChild(widget)`.
         *
         * **See also:** [[addChild]], [[insertChild]], [[removeChild]]
         */
        set: function (parent) {
            if (parent && parent !== this._parent) {
                parent.addChild(this);
            }
            else if (!parent && this._parent) {
                this._parent.removeChild(this);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "children", {
        /**
         * Get a shallow copy of the array of child widgets.
         *
         * #### Notes
         * When only iterating over the children, it can be faster to use
         * the child query methods, which do not perform a copy.
         *
         * **See also:** [[childCount]], [[childAt]]
         */
        get: function () {
            return this._children.slice();
        },
        /**
         * Set the children of the widget.
         *
         * #### Notes
         * This will clear the current child widgets and add the specified
         * child widgets. Depending on the desired outcome, it can be more
         * efficient to use one of the child manipulation methods.
         *
         * **See also:** [[addChild]], [[insertChild]], [[removeChild]]
         */
        set: function (children) {
            var _this = this;
            this.clearChildren();
            children.forEach(function (child) { _this.addChild(child); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Widget.prototype, "childCount", {
        /**
         * Get the number of children of the widget.
         *
         * #### Notes
         * This is a read-only property.
         *
         * **See also:** [[children]], [[childAt]]
         */
        get: function () {
            return this._children.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get the child widget at a specific index.
     *
     * @param index - The index of the child of interest.
     *
     * @returns The child widget at the specified index, or `undefined`
     *  if the index is out of range.
     *
     * **See also:** [[childCount]], [[childIndex]]
     */
    Widget.prototype.childAt = function (index) {
        return this._children[index | 0];
    };
    /**
     * Get the index of a specific child widget.
     *
     * @param child - The child widget of interest.
     *
     * @returns The index of the specified child widget, or `-1` if
     *   the widget is not a child of this widget.
     *
     * **See also:** [[childCount]], [[childAt]]
     */
    Widget.prototype.childIndex = function (child) {
        return this._children.indexOf(child);
    };
    /**
     * Add a child widget to the end of the widget's children.
     *
     * @param child - The child widget to add to this widget.
     *
     * @returns The new index of the child.
     *
     * @throws Will throw an error if a widget is added to itself.
     *
     * #### Notes
     * The child will be automatically removed from its current parent
     * before being added to this widget.
     *
     * **See also:** [[insertChild]], [[moveChild]]
     */
    Widget.prototype.addChild = function (child) {
        return this.insertChild(this._children.length, child);
    };
    /**
     * Insert a child widget at a specific index.
     *
     * @param index - The target index for the widget. This will be
     *   clamped to the bounds of the children.
     *
     * @param child - The child widget to insert into the widget.
     *
     * @returns The new index of the child.
     *
     * @throws Will throw an error if a widget is inserted into itself.
     *
     * #### Notes
     * The child will be automatically removed from its current parent
     * before being added to this widget.
     *
     * **See also:** [[addChild]], [[moveChild]]
     */
    Widget.prototype.insertChild = function (index, child) {
        if (child === this) {
            throw new Error('invalid child widget');
        }
        if (child._parent) {
            child._parent.removeChild(child);
        }
        else if (child.isAttached) {
            Widget.detach(child);
        }
        child._parent = this;
        var i = arrays.insert(this._children, index, child);
        phosphor_messaging_1.sendMessage(this, new ChildMessage('child-added', child, -1, i));
        return i;
    };
    /**
     * Move a child widget from one index to another.
     *
     * @param fromIndex - The index of the child of interest.
     *
     * @param toIndex - The target index for the child.
     *
     * @returns 'true' if the child was moved, or `false` if either
     *   of the given indices are out of range.
     *
     * #### Notes
     * This method can be more efficient than re-inserting an existing
     * child, as some widgets may be able to optimize child moves and
     * avoid making unnecessary changes to the DOM.
     *
     * **See also:** [[addChild]], [[insertChild]]
     */
    Widget.prototype.moveChild = function (fromIndex, toIndex) {
        var i = fromIndex | 0;
        var j = toIndex | 0;
        if (!arrays.move(this._children, i, j)) {
            return false;
        }
        if (i !== j) {
            var child = this._children[j];
            phosphor_messaging_1.sendMessage(this, new ChildMessage('child-moved', child, i, j));
        }
        return true;
    };
    /**
     * Remove the child widget at a specific index.
     *
     * @param index - The index of the child of interest.
     *
     * @returns The removed child widget, or `undefined` if the index
     *   is out of range.
     *
     * **See also:** [[removeChild]], [[clearChildren]]
     */
    Widget.prototype.removeChildAt = function (index) {
        var i = index | 0;
        var child = arrays.removeAt(this._children, i);
        if (child) {
            child._parent = null;
            phosphor_messaging_1.sendMessage(this, new ChildMessage('child-removed', child, i, -1));
        }
        return child;
    };
    /**
     * Remove a specific child widget from this widget.
     *
     * @param child - The child widget of interest.
     *
     * @returns The index which the child occupied, or `-1` if the
     *   child is not a child of this widget.
     *
     * **See also:** [[removeChildAt]], [[clearChildren]]
     */
    Widget.prototype.removeChild = function (child) {
        var i = this.childIndex(child);
        if (i !== -1)
            this.removeChildAt(i);
        return i;
    };
    /**
     * Remove all child widgets from the widget.
     *
     * #### Notes
     * This will continue to remove children until the `childCount`
     * reaches zero. It is therefore possible to enter an infinite
     * loop if a message handler causes a child widget to be added
     * in response to one being removed.
     *
     * **See also:** [[removeChild]], [[removeChildAt]]
     */
    Widget.prototype.clearChildren = function () {
        while (this.childCount > 0) {
            this.removeChildAt(this.childCount - 1);
        }
    };
    /**
     * Dispatch an `'update-request'` message to the widget.
     *
     * @param immediate - Whether to dispatch the message immediately
     *   (`true`) or in the future (`false`). The default is `false`.
     *
     * **See also:** [[MsgUpdateRequest]], [[onUpdateRequest]]
     */
    Widget.prototype.update = function (immediate) {
        if (immediate === void 0) { immediate = false; }
        if (immediate) {
            phosphor_messaging_1.sendMessage(this, Widget.MsgUpdateRequest);
        }
        else {
            phosphor_messaging_1.postMessage(this, Widget.MsgUpdateRequest);
        }
    };
    /**
     * Dispatch a `'close-request'` message to the widget.
     *
     * @param immediate - Whether to dispatch the message immediately
     *   (`true`) or in the future (`false`). The default is `false`.
     *
     * **See also:** [[MsgCloseRequest]], [[onCloseRequest]]
     */
    Widget.prototype.close = function (immediate) {
        if (immediate === void 0) { immediate = false; }
        if (immediate) {
            phosphor_messaging_1.sendMessage(this, Widget.MsgCloseRequest);
        }
        else {
            phosphor_messaging_1.postMessage(this, Widget.MsgCloseRequest);
        }
    };
    /**
     * Process a message sent to the widget.
     *
     * @param msg - The message sent to the widget.
     *
     * #### Notes
     * Subclasses may reimplement this method as needed.
     */
    Widget.prototype.processMessage = function (msg) {
        switch (msg.type) {
            case 'resize':
                this.onResize(msg);
                break;
            case 'update-request':
                this.onUpdateRequest(msg);
                break;
            case 'layout-request':
                this.onLayoutRequest(msg);
                break;
            case 'child-added':
                this.onChildAdded(msg);
                break;
            case 'child-removed':
                this.onChildRemoved(msg);
                break;
            case 'child-moved':
                this.onChildMoved(msg);
                break;
            case 'after-show':
                this._flags |= WidgetFlag.IsVisible;
                this.onAfterShow(msg);
                sendToShown(this._children, msg);
                break;
            case 'before-hide':
                this.onBeforeHide(msg);
                sendToShown(this._children, msg);
                this._flags &= ~WidgetFlag.IsVisible;
                break;
            case 'after-attach':
                var visible = !this.hidden && (!this._parent || this._parent.isVisible);
                if (visible)
                    this._flags |= WidgetFlag.IsVisible;
                this._flags |= WidgetFlag.IsAttached;
                this.onAfterAttach(msg);
                sendToAll(this._children, msg);
                break;
            case 'before-detach':
                this.onBeforeDetach(msg);
                sendToAll(this._children, msg);
                this._flags &= ~WidgetFlag.IsVisible;
                this._flags &= ~WidgetFlag.IsAttached;
                break;
            case 'child-shown':
                this.onChildShown(msg);
                break;
            case 'child-hidden':
                this.onChildHidden(msg);
                break;
            case 'close-request':
                this.onCloseRequest(msg);
                break;
        }
    };
    /**
     * Compress a message posted to the widget.
     *
     * @param msg - The message posted to the widget.
     *
     * @param pending - The queue of pending messages for the widget.
     *
     * @returns `true` if the message was compressed and should be
     *   dropped, or `false` if the message should be enqueued for
     *   delivery as normal.
     *
     * #### Notes
     * The default implementation compresses the following messages:
     * `'update-request'`, `'layout-request'`, and `'close-request'`.
     *
     * Subclasses may reimplement this method as needed.
     */
    Widget.prototype.compressMessage = function (msg, pending) {
        switch (msg.type) {
            case 'update-request':
            case 'layout-request':
            case 'close-request':
                return pending.some(function (other) { return other.type === msg.type; });
        }
        return false;
    };
    /**
     * A message handler invoked on a `'child-added'` message.
     *
     * #### Notes
     * The default implementation adds the child node to the widget
     * node at the proper location and dispatches an `'after-attach'`
     * message if appropriate.
     *
     * Subclasses may reimplement this method to control how the child
     * node is added, but they must dispatch an `'after-attach'` message
     * if appropriate.
     */
    Widget.prototype.onChildAdded = function (msg) {
        var next = this.childAt(msg.currentIndex + 1);
        this.node.insertBefore(msg.child.node, next && next.node);
        if (this.isAttached)
            phosphor_messaging_1.sendMessage(msg.child, Widget.MsgAfterAttach);
    };
    /**
     * A message handler invoked on a `'child-removed'` message.
     *
     * #### Notes
     * The default implementation removes the child node from the widget
     * node and dispatches a `'before-detach'` message if appropriate.
     *
     * Subclasses may reimplement this method to control how the child
     * node is removed, but they must  dispatch a `'before-detach'`
     * message if appropriate.
     */
    Widget.prototype.onChildRemoved = function (msg) {
        if (this.isAttached)
            phosphor_messaging_1.sendMessage(msg.child, Widget.MsgBeforeDetach);
        this.node.removeChild(msg.child.node);
    };
    /**
     * A message handler invoked on a `'child-moved'` message.
     *
     * #### Notes
     * The default implementation moves the child node to the proper
     * location in the widget node and dispatches a `'before-detach'`
     * and `'after-attach'` message if appropriate.
     *
     * Subclasses may reimplement this method to control how the child
     * node is moved, but they must dispatch a `'before-detach'` and
     * `'after-attach'` message if appropriate.
     */
    Widget.prototype.onChildMoved = function (msg) {
        if (this.isAttached)
            phosphor_messaging_1.sendMessage(msg.child, Widget.MsgBeforeDetach);
        var next = this.childAt(msg.currentIndex + 1);
        this.node.insertBefore(msg.child.node, next && next.node);
        if (this.isAttached)
            phosphor_messaging_1.sendMessage(msg.child, Widget.MsgAfterAttach);
    };
    /**
     * A message handler invoked on a `'resize'` message.
     *
     * #### Notes
     * The default implementation of this handler sends an [[UnknownSize]]
     * resize message to each child. This ensures that the resize messages
     * propagate through all widgets in the hierarchy.
     *
     * Subclasses may reimplement this method as needed, but they must
     * dispatch `'resize'` messages to their children as appropriate.
     */
    Widget.prototype.onResize = function (msg) {
        sendToAll(this._children, ResizeMessage.UnknownSize);
    };
    /**
     * A message handler invoked on an `'update-request'` message.
     *
     * #### Notes
     * The default implementation of this handler sends an [[UnknownSize]]
     * resize message to each child. This ensures that the resize messages
     * propagate through all widgets in the hierarchy.
     *
     * Subclass may reimplement this method as needed, but they should
     * dispatch `'resize'` messages to their children as appropriate.
     *
     * **See also:** [[update]], [[MsgUpdateRequest]]
     */
    Widget.prototype.onUpdateRequest = function (msg) {
        sendToAll(this._children, ResizeMessage.UnknownSize);
    };
    /**
     * A message handler invoked on a `'close-request'` message.
     *
     * #### Notes
     * The default implementation of this handler will unparent or detach
     * the widget as appropriate. Subclasses may reimplement this handler
     * for custom close behavior.
     *
     * **See also:** [[close]], [[MsgCloseRequest]]
     */
    Widget.prototype.onCloseRequest = function (msg) {
        if (this._parent) {
            this._parent.removeChild(this);
        }
        else if (this.isAttached) {
            Widget.detach(this);
        }
    };
    /**
     * A message handler invoked on a `'layout-request'` message.
     *
     * The default implementation of this handler is a no-op.
     *
     * **See also:** [[MsgLayoutRequest]]
     */
    Widget.prototype.onLayoutRequest = function (msg) { };
    /**
     * A message handler invoked on an `'after-show'` message.
     *
     * The default implementation of this handler is a no-op.
     *
     * **See also:** [[MsgAfterShow]]
     */
    Widget.prototype.onAfterShow = function (msg) { };
    /**
     * A message handler invoked on a `'before-hide'` message.
     *
     * The default implementation of this handler is a no-op.
     *
     * **See also:** [[MsgBeforeHide]]
     */
    Widget.prototype.onBeforeHide = function (msg) { };
    /**
     * A message handler invoked on an `'after-attach'` message.
     *
     * The default implementation of this handler is a no-op.
     *
     * **See also:** [[MsgAfterAttach]]
     */
    Widget.prototype.onAfterAttach = function (msg) { };
    /**
     * A message handler invoked on a `'before-detach'` message.
     *
     * The default implementation of this handler is a no-op.
     *
     * **See also:** [[MsgBeforeDetach]]
     */
    Widget.prototype.onBeforeDetach = function (msg) { };
    /**
     * A message handler invoked on a `'child-shown'` message.
     *
     * The default implementation of this handler is a no-op.
     */
    Widget.prototype.onChildShown = function (msg) { };
    /**
     * A message handler invoked on a `'child-hidden'` message.
     *
     * The default implementation of this handler is a no-op.
     */
    Widget.prototype.onChildHidden = function (msg) { };
    /**
     * A singleton `'update-request'` message.
     *
     * #### Notes
     * This message can be dispatched to supporting widgets in order to
     * update their content. Not all widgets will respond to messages of
     * this type.
     *
     * This message is typically used to update the position and size of
     * a widget's children, or to update a widget's content to reflect the
     * current state of the widget.
     *
     * Messages of this type are compressed by default.
     *
     * **See also:** [[update]], [[onUpdateRequest]]
     */
    Widget.MsgUpdateRequest = new phosphor_messaging_1.Message('update-request');
    /**
     * A singleton `'layout-request'` message.
     *
     * #### Notes
     * This message can be dispatched to supporting widgets in order to
     * update their layout. Not all widgets will respond to messages of
     * this type.
     *
     * This message is typically used to update the size contraints of
     * a widget and to update the position and size of its children.
     *
     * Messages of this type are compressed by default.
     *
     * **See also:** [[onLayoutRequest]]
     */
    Widget.MsgLayoutRequest = new phosphor_messaging_1.Message('layout-request');
    /**
     * A singleton `'close-request'` message.
     *
     * #### Notes
     * This message should be dispatched to a widget when it should close
     * and remove itself from the widget hierarchy.
     *
     * Messages of this type are compressed by default.
     *
     * **See also:** [[close]], [[onCloseRequest]]
     */
    Widget.MsgCloseRequest = new phosphor_messaging_1.Message('close-request');
    /**
     * A singleton `'after-show'` message.
     *
     * #### Notes
     * This message is sent to a widget when it becomes visible.
     *
     * This message is **not** sent when the widget is attached.
     *
     * **See also:** [[isVisible]], [[onAfterShow]]
     */
    Widget.MsgAfterShow = new phosphor_messaging_1.Message('after-show');
    /**
     * A singleton `'before-hide'` message.
     *
     * #### Notes
     * This message is sent to a widget when it becomes not-visible.
     *
     * This message is **not** sent when the widget is detached.
     *
     * **See also:** [[isVisible]], [[onBeforeHide]]
     */
    Widget.MsgBeforeHide = new phosphor_messaging_1.Message('before-hide');
    /**
     * A singleton `'after-attach'` message.
     *
     * #### Notes
     * This message is sent to a widget after it is attached to the DOM.
     *
     * **See also:** [[isAttached]], [[onAfterAttach]]
     */
    Widget.MsgAfterAttach = new phosphor_messaging_1.Message('after-attach');
    /**
     * A singleton `'before-detach'` message.
     *
     * #### Notes
     * This message is sent to a widget before it is detached from the DOM.
     *
     * **See also:** [[isAttached]], [[onBeforeDetach]]
     */
    Widget.MsgBeforeDetach = new phosphor_messaging_1.Message('before-detach');
    /**
     * A signal emitted when the widget is disposed.
     *
     * **See also:** [[disposed]], [[isDisposed]]
     */
    Widget.disposedSignal = new phosphor_signaling_1.Signal();
    /**
     * A property descriptor which controls the hidden state of a widget.
     *
     * #### Notes
     * This property controls whether a widget is explicitly hidden.
     *
     * Hiding a widget will cause the widget and all of its descendants
     * to become not-visible.
     *
     * This property will toggle the presence of `'p-mod-hidden'` on a
     * widget. It will also dispatch `'after-show'` and `'before-hide'`
     * messages as appropriate.
     *
     * The default property value is `false`.
     *
     * **See also:** [[hidden]], [[isVisible]]
     */
    Widget.hiddenProperty = new phosphor_properties_1.Property({
        value: false,
        changed: onHiddenChanged,
    });
    return Widget;
})(phosphor_nodewrapper_1.NodeWrapper);
exports.Widget = Widget;
/**
 * A message class for child-related messages.
 */
var ChildMessage = (function (_super) {
    __extends(ChildMessage, _super);
    /**
     * Construct a new child message.
     *
     * @param type - The message type.
     *
     * @param child - The child widget for the message.
     *
     * @param previousIndex - The previous index of the child, if known.
     *   The default index is `-1` and indicates an unknown index.
     *
     * @param currentIndex - The current index of the child, if known.
     *   The default index is `-1` and indicates an unknown index.
     */
    function ChildMessage(type, child, previousIndex, currentIndex) {
        if (previousIndex === void 0) { previousIndex = -1; }
        if (currentIndex === void 0) { currentIndex = -1; }
        _super.call(this, type);
        this._child = child;
        this._currentIndex = currentIndex;
        this._previousIndex = previousIndex;
    }
    Object.defineProperty(ChildMessage.prototype, "child", {
        /**
         * The child widget for the message.
         *
         * #### Notes
         * This is a read-only property.
         */
        get: function () {
            return this._child;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChildMessage.prototype, "currentIndex", {
        /**
         * The current index of the child.
         *
         * #### Notes
         * This will be `-1` if the current index is unknown.
         *
         * This is a read-only property.
         */
        get: function () {
            return this._currentIndex;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChildMessage.prototype, "previousIndex", {
        /**
         * The previous index of the child.
         *
         * #### Notes
         * This will be `-1` if the previous index is unknown.
         *
         * This is a read-only property.
         */
        get: function () {
            return this._previousIndex;
        },
        enumerable: true,
        configurable: true
    });
    return ChildMessage;
})(phosphor_messaging_1.Message);
exports.ChildMessage = ChildMessage;
/**
 * A message class for `'resize'` messages.
 */
var ResizeMessage = (function (_super) {
    __extends(ResizeMessage, _super);
    /**
     * Construct a new resize message.
     *
     * @param width - The **offset width** of the widget, or `-1` if
     *   the width is not known.
     *
     * @param height - The **offset height** of the widget, or `-1` if
     *   the height is not known.
     */
    function ResizeMessage(width, height) {
        _super.call(this, 'resize');
        this._width = width;
        this._height = height;
    }
    Object.defineProperty(ResizeMessage.prototype, "width", {
        /**
         * The offset width of the widget.
         *
         * #### Notes
         * This will be `-1` if the width is unknown.
         *
         * This is a read-only property.
         */
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResizeMessage.prototype, "height", {
        /**
         * The offset height of the widget.
         *
         * #### Notes
         * This will be `-1` if the height is unknown.
         *
         * This is a read-only property.
         */
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * A singleton `'resize'` message with an unknown size.
     */
    ResizeMessage.UnknownSize = new ResizeMessage(-1, -1);
    return ResizeMessage;
})(phosphor_messaging_1.Message);
exports.ResizeMessage = ResizeMessage;
/**
 * An enum of widget bit flags.
 */
var WidgetFlag;
(function (WidgetFlag) {
    /**
     * The widget is attached to the DOM.
     */
    WidgetFlag[WidgetFlag["IsAttached"] = 1] = "IsAttached";
    /**
     * The widget is visible.
     */
    WidgetFlag[WidgetFlag["IsVisible"] = 2] = "IsVisible";
    /**
     * The widget has been disposed.
     */
    WidgetFlag[WidgetFlag["IsDisposed"] = 4] = "IsDisposed";
})(WidgetFlag || (WidgetFlag = {}));
/**
 * A private attached property for the title data for a widget.
 */
var titleProperty = new phosphor_properties_1.Property({
    create: function () { return new title_1.Title(); },
});
/**
 * Lookup the title data for the given widget.
 */
function getTitle(widget) {
    return titleProperty.get(widget);
}
/**
 * The change handler for the [[hiddenProperty]].
 */
function onHiddenChanged(owner, old, hidden) {
    if (hidden) {
        if (owner.isAttached && (!owner.parent || owner.parent.isVisible)) {
            phosphor_messaging_1.sendMessage(owner, Widget.MsgBeforeHide);
        }
        owner.addClass(HIDDEN_CLASS);
        if (owner.parent) {
            phosphor_messaging_1.sendMessage(owner.parent, new ChildMessage('child-hidden', owner));
        }
    }
    else {
        owner.removeClass(HIDDEN_CLASS);
        if (owner.isAttached && (!owner.parent || owner.parent.isVisible)) {
            phosphor_messaging_1.sendMessage(owner, Widget.MsgAfterShow);
        }
        if (owner.parent) {
            phosphor_messaging_1.sendMessage(owner.parent, new ChildMessage('child-shown', owner));
        }
    }
}
/**
 * Send a message to all widgets in an array.
 */
function sendToAll(widgets, msg) {
    widgets.forEach(function (w) { phosphor_messaging_1.sendMessage(w, msg); });
}
/**
 * Send a message to all non-hidden widgets in an array.
 */
function sendToShown(widgets, msg) {
    widgets.forEach(function (w) { if (!w.hidden)
        phosphor_messaging_1.sendMessage(w, msg); });
}

},{"./title":24,"phosphor-arrays":15,"phosphor-messaging":17,"phosphor-nodewrapper":18,"phosphor-properties":19,"phosphor-signaling":21}],26:[function(require,module,exports){
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';
var phosphor_widget_1 = require('phosphor-widget');
var index_1 = require('../lib/index');
require('./index.css');
function main() {
    var fileBrowser = new index_1.FileBrowser('http://localhost:8888', '');
    phosphor_widget_1.Widget.attach(fileBrowser, document.body);
    fileBrowser.listDirectory();
    fileBrowser.onClick = function (name, contents) {
        console.log(name);
    };
    window.onresize = function () { return fileBrowser.update(); };
}
window.onload = main;

},{"../lib/index":3,"./index.css":1,"phosphor-widget":23}]},{},[26]);
