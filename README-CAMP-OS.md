# Camp OS - Camp Management Platform

A modern, role-based camp management platform built with Next.js 15, Better Auth, and PostgreSQL.

## Overview

Camp OS is a comprehensive camp management solution with three integrated surfaces:

1. **Parent Portal** - Register children, view real-time updates, track registrations
2. **Staff Mobile App** - View assigned groups, manage rosters, access medical information
3. **Admin Console** - Manage camps/sessions, track revenue, monitor registrations

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your POSTGRES_URL and other credentials

# Reset database and apply schema
npm run db:reset

# Seed with test data
npm run db:seed

# Start development server
npm run dev
```

### Development Testing

Navigate to http://localhost:3000/dev-login to access the development login page.

**Test Users Available:**
- **Admin**: admin@camposarai.co - Full system access
- **Staff**: sarah.johnson@camposarai.co, mike.chen@camposarai.co - View assigned groups
- **Nurse**: emily.martinez@camposarai.co - Medical access
- **Parents**: jennifer.smith@example.com, david.williams@example.com, maria.garcia@example.com

**Role Switching:**
Use the "Switch Role" button in the header to instantly switch between test users while logged in.

## Architecture

### Tech Stack

| Feature | Technology | Purpose |
|---------|-----------|---------|
| Framework | Next.js 15 App Router | Server Components, streaming |
| Auth | Better Auth + Dev Auth | OAuth + development bypass |
| Database | PostgreSQL + Drizzle ORM | Type-safe database access |
| UI | shadcn/ui + Tailwind CSS | Component library |
| Forms | React Hook Form + Zod | Validation (planned) |
| File Storage | Vercel Blob | Document uploads (planned) |
| AI | Vercel AI SDK + OpenAI | AI features (planned) |

### Database Schema

**Core Tables:**
- `user` - Extended Better Auth user table with `role` field
- `children` - Child profiles with medical information
- `camps` - Camp definitions with capacity and location
- `sessions` - Camp sessions with dates, pricing, capacity
- `registrations` - Child enrollments in sessions
- `incidents` - Incident reports with severity tracking
- `groups` - Group/cabin organization within sessions
- `assignments` - Staff assigned to groups
- `events` - Event sourcing for audit trails
- `attendance` - Check-in/check-out tracking
- `medications` - Medication information
- `medication_logs` - Medication administration logs
- `documents` - File uploads
- `ai_actions` - AI-generated actions pending approval

**See:** `src/lib/schema.ts` for complete schema with relations

### Role-Based Access Control (RBAC)

**Roles:**
- `parent` - Access own children and registrations only
- `staff` - Access assigned groups and children
- `nurse` - Full medical access
- `admin` - Full system access

**Permission System:**

```typescript
import { enforcePermission } from "@/lib/rbac";

// In Server Actions
await enforcePermission(session.user.id, "child", "update", childId);
```

**See:** `src/lib/rbac.ts` for complete permission matrix

## Features Implemented

### Phase 1: Foundation ✅

- ✅ Complete database schema (15 tables)
- ✅ RBAC system with 4 roles
- ✅ Better Auth integration with custom roles
- ✅ Development authentication bypass
- ✅ Seed script with comprehensive test data
- ✅ Service layer architecture (RegistrationService)

### Dashboards ✅

**Parent Dashboard** (`/dashboard/parent`)
- View all children with medical information
- See active and pending registrations
- Browse available camp sessions with capacity
- Quick stats: children count, active registrations, pending payments

**Staff Dashboard** (`/dashboard/staff`)
- View assigned groups and sessions
- Complete rosters with allergy alerts
- Children count and session stats
- Group capacity tracking

**Admin Dashboard** (`/dashboard/admin`)
- Overview of all camps and sessions
- Revenue tracking ($3,850 total in seed data)
- Registration management with status
- Session fill rates and capacity planning

### Future Phases (Planned)

- **Phase 2**: Multi-step registration forms with payment
- **Phase 3**: Check-in/check-out workflows
- **Phase 4**: Incident reporting with photo upload
- **Phase 5**: Real-time updates (SSE notifications)
- **Phase 6**: Event sourcing audit trails
- **Phase 7**: AI features (admin config, conversational enrollment, voice-to-text)

## Development Workflow

### Database Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema directly (dev)
npm run db:push

# Reset database (drop all tables and recreate)
npm run db:reset

# Seed with test data
npm run db:seed

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Quality Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/     # Better Auth endpoints
│   │   └── dev-login/         # Dev auth bypass
│   ├── dashboard/
│   │   ├── parent/            # Parent dashboard
│   │   ├── staff/             # Staff dashboard
│   │   ├── admin/             # Admin dashboard
│   │   └── page.tsx           # Role router
│   ├── dev-login/             # Dev login UI
│   └── page.tsx               # Landing page
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── role-switcher.tsx      # Dev role switching
│   ├── site-header.tsx        # Header with branding
│   └── site-footer.tsx        # Footer
├── lib/
│   ├── auth.ts                # Better Auth config
│   ├── auth-helper.ts         # Unified auth (dev + production)
│   ├── dev-auth.ts            # Dev session management
│   ├── rbac.ts                # Permission enforcement
│   ├── db.ts                  # Database connection
│   └── schema.ts              # Drizzle schema
├── services/
│   └── registration-service.ts # Business logic
└── scripts/
    └── seed.ts                # Database seeding
```

## Security

### Production Safety

- Dev auth automatically disabled when `NODE_ENV=production`
- All database queries filtered by `userId`
- RBAC enforced on all Server Actions
- Input validation with Zod schemas

### Permission Enforcement Pattern

```typescript
// Example Server Action
'use server'

import { getSession } from "@/lib/auth-helper";
import { enforcePermission } from "@/lib/rbac";

export async function updateChild(childId: string, data: any) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // Check permission + verify ownership
  await enforcePermission(session.user.id, "child", "update", childId);

  // Proceed with update
  await db.update(children).set(data).where(eq(children.id, childId));
}
```

## Seed Data

The seed script creates a complete test environment:

**Users:**
- 1 admin, 2 staff, 1 nurse, 3 parents

**Camps:**
- Summer Adventure Camp 2025 (2 sessions in July, $750)
- Creative Arts Camp 2025 (1 session in July, $850)

**Children:**
- 6 children across 3 families
- Includes children with allergies (peanuts, shellfish, dairy, bee stings)
- Medical notes for EpiPen carriers and conditions

**Registrations:**
- 5 confirmed registrations (paid)
- 1 pending registration
- Children distributed across groups

**Groups:**
- Junior Explorers (age group)
- Senior Adventurers (age group)
- Trailblazers (cabin)
- Creative Minds (age group)

**Assignments:**
- Staff assigned to groups as counselors
- Complete roster coverage

Run `npm run db:seed` to populate the database.

## API Routes

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/auth/[...all]` | * | Better Auth endpoints | No |
| `/api/dev-login` | POST | Dev authentication | Dev only |

## Environment Variables

Required variables (see `.env.example`):

```env
# Database
POSTGRES_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional, for production auth)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# OpenAI (for future AI features)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Development Notes

### Authentication Flow

**Development Mode:**
1. User navigates to `/dev-login`
2. Selects a test user
3. Dev session cookie is set
4. Dashboard loads with dev user session
5. Can switch roles via header dropdown

**Production Mode:**
1. User clicks "Sign in with Google"
2. Better Auth OAuth flow
3. Session created in database
4. Dashboard loads with real session

### Adding New Roles

1. Add role to `user` table in schema
2. Update `ROLE_PERMISSIONS` in `src/lib/rbac.ts`
3. Add test user to seed script
4. Add to `DEV_USERS` in role-switcher component

## Documentation

- **Architecture**: See `AGENTS.md` for universal patterns
- **Technical Plans**: See `plans/` directory
- **Solutions**: See `docs/solutions/` for documented patterns

## Contributing

This is a starter kit / prototype. To extend:

1. Review the architecture in `AGENTS.md`
2. Check existing patterns in `plans/`
3. Follow RBAC enforcement patterns
4. Run `npm run lint` and `npm run typecheck` before committing

## License

MIT

## Support

For questions or issues, see the planning documents in `plans/` or the solution docs in `docs/solutions/`.
