import { DataGateway } from "@/lib/backend/gateways/types";
import { EmployeeModel } from "@/lib/models/employee";
import {
    buildManualApiUrl,
    resolveTenantId,
} from "@/lib/backend/gateways/runtime-config";

interface EmployeeEventPayload {
  employees: EmployeeModel[];
}

export const createManualDataGateway = (): DataGateway => ({
    subscribeEmployeeByUid: (uid, callback, onError) => {
        const tenantId = resolveTenantId();
        const url = buildManualApiUrl(
            `/api/manual/realtime/employee?uid=${encodeURIComponent(uid)}&tenantId=${encodeURIComponent(tenantId)}`,
        );
        const eventSource = new EventSource(url, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as EmployeeEventPayload;
                callback(payload.employees, false);
            } catch (error) {
                onError?.(error as Error);
            }
        };

        eventSource.onerror = () => {
            onError?.(new Error("Employee realtime subscription disconnected"));
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    },
});
