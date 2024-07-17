import { isLeft } from "fp-ts/lib/Either";
import * as fs from "fs";
import * as t from "io-ts";
import { failure } from "io-ts/lib/PathReporter";
import * as yaml from "js-yaml";
import * as os from "os";
import * as path from "path";

const AccordanceConfigBase = t.type({
    name: t.string,
    local: t.type({
        root: t.string,
    }),
    remote: t.intersection([
        t.type({
            username: t.string,
            host: t.string,
            root: t.string,
        }),
        t.partial({
            port: t.number,
        }),
    ]),
    prefer: t.union([t.literal("local"), t.literal("remote")]),
});

const AccordanceConfigExtras = t.partial({
    syncIgnore: t.array(t.string),
    watchIgnore: t.array(t.string),
    options: t.record(t.string, t.boolean),
});

const AccordanceConfig = t.intersection([
    AccordanceConfigBase,
    AccordanceConfigExtras,
]);

export type IAccordanceConfig = t.TypeOf<typeof AccordanceConfig>;

export const readConfig = function (configPath: string) {
    const content = fs.readFileSync(configPath, "utf8");
    const rawConfig = yaml.load(content);
    const config = AccordanceConfig.decode(rawConfig);
    if (isLeft(config)) {
        throw new Error(failure(config.left).join("\n"));
    }
    return config.right;
};

const _getIgnorePattern = function (rootPath: string, unisonIgnore: string) {
    const groups = unisonIgnore.match(/^([\w]+)\s+(.+)$/);
    if (!groups) {
        return [];
    }
    const ignoreType = groups[1];
    const rawPattern = groups[2];
    switch (ignoreType) {
        case "Name":
            return [
                `${rawPattern}/**`,
                `**/${rawPattern}/**`,
                `**/${rawPattern}`,
            ];
        case "Path":
            return [
                path.join(rootPath, rawPattern),
                path.join(rootPath, rawPattern.replace(/\*/g, "**")),
            ];
    }
    return [rawPattern];
};

export const getAnyMatchIgnorePatterns = function (
    rootPath: string,
    rules: string[],
) {
    return rules.reduce<string[]>((memo, rule) => {
        return memo.concat(_getIgnorePattern(rootPath, rule));
    }, []);
};

export const getUnisonConfigPath = function (config: IAccordanceConfig) {
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, ".unison", `${config.name}.prf`);
    return path.normalize(configPath);
};

const _buildUnisonConfigLine = function (
    key: string,
    rawValue: string | boolean,
) {
    let value: string;
    if (rawValue === true) {
        value = "true";
    } else if (rawValue === false) {
        value = "false";
    } else {
        value = rawValue;
    }
    return `${key} = ${value}`;
};

export const buildUnisonConfig = function (config: IAccordanceConfig) {
    // Setup the local and remote roots
    const username = config.remote.username || os.userInfo().username;
    const port = config.remote.port || 22;
    const remoteURL = `ssh://${username}@${config.remote.host}:${port}/${config.remote.root}`;
    const lines: string[] = [
        _buildUnisonConfigLine("root", config.local.root),
        _buildUnisonConfigLine("root", remoteURL),
    ];

    // Set the preferred root
    if (config.prefer === "local") {
        lines.push(_buildUnisonConfigLine("prefer", config.local.root));
    } else {
        lines.push(_buildUnisonConfigLine("prefer", remoteURL));
    }

    // Add the ignore rules
    if (config.syncIgnore) {
        config.syncIgnore.forEach((rule) => {
            lines.push(_buildUnisonConfigLine("ignore", rule));
        });
    }

    // Add other misc options
    if (config.options) {
        for (const opt of Object.keys(config.options)) {
            lines.push(_buildUnisonConfigLine(opt, config.options[opt]));
        }
    }

    // Join into a single string
    return lines.join("\n");
};

export const writeUnisonConfigFile = function (config: IAccordanceConfig) {
    const unisonConfigPath = getUnisonConfigPath(config);
    const unisonConfigDir = path.dirname(unisonConfigPath);
    if (!fs.existsSync(unisonConfigDir)) {
        fs.mkdirSync(path.dirname(unisonConfigPath));
    }
    const unisonConfigContent = buildUnisonConfig(config);
    fs.writeFileSync(unisonConfigPath, unisonConfigContent);
};
