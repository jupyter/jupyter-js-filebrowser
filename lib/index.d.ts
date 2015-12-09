import { IContents, IContentsModel } from 'jupyter-js-services';
import { Message } from 'phosphor-messaging';
import { ISignal, Signal } from 'phosphor-signaling';
import { Widget } from 'phosphor-widget';
/**
 * An implementation of a file browser view model.
 */
export declare class FileBrowserViewModel {
    /**
     * A signal emitted when an item is opened.
     */
    static openedSignal: Signal<FileBrowserViewModel, IContentsModel>;
    /**
     * Construct a new file browser view model.
     */
    constructor(contents: IContents);
    /**
     * Get the item opened signal.
     */
    opened: ISignal<FileBrowserViewModel, IContentsModel>;
    /**
     * Get the current directory.
     */
    /**
     * Set the current directory.
     */
    currentDirectory: string;
    /**
     * Get the current selected items.
     */
    /**
     * Set the current selected items.
     */
    selectedItems: IContentsModel[];
    /**
     * Get the contents provider.
     *
     * #### Notes
     * This is a read-only property.
     */
    contents: IContents;
    /**
     * Open the current selected items.
     *
     * #### Notes
     * Emits an [[opened]] signal for each item
     * after loading the contents.
     */
    open(): void;
    /**
     * Refresh the directory contents.
     */
    refresh(): void;
    private _baseUrl;
    private _selectedItems;
    private _currentDirectory;
    private _contents;
}
/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retreive contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
export declare class FileBrowser extends Widget {
    /**
     * Create a new node for the file list.
     */
    static createNode(): HTMLElement;
    /**
     * Construct a new file browser widget.
     *
     * @param model - File browser view model instance.
     */
    constructor(model: FileBrowserViewModel);
    /**
     * Dispose of the resources held by the file browser.
     */
    dispose(): void;
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
    handleEvent(event: Event): void;
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * Handle the `'click'` event for the file browser.
     */
    private _evtClick(event);
    /**
     * Handle the `'dblclick'` event for the file browser.
     */
    private _evtDblClick(event);
    /**
     * Load a directory
     */
    private _load(payload);
    private _model;
    private _items;
}
