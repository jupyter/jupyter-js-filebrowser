// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import * as CodeMirror
  from 'codemirror';

import {
  IContentsModel, IContentsManager
} from 'jupyter-js-services';

import * as arrays
  from 'phosphor-arrays';

import {
  CodeMirrorWidget
} from 'phosphor-codemirror';

import {
  IMessageFilter, IMessageHandler, Message, installMessageFilter,
  removeMessageFilter
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
abstract class AbstractFileHandler implements IMessageFilter {

  /**
   * Construct a new source file handler.
   */
  constructor(manager: IContentsManager) {
    this._manager = manager;
  }

  /**
   * Get the list of file extensions supported by the handler.
   */
  get fileExtensions(): string[] {
    return ['.txt']
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
    return this.getContents(this._manager, path).then(contents => {
      let widget = this.createWidget(contents);
      widget.title.closable = true;
      widget.title.changed.connect(this.titleChanged, this);
      pathProperty.set(widget, path);
      this._openFiles.push(widget);
      installMessageFilter(widget, this);
      return widget;
    });
  }

  /**
   * Close the widget.
   */
  close(widget: Widget): boolean {
    let index = this._openFiles.indexOf(widget);
    if (index === -1) {
      return false;
    }
    widget.dispose();
    this._openFiles.splice(index, 1);
    return true;
  }

  /**
   * Filter messages on the widget.
   */
  filterMessage(handler: IMessageHandler, msg: Message): boolean {
    if (msg.type == 'close-request') {
      return this.close(handler as Widget);
    }
    return false;
  }

  /**
   * Get file contents given a path.
   */
  protected abstract getContents(manager: IContentsManager, path: string): Promise<IContentsModel>;

  /**
   * Create the widget from an `IContentsModel`.
   *
   * #### Notes
   * This is intended to be subclassed by other file handlers.
   */
  protected abstract createWidget(contents: IContentsModel): Widget;

  /**
   * Get the path from the old path widget title text.
   *
   * #### Notes
   * This is intended to be subclassed by other file handlers.
   */
  protected getNewPath(oldPath: string, title: string): string {
    let dirname = oldPath.slice(0, oldPath.lastIndexOf('/') + 1);
    return dirname + title;
  }

  /**
   * Handle a change to one of the widget titles.
   */
  protected titleChanged(title: Title, args: IChangedArgs<any>): void {
    let widget = arrays.find(this._openFiles,
      (w, index) => { return w.title === title; });
    if (widget === void 0) {
      return
    }
    if (args.name == 'text') {
      let oldPath = pathProperty.get(widget);
      let newPath = this.getNewPath(oldPath, args.newValue);
      this._manager.rename(oldPath, newPath).then(() =>
        pathProperty.set(widget, newPath));
    }
  }

  private _manager: IContentsManager;
  private _openFiles: Widget[] = [];
}


/**
 * An implementation of a file handler.
 */
export
class FileHandler extends AbstractFileHandler {

  /**
   * Get file contents given a path.
   */
  protected getContents(manager: IContentsManager, path: string): Promise<IContentsModel> {
    return manager.get(path, { type: 'file' });
  }

  /**
   * Create the widget from an `IContentsModel`.
   *
   * #### Notes
   * This is intended to be subclassed by other file handlers.
   */
  protected createWidget(contents: IContentsModel): Widget {
    let widget = new CodeMirrorWidget();
    widget.editor.getDoc().setValue(contents.content);
    loadModeByFileName(widget.editor, contents.name);
    widget.title.text = contents.name;
    return widget;
  }
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
