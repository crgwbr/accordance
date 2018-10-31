import { IAccordanceConfig } from './config';
/**
 * Interface of an entry in the unison sync queue
 */
export interface ISyncQueueEntry {
    config: IAccordanceConfig;
    source: string;
    eventType: string;
    directory: string;
}
export declare class SyncQueue {
    /**
     * Queue of directories that need sync'd. Will be processed in FIFO order.
     */
    private _queue;
    /**
     * Callback function to be run after an item is added to the queue
     * @type {[type]}
     */
    private onQueue;
    constructor(onQueue: () => void);
    /**
     * Add a path to the sync queue
     */
    queue(config: IAccordanceConfig, source: string, eventType: string, filePath: string): void;
    /**
     * Dequeue an entry from the sync queue
     */
    dequeue(): ISyncQueueEntry | undefined;
    /**
     * Get the size of the sync queue
     */
    size(): number;
    private isSubDirectory;
}
//# sourceMappingURL=queue.d.ts.map