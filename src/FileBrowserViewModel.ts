// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContents, IContentsModel, IContentsOpts
} from 'jupyter-js-services';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  IChangedArgs
} from 'phosphor-properties';

import {
  ISignal, Signal
} from 'phosphor-signaling';


/**
 * An implementation of a file browser view model.
 *
 * #### Notes
 * All paths parameters without a leading `'/'` are interpreted as relative to
 * the current directory.  Supports `'../'` syntax.
 */
export
class FileBrowserViewModel implements IDisposable{
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
   *
   * #### Notes
   * This is a ready-only property.
   */
  get path(): string {
    return this._model.path;
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
   * Get whether the view model is disposed.
   */
  get isDisposed(): boolean {
    return this._model === null;
  }

  /**
   * Dispose of the resources held by the view model.
   */
  dispose(): void {
    this._model = null;
    this._contents = null;
    this._selectedIndices = null;
  }

  /**
   * Open a file or directory.
   *
   * @param path - The path to the file or directory.
   *
   * @returns A promise with the contents of the file.
   *
   * #### Notes
   * Emits a [[changed]] signal the after loading the contents.
   */
  open(path: string): Promise<IContentsModel> {
    path = normalizePath(this._model.path, path);
    return this._contents.get(path, {}).then(contents => {
      if (contents.type === 'directory') {
        this._model = contents;
      }
      this.changed.emit({
        name: 'open',
        oldValue: null,
        newValue: contents
      });
      return contents;
    });
  }

  /**
   * Delete a file.
   *
   * @param: path - The path to the file to be deleted.
   *
   * @returns A promise that resolves when the file is deleted.
   */
  delete(path: string): Promise<void> {
    path = normalizePath(this._model.path, path);
    return this._contents.delete(path).then(() => {
      this.open('.');
      return void 0;
    });
  }

  /**
   * Create a new untitled file or directory in the current directory.
   *
   * @param type - The type of file object to create. One of
   *  `['file', 'notebook', 'directory']`.
   *
   * @param ext - Optional extension for `'file'` types (defaults to `'.txt'`).
   *
   * @returns A promise containing the new file contents model.
   */
  newUntitled(type: string, ext?: string): Promise<IContentsModel> {
    if (type === 'file') {
      ext = ext || '.txt';
    } else {
      ext = '';
    }
    return this._contents.newUntitled(this._model.path, { type: type, ext: ext }
    ).then(contents => {
      this.open('.');
      return contents
    });
  }

  /**
   * Rename a file or directory.
   *
   * @param path - The path to the original file.
   *
   * @param newPath - The path to the new file.
   *
   * @returns A promise containing the new file contents model.
   */
  rename(path: string, newPath: string): Promise<IContentsModel> {
    // Handle relative paths.
    path = normalizePath(this._model.path, path);
    newPath = normalizePath(this._model.path, newPath);

    return this._contents.rename(path, newPath).then(contents => {
      let current = this._model;
      this.open('.');
      this.changed.emit({
        name: 'rename',
        oldValue: current,
        newValue: contents
      });
      return contents;
    });
  }

  /**
   * Upload a `File` object.
   *
   * @param file - The `File` object to upload.
   *
   * @param overwrite - Whether to overwrite an existing file.
   *
   * @returns A promise containing the new file contents model.
   *
   * #### Notes
   * This will fail to upload files that are too big to be sent in one
   * request to the server.
   */
  upload(file: File, overwrite?: boolean): Promise<IContentsModel> {

    // Skip large files with a warning.
    if (file.size > this._max_upload_size_mb * 1024 * 1024) {
      let msg = `Cannot upload file (>${this._max_upload_size_mb} MB) `;
      msg += `"${file.name}"`
      console.warn(msg);
      return Promise.reject(new Error(msg));
    }

    if (overwrite) {
      return this._upload(file);
    }

    return this._contents.get(file.name, {}).then(() => {
      throw new Error(`"${file.name}" already exists`);
      return null;
    }, () => {
      return this._upload(file);
    });
  }

  /**
   * Perform the actual upload.
   */
  private _upload(file: File): Promise<IContentsModel> {
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
        let model: IContentsOpts = {
          type: type,
          format: format,
          name: name,
          content: getContent(reader)
        }
        return this._contents.save(path, model).then(model => {
          this.open('.');
          return model;
        });
      }

      reader.onerror = (event: Event) => {
        throw Error(`Failed to upload "${file.name}":` + event);
      }
    });

  }

  private _max_upload_size_mb = 15;
  private _selectedIndices: number[] = [];
  private _contents: IContents = null;
  private _model: IContentsModel = null;
}


/**
 * Parse the content of a `FileReader`.
 *
 * If the result is an `ArrayBuffer`, return a Base64-encoded string.
 * Otherwise, return the JSON parsed result.
 */
function getContent(reader: FileReader): any {
  if (reader.result instanceof ArrayBuffer) {
    // Base64-encode binary file data.
    let bytes = '';
    let buf = new Uint8Array(reader.result);
    let nbytes = buf.byteLength;
    for (let i = 0; i < nbytes; i++) {
      bytes += String.fromCharCode(buf[i]);
    }
    return btoa(bytes);
  } else {
    return JSON.parse(reader.result);
  }
}


/**
 * Normalize a path based on a root directory, accounting for relative paths.
 */
function normalizePath(root: string, path: string): string {
  // Current directory
  if (path === '.') {
    return root;
  }
  // Root path.
  if (path.indexOf('/') === 0) {
    path = path.slice(1, path.length);
    root = ''
  // Current directory.
  } else if (path.indexOf('./') === 0) {
    path = path.slice(2, path.length);
  // Grandparent directory.
  } else if (path.indexOf('../../') === 0) {
    let parts = root.split('/');
    root = parts.splice(0, parts.length - 2).join('/');
    path = path.slice(6, path.length);
  // Parent directory.
  } else if (path.indexOf('../') === 0) {
    let parts = root.split('/');
    root = parts.splice(0, parts.length - 1).join('/');
    path = path.slice(3, path.length);
  } else {
    // Current directory.
  }
  if (path[path.length - 1] === '/') {
    path = path.slice(0, path.length - 1);
  }
  // Combine the root and the path if necessary.
  if (root && path) {
    path = root + '/' + path;
  } else if (root) {
    path = root;
  }
  return path;
}
