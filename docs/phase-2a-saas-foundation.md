# Phase 2A SaaS Foundation

This phase keeps the approved ClassPulse AI dashboard experience intact and adds the production foundation below it: PostgreSQL, Prisma, authentication, role-based authorization, school tenancy, school admin management, and subscriptions.

## Database Architecture Summary

The database is PostgreSQL through Prisma ORM. The Phase 2A schema is intentionally small and tenant-first:

- `super_admins`: platform operators who can view all schools, create schools, create school admins, and manage subscriptions.
- `schools`: tenant root table. Every future academic, device, attendance, report, and AI table must include `school_id` and reference this table. It also has a permanent unique `school_code` for human-readable school identification.
- `school_admins`: tenant users scoped to exactly one school.
- `subscriptions`: subscription history and current commercial state for each school.
- `sessions`: server-side session records with token hashes, role, optional school scope, expiry, and revocation.
- `school_registration_requests`: future public registration submissions awaiting platform review.

The schema uses IDs, timestamps, active flags, indexes for tenant and status lookups, and explicit database column names such as `school_id`, `password_hash`, `created_at`, and `updated_at`.

## Prisma Schema Explanation

The Prisma schema lives in `prisma/schema.prisma`.

Core models:

- `SuperAdmin`: unique email, secure password hash, active flag, timestamps, sessions.
- `School`: immutable unique school code, name, logo URL, city, country, subscription plan/status, lifecycle status, audit fields, admins, subscriptions, sessions.
- `SchoolAdmin`: belongs to one school through `schoolId`; unique email; active flag; sessions.
- `Subscription`: belongs to one school; stores plan, status, start date, optional expiry date.
- `Session`: stores only a hash of the browser session token, never the raw token.

Enums:

- `SubscriptionPlan`: `STARTER`, `PROFESSIONAL`, `ENTERPRISE`.
- `SubscriptionStatus`: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`.
- `SessionRole`: `SUPER_ADMIN`, `SCHOOL_ADMIN`.
- `SchoolStatus`: `PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`.
- `RegistrationRequestStatus`: `PENDING`, `APPROVED`, `REJECTED`.

Future entities should be added with this pattern:

```prisma
model FutureEntity {
  id        String   @id @default(cuid())
  schoolId  String   @map("school_id")
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Restrict)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([schoolId])
  @@map("future_entities")
}
```

`school_code` is a permanent identifier such as `JUB001`, `RYD001`, or `DMM001`. It is unique, validated by a database check constraint, and protected by a database trigger in the Phase 2A migration so it cannot be changed after school creation. Future systems may use it for device provisioning, RFID registration, device-to-school assignment, support workflows, analytics labels, and school identification, while internal foreign keys should continue to use `school_id`.

## School Approval Workflow

Schools use this lifecycle:

- `PENDING`: registration submitted, cannot access the platform, awaiting SuperAdmin review.
- `ACTIVE`: approved by SuperAdmin, school admins can log in.
- `SUSPENDED`: temporarily disabled by SuperAdmin, login blocked, data preserved.
- `REJECTED`: registration rejected by SuperAdmin, login blocked, data preserved.

Only SuperAdmin can change school lifecycle status.

Workflow endpoints:

- `GET /api/schools/pending`
- `POST /api/schools/[schoolId]/approve`
- `POST /api/schools/[schoolId]/reject`
- `POST /api/schools/[schoolId]/suspend`
- `POST /api/schools/[schoolId]/activate`

Status changes store audit fields:

- `approved_by`, `approved_at`
- `rejected_by`, `rejected_at`
- `suspended_by`, `suspended_at`

Rejecting or suspending a school revokes active sessions for that school.

## Authentication Flow

Authentication is implemented with email/password login and server-side sessions.

1. The login form posts to `POST /api/auth/login`.
2. The server checks `super_admins` first, then `school_admins`.
3. Passwords are verified using PBKDF2-SHA256 with per-password salts.
4. A random session token is generated.
5. Only an `AUTH_SECRET`-bound HMAC hash of the session token is stored in `sessions`.
6. The raw token is sent to the browser as an HTTP-only cookie.
7. Protected API routes call `requireAuth`, `requireSuperAdmin`, or `requireSchoolAccess`.
8. Logout revokes the session row and clears the cookie through `POST /api/auth/logout` or `GET /logout`.

The browser cannot read the session cookie because it is HTTP-only.

## Tenant Isolation Explanation

School isolation is enforced by server helpers in `lib/auth/session.ts`.

- `requireAuth()` validates the session exists, is not revoked, has not expired, and belongs to an active user.
- `requireSuperAdmin()` allows only platform-level users.
- `requireSchoolAccess(schoolId)` allows SuperAdmin access to any school, but allows SchoolAdmin access only when `auth.schoolId === schoolId`.

SchoolAdmin sessions carry `schoolId`. Every school-scoped endpoint filters by that value or rejects the request.

SchoolAdmin login is allowed only when the linked school has `status = ACTIVE`. `PENDING`, `REJECTED`, and `SUSPENDED` schools receive explicit login errors and cannot create sessions.

Current examples:

- `GET /api/schools`: SuperAdmin receives all schools; SchoolAdmin receives only their school.
- `GET /api/schools/[schoolId]`: SchoolAdmin is blocked from any other school ID.
- `GET /api/subscriptions`: SchoolAdmin receives only their school subscription records.
- `GET /api/school/current`: returns the authenticated school context used by the existing UI.

## Seed Data

The seed script lives at `prisma/seed.mjs` and creates:

- Super Admin: `super@classpulse.ai`
- School Admin: `admin@jubail-school.edu.sa`
- School Admin: `admin@riyadh-future.edu.sa`
- School Admin: `admin@dammam-knowledge.edu.sa`

All seed users use this development password:

```text
Password123!
```

## Setup Commands

Set `DATABASE_URL` and `AUTH_SECRET` from `.env.example`, then run:

```bash
corepack enable
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

No academic entities, devices, RFID, attendance engine, noise monitoring, reports engine, or AI tables are part of this phase.
