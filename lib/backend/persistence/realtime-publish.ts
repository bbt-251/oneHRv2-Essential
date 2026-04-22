import { getCurrentInstanceKey } from "@/lib/backend/config";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";

const broker = getManualRealtimeBroker();

export const publishRealtimeResource = async ({
    resource,
    resourceId,
    payload,
    resourceOwnerUid,
    instanceKey = getCurrentInstanceKey(),
}: {
    resource: string;
    resourceId: string;
    payload: unknown[];
    resourceOwnerUid?: string;
    instanceKey?: string;
}): Promise<void> => {
    broker.publish({
        operation: "modified",
        instanceKey,
        resource,
        resourceId,
        payload: { [resource]: payload },
        resourceOwnerUid,
    });
};
