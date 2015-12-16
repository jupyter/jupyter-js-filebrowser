/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  EditorModel, EditorWidget
} from 'jupyter-js-editor';

import {
  FileBrowser, FileBrowserViewModel
} from 'jupyter-js-filebrowser';

import {
  Contents, ISessionOptions, connectToSession, listRunningSessions
} from 'jupyter-js-services';

import {
  SplitPanel
} from 'phosphor-splitpanel';

import {
  Widget
} from 'phosphor-widget';


function main(): void {

  let baseUrl = 'http://localhost:8888'
  let contents = new Contents(baseUrl);

  let fbModel = new FileBrowserViewModel('', contents);
  let fileBrowser = new FileBrowser(fbModel);

  var editorModel = new EditorModel();
  let editor = new EditorWidget(editorModel);


  fbModel.opened.connect((fb, item) => {
    if (item.type === 'file') {
      (editor as any)._editor.getDoc().setValue(item.content);
    }
  });

  let panel = new SplitPanel();
  panel.addChild(fileBrowser);
  panel.addChild(editor);

  panel.attach(document.body);

  window.onresize = () => panel.update();
}


main();
