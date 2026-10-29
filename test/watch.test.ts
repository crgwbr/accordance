import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { after, describe, it } from "node:test";

import { buildWatcher } from "../src/utils/watch.js";

const tmpDir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "accordance-watch-test-")),
);
fs.mkdirSync(path.join(tmpDir, "ignored"));
fs.writeFileSync(path.join(tmpDir, "ignored", "a"), "");
fs.mkdirSync(path.join(tmpDir, "kept"));
fs.writeFileSync(path.join(tmpDir, "kept", "b"), "");

const originalCwd = process.cwd();

after(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("buildWatcher", () => {
    it("honors literal ignore paths when given a relative root", async () => {
        process.chdir(tmpDir);
        const watcher = buildWatcher(".", ["ignored"]);
        await new Promise<void>((resolve) => {
            watcher.on("ready", () => {
                resolve();
            });
        });
        const dirs = Object.keys(watcher.getWatched());
        await watcher.close();
        assert.ok(dirs.includes(path.join(tmpDir, "kept")));
        assert.ok(!dirs.includes(path.join(tmpDir, "ignored")));
    });
});
