/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';
var jupyter_js_services_1 = require('jupyter-js-services');
var phosphor_widget_1 = require('phosphor-widget');
var index_1 = require('../lib/index');
require('./index.css');
function main() {
    var baseUrl = 'http://localhost:8888';
    var contents = new jupyter_js_services_1.Contents(baseUrl);
    var items = [];
    var listSessions = function () {
        return jupyter_js_services_1.listRunningSessions(baseUrl);
    };
    var connectSession = function (id) {
        var options = {
            baseUrl: baseUrl,
            notebookPath: 'foo.ipynb',
            kernelName: 'baz'
        };
        return jupyter_js_services_1.connectToSession(id, options);
    };
    var model = {
        listRunningSessions: listSessions,
        connectToSession: connectSession,
        contents: contents,
        currentDirectory: '',
        selectedItems: items
    };
    var fileBrowser = new index_1.FileBrowser(model);
    phosphor_widget_1.Widget.attach(fileBrowser, document.body);
    window.onresize = function () { return fileBrowser.update(); };
}
window.onload = main;
