// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import {
  Contents, IContents
} from 'jupyter-js-services';

import {
  Widget
} from 'phosphor-widget';

import './index.css';


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
    node.innerHTML = (
      '<div class="jp-FileBrowser-files-inner">' +
        '<div class="jp-FileBrowser-files-header">Files</div>' +
        '<div class="jp-FileBrowser-list-container"></div>' +
      '</div>'
    );
    return node;
  }

  /**
   * Construct a new file browser widget.
   *
   * @param baseUrl - The base url for the Contents API.
   *
   * @param currentDir - The name of the current directory.
   *
   * @param contents - An existing Contents API object.
   */
  constructor(baseUrl: string, currentDir: string, contents?: IContents) {
    super();
    this.addClass('jp-FileBrowser');
    this._contents = contents || new Contents(baseUrl);
    document.addEventListener('mousedown', this);
    this._currentDir = currentDir;
  }

  /**
   * Get the current directory of the file browser.
   */
  get directory(): string {
    return this._currentDir;
  }

  /**
   * Set the current directory of the file browser.
   *
   * @param path - The path of the new directory.
   *
   * #### Note
   * This does not call [[listDirectory]].
   */
  set directory(path: string) {
    this._currentDir = path;
  }

  /**
   * Get the onClick handler for the file browser.
   *
   * This is called in response to a user clicking on a file target.
   * The contents of the file are retrieved, and the name and contents
   * of the file are passed to the handler.
   */
  get onClick(): (name: string, contents: any) => void {
    return this._onClick;
  }

  /**
   * Set the onClick handler for the file browser.
   *
   * @param cb - The callback for an onclick event.
   *
   * This is called in response to a user clicking on a file target.
   * The contents of the file are retrieved, and the name and contents
   * of the file are passed to the handler.
   */
  set onClick(cb: (name: string, contents: any) => void) {
    this._onClick = cb;
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
    if (event.type === 'mousedown') {
      this._evtMouseDown(event as MouseEvent);
    }
  }

  /**
   * Set the file browser contents based on the current directory.
   */
  listDirectory(): void {
    this.node.firstChild.lastChild.textContent = '';
    // Add a parent link if not at the root.
    if (this._currentDir.lastIndexOf('/') !== -1) {
      this._addItem('..', true);
    }

    let path = this._currentDir.slice(0, this._currentDir.length - 1);
    this._contents.listContents(path).then((msg: any) => {
      for (let i = 0; i < msg.content.length; i++) {
        if ((msg as any).content[i].type === 'directory') {
          this._addItem((msg as any).content[i].name + '/', true);
        } else {
          this._addItem((msg as any).content[i].name, false);
        }
      }
    });
  }

  /**
   * Handle the `'mousedown'` event for the file browser.
   */
  private _evtMouseDown(event: MouseEvent): void {
    let el =  event.target as HTMLElement;
    if (el.className.indexOf('jp-item-link') === -1) {
      return;
    }
    let text = el.textContent;
    // Handle a directory target.
    if (text[text.length - 1] === '/') {
      this._currentDir += text;
      this.listDirectory();
    // Handle a parent directory target.
    } else if (text === '..') {
      let parts = this._currentDir.split('/');
      parts = parts.slice(0, parts.length-2);
      if (parts.length === 0) {
        this._currentDir = '';
      } else {
        this._currentDir = parts.join('/') + '/';
      }
      this.listDirectory();
    // Handle a file target.
    } else {
      let path = this._currentDir + text;
      this._contents.get(path, 'file', { }).then((msg: any) => {
        let onClick = this._onClick;
        if (onClick) { onClick(msg.path, msg.content); }
      });
    }
  }

  /*
   * Add an item to the file browser display.
   *
   * @param text - The text to display for the item.
   * @param isDirectory - Whether the item is a directory.
   */
  private _addItem(text: string, isDirectory: boolean): void {
    let top = document.createElement('div');
    top.className = 'jp-FileBrowser-list-item';
    top.classList.add('jp-FileBrowser-row');
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
    this.node.firstChild.lastChild.appendChild(top);
  }

  private _currentDir = '';
  private _onClick: (name: string, contents: string) => void = null;
  private _contents: IContents = null;
}
