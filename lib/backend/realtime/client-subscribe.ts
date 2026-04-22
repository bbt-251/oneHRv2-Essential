import { RealtimeEventContract } from "@/lib/backend/realtime/types";

interface SubscribeInput {
    endpoint: string;
    params: Record<string, string | undefined>;
    resumeToken?: string;
    onEvent: (event: RealtimeEventContract) => void;
    onOpen?: () => void;
    onError?: (error: Event) => void;
}

export interface ClientSubscription {
    close: () => void;
}

const parseEventMessage = (data: string): RealtimeEventContract | null => {
    const parsed = JSON.parse(data) as { event?: RealtimeEventContract } | Record<string, unknown>;

    if ("event" in parsed && parsed.event) {
        return parsed.event;
    }

    const [resource, payload] = Object.entries(parsed)[0] ?? [];
    if (!resource) {
        return null;
    }

    return {
        eventId: `snapshot-${resource}`,
        operation: "modified",
        instanceKey: "",
        resource,
        resourceId: "snapshot",
        sequence: 0,
        occurredAt: new Date().toISOString(),
        payload: {
            [resource]: Array.isArray(payload) ? payload : [],
        },
        resumeToken: "",
    };
};

export const subscribeManualRealtime = ({
    endpoint,
    params,
    resumeToken,
    onEvent,
    onOpen,
    onError,
}: SubscribeInput): ClientSubscription => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            search.set(key, value);
        }
    });

    if (resumeToken) {
        search.set("resumeToken", resumeToken);
    }

    const eventSource = new EventSource(`${endpoint}?${search.toString()}`, {
        withCredentials: true,
    });

    eventSource.addEventListener("open", () => {
        onOpen?.();
    });

    const handleMessage = (message: MessageEvent<string>) => {
        const event = parseEventMessage(message.data);
        if (event) {
            onEvent(event);
        }
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("snapshot", handleMessage);
    eventSource.addEventListener("replay", handleMessage);
    eventSource.addEventListener("added", handleMessage);
    eventSource.addEventListener("modified", handleMessage);
    eventSource.addEventListener("removed", handleMessage);

    eventSource.addEventListener("error", event => {
        onError?.(event);
    });

    return {
        close: () => {
            eventSource.close();
        },
    };
};
