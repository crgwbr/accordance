import path = require('path');
import {IAccordanceConfig} from './config';
import {makeGreen} from './cli';


/**
 * Interface of an entry in the unison sync queue
 */
export interface ISyncQueueEntry {
    config: IAccordanceConfig;
    source: string;
    eventType: string;
    directory: string;
}


export class SyncQueue {
    /**
     * Queue of directories that need sync'd. Will be processed in FIFO order.
     */
    private _queue: ISyncQueueEntry[] = [];


    /**
     * Callback function to be run after an item is added to the queue
     * @type {[type]}
     */
    private onQueue: () => void;


    constructor (onQueue: () => void) {
        this.onQueue = onQueue;
    }


    /**
     * Add a path to the sync queue
     */
    queue (config: IAccordanceConfig, source: string, eventType: string, filePath: string) {
        const self = this;

        // If this directory exists in the queue already, OR if it's a subdirectory of something already
        // in the queue, don't do anything.
        const dir = path.dirname(filePath);
        const existing = this._queue
            .filter((e) => {
                return e.directory === dir || self.isSubDirectory(e.directory, dir);
            });
        if (existing.length > 0) {
            return;
        }

        // If any subdirectories of the new directory already exist in the queue, remove them.
        this._queue = this._queue
            .filter((e) => {
                return !self.isSubDirectory(dir, e.directory);
            });

        // If the sync queue if getting huge, wipe it a sync everything
        if (this._queue.length > 50) {
            const msg = `${source.toUpperCase()}: ${eventType} ${filePath}`;
            console.log(makeGreen(msg));
            this._queue = [
                {
                    config: config,
                    source: source,
                    eventType: 'overflow',
                    directory: '.',
                }
            ];
            this.onQueue();
        }

        // Otherwise, just queue the sync
        console.log(makeGreen(`QUEUE: Detected ${eventType} to ${filePath} on ${source}`));
        this._queue.push({
            config: config,
            source: source,
            eventType: eventType,
            directory: dir,
        });
        this.onQueue();
    }


    /**
     * Dequeue an entry from the sync queue
     */
    dequeue () {
        return this._queue.shift();
    }


    /**
     * Get the size of the sync queue
     */
    size () {
        return this.queue.length;
    }


    private isSubDirectory (parent: string, child: string) {
        return path.relative(child, parent).indexOf('..') === 0;
    }
}
