# Realtime Update Implementation Guide

Status: `Draft for Review`

Purpose: this document is the canonical guide for implementing a stable realtime data layer that replaces Firebase `onSnapshot` semantics using MongoDB-backed infrastructure without re-architecting again later.

Goal:

- Open one app-level realtime connection after auth
- Subscribe/unsubscribe resources by route using `app-data-routes.ts`
- Receive initial snapshots and live deltas over the same connection
- Avoid browser connection limits from one-stream-per-resource approaches

Non-goals:

- Replacing all current query-based loading immediately
- Shipping every resource as live-updated in the first iteration
- Implementing a temporary stopgap that will be thrown away later

---

## Summary

The stable replacement for Firebase `onSnapshot` in this codebase should be:

1. One shared realtime connection per browser tab
2. Route-driven resource subscriptions over that one connection
3. Server-side fanout of resource updates
4. Initial snapshot + live deltas using the same protocol

Recommended transport:

- one multiplexed realtime stream (`EventSource` / SSE) per browser tab for read-only app data

Recommended data flow:

1. App bootstraps auth
2. App data provider opens one realtime stream after auth is ready
3. On route change, current route resources are resolved from `context/app-data-routes.ts`
4. Client reconnects the multiplexed stream with the current route resource bundle
5. Server sends `snapshot` messages for subscribed resources
6. Server sends `event` messages when broker or MongoDB changes occur
7. `AppDataProvider` merges snapshots/deltas into context state

Why this is the correct long-term design:

- avoids browser SSE connection limits
- preserves route awareness
- keeps the system scalable when multiple collections are involved
- matches Firebase mental model closely: "subscribe once, get initial data, then live changes"

---

## Current Problem

The previous implementation attempted to simulate `onSnapshot` using many per-resource browser streams.

Problems with that approach:

- browser per-origin connection limits
- route bundles with many resources stall before all streams hydrate
- repeated stream setup/teardown complexity
- difficult to reason about page loading vs live updates

The current query-based fallback is good for stability, but it removes live updates from the shared app data layer.

We want to keep:

- route-aware loading
- centralized app data state
- reliable navigation

We want to restore:

- live updates

---

## Proposed Architecture

### Client

Core pieces:

- `RealtimeProvider`
- `AppDataProvider`
- `app-data-routes.ts`

Responsibilities:

`AppDataProvider`

- owns one multiplexed realtime stream
- resolves route resources from `app-data-routes.ts`
- tracks which resources have delivered initial snapshots
- merges events into local state

`app-data-routes.ts`

- remains the source of truth for what each page needs

### Server

Core pieces:

- multiplexed realtime stream handler
- subscription broker
- change stream manager
- resource-specific snapshot loaders

Responsibilities:

Realtime stream handler:

- authenticates the request
- accepts the current route resource bundle
- routes stream events from the broker back to the client

Subscription broker:

- tracks connected clients and subscribed resources
- fanouts events only to matching subscribers

Change stream manager:

- listens to MongoDB change streams
- normalizes DB changes into app resource events

Snapshot loader:

- when a client subscribes to a resource, sends the current snapshot first

---

## Protocol

Use one protocol for both initial snapshots and future live deltas.

### Client -> Server

```ts
type SubscribeMessage = {
    type: "subscribe";
    resources: Array<{
        resource: string;
        filters?: {
            uid?: string;
        };
    }>;
};

type UnsubscribeMessage = {
    type: "unsubscribe";
    resources: Array<{
        resource: string;
        filters?: {
            uid?: string;
        };
    }>;
};

type PingMessage = {
    type: "ping";
    sentAt: string;
};

type ClientRealtimeMessage = SubscribeMessage | UnsubscribeMessage | PingMessage;
```

### Server -> Client

```ts
type SnapshotMessage = {
    type: "snapshot";
    resource: string;
    filters?: {
        uid?: string;
    };
    data: unknown[];
};

type EventMessage = {
    type: "event";
    resource: string;
    operation: "added" | "modified" | "removed";
    documentId: string;
    filters?: {
        uid?: string;
    };
    data?: unknown;
    receivedAt: string;
    sequence?: number;
    resumeToken?: string;
};

type AckMessage = {
    type: "ack";
    action: "subscribe" | "unsubscribe" | "reconnect";
    receivedAt: string;
};

type ErrorMessage = {
    type: "error";
    code: string;
    message: string;
    resource?: string;
    receivedAt: string;
};

type PongMessage = {
    type: "pong";
    receivedAt: string;
};

type ServerRealtimeMessage =
    | SnapshotMessage
    | EventMessage
    | AckMessage
    | ErrorMessage
    | PongMessage;
```

Important behavior:

- server must send `snapshot` first for newly subscribed resources
- future changes come as `event`
- operations follow the existing backend contract: `added`, `modified`, `removed`
- reconnect should reuse the same subscription targets and expect fresh `snapshot` messages

This gives true `onSnapshot` semantics.

---

## Data Update Strategy

### Initial snapshot

When a resource is subscribed:

- load current data
- send:

```ts
{
  type: "snapshot",
  resource: "employees",
  data: [...]
}
```

### Deltas

When MongoDB reports a change:

- normalize it
- send an event

```ts
{
  type: "event",
  resource: "employees",
  operation: "update",
  documentId: "123",
  data: { ...updatedDocument }
}
```

### Client-side merge rules

`snapshot`

- replace the resource array

`added`

- append if absent

`modified`

- replace matching item by id

`removed`

- remove matching item by id

Example helper:

```ts
function applyRealtimeEvent<T extends { id?: string }>(
    current: T[],
    operation: "added" | "modified" | "removed",
    documentId: string,
    data?: T,
): T[] {
    switch (operation) {
        case "added":
            return data ? [...current.filter(item => item.id !== documentId), data] : current;
        case "modified":
            return data ? current.map(item => (item.id === documentId ? data : item)) : current;
        case "removed":
            return current.filter(item => item.id !== documentId);
        default:
            return current;
    }
}
```

---

## File Plan

Goal:

- implement the stable architecture without scattering logic across too many new files

Preferred approach:

- extend existing app data and backend streaming modules first
- add only the files that clearly improve boundaries

Recommended minimal file set:

### Keep or update existing files

- `context/app-data-context.tsx`
- `context/app-data-routes.ts`
- `lib/backend/services/stream.service.ts`
- relevant auth/session helpers for socket auth

### Add only these files if needed

- `lib/realtime/protocol.ts`
    - shared message types
    - worth isolating because both client and server need it
- `context/realtime-context.tsx`
    - only if websocket ownership becomes too heavy inside `AppDataProvider`
- `app/api/realtime/route.ts` or the correct websocket entrypoint for the deployment/runtime
    - required because the transport endpoint must live somewhere

### Avoid creating unless the implementation becomes hard to reason about

- separate socket wrapper file
- separate route subscription helper file
- separate message normalizer file
- separate broker file
- separate change stream manager file

Note:

- if the server-side broker and change stream logic stay small, they should live inside `stream.service.ts`
- if `AppDataProvider` can own the route subscription diffing cleanly, do not split that into another helper file yet

---

## Task Breakdown

Every task below is intentionally capped at `4 hours max`.

### Task 1: Finalize Realtime Contract

Status: `COMPLETE`

Estimate:

- `2 to 3 hours`

Goal:

- lock the message protocol and resource subscription shape before implementation spreads

Work:

- [x] finalize websocket message types
- [x] finalize snapshot and delta semantics
- [x] finalize resource key and filter shape
- [x] finalize reconnect and resubscribe behavior
- [x] confirm which resources can start as snapshot + delta versus snapshot-only

Deliverables:

- stable protocol section in this document
- stable TypeScript types ready to implement
- shared protocol file created at `lib/realtime/protocol.ts`

Preferred files:

- `REALTIME-UPDATE-IMPLEMENTATION.md`
- `lib/realtime/protocol.ts`

### Task 2: Client Realtime Connection in Existing App Data Layer

Status: `COMPLETE`

Estimate:

- `3 to 4 hours`

Goal:

- open one multiplexed realtime stream after auth and keep it alive for the current route bundle

Work:

- [x] add realtime stream lifecycle to `context/app-data-context.tsx`
- [x] connect once per browser tab after auth is ready
- [x] add reconnect with backoff
- [x] reopen the multiplexed stream with the current route bundle after reconnect
- [x] keep a single browser realtime connection instead of per-resource streams

Deliverables:

- one stable socket connection
- no per-resource browser stream creation
- build verified after implementation

Preferred files:

- `context/app-data-context.tsx`
- optional `context/realtime-context.tsx`

### Task 3: Route Subscription Diffing

Status: `COMPLETE`

Estimate:

- `2 to 3 hours`

Goal:

- use `app-data-routes.ts` to subscribe only to the current route bundle over the existing socket

Work:

- [x] resolve current route resources
- [x] keep route bundles driven by `app-data-routes.ts`
- [x] reconnect the multiplexed stream with the next route bundle
- [x] preserve shared resources through the route bundle definitions

Deliverables:

- route-aware logical subscriptions over one socket

Preferred files:

- `context/app-data-context.tsx`
- `context/app-data-routes.ts`

### Task 4: Realtime Endpoint and Auth

Status: `COMPLETE`

Estimate:

- `3 to 4 hours`

Goal:

- establish a production-safe authenticated realtime entrypoint

Work:

- [x] create the multiplexed realtime endpoint in the correct runtime location
- [x] authenticate the stream request from the session
- [x] reject unauthorized resource access
- [x] parse and validate the requested resource bundle
- [x] return structured errors to the client

Deliverables:

- authenticated realtime transport working end to end

Preferred files:

- `app/api/realtime/route.ts` or runtime-appropriate entrypoint
- existing auth/session helpers

### Task 5: Subscription Broker + Snapshot Loader

Status: `COMPLETE`

Estimate:

- `3 to 4 hours`

Goal:

- on subscribe, register the socket and send the initial resource snapshot immediately

Work:

- [x] add in-memory subscription tracking
- [x] load snapshots using existing query/resource services
- [x] send one `snapshot` per subscribed resource
- [x] support cleanup when the stream closes

Deliverables:

- true initial snapshot behavior over the multiplexed stream

Preferred files:

- `lib/backend/services/stream.service.ts`
- only split out broker helpers if this file becomes unmanageable

### Task 6: App Data Snapshot Integration

Status: `COMPLETE`

Estimate:

- `2 to 4 hours`

Goal:

- make `AppDataProvider` consume websocket snapshots as the source of initial route hydration

Work:

- [x] replace route query hydration with realtime snapshot readiness tracking
- [x] mark resources hydrated as snapshots arrive
- [x] compute route loading from current route resources only
- [x] keep existing app data state shape intact

Deliverables:

- pages load from realtime snapshots without hanging

Preferred files:

- `context/app-data-context.tsx`

### Task 7: MongoDB Change Streams Integration

Status: `COMPLETE`

Estimate:

- `3 to 4 hours`

Goal:

- translate MongoDB collection changes into app resource events

Work:

- [x] attach change streams for the initial Mongo-backed live resources
- [x] map collection names to app resource names
- [x] normalize DB events to protocol events
- [x] log watcher startup failures safely

Deliverables:

- backend emits resource change events after broker publishes and Mongo change streams

Preferred files:

- `lib/backend/services/stream.service.ts`
- add a dedicated helper only if collection mapping becomes too large

### Task 8: Client Delta Merge Logic

Status: `COMPLETE`

Estimate:

- `2 to 3 hours`

Goal:

- apply live events into app data without forcing a full page reload

Work:

- [x] implement snapshot replace behavior
- [x] implement added/modified/removed merging
- [x] keep resource merges isolated by resource key
- [x] ensure loading does not regress during live updates

Deliverables:

- live UI updates after writes

Preferred files:

- `context/app-data-context.tsx`

### Task 9: Verification and Hardening

Status: `IN PROGRESS`

Estimate:

- `2 to 4 hours`

Goal:

- validate the behavior under navigation, reconnect, and write activity

Work:

- [x] verify one browser realtime connection replaces per-resource streams in code
- [x] verify the updated code passes the repo build flow up to the existing Turbopack timeout/warning stage
- [ ] verify route transitions do not hang in the browser
- [ ] verify snapshots arrive for dashboard and leave management in the browser
- [ ] verify live updates after writes in the browser
- [ ] remove temporary debugging noise
- [x] document rollout caveats

Deliverables:

- stable first production-ready iteration

Preferred files:

- existing touched files only
- `REALTIME-UPDATE-IMPLEMENTATION.md` for final notes

---

## Checklist

Use this section as the working tracker.

### Implementation Tasks

- [x] `COMPLETE` Task 1: Finalize realtime contract
- [x] `COMPLETE` Task 2: Client realtime connection in existing app data layer
- [x] `COMPLETE` Task 3: Route subscription diffing
- [x] `COMPLETE` Task 4: Realtime endpoint and auth
- [x] `COMPLETE` Task 5: Subscription broker and snapshot loader
- [x] `COMPLETE` Task 6: App data snapshot integration
- [x] `COMPLETE` Task 7: MongoDB change streams integration
- [x] `COMPLETE` Task 8: Client delta merge logic
- [ ] `IN PROGRESS` Task 9: Verification and hardening

### Constraints

- [x] `COMPLETE` Keep one realtime connection per browser tab
- [x] `COMPLETE` Do not reintroduce one-stream-per-resource browser behavior
- [x] `COMPLETE` Prefer editing existing files before creating new ones
- [x] `COMPLETE` Keep each implementation task within `4 hours max`
- [x] `COMPLETE` Keep route-aware subscriptions driven by `app-data-routes.ts`

---

## Suggested Implementation Order

Implement in this order:

1. Protocol types
2. Client socket connection in existing app data layer
3. Route subscription diff logic
4. Websocket endpoint
5. Subscription broker
6. Snapshot responses
7. AppData snapshot integration
8. Change streams
9. Delta merge logic
10. Verification and hardening

Reason:

- lets us verify the transport and subscription model before DB change streams are added
- keeps failure scope small

---

## Recommended Route Subscription Behavior

Subscription changes should be diffed.

Pseudo-code:

```ts
const previous = new Set(previousResources.map(keyOfSubscription));
const next = new Set(nextResources.map(keyOfSubscription));

const toSubscribe = [...next].filter(key => !previous.has(key));
const toUnsubscribe = [...previous].filter(key => !next.has(key));
```

Important:

- do not disconnect the socket on every route change
- only adjust logical subscriptions

---

## Loading Behavior

Page loading should mean:

- waiting for initial snapshots of the current route resources

Page loading should not mean:

- websocket connected but unrelated resources still pending
- background updates in progress

Recommended tracking:

```ts
type SnapshotStatus = Record<string, "pending" | "ready" | "error">;
```

Then:

```ts
const loading = routeResources.some(resource => snapshotStatus[resource] !== "ready");
```

This is much more precise than global counters tied to unstable connection behavior.

---

## MongoDB Change Streams Notes

Requirements:

- MongoDB replica set or Atlas cluster

Watch strategy:

- either one change stream per collection
- or one broader watcher with collection routing

Recommended first pass:

- watch only the collections used in route bundles that actually need live updates

Example:

```ts
const changeStream = collection.watch([], { fullDocument: "updateLookup" });

changeStream.on("change", change => {
    // map change.ns.coll to app resource
    // normalize event
    // publish to socket broker
});
```

---

## Resource Mapping Guidance

Mongo collection names may not match app resource names directly.

Maintain one canonical mapping file, for example:

```ts
const collectionToResource = {
    employee: "employees",
    attendance: "attendances",
    overtimeRequest: "overtimeRequests",
    employeeLoan: "employeeLoans",
};
```

This keeps the change stream layer clean and consistent.

---

## Snapshot Loader Guidance

Do not duplicate snapshot logic in multiple places.

Reuse existing resource query services wherever possible:

- `queryCompactResource`
- existing auth/authorization rules

Recommended shape:

```ts
async function loadSnapshotForSubscription(subscription: ResourceSubscription) {
    return queryCompactResource({
        resource: subscription.resource,
        instanceKey,
        session,
        filters: subscription.filters,
    });
}
```

---

## Security Requirements

Every subscription must be authorized.

Server must validate:

- authenticated session
- resource access
- owner-scoped filters like `uid`

Do not trust the client’s requested filters directly.

Always run authorization before:

- sending initial snapshot
- sending future events

---

## Failure Handling

### Client

- reconnect socket with backoff
- resubscribe after reconnect
- mark route resources as pending until fresh snapshots arrive

### Server

- if change stream drops, restart it
- if a resource snapshot fails, send an error message for that resource

### UX

- route should still render partial data when appropriate
- errors should be scoped to affected resources

---

## Minimal First Realtime Resource Set

If full implementation must be staged, start live updates with:

- `notifications`
- `employees`
- `leaveManagements`
- `attendances`
- `overtimeRequests`
- `requestModifications`

These are the resources most likely to matter for interactive pages.

Static settings resources can remain snapshot-only initially if needed, while still using the same transport and architecture.

That means the architecture stays stable even if rollout is phased.

---

## Example Client Provider Skeleton

```tsx
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const { user, authLoading } = useAuth();
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (authLoading || !user) return;

        const ws = new WebSocket(buildRealtimeUrl());
        setSocket(ws);

        return () => {
            ws.close();
            setSocket(null);
        };
    }, [authLoading, user?.uid]);

    return <RealtimeContext.Provider value={{ socket }}>{children}</RealtimeContext.Provider>;
}
```

---

## Example Route Subscription Hook

```tsx
function useRouteRealtimeSubscriptions() {
    const pathname = usePathname();
    const resources = useMemo(() => getResourcesForPath(pathname), [pathname]);
    const { subscribe, unsubscribe } = useRealtime();

    const previousRef = useRef<string[]>([]);

    useEffect(() => {
        const previous = new Set(previousRef.current);
        const next = new Set(resources);

        const toSubscribe = resources.filter(item => !previous.has(item));
        const toUnsubscribe = previousRef.current.filter(item => !next.has(item));

        if (toSubscribe.length) subscribe(toSubscribe);
        if (toUnsubscribe.length) unsubscribe(toUnsubscribe);

        previousRef.current = resources;
    }, [resources, subscribe, unsubscribe]);
}
```

---

## Example Snapshot + Event Handling in App Data

```ts
function handleRealtimeMessage(message: ServerRealtimeMessage) {
    if (message.type === "snapshot") {
        setData(prev => ({
            ...prev,
            [message.resource]: message.data,
        }));
        markSnapshotReady(message.resource);
        return;
    }

    if (message.type === "event") {
        setData(prev => ({
            ...prev,
            [message.resource]: applyRealtimeEvent(
                prev[message.resource],
                message.operation,
                message.documentId,
                message.data,
            ),
        }));
    }
}
```

---

## Acceptance Criteria

The implementation is complete when:

- one websocket connection is used per browser tab
- route changes do not create extra browser realtime connections
- each subscribed resource gets one initial snapshot
- live updates arrive without navigation
- dashboard and leave-management both load without hanging
- app no longer depends on multiple parallel browser SSE connections

---

## Open Questions For Confirmation

Please confirm these before implementation starts:

1. Transport:
   Preferred option is `WebSocket`. Confirm this is acceptable.

2. Runtime:
   Confirm whether production hosting supports long-lived websocket connections cleanly.

3. MongoDB:
   Confirm target MongoDB setup supports Change Streams.

4. Rollout:
   Confirm whether all route resources must become live immediately, or whether static settings can remain snapshot-first while still using the same architecture.

5. Event model:
   Confirm whether resource-level full snapshot replacement is acceptable for some resources initially, or whether every resource must use true granular deltas from day one.

---

## Revision Log

- `v0.1`: Initial implementation guide drafted for review
