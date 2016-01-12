// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as CodeMirror
  from 'codemirror';

import {
  IContentsManager
} from 'jupyter-js-services';

import * as arrays
  from 'phosphor-arrays';

import {
  CodeMirrorWidget
} from 'phosphor-codemirror';

import {
  Message
} from 'phosphor-messaging';

import {
  IChangedArgs, Property
} from 'phosphor-properties';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  Widget, Title
} from 'phosphor-widget';


// Bundle common modes
import 'codemirror/mode/python/python';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/julia/julia';
import 'codemirror/mode/r/r';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm';


/**
 * An implementation of a file handler.
 */
export
class FileHandler {

  /**
   * Construct a new source file handler.
   */
  constructor(manager: IContentsManager) {
    this._manager = manager;
  }

  /**
   * Get the list of file regexes supported by the handler.
   *
   * This implementation supports any name.
   */
  get fileRegexes(): string[] {
    return ['.*']
  }

  /**
   * Open a path and return a populated widget.
   */
  open(path: string): Promise<Widget> {
    let index = arrays.findIndex(this._openFiles,
      (widget, ind) => { return pathProperty.get(widget) === path; });
    if (index !== -1) {
      return Promise.resolve(this._openFiles[index]);
    }
    return this._manager.get(path).then(contents => {
      let widget = new Private.Editor();
      widget.title.text = contents.name;
      widget.title.closable = true;
      widget.title.changed.connect(this.titleChanged, this);
      pathProperty.set(widget, path);
      this._openFiles.push(widget);
      widget.editor.getDoc().setValue(contents.content);
      Private.loadModeByFileName(widget.editor, contents.name);
      widget.disposed.connect(this.close, this);
      widget.closed.connect(this.close, this);
      return widget;
    });
  }

  /**
   * Close the widget and dispose of it.
   */
  close(widget: Widget) {
    let index = this._openFiles.indexOf(widget);
    if (index === -1) {
      return;
    }
    widget.dispose();
    this._openFiles.splice(index, 1);
  }

  /**
   * Handle a change to one of the widget titles.
   */
  protected titleChanged(title: Title, args: IChangedArgs<any>) {
    let widget = arrays.find(this._openFiles,
      (w, index) => { return w.title === title; });
    if (widget === void 0) {
      return
    }
    if (args.name == 'text') {
      let oldPath = pathProperty.get(widget);
      let newPath = oldPath.slice(0, oldPath.lastIndexOf('/') + 1);
      newPath += args.newValue;
      this._manager.rename(oldPath, newPath);
      pathProperty.set(widget, newPath);
    }
  }

  private _manager: IContentsManager;
  private _openFiles: Widget[] = [];
}


/**
 * An attached property with the widget path.
 */
export
const pathProperty = new Property<Widget, string>({
  name: 'path',
  value: ''
});


/**
 * The namespace for the file handler private data.
 */
namespace Private {
  export
  class Editor extends CodeMirrorWidget {

    get closed(): ISignal<Editor, void> {
      return closedSignal.bind(this);
    }

    protected onCloseRequest(msg: Message): void {
      super.onCloseRequest(msg);
      this.closed.emit(void 0);
    }
  }

  /**
   * A signal emitted when an editor closes.
   */
  export
  const closedSignal = new Signal<Editor, void>();

  /**
   * Load a codemirror mode by name.
   */
  export
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
}
