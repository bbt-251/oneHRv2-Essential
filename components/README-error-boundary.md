# Error Boundary Implementation

This project includes a comprehensive error boundary system that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

## Components

### 1. ClassErrorBoundary (`components/class-error-boundary.tsx`)

- Class-based error boundary component
- Catches errors using `componentDidCatch` lifecycle method
- Automatically reports errors to Discord webhook (except on localhost)
- Provides user-friendly error page with action buttons

### 2. ErrorBoundary (`components/error-boundary.tsx`)

- Functional component using hooks
- Catches global errors and unhandled promise rejections
- Integrates with toast notifications
- More modern approach but may not catch all React errors

### 3. TestError (`components/test-error.tsx`)

- Test component to verify error boundary functionality
- Includes a button to trigger a test error

## Features

### Error Reporting

- Automatically sends error details to Discord webhook
- Includes timestamp, environment, pathname, and component stack
- Only reports errors in production (excludes localhost)
- Uses the existing `getTimestamp` utility from `lib/util/dayjs_format.ts`

### User Experience

- Clean, modern error page design
- Non-threatening error message
- Action buttons for "Try Again" and "Go Home"
- Automatic redirect to home page after 5 seconds
- Toast notifications when errors are reported

### Integration

- Uses existing toast system for notifications
- Follows project's design system with shadcn/ui components
- Integrates with existing theme system
- Uses Lucide React icons for consistency

## Usage

The error boundary is automatically integrated into the app via `context/client-providers.tsx`. It wraps all child components and will catch any JavaScript errors that occur.

### Testing the Error Boundary

1. Import the test component:

```tsx
import { TestError } from "@/components/test-error";
```

2. Add it to any page:

```tsx
<TestError />
```

3. Click the "Trigger Test Error" button to test the error boundary

## Configuration

### Discord Webhook

The error reporting webhook URL is configured in `lib/backend/firebase/config.ts`:

```typescript
const errorBotProduction = "https://discord.com/api/webhooks/...";
export const errorBotURL = firebaseConfig.projectId === "onehr-dev" ? "" : errorBotProduction;
```

### Error Page Styling

The error page uses the project's design system:

- Card component for layout
- Destructive color scheme for error state
- Responsive design with proper spacing
- Accessible button labels and icons

## Error Information Collected

When an error occurs, the following information is sent to Discord:

- Timestamp (formatted using dayjs)
- Environment (URL origin)
- Pathname (current page)
- Error message and stack trace
- Component stack information

## Best Practices

1. **Error Boundary Placement**: The error boundary is placed high in the component tree to catch errors from all child components.

2. **User-Friendly Messages**: Error messages are designed to be non-threatening and informative.

3. **Automatic Recovery**: Users are automatically redirected to the home page after a delay.

4. **Development vs Production**: Error reporting is disabled in development to avoid spam.

5. **Toast Integration**: Uses the existing toast system for user notifications.

## Troubleshooting

### Error Boundary Not Catching Errors

- Ensure the error boundary is properly imported and used
- Check that errors are thrown within the component tree
- Verify that the error boundary is not catching its own errors

### Discord Webhook Not Working

- Check the webhook URL in the Firebase config
- Verify the webhook is active and has proper permissions
- Check browser console for network errors

### Toast Notifications Not Showing

- Ensure the toast context is properly set up
- Check that the error boundary is within the toast provider
- Verify toast configuration in the context
