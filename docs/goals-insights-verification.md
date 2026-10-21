# Prompt 05 verification

Executed 21 October 2026. Automated tests use Node 24.15.0 and its real desktop SQLite adapter, not a mocked database. Pixel_10 tests use Android API 37.1, emulator-5554 and Expo Go 58.0.5 with actual Expo SQLite. No production fixture seeding or activity deletion was used.

## Automated scenario results

72/72 tests passed: all 46 existing regressions plus 26 new tests covering the required categories below. Several related assertions share a test rather than inflating the count. DB07's expected current version changed from 1 to 2 and its unsupported future version from 2 to 3; its preservation/idempotence assertions remain intact.

| Test ID | Scenario                         | Input                                                                | Expected Result                             | Actual Result                                      | Status |
| ------- | -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------- | ------ |
| G01     | Save valid goals                 | 10000 / 500 / 2500                                                   | Exact values and timestamp in SQLite        | Exact round trip                                   | Pass   |
| G02     | Reject invalid                   | 0, negative, decimal, NaN, Infinity, strings, excessive values, id=2 | Domain/form/SQL constraints reject          | Rejected at tested boundaries                      | Pass   |
| G03     | Partial settings                 | 42 / blank / whitespace                                              | 42 / null / null                            | Exact round trip                                   | Pass   |
| G04     | Update singleton                 | Steps 10000 -> 15000                                                 | One row, new value                          | One row, 15000                                     | Pass   |
| G05     | Clear                            | Water null, then all null                                            | Individual/all goals unset                  | Exact null values retained                         | Pass   |
| G06     | Reopen persistence               | Temporary file DB, save then close/reopen                            | Values/timestamp survive                    | Exact equality                                     | Pass   |
| G07     | Genuine v1 upgrade               | Existing ID 19, 8200/350/2000                                        | v2 table, unchanged record                  | All columns and ID preserved                       | Pass   |
| G08     | Fresh migration                  | Empty SQLite                                                         | v2, no seed rows                            | Version 2, empty records/unset goals               | Pass   |
| G09     | Repeated/future/failed migration | Reopen v2; version 3; injected v2 DDL failure                        | Idempotence; reject; rollback               | Goals retained; rejected; v0 restored, retry works | Pass   |
| G10     | Persistence error/retry          | Unavailable connection then restored                                 | Error, retained state, successful retry     | Load/save recover                                  | Pass   |
| G11     | Stale response/duplicate save    | Deferred load, newer save, second save                               | Old load ignored, duplicate blocked         | Saved goals retained                               | Pass   |
| P01     | Below target                     | 7500/10000                                                           | 75%, incomplete                             | 75%                                                | Pass   |
| P02     | Equal target                     | 2000/2000                                                            | 100%, complete                              | 100%, complete                                     | Pass   |
| P03     | Above target                     | 2500/2000                                                            | 125%, fill 100                              | Exact result                                       | Pass   |
| P04     | Saved zero                       | 0/100                                                                | 0%, incomplete                              | Exact result                                       | Pass   |
| P05     | Missing record                   | null/100                                                             | Missing, no percentage                      | Missing                                            | Pass   |
| P06     | Unset/invalid denominator        | null goal; 0/-1/NaN/Infinity/decimal                                 | Unset or invalid, no division               | Correct distinct results                           | Pass   |
| P07     | Rounding                         | 1/3; 199999/200000                                                   | 33.3%; rounded 100 without completion       | Exact results                                      | Pass   |
| I01     | Week bounds                      | Monday, Sunday, year crossover                                       | Monday–Sunday local range                   | Exact dates                                        | Pass   |
| I02     | Month bounds                     | April and December                                                   | Calendar first/last                         | Exact dates                                        | Pass   |
| I03     | Leap February                    | February 2024 and 2023                                               | 29/28 positions                             | Exact results                                      | Pass   |
| I04     | Metric totals                    | 5000+7000+0 steps; 100+200+0 kcal; 1000+2000+0 ml                    | 12000 / 300 / 3000                          | Exact totals                                       | Pass   |
| I05     | Recorded-day average             | Two positive entries plus saved zero                                 | 4000 steps across 3 saved days              | Exact average/count                                | Pass   |
| I06     | Missing vs zero                  | Missing Feb 27, saved zero Feb 29                                    | Null vs 0, real zero statistics             | Distinct statuses/counts                           | Pass   |
| I07     | Highest/tie                      | Two 7000 days, reversed input                                        | Earliest tied date                          | Feb 28 selected                                    | Pass   |
| I08     | Empty                            | No rows                                                              | Count 0, other stats null                   | No NaN/fake observations                           | Pass   |
| I09     | Chronology                       | Reverse ordered records                                              | Calendar slots ascending, input unchanged   | Exact sequence                                     | Pass   |
| I10     | Navigation                       | Previous/next week/month                                             | Calendar arithmetic; current upper bound    | Exact ranges/clamp                                 | Pass   |
| I11     | Timezones                        | Colombo/Honolulu/New York local midnight, DST week                   | Same local calendar ranges                  | All zones pass                                     | Pass   |
| I12     | CRUD integration                 | Real SQLite save 10, edit 25, delete                                 | Analytics follows canonical store           | 10 -> 25 -> no entries                             | Pass   |
| I13     | Invalid/unavailable data         | Invalid date/value/duplicates; failed DB load                        | Explicit loading/error, no fabricated empty | Expected states/errors                             | Pass   |
| I14     | Future input                     | Unexpected future row 999                                            | Future slots null, exclude totals/count     | 12000 across 3 recorded days                       | Pass   |

## Android results

The existing manually entered record dated 2026-10-21 remained 8200 steps, 350 kcal and 2000 ml throughout. It was neither edited nor deleted. Initially all goals were unset. Test targets are examples chosen solely for verification, not recommendations.

| Test ID | Scenario                        | Input                                        | Expected Result                                   | Actual Result                                         | Status |
| ------- | ------------------------------- | -------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- | ------ |
| A01     | Existing v1 history/unset goals | Launch upgraded app                          | Existing record, unset messages                   | 8200/350/2000 visible                                 | Pass   |
| A02     | All targets/save                | 10000 steps, 500 kcal, 2500 ml               | Save confirmation                                 | Goals saved on this device                            | Pass   |
| A03     | Restart/reopen Settings         | Full Expo Go force-stop/reopen               | All values persist                                | 10000/500/2500 confirmed from native fields           | Pass   |
| A04     | Partial progress                | Existing record, A02 targets                 | 82%, 70%, 80%                                     | Exact labels and accessibility values                 | Pass   |
| A05     | Above target/individual clear   | Steps 5000, calories 500, water blank        | 164% reached, 70%, water unset with actual intact | Exact values visible                                  | Pass   |
| A06     | Weekly metrics                  | Current week Oct 19–25, switch metrics       | 8200 steps / 350 kcal / 2000 ml; count 1          | Exact totals/averages/highest Oct 21                  | Pass   |
| A07     | Monthly                         | Oct 1–31, water                              | Total 2000, Oct 21 bar                            | Exact total/day, horizontal scrolling works           | Pass   |
| A08     | Prior periods                   | Oct 12–18 and September                      | Genuine empty state, Next returns current         | Empty states and current bound verified               | Pass   |
| A09     | Missing/future semantics        | No entries Oct 19/20, future Oct 22+         | No entry vs Future, no fake bars                  | Exact labels/accessibility descriptions               | Pass   |
| A10     | Native validation               | Automation initially entered 0000 / 00       | Reject zero near field, retain draft              | Inline positive-integer errors; corrected inputs save | Pass   |
| A11     | Large text                      | Android font scale 1.3                       | Readable values/dates, working scrolling          | Summary/chart scrolled and captured; restored to 1.0  | Pass   |
| A12     | Final cold restart              | Persisted partial goals and unchanged record | Goals/progress/Insights survive                   | 164%, 70%, water unset; Insights 8200 steps           | Pass   |
| A13     | Restore test settings           | Clear test goals and Save                    | Original unset settings and history retained      | All goals unset; 8200/350/2000 still present          | Pass   |

Evidence: [goals screenshots](evidence/goals/) and [Insights screenshots](evidence/insights/). Screenshots are genuine adb captures. Some views require vertical scrolling; monthly dates intentionally scroll horizontally. A chart without a visible bar at the left edge can reflect real missing early-month days, not an empty dataset.

Final device settings restore font scale 1.0, hardware-keyboard IME visibility 0 and the prior unset stylus-handwriting override. All three goals were returned to their original unset values after persistence tests. No health records were created, edited or deleted during Prompt 05 native verification.

## Final quality checks

| Check                    | Result                                       |
| ------------------------ | -------------------------------------------- |
| npm run typecheck        | Pass, application and test TypeScript        |
| npm run lint             | Pass, zero reported errors/warnings          |
| npm test                 | 72 passed, 0 failed/skipped                  |
| npx expo install --check | Dependencies up to date                      |
| npx expo-doctor          | 20/20 passed                                 |
| git diff --check         | Pass                                         |
| Metro / native launch    | LAN 8085, actual Pixel_10 rendering verified |

The fresh final Expo Go process was inspected with PID-filtered ReactNativeJS error logging; the output contained no error entries. Initial module-loading errors belong to the pre-restart process, not evidence of a clean final run.

## Issues and limits

Switching Metro instances reproduced the existing Expo Go missing ExpoSQLite module issue. Full force-stop/reopen resolved it without clearing data or changing packages. Metro 8081–8084 were left untouched; Prompt 05 uses 8085. The initial CI-mode server was restarted on the same port with normal file watching before final UI checks.

The Android input automation initially dropped leading digits while the keyboard was opening. Increasing focus/selection settling time and inspecting actual native field values corrected the test procedure. Invalid zero input was correctly rejected by the application. No record data was altered to work around tests.

Lint initially flagged a synchronous state update effect in Settings. Saved values now derive directly from the store until a local draft exists; no effect copies saved state into a second draft on every refresh.

Desktop tests inject database failures and asynchronous races. Native disk failure was not induced on the user's development database. Automated timezone/midnight tests use deterministic clocks; no overnight wait or device timezone change was required. This is a development-client test, not release/offline-bundle verification. TalkBack navigation and physical-device coverage remain separate future validation tasks. Existing upstream npm audit findings were not force-upgraded; no dependencies were added.
