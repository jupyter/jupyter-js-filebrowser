/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use strict';

import {
  getConfigOption
} from 'jupyter-js-utils';

import {
  ContentsManager, ISessionOptions, NotebookSessionManager
} from 'jupyter-js-services';

import * as arrays
 from 'phosphor-arrays';

import {
  CodeMirrorWidget
} from 'phosphor-codemirror';

import {
  SimpleCommand
} from 'phosphor-command';

import {
  DockPanel
} from 'phosphor-dockpanel';

import {
  KeymapManager
} from 'phosphor-keymap';

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



function getCurrentWidget(handler: FileHandler): Widget {
  for (let w of handler.widgets) {
    if (w.hasClass('jp-mod-focus')) {
      return w;
    }
  }
}


function main(): void {

  let baseUrl = getConfigOption('baseUrl');
  let contentsManager = new ContentsManager(baseUrl);
  let sessionsManager = new NotebookSessionManager({ baseUrl: baseUrl });

  let fbModel = new FileBrowserModel(contentsManager, sessionsManager);
  let fbWidget = new FileBrowserWidget(fbModel)
  fbWidget.widgetFactory = model => {
    return handler.open(model);
  };
  let handler = new FileHandler(contentsManager);

  let panel = new SplitPanel();
  panel.addChild(fbWidget);
  let dock = new DockPanel();
  panel.addChild(dock);
  dock.spacing = 8;

  fbWidget.openRequested.connect((fb, model) => {
    let editor = handler.open(model);
    dock.insertTabAfter(editor);
  });

  let keymapManager = new KeymapManager();
  keymapManager.add([{
    sequence: ['Enter'],
    selector: '.jp-DirListing',
    command: new SimpleCommand({
      handler: () => {
        fbWidget.open();
        return true;
      }
     })
  }, {
    sequence: ['Ctrl N'], // Add emacs keybinding for select next.
    selector: '.jp-DirListing',
    command: new SimpleCommand({
      handler: () => {
        fbWidget.selectNext();
        return true;
      }
    })
  }, {
    sequence: ['Ctrl P'], // Add emacs keybinding for select previous.
    selector: '.jp-DirListing',
    command: new SimpleCommand({
      handler: () => {
        fbWidget.selectPrevious();
        return true;
      }
     })
  }, {
    sequence: ['Accel S'],
    selector: '.jp-CodeMirrorWidget',
    command: new SimpleCommand({
      handler: () => {
        let widget = getCurrentWidget(handler);
        if (widget) {
          handler.save(widget);
          return true;
        }
      }
     })
  }, {
    sequence: ['Accel R'],
    selector: '.jp-CodeMirrorWidget',
    command: new SimpleCommand({
      handler: () => {
        let widget = getCurrentWidget(handler);
        if (widget) {
          handler.revert(widget);
          return true;
        }
      }
    })
  }, {
    sequence: ['Ctrl W'],
    selector: '.jp-CodeMirrorWidget',
    command: new SimpleCommand({
      handler: () => {
        let widget = getCurrentWidget(handler);
        if (widget) {
          handler.close(widget);
          return true;
        }
      }
    })
  }]);

  window.addEventListener('keydown', (event) => {
    keymapManager.processKeydownEvent(event);
  });

  document.addEventListener('focus', (event) => {
    // If the widget belongs to the handler, update the focused widget.
    let widget = arrays.find(handler.widgets,
      w => { return w.node.contains(event.target as HTMLElement); });
    if (!widget || widget.hasClass('jp-mod-focus')) {
      return;
    }
    for (let w of handler.widgets) {
      w.removeClass('jp-mod-focus');
    }
    widget.addClass('jp-mod-focus');
  }, true);

  let contextMenu = new Menu([
    new MenuItem({
      text: '&Open',
      icon: 'fa fa-folder-open-o',
      shortcut: 'Ctrl+O',
      handler: () => { fbWidget.open(); }
    }),
    new MenuItem({
      text: '&Rename',
      icon: 'fa fa-edit',
      shortcut: 'Ctrl+R',
      handler: () => { fbWidget.rename(); }
    }),
    new MenuItem({
      text: '&Delete',
      icon: 'fa fa-remove',
      shortcut: 'Ctrl+D',
      handler: () => { fbWidget.delete(); }
    }),
    new MenuItem({
      text: 'Duplicate',
      icon: 'fa fa-copy',
      handler: () => { fbWidget.duplicate(); }
    }),
    new MenuItem({
      text: 'Cut',
      icon: 'fa fa-cut',
      shortcut: 'Ctrl+X',
      handler: () => { fbWidget.cut(); }
    }),
    new MenuItem({
      text: '&Copy',
      icon: 'fa fa-copy',
      shortcut: 'Ctrl+C',
      handler: () => { fbWidget.copy(); }
    }),
    new MenuItem({
      text: '&Paste',
      icon: 'fa fa-paste',
      shortcut: 'Ctrl+V',
      handler: () => { fbWidget.paste(); }
    }),
    new MenuItem({
      text: 'Download',
      icon: 'fa fa-download',
      handler: () => { fbWidget.download(); }
    }),
    new MenuItem({
      text: 'Shutdown Kernel',
      icon: 'fa fa-stop-circle-o',
      handler: () => { fbWidget.shutdownKernels(); }
    }),
  ])

  // Start a default session.
  contentsManager.newUntitled('', { type: 'notebook' }).then(contents => {
    sessionsManager.startNew({ notebookPath: contents.path }).then(() => {
      panel.attach(document.body);
    });
  });

  // Add a context menu to the dir listing.
  let node = fbWidget.node.getElementsByClassName('jp-DirListing-list')[0];
  node.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;
    contextMenu.popup(x, y);
  });

  window.onresize = () => panel.update();
}


window.onload = main;
