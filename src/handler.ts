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
 * The class name added to a jupyter code mirror widget.
 */
const EDITOR_CLASS = 'jp-CodeMirrorWidget';


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
   * Get the list of file extensions explicitly supported by the handler.
   */
  get fileExtensions(): string[] {
    return []
  }

  /**
   * Get the list of mime types explicitly supported by the handler.
   */
  get mimeTypes(): string[] {
    return []
  }

  /**
   * Get the current set of widgets managed by the handler.
   *
   * #### Notes
   * This is a read-only property
   */
  get widgets(): Widget[] {
    return this._widgets.slice();
  }

  /**
   * Get the contents manager used by the handler.
   *
   * #### Notes
   * This is a read-only property
   */
  get manager(): IContentsManager {
    return this._manager;
  }

  /**
   * A signal emitted when the file handler has finished loading the
   * contents of the widget.
   */
  get finished(): ISignal<AbstractFileHandler, IContentsModel> {
    return AbstractFileHandler.finishedSignal.bind(this);
  }

  /**
   * Open a path and return a widget.
   */
  open(model: IContentsModel): Widget {
    let path = model.path;
    let index = arrays.findIndex(this.widgets,
      (widget, ind) => {
        return AbstractFileHandler.modelProperty.get(widget).path === path;
      }
    );
    if (index !== -1) {
      return this.widgets[index];
    }
    var widget = this.createWidget(model);
    widget.title.closable = true;
    widget.title.changed.connect(this.titleChanged, this);
    AbstractFileHandler.modelProperty.set(widget, model);
    this._widgets.push(widget);
    installMessageFilter(widget, this);

    this.getContents(model).then(contents => {
      this.setState(widget, contents).then(
        () => this.finished.emit(model)
      );
    });

    return widget;
  }

  /**
   * Save the widget contents.
   */
  save(widget: Widget): Promise<IContentsModel> {
    if (this.widgets.indexOf(widget) === -1) {
      return;
    }
    let model = AbstractFileHandler.modelProperty.get(widget);
    return this.getState(widget).then(contents => {
      return this.manager.save(model.path, contents);
    });
  }

  /**
   * Revert the widget contents.
   */
  revert(widget: Widget): Promise<void> {
    if (this.widgets.indexOf(widget) === -1) {
      return;
    }
    let model = AbstractFileHandler.modelProperty.get(widget);
    return this.getContents(model).then(contents => {
      return this.setState(widget, contents);
    });
  }

  /**
   * Close the widget.
   */
  close(widget: Widget): boolean {
    let index = this.widgets.indexOf(widget);
    if (index === -1) {
      return false;
    }
    widget.dispose();
    this._widgets.splice(index, 1);
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
   *
   * #### Notes
   * Subclasses are free to use any or none of the information in
   * the model.
   */
  protected abstract getContents(model: IContentsModel): Promise<IContentsModel>;

  /**
   * Create the widget from a path.
   */
  protected abstract createWidget(model: IContentsModel): Widget;

  /**
   * Populate a widget from `IContentsModel`.
   *
   * #### Notes
   * Subclasses are free to use any or none of the information in
   * the model.
   */
  protected abstract setState(widget: Widget, model: IContentsModel): Promise<void>;

  /**
   * Get the contents model for a widget.
   */
  protected abstract getState(widget: Widget): Promise<IContentsModel>;

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
    let widget = arrays.find(this.widgets,
      (w, index) => { return w.title === title; });
    if (widget === void 0) {
      return
    }
    if (args.name == 'text') {
      let model = AbstractFileHandler.modelProperty.get(widget);
      let newPath = this.getNewPath(model.path, args.newValue);
      this.manager.rename(model.path, newPath).then(contents =>
        AbstractFileHandler.modelProperty.set(widget, contents));
    }
  }

  private _manager: IContentsManager;
  private _widgets: Widget[] = [];
}


/**
 * An implementation of a file handler.
 */
export
class FileHandler extends AbstractFileHandler {
  /**
   * Get file contents given a path.
   *
   * #### Notes
   * Subclasses are free to use any or none of the information in
   * the model.
   */
  protected getContents(model: IContentsModel): Promise<IContentsModel> {
    return this.manager.get(model.path, { type: 'file', format: 'text' });
  }

  /**
   * Create the widget from an `IContentsModel`.
   */
  protected createWidget(model: IContentsModel): Widget {
    let widget = new JupyterCodeMirrorWidget() as Widget;
    widget.title.text = model.path.split('/').pop();
    return widget;
  }

  /**
   * Populate a widget from `IContentsModel`.
   *
   * #### Notes
   * Subclasses are free to use any or none of the information in
   * the model.
   */
  protected setState(widget: Widget, model: IContentsModel): Promise<void> {
    let mirror = widget as CodeMirrorWidget;
    mirror.editor.getDoc().setValue(model.content);
    loadModeByFileName(mirror.editor, model.name);
    return Promise.resolve(void 0);
  }

  /**
   * Get the contents model for a widget.
   */
  protected getState(widget: Widget): Promise<IContentsModel> {
    let model = AbstractFileHandler.modelProperty.get(widget);
    let name = model.path.split('/').pop();
    name = name.split('.')[0];
    let content = (widget as CodeMirrorWidget).editor.getDoc().getValue();
    return Promise.resolve({ path: model.path, content, name,
                             type: 'file', format: 'text' });
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
  const modelProperty = new Property<Widget, IContentsModel>({
    name: 'model',
    value: null
  });


  /**
   * A signal finished when a file handler has finished populating a
   * widget.
   */
  export
  const finishedSignal = new Signal<AbstractFileHandler, IContentsModel>();
}


/**
 * A Jupyter-specific code mirror widget.
 */
class JupyterCodeMirrorWidget extends CodeMirrorWidget {
  /**
   * Construct a new jupyter code mirror widget.
   */
  constructor() {
    super();
    this.addClass(EDITOR_CLASS);
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.editor.focus();
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.editor.focus();
  }
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
