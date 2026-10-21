# Prompt 06 verification

Executed 21 October 2026. Automated results use Node 24.15.0 and actual desktop SQLite where integration is relevant. Native results use Pixel_10 / emulator-5554, Android API 37.1 and Expo Go 58.0.5. Desktop tests are not presented as proof of Android sharing or rendering.

## Automated scenarios

96/96 tests pass: all 72 existing tests plus 24 focused tests for Calendar, Logging Streaks and Export. Existing tests are unchanged. Calendar period calculations moved into the domain with backward-compatible Insights exports. LS prefixes distinguish the new logging tests from the prior record-store S01–S05 tests; they correspond to Prompt 06's streak S01–S12 categories.

| Test ID   | Scenario                | Input                                               | Expected Result                           | Actual Result                         | Status |
| --------- | ----------------------- | --------------------------------------------------- | ----------------------------------------- | ------------------------------------- | ------ |
| C01       | October grid            | October 2026                                        | Thursday start, 31 dates, 5 rows          | Exact padded cells verified           | Pass   |
| C02       | February                | Leap 2024; February 2021                            | 29 dates; 4-row non-leap month            | Exact alignment/length                | Pass   |
| C03       | Week boundary           | June 2026 Monday; March Sunday                      | First day in column 0/6                   | Exact positions                       | Pass   |
| C04       | Six rows                | March 2026                                          | 6 rows, March 31 Tuesday                  | Exact cells                           | Pass   |
| C05–C07   | Saved/missing/zero      | Saved 0/0/0; absent prior date                      | Recorded vs missing/null                  | Correct distinct states               | Pass   |
| C08       | Edit ID                 | Saved ID 17                                         | Existing edit route with ID 17            | Exact route params                    | Pass   |
| C09       | Add prefill             | Empty October 20                                    | Add with validated selected date          | Exact date and return context         | Pass   |
| C10       | Future                  | October 22, today October 21                        | No saved activity/Add action              | Future, null record/action            | Pass   |
| C11       | SQLite CRUD             | Create zero, move date/edit, delete                 | Calendar follows canonical state          | ID/value/date/status updates verified | Pass   |
| C12       | Route validation        | Missing/valid/array/malformed/future parameters     | Default today or reject safely            | Exact results                         | Pass   |
| C-nav     | Month bounds            | Previous January, Next current                      | Year crossover and current clamp          | Exact periods                         | Pass   |
| LS01      | Empty                   | No dates                                            | Current/longest 0                         | 0/0                                   | Pass   |
| LS02      | One day                 | Today or isolated historical date                   | 1/1 or 0/1                                | Exact results                         | Pass   |
| LS03      | Consecutive             | October 19–21                                       | 3/3                                       | 3/3                                   | Pass   |
| LS04      | Today absent            | October 18–20, today 21                             | Yesterday grace gives 3/3                 | 3/3                                   | Pass   |
| LS05      | Two missing recent days | Same dates, today 22                                | Current 0, longest 3                      | 0/3                                   | Pass   |
| LS06      | Saved zero              | Two real SQLite zero records                        | Both days logged                          | 2/2                                   | Pass   |
| LS07–LS08 | Gap/longest             | Historical 4-day run, missing intermediate date now | Current 1, longest 4                      | Exact results                         | Pass   |
| LS09      | Calendar boundaries     | Leap day and New Year                               | Continuous runs                           | 3/3 and 2/2                           | Pass   |
| LS10      | DST/timezones           | Colombo/Honolulu/New York March 9–11                | 3 calendar days despite DST               | 3/3 in each zone                      | Pass   |
| LS11      | SQLite mutation         | Move date, delete entries                           | Recalculate current/longest               | 2/2 -> 1/1 -> 0/0                     | Pass   |
| LS12      | Duplicates/future       | Duplicate today; future entries                     | Count once, ignore future                 | 1/1 or 0/0                            | Pass   |
| LS-large  | Large history           | 10000 consecutive dates                             | Correct result, input unchanged           | 10000/10000, unchanged input          | Pass   |
| E01       | Header                  | One valid record                                    | Exact required columns                    | Exact string equality                 | Pass   |
| E02       | Order                   | Three reverse/unsorted dates                        | Oldest first; input unchanged             | Exact sorted CSV                      | Pass   |
| E03       | Integers                | 8200 / 350 / 2000                                   | No locale separators                      | Exact digit fields                    | Pass   |
| E04       | Dates/encoding          | ISO date, UTF-8 text round trip                     | Stable ISO/UTF-8/CRLF                     | Exact results                         | Pass   |
| E05       | Zeros                   | 0/0/0 record                                        | Include actual zeros                      | Exact CSV row                         | Pass   |
| E06       | Empty                   | Empty list/repository                               | No file or share                          | Null/empty status, adapters uncalled  | Pass   |
| E07       | Completeness            | Three saved dates                                   | Header + all 3 rows only                  | Exact CSV equality                    | Pass   |
| E08       | Escaping/security       | Comma/quote/CRLF/Unicode/formula prefixes           | Quote/double/neutralize correctly         | Exact cells verified                  | Pass   |
| E09       | Failures                | Database/file preparation throw                     | Surface failure without share             | Expected rejections, no share call    | Pass   |
| E10       | Sharing                 | Unavailable, resolved dismissal, rejected share     | Safe states/cleanup; no delivery claim    | Correct results and cleanup calls     | Pass   |
| E11       | SQLite source           | Empty then one saved row                            | Only saved row; no IDs/goals/summary      | Exact CSV from real SQLite            | Pass   |
| E-invalid | Corrupt data            | Invalid date, duplicate, string/NaN/negative        | Reject, never silently export fake values | All rejected                          | Pass   |

Platform-independent export orchestration tests inject file/share ports. They do not claim an Android chooser opened. Native verification below separately exercises the supported Expo implementation and reads the actual written file back before sharing.

## Pixel 10 results and data preservation

The pre-existing manual record was 2026-10-21: 8200 steps, 350 kcal burned, 2000 ml water. Calendar first confirmed October 19 and 20 were empty. Only those two dates were temporarily created with 0/0/0. October 19 was later edited to 5/0/0 to verify Edit. October 20 was deleted first to introduce a gap; October 19 was then deleted. Both were removed through the normal confirmed deletion flow. The original October 21 record was neither edited nor deleted. Goals were already unset and remained unchanged.

| Test ID | Scenario                 | Input                                     | Expected Result                             | Actual Result                                                  | Status |
| ------- | ------------------------ | ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | ------ |
| A01     | Records -> Calendar      | Calendar View                             | Root stack screen, four tabs preserved      | Activity Calendar opened                                       | Pass   |
| A02     | Current month            | October 2026, today 21                    | Thursday first, Wednesday 21 marked         | Correct grid, T and saved marker                               | Pass   |
| A03     | Saved selection/Edit     | October 21                                | Exact values and existing Edit form         | 8200/350/2000; correct saved date                              | Pass   |
| A04     | Empty selection/Add      | October 20                                | Existing Add form prefilled 2026-10-20      | Exact Date field                                               | Pass   |
| A05     | Future block             | October 22                                | Explanation, no Add action                  | Future explanation only                                        | Pass   |
| A06     | Save return/zero marker  | Temporary October 20 0/0/0                | Return same Calendar/date; marked recorded  | Exact zero details, saved marker                               | Pass   |
| A07     | Streak including zeros   | Temporary October 19 and 20 + original 21 | Current/longest 3 days                      | 3 days / 3 days                                                | Pass   |
| A08     | Missing middle day       | Delete only temporary October 20          | Current/longest reduce to 1 day             | 1 day / 1 day                                                  | Pass   |
| A09     | Record Edit regression   | Temporary October 19 steps 0 -> 5         | Updated row and normal Records navigation   | 5 steps / 0 kcal / 0 ml                                        | Pass   |
| A10     | Remove temporary history | Delete only temporary October 19          | Original row only; missing 19/20            | Calendar missing markers, original values retained             | Pass   |
| A11     | Export confirmation      | Settings Export Health Records            | Explicit explanation and Export CSV action  | Native confirmation shown                                      | Pass   |
| A12     | Native file/share        | Confirm export after cleanup              | Valid original-only CSV and Android chooser | Native write/readback equality passed; chooser shows dated CSV | Pass   |
| A13     | Share cancellation       | Android Back without recipient            | Return safely; no delivery claim            | Sharing closed for 1 saved record                              | Pass   |
| A14     | Temporary-file removal   | Remove temporary export file              | Delete only app's cache copy                | Removal confirmation, button disappears                        | Pass   |
| A15     | Month navigation         | Previous September, Current October       | Correct months and upper bound              | Correct labels/grids, current Next disabled                    | Pass   |

The exact expected CSV after temporary-row cleanup is the required header plus one original row: date 2026-10-21, steps 8200, calories 350, water 2000, with CRLF and final CRLF. `nativeRecordExport` reads the actual native file using File.text and requires exact equality with the generated CSV before opening Sharing. The real chooser opened and the operation reported one record. This verifies native generation/readback against the SQLite snapshot; no recipient app was selected or claimed to receive/save the file. Direct shell access to Expo Go's sandbox is unavailable on this production emulator, so there is no external spreadsheet-open/file-browser inspection claim.

## Dependencies and audit

`npx expo install expo-file-system expo-sharing` installed SDK 58-compatible versions 58.0.10 and 58.0.19 respectively; only sharing was a newly installed package, since file-system was already transitive. Expo added its sharing config plugin. No application identity or database migration changed.

Baseline and final lockfiles were audited on the same day from separate folders without installing baseline dependencies. Baseline: 28 affected packages (8 moderate, 20 high). Final: 29 (9 moderate, 20 high). Only the affected-package name expo-sharing was added, via existing @expo/config-plugins advisories; advisory source IDs were unchanged. The proposed expo-sharing 14.0.8 fix is a major-version SDK-incompatible downgrade. It was not applied. See [design](calendar-streaks-export-design.md) for alternatives and rationale.

## Issues, fixes and untested scenarios

- Native large-font screenshot review caught a layout defect that pure date-grid tests could not see: outer blank slots lacked the same minimum width/flex basis as date cells, shifting October 1 away from Thursday. All blank/date/weekday cells now share a zero flex basis and 48-unit minimum width. Android bounds confirmed the Thursday heading and October 1 cell centers differ by only 0.5 pixel at both normal and 130% font. The separately named before-fix image preserves the investigation; final alignment evidence is 11-corrected-weekday-alignment.png and 12-large-font-corrected-grid.png. Earlier workflow captures predate this visual correction.
- TypeScript caught a non-discriminating empty/unavailable result union; separate status members fixed narrowing. Lint caught an import below re-exports after moving period helpers; import order was corrected.
- Android automation initially addressed fields/buttons clipped by the numeric keyboard. Fresh hierarchy/screenshot inspection and scrolling to the actual visible controls resolved the test procedure. Form validation correctly rejected missing measurements; no incomplete record was saved. This was not evidence of a successful Save until the native Calendar showed the saved row.
- A native readback check was added to file preparation so write/encoding mismatch aborts and removes the partial file. Export contents are never printed to application logs.
- Native yesterday-grace behavior was not tested by deleting/moving the original today entry or changing the phone's calendar. Deterministic LS04/LS05 cover that behavior without risking pre-existing data.
- Native disk failure, unavailable sharing hardware/API, abrupt termination during sharing and hour-old cache expiry were not induced. Pure orchestration tests cover failure/unavailable/dismissal, and cleanup scope/lifetime is documented. No automated test claims a mocked chooser is native evidence.
- TalkBack navigation, physical devices, release builds and overnight waits remain untested; deterministic date/DST and existing lifecycle tests cover rollover logic. Arbitrary screen sizes beyond the emulator/font check remain broader QA.
- Cache cleanup is event-driven after one-hour eligibility, not a guaranteed background timer. Android's share promise cannot identify cancellation vs a receiving app saving. Recipient delivery was intentionally not tested.

Genuine screenshots are under [calendar](evidence/calendar/), [streaks](evidence/streaks/) and [export](evidence/export/). Prior evidence remains unchanged.

## Final native and quality checks

| Test ID | Scenario                   | Input                       | Expected Result                                      | Actual Result                                            | Status |
| ------- | -------------------------- | --------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------ |
| A16     | Large font/final alignment | Font scale 1.3 and 1.0      | Seven equal columns; October 1 under Thursday        | Native centers within 0.5 px; readable grid/details      | Pass   |
| A17     | Cold restart/regression    | Force-stop/reopen Expo Go   | Original row/goals/streaks/Insights/Calendar persist | 8200/350/2000; goals unset; streak 1/1; Insights count 1 | Pass   |
| A18     | Native Back                | Edit -> Calendar -> Records | Existing routes pop predictably                      | Actual Android Back returned correctly                   | Pass   |

| Command/check            | Result                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| npm run typecheck        | Passed application and tests, including after layout fix            |
| npm run lint             | Passed without reported errors/warnings, including after layout fix |
| npm test                 | 96 passed, 0 failed/skipped, rerun after layout fix                 |
| npx expo install --check | Dependencies up to date                                             |
| npx expo-doctor          | 20/20 passed                                                        |
| git diff --check         | Passed                                                              |
| Metro/native rendering   | LAN 8086; existing ports 8081–8085 untouched                        |

Final device settings restore font scale 1.0, hardware-keyboard IME visibility 0 and the prior unset stylus-handwriting override. No recipient app was selected in the share sheet. The fresh final Expo Go process was checked with PID-filtered ReactNativeJS error logging; no error entries were returned.
