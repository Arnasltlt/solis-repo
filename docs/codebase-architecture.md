# Solis Frontend Codebase Architecture

## Overview

The Solis frontend is a content management system built with Next.js and React, designed to create, manage, and display educational content. The application uses TypeScript for type safety and connects to a Supabase backend for data storage and retrieval. 

The system allows educators to create various types of content (videos, audio, lesson plans, games) targeted at different age groups, categorize them, and make them accessible either freely or as premium content.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Backend**: Supabase (PostgreSQL database, Auth, Storage)
- **State Management**: React Context and Hooks

## Project Structure

```
solis-fe/
├── app/                    # Next.js app directory (pages and routes)
│   ├── api/                # API routes for server-side operations
│   ├── manage/             # Content management pages
│   ├── medziaga/           # Content viewing pages
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── content/            # Content-specific components
│   ├── editor/             # Rich text editor components
│   └── ui/                 # Reusable UI components
├── lib/                    # Library code
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Service functions for API calls
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── docs/                   # Project documentation
└── public/                 # Static assets
```

## Core Components

### Content Management Components

#### `ContentForm` (`components/content/content-form.tsx`)

Responsible for creating and editing content with features:
- Form validation using Zod schema
- File uploads for thumbnails
- Rich text editing
- Categorization by age groups and subjects
- Access tier selection (free/premium)

#### `ClientManageContentPage` (`app/manage/content/ClientManageContentPage.tsx`)

Client-side component for the content management interface:
- Tabbed interface for creating and listing content
- Form submission handling
- Data transformation for API calls
- Error handling and user feedback

### Content Display Components

#### `ContentLayout` (`components/content/content-layout.tsx`)

Main layout component for the content browsing experience:
- Filtering by age groups and categories
- Content type tabs
- Responsive grid display
- Mobile-friendly filtering interface

#### `ContentCard` (`components/ui/content-card.tsx`)

Card component for displaying content in grid layouts:
- Thumbnail display with error handling
- Content metadata display
- Premium content indication
- Link to detailed view

#### `ContentDetail` (`components/content/content-detail.tsx`)

Detailed view for a single content item:
- Renders full content information
- Displays rich text content
- Shows type-specific content (videos, audio, documents)
- User feedback collection
- Premium content handling

#### `ContentBodyDisplay` (`components/content/content-body-display.tsx`)

Handles the display of rich text content:
- Parses JSON content structure
- Error handling for malformed content
- Read-only view of rich text
- Premium content restrictions

## Data Flow

1. **Content Creation**:
   - User fills out `ContentForm`
   - Data is validated with Zod schema
   - Form submission is handled by `ClientManageContentPage`
   - `createContent` service is called
   - Data is transformed into database format
   - Supabase client performs database insertion
   - Thumbnail is uploaded to Supabase storage

2. **Content Retrieval**:
   - `useContent` hook or direct service call fetches content
   - Data is transformed from database format to app format
   - Content is displayed in `ContentLayout` using `ContentCard` components
   - Age groups and categories are loaded for filtering

3. **Content Viewing**:
   - User clicks on a `ContentCard`
   - Router navigates to content detail page
   - `getContentBySlug` service fetches complete content data
   - `ContentDetail` component renders the content
   - Rich text is parsed and displayed by `ContentBodyDisplay`

## Services Integration

### Supabase Integration

The application integrates with Supabase for:

1. **Database Operations**:
   - Content CRUD operations
   - Relationship management (age groups, categories)
   - User feedback collection

2. **File Storage**:
   - Thumbnail image storage
   - Content file storage (documents, audio, etc.)
   - Public URL generation

3. **Authentication** (implementation not shown in provided files):
   - User registration and login
   - Role-based access control
   - Premium content access

### Content Service API

The `content.ts` service provides a complete API for content operations:

```typescript
// Core Content Operations
getContentItems({...})        // List content with filters
getContentById(id)            // Get single content by ID
getContentBySlug(slug)        // Get single content by slug
createContent(data)           // Create new content
// updateContent(id, data)    // Update content (not implemented yet)

// Reference Data Operations
getAgeGroups()                // List age groups
getCategories()               // List content categories
getAccessTiers()              // List access tiers (free/premium)

// Feedback Operations
getFeedback(contentId)        // Get user feedback
addFeedback(contentId, ...)   // Add user feedback
checkFeedback(contentId)      // Check feedback status
```

## Type System

The application uses TypeScript with well-defined interfaces for all data structures:

```typescript
// Core Types
ContentItem           // Content data structure
ContentFormData       // Form data for content creation/editing
AgeGroup              // Age group reference data
Category              // Category reference data
AccessTier            // Access tier reference data (free/premium)
```

## Implementation Notes

### Content Body Handling

Content body is stored as a JSON string in the database and parsed for display:
- The editor creates a structured JSON format
- Content is saved as a stringified JSON object
- When displaying, the JSON is parsed and rendered by the editor component

### Thumbnail Handling

Thumbnails are uploaded to Supabase storage:
1. File is selected by the user in `ContentForm`
2. On form submission, the file is uploaded to Supabase storage
3. Public URL is generated and stored in `thumbnail_url` field
4. `ContentCard` and `ContentDetail` components display the image
5. Error handling is implemented for broken or missing images

### Premium Content

The application has a simple premium content model:
- Content can be marked as free or premium
- Premium content is indicated with a badge
- Certain parts of premium content are restricted
- Premium content body is not displayed to non-premium users

## Testing and Development

The codebase includes various testing utilities to verify functionality:
- Supabase connection tests
- Environment variable tests
- Content creation tests
- Database schema inspection

These utilities help developers troubleshoot issues with the Supabase connection, environment configuration, and content operations.

## Editor Implementation

The rich text editor is a critical component of the content creation experience. It is implemented using the TipTap editor, which is built on top of ProseMirror.

### Key Components

- `components/editor/editor-wrapper.tsx` - The main editor component that provides:
  - Text formatting (bold, italic, headings)
  - Block formatting (quotes, lists)
  - Text alignment options
  - YouTube video embedding
  - Link insertion
  - Focus management
  - Toolbar with formatting buttons

### Editor Extensions

The editor uses several TipTap extensions to provide functionality:

1. **StarterKit** - Provides basic editor functionality:
   - Headings (levels 1-3)
   - Paragraphs
   - Bold and italic formatting
   - Lists (bullet and ordered)
   - Blockquotes
   - Horizontal rules

2. **Link** - Enables adding and editing links in the content

3. **TextAlign** - Provides text alignment options (left, center, right)

4. **Iframe** - Custom extension for embedding YouTube videos

### Editor Styling

The editor styling is implemented using:

1. **Global CSS** - Defined in `app/globals.css`:
   - Basic styling for editor elements
   - Text color definitions to ensure visibility
   - Consistent styling for different content types

2. **Component-specific CSS** - Defined in the editor component:
   - Toolbar styling
   - Active state indicators
   - Consistent text colors for all editor content

### Recent Improvements

1. **Text Color Fixes**:
   - Fixed issues with text becoming white/invisible during editing
   - Added explicit text color styles to ensure content is visible in all contexts
   - Implemented consistent color handling for both editor and rendered content

2. **Focus Management**:
   - Improved focus handling during formatting operations
   - Added focus restoration after button clicks
   - Implemented proper event handling to prevent form validation during editing

3. **Form Integration**:
   - Enhanced integration with React Hook Form
   - Improved validation to prevent interrupting editing
   - Added better error handling for form submissions

4. **Debugging and Logging**:
   - Added comprehensive logging throughout the editor
   - Implemented unique identifiers for editor instances
   - Added tracking for editor interactions and state changes

## Future Editor Enhancements

1. **Image Support**:
   - Add image upload functionality
   - Implement image resizing and alignment
   - Add caption support for images

2. **Advanced Formatting**:
   - Add table support
   - Implement code blocks with syntax highlighting
   - Add more text formatting options

3. **Collaboration Features**:
   - Implement real-time collaboration
   - Add commenting functionality
   - Implement version history 