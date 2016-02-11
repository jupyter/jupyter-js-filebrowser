// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContentsModel
} from 'jupyter-js-services';

import {
  okButton, showDialog
} from 'jupyter-js-domutils';

import * as moment
  from 'moment';

import * as arrays
  from 'phosphor-arrays';

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
  ISignal, Signal
} from 'phosphor-signaling';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowserModel, FileBrowserWidget
} from './index';

import * as utils
  from './utils';

import {
  SELECTED_CLASS
} from './utils';


/**
 * The class name added to FileBrowser list area.
 */
const DIRLISTING_CLASS = 'jp-DirListing';

/**
 * The class name added to FileBrowser list header area.
 */
const LIST_HEADER_CLASS = 'jp-DirListing-header';

/**
 * The class name added to FileBrowser list header file item.
 */
const HEADER_TEXT_CLASS = 'jp-DirListing-headerText';

/**
 * The class name added to FileBrowser list header items.
 */
const HEADER_ITEM_CLASS = 'jp-DirListing-headerItem';

/**
 * The class name added to FileBrowser list header modified item.
 */
const HEADER_ICON_CLASS = 'jp-DirListing-headerIcon';

/**
 * The class name added to FileBrowser list header file item.
 */
const HEADER_FILE_CLASS = 'jp-DirListing-headerFile';

/**
 * The class name added to FileBrowser list header modified item.
 */
const HEADER_TIME_CLASS = 'jp-DirListing-headerTime';

/**
 * The class name added to the Filebrowser list area container.
 */
const LIST_CONTAINER_CLASS = 'jp-DirListing-container';

/**
 * The class name added to FileBrowser list area.
 */
const LIST_AREA_CLASS = 'jp-DirListing-list';

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
 * The class name added for a decending sort.
 */
const DESCENDING_CLASS = 'jp-mod-descending';

/**
 * The minimum duration for a rename select in ms.
 */
const RENAME_DURATION = 500;

/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;

/**
 * The factory MIME type supported by phosphor dock panels.
 */
const FACTORY_MIME = 'application/x-phosphor-widget-factory';


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
    let header = Private.createHeader();
    let body = document.createElement('div');
    let contents = document.createElement('ul');
    body.className = LIST_CONTAINER_CLASS;
    contents.className = LIST_AREA_CLASS;
    node.appendChild(header);
    node.appendChild(body);
    body.appendChild(contents);
    node.tabIndex = 1;
    return node;
  }

  /**
   * Create a file item.
   */
  static createItem(): HTMLElement {
    return Private.createItemNode();
  }

  /**
   * Update a file item.
   */
  static updateItem(item: IContentsModel, node: HTMLElement) {
    Private.updateItemNode(item, node);
  }

  /**
   * Construct a new file browser directory listing widget.
   *
   * @param model - The file browser view model.
   */
  constructor(model: FileBrowserModel) {
    super();
    this.addClass(DIRLISTING_CLASS);
    this._model = model;
    this._model.refreshed.connect(this.update, this);
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
   * Get the open requested signal.
   */
  get openRequested(): ISignal<DirListing, IContentsModel> {
    return Private.openRequestedSignal.bind(this);
  }

  /**
   * Get the widget factory for the widget.
   */
  get widgetFactory(): (model: IContentsModel) => Widget {
    return this._widgetFactory;
  }

  /**
   * Set the widget factory for the widget.
   */
  set widgetFactory(factory: (model: IContentsModel) => Widget) {
    this._widgetFactory = factory;
  }

  /**
   * Rename the first currently selected item.
   */
  rename(): Promise<string> {
    return this._doRename();
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
  paste(): Promise<void> {
    if (!this._clipboard.length) {
      return;
    }
    let promises: Promise<IContentsModel>[] = [];
    for (let path of this._clipboard) {
      if (this._isCut) {
        let parts = path.split('/');
        let name = parts[parts.length - 1];
        promises.push(this._model.rename(path, name));
      } else {
        promises.push(this._model.copy(path, '.'));
      }
    }
    // Remove any cut modifiers.
    for (let item of this._items) {
      item.classList.remove(CUT_CLASS);
    }

    this._clipboard = [];
    this._isCut = false;
    this.node.classList.remove(CLIPBOARD_CLASS);
    return Promise.all(promises).then(
      () => this._model.refresh(),
      error => utils.showErrorMessage(this, 'Paste Error', error)
    );
  }

  /**
   * Delete the currently selected item(s).
   */
  delete(): Promise<void> {
    let promises: Promise<void>[] = [];
    let items = this._model.getSortedItems();
    for (let index of this._model.selected) {
      promises.push(this._model.delete(items[index].name));
    }
    return Promise.all(promises).then(
      () => this._model.refresh(),
      error => utils.showErrorMessage(this, 'Delete file', error)
    );
  }

  /**
   * Duplicate the currently selected item(s).
   */
  duplicate(): Promise<void> {
    let promises: Promise<IContentsModel>[] = [];
    let items = this._model.getSortedItems();
    for (let index of this._model.selected) {
      let item = items[index];
      if (item.type !== 'directory') {
        promises.push(this._model.copy(item.path, this._model.path));
      }
    }
    return Promise.all(promises).then(
      () => this._model.refresh(),
      error => utils.showErrorMessage(this, 'Duplicate file', error)
    );
  }

  /**
   * Download the currently selected item(s).
   */
  download(): Promise<void> {
    let items = this._model.getSortedItems();
    for (let index of this._model.selected) {
      let item = items[index];
      if (item.type !== 'directory') {
        return this._model.download(item.path).catch(error =>
          utils.showErrorMessage(this, 'Download file', error)
        );
      }
    }
  }

  /**
   * Shut down kernels on the applicable currently selected items.
   */
  shutdownKernels(): Promise<void> {
    let promises: Promise<void>[] = [];
    let items = this._model.getSortedItems();
    let paths = items.map(item => item.path);
    for (let sessionId of this._model.sessionIds) {
      let index = paths.indexOf(sessionId.notebook.path);
      if (this._items[index].classList.contains(SELECTED_CLASS)) {
        promises.push(this._model.shutdown(sessionId));
      }
    }
    return Promise.all(promises).then(
      () => this._model.refresh(),
      error => utils.showErrorMessage(this, 'Shutdown kernel', error)
    );
  }

  /**
   * Select next item.
   *
   * @param keepExisting - Whether to keep the current selection and add to it.
   */
  selectNext(keepExisting = false): void {
    let index = -1;
    if (this._model.selected.length === 1 || keepExisting) {
      // Select the next item.
      index = this._model.selected[this._model.selected.length - 1] + 1;
      if (index === this._items.length) index = 0;
    } else if (this._model.selected.length === 0) {
      // Select the first item.
      index = 0;
    } else {
      // Select the last selected item.
      index = this._model.selected[this._model.selected.length - 1];
    }
    if (index !== -1) {
      if (index === 0) {
        this._selectItem(index, true, keepExisting);
      } else {
        this._selectItem(index, false, keepExisting);
      }
    }
  }

  /**
   * Select previous item.
   *
   * @param keepExisting - Whether to keep the current selection and add to it.
   */
  selectPrevious(keepExisting = false): void {
    let index = -1;
    if (this._model.selected.length === 1 || keepExisting) {
      // Select the previous item.
      index = this._model.selected[0] - 1;
      if (index === -1) index = this._items.length - 1;
    } else if (this._model.selected.length === 0) {
      // Select the last item.
      index = this._items.length - 1;
    } else {
      // Select the first selected item.
      index = this._model.selected[0];
    }
    if (index !== -1) {
      if (index === this._items.length - 1) {
        this._selectItem(index, false, keepExisting);
      } else {
        this._selectItem(index, true, keepExisting);
      }
    }
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
    case 'keydown':
      this._evtKeydown(event as KeyboardEvent);
      break;
    case 'click':
      this._evtClick(event as MouseEvent);
      break
    case 'dblclick':
      this._evtDblClick(event as MouseEvent);
      break;
    case 'scroll':
      this._evtScroll(event as MouseEvent);
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
    let container = utils.findElement(node, LIST_CONTAINER_CLASS);
    let list = utils.findElement(node, LIST_AREA_CLASS);
    node.addEventListener('mousedown', this);
    node.addEventListener('keydown', this);
    node.addEventListener('click', this);
    node.addEventListener('dblclick', this);
    container.addEventListener('scroll', this);
    list.addEventListener('p-dragenter', this);
    list.addEventListener('p-dragleave', this);
    list.addEventListener('p-dragover', this);
    list.addEventListener('p-drop', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    let container = utils.findElement(node, LIST_CONTAINER_CLASS);
    let list = utils.findElement(node, LIST_AREA_CLASS);
    node.removeEventListener('mousedown', this);
    node.removeEventListener('keydown', this);
    node.removeEventListener('click', this);
    node.removeEventListener('dblclick', this);
    container.removeEventListener('scroll', this);
    list.removeEventListener('p-dragenter', this);
    list.removeEventListener('p-dragleave', this);
    list.removeEventListener('p-dragover', this);
    list.removeEventListener('p-drop', this);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
  }

  /**
   * A handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch common variables.
    let items = this._model.getSortedItems();
    let nodes = this._items;
    let content = utils.findElement(this.node, LIST_AREA_CLASS);
    let subtype = this.constructor as typeof DirListing;

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

    // Get the previously selected names.
    let prevSelected = this._items.map(item => {
      let el = utils.findElement(item, ITEM_TEXT_CLASS);
      if (item.classList.contains(SELECTED_CLASS)) {
        return el.textContent;
      }
    });

    // Update the node state to match the model contents.
    for (let i = 0, n = items.length; i < n; ++i) {
      subtype.updateItem(items[i], nodes[i]);
    }

    // If the path has not changed, select any previously selected names that
    // have not changed.  Also handle cut modifiers.
    if (this._model.path == this._prevPath) {
      for (let row of this._items) {
        let text = utils.findElement(row, ITEM_TEXT_CLASS);
        let index = prevSelected.indexOf(text.textContent);
        if (index !== -1) {
          this._items[index].classList.add(SELECTED_CLASS);
          let path = '/' + items[index].path;
          if (this._isCut && (this._clipboard.indexOf(path) !== -1)) {
            this._items[index].classList.add(CUT_CLASS);
          }
        }
      }
    }

    // Update the selected items
    this._updateSelected();

    // Handle notebook session statuses.
    let paths = items.map(item => item.path);
    for (let sessionId of this._model.sessionIds) {
      let index = paths.indexOf(sessionId.notebook.path);
      let node = utils.findElement(this._items[index], NOTEBOOK_ICON_CLASS);
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
   * Handle the `'click'` event for the widget.
   */
  private _evtClick(event: MouseEvent) {

    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
    if (index == -1) {
      let header = utils.findElement(this.node, LIST_HEADER_CLASS);
      index = utils.hitTestNodes(header.childNodes, event.clientX,
        event.clientY);
      if (index !== -1) {
        for (let i = 0; i < header.childNodes.length; i++) {
          let node = header.childNodes[i] as HTMLElement;
          if (i === index) {
            if (node.classList.contains(SELECTED_CLASS)) {
              if (node.classList.contains(DESCENDING_CLASS)) {
                node.classList.remove(DESCENDING_CLASS);
                this._model.sortAscending = true;
              } else {
                node.classList.add(DESCENDING_CLASS);
                this._model.sortAscending = false;
              }
            }
            node.classList.add(SELECTED_CLASS);
          } else {
            node.classList.remove(SELECTED_CLASS);
          }
        }
        if (index === 0) {
          this._model.sortKey = 'name';
        } else {
          this._model.sortKey = 'last_modified';
        }
        this._model.selected = [];
        this.update();
      }
      return;
    }

    // Update our selection.
    this._handleFileSelect(event);
    this._updateSelected();

  }

  /**
   * Handle the `'scroll'` event for the widget.
   */
  private _evtScroll(event: MouseEvent): void {
    let list = utils.findElement(this.node, LIST_CONTAINER_CLASS);
    let header = utils.findElement(this.node, LIST_HEADER_CLASS);
    header.scrollLeft = list.scrollLeft;
  }

  /**
   * Handle the `'mousedown'` event for the widget.
   */
  private _evtMousedown(event: MouseEvent): void {

    // Blur the edit node if necessary.
    if (this._editNode.parentNode) {
      if (this._editNode !== event.target as HTMLElement) {
        this._editNode.focus();
        this._editNode.blur();
        clearTimeout(this._selectTimer);
      } else {
        return;
      }
    }

    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
    if (index == -1) {
      return;
    }

    // Left mouse press for drag start.
    if (event.button === 0) {
      this._dragData = { pressX: event.clientX, pressY: event.clientY,
                         index: index };
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

    if (event.button !== 0) {
      clearTimeout(this._selectTimer);
    }
  }

  /**
   * Handle the `'mouseup'` event for the widget.
   */
  private _evtMouseup(event: MouseEvent): void {
    if (event.button !== 0 || !this._drag) {
      document.removeEventListener('mousemove', this, true);
      document.removeEventListener('mouseup', this, true);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'mousemove'` event for the widget.
   */
  private _evtMousemove(event: MouseEvent): void {
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
   * Handle the `'keydown'` event for the widget.
   */
  private _evtKeydown(event: KeyboardEvent): void {
    switch (event.keyCode) {
    case 38: // Up arrow
      this.selectPrevious(event.shiftKey);
      event.stopPropagation();
      event.preventDefault();
      break;
    case 40: // Down arrow
      this.selectNext(event.shiftKey);
      event.stopPropagation();
      event.preventDefault();
      break;
    }
  }

  /**
   * Handle the `'dblclick'` event for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    clearTimeout(this._selectTimer);
    this._noSelectTimer = setTimeout(() => {
      this._noSelectTimer = -1;
    }, RENAME_DURATION);

    this._editNode.blur();

    // Find a valid double click target.
    let node = event.target as HTMLElement;
    let items = this._model.getSortedItems();
    while (node && node !== this.node) {
      if (node.classList.contains(ITEM_CLASS)) {
        // Open the selected item.
        let index = this._items.indexOf(node);
        let item = items[index];
        if (item.type === 'directory') {
          this._model.cd(item.name).catch(error =>
            utils.showErrorMessage(this, 'Change Directory Error', error)
          );
        } else {
          this.openRequested.emit(item);
          return;
        }

      }
      node = node.parentElement;
    }
  }

  /**
   * Handle the `'p-dragenter'` event for the widget.
   */
  private _evtDragEnter(event: IDragEvent): void {
    if (event.mimeData.hasData(utils.CONTENTS_MIME)) {
      let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
      let target = this._items[index];
      if (utils.findElement(target, FOLDER_ICON_CLASS) &&
          !target.classList.contains(SELECTED_CLASS)) {
        target.classList.add(utils.DROP_TARGET_CLASS);
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
    let dropTarget = utils.findElement(this.node, utils.DROP_TARGET_CLASS);
    if (dropTarget) dropTarget.classList.remove(utils.DROP_TARGET_CLASS);
  }

  /**
   * Handle the `'p-dragover'` event for the widget.
   */
  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;
    let dropTarget = utils.findElement(this.node, utils.DROP_TARGET_CLASS);
    if (dropTarget) dropTarget.classList.remove(utils.DROP_TARGET_CLASS);
    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
    this._items[index].classList.add(utils.DROP_TARGET_CLASS);
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
    if (!event.mimeData.hasData(utils.CONTENTS_MIME)) {
      return;
    }
    event.dropAction = event.proposedAction;

    let target = event.target as HTMLElement;
    while (target && target.parentElement) {
      if (target.classList.contains(utils.DROP_TARGET_CLASS)) {
        target.classList.remove(utils.DROP_TARGET_CLASS);
        break;
      }
      target = target.parentElement;
    }

    // Get the path based on the target node.
    let index = this._items.indexOf(target);
    let items = this._model.getSortedItems();
    var path = items[index].name + '/';

    // Move all of the items.
    let promises: Promise<IContentsModel>[] = [];
    for (let index of this._model.selected) {
      var original = items[index].name;
      var newPath = path + original;
      promises.push(this._model.rename(original, newPath).catch(error => {
        if (error.message.indexOf('409') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.parent.node,
            body: `"${newPath}" already exists, overwrite?`
          }
          return showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.delete(newPath).then(() => {
                return this._model.rename(original, newPath);
              });
            }
          });
        }
      }));
    }
    Promise.all(promises).then(
      () => this._model.refresh(),
      error => utils.showErrorMessage(this, 'Move Error', error)
    );
  }

  /**
   * Start a drag event.
   */
  private _startDrag(index: number, clientX: number, clientY: number): void {
    // If the source node is not selected, use just that node.
    let selected = this._model.selected;
    let source = this._items[index];
    if (!source.classList.contains(SELECTED_CLASS)) {
      selected = [index];
    }

    // Create the drag image.
    var dragImage = source.cloneNode(true) as HTMLElement;
    dragImage.removeChild(dragImage.lastChild);
    if (selected.length > 1) {
      let text = utils.findElement(dragImage, ITEM_TEXT_CLASS);
      text.textContent = '(' + selected.length + ')'
    }

    // Set up the drag event.
    this._drag = new Drag({
      dragImage: dragImage,
      mimeData: new MimeData(),
      supportedActions: DropActions.Move,
      proposedAction: DropAction.Move
    });
    this._drag.mimeData.setData(utils.CONTENTS_MIME, null);
    if (this._widgetFactory && selected.length === 1) {
      let item = this._model.getSortedItems()[selected[0]];
      if (item.type !== 'directory') {
        this._drag.mimeData.setData(FACTORY_MIME, () => {
          return this._widgetFactory(item);
        });
      }
    }

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
  private _handleFileSelect(event: MouseEvent): void {
    // Fetch common variables.
    let items = this._model.getSortedItems();
    let nodes = this._items;
    let index = utils.hitTestNodes(this._items, event.clientX, event.clientY);
    let target = this._items[index];

    clearTimeout(this._selectTimer);

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
      Private.handleMultiSelect(nodes, nodes.indexOf(target));

    // Default to selecting the only the item.
    } else {
      // Handle a rename.
      if (this._model.selected.length === 1 &&
          target.classList.contains(SELECTED_CLASS)) {
        this._selectTimer = setTimeout(() => {
          if (this._noSelectTimer === -1) {
            this._doRename();
          }
        }, RENAME_DURATION);
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
  private _updateSelected(): void {
    // Set the selected items on the model.
    let selected: number[] = [];
    let items = this._model.getSortedItems();
    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].classList.contains(SELECTED_CLASS)) {
        var name = items[i].name;
        let index = arrays.findIndex(items, item => {
          return item.name === name;
        });
        selected.push(index);
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
    let items = this._model.getSortedItems();
    for (let index of this._model.selected) {
      var item = items[index];
      let row = arrays.find(this._items, row => {
        let text = utils.findElement(row, ITEM_TEXT_CLASS);
        return text.textContent === item.name;
      });
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
  private _doRename(): Promise<string> {
    let listing = utils.findElement(this.node, LIST_AREA_CLASS);
    let row = utils.findElement(listing, SELECTED_CLASS);
    let fileCell = utils.findElement(row, ITEM_FILE_CLASS);
    let text = utils.findElement(row, ITEM_TEXT_CLASS);
    let original = text.textContent;

    return Private.doRename(fileCell as HTMLElement, text, this._editNode).then(changed => {
      if (!changed) {
        return original;
      }
      let newPath = text.textContent;
      return this._model.rename(original, newPath).catch(error => {
        if (error.xhr) {
          error.message = `${error.xhr.status}: error.statusText`;
        }
        if (error.message.indexOf('409') !== -1 ||
            error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.parent.node,
            body: `"${newPath}" already exists, overwrite?`
          }
          return showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.delete(newPath).then(() => {
                return this._model.rename(original, newPath).then(() => {
                  this._model.refresh();
                });
              });
            } else {
              text.textContent = original;
            }
          });
        }
      }).catch(error => {
        utils.showErrorMessage(this, 'Rename Error', error);
        return original;
      }).then(() => {
        this._model.refresh();
        return text.textContent;
      });
    });
  }

  /**
   * Select a given item.
   */
  private _selectItem(index: number, top: boolean, keepExisting: boolean) {
    // Add the selected class to selected row(s), and remove from all others.
    if (!keepExisting) {
      for (let node of this._items) {
        node.classList.remove(SELECTED_CLASS);
      }
    }
    this._items[index].classList.add(SELECTED_CLASS);
    this._updateSelected();
    if (index === 0) {
      this.node.scrollTop = 0;
    }
    if (!Private.isScrolledIntoView(this._items[index], this.node)) {
      this._items[index].scrollIntoView(top);
    }
  }

  private _model: FileBrowserModel = null;
  private _editNode: HTMLInputElement = null;
  private _items: HTMLElement[] = [];
  private _drag: Drag = null;
  private _dragData: { pressX: number, pressY: number, index: number } = null;
  private _selectTimer = -1;
  private _noSelectTimer = -1;
  private _prevPath = '';
  private _isCut = false;
  private _clipboard: string[] = [];
  private _widgetFactory: (model: IContentsModel) => Widget = null;
}


/**
 * The namespace for the listing private data.
 */
namespace Private {
  /**
   * A signal emitted when the an open is requested.
   */
  export
  const openRequestedSignal = new Signal<DirListing, IContentsModel>();

  /**
   * Create an uninitialized DOM node for an IContentsModel.
   */
  export
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
  function populateText(item: IContentsModel, node: HTMLElement): void {
    node.textContent = item.name;
  }

  /**
   * Create the last modified node content for an IContentsModel.
   */
  function populateModified(item: IContentsModel, node: HTMLElement): void {
    if (item.last_modified) {
      let text = moment(item.last_modified).fromNow();
      node.textContent = text === 'a few seconds ago' ? 'seconds ago' : text;
      node.title = moment(item.last_modified).format("YYYY-MM-DD HH:mm")
    } else {
      node.textContent = '';
      node.title = '';
    }
  }

  /**
   * Update the node state for an IContentsModel.
   */
  export
  function updateItemNode(item: IContentsModel, node: HTMLElement): void {
    let icon = node.firstChild.firstChild as HTMLElement;
    let text = (node.firstChild as HTMLElement).children[1] as HTMLElement;
    let modified = node.lastChild as HTMLElement;
    icon.className = createIconClass(item);
    populateText(item, text);
    populateModified(item, modified);
    node.classList.remove(SELECTED_CLASS);
    node.classList.remove(CUT_CLASS);
    node.classList.remove(RUNNING_CLASS);
  }

  /**
   * Handle editing text on a node.
   *
   * @returns Boolean indicating whether the name changed.
   */
  export
  function doRename(parent: HTMLElement, text: HTMLElement, edit: HTMLInputElement): Promise<boolean> {
    let changed = true;
    parent.replaceChild(edit, text);
    edit.value = text.textContent;
    edit.focus();
    let index = edit.value.lastIndexOf('.');
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
  export
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

  /**
   * Check whether an element is scrolled into view.
   */
  export
  function isScrolledIntoView(elem: HTMLElement, container: HTMLElement): boolean {
    // http://stackoverflow.com/a/488073
    let rect = container.getBoundingClientRect();
    let containerTop = rect.top;
    let containerBottom = containerTop + rect.height;

    rect = elem.getBoundingClientRect();
    let elemTop = rect.top;
    let elemBottom = elemTop + rect.height;
    return ((elemBottom <= containerBottom) && (elemTop >= containerTop));
  }

  /**
   * Create the header node.
   */
  export
  function createHeader(): HTMLElement {
    let files = document.createElement('div');
    files.className = HEADER_FILE_CLASS;
    files.classList.add(HEADER_ITEM_CLASS);
    files.classList.add(SELECTED_CLASS);
    let fileText = document.createElement('span');
    fileText.className = HEADER_TEXT_CLASS;
    fileText.textContent = 'Name';
    let fileIcon = document.createElement('span');
    fileIcon.className = `fa ${HEADER_ICON_CLASS}`;
    files.appendChild(fileText);
    files.appendChild(fileIcon);

    let modified = document.createElement('div');
    modified.className = HEADER_TIME_CLASS;
    modified.classList.add(HEADER_ITEM_CLASS);
    let modText = document.createElement('span');
    modText.className = HEADER_TEXT_CLASS;
    modText.textContent = 'Last Modified';
    let modIcon = document.createElement('span');
    modIcon.className = `fa ${HEADER_ICON_CLASS}`;
    modified.appendChild(modText);
    modified.appendChild(modIcon);

    let header = document.createElement('div');
    header.className = LIST_HEADER_CLASS;
    header.appendChild(files);
    header.appendChild(modified);
    return header;
  }
}
