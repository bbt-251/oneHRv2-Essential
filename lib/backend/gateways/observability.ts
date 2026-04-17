interface GatewayMismatchEvent {
  module: string;
  expectedSource: string;
  fallbackSource?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export const logGatewayMismatch = ({
    module,
    expectedSource,
    fallbackSource,
    reason,
    metadata,
}: GatewayMismatchEvent): void => {
    console.warn("[gateway-mismatch]", {
        module,
        expectedSource,
        fallbackSource,
        reason,
        metadata,
        occurredAt: new Date().toISOString(),
    });
};
