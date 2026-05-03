# Roadmap

This roadmap describes intended direction, not a binding delivery promise.

## Now

- Harden exact excerpt verification on more real transcript shapes.
- Keep the CLI dependency-light, local-first, and easy to audit.
- Improve examples around agent handoff, blockers, and decision retrieval.

## Next

- Add configurable chunk sizing and include/exclude globs.
- Add richer Markdown reports for handoff packets.
- Explore optional semantic retrieval as a separate, explicit add-on that never changes the local-first default.

## Later

- Editor integrations that read existing manifests.
- Import adapters for specific agent transcript formats.
- Release automation after the manual workflow is boring and reliable.

## Not Planned

- Hidden telemetry or hosted indexing.
- Automatic publishing or upload of transcripts.
- Replacing the source transcript as the system of record.
- Copying adjacent project names or implementations.

## Roadmap Review

Before each meaningful release:

- Move completed user-visible work into `CHANGELOG.md`.
- Remove stale commitments.
- Promote only the next reviewable set of work into `Now`.
