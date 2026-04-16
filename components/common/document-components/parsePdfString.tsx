import React, { ReactElement } from "react";
import { Text } from "@react-pdf/renderer";

function tokenizeText(str: string) {
    const tokens = [];
    let buffer = "";
    let inTag = false;

    for (let i = 0; i < str.length; i++) {
        if (str[i] === "<") {
            if (buffer !== "") {
                tokens.push(buffer);
            }
            buffer = "<";
            inTag = true;
        } else if (str[i] === ">") {
            buffer += ">";
            tokens.push(buffer);
            buffer = "";
            inTag = false;
        } else {
            buffer += str[i];
            if (!inTag && (str[i] === " " || str[i] === ",")) {
                tokens.push(buffer);
                buffer = "";
            }
        }
    }

    if (buffer !== "") {
        tokens.push(buffer.trim());
    }

    return tokens;
}

function isJSONParsable(str: any) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

const parsePdfString = (pdfString: string) => {
    const reOpening: RegExp = /<Text/;
    const reContent: RegExp = /^(?!.*(?:<Text>|<\/Text>)).*$/;
    const reClosing: RegExp = /<\/Text>/;

    const reGetStyle = /style=\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/;

    const tokens = tokenizeText(pdfString);

    const stack: (string | ReactElement)[] = [];

    tokens.map((token: string) => {
        if (token) {
            if (reOpening.test(token) || reContent.test(token)) {
                stack.push(token);
            } else if (reClosing.test(token)) {
                let temp: string | ReactElement = "";
                let preBuild: (string | ReactElement)[] = [];

                while (stack.length && (!(typeof temp == "string") || !reOpening.test(temp))) {
                    temp = stack.pop() ?? "";
                    if (!(typeof temp == "string") || !reOpening.test(temp))
                        preBuild = [temp, ...preBuild];
                }

                const match = typeof temp == "string" ? reGetStyle.exec(temp) : [];

                if (match && match.length > 1) {
                    const styleAttributeValue = isJSONParsable(match[1])
                        ? JSON.parse(match[1])
                        : {};
                    const parsedTag: ReactElement = React.cloneElement(
                        <Text key={crypto.randomUUID()} style={styleAttributeValue}>
                            {...preBuild}
                        </Text>,
                    );

                    stack.push(parsedTag);
                } else {
                    const parsedTag: ReactElement = React.cloneElement(
                        <Text key={crypto.randomUUID()}>{...preBuild}</Text>,
                    );
                    stack.push(parsedTag);
                }
            }
        }
    });

    return stack;
};

export default parsePdfString;
