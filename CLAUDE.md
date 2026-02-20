# North District Resource Sharing

Resource sharing platform for North District United Methodist churches in the Rio Texas Conference. Bilingual (EN/ES).

## Stack

- **Framework**: Next.js 16 App Router (Turbopack)
- **Language**: TypeScript 5.9, React 19
- **Database**: SQLite via Prisma 6
- **Auth**: JWT (jose) in HttpOnly cookies, bcryptjs for passwords
- **i18n**: next-intl (locales: en, es)
- **Styling**: Tailwind CSS 4 (oklch color theme)
- **Validation**: Zod 4 (uses `.issues` not `.errors`)
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # prisma generate && next build
pnpm seed         # Seed database (tsx prisma/seed.ts)
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
  app/
    [locale]/          # Locale-prefixed routes (en, es)
      dashboard/       # Auth-protected resource management
        activity/      # Activity log page
      login/           # Login page
      music/           # Public music browse
      study/           # Public study browse
      churches/        # Church directory
      resources/[id]/  # Resource detail
    api/
      auth/            # login, logout, me
      resources/       # GET (public), POST/PUT/DELETE (auth)
      churches/        # GET (public)
      tags/            # GET (public)
      activity/        # GET activity log (auth, paginated)
  components/          # Client components (Navbar, ResourceForm, etc.)
  i18n/                # Routing, navigation, request config
  lib/
    auth.ts            # JWT sign/verify, cookie helpers, getCurrentUser, requireAuth
    prisma.ts          # Prisma client singleton
    constants.ts       # Category/subcategory/format/role enums
    locale-utils.ts    # Bilingual field helper
    email.ts           # Resend email notifications for loan lifecycle
    activity-log.ts    # Fire-and-forget activity logging helper
  proxy.ts             # Middleware: next-intl + dashboard route protection
messages/
  en.json              # English translations
  es.json              # Spanish translations
prisma/
  schema.prisma        # 9 models: Church, Resource, Tag, ResourceTag, User, LoanRequest, Loan, SiteSettings, ActivityLog
  seed.ts              # 4 churches, 17 resources, 10 tags, 5 users, sample loans, sample activity logs
```

## Database Models

- **Church** — name, nameEs, address, city, pastor, etc.
- **Resource** — category (MUSIC|STUDY), title/titleEs, subcategory, format, quantity, availability
- **Tag** / **ResourceTag** — many-to-many tagging with bilingual names
- **User** — username, passwordHash, role (EDITOR|ADMIN), optional churchId
- **LoanRequest** / **Loan** — inter-church resource lending workflow
- **SiteSettings** — singleton settings (email notifications toggle)
- **ActivityLog** — audit trail: userId, action, entityType, entityId, details, createdAt

## Auth

- JWT stored in `north-district-token` HttpOnly cookie (7-day expiry)
- Roles: EDITOR (manages own church's resources), ADMIN (manages all)
- Middleware redirects unauthenticated `/dashboard` requests to `/login`
- Server components use `getCurrentUser()` / `requireAuth()` from `src/lib/auth.ts`
- Client components use `useAuth()` from `AuthProvider`

## Seed Credentials

- Editors: `editor_first` / `password123`, `editor_covenant`, `editor_stjohns`, `editor_grace`
- Admin: `admin` / `admin123`

## Conventions

- All bilingual fields: `field` (English) + `fieldEs` (Spanish, nullable)
- i18n keys organized by namespace: `common`, `home`, `resources`, `categories`, `subcategories`, `availability`, `formats`, `churches`, `auth`, `loans`, `admin`, `activity`, `notifications`
- Tailwind colors: `primary-*` (warm earth), `accent-*` (gold), `music-*` (green), `study-*` (slate)
- API responses: `{ resources, pagination }` for lists; direct object for single items
- Zod 4 validation on all write endpoints; error details via `err.issues`
- next-intl `Link` from `@/i18n/navigation` for locale-aware routing; cast non-typed paths with `as never`

## Workflow

After every successful `pnpm build`, commit all changes and push to origin.

## Environment Variables

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-in-production"
RESEND_API_KEY=""          # Empty = emails logged to console; set to send via Resend
```
