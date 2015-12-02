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
  Widget
} from 'phosphor-widget';

import {
  FileBrowser, IFileBrowserViewModel
} from '../lib/index';


function main(): void {

  let baseUrl = 'http://localhost:8888'

  let contents = new Contents(baseUrl);

  let items: string[] = [];

  let listSessions = function() {
    return listRunningSessions(baseUrl);
  }

  let connectSession = function(id: string, options: ISessionOptions) {
    return connectToSession(id, options);
  }

  let model = {
    listRunningSessions: listSessions,
    connectToSession: connectSession,
    contents: contents,
    currentDirectory: '',
    selectedItems: items
  }

  let fileBrowser = new FileBrowser(model);

  Widget.attach(fileBrowser, document.body);

  window.onresize = () => fileBrowser.update();
}


window.onload = main;
