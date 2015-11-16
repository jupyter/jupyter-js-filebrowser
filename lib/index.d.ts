import { IContents } from 'jupyter-js-services';
import { Widget } from 'phosphor-widget';
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
     * @param baseUrl - The base url for the Contents API.
     *
     * @param currentDir - The name of the current directory.
     *
     * @param contents - An existing Contents API object.
     */
    constructor(baseUrl: string, currentDir: string, contents?: IContents);
    /**
     * Get the current directory of the file browser.
     */
    /**
     * Set the current directory of the file browser.
     *
     * @param path - The path of the new directory.
     *
     * #### Note
     * This does not call [listDirectoryectory].
     */
    directory: string;
    /**
     * Get the onClick handler for the file browser.
     *
     * This is called in response to a user clicking on a file target.
     * The contents of the file are retrieved, and the name and contents
     * of the file are passed to the handler.
     */
    /**
     * Set the onClick handler for the file browser.
     *
     * @param cb - The callback for an onclick event.
     *
     * This is called in response to a user clicking on a file target.
     * The contents of the file are retrieved, and the name and contents
     * of the file are passed to the handler.
     */
    onClick: (name: string, contents: any) => void;
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
     * Set the file browser contents based on the current directory.
     */
    listDirectory(): void;
    /**
     * Handle the `'mousedown'` event for the file browser.
     */
    private _evtMouseDown(event);
    private _addItem(text, isDirectory);
    private _currentDir;
    private _onClick;
    private _contents;
}
