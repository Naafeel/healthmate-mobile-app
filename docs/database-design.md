# Local SQLite record management

## Technology and coursework justification

expo-sqlite is the Expo/React Native SQLite implementation; the coursework mentions sqflite, which is a Flutter package, while Flutter is prohibited. The implementation is provisional pending lecturer clarification. SQLite remains behind HealthRecordRepository so a compatible library substitution does not alter screen business logic. This is a real device database, not a remote API or in-memory-only form.

Major dependencies: expo-sqlite (supported asynchronous device SQL), @react-native-community/datetimepicker (native Android calendar picker, included in matching Expo Go), and Zustand (canonical saved-record state shared across routes). tsx and @types/node support the development-only Node test runner and SQLite tests. No chart/form framework, cloud service or paid service was added.

## Database and schema

File: healthmate.db in Expo SQLite's default device database directory. Table: exactly health_records. New users receive an empty table; no samples are installed automatically.

| Field | SQLite type | Constraints / meaning |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT, preserved during update |
| date | TEXT | NOT NULL UNIQUE, exact YYYY-MM-DD, calendar-date CHECK |
| steps | INTEGER | NOT NULL; integer type CHECK; 0–200000 steps |
| calories | INTEGER | NOT NULL; integer type CHECK; 0–20000 kcal burned |
| water | INTEGER | NOT NULL; integer type CHECK; 0–20000 ml |

~~~mermaid
erDiagram
  health_records {
    INTEGER id PK
    TEXT date UK
    INTEGER steps
    INTEGER calories
    INTEGER water
  }
~~~

There is one daily summary per date. The UNIQUE date index also supports date lookup/order. No created/updated timestamps are required in this phase. The exact production DDL is exported as createHealthRecordsSQL in src/data/database/migrations.ts and exercised by real SQLite tests. Calendar CHECK logic includes leap-year rules; negative and decimal measurements also fail at the database boundary.

## Connection and migrations

getDatabase opens a singleton asynchronous connection with openDatabaseAsync. It runs migrations before publishing the connection. An initialization failure closes that connection and resets the promise so Retry can reopen it. Startup begins initialization through the shared store; UI remains navigable, and Records exposes loading/error/retry states.

Migration v1: enable WAL and a 5-second busy timeout; BEGIN IMMEDIATE; inspect PRAGMA user_version; if version 0, CREATE TABLE IF NOT EXISTS and set version 1; COMMIT. On error, ROLLBACK. Reopening version 1 does not recreate or drop the table. A newer-than-supported schema is rejected rather than downgraded. Future migrations must be incremental and transactional. No destructive reset command or automatic reseed exists.

## Repository contracts

| Method | Result |
| --- | --- |
| createRecord(input) | Saved record including inserted ID |
| getAllRecords() | Typed rows, newest date first |
| getRecordById(id) | Typed row or null |
| getRecordByDate(date) | Typed row or null |
| updateRecord(id,input) | Updated full summary with same ID |
| deleteRecord(id) | void; missing ID yields missing-record error |
| getRecordsByDateRange(start,end) | Inclusive typed range, newest first |

All user values are bound with SQL parameters. Only fixed schema/PRAGMA strings use execAsync. Unique-date failures become a typed duplicate error including the existing record ID; the form offers Edit existing daily record. Missing rows, validation, busy mutations and storage failures have predictable domain errors. SQL/native exception details are not exposed as arbitrary user-facing messages.

## Validation

- Date required, exact YYYY-MM-DD, actual calendar day including leap years; future dates rejected by domain and repository validation.
- Defaults use getFullYear/getMonth/getDate, never UTC conversion. Picker conversion uses local noon to avoid midnight/DST edge cases.
- Native calendar picker exposes dates from 1900-01-01 through today; the domain date validator supports years 0001–9999.
- Steps/calories/water required, trimmed digits only, non-negative safe whole numbers. Zero and leading zeros are valid. Negative/decimal/exponential/NaN/Infinity/non-numeric/unsafe values are rejected.
- Limits: 200000 steps, 20000 kcal, 20000 ml per day. These are broad data-entry safeguards, not health recommendations. They deliberately catch likely misplaced digits while allowing unusual days. The same bounds appear in domain validation and SQL CHECKs.
- Future-date validation is at the domain/data boundary rather than a SQLite clock-dependent CHECK, so local calendar semantics remain explicit.

## State and presentation

One Zustand store holds saved rows, loading/mutating flags and success/error feedback; draft form inputs remain in useRecordForm. Repeated submissions are guarded both in the hook and store. Successful create/update/delete update the saved list and refresh SQLite; a revision guard rejects stale read results. All promise failures are caught.

Add/Edit reuse RecordFormScreen; Edit loads saved values by ID and handles missing records. Cancel does not save drafts. Records is a FlatList with working date selection/clear, no-results/empty states, refresh/retry, per-date edit/delete labels and native deletion confirmation. Dashboard, Insights and Settings retain their shells; only obsolete copy changed.

## Fixtures and durability limits

The three sample fixtures in tests/fixtures/records.ts are imported only by tests. Tests explicitly insert them into memory or temporary desktop SQLite databases, then close/remove test resources. There is no application seed route, import or release-build sample initializer. The Pixel 10 verification manually created test records; this is separate from fixtures.

Persistence was verified by closing/reopening both a desktop SQLite file and the Android app. Device app data deletion/uninstall may remove local records. No backup, encryption, synchronization, production packaging or release APK was implemented in this phase.

## Official references

- [Expo SDK 58 SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/) — asynchronous database API and persisted device storage.
- [Expo SDK 58 date picker](https://docs.expo.dev/versions/v58.0.0/sdk/date-time-picker/) — SDK-compatible native calendar component.
- [Zustand source and documentation](https://github.com/pmndrs/zustand) — lightweight shared state.

## Schema v3

The runtime entry point preferencesMigration.initializeDatabase calls the unchanged v1/v2 migrations when needed, then transactionally creates app_preferences and advances user_version to 3. Columns: singleton id=1, theme in light/dark/system, reminder_enabled in 0/1, integer reminder_hour 0–23, reminder_minute 0–59. No health rows or default goals are inserted. Existing record IDs survive upgrade. Backup restore changes logical data only, never migration metadata. See feature-expansion-design.md and the real SQLite upgrade, rollback and reopen tests.
