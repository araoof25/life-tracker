# Life Tracker architecture and delivery checklist

## Decision 001 — Windows development and signed iOS builds

Use React Native, Expo and TypeScript on Windows. Use EAS Build for signed iOS binaries and install an internal build on the registered iPhone. Use TestFlight for release validation. SwiftUI and SwiftData would fit an iPhone-only app with regular access to Xcode on a Mac. Flutter still needs a macOS iOS build environment and adds no project-specific advantage here.

Work on phase branches and merge reviewed changes into main after their acceptance checks. The repository is public. Commit source and synthetic fixtures only. Keep real reports, backups, local configuration secrets and signing material out of Git.

Separate the UI, report models, scoring, analytics, persistence, notifications, security and import/export. Keep scoring and date rules independent of React Native so Windows can run their tests. Validate SQLite with SQLCipher, Keychain-backed key storage and device authentication on a signed build. Use local notifications and an offline release-like build for airplane mode testing.

## Requirements to resolve before implementation

- Define draft/submitted status independently of response completeness and agree what counts toward the reporting streak.
- Agree how the app assigns a night shift to a calendar date and handles travel across timezones.
- Agree how period reports weight observations and handle small samples.
- Version scoring rules and keep missing, zero and excluded responses distinct.

## Delivery checklist

- [ ] Phase 1: Verify Windows tools and confirm architecture and outstanding product rules.
- [ ] Phase 2: Scaffold project and run an app shell.
- [ ] Phase 3: Add data models and verify scoring with automated tests.
- [ ] Phase 4: Verify daily check-in and partial saves.
- [ ] Phase 5: Verify dashboard and history.
- [ ] Phase 6: Verify analytics and exports.
- [ ] Phase 7: Verify notification scheduling.
- [ ] Phase 8: Verify app lock, storage protection, backup and restore.
- [ ] Phase 9: Run regression tests and resolve failures.
- [ ] Phase 10: Install on iPhone and verify offline behavior, notifications and data persistence across updates.
- [ ] Phase 11: Prepare release and document remaining security limits.

## Windows tool inventory

Run in PowerShell and capture the output.

    node --version
    npm.cmd --version
    git --version

Phase 1 environment check passes once all three commands return versions suitable for the selected Expo SDK. No application build or device tests have run yet.
