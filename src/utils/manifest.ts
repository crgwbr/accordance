import fs from "node:fs";
import path from "node:path";

import axios from "axios";
import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { failure } from "io-ts/lib/PathReporter";

const NodePackageManifest = t.type({
    name: t.string,
    version: t.string,
    description: t.string,
});

const NPMPkgInfo = t.type({
    "name": t.string,
    "dist-tags": t.type({
        latest: t.string,
    }),
});

export const getPackageInfo = function () {
    const manifestPath = path.normalize(
        path.join(__dirname, "..", "..", "package.json"),
    );
    const rawManifest: unknown = JSON.parse(
        fs.readFileSync(manifestPath, { encoding: "utf-8" }),
    );
    const manifest = NodePackageManifest.decode(rawManifest);
    if (isLeft(manifest)) {
        throw new Error(failure(manifest.left).join("\n"));
    }
    return manifest.right;
};

export const checkForUpdates = async function () {
    const pkg = getPackageInfo();
    const npmInfoResp = await axios.get(
        `https://registry.npmjs.org/${pkg.name}`,
        {
            responseType: "json",
        },
    );
    const npmInfo = NPMPkgInfo.decode(npmInfoResp.data);
    if (isLeft(npmInfo)) {
        throw new Error(failure(npmInfo.left).join("\n"));
    }
    return {
        isOutdated: pkg.version !== npmInfo.right["dist-tags"].latest,
        name: pkg.name,
        current: pkg.version,
        latest: npmInfo.right["dist-tags"].latest,
    };
};
