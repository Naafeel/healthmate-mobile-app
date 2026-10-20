# HealthMate architecture

## Current structure

- src/app: Expo Router route files and root navigation layout. Routes delegate rendering to features.
- src/features/: welcome, dashboard, records (including Add Record), insights, and settings screens.
- src/components: AppScreen, AppHeader, AppText, AppCard, AppButton, AppIcon, EmptyState, and the original HealthIcon.
- src/theme: colors, typography, spacing, radius, border, elevation, icon and component-size tokens.

## Planned responsibilities (not implemented)

Create these folders when the first real consumer exists; avoid empty scaffolding.

| Location | Responsibility |
| --- | --- |
| src/features/<feature>/ | Screens, feature components, view-model hooks, and validation |
| src/hooks/ | Hooks shared by multiple features |
| src/domain/models/ | Framework-independent domain types |
| src/domain/repositories/ | Repository contracts expressed in domain types |
| src/data/database/ | SQLite connection, configuration, migrations, and schema after lecturer approval |
| src/data/repositories/ | Repository implementations using SQLite |
| src/store/ | Zustand stores for cross-feature application state |
| src/utils/ | Small shared pure helpers |

The intended dependency flow is View -> view-model hook -> repository interface -> repository implementation -> SQLite. Domain types must not import React or SQLite. Route files only compose navigation and feature screens. A feature can own local state; Zustand is reserved for shared state. No dependency injection framework or generic base repository is needed for initialization.

Core records will be stored locally and work offline. Development currently loads JavaScript from Metro; that does not establish a production offline launch test. SQLite, Zustand, models, persistence, CRUD, search, validation, analytics, and automated behavior tests are future work. No cloud services, authentication, Flutter, paid dependencies, or native project modifications are included.

## Implemented navigation

The root Stack contains welcome (index), the four-tab group, and add-record. Routes re-export feature screens. Both navigator headers are hidden; AppHeader supplies the sole visible title. Shared components do not import feature modules. Get Started pushes Dashboard, preserving welcome below it. Tabs use history back behavior. Add Record pushes onto the root stack so Back returns to the invoking tab; its header uses router.back with a Dashboard fallback for direct entry. No onboarding persistence is used. SDK 58 uses unstable_settings.anchor for stack/tab anchors.

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
~~~

~~~mermaid
flowchart TD
  W[Welcome] -->|Get Started| D[Dashboard]
  D <--> R[Records]
  R <--> I[Insights]
  I <--> S[Settings]
  D -->|Add Record| A[Add Record shell]
  R -->|Add Record| A
  A -->|Header or Android Back| T[Invoking tab]
  T -->|Tab selection| D
  D -->|Android Back after tab history| W
~~~

All four tabs are directly selectable from every tab. The diagram abbreviates these links; Android Back traverses visited-tab history before popping the root stack.
