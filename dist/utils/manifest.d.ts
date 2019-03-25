import * as t from 'io-ts';
export declare const getPackageInfo: () => t.TypeOfProps<{
    name: t.StringType;
    version: t.StringType;
    description: t.StringType;
}>;
export declare const checkForUpdates: () => Promise<{
    isOutdated: boolean;
    name: string;
    current: string;
    latest: string;
}>;
//# sourceMappingURL=manifest.d.ts.map