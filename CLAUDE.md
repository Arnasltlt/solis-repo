# CLAUDE.md - Solis Platform Guide

## Build Commands
- Development server: `npm run dev` - Runs Next.js dev server on http://localhost:3000
- Production build: `npm run build` - Creates optimized production build
- Start production: `npm start` - Starts production server after build
- Lint: `npm run lint` - Runs ESLint for code quality checks

## Project Structure
- `app/` - Next.js App Router pages
- `components/` - Reusable React components
- `lib/` - Services, utilities, and types
- `hooks/` - Custom React hooks
- `public/` - Static assets
- `styles/` - Global styles

## Common Tasks
- Creating content: Navigate to `/manage/content/new`
- Editing content: Find content item and click "Edit" button
- Managing users: Navigate to `/manage/users`

## Authentication
- Admin credentials required for content management
- Role-based access control via Supabase

## Database
- Supabase PostgreSQL database
- Content stored in `content_items` table
- User roles in `access_tiers` table

## Storage
- Thumbnails stored in Supabase Storage `thumbnails` bucket
- Media files stored in `content` bucket

## Naming Conventions
- Components use PascalCase
- Hooks use camelCase with 'use' prefix
- Utilities use camelCase
- File names use kebab-case
- Database columns use snake_case

## Best Practices
- Use TypeScript types for all props and data
- Prefer server components for data fetching
- Use client components only when interactivity needed
- Follow Tailwind CSS naming conventions
- Use form validation with Zod schemas