#!/usr/bin/env node

import { spawn } from "node:child_process";
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
const timeoutMs = Number(process.env.BASIC_USAGE_TIMEOUT_MS ?? 10_000);

if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
  console.error("Basic usage check failed: BASIC_USAGE_TIMEOUT_MS must be a positive integer.");
  process.exit(1);
}

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
  const exitCode = await new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(code);
    };

    let child;
    try {
      child = spawn(args[0], args.slice(1), { stdio: "inherit" });
    } catch (error) {
      console.error(`Basic usage check failed: could not spawn ${args[0]}: ${error.message}`);
      finish(1);
      return;
    }

    timer = setTimeout(() => {
      console.error(`Basic usage check failed: command timed out after ${timeoutMs}ms: ${command}`);
      child.kill("SIGTERM");
      finish(1);
    }, timeoutMs);

    child.once("error", (error) => {
      console.error(`Basic usage check failed: could not run command: ${error.message}`);
      finish(1);
    });
    child.once("close", (code, signal) => {
      if (signal) {
        console.error(`Basic usage check failed: command terminated by ${signal}: ${command}`);
      }
      finish(code ?? 1);
    });
  });

  if (exitCode !== 0) process.exit(exitCode);
}

console.log("Basic usage example passed.");
