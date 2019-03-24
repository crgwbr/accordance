import path = require('path');
import request = require('request-promise-native');
import * as t from 'io-ts';
import {failure} from 'io-ts/lib/PathReporter';


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
    const manifest = require(manifestPath);
    return NodePackageManifest
        .decode(manifest)
        .getOrElseL((errors) => {
            throw new Error(failure(errors).join('\n'));
        });
};


export const checkForUpdates = async function() {
    const pkg = getPackageInfo();
    const npmInfoRaw = await request({
        uri: `https://registry.npmjs.org/${pkg.name}`,
        json: true,
    });
    const npmInfo = NPMPkgInfo
        .decode(npmInfoRaw)
        .getOrElseL((errors) => {
            throw new Error(failure(errors).join('\n'));
        });
    return {
        isOutdated: (pkg.version !== npmInfo['dist-tags'].latest),
        name: pkg.name,
        current: pkg.version,
        latest: npmInfo['dist-tags'].latest,
    };
};
