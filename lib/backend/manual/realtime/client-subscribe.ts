import { RealtimeEventContract } from "@/lib/backend/manual/realtime/types";

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

  eventSource.addEventListener("message", (message) => {
    const parsed = JSON.parse(message.data) as { event?: RealtimeEventContract };
    if (parsed.event) {
      onEvent(parsed.event);
    }
  });

  eventSource.addEventListener("error", (event) => {
    onError?.(event);
  });

  return {
    close: () => {
      eventSource.close();
    },
  };
};
