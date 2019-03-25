export declare const getPackageInfo: () => {
    name: string;
    version: string;
    description: string;
};
export declare const checkForUpdates: () => Promise<{
    isOutdated: boolean;
    name: string;
    current: string;
    latest: string;
}>;
//# sourceMappingURL=manifest.d.ts.map