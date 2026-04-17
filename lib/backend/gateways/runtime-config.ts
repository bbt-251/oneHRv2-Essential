const DEV_API_BASE_URL = "http://localhost:3011";

export const getApiBaseUrl = (): string => {
    const explicitUrl = process.env.NEXT_PUBLIC_MANUAL_API_BASE_URL?.trim();
    if (explicitUrl) {
        return explicitUrl.replace(/\/$/, "");
    }

    const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();

    if (appEnv === "production") {
        return "https://api.onehr.ai";
    }

    if (appEnv === "staging") {
        return "https://staging-api.onehr.ai";
    }

    if (appEnv === "integration") {
        return "https://int-api.onehr.ai";
    }

    return DEV_API_BASE_URL;
};

export const resolveTenantId = (): string => {
    const envTenant = process.env.NEXT_PUBLIC_TENANT_ID?.trim();
    if (envTenant) {
        return envTenant;
    }

    if (typeof window === "undefined") {
        return "default";
    }

    const { hostname } = window.location;
    if (
        !hostname ||
    hostname === "localhost" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
        return "default";
    }

    const [subdomain] = hostname.split(".");
    if (!subdomain || ["www", "app"].includes(subdomain)) {
        return "default";
    }

    return subdomain;
};

export const buildManualApiUrl = (path: string): string => {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${getApiBaseUrl()}${normalizedPath}`;
};
