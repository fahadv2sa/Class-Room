# Class-Room Project Master

Single source of truth for the Class-Room repository.

Audience: future AI tools, developers, auditors, project managers, investors, and stakeholders.

Last verified from repository state containing these latest commits:

- `b7d435d` Phase 2B.6R native internationalization refactor
- `b1f444c` Phase 2B.6 full internationalization
- `ed0241f` Phase 2C teachers and students foundation
- `f025b46` Phase 2B.5 settings persistence and language foundation
- `7c4bd8a` Phase 2A + Phase 2A.1 + Phase 2B

This document describes verified repository facts only. It does not describe planned features as completed.

---

## 1. Project Overview

### Project Name

Class-Room

### Product Name

ClassPulse AI

### Purpose

ClassPulse AI is a school operations platform for smart classroom management. The current repository implements the SaaS, authentication, tenant, academic structure, settings, language, teacher, and student foundations that later operational modules will use.

### Vision

The long-term vision is a multi-school SaaS platform that can support thousands of schools with tenant-isolated academic structure, classroom operations, attendance, RFID/card identity, movement tracking, reporting, and future AI analytics.

### Problem Being Solved

Schools need a unified platform to manage academic structure, school-level settings, users, students, teachers, and future live classroom signals while protecting each school's data from every other school.

### Intended Users

Completed user roles:

- `SuperAdmin`: platform operator with cross-school administration rights.
- `SchoolAdmin`: school-scoped administrator who can access only their own school.

Future user categories are not implemented yet.

### Long-Term Direction

The platform is moving from a dashboard prototype toward a production SaaS system. The current architecture is tenant-first and prepares for devices, RFID/NFC identity, attendance, movement tracking, reports, and AI, but those modules are not implemented yet unless explicitly listed as completed in this document.

---

## 2. Current System Status

### Completed

- Phase 2A SaaS Foundation
- Phase 2A.1 School Approval Workflow
- Phase 2B Academic Structure Foundation
- Phase 2B.5 Settings Persistence + Language Foundation
- Phase 2C Teachers and Students Foundation
- Phase 2B.6R Native Internationalization Refactor

### In Progress

- No active in-progress phase is represented by committed code in the current repository.

### Planned

- Phase 2D Devices Foundation
- Phase 2E RFID + Attendance
- Phase 2F Movement Tracking
- Phase 2G Reporting
- Phase 3.0 AI Layer

### Phase 2A: SaaS Foundation

Objective:

Build the production SaaS foundation below the approved dashboard UI.

Implemented:

- PostgreSQL + Prisma ORM foundation.
- SuperAdmin model.
- School model.
- SchoolAdmin model.
- Subscription model.
- Server-side Session model.
- Password hashing with PBKDF2-SHA256.
- Login, logout, session validation.
- Protected routes.
- Role-based authorization.
- Tenant isolation helpers.
- Seed data for one SuperAdmin, three schools, and three SchoolAdmins.
- Permanent unique `school_code` on `School`.

Major architectural decisions:

- Every future school-owned entity must include `school_id`.
- Internal foreign keys use `school_id`, not `school_code`.
- `school_code` is a permanent human-readable identifier for future provisioning, support, analytics labels, and school identification.
- Raw session tokens are not stored; token hashes are stored.

APIs added:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/school/current`
- `GET /api/schools`
- `POST /api/schools`
- `GET /api/schools/[schoolId]`
- `PATCH /api/schools/[schoolId]`
- `GET /api/schools/[schoolId]/admins`
- `POST /api/schools/[schoolId]/admins`
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `GET /api/subscriptions/[subscriptionId]`
- `PATCH /api/subscriptions/[subscriptionId]`

Database entities added:

- `SuperAdmin`
- `School`
- `SchoolAdmin`
- `Subscription`
- `Session`

### Phase 2A.1: School Approval Workflow

Objective:

Prevent new schools from becoming active automatically and require SuperAdmin approval.

Implemented:

- School lifecycle statuses: `PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`.
- School approval, rejection, suspension, and reactivation endpoints.
- School login blocking for non-active schools.
- Audit fields for approval, rejection, and suspension.
- School registration request model for future public registration.

Major architectural decisions:

- School data is preserved when a school is rejected or suspended.
- Only SuperAdmin may approve, reject, suspend, or reactivate schools.
- SchoolAdmin login is allowed only when the school status is `ACTIVE`.

APIs added:

- `GET /api/schools/pending`
- `POST /api/schools/[schoolId]/approve`
- `POST /api/schools/[schoolId]/reject`
- `POST /api/schools/[schoolId]/suspend`
- `POST /api/schools/[schoolId]/activate`

Database entities added:

- `SchoolRegistrationRequest`

Database changes:

- `School.status`
- `approved_by`, `approved_at`
- `rejected_by`, `rejected_at`
- `suspended_by`, `suspended_at`

### Phase 2B: Academic Structure Foundation

Objective:

Create the academic hierarchy used by future students, teachers, devices, RFID events, attendance, reports, and analytics.

Implemented:

- Academic years per school.
- School levels per school and academic year.
- Classrooms per school, academic year, and level.
- APIs for academic years, levels, and classrooms.
- Tenant isolation for academic entities.
- Seed academic year `2026-2027`.
- Seed levels `PRIMARY`, `MIDDLE`, and `HIGH`.
- Seed platform-standard classroom codes.

Major architectural decisions:

- Academic entities include `school_id`.
- Classroom codes are short operational identifiers.
- Classroom code uniqueness is scoped per school and academic year.
- Future attendance, students, devices, reports, and analytics should connect to this hierarchy.

APIs added:

- `GET /api/academic-years`
- `POST /api/academic-years`
- `GET /api/academic-years/[academicYearId]`
- `PATCH /api/academic-years/[academicYearId]`
- `GET /api/levels`
- `POST /api/levels`
- `GET /api/levels/[levelId]`
- `PATCH /api/levels/[levelId]`
- `GET /api/classrooms`
- `POST /api/classrooms`
- `GET /api/classrooms/[classroomId]`
- `PATCH /api/classrooms/[classroomId]`

Database entities added:

- `AcademicYear`
- `SchoolLevel`
- `Classroom`

### Phase 2B.5: Settings Persistence + Language Foundation

Objective:

Move settings from local/mock state to PostgreSQL and add a bilingual foundation.

Implemented:

- `SchoolSettings` model.
- Database-backed settings loading and saving.
- Language field persisted per school.
- Settings API.
- Centralized translation dictionary.
- `LanguageProvider`.
- Initial translation coverage for login, level selection, and settings.

Major architectural decisions:

- Settings are one-to-one with School.
- Language is school-specific.
- SchoolAdmin can update only their own school settings.
- SuperAdmin can manage settings for selected schools.

APIs added:

- `GET /api/settings`
- `PATCH /api/settings`

Database entities added:

- `SchoolSettings`

### Phase 2C: Teachers and Students Foundation

Objective:

Create the academic people foundation that future attendance, RFID, movement tracking, reporting, and AI will use.

Implemented:

- Teacher model.
- Student model.
- Teacher APIs.
- Student APIs.
- Pagination, filtering, and search for list endpoints.
- Tenant isolation for people records.
- Card identity foundation.
- Seed teachers and students.
- Approved Teachers and Students pages connected to database APIs while keeping existing UI structure.

Major architectural decisions:

- Teacher and Student are school-owned through `school_id`.
- Student belongs to a classroom through `classroom_id`.
- Teacher `employee_number` is unique per school.
- Student `student_number` is unique per school.
- Teacher and Student `card_code` values are globally unique.
- Teaching assignments, attendance records, and movement records are not implemented yet.

APIs added:

- `GET /api/teachers`
- `POST /api/teachers`
- `GET /api/teachers/[teacherId]`
- `PATCH /api/teachers/[teacherId]`
- `GET /api/students`
- `POST /api/students`
- `GET /api/students/[studentId]`
- `PATCH /api/students/[studentId]`

Database entities added:

- `Teacher`
- `Student`

### Phase 2B.6R: Native Internationalization Refactor

Objective:

Correct internationalization architecture into native React/Next.js translation keys and remove the rejected DOM translation overlay approach.

Implemented:

- Centralized dictionary in `lib/i18n/translations.ts`.
- Shared i18n helpers in `lib/i18n/ui.ts`.
- `LanguageProvider` exposes `language`, `setLanguage`, `refreshLanguage`, and `t(key)`.
- `LanguageProvider` updates `html lang` and `html dir`.
- Arabic uses RTL.
- English uses LTR.
- Major dashboard pages and shared components render user-facing labels through translation keys.

Major architectural decisions:

- Native React translation is the approved architecture.
- DOM translation is rejected and must never be reintroduced.
- No post-render text replacement is allowed.
- Translation should happen before render through dictionaries and `t(key)`.

APIs added:

- No new API was added in Phase 2B.6R.

Database entities added:

- No database entity was added in Phase 2B.6R.

---

## 3. System Architecture

### Current Architecture

Class-Room is a Next.js application using the App Router. The system combines:

- Client-rendered dashboard pages.
- API route handlers under `app/api`.
- Prisma ORM for database access.
- PostgreSQL as the database.
- Server-side session records with HTTP-only browser cookies.
- Tenant isolation through school-scoped queries and authorization helpers.

### Frontend

The frontend lives under `app` and `components`.

Key routes:

- `/` login page
- `/select-level`
- `/dashboard`
- `/classrooms`
- `/classrooms/[id]`
- `/attendance`
- `/movement`
- `/noise`
- `/teachers`
- `/students`
- `/reports`
- `/alerts`
- `/devices`
- `/settings`

Shared layout components:

- `components/layout/dashboard-shell.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/topbar.tsx`

Shared UI components:

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/badge.tsx`
- `components/ui/table.tsx`
- `components/ui/segmented.tsx`

Dashboard visual components:

- `components/stat-card.tsx`
- `components/classroom-card.tsx`
- `components/charts.tsx`
- `components/noise-meter.tsx`
- `components/ai-insights.tsx`

### Backend

Backend behavior is implemented through Next.js API route handlers in `app/api`.

Important backend support modules:

- `lib/prisma.ts`: Prisma client.
- `lib/auth/session.ts`: session creation, validation, role checks, and response handling.
- `lib/auth/password.ts`: password hashing and verification.
- `lib/academic/access.ts`: tenant and academic access helpers.
- `lib/people/api.ts`: teacher/student API helpers.
- `lib/schools/workflow.ts`: school lifecycle helpers.
- `lib/settings/defaults.ts`: default settings and settings normalization.

### Database

Database access uses Prisma with PostgreSQL.

Prisma schema:

- `prisma/schema.prisma`

Migrations:

- `20260606120000_phase_2a_saas_foundation`
- `20260606123000_school_registration_approval_workflow`
- `20260606130000_academic_structure_foundation`
- `20260606133000_language_settings_persistence`
- `20260606143000_teachers_students_foundation`

### Authentication

Authentication is email/password based.

Current flow:

1. Login request is sent to `POST /api/auth/login`.
2. Server checks SuperAdmin first, then SchoolAdmin.
3. Passwords are verified with PBKDF2-SHA256.
4. Server creates a random session token.
5. A token hash is stored in `Session`.
6. Raw session token is placed in an HTTP-only cookie.
7. Protected APIs validate the session through `requireAuth`.
8. Logout revokes the session and clears the cookie.

### Authorization

Authorization is role-based.

Roles:

- `SUPER_ADMIN`
- `SCHOOL_ADMIN`

Core helpers:

- `requireAuth()`
- `requireSuperAdmin()`
- `requireSchoolAccess(schoolId)`
- `assertSameSchool(auth, schoolId)`
- `requireWritableSchoolId(auth, requestedSchoolId)`

### Tenant Model

The tenant root is `School`.

School-scoped entities use `school_id`. SchoolAdmin sessions carry one `schoolId`. SuperAdmin sessions are not scoped to one school.

---

## 4. Multi-Tenant Model

### School

`School` is the tenant root. It owns admins, settings, academic years, levels, classrooms, teachers, students, subscriptions, and sessions.

Important identifiers:

- `id`: internal primary key.
- `school_code`: permanent unique human-readable identifier.

### SchoolAdmin

`SchoolAdmin` belongs to one school through `school_id`.

Rules:

- Can access only their own school.
- Can manage only school-scoped data where `school_id` matches their session.
- Cannot provide another `school_id` to escape tenant scope.
- Can log in only when their school is `ACTIVE`.

### SuperAdmin

`SuperAdmin` is a platform operator.

Rules:

- Can access all schools.
- Can create schools.
- Can manage school lifecycle.
- Can manage subscriptions.
- Can view or manage school-scoped resources when endpoints permit it.

### Tenant Isolation Rules

Current rules:

- All future school-scoped entities must include `school_id`.
- API list routes for SchoolAdmin filter by authenticated `schoolId`.
- API detail routes assert the target record belongs to the authenticated school.
- SchoolAdmin cannot update records from another school.
- SchoolAdmin cannot move a student into a classroom owned by another school.
- SuperAdmin may access cross-school data by design.

### Data Visibility Rules

SchoolAdmin:

- Sees only their own School.
- Sees only their own settings.
- Sees only their own academic years, levels, classrooms.
- Sees only their own teachers and students.
- Sees only their own subscriptions.

SuperAdmin:

- Can see all schools and all school-scoped records through endpoints that support platform-wide access.

---

## 5. Database Overview

This is a human-readable overview. Do not paste the full Prisma schema into project documentation unless specifically needed.

### SuperAdmin

Purpose:

Platform-level operator account.

Key relationships:

- Has sessions.
- Can be referenced by school approval, rejection, and suspension audit fields.
- Can be referenced by school registration request approval/rejection audit fields.

Important constraints:

- Unique email.
- Active flag controls access.

### School

Purpose:

Tenant root record.

Key relationships:

- Owns SchoolAdmins, SchoolSettings, AcademicYears, SchoolLevels, Classrooms, Teachers, Students, Subscriptions, and Sessions.

Important constraints:

- Unique `school_code`.
- Status controls login eligibility for SchoolAdmins.
- Indexed by status and subscription status.

### SchoolAdmin

Purpose:

School-scoped administrator account.

Key relationships:

- Belongs to School.
- Has Sessions.

Important constraints:

- Unique email.
- Indexed by `school_id`.
- Active flag controls access.

### SchoolSettings

Purpose:

Persistent per-school settings and language preferences.

Key relationships:

- One-to-one with School.

Important constraints:

- Unique `school_id`.
- `language` uses `AR` or `EN`.
- Stores alert toggles and operational thresholds.

### AcademicYear

Purpose:

Defines an academic period for a school.

Key relationships:

- Belongs to School.
- Owns SchoolLevels.
- Owns Classrooms.

Important constraints:

- Unique `school_id + name`.
- Indexed by school and active status.

### SchoolLevel

Purpose:

Defines a school stage for an academic year.

Key relationships:

- Belongs to School.
- Belongs to AcademicYear.
- Owns Classrooms.

Important constraints:

- `level_type` is `PRIMARY`, `MIDDLE`, or `HIGH`.
- Unique `school_id + academic_year_id + level_type`.

### Classroom

Purpose:

Operational classroom within a school, academic year, and level.

Key relationships:

- Belongs to School.
- Belongs to AcademicYear.
- Belongs to SchoolLevel.
- Has Students.

Important constraints:

- Unique `school_id + academic_year_id + classroom_code`.
- `classroom_code` is the platform operational classroom identifier.

### Teacher

Purpose:

School-owned teacher/personnel record.

Key relationships:

- Belongs to School.

Important constraints:

- `employee_number` unique per school.
- `card_code` globally unique.
- `national_id` unique per school when present.
- `email` unique per school when present.
- Status is `ACTIVE` or `INACTIVE`.

### Student

Purpose:

School-owned student record assigned to a classroom.

Key relationships:

- Belongs to School.
- Belongs to Classroom.

Important constraints:

- `student_number` unique per school.
- `card_code` globally unique.
- `national_id` unique per school when present.
- Status is `ACTIVE`, `INACTIVE`, `GRADUATED`, or `TRANSFERRED`.

### SchoolRegistrationRequest

Purpose:

Foundation for future public school registration workflow.

Key relationships:

- May reference SuperAdmin as approver or rejector.

Important constraints:

- Status is `PENDING`, `APPROVED`, or `REJECTED`.
- Indexed by status and admin email.

### Subscription

Purpose:

Stores subscription plan and commercial status for a school.

Key relationships:

- Belongs to School.

Important constraints:

- Plan is `STARTER`, `PROFESSIONAL`, or `ENTERPRISE`.
- Status is `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, or `EXPIRED`.
- Indexed by school, status, and expiry date.

### Session

Purpose:

Server-side session storage.

Key relationships:

- May belong to SuperAdmin.
- May belong to SchoolAdmin.
- May carry `school_id`.

Important constraints:

- Unique token hash.
- Indexed by role, school, and expiry.
- Supports revocation with `revoked_at`.

### User

There is no generic `User` entity in the current schema. User-like accounts are represented by `SuperAdmin` and `SchoolAdmin`.

---

## 6. Current API Surface

Permission terms:

- Public: no authenticated session required.
- Authenticated: valid session required.
- SuperAdmin: platform operator only.
- SchoolAdmin scoped: SchoolAdmin may access only their own school data.
- Tenant scoped: SuperAdmin may access broader data; SchoolAdmin is restricted to their school.

### Auth

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| POST | `/api/auth/login` | Create session for SuperAdmin or SchoolAdmin | Public |
| POST | `/api/auth/logout` | Revoke current session | Authenticated if session exists |
| GET | `/api/auth/me` | Return current authenticated user context | Authenticated |
| GET | `/logout` | Clear session and redirect/logout flow | Authenticated if session exists |

### School Context

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/school/current` | Return current school context used by UI | Authenticated |

### Schools

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/schools` | List schools | Tenant scoped |
| POST | `/api/schools` | Create school | SuperAdmin |
| GET | `/api/schools/[schoolId]` | Get one school | Tenant scoped |
| PATCH | `/api/schools/[schoolId]` | Update school | SuperAdmin |
| GET | `/api/schools/pending` | List pending schools | SuperAdmin |
| POST | `/api/schools/[schoolId]/approve` | Approve school | SuperAdmin |
| POST | `/api/schools/[schoolId]/reject` | Reject school | SuperAdmin |
| POST | `/api/schools/[schoolId]/suspend` | Suspend school | SuperAdmin |
| POST | `/api/schools/[schoolId]/activate` | Reactivate school | SuperAdmin |
| GET | `/api/schools/[schoolId]/admins` | List school admins for a school | Tenant scoped |
| POST | `/api/schools/[schoolId]/admins` | Create school admin | SuperAdmin |

### Settings

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/settings` | Read school settings | Tenant scoped |
| PATCH | `/api/settings` | Update school settings | Tenant scoped |

### Academic Years

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/academic-years` | List academic years | Tenant scoped |
| POST | `/api/academic-years` | Create academic year | Tenant scoped with writable school |
| GET | `/api/academic-years/[academicYearId]` | Get academic year | Tenant scoped |
| PATCH | `/api/academic-years/[academicYearId]` | Update academic year | Tenant scoped |

### Levels

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/levels` | List school levels | Tenant scoped |
| POST | `/api/levels` | Create school level | Tenant scoped with writable school |
| GET | `/api/levels/[levelId]` | Get level | Tenant scoped |
| PATCH | `/api/levels/[levelId]` | Update level | Tenant scoped |

### Classrooms

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/classrooms` | List classrooms | Tenant scoped |
| POST | `/api/classrooms` | Create classroom | Tenant scoped with writable school |
| GET | `/api/classrooms/[classroomId]` | Get classroom | Tenant scoped |
| PATCH | `/api/classrooms/[classroomId]` | Update classroom | Tenant scoped |

### Teachers

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/teachers` | List teachers with pagination/filter/search | Tenant scoped |
| POST | `/api/teachers` | Create teacher | Tenant scoped with writable school |
| GET | `/api/teachers/[teacherId]` | Get teacher | Tenant scoped |
| PATCH | `/api/teachers/[teacherId]` | Update teacher | Tenant scoped |

### Students

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/students` | List students with pagination/filter/search | Tenant scoped |
| POST | `/api/students` | Create student | Tenant scoped with writable school |
| GET | `/api/students/[studentId]` | Get student | Tenant scoped |
| PATCH | `/api/students/[studentId]` | Update student | Tenant scoped |

### Subscriptions

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/subscriptions` | List subscriptions | Tenant scoped |
| POST | `/api/subscriptions` | Create subscription | SuperAdmin |
| GET | `/api/subscriptions/[subscriptionId]` | Get subscription | Tenant scoped |
| PATCH | `/api/subscriptions/[subscriptionId]` | Update subscription | SuperAdmin |

---

## 7. Language System

### Current Language Architecture

The approved internationalization architecture is native React translation.

Core files:

- `lib/i18n/translations.ts`
- `lib/i18n/ui.ts`
- `components/language-provider.tsx`

### Translation Dictionaries

`lib/i18n/translations.ts` contains centralized dictionaries for:

- Arabic (`AR`)
- English (`EN`)

The helper `translate(language, key)` returns the translated value or falls back to Arabic or the key.

### LanguageProvider

`components/language-provider.tsx`:

- Loads persisted language from `/api/settings` when authenticated.
- Uses Arabic as fallback before authentication or when settings cannot be loaded.
- Exposes `language`.
- Exposes `setLanguage`.
- Exposes `refreshLanguage`.
- Exposes `t(key)`.
- Updates `document.documentElement.lang`.
- Updates `document.documentElement.dir`.

### SchoolSettings.language

`SchoolSettings.language` stores the selected language per school.

Supported values:

- `AR`
- `EN`

Settings page saves language through `PATCH /api/settings`.

### HTML Language and Direction

Arabic:

- `html lang = ar`
- `html dir = rtl`

English:

- `html lang = en`
- `html dir = ltr`

### DOM Translation Rejection

DOM translation was rejected and must never be reintroduced.

Forbidden approaches:

- DOM text-node scanning.
- Runtime text replacement.
- `MutationObserver` translation.
- `querySelectorAll` translation.
- `innerText` or `textContent` replacement for translation.
- Placeholder, aria-label, or title scanning for translation.
- Browser auto-translate or compatibility overlays.

Required approach:

- Render translated text before paint using React state, dictionaries, and `t(key)`.

---

## 8. Card Identity System

### Teacher Card Format

```text
TCH-########
```

Example:

```text
TCH-10000001
```

### Student Card Format

```text
STD-########
```

Example:

```text
STD-10000001
```

### Purpose

Card identities are reserved for future:

- RFID cards
- NFC cards
- QR cards
- Mobile identity cards

Current status:

- Card identity fields exist on Teacher and Student.
- Card scanning is not implemented.
- RFID attendance is not implemented.

---

## 9. Mandatory Development Rules

These rules are mandatory for future AI tools and developers.

1. Do not redesign the approved UI.
2. Preserve existing UX, routing, navigation, layout, branding, and dashboard structure.
3. All future school-scoped entities must include `school_id`.
4. Maintain tenant isolation in every API.
5. SchoolAdmin must never access another school's data.
6. SuperAdmin access must remain explicit and intentional.
7. Preserve classroom code standards.
8. Use classroom codes such as `P1A`, `M2B`, and `H3B`; do not use long classroom names internally.
9. Do not bypass authorization helpers.
10. Do not introduce DOM translation.
11. Keep Arabic and English fully supported.
12. Use centralized translation keys.
13. Do not scatter hardcoded bilingual conditionals across pages.
14. Do not create new database entities unless the phase explicitly requires them.
15. Do not start future phases early.
16. Do not implement devices, RFID, attendance engine, reports engine, or AI unless explicitly requested.
17. Preserve `school_code` as permanent and unique.
18. Use `school_id` internally for foreign keys.
19. Preserve card identity formats.
20. Commit changes and push to the official Class-Room repository when requested and when credentials allow.

---

## 10. Classroom Structure

### Current Convention

Classroom codes are short operational identifiers.

Format:

```text
[LevelPrefix][GradeNumber][SectionLetter]
```

Level prefixes:

- `P`: Primary
- `M`: Middle
- `H`: High

Examples:

- `P1A`: Primary, grade 1, section A
- `P1B`: Primary, grade 1, section B
- `P2A`: Primary, grade 2, section A
- `P6B`: Primary, grade 6, section B
- `M1A`: Middle, grade 1, section A
- `M2B`: Middle, grade 2, section B
- `M3A`: Middle, grade 3, section A
- `H1A`: High, grade 1, section A
- `H2B`: High, grade 2, section B
- `H3B`: High, grade 3, section B

Seeded classroom list currently includes:

- `P1A`, `P1B`, `P2A`, `P2B`, `P3A`, `P3B`, `P4A`, `P4B`, `P5A`, `P5B`, `P6A`, `P6B`
- `M1A`, `M1B`, `M2A`, `M2B`, `M3A`, `M3B`
- `H1A`, `H1B`, `H2A`, `H2B`, `H3A`, `H3B`

Rules:

- `classroom_code` is unique per school and academic year.
- Future devices, students, attendance records, RFID events, reports, and analytics should reference classrooms by internal `classroom_id`, while displaying the classroom code where appropriate.

---

## 11. Device Roadmap

Status: planned, not implemented.

Intended purpose:

Create a device foundation for smart classroom hardware such as sound sensors, RFID readers, and gateway devices.

Planned architecture direction:

- Devices should belong to a school through `school_id`.
- Devices should optionally attach to a classroom through `classroom_id`.
- Provisioning may use `school_code` as a human-readable identifier.
- Internal relations should still use `school_id`.
- Device status, firmware, serial numbers, and hardware capabilities should be modeled explicitly when the device phase begins.

Not implemented:

- Device database model.
- Device provisioning.
- Device API.
- Live device telemetry ingestion.

Note:

The current `/devices` page exists as part of the dashboard experience and uses mock data.

---

## 12. RFID Roadmap

Status: planned, not implemented.

Intended purpose:

Use Teacher and Student `card_code` identities for future RFID/NFC/QR/mobile identity workflows.

Planned architecture direction:

- RFID events should include `school_id`.
- RFID events should reference known card identities.
- Student attendance should resolve from `card_code` to Student.
- Teacher identity may resolve from `card_code` to Teacher.
- Device-to-school assignment should prevent cross-school card/event leakage.

Not implemented:

- RFID scanning.
- RFID event ingestion.
- Attendance calculation.
- Card registration workflow.
- Device-card binding.

---

## 13. Movement Tracking Roadmap

Status: planned, not implemented.

Intended purpose:

Track student exits and returns from classrooms using future device/RFID/card activity.

Planned architecture direction:

- Movement records should include `school_id`.
- Movement records should reference `student_id`.
- Movement records should reference `classroom_id`.
- Movement records should be connected to an academic year when implemented.
- Movement rules should respect school settings such as `student_exit_limit_minutes` and movement alert toggles.

Not implemented:

- Movement tracking database model.
- Live movement event processing.
- Movement alert engine.

Note:

The current movement page displays mock/prototype dashboard data.

---

## 14. Reporting Roadmap

Status: planned, not implemented.

Intended purpose:

Provide school, academic year, level, classroom, teacher, student, attendance, movement, and device reports.

Planned architecture direction:

- Reports should be tenant-scoped by `school_id`.
- Reports should use academic hierarchy filters.
- Reports should support export actions when implemented.
- Reports should consume real attendance, movement, device, and academic data once those modules exist.

Not implemented:

- Report database model.
- Report generation engine.
- Export generation.
- Scheduled reports.

Note:

The current reports page displays mock/prototype report cards.

---

## 15. AI Roadmap

Status: planned, not implemented.

Intended purpose:

Add future AI insights over school operations, attendance, movement, classroom noise, devices, and reports.

Planned architecture direction:

- AI must be tenant-isolated.
- AI insights must not leak data across schools.
- AI should consume normalized reporting/analytics data after operational engines exist.
- AI output should be explainable enough for school administrators.

Not implemented:

- AI database model.
- AI inference pipeline.
- AI recommendations engine.
- AI-generated reports.

Note:

The current AI insights component displays mock/prototype content only.

---

## 16. Project Roadmap

### Completed

- Phase 2A SaaS Foundation
- Phase 2A.1 School Approval Workflow
- Phase 2B Academic Structure Foundation
- Phase 2B.5 Settings Persistence + Language Foundation
- Phase 2C Teachers and Students Foundation
- Phase 2B.6R Native Internationalization Refactor

### Next

- Phase 2D Devices Foundation
- Phase 2E RFID + Attendance
- Phase 2F Movement Tracking
- Phase 2G Reporting
- Phase 3.0 AI Layer

### Planned Detail

Phase 2D Devices Foundation:

- Intended to add device models, provisioning architecture, and tenant-isolated device APIs.

Phase 2E RFID + Attendance:

- Intended to add card scanning/event ingestion and attendance calculation.

Phase 2F Movement Tracking:

- Intended to add student exit/return tracking and movement rules.

Phase 2G Reporting:

- Intended to add reporting data models, generation, and exports.

Phase 3.0 AI Layer:

- Intended to add AI insights and analytics after real operational data exists.

---

## 17. Known Decisions

### Native Internationalization Approved

The approved language architecture is native React translation through centralized dictionaries and `t(key)`.

### DOM Translation Rejected

DOM translation, text-node scanning, runtime text patching, `MutationObserver` translation, and compatibility overlays are rejected and must never be reintroduced.

### Multi-Tenant Architecture Approved

`School` is the tenant root. School-owned data must include `school_id`.

### Tenant Isolation Is Mandatory

SchoolAdmin can access only their own school. SuperAdmin can access all schools through authorized endpoints.

### School Approval Workflow Approved

Schools must use lifecycle statuses:

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `REJECTED`

Only active schools allow SchoolAdmin login.

### Classroom Code Convention Approved

Classrooms use short platform-standard codes such as:

- `P1A`
- `M2B`
- `H3B`

### School Code Approved

`school_code` is permanent, unique, and human-readable. Internal relations use `school_id`.

### Card Identity Foundation Approved

Teacher and Student card codes are reserved for future identity systems:

- `TCH-########`
- `STD-########`

### Approved UI Must Be Preserved

The existing dashboard structure, RTL experience, navigation, styling, cards, charts, and branding are approved. Future phases must add functionality without redesigning the product unless explicitly requested.

---

## Verification Notes

This master document was created from verified repository files:

- `prisma/schema.prisma`
- `app/api/**/route.ts`
- `lib/auth/session.ts`
- `lib/academic/access.ts`
- `lib/i18n/translations.ts`
- `lib/i18n/ui.ts`
- `components/language-provider.tsx`
- Existing phase documentation under `docs/`

No application code, database schema, UI, or migrations were changed to create this document.
