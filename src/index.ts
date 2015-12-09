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
  IChangedArgs, Property
} from 'phosphor-properties';

import {
  ISignal, Signal, clearSignalData
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
  constructor(contents: IContents) {
    this._contents = contents;
  }

  /**
   * Get the item opened signal.
   */
  get opened(): ISignal<FileBrowserViewModel, IContentsModel> {
    return FileBrowserViewModel.openedSignal.bind(this);
  }

  /**
   * Get the current directory.
   */
  get currentDirectory(): string {
    return this._currentDirectory;
  }

  /**
   * Set the current directory.
   */
  set currentDirectory(path: string) {
    this._currentDirectory = path;
    this.refresh();
  }

  /**
   * Get the current selected items.
   */
  get selectedItems(): IContentsModel[] {
    return this._selectedItems;
  }

  /**
   * Set the current selected items.
   */
  set selectedItems(items: IContentsModel[]) {
    this._selectedItems = items;
  }

  /**
   * Get the contents provider.
   *
   * #### Notes
   * This is a read-only property.
   */
  get contents(): IContents {
    return this._contents;
  }

  /**
   * Open the current selected items.
   *
   * #### Notes
   * Emits an [[opened]] signal for each item
   * after loading the contents.
   */
  open(): void {
    for (let item of this.selectedItems) {
      this._contents.get(item.path, { type: item.type }
      ).then((contents: IContentsModel) => {
        this.opened.emit(contents);
      });
    }
  }

  /**
   * Refresh the directory contents.
   */
  refresh(): void {
    this._contents.listContents(this._currentDirectory
    ).then((model: IContentsModel) => {
      this.opened.emit(model);
    });
  }

  private _baseUrl = '';
  private _selectedItems: IContentsModel[] = [];
  private _currentDirectory = '';
  private _contents: IContents = null;
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
    this._model = model;
    this._items = [];
    this.addClass(FILE_BROWSER_CLASS);
    this._model.opened.connect((model: FileBrowserViewModel, contents: IContentsModel) => {
      if (contents.type === 'directory') {
        this._load(contents);
      }
    });
  }

  /**
   * Dispose of the resources held by the file browser.
   */
  dispose(): void {
    this._items = null;
    this._model = null;
    clearSignalData(this);
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

    // Find the target row.
    let items = this._items.filter(item => {
      return item.hitTest(event.clientX, event.clientY);
    });
    if (!items.length) {
      return;
    }
    let current = items[0];

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Handle toggling.
    if (event.metaKey || event.ctrlKey) {
      if (current.selected) {
        current.selected = false;
      } else {
        current.selected = true;
      }

    // Handle multiple select.
    } else if (event.shiftKey) {

      // Find the "nearest selected".
      let nearestIndex = -1;
      let index = -1;
      for (var i = 0; i < this._items.length; i++) {
        if (this._items[i] === current) {
          index = i;
          continue;
        }
        if (this._items[i].selected) {
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
      for (var i = 0; i < this._items.length; i++) {
        if (nearestIndex >= i && index <= i ||
            nearestIndex <= i && index >= i) {
          this._items[i].selected = true;
        }
      }

    // Default to selecting the only the item.
    } else {

      for (let item of this._items) {
        item.selected = false;
      }
      current.selected = true;
    }

    // Set the selected items on the model.
    items = this._items.filter(item => {
      return item.selected;
    });
    this._model.selectedItems = items.map(item => {
      return item.model;
    });
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
    let items = this._items.filter(item => {
      return item.hitTest(event.clientX, event.clientY);
    })
    if (!items.length) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Open the selected item.
    this._model.open();
  }

  /**
   * Load a directory
   */
  private _load(payload: IContentsModel): void {
    for (let item of this._items) {
      item.dispose();
    }
    this._items = [];

    // Add a parent link if not at the root.
    if (payload.path) {
      let path = '';
      let last = payload.path.lastIndexOf('/');
      if (last !== -1) {
        path = payload.path.slice(0, last);
      }
      let item = new FileBrowserItem({
        name: '..',
        path: path,
        type: 'directory',
        writable: null,
        created: null,
        last_modified: null,
      });
      this._items.push(item);
      this.node.firstChild.appendChild(item.node);
    }

    let content = payload.content;
    for (let i = 0; i < content.length; i++) {
      let item = new FileBrowserItem(content[i]);
      this._items.push(item);
      this.node.firstChild.appendChild(item.node);
    }
  }

  private _model: FileBrowserViewModel = null;
  private _items: FileBrowserItem[] = null;
}


/**
 * An implementation of a file browser item.
 */
class FileBrowserItem extends NodeWrapper {

  /**
   * Create a node for a file browser item.
   */
  static createNode(): HTMLElement {
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
   * Construct a new file browser item.
   *
   * @param options - Initialization options for the item.
   */
  constructor(model: IContentsModel) {
    super();
    this.addClass(ROW_CLASS);
    this._model = model;

    // Add the appropriate icon based on whether it is a directory.
    let inode = this.node.children[0];
    if (model.type === 'directory') {
      inode.classList.add(FOLDER_ICON_CLASS);
    } else {
      inode.classList.add(FILE_ICON_CLASS);
    }
    this.node.children[1].textContent = model.name;

    // Add the last modified identifier if applicable.
    if (model.last_modified) {
      let modText = moment(model.last_modified).fromNow();
      this.node.children[2].textContent = modText;
    }
  }

  /**
   * Get the model assoicated with the item.
   */
  get model(): IContentsModel {
    return this._model;
  }

  /**
   * Get whether the item is selected.
   *
   * #### Notes
   * This is a read-only property.
   */
  get selected(): boolean {
    return this.node.classList.contains(SELECTED_CLASS);
  }

  /**
   * Set whether the item is selected.
   */
  set selected(value: boolean) {
    if (value) {
      this.node.classList.add(SELECTED_CLASS);
    } else {
      this.node.classList.remove(SELECTED_CLASS);
    }
  }

  hitTest(clientX: number, clientY: number): boolean {
    return hitTest(this.node, clientX, clientY);
  }

  dispose() {
    this.node.parentNode.removeChild(this.node);
  }

  private _model: IContentsModel = null;
}
