"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncQueue = void 0;
const path = require("path");
const cli_1 = require("./cli");
class SyncQueue {
    constructor(onQueue) {
        /**
         * Queue of directories that need sync'd. Will be processed in FIFO order.
         */
        this._queue = [];
        this.onQueue = onQueue;
    }
    /**
     * Add a path to the sync queue
     */
    queue(config, source, eventType, filePath) {
        // If this directory exists in the queue already, OR if it's a subdirectory of something already
        // in the queue, don't do anything.
        const dir = path.dirname(filePath);
        const existing = this._queue.filter((e) => {
            return e.directory === dir || this.isSubDirectory(e.directory, dir);
        });
        if (existing.length > 0) {
            return;
        }
        // If any subdirectories of the new directory already exist in the queue, remove them.
        this._queue = this._queue.filter((e) => {
            return !this.isSubDirectory(dir, e.directory);
        });
        // If the sync queue if getting huge, wipe it a sync everything
        if (this._queue.length > 50) {
            const msg = `${source.toUpperCase()}: ${eventType} ${filePath}`;
            console.log((0, cli_1.makeGreen)(msg));
            this._queue = [
                {
                    config: config,
                    source: source,
                    eventType: "overflow",
                    directory: ".",
                },
            ];
            this.onQueue();
        }
        // Otherwise, just queue the sync
        console.log((0, cli_1.makeGreen)(`QUEUE: Detected ${eventType} to ${filePath} on ${source}`));
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
    dequeue() {
        return this._queue.shift();
    }
    /**
     * Get the size of the sync queue
     */
    size() {
        return this.queue.length;
    }
    isSubDirectory(parent, child) {
        return path.relative(child, parent).indexOf("..") === 0;
    }
}
exports.SyncQueue = SyncQueue;
//# sourceMappingURL=queue.js.map