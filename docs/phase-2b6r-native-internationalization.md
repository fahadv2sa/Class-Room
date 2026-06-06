# Phase 2B.6R Native Internationalization Refactor

Phase 2B.6R removes the rejected DOM translation overlay and restores a native React/Next.js internationalization architecture.

## Removed Rejected Approach

The rejected compatibility overlay was removed completely:

- no DOM text-node translation
- no runtime text replacement
- no `MutationObserver`
- no placeholder, aria-label, or title scanning
- no `lib/i18n/dom-translations.ts`

## Native Architecture

Translations are centralized in `lib/i18n/translations.ts`.

`components/language-provider.tsx` now:

- reads persisted school language from `/api/settings`
- exposes `language`
- exposes `setLanguage`
- exposes `refreshLanguage`
- exposes `t(key)`
- updates `html lang`
- updates `html dir`
- re-renders React UI naturally through state

Shared helpers in `lib/i18n/ui.ts` provide stable mapping for:

- level labels
- noise status labels
- percentage formatting
- minute formatting
- level-aware subtitles

## Persistence

Language persistence remains unchanged:

- `SchoolSettings.language`
- `GET /api/settings`
- `PATCH /api/settings`
- Settings page save flow

SchoolAdmin sessions continue using the school configured language. English uses LTR and Arabic uses RTL.

## Converted Areas

Native translation keys are now wired through:

- Login
- Level selection
- Settings
- Sidebar
- Topbar
- Dashboard
- Classrooms
- Attendance
- Movement
- Noise monitoring
- Teachers
- Students
- Reports
- Alerts
- Devices
- Shared classroom cards
- Shared noise labels
- Shared chart labels
- AI insight container

Dynamic entity names such as school names, teacher names, student names, classroom codes, and device IDs remain untranslated.
