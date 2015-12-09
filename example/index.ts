/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  Contents, listRunningSessions, connectToSession, ISessionOptions
} from 'jupyter-js-services';

import {
  EditorModel, EditorWidget
} from 'jupyter-js-editor';

import {
  SplitPanel
} from 'phosphor-splitpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowser, FileBrowserViewModel
} from 'jupyter-js-filebrowser';


function main(): void {

  let baseUrl = 'http://localhost:8888'
  let contents = new Contents(baseUrl);

  let fbModel = new FileBrowserViewModel(contents);
  let fileBrowser = new FileBrowser(fbModel);

  var editorModel = new EditorModel();
  let editor = new EditorWidget(editorModel);


  fbModel.opened.connect((fb, item) => {
    if (item.type === 'file') {
      (editor as any)._editor.getDoc().setValue(item.content);
    }
  });

  let panel = new SplitPanel();
  panel.children.assign([fileBrowser, editor]);

  Widget.attach(panel, document.body);

  window.onresize = () => panel.update();
}


main();
