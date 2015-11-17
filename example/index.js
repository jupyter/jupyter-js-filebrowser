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
