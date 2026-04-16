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
