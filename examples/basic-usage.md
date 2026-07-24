# Basic contextloom usage

```sh
npm install
npm run build
node dist/src/cli.js inspect fixtures/sample --output out/sample
node dist/src/cli.js search out/sample/manifest.json "deployment decision"
node dist/src/cli.js show out/sample/manifest.json chunk-0001
node dist/src/cli.js verify out/sample/manifest.json
```

The output manifest is intentionally plain JSON so another agent, editor plugin, or shell script can consume it without a server.
