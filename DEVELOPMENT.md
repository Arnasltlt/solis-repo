# Development Guide

This document contains guidelines and best practices for developing the Solis platform.

## Environment Setup

1. Use `.env.local` for local development variables
2. Never commit sensitive credentials to the repository

## Code Guidelines

### Naming Conventions

- React components: PascalCase (e.g., `ContentCard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useAuth.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- API routes: kebab-case (e.g., `api/manage/users/create-user.ts`)

### Component Structure

- Keep components focused on a single responsibility
- Extract reusable logic to custom hooks
- Use TypeScript interfaces for props

```tsx
// Example component structure
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  onClick
}: ButtonProps) {
  // Component logic
  return (
    <button
      className={`btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### State Management

- Use React Context for global state (auth, themes)
- Use React Query for server state
- Use local state for component-specific state

### Error Handling

- Wrap API calls in try/catch blocks
- Use the `ErrorBoundary` component for client-side error catching
- Log errors to Sentry in production

```tsx
try {
  await apiCall();
} catch (error) {
  handleError(error, 'Failed to fetch data');
}
```

## Testing

- Write unit tests for utility functions and components
- Use React Testing Library for component tests
- Run tests before submitting PRs

```bash
npm run test
```

## Performance Optimizations

- Use Next.js Image component for optimized images
- Minimize component re-renders with memoization when appropriate
- Lazy load components not needed for initial render

## Deployment Workflow

1. Develop in feature branches
2. Create pull requests for code review
3. Vercel preview deployments will be created automatically
4. Merge to main branch for production deployment

## Common Tasks

### Adding a New Page

1. Create a new file in the appropriate directory under `app/`
2. Export a default React component
3. For protected pages, wrap with the `ProtectedRoute` component

### Working with the Database

- Use Supabase client for database operations
- Follow the existing patterns in `lib/services/`

### Adding New API Endpoints

1. Create a route file under `app/api/`
2. Implement GET, POST, etc. handlers as needed
3. Include proper error handling
4. Return appropriate HTTP status codes

## Troubleshooting

### Build Issues

- Check for TypeScript errors
- Verify all imports are correct
- Make sure environment variables are set

### Runtime Errors

- Check the browser console for client-side errors
- Check server logs for API errors
- Verify authentication is working correctly