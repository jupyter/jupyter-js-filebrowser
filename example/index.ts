/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowser
} from '../lib/index';

import './index.css';


function main(): void {

  var fileBrowser = new FileBrowser('http://localhost:8888', '');

  Widget.attach(fileBrowser, document.body);

  fileBrowser.listDirectory();

  fileBrowser.onClick = (name, contents) => {
    console.log(name);
  }

  window.onresize = () => fileBrowser.update();
}


window.onload = main;
