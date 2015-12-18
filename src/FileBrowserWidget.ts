// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContentsModel
} from 'jupyter-js-services';

import * as moment from 'moment';

import {
  DelegateCommand, ICommand
} from 'phosphor-command';

import {
  okButton, showDialog
} from 'phosphor-dialog';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Drag, DropAction, DropActions, IDragEvent, MimeData
} from 'phosphor-dragdrop';

import {
  Menu, MenuBar, MenuItem
} from 'phosphor-menus';

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
} from './FileBrowserViewModel';

import './index.css';


/**
 * The class name added to FileBrowser instances.
 */
const FILE_BROWSER_CLASS = 'jp-FileBrowser';

/**
 * The class name added to the button node.
 */
const BUTTON_CLASS = 'jp-FileBrowser-button';

/**
 * The class name added to the button nodes.
 */
const BUTTON_ITEM_CLASS = 'jp-FileBrowser-button-item';

/**
 * The class name added to the button icon nodes.
 */
const BUTTON_ICON_CLASS = 'jp-FileBrowser-button-icon';

/**
 * The class name added to the upload button node.
 */
const UPLOAD_CLASS = 'jp-FileBrowser-upload';

/**
 * The class name added to the header node.
 */
const HEADER_CLASS = 'jp-FileBrowser-header';

/**
 * The class name added to the header file node.
 */
const HEADER_FILE_CLASS = 'jp-FileBrowser-header-file';

/**
 * The class name added to the header modified node.
 */
const HEADER_MOD_CLASS = 'jp-FileBrowser-header-modified';

/**
 * The class name added to the breadcrumb node.
 */
const BREADCRUMB_CLASS = 'jp-FileBrowser-breadcrumbs';

/**
 * The class name added to the breadcrumb node.
 */
const BREADCRUMB_ITEM_CLASS = 'jp-FileBrowser-breadcrumb-item';

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
 * The class name added to drop targets.
 */
const DROP_TARGET_CLASS = 'jp-mod-drop-target';

/**
 * The class name added to a row icon.
 */
const ROW_ICON_CLASS = 'jp-FileBrowser-item-icon';

/**
 * The class name added to a row text.
 */
const ROW_TEXT_CLASS = 'jp-FileBrowser-item-text';

/**
 * The class name added to a row filename editor.
 */
const ROW_EDIT_CLASS = 'jp-FileBrowser-item-edit';

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
 * The minimum duration for a rename select in ms.
 */
const RENAME_DURATION = 500;


/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;


/**
 * The mime type for a contents drag object.
 */
const CONTENTS_MIME = 'application/x-jupyter-icontents';

/**
 * Bread crumb paths.
 */
const BREAD_CRUMB_PATHS = ['/', '../../', '../', ''];


/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retreive contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
export
class FileBrowserWidget extends Widget {

  /**
   * Create a new node for the file list.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');

    // Create the breadcrumb node.
    let breadcrumbs = document.createElement('div');
    breadcrumbs.classList.add(BREADCRUMB_CLASS);

    // Create the button node.
    let buttonBar = document.createElement('div');
    buttonBar.className = BUTTON_CLASS;

    // Create the header.
    let header = document.createElement('div');
    header.classList.add(HEADER_CLASS);
    let fileName = document.createElement('span');
    fileName.textContent = 'File Name';
    fileName.className = HEADER_FILE_CLASS;
    let modified = document.createElement('span');
    modified.textContent = 'Last Modified';
    modified.className = HEADER_MOD_CLASS;
    header.appendChild(fileName);
    header.appendChild(modified);

    // Create the file list.
    let list = document.createElement('ul');
    list.classList.add(LIST_AREA_CLASS);

    // Add the children.
    node.appendChild(breadcrumbs);
    node.appendChild(buttonBar);
    node.appendChild(header);
    node.appendChild(list);
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
    this._model.changed.connect(this._onChanged.bind(this));

    // Create the crumb nodes add add to crumb node.
    this._crumbs = createCrumbs();
    this._crumbSeps = createCrumbSeparators();
    let crumbs = this.node.getElementsByClassName(BREADCRUMB_CLASS)[0];
    crumbs.appendChild(this._crumbs[Crumb.Home]);

    // Create the button nodes and add to button node.
    let buttons = this.node.getElementsByClassName(BUTTON_CLASS)[0];
    this._buttons = createButtons(buttons as HTMLElement);

    // Set up events on the buttons.
    let input = this._buttons[Button.Upload].getElementsByTagName('input')[0];
    input.onchange = this._handleUploadEvent.bind(this);

    this._buttons[Button.Refresh].onclick = () => {
      this._model.open('.').catch(error => {
          this._showErrorMessage('Open Error', error);
        });
    };

    this._buttons[Button.New].onclick = () => {
      let rect = this._buttons[Button.New].getBoundingClientRect();
      this._newMenu.popup(rect.left, rect.bottom, false, true);
    }

    // Create the "new" menu.
    let command = new DelegateCommand(args => {
      this._model.newUntitled(args as string).catch(error => {
        this._showErrorMessage('New File Error', error);
       });
    });
    this._newMenu = createNewItemMenu(command);

    // Create the edit node.
    this._editNode = document.createElement('input');
    this._editNode.className = ROW_EDIT_CLASS;
  }

  /**
   * Dispose of the resources held by the file browser.
   */
  dispose(): void {
    this._model = null;
    this._items = null;
    this._crumbs = null;
    this._crumbSeps = null;
    this._buttons = null;
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
    case 'mousedown':
      this._evtMousedown(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseup(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMousemove(event as MouseEvent);
      break;
    case 'click':
      this._evtClick(event as MouseEvent);
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
    node.addEventListener('click', this);
    node.addEventListener('dblclick', this);
    node.addEventListener('p-dragenter', this);
    node.addEventListener('p-dragleave', this);
    node.addEventListener('p-dragover', this);
    node.addEventListener('p-drop', this);
    this._model.open('/').catch(error => {
      this._showErrorMessage('Open Error', error);
    });
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    node.removeEventListener('mousedown', this);
    node.removeEventListener('mouseup', this);
    node.removeEventListener('click', this);
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
    let content = this.node.lastChild;

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

    this._updateSelected();

    // Update the breadcrumb list.
    updateCrumbs(this._crumbs, this._crumbSeps, this._model.path);
  }

  /**
   * Handle the `'mousedown'` event for the file browser.
   */
  private _evtMousedown(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Handle an item selection.
    let index = hitTestNodes(this._items, event.clientX, event.clientY);
    if (index !== -1) {
      this._dragData = { pressX: event.clientX, pressY: event.clientY,
                         index: index };
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

  }

  /**
   * Handle the `'mouseup'` event for the file browser.
   */
  private _evtMouseup(event: MouseEvent) {
    if (event.button !== 0 || !this._drag) {
      document.removeEventListener('mousemove', this, true);
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    for (let node of this._buttons) {
      node.classList.remove(SELECTED_CLASS);
    }
  }

  /**
   * Handle the `'mousemove'` event for the file browser.
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
   * Handle the `'click'` event for the file browser.
   */
  private _evtClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Handle the edit node.
    if (this._editNode.parentNode) {
      if (this._editNode !== event.target as HTMLElement) {
        this._editNode.focus();
        this._editNode.blur();
      } else {
        return;
      }
    }

    // Find a valid click target.
    let node = event.target as HTMLElement;
    while (node && node !== this.node) {
      if (node.classList.contains(BREADCRUMB_ITEM_CLASS)) {
        this._pendingSelect = false;
        let index = this._crumbs.indexOf(node);
        this._model.open(BREAD_CRUMB_PATHS[index]).catch(error => {
          this._showErrorMessage('Open Error', error);
        });

        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (node.classList.contains(ROW_CLASS)) {
        this._handleFileClick(event, node);

        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      node = node.parentElement;
    }
    this._pendingSelect = false;
  }

  /**
   * Handle the `'dblclick'` event for the file browser.
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
      if (node.classList.contains(ROW_CLASS)) {
        // Open the selected item.
        let index = this._items.indexOf(node);
        let path = this._model.items[index].name;
        this._model.open(path).catch(error => {
          this._showErrorMessage('Open Error', error);
        });
        return;
      }
      node = node.parentElement;
    }
  }

  /**
   * Handle the `'p-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: IDragEvent): void {
    if (event.mimeData.hasData(CONTENTS_MIME)) {
      let target = this._findTarget(event as MouseEvent);
      if (target === null) return;

      let index = this._crumbs.indexOf(target);
      if (index !== -1) {
        if (index !== Crumb.Current) {
          target.classList.add(DROP_TARGET_CLASS);
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      index = this._items.indexOf(target);
      if (index !== -1) {
        if (target.getElementsByClassName(FOLDER_ICON_CLASS).length &&
            !target.classList.contains(SELECTED_CLASS)) {
          target.classList.add(DROP_TARGET_CLASS);
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }
  }

  /**
   * Handle the `'p-dragleave'` event for the dock panel.
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
   * Handle the `'p-dragover'` event for the dock panel.
   */
  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;
    let dropTargets = this.node.getElementsByClassName(DROP_TARGET_CLASS);
    if (dropTargets.length) {
      dropTargets[0].classList.remove(DROP_TARGET_CLASS);
    }
    let target = this._findTarget(event as MouseEvent);
    if (target !== null) target.classList.add(DROP_TARGET_CLASS);
  }

  /**
   * Handle the `'p-drop'` event for the dock panel.
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
    let index = this._crumbs.indexOf(target)
    if (index !== -1) {
      var path = BREAD_CRUMB_PATHS[index];
    } else {
      index = this._items.indexOf(target);
      var path = this._model.items[index].name + '/';
    }

    // Move all of the items.
    for (let index of this._model.selected) {
      var original = this._model.items[index].name;
      var newPath = path + original;
      this._model.rename(original, newPath).catch(error => {
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
        this._showErrorMessage('Move Error', error.message);
      });
    }
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
      let text = dragImage.getElementsByClassName(ROW_TEXT_CLASS)[0];
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
   * Find the appropriate target for a mouse event.
   */
 private _findTarget(event: MouseEvent): HTMLElement {
    let index = hitTestNodes(this._items, event.clientX, event.clientY);
    if (index !== -1) return this._items[index];

    index = hitTestNodes(this._crumbs, event.clientX, event.clientY);
    if (index !== -1) return this._crumbs[index];

    return null;
  }

  /**
   * Handle a click on a file node.
   */
  private _handleFileClick(event: MouseEvent, target: HTMLElement) {
    // Fetch common variables.
    let items = this._model.items;
    let nodes = this._items;

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
              this._doRename(target);
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

    this._updateSelected();
  }

  /**
   * Update the selected indices of the model.
   */
  private _updateSelected() {
    // Set the selected items on the model.
    let selected: number[] = [];
    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].classList.contains(SELECTED_CLASS)) {
        selected.push(i);
      }
    }
    this._model.selected = selected;
  }

  /**
   * Handle a file upload event.
   */
  private _handleUploadEvent(event: Event) {
    for (var file of (event.target as any).files) {
      this._model.upload(file).catch(error => {
        if (error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.node,
            body: `"${file.name}" already exists, overwrite?`
          }
          showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.upload(file, true);
            }
          });
        }
      }).catch(error => {
        this._showErrorMessage('Upload Error', error.message);
      });
    }
  }

  /**
   * Allow the user to rename item on a given row.
   */
  private _doRename(row: HTMLElement): void {
    let text = row.getElementsByClassName(ROW_TEXT_CLASS)[0] as HTMLElement;
    let original = text.textContent;

    doRename(row, text, this._editNode).then(changed => {
      if (!changed) {
        return;
      }
      let newPath = text.textContent;
      this._model.rename(original, newPath).catch(error => {
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
            } else {
              text.textContent = original;
            }
          });
        }
      }).catch(error => {
        this._showErrorMessage('Rename Error', error.message);
      });
    });
  }

  private _showErrorMessage(title: string, message: string) {
    let options = {
      title: title,
      host: this.node,
      body: message,
      buttons: [okButton]
    }
    showDialog(options);
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
  private _items: HTMLElement[] = [];
  private _crumbs: HTMLElement[] = [];
  private _crumbSeps: HTMLElement[] = [];
  private _buttons: HTMLElement[] = [];
  private _newMenu: Menu = null;
  private _pendingSelect = false;
  private _editNode: HTMLInputElement = null;
  private _drag: Drag = null;
  private _dragData: { pressX: number, pressY: number, index: number } = null;
}


/**
 * Breadcrumb item list enum.
 */
enum Crumb {
  Home,
  Ellipsis,
  Parent,
  Current
}


/**
 * Button item list enum.
 */
enum Button {
  New,
  Upload,
  Refresh
}


/**
 * Create an uninitialized DOM node for an IContentsModel.
 */
function createItemNode(): HTMLElement {
  let node = document.createElement('li');
  node.className = ROW_CLASS;
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
  icon.className = createIconClass(item);
  if (text.textContent !== item.name) {
    node.classList.remove(SELECTED_CLASS);
  }
  text.textContent = createTextContent(item);
  modified.textContent = createModifiedContent(item);
}


/**
 * Populate the breadcrumb node.
 */
function updateCrumbs(breadcrumbs: HTMLElement[], separators: HTMLElement[], path: string) {
  let node = breadcrumbs[0].parentNode;

  // Remove all but the home node.
  while (node.firstChild.nextSibling) {
    node.removeChild(node.firstChild.nextSibling);
  }

  let parts = path.split('/');
  if (parts.length > 2) {
    parts = [parts[parts.length - 2], parts[parts.length - 1]];
    node.appendChild(separators[0]);
    node.appendChild(breadcrumbs[Crumb.Ellipsis]);
  }

  if (path) {
    if (parts.length === 2) {
      node.appendChild(separators[1]);
      breadcrumbs[Crumb.Parent].textContent = parts[0];
      node.appendChild(breadcrumbs[Crumb.Parent]);
    }
    node.appendChild(separators[2]);
    breadcrumbs[Crumb.Current].textContent = parts[parts.length - 1];
    node.appendChild(breadcrumbs[Crumb.Current]);
  }
}


/**
 * Create the breadcrumb nodes.
 */
function createCrumbs(): HTMLElement[] {
  let home = document.createElement('i');
  home.className = 'fa fa-home ' + BREADCRUMB_ITEM_CLASS;
  let ellipsis = document.createElement('i');
  ellipsis.className = 'fa fa-ellipsis-h ' + BREADCRUMB_ITEM_CLASS;
  let parent = document.createElement('span');
  parent.className = BREADCRUMB_ITEM_CLASS;
  let current = document.createElement('span');
  current.className = BREADCRUMB_ITEM_CLASS;
  return [home, ellipsis, parent, current];
}


/**
 * Create the breadcrumb separator nodes.
 */
function createCrumbSeparators(): HTMLElement[] {
  let items: HTMLElement[] = [];
  for (let i = 0; i < 3; i++) {
    let item = document.createElement('i');
    item.className = 'fa fa-angle-right ' + BREADCRUMB_ITEM_CLASS;
    items.push(item);
  }
  return items;
}


/**
 * Create the button nodes.
 */
function createButtons(buttonBar: HTMLElement): HTMLElement[] {
  let buttons: HTMLElement[] = [];
  let icons = ['fa-plus', 'fa-upload', 'fa-refresh'];
  let titles = ['Create New...', 'Upload File(s)', 'Refresh File List'];
  for (let i = 0; i < 3; i++) {
    let button = document.createElement('button');
    button.className = BUTTON_ITEM_CLASS;
    button.title = titles[i];
    let icon = document.createElement('span');
    icon.className = BUTTON_ICON_CLASS + ' fa ' + icons[i];
    button.appendChild(icon);
    buttonBar.appendChild(button);
    buttons.push(button);
  }

  // Add the dropdown node to the "new file" button.
  var dropIcon = document.createElement('span');
  dropIcon.className = 'fa fa-caret-down';
  dropIcon.style.marginLeft = '-0.5em';
  buttons[Button.New].appendChild(dropIcon);

  // Create the hidden upload input field.
  let file = document.createElement('input');
  file.style.height = "100%";
  file.style.zIndex = "10000";
  file.setAttribute("type", "file");
  file.setAttribute("multiple", "multiple");
  buttons[Button.Upload].classList.add(UPLOAD_CLASS);
  buttons[Button.Upload].appendChild(file);
  return buttons;
}


/**
 * Create the "new" menu.
 */
function createNewItemMenu(command: ICommand): Menu {
  return new Menu([
    new MenuItem({
      text: 'Notebook',
      command: command,
      commandArgs: 'notebook'
    }),
    new MenuItem({
      text: 'Text File',
      command: command,
      commandArgs: 'file'
    }),
    new MenuItem({
      text: 'Directory',
      command: command,
      commandArgs: 'directory'
    })
  ]);
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

/**
 * Get the index of the node at a client position, or `-1`.
 */
function hitTestNodes(nodes: HTMLElement[], x: number, y: number): number {
  for (let i = 0, n = nodes.length; i < n; ++i) {
    if (hitTest(nodes[i], x, y)) return i;
  }
  return -1;
}
