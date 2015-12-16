// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContents, IContentsModel, IContentsOpts, INotebookSession, ISessionId,
  ISessionOptions
} from 'jupyter-js-services';

import * as moment from 'moment';

import {
  DelegateCommand, ICommand
} from 'phosphor-command';

import {
  okButton, showDialog
} from 'phosphor-dialog';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Drag, DropAction, DropActions, IDragEvent, MimeData
} from 'phosphor-dragdrop';

import {
  Menu, MenuBar, MenuItem
} from 'phosphor-menus';

import {
  Message
} from 'phosphor-messaging';

import {
  NodeWrapper
} from 'phosphor-nodewrapper';

import {
  IChangedArgs
} from 'phosphor-properties';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  Widget
} from 'phosphor-widget';

import './index.css';


/**
 * The class name added to FileBrowser instances.
 */
const FILE_BROWSER_CLASS = 'jp-FileBrowser';

/**
 * The class name added to the button node.
 */
const BUTTON_CLASS = 'jp-FileBrowser-button';

/**
 * The class name added to the button nodes.
 */
const BUTTON_ITEM_CLASS = 'jp-FileBrowser-button-item';

/**
 * The class name added to the upload button node.
 */
const UPLOAD_CLASS = 'jp-FileBrowser-upload';

/**
 * The class name added to the header node.
 */
const HEADER_CLASS = 'jp-FileBrowser-header';

/**
 * The class name added to the header file node.
 */
const HEADER_FILE_CLASS = 'jp-FileBrowser-header-file';

/**
 * The class name added to the header modified node.
 */
const HEADER_MOD_CLASS = 'jp-FileBrowser-header-modified';

/**
 * The class name added to the breadcrumb node.
 */
const BREADCRUMB_CLASS = 'jp-FileBrowser-breadcrumbs';

/**
 * The class name added to the breadcrumb node.
 */
const BREADCRUMB_ITEM_CLASS = 'jp-FileBrowser-breadcrumb-item';

/**
 * The class name added to FileBrowser rows.
 */
const LIST_AREA_CLASS = 'jp-FileBrowser-list-area';

/**
 * The class name added to FileBrowser rows.
 */
const ROW_CLASS = 'jp-FileBrowser-row';

/**
 * The class name added to selected rows.
 */
const SELECTED_CLASS = 'jp-mod-selected';

/**
 * The class name added to a row icon.
 */
const ROW_ICON_CLASS = 'jp-FileBrowser-item-icon';

/**
 * The class name added to a row text.
 */
const ROW_TEXT_CLASS = 'jp-FileBrowser-item-text';

/**
 * The class name added to a row filename editor.
 */
const ROW_EDIT_CLASS = 'jp-FileBrowser-item-edit';

/**
 * The class name added to a row last modified text.
 */
const ROW_TIME_CLASS = 'jp-FileBrowser-item-modified';

/**
 * The class name added to a folder icon.
 */
const FOLDER_ICON_CLASS = 'jp-FileBrowser-folder-icon';

/**
 * The class name added to a file icon.
 */
const FILE_ICON_CLASS = 'jp-FileBrowser-file-icon';


/**
 * The minimum duration for a rename select in ms.
 */
const RENAME_DURATION = 500;


const DRAG_THRESHOLD = 5;


const CONTENTS_MIME = 'application/x-juptyer-icontents';


/**
 * An implementation of a file browser view model.
 */
export
class FileBrowserViewModel {
  /**
   * A signal emitted when an item changes.
   */
  static changedSignal = new Signal<FileBrowserViewModel, IChangedArgs<IContentsModel>>();

  /**
   * Construct a new file browser view model.
   */
  constructor(path: string, contents: IContents) {
    this._model = { path: path , name: '', type: 'directory',
                    writable: true, created: '', last_modified: '' };
    this._contents = contents;
  }

  /**
   * Get the item changed signal.
   */
  get changed(): ISignal<FileBrowserViewModel, IChangedArgs<IContentsModel>> {
    return FileBrowserViewModel.changedSignal.bind(this);
  }

  /**
   * Get the current path.
   */
  get path(): string {
    return this._model.path;
  }

  /**
   * Set the current path, triggering a refresh.
   */
  set path(value: string) {
    this._model.path = value;
    this.refresh();
  }

  /**
   * Get the current items.
   *
   * #### Notes
   * This is a read-only property.
   */
  get items(): IContentsModel[] {
    return this._model.content.slice();
  }

  /**
   * Get the selected indices.
   */
  get selected(): number[] {
    return this._selectedIndices.slice();
  }

  /**
   * Set the selected indices.
   */
  set selected(value: number[]) {
    this._selectedIndices = value.slice();
  }

  /**
   * Open the current selected items.
   *
   * #### Notes
   * Emits an [[opened]] signal for each item
   * after loading the contents.
   */
  open(): void {
    let items = this._model.content;
    for (let index of this._selectedIndices) {
      let item = items[index];
      if (item.type === 'directory') {
        this.path = item.path;
        continue;
      } else {
        this._contents.get(item.path, { type: item.type }
        ).then((contents: IContentsModel) => {
          this.changed.emit({
            name: 'open',
            newValue: contents ,
            oldValue: null,
          });
        });
      }
    }
  }

  /**
   * Create a new untitled file or directory in the current directory.
   */
  newUntitled(type: string): Promise<IContentsModel> {
    let ext = type === 'file' ? '.ext': '';
    return this._contents.newUntitled(this._model.path, { type: type, ext: ext }
    ).then(contents => {
      this.refresh();
      return contents
    });
  }

  /**
   * Rename a file or directory.
   */
  rename(path: string, newPath: string, overwrite?: boolean): Promise<IContentsModel> {
    // Check for existing file.
    for (let model of this._model.content) {
      if (model.name === newPath && !overwrite) {
        return Promise.reject(new Error(`"${newPath}" already exists`));
      } else if (model.name == path) {
        var current = model;
      }
    }
    // Add the directory if applicable.
    if (this._model.path) {
      path = this._model.path + '/' + path;
      newPath = this._model.path + '/' + newPath;
    }
    // Rename, refresh, and emit a change event.
    return this._contents.rename(path, newPath).then(contents => {
      this.refresh();
      this.changed.emit({
        name: 'rename',
        oldValue: current,
        newValue: contents
      });
      return contents;
    });
  }

  /**
   * Upload a file object.
   */
  upload(file: File, overwrite?: boolean): Promise<IContentsModel> {

    // Skip large files with a warning.
    if (file.size > this._max_upload_size_mb * 1024 * 1024) {
      let msg = `Cannot upload file (>${this._max_upload_size_mb} MB) `;
      msg += `"${file.name}"`
      console.warn(msg);
      return Promise.reject(new Error(msg));
    }

    // Check for existing file.
    for (let model of this._model.content) {
      if (model.name === file.name && !overwrite) {
        return Promise.reject(new Error(`"${file.name}" already exists`));
      }
    }

    // Gather the file model parameters.
    let path = this._model.path
    path = path ? path + '/' + file.name : file.name;
    let name = file.name;
    let isNotebook = file.name.indexOf('.ipynb') !== -1;
    let type = isNotebook ? 'notebook' : 'file';
    let format = isNotebook ? 'json' : 'base64';

    // Get the file content.
    let reader = new FileReader();
    if (isNotebook) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    return new Promise<IContentsModel>((resolve, reject) => {
      reader.onload = (event: Event) => {
        let content = '';
        if (isNotebook) {
          content = JSON.parse(reader.result);
        } else {
          // Base64-encode binary file data.
          let bytes = '';
          let buf = new Uint8Array(reader.result);
          let nbytes = buf.byteLength;
          for (let i = 0; i < nbytes; i++) {
            bytes += String.fromCharCode(buf[i]);
          }
          content = btoa(bytes);
        }
        let model: IContentsOpts = {
          type: type,
          format: format,
          name: name,
          content: content
        }
        return this._contents.save(path, model).then(model => {
          this.refresh();
          return model;
        });
      }

      reader.onerror = (evt: Event) => {
        throw Error('Failed to upload `${file.name}`');
      }
    });
  }

  /**
   * Refresh the model contents.
   */
  refresh() {
    this._contents.listContents(this._model.path).then(model => {
      let old = this._model;
      this._model = model;
      this.changed.emit({
        name: 'refresh',
        oldValue: old,
        newValue: model.content
      });
    });
  }

  private _max_upload_size_mb = 15;
  private _selectedIndices: number[] = [];
  private _contents: IContents = null;
  private _model: IContentsModel = null;
}


/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retreive contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
export
class FileBrowser extends Widget {

  /**
   * Create a new node for the file list.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');

    // Create the breadcrumb node.
    let breadcrumbs = document.createElement('div');
    breadcrumbs.classList.add(BREADCRUMB_CLASS);

    // Create the button node.
    let buttonBar = document.createElement('ul');
    buttonBar.className = BUTTON_CLASS;

    // Create the header.
    let header = document.createElement('div');
    header.classList.add(HEADER_CLASS);
    let fileName = document.createElement('span');
    fileName.textContent = 'File Name';
    fileName.className = HEADER_FILE_CLASS;
    let modified = document.createElement('span');
    modified.textContent = 'Last Modified';
    modified.className = HEADER_MOD_CLASS;
    header.appendChild(fileName);
    header.appendChild(modified);

    // Create the file list.
    let list = document.createElement('ul');
    list.classList.add(LIST_AREA_CLASS);

    // Add the children.
    node.appendChild(breadcrumbs);
    node.appendChild(buttonBar);
    node.appendChild(header);
    node.appendChild(list);
    return node;
  }

  /**
   * Construct a new file browser widget.
   *
   * @param model - File browser view model instance.
   */
  constructor(model: FileBrowserViewModel) {
    super();
    this.addClass(FILE_BROWSER_CLASS);
    this._model = model;
    this._model.changed.connect(this._onChanged.bind(this));

    // Create the crumb nodes add add to crumb node.
    this._crumbs = createCrumbs();
    this._crumbSeps = createCrumbSeparators();
    let crumbs = this.node.getElementsByClassName(BREADCRUMB_CLASS)[0];
    crumbs.appendChild(this._crumbs[Crumb.Home]);

    // Create the button nodes and add to button node.
    let buttons = this.node.getElementsByClassName(BUTTON_CLASS)[0];
    this._buttons = createButtons(buttons as HTMLElement);
    let input = this._buttons[Button.Upload].lastChild;
    (input as HTMLElement).onchange = this._handleUploadEvent.bind(this);

    // Create the "new" menu.
    let command = new DelegateCommand((args: string) => {
      this._handleNewCommand(args);
    });
    this._newMenu = createMenu(command);

    // Create the edit node.
    this._editNode = document.createElement('input');
    this._editNode.className = ROW_EDIT_CLASS;
  }

  /**
   * Dispose of the resources held by the file browser.
   */
  dispose(): void {
    this._model = null;
    this._items = null;
    this._crumbs = null;
    this._crumbSeps = null;
    this._buttons = null;
    super.dispose();
  }

  /**
   * Handle the DOM events for the file browser.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMousedown(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseup(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMousemove(event as MouseEvent);
      break;
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'dblclick':
      this._evtDblClick(event as MouseEvent);
      break;
    case 'p-dragenter':
      this._evtDragEnter(event as IDragEvent);
      break;
    case 'p-dragleave':
      this._evtDragLeave(event as IDragEvent);
      break;
    case 'p-dragover':
      this._evtDragOver(event as IDragEvent);
      break;
    case 'p-drop':
      this._evtDrop(event as IDragEvent);
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    let node = this.node;
    node.addEventListener('mousedown', this);
    node.addEventListener('mouseup', this);
    node.addEventListener('click', this);
    node.addEventListener('dblclick', this);
    node.addEventListener('p-dragenter', this);
    node.addEventListener('p-dragleave', this);
    node.addEventListener('p-dragover', this);
    node.addEventListener('p-drop', this);
    this._model.refresh();
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    node.removeEventListener('mousedown', this);
    node.removeEventListener('mouseup', this);
    node.removeEventListener('click', this);
    node.removeEventListener('dblclick', this);
    node.removeEventListener('mousemove', this);
    node.removeEventListener('p-dragenter', this);
    node.removeEventListener('p-dragleave', this);
    node.removeEventListener('p-dragover', this);
    node.removeEventListener('p-drop', this);
  }

  /**
   * A handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch common variables.
    let items = this._model.items;
    let nodes = this._items;
    let content = this.node.lastChild;

    // Remove any excess item nodes.
    while (nodes.length > items.length) {
      let node = nodes.pop();
      content.removeChild(node);
    }

    // Add any missing item nodes.
    while (nodes.length < items.length) {
      let node = createItemNode();
      nodes.push(node);
      content.appendChild(node);
    }

    // Update the node state to match the model contents.
    for (let i = 0, n = items.length; i < n; ++i) {
      updateItemNode(items[i], nodes[i]);
    }

    // Update the breadcrumb list.
    updateCrumbs(this._crumbs, this._crumbSeps, this._model.path);
  }

  /**
   * Handle the `'mousedown'` event for the file browser.
   */
  private _evtMousedown(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Handle a button selection.
    let index = hitTestNodes(this._buttons, event.clientX, event.clientY);
    if (index !== -1) {
      this._buttons[index].classList.add(SELECTED_CLASS);
      if (index === Button.Refresh) {
        this._model.refresh();
      } else if (index === Button.New) {
        let rect = this._buttons[index].getBoundingClientRect();
        this._newMenu.popup(rect.left, rect.bottom, false, true);
      }
      return;
    }

    // Handle an item selection.
    index = hitTestNodes(this._items, event.clientX, event.clientY);
    if (index !== -1) {
      this._dragData = { pressX: event.clientX, pressY: event.clientY };
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

  }

  /**
   * Handle the `'mouseup'` event for the file browser.
   */
  private _evtMouseup(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    for (let node of this._buttons) {
      node.classList.remove(SELECTED_CLASS);
    }

    document.removeEventListener('mousemove', this, true);
  }

  /**
   * Handle the `'mousemove'` event for the file browser.
   */
  private _evtMousemove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this._drag) {
      return;
    }
    let data = this._dragData;
    let dx = Math.abs(event.clientX - data.pressX);
    let dy = Math.abs(event.clientY - data.pressY);
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      return;
    }
    let rect = this.node.getBoundingClientRect();
    this._drag = new Drag({
      mimeData: new MimeData(),
      supportedActions: DropActions.Move,
      proposedAction: DropAction.Move
    });
    this._drag.mimeData.setData(CONTENTS_MIME, null);
    let { clientX, clientY } = event;
    document.removeEventListener('mousemove', this, true);
    this._drag.start(clientX, clientY).then(action => {
      console.log('action', action);
      this._drag = null;
    });

  }

  /**
   * Handle the `'click'` event for the file browser.
   */
  private _evtClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Handle the edit node.
    if (this._editNode.parentNode) {
      if (!this._editNode.contains(event.target as HTMLElement)) {
        this._editNode.focus();
        this._editNode.blur();
      } else {
        return;
      }
    }

    // Check for a breadcrumb hit.
    let index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
    if (index !== -1) {
      // If the home node was clicked, set the path to root.
      if (index == Crumb.Home) {
        this._model.path = '';
        return;
      }

      // Grab the portion of the path based on which node was clicked.
      let splice = 3 - index;
      let path = this._model.path.split('/');
      path = path.splice(0, path.length - splice);
      this._model.path = path.join('/');
      return;
    }

    // Check for a file item hit.
    index = hitTestNodes(this._items, event.clientX, event.clientY);
    if (index !== -1) {
      this._handleFileClick(event, index);;
    } else {
      // Remove the pending select flag.
      this._pendingSelect = false;
    }
  }

  /**
   * Handle the `'dblclick'` event for the file browser.
   */
  private _evtDblClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Find the target file item.
    let index = hitTestNodes(this._items, event.clientX, event.clientY);
    if (index === -1) {
      return;
    }

    // Remove the pending select flag.
    this._pendingSelect = false;

    // Open the selected item.
    this._model.open();
  }

  /**
   * Handle the `'p-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: IDragEvent): void {
    if (event.mimeData.hasData(CONTENTS_MIME)) {
      let index = hitTestNodes(this._items, event.clientX, event.clientY);
      if (index === -1) {
        index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
      }
      if (index !== -1) {
         event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * Handle the `'p-dragleave'` event for the dock panel.
   */
  private _evtDragLeave(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    let related = event.relatedTarget as HTMLElement;
    if (!related || !this.node.contains(related)) {
      console.log('Drag left');
    }
  }

  /**
   * Handle the `'p-dragover'` event for the dock panel.
   */
  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;
  }

  /**
   * Handle the `'p-drop'` event for the dock panel.
   */
  private _evtDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.proposedAction === DropAction.None) {
      event.dropAction = DropAction.None;
      return;
    }
    let contents = event.mimeData.getData(CONTENTS_MIME);
    console.log('Got contents', contents);
    event.dropAction = event.proposedAction;
  }

  /**
   * Handle a click on a file node.
   */
  private _handleFileClick(event: MouseEvent, index: number) {
    // Fetch common variables.
    let items = this._model.items;
    let nodes = this._items;
    var current = nodes[index];

    // Handle toggling.
    if (event.metaKey || event.ctrlKey) {
      if (current.classList.contains(SELECTED_CLASS)) {
        current.classList.remove(SELECTED_CLASS);
      } else {
        current.classList.add(SELECTED_CLASS);
      }

    // Handle multiple select.
    } else if (event.shiftKey) {
      // Find the "nearest selected".
      let nearestIndex = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (i === index) {
          continue;
        }
        if (nodes[i].classList.contains(SELECTED_CLASS)) {
          if (nearestIndex === -1) {
            nearestIndex = i;
          } else {
            if (Math.abs(index - i) < Math.abs(nearestIndex - i)) {
              nearestIndex = i;
            }
          }
        }
      }

      // Default to the first element (and fill down).
      if (nearestIndex === -1) {
        nearestIndex = 0;
      }

      // Select the rows between the current and the nearest selected.
      for (let i = 0; i < nodes.length; i++) {
        if (nearestIndex >= i && index <= i ||
            nearestIndex <= i && index >= i) {
          nodes[i].classList.add(SELECTED_CLASS);
        }
      }

    // Default to selecting the only the item.
    } else {
      // Handle a rename.
      if (this._model.selected.length === 1 &&
          current.classList.contains(SELECTED_CLASS)) {
        if (this._pendingSelect) {
          setTimeout(() => {
            if (this._pendingSelect) {
              this._doRename(current);
            } else {
              this._pendingSelect = true;
            }
          }, RENAME_DURATION);
          return;
        }
      } else {
        this._pendingSelect = true;
      }

      // Add the selected class to current row, and remove from all others.
      for (let node of nodes) {
        node.classList.remove(SELECTED_CLASS);
      }
      current.classList.add(SELECTED_CLASS);
    }

    // Set the selected items on the model.
    let selected: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].classList.contains(SELECTED_CLASS)) {
        selected.push(i);
      }
    }
    this._model.selected = selected;
  }

  /**
   * Handle a file upload event.
   */
  private _handleUploadEvent(event: Event) {
    for (var file of (event.target as any).files) {
      this._model.upload(file).catch(error => {
        if (error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.node,
            body: error.message + ', overwrite?'
          }
          showDialog(options).then(button => {
            if (button.text === 'OK') {
              this._model.upload(file, true);
            }
          });
        } else {
          this._showErrorMessage('Upload Error', error.message);
        }
      });
    }
  }

  /**
   * Handle a "new" command execution.
   */
  private _handleNewCommand(type: string): void {
    this._model.newUntitled(type);
  }

  /**
   * Allow the user to rename item on a given row.
   */
  private _doRename(row: HTMLElement): void {
    let text = row.getElementsByClassName(ROW_TEXT_CLASS)[0] as HTMLElement;
    let content = text.textContent;

    doRename(row, text, this._editNode).then(changed => {
      if (!changed) {
        return;
      }
      this._model.rename(content, this._editNode.value).catch(error => {
        if (error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.node,
            body: error.message + ', overwrite?'
          }
          showDialog(options).then(button => {
            if (button.text === 'OK') {
              this._model.rename(content, this._editNode.value, true);
            } else {
              text.textContent = content;
            }
          });
        } else {
          this._showErrorMessage('Rename Error', error.message);
        }
      });
    });
  }

  private _showErrorMessage(title: string, message: string) {
    let options = {
      title: title,
      host: this.node,
      body: message,
      buttons: [okButton]
    }
    showDialog(options);
  }
  /**
   * Handle a `changed` signal from the model.
   */
  private _onChanged(model: FileBrowserViewModel, change: IChangedArgs<IContentsModel>): void {
    if (change.name === 'refresh') {
      this.update();
    }
  }

  private _model: FileBrowserViewModel = null;
  private _items: HTMLElement[] = [];
  private _crumbs: HTMLElement[] = [];
  private _crumbSeps: HTMLElement[] = [];
  private _buttons: HTMLElement[] = [];
  private _newMenu: Menu = null;
  private _pendingSelect = false;
  private _editNode: HTMLInputElement = null;
  private _drag: Drag = null;
  private _dragData: { pressX: number, pressY: number } = null;
}


/**
 * Breadcrumb item list enum.
 */
enum Crumb {
  Home,
  Ellipsis,
  First,
  Second
}


/**
 * Button item list enum.
 */
enum Button {
  New,
  Upload,
  Refresh
}


/**
 * Create an uninitialized DOM node for an IContentsModel.
 */
function createItemNode(): HTMLElement {
  let node = document.createElement('li');
  let inode = document.createElement('span');
  inode.className = ROW_ICON_CLASS;
  let tnode = document.createElement('span');
  tnode.className = ROW_TEXT_CLASS;
  let mnode = document.createElement('span');
  mnode.className = ROW_TIME_CLASS;
  node.appendChild(inode);
  node.appendChild(tnode);
  node.appendChild(mnode);
  return node;
}


/**
 * Create the icon node class name for an IContentsModel.
 */
function createIconClass(item: IContentsModel): string {
  if (item.type === 'directory') {
    return ROW_ICON_CLASS + ' ' + FOLDER_ICON_CLASS;
  } else {
    return ROW_ICON_CLASS + ' ' + FILE_ICON_CLASS;
  }
}


/**
 * Create the text node content for an IContentsModel.
 */
function createTextContent(item: IContentsModel): string {
  return item.name;
}


/**
 * Create the last modified node content for an IContentsModel.
 */
function createModifiedContent(item: IContentsModel): string {
  if (item.last_modified) {
    return moment(item.last_modified).fromNow();
  } else {
    return '';
  }
}

/**
 * Update the node state for an IContentsModel.
 */
function updateItemNode(item: IContentsModel, node: HTMLElement): void {
  let icon = node.firstChild as HTMLElement;
  let text = node.children[1] as HTMLElement;
  let modified = node.lastChild as HTMLElement;
  node.className = ROW_CLASS;
  icon.className = createIconClass(item);
  text.textContent = createTextContent(item);
  modified.textContent = createModifiedContent(item);
}


/**
 * Populate the breadcrumb node.
 */
function updateCrumbs(breadcrumbs: HTMLElement[], separators: HTMLElement[], path: string) {
  let node = breadcrumbs[0].parentNode;

  // Remove all but the home node.
  while (node.firstChild.nextSibling) {
    node.removeChild(node.firstChild.nextSibling);
  }

  let parts = path.split('/');
  if (parts.length > 2) {
    parts = [parts[parts.length - 2], parts[parts.length - 1]];
    node.appendChild(separators[0]);
    node.appendChild(breadcrumbs[Crumb.Ellipsis]);
  }

  if (path) {
    node.appendChild(separators[1]);
    breadcrumbs[Crumb.First].textContent = parts[0];
    node.appendChild(breadcrumbs[Crumb.First]);
    if (parts.length === 2) {
      node.appendChild(separators[2]);
      breadcrumbs[Crumb.Second].textContent = parts[1];
      node.appendChild(breadcrumbs[Crumb.Second]);
    }
  }
}


/**
 * Create the breadcrumb nodes.
 */
function createCrumbs(): HTMLElement[] {
  let home = document.createElement('i');
  home.className = 'fa fa-home ' + BREADCRUMB_ITEM_CLASS;
  let ellipsis = document.createElement('i');
  ellipsis.className = 'fa fa-ellipsis-h ' + BREADCRUMB_ITEM_CLASS;
  let first = document.createElement('span');
  first.className = BREADCRUMB_ITEM_CLASS;
  let second = document.createElement('span');
  second.className = BREADCRUMB_ITEM_CLASS;
  return [home, ellipsis, first, second];
}


/**
 * Create the breadcrumb separator nodes.
 */
function createCrumbSeparators(): HTMLElement[] {
  let items: HTMLElement[] = [];
  for (let i = 0; i < 3; i++) {
    let item = document.createElement('i');
    item.className = 'fa fa-angle-right ' + BREADCRUMB_ITEM_CLASS;
    items.push(item);
  }
  return items;
}


/**
 * Create the button nodes.
 */
function createButtons(buttonBar: HTMLElement): HTMLElement[] {
  let buttons: HTMLElement[] = [];
  for (let i = 0; i < 3; i++) {
    let button = document.createElement('li');
    button.className = BUTTON_ITEM_CLASS + ' fa';
    buttonBar.appendChild(button);
    buttons.push(button);
  }
  buttons[Button.New].classList.add('fa-plus');
  buttons[Button.New].title = 'Create New...';
  buttons[Button.Refresh].classList.add('fa-refresh');
  buttons[Button.Refresh].title = 'Refresh File List';

  // Create the upload button with a hidden input.
  let text = document.createElement('span');
  text.classList.add('fa-upload');
  let file = document.createElement('input');
  file.setAttribute("type", "file");
  file.setAttribute("multiple", "multiple");
  buttons[Button.Upload].classList.add(UPLOAD_CLASS);
  buttons[Button.Upload].appendChild(text);
  buttons[Button.Upload].appendChild(file);
  buttons[Button.Upload].title = 'Upload File(s)';
  return buttons;
}


/**
 * Create the "new" menu.
 */
function createMenu(command: ICommand): Menu {
  return new Menu([
    new MenuItem({
      text: 'Notebook',
      command: command,
      commandArgs: 'notebook'
    }),
    new MenuItem({
      text: 'Text File',
      command: command,
      commandArgs: 'file'
    }),
    new MenuItem({
      text: 'Directory',
      command: command,
      commandArgs: 'directory'
    })
  ]);
}


/**
 * Handle editing text on a node.
 *
 * @returns Boolean indicating whether the name changed.
 */
function doRename(parent: HTMLElement, text: HTMLElement, edit: HTMLInputElement): Promise<boolean> {
  let changed = true;
  parent.replaceChild(edit, text);
  edit.value = text.textContent;
  edit.focus();
  let index = edit.value.indexOf('.');
  if (index === -1) {
    edit.setSelectionRange(0, edit.value.length);
  } else {
    edit.setSelectionRange(0, index);
  }

  return new Promise<boolean>((resolve, reject) => {
    edit.onblur = () => {
      parent.replaceChild(text, edit);
      if (text.textContent === edit.value) {
        changed = false;
      }
      if (changed) text.textContent = edit.value;
      resolve(changed);
    }
    edit.onkeydown = (event: KeyboardEvent) => {
      switch (event.keyCode) {
      case 13:  // Enter
        event.stopPropagation();
        event.preventDefault();
        edit.blur();
        break;
      case 27:  // Escape
        event.stopPropagation();
        event.preventDefault();
        changed = false;
        edit.blur();
        break;
      }
    }
  });
}


/**
 * Get the index of the node at a client position, or `-1`.
 */
function hitTestNodes(nodes: HTMLElement[], x: number, y: number): number {
  for (let i = 0, n = nodes.length; i < n; ++i) {
    if (hitTest(nodes[i], x, y)) return i;
  }
  return -1;
}
