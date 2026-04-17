export type GatewaySource = "firebase" | "manual";
export type GatewayMode = GatewaySource | "auto";

export interface GatewaySourceConfig {
  auth: GatewayMode;
  employeeData: GatewayMode;
  storage: GatewayMode;
}

const readGatewayMode = (
    value: string | undefined,
    fallback: GatewayMode,
): GatewayMode => {
    if (value === "firebase" || value === "manual" || value === "auto") {
        return value;
    }

    return fallback;
};

export const getGatewaySourceConfig = (): GatewaySourceConfig => ({
    auth: readGatewayMode(process.env.NEXT_PUBLIC_AUTH_SOURCE, "manual"),
    employeeData: readGatewayMode(
        process.env.NEXT_PUBLIC_EMPLOYEE_SOURCE,
        "manual",
    ),
    storage: readGatewayMode(process.env.NEXT_PUBLIC_STORAGE_SOURCE, "firebase"),
});
