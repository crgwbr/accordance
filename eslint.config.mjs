import path from "node:path";
import { fileURLToPath } from "node:url";

import { getTSConfig } from "@thelabnyc/standards/eslint.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default getTSConfig({
    parserOptions: {
        projectService: {
            allowDefaultProject: ["*.js", "*.cjs", "*.mjs"],
        },
        tsconfigRootDir: __dirname,
    },
    configs: [
        {
            ignores: [
                ".cache/**/*",
                "*.js",
                "*.mjs",
                "**/*.js",
                "**/*.mjs",
                "!eslint.config.mjs",
            ],
        },
    ],
});
