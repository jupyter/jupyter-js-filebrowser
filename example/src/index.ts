/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

import {
  CodeMirrorWidget
} from 'phosphor-codemirror';

import {
  getConfigOption
} from 'jupyter-js-utils';

import {
  ContentsManager, ISessionOptions, NotebookSessionManager
} from 'jupyter-js-services';

import {
  DelegateCommand
} from 'phosphor-command';

import {
  DockPanel
} from 'phosphor-dockpanel';

import {
  Menu, MenuBar, MenuItem
} from 'phosphor-menus';

import {
  SplitPanel
} from 'phosphor-splitpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowserWidget, FileBrowserModel, FileHandler
} from '../../lib';


function main(): void {

  let baseUrl = getConfigOption('baseUrl');
  let contentsManager = new ContentsManager(baseUrl);
  let sessionsManager = new NotebookSessionManager({ baseUrl: baseUrl });

  let fbModel = new FileBrowserModel(contentsManager, sessionsManager);
  let fbWidget = new FileBrowserWidget(fbModel);
  let handler = new FileHandler(contentsManager);

  FileBrowserWidget.widgetFactory = () => {
    let item = fbModel.items[fbModel.selected[0]];
    return handler.open(item.path);
  };

  let panel = new SplitPanel();
  panel.addChild(fbWidget);
  let dock = new DockPanel();
  panel.addChild(dock);
  dock.spacing = 8;

  fbWidget.openRequested.connect((fb, path) => {
    let editor = handler.open(path);
    dock.insertTabAfter(editor);
  });

  let contextMenu = new Menu([
    new MenuItem({
      text: '&Open',
      icon: 'fa fa-folder-open-o',
      shortcut: 'Ctrl+O',
      command: new DelegateCommand(args => {
        fbWidget.open();
      })
    }),
    new MenuItem({
      text: '&Rename',
      icon: 'fa fa-edit',
      shortcut: 'Ctrl+R',
      command: new DelegateCommand(args => {
        fbWidget.rename();
      })
    }),
    new MenuItem({
      text: '&Delete',
      icon: 'fa fa-remove',
      shortcut: 'Ctrl+D',
      command: new DelegateCommand(args => {
        fbWidget.delete();
      })
    }),
    new MenuItem({
      text: 'Duplicate',
      icon: 'fa fa-copy',
      command: new DelegateCommand(args => {
        fbWidget.duplicate();
      })
    }),
    new MenuItem({
      text: 'Cut',
      icon: 'fa fa-cut',
      shortcut: 'Ctrl+X',
      command: new DelegateCommand(args => {
        fbWidget.cut();
      })
    }),
    new MenuItem({
      text: '&Copy',
      icon: 'fa fa-copy',
      shortcut: 'Ctrl+C',
      command: new DelegateCommand(args => {
        fbWidget.copy();
      })
    }),
    new MenuItem({
      text: '&Paste',
      icon: 'fa fa-paste',
      shortcut: 'Ctrl+V',
      command: new DelegateCommand(args => {
        fbWidget.paste();
      })
    }),
    new MenuItem({
      text: 'Download',
      icon: 'fa fa-download',
      command: new DelegateCommand(args => {
        fbWidget.download();
      })
    }),
    new MenuItem({
      text: 'Shutdown Kernel',
      icon: 'fa fa-stop-circle-o',
      command: new DelegateCommand(args => {
        fbWidget.shutdownKernels();
      })
    }),
  ])

  // Start a default session.
  contentsManager.newUntitled('', { type: 'notebook' }).then(contents => {
    sessionsManager.startNew({ notebookPath: contents.path }).then(() => {
      panel.attach(document.body);
    });
  });

  fbWidget.node.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;
    contextMenu.popup(x, y);
  });

  window.onresize = () => panel.update();
}


window.onload = main;
