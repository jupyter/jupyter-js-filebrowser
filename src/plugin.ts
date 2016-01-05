// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  ContentsManager, NotebookSessionManager
} from 'jupyter-js-services';

import {
  IAppShell
} from 'phosphide';

import {
  Container
} from 'phosphor-di';

import {
  FileBrowser, FileBrowserViewModel
} from './index';


export
function resolve(container: Container): Promise<void> {
  return container.resolve(FileBrowserHandler).then(handler => {
    handler.run();
  });
}


class FileBrowserHandler {

  static requires = [IAppShell];

  static create(shell: IAppShell): FileBrowserHandler {
    return new FileBrowserHandler(shell);
  }

  constructor(shell: IAppShell) {
    this._shell = shell;
  }

  run(): void {
    let baseUrl = 'http://localhost:8888'
    let contents = new ContentsManager(baseUrl);
    let sessions = new NotebookSessionManager({ baseUrl: baseUrl });

    let fbModel = new FileBrowserViewModel('', contents, sessions);
    let fileBrowser = new FileBrowser(fbModel);
    fileBrowser.title.text = 'File Browser';

    this._shell.addToLeftArea(fileBrowser, { rank: 10 });
  }

  private _shell: IAppShell;
}
