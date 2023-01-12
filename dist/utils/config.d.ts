import * as t from "io-ts";
declare const AccordanceConfig: t.IntersectionC<[t.TypeC<{
    name: t.StringC;
    local: t.TypeC<{
        root: t.StringC;
    }>;
    remote: t.TypeC<{
        username: t.StringC;
        host: t.StringC;
        root: t.StringC;
    }>;
    prefer: t.UnionC<[t.LiteralC<"local">, t.LiteralC<"remote">]>;
}>, t.PartialC<{
    syncIgnore: t.ArrayC<t.StringC>;
    watchIgnore: t.ArrayC<t.StringC>;
    options: t.RecordC<t.StringC, t.BooleanC>;
}>]>;
export type IAccordanceConfig = t.TypeOf<typeof AccordanceConfig>;
export declare const readConfig: (configPath: string) => {
    name: string;
    local: {
        root: string;
    };
    remote: {
        username: string;
        host: string;
        root: string;
    };
    prefer: "local" | "remote";
} & {
    syncIgnore?: string[] | undefined;
    watchIgnore?: string[] | undefined;
    options?: {
        [x: string]: boolean;
    } | undefined;
};
export declare const getAnyMatchIgnorePatterns: (rootPath: string, rules: string[]) => string[];
export declare const getUnisonConfigPath: (config: IAccordanceConfig) => string;
export declare const buildUnisonConfig: (config: IAccordanceConfig) => string;
export declare const writeUnisonConfigFile: (config: IAccordanceConfig) => void;
export {};
//# sourceMappingURL=config.d.ts.map