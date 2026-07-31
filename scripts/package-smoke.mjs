#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "contextloom-package-smoke-"));

try {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", temporaryDirectory], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  const [packument] = JSON.parse(output);
  const packedFiles = new Set(packument.files.map((file) => file.path));
  const requiredFiles = new Set(["README.md", "LICENSE"]);

  if (packageJson.main) {
    requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
  }

  const binEntries =
    typeof packageJson.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson.bin ?? {});

  for (const binEntry of binEntries) {
    requiredFiles.add(binEntry.replace(/^\.\//, ""));
  }

  const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));
  if (missing.length > 0) {
    throw new Error(`${packageJson.name} package smoke failed; missing packed file(s): ${missing.join(", ")}`);
  }

  const archive = path.join(temporaryDirectory, packument.filename);
  execFileSync("tar", ["-xzf", archive, "-C", temporaryDirectory]);
  const packagedCli = path.join(temporaryDirectory, "package", "dist", "src", "cli.js");
  const invalid = spawnSync(process.execPath, [packagedCli, "inspect", "fixtures/sample", "--format", "yaml"], {
    encoding: "utf8",
  });
  if (invalid.status === 0 || !/--format must be json or markdown/.test(invalid.stderr) || !/Usage:/.test(invalid.stderr)) {
    throw new Error(`packed CLI did not reject an unsupported format:\n${invalid.stderr}`);
  }

  console.log(`${packageJson.name} package smoke passed with ${packument.files.length} packed file(s) and strict CLI validation.`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
