import { IContents, INotebookSession, ISessionId } from 'jupyter-js-services';
import { Message } from 'phosphor-messaging';
import { Widget } from 'phosphor-widget';
/**
 * A view model associated with a Jupyter FileBrowser.
 */
export interface IFileBrowserViewModel {
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
    constructor(model: IFileBrowserViewModel);
    /**
     * Get the current directory of the file browser.
     */
    /**
     * Set the current directory of the file browser.
     *
     * @param path - The path of the new directory.
     */
    directory: string;
    /**
     * Get the selected items for the file browser.
     *
     * #### Notes
     * This is a read-only property.
     */
    selectedItems: string[];
    /**
     * Open the currently selected item(s).
     */
    open(): void;
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
    private _handleMultiSelect(node);
    private _findTarget(event);
    /**
     * List the contents of the current directory.
     */
    private _listContents();
    private _addItem(text, isDirectory);
    private _model;
}
