// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import {
  IContents, INotebookSession, ISessionId
} from 'jupyter-js-services';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Message
} from 'phosphor-messaging';

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
 * A view model associated with a Jupyter FileBrowser.
 */
export
interface IFileBrowserViewModel {
  /**
   * Get a list of running session models.
   */
  listRunningSessions: () => Promise<ISessionId[]>;

  /**
   * Connect to a session by session id.
   */
  connectToSession: (id: string) => Promise<INotebookSession>;

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
  selectedItems: string[];
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
  get selectedItems(): string[] {
    return this._model.selectedItems;
  }

  /**
   * Open the currently selected item(s).
   */
  open(): void {
    console.log('open');
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
    let node = this._findTarget(event);
    if (!node) {
      return;
    }
    // Handle toggling.
    if (event.metaKey || event.ctrlKey) {
      if (node.classList.contains(SELECTED_CLASS)) {
        node.classList.remove(SELECTED_CLASS);
      } else {
        node.classList.add(SELECTED_CLASS);
      }
    // Handle multiple select.
    } else if (event.shiftKey) {
      // Find the "nearest selected".
      let nearestIndex = -1;
      let index = -1;
      let rows = this.node.querySelectorAll(`.${ROW_CLASS}`);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i] === node) {
          index = i;
          continue;
        }
        if (rows[i].classList.contains(SELECTED_CLASS)) {
          if (nearestIndex === -1) {
            nearestIndex = i;
          } else {
            if (Math.abs(index - i) < Math.abs(nearestIndex - i)) {
              nearestIndex = i;
            }
          }
        }
      }
      if (nearestIndex === -1) {
        nearestIndex = 0;
      }

      for (var i = 0; i < rows.length; i++) {
        if (nearestIndex >= i && index <= i ||
            nearestIndex <= i && index >= i) {
          rows[i].classList.add(SELECTED_CLASS);
        }
      }

    // Default to selecting the only the item.
    } else {
      let rows = this.node.querySelectorAll(`.${ROW_CLASS}`);
      for (let i = 0; i < rows.length; i++) {
         rows[i].classList.remove(SELECTED_CLASS);
      }
      node.classList.add(SELECTED_CLASS);
    }
  }

  /**
   * Handle the `'dblclick'` event for the file browser.
   */
  private _evtDblClick(event: MouseEvent) {
    let node = this._findTarget(event);
    if (!node) {
      return;
    }
    this.open();
  }

  private _findTarget(event: MouseEvent): HTMLElement {
    let rows = this.node.querySelectorAll(`.${ROW_CLASS}`);
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i] as HTMLElement;
      if (hitTest(row, event.clientX, event.clientY)) {
        return row;
      }
    }
    return void 0;
  }

  /**
   * List the contents of the current directory.
   */
  private _listContents() {
    let currentDir = this._model.currentDirectory;
    let contents = this._model.contents;

    this.node.firstChild.textContent = '';
    // Add a parent link if not at the root.
    if (currentDir.lastIndexOf('/') !== -1) {
      this._addItem('..', true);
    }

    let path = currentDir.slice(0, currentDir.length - 1);
    contents.listContents(path).then((msg: any) => {
      for (let i = 0; i < msg.content.length; i++) {
        if ((msg as any).content[i].type === 'directory') {
          this._addItem((msg as any).content[i].name + '/', true);
        } else {
          this._addItem((msg as any).content[i].name, false);
        }
      }
    });
  }

  /*
   * Add an item to the file browser display.
   *
   * @param text - The text to display for the item.
   * @param isDirectory - Whether the item is a directory.
   */
  private _addItem(text: string, isDirectory: boolean): void {
    let top = document.createElement('div');
    top.classList.add(ROW_CLASS);
    let node = document.createElement('div');
    node.classList.add('col-md-12');
    let inode = document.createElement('i');
    inode.className = 'jp-item-icon';
    inode.style.display = 'inline-block';
    inode.classList.add('jp-icon-fixed-width');
    let lnode = document.createElement('div');
    lnode.className = 'jp-item-link';
    lnode.textContent = text;
    // Add the appropriate icon based on whether it is a directory.
    if (isDirectory) {
      inode.classList.add('jp-folder-icon');
    } else {
      inode.classList.add('jp-file-icon');
    }
    node.appendChild(inode);
    node.appendChild(lnode);
    top.appendChild(node);
    this.node.firstChild.appendChild(top);
  }

  private _model: IFileBrowserViewModel = null;
}
