import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IAccordanceConfig } from "../src/utils/config.js";
import { SyncQueue } from "../src/utils/queue.js";

const config: IAccordanceConfig = {
    name: "test",
    local: { root: "/tmp/local" },
    remote: { username: "user", host: "localhost", root: "/tmp/remote" },
    prefer: "local",
};

describe("SyncQueue.size", () => {
    it("is 0 for an empty queue", () => {
        const queue = new SyncQueue(() => undefined);
        assert.equal(queue.size(), 0);
    });

    it("counts queued entries and drops to 0 after dequeue", () => {
        const queue = new SyncQueue(() => undefined);
        queue.queue(config, "local", "change", "a.txt");
        assert.equal(queue.size(), 1);
        queue.dequeue();
        assert.equal(queue.size(), 0);
    });
});
