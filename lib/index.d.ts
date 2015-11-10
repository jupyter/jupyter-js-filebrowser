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
    constructor(baseUrl: string, currentDir: string);
    /**
     * Get the onClick handler for the file browser.
     */
    /**
     * Set the onClick handler for the file browser.
     */
    onClick: (name: string, contents: any) => void;
    /**
     * Handle the events on the file browser.
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
