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
exports.writeUnisonConfigFile = exports.buildUnisonConfig = exports.getUnisonConfigPath = exports.getAnyMatchIgnorePatterns = exports.readConfig = void 0;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
const t = __importStar(require("io-ts"));
const PathReporter_1 = require("io-ts/lib/PathReporter");
const Either_1 = require("fp-ts/lib/Either");
const AccordanceConfigBase = t.type({
    name: t.string,
    local: t.type({
        root: t.string,
    }),
    remote: t.type({
        username: t.string,
        host: t.string,
        root: t.string,
    }),
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
const readConfig = function (configPath) {
    const content = fs.readFileSync(configPath, "utf8");
    const rawConfig = yaml.load(content);
    const config = AccordanceConfig.decode(rawConfig);
    if ((0, Either_1.isLeft)(config)) {
        throw new Error((0, PathReporter_1.failure)(config.left).join("\n"));
    }
    return config.right;
};
exports.readConfig = readConfig;
const _getIgnorePattern = function (rootPath, unisonIgnore) {
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
const getAnyMatchIgnorePatterns = function (rootPath, rules) {
    return rules.reduce((memo, rule) => {
        return memo.concat(_getIgnorePattern(rootPath, rule));
    }, []);
};
exports.getAnyMatchIgnorePatterns = getAnyMatchIgnorePatterns;
const getUnisonConfigPath = function (config) {
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, ".unison", `${config.name}.prf`);
    return path.normalize(configPath);
};
exports.getUnisonConfigPath = getUnisonConfigPath;
const _buildUnisonConfigLine = function (key, rawValue) {
    let value;
    if (rawValue === true) {
        value = "true";
    }
    else if (rawValue === false) {
        value = "false";
    }
    else {
        value = rawValue;
    }
    return `${key} = ${value}`;
};
const buildUnisonConfig = function (config) {
    // Setup the local and remote roots
    const remoteURL = `ssh://${config.remote.host}/${config.remote.root}`;
    const lines = [
        _buildUnisonConfigLine("root", config.local.root),
        _buildUnisonConfigLine("root", remoteURL),
    ];
    // Set the preferred root
    if (config.prefer === "local") {
        lines.push(_buildUnisonConfigLine("prefer", config.local.root));
    }
    else {
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
exports.buildUnisonConfig = buildUnisonConfig;
const writeUnisonConfigFile = function (config) {
    const unisonConfigPath = (0, exports.getUnisonConfigPath)(config);
    const unisonConfigDir = path.dirname(unisonConfigPath);
    if (!fs.existsSync(unisonConfigDir)) {
        fs.mkdirSync(path.dirname(unisonConfigPath));
    }
    const unisonConfigContent = (0, exports.buildUnisonConfig)(config);
    fs.writeFileSync(unisonConfigPath, unisonConfigContent);
};
exports.writeUnisonConfigFile = writeUnisonConfigFile;
//# sourceMappingURL=config.js.map