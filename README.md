# oneHR Essential

> A streamlined HR platform focused on employee management, time and attendance, leave, and compensation and benefits.

## Overview

This repository is the reduced-scope `oneHR` application. It keeps only the modules that are currently in use:

- Employee Management
- Time & Attendance Management
- Leave Management
- Compensation & Benefits

The application is built with Next.js, TypeScript, and Firebase.

## Active Roles

The project currently supports these roles:

- `Employee`
- `Manager`
- `HR Manager`
- `Payroll Officer`

Feature access is role-based. Navigation and route access have been trimmed to match the active modules only.

## Active Feature Scope

### Employee Management

- Employee directory and profile management
- Dependents management
- Compensation access from employee records
- Core employee setup data through HR settings

### Time & Attendance Management

- Employee clock-in / clock-out flows
- Attendance review and adjustment workflows
- Overtime request flows
- Attendance logic, holidays, shift hours, shift types, and overtime configuration

### Leave Management

- Employee leave requests
- Manager leave visibility
- HR leave administration
- Leave types, accrual configuration, and eligible leave-day settings

### Compensation & Benefits

- Payroll
- Payment and deductions
- Employee loans
- Payroll configuration settings

## HR Settings Still In Use

Because the retained modules overlap, some HR settings remain part of the app even after cleanup. The main active settings areas are:

- Company setup
- Job management
- Department
- Section management
- Location management
- Marital status
- Attendance management settings
- Leave management settings
- Payroll configuration

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/ui

### Backend / Platform

- Firebase Authentication
- Firestore

## Scripts

The repository uses the following scripts:

```json
{
    "dev": "next dev -p 3011",
    "build": "pnpm run format && pnpm run lint:fix && pnpm run lint && next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "fix:all": "npm run lint:fix && npm run format",
    "type-check": "tsc --noEmit"
}
```

## Linting and Formatting

This project now uses:

- Flat ESLint config in [eslint.config.mjs](/abs/path/eslint.config.mjs)
- Custom `useState` generic enforcement in [eslint-plugin-explicit-usestate.js](/abs/path/eslint-plugin-explicit-usestate.js)
- Prettier for formatting

The lint setup enforces:

- Explicit generic types on `useState`
- No `any`
- No unused variables unless prefixed with `_`
- 4-space indentation
- Required semicolons

Reference guide:

- [eslint-typescript-enforcement-guideline.md](/abs/path/eslint-typescript-enforcement-guideline.md)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Firebase project configuration

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables in `.env`.

3. Start the development server:

```bash
pnpm dev
```

4. Open:

```text
http://localhost:3011
```

## Recommended Workflow

During development:

```bash
pnpm run fix:all
pnpm run type-check
pnpm run build
```

## Notes

- This repo has been intentionally reduced from the broader oneHR suite to the essential feature set listed above.
- Any removed modules or routes should be considered out of scope unless explicitly reintroduced.

## License

This project is proprietary software owned by oneHR. All rights reserved.
