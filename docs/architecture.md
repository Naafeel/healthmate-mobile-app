# HealthMate architecture

## Current structure

- src/app: Expo Router route files and root navigation layout. Routes delegate rendering to features.
- src/features/: welcome, dashboard, records (including Add Record), insights, and settings screens.
- src/components: AppScreen, AppHeader, AppText, AppCard, AppButton, AppIcon, EmptyState, and the original HealthIcon.
- src/theme: colors, typography, spacing, radius, border, elevation, icon and component-size tokens.

## Layer responsibilities

Domain models/contracts/validation, SQLite database/repository, and shared Zustand state are now implemented. Shared hooks and utilities remain deferred until needed.

| Location | Responsibility |
| --- | --- |
| src/features/<feature>/ | Screens, feature components, view-model hooks, and validation |
| src/hooks/ | Hooks shared by multiple features |
| src/domain/models/ | Framework-independent domain types |
| src/domain/repositories/ | Repository contracts expressed in domain types |
| src/data/database/ | Implemented SQLite connection, configuration, migration v1 and schema; lecturer confirmation pending |
| src/data/repositories/ | Repository implementations using SQLite |
| src/store/ | Zustand stores for cross-feature application state |
| src/utils/ | Small shared pure helpers |

The intended dependency flow is View -> view-model hook -> repository interface -> repository implementation -> SQLite. Domain types must not import React or SQLite. Route files only compose navigation and feature screens. A feature can own local state; Zustand is reserved for shared state. No dependency injection framework or generic base repository is needed for initialization.

Core records are stored locally through Expo SQLite and work without a backend. Development loads JavaScript from Metro; this does not establish a production offline launch test. Models, repository contracts, validation, migrations, CRUD, exact-date filtering, Zustand state, and automated tests are implemented. The daily dashboard now selects exact saved totals and recent records; charts and analytics remain future work. No cloud services, authentication, Flutter, paid dependencies, or native project modifications are included.

## Implemented navigation

The root Stack contains welcome (index), the four-tab group, add-record, and edit-record/[id]. Routes re-export feature screens. Both navigator headers are hidden; AppHeader supplies the sole visible title. Shared components do not import feature modules. Get Started pushes Dashboard, preserving welcome below it. Tabs use history back behavior. Add Record pushes onto the root stack so Back returns to the invoking tab; its header uses router.back with a Dashboard fallback for direct entry. No onboarding persistence is used. SDK 58 uses unstable_settings.anchor for stack/tab anchors.

~~~text
src/app/
  _layout.tsx
  index.tsx                / (welcome)
  (tabs)/
    _layout.tsx
    dashboard.tsx          /dashboard
    records.tsx            /records
    insights.tsx           /insights
    settings.tsx           /settings
  add-record.tsx           /add-record
  edit-record/[id].tsx      /edit-record/:id
~~~

~~~mermaid
flowchart TD
  W[Welcome] -->|Get Started| D[Dashboard]
  D <--> R[Records]
  R <--> I[Insights]
  I <--> S[Settings]
  D -->|Add Record| A[Add/Edit daily record]
  R -->|Add Record| A
  A -->|Header or Android Back| T[Invoking tab]
  T -->|Tab selection| D
  D -->|Android Back after tab history| W
~~~

All four tabs are directly selectable from every tab. The diagram abbreviates these links; Android Back traverses visited-tab history before popping the root stack.

## Implemented record data flow

~~~mermaid
flowchart LR
  V[RecordFormScreen / RecordsScreen] --> VM[useRecordForm / Zustand store]
  VM --> C[HealthRecordRepository contract]
  C --> R[SQLiteHealthRecordRepository]
  R --> DB[healthmate.db / health_records]
  V --> VAL[Domain validation]
  R --> VAL
~~~

The form view-model owns draft strings, field errors, load/retry state, and duplicate-date recovery. Zustand owns the canonical saved record list, loading/mutation flags, feedback, refresh, save and delete operations. It does not persist a second copy in AsyncStorage; SQLite is the source of truth. Mutations synchronize saved rows, sort newest first, and refresh after success. A revision guard prevents older loads from replacing newer mutations. Failed deletions keep their error visible for retry.

The composition module src/store/healthRecords.ts creates one repository behind the interface and injects it into createHealthRecordStore. Form lookup uses the same repository. No SQL appears in screens or hooks. Domain files import neither React nor SQLite. The database module owns a retryable singleton connection promise and completes initialization before returning it.

Records uses FlatList rather than nesting a virtualized list in AppScreen's ScrollView. Focus, foreground and pull-to-refresh reload SQLite. Exact-date filtering selects from that shared loaded list; the repository also supports parameterized date and date-range queries for tests and later consumers. Add/Edit share one form, with a separate typed edit route and ID-preserving updates. Native Alert supplies Cancel/Delete; no destructive operation runs on Cancel. Keyboard-aware scrolling and persistent taps keep actions reachable.

See database-design.md and crud-verification.md for schema, bounds, testing, fixtures and actual Android evidence.

## Functional daily dashboard

The route still re-exports DashboardScreen. useDashboard subscribes to the canonical saved record state, local date, load/error flags and lifecycle events. dashboardSelectors derives a discriminated loading/error/ready view model, one exact-date daily row, a smart Add/Edit descriptor and a newest-first three-record preview. It creates no additional record store, SQL query path or connection.

HealthMetricCard presents a saved measurement with its label, unit, accessible grouped reading and semantic accent. RecentRecordPreview provides a compact date and exact three-measurement summary. Both reuse shared UI primitives and centralized tokens.

A backward-compatible hasLoaded flag in the existing store is set only by successful full loads. Dashboard shows loading until that happens, gives errors precedence over missing data, and identifies cached background refresh. Existing mutation/revision guards remain intact.

createDashboardLifecycle is independently testable: navigation focus activates it, duplicate activation is ignored, foreground return rechecks the calendar and refreshes, and one timeout targets the next local midnight. Blur/background cancels it; focus/unmount removes the AppState subscription. Local calendar arithmetic supports leap days, timezone offsets and DST; no UTC slicing or minute-by-minute polling is used.

~~~mermaid
flowchart LR
  DB[Existing healthmate.db] --> R[Existing SQLite repository]
  R --> S[Canonical Zustand records / hasLoaded]
  S --> VM[Dashboard selector + lifecycle hook]
  VM --> D[Daily metrics + recent activity]
  D -->|Missing today| A[Existing Add Record]
  D -->|Saved today / record ID| E[Existing Edit Record]
  D -->|View All| H[Existing Records tab]
  A --> S
  E --> S
  H --> S
~~~

Full details and evidence: dashboard-design.md and dashboard-verification.md.
