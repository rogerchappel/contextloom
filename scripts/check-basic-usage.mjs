#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const example = await readFile("examples/basic-usage.md", "utf8");
const shellBlock = example.match(/```sh\n([\s\S]*?)\n```/);

if (!shellBlock) {
  console.error("Basic usage check failed: no shell example found.");
  process.exit(1);
}

const commands = shellBlock[1]
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("node "));

if (commands.length !== 4) {
  console.error(`Basic usage check failed: expected 4 CLI commands, found ${commands.length}.`);
  process.exit(1);
}

for (const command of commands) {
  const args = command.match(/"[^"]*"|'[^']*'|\S+/g)?.map((arg) => arg.replace(/^(['"])(.*)\1$/, "$2"));
  if (!args || args[0] !== "node") {
    console.error(`Basic usage check failed: could not parse command: ${command}`);
    process.exit(1);
  }

  console.log(`> ${command}`);
  const result = spawnSync(args[0], args.slice(1), { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Basic usage example passed.");
