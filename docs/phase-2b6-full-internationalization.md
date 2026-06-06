# Phase 2B.6 Full Internationalization

Phase 2B.6 completes the Arabic and English language foundation without redesigning the approved UI.

## Architecture

The platform continues to use the centralized translation dictionary in `lib/i18n/translations.ts` for explicit React translation keys.

Phase 2B.6 adds `lib/i18n/dom-translations.ts` as a centralized compatibility layer for approved pages and shared components that still render legacy Arabic text from existing mock/dashboard data. This keeps translation strings in one place while avoiding layout rewrites.

`components/language-provider.tsx` now:

- loads the school language from `GET /api/settings`
- keeps the selected language available through `useLanguage()`
- updates `document.documentElement.lang`
- updates `document.documentElement.dir`
- applies Arabic RTL and English LTR automatically
- translates text nodes and common UI attributes such as `placeholder`, `aria-label`, and `title`
- restores original Arabic text when switching back to Arabic

## Persistence

Language remains stored in `SchoolSettings.language`.

SchoolAdmin sessions use the school configured language. SuperAdmin can continue changing language through Settings for the selected school context.

## Coverage

The full app shell and existing pages are covered:

- Login
- Level selection
- Dashboard
- Classrooms
- Classroom cards and tables
- Attendance
- Student movement
- Noise monitoring
- Teachers
- Students and student dialog
- Reports
- Alerts
- Devices
- Settings
- Sidebar
- Top navigation
- Buttons
- Badges
- Empty states
- Loading/success/error text handled through the existing provider keys

## Future Languages

Future languages such as French, Turkish, and Urdu can be added by:

1. Extending the `AppLanguage` type.
2. Adding a dictionary in `translations`.
3. Adding a DOM compatibility map for legacy/dashboard strings if needed.
4. Mapping the new language to `dir` in the language provider.
