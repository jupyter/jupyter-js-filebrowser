// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import {
  IContents, INotebookSession, ISessionId, ISessionOptions,
  IContentsModel
} from 'jupyter-js-services';

import * as moment from 'moment';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Message
} from 'phosphor-messaging';

import {
  NodeWrapper
} from 'phosphor-nodewrapper';

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
 * An implementation of a file browser view model.
 */
export
class FileBrowserViewModel {
  /**
   * A signal emitted when an item is opened.
   */
  static openedSignal = new Signal<FileBrowserViewModel, IContentsModel>();

  /**
   * Construct a new file browser view model.
   */
  constructor(path: string, contents: IContents) {
    this._path = path;
    this._contents = contents;
  }

  /**
   * Get the item opened signal.
   */
  get opened(): ISignal<FileBrowserViewModel, IContentsModel> {
    return FileBrowserViewModel.openedSignal.bind(this);
  }

  /**
   * Get the current path.
   */
  get path(): string {
    return this._path;
  }

  /**
   * Set the current path, triggering a refresh.
   */
  set path(value: string) {
    this._path = value;
    this.refresh();
  }

  /**
   * Get the current items.
   *
   * #### Notes
   * This is a read-only property.
   */
  get items(): IContentsModel[] {
    return this._items.slice();
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
    let items = this._items;
    for (let index of this._selectedIndices) {
      let item = items[index];
      if (item.type === 'directory') {
        this.path = item.path;
        continue;
      } else {
        this._contents.get(item.path, { type: item.type }
        ).then((contents: IContentsModel) => {
          this.opened.emit(contents);
        });
      }
    }
  }

  /**
   * Refresh the model contents.
   */
  refresh() {
    this._contents.listContents(this._path).then(model => {
      this._items = [];
      // Add a link to the parent directory if not at the root.
      if (model.path) {
        let path = '';
        let last = model.path.lastIndexOf('/');
        if (last !== -1) {
          path = model.path.slice(0, last);
        }
        let item: IContentsModel = {
          name: '..',
          path: path,
          type: 'directory',
          writable: null,
          created: null,
          last_modified: null,
        };
        this._items.push(item);
      }

      // Add the rest of the items and emit the model.
      for (let item of model.content) {
        this._items.push(item);
      }
      this.opened.emit(model);
    });
  }

  private _selectedIndices: number[] = [];
  private _contents: IContents = null;
  private _items: IContentsModel[] = [];
  private _path = '';
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
    let child = document.createElement('ul');
    child.classList.add(LIST_AREA_CLASS);
    node.appendChild(child);
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
    this._model.opened.connect(this._onOpened.bind(this));
  }

  /**
   * Dispose of the resources held by the file browser.
   */
  dispose(): void {
    this._model = null;
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
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'dblclick':
      this._evtDblClick(event as MouseEvent);
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
    node.addEventListener('dblclick', this);
    this._model.refresh();
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    node.removeEventListener('click', this);
    node.removeEventListener('dblclick', this);
  }

  /**
   * Handle the `'click'` event for the file browser.
   */
  private _evtClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Fetch common variables.
    let items = this._model.items;
    let nodes = this._nodes;

    // Find the target row.
    let index = hitTestNodes(nodes, event.clientX, event.clientY);
    if (index === -1) {
      return;
    }
    let current = nodes[index];

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

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
      for (var i = 0; i < nodes.length; i++) {
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
   * Handle the `'dblclick'` event for the file browser.
   */
  private _evtDblClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Find the target row.
    let index = hitTestNodes(this._nodes, event.clientX, event.clientY);
    if (index === -1) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Open the selected item.
    this._model.open();
  }

  /**
   * A handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch common variables.
    let items = this._model.items;
    let nodes = this._nodes;
    let content = this.node.firstChild;

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
  }

  /**
   * Handle an `opened` signal from the model.
   */
  private _onOpened(model: FileBrowserViewModel, contents: IContentsModel): void {
    if (contents.type === 'directory') {
      this.update();
    }
  }

  private _model: FileBrowserViewModel = null;
  private _nodes: HTMLElement[] = [];
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
 * Get the index of the node at a client position, or `-1`.
 */
function hitTestNodes(nodes: HTMLElement[], x: number, y: number): number {
  for (let i = 0, n = nodes.length; i < n; ++i) {
    if (hitTest(nodes[i], x, y)) return i;
  }
  return -1;
}
