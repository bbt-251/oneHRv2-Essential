#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";

const envFiles = [".env", ".env.local", ".env.production", ".env.staging"];
const firebaseEnvPattern = /(NEXT_PUBLIC_FIREBASE|FIREBASE_ADMIN|GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_CONFIG)/;

let found = [];

for (const file of envFiles) {
  if (!existsSync(file)) continue;

  const content = readFileSync(file, "utf8");
  for (const [index, line] of content.split("\n").entries()) {
    if (firebaseEnvPattern.test(line)) {
      found.push(`${file}:${index + 1}:${line}`);
    }
  }
}

if (found.length) {
  console.error("Firebase-related env vars detected:");
  for (const line of found) {
    console.error(`- ${line}`);
  }
  process.exit(1);
}

console.log("No Firebase-specific env vars found in local env files.");
