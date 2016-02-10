// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContentsModel
} from 'jupyter-js-services';

import {
  showDialog
} from 'jupyter-js-domutils';

import {
  Menu, MenuItem
} from 'phosphor-menus';

import {
  Message
} from 'phosphor-messaging';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowserModel
} from './model';

import * as utils
  from './utils';


/**
 * The class name added to the button node.
 */
const BUTTON_CLASS = 'jp-FileButtons';

/**
 * The class name added to the button nodes.
 */
const BUTTON_ITEM_CLASS = 'jp-FileButtons-item';

/**
 * The class name added to the button icon nodes.
 */
const BUTTON_ICON_CLASS = 'jp-FileButtons-icon';

/**
 * The class name added to the upload button node.
 */
const UPLOAD_CLASS = 'jp-FileButtons-upload';

/**
 * The class name added to the drop icon node.
 */
const DROP_ICON_CLASS = 'jp-FileButtons-drop';


/**
 * A widget which host the file browser buttons.
 */
export
class FileButtons extends Widget {

  /**
   * Construct a new file browser buttons widget.
   *
   * @param model - The file browser view model.
   */
  constructor(model: FileBrowserModel) {
    super();
    this.addClass(BUTTON_CLASS);
    this._model = model;
    this._buttons = Private.createButtons(this.node);

    // Set up the upload button action.
    let upload = this._buttons[Private.Button.Upload];
    let input = upload.getElementsByTagName('input')[0];
    upload.onchange = this._handleUploadEvent.bind(this);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._model = null;
    this._buttons = [];
    this._newMenu.dispose();
    this._newMenu = null;
    super.dispose();
  }


  /**
   * Handle the DOM events for the bread crumbs.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    let node = this.node;
    node.addEventListener('click', this);
    node.addEventListener('mousedown', this);
    node.addEventListener('mouseup', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    node.removeEventListener('click', this);
    node.removeEventListener('mousedown', this);
    node.removeEventListener('mouseup', this);
  }

  /**
   * Handle the `'click'` event for the widget.
   */
  private _evtClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Find a valid click target.
    let index = utils.hitTestNodes(this._buttons, event.clientX, event.clientY);
    if (index === Private.Button.Refresh) {
      this._model.refresh();
    } else if (index === Private.Button.New) {
      let rect = this._buttons[index].getBoundingClientRect();
      if (!this._newMenu) {
        this._newMenu = Private.createNewItemMenu(this);
      }
      this._newMenu.popup(rect.left, rect.bottom, false, true);
    }
  }

  /**
   * Handle the `'mousedown'` event for the widget.
   */
  private _evtMouseDown(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Remove any existing selection.
    for (let button of this._buttons) {
      button.classList.remove(utils.SELECTED_CLASS);
    }

    // Find a valid target.
    let index = utils.hitTestNodes(this.node.childNodes, event.clientX,
      event.clientY);
    if (index !== -1) {
      this._buttons[index].classList.add(utils.SELECTED_CLASS);
    }
  }

  /**
   * Handle the `'mouseup'` event for the widget.
   */
  private _evtMouseUp(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Remove any existing selection.
    for (let button of this._buttons) {
      button.classList.remove(utils.SELECTED_CLASS);
    }
  }

  /**
   * Get the model used by the widget.
   *
   * #### Notes
   * This is a read-only property.
   */
  get model(): FileBrowserModel {
    return this._model;
  }

  /**
   * Get the open requested signal.
   */
  get openRequested(): ISignal<FileButtons, IContentsModel> {
    return Private.openRequestedSignal.bind(this);
  }

  /**
   * Handle a file upload event.
   */
  private _handleUploadEvent(event: Event): void {
    let promises: Promise<IContentsModel>[] = [];
    for (var file of (event.target as any).files) {
      promises.push(this._model.upload(file).catch(error => {
        if (error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.parent.node,
            body: `"${file.name}" already exists, overwrite?`
          }
          return showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.upload(file, true);
            }
          });
        }
      }));
    }
    Promise.all(promises).then(
      () => this._model.refresh(),
      err => utils.showErrorMessage(this, 'Upload Error', err)
    );
  }

  private _newMenu: Menu = null;
  private _model: FileBrowserModel = null;
  private _buttons: HTMLElement[] = [];
}


/**
 * The namespace for the buttons private data.
 */
namespace Private {
  /**
   * A signal emitted when the an open is requested.
   */
  export
  const openRequestedSignal = new Signal<FileButtons, IContentsModel>();

  /**
   * Button item list enum.
   */
  export
  enum Button {
    New,
    Upload,
    Refresh
  }

  /**
   * Create the button nodes.
   */
  export
  function createButtons(buttonBar: HTMLElement): HTMLElement[] {
    let buttons: HTMLElement[] = [];
    let icons = ['fa-plus', 'fa-upload', 'fa-refresh'];
    let titles = ['Create New...', 'Upload File(s)', 'Refresh File List'];
    for (let i = 0; i < 3; i++) {
      let button = document.createElement('button');
      button.className = BUTTON_ITEM_CLASS;
      button.title = titles[i];
      let icon = document.createElement('span');
      icon.className = BUTTON_ICON_CLASS + ' fa ' + icons[i];
      button.appendChild(icon);
      buttonBar.appendChild(button);
      buttons.push(button);
    }

    // Add the dropdown node to the "new file" button.
    var dropIcon = document.createElement('span');
    dropIcon.className = DROP_ICON_CLASS + ' fa fa-caret-down';
    buttons[Button.New].appendChild(dropIcon);
    buttons[Button.New].style.cursor = 'pointer';

    // Create the hidden upload input field.
    let upload = document.createElement('input');
    upload.style.height = "100%";
    upload.style.zIndex = "10000";
    upload.setAttribute("type", "file");
    upload.setAttribute("multiple", "multiple");
    buttons[Button.Upload].classList.add(UPLOAD_CLASS);
    buttons[Button.Upload].appendChild(upload);
    return buttons;
  }

  /**
   * Create the "new" menu.
   */
  export
  function createNewItemMenu(widget: FileButtons): Menu {
    // Create the "new" menu.
    let handler = (item: MenuItem) => {
      let type = item.text.toLowerCase();
      if (type === 'text file') type = 'file';
      if (type === 'folder') type = 'directory';
      widget.model.newUntitled(type).then(contents => {
        if (type !== 'directory') widget.openRequested.emit(contents);
        widget.model.refresh();
      },
      error =>
        utils.showErrorMessage(widget, 'New File Error', error)
      );
    };
    let items: MenuItem[] = [
      new MenuItem({
        text: 'Text File',
        handler: handler,
      }),
      new MenuItem({
        text: 'Folder',
        handler: handler,
      }),
      new MenuItem({
        type: MenuItem.Separator
      }),
      new MenuItem({
        text: 'Notebooks',
        disabled: true
      }),
    ]
    for (var spec of widget.model.kernelSpecs) {
      items.push(new MenuItem({
        text: spec.spec.display_name,
        handler: () => {
          widget.model.newUntitled('notebook').then(contents => {
            widget.model.startSession(contents.path, spec.name).then(() => {
              widget.openRequested.emit(contents);
              widget.model.refresh();
            });
          });
        }
      }));
    }
    return new Menu(items);
  }
}
