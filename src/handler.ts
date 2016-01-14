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
    this.manager = manager;
  }

  /**
   * Get the list of file extensions explicitly supported by the handler.
   */
  get fileExtensions(): string[] {
    return []
  }

  /**
   * A signal emitted when the file handler has finished loading the
   * contents of the widget.
   */
  get finished(): ISignal<AbstractFileHandler, string> {
    return AbstractFileHandler.finishedSignal.bind(this);
  }

  /**
   * Open a path and return a widget.
   */
  open(path: string): Widget {
    let index = arrays.findIndex(this.openFiles,
      (widget, ind) => {
        return AbstractFileHandler.pathProperty.get(widget) === path;
      }
    );
    if (index !== -1) {
      return this.openFiles[index];
    }
    var widget = this.createWidget(path);
    widget.title.closable = true;
    widget.title.changed.connect(this.titleChanged, this);
    AbstractFileHandler.pathProperty.set(widget, path);
    this.openFiles.push(widget);
    installMessageFilter(widget, this);

    this.getContents(path).then(contents => {
      this.populateWidget(widget, contents).then(
        () => this.finished.emit(path)
      );
    });

    return widget;
  }

  /**
   * Close the widget.
   */
  close(widget: Widget): boolean {
    let index = this.openFiles.indexOf(widget);
    if (index === -1) {
      return false;
    }
    widget.dispose();
    this.openFiles.splice(index, 1);
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
  protected abstract getContents(path: string): Promise<IContentsModel>;

  /**
   * Create the widget from a path.
   */
  protected abstract createWidget(path: string): Widget;

  /**
   * Populate a widget from `IContentsModel`.
   */
  protected abstract populateWidget(widget: Widget, model: IContentsModel): Promise<void>;

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
    let widget = arrays.find(this.openFiles,
      (w, index) => { return w.title === title; });
    if (widget === void 0) {
      return
    }
    if (args.name == 'text') {
      let oldPath = AbstractFileHandler.pathProperty.get(widget);
      let newPath = this.getNewPath(oldPath, args.newValue);
      this.manager.rename(oldPath, newPath).then(() =>
        AbstractFileHandler.pathProperty.set(widget, newPath));
    }
  }

  protected manager: IContentsManager;
  protected openFiles: Widget[] = [];
}


/**
 * An implementation of a file handler.
 */
export
class FileHandler extends AbstractFileHandler {
  /**
   * Get the list of file extensions explicitly supported by the handler.
   */
  get fileExtensions(): string[] {
    return ['.png', '.gif', '.jpeg', '.jpg']
  }

  /**
   * Get file contents given a path.
   */
  protected getContents(path: string): Promise<IContentsModel> {
    return this.manager.get(path, { type: 'file' });
  }

  /**
   * Create the widget from an `IContentsModel`.
   */
  protected createWidget(path: string): Widget {
    let ext = path.split('.').pop();
    if (ext === 'png' || ext === 'gif' || ext === 'jpeg' || ext === 'jpg') {
      var widget = new Widget();
      let canvas = document.createElement('canvas');
      widget.node.appendChild(canvas);
      widget.node.style.overflowX = 'auto';
      widget.node.style.overflowY = 'auto';
    } else {
      var widget = new CodeMirrorWidget() as Widget;
    }
    widget.title.text = path.split('/').pop();
    return widget;
  }

  /**
   * Populate a widget from `IContentsModel`.
   */
  protected populateWidget(widget: Widget, model: IContentsModel): Promise<void> {
    let ext = model.path.split('.').pop();
    if (ext === 'png' || ext === 'gif' || ext === 'jpeg' || ext === 'jpg') {
      let uri = `data:image/${ext};base64,${model.content}`;
      var img = new Image();
      var canvas = widget.node.firstChild as HTMLCanvasElement;
      img.addEventListener("load", () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        let context = canvas.getContext('2d')
        context.drawImage(img, 0, 0);
      });
      img.src = uri;
    } else {
      let mirror = widget as CodeMirrorWidget;
      mirror.editor.getDoc().setValue(model.content);
      loadModeByFileName(mirror.editor, model.name);
    }
    return Promise.resolve(void 0);
  }
}


/**
 * A namespace for AbstractFileHandler statics.
 */
export
namespace AbstractFileHandler {
  /**
   * An attached property with the widget path.
   */
  export
  const pathProperty = new Property<Widget, string>({
    name: 'path',
    value: ''
  });


  /**
   * A signal finished when a file handler has finished populating a
   * widget.
   */
  export
  const finishedSignal = new Signal<AbstractFileHandler, string>();
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
