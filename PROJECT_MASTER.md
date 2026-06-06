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

ClassPulse AI is a school operations platform for smart classroom management. The current repository implements the SaaS, authentication, tenant, academic structure, settings, language, teacher, student, and classroom device foundations that later operational modules will use.

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

The platform is moving from a dashboard prototype toward a production SaaS system. The current architecture is tenant-first and includes a classroom device foundation that prepares for RFID/NFC identity, attendance, movement tracking, reports, and AI, but those later modules are not implemented yet unless explicitly listed as completed in this document.

---

## 2. Current System Status

### Completed

- Phase 2A SaaS Foundation
- Phase 2A.1 School Approval Workflow
- Phase 2B Academic Structure Foundation
- Phase 2B.5 Settings Persistence + Language Foundation
- Phase 2C Teachers and Students Foundation
- Phase 2B.6R Native Internationalization Refactor
- Phase 2D Classroom Device Foundation
- Phase 2E RFID Attendance Engine Foundation
- Phase 2F Classroom Presence & Movement Foundation
- Phase 2F.1 Direction & Session Integrity Correction
- Phase 2G Live Noise Monitoring, Classroom Averages & Teacher-Linked Noise Scoring Foundation

### In Progress

- No active in-progress phase is represented by committed code in the current repository.

### Planned

- Phase 2H Reporting
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

### Phase 2D: Classroom Device Foundation

Objective:

Create the software foundation for one integrated Class-Room Device per classroom without starting RFID attendance, movement tracking, noise telemetry processing, reports, or AI.

Implemented:

- `ClassroomDevice` database model.
- Permanent globally unique `device_code` using `CRD-########`.
- Device serial number, firmware version, hardware version, lifecycle status, connection status, capabilities, installation, registration, last-seen, retirement, notes, and provisioning metadata.
- Tenant-scoped classroom device APIs.
- Database-backed Devices page data loading.
- Seeded one realistic Class-Room Device for every seeded classroom.

Major architectural decisions:

- A Class-Room Device is one integrated classroom device mounted near the classroom door.
- RFID reader, noise sensor, LED indicators, connectivity, local controller, firmware, and future expansion are capabilities of the integrated Class-Room Device.
- The platform must not model separate RFID reader, noise sensor, LED, or gateway entities in this phase.
- Device lifecycle status and connection status are separate concepts. For example, an `ACTIVE` device may be `OFFLINE`.
- Internal relations use `school_id`, `classroom_id`, and the device primary key. `device_code` is a permanent human-readable support/provisioning identifier.

APIs added:

- `GET /api/classroom-devices`
- `POST /api/classroom-devices`
- `GET /api/classroom-devices/[deviceId]`
- `PATCH /api/classroom-devices/[deviceId]`

Database entities added:

- `ClassroomDevice`

### Phase 2E: RFID Attendance Engine Foundation

Objective:

Create the foundation for RFID-based classroom attendance using the single integrated Class-Room Device installed in each classroom.

Implemented:

- `CardCredential` registry for physical student and teacher cards.
- `RFIDScanEvent` raw scan event history.
- `ClassroomAttendanceSession` for classroom attendance sessions.
- `StudentAttendanceRecord` for per-student attendance state inside a session.
- Authenticated RFID scan simulation endpoint.
- Duplicate scan protection using `source_event_id` and a conservative 10-second repeated-scan window.
- Attendance session APIs.
- Attendance record listing API.
- Database-backed Attendance page data loading.
- Seeded card credentials for all seeded teachers and students.
- Seeded classroom attendance sessions and attendance records for seeded classrooms.

Major architectural decisions:

- RFID scans come from the existing integrated `ClassroomDevice`.
- No standalone RFID reader, noise sensor, gateway, or other separate hardware device model was created.
- Future scans resolve through `CardCredential`, while existing `Teacher.card_code` and `Student.card_code` remain in place.
- Unknown cards are stored as `RFIDScanEvent` rows instead of being silently discarded.
- Student entry scans update attendance records only; they do not create movement analytics.
- Teacher scans are stored and teacher entry may associate a teacher with the open classroom attendance session.

APIs added:

- `POST /api/rfid/scans`
- `GET /api/rfid/scans`
- `GET /api/attendance-sessions`
- `POST /api/attendance-sessions`
- `GET /api/attendance-sessions/[sessionId]`
- `PATCH /api/attendance-sessions/[sessionId]`
- `POST /api/attendance-sessions/[sessionId]/close`
- `GET /api/attendance-records`

Database entities added:

- `CardCredential`
- `RFIDScanEvent`
- `ClassroomAttendanceSession`
- `StudentAttendanceRecord`

Not implemented:

- Movement tracking analytics.
- Noise telemetry.
- Reporting engine.
- AI.
- Real device authentication.
- MQTT, offline queues, real-time streaming, or firmware logic.

### Phase 2F: Classroom Presence & Movement Foundation

Objective:

Create the operational classroom presence layer that answers who is present, absent, late, inside the classroom, outside the classroom, and whether a teacher is currently inside.

Implemented:

- `StudentPresenceState` current-state model.
- `TeacherPresenceState` current-state model.
- `StudentMovementRecord` movement cycle model.
- `TeacherMovementRecord` classroom entry/exit model.
- `SchoolSettings.late_threshold_minutes`.
- RFID processing updates presence and movement state from accepted `RFIDScanEvent` rows.
- Classroom presence APIs.
- Student movement APIs.
- Teacher movement API.
- Database-backed Movement page.
- Settings page support for per-school late threshold.

Major architectural decisions:

- `RFIDScanEvent` remains the single source of truth.
- Presence state is current operational state only.
- Movement records are derived from RFID scan events and retain references to source scan event rows.
- EXIT scans open student movement cycles.
- ENTRY scans close the latest open student movement cycle.
- Teacher movement tracks classroom entry/exit only and is not performance evaluation.
- The late rule is per school and defaults to 10 minutes after attendance session start.

APIs added:

- `GET /api/presence/classrooms`
- `GET /api/presence/classrooms/[classroomId]`
- `GET /api/movements/students`
- `GET /api/movements/students/[studentId]`
- `GET /api/movements/teachers`

Database entities added:

- `StudentPresenceState`
- `TeacherPresenceState`
- `StudentMovementRecord`
- `TeacherMovementRecord`

Not implemented:

- Noise monitoring.
- Reporting engine.
- AI.
- Timetables.
- School-wide gate attendance.
- Teacher schedule management.

### Phase 2F.1: Direction & Session Integrity Correction

Objective:

Correct RFID direction inference and attendance session date isolation while preserving the one-device classroom architecture.

Implemented:

- Server-side RFID direction inference from current presence state.
- First valid scan in a session is treated as `ENTRY`.
- `INSIDE_CLASSROOM` scans are treated as `EXIT`.
- `OUTSIDE_CLASSROOM`, `ABSENT`, or no state scans are treated as `ENTRY`.
- Open attendance sessions are date-safe.
- Previous-day open classroom sessions are closed before a new dated session is used.

Major architectural decisions:

- The system does not require direction sensors, dual readers, entry readers, exit readers, timetable logic, or AI to infer classroom entry and exit.
- Missed scans may affect one user in one attendance session, but future sessions remain isolated.
- Existing RFID, attendance, presence, and movement models were preserved.

APIs added:

- No new API was added in Phase 2F.1.

Database entities added:

- No database entity was added in Phase 2F.1.

### Phase 2G: Live Noise Monitoring, Classroom Averages & Teacher-Linked Noise Scoring Foundation

Objective:

Create the live classroom noise monitoring foundation using the existing integrated Class-Room Device without storing raw continuous noise readings.

Implemented:

- `NoiseEvent` for significant classroom noise incidents only.
- `ClassroomNoiseState` for current live classroom noise status.
- `ClassroomNoiseSummary` for daily classroom noise metrics.
- `TeacherNoiseSummary` for daily teacher-linked noise metrics.
- Per-school `SchoolSettings.noise_duration_seconds`.
- Noise reading ingestion/simulation API.
- Event creation only after noise stays above threshold for the configured duration.
- Active noise event closure when noise returns below threshold.
- Classroom summary recalculation when events close.
- Teacher summary recalculation when teacher-linked events close.
- Existing Noise page connected to database-backed noise APIs while keeping the approved layout.

Major architectural decisions:

- Noise data comes from the existing integrated `ClassroomDevice`.
- No separate noise device, standalone sensor, gateway, or hardware model was created.
- Continuous device readings are not stored as permanent raw rows.
- Persistent storage is event-based, summary-based, and current-state based.
- `NoiseEvent.teacher_id` is linked from `TeacherPresenceState` when a teacher is currently `INSIDE_CLASSROOM`.
- `NoiseEvent.attendance_session_id` links to the current open classroom attendance session when available.
- The quiet score is a foundation metric only, not a final report or teacher ranking.
- No AI, predictive analytics, final reporting engine, automated decisions, or disciplinary scoring were added.

Quiet score formula:

- Start from `100`.
- Subtract `total_noise_seconds / 60`.
- Subtract `5` points per high-severity event.
- Subtract `0.5` points for each dB above `70` at daily peak.
- Clamp result from `0` to `100`.

APIs added:

- `POST /api/noise/readings`
- `GET /api/noise/events`
- `GET /api/noise/classrooms`
- `GET /api/noise/classrooms/[classroomId]`
- `GET /api/noise/teachers`

Database entities added:

- `NoiseEvent`
- `ClassroomNoiseState`
- `ClassroomNoiseSummary`
- `TeacherNoiseSummary`

Database changes:

- `SchoolSettings.noise_duration_seconds`

Not implemented:

- Raw per-second or per-millisecond noise storage.
- Separate noise sensor or noise device model.
- AI.
- Final classroom ranking UI.
- Final teacher ranking UI.
- Reports engine.
- PDF exports.
- Automated disciplinary decisions.

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
- `20260606160000_classroom_device_foundation`
- `20260606170000_rfid_attendance_engine_foundation`
- `20260606180000_classroom_presence_movement_foundation`
- `20260607100000_live_noise_monitoring_foundation`

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

- Owns SchoolAdmins, SchoolSettings, AcademicYears, SchoolLevels, Classrooms, ClassroomDevices, CardCredentials, RFIDScanEvents, AttendanceSessions, AttendanceRecords, Teachers, Students, Subscriptions, and Sessions.

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
- Owns ClassroomAttendanceSessions.

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
- Has ClassroomDevices.
- Has RFIDScanEvents, AttendanceSessions, and AttendanceRecords.

Important constraints:

- Unique `school_id + academic_year_id + classroom_code`.
- `classroom_code` is the platform operational classroom identifier.

### ClassroomDevice

Purpose:

Integrated Class-Room Device installed for one classroom.

Key relationships:

- Belongs to School.
- Has CardCredentials.
- May be associated with ClassroomAttendanceSessions.
- May be referenced by RFIDScanEvents.
- Belongs to Classroom.

Important constraints:

- Unique immutable `device_code` using `CRD-########`.
- Unique `serial_number`.
- Every device includes `school_id` for tenant isolation.
- Every device includes `classroom_id`.
- A partial database unique index allows only one `ACTIVE` device per classroom while preserving retired historical devices.
- `status` is `ACTIVE`, `MAINTENANCE`, or `RETIRED`.
- `connection_status` is `ONLINE`, `OFFLINE`, or `UNKNOWN`.
- `capabilities` stores future-safe integrated device capabilities such as `RFID`, `NOISE_MONITORING`, `LED_INDICATORS`, and `FIRMWARE_UPDATES`.
- Provisioning metadata stores hashes and timestamps only; raw pairing tokens must not be stored.

### CardCredential

Purpose:

Registry for physical RFID/NFC/QR/mobile-style cards assigned to students and teachers.

Key relationships:

- Belongs to School.
- Belongs to either Student or Teacher.
- Can be referenced by RFIDScanEvent.

Important constraints:

- `card_code` is globally unique.
- Supports existing `STD-########` and `TCH-########` formats.
- Allows only one active card per student.
- Allows only one active card per teacher.
- Existing `Student.card_code` and `Teacher.card_code` remain in place for backward compatibility.

### RFIDScanEvent

Purpose:

Raw scan event history from the integrated Class-Room Device.

Key relationships:

- Belongs to School.
- Belongs to ClassroomDevice.
- Belongs to Classroom.
- May reference CardCredential.
- May reference Student or Teacher.
- May link to another scan event as a duplicate.

Important constraints:

- Always stores raw `card_code`, including unknown cards.
- Stores `actor_type`, `scan_direction`, and `scan_status`.
- Duplicate protection links repeated scans instead of processing them twice.
- Does not create movement records.

### ClassroomAttendanceSession

Purpose:

Attendance session for one classroom using one integrated classroom device.

Key relationships:

- Belongs to School.
- Belongs to AcademicYear.
- Belongs to Classroom.
- Belongs to ClassroomDevice.
- May reference Teacher.
- Owns StudentAttendanceRecords.

Important constraints:

- Status is `OPEN` or `CLOSED`.
- Allows only one open session per classroom.
- This is not a timetable or schedule system.

### StudentAttendanceRecord

Purpose:

Per-student attendance state inside a classroom attendance session.

Key relationships:

- Belongs to School.
- Belongs to ClassroomAttendanceSession.
- Belongs to Classroom.
- Belongs to Student.

Important constraints:

- Unique `attendance_session_id + student_id`.
- Status is `ABSENT`, `PRESENT`, `LATE`, or `EXCUSED`.
- ENTRY scans can mark a student present.
- EXIT scans can update `last_exit_at`.
- Presence and movement state are derived from RFIDScanEvent.

### StudentPresenceState

Purpose:

Current live classroom presence state for one student in one attendance session.

Key relationships:

- Belongs to School.
- Belongs to Classroom.
- Belongs to Student.
- Belongs to ClassroomAttendanceSession.
- References the latest RFIDScanEvent that changed the state.

Important constraints:

- Unique `attendance_session_id + student_id`.
- State is `INSIDE_CLASSROOM`, `OUTSIDE_CLASSROOM`, or `ABSENT`.
- Derived entirely from RFIDScanEvent.

### TeacherPresenceState

Purpose:

Current classroom presence state for a teacher.

Key relationships:

- Belongs to School.
- Belongs to Classroom.
- Belongs to Teacher.
- References the latest RFIDScanEvent that changed the state.

Important constraints:

- Unique `classroom_id + teacher_id`.
- State is `INSIDE_CLASSROOM` or `OUTSIDE_CLASSROOM`.
- Derived entirely from RFIDScanEvent.
- Does not represent teacher scoring or schedule compliance.

### StudentMovementRecord

Purpose:

Derived student classroom exit/return cycle.

Key relationships:

- Belongs to School.
- Belongs to Classroom.
- Belongs to Student.
- Belongs to ClassroomAttendanceSession.
- References exit and return RFIDScanEvent rows.

Important constraints:

- Status is `OPEN` or `CLOSED`.
- EXIT scans create open records.
- ENTRY scans close the latest open record and calculate duration.
- RFIDScanEvent remains the source of truth.

### TeacherMovementRecord

Purpose:

Derived teacher classroom entry/exit log.

Key relationships:

- Belongs to School.
- Belongs to Classroom.
- Belongs to Teacher.
- References entry and exit RFIDScanEvent rows.

Important constraints:

- Status is `INSIDE` or `OUTSIDE`.
- Simple operational presence tracking only.
- Does not implement teacher attendance scoring, payroll, or schedule management.

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
- Has CardCredentials.
- Has StudentAttendanceRecords.
- May be referenced by RFIDScanEvents.

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

### Classroom Devices

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/classroom-devices` | List classroom devices with pagination, search, classroom, status, and connection filters | Tenant scoped |
| POST | `/api/classroom-devices` | Register an integrated Class-Room Device and assign it to a classroom | Tenant scoped with writable school |
| GET | `/api/classroom-devices/[deviceId]` | Get one classroom device | Tenant scoped |
| PATCH | `/api/classroom-devices/[deviceId]` | Update classroom assignment, firmware/hardware metadata, status, connection status, notes, capabilities, and provisioning metadata | Tenant scoped |

### RFID Scans

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| POST | `/api/rfid/scans` | Authenticated RFID scan simulation/ingestion for the integrated classroom device | Tenant scoped |
| GET | `/api/rfid/scans` | List raw RFID scan events with pagination and filters | Tenant scoped |

### Attendance Sessions

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/attendance-sessions` | List classroom attendance sessions | Tenant scoped |
| POST | `/api/attendance-sessions` | Create an open classroom attendance session and ABSENT records for active students | Tenant scoped with writable school |
| GET | `/api/attendance-sessions/[sessionId]` | Get one attendance session | Tenant scoped |
| PATCH | `/api/attendance-sessions/[sessionId]` | Update basic session metadata | Tenant scoped |
| POST | `/api/attendance-sessions/[sessionId]/close` | Close an open attendance session | Tenant scoped |

### Attendance Records

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/attendance-records` | List per-student attendance records with pagination and filters | Tenant scoped |

### Presence

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/presence/classrooms` | List current classroom presence summaries | Tenant scoped |
| GET | `/api/presence/classrooms/[classroomId]` | Get current presence state for one classroom | Tenant scoped |

### Movements

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| GET | `/api/movements/students` | List derived student movement records | Tenant scoped |
| GET | `/api/movements/students/[studentId]` | List movement records for one student | Tenant scoped |
| GET | `/api/movements/teachers` | List derived teacher movement records | Tenant scoped |

### Noise

| Method | Route | Purpose | Permissions |
|---|---|---|---|
| POST | `/api/noise/readings` | Ingest or simulate current noise reading from an integrated classroom device | Tenant scoped |
| GET | `/api/noise/events` | List significant noise events with filters and pagination | Tenant scoped |
| GET | `/api/noise/classrooms` | List classroom live noise states and daily summaries | Tenant scoped |
| GET | `/api/noise/classrooms/[classroomId]` | Show one classroom noise state, summary, and recent events | Tenant scoped |
| GET | `/api/noise/teachers` | List teacher-linked daily noise summaries | Tenant scoped |

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

Card identities are used by the Phase 2E attendance foundation and remain compatible with future:

- RFID cards
- NFC cards
- QR cards
- Mobile identity cards

Current status:

- Card identity fields exist on Teacher and Student.
- CardCredential registry exists for physical student and teacher cards.
- Authenticated RFID scan simulation stores raw scan events.
- RFID attendance sessions and student attendance records are implemented.
- Production hardware authentication is not implemented yet.

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
16. Do not extend beyond the implemented classroom device and RFID attendance foundations into movement tracking, noise telemetry, reports engine, or AI unless explicitly requested.
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

Status: Phase 2D foundation implemented.

Implemented purpose:

Create the software foundation for the integrated Class-Room Device that belongs to a school and classroom.

Implemented architecture:

- The Class-Room Device is one integrated physical classroom device, not a collection of independent hardware entities.
- The device is mounted near the classroom door.
- The device may contain RFID reader capability, noise monitoring capability, LED indicator capability, connectivity, local controller, firmware, and future expansion capability.
- RFID readers, noise sensors, LED indicators, and gateways must not be modeled as separate entities in Phase 2D.
- Every device belongs to one school through `school_id`.
- Every device belongs to one classroom through `classroom_id`.
- A classroom can have only one `ACTIVE` device at a time.
- Internal relations use the device primary key, `school_id`, and `classroom_id`.
- `device_code` is a permanent, immutable, human-readable identifier for support and future provisioning.
- Capabilities are metadata only in Phase 2D and do not implement RFID, noise telemetry, LED behavior, or firmware delivery.

Implemented:

- Device database model.
- Device API.
- Tenant isolation for device reads and writes.
- Database-backed `/devices` page.
- Provisioning metadata fields.

Not implemented:

- Provisioning workflow.
- Live device telemetry ingestion.
- Production hardware RFID scanning.
- Device-authenticated attendance ingestion.
- Classroom presence and movement state are implemented in Phase 2F from RFIDScanEvent.
- Live noise monitoring is implemented in Phase 2G.

Note:

The current `/devices` page keeps the approved dashboard layout and now loads classroom device identity and health metadata from the database. It does not display or process live telemetry.

---

## 12. RFID Attendance Foundation

Status: Phase 2E foundation implemented.

Implemented purpose:

Use Teacher and Student card identities through CardCredential records for RFID-based classroom attendance.

Implemented architecture:

- RFID scans come from the existing integrated Class-Room Device.
- RFID scan events include `school_id`.
- RFID scan events preserve raw `card_code`.
- Known cards resolve through CardCredential.
- Student attendance resolves from CardCredential to Student.
- Teacher identity resolves from CardCredential to Teacher.
- Device, classroom, card, student, teacher, session, and record relations are tenant scoped.
- Duplicate scans are stored and linked when detected.
- Attendance updates do not create movement analytics.

Implemented:

- CardCredential registry.
- Raw RFIDScanEvent history.
- Authenticated scan simulation API.
- ClassroomAttendanceSession.
- StudentAttendanceRecord.
- Database-backed Attendance page.

Not implemented:

- Production device authentication.
- MQTT or real-time streaming.
- Offline device queue.
- Firmware logic.
- Advanced movement analytics and reports.
- Reporting engine.

---

## 13. Classroom Presence & Movement Foundation

Status: Phase 2F foundation implemented.

Implemented purpose:

Track current classroom presence and simple classroom entry/exit movement cycles from RFIDScanEvent.

Implemented architecture:

- RFIDScanEvent remains the single source of truth.
- StudentPresenceState stores current live state only.
- TeacherPresenceState stores current teacher classroom presence only.
- StudentMovementRecord represents open or completed student exit/return cycles.
- TeacherMovementRecord represents teacher classroom entry/exit state.
- Movement records include `school_id`.
- Movement records reference classroom, person, attendance session where applicable, and source scan event rows.
- The late threshold rule uses `SchoolSettings.late_threshold_minutes`.

Implemented:

- Student presence model.
- Teacher presence model.
- Student movement model.
- Teacher movement model.
- Classroom presence APIs.
- Movement listing APIs.
- Database-backed Movement page.

Not implemented:

- Movement reports.
- Movement analytics dashboards beyond the approved existing page.
- Movement alert engine.
- Timetables or teacher schedules.

Note:

The current movement page keeps the approved layout and now reads derived movement data from database APIs.

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
- Phase 2D Classroom Device Foundation
- Phase 2E RFID Attendance Engine Foundation
- Phase 2F Classroom Presence & Movement Foundation
- Phase 2F.1 Direction & Session Integrity Correction
- Phase 2G Live Noise Monitoring, Classroom Averages & Teacher-Linked Noise Scoring Foundation

### Next

- Phase 2H Reporting
- Phase 3.0 AI Layer

### Planned Detail

Phase 2H Reporting:

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
