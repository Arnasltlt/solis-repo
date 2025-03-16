# Solis Educational Platform

A content management platform for educational materials focused on music and dance.

## Features

- Content management system for various content types (video, audio, lesson plans, games)
- Rich text editor for creating formatted content
- Role-based access control (free users, premium users, administrators)
- Premium content designation with access controls
- Content filtering by age groups and categories
- Responsive design for all devices

## Technology Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account (for database, auth, and storage)

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/solis-fe.git
cd solis-fe
```

2. Install dependencies

```bash
npm install
# or
yarn
```

3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables (see `.env.example` for template):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `app/`: Next.js 14 App Router pages and layouts
- `components/`: Reusable React components
- `lib/`: Utilities, services, types, and helpers
- `hooks/`: Custom React hooks
- `public/`: Static assets
- `styles/`: Global styles and theme configuration

## Key Pages

- `/`: Home page with content browsing
- `/medziaga/[slug]`: Content detail page
- `/login`: User login page
- `/signup`: User registration page
- `/profile`: User profile management
- `/manage`: Admin dashboard
- `/manage/content/new`: Content creation page
- `/manage/content/edit/[id]`: Content editing page

## License

[MIT License](LICENSE)