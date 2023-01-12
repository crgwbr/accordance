"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUpdates = exports.getPackageInfo = void 0;
const path = require("path");
const request = require("request-promise-native");
const t = __importStar(require("io-ts"));
const PathReporter_1 = require("io-ts/lib/PathReporter");
const Either_1 = require("fp-ts/lib/Either");
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
const getPackageInfo = function () {
    const manifestPath = path.normalize(path.join(__dirname, "..", "..", "package.json"));
    const rawManifest = require(manifestPath);
    const manifest = NodePackageManifest.decode(rawManifest);
    if ((0, Either_1.isLeft)(manifest)) {
        throw new Error((0, PathReporter_1.failure)(manifest.left).join("\n"));
    }
    return manifest.right;
};
exports.getPackageInfo = getPackageInfo;
const checkForUpdates = async function () {
    const pkg = (0, exports.getPackageInfo)();
    const npmInfoRaw = await request({
        uri: `https://registry.npmjs.org/${pkg.name}`,
        json: true,
    });
    const npmInfo = NPMPkgInfo.decode(npmInfoRaw);
    if ((0, Either_1.isLeft)(npmInfo)) {
        throw new Error((0, PathReporter_1.failure)(npmInfo.left).join("\n"));
    }
    return {
        isOutdated: pkg.version !== npmInfo.right["dist-tags"].latest,
        name: pkg.name,
        current: pkg.version,
        latest: npmInfo.right["dist-tags"].latest,
    };
};
exports.checkForUpdates = checkForUpdates;
//# sourceMappingURL=manifest.js.map