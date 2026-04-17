import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { createRealtimeEvent, parseResumeToken } from "@/lib/backend/manual/realtime/event-contract";
import { MemoryChangeStreamSource, ManualChangeStreamListenerService } from "@/lib/backend/manual/realtime/change-stream";
import { ManualRealtimeBroker } from "@/lib/backend/manual/realtime/subscription-broker";
import { ManualSessionClaims } from "@/lib/backend/manual/types";

const hrSession: ManualSessionClaims = {
  uid: "manual-admin",
  email: "manual.admin@onehr.local",
  roles: ["HR Manager"],
  tenantId: "default",
};

const employeeSession: ManualSessionClaims = {
  uid: "employee-1",
  email: "employee-1@onehr.local",
  roles: ["Employee"],
  tenantId: "default",
};

const run = async (): Promise<void> => {
  const seedEvent = createRealtimeEvent({
    sequence: 12,
    operation: "modified",
    tenantId: "default",
    resource: "employee",
    resourceId: "employee-1",
    payload: { fullName: "One HR" },
    resourceOwnerUid: "employee-1",
  });

  assert.equal(parseResumeToken(seedEvent.resumeToken), 12, "Expected resume token to decode sequence");

  const broker = new ManualRealtimeBroker({ throttleMs: 10 });

  const hrEvents: string[] = [];
  const employeeEvents: string[] = [];

  const hrSubscription = broker.subscribe(
    {
      session: hrSession,
      tenantId: "default",
      resource: "employee",
      action: "read",
    },
    ({ event }) => {
      hrEvents.push(event.resourceId);
    },
  );

  const employeeSubscription = broker.subscribe(
    {
      session: employeeSession,
      tenantId: "default",
      resource: "employee",
      action: "read",
    },
    ({ event }) => {
      employeeEvents.push(event.resourceId);
    },
  );

  const publishedA = broker.publish({
    operation: "modified",
    tenantId: "default",
    resource: "employee",
    resourceId: "employee-1",
    resourceOwnerUid: "employee-1",
    payload: { salary: 1000 },
  });

  broker.publish({
    operation: "modified",
    tenantId: "default",
    resource: "employee",
    resourceId: "employee-2",
    resourceOwnerUid: "employee-2",
    payload: { salary: 2000 },
  });

  broker.publish({
    operation: "modified",
    tenantId: "tenant-b",
    resource: "employee",
    resourceId: "employee-3",
    resourceOwnerUid: "employee-3",
    payload: { salary: 3000 },
  });

  await sleep(30);

  assert.deepEqual(hrEvents, ["employee-1", "employee-2"], "Expected HR to receive tenant-scoped employee events");
  assert.deepEqual(employeeEvents, ["employee-1"], "Expected employee role to only receive own resource events");

  const resumedEvents: string[] = [];
  const resumedSubscription = broker.subscribe(
    {
      session: hrSession,
      tenantId: "default",
      resource: "employee",
      action: "read",
      resumeToken: publishedA.resumeToken,
    },
    ({ event }) => {
      resumedEvents.push(event.resourceId);
    },
    (replay) => {
      replay.forEach((event) => resumedEvents.push(`replay:${event.resourceId}`));
    },
  );

  assert.deepEqual(resumedEvents, ["replay:employee-2"], "Expected replay to include events after resume token");

  const source = new MemoryChangeStreamSource();
  const service = new ManualChangeStreamListenerService(source, broker);
  await service.start();

  source.emit({
    operation: "added",
    tenantId: "default",
    resource: "employee",
    resourceId: "employee-4",
    resourceOwnerUid: "employee-4",
    payload: { fullName: "New hire" },
  });

  await sleep(30);

  assert.ok(hrEvents.includes("employee-4"), "Expected change-stream emitted event to arrive in broker subscribers");

  await service.stop();
  resumedSubscription.unsubscribe();
  employeeSubscription.unsubscribe();
  hrSubscription.unsubscribe();
  broker.stop();

  console.log("Manual backend Phase 4 realtime checks passed.");
};

run();
