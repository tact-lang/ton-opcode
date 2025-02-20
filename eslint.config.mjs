import path from "node:path"
import tseslint from "typescript-eslint"
import url from "node:url"
import unusedImports from "eslint-plugin-unused-imports"
import unicornPlugin from "eslint-plugin-unicorn"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default tseslint.config(
    // register plugins
    {
        plugins: {
            ["@typescript-eslint"]: tseslint.plugin,
            ["@unused-imports"]: unusedImports,
        },
    },

    // add files and folders to be ignored
    {
        ignores: [
            "**/*.js",
            "**/*.spec.ts",
            "eslint.config.mjs",
            "vitest.config.ts",
            ".husky/install.mjs",
            ".github/*",
            ".yarn/*",
            ".testing/*",
            "dist/*",
            "docs/*",
            "scripts/*",
        ],
    },

    tseslint.configs.all,
    unicornPlugin.configs["flat/all"],

    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },

        rules: {
            // override stylisticTypeChecked
            "@typescript-eslint/no-empty-function": ["error", {allow: ["arrowFunctions"]}],
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/typedef": [
                "error",
                {parameter: true, memberVariableDeclaration: true},
            ],
            "@typescript-eslint/consistent-generic-constructors": ["error", "type-annotation"],
            "@typescript-eslint/prefer-optional-chain": "off",

            // override strictTypeChecked
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-extraneous-class": "off",

            "@typescript-eslint/prefer-readonly": "error",
            "@typescript-eslint/switch-exhaustiveness-check": "error",

            "@unused-imports/no-unused-imports": "error",
            "no-duplicate-imports": "error",

            "@typescript-eslint/no-magic-numbers": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
            "@typescript-eslint/member-ordering": "off",
            "@typescript-eslint/method-signature-style": "off",
            "@typescript-eslint/prefer-destructuring": "off",
            "@typescript-eslint/strict-boolean-expressions": "off",
            "@typescript-eslint/no-use-before-define": "off",

            "@typescript-eslint/consistent-type-imports": "off",
            "@typescript-eslint/naming-convention": "off",
            "@typescript-eslint/max-params": "off",

            "@/eqeqeq": "error",

            // override unicorn
            "unicorn/prevent-abbreviations": "off",
            "unicorn/prefer-string-slice": "off",
            "unicorn/no-keyword-prefix": "off",
            "unicorn/no-abusive-eslint-disable": "off",
            "unicorn/no-array-for-each": "off",
            "unicorn/no-null": "off",
            "unicorn/no-lonely-if": "off",
            "unicorn/no-process-exit": "off",
        },
    },
)
