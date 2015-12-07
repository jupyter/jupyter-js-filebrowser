// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import {
  IContents, INotebookSession, ISessionId, ISessionOptions
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
 * The contents item type.
 */
export
enum ContentsItemType {
  Directory,
  File,
  Notebook,
  Unknown
}


/**
 * A contents item.
 */
export
interface IContentsItem {
  name: string;
  path: string;
  type: ContentsItemType;
  created: string;
  lastModified: string;
}


/**
 * A view model associated with a Jupyter FileBrowser.
 */
export
interface IFileBrowserViewModel {
  /**
   * Get a list of running session models.
   */
  listRunningSessions: () => Promise<ISessionId[]>;

  /**
   * Connect to a session by session id and known options.
   */
  connectToSession: (id: string, options: ISessionOptions) => Promise<INotebookSession>;

  /**
   * Contents provider.
   */
  contents: IContents;

  /**
   * The current directory path.
   */
  currentDirectory: string;

  /**
   * The selected items in the current directory.
   */
  selectedItems: IContentsItem[];
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
    let child = document.createElement('div');
    child.classList.add(LIST_AREA_CLASS);
    node.appendChild(child);
    return node;
  }

  /**
   * Construct a new file browser widget.
   *
   * @param model - File browser view model instance.
   */
  constructor(model: IFileBrowserViewModel) {
    super();
    this._model = model;
    this._items = [];
    this.addClass(FILE_BROWSER_CLASS);
  }

  /**
   * Get the current directory of the file browser.
   */
  get directory(): string {
    return this._model.currentDirectory;
  }

  /**
   * Set the current directory of the file browser.
   *
   * @param path - The path of the new directory.
   */
  set directory(path: string) {
    this._model.currentDirectory = path;
  }

  /**
   * Get the selected items for the file browser.
   *
   * #### Notes
   * This is a read-only property.
   */
  get selectedItems(): IContentsItem[] {
    return this._model.selectedItems;
  }

  /**
   * Open the currently selected item(s).
   *
   * #### Notes
   * Files are opened by emitting the [[openFile]] signal.
   *
   * If the selection includes one or more directories, the contents
   * will update to list that directory.
   *
   * All selected files will trigger an [[itemOpened]] signal.
   */
  open(): void {
    let items = this._items.filter(item => {
      return item.selected;
    });
    if (!items.length) {
      return;
    }
    let dirs = items.filter(item => {
      return item.type === ContentsItemType.Directory;
    });

    if (dirs.length) {
      this._model.currentDirectory = dirs[0].path;
      this._listContents();
    }
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
    this._listContents();
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
    this._model.selectedItems = this._items.filter(item => {
      return item.selected;
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
    this.open();
  }

  /**
   * List the contents of the current directory.
   */
  private _listContents() {
    let currentDir = this._model.currentDirectory;
    let contents = this._model.contents;

    for (let item of this._items) {
      item.dispose();
    }
    this._items = [];

    // Add a parent link if not at the root.
    if (currentDir) {
      let path = '';
      let last = currentDir.lastIndexOf('/');
      if (last !== -1) {
        path = currentDir.slice(0, last);
      }
      let item = new FileBrowserItem({
        name: '..',
        path: path,
        type: 'directory'
      });
      this._items.push(item);
      this.node.firstChild.appendChild(item.node);
    }

    contents.listContents(currentDir).then((msg: any) => {
      for (let i = 0; i < msg.content.length; i++) {
        let item = new FileBrowserItem(msg.content[i] as IContentsJSON)
        this._items.push(item);
        this.node.firstChild.appendChild(item.node);
      }
    });
  }

  private _model: IFileBrowserViewModel = null;
  private _items: FileBrowserItem[] = null;
}


/**
 * Interface of a contents item returned by a call to
 * GET /api/contents/[:path] for a directory.
 */
interface IContentsJSON {
  name: string;
  path: string;
  type: string;
  created?: string;
  last_modified?: string;
}


/**
 * An implementation of a file browser item.
 */
class FileBrowserItem extends NodeWrapper implements IContentsItem {

  /**
   * Create a node for a file browser item.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let inode = document.createElement('i');
    inode.className = ROW_ICON_CLASS;
    let tnode = document.createElement('div');
    tnode.className = ROW_TEXT_CLASS;
    let mnode = document.createElement('div');
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
  constructor(options: IContentsJSON) {
    super();
    this.addClass(ROW_CLASS);
    switch(options.type) {
    case 'directory':
      this._type = ContentsItemType.Directory;
      break;
    case 'file':
      this._type = ContentsItemType.File;
      break;
    case 'notebook':
      this._type = ContentsItemType.Notebook
      break;
    default:
      this._type = ContentsItemType.Unknown;
    }
    // Add the appropriate icon based on whether it is a directory.
    let inode = this.node.children[0];
    if (this._type === ContentsItemType.Directory) {
      inode.classList.add(FOLDER_ICON_CLASS);
    } else {
      inode.classList.add(FILE_ICON_CLASS);
    }
    this.node.children[1].textContent = options.name;
    this._name = options.name;
    this._path = options.path;
    this._created = options.created || '';
    this._lastModified = options.last_modified || '';

    if (this._lastModified) {
      let modText = moment(this._lastModified).fromNow();
      this.node.children[2].textContent = modText;
    }
  }

  /**
   * Get the name of the item.
   *
   * #### Notes
   * This is a read-only property.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the full path to the item.
   *
   * #### Notes
   * This is a read-only property.
   */
  get path(): string {
    return this._path;
  }

  /**
   * Get the type of the item.
   *
   * #### Notes
   * This is a read-only property.
   */
  get type(): ContentsItemType {
    return this._type;
  }

  /**
   * Get the creation time of the item.
   *
   * #### Notes
   * This is a read-only property.
   */
  get created(): string {
    return this._created;
  }

  /**
   * Get the last modified time of the item.
   *
   * #### Notes
   * This is a read-only property.
   */
  get lastModified(): string {
    return this._lastModified;
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

  private _type: ContentsItemType;
  private _name: string;
  private _path: string;
  private _created: string;
  private _lastModified: string;
}
