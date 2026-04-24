import randomUUID from "@/lib/util/randomUUID";

export default function ensureRandomUUID(): void {
    if (typeof globalThis === "undefined") {
        return;
    }

    const cryptoObject = globalThis.crypto;
    if (!cryptoObject || typeof cryptoObject.randomUUID === "function") {
        return;
    }

    Object.defineProperty(cryptoObject, "randomUUID", {
        configurable: true,
        writable: true,
        value: () => randomUUID({ useNative: false }),
    });
}
