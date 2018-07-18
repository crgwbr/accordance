"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var t = require("io-ts");
var PathReporter_1 = require("io-ts/lib/PathReporter");
var NodePackageManifest = t.type({
    name: t.string,
    version: t.string,
    description: t.string,
});
exports.getPackageInfo = function () {
    var manifestPath = path.normalize(path.join(__dirname, '..', '..', 'package.json'));
    var manifest = require(manifestPath);
    return NodePackageManifest
        .decode(manifest)
        .getOrElseL(function (errors) {
        throw new Error(PathReporter_1.failure(errors).join('\n'));
    });
};
//# sourceMappingURL=manifest.js.map