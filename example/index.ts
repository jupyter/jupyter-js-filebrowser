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
  FileBrowser, IFileBrowserViewModel, IContentsItem, ContentsItemType
} from 'jupyter-js-filebrowser';


function main(): void {

  let baseUrl = 'http://localhost:8888'

  let contents = new Contents(baseUrl);

  let items: IContentsItem[] = [];

  let listSessions = function() {
    return listRunningSessions(baseUrl);
  }

  let connectSession = function(id: string, options: ISessionOptions) {
    return connectToSession(id, options);
  }

  let fbModel = {
    listRunningSessions: listSessions,
    connectToSession: connectSession,
    contents: contents,
    currentDirectory: '',
    selectedItems: items
  }

  let fileBrowser = new FileBrowser(fbModel);

  var editorModel = new EditorModel();
  let editor = new EditorWidget(editorModel);

  fileBrowser.itemsOpened.connect((fb, items) => {
    if (items[0].type === ContentsItemType.File) {
      fileBrowser.get(items[0]).then(contents => {
        (editor as any)._editor.getDoc().setValue(contents);
      });
    }
  });

  let panel = new SplitPanel();
  panel.children.assign([fileBrowser, editor]);

  Widget.attach(panel, document.body);

  window.onresize = () => panel.update();
}


main();
