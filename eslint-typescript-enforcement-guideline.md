# ESLint + TypeScript Enforcement Guide

This guide documents the complete ESLint and TypeScript configuration setup for enforcing consistent code quality rules across your projects.

## Overview

This configuration enforces:

- **Type Safety**: Explicit `useState` generic types required
- **Code Formatting**: 4-space indentation, semicolons required, no tabs
- **Unused Code Prevention**: No unused variables or imports
- **Type Safety Rules**: No `any` type allowed

---

## 1. Dependencies Required

Add these to your `package.json`:

```json
{
    "devDependencies": {
        "@typescript-eslint/eslint-plugin": "^8.0.0",
        "@typescript-eslint/parser": "^8.0.0",
        "eslint": "^9.0.0",
        "eslint-config-next": "^14.0.0",
        "typescript": "^5.0.0"
    }
}
```

Install with:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-next typescript
# or
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-next typescript
```

---

## 2. ESLint Configuration (`eslint.config.mjs`)

Create this file in your project root:

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import path from "path";
import { createRequire } from "module";

export default defineConfig([
    // Next.js rules
    ...nextVitals,

    // Ignore folders
    globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"]),

    // Project rules
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            // Load our custom plugin dynamically
            "explicit-usestate": createRequire(import.meta.url)(
                path.resolve("./eslint-plugin-explicit-usestate.js"),
            ),
        },
        rules: {
            // Formatting
            indent: ["error", 4, { SwitchCase: 1 }],
            "max-lines": [
                "error",
                {
                    max: 800,
                    skipBlankLines: true,
                    skipComments: true,
                },
            ],
            semi: ["error", "always"],
            "no-tabs": "error",

            // Type safety
            "@typescript-eslint/no-explicit-any": "error",

            // Unused imports / vars
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "explicit-usestate/explicit-usestate-type": "error",
        },
    },
]);
```

---

## 3. Custom ESLint Plugin (`eslint-plugin-explicit-usestate.js`)

Create this file in your project root. This plugin enforces explicit generic types on all `useState` calls.

```javascript
// eslint-plugin-explicit-usestate.js
module.exports.rules = {
    "explicit-usestate-type": {
        meta: {
            type: "problem",
            docs: {
                description: "Require explicit generic type on React useState",
            },
            schema: [],
            messages: {
                missing: "useState must have an explicit generic type",
            },
        },
        create(context) {
            return {
                CallExpression(node) {
                    // Check for useState
                    if (node.callee.type === "Identifier" && node.callee.name === "useState") {
                        // Get the source code for this node
                        const sourceCode = context.getSourceCode();
                        const nodeText = sourceCode.getText(node);

                        // Check if the useState call contains generic type syntax (<...>)
                        // Use case-insensitive regex and be more flexible with whitespace
                        const hasGenericType = /\busestate\s*<[^>]+>/.test(nodeText.toLowerCase());

                        // If no generic type found, report error
                        if (!hasGenericType) {
                            context.report({ node, messageId: "missing" });
                        }
                    }
                },
            };
        },
    },
};
```

---

## 4. TypeScript Configuration (`tsconfig.json`)

Ensure your `tsconfig.json` has these settings:

```json
{
    "compilerOptions": {
        "target": "es5",
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [
            {
                "name": "next"
            }
        ],
        "paths": {
            "@/*": ["./*"]
        }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

---

## 5. Rule Explanations

### Formatting Rules

| Rule        | Setting                           | Description                                           |
| ----------- | --------------------------------- | ----------------------------------------------------- |
| `indent`    | `["error", 4, { SwitchCase: 1 }]` | Enforces 4-space indentation, case 1 for switch cases |
| `semi`      | `["error", "always"]`             | Requires semicolons at end of statements              |
| `no-tabs`   | `"error"`                         | Disallows tab characters                              |
| `max-lines` | `["error", { max: 800 }]`         | Limits files to 800 lines                             |

### Type Safety Rules

| Rule                                 | Setting                                  | Description                                    |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| `@typescript-eslint/no-explicit-any` | `"error"`                                | Disallows use of `any` type                    |
| `@typescript-eslint/no-unused-vars`  | `["error", { argsIgnorePattern: "^_" }]` | Disallows unused variables (allows `_` prefix) |

### Custom Rules

| Rule                                       | Description                                             |
| ------------------------------------------ | ------------------------------------------------------- |
| `explicit-usestate/explicit-usestate-type` | Requires explicit generic types on all `useState` calls |

---

## 6. Correct vs Incorrect Code Examples

### ✅ Correct: useState with Explicit Types

```typescript
import { useState } from "react";

// Primitive types
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>("");
const [isActive, setIsActive] = useState<boolean>(false);

// Complex types
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// Union types
const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

// Generic interfaces
interface FormData {
    name: string;
    email: string;
}
const [formData, setFormData] = useState<FormData>({ name: "", email: "" });
```

### ❌ Incorrect: useState Without Explicit Types

```typescript
import { useState } from "react";

// These will cause ESLint errors:
const [count, setCount] = useState(0); // ❌ Missing generic type
const [name, setName] = useState(""); // ❌ Missing generic type
const [isActive, setIsActive] = useState(false); // ❌ Missing generic type
const [user, setUser] = useState(null); // ❌ Missing generic type
```

---

## 7. Usage

### Run ESLint on All Files

```bash
# Using npx
npx eslint .

# Using pnpm
pnpm exec eslint .

# Using npm
npm run lint  # (add to package.json scripts)
```

### Add to package.json scripts

```json
{
    "scripts": {
        "lint": "eslint .",
        "lint:fix": "eslint . --fix"
    }
}
```

### VSCode Integration (Recommended)

Add this to `.vscode/settings.json` for automatic formatting on save:

```json
{
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "eslint.useFlatConfig": true,
    "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

---

## 8. Common Fixes

### Fixing useState Errors

**Before:**

```typescript
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);
const [data, setData] = useState(null);
```

**After:**

```typescript
const [isOpen, setIsOpen] = useState<boolean>(false);
const [count, setCount] = useState<number>(0);
const [data, setData] = useState<Data | null>(null);
```

### Fixing Unused Variables

**Before:**

```typescript
const [value, setValue] = useState<string>("");
// setValue is never used
```

**After:**

```typescript
const [value, _setValue] = useState<string>("");
// Use _ prefix for intentionally unused variables
```

Or use the variable:

```typescript
const [value, setValue] = useState<string>("");
setValue("new value"); // Now using setValue
```

---

## 9. Project Structure

Your project should have these files:

```
project-root/
├── eslint.config.mjs              # Main ESLint configuration
├── eslint-plugin-explicit-usestate.js  # Custom plugin
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
└── app/
    └── ...
```

---

## 10. Troubleshooting

### "require is not defined" Error

**Problem**: ES module scope doesn't have `require`

**Solution**: Use the configuration shown in section 2 with `createRequire`:

```javascript
import { createRequire } from "module";
// ...
"explicit-usestate": createRequire(import.meta.url)(path.resolve("./eslint-plugin-explicit-usestate.js"))
```

### ESLint Not Detecting Generic Types

**Problem**: Plugin reports errors even with generic types

**Solution**: Ensure the plugin regex matches. The plugin uses:

```javascript
const hasGenericType = /\busestate\s*<[^>]+>/.test(nodeText.toLowerCase());
```

### PowerShell Not Recognized

**Problem**: `pwsh` not found when running with `pnpm exec`

**Solution**: Use `npx` directly:

```bash
npx eslint .
```

---

## 11. Summary

This setup provides:

1. **Type Safety**: Every `useState` must have explicit types
2. **Code Quality**: Consistent formatting (4 spaces, semicolons)
3. **No Dead Code**: No unused variables
4. **Best Practices**: No `any` type, proper TypeScript usage

Run `npx eslint .` to verify your code passes all rules.

---

## Quick Copy-Paste Commands

```bash
# Install dependencies
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-next typescript

# Create configuration files
touch eslint.config.mjs eslint-plugin-explicit-usestate.js

# Run linting
npx eslint .
```
