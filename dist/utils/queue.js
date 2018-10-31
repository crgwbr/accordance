"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var cli_1 = require("./cli");
var SyncQueue = /** @class */ (function () {
    function SyncQueue(onQueue) {
        /**
         * Queue of directories that need sync'd. Will be processed in FIFO order.
         */
        this._queue = [];
        this.onQueue = onQueue;
    }
    /**
     * Add a path to the sync queue
     */
    SyncQueue.prototype.queue = function (config, source, eventType, filePath) {
        var self = this;
        // If this directory exists in the queue already, OR if it's a subdirectory of something already
        // in the queue, don't do anything.
        var dir = path.dirname(filePath);
        var existing = this._queue
            .filter(function (e) {
            return e.directory === dir || self.isSubDirectory(e.directory, dir);
        });
        if (existing.length > 0) {
            return;
        }
        // If any subdirectories of the new directory already exist in the queue, remove them.
        this._queue = this._queue
            .filter(function (e) {
            return !self.isSubDirectory(dir, e.directory);
        });
        // If the sync queue if getting huge, wipe it a sync everything
        if (this._queue.length > 50) {
            var msg = source.toUpperCase() + ": " + eventType + " " + filePath;
            console.log(cli_1.makeGreen(msg));
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
        console.log(cli_1.makeGreen("QUEUE: Detected " + eventType + " to " + filePath + " on " + source));
        this._queue.push({
            config: config,
            source: source,
            eventType: eventType,
            directory: dir,
        });
        this.onQueue();
    };
    /**
     * Dequeue an entry from the sync queue
     */
    SyncQueue.prototype.dequeue = function () {
        return this._queue.shift();
    };
    /**
     * Get the size of the sync queue
     */
    SyncQueue.prototype.size = function () {
        return this.queue.length;
    };
    SyncQueue.prototype.isSubDirectory = function (parent, child) {
        return path.relative(child, parent).indexOf('..') === 0;
    };
    return SyncQueue;
}());
exports.SyncQueue = SyncQueue;
//# sourceMappingURL=queue.js.map