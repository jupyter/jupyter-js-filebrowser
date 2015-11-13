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
 */
export
class FileBrowser extends Widget {

  /**
   * Create a new node for the file list.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    node.innerHTML = (
      '<div class="files_inner">' +
        '<div class="files_header">Files</div>' +
        '<div class="list_container"></div>' +
      '</div>'
    );
    return node;
  }

  /**
   * Construct a new file browser widget.
   */
  constructor(baseUrl: string, currentDir: string, contents?: IContents) {
    super();
    this.addClass('FileBrowser');
    this._contents = contents || new Contents(baseUrl);
    document.addEventListener('mousedown', this, true);
    this._currentDir = currentDir;
  }

  /**
   * Get the onClick handler for the file browser.
   */
  get onClick(): (name: string, contents: any) => void {
    return this._onClick;
  }

  /**
   * Set the onClick handler for the file browser.
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
    if (!this.node.contains((event as any).target)) {
      return;
    }
    if (event.type === 'mousedown') {
      var el = event.target as HTMLElement;
      var text = el.textContent;
      if (text[text.length - 1] === "/") {
        this._currentDir += text;
        this.listDir();
      } else if (text === '..') {
        var parts = this._currentDir.split('/');
        var parts = parts.slice(0, parts.length-2);
        if (parts.length === 0) {
          this._currentDir = '';
        } else {
          this._currentDir = parts.join('/') + '/';
        }
        this.listDir();
      } else {
        var path = this._currentDir + (event.target as HTMLElement).textContent;
        this._contents.get(path, "file", {}).then((msg: any) => {
          var onClick = this._onClick;
          if (onClick) { onClick(msg.path, msg.content); }
        });
      }
    }
  }

  /**
   * Set the file browser contents to the items in the
   * current directory.
   */
  listDir(): void {
    this.node.firstChild.lastChild.textContent = '';
    if (this._currentDir.lastIndexOf('/') !== -1) {
      this._addItem('..', true);
    }

    var path = this._currentDir.slice(0, this._currentDir.length - 1);
    this._contents.listContents(path).then((msg: any) => {
      for (var i = 0; i < msg.content.length; i++) {
        if ((<any>msg).content[i].length) {
          this._addItem((<any>msg).content[i].name + '/', true);
        } else {
          this._addItem((<any>msg).content[i].name, false);
        }
      }
    });
  }

  private _addItem(text: string, isDirectory: boolean): void {
    var top = document.createElement('div');
    top.className = 'list_item';
    top.classList.add('row');
    var node = document.createElement('div');
    node.classList.add('col-md-12');
    var inode = document.createElement('i');
    inode.className = 'item_icon';
    inode.style.display = 'inline-block';
    inode.classList.add('icon-fixed-width');
    var lnode = document.createElement('div');
    lnode.className = 'item_link';
    lnode.classList.add('fileItem');
    lnode.textContent = text;
    if (isDirectory) {
      inode.classList.add('folder_icon');
    } else {
      inode.classList.add('file_icon');
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
