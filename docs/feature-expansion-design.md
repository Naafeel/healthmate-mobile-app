# Prompt 08A feature architecture

## Scope and persistence

HealthMate 1.0.1 adds Light/Dark/System appearance, opt-in offline daily reminders, quick water increments, complete local JSON backup/restore and previous-period comparisons. The prior first-digit source correction remains in commit e227d3a. There are still four tabs and one daily record per date. No cloud account, remote notifications, water-event ledger, medical interpretation or paid service is introduced.

SQLite is canonical. `preferencesMigration.initializeDatabase` retains the original v1/v2 migration implementation and SQL unchanged, applies those migrations for old databases, and then adds v3 `app_preferences`. The new singleton stores theme, reminder-enabled preference, hour and minute with SQL constraints. Defaults are System, reminders off, time 20:00; defaults do not seed activity or recommended goals. Reopening v3 is idempotent; future versions reject. The original migration tests still directly verify their original v1/v2 contract; new tests verify runtime v3 upgrades and reopening.

Whole repository operations use a shared FIFO database gate. Snapshot and restore hold this same gate across their entire transaction, preventing ordinary record, goal and preference writes from interleaving on the shared connection. Independent SQLite clients still receive SQLite's normal transaction/locking protection.

## Appearance

`theme/tokens.ts` centralizes both palettes and unchanged geometry/typography. `useTheme` resolves one persisted preference against React Native's reactive system color scheme. Every previous color consumer now reads the hook and creates any styles from that resolved theme. Explicit appearance also updates Android through Appearance; System releases the override with the installed React Native 0.88 `unspecified` value. Status bar foreground, tabs, welcome, forms, calendar, chart, progress and new settings use the same theme. Native dialogs follow Android's app appearance. Numeric cursor/selection use the current primary color. Pure palette tests calculate WCAG contrast for text, buttons, disabled labels and semantic metric pairs; this is not a claim of complete accessibility conformance.

## Daily reminders

SDK-compatible expo-notifications 58.1.5 supplies only local notifications. There is no token registration or server. The Android channel is healthmate-daily and the stable notification identifier is healthmate-daily-reminder. The SDK 58 DAILY trigger uses local hour/minute with bestEffort delivery. Exact-alarm permissions are explicitly blocked. Notification content contains no measurements.

Permission is requested only after explicit Enable. Persisted intent and actual scheduling are distinct: denied permission or native scheduling failure leaves an explanatory status and retry/settings actions. A serialized reconciler reads the latest preferences, checks existing own schedules, cancels only its own identifiers, and retains one matching schedule. Time/timezone/offset changes cause rescheduling on reconciliation; launch, foreground, preference changes and restore trigger it. Expo handles the platform's stored schedule lifecycle; immediate timezone changes while the app never resumes and OEM-specific behavior remain device-testing limitations. A notification tap launches the existing app safely; no extra navigation stack is forced during initialization.

Normal Android delivery can be late or suppressed by permission, battery restrictions, OEM behavior or force-stop. It is a generic reminder even if today is already recorded. Scheduling success is never described as proof of delivery.

## Quick water

The canonical SQLite repository executes one conditional `UPDATE water=water+? ... RETURNING` by unique date. Accepted increments are 250, 500 and 1000 ml. SQL simultaneously checks the 20,000 ml maximum and preserves ID, steps and calories. Concurrent repository increments are additive; UI/store mutation guards reject accidental overlapping taps rather than queueing ambiguous duplicate actions. The shared record list updates from the saved row, refreshing goals and analytics without redundant aggregates.

If today is missing, Dashboard navigates to the existing Add form with a validated supported water prefill. Steps/calories remain blank and required. No fake zero summary is created. Error feedback is preserved on failure; refresh is only initiated after a successful increment.

## Backup format and safety

A backup is readable JSON, not encryption:

```json
{
  "format": "healthmate-backup",
  "version": 1,
  "exportedAt": "2026-10-21T10:00:00.000Z",
  "records": [],
  "goals": {"steps": null, "calories": null, "water": null},
  "preferences": {"theme": "system", "reminderEnabled": false, "reminderHour": 20, "reminderMinute": 0}
}
```

The example documents structure, not seeded data. Records contain only date/steps/calories/water, sorted oldest first. IDs, migration metadata, notification IDs, device identifiers, signing keys and caches are excluded. A consistent read transaction captures persisted records, goals and preferences. The local native file is read back and compared before Sharing opens. Share dismissal cannot confirm a receiving application saved it. The cache copy has an explicit removal action and one-hour eligibility for cleanup on later launch/export.

Restore uses expo-document-picker 58.0.4 with copyToCacheDirectory and JSON selection. Cancellation changes nothing. File extension, 5 MB size, JSON structure, exact keys, format/version, ISO timestamp, 20,000-record bound, dates, unique dates, numeric limits, nullable positive goals and preferences are validated before a preview. Unknown fields and internal IDs reject. Copied picker cache files are removed after reading; the user's selected source is not deleted.

The preview states record count/date span, goals, appearance, reminder settings, creation timestamp and replacement semantics. A second explicit confirmation is required. Replace validates again, opens BEGIN IMMEDIATE, replaces records, upserts goals/preferences and commits only after all writes succeed. Failures roll back. It never modifies PRAGMA user_version or blindly restores database files. Desktop tests inject a failure after deletion/insertion and verify original records, goals and preferences survive.

After commit, all canonical stores are reloaded under the database gate. Store revision counters reject older in-flight loads, and the goal editor is remounted to discard stale unsaved drafts. Common actions are disabled during restore. Reminder scheduling is then reconciled without requesting transferred permission. A scheduling failure is reported separately from a successful database restore. If post-commit reload fails, feedback explicitly says data committed and asks for restart, rather than falsely claiming rollback.

## Comparisons

Pure memoized selectors derive all totals from canonical records. Completed historical weeks compare complete Monday–Sunday weeks; completed months compare complete calendar months. In-progress periods compare equal elapsed-day windows. If the previous month has fewer days, both partial windows cap at that previous month's available days, explicitly explained in UI. This avoids comparing a partial current period against a full previous period.

Difference = current saved total minus previous saved total. Percentage = difference / previous saved total × 100 only when previous is nonzero and both windows contain records. Positive current against saved previous zero says Increase from zero; both zero gives an undefined-percentage explanation. Missing records produce insufficient-data feedback rather than fabricated zeros. Each total includes a recorded-day coverage denominator, so sparse logging is visible. Original total/average/highest/chart features remain intact. These are activity comparisons, not medical outcomes.

## Verification boundaries

See feature-expansion-verification.md for executed checks and native evidence. Desktop SQLite tests execute production SQL but do not prove Android file pickers, IME behavior, notification delivery or screen-reader speech. Physical-phone testing remains separate from emulator checks. AI-assisted implementation/test authoring is recorded honestly; student review and physical-device retesting remain required.
