/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';
var jupyter_js_editor_1 = require('jupyter-js-editor');
var jupyter_js_filebrowser_1 = require('jupyter-js-filebrowser');
var jupyter_js_services_1 = require('jupyter-js-services');
var phosphor_splitpanel_1 = require('phosphor-splitpanel');
function main() {
    var baseUrl = 'http://localhost:8888';
    var contents = new jupyter_js_services_1.Contents(baseUrl);
    var fbModel = new jupyter_js_filebrowser_1.FileBrowserViewModel('', contents);
    var fileBrowser = new jupyter_js_filebrowser_1.FileBrowser(fbModel);
    var editorModel = new jupyter_js_editor_1.EditorModel();
    var editor = new jupyter_js_editor_1.EditorWidget(editorModel);
    fbModel.opened.connect(function (fb, item) {
        if (item.type === 'file') {
            editor._editor.getDoc().setValue(item.content);
        }
    });
    var panel = new phosphor_splitpanel_1.SplitPanel();
    panel.addChild(fileBrowser);
    panel.addChild(editor);
    panel.attach(document.body);
    window.onresize = function () { return panel.update(); };
}
main();
