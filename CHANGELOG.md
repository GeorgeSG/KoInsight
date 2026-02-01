# Changelog

## [Unreleased]

### New Features

Bulk Annotation Sync: The "Synchronize data" button now syncs all annotations from all books in your reading history at once (previously only the currently open book). Sync on suspend still syncs statistics and annotations for the currently open book only (keeping suspend snappy).

### Bug Fixes

Fixed Book Duplicates: Some users saw the same book twice in KoInsight, one with statistics, one with annotations. We now match books using their unique MD5 checksum instead of title.

If you have duplicates, either:

1. Delete your database and re-sync (recommended - clean start)
2. Manually delete duplicate books in the web interface (the faulty one)

New syncs won't create duplicates. If you still see duplicates, you most likely have duplicates in your KoReader statistics database and KoInsight makes those visible.

### Breaking Changes

Plugin version 0.3.0 required. Update it before syncing.

---

## [0.2.2] - 2026-01-11

### Added

- Annotation sync support for currently open book
- Mark deleted annotations in the database

### Fixed

- Annotations now properly marked as deleted when removed in KoReader
- Docker build issues

## [0.2.0] - 2026-01-11

### Added

- Plugin versioning system
- Server validates plugin version before accepting data

### Changed

- **BREAKING:** Server now requires specific plugin version

---

## Earlier Versions

See git history for changes prior to v0.2.0.

[Unreleased]: https://github.com/GeorgeSG/koinsight/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/GeorgeSG/koinsight/compare/v0.2.0...v0.2.2
[0.2.0]: https://github.com/GeorgeSG/koinsight/releases/tag/v0.2.0
