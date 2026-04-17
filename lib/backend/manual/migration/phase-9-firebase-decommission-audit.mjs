#!/usr/bin/env node

import { execSync } from "node:child_process";

const run = (command) => {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const stdout = error?.stdout?.toString?.() ?? "";
    return stdout.trim();
  }
};

const sections = [
  {
    id: "firebase-sdk-imports",
    title: "Direct Firebase SDK imports (runtime migration scope)",
    command:
      [
        "rg -n \"from ['\\\"]firebase/(app|auth|firestore|storage|functions|messaging|analytics)|from ['\\\"]firebase-admin\"",
        "app/api/manual lib/backend/manual lib/backend/gateways context hooks",
        "--glob '!node_modules/**'",
        "--glob '!pnpm-lock.yaml'",
        "--glob '!lib/backend/firebase/**'",
        "--glob '!lib/backend/gateways/firebase/**'",
        "--glob '!hooks/**'",
        "--glob '!context/firestore-context.tsx'",
        "--glob '!lib/backend/manual/migration/phase-9-*.mjs'",
      ].join(" "),
  },
  {
    id: "firebase-wrapper-imports",
    title: "Internal Firebase wrapper imports (runtime migration scope)",
    command:
      [
        "rg -n \"@/lib/backend/firebase|\\.\\./firebase/|\\.\\./\\.\\./firebase/\"",
        "app/api/manual lib/backend/manual lib/backend/gateways context hooks",
        "--glob '!node_modules/**'",
        "--glob '!pnpm-lock.yaml'",
        "--glob '!lib/backend/firebase/**'",
        "--glob '!lib/backend/gateways/firebase/**'",
        "--glob '!hooks/**'",
        "--glob '!context/firestore-context.tsx'",
        "--glob '!lib/backend/manual/migration/phase-9-*.mjs'",
      ].join(" "),
  },
  {
    id: "firebase-env-vars",
    title: "Firebase environment variable references (runtime migration scope)",
    command:
      [
        "rg -n \"NEXT_PUBLIC_FIREBASE|FIREBASE_ADMIN|GOOGLE_APPLICATION_CREDENTIALS\"",
        "app/api/manual lib/backend/manual docs/operations package.json",
        "--glob '!node_modules/**'",
        "--glob '!pnpm-lock.yaml'",
        "--glob '!lib/backend/manual/migration/phase-9-*.mjs'",
      ].join(" "),
  },
];

const strict = process.argv.includes("--strict");

let totalMatches = 0;

console.log("# Phase 9 Firebase Decommission Audit\n");
console.log(`Mode: ${strict ? "strict (non-zero exit when matches exist)" : "report-only"}\n`);

for (const section of sections) {
  const output = run(section.command);
  const lines = output ? output.split("\n").filter(Boolean) : [];
  totalMatches += lines.length;

  console.log(`## ${section.title}`);
  console.log(`Matches: ${lines.length}`);

  if (lines.length) {
    for (const line of lines.slice(0, 25)) {
      console.log(`- ${line}`);
    }

    if (lines.length > 25) {
      console.log(`- ... (${lines.length - 25} more)`);
    }
  } else {
    console.log("- none");
  }

  console.log("");
}

if (strict && totalMatches > 0) {
  console.error(`Audit failed: ${totalMatches} Firebase references remain.`);
  process.exit(1);
}

console.log(`Audit complete. Total matches: ${totalMatches}.`);
