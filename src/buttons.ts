// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  DelegateCommand, ICommand
} from 'phosphor-command';

import {
  showDialog
} from 'phosphor-dialog';

import {
  Menu, MenuItem
} from 'phosphor-menus';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowserViewModel
} from './viewmodel';

import {
  showErrorMessage
} from './utils';


/**
 * The class name added to the button node.
 */
const BUTTON_CLASS = 'jp-FileButtons';

/**
 * The class name added to the button nodes.
 */
const BUTTON_ITEM_CLASS = 'jp-FileButtons-item';

/**
 * The class name added to the button icon nodes.
 */
const BUTTON_ICON_CLASS = 'jp-FileButtons-icon';

/**
 * The class name added to the upload button node.
 */
const UPLOAD_CLASS = 'jp-FileButtons-upload';


/**
 * A widget which host the file browser buttons.
 */
export
class FileButtons extends Widget {

  /**
   * Construct a new file browser button widget.
   *
   * @param model - The file browser view model.
   */
  constructor(model: FileBrowserViewModel) {
    super();
    this.addClass(BUTTON_CLASS);
    this._model = model;
    var buttons = createButtons(this.node);

    // Set up events on the buttons.
    let input = buttons[Button.Upload].getElementsByTagName('input')[0];
    input.onchange = this._handleUploadEvent.bind(this);

    buttons[Button.Refresh].onclick = () => {
      this._model.open('.');
    };

    buttons[Button.New].onclick = () => {
      let rect = buttons[Button.New].getBoundingClientRect();
      this._newMenu.popup(rect.left, rect.bottom, false, true);
    }

    // Create the "new" menu.
    let command = new DelegateCommand(args => {
      this._model.newUntitled(args as string).catch(error => {
        showErrorMessage(this, 'New File Error', error);
       }).then(() => this._model.open('.'));
    });
    this._newMenu = createNewItemMenu(command);

  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._model = null;
    this._newMenu.dispose();
    this._newMenu = null;
    super.dispose();
  }

  /**
   * Handle a file upload event.
   */
  private _handleUploadEvent(event: Event): void {
    let promises: Promise<void>[] = [];
    for (var file of (event.target as any).files) {
      promises.push(this._model.upload(file).catch(error => {
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
        showErrorMessage(this, 'Upload Error', error.message);
      }));
    }
    Promise.all(promises).then(() => this._model.open('.'));
  }

  private _newMenu: Menu = null;
  private _model: FileBrowserViewModel = null;
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
