# Agent handoff

The deployment decision is to ship a small CLI first. The library API should expose inspect, search, show, and verify primitives.

Safety boundaries:

- Read local files only when the operator provides a path.
- Write manifests only to requested output directories.
- Never scrape credentials, phone home, or publish data.

Open question: richer semantic retrieval can wait until the exact excerpt path is boring and reliable.
