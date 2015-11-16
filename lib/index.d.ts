import { IContents } from 'jupyter-js-services';
import { Widget } from 'phosphor-widget';
/**
 * A widget which hosts a file browser.
 */
export declare class FileBrowser extends Widget {
    /**
     * Create a new node for the file list.
     */
    static createNode(): HTMLElement;
    /**
     * Construct a new file browser widget.
     */
    constructor(baseUrl: string, currentDir: string, contents?: IContents);
    /**
     * Get the onClick handler for the file browser.
     */
    /**
     * Set the onClick handler for the file browser.
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
     * Set the file browser contents to the items in the
     * current directory.
     */
    listDir(): void;
    private _addItem(text, isDirectory);
    private _currentDir;
    private _onClick;
    private _contents;
}
