// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContentsModel
} from 'jupyter-js-services';

import {
  Message
} from 'phosphor-messaging';

import {
  PanelLayout
} from 'phosphor-panel';

import {
  IChangedArgs
} from 'phosphor-properties';

import {
  Widget
} from 'phosphor-widget';

import {
  FileButtons
} from './buttons';

import {
  BreadCrumbs
} from './crumbs';

import {
  DirListing
} from './listing';

import {
  FileBrowserModel
} from './model';

import {
  FILE_BROWSER_CLASS, showErrorMessage
} from './utils';


/**
 * The class name added to the filebrowser crumbs node.
 */
const CRUMBS_CLASS = 'jp-FileBrowser-crumbs';

/**
 * The class name added to the filebrowser buttons node.
 */
const BUTTON_CLASS = 'jp-FileBrowser-buttons';

/**
 * The class name added to the filebrowser listing node.
 */
const LISTING_CLASS = 'jp-FileBrowser-listing';

/**
 * The duration of auto-refresh in ms.
 */
const REFRESH_DURATION = 30000;


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
   * Construct a new file browser.
   *
   * @param model - The file browser view model.
   */
  constructor(model: FileBrowserModel) {
    super();
    this.addClass(FILE_BROWSER_CLASS);
    this._model = model;
    this._model.changed.connect(this._onChanged, this);
    this._crumbs = new BreadCrumbs(model);
    this._buttons = new FileButtons(model);
    this._listing = new DirListing(model);

    this._crumbs.addClass(CRUMBS_CLASS);
    this._buttons.addClass(BUTTON_CLASS);
    this._listing.addClass(LISTING_CLASS);

    let layout = new PanelLayout();
    layout.addChild(this._crumbs);
    layout.addChild(this._buttons);
    layout.addChild(this._listing);

    this.layout = layout;
  }

  /**
   * Dispose of the resources held by the file browser.
   */
  dispose() {
    this._model = null;
    this._crumbs = null;
    this._buttons = null;
    this._listing = null;
    super.dispose();
  }

  /**
   * Open the currently selected item(s).
   */
  open(): void {
    this._listing.open();
  }

  /**
   * Rename the first currently selected item.
   */
  rename(): void {
    this._listing.rename();
  }

  /**
   * Cut the selected items.
   */
  cut(): void {
    this._listing.cut();
  }

  /**
   * Copy the selected items.
   */
  copy(): void {
    this._listing.copy();
  }

  /**
   * Paste the items from the clipboard.
   */
  paste(): void {
    this._listing.paste();
  }

  /**
   * Delete the currently selected item(s).
   */
  delete(): void {
    this._listing.delete();
  }

  /**
   * Duplicate the currently selected item(s).
   */
  duplicate(): void {
    this._listing.duplicate();
  }

  /**
   * Download the currently selected item(s).
   */
  download(): void {
    this._listing.download();
  }

  /**
   * Shut down kernels on the applicable currently selected items.
   */
  shutdownKernels() {
    this._listing.shutdownKernels();
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this._refresh();
  }

  /**
   * A handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this._pendingRefresh = false;
  }

  /**
   * Force a refresh of the current directory, and trigger auto-refresh.
   */
  private _refresh(): void {
    this._model.open('.').catch(error => {
      showErrorMessage(this, 'Refresh Error', error);
    });
    if (this._pendingRefresh) {
      // Interrupt the current refresh cycle.
      this._pendingRefresh = false;
    } else {
      this._pendingRefresh = true;
      setTimeout(() => {
        if (this._pendingRefresh) {
          this._pendingRefresh = false;
          this._refresh();
        } else {
          // If we got interrupted, set a new timer.
          this._pendingRefresh = true;
          setTimeout(() => {
            if (this._pendingRefresh) {
              this._pendingRefresh = false;
              this._refresh();
            }
          }, REFRESH_DURATION);
        }
      }, REFRESH_DURATION);
    }
  }

  /**
   * Handle a `changed` signal from the model.
   */
  private _onChanged(model: FileBrowserModel, change: IChangedArgs<IContentsModel>): void {
    if (change.name === 'open' && change.newValue.type === 'directory') {
      this.update();
    }
  }

  private _model: FileBrowserModel = null;
  private _crumbs: BreadCrumbs = null;
  private _buttons: FileButtons = null;
  private _listing: DirListing = null;
  private _pendingRefresh = false;
}
