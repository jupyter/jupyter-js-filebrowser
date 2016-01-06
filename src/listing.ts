// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContentsModel
} from 'jupyter-js-services';

import * as moment from 'moment';

import {
  okButton, showDialog
} from 'phosphor-dialog';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Drag, DropAction, DropActions, IDragEvent, MimeData
} from 'phosphor-dragdrop';

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
  Widget
} from 'phosphor-widget';

import {
  FileBrowserViewModel
} from './viewmodel';

import {
  CONTENTS_MIME, DROP_TARGET_CLASS, hitTestNodes, showErrorMessage
} from './utils';


/**
 * The class name added to the Filebrowser list area container.
 */
const LIST_CONTAINER_CLASS = 'jp-DirListing-container';

/**
 * The class name added to FileBrowser list area.
 */
const LIST_AREA_CLASS = 'jp-DirListing';

/**
 * The class name added to FileBrowser items.
 */
const ITEM_CLASS = 'jp-DirListing-item';

/**
 * The class name added to FileBrowser item files.
 */
const ITEM_FILE_CLASS = 'jp-DirListing-itemFile';

/**
 * The class name added to a row icon.
 */
const ITEM_ICON_CLASS = 'jp-DirListing-itemFileIcon';

/**
 * The class name added to a row text.
 */
const ITEM_TEXT_CLASS = 'jp-DirListing-itemFileText';

/**
 * The class name added to a row filename editor.
 */
const ITEM_EDIT_CLASS = 'jp-DirListing-itemFileEdit';

/**
 * The class name added to a row last modified text.
 */
const ITEM_TIME_CLASS = 'jp-DirListing-itemModified';

/**
 * The class name added to a file icon.
 */
const FILE_ICON_CLASS = 'jp-DirListing-fileIcon';

/**
 * The class name added to a folder icon.
 */
const FOLDER_ICON_CLASS = 'jp-DirListing-folderIcon';

/**
 * The class name added to a notebook icon.
 */
const NOTEBOOK_ICON_CLASS = 'jp-DirListing-nbIcon';

/**
 * The class name added to the widget when there are items on the clipboard.
 */
const CLIPBOARD_CLASS = 'jp-mod-clipboard';

/**
 * The class name added to cut rows.
 */
const CUT_CLASS = 'jp-mod-cut';

/**
 * The class name added when there are more than one selected rows.
 */
const MULTI_SELECTED_CLASS = 'jp-mod-multiSelected';

/**
 * The class name added to indicate running notebook.
 */
const RUNNING_CLASS = 'jp-mod-running';

/**
 * The class name added to selected rows.
 */
const SELECTED_CLASS = 'jp-mod-selected';


/**
 * The minimum duration for a rename select in ms.
 */
const RENAME_DURATION = 500;

/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;


/**
 * A widget which host a file list area.
 */
export
class DirListing extends Widget {

  /**
   * Create a new node for the file list.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('ul') as HTMLElement;
    content.className = LIST_AREA_CLASS;
    node.appendChild(content);
    return node;
  }

  /**
   * Create a file item.
   */
  static createItem(): HTMLElement {
    return createItemNode();
  }

  /**
   * Update a file item.
   */
  static updateItem(item: IContentsModel, node: HTMLElement) {
    updateItemNode(item, node);
  }

  /**
   * Construct a new file browser directory listing widget.
   *
   * @param model - The file browser view model.
   */
  constructor(model: FileBrowserViewModel) {
    super();
    this.addClass(LIST_CONTAINER_CLASS);
    this._model = model;
    this._model.changed.connect(this._onChanged.bind(this));
    // Create the edit node.
    this._editNode = document.createElement('input');
    this._editNode.className = ITEM_EDIT_CLASS;
  }

  /**
   * Dispose of the resources held by the directory listing.
   */
  dispose(): void {
    this._model = null;
    this._items = null;
    this._editNode = null;
    this._drag = null;
    this._dragData = null;
    super.dispose();
  }

  /**
   * Should get whether the directory listing is disposed.
   */
  get isDisposed(): boolean {
    return this._model === null;
  }

  /**
   * Open the currently selected item(s).
   */
  open(): void {
    for (let name of this._selectedNames) {
      this._model.open(name).catch(error => {
        showErrorMessage(this, 'Open file', error);
      });
    }
  }

  /**
   * Rename the first currently selected item.
   */
  rename(): void {
    this._doRename();
  }

  /**
   * Cut the selected items.
   */
  cut(): void {
    this._copy(true);
  }

  /**
   * Copy the selected items.
   */
  copy(): void {
    // Remove any cut modifiers.
    for (let item of this._items) {
      item.classList.remove(CUT_CLASS);
    }
    this._copy(false);
  }

  /**
   * Paste the items from the clipboard.
   */
  paste(): void {
    if (!this._clipboard.length) {
      return;
    }
    let promises: Promise<void>[] = [];
    for (let path of this._clipboard) {
      if (this._isCut) {
        let parts = path.split('/');
        let name = parts[parts.length - 1];
        promises.push(this._model.rename(path, name).catch(error => {
          showErrorMessage(this, 'Paste Error', error);
        }));
      } else {
        promises.push(this._model.copy(path, '.').catch(error => {
          showErrorMessage(this, 'Paste Error', error);
        }));
      }
    }
    // Remove any cut modifiers.
    for (let item of this._items) {
      item.classList.remove(CUT_CLASS);
    }

    this._clipboard = [];
    this._isCut = false;
    this.node.classList.remove(CLIPBOARD_CLASS);
    Promise.all(promises).then(() => this._refresh());
  }

  /**
   * Delete the currently selected item(s).
   */
  delete(): void {
    let promises: Promise<void>[] = [];
    for (let name of this._selectedNames) {
      promises.push(this._model.delete(name).catch(error => {
        showErrorMessage(this, 'Delete file', error);
      }));
    }
    Promise.all(promises).then(() => this._refresh());
  }

  /**
   * Duplicate the currently selected item(s).
   */
  duplicate(): void {
    let promises: Promise<void>[] = [];
    for (let index of this._model.selected) {
      let item = this._model.items[index];
      if (item.type !== 'directory') {
        promises.push(this._model.copy(item.path, this._model.path)
        .catch(error => {
          showErrorMessage(this, 'Duplicate file', error);
        }));
      }
    }
    Promise.all(promises).then(() => this._refresh());
  }

  /**
   * Download the currently selected item(s).
   */
  download(): void {
    for (let index of this._model.selected) {
      let item = this._model.items[index];
      if (item.type !== 'directory') {
        this._model.download(item.path).catch(error => {
          showErrorMessage(this, 'Download file', error);
        });
      }
    }
  }

  /**
   * Shut down kernels on the applicable currently selected items.
   */
  shutdownKernels() {
    let promises: Promise<void>[] = [];
    let paths = this._model.items.map(item => item.path);
    for (let sessionId of this._model.sessionIds) {
      let index = paths.indexOf(sessionId.notebook.path);
      if (this._items[index].classList.contains(SELECTED_CLASS)) {
        promises.push(this._model.shutdown(sessionId).catch(error => {
          showErrorMessage(this, 'Shutdown kernel', error);
        }));
      }
    }
    Promise.all(promises).then(() => this._refresh());
  }

  /**
   * Handle the DOM events for the directory listing.
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
    case 'mousedown':
      this._evtMousedown(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseup(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMousemove(event as MouseEvent);
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
    node.addEventListener('dblclick', this);
    node.addEventListener('p-dragenter', this);
    node.addEventListener('p-dragleave', this);
    node.addEventListener('p-dragover', this);
    node.addEventListener('p-drop', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    node.removeEventListener('mousedown', this);
    node.removeEventListener('mouseup', this);
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
    let content = this.node.firstChild as HTMLElement;
    let subtype = this.constructor;

    // Remove any excess item nodes.
    while (nodes.length > items.length) {
      let node = nodes.pop();
      content.removeChild(node);
    }

    // Add any missing item nodes.
    while (nodes.length < items.length) {
      let node = subtype.createItem();
      nodes.push(node);
      content.appendChild(node);
    }

    // Update the node state to match the model contents.
    for (let i = 0, n = items.length; i < n; ++i) {
      subtype.updateItem(items[i], nodes[i]);
    }

    // If the path has not changed, select any previously selected names that
    // have not changed.  Also handle cut modifiers.
    if (this._model.path == this._prevPath) {
      let newNames = this._model.items.map(item => item.name);
      for (let name of this._selectedNames) {
        let index = newNames.indexOf(name);
        if (index !== 1) {
          this._items[index].classList.add(SELECTED_CLASS);
          let path = '/' + this._model.items[index].path;
          if (this._isCut && (this._clipboard.indexOf(path) !== -1)) {
            this._items[index].classList.add(CUT_CLASS);
          }
        }
      }
    }

    // Update the selected items
    this._updateSelected();

    // Handle notebook session statuses.
    let paths = this._model.items.map(item => item.path);
    for (let sessionId of this._model.sessionIds) {
      let index = paths.indexOf(sessionId.notebook.path);
      let node = this._items[index].getElementsByClassName(NOTEBOOK_ICON_CLASS)[0];
      node.classList.add(RUNNING_CLASS);
      (node as HTMLElement).title = sessionId.kernel.name;
    }
    if (this._model.sessionIds.length) {
      content.classList.add(RUNNING_CLASS);
    } else {
      content.classList.remove(RUNNING_CLASS);
    }

    this._prevPath = this._model.path;
  }

  /**
   * Handle the `'mousedown'` event for the widget.
   */
  private _evtMousedown(event: MouseEvent) {
    let index = hitTestNodes(this._items, event.clientX, event.clientY);
    if (index == -1) {
      return;
    }

    // Blur the edit node if necessary.
    if (this._editNode.parentNode) {
      if (this._editNode !== event.target as HTMLElement) {
        this._editNode.focus();
        this._editNode.blur();
        this._pendingSelect = false;
      } else {
        return;
      }
    }

    // Left mouse press for drag start.
    if (event.button === 0) {
      this._dragData = { pressX: event.clientX, pressY: event.clientY,
                         index: index };
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

    // Update our selection.
    this._handleFileSelect(event);
    this._updateSelected();

    if (event.button !== 0) {
      this._pendingSelect = false;
    }
  }

  /**
   * Handle the `'mouseup'` event for the widget.
   */
  private _evtMouseup(event: MouseEvent) {
    if (event.button !== 0 || !this._drag) {
      document.removeEventListener('mousemove', this, true);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'mousemove'` event for the widget.
   */
  private _evtMousemove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Bail if we are the one dragging.
    if (this._drag) {
      return;
    }

    // Check for a drag initialization.
    let data = this._dragData;
    let dx = Math.abs(event.clientX - data.pressX);
    let dy = Math.abs(event.clientY - data.pressY);
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      return;
    }

    this._startDrag(data.index, event.clientX, event.clientY);
  }

  /**
   * Handle the `'dblclick'` event for the widget.
   */
  private _evtDblClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    this._pendingSelect = false;

    // Find a valid double click target.
    let node = event.target as HTMLElement;
    while (node && node !== this.node) {
      if (node.classList.contains(ITEM_CLASS)) {
        // Open the selected item.
        let index = this._items.indexOf(node);
        let path = this._model.items[index].name;
        this._model.open(path).catch(error => {
          showErrorMessage(this, 'Open Error', error);
        });
        return;
      }
      node = node.parentElement;
    }
  }

  /**
   * Handle the `'p-dragenter'` event for the widget.
   */
  private _evtDragEnter(event: IDragEvent): void {
    if (event.mimeData.hasData(CONTENTS_MIME)) {
      let index = hitTestNodes(this._items, event.clientX, event.clientY);
      let target = this._items[index];
      if (target.getElementsByClassName(FOLDER_ICON_CLASS).length &&
          !target.classList.contains(SELECTED_CLASS)) {
        target.classList.add(DROP_TARGET_CLASS);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }

  /**
   * Handle the `'p-dragleave'` event for the widget.
   */
  private _evtDragLeave(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    let dropTargets = this.node.getElementsByClassName(DROP_TARGET_CLASS);
    if (dropTargets.length) {
      dropTargets[0].classList.remove(DROP_TARGET_CLASS);
    }
  }

  /**
   * Handle the `'p-dragover'` event for the widget.
   */
  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;
    let dropTargets = this.node.getElementsByClassName(DROP_TARGET_CLASS);
    if (dropTargets.length) {
      dropTargets[0].classList.remove(DROP_TARGET_CLASS);
    }
    let index = hitTestNodes(this._items, event.clientX, event.clientY);
    this._items[index].classList.add(DROP_TARGET_CLASS);
  }


  /**
   * Handle the `'p-drop'` event for the widget.
   */
  private _evtDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.proposedAction === DropAction.None) {
      event.dropAction = DropAction.None;
      return;
    }
    if (!event.mimeData.hasData(CONTENTS_MIME)) {
      return;
    }
    event.dropAction = event.proposedAction;

    let target = event.target as HTMLElement;
    while (target && target.parentElement) {
      if (target.classList.contains(DROP_TARGET_CLASS)) {
        target.classList.remove(DROP_TARGET_CLASS);
        break;
      }
      target = target.parentElement;
    }

    // Get the path based on the target node.
    let index = this._items.indexOf(target);
    var path = this._model.items[index].name + '/';

    // Move all of the items.
    let promises: Promise<void>[] = [];
    for (let index of this._model.selected) {
      var original = this._model.items[index].name;
      var newPath = path + original;
      promises.push(this._model.rename(original, newPath).catch(error => {
        if (error.message.indexOf('409') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.node,
            body: `"${newPath}" already exists, overwrite?`
          }
          showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.delete(newPath).then(() => {
                return this._model.rename(original, newPath);
              });
            }
          });
        }
      }).catch(error => {
        showErrorMessage(this, 'Move Error', error.message);
      }));
    }
    Promise.all(promises).then(() => this._model.open('.'));
  }

  /**
   * Start a drag event.
   */
  private _startDrag(index: number, clientX: number, clientY: number) {
    // Make sure the source node is selected.
    let source = this._items[index];
    if (!source.classList.contains(SELECTED_CLASS)) {
      source.classList.add(SELECTED_CLASS);
      this._updateSelected();
    }

    // Create the drag image.
    var dragImage = source.cloneNode(true) as HTMLElement;
    dragImage.removeChild(dragImage.lastChild);
    if (this._model.selected.length > 1) {
      let text = dragImage.getElementsByClassName(ITEM_TEXT_CLASS)[0];
      text.textContent = '(' + this._model.selected.length + ')'
    }

    // Set up the drag event.
    this._drag = new Drag({
      dragImage: dragImage,
      mimeData: new MimeData(),
      supportedActions: DropActions.Move,
      proposedAction: DropAction.Move
    });
    this._drag.mimeData.setData(CONTENTS_MIME, null);

    // Start the drag and remove the mousemove listener.
    this._drag.start(clientX, clientY).then(action => {
      console.log('action', action);
      this._drag = null;
    });
    document.removeEventListener('mousemove', this, true);
  }

  /**
   * Handle selection on a file node.
   */
  private _handleFileSelect(event: MouseEvent) {
    // Fetch common variables.
    let items = this._model.items;
    let nodes = this._items;
    let index = hitTestNodes(this._items, event.clientX, event.clientY);
    let target = this._items[index];

    for (let node of nodes) {
      node.classList.remove(CUT_CLASS);
    }

    // Handle toggling.
    if (event.metaKey || event.ctrlKey) {
      if (target.classList.contains(SELECTED_CLASS)) {
        target.classList.remove(SELECTED_CLASS);
      } else {
        target.classList.add(SELECTED_CLASS);
      }

    // Handle multiple select.
    } else if (event.shiftKey) {
      handleMultiSelect(nodes, nodes.indexOf(target));

    // Default to selecting the only the item.
    } else {
      // Handle a rename.
      if (this._model.selected.length === 1 &&
          target.classList.contains(SELECTED_CLASS)) {
        if (this._pendingSelect) {
          setTimeout(() => {
            if (this._pendingSelect) {
              this._doRename();
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
      target.classList.add(SELECTED_CLASS);
    }
  }

  /**
   * Update the selected indices of the model.
   */
  private _updateSelected() {
    // Set the selected items on the model.
    let selected: number[] = [];
    this._selectedNames = [];
    let items = this._model.items;
    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].classList.contains(SELECTED_CLASS)) {
        selected.push(i);
        this._selectedNames.push(items[i].name);
      }
    }
    this._model.selected = selected;

    // Handle the selectors on the widget node.
    if (selected.length <= 1) {
      this.node.classList.remove(MULTI_SELECTED_CLASS);
    } else {
      this.node.classList.add(MULTI_SELECTED_CLASS);
    }
    if (!selected.length) {
      this.node.classList.remove(SELECTED_CLASS);
    } else {
      this.node.classList.add(SELECTED_CLASS);
    }
  }

  /**
   * Copy the selected items, and optionally cut as well.
   */
  private _copy(isCut: boolean): void {
    this._clipboard = []
    this._isCut = isCut;
    for (let index of this._model.selected) {
      let item = this._model.items[index];
      let row = this._items[index];
      if (item.type !== 'directory') {
        if (isCut) row.classList.add(CUT_CLASS);
        // Store the absolute path of the item.
        this._clipboard.push('/' + item.path)
      }
    }
    // Add the clipboard class to allow "Paste" actions.
    if (this._clipboard.length) {
      this.node.classList.add(CLIPBOARD_CLASS);
    } else {
      this.node.classList.remove(CLIPBOARD_CLASS);
    }
  }

  /**
   * Allow the user to rename item on a given row.
   */
  private _doRename(): void {
    let row = this.node.getElementsByClassName(SELECTED_CLASS)[0];
    let fileCell = row.getElementsByClassName(ITEM_FILE_CLASS)[0];
    let text = row.getElementsByClassName(ITEM_TEXT_CLASS)[0] as HTMLElement;
    let original = text.textContent;

    doRename(fileCell as HTMLElement, text, this._editNode).then(changed => {
      if (!changed) {
        return;
      }
      let newPath = text.textContent;
      this._model.rename(original, newPath).catch(error => {
        if (error.message.indexOf('409') !== -1 ||
            error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.node,
            body: `"${newPath}" already exists, overwrite?`
          }
          showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.delete(newPath).then(() => {
                return this._model.rename(original, newPath);
              });
            } else {
              text.textContent = original;
            }
          });
        }
      }).catch(error => {
        showErrorMessage(this, 'Rename Error', error.message);
      }).then(() => this._model.open('.'));
    });
  }

  /**
   * Force a refresh of the current directory.
   */
  private _refresh(): void {
    this._model.open('.').catch(error => {
      showErrorMessage(this, 'Refresh Error', error);
    });
  }

  /**
   * Handle a `changed` signal from the model.
   */
  private _onChanged(model: FileBrowserViewModel, change: IChangedArgs<IContentsModel>): void {
    if (change.name === 'open' && change.newValue.type === 'directory') {
      this.update();
    }
  }

  private _model: FileBrowserViewModel = null;
  private _editNode: HTMLInputElement = null;
  private _items: HTMLElement[] = [];
  private _drag: Drag = null;
  private _dragData: { pressX: number, pressY: number, index: number } = null;
  private _pendingSelect = false;
  private _prevPath = '';
  private _selectedNames: string[] = [];
  private _isCut = false;
  private _clipboard: string[] = [];
}


/**
 * Create an uninitialized DOM node for an IContentsModel.
 */
function createItemNode(): HTMLElement {
  let node = document.createElement('li');
  node.className = ITEM_CLASS;
  let fnode = document.createElement('div');
  fnode.className = ITEM_FILE_CLASS;
  let inode = document.createElement('span');
  inode.className = ITEM_ICON_CLASS;
  let tnode = document.createElement('span');
  tnode.className = ITEM_TEXT_CLASS;
  let mnode = document.createElement('span');
  mnode.className = ITEM_TIME_CLASS;
  fnode.appendChild(inode);
  fnode.appendChild(tnode);
  node.appendChild(fnode);
  node.appendChild(mnode);
  return node;
}


/**
 * Create the icon node class name for an IContentsModel.
 */
function createIconClass(item: IContentsModel): string {
  if (item.type === 'directory') {
    return ITEM_ICON_CLASS + ' ' + FOLDER_ICON_CLASS;
  } else if (item.type === 'notebook') {
    return ITEM_ICON_CLASS + ' ' + NOTEBOOK_ICON_CLASS;
  } else {
    return ITEM_ICON_CLASS + ' ' + FILE_ICON_CLASS;
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
    let text = moment(item.last_modified).fromNow();
    return text === 'a few seconds ago' ? 'seconds ago' : text;
  } else {
    return '';
  }
}


/**
 * Update the node state for an IContentsModel.
 */
function updateItemNode(item: IContentsModel, node: HTMLElement): void {
  let icon = node.firstChild.firstChild as HTMLElement;
  let text = (node.firstChild as HTMLElement).children[1] as HTMLElement;
  let modified = node.lastChild as HTMLElement;
  icon.className = createIconClass(item);
  text.textContent = createTextContent(item);
  modified.textContent = createModifiedContent(item);
  node.classList.remove(SELECTED_CLASS);
  node.classList.remove(CUT_CLASS);
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
 * Handle a multiple select on a file item node.
 */
function handleMultiSelect(nodes: HTMLElement[], index: number) {
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
}
