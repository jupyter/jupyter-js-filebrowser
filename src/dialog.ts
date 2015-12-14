// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  ICommand
} from 'phosphor-command';

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

import './dialog.css';


/**
 * The class name added to Dialog instances.
 */
const DIALOG_CLASS = 'jp-Dialog';

/**
 * The class name added to Dialog content node.
 */
const CONTENT_CLASS = 'jp-Dialog-content';

/**
 * The class name added to Dialog header node.
 */
const HEADER_CLASS = 'jp-Dialog-header';

/**
 * The class name added to Dialog body node.
 */
const BODY_CLASS = 'jp-Dialog-body';

/**
 * The class name added to Dialog content node.
 */
const FOOTER_CLASS = 'jp-Dialog-footer';

/**
 * The class name added to Dialog button nodes.
 */
const BUTTON_CLASS = 'jp-Dialog-button';

/**
 * The class name added to Dialog OK buttons.
 */
const OK_BUTTON_CLASS = 'jp-Dialog-ok-button';

/**
 * The class name added to Dialog Cancel buttons.
 */
const CANCEL_BUTTON_CLASS = 'jp-Dialog-cancel-button';


/**
 * A button applied to a dialog.
 */
export
interface IButtonItem {
  /**
   * The text for the button.
   */
  text: string;

  /**
   * The icon class for the button.
   */
  icon?: string;

  /**
   * The extra class name to associate with the button.
   */
  className?: string;

  /**
   * The command for the button.
   */
  command?: ICommand;

  /**
   * The args object for the button command.
   */
  commandArgs?: any;
}


/**
 * Define a default "OK" button.
 */
export
const okButton: IButtonItem = {
  text: 'OK',
  className: 'jp-Dialog-ok-button'
}


/**
 * Define a default "Cancel" button.
 */
export
const cancelButton: IButtonItem = {
  text: 'Cancel',
  className: 'jp-Dialog-cancel-button'
}


/**
 * An implementation of a modal dialog.
 */
export
class Dialog extends Widget {
  /**
   * Create the DOM node for dialog.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('div');
    let header = document.createElement('div');
    let body = document.createElement('div');
    let footer = document.createElement('ul');
    content.className = CONTENT_CLASS;
    header.className = HEADER_CLASS;
    body.className = BODY_CLASS;
    footer.className = FOOTER_CLASS;
    node.appendChild(content);
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    return node;
  }

  /**
   * Create a dialog and show it.
   */
  static showDialog(title: string, host: HTMLElement, body: HTMLElement, buttons?: IButtonItem[]): Promise<IButtonItem>{
    let dialog = new Dialog(title, host, body, buttons);
    return dialog.show();
  }

  /**
   * Construct a new dialog.
   */
  constructor(title: string, host: HTMLElement, body: HTMLElement, buttons?: IButtonItem[]) {
    super();
    this.addClass(DIALOG_CLASS);
    this._title = title;
    this._host = host;
    this._body = body;
    this._buttons = buttons || [okButton, cancelButton];
  }

  /**
   * Show the dialog over the host node.
   *
   * @returns The button item that was selected or `null` if the dialog was Escaped.
   */
  show(): Promise<IButtonItem> {
    // Set up the geometry of the dialog.
    let rect = this._host.getBoundingClientRect();
    this.node.style.left = rect.left + 'px';
    this.node.style.top = rect.top + 'px';
    this.node.style.width = rect.width + 'px';
    this.node.style.height = rect.height + 'px';

    // Add the dialog contents and attach to the document.
    let header = this.node.getElementsByClassName(HEADER_CLASS)[0];
    header.textContent = this._title;
    let body = this.node.getElementsByClassName(BODY_CLASS)[0];
    body.appendChild(this._body);
    let footer = this.node.getElementsByClassName(FOOTER_CLASS)[0];
    this._buttonNodes = [];
    for (let item of this._buttons) {
      let button = createButton(item);
      button.tabIndex = this._buttonNodes.length;
      this._buttonNodes.push(button);
      footer.appendChild(button);
    }
    Widget.attach(this, document.body);

    // Return a promise to be resolved when the dialog is closed.
    return new Promise<IButtonItem>((resolve, reject) => {
      this._resolver = resolve;
    });
  }

  /**
   * Handle the DOM events for the dialog.
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
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('click', this);
    document.addEventListener('keydown', this, true);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.node.removeEventListener('click', this);
    document.removeEventListener('keydown', this, true);
  }

  /**
   * Handle the `'keydown'` event for the dialog.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    var index = this._buttonNodes.indexOf(event.target as HTMLElement);
    if (index === -1 && event.target !== document.body) {
      return;
    }
    event.stopPropagation();
    switch (event.keyCode) {
    case 9:  // Tab
      event.preventDefault();
      if (index === -1) {
        this._buttonNodes[0].focus();
      } else {
        index = (index + 1) % this._buttonNodes.length;
        this._buttonNodes[index].focus();
      }
      break;
    case 13:  // Enter
      event.preventDefault();
      if (index !== -1) this._handleSelect(this._buttons[index]);
      break;
    case 27:  // Escape
      Widget.detach(this);
      event.preventDefault();
      this._resolver(void 0);
      break;
    }
  }

  /**
   * Handle the `'click'` event for the dialog.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Check for a click on a button.
    let index = hitTestNodes(this._buttonNodes, event.clientX, event.clientY);
    if (index !== -1) {
      // Stop the event propagation.
      event.preventDefault();
      event.stopPropagation();
      this._handleSelect(this._buttons[index]);
    }
  }

  /**
   * Handle a selection of one of the button nodes.
   */
  private _handleSelect(item: IButtonItem): void {
    Widget.detach(this);
    if (item.command && item.command.isEnabled) {
      item.command.execute(item.commandArgs);
    }
    this._resolver(item);
  }

  private _title = '';
  private _host: HTMLElement = null;
  private _body: HTMLElement = null;
  private _buttons: IButtonItem[] = [];
  private _resolver: (value: IButtonItem) => void = null;
  private _buttonNodes: HTMLElement[] = [];
}


/**
 * Create a node for a button item.
 */
function createButton(item: IButtonItem): HTMLElement {
  let el = document.createElement('li');
  el.textContent = item.text;
  el.className = BUTTON_CLASS;
  if (item.icon) el.classList.add(item.icon);
  if (item.className) el.classList.add(item.className);
  return el;
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
