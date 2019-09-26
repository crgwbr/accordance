import path = require('path');
import request = require('request-promise-native');
import * as t from 'io-ts';
import {failure} from 'io-ts/lib/PathReporter';
import {isLeft} from 'fp-ts/lib/Either';


const NodePackageManifest = t.type({
    name: t.string,
    version: t.string,
    description: t.string,
});


const NPMPkgInfo = t.type({
    'name': t.string,
    'dist-tags': t.type({
        'latest': t.string,
    }),
});


export const getPackageInfo = function() {
    const manifestPath = path.normalize(path.join(__dirname, '..', '..', 'package.json'));
    const rawManifest = require(manifestPath);
    const manifest = NodePackageManifest.decode(rawManifest);
    if (isLeft(manifest)) {
        throw new Error(failure(manifest.left).join('\n'));
    }
    return manifest.right;
};


export const checkForUpdates = async function() {
    const pkg = getPackageInfo();
    const npmInfoRaw = await request({
        uri: `https://registry.npmjs.org/${pkg.name}`,
        json: true,
    });
    const npmInfo = NPMPkgInfo.decode(npmInfoRaw);
    if (isLeft(npmInfo)) {
        throw new Error(failure(npmInfo.left).join('\n'));
    }
    return {
        isOutdated: (pkg.version !== npmInfo.right['dist-tags'].latest),
        name: pkg.name,
        current: pkg.version,
        latest: npmInfo.right['dist-tags'].latest,
    };
};
