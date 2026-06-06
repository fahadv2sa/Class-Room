# Phase 2B.5 Language And Settings Persistence

Phase 2B.5 makes school settings database-backed and adds the bilingual foundation for Arabic and English. It does not redesign the UI and does not implement teachers, students, devices, RFID, attendance, noise, reports, or AI.

## School Settings Model

`SchoolSettings` is a one-to-one school-scoped model.

Fields:

- `school_id`
- `language`
- `noise_threshold_db`
- `student_exit_limit_minutes`
- `noise_alerts_enabled`
- `movement_alerts_enabled`
- `attendance_alerts_enabled`
- `device_alerts_enabled`
- `daily_report_enabled`
- `school_name_override`
- `contact_phone`
- `updated_at`

Each school has one settings record. The settings row is created lazily through the API if it does not already exist, and seeded for the default schools.

## Settings APIs

Routes:

- `GET /api/settings`
- `PATCH /api/settings`

SchoolAdmin requests are automatically scoped to their own school. SuperAdmin requests must provide `schoolId` through query string or request body.

## Settings Persistence Flow

The Settings page loads settings from `GET /api/settings` and saves changes through `PATCH /api/settings`.

Persisted settings include:

- language
- noise threshold
- student exit limit
- alert toggles
- daily report toggle
- school name override
- contact phone

Settings persist across sessions, browsers, logout/login, and future deployments because they are stored in PostgreSQL.

## Language Infrastructure

Supported languages:

- `AR`
- `EN`

The selected language is stored per school in `SchoolSettings.language`.

Architecture:

- `lib/i18n/translations.ts`: centralized translation dictionaries.
- `components/language-provider.tsx`: client provider for current language and translation helper.
- `useLanguage().t(key)`: reusable translation lookup.

Only these areas are wired in Phase 2B.5:

- Login page
- Level selection page
- Settings page

Remaining dashboard pages keep their approved current text until later migration phases.

## Tenant Isolation

SchoolAdmin:

- can view only their own school settings
- can update only their own school settings
- cannot override `school_id`

SuperAdmin:

- can view/manage settings for any school by passing `schoolId`

Future modules should consume `SchoolSettings` by `school_id` and avoid duplicating settings state.
