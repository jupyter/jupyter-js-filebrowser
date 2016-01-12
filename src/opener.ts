// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as CodeMirror
  from 'codemirror';

import {
  CodeMirrorWidget
} from 'phosphor-codemirror';

import {
  IContentsManager
} from 'jupyter-js-services';


// Bundle common modes
import 'codemirror/mode/python/python';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/julia/julia';
import 'codemirror/mode/r/r';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm';


/**
 * An implementation of a file opener.
 */
export
class FileOpener {

  /**
   * Construct a new source file opener.
   */
  constructor(manager: IContentsManager) {
    this._manager = manager;
  }

  /**
   * Open a path and return a populated code mirror widget.
   */
  open(path: string): Promise<CodeMirrorWidget> {
    return this._manager.get(path).then(contents => {
      let widget = new CodeMirrorWidget();
      widget.title.text = contents.name;
      this._openFiles.push(path);
      widget.editor.getDoc().setValue(contents.content);
      loadModeByFileName(widget.editor, contents.name);
      return widget;
    });
  }

  private _manager: IContentsManager;
  private _openFiles: string[] = [];
}


/**
 * Load a codemirror mode by name.
 */
function loadModeByFileName(editor: CodeMirror.Editor, filename: string): void {
  let info = CodeMirror.findModeByFileName(filename);
  if (!info) {
    editor.setOption('mode', 'null');
    return;
  }
  if (CodeMirror.modes.hasOwnProperty(info.mode)) {
    editor.setOption('mode', info.mime);
  } else {
    // Load the remaining mode bundle asynchronously.
    require([`codemirror/mode/${info.mode}/${info.mode}.js`], () => {
      editor.setOption('mode', info.mime);
    });
  }
}
