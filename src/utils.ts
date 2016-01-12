// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  okButton, showDialog
} from 'jupyter-js-utils';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Widget
} from 'phosphor-widget';


/**
 * The class name added to FileBrowser instances.
 */
export
const FILE_BROWSER_CLASS = 'jp-FileBrowser';


/**
 * The class name added to drop targets.
 */
export
const DROP_TARGET_CLASS = 'jp-mod-dropTarget';


/**
 * The mime type for a contents drag object.
 */
export
const CONTENTS_MIME = 'application/x-jupyter-icontents';


/**
 * An error message dialog to show in the filebrowser widget.
 */
export
function showErrorMessage(host: Widget, title: string, error: Error): Promise<void> {
  console.error(error);
  if (!host.isAttached) {
    return;
  }
  // Find the file browser node.
  let node = host.node;
  while (!node.classList.contains(FILE_BROWSER_CLASS)) {
    node = node.parentElement;
  }
  let options = {
    title: title,
    host: node,
    body: error.message,
    buttons: [okButton]
  }
  return showDialog(options).then(() => {});
}


/**
 * Get the index of the node at a client position, or `-1`.
 */
export
function hitTestNodes(nodes: HTMLElement[], x: number, y: number): number {
  for (let i = 0, n = nodes.length; i < n; ++i) {
    if (hitTest(nodes[i], x, y)) return i;
  }
  return -1;
}
