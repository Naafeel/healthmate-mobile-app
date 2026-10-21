# Functional daily dashboard

## Information hierarchy and source

HealthMate branding and a friendly generic heading lead into the local calendar date, Today’s Overview, smart daily action, Recent Activity and View All Records. No username or personal detail is invented. The same SQLite -> repository -> Zustand flow used by Records supplies every activity value. The database, schema version, routes and record forms are unchanged.

| Metric | Saved field | Meaning | Unit |
| --- | --- | --- | --- |
| Steps walked | steps | Manual total for the selected daily date | steps |
| Calories burned | calories | Manually entered calories burned, never estimated from steps | kcal |
| Water intake | water | Manually entered daily water total | ml |

One unique daily row is selected by exact local date. No sums across records, goal percentages, sensors, estimates or health advice are used. Number grouping follows the device locale; tests specify en-US for deterministic assertions.

## States and actions

- Before a successful full store load: loading card with spinner and explanatory text. An empty array alone is not proof that no records exist.
- Load error: friendly shared-store error plus Retry loading dashboard. The failed load is not presented as empty; no misleading Add Today action is shown while the result is unknown.
- Ready with no today row: No activity recorded today, manual-entry explanation and Add Today's Record. No zero measurements or empty database row is fabricated.
- Ready with a today row, including 0/0/0: exact measurements and Edit Today's Record with the saved ID.
- Cached refresh: keep previously loaded content visible, announce Updating saved activities, and disable the daily action until loading/mutation ends.
- Recent activity: newest three date rows, including today if it is among them; show only existing rows. If none exist, show a journal empty state.

The Add/Edit buttons use existing route implementations. View All Records navigates to the existing Records tab. After saving, the existing form returns to Records; selecting Dashboard immediately reflects shared-state values and focus refresh. No form navigation was redesigned.

## Local date and lifecycle

Reuse domain localDate and calendarDate, which use the local calendar and local noon for date-only formatting. Exact ISO-date equality determines today. A record dated 2026-10-21 remains recent but is not today on 2026-10-22.

The focused dashboard owns one lifecycle controller: focus/active -> refresh and arm next local midnight; background/blur -> cancel; foreground/refocus -> recompute date and refresh; midnight -> recompute once, refresh and rearm. The next deadline uses setHours(24,0,0,0), not a fixed 24-hour assumption, so DST transitions remain correct. There is no render-triggered refresh effect, polling interval or independent database connection. Existing store load/mutation guards suppress overlapping work and prevent stale reads from replacing newer mutations.

## Structure

~~~text
src/features/dashboard/
  DashboardScreen.tsx
  useDashboard.ts
  dashboardSelectors.ts
  dashboardLifecycle.ts
  components/
    HealthMetricCard.tsx
    RecentRecordPreview.tsx
~~~

## Visual and accessibility decisions

Retain primary #126B57 and background #F4F8F7. Three vertically stacked cards remain readable on narrow screens rather than compressing totals into columns. Shared spacing, typography, radius, borders and touch sizes are retained. Steps use green (#126B57 on #E2F2EB), burned calories warm orange (#9C431B on #FFF0E6), and water blue (#185E91 on #E8F2FA). These semantic colors live in theme.metrics.

Labels and explicit units carry meaning independently of color. Each metric card exposes a grouped label such as Steps walked: 8,200 steps. Decorative icons remain hidden from accessibility. Numbers and supporting copy wrap naturally with native font scaling; safe areas and vertical scrolling remain supplied by AppScreen. Actions use the existing 52 dp minimum-height AppButton. No chart, animation or UI library was added.

## Implementation limits

No schema change, package addition, automatic tracking, charts, goals, streaks, medical recommendation, cloud feature or release build belongs to this phase. This is a manual daily summary dashboard; a saved zero is valid, not a missing reading. Full TalkBack navigation, exhaustive devices and packaged offline launch remain separate verification work.

## References

- [Expo Router hooks](https://docs.expo.dev/versions/v58.0.0/sdk/router/) for focus/navigation behavior.
- [React Native AppState](https://reactnative.dev/docs/appstate) for foreground/background notifications.
