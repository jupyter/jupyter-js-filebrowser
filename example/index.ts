/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

import {
  EditorModel, EditorWidget
} from 'jupyter-js-editor';

import {
  FileBrowserWidget, FileBrowserViewModel
} from '../lib';

import {
  ContentsManager, ISessionOptions, NotebookSessionManager
} from 'jupyter-js-services';

import {
  DelegateCommand
} from 'phosphor-command';

import {
  Menu, MenuBar, MenuItem
} from 'phosphor-menus';

import {
  SplitPanel
} from 'phosphor-splitpanel';


function main(): void {

  let baseUrl = 'http://localhost:8888'
  let contents = new ContentsManager(baseUrl);
  let sessions = new NotebookSessionManager({ baseUrl: baseUrl });

  let fbModel = new FileBrowserViewModel('', contents, sessions);
  let fileBrowser = new FileBrowserWidget(fbModel);

  var editorModel = new EditorModel();
  let editor = new EditorWidget(editorModel);

  fbModel.changed.connect((fb, change) => {
    if (change.name === 'open' && change.newValue.type === 'file') {
      (editor as any)._editor.getDoc().setValue(change.newValue.content);
    }
  });

  let panel = new SplitPanel();
  panel.addChild(fileBrowser);
  panel.addChild(editor);

  let contextMenu = new Menu([
    new MenuItem({
      text: '&Open',
      icon: 'fa fa-folder-open-o',
      shortcut: 'Ctrl+O',
      command: new DelegateCommand(args => {
        fileBrowser.open();
      })
    }),
    new MenuItem({
      text: '&Rename',
      icon: 'fa fa-edit',
      shortcut: 'Ctrl+R',
      command: new DelegateCommand(args => {
        fileBrowser.rename();
      })
    }),
    new MenuItem({
      text: '&Delete',
      icon: 'fa fa-remove',
      shortcut: 'Ctrl+D',
      command: new DelegateCommand(args => {
        fileBrowser.delete();
      })
    }),
    new MenuItem({
      text: 'Duplicate',
      icon: 'fa fa-copy',
      command: new DelegateCommand(args => {
        fileBrowser.duplicate();
      })
    }),
    new MenuItem({
      text: 'Cut',
      icon: 'fa fa-cut',
      shortcut: 'Ctrl+X',
      command: new DelegateCommand(args => {
        fileBrowser.cut();
      })
    }),
    new MenuItem({
      text: '&Copy',
      icon: 'fa fa-copy',
      shortcut: 'Ctrl+C',
      command: new DelegateCommand(args => {
        fileBrowser.copy();
      })
    }),
    new MenuItem({
      text: '&Paste',
      icon: 'fa fa-paste',
      shortcut: 'Ctrl+V',
      command: new DelegateCommand(args => {
        fileBrowser.paste();
      })
    }),
    new MenuItem({
      text: 'Download',
      icon: 'fa fa-download',
      command: new DelegateCommand(args => {
        fileBrowser.download();
      })
    }),
    new MenuItem({
      text: 'Shutdown Kernel',
      icon: 'fa fa-stop-circle-o',
      command: new DelegateCommand(args => {
        fileBrowser.shutdownKernels();
      })
    }),
  ])

  // Start a default session.
  contents.newUntitled('', { type: 'notebook' }).then(content => {
    sessions.startNew({ notebookPath: content.path }).then(() => {
      panel.attach(document.body);
    });
  });


  fileBrowser.node.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;
    contextMenu.popup(x, y);
  });


  window.onresize = () => panel.update();
}


main();
