# Security Policy

## Supported Versions

`contextloom` is pre-1.0. Until the first tagged release, only the current `main` branch is supported for security fixes.

| Version | Supported |
| --- | --- |
| main | Best effort |
| < 0.1.0 | No |

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions.

Use GitHub private vulnerability reporting if it is enabled for the repository. If it is not enabled yet, open a public issue asking for a private reporting path, but do not include exploit details, secrets, personal data, or sensitive transcript excerpts.

## Project Security Boundaries

`contextloom` is designed to be local-first:

- No telemetry.
- No hidden network calls.
- No credential scraping.
- No publishing or upload behavior.
- Local reads are limited to the file or directory path the operator passes to the CLI/API.
- Local writes are limited to the requested output directory.

The generated manifest can contain excerpts from input files. Treat manifests as sensitive when the input transcript is sensitive.

## What to Include

When a private reporting path is available, include:

- A clear description of the issue.
- Affected versions, files, packages, workflows, or configuration.
- Steps to reproduce, proof of concept, or attack scenario when safe to share.
- Potential impact.
- Suggested mitigation, if known.

## Out of Scope

- General support requests.
- Requests for guaranteed maintenance timelines.
- Vulnerabilities in unrelated downstream projects.
- Sensitive information that came from input files intentionally processed by the operator, unless contextloom exposed it somewhere unexpected.

## Disclosure

Coordinate disclosure with maintainers before publishing vulnerability details.
