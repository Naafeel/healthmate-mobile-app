# HealthMate architecture

## Current structure

- src/app: Expo Router route files and root navigation layout. Routes delegate rendering to features.
- src/features/welcome: the initial stateless welcome view.
- src/components: reusable presentation components, currently HealthIcon.
- src/theme: shared color, spacing, and radius tokens.

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
