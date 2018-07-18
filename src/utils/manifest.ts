import path = require('path');
import * as t from 'io-ts';
import {failure} from 'io-ts/lib/PathReporter';


const NodePackageManifest = t.type({
    name: t.string,
    version: t.string,
    description: t.string,
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
